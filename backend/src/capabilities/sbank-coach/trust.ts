// Trust gate (DEC-030): deterministic rules that decide whether the coach may give a verdict,
// must add a caveat, must ask, or must abstain. Nothing here calculates money; it only reads
// what the engine and the label reader returned and says what they can't support.
// Also builds the Purchase Receipt (DEC-029) that every answer card carries.
import type { InsightCard, LText, Observation, ToolResult } from "../../contracts.ts";

/** Below this, a camera-read price is never used without the user confirming it. */
export const OCR_MIN_CONFIDENCE = 0.8;
/** Account data older than this gets a caveat… */
export const STALE_CAVEAT_MS = 24 * 60 * 60 * 1000;
/** …and older than this, no verdict at all. */
export const STALE_BLOCK_MS = 7 * 24 * 60 * 60 * 1000;

export interface Reason {
  code: string;
  /** Shown on the receipt. */
  text: LText;
  /** Said out loud when this reason stops the verdict (≤ 25 words, no figures). */
  spoken?: LText;
  blocks: boolean;
}

export type ReceiptT = NonNullable<InsightCard["receipt"]>;
export type ReceiptLineT = ReceiptT["lines"][number];

// ---- Prices read by the camera -------------------------------------------------------------------

export interface PriceReading {
  /** Distinct prices the reader returned, most confident first. */
  candidates: string[];
  /** The reader's confidence for each candidate (same order). */
  confidences: number[];
  /** The observation the most confident price came from. */
  observation?: Observation;
  label?: string;
  /** Confidence of the most confident priced item, 0–1. */
  confidence: number | null;
  /** True when the coach must ask before using any of the candidates. */
  needsCheck: boolean;
  issues: string[];
}

export function readPrice(observations: Observation[]): PriceReading | null {
  const items = observations.flatMap((o) => o.items.map((i) => ({ o, i }))).filter(({ i }) => i.price);
  if (items.length === 0) {
    const unreadable = observations.some((o) => o.kind === "price_label");
    const o = observations.find((x) => x.kind === "price_label");
    return unreadable ? { candidates: [], confidences: [], confidence: null, needsCheck: true, issues: ["PRICE_UNREADABLE"], ...(o ? { observation: o } : {}) } : null;
  }
  items.sort((a, b) => b.i.confidence - a.i.confidence);
  const candidates: string[] = [];
  const confidences: number[] = [];
  for (const { i } of items) {
    if (!candidates.includes(i.price!.amount)) { candidates.push(i.price!.amount); confidences.push(i.confidence); }
  }
  const top = items[0]!;
  const issues = [...new Set(observations.flatMap((o) => o.issues))];
  const needsCheck = observations.some((o) => o.needs_user_check) || candidates.length > 1
    || top.i.confidence < OCR_MIN_CONFIDENCE || issues.includes("PRICE_AMBIGUOUS");
  return { candidates, confidences, label: top.i.label_untrusted, confidence: top.i.confidence, needsCheck, issues, observation: top.o };
}

// ---- Account data --------------------------------------------------------------------------------

const BLOCKING: Record<string, { text: LText; spoken: LText }> = {
  COMMITMENT_UNKNOWN: {
    text: { en: "An upcoming bill isn't accounted for", fi: "Tulevaa laskua ei ole huomioitu" },
    spoken: { en: "I can't confidently say whether this fits, because an upcoming bill hasn't been accounted for.",
              fi: "En voi varmasti sanoa, mahtuuko tämä, koska tulevaa laskua ei ole huomioitu." },
  },
  SOURCE_CONFLICT: {
    text: { en: "Your accounts disagree about how much you have", fi: "Tilisi kertovat eri saldot" },
    spoken: { en: "Your accounts disagree about how much you have, so I won't pick one. The details are on your phone.",
              fi: "Tilisi kertovat eri saldot, joten en valitse niistä kumpaakaan. Tiedot ovat puhelimessa." },
  },
  NO_BALANCE: {
    text: { en: "No balance is available, only spending history", fi: "Saldoa ei ole saatavilla, vain kulutushistoria" },
    spoken: { en: "I can't see your balance, so I won't say whether this fits.",
              fi: "En näe saldoasi, joten en sano, mahtuuko tämä." },
  },
};

export const FINANCE_DATA_MISSING: Reason = {
  code: "FINANCE_DATA_MISSING",
  text: { en: "No account data could be read", fi: "Tilitietoja ei saatu luettua" },
  spoken: { en: "I can't see your money right now, so I won't guess whether this fits.",
            fi: "En näe rahatilannettasi juuri nyt, joten en arvaa, mahtuuko tämä." },
  blocks: true,
};

/**
 * What the account data can and can't support. `source` is the engine's data source;
 * `now` is injectable for tests and the evaluation harness.
 */
