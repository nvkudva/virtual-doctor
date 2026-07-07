# Virtual Doctor — Design & Product Context

> Context doc for new threads. The whole product lives in a single Design Component: **`Virtual Doctor App.dc.html`** (with `ios-frame.jsx` and `image-slot.js` as sibling assets, `support.js` runtime). Author it with the `dc_*` tools. This doc carries everything needed to recreate the design.

## What this is
Virtual Doctor is a design of an AI-doctor app. A patient signs in and is **immediately connected to a voice consultation** with an AI physician, "Dr. Mira." She greets them warmly, asks about symptoms one question at a time with empathy, draws on the patient's medical history, and produces a recommendation (investigations/tests and/or a prescription). Every AI recommendation is then **reviewed by a licensed human doctor** in a back-office "Doctor desk" before it reaches the patient. Behind the scenes the intent is specialist AI agents (GP, dermatologist, etc.) routed invisibly — the patient never sees that machinery.

## Core intent & experience principles
- **Voice-first.** Talking to the doctor is the primary interaction; typing is a secondary fallback. Minimize cognitive load and clicks — the patient should reach an outcome with almost no UI friction.
- **Empathy.** Dr. Mira acknowledges feelings before asking clinical questions, varies her wording (never scripted), reassures on privacy, introduces herself as an AI whose advice a human doctor reviews.
- **Trust & safety.** Human-in-the-loop review is first-class; a named reviewer (Dr. Sara Whitfield, MD · General Physician · GMC-483920); always-visible emergency escalation; respects the patient's drug allergies (e.g. Penicillin) as a hard rule; AI surfaces a confidence signal and flags for the human reviewer.
- **Calm, premium, futuristic-medical look.** Not clinical-cold, not toy-like.

---

# Design spec (tokens & parameters)

## Typography
- **Family:** `"Instrument Sans", system-ui, sans-serif` (Google Fonts, weights 400/500/600/700). Single family everywhere.
- **Scale (px):**
  - Hero/login title 30 · patient home greeting 25 · case-header patient name 21 · profile name 20 · app title (page top) 19
  - Button/primary CTA 15–17 (700) · card titles 14–15.5 (600–700) · body 12.5–13.5 (line-height 1.4–1.6)
  - Micro-labels (section headers inside cards): 10–11.5px, weight 700, `letter-spacing:.04–.09em`, `text-transform:uppercase`
  - Status/tag pills 10.5–12.5 (700)
- White text over gradient always gets `text-shadow` (e.g. `0 1px 10px rgba(20,30,80,.4)`).

## Color
- **Page desk background (behind everything):** `radial-gradient(ellipse 120% 80% at 50% 0%, #E9EDF4 0%, #DCE1EB 100%)`.
- **App background gradient (patient screen AND doctor desk panel):** `linear-gradient(165deg, #7FA8DC 0%, #5F7CC4 48%, #414FA0 100%)`.
- **Background dressing (both platforms):**
  - Faint grid: `repeating-linear-gradient(0deg, rgba(255,255,255,.06–.07) 0 1px, transparent 1px 44px)` + same at 90deg, masked with `mask-image: radial-gradient(ellipse 90% 60–70% at 50% 30–38%, #000 20%, transparent 75–80%)`.
  - 2–3 radial color glows (~50–75% size circles, off-canvas): teal `oklch(0.8 0.14 195 / .45–.5)`, magenta `oklch(0.68 0.19 330 / .4)`, violet `oklch(0.55 0.2 290 / .4–.45)`, each `radial-gradient(circle, <color>, transparent 65%)`.
