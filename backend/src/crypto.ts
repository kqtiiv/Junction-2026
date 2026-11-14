// Canonical JSON, payload hashing and ES256 compact JWS for UserConfirmation.
// The platform signs; capabilities verify with the platform's public key.
import { createHash, generateKeyPairSync, createPrivateKey, createPublicKey, sign, verify, type KeyObject } from "node:crypto";

/** Deterministic JSON: sorted object keys, no whitespace. Arrays keep their order. */
export function canonicalJson(value: unknown): string {
  if (value === null || typeof value !== "object") return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(",")}]`;
  const entries = Object.entries(value as Record<string, unknown>)
    .filter(([, v]) => v !== undefined)
    .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0));
  return `{${entries.map(([k, v]) => `${JSON.stringify(k)}:${canonicalJson(v)}`).join(",")}}`;
}

/** "sha256:<hex>" over the canonical JSON of the value (contracts Sha256 format). */
export function payloadHash(value: unknown): string {
  return `sha256:${createHash("sha256").update(canonicalJson(value)).digest("hex")}`;
}

const b64url = (b: Buffer | string) => Buffer.from(b).toString("base64url");

export interface SigningKeys { privateKey: KeyObject; publicKey: KeyObject; kid: string }

/** Loads a PEM key from env (PLATFORM_SIGNING_KEY_PEM) or generates an ephemeral dev key. */
export function loadSigningKeys(pem?: string): SigningKeys {
  if (pem) {
    const privateKey = createPrivateKey(pem);
    return { privateKey, publicKey: createPublicKey(privateKey), kid: "platform-1" };
  }
  const { privateKey, publicKey } = generateKeyPairSync("ec", { namedCurve: "P-256" });
  return { privateKey, publicKey, kid: "platform-dev-ephemeral" };
}

/** Compact JWS (ES256) over the canonical JSON of `claims`. */
export function signJws(claims: unknown, keys: SigningKeys): string {
  const header = b64url(JSON.stringify({ alg: "ES256", kid: keys.kid, typ: "JWT" }));
  const payload = b64url(canonicalJson(claims));
  const sig = sign("sha256", Buffer.from(`${header}.${payload}`), { key: keys.privateKey, dsaEncoding: "ieee-p1363" });
  return `${header}.${payload}.${b64url(sig)}`;
}

/** Verifies a compact JWS and that its payload equals the canonical JSON of `expectedClaims`. */
export function verifyJws(jws: string, expectedClaims: unknown, publicKey: KeyObject): boolean {
  const parts = jws.split(".");
  if (parts.length !== 3) return false;
  const [header, payload, sig] = parts as [string, string, string];
  const ok = verify("sha256", Buffer.from(`${header}.${payload}`), { key: publicKey, dsaEncoding: "ieee-p1363" }, Buffer.from(sig, "base64url"));
  return ok && Buffer.from(payload, "base64url").toString() === canonicalJson(expectedClaims);
}
