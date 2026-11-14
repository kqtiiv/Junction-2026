// Meta Mock Device Kit setup: simulated Ray-Ban Meta glasses for the iOS Simulator (debug builds only).
// Exercises the real DATGlassesBridge code path without hardware. The bridge then reports
// `glasses_backend: mock`, and the debug overlay shows it (DEC-005).
//
// API from MWDATMockDevice.swiftinterface in the SDK's 1.0.1 tag.
#if DEBUG && canImport(MWDATMockDevice)
import Foundation
import MWDATMockDevice

enum MetaMockDevice {
    private static var device: (any MockGlasses)?

    /// Enables the kit and gets a pair of glasses to "worn and ready".
    /// Call before DATGlassesBridge.configure(). Registered and permissions granted by default.
    static func start(capturedImageName: String = "demo_price_label") throws {
        let kit = MockDeviceKit.shared
        kit.enable()
        let glasses = try kit.pairGlasses(model: .rayBanMeta)
        // The device appears in devicesStream() only once powered on and unfolded;
        // it must be worn before a camera stream can start.
        glasses.powerOn()
        glasses.unfold()
        glasses.don()
        // What capturePhoto(.jpeg) returns. Add a JPEG/PNG with this name to the app target.
        if let url = Bundle.main.url(forResource: capturedImageName, withExtension: "jpg")
            ?? Bundle.main.url(forResource: capturedImageName, withExtension: "png") {
            glasses.services.camera.setCapturedImage(fileURL: url)   // the in-stream photo (our capture path)
        }
        device = glasses
    }

    /// A touchpad tap (for gesture confirmation with the Inputs flag on). It also pauses an
    /// active stream, which is why the backend refuses gesture confirmation during capture.
    static func tap() { device?.services.captouch.tap() }

    static func takeOff() { device?.doff() }
    static func putOn() { device?.don() }
    static func closeHinges() { device?.fold() }   // forces session `stopped` (terminal)

    static func stop() {
        MockDeviceKit.shared.disable()
        device = nil
    }
}
#endif
