import type { FastifyInstance } from "fastify";
import { SBankCoachAdapter } from "../src/capabilities/sbank-coach/adapter.ts";
import type { AgentBackend } from "../src/capabilities/sbank-coach/backend.ts";
import { DeterministicFastPath } from "../src/capabilities/sbank-coach/fast-path.ts";
import { FixtureFinanceEngine } from "../src/capabilities/sbank-coach/fixture-engine.ts";
import type { DomainResponseEvent, ErrorEnvelope, VoiceIntent } from "../src/contracts.ts";
import { loadSigningKeys } from "../src/crypto.ts";
import { CapabilityRegistry } from "../src/platform/registry.ts";
import { buildServer } from "../src/server.ts";

export const TOKEN = "test-token";
export const USER = "u_7f3a";
export const auth = { authorization: `Bearer ${TOKEN}` };

export function makeApp(opts: { remote?: AgentBackend; deadlineMs?: number } = {}) {
  const keys = loadSigningKeys();
  const engine = new FixtureFinanceEngine();
  const fastPath = new DeterministicFastPath(engine, keys.publicKey);
  const registry = new CapabilityRegistry();
  registry.register(new SBankCoachAdapter({ engine, fastPath, ...(opts.remote ? { remote: opts.remote } : {}) }));
  const app = buildServer({
    registry, keys,
    tokens: new Map([[TOKEN, USER], ["other-token", "u_other"]]),
    ...(opts.deadlineMs ? { deadlineMs: opts.deadlineMs } : {}),
  });
  return { app, engine, keys };
}

export async function newSession(app: FastifyInstance, locale = "en-FI"): Promise<{ session_id: string; conversation_ref: string }> {
  const res = await app.inject({ method: "POST", url: "/v1/sessions", headers: auth,
    payload: { mode: "glasses", device_capabilities: ["photo_capture", "camera_stream", "inputs"], locale } });
  if (res.statusCode !== 200) throw new Error(`session failed: ${res.body}`);
  return res.json();
}

let turnCounter = 0;
export function voiceIntent(sessionId: string, text: string, over: Partial<VoiceIntent> = {}): VoiceIntent {
  turnCounter += 1;
  return {
    schema: "platform.voice_intent/v1",
    turn_id: `t_${turnCounter}_${Date.now()}`,
    session_id: sessionId,
    user_ref: USER,
    invocation: "phone_push_to_talk",
    transcript: { text, lang: "en-FI", confidence: 0.95, asr_provider: "asr.device" },
    platform_intent: null,
    capability_hint: null,
    attached_capture_ids: [],
    context: { active_capability: null, pending_proposal_id: null, conversation_ref: "conv_x", recent_turns: [] },
    output: { speech: true, display: "phone", discreet_mode: false },
    device_capabilities: ["photo_capture", "camera_stream", "inputs"],
    ...over,
  };
}

export type SseEvent = { event: string; data: DomainResponseEvent | ErrorEnvelope };

export function parseSse(body: string): SseEvent[] {
  return body.split("\n\n").filter(Boolean).map((block) => {
    const event = /^event: (.+)$/m.exec(block)?.[1] ?? "message";
    const data = JSON.parse(/^data: (.+)$/m.exec(block)?.[1] ?? "null");
    return { event, data };
  });
}

export async function turn(app: FastifyInstance, intent: VoiceIntent): Promise<SseEvent[]> {
  const res = await app.inject({ method: "POST", url: "/v1/turns", headers: auth, payload: intent });
  if (res.statusCode !== 200) throw new Error(`turn failed ${res.statusCode}: ${res.body}`);
  return parseSse(res.body);
}

export function finalOf(events: SseEvent[]) {
  const f = events.find((e) => e.event === "final");
  if (!f) throw new Error(`no final event in ${JSON.stringify(events.map((e) => e.event))}`);
  return (f.data as Extract<DomainResponseEvent, { type: "final" }>).response as Extract<DomainResponseEvent, { type: "final" }>["response"] & {
    x_debug?: { backend: string; mock: boolean; verified: boolean; fallback_reason?: string };
  };
}

export const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
