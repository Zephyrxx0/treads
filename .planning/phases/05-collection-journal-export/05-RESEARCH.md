# Phase 5: Collection, Journal & Export - Technical Research

**Phase:** 05  
**Domain:** Life List Collection, Daily Species Hunt Rules, Activity Heatmap Timeline, Obsidian-Compatible ZIP Export & IndexedDB Reset  
**Status:** Completed  
**Confidence:** HIGH  

---

## User Constraints

*(Verbatim from `.planning/phases/05-collection-journal-export/05-CONTEXT.md`)*

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
- **D-12:** Editable title & safe deletion workflow — Walker can rename past walk sessions or delete an individual walk via a confirmation dialog offering the option to preserve confirmed specimens in the Life List or purge orphaned entries.

### Obsidian ZIP Export & Settings Data Management (EXPT-01, SETT-01)
- **D-13:** Structured Naturalist Vault architecture — Generates a downloadable ZIP archive using JSZip containing:
  - `/Walks/`: Markdown expedition notes linking via Obsidian `[[Species/...]]` wiki-links.
  - `/Species/`: Taxon notes with Wikipedia facts, CC BY-SA citations, and embedded photos `![[Media/...]]`.
  - `/Media/`: Full 1024px JPEGs and recorded WebM audio clips with sanitized slug filenames.
  - `treads-backup.json`: Complete raw Dexie database JSON dump at vault root for full restore capabilities.
- **D-14:** Rich Obsidian-native YAML properties — Frontmatter schema compatible with Obsidian Dataview and Map plugins (`type: walk | species`, `date`, `duration`, `distance_meters`, `coordinates`, `tags: [treads, nature/...]`, `encounters`, `wiki_links`).
- **D-15:** Full media bundling with slugified filenames — Exports full-resolution 1024px JPEGs and recorded WebM audio files stored in Dexie, sanitized into readable slugs (e.g. `Media/european-robin-20261008-1422.jpg`).
- **D-16:** Dedicated `/settings` route with Danger Zone gate — Implements `/settings` featuring storage persistence toggle/status (`navigator.storage.persist()`), audio/haptics preferences, instant full export download button, and a red Danger Zone with a type-to-confirm dialog before wiping all Dexie IndexedDB tables.

---

## Phase Requirements

| ID | Description | Technical Requirement |
|----|-------------|-----------------------|
| `HUNT-01` | Deterministic daily species challenge from local date hash (`YYYY-MM-DD`) | Hash generator in `lib/hunt.ts` maps day string to goal combination |
| `HUNT-02` | Progress tracking across confirmed finds with completion celebration | Live query matching entries created today (`createdAt >= startOfDay`), stamp animation trigger |
| `LIFE-01` | `/collection` displays all unique confirmed finds grouped by organism kind | Aggregation query reducing entries by canonical `wikipediaTitle` / `scientificName`, taxon pills |
| `JOUR-01` | `/journal` displays past walks grouped by date with heatmap | 12-week matrix grouping walks by calendar day with 4-level terracotta scale |
| `JOUR-02` | `/journal/[walkId]` shows walk route, telemetry stats, and find pins | MapLibre route polyline layer, find markers, audio pins, stats tab, and safe delete |
| `EXPT-01` | Obsidian-compatible ZIP export generator | Client-side JSZip packaging of `/Walks`, `/Species`, `/Media`, and `treads-backup.json` |
| `SETT-01` | Settings data wipe action with confirmation dialog | Reset Dexie tables (`walks.clear()`, `entries.clear()`, `notes.clear()`, `speechCache.clear()`) |

---

## Standard Stack

1. **ZIP Packaging:** `jszip` (v3.10.1) [VERIFIED: npm registry]
   - Generates browser-side downloadable ZIP blobs without server roundtrips.
   - Handles binary blobs (`Blob`, `Uint8Array`) seamlessly for photos and WebM audio.
2. **Database Engine:** `dexie` (4.4.6) and `dexie-react-hooks` (4.4.0) [VERIFIED: package.json:21-22]
   - `useLiveQuery` delivers zero-latency reactive updates across collection, journal, and walk HUD.
3. **Component Primitives:** `@base-ui-components/react` (1.0.0-rc.0) and `components/ui/` [VERIFIED: package.json:13]
   - Dialog, Sheet, Button, Card, Badge, Progress with Tangerin Dream theme tokens.
