# Virtual Doctor — Architecture Document (Source of Truth)

**Version:** 1.0
**Date:** 2026-07-06
**Status:** Active — this document governs all implementation work.
**Companion:** `docs/PRD.md` v0.1 (product requirements). Where this document and the PRD conflict on *how* to build, this document wins; on *what* to build, the PRD wins.

---

## 0. How to use this document (read first, every agent)

This document is the **single source of truth** for every agent (human or AI) building Virtual Doctor. Rules of engagement:

1. **Do not invent architecture.** If something you need is not specified here, it is either (a) intentionally deferred — check §12 phases and §14 deferred decisions — or (b) a gap. For gaps, propose an addition to this document *before* writing code that depends on it.
2. **Do not duplicate.** Before creating any component, hook, utility, type, or schema, search `packages/*` for an existing one (§10 lists the canonical inventory). Extending an existing shared unit is always preferred over creating a parallel one.
3. **Build only the current phase.** Each phase in §12 has explicit goals, deliverables, acceptance checks, and a "do not build yet" list. Building ahead of phase is a defect, not initiative.
4. **Contracts are law.** The Zod schemas in `packages/core` (§8.3) and the DB schema + RLS (§9) are the interfaces between workstreams. Changing a contract requires updating this document and the schema in the same change.
5. **Never over-engineer.** The bar: could the MVP ship without this abstraction? If yes, and it isn't listed as a deliberate seam (§1.3), don't build it.

---

## 1. High-Level Architecture

### 1.1 System at a glance

```
                        ┌────────────────────────────────────────────┐
                        │                 Browsers                   │
                        │  Patient PWA          Doctor Desk PWA      │
                        │  ⟨slug⟩.patient.⟨D⟩   ⟨slug⟩.desk.⟨D⟩     │
                        └──────┬───────────────────────┬─────────────┘
             HTTPS / WSS       │                       │
        ┌──────────────────────┼───────────────────────┼──────────────────┐
        │                      ▼                       ▼                  │
        │   ┌─────────────────────────────────────────────────────────┐   │
        │   │              Supabase (single project)                  │   │
        │   │                                                         │   │
        │   │  Auth (Google OAuth patients, email/pw doctors)         │   │
        │   │  Postgres + RLS (all domain data, tenant isolation)     │   │
        │   │  Realtime (doctor queue updates)                        │   │
        │   │  Storage (consult images, per-hospital buckets)         │   │
        │   │  Edge Functions (Deno):                                 │   │
        │   │    • ai-consult     — Mira orchestrator (both modes)    │   │
        │   │    • voice-token    — mints short-lived STT/TTS tokens  │   │
        │   │    • tenant-manifest— per-hospital PWA manifest         │   │
        │   └───────────────┬─────────────────────────────────────────┘   │
        │                   │ server-side only (keys never in browser)    │
        └───────────────────┼──────────────────────────────────────────── ┘
                            ▼
        ┌───────────────┐  ┌───────────────┐  ┌────────────────┐
        │ Anthropic API │  │ Streaming STT │  │ Streaming TTS  │
        │ claude-fable-5│  │ (Deepgram)    │  │ (ElevenLabs /  │
        │               │  │               │  │  Azure Neural) │
        └───────────────┘  └───────────────┘  └────────────────┘
```

Audio streams flow **directly between the browser and the voice provider** over WebSocket using short-lived scoped tokens minted by `voice-token` — the Edge Function is in the control path, not the audio path. This keeps voice latency low and Edge Function cost near zero per audio-second.

### 1.2 Architectural principles

