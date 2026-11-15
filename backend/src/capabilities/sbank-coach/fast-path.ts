// Deterministic fast path (L5): intent → finance tool → template. No model involved.
// Serves as the offline/degraded mode, the demo fallback and the evaluation baseline.
import { randomUUID, type KeyObject } from "node:crypto";
import type {
  ActionProposal, ActionResult, DomainRequest, DomainResponse, InsightCard, LText, Observation, ToolResult, UserConfirmation,
} from "../../contracts.ts";
import { payloadHash, verifyJws } from "../../crypto.ts";
import { formatAmount, parseBudgetAnswer, parseSpokenAmount, roundEuros, toCents } from "../../sdk/money.ts";
import type { AgentBackend } from "./backend.ts";
import type { FinanceEngine } from "./finance-engine.ts";
import { CoachCalcs, DecisionMemory, type Decision } from "./decisions.ts";
import {
  assessFinance, blockingReason, FINANCE_DATA_MISSING, OCR_MIN_CONFIDENCE, percent, readPrice, receipt,
  type PriceReading, type Reason, type ReceiptLineT,
} from "./trust.ts";

export const CAPABILITY_ID = "sbank.coach";
const PROPOSAL_TTL_MS = 10 * 60 * 1000;
const PLAN_CHANNELS: ActionProposal["confirm_channels"] = ["phone_tap", "glasses_gesture", "voice_readback"];
/** How long the coach waits for the answer to its one question. */
const PENDING_TTL_MS = 10 * 60 * 1000;

type Intent =
  | { kind: "safe_to_spend" }
  | { kind: "affordability"; amount: string | null; source: "stated_amount" | "observation"; observation?: Observation; label?: string }
  | { kind: "price_check_needed"; reading: PriceReading }
  | { kind: "decide"; decision: "waiting" | "skipped" }
  | { kind: "history" }
  | { kind: "forget" }
  | { kind: "set_budget"; amount: string }
  | { kind: "unsupported" };

/** The original question, kept while the coach waits for the user's weekly amount. */
interface Pending {
  intent: "safe_to_spend" | "affordability";
  utterance: string | null;
  observations: Observation[];
  amount?: string;
  source?: "stated_amount" | "observation";
  /** The observation the price came from (not just the first one attached). */
  observation?: Observation;
  label?: string;
  askedAt: number;
  retries: number;
}

const AFFORD = /\b(afford|fits?\b.*\b(week|budget)|fit this|can i buy)\b|mahtuu|varaa|budjettiin|har jag råd/i;
const SAFE = /\b(safe to spend|how much can i spend|left to spend|spend this week|my week)\b|paljonko voin käyttää|käyttövara|paljonko minulla on käytettävissä/i;

// Explicit budget phrasing only: "my budget this week is 80", "set my budget to 80", "budjettini on 80".
// (Not "I have…" / "minulla on…": those start ordinary questions.)
const SET_BUDGET = /\b(my (weekly )?budget|weekly budget|set (my )?budget|budget for (this|the) week)\b|budjettini|viikkobudjetti|viikkobudjettini/i;

const ASK_AMOUNT = { en: "How much do you want to spend until Sunday?", fi: "Paljonko haluat käyttää sunnuntaihin asti?" };

// Decisions about the last thing asked about, and the memory of them (DEC-031).
const WAIT = /^(ok(ay)?,?\s*)?(i'?ll|i will|let me|i'?d rather)?\s*(wait|think about it|sleep on it|decide later)\b|\bodotan\b|\bmietin vielä\b/i;
const SKIP = /\b(skip( it| this)?|i'?ll pass|leave it|i don'?t need it|not buying( it)?)\b|jätän väliin|en osta/i;
const HISTORY = /\b(my decisions|what (have|did) i decide(d)?|how am i doing|my (impact|history))\b|päätökseni|miten minulla menee/i;
const FORGET = /\b(forget|delete|clear|erase) (all )?(my )?(decisions|history|memory)\b|unohda päätökseni|poista päätökseni/i;

export function classify(utterance: string | null, observations: Observation[]): Intent {
  const text = utterance ?? "";
  if (FORGET.test(text)) return { kind: "forget" };
  if (HISTORY.test(text)) return { kind: "history" };
  if (SET_BUDGET.test(text) && !AFFORD.test(text) && !SAFE.test(text)) {
    const amount = parseBudgetAnswer(text.replace(SET_BUDGET, " "));
    if (amount) return { kind: "set_budget", amount };
  }
  const reading = readPrice(observations);
  if (AFFORD.test(text) || (reading && reading.candidates.length > 0 && /\b(this|it|these)\b|tämä|se\b/i.test(text))) {
    if (reading) {
      // Trust gate (DEC-030): an unclear label is never guessed.
      if (reading.needsCheck) return { kind: "price_check_needed", reading };
      return { kind: "affordability", amount: reading.candidates[0]!, source: "observation", observation: reading.observation!, label: reading.label };
    }
    return { kind: "affordability", amount: parseSpokenAmount(text), source: "stated_amount" };
  }
  if (SAFE.test(text)) return { kind: "safe_to_spend" };
  if (SKIP.test(text)) return { kind: "decide", decision: "skipped" };
  if (WAIT.test(text.trim())) return { kind: "decide", decision: "waiting" };
  return { kind: "unsupported" };
}

const isFi = (locale: string) => locale.startsWith("fi");
const pick = (locale: string, t: { en: string; fi: string }) => (isFi(locale) ? t.fi : t.en);
/**
 * Untrusted label text: strip control characters, cap the length, and turn shelf-label
 * capitals into sentence case ("LANGATTOMAT KUULOKKEET" → "Langattomat kuulokkeet"). Never spoken.
 */
const safeLabel = (s: string | undefined) => {
  const t = (s ?? "").replace(/[\u0000-\u001f\u007f]/g, " ").replace(/\s+/g, " ").trim().slice(0, 40);
  return t === t.toUpperCase() && /\p{L}/u.test(t) ? t.charAt(0) + t.slice(1).toLowerCase() : t;
};

/**
 * An answer about a price label is titled with the item, so the card is about the purchase in
 * front of the user, not a generic budget question (DEC-028). Falls back when there is no label.
 */
const itemTitle = (source: "stated_amount" | "observation", label: string | undefined, fallback: LText): LText => {
  const t = source === "observation" ? safeLabel(label) : "";
  return t ? { en: t, fi: t } : fallback;
};

type Money = { amount: string; currency: "EUR" };

/** Where a price came from: read by the camera, read and then confirmed by the user, or said by the user. */
type PriceOrigin = "camera" | "camera_confirmed" | "user";

/** The last answer per session, so "I'll wait" / "skip it" know what they refer to. */
interface LastAnswer { label: string; amount: string; calcId: string; proposalId?: string; payday: boolean; askedAt: number }

const say = (locale: string, t: LText) => (isFi(locale) && t.fi ? t.fi : t.en ?? "");

const decideFollowups: LText[] = [{ en: "I'll wait", fi: "Odotan" }, { en: "Skip it", fi: "Jätän väliin" }];

function priceRow(origin: PriceOrigin, amount: string): NonNullable<InsightCard["rows"]>[number] {
  const value = { amount, currency: "EUR" as const };
  if (origin === "camera") {
    return { label: { en: "Price on the label", fi: "Hintalapun hinta" }, value, epistemic: "observed",
      note: { en: "Read by the camera. Tap to correct.", fi: "Kameran lukema. Korjaa napauttamalla." } };
  }
  if (origin === "camera_confirmed") {
    return { label: { en: "Price you confirmed", fi: "Vahvistamasi hinta" }, value, epistemic: "fact",
      note: { en: "The label was unclear, so you told me", fi: "Hintalappu oli epäselvä, joten kerroit sen" } };
  }
  return { label: { en: "Amount you asked about", fi: "Kysymäsi summa" }, value, epistemic: "fact", note: { en: "As you said", fi: "Kuten sanoit" } };
}

