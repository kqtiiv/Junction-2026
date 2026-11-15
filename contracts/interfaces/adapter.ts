// AgentOrchestratorAdapter: the only interface the platform orchestrator calls on a
// capability. Hand-written (it describes behaviour, not data); every type it uses is
// generated from schemas/v1.
//
// Implementations for S-Bank Coach (see docs/ARCHITECTURE.md §3.11):
//   RemoteAgentBackend      HTTPS + SSE to the Coach team's POST /v1/turn (http/coach-agent.openapi.yaml)
//   OnDeviceAgentBackend    in-process on the phone, any on-device model (choice is the domain's; see ModelProvider)
//   DeterministicFastPath   intent → finance tool → template; offline mode and demo fallback
// The platform cannot tell these apart, and must not try to. No model, vendor or framework
// name may appear in this interface or its types (DEC-010).
//
// Cancellation (DEC-011): `signal` aborts when the user says "stop" or barges in. Implementations
// must stop emitting events, must not apply anything, and must propagate the abort to any remote
// call they started. Pending proposals stay pending; they are never applied as a side effect of abort.

import type {
  ActionResult,
  DomainCapability,
  DomainRequest,
  DomainResponseEvent,
  InsightCard,
  ToolResult,
  UserConfirmation,
} from "../generated/ts/contracts";

export interface AdapterHealth {
  status: "ok" | "degraded" | "down";
  /** Opaque backend id, e.g. "remote_agent@0.4". Telemetry only. */
  backend: string;
  /** True when a mock or fixture stands in for a real dependency. Never hidden (DEC-005). */
  mock?: boolean;
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

  /**
   * Optional (DEC-029): re-check a card a client sends back against this user's calculation
   * log, so a receipt can be verified independently of the session that produced it.
   */
  verifyCard?(card: InsightCard, userRef: string): Promise<{ grounded: boolean; checked_values: number; unverified: string[] }>;
}

/**
 * Lets the adapter check numbers independently of the agent: resolve a calc_id
 * against the domain's calculation log (finance: finance.get_calculation).
 */
export interface CalculationResolver {
  resolve(calcId: string): Promise<ToolResult | null>;
}
