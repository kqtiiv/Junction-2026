// In-memory platform stores (L7). Behind small classes so a database can replace them
// without touching routes. Everything is scoped by user_ref.
import { randomUUID } from "node:crypto";
import type { ActionProposal, DeviceSessionState, DomainResponseEvent } from "../contracts.ts";

export interface Session {
  sessionId: string;
  userRef: string;
  conversationRef: string;
  mode: "glasses" | "phone_only";
  locale: string;
  createdAt: string;
  deviceState?: DeviceSessionState;
  /** Last events of the last completed turn, for "repeat". */
  lastTurnEvents?: DomainResponseEvent[];
  /** Abort controller of the turn in flight, for "stop" (DEC-011). */
  inFlight?: { turnId: string; controller: AbortController };
}

export type ProposalStatus = "pending" | "confirmed" | "rejected";

export interface LedgerEntry {
  proposal: ActionProposal;
  userRef: string;
  sessionId: string;
  capabilityId: string;
  status: ProposalStatus;
  /** True once the spoken summary was delivered with speech output enabled. */
  readbackPlayed: boolean;
}

export class SessionStore {
  private readonly sessions = new Map<string, Session>();

  create(userRef: string, mode: Session["mode"], locale: string): Session {
    const s: Session = {
      sessionId: `ses_${randomUUID().slice(0, 8)}`,
      userRef,
      conversationRef: `conv_${randomUUID().slice(0, 8)}`,
      mode,
      locale,
      createdAt: new Date().toISOString(),
    };
    this.sessions.set(s.sessionId, s);
    return s;
  }

  /** Returns the session only if it belongs to this user. */
  get(sessionId: string, userRef: string): Session | undefined {
    const s = this.sessions.get(sessionId);
    return s && s.userRef === userRef ? s : undefined;
  }

  /** Keeps the snapshot with the highest seq; returns false if this one was stale. */
  putDeviceState(session: Session, state: DeviceSessionState): boolean {
    if (session.deviceState && state.seq <= session.deviceState.seq) return false;
    session.deviceState = state;
    session.mode = state.mode;
    return true;
  }
}

export class ProposalLedger {
  private readonly entries = new Map<string, LedgerEntry>();

  register(entry: Omit<LedgerEntry, "status">): void {
    this.entries.set(entry.proposal.proposal_id, { ...entry, status: "pending" });
  }

  get(proposalId: string, userRef: string): LedgerEntry | undefined {
    const e = this.entries.get(proposalId);
    return e && e.userRef === userRef ? e : undefined;
  }
}

export class TurnLog {
  private readonly completed = new Map<string, DomainResponseEvent[]>();

  key(userRef: string, turnId: string): string {
    return `${userRef}:${turnId}`;
  }

  get(userRef: string, turnId: string): DomainResponseEvent[] | undefined {
    return this.completed.get(this.key(userRef, turnId));
  }

  set(userRef: string, turnId: string, events: DomainResponseEvent[]): void {
    this.completed.set(this.key(userRef, turnId), events);
  }
}
