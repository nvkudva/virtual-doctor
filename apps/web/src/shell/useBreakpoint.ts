// Breakpoint hook (DEC-15, §10.1 rule 6). Reflow is driven in JS off the *named*
// `tablet`/`desktop` media queries from `@vd/theme` (MEDIA) — never ad-hoc pixel values.
// AppShell owns page-level reflow by reading this; leaf components must not (they use
// container queries for their own width). Returns the widest matching breakpoint.

import { useSyncExternalStore } from 'react';
import { MEDIA } from '@vd/theme';

export type ActiveBreakpoint = 'phone' | 'tablet' | 'desktop';

function query(mq: string): MediaQueryList | null {
  return typeof window !== 'undefined' && typeof window.matchMedia === 'function'
    ? window.matchMedia(mq)
    : null;
}

function subscribe(onChange: () => void): () => void {
  const lists = [query(MEDIA.tablet), query(MEDIA.desktop)].filter(
    (l): l is MediaQueryList => l !== null,
  );
  for (const list of lists) list.addEventListener('change', onChange);
  return () => {
    for (const list of lists) list.removeEventListener('change', onChange);
  };
}

function snapshot(): ActiveBreakpoint {
  if (query(MEDIA.desktop)?.matches) return 'desktop';
  if (query(MEDIA.tablet)?.matches) return 'tablet';
  return 'phone';
}

export function useBreakpoint(): ActiveBreakpoint {
  // Server/first-paint fallback is mobile-first ('phone'), per DEC-15.
  return useSyncExternalStore(subscribe, snapshot, () => 'phone');
}
