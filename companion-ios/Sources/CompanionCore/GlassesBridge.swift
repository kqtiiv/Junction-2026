// GlassesBridge: the only seam between the companion and the Meta DAT SDK (DEC-005).
// Implementations map SDK types onto these platform values; nothing above this protocol
// ever sees an SDK type. DATGlassesBridge lives in the app target (it needs the SDK);
// MockGlassesBridge lives here and always reports itself as `mock`.
import Foundation
import Contracts

public enum GlassesEvent: Equatable {
    case registration(Registration)
    case availability(DeviceAvailability)
    case session(DeviceSession)
    case camera(permission: Permission, stream: Contracts.Stream)
    /// "Hey Meta, start ‹app›" (experimental). Carries no utterance (DEC-021).
    case launchApp
    /// A glasses touchpad/capture input (experimental "Inputs").
    case input(GlassesInputKind, deviceEventID: String)
    /// The session or stream ended for a reason the companion must surface.
    case degraded(DegradedReason)
    /// A transient condition cleared (e.g. the glasses cooled down).
    case recovered(DegradedReason)
}

public enum GlassesError: Error, Equatable {
    case notRegistered
    case noDevice
    case permissionDenied
    case captureFailed(String)
    case unavailable(String)
}

/// What the hour-0 device gate decided (DEC-022). Experimental features stay off unless verified.
public struct ExperimentalFlags: Equatable {
    public var voiceInvocation = false
    public var inputs = false
    public init(voiceInvocation: Bool = false, inputs: Bool = false) {
        self.voiceInvocation = voiceInvocation
        self.inputs = inputs
    }
}

public protocol GlassesBridge: AnyObject {
    /// `dat` for the real SDK, `mock` for the simulator; never silently swapped.
    var backend: GlassesBackend { get }
    var flags: ExperimentalFlags { get }
    /// Lifecycle events. Subscribe before calling `startSession()`.
    var events: AsyncStream<GlassesEvent> { get }

    func configure() async
    /// Hands off to the Meta AI app; completes via a URL callback the app forwards.
    func startRegistration() async throws
    func handleOpenURL(_ url: URL) async -> Bool
    func startSession() async throws
    func stopSession() async
    /// Starts a short camera stream, captures one JPEG still, stops the stream (DEC-006).
    /// Returns the raw photo; minimisation happens afterwards in `ImageMinimiser`.
    func captureStill() async throws -> Data
}

public extension GlassesBridge {
    /// What this build can do with the glasses right now, for `device_capabilities`.
    var deviceCapabilities: [DeviceCapability] {
        var caps: [DeviceCapability] = [.cameraStream, .photoCapture]
        if flags.voiceInvocation { caps.append(.voiceInvocation) }
        if flags.inputs { caps.append(.inputs) }
        return caps
    }

    /// Experimental SDK features in use, which must be declared (DEC-004).
    var experimentalFeatures: [ExperimentalFeature] {
        var f: [ExperimentalFeature] = []
        if flags.voiceInvocation { f.append(.voiceInvocation) }
        if flags.inputs { f.append(.inputs) }
        return f
    }
}
