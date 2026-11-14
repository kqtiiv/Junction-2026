# Backend: platform orchestrator + S-Bank Coach adapter

Implements `contracts/http/orchestrator.openapi.yaml` (L3) and the S-Bank Coach capability adapter (L5) from `docs/ARCHITECTURE.md`. TypeScript on Node 22+, Fastify, no database yet (in-memory stores).

```bash
npm install
npm test            # 63 tests: demo path, captures, consent, confirmation rules, abort, timeout fallback, invented numbers
npm run typecheck
npm run dev         # http://0.0.0.0:8787  (phone on the same network can reach it)
```

Try it: `curl -H 'authorization: Bearer demo-token' localhost:8787/health`

## What works

| Endpoint | Behaviour |
|---|---|
| `GET /health` | Capability health, including `mock: true` while fixtures answer (DEC-005) |
| `POST /v1/sessions` | Creates a session |
| `PUT /v1/sessions/{id}/device-state` | Validates `DeviceSessionState`, keeps the highest `seq`, ignores stale snapshots |
| `POST /v1/consents`, `DELETE /v1/consents/{id}` | Records a grant (only data classes and purposes the manifest declares); revoking deletes captures made under it |
| `POST /v1/captures` | Multipart upload. Checks consent for the purpose, refuses glasses captures in `phone_only`, rejects photos that still carry EXIF, reads the label into an `Observation`, and deletes the image at once when the capability declared retention 0 |
| `POST /v1/turns` (SSE) | Validates `VoiceIntent`, routes to a capability, streams `card` / `proposal` / `final` events, or an `error` event with an `ErrorEnvelope` |
| `POST /v1/confirmations` | Policy-checks, signs (ES256 JWS) and forwards a `UserConfirmation`; returns `ActionResult` |

Platform intents handled in `/v1/turns` without a capability: `stop`/`cancel` (aborts the turn in flight; it delivers no final, DEC-011), `repeat`, `confirm`/`reject` (glasses gesture, exact-word voice, or typed), `show_on_phone`, `next_card`.

Every outgoing event is validated against the JSON Schemas before it is sent.

**Consent is fail-closed** (ARCHITECTURE.md §2.5): a domain turn needs an active grant for the capability, so the companion records the combined consent at first launch (`POST /v1/consents`) before the first question. Attached captures reach the capability as `Observation`s, never as the photo, unless its manifest declares `delivery: "media"`.

## What answers the questions today

The **deterministic fast path** on a **fixture finance engine**, both flagged `mock` everywhere:
- `finance.safe_to_spend`: "what's safe to spend this week" / "paljonko voin käyttää tällä viikolla"
- `finance.basket.affordability` with a stated amount ("can I afford 79.90 this week") or a price-label capture ("does this fit my week?" / "mahtuuko tämä viikon budjettiin"); a confirmed plan reduces the week's allowance

The **label reader is a fixture** too: it returns the demo €79.90 label whatever the photo shows, and `/health` reports it as `mock`.

Numbers come from `contracts/examples` (€90.16 safe to spend). Every spoken number and card value is verified against the engine's calculation log before it is sent. A remote agent that invents numbers has them dropped (`test/adapter.test.ts`).

## On S-Pankki's data (`FINANCE_SOURCE=s_pankki`)

`SPankkiFinanceEngine` calls `finance-engine/` (the S-Bank Coach team's engine behind an HTTP service, DEC-024) at `FINANCE_ENGINE_URL`. Start that service first (see its README), then `FINANCE_SOURCE=s_pankki npm run dev`.

- **Until payday, not per week** (DEC-025): "safe to spend today", "free until payday", and for a purchase what it leaves per day. Speech never contains dates, only figures the verifier can trace.
- **Verification goes back to the engine:** `resolve()` calls `GET /v1/calculations/{calc_id}`. If the service can't confirm a figure, the card is dropped.
- **Every result is validated** against the finance contract before use.
- **Confirmed plans** are kept here and sent as `planned_total`.
- **Engine down** → `CAPABILITY_UNAVAILABLE`. Nothing is invented and there is no silent fallback.
- **Not a mock:** it's the real engine on the challenge's dataset. The simulated date is stated in every result's assumptions.

Tests: `test/s-pankki.test.ts`, run against a fake of the service that serves the contract examples generated from the real engine.

## Without bank data (`FINANCE_SOURCE=user_stated`)

Built for a lazy user: no setup screen. The first time a question needs money figures, the coach asks one thing out loud and then answers the original question:

> "Does this fit my week?" → "How much do you want to spend until Sunday?" → "About a hundred." → "Got it: 100 euros until Sunday. If the label's right, that leaves about 20. Want me to plan it in?"

- Answers can be digits or round number words in English and Finnish ("about a hundred", "noin sata").
- An unclear answer gets one retry, then the coach drops the question politely and never guesses.
- The amount carries over to later weeks automatically. Saying "my budget this week is 60" changes it.
- Confirmed plans count down from it.
- Cards label it "Your weekly amount, as you told me" and note that no bank is connected (`data_mode: budget`, missing `NO_BALANCE`).
- These are the user's own figures, so they are not reported as a mock.

Stating the weekly amount is treated as the user giving information, not as an action taken on their behalf. The coach repeats it back instead of asking for a confirmation tap.

## Not built yet

- A real label reader (cloud vision model or on-device OCR) behind the `LabelReader` / `vision_ocr` slot.
- The HTTP client for the Coach team's agent (`RemoteAgentBackend`). The adapter's backend policy, deadline fallback and verification are built and tested against a fake agent.
- Undo, persistence, the receipt flow, spend queries.

## Configuration

| Env var | Default | Meaning |
|---|---|---|
| `PORT` | `8787` | |
| `FINANCE_SOURCE` | `fixture` | `fixture`: S-Bank demo numbers (mock). `user_stated`: no bank data; the coach asks for the user's weekly amount once, when first needed. `s_pankki`: the S-Bank Coach team's engine on S-Pankki's dataset, via `finance-engine/` |
| `FINANCE_ENGINE_URL` | `http://127.0.0.1:8790` | Where `finance-engine/` listens (`s_pankki` only) |
| `DEV_TOKENS` | `demo-token:u_7f3a` | Hackathon auth: `token:user_ref,…` |
| `PLATFORM_SIGNING_KEY_PEM` | ephemeral key | P-256 private key for signing confirmations |
