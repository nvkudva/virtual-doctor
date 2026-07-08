// Shared Vite base config (ARCHITECTURE §3). Apps merge this via mergeConfig.
import { defineConfig } from 'vite';

export const baseConfig = defineConfig({
  build: {
    target: 'es2022',
    sourcemap: true,
  },
});

export default baseConfig;