/** Receipt lines for the item: product, price (with currency and source), and how sure the reading was. */
function priceLines(origin: PriceOrigin, amount: string, observation?: Observation, label?: string): ReceiptLineT[] {
  const lines: ReceiptLineT[] = [];
  const ref = observation?.observation_id;
  const name = safeLabel(label);
  if (name && origin !== "user") {
    lines.push({ key: "product", label: { en: "Product", fi: "Tuote" }, text: name, epistemic: "observed", source: "camera",
      ...(ref ? { ref } : {}), note: { en: "Read from the shelf label", fi: "Luettu hintalapusta" } });
  }
  lines.push({
    key: "price", label: { en: "Price", fi: "Hinta" }, money: { amount, currency: "EUR" },
    epistemic: origin === "camera" ? "observed" : "fact", source: origin === "camera" ? "camera" : "user", ...(ref ? { ref } : {}),
    note: origin === "camera" ? { en: "EUR, read by the camera", fi: "EUR, kameran lukema" }
      : origin === "camera_confirmed" ? { en: "EUR, confirmed by you after an unclear reading", fi: "EUR, vahvistit epäselvän lukeman" }
      : { en: "EUR, as you said", fi: "EUR, kuten sanoit" },
  });
  const item = observation?.items.find((i) => i.price?.amount === amount) ?? observation?.items[0];
  if (item) {
    lines.push({ key: "ocr_confidence", label: { en: "Label reading", fi: "Hintalapun luenta" }, text: `${percent(item.confidence)} sure`,
      epistemic: "observed", source: "camera", ...(ref ? { ref } : {}),
      note: origin === "camera"
        ? { en: `Used because it's above ${percent(OCR_MIN_CONFIDENCE)}`, fi: `Käytetty, koska yli ${percent(OCR_MIN_CONFIDENCE)}` }
        : { en: "Not sure enough to use without asking you", fi: "Ei tarpeeksi varma käytettäväksi kysymättä" } });
  }
  return lines;
}

const RESERVED: Record<string, LText> = {
  regular_bills_still_due: { en: "Bills still due before payday", fi: "Maksamattomat laskut ennen palkkapäivää" },
  irregular_reserve: { en: "Reserve for surprise costs", fi: "Varaus yllättäviin menoihin" },
  savings: { en: "Savings you usually move", fi: "Tavalliset säästösiirrot" },
  cushion: { en: "Safety cushion", fi: "Turvapuskuri" },
};

/** The bills and commitments the engine took off before saying what's free. */
function commitmentLines(sts: ToolResult): ReceiptLineT[] {
  const ref = sts.calc_id as string;
  const r = sts.result as { reserved?: Record<string, Money>; flexible_until_payday?: Money; planned_this_week?: Money; planned_total?: Money };
  const lines: ReceiptLineT[] = [];
  for (const [k, v] of Object.entries(r.reserved ?? {})) {
    const human = k.replace(/_/g, " ");
    lines.push({ key: "commitment", label: RESERVED[k] ?? { en: human.charAt(0).toUpperCase() + human.slice(1) }, money: v,
      epistemic: "estimate", source: "engine", ref });
  }
  if (r.flexible_until_payday && !r.reserved) {
    lines.push({ key: "commitment", label: { en: "Flexible money until payday, after bills", fi: "Joustovara palkkapäivään laskujen jälkeen" },
      money: r.flexible_until_payday, epistemic: "estimate", source: "engine", ref });
  }
  for (const m of sts.missing_data.filter((x) => x.code === "COMMITMENT_ESTIMATED")) {
    lines.push({ key: "commitment", label: { en: "Bill estimated", fi: "Arvioitu lasku" }, text: m.detail ?? "A bill", epistemic: "estimate", source: "engine", ref,
      note: { en: "Estimated from earlier months, not a known amount", fi: "Arvioitu aiemmista kuukausista" } });
  }
  const planned = r.planned_this_week ?? r.planned_total;
  if (planned && toCents(planned.amount) > 0n) {
    lines.push({ key: "planned", label: { en: "Already planned", fi: "Jo suunniteltu" }, money: planned, epistemic: "calculated", source: "engine", ref });
  }
  return lines;
}

/** What's available before buying: this week's safe-to-spend, or what's free until payday. */
function availableOf(sts: ToolResult): { label: LText; money: Money } | undefined {
  const r = sts.result as { safe_to_spend_week?: Money; free_until_payday?: Money };
  if (r.free_until_payday && sts.tool === "finance.get_safe_to_spend_until_payday") {
    return { label: { en: "Free until payday", fi: "Vapaana palkkapäivään asti" }, money: r.free_until_payday };
  }
  if (r.safe_to_spend_week) return { label: { en: "Safe to spend until Sunday", fi: "Turvallisesti käytettävissä sunnuntaihin" }, money: r.safe_to_spend_week };
  return undefined;
}

/**
 * Buy now / wait / skip (DEC-031). Every figure is an engine output already on the receipt;
 * nothing here predicts that waiting improves anything.
 */
function optionsCard(result: ToolResult, sts: ToolResult, kind: "estimate" | "calculated",
  o: { buy: { value: Money; note: LText }; wait: LText; skip: { value: Money; note: LText } }, observation?: Observation): InsightCard {
  return {
    schema: "platform.insight_card/v1",
    card_id: `card_options_${result.calc_id}`,
    capability_id: CAPABILITY_ID,
    type: "comparison",
    title: { en: "Your options", fi: "Vaihtoehtosi" },
    rows: [
      { label: { en: "Buy now", fi: "Osta nyt" }, value: o.buy.value, epistemic: kind, note: o.buy.note },
      { label: { en: "Wait", fi: "Odota" }, value: "No change today", epistemic: "fact", note: o.wait },
      { label: { en: "Skip", fi: "Jätä väliin" }, value: o.skip.value, epistemic: kind, note: o.skip.note },
    ],
    epistemic: kind,
    ...(result.data_mode ? { data_mode: result.data_mode } : {}),
    basis: {
      calc_ids: [result.calc_id as string, sts.calc_id as string],
      ...(observation ? { observation_ids: [observation.observation_id] } : {}),
      as_of: result.as_of,
    },
    assumptions: [{ en: "No option is a recommendation. Waiting doesn't change your money by itself.", fi: "Mikään vaihtoehto ei ole suositus. Odottaminen ei itsessään muuta rahatilannettasi." }],
    missing_data: [],
  };
}

export class DeterministicFastPath implements AgentBackend {
  readonly id = "fast_path@1";
  readonly mock: boolean;
  private readonly payloads = new Map<string, { userRef: string; hash: string; payload: { kind: string; label: string; amount: string }; calcId?: string }>();
  private readonly pending = new Map<string, Pending>();
  /** Unclear labels waiting for the user to say the price (DEC-030). */
  private readonly priceChecks = new Map<string, { reading: PriceReading; askedAt: number; retries: number }>();
  /** The last answer per session, for "I'll wait" / "skip it" (DEC-031). */
  private readonly last = new Map<string, LastAnswer>();
  /** Purchase memory and trust counters (DEC-031). */
  readonly memory = new DecisionMemory();
  /** The coach's own derived calculations, resolvable by the verifier. */
  readonly coachCalcs = new CoachCalcs();
  private readonly now: () => Date;
  private readonly proposalTtlMs: number;

  constructor(private readonly engine: FinanceEngine, private readonly platformPublicKey: KeyObject,
    opts: { now?: () => Date; proposalTtlMs?: number } = {}) {
    this.mock = engine.mock;
    this.now = opts.now ?? (() => new Date());
    this.proposalTtlMs = opts.proposalTtlMs ?? PROPOSAL_TTL_MS;
  }

  private static key(req: DomainRequest): string {
    return `${req.user_ref}:${req.session_id}`;
  }

  /** Drops questions nobody answered, so abandoned sessions don't pile up in memory. */
  private sweepPending(now = Date.now()): void {
    for (const [k, p] of this.pending) if (now - p.askedAt > PENDING_TTL_MS) this.pending.delete(k);
    for (const [k, p] of this.priceChecks) if (now - p.askedAt > PENDING_TTL_MS) this.priceChecks.delete(k);
    for (const [k, p] of this.last) if (now - p.askedAt > PENDING_TTL_MS) this.last.delete(k);
  }

  supports(req: DomainRequest): boolean {
    if (this.engine.stated && this.pending.has(DeterministicFastPath.key(req))) return true;   // an answer to our question
    if (this.priceChecks.has(DeterministicFastPath.key(req))) return true;
    const kind = classify(req.utterance, req.observations).kind;
    if (kind === "set_budget") return this.engine.stated !== undefined;
    return kind !== "unsupported";
  }

  async healthy(): Promise<boolean> { return true; }

  /** Asks the one question and remembers what it was for. */
  private askForWeeklyAmount(req: DomainRequest, spec: Omit<Pending, "askedAt" | "retries" | "utterance" | "observations">): DomainResponse {
    this.pending.set(DeterministicFastPath.key(req), {
      ...spec, utterance: req.utterance, observations: req.observations, askedAt: Date.now(), retries: 0,
    });
    return this.reply(req, "clarify", pick(req.locale, ASK_AMOUNT), "fact");
  }

