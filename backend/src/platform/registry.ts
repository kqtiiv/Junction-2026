// Capability registry and router (L3). Capabilities are chosen from the transcript,
// because voice invocation names only the app (DEC-021).
import type { AgentOrchestratorAdapter } from "../../../contracts/interfaces/adapter.ts";
import { validate, type DomainCapability } from "../contracts.ts";
import { PlatformError } from "../errors.ts";

interface Registered { adapter: AgentOrchestratorAdapter; manifest: DomainCapability; keywords: Set<string> }

const tokens = (s: string) => s.toLowerCase().normalize("NFC").split(/[^\p{L}\p{N}]+/u).filter((t) => t.length > 2);

export class CapabilityRegistry {
  private readonly caps = new Map<string, Registered>();

  register(adapter: AgentOrchestratorAdapter): void {
    const manifest = adapter.manifest();
    const v = validate("capability_manifest", manifest);
    if (!v.ok) throw new Error(`Manifest for ${manifest.capability_id} rejected: ${v.errors.join("; ")}`);
    const keywords = new Set(manifest.intents.flatMap((i) => i.examples.flatMap((e) => Object.values(e).flatMap((t) => (t ? tokens(t) : [])))));
    this.caps.set(manifest.capability_id, { adapter, manifest, keywords });
  }

  get(capabilityId: string): Registered | undefined {
    return this.caps.get(capabilityId);
  }

  all(): Registered[] {
    return [...this.caps.values()];
  }

  /** Hint → active capability → keyword match on manifest examples → the only capability. */
  route(transcript: string | undefined, hint: string | null, active: string | null): Registered {
    for (const id of [hint, active]) {
      const r = id ? this.caps.get(id) : undefined;
      if (r) return r;
    }
    const words = tokens(transcript ?? "");
    let best: { r: Registered; score: number } | undefined;
    for (const r of this.caps.values()) {
      const score = words.filter((w) => r.keywords.has(w)).length;
      if (score > 0 && (!best || score > best.score)) best = { r, score };
    }
    if (best) return best.r;
    if (this.caps.size === 1) return [...this.caps.values()][0]!;
    throw new PlatformError("CAPABILITY_NOT_FOUND");
  }
}
