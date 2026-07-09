// @vd/api — data layer (ARCHITECTURE §4): TanStack Query hooks over @supabase/supabase-js.
// May import @vd/core only. Populated in later phases.

export const API_PACKAGE = '@vd/api' as const;

// Per-module namespaced Supabase client (§5.2).
export {
  createModuleClient,
  moduleStorageKey,
  type AppModule,
  type ModuleClientConfig,
  type SupabaseClient,
  type Session,
  type User,
} from './client.js';

// §8.2 contracts-are-law: generated Postgres types are the committed source of truth for
// the DB shape. Regenerate with `supabase gen types typescript --local`; CI fails if stale.
export type {
  Database,
  Json,
  Tables,
  TablesInsert,
  TablesUpdate,
  Enums,
  CompositeTypes,
} from './database.types';
export { Constants } from './database.types';
