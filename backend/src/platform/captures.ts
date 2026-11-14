// Ephemeral capture store (L7). Images live only as long as the capability's declared
// retention allows; for 'observation' delivery with retention 0 the image is deleted as
// soon as the label has been read. Revoking a grant deletes everything made under it.
import type { ContextCapture, Observation } from "../contracts.ts";

export const CAPTURE_TTL_MS = 10 * 60 * 1000;

interface StoredCapture {
  capture: ContextCapture;
  userRef: string;
  image?: Buffer;
  observation?: Observation;
  expiresAt: number;
}

export class CaptureStore {
  private readonly items = new Map<string, StoredCapture>();
  /** capture_id → grant id, kept after a revoke-purge so later use reports CONSENT_REVOKED. */
  private readonly purged = new Map<string, string>();

  put(capture: ContextCapture, userRef: string, image: Buffer): void {
    this.items.set(capture.capture_id, { capture, userRef, image, expiresAt: Date.now() + CAPTURE_TTL_MS });
  }

  setObservation(captureId: string, observation: Observation): void {
    const s = this.items.get(captureId);
    if (s) s.observation = observation;
  }

  deleteImage(captureId: string): void {
    const s = this.items.get(captureId);
    if (s) delete s.image;
  }

  hasImage(captureId: string): boolean {
    return this.items.get(captureId)?.image !== undefined;
  }

  get(userRef: string, captureId: string): StoredCapture | undefined {
    const s = this.items.get(captureId);
    if (!s || s.userRef !== userRef) return undefined;
    if (Date.now() > s.expiresAt) {
      this.items.delete(captureId);
      return undefined;
    }
    return s;
  }

  purgedUnderGrant(captureId: string): string | undefined {
    return this.purged.get(captureId);
  }

  purgeGrant(grantId: string): number {
    let n = 0;
    for (const [id, s] of this.items) {
      if (s.capture.consent_grant_id === grantId) {
        this.items.delete(id);
        this.purged.set(id, grantId);
        n++;
      }
    }
    return n;
  }
}
