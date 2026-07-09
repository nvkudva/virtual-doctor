// @vd/core — leaf package (ARCHITECTURE §4): consult state machine, Zod contracts, i18n
// catalog, tenant parsing. Depends on nothing internal.

export const CORE_PACKAGE = '@vd/core' as const;

// Consult state machine (§8.4)
export {
  CONSULT_STATUSES,
  CONSULT_TRANSITIONS,
  isTerminalStatus,
  canTransition,
  transition,
  InvalidConsultTransitionError,
  type ConsultStatus,
} from './state.js';

// Agent response contracts (§7.3)
export {
  RecommendationSchema,
  MiraPatientTurnSchema,
  MiraCoordinatorTurnSchema,
  CitationSchema,
  type Recommendation,
  type MiraPatientTurn,
  type MiraCoordinatorTurn,
  type Citation,
} from './contracts.js';

// i18n catalog (DEC-4, seam 4)
export { t, messages, type MessageKey, type MessageParams } from './i18n/index.js';

// Tenant resolution (§9, DEC-1)
export { parseHospitalSlug } from './tenant.js';

// Patient age rule (§5.6: 18+ enforced)
export { ageInYears, isAdult, MINIMUM_PATIENT_AGE } from './age.js';
