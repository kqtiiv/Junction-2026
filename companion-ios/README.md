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
| `CompanionUI` (SwiftUI, AVFoundation, Speech) | **Compiled in CI** and driven by the UI test in the simulator |
| `App/DATGlassesBridge.swift` | Written against the SDK 1.0.1 public API. **Compiled in CI** (the `Companion` target, for the simulator). Not yet built for a device or run against real glasses. |

## Run on a real iPhone with real glasses (needs a Mac)

About 30–45 minutes the first time. The Xcode project is generated from `Xcode/project.yml`, so nothing is set up by hand.

**1. Generate and open the project**

```bash
git clone https://github.com/kqtiiv/Spendtacles.git && cd Spendtacles/companion-ios/Xcode
brew install xcodegen && xcodegen generate
open Companion.xcodeproj
```

Pick the **`Companion`** scheme (real glasses). `CompanionSim` links Meta's Mock Device Kit and is for the simulator only.

**2. Signing: this decides the Team ID**

- In Xcode, open the Companion target → Signing & Capabilities → Team, and pick your Apple ID. A free account can install over USB, but the app stops opening after 7 days.
- **Whoever signs the app owns the Team ID** that goes into the Wearables Developer Center form, together with the bundle ID `dev.junction26.companion`. The SDK reads the same team from `TeamID: $(DEVELOPMENT_TEAM)`.
- If Xcode says the bundle ID is unavailable, change `PRODUCT_BUNDLE_IDENTIFIER` for `Companion` in `project.yml` and use the new one in the Developer Center too.

**3. Point the app at the backend**

`CompanionBackendURL` in `project.yml` is `http://localhost:8787`, which a phone can't reach.

- **Simplest:** run the backend on this Mac (Node 22: `cd backend && npm install && npm run dev`) and set the URL to the Mac's Wi-Fi IP, for example `http://192.168.1.20:8787`. Then run `xcodegen generate` again.
- Don't commit your LAN IP.
- Running the backend on a Windows laptop under WSL is harder: WSL only exposes its ports to that laptop unless you set up port forwarding.
- If the venue Wi-Fi blocks devices from reaching each other, put the phone on the Mac's personal hotspot.
- **For the team's money engine** instead of fixture numbers: set up `finance-engine/` on the Mac (see its README), then start the backend with `FINANCE_SOURCE=s_pankki npm run dev`.