4. **Map Rendering:** `maplibre-gl` (6.13.0) [VERIFIED: package.json:24]
   - Reused on `/journal/[walkId]` using existing OpenFreeMap vector style.
5. **Icons:** `lucide-react` (1.52.0) [VERIFIED: package.json:23]
   - Category icons (`TreePine`, `Flower2`, `Sprout`, `Bird`, `Bug`, `Sparkles`, `Footprints`, `Download`, `Trash2`).

---

## Architecture Patterns

### 1. Deterministic Daily Hunt Rule Engine (`lib/hunt.ts`)
A lightweight, zero-dependency hash function (FNV-1a 32-bit) converts local `YYYY-MM-DD` (e.g., `"2026-10-08"`) into an integer seed:
```ts
function hashDateString(dateStr: string): number {
  let hash = 2166136261;
  for (let i = 0; i < dateStr.length; i++) {
    hash ^= dateStr.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}
```
The seed indexes into a curated catalog of challenges:
- Tier 1: Single kind pairs (e.g. 1 Tree + 1 Flower, 1 Bird + 1 Plant, 1 Insect + 1 Tree)
- Tier 2: Quantity focus (e.g. 2 distinct Plants, 2 distinct Trees)
- Tier 3: Explorer challenge (e.g. 1 Animal/Bird/Insect + 1 Flora/Tree/Plant)

Each challenge has:
- `id`: Unique string
- `date`: `YYYY-MM-DD`
- `targets`: `Array<{ kind: OrganismKind; count: number; label: string }>`
- `title`: Short descriptive title (e.g., "Canopy & Micro-Fauna")
- `description`: Narrative prompt

### 2. Life List De-duplication Aggregation
In Dexie, `db.entries` contains all individual sightings. To produce the canonical Life List:
```ts
const confirmedEntries = await db.entries.where('status').equals('confirmed').toArray();
const canonicalMap = new Map<string, {
  canonicalEntry: Entry;
  encounters: number;
  dates: number[];
  walkIds: string[];
}>();

for (const entry of confirmedEntries) {
  const key = entry.confirmed?.wikipediaTitle || entry.confirmed?.scientificName || entry.id;
  if (!canonicalMap.has(key)) {
    canonicalMap.set(key, { canonicalEntry: entry, encounters: 1, dates: [entry.createdAt], walkIds: [entry.walkId] });
  } else {
    const item = canonicalMap.get(key)!;
    item.encounters += 1;
    item.dates.push(entry.createdAt);
    if (!item.walkIds.includes(entry.walkId)) item.walkIds.push(entry.walkId);
  }
}
```

### 3. Activity Heatmap Grid Generator
Generates a matrix of 12 rolling weeks ending today.
Each cell represents one day `YYYY-MM-DD` with:
- `walkCount`: number of completed walks
- `distanceMeters`: sum of walk distances
- `speciesCount`: unique species found that day
- `intensity`: 0 (none), 1 (light), 2 (moderate), 3 (high), 4 (peak)
Mapped to Tangerin Dream terracotta intensity classes (`bg-muted/40`, `bg-[#F35C2B]/25`, `bg-[#F35C2B]/50`, `bg-[#F35C2B]/75`, `bg-[#F35C2B]`).

### 4. Obsidian Naturalist Vault Structure (`lib/export.ts`)
The JSZip generator produces:
```
Treads-Journal-YYYY-MM-DD/
├── Walks/
│   ├── 2026-10-08-afternoon-loop.md
│   └── 2026-10-07-riverside-trail.md
├── Species/
│   ├── European-Robin.md
│   └── English-Oak.md
├── Media/
│   ├── european-robin-20261008-1422.jpg
│   ├── voice-note-walk-20261008-1430.webm
│   └── english-oak-20261008-1435.jpg
└── treads-backup.json
```

