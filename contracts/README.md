# Contracts

The single source of truth for **what the glasses companion, the platform backend and each domain capability (first: S-Bank Coach) send to each other**. If two teams disagree about a message, this folder decides.

It contains:

- **JSON Schemas** (`schemas/v1/`) for every message, including the rules a trusted finance product needs: money as exact decimal strings, explicit evidence labels, confirmation policy, and a ban on money-moving actions.
- **Examples** (`examples/v1/`) of what valid messages look like, and *invalid* ones that must be rejected, as executable tests.
- **Generated types** (`generated/`) for TypeScript, Swift (iOS companion), Kotlin (Android companion) and Python (backend), so nobody hand-writes these structs.
- **HTTP specs** (`http/`) for the two network boundaries: companion → platform, and platform → Coach agent.
- **The adapter interface** (`interfaces/adapter.ts`): the one interface every capability implements.

The architecture behind it is in [`../docs/ARCHITECTURE.md`](../docs/ARCHITECTURE.md) (§3 contracts, §5 finance boundary).

---

## Who uses what

| Workstream | Start from | You produce | You consume |
|---|---|---|---|
| **Glasses / native companion** | `generated/swift` or `generated/kotlin`, `http/orchestrator.openapi.yaml` | `VoiceIntent`, capture uploads, confirmation decisions | `DomainResponseEvent` (speech, cards, proposals), `ActionResult` |
| **Platform backend** | `http/orchestrator.openapi.yaml`, `interfaces/adapter.ts` | `ContextCapture`, `Observation`, `DomainRequest`, signed `UserConfirmation` | Everything a capability returns |
| **S-Bank Coach adapter** | `interfaces/adapter.ts`, `http/coach-agent.openapi.yaml` | `DomainResponse` (verified) | `DomainRequest`, finance `ToolResult`s by `calc_id` |
| **S-Bank Coach team** (separate) | `http/coach-agent.openapi.yaml`, `schemas/v1/finance/` | `POST /v1/turn` answers, `ToolResult`s with `calc_id`s, a manifest, golden cases | `DomainRequest`, `UserConfirmation` |
| **Frontend / demo** | `generated/ts`, `examples/v1/valid/*card*`, `*proposal*` | Rendering of any `InsightCard` / `ActionProposal` | Cards and proposals |

**The examples double as mocks.** Until the real service exists, each workstream can serve or read the files in `examples/v1/valid/`. They tell one consistent story: Aino looks at a €79.90 price label and asks *"does this fit my week?"*. The answer is that €90.16 is safe to spend this week, leaving €10.26. She then confirms "plan it in" with a tap on the glasses.

---

## Layout

```
contracts/
├── schemas/v1/
│   ├── common.schema.json              shared primitives (Money, Epistemic, LText, Ref, ActionKind, …)
│   ├── context_capture.schema.json     ContextCapture      photo from glasses/phone, minimised
│   ├── observation.schema.json         Observation         what the platform read from a capture
│   ├── voice_intent.schema.json        VoiceIntent         one user turn: speech and/or glasses gesture
│   ├── capability_manifest.schema.json DomainCapability    what a capability declares
│   ├── domain_request.schema.json      DomainRequest       platform → capability
│   ├── domain_response.schema.json     DomainResponse      capability → platform
│   ├── domain_response_event.schema.json  streamed events (progress | card | proposal | final)
│   ├── tool_descriptor.schema.json     DeterministicTool   how a domain describes a deterministic function
│   ├── tool_result.schema.json         ToolResult          envelope every tool returns (calc_id, epistemic, …)
│   ├── insight_card.schema.json        InsightCard         schema-driven card for phone/glasses display, with an optional signed Purchase Receipt (DEC-029)
│   ├── action_proposal.schema.json     ActionProposal      a change the capability wants to make
│   ├── user_confirmation.schema.json   UserConfirmation    the user's signed decision
│   ├── action_result.schema.json       ActionResult        what happened after confirmation
│   ├── domain_event.schema.json        DomainEvent         candidate proactive notification
│   ├── model_provider.schema.json      ModelProvider       registry entry for ASR/TTS/router/LLM/OCR
│   ├── golden_case.schema.json         GoldenCase          a test case a capability must ship
│   └── finance/                        finance overlay: tightens the platform contracts for S-Bank Coach
│       ├── finance.schema.json            DataMode, MissingDataCode, intents, action kinds, tool names,
│       │                                  SafeToSpendResult, AffordabilityResult
│       ├── finance_tool_result.schema.json
│       └── finance_manifest.schema.json
├── examples/v1/
│   ├── index.json                      which example is checked against which schema, and why invalid ones fail
│   ├── valid/                          (also usable as mocks)
│   └── invalid/                        each breaks exactly one rule
├── generated/                          ← do not edit; run `npm run generate`
│   ├── ts/contracts.ts
│   ├── swift/Contracts.swift
│   ├── kotlin/Contracts.kt
│   └── python/contracts.py
├── http/
│   ├── orchestrator.openapi.yaml       companion → platform
│   └── coach-agent.openapi.yaml        platform → S-Bank Coach agent
├── interfaces/adapter.ts               AgentOrchestratorAdapter (hand-written; uses generated types)
└── scripts/validate.mjs, generate.mjs
```

