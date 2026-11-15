// Purchase memory (DEC-031): what the user decided about things they asked about — plan it in,
// wait, or skip. Only items the user asked about are remembered, never anything captured
// passively. In memory only (gone on restart), per user, and deleted by "forget my decisions".
//
// CoachCalcs: the coach's own derived calculations (a sum of decisions), logged with calc_ids
// so the grounding verifier can trace their figures exactly like the engine's.
import type { ToolResult } from "../../contracts.ts";
import { assertValid } from "../../contracts.ts";
import { eur, fromCents, toCents } from "../../sdk/money.ts";
import { CalcLog } from "./finance-engine.ts";

export type Decision = "planned" | "waiting" | "skipped";

export interface DecisionEntry {
  label: string;
  amount: string;
  decision: Decision;
  at: string;
  /** The affordability calculation the decision was made on. */
  calcId: string;
}

export interface TrustCounters {
  /** Times the coach asked instead of guessing a price. */
  priceChecks: number;
  /** Times the user gave a different price from the one the camera read first. */
  priceCorrections: number;
  /** Times the coach withheld a verdict. */
  abstentions: number;
  /** Answers given with a verdict. */
  answers: number;
}

const zero = (): TrustCounters => ({ priceChecks: 0, priceCorrections: 0, abstentions: 0, answers: 0 });

export class DecisionMemory {
  private readonly entries = new Map<string, DecisionEntry[]>();
  private readonly counters = new Map<string, TrustCounters>();

  record(userRef: string, entry: Omit<DecisionEntry, "at">, now = new Date()): DecisionEntry {
    const e = { ...entry, at: now.toISOString() };
    this.entries.set(userRef, [...this.list(userRef), e].slice(-50));
    return e;
  }

  list(userRef: string): DecisionEntry[] {
    return this.entries.get(userRef) ?? [];
  }

  count(userRef: string, key: keyof TrustCounters): void {
    const c = this.counters.get(userRef) ?? zero();
    c[key] += 1;
    this.counters.set(userRef, c);
  }

  trust(userRef: string): TrustCounters {
    return { ...(this.counters.get(userRef) ?? zero()) };
  }

  /** Deletes everything remembered about this user. Returns how many decisions were removed. */
  forget(userRef: string): number {
    const n = this.list(userRef).length;
    this.entries.delete(userRef);
    this.counters.delete(userRef);
    return n;
  }
}

export class CoachCalcs {
  private readonly log = new CalcLog((r) => assertValid("finance/finance_tool_result", r));

  /** Sums what the user decided to wait on or skip: money not spent (yet), not savings. */
  summarize(userRef: string, entries: DecisionEntry[], version: string): ToolResult {
    const kept = entries.filter((e) => e.decision !== "planned");
    const keptCents = kept.reduce((s, e) => s + toCents(e.amount), 0n);
    const plannedCents = entries.filter((e) => e.decision === "planned").reduce((s, e) => s + toCents(e.amount), 0n);
    return this.log.record(userRef, {
      schema: "platform.tool_result/v1",
      ok: true,
      calc_id: this.log.nextId("dec"),
      tool: "finance.summarize_decisions",
      tool_version: version,
      epistemic: "calculated",
      as_of: new Date().toISOString(),
      result: {
        decisions: entries.length,
        reconsidered: kept.length,
        kept_for_now: eur(fromCents(keptCents)),
        planned_total: eur(fromCents(plannedCents)),
        items: entries.map((e) => ({ amount: eur(e.amount), decision: e.decision })),
      },
      assumptions: ["Waiting or skipping keeps money unspent for now. It is not the same as saving it."],
      missing_data: [],
      warnings: [],
      confidence: "high",
    });
  }

  async resolve(userRef: string, calcId: string): Promise<ToolResult | null> {
    return this.log.resolve(userRef, calcId);
  }
}
