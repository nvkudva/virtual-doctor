import { useState, type FormEvent, type ReactElement } from 'react';
import { t, isAdult } from '@vd/core';
import type { SupabaseClient, Database, TablesInsert } from '@vd/api';
import forms from '../../auth/Forms.module.css';

interface ProfileWizardProps {
  readonly client: SupabaseClient<Database>;
  readonly userId: string;
  /** Called once profiles + patient_details are written, so the orchestrator advances to records. */
  readonly onComplete: () => void;
}

type SexValue = 'female' | 'male' | 'other' | 'undisclosed';

// Blood groups offered by the wizard. Stored as free text on patient_details.blood_group; an empty
// selection stays null (unknown) rather than guessing.
const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'] as const;

/** Split a comma-separated free-text field into a trimmed, non-empty string list for jsonb storage. */
function toList(raw: string): string[] {
  return raw
    .split(',')
    .map((item) => item.trim())
    .filter((item) => item.length > 0);
}

// First-run profile wizard (ARCHITECTURE §5.6, P1.3). Writes the patient's own profiles row
// (role 'patient') and their patient_details row. The 18+ gate is enforced here client-side with
// isAdult (§13 same rule as the DB trigger) so the user gets an inline message; the DB trigger is
// the backstop if this is bypassed.
export function ProfileWizard({ client, userId, onComplete }: ProfileWizardProps): ReactElement {
  const [fullName, setFullName] = useState('');
  const [dob, setDob] = useState('');
  const [sex, setSex] = useState<SexValue | ''>('');
  const [bloodGroup, setBloodGroup] = useState('');
  const [allergies, setAllergies] = useState('');
  const [conditions, setConditions] = useState('');
  const [medications, setMedications] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    setError(null);

    const name = fullName.trim();
    if (name.length === 0 || dob.length === 0) {
      setError(t('profile.error.required'));
      return;
    }
    if (!isAdult(dob)) {
      setError(t('profile.error.underage'));
      return;
    }

    setBusy(true);

    // Own profiles row first (FK target for patient_details). id = auth.uid(), role fixed to
    // 'patient' — RLS profiles_self_insert requires id = auth.uid().
    const profileRow: TablesInsert<'profiles'> = {
      id: userId,
      full_name: name,
      role: 'patient',
    };
    const { error: profileError } = await client.from('profiles').upsert(profileRow);
    if (profileError) {
      setBusy(false);
      setError(t('profile.error.save'));
      return;
    }

    const detailsRow: TablesInsert<'patient_details'> = {
      profile_id: userId,
      dob,
      sex: sex === '' ? null : sex,
      blood_group: bloodGroup === '' ? null : bloodGroup,
      allergies: toList(allergies),
      conditions: toList(conditions),
      medications: toList(medications),
    };
    const { error: detailsError } = await client.from('patient_details').upsert(detailsRow);
    if (detailsError) {
      setBusy(false);
      setError(t('profile.error.save'));
      return;
    }

    setBusy(false);
    onComplete();
  }

  return (
    <div className={forms.screen}>
      <form className={forms.card} onSubmit={(e) => void submit(e)} noValidate>
        <h1 className={forms.title}>{t('profile.title')}</h1>
        <p className={forms.subtitle}>{t('profile.subtitle')}</p>

        {error !== null && (
          <p className={forms.error} role="alert">
            {error}
          </p>
        )}

        <div className={forms.field}>
          <label className={forms.label} htmlFor="pw-name">
            {t('profile.fullName')}
          </label>
          <input
            id="pw-name"
            className={forms.input}
            type="text"
            autoComplete="name"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            required
          />
        </div>

        <div className={forms.field}>
          <label className={forms.label} htmlFor="pw-dob">
            {t('profile.dob')}
          </label>
          <input
            id="pw-dob"
            className={forms.input}
            type="date"
            autoComplete="bday"
            value={dob}
            onChange={(e) => setDob(e.target.value)}
            required
          />
        </div>

        <div className={forms.field}>
          <label className={forms.label} htmlFor="pw-sex">
            {t('profile.sex')}
          </label>
          <select
            id="pw-sex"
            className={forms.select}
            value={sex}
            onChange={(e) => setSex(e.target.value as SexValue | '')}
          >
            <option value="">{t('profile.sex.undisclosed')}</option>
            <option value="female">{t('profile.sex.female')}</option>
            <option value="male">{t('profile.sex.male')}</option>
            <option value="other">{t('profile.sex.other')}</option>
          </select>
        </div>

        <div className={forms.field}>
          <label className={forms.label} htmlFor="pw-blood">
            {t('profile.bloodGroup')}
          </label>
          <select
            id="pw-blood"
            className={forms.select}
            value={bloodGroup}
            onChange={(e) => setBloodGroup(e.target.value)}
          >
            <option value="">{t('profile.bloodGroup.unknown')}</option>
            {BLOOD_GROUPS.map((group) => (
              <option key={group} value={group}>
                {group}
              </option>
            ))}
          </select>
        </div>

        <div className={forms.field}>
          <label className={forms.label} htmlFor="pw-allergies">
            {t('profile.allergies')}
          </label>
          <input
            id="pw-allergies"
            className={forms.input}
            type="text"
            value={allergies}
            onChange={(e) => setAllergies(e.target.value)}
          />
          <span className={forms.hint}>{t('profile.listHint')}</span>
        </div>

        <div className={forms.field}>
          <label className={forms.label} htmlFor="pw-conditions">
            {t('profile.conditions')}
          </label>
          <input
            id="pw-conditions"
            className={forms.input}
            type="text"
            value={conditions}
            onChange={(e) => setConditions(e.target.value)}
          />
          <span className={forms.hint}>{t('profile.listHint')}</span>
        </div>

        <div className={forms.field}>
          <label className={forms.label} htmlFor="pw-medications">
            {t('profile.medications')}
          </label>
          <input
            id="pw-medications"
            className={forms.input}
            type="text"
            value={medications}
            onChange={(e) => setMedications(e.target.value)}
          />
          <span className={forms.hint}>{t('profile.listHint')}</span>
        </div>

        <button
          type="submit"
          className={`${forms.button} ${forms.buttonPrimary}`}
          disabled={busy}
        >
          {busy ? t('profile.saving') : t('profile.save')}
        </button>
      </form>
    </div>
  );
}
