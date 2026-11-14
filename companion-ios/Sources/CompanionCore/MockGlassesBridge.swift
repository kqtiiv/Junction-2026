// A simulated pair of glasses for development, tests and the phone-only demo path.
// It always reports `glasses_backend: mock` (DEC-005): a mock never stands in silently.
import Foundation
import Contracts

public final class MockGlassesBridge: GlassesBridge {
    public let backend: GlassesBackend = .mock
    public var flags: ExperimentalFlags
    public let events: AsyncStream<GlassesEvent>
    private let continuation: AsyncStream<GlassesEvent>.Continuation
    private let photo: Data
    private var sessionStarted = false

    /// - Parameter photo: what `captureStill()` returns. Defaults to a tiny, EXIF-free JPEG header.
    public init(flags: ExperimentalFlags = ExperimentalFlags(), photo: Data = MockGlassesBridge.sampleJPEG()) {
        self.flags = flags
        self.photo = photo
        (events, continuation) = AsyncStream.makeStream(of: GlassesEvent.self)
    }

    public func configure() async {
        continuation.yield(.registration(.notRegistered))
        continuation.yield(.availability(.available))
    }

    public func startRegistration() async throws {
        continuation.yield(.registration(.registering))
        continuation.yield(.registration(.registered))
    }

    public func handleOpenURL(_ url: URL) async -> Bool { false }

    public func startSession() async throws {
        continuation.yield(.session(.starting))
        continuation.yield(.session(.started))
        continuation.yield(.camera(permission: .grantedAlways, stream: .stopped))
        sessionStarted = true
    }

    public func stopSession() async {
        continuation.yield(.session(.stopping))
        continuation.yield(.session(.stopped))
        sessionStarted = false
    }

    public func captureStill() async throws -> Data {
        guard sessionStarted else { throw GlassesError.unavailable("no active session") }
        continuation.yield(.camera(permission: .grantedAlways, stream: .starting))
        continuation.yield(.camera(permission: .grantedAlways, stream: .streaming))
        defer { continuation.yield(.camera(permission: .grantedAlways, stream: .stopped)) }
        return photo
    }

    // MARK: Simulation hooks

    public func simulateHingesClosed() {
        continuation.yield(.degraded(.hingesClosed))
        continuation.yield(.session(.stopped))
        sessionStarted = false
    }

    public func simulateTap(id: String = "mock_tap") {
        continuation.yield(.input(.tap, deviceEventID: id))
    }

    public func simulateLaunchApp() {
        continuation.yield(.launchApp)
    }

    /// SOI, JFIF APP0, SOF0 (1600×1200), EOI. Enough for the backend's image inspection;
    /// the fixture label reader ignores pixel content.
    public static func sampleJPEG(width: Int = 1600, height: Int = 1200) -> Data {
        func segment(_ marker: UInt8, _ body: [UInt8]) -> [UInt8] {
            let len = body.count + 2
            return [0xFF, marker, UInt8(len >> 8), UInt8(len & 0xFF)] + body
        }
        let app0 = segment(0xE0, Array("JFIF".utf8) + [0, 1, 1, 0, 0, 1, 0, 1, 0, 0])
        let sof = segment(0xC0, [8, UInt8(height >> 8), UInt8(height & 0xFF), UInt8(width >> 8), UInt8(width & 0xFF),
                                 3, 1, 0x11, 0, 2, 0x11, 1, 3, 0x11, 1])
        return Data([0xFF, 0xD8] + app0 + sof + [0xFF, 0xD9])
    }
}
