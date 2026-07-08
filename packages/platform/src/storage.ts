// Persistent-storage wrapper (§ seam 5, DEC-16). Wraps the StorageManager API used
// to request eviction-proof storage (so the offline app shell / query cache survives
// storage pressure, §11.4). A native shell has durable storage by default; there the
// wrapper reports `persisted` unconditionally.

export interface StorageEstimate {
  readonly usage: number;
  readonly quota: number;
}

function storageManager(): StorageManager | null {
  if (typeof navigator === 'undefined' || navigator.storage === undefined) return null;
  return navigator.storage;
}

/** True when the StorageManager persistence API is available. */
export function persistentStorageSupported(): boolean {
  const manager = storageManager();
  return manager !== null && typeof manager.persist === 'function';
}

/** True when storage is already granted persistent (eviction-proof) status. */
export async function isStoragePersisted(): Promise<boolean> {
  const manager = storageManager();
  if (manager === null || typeof manager.persisted !== 'function') return false;
  return manager.persisted();
}

/**
 * Request persistent storage. Returns true if granted (or already persisted).
 * The browser may grant silently based on engagement heuristics.
 */
export async function requestPersistentStorage(): Promise<boolean> {
  const manager = storageManager();
  if (manager === null || typeof manager.persist !== 'function') return false;
  if (await manager.persisted()) return true;
  return manager.persist();
}

/** Best-effort usage/quota estimate, or null when unsupported. */
export async function storageEstimate(): Promise<StorageEstimate | null> {
  const manager = storageManager();
  if (manager === null || typeof manager.estimate !== 'function') return null;
  const estimate = await manager.estimate();
  return { usage: estimate.usage ?? 0, quota: estimate.quota ?? 0 };
}
