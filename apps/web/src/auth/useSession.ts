// apps/web — shared session hook (ARCHITECTURE §5.2, DEC-19).
//
// Lives OUTSIDE modules/patient and modules/doctor so both may import it without crossing the
// module import boundary (DEC-19: patient ↛ doctor). It is client-agnostic — you pass in the
// module's namespaced client (patientClient / doctorClient from ../supabase.ts) and it tracks
// that one session, so the two modules never observe each other's auth state.

import { useEffect, useState } from 'react';
import type { Session, SupabaseClient, Database } from '@vd/api';

/** Where a module's auth is: still resolving, signed in, or signed out. */
export type SessionStatus = 'loading' | 'authed' | 'anon';

export interface SessionState {
  readonly status: SessionStatus;
  readonly session: Session | null;
}

/**
 * Subscribe to one module client's auth session. Reads the persisted session once on mount,
 * then follows `onAuthStateChange` (sign-in, sign-out, token refresh, OAuth redirect
 * completion) for the life of the component. Unsubscribes on unmount.
 */
export function useSession(client: SupabaseClient<Database>): SessionState {
  const [state, setState] = useState<SessionState>({ status: 'loading', session: null });

  useEffect(() => {
    let active = true;

    // Initial read: resolves the session already in storage (or from the OAuth redirect URL).
    client.auth
      .getSession()
      .then(({ data }) => {
        if (!active) return;
        setState({ status: data.session ? 'authed' : 'anon', session: data.session });
      })
      .catch(() => {
        if (active) setState({ status: 'anon', session: null });
      });

    // Live updates. Fires for SIGNED_IN / SIGNED_OUT / TOKEN_REFRESHED / USER_UPDATED.
    const { data: sub } = client.auth.onAuthStateChange((_event, session) => {
      if (!active) return;
      setState({ status: session ? 'authed' : 'anon', session });
    });

    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, [client]);

  return state;
}
