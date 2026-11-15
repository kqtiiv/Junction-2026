// Evaluation harness (DEC-032): runs every scenario in eval/scenarios.ts against the real
// orchestrator and capability (in process, fixture data), scores each step, and writes
// docs/eval/RESULTS.md and docs/eval/results.json.
//
//   npm run eval            run and write the report
//   npm run eval -- --check also exit non-zero if a critical scenario fails or any answer is false-safe
//
// What it measures is behaviour on synthetic scenarios, not real-world impact.
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import type { InsightCard } from "../src/contracts.ts";
import {
  auth, captureMeta, fakeJpeg, makeApp, newSession, parseSse, uploadCapture, USER, voiceIntent,
} from "../test/helpers.ts";
import { SCENARIOS, type Outcome, type Scenario, type Step } from "./scenarios.ts";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..", "..");

interface StepResult {
  step: string;
  expected: string;
  actual: string;
  pass: boolean;
  falseSafe: boolean;
  /** For steps that expected the coach to hold back: did it? */
  shouldHoldBack?: boolean;
  heldBack?: boolean;
  /** For steps that expected a verdict: did it hold back anyway? */
  overAbstained?: boolean;
  latencyMs?: number;
  verification?: { expectedValid: boolean; valid: boolean };
}

interface ScenarioResult { id: string; title: string; critical: boolean; pass: boolean; steps: StepResult[]; receiptsChecked: number; receiptsValid: number }

const verdictOf = (cards: InsightCard[]) => cards.flatMap((c) => c.rows ?? []).find((r) => r.label.en === "Verdict" || r.label.fi === "Arvio")?.value;
const SAFE_VERDICTS = new Set(["Fits", "Fits, but tight", "Mahtuu", "Mahtuu, mutta tiukasti"]);

/** Judged on what the user got (a verdict, a question, nothing), not on what the receipt says about itself. */
function outcomeOf(status: string, cards: InsightCard[], proposals: number): Outcome {
  const v = verdictOf(cards);
  const gaveVerdict = (typeof v === "string" && v !== "Not given" && v !== "Ei annettu") || proposals > 0;
  if (gaveVerdict) return "answer";
  if (status === "clarify") return "clarify";
  if (status === "partial" || cards.some((c) => c.receipt?.confidence.state === "abstained")) return "abstain";
  return "other";
}

function describe(step: Step): string {
  if ("say" in step) return `say “${step.say}”${step.capture ? " + photo" : ""}`;
  if ("tap" in step) return `tap ${step.tap}`;
  if ("verifyLastReceipt" in step) return `verify ${step.verifyLastReceipt} receipt`;
  return `pause ${step.pause} ms`;
}

