import type { ReactElement } from 'react';
import { t } from '@vd/core';
import { doctorClient } from '../../../supabase';
import { useSession } from '../../../auth/useSession';
import { SignOutBar } from '../../../auth/SignOutBar';
import { DoctorSignIn } from '../SignIn';
import forms from '../../../auth/Forms.module.css';

// Doctor module entry (DEC-1/DEC-12: lazily code-split). Orchestrates the P1.3 flow on session
// state alone (no profile wizard — doctor accounts are operator-provisioned):
//   loading → spinner
//   anon    → email/password sign-in
//   authed  → (empty) review queue
// Uses doctorClient — the namespaced client whose session never collides with the patient module.

function Loading(): ReactElement {
  return (
    <div className={forms.screen}>
      <p className={forms.subtitle}>{t('common.loading')}</p>
    </div>
  );
}

function DoctorQueue(): ReactElement {
  return (
    <>
      <SignOutBar client={doctorClient} />
      <div className={forms.empty}>
        <h1 className={forms.title}>{t('doctor.queue.empty.title')}</h1>
        <p className={forms.subtitle}>{t('doctor.queue.empty.body')}</p>
      </div>
    </>
  );
}

export default function DoctorRoute(): ReactElement {
  const { status } = useSession(doctorClient);

  if (status === 'loading') return <Loading />;
  if (status === 'anon') return <DoctorSignIn client={doctorClient} />;
  return <DoctorQueue />;
}
