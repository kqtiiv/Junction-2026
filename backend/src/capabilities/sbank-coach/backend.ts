// Internal backend interface inside SBankCoachAdapter (L5). The platform never sees
// which backend answered beyond the opaque trace.backend string (DEC-010, DEC-017).
import type { ActionResult, DomainRequest, DomainResponse, UserConfirmation } from "../../contracts.ts";

export interface AgentBackend {
  /** Opaque id for telemetry, e.g. "fast_path@1", "remote_agent@0.4". */
  readonly id: string;
  /** True when fixtures or a mock stand in for a real dependency (DEC-005). */
  readonly mock: boolean;
  turn(req: DomainRequest, signal: AbortSignal): Promise<DomainResponse>;
  confirm(c: UserConfirmation): Promise<ActionResult>;
  healthy(): Promise<boolean>;
}
