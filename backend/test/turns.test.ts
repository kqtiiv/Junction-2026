import { test } from "node:test";
import assert from "node:assert/strict";
import { validate } from "../src/contracts.ts";
import { auth, finalOf, makeApp, newSession, parseSse, turn, voiceIntent } from "./helpers.ts";

test("safe-to-spend voice turn: verified card and short spoken estimate", async () => {
  const { app } = makeApp();
  const s = await newSession(app);
  const events = await turn(app, voiceIntent(s.session_id, "what's safe to spend this week"));

  for (const e of events) assert.ok(validate("domain_response_event", e.data).ok, `event ${e.event} validates`);
  const final = finalOf(events);
  assert.equal(final.status, "answered");
  assert.match(final.speech.text, /^About 90 euros is safe to spend through Sunday\./);
  assert.equal(final.speech.epistemic, "estimate");
  assert.ok(final.speech.text.split(/\s+/).length <= 25);
  assert.equal(final.trace.verified, true);
  assert.deepEqual(final.trace.calc_ids, ["calc_sts_91"]);
  assert.equal(final.cards[0]?.primary?.value && (final.cards[0].primary.value as { amount: string }).amount, "90.16");
  assert.equal(final.x_debug?.mock, true, "fixture data is never hidden");
  assert.equal(final.x_debug?.backend, "fast_path@1");
});

test("Finnish turn gets a Finnish answer", async () => {
  const { app } = makeApp();
  const s = await newSession(app, "fi-FI");
  const intent = voiceIntent(s.session_id, "paljonko voin käyttää tällä viikolla", {
    transcript: { text: "paljonko voin käyttää tällä viikolla", lang: "fi-FI", confidence: 0.9 },
  });
  const final = finalOf(await turn(app, intent));
  assert.match(final.speech.text, /noin 90 euroa/);
  assert.equal(final.trace.verified, true);
});

test("stated-amount affordability: TIGHT, €10.26 left, plan proposal offered", async () => {
  const { app } = makeApp();
  const s = await newSession(app);
  const events = await turn(app, voiceIntent(s.session_id, "can I afford 79.90 this week"));
  const final = finalOf(events);
  assert.equal(final.speech.text, "79.90 fits, but it would leave about 10 euros until Sunday. Want me to plan it in?");
  const card = final.cards[0]!;
  assert.equal((card.primary!.value as { amount: string }).amount, "10.26");
  assert.equal(final.proposals[0]?.kind, "finance.plan.add");
  assert.ok(events.some((e) => e.event === "proposal"));
  assert.equal(final.trace.verified, true);
});

test("too expensive: EXCEEDS, no plan proposal", async () => {
  const { app } = makeApp();
  const s = await newSession(app);
  const final = finalOf(await turn(app, voiceIntent(s.session_id, "can I afford 120.00 this week")));
  assert.equal(final.speech.text, "120.00 is about 30 euros more than is safe to spend this week.");
  assert.equal(final.proposals.length, 0);
  assert.equal(final.trace.verified, true);
});

test("affordability without an amount asks for the price", async () => {
  const { app } = makeApp();
  const s = await newSession(app);
  const final = finalOf(await turn(app, voiceIntent(s.session_id, "can I afford this")));
  assert.equal(final.status, "clarify");
  assert.equal(final.speech.text, "How much does it cost?");
});

test("unsupported questions get an honest answer, no invented numbers", async () => {
  const { app } = makeApp();
  const s = await newSession(app);
  const final = finalOf(await turn(app, voiceIntent(s.session_id, "what's the weather in Helsinki")));
  assert.equal(final.status, "unsupported");
  assert.doesNotMatch(final.speech.text, /\d/);
});

test("discreet mode: no figures in speech, details stay on the card", async () => {
  const { app } = makeApp();
  const s = await newSession(app);
  const final = finalOf(await turn(app, voiceIntent(s.session_id, "what's safe to spend this week", {
    output: { speech: true, display: "phone", discreet_mode: true },
  })));
  assert.doesNotMatch(final.speech.text, /\d/);
  assert.equal((final.cards[0]!.primary!.value as { amount: string }).amount, "90.16");
});

test("same turn_id returns the same answer (idempotent turns)", async () => {
  const { app } = makeApp();
  const s = await newSession(app);
  const intent = voiceIntent(s.session_id, "can I afford 20.00");
  const a = finalOf(await turn(app, intent));
  const b = finalOf(await turn(app, intent));
  assert.deepEqual(a, b);
});

test("repeat replays the last answer", async () => {
  const { app } = makeApp();
  const s = await newSession(app);
  const first = finalOf(await turn(app, voiceIntent(s.session_id, "what's safe to spend this week")));
  const again = finalOf(await turn(app, voiceIntent(s.session_id, "repeat", { platform_intent: "repeat" })));
  assert.equal(again.speech.text, first.speech.text);
});

test("auth: missing token and mismatched user_ref are rejected with an ErrorEnvelope", async () => {
  const { app } = makeApp();
  const s = await newSession(app);
  const noToken = await app.inject({ method: "POST", url: "/v1/turns", payload: voiceIntent(s.session_id, "hi") });
  assert.equal(noToken.statusCode, 401);
  assert.ok(validate("error_envelope", noToken.json()).ok);

  const wrongUser = await app.inject({ method: "POST", url: "/v1/turns", headers: { authorization: "Bearer other-token" },
    payload: voiceIntent(s.session_id, "what's safe to spend") });
  assert.equal(wrongUser.statusCode, 401);
  assert.equal(wrongUser.json().code, "UNAUTHENTICATED");
});

test("invalid VoiceIntent → 422 VALIDATION_FAILED", async () => {
  const { app } = makeApp();
  const s = await newSession(app);
  const bad = { ...voiceIntent(s.session_id, "x"), transcript: undefined }; // spoken turn without transcript
  const res = await app.inject({ method: "POST", url: "/v1/turns", headers: auth, payload: bad });
  assert.equal(res.statusCode, 422);
  assert.equal(res.json().code, "VALIDATION_FAILED");
  assert.ok(validate("error_envelope", res.json()).ok);
});

test("captures are refused until implemented, with a speakable message", async () => {
  const { app } = makeApp();
  const s = await newSession(app);
  const res = await app.inject({ method: "POST", url: "/v1/turns", headers: auth,
    payload: voiceIntent(s.session_id, "does this fit my week", { attached_capture_ids: ["cap_1"] }) });
  const events = parseSse(res.body);
  assert.equal(events[0]?.event, "error");
  assert.equal((events[0]?.data as { code: string }).code, "DEVICE_UNAVAILABLE");
});
