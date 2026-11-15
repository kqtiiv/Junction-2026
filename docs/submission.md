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
Money decisions happen in the shop aisle; banking apps show them afterwards. Glasses can help in the moment, but a money assistant you wear must earn trust: no invented numbers, no guessing, no always-on camera, no moving money on its own.

### What Spendtacles does
1. Look at a price label and ask **"Can I afford this?"** (or *"Onko minulla varaa tähän?"*). The glasses take one photo, only because you asked.
2. You hear: *"If that price is 79.90, it fits, but it would leave about 10 euros until Sunday. Want me to plan it in?"*
3. Your phone shows what buying it leaves you, and your options: **buy now**, **wait** or **skip**, all from the same numbers.
4. Tap **Receipt** to see why. The Purchase Receipt lists every figure and its source: the price the camera read (91 % sure), the money available, the bills taken off first, the calculation (`90.16 − 79.90 = 10.26`), what's left, and how fresh the data is. **Check this receipt again** has the server re-verify it.
5. Tap **Plan it in**, **Wait** or **Skip**. Nothing happens until you choose. "Forget my decisions" deletes what it remembered.

**It refuses to guess.** A smudged label gets *"I can't read that price reliably. Is it 19.90 or 79.90?"* Missing, week-old or conflicting account data, or an unknown bill: no verdict, and it says why.

**No bank connected?** It asks once, *"How much do you want to spend until Sunday?"*, and labels every answer "as you told me".

### Built to be trusted
- **Show me why:** the platform signs each receipt only after every figure on it matches the money engine's calculation log. Change one number and verification fails.
- **Asks or abstains, never guesses:** deterministic rules, not a model, decide when the data can't support a verdict. Our evaluation: 19 synthetic scenarios, 15 critical, **0 false-safe answers**. Turning the rules off makes it fail.
- **No invented numbers:** every spoken or shown figure must trace to a calculation ID.
- **No action without confirmation:** signed, single-use, expiring. Money-moving actions are rejected by the contract.
- **Camera only when you ask:** EXIF and GPS stripped; the coach gets the price, not the photo, and the photo is kept for 0 seconds.
- **Consent is fail-closed;** revoking it deletes the captures made under it.

### Engineering we can show
- **Backend** (TypeScript, Fastify): orchestrator, consent, capture, trust gate, signed receipts and verification, decision memory. 83 tests pass.
- **Evaluation harness** (`npm run eval`): false-safe answers, abstention, receipt verification, latency. CI fails on any false-safe answer.
- **Money engine** (Python, from our teammate) on the Junction 2026 synthetic dataset; in the team's two-year backtest, its safe-to-spend rule cut overdraft days by 89%.
- **iOS companion** (Swift, SwiftUI) on **Meta Wearables DAT 1.0.1**: CI drives the whole flow on Meta's Mock Device Kit, including opening the receipt and re-verifying it against the server.
- **Versioned JSON Schema contracts** with generated TypeScript, Swift, Kotlin and Python types; **32 recorded architecture decisions**.

### What's real and what's mocked
- **Real:** everything above, plus no-bank mode and the team's engine on the synthetic dataset.
- **Mocked:** the label reader is scripted (the demo label, or a smudged one); there is no OCR model, so OCR accuracy isn't measured. Abstention scenarios and the default numbers are synthetic fixtures, labelled as such in the app. With the engine, "today" is a simulated date.
- **On real glasses:** **[CHECK: "verified on Ray-Ban Meta" or "demonstrated with Meta's Mock Device Kit"]**. "Hey Meta" launch and glasses-tap confirmation are experimental in Meta's SDK, so they sit behind flags with fallbacks.

### What's next
Real bank data (PSD2), a real label reader measured on labelled photos, receipts and decisions kept beyond a session, matching shop receipts to decisions, and more capabilities on the same platform.

### Tech
Swift · SwiftUI · Meta Wearables DAT 1.0.1 · Python · FastAPI · DuckDB · TypeScript · Node 22 · Fastify · JSON Schema (Ajv) · quicktype · ES256 JWS · GitHub Actions (macOS + Mock Device Kit) · Fly.io

---

## Links

| Field | Value |
|---|---|
| Source Code | https://github.com/kqtiiv/Spendtacles |
| Project Demo | **[CHECK]** The deployed backend (`https://junction26-coach.fly.dev/health`) wasn't responding when checked. Leave blank, or link the CI screenshots / a demo recording. |
| Video | **[TODO]** Record it (see the plan in chat) and upload it to YouTube (unlisted) or Loom |
| Other Link | https://github.com/kqtiiv/Spendtacles/blob/main/docs/eval/RESULTS.md (evaluation results; decisions in docs/ARCHITECTURE_DECISION_LOG.md) |
| Presentation | **[TODO]** PDF deck |

## Tech challenges
Enter only the ones the project actually uses. As of now it uses none of the sponsor technologies (no MariaDB, Modal, Cloudinary or CRACI).
