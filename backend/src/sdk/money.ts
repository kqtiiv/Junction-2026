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
