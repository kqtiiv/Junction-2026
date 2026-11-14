// DATGlassesBridge: GlassesBridge on the real Meta Wearables Device Access Toolkit.
//
// Written from docs/adr/evidence/meta-dat.md (SDK 1.0.1, sample @ bbae597c) WITHOUT the SDK
// at hand: every SDK call is marked `// VERIFY` and will likely need small signature fixes in
// Xcode. Patterns only, no sample code (DEC-002). This is the ONLY file that imports DAT (DEC-005).
//
// Hour-0 checklist (DEC-022):
//   1. Module names in the imports below.
//   2. Registration state / device / session / stream observation APIs (async stream vs publisher).
//   3. CameraConfig initialiser and resolution/fps names.
//   4. Voice invocation and Inputs APIs (experimental): leave flags off if they don't work.
#if canImport(MWDATCore) // VERIFY module name
import Foundation
import Combine
import MWDATCore      // VERIFY
import MWDATCamera    // VERIFY: camera/stream types may live in a separate module
import Contracts
import CompanionCore

public final class DATGlassesBridge: GlassesBridge {
    public let backend: GlassesBackend = .dat
    public let flags: ExperimentalFlags
    public let events: AsyncStream<GlassesEvent>
    private let continuation: AsyncStream<GlassesEvent>.Continuation

    private var session: DeviceSession?        // VERIFY: SDK session type name (collides with Contracts.DeviceSession enum)
    private var camera: Camera?                // VERIFY
    private var bag = Set<AnyCancellable>()    // listener tokens, cleared in one teardown point
    private var observers: [Task<Void, Never>] = []

    public init(flags: ExperimentalFlags) {
        self.flags = flags
        (events, continuation) = AsyncStream.makeStream(of: GlassesEvent.self)
    }

    deinit { teardown() }

    // MARK: Configure + registration

    public func configure() async {
        do { try Wearables.configure() } catch {                     // VERIFY: throws?
            continuation.yield(.registration(.unavailable))
            return
        }
        // Registration: .available (= can register) / .registering / .registered / .unavailable.
        observers.append(Task { [continuation] in
            for await state in Wearables.shared.registrationStateStream() {   // VERIFY: stream or publisher
                switch state {
                case .registered: continuation.yield(.registration(.registered))
                case .registering: continuation.yield(.registration(.registering))
                case .available: continuation.yield(.registration(.notRegistered))
                default: continuation.yield(.registration(.unavailable))
                }
            }
        })
        // Device availability: no active device → none; update required → update_required.
        observers.append(Task { [continuation] in
            for await device in AutoDeviceSelector(wearables: Wearables.shared).activeDeviceStream() {   // VERIFY
                guard let device else { continuation.yield(.availability(.none)); continue }
                if (try? await device.compatibility()) == .deviceUpdateRequired {                       // VERIFY
                    continuation.yield(.availability(.updateRequired))
                    continuation.yield(.degraded(.deviceUpdateRequired))
                } else {
                    continuation.yield(.availability(.available))
                }
            }
        })
        if flags.voiceInvocation { registerVoiceInvocation() }
    }

    public func startRegistration() async throws {
        do { try await Wearables.shared.startRegistration() }           // VERIFY: hands off to the Meta AI app
        catch { throw GlassesError.unavailable("registration: \(error)") }
    }

    public func handleOpenURL(_ url: URL) async -> Bool {
        // The Meta AI app calls back with a URL carrying `metaWearablesAction`.
        guard url.absoluteString.contains("metaWearablesAction") else { return false }
        do { try await Wearables.shared.handleUrl(url); return true }  // VERIFY
        catch { return false }
    }

    // MARK: Device session (subscribe before start; `stopped` is terminal)

    public func startSession() async throws {
        teardownSession()
        let selector = AutoDeviceSelector(wearables: Wearables.shared)   // VERIFY
        let s = try Wearables.shared.createSession(deviceSelector: selector)   // VERIFY
        session = s
        observers.append(Task { [weak self, continuation] in
            for await state in s.stateStream() {                         // VERIFY: idle/starting/started/paused/stopping/stopped
                switch state {
                case .idle: continuation.yield(.session(.idle))
                case .starting: continuation.yield(.session(.starting))
                case .started: continuation.yield(.session(.started))
                case .paused: continuation.yield(.session(.paused))
                case .stopping: continuation.yield(.session(.stopping))
                case .stopped:
                    continuation.yield(.session(.stopped))
                    self?.teardownSession()                              // a new session is needed after stop
                default: break
                }
            }
        })
        try await s.start()                                              // VERIFY
        continuation.yield(.camera(permission: await cameraPermission(), stream: .stopped))
    }

