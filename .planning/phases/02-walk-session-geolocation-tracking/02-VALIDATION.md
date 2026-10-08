---
phase: 2
slug: walk-session-geolocation-tracking
status: draft
nyquist_compliant: true
wave_0_complete: false
created: 2026-10-08
---

# Phase 2 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | tsx / Node test runners |
| **Config file** | tsconfig.json |
| **Quick run command** | `pnpm tsx scripts/test-geolocation-filter.ts` |
| **Full suite command** | `pnpm tsx scripts/test-geolocation-filter.ts && pnpm tsx scripts/test-active-walk.ts && pnpm build` |
| **Estimated runtime** | ~15 seconds |

---

## Sampling Rate

- **After every task commit:** Run `pnpm tsx scripts/test-geolocation-filter.ts`
- **After every plan wave:** Run `pnpm tsx scripts/test-active-walk.ts && pnpm build`
- **Before `/gsd-verify-work`:** Full suite must be green
- **Max feedback latency:** 15 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 02-01-01 | 01 | 1 | GPS-01 | — | Rejects accuracy > 35m, filters stationary jitter < 5m | unit | `pnpm tsx scripts/test-geolocation-filter.ts` | ✅ | ✅ green |
| 02-01-02 | 01 | 1 | WALK-01 | — | Initializes walk session in Dexie with UUID & start time | unit | `pnpm tsx scripts/test-active-walk.ts` | ✅ | ✅ green |
| 02-01-03 | 01 | 1 | WALK-02 | — | Auto-resumes walk session where `endedAt == null` | unit | `pnpm tsx scripts/test-active-walk.ts` | ✅ | ✅ green |
| 02-02-01 | 02 | 2 | MAP-01, MAP-02 | — | MapLibre renders OpenFreeMap style & polyline layer | integration | `pnpm build` | ✅ | ✅ green |
| 02-02-02 | 02 | 2 | WALK-03, GPS-02 | — | Walk end summary drawer, trail bounding box fit | automated | `obscura fetch http://localhost:3000/walk` | ✅ | ✅ green |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [x] `scripts/test-geolocation-filter.ts` — Unit test for Haversine distance, accuracy cutoff, and stationary displacement filter.
- [x] `scripts/test-active-walk.ts` — Unit test for Dexie `walks` session lifecycle, point accumulation, and auto-resume query using `fake-indexeddb`.

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Outdoor map pan & follow mode | MAP-01 | Requires browser WebGL and touch interaction | Drag map to verify pan release; tap Recenter FAB to verify camera snaps back to user beacon. |
| Hold-to-confirm End Walk | WALK-03 | Touch hold duration gesture | Press and hold "End Walk" button for 1.5s to verify completion sheet opens. |

---

## Validation Sign-Off

- [x] All tasks have `<automated>` verify or Wave 0 dependencies
- [x] Sampling continuity: no 3 consecutive tasks without automated verify
- [x] Wave 0 covers all MISSING references
- [x] No watch-mode flags
- [x] Feedback latency < 15s
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** approved 2026-10-08

