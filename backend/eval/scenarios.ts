// Evaluation scenarios (DEC-032). Synthetic: fixture finance data and scripted label readings.
// To add one, append an object below; `npm run eval` picks it up.
//
// Each step is one user action, with what the coach should do:
//   answer    a verdict is given (and `safe` says whether it should be "fits"/"fits, but tight")
//   clarify   the coach asks instead of guessing
//   abstain   no verdict, a reason, nothing proposed
//   other     an answer that isn't a verdict (decisions, history)
// plus actions on the platform: tapping confirm/reject, verifying the last receipt (intact or
// tampered), and errors such as CONSENT_REQUIRED or PROPOSAL_EXPIRED.
import type { FixtureScenario } from "../src/capabilities/sbank-coach/fixture-engine.ts";
import type { LabelFixture } from "../src/platform/label-reader.ts";

export type Outcome = "answer" | "clarify" | "abstain" | "other";

export type Step =
  | { say: string; capture?: boolean; expect: { outcome?: Outcome; error?: string; safe?: boolean; verdict?: string; speech?: RegExp; reason?: string } }
  | { tap: "confirm" | "reject"; expect: { status?: string; error?: string } }
  | { verifyLastReceipt: "intact" | "tampered"; expect: { valid: boolean } }
  | { pause: number };

export interface Scenario {
  id: string;
  title: string;
  /** Critical: a wrong "it fits" here could mislead a real decision. Target: zero false-safe answers. */
  critical: boolean;
  setup?: { scenario?: FixtureScenario; labels?: LabelFixture[]; consent?: boolean; proposalTtlMs?: number; locale?: string };
  steps: Step[];
}

const ask = "can I afford this";

export const SCENARIOS: Scenario[] = [
  {
    id: "clear-price-sufficient", title: "Clear price, enough money", critical: false,
    steps: [{ say: ask, capture: true, expect: { outcome: "answer", safe: true, verdict: "Fits, but tight" } }],
  },
  {
    id: "ambiguous-ocr", title: "Ambiguous label: 19.90 or 79.90", critical: true, setup: { labels: ["ambiguous"] },
    steps: [
      { say: ask, capture: true, expect: { outcome: "clarify", speech: /19\.90 or 79\.90/, reason: "PRICE_AMBIGUOUS" } },
      { say: "It's 79.90", expect: { outcome: "answer", safe: true, verdict: "Fits, but tight" } },
    ],
  },
  {
    id: "low-confidence-ocr", title: "Price read with low confidence", critical: true, setup: { labels: ["low_confidence"] },
    steps: [
      { say: ask, capture: true, expect: { outcome: "clarify", reason: "PRICE_UNCERTAIN" } },
      { say: "yes", expect: { outcome: "answer", safe: true } },
    ],
  },
  {
    id: "unreadable-label", title: "No readable price on the label", critical: true, setup: { labels: ["unreadable"] },
    steps: [{ say: ask, capture: true, expect: { outcome: "clarify" } }],
  },
  {
    id: "insufficient-funds", title: "Not enough money before payday", critical: true, setup: { scenario: "insufficient" },
    steps: [{ say: ask, capture: true, expect: { outcome: "answer", safe: false, verdict: "Doesn't fit this week" } }],
  },
  {
    id: "missing-financial-data", title: "No account data", critical: true, setup: { scenario: "missing" },
    steps: [{ say: ask, capture: true, expect: { outcome: "abstain", reason: "FINANCE_DATA_MISSING" } }],
  },
  {
    id: "stale-data", title: "Account data 9 days old", critical: true, setup: { scenario: "stale" },
    steps: [{ say: ask, capture: true, expect: { outcome: "abstain", reason: "DATA_TOO_OLD" } }],
  },
  {
    id: "slightly-stale-data", title: "Account data 2 days old: answer with a warning", critical: false, setup: { scenario: "stale_recent" },
    steps: [{ say: ask, capture: true, expect: { outcome: "answer", safe: true, reason: "DATA_STALE" } }],
  },
  {
    id: "unknown-bill", title: "An upcoming bill isn't known", critical: true, setup: { scenario: "unknown_bill" },
    steps: [{ say: ask, capture: true, expect: { outcome: "abstain", reason: "COMMITMENT_UNKNOWN" } }],
  },
  {
    id: "conflicting-sources", title: "Two accounts disagree", critical: true, setup: { scenario: "conflict" },
    steps: [{ say: ask, capture: true, expect: { outcome: "abstain", reason: "SOURCE_CONFLICT" } }],
  },
  {
    id: "pace-mode", title: "Spending history only, no balance", critical: true, setup: { scenario: "pace" },
    steps: [{ say: ask, capture: true, expect: { outcome: "abstain", reason: "NO_BALANCE" } }],
  },
  {
    id: "planned-spending-recalculates", title: "User plans one in: the next answer recalculates", critical: true, setup: { labels: ["clear", "clear"] },
    steps: [
      { say: ask, capture: true, expect: { outcome: "answer", safe: true } },
      { tap: "confirm", expect: { status: "applied" } },
      { say: ask, capture: true, expect: { outcome: "answer", safe: false, verdict: "Doesn't fit this week" } },
    ],
  },
  {
    id: "receipt-intact", title: "An unmodified receipt verifies", critical: false,
    steps: [
      { say: ask, capture: true, expect: { outcome: "answer", safe: true } },
      { verifyLastReceipt: "intact", expect: { valid: true } },
    ],
  },
  {
    id: "receipt-modified", title: "A modified receipt fails verification", critical: true,
    steps: [
      { say: ask, capture: true, expect: { outcome: "answer", safe: true } },
      { verifyLastReceipt: "tampered", expect: { valid: false } },
    ],
  },
  {
    id: "user-cancels", title: "User taps Not now: the plan is cancelled and can't be applied later", critical: true,
    steps: [
      { say: ask, capture: true, expect: { outcome: "answer", safe: true } },
      { tap: "reject", expect: { status: "rejected_by_user" } },
      { tap: "confirm", expect: { error: "PROPOSAL_ALREADY_DECIDED" } },
    ],
  },
  {
    id: "user-waits", title: "User decides to wait: the offer is withdrawn", critical: true,
    steps: [
      { say: ask, capture: true, expect: { outcome: "answer", safe: true } },
      { say: "I'll wait", expect: { outcome: "other", speech: /Nothing changes/ } },
      // The capability no longer holds the offer, so the platform's apply comes back "failed": nothing is planned.
      { tap: "confirm", expect: { status: "failed" } },
    ],
  },
  {
    id: "consent-declined", title: "No consent: no financial data is touched", critical: true, setup: { consent: false },
    steps: [{ say: "what's safe to spend this week", expect: { error: "CONSENT_REQUIRED" } }],
  },
  {
    id: "expired-confirmation", title: "A confirmation after the proposal expired is rejected", critical: true, setup: { proposalTtlMs: 1 },
    steps: [
      { say: ask, capture: true, expect: { outcome: "answer", safe: true } },
      { pause: 15 },
      { tap: "confirm", expect: { error: "PROPOSAL_EXPIRED" } },
    ],
  },
  {
    id: "finnish-clear", title: "Finnish: clear price", critical: false, setup: { locale: "fi-FI" },
    steps: [{ say: "onko minulla varaa tähän", capture: true, expect: { outcome: "answer", safe: true, verdict: "Mahtuu, mutta tiukasti" } }],
  },
];
