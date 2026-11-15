// Entry point: wires the money-coach capability (fast path on fixture data until the
// Coach team's agent exists) into the platform orchestrator and starts listening.
import { SBankCoachAdapter } from "./capabilities/sbank-coach/adapter.ts";
import { DeterministicFastPath } from "./capabilities/sbank-coach/fast-path.ts";
import type { FinanceEngine } from "./capabilities/sbank-coach/finance-engine.ts";
import { FIXTURE_SCENARIOS, FixtureFinanceEngine, type FixtureScenario } from "./capabilities/sbank-coach/fixture-engine.ts";
import { SPankkiFinanceEngine } from "./capabilities/sbank-coach/s-pankki-engine.ts";
import { UserStatedFinanceEngine } from "./capabilities/sbank-coach/user-stated-engine.ts";
import { loadSigningKeys } from "./crypto.ts";
import { FixtureLabelReader, LABEL_FIXTURES, type LabelFixture } from "./platform/label-reader.ts";
import { CapabilityRegistry } from "./platform/registry.ts";
import { buildServer } from "./server.ts";

/**
 * FINANCE_SOURCE selects where money figures come from:
 *   fixture      demo numbers from contracts/examples (default; always reported as mock)
 *   user_stated  no bank data: the user's weekly amount, asked for once by voice when first needed
 *   s_pankki     the team's money engine on the Junction 2026 synthetic dataset, via finance-engine/ at
 *                FINANCE_ENGINE_URL (default http://127.0.0.1:8790); answers until payday (DEC-024, DEC-025)
 */
export function makeEngine(source = "fixture", engineUrl = "http://127.0.0.1:8790", scenario = "default"): FinanceEngine {
  if (source === "user_stated") return new UserStatedFinanceEngine();
  if (source === "s_pankki") return new SPankkiFinanceEngine(engineUrl);
  if (source !== "fixture") throw new Error(`Unknown FINANCE_SOURCE ${source}`);
  if (!FIXTURE_SCENARIOS.includes(scenario as FixtureScenario)) throw new Error(`Unknown FIXTURE_SCENARIO ${scenario} (one of ${FIXTURE_SCENARIOS.join(", ")})`);
  return new FixtureFinanceEngine({ scenario: scenario as FixtureScenario });
}

/**
 * LABEL_FIXTURE_SEQUENCE: what the fixture label reader returns, capture by capture, cycling per user.
 * Default "clear" (the €79.90 headphones). The demo uses "clear,ambiguous" (DEC-030).
 */
export function makeLabelReader(sequence = "clear"): FixtureLabelReader {
  const items = sequence.split(",").map((x) => x.trim()).filter(Boolean);
  for (const i of items) if (!LABEL_FIXTURES.includes(i as LabelFixture)) throw new Error(`Unknown label fixture ${i} (one of ${LABEL_FIXTURES.join(", ")})`);
  return new FixtureLabelReader(items as LabelFixture[]);
}

export function wire(opts: { tokens?: string; signingKeyPem?: string; financeSource?: string; financeEngineUrl?: string; fixtureScenario?: string } = {}) {
  const keys = loadSigningKeys(opts.signingKeyPem);
  const engine = makeEngine(opts.financeSource, opts.financeEngineUrl, opts.fixtureScenario);
  const fastPath = new DeterministicFastPath(engine, keys.publicKey);
  const registry = new CapabilityRegistry();
  registry.register(new SBankCoachAdapter({ engine, fastPath }));
  const tokens = new Map(
    (opts.tokens ?? "demo-token:u_7f3a").split(",").map((pair) => pair.split(":") as [string, string]),
  );
  return { keys, engine, fastPath, registry, tokens };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  if (process.env.NODE_ENV === "production" && (!process.env.DEV_TOKENS || !process.env.PLATFORM_SIGNING_KEY_PEM)) {
    // Never serve a public URL with the well-known demo token or a key that changes on restart.
    console.error("Refusing to start: set DEV_TOKENS and PLATFORM_SIGNING_KEY_PEM in production.");
    process.exit(1);
  }
  const { keys, registry, tokens, engine } = wire({ tokens: process.env.DEV_TOKENS, signingKeyPem: process.env.PLATFORM_SIGNING_KEY_PEM, financeSource: process.env.FINANCE_SOURCE, financeEngineUrl: process.env.FINANCE_ENGINE_URL, fixtureScenario: process.env.FIXTURE_SCENARIO });
  const labelReader = makeLabelReader(process.env.LABEL_FIXTURE_SEQUENCE);
  console.log(`Finance source: ${engine.source}${engine.mock ? " (mock)" : ""}`);
  if (!process.env.DEV_TOKENS) console.warn("DEV_TOKENS not set: using the demo token 'demo-token' for user u_7f3a.");
  if (!process.env.PLATFORM_SIGNING_KEY_PEM) console.warn("PLATFORM_SIGNING_KEY_PEM not set: using an ephemeral signing key.");
  if (process.env.FIXTURE_SCENARIO) console.log(`Fixture scenario: ${process.env.FIXTURE_SCENARIO} (synthetic)`);
  if (process.env.LABEL_FIXTURE_SEQUENCE) console.log(`Label fixtures: ${process.env.LABEL_FIXTURE_SEQUENCE} (mock label reader)`);
  const app = buildServer({ registry, keys, tokens, logger: true, labelReader });
  const port = Number(process.env.PORT ?? 8787);
  await app.listen({ host: "0.0.0.0", port });
}
