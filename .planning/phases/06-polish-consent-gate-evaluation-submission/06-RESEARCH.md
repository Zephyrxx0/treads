# Phase 6: Polish, Consent Gate, Evaluation & Submission - Research

**Date:** 2026-10-08
**Status:** Complete

## User Constraints (from CONTEXT.md)

### Locked Decisions
- **D-01:** SVG path stroke dashoffset / cursive draw — Organic pen stroke drawing effect revealing handwritten letter paths progressively over ~1.2s.
- **D-02:** Accessible font fallback & reduced motion — Google Font Caveat cursive fallback with instant opacity reveal when `prefers-reduced-motion` is active.
- **D-03:** Strategic lifecycle placement — Animated on Landing hero headline and Entry Fact Card confirmed specimen titles; plays once on view entrance without re-animating on incidental re-renders.
- **D-04:** Dynamic text rendering — SVG text stroke with dashoffset reveal combined with Google Font Caveat cursive styling to scale seamlessly to arbitrary Latin and binomial species names from Wikipedia.
- **D-05:** Organic acoustic synthesis — Dual-sine / triangle warm chime with exponential decay envelope (gentle brass/field bell character) using native Web Audio oscillators without external audio assets.
- **D-06:** Dual chime interaction mapping — Specimen confirmation triggers a warm major-third dual chime (E5–G#5); Daily Hunt completion triggers a joyful 4-note ascending arpeggio (C5–E5–G5–C6).
- **D-07:** Native tactile vibration pair — Crisp single tap [25ms] on capture/candidate selection, and resonant double pulse [40ms, 60ms, 80ms] on confirmation and daily hunt completion via `navigator.vibrate`.
- **D-08:** AudioContext lifecycle & preferences — Audio chimes defaulted to OFF; haptics defaulted to ON; lazy `AudioContext` resume on first user interaction to comply with mobile browser autoplay policies; configurable via `/settings`.
- **D-09:** App-wide blocking modal overlay — Strict full-screen modal on first visit; blocks interaction until accepted, storing version in IndexedDB and calling `navigator.storage.persist()`.
- **D-10:** Semver versioning & revocation — Semver string (`"1.0.0"`) and ISO timestamp stored in `db.settings`; re-prompts only on breaking policy bumps; revocable via Danger Zone reset in `/settings`.
- **D-11:** Non-blocking permission fallbacks — Non-blocking inline banner with helpful guidance + immediate manual fallback (e.g. file picker for photo, manual text note for voice) when hardware permissions are denied.
- **D-12:** Persistent storage status reporting — Silent request on consent acceptance; live status badge in `/settings` ('Durable / Best-effort') with a one-tap retry button.
- **D-13:** Dual evaluation runner — Interactive visual dashboard on `/eval` + headless CLI test script (`scripts/run-eval-suite.ts` / `pnpm test:eval`) asserting ≥70% accuracy and ≥90% refusal.
- **D-14:** Balanced 30-fixture test suite — 20 living organisms (8 plants/trees, 6 birds, 6 insects/fungi) + 10 refusal cases (6 non-organisms, 4 people) for rigorous taxonomic and boundary validation.
- **D-15:** Production quality & build audit — Full verification suite: TypeScript check (`tsc --noEmit`), `fallow` dead-code remediation, Next.js production build (`pnpm build`), and CLI eval assert script.
- **D-16:** Outdoor field verification protocol — Comprehensive field walkthrough protocol (walk -> capture -> identification -> chime/haptic -> journal -> export) + submission summary and demo documentation.

### the agent's Discretion
- Exact oscillator frequencies and Q filter resonance for Cuelume chimes.
- SVG letter-spacing and viewBox calculation for Tegaki text sizing across mobile screens.
- Inline banner phrasing for denied camera/microphone permissions.

### Deferred Ideas
- None — discussion stayed strictly within Phase 6 scope.

---

## Standard Stack

| Layer | Library / Tool | Version / Source | Purpose | Provenance |
|-------|---------------|------------------|---------|------------|
| Handwriting Font | Google Font `Caveat` | `next/font/google` | Cursive natural handwriting fallback token | [VERIFIED: next/font] |
| Animation | `motion/react` & SVG | `^12.4.7` | Stroke reveal, clip path wipes, reduced motion bypass | [VERIFIED: package.json:34] |
| Web Audio | Native `AudioContext` | W3C Standard | Synthesized UI audio chimes without audio files | [VERIFIED: MDN Web Audio API] |
| Haptics | `navigator.vibrate` | W3C Standard | Micro-vibration tactile feedback on supported devices | [VERIFIED: MDN Vibration API] |
| Data Layer | Dexie.js | `^4.0.11` | Client settings (`db.settings`) persistence & versioning | [VERIFIED: package.json:28] |
| Code Quality | `fallow` | CLI | Dead code remediation and unused export checking | [VERIFIED: user_rules] |
| Build & Types | `tsc`, Next.js | Next 16.4 | Typecheck and production bundle build | [VERIFIED: package.json:42] |

---

## Architecture Patterns

### Pattern 1: Tegaki Handwriting Animation (`components/motion/tegaki-text.tsx`)
Because species names are arbitrary and dynamic from Wikipedia, letter vectors cannot be pre-drawn manually. The solution combines Google Font `Caveat` loaded via `next/font/google` with a dual-layer SVG or clip-path motion unmasking:
1. `app/layout.tsx` imports `Caveat({ subsets: ['latin'], variable: '--font-handwriting', display: 'swap' })`.
2. `components/motion/tegaki-text.tsx` renders an SVG text element or motion container with `font-handwriting`.
3. Animated stroke dashoffset + clip-path linear reveal sweeps left-to-right over 1.2s, mimicking pen-ink flow.
4. Hook `useReducedMotion()` inspects `prefers-reduced-motion`. If true, animation duration is 0ms, rendering instant static text.
5. Employs `useRef(false)` to ensure animation runs only on view entrance, avoiding replays during re-renders.

### Pattern 2: Cuelume Web Audio Synthesis (`lib/audio/cuelume.ts`)
Synthesizes gentle outdoor chimes purely with browser oscillators:
1. **Lazy Initialization**: Browser autoplay policies require an explicit user gesture before resuming an `AudioContext`. `getAudioContext()` checks `typeof window !== 'undefined'`, creates/reuses `AudioContext`, and calls `.resume()`.
2. **Specimen Confirmation Chime**:
   - Chords: Major third (E5: 659.25 Hz + G#5: 830.61 Hz).
   - Oscillators: Dual `sine` and soft `triangle` with 30ms offset.
   - Envelope: Exponential gain ramp from 0.15 to 0.0001 over 0.8s.
3. **Daily Hunt Celebration Chime**:
   - 4-note ascending arpeggio: C5 (523.25 Hz) → E5 (659.25 Hz) → G5 (783.99 Hz) → C6 (1046.50 Hz) at 120ms intervals.
   - Envelope: 0.6s decay per note.
4. **Preference Check**: Queries `db.settings` `'user_settings'`. If `soundEnabled` is false, exits silently.

### Pattern 3: Tactile Haptic Pulses (`lib/haptics.ts`)
1. Checks `'vibrate' in navigator` and verifies `hapticsEnabled` in `db.settings`.
2. `triggerCaptureHaptic()`: single 25ms tick.
3. `triggerConfirmHaptic()` / `triggerHuntWinHaptic()`: resonant double pulse `[40, 60, 80]` ms.

### Pattern 4: Global Consent Gate Verification
1. `components/consent/consent-modal.tsx` is mounted globally in `app/layout.tsx`.
2. Uses Base UI `<Dialog open={!hasConsented}>` with `disablePointerDismissal={true}` and `hideCloseButton={true}`.
3. Upon acceptance:
   - Sets `db.settings.put({ id: 'consent', version: '1.0.0', acceptedAt: new Date().toISOString() })`.
   - Calls `navigator.storage.persist()`.
4. `/settings` provides live persistence status display (`Persisted` vs `Best Effort`) with manual re-request.
5. In addition, `/walk` guards active tracking and capture if unconsented.

### Pattern 5: 30-Fixture Evaluation Suite & Headless CLI Runner
1. `public/eval-fixtures/fixtures.json` structured as 20 organisms (8 plants, 6 birds, 6 insects) + 10 refusals (6 non-organisms, 4 people).
2. `scripts/run-eval-suite.ts` loads fixtures and runs them against Google Generative AI (if `GOOGLE_GENERATIVE_AI_API_KEY` is present) or the high-fidelity mock engine matching `/api/eval/run/route.ts`.
3. Verifies benchmark criteria:
   - Accuracy ≥ 70%
   - Refusal Rate ≥ 90%
4. Exits with exit code 0 on PASS, 1 on FAIL.
5. Script added to `package.json` as `"test:eval": "tsx scripts/run-eval-suite.ts"`.

---

## Don't Hand-Roll

- **Don't Hand-Roll Audio Files**: Do NOT bundle `.mp3` or `.wav` sound effects. Web Audio API oscillators are zero-bandwidth, seek-safe, and load instantaneously.
- **Don't Hand-Roll Font Loaders**: Use `next/font/google` for `Caveat` font loading; it automatically optimizes, self-hosts, and avoids layout shifts.
- **Don't Hand-Roll Haptic Fallbacks**: If `navigator.vibrate` is absent (iOS Safari or desktop), silently swallow without errors.
- **Don't Hand-Roll Modals**: Use existing `@base-ui-components/react` dialog primitives with Tangerin Dream tokens.

---

## Common Pitfalls

1. **AudioContext Autoplay Blocking**:
   *Pitfall*: Calling `new AudioContext()` at module top-level triggers browser console warnings and fails to play audio until resumed by user interaction.
   *Fix*: Instantiate lazily inside `getAudioContext()` and invoke only inside user gesture handlers (click/tap).
2. **Reduced Motion Violations**:
   *Pitfall*: Drawing animations that ignore user accessibility preferences.
   *Fix*: Check `useReducedMotion()`. If active, render static text with 0ms transition.
3. **SVG Font Metrics & Text Clipping**:
   *Pitfall*: Fixed width SVG causing species names with varying lengths to truncate or overflow.
   *Fix*: Render text with CSS responsive units or motion mask wrapper with dynamic text sizing.
4. **Fixture Discrepancies**:
   *Pitfall*: Running eval with unmatched categories causing false negative metrics.
   *Fix*: Standardize `public/eval-fixtures/fixtures.json` to exactly 20 organisms and 10 negative refusal cases.

---

## Validation Architecture

### Verification Commands
1. `pnpm tsc --noEmit` — Type-check passes with 0 errors.
2. `pnpm test:eval` — 30-fixture batch evaluation passes with ≥70% accuracy and ≥90% refusal.
3. `pnpm build` — Next.js 16 production build compiles cleanly without errors.
4. `pnpm test:all` or individual spike/unit test execution.
5. Outdoor Field Walkthrough Checklist verified.

