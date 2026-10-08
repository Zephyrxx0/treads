---
phase: 5
slug: collection-journal-export
status: draft
nyquist_compliant: true
wave_0_complete: true
created: 2026-10-08
---

# Phase 5 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | TypeScript compiler + Next.js build + standalone validation scripts via tsx |
| **Config file** | tsconfig.json, package.json |
| **Quick run command** | `npx tsc --noEmit` |
| **Full suite command** | `npx tsc --noEmit && npm run build` |
| **Estimated runtime** | ~15 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npx tsc --noEmit`
- **After every plan wave:** Run `npx tsc --noEmit && npm run build`
- **Before `/gsd-verify-work`:** Full suite must be green
- **Max feedback latency:** 20 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 05-01-01 | 01 | 1 | HUNT-01, HUNT-02 | — | Deterministic date-hash rules engine | unit | `npx tsc --noEmit` | ✅ | ⬜ pending |
| 05-01-02 | 01 | 1 | LIFE-01 | — | Life list collection grouping and search | integration | `npx tsc --noEmit` | ✅ | ⬜ pending |
| 05-02-01 | 02 | 2 | JOUR-01, JOUR-02 | — | 12-week heatmap & walk route review | integration | `npx tsc --noEmit` | ✅ | ⬜ pending |
| 05-02-02 | 02 | 2 | EXPT-01, SETT-01 | — | Obsidian ZIP archive & settings reset | integration | `npx tsc --noEmit` | ✅ | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

Existing infrastructure covers all phase requirements.

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Daily hunt stamp celebration dialog | HUNT-02 | Visual confetti/stamp animation & sound cue | Confirm organisms matching daily challenge; observe modal appearance & haptic pulse |
| MapLibre past walk route inspection | JOUR-02 | Vector tile rendering and pin placement | Navigate to `/journal/[walkId]`; verify route polyline, specimen pins, and audio pins render |
| Obsidian ZIP import into Obsidian | EXPT-01 | External desktop app file compatibility | Download exported ZIP, unzip into an Obsidian vault folder, verify wiki-links `[[...]]` resolve and media displays |
| Danger Zone data wipe | SETT-01 | Two-step confirmation and Dexie purge | Navigate to `/settings`, initiate wipe, type "DELETE", verify tables are cleared and page redirects safely |

---

## Validation Sign-Off

- [x] All tasks have `<automated>` verify or Wave 0 dependencies
- [x] Sampling continuity: no 3 consecutive tasks without automated verify
- [x] Wave 0 covers all MISSING references
- [x] No watch-mode flags
- [x] Feedback latency < 20s
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** approved 2026-10-08
