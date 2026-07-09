import { describe, it, expect } from 'vitest';
import { ageInYears, isAdult, MINIMUM_PATIENT_AGE } from './age.js';

// A fixed "today" so the tests never depend on the wall clock.
const NOW = new Date(2026, 6, 9); // 2026-07-09 (local midnight)

describe('ageInYears (§5.6)', () => {
  it('counts whole years by the calendar', () => {
    expect(ageInYears('2000-07-09', NOW)).toBe(26);
    expect(ageInYears('1990-01-01', NOW)).toBe(36);
  });

  it('does not count a birthday that has not occurred yet this year', () => {
    expect(ageInYears('2008-07-10', NOW)).toBe(17); // birthday is tomorrow
    expect(ageInYears('2008-07-09', NOW)).toBe(18); // birthday is today
    expect(ageInYears('2008-08-01', NOW)).toBe(17); // birthday next month
  });

  it('accepts a Date as well as an ISO string', () => {
    expect(ageInYears(new Date(2000, 6, 9), NOW)).toBe(26);
  });

  it('returns NaN for a malformed or impossible date', () => {
    expect(ageInYears('not-a-date', NOW)).toBeNaN();
    expect(ageInYears('2001-02-30', NOW)).toBeNaN(); // Feb 30 does not exist
    expect(ageInYears('2001-13-01', NOW)).toBeNaN(); // month 13
    expect(ageInYears('01-01-2001', NOW)).toBeNaN(); // wrong shape
  });
});

describe('isAdult (§5.6)', () => {
  it('is true on and after the 18th birthday', () => {
    expect(isAdult('2008-07-09', NOW)).toBe(true); // turns 18 today
    expect(isAdult('2000-01-01', NOW)).toBe(true);
  });

  it('is false the day before the 18th birthday', () => {
    expect(isAdult('2008-07-10', NOW)).toBe(false); // 17, birthday tomorrow
  });

  it('rejects a future date of birth', () => {
    expect(isAdult('2030-01-01', NOW)).toBe(false);
  });

  it('rejects an unparseable date of birth', () => {
    expect(isAdult('garbage', NOW)).toBe(false);
  });

  it('gate is 18 (§5.6)', () => {
    expect(MINIMUM_PATIENT_AGE).toBe(18);
  });
});
