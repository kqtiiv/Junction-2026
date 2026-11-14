// No bank data: the coach asks one question, at the moment it matters, then remembers.
import { test } from "node:test";
import assert from "node:assert/strict";
import { validate } from "../src/contracts.ts";
import { captureMeta, fakeJpeg, finalOf, makeApp, newSession, turn, uploadCapture, voiceIntent } from "./helpers.ts";

// Thursday 19.11.2026 18:00 Helsinki: 4 days left this week (Thu–Sun).
const THURSDAY = new Date("2026-11-19T16:00:00Z");
const fi = (text: string) => ({ transcript: { text, lang: "fi-FI", confidence: 0.92 } });

function app(now: () => Date = () => THURSDAY) {
  return makeApp({ userStated: { now } });
}

test("first question with no amount: one spoken question, no numbers invented", async () => {
  const { app: a } = app();
  const s = await newSession(a);
  const final = finalOf(await turn(a, voiceIntent(s.session_id, "what's safe to spend this week")));
  assert.equal(final.status, "clarify");
  assert.equal(final.speech.text, "How much do you want to spend until Sunday?");
  assert.equal(final.cards.length, 0);
  assert.doesNotMatch(final.speech.text, /\d/);
});

test("price label → one question → 'about a hundred' → the original question answered", async () => {
  const { app: a } = app();
  const s = await newSession(a);
  const cap = (await uploadCapture(a, fakeJpeg(), captureMeta(s.session_id, s.consent_grant_id!))).json();

  const ask = finalOf(await turn(a, voiceIntent(s.session_id, "does this fit my week", { attached_capture_ids: [cap.capture_id] })));
  assert.equal(ask.speech.text, "How much do you want to spend until Sunday?");

  const events = await turn(a, voiceIntent(s.session_id, "about a hundred"));
  for (const e of events) assert.ok(validate("domain_response_event", e.data).ok, `event ${e.event} validates`);
  const answer = finalOf(events);
  assert.equal(answer.speech.text, "Got it: 100 euros until Sunday. If the label's right, that leaves about 20. Want me to plan it in?");
  assert.ok(answer.speech.text.split(/\s+/).length <= 25, "fits the speech budget, question included");
  assert.equal(answer.trace.verified, true);
  assert.equal(answer.x_debug?.mock, false, "the user's own figures are not a mock");
  const card = answer.cards[0]!;
  assert.equal((card.primary!.value as { amount: string }).amount, "20.10");
  assert.ok(card.rows!.some((r) => r.label.en === "Left of your weekly amount" && (r.value as { amount: string }).amount === "100.00"));
  assert.ok(card.missing_data.some((m) => m.en?.includes("No bank connected")));
  assert.equal(answer.proposals[0]?.kind, "finance.plan.add");
});

test("the amount is remembered: no second question, and confirmed plans count down", async () => {
  const { app: a } = app();
  const s = await newSession(a);
  await turn(a, voiceIntent(s.session_id, "can I afford 30.00 this week"));
  const got = finalOf(await turn(a, voiceIntent(s.session_id, "100")));
  assert.equal(got.speech.text, "Got it: 100 euros until Sunday. That leaves about 70 after this. Want me to plan it in?");

  const tap = await a.inject({ method: "POST", url: "/v1/confirmations", headers: { authorization: "Bearer test-token" },
    payload: { proposal_id: got.proposals[0]!.proposal_id, decision: "confirm", channel: "phone_tap", evidence: { ui_event_id: "ui" } } });
  assert.equal(tap.json().status, "applied");

  const after = finalOf(await turn(a, voiceIntent(s.session_id, "what's safe to spend this week")));
  assert.equal(after.speech.text, "You have about 70 euros left of your weekly amount until Sunday.");
  const card = after.cards[0]!;
  assert.equal(card.title.en, "Left this week");
  assert.deepEqual(card.rows!.map((r) => [r.label.en, r.value]), [
    ["Your weekly amount", { amount: "100.00", currency: "EUR" }],
    ["Planned this week", { amount: "30.00", currency: "EUR" }],
    ["Days left this week", "4"],
  ]);
  assert.equal(after.trace.verified, true);
});

test("it carries over to next week without asking again (lazy by design)", async () => {
  let now = THURSDAY;
  const { app: a } = app(() => now);
  const s = await newSession(a);
  await turn(a, voiceIntent(s.session_id, "what's safe to spend this week"));
  await turn(a, voiceIntent(s.session_id, "80"));
  now = new Date("2026-11-24T08:00:00Z"); // Tuesday next week
  const next = finalOf(await turn(a, voiceIntent(s.session_id, "what's safe to spend this week")));
  assert.equal(next.status, "answered");
  assert.equal(next.speech.text, "You have about 80 euros left of your weekly amount until Sunday.");
  assert.ok(next.cards[0]!.assumptions.some((x) => x.en?.includes("Carried over")));
  assert.equal(next.cards[0]!.rows!.find((r) => r.label.en === "Days left this week")!.value, "6");
});