async function runScenario(sc: Scenario): Promise<ScenarioResult> {
  const a = makeApp({
    ...(sc.setup?.scenario ? { scenario: sc.setup.scenario } : {}),
    ...(sc.setup?.labels ? { labels: sc.setup.labels } : {}),
    ...(sc.setup?.proposalTtlMs ? { proposalTtlMs: sc.setup.proposalTtlMs } : {}),
  });
  const s = await newSession(a.app, sc.setup?.locale ?? "en-FI", { consent: sc.setup?.consent ?? true });
  const results: StepResult[] = [];
  let lastProposal: string | undefined;
  let lastReceiptCard: InsightCard | undefined;
  let receiptsChecked = 0;
  let receiptsValid = 0;

  for (const step of sc.steps) {
    if ("pause" in step) { await new Promise((r) => setTimeout(r, step.pause)); continue; }

    if ("say" in step) {
      const ids: string[] = [];
      if (step.capture && s.consent_grant_id) {
        const cap = (await uploadCapture(a.app, fakeJpeg(), captureMeta(s.session_id, s.consent_grant_id))).json();
        ids.push(cap.capture_id);
      }
      const lang = sc.setup?.locale ?? "en-FI";
      const intent = voiceIntent(s.session_id, step.say, { attached_capture_ids: ids });
      intent.transcript = { ...intent.transcript!, lang };
      const t0 = performance.now();
      const res = await a.app.inject({ method: "POST", url: "/v1/turns", headers: auth, payload: intent });
      const latencyMs = Math.round((performance.now() - t0) * 10) / 10;
      const events = parseSse(res.body);
      const err = events.find((e) => e.event === "error")?.data as { code?: string } | undefined;
      const final = events.find((e) => e.event === "final")?.data as { response?: { status: string; cards: InsightCard[]; proposals: { proposal_id: string }[]; speech: { text: string } } } | undefined;
      const r = final?.response;

      if (step.expect.error) {
        const actual = err?.code ?? (r ? `final:${r.status}` : "nothing");
        // Consent declined: the engine must not have been asked for anything.
        const touched = step.expect.error === "CONSENT_REQUIRED" ? (await a.engine.resolve(USER, "calc_sts_91")) !== null : false;
        results.push({ step: describe(step), expected: `error ${step.expect.error}`, actual: touched ? `${actual} (data touched!)` : actual,
          pass: actual === step.expect.error && !touched, falseSafe: false, latencyMs });
        continue;
      }
      if (!r) {
        results.push({ step: describe(step), expected: step.expect.outcome ?? "?", actual: `error ${err?.code ?? "none"}`, pass: false, falseSafe: false, latencyMs });
        continue;
      }
      lastProposal = r.proposals[0]?.proposal_id ?? lastProposal;
      const signed = r.cards.find((c) => c.receipt?.verification);
      if (signed) lastReceiptCard = signed;
      // Every receipt produced is verified independently, not just the ones a step asks about.
      for (const c of r.cards.filter((x) => x.receipt?.verification)) {
        receiptsChecked += 1;
        const v = (await a.app.inject({ method: "POST", url: "/v1/receipts/verify", headers: auth, payload: { card: c } })).json();
        if (v.valid) receiptsValid += 1;
      }

      const outcome = outcomeOf(r.status, r.cards, r.proposals.length);
      const verdict = verdictOf(r.cards);
      const claimsSafe = (typeof verdict === "string" && SAFE_VERDICTS.has(verdict)) || r.proposals.length > 0;
      const e = step.expect;
      const holdBack = e.outcome === "clarify" || e.outcome === "abstain";
      const reasons = r.cards.flatMap((c) => c.receipt?.confidence.reasons.map((x) => x.code) ?? []);
      const checks = [
        e.outcome === undefined || outcome === e.outcome,
        e.safe === undefined || claimsSafe === e.safe,
        e.verdict === undefined || verdict === e.verdict,
        e.speech === undefined || e.speech.test(r.speech.text),
        e.reason === undefined || reasons.includes(e.reason),
      ];
      results.push({
        step: describe(step),
        expected: [e.outcome, e.verdict ?? (e.safe === undefined ? "" : e.safe ? "safe" : "not safe"), e.reason].filter(Boolean).join(" · "),
        actual: [outcome, typeof verdict === "string" ? verdict : "", reasons.filter((x) => x === e.reason).join("")].filter(Boolean).join(" · "),
        // False-safe: the coach said it fits (or offered to plan it) when it should not have. Always a failure.
        falseSafe: claimsSafe && (holdBack || e.safe === false),
        pass: checks.every(Boolean) && !(claimsSafe && (holdBack || e.safe === false)),
        ...(holdBack ? { shouldHoldBack: true, heldBack: outcome === "clarify" || outcome === "abstain" } : {}),
        ...(e.outcome === "answer" ? { overAbstained: outcome === "clarify" || outcome === "abstain" } : {}),
        latencyMs,
      });
      continue;
    }

    if ("tap" in step) {
      const res = await a.app.inject({ method: "POST", url: "/v1/confirmations", headers: auth,
        payload: { proposal_id: lastProposal ?? "none", decision: step.tap, channel: "phone_tap", evidence: { ui_event_id: "eval" } } });
      const body = res.json() as { status?: string; code?: string };
      const actual = body.status ?? body.code ?? String(res.statusCode);
      const expected = step.expect.status ?? step.expect.error ?? "";
      results.push({ step: describe(step), expected, actual, pass: actual === expected,
        falseSafe: body.status === "applied" && step.expect.status !== "applied" });
      continue;
    }

    // verifyLastReceipt
    if (!lastReceiptCard) {
      results.push({ step: describe(step), expected: "a receipt", actual: "none", pass: false, falseSafe: false });
      continue;
    }
    const card = structuredClone(lastReceiptCard);
    if (step.verifyLastReceipt === "tampered") {
      const rem = card.receipt!.lines.find((l) => l.key === "remaining" && l.money);
      if (rem?.money) rem.money = { ...rem.money, amount: "40.26" };
    }
    const v = (await a.app.inject({ method: "POST", url: "/v1/receipts/verify", headers: auth, payload: { card } })).json() as { valid: boolean };
    results.push({ step: describe(step), expected: step.expect.valid ? "valid" : "invalid", actual: v.valid ? "valid" : "invalid",
      pass: v.valid === step.expect.valid, falseSafe: false, verification: { expectedValid: step.expect.valid, valid: v.valid } });
  }
  return { id: sc.id, title: sc.title, critical: sc.critical, pass: results.every((r) => r.pass), steps: results, receiptsChecked, receiptsValid };
}

