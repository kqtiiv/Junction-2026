// s_pankki source (named after the dataset's provider; DEC-026): the team's money engine, run by finance-engine/server.py (DEC-024).
// Every figure comes from that service with a calc_id; the verifier resolves calc_ids back
// through the service, never from a local copy. Answers are until payday, not per week (DEC-025).
// Confirmed plans are kept here and sent as planned_total, so the service stays stateless.
import { validate, type ToolResult } from "../../contracts.ts";
import { PlatformError } from "../../errors.ts";
import { fromCents, toCents } from "../../sdk/money.ts";
import type { AffordabilityInput, FinanceEngine, PlannedItem } from "./finance-engine.ts";

const CAPABILITY_ID = "sbank.coach";

export class SPankkiFinanceEngine implements FinanceEngine {
  readonly source = "s_pankki" as const;
  /** Real engine on the challenge's dataset; the simulated date is stated in every result. */
  readonly mock = false;
  readonly version = "s-pankki-http-1";
  private readonly planned = new Map<string, PlannedItem[]>();

  constructor(private readonly baseUrl: string, private readonly timeoutMs = 3000, private readonly fetchFn: typeof fetch = fetch) {}

  plannedFor(userRef: string): PlannedItem[] {
    return this.planned.get(userRef) ?? [];
  }

  addPlanned(userRef: string, item: Omit<PlannedItem, "plannedAt">): void {
    this.planned.set(userRef, [...this.plannedFor(userRef), { ...item, plannedAt: new Date().toISOString() }]);
  }

  private plannedTotal(userRef: string): string {
    return fromCents(this.plannedFor(userRef).reduce((s, p) => s + toCents(p.amount), 0n));
  }

  private async call(path: string, init?: RequestInit): Promise<Response> {
    try {
      return await this.fetchFn(new URL(path, this.baseUrl), { ...init, signal: AbortSignal.timeout(this.timeoutMs) });
    } catch (err) {
      throw new PlatformError("CAPABILITY_UNAVAILABLE", { capabilityId: CAPABILITY_ID, detail: `finance engine unreachable: ${String(err)}` });
    }
  }

  private async post(path: string, body: unknown): Promise<unknown> {
    const res = await this.call(path, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
    if (!res.ok) {
      throw new PlatformError("CAPABILITY_UNAVAILABLE", { capabilityId: CAPABILITY_ID, detail: `finance engine ${path} → ${res.status}: ${await res.text()}` });
    }
    return res.json();
  }

  /** Every result is checked against the finance contract before anything uses it. */
  private checked(r: unknown): ToolResult {
    const v = validate("finance/finance_tool_result", r);
    if (!v.ok) {
      throw new PlatformError("CAPABILITY_UNAVAILABLE", { capabilityId: CAPABILITY_ID, detail: `finance engine broke the contract: ${v.errors.join("; ")}` });
    }
    return r as ToolResult;
  }

  async getSafeToSpend(userRef: string): Promise<ToolResult> {
    return this.checked(await this.post("/v1/tools/safe_to_spend", { user_ref: userRef, planned_total: this.plannedTotal(userRef) }));
  }

  async calculateAffordability(userRef: string, input: AffordabilityInput): Promise<{ result: ToolResult; sts: ToolResult }> {
    const out = await this.post("/v1/tools/affordability", {
      user_ref: userRef, amount: input.amount, price_source: input.priceSource,
      ...(input.observationId ? { observation_id: input.observationId } : {}),
      planned_total: this.plannedTotal(userRef),
    }) as { result: unknown; sts: unknown };
    return { result: this.checked(out.result), sts: this.checked(out.sts) };
  }

  /** The verifier's lookup. Unknown, another user's, or engine down: null, so the figure is dropped. */
  async resolve(userRef: string, calcId: string): Promise<ToolResult | null> {
    try {
      const res = await this.call(`/v1/calculations/${encodeURIComponent(calcId)}?user_ref=${encodeURIComponent(userRef)}`);
      if (!res.ok) return null;
      const r = await res.json();
      return validate("finance/finance_tool_result", r).ok ? (r as ToolResult) : null;
    } catch {
      return null;
    }
  }

  async healthy(): Promise<boolean> {
    try {
      return (await this.call("/health")).ok;
    } catch {
      return false;
    }
  }
}
