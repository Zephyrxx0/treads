# Phase 1: Foundation, Theme & Day 1 Verification Spikes - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-10-08
**Phase:** 1-Foundation, Theme & Day 1 Verification Spikes
**Areas discussed:** Day 1 Spikes Architecture, Dexie Schema & Seed Data, Base UI & Theme Persistence, Eval Harness Fixtures Setup

---

## Day 1 Spikes Architecture

### Question 1: Where and how should the Day 1 verification spikes (AI Studio & MapLibre) be executed?

| Option | Description | Selected |
|--------|-------------|----------|
| Both API routes and visual playground | API routes (`/api/spike/*`) with an interactive visual playground page at `/spike` showing live MapLibre map and AI test runner | ✓ |
| Visual playground only | Route at `/spike` with in-browser MapLibre view and client-triggered AI Studio verification | |
| Headless API endpoints only | Test purely via API routes (`/api/spike/ai`, `/api/spike/map`) without dedicated playground UI | |

**User's choice:** Both: API routes (/api/spike/*) with an interactive visual playground page at /spike showing live MapLibre map and AI test runner

### Question 2: How should the AI spike handle local environments where GOOGLE_GENERATIVE_AI_API_KEY is not yet configured?

| Option | Description | Selected |
|--------|-------------|----------|
| Auto-detect key | Execute real Google AI Studio call if `GOOGLE_GENERATIVE_AI_API_KEY` is present, return mock candidate fixture with warning banner if missing | ✓ |
| Strict error | Fail with detailed diagnostic setup instructions if API key is missing | |
| Always mock | Mock unless explicitly enabled via URL query param or dev toggle | |

**User's choice:** Auto-detect key: execute real Google AI Studio call if GOOGLE_GENERATIVE_AI_API_KEY is present, return mock candidate fixture with warning banner if missing

### Question 3: How should the MapLibre OpenFreeMap spike verify tile and style connectivity?

| Option | Description | Selected |
|--------|-------------|----------|
| Interactive canvas with load telemetry | Render OpenFreeMap Liberty style, listen to map 'load' event, and display style load latency & tile status badge | ✓ |
| Simple interactive map | Mount MapLibre and display the map visually without telemetry | |
| Hidden container test | Invisible test with console log verification only | |

**User's choice:** Interactive canvas with load telemetry: render OpenFreeMap Liberty style, listen to map 'load' event, and display style load latency & tile status badge

---

## Dexie Schema & Seed Data

### Question 1: What primary key strategy should be used across the Dexie tables?

| Option | Description | Selected |
|--------|-------------|----------|
| String UUIDs | `crypto.randomUUID()` for walks, entries, notes, speechCache, and explicit key for settings (`'user_settings'`) | ✓ |
| Auto-increment integers | `++id` for walks, entries, notes, with string keys for settings and cache | |
| ULID / NanoID | Time-sortable timestamps | |

**User's choice:** String UUIDs (crypto.randomUUID()) for walks, entries, notes, speechCache, and explicit key for settings (e.g. 'user_settings') — optimal for export/sync stability

### Question 2: How should mock seed data and database reset capabilities be provided in Phase 1?

| Option | Description | Selected |
|--------|-------------|----------|
| Manual dev controls | Provide `seedDatabase()` and `clearDatabase()` utilities with triggers on `/spike` and `/eval` | ✓ |
| Auto-seed on empty | Populate 1 sample walk with 2 specimen entries automatically if Dexie is empty in dev | |
| Zero seed data | Leave tables empty, relying entirely on real capture/tracking workflows | |

**User's choice:** Manual dev controls: provide seedDatabase() and clearDatabase() utilities with triggers on /spike and /eval for controlled testing

### Question 3: Should Dexie schema define secondary indexes for future timeline and collection queries upfront in Phase 1?

| Option | Description | Selected |
|--------|-------------|----------|
| Front-load indexes in v1 schema | Indexed `startedAt`, `endedAt` on walks; `walkId`, `timestamp`, `verified` on entries; `walkId` on notes | ✓ |
| Minimal index now | Index primary keys only (`id`), adding composite/secondary indexes in later phases | |

**User's choice:** Index key query fields up-front in v1 schema: indexed startedAt, endedAt on walks; walkId, timestamp, verified on entries; walkId on notes

---

## Base UI & Theme Persistence

### Question 1: How should the Tangerin Dream theme (light/dark/system) state and persistence be handled?

| Option | Description | Selected |
|--------|-------------|----------|
| localStorage + inline script + Dexie sync | `localStorage` with inline head script (zero flash-of-unstyled-content) + sync to Dexie settings table | ✓ |
| localStorage only | Keep theme strictly in client `localStorage` via next-themes or lightweight script | |
| Dexie settings table only | Read theme asynchronously from IndexedDB on mount | |

**User's choice:** localStorage with inline head script (zero flash-of-unstyled-content) + sync to Dexie settings table

### Question 2: Which shadcn / Base UI components should be scaffolded in Phase 1?

| Option | Description | Selected |
|--------|-------------|----------|
| Full library suite & no scratch comps | Everything from comp libraries (`shadcn` Base UI, `@toggles/within`, devl.dev), never build from scratch; request missing components from user | ✓ |
| Essential set | button, card, dialog, badge, sheet, sonner toast, theme-toggle | |
| Minimal set | button, card, theme-toggle | |

**User's choice:** Everything, dont make comps from scratch, use from comp libraries, if not available, drop me a request for it, and i;ll find it

---

## Eval Harness Fixtures Setup

### Question 1: Where and how should the benchmark evaluation fixtures be structured for /eval in Phase 1?

| Option | Description | Selected |
|--------|-------------|----------|
| In-repo fixtures folder | `public/eval-fixtures/` with `fixtures.json` manifest defining category, expected taxon, and refusal flags | ✓ |
| Purely JSON/base64 mock payloads | Inlined fixtures without raw image files in Phase 1 | |
| Remote image URLs | Referenced via external links in manifest | |

**User's choice:** In-repo fixtures folder (public/eval-fixtures/ or tests/fixtures/) with fixtures.json manifest defining category, expected taxon, and refusal flags

### Question 2: What capability should the /eval dashboard UI deliver in Phase 1?

| Option | Description | Selected |
|--------|-------------|----------|
| Interactive benchmark dashboard | Visual fixture cards grid with 'Run Batch' button, progress bar, and metrics summary (accuracy, refusal, latency) | ✓ |
| Read-only fixtures viewer | Show fixture images and ground-truth metadata, defer batch execution runner | |
| Headless API endpoint | `/api/eval` with minimal text report | |

**User's choice:** Interactive benchmark dashboard on /eval: visual fixture cards grid with 'Run Batch' button, progress bar, and metrics summary (accuracy, refusal, latency)

---

## the agent's Discretion

- Selection of open-domain CC0 specimen test images (Quercus alba leaf, Passer domesticus, Coccinella septempunctata, ceramic mug, human portrait).
- Exact dev rate limiter token refill frequency and in-memory cache TTL.

## Deferred Ideas

None — discussion remained within Phase 1 scope.
