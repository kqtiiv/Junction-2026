# Spendtacles: judge demo script

**About 3 minutes.** One story: wireless headphones that fit, a smudged label the coach refuses to guess, and a decision to wait. Then proof.

Everything uses **synthetic data**: fixture finance numbers and a scripted (mock) label reader. Say so out loud. The app also shows it: "Simulated glasses" in the header, "Synthetic data" on every receipt.

## Before you start (5 minutes)

1. **Backend**, on a laptop the phone can reach:

   ```bash
   cd backend && npm install
   LABEL_FIXTURE_SEQUENCE=clear,ambiguous npm run dev     # http://<laptop-ip>:8787
   ```

   The label reader returns the €79.90 headphones label on the first photo, a smudged speaker label (19.90 or 79.90?) on the second, and then cycles. **Restart the backend** to reset the sequence and the demo's memory.

2. **App**: the iOS companion, either on an iPhone with Ray-Ban Meta glasses or in the iOS Simulator with Meta's Mock Device Kit (`CompanionSim` scheme, see `companion-ios/README.md`). Grant consent, then use the menu (…) and choose **Connect glasses**. The header should say **Simulated glasses** or **Glasses connected**.

3. **Check the safety numbers once** (10 seconds, no device):

   ```bash
   cd backend && npm run eval -- --check     # must end with: false-safe 0
   ```

4. Have [`docs/eval/RESULTS.md`](../eval/RESULTS.md) open in a browser tab.

## The demo

| # | You do / say | Glasses say | Phone shows | Point out |
|---|---|---|---|---|
| 1 | Look at the headphones. **"Can I afford these?"** | "If that price is 79.90, it fits, but it would leave about 10 euros until Sunday. Want me to plan it in?" | Card titled **Langattomat kuulokkeet**, yellow price tag **10,26 €**, Your options (Buy now 10,26 € · Wait · Skip 90,16 €) | The answer comes while the item is still on the shelf. It's about this item, not a budgeting lecture. |
| 2 | Tap **Receipt · 10 figures checked** | — | Till receipt: product, price read by camera (91 % sure), safe to spend 90,16 €, electricity bill *estimated*, `90.16 − 79.90 = 10.26`, verdict rule, synthetic data, calc IDs | **"Don't just tell me. Show me why."** Every line says where it came from. |
| 3 | Tap **Check this receipt again** | — | **Verified just now**: signature, contents and every figure match | The phone sends the card back. The server re-checks the signature and re-matches every figure to the money engine's calculation log. Tap **Done**. |
| 4 | Look at the speaker with the smudged label. **"And this one?"** | "I can't read that price reliably. Is it 19.90 or 79.90?" | **Bluetooth-kaiutin**, "No verdict", the two possible prices with how sure the camera is; chips *It's 19.90* · *It's 79.90* | **It refuses to guess.** No verdict and nothing to confirm until the price is known. |
| 5 | **"It's 79.90"** (or tap the chip) | "79.90 fits, but it would leave about 10 euros until Sunday. Want me to plan it in?" | Answer card; the price line now says *confirmed by you* | No "if that price is" this time: you said the price, so it isn't hedged. |
| 6 | Tap **I'll wait** | "OK, I'll remember it. Nothing changes in your plan. Ask me again on Monday." | **Your decisions**: 79,90 € kept unspent for now, purchases reconsidered 1 of 1, prices checked with you 1 | No guilt, no fake savings claim. The plan offer is withdrawn. "Forget my decisions" deletes this. |
| 7 | Switch to `docs/eval/RESULTS.md` | — | 19 scenarios, 15 critical, **0 false-safe answers**, every receipt verified, tamper detected | It's measured, not just asserted. Also say what isn't measured: OCR accuracy (no OCR model yet). |

**Closing line:** "Spendtacles doesn't just tell you whether you can buy something. It shows you what the decision means for your money, and it proves how it got there."

## If something fails

| Problem | Do this |
|---|---|
| Glasses won't connect | Menu → **Use phone only** and type **"can I afford 79.90"**. You get the same answer, receipt and options; the price is labelled *as you said*. Skip step 4 (it needs a photo) and use fallback C for it. |
| Wrong label on a photo (sequence out of step) | Restart the backend; the sequence starts again at the headphones. |
| Phone can't reach the backend | Run fallback C on the laptop. |
| **C. No device at all** | `cd backend && npm run demo` prints the whole conversation (steps 1 and 4–6), then verifies a receipt and shows that a tampered copy fails. Real orchestrator and money coach, in process. |
| No laptop either | The CI run's `ios-screenshots` artifact has the app walking through consent, answer, receipt, verified receipt, decision and confirmation on Meta's Mock Device Kit. |

## Questions judges ask

- **"Is the AI making up the numbers?"** No AI computes money. A deterministic engine does, every figure has a calculation ID, and a verifier drops anything the engine didn't calculate before it's spoken or shown (DEC-019, DEC-029).
- **"What if the camera misreads the price?"** Below 80 % confidence, or with two possible prices, it asks. It never answers from an unclear label (DEC-030). The eval has three scenarios for this.
- **"What if the bank data is wrong or old?"** Missing, week-old or conflicting data, or an unknown bill: no verdict, and it says why. Data a day or two old: an answer with the age on the receipt (DEC-030).
- **"Can it spend my money?"** No. Money-moving actions are rejected by the contract. Planning something in needs a signed, single-use, expiring confirmation (DEC-012, DEC-018).
- **"What's real?"** The orchestrator, consent, capture pipeline, trust gate, receipts and signing, verification, decision memory, contracts and the iOS app are real and tested. The label reader and the default finance numbers are mocks, and the app says so. The team's money engine runs on the synthetic Junction dataset (`FINANCE_SOURCE=s_pankki`).