- **Ink (dark text):** `#243247` primary · `#3A4E6E` body · `#5A6B82`/`#6B7A92` secondary · `#8493AC` muted/micro-labels · `#1E3A5C` on-glass text.
- **Accents (oklch, shared chroma ~0.2):**
  - Primary action violet gradient: `linear-gradient(180deg, oklch(0.66 0.2 265), oklch(0.55 0.23 300))` (send, Start consultation, End). Hover/large variant `0.68/0.56`.
  - Approve green gradient: `linear-gradient(180deg, oklch(0.72–0.75 0.15 155), oklch(0.62–0.64 0.16 160))`, text `#06231A`.
  - Danger/decline: `#C0405A`; notification badge `oklch(0.62 0.21 20)`.
  - Indigo label color `#5F6FD6`; tests blue `#3E86C4`; prescription purple `#8B4FD6`.
- **Status pill colors (bg|fg):** pending `#FFE9A8|#6B4E00` · approved `#BFEBD5|#0E5A38` · changes `#CFE0FF|#1D3E86` · declined `#FBD2DA|#8E2440`. Confidence pills reuse high=approved, medium=pending, low=declined colors.
- **Lab result tags:** ok `oklch(0.72 0.13 160 / .16)` bg / `oklch(0.42–0.45 0.13 160)` fg; attention `oklch(0.8 0.14 70 / .2–.25)` bg / `oklch(0.45–0.5 0.14 60)` fg.
- **Info/advice tint:** `oklch(0.7 0.13 200 / .1–.12)` bg, label `oklch(0.45 0.12 220)`. Safety-green strip: `oklch(0.72 0.13 160 / .12–.14)`.

## Surfaces & glass
- **Solid white card:** `background:#fff`, radius 16–22, shadow `0 14px 34px rgba(12,20,60,.32)` (desk) or `0 18px 40px rgba(12,20,60,.3)` (patient rec card); inner sub-blocks `#F5F7FB`/`#F3F6FB`, radius 9–13.
- **Frosted glass chip/button:** `rgba(255,255,255,.32)` + `backdrop-filter:blur(14px) saturate(160%)`, radius 13, shadow `0 3px 12px rgba(12,20,60,.22)`. Height 38px (34px for compact desk actions).
- **Glass panel (notes/threads):** `rgba(255,255,255,.22)` + blur(14px), radius 16, shadow `0 6px 18px rgba(12,20,60,.2)`.
- **Input row:** `rgba(255,255,255,.9)`, radius 16, padding `4px 4px 4px 8px`, shadow `0 6px 18px rgba(12,20,60,.22)`.
- **Control-bar dock:** `rgba(255,255,255,.24)` + blur(18px) saturate(180%), radius 26, padding 10, shadow `0 16px 38px rgba(12,20,60,.38)`; keys inside radius 17.
- **Popover (notifications/profile):** `#fff`, radius 16, shadow `0 20px 50px rgba(12,20,60,.4)`, `vd-fade .2s`.

## Border radius scale
- 6 (tiny icon squares) · 9–13 (inner blocks, pills-ish, glass chips 13) · 14–18 (cards, inputs, buttons; **16 default card**) · 20–22 (large panels, rec card, desk shell 22, avatar 20) · 26 (control dock) · 99px (pills/chips/status tags) · 50% (orb).
- **No circular buttons** — rounded rectangles everywhere; only pills (99px) and the orb are round.

## Shadows (reference set)
- Chip: `0 3px 10–12px rgba(12,20,60,.16–.22)` · card: `0 6px 16px rgba(12,20,60,.14)` (list) / `0 14px 34px rgba(12,20,60,.32)` (hero card) · CTA: `0 8–12px 20–30px oklch(0.4–0.45 0.2 290 / .5–.55)` · approve: `0 3–5px 10–14px oklch(0.5 0.15 160 / .4–.45)` · desk shell: `0 30px 70px rgba(10,18,45,.35)` · popover: `0 20px 50px rgba(12,20,60,.4)`.

