// No bank data: the user's own weekly amount, said once out loud ("about a hundred"), is the
// budget. Confirmed plans count against it; it carries over to later weeks automatically, so a
// lazy user never has to set anything up again. Not a mock: these are the user's real figures,
// labelled "as you told me" (data_mode `budget`, missing NO_BALANCE).
import { assertValid, type ToolResult } from "../../contracts.ts";
import { eur, fromCents, toCents } from "../../sdk/money.ts";
import {
  affordabilityResult, CalcLog, helsinkiWeek,
  type AffordabilityInput, type FinanceEngine, type PlannedItem, type StatedBudget,
} from "./finance-engine.ts";

interface Weekly { amount: string; weekId: string }
interface Plan extends PlannedItem { weekId: string }

export class UserStatedFinanceEngine implements FinanceEngine {
  readonly source = "user_stated" as const;
  readonly mock = false;
  readonly version = "user-stated-1.0.0";
  private readonly weekly = new Map<string, Weekly>();
  private readonly plans = new Map<string, Plan[]>();
  private readonly calcs = new CalcLog((r) => assertValid("finance/finance_tool_result", r));

  constructor(private readonly now: () => Date = () => new Date()) {}

  readonly stated: StatedBudget = {
    has: (userRef) => this.weekly.has(userRef),
    set: (userRef, amount) => {
      toCents(amount); // validates the decimal string
      this.weekly.set(userRef, { amount, weekId: helsinkiWeek(this.now()).weekId });
    },
  };

  private nextId(prefix: string): string { return this.calcs.nextId(prefix); }
  private record(userRef: string, result: ToolResult): ToolResult { return this.calcs.record(userRef, result); }

  plannedFor(userRef: string): PlannedItem[] {
    const { weekId } = helsinkiWeek(this.now());
    return (this.plans.get(userRef) ?? []).filter((p) => p.weekId === weekId);
  }

  addPlanned(userRef: string, item: Omit<PlannedItem, "plannedAt">): void {
    const { weekId } = helsinkiWeek(this.now());
    // Only this week's plans count; drop earlier weeks' so they don't accumulate.
    const current = (this.plans.get(userRef) ?? []).filter((p) => p.weekId === weekId);
    this.plans.set(userRef, [...current, { ...item, plannedAt: this.now().toISOString(), weekId }]);
  }

  getSafeToSpend(userRef: string): ToolResult | null {
    const weekly = this.weekly.get(userRef);
    if (!weekly) return null;
    const { weekId, daysLeft } = helsinkiWeek(this.now());
    const planned = this.plannedFor(userRef).reduce((s, p) => s + toCents(p.amount), 0n);
    const left = toCents(weekly.amount) - planned;
    const week = eur(fromCents(left < 0n ? 0n : left));
    const assumptions = [`Weekly amount as you told me: ${weekly.amount} EUR`];
    if (weekly.weekId !== weekId) assumptions.push("Carried over from an earlier week; say a new amount to change it");
    return this.record(userRef, {
      schema: "platform.tool_result/v1",
      ok: true,
      calc_id: this.nextId("sts"),
      tool: "finance.get_safe_to_spend",
      tool_version: this.version,
      epistemic: "calculated",
      data_mode: "budget",
      as_of: this.now().toISOString(),
      result: {
        safe_to_spend_week: week,
        flexible_until_payday: week,           // no income data: the period is this week
        days_left_in_week: daysLeft,
        days_to_income: daysLeft,
        next_income_date: null,
        stated_weekly_amount: eur(weekly.amount),
        planned_this_week: eur(fromCents(planned)),
        ...(left < 0n ? { shortfall: eur(fromCents(-left)) } : {}),
      },
      assumptions,
      missing_data: [{ code: "NO_BALANCE", detail: "No bank connection; using the amount you gave" }],
      warnings: [],
      confidence: "medium",
    });
  }

  calculateAffordability(userRef: string, input: AffordabilityInput): { result: ToolResult; sts: ToolResult } | null {
    const sts = this.getSafeToSpend(userRef);
    if (!sts) return null;
    return { result: this.record(userRef, affordabilityResult(sts, input, this.nextId("aff"), this.version)), sts };
  }

  async resolve(userRef: string, calcId: string): Promise<ToolResult | null> {
    return this.calcs.resolve(userRef, calcId);
  }
}
