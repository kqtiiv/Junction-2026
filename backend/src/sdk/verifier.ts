// Grounding verifier (L4 capability SDK, domain-agnostic).
// Every money value on a card and every number in the spoken line must trace to a
// calculation the engine actually logged (resolved by calc_id), or to an observation.
// The agent's own trace is never trusted: calc_ids are re-resolved here.
import type { DomainResponse, InsightCard, Observation, ToolResult } from "../contracts.ts";
import { roundEuros } from "./money.ts";

export interface UserScopedCalculationResolver {
  resolve(userRef: string, calcId: string): Promise<ToolResult | null>;
}

export interface VerificationOutcome {
  speechVerified: boolean;
  verifiedCards: InsightCard[];
  droppedCards: string[];
  checkedValues: number;
  unverified: string[];
  /** calc_ids that resolved; only these may appear in the final trace. */
  resolvedCalcIds: string[];
}

const DECIMAL = /^-?(0|[1-9][0-9]*)\.[0-9]{2}$/;
// "about 10 euros", "noin 10 euroa", "around 90", "roughly 90", "n. 90"
const APPROX = /(about|around|roughly|approximately|almost|nearly|noin|lähes|melkein|n\.|ungefär|cirka|ca\.)\s*(€\s*)?$/i;

function collectValues(node: unknown, decimals: Set<string>, integers: Set<string>): void {
  if (typeof node === "string") {
    if (DECIMAL.test(node)) decimals.add(node.replace(/^-/, ""));
  } else if (typeof node === "number" && Number.isInteger(node)) {
    integers.add(String(Math.abs(node)));
  } else if (Array.isArray(node)) {
    node.forEach((n) => collectValues(n, decimals, integers));
  } else if (node && typeof node === "object") {
    Object.values(node).forEach((n) => collectValues(n, decimals, integers));
  }
}

function moneyAmounts(node: unknown, out: string[] = []): string[] {
  if (Array.isArray(node)) node.forEach((n) => moneyAmounts(n, out));
  else if (node && typeof node === "object") {
    const o = node as Record<string, unknown>;
    if (typeof o.amount === "string" && o.currency === "EUR") out.push(o.amount.replace(/^-/, ""));
    else Object.values(o).forEach((n) => moneyAmounts(n, out));
  }
  return out;
}

/**
 * Every figure on a card that must trace to a calculation or an observation: money on the
 * primary value, the rows and the receipt lines, plus the decimals in a receipt's calculation
 * line ("90.16 − 79.90 = 10.26"). Signs are ignored (a shortfall is shown as a negative).
 */
export function cardFigures(card: InsightCard): string[] {
  const figures = moneyAmounts([card.primary, card.rows, card.receipt?.lines]);
  for (const line of card.receipt?.lines ?? []) {
    if (line.key === "calculation" && line.text) {
      for (const m of line.text.matchAll(/-?\d+\.\d{2}/g)) figures.push(m[0].replace(/^-/, ""));
    }
  }
  return figures;
}

export async function verifyResponse(
  response: DomainResponse,
  userRef: string,
  observations: Observation[],
  resolver: UserScopedCalculationResolver,
): Promise<VerificationOutcome> {
  const decimals = new Set<string>();
  const integers = new Set<string>();
  const resolvedCalcIds: string[] = [];

  const cited = new Set<string>([...response.trace.calc_ids, ...response.cards.flatMap((c) => c.basis.calc_ids)]);
  for (const id of cited) {
    const result = await resolver.resolve(userRef, id);
    if (result?.ok) {
      resolvedCalcIds.push(id);
      collectValues(result.result, decimals, integers);
    }
  }
  const observed = new Set<string>();
  for (const o of observations) collectValues(o.items, observed, new Set());
  const exact = new Set([...decimals, ...observed]);
  const rounded = new Set([...decimals].map((d) => roundEuros(d).toString()));

  const unverified: string[] = [];
  let checked = 0;

  // Cards: every money value must match a resolved calculation or an observation,
  // and every cited calc_id must resolve.
  const verifiedCards: InsightCard[] = [];
  const droppedCards: string[] = [];
  for (const card of response.cards) {
    const amounts = cardFigures(card);
    checked += amounts.length;
    const bad = amounts.filter((a) => !exact.has(a));
    const unresolved = card.basis.calc_ids.filter((id) => !resolvedCalcIds.includes(id));
    if (bad.length || unresolved.length) {
      unverified.push(...bad, ...unresolved);
      droppedCards.push(card.card_id);
    } else {
      verifiedCards.push(card);
    }
  }

  // Speech: decimals must match exactly; whole numbers must match a resolved integer,
  // or be an "about N" rounding of a resolved decimal.
  let speechVerified = true;
  const text = response.speech.text;
  for (const m of text.matchAll(/\d+(?:[.,]\d{1,2})?/g)) {
    checked++;
    const raw = m[0];
    const idx = m.index ?? 0;
    if (/[.,]/.test(raw)) {
      const [whole, frac = ""] = raw.split(/[.,]/);
      const norm = `${BigInt(whole!)}.${frac.padEnd(2, "0")}`;
      if (!exact.has(norm)) { speechVerified = false; unverified.push(raw); }
    } else {
      const approx = APPROX.test(text.slice(Math.max(0, idx - 16), idx));
      const ok = integers.has(raw) || (approx && rounded.has(raw)) || exact.has(`${raw}.00`);
      if (!ok) { speechVerified = false; unverified.push(raw); }
    }
  }

  return { speechVerified, verifiedCards, droppedCards, checkedValues: checked, unverified: [...new Set(unverified)], resolvedCalcIds };
}
