// Deterministic fast path (L5): intent → finance tool → template. No model involved.
// Serves as the offline/degraded mode, the demo fallback and the evaluation baseline.
import { randomUUID, type KeyObject } from "node:crypto";
import type {
  ActionProposal, ActionResult, DomainRequest, DomainResponse, InsightCard, LText, Observation, ToolResult, UserConfirmation,
} from "../../contracts.ts";
import { payloadHash, verifyJws } from "../../crypto.ts";
import { formatAmount, parseSpokenAmount, roundEuros } from "../../sdk/money.ts";
import type { AgentBackend } from "./backend.ts";
import type { FixtureFinanceEngine } from "./fixture-engine.ts";

export const CAPABILITY_ID = "sbank.coach";
const PROPOSAL_TTL_MS = 10 * 60 * 1000;
const PLAN_CHANNELS: ActionProposal["confirm_channels"] = ["phone_tap", "glasses_gesture", "voice_readback"];

type Intent =
  | { kind: "safe_to_spend" }
  | { kind: "affordability"; amount: string | null; source: "stated_amount" | "observation"; observation?: Observation; label?: string }
  | { kind: "price_check_needed"; observation: Observation }
  | { kind: "unsupported" };

const AFFORD = /\b(afford|fits?\b.*\b(week|budget)|fit this|can i buy)\b|mahtuu|varaa|budjettiin|har jag råd/i;
const SAFE = /\b(safe to spend|how much can i spend|left to spend|spend this week|my week)\b|paljonko voin käyttää|käyttövara|paljonko minulla on käytettävissä/i;

