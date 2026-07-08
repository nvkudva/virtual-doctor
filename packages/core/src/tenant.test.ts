import { describe, it, expect } from 'vitest';
import { parseHospitalSlug } from './tenant.js';

const DOMAIN = 'vd.app';

describe('parseHospitalSlug (§9, DEC-1)', () => {
  it('extracts the leftmost label as the slug', () => {
    expect(parseHospitalSlug('clinic.vd.app', DOMAIN)).toBe('clinic');
    expect(parseHospitalSlug('st-marys.vd.app', DOMAIN)).toBe('st-marys');
  });

  it('lowercases and strips a port', () => {
    expect(parseHospitalSlug('Clinic.VD.App:5173', DOMAIN)).toBe('clinic');
  });

  it('returns null for the apex domain itself', () => {
    expect(parseHospitalSlug('vd.app', DOMAIN)).toBeNull();
  });

  it('returns null for a host not under the domain', () => {
    expect(parseHospitalSlug('clinic.example.com', DOMAIN)).toBeNull();
  });

  it('returns null for multi-level subdomains', () => {
    expect(parseHospitalSlug('a.b.vd.app', DOMAIN)).toBeNull();
  });

  it('returns null for reserved labels', () => {
    for (const label of ['www', 'app', 'api', 'admin']) {
      expect(parseHospitalSlug(`${label}.vd.app`, DOMAIN)).toBeNull();
    }
  });

  it('returns null for malformed labels', () => {
    expect(parseHospitalSlug('-bad.vd.app', DOMAIN)).toBeNull();
    expect(parseHospitalSlug('bad-.vd.app', DOMAIN)).toBeNull();
    expect(parseHospitalSlug('.vd.app', DOMAIN)).toBeNull();
  });

  it('returns null for empty inputs', () => {
    expect(parseHospitalSlug('', DOMAIN)).toBeNull();
    expect(parseHospitalSlug('clinic.vd.app', '')).toBeNull();
  });
});
