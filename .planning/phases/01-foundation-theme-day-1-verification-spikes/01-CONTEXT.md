# Phase 1: Foundation, Theme & Day 1 Verification Spikes - Context

**Gathered:** 2026-10-08
**Status:** Ready for planning

<domain>
## Phase Boundary

Phase 1 establishes the core Next.js 15, React 19, and Tailwind CSS v4 application shell with Tangerin Dream design tokens, shadcn (Base UI) component suite, offline-first Dexie.js database schema (`db.ts`), in-memory dual-mode rate limiter, and executes Day 1 verification spikes (Google AI Studio Gemma candidate extraction with Gemini Flash fallback, MapLibre GL OpenFreeMap tile rendering, and `/eval` harness dashboard shell).

</domain>

<decisions>
## Implementation Decisions

### Day 1 Spikes Architecture
- **D-01:** Deliver both headless API routes (`/api/spike/ai`, `/api/spike/map`) and an interactive visual playground page at `/spike` with MapLibre canvas and AI candidate runner. — **Reversibility:** reversible
- **D-02:** Auto-detect Google AI Studio key: invoke live API if `GOOGLE_GENERATIVE_AI_API_KEY` is present; return mock candidate fixture with warning banner if missing, preventing developer blockage. — **Reversibility:** reversible
- **D-03:** MapLibre OpenFreeMap spike includes load telemetry: mounts OpenFreeMap Liberty style (`https://tiles.openfreemap.org/styles/liberty`), listens to map `load` event, and reports style load latency and tile status badge. — **Reversibility:** reversible

### Dexie Schema & Seed Data
- **D-04:** Use string UUIDs (`crypto.randomUUID()`) for `walks`, `entries`, `notes`, `speechCache`, and an explicit string key (`'user_settings'`) for `settings` table — optimal for export stability and sync consistency. — **Reversibility:** costly — primary key schema changes impact Obsidian export links and data migrations.
- **D-05:** Provide explicit manual dev controls: implement `seedDatabase()` and `clearDatabase()` utilities triggered via buttons on `/spike` and `/eval` for reproducible test data generation. — **Reversibility:** reversible
- **D-06:** Front-load secondary query indexes in v1 schema: indexed `startedAt`, `endedAt` on `walks`; `walkId`, `timestamp`, `verified` on `entries`; `walkId` on `notes`. — **Reversibility:** costly — index adjustments require Dexie version upgrade handlers.

### Base UI & Theme Persistence
- **D-07:** Tangerin Dream theme persistence uses `localStorage` with inline head script (preventing FOUC) and background sync to Dexie `settings` table. — **Reversibility:** reversible
- **D-08:** Complete component suite & strict library-first rule: Do NOT build UI components from scratch. Scaffold required components from component libraries (`shadcn` backed by `@base-ui-components/react`, `@toggles/within`, devl.dev). If a component is missing or unavailable, drop a request to the user to source it. — **Reversibility:** one-way — architectural rule forbidding custom roll-your-own primitives in favor of established library components.

### Eval Harness Fixtures Setup
- **D-09:** Store test fixtures in repo at `public/eval-fixtures/` with a structured `fixtures.json` manifest defining category (plants, birds, insects, non-organisms, people), expected taxon, and refusal flags. — **Reversibility:** reversible
- **D-10:** Interactive benchmark dashboard on `/eval` in Phase 1: visual fixture card grid with "Run Batch" trigger button, progress indicator, and top-3 accuracy / refusal rate / latency metrics summary. — **Reversibility:** reversible

### the agent's Discretion
- Choice of initial CC0 open-domain sample images for test fixtures (e.g. Quercus alba leaf, Passer domesticus, Coccinella septempunctata, ceramic mug, human portrait).
- Exact in-memory LRU cache eviction and token bucket tick interval in dev rate limiter.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Architecture & Decisions
- `DECISIONS.md` — Complete architecture decisions matrix (Decisions 1, 2, 7, 15, 16), library acquisition registry, and environment variables
- `PRD.md` § 4, § 5, § 8 — Full project requirements, Tangerin Dream design tokens, Dexie schema, Day 1 verification spike requirements
- `.planning/ROADMAP.md` § Phase 1 — Phase 1 goals, dependencies, requirements, and success criteria
- `.planning/REQUIREMENTS.md` § CONS-01..04, DSGN-01..02, RATE-01, EVAL-01 — Specific functional requirements locked for Phase 1

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- Fresh repository initialized with Git on branch `phase-1-foundation-spikes`.
- Architectural specifications and component registry documented in `DECISIONS.md`.

### Established Patterns
- Next.js App Router with React 19 and Tailwind CSS v4.
- shadcn component registry backed by `@base-ui-components/react`.
- Dexie.js for client-side persistence with live query hooks (`dexie-react-hooks`).

### Integration Points
- `/spike`: Visual verification route for MapLibre tiles and AI Studio candidate extraction.
- `/eval`: Benchmark dashboard route with batch runner and metrics display.
- `lib/db.ts`: Central Dexie instance exporting schema and tables.
- `app/globals.css`: Tangerin Dream CSS variable tokens.

</code_context>

<specifics>
## Specific Ideas

- User directive: "Everything, dont make comps from scratch, use from comp libraries, if not available, drop me a request for it, and i;ll find it"
- Zero FOUC theme initialization via inline head script reading `localStorage`.
- Auto-detect API key presence in AI spike to keep local development friction-free.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within Phase 1 scope.

</deferred>

---

*Phase: 1-Foundation, Theme & Day 1 Verification Spikes*
*Context gathered: 2026-10-08*
