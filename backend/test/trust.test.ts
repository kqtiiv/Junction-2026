// Trust gate, Purchase Receipt, independent verification, options and decision memory
// (DEC-029, DEC-030, DEC-031). Fixture data throughout; every scenario is synthetic.
import assert from "node:assert/strict";
import { test } from "node:test";
import type { InsightCard } from "../src/contracts.ts";
import { assessFinance, readPrice } from "../src/capabilities/sbank-coach/trust.ts";
import {
  auth, captureMeta, fakeJpeg, finalOf, makeApp, newSession, turn, uploadCapture, voiceIntent,
} from "./helpers.ts";
import type { FastifyInstance } from "fastify";

type App = ReturnType<typeof makeApp>;

async function askAboutLabel(a: App, text = "can I afford this") {
  const s = await newSession(a.app);
  const cap = (await uploadCapture(a.app, fakeJpeg(), captureMeta(s.session_id, s.consent_grant_id!))).json();
  const final = finalOf(await turn(a.app, voiceIntent(s.session_id, text, { attached_capture_ids: [cap.capture_id] })));
  return { s, final };
}

const receiptOf = (c: InsightCard) => c.receipt!;
const line = (c: InsightCard, key: string) => receiptOf(c).lines.find((l) => l.key === key);
const verdictOf = (c: InsightCard) => c.rows?.find((r) => r.label.en === "Verdict")?.value;

async function verify(app: FastifyInstance, card: InsightCard, token = auth) {
  return (await app.inject({ method: "POST", url: "/v1/receipts/verify", headers: token, payload: { card } })).json();
}

// ---- Purchase Receipt ---------------------------------------------------------------------------

test("a clear label gets an answer with a full, signed Purchase Receipt", async () => {
  const a = makeApp();
  const { final } = await askAboutLabel(a);
  assert.equal(final.status, "answered");
  const card = final.cards[0]!;
  const r = receiptOf(card);
  assert.equal(line(card, "product")?.text, "Langattomat kuulokkeet");
  assert.deepEqual(line(card, "price")?.money, { amount: "79.90", currency: "EUR" });
  assert.equal(line(card, "price")?.source, "camera");
  assert.equal(line(card, "ocr_confidence")?.text, "91 % sure");
  assert.deepEqual(line(card, "available")?.money, { amount: "90.16", currency: "EUR" });
  assert.equal(line(card, "calculation")?.text, "90.16 − 79.90 = 10.26");
  assert.deepEqual(line(card, "remaining")?.money, { amount: "10.26", currency: "EUR" });
  assert.equal(line(card, "verdict")?.text, "Fits, but tight");
  assert.ok(r.lines.some((l) => l.key === "commitment"), "bills accounted for are listed");
  assert.equal(r.freshness.source, "fixture");
  assert.equal(r.freshness.simulated, true, "fixture data is never presented as real");
  assert.equal(r.confidence.state, "caveated", "the electricity bill is an estimate");
  assert.ok(r.confidence.reasons.some((x) => x.code === "COMMITMENT_ESTIMATED" && !x.blocks_verdict));
  assert.equal(r.verification?.status, "verified");
  assert.ok((r.verification?.checked_values ?? 0) >= 5);
  assert.deepEqual(r.verification?.calc_ids, card.basis.calc_ids);
  assert.match(r.verification!.digest, /^sha256:[a-f0-9]{64}$/);
});

