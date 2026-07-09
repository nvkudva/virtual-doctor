// @vd/core — patient age rule (ARCHITECTURE §5.6: "18+ enforced").
//
// Single source of truth for the adulthood gate. The profile wizard uses it to reject an
// under-18 date of birth client-side; the DB mirrors the same rule with a CHECK constraint
// on `patient_details.dob` (§13 "port, don't redesign" — the two must agree). Pure and
// calendar-based: no timezones, no clock beyond the `now` you pass in, so it is trivially
// unit-testable.

/** The minimum age, in whole years, to self-register as a patient (§5.6). */
export const MINIMUM_PATIENT_AGE = 18 as const;

/**
 * Whole years elapsed from `dob` to `now`, by the calendar (a birthday that has not yet
 * occurred this year does not count). Both dates are read in their local calendar fields, so
 * the result does not depend on the time of day or timezone.
 *
 * @param dob   Date of birth. A `YYYY-MM-DD` string (as stored in Postgres `date`) or a Date.
 * @param now   The reference "today" (defaults to the current date).
 * @returns Age in whole years, or `NaN` if `dob` is not a valid date.
 */
export function ageInYears(dob: string | Date, now: Date = new Date()): number {
  const birth = typeof dob === 'string' ? parseIsoDate(dob) : dob;
  if (birth === null || Number.isNaN(birth.getTime())) return Number.NaN;

  let age = now.getFullYear() - birth.getFullYear();
  // Subtract a year if this year's birthday hasn't been reached yet.
  const monthDelta = now.getMonth() - birth.getMonth();
  if (monthDelta < 0 || (monthDelta === 0 && now.getDate() < birth.getDate())) {
    age -= 1;
  }
  return age;
}

/**
 * Whether a date of birth clears the §5.6 adulthood gate. A future or unparseable `dob`
 * (age `NaN` or negative) is not an adult.
 */
export function isAdult(dob: string | Date, now: Date = new Date()): boolean {
  const age = ageInYears(dob, now);
  return Number.isFinite(age) && age >= MINIMUM_PATIENT_AGE;
}

/**
 * Parse a strict `YYYY-MM-DD` calendar date into a local-midnight Date. Returns null for any
 * other shape, and null (not a rolled-over date) when the fields don't form a real day —
 * e.g. `2001-02-30`. Kept private: callers use {@link ageInYears} / {@link isAdult}.
 */
function parseIsoDate(value: string): Date | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value.trim());
  if (match === null) return null;
  const [, y, m, d] = match;
  const year = Number(y);
  const month = Number(m);
  const day = Number(d);
  const date = new Date(year, month - 1, day);
  // Reject overflow (e.g. month 13, Feb 30): the constructed date must round-trip.
  if (
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day
  ) {
    return null;
  }
  return date;
}
