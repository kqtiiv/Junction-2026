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
    private var session: MWDATCore.DeviceSession?
    private var camera: Camera?                 // added once per session; the stream starts/stops per capture
    private var voice: VoiceInvocationsStream?
    private let tokens = ListenerTokenBag()     // listener tokens, cleared at one teardown point
    private var observers: [Task<Void, Never>] = []
    private var sessionObservers: [Task<Void, Never>] = []

    public init(flags: ExperimentalFlags, simulated: Bool = false) {
        self.flags = flags
        self.backend = simulated ? .mock : .dat
        (events, continuation) = AsyncStream.makeStream(of: GlassesEvent.self)
        selector = AutoDeviceSelector(wearables: Wearables.shared)
    }

    deinit { teardown() }

    // MARK: Configure + registration

    public func configure() async {
        do { try Wearables.configure() } catch {
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
        let tokens = self.tokens
        observers.append(Task { [selector] in
            for await id in selector.activeDeviceStream() {
                guard let id, let device = Wearables.shared.deviceForIdentifier(id) else {
                    c.yield(.availability(.none))
                    continue
                }
                switch device.compatibility() {
                case .deviceUpdateRequired:
                    c.yield(.availability(.updateRequired)); c.yield(.degraded(.deviceUpdateRequired))
                case .sdkUpdateRequired:
                    c.yield(.availability(.updateRequired)); c.yield(.degraded(.sdkUpdateRequired))
                default:
                    c.yield(.availability(.available))
                }
                // Hinges closed forces the session to `stopped` (terminal); thermal limits pause it.
                device.addDeviceStateListener { state in
                    if state.hingeState == .closed { c.yield(.degraded(.hingesClosed)) }
                    switch state.thermalLevel {
                    case .severe, .critical, .emergency, .shutdown: c.yield(.degraded(.thermal))
                    default: break
                    }
                }.store(in: tokens)
            }
        })
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
        teardownSession()
        let s: MWDATCore.DeviceSession
        do { s = try Wearables.shared.createSession(deviceSelector: selector) }
        catch { throw GlassesError.unavailable("session: \(error)") }
        session = s
        let c = continuation
        sessionObservers.append(Task { [weak self] in
            for await state in s.stateStream() {
                switch state {
                case .idle: c.yield(.session(.idle))
                case .starting: c.yield(.session(.starting))
                case .started: c.yield(.session(.started))
                case .paused: c.yield(.session(.paused))
                case .stopping: c.yield(.session(.stopping))
                case .stopped:
                    c.yield(.session(.stopped))
                    self?.teardownSession()   // a new session is needed after stop
                }
            }
        })
        sessionObservers.append(Task {
            for await error in s.errorStream() {
                switch error {
                case .thermalCritical, .thermalEmergency: c.yield(.degraded(.thermal))
                case .batteryCritical: c.yield(.degraded(.batteryLow))
                case .datAppOnTheGlassesUpdateRequired, .insufficientSDKVersion: c.yield(.degraded(.deviceUpdateRequired))
                default: break
                }
            }
        })
        if flags.voiceInvocation { await startVoiceInvocation(deviceID: s.deviceId) }   // register before start

        do { try s.start() } catch { throw GlassesError.unavailable("session start: \(error)") }
        if flags.inputs { startInputs(on: s) }
        continuation.yield(.camera(permission: await cameraPermission(), stream: .stopped))
    }

    public func stopSession() async {
        session?.stop()
        teardownSession()
    }

    // MARK: Capture: short stream → capturePhoto(.jpeg) → stop (DEC-006)

    public func captureStill() async throws -> Data {
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
        if let existing = camera { cam = existing } else {
            // Medium resolution is the assumed minimum for price labels (DEC-006 [assumption]).
            let config = StreamConfiguration(videoCodec: .raw, resolution: .medium, frameRate: 7)
            guard let added = try? session.addCamera(config: config) else { throw GlassesError.captureFailed("addCamera failed") }
            camera = added
            cam = added
        }
        let stream = cam.stream
        continuation.yield(.camera(permission: permission, stream: .starting))
        defer {
            stream.stop()
            continuation.yield(.camera(permission: permission, stream: .stopped))
        }
        stream.start()
        _ = try await first(stream.statePublisher, timeout: 8) { state in
            switch state {
            case .streaming: return true
            default: return false
            }
        }
        continuation.yield(.camera(permission: permission, stream: .streaming))

        async let photo = first(stream.photoDataPublisher, timeout: 6) { $0.format == .jpeg }
        // `false` means no photo event will follow.
        guard stream.capturePhoto(format: .jpeg) else { throw GlassesError.captureFailed("capturePhoto returned false") }
        return try await photo.data
    }

    private func cameraPermission() async -> Permission {
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
        guard let stream = try? VoiceInvocationsStream(wearables: Wearables.shared) else { return }
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
        sessionObservers.append(Task {
            for await event in inputs.events {
                let id = "dat_\(event.timestampMs)"
                switch event {
                // Note: a captouch tap also pauses an active camera stream; the backend therefore
                // refuses gesture confirmation while streaming (DEC-007).
                case .select: c.yield(.input(.tap, deviceEventID: id))
                case .capture(let press, _, _): c.yield(.input(press == .hold ? .longPress : .captureButton, deviceEventID: id))
                case .nav(let direction, _, _): c.yield(.input(direction == .left ? .swipeBack : .swipeForward, deviceEventID: id))
                case .back: c.yield(.input(.swipeBack, deviceEventID: id))
                default: break
                }
            }
        })
    }

    // MARK: Helpers

    /// First value from an SDK announcer that satisfies `match`, or a timeout.
    private func first<T: Sendable>(_ announcer: any Announcer<T>, timeout: TimeInterval,
                                    where match: @escaping @Sendable (T) -> Bool) async throws -> T {
        let once = Once<T>()
        return try await withCheckedThrowingContinuation { cont in
            once.set(cont)
            let token = announcer.listen { value in if match(value) { once.resume(.success(value)) } }
            once.onFinish { Task { await token.cancel() } }
            DispatchQueue.global().asyncAfter(deadline: .now() + timeout) {
                once.resume(.failure(GlassesError.captureFailed("timeout")))
            }
        }
    }

    // MARK: Teardown (one point)

    private func teardownSession() {
        camera?.stop()
        camera = nil
        session = nil
        sessionObservers.forEach { $0.cancel() }
        sessionObservers.removeAll()
    }

    private func teardown() {
        teardownSession()
        let voice = self.voice
        Task { @MainActor in voice?.stop() }
        tokens.clear()
        observers.forEach { $0.cancel() }
        observers.removeAll()
        continuation.finish()
    }
}

/// Resumes a continuation exactly once (listener, timeout and capture can race).
private final class Once<T>: @unchecked Sendable {
    private let lock = NSLock()
    private var cont: CheckedContinuation<T, Error>?
    private var finish: (() -> Void)?
    func set(_ c: CheckedContinuation<T, Error>) { lock.lock(); cont = c; lock.unlock() }
    func onFinish(_ f: @escaping () -> Void) { lock.lock(); finish = f; lock.unlock() }
    func resume(_ r: Result<T, Error>) {
        lock.lock(); let c = cont; let f = finish; cont = nil; finish = nil; lock.unlock()
        c?.resume(with: r)
        f?()
    }
}
#endif
