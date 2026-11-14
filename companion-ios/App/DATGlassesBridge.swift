// DATGlassesBridge: GlassesBridge on the real Meta Wearables Device Access Toolkit.
//
// Written against the public interfaces (.swiftinterface) shipped in the SDK's 1.0.1 tag
// (MWDATCore, MWDATCamera, MWDATInputs). Patterns only, no sample code (DEC-002).
// This is the ONLY file that imports DAT (DEC-005); no SDK type leaves it.
#if canImport(MWDATCore)
import Foundation
import MWDATCore
import MWDATCamera
import MWDATInputs
import Contracts
import CompanionCore

public final class DATGlassesBridge: GlassesBridge {
    /// `.mock` when Meta's Mock Device Kit stands in for the glasses (DEC-005), else `.dat`.
    public let backend: GlassesBackend
    public let flags: ExperimentalFlags
    public let events: AsyncStream<GlassesEvent>
    private let continuation: AsyncStream<GlassesEvent>.Continuation
    private let selector: AutoDeviceSelector

    // Session state is touched from SDK callbacks, observer tasks and callers: always under `lock`.
    private let lock = NSLock()
    private var session: MWDATCore.DeviceSession?
    private var camera: Camera?                 // added once per session; the stream starts/stops per capture
    private var generation = 0                  // bumps per session, so a late teardown can't wipe a newer one
    private var sessionObservers: [Task<Void, Never>] = []
    private var deviceStateToken: (any AnyListenerToken)?
    private var observedDevice: DeviceIdentifier?

    private var voice: VoiceInvocationsStream?
    private let tokens = ListenerTokenBag()     // app-lifetime listener tokens
    private var observers: [Task<Void, Never>] = []

    public init(flags: ExperimentalFlags, simulated: Bool = false) {
        self.flags = flags
        self.backend = simulated ? .mock : .dat
        (events, continuation) = AsyncStream.makeStream(of: GlassesEvent.self)
        selector = AutoDeviceSelector(wearables: Wearables.shared)
    }

    deinit { teardown() }

    // MARK: SDK configuration (once per process, before Meta's Mock Device Kit is enabled)

    private static let configureLock = NSLock()
    private static var configured: Bool?

    /// Configures the SDK exactly once. Call early (Meta's sample does it in App.init);
    /// the Mock Device Kit must only be enabled after this succeeds.
    @discardableResult
    public static func configureSDK() -> Bool {
        configureLock.lock(); defer { configureLock.unlock() }
        if let done = configured { return done }
        do { try Wearables.configure(); configured = true } catch { configured = false }
        return configured!
    }

    // MARK: Configure + registration

    public func configure() async {
        guard Self.configureSDK() else {
            continuation.yield(.registration(.unavailable))
            continuation.yield(.degraded(.metaAIAppMissing))
            return
        }
        let c = continuation
        observers.append(Task {
            for await state in Wearables.shared.registrationStateStream() {
                switch state {
                case .registered: c.yield(.registration(.registered))
                case .registering: c.yield(.registration(.registering))
                case .available: c.yield(.registration(.notRegistered))   // "available to register"
                case .unavailable: c.yield(.registration(.unavailable))
                @unknown default: c.yield(.registration(.unavailable))
                }
            }
        })
        observers.append(Task { [weak self, selector] in
            for await id in selector.activeDeviceStream() {
                self?.observeDevice(id)
            }
        })
    }

