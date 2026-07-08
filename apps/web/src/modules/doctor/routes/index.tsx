import type { ReactElement } from 'react';

// P0.5 doctor-module stub: a themed placeholder rendered inside the shared shell. Real
// doctor features (review queue, prescription approval) arrive in later phases. Default
// export so the router can code-split it into `module-doctor` (DEC-19).
export default function DoctorModule(): ReactElement {
  return (
    <section>
      <h1>Doctor</h1>
      <p>Doctor module — coming soon.</p>
    </section>
  );
}
