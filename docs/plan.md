# Virtual Doctor — Implementation Plan (resumable execution tracker)

**Version:** 1.0
**Date:** 2026-07-08
**Companion docs:** `docs/PRD.md` v0.5 · `docs/ARCHITECTURE.md` v2.0 (source of truth) · `docs/design/`
**Purpose:** Turn ARCHITECTURE §12 into a granular, checkbox-driven work log you can **stop and resume across many days**. Every task is small enough to finish in one sitting; every subphase ends at a committable, green state.

---

## 0. How to use this file

1. **This is the tracker; ARCHITECTURE is the law.** When in doubt about *how*, read the cited `§`/`DEC`/`AP` reference in ARCHITECTURE. This file never overrides it — if they conflict, fix this file.
2. **Work top-to-bottom.** Phases are hard-sequential (§12.7); subphases within a phase may parallelize where noted `‖`.
3. **Check a box only when it's committed and green.** `[x]` = merged to a branch + its local check passes. `[~]` = in progress. `[ ]` = not started.
4. **Every resume starts at the Status Board.** Update "Current position" + "Next action" at the end of every session (§1). That one line is how you reload context tomorrow.
5. **Respect "Do not build yet."** Building ahead of phase is a defect (ARCHITECTURE §0 rule 3).
6. **Gate G-1 is a product gate, not code.** Don't start the Doctor-app half of Phase 2 until 2 named pilot doctors agree in writing to sign real drafts (§2A / §12 G-1).

Legend: `‖` = parallelizable · `⛔` = blocked by a gate · `→` = hard dependency · `AC` = acceptance check.

---

## 1. Status Board  *(update this every session — it is the resume point)*

- **Current phase:** Phase 0 — Foundation
- **Current position:** P0.1 complete — monorepo skeleton builds green (`bun install` clean, `bun run build` 7/7, `bun run typecheck` 13/13)
- **Next action:** P0.2 — design tokens & theme (`packages/theme`) per ARCHITECTURE §10.2 / DEC-15
- **Open blockers / decisions:** none
- **G-1 status (RA-1 doctor sign-off):** ⬜ not yet secured — pursue in parallel; blocks Phase 2 Doctor-app half
- **Last green tag:** _none_ (Phase 0 exit tag `v0-foundation` lands after P0.7)

### Phase completion at a glance

| Phase | Milestone | MVP | State |
|---|---|---|---|
| 0 | Foundation — real but empty skeleton | MVP-0 | 🟡 |
| 1 | Data platform & auth — tenancy provably isolated | MVP-0 | ⬜ |
| 2 | Text consult end-to-end — the full loop, no voice | MVP-0 | ⬜ |
| 3 | Patient voice — core experience at target latency | MVP-0 | ⬜ |
| 4 | Hardening & pilot launch | MVP-0 | ⬜ |
| 5 | Doctor-app coordinator voice | MVP-1 | ⬜ |
| 6 | Multi-tenant delivery & MVP-1 completion | MVP-1 | ⬜ |

---

## Phase 0 — Foundation
**Goal:** an empty but real product skeleton that builds, deploys, and paints a themed shell offline.
**Refs:** ARCHITECTURE §4, §12 Phase 0, §11.4 (AP-8), DEC-9/12/15/17/19.
**Exit tag:** `v0-foundation`

### P0.1 — Monorepo skeleton  ‖
- [x] Init Bun workspaces + Turborepo (ADR 001); root `package.json`, `turbo.json`, `bunfig`.
- [x] Create the exact tree from §4: `apps/web/`, `packages/{ui,theme,api,voice,core,platform,config}/`, `supabase/{migrations,functions,seed}/`, `docs/adr/`.
- [x] `packages/config`: shared `tsconfig` (`strict: true`), ESLint (typescript-eslint, react-hooks), Prettier, Vite base config.
- [x] Each package has a stub `index.ts` + `package.json` with correct internal deps only (§4 import rules).
- **AC:** `bun install` clean; `bun run build` green on empty packages. ✅

