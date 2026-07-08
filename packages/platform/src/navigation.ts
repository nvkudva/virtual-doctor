// In-app back-navigation wrapper (§ seam 5, DEC-16(c)). Every screen must be leavable
// from within the app, never relying on browser chrome / the URL bar. The web impl
// wraps the History API; a native shell binds the hardware / gesture back button to
// the same registered handlers, so callers never touch `history` or key events raw.

export type BackHandler = () => boolean | void;

const backHandlers: BackHandler[] = [];

/** True when there is app history to go back to. */
export function canGoBack(): boolean {
  return typeof history !== 'undefined' && history.length > 1;
}

/**
 * Go back one step in app history, or navigate to `fallbackUrl` when there is no
 * history to pop (e.g. the app was deep-linked / opened fresh as a standalone PWA).
 */
export function goBack(fallbackUrl = '/'): void {
  if (typeof history === 'undefined') return;
  if (canGoBack()) {
    history.back();
    return;
  }
  if (typeof location !== 'undefined') location.assign(fallbackUrl);
}

/**
 * Register a handler consulted before a default back action runs (most-recently
 * registered first). A handler returning `true` consumes the back gesture — used by
 * modals / consult flows to intercept back instead of leaving the screen. Returns an
 * unregister function.
 */
export function registerBackHandler(handler: BackHandler): () => void {
  backHandlers.unshift(handler);
  return () => {
    const index = backHandlers.indexOf(handler);
    if (index !== -1) backHandlers.splice(index, 1);
  };
}

/**
 * Run registered back handlers in order until one consumes the gesture. Returns true
 * if consumed. The web app calls this from a `popstate` listener; a native shell calls
 * it from the hardware back button. When nothing consumes, the caller performs the
 * default navigation.
 */
export function dispatchBack(): boolean {
  for (const handler of backHandlers) {
    if (handler() === true) return true;
  }
  return false;
}
