import { lazy, Suspense, useSyncExternalStore, type ComponentType, type ReactElement } from 'react';

// Hand-rolled router (DEC-1, DEC-12): the *first path segment* selects a lazily-loaded
// module. No dedicated router library is in the stack (ARCHITECTURE §3). Each module is a
// default-exported component code-split into its own chunk (DEC-19, see vite.config.ts).
// MVP-0 is path routing only; subdomain-derived tenancy is wired in Phase 6.

const modules: Readonly<Record<string, () => Promise<{ default: ComponentType }>>> = {
  patient: () => import('./modules/patient/routes/index.js'),
  doctor: () => import('./modules/doctor/routes/index.js'),
};

const lazyModules: Readonly<Record<string, ComponentType>> = Object.fromEntries(
  Object.entries(modules).map(([segment, loader]) => [segment, lazy(loader)]),
);

const DEFAULT_SEGMENT = 'patient';

function subscribe(onChange: () => void): () => void {
  window.addEventListener('popstate', onChange);
  return () => window.removeEventListener('popstate', onChange);
}

function firstSegment(): string {
  return window.location.pathname.split('/').filter(Boolean)[0] ?? '';
}

export function Router(): ReactElement {
  const segment = useSyncExternalStore(subscribe, firstSegment, () => '');
  const Module = lazyModules[segment] ?? lazyModules[DEFAULT_SEGMENT]!;

  return (
    <Suspense fallback={<div role="status" aria-live="polite">Loading…</div>}>
      <Module />
    </Suspense>
  );
}
