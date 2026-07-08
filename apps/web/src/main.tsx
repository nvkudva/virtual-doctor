import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import '@vd/theme/tokens.css';
import { App } from './app.js';
import { resolveHospital, applyHospitalTheme } from './shell/hospital.js';

// Boot: resolve the active hospital (MVP-0: env slug) and brand `:root` before first paint,
// then mount. Theme tokens are a side-effect import (all `--vd-*` land on `:root`).
const hospital = resolveHospital();
applyHospitalTheme(hospital);

const container = document.getElementById('root');
if (!container) throw new Error('Root element #root not found');

createRoot(container).render(
  <StrictMode>
    <App hospital={hospital} />
  </StrictMode>,
);
