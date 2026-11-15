// Fixture finance engine: a stand-in for the team's deterministic money engine
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

/**
 * Synthetic scenarios for the trust gate, the evaluation harness and the demo (DEC-030).
 * All are fixture data and reported as mock.
 */
export type FixtureScenario =
  | "default" | "insufficient" | "stale" | "stale_recent" | "unknown_bill" | "conflict" | "missing" | "pace";
export const FIXTURE_SCENARIOS: FixtureScenario[] = ["default", "insufficient", "stale", "stale_recent", "unknown_bill", "conflict", "missing", "pace"];

export class FixtureFinanceEngine implements FinanceEngine {
  readonly source = "fixture" as const;
  readonly mock = true;
  readonly version = "fixture-1.0.0";
  private readonly baseSts: ToolResult;
  private readonly calcs = new CalcLog((r) => assertValid("finance/finance_tool_result", r));
  private readonly planned = new Map<string, PlannedItem[]>();
  private readonly scenarios = new Map<string, FixtureScenario>();
  private readonly defaultScenario: FixtureScenario;
  private readonly now: () => Date;

  constructor(opts: { scenario?: FixtureScenario; now?: () => Date } = {}) {
    this.defaultScenario = opts.scenario ?? "default";
    this.now = opts.now ?? (() => new Date());
    this.baseSts = loadExample<ToolResult>("valid/finance/tool_result.safe_to_spend.json");
    assertValid("finance/finance_tool_result", this.baseSts);
  }

  private record(userRef: string, result: ToolResult): ToolResult { return this.calcs.record(userRef, result); }
  private nextId(prefix: string): string { return this.calcs.nextId(prefix); }

  plannedFor(userRef: string): PlannedItem[] {
    return this.planned.get(userRef) ?? [];
  }

  /** Switches one user to a synthetic scenario (evaluation harness, demo). */
  setScenario(userRef: string, scenario: FixtureScenario): void {
    this.scenarios.set(userRef, scenario);
  }

  scenarioFor(userRef: string): FixtureScenario {
    return this.scenarios.get(userRef) ?? this.defaultScenario;
  }

  /** The base safe-to-spend result for this user's scenario. Fixture data is dated "now" unless the scenario is about age. */
  private baseFor(userRef: string): ToolResult {
    const base = structuredClone(this.baseSts);
    const now = this.now().getTime();
    base.as_of = new Date(now).toISOString();
    const r = base.result as SafeToSpendResult;
    switch (this.scenarioFor(userRef)) {
      case "insufficient":
        r.safe_to_spend_week = eur("12.40");
        r.flexible_until_payday = eur("35.10");
        base.calc_id = "calc_sts_low";
        break;
      case "stale":
        base.as_of = new Date(now - 9 * 86_400_000).toISOString();
        base.missing_data = [...base.missing_data, { code: "BALANCE_STALE", detail: "Last synced 9 days ago" }];
        base.calc_id = "calc_sts_stale";
        break;
      case "stale_recent":
        base.as_of = new Date(now - 2 * 86_400_000).toISOString();
        base.missing_data = [...base.missing_data, { code: "BALANCE_STALE", detail: "Last synced 2 days ago" }];
        base.calc_id = "calc_sts_old";
        break;
      case "unknown_bill":
        base.missing_data = [...base.missing_data, { code: "COMMITMENT_UNKNOWN", detail: "phone bill due before payday, amount not known" }];
        base.calc_id = "calc_sts_bill";
        break;
      case "conflict":
        base.missing_data = [...base.missing_data, { code: "SOURCE_CONFLICT", detail: "two linked accounts report different balances" }];
        base.calc_id = "calc_sts_conflict";
        break;
      case "pace":
        base.data_mode = "pace";
        base.missing_data = [...base.missing_data, { code: "NO_BALANCE", detail: "spending history only" }];
        base.calc_id = "calc_sts_pace";
        break;
      default:
        break;
    }
    return base;
  }

  /** Planned purchases reduce this week's allowance (P_H in the reference formula). */
  getSafeToSpend(userRef: string): ToolResult | null {
    if (this.scenarioFor(userRef) === "missing") return null;
    const baseSts = this.baseFor(userRef);
    const items = this.plannedFor(userRef);
    if (items.length === 0) return this.record(userRef, baseSts);

    const base = baseSts.result as SafeToSpendResult;
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
      ...baseSts,
      calc_id: this.nextId("sts"),
      tool_version: this.version,
      as_of: baseSts.as_of,
      result,
      assumptions: [...baseSts.assumptions, `Includes ${items.length} planned purchase(s)`],
    });
  }

  calculateAffordability(userRef: string, input: AffordabilityInput): { result: ToolResult; sts: ToolResult } | null {
    const sts = this.getSafeToSpend(userRef);
    if (!sts) return null;
    return { result: this.record(userRef, affordabilityResult(sts, input, this.nextId("aff"), this.version)), sts };
  }

  addPlanned(userRef: string, item: Omit<PlannedItem, "plannedAt">): void {
    this.planned.set(userRef, [...this.plannedFor(userRef), { ...item, plannedAt: new Date().toISOString() }]);
  }

  async resolve(userRef: string, calcId: string): Promise<ToolResult | null> {
    return this.calcs.resolve(userRef, calcId);
  }
}
