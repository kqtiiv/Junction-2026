// The demo conversation without any device (fallback for docs/demo/DEMO_SCRIPT.md):
// the real orchestrator and money coach in process, fixture data, scripted label readings
// ("clear" then "ambiguous"). Prints what the glasses would say and what the phone shows,
// then re-checks a receipt and shows that a tampered copy fails.
//
//   cd backend && npm run demo
import type { InsightCard } from "../src/contracts.ts";
import { auth, captureMeta, fakeJpeg, finalOf, makeApp, newSession, turn, uploadCapture, voiceIntent } from "../test/helpers.ts";

const a = makeApp({ labels: ["clear", "ambiguous"] });
const s = await newSession(a.app);
const capture = async () => (await uploadCapture(a.app, fakeJpeg(), captureMeta(s.session_id, s.consent_grant_id!))).json().capture_id as string;
const money = (m?: { amount: string }) => (m ? `€${m.amount}` : "");

function show(n: number, user: string, f: ReturnType<typeof finalOf>) {
  console.log(`\n${n}. You: “${user}”`);
  console.log(`   Glasses: “${f.speech.text}”`);
  for (const c of f.cards) {
    const r = c.receipt;
    console.log(`   Phone card: ${c.title.en}${c.primary ? ` — ${money(c.primary.value as { amount: string })} ${c.primary.label.en?.toLowerCase()}` : ""}`);
    if (c.type === "comparison") for (const row of c.rows ?? []) console.log(`     ${row.label.en}: ${typeof row.value === "string" ? row.value : money(row.value)}${row.note?.en ? ` (${row.note.en})` : ""}`);
    if (r) {
      console.log(`     Receipt: ${r.confidence.state}${r.verification ? `, signed, ${r.verification.checked_values} figures checked` : ""}${r.freshness.simulated ? ", synthetic data" : ""}`);
      for (const reason of r.confidence.reasons) console.log(`       ${reason.blocks_verdict ? "✋" : "ℹ"} ${reason.text.en}`);
    }
  }
  if (f.followups?.length) console.log(`   Chips: ${f.followups.map((x) => x.en).join(" · ")}`);
  if (f.proposals.length) console.log(`   Offer: ${f.proposals[0]!.summary.text.en}`);
}

console.log("Spendtacles demo — fixture finance data and a scripted (mock) label reader. Synthetic, not a real account.");
const first = finalOf(await turn(a.app, voiceIntent(s.session_id, "Can I afford these?", { attached_capture_ids: [await capture()] })));
show(1, "Can I afford these?  (looking at wireless headphones, €79.90)", first);
show(2, "And this one?  (a speaker; the label is smudged)",
  finalOf(await turn(a.app, voiceIntent(s.session_id, "can I afford this one", { attached_capture_ids: [await capture()] }))));
show(3, "It's 79.90", finalOf(await turn(a.app, voiceIntent(s.session_id, "It's 79.90"))));
show(4, "I'll wait", finalOf(await turn(a.app, voiceIntent(s.session_id, "I'll wait"))));

const card = first.cards[0] as InsightCard;
const check = async (c: InsightCard) => (await a.app.inject({ method: "POST", url: "/v1/receipts/verify", headers: auth, payload: { card: c } })).json();
const ok = await check(card);
const tampered = structuredClone(card);
tampered.receipt!.lines.find((l) => l.key === "remaining")!.money = { amount: "40.26", currency: "EUR" };
const bad = await check(tampered);
console.log(`\n5. Independent check of the first receipt: ${ok.valid ? "VALID" : "INVALID"} (signature ${ok.signature_valid ? "ok" : "bad"}, contents ${ok.digest_matches ? "unchanged" : "changed"}, figures ${ok.grounded ? "match the calculation log" : "don't match"})`);
console.log(`   Same receipt with "left after buying" changed to €40.26: ${bad.valid ? "VALID" : "INVALID"} (${bad.reason ?? ""}${bad.grounded ? "" : ", 40.26 isn't in the calculation log"})`);
