// S-Pankki source (DEC-024, DEC-025): the backend against a fake of finance-engine/server.py that
// serves the contract examples generated from the real engine (CUST04069 on 2026-09-05).
import { test, after } from "node:test";
import assert from "node:assert/strict";
import { createServer, type IncomingMessage } from "node:http";
import type { AddressInfo } from "node:net";
import { SPankkiFinanceEngine } from "../src/capabilities/sbank-coach/s-pankki-engine.ts";
import { loadExample, validate, type ToolResult } from "../src/contracts.ts";
import { auth, captureMeta, fakeJpeg, finalOf, makeApp, newSession, turn, uploadCapture, voiceIntent } from "./helpers.ts";

const STS = loadExample<ToolResult>("valid/finance/tool_result.safe_to_spend_until_payday.json");
const AFF = loadExample<ToolResult>("valid/finance/tool_result.affordability_until_payday.json");
const AT_RISK = loadExample<ToolResult>("valid/finance/tool_result.safe_to_spend_until_payday_at_risk.json");

/** Fake engine service: same endpoints and shapes as finance-engine/server.py. */
function fakeService(opts: { atRisk?: boolean; lookupsFail?: boolean } = {}) {
  const log = new Map<string, Map<string, ToolResult>>();
  const seen: { path: string; body: Record<string, unknown> }[] = [];
  let n = 0;
  const record = (user: string, r: ToolResult, prefix: string): ToolResult => {
    const out = { ...structuredClone(r), calc_id: `calc_${prefix}_fake_${++n}` };
    if (!log.has(user)) log.set(user, new Map());
    log.get(user)!.set(out.calc_id, out);
    return out;
  };
  const read = async (req: IncomingMessage) => {
    let s = "";
    for await (const c of req) s += c;
    return s ? JSON.parse(s) : {};
  };
  const server = createServer(async (req, res) => {
    const url = new URL(req.url!, "http://x");
    const send = (status: number, body: unknown) => { res.writeHead(status, { "content-type": "application/json" }); res.end(JSON.stringify(body)); };
    if (url.pathname === "/health") return send(200, { status: "ok" });
    if (req.method === "POST") {
      const body = await read(req);
      seen.push({ path: url.pathname, body });
      const user = body.user_ref as string;
      if (url.pathname === "/v1/tools/safe_to_spend") return send(200, record(user, opts.atRisk ? AT_RISK : STS, "sts"));
      if (url.pathname === "/v1/tools/affordability") {
        const aff = structuredClone(AFF);
        const r = aff.result as Record<string, unknown>;
        r.price_source = body.price_source;
        if (body.observation_id) r.observation_id = body.observation_id; else delete r.observation_id;
        return send(200, { result: record(user, aff, "aff"), sts: record(user, STS, "sts") });
      }
    }
    const m = /^\/v1\/calculations\/(.+)$/.exec(url.pathname);
    if (m) {
      if (opts.lookupsFail) return send(404, { code: "CALCULATION_NOT_FOUND" });
      const r = log.get(url.searchParams.get("user_ref") ?? "")?.get(decodeURIComponent(m[1]!));
      return r ? send(200, r) : send(404, { code: "CALCULATION_NOT_FOUND" });
    }
    send(404, { code: "NOT_FOUND" });
  });
  server.listen(0, "127.0.0.1");
  return { server, seen, url: () => `http://127.0.0.1:${(server.address() as AddressInfo).port}` };
}

const servers: ReturnType<typeof fakeService>[] = [];
async function appWith(opts: Parameters<typeof fakeService>[0] = {}) {
  const svc = fakeService(opts);
  servers.push(svc);
  await new Promise((r) => svc.server.once("listening", r));
  return { ...makeApp({ engine: new SPankkiFinanceEngine(svc.url()) }), svc };
}
after(() => { for (const s of servers) s.server.close(); });

