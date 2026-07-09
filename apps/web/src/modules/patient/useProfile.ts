// Patient module — first-run profile check (P1.3).
//
// After a patient signs in we must decide whether to show the profile wizard or their records.
// The signal is a `patient_details` row owned by this user (RLS: pd_owner_select → profile_id =
// auth.uid()). No row → first run → wizard. A row → profile complete → records.

import { useCallback, useEffect, useState } from 'react';
import type { SupabaseClient, Database } from '@vd/api';

export type ProfileStatus = 'loading' | 'missing' | 'complete' | 'error';

export interface ProfileState {
  readonly status: ProfileStatus;
  /** Re-run the check (used after the wizard writes the row). */
  readonly refresh: () => void;
}

/**
 * Track whether the signed-in patient has completed their profile. `userId` is the auth uid;
 * when it is null (anon) the hook idles in `loading`. Any query error surfaces as `error` so the
 * orchestrator can show a retry rather than trapping the user on a blank screen.
 */
export function useProfile(
  client: SupabaseClient<Database>,
  userId: string | null,
): ProfileState {
  const [status, setStatus] = useState<ProfileStatus>('loading');
  const [nonce, setNonce] = useState(0);

  const refresh = useCallback(() => setNonce((n) => n + 1), []);

  useEffect(() => {
    if (userId === null) {
      setStatus('loading');
      return;
    }
    let active = true;
    setStatus('loading');

    client
      .from('patient_details')
      .select('profile_id')
      .eq('profile_id', userId)
      .maybeSingle()
      .then(({ data, error }) => {
        if (!active) return;
        if (error) {
          setStatus('error');
          return;
        }
        setStatus(data ? 'complete' : 'missing');
      });

    return () => {
      active = false;
    };
  }, [client, userId, nonce]);

  return { status, refresh };
}
