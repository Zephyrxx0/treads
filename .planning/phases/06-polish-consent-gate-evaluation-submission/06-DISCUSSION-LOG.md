# Phase 6: Polish, Consent Gate, Evaluation & Submission - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-10-08
**Phase:** 6-Polish, Consent Gate, Evaluation & Submission
**Areas discussed:** Tegaki Handwriting Animation, Cuelume Synthesized Audio & Haptics, Consent Gate Enforcement, Evaluation Harness & Field Polish

---

## Tegaki Handwriting Animation (DSGN-03)

| Option | Description | Selected |
|--------|-------------|----------|
| SVG path stroke dashoffset / cursive draw | Organic pen stroke drawing effect revealing handwritten letter paths progressively over ~1.2s. | ✓ |
| Character-by-character ink bleed fade | Staggered character reveal with subtle blur-to-focus and slight angle jitter, lighter on CPU. | |
| CSS mask sweep with handwriting cursive font | Linear-gradient cursive wipe across Caveat/cursive typography. | |

**User's choice:** SVG path stroke dashoffset / cursive draw

---

| Option | Description | Selected |
|--------|-------------|----------|
| Google Font Caveat cursive fallback | Instant opacity reveal when prefers-reduced-motion is active | ✓ |
| Noto Serif italic fallback | Reusing existing project serif token with instant appearance on reduced-motion | |
| System cursive stack | ui-cursive, cursive with gentle crossfade | |

**User's choice:** Google Font Caveat cursive fallback with instant opacity reveal when prefers-reduced-motion is active

---

| Option | Description | Selected |
|--------|-------------|----------|
| Landing hero headline & Fact card confirmed specimen titles | Plays once on view entrance | ✓ |
| App-wide field notes styling | Landing hero, Fact cards, Daily hunt title, and Walk summary cards | |
| Landing hero headline only | Keep all in-walk and entry detail titles static for maximum speed | |

**User's choice:** Landing hero headline & Fact card confirmed specimen titles; plays once on view entrance

---

| Option | Description | Selected |
|--------|-------------|----------|
| SVG text stroke with dashoffset reveal + Google Font Caveat cursive styling | Scales seamlessly to any arbitrary Latin/species name | ✓ |
| Hand-tuned SVG stroke glyph library for preset titles | Clean cursive fade for unknown arbitrary strings | |
| HTML5 Canvas stroke brush generator | Tracing letter contours progressively | |

**User's choice:** SVG text stroke with dashoffset reveal + Google Font Caveat cursive styling (scales seamlessly to any arbitrary Latin/species name)

---

## Cuelume Synthesized Audio & Haptics (DSGN-04, DSGN-05)

| Option | Description | Selected |
|--------|-------------|----------|
| Dual-sine / triangle warm chime with exponential decay envelope | Gentle, organic brass/field bell feel | ✓ |
| Organic wooden marimba / resonant woodblock knock | Soft reverb filter | |
| Minimalist pure sine pentatonic harmonic pip | Clean retro synthesizer pip | |

**User's choice:** Dual-sine / triangle warm chime with exponential decay envelope (gentle, organic brass/field bell feel)

---

