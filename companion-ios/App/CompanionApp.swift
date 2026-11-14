// App entry point. Add this folder's files to the Xcode app target (see README).
// Configuration comes from Info.plist: CompanionBackendURL, CompanionDevToken, CompanionUserRef, CompanionLocale.
// Two Xcode targets share this code: Companion (real glasses) and CompanionSim (Meta Mock Device Kit).
import SwiftUI
import Contracts
import CompanionCore
import CompanionUI

@main
struct CompanionApp: App {
    @StateObject private var model: CompanionViewModel
    private let bridge: GlassesBridge

    init() {
        let info = Bundle.main.infoDictionary ?? [:]
        let config = CompanionConfig(
            baseURL: URL(string: info["CompanionBackendURL"] as? String ?? "http://localhost:8787")!,
            token: info["CompanionDevToken"] as? String ?? "demo-token",
            userRef: info["CompanionUserRef"] as? String ?? "u_7f3a",
            locale: info["CompanionLocale"] as? String ?? "fi-FI"
        )
        // Hour-0 device gate results (DEC-022). Experimental features stay off until verified on the real glasses.
        let flags = ExperimentalFlags(
            voiceInvocation: info["CompanionFlagVoiceInvocation"] as? Bool ?? false,
            inputs: info["CompanionFlagInputs"] as? Bool ?? false
        )
        #if canImport(MWDATCore)
        // Configure the SDK first; Meta's sample enables the Mock Device Kit only afterwards.
        DATGlassesBridge.configureSDK()
        // Simulated glasses only in the CompanionSim target (META_MOCK_DEVICE) running in the
        // iOS Simulator, never on a real iPhone, where the real glasses must be exercised.
        var simulated = false
        #if META_MOCK_DEVICE && canImport(MWDATMockDevice) && targetEnvironment(simulator)
        do { try MetaMockDevice.start(); simulated = true } catch { print("⚠️ Mock Device Kit failed: \(error)") }
        #endif
        let bridge: GlassesBridge = DATGlassesBridge(flags: flags, simulated: simulated)
        #else
        // DAT SDK not linked: the mock is used and shown as `glasses: mock` in the overlay (DEC-005).
        print("⚠️ Meta DAT SDK not linked; using MockGlassesBridge")
        let bridge: GlassesBridge = MockGlassesBridge(flags: flags)
        #endif
        self.bridge = bridge
        _model = StateObject(wrappedValue: CompanionViewModel(coordinator: CompanionCoordinator(config: config, bridge: bridge)))
    }

    var body: some Scene {
        WindowGroup {
            CompanionScreen(model: model)
                // Registration completes via a URL callback from the Meta AI app.
                .onOpenURL { url in Task { _ = await bridge.handleOpenURL(url) } }
        }
    }
}
