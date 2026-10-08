---
phase: 6
slug: polish-consent-gate-evaluation-submission
status: draft
nyquist_compliant: true
wave_0_complete: false
created: 2026-10-08
---

# Phase 6 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Node / TypeScript (tsx) & Next.js production build |
| **Config file** | `tsconfig.json` & `next.config.ts` |
| **Quick run command** | `pnpm tsc --noEmit` |
| **Full suite command** | `pnpm test:eval && pnpm build` |
| **Estimated runtime** | ~15 seconds |

---

## Sampling Rate

- **After every task commit:** Run `pnpm tsc --noEmit`
- **After every plan wave:** Run `pnpm test:eval`
- **Before `/gsd-verify-work`:** Full suite must be green
- **Max feedback latency:** 15 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 06-01-01 | 01 | 1 | DSGN-03 | — | N/A | unit/ui | `pnpm tsc --noEmit` | ❌ W0 | ⬜ pending |
| 06-01-02 | 01 | 1 | DSGN-04, DSGN-05 | — | Respects user audio/haptics toggle preferences | unit/audio | `pnpm tsc --noEmit` | ❌ W0 | ⬜ pending |
| 06-01-03 | 01 | 1 | CONS-01, CONS-02, CONS-03 | — | Gating prevents unconsented hardware access | integration | `pnpm tsc --noEmit` | ✅ | ⬜ pending |
| 06-02-01 | 02 | 2 | EVAL-01 | — | N/A | integration/cli | `pnpm test:eval` | ❌ W0 | ⬜ pending |
| 06-02-02 | 02 | 2 | POLISH | — | Dead code remediated and production build green | build/lint | `pnpm build` | ✅ | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `components/motion/tegaki-text.tsx` — Tegaki stroke dashoffset progressive reveal component
- [ ] `lib/audio/cuelume.ts` — Web Audio oscillator synthesizer for capture & hunt chimes
- [ ] `lib/haptics.ts` — Native vibration trigger with user settings check
- [ ] `scripts/run-eval-suite.ts` — CLI evaluation suite runner asserting accuracy & refusal thresholds

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Audio chime playback & haptics | DSGN-04, DSGN-05 | Hardware audio output & motor vibration | Tap specimen candidate; listen for warm E5-G#5 dual chime and feel double haptic pulse |
| Tegaki stroke animation visual | DSGN-03 | Visual motion timing | Load landing page and `/entry/[id]`; watch 1.2s organic pen-stroke reveal |
| Consent modal overlay blocking | CONS-01, CONS-02 | Visual blocking dialog | Clear storage, verify background clicks blocked, accept consent |

---

## Validation Sign-Off

- [x] All tasks have `<automated>` verify or Wave 0 dependencies
- [x] Sampling continuity: no 3 consecutive tasks without automated verify
- [x] Wave 0 covers all MISSING references
- [x] No watch-mode flags
- [x] Feedback latency < 20s
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** pending

