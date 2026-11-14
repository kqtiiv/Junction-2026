# Evidence: Meta Wearables Device Access Toolkit (official)

**Sources:**
- S01: `facebook/meta-wearables-dat-ios` @ `bbae597c` (SDK 1.0.1)
- S02: `facebook/meta-wearables-dat-android` @ `f4371bc9`
- S03: the CHANGELOG
- S04–S09: official docs, FAQ, blogs, Developer Terms

Accessed 2026-11-14.

iOS paths are relative to `samples/CameraAccess/CameraAccess/` unless noted.

## Licence and reuse
- **No open-source licence.** `LICENSE` is four lines pointing to the Meta Wearables Developer Terms and Acceptable Use Policy (S08). Sample headers say "licensed under the license found in the LICENSE file".
- **The SDK is closed binaries:** a Swift Package pinned by `exactVersion` (`project.pbxproj:777`) and Maven `com.meta.wearable:mwdat-*:1.0.1`.
- **Terms:**
  - §2.1: limited, revocable, non-sublicensable licence.
  - §2.2: no derivative works "other than to modify and use sample apps or sample source code expressly authorized", and no redistribution under OSS terms.
  - §2.8: no experimental features in production without written permission.
  - §5: no surveillance, no selling Technology Data.
  - §6: a privacy policy is required.
- **Telemetry:** the SDK has analytics and crash reporting **on by default**.
  - iOS opt-out: `Info.plist` `MWDAT > Analytics > OptOut` and `MWDAT > CrashReporting > OptOut`.
  - Android: `com.meta.wearable.mwdat.CRASH_REPORTING_OPT_OUT`.
  - → DEC-015.

## Lifecycle (verified in code)
| Stage | API / states | Citation |
|---|---|---|
| Configure | `Wearables.configure()` at launch. Android calls `Wearables.initialize(context)` only after BLUETOOTH, BLUETOOTH_CONNECT and INTERNET are granted. | `CameraAccessApp.swift:38-44`; Android `MainActivity.kt:59-71` |
| Registration | `startRegistration()` → Meta AI app → URL callback filtered on `metaWearablesAction` → `Wearables.shared.handleUrl`. `RegistrationState`: `.available/.registering/.registered/.unavailable`. `RegistrationError` incl. `.metaAINotInstalled`, `.configurationInvalid`, `.networkUnavailable`. | `WearablesViewModel.swift:103-114`; `Views/RegistrationView.swift:27-46`; `.cursor/rules/permissions-registration.mdc:209-266` |
| Discovery | `devicesStream()`; per-device `compatibility()` → `.deviceUpdateRequired` → `openFirmwareUpdate()`; `AutoDeviceSelector.activeDeviceStream()` yields `nil` when no device | `WearablesViewModel.swift:60-101,153-166`; `CameraViewModel.swift:405-412` |
| Camera permission | Granted in the Meta AI app (once or always), not by an OS dialog. The sample confirms with the user before switching apps. `PermissionError` incl. `.requestTimeout`, `.noDeviceWithConnection`. | `CameraViewModel.swift:240-274` |
| Microphone | **Not** a Meta AI permission. It uses the OS HFP permission dialogs. | S04 build-overview guide |
| Session | `createSession(deviceSelector:)` → subscribe → `start()`. `DeviceSessionState`: `idle/starting/started/paused/stopping/stopped`. `stopped` is terminal; create a new session. Closing the hinges forces `stopped`, and reopening does not restart. The state does not expose transition reasons. | `CameraViewModel.swift:107-111, 205-220, 461-484`; S04 session-lifecycle guide |
| Stream | `session.addCamera(config:)` → `camera.stream`. Resolution low 360×640, medium 504×896, high 720×1280; fps 2/7/15/24/30. The SDK degrades resolution, then fps. iOS `StreamState` has `waitingForDevice`; Android adds terminal `CLOSED`. `StreamError` incl. `.hingesClosed`, `.thermalHot`, `.batteryLow`, `.photoCaptureFailed`. | `CameraViewModel.swift:133-141, 278-305`; `.cursor/rules/camera-streaming.mdc:68-89`; Android `CameraViewModel.kt:360` |
| Photo | `stream.capturePhoto(format: .jpeg) -> Bool`; `false` = no event will follow. Data arrives on `photoDataPublisher`. Android reads EXIF orientation to rotate. | `CameraViewModel.swift:322-333, 570-575`; Android `CameraViewModel.kt:485-512` |
| Voice invocation | *"Hey Meta, start {app name}"* launches or foregrounds the app. It is a Wearables-level stream (no `DeviceSession` or mic permission). Register before `start`; acknowledge each `LaunchApp` exactly once via `responseHandle.sendSuccess(actionOutput: nil)`. **No utterance is delivered.** The spoken name and approval are set in the Developer Center. Experimental. | `plugins/mwdat-ios/skills/voice-invocations/SKILL.md:8,12,46`; `AGENTS.md:1345-1347`; `samples/BirdSpotter/.../DatGlassesVoiceRepository.swift:260-268` |
| Taps | **"A single touchpad tap pauses an active stream"** | `.cursor/rules/debugging.mdc:80`; Android `.cursor/rules/camera-streaming.mdc:83` |
| Teardown | Parent→child cascade only; call `camera?.stop()` when a stream dies on its own; listener tokens kept in a bag | `CameraViewModel.swift:543-555` |
| Background | iOS sample ends the session on `didEnterBackground`; Android keeps a `connectedDevice` foreground service | `CameraViewModel.swift:414-448`; Android `StreamingService.kt` |
| Mock Device Kit | Debug-only `MockDeviceKit.shared.enable(...)`. Simulates pair, power, fold/unfold, don/doff, battery, thermal, captouch, permissions, camera feed, captured image, and since 1.0.0 display, inputs, motion, speech and voice invocations. | `CameraAccessApp.swift:22-61`; `.cursor/rules/mockdevice-testing.mdc` |

