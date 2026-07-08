// @vd/core — Consult state machine (ARCHITECTURE §8.4).
//
// This is the single source of truth for consult lifecycle transitions. The DB trigger
// mirrors this table (§8.4: "Any transition not in list rejected at database"); UI state
// derives from the enum only — no shadow status fields. Every accepted transition is also
// recorded as a `status_change` row in `consult_events` by the same DB trigger.
//
// Port, don't redesign (§13): the transition table below is transcribed verbatim from the
// §8.4 diagram.

/**
 * Consult status enum. Mirrors the Postgres `consults.status` enum (§8.4). `abandoned` and
 * `expired` are timer-driven terminal states (§5.6).
 */
export const CONSULT_STATUSES = [
  'active',
  'pending_review',
  'approved',
  'rejected',
  'escalated',
  'abandoned',
  'expired',
  'communicated',
  'closed',
  'superseded',
] as const;

export type ConsultStatus = (typeof CONSULT_STATUSES)[number];

/**
 * Allowed transitions (ARCHITECTURE §8.4):
 *
 *   active         → pending_review | abandoned
 *   pending_review → approved | rejected | escalated | expired
 *   approved       → communicated | superseded
 *   communicated   → closed
 *
 * States with an empty target set are terminal (rejected, escalated, abandoned, expired,
 * closed, superseded). Any transition not listed here is rejected — at the database, and
 * here in the app for pre-flight UI logic.
 */
export const CONSULT_TRANSITIONS: Readonly<Record<ConsultStatus, readonly ConsultStatus[]>> = {
  active: ['pending_review', 'abandoned'],
  pending_review: ['approved', 'rejected', 'escalated', 'expired'],
  approved: ['communicated', 'superseded'],
  communicated: ['closed'],
  rejected: [],
  escalated: [],
  abandoned: [],
  expired: [],
  closed: [],
  superseded: [],
} as const;

/** True iff `status` has no outgoing transitions. */
export function isTerminalStatus(status: ConsultStatus): boolean {
  return CONSULT_TRANSITIONS[status].length === 0;
}

/** True iff moving from `from` to `to` is a permitted transition (§8.4). */
export function canTransition(from: ConsultStatus, to: ConsultStatus): boolean {
  return CONSULT_TRANSITIONS[from].includes(to);
}

/** Error thrown by {@link transition} for a disallowed move. */
export class InvalidConsultTransitionError extends Error {
  constructor(
    readonly from: ConsultStatus,
    readonly to: ConsultStatus,
  ) {
    super(`Invalid consult transition: ${from} → ${to}`);
    this.name = 'InvalidConsultTransitionError';
  }
}

/**
 * Pure transition function: returns `to` if the move is permitted, otherwise throws
 * {@link InvalidConsultTransitionError}. No side effects — the DB trigger performs the
 * authoritative write; this mirrors it for client-side guards.
 */
export function transition(from: ConsultStatus, to: ConsultStatus): ConsultStatus {
  if (!canTransition(from, to)) {
    throw new InvalidConsultTransitionError(from, to);
  }
  return to;
}
