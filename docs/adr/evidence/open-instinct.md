# Evidence: Open Instinct (modular agent runtime)

**Source:** S12, `mariagorskikh/open-instinct` @ `2e5e71b7` (MIT, © 2026 Maria Gorskikh). 459 stars, 163 commits; README reports 837 tests across 9 packages. Accessed 2026-11-14.

**Not Instinct.** It is a self-described from-scratch clone (`README.md:3`), unaffiliated with the proprietary product (`README.md:95`). It tells us nothing about how Instinct is implemented. It is also not the same as `Merit-Systems/OpenInstinct` (S18).

Paths below are relative to `packages/core/src/` unless noted.

| Concern | What it does (verified) | Citation | Our response |
|---|---|---|---|
| Enforcement point | Policy is evaluated in `beforeToolCall` on every call; a decision is audited before it takes effect. "The guard is code, not prompt text." Tool visibility is only a convenience. | `runtime.ts:356-358, 737-762` (verified); `SECURITY.md:71-72`; `policy.ts:1-5` | Already our principle (DEC-018). A separate policy-decision record is proposed in DEC-013. |
| Permissions | 27 capability strings; values `yes/ask/limit/no/…`; deny > ask > allow; scoped, expiring grants; a spend policy with caps | `types.ts:41-88`; `policy.ts:173-281, 346-369` | **Not adopted.** Too heavy for one user and a few action kinds. Risk plus consent covers us. |
| Approvals | `Approval{token, argsHash, capability, toolName, amountUsd?, expiresAt, status}`. `argsHash` = sha256 of key-sorted JSON, **truncated to 16 hex**. Consumed on first use. Pending for 2 h, then usable for 15 min after approval. Only certain channels can settle. A model may settle only on owner turns and never for money. | `types.ts:268-282`; `runtime.ts:764-798, 1150-1173, 1463-1484` (verified); `approvals.ts:20`; `runtime.ts:100, 110-111`; `core-tools.ts:253-275` | Adopt binding, single use, an apply window, dedupe, and "only user-originated" (DEC-012, proposed). **Reject** truncation and ±5 % amount tolerance. Keep our signature, which is stronger than channel trust. |
| Audit | `AuditEntry{at, kind, principal?, detail}`, append-only JSONL with no hash chain. Argument and result previews clipped at 300 characters. | `types.ts:203-220`; `audit.ts:28-45`; `runtime.ts:1429-1451` | A typed `AuditEvent` with per-kind allowlists, no previews, and a `prev_hash` chain (DEC-013, proposed) |
| Isolation | One Firecracker microVM per user. `StateDir` refuses paths that escape it. Per-user webhook signing keys. Principal resolved before the model. | `docs/ARCHITECTURE.md:73`; `state.ts:32-38`; `gateway/src/store.ts:4-21`; `types.ts:10-38` | Adopt `user_ref` as the partition key on every store, and record the turn origin (DEC-012/013). **Reject** microVMs and trust tiers. |
| Memory | Durable `MEMORY.md` plus a daily journal; a digest injected every turn. Writes are owner-only. Non-owners see only `## Preferences` (fail closed). No deletion code found. | `memory.ts:1-111`; `core-tools.ts:85-111` | Platform sends `recent_turns` only. Long-term memory belongs to the capability, scoped by `(user_ref, capability_id)`. Retention is to be defined with DEC-014. |
| Errors | No typed envelope and no retryable flag. `InboundUncertainError` = "external effect may have happened; replay not safe". | `tools.ts:30-36`; `runtime.ts:120-126` | `effect_state: unknown` ⇒ `retryable: false` in `ErrorEnvelope` (DEC-008) |
