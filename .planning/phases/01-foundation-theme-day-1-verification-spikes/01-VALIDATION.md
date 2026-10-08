---
phase: 1
slug: foundation-theme-day-1-verification-spikes
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-10-08
---

# Phase 1 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Next.js build + automated verification endpoints & Vitest/Node scripts |
| **Config file** | none — Next.js build & spike routes |
| **Quick run command** | `pnpm build` |
| **Full suite command** | `pnpm build && curl -s http://localhost:3000/api/spike/ai && curl -s http://localhost:3000/api/spike/speech` |
| **Estimated runtime** | ~15 seconds |

---

## Sampling Rate

- **After every task commit:** Run `pnpm build`
- **After every plan wave:** Run `pnpm build` and verify component exports & database schemas
- **Before `/gsd-verify-work`:** Full build green, `/spike` loads MapLibre styles, AI verification, and Speech fallback; `/eval` executes benchmark harness
- **Max feedback latency:** 20 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 01-01-01 | 01 | 1 | DSGN-01 | — | CSS variables strictly scoped to Tangerin Dream | smoke | `pnpm build` | ❌ W0 | ⬜ pending |
| 01-01-02 | 01 | 1 | DSGN-02 | — | Base UI primitives render without hydration mismatch | smoke | `pnpm build` | ❌ W0 | ⬜ pending |
| 01-02-01 | 02 | 2 | CONS-01 | — | Consent version saved to Dexie before unlocking routes | unit | `pnpm build` | ❌ W0 | ⬜ pending |
| 01-02-02 | 02 | 2 | CONS-02 | — | `navigator.storage.persist()` called and status logged | unit | `pnpm build` | ❌ W0 | ⬜ pending |
| 01-02-03 | 02 | 2 | CONS-03 | — | Clear explanation shown before camera/mic/location prompt | unit | `pnpm build` | ❌ W0 | ⬜ pending |
| 01-02-04 | 02 | 2 | CONS-04 | — | Feature gracefully degrades when permission denied | unit | `pnpm build` | ❌ W0 | ⬜ pending |
| 01-02-05 | 02 | 2 | RATE-01 | — | In-memory token bucket limits burst requests | unit | `pnpm build` | ❌ W0 | ⬜ pending |
| 01-03-01 | 03 | 3 | EVAL-01 | — | Benchmark fixture runner calculates accuracy & refusal metrics | e2e | `pnpm build` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `lib/db.ts` — Dexie database schema and table definitions
- [ ] `lib/rate-limit.ts` — dual-mode rate limiter implementation
- [ ] `public/eval-fixtures/fixtures.json` — 30 benchmark test fixtures manifest

---

## Manual-Only Verifications

| Behavior | Why Manual-Only | How to Verify |
|----------|-----------------|---------------|
| Tangerin Dream Theme FOUC Check | Visual client-side render check | Toggle theme in browser, hard refresh page, observe zero white/dark flash |
| MapLibre Tile Rendering | WebGL canvas visual inspection | Open `/spike`, confirm OpenFreeMap Liberty tiles load with telemetry badge |
| Speech Fallback Verification | Audio & Web Speech API browser check | Open `/spike`, trigger TTS playback and STT mic check, verify provider badge |
| Camera Permission Fallback | Hardware sensor prompt | Trigger camera request in browser, deny permission, verify fallback banner |
