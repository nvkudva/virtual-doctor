import { mergeConfig, defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import baseConfig from '@vd/config/vite';

// P0.5 / DEC-19: single PWA, one Vite build. Each module gets its *own* chunk so a
// module's first-load JS is isolated and independently budgeted (≤150 KB gzip, CI-enforced).
// React/React-DOM are split into a shared vendor chunk so no module ships its own copy.
export default mergeConfig(
  baseConfig,
  defineConfig({
    plugins: [react()],
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