| # | Principle | Consequence |
|---|---|---|
| AP-1 | **Serverless-first, stateless-server** | No servers to manage in MVP. Every Mira turn rebuilds context from Postgres; conversations survive function restarts; horizontal scale is free. |
| AP-2 | **Isolation in the database, not the app** | Postgres RLS is the tenancy boundary. Application code is never trusted for isolation. A bug in a query cannot leak another hospital's data. |
| AP-3 | **Secrets never reach the browser** | All AI/STT/TTS keys live in Edge Function env. Browser gets short-lived scoped tokens only. (Replaces the prototype's localStorage key.) |
| AP-4 | **One persona, many agents** | Mira's multi-agent internals (§7) never leak into UX. Same voice, same name, no hand-off language. |
| AP-5 | **Human-in-the-loop is structural** | The `prescriptions` table is only writable through the doctor-approval flow. The AI physically cannot publish a prescription. |
| AP-6 | **Voice pipeline is avatar-ready** | Word timestamps and (where available) visemes flow through the pipeline from day one, even though the orb ignores them (PRD §6.5). |
| AP-7 | **Config over code for tenancy and agents** | New hospital = DB row. New agent = config entry. Neither is a deploy. |

### 1.3 Deliberate seams (the only places we pre-invest in abstraction)

These are the four abstractions we build *before* we strictly need them, because the PRD marks their evolution as certain, and retrofitting them is a rewrite:

1. **`<MiraPresence>`** — orb today, video avatar later. One component contract (§10.3).
2. **`VoiceProvider` interface** — STT/TTS providers are pluggable adapters (§6.3). Provider choice is a config value.
3. **Agent registry** — agents are config (prompt + model + tools + policies), routed by an orchestrator (§7). Splitting the MVP's single LLM into specialist agents is config, not refactor.
4. **i18n scaffolding** — all user-facing strings go through a message catalog from day one; English is the only shipped locale in MVP (Kannada/Telugu/Hindi later).

Everything else follows YAGNI. Specifically **not** abstracted in MVP: no repository pattern over Supabase, no event bus, no microservices, no GraphQL, no custom design-system framework, no monorepo tooling beyond npm workspaces until build times demand it.

---

## 2. Recorded Decisions & Assumptions

The PRD left open questions (§9). This document adopts the following as **working decisions** — each is reversible at the stated cost. Flag disagreement early; silence is consent.

| # | Decision | Rationale / reversal cost |
|---|---|---|
| DEC-1 | Subdomain scheme `⟨slug⟩.patient.⟨domain⟩` and `⟨slug⟩.desk.⟨domain⟩`; the apex domain is an env value (`VITE_VD_DOMAIN`), no code depends on a literal domain. | Matches PRD examples. Reversal: DNS + env change only. |
| DEC-2 | Voice providers: **Deepgram** (streaming STT, `nova`-family model) + **ElevenLabs Flash** (streaming TTS with word timestamps) as MVP defaults, **Azure Neural TTS** as the configured cost-fallback. Both behind the `VoiceProvider` interface. Browser Web Speech API is a dev/demo fallback only. | Best latency + empathy per unit cost as of mid-2026. Reversal: implement one adapter file. |
| DEC-3 | **Transcripts only** — raw patient audio is never persisted in MVP. | Lighter privacy burden (PRD rec). Reversal: add a storage sink to the STT adapter + consent copy. |
| DEC-4 | **English only at launch**, all strings through the i18n catalog. | PRD rec. Reversal: add locale files. |
| DEC-5 | In-app status is the required notification channel; **web push ships in Phase 5** (not blocking earlier phases). | Push is additive; service worker already exists for PWA. |
| DEC-6 | **Shared hospital-wide review queue**; no doctor routing/specialty assignment in MVP. | PRD rec. Reversal: add `assigned_doctor_id` column + filter. |
| DEC-7 | Desk coordinator-mode **voice ships one phase after** patient voice (desk launches visual-first). | Reuses the proven patient voice stack (PRD rec). |
| DEC-8 | **Patient photo sharing is in MVP** (Phase 5), analyzed via Claude vision; video deferred. | PRD rec Q7. |
| DEC-9 | Package manager **npm** (workspaces); **no Turborepo** until cold build exceeds ~60 s. | Smallest tool surface. Reversal: add turbo.json, zero code change. |
| DEC-10 | Target market is **India-first** (₹ economics in PRD): compliance baseline is DPDP Act 2023 + Telemedicine Practice Guidelines 2020, with ABDM and HIPAA as design considerations, not deliverables (§13). | Reversal: compliance section widens; architecture already accommodates it. |
| DEC-11 | Model: `claude-fable-5` primary, per-hospital override via `hospitals.ai_config.model`. Vision (photo analysis) uses the same model. | PRD A-2. |
| DEC-12 | Hosting: static apps on **Cloudflare Pages** (two projects, wildcard subdomains, generous free tier, best cold-start CDN for India); Supabase for everything else. | Reversal: any static host works — the apps are pure static builds. |

---

## 3. Technology Stack (authoritative)

| Layer | Choice | Version pin policy |
|---|---|---|
| Language | TypeScript, `strict: true` everywhere (apps, packages, Edge Functions) | Latest stable minor |
| UI | React 19 + Vite | Pin major |
| Monorepo | npm workspaces | — |
| Styling | CSS Modules + design tokens as CSS variables (`packages/theme`). **No runtime CSS-in-JS. No Tailwind.** | — |
| Data/state | TanStack Query v5 over `@supabase/supabase-js`; React state/context for UI-local state. **No Redux/Zustand/MobX.** | Pin major |
| Validation | Zod — single schema source in `packages/core`, used by browser *and* Edge Functions | Pin major |
| PWA | `vite-plugin-pwa` (Workbox) per app | Pin major |
| Backend | Supabase: Postgres 15+ / RLS, Auth, Realtime, Storage, Edge Functions (Deno) | Managed |
| AI | Anthropic API, `claude-fable-5`, streaming, structured JSON output | API version pinned in one const |
| STT | Deepgram streaming WS (adapter) | — |
| TTS | ElevenLabs streaming (adapter); Azure Neural adapter as fallback | — |
| Tests | Vitest (unit), Testing Library (component), Playwright (E2E smoke), pgTAP or SQL scripts (RLS tests) | — |
| Lint/format | ESLint (typescript-eslint, react-hooks) + Prettier, single root config in `packages/config` | — |
| CI | GitHub Actions: typecheck + lint + unit tests + build on every PR; RLS tests on schema changes | — |

**Adding a dependency** to any package requires a one-line justification in the PR description and must not overlap an existing dependency's capability. Bundle-affecting deps must fit the performance budget (§11).

---

## 4. Repository Layout (authoritative)

```
virtual-doctor/
├── apps/
│   ├── patient/                  # Patient PWA
│   │   ├── src/
│   │   │   ├── routes/           # route components (lazy-loaded)
│   │   │   ├── features/         # consult/, records/, profile/, onboarding/
│   │   │   └── app.tsx, main.tsx
│   │   ├── index.html
│   │   └── vite.config.ts
│   └── desk/                     # Doctor Desk PWA
│       └── src/
│           ├── routes/
│           ├── features/         # queue/, review/, mira-panel/
│           └── ...
├── packages/
│   ├── ui/                       # shared components (§10) — presentational only
│   ├── theme/                    # design tokens, light/dark, per-hospital accent
│   ├── api/                      # typed Supabase client, query/mutation hooks, generated DB types
│   ├── voice/                    # voice engine: mic capture, VoiceProvider adapters,
│   │                             #   turn-taking state machine, audio playback + timestamps
│   ├── core/                     # domain types, Zod schemas, consult state machine, i18n catalog
│   └── config/                   # shared tsconfig/eslint/prettier/vite base
├── supabase/
│   ├── migrations/               # numbered SQL migrations incl. RLS policies
│   ├── functions/
│   │   ├── ai-consult/           # Mira orchestrator (§7)
│   │   ├── voice-token/
│   │   ├── tenant-manifest/
│   │   └── _shared/              # agent registry, prompt assembly, safety rules, contracts (imports packages/core schemas)
│   └── seed/                     # dev seed: 2 hospitals, doctors, sample patients
├── docs/                         # PRD.md, ARCHITECTURE.md (this file), ADRs (docs/adr/NNN-*.md)
└── .github/workflows/
```

**Import rules (enforced by ESLint boundaries):**

- `apps/*` may import any `packages/*`. Apps never import from each other.
- `packages/ui` may import `theme` and `core` only — never `api` or `voice` (components receive data and callbacks via props).
- `packages/voice` may import `core` only.
- `packages/api` may import `core` only.
- `packages/core` imports nothing internal (leaf).
- Edge Functions import Zod contracts from `packages/core` (via the `_shared` bridge); they never import UI/voice/api packages.

---

## 5. Low-Level Architecture

### 5.1 Tenant resolution

1. Browser loads `citycare.patient.⟨D⟩`. App parses the subdomain → slug `citycare` (in `packages/core/tenant.ts`; the *only* place subdomain parsing exists).
2. App fetches the hospital row (public read of `id, slug, name, logo_url, theme` only — RLS exposes nothing else anonymously) and applies theme tokens by setting CSS variables on `:root`.
3. `tenant-manifest` Edge Function serves `manifest.webmanifest` per tenant (name, icons, theme color) so each hospital's install is branded.
4. The hospital `id` is attached to every consult at creation *server-side* (the Edge Function resolves slug → id itself; the client's claim is never trusted).

### 5.2 Auth & session

- Patients: Supabase Google OAuth. First sign-in triggers the profile wizard (`patient_details` row).
- Doctors: email/password, provisioned by the operator (no self-signup path exists in the UI or API).
- JWT custom claims (set via Supabase auth hook): `role`, and memberships are resolved by RLS via the `memberships` table (not stuffed into the token, so revocation is immediate).
- Session persists across PWA launches (Supabase default localStorage persistence is acceptable; tokens are origin-scoped per subdomain — this is why patient and desk are separate URL families).

### 5.3 The consult turn (text or voice) — one code path

Every Mira turn, regardless of input mode, is:

```
client ──(POST /ai-consult, {consultId, turn})──▶ Edge Function
  1. authn: verify JWT, verify consult ownership (defense in depth on top of RLS)
  2. context assembly: load patient profile, allergies, prior consults/prescriptions,
     current transcript — all via service role, scoped to this consult's hospital
  3. safety injection: hard rules block (allergies, age/pregnancy constraints,
     red-flag escalation policy) appended server-side; client input can never alter it
  4. orchestrator: route to agent (§7), call Anthropic streaming
  5. stream response: SSE to client — text tokens stream immediately;
     structured JSON tail (note/confidence/flags/done/recommendation) parsed at end
  6. post-validation: recommendation validated against MiraPatientTurn schema AND
     re-checked against the allergy hard-rules (independent code path from the prompt)
  7. persist: consult_messages + ai_drafts written; status transition if done
```

Voice differs only at the edges: STT produces the `turn` text; the streamed reply text is forked to the TTS adapter sentence-by-sentence (§6.2). The consult logic is identical — this is what makes P-3a (mixed voice/text turns) free.

### 5.4 Doctor review flow

- Queue: TanStack Query + Supabase Realtime subscription on `consults` where `status = 'pending_review'` for the doctor's hospital, ordered urgency → age.
- Review screen loads: transcript, latest `ai_drafts` row, patient profile/history panel.
- Conversational edits (D-9): doctor turn → `ai-consult` in coordinator mode → response `{reply, action: 'edit', recommendation}` → the **draft on screen updates**; nothing persists as a prescription.
- **Approval is an explicit UI action** (button + confirm) that calls a single Postgres RPC `approve_consult(consult_id, final_items, advice)` running as a transaction: inserts `prescriptions`, inserts `reviews` (with diff vs AI draft), flips consult status. This RPC is the *only* write path to `prescriptions` (AP-5). Voice can never trigger it.
- Reject/escalate follow the same RPC pattern (`reject_consult`, `escalate_consult`).

### 5.5 Realtime & offline

- Realtime: doctor queue only (MVP). Patient consult status updates via TanStack Query polling (30 s) + push later — do not add a second Realtime channel until profiling says polling hurts.
- Offline (PWA): app shell + records list/detail cached (stale-while-revalidate). Consults require connectivity; the consult screen shows a clear offline state. No offline queueing of consult turns in MVP.

---

## 6. Voice Pipeline (the heart of the product)

### 6.1 Latency budget (end-of-speech → first reply audio, target < 1.5 s, ceiling 3 s)

| Segment | Budget |
|---|---|
| STT endpointing (silence detection → final transcript) | ≤ 400 ms |
| Edge Function context assembly + Anthropic time-to-first-sentence | ≤ 700 ms |
| TTS time-to-first-audio (first sentence, streamed) | ≤ 300 ms |
| Network/playback overhead | ≤ 100 ms |

Measured and logged per turn (§11.3). Any change that regresses p50 latency is a defect.

### 6.2 Streaming choreography

1. Mic audio streams browser → Deepgram over WSS (token from `voice-token`, TTL ≤ 60 s, scoped per consult). Interim transcripts render live.
2. End-of-speech (Deepgram endpointing, with tap-to-finish fallback) → final transcript → POST to `ai-consult`.
3. Reply streams back over SSE. The client-side **sentence splitter** (in `packages/voice`) forwards each completed sentence to the TTS adapter immediately — speech starts on sentence 1 while the LLM is still writing sentence 3.
4. TTS adapter returns audio chunks **plus word-level timestamps** (ElevenLabs `with_timestamps`; visemes where provider supports). These feed the `MiraPresence` state machine and are retained in the pipeline for the future avatar (AP-6). The orb consumes only coarse state; the timestamps still flow.
5. Barge-in: if the patient starts speaking while Mira speaks, playback pauses and the turn machine returns to `listening`. (Simple pause, not duplex — good enough for MVP.)

### 6.3 `VoiceProvider` interface (in `packages/voice`)

```ts
interface SttSession {
  start(stream: MediaStream): void;
  onInterim(cb: (text: string) => void): void;
  onFinal(cb: (text: string) => void): void;   // fired on endpointing
  stop(): Promise<void>;
}
interface TtsSession {
  speak(sentence: string): void;                // append to the utterance queue
  onAudio(cb: (chunk: AudioChunk) => void): void;
  onTimestamps(cb: (words: WordTiming[], visemes?: Viseme[]) => void): void;
  flush(): Promise<void>;
  cancel(): void;                               // barge-in
}
interface VoiceProvider {
  createStt(token: string, opts: SttOpts): SttSession;
  createTts(token: string, opts: TtsOpts): TtsSession;
}
```

Adapters: `deepgram.ts`, `elevenlabs.ts`, `azure-tts.ts`, `webspeech.ts` (dev only). Provider selection comes from hospital config with platform default. **No code outside the adapters may reference a provider SDK or endpoint.**

### 6.4 Turn-taking state machine (in `packages/voice`, consumed by both apps)

States: `idle → listening → thinking → speaking → listening …` with `error` and `ended`. This machine is the single driver of `<MiraPresence>` in both apps — patient mode and coordinator mode differ only in who is on the other end.

---

## 7. Agent Design (Mira's internals)

### 7.1 Model

An **agent is a config object, not a class hierarchy**:

```ts
interface AgentConfig {
  id: 'receptionist' | 'doctor' | /* phase 2+: */ 'pharmacy' | 'lab' | `specialist:${string}` | 'supervisor' | 'comms';
  model: string;                    // default claude-fable-5
  systemPrompt: (ctx: ConsultContext) => string;   // template, assembled server-side
  tools: ToolName[];                // allowlist from the shared tool registry
  policies: { maxTurns: number; maxTokensPerCall: number };
}
```

The registry lives in `supabase/functions/_shared/agents/`. Per-hospital overrides come from `hospitals.ai_config` (model, voice persona, quota numbers — *not* arbitrary prompt injection; overridable fields are an explicit allowlist).

### 7.2 Orchestrator (`ai-consult` Edge Function)

- Routes each turn by consult status + app: `active` + patient app → patient-mode pipeline (receptionist stage until chief complaint captured, then doctor agent); `pending_review` + desk → coordinator mode.
- **MVP simplification (mandated):** receptionist + doctor are **one LLM call with two prompt stages**, exposed as two logical agents in the registry. Do not build multi-call agent chains, agent-to-agent messaging, or a planning loop in MVP. The registry seam is what preserves the option (AP-7).
- Merges are trivial in MVP (single agent output). The merge point exists as a named function (`composeMiraTurn`) so specialist opinions have a place to land in phase 2.
- Enforces quotas before calling any provider: max turns/consult, max tokens/call, per-hospital daily consult quota (covers LLM + STT + TTS spend). Quota-exceeded returns a graceful spoken/text wrap-up, never a raw error.

### 7.3 Response contracts (carried over from the prototype, formalized)

All agent outputs must parse against these Zod schemas (`packages/core/contracts.ts`). Parse failure → one automatic re-ask with the validation error appended → then graceful degradation (save transcript, apologize, mark consult `active` for resume). Never show raw JSON or a stack to a user.

```ts
// Patient mode — every turn
MiraPatientTurn = {
  reply: string,                    // spoken/shown text
  note: string,                     // ≤ 7-word clinical note for the transcript margin
  confidence: 'low' | 'medium' | 'high',
  flags: string[],                  // safety flags surfaced to the reviewing doctor
  done: boolean,
  recommendation: Recommendation | null,   // present iff done
  tone?: 'reassuring' | 'concerned' | 'cheerful' | 'neutral',  // reserved for avatar/TTS style (A-8)
}

Recommendation = {
  type: 'prescription' | 'investigation' | 'advice',
  title: string, summary: string,
  items: Array<{ name, dosage, timing, notes, why, detail }>,
  advice: string,
  urgency: 'routine' | 'soon' | 'urgent',
}

// Coordinator mode — every turn
MiraCoordinatorTurn = {
  reply: string,
  action: 'none' | 'edit' | 'answer',      // NOTE: no 'approve' — approval is UI-only (§5.4)
  recommendation: Recommendation | null,    // present iff action === 'edit'
  citations: Array<{ table: 'consults'|'prescriptions'|'consult_messages'|'patient_details', id: string, excerpt: string }>,
}
```

The prototype's `action: 'approve'` is **deliberately removed**: voice can request changes, only the authenticated UI can sign (PRD D-9).

### 7.4 Safety layering (three independent lines)

1. **Prompt-level hard rules** — server-injected, client-immutable: allergy classes forbidden, age/pregnancy constraints, red-flag symptom list → set `urgency: 'urgent'` + spoken emergency guidance.
2. **Post-validation** — independent code (not the LLM) re-checks every recommendation against the patient's structured allergy list and age constraints before it can enter `pending_review`. Violations block the draft and flag the consult.
3. **Human gate** — the doctor approval RPC (§5.4). Structural, not procedural.

Red-flag consults additionally render the emergency interstitial (P-7) immediately, independent of review latency.

### 7.5 Phase-2+ agents (design intent only — do not build in MVP)

Specialists, Lab, Radiology, Pharmacy, Communication Manager, Supervisor slot in as additional registry entries invoked by the orchestrator around the doctor agent (pharmacy = post-draft check; specialist = pre-conclusion consult; comms = post-approval). Their outputs flow through `composeMiraTurn` and are recorded in `ai_drafts.raw_response` with agent attribution. The `mira_feedback` table (§9) is the Supervisor's future input.

---

## 8. Database Design

### 8.1 Choice

**Postgres on Supabase** — relational (consult lifecycle is transactional and relational), RLS is the best-in-class tenancy mechanism for this shape, free tier → predictable paid scaling, and Realtime/Auth/Storage come from the same platform. No second database. JSONB for genuinely polymorphic payloads (AI raw output, prescription items, theme) — never for data we filter or join on.

### 8.2 Schema (authoritative — matches PRD §6.4 with constraints made explicit)

Tables: `hospitals`, `profiles`, `memberships`, `patient_details`, `consults`, `consult_messages`, `review_messages`, `ai_drafts`, `prescriptions`, `reviews`, `mira_feedback`, `consult_media` — columns exactly as PRD §6.4, plus:

- All PKs `uuid default gen_random_uuid()`; all timestamps `timestamptz default now()`.
- `consults.status` is a Postgres enum; transitions enforced by trigger against the state machine in §8.4.
- `prescriptions.supersedes_id` self-FK; a superseding insert flips the superseded row's consult status via the same RPC.
- Indexes (MVP set): `consults(hospital_id, status, created_at desc)` (queue), `consults(patient_id, created_at desc)` (records), `consult_messages(consult_id, created_at)`, `prescriptions(patient_id)`, `memberships(profile_id, hospital_id)`.
- Migration discipline: numbered SQL files in `supabase/migrations`, forward-only, each migration ships its RLS changes and a rollback note. Generated TS types (`supabase gen types`) are committed to `packages/api` and CI fails if stale.

### 8.3 RLS policy matrix (the tenancy contract)

| Table | patient | doctor | Edge Fn (service role) |
|---|---|---|---|
| hospitals | read `id,slug,name,logo_url,theme` (anon-visible view) | read own hospitals | all |
| patient_details | own row r/w | read, for patients with a consult in their hospital | all |
| consults | own rows r; insert own | r/w where `hospital_id ∈ memberships` | all |
| consult_messages | own consults r; **insert patient turns only** | read (their hospital) | all |
| review_messages | — | own hospital r/w | all |
| ai_drafts | read latest of own consult (summary fields only) | read (their hospital) | **only writer** |
| prescriptions | own r | own hospital r | insert **via approval RPCs only** |
| reviews, mira_feedback | — | own hospital insert/read | all |
| consult_media | own consults r/w (upload) | read (their hospital) | all |

Every table has RLS **enabled with default-deny**; policies are additive grants. RLS tests (§12 Phase 1) assert both the grants and the denials (patient A cannot read patient B; doctor of hospital X cannot read hospital Y — these four negative tests run in CI forever).

### 8.4 Consult state machine (in `packages/core`, mirrored by DB trigger)

```
active → pending_review → approved | rejected | escalated
approved → communicated → closed
approved → superseded (via superseding prescription)
```

Any transition not in this list is rejected at the database. UI state derives from this enum only — no shadow status fields.

---

## 9. Multi-Tenancy Summary

- Tenant = `hospitals` row; resolved from subdomain (§5.1); enforced by RLS (§8.3); themed by CSS variables + per-tenant manifest (§5.1).
- A patient with accounts at two hospitals has two `memberships`; data never crosses (T-4).
- Per-hospital config surface (all in `hospitals` row): `theme` (colors/logo/name), `ai_config` (model override, voice persona id, quotas). Nothing else is per-hospital in MVP.

---

## 10. Component Library & Design System (`packages/ui` + `packages/theme`)

### 10.1 Rules

1. **Single source**: every visual element used by both apps lives in `packages/ui`. App-local components are allowed only when genuinely app-specific (e.g., the desk's queue card); the moment the second app needs it, it moves to `packages/ui` in the same PR.
2. **Presentational only**: `ui` components take props and callbacks; they never fetch, never import `api`/`voice`, never read router or Supabase state.
3. **Tokens only**: no literal colors, font sizes, spacing, radii, or shadows in any component — CSS variables from `packages/theme` exclusively (`--vd-accent`, `--vd-surface`, `--vd-text`, `--vd-radius-*`, `--vd-space-*`, `--vd-font-*`). This is what makes hospital branding and dark mode zero-component-change.
4. **Accessibility floor**: every interactive component keyboard-operable, labeled, WCAG AA contrast in both themes; the consult screen fully usable with screen reader + text mode (the voice product must not be voice-*only*).
5. Each component ships with: types, a minimal usage doc-comment, and a Testing Library test for its states. No Storybook in MVP (revisit when a designer joins).

### 10.2 Canonical inventory (check here before creating anything)

| Component | Purpose | Notes |
|---|---|---|
| `MiraPresence` | Mira's visual embodiment | Contract in §10.3; `OrbPresence` is the MVP implementation |
| `TranscriptView` | scrolling conversation, interim-transcript rendering | both apps |
| `ComposerBar` | text input + mic toggle + tap-to-finish | patient app; desk reuses for Ask-Mira |
| `RecommendationCard` | structured draft: items, why, advice, urgency | patient (read-only) + desk (editable variant) |
| `PrescriptionView` | approved prescription, print/share layout | patient + desk |
| `ConsultStatusBadge`, `UrgencyBadge`, `ConfidenceBadge`, `SafetyFlagList` | status chips | shared |
| `QueueCard` | consult summary card for the review queue | desk (lives in ui for future admin reuse) |
| `PatientHistoryPanel` | profile + prior consults side panel | desk |
| `EmergencyInterstitial` | red-flag full-screen guidance | patient |
| `AiDisclosureBadge` | persistent "AI doctor — reviewed by a human physician" | patient, always visible in consult |
| Primitives | `Button`, `Card`, `Sheet/Drawer`, `Dialog`, `TextField`, `Select`, `Toast`, `Skeleton`, `EmptyState`, `AppShell` (header/nav/safe-areas) | build once, first phase that needs them |

The prototype (`js/orb.js`, `index.html` keyframes) is the **visual reference** for the orb states and motion language — port, don't redesign.

### 10.3 `<MiraPresence>` contract (the avatar seam — do not weaken)

```ts
interface MiraPresenceProps {
  state: 'idle' | 'listening' | 'thinking' | 'speaking';
  audioLevel?: number;              // 0–1, mic or playback envelope
  wordTimings?: WordTiming[];       // flows even though the orb ignores it
  visemes?: Viseme[];               // provider-dependent, may be empty
  tone?: MiraTone;                  // reserved emotion channel
}
```

`OrbPresence` (CSS/SVG, no canvas/WebGL) implements this in MVP. The future `AvatarPresence` implements the same props and is lazy-loaded; **no consumer may depend on implementation details of either**. Layout rule: consult screens are **call screens** — full-height presence area, transcript as overlay drawer (PRD §6.5).

---

## 11. Performance, Cost & Observability

### 11.1 Performance budget (regressions are defects)

- LCP < 2.5 s on mid-range Android over 4G; initial JS ≤ **150 KB gzipped per app**; Lighthouse PWA + Performance ≥ 90.
- Route-level code splitting; consult and records screens lazy-loaded; fonts self-hosted + preloaded (remove the prototype's Google Fonts CDN link); images `loading=lazy`, AVIF/WebP.
- CI runs `size-limit` on both app bundles; exceeding budget fails the build.

### 11.2 Cost guardrails (A-5)

Per-hospital daily consult quota + per-consult turn cap + per-call token cap, enforced in the orchestrator *before* provider calls. A `usage_events` lightweight log (tokens, STT seconds, TTS characters per consult) gives the operator per-hospital unit economics from day one.

### 11.3 Observability (MVP-sized)

- Structured logs in Edge Functions (JSON): request id, consult id, hospital id, agent id, latency segments (§6.1), token counts. **Never any PHI, transcript text, or patient identifiers beyond opaque ids.**
- Client: Sentry (or equivalent) with PII scrubbing on, plus Web Vitals reporting.
- One operator dashboard query set (SQL in `docs/ops.md`): consults/day per hospital, p50/p95 voice latency, approval-with-no-edit rate, quota consumption — the PRD §8 metrics must be *measurable* from launch, not retrofitted.

---

## 12. Implementation Phases

Rules: phases ship in order; a phase is done only when its acceptance checks pass in CI/staging; "do not build yet" lists are binding. Each phase ends with a tagged, deployable state.

### Phase 0 — Foundation (goal: an empty but real product skeleton)
**Deliverables:** monorepo per §4; `packages/config` toolchain; `packages/theme` tokens (light/dark); `packages/core` with tenant parsing, consult state machine, contracts (§7.3) and i18n scaffold; CI (typecheck/lint/test/build/size-limit); both apps deploy to Cloudflare Pages with wildcard subdomains showing a themed shell.
**Accept:** `npm i && npm run build` green; both apps live on two tenant subdomains with distinct branding from seed data; CI enforces budgets.
**Do not build yet:** any Supabase table beyond `hospitals`, any AI call, any voice code.

### Phase 1 — Data platform & auth (goal: tenancy is real and provably isolated)
**Deliverables:** full schema + RLS (§8) as migrations; seed script (2 hospitals, 2 doctors each, sample patients); Supabase Auth wired (Google for patient app, email/pw for desk); profile wizard; generated DB types in `packages/api` + base query hooks; RLS negative-test suite in CI.
**Accept:** the four cross-tenant denial tests pass; a patient can sign in, complete profile, see an empty records list; a doctor sees an empty queue for *their* hospital only.
**Do not build yet:** AI, voice, review actions.

### Phase 2 — Text consult, end to end (goal: the full loop works before voice exists)
**Deliverables:** `ai-consult` Edge Function with orchestrator, agent registry (receptionist+doctor as one call/two stages), context assembly, safety layers 1–3, quotas; patient consult UI (text mode: `TranscriptView`, `ComposerBar`, `RecommendationCard`, `EmergencyInterstitial`, `AiDisclosureBadge`); consult lifecycle to `pending_review`; desk queue (Realtime) + review screen + approve/edit/reject RPCs + audit `reviews`; patient records list + `PrescriptionView`.
**Accept:** scripted E2E: patient completes a text consult → doctor edits + approves → patient sees the signed prescription; allergy hard-rule blocks a conflicting draft in post-validation; red-flag input produces urgent flag + interstitial; all actions audited.
**Do not build yet:** any STT/TTS, desk voice, images, push.

### Phase 3 — Patient voice (goal: the product's core experience at target latency)
**Deliverables:** `packages/voice` (state machine, sentence splitter, Deepgram + ElevenLabs adapters, webspeech dev adapter); `voice-token` function; `OrbPresence` ported from prototype; call-screen layout; barge-in; mixed voice/text turns; latency instrumentation (§6.1); spoken AI disclosure at consult start.
**Accept:** hands-free consult end-to-end on a mid-range Android; p50 end-of-speech → first audio < 1.5 s, p95 < 3 s on staging; mic-denied path falls back to full text consult; timestamps observable flowing to `MiraPresence` props.
**Do not build yet:** desk voice, avatar work of any kind.

### Phase 4 — Desk coordinator voice (goal: Mira presents; the doctor converses)
**Deliverables:** coordinator mode in the orchestrator (SBAR presentation, grounded Q&A with citations per D-8, conversational edits per D-9 — `action:'edit'` updates the on-screen draft only); desk reuses `packages/voice` + `MiraPresence`; per-doctor mute/skip preference (persisted); `review_messages` audit; `mira_feedback` capture UI.
**Accept:** doctor opens a case, hears the presentation, asks two history questions answered with on-screen citations, dictates an edit, sees the draft change, signs via UI; voice cannot trigger approval (test exists); presentation skippable.
**Do not build yet:** specialist/pharmacy agents, outbound calls.

### Phase 5 — MVP hardening & launch (goal: shippable to a first real hospital)
**Deliverables:** photo sharing (upload to per-hospital bucket, Claude vision findings into the assessment, `consult_media`); web push on approval; per-tenant PWA manifests + install polish + offline records; quotas + `usage_events` + operator dashboard queries; Sentry + Web Vitals; security pass (headers/CSP, dependency audit, RLS re-review); accessibility pass; seed→onboarding runbook (< 1 h per new hospital); load sanity test (50 concurrent consults).
**Accept:** Lighthouse ≥ 90 both apps; PRD §8 metrics all measurable from the dashboard; onboarding runbook executed once end-to-end for a fresh tenant.

### Post-MVP phase ladder (direction, not commitment)
P6 Pharmacy + Lab agents, admin UI · P7 Specialist agents + Supervisor + feedback loop · P8 i18n locales (Kannada/Telugu/Hindi voice+text) · P9 Communication Manager, outbound Mira call, doctor-patient video · P10 `AvatarPresence`.

---

## 13. Compliance, Privacy & Safety

Baseline (DEC-10): **India-first**. HIPAA/ABDM are design considerations — the architecture must not preclude them; certification is out of MVP scope (PRD non-goal).

1. **DPDP Act 2023 (India):** consent-first — explicit consent screen at signup covering health-data processing and AI involvement; purpose limitation (data used only for care delivery + doctor review); patient rights supported structurally (export = records view/PDF; erasure = operator runbook with medical-record retention exceptions documented); breach-notification runbook in `docs/ops.md`.
2. **Telemedicine Practice Guidelines 2020 (India):** every prescription attributed to a named, registered medical practitioner (`prescriptions.doctor_id` → doctor profile carries name + registration number field); the RMP's identity displayed on the prescription view; AI is decision-support only — mandatory human sign-off is structural (AP-5); prescription-eligible drug lists are the reviewing doctor's responsibility, with hard-rule blocklists (e.g., schedule X) in the safety layer.
3. **AI transparency:** spoken disclosure at consult start + persistent `AiDisclosureBadge` (P-3b); "not yet approved" labeling on drafts; rejected consults tell the patient a human decided they need in-person care.
4. **Data protection engineering:** TLS everywhere; RLS default-deny; no PHI in logs/analytics/error reports (§11.3, Sentry scrubbing); AI/voice providers receive the minimum context needed and are configured for zero data retention where the provider supports it (Anthropic ZDR; verify per voice provider); raw audio never persisted (DEC-3); storage buckets per hospital with RLS-backed policies; backups via Supabase PITR once on a paid tier.
5. **Auditability:** `reviews` (action + diff), `review_messages`, `ai_drafts` (raw model output), `mira_feedback` — every clinical artifact traceable to who/what/when. Approved prescriptions immutable; corrections supersede (D-5).
6. **HIPAA/ABDM readiness notes:** single-region data residency (choose Supabase Mumbai region at project creation — cheap now, painful later); BAA-capable vendors preferred when choices are otherwise equal; ABDM linkage (ABHA ids) would attach at `patient_details` — no schema obstacle.

---

## 14. Best Coding Practices (binding for all agents)

### 14.1 General
- TypeScript `strict`; **no `any`** (use `unknown` + narrowing); no `@ts-ignore` without a linked issue.
- **Validate at every boundary** with the shared Zod schemas: client→EdgeFn input, LLM output, EdgeFn→client payloads, form input. Inside a validated boundary, trust the types.
- Small modules, one responsibility; functions that fit on a screen; prefer pure functions in `core`.
- Errors: never swallow. User-visible failures get a friendly i18n message + retry affordance; internals get a structured log with request id. Voice errors degrade to text, never dead-end.
- Naming: `camelCase` TS, `snake_case` SQL, `kebab-case` files, `PascalCase` components. Domain terms from the PRD glossary only (`consult`, not `session`/`case` mixed; `patient` is canonical, never `customer` in code).
- Comments explain constraints and *why*, not what. No commented-out code in main.

### 14.2 React
- Function components + hooks only. Server state in TanStack Query (keys defined centrally in `packages/api` — never inline strings); UI state local; no global state library.
- Data fetching in `packages/api` hooks; components stay presentational (§10.1). Lazy-load routes. No `useEffect` for derivable state.

### 14.3 SQL / Supabase
- Schema changes only via migrations; every table RLS-enabled default-deny in the same migration that creates it; every privileged write is an RPC with an explicit grant, not a broad policy.
- Never use the service role key outside Edge Functions. Never interpolate SQL.

### 14.4 AI / prompts
- Prompts are versioned code (`_shared/agents/prompts/`), reviewed like code, with golden-transcript tests: a fixture suite of consult scenarios (common cases, allergy conflict, red flags, prompt-injection attempts from the patient) runs against schema-validity and safety assertions on every prompt change. Model/params referenced from config only — never hardcoded at call sites.
- Treat all user input as untrusted prompt content: patient text is delimited and never concatenated into system-level instructions.

### 14.5 Process
- Trunk-based; small PRs (one concern); PR template asks: phase compliance? new dependency justified? contract change reflected in ARCHITECTURE.md? tests?
- Tests: unit for `core`/`voice` logic (state machines, sentence splitter, contracts), component tests for `ui` states, one Playwright smoke per primary use case (UC-1/2/3), RLS negative suite, prompt golden suite. Target: the Phase-2 E2E stays green forever.
- Architectural decisions that deviate from or extend this document → short ADR in `docs/adr/` + update the relevant section here in the same PR. This document must never drift from the code.

---

## 15. Glossary (canonical terms — use these exact words in code and docs)

| Term | Meaning |
|---|---|
| **consult** | One patient↔Mira conversation and its lifecycle (§8.4) |
| **draft** | Mira's recommendation before doctor approval (`ai_drafts`) |
| **prescription** | Doctor-approved, immutable record (may be of type advice/investigation) |
| **patient mode / coordinator mode** | Mira's two personas (PRD A-9) |
| **presence** | Mira's visual embodiment (orb → avatar) behind `<MiraPresence>` |
| **turn** | One user input + one Mira response |
| **tenant / hospital** | Interchangeable; `hospital` in code |
| **operator** | The platform owner (you) |
