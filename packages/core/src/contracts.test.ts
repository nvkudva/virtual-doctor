import { describe, it, expect } from 'vitest';
import {
  RecommendationSchema,
  MiraPatientTurnSchema,
  MiraCoordinatorTurnSchema,
  CitationSchema,
} from './contracts.js';

describe('RecommendationSchema (§7.3)', () => {
  const valid = {
    type: 'prescription',
    title: 'Amoxicillin course',
    summary: 'A 5-day antibiotic course for the throat infection.',
    items: [
      {
        name: 'Amoxicillin',
        dosage: '500mg',
        timing: 'Twice daily after food',
        notes: 'Complete the full course',
        why: 'Bacterial throat infection',
        detail: 'Stop and call if a rash appears.',
      },
    ],
    advice: 'Rest and drink fluids.',
    urgency: 'routine',
  };

  it('parses a well-formed recommendation', () => {
    expect(RecommendationSchema.parse(valid)).toMatchObject({ type: 'prescription' });
  });

  it('rejects an unknown type', () => {
    expect(RecommendationSchema.safeParse({ ...valid, type: 'surgery' }).success).toBe(false);
  });

  it('rejects an unknown urgency', () => {
    expect(RecommendationSchema.safeParse({ ...valid, urgency: 'whenever' }).success).toBe(false);
  });
});

describe('MiraPatientTurnSchema (§7.3 cross-field refine)', () => {
  const base = {
    reply: 'Can you tell me how long the fever has lasted?',
    note: 'Patient reports fever, day 2.',
    confidence: 'medium' as const,
    flags: [] as string[],
  };

  it('accepts done=false with recommendation=null', () => {
    const r = MiraPatientTurnSchema.safeParse({ ...base, done: false, recommendation: null });
    expect(r.success).toBe(true);
  });

  it('rejects done=true with recommendation=null', () => {
    const r = MiraPatientTurnSchema.safeParse({ ...base, done: true, recommendation: null });
    expect(r.success).toBe(false);
  });

  it('rejects done=false with a recommendation present', () => {
    const rec = {
      type: 'advice',
      title: 'Rest',
      summary: 'Take it easy.',
      items: [],
      advice: 'Rest up.',
      urgency: 'routine',
    };
    const r = MiraPatientTurnSchema.safeParse({ ...base, done: false, recommendation: rec });
    expect(r.success).toBe(false);
  });
});

describe('MiraCoordinatorTurnSchema (§7.3, no approve action)', () => {
  const base = { reply: 'Here is the draft.', citations: [] };

  it('accepts action=none with recommendation=null', () => {
    const r = MiraCoordinatorTurnSchema.safeParse({
      ...base,
      action: 'none',
      recommendation: null,
    });
    expect(r.success).toBe(true);
  });

  it('rejects action=edit with recommendation=null', () => {
    const r = MiraCoordinatorTurnSchema.safeParse({
      ...base,
      action: 'edit',
      recommendation: null,
    });
    expect(r.success).toBe(false);
  });

  it('has no "approve" action (approval is UI-only, D-9)', () => {
    const r = MiraCoordinatorTurnSchema.safeParse({
      ...base,
      action: 'approve',
      recommendation: null,
    });
    expect(r.success).toBe(false);
  });
});

describe('CitationSchema (§7.3)', () => {
  it('accepts a known table', () => {
    const r = CitationSchema.safeParse({ table: 'consults', id: 'c1', excerpt: 'fever day 2' });
    expect(r.success).toBe(true);
  });

  it('rejects an unknown table', () => {
    const r = CitationSchema.safeParse({ table: 'billing', id: 'b1', excerpt: 'x' });
    expect(r.success).toBe(false);
  });
});
