// apps/web — the app's concrete Supabase clients (ARCHITECTURE §5.2).
//
// @vd/api's `createModuleClient` is deliberately env-agnostic; this is the one place that
// reads Vite build-time env and passes it in. Two clients are created — one per module — each
// with its own `auth.storageKey`, so a patient session and a doctor session never collide on
// the shared origin (DEC-1 path routing).
//
// Env: VITE_SUPABASE_URL + VITE_SUPABASE_ANON_KEY (see .env.example). Both are public: the
// anon key is browser-safe and every read/write is still gated by RLS (§8.1). When env is
// missing (e.g. a Phase-0-style build), `isSupabaseConfigured` is false and the modules render
// a configuration notice instead of throwing at import time.

import { createModuleClient, type SupabaseClient } from '@vd/api';
import type { Database } from '@vd/api';

const url = import.meta.env.VITE_SUPABASE_URL?.trim() ?? '';
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY?.trim() ?? '';

/** True when both Supabase env vars are present, so a client can actually connect. */
export const isSupabaseConfigured = url.length > 0 && anonKey.length > 0;

// Create the clients lazily-but-once. If env is absent we still want the app to load (the
// modules gate on `isSupabaseConfigured`), so fall back to harmless placeholder values that
// never get used for a real request.
const config = {
  url: isSupabaseConfigured ? url : 'http://localhost',
  anonKey: isSupabaseConfigured ? anonKey : 'anon',
};

/** Patient-module client (Google OAuth session under the `vd-auth-patient` storage key). */
export const patientClient: SupabaseClient<Database> = createModuleClient('patient', config);

/** Doctor-module client (email/password session under the `vd-auth-doctor` storage key). */
export const doctorClient: SupabaseClient<Database> = createModuleClient('doctor', config);