    public func stopSession() async {
        await session?.stop()                                            // VERIFY
        teardownSession()
    }

    // MARK: Capture: short stream → capturePhoto(.jpeg) → stop (DEC-006)

    public func captureStill() async throws -> Data {
        guard let session else { throw GlassesError.unavailable("no session") }
        let permission = await cameraPermission()
        guard permission == .grantedOnce || permission == .grantedAlways else {
            continuation.yield(.camera(permission: permission, stream: .stopped))
            throw GlassesError.permissionDenied
        }
        // Medium resolution is the assumed minimum for price labels (DEC-006 [assumption]).
        let cam = try session.addCamera(config: CameraConfig(resolution: .medium, frameRate: 7))   // VERIFY
        camera = cam
        continuation.yield(.camera(permission: permission, stream: .starting))
        defer {
            cam.stop()                                                   // explicit: teardown only cascades parent→child
            camera = nil
            continuation.yield(.camera(permission: permission, stream: .stopped))
        }
        try await cam.start()                                            // VERIFY
        try await waitUntilStreaming(cam)
        continuation.yield(.camera(permission: permission, stream: .streaming))

        return try await withCheckedThrowingContinuation { (cont: CheckedContinuation<Data, Error>) in
            var resumed = false
            let resume: (Result<Data, Error>) -> Void = { r in if !resumed { resumed = true; cont.resume(with: r) } }
            cam.stream.photoDataPublisher                                // VERIFY
                .first()
                .sink { data in resume(.success(data)) }
                .store(in: &bag)
            // `false` means no photo event will follow.
            if !cam.stream.capturePhoto(format: .jpeg) {                 // VERIFY
                resume(.failure(GlassesError.captureFailed("capturePhoto returned false")))
            }
            DispatchQueue.main.asyncAfter(deadline: .now() + 5) { resume(.failure(GlassesError.captureFailed("timeout"))) }
        }
    }

    private func waitUntilStreaming(_ cam: Camera) async throws {
        for await state in cam.stream.stateStream() {                    // VERIFY: StreamState incl. waitingForDevice
            switch state {
            case .streaming: return
            case .stopped, .failed: throw GlassesError.captureFailed("stream \(state)")   // VERIFY case names
            default: continue
            }
        }
        throw GlassesError.captureFailed("stream ended")
    }

    private func cameraPermission() async -> Permission {
        // Camera permission is granted in the Meta AI app (once or always), not by an OS dialog.
        switch try? await Wearables.shared.checkPermissionStatus(.camera) {   // VERIFY
        case .grantedAlways?: return .grantedAlways
        case .grantedOnce?: return .grantedOnce
        case .denied?: return .denied
        default: return .unknown
        }
    }

    // MARK: Experimental: voice invocation (launch only, no utterance; DEC-021)

    private func registerVoiceInvocation() {
        observers.append(Task { [continuation] in
            for await action in Wearables.shared.launchAppActions() {    // VERIFY: register before session start
                action.responseHandle.sendSuccess(actionOutput: nil)     // acknowledge each LaunchApp exactly once
                continuation.yield(.launchApp)
            }
        })
        // VERIFY + TODO(hour 0): glasses Inputs (taps) for gesture confirmation, if flags.inputs.
        // Map SDK input events to `.input(.tap, deviceEventID:)`. Note: a tap also pauses an active
        // stream, so the backend refuses gesture confirmation during capture (DEC-007).
    }

    // MARK: Teardown (one point)

    private func teardownSession() {
        camera?.stop()
        camera = nil
        session = nil
        bag.removeAll()
    }

    private func teardown() {
        teardownSession()
        observers.forEach { $0.cancel() }
        observers.removeAll()
        continuation.finish()
    }
}
#endif
