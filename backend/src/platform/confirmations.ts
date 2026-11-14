// Confirmation flow (L3). The platform owns confirmation (DEC-018): it checks the
// proposal is pending, unexpired and allows this channel, refuses gestures during a
// camera stream (DEC-007), signs a UserConfirmation, marks the proposal decided
// *before* applying (single use), and never replays an apply of unknown outcome (DEC-008).
import { randomUUID } from "node:crypto";
import { validate, assertValid, type ActionResult, type UserConfirmation } from "../contracts.ts";
import { signJws, type SigningKeys } from "../crypto.ts";
import { PlatformError } from "../errors.ts";
import type { CapabilityRegistry } from "./registry.ts";
import type { LedgerEntry, Session } from "./store.ts";

export const APPLY_TIMEOUT_MS = 5000;

export interface ConfirmRequest {
  decision: "confirm" | "reject";
  channel: UserConfirmation["channel"];
  evidence: UserConfirmation["evidence"];
}

export async function confirmProposal(
  entry: LedgerEntry,
  session: Session | undefined,
  req: ConfirmRequest,
  deps: { registry: CapabilityRegistry; keys: SigningKeys },
): Promise<ActionResult> {
  const { proposal } = entry;
  if (entry.status !== "pending") throw new PlatformError("PROPOSAL_ALREADY_DECIDED", { capabilityId: entry.capabilityId });
  if (Date.parse(proposal.expires_at) <= Date.now()) throw new PlatformError("PROPOSAL_EXPIRED", { capabilityId: entry.capabilityId });
  if (!proposal.confirm_channels.includes(req.channel)) {
    throw new PlatformError("CONFIRM_CHANNEL_NOT_ALLOWED", { capabilityId: entry.capabilityId, detail: `channel ${req.channel}` });
  }
  const stream = session?.deviceState?.camera.stream;
  if (req.channel === "glasses_gesture" && (stream === "streaming" || stream === "starting")) {
    // A touchpad tap pauses an active stream, so a gesture now could be misread (DEC-007).
    throw new PlatformError("CONFIRM_CHANNEL_NOT_ALLOWED", { capabilityId: entry.capabilityId, detail: "gesture during active stream" });
  }

  const handsFree = req.channel === "voice_readback" || req.channel === "glasses_gesture";
  const claims: Omit<UserConfirmation, "signature"> = {
    schema: "platform.user_confirmation/v1",
    confirmation_id: `uc_${randomUUID().slice(0, 8)}`,
    proposal_id: proposal.proposal_id,
    payload_hash: proposal.payload_hash,
    decision: req.decision,
    channel: req.channel,
    // Whether the summary was read back is the platform's knowledge, not the client's claim.
    evidence: handsFree ? { ...req.evidence, readback_played: entry.readbackPlayed } : req.evidence,
    user_ref: entry.userRef,
    session_id: entry.sessionId,
    confirmed_at: new Date().toISOString(),
  };
  const confirmation: UserConfirmation = { ...claims, signature: signJws(claims, deps.keys) };
  const v = validate("user_confirmation", confirmation);
  if (!v.ok) throw new PlatformError("VALIDATION_FAILED", { capabilityId: entry.capabilityId, detail: v.errors.join("; ") });

  const cap = deps.registry.get(entry.capabilityId);
  if (!cap) throw new PlatformError("CAPABILITY_UNAVAILABLE", { capabilityId: entry.capabilityId });

  entry.status = req.decision === "confirm" ? "confirmed" : "rejected"; // single use, before apply

  let timer: NodeJS.Timeout | undefined;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new PlatformError("CAPABILITY_TIMEOUT", {
      status: 500, effectState: "unknown", capabilityId: entry.capabilityId,
      userMessage: { en: "I couldn't tell whether that was saved. Check your plan on the phone before trying again.",
        fi: "En tiedä, tallentuiko se. Tarkista suunnitelma puhelimesta ennen kuin yrität uudelleen." },
    })), APPLY_TIMEOUT_MS);
  });
  try {
    const result = await Promise.race([cap.adapter.onConfirmation(confirmation), timeout]);
    assertValid("action_result", result);
    return result;
  } finally {
    clearTimeout(timer);
  }
}
