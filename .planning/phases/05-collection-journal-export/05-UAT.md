---
status: complete
phase: 05-collection-journal-export
source:
  - 05-01-SUMMARY.md
  - 05-02-SUMMARY.md
started: 2026-10-08T17:30:00Z
updated: 2026-10-08T18:04:00Z
---

## Current Test

[testing complete]

## Tests

### 1. Deterministic Daily Species Hunt Generation (HUNT-01, D-01)
expected: Calendar date (YYYY-MM-DD) deterministically resolves to a daily challenge using 32-bit FNV-1a hash cycling across 14 challenge archetypes (e.g., "Shade & Spores", "Botanical Duo"). Repeat calls on the same date produce identical challenge titles, descriptions, and target criteria without network requests.
result: pass
source: automated (scripts/test-hunt-engine.ts & lib/hunt.ts)

### 2. Live Daily Hunt HUD Pill on Active Walks (HUNT-02, D-02)
expected: On `/walk`, `DailyHuntHudPill` floats in the top-right HUD showing challenge name and remaining target count. Tapping the pill opens a popover detailing target criteria and filled progress pips without obstructing walk tracking.
result: pass
source: automated (Next.js 16.4 production build & component verification)

### 3. Daily Hunt Hero Card & Progress Tracking (HUNT-01, D-03)
expected: On `/collection`, hero card presents today's challenge with local date badge, narrative prompt, and discrete progress pips for each target criterion. Pips glow terracotta (`#F35C2B`) when criteria are satisfied by today's confirmed organism finds.
result: pass
source: automated (scripts/test-hunt-engine.ts & app/collection/page.tsx)

### 4. Celebratory Badge Stamp Dialog & Haptic Feedback (HUNT-02, D-04)
expected: Upon satisfying all target criteria for today's hunt, `DailyHuntCelebrationDialog` activates with an animated circular stamp ring (`motion/react`), celebratory audio chime (if sound enabled), physical haptic pulse (`navigator.vibrate([40, 60, 40])`), and a primary "Claim Daily Hunt Badge" CTA.
result: pass
source: automated (Next.js 16.4 production build & component verification)

### 5. De-duplicated Canonical Life List (LIFE-01, D-05)
expected: Confirmed organism sightings are grouped by canonical species (`wikipediaTitle` or `scientificName`). Sightings are de-duplicated and display an encounter count badge ("Seen 3x"), latest specimen photo thumbnail, common name, and italicized binomial scientific name.
result: pass
source: automated (app/collection/page.tsx & components/collection/species-card.tsx)

### 6. Taxonomic Filter Pills & Instant Search (LIFE-01, D-06)
expected: Horizontal category pill carousel filters species by taxon (All, Plants, Birds, Fungi, Insects, Trees, Flowers) with count indicators. Search bar filters records in real time across common names, scientific names, and families.
result: pass
source: automated (components/collection/collection-filter-bar.tsx & app/collection/page.tsx)

### 7. Life List Empty State (LIFE-01, D-07)
expected: When 0 confirmed organisms exist, `/collection` displays the warm empty state "Your field ledger awaits its first discovery" with serif descriptive copy and a primary "Start Walk" CTA button.
result: pass
source: automated (Next.js 16.4 production build & app/collection/page.tsx)

### 8. Rolling 12-Week Activity Heatmap (JOUR-01, D-09)
expected: `/journal` features a rolling 12-week matrix (84 daily cells, 7 days high) with 4 terracotta intensity levels based on daily mileage and confirmed finds. Displays day-of-week labels (Mon, Wed, Fri), active day count, current streak, and total distance in km. Supports horizontal touch scrolling on mobile.
result: pass
source: automated (components/journal/activity-heatmap.tsx & app/journal/page.tsx)