    /// One device-state listener per active device: replaced when the device changes,
    /// skipped when the selector re-emits the same device.
    private func observeDevice(_ id: DeviceIdentifier?) {
        let c = continuation
        guard let id, let device = Wearables.shared.deviceForIdentifier(id) else {
            let old = swapDeviceToken(nil, device: nil)
            Task { await old?.cancel() }
            c.yield(.availability(.none))
            return
        }
        switch device.compatibility() {
        case .deviceUpdateRequired: c.yield(.availability(.updateRequired)); c.yield(.degraded(.deviceUpdateRequired))
        case .sdkUpdateRequired: c.yield(.availability(.updateRequired)); c.yield(.degraded(.sdkUpdateRequired))
        default: c.yield(.availability(.available))
        }
        let same = lock.withLock { observedDevice == id && deviceStateToken != nil }
        if same { return }
        // Hinges closed forces the session to `stopped` (terminal); thermal limits pause it.
        let token = device.addDeviceStateListener { state in
            if state.hingeState == .closed { c.yield(.degraded(.hingesClosed)) }
            switch state.thermalLevel {
            case .severe, .critical, .emergency, .shutdown: c.yield(.degraded(.thermal))
            default: break
            }
        }
        let old = swapDeviceToken(token, device: id)
        Task { await old?.cancel() }
    }

    private func swapDeviceToken(_ token: (any AnyListenerToken)?, device: DeviceIdentifier?) -> (any AnyListenerToken)? {
        lock.lock(); defer { lock.unlock() }
        let old = deviceStateToken
        deviceStateToken = token
        observedDevice = device
        return old
    }

    public func startRegistration() async throws {
        do { try await Wearables.shared.startRegistration() }   // hands off to the Meta AI app
        catch { throw GlassesError.unavailable("registration: \(error)") }
    }

    public func handleOpenURL(_ url: URL) async -> Bool {
        guard url.absoluteString.contains("metaWearablesAction") else { return false }
        return (try? await Wearables.shared.handleUrl(url)) ?? false
    }

    // MARK: Device session (subscribe before start; `stopped` is terminal)

    public func startSession() async throws {
        teardownSession(ifGeneration: nil)
        let s: MWDATCore.DeviceSession
        do { s = try Wearables.shared.createSession(deviceSelector: selector) }
        catch { throw GlassesError.unavailable("session: \(error)") }

        let gen: Int = lock.withLock {
            generation += 1
            session = s
            return generation
        }

        let c = continuation
        let stateObserver = Task { [weak self] in
            for await state in s.stateStream() {
                switch state {
                case .idle: c.yield(.session(.idle))
                case .starting: c.yield(.session(.starting))
                case .started: c.yield(.session(.started))
                case .paused: c.yield(.session(.paused))
                case .stopping: c.yield(.session(.stopping))
                case .stopped:
                    c.yield(.session(.stopped))
                    self?.teardownSession(ifGeneration: gen)   // a new session is needed after stop
                }
            }
        }
        let errorObserver = Task {
            for await error in s.errorStream() {
                switch error {
                case .thermalCritical, .thermalEmergency: c.yield(.degraded(.thermal))
                case .batteryCritical: c.yield(.degraded(.batteryLow))
                case .datAppOnTheGlassesUpdateRequired, .insufficientSDKVersion: c.yield(.degraded(.deviceUpdateRequired))
                default: break
                }
            }
        }
        lock.withLock { sessionObservers += [stateObserver, errorObserver] }

        if flags.voiceInvocation { await startVoiceInvocation(deviceID: s.deviceId) }   // register before start
        do { try s.start() } catch { throw GlassesError.unavailable("session start: \(error)") }
        if flags.inputs { startInputs(on: s) }
        continuation.yield(.camera(permission: await cameraPermission(), stream: .stopped))
    }

    public func stopSession() async {
        let (s, gen) = lock.withLock { (session, generation) }
        s?.stop()
        // Report `stopped` ourselves: the state observer is cancelled by teardown and may miss it.
        continuation.yield(.session(.stopped))
        teardownSession(ifGeneration: gen)
    }

    // MARK: Capture: short stream → capturePhoto(.jpeg) → stop (DEC-006)