  async turn(req: DomainRequest): Promise<DomainResponse> {
    const l = req.locale;
    const key = DeterministicFastPath.key(req);
    this.sweepPending();
    const intent = classify(req.utterance, req.observations);

    // The coach asked which price the label shows (DEC-030) and is waiting for the answer.
    const pc = this.priceChecks.get(key);
    if (pc) {
      if (intent.kind === "unsupported") {
        const u = (req.utterance ?? "").trim();
        const yes = /^(yes|yeah|yep|right|correct|that's right|kyllä|joo|juu)\b/i.test(u);
        const amount = parseSpokenAmount(u) ?? (yes && pc.reading.candidates.length === 1 ? pc.reading.candidates[0]! : null);
        if (amount) {
          this.priceChecks.delete(key);
          if (pc.reading.candidates.length && amount !== pc.reading.candidates[0]) this.memory.count(req.user_ref, "priceCorrections");
          return this.affordability(req, amount, "stated_amount", pc.reading.observation, pc.reading.label);
        }
        if (pc.retries < 1) {
          pc.retries += 1;
          return this.reply(req, "clarify", pick(l, { en: "Sorry, what's the price on the label?", fi: "Anteeksi, mikä hintalapun hinta on?" }), "fact");
        }
        this.priceChecks.delete(key);   // never guess: drop the question
        return this.reply(req, "answered", pick(l, { en: "No problem. Ask me again any time.", fi: "Ei haittaa. Kysy uudelleen milloin vain." }), "fact");
      }
      this.priceChecks.delete(key);   // they moved on
    }

    // The coach asked "how much until Sunday?" and is waiting for the answer.
    const p = this.engine.stated ? this.pending.get(key) : undefined;
    if (p && this.engine.stated) {
      const isNewQuestion = intent.kind !== "unsupported" && intent.kind !== "set_budget";
      const amount = intent.kind === "set_budget" ? intent.amount : isNewQuestion ? null : parseBudgetAnswer(req.utterance ?? "");
      if (amount) {
        this.pending.delete(key);
        this.engine.stated.set(req.user_ref, amount);
        const original: DomainRequest = { ...req, utterance: p.utterance, observations: p.observations };
        return p.intent === "safe_to_spend"
          ? this.safeToSpend(original, amount)
          : this.affordability(original, p.amount!, p.source!, p.observation, p.label, amount);
      }
      if (!isNewQuestion && p.retries < 1) {
        p.retries += 1;
        return this.reply(req, "clarify", pick(l, { en: "Sorry, how many euros until Sunday?", fi: "Anteeksi, montako euroa sunnuntaihin asti?" }), "fact");
      }
      this.pending.delete(key);   // they moved on, or didn't know: drop the question, never guess
      if (!isNewQuestion) {
        return this.reply(req, "answered", pick(l, { en: "No problem. Ask me again any time.", fi: "Ei haittaa. Kysy uudelleen milloin vain." }), "fact");
      }
    }

    // No bank data and no weekly amount yet: ask once, at the moment it matters.
    if (this.engine.stated && !this.engine.stated.has(req.user_ref)) {
      if (intent.kind === "safe_to_spend") return this.askForWeeklyAmount(req, { intent: "safe_to_spend" });
      if (intent.kind === "affordability" && intent.amount) {
        return this.askForWeeklyAmount(req, {
          intent: "affordability", amount: intent.amount, source: intent.source,
          ...(intent.observation ? { observation: intent.observation } : {}),
          ...(intent.label ? { label: intent.label } : {}),
        });
      }
    }

    switch (intent.kind) {
      case "safe_to_spend": return this.safeToSpend(req);
      case "set_budget":
        if (!this.engine.stated) break;
        this.engine.stated.set(req.user_ref, intent.amount);
        return this.safeToSpend(req, intent.amount, "set");
      case "affordability":
        if (!intent.amount) {
          return this.reply(req, "clarify", pick(l, { en: "How much does it cost?", fi: "Paljonko se maksaa?" }), "fact");
        }
        return this.affordability(req, intent.amount, intent.source, intent.observation, intent.label);
      case "price_check_needed":
        return this.askPrice(req, intent.reading);
      case "decide":
        return this.decide(req, intent.decision);
      case "history":
        return this.history(req);
      case "forget":
        return this.forget(req);
      default:
        break;
    }
    return this.reply(req, "unsupported", pick(l, {
      en: "I can't answer that yet. Try asking what's safe to spend this week.",
      fi: "En osaa vielä vastata siihen. Kysy esimerkiksi, paljonko voit käyttää tällä viikolla.",
    }), "fact");
  }

  private reply(req: DomainRequest, status: DomainResponse["status"], text: string, epistemic: DomainResponse["speech"]["epistemic"],
    cards: InsightCard[] = [], proposals: ActionProposal[] = [], tools: ToolResult[] = []): DomainResponse {
    return {
      schema: "platform.domain_response/v1",
      request_id: req.request_id,
      status,
      speech: { text, epistemic },
      cards,
      proposals,
      trace: {
        calc_ids: [...new Set(tools.map((t) => t.calc_id as string))],
        ...(req.observations.length ? { observation_ids: req.observations.map((o) => o.observation_id) } : {}),
        tools: tools.map((t) => ({ name: t.tool, ok: t.ok, ms: 0 })),
        backend: this.id,
        verified: false,
      },
    };
  }

  /** Spoken form of a weekly amount: "100" for round euros, "80.50" / "80,50" otherwise. */
  private static said(amount: string, locale: string): string {
    return toCents(amount) % 100n === 0n ? (toCents(amount) / 100n).toString() : formatAmount(amount, locale);
  }

  private static readonly NO_BANK: LText = { en: "No bank connected: using the amount you gave", fi: "Pankkia ei ole yhdistetty: käytän kertomaasi summaa" };

  /** The safe-to-spend card, built straight from the engine result (also sent back after a confirmation). */
  private stsCard(sts: ToolResult): InsightCard {
    const card = this.stsCardBody(sts);
    const avail = availableOf(sts);
    const s = sts.result as { balance?: Money };
    card.receipt = receipt([
      ...(s.balance ? [{ key: "balance", label: { en: "Balance", fi: "Saldo" }, money: s.balance, epistemic: "fact" as const, source: "engine" as const, ref: sts.calc_id as string }] : []),
      ...commitmentLines(sts),
      ...(avail ? [{ key: "available", label: avail.label, money: avail.money, epistemic: "estimate" as const, source: "engine" as const, ref: sts.calc_id as string }] : []),
    ].concat(avail ? [] : [{ key: "available", label: { en: "Available", fi: "Käytettävissä" }, text: "See the card", epistemic: "fact" as const, source: "engine" as const, ref: sts.calc_id as string }]),
    assessFinance(sts, this.engine.source, this.now()).filter((r) => !r.blocks), this.freshness(sts));
    return card;
  }

  private stsCardBody(sts: ToolResult): InsightCard {
    if (isPayday(sts)) return paydayStsCard(sts);
    const r = sts.result as { safe_to_spend_week: Money; flexible_until_payday: Money; days_left_in_week: number;
      stated_weekly_amount?: Money; planned_this_week?: Money };
    const n = roundEuros(r.safe_to_spend_week.amount).toString();
    const stated = this.engine.source === "user_stated";
    const kind = stated ? "calculated" : "estimate";
    const card: InsightCard = {
      schema: "platform.insight_card/v1",
      card_id: `card_${sts.calc_id}`,
      capability_id: CAPABILITY_ID,
      type: "metric",
      title: stated ? { en: "Left this week", fi: "Jäljellä tällä viikolla" } : { en: "Safe to spend this week", fi: "Turvallisesti käytettävissä tällä viikolla" },
      primary: { label: { en: "Until Sunday", fi: "Sunnuntaihin asti" }, value: r.safe_to_spend_week, epistemic: kind },
      rows: stated && r.stated_weekly_amount
        ? [
            { label: { en: "Your weekly amount", fi: "Viikkosummasi" }, value: r.stated_weekly_amount, epistemic: "fact",
              note: { en: "As you told me. Say a new amount to change it.", fi: "Kuten kerroit. Sano uusi summa muuttaaksesi." } },
            { label: { en: "Planned this week", fi: "Suunniteltu tällä viikolla" }, value: r.planned_this_week ?? { amount: "0.00", currency: "EUR" }, epistemic: "calculated" },
            { label: { en: "Days left this week", fi: "Päiviä jäljellä tällä viikolla" }, value: String(r.days_left_in_week), epistemic: "fact" },
          ]
        : [
            { label: { en: "Flexible money until payday", fi: "Joustovara palkkapäivään" }, value: r.flexible_until_payday, epistemic: "estimate" },
            { label: { en: "Days left this week", fi: "Päiviä jäljellä tällä viikolla" }, value: String(r.days_left_in_week), epistemic: "fact" },
          ],
      epistemic: kind,
      ...(sts.data_mode ? { data_mode: sts.data_mode } : {}),
      basis: { calc_ids: [sts.calc_id as string], as_of: sts.as_of },
      assumptions: sts.assumptions.map((a) => ({ en: a })),
      missing_data: stated ? [DeterministicFastPath.NO_BANK] : [],
      render_hints: {
        glasses_display_lines: [stated ? `€${n} left · until Sunday` : `€${n} safe · until Sunday`, stated ? "your figure" : "estimate"],
        voice_summary: { en: `About ${n} euros through Sunday.`, fi: `Noin ${n} euroa sunnuntaihin asti.` },
      },
    };
    return card;
  }

  /**
   * @param gotIt the weekly amount the user just gave (answering the coach's question, or "set")
   */
  private async safeToSpend(req: DomainRequest, gotIt?: string, mode: "answer" | "set" = "answer"): Promise<DomainResponse> {
    const sts = await this.engine.getSafeToSpend(req.user_ref);
    if (!sts) {
      if (this.engine.stated) return this.askForWeeklyAmount(req, { intent: "safe_to_spend" });
      return this.abstain(req, [FINANCE_DATA_MISSING], {});
    }
    const reasons = assessFinance(sts, this.engine.source, this.now());
    if (blockingReason(reasons)) return this.abstain(req, reasons, {}, sts);
    if (isPayday(sts)) return this.reply(req, "answered", paydaySafeToSpendText(sts, req.locale), "estimate", [this.stsCard(sts)], [], [sts]);
    const r = sts.result as { safe_to_spend_week: Money; flexible_until_payday: Money; days_left_in_week: number;
      stated_weekly_amount?: Money; planned_this_week?: Money };
    const l = req.locale;
    const n = roundEuros(r.safe_to_spend_week.amount).toString();
    const stated = this.engine.source === "user_stated";
    const nothingPlanned = !r.planned_this_week || toCents(r.planned_this_week.amount) === 0n;

    let text: string;
    if (gotIt !== undefined) {
      const g = DeterministicFastPath.said(gotIt, l);
      const head = mode === "set" ? pick(l, { en: `OK: ${g} euros until Sunday.`, fi: `Selvä: ${g} euroa sunnuntaihin asti.` })
                                  : pick(l, { en: `Got it: ${g} euros until Sunday.`, fi: `Selvä: ${g} euroa sunnuntaihin asti.` });
      text = nothingPlanned
        ? `${head} ${pick(l, { en: "I'll keep track as you plan things.", fi: "Pidän kirjaa, kun suunnittelet ostoksia." })}`
        : `${head} ${pick(l, { en: `You have about ${n} left.`, fi: `Jäljellä on noin ${n} euroa.` })}`;
    } else if (stated) {
      text = pick(l, { en: `You have about ${n} euros left of your weekly amount until Sunday.`, fi: `Viikkosummastasi on jäljellä noin ${n} euroa sunnuntaihin asti.` });
    } else {
      text = pick(l, {
        en: `About ${n} euros is safe to spend through Sunday. That's an estimate from your balance and bills before payday.`,
        fi: `Tällä viikolla voit käyttää noin ${n} euroa sunnuntaihin asti. Arvio perustuu saldoosi ja laskuihin ennen palkkapäivää.`,
      });
    }

    const kind = stated ? "calculated" : "estimate";
    const card = this.stsCard(sts);
    return this.reply(req, "answered", text, kind, [card], [], [sts]);
  }

  private async affordability(req: DomainRequest, amount: string, source: "stated_amount" | "observation", observation?: Observation,
    label?: string, gotIt?: string): Promise<DomainResponse> {
    // Where the price came from: read by the camera, read and then confirmed by the user, or said by the user.
    const origin: PriceOrigin = source === "observation" ? "camera" : observation ? "camera_confirmed" : "user";
    const calc = await this.engine.calculateAffordability(req.user_ref, {
      amount, priceSource: source, ...(observation ? { observationId: observation.observation_id } : {}),
    });
    if (!calc) {
      if (this.engine.stated) {
        return this.askForWeeklyAmount(req, { intent: "affordability", amount, source,
          ...(observation ? { observation } : {}), ...(label ? { label } : {}) });
      }
      return this.abstain(req, [FINANCE_DATA_MISSING], { amount, origin, label, observation });
    }
    const { result, sts } = calc;
    // Trust gate (DEC-030): no verdict when the data can't support one.
    const reasons = assessFinance(sts, this.engine.source, this.now());
    if (blockingReason(reasons)) return this.abstain(req, reasons, { amount, origin, label, observation }, sts);
    if ((result.result as { period?: string }).period === "until_payday") {
      return this.paydayAffordability(req, result, sts, amount, origin, reasons, observation, label);
    }
    const stated = this.engine.source === "user_stated";
    const r = result.result as { verdict: "FITS" | "TIGHT" | "EXCEEDS" | "UNKNOWN"; safe_to_spend_week: Money; remaining_after: Money };
    const l = req.locale;
    const p = formatAmount(amount, l);
    const n = roundEuros(r.remaining_after.amount);
    const nAbs = (n < 0n ? -n : n).toString();
    // A camera-read price is hedged ("if that price is…"); a stated or confirmed amount is the user's own.
    const obs = origin === "camera";
    const fits = pick(l, obs
      ? { en: `If that price is ${p}, it fits`, fi: `Jos hinta on ${p} euroa, se mahtuu` }
      : { en: `${p} fits`, fi: `${p} euroa mahtuu` });
    const over = pick(l, obs
      ? { en: `If that price is ${p}, it's`, fi: `Jos hinta on ${p} euroa, se on` }
      : { en: `${p} is`, fi: `${p} euroa on` });
    let text = {
      FITS: pick(l, { en: `${fits}, with about ${nAbs} euros left until Sunday. Want me to plan it in?`, fi: `${fits}, ja sunnuntaihin jää noin ${nAbs} euroa. Lisäänkö sen suunnitelmaan?` }),
      TIGHT: pick(l, { en: `${fits}, but it would leave about ${nAbs} euros until Sunday. Want me to plan it in?`, fi: `${fits}, mutta sunnuntaihin jäisi vain noin ${nAbs} euroa. Lisäänkö sen suunnitelmaan?` }),
      EXCEEDS: pick(l, { en: `${over} about ${nAbs} euros more than is safe to spend this week.`, fi: `${over} noin ${nAbs} euroa enemmän kuin tällä viikolla on turvallista käyttää.` }),
      UNKNOWN: pick(l, { en: "I can't see your balance, so I can't say if it fits. Details are on your phone.", fi: "En näe saldoasi, joten en voi sanoa, mahtuuko se. Tiedot ovat puhelimessa." }),
    }[r.verdict];
    if (gotIt !== undefined) {
      // Answering the coach's question: confirm the amount, then answer the original question, within the speech budget.
      const g = DeterministicFastPath.said(gotIt, l);
      const head = pick(l, { en: `Got it: ${g} euros until Sunday.`, fi: `Selvä: ${g} euroa sunnuntaihin asti.` });
      const fitsTail = obs
        ? pick(l, { en: `If the label's right, that leaves about ${nAbs}. Want me to plan it in?`, fi: `Jos hinta pitää, jäljelle jää noin ${nAbs} euroa. Lisäänkö sen suunnitelmaan?` })
        : pick(l, { en: `That leaves about ${nAbs} after this. Want me to plan it in?`, fi: `Tämän jälkeen jää noin ${nAbs} euroa. Lisäänkö sen suunnitelmaan?` });
      const overTail = obs
        ? pick(l, { en: `If the label's right, this is about ${nAbs} more than that.`, fi: `Jos hinta pitää, tämä on noin ${nAbs} euroa enemmän.` })
        : pick(l, { en: `This is about ${nAbs} more than that.`, fi: `Tämä on noin ${nAbs} euroa enemmän.` });
      text = `${head} ${r.verdict === "EXCEEDS" ? overTail : fitsTail}`;
    }

    // A user-given weekly amount and a user-given price are exact: "calculated". A camera-read price may be misread: "estimate".
    const kind = stated && !obs ? "calculated" : "estimate";
    const verdictText: Record<typeof r.verdict, LText> = {
      FITS: { en: "Fits", fi: "Mahtuu" },
      TIGHT: { en: "Fits, but tight", fi: "Mahtuu, mutta tiukasti" },
      EXCEEDS: { en: "Doesn't fit this week", fi: "Ei mahdu tälle viikolle" },
      UNKNOWN: { en: "Can't tell without your balance", fi: "Ei voi arvioida ilman saldoa" },
    };
    const availableLabel: LText = stated
      ? { en: "Left of your weekly amount", fi: "Viikkosummastasi jäljellä" }
      : { en: "Safe to spend until Sunday", fi: "Turvallisesti käytettävissä sunnuntaihin" };
    const card: InsightCard = {
      schema: "platform.insight_card/v1",
      card_id: `card_${result.calc_id}`,
      capability_id: CAPABILITY_ID,
      type: "metric",
      title: itemTitle(origin === "user" ? "stated_amount" : "observation", label, { en: "Does it fit this week?", fi: "Mahtuuko tämä viikolle?" }),
      primary: { label: { en: "Left until Sunday after buying", fi: "Jäljellä sunnuntaihin oston jälkeen" }, value: r.remaining_after, epistemic: kind },
      rows: [
        priceRow(origin, amount),
        { label: availableLabel, value: r.safe_to_spend_week, epistemic: stated ? "calculated" : "estimate" },
        { label: { en: "Verdict", fi: "Arvio" }, value: (isFi(l) ? verdictText[r.verdict].fi : verdictText[r.verdict].en)!, epistemic: "calculated" },
      ],
      epistemic: kind,
      ...(result.data_mode ? { data_mode: result.data_mode } : {}),
      basis: {
        calc_ids: [result.calc_id as string, sts.calc_id as string],
        ...(observation ? { observation_ids: [observation.observation_id] } : {}),
        as_of: result.as_of,
      },
      assumptions: result.assumptions.map((a) => ({ en: a })),
      missing_data: stated ? [DeterministicFastPath.NO_BANK] : [],
      receipt: receipt([
        ...priceLines(origin, amount, observation, label),
        { key: "available", label: availableLabel, money: r.safe_to_spend_week, epistemic: stated ? "calculated" : "estimate", source: "engine", ref: sts.calc_id as string },
        ...commitmentLines(sts),
        { key: "calculation", label: { en: "Calculation", fi: "Laskelma" }, text: `${r.safe_to_spend_week.amount} − ${amount} = ${r.remaining_after.amount}`,
          epistemic: "calculated", source: "engine", ref: result.calc_id as string },
        { key: "remaining", label: { en: "Left until Sunday after buying", fi: "Jäljellä sunnuntaihin oston jälkeen" }, money: r.remaining_after,
          epistemic: kind, source: "engine", ref: result.calc_id as string },
        { key: "verdict", label: { en: "Verdict", fi: "Arvio" }, text: verdictText[r.verdict].en!, epistemic: "calculated", source: "engine", ref: result.calc_id as string,
          note: { en: "Fits if at least 25 % of the week's money is left; tight if less; doesn't fit below zero",
                  fi: "Mahtuu, jos viikon rahoista jää vähintään 25 %; tiukka, jos vähemmän; ei mahdu, jos menee miinukselle" } },
      ], reasons, this.freshness(sts)),
      render_hints: { glasses_display_lines: [verdictText[r.verdict].en!.slice(0, 40), `€${nAbs} left until Sunday`.slice(0, 40), stated && !obs ? "your figure" : "estimate"] },
    };
    const options = optionsCard(result, sts, kind, {
      buy: { value: r.remaining_after, note: { en: "Left until Sunday", fi: "Jää sunnuntaihin" } },
      wait: { en: "Your week starts over on Monday. Ask me again then.", fi: "Viikkosi alkaa alusta maanantaina. Kysy silloin uudelleen." },
      skip: { value: r.safe_to_spend_week, note: { en: "Stays available until Sunday", fi: "Pysyy käytettävissä sunnuntaihin" } },
    }, observation);

    const proposals: ActionProposal[] = [];
    if (r.verdict === "FITS" || r.verdict === "TIGHT") {
      const proposal = this.planProposal(req.user_ref, amount, safeLabel(label), r.safe_to_spend_week.amount, r.remaining_after.amount,
        obs ? "observation" : "stated_amount", stated, false, result.calc_id as string);
      proposals.push(proposal);
      card.proposal_ids = [proposal.proposal_id];
    }
    this.remember(req, { label: safeLabel(label), amount, calcId: result.calc_id as string, proposalId: proposals[0]?.proposal_id, payday: false });
    return this.withFollowups(this.reply(req, "answered", text, kind, [card, options], proposals, [result, sts]), decideFollowups);
  }

  /** Affordability on the team's money engine: what the purchase leaves per day until payday (DEC-025). */
  private paydayAffordability(req: DomainRequest, result: ToolResult, sts: ToolResult, amount: string,
    origin: PriceOrigin, reasons: Reason[], observation?: Observation, label?: string): DomainResponse {
    const r = result.result as PaydayAffordability;
    const s = sts.result as PaydaySts;
    const l = req.locale;
    const p = formatAmount(amount, l);
    const perDay = roundEuros(r.safe_per_day_after.amount).toString();
    const n = roundEuros(r.remaining_after.amount);
    const nAbs = (n < 0n ? -n : n).toString();
    const obs = origin === "camera";
    const fits = pick(l, obs
      ? { en: `If that price is ${p}, it fits`, fi: `Jos hinta on ${p} euroa, se mahtuu` }
      : { en: `${p} fits`, fi: `${p} euroa mahtuu` });
    const over = pick(l, obs
      ? { en: `If that price is ${p}, it's`, fi: `Jos hinta on ${p} euroa, se on` }
      : { en: `${p} is`, fi: `${p} euroa on` });
    const tightTail = perDay === "0"
      ? pick(l, { en: "but it would use up almost all your money until payday.", fi: "mutta se veisi lähes kaikki rahasi palkkapäivään asti." })
      : pick(l, { en: `but you'd only have about ${perDay} euros a day left until payday.`, fi: `mutta sinulle jäisi vain noin ${perDay} euroa päivässä palkkapäivään asti.` });
    const ask = pick(l, { en: "Want me to plan it in?", fi: "Lisäänkö sen suunnitelmaan?" });
    const text = {
      FITS: pick(l, { en: `${fits}. You'd still have about ${perDay} euros a day until payday. ${ask}`,
                      fi: `${fits}, ja sinulle jää noin ${perDay} euroa päivässä palkkapäivään asti. ${ask}` }),
      TIGHT: `${fits}, ${tightTail} ${ask}`,
      EXCEEDS: pick(l, { en: `${over} about ${nAbs} euros more than is safe to spend before payday.`,
                         fi: `${over} noin ${nAbs} euroa enemmän kuin ennen palkkapäivää on turvallista käyttää.` }),
      UNKNOWN: pick(l, { en: "I can't say if it fits. Details are on your phone.", fi: "En voi sanoa, mahtuuko se. Tiedot ovat puhelimessa." }),
    }[r.verdict];

    const verdictText: Record<typeof r.verdict, LText> = {
      FITS: { en: "Fits", fi: "Mahtuu" },
      TIGHT: { en: "Fits, but tight", fi: "Mahtuu, mutta tiukasti" },
      EXCEEDS: { en: "Doesn't fit before payday", fi: "Ei mahdu ennen palkkapäivää" },
      UNKNOWN: { en: "Can't tell", fi: "Ei voi arvioida" },
    };
    const card: InsightCard = {
      schema: "platform.insight_card/v1",
      card_id: `card_${result.calc_id}`,
      capability_id: CAPABILITY_ID,
      type: "metric",
      title: itemTitle(origin === "user" ? "stated_amount" : "observation", label, { en: "Can you afford it?", fi: "Onko sinulla varaa tähän?" }),
      primary: { label: { en: "Per day until payday, after buying", fi: "Päivässä palkkapäivään asti oston jälkeen" }, value: r.safe_per_day_after, epistemic: "estimate" },
      rows: [
        priceRow(origin, amount),
        { label: { en: "Free until payday", fi: "Vapaana palkkapäivään asti" }, value: r.free_until_payday, epistemic: "estimate" },
        { label: { en: "Left until payday after buying", fi: "Jäljellä palkkapäivään oston jälkeen" }, value: r.remaining_after, epistemic: "estimate" },
        { label: { en: "Days to payday", fi: "Päiviä palkkapäivään" }, value: String(r.days_to_payday), epistemic: "estimate" },
        { label: { en: "Verdict", fi: "Arvio" }, value: (isFi(l) ? verdictText[r.verdict].fi : verdictText[r.verdict].en)!, epistemic: "calculated" },
      ],
      epistemic: "estimate",
      ...(result.data_mode ? { data_mode: result.data_mode } : {}),
      basis: {
        calc_ids: [result.calc_id as string, sts.calc_id as string],
        ...(observation ? { observation_ids: [observation.observation_id] } : {}),
        as_of: result.as_of,
      },
      assumptions: result.assumptions.map((a) => ({ en: a })),
      missing_data: [],
      receipt: receipt([
        ...priceLines(origin, amount, observation, label),
        ...(s.balance ? [{ key: "balance", label: { en: "Balance", fi: "Saldo" }, money: s.balance, epistemic: "fact" as const, source: "engine" as const, ref: sts.calc_id as string }] : []),
        ...commitmentLines(sts),
        { key: "available", label: { en: "Free until payday", fi: "Vapaana palkkapäivään asti" }, money: r.free_until_payday, epistemic: "estimate", source: "engine", ref: sts.calc_id as string },
        { key: "calculation", label: { en: "Calculation", fi: "Laskelma" },
          text: `${r.free_until_payday.amount} − ${amount} = ${r.remaining_after.amount}, over ${r.days_to_payday} days = ${r.safe_per_day_after.amount} a day`,
          epistemic: "calculated", source: "engine", ref: result.calc_id as string },
        { key: "remaining", label: { en: "Left until payday after buying", fi: "Jäljellä palkkapäivään oston jälkeen" }, money: r.remaining_after,
          epistemic: "estimate", source: "engine", ref: result.calc_id as string },
        { key: "verdict", label: { en: "Verdict", fi: "Arvio" }, text: verdictText[r.verdict].en!, epistemic: "calculated", source: "coach", ref: result.calc_id as string,
          note: { en: "Fits if at least 25 % of the money free until payday is left. Computed outside the engine for now.",
                  fi: "Mahtuu, jos palkkapäivään asti vapaista rahoista jää vähintään 25 %. Lasketaan toistaiseksi moottorin ulkopuolella." } },
      ], reasons, this.freshness(sts)),
      render_hints: { glasses_display_lines: [verdictText[r.verdict].en!.slice(0, 40), `€${perDay}/day left until payday`.slice(0, 40), "estimate"] },
    };
    const options = optionsCard(result, sts, "estimate", {
      buy: { value: r.safe_per_day_after, note: { en: "A day until payday", fi: "Päivässä palkkapäivään" } },
      wait: { en: `Nothing changes today. Ask me again after payday, in ${r.days_to_payday} days.`,
              fi: `Mikään ei muutu tänään. Kysy uudelleen palkkapäivän jälkeen, ${r.days_to_payday} päivän päästä.` },
      skip: { value: r.free_until_payday, note: { en: "Stays free until payday", fi: "Pysyy vapaana palkkapäivään" } },
    }, observation);

    const proposals: ActionProposal[] = [];
    if (r.verdict === "FITS" || r.verdict === "TIGHT") {
      const proposal = this.planProposal(req.user_ref, amount, safeLabel(label), r.free_until_payday.amount, r.remaining_after.amount,
        obs ? "observation" : "stated_amount", false, true, result.calc_id as string);
      proposals.push(proposal);
      card.proposal_ids = [proposal.proposal_id];
    }
    this.remember(req, { label: safeLabel(label), amount, calcId: result.calc_id as string, proposalId: proposals[0]?.proposal_id, payday: true });
    return this.withFollowups(this.reply(req, "answered", text, "estimate", [card, options], proposals, [result, sts]), decideFollowups);
  }

  // ---- Trust gate outcomes (DEC-030) -------------------------------------------------------------

  private freshness(sts: ToolResult): NonNullable<InsightCard["receipt"]>["freshness"] {
    return { as_of: sts.as_of, source: this.engine.source, simulated: this.engine.mock || this.engine.source === "s_pankki" };
  }

  /** No verdict: say why, show what is known, propose nothing. */
  private abstain(req: DomainRequest, reasons: Reason[], ctx: { amount?: string; origin?: PriceOrigin; label?: string; observation?: Observation },
    sts?: ToolResult | null): DomainResponse {
    const block = blockingReason(reasons) ?? FINANCE_DATA_MISSING;
    const key = DeterministicFastPath.key(req);
    this.last.delete(key);
    this.memory.count(req.user_ref, "abstentions");
    const l = req.locale;
    const origin = ctx.origin ?? "user";
    const avail = sts ? availableOf(sts) : undefined;
    const rows: NonNullable<InsightCard["rows"]> = [
      ...(ctx.amount ? [priceRow(origin, ctx.amount)] : []),
      ...(avail ? [{ label: avail.label, value: avail.money, epistemic: "estimate" as const }] : []),
      { label: { en: "Verdict", fi: "Arvio" }, value: isFi(l) ? "Ei annettu" : "Not given", epistemic: "fact" },
    ];
    const lines: ReceiptLineT[] = [
      ...(ctx.amount ? priceLines(origin, ctx.amount, ctx.observation, ctx.label) : []),
      ...(avail && sts ? [{ key: "available", label: avail.label, money: avail.money, epistemic: "estimate" as const, source: "engine" as const, ref: sts.calc_id as string }] : []),
      { key: "verdict", label: { en: "Verdict", fi: "Arvio" }, text: "Not given", epistemic: "fact", source: "coach", note: block.text },
    ];
    const card: InsightCard = {
      schema: "platform.insight_card/v1",
      card_id: `card_abstain_${randomUUID().slice(0, 8)}`,
      capability_id: CAPABILITY_ID,
      type: "explanation",
      title: itemTitle(origin === "user" ? "stated_amount" : "observation", ctx.label, { en: "I won't guess on this one", fi: "Tähän en arvaa" }),
      body: { en: `${block.text.en}. I haven't given a verdict.`, fi: `${block.text.fi ?? block.text.en}. En antanut arviota.` },
      rows,
      epistemic: sts ? "estimate" : "fact",
      ...(sts?.data_mode ? { data_mode: sts.data_mode } : {}),
      basis: {
        calc_ids: sts ? [sts.calc_id as string] : [],
        ...(ctx.observation ? { observation_ids: [ctx.observation.observation_id] } : {}),
        as_of: sts?.as_of ?? this.now().toISOString(),
      },
      assumptions: (sts?.assumptions ?? []).map((a) => ({ en: a })),
      missing_data: reasons.map((r) => r.text),
      receipt: receipt(lines, reasons, sts ? this.freshness(sts)
        : { as_of: this.now().toISOString(), source: this.engine.source, simulated: this.engine.mock }),
    };
    return this.reply(req, "partial", say(l, block.spoken ?? block.text), "fact", [card], [], sts ? [sts] : []);
  }

  /** The label was unclear: ask, never guess (DEC-030). */
  private askPrice(req: DomainRequest, reading: PriceReading): DomainResponse {
    const key = DeterministicFastPath.key(req);
    this.priceChecks.set(key, { reading, askedAt: Date.now(), retries: 0 });
    this.last.delete(key);
    this.memory.count(req.user_ref, "priceChecks");
    const l = req.locale;
    const asc = [...reading.candidates].sort((a, b) => (toCents(a) < toCents(b) ? -1 : 1)).slice(0, 3);
    const fmt = (a: string) => formatAmount(a, l);
    const text = asc.length >= 2
      ? pick(l, { en: `I can't read that price reliably. Is it ${fmt(asc[0]!)} or ${fmt(asc[1]!)}?`,
                  fi: `En saa hintaa luettua varmasti. Onko se ${fmt(asc[0]!)} vai ${fmt(asc[1]!)} euroa?` })
      : asc.length === 1
        ? pick(l, { en: `I'm not sure I read that right. Is it ${fmt(asc[0]!)}?`, fi: `En ole varma, luinko oikein. Onko hinta ${fmt(asc[0]!)} euroa?` })
        : pick(l, { en: "I couldn't read the price clearly. Can you tell me the price?", fi: "En saanut hintaa luettua kunnolla. Kerrotko hinnan?" });
    const obs = reading.observation;
    const code = asc.length >= 2 ? "PRICE_AMBIGUOUS" : asc.length === 1 ? "PRICE_UNCERTAIN" : "PRICE_UNREADABLE";
    const why: Reason = {
      code, blocks: true,
      text: asc.length >= 2 ? { en: "The label could be read as more than one price", fi: "Hintalapun voi lukea useammaksi hinnaksi" }
        : asc.length === 1 ? { en: "The camera isn't sure enough of the price", fi: "Kamera ei ole tarpeeksi varma hinnasta" }
        : { en: "No price could be read from the label", fi: "Hintalapusta ei saatu luettua hintaa" },
    };
    const confOf = (a: string) => reading.confidences[reading.candidates.indexOf(a)] ?? 0;
    const card: InsightCard | undefined = obs && asc.length ? {
      schema: "platform.insight_card/v1",
      card_id: `card_check_${obs.observation_id}`,
      capability_id: CAPABILITY_ID,
      type: "explanation",
      title: itemTitle("observation", reading.label, { en: "Which price is it?", fi: "Kumpi hinta?" }),
      body: { en: "The label is unclear, so I haven't used any of these prices. Tell me which one it is.",
              fi: "Hintalappu on epäselvä, joten en käyttänyt mitään näistä hinnoista. Kerro, mikä se on." },
      rows: asc.map((a) => ({ label: { en: "Could be", fi: "Voi olla" }, value: { amount: a, currency: "EUR" as const }, epistemic: "observed" as const,
        note: { en: `${percent(confOf(a))} sure`, fi: `${percent(confOf(a))} varma` } })),
      epistemic: "observed",
      basis: { calc_ids: [], observation_ids: [obs.observation_id], as_of: obs.created_at },
      assumptions: [],
      missing_data: [why.text],
      receipt: receipt([
        ...(reading.label ? [{ key: "product", label: { en: "Product", fi: "Tuote" }, text: safeLabel(reading.label), epistemic: "observed" as const, source: "camera" as const, ref: obs.observation_id }] : []),
        ...asc.map((a) => ({ key: "price_candidate", label: { en: "Possible price", fi: "Mahdollinen hinta" }, money: { amount: a, currency: "EUR" as const },
          epistemic: "observed" as const, source: "camera" as const, ref: obs.observation_id, note: { en: `${percent(confOf(a))} sure`, fi: `${percent(confOf(a))} varma` } })),
        { key: "verdict", label: { en: "Verdict", fi: "Arvio" }, text: "Not given until you confirm the price", epistemic: "fact", source: "coach" },
      ], [why], { as_of: obs.created_at, source: "camera", simulated: obs.extractor.provider_id.includes("fixture") }),
    } : undefined;
    const res = this.reply(req, "clarify", text, "observed", card ? [card] : [], [], []);
    return this.withFollowups(res, asc.map((a) => ({ en: `It's ${formatAmount(a, "en-FI")}`, fi: `Se on ${formatAmount(a, "fi-FI")}` })));
  }

  // ---- Decisions and memory (DEC-031) -----------------------------------------------------------

  private remember(req: DomainRequest, a: Omit<LastAnswer, "askedAt">): void {
    this.memory.count(req.user_ref, "answers");
    this.last.set(DeterministicFastPath.key(req), { ...a, askedAt: Date.now() });
  }

  private decide(req: DomainRequest, decision: Exclude<Decision, "planned">): DomainResponse {
    const key = DeterministicFastPath.key(req);
    const l = req.locale;
    const last = this.last.get(key);
    if (!last) {
      return this.reply(req, "clarify", pick(l, {
        en: "Ask me about something first, then tell me if you'll wait or skip it.",
        fi: "Kysy ensin jostain tuotteesta ja kerro sitten, odotatko vai jätätkö väliin.",
      }), "fact");
    }
    this.last.delete(key);
    if (last.proposalId) this.payloads.delete(last.proposalId);   // the plan-it-in offer is withdrawn
    this.memory.record(req.user_ref, { label: last.label || "Item", amount: last.amount, decision, calcId: last.calcId }, this.now());
    const summary = this.coachCalcs.summarize(req.user_ref, this.memory.list(req.user_ref), this.engine.version);
    const n = roundEuros(last.amount).toString();
    const text = decision === "skipped"
      ? pick(l, { en: `Skipped. That keeps about ${n} euros unspent for now.`, fi: `Jätetty väliin. Noin ${n} euroa jää toistaiseksi käyttämättä.` })
      : last.payday
        ? pick(l, { en: "OK, I'll remember it. Nothing changes in your plan. Ask me again after payday.",
                    fi: "Selvä, muistan sen. Suunnitelmasi ei muutu. Kysy uudelleen palkkapäivän jälkeen." })
        : pick(l, { en: "OK, I'll remember it. Nothing changes in your plan. Ask me again on Monday.",
                    fi: "Selvä, muistan sen. Suunnitelmasi ei muutu. Kysy uudelleen maanantaina." });
    return this.reply(req, "answered", text, "fact", [this.decisionsCard(req, summary)], [], [summary]);
  }

  private history(req: DomainRequest): DomainResponse {
    const l = req.locale;
    const entries = this.memory.list(req.user_ref);
    const summary = this.coachCalcs.summarize(req.user_ref, entries, this.engine.version);
    const r = summary.result as { decisions: number; reconsidered: number };
    const text = entries.length === 0
      ? pick(l, { en: "You haven't decided on anything yet. Ask me about something you're looking at.",
                  fi: "Et ole vielä päättänyt mistään. Kysy jostain, mitä katselet." })
      : pick(l, { en: `You've reconsidered ${r.reconsidered} of ${r.decisions} purchases. The list is on your phone.`,
                  fi: `Olet harkinnut uudelleen ${r.reconsidered} ostosta ${r.decisions}:stä. Lista on puhelimessasi.` });
    return this.reply(req, "answered", text, "calculated", [this.decisionsCard(req, summary)], [], [summary]);
  }

  private forget(req: DomainRequest): DomainResponse {
    this.memory.forget(req.user_ref);
    this.last.delete(DeterministicFastPath.key(req));
    return this.reply(req, "answered", pick(req.locale, {
      en: "Done. I've forgotten your decisions and what I counted about them.",
      fi: "Tehty. Unohdin päätöksesi ja niistä lasketut tiedot.",
    }), "fact");
  }

  /** Impact and trust, counted from this user's own decisions in this session (DEC-031). Never presented as measured savings. */
  private decisionsCard(req: DomainRequest, summary: ToolResult): InsightCard {
    const entries = this.memory.list(req.user_ref);
    const t = this.memory.trust(req.user_ref);
    const r = summary.result as { kept_for_now: Money; reconsidered: number; decisions: number; planned_total: Money };
    const fi = isFi(req.locale);
    const word: Record<Decision, LText> = {
      planned: { en: "Planned in", fi: "Suunniteltu" }, waiting: { en: "Waiting", fi: "Odottaa" }, skipped: { en: "Skipped", fi: "Jätetty väliin" },
    };
    const day = (iso: string) => new Intl.DateTimeFormat(fi ? "fi-FI" : "en-GB", { day: "numeric", month: "short", timeZone: "Europe/Helsinki" }).format(new Date(iso));
    const recent = entries.slice(-5).reverse();
    return {
      schema: "platform.insight_card/v1",
      card_id: `card_${summary.calc_id}`,
      capability_id: CAPABILITY_ID,
      type: "list",
      title: { en: "Your decisions", fi: "Päätöksesi" },
      primary: { label: { en: "Kept unspent for now (waited or skipped)", fi: "Toistaiseksi käyttämättä (odotettu tai jätetty väliin)" }, value: r.kept_for_now, epistemic: "calculated" },
      rows: [
        ...recent.map((e) => ({ label: { en: e.label, fi: e.label }, value: { amount: e.amount, currency: "EUR" as const }, epistemic: "fact" as const,
          note: { en: `${word[e.decision].en} · ${day(e.at)}`, fi: `${word[e.decision].fi} · ${day(e.at)}` } })),
        { label: { en: "Purchases reconsidered", fi: "Uudelleen harkitut ostokset" }, value: `${r.reconsidered} of ${r.decisions}`, epistemic: "calculated" },
        { label: { en: "Prices I checked with you", fi: "Hinnat, jotka tarkistin kanssasi" }, value: String(t.priceChecks), epistemic: "fact" },
        { label: { en: "Prices you corrected", fi: "Korjaamasi hinnat" }, value: String(t.priceCorrections), epistemic: "fact" },
        { label: { en: "Times I didn't guess", fi: "Kerrat, kun en arvannut" }, value: String(t.abstentions), epistemic: "fact" },
      ],
      body: { en: "Counted from your own decisions in this session. Waiting or skipping keeps money unspent for now; it isn't the same as saving it. Say “forget my decisions” to delete this.",
              fi: "Laskettu tämän istunnon päätöksistäsi. Odottaminen tai väliin jättäminen pitää rahat toistaiseksi käyttämättä; se ei ole sama kuin säästäminen. Sano ”unohda päätökseni”, niin poistan tämän." },
      epistemic: "calculated",
      basis: { calc_ids: [summary.calc_id as string], as_of: summary.as_of },
      assumptions: summary.assumptions.map((a) => ({ en: a })),
      missing_data: [],
      receipt: receipt([
        { key: "remembered", label: { en: "What I remember", fi: "Mitä muistan" }, text: "Item name, price, date and your decision. Nothing captured without you asking.",
          epistemic: "fact", source: "coach" },
        { key: "calculation", label: { en: "Kept for now", fi: "Toistaiseksi käyttämättä" }, text: `Sum of ${r.reconsidered} waited or skipped item(s) = ${r.kept_for_now.amount}`,
          epistemic: "calculated", source: "coach", ref: summary.calc_id as string },
        { key: "planned", label: { en: "Planned in", fi: "Suunniteltu" }, money: r.planned_total, epistemic: "calculated", source: "coach", ref: summary.calc_id as string },
      ], [], { as_of: summary.as_of, source: "decision_memory", simulated: this.engine.mock }),
    };
  }

  private withFollowups(res: DomainResponse, followups: LText[]): DomainResponse {
    return followups.length ? { ...res, followups: followups.slice(0, 3) } : res;
  }

  /**
   * Money in the proposal is left as plain decimal strings in `details` so the phone formats it
   * exactly like the cards (the backend can't match every client's locale formatting).
   */
  private planProposal(userRef: string, amount: string, label: string, before: string, after: string, source: string,
    stated: boolean, payday = false, calcId?: string): ActionProposal {
    const proposalId = `pc_${randomUUID().slice(0, 8)}`;
    const payload = { kind: "finance.plan.add", label: label || "Item", amount };
    const hash = payloadHash(payload);
    this.payloads.set(proposalId, { userRef, hash, payload, ...(calcId ? { calcId } : {}) });
    const obs = source === "observation";
    return {
      schema: "platform.action_proposal/v1",
      proposal_id: proposalId,
      capability_id: CAPABILITY_ID,
      kind: "finance.plan.add",
      // The spoken summary never includes untrusted label text.
      summary: payday
        ? {
            spoken: { en: "Plan this in before payday? Tap to confirm.", fi: "Lisätäänkö tämä suunnitelmaan ennen palkkapäivää? Vahvista napauttamalla." },
            text: {
              en: `Add ${label ? `“${label}”` : "this"} to your planned spending before payday?`,
              fi: `Lisätäänkö ${label ? `“${label}”` : "tämä"} suunniteltuihin menoihin ennen palkkapäivää?`,
            },
          }
        : {
            spoken: { en: "Plan this into this week? Tap to confirm.", fi: "Lisätäänkö tämä viikon suunnitelmaan? Vahvista napauttamalla." },
            text: {
              en: `Add ${label ? `“${label}”` : "this"} to this week's planned spending?`,
              fi: `Lisätäänkö ${label ? `“${label}”` : "tämä"} tämän viikon suunniteltuihin menoihin?`,
            },
          },
      details: [
        { label: obs ? { en: "Price (read from the label)", fi: "Hinta (luettu hintalapusta)" } : { en: "Amount", fi: "Summa" }, after: amount },
        { label: payday ? { en: "Free until payday", fi: "Vapaana palkkapäivään asti" }
            : stated ? { en: "Left this week", fi: "Jäljellä tällä viikolla" } : { en: "Safe to spend this week", fi: "Käytettävissä tällä viikolla" }, before, after },
      ],
      payload_hash: hash,
      risk: "low",
      reversible: true,
      undo_window_s: 604800,
      confirm_channels: PLAN_CHANNELS,
      expires_at: new Date(Date.now() + this.proposalTtlMs).toISOString(),
    };
  }

  owns(proposalId: string): boolean {
    return this.payloads.has(proposalId);
  }

  async confirm(c: UserConfirmation): Promise<ActionResult> {
    const base = { schema: "platform.action_result/v1" as const, proposal_id: c.proposal_id, confirmation_id: c.confirmation_id };
    const { signature, ...claims } = c;
    if (!verifyJws(signature, claims, this.platformPublicKey)) return { ...base, status: "signature_invalid" };
    const held = this.payloads.get(c.proposal_id);
    if (!held || held.userRef !== c.user_ref) return { ...base, status: "failed", error: { code: "PROPOSAL_NOT_FOUND", message: "Unknown proposal", retryable: false } };
    if (held.hash !== c.payload_hash) return { ...base, status: "hash_mismatch" };
    this.payloads.delete(c.proposal_id); // single use
    if (c.decision === "reject") return { ...base, status: "rejected_by_user" };

    this.engine.addPlanned(c.user_ref, { label: held.payload.label, amount: held.payload.amount });
    this.memory.record(c.user_ref, { label: held.payload.label, amount: held.payload.amount, decision: "planned", calcId: held.calcId ?? "" }, this.now());
    for (const [k, a] of this.last) if (a.proposalId === c.proposal_id) this.last.delete(k);
    const appliedAt = new Date();
    // The updated week, so the phone can replace the now-stale answer card.
    const sts = await this.engine.getSafeToSpend(c.user_ref);
    return {
      ...base,
      ...(sts ? { card: this.stsCard(sts) } : {}),
      status: "applied",
      applied_at: appliedAt.toISOString(),
      undo_token: `undo_${c.proposal_id}`,
      undo_expires_at: new Date(appliedAt.getTime() + 604800 * 1000).toISOString(),
    };
  }
}

// ---- Until payday (the team's money engine, DEC-025) ---------------------------------------------

type PaydaySts = {
  balance: Money; next_payday: string; days_to_payday: number; reserved: Record<string, Money>;
  free_until_payday: Money; safe_to_spend_today: Money; planned_total: Money; status: "ok" | "at_risk";
};
type PaydayAffordability = {
  verdict: "FITS" | "TIGHT" | "EXCEEDS" | "UNKNOWN"; remaining_after: Money; free_until_payday: Money;
  days_to_payday: number; safe_per_day_after: Money;
};

function isPayday(sts: ToolResult): boolean {
  return sts.tool === "finance.get_safe_to_spend_until_payday";
}

/** Spoken numbers stay ones the verifier can trace: "about N" euros (rounded) and the day count. No dates. */
function paydaySafeToSpendText(sts: ToolResult, l: string): string {
  const r = sts.result as PaydaySts;
  const n = roundEuros(r.safe_to_spend_today.amount).toString();
  const days = String(r.days_to_payday);
  if (r.status === "at_risk") {
    return pick(l, {
      en: `Right now nothing is safe to spend: bills due before payday exceed your balance. Hold off on extra spending for the next ${days} days.`,
      fi: `Juuri nyt mitään ei ole turvallista käyttää: laskut ennen palkkapäivää ylittävät saldosi. Vältä ylimääräisiä menoja seuraavat ${days} päivää.`,
    });
  }
  if (n === "0") {
    return pick(l, { en: `Less than a euro a day is safe to spend for the next ${days} days, until payday.`,
                     fi: `Alle euro päivässä on turvallista käyttää seuraavat ${days} päivää, palkkapäivään asti.` });
  }
  return pick(l, {
    en: `You can safely spend about ${n} euros a day for the next ${days} days, until payday. It's an estimate from your balance and bills.`,
    fi: `Voit käyttää turvallisesti noin ${n} euroa päivässä seuraavat ${days} päivää, palkkapäivään asti. Arvio perustuu saldoosi ja laskuihin.`,
  });
}

function paydayStsCard(sts: ToolResult): InsightCard {
  const r = sts.result as PaydaySts;
  const n = roundEuros(r.safe_to_spend_today.amount).toString();
  const atRisk = r.status === "at_risk";
  const planned = toCents(r.planned_total.amount) > 0n;
  return {
    schema: "platform.insight_card/v1",
    card_id: `card_${sts.calc_id}`,
    capability_id: CAPABILITY_ID,
    type: "metric",
    title: { en: "Safe to spend today", fi: "Turvallisesti käytettävissä tänään" },
    primary: { label: { en: "Per day until payday", fi: "Päivässä palkkapäivään asti" }, value: r.safe_to_spend_today, epistemic: "estimate" },
    ...(atRisk ? { body: { en: "The bills due before payday are more than your balance. Pause extra spending.",
                           fi: "Ennen palkkapäivää erääntyvät laskut ylittävät saldosi. Pidä taukoa ylimääräisistä menoista." } } : {}),
    rows: [
      { label: { en: "Free until payday", fi: "Vapaana palkkapäivään asti" }, value: r.free_until_payday, epistemic: "estimate" },
      { label: { en: "Balance", fi: "Saldo" }, value: r.balance, epistemic: "fact" },
      ...(r.reserved.regular_bills_still_due
        ? [{ label: { en: "Bills still due", fi: "Maksamattomat laskut" }, value: r.reserved.regular_bills_still_due, epistemic: "estimate" as const }]
        : []),
      ...(planned ? [{ label: { en: "Already planned", fi: "Jo suunniteltu" }, value: r.planned_total, epistemic: "calculated" as const }] : []),
      { label: { en: "Days to payday", fi: "Päiviä palkkapäivään" }, value: String(r.days_to_payday), epistemic: "estimate" },
    ],
    epistemic: "estimate",
    ...(sts.data_mode ? { data_mode: sts.data_mode } : {}),
    basis: { calc_ids: [sts.calc_id as string], as_of: sts.as_of },
    assumptions: sts.assumptions.map((a) => ({ en: a })),
    missing_data: [],
    render_hints: {
      glasses_display_lines: [atRisk ? "Pause extra spending" : `€${n}/day · ${r.days_to_payday} days to payday`.slice(0, 40), "estimate"],
      voice_summary: atRisk
        ? { en: "Nothing is safe to spend before payday.", fi: "Mitään ei ole turvallista käyttää ennen palkkapäivää." }
        : { en: `About ${n} euros a day until payday.`, fi: `Noin ${n} euroa päivässä palkkapäivään asti.` },
    },
  };
}
