# Evidence: GemGlasses and VisionClaw (independent glasses + realtime-AI projects)

**Sources:**
- S10: `lpecom/GemGlasses` @ `56634385` (MIT)
- S11: `Intent-Lab/VisionClaw` @ `3f398070` (HEAD, LiveKit era) and `1db325a2` (pre-LiveKit). **No OSS licence.**

Accessed 2026-11-14.

## Maturity (candid)
- **GemGlasses** has 1 commit, 1 contributor, 3 stars and about 3k lines.
  - CI builds only the mock backend.
  - `RealGlassesBackend.kt:26-27` tells readers to "verify against your installed SDK version".
  - [inference] The real-glasses path was never run on hardware; the repo was probably AI-generated.
- **VisionClaw** has 336 commits, about 2.6k stars, and is effectively one author.
  - It began as a fork of Meta's CameraAccess sample.
  - It is cited by an arXiv user study (2604.03486).
  - It has no tests of its own, and its README lists files that have been deleted.

## Architecture
| Concern | GemGlasses | VisionClaw |
|---|---|---|
| Hardware boundary | `GlassesBackend` interface (`GlassesBackend.kt:27-48`). **Silently falls back to the mock** if the real class fails to load (`AppModule.kt:49-57`, verified). | Uses Meta's own `MWDATMockDevice` (`MockDeviceKitViewModel.swift:17-25`) |
| Audio | Bluetooth SCO/LE, `MODE_IN_COMMUNICATION`, `VOICE_COMMUNICATION` source for echo cancellation; 16 kHz mic, 24 kHz out (`BluetoothAudioRouter.kt:28-44`, `MicStreamer.kt:20-47`). A missing Bluetooth device only produces a log warning (line 35). | Half-duplex mic mute when echo cancellation is unavailable (`GeminiSessionViewModel.swift:44-52`, pre-LiveKit). Tuned VAD (`GeminiLiveService.swift:203-221`). |
| Model session | Gemini Live WebSocket; resumption handle; early reconnect on `goAway`; backoff from 500 ms to 8 s (`SessionKeeper.kt:84-117`). Bug: socket `Closed` events are swallowed (line 107). | Era 1: raw API key in the WebSocket URL; any error ends the session. HEAD: LiveKit WebRTC, with a Python worker holding the model keys. |
| Credentials | Worker mints single-use 30-min tokens (`backend/src/index.ts:57-89`), but the Worker is protected only by a shared secret **compiled into the APK** (`TokenProvider.kt:32`) | HEAD: gateway mints a 15-min room JWT per call (`gateway/src/server.ts:410-470`) |
| Vision | **Model-triggered** `capturar_visao` burst, ~1 fps for up to 20 s (`VisionTool.kt:43-49`) | **Continuous** ambient frames (1 fps while speaking, 0.3 fps idle; `main.py:166-173`), plus a model-triggered `look_closely` still |
| Tools / actions | Structured `{status:"error"}` results (`ToolRegistry.kt:28-46`). SMS hands off to the OS composer so the user sends it (`MessageTool.kt:13-16`). | Era 1: single free-text `execute(task)` → OpenClaw. HEAD: Managed Agents with `permission_policy: always_allow` (`provision.ts:122-132`). **`always_ask` confirmations auto-answered "allow"** (`gateway/src/turn.ts:4-25`, verified). `browse` may "buy, place an order, check out" (`main.py:849-855`). |
| Late results | — | "Two-speed" delegation: acknowledge, heartbeat, relay later, park the result if the user hung up (`main.py:681-700`) |
| Cards | — | Typed card protocol; a uuid replaces a card in place; unknown types degrade (`main.py:964-1000`) |
| Cancellation | Only logged; the tool keeps running (`AgentController.kt:124`) | Local only (`ToolCallRouter.swift:120-129`) |

## Adopted (patterns only; no VisionClaw code)
- An explicit hardware interface plus Meta's official mock, with the backend **always reported** (DEC-005, `glasses_backend`).
- A barge-in flush plus abort propagation (DEC-011).
- Half-duplex fallback when echo cancellation is unavailable (DEC-011).
- Structured tool errors and a circuit breaker (DEC-008).
- Hand-off to OS UI for actions outside our engine (pattern noted).
- Short-lived, per-user, model-constrained tokens **if** a cloud realtime or ASR model ever runs on the phone. L3 mints them. Never a shared app secret.

## Rejected
- Always-open mic and continuous video (DEC-006, DEC-011).
- Model-initiated camera (DEC-006).
- Keys or secrets in the client (DEC-002).
- Confirmation in prompt text, auto-approval, `always_allow` on purchase-capable agents (DEC-018).
- Free-text `execute(task)` mega-tool (DEC-017).
- Realtime speech-to-speech stacks (DEC-011).

## Gaps these revealed in our design → where they are addressed
| Gap | Addressed in |
|---|---|
| Stop/barge-in semantics | DEC-011 |
| Local cancel ≠ remote cancel; idempotent apply | DEC-011, DEC-012 (proposed) |
| Audio-route failures (no Bluetooth device, SCO down, no echo cancellation) | DEC-005 (`audio_route`, `BLUETOOTH_ROUTE_UNAVAILABLE`), DEC-011 |
| Registration revoked, permission denied, hinges closed, mid-capture drop | DEC-005 (`degraded_reasons`) |
| Late-result delivery | Deferred (DEC-011 "does not solve") |
| Silent mock substitution | DEC-005 |
