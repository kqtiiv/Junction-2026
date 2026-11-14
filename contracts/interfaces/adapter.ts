// AgentOrchestratorAdapter: the only interface the platform orchestrator calls on a
// capability. Hand-written (it describes behaviour, not data); every type it uses is
// generated from schemas/v1.
//
// Implementations for S-Bank Coach (see docs/PLATFORM_ARCHITECTURE.md §3.11):
//   RemoteAgentBackend      HTTPS + SSE to the Coach team's POST /v1/turn (http/coach-agent.openapi.yaml)
//   OnDeviceAgentBackend    in-process on the phone (Gemma 4 E2B, or FunctionGemma router + Gemma 3 1B)
//   DeterministicFastPath   intent → finance tool → template; offline mode and demo fallback
// The platform cannot tell these apart, and must not try to.

import type {
  ActionResult,
  DomainCapability,
  DomainRequest,
  DomainResponseEvent,
  ToolResult,
  UserConfirmation,
} from "../generated/ts/contracts";

export interface AdapterHealth {
  status: "ok" | "degraded" | "down";
  /** Opaque backend id, e.g. "remote_agent@0.4". Telemetry only. */
  backend: string;
}

export interface AgentOrchestratorAdapter {
  /** Static declaration, validated against capability_manifest.schema.json at load. */
  manifest(): DomainCapability;

  /**
   * Answer one turn as a stream. Must emit exactly one `final` event. The adapter
   * must finish within `req.deadline_ms` (falling back internally if needed) and
   * must honour `signal` (the user said "stop", or the turn was superseded).
   */
  handle(req: DomainRequest, signal: AbortSignal): AsyncIterable<DomainResponseEvent>;

  /**
   * Apply a confirmed proposal. Implementations MUST verify the platform signature
   * and that `c.payload_hash` matches the payload they hold before applying.
   */
  onConfirmation(c: UserConfirmation): Promise<ActionResult>;

  health(): Promise<AdapterHealth>;
}

/**
 * Lets the adapter check numbers independently of the agent: resolve a calc_id
 * against the domain's calculation log (finance: finance.get_calculation).
 */
export interface CalculationResolver {
  resolve(calcId: string): Promise<ToolResult | null>;
}