**Walk Note Frontmatter & Markdown:**
```markdown
---
type: walk
id: 550e8400-e29b-41d4-a716-446655440000
date: 2026-10-08
started_at: "2026-10-08T14:15:00Z"
ended_at: "2026-10-08T15:20:00Z"
duration_minutes: 65
distance_meters: 3420
mode: loop
tags:
  - treads
  - treads/walk
species:
  - "[[Species/European Robin]]"
  - "[[Species/English Oak]]"
---

# Walk: October 8, 2026

**Duration:** 65 min &bull; **Distance:** 3.42 km &bull; **Finds:** 2 species

## Specimen Finds
- [[Species/European Robin]] — Spotted at 14:22
- [[Species/English Oak]] — Spotted at 14:35

## Voice Notes
- Recorded at 14:30: ![[Media/voice-note-walk-20261008-1430.webm]]
> *"The woodland trail opens into a small clearing near the ancient oaks."*
```

**Species Note Frontmatter & Markdown:**
```markdown
---
type: species
common_name: "European Robin"
scientific_name: "Erithacus rubecula"
kind: bird
verified: true
wikipedia: "https://en.wikipedia.org/wiki/European_robin"
first_seen: 2026-10-08
encounters: 3
tags:
  - treads
  - treads/species
  - nature/bird
---

# European Robin (*Erithacus rubecula*)

![[Media/european-robin-20261008-1422.jpg]]

## Field Facts
> The European robin is a small insectivorous passerine bird known for its distinctive orange breast.

- [1] The robin is found across Europe, east to Western Siberia and south to North Africa.
- [2] Males and females have identical plumage.

*Source: Wikipedia (CC BY-SA 4.0)*
```

---

## Don't Hand-Roll

1. **Don't hand-roll ZIP packaging:** Use `jszip` — it handles UTF-8 file paths, binary stream conversion, and Deflate compression reliably.
2. **Don't hand-roll Blob download anchors:** Create an object URL from `zip.generateAsync({ type: 'blob' })` and invoke temporary `<a download="filename.zip">.click()`, followed by `URL.revokeObjectURL(url)`.
3. **Don't hand-roll date-math timezones:** Work with local ISO strings `new Date().toLocaleDateString('en-CA')` (returns `YYYY-MM-DD` reliably across locales in modern browsers) so midnight rollovers strictly match the user's phone clock.
4. **Don't hand-roll IndexedDB transaction cascades:** Use Dexie's atomic `db.transaction('rw', [db.walks, db.entries, db.notes], async () => { ... })` for walk deletion and data wipe.

---

## Common Pitfalls

1. **Blob memory leakage during ZIP export:** Storing all photos and audio in memory simultaneously before zipping can exceed memory limits if a user has hundreds of photos.
   *Mitigation:* Iterate entries sequentially, loading Blob from Dexie, appending to JSZip, and releasing references.
2. **Image Blob format in Dexie:** Dexie stores photos either as native `Blob` objects or string URLs. Ensure `export.ts` checks `typeof photo === 'string'` (e.g. data URL or object URL) vs `instanceof Blob` and safely extracts binary ArrayBuffers.
3. **Invalid filename characters in Obsidian Wiki-links:** Obsidian file paths cannot contain `: / \ ? * < > " |`.
   *Mitigation:* Sanitize species titles: `title.replace(/[/\\?%*:|"<>]/g, '-').trim()`.
4. **Referential integrity when deleting a walk:** When a user deletes a walk session, removing `walkId` from `entries` would orphan them unless handled.
   *Mitigation:* D-12 provides the choice: preserve confirmed finds by setting `walkId: 'independent'` or purge associated entries.

---

## Validation Architecture

Nyquist validation plan for Phase 5 verification:

1. **Unit / Pure Logic Verification:**
   - Deterministic Hunt Generator (`lib/hunt.ts`): Verify that calling `getDailyHunt('2026-10-08')` produces identical targets across repeated invocations.
   - ZIP Export Structure (`lib/export.ts`): Verify that generated ZIP contains required root files (`treads-backup.json`), `/Walks/`, `/Species/`, and `/Media/`.
2. **Dexie Reactive Queries:**
   - Verify `useLiveQuery` reflects confirmed find count updates in `/collection` without requiring manual page reload.
   - Verify `useLiveQuery` reflects completed walk additions in `/journal`.
3. **Safety Gate Verification:**
   - Verify `/settings` "Delete All Data" requires typing "DELETE" and completely empties all Dexie tables.
4. **Obsidian Import Verification:**
   - Inspect markdown output for valid YAML frontmatter delimiters (`---`), proper wiki-link formatting (`[[...]]`), and embedded media syntax (`![[...]]`).

