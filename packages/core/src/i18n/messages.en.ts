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

  // Auth surfaces (§5.2, P1.3). Patient uses Google OAuth; doctor uses operator-provisioned
  // email/password (no self-signup).
  'auth.patient.title': 'Welcome',
  'auth.patient.subtitle': 'Sign in to start a consultation.',
  'auth.patient.google': 'Continue with Google',
  'auth.patient.signingIn': 'Opening Google…',
  'auth.doctor.title': 'Clinician sign-in',
  'auth.doctor.subtitle': 'Use the credentials issued by your hospital.',
  'auth.doctor.email': 'Email',
  'auth.doctor.password': 'Password',
  'auth.doctor.signIn': 'Sign in',
  'auth.doctor.signingIn': 'Signing in…',
  'auth.doctor.invalid': 'Email or password is incorrect.',
  'auth.doctor.noSelfSignup': 'Accounts are provisioned by your hospital administrator.',
  'auth.signOut': 'Sign out',

  // First-run profile wizard (§5.6, P1.3). Written to profiles + patient_details.
  'profile.title': 'Complete your profile',
  'profile.subtitle': 'We use this to personalise your care. You can update it later.',
  'profile.fullName': 'Full name',
  'profile.dob': 'Date of birth',
  'profile.sex': 'Sex',
  'profile.sex.female': 'Female',
  'profile.sex.male': 'Male',
  'profile.sex.other': 'Other',
  'profile.sex.undisclosed': 'Prefer not to say',
  'profile.bloodGroup': 'Blood group',
  'profile.bloodGroup.unknown': 'Not known',
  'profile.allergies': 'Allergies',
  'profile.conditions': 'Ongoing conditions',
  'profile.medications': 'Current medications',
  'profile.listHint': 'Separate multiple entries with commas.',
  'profile.save': 'Save and continue',
  'profile.saving': 'Saving…',
  'profile.error.required': 'Please enter your name and date of birth.',
  'profile.error.underage': 'You must be at least 18 to use this service.',
  'profile.error.save': "We couldn't save your profile. Please try again.",

  // Empty records surface shown after a patient completes their profile (P1.3 AC).
  'records.empty.title': 'No records yet',
  'records.empty.body': 'Your consultations and prescriptions will appear here.',

  // Doctor review queue, empty in P1.3 (populated in later phases).
  'doctor.queue.empty.title': 'No consultations to review',
  'doctor.queue.empty.body': 'Approved and pending consultations for your hospital appear here.',

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
