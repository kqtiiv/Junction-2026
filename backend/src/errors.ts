// platform.error/v1 (DEC-008). Codes and HTTP statuses follow the registry in
// docs/contracts/README.md#error-codes. user_message is safe to speak: no amounts,
// no account data, no internals. Diagnostics go to logs under correlation_id.
import { randomUUID } from "node:crypto";
import type { ErrorEnvelope, LText } from "./contracts.ts";

type EffectState = ErrorEnvelope["effect_state"];
type DegradedTo = NonNullable<ErrorEnvelope["degraded_to"]>;

const REGISTRY: Record<string, { status: number; retryable: boolean; message: LText }> = {
  UNAUTHENTICATED: { status: 401, retryable: false, message: { en: "Please sign in again.", fi: "Kirjaudu uudelleen." } },
  CONSENT_REQUIRED: { status: 403, retryable: false, message: { en: "I need your permission first. Check your phone.", fi: "Tarvitsen ensin luvan. Katso puhelinta." } },
  VALIDATION_FAILED: { status: 422, retryable: false, message: { en: "Something went wrong with that request.", fi: "Pyynnössä oli virhe." } },
  CONTRACT_VERSION_UNSUPPORTED: { status: 422, retryable: false, message: { en: "This app needs an update.", fi: "Sovellus tarvitsee päivityksen." } },
  CAPABILITY_NOT_FOUND: { status: 404, retryable: false, message: { en: "I can't help with that yet.", fi: "En osaa vielä auttaa siinä." } },
  PROPOSAL_NOT_FOUND: { status: 409, retryable: false, message: { en: "There's nothing waiting to confirm.", fi: "Vahvistettavaa ei ole." } },
  PROPOSAL_EXPIRED: { status: 409, retryable: false, message: { en: "That suggestion has expired. Ask again.", fi: "Ehdotus vanheni. Kysy uudelleen." } },
  PROPOSAL_ALREADY_DECIDED: { status: 409, retryable: false, message: { en: "That's already been decided.", fi: "Tämä on jo päätetty." } },
  CONFIRM_CHANNEL_NOT_ALLOWED: { status: 409, retryable: false, message: { en: "Please confirm that on your phone.", fi: "Vahvista tämä puhelimessa." } },
  DEVICE_UNAVAILABLE: { status: 409, retryable: false, message: { en: "The glasses can't do that right now. Use your phone.", fi: "Lasit eivät pysty siihen nyt. Käytä puhelinta." } },
  OFFLINE: { status: 503, retryable: true, message: { en: "I'm offline right now.", fi: "Olen nyt offline-tilassa." } },
  CAPABILITY_UNAVAILABLE: { status: 503, retryable: true, message: { en: "I can't answer right now.", fi: "En voi vastata juuri nyt." } },
  CAPABILITY_TIMEOUT: { status: 504, retryable: false, message: { en: "That took too long.", fi: "Se kesti liian kauan." } },
  INTERNAL: { status: 500, retryable: false, message: { en: "Something went wrong.", fi: "Jokin meni vikaan." } },
};

export interface PlatformErrorOptions {
  status?: number;
  effectState?: EffectState;
  retryable?: boolean;
  userMessage?: LText;
  capabilityId?: string;
  degradedTo?: DegradedTo;
  /** Logged only, never sent to the client. */
  detail?: string;
}

export class PlatformError extends Error {
  readonly code: string;
  readonly opts: PlatformErrorOptions;
  constructor(code: string, opts: PlatformErrorOptions = {}) {
    super(opts.detail ?? code);
    this.code = code;
    this.opts = opts;
  }

  get status(): number {
    return this.opts.status ?? REGISTRY[this.code]?.status ?? 500;
  }

  toEnvelope(correlationId: string = `corr_${randomUUID().slice(0, 8)}`): ErrorEnvelope {
    const reg = REGISTRY[this.code];
    const effect = this.opts.effectState ?? "none";
    const env: ErrorEnvelope = {
      schema: "platform.error/v1",
      code: this.code,
      // An action that may already have happened is never retryable (DEC-008).
      retryable: effect === "unknown" ? false : (this.opts.retryable ?? reg?.retryable ?? false),
      effect_state: effect,
      user_message: this.opts.userMessage ?? reg?.message ?? REGISTRY.INTERNAL!.message,
      correlation_id: correlationId,
      occurred_at: new Date().toISOString(),
    };
    if (this.opts.capabilityId) env.capability_id = this.opts.capabilityId;
    if (this.opts.degradedTo) env.degraded_to = this.opts.degradedTo;
    return env;
  }
}
