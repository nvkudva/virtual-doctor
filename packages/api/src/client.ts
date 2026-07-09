// @vd/api — per-module namespaced Supabase client (ARCHITECTURE §5.2).
//
// Patient and doctor modules ship to the SAME origin (DEC-1 path routing: /patient, /doctor).
// A single default Supabase client would persist its session under one shared localStorage
// key, so signing in as a doctor would clobber a patient session in another tab and vice
// versa. Each module therefore gets its own client with a distinct `auth.storageKey`, giving
// app-level session separation on the shared origin.
//
// This factory is env-agnostic on purpose: it takes { url, anonKey } as arguments rather than
// reading `import.meta.env`, so @vd/api stays free of Vite/DOM globals (its tsconfig has no
// `vite/client` types) and remains unit-testable. The web app reads env and passes it in
// (apps/web/src/supabase.ts).

import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type { Database } from './database.types.js';

/** The two app modules that own independent sessions on the shared origin (DEC-1). */
export type AppModule = 'patient' | 'doctor';

/** Connection parameters for a module client. The anon key is a public, RLS-gated key. */
export interface ModuleClientConfig {
  /** Supabase project URL, e.g. `https://xyz.supabase.co` or the local `http://127.0.0.1:54421`. */
  url: string;
  /** The anon (publishable) key. Safe for the browser; all access is still gated by RLS. */
  anonKey: string;
}

/**
 * localStorage key under which a module persists its auth session. Namespacing by module is
 * what keeps patient and doctor sessions from colliding on the shared origin (§5.2).
 */
export function moduleStorageKey(module: AppModule): string {
  return `vd-auth-${module}`;
}

/**
 * Create the Supabase client for one app module. Typed to the committed `Database` contract
 * (§8.2) so every query is checked against the real schema. The `storageKey` isolates this
 * module's session; `persistSession` + `autoRefreshToken` give a normal browser SPA session.
 */
export function createModuleClient(
  module: AppModule,
  config: ModuleClientConfig,
): SupabaseClient<Database> {
  return createClient<Database>(config.url, config.anonKey, {
    auth: {
      storageKey: moduleStorageKey(module),
      persistSession: true,
      autoRefreshToken: true,
      // The patient OAuth redirect lands back on our origin with the code in the URL; let the
      // client complete the exchange. Harmless for the doctor password flow.
      detectSessionInUrl: true,
      flowType: 'pkce',
    },
  });
}

export type { SupabaseClient, Session, User } from '@supabase/supabase-js';
