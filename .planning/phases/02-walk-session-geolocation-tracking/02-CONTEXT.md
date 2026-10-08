# Phase 2: Walk Session & Geolocation Tracking - Context

**Gathered:** 2026-10-08
**Status:** Ready for planning

<domain>
## Phase Boundary

Phase 2 delivers the outdoor walk tracking engine with resilient session recovery, GPS jitter suppression, and interactive MapLibre trail mapping. Key deliverables include the `/walk` interface with active walk lifecycle management (Start, Auto-resume, Hold-to-End), foreground Geolocation tracking with noise filtering (rejecting accuracy > 35m, suppressing stationary jitter), OpenFreeMap Liberty style vector rendering with user location beacon and terracotta trail polyline, and a completion summary drawer displaying duration, distance, and confirmed species metrics.

</domain>

<decisions>
## Implementation Decisions

### Walk Session UI & HUD Layout
- **D-01:** Full-screen MapLibre viewport with floating glassmorphism HUD pills (MM:SS timer, meters/km distance counter, GPS signal status chip) and bottom floating action dock with Tangerin Dream styling. — **Reversibility:** reversible
- **D-02:** Live metrics displayed in top HUD: elapsed duration (MM:SS), distance in meters/km, and GPS signal status chip (e.g. Live / Searching / Weak). — **Reversibility:** reversible
- **D-03:** Pre-walk state on `/walk` displays live interactive map centered on current location with a floating bottom card containing "Start Walk" button and walk mode badge. — **Reversibility:** reversible
- **D-04:** Auto-resumed walk sessions (upon tab reload or return from background) seamlessly restore tracking state with a brief toast notification ("Active walk resumed") and camera fly-to latest GPS fix. — **Reversibility:** reversible

### GPS Jitter & Weak Signal UX
- **D-05:** Subtle amber status chip in HUD ("Weak GPS ±Xm") when accuracy degrades beyond 35m, quietly pausing breadcrumb recording until accuracy improves to prevent noisy jumps. — **Reversibility:** reversible
- **D-06:** Stationary stops (observing wildlife/photos) do not append duplicate jitter points to the trail polyline; system maintains last known coordinates and updates active walk timestamp. — **Reversibility:** reversible
- **D-07:** Resuming from background throttling connects the gap continuously to the newly acquired GPS fix and updates cumulative distance via Haversine formula calculation. — **Reversibility:** reversible
- **D-08:** GPS permission revocation or loss mid-walk keeps session active, showing an actionable top alert with "Re-enable Location" trigger and preserving all prior track points safely. — **Reversibility:** reversible

### Map Camera & Trail Navigation
- **D-09:** Camera auto-follows user location marker by default; user panning/dragging pauses follow-mode and displays a floating "Recenter" button to re-engage tracking. — **Reversibility:** reversible
- **D-10:** Current location marker styled with Tangerin Dream terracotta/orange dot, subtle pulsing beacon ring, and heading arrow if device orientation is available. — **Reversibility:** reversible
- **D-11:** Breadcrumb trail rendered as a terracotta brand color polyline (4px width, rounded joints) accompanied by a subtle "Approximate path" micro-legend pill in the map corner. — **Reversibility:** reversible
- **D-12:** Floating thumb-accessible control stack positioned on the right edge: Recenter button, Zoom +/- buttons, and North compass reset. — **Reversibility:** reversible

### End Walk Flow & Summary Modal
- **D-13:** Hold-to-confirm button or 2-tap confirmation sheet guards against accidental walk termination while outdoors. — **Reversibility:** reversible
- **D-14:** Walk summary presented as a bottom drawer / modal sheet over the map with bounding-box fitted trail review and metrics grid (duration, distance, confirmed species count placeholder). — **Reversibility:** reversible
- **D-15:** Short/empty walks (< 1 minute or < 25 meters) prompt "Discard Walk" vs "Save Anyway" to prevent cluttering Dexie walk history. — **Reversibility:** reversible
- **D-16:** Primary "Done" action on summary card closes the sheet and resets `/walk` back to the pre-walk ready state, with a secondary link to "View in Journal". — **Reversibility:** reversible

### the agent's Discretion
- Mathematical Kalman / rolling average smoothing parameters for heading calculation.
- Exact styling details for the glassmorphism backdrop-blur and border highlights in HUD pills.
- Bounding-box padding coordinates when fitting completed trail in the summary drawer.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Architecture & Decisions
- `DECISIONS.md` § Decisions 3, 4, 10 — Consent & privacy gate, continuous Dexie persistence, GPS noise filter, OpenFreeMap tile endpoints
- `PRD.md` § 4.1, § 5.2 — Active walk lifecycle (`/walk`), Dexie IndexedDB `walks` schema, GPS noise filtering criteria
- `.planning/ROADMAP.md` § Phase 2 — Phase 2 goals, dependencies, requirements, and success criteria
- `.planning/REQUIREMENTS.md` § WALK-01..03, GPS-01..02, MAP-01..02 — Locked Phase 2 requirement specifications

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `lib/db.ts`: Initialized Dexie database with typed `walks` table and `trackPoints: Array<{ lat, lng, accuracy, timestamp }>` schema.
- `components/map/spike-map.tsx`: Tested MapLibre GL instance loading OpenFreeMap `liberty` style, with dynamic client-side import pattern and controls setup.
- `components/permissions/permission-notice.tsx` & `lib/permissions.ts`: Tested geolocation permission query and request utilities.
- `components/consent/consent-modal.tsx`: First-run consent gate checking stored consent state.
- `components/ui/`: Existing shadcn Base UI primitives (`Button`, `Card`, `Badge`, `Sheet`, `Dialog`, `Progress`) styled with Tangerin Dream theme variables.

### Established Patterns
- Client-side persistence in Dexie with `crypto.randomUUID()` string keys.
- Next.js dynamic client component imports (`next/dynamic` or `import('maplibre-gl')`) to prevent SSR window/canvas errors.
- Tangerin Dream CSS design tokens (`--color-primary`, terracotta `#F35C2B`, warm dark backgrounds).

### Integration Points
- `app/walk/page.tsx`: New route for walk tracking engine.
- `hooks/use-geolocation.ts`: Custom hook managing `navigator.geolocation.watchPosition` with noise/accuracy filtering.
- `hooks/use-active-walk.ts`: Custom hook managing active walk lifecycle, persistence to Dexie `walks`, and auto-resume.
- `components/map/walk-map.tsx`: Full-screen MapLibre tracking component with user marker and trail polyline layer.

</code_context>

<specifics>
## Specific Ideas

- Floating glassmorphism HUD pills over full-screen map maximizing outdoor visibility.
- Hold-to-confirm termination protection to prevent pocket misfires.
- Micro-legend pill "Approximate path" ensuring transparency regarding GPS drift.
- Smooth camera auto-follow with tap/pan break and instant Recenter FAB.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within Phase 2 scope.

</deferred>

---

*Phase: 2-Walk Session & Geolocation Tracking*
*Context gathered: 2026-10-08*