    public func captureStill() async throws -> Data {
        let (session, existing) = lock.withLock { (self.session, camera) }
        guard let session else { throw GlassesError.unavailable("no session") }

        var permission = await cameraPermission()
        if permission == .denied || permission == .unknown {
            // Granted in the Meta AI app, not an OS dialog; the UI should tell the user first.
            if (try? await Wearables.shared.requestPermission(.camera)) == .granted { permission = .grantedOnce }
        }
        guard permission == .grantedOnce || permission == .grantedAlways else {
            continuation.yield(.camera(permission: .denied, stream: .stopped))
            throw GlassesError.permissionDenied
        }

        let cam: Camera
        if let existing { cam = existing } else {
            // Medium resolution is the assumed minimum for price labels (DEC-006 [assumption]).
            let config = StreamConfiguration(videoCodec: .raw, resolution: .medium, frameRate: 7)
            guard let added = try? session.addCamera(config: config) else { throw GlassesError.captureFailed("addCamera failed") }
            lock.withLock { camera = added }
            cam = added
        }
        let stream = cam.stream
        continuation.yield(.camera(permission: permission, stream: .starting))
        defer {
            stream.stop()
            continuation.yield(.camera(permission: permission, stream: .stopped))
        }

        // Subscribe BEFORE starting. Fail fast if the stream stops or pauses after it began
        // (e.g. a touchpad tap pauses it) instead of waiting for the timeout.
        let began = Flag()
        let lastError = Box<String>()
        let errorToken = stream.errorPublisher.listen { error in lastError.set("\(error)") }
        defer { Task { await errorToken.cancel() } }
        let streaming = Waiter(stream.statePublisher) { (state: StreamState) -> Waiter<StreamState>.Decision in
            switch state {
            case .streaming: return .accept(state)
            case .starting, .waitingForDevice: began.set(); return .wait
            case .stopped, .stopping, .paused:
                guard began.isSet else { return .wait }
                let reason = lastError.get().map { "\(state), error: \($0)" } ?? "\(state)"
                return .fail(GlassesError.captureFailed("stream \(reason)"))
            }
        }
        stream.start()
        _ = try await streaming.value(timeout: 8)
        continuation.yield(.camera(permission: permission, stream: .streaming))

        let photo = Waiter(stream.photoDataPublisher) { (p: PhotoData) -> Waiter<PhotoData>.Decision in
            p.format == .jpeg ? .accept(p) : .wait
        }
        // `false` means no photo event will follow: fail at once, don't wait for the timeout.
        guard stream.capturePhoto(format: .jpeg) else {
            photo.cancel()
            throw GlassesError.captureFailed("capturePhoto returned false")
        }
        return try await photo.value(timeout: 6).data
    }

    private func cameraPermission() async -> Contracts.Permission {
        // The SDK reports only granted/denied; "once vs always" is not exposed.
        switch try? await Wearables.shared.checkPermissionStatus(.camera) {
        case .granted?: return .grantedOnce
        case .denied?: return .denied
        default: return .unknown
        }
    }

    // MARK: Experimental: voice invocation (launch only, no utterance; DEC-021) and Inputs

    @MainActor
    private func startVoiceInvocation(deviceID: DeviceIdentifier) {
        guard voice == nil, let stream = try? VoiceInvocationsStream(wearables: Wearables.shared) else { return }
        let c = continuation
        stream.invocationsPublisher.listen { invocation in
            guard let launch = invocation as? LaunchApp else { return }
            Task { _ = await launch.responseHandle.sendSuccess(actionOutput: nil) }   // acknowledge exactly once
            c.yield(.launchApp)
        }.store(in: tokens)
        try? stream.start(deviceIdentifier: deviceID)
        voice = stream
    }

