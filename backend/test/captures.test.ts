// The pitch moment: look at a price label, ask "does this fit my week?".
import { test } from "node:test";
import assert from "node:assert/strict";
import { loadExample, validate, type DeviceSessionState } from "../src/contracts.ts";
import {
  auth, captureMeta, fakeJpeg, finalOf, grantConsent, makeApp, newSession, parseSse, turn, uploadCapture, voiceIntent,
} from "./helpers.ts";

test("price-label capture → observation → hedged, verified answer with a plan proposal", async () => {
  const { app } = makeApp();
  const s = await newSession(app);
  const up = await uploadCapture(app, fakeJpeg(), captureMeta(s.session_id, s.consent_grant_id!));
  assert.equal(up.statusCode, 201, up.body);
  const capture = up.json();
  assert.ok(validate("context_capture", capture).ok);
  assert.equal(capture.media.width, 1600);
  assert.match(capture.media.sha256, /^sha256:[a-f0-9]{64}$/);

  const events = await turn(app, voiceIntent(s.session_id, "does this fit my week", { attached_capture_ids: [capture.capture_id] }));
  const final = finalOf(events);
  assert.equal(final.speech.text, "If that price is 79.90, it fits, but it would leave about 10 euros until Sunday. Want me to plan it in?");
  assert.equal(final.trace.verified, true);
  assert.equal(final.trace.observation_ids?.length, 1);
  const card = final.cards[0]!;
  const observedRow = card.rows!.find((r) => r.epistemic === "observed");
  assert.equal((observedRow!.value as { amount: string }).amount, "79.90");
  assert.equal(card.basis.observation_ids?.length, 1);
  assert.equal(final.proposals[0]?.kind, "finance.plan.add");
  assert.doesNotMatch(final.proposals[0]!.summary.spoken.en!, /KUULOKKEET/i, "untrusted label text is never spoken");
});

test("Finnish price-label turn", async () => {
  const { app } = makeApp();
  const s = await newSession(app, "fi-FI");
  const capture = (await uploadCapture(app, fakeJpeg(), captureMeta(s.session_id, s.consent_grant_id!))).json();
  const final = finalOf(await turn(app, voiceIntent(s.session_id, "mahtuuko tämä viikon budjettiin", {
    attached_capture_ids: [capture.capture_id],
    transcript: { text: "mahtuuko tämä viikon budjettiin", lang: "fi-FI", confidence: 0.9 },
  })));
  assert.equal(final.speech.text, "Jos hinta on 79,90 euroa, se mahtuu, mutta sunnuntaihin jäisi vain noin 10 euroa. Lisäänkö sen suunnitelmaan?");
  assert.equal(final.trace.verified, true);
});

test("a photo that still carries EXIF is refused", async () => {
  const { app } = makeApp();
  const s = await newSession(app);
  const res = await uploadCapture(app, fakeJpeg(1600, 1200, true), captureMeta(s.session_id, s.consent_grant_id!));
  assert.equal(res.statusCode, 422);
  assert.equal(res.json().code, "CAPTURE_UNUSABLE");
  assert.ok(validate("error_envelope", res.json()).ok);
});

test("minimisation must declare exif_stripped (schema rule)", async () => {
  const { app } = makeApp();
  const s = await newSession(app);
  const res = await uploadCapture(app, fakeJpeg(), captureMeta(s.session_id, s.consent_grant_id!, { minimisation: ["downscaled"] }));
  assert.equal(res.json().code, "VALIDATION_FAILED");
});

test("not an image → CAPTURE_UNUSABLE", async () => {
  const { app } = makeApp();
  const s = await newSession(app);
  const res = await uploadCapture(app, Buffer.from("definitely not a jpeg"), captureMeta(s.session_id, s.consent_grant_id!));
  assert.equal(res.json().code, "CAPTURE_UNUSABLE");
});