test("saying a new amount changes it", async () => {
  const { app: a } = app();
  const s = await newSession(a);
  const set = finalOf(await turn(a, voiceIntent(s.session_id, "my budget this week is 60 euros")));
  assert.equal(set.speech.text, "OK: 60 euros until Sunday. I'll keep track as you plan things.");
  const check = finalOf(await turn(a, voiceIntent(s.session_id, "what's safe to spend this week")));
  assert.match(check.speech.text, /about 60 euros left/);
});

test("Finnish: 'noin sata' answers the question", async () => {
  const { app: a } = app();
  const s = await newSession(a, "fi-FI");
  const ask = finalOf(await turn(a, voiceIntent(s.session_id, "paljonko voin käyttää tällä viikolla", fi("paljonko voin käyttää tällä viikolla"))));
  assert.equal(ask.speech.text, "Paljonko haluat käyttää sunnuntaihin asti?");
  const got = finalOf(await turn(a, voiceIntent(s.session_id, "noin sata", fi("noin sata"))));
  assert.equal(got.speech.text, "Selvä: 100 euroa sunnuntaihin asti. Pidän kirjaa, kun suunnittelet ostoksia.");
  assert.equal(got.trace.verified, true);
});

test("an unclear answer is asked once more, then dropped politely", async () => {
  const { app: a } = app();
  const s = await newSession(a);
  await turn(a, voiceIntent(s.session_id, "what's safe to spend this week"));
  const again = finalOf(await turn(a, voiceIntent(s.session_id, "hmm I'm not sure")));
  assert.equal(again.speech.text, "Sorry, how many euros until Sunday?");
  const dropped = finalOf(await turn(a, voiceIntent(s.session_id, "no idea")));
  assert.equal(dropped.speech.text, "No problem. Ask me again any time.");
  // Next time the question comes up, the coach asks again: nothing was guessed.
  const later = finalOf(await turn(a, voiceIntent(s.session_id, "what's safe to spend this week")));
  assert.equal(later.status, "clarify");
});

test("a bare number without a pending question is not taken as a budget", async () => {
  const { app: a } = app();
  const s = await newSession(a);
  const final = finalOf(await turn(a, voiceIntent(s.session_id, "100")));
  assert.equal(final.status, "unsupported");
});

test("over budget after answering: says how much over, offers no plan", async () => {
  const { app: a } = app();
  const s = await newSession(a);
  await turn(a, voiceIntent(s.session_id, "can I afford 79.90 this week"));
  const got = finalOf(await turn(a, voiceIntent(s.session_id, "fifty")));
  assert.equal(got.speech.text, "Got it: 50 euros until Sunday. This is about 30 more than that.");
  assert.equal(got.proposals.length, 0);
  assert.equal(got.trace.verified, true);
});

// ---- Regression tests for review findings -------------------------------------------------

test("'I have 3 days left, how much can I spend this week?' is a question, not a 3 EUR budget", async () => {
  const { app: a } = app();
  const s = await newSession(a);
  const final = finalOf(await turn(a, voiceIntent(s.session_id, "I have 3 days left, how much can I spend this week?")));
  assert.equal(final.status, "clarify", "asks for the weekly amount; nothing was set");
  assert.equal(final.speech.text, "How much do you want to spend until Sunday?");
});

test("the same sentence in fixture mode is still answered (no regression)", async () => {
  const { app: a } = makeApp();
  const s = await newSession(a);
  const final = finalOf(await turn(a, voiceIntent(s.session_id, "I have 3 days left, how much can I spend this week?")));
  assert.match(final.speech.text, /^About 90 euros is safe to spend/);
});

test("a new question while the coach is waiting is not taken as the amount", async () => {
  const { app: a } = app();
  const s = await newSession(a);
  await turn(a, voiceIntent(s.session_id, "what's safe to spend this week"));
  const switched = finalOf(await turn(a, voiceIntent(s.session_id, "can I afford 30 euros")));
  assert.equal(switched.speech.text, "How much do you want to spend until Sunday?", "asks again for the NEW question");
  const got = finalOf(await turn(a, voiceIntent(s.session_id, "100")));
  assert.equal(got.speech.text, "Got it: 100 euros until Sunday. That leaves about 70 after this. Want me to plan it in?",
    "the budget is 100, not 30, and the answer is to the latest question");
});

