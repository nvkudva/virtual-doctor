// @vd/platform — Platform capability seam (ARCHITECTURE §4, §1.3 seam 5, DEC-16).
// Thin web wrappers over browser/native capabilities: notifications/push, install
// prompt, share, persistent storage, in-app back navigation. Each is a web
// implementation today with room for a native adapter (Capacitor) later — callers
// depend only on these signatures, never on the raw browser APIs. May import @vd/core
// only; `ui` never imports this (capability calls live in app/feature code, DEC-16).

export const PLATFORM_PACKAGE = '@vd/platform' as const;

export * from './notifications.js';
export * from './install.js';
export * from './share.js';
export * from './storage.js';
export * from './navigation.js';
