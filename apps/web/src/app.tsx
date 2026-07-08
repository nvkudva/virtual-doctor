import type { ReactElement } from 'react';
import type { HospitalConfig } from './shell/hospital.js';
import { AppShell } from './shell/AppShell.js';
import { Router } from './router.js';

interface AppProps {
  readonly hospital: HospitalConfig;
}

// Top-level wiring: the hospital config brands the shell chrome; the router selects the
// active module by the first path segment and renders it inside the shared shell.
export function App({ hospital }: AppProps): ReactElement {
  return (
    <AppShell hospital={hospital}>
      <Router />
    </AppShell>
  );
}
