import { useState, type FormEvent, type ReactElement } from 'react';
import { t } from '@vd/core';
import type { SupabaseClient, Database } from '@vd/api';
import forms from '../../auth/Forms.module.css';

interface DoctorSignInProps {
  readonly client: SupabaseClient<Database>;
}

// Doctor authentication (ARCHITECTURE §5.2): email/password, accounts operator-provisioned — there
// is deliberately NO self-signup control, and a footnote says so (auth.doctor.noSelfSignup). On
// success useSession flips to `authed` via onAuthStateChange; on failure we show a generic
// invalid-credentials message (no user enumeration). Copy via t() (DEC-4).
export function DoctorSignIn({ client }: DoctorSignInProps): ReactElement {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    setBusy(true);
    setError(null);
    const { error: authError } = await client.auth.signInWithPassword({
      email: email.trim(),
      password,
    });
    if (authError) {
      setError(t('auth.doctor.invalid'));
      setBusy(false);
    }
    // On success the component unmounts as the orchestrator advances; no state update needed.
  }

  return (
    <div className={forms.screen}>
      <form className={forms.card} onSubmit={(e) => void submit(e)} noValidate>
        <h1 className={forms.title}>{t('auth.doctor.title')}</h1>
        <p className={forms.subtitle}>{t('auth.doctor.subtitle')}</p>

        {error !== null && (
          <p className={forms.error} role="alert">
            {error}
          </p>
        )}

        <div className={forms.field}>
          <label className={forms.label} htmlFor="doc-email">
            {t('auth.doctor.email')}
          </label>
          <input
            id="doc-email"
            className={forms.input}
            type="email"
            autoComplete="username"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>

        <div className={forms.field}>
          <label className={forms.label} htmlFor="doc-password">
            {t('auth.doctor.password')}
          </label>
          <input
            id="doc-password"
            className={forms.input}
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>

        <button
          type="submit"
          className={`${forms.button} ${forms.buttonPrimary}`}
          disabled={busy}
        >
          {busy ? t('auth.doctor.signingIn') : t('auth.doctor.signIn')}
        </button>

        <p className={forms.footnote}>{t('auth.doctor.noSelfSignup')}</p>
      </form>
    </div>
  );
}
