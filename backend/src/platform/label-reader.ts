// Label reader: turns a capture into an Observation. Registered as a `vision_ocr`
// ModelProvider so a real reader (cloud vision model or on-device OCR) can replace the
// fixture without touching the capture flow. The fixture ignores the image content and
// returns the documented demo label (€79.90); it is always reported as a mock (DEC-005).
import { randomUUID } from "node:crypto";
import { assertValid, loadExample, type ContextCapture, type ModelProvider, type Observation } from "../contracts.ts";

export interface LabelReader {
  readonly provider: ModelProvider;
  readonly mock: boolean;
  read(capture: ContextCapture, image: Buffer): Promise<Observation>;
}

/**
 * What the fixture reader returns for each capture (DEC-030). `clear` is the documented demo
 * label (€79.90, 91 % sure). The others exercise the trust gate: two possible prices, a single
 * price read with low confidence, and no readable price. A sequence cycles per user.
 */
export type LabelFixture = "clear" | "ambiguous" | "low_confidence" | "unreadable";
export const LABEL_FIXTURES: LabelFixture[] = ["clear", "ambiguous", "low_confidence", "unreadable"];

export class FixtureLabelReader implements LabelReader {
  readonly mock = true;
  readonly provider: ModelProvider = {
    schema: "platform.model_provider/v1",
    provider_id: "ocr.fixture",
    kind: "vision_ocr",
    location: "backend",
    model_ref: "fixture",
    version: "1",
    languages: ["fi-FI", "en-FI"],
    data_policy: { leaves_device: true, retention: "none" },
    slo: { p50_ms: 5, p95_ms: 20 },
    status: "active",
  };
  private readonly template = loadExample<Observation>("valid/observation.price_label.json");
  private readonly sequence: LabelFixture[];
  private readonly counters = new Map<string, number>();

  constructor(sequence: LabelFixture[] = ["clear"]) {
    assertValid("model_provider", this.provider);
    this.sequence = sequence.length ? sequence : ["clear"];
  }

  /** The fixture the next capture from this user will get. */
  private next(userRef: string): LabelFixture {
    const i = this.counters.get(userRef) ?? 0;
    this.counters.set(userRef, i + 1);
    return this.sequence[i % this.sequence.length]!;
  }

  private variant(kind: LabelFixture): Pick<Observation, "items" | "raw_text_untrusted" | "needs_user_check" | "issues"> {
    switch (kind) {
      case "ambiguous":
        return {
          items: [
            { label_untrusted: "BLUETOOTH-KAIUTIN", price: { amount: "79.90", currency: "EUR" }, confidence: 0.52 },
            { label_untrusted: "BLUETOOTH-KAIUTIN", price: { amount: "19.90", currency: "EUR" }, confidence: 0.47 },
          ],
          raw_text_untrusted: "BLUETOOTH-KAIUTIN\n?9,90",
          needs_user_check: true,
          issues: ["PRICE_AMBIGUOUS"],
        };
      case "low_confidence":
        return {
          items: [{ label_untrusted: "LANGATTOMAT KUULOKKEET", price: { amount: "79.90", currency: "EUR" }, confidence: 0.62 }],
          raw_text_untrusted: "LANGATTOMAT KUULOKKEET\n79,90",
          needs_user_check: false,
          issues: [],
        };
      case "unreadable":
        return {
          items: [{ label_untrusted: "LANGATTOMAT KUULOKKEET", confidence: 0.31 }],
          raw_text_untrusted: "LANGATTOMAT KUULOKKEET",
          needs_user_check: true,
          issues: ["PRICE_UNREADABLE"],
        };
      default:
        return { items: this.template.items, raw_text_untrusted: this.template.raw_text_untrusted ?? "", needs_user_check: false, issues: [] };
    }
  }

  async read(capture: ContextCapture): Promise<Observation> {
    const variant = structuredClone(this.variant(this.next(capture.user_ref)));
    const obs: Observation = {
      ...structuredClone(this.template),
      ...variant,
      observation_id: `obs_${randomUUID().slice(0, 8)}`,
      capture_id: capture.capture_id,
      kind: capture.purpose === "price_label" ? "price_label" : this.template.kind,
      extractor: { provider_id: this.provider.provider_id, version: this.provider.version },
      created_at: new Date().toISOString(),
    };
    assertValid("observation", obs);
    return obs;
  }
}
