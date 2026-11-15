// The finance engine seam (L6). Three data sources implement it:
//   fixture      seeded from contracts/examples (the demo numbers), always a mock; per week;
//   user_stated  no bank data at all: the user's own weekly amount, asked for once by voice; per week;
//   s_pankki     the team's money engine on the Junction 2026 dataset, over HTTP (DEC-024); until payday (DEC-025).
// Later: an open-banking aggregator source behind the same interface.
import type { ToolResult } from "../../contracts.ts";
import type { UserScopedCalculationResolver } from "../../sdk/verifier.ts";
import { eur, fromCents, toCents } from "../../sdk/money.ts";

export interface PlannedItem { label: string; amount: string; plannedAt: string }

export interface AffordabilityInput {
  amount: string;
  priceSource: "basket" | "stated_amount" | "observation";
  observationId?: string;
}

/** Only sources that rely on a figure the user says out loud have this. */
export interface StatedBudget {
  /** True once the user has given a weekly amount (any week: it carries over). */
  has(userRef: string): boolean;
  set(userRef: string, amount: string): void;
}

/** In-process sources answer synchronously; the s_pankki source answers over HTTP. */
export type Awaitable<T> = T | Promise<T>;

export interface FinanceEngine extends UserScopedCalculationResolver {
  readonly source: "fixture" | "user_stated" | "s_pankki";
  readonly mock: boolean;
  readonly version: string;
  /** Present when the engine needs the user's weekly amount before it can answer. */
  readonly stated?: StatedBudget;
  /** null when the engine lacks the data to answer (e.g. no weekly amount yet). */
  getSafeToSpend(userRef: string): Awaitable<ToolResult | null>;
  calculateAffordability(userRef: string, input: AffordabilityInput): Awaitable<{ result: ToolResult; sts: ToolResult } | null>;
  addPlanned(userRef: string, item: Omit<PlannedItem, "plannedAt">): void;
  plannedFor(userRef: string): PlannedItem[];
}

type StsResult = { safe_to_spend_week: { amount: string } };

/**
 * Affordability from a safe-to-spend result, identical for every source.
 * Thresholds (docs/finance/REFERENCE_DESIGN.md §6.4): FITS if ≥25 % of the week's allowance
 * remains, TIGHT if 0–25 %, EXCEEDS below zero.
 */
export function affordabilityResult(sts: ToolResult, input: AffordabilityInput, calcId: string, toolVersion: string): ToolResult {
  const stsWeek = (sts.result as StsResult).safe_to_spend_week.amount;
  const allowance = toCents(stsWeek);
  const remaining = allowance - toCents(input.amount);
  // Pace mode (spending history only) never gets a yes/no (REFERENCE_DESIGN §6.6).
  const verdict = sts.data_mode === "pace" ? "UNKNOWN" : remaining < 0n ? "EXCEEDS" : remaining * 4n >= allowance ? "FITS" : "TIGHT";
  const assumptions = [...sts.assumptions];
  if (input.priceSource === "observation") assumptions.unshift("Price read from the shelf label");
  if (input.priceSource === "stated_amount") assumptions.unshift("Amount as stated by the user");
  return {
    schema: "platform.tool_result/v1",
    ok: true,
    calc_id: calcId,
    tool: "finance.calculate_affordability",
    tool_version: toolVersion,
    epistemic: "estimate",
    ...(sts.data_mode ? { data_mode: sts.data_mode } : {}),
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
    missing_data: sts.missing_data,
    warnings: [],
    confidence: sts.confidence ?? "medium",
  };
}

/** ISO week id ("2026-W47") and days left this week, counting today, in Helsinki time. */
export function helsinkiWeek(now: Date): { weekId: string; daysLeft: number } {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat("en-GB", { timeZone: "Europe/Helsinki", year: "numeric", month: "2-digit", day: "2-digit", weekday: "short" })
      .formatToParts(now).map((p) => [p.type, p.value]),
  );
  const isoDay = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].indexOf(parts.weekday!) + 1;   // 1..7
  const local = new Date(Date.UTC(Number(parts.year), Number(parts.month) - 1, Number(parts.day)));
  // ISO week: the Thursday of this week decides the year.
  const thursday = new Date(local);
  thursday.setUTCDate(local.getUTCDate() + 4 - isoDay);
  const yearStart = new Date(Date.UTC(thursday.getUTCFullYear(), 0, 1));
  const week = Math.ceil(((thursday.getTime() - yearStart.getTime()) / 86_400_000 + 1) / 7);
  return { weekId: `${thursday.getUTCFullYear()}-W${String(week).padStart(2, "0")}`, daysLeft: 8 - isoDay };
}

/**
 * The calculation log every engine keeps: validated, user-scoped, resolvable by calc_id for the
 * verifier. Shared so the engines can't drift. Keeps the most recent `perUser` entries per user.
 */
export class CalcLog {
  private readonly log = new Map<string, Map<string, ToolResult>>();
  private counter = 0;

  constructor(private readonly validate: (r: ToolResult) => void, private readonly perUser = 500) {}

  nextId(prefix: string): string {
    this.counter += 1;
    return `calc_${prefix}_${this.counter.toString().padStart(3, "0")}`;
  }

  record(userRef: string, result: ToolResult): ToolResult {
    this.validate(result);
    let userLog = this.log.get(userRef);
    if (!userLog) this.log.set(userRef, (userLog = new Map()));
    userLog.set(result.calc_id as string, result);
    if (userLog.size > this.perUser) userLog.delete(userLog.keys().next().value!);   // oldest first
    return result;
  }

  resolve(userRef: string, calcId: string): ToolResult | null {
    return this.log.get(userRef)?.get(calcId) ?? null;
  }
}