test("'give me 5 minutes' is not an answer", async () => {
  const { app: a } = app();
  const s = await newSession(a);
  await turn(a, voiceIntent(s.session_id, "what's safe to spend this week"));
  const retry = finalOf(await turn(a, voiceIntent(s.session_id, "give me 5 minutes")));
  assert.equal(retry.speech.text, "Sorry, how many euros until Sunday?");
});

test("'my budget is a hundred' and 'viikkobudjetti on sata' set the amount", async () => {
  const { app: a } = app();
  const s = await newSession(a);
  const en = finalOf(await turn(a, voiceIntent(s.session_id, "my budget is a hundred")));
  assert.equal(en.speech.text, "OK: 100 euros until Sunday. I'll keep track as you plan things.");
  const f = await newSession(a, "fi-FI");
  const fiFinal = finalOf(await turn(a, voiceIntent(f.session_id, "viikkobudjetti on sata", fi("viikkobudjetti on sata"))));
  assert.equal(fiFinal.speech.text, "Selvä: 100 euroa sunnuntaihin asti. Pidän kirjaa, kun suunnittelet ostoksia.");
});

test("a resumed price-label question cites the observation the price came from", async () => {
  const { app: a } = app();
  const s = await newSession(a);
  const cap = (await uploadCapture(a, fakeJpeg(), captureMeta(s.session_id, s.consent_grant_id!))).json();
  await turn(a, voiceIntent(s.session_id, "does this fit my week", { attached_capture_ids: [cap.capture_id] }));
  const got = finalOf(await turn(a, voiceIntent(s.session_id, "100")));
  const card = got.cards[0]!;
  assert.equal(card.basis.observation_ids?.length, 1);
  assert.equal(card.epistemic, "estimate", "camera-read price stays an estimate");
  const typed = await newSession(a);
  await turn(a, voiceIntent(typed.session_id, "what's safe to spend this week"));
  const stated = finalOf(await turn(a, voiceIntent(typed.session_id, "can I afford 30.00 this week")));
  assert.equal(stated.cards[0]!.epistemic, "calculated", "stated amount + your weekly figure is exact");
  assert.equal(stated.cards[0]!.basis.observation_ids, undefined);
});

test("confirming returns the updated week, and money in the sheet is left for the phone to format", async () => {
  const { app: a } = app();
  const s = await newSession(a);
  await turn(a, voiceIntent(s.session_id, "can I afford 30.00 this week"));
  const got = finalOf(await turn(a, voiceIntent(s.session_id, "100")));
  const proposal = got.proposals[0]!;
  assert.doesNotMatch(proposal.summary.text.en!, /\d/, "no pre-formatted money in the sentence");
  assert.deepEqual(proposal.details.map((d) => [d.label.en, d.before ?? null, d.after]), [
    ["Amount", null, "30.00"],
    ["Left this week", "100.00", "70.00"],
  ]);
  const res = await a.inject({ method: "POST", url: "/v1/confirmations", headers: { authorization: "Bearer test-token" },
    payload: { proposal_id: proposal.proposal_id, decision: "confirm", channel: "phone_tap", evidence: { ui_event_id: "ui" } } });
  const result = res.json();
  assert.ok(validate("action_result", result).ok);
  assert.equal(result.card.title.en, "Left this week");
  assert.equal(result.card.primary.value.amount, "70.00");
});

test("gesture confirmation also returns the updated card", async () => {
  const { app: a } = makeApp();
  const s = await newSession(a);
  const p = finalOf(await turn(a, voiceIntent(s.session_id, "can I afford 79.90 this week"))).proposals[0]!;
  const events = await turn(a, voiceIntent(s.session_id, "", {
    invocation: "glasses_input", transcript: undefined, input: { kind: "tap", device_event_id: "d1" }, platform_intent: "confirm",
    context: { active_capability: "sbank.coach", pending_proposal_id: p.proposal_id, conversation_ref: "c", recent_turns: [] },
  }));
  assert.ok(events.some((e) => e.event === "card"));
  const final = finalOf(events);
  assert.equal((final.cards[0]!.primary!.value as { amount: string }).amount, "10.26");
  assert.deepEqual(final.trace.calc_ids, final.cards[0]!.basis.calc_ids);
});

test("shelf-label capitals are shown in sentence case", async () => {
  const { app: a } = makeApp();
  const s = await newSession(a);
  const cap = (await uploadCapture(a, fakeJpeg(), captureMeta(s.session_id, s.consent_grant_id!))).json();
  const final = finalOf(await turn(a, voiceIntent(s.session_id, "does this fit my week", { attached_capture_ids: [cap.capture_id] })));
  assert.equal(final.proposals[0]!.summary.text.en, "Add “Langattomat kuulokkeet” to this week's planned spending?");
});
