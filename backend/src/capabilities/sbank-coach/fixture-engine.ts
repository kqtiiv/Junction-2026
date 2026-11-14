// Fixture finance engine: a stand-in for the S-Bank Coach team's deterministic engine
// (L6), seeded from contracts/examples so the numbers match the documented demo story.
// It is always reported as a mock (DEC-005). Arithmetic is exact (integer cents).
// Thresholds follow docs/finance/REFERENCE_DESIGN.md §6.4: FITS if ≥25 % of the week's
// allowance remains, TIGHT if 0–25 %, EXCEEDS below zero, UNKNOWN in pace mode.
import { loadExample, assertValid, type ToolResult } from "../../contracts.ts";
import { eur, fromCents, toCents } from "../../sdk/money.ts";
import { affordabilityResult, CalcLog, type AffordabilityInput, type FinanceEngine, type PlannedItem } from "./finance-engine.ts";

type SafeToSpendResult = {
  safe_to_spend_week: { amount: string; currency: "EUR" };
  flexible_until_payday: { amount: string; currency: "EUR" };
  days_left_in_week: number;
  days_to_income: number;
  next_income_date: string | null;
  shortfall?: { amount: string; currency: "EUR" };
};

export class FixtureFinanceEngine implements FinanceEngine {
  readonly source = "fixture" as const;
  readonly mock = true;
  readonly version = "fixture-1.0.0";
  private readonly baseSts: ToolResult;
  private readonly calcs = new CalcLog((r) => assertValid("finance/finance_tool_result", r));
  private readonly planned = new Map<string, PlannedItem[]>();

  constructor() {
    this.baseSts = loadExample<ToolResult>("valid/finance/tool_result.safe_to_spend.json");
    assertValid("finance/finance_tool_result", this.baseSts);
  }

  private record(userRef: string, result: ToolResult): ToolResult { return this.calcs.record(userRef, result); }
  private nextId(prefix: string): string { return this.calcs.nextId(prefix); }

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
    return { result: this.record(userRef, affordabilityResult(sts, input, this.nextId("aff"), this.version)), sts };
  }

  addPlanned(userRef: string, item: Omit<PlannedItem, "plannedAt">): void {
    this.planned.set(userRef, [...this.plannedFor(userRef), { ...item, plannedAt: new Date().toISOString() }]);
  }

  async resolve(userRef: string, calcId: string): Promise<ToolResult | null> {
    return this.calcs.resolve(userRef, calcId);
  }
}