| `project.yml` key | Value |
|---|---|
| `CompanionBackendURL` | `http://<Mac's IP>:8787` |
| `CompanionDevToken` / `CompanionUserRef` | `demo-token` / `u_7f3a` (must match the backend's `DEV_TOKENS`) |
| `CompanionLocale` | `en-FI` or `fi-FI` |
| `CompanionFlagVoiceInvocation`, `CompanionFlagInputs` | `false` until Meta approves the feature and the hour-0 device gate passes (DEC-022) |
| `META_APP_ID`, `CLIENT_TOKEN` | Leave empty: in Developer Mode the SDK skips attestation |

Already set, nothing to change: the `sbankcoach://` URL scheme that Meta AI uses to call the app back (`MWDAT` → `AppLinkURLScheme`), SDK telemetry opt-out (DEC-015), and the usage descriptions.

**4. Phone and glasses**

- **iPhone:** turn on Settings → Privacy & Security → Developer Mode. With a free account, also trust the developer under Settings → General → VPN & Device Management.
- **Glasses:** turn on Developer Mode for them in the Meta AI app.

**5. Run and check**

- Run `Companion` on the iPhone. The debug strip at the top must say **`glasses: dat`**. If it says `mock`, the real SDK isn't connected.
- CI already compiles this target for the simulator. What's new here is the device build, signing, and the first run against real glasses. Report any errors.
- Then run the hour-0 device gate (DEC-022) and write the results to `docs/demo/device-gate.md`.
- **"Hey Meta, start Spendtacles"** needs Voice Invocation approval and the spoken name configured in the Wearables Developer Center. After approval, set `CompanionFlagVoiceInvocation: true`.

## Run without glasses (and without a Mac): CI on GitHub's macOS runners

`.github/workflows/ios.yml` builds everything on a macOS runner and runs the app in the iOS Simulator with Meta's **Mock Device Kit** (simulated Ray-Ban Meta glasses inside the real DAT SDK). The UI test walks through consent → connect glasses → "does this fit my week?" → answer card → open the Purchase Receipt → **Check this receipt again** (the backend re-verifies it) → Plan it in → updated week, and uploads screenshots of each step as the `ios-screenshots` artifact.

The Xcode project is generated from `Xcode/project.yml` with XcodeGen and has two app targets:

| Target | What it is |
|---|---|
| `Companion` | The real app for a real iPhone and real glasses. Does **not** link the Mock Device Kit. |
| `CompanionSim` | Same code plus Meta's Mock Device Kit (`META_MOCK_DEVICE`). Simulated glasses switch on only in the iOS Simulator; the overlay shows `glasses: mock`. Used by the UI test. |

With a Mac: `swift scripts/make-mock-feed.swift App/Resources/demo_price_label.jpg App/Resources/demo_price_label.mp4` (the simulated camera needs an HEVC video feed), then `brew install xcodegen && cd Xcode && xcodegen generate`, open `Companion.xcodeproj`, start the backend (`cd backend && npm run dev`), and run `CompanionSim` in a simulator (iOS 26.x; a third-party wrapper reports issues with the 18.0/18.5 simulators).

## Commands

```bash
scripts/sync-contracts.sh          # after `npm run generate` in contracts/
swift test                         # unit tests (macOS or Linux)
# end-to-end, against a freshly started backend (fixture state lives in memory):
BACKEND_URL=http://localhost:8787 swift run companion-smoke
```

## Design notes

- **Look** (DEC-027): one bold element, the answer's figure on a shelf-price-tag yellow, on a quiet aisle-white ground with spruce ink; system fonts; dark mode. The decision (Plan it in / Wait / Skip) docks above the input bar in one compact row so it never covers the card, and the receipt link sits right under the price tag.
- **Purchase Receipt** (DEC-029): `ReceiptSheet` shows every line with its kind and source, the reasons for caveats or no verdict, data freshness and the proof. The coordinator keeps each card's JSON exactly as received (`TurnOutcome.rawCards`) and **Check this receipt again** sends that back to `POST /v1/receipts/verify`; re-encoding through Codable could change dates and break the signed digest.
- **Follow-ups** (DEC-030/031): the answer's `followups` become chips ("It's 19.90", "I'll wait"); before the first question, two starters show instead.

- **Mocks are never silent** (DEC-005): `MockGlassesBridge` reports `glasses_backend: mock`, and the debug overlay always shows it.
- **The user starts every capture.** A photo is only taken when the user's own words ask about "this / tämä / den här", and only in glasses mode.
- **Capture path** (DEC-006): short stream → `capturePhoto(.jpeg)` → stop; then `ImageMinimiser` rotates upright, strips all metadata (EXIF, GPS) and downscales to 1600 px before upload. The backend rejects photos that still carry EXIF.
- **Confirmation:** the phone tap always works. A glasses tap is used only with the Inputs flag on, and the backend refuses it while a camera stream is active (DEC-007). Voice confirmation needs the exact word (*confirm / vahvista / bekräfta*).
- **`VoiceIntent` encoding** sends required-but-nullable keys as explicit `null`. Swift's synthesized `Codable` would omit them, and the backend validates strictly.
- **Dates:** the backend sends milliseconds (`…07.123Z`). `ContractsCoding.decoder()` accepts them; Foundation's `.iso8601` strategy does not.
- **Finnish speech recognition:** on-device support depends on the iOS version. If it is unavailable, Apple's server is used and `asr_provider` says `asr.apple_server`. Check this on day 1 and reflect it in the privacy notice.
