-- =============================================================================
-- P1.2 — Consult state machine (trigger) + Consult Trace (view + RPC)
-- ARCHITECTURE §8.4 (state machine: "Any transition not in list rejected at
-- database"), §8.5 (Consult Trace). Mirrors packages/core/src/state.ts verbatim
-- (§13 "port, don't redesign"): the transition table here IS the same table.
--
-- Discipline (§8.2): forward-only. Do not edit once applied; supersede with a
-- new numbered migration.
--
-- ROLLBACK NOTE: to roll back, drop in reverse dependency order:
--   drop function public.export_consult_trace(uuid);
--   drop view public.consult_trace;
--   drop trigger consults_status_machine on public.consults;
--   drop function public.consults_enforce_status_machine();
--   drop function public.consult_transition_allowed(public.consult_status, public.consult_status);
-- (P1.1's consult_events append-only trigger predates this migration and stays.)
-- =============================================================================

-- =============================================================================
-- 1. Transition table (§8.4). Verbatim mirror of CONSULT_TRANSITIONS in
--    packages/core/src/state.ts. IMMUTABLE: pure function of its inputs.
--
--      active         → pending_review | abandoned
--      pending_review → approved | rejected | escalated | expired
--      approved       → communicated | superseded
--      communicated   → closed
--
--    All other source states are terminal (no outgoing transitions).
-- =============================================================================
create or replace function public.consult_transition_allowed(
  from_status public.consult_status,
  to_status   public.consult_status
)
returns boolean
language sql
immutable
as $$
  select case from_status
    when 'active'         then to_status in ('pending_review','abandoned')
    when 'pending_review' then to_status in ('approved','rejected','escalated','expired')
    when 'approved'       then to_status in ('communicated','superseded')
    when 'communicated'   then to_status in ('closed')
    else false            -- rejected, escalated, abandoned, expired, closed, superseded → terminal
  end;
$$;

-- =============================================================================
-- 2. Status-transition trigger on consults (§8.4). Fires only when `status`
--    actually changes. Rejects any transition not in the machine at the DB;
--    on an accepted change, writes a `status_change` row to consult_events so
--    every transition leaves a trace (§8.5). Runs as one transaction with the
--    UPDATE: a rejected transition aborts and writes nothing.
-- =============================================================================
create or replace function public.consults_enforce_status_machine()
returns trigger
language plpgsql
security definer            -- so the audit insert into consult_events is not blocked by RLS
set search_path = public
as $$
declare
  v_role  text;
  v_actor text;
begin
  if not public.consult_transition_allowed(old.status, new.status) then
    raise exception
      'illegal consult transition: % -> % (consult %)', old.status, new.status, old.id
      using errcode = 'check_violation';
  end if;

  -- Derive the actor from the platform role. Timer-driven states (abandoned/
  -- expired) run without an authenticated user → 'system'. §8.2 actor domain is
  -- ('patient','ai','doctor','system'); admins are recorded as 'doctor'.
  v_role := public.current_role_of();
  v_actor := case
    when v_role = 'patient'          then 'patient'
    when v_role in ('doctor','admin') then 'doctor'
    else 'system'
  end;

  insert into public.consult_events
    (consult_id, hospital_id, event_type, actor, actor_id, payload)
  values
    (new.id, new.hospital_id, 'status_change', v_actor, auth.uid(),
     jsonb_build_object('from', old.status, 'to', new.status));

  return new;
end;
$$;

create trigger consults_status_machine
  before update of status on public.consults
  for each row
  when (old.status is distinct from new.status)
  execute function public.consults_enforce_status_machine();

-- =============================================================================
-- 3. consult_events append-only: belt-and-suspenders for the AC. P1.1 already
--    installed a no-mutate trigger (blocks UPDATE/DELETE for everyone incl.
--    service_role). Here we also revoke the mutation grants so the intent is
--    explicit in the grant table, not only enforced by a trigger. INSERT stays
--    (the SECURITY DEFINER trigger above and edge functions append).
-- =============================================================================
revoke update, delete on public.consult_events from anon, authenticated, service_role;

-- =============================================================================
-- 4. consult_trace view (§8.5): one normalized, time-ordered timeline per
--    consult, UNION ALL over every event-bearing table, projected to
--    (consult_id, hospital_id, at, actor, actor_id, kind, summary, payload).
--
--    security_invoker = true (PG15+): the querying user's RLS on the underlying
--    tables applies, so the trace is tenant-isolated by the §8.3 matrix — a
--    doctor sees only their hospital's consults, a patient only their own.
-- =============================================================================
create view public.consult_trace
with (security_invoker = true)
as
  -- lifecycle events (status_change, queued, doctor_opened, ...)
  select
    e.consult_id,
    e.hospital_id,
    e.created_at                              as at,
    e.actor,
    e.actor_id,
    'event:' || e.event_type                  as kind,
    case
      when e.event_type = 'status_change'
      then (e.payload ->> 'from') || ' → ' || (e.payload ->> 'to')
      else e.event_type
    end                                       as summary,
    e.payload
  from public.consult_events e

  union all

  -- patient ↔ AI intake turns
  select
    m.consult_id,
    c.hospital_id,
    m.created_at,
    m.sender                                  as actor,
    null::uuid                                as actor_id,
    'message'                                 as kind,
    left(coalesce(m.content, ''), 500)        as summary,
    jsonb_build_object('ai_note', m.ai_note)  as payload
  from public.consult_messages m
  join public.consults c on c.id = m.consult_id

  union all

  -- doctor ↔ AI review turns (never patient-visible; RLS on review_messages)
  select
    rm.consult_id,
    c.hospital_id,
    rm.created_at,
    rm.sender                                 as actor,
    rm.doctor_id                              as actor_id,
    'review_message'                          as kind,
    left(coalesce(rm.content, ''), 500)       as summary,
    jsonb_build_object('citations', rm.citations) as payload
  from public.review_messages rm
  join public.consults c on c.id = rm.consult_id

  union all

  -- AI recommendation drafts
  select
    d.consult_id,
    c.hospital_id,
    d.created_at,
    'ai'                                      as actor,
    null::uuid                                as actor_id,
    'ai_draft'                                as kind,
    'AI draft'                                as summary,
    coalesce(d.recommendation, '{}'::jsonb)   as payload
  from public.ai_drafts d
  join public.consults c on c.id = d.consult_id

  union all

  -- doctor decision records
  select
    r.consult_id,
    c.hospital_id,
    r.created_at,
    'doctor'                                  as actor,
    r.doctor_id                               as actor_id,
    'review:' || r.action                     as kind,
    left(coalesce(r.reason, r.action), 500)   as summary,
    coalesce(r.diff, '{}'::jsonb)             as payload
  from public.reviews r
  join public.consults c on c.id = r.consult_id

  union all

  -- approved prescriptions (carry hospital_id directly)
  select
    p.consult_id,
    p.hospital_id,
    p.approved_at                             as at,
    'doctor'                                  as actor,
    p.doctor_id                               as actor_id,
    'prescription'                            as kind,
    left(coalesce(p.advice, 'Prescription issued'), 500) as summary,
    jsonb_build_object('items', p.items, 'edited_from_draft', p.edited_from_draft) as payload
  from public.prescriptions p

  union all

  -- patient-uploaded media
  select
    md.consult_id,
    c.hospital_id,
    md.created_at,
    'patient'                                 as actor,
    null::uuid                                as actor_id,
    'media:' || md.kind                       as kind,
    md.storage_path                           as summary,
    coalesce(md.ai_findings, '{}'::jsonb)     as payload
  from public.consult_media md
  join public.consults c on c.id = md.consult_id;

comment on view public.consult_trace is
  'ARCHITECTURE §8.5 Consult Trace: normalized, tenant-isolated (security_invoker) '
  'timeline UNION ALL over event-bearing tables. Callers order by `at`.';

-- =============================================================================
-- 5. export_consult_trace(consult_id) RPC (§8.5): the full time-ordered trace
--    for one consult as a JSON array. Runs SECURITY INVOKER (default), so the
--    caller's RLS on consult_trace's underlying tables applies — an unauthorized
--    caller simply gets an empty array. Returns '[]' when the consult is unseen.
-- =============================================================================
create or replace function public.export_consult_trace(p_consult_id uuid)
returns jsonb
language sql
stable
as $$
  select coalesce(
    jsonb_agg(t order by t.at),
    '[]'::jsonb
  )
  from public.consult_trace t
  where t.consult_id = p_consult_id;
$$;

comment on function public.export_consult_trace(uuid) is
  'ARCHITECTURE §8.5: time-ordered consult_trace for one consult as a JSON array; '
  'tenant-isolated via the caller''s RLS.';
