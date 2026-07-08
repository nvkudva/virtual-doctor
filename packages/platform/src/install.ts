// Install-prompt wrapper (§ seam 5, DEC-16). The browser fires `beforeinstallprompt`
// once, early; we capture and stash the event so the UI can trigger the prompt at a
// user-chosen moment. A native shell has no equivalent — there the wrapper simply
// reports "unavailable", and install is handled by the store.

/** Minimal shape of the non-standard BeforeInstallPromptEvent. */
interface BeforeInstallPromptEvent extends Event {
  readonly platforms: readonly string[];
  prompt(): Promise<void>;
  readonly userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

export type InstallOutcome = 'accepted' | 'dismissed' | 'unavailable';

let deferredPrompt: BeforeInstallPromptEvent | null = null;
let installed = false;

/**
 * Begin listening for the install-prompt event. Call once during app bootstrap.
 * Returns a cleanup function that removes the listeners.
 */
export function initInstallPrompt(): () => void {
  if (typeof globalThis === 'undefined' || typeof addEventListener !== 'function') {
    return () => {};
  }

  const onBeforeInstallPrompt = (event: Event): void => {
    event.preventDefault();
    deferredPrompt = event as BeforeInstallPromptEvent;
  };
  const onAppInstalled = (): void => {
    installed = true;
    deferredPrompt = null;
  };

  addEventListener('beforeinstallprompt', onBeforeInstallPrompt);
  addEventListener('appinstalled', onAppInstalled);

  return () => {
    removeEventListener('beforeinstallprompt', onBeforeInstallPrompt);
    removeEventListener('appinstalled', onAppInstalled);
  };
}

/** True when a captured prompt is available to show. */
export function canPromptInstall(): boolean {
  return deferredPrompt !== null;
}

/** True when the app is already running as an installed / standalone PWA. */
export function isInstalled(): boolean {
  if (installed) return true;
  if (typeof matchMedia === 'function' && matchMedia('(display-mode: standalone)').matches) {
    return true;
  }
  // iOS Safari exposes standalone status off `navigator`.
  const nav = navigator as Navigator & { standalone?: boolean };
  return nav.standalone === true;
}

/**
 * Show the install prompt if one was captured. Returns the user's choice, or
 * `unavailable` when no prompt is pending (already installed, unsupported, or
 * the event never fired). The prompt is single-use, so we clear it after.
 */
export async function promptInstall(): Promise<InstallOutcome> {
  const prompt = deferredPrompt;
  if (!prompt) return 'unavailable';
  deferredPrompt = null;
  await prompt.prompt();
  const choice = await prompt.userChoice;
  return choice.outcome;
}
