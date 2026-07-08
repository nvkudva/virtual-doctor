// @vd/core — i18n accessor (ARCHITECTURE DEC-4, seam 4).
//
// The single entry point for user-facing copy. Launch locale is English; the accessor is
// locale-shaped now so a second catalog is additive later. Keys are compile-time checked
// against the catalog — an unknown key is a type error, not a runtime miss.

import { messages, type MessageKey } from './messages.en.js';

export { messages, type MessageKey };

/** Values interpolated into `{placeholder}` slots. */
export type MessageParams = Record<string, string | number>;

/**
 * Resolve a catalog key to its string, interpolating `{name}` placeholders from `params`.
 * An unresolved placeholder is left intact (visible in dev) rather than silently dropped.
 */
export function t(key: MessageKey, params?: MessageParams): string {
  const template = messages[key];
  if (params === undefined) return template;
  return template.replace(/\{(\w+)\}/g, (match, name: string) =>
    name in params ? String(params[name]) : match,
  );
}
