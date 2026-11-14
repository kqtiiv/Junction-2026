// Entry point: wires the S-Bank Coach capability (fast path on fixture data until the
// Coach team's agent exists) into the platform orchestrator and starts listening.
import { SBankCoachAdapter } from "./capabilities/sbank-coach/adapter.ts";
import { DeterministicFastPath } from "./capabilities/sbank-coach/fast-path.ts";
import { FixtureFinanceEngine } from "./capabilities/sbank-coach/fixture-engine.ts";
import { loadSigningKeys } from "./crypto.ts";
import { CapabilityRegistry } from "./platform/registry.ts";
import { buildServer } from "./server.ts";

export function wire(opts: { tokens?: string; signingKeyPem?: string } = {}) {
  const keys = loadSigningKeys(opts.signingKeyPem);
  const engine = new FixtureFinanceEngine();
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
  const { keys, registry, tokens } = wire({ tokens: process.env.DEV_TOKENS, signingKeyPem: process.env.PLATFORM_SIGNING_KEY_PEM });
  if (!process.env.DEV_TOKENS) console.warn("DEV_TOKENS not set: using the demo token 'demo-token' for user u_7f3a.");
  if (!process.env.PLATFORM_SIGNING_KEY_PEM) console.warn("PLATFORM_SIGNING_KEY_PEM not set: using an ephemeral signing key.");
  const app = buildServer({ registry, keys, tokens, logger: true });
  const port = Number(process.env.PORT ?? 8787);
  await app.listen({ host: "0.0.0.0", port });
}
