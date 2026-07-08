// @vd/theme — canonical responsive breakpoints (DEC-15).
//
// Two breakpoints only, defined once here and nowhere else. Mobile-first: base styles
// target the smallest viewport; these are min-width step-ups. No device sniffing — layout
// reflow is owned by layout components keyed off these values.

/** Tablet and up: ≥ 768px. */
export const TABLET = 768 as const;

/** Desktop and up: ≥ 1120px. */
export const DESKTOP = 1120 as const;

/**
 * Media-query snippet strings for use in CSS Modules via composition or in JS matchMedia.
 * Prefer authoring `@media (min-width: 768px)` directly in CSS Modules; these exist so the
 * JS side (e.g. useMediaQuery) references the same numbers as the CSS.
 */
export const MEDIA = {
  tablet: `(min-width: ${TABLET}px)`,
  desktop: `(min-width: ${DESKTOP}px)`,
} as const;

export type Breakpoint = 'tablet' | 'desktop';