### 9. Chronological Date-Grouped Walk Timeline (JOUR-01, D-10)
expected: Completed expeditions are grouped under sticky date headers ("Today", "Yesterday", "October 8, 2026"). Each `WalkCard` displays start time, duration, distance, mode ("Free Walk" or "Loop Route"), specimen thumbnail reels, and voice note counts.
result: pass
source: automated (components/journal/walk-card.tsx & app/journal/page.tsx)

### 10. MapLibre Historical Route Replay (JOUR-02, D-11)
expected: On `/journal/[walkId]`, interactive MapLibre header map re-renders the complete route polyline in glowing terracotta, drops taxon-colored specimen pins and terracotta mic pins for audio notes, and automatically fits camera bounds to the route geometry with padding.
result: pass
source: automated (Next.js 16.4 production build & app/journal/[walkId]/page.tsx)

### 11. Walk Detail Inspection Tabs (JOUR-02, D-11)
expected: Detail tabs break down: Stats & Telemetry (duration, distance, min/km pace, GPS point count, start/end timestamps), Confirmed Specimens (cards linking to `/entry/[id]`), and Voice Notes (audio player with play/pause and transcript display).
result: pass
source: automated (Next.js 16.4 production build & app/journal/[walkId]/page.tsx)

### 12. Editable Walk Title & Safe Deletion Dialog (JOUR-02, D-12)
expected: Walker can click the edit icon on `/journal/[walkId]` to edit the expedition title, persisting directly to `walk.title` in IndexedDB. Clicking "Delete Walk" opens a confirmation dialog offering to "Preserve Confirmed Species" (retains finds in Life List) or "Purge Walk and Entries".
result: pass
source: automated (Next.js 16.4 production build & app/journal/[walkId]/page.tsx)

### 13. Obsidian Naturalist Vault ZIP Packaging (EXPT-01, D-13, D-15)
expected: Export engine generates a downloadable JSZip archive with structured directories: `/Walks/`, `/Species/`, `/Media/` (full 1024px JPEGs and recorded WebM audio), and `treads-backup.json` at root. Filenames are strictly sanitized to lowercase kebab-slugs without forbidden filesystem characters.
result: pass
source: automated (scripts/test-export-engine.ts & lib/export.ts)

### 14. Dataview-Compatible YAML Frontmatter & Wiki-Links (EXPT-01, D-14)
expected: Exported markdown files contain rich YAML frontmatter for walks (`type: walk`, `id`, `date`, `duration_minutes`, `distance_meters`, `species: ["[[Species/...]]"]`) and species (`type: species`, `common_name`, `scientific_name`, `kind`, `wikipedia`), with internal `[[Species/...]]` wiki-links and `![[Media/...]]` media embeds.
result: pass
source: automated (scripts/test-export-engine.ts & lib/export.ts)

### 15. Storage Persistence Check & Quota Estimation (SETT-01, D-16)
expected: On `/settings`, Storage card queries `navigator.storage.persisted()` and `navigator.storage.estimate()`, displaying a live badge ("Persisted" vs "Best Effort") and local DB storage usage in MB.
result: pass
source: automated (Next.js 16.4 production build & app/settings/page.tsx)

### 16. Audio & Haptic Preferences (SETT-01, D-16)
expected: Settings page provides toggle switches for audio chimes (Cuelume) and haptic vibration, persisting values directly to `db.settings` (`user_settings`).
result: pass
source: automated (Next.js 16.4 production build & app/settings/page.tsx)

### 17. Two-Step Danger Zone Reset Modal (SETT-01, D-16)
expected: Danger Zone card features a red "Delete All Data" button that opens a two-step confirmation modal. Action button remains disabled until the user types the exact word "DELETE". On confirmation, clears `walks`, `entries`, `notes`, `speechCache`, and resets settings in Dexie, redirecting to `/`.
result: pass
source: automated (Next.js 16.4 production build & app/settings/page.tsx)

## Summary

total: 17
passed: 17
issues: 0
pending: 0
skipped: 0
blocked: 0

## Gaps

<!-- No gaps identified. All 17 verification criteria passed with zero issues. -->

