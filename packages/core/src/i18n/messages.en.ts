// @vd/core — English message catalog (ARCHITECTURE DEC-4, seam 4).
//
// English-only at launch, but EVERY user-facing string is defined here from day one so that
// adding a locale later is a data change, not a code change. Components never inline copy;
// they call `t(key)` (see ./index.ts). CI fails on hardcoded user-facing strings (P0.7).
//
// Keys are dotted, grouped by surface. Interpolation uses `{name}` placeholders resolved by
// `t()`. This scaffold seeds a few cross-cutting strings; each phase adds its own keys here.

export const messages = {
  'app.name': 'Virtual Doctor',
  'app.tagline': 'Care, in conversation.',

  'common.loading': 'Loading…',
  'common.retry': 'Try again',
  'common.cancel': 'Cancel',
  'common.close': 'Close',

  'error.generic': 'Something went wrong. Please try again.',
  'error.offline': "You're offline. Reconnecting…",

  // Consult status labels (§8.4 enum). Presentational copy for status pills.
  'consult.status.active': 'In progress',
  'consult.status.pending_review': 'Awaiting review',
  'consult.status.approved': 'Approved',
  'consult.status.rejected': 'Declined',
  'consult.status.escalated': 'Escalated',
  'consult.status.abandoned': 'Abandoned',
  'consult.status.expired': 'Expired',
  'consult.status.communicated': 'Sent to you',
  'consult.status.closed': 'Closed',
  'consult.status.superseded': 'Updated',
} as const satisfies Record<string, string>;

/** Every valid message key. Used to type `t()` so unknown keys fail at compile time. */
export type MessageKey = keyof typeof messages;