test("capture without a grant covering its purpose → CONSENT_REQUIRED", async () => {
  const { app } = makeApp();
  const s = await newSession(app, "en-FI", { consent: false });
  const receiptOnly = await grantConsent(app, ["receipt"]);
  const res = await uploadCapture(app, fakeJpeg(), captureMeta(s.session_id, receiptOnly));
  assert.equal(res.statusCode, 403);
  assert.equal(res.json().code, "CONSENT_REQUIRED");
});

test("revoking consent deletes its captures; using one afterwards → CONSENT_REVOKED", async () => {
  const { app } = makeApp();
  const s = await newSession(app);
  const capture = (await uploadCapture(app, fakeJpeg(), captureMeta(s.session_id, s.consent_grant_id!))).json();
  const del = await app.inject({ method: "DELETE", url: `/v1/consents/${s.consent_grant_id}`, headers: auth });
  assert.equal(del.statusCode, 204);

  // Another active grant keeps the capability usable, but the purged capture is gone.
  await grantConsent(app);
  const res = await app.inject({ method: "POST", url: "/v1/turns", headers: auth,
    payload: voiceIntent(s.session_id, "does this fit my week", { attached_capture_ids: [capture.capture_id] }) });
  assert.equal((parseSse(res.body)[0]!.data as { code: string }).code, "CONSENT_REVOKED");

  const again = await uploadCapture(app, fakeJpeg(), captureMeta(s.session_id, s.consent_grant_id!));
  assert.equal(again.json().code, "CONSENT_REVOKED");
});

test("glasses capture while the device is phone_only → DEVICE_UNAVAILABLE", async () => {
  const { app } = makeApp();
  const s = await newSession(app);
  const state = {
    ...loadExample<DeviceSessionState>("valid/device_session_state.phone_only_hinges_closed.json"),
    session_id: s.session_id, seq: 1,
  };
  const put = await app.inject({ method: "PUT", url: `/v1/sessions/${s.session_id}/device-state`, headers: auth, payload: state });
  assert.equal(put.statusCode, 204, put.body);
  const res = await uploadCapture(app, fakeJpeg(), captureMeta(s.session_id, s.consent_grant_id!));
  assert.equal(res.json().code, "DEVICE_UNAVAILABLE");
  // The phone camera still works in phone_only mode.
  const phone = await uploadCapture(app, fakeJpeg(), captureMeta(s.session_id, s.consent_grant_id!, { source: "phone_camera", trigger: "phone_tap" }));
  assert.equal(phone.statusCode, 201);
});

test("another user's capture cannot be attached", async () => {
  const { app } = makeApp();
  const s = await newSession(app);
  const capture = (await uploadCapture(app, fakeJpeg(), captureMeta(s.session_id, s.consent_grant_id!))).json();
  const otherAuth = { authorization: "Bearer other-token" };
  const otherSession = (await app.inject({ method: "POST", url: "/v1/sessions", headers: otherAuth,
    payload: { mode: "glasses", device_capabilities: [], locale: "en-FI" } })).json();
  await grantConsent(app, ["price_label"], otherAuth);
  const res = await app.inject({ method: "POST", url: "/v1/turns", headers: otherAuth,
    payload: { ...voiceIntent(otherSession.session_id, "does this fit my week", { attached_capture_ids: [capture.capture_id] }), user_ref: "u_other" } });
  assert.equal((parseSse(res.body)[0]!.data as { code: string }).code, "VALIDATION_FAILED");
});

test("consent grants only accept what the manifest declares", async () => {
  const { app } = makeApp();
  const res = await app.inject({ method: "POST", url: "/v1/consents", headers: auth,
    payload: { capability_id: "sbank.coach", data_classes: ["location_history"], purposes: [] } });
  assert.equal(res.statusCode, 422);
});

test("health reports the label reader as a mock", async () => {
  const { app } = makeApp();
  const health = (await app.inject({ method: "GET", url: "/health" })).json();
  assert.deepEqual(health.label_reader, { provider_id: "ocr.fixture", mock: true });
});
