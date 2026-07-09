import type { ReactElement } from 'react';
import { t } from '@vd/core';
import type { SupabaseClient, Database } from '@vd/api';
import forms from './Forms.module.css';

interface SignOutBarProps {
  readonly client: SupabaseClient<Database>;
}

// Shared sign-out control (DEC-19: outside both module dirs). Signs out of the ONE module client
// passed in, so signing out of /patient leaves a /doctor session untouched (§5.2 session
// separation) and vice versa.
export function SignOutBar({ client }: SignOutBarProps): ReactElement {
  return (
    <div className={forms.topbar}>
      <span />
      <button
        type="button"
        className={forms.signOut}
        onClick={() => void client.auth.signOut()}
      >
        {t('auth.signOut')}
      </button>
    </div>
  );
}
