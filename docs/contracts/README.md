# Contract index

The executable contracts live in [`../../contracts/`](../../contracts/README.md). That directory holds the JSON Schemas, the valid and invalid examples, the generated TS/Swift/Kotlin/Python types, the OpenAPI specs and the adapter interface. This page maps the architecture brief's contract names onto those files, and records versioning and error-code rules. **If this page and a schema disagree, the schema wins.**

## Required contracts → schemas

| Required contract | Schema file (`contracts/schemas/v1/…`) | `schema` const | Status | Decision |
|---|---|---|---|---|
| `ContextCapture` | `context_capture.schema.json` | `platform.context_capture/v1` | implemented | DEC-006 |
| `VoiceIntent` | `voice_intent.schema.json` | `platform.voice_intent/v1` | implemented | DEC-011 |
| `DeviceSessionState` | `device_session_state.schema.json` | `platform.device_session_state/v1` | **new**, implemented | DEC-005 |
| `GestureOrInputEvent` | `voice_intent.schema.json` with `invocation: "glasses_input"`, plus `common.schema.json#/definitions/GlassesInput` | `platform.voice_intent/v1` | implemented (mapped) | DEC-007, DEC-009 |
| `CapabilityRequest` | `domain_request.schema.json` | `platform.domain_request/v1` | implemented (mapped name) | DEC-009 |
| `CapabilityResponse` | `domain_response.schema.json`, streamed as `domain_response_event.schema.json` | `platform.domain_response/v1` | implemented (mapped name) | DEC-009 |
| `FinanceInsight` | `finance/finance_tool_result.schema.json` (overlay on `tool_result`) + `insight_card.schema.json` with finance `data_mode` | `platform.tool_result/v1`, `platform.insight_card/v1` | implemented (mapped); until-payday shape from the S-Pankki engine | DEC-009, DEC-019, DEC-025 |
| `DeterministicToolResult` | `tool_result.schema.json` (+ `tool_descriptor.schema.json`) | `platform.tool_result/v1` | implemented (mapped name) | DEC-019 |
| `InsightCard` | `insight_card.schema.json` | `platform.insight_card/v1` | implemented | — |
| `ActionProposal` | `action_proposal.schema.json` | `platform.action_proposal/v1` | implemented; hardening proposed | DEC-018, DEC-012 |
| `UserConfirmation` | `user_confirmation.schema.json` | `platform.user_confirmation/v1` | implemented; hardening proposed | DEC-018, DEC-012 |
| `DomainEvent` | `domain_event.schema.json` | `platform.domain_event/v1` | implemented | — |
| `ErrorEnvelope` | `error_envelope.schema.json` | `platform.error/v1` | **new**, implemented | DEC-008 |
| `ModelProvider` | `model_provider.schema.json` | `platform.model_provider/v1` | implemented | DEC-010 |
| `SBankCoachAdapter` | `contracts/interfaces/adapter.ts` (`AgentOrchestratorAdapter`) + `contracts/http/coach-agent.openapi.yaml` + `finance/finance_manifest.schema.json` | — | implemented | DEC-017 |

**Also present, beyond the required list:** `Observation`, `DomainCapability` (manifest), `ActionResult`, `GoldenCase`.

**Proposed, not yet implemented:**
- `AuditEvent` (DEC-013)
- `ConsentGrant`, plus `required_scopes` on `DeterministicTool` (DEC-014)

## Versioning rules (from `contracts/README.md`)

- Every message carries `schema: "platform.<name>/v<major>"`.
- Within v1, changes are **additive only**: new optional fields, new enum values, or new open-set codes. Renaming, removing, or making a field required means a v2 directory.
- Fields that are not yet in a contract use an `x_` prefix. Every object allows them.
- Policy rules (`if`/`then`) live only in the schemas. Generated types carry shapes, so **validate at every boundary**.

## Error codes

