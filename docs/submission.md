# Junction 2026 submission (copy into the form)

Lines marked **[CHECK]** depend on what is true on the night. Fix or delete them before you submit.

---

## Project Name (max 30)

Spendtacles

## Punchline (max 200)

Save money before you spend it. Look at a price through your Ray-Ban Meta glasses, ask "can I afford this?", and hear what it would leave you, from numbers you can check.

## Challenge

AI Glasses for Everyone, Everyday

## Description (max 5000, markdown)

### The problem
Money decisions happen in the shop aisle; banking apps show them afterwards. By the time you've opened the app and found your balance, you've already paid. Glasses can help in the moment, but a money assistant you wear must earn trust: no invented numbers, no always-on camera, no moving money on its own.

### What Spendtacles does
Spendtacles turns Ray-Ban Meta glasses and your phone into a hands-free money coach.

1. Look at a price label and ask **"Can I afford this?"** or **"Does this fit my week?"** You can ask in English or Finnish (*"Onko minulla varaa tähän?"*).
2. The glasses take one photo, only because you asked. The price is read from the label.
3. You hear a short answer, for example: *"If that price is 79.90, it fits, but it would leave about 10 euros until Sunday. Want me to plan it in?"*
4. Your phone shows the card behind the answer. Every row carries a label that says where it came from:
   - **read by camera** for the price on the label;
   - **fact** or **calculated** for figures from your data;
   - **estimate** for projections.
5. Tap Confirm, and the coach adds it to your week. Nothing happens until you say yes, and you can undo it.

**No bank connected?** The coach asks one question the first time it needs one: *"How much do you want to spend until Sunday?"* Say "about a hundred" and you're set up. It remembers the amount, and every answer is labelled "as you told me". You can also use Spendtacles from the phone alone, without the glasses.

### Built to be trusted
- **The AI never invents numbers.** Every figure comes from a deterministic finance engine and carries a calculation ID. Before anything is spoken or shown, a verifier checks each number against the engine's log and drops any number the engine didn't calculate.
- **No action without confirmation.** Changes are proposals. Each confirmation is signed, single-use, expiring and checked on the server. Kinds of action that move money (payments, transfers, purchases, loans) are rejected by the contract itself.
- **The camera works only when you ask.** There is no always-on camera and no face recognition. Before a photo leaves the phone, it is rotated upright, stripped of EXIF and GPS data, and downscaled. The coach receives the price read from the label, not the photo, and price-label photos are kept for 0 seconds.
- **Consent is fail-closed.** Without consent, no finance turn runs. Revoking consent deletes the captures made under it.

### A platform, not a one-off demo
Every capability implements one stable interface; the money coach is the first, built without touching glasses code. Every message follows a versioned JSON Schema contract with generated TypeScript, Swift, Kotlin and Python types. The trust rules live in the schemas, and every example message runs as a test.

### Engineering we can show
- **Backend** (TypeScript, Fastify) handles sessions, glasses device state, consent, photo capture, streamed answers and signed confirmations. All 63 tests pass.
- **Money engine** (Python, from our teammate) runs on the Junction 2026 synthetic transaction dataset. It answers until payday, and its figures come back as decimal strings with calculation IDs. In the team's two-year backtest, the safe-to-spend rule cut overdraft days by 89%.
- **iOS companion** (Swift, SwiftUI): glasses session, Bluetooth audio, speech, capture and cards, with unit tests and an end-to-end smoke test.
- **Meta Wearables Device Access Toolkit 1.0.1**: CI builds the app on macOS runners and drives the whole flow (look, hear, confirm, updated week) on Meta's Mock Device Kit. It passes and saves screenshots.
- **26 recorded architecture decisions**, each with alternatives, evidence and the conditions for revisiting it.

### What's real and what's mocked
- **Real:** orchestrator, consent, capture pipeline, confirmation signing, number verification, contracts, no-bank mode, iOS companion, and the team's money engine on the synthetic dataset.
- **Mocked:**
  - The label reader returns the demo price label.
  - With the engine, "today" is a fixed date in the synthetic dataset (2026-09-05), and the answers say so.
  - The default demo uses fixture numbers, which are marked as mock in the app.
- **On real glasses:** **[CHECK: e.g. "capture and spoken answer verified on Ray-Ban Meta", otherwise "demonstrated with Meta's Mock Device Kit"]**. "Hey Meta" launch and glasses-tap confirmation are experimental in Meta's SDK, so they sit behind flags and each has a fallback.

### What's next
Real bank data through a PSD2 sandbox, a real label reader, receipt matching, a language model that explains the engine's figures but never calculates them, and more capabilities on the same platform.

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