## The orb (construction recipe — keep identical everywhere)
Wrapper `position:relative` (152×162 patient / 116×124 desk / 76×82 rec-screen mini; orb itself 138 / 116-ish / 70):
1. **Ground shadow:** absolute ellipse at bottom, `width:~84% of orb`, height 12–20, `radial-gradient(ellipse, rgba(12,20,60,.4), transparent 70%)`, `filter:blur(3–4px)`.
2. **Expanding ring(s):** absolute inset, `border-radius:50%`, `border:1.5px solid <ringColor>`, `animation: vd-ring 2.8s ease-out infinite` (second ring delayed 1s, opacity .6). Ring color is white at rest; changes per voice state.
3. **Sphere:** `border-radius:50%; overflow:hidden; background:#F4FAFF`, shadow `0 24px 48px oklch(0.35 0.15 270 / .55), 0 0 38px oklch(0.7 0.15 260 / .4), inset 0 0 0 1px rgba(255,255,255,.85)`, animation per state (below). Inside:
   - Layer A (`inset:-20%`, `vd-spin 9s linear`): blob teal-blue `oklch(0.75 0.16 230)` blur 16 at top-left (70%), blob purple `oklch(0.72 0.18 310)` blur 18 at bottom-right (65%).
   - Layer B (`inset:-20%`, `vd-spin-r 13s linear`): blob cyan `oklch(0.78 0.15 190)` blur 14 right (60%), blob pink `oklch(0.75 0.17 350)` blur 16 bottom-left (50%) with extra `vd-drift 7s`.
   - Depth: `inset 0 -16px 26px oklch(0.4 0.13 275 / .4), inset 0 10px 16px rgba(255,255,255,.5)`.
   - Specular: `radial-gradient(circle at 33% 22%, rgba(255,255,255,.9), transparent 42%)`.
4. **State animations:** idle `vd-pulse 3.6s` · listening `vd-listen` · thinking `vd-think` · speaking `vd-speak`. Blur radii scale down ~25% on smaller orbs.

## Keyframes (all in helmet `<style>`)
`vd-pulse` (scale 1→1.05) · `vd-ring` (scale 1→1.55, fade out) · `vd-bar` (scaleY .35→1, waveform) · `vd-spin` / `vd-spin-r` (360° both directions) · `vd-drift` (translate ±8%, scale 1.15) · `vd-fade` (fade + 8px rise, .3s) · `vd-dot` (typing dots opacity) · `vd-listen` / `vd-think` / `vd-speak` (orb states) · `vd-slidein` (14px rise).

## Layout & platforms
- Page: centered column, `padding:26px 20px 60px`, gap 22. Top: "Virtual Doctor" title (19/700 `#243247`) + white segmented tab switcher (radius 12, active tab = dark pill).
- **Patient app:** inside `ios-frame.jsx` (`IOSDevice` via x-import), 402×874. Screens pad `66px top` (status bar) / 20–26px sides.
- **Doctor desk:** `width:min(1160px,100%)`, radius 22, `overflow:hidden`, border `1px solid rgba(255,255,255,.3)`, gradient bg + grid + glows. Body = flex-wrap row, gap 14, `padding:4px 18px 18px`:
  - **Queue rail:** `flex:1 1 250px; max-height:640px; overflow-y:auto`.
  - **Case detail:** `flex:999 1 460px; max-height:640px; overflow-y:auto; border-radius:18px`. First child is a **sticky case header** (`position:sticky;top:0;z-index:6`, padding `14px 10px 16px`, background = the app gradient `165deg #7FA8DC→#5F7CC4 60%→#5474bd`, `border-radius:0`, **no backdrop-filter** — it breaks ancestor corner clipping — **no box-shadow**; a `style-after` pseudo adds a 22px fade `linear-gradient(to bottom, #5474bd, transparent)` below so content scrolls under smoothly). Inside case detail: two-column flex-wrap — widgets `flex:8 1 240px`, conversation `flex:2 1 280px; position:sticky; top:0` at fixed height 600px.
- Scrollbars hidden via `.vd-scroll::-webkit-scrollbar{width:0}`.

---

# Component inventory

All components live inline in the single DC (template markup repeated where used, styled inline). "Reusable" here means the same visual/behavioral pattern appears in more than one place — when editing one instance, keep the twins in sync.