`platform.error/v1` `code` is an **open set** (DEC-008). Clients handle unknown codes using `retryable` and `effect_state`. Add new codes here in the same change that first emits them.

| Code | HTTP | `retryable` | Typical `effect_state` | Meaning |
|---|---|---|---|---|
| `UNAUTHENTICATED` | 401 | false | none | Missing, invalid or expired session or token; or a confirmation signature or payload hash mismatch |
| `CONSENT_REQUIRED` | 403 | false | none | No active consent grant covers this data class or purpose. The consent card is shown instead. |
| `CONSENT_REVOKED` | 403 | false | none | The grant was revoked; derived data has been purged (DEC-014, proposed) |
| `INSUFFICIENT_SCOPE` | 403 | false | none | The token or grant lacks a tool's required scope (DEC-014, proposed) |
| `VALIDATION_FAILED` | 422 | false | none | The body failed schema validation |
| `CONTRACT_VERSION_UNSUPPORTED` | 422 | false | none | Unknown `schema` major version |
| `CAPABILITY_NOT_FOUND` | 404 | false | none | No capability matches the hint or route |
| `CALCULATION_NOT_FOUND` | 404 | false | none | `calc_id` is unknown or belongs to another user |
| `PROPOSAL_NOT_FOUND` | 409 | false | none | Unknown proposal |
| `PROPOSAL_EXPIRED` | 409 | false | none | Past `expires_at` (or the apply window, DEC-012) |
| `PROPOSAL_ALREADY_DECIDED` | 409 | false | none or applied | Already confirmed or rejected; replay rejected |
| `CONFIRM_CHANNEL_NOT_ALLOWED` | 409 | false | none | Channel not allowed for this proposal, or a gesture during an active stream (DEC-007) |
| `UNSUPPORTED_INTENT` | 422 | false | none | The capability does not support this intent |
| `CAPTURE_UNUSABLE` | 422 | false | none | Blurred, glared or unreadable capture |
| `DEVICE_UNAVAILABLE` | 409 | false | none | The device state does not allow this, e.g. a capture while `phone_only` |
| `RATE_LIMITED` | 429 | true | none | Back off for `retry_after_ms` |
| `OFFLINE` | 503 | true | none | No network. Confirmations are never queued. |
| `CAPABILITY_UNAVAILABLE` | 503 | true | none | Capability down; `degraded_to` says what took over |
| `CAPABILITY_TIMEOUT` | 504, or 500 on apply | depends | none or **unknown** | Deadline exceeded. While applying, it is `unknown` and must not be replayed. |
| `VERIFICATION_FAILED` | 502 | false | none | Agent output failed calc_id verification; verified cards are kept and unverified speech dropped |
| `INTERNAL` | 500 | false | none or unknown | Anything else |

## Where each contract crosses a boundary

| Boundary | Transport | Contracts |
|---|---|---|
| Glasses ↔ companion | DAT SDK (closed) | None of ours. `GlassesBridge` maps SDK types onto ours (DEC-005). |
| Companion → orchestrator | HTTPS (`http/orchestrator.openapi.yaml`) | `DeviceSessionState`, consent grant (`POST /v1/consents`; minimal, full `ConsentGrant` still proposed in DEC-014), capture upload → `ContextCapture`, `VoiceIntent`, confirmation request |
| Orchestrator → companion | SSE | `DomainResponseEvent` (speech, cards, proposals), `ErrorEnvelope` |
| Orchestrator → capability | `AgentOrchestratorAdapter` in-process, or HTTPS + SSE (`http/coach-agent.openapi.yaml`) | `DomainRequest`, `DomainResponseEvent`, `UserConfirmation` → `ActionResult`, `ErrorEnvelope` |
| Adapter → finance engine | HTTPS | `GET /v1/calculations/{calc_id}` → finance `ToolResult` |
| Capability → orchestrator (proactive) | Event intake | `DomainEvent` |
