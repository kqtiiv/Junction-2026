# Architecture decision log

The canonical record of every material decision on the glasses platform and its S-Bank Coach integration. Workflow and file layout: DEC-001. Sources are cited by ID from [`SOURCES.md`](./SOURCES.md), with URLs repeated inline. Longer evidence write-ups live in [`adr/evidence/`](./adr/evidence/).

**Claim markers used in evidence tables:**
- **[fact]** verified in the cited source;
- **[inference]** our reasoning from facts;
- **[assumption]** unverified and must be checked;
- **[mock]** a hackathon-only stand-in.

## Index

| ID | Title | Status | Scope |
|---|---|---|---|
| [DEC-001](#dec-001--decision-records-are-canonical-in-this-log-architecturemd-is-the-platform-document) | Decision records are canonical in this log; `ARCHITECTURE.md` is the platform document | accepted | platform |
| [DEC-002](#dec-002--reference-repositories-are-pattern-sources-only-reuse-follows-each-licence) | Reference repositories are pattern sources only; reuse follows each licence | accepted | platform |
| [DEC-003](#dec-003--the-native-dat-companion-is-the-only-capture-and-voice-path-display-web-apps-and-webmcp-are-optional-output) | The native DAT companion is the only capture and voice path; Display Web Apps and WebMCP are optional output | accepted | glasses |
| [DEC-004](#dec-004--experimental-dat-features-are-flag-gated-and-each-has-a-publishable-fallback) | Experimental DAT features are flag-gated and each has a publishable fallback | accepted | glasses |
| [DEC-005](#dec-005--device-state-is-four-independent-lifecycles-published-as-devicesessionstate) | Device state is four independent lifecycles, published as `DeviceSessionState` | accepted | companion |
| [DEC-006](#dec-006--captures-are-user-initiated-stills-from-a-short-low-resolution-stream-orientation-is-applied-before-exif-is-stripped) | Captures are user-initiated stills from a short, low-resolution stream; orientation is applied before EXIF is stripped | accepted | companion |
| [DEC-007](#dec-007--glasses-gesture-confirmation-is-opt-in-and-never-used-while-a-camera-stream-is-active) | Glasses-gesture confirmation is opt-in and never used while a camera stream is active | accepted | security |
| [DEC-008](#dec-008--one-errorenvelope-for-every-non-2xx-response-with-effect_state-to-block-unsafe-replays) | One `ErrorEnvelope` for every non-2xx response, with `effect_state` to block unsafe replays | accepted | platform |
| [DEC-009](#dec-009--required-contract-names-map-onto-existing-v1-contracts-no-renames) | Required contract names map onto existing v1 contracts; no renames | accepted | platform |
| [DEC-010](#dec-010--no-model-vendor-or-framework-names-in-platform-contracts) | No model, vendor or framework names in platform contracts | accepted | platform |
| [DEC-011](#dec-011--turn-based-requestresponse-not-realtime-speech-to-speech-stop-aborts-but-never-applies) | Turn-based request/response, not realtime speech-to-speech; "stop" aborts but never applies | accepted | platform |
| [DEC-012](#dec-012--harden-confirmations-canonical-hash-single-use-bound-to-turn-and-capability-idempotent-apply) | Harden confirmations: canonical hash, single use, bound to turn and capability, idempotent apply | proposed | security |
| [DEC-013](#dec-013--add-an-auditevent-contract-with-per-kind-allowlisted-fields) | Add an `AuditEvent` contract with per-kind allowlisted fields | proposed | security |
| [DEC-014](#dec-014--add-consentgrant-read-only-data-scopes-and-revocation-that-purges-derived-data) | Add `ConsentGrant`, read-only data scopes, and revocation that purges derived data | proposed | security |
| [DEC-015](#dec-015--opt-out-of-meta-sdk-analytics-and-crash-reporting-in-the-companion) | Opt out of Meta SDK analytics and crash reporting in the companion | accepted | companion |
| [DEC-016](#dec-016--build-the-native-companion-for-one-os-no-cross-platform-wrapper-for-dat) | Build the native companion for one OS; no cross-platform wrapper for DAT | accepted | companion |
| [DEC-017](#dec-017--one-capability-adapter-interface-for-remote-on-device-and-template-backends) | One capability-adapter interface for remote, on-device and template backends | accepted | finance adapter |
| [DEC-018](#dec-018--the-platform-owns-confirmation-domains-only-propose-money-moving-action-kinds-are-rejected) | The platform owns confirmation; domains only propose; money-moving action kinds are rejected | accepted | security |
| [DEC-019](#dec-019--the-finance-engine-is-the-only-source-of-money-values-rag-is-educational-only) | The finance engine is the only source of money values; RAG is educational only | accepted | finance adapter |
| [DEC-020](#dec-020--cloud-agent-for-the-hackathon-local-routing-later-meta-ai-connectors-later) | Cloud agent for the hackathon; local routing later; Meta AI Connectors later | accepted | platform |
| [DEC-021](#dec-021--voice-invocation-only-launches-the-app-our-asr-captures-the-question-and-the-router-picks-the-capability-from-the-transcript) | Voice invocation only launches the app; our ASR captures the question and the router picks the capability from the transcript | accepted | glasses |
| [DEC-022](#dec-022--an-hour-0-device-gate-on-the-real-glasses-sets-the-experimental-feature-flags) | An hour-0 device gate on the real glasses sets the experimental-feature flags | accepted | demo |
| [DEC-023](#dec-023--capture-turns-get-their-own-latency-budget-the-device-session-stays-warm-the-camera-stream-does-not) | Capture turns get their own latency budget; the device session stays warm, the camera stream does not | accepted | companion |
| [DEC-024](#dec-024--the-s-bank-coach-teams-python-engine-runs-behind-a-thin-http-service-that-converts-to-our-contracts) | The S-Bank Coach team's Python engine runs behind a thin HTTP service that converts to our contracts | accepted | finance |
| [DEC-025](#dec-025--money-answers-follow-the-engine-safe-to-spend-today-until-payday-not-per-week) | Money answers follow the engine: safe to spend today, until payday, not per week | accepted | finance |
| [DEC-026](#dec-026--s-bank-is-dropped-from-the-project-the-finance-capability-becomes-the-teams-money-coach) | S-Bank is dropped from the project; the finance capability becomes the team's money coach | accepted | platform |
| [DEC-027](#dec-027--the-phone-app-has-one-bold-element-the-answers-figure-on-a-price-tag-and-the-decision-docks-above-the-input-bar) | The phone app has one bold element (the answer's figure on a price tag), and the decision docks above the input bar | accepted | companion |

---

## DEC-001 — Decision records are canonical in this log; `ARCHITECTURE.md` is the platform document

- Status: accepted
- Date: 2026-11-14
- Owner: platform architecture
- Scope: platform
- Decision:
  - We keep one canonical decision log (this file) with full entries, a source register (`SOURCES.md`), per-reference evidence write-ups in `docs/adr/evidence/`, a contract index in `docs/contracts/`, and make `docs/ARCHITECTURE.md` the platform architecture (the former finance design moves to `docs/finance/REFERENCE_DESIGN.md`).

### Context
- **Problem being solved:**
  - Decisions were recorded only as one-line bullets (former `PLATFORM_ARCHITECTURE.md` §9), with no options, evidence or revisit triggers.
  - Meta platform claims were uncited.
  - `docs/ARCHITECTURE.md` held the finance-domain design, but the required layout expects the platform architecture there.
- **Requirements and constraints:** the required files are `docs/ARCHITECTURE.md`, `ARCHITECTURE_DECISION_LOG.md`, `SOURCES.md`, `docs/contracts/` and `docs/adr/`. The decision entry structure is fixed.
- **Assumptions:** there is no CI that publishes docs, so renaming files breaks only in-repo links.
- **Non-goals:** a docs site, or ADR tooling such as adr-tools or log4brains.

### Options considered
| Option | Advantages | Disadvantages | Why accepted or rejected |
|---|---|---|---|
| Full entries in the log; `adr/` holds evidence write-ups | One place to read decisions; evidence stays out of the log but is linked | The log grows long | **Accepted.** The prescribed structure is already per-entry. Duplicating entries into `adr/NNN.md` files would drift. |
| One file per decision in `adr/`; the log is an index | Conventional (Nygard ADRs) | Two places to keep in sync | Rejected: drift risk with no reader benefit |
| Keep `PLATFORM_ARCHITECTURE.md`, add a stub `ARCHITECTURE.md` | No file moves | Two "architecture" docs; the required path holds the wrong content | Rejected |

### Evidence and sources
| Source | Type | Specific finding used | Why this source is trustworthy | Accessed |
|---|---|---|---|---|
| Project brief (user-supplied) | Requirement | Required file layout and entry structure | It defines the deliverable | 2026-11-14 |
| Repository state (`git log`, `docs/`) | Inspection | The old §9 list had six unrecorded decisions; `docs/` was untracked | Direct inspection | 2026-11-14 |

### Implementation
- **Components affected:** `docs/` only.
- **Contracts or schemas affected:** none. Links updated in `contracts/README.md` and `contracts/interfaces/adapter.ts`.
- **Configuration / feature flags:** none.
- **Tests or demo checks required:** `grep -rn PLATFORM_ARCHITECTURE` returns nothing.
- **Migration or rollback plan:** move the two files back and revert the link edits.

### Consequences
- **Benefits:** decisions are reviewable and challengeable, and the evidence is traceable.
- **Costs and limitations:** every material change now needs a log entry, which adds friction during the hackathon.
- **Failure behavior:** n/a.
- **Security/privacy implications:** none.
- **What this intentionally does not solve:** keeping the docs automatically in sync with the code.

### Revisit triggers
- Revisit this decision if the log exceeds about 40 entries (split it by scope), or if the team adopts ADR tooling.

---

## DEC-002 — Reference repositories are pattern sources only; reuse follows each licence

- Status: accepted
- Date: 2026-11-14
- Owner: platform architecture
- Scope: platform
- Decision:
  - We adapt **patterns** from the five named references, copy **no code** from Meta samples or VisionClaw, may copy MIT code from GemGlasses or Open Instinct only with attribution and review, and cite nothing from "FYN" until a real source is identified.

### Context
- **Problem being solved:** the brief names five references. Their licences, maturity and even identity differ, and "inspired by" must not turn into unlicensed copying or unearned trust.
- **Requirements and constraints:** inspect licences before reuse. Treat official Meta sources as the authority. Do not claim that Open Instinct represents Instinct.
- **Assumptions:** none.
- **Non-goals:** a legal opinion. Our reading of the terms is not legal advice.

### Options considered
| Option | Advantages | Disadvantages | Why accepted or rejected |
|---|---|---|---|
| Patterns only; licence-gated code reuse | Legally clean; forces us to understand what we build | Slower than copying samples | **Accepted** |
| Fork Meta's CameraAccess sample as the companion base (VisionClaw's approach) | Fast start | The Developer Terms bar open redistribution; we would also inherit sample-only shortcuts | Rejected. Building our own `GlassesBridge` against the SDK is permitted use. |
| Treat all five as equal authorities | Simple | Two are toys or prototypes, and one could not be found | Rejected |

### Evidence and sources
| Source | Type | Specific finding used | Why this source is trustworthy | Accessed |
|---|---|---|---|---|
| S01/S02 `LICENSE` + S08 §2.1–2.2, §18.22 (https://github.com/facebook/meta-wearables-dat-ios, https://wearables.developer.meta.com/terms) | Licence / legal | [fact] The samples are licensed under the Developer Terms, not OSS. The licence is "limited… non-sublicensable". No derivative works "other than to modify and use sample apps… expressly authorized". No redistribution under open-source terms. | Primary legal text | 2026-11-14 |
| S11 `LICENSE` (https://github.com/Intent-Lab/VisionClaw) | Licence | [fact] The file contains only a pointer to Meta's Developer Terms; there is no OSS grant | Primary | 2026-11-14 |
| S10, S12 `LICENSE` | Licence | [fact] MIT | Primary | 2026-11-14 |
| S10 commit history | Repo metadata | [fact] 1 commit, 1 contributor; [inference] the real-glasses path was never run on hardware | Inspectable | 2026-11-14 |
| S12 `README.md:3,95` | Repo docs | [fact] A self-described from-scratch clone of Instinct, unaffiliated with it | Primary self-description | 2026-11-14 |
| S17 | Search results | [fact] No public FYN with typed finance tools, scopes or revocation was found | Exhaustive search reported in `adr/evidence/fyn.md` | 2026-11-14 |

### Implementation
- **Components affected:** all future code.
- **Contracts or schemas affected:** none.
- **Configuration / feature flags:** none.
- **Tests or demo checks required:** PR review checklist item: "Any copied code? Source and licence?"
- **Migration or rollback plan:** n/a.

### Consequences
- **Benefits:** no licence exposure; each borrowed idea is traceable to a cited source.
- **Costs and limitations:** we write the `GlassesBridge` ourselves.
- **Failure behavior:** n/a.
- **Security/privacy implications:** we avoid inheriting VisionClaw's auto-approval and GemGlasses' baked-in secrets.
- **What this intentionally does not solve:** SDK binary redistribution, which follows S08.

### Revisit triggers
- Revisit this decision if Meta relicenses the samples, VisionClaw adds an OSS licence, or someone supplies the intended FYN source.

---

## DEC-003 — The native DAT companion is the only capture and voice path; Display Web Apps and WebMCP are optional output

- Status: accepted
- Date: 2026-11-14 (confirms an earlier design choice, now with evidence)
- Owner: glasses / companion workstream
- Scope: glasses
- Decision:
  - All camera capture and voice input go through the native iOS/Android companion built on the Wearables Device Access Toolkit; a Ray-Ban Display Web App, if built, only renders glanceable cards, and WebMCP may only expose already-safe actions as an optional accelerator.

### Context
- **Problem being solved:** two Meta delivery paths exist, and the platform must not depend on one that cannot do the core interaction (user-initiated capture plus voice intent).
- **Requirements and constraints:** no always-on capture. Every task must be completable without display-specific features.
- **Assumptions:** [assumption] the demo device is Ray-Ban Meta (non-Display) unless the team confirms otherwise at hour 0.
- **Non-goals:** a Web-App-only product.

### Options considered
| Option | Advantages | Disadvantages | Why accepted or rejected |
|---|---|---|---|
| Native DAT companion for capture and voice; Web App optional | Only path with camera and mic access | Native build per OS | **Accepted** |
| Display Web App as primary | Web stack, fast UI iteration | No camera feed and no mic audio; only dictated text or WebMCP | Rejected: cannot perform the core interaction |
| WebMCP-first (Meta AI calls our tools) | Hands-free via Meta AI | Off by default, enabled per device, developer preview; a foreground WebMCP app overrides DAT voice invocations | Rejected as primary; kept as an optional accelerator |

### Evidence and sources
| Source | Type | Specific finding used | Why this source is trustworthy | Accessed |
|---|---|---|---|---|
| S09 (https://wearables.developer.meta.com/llms.txt, Web Apps) | Official docs | [fact] "Only the Device Access Toolkit can use the glasses' camera or capture microphone audio. Web Apps get spoken input only as text dictated into a text field or … WebMCP." | Primary vendor docs | 2026-11-14 |
| S09 | Official docs | [fact] WebMCP uses `document.modelContext.registerTool()`, is off by default and enabled per device, and a foreground WebMCP app takes priority over DAT voice invocations | Primary | 2026-11-14 |
| S04 (https://wearables.developer.meta.com/docs/develop/dat) | Official docs | [fact] DAT is native Swift/Kotlin, iOS 17.2+ / Android 10+, registered through the Meta AI app | Primary | 2026-11-14 |
| S06 (https://developers.meta.com/blog/build-for-display-glasses/) | Official blog | [fact] Display components (FlexBox, Text, Image, Button, Icon, Video, ButtonGroup) are in developer preview. There is **no list component**. | Primary, dated 2026-05-14 | 2026-11-14 |

### Implementation
- **Components affected:** L1/L2 companion; L8 optional display renderer.
- **Contracts or schemas affected:** `InsightCard.render_hints.glasses_display_lines` stays optional. No contract may require display.
- **Configuration / feature flags:** `display_output` (default off), `webmcp` (default off).
- **Tests or demo checks required:** every demo step passes with the display flag off.
- **Migration or rollback plan:** n/a. This is the baseline.

### Consequences
- **Benefits:** the core path works on non-Display glasses.
- **Costs and limitations:** native build effort (DEC-016).
- **Failure behavior:** no display means cards on the phone.
- **Security/privacy implications:** WebMCP, if enabled later, must expose only read-only or proposal-creating tools. Confirmation stays with the platform (DEC-018).
- **What this intentionally does not solve:** Display-specific UX.

### Revisit triggers
- Revisit this decision if Meta grants Web Apps camera or mic access, if WebMCP leaves preview and becomes on by default, or if the demo device is a Ray-Ban Display.

---

## DEC-004 — Experimental DAT features are flag-gated and each has a publishable fallback

- Status: accepted
- Date: 2026-11-14
- Owner: glasses / companion workstream
- Scope: glasses
- Decision:
  - Voice invocation ("Hey Meta, start …"), glasses Inputs, DAT Speech, standalone photo capture and in-stream audio are used only behind per-feature flags in Developer-Mode builds, each paired with a non-experimental fallback that the demo can switch to live, and the active set is reported in `DeviceSessionState.experimental_features`.

### Context
- **Problem being solved:** the previous design treated "Hey Meta" invocation, glasses gestures and DAT speech as available platform features. In DAT 1.0.0 they are experimental, and apps using them cannot be published.
- **Requirements and constraints:**
  - The demo should show glasses-first interaction.
  - The architecture must remain publishable.
  - S08 §2.8 bars experimental features from production builds without written permission.
- **Assumptions:** [assumption] the team's glasses are in Developer Mode, so experimental features work for the demo.
- **Non-goals:** obtaining Meta's written permission.

### Options considered
| Option | Advantages | Disadvantages | Why accepted or rejected |
|---|---|---|---|
| Flag-gate experimental features, with fallbacks | Best demo; honest; publishable baseline | Two code paths per feature | **Accepted** |
| Use only non-experimental features | Publishable today | Loses voice invocation and gestures; weaker glasses-first demo | Rejected for the demo; it is the production baseline |
| Use experimental features unconditionally | Simplest | Unpublishable; the demo breaks if a feature misbehaves | Rejected |

**Fallback map:**

| Experimental feature | Publishable fallback |
|---|---|
| Voice invocations | Phone push-to-talk, or a companion-app button |
| Inputs (tap, swipe) | Phone tap (DEC-007) |
| Speech (DAT on-device transcription) | OS speech recognition on HFP mic audio (`ModelProvider asr.device`) |
| Standalone photo | `capturePhoto` during a short stream (DEC-006) |
| In-stream audio | HFP mic through OS audio |
| Display | Phone cards |

### Evidence and sources
| Source | Type | Specific finding used | Why this source is trustworthy | Accessed |
|---|---|---|---|---|
| S03 (https://github.com/facebook/meta-wearables-dat-ios/blob/main/CHANGELOG.md, lines 8, 19–24) | Official release notes | [fact] Inputs, Motion, Speech, Voice invocations, standalone Photo capture and camera audio streaming are **[Experimental]** in 1.0.0: "apps using them cannot be published yet" | Primary, verified in the clone | 2026-11-14 |
| S04 camera-capture guide | Official docs | [fact] "Standalone photo capture is available to every developer, but apps that use it cannot be published yet." `stream.capturePhoto` is not marked experimental. | Primary | 2026-11-14 |
| S04 microphones-and-speakers guide | Official docs | [fact] In-stream audio is "not supported in production release channels" | Primary | 2026-11-14 |
| S08 §2.8 (https://wearables.developer.meta.com/terms) | Legal | [fact] Experimental Features "cannot be incorporated into any production build unless permitted by Meta in writing" | Primary | 2026-11-14 |
| S05 (https://developers.meta.com/wearables/faq/) | Official FAQ | [fact] DAT 1.0 "begins rolling out September 30, 2026". The FAQ lists only camera, microphone, audio, motion and IMU. **This refutes our earlier claim** that 1.0 adds voice invocation and inputs as general features. | Primary | 2026-11-14 |

### Implementation
- **Components affected:** `GlassesBridge`, the companion settings screen and the debug overlay.
- **Contracts or schemas affected:** `device_session_state.schema.json`. `experimental_features` is required, and each experimental `device_capabilities` entry must be declared there (schema rule plus invalid example `device_session_state.experimental_not_declared.json`).
- **Configuration / feature flags:** `exp_voice_invocation`, `exp_inputs`, `exp_speech`, `exp_standalone_photo`, `exp_stream_audio`, all default **off** outside debug builds.
- **Tests or demo checks required:**
  - Rehearse once with every flag off; the demo must still complete.
  - The overlay shows the active experimental set.
- **Migration or rollback plan:** when Meta graduates a feature, drop it from the enum's required pairing. That is an additive change.

### Consequences
- **Benefits:** honest demo, publishable architecture, and the risk is visible on screen.
- **Costs and limitations:** two paths per feature to test.
- **Failure behavior:** if a feature misbehaves live, flip its flag and the fallback takes over with no restart.
- **Security/privacy implications:** none new.
- **What this intentionally does not solve:** production availability timelines.

### Revisit triggers
- Revisit this decision on every DAT release (check the CHANGELOG `[Experimental]` labels), or if Meta grants written permission.

---

## DEC-005 — Device state is four independent lifecycles, published as `DeviceSessionState`

- Status: accepted
- Date: 2026-11-14
- Owner: companion + platform workstreams
- Scope: companion
- Decision:
  - The companion reports registration, device session, camera (permission and stream), audio route, and the platform's own conversation state as separate fields of a versioned `platform.device_session_state/v1` snapshot, sent with a monotonic `seq` to `PUT /v1/sessions/{id}/device-state`. Mock backends are always explicit (`glasses_backend: mock`), never a silent fallback.

### Context
- **Problem being solved:**
  - Our earlier single chain (`unregistered → registered → connected_idle → listening → … → phone_only`) mixed lifecycles that DAT changes independently. A stream can pause while the session is started, and a session can stop while registration persists.
  - Wrong combined states lead to wrong fallbacks.
  - The brief requires a `DeviceSessionState` contract.
- **Requirements and constraints:**
  - No DAT types above L2.
  - `phone_only` stays first-class.
  - The state must say *why* it is degraded, so the UI can explain it.
- **Assumptions:** none.
- **Non-goals:** mirroring every DAT error case. These are mapped to `degraded_reasons` codes.

### Options considered
| Option | Advantages | Disadvantages | Why accepted or rejected |
|---|---|---|---|
| Separate fields per lifecycle, with cross-field rules in the schema | Mirrors the SDK's real model; invalid combinations are rejected | More fields | **Accepted** |
| Keep a single chain | Simple diagram | Cannot represent "session started, stream paused by a tap" | Rejected |
| Forward raw DAT states | No mapping work | Leaks SDK types and versions into the platform | Rejected (violates the L2 boundary) |

### Evidence and sources
| Source | Type | Specific finding used | Why this source is trustworthy | Accessed |
|---|---|---|---|---|
| S01 `samples/CameraAccess/CameraAccess/ViewModels/CameraViewModel.swift:107-111, 133-141` | Official sample | [fact] `DeviceSessionState` is `idle/starting/started/paused/stopping/stopped`. `StreamState` is separate (`stopped/waitingForDevice/starting/streaming/paused/stopping`). | Primary, verified in the clone | 2026-11-14 |
| S01 `.cursor/rules/permissions-registration.mdc:209-266` | Official sample docs | [fact] `RegistrationState` `.available/.registering/.registered/.unavailable`, plus typed `RegistrationError` (incl. `.metaAINotInstalled`) | Primary | 2026-11-14 |
| S04 session-lifecycle guide | Official docs | [fact] State "does not expose the reason for a transition". `stopped` is terminal (create a new session). Closing the hinges forces `stopped`, and reopening does not restart. | Primary | 2026-11-14 |
| S02 `.cursor/rules/camera-streaming.mdc:83` | Official sample docs | [fact] Android adds a terminal `CLOSED` stream state. `PAUSED` is reported e.g. on a single cap-touch tap. | Primary | 2026-11-14 |
| S04 microphones-and-speakers guide | Official docs | [fact] Audio uses HFP (two-way mono, 16/8 kHz) or A2DP (output only). These are mutually exclusive, and HFP must settle before the stream starts. | Primary | 2026-11-14 |
| S10 `AppModule.kt:49-57` | OSS (MIT) | [fact] It silently substitutes `MockGlassesBackend` when the real backend fails to load. **This is the anti-pattern we forbid.** | Inspectable code, verified | 2026-11-14 |

### Implementation
- **Components affected:**
  - L2 `GlassesBridge`: maps DAT enums to platform enums.
  - L3: stores the latest snapshot by `seq` and uses it for modality and capture gating.
  - The debug overlay.
- **Contracts or schemas affected:**
  - New `contracts/schemas/v1/device_session_state.schema.json`.
  - New endpoint `PUT /v1/sessions/{session_id}/device-state` in `http/orchestrator.openapi.yaml`.
  - 2 valid and 4 invalid examples.
  - `AdapterHealth.mock?` in `interfaces/adapter.ts`.
- **Configuration / feature flags:** none.
- **Tests or demo checks required:**
  - `npm run check`.
  - On device: doff/don, close the hinges, revoke the camera permission in Meta AI, and turn Bluetooth off. Each must yield the expected `degraded_reasons`.
- **Migration or rollback plan:** additive in v1. `POST /v1/sessions` still accepts `device_capabilities`. Rollback means deleting the schema and the endpoint.

### Consequences
- **Benefits:** correct fallbacks, explainable degraded modes, and SDK churn contained in one module.
- **Costs and limitations:** the mapping table must be updated when the SDK adds states.
- **Failure behavior:**
  - Stale snapshots (lower `seq`) are ignored.
  - If no snapshot is received, L3 assumes `phone_only`.
- **Security/privacy implications:** the snapshot carries no personal data. `session_id` is opaque.
- **What this intentionally does not solve:** multi-device sessions.

### Revisit triggers
- Revisit this decision if DAT adds lifecycle states that don't map, or if we support two simultaneous glasses.

---

## DEC-006 — Captures are user-initiated stills from a short, low-resolution stream; orientation is applied before EXIF is stripped

- Status: accepted
- Date: 2026-11-14
- Owner: glasses / companion workstream
- Scope: companion
- Decision:
  - A capture happens only after an explicit user act (voice command, capture button, or phone tap). The companion starts a short camera stream at low resolution, calls `capturePhoto(.jpeg)` once, stops the stream, then rotates the image according to its EXIF orientation **before** stripping EXIF and GPS, downscales, and uploads it as a `ContextCapture`. A model or agent can never start a capture.

### Context
- **Problem being solved:**
  - The previous design assumed a standalone photo API, which is experimental.
  - It stripped EXIF without first applying orientation, which produces rotated images.
  - It did not state who may trigger the camera.
- **Requirements and constraints:**
  - No always-on camera and no facial recognition.
  - Minimise data on the phone.
  - The capture path must be publishable (DEC-004).
- **Assumptions:** [assumption] a 504×896 or 720×1280 still is enough for price labels and receipts. Verify on device at hour 0–3, with receipts as the hardest case.
  - [assumption] Stream start → photo takes 1.0–2.0 s. The latency budget is in DEC-023, measured by the hour-0 gate (DEC-022).
- **Non-goals:** video understanding and continuous scene context.

### Options considered
| Option | Advantages | Disadvantages | Why accepted or rejected |
|---|---|---|---|
| User-triggered short stream + `capturePhoto` | Publishable; minimal camera-on time | Stream start latency (to be measured) | **Accepted** |
| Standalone `Camera.photo` | Higher quality, no stream | Experimental, cannot publish | Flag-gated alternative only (DEC-004) |
| Model-triggered "look" tool (GemGlasses `capturar_visao`, VisionClaw `look_closely`) | Natural conversational UX | The camera turns on at a model's discretion, against our consent model | **Rejected** |
| Continuous ambient frames at ~1 fps (VisionClaw) | Rich context | Always-on capture; bystander privacy | **Rejected** |

### Evidence and sources
| Source | Type | Specific finding used | Why this source is trustworthy | Accessed |
|---|---|---|---|---|
| S04 camera-capture guide (https://wearables.developer.meta.com/docs/develop/dat) | Official docs | [fact] Standalone photo is experimental. Capture during a stream is the publishable path. | Primary | 2026-11-14 |
| S01 `CameraViewModel.swift:322-333, 570-575` | Official sample | [fact] `stream.capturePhoto(format: .jpeg)` returns `Bool`; `false` means no photo event will follow. Data arrives on `photoDataPublisher`. | Primary | 2026-11-14 |
| S01 `.cursor/rules/camera-streaming.mdc:68-89` | Official sample docs | [fact] Resolutions are low 360×640, medium 504×896, high 720×1280. Frame rates are 2/7/15/24/30. The SDK lowers resolution, then frame rate, when bandwidth is short. | Primary | 2026-11-14 |
| S02 `CameraViewModel.kt:485-512` | Official sample | [fact] The sample reads EXIF orientation from the photo bytes to rotate the image. [inference] Stripping first would lose that orientation. | Primary | 2026-11-14 |
| S10 `VisionTool.kt:43-49`; S11 `ToolCallModels.swift:102-121`, `GeminiConfig.swift:14-21` | OSS code | [fact] Both let the model decide when to capture. VisionClaw also streams ambient frames continuously. | Inspectable code | 2026-11-14 |

### Implementation
- **Components affected:** `GlassesBridge` capture routine; phone-side minimisation; `POST /v1/captures`.
- **Contracts or schemas affected:**
  - `ContextCapture.minimisation` gains the enum value `orientation_applied`. This is additive within v1; it stays optional, because requiring it would reject previously valid messages. *Amended 2026-11-14:* the first version of this entry wrongly called the field a free string array. It is an enum, so the value was added to `context_capture.schema.json` and to the `context_capture.price_label` example.
  - `ContextCapture.trigger` already excludes model triggers (`voice_command | glasses_input | phone_tap`).
- **Configuration / feature flags:** `capture_resolution` (default `medium`); `exp_standalone_photo`.
- **Tests or demo checks required:**
  - Unit test: a portrait photo with EXIF orientation 6 comes out upright and with no EXIF.
  - On device: measure stream-start-to-photo latency; handle a `capturePhoto` result of `false`; handle a `.photoCaptureFailed` error.
- **Migration or rollback plan:** none needed. This is a phone-only routine.

### Consequences
- **Benefits:** publishable; the camera is on only for seconds; images are upright.
- **Costs and limitations:**
  - Extra latency from starting the stream.
  - [inference] A single cap-touch tap pauses the stream (S02 `camera-streaming.mdc:83`), which interacts with DEC-007.
- **Failure behavior:**
  - Capture fails → "Couldn't get the photo. Try again or use the phone camera." The same contract applies with `source: phone_camera`.
  - [mock] Seeded demo image as the last-resort fallback.
- **Security/privacy implications:**
  - No GPS or EXIF leaves the phone.
  - The capture LED is managed by the device.
  - No capture can be triggered by the backend or a model.
- **What this intentionally does not solve:** OCR quality, which belongs to the extraction provider.

### Revisit triggers
- Revisit this decision if standalone photo leaves experimental status, if receipts are unreadable at the chosen resolution, or if stream start exceeds about 2 s on the demo device.

---

## DEC-007 — Glasses-gesture confirmation is opt-in and never used while a camera stream is active

- Status: accepted
- Date: 2026-11-14
- Owner: platform + companion workstreams
- Scope: security
- Decision:
  - A phone tap is the default confirmation channel. `glasses_gesture` is offered only for low-risk, reversible proposals, only when the `exp_inputs` flag is on, and only when no camera stream is active. The required `GestureOrInputEvent` is represented by the existing `VoiceIntent` with `invocation: glasses_input` plus the shared `GlassesInput` definition, not by a new schema.

### Context
- **Problem being solved:** the demo script's climax ("tap the glasses to confirm") relies on a feature that is experimental, and the same tap is the system gesture that pauses a stream.
- **Requirements and constraints:**
  - Explicit user confirmation for every persistent action.
  - Hands-free confirmation only for low-risk, reversible actions (already in the schema).
- **Assumptions:** [assumption] the demo glasses expose a tap event through Inputs in Developer Mode. Verify at hour 0.
- **Non-goals:** biometric confirmation on the glasses.

### Options considered
| Option | Advantages | Disadvantages | Why accepted or rejected |
|---|---|---|---|
| Phone tap by default; gesture opt-in, outside any stream | Safe and publishable; keeps the glasses demo moment | The gesture path depends on an experimental flag | **Accepted** |
| Gesture as the primary confirmation | Best hands-free UX | Experimental; a tap may pause a stream instead, or be swallowed by it; a known double-press bug (S04) | Rejected |
| Drop the gesture channel entirely | Simplest | Loses a reversible, low-risk hands-free path that suits accessibility | Rejected |
| New `GestureOrInputEvent` schema | Name matches the brief | Duplicates `VoiceIntent(glasses_input)`, which already enforces "gesture-only turns must map to a platform intent" | Rejected (DEC-009) |

### Evidence and sources
| Source | Type | Specific finding used | Why this source is trustworthy | Accessed |
|---|---|---|---|---|
| S03 CHANGELOG line 19 (https://github.com/facebook/meta-wearables-dat-ios/blob/main/CHANGELOG.md) | Official release notes | [fact] `MWDATInputs` is [Experimental] in 1.0.0 | Primary | 2026-11-14 |
| S01 `.cursor/rules/debugging.mdc:80`; S02 `.cursor/rules/camera-streaming.mdc:83` | Official sample docs | [fact] "A single touchpad tap pauses an active stream" | Primary, verified in both clones | 2026-11-14 |
| S04 known-issues notes | Official docs | [fact] Inputs needs Developer Center approval, has no runtime prompt, and has a known double-press issue | Primary | 2026-11-14 |
| S12 `runtime.ts:110-111, 540-541` | OSS (MIT) | [fact] Only some channels may settle an approval. This is the same idea as our per-proposal `confirm_channels`. | Inspectable code | 2026-11-14 |

### Implementation
- **Components affected:** L3 confirmation validator; companion confirm UI; demo script (ARCHITECTURE.md §6).
- **Contracts or schemas affected:**
  - None. The existing `ConfirmationPolicyRules` and the `voice_intent` gesture rule stay as they are.
  - Runtime check added in L3: reject `channel: glasses_gesture` when the latest `DeviceSessionState.camera.stream` is not `stopped`. The error is `409 CONFIRM_CHANNEL_NOT_ALLOWED`.
- **Configuration / feature flags:** `exp_inputs`.
- **Tests or demo checks required:**
  - Rehearse the confirm step with gesture and with a phone tap.
  - Check that a tap during a stream does not confirm anything.
- **Migration or rollback plan:** turn the flag off and the phone tap remains.

### Consequences
- **Benefits:** no accidental confirmations, and the demo still works if Inputs fails.
- **Costs and limitations:** the gesture moment requires the stream to be stopped first. The capture flow (DEC-006) stops it right after the photo.
- **Failure behavior:** gesture not received within the readback window → fall back to the phone confirm sheet.
- **Security/privacy implications:** reduces the risk that a stray tap confirms something.
- **What this intentionally does not solve:** voice-readback ASR robustness, which is covered by the existing ≥ 0.85 confidence rule.

### Revisit triggers
- Revisit this decision if Inputs leaves experimental status, or if Meta separates the confirm gesture from the stream-pause gesture.

---

## DEC-008 — One `ErrorEnvelope` for every non-2xx response, with `effect_state` to block unsafe replays

- Status: accepted
- Date: 2026-11-14
- Owner: platform workstream
- Scope: platform
- Decision:
  - Every non-2xx body on the orchestrator and coach-agent APIs, and every SSE `error` event, is a `platform.error/v1` object with `{code, retryable, effect_state: none|applied|unknown, user_message, correlation_id, occurred_at}`. The schema enforces that `effect_state: unknown` implies `retryable: false`.

### Context
- **Problem being solved:**
  - HTTP errors (403, 409, 404, 422) had no body schema.
  - The only error shape, `ErrorInfo`, could not express "this may already have been applied". Without that, a timeout while applying a confirmed proposal invites a double apply on retry.
- **Requirements and constraints:**
  - `ErrorEnvelope` is a required contract in the brief.
  - User-facing text must be safe to speak aloud.
  - Graceful degradation must be visible.
- **Assumptions:** none.
- **Non-goals:** replacing `ErrorInfo` inside `ToolResult` and `DomainResponse`, which stays.

### Options considered
| Option | Advantages | Disadvantages | Why accepted or rejected |
|---|---|---|---|
| Custom envelope with `effect_state` and an open code set | Expresses unsafe-replay; codes can grow without breaking v1 clients | Not a standard | **Accepted** |
| RFC 9457 Problem Details | Standard | No effect-state or degradation semantics; `type` URIs add ceremony | Rejected. [inference] It can be adopted in v2 by adding `type` and `title` alongside. |
| Closed `code` enum | Validates typos | Generated Swift/Kotlin enums fail to decode unknown values, which breaks "additive within v1" | Rejected. The code registry lives in `docs/contracts/README.md`. |
| Reuse `ErrorInfo` | No new schema | No effect state, correlation id or localised message | Rejected |

### Evidence and sources
| Source | Type | Specific finding used | Why this source is trustworthy | Accessed |
|---|---|---|---|---|
| S12 `packages/core/src/runtime.ts:120-126` (https://github.com/mariagorskikh/open-instinct) | OSS (MIT) | [fact] `InboundUncertainError` marks that "work may already have caused an external effect; automatic replay is not safe" | Inspectable code | 2026-11-14 |
| S12 `runtime.ts:1474-1480, 818-819` | OSS | [fact] Users get a short reason; full detail goes to the audit log | Inspectable code | 2026-11-14 |
| S10 `ToolRegistry.kt:28-46`; S11 `ToolCallRouter.swift:78-89` | OSS | [fact] Structured tool errors; a circuit breaker after 3 consecutive failures | Inspectable code | 2026-11-14 |
| S13 Error Handling (https://modelcontextprotocol.io/specification/2025-06-18/basic/authorization) | Spec | [fact] 401 for an invalid or expired token; 403 for insufficient scope | Normative | 2026-11-14 |

### Implementation
- **Components affected:** orchestrator HTTP layer, coach adapter, companion error handling.
- **Contracts or schemas affected:**
  - New `contracts/schemas/v1/error_envelope.schema.json`.
  - `http/orchestrator.openapi.yaml` and `http/coach-agent.openapi.yaml` error responses.
  - 2 valid and 2 invalid examples.
- **Configuration / feature flags:** none.
- **Tests or demo checks required:**
  - `npm run check`.
  - Demo check: kill the coach during `POST /v1/confirm`. The phone shows "couldn't tell whether that was saved" and does not retry.
- **Migration or rollback plan:** additive. Clients that ignore the bodies are unaffected.

### Consequences
- **Benefits:** no double-applies; uniform client handling; the degradation reason can be shown.
- **Costs and limitations:** every service must produce the envelope.
- **Failure behavior:** unknown codes are handled using `retryable` and `effect_state`.
- **Security/privacy implications:** `user_message` must not contain amounts or account data. That is a review rule, not schema-enforced.
- **What this intentionally does not solve:** distributed transactions. Idempotent apply is DEC-012.

### Revisit triggers
- Revisit this decision if we expose a public third-party API (consider RFC 9457 compatibility), or if a client needs machine-readable field errors.

---

## DEC-009 — Required contract names map onto existing v1 contracts; no renames

- Status: accepted
- Date: 2026-11-14
- Owner: platform workstream
- Scope: platform
- Decision:
  - The brief's required contracts are satisfied by the existing schemas under their current names (`CapabilityRequest` = `DomainRequest`, `CapabilityResponse` = `DomainResponse`, `DeterministicToolResult` = `ToolResult`, `FinanceInsight` = finance `ToolResult` overlay + finance `InsightCard`, `GestureOrInputEvent` = `VoiceIntent(glasses_input)` + `GlassesInput`), plus the two new schemas from DEC-005 and DEC-008, with the mapping published in `docs/contracts/README.md`.

### Context
- **Problem being solved:** the brief lists 14 contract names. Some differ from the frozen v1 schema names, and some had no schema.
- **Requirements and constraints:**
  - v1 is additive-only.
  - Renaming a `schema` const (e.g. `platform.domain_request/v1`) is a breaking change for the Coach team and the generated types.
- **Assumptions:** the Coach team has started against the current names (the contracts were committed earlier today).
- **Non-goals:** cosmetic renames.

### Options considered
| Option | Advantages | Disadvantages | Why accepted or rejected |
|---|---|---|---|
| Map names; add only genuinely missing contracts | No breakage; no duplicate shapes | Two vocabularies to explain | **Accepted** |
| Rename to the brief's names in v2 now | Names match | Breaking for every consumer, for no behavioural gain | Rejected |
| Add alias schemas (`capability_request` = `$ref domain_request`) | Both names validate | Two `schema` consts for one message; generated duplicates | Rejected |
| Separate `FinanceInsight` schema | Explicit finance answer type | Duplicates `ToolResult` + `InsightCard`; a second source of finance figures | Rejected |

### Evidence and sources
| Source | Type | Specific finding used | Why this source is trustworthy | Accessed |
|---|---|---|---|---|
| `contracts/README.md` §"Changing a contract" | Project contract policy | [fact] Within v1, changes are additive only; renaming means v2 | Our own published rule | 2026-11-14 |
| `contracts/schemas/v1/voice_intent.schema.json` `allOf[1]` | Schema | [fact] Gesture-only turns must carry `input` and map to a platform intent | Inspection | 2026-11-14 |

### Implementation
- **Components affected:** docs only.
- **Contracts or schemas affected:** `docs/contracts/README.md` (new mapping table).
- **Configuration / feature flags:** none.
- **Tests or demo checks required:** the mapping lists a file path for every required name.
- **Migration or rollback plan:** if v2 is ever cut, rename then.

### Consequences
- **Benefits:** zero churn for the Coach team.
- **Costs and limitations:** readers must use the mapping table.
- **Failure behavior:** n/a.
- **Security/privacy implications:** none.
- **What this intentionally does not solve:** naming consistency across v1.

### Revisit triggers
- Revisit this decision when a v2 is cut for any other reason. Rename then.

---

## DEC-010 — No model, vendor or framework names in platform contracts

- Status: accepted
- Date: 2026-11-14
- Owner: platform workstream
- Scope: platform
- Decision:
  - Platform schemas, the adapter interface and the HTTP specs never name a model, vendor, RAG framework or tool-calling format. Models appear only as opaque `ModelProvider.model_ref` values and as the opaque `trace.backend` string.

### Context
- **Problem being solved:** `contracts/interfaces/adapter.ts` named specific models in the adapter documentation, which signals coupling that the brief forbids.
- **Requirements and constraints:** the platform must be stable if the finance team changes model provider, inference location, RAG, tool framework or memory strategy.
- **Assumptions:** none.
- **Non-goals:** banning model names from design discussion. `ARCHITECTURE.md` §4 may cite model classes as examples.

### Options considered
| Option | Advantages | Disadvantages | Why accepted or rejected |
|---|---|---|---|
| Opaque references only in contracts | Contracts survive any model swap | Less concrete documentation | **Accepted** |
| Name the recommended models in contracts | Concrete | Every model change touches the contracts | Rejected |

### Evidence and sources
| Source | Type | Specific finding used | Why this source is trustworthy | Accessed |
|---|---|---|---|---|
| Project brief | Requirement | Platform stability across model, provider, RAG and framework changes | Defines the requirement | 2026-11-14 |
| S10 `backend/src/index.ts:19` vs `Models.kt:15` | OSS | [fact] The model id is duplicated in two places, contradicting the repo's own "one constant" claim. Illustrates model-id churn. | Inspectable code | 2026-11-14 |

### Implementation
- **Components affected:** `contracts/interfaces/adapter.ts` (comment rewritten).
- **Contracts or schemas affected:** none (already compliant).
- **Configuration / feature flags:** none.
- **Tests or demo checks required:** review rule: `grep -rinE 'gemma|gpt|claude|gemini|llama' contracts/schemas contracts/interfaces contracts/http` returns nothing.
- **Migration or rollback plan:** n/a.

### Consequences
- **Benefits:** a model swap never requires a contract release.
- **Costs and limitations:** none.
- **Failure behavior:** n/a.
- **Security/privacy implications:** none.
- **What this intentionally does not solve:** model evaluation, which belongs to the fixtures and the shadow/canary process.

### Revisit triggers
- Revisit this decision never for contracts. Revisit the examples in `ARCHITECTURE.md` §4 when model choices change.

---

## DEC-011 — Turn-based request/response, not realtime speech-to-speech; "stop" aborts but never applies

- Status: accepted
- Date: 2026-11-14 (confirms the existing turn model, with evidence; adds barge-in semantics)
- Owner: platform + companion workstreams
- Scope: platform
- Decision:
  - Each voice turn is ASR on the phone → `VoiceIntent` → capability → verified `DomainResponse` → TTS, rather than a persistent realtime speech-to-speech model session. A user "stop" or barge-in flushes TTS playback immediately, fires the adapter's `AbortSignal`, and propagates the abort to remote calls. Pending proposals stay pending and are never applied as a side effect of an abort.

### Context
- **Problem being solved:**
  - Both glasses references use realtime speech-to-speech sessions (Gemini Live, OpenAI Realtime). That bypasses any server-side composer, so it would bypass our ≤ 25-word budget and our calc_id verification.
  - Our design also had no stated barge-in semantics.
- **Requirements and constraints:**
  - The LLM must never be the source of spoken figures.
  - The speech budget and discreet mode are enforced by the platform.
  - The latency target is p50 < 2.5 s.
- **Assumptions:** [assumption] turn-based latency meets the target with an earcon plus a progress filler (ARCHITECTURE.md §4.3). To be measured.
- **Non-goals:** open-ended conversational companionship.

### Options considered
| Option | Advantages | Disadvantages | Why accepted or rejected |
|---|---|---|---|
| Turn-based, platform-composed speech | Every spoken number is verified; model-agnostic | Higher latency than streaming speech-to-speech | **Accepted** |
| Realtime speech-to-speech session (GemGlasses, VisionClaw) | Low latency, natural barge-in | The model speaks unverified figures directly; vendor-specific session protocol; always-open mic | Rejected |
| Hybrid: realtime for chit-chat, turn-based for finance | Natural feel | Two audio stacks; routing ambiguity | Rejected for now |

### Evidence and sources
| Source | Type | Specific finding used | Why this source is trustworthy | Accessed |
|---|---|---|---|---|
| S10 `AgentController.kt:142-144`, `LiveSession.kt:161` (https://github.com/lpecom/GemGlasses) | OSS (MIT) | [fact] The mic streams for the whole session; the model does turn-taking | Inspectable code | 2026-11-14 |
| S10 `SpeakerSink.kt:57-63` | OSS | [fact] Barge-in is a playback-buffer `flush()` | Inspectable code | 2026-11-14 |
| S11 `GeminiSessionViewModel.swift:44-52` (pre-LiveKit) | OSS | [fact] Half-duplex mic mute when hardware echo cancellation is unavailable | Inspectable code | 2026-11-14 |
| S11 `agent/main.py:681-700` | OSS | [fact] "Two-speed" delegation: speak an acknowledgement, deliver a late result, park it if the user hung up | Inspectable code | 2026-11-14 |
| S10 `AgentController.kt:124`; S11 `ToolCallRouter.swift:120-129` | OSS | [fact] Tool cancellation is only local; [inference] remote work continues | Inspectable code | 2026-11-14 |

### Implementation
- **Components affected:**
  - L2 TTS: immediate flush, and half-duplex mic when echo cancellation is unavailable.
  - L3 turn manager: abort propagation.
  - Adapters: honour `signal`.
- **Contracts or schemas affected:**
  - `contracts/interfaces/adapter.ts`: the cancellation contract is documented.
  - `VoiceIntent.platform_intent: "stop"` already exists.
- **Configuration / feature flags:** none.
- **Tests or demo checks required:**
  - Say "stop" mid-answer: audio stops within 200 ms, no proposal is applied, and the trace shows the abort.
  - Abort during a remote agent call: the agent receives the cancellation.
- **Migration or rollback plan:** n/a.

### Consequences
- **Benefits:** grounded speech; model-agnostic audio stack.
- **Costs and limitations:**
  - Latency.
  - Late-arriving results are dropped. A "parked result" mechanism is deferred.
- **Failure behavior:** abort → no `final` event is delivered to the user; the turn is logged as cancelled.
- **Security/privacy implications:** no always-open mic, and the mic opens only on invocation.
- **What this intentionally does not solve:** delivering results after the user stops listening.

### Revisit triggers
- Revisit this decision if measured p50 exceeds 3.5 s on the demo path, or if a realtime API supports server-side output filtering, so that speech could be verified before playback.

---

## DEC-012 — Harden confirmations: canonical hash, single use, bound to turn and capability, idempotent apply

- Status: proposed
- Date: 2026-11-14
- Owner: platform workstream (needs agreement from the S-Bank Coach team on `/v1/confirm`)
- Scope: security
- Decision:
  - The proposal is:
    - `payload_hash` is the full SHA-256 of the RFC 8785 canonical JSON of the domain-held payload;
    - the signed `UserConfirmation` additionally binds `capability_id`, `kind` and the originating `turn_id`;
    - each confirmation is single-use and must be applied within a short window (default 120 s) after `confirmed_at`;
    - `onConfirmation` / `POST /v1/confirm` is idempotent on `confirmation_id`;
    - identical pending proposals are de-duplicated;
    - only turns originating from real user input on the companion can produce a confirmation. A model, agent, scheduler or domain never can.

### Context
- **Problem being solved:**
  - Today's rules (signature + payload hash) don't say how the hash is computed, whether a confirmation can be replayed, or what happens on a retried apply.
  - Open Instinct shows the failure modes a mature runtime guards against.
  - VisionClaw shows what happens without any of it: confirmations are auto-approved in code.
- **Requirements and constraints:**
  - Explicit confirmation for every persistent action.
  - Confirmation enforcement is a backend responsibility.
  - v1 is additive-only, so new fields must be optional in the schema and required by platform policy.
- **Assumptions:** the Coach team can store `confirmation_id`s for idempotency.
- **Non-goals:** cryptographic proof of human presence beyond the device's input event.

### Options considered
| Option | Advantages | Disadvantages | Why accepted or rejected |
|---|---|---|---|
| Canonical hash + binding + single use + idempotent apply | Closes replay, double-apply and substitution | Coach-side work; JCS library needed | **Proposed** |
| Keep current rules | No work | Hash computation undefined (two sides may disagree); replay possible | Rejected |
| Open Instinct-style channel trust (no signature) | Simple | Weaker than our signed confirmation | Rejected |
| Truncated hash; ±5 % amount tolerance (Open Instinct) | Short tokens | Weakens binding; finance must match exactly | Rejected |

### Evidence and sources
| Source | Type | Specific finding used | Why this source is trustworthy | Accessed |
|---|---|---|---|---|
| S12 `runtime.ts:1463-1484, 1150-1173` (https://github.com/mariagorskikh/open-instinct) | OSS (MIT) | [fact] Approvals bind to a sha256 of key-sorted args (truncated to 16 hex), plus conversation, requester, capability and tool. Spliced out on first use. | Inspectable code, verified | 2026-11-14 |
| S12 `approvals.ts:20`, `runtime.ts:100` | OSS | [fact] Pending approvals last 2 h; approved ones are usable for 15 min | Inspectable code | 2026-11-14 |
| S12 `core-tools.ts:253-275` | OSS | [fact] The model may settle an approval only on an owner-originated turn, never for money | Inspectable code | 2026-11-14 |
| S11 `gateway/src/turn.ts:4-25` (https://github.com/Intent-Lab/VisionClaw) | OSS (no licence) | [fact] `always_ask` tool confirmations are answered `"allow"` automatically | Inspectable code, verified | 2026-11-14 |
| S20 (https://www.rfc-editor.org/rfc/rfc8785) | IETF standard | Canonical JSON serialisation for hashing | Standard (not fetched this session) | — |

### Implementation
- **Components affected:** L3 proposal ledger and signer; companion confirm flow; coach `/v1/confirm`.
- **Contracts or schemas affected:**
  - `user_confirmation.schema.json`: add optional `capability_id`, `kind`, `turn_id`, `apply_by`.
  - `action_proposal.schema.json`: a description of the hash algorithm.
  - `coach-agent.openapi.yaml`: idempotency semantics on `/v1/confirm`.
- **Configuration / feature flags:** `confirm_apply_window_s` (default 120).
- **Tests or demo checks required:**
  - Replaying the same confirmation → `409 PROPOSAL_ALREADY_DECIDED`.
  - A retried apply returns the original `ActionResult`.
  - A model-originated confirm attempt is rejected.
- **Migration or rollback plan:** additive optional fields. Enforcement is behind the flag `confirm_hardening`.

### Consequences
- **Benefits:** closes the replay, double-apply and payload-substitution gaps.
- **Costs and limitations:** Coach-side idempotency storage.
- **Failure behavior:** apply after the window → `PROPOSAL_EXPIRED`; the user re-confirms.
- **Security/privacy implications:** strengthens the core trust guarantee.
- **What this intentionally does not solve:** a compromised companion device.

### Revisit triggers
- Accept this decision when the Coach team agrees to `/v1/confirm` idempotency. Revisit if confirmations must work offline.

---

## DEC-013 — Add an `AuditEvent` contract with per-kind allowlisted fields

- Status: proposed
- Date: 2026-11-14
- Owner: platform workstream
- Scope: security
- Decision:
  - The proposal is an append-only `platform.audit_event/v1`, partitioned by `user_ref`, with kinds `policy_decision | proposal_created | confirmation_received | proposal_applied | proposal_rejected | consent_changed | capture_stored | capture_deleted | error`. It records IDs, hashes, codes and outcomes, never utterances, amounts, merchant names or images, and each record carries `prev_hash` to make tampering evident.

### Context
- **Problem being solved:** the brief requires that audit enforcement be a backend responsibility, but no audit contract exists. Telemetry rules exist (no utterances or amounts) but don't cover the security audit trail.
- **Requirements and constraints:** data minimisation; the user can see their own trail (MyData); the store is separate from telemetry.
- **Assumptions:** none.
- **Non-goals:** a SIEM integration, or regulatory-grade immutability (WORM storage).

### Options considered
| Option | Advantages | Disadvantages | Why accepted or rejected |
|---|---|---|---|
| Typed events with per-kind field allowlists + hash chain | Minimal data; tampering evident | Schema work | **Proposed** |
| Free-form `detail` object (Open Instinct `AuditEntry`) | Flexible | Leaks argument and result previews (300-character clips) | Rejected |
| Use telemetry as the audit trail | One pipeline | Sampling and retention differ; wrong access model | Rejected |

### Evidence and sources
| Source | Type | Specific finding used | Why this source is trustworthy | Accessed |
|---|---|---|---|---|
| S12 `types.ts:203-220`, `audit.ts:28-33`, `runtime.ts:1429-1451` | OSS (MIT) | [fact] Audit kinds include policy, approval, tool_call, error. Stored as append-only JSONL with no chain. Argument and result previews clipped at 300 characters. | Inspectable code | 2026-11-14 |
| S12 `runtime.ts:737-762` | OSS | [fact] A policy decision is written to the audit log before allow, ask or deny takes effect | Inspectable code, verified | 2026-11-14 |
| S11 `gateway/src/trace.ts:1-10` | OSS | [fact] Text-only trace; image-like fields stripped | Inspectable code | 2026-11-14 |

### Implementation
- **Components affected:** L3 (writer), L7 (store), phone UI ("activity" view, later).
- **Contracts or schemas affected:** new `audit_event.schema.json` plus examples.
- **Configuration / feature flags:** none.
- **Tests or demo checks required:** a schema test that an event with a forbidden field (e.g. `amount`) is rejected.
- **Migration or rollback plan:** new contract; nothing to migrate.

### Consequences
- **Benefits:** accountability without data hoarding.
- **Costs and limitations:** a write on every security-relevant step.
- **Failure behavior:** an audit write failure blocks the proposal apply (fail closed). It never blocks read-only answers.
- **Security/privacy implications:** positive. Retention is to be decided together with DEC-014.
- **What this intentionally does not solve:** external attestation.

### Revisit triggers
- Accept this decision before any real (non-synthetic) user data is used.

---

## DEC-014 — Add `ConsentGrant`, read-only data scopes, and revocation that purges derived data

- Status: proposed
- Date: 2026-11-14
- Owner: platform + finance adapter workstreams
- Scope: data
- Decision:
  - The proposal has five parts:
    - **`ConsentGrant` contract.** Fields: `{consent_grant_id, user_ref, capability_id, data_classes[], purposes[], scopes[], granted_at, expires_at, last_reauth_at, status: active|revoked|expired, revoked_at?}`.
    - **Tool scopes.** Each `DeterministicTool` declares `required_scopes[]` from a read-only vocabulary (e.g. `finance.transactions:read`, `finance.balance:read`). No finance `:write` scope exists.
    - **Missing consent.** Responses use `CONSENT_REQUIRED`, `CONSENT_REVOKED` and `INSUFFICIENT_SCOPE` (non-retryable).
    - **Revocation purges derived data.** It invalidates tokens and purges data keyed by the grant: cached `calc_id` results, cached cards, captures and embeddings. `get_calculation` then returns `CONSENT_REVOKED` rather than stale numbers.
    - **Partial consent.** It lowers `data_mode` / `confidence` and shows up in `missing_data`, rather than failing silently.

### Context
- **Problem being solved:** `consent_grant_id` is referenced everywhere, but there is no grant contract, no scopes and no revocation semantics. The brief names read-only scopes, OAuth/consent and revocation.
- **Requirements and constraints:**
  - Permissioned, optional enrichment (S Group retail and receipt data must not be required).
  - Token audience binding.
  - The hackathon uses synthetic data only.
- **Assumptions:** [assumption] a real S-Bank integration would use PSD2 AIS through the Crosskey sandbox (S15, S16). Unverified, because the portal could not be read.
- **Non-goals:** implementing OAuth for the hackathon. [mock] Use one combined consent screen (ARCHITECTURE.md §6).

### Options considered
| Option | Advantages | Disadvantages | Why accepted or rejected |
|---|---|---|---|
| Grant contract + read-only scope vocabulary + purge-on-revoke | Matches agent-auth standards and PSD2 re-auth; testable | Design work; Coach-side purge | **Proposed** |
| Data classes in the manifest only (status quo) | Already exists | No lifecycle, no revocation, no scope-to-tool mapping | Rejected as insufficient |
| Copy "FYN" patterns | — | No verifiable public source exists (S17) | Rejected |

### Evidence and sources
| Source | Type | Specific finding used | Why this source is trustworthy | Accessed |
|---|---|---|---|---|
| S13 (https://modelcontextprotocol.io/specification/2025-06-18/basic/authorization) | Normative spec | [fact] Public clients MUST use PKCE; servers SHOULD issue short-lived access tokens and MUST rotate refresh tokens for public clients; MUST validate audience (RFC 8707); MUST NOT pass tokens through; 403 for insufficient scope | Normative standard | 2026-11-14 |
| S14 (https://eur-lex.europa.eu/eli/reg_del/2022/2360/oj/eng) | EU regulation | [fact] AIS access requires SCA renewal every 180 days (read via the official summary) | Primary law | 2026-11-14 |
| S15 (https://www.s-pankki.fi/fi/yhtiot/open-banking/) | Official bank page | [fact] Third parties must use S-Bank's dedicated PSD2 interfaces; sandbox via Crosskey | Primary | 2026-11-14 |
| S17 `dacobri/fynn…/backend/agent.py:53-82` | Unlicensed repo | [fact] LLM-written SQL with "read-only" only in a docstring; `REAL` float amounts. **This is the anti-pattern.** | Inspectable code | 2026-11-14 |

### Implementation
- **Components affected:** L3 consent registry; tool descriptors; finance engine caches; phone consent UI.
- **Contracts or schemas affected:**
  - New `consent_grant.schema.json`.
  - `tool_descriptor.schema.json` gains optional `required_scopes`.
  - The error code registry gains the consent codes.
- **Configuration / feature flags:** none.
- **Tests or demo checks required:**
  - Revoke receipts consent → a receipt card disappears, and resolving its `calc_id` returns `CONSENT_REVOKED`.
- **Migration or rollback plan:** additive.

### Consequences
- **Benefits:** real revocation; least privilege; ready for a real bank integration.
- **Costs and limitations:** purge plumbing on the finance side.
- **Failure behavior:** consent check unavailable → deny (fail closed) with `CONSENT_REQUIRED`.
- **Security/privacy implications:** strongly positive.
- **What this intentionally does not solve:** PSD2 licensing (AISP status).

### Revisit triggers
- Accept this decision before connecting any real account data. Revisit if the S-Bank sandbox's consent model differs.

---

## DEC-015 — Opt out of Meta SDK analytics and crash reporting in the companion

- Status: accepted
- Date: 2026-11-14
- Owner: companion workstream
- Scope: security
- Decision:
  - The companion sets the DAT analytics and crash-reporting opt-outs (iOS `Info.plist` `MWDAT > Analytics > OptOut` and `MWDAT > CrashReporting > OptOut`; Android manifest meta-data `com.meta.wearable.mwdat.CRASH_REPORTING_OPT_OUT`).

### Context
- **Problem being solved:** the SDK sends analytics and crash reports **by default**. A finance app should not share usage data with a third party it hasn't disclosed.
- **Requirements and constraints:**
  - Data minimisation.
  - S08 §6 requires a privacy policy that covers any data sharing.
- **Assumptions:** [assumption] Android has an analytics opt-out equivalent to iOS's. Only the crash-reporting key was confirmed, so check the Android README at build time.
- **Non-goals:** opting out of data Meta needs to operate the device link.

### Options considered
| Option | Advantages | Disadvantages | Why accepted or rejected |
|---|---|---|---|
| Opt out | Minimal sharing; simpler privacy policy | Meta gets less diagnostic data on our crashes | **Accepted** |
| Keep the defaults | Better vendor support | Undisclosed third-party data flow from a finance app | Rejected |

### Evidence and sources
| Source | Type | Specific finding used | Why this source is trustworthy | Accessed |
|---|---|---|---|---|
| S01 `README.md` (https://github.com/facebook/meta-wearables-dat-ios) | Official docs | [fact] The analytics and crash-reporting opt-out keys under `MWDAT` in `Info.plist` | Primary | 2026-11-14 |
| S02 sample manifest (https://github.com/facebook/meta-wearables-dat-android) | Official sample | [fact] `com.meta.wearable.mwdat.CRASH_REPORTING_OPT_OUT` | Primary | 2026-11-14 |
| S08 §5–§6 (https://wearables.developer.meta.com/terms) | Legal | [fact] A privacy policy is required; no selling Technology Data | Primary | 2026-11-14 |

### Implementation
- **Components affected:** companion app configuration.
- **Contracts or schemas affected:** none.
- **Configuration / feature flags:** build-time plist and manifest keys.
- **Tests or demo checks required:** a build-config review checklist item.
- **Migration or rollback plan:** remove the keys.

### Consequences
- **Benefits:** less third-party data flow.
- **Costs and limitations:** less vendor crash insight.
- **Failure behavior:** n/a.
- **Security/privacy implications:** positive.
- **What this intentionally does not solve:** data Meta processes to run the device link.

### Revisit triggers
- Revisit this decision if Meta support requires crash reports to diagnose an SDK issue (enable temporarily in debug builds only).

---

## DEC-016 — Build the native companion for one OS; no cross-platform wrapper for DAT

- Status: accepted
- Date: 2026-11-14 (backfilled from the former `PLATFORM_ARCHITECTURE.md` §9 decision 1)
- Owner: companion workstream
- Scope: companion
- Decision:
  - For the hackathon, the companion is built natively (Swift or Kotlin) for the OS of the phone paired with the team's glasses, with no React Native or Flutter bridge around DAT.

### Context
- **Problem being solved:** 48 hours, one glasses device, and a native-only SDK.
- **Requirements and constraints:** DAT ships only as a Swift Package and Kotlin Maven artifacts.
- **Assumptions:** [assumption] the team has one person fluent in the chosen OS.
- **Non-goals:** store-ready apps for both OSes.

### Options considered
| Option | Advantages | Disadvantages | Why accepted or rejected |
|---|---|---|---|
| Native, one OS | Direct SDK access; follows the samples exactly | Second OS later | **Accepted** |
| Native, both OSes | Coverage | Doubles the riskiest workstream | Rejected |
| Cross-platform wrapper | Shared UI | Hand-written bridge over a closed, fast-moving SDK | Rejected |

### Evidence and sources
| Source | Type | Specific finding used | Why this source is trustworthy | Accessed |
|---|---|---|---|---|
| S04 (https://wearables.developer.meta.com/docs/develop/dat) | Official docs | [fact] Native SDKs: iOS 17.2+ (Swift Package), Android 10+ (Kotlin/Maven) | Primary | 2026-11-14 |
| S01 `project.pbxproj:777` | Official sample | [fact] The SDK is pinned by `exactVersion` as closed binaries | Primary | 2026-11-14 |

### Implementation
- **Components affected:** companion.
- **Contracts or schemas affected:** generated Swift *or* Kotlin types are used, and the other is still generated.
- **Configuration / feature flags:** none.
- **Tests or demo checks required:** at hour 3 the app builds on the real phone and registers through Meta AI.
- **Migration or rollback plan:** the second OS reuses the contracts and generated types.

### Consequences
- **Benefits:** lowest integration risk.
- **Costs and limitations:** single-OS demo.
- **Failure behavior:** n/a.
- **Security/privacy implications:** none.
- **What this intentionally does not solve:** cross-platform parity.

### Revisit triggers
- Revisit this decision after the hackathon, or if Meta ships an official cross-platform SDK.

---

## DEC-017 — One capability-adapter interface for remote, on-device and template backends

- Status: accepted
- Date: 2026-11-14 (backfilled from §9 decision 2, with evidence)
- Owner: platform + finance adapter workstreams
- Scope: finance adapter
- Decision:
  - The orchestrator calls capabilities only through `AgentOrchestratorAdapter { manifest, handle, onConfirmation, health }`. `SBankCoachAdapter` selects among the remote agent, an on-device agent and a deterministic fast path behind it. There is no multi-agent orchestration and no free-text "execute(task)" tool.

### Context
- **Problem being solved:** the finance agent may change model, location, framework or tools at any time. The platform must not notice.
- **Requirements and constraints:**
  - Versioned and validated requests and responses.
  - Capability manifests.
  - Mocks for every dependency.
  - Graceful degradation (model → deterministic).
- **Assumptions:** none.
- **Non-goals:** agent-to-agent protocols.

### Options considered
| Option | Advantages | Disadvantages | Why accepted or rejected |
|---|---|---|---|
| One typed adapter interface, with a fast path inside the adapter | Stable boundary; offline/demo fallback; evaluation baseline | Adapter owns the backend-selection logic | **Accepted** |
| Free-text task delegation to an agent gateway (VisionClaw `execute(task)` → OpenClaw) | Very flexible | Cannot be schema-validated or tied to calc_ids; unbounded actions | **Rejected** |
| Platform calls finance tools directly | Simple | Platform learns finance internals | Rejected |

### Evidence and sources
| Source | Type | Specific finding used | Why this source is trustworthy | Accessed |
|---|---|---|---|---|
| S11 `OpenClaw/ToolCallModels.swift:123-137`, `OpenClawBridge.swift:78-105` (https://github.com/Intent-Lab/VisionClaw @ `1db325a`) | OSS | [fact] A single free-text `execute(task)` tool is forwarded to an action gateway | Inspectable code | 2026-11-14 |
| S11 `gateway/src/provision.ts:122-132` | OSS | [fact] The action agents run with `permission_policy: always_allow` | Inspectable code | 2026-11-14 |
| S12 `tools.ts:38-45, 101-112` | OSS (MIT) | [fact] Typed `ToolSpec` with declared capabilities. Tool visibility is a convenience; the guard enforces. | Inspectable code | 2026-11-14 |

### Implementation
- **Components affected:** L4/L5.
- **Contracts or schemas affected:** `contracts/interfaces/adapter.ts`; `http/coach-agent.openapi.yaml`.
- **Configuration / feature flags:** `coach_backend` = `remote | on_device | fast_path`.
- **Tests or demo checks required:** the fixture runner replays golden cases through every backend. Kill the agent and get the same numbers from `fast_path`.
- **Migration or rollback plan:** n/a.

### Consequences
- **Benefits:** the agent can be swapped freely; the demo survives an agent outage.
- **Costs and limitations:** templates must be written for fast-path intents.
- **Failure behavior:** agent slow (> 3.5 s) or down → fast path for supported intents.
- **Security/privacy implications:** no unbounded action surface.
- **What this intentionally does not solve:** cross-capability flows. Those go through L3 (ARCHITECTURE.md §7.1).

### Revisit triggers
- Revisit this decision if a capability needs long-running background work that does not fit a request/response turn.

---

## DEC-018 — The platform owns confirmation; domains only propose; money-moving action kinds are rejected

- Status: accepted
- Date: 2026-11-14 (backfilled from §9 decision 3, with evidence)
- Owner: platform workstream
- Scope: security
- Decision:
  - Capabilities return `ActionProposal`s and apply them only on a platform-signed `UserConfirmation`. The schema rejects any action kind with a segment `payment|transfer|purchase|credit|loan`, and the channel rules (hands-free only for low-risk, reversible actions; biometric only for high-risk ones) are enforced in JSON Schema and again in L3.

### Context
- **Problem being solved:** an LLM-driven coach must never move money or persist changes without explicit user confirmation.
- **Requirements and constraints:** explicit confirmation; no direct mutation by the LLM; enforcement in the backend.
- **Assumptions:** none.
- **Non-goals:** payments.

### Options considered
| Option | Advantages | Disadvantages | Why accepted or rejected |
|---|---|---|---|
| Platform-owned, signed confirmation; schema-level kind ban | Enforced in code, not prompts; uniform across domains | Platform builds a proposal ledger | **Accepted** |
| Confirmation instruction in the agent prompt (VisionClaw era 1) | No work | Not enforceable | **Rejected** |
| Domain-owned confirmation | Domain flexibility | Every domain re-implements trust; inconsistent UX | Rejected |

### Evidence and sources
| Source | Type | Specific finding used | Why this source is trustworthy | Accessed |
|---|---|---|---|---|
| S11 `GeminiConfig.swift:50` (@ `1db325a`) | OSS | [fact] The only confirmation step is a prompt sentence: "confirm recipient and content … unless clearly urgent" | Inspectable code | 2026-11-14 |
| S11 `agent/main.py:849-855` | OSS | [fact] The `browse` tool is told it may "buy, place an order, check out" | Inspectable code | 2026-11-14 |
| S12 `SECURITY.md:71-72`, `runtime.ts:737-762` | OSS (MIT) | [fact] "The guard is code, not prompt text", evaluated before every tool call | Inspectable code, verified | 2026-11-14 |
| `contracts/examples/v1/invalid/action_proposal.payment_kind.json` | Our test | [fact] A payment kind is rejected by the schema | Executable | 2026-11-14 |

### Implementation
- **Components affected:** L3 proposal ledger and signer; all adapters.
- **Contracts or schemas affected:** `common.schema.json#/definitions/ActionKind`, `ConfirmationPolicyRules`; `user_confirmation.schema.json`.
- **Configuration / feature flags:** none.
- **Tests or demo checks required:** the existing invalid examples (payment kind, gesture on medium risk, high risk without biometric, voice with low confidence).
- **Migration or rollback plan:** n/a. Hardening continues in DEC-012.

### Consequences
- **Benefits:** a trust guarantee that holds regardless of the agent.
- **Costs and limitations:** a proposal round-trip for every change.
- **Failure behavior:** no confirmation accepted while offline.
- **Security/privacy implications:** core safety property.
- **What this intentionally does not solve:** replay and idempotency (DEC-012).

### Revisit triggers
- Revisit this decision only if a regulated payment flow is ever in scope. It would need a separate capability, separate risk review and SCA.

---

## DEC-019 — The finance engine is the only source of money values; RAG is educational only

- Status: accepted
- Date: 2026-11-14 (backfilled from §9 decision 4)
- Owner: finance adapter workstream
- Scope: finance adapter
- Decision:
  - Every money value shown or spoken comes from a deterministic finance tool result carrying a `calc_id`, which the adapter resolves independently before setting `trace.verified`. RAG may supply only `educational` content, labelled and cited.

### Context
- **Problem being solved:** LLMs and retrieval invent or mis-aggregate numbers. Users must be able to trust totals, affordability and forecasts.
- **Requirements and constraints:**
  - Typed, deterministic tools for structured queries.
  - The LLM never invents figures.
  - Factual, calculated, estimate and educational content are kept distinct.
- **Assumptions:** the Coach team returns `calc_id`s (agreed in the contract at hour 1).
- **Non-goals:** specifying the engine's internals (owned by the Coach team; see `finance/REFERENCE_DESIGN.md`).

### Options considered
| Option | Advantages | Disadvantages | Why accepted or rejected |
|---|---|---|---|
| Engine-only figures + calc_id verification | Auditable, exact, testable without a model | Coach team must expose calculation lookup | **Accepted** |
| RAG over transactions | Quick to build | No completeness guarantee; no date or sign semantics; not auditable | Rejected (ARCHITECTURE.md §4.7) |
| LLM-written SQL (`fynn` repo) | Flexible queries | Read-only not enforced; float money; unverifiable | **Rejected** |

### Evidence and sources
| Source | Type | Specific finding used | Why this source is trustworthy | Accessed |
|---|---|---|---|---|
| S17 `dacobri/fynn-talk-to-your-finances/backend/agent.py:53-82` | Unlicensed repo | [fact] `run_sql(query)` executes LLM-written SQL on a plain read-write connection; amounts are `REAL`; results silently cut at 100 rows | Inspectable code | 2026-11-14 |
| `contracts/examples/v1/invalid/domain_response_event.verified_with_unverified_value.json`, `tool_result.success_without_calc_id.json` | Our tests | [fact] The schemas enforce the calc_id and verification rules | Executable | 2026-11-14 |

### Implementation
- **Components affected:** L5 adapter verifier; L6 engine calculation log.
- **Contracts or schemas affected:** `tool_result`, `domain_response`, `insight_card`, finance overlay (all existing).
- **Configuration / feature flags:** none.
- **Tests or demo checks required:** grounding-verifier failures = 0 on the fixtures; the "How was this calculated?" tap in the demo.
- **Migration or rollback plan:** n/a.

### Consequences
- **Benefits:** every figure is traceable.
- **Costs and limitations:** extra lookup latency (small).
- **Failure behavior:** engine down → "I can't check your data right now". Never a model-generated substitute.
- **Security/privacy implications:** models see tool results, never the ledger.
- **What this intentionally does not solve:** the correctness of the engine itself (golden fixtures cover that).

### Revisit triggers
- Revisit this decision never for the principle. Revisit the verification tolerance (rounding in spoken estimates) if users find it confusing.

---

## DEC-020 — Cloud agent for the hackathon; local routing later; Meta AI Connectors later

- Status: accepted
- Date: 2026-11-14 (backfilled from §9 decisions 5–6)
- Owner: platform workstream
- Scope: demo
- Decision:
  - For the hackathon, the Coach agent runs wherever the Coach team chooses (expected: cloud), with on-device ASR and TTS and the deterministic fast path as fallback. On-device intent routing with templates is the production direction. Meta AI Connectors are a later channel that would call the same adapter through L3.

### Context
- **Problem being solved:** choosing an inference location without coupling the platform to it.
- **Requirements and constraints:**
  - Model-agnostic (DEC-010).
  - Latency target p50 < 2.5 s.
  - Privacy: tool results only, never the ledger.
- **Assumptions:** [assumption] venue network is adequate; there is a phone hotspot backup.
- **Non-goals:** shipping a local LLM in 48 hours.

### Options considered
| Option | Advantages | Disadvantages | Why accepted or rejected |
|---|---|---|---|
| Cloud agent + fast path now; local router later | Lowest effort; honest demo | Network dependency | **Accepted** |
| Local LLM now (small on-device model, e.g. FunctionGemma-class router, S19) | Privacy, offline | High effort; quality risk in Finnish | Deferred |
| Meta AI Connectors as the primary channel | Distribution through Meta AI | Developer preview / early access (sources conflict) | Deferred |

### Evidence and sources
| Source | Type | Specific finding used | Why this source is trustworthy | Accessed |
|---|---|---|---|---|
| S05 (https://developers.meta.com/wearables/faq/) | Official FAQ | [fact] "Meta AI Connectors are available in developer preview" | Primary | 2026-11-14 |
| S07 (https://developers.meta.com/blog/meta-connect-recap-ai-glasses/) | Official blog | [fact] Connectors described as early access with sign-up. **Conflicts with S05.** | Primary | 2026-11-14 |
| S19 (https://ai.google.dev/gemma/docs/functiongemma/model_card) | Model docs | Example of a small router model class | Official, not re-checked | carried over |

### Implementation
- **Components affected:** none now. `ModelProvider` registry entries and an `OnDeviceAgentBackend` stub.
- **Contracts or schemas affected:** none.
- **Configuration / feature flags:** `coach_backend`.
- **Tests or demo checks required:** the demo runs with the agent killed (fast path).
- **Migration or rollback plan:** n/a.

### Consequences
- **Benefits:** lowest risk.
- **Costs and limitations:** depends on the network.
- **Failure behavior:** no network → cached cards labelled stale; no proposals.
- **Security/privacy implications:** utterances leave the device only with consent.
- **What this intentionally does not solve:** offline answers.

### Revisit triggers
- Revisit this decision if Connectors become generally available, or if fixture evaluation shows a local router matching cloud intent accuracy.

---

## DEC-021 — Voice invocation only launches the app; our ASR captures the question and the router picks the capability from the transcript

- Status: accepted
- Date: 2026-11-14
- Owner: companion + platform workstreams
- Scope: glasses
- Decision:
  - We treat *"Hey Meta, start ‹app›"* purely as a launch/foreground signal: the companion acknowledges the `LaunchApp` action exactly once, plays an earcon, and opens its own listening window on the HFP mic. The question is transcribed by our ASR, and L3 chooses the capability from that transcript. Capabilities never get their own invocation phrase.

### Context
- **Problem being solved:**
  - The demo script and §7 assumed a one-breath invocation that carries the question and names the capability (*"Hey Meta, ask S-Bank Coach: does this fit my week?"*).
  - DAT's voice invocation delivers no utterance.
- **Requirements and constraints:**
  - Glasses-first start.
  - Model-agnostic, platform-owned routing.
  - More capabilities later without new glasses configuration.
  - The feature is experimental (DEC-004).
- **Assumptions:** [assumption] the app is launched or foregrounded fast enough that the user doesn't start speaking before the earcon. Measure at hour 0, and tell the presenter to wait for the earcon.
- **Non-goals:** a custom wake word, or always-listening behaviour.

### Options considered
| Option | Advantages | Disadvantages | Why accepted or rejected |
|---|---|---|---|
| Launch-then-listen; route on our transcript | Matches the SDK; one app name for all capabilities; routing stays in L3 | Two-step start (invocation, earcon, question) | **Accepted** |
| One-breath invocation carrying the question | Most natural | The SDK delivers no utterance | Rejected: not possible |
| A spoken app name per capability | "Hey Meta, start Home" | One integration has one app name; each would need its own approval; it couples glasses configuration to the capability list | Rejected |
| Meta AI Connectors / WebMCP to capture the question via Meta AI | Meta AI hears the utterance | Preview or off by default; Meta AI, not our verifier, would shape the answer (DEC-003, DEC-020) | Rejected for now |

### Evidence and sources
| Source | Type | Specific finding used | Why this source is trustworthy | Accessed |
|---|---|---|---|---|
| S01 `plugins/mwdat-ios/skills/voice-invocations/SKILL.md:8,12,46` (https://github.com/facebook/meta-wearables-dat-ios) | Official SDK guidance | [fact] "Voice Invocations lets Meta AI launch or foreground an app when the wearer says 'Hey Meta, start {app name}.'" It is a Wearables-level stream, not a `DeviceSession` capability. Configure approval and "the spoken app name in Wearables Developer Center". It is experimental and cannot ship to production channels. | Primary, verified in the clone | 2026-11-14 |
| S01 `AGENTS.md:1345-1347` | Official SDK guidance | [fact] "Handle `LaunchApp`, and answer every invocation exactly once through its response handle." It needs no camera or mic permission. | Primary | 2026-11-14 |
| S01 `samples/BirdSpotter/BirdSpotter/Data/Dat/DatGlassesVoiceRepository.swift:260-268` | Official sample | [fact] `LaunchApp` is acknowledged with `sendSuccess(actionOutput: nil)`. [inference] There is no utterance payload to read. | Primary | 2026-11-14 |
| S21 (https://wearables.developer.meta.com/docs/develop/dat/voice-invocations/) | Official docs | Linked from the skill file as the reference guide | Primary (not fetched this session) | — |

### Implementation
- **Components affected:**
  - `GlassesBridge`: a voice-invocation stream registered before `start`, single acknowledgement.
  - Companion: earcon and listening window.
  - L3 router: capability chosen from the transcript.
  - The demo script (ARCHITECTURE.md §6) and the extensibility text (§7).
- **Contracts or schemas affected:**
  - None. `VoiceIntent.invocation: "hey_meta"` keeps its value; its meaning is documented in ARCHITECTURE.md §3.2.
  - `capability_hint` is derived from the transcript.
- **Configuration / feature flags:** `exp_voice_invocation`. The Developer Center needs Voice Invocation approval and the spoken app name.
- **Tests or demo checks required:**
  - Mock Device Kit `sendLaunchAppAction()` → earcon → listening.
  - `sendIncompleteAction()` → an error, not an invocation.
  - On device: measure invocation → earcon latency.
- **Migration or rollback plan:** the flag off means the capture button or push-to-talk starts listening.

### Consequences
- **Benefits:** honest with the SDK, and it scales to many capabilities with no glasses configuration.
- **Costs and limitations:** a two-step opening line in the demo.
- **Failure behavior:** invocation not received → the presenter uses the capture button or push-to-talk; the overlay shows the flag state.
- **Security/privacy implications:** the mic opens only after an explicit invocation or press. There is no always-listening behaviour.
- **What this intentionally does not solve:** natural one-breath requests.

### Revisit triggers
- Revisit this decision if DAT adds invocation types that carry an utterance or intent (beyond `LaunchApp`), or if Meta AI Connectors become generally available.

---

## DEC-022 — An hour-0 device gate on the real glasses sets the experimental-feature flags

- Status: accepted
- Date: 2026-11-14
- Owner: glasses / companion workstream
- Scope: demo
- Decision:
  - Before any feature work depends on the glasses, the team runs a scripted check on the actual demo device and phone. Its results set each `exp_*` flag and the capture resolution, and are recorded in the repo. A feature that fails the gate stays off for the demo.

### Context
- **Problem being solved:**
  - Capability availability "varies by device" (S05).
  - Five features we want are experimental and need approval (S03).
  - Capture latency is unpublished.
  - Discovering this at hour 30 would break the demo plan.
- **Requirements and constraints:** a 48-hour schedule; one glasses device; Developer Mode.
- **Assumptions:** the team has the demo glasses at hour 0.
- **Non-goals:** a formal device-compatibility matrix.

### Options considered
| Option | Advantages | Disadvantages | Why accepted or rejected |
|---|---|---|---|
| Scripted gate at hours 0–3 that sets the flags | Early truth; flags match reality; numbers for the budget | About 1 hour of WS1 time | **Accepted** |
| Build against docs and test late | No upfront cost | Late surprises on an experimental SDK | Rejected |
| Rely on the Mock Device Kit only | Fast | Mocks don't reveal device, firmware or approval issues | Rejected as the sole check (the mock stays for development) |

**Gate checklist.** Record each result in `docs/demo/device-gate.md`. That file doesn't exist yet; it is created at hour 0.
1. Registration through Meta AI. Camera permission granted (once or always). Mic permission granted via the OS.
2. HFP route established. A Finnish and an English test phrase are transcribed acceptably by the OS ASR.
3. Stream start → `capturePhoto` → photo data: median of 5 at medium resolution, and whether a price label and a receipt are legible.
4. Voice invocation *"Hey Meta, start ‹app›"* → `LaunchApp` → earcon latency. Sets `exp_voice_invocation`.
5. Inputs: a single tap is received when **no** stream is active. Sets `exp_inputs`.
6. Hinges close/open, doff/don, Bluetooth off. Each yields the expected `DeviceSessionState` and `degraded_reasons`.

### Evidence and sources
| Source | Type | Specific finding used | Why this source is trustworthy | Accessed |
|---|---|---|---|---|
| S05 (https://developers.meta.com/wearables/faq/) | Official FAQ | [fact] "Capability availability varies by device" | Primary | 2026-11-14 |
| S03 (https://github.com/facebook/meta-wearables-dat-ios/blob/main/CHANGELOG.md) | Release notes | [fact] Experimental features "may change between minor releases" | Primary | 2026-11-14 |
| S04 known issues | Official docs | [fact] Inputs double-press issue; Speech may stop after about 1 minute; display updates are held while a capture transfers | Primary | 2026-11-14 |

### Implementation
- **Components affected:** WS1 plan (ARCHITECTURE.md §8); flags in the companion.
- **Contracts or schemas affected:** none.
- **Configuration / feature flags:** `exp_voice_invocation`, `exp_inputs`, `exp_speech`, `exp_standalone_photo`, `exp_stream_audio`, `capture_resolution`.
- **Tests or demo checks required:** the gate checklist itself; re-run after any SDK or firmware update.
- **Migration or rollback plan:** n/a.

### Consequences
- **Benefits:** the demo plan rests on measured facts.
- **Costs and limitations:** about 1 hour at the start.
- **Failure behavior:** a failed item means its flag stays off and its publishable fallback becomes the demo path.
- **Security/privacy implications:** none.
- **What this intentionally does not solve:** behaviour on other device models.

### Revisit triggers
- Revisit this decision if the demo device or SDK version changes.

---

## DEC-023 — Capture turns get their own latency budget; the device session stays warm, the camera stream does not

- Status: accepted
- Date: 2026-11-14
- Owner: platform + companion workstreams
- Scope: companion
- Decision:
  - Capture turns are budgeted separately (target p50 < 4 s, p95 < 7 s to first answer word) from voice-only turns (p50 < 2.5 s, p95 < 5 s). The camera stream starts as soon as a capture is requested (capture button, or a capture keyword in the partial transcript) and stops right after the photo. The device session stays open between turns and stops after 2 minutes without interaction or when the app is backgrounded.

### Context
- **Problem being solved:**
  - The latency table covered voice-only turns.
  - The publishable capture path (DEC-006) adds stream start, photo transfer, upload and label reading.
  - Session start on every turn would add more.
- **Requirements and constraints:** no always-on camera; the HFP route must be settled before a stream starts (S04); filler speech must not consume the 25-word budget.
- **Assumptions:** [assumption] all capture-step figures until the hour-0 gate measures them (DEC-022).
- **Non-goals:** sub-second visual answers.

### Options considered
| Option | Advantages | Disadvantages | Why accepted or rejected |
|---|---|---|---|
| Separate budget; early stream start; warm session, cold camera | Honest targets; saves seconds without always-on capture | Keyword spotting on partial transcripts must be tuned | **Accepted** |
| Keep the camera stream running during a conversation | Instant photos | Continuous capture, against the brief; battery and thermal cost | Rejected |
| Start the session per turn | Simplest | Adds session-start latency to every turn | Rejected |
| One budget for all turns | Simple to communicate | Either unrealistic for captures or too loose for voice | Rejected |

### Evidence and sources
| Source | Type | Specific finding used | Why this source is trustworthy | Accessed |
|---|---|---|---|---|
| S04 microphones-and-speakers guide (https://wearables.developer.meta.com/docs/develop/dat) | Official docs | [fact] HFP must settle before the camera stream starts | Primary | 2026-11-14 |
| S01 `.cursor/rules/camera-streaming.mdc:68-89` | Official sample docs | [fact] Resolution and frame-rate options; the SDK degrades under bandwidth pressure | Primary | 2026-11-14 |
| S01 `CameraViewModel.swift:414-448` | Official sample | [fact] The iOS sample ends the session when the app is backgrounded | Primary | 2026-11-14 |
| S11 `agent/main.py:128-160` (https://github.com/Intent-Lab/VisionClaw) | OSS | [fact] Frame freshness is measured explicitly. [inference] Measure capture age the same way in our overlay. | Inspectable code | 2026-11-14 |

### Implementation
- **Components affected:** companion capture routine and partial-transcript keyword trigger; session idle timer; debug overlay (stream start → photo timing).
- **Contracts or schemas affected:** none (`ContextCapture.captured_at` already exists).
- **Configuration / feature flags:** `session_idle_timeout_s` (default 120), `capture_keywords` (fi/en/sv lists).
- **Tests or demo checks required:**
  - Latency breakdown in the overlay.
  - The 5-run median from the gate, written into ARCHITECTURE.md §4.3.
- **Migration or rollback plan:** keyword trigger off → the stream starts after ASR finalises (adds the finalisation time).

### Consequences
- **Benefits:** realistic targets; faster captures with the camera off by default.
- **Costs and limitations:**
  - A keyword false positive starts a stream that captures nothing. The stream is stopped and nothing is uploaded.
  - The device session uses battery while warm.
- **Failure behavior:** over budget → filler at 1.2 s, then the answer. Stream start failure → phone camera.
- **Security/privacy implications:** the camera is on only during a requested capture. Keyword-started streams that end without a photo upload nothing.
- **What this intentionally does not solve:** network latency to the cloud agent.

### Revisit triggers
- Revisit this decision when hour-0 measurements land (re-baseline), or if stream start exceeds about 2 s (consider the flag-gated standalone photo for the demo).

---

## DEC-024 — The S-Bank Coach team's Python engine runs behind a thin HTTP service that converts to our contracts

- Status: accepted
- Date: 2026-11-14
- Owner: platform workstream (service); S-Bank Coach team (engine)
- Scope: finance
- Decision:
  - The team's deterministic engine (`personal-economic-trainer`, `src/engine.py`) is imported unchanged by a small FastAPI service in `finance-engine/`. The service converts engine floats to decimal strings, wraps every result in `platform.tool_result/v1` with a `calc_id`, logs it per user, and serves `GET /v1/calculations/{calc_id}` for the backend's verifier. It records the engine commit and safety buffer on every result.

### Context
- **Problem being solved:**
  - The backend answered from a fixture engine (always flagged mock).
  - The team's real engine is Python (DuckDB, pandas) and returns floats without calculation IDs.
  - Our contracts require decimal strings and a resolvable `calc_id` on every figure (DEC-019).
- **Requirements and constraints:**
  - The engine stays the only source of money values.
  - We must not edit or commit in the team's repo: its `CLAUDE.md` forbids assistants from committing, and the owner reviews every change.
- **Assumptions:**
  - [assumption] The engine's per-customer queries stay under about 1 s (the README says < 1 s for the CLI).
  - [mock] "Today" is a fixed date inside the synthetic dataset (`FINANCE_AS_OF`, default 2026-09-05).
- **Non-goals:** real bank connectivity (PSD2); persistence of the calculation log across restarts.

### Options considered
| Option | Advantages | Disadvantages | Why accepted or rejected |
|---|---|---|---|
| HTTP service in our repo that imports the engine unchanged | One conversion point; calculation log; no edits to their repo; testable against our schemas | One more process to run | **Accepted** |
| Spawn `python engine.py` from the TypeScript backend per call | No extra service | Cold start on each call (loads CSV and parquet); no calculation log | Rejected |
| Port the engine to TypeScript | One runtime | Two copies of the maths that drift apart; duplicates the team's work | Rejected |
| Precompute JSON for the demo customers | Most robust on stage | Not live; affordability needs any price | Kept as a fallback idea, not built |

### Evidence and sources
| Source | Type | Specific finding used | Why this source is trustworthy | Accessed |
|---|---|---|---|---|
| S23 `src/engine.py` @ `617172b` (https://github.com/francesco-nicolo/personal-economic-trainer) | Team code | [fact] Five per-customer functions return JSON with floats rounded to 2 decimals and no IDs; one DuckDB connection is shared module-wide | The code itself | 2026-11-14 |
| S23 `CLAUDE.md` | Team instructions | [fact] "The LLM layer must never do arithmetic: every number shown to a user comes from a function in `src/engine.py`." Assistants must not commit there. | The team's own rule | 2026-11-14 |
| S22 dataset README (https://github.com/hackjunction/Junction-2026-S-pankki) | Official challenge data | [fact] Transactions include `balance_after_eur`, timestamps, categories and MCC | Organisers' repo | 2026-11-14 |

### Implementation
- **Components affected:** new `finance-engine/` (`pet_adapter.py`, `server.py`, tests); `backend/src/capabilities/sbank-coach/s-pankki-engine.ts` (`SPankkiFinanceEngine`, the third `FinanceEngine` source; resolves `calc_id`s through the service).
- **Contracts or schemas affected:** results validate against the finance overlay, with the additive changes in DEC-025.
- **Configuration / feature flags:** service: `PET_ROOT`, `PET_DATA`, `PET_OUT`, `FINANCE_AS_OF`, `FINANCE_USERS`. Backend: `FINANCE_SOURCE=s_pankki`, `FINANCE_ENGINE_URL`.
- **Tests or demo checks required:** `finance-engine/test_server.py` (10 tests: no floats, schema-valid envelopes, engine figures unchanged, user-scoped calculation lookup, demo and at-risk customers); `backend/test/s-pankki.test.ts` (6 tests against a fake of the service); one end-to-end run with both services on 2026-11-14.
- **Migration or rollback plan:** the backend keeps its fixture source; switching back is one setting.

### Consequences
- **Benefits:** real numbers from S-Pankki's dataset with full provenance; the verifier works unchanged.
- **Costs and limitations:**
  - Two figures are computed in the service until the engine has functions for them: the affordability verdict, and the effect of confirmed plans. Both are labelled in `assumptions`.
  - The calculation log is in memory.
- **Failure behavior:** service down → `CAPABILITY_UNAVAILABLE`, nothing invented, no silent fallback. A figure the service can't confirm on lookup is dropped by the verifier.
- **Security/privacy implications:** calculations resolve only for their own `user_ref` (404 otherwise). The dataset is synthetic.
- **What this intentionally does not solve:** an LLM layer; the engine's own correctness (owned by the team).

### Revisit triggers
- Revisit this decision when the team adds `affordability(...)` or plan support to the engine (delete the interim code), when the engine is deployed elsewhere, or if call latency exceeds about 1 s.

---

## DEC-025 — Money answers follow the engine: safe to spend today, until payday, not per week

- Status: accepted (2026-11-14, after the `FinanceEngine` seam and the `user_stated` source landed in `8db343d`)
- Date: 2026-11-14
- Owner: platform workstream + S-Bank Coach team
- Scope: finance
- Decision:
  - When the S-Pankki engine is the source (`FINANCE_SOURCE=s_pankki`), answers use its semantics: "safe to spend today", "free until payday", and for a purchase, what it leaves per day until payday. The demo opening becomes "Can I afford this?" instead of "Does this fit my week?".
  - Contracts change additively: a new tool name `finance.get_safe_to_spend_until_payday` with its own result definition, and optional `period`, `free_until_payday`, `days_to_payday`, `next_payday` and `safe_per_day_after` on `AffordabilityResult` (`safe_to_spend_week` is already nullable there).

### Context
- **Problem being solved:** the platform's answers, cards and contract examples are per week ("€90.16 through Sunday"). The engine computes a daily figure until payday and has no weekly figure.
- **Requirements and constraints:** no arithmetic outside the engine beyond what DEC-024 labels as interim; additive-only changes within v1.
- **Assumptions:** [assumption] the in-flight `user_stated` source (weekly amount said by the user) keeps weekly semantics, so both shapes must coexist.
- **Non-goals:** removing the weekly shape.

### Options considered
| Option | Advantages | Disadvantages | Why accepted or rejected |
|---|---|---|---|
| Use the engine's until-payday semantics; add a new tool result | Numbers are the engine's own; honest | Templates and examples need a second set of wording | **Proposed** |
| Derive a weekly figure (today × days left in the week) | Keeps current wording | Arithmetic outside the engine; misleading when payday is within the week | Rejected |
| Ask the team to add a weekly function | Keeps current wording, inside the engine | Their method and backtest are per pay cycle; weeks don't align with paydays | Rejected for now |
| Move to a v2 finance schema | Clean | Large change during the hackathon | Rejected |

### Evidence and sources
| Source | Type | Specific finding used | Why this source is trustworthy | Accessed |
|---|---|---|---|---|
| S23 `src/engine.py:safe_to_spend`, `docs/method.md` (https://github.com/francesco-nicolo/personal-economic-trainer) | Team code and method | [fact] safe = max(0, (balance − bills still due − irregular reserve − savings − cushion) / days to payday) | The method document | 2026-11-14 |
| S22 `docs/data-notes.md` in S23, dataset README (https://github.com/hackjunction/Junction-2026-S-pankki) | Challenge data | [fact] Salary mostly lands on the 15th; overdrafts follow the pay cycle | Derived from the official data | 2026-11-14 |

### Implementation
- **Components affected:** fast-path until-payday wording, cards and plan proposal (`fast-path.ts`, chosen by the result's tool name or `period`); the `FinanceEngine` interface now allows async sources (`Awaitable`); `docs/ARCHITECTURE.md` §6 demo script; READMEs; submission. The companion smoke and UI tests keep the weekly fixture flow, which is still the default.
- **Contracts or schemas affected:** `finance/finance.schema.json`: `finance.get_safe_to_spend_until_payday`, `PaydaySafeToSpendResult`, optional `period`, `free_until_payday`, `days_to_payday`, `next_payday`, `safe_per_day_after` on `AffordabilityResult` (required together when `period` is `until_payday`). `finance_tool_result.schema.json`: one new typed rule. Three valid examples generated from the real engine (CUST04069; CUST03420 at risk) and three invalid ones (float money, a weekly figure in an until-payday result, missing per-day figure).
- **Configuration / feature flags:** none beyond DEC-024's `FINANCE_SOURCE`.
- **Tests or demo checks required:** contract check (passes); backend suite (63 tests, weekly and until-payday shapes). Speech stays within 25 words and never speaks dates, so every number is traceable.
- **Migration or rollback plan:** the fixture and `user_stated` sources keep the weekly shape.

### Consequences
- **Benefits:** the spoken numbers are the engine's, backed by its two-year backtest.
- **Costs and limitations:** two answer shapes (weekly and until payday) in the fast path.
- **Failure behavior:** unchanged.
- **Security/privacy implications:** none.
- **What this intentionally does not solve:** weekly budgeting on bank data.

### Revisit triggers
- Revisit this decision if the team adds a weekly view or an `affordability()` function to the engine, or if real bank data replaces the simulated date.

---

## DEC-026 — S-Bank is dropped from the project; the finance capability becomes the team's money coach

- Status: accepted
- Date: 2026-11-14
- Owner: whole team (decided by the project owner)
- Scope: platform
- Decision:
  - S-Bank is no longer a partner or a target of the project. The project is entered only in *AI Glasses for Everyone, Everyday*, under the name Spendtacles.
  - The finance capability is "the money coach", built on our teammate's engine. User-facing text carries no S-Bank name or branding: the app title, the consent screen, the capability display name ("Money Coach" / "Rahavalmentaja" / "Pengacoach"), the README and the submission.
  - Internal identifiers keep the old name for now: `sbank.coach`, `SBankCoachAdapter`, `backend/src/capabilities/sbank-coach/`, the `s_pankki` finance source and the manifest file name.
  - S-Bank-specific plans are out of scope: the S-Pankki PSD2 sandbox (S15, S16) and S Group receipt data.

### Context
- **Problem being solved:** the project owner decided to drop S-Bank (README and submission already updated in `e70444a`). The architecture, the demo script and the app UI still named S-Bank.
- **Requirements and constraints:** no silent material decisions; no breaking contract changes within v1 during the hackathon.
- **Assumptions:**
  - [assumption] Teams outside the S-Pankki challenge may still use the Junction 2026 transaction dataset (S22). The dataset repo has no licence and no usage note. **Verify with the organisers**; if not, `user_stated` becomes the demo source.
  - [assumption] "Hey Meta, start Spendtacles" depends on the app name registered in the Meta developer setup (DEC-021).
- **Non-goals:** renaming internal identifiers before the hackathon ends.

### Options considered
| Option | Advantages | Disadvantages | Why accepted or rejected |
|---|---|---|---|
| Drop the branding now; keep internal identifiers | Small, safe change; nothing user-facing says S-Bank | Code and contracts keep an outdated name | **Accepted** |
| Full rename now (`capability_id`, adapter, folders, `s_pankki`, manifest) | Clean | Touches contracts, generated types, iOS, tests and examples hours before judging; `capability_id` is a value consumers match on | Rejected for now |
| Keep S-Bank | No change | Against the project owner's decision | Rejected |

### Evidence and sources
| Source | Type | Specific finding used | Why this source is trustworthy | Accessed |
|---|---|---|---|---|
| Commit `e70444a` (https://github.com/kqtiiv/Spendtacles) | Project history | [fact] "S-Bank is no longer part of the project"; README and submission rewritten | The project's own record | 2026-11-14 |
| User instruction, 2026-11-14 | Project owner | [fact] Dropping S-Bank is intended | Owner decision | 2026-11-14 |
| S22 dataset README (https://github.com/hackjunction/Junction-2026-S-pankki) | Challenge data | [fact] No licence or usage terms stated | Organisers' repo | 2026-11-14 |

### Implementation
- **Components affected:** `companion-ios/Sources/CompanionUI/Views.swift` (title and consent screen), the manifest example's `display_name`, code comments, `docs/ARCHITECTURE.md` (title, a terminology note, the invocation phrase), backend and `finance-engine` READMEs, `SOURCES.md` caveats.
- **Contracts or schemas affected:** none. The manifest example changes only its display name.
- **Configuration / feature flags:** none.
- **Tests or demo checks required:** contract check and backend suite; the iOS UI test does not assert the title.
- **Migration or rollback plan:** a later rename moves the internal identifiers in one change (a v2 manifest is not needed for a new `capability_id`, but every consumer must switch together).

### Consequences
- **Benefits:** the pitch and the app say the same thing; no implied sponsor relationship.
- **Costs and limitations:**
  - Internal names no longer match the product.
  - Entries DEC-001 to DEC-025 still say "S-Bank Coach". They are records of their time; read the term as "the money coach".
- **Failure behavior:** unchanged.
- **Security/privacy implications:** none.
- **What this intentionally does not solve:** real bank connectivity, which now needs a different provider.

### Revisit triggers
- Revisit this decision after the hackathon (do the rename), or if the organisers say the dataset is only for the S-Pankki challenge (switch the demo to `user_stated`).

## DEC-027 — The phone app has one bold element (the answer's figure on a price tag), and the decision docks above the input bar

- Status: accepted
- Date: 2026-11-15
- Owner: companion UI
- Scope: companion
- Decision:
  - The phone UI gets one visual identity taken from the shop aisle. The card's primary figure is set like a shelf-edge price label (heavy compressed numerals on a yellow tag), and everything around it is quiet: an aisle-white ground, spruce-ink text, hairline borders and no shadows. The UI uses system fonts only and supports dark mode.
  - The confirm decision is no longer a sheet that covers the answer. It docks above the input bar while a proposal waits, so the card it changes stays visible. The primary action is one full-width button; "Not now" is quiet.
  - Epistemic labels become a coloured dot plus the word, never colour alone.
  - The phone shows "Working on it…" while a turn runs, and an empty state tells the user what to ask.
  - The debug overlay keeps its exact text (DEC-005, and the UI test asserts on it), restyled as a slim strip.
  - The card renderer stays generic (`InsightCard` only, no capability-specific views).

### Context
- **Problem being solved:** in the CI screenshots, the debug strip was the most prominent element; the confirm sheet blurred the card it asked about; the coloured labels competed with the numbers; and nothing showed during an 8.8 s turn. The user asked for a simple redesign that looks good.
- **Requirements and constraints:** no contract changes; the UI test's identifiers (`allowConsent`, `menu`, `connectGlasses`, `askField`, `confirmProposal`, `lastSpeech`, `debugOverlay`) and the text it asserts must stay; mocks stay visible (DEC-005); every task still works without glasses (DEC-003).
- **Assumptions:** [assumption] the iOS build compiles in CI. `CompanionUI` is iOS-only and can't be compiled on the Linux dev machine.
- **Non-goals:** the glasses display renderer (still behind `display_output`, DEC-003); spoken wording and earcons (a separate change to `fast-path.ts` and `Speech.swift`).

### Options considered
| Option | Advantages | Disadvantages | Why accepted or rejected |
|---|---|---|---|
| Price-tag figure, quiet surroundings, docked decision | Grounded in the moment of use; one memorable element; nothing new to bundle | One more yellow in the palette to keep legible in dark mode (handled: dark text on the tag in both modes) | **Accepted** |
| Keep the stock SwiftUI look | No risk | Reads as a debug build; the sheet hides the answer | Rejected |
| Bundle a custom typeface | More distinctive type | Font files, `UIAppFonts` and licence checks hours before judging | Rejected for now |
| Capability-specific verdict view (e.g. a spend bar) | Richer visual for the money coach | Breaks the generic renderer (L8); needs fields the contract doesn't carry | Rejected; revisit with a contract change |

### Evidence and sources
| Source | Type | Specific finding used | Why this source is trustworthy | Accessed |
|---|---|---|---|---|
| S09 (https://wearables.developer.meta.com/docs/develop/webapps/design/guides/screen-layout/) | Official docs | [fact] Dock actions at the bottom, below the content they affect; one primary action per detail | Meta's own UI toolkit guidance | 2026-11-15 |
| S09 (https://wearables.developer.meta.com/llms.txt?product=all&version=1.0&document=products/webapps/sections/guides/build/display-and-layout) | Official docs | [fact] "Communicate state with structure or text as well as color" | Meta's own display guidance | 2026-11-15 |
| S24 (https://design.google/library/transparent-screens) | Industry research (Google) | [fact] Glanceable, brief content; colour used sparingly for key elements | Published design research from a glasses platform team | 2026-11-15 |
| CI screenshots `docs/images/2-answer-and-proposal.png`, `3-confirmed.png` | Project artefact | [fact] Sheet covers the card; the debug strip dominates; 8780 ms turn | Generated by the UI test | 2026-11-15 |
| Mock-ups (https://claude.ai/artifact/7F6t7uXGwCpCFA1kcFvKub) | Team design artefact | [inference] The layout this decision implements | Our own proposal | 2026-11-15 |

### Implementation
- **Components affected:** `companion-ios/Sources/CompanionUI/Views.swift` only (`Look` tokens, `PriceTag`, `ProposalPanel` replacing `ProposalSheet`, `ConsentView`, `CompanionScreen`).
- **Contracts or schemas affected:** none.
- **Configuration / feature flags:** none. The debug overlay toggle is unchanged (on by default).
- **Tests or demo checks required:** the iOS workflow (build + `CompanionUITests`) must pass; check its new screenshots in light and dark mode before replacing `docs/images/`.
- **Migration or rollback plan:** revert the one file.

### Consequences
- **Benefits:** the answer reads at a glance; the decision and what it changes are visible together; the app no longer looks like a debug build.
- **Costs and limitations:** the README screenshots are out of date until CI regenerates them; `dismissProposal()` in the view model is now unused by the UI (a pending proposal still expires on the server).
- **Failure behavior:** unchanged.
- **Security/privacy implications:** none. The confirm path, signing and channels are unchanged (DEC-007, DEC-012, DEC-018).
- **What this intentionally does not solve:** the glasses display and voice design (see the mock-ups).

### Revisit triggers
- Revisit this decision if the contract gains a verdict or breakdown field (a capability-aware visual becomes possible), if the demo uses a Ray-Ban Display (build the display renderer), or if testers misread the yellow tag as a price instead of what's left.
