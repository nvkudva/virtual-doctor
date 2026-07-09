import type { ReactElement } from 'react';
import { t } from '@vd/core';
import { patientClient } from '../../../supabase';
import { useSession } from '../../../auth/useSession';
import { SignOutBar } from '../../../auth/SignOutBar';
import { PatientSignIn } from '../SignIn';
import { ProfileWizard } from '../ProfileWizard';
import { useProfile } from '../useProfile';
import forms from '../../../auth/Forms.module.css';

// Patient module entry (DEC-1/DEC-12: lazily code-split, default route segment). Orchestrates the
// P1.3 flow purely on session + profile state:
//   loading                     → spinner
//   anon                        → Google sign-in
//   authed, profile missing     → first-run wizard
//   authed, profile complete    → (empty) records
// Uses patientClient — the namespaced client whose session never collides with the doctor module.

function Loading(): ReactElement {
  return (
    <div className={forms.screen}>
      <p className={forms.subtitle}>{t('common.loading')}</p>
    </div>
  );
}

function PatientRecords(): ReactElement {
  return (
    <>
      <SignOutBar client={patientClient} />
      <div className={forms.empty}>
        <h1 className={forms.title}>{t('records.empty.title')}</h1>
        <p className={forms.subtitle}>{t('records.empty.body')}</p>
      </div>
    </>
  );
}

export default function PatientRoute(): ReactElement {
  const { status, session } = useSession(patientClient);
  const userId = session?.user.id ?? null;
  const profile = useProfile(patientClient, userId);

  if (status === 'loading') return <Loading />;
  if (status === 'anon' || session === null) return <PatientSignIn client={patientClient} />;

  if (profile.status === 'loading') return <Loading />;
  if (profile.status === 'missing' || profile.status === 'error') {
    return (
      <ProfileWizard client={patientClient} userId={session.user.id} onComplete={profile.refresh} />
    );
  }

  return <PatientRecords />;
}
