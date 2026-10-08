# Phase 5: Collection, Journal & Export - Context

**Gathered:** 2026-10-08
**Status:** Ready for planning

<domain>
## Phase Boundary

Phase 5 delivers the Life List collection interface (`/collection`), the daily species hunt challenge engine (`HUNT-01`, `HUNT-02`), past expedition history with activity heatmap (`/journal`), walk detail route and telemetry review (`/journal/[walkId]`), full client-side Obsidian-compatible ZIP export generator (`EXPT-01`), and data management / deletion safeguards (`SETT-01`).

</domain>

<decisions>
## Implementation Decisions

### Daily Species Hunt Mechanics & Rules (HUNT-01, HUNT-02)
- **D-01:** Deterministic tiered multi-target challenge — Hashes the local date string (`YYYY-MM-DD`) into a deterministic seed that selects 1–2 target goals from a rules catalog (e.g., "Find 1 Tree and 1 Insect" or "Find 2 distinct Plant varieties") with individual progress pips.
- **D-02:** Day-wide automatic matching — Any confirmed organism identified between 00:00 and 23:59 local time automatically ticks off matching hunt criteria across any walk session without requiring manual check-in or single-session completion.
- **D-03:** Celebratory modal dialog with stamp animation — Fulfilling all targets triggers a celebratory dialog showcasing completed targets, a dated field badge, soft audio chime (if sound enabled), and haptic vibration feedback.
- **D-04:** Dual UI placement — Featured as an evocative hero card at the top of `/collection` and as a compact, expandable top HUD pill during active walks on `/walk`.

### Life List Display & Taxon Grouping (LIFE-01)
- **D-05:** Horizontal category filter pills with live counts — Horizontal scrollable pill bar (`All`, `Trees`, `Flowers`, `Plants`, `Birds`, `Insects`, `Fungus`, `Other`) displaying real-time specimen counts and filtering a responsive grid.
- **D-06:** Canonical species cards with encounter counts — De-duplicates multiple sightings of the same species into a single card featuring the primary photograph, common + scientific name, verified taxon chip, and a `Seen Nx` badge linking to specimen details.
- **D-07:** Real-time search & sorting dropdown — Text input filtering common and scientific names in real time, accompanied by a sort selector (`Most Recent`, `Most Seen`, `Alphabetical A–Z`).
- **D-08:** Evocative field notebook empty state — When no species have been collected or filter returns 0 matches, displays warm serif prose (*"Your field ledger awaits its first discovery..."*), subtle silhouette graphics, and a direct `Start a Walk` button.

### Journal Timeline & Activity Heatmap (JOUR-01, JOUR-02)
- **D-09:** Rolling multi-week activity grid — GitHub/Obsidian style activity matrix (rolling 12 weeks, 7 days high) with 4 terracotta intensity levels based on daily expedition distance and specimen count.
- **D-10:** Date-grouped walk timeline — Grouped chronologically under sticky date headers (`Today`, `Yesterday`, `Oct 4, 2026`) with summary cards showing walk duration, distance, species thumbnail badges, and audio note counts.
- **D-11:** Split inspection layout for `/journal/[walkId]` — Top responsive MapLibre map displaying the full recorded GPS polyline path, specimen pins, and audio pins, followed by section tabs: Walk Stats, Confirmed Finds, and Voice Notes.
- **D-12:** Editable title & safe deletion workflow — Walker can rename past walk sessions or delete an individual walk via a confirmation dialog offering the option to preserve confirmed specimens in the Life List or purge orphaned entries. — **Reversibility:** costly — cascading deletion logic across `walks`, `entries`, and `notes` tables requires strict referential integrity handling in Dexie.

### Obsidian ZIP Export & Settings Data Management (EXPT-01, SETT-01)
- **D-13:** Structured Naturalist Vault architecture — Generates a downloadable ZIP archive using JSZip containing:
  - `/Walks/`: Markdown expedition notes linking via Obsidian `[[Species/...]]` wiki-links.
  - `/Species/`: Taxon notes with Wikipedia facts, CC BY-SA citations, and embedded photos `![[Media/...]]`.
  - `/Media/`: Full 1024px JPEGs and recorded WebM audio clips with sanitized slug filenames.
  - `treads-backup.json`: Complete raw Dexie database JSON dump at vault root for full restore capabilities. — **Reversibility:** costly — export folder structure and markdown wiki-link conventions define external compatibility with Obsidian and user backups.
