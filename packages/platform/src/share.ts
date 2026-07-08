// Web Share wrapper (§ seam 5, DEC-16). Web implementation over `navigator.share`
// with a clipboard fallback; a native shell swaps in the OS share sheet later.

export interface ShareContent {
  readonly title?: string;
  readonly text?: string;
  readonly url?: string;
}

export type ShareResult = 'shared' | 'copied' | 'cancelled' | 'unavailable';

/** True when the native share sheet is available. */
export function shareSupported(): boolean {
  return typeof navigator !== 'undefined' && typeof navigator.share === 'function';
}

/** True when programmatic clipboard writes are available (fallback path). */
export function clipboardSupported(): boolean {
  return (
    typeof navigator !== 'undefined' &&
    navigator.clipboard !== undefined &&
    typeof navigator.clipboard.writeText === 'function'
  );
}

/**
 * Share content via the native sheet when available, else copy a text form to the
 * clipboard. Returns which path ran. A user-cancelled native share resolves to
 * `cancelled` (not an error).
 */
export async function share(content: ShareContent): Promise<ShareResult> {
  const data: ShareData = {
    ...(content.title !== undefined ? { title: content.title } : {}),
    ...(content.text !== undefined ? { text: content.text } : {}),
    ...(content.url !== undefined ? { url: content.url } : {}),
  };

  if (shareSupported()) {
    try {
      await navigator.share(data);
      return 'shared';
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') return 'cancelled';
      // Fall through to the clipboard path on any other failure.
    }
  }

  if (clipboardSupported()) {
    const parts = [content.title, content.text, content.url].filter(
      (part): part is string => part !== undefined && part !== '',
    );
    await navigator.clipboard.writeText(parts.join('\n'));
    return 'copied';
  }

  return 'unavailable';
}
