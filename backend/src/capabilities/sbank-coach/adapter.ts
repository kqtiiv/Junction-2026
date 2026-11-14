// SBankCoachAdapter (L5): implements contracts/interfaces/adapter.ts.
// Chooses a backend (remote agent when configured and healthy, else the deterministic
// fast path), enforces the deadline, falls back on timeout or bad output, verifies every
// number against the engine's calculation log, and only then emits events.
import type { AgentOrchestratorAdapter, AdapterHealth } from "../../../../contracts/interfaces/adapter.ts";
import {
  loadExample, validate, assertValid,
  type ActionResult, type DomainCapability, type DomainRequest, type DomainResponse, type DomainResponseEvent, type UserConfirmation,
} from "../../contracts.ts";
import { PlatformError } from "../../errors.ts";
import { verifyResponse } from "../../sdk/verifier.ts";
import type { AgentBackend } from "./backend.ts";
import { CAPABILITY_ID, type DeterministicFastPath } from "./fast-path.ts";
import type { FinanceEngine } from "./finance-engine.ts";

export interface SBankCoachAdapterOptions {
  engine: FinanceEngine;
  fastPath: DeterministicFastPath;
  /** The Coach team's agent. Absent until their endpoint exists; the fast path answers meanwhile. */
  remote?: AgentBackend;
}

const NEUTRAL_SPEECH = { en: "I've put the details on your phone.", fi: "Tiedot ovat puhelimessasi." };

/** x_ extension fields are allowed by every schema but omitted from generated types. */
export type DebuggableResponse = DomainResponse & {
  x_debug?: { backend: string; mock: boolean; verified: boolean; latency_ms: number; fallback_reason?: string };
};

export class SBankCoachAdapter implements AgentOrchestratorAdapter {
  private readonly manifestDoc: DomainCapability;
  private readonly owners = new Map<string, AgentBackend>();

  constructor(private readonly opts: SBankCoachAdapterOptions) {
    const doc = loadExample<DomainCapability>("valid/finance/manifest.sbank_coach.json");
    this.manifestDoc = { ...doc, transport: { kind: "in_process" } };
    assertValid("finance/finance_manifest", this.manifestDoc);
  }

  manifest(): DomainCapability {
    return this.manifestDoc;
  }

  async health(): Promise<AdapterHealth> {
    const remote = this.opts.remote;
    if (remote && (await remote.healthy())) return { status: "ok", backend: remote.id, mock: remote.mock || this.opts.engine.mock };
    // No real agent: the fast path is answering on fixture data. Never hidden (DEC-005).
    return { status: remote ? "degraded" : "ok", backend: this.opts.fastPath.id, mock: this.opts.fastPath.mock };
  }

  async *handle(req: DomainRequest, signal: AbortSignal): AsyncIterable<DomainResponseEvent> {
    const started = Date.now();
    const { fastPath, remote, engine } = this.opts;
    const useRemote = remote !== undefined && (await remote.healthy());
    let backend: AgentBackend = useRemote ? remote : fastPath;
    let fallbackReason: string | undefined;

    if (useRemote) yield { type: "progress", stage: "thinking", speech_hint: { en: "Checking your week…", fi: "Tarkistan viikkosi…" } };

    let response: DomainResponse | undefined;
    try {
      response = await this.callWithDeadline(backend, req, signal);
      const shape = validate("domain_response", response);
      if (!shape.ok) throw new Error(`invalid DomainResponse: ${shape.errors.join("; ")}`);
    } catch (err) {
      if (signal.aborted) return; // DEC-011: no final after an abort
      if (backend === fastPath) throw err;
      fallbackReason = err instanceof DeadlineError ? "agent_timeout" : "agent_error";
      if (!fastPath.supports(req)) {
        throw new PlatformError(fallbackReason === "agent_timeout" ? "CAPABILITY_TIMEOUT" : "CAPABILITY_UNAVAILABLE", {
          capabilityId: CAPABILITY_ID, detail: String(err),
        });
      }
      backend = fastPath;
      response = await fastPath.turn(req);
    }
    if (signal.aborted) return;

    const outcome = await verifyResponse(response, req.user_ref, req.observations, engine);
    const verified = outcome.speechVerified && outcome.droppedCards.length === 0;
    const isFi = req.locale.startsWith("fi");
    const final: DebuggableResponse = {
      ...response,
      speech: outcome.speechVerified ? response.speech : { text: isFi ? NEUTRAL_SPEECH.fi : NEUTRAL_SPEECH.en, epistemic: "fact" },
      cards: outcome.verifiedCards,
      trace: {
        ...response.trace,
        calc_ids: outcome.resolvedCalcIds,
        backend: backend.id,
        verified,
        verification: { checked_values: outcome.checkedValues, unverified: outcome.unverified },
      },
      x_debug: {
        backend: backend.id,
        mock: backend.mock,
        verified,
        latency_ms: Date.now() - started,
        ...(fallbackReason ? { fallback_reason: fallbackReason } : {}),
      },
    };
    for (const p of final.proposals) this.owners.set(p.proposal_id, backend);

    for (const card of final.cards) yield { type: "card", card };
    for (const proposal of final.proposals) yield { type: "proposal", proposal };
    if (signal.aborted) return;
    yield { type: "final", response: final };
  }

  async onConfirmation(c: UserConfirmation): Promise<ActionResult> {
    const backend = this.owners.get(c.proposal_id);
    if (!backend) {
      return { schema: "platform.action_result/v1", proposal_id: c.proposal_id, confirmation_id: c.confirmation_id, status: "failed",
        error: { code: "PROPOSAL_NOT_FOUND", message: "No backend holds this proposal", retryable: false } };
    }
    // Proposals are single use: whatever the outcome, this one is finished.
    this.owners.delete(c.proposal_id);
    return backend.confirm(c);
  }

  private async callWithDeadline(backend: AgentBackend, req: DomainRequest, signal: AbortSignal): Promise<DomainResponse> {
    const deadline = AbortSignal.timeout(req.deadline_ms);
    const combined = AbortSignal.any([signal, deadline]);
    return await new Promise<DomainResponse>((resolve, reject) => {
      const onAbort = () => reject(deadline.aborted && !signal.aborted ? new DeadlineError() : new Error("aborted"));
      if (combined.aborted) return onAbort();
      combined.addEventListener("abort", onAbort, { once: true });
      backend.turn(req, combined).then(resolve, reject).finally(() => combined.removeEventListener("abort", onAbort));
    });
  }
}

class DeadlineError extends Error {
  constructor() { super("deadline exceeded"); }
}