### Reusable across patient app & doctor desk
- **Voice-chat interface (the big one).** The patient↔Dr. Mira consult UI and the real-doctor↔Dr. Mira review panel are the **same interface with different data/context**: orb (state-animated) + "DR. MIRA" label (12/700, uppercase, `.1em` tracking) + waveform status pill (glass `rgba(255,255,255,.4)`, 5 bars 3px wide, radius 2, oklch violet hues, `vd-bar` when live) + spoken-line caption + white quick-reply chips (`rgba(255,255,255,.85)`, radius 99, 12.5–13/600 `#3A4E6E`) + collapsible notes thread (glass panel, 36×4px drag handle, uppercase micro-title; "Consult notes" vs "Review thread"; animated `max-height` 84↔300px / 76↔220px) + always-on input row (icon 38px, input 14.5px `#243247`, violet-gradient send 40×40 radius 12) + control dock (End key 112px wide + Mute key). Differences: data + system prompt, chip labels (patient: symptoms; desk: Change prescription / Add lab test / Remove lab test / Update advice), and the green **Approve & send** chip on the desk side.
- **The orb** — see recipe above; identical construction on sign-in, home, patient consult, recommendation (mini), and doctor desk.
- **Glass chip/button** — spec under Surfaces; used for back buttons, End, profile chips (AK/SW), notification bell, "Private & encrypted", "Clinical Review", "Live review", "n pending".
- **Status pill** — 99px radius, 700 weight, bg|fg pairs above; queue cards, case header, confidence, consult/lab tags.
- **White widget card** — spec under Surfaces; AI consultation, Patient history, Test history, Previous consultations, recommendation card, queue cards (semi `rgba(255,255,255,.6)` inactive / `#fff` + violet `1.5px` border `oklch(0.6 0.2 290 / .7)` active).
- **Primary action button** — violet gradient rounded-rect; Start consultation (h60 r18), send (40×40 r12), End key, Order medicine (h52 r16).
- **Severity-dot bullet list** — colored dot + 12.5px text rows (consultation summary — ranked by severity: red/amber/grey dots; safety checks).
- **Micro-label section header** — 10–11.5px 700 uppercase letter-spaced, `#8493AC` (neutral) or `#5F6FD6` (accent).

### Single-use components
- **Patient app:** login (Google button h56 r16 white), home (greeting + CTA), recommendation screen (type/urgency badges, item cards with Dosage/Timing sub-blocks r11 `#F3F6FB`, Note/Why rows, "When to seek help" tint block, safety-checks strip, reviewer thread card `rgba(255,255,255,.14)` + border `rgba(255,255,255,.22)` r18, "What happens next" timeline, Ask a follow-up / Order medicine / Share with caregiver buttons), profile/records (stat tiles r14, consult/prescription/lab cards r16, `image-slot` uploads r14).
- **Doctor desk:** segmented tab switcher, desk header row, notifications popover + red count badge, doctor profile popover (on-duty strip, settings rows, sign out), review-queue cards, sticky case header (name 21/700 + demo 13 + status pill + Approve & send h34 r11 + decline 34×34 glass), AI-consultation card internals (Confidence pill, low-confidence warning strip `oklch(0.8 0.14 70 / .2)`, observation block, Evaluation block violet tint `oklch(0.62 0.2 290 / .08)` + border `.18`, Next steps grid `repeat(auto-fit,minmax(150px,1fr))` with Tests/Prescription mini-cards r9), Talk button (h52, white .92).

---

## Screens & features built so far

