// Consent registry (L3, ARCHITECTURE.md §2.5). Fail closed: no active grant, no data.
// Minimal grant model; the full ConsentGrant contract is still proposed (DEC-014).
import { randomUUID } from "node:crypto";
import type { DomainCapability } from "../contracts.ts";
import { PlatformError } from "../errors.ts";

export interface ConsentGrant {
  consent_grant_id: string;
  user_ref: string;
  capability_id: string;
  data_classes: string[];
  purposes: string[];
  granted_at: string;
  revoked_at?: string;
}

export class ConsentRegistry {
  private readonly grants = new Map<string, ConsentGrant>();

  grant(userRef: string, manifest: DomainCapability, dataClasses: string[], purposes: string[]): ConsentGrant {
    const knownClasses = new Set(manifest.data_classes);
    const knownPurposes = new Set(manifest.capture_purposes.map((p) => p.purpose));
    const badClass = dataClasses.find((c) => !knownClasses.has(c));
    const badPurpose = purposes.find((p) => !knownPurposes.has(p));
    if (dataClasses.length === 0 || badClass || badPurpose) {
      throw new PlatformError("VALIDATION_FAILED", { detail: `undeclared data class or purpose: ${badClass ?? badPurpose ?? "(none)"}` });
    }
    const g: ConsentGrant = {
      consent_grant_id: `cg_${randomUUID().slice(0, 8)}`,
      user_ref: userRef,
      capability_id: manifest.capability_id,
      data_classes: [...new Set(dataClasses)],
      purposes: [...new Set(purposes)],
      granted_at: new Date().toISOString(),
    };
    this.grants.set(g.consent_grant_id, g);
    return g;
  }

  /** Returns the grant if this user owns it (revoked or not). */
  get(userRef: string, grantId: string): ConsentGrant | undefined {
    const g = this.grants.get(grantId);
    return g && g.user_ref === userRef ? g : undefined;
  }

  revoke(userRef: string, grantId: string): ConsentGrant {
    const g = this.get(userRef, grantId);
    if (!g) throw new PlatformError("VALIDATION_FAILED", { status: 404, detail: "unknown consent grant" });
    g.revoked_at ??= new Date().toISOString();
    return g;
  }

  /** The grant must exist, be active, and cover the capture purpose. */
  requireForCapture(userRef: string, grantId: string, purpose: string): ConsentGrant {
    const g = this.get(userRef, grantId);
    if (!g) throw new PlatformError("CONSENT_REQUIRED", { detail: "unknown grant" });
    if (g.revoked_at) throw new PlatformError("CONSENT_REVOKED", { capabilityId: g.capability_id });
    if (!g.purposes.includes(purpose)) throw new PlatformError("CONSENT_REQUIRED", { capabilityId: g.capability_id, detail: `purpose ${purpose} not granted` });
    return g;
  }

  /** A domain turn needs at least one active grant for the capability. */
  requireForCapability(userRef: string, capabilityId: string): void {
    for (const g of this.grants.values()) {
      if (g.user_ref === userRef && g.capability_id === capabilityId && !g.revoked_at) return;
    }
    throw new PlatformError("CONSENT_REQUIRED", { capabilityId });
  }
}