### P0.2 — Design tokens & theme  ‖  → P0.1
- [ ] `packages/theme`: CSS-variable token set (`--vd-accent`, `--vd-surface`, `--vd-text`, `--vd-radius-*`, `--vd-space-*`, `--vd-font-*`), light + dark.
- [ ] Port token values / motion language from `docs/design/` (port, don't redesign — §10.2).
- [ ] Named breakpoint constants `tablet ≥ 768`, `desktop ≥ 1120` as exported TS consts + documented media-query snippets (DEC-15).
- **AC:** tokens importable; dark/light swap is a `:root` variable change with zero component edits.

### P0.3 — Core package scaffold  ‖  → P0.1
- [ ] `packages/core`: consult **state machine** (§8.4) as a pure function/table.
- [ ] Zod **contracts** (§7.3): `MiraPatientTurn`, `Recommendation`, `MiraCoordinatorTurn`.
- [ ] i18n catalog scaffold (English only; all strings go through it — seam 4, DEC-4).
- [ ] `tenant.ts`: subdomain→slug **parsing** only (the single place it exists); wiring deferred to Phase 6.
- **AC:** unit tests for state-machine transitions + contract parse/reject; CI fails on any hardcoded user-facing string.

### P0.4 — Platform capability seam  ‖  → P0.1
- [ ] `packages/platform` wrappers (web impls only, seam 5 / DEC-16): notifications/push, install prompt, share, persistent storage, back-nav.
- **AC:** wrappers compile; no raw `Notification`/`navigator.share`/storage calls anywhere else (lint rule).

### P0.5 — App shell + router  → P0.2, P0.3
- [ ] `apps/web`: `AppShell` (header/nav/footer, safe-area insets, owns breakpoint reflow — §10.1 rule 6).
- [ ] `router.tsx`: first path segment → lazy-loaded module; `/patient` + `/doctor` stubs each render a themed shell.
- [ ] `vite.config.ts`: `manualChunks` = one chunk per module (download isolation, DEC-19).
- [ ] Shell reads seeded hospital config → applies theme CSS vars on `:root`.
- **AC:** both routes live, branded from seed config, each in its own chunk.

### P0.6 — PWA shell foundation (instant-load skeleton)  → P0.5
- [ ] `vite-plugin-pwa` in **`injectManifest`** mode (DEC-17); hand-written service worker precaches the app shell (§11.4).
- [ ] Manifest `display: standalone` + safe-area insets wired into `AppShell`.
- [ ] Resource-hint skeleton: `preconnect` to Supabase, self-hosted **preloaded** fonts (remove any CDN font link).
- [ ] `touch-action` on interactive primitives (no 300ms tap delay).
- **AC:** a **second, offline** load of either module still paints the branded shell from SW precache.

### P0.7 — CI + deploy  → P0.5
- [ ] GitHub Actions: typecheck + lint + unit + build + `size-limit` on every PR (through Turbo cache; `bun install --frozen-lockfile`).
- [ ] **DEC-19 import-boundary check** (`modules/*` may not import another `modules/*`) + **per-module ≤150 KB gzip initial-JS budget**.
- [ ] Deploy single PWA to Cloudflare Pages (one project, default domain) with SPA history-fallback (DEC-12).
- **AC:** CI green and enforces budgets + import boundary; both module routes live on the deployed URL.

> **Phase 0 done when:** `bun i && bun run build` green · both branded module routes live · offline shell paints · CI enforces budgets + import boundary. Tag `v0-foundation`.
> **Do not build yet:** any Supabase table beyond `hospitals`, any AI call, any voice code, subdomain/path routing plumbing.

---

## Phase 1 — Data platform & auth
**Goal:** tenancy is real and provably isolated in the database.
**Refs:** ARCHITECTURE §8 (schema, RLS, state-machine trigger, trace view), §5.1/§5.2, DEC-14, §5.6.
**Parallel packages behind one seam = the migration number** (§12.7). **One owner renumbers/rebases migrations before merge.**
**Exit tag:** `v1-data-auth`

### P1.1 — Schema + RLS  ‖ (migration owner)
- [ ] Migrations for all tables (§8.2): `hospitals, profiles, memberships, patient_details, consults, consult_messages, review_messages, ai_drafts, prescriptions, reviews, mira_feedback, consult_media, consult_events`.
- [ ] uuid PKs, `timestamptz` defaults; `consults.status` as Postgres **enum** incl. `abandoned`/`expired`.
- [ ] RLS **enabled default-deny** on every table in the same migration that creates it; additive grant policies per the §8.3 matrix.
- [ ] MVP index set (§8.2) + partial unique index `consults(patient_id,hospital_id) WHERE status IN ('active','pending_review')` (DEC-14).
- **AC:** migrations apply forward-only; `supabase gen types` committed to `packages/api`, CI fails if stale.

### P1.2 — State machine trigger + trace  ‖
- [ ] Status-transition **trigger** enforcing §8.4; rejects any transition not in the machine; writes `status_change` rows to `consult_events`.
- [ ] `consult_events` append-only (no UPDATE/DELETE grants to anyone).
- [ ] `consult_trace` **view**: time-ordered `UNION ALL` normalized to `(consult_id,hospital_id,at,actor,actor_id,kind,summary,payload)` (§8.5).
- [ ] `export_consult_trace(consult_id)` RPC (JSON).
- **AC:** an illegal transition is rejected at the DB; every status change leaves a trace row.

### P1.3 — Auth + profile wizard  ‖
- [ ] Supabase Auth: Google OAuth (patient module), email/password (doctor module, operator-provisioned, no self-signup).
- [ ] Per-module namespaced Supabase client (localStorage key prefix + JWT `role` claim) — app-level session separation on shared origin (§5.2).
- [ ] First-run profile wizard → `patient_details` (name, DOB, sex, blood group, allergies, conditions, medications); **18+ DOB enforcement** (§5.6).
- **AC:** patient signs in, completes profile, sees empty records; under-18 DOB rejected.

### P1.4 — Seed + RLS negative tests  ‖
- [ ] Seed script: 2 hospitals (pilot + synthetic second tenant), 2 doctors each, sample patients.
- [ ] `packages/api` base query/mutation hooks (keys centralized — §13.2).
- [ ] **Four cross-tenant denial tests** in CI (patient A ↛ patient B; doctor hospital X ↛ hospital Y) — run forever.
- **AC:** all four denial tests pass; a doctor sees only their hospital's (empty) queue.

> **Phase 1 done when:** cross-tenant denials pass · patient onboarding works · doctor sees own-hospital queue only · under-18 rejected. Tag `v1-data-auth`.
> **Do not build yet:** AI, voice, review actions.

---

## Phase 2 — Text consult, end to end
**Goal:** the full loop works before voice exists.
**Refs:** ARCHITECTURE §5.3, §7 (orchestrator, single Doctor Agent, safety layers, contracts), §5.4, §5.6, §8.5, DEC-13.
**Split (§12.7):** patient-side loop and Doctor-app are independently buildable; **Doctor-app half is ⛔ G-1**.
**Exit tag:** `v2-text-loop`

### P2.1 — `ai-consult` Edge Function core  ‖
- [ ] `LlmProvider` interface + **`gemini.ts` adapter only** (seam 6 / §1.3); no Gemini SDK reference outside the adapter.
- [ ] Agent registry (`_shared/agents/`) with **Doctor Agent alone** (§7.2); `composeMiraTurn` merge point stubbed for one agent.
- [ ] Turn pipeline (§5.3): authn + consult-ownership check → context assembly (service role) → **server-side safety injection** → LLM stream (SSE) → parse structured tail → post-validation → persist `consult_messages`+`ai_drafts`+`consult_events`.
- [ ] **Safety layers 1–3** (§7.4): prompt hard-rules, independent post-validation vs structured allergy/age list, (human gate lands in P2.4).
- [ ] Quotas (§11.2): max turns/consult, max tokens/call, per-hospital daily quota → graceful wrap-up on exceed.
- [ ] Prompts as versioned code in `_shared/agents/prompts/` + `ai_config.prompt_version` field (§13.4).
- **AC:** golden-transcript suite (common case, allergy conflict, red flag, prompt-injection) passes schema-validity + safety assertions.

### P2.2 — Patient consult UI (text mode)  ‖  → P2.1
- [ ] `packages/ui`: `TranscriptView`, `ComposerBar` (text + mic-toggle placeholder), `RecommendationCard` (read-only), `EmergencyInterstitial`, `AiDisclosureBadge`, status/urgency/confidence badges, `SafetyFlagList`.
- [ ] `MiraConsole` shell (patient audience, expanded call-screen + orb-minimize/overlay) hosting a static `MiraPresence` placeholder — §10.4 (voice engine lands Phase 3).
- [ ] Consult flow drives to `pending_review`; resume-open-consult behavior (DEC-14).
- **AC:** a patient completes a full **text** consult; red-flag input renders the interstitial + urgent flag.

### P2.3 — Lifecycle timers  ‖  → P1.2
- [ ] `pg_cron` jobs (DEC-13) → SQL functions writing `consult_events` + status flips: SLA warn (2h), expiry (24h→`expired`), abandonment (30min→`abandoned`).
- [ ] Rejection/expiry patient messaging (always a concrete next step — §5.6).
- **AC:** timers fire in a clock-mocked test; each leaves a trace row.

### P2.4 — Doctor app review  ⛔ **G-1**  → P2.1
- [ ] Queue: TanStack Query + Supabase **Realtime** on `pending_review` for the hospital, urgency→age order; `QueueCard`.
- [ ] Review screen: `TranscriptView` + AI note + editable `RecommendationCard` + `PatientHistoryPanel`; records `doctor_opened` event.
- [ ] Approval RPC `approve_consult(...)` (transaction: insert `prescriptions` + `reviews` with draft-vs-final diff + status flip) — **only write path to `prescriptions`** (AP-5). Plus `reject_consult`, `escalate_consult`.
- [ ] Explicit UI approve/edit/reject — **never voice-triggered**.
- **AC:** every action audited in `reviews`; review layout reflows single-column (phone) → multi-pane (desktop) per §10.1 rule 6.

### P2.5 — Records + operator trace  ‖  → P2.4
- [ ] Patient records list + `PrescriptionView` (print/share layout).
- [ ] Operator trace access: `consult_trace` view + `docs/ops.md` query set + `export_consult_trace`.
- **AC:** approved consult shows the doctor-signed prescription to the patient.

> **Phase 2 done when (scripted E2E):** patient text consult → doctor edits + approves → patient sees signed prescription **and the trace timeline contains every step** (turns, draft, queued, doctor_opened, decision+diff, notification, closure) · allergy hard-rule blocks a conflicting draft · red-flag → urgent + interstitial · second consult resumes the open one · timers fire (clock-mocked) · Doctor queue+review reflows at phone & desktop widths. Tag `v2-text-loop`.
> **Do not build yet:** any STT/TTS, Doctor-app voice, images, push, Receptionist agent.

---

## Phase 3 — Patient voice
**Goal:** the product's core experience at target latency.
**Refs:** ARCHITECTURE §6 (voice pipeline, `VoiceProvider`, turn-taking machine), §6.1 budget, §10.3, DEC-2. Soft-start allowed: the inert `VoiceProvider` interface + tests may be drafted during Phase 2 (§12.7).
**Exit tag:** `v3-patient-voice`

### P3.1 — Voice engine  → P2 accepted
- [ ] `packages/voice`: turn-taking **state machine** (`idle→listening→thinking→speaking`, `error`/`ended`, barge-in) — §6.4.
- [ ] `VoiceProvider` interface (§6.3) + sentence splitter (speak on sentence 1 while LLM still writing).
- [ ] Adapters: `deepgram.ts` (STT), `chirp.ts` (TTS with word timestamps), `webspeech.ts` (dev only). No provider SDK referenced outside adapters.
- **AC:** unit tests for state machine + sentence splitter; provider selection from config.

### P3.2 — Token minting + streaming  → P3.1
- [ ] `voice-token` Edge Function: short-lived (≤60s) per-consult scoped STT/TTS tokens.
- [ ] Browser↔provider audio over WSS (Edge Function in control path, not audio path).
- [ ] Voice-token **pre-warm** on consult-screen mount (§11.4).
- **AC:** live streaming STT interim transcripts render; TTS audio streams.

### P3.3 — Presence + call screen  → P3.1
- [ ] `OrbPresence` (CSS/SVG, no WebGL) implementing the `MiraPresence` contract (§10.3); port orb states/motion from prototype.
- [ ] Call-screen layout (full-height presence, transcript as overlay drawer); wire word-timestamps→presence props (flow even though orb ignores them — AP-6).
- [ ] Mixed voice/text turns (P-3a); spoken AI disclosure at consult start (P-3b).
- **AC:** timestamps observably flow to `MiraPresence` props.

### P3.4 — Latency instrumentation  → P3.2
- [ ] Per-turn latency segments logged (§6.1): STT endpoint, context+LLM first-sentence, TTS first-audio, network.
- **AC:** p50 end-of-speech→first audio **< 1.5s**, p95 < 3s on staging (mid-range Android); mic-denied falls back to full text consult.

> **Phase 3 done when:** hands-free consult end-to-end on mid-range Android at target latency · mic-denied path works · timestamps flow to presence. Tag `v3-patient-voice`.
> **Do not build yet:** Doctor-app voice, avatar of any kind.

---

## Phase 4 — MVP-0 hardening & pilot launch
**Goal:** live with the design-partner hospital.
**Refs:** ARCHITECTURE §11 (all), §12 Phase 4, DEC-16/18, §10.1 rule 6. **Independently ownable packages sharing only the checklist** (§12.7).
**Exit tag:** `v4-pilot`

### P4.1 — Observability & cost  ‖
- [ ] `usage_events` log (tokens, STT seconds, TTS chars per consult) → per-hospital unit economics.
- [ ] Operator dashboard query set in `docs/ops.md`: consults/day/hospital, p50/p95 voice latency, approval-with-no-edit rate, quota consumption.
- [ ] Sentry (PII scrubbing on) + Web Vitals reporting.
- **AC:** RA-2 (completion/voice rates) & RA-3 (approval-with-minor-edits, median review time) computable from the dashboard on day one.

### P4.2 — Security & accessibility pass  ‖
- [ ] Headers/CSP, dependency audit, RLS re-review.
- [ ] Accessibility: WCAG AA contrast both themes; consult fully usable via screen reader + text mode.
- **AC:** security + a11y checklists signed off.

### P4.3 — Responsive & native-readiness pass  ‖
- [ ] Both modules exercised at phone/tablet/desktop against §10.1 rule 6 (UI-1).
- [ ] DEC-16 readiness check: no raw capability APIs outside `packages/platform`/`voice`; no browser-chrome-dependent flows.
- **AC:** both pass at all three widths; readiness check clean.

### P4.4 — PWA hardening  ‖  → P3
- [ ] Full caching-strategy matrix in place & verified per resource class (§11.4).
- [ ] DEC-18 TanStack Query cache persisted to IndexedDB for theme/profile/records **only** (consult/queue excluded).
- [ ] Preload/prefetch hints (route `modulepreload`, voice-token pre-warm) measured to shave latency.
- [ ] SW update-toast flow (`skipWaiting`+`clientsClaim` gated) — no silent mid-consult reload.
- [ ] **bfcache-eligibility check added to CI** (no `unload`/blocking `beforeunload`/`no-store` on nav routes).
- **AC:** warm repeat launch paints real theme/profile/records **before** any network response; both modules pass bfcache check in CI.

### P4.5 — Launch readiness  ‖
- [ ] Install polish + offline records; load sanity test (50 concurrent consults).
- [ ] Pilot runbook: hospital rota/SLA config, incident + breach-notification runbooks.
- **AC:** Lighthouse PWA+Perf ≥ 90 both modules; operator can audit any consult end-to-end from its trace.

> **Phase 4 done when:** all P4 ACs pass and the pilot is live. Tag `v4-pilot`. **← MVP-0 complete.**
> **Entry to MVP-1:** RA-2/RA-3 gates holding in the pilot (PRD §2A).

---

## Phase 5 — Doctor-app coordinator voice  *(MVP-1)*
**Goal:** Mira presents; the doctor converses.
**Refs:** ARCHITECTURE §7.2 (coordinator routing), §7.3 (`MiraCoordinatorTurn`, no `approve` action), §10.4, D-7/D-8/D-9. **Entry: Phase 4 accepted + RA gates holding.**
**Exit tag:** `v5-doctor-voice`

- [ ] Coordinator mode in the orchestrator: SBAR presentation; grounded Q&A with **on-screen citations** (D-8); conversational edits (`action:'edit'` updates on-screen draft only, never persists) (D-9).
- [ ] Doctor module reuses `packages/voice` + `MiraConsole` in **coordinator-mode config** (§10.4) — no new voice UI.
- [ ] Per-doctor mute/skip presentation preference (persisted).
- [ ] `review_messages` audit (in the trace); `mira_feedback` capture UI.
- **AC:** doctor hears presentation, asks 2 history questions answered with citations, dictates an edit, sees draft change, signs via UI · **voice cannot trigger approval (test exists)** · presentation skippable · review conversation appears in the trace.
> **Do not build yet:** specialist/pharmacy agents, outbound calls.

---

## Phase 6 — Multi-tenant delivery & MVP-1 completion  *(MVP-1)*
**Goal:** onboarding a second hospital is config-only.
**Refs:** ARCHITECTURE §5.1, DEC-1/12/19, §7.2, DEC-8, DEC-5. **Four fully-parallel packages** (§12.7).
**Exit tag:** `v6-mvp1`

### P6.1 — Tenant/module delivery  ‖
- [ ] Subdomain + path resolution wired (T-1, DEC-1); wildcard DNS + Cloudflare SPA history-fallback/path-routing (DEC-12/19).
- [ ] `tenant-manifest`: per-tenant, per-module PWA manifests + branded installs (distinct `scope`/`start_url`).
- [ ] Operator onboarding runbook (< 1h/hospital) executed once end-to-end for a fresh tenant.

### P6.2 — Patient photo sharing  ‖
- [ ] Per-hospital storage bucket (RLS-backed); upload UX; `consult_media`.
- [ ] Gemini vision findings fed into the assessment; appears in the trace.

### P6.3 — Web push  ‖
- [ ] Web push on approval (behind `packages/platform` wrapper, DEC-5); in-app status remains the guaranteed fallback (iOS).

### P6.4 — Receptionist agent split  ‖
- [ ] Split Receptionist into its own registry entry (§7.2) — **config, not orchestrator refactor**.

> **Phase 6 done when:** a brand-new tenant is live on its own subdomain (both `/patient` and `/doctor`) with **zero code changes** · photo consult E2E passes · push received on approval · agent split verified config-only (no orchestrator refactor in the diff). Tag `v6-mvp1`. **← MVP-1 complete.**

---

## Appendix A — The six seams (never weaken; build once)

| # | Seam | Where | Rule |
|---|---|---|---|
| 1 | `<MiraPresence>` | `packages/ui` §10.3 | Orb today, avatar later — one contract; consumers depend only on props. |
| 2 | `VoiceProvider` | `packages/voice` §6.3 | STT/TTS are adapters; no SDK outside adapter files. |
| 3 | Agent registry | `supabase/functions/_shared/agents/` §7 | Agent = config (prompt+model+tools+policies); splitting agents is config. |
| 4 | i18n catalog | `packages/core` DEC-4 | All strings through the catalog from Phase 0; English only shipped. |
| 5 | Platform capability | `packages/platform` DEC-16 | Notifications/share/storage/back-nav via wrappers only. |
| 6 | `LlmProvider` | `_shared/llm/` §1.3 | One adapter (`gemini.ts`); no Gemini SDK outside it. |

## Appendix B — Standing invariants (check on every PR)

- Contracts are law: change a Zod/DB contract → update ARCHITECTURE in the **same** PR (§0 rule 4).
- Isolation is in the DB (RLS default-deny), never in app code (AP-2). The four denial tests run forever.
- `prescriptions` is writable **only** via the approval RPC (AP-5). Approval is UI-only, never voice.
- Nothing bypasses the trace tables — "if it isn't in the trace, it didn't happen" (§8.5).
- Secrets never reach the browser; audio streams direct, keys stay in Edge Functions (AP-3).
- Per-module initial JS ≤ 150 KB gzip; module never imports another module (DEC-19) — both CI-enforced.
- No `any`; validate at every boundary; port the prototype orb, don't redesign (§13, §10.2).

## Appendix C — Session log  *(append one line per working session)*

| Date | Phase/task | What shipped | Next action |
|---|---|---|---|
| 2026-07-08 | — | plan.md created | Begin P0.1 |
| 2026-07-08 | P0.1 | Monorepo skeleton: Bun workspaces + Turborepo, `packages/config` (tsconfig/eslint/prettier/vite base), all 7 packages + `apps/web` stubs with §4-correct deps, `supabase/*` placeholders. `bun run build` 7/7, `typecheck` 13/13 green | Begin P0.2 — design tokens & theme |
