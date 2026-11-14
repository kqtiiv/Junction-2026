// Exact money handling on contract decimal strings ("79.90"), via integer cents.
// Never converts money to a JS number.
import type { Money } from "../contracts.ts";

const DECIMAL = /^(-?)(0|[1-9][0-9]*)\.([0-9]{2})$/;

export function toCents(amount: string): bigint {
  const m = DECIMAL.exec(amount);
  if (!m) throw new Error(`Not a contract decimal string: ${amount}`);
  const cents = BigInt(m[2]!) * 100n + BigInt(m[3]!);
  return m[1] === "-" ? -cents : cents;
}

export function fromCents(cents: bigint): string {
  const neg = cents < 0n;
  const abs = neg ? -cents : cents;
  return `${neg ? "-" : ""}${abs / 100n}.${(abs % 100n).toString().padStart(2, "0")}`;
}

export const eur = (amount: string): Money => ({ amount, currency: "EUR" });

/** Whole euros, rounded half-up away from zero: "10.26" → 10, "90.50" → 91. */
export function roundEuros(amount: string): bigint {
  const c = toCents(amount);
  const abs = c < 0n ? -c : c;
  const whole = (abs + 50n) / 100n;
  return c < 0n ? -whole : whole;
}

/** Formats for speech/text in a locale: fi uses a decimal comma. */
export function formatAmount(amount: string, locale: string): string {
  return locale.startsWith("fi") || locale.startsWith("sv") ? amount.replace(".", ",") : amount;
}

/**
 * Parses an amount the user said or typed ("79.90", "79,90", "€60", "60 euros", "60e").
 * Returns a contract decimal string, or null.
 */
export function parseSpokenAmount(text: string): string | null {
  const m = /(?:€\s*)?(\d{1,6})(?:[.,](\d{1,2}))?\s*(?:€|e\b|eur\b|euros?\b|euroa\b)?/i.exec(
    text.replace(/(\d)\s(?=\d{3}\b)/g, "$1"),
  );
  if (!m) return null;
  const hasCurrency = /€|\beur|\beuro|\d\s*e\b/i.test(m[0]);
  const hasDecimals = m[2] !== undefined;
  if (!hasCurrency && !hasDecimals) return null; // a bare number ("4 days") is not an amount
  const cents = (m[2] ?? "0").padEnd(2, "0");
  return `${BigInt(m[1]!)}.${cents}`;
}

// Number words for answers to "how much?". Round amounts only; anything else is asked again.
const WORDS: Record<string, number> = {
  // English
  ten: 10, twenty: 20, thirty: 30, forty: 40, fifty: 50, sixty: 60, seventy: 70, eighty: 80, ninety: 90,
  "a hundred": 100, "one hundred": 100, hundred: 100, "a hundred and fifty": 150, "one hundred and fifty": 150,
  "two hundred": 200, "two hundred and fifty": 250, "three hundred": 300, "four hundred": 400, "five hundred": 500,
  // Finnish
  kymmenen: 10, kaksikymmentä: 20, kolmekymmentä: 30, neljäkymmentä: 40, viisikymmentä: 50,
  kuusikymmentä: 60, seitsemänkymmentä: 70, kahdeksankymmentä: 80, yhdeksänkymmentä: 90,
  sata: 100, satakuusikymmentä: 160, sataviisikymmentä: 150, kaksisataa: 200, kaksisataaviisikymmentä: 250,
  kolmesataa: 300, neljäsataa: 400, viisisataa: 500,
};

// Words around an amount that don't change it ("about 100 euros a week", "noin sata euroa").
const FILLERS = [
  "i guess", "i think", "let's say", "lets say", "per week", "a week", "this week", "for the week", "until sunday",
  "maybe", "about", "around", "roughly", "approximately", "like", "say", "it's", "its", "is", "to", "be", "should",
  "euros", "euro", "eur",
  "tällä viikolla", "sunnuntaihin asti", "viikossa", "noin", "ehkä", "suunnilleen", "sanotaan", "vaikka", "on", "euroa", "n",
];
const FILLER_RE = new RegExp(`(^|\\s)(${FILLERS.map((f) => f.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|")})(?=\\s|$)`, "g");

/**
 * Parses an answer to "how much do you want to spend until Sunday?". Strict on purpose: after
 * removing filler words, the WHOLE answer must be an amount ("100", "about 100 euros",
 * "noin sata", "80,50 €", "1 000"). Sentences that merely contain a number ("give me 5 minutes",
 * "can I afford 30?") are not answers. Returns a contract decimal string or null.
 */
export function parseBudgetAnswer(text: string): string | null {
  let t = text.toLowerCase().normalize("NFC")
    .replace(/(\d)[\s ](?=\d{3}\b)/g, "$1")      // "1 000" → "1000"
    .replace(/€/g, " ")
    .replace(/(\d)e\b/g, "$1")                          // "80e"
    .replace(/[!?;:]+/g, " ")
    .replace(/[.,](?!\d)/g, " ");                       // sentence punctuation, keeping "80,50"
  let prev;
  do { prev = t; t = t.replace(FILLER_RE, " "); } while (t !== prev);
  t = t.replace(/\s+/g, " ").trim();
  const digits = /^(\d{1,6})(?:[.,](\d{1,2}))?$/.exec(t);
  if (digits) return `${BigInt(digits[1]!)}.${(digits[2] ?? "0").padEnd(2, "0")}`;
  const n = WORDS[t];
  return n === undefined ? null : `${n}.00`;
}
