// Seeded hospital config (ARCHITECTURE §12 Phase 0, MVP-0). Phase 0 has no DB read:
// the single pilot hospital is seeded *statically* here and selected by an env-configured
// slug (VITE_VD_HOSPITAL_SLUG). The shape mirrors the future public-readable `hospitals`
// row (id/slug/name/logo_url/theme, ARCHITECTURE §9) so Phase-6's `tenant-manifest` fetch
// drops in without touching the shell — the shell only ever sees a `HospitalConfig`.
//
// `theme` is a map of design-token CSS-var overrides (§10.1 rule 3 — per-hospital accent on
// top of the shared token set, never new tokens). The shell applies them to `:root`.

/** A per-hospital override of a `@vd/theme` design token, e.g. `'--vd-accent'`. */
export type ThemeTokenOverride = `--vd-${string}`;

export interface HospitalConfig {
  readonly id: string;
  readonly slug: string;
  readonly name: string;
  readonly logoUrl: string | null;
  /** CSS-var overrides applied to `:root` on top of the shared token set. */
  readonly theme: Readonly<Record<ThemeTokenOverride, string>>;
}

// Static seed registry. One pilot hospital in MVP-0; more slugs are additive rows here
// until Phase 6 replaces this lookup with the `tenant-manifest` Edge Function.
const SEED_HOSPITALS: Readonly<Record<string, HospitalConfig>> = {
  citycare: {
    id: 'seed-citycare',
    slug: 'citycare',
    name: 'CityCare Hospital',
    logoUrl: null,
    theme: {
      '--vd-accent': 'oklch(0.6 0.15 200)',
      '--vd-accent-strong': 'oklch(0.52 0.16 200)',
    },
  },
};

const DEFAULT_SLUG = 'citycare';

/**
 * Resolve the active hospital config. In MVP-0 the slug comes from build-time env
 * (`VITE_VD_HOSPITAL_SLUG`), defaulting to the pilot. Subdomain-derived slugs
 * (`packages/core/parseHospitalSlug`) are wired in Phase 6, not here.
 */
export function resolveHospital(): HospitalConfig {
  const envSlug = import.meta.env.VITE_VD_HOSPITAL_SLUG?.trim();
  const slug = envSlug && envSlug in SEED_HOSPITALS ? envSlug : DEFAULT_SLUG;
  // DEFAULT_SLUG is guaranteed present in the seed registry.
  return SEED_HOSPITALS[slug] ?? SEED_HOSPITALS[DEFAULT_SLUG]!;
}

/** Apply a hospital's theme-token overrides to `:root` (idempotent). */
export function applyHospitalTheme(config: HospitalConfig): void {
  const root = document.documentElement;
  for (const [token, value] of Object.entries(config.theme)) {
    root.style.setProperty(token, value);
  }
}
