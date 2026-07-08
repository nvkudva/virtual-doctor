// Notifications + push subscription wrapper (§ seam 5, DEC-16, MVP-1/DEC-5).
// Web implementation today; a native adapter (FCM/APNs) can replace the body later
// without any caller change. Nothing outside this module touches `Notification`
// or the push APIs directly.

export type NotificationPermissionState = 'granted' | 'denied' | 'default' | 'unsupported';

export interface ShowNotificationOptions {
  readonly body?: string;
  readonly tag?: string;
  readonly icon?: string;
  readonly requireInteraction?: boolean;
  readonly silent?: boolean;
}

export interface PushSubscribeOptions {
  /** URL-base64-encoded VAPID public key. */
  readonly applicationServerKey: string;
}

/** True when the browser exposes the Notifications API at all. */
export function notificationsSupported(): boolean {
  return typeof globalThis !== 'undefined' && 'Notification' in globalThis;
}

/** True when the browser exposes Push + Service Worker (needed for push subscriptions). */
export function pushSupported(): boolean {
  return (
    typeof globalThis !== 'undefined' &&
    'serviceWorker' in navigator &&
    'PushManager' in globalThis
  );
}

export function notificationPermission(): NotificationPermissionState {
  if (!notificationsSupported()) return 'unsupported';
  return Notification.permission;
}

/** Prompt for notification permission. Returns the resulting state. */
export async function requestNotificationPermission(): Promise<NotificationPermissionState> {
  if (!notificationsSupported()) return 'unsupported';
  return Notification.requestPermission();
}

/**
 * Show a notification. Prefers the service-worker registration (works when the tab
 * is backgrounded / for a future native shell); falls back to a page-level
 * Notification. Returns false when unsupported or permission is not granted.
 */
export async function showNotification(
  title: string,
  options: ShowNotificationOptions = {},
): Promise<boolean> {
  if (!notificationsSupported() || Notification.permission !== 'granted') return false;

  const init: NotificationOptions = {
    ...(options.body !== undefined ? { body: options.body } : {}),
    ...(options.tag !== undefined ? { tag: options.tag } : {}),
    ...(options.icon !== undefined ? { icon: options.icon } : {}),
    ...(options.requireInteraction !== undefined
      ? { requireInteraction: options.requireInteraction }
      : {}),
    ...(options.silent !== undefined ? { silent: options.silent } : {}),
  };

  if ('serviceWorker' in navigator) {
    const registration = await navigator.serviceWorker.getRegistration();
    if (registration) {
      await registration.showNotification(title, init);
      return true;
    }
  }

  new Notification(title, init);
  return true;
}

/** Current push subscription, or null when unsupported / not subscribed. */
export async function currentPushSubscription(): Promise<PushSubscription | null> {
  if (!pushSupported()) return null;
  const registration = await navigator.serviceWorker.getRegistration();
  if (!registration) return null;
  return registration.pushManager.getSubscription();
}

/** Subscribe to push. Returns the subscription, or null when unsupported. */
export async function subscribeToPush(
  options: PushSubscribeOptions,
): Promise<PushSubscription | null> {
  if (!pushSupported()) return null;
  const registration = await navigator.serviceWorker.ready;
  const existing = await registration.pushManager.getSubscription();
  if (existing) return existing;
  return registration.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: options.applicationServerKey,
  });
}

/** Remove the active push subscription. Returns true if one was removed. */
export async function unsubscribeFromPush(): Promise<boolean> {
  const subscription = await currentPushSubscription();
  if (!subscription) return false;
  return subscription.unsubscribe();
}