test("the receipt verifies independently, and any change to it fails", async () => {
  const a = makeApp();
  const { final } = await askAboutLabel(a);
  const card = final.cards[0]!;
  const ok = await verify(a.app, card);
  assert.equal(ok.valid, true);
  assert.equal(ok.signature_valid, true);
  assert.equal(ok.grounded, true);

  const tampered = structuredClone(card);
  tampered.receipt!.lines.find((l) => l.key === "remaining")!.money = { amount: "40.26", currency: "EUR" };
  const bad = await verify(a.app, tampered);
  assert.equal(bad.valid, false);
  assert.equal(bad.digest_matches, false);
  assert.equal(bad.reason, "MODIFIED");
  assert.equal(bad.grounded, false, "40.26 is not in the calculation log");

  const forged = structuredClone(card);
  // Flip a character in the middle of the signature segment (the last base64url character can carry only padding bits).
  const sig = card.receipt!.verification!.signature;
  const at = sig.lastIndexOf(".") + 10;
  forged.receipt!.verification!.signature = sig.slice(0, at) + (sig[at] === "A" ? "B" : "A") + sig.slice(at + 1);
  assert.equal((await verify(a.app, forged)).signature_valid, false);

  const unsigned = structuredClone(card);
  delete unsigned.receipt!.verification;
  assert.equal((await verify(a.app, unsigned)).reason, "UNSIGNED");

  // Another user's calculation log doesn't contain these figures.
  const other = await verify(a.app, card, { authorization: "Bearer other-token" });
  assert.equal(other.grounded, false);
  assert.equal(other.valid, false);

  const key = (await a.app.inject({ method: "GET", url: "/v1/receipts/public-key", headers: auth })).json();
  assert.match(key.public_key_pem, /BEGIN PUBLIC KEY/);
});

// ---- Counterfactuals ----------------------------------------------------------------------------

test("buy now / wait / skip come from the same engine results", async () => {
  const a = makeApp();
  const { final } = await askAboutLabel(a);
  const options = final.cards.find((c) => c.type === "comparison")!;
  assert.equal(options.title.en, "Your options");
  const row = (name: string) => options.rows!.find((r) => r.label.en === name)!;
  assert.deepEqual(row("Buy now").value, { amount: "10.26", currency: "EUR" });
  assert.equal(row("Wait").value, "No change today");
  assert.deepEqual(row("Skip").value, { amount: "90.16", currency: "EUR" });
  assert.deepEqual(final.followups?.map((f) => f.en), ["I'll wait", "Skip it"]);
});

// ---- Unclear labels: ask, never guess ----------------------------------------------------------

test("an ambiguous label: the coach asks which price, and answers only after the user says", async () => {
  const a = makeApp({ labels: ["ambiguous"] });
  const { s, final } = await askAboutLabel(a);
  assert.equal(final.status, "clarify");
  assert.equal(final.speech.text, "I can't read that price reliably. Is it 19.90 or 79.90?");
  assert.equal(final.proposals.length, 0, "nothing to confirm until the price is known");
  const card = final.cards[0]!;
  assert.equal(card.title.en, "Bluetooth-kaiutin");
  assert.equal(verdictOf(card), undefined, "no verdict on an unclear label");
  assert.equal(receiptOf(card).confidence.state, "abstained");
  assert.ok(receiptOf(card).confidence.reasons.some((r) => r.code === "PRICE_AMBIGUOUS"));
  assert.deepEqual(final.followups?.map((f) => f.en), ["It's 19.90", "It's 79.90"]);
  assert.equal((await verify(a.app, card)).valid, true, "observed candidates verify against the stored observation");

  const answer = finalOf(await turn(a.app, voiceIntent(s.session_id, "It's 19.90")));
  assert.equal(answer.status, "answered");
  assert.equal(answer.speech.text, "19.90 fits, with about 70 euros left until Sunday. Want me to plan it in?");
  assert.equal(line(answer.cards[0]!, "price")?.source, "user", "the user confirmed it");
  assert.equal(a.fastPath.memory.trust("u_7f3a").priceCorrections, 1, "19.90 differs from the camera's first reading");
});

test("a low-confidence reading is confirmed with a yes before use", async () => {
  const a = makeApp({ labels: ["low_confidence"] });
  const { s, final } = await askAboutLabel(a);
  assert.equal(final.speech.text, "I'm not sure I read that right. Is it 79.90?");
  const answer = finalOf(await turn(a.app, voiceIntent(s.session_id, "yes")));
  assert.equal(answer.speech.text, "79.90 fits, but it would leave about 10 euros until Sunday. Want me to plan it in?");
});

test("an unreadable label asks for the price", async () => {
  const a = makeApp({ labels: ["unreadable"] });
  const { final } = await askAboutLabel(a);
  assert.equal(final.status, "clarify");
  assert.equal(final.speech.text, "I couldn't read the price clearly. Can you tell me the price?");
  assert.equal(final.proposals.length, 0);
});

