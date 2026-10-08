---
phase: 3
slug: photo-capture-ai-identification-pipeline
status: draft
nyquist_compliant: true
wave_0_complete: false
created: 2026-10-08
---

# Phase 3 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution of Phase 3: Photo Capture & AI Identification Pipeline.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Node.js / TypeScript test harnesses via tsx |
| **Config file** | `tsconfig.json` |
| **Quick run command** | `pnpm exec tsx scripts/test-camera-pipeline.ts` |
| **Full suite command** | `pnpm exec tsx scripts/test-camera-pipeline.ts && pnpm exec tsx scripts/test-wikipedia-taxon.ts && pnpm exec tsx scripts/test-facts-scrubber.ts` |
| **Estimated runtime** | ~5 seconds |

---

## Sampling Rate

- **After every task commit:** Run `pnpm exec tsx scripts/test-camera-pipeline.ts`
- **After every plan wave:** Run `pnpm exec tsx scripts/test-camera-pipeline.ts && pnpm exec tsx scripts/test-wikipedia-taxon.ts && pnpm exec tsx scripts/test-facts-scrubber.ts`
- **Before `/gsd-verify-work`:** Full suite must be green
- **Max feedback latency:** 10 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 03-01-01 | 01 | 1 | CAPT-01, CAPT-02 | T-03-01 | EXIF/GPS tags stripped via Canvas rasterization | unit | `pnpm exec tsx scripts/test-camera-pipeline.ts` | ❌ W0 | ⬜ pending |
| 03-01-02 | 01 | 1 | CAPT-03 | T-03-02 | Dexie stores 1024px photo + 160px thumbnail locally | integration | `pnpm exec tsx scripts/test-camera-pipeline.ts` | ❌ W0 | ⬜ pending |
| 03-02-01 | 02 | 2 | IDEN-01, IDEN-02 | T-03-03 | Returns up to 3 candidates with qualitative confidence | integration | `pnpm exec tsx scripts/test-identify-route.ts` | ❌ W0 | ⬜ pending |
| 03-02-02 | 02 | 2 | IDEN-03 | T-03-04 | Honest refusal for non-organisms and humans | unit | `pnpm exec tsx scripts/test-identify-route.ts` | ❌ W0 | ⬜ pending |
| 03-02-03 | 02 | 2 | IDEN-04, IDEN-05 | T-03-05 | Wikipedia Action API confirms biological taxon | unit | `pnpm exec tsx scripts/test-wikipedia-taxon.ts` | ❌ W0 | ⬜ pending |
| 03-03-01 | 03 | 3 | FACT-01, FACT-02 | T-03-06 | Extracts lead sentences, cites sentence numbers | integration | `pnpm exec tsx scripts/test-facts-scrubber.ts` | ❌ W0 | ⬜ pending |
| 03-03-02 | 03 | 3 | FACT-03, FACT-04 | T-03-07 | Strict regex drops all edibility/toxic claims | unit | `pnpm exec tsx scripts/test-facts-scrubber.ts` | ❌ W0 | ⬜ pending |
| 03-03-03 | 03 | 3 | FACT-05, FACT-06 | T-03-08 | Renders safety warning, Wikipedia link, caches | unit | `pnpm exec tsx scripts/test-facts-scrubber.ts` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `scripts/test-camera-pipeline.ts` — validates Canvas 1024px resizing, 160px thumbnail generation, and EXIF stripping
- [ ] `scripts/test-wikipedia-taxon.ts` — validates Wikipedia Action API biological taxon categorization and redirects
- [ ] `scripts/test-facts-scrubber.ts` — validates edibility regex filter, sentence citation verification, and fallback

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Native Camera Shutter on mobile | CAPT-01 | Requires mobile phone hardware camera app | Open `/walk` on Android/iOS Chrome, tap camera button, verify OS camera opens directly |
| Interactive Citation Popovers | FACT-01 | Micro-interaction popover toggle | On fact card, tap citation pill `[1]`, verify verbatim Wikipedia source sentence appears in popover |

---

## Validation Sign-Off

- [x] All tasks have `<automated>` verify or Wave 0 dependencies
- [x] Sampling continuity: no 3 consecutive tasks without automated verify
- [x] Wave 0 covers all MISSING references
- [x] No watch-mode flags
- [x] Feedback latency < 10s
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** approved 2026-10-08