### Patient app
1. **Login** — single "Continue with Google" button; auto-signup on first press. One tap, no forms. Orb + tagline.
2. **Home** — a big **Start consultation** button (the one decision on the screen), AK profile chip, "View my records" text link.
3. **Voice consult** — orb front and center; header "Private & encrypted" + profile chip; Dr. Mira speaks via `speechSynthesis` and listens via `webkitSpeechRecognition`; live mic waveform; **tap the orb to barge-in / push-to-talk**; collapsible **consult notes**; text input always on with photo attach (`image-slot.js`); quick-reply chips (I have a fever / Bad headache / Stomach pain / Skin rash); graceful typed fallback. On completion → recommendation.
4. **Recommendation** — Dr. Mira states it in voice; reviewer thread (Dr. Whitfield, credentials, live status dot); "What happens next" timeline; per-item plain-language "Why"; dosage/timing sub-blocks; safety-checks strip; buttons: Ask a follow-up, Order medicine (only when approved prescription), Share with a caregiver.
5. **Profile / records** — stat tiles (Age/Blood/Allergy in `#C0405A`), consultations, prescriptions, lab results, document upload slots.

### Doctor desk (reviewer back-office)
- **Review queue** (left rail) — pending cases, active card highlighted with violet border.
- **Case detail:** sticky patient header (name, demo, status pill, Approve & send, decline ✕), then two columns:
  - **Left — widgets stacked:** AI consultation card (Confidence pill; severity-ranked Consultation summary bullets; AI doctor observation; Evaluation; Next steps split Tests/Prescription; Advice; approved confirmation), then Patient history, Test history, Previous consultations.
  - **Right — live conversation panel** (sticky, 600px tall, own mini gradient shell r22): mirrors the patient consult UI. Dr. Mira speaks a case summary, doctor replies by voice (tap orb) or types; quick chips prefill edits; **Approve & send** approves; "Talk" button when idle.
- Top bar: Clinical Review pill, pending count, notifications (badge + popover), SW profile popover.

## AI wiring
- Real AI via `window.claude.complete`. Patient consult system prompt enforces: empathy-first, one question per turn, spoken-sounding short sentences, allergy safety, strict JSON `{reply, note, confidence, flags, done, recommendation:{type, title, summary, items:[{name,dosage,timing,notes,why,detail}], advice, urgency}}`.
- Doctor-desk voice review has its own system prompt: Dr. Mira as colleague, returns `{reply, action:"approve"|"edit"|"none", recommendation}` and applies live edits.
- Patient on file: **Alex Kumar, 34, male, O+, allergic to Penicillin, mild asthma.** Reviewer: **Dr. Sara Whitfield, MD · General Physician · GMC-483920.**
- Demo queue: Maria Gonzalez (29 · Female · O−, dry cough, pending, medium confidence), James Okoro (migraines, pending), Priya Sharma (skin rash, approved).

## State model (logic class)
- `view: 'patient'|'doctor'` · patient `screen: 'login'|'home'|'consult'|'recommendation'|'profile'` · voice `status: idle|listening|thinking|speaking` (drives orb animation + ring color + status label) · `messages/notes`, `notesExpanded`, `muted`, `photoAttached` · `reviewStatus: pending|approved` · desk: `activeCaseId`, `queue[]` (each case: patient, demo, title, meta, status, summary, symptoms, stated, inferred, flags, observation, confidence, history, relevantLabs, pastLabs, pastConsults, rec{type,title,items,advice,urgency}), `docReview`, `docNotes`, `showNotifs`, `showDocProfile`.
- Dynamic styles (ring colors, orb animation, status/confidence/tag pills, queue card active state, notes max-height) are composed in `renderVals()` and passed to template holes.

## Known constraints
- Voice (TTS + speech recognition + mic waveform) needs mic permission and a Chromium browser; graceful typed fallback.
- The AI runs on the built-in helper — rate-limited and uses the viewer's quota when shared.
- `backdrop-filter` on children of the rounded scroll containers breaks corner clipping — the sticky case header intentionally uses a solid gradient instead of glass.

## Conventions
- Single DC file; inline styles only; `<sc-for>`/`<sc-if>` for control flow; logic in the `Component extends DCLogic` class exposed via `renderVals()`. Keep the orb consistent; keep buttons rounded-rectangular (no circles); pills at 99px; keep the empathy/voice-first intent central. `$preview` 1120×920.
