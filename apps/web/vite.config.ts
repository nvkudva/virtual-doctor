import { mergeConfig, defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import baseConfig from '@vd/config/vite';

// P0.5 / DEC-19: single PWA, one Vite build. Each module gets its *own* chunk so a
// module's first-load JS is isolated and independently budgeted (≤150 KB gzip, CI-enforced).
// React/React-DOM are split into a shared vendor chunk so no module ships its own copy.
export default mergeConfig(
  baseConfig,
  defineConfig({
    plugins: [
      react(),
      // DEC-17: one hand-written service worker via injectManifest (src/sw.ts). Phase 0
      // precaches the branded shell + fonts so a second, offline load still paints (§12).
      // registerType 'prompt' — the new SW waits; the update toast is Phase 4. We register
      // the SW manually in main.tsx, so injectRegister is disabled here.
      VitePWA({
        strategies: 'injectManifest',
        srcDir: 'src',
        filename: 'sw.ts',
        registerType: 'prompt',
        injectRegister: null,
        injectManifest: {
          // Precache the shell, hashed assets, and the self-hosted brand fonts.
          globPatterns: ['**/*.{js,css,html,woff2}'],
        },
        manifest: {
          name: 'Virtual Doctor',
          short_name: 'Virtual Doctor',
          description: 'Hospital-branded virtual consultation.',
          display: 'standalone',
          start_url: '/',
          scope: '/',
          background_color: '#dce1eb',
          theme_color: '#414fa0',
          // Phase 0: no installable icon set yet — added with brand assets in a later phase.
          icons: [],
        },
      }),
    ],
    build: {
      rollupOptions: {
        output: {
          manualChunks(id: string): string | undefined {
            if (id.includes('/node_modules/react') || id.includes('/node_modules/scheduler')) {
              return 'vendor-react';
            }
            if (id.includes('/src/modules/patient/')) return 'module-patient';
            if (id.includes('/src/modules/doctor/')) return 'module-doctor';
            return undefined;
          },
        },
      },
    },
  }),
);
