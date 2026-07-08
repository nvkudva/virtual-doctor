// Resource-hint skeleton (§11.4). The brand font is preloaded statically in index.html;
// the Supabase origin is not build-static (it comes from env / per-deploy), so we emit a
// `preconnect` at runtime on shell load to warm the TLS + DNS handshake before the first
// data request. No-op until VITE_SUPABASE_URL is set — Phase 0 has no Supabase client yet,
// so this is wired but dormant, ready for the data layer to arrive.

/** Emit a `<link rel="preconnect">` for the Supabase origin, if configured. Idempotent. */
export function emitResourceHints(): void {
  const url = import.meta.env.VITE_SUPABASE_URL?.trim();
  if (!url) return;

  let origin: string;
  try {
    origin = new URL(url).origin;
  } catch {
    return; // malformed env value — skip rather than inject garbage
  }

  const existing = document.head.querySelector(
    `link[rel="preconnect"][href="${origin}"]`,
  );
  if (existing) return;

  const link = document.createElement('link');
  link.rel = 'preconnect';
  link.href = origin;
  link.crossOrigin = 'anonymous';
  document.head.appendChild(link);
}
