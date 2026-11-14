// Platform orchestrator HTTP API (L3). Implements contracts/http/orchestrator.openapi.yaml.
import { createHash, randomUUID } from "node:crypto";
import multipart from "@fastify/multipart";
import Fastify, { type FastifyInstance, type FastifyReply, type FastifyRequest } from "fastify";
import {
  validate, type ContextCapture, type DomainRequest, type DomainResponse, type DomainResponseEvent, type ErrorEnvelope,
  type Observation, type VoiceIntent,
} from "./contracts.ts";
import type { SigningKeys } from "./crypto.ts";
import { CaptureStore, CAPTURE_TTL_MS } from "./platform/captures.ts";
import { ConsentRegistry } from "./platform/consent.ts";
import { inspectImage, MAX_IMAGE_BYTES } from "./platform/image.ts";
import { FixtureLabelReader, type LabelReader } from "./platform/label-reader.ts";
import { PlatformError } from "./errors.ts";
import { composeSpeech } from "./platform/composer.ts";
import { confirmProposal, type ConfirmRequest } from "./platform/confirmations.ts";
import type { CapabilityRegistry } from "./platform/registry.ts";
import { ProposalLedger, SessionStore, TurnLog, type Session } from "./platform/store.ts";

export interface ServerDeps {
  registry: CapabilityRegistry;
  keys: SigningKeys;
  /** Bearer token → user_ref. Hackathon stand-in for real authentication. */
  tokens: Map<string, string>;
  deadlineMs?: number;
  logger?: boolean;
  /** Reads labels from captures. Defaults to the fixture reader (mock). */
  labelReader?: LabelReader;
}

const SPEECH_MAX_WORDS = 25;
const CONFIRM_GRAMMAR = /^(confirm|vahvista|bekräfta)$/i;

declare module "fastify" {
  interface FastifyRequest { userRef?: string }
}

