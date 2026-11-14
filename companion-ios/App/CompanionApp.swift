// App entry point. Add this folder's files to the Xcode app target (see README).
// Configuration comes from Info.plist: CompanionBackendURL, CompanionDevToken, CompanionUserRef, CompanionLocale.
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
        #if canImport(MWDATCore) // VERIFY: the DAT SDK's Swift module name
        let bridge: GlassesBridge = DATGlassesBridge(flags: flags)
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