const pct = (n: number, d: number) => (d === 0 ? "n/a" : `${((100 * n) / d).toFixed(1)} %`);
const quantile = (xs: number[], q: number) => {
  if (!xs.length) return 0;
  const s = [...xs].sort((a, b) => a - b);
  return s[Math.min(s.length - 1, Math.floor(q * s.length))]!;
};

async function main() {
  const check = process.argv.includes("--check");
  const started = new Date();
  const results: ScenarioResult[] = [];
  for (const sc of SCENARIOS) results.push(await runScenario(sc));

  const steps = results.flatMap((r) => r.steps.map((s) => ({ ...s, critical: r.critical })));
  const verdictSteps = steps.filter((s) => s.shouldHoldBack !== undefined || s.overAbstained !== undefined);
  const holdBack = steps.filter((s) => s.shouldHoldBack);
  const answers = steps.filter((s) => s.overAbstained !== undefined);
  const tamper = steps.filter((s) => s.verification);
  const latencies = steps.map((s) => s.latencyMs).filter((x): x is number => typeof x === "number");
  const receiptsChecked = results.reduce((n, r) => n + r.receiptsChecked, 0);
  const receiptsValid = results.reduce((n, r) => n + r.receiptsValid, 0);

  const metrics = {
    scenarios: results.length,
    scenarios_passed: results.filter((r) => r.pass).length,
    critical_scenarios: results.filter((r) => r.critical).length,
    critical_passed: results.filter((r) => r.critical && r.pass).length,
    false_safe_answers: steps.filter((s) => s.falseSafe).length,
    false_safe_answers_critical: steps.filter((s) => s.falseSafe && s.critical).length,
    hold_back_expected: holdBack.length,
    appropriate_abstention_rate: holdBack.length ? holdBack.filter((s) => s.heldBack).length / holdBack.length : null,
    missed_abstentions: holdBack.filter((s) => !s.heldBack).length,
    unnecessary_abstentions: answers.filter((s) => s.overAbstained).length,
    incorrect_confidence_rate: verdictSteps.length
      ? (holdBack.filter((s) => !s.heldBack).length + answers.filter((s) => s.overAbstained).length) / verdictSteps.length : null,
    receipts_verified: receiptsValid,
    receipts_checked: receiptsChecked,
    tamper_checks: tamper.length,
    tamper_checks_correct: tamper.filter((s) => s.verification!.valid === s.verification!.expectedValid).length,
    completion_rate: results.filter((r) => r.pass).length / results.length,
    latency_ms: { p50: quantile(latencies, 0.5), p95: quantile(latencies, 0.95), max: Math.max(...latencies), turns: latencies.length },
    ocr_accuracy: null as number | null,
  };

  const json = { generated_at: started.toISOString(), node: process.version, data: "synthetic (fixture finance data, scripted label readings)", metrics, results };
  const md = [
    "# Evaluation results",
    "",
    `Generated by \`cd backend && npm run eval\` on ${started.toISOString()} (Node ${process.version}).`,
    "Scenarios are in [`backend/eval/scenarios.ts`](../../backend/eval/scenarios.ts); the runner is [`backend/eval/run.ts`](../../backend/eval/run.ts) (DEC-032).",
    "",
    "> **What this is:** the real orchestrator and money-coach capability, run in process on **synthetic** fixture data and scripted label readings. It measures how the system behaves in these scenarios. It is not a measurement of real-world use, real OCR, or real savings.",
    "",
    "## Summary",
    "",
    "| Metric | Result | Target |",
    "|---|---|---|",
    `| False-safe answers (said it fits, or offered to plan it, when it shouldn't) | **${metrics.false_safe_answers}** (critical set: ${metrics.false_safe_answers_critical}) | 0 |`,
    `| Critical scenarios passed | ${metrics.critical_passed} / ${metrics.critical_scenarios} | all |`,
    `| All scenarios passed (completion rate) | ${metrics.scenarios_passed} / ${metrics.scenarios} (${pct(metrics.scenarios_passed, metrics.scenarios)}) | all |`,
    `| Appropriate abstention rate (asked or held back when it should) | ${pct(holdBack.filter((s) => s.heldBack).length, holdBack.length)} (${holdBack.length} steps) | 100 % |`,
    `| Missed abstentions / unnecessary abstentions | ${metrics.missed_abstentions} / ${metrics.unnecessary_abstentions} | 0 / 0 |`,
    `| Incorrect confidence rate | ${metrics.incorrect_confidence_rate === null ? "n/a" : pct(metrics.incorrect_confidence_rate * verdictSteps.length, verdictSteps.length)} | 0 % |`,
    `| Receipts that verified independently (\`POST /v1/receipts/verify\`) | ${receiptsValid} / ${receiptsChecked} | all |`,
    `| Tamper checks answered correctly | ${metrics.tamper_checks_correct} / ${metrics.tamper_checks} | all |`,
    `| Turn latency, in process (p50 / p95 / max) | ${metrics.latency_ms.p50} / ${metrics.latency_ms.p95} / ${metrics.latency_ms.max} ms over ${metrics.latency_ms.turns} turns | — |`,
    "| OCR accuracy against labelled images | **Not measured.** The label reader is a fixture; there is no OCR model to measure yet. | — |",
    "| User correction rate | Not measured here: needs real users. The app counts corrections per session (“Your decisions” card). | — |",
    "",
    "Latency is the orchestrator and capability only: no network, speech recognition, text-to-speech or glasses transfer.",
    "",
    "## Scenarios",
    "",
    "| Scenario | Critical | Step | Expected | Actual | Pass |",
    "|---|---|---|---|---|---|",
    ...results.flatMap((r) => r.steps.map((s, i) =>
      `| ${i === 0 ? `**${r.title}** (\`${r.id}\`)` : ""} | ${i === 0 ? (r.critical ? "yes" : "") : ""} | ${s.step} | ${s.expected} | ${s.actual}${s.falseSafe ? " ⚠ false-safe" : ""} | ${s.pass ? "✓" : "✗"} |`)),
    "",
    "## How to add a scenario",
    "",
    "Append an object to `SCENARIOS` in `backend/eval/scenarios.ts`: a fixture scenario (`insufficient`, `stale`, `stale_recent`, `unknown_bill`, `conflict`, `missing`, `pace`), label readings (`clear`, `ambiguous`, `low_confidence`, `unreadable`), and steps with what the coach should do. Then run `npm run eval`.",
    "",
  ].join("\n");

  const outDir = join(ROOT, "docs", "eval");
  mkdirSync(outDir, { recursive: true });
  writeFileSync(join(outDir, "RESULTS.md"), md);
  writeFileSync(join(outDir, "results.json"), JSON.stringify(json, (_k, v) => (v instanceof RegExp ? String(v) : v), 2) + "\n");

  console.log(`Scenarios ${metrics.scenarios_passed}/${metrics.scenarios} · critical ${metrics.critical_passed}/${metrics.critical_scenarios} · false-safe ${metrics.false_safe_answers} · receipts ${receiptsValid}/${receiptsChecked} · p50 ${metrics.latency_ms.p50} ms`);
  for (const r of results.filter((x) => !x.pass)) {
    console.log(`✗ ${r.id}: ${r.steps.filter((s) => !s.pass).map((s) => `${s.step} → expected ${s.expected}, got ${s.actual}`).join("; ")}`);
  }
  console.log("Wrote docs/eval/RESULTS.md and docs/eval/results.json");
  if (check && (metrics.false_safe_answers > 0 || metrics.critical_passed < metrics.critical_scenarios)) process.exit(1);
}

await main();
