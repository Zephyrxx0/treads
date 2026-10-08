# Phase 5: Collection, Journal & Export - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-10-08
**Phase:** 5-Collection, Journal & Export
**Areas discussed:** Daily Species Hunt, Life List Display & Taxon Grouping, Journal Timeline & Activity Heatmap, Obsidian ZIP Export & Data Management

---

## Daily Species Hunt

| Option | Description | Selected |
|--------|-------------|----------|
| Tiered multi-target challenge | e.g. "Spot 1 Tree and 1 Insect" or "Find 2 distinct Plant types" with progress pips for each target | ✓ |
| Single taxon target | e.g. "Spot any Bird today" or "Find a Flowering Plant" | |
| Specimen count with taxon bonus | e.g. "Record 3 finds today, including at least 2 different categories" | |

**User's choice:** Tiered multi-target challenge with progress pips.

| Option | Description | Selected |
|--------|-------------|----------|
| Automatic day-wide matching | Any confirmed organism identified today (00:00 to 23:59 local time) automatically ticks off matching hunt targets across any walk session | ✓ |
| Walk-session bound only | Confirmed finds only count if captured during an active, running walk session | |
| Check-in mode | Walker explicitly opts in on /collection before their finds contribute to today's progress pips | |

**User's choice:** Automatic day-wide matching across all walks.

| Option | Description | Selected |
|--------|-------------|----------|
| Celebratory modal dialog with stamp animation | An evocative celebration card showing the completed targets, celebratory chime (if audio enabled), haptic feedback, and a dated field badge | ✓ |
| Inline glowing card transformation | Daily hunt banner smoothly transitions to a gold/terracotta completed state with subtle particle burst and haptic vibration | |
| Unobtrusive toast notification | Brief non-modal toast announcement | |

**User's choice:** Celebratory modal dialog with stamp animation.

| Option | Description | Selected |
|--------|-------------|----------|
| Hero card on /collection + compact HUD pill on /walk | Hero banner at top of /collection, plus an expandable top HUD pill during walks | ✓ |
| Dedicated to /collection only | Keep /walk interface strictly focused on trail mapping | |
| Prominently on Home (/) and /collection | Status cards on home and collection, minimal /walk | |

**User's choice:** Hero card on /collection + compact HUD pill on /walk.

---

## Life List Display & Taxon Grouping

| Option | Description | Selected |
|--------|-------------|----------|
| Category filter pills with count chips | Horizontal scrollable pill bar ('All 14', 'Trees 4', 'Birds 3', etc.) driving a responsive specimen grid | ✓ |
| Collapsible category accordions | Stacked expandable sections for each taxon kind | |
| Vertical scrolling bento sections | Unified continuous page with distinct visual section blocks | |

**User's choice:** Category filter pills with count chips.

| Option | Description | Selected |
|--------|-------------|----------|
| Canonical species card with encounter count | Displays primary photo, common + scientific name, verified badge, and a 'Seen Nx' encounter count linking to specimen details | ✓ |
| Multi-photo thumbnail carousel | Card displays primary capture with small thumbnail previews of all sightings | |
| Expandable encounter timeline | Card expands to show a mini chronological log of each date and walk location | |

**User's choice:** Canonical species card with encounter count.

| Option | Description | Selected |
|--------|-------------|----------|
| Real-time text search + Sort dropdown | Instant live search by common/scientific name plus sorting by 'Most Recent', 'Most Seen', or 'Alphabetical (A–Z)' | ✓ |
| Instant text search only | Search input filtering names in real time with fixed chronological order | |
| Filter pills only | Keep header clean without search bar | |

**User's choice:** Real-time text search + Sort dropdown.

| Option | Description | Selected |
|--------|-------------|----------|
| Evocative field notebook empty state | Warm serif narrative ('Your field ledger awaits its first discovery...'), subtle silhouette art, and a direct 'Start a Walk' button | ✓ |
| Minimalist utility card | Clean muted card with icon and brief explanation | |
| Mystery silhouette gallery | Greyed-out silhouettes of category archetypes | |

**User's choice:** Evocative field notebook empty state.

---

## Journal Timeline & Activity Heatmap

| Option | Description | Selected |
|--------|-------------|----------|
| Rolling multi-week activity grid | GitHub/Obsidian-style grid (rolling 12 weeks, 7 days high) with 4 terracotta intensity levels based on walk activity (distance + find count) | ✓ |
| Monthly calendar matrix | Traditional calendar month grid with active date markers | |
| Compact weekly streak strip | Horizontal 7-day streak bar with active day checkmarks | |