export function assessFinance(sts: ToolResult | null, source: string, now = new Date()): Reason[] {
  if (!sts || !sts.ok) return [FINANCE_DATA_MISSING];
  const reasons: Reason[] = [];
  const detail = (d?: string) => (d ? `: ${d}` : "");

  if (sts.data_mode === "pace") {
    reasons.push({ code: "NO_BALANCE", ...BLOCKING.NO_BALANCE!, blocks: true });
  }
  for (const m of sts.missing_data) {
    // No balance blocks a verdict only in pace mode (spending history alone). In budget mode
    // (income and bills, or the user's own weekly amount) a verdict is allowed, with a caveat.
    if (m.code === "NO_BALANCE") {
      if (sts.data_mode !== "pace" && source !== "user_stated") {
        reasons.push({ code: m.code, blocks: false, text: { en: "No balance: estimated from income and bills", fi: "Ei saldoa: arvioitu tuloista ja laskuista" } });
      }
      continue;
    }
    const b = BLOCKING[m.code];
    if (b && !reasons.some((r) => r.code === m.code)) {
      reasons.push({ code: m.code, text: { en: `${b.text.en}${detail(m.detail)}`, fi: `${b.text.fi}${detail(m.detail)}` }, spoken: b.spoken, blocks: true });
    } else if (m.code === "COMMITMENT_ESTIMATED") {
      reasons.push({ code: m.code, blocks: false,
        text: { en: `A bill is estimated, not known${detail(m.detail)}`, fi: `Lasku on arvioitu${detail(m.detail)}` } });
    } else if (m.code !== "BALANCE_STALE" && !b) {
      reasons.push({ code: m.code, blocks: false, text: { en: `Missing data: ${m.code.toLowerCase().replace(/_/g, " ")}${detail(m.detail)}` } });
    }
  }

  // Freshness. A simulated date (the synthetic dataset) is disclosed, not judged as stale.
  if (source === "s_pankki") {
    reasons.push({ code: "SIMULATED_DATE", blocks: false,
      text: { en: "Synthetic dataset on a simulated date", fi: "Synteettinen aineisto, simuloitu päivämäärä" } });
  } else {
    const age = now.getTime() - Date.parse(sts.as_of);
    const days = Math.floor(age / 86_400_000);
    if (age > STALE_BLOCK_MS) {
      reasons.push({ code: "DATA_TOO_OLD", blocks: true,
        text: { en: `Account data is ${days} days old`, fi: `Tilitiedot ovat ${days} päivää vanhoja` },
        spoken: { en: "Your account data is more than a week old, so I won't guess. Refresh it and ask me again.",
                  fi: "Tilitietosi ovat yli viikon vanhoja, joten en arvaa. Päivitä ne ja kysy uudelleen." } });
    } else if (age > STALE_CAVEAT_MS || sts.missing_data.some((m) => m.code === "BALANCE_STALE")) {
      reasons.push({ code: "DATA_STALE", blocks: false,
        text: { en: `Account data is from ${days >= 1 ? `${days} day${days === 1 ? "" : "s"} ago` : "earlier today"}`,
                fi: `Tilitiedot ovat ${days >= 1 ? `${days} päivän takaa` : "aiemmin tänään"}` } });
    }
  }
  if (source === "user_stated") {
    reasons.push({ code: "USER_FIGURE", blocks: false,
      text: { en: "Based on the weekly amount you told me, not your bank", fi: "Perustuu kertomaasi viikkosummaan, ei pankkiin" } });
  }
  if (sts.confidence === "low") {
    reasons.push({ code: "LOW_COVERAGE", blocks: false,
      text: { en: "Little history to estimate bills from", fi: "Laskujen arvioimiseen on vähän historiaa" } });
  }
  for (const w of sts.warnings) reasons.push({ code: "ENGINE_WARNING", blocks: false, text: { en: w } });
  return reasons;
}

export function confidenceState(reasons: Reason[]): ReceiptT["confidence"]["state"] {
  if (reasons.some((r) => r.blocks)) return "abstained";
  return reasons.length ? "caveated" : "confident";
}

export function blockingReason(reasons: Reason[]): Reason | undefined {
  return reasons.find((r) => r.blocks);
}

// ---- The receipt ---------------------------------------------------------------------------------

export function receipt(lines: ReceiptLineT[], reasons: Reason[], freshness: ReceiptT["freshness"]): ReceiptT {
  if (lines.length === 0) throw new Error("a receipt needs at least one line");
  return {
    lines: lines.slice(0, 20) as ReceiptT["lines"],
    confidence: {
      state: confidenceState(reasons),
      reasons: reasons.slice(0, 8).map((r) => ({ code: r.code, text: r.text, blocks_verdict: r.blocks })),
    },
    freshness,
  };
}

/** "91 %" — the reader's own confidence, shown as-is (it's a probability, not money). */
export function percent(p: number): string {
  return `${Math.round(p * 100)} %`;
}
