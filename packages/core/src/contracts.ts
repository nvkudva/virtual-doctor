// @vd/core — Agent response contracts (ARCHITECTURE §7.3).
//
// Single schema source (§3): every agent output parses against these Zod schemas. Parse
// failure → one automatic re-ask with the validation error appended → then graceful
// degradation (§7.3). Never show raw JSON or a stack to a user.
//
// Ported verbatim from the §7.3 field tables. The prototype's `action: 'approve'` is
// deliberately absent: voice can request changes, only the authenticated UI signs (§5.4,
// PRD D-9).

import { z } from 'zod';

/** Recommendation payload — attached to a Mira turn when a draft is produced (§7.3). */
export const RecommendationSchema = z.object({
  type: z.enum(['prescription', 'investigation', 'advice']),
  title: z.string(),
  summary: z.string(),
  items: z.array(
    z.object({
      name: z.string(),
      dosage: z.string(),
      timing: z.string(),
      notes: z.string(),
      why: z.string(),
      detail: z.string(),
    }),
  ),
  advice: z.string(),
  urgency: z.enum(['routine', 'soon', 'urgent']),
});

export type Recommendation = z.infer<typeof RecommendationSchema>;

/**
 * Patient mode — every turn (§7.3). `recommendation` is present (non-null) iff `done` is
 * true; enforced as a cross-field refinement so a malformed turn is rejected at the boundary.
 */
export const MiraPatientTurnSchema = z
  .object({
    reply: z.string(),
    note: z.string(),
    confidence: z.enum(['low', 'medium', 'high']),
    flags: z.array(z.string()),
    done: z.boolean(),
    recommendation: RecommendationSchema.nullable(),
    tone: z.enum(['reassuring', 'concerned', 'cheerful', 'neutral']).optional(),
  })
  .refine((t) => t.done === (t.recommendation !== null), {
    message: 'recommendation must be present iff done is true',
    path: ['recommendation'],
  });

export type MiraPatientTurn = z.infer<typeof MiraPatientTurnSchema>;

/** Citation into a source table (Coordinator mode, §7.3). */
export const CitationSchema = z.object({
  table: z.enum(['consults', 'prescriptions', 'consult_messages', 'patient_details']),
  id: z.string(),
  excerpt: z.string(),
});

export type Citation = z.infer<typeof CitationSchema>;

/**
 * Coordinator mode — every turn (§7.3). No `approve` action (approval is UI-only, §5.4).
 * `recommendation` is present (non-null) iff `action === 'edit'`.
 */
export const MiraCoordinatorTurnSchema = z
  .object({
    reply: z.string(),
    action: z.enum(['none', 'edit', 'answer']),
    recommendation: RecommendationSchema.nullable(),
    citations: z.array(CitationSchema),
  })
  .refine((t) => (t.action === 'edit') === (t.recommendation !== null), {
    message: "recommendation must be present iff action is 'edit'",
    path: ['recommendation'],
  });

export type MiraCoordinatorTurn = z.infer<typeof MiraCoordinatorTurnSchema>;
