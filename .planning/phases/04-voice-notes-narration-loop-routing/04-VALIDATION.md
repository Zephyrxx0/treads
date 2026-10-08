---
phase: 4
slug: voice-notes-narration-loop-routing
status: draft
nyquist_compliant: true
wave_0_complete: false
created: 2026-10-08
---

# Phase 4 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution of Phase 4: Voice Notes, Narration & Loop Routing.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Node.js / TypeScript test harnesses via tsx |
| **Config file** | `tsconfig.json` |
| **Quick run command** | `pnpm exec tsx scripts/test-transcribe-route.ts` |
| **Full suite command** | `pnpm exec tsx scripts/test-transcribe-route.ts && pnpm exec tsx scripts/test-speak-route.ts && pnpm exec tsx scripts/test-route-loop.ts` |
| **Estimated runtime** | ~5 seconds |

---

## Sampling Rate

- **After every task commit:** Run `pnpm exec tsx scripts/test-transcribe-route.ts`
- **After every plan wave:** Run `pnpm exec tsx scripts/test-transcribe-route.ts && pnpm exec tsx scripts/test-speak-route.ts && pnpm exec tsx scripts/test-route-loop.ts`
- **Before `/gsd-verify-work`:** Full suite must be green
- **Max feedback latency:** 10 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 04-01-01 | 01 | 1 | VOIC-01 | T-04-01 | MediaRecorder & Web Audio AnalyserNode waveform | unit | `pnpm exec tsx scripts/test-transcribe-route.ts` | ❌ W0 | ⬜ pending |
| 04-01-02 | 01 | 1 | VOIC-02, VOIC-03 | T-04-02 | ElevenLabs Scribe STT with Web Speech fallback | integration | `pnpm exec tsx scripts/test-transcribe-route.ts` | ❌ W0 | ⬜ pending |
| 04-01-03 | 01 | 1 | VOIC-01, VOIC-02 | T-04-03 | Dexie `db.notes` stores audio Blob and transcript | integration | `pnpm exec tsx scripts/test-transcribe-route.ts` | ❌ W0 | ⬜ pending |
| 04-02-01 | 02 | 2 | SPK-01 | T-04-04 | ElevenLabs TTS audio generation with browser fallback | integration | `pnpm exec tsx scripts/test-speak-route.ts` | ❌ W0 | ⬜ pending |
| 04-02-02 | 02 | 2 | SPK-02 | T-04-05 | SHA-256 hash caching in Dexie `speechCache` with LRU pruning | unit | `pnpm exec tsx scripts/test-speak-route.ts` | ❌ W0 | ⬜ pending |
| 04-02-03 | 02 | 2 | ROUT-01, ROUT-02 | T-04-06 | OpenRouteService pedestrian loop with synthetic fallback | integration | `pnpm exec tsx scripts/test-route-loop.ts` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `scripts/test-transcribe-route.ts` — validates `/api/transcribe` payload parsing, rate limiting, and mock fallback transcript
- [ ] `scripts/test-speak-route.ts` — validates `/api/speak` TTS stream generation, text hashing utility, and speech cache logic
- [ ] `scripts/test-route-loop.ts` — validates `/api/route` ORS round-trip parameters, synthetic circle generator, and GeoJSON formatting

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Real-time Web Audio Waveform | VOIC-01 | Requires active microphone hardware stream | Tap mic in `/walk` dock, speak into device, observe terracotta bars dancing in real-time |
| Native Browser SpeechSynthesis | SPK-01 | Requires OS audio output and browser speech engine | Tap "Listen" with `ELEVENLABS_API_KEY` unset, verify audible voice narration through device speakers |
| MapLibre Dashed Guideline | ROUT-01 | Visual canvas layer inspection | Select "Loop (2 km)" on `/walk`, verify dashed terracotta polyline renders on MapLibre vector tiles |

---

## Validation Sign-Off

- [x] All tasks have `<automated>` verify or Wave 0 dependencies
- [x] Sampling continuity: no 3 consecutive tasks without automated verify
- [x] Wave 0 covers all MISSING references
- [x] No watch-mode flags
- [x] Feedback latency < 10s
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** approved 2026-10-08
