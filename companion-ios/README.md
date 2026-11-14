# iOS companion (L2)

The native companion app that owns the glasses session (ARCHITECTURE.md §2.3, L2): it tracks the glasses lifecycles, publishes `DeviceSessionState`, records consent, captures user-initiated stills, runs turns against the backend, speaks answers and renders cards.

```
companion-ios/
├── Package.swift            Swift package: everything that doesn't need the Meta SDK
├── Sources/
│   ├── Contracts/           generated contract types (scripts/sync-contracts.sh copies them)
│   ├── CompanionCore/       GlassesBridge protocol + MockGlassesBridge, DeviceStateTracker,
│   │                        OrchestratorClient (HTTP + SSE), CompanionCoordinator (turn flow),
│   │                        PlatformIntentGrammar, ImageMinimiser, ContractsCoding
│   ├── CompanionUI/         SwiftUI screens, AudioRouteManager (HFP), SpeechInput, SpeechOutput (iOS only)
│   └── CompanionSmoke/      `swift run companion-smoke`: end-to-end check against a running backend
├── Tests/CompanionCoreTests/
└── App/                     files for the Xcode app target (not part of the package)
    ├── CompanionApp.swift   @main; picks DATGlassesBridge if the SDK is linked, else the mock (shown as mock)
    └── DATGlassesBridge.swift   the only file importing DAT; SDK calls marked // VERIFY
```

## What has been verified, and what hasn't

| Part | Status |
|---|---|
| `Contracts`, `CompanionCore`, `CompanionSmoke`, tests | **Compiled and tested** with Swift 6.2.1 on Linux: 14 unit tests pass, and `companion-smoke` runs the whole demo flow against the real backend (session → consent → device state → voice turn → glasses capture → glasses-tap confirmation → updated allowance → phone-only fallback) with zero backend validation warnings |
| `CompanionUI` (SwiftUI, AVFoundation, Speech) | Syntax-checked only. **Type-check in Xcode.** |
| `App/DATGlassesBridge.swift` | Written from `docs/adr/evidence/meta-dat.md` without the SDK. **Expect signature fixes**; every SDK call is marked `// VERIFY` |

## One-time Xcode setup (Mac)

1. **New project:** Xcode → iOS App, SwiftUI, name `Companion`, minimum iOS **17.2** (DAT requirement). Delete the generated `CompanionApp.swift` and `ContentView.swift`.
2. **Add this package:** File → Add Package Dependencies → Add Local… → `companion-ios/`. Link the `CompanionCore` and `CompanionUI` products to the app target.
3. **Add the app files:** drag `App/CompanionApp.swift` and `App/DATGlassesBridge.swift` into the app target.
4. **Add the Meta DAT SDK:** File → Add Package Dependencies → `https://github.com/facebook/meta-wearables-dat-ios`, pinned to the exact version (1.0.1). Link its products. Then fix the module names in the two `#if canImport(MWDATCore)` lines and the imports in `DATGlassesBridge.swift`. **Until they match, the app silently compiles the mock path** (the overlay will say `glasses: mock`).
5. **Info.plist:**

   | Key | Value |
   |---|---|
   | `CompanionBackendURL` | e.g. `http://192.168.1.20:8787` (your laptop on the same Wi-Fi) or the deployed URL |
   | `CompanionDevToken` / `CompanionUserRef` | `demo-token` / `u_7f3a` (must match the backend's `DEV_TOKENS`) |
   | `CompanionLocale` | `fi-FI` or `en-FI` |
   | `CompanionFlagVoiceInvocation`, `CompanionFlagInputs` | Boolean, **NO** until the hour-0 device gate passes (DEC-022) |
   | `NSMicrophoneUsageDescription`, `NSSpeechRecognitionUsageDescription` | Plain-language reasons |
   | `NSAppTransportSecurity` → `NSAllowsLocalNetworking` = YES | Only while the backend runs over plain HTTP on the LAN |
   | `MWDAT` → `Analytics` → `OptOut` = YES, `MWDAT` → `CrashReporting` → `OptOut` = YES | SDK telemetry off (DEC-015) |
   | URL scheme for the Meta AI registration callback | As the DAT docs specify (VERIFY) |

6. Enable Developer Mode for the glasses in the Meta AI app, run on a real iPhone, and do the hour-0 device gate.

## Run without glasses: iOS Simulator + Meta Mock Device Kit

Meta's Mock Device Kit simulates the glasses inside the DAT SDK, so the real `DATGlassesBridge` code runs with no hardware. The SDK's own guide runs its sample this way on the iOS Simulator.

1. Do the one-time setup above, and link the SDK's **`MWDATMockDevice`** product to the app (debug only).
2. Add `App/MetaMockDevice.swift` to the app target. Optionally add a price-label photo named `demo_price_label.jpg`; it becomes what the glasses "capture" (the fixture label reader reads €79.90 whatever the image shows).
3. In Info.plist set `CompanionUseMetaMockDevice` = YES and `CompanionBackendURL` = `http://localhost:8787` (the Simulator reaches your Mac's localhost; keep `NSAllowsLocalNetworking`).
4. On the Mac: `cd backend && npm run dev`. Run the app in an iOS Simulator (iOS 26.x; a wrapper project reports issues with the 18.0/18.5 simulators).
5. Expect the overlay to show `glasses: mock · mode: glasses`. Simulated glasses use the phone's audio, so no Bluetooth route is required for them (real glasses still require one). Type or hold the mic and ask *"does this fit my week?"* to exercise the capture path.

`MetaMockDevice` also has `tap()`, `takeOff()` and `closeHinges()` for testing gesture confirmation and the phone-only fallback.

## Commands

```bash
scripts/sync-contracts.sh          # after `npm run generate` in contracts/
swift test                         # unit tests (macOS or Linux)
# end-to-end, against a freshly started backend (fixture state lives in memory):
BACKEND_URL=http://localhost:8787 swift run companion-smoke
```

## Design notes

- **Mocks are never silent** (DEC-005): `MockGlassesBridge` reports `glasses_backend: mock`, and the debug overlay always shows it.
- **The user starts every capture.** A photo is only taken when the user's own words ask about "this / tämä / den här", and only in glasses mode.
- **Capture path** (DEC-006): short stream → `capturePhoto(.jpeg)` → stop; then `ImageMinimiser` rotates upright, strips all metadata (EXIF, GPS) and downscales to 1600 px before upload. The backend rejects photos that still carry EXIF.
- **Confirmation:** the phone tap always works. A glasses tap is used only with the Inputs flag on, and the backend refuses it while a camera stream is active (DEC-007). Voice confirmation needs the exact word (*confirm / vahvista / bekräfta*).
- **`VoiceIntent` encoding** sends required-but-nullable keys as explicit `null`. Swift's synthesized `Codable` would omit them, and the backend validates strictly.
- **Dates:** the backend sends milliseconds (`…07.123Z`). `ContractsCoding.decoder()` accepts them; Foundation's `.iso8601` strategy does not.
- **Finnish speech recognition:** on-device support depends on the iOS version. If it is unavailable, Apple's server is used and `asr_provider` says `asr.apple_server`. Check this on day 1 and reflect it in the privacy notice.
