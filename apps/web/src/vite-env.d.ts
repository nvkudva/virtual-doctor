/// <reference types="vite/client" />

// Typed build-time env (§P0.7): declaring the custom `VITE_*` keys turns `import.meta.env.*`
// from `any` into `string | undefined`, so shell code reads env without unsafe-any lint errors.
interface ImportMetaEnv {
  /** MVP-0 active-hospital slug; falls back to the pilot when unset (shell/hospital.ts). */
  readonly VITE_VD_HOSPITAL_SLUG?: string;
  /** Supabase origin for the runtime preconnect hint; dormant until set (shell/resource-hints.ts). */
  readonly VITE_SUPABASE_URL?: string;
  /** Supabase anon (publishable) key. Public, RLS-gated; used by the per-module clients (§5.2). */
  readonly VITE_SUPABASE_ANON_KEY?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
