// Fixture finance engine: a stand-in for the S-Bank Coach team's deterministic engine
// (L6), seeded from contracts/examples so the numbers match the documented demo story.
// It is always reported as a mock (DEC-005). Arithmetic is exact (integer cents).
// Thresholds follow docs/finance/REFERENCE_DESIGN.md §6.4: FITS if ≥25 % of the week's
// allowance remains, TIGHT if 0–25 %, EXCEEDS below zero, UNKNOWN in pace mode.
import { loadExample, assertValid, type ToolResult } from "../../contracts.ts";
import { eur, fromCents, toCents } from "../../sdk/money.ts";
import type { UserScopedCalculationResolver } from "../../sdk/verifier.ts";

export interface PlannedItem { label: string; amount: string; plannedAt: string }

export interface AffordabilityInput {
  amount: string;
  priceSource: "basket" | "stated_amount" | "observation";
  observationId?: string;
}

type SafeToSpendResult = {
  safe_to_spend_week: { amount: string; currency: "EUR" };
  flexible_until_payday: { amount: string; currency: "EUR" };
  days_left_in_week: number;
  days_to_income: number;
  next_income_date: string | null;
  shortfall?: { amount: string; currency: "EUR" };
};

export class FixtureFinanceEngine implements UserScopedCalculationResolver {
  readonly mock = true;
  readonly version = "fixture-1.0.0";
  private readonly baseSts: ToolResult;
  private readonly log = new Map<string, Map<string, ToolResult>>();
  private readonly planned = new Map<string, PlannedItem[]>();
  private counter = 0;

  constructor() {
    this.baseSts = loadExample<ToolResult>("valid/finance/tool_result.safe_to_spend.json");
    assertValid("finance/finance_tool_result", this.baseSts);
  }

  private record(userRef: string, result: ToolResult): ToolResult {
    assertValid("finance/finance_tool_result", result);
    let userLog = this.log.get(userRef);
    if (!userLog) this.log.set(userRef, (userLog = new Map()));
    userLog.set(result.calc_id as string, result);
    return result;
  }

  private nextId(prefix: string): string {
    this.counter += 1;
    return `calc_${prefix}_${this.counter.toString().padStart(3, "0")}`;
  }

  plannedFor(userRef: string): PlannedItem[] {
    return this.planned.get(userRef) ?? [];
  }

  /** Planned purchases reduce this week's allowance (P_H in the reference formula). */
  getSafeToSpend(userRef: string): ToolResult {
    const items = this.plannedFor(userRef);
    if (items.length === 0) return this.record(userRef, structuredClone(this.baseSts));

    const base = this.baseSts.result as SafeToSpendResult;
    const plannedCents = items.reduce((s, i) => s + toCents(i.amount), 0n);
    const week = toCents(base.safe_to_spend_week.amount) - plannedCents;
    const flex = toCents(base.flexible_until_payday.amount) - plannedCents;
    const result: SafeToSpendResult = {
      ...base,
      safe_to_spend_week: eur(fromCents(week < 0n ? 0n : week)),
      flexible_until_payday: eur(fromCents(flex)),
    };
    if (week < 0n) result.shortfall = eur(fromCents(-week));
    return this.record(userRef, {
      ...structuredClone(this.baseSts),
      calc_id: this.nextId("sts"),
      tool_version: this.version,
      as_of: new Date().toISOString(),
      result,
      assumptions: [...this.baseSts.assumptions, `Includes ${items.length} planned purchase(s)`],
    });
  }

  calculateAffordability(userRef: string, input: AffordabilityInput): { result: ToolResult; sts: ToolResult } {
    const sts = this.getSafeToSpend(userRef);
    const stsWeek = (sts.result as SafeToSpendResult).safe_to_spend_week.amount;
    const allowance = toCents(stsWeek);
    const remaining = allowance - toCents(input.amount);
    const verdict = remaining < 0n ? "EXCEEDS" : remaining * 4n >= allowance ? "FITS" : "TIGHT";

    const assumptions = [...sts.assumptions];
    if (input.priceSource === "observation") assumptions.unshift("Price read from the shelf label");
    if (input.priceSource === "stated_amount") assumptions.unshift("Amount as stated by the user");

    const result: ToolResult = {
      schema: "platform.tool_result/v1",
      ok: true,
      calc_id: this.nextId("aff"),
      tool: "finance.calculate_affordability",
      tool_version: this.version,
      epistemic: "estimate",
      data_mode: sts.data_mode,
      as_of: new Date().toISOString(),
      result: {
        amount_checked: eur(input.amount),
        price_source: input.priceSource,
        ...(input.observationId ? { observation_id: input.observationId } : {}),
        verdict,
        safe_to_spend_week: eur(stsWeek),
        remaining_after: eur(fromCents(remaining)),
      },
      assumptions,
      missing_data: [],
      warnings: [],
      confidence: sts.confidence ?? "medium",
    };
    return { result: this.record(userRef, result), sts };
  }

  addPlanned(userRef: string, item: Omit<PlannedItem, "plannedAt">): void {
    this.planned.set(userRef, [...this.plannedFor(userRef), { ...item, plannedAt: new Date().toISOString() }]);
  }

  async resolve(userRef: string, calcId: string): Promise<ToolResult | null> {
    return this.log.get(userRef)?.get(calcId) ?? null;
  }
}
