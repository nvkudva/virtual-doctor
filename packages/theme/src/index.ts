// @vd/theme — leaf package (ARCHITECTURE §4): CSS-variable design tokens + breakpoints.
// Depends on nothing internal.
//
// Design tokens live in ./tokens.css and are consumed as a side-effect import at the app
// entry: `import '@vd/theme/tokens.css'`. Components read them via var(--vd-*); theme
// swap (light/dark, per-hospital branding) is a :root variable change with zero component
// edits (P0.2 acceptance criteria).

export { TABLET, DESKTOP, MEDIA } from './breakpoints.js';
export type { Breakpoint } from './breakpoints.js';

export const THEME_PACKAGE = '@vd/theme' as const;
