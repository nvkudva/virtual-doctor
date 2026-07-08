// @vd/core — Tenant (hospital slug) resolution from hostname (ARCHITECTURE §9, DEC-1/DEC-12).
//
// This is the ONLY place subdomain→slug parsing exists. Domain scheme (DEC-1): one
// subdomain per hospital, modules as path segments — `⟨slug⟩.vd.app/patient` | `/doctor`.
// The apex domain is an env value (VITE_VD_DOMAIN), passed in here — never hardcoded.
//
// Parsing only. Router wiring / actual tenant resolution is deferred to Phase 6 (§9:
// "delivery in MVP-1; MVP-0 uses env-configured slug pilot"). No network, no routing here.

/**
 * A hospital slug: the leftmost DNS label, lowercased. DNS-label shaped — a-z, 0-9, and
 * internal hyphens; 1–63 chars; no leading/trailing hyphen.
 */
const SLUG_PATTERN = /^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/;

/** Reserved leftmost labels that never denote a tenant. */
const RESERVED_LABELS: ReadonlySet<string> = new Set(['www', 'app', 'api', 'admin']);

/**
 * Parse a hospital slug from `host` given the apex `domain` (e.g. "vd.app").
 *
 * Returns the slug for `⟨slug⟩.⟨domain⟩`, or `null` when:
 *  - `host` is exactly the apex domain (no subdomain),
 *  - `host` is not under `domain`,
 *  - the leftmost label is reserved (www/app/api/admin) or not a valid slug,
 *  - `host` carries more than one label above the apex (multi-level not supported).
 *
 * Host may include a port (`clinic.vd.app:5173`); it is stripped. Matching is
 * case-insensitive. This function is pure and does not read `location` or env directly.
 */
export function parseHospitalSlug(host: string, domain: string): string | null {
  const normalizedHost = stripPort(host).trim().toLowerCase();
  const normalizedDomain = stripPort(domain).trim().toLowerCase();

  if (normalizedHost === '' || normalizedDomain === '') return null;
  if (normalizedHost === normalizedDomain) return null;

  const suffix = `.${normalizedDomain}`;
  if (!normalizedHost.endsWith(suffix)) return null;

  const subdomain = normalizedHost.slice(0, -suffix.length);
  // Only a single label above the apex is a tenant (no `a.b.vd.app`).
  if (subdomain === '' || subdomain.includes('.')) return null;
  if (RESERVED_LABELS.has(subdomain)) return null;
  if (!SLUG_PATTERN.test(subdomain)) return null;

  return subdomain;
}

/** Strip a trailing `:port` from a host string, if present. */
function stripPort(host: string): string {
  const colon = host.lastIndexOf(':');
  return colon === -1 ? host : host.slice(0, colon);
}
