# ADR 001 — Bun (package/script manager) + Turborepo (task caching) for the monorepo toolchain

**Status:** Accepted
**Date:** 2026-07-07
**Deciders:** nvkudva
**Supersedes:** the "npm workspaces" Monorepo row in ARCHITECTURE.md §3 (updated in the same change)

## Context

The repo is a single-build monorepo (DEC-19): `apps/web` + `packages/*` bundled by Vite,
with Supabase Edge Functions running on **Deno** and the app running in the **browser**.
Neither runtime is Node/Bun. CI (§3) runs typecheck + lint + unit tests + build on every PR.

Daily friction and cognitive load concentrate in three places, each with a different cost:

1. **Install time** — `npm install` across the workspace, locally and on every CI run.
2. **CI/local task time** — re-running typecheck/lint/test/build across all packages even
   when only one changed.
3. **Onboarding / context-switching** — two JS runtimes (Deno + browser) plus several CLIs.

We evaluated adopting **Bun** to address (1), and how far to take it.

## Decision

**Adopt Bun as the package manager and script runner** (replaces `npm` in §3 Monorepo row).
`bun install` / `bun run` / `bunx` across the `packages/*` workspaces; lockfile is `bun.lock`.

**Adopt Turborepo** for content-hashed task caching over the workspace, so CI and local
runs only re-execute typecheck/lint/test/build for packages whose inputs changed.

**Explicitly keep the following unchanged** — Bun is a build-time tool here, not a runtime:

- **Vite** remains the bundler + dev server. Bun *runs* Vite; it does not replace it.
  The PWA / `manualChunks` / per-module download-isolation story (DEC-19, §11.4) is Vite's.
- **Vitest** remains the test runner. `bun test` is a different, Vitest-incompatible API and
  would cost us Testing Library + jsdom + Vite-config reuse. Not worth it.
- **Deno** remains the Edge Function runtime, driven by the `supabase` CLI. Bun is never
  used to run or bundle `supabase/functions/*`. This boundary stays clean.

## Consequences

**Positive**
- `bun install` is ~10–25× faster than `npm install` — compounds on every CI run and local pull.
- Turborepo caching makes the §3 four-check CI near-instant on untouched packages.
- No change to `package.json` semantics; only the lockfile and the `packageManager` field change.

**Neutral / costs**
- A third JS tool (Bun) joins Deno + browser — accepted because Bun stays build-time-only, so
  it adds no new *runtime* semantics to reason about.
- CI images must install Bun + Turborepo (pin versions — see ADR follow-ups / devcontainer).

**Risks & mitigations**
- Bun lockfile/registry edge cases → CI runs `bun install --frozen-lockfile`; renovate/CI catches drift.
- Turborepo cache correctness depends on correct `inputs`/`outputs` per task → codified in
  `turbo.json`, reviewed like code.

## Follow-ups (not part of this ADR, tracked separately)

- `syncpack` to enforce single dependency versions across workspaces (§3 "no overlapping dep" rule).
- One-command local stack (`bun run dev` → Vite + `supabase start` + Edge Functions + seed).
- Devcontainer / Nix flake pinning Bun / Deno / Node / `supabase` CLI versions.
- `vite-plugin-checker`, `dependency-cruiser` (enforce §4 import rules), `lefthook` pre-commit.