// ---- Account data the coach can't rely on --------------------------------------------------------

const abstains: Array<[Parameters<typeof makeApp>[0] & object, string, RegExp]> = [
  [{ scenario: "missing" }, "FINANCE_DATA_MISSING", /can't see your money/],
  [{ scenario: "stale" }, "DATA_TOO_OLD", /more than a week old/],
  [{ scenario: "unknown_bill" }, "COMMITMENT_UNKNOWN", /upcoming bill hasn't been accounted for/],
  [{ scenario: "conflict" }, "SOURCE_CONFLICT", /disagree/],
  [{ scenario: "pace" }, "NO_BALANCE", /can't see your balance/],
];
for (const [opts, code, said] of abstains) {
  test(`no verdict when the data can't support one: ${code}`, async () => {
    const a = makeApp(opts);
    const { final } = await askAboutLabel(a);
    assert.equal(final.status, "partial");
    assert.match(final.speech.text, said);
    assert.doesNotMatch(final.speech.text, /\d/, "no figures in an abstention");
    assert.equal(final.proposals.length, 0, "nothing proposed without a verdict");
    const card = final.cards[0]!;
    assert.equal(verdictOf(card), "Not given");
    assert.equal(receiptOf(card).confidence.state, "abstained");
    assert.ok(receiptOf(card).confidence.reasons.some((r) => r.code === code && r.blocks_verdict));
    assert.ok(!final.cards.some((c) => c.type === "comparison"), "no options without a verdict");
  });
}

test("insufficient money: explains it doesn't fit and proposes nothing", async () => {
  const a = makeApp({ scenario: "insufficient" });
  const { final } = await askAboutLabel(a);
  assert.equal(final.status, "answered");
  assert.equal(final.speech.text, "If that price is 79.90, it's about 68 euros more than is safe to spend this week.");
  assert.equal(verdictOf(final.cards[0]!), "Doesn't fit this week");
  assert.equal(line(final.cards[0]!, "calculation")?.text, "12.40 − 79.90 = -67.50");
  assert.equal(final.proposals.length, 0);
});

test("data a couple of days old still gets an answer, with the age on the receipt", async () => {
  const a = makeApp({ scenario: "stale_recent" });
  const { final } = await askAboutLabel(a);
  assert.equal(final.status, "answered");
  assert.ok(receiptOf(final.cards[0]!).confidence.reasons.some((r) => r.code === "DATA_STALE" && !r.blocks_verdict));
});

test("safe-to-spend questions go through the same gate", async () => {
  const a = makeApp({ scenario: "conflict" });
  const s = await newSession(a.app);
  const final = finalOf(await turn(a.app, voiceIntent(s.session_id, "what's safe to spend this week")));
  assert.equal(final.status, "partial");
  assert.match(final.speech.text, /disagree/);
});

test("assessFinance: a simulated date is disclosed, not judged stale", () => {
  const sts = { schema: "platform.tool_result/v1", ok: true, calc_id: "c", tool: "finance.get_safe_to_spend_until_payday", tool_version: "1",
    as_of: "2026-09-05T00:00:00Z", assumptions: [], missing_data: [], warnings: [], result: {} } as never;
  const r = assessFinance(sts, "s_pankki", new Date("2026-11-15T00:00:00Z"));
  assert.deepEqual(r.map((x) => x.code), ["SIMULATED_DATE"]);
});

test("readPrice: duplicates collapse, the most confident price comes first", () => {
  const obs = { schema: "platform.observation/v1", observation_id: "o", capture_id: "c", kind: "price_label", epistemic: "observed",
    extractor: { provider_id: "x", version: "1" }, needs_user_check: false, issues: [], created_at: "2026-11-15T00:00:00Z",
    items: [
      { label_untrusted: "A", price: { amount: "19.90", currency: "EUR" }, confidence: 0.4 },
      { label_untrusted: "A", price: { amount: "79.90", currency: "EUR" }, confidence: 0.9 },
      { label_untrusted: "A", price: { amount: "79.90", currency: "EUR" }, confidence: 0.85 },
    ] } as never;
  const r = readPrice([obs])!;
  assert.deepEqual(r.candidates, ["79.90", "19.90"]);
  assert.equal(r.needsCheck, true);
});

// ---- Decisions and memory ---------------------------------------------------------------------

test("wait, skip, history and forget: remembered, counted, deletable", async () => {
  const a = makeApp({ labels: ["clear", "clear"] });
  const { s, final } = await askAboutLabel(a);
  const proposalId = final.proposals[0]!.proposal_id;

  const waited = finalOf(await turn(a.app, voiceIntent(s.session_id, "I'll wait")));
  assert.equal(waited.speech.text, "OK, I'll remember it. Nothing changes in your plan. Ask me again on Monday.");
  const decisions = waited.cards[0]!;
  assert.equal(decisions.title.en, "Your decisions");
  assert.deepEqual(decisions.primary?.value, { amount: "79.90", currency: "EUR" });
  assert.equal(decisions.receipt?.verification?.status, "verified", "the decision sum is a logged calculation");
  const late = await a.app.inject({ method: "POST", url: "/v1/confirmations", headers: auth,
    payload: { proposal_id: proposalId, decision: "confirm", channel: "phone_tap", evidence: { ui_event_id: "ui" } } });
  assert.notEqual(late.json().status, "applied", "waiting withdraws the plan-it-in offer");

  const cap = (await uploadCapture(a.app, fakeJpeg(), captureMeta(s.session_id, s.consent_grant_id!))).json();
  await turn(a.app, voiceIntent(s.session_id, "can I afford this", { attached_capture_ids: [cap.capture_id] }));
  const skipped = finalOf(await turn(a.app, voiceIntent(s.session_id, "skip it")));
  assert.equal(skipped.speech.text, "Skipped. That keeps about 80 euros unspent for now.");
  assert.deepEqual(skipped.cards[0]!.primary?.value, { amount: "159.80", currency: "EUR" });

  const history = finalOf(await turn(a.app, voiceIntent(s.session_id, "what have I decided")));
  assert.equal(history.speech.text, "You've reconsidered 2 of 2 purchases. The list is on your phone.");
  assert.equal(history.x_debug?.verified, true);

  const forgot = finalOf(await turn(a.app, voiceIntent(s.session_id, "forget my decisions")));
  assert.match(forgot.speech.text, /forgotten/);
  assert.equal(a.fastPath.memory.list("u_7f3a").length, 0);
  const empty = finalOf(await turn(a.app, voiceIntent(s.session_id, "what have I decided")));
  assert.match(empty.speech.text, /haven't decided/);
});

test("'I'll wait' with nothing asked about yet asks for context instead of guessing", async () => {
  const a = makeApp();
  const s = await newSession(a.app);
  const final = finalOf(await turn(a.app, voiceIntent(s.session_id, "I'll wait")));
  assert.equal(final.status, "clarify");
});

test("planning it in is remembered as a decision", async () => {
  const a = makeApp();
  const { final } = await askAboutLabel(a);
  const tap = await a.app.inject({ method: "POST", url: "/v1/confirmations", headers: auth,
    payload: { proposal_id: final.proposals[0]!.proposal_id, decision: "confirm", channel: "phone_tap", evidence: { ui_event_id: "ui" } } });
  assert.equal(tap.json().status, "applied");
  assert.equal(tap.json().card.receipt.verification.status, "verified", "the updated week is signed too");
  assert.deepEqual(a.fastPath.memory.list("u_7f3a").map((e) => e.decision), ["planned"]);
});

test("an expired proposal can't be confirmed", async () => {
  const a = makeApp({ proposalTtlMs: 1 });
  const { final } = await askAboutLabel(a);
  await new Promise((r) => setTimeout(r, 10));
  const tap = await a.app.inject({ method: "POST", url: "/v1/confirmations", headers: auth,
    payload: { proposal_id: final.proposals[0]!.proposal_id, decision: "confirm", channel: "phone_tap", evidence: { ui_event_id: "ui" } } });
  assert.equal(tap.json().code, "PROPOSAL_EXPIRED");
});
