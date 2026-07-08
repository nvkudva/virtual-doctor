import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import '@vd/theme/tokens.css';
import { App } from './app.js';
import { resolveHospital, applyHospitalTheme } from './shell/hospital.js';
import { emitResourceHints } from './shell/resource-hints.js';

// Boot: resolve the active hospital (MVP-0: env slug) and brand `:root` before first paint,
// then mount. Theme tokens are a side-effect import (all `--vd-*` land on `:root`).
const hospital = resolveHospital();
applyHospitalTheme(hospital);

// Warm the Supabase origin (no-op until VITE_SUPABASE_URL is set — dormant in Phase 0).
emitResourceHints();

const container = document.getElementById('root');
if (!container) throw new Error('Root element #root not found');

createRoot(container).render(
  <StrictMode>
    <App hospital={hospital} />
  </StrictMode>,
);

// DEC-17 / §12: register the branded-shell service worker as a progressive enhancement.
// injectManifest emits it to `<base>sw.js`. registerType is 'prompt' so a waiting SW never
// auto-activates in Phase 0; the update toast (Phase 4) will drive skipWaiting. Registration
// failures are non-fatal — the app runs fine online without the SW.
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    void navigator.serviceWorker.register(`${import.meta.env.BASE_URL}sw.js`).catch(() => {
      /* SW is an enhancement; ignore registration failure */
    });
  });
}
