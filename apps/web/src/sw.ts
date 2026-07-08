// Hand-written service worker (DEC-17, §11.4 / §12 P0 accept).
//
// Built by vite-plugin-pwa in `injectManifest` mode: this source is bundled as-is (workbox
// inlined) and `self.__WB_MANIFEST` is replaced at build time with the hashed build assets.
// Phase 0 scope is deliberately minimal — precache the app shell + a navigation fallback so
// a second, offline (cache-only) load still paints the branded shell. The full runtime
// caching matrix (NetworkOnly consults, SWR records, image expiration) and the "update ready"
// toast (skipWaiting/clientsClaim) are Phase 4 — intentionally absent here.

import { precacheAndRoute, createHandlerBoundToURL } from 'workbox-precaching';
import type { PrecacheEntry } from 'workbox-precaching';
import { NavigationRoute, registerRoute } from 'workbox-routing';

declare const self: ServiceWorkerGlobalScope & {
  __WB_MANIFEST: (string | PrecacheEntry)[];
};

// Hashed build assets (JS/CSS/HTML/fonts) → precache, served CacheFirst by workbox.
precacheAndRoute(self.__WB_MANIFEST);

// This is an SPA: `index.html` *is* the app shell (theme vars + AppShell chrome +
// MiraPresence placeholder). Bind every navigation to the precached shell so an offline
// load of any route still paints branded chrome from the SW precache (§12, line 597).
registerRoute(new NavigationRoute(createHandlerBoundToURL('index.html')));

// No skipWaiting / clientsClaim on purpose: registerType is 'prompt', so a new SW waits
// until the Phase 4 update toast tells it to activate. Phase 0 never auto-reloads.
