import type { ReactElement, ReactNode } from 'react';
import type { HospitalConfig } from './hospital.js';
import { useBreakpoint } from './useBreakpoint.js';
import styles from './AppShell.module.css';

interface AppShellProps {
  readonly hospital: HospitalConfig;
  readonly children: ReactNode;
}

const NAV = [
  { segment: 'patient', label: 'Patient' },
  { segment: 'doctor', label: 'Doctor' },
] as const;

// Shared consultation shell (ARCHITECTURE §4, §10.4): header / nav / footer chrome around
// the active module. AppShell *owns page-level reflow* (§10.1 rule 6) by reading the named
// breakpoint in JS — leaf components never do viewport queries. Safe-area insets come from
// env(safe-area-inset-*) so the shell paints correctly under notches / home indicators.
export function AppShell({ hospital, children }: AppShellProps): ReactElement {
  const breakpoint = useBreakpoint();

  return (
    <div className={styles.shell} data-breakpoint={breakpoint}>
      <header className={styles.header}>
        <span className={styles.brand}>{hospital.name}</span>
        <nav className={styles.nav} aria-label="Modules">
          {NAV.map(({ segment, label }) => (
            <a key={segment} className={styles.navLink} href={`/${segment}`}>
              {label}
            </a>
          ))}
        </nav>
      </header>
      <main className={styles.main}>{children}</main>
      <footer className={styles.footer}>
        <small>{hospital.name}</small>
      </footer>
    </div>
  );
}