- **D-14:** Rich Obsidian-native YAML properties — Frontmatter schema compatible with Obsidian Dataview and Map plugins (`type: walk | species`, `date`, `duration`, `distance_meters`, `coordinates`, `tags: [treads, nature/...]`, `encounters`, `wiki_links`).
- **D-15:** Full media bundling with slugified filenames — Exports full-resolution 1024px JPEGs and recorded WebM audio files stored in Dexie, sanitized into readable slugs (e.g. `Media/european-robin-20261008-1422.jpg`).
- **D-16:** Dedicated `/settings` route with Danger Zone gate — Implements `/settings` featuring storage persistence toggle/status (`navigator.storage.persist()`), audio/haptics preferences, instant full export download button, and a red Danger Zone with a type-to-confirm dialog before wiping all Dexie IndexedDB tables.

### the agent's Discretion
- Exact hash algorithm for daily hunt (e.g., MurmurHash3 or simple string DJB2 hash of `YYYY-MM-DD`).
- Heatmap cell size and mobile horizontal touch scrolling behavior.
- Sanitize logic for species filename generation in the ZIP export (replacing special characters and spaces with dashes).

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Architecture & Requirements
- `DECISIONS.md` § Decisions 1, 2, 8 — Local-first client architecture, Canvas EXIF stripping, and private IndexedDB storage
- `PRD.md` § 4.6, § 4.7, § 5.3, § 5.5 — Life list collection, journal timeline, export bundle, and Dexie database schema
- `.planning/ROADMAP.md` § Phase 5 — Phase 5 scope, dependencies, requirements (`HUNT-01, HUNT-02, LIFE-01, JOUR-01, JOUR-02, EXPT-01, SETT-01`), and success criteria
- `.planning/REQUIREMENTS.md` § Collection, Journal & Export — Specific acceptance criteria for hunting, life list, heatmap, and ZIP export

### Database & Types
- `lib/db.ts` — Dexie schemas for `Walk`, `Entry`, `Note`, and `UserSettings` tables
- `lib/camera.ts` — Thumbnail and photo blob generation utilities

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `lib/db.ts`: `db.walks`, `db.entries`, `db.notes`, and `db.settings` tables already populated with data from Phases 1–4.
- `components/ui/card.tsx`, `components/ui/badge.tsx`, `components/ui/button.tsx`, `components/ui/sheet.tsx`, `components/ui/dialog.tsx`: Tangerin Dream styled Base UI components ready for collection, journal, and modal interfaces.
- `components/motion/motion-view.tsx`: Tab-throttled entrance and motion wrapper for smooth page and card transitions.
- `components/map/walk-map.tsx`: MapLibre GL map component with polyline and pin layers, readily adaptable for `/journal/[walkId]` past walk review.
- `components/entry/fact-card.tsx`: Rich fact presentation card with CC BY-SA Wikipedia attribution formatting.
- `components/speech/fact-audio-player.tsx`: Inline audio playback pill for fact cards and note replays.

### Established Patterns
- Client-side data fetching directly from Dexie using `useLiveQuery`.
- Tangerin Dream color palette (`#F35C2B` primary terracotta, muted borders, warm dark and light modes).
- Responsive mobile-first design with bottom sheets and accessible dialog overlays.

### Integration Points
- `app/collection/page.tsx`: New route for Life List species grid, category pills, search/sort, and Daily Hunt hero banner.
- `app/journal/page.tsx`: New route for activity heatmap and chronological walk history.
- `app/journal/[walkId]/page.tsx`: New route for walk route review, telemetry breakdown, and note reel.
- `app/settings/page.tsx`: New route for storage persistence, settings preferences, ZIP export trigger, and data reset.
- `lib/hunt.ts`: Deterministic daily hunt generator hashing `YYYY-MM-DD` to target catalog rules.
- `lib/export.ts`: JSZip archive generator assembling Markdown files, media blobs, and `treads-backup.json`.

</code_context>

<specifics>
## Specific Ideas

- Daily Hunt uses date hash with multi-target criteria (e.g. 1 Tree + 1 Insect) with visual progress pips.
- Celebration dialog displays celebratory stamp animation, haptic pulse, and dated field badge.
- Collection de-duplicates multiple encounters into a single canonical species card showing "Seen Nx" count.
- Activity heatmap renders a 12-week rolling matrix with 4 terracotta intensity levels.
- Obsidian ZIP includes a Naturalist Vault folder structure (`/Walks`, `/Species`, `/Media`, `treads-backup.json`) with Dataview-compatible YAML frontmatter.
- Settings page provides a safe two-step confirmation modal before deleting IndexedDB data.

</specifics>

<deferred>
## Deferred Ideas

- None — discussion stayed strictly within Phase 5 scope.

</deferred>

---

*Phase: 5-Collection, Journal & Export*
*Context gathered: 2026-10-08*
