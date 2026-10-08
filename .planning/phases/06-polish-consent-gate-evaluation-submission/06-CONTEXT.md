# Phase 6: Polish, Consent Gate, Evaluation & Submission - Context

**Gathered:** 2026-10-08
**Status:** Ready for planning

<domain>
## Phase Boundary

Phase 6 hardens the user experience and prepares Treads for production release and hackathon submission. This includes full-screen versioned consent gate enforcement (`CONS-01`, `CONS-02`, `CONS-03`, `CONS-04`), progressive Tegaki handwriting reveals with web font fallback (`DSGN-03`), synthesized Cuelume Web Audio chimes and native haptics (`DSGN-04`, `DSGN-05`), batch evaluation benchmark execution and CLI assertion (`EVAL-01`), dead-code remediation with `fallow`, production build verification, and outdoor field walkthrough documentation.

</domain>

<decisions>
## Implementation Decisions

### Tegaki Handwriting Animation (DSGN-03)
- **D-01:** SVG path stroke dashoffset / cursive draw — Organic pen stroke drawing effect revealing handwritten letter paths progressively over ~1.2s.
- **D-02:** Accessible font fallback & reduced motion — Google Font Caveat cursive fallback with instant opacity reveal when `prefers-reduced-motion` is active.
- **D-03:** Strategic lifecycle placement — Animated on Landing hero headline and Entry Fact Card confirmed specimen titles; plays once on view entrance without re-animating on incidental re-renders.
- **D-04:** Dynamic text rendering — SVG text stroke with dashoffset reveal combined with Google Font Caveat cursive styling to scale seamlessly to arbitrary Latin and binomial species names from Wikipedia.