---

## Rules the schemas enforce

These aren't just documentation: each one has an invalid example in `examples/v1/invalid/` that the validator must reject.

| Rule | Why |
|---|---|
| Money is `{"amount": "79.90", "currency": "EUR"}`: a decimal **string**, never a JSON number | No floating-point drift in financial values |
| Every card, row and spoken line carries an **epistemic label**: `fact`, `calculated`, `estimate`, `educational` or `observed` | Users can always tell a record from a calculation, a forecast, general advice, or something the camera *read* |
| `calculated`/`estimate` cards must cite a `calc_id`; `observed` cards must cite an observation; `educational` cards must cite a source | Every number is traceable and verifiable |
| Successful tool results about the user's data must have a `calc_id` | The adapter checks numbers against the engine, not the agent |
| A response marked `verified` cannot contain unverified values | Only the platform adapter may claim verification |
| Action kinds containing `payment`, `transfer`, `purchase`, `credit` or `loan` are rejected | The coach explains and plans; it never moves money |
| Voice or **glasses-gesture** confirmation only for **low-risk, reversible** actions, after the summary was read back; voice also needs ASR confidence ≥ 0.85 | Hands-free stays fast without becoming a way to trigger consequential changes |
| High-risk actions need phone biometric confirmation only | |
| Captures must have EXIF stripped; manifest image retention ≤ 30 days | Data minimisation |
| Proactive events never speak amounts (`spoken_amounts` is always `false`) | Open-ear speakers can be overheard |
| On-device model providers cannot declare `leaves_device: true` | Privacy claims must be consistent |
| Finance estimates must state their data mode (`balance`/`budget`/`pace`); in `pace` mode affordability must be `UNKNOWN` | Without a balance, the coach cannot honestly say "yes, you can afford it" |

`validate.mjs` also runs three cross-file checks:

- manifest intents only accept capture purposes the manifest declares;
- proposals use the kinds, risk levels and channels the manifest declares;
- cards only cite `calc_id`s that appear in the response trace.

---

## Commands

```bash
cd contracts
npm install
npm run validate    # schemas compile; valid examples pass; invalid examples fail for their stated reason
npm run generate    # regenerate TS / Swift / Kotlin / Python into generated/
npm run check       # both, plus a TypeScript type-check of generated code + interfaces/adapter.ts
```

Validating a message at runtime (Node), e.g. in the backend or a test:

```js
import Ajv from "ajv"; import addFormats from "ajv-formats";
const ajv = new Ajv({ allErrors: true, strictTypes: false, strictRequired: false });
addFormats(ajv);
for (const s of allSchemaFiles) ajv.addSchema(JSON.parse(readFileSync(s, "utf8")));
const validate = ajv.getSchema("https://contracts.example/v1/domain_response.schema.json");
if (!validate(msg)) throw new Error(ajv.errorsText(validate.errors));
```

(`contracts.example` is only an identifier for resolving references between schemas. Nothing is fetched over the network.)

---

## Generated code: what to know

- **Generated types describe shapes, not policy.** Conditional rules (e.g. "gesture confirmation only for low-risk actions") live only in the schemas. **Validate messages at the boundaries** (backend in, backend out, and in tests). Don't rely on the types alone.
- **TypeScript:** type-checked as part of `npm run check`.
- **Python:** `quicktype` dataclasses with `from_dict`/`to_dict`; requires `python-dateutil`. All valid examples round-trip exactly. If your backend uses Pydantic, generate from the same schemas with `datamodel-code-generator` instead.
- **Swift:** `Codable` structs (`public`, `Equatable`). Dates decode via the generated `newJSONDecoder()` helper. **Not compiled in this environment**: build it in Xcode on day 1.
- **Kotlin:** `kotlinx.serialization` data classes in package `platform.contracts`. **Not compiled in this environment**: add the kotlinx-serialization plugin and build it on day 1.
- Money stays a `String` in every language. Convert to `Decimal` / `BigDecimal` at the edge, never to `Double`.

---

## Changing a contract

1. **Within v1, changes are additive only:** new optional fields or new enum values that consumers can ignore. Renaming, removing, or making a field required means a **v2** directory.
2. Need a field before the contract has it? Use an `x_` prefixed field (`"x_debug_latency_ms": 312`). Every object allows them, and generated types ignore them.
3. Edit the schema, add or adjust an example in `examples/v1/valid/` (and an invalid one if you add a rule), register it in `examples/v1/index.json`, then run `npm run check` and commit the regenerated `generated/` files in the same change.
4. **Hackathon rule:** freeze v1 at hour 4. After that, additive changes only, announced in the team channel.

---

## What is deliberately *not* here

- **Finance internals:** the ledger schema, how safe-to-spend is calculated, agent prompts and model choice belong to the S-Bank Coach team (see `../docs/finance/REFERENCE_DESIGN.md` for the reference design). The platform only sees tool results, calc ids and the manifest.
- **Meta Device Access Toolkit types:** they stay inside the companion's `GlassesBridge` module, which maps them onto `VoiceIntent`, `GlassesInput` and `ContextCapture`. SDK changes never reach these contracts.
