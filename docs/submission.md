# Junction 2026 submission (copy into the form)

Lines marked **[CHECK]** depend on what is true on the night. Fix or delete them before you submit.

---

## Project Name (max 30)

Spendtacles

## Punchline (max 200)

A finance coach in your Ray-Ban Meta glasses: look at a price, ask "can I afford this?", and hear an answer built on numbers you can check. Nothing changes without your OK.

## Challenge

AI Glasses for Everyone, Everyday

## Description (max 5000, markdown)

### The problem
Money decisions happen in the shop aisle, not in the banking app. By the time you open an app to check your budget, you've already paid. Glasses could help at the right moment, but a finance assistant you wear has to be trustworthy: it can't make numbers up, watch you all the time, or move money on its own.

### What Spendtacles does
Spendtacles turns Ray-Ban Meta glasses and your phone into a hands-free money coach. The coach is the first capability on the platform.

1. Open the coach from the glasses.
2. Look at a price label and ask **"Can I afford this?"** (in English or Finnish: *"Onko minulla varaa tähän?"*).
3. You hear a short answer through the glasses, for example: *"If that price is 79.90, it fits. You'd still have about 24 euros a day until payday."* Your phone shows the card behind it: balance, bills still due, money free until payday.
4. If changing your plan would help, the coach **proposes** the change. Nothing happens until you confirm.

No glasses, or they're folded? The same coach works from the phone alone.

### Built to be trusted
- **The AI never invents numbers.** Every figure comes from a deterministic finance engine and carries a calculation ID. Before anything is spoken or shown, a verifier checks each number against the engine's log. If the AI adds a number the engine didn't calculate, the verifier drops it.
- **No action without confirmation.** Changes are proposals. Each confirmation is signed, single-use, expiring and checked on the server. Saying "stop" aborts a turn and never applies anything.
- **The camera works only when you ask.** There is no always-on camera and no facial recognition. Before a photo leaves the phone, it is rotated upright, stripped of EXIF and GPS data, and downscaled. The finance capability receives what was read from the label, not the photo.
- **Consent is fail-closed.** Without a consent grant, no finance turn runs. Revoking consent deletes the captures made under it.
- **Money is never a float.** Amounts are decimal strings from end to end.

### A platform, not a one-off demo
Spendtacles is a glasses platform with one stable interface that every capability implements. The coach's engine is built behind that interface without touching glasses code. Every message between the parts follows a versioned JSON Schema contract, with types generated for TypeScript, Swift, Kotlin and Python. The trust rules are written into the schemas, so a message that breaks one is rejected automatically, and every example message runs as a test.

### Engineering we can show
- **Backend** (TypeScript, Fastify): orchestrator and money-coach adapter. It handles sessions, glasses device state, consent, photo captures, streamed answers and signed confirmations, and all 63 tests pass.
- **Our teammate's money engine** (Python) runs on the Junction 2026 synthetic transaction dataset behind a small service that turns its figures into decimal strings with calculation IDs. In the team's own two-year backtest, the safe-to-spend rule cut overdraft days by 89 %.
- **iOS companion** (Swift, SwiftUI): manages the glasses session, Bluetooth audio, speech, capture and cards. The core is unit-tested, and an end-to-end smoke test runs the full demo flow against the real backend.
- **Meta Wearables Device Access Toolkit 1.0.1**: the glasses connection is written against the SDK's public API. CI builds the app on macOS runners and drives it with Meta's Mock Device Kit (simulated glasses), and the run passes.
- **25 recorded architecture decisions**, each with alternatives, evidence and the conditions for revisiting it. Grounded in Meta's official samples and open-source glasses projects (patterns only, licences checked).

### What's real and what's mocked
We label mocks in the product itself, so here is the same list:
- **Real:** the orchestrator, consent, capture pipeline, confirmation signing, number verification, contracts, the iOS companion core, and the team's money engine running on the synthetic transaction dataset.
- **Mocked:** "today" is a fixed date inside the synthetic dataset (2026-09-05), and every answer says so. The label reader returns the demo price label.
- **On real glasses:** **[CHECK: what you ran on the device, e.g. "capture and spoken answer verified on Ray-Ban Meta"; otherwise "demonstrated with Meta's Mock Device Kit"]**. "Hey Meta" voice launch and glasses-tap confirmation are experimental in Meta's SDK, so they are behind flags and the demo has a fallback for each.

### What's next
Connect real bank data through a PSD2 sandbox. Add a real label reader. Add receipt matching. Add a language model that explains the engine's figures but never calculates. Then add more capabilities on the same platform.

### Tech
Swift · SwiftUI · Meta Wearables DAT 1.0.1 · Python · FastAPI · DuckDB · TypeScript · Node 22 · Fastify · JSON Schema (Ajv) · quicktype · ES256 JWS · GitHub Actions (macOS + Mock Device Kit) · Fly.io

---

## Links

| Field | Value |
|---|---|
| Source Code | https://github.com/kqtiiv/Spendtacles |
| Project Demo | **[CHECK]** The deployed backend (`https://junction26-coach.fly.dev/health`) wasn't responding when checked. Leave blank, or link the CI screenshots / a demo recording. |
| Video | **[TODO]** Record it (see the plan in chat) and upload it to YouTube (unlisted) or Loom |
| Other Link | https://github.com/kqtiiv/Spendtacles/blob/main/docs/ARCHITECTURE_DECISION_LOG.md |
| Presentation | **[TODO]** PDF deck |

## Tech challenges
Enter only the ones the project actually uses. As of now it uses none of the sponsor technologies (no MariaDB, Modal, Cloudinary or CRACI).
