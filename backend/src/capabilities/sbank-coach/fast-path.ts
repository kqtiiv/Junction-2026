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

export const CAPABILITY_ID = "sbank.coach";
const PROPOSAL_TTL_MS = 10 * 60 * 1000;
const PLAN_CHANNELS: ActionProposal["confirm_channels"] = ["phone_tap", "glasses_gesture", "voice_readback"];
/** How long the coach waits for the answer to its one question. */
const PENDING_TTL_MS = 10 * 60 * 1000;

type Intent =
  | { kind: "safe_to_spend" }
  | { kind: "affordability"; amount: string | null; source: "stated_amount" | "observation"; observation?: Observation; label?: string }
  | { kind: "price_check_needed"; observation: Observation }
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

export function classify(utterance: string | null, observations: Observation[]): Intent {
  const text = utterance ?? "";
  if (SET_BUDGET.test(text) && !AFFORD.test(text) && !SAFE.test(text)) {
    const amount = parseBudgetAnswer(text.replace(SET_BUDGET, " "));
    if (amount) return { kind: "set_budget", amount };
  }
  const priced = observations.flatMap((o) => o.items.filter((i) => i.price).map((i) => ({ o, i })));
  if (AFFORD.test(text) || (priced.length > 0 && /\b(this|it)\b|tämä|se\b/i.test(text))) {
    const first = priced[0];
    if (first) {
      if (first.o.needs_user_check) return { kind: "price_check_needed", observation: first.o };
      return { kind: "affordability", amount: first.i.price!.amount, source: "observation", observation: first.o, label: first.i.label_untrusted };
    }
    return { kind: "affordability", amount: parseSpokenAmount(text), source: "stated_amount" };
  }
  if (SAFE.test(text)) return { kind: "safe_to_spend" };
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

type Money = { amount: string; currency: "EUR" };

export class DeterministicFastPath implements AgentBackend {
  readonly id = "fast_path@1";
  readonly mock: boolean;
  private readonly payloads = new Map<string, { userRef: string; hash: string; payload: { kind: string; label: string; amount: string } }>();
  private readonly pending = new Map<string, Pending>();

  constructor(private readonly engine: FinanceEngine, private readonly platformPublicKey: KeyObject) {
    this.mock = engine.mock;
  }

  private static key(req: DomainRequest): string {
    return `${req.user_ref}:${req.session_id}`;
  }

  /** Drops questions nobody answered, so abandoned sessions don't pile up in memory. */
  private sweepPending(now = Date.now()): void {
    for (const [k, p] of this.pending) if (now - p.askedAt > PENDING_TTL_MS) this.pending.delete(k);
  }

  supports(req: DomainRequest): boolean {
    if (this.engine.stated && this.pending.has(DeterministicFastPath.key(req))) return true;   // an answer to our question
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

    // The coach asked "how much until Sunday?" and is waiting for the answer.
    const p = this.engine.stated ? this.pending.get(key) : undefined;
    if (p && this.engine.stated) {
      const isNewQuestion = intent.kind === "safe_to_spend" || intent.kind === "affordability" || intent.kind === "price_check_needed";
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
        return this.reply(req, "clarify", pick(l, {
          en: "I couldn't read the price clearly. Can you tell me the price?",
          fi: "En saanut hintaa luettua kunnolla. Kerrotko hinnan?",
        }), "observed");
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
    if (!sts) return this.askForWeeklyAmount(req, { intent: "safe_to_spend" });
    if (isPayday(sts)) return this.reply(req, "answered", paydaySafeToSpendText(sts, req.locale), "estimate", [paydayStsCard(sts)], [], [sts]);
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
    const calc = await this.engine.calculateAffordability(req.user_ref, {
      amount, priceSource: source, ...(observation ? { observationId: observation.observation_id } : {}),
    });
    if (!calc) {
      return this.askForWeeklyAmount(req, { intent: "affordability", amount, source,
        ...(observation ? { observation } : {}), ...(label ? { label } : {}) });
    }
    const { result, sts } = calc;
    if ((result.result as { period?: string }).period === "until_payday") {
      return this.paydayAffordability(req, result, sts, amount, source, observation, label);
    }
    const stated = this.engine.source === "user_stated";
    const r = result.result as { verdict: "FITS" | "TIGHT" | "EXCEEDS" | "UNKNOWN"; safe_to_spend_week: Money; remaining_after: Money };
    const l = req.locale;
    const p = formatAmount(amount, l);
    const n = roundEuros(r.remaining_after.amount);
    const nAbs = (n < 0n ? -n : n).toString();
    // An observed price is hedged ("if that price is…"); a stated amount is the user's own.
    const obs = source === "observation";
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

    // A user-given weekly amount and a stated price are exact: "calculated". A camera-read price may be misread: "estimate".
    const kind = stated && !obs ? "calculated" : "estimate";
    const verdictText: Record<typeof r.verdict, LText> = {
      FITS: { en: "Fits", fi: "Mahtuu" },
      TIGHT: { en: "Fits, but tight", fi: "Mahtuu, mutta tiukasti" },
      EXCEEDS: { en: "Doesn't fit this week", fi: "Ei mahdu tälle viikolle" },
      UNKNOWN: { en: "Can't tell without your balance", fi: "Ei voi arvioida ilman saldoa" },
    };
    const card: InsightCard = {
      schema: "platform.insight_card/v1",
      card_id: `card_${result.calc_id}`,
      capability_id: CAPABILITY_ID,
      type: "metric",
      title: { en: "Does it fit this week?", fi: "Mahtuuko tämä viikolle?" },
      primary: { label: { en: "Left until Sunday after buying", fi: "Jäljellä sunnuntaihin oston jälkeen" }, value: r.remaining_after, epistemic: kind },
      rows: [
        source === "observation"
          ? { label: { en: "Price on the label", fi: "Hintalapun hinta" }, value: { amount, currency: "EUR" }, epistemic: "observed",
              note: { en: "Read by the camera. Tap to correct.", fi: "Kameran lukema. Korjaa napauttamalla." } }
          : { label: { en: "Amount you asked about", fi: "Kysymäsi summa" }, value: { amount, currency: "EUR" }, epistemic: "fact",
              note: { en: "As you said", fi: "Kuten sanoit" } },
        stated
          ? { label: { en: "Left of your weekly amount", fi: "Viikkosummastasi jäljellä" }, value: r.safe_to_spend_week, epistemic: "calculated" }
          : { label: { en: "Safe to spend until Sunday", fi: "Turvallisesti käytettävissä sunnuntaihin" }, value: r.safe_to_spend_week, epistemic: "estimate" },
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
      render_hints: { glasses_display_lines: [verdictText[r.verdict].en!.slice(0, 40), `€${nAbs} left until Sunday`.slice(0, 40), stated && !obs ? "your figure" : "estimate"] },
    };

    const proposals: ActionProposal[] = [];
    if (r.verdict === "FITS" || r.verdict === "TIGHT") {
      const proposal = this.planProposal(req.user_ref, amount, safeLabel(label), r.safe_to_spend_week.amount, r.remaining_after.amount, source, stated);
      proposals.push(proposal);
      card.proposal_ids = [proposal.proposal_id];
    }
    return this.reply(req, "answered", text, kind, [card], proposals, [result, sts]);
  }

  /** Affordability on the S-Bank Coach engine: what the purchase leaves per day until payday (DEC-025). */
  private paydayAffordability(req: DomainRequest, result: ToolResult, sts: ToolResult, amount: string,
    source: "stated_amount" | "observation", observation?: Observation, label?: string): DomainResponse {
    const r = result.result as PaydayAffordability;
    const l = req.locale;
    const p = formatAmount(amount, l);
    const perDay = roundEuros(r.safe_per_day_after.amount).toString();
    const n = roundEuros(r.remaining_after.amount);
    const nAbs = (n < 0n ? -n : n).toString();
    const obs = source === "observation";
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
      title: { en: "Can you afford it?", fi: "Onko sinulla varaa tähän?" },
      primary: { label: { en: "Per day until payday, after buying", fi: "Päivässä palkkapäivään asti oston jälkeen" }, value: r.safe_per_day_after, epistemic: "estimate" },
      rows: [
        obs
          ? { label: { en: "Price on the label", fi: "Hintalapun hinta" }, value: { amount, currency: "EUR" }, epistemic: "observed",
              note: { en: "Read by the camera. Tap to correct.", fi: "Kameran lukema. Korjaa napauttamalla." } }
          : { label: { en: "Amount you asked about", fi: "Kysymäsi summa" }, value: { amount, currency: "EUR" }, epistemic: "fact",
              note: { en: "As you said", fi: "Kuten sanoit" } },
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
      render_hints: { glasses_display_lines: [verdictText[r.verdict].en!.slice(0, 40), `€${perDay}/day left until payday`.slice(0, 40), "estimate"] },
    };

    const proposals: ActionProposal[] = [];
    if (r.verdict === "FITS" || r.verdict === "TIGHT") {
      const proposal = this.planProposal(req.user_ref, amount, safeLabel(label), r.free_until_payday.amount, r.remaining_after.amount, source, false, true);
      proposals.push(proposal);
      card.proposal_ids = [proposal.proposal_id];
    }
    return this.reply(req, "answered", text, "estimate", [card], proposals, [result, sts]);
  }

  /**
   * Money in the proposal is left as plain decimal strings in `details` so the phone formats it
   * exactly like the cards (the backend can't match every client's locale formatting).
   */
  private planProposal(userRef: string, amount: string, label: string, before: string, after: string, source: string,
    stated: boolean, payday = false): ActionProposal {
    const proposalId = `pc_${randomUUID().slice(0, 8)}`;
    const payload = { kind: "finance.plan.add", label: label || "Item", amount };
    const hash = payloadHash(payload);
    this.payloads.set(proposalId, { userRef, hash, payload });
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
      expires_at: new Date(Date.now() + PROPOSAL_TTL_MS).toISOString(),
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

// ---- Until payday (S-Bank Coach engine, DEC-025) ---------------------------------------------

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
