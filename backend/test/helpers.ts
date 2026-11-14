import type { FastifyInstance } from "fastify";
import { SBankCoachAdapter } from "../src/capabilities/sbank-coach/adapter.ts";
import type { AgentBackend } from "../src/capabilities/sbank-coach/backend.ts";
import { DeterministicFastPath } from "../src/capabilities/sbank-coach/fast-path.ts";
import type { FinanceEngine } from "../src/capabilities/sbank-coach/finance-engine.ts";
import { FixtureFinanceEngine } from "../src/capabilities/sbank-coach/fixture-engine.ts";
import { UserStatedFinanceEngine } from "../src/capabilities/sbank-coach/user-stated-engine.ts";
import type { DomainResponseEvent, ErrorEnvelope, VoiceIntent } from "../src/contracts.ts";
import { loadSigningKeys } from "../src/crypto.ts";
import { CapabilityRegistry } from "../src/platform/registry.ts";
import { buildServer } from "../src/server.ts";

export const TOKEN = "test-token";
export const USER = "u_7f3a";
export const auth = { authorization: `Bearer ${TOKEN}` };

export function makeApp(opts: { remote?: AgentBackend; deadlineMs?: number; userStated?: { now: () => Date }; engine?: FinanceEngine } = {}) {
  const keys = loadSigningKeys();
  const engine: FinanceEngine = opts.engine
    ?? (opts.userStated ? new UserStatedFinanceEngine(opts.userStated.now) : new FixtureFinanceEngine());
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

export async function grantConsent(app: FastifyInstance, purposes = ["price_label", "receipt"], headers = auth): Promise<string> {
  const res = await app.inject({ method: "POST", url: "/v1/consents", headers,
    payload: { capability_id: "sbank.coach", data_classes: ["financial_transactions", "observed_prices"], purposes } });
  if (res.statusCode !== 201) throw new Error(`consent failed: ${res.body}`);
  return res.json().consent_grant_id;
}

/** Creates a session and, unless `consent: false`, the combined consent grant the companion records at first launch. */
export async function newSession(app: FastifyInstance, locale = "en-FI", opts: { consent?: boolean } = {}):
  Promise<{ session_id: string; conversation_ref: string; consent_grant_id?: string }> {
  const res = await app.inject({ method: "POST", url: "/v1/sessions", headers: auth,
    payload: { mode: "glasses", device_capabilities: ["photo_capture", "camera_stream", "inputs"], locale } });
  if (res.statusCode !== 200) throw new Error(`session failed: ${res.body}`);
  const session = res.json();
  return opts.consent === false ? session : { ...session, consent_grant_id: await grantConsent(app) };
}

/** A minimal JPEG header (SOI, APP0, optional APP1/Exif, SOF0 with dimensions, EOI). Enough for inspection. */
export function fakeJpeg(width = 1600, height = 1200, withExif = false): Buffer {
  const seg = (marker: number, body: Buffer) => Buffer.concat([Buffer.from([0xff, marker]), Buffer.from([(body.length + 2) >> 8, (body.length + 2) & 0xff]), body]);
  const app0 = seg(0xe0, Buffer.from("JFIF\0\x01\x01\0\0\x01\0\x01\0\0", "latin1"));
  const app1 = seg(0xe1, Buffer.from("Exif\0\0MM\0*", "latin1"));
  const sof = seg(0xc0, Buffer.from([8, height >> 8, height & 0xff, width >> 8, width & 0xff, 3, 1, 0x11, 0, 2, 0x11, 1, 3, 0x11, 1]));
  return Buffer.concat([Buffer.from([0xff, 0xd8]), app0, ...(withExif ? [app1] : []), sof, Buffer.from([0xff, 0xd9])]);
}

export function captureMeta(sessionId: string, consentGrantId: string, over: Record<string, unknown> = {}) {
  return {
    session_id: sessionId, source: "glasses_photo", trigger: "voice_command", purpose: "price_label",
    minimisation: ["orientation_applied", "exif_stripped", "gps_removed", "downscaled"],
    consent_grant_id: consentGrantId, captured_at: new Date().toISOString(), locale: "fi-FI", ...over,
  };
}

/** POST /v1/captures as multipart/form-data. */
export async function uploadCapture(app: FastifyInstance, image: Buffer, meta: object, headers: Record<string, string> = auth) {
  const boundary = "----test" + Math.random().toString(16).slice(2);
  const body = Buffer.concat([
    Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name="meta"\r\n\r\n${JSON.stringify(meta)}\r\n`),
    Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name="image"; filename="c.jpg"\r\nContent-Type: image/jpeg\r\n\r\n`),
    image,
    Buffer.from(`\r\n--${boundary}--\r\n`),
  ]);
  return app.inject({ method: "POST", url: "/v1/captures", payload: body,
    headers: { ...headers, "content-type": `multipart/form-data; boundary=${boundary}` } });
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