### Cuelume Synthesized Audio & Haptics (DSGN-04, DSGN-05)
- **D-05:** Organic acoustic synthesis — Dual-sine / triangle warm chime with exponential decay envelope (gentle brass/field bell character) using native Web Audio oscillators without external audio assets.
- **D-06:** Dual chime interaction mapping — Specimen confirmation triggers a warm major-third dual chime (E5–G#5); Daily Hunt completion triggers a joyful 4-note ascending arpeggio (C5–E5–G5–C6).
- **D-07:** Native tactile vibration pair — Crisp single tap [25ms] on capture/candidate selection, and resonant double pulse [40ms, 60ms, 80ms] on confirmation and daily hunt completion via `navigator.vibrate`.
- **D-08:** AudioContext lifecycle & preferences — Audio chimes defaulted to OFF; haptics defaulted to ON; lazy `AudioContext` resume on first user interaction to comply with mobile browser autoplay policies; configurable via `/settings`.

### Consent Gate Enforcement (CONS-01 to CONS-04)
- **D-09:** App-wide blocking modal overlay — Strict full-screen modal on first visit; blocks interaction until accepted, storing version in IndexedDB and calling `navigator.storage.persist()`. — **Reversibility:** costly — gates user entry flow across all routes.
- **D-10:** Semver versioning & revocation — Semver string (`"1.0.0"`) and ISO timestamp stored in `db.settings`; re-prompts only on breaking policy bumps; revocable via Danger Zone reset in `/settings`. — **Reversibility:** costly — defines database settings schema and migration behavior.
- **D-11:** Non-blocking permission fallbacks — Non-blocking inline banner with helpful guidance + immediate manual fallback (e.g. file picker for photo, manual text note for voice) when hardware permissions are denied.
- **D-12:** Persistent storage status reporting — Silent request on consent acceptance; live status badge in `/settings` ('Durable / Best-effort') with a one-tap retry button.

### Evaluation Harness & Field Polish (EVAL-01, Submission)
- **D-13:** Dual evaluation runner — Interactive visual dashboard on `/eval` + headless CLI test script (`scripts/run-eval-suite.ts` / `pnpm test:eval`) asserting ≥70% accuracy and ≥90% refusal.
- **D-14:** Balanced 30-fixture test suite — 20 living organisms (8 plants/trees, 6 birds, 6 insects/fungi) + 10 refusal cases (6 non-organisms, 4 people) for rigorous taxonomic and boundary validation.
- **D-15:** Production quality & build audit — Full verification suite: TypeScript check (`tsc --noEmit`), `fallow` dead-code remediation, Next.js production build (`pnpm build`), and CLI eval assert script.
- **D-16:** Outdoor field verification protocol — Comprehensive field walkthrough protocol (walk -> capture -> identification -> chime/haptic -> journal -> export) + submission summary and demo documentation.

### the agent's Discretion
- Exact oscillator frequencies and Q filter resonance for Cuelume chimes.
- SVG letter-spacing and viewBox calculation for Tegaki text sizing across mobile screens.
- Inline banner phrasing for denied camera/microphone permissions.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Architecture & Requirements
- `DECISIONS.md` § Decisions 1, 2, 7, 8 — Local-first client architecture, Canvas EXIF stripping, and private IndexedDB storage
- `PRD.md` § 4.1, § 4.2, § 4.9, § 5.1 — Consent gate, storage persistence, evaluation harness, and design specifications
- `.planning/ROADMAP.md` § Phase 6 — Phase 6 scope, dependencies, requirements (`DSGN-03, DSGN-04, DSGN-05, CONS-01 to CONS-04, EVAL-01`), and success criteria
- `.planning/REQUIREMENTS.md` § Consent, Design, Infrastructure — Specific acceptance criteria for consent, motion, sound, and evaluation

### Prior Phase Context & Schemas
- `.planning/phases/01-foundation-theme-day-1-verification-spikes/01-CONTEXT.md` — Tangerin Dream theme tokens, base Dexie tables, and evaluation fixture structure
- `.planning/phases/05-collection-journal-export/05-CONTEXT.md` — Settings preferences, storage persistence, and hunt celebration integration
- `lib/db.ts` — Dexie schemas for `settings`, `walks`, `entries`, and `notes`
- `components/consent/consent-modal.tsx` — Existing consent modal component and copy
- `app/(dev)/eval/page.tsx` & `app/api/eval/run/route.ts` — Benchmark runner and fixture schema

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `components/consent/consent-modal.tsx`: Existing Base UI Dialog consent implementation ready for strict modal gating and persistence status hookup.
- `hooks/use-consent.ts`: Hook for querying and recording consent version in `db.settings`.
- `components/ui/dialog.tsx`, `components/ui/card.tsx`, `components/ui/badge.tsx`, `components/ui/button.tsx`: Base UI primitives styled with Tangerin Dream theme tokens.
- `components/motion/motion-view.tsx`: Reduced-motion and visibility-aware animation wrapper.
- `app/(dev)/eval/page.tsx`: Existing 30-fixture visual benchmark dashboard.
- `app/api/eval/run/route.ts`: Evaluation API handler executing benchmark runs against `public/eval-fixtures/fixtures.json`.
- `lib/hunt.ts`: Daily hunt engine ready for completion sound and haptic triggers.
- `components/hunt/daily-hunt-celebration-dialog.tsx`: Hunt victory modal where Cuelume celebration chime and double haptic pulse integrate.
- `components/walk/candidate-picker-sheet.tsx`: Specimen confirmation sheet where Cuelume capture chime and haptic feedback integrate.
- `app/settings/page.tsx`: User settings page containing existing toggles for audio chimes and haptics.

### Established Patterns
- Client-side storage and settings via Dexie `db.settings`.
- Accessible dialogs using `@base-ui-components/react`.
- `prefers-reduced-motion` compliance across all CSS and JavaScript animations.
- Safe browser API degradation (`navigator.vibrate`, `window.AudioContext`, `navigator.storage.persist`).

### Integration Points
- `components/motion/tegaki-text.tsx`: New component providing SVG stroke dashoffset progressive reveal with Caveat font fallback.
- `lib/audio/cuelume.ts`: New Web Audio synthesizer module exposing `playCaptureChime()` and `playHuntChime()` with user preference gating.
- `lib/haptics.ts` (or `lib/audio/cuelume.ts`): Unified haptics trigger wrapping `navigator.vibrate` with settings check.
- `scripts/run-eval-suite.ts`: Headless CLI evaluation assert script testing all 30 fixtures with pass/fail thresholds.
- `app/entry/[id]/page.tsx` & `components/entry/fact-card.tsx`: Integrate `TegakiText` for confirmed species headers.
- `app/page.tsx`: Integrate `TegakiText` for landing tagline.
- `public/eval-fixtures/fixtures.json`: Confirm all 30 fixtures (20 organisms, 10 refusals) meet requirements.

</code_context>

<specifics>
## Specific Ideas

- Tegaki text uses SVG stroke dashoffset animation (~1.2s duration) with Google Font Caveat cursive fallback, resolving immediately to static text if `prefers-reduced-motion` is set.
- Cuelume chimes are synthesized entirely on the fly via Web Audio `OscillatorNode` and `GainNode`, producing dual-tone field bell chords without downloading audio files.
- Haptics provide a crisp 25ms tick on capture/selection and a double pulse [40ms, 60ms, 80ms] on confirmation and hunt completion.
- Consent modal completely prevents bypassing to `/walk` or hardware features on first launch until accepted.
- Evaluation runner can be triggered both from `/eval` and via CLI script (`pnpm test:eval`) with automated threshold assertions (≥70% accuracy, ≥90% refusal).
- Submission bundle includes an end-to-end outdoor field walkthrough verification protocol and updated documentation.

</specifics>

<deferred>
## Deferred Ideas

- None — discussion stayed strictly within Phase 6 scope.

</deferred>

---

*Phase: 6-Polish, Consent Gate, Evaluation & Submission*
*Context gathered: 2026-10-08*

