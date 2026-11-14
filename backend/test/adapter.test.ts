// Backend policy: the Coach agent is a black box that may be slow, fail, or invent numbers.
import { test } from "node:test";
import assert from "node:assert/strict";
import type { AgentBackend } from "../src/capabilities/sbank-coach/backend.ts";
import type { ActionResult, DomainRequest, DomainResponse, ToolResult, UserConfirmation } from "../src/contracts.ts";
import { auth, finalOf, makeApp, newSession, parseSse, sleep, turn, voiceIntent } from "./helpers.ts";

class FakeAgent implements AgentBackend {
  readonly id = "remote_agent@test";
  readonly mock = false;
  aborted = false;
  constructor(private readonly behaviour: { delayMs?: number; respond?: (req: DomainRequest) => DomainResponse }) {}
  async healthy() { return true; }
  async confirm(c: UserConfirmation): Promise<ActionResult> {
    return { schema: "platform.action_result/v1", proposal_id: c.proposal_id, confirmation_id: c.confirmation_id, status: "applied", applied_at: new Date().toISOString() };
  }
  async turn(req: DomainRequest, signal: AbortSignal): Promise<DomainResponse> {
    signal.addEventListener("abort", () => { this.aborted = true; });
    await sleep(this.behaviour.delayMs ?? 0);
    if (signal.aborted) throw new Error("aborted");
    return this.behaviour.respond!(req);
  }
}

const inventedNumbers = (req: DomainRequest): DomainResponse => ({
  schema: "platform.domain_response/v1", request_id: req.request_id, status: "answered",
  speech: { text: "You have 500 euros to spend this week!", epistemic: "estimate" },
  cards: [{
    schema: "platform.insight_card/v1", card_id: "card_fake", capability_id: "sbank.coach", type: "metric",
    title: { en: "Made up" }, primary: { label: { en: "x" }, value: { amount: "500.00", currency: "EUR" }, epistemic: "estimate" },
    epistemic: "estimate", basis: { calc_ids: ["calc_does_not_exist"], as_of: new Date().toISOString() }, assumptions: [], missing_data: [],
  }],
  proposals: [],
  trace: { calc_ids: ["calc_does_not_exist"], tools: [], backend: "remote_agent@test", verified: true, verification: { checked_values: 2, unverified: [] } },
});

test("agent slower than the deadline → fast path answers, fallback is visible", async () => {
  const agent = new FakeAgent({ delayMs: 2000, respond: inventedNumbers });
  const { app } = makeApp({ remote: agent, deadlineMs: 500 });
  const s = await newSession(app);
  const events = await turn(app, voiceIntent(s.session_id, "what's safe to spend this week"));
  assert.equal(events[0]?.event, "progress", "filler hint is sent first");
  const final = finalOf(events);
  assert.equal(final.trace.backend, "fast_path@1");
  assert.equal(final.x_debug?.fallback_reason, "agent_timeout");
  assert.equal(final.trace.verified, true);
  assert.ok(agent.aborted, "the agent call was cancelled");
});

test("agent that invents numbers: unverified speech and cards are dropped", async () => {
  const { app } = makeApp({ remote: new FakeAgent({ respond: inventedNumbers }) });
  const s = await newSession(app);
  const final = finalOf(await turn(app, voiceIntent(s.session_id, "what's safe to spend this week")));
  assert.equal(final.trace.verified, false, "the agent's own verified:true is ignored");
  assert.equal(final.speech.text, "I've put the details on your phone.");
  assert.equal(final.cards.length, 0);
  assert.ok(final.trace.verification?.unverified.includes("500"));
  assert.deepEqual(final.trace.calc_ids, []);
});

test("agent that answers with real calc_ids passes verification", async () => {
  const { app, engine } = makeApp();
  const grounded = (req: DomainRequest): DomainResponse => {
    const sts = engine.getSafeToSpend(req.user_ref) as ToolResult;   // the fixture source answers synchronously
    return {
      schema: "platform.domain_response/v1", request_id: req.request_id, status: "answered",
      speech: { text: "Roughly 90 euros until Sunday, based on your balance.", epistemic: "estimate" },
      cards: [], proposals: [],
      trace: { calc_ids: [sts.calc_id as string], tools: [{ name: sts.tool, ok: true, ms: 3 }], backend: "remote_agent@test", verified: false },
    };
  };
  // Rebuild with this engine shared by the fake agent and the verifier.
  const { SBankCoachAdapter } = await import("../src/capabilities/sbank-coach/adapter.ts");
  const { DeterministicFastPath } = await import("../src/capabilities/sbank-coach/fast-path.ts");
  const { CapabilityRegistry } = await import("../src/platform/registry.ts");
  const { buildServer } = await import("../src/server.ts");
  const { loadSigningKeys } = await import("../src/crypto.ts");
  const keys = loadSigningKeys();
  const registry = new CapabilityRegistry();
  registry.register(new SBankCoachAdapter({ engine, fastPath: new DeterministicFastPath(engine, keys.publicKey), remote: new FakeAgent({ respond: grounded }) }));
  const app2 = buildServer({ registry, keys, tokens: new Map([["test-token", "u_7f3a"]]) });
  void app;
  const s = await newSession(app2);
  const final = finalOf(await turn(app2, voiceIntent(s.session_id, "how am I doing this week")));
  assert.equal(final.trace.verified, true);
  assert.equal(final.trace.backend, "remote_agent@test");
  assert.equal(final.x_debug?.mock, false);
});

test("'stop' aborts the turn in flight: no final, agent cancelled (DEC-011)", async () => {
  const agent = new FakeAgent({ delayMs: 1500, respond: inventedNumbers });
  const { app } = makeApp({ remote: agent, deadlineMs: 10_000 });
  const s = await newSession(app);
  const slow = app.inject({ method: "POST", url: "/v1/turns", headers: auth, payload: voiceIntent(s.session_id, "what's safe to spend this week") });
  await sleep(150);
  const stop = finalOf(await turn(app, voiceIntent(s.session_id, "stop", { platform_intent: "stop" })));
  assert.equal(stop.speech.text, "OK.");
  const events = parseSse((await slow).body);
  assert.ok(!events.some((e) => e.event === "final"), "the aborted turn delivers no final");
  assert.ok(agent.aborted);
});
