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

  constructor() {
    assertValid("model_provider", this.provider);
  }

  async read(capture: ContextCapture): Promise<Observation> {
    const obs: Observation = {
      ...structuredClone(this.template),
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