test("safe to spend: the engine's daily figure until payday, verified, no dates spoken", async () => {
  const { app } = await appWith();
  const s = await newSession(app);
  const events = await turn(app, voiceIntent(s.session_id, "what's safe to spend"));
  for (const e of events) assert.ok(validate("domain_response_event", e.data).ok, `event ${e.event} validates`);
  const final = finalOf(events);
  assert.equal(final.speech.text,
    "You can safely spend about 32 euros a day for the next 10 days, until payday. It's an estimate from your balance and bills.");
  assert.ok(final.speech.text.split(/\s+/).length <= 25, "speech budget");
  assert.equal(final.trace.verified, true);
  assert.equal(final.x_debug?.mock, false);
  const card = final.cards[0]!;
  assert.equal(card.title.en, "Safe to spend today");
  assert.equal((card.primary!.value as { amount: string }).amount, "32.01");
  assert.ok(card.rows!.some((r) => r.label.en === "Free until payday" && (r.value as { amount: string }).amount === "320.11"));
  assert.ok(card.assumptions.some((a) => a.en?.includes("Simulated date 2026-09-05")), "the simulated date is never hidden");
});

test("'Can I afford this?' on a price label: fits, says what's left per day, proposes a plan", async () => {
  const { app, svc } = await appWith();
  const s = await newSession(app);
  const cap = (await uploadCapture(app, fakeJpeg(), captureMeta(s.session_id, s.consent_grant_id!))).json();
  const final = finalOf(await turn(app, voiceIntent(s.session_id, "can I afford this", { attached_capture_ids: [cap.capture_id] })));
  assert.equal(final.speech.text, "If that price is 79.90, it fits. You'd still have about 24 euros a day until payday. Want me to plan it in?");
  assert.ok(final.speech.text.split(/\s+/).length <= 25, "speech budget");
  assert.equal(final.trace.verified, true);
  const card = final.cards[0]!;
  assert.equal(card.title.en, "Can you afford it?");
  assert.equal((card.primary!.value as { amount: string }).amount, "24.02");
  assert.equal(final.proposals[0]?.kind, "finance.plan.add");
  assert.equal(final.proposals[0]?.summary.spoken.en, "Plan this in before payday? Tap to confirm.");
  const call = svc.seen.find((c) => c.path === "/v1/tools/affordability")!;
  assert.equal(call.body.price_source, "observation");
  assert.equal(call.body.amount, "79.90");
});

test("a confirmed plan is sent to the engine as planned_total on the next question", async () => {
  const { app, svc } = await appWith();
  const s = await newSession(app);
  const ask = finalOf(await turn(app, voiceIntent(s.session_id, "can I afford 79.90")));
  const tap = await app.inject({ method: "POST", url: "/v1/confirmations", headers: auth,
    payload: { proposal_id: ask.proposals[0]!.proposal_id, decision: "confirm", channel: "phone_tap", evidence: { ui_event_id: "ui" } } });
  assert.equal(tap.json().status, "applied");
  assert.equal(tap.json().card?.title.en, "Safe to spend today", "the updated card comes back with the confirmation");
  await turn(app, voiceIntent(s.session_id, "what's safe to spend"));
  const last = svc.seen.filter((c) => c.path === "/v1/tools/safe_to_spend").at(-1)!;
  assert.equal(last.body.planned_total, "79.90");
});

test("at risk: nothing is safe to spend, said plainly, no zero figure spoken", async () => {
  const { app } = await appWith({ atRisk: true });
  const s = await newSession(app);
  const final = finalOf(await turn(app, voiceIntent(s.session_id, "what's safe to spend")));
  assert.equal(final.speech.text, "Right now nothing is safe to spend: bills due before payday exceed your balance. Hold off on extra spending for the next 10 days.");
  assert.equal(final.trace.verified, true);
  assert.equal(final.cards[0]!.render_hints?.glasses_display_lines?.[0], "Pause extra spending");
});

test("figures the engine can't confirm are dropped (calculation lookups fail)", async () => {
  const { app } = await appWith({ lookupsFail: true });
  const s = await newSession(app);
  const final = finalOf(await turn(app, voiceIntent(s.session_id, "what's safe to spend")));
  assert.equal(final.cards.length, 0);
  assert.equal(final.speech.text, "I've put the details on your phone.");
  assert.equal(final.trace.verified, false);
});

test("engine down: the turn fails as capability unavailable, nothing invented", async () => {
  const { app } = makeApp({ engine: new SPankkiFinanceEngine("http://127.0.0.1:9", 500) });
  const s = await newSession(app);
  const events = await turn(app, voiceIntent(s.session_id, "what's safe to spend"));
  const err = events.find((e) => e.event === "error");
  assert.ok(err, `expected an error event, got ${events.map((e) => e.event)}`);
  assert.equal((err.data as { code: string }).code, "CAPABILITY_UNAVAILABLE");
  assert.ok(!events.some((e) => e.event === "final"));
});