| Option | Description | Selected |
|--------|-------------|----------|
| 2 events: Specimen Confirmation & Daily Hunt Completion | Warm major-third chime (E5–G#5) & joyful 4-note ascending arpeggio (C5–E5–G5–C6) | ✓ |
| Expanded 4 events | Walk Start chime, Camera shutter ping, Specimen confirmation, and Hunt celebration | |
| Single event | Daily Hunt Completion celebration only (keeping individual captures completely silent) | |

**User's choice:** 2 events: Specimen Confirmation (warm major-third chime) & Daily Hunt Completion (joyful 4-note ascending arpeggio)

---

| Option | Description | Selected |
|--------|-------------|----------|
| Tactile pair | Crisp single tap [25ms] on capture/candidate selection, and resonant double pulse [40ms, 60ms, 80ms] on confirmation/hunt completion | ✓ |
| Single subtle pulse [30ms] | Exclusively on organism confirmation and hunt win | |
| Continuous haptic cues | Across all actions (walk start/stop, photo snap, note record, confirm) | |

**User's choice:** Tactile pair: crisp single tap [25ms] on capture/candidate selection, and resonant double pulse [40ms, 60ms, 80ms] on confirmation/hunt completion

---

| Option | Description | Selected |
|--------|-------------|----------|
| Audio chimes OFF by default, Haptics ON by default | Lazy AudioContext resume on first user interaction to comply with browser autoplay policies | ✓ |
| Both Audio chimes and Haptics ON by default | Quick-mute icon in header HUD | |
| Both Audio and Haptics strictly OFF by default | Until toggled in /settings | |

**User's choice:** Audio chimes OFF by default, Haptics ON by default; lazy AudioContext resume on first user interaction to comply with browser autoplay policies

---

## Consent Gate Enforcement (CONS-01 to CONS-04)

| Option | Description | Selected |
|--------|-------------|----------|
| Strict app-wide modal overlay on first visit | Blocks interaction until accepted, storing version in IndexedDB and triggering storage.persist() | ✓ |
| Targeted gate | Allows browsing /collection and /journal, but strictly blocks /walk, camera capture, and mic recording until accepted | |
| Top notification banner on launch | Turns into a blocking sheet only upon tapping 'Start Walk' | |

**User's choice:** Strict app-wide modal overlay on first visit; blocks interaction until accepted, storing version in IndexedDB and triggering storage.persist()

---

| Option | Description | Selected |
|--------|-------------|----------|
| Semver string ("1.0.0") & timestamp in db.settings | Re-prompts only on major policy bumps; revocable via Danger Zone reset in /settings | ✓ |
| Dedicated 'Revoke Consent' button in /settings | Clears consent state and redirects to landing page with modal open | |
| Lightweight localStorage flag | Checked synchronously without IndexedDB dependency | |

**User's choice:** Semver string ("1.0.0") & timestamp in db.settings; re-prompts only on major policy bumps; revocable via Danger Zone reset in /settings

---

| Option | Description | Selected |
|--------|-------------|----------|
| Non-blocking inline banner with helpful guidance | Immediate manual fallback (e.g., file picker for photo, manual text note for voice) | ✓ |
| Floating toast notification with retry button | Auto-dismisses after 6 seconds | |
| Modal alert | Pauses the current action until permission settings are revisited | |

**User's choice:** Non-blocking inline banner with helpful guidance + immediate manual fallback (e.g., file picker for photo, manual text note for voice)

---

| Option | Description | Selected |
|--------|-------------|----------|
| Silent request on consent click; live status badge in /settings | 'Durable / Best-effort' badge with a one-tap retry button | ✓ |
| Explicit toast confirmation right after consent | 'Durable storage granted' or 'Browser kept standard storage' | |
| Purely background handling | Without surfacing storage persistence status in settings | |

**User's choice:** Silent request on consent click; live status badge in /settings ('Durable / Best-effort') with a one-tap retry button

---

## Evaluation Harness & Field Polish (EVAL-01)

| Option | Description | Selected |
|--------|-------------|----------|
| Dual runner: Interactive dashboard on /eval + Headless CLI test script | Asserts >=70% accuracy & >=90% refusal | ✓ |
| Web dashboard only on /eval | Visual progress bar and category breakdown cards | |
| CI-only headless runner | Executed solely during automated build checks | |

**User's choice:** Dual runner: Interactive dashboard on /eval + Headless CLI test script (scripts/run-eval-suite.ts) asserting >=70% accuracy & >=90% refusal

---

| Option | Description | Selected |
|--------|-------------|----------|
| 20 living organisms + 10 refusal cases | 8 plants/trees, 6 birds, 6 insects/fungi + 6 non-organisms, 4 people for balanced boundary testing | ✓ |
| 25 living organisms + 5 negative refusal fixtures | Bias toward positive taxonomic classification | |
| 15 living organisms + 15 refusal test cases | 50/50 precision-recall stress test | |

**User's choice:** 20 living organisms (8 plants/trees, 6 birds, 6 insects/fungi) + 10 refusal cases (6 non-organisms, 4 people) for balanced boundary testing

---

| Option | Description | Selected |
|--------|-------------|----------|
| Full verification suite | TypeScript check (`tsc --noEmit`), `fallow` dead-code remediation, Next.js production build (`pnpm build`), and CLI eval assert script | ✓ |
| Standard build check | `pnpm build` and unit test scripts only | |
| Linter and smoke test only | Run `fallow` and launch local server | |

**User's choice:** Full verification suite: TypeScript check (`tsc --noEmit`), `fallow` dead-code remediation, Next.js production build (`pnpm build`), and CLI eval assert script

---

| Option | Description | Selected |
|--------|-------------|----------|
| Field walkthrough protocol + submission summary & demo documentation | Walk -> capture -> identification -> chime/haptic -> journal -> export + release docs | ✓ |
| Project README and feature checklist documentation update only | Documentation update | |
| Automated headless end-to-end trace log recorded in .planning/ | Automated trace log | |

**User's choice:** Field walkthrough protocol (walk -> capture -> identification -> chime/haptic -> journal -> export) + submission summary and demo documentation

---

## the agent's Discretion

- Exact oscillator frequency constants and Q filter resonance for Cuelume chimes.
- SVG letter-spacing and viewBox calculation for Tegaki text sizing across mobile screens.
- Inline banner phrasing for denied camera/microphone permissions.

## Deferred Ideas

- None — discussion stayed strictly within Phase 6 scope.
