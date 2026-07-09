-- =============================================================================
-- P1.3 — Patient adulthood gate (ARCHITECTURE §5.6: "18+ enforced").
-- Mirrors packages/core/src/age.ts (§13 "port, don't redesign"): a patient's
-- date of birth must be on or before their 18th birthday relative to today.
--
-- Why a trigger, not a CHECK constraint: the rule depends on the current date,
-- and Postgres requires CHECK expressions to be IMMUTABLE (no current_date /
-- now()). A BEFORE INSERT/UPDATE trigger evaluates the rule at write time, which
-- is exactly when a patient submits the profile wizard. Client-side the same
-- rule runs first (isAdult); this is the belt-and-suspenders backstop so an
-- under-18 row cannot be written even by a caller that bypasses the UI.
--
-- Discipline (§8.2): forward-only. Do not edit once applied; supersede with a
-- new numbered migration.
--
-- ROLLBACK NOTE: to roll back, drop in reverse dependency order:
--   drop trigger patient_details_adult_gate on public.patient_details;
--   drop function public.patient_details_enforce_adult();
-- =============================================================================

-- =============================================================================
-- 1. Adulthood-gate trigger on patient_details (§5.6). Fires on INSERT and on
--    any UPDATE that sets `dob`. A NULL dob is left to the application (the
--    wizard requires it); a present dob younger than 18 today is rejected at the
--    DB with errcode `check_violation`, matching how the state machine rejects
--    illegal transitions (§8.4).
--
--    Boundary: born exactly 18 years ago today is an adult (dob = today - 18y is
--    allowed), identical to isAdult() treating the 18th birthday as adult.
-- =============================================================================
create or replace function public.patient_details_enforce_adult()
returns trigger
language plpgsql
as $$
begin
  if new.dob is not null and new.dob > (current_date - interval '18 years') then
    raise exception
      'patient must be at least 18 years old (dob %)', new.dob
      using errcode = 'check_violation';
  end if;
  return new;
end;
$$;

create trigger patient_details_adult_gate
  before insert or update of dob on public.patient_details
  for each row
  execute function public.patient_details_enforce_adult();

comment on function public.patient_details_enforce_adult() is
  'ARCHITECTURE §5.6: rejects a patient_details row whose dob is under 18 as of '
  'today. Mirrors packages/core/src/age.ts isAdult().';