    private func startInputs(on s: MWDATCore.DeviceSession) {
        guard let inputs = try? s.addInputs() else { return }
        let c = continuation
        let task = Task {
            for await event in inputs.events {
                let id = "dat_\(event.timestampMs)"
                switch event {
                // A captouch tap also pauses an active camera stream; the backend therefore
                // refuses gesture confirmation while streaming (DEC-007).
                case .select: c.yield(.input(.tap, deviceEventID: id))
                case .capture(let press, _, _): c.yield(.input(press == .hold ? .longPress : .captureButton, deviceEventID: id))
                case .nav(let direction, _, _): c.yield(.input(direction == .left ? .swipeBack : .swipeForward, deviceEventID: id))
                case .back: c.yield(.input(.swipeBack, deviceEventID: id))
                default: break
                }
            }
        }
        lock.withLock { sessionObservers.append(task) }
    }

    // MARK: Teardown (one point)

    /// Tears the session down under the lock. With a generation, only if it is still the
    /// current session (a late `.stopped` from an old session must not wipe a new one).
    private func teardownSession(ifGeneration gen: Int?) {
        lock.lock()
        if let gen, gen != generation { lock.unlock(); return }
        let cam = camera, observers = sessionObservers
        camera = nil
        session = nil
        sessionObservers = []
        lock.unlock()
        cam?.stop()
        observers.forEach { $0.cancel() }
    }

    private func teardown() {
        teardownSession(ifGeneration: nil)
        let voice = self.voice
        Task { @MainActor in voice?.stop() }
        let old = swapDeviceToken(nil, device: nil)
        Task { await old?.cancel() }
        tokens.clear()
        observers.forEach { $0.cancel() }
        observers.removeAll()
        continuation.finish()
    }
}

// MARK: - Helpers

/// Waits for the first announcer value the decision accepts (or rejects). Subscribes in init,
/// so create it BEFORE starting whatever produces the values. Resolves exactly once; the
/// listener token is always cancelled, even if the listener fires synchronously in `listen`.
final class Waiter<T: Sendable>: @unchecked Sendable {
    enum Decision { case wait, accept(T), fail(Error) }

    private let lock = NSLock()
    private var done = false
    private var result: Result<T, Error>?
    private var continuation: CheckedContinuation<T, Error>?
    private var token: (any AnyListenerToken)?

    init(_ announcer: any Announcer<T>, decide: @escaping @Sendable (T) -> Decision) {
        let t = announcer.listen { [weak self] value in
            switch decide(value) {
            case .wait: break
            case .accept(let v): self?.resolve(.success(v))
            case .fail(let e): self?.resolve(.failure(e))
            }
        }
        lock.lock()
        let alreadyDone = done
        if !alreadyDone { token = t }
        lock.unlock()
        if alreadyDone { Task { await t.cancel() } }
    }

    func value(timeout: TimeInterval) async throws -> T {
        try await withCheckedThrowingContinuation { c in
            lock.lock()
            if let r = result { lock.unlock(); c.resume(with: r); return }
            continuation = c
            lock.unlock()
            DispatchQueue.global().asyncAfter(deadline: .now() + timeout) { [weak self] in
                self?.resolve(.failure(GlassesError.captureFailed("timeout")))
            }
        }
    }

    func cancel() { resolve(.failure(CancellationError())) }

    private func resolve(_ r: Result<T, Error>) {
        lock.lock()
        guard !done else { lock.unlock(); return }
        done = true
        let c = continuation, t = token
        continuation = nil
        token = nil
        if c == nil { result = r }
        lock.unlock()
        c?.resume(with: r)
        if let t { Task { await t.cancel() } }
    }
}

/// A thread-safe holder for the last value seen by a @Sendable listener.
final class Box<T>: @unchecked Sendable {
    private let lock = NSLock()
    private var value: T?
    func set(_ v: T) { lock.withLock { value = v } }
    func get() -> T? { lock.withLock { value } }
}

/// A thread-safe one-way flag for use inside @Sendable listener closures.
final class Flag: @unchecked Sendable {
    private let lock = NSLock()
    private var value = false
    func set() { lock.lock(); value = true; lock.unlock() }
    var isSet: Bool { lock.lock(); defer { lock.unlock() }; return value }
}
#endif