export function buildServer(deps: ServerDeps): FastifyInstance {
  const app = Fastify({ logger: deps.logger ?? false });
  const sessions = new SessionStore();
  const ledger = new ProposalLedger();
  const turns = new TurnLog();
  const consents = new ConsentRegistry();
  const captures = new CaptureStore();
  const labelReader = deps.labelReader ?? new FixtureLabelReader();
  void app.register(multipart, { limits: { fileSize: MAX_IMAGE_BYTES, files: 1, fields: 4 } });

  const sendError = (reply: FastifyReply, err: PlatformError) => {
    const env = err.toEnvelope();
    app.log.warn({ code: err.code, correlation_id: env.correlation_id, detail: err.message }, "request failed");
    return reply.code(err.status).type("application/json").send(env);
  };

  app.setErrorHandler((err, _req, reply) => {
    if (err instanceof PlatformError) return sendError(reply, err);
    const e = err as { validation?: unknown; statusCode?: number };
    if (e.statusCode === 413) return sendError(reply, new PlatformError("CAPTURE_UNUSABLE", { detail: String(err) }));
    if (e.validation || (e.statusCode && e.statusCode >= 400 && e.statusCode < 500)) {
      return sendError(reply, new PlatformError("VALIDATION_FAILED", { detail: String(err) }));
    }
    app.log.error(err);
    return sendError(reply, new PlatformError("INTERNAL", { detail: String(err) }));
  });

  app.addHook("onRequest", async (req: FastifyRequest) => {
    if (!req.url.startsWith("/v1/")) return;
    const token = /^Bearer (.+)$/.exec(req.headers.authorization ?? "")?.[1];
    const userRef = token ? deps.tokens.get(token) : undefined;
    if (!userRef) throw new PlatformError("UNAUTHENTICATED");
    req.userRef = userRef;
  });

  const requireValid = (schema: Parameters<typeof validate>[0], body: unknown) => {
    const v = validate(schema, body);
    if (!v.ok) throw new PlatformError("VALIDATION_FAILED", { detail: v.errors.join("; ") });
  };

  const requireSession = (sessionId: string, userRef: string): Session => {
    const s = sessions.get(sessionId, userRef);
    if (!s) throw new PlatformError("UNAUTHENTICATED", { detail: `session ${sessionId} not found for user` });
    return s;
  };

  // ---------------------------------------------------------------- health
  app.get("/health", async () => ({
    status: "ok",
    label_reader: { provider_id: labelReader.provider.provider_id, mock: labelReader.mock },
    capabilities: await Promise.all(deps.registry.all().map(async (c) => ({
      capability_id: c.manifest.capability_id, ...(await c.adapter.health()),
    }))),
  }));

  // ---------------------------------------------------------------- sessions
  app.post("/v1/sessions", async (req) => {
    const body = req.body as { mode?: unknown; device_capabilities?: unknown; locale?: unknown };
    const okMode = body?.mode === "glasses" || body?.mode === "phone_only";
    const okLocale = typeof body?.locale === "string" && /^[a-z]{2}(-[A-Z]{2})?$/.test(body.locale);
    if (!okMode || !Array.isArray(body.device_capabilities) || !okLocale) {
      throw new PlatformError("VALIDATION_FAILED", { detail: "mode, device_capabilities and locale are required" });
    }
    const s = sessions.create(req.userRef!, body.mode as Session["mode"], body.locale as string);
    return { session_id: s.sessionId, conversation_ref: s.conversationRef };
  });

  app.put<{ Params: { session_id: string } }>("/v1/sessions/:session_id/device-state", async (req, reply) => {
    const session = requireSession(req.params.session_id, req.userRef!);
    requireValid("device_session_state", req.body);
    const state = req.body as Session["deviceState"] & object;
    if (state.session_id !== session.sessionId) throw new PlatformError("VALIDATION_FAILED", { detail: "session_id mismatch" });
    sessions.putDeviceState(session, state); // stale snapshots are accepted and ignored
    return reply.code(204).send();
  });

  // ---------------------------------------------------------------- consent
  app.post("/v1/consents", async (req, reply) => {
    const body = req.body as { capability_id?: string; data_classes?: unknown; purposes?: unknown };
    const cap = body?.capability_id ? deps.registry.get(body.capability_id) : undefined;
    if (!cap || !Array.isArray(body.data_classes) || !Array.isArray(body.purposes)) {
      throw new PlatformError("VALIDATION_FAILED", { detail: "capability_id, data_classes and purposes are required" });
    }
    const g = consents.grant(req.userRef!, cap.manifest, body.data_classes as string[], body.purposes as string[]);
    const { user_ref: _u, revoked_at: _r, ...pub } = g;
    return reply.code(201).send(pub);
  });

  app.delete<{ Params: { consent_grant_id: string } }>("/v1/consents/:consent_grant_id", async (req, reply) => {
    consents.revoke(req.userRef!, req.params.consent_grant_id);
    const purged = captures.purgeGrant(req.params.consent_grant_id);
    app.log.info({ consent_grant_id: req.params.consent_grant_id, purged }, "consent revoked");
    return reply.code(204).send();
  });

  // ---------------------------------------------------------------- captures
  app.post("/v1/captures", async (req, reply) => {
    if (!req.isMultipart()) throw new PlatformError("VALIDATION_FAILED", { detail: "multipart/form-data required" });
    let image: Buffer | undefined;
    let metaRaw: string | undefined;
    for await (const part of req.parts()) {
      if (part.type === "file" && part.fieldname === "image") image = await part.toBuffer();
      else if (part.type === "field" && part.fieldname === "meta") metaRaw = String(part.value);
    }
    if (!image || !metaRaw) throw new PlatformError("VALIDATION_FAILED", { detail: "image and meta parts are required" });
    let meta: Omit<ContextCapture, "schema" | "capture_id" | "user_ref" | "media">;
    try { meta = JSON.parse(metaRaw); } catch { throw new PlatformError("VALIDATION_FAILED", { detail: "meta is not JSON" }); }

    const session = requireSession(meta.session_id, req.userRef!);
    const purposeOwner = deps.registry.all().find((c) => c.manifest.capture_purposes.some((p) => p.purpose === meta.purpose));
    if (!purposeOwner) throw new PlatformError("VALIDATION_FAILED", { detail: `no capability declares purpose ${meta.purpose}` });
    consents.requireForCapture(req.userRef!, meta.consent_grant_id, meta.purpose);
    if (String(meta.source).startsWith("glasses_") && session.deviceState?.mode === "phone_only") {
      throw new PlatformError("DEVICE_UNAVAILABLE", { detail: "glasses capture while phone_only" });
    }

    const info = inspectImage(image);
    if (info.hasExif) throw new PlatformError("CAPTURE_UNUSABLE", { detail: "EXIF metadata still present; strip it on the phone" });

    const captureId = `cap_${randomUUID().slice(0, 8)}`;
    const capture: ContextCapture = {
      schema: "platform.context_capture/v1",
      capture_id: captureId,
      session_id: session.sessionId,
      user_ref: req.userRef!,
      source: meta.source,
      trigger: meta.trigger,
      purpose: meta.purpose,
      media: {
        kind: "image", mime: info.mime, width: info.width, height: info.height,
        sha256: `sha256:${createHash("sha256").update(image).digest("hex")}`,
        uri: `media://ephemeral/${captureId}`,
        expires_at: new Date(Date.now() + CAPTURE_TTL_MS).toISOString(),
      },
      minimisation: meta.minimisation,
      consent_grant_id: meta.consent_grant_id,
      captured_at: meta.captured_at,
      locale: meta.locale,
    };
    requireValid("context_capture", capture); // enforces e.g. exif_stripped in minimisation, 4096 px cap
    captures.put(capture, req.userRef!, image);

    const decl = purposeOwner.manifest.capture_purposes.find((p) => p.purpose === meta.purpose)!;
    if (decl.delivery === "observation") {
      captures.setObservation(captureId, await labelReader.read(capture, image));
      if (decl.retention_max_s === 0) captures.deleteImage(captureId); // the capability never needs the photo
    }
    return reply.code(201).send(capture);
  });

  // ---------------------------------------------------------------- confirmations
  app.post("/v1/confirmations", async (req) => {
    const body = req.body as Partial<ConfirmRequest> & { proposal_id?: string };
    if (!body?.proposal_id || (body.decision !== "confirm" && body.decision !== "reject") || !body.channel || typeof body.evidence !== "object") {
      throw new PlatformError("VALIDATION_FAILED", { detail: "proposal_id, decision, channel and evidence are required" });
    }
    const entry = ledger.get(body.proposal_id, req.userRef!);
    if (!entry) throw new PlatformError("PROPOSAL_NOT_FOUND");
    const session = sessions.get(entry.sessionId, req.userRef!);
    return confirmProposal(entry, session, { decision: body.decision, channel: body.channel, evidence: body.evidence }, deps);
  });

  // ---------------------------------------------------------------- turns (SSE)
  app.post("/v1/turns", async (req, reply) => {
    requireValid("voice_intent", req.body);
    const intent = req.body as VoiceIntent;
    if (intent.user_ref !== req.userRef) throw new PlatformError("UNAUTHENTICATED", { detail: "user_ref does not match the session" });
    const session = requireSession(intent.session_id, req.userRef!);

    const replay = turns.get(req.userRef!, intent.turn_id);
    reply.hijack();
    const raw = reply.raw;
    raw.writeHead(200, { "content-type": "text/event-stream", "cache-control": "no-cache", connection: "keep-alive" });
    const write = (type: string, data: unknown) => raw.write(`event: ${type}\ndata: ${JSON.stringify(data)}\n\n`);
    const writeEvent = (e: DomainResponseEvent) => {
      const v = validate("domain_response_event", e);
      if (!v.ok) throw new PlatformError("INTERNAL", { detail: `outgoing event invalid: ${v.errors.join("; ")}` });
      write(e.type, e);
    };
    const writeError = (err: unknown) => {
      const pe = err instanceof PlatformError ? err : new PlatformError("INTERNAL", { detail: String(err) });
      const env: ErrorEnvelope = pe.toEnvelope();
      app.log.warn({ code: pe.code, correlation_id: env.correlation_id, detail: pe.message }, "turn failed");
      write("error", env);
    };

    const sent: DomainResponseEvent[] = [];
    const emit = (e: DomainResponseEvent) => { writeEvent(e); sent.push(e); };
    const locale = intent.transcript?.lang ?? session.locale;

    try {
      if (replay) {
        replay.forEach(writeEvent); // idempotent turns: same turn_id, same answer
      } else if (intent.platform_intent) {
        await handlePlatformIntent(intent, session, locale, emit);
      } else {
        await handleDomainTurn(intent, session, locale, emit, raw);
      }
      if (sent.some((e) => e.type === "final")) {
        turns.set(req.userRef!, intent.turn_id, sent);
        if (!intent.platform_intent || intent.platform_intent !== "repeat") session.lastTurnEvents = sent;
      }
    } catch (err) {
      writeError(err);
    } finally {
      raw.end();
    }
  });

  const platformFinal = (requestId: string, text: string): DomainResponseEvent => ({
    type: "final",
    response: {
      schema: "platform.domain_response/v1", request_id: requestId, status: "answered",
      speech: { text, epistemic: "fact" }, cards: [], proposals: [],
      trace: { calc_ids: [], tools: [], backend: "platform", verified: true, verification: { checked_values: 0, unverified: [] } },
    },
  });

  async function handlePlatformIntent(intent: VoiceIntent, session: Session, locale: string, emit: (e: DomainResponseEvent) => void) {
    const fi = locale.startsWith("fi");
    const say = (en: string, fiText: string) => emit(platformFinal(`req_${intent.turn_id}`, fi ? fiText : en));
    switch (intent.platform_intent) {
      case "stop":
      case "cancel":
        session.inFlight?.controller.abort();
        session.inFlight = undefined;
        return say("OK.", "Selvä.");
      case "repeat":
        if (session.lastTurnEvents) return session.lastTurnEvents.forEach(emit);
        return say("There's nothing to repeat.", "Ei ole mitään toistettavaa.");
      case "show_on_phone":
      case "next_card":
        return say("It's on your phone.", "Se on puhelimessasi.");
      case "confirm":
      case "reject": {
        const proposalId = intent.context.pending_proposal_id;
        const entry = proposalId ? ledger.get(proposalId, session.userRef) : undefined;
        if (!entry) throw new PlatformError("PROPOSAL_NOT_FOUND");
        const spoken = intent.invocation !== "glasses_input" && intent.invocation !== "typed";
        if (spoken && !CONFIRM_GRAMMAR.test((intent.transcript?.text ?? "").trim().replace(/[.!?]$/, "")) && intent.platform_intent === "confirm") {
          // Voice confirmation needs the exact confirm word, not "yeah sure".
          throw new PlatformError("CONFIRM_CHANNEL_NOT_ALLOWED", { detail: "voice confirm did not match the grammar" });
        }
        const req: ConfirmRequest = intent.invocation === "glasses_input"
          ? { decision: intent.platform_intent, channel: "glasses_gesture", evidence: { input: intent.input! } }
          : intent.invocation === "typed"
            ? { decision: intent.platform_intent, channel: "phone_tap", evidence: { ui_event_id: intent.turn_id } }
            : { decision: intent.platform_intent, channel: "voice_readback",
                evidence: { utterance: intent.transcript!.text, asr_confidence: intent.transcript!.confidence ?? 0 } };
        const result = await confirmProposal(entry, session, req, deps);
        if (result.status === "applied") {
          const final = platformFinal(`req_${intent.turn_id}`, fi ? "Tehty. Voit perua sen puhelimessa." : "Done. You can undo it on your phone.");
          if (result.card && final.type === "final") {
            // Carry the capability's updated card (cited calc_ids included in the trace).
            emit({ type: "card", card: result.card });
            final.response.cards = [result.card];
            final.response.trace.calc_ids = result.card.basis.calc_ids;
          }
          return emit(final);
        }
        if (result.status === "rejected_by_user") return say("OK, I won't.", "Selvä, en tee sitä.");
        throw new PlatformError("INTERNAL", { detail: `apply returned ${result.status}` });
      }
      default:
        return say("OK.", "Selvä.");
    }
  }

  async function handleDomainTurn(intent: VoiceIntent, session: Session, locale: string, emit: (e: DomainResponseEvent) => void, raw: FastifyReply["raw"]) {
    const cap = deps.registry.route(intent.transcript?.text, intent.capability_hint, intent.context.active_capability);
    const capabilityId = cap.manifest.capability_id;
    consents.requireForCapability(session.userRef, capabilityId); // fail closed (ARCHITECTURE.md §2.5)

    // Attached captures reach the capability as Observations, or as media only if its manifest asks for it.
    const observations: Observation[] = [];
    const media: ContextCapture[] = [];
    for (const id of intent.attached_capture_ids) {
      const stored = captures.get(session.userRef, id);
      if (!stored) {
        if (captures.purgedUnderGrant(id)) throw new PlatformError("CONSENT_REVOKED", { capabilityId });
        throw new PlatformError("VALIDATION_FAILED", { capabilityId, detail: `unknown or expired capture ${id}` });
      }
      consents.requireForCapture(session.userRef, stored.capture.consent_grant_id, stored.capture.purpose);
      const decl = cap.manifest.capture_purposes.find((p) => p.purpose === stored.capture.purpose);
      if (!decl) throw new PlatformError("VALIDATION_FAILED", { capabilityId, detail: `capability does not accept ${stored.capture.purpose}` });
      if (decl.delivery === "observation" && stored.observation) observations.push(stored.observation);
      else if (decl.delivery === "media" && captures.hasImage(id)) media.push(stored.capture);
      else throw new PlatformError("CAPTURE_UNUSABLE", { capabilityId, detail: `capture ${id} has nothing to deliver` });
    }

    const request: DomainRequest = {
      schema: "platform.domain_request/v1",
      request_id: `req_${randomUUID().slice(0, 8)}`,
      turn_id: intent.turn_id,
      session_id: session.sessionId,
      capability_id: capabilityId,
      user_ref: session.userRef,
      locale,
      utterance: intent.transcript?.text ?? null,
      observations,
      captures: media,
      conversation: { ref: session.conversationRef, recent_turns: intent.context.recent_turns },
      output_constraints: { speech_max_words: SPEECH_MAX_WORDS, discreet_mode: intent.output.discreet_mode, display: intent.output.display },
      device_capabilities: intent.device_capabilities,
      deadline_ms: deps.deadlineMs ?? 3500,
    };
    requireValid("domain_request", request);

    session.inFlight?.controller.abort(); // a new turn supersedes the old one
    const controller = new AbortController();
    session.inFlight = { turnId: intent.turn_id, controller };
    raw.on("close", () => { if (!raw.writableFinished) controller.abort(); });

    const declared = new Map(cap.manifest.action_kinds.map((k) => [k.kind, k]));
    try {
      for await (const event of cap.adapter.handle(request, controller.signal)) {
        if (controller.signal.aborted) return;
        if (event.type === "proposal" || event.type === "card") { emit(event); continue; }
        if (event.type === "progress") { emit(event); continue; }
        const composed = composeSpeech(event.response as DomainResponse, {
          speechMaxWords: SPEECH_MAX_WORDS, discreetMode: intent.output.discreet_mode, locale,
        });
        // Policy check: only proposals the manifest declares, with declared channels.
        for (const p of composed.proposals) {
          const decl = declared.get(p.kind);
          const ok = decl && p.confirm_channels.every((c) => decl.confirm_channels.includes(c)) && decl.risk === p.risk;
          if (!ok) throw new PlatformError("INTERNAL", { capabilityId, detail: `undeclared proposal ${p.kind}` });
          ledger.register({ proposal: p, userRef: session.userRef, sessionId: session.sessionId, capabilityId, readbackPlayed: intent.output.speech });
        }
        emit({ type: "final", response: composed });
      }
    } finally {
      if (session.inFlight?.controller === controller) session.inFlight = undefined;
    }
  }

  return app;
}
