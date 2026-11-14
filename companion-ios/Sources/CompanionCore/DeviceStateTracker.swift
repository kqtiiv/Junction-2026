// Tracks the four lifecycles separately (registration, device session, camera,
// interaction) and produces `DeviceSessionState` snapshots with a monotonic seq (DEC-005).
// Snapshots always satisfy the schema's rules, so the backend never has to reject one:
//   - phone_only carries at least one degraded reason;
//   - glasses mode needs registration, a dat/mock backend and a live session;
//   - a stream exists only inside a started session;
//   - capture_pending needs glasses mode, camera permission and an active stream.
import Foundation
import Contracts

public final class DeviceStateTracker {
    public let sessionID: String
    public let backend: GlassesBackend
    public let deviceCapabilities: [DeviceCapability]
    public let experimentalFeatures: [ExperimentalFeature]

    public private(set) var seq = 0
    public var registration: Registration = .notRegistered
    public var availability: DeviceAvailability = .none
    public var session: DeviceSession = .idle
    public var cameraPermission: Permission = .unknown
    public var stream: Contracts.Stream = .stopped
    public var audioRoute: AudioRoute = .phone
    public var interaction: Interaction = .idle
    public var userChosePhone = false
    public var appBackgrounded = false
    public var micPermissionDenied = false
    /// False until the bridge has reported a registration state (the default above is a placeholder).
    public private(set) var registrationReported = false
    private var pausedSince: Date?
    private var sticky: Set<DegradedReason> = []
    /// Glasses events arrive on another task than UI changes; serialise state and seq.
    private let lock = NSLock()

    /// A device-driven pause longer than this drops to phone_only (ARCHITECTURE.md §2.4).
    public static let pauseLimit: TimeInterval = 30

    public init(sessionID: String, bridge: GlassesBridge) {
        self.sessionID = sessionID
        self.backend = bridge.backend
        self.deviceCapabilities = bridge.deviceCapabilities
        self.experimentalFeatures = bridge.experimentalFeatures
    }

    /// Applies a bridge event. Returns true if anything changed (publish a new snapshot).
    @discardableResult
    public func apply(_ event: GlassesEvent, now: Date = Date()) -> Bool {
        lock.lock(); defer { lock.unlock() }
        switch event {
        case .registration(let r): registration = r; registrationReported = true
        case .availability(let a): availability = a
        case .session(let s):
            if s == .paused, session != .paused { pausedSince = now }
            if s != .paused { pausedSince = nil }
            // A new session clears reasons that belonged to the old one.
            if s == .starting { sticky.removeAll() }
            session = s
            if s != .started { stream = .stopped }
        case .camera(let permission, let st):
            cameraPermission = permission
            stream = st
        case .degraded(let reason): sticky.insert(reason)
        case .launchApp, .input: return false
        }
        return true
    }

    /// Changes UI-owned state (interaction, audio route, user choice) under the lock.
    public func mutate(_ body: (DeviceStateTracker) -> Void) {
        lock.lock(); defer { lock.unlock() }
        body(self)
    }

    /// The registration the bridge last reported, or nil if it hasn't reported one yet.
    public func reportedRegistration() -> Registration? {
        lock.lock(); defer { lock.unlock() }
        return registrationReported ? registration : nil
    }

    /// Current mode without producing a snapshot (no seq increment).
    public func currentMode(now: Date = Date()) -> Mode {
        lock.lock(); defer { lock.unlock() }
        return reasons(now: now).isEmpty ? .glasses : .phoneOnly
    }

    /// Why the glasses are not usable right now; empty means glasses mode.
    public func degradedReasons(now: Date = Date()) -> [DegradedReason] {
        lock.lock(); defer { lock.unlock() }
        return reasons(now: now)
    }

    private func reasons(now: Date) -> [DegradedReason] {
        var r = sticky
        if backend == .none { r.insert(.noDevice) }
        switch registration {
        case .registered: break
        case .unavailable: r.insert(.metaAIAppMissing)
        case .notRegistered, .registering: r.insert(.notRegistered)
        }
        switch availability {
        case .available: break
        case .none: r.insert(.noDevice)
        case .updateRequired: r.insert(.deviceUpdateRequired)
        }
        if session == .stopped || session == .stopping || session == .idle { r.insert(.sessionStopped) }
        // DAT gives no reason for a pause; a long one is most often the glasses taken off.
        if let since = pausedSince, now.timeIntervalSince(since) > Self.pauseLimit { r.insert(.doffed) }
        // Real glasses need the Bluetooth route; simulated glasses (Meta Mock Device Kit or our mock)
        // have none, so they use the phone's audio. glasses_backend already says `mock`.
        if backend == .dat && (audioRoute == .none || audioRoute == .phone) { r.insert(.bluetoothRouteUnavailable) }
        if cameraPermission == .denied { r.insert(.cameraPermissionDenied) }
        if micPermissionDenied { r.insert(.micPermissionDenied) }
        if userChosePhone { r.insert(.userChosePhone) }
        if appBackgrounded { r.insert(.appBackgrounded) }
        return r.sorted { $0.rawValue < $1.rawValue }
    }

    public func snapshot(now: Date = Date()) -> DeviceSessionState {
        lock.lock(); defer { lock.unlock() }
        seq += 1
        let reasons = reasons(now: now)
        let mode: Mode = reasons.isEmpty ? .glasses : .phoneOnly
        let liveStream: Contracts.Stream = session == .started ? stream : .stopped
        let canCapture = mode == .glasses && liveStream == .streaming
            && (cameraPermission == .grantedOnce || cameraPermission == .grantedAlways)
        let reportedInteraction: Interaction = (interaction == .capturePending && !canCapture) ? .processing : interaction
        return DeviceSessionState(
            audioRoute: audioRoute,
            camera: CameraState(permission: cameraPermission, stream: liveStream),
            degradedReasons: reasons,
            deviceAvailability: availability,
            deviceCapabilities: deviceCapabilities,
            deviceSession: session,
            experimentalFeatures: experimentalFeatures,
            glassesBackend: backend,
            interaction: reportedInteraction,
            mode: mode,
            observedAt: now,
            registration: registration,
            schema: .platformDeviceSessionStateV1,
            seq: seq,
            sessionID: sessionID
        )
    }
}