**User's choice:** Rolling multi-week activity grid.

| Option | Description | Selected |
|--------|-------------|----------|
| Grouped by Date with rich cards | Sticky date headers ('Today', 'Yesterday', 'Oct 4, 2026') with walk cards showing duration, distance, specimen thumbnail badges, and audio note counts | ✓ |
| Flat chronological stream | Single scrollable card stream ordered newest first | |
| Monthly grouped accordions | Accordions per month with aggregate monthly mileage and species totals | |

**User's choice:** Grouped by Date with rich cards.

| Option | Description | Selected |
|--------|-------------|----------|
| Split inspection layout | Responsive header map (MapLibre showing route polyline + organism and audio pins) followed by tabbed/sectioned breakdown: Walk Stats, Confirmed Finds, and Voice Notes | ✓ |
| Full-screen map with draggable sheet | Fullscreen MapLibre viewport with swipeable bottom sheet | |
| Narrative chronological expedition log | Linear field log stepping through each time-stamped milestone | |

**User's choice:** Split inspection layout for `/journal/[walkId]`.

| Option | Description | Selected |
|--------|-------------|----------|
| Editable title & safe delete | Ability to rename walk and delete the walk with a confirmation prompt offering choice to preserve confirmed finds in Life List or purge entirely | ✓ |
| Simple delete walk with all attached records | Delete walk button removing walk, entries, and notes | |
| Immutable historical record | Read-only historical archive | |

**User's choice:** Editable title & safe delete.

---

## Obsidian ZIP Export & Data Management

| Option | Description | Selected |
|--------|-------------|----------|
| Structured Naturalist Vault | Dedicated folders: /Walks (walk markdown linking to [[Species/...]]), /Species (taxonomic notes with frontmatter, Wikipedia facts, CC BY-SA attribution), /Media (JPEGs & audio), and treads-backup.json at the root | ✓ |
| Flat interconnected folder | All walk and species notes placed at vault root with Obsidian wiki-links [[...]] and /attachments | |
| Walk-centric folder hierarchy | /Walks/<walk-date>/ containing each walk's markdown note, specimen sub-notes, and photos | |

**User's choice:** Structured Naturalist Vault.

| Option | Description | Selected |
|--------|-------------|----------|
| Obsidian-native YAML properties with Dataview & Map support | Rich frontmatter (type, date, duration, distance_meters, coordinates, tags: [treads, nature/bird], wiki-links) compatible with Obsidian Dataview and Map plugins | ✓ |
| Minimal frontmatter | Simple YAML headers keeping all statistics and citations as human-readable markdown | |
| Full raw JSON embedded frontmatter | Entire database record dumped into the YAML block | |

**User's choice:** Obsidian-native YAML properties with Dataview & Map support.

| Option | Description | Selected |
|--------|-------------|----------|
| Full media bundle with sanitized names | Includes full 1024px JPEGs and recorded WebM audio clips in /Media/ with readable slugs (e.g. Media/european-robin-20261008.jpg) referenced via ![[...]] embeds | ✓ |
| Export options modal with media toggles | Modal dialog allowing user to choose export contents with checkboxes | |
| Text-only archive | Markdown notes and treads-backup.json only | |

**User's choice:** Full media bundle with sanitized names.

| Option | Description | Selected |
|--------|-------------|----------|
| Dedicated /settings page with two-step Danger Zone | Clean /settings route containing Export button, Storage persistence status, Audio/Haptic toggles, and a red Danger Zone with a type-to-confirm dialog before wiping all IndexedDB tables | ✓ |
| Slide-over Settings Sheet from navigation bar | Slide-over drawer accessible from any page | |
| Automatic Export-before-Wipe prompt | When Delete All Data is clicked, automatically triggers ZIP download | |

**User's choice:** Dedicated /settings page with two-step Danger Zone.

---

## the agent's Discretion

- Deterministic hashing algorithm implementation (e.g. string DJB2 / FNV-1a hash of `YYYY-MM-DD`).
- Heatmap cell dimensions and responsive touch scrolling.
- Filename sanitization pattern for species and walk media exports.

## Deferred Ideas

- None — discussion stayed within Phase 5 scope.