## Claims in our earlier design: verification
| Earlier claim | Verdict | Evidence |
|---|---|---|
| DAT is native Swift/Kotlin, registered via the Meta AI app with Developer Mode | **Verified** | S04: iOS 17.2+, Android 10+. Developer Mode is enabled by tapping the app version 5 times. |
| DAT 1.0 (rolling out 2026-09-30) adds camera, mic, audio, IMU, speech, "Hey Meta", inputs, lifecycle | **Partly refuted** | S05: the rollout date is right, but the FAQ lists only camera, mic, audio, motion and IMU. S03: inputs, motion, speech, voice invocations, standalone photo and camera audio are **[Experimental]**, so they are unpublishable. |
| Standalone photo and in-stream PCM audio are experimental; photo during a stream is not | **Verified** | S04 camera-capture and microphone guides |
| Display output in developer preview since May 2026; the Mock Device Kit doesn't simulate display | **First half verified, second refuted** | S06 (2026-05-14). S04: since 1.0.0 the mock renders the 600×600 display. The FAQ statement is outdated. There is no "list" component (FlexBox, Text, Image, Button, Icon, Video, ButtonGroup). |
| No public publishing; ≤ 100 testers; availability varies by device | **Mostly verified** | S05. "100 testers" is only in S06; S04 says to check the channel's Users tab. One private release channel per integration. |
| Meta AI Connectors in developer preview | **Verified, with conflict** | S05 says developer preview; S07 says early access with sign-up |
| Glasses audio goes over Bluetooth | **Verified, with nuance** | S04: HFP (two-way mono, 16 or 8 kHz; enables beamforming) vs A2DP (output, 44.1/48 kHz), mutually exclusive. HFP must settle **before** the stream starts. In-stream PCM and `MWDATSpeech` are beta exceptions. The docs disagree on 8 vs 16 kHz. |
| Display Web App has no camera or mic | **Verified** | S09: "Only the Device Access Toolkit can use the glasses' camera or capture microphone audio." |

## What changed in our design because of this
- **DEC-004:** experimental features are flag-gated, with publishable fallbacks.
- **DEC-005:** device state is split into separate lifecycles; `stopped` is terminal; `degraded_reasons`.
- **DEC-006:** capture comes from a short stream; orientation is applied before EXIF is stripped.
- **DEC-007:** gesture-confirm is not allowed during a stream, and the phone tap is the default.
- **DEC-015:** SDK telemetry opt-out.
- **DEC-021:** voice invocation is launch-then-listen, with routing on our transcript.
- **DEC-022:** a hour-0 device gate sets the experimental flags.
- **DEC-023:** a separate capture-turn latency budget, with a warm session and a cold camera.
- **Known issues to plan around (S04):**
  - On Ray-Ban Display, display updates are held while a capture transfers.
  - Speech can stop silently after about 1 minute.
