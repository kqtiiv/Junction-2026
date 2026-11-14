# Backend: platform orchestrator + S-Bank Coach adapter

Implements `contracts/http/orchestrator.openapi.yaml` (L3) and the S-Bank Coach capability adapter (L5) from `docs/ARCHITECTURE.md`. TypeScript on Node 22+, Fastify, no database yet (in-memory stores).

```bash
npm install
npm test            # 28 tests: demo path, confirmation rules, abort, timeout fallback, invented numbers
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
| `POST /v1/turns` (SSE) | Validates `VoiceIntent`, routes to a capability, streams `card` / `proposal` / `final` events, or an `error` event with an `ErrorEnvelope` |
| `POST /v1/confirmations` | Policy-checks, signs (ES256 JWS) and forwards a `UserConfirmation`; returns `ActionResult` |

Platform intents handled in `/v1/turns` without a capability: `stop`/`cancel` (aborts the turn in flight; it delivers no final, DEC-011), `repeat`, `confirm`/`reject` (glasses gesture, exact-word voice, or typed), `show_on_phone`, `next_card`.

Every outgoing event is validated against the JSON Schemas before it is sent.

## What answers the questions today

The **deterministic fast path** on a **fixture finance engine**, both flagged `mock` everywhere:
- `finance.safe_to_spend`: "what's safe to spend this week" / "paljonko voin käyttää tällä viikolla"
- `finance.basket.affordability` with a stated amount: "can I afford 79.90 this week"; a confirmed plan reduces the week's allowance

Numbers come from `contracts/examples` (€90.16 safe to spend). Every spoken number and card value is verified against the engine's calculation log before it is sent. A remote agent that invents numbers has them dropped (`test/adapter.test.ts`).

## Not built yet

- `POST /v1/captures` and observations (price-label photos). Turns with `attached_capture_ids` are refused with a speakable `DEVICE_UNAVAILABLE`.
- The HTTP client for the Coach team's agent (`RemoteAgentBackend`). The adapter's backend policy, deadline fallback and verification are built and tested against a fake agent.
- Undo, persistence, the receipt flow, spend queries.

## Configuration

| Env var | Default | Meaning |
|---|---|---|
| `PORT` | `8787` | |
| `DEV_TOKENS` | `demo-token:u_7f3a` | Hackathon auth: `token:user_ref,…` |
| `PLATFORM_SIGNING_KEY_PEM` | ephemeral key | P-256 private key for signing confirmations |
