import { useState, type ReactElement } from 'react';
import { t } from '@vd/core';
import type { SupabaseClient, Database } from '@vd/api';
import forms from '../../auth/Forms.module.css';

interface PatientSignInProps {
  readonly client: SupabaseClient<Database>;
}

// Patient authentication (ARCHITECTURE §5.2): Google OAuth only. `signInWithOAuth` redirects the
// browser to Google and back to /patient, where detectSessionInUrl (set on the module client)
// completes the PKCE exchange and useSession flips to `authed`. No self-signup form — identity is
// Google's. All copy via t() (DEC-4).
export function PatientSignIn({ client }: PatientSignInProps): ReactElement {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function signIn(): Promise<void> {
    setBusy(true);
    setError(null);
    const redirectTo = `${window.location.origin}/patient`;
    const { error: authError } = await client.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo },
    });
    if (authError) {
      // Redirect did not start — surface a retryable error and re-enable the button.
      setError(t('error.generic'));
      setBusy(false);
    }
    // On success the browser navigates away; no state update needed.
  }

  return (
    <div className={forms.screen}>
      <div className={forms.card}>
        <h1 className={forms.title}>{t('auth.patient.title')}</h1>
        <p className={forms.subtitle}>{t('auth.patient.subtitle')}</p>
        {error !== null && (
          <p className={forms.error} role="alert">
            {error}
          </p>
        )}
        <button
          type="button"
          className={`${forms.button} ${forms.buttonGoogle}`}
          onClick={() => void signIn()}
          disabled={busy}
        >
          {busy ? t('auth.patient.signingIn') : t('auth.patient.google')}
        </button>
      </div>
    </div>
  );
}
