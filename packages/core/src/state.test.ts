import { describe, it, expect } from 'vitest';
import {
  CONSULT_STATUSES,
  CONSULT_TRANSITIONS,
  canTransition,
  isTerminalStatus,
  transition,
  InvalidConsultTransitionError,
  type ConsultStatus,
} from './state.js';

describe('consult state machine (§8.4)', () => {
  it('accepts every transition in the §8.4 table', () => {
    const allowed: Array<[ConsultStatus, ConsultStatus]> = [
      ['active', 'pending_review'],
      ['active', 'abandoned'],
      ['pending_review', 'approved'],
      ['pending_review', 'rejected'],
      ['pending_review', 'escalated'],
      ['pending_review', 'expired'],
      ['approved', 'communicated'],
      ['approved', 'superseded'],
      ['communicated', 'closed'],
    ];
    for (const [from, to] of allowed) {
      expect(canTransition(from, to)).toBe(true);
      expect(transition(from, to)).toBe(to);
    }
  });

  it('rejects transitions not in the table', () => {
    const disallowed: Array<[ConsultStatus, ConsultStatus]> = [
      ['active', 'approved'], // must go through pending_review
      ['active', 'closed'],
      ['pending_review', 'communicated'],
      ['approved', 'closed'], // must go through communicated
      ['approved', 'rejected'],
      ['communicated', 'superseded'],
      ['closed', 'active'],
      ['rejected', 'pending_review'],
    ];
    for (const [from, to] of disallowed) {
      expect(canTransition(from, to)).toBe(false);
      expect(() => transition(from, to)).toThrow(InvalidConsultTransitionError);
    }
  });

  it('never allows a self-transition', () => {
    for (const s of CONSULT_STATUSES) {
      expect(canTransition(s, s)).toBe(false);
    }
  });

  it('classifies terminal states correctly', () => {
    const terminal: ConsultStatus[] = [
      'rejected',
      'escalated',
      'abandoned',
      'expired',
      'closed',
      'superseded',
    ];
    const nonTerminal: ConsultStatus[] = [
      'active',
      'pending_review',
      'approved',
      'communicated',
    ];
    for (const s of terminal) expect(isTerminalStatus(s)).toBe(true);
    for (const s of nonTerminal) expect(isTerminalStatus(s)).toBe(false);
  });

  it('has a transition entry for every status (no orphans)', () => {
    for (const s of CONSULT_STATUSES) {
      expect(CONSULT_TRANSITIONS[s]).toBeDefined();
    }
    // Every target is itself a known status.
    for (const targets of Object.values(CONSULT_TRANSITIONS)) {
      for (const target of targets) {
        expect(CONSULT_STATUSES).toContain(target);
      }
    }
  });

  it('InvalidConsultTransitionError carries from/to', () => {
    try {
      transition('closed', 'active');
      expect.unreachable();
    } catch (e) {
      expect(e).toBeInstanceOf(InvalidConsultTransitionError);
      const err = e as InvalidConsultTransitionError;
      expect(err.from).toBe('closed');
      expect(err.to).toBe('active');
    }
  });
});
