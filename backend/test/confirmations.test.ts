import { test } from "node:test";
import assert from "node:assert/strict";
import { loadExample, validate, type DeviceSessionState } from "../src/contracts.ts";
import { auth, finalOf, makeApp, newSession, parseSse, turn, voiceIntent } from "./helpers.ts";

async function proposalTurn(app: Parameters<typeof turn>[0], sessionId: string) {
  const final = finalOf(await turn(app, voiceIntent(sessionId, "can I afford 79.90 this week")));
  const proposal = final.proposals[0];
  assert.ok(proposal, "a plan proposal is offered");
  return proposal;
}

test("phone-tap confirmation applies once; the week's allowance updates; replay is refused", async () => {
  const { app } = makeApp();
  const s = await newSession(app);
  const p = await proposalTurn(app, s.session_id);

  const res = await app.inject({ method: "POST", url: "/v1/confirmations", headers: auth,
    payload: { proposal_id: p.proposal_id, decision: "confirm", channel: "phone_tap", evidence: { ui_event_id: "ui_1" } } });
  assert.equal(res.statusCode, 200, res.body);
  const result = res.json();
  assert.ok(validate("action_result", result).ok);
  assert.equal(result.status, "applied");

  const after = finalOf(await turn(app, voiceIntent(s.session_id, "what's safe to spend this week")));
  assert.equal((after.cards[0]!.primary!.value as { amount: string }).amount, "10.26");
  assert.match(after.speech.text, /^About 10 euros/);
  assert.equal(after.trace.verified, true);

  const replay = await app.inject({ method: "POST", url: "/v1/confirmations", headers: auth,
    payload: { proposal_id: p.proposal_id, decision: "confirm", channel: "phone_tap", evidence: { ui_event_id: "ui_2" } } });
  assert.equal(replay.statusCode, 409);
  assert.equal(replay.json().code, "PROPOSAL_ALREADY_DECIDED");
  assert.ok(validate("error_envelope", replay.json()).ok);
});

test("glasses-gesture confirmation through a turn", async () => {
  const { app } = makeApp();
  const s = await newSession(app);
  const p = await proposalTurn(app, s.session_id);
  const final = finalOf(await turn(app, voiceIntent(s.session_id, "", {
    invocation: "glasses_input", transcript: undefined, input: { kind: "tap", device_event_id: "dev_1" },
    platform_intent: "confirm",
    context: { active_capability: "sbank.coach", pending_proposal_id: p.proposal_id, conversation_ref: "c", recent_turns: [] },
  })));
  assert.match(final.speech.text, /^Done\./);
});

test("gesture confirmation is refused while the camera stream is active (DEC-007)", async () => {
  const { app } = makeApp();
  const s = await newSession(app);
  const p = await proposalTurn(app, s.session_id);
  const state = { ...loadExample<DeviceSessionState>("valid/device_session_state.glasses_capture.json"), session_id: s.session_id, seq: 1 };
  const put = await app.inject({ method: "PUT", url: `/v1/sessions/${s.session_id}/device-state`, headers: auth, payload: state });
  assert.equal(put.statusCode, 204, put.body);

  const res = await app.inject({ method: "POST", url: "/v1/confirmations", headers: auth,
    payload: { proposal_id: p.proposal_id, decision: "confirm", channel: "glasses_gesture", evidence: { input: { kind: "tap", device_event_id: "d" } } } });
  assert.equal(res.statusCode, 409);
  assert.equal(res.json().code, "CONFIRM_CHANNEL_NOT_ALLOWED");

  // The refusal did not consume the proposal: a phone tap still works.
  const tap = await app.inject({ method: "POST", url: "/v1/confirmations", headers: auth,
    payload: { proposal_id: p.proposal_id, decision: "confirm", channel: "phone_tap", evidence: { ui_event_id: "ui" } } });
  assert.equal(tap.json().status, "applied");
});

test("voice confirmation needs the exact word and ASR confidence ≥ 0.85", async () => {
  const { app } = makeApp();
  const s = await newSession(app);
  const p = await proposalTurn(app, s.session_id);
  const ctx = { active_capability: "sbank.coach", pending_proposal_id: p.proposal_id, conversation_ref: "c", recent_turns: [] };

  const casual = parseSse((await app.inject({ method: "POST", url: "/v1/turns", headers: auth,
    payload: voiceIntent(s.session_id, "yeah sure", { platform_intent: "confirm", context: ctx }) })).body);
  assert.equal((casual[0]!.data as { code: string }).code, "CONFIRM_CHANNEL_NOT_ALLOWED");

  const unsure = parseSse((await app.inject({ method: "POST", url: "/v1/turns", headers: auth,
    payload: voiceIntent(s.session_id, "confirm", { platform_intent: "confirm", context: ctx,
      transcript: { text: "confirm", lang: "en-FI", confidence: 0.6 } }) })).body);
  assert.equal((unsure[0]!.data as { code: string }).code, "VALIDATION_FAILED");

  const ok = finalOf(await turn(app, voiceIntent(s.session_id, "Confirm.", { platform_intent: "confirm", context: ctx })));
  assert.match(ok.speech.text, /^Done\./);
});

test("channels the proposal does not allow are refused", async () => {
  const { app } = makeApp();
  const s = await newSession(app);
  const p = await proposalTurn(app, s.session_id);
  const res = await app.inject({ method: "POST", url: "/v1/confirmations", headers: auth,
    payload: { proposal_id: p.proposal_id, decision: "confirm", channel: "phone_biometric", evidence: { ui_event_id: "x" } } });
  assert.equal(res.json().code, "CONFIRM_CHANNEL_NOT_ALLOWED");
});

test("another user cannot see or confirm the proposal", async () => {
  const { app } = makeApp();
  const s = await newSession(app);
  const p = await proposalTurn(app, s.session_id);
  const res = await app.inject({ method: "POST", url: "/v1/confirmations", headers: { authorization: "Bearer other-token" },
    payload: { proposal_id: p.proposal_id, decision: "confirm", channel: "phone_tap", evidence: { ui_event_id: "x" } } });
  assert.equal(res.json().code, "PROPOSAL_NOT_FOUND");
});

test("reject is recorded and nothing is planned", async () => {
  const { app, engine } = makeApp();
  const s = await newSession(app);
  const p = await proposalTurn(app, s.session_id);
  const res = await app.inject({ method: "POST", url: "/v1/confirmations", headers: auth,
    payload: { proposal_id: p.proposal_id, decision: "reject", channel: "phone_tap", evidence: { ui_event_id: "x" } } });
  assert.equal(res.json().status, "rejected_by_user");
  assert.equal(engine.plannedFor("u_7f3a").length, 0);
});

test("device state: stale seq ignored, invalid snapshot rejected", async () => {
  const { app } = makeApp();
  const s = await newSession(app);
  const base = { ...loadExample<DeviceSessionState>("valid/device_session_state.glasses_capture.json"), session_id: s.session_id };
  for (const seq of [5, 3]) {
    const r = await app.inject({ method: "PUT", url: `/v1/sessions/${s.session_id}/device-state`, headers: auth, payload: { ...base, seq } });
    assert.equal(r.statusCode, 204);
  }
  const bad = await app.inject({ method: "PUT", url: `/v1/sessions/${s.session_id}/device-state`, headers: auth,
    payload: { ...base, seq: 9, mode: "phone_only", degraded_reasons: [] } });
  assert.equal(bad.statusCode, 422, "phone_only must give a reason");
});