export function classify(utterance: string | null, observations: Observation[]): Intent {
  const text = utterance ?? "";
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
/** Untrusted label text: strip control characters and cap the length. Never spoken. */
const safeLabel = (s: string | undefined) => (s ?? "").replace(/[\u0000-\u001f\u007f]/g, " ").trim().slice(0, 40);

type Money = { amount: string; currency: "EUR" };

export class DeterministicFastPath implements AgentBackend {
  readonly id = "fast_path@1";
  readonly mock: boolean;
  private readonly payloads = new Map<string, { userRef: string; hash: string; payload: { kind: string; label: string; amount: string } }>();

  constructor(private readonly engine: FixtureFinanceEngine, private readonly platformPublicKey: KeyObject) {
    this.mock = engine.mock;
  }

  supports(req: DomainRequest): boolean {
    return classify(req.utterance, req.observations).kind !== "unsupported";
  }

  async healthy(): Promise<boolean> { return true; }

  async turn(req: DomainRequest): Promise<DomainResponse> {
    const intent = classify(req.utterance, req.observations);
    const l = req.locale;
    switch (intent.kind) {
      case "safe_to_spend": return this.safeToSpend(req);
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
        return this.reply(req, "unsupported", pick(l, {
          en: "I can't answer that yet. Try asking what's safe to spend this week.",
          fi: "En osaa vielä vastata siihen. Kysy esimerkiksi, paljonko voit käyttää tällä viikolla.",
        }), "fact");
    }
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

  private safeToSpend(req: DomainRequest): DomainResponse {
    const sts = this.engine.getSafeToSpend(req.user_ref);
    const r = sts.result as { safe_to_spend_week: Money; flexible_until_payday: Money; days_left_in_week: number };
    const n = roundEuros(r.safe_to_spend_week.amount).toString();
    const text = pick(req.locale, {
      en: `About ${n} euros is safe to spend through Sunday. That's an estimate from your balance and bills before payday.`,
      fi: `Tällä viikolla voit käyttää noin ${n} euroa sunnuntaihin asti. Arvio perustuu saldoosi ja laskuihin ennen palkkapäivää.`,
    });
    const card: InsightCard = {
      schema: "platform.insight_card/v1",
      card_id: `card_${sts.calc_id}`,
      capability_id: CAPABILITY_ID,
      type: "metric",
      title: { en: "Safe to spend this week", fi: "Turvallisesti käytettävissä tällä viikolla" },
      primary: { label: { en: "Until Sunday", fi: "Sunnuntaihin asti" }, value: r.safe_to_spend_week, epistemic: "estimate" },
      rows: [
        { label: { en: "Flexible money until payday", fi: "Joustovara palkkapäivään" }, value: r.flexible_until_payday, epistemic: "estimate" },
        { label: { en: "Days left this week", fi: "Päiviä jäljellä tällä viikolla" }, value: String(r.days_left_in_week), epistemic: "fact" },
      ],
      epistemic: "estimate",
      ...(sts.data_mode ? { data_mode: sts.data_mode } : {}),
      basis: { calc_ids: [sts.calc_id as string], as_of: sts.as_of },
      assumptions: sts.assumptions.map((a) => ({ en: a })),
      missing_data: [],
      render_hints: {
        glasses_display_lines: [`€${n} safe · until Sunday`, "estimate"],
        voice_summary: { en: `About ${n} euros through Sunday.`, fi: `Noin ${n} euroa sunnuntaihin asti.` },
      },
    };
    return this.reply(req, "answered", text, "estimate", [card], [], [sts]);
  }

  private affordability(req: DomainRequest, amount: string, source: "stated_amount" | "observation", observation?: Observation, label?: string): DomainResponse {
    const { result, sts } = this.engine.calculateAffordability(req.user_ref, {
      amount, priceSource: source, ...(observation ? { observationId: observation.observation_id } : {}),
    });
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
    const text = {
      FITS: pick(l, { en: `${fits}, with about ${nAbs} euros left until Sunday. Want me to plan it in?`, fi: `${fits}, ja sunnuntaihin jää noin ${nAbs} euroa. Lisäänkö sen suunnitelmaan?` }),
      TIGHT: pick(l, { en: `${fits}, but it would leave about ${nAbs} euros until Sunday. Want me to plan it in?`, fi: `${fits}, mutta sunnuntaihin jäisi vain noin ${nAbs} euroa. Lisäänkö sen suunnitelmaan?` }),
      EXCEEDS: pick(l, { en: `${over} about ${nAbs} euros more than is safe to spend this week.`, fi: `${over} noin ${nAbs} euroa enemmän kuin tällä viikolla on turvallista käyttää.` }),
      UNKNOWN: pick(l, { en: "I can't see your balance, so I can't say if it fits. Details are on your phone.", fi: "En näe saldoasi, joten en voi sanoa, mahtuuko se. Tiedot ovat puhelimessa." }),
    }[r.verdict];

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
      primary: { label: { en: "Left until Sunday after buying", fi: "Jäljellä sunnuntaihin oston jälkeen" }, value: r.remaining_after, epistemic: "estimate" },
      rows: [
        source === "observation"
          ? { label: { en: "Price on the label", fi: "Hintalapun hinta" }, value: { amount, currency: "EUR" }, epistemic: "observed",
              note: { en: "Read by the camera. Tap to correct.", fi: "Kameran lukema. Korjaa napauttamalla." } }
          : { label: { en: "Amount you asked about", fi: "Kysymäsi summa" }, value: { amount, currency: "EUR" }, epistemic: "fact",
              note: { en: "As you said", fi: "Kuten sanoit" } },
        { label: { en: "Safe to spend until Sunday", fi: "Turvallisesti käytettävissä sunnuntaihin" }, value: r.safe_to_spend_week, epistemic: "estimate" },
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
      render_hints: { glasses_display_lines: [verdictText[r.verdict].en!.slice(0, 40), `€${nAbs} left until Sunday`.slice(0, 40), "estimate"] },
    };

    const proposals: ActionProposal[] = [];
    if (r.verdict === "FITS" || r.verdict === "TIGHT") {
      const proposal = this.planProposal(req.user_ref, amount, safeLabel(label), r.safe_to_spend_week.amount, r.remaining_after.amount, source);
      proposals.push(proposal);
      card.proposal_ids = [proposal.proposal_id];
    }
    return this.reply(req, "answered", text, "estimate", [card], proposals, [result, sts]);
  }

  private planProposal(userRef: string, amount: string, label: string, before: string, after: string, source: string): ActionProposal {
    const proposalId = `pc_${randomUUID().slice(0, 8)}`;
    const payload = { kind: "finance.plan.add", label: label || "Item", amount };
    const hash = payloadHash(payload);
    this.payloads.set(proposalId, { userRef, hash, payload });
    const read = source === "observation" ? ", read from label" : "";
    return {
      schema: "platform.action_proposal/v1",
      proposal_id: proposalId,
      capability_id: CAPABILITY_ID,
      kind: "finance.plan.add",
      // The spoken summary never includes untrusted label text.
      summary: {
        spoken: { en: "Plan this into this week? Tap to confirm.", fi: "Lisätäänkö tämä viikon suunnitelmaan? Vahvista napauttamalla." },
        text: {
          en: `Add ${label ? `'${label}' ` : ""}(€${amount}${read}) to this week's planned spending`,
          fi: `Lisää ${label ? `'${label}' ` : ""}(${formatAmount(amount, "fi")} €) viikon suunniteltuihin menoihin`,
        },
      },
      details: [{ label: { en: "Safe to spend after", fi: "Käytettävissä oston jälkeen" }, before, after }],
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
    return {
      ...base,
      status: "applied",
      applied_at: appliedAt.toISOString(),
      undo_token: `undo_${c.proposal_id}`,
      undo_expires_at: new Date(appliedAt.getTime() + 604800 * 1000).toISOString(),
    };
  }
}
