import type { ReactElement } from 'react';

// P0.5 patient-module stub: a themed placeholder rendered inside the shared shell. Real
// patient features (consultation, orb, history) arrive in later phases. Default export so
// the router can code-split it into `module-patient` (DEC-19).
export default function PatientModule(): ReactElement {
  return (
    <section>
      <h1>Patient</h1>
      <p>Patient module — coming soon.</p>
    </section>
  );
}
