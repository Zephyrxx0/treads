# Phase 2: Walk Session & Geolocation Tracking - Research

**Researched:** 2026-10-08
**Domain:** Mobile Geolocation, MapLibre GL Trail Rendering, Dexie Session Lifecycle
**Confidence:** HIGH

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- **D-01:** Full-screen MapLibre viewport with floating glassmorphism HUD pills (MM:SS timer, meters/km distance counter, GPS signal status chip) and bottom floating action dock with Tangerin Dream styling.
- **D-02:** Live metrics displayed in top HUD: elapsed duration (MM:SS), distance in meters/km, and GPS signal status chip (e.g. Live / Searching / Weak).
- **D-03:** Pre-walk state on `/walk` displays live interactive map centered on current location with a floating bottom card containing "Start Walk" button and walk mode badge.
- **D-04:** Auto-resumed walk sessions (upon tab reload or return from background) seamlessly restore tracking state with a brief toast notification ("Active walk resumed") and camera fly-to latest GPS fix.
- **D-05:** Subtle amber status chip in HUD ("Weak GPS ±Xm") when accuracy degrades beyond 35m, quietly pausing breadcrumb recording until accuracy improves to prevent noisy jumps.
- **D-06:** Stationary stops (observing wildlife/photos) do not append duplicate jitter points to the trail polyline; system maintains last known coordinates and updates active walk timestamp.
- **D-07:** Resuming from background throttling connects the gap continuously to the newly acquired GPS fix and updates cumulative distance via Haversine formula calculation.
- **D-08:** GPS permission revocation or loss mid-walk keeps session active, showing an actionable top alert with "Re-enable Location" trigger and preserving all prior track points safely.
- **D-09:** Camera auto-follows user location marker by default; user panning/dragging pauses follow-mode and displays a floating "Recenter" button to re-engage tracking.
- **D-10:** Current location marker styled with Tangerin Dream terracotta/orange dot, subtle pulsing beacon ring, and heading arrow if device orientation is available.
- **D-11:** Breadcrumb trail rendered as a terracotta brand color polyline (4px width, rounded joints) accompanied by a subtle "Approximate path" micro-legend pill in the map corner.
- **D-12:** Floating thumb-accessible control stack positioned on the right edge: Recenter button, Zoom +/- buttons, and North compass reset.
- **D-13:** Hold-to-confirm button or 2-tap confirmation sheet guards against accidental walk termination while outdoors.
- **D-14:** Walk summary presented as a bottom drawer / modal sheet over the map with bounding-box fitted trail review and metrics grid (duration, distance, confirmed species count placeholder).
- **D-15:** Short/empty walks (< 1 minute or < 25 meters) prompt "Discard Walk" vs "Save Anyway" to prevent cluttering Dexie walk history.
- **D-16:** Primary "Done" action on summary card closes the sheet and resets `/walk` back to the pre-walk ready state, with a secondary link to "View in Journal".

### the agent's Discretion
- Mathematical Kalman / rolling average smoothing parameters for heading calculation.
- Exact styling details for the glassmorphism backdrop-blur and border highlights in HUD pills.
- Bounding-box padding coordinates when fitting completed trail in the summary drawer.

### Deferred Ideas (OUT OF SCOPE)
None — discussion stayed within Phase 2 scope.
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| WALK-01 | User can start a new walk session from `/walk` with a single tap, generating a unique session in IndexedDB. | `useActiveWalk` hook initializes a Dexie record in `db.walks` with string UUID `id`, `startedAt: Date.now()`, `endedAt: null`, `mode: 'free'`, `trackPoints: []`, `distance: 0`. |
| WALK-02 | Active walk automatically resumes if the browser tab is reloaded, backgrounded, or restored after camera use (`endedAt == null`). | Dexie live query / initial fetch locates active walk `where('endedAt').equals(null)`. State restores polyline, elapsed time calculated as `Date.now() - startedAt`. |
| WALK-03 | User can end a walk to see a summary card displaying duration, distance, and confirmed species count. | Hold-to-end action sets `endedAt: Date.now()`, fits trail bounding box via `map.fitBounds()`, and opens Base UI `Sheet` summary with metrics grid. |
| GPS-01 | App tracks foreground GPS position, applying noise filtering (reject accuracy > 35m, ignore displacement < 5m unless 15s elapsed). | `useGeolocation` implements `watchPosition` with high accuracy, filtering out `accuracy > 35` and points where Haversine distance < 5m unless `timestamp - lastTimestamp > 15000`. |
| GPS-02 | Capture pins and breadcrumb trail are saved to the active walk record and labeled as "approximate path". | Live track points append to active walk in Dexie and update MapLibre GeoJSON Source in real time, with an "Approximate path" micro-legend pill. |
| MAP-01 | MapLibre GL renders vector map using OpenFreeMap tiles (`liberty` style) centered on the user. | `MapLibreMap` initialized with style `https://tiles.openfreemap.org/styles/liberty`, dynamic client-side loading to prevent SSR crashes. |
| MAP-02 | Map displays custom SVG markers for each capture categorized by organism kind. | Scaffold GeoJSON layer / DOM markers structure ready for Phase 3 captures; user position marker styled with Tangerin Dream terracotta beacon. |
</phase_requirements>

## Summary

Phase 2 builds the core outdoor walk tracking engine for Treads. It combines three critical layers:
1. **Foreground Geolocation Engine (`useGeolocation`)**: Captures real-time GPS coordinates via `navigator.geolocation.watchPosition` with high accuracy. In mobile outdoor field conditions, GPS readings frequently suffer from multipath reflection and urban canyon jitter. We apply two-tier noise suppression: discarding fixes where accuracy exceeds 35 meters, and ignoring stationary displacement under 5 meters unless 15 seconds have elapsed without an update.
2. **Persistent Walk Lifecycle (`useActiveWalk`)**: Guarantees zero session loss when users switch browser tabs, take photos with native camera apps, or suffer mobile OS background memory evictions. An active walk is marked by `endedAt === null` in Dexie IndexedDB. When restored, the timer smoothly continues from `startedAt`, the full breadcrumb trail polyline is rehydrated into the map, and distance continues accumulating.
3. **MapLibre GL Vector Trail Map (`WalkMap`)**: Loads OpenFreeMap's zero-cost, no-key vector tiles (`https://tiles.openfreemap.org/styles/liberty`). Renders the user's location puck with a pulsing terracotta beacon and orientation arrow, maintains a smooth GeoJSON `LineString` trail polyline, and offers thumb-friendly controls (Recenter FAB, Zoom, Compass) alongside an accidental-tap guarded "End Walk" trigger.

**Primary recommendation:** Decouple GPS polling and Dexie persistence using an in-memory accumulation buffer and debounced writes (`3000ms` or on critical lifecycle events) to preserve 60fps vector map panning while guaranteeing crash resilience.

---

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| GPS Coordinate Acquisition | Browser / Client | — | `navigator.geolocation` API is purely client-side; foreground permissions managed on device. |
| Noise & Accuracy Filtering | Browser / Client | — | Filter functions evaluate accuracy thresholds (<35m) and displacement (>5m) in memory before appending points. |
| Walk Session Persistence | Client (IndexedDB / Dexie) | — | Offline-first mandate (CONS-02); all tracking data stored locally in Dexie `db.walks`. |
| Vector Map Rendering | Browser / Client (WebGL/WebGPU) | OpenFreeMap Tile CDN | MapLibre GL renders vector vector tiles directly on client GPU using free static vector tile endpoints. |
| Bounding Box & Route Calculations | Browser / Client | — | Haversine formula and GeoJSON bounds computation run locally in utility modules. |

---

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `maplibre-gl` | ^6.13.0 | Vector tile map rendering | [VERIFIED: package.json] Open-source fork of Mapbox GL, WebGL-accelerated, zero API key requirement with OpenFreeMap. |
| `dexie` | 4.4.6 | Client-side IndexedDB wrapper | [VERIFIED: package.json] Established in Phase 1 (`lib/db.ts`); typed schemas, live react query hooks, crash recovery. |
| `dexie-react-hooks` | ^4.4.0 | Live reactive queries for Dexie | [VERIFIED: package.json] Enables automatic re-rendering of active walk sessions across tab reloads. |
| `lucide-react` | ^1.52.0 | Outdoor navigation icons | [VERIFIED: package.json] Standard icon suite for MapPin, Navigation, Compass, Plus, Minus, Check, Play, Square. |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `@base-ui-components/react` | 1.0.0-rc.0 | Accessible UI primitives | Used for Sheet (summary drawer) and Dialog (discard prompt). |
| `clsx` / `tailwind-merge` | ^2.1.1 / ^3.7.0 | Dynamic CSS class merging | Used for responsive floating HUD pills and status badges. |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| `maplibre-gl` | Leaflet | Leaflet uses raster tiles by default; MapLibre GL renders smooth vector tiles with continuous zooming and GPU rotation. |
| Pure Haversine formula | Turf.js (`@turf/distance`) | Turf adds 150KB bundle weight; Haversine formula is 10 lines of pure TypeScript with zero overhead. |

---

## Package Legitimacy Audit

No new packages are being installed. All dependencies (`maplibre-gl`, `dexie`, `dexie-react-hooks`, `lucide-react`) were verified and installed during Phase 1.

| Package | Registry | Installed Version | Status |
|---------|----------|-------------------|--------|
| `maplibre-gl` | npm | 6.13.0 | [VERIFIED: package.json] Approved |
| `dexie` | npm | 4.4.6 | [VERIFIED: package.json] Approved |
| `dexie-react-hooks` | npm | 4.4.0 | [VERIFIED: package.json] Approved |

---

## Architecture Patterns

### Data Flow & Lifecycle Diagram

```
User visits /walk
       │
       ▼
Check Dexie: db.walks.where('endedAt').equals(null)
       │
   ┌───┴────────────────────────┐
   ▼                            ▼
[No active walk]         [Active walk found]
Render Pre-walk Map      Restore active walk state
Show "Start Walk" Card   Toast "Active walk resumed"
                         Fly camera to last trackPoint
       │                                │
       ▼                                ▼
User taps "Start Walk"   Resume/Start navigator.geolocation.watchPosition
       │                                │
       └────────────────►───────────────┘
                                │
               ┌────────────────┴────────────────┐
               ▼                                 ▼
      Accuracy > 35m ?                  Displacement < 5m ?
     (Reject & show amber HUD)          (Check timestamp > 15s)
               │                                 │
               └─────────► Valid Point ◄─────────┘
                                │
                                ├── Update in-memory trail state
                                ├── Append to MapLibre GeoJSON Source
                                ├── Accumulate Haversine distance
                                └── Debounced write to Dexie db.walks
                                │
                                ▼
                       User taps "End Walk"
                    (Hold to confirm protection)
                                │
                                ├── Set endedAt: Date.now()
                                ├── Flush Dexie db.walks
                                ├── map.fitBounds(trailBounds)
                                └── Open Summary Drawer
```

### Pattern 1: GPS Noise & Stationary Jitter Filtering

```typescript
// Pure function for Haversine distance in meters
export function calculateHaversineDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371e3; // Earth radius in meters
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}

export interface TrackPoint {
  lat: number;
  lng: number;
  accuracy: number;
  timestamp: number;
}

export function shouldRecordPoint(
  newPoint: TrackPoint,
  lastPoint: TrackPoint | null
): boolean {
  // Rule 1: Reject accuracy > 35m
  if (newPoint.accuracy > 35) {
    return false;
  }

  if (!lastPoint) {
    return true;
  }

  const distanceMeters = calculateHaversineDistance(
    lastPoint.lat,
    lastPoint.lng,
    newPoint.lat,
    newPoint.lng
  );

  const timeElapsedMs = newPoint.timestamp - lastPoint.timestamp;

  // Rule 2: Ignore displacement < 5m unless 15s elapsed
  if (distanceMeters < 5 && timeElapsedMs < 15000) {
    return false;
  }

  return true;
}
```

### Pattern 2: MapLibre Client-Side Dynamic Import & GeoJSON Layer

```typescript
// Dynamic client-side mounting prevents SSR 'window is not defined' errors
const maplibreglModule = await import('maplibre-gl');
const maplibregl = maplibreglModule.default || maplibreglModule;

map.on('load', () => {
  // 1. Add GeoJSON source for trail line
  map.addSource('walk-trail', {
    type: 'geojson',
    data: {
      type: 'Feature',
      properties: {},
      geometry: {
        type: 'LineString',
        coordinates: coordinatesArray, // [[lng, lat], ...]
      },
    },
  });

  // 2. Add layer with Tangerin Dream terracotta styling
  map.addLayer({
    id: 'walk-trail-layer',
    type: 'line',
    source: 'walk-trail',
    layout: {
      'line-join': 'round',
      'line-cap': 'round',
    },
    paint: {
      'line-color': '#F35C2B', // Terracotta primary
      'line-width': 4,
      'line-opacity': 0.9,
    },
  });
});
```

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Map Tile Server | Self-hosted vector tile pipeline | OpenFreeMap Liberty style (`https://tiles.openfreemap.org/styles/liberty`) | Zero setup, open-source, fast global CDN, no API key required. |
| IndexedDB Schema & Queries | Raw `indexedDB.open()` | `dexie` (`db.walks`) | Handles version migrations, transactions, and React reactivity without race conditions. |
| Geodesic Distance | Euclidean Pythagorean approximation | Haversine formula | Euclidean approximation distorts significantly over longitude at mid-to-high latitudes. |

---

## Common Pitfalls

### Pitfall 1: Next.js SSR Crash on MapLibre Import
**What goes wrong:** Next.js attempts to pre-render the map component on the server during build, throwing `ReferenceError: window is not defined` or canvas errors.  
**Why it happens:** MapLibre GL directly references WebGL, `window`, and `document`.  
**How to avoid:** Use Next.js dynamic import with `ssr: false` (`dynamic(() => import('@/components/map/walk-map'), { ssr: false })`) or dynamic `await import('maplibre-gl')` inside `useEffect`.

### Pitfall 2: High-Frequency IndexedDB Write Bottleneck
**What goes wrong:** Appending to Dexie on every raw GPS update causes UI stutter during panning and high battery consumption.  
**Why it happens:** `watchPosition` can fire multiple times per second on modern phones.  
**How to avoid:** Buffer track points in React state / ref and write to Dexie via debounced updates (every 3 seconds or on critical state changes like walk pause/end).

### Pitfall 3: Tab Background Throttling Disconnecting Paths
**What goes wrong:** When users lock their phone or switch to the camera app, mobile browsers throttle timers and Geolocation watch streams. When resuming, the app creates a disconnected jump.  
**Why it happens:** OS limits background CPU execution in WebKit and Chromium.  
**How to avoid:** Upon tab focus (`visibilitychange`), re-query `getCurrentPosition`, compute Haversine distance from the last known fix, append the new fix to the trail, and smoothly animate camera (`flyTo`).

---

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | tsx / Vitest test scripts |
| Quick run command | `pnpm tsx scripts/test-geolocation-filter.ts` |
| Full suite command | `pnpm build` |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| GPS-01 | Rejects accuracy > 35m and stationary displacement < 5m unless 15s elapsed | unit | `pnpm tsx scripts/test-geolocation-filter.ts` | ❌ Wave 0 Gap |
| WALK-01 | Initializes walk session in Dexie with UUID, start timestamp, and zero metrics | unit | `pnpm tsx scripts/test-active-walk.ts` | ❌ Wave 0 Gap |
| WALK-02 | Auto-resumes active walk on reload (`endedAt == null`) | unit | `pnpm tsx scripts/test-active-walk.ts` | ❌ Wave 0 Gap |
| MAP-01 | MapLibre renders OpenFreeMap tile style | integration | `pnpm build` (compilation verification) | ✅ |

### Wave 0 Gaps
- [ ] `scripts/test-geolocation-filter.ts` — Tests GPS accuracy and displacement threshold filters.
- [ ] `scripts/test-active-walk.ts` — Tests Dexie `walks` initialization, point addition, and auto-resume query.

---

## Security Domain

### Applicable ASVS Categories
| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V5 Input Validation | yes | Validate GPS coordinates range (-90..90 lat, -180..180 lng) before saving to Dexie. |
| V3 Session Management | yes | Walk session UUID generated via `crypto.randomUUID()`. |
| Privacy Gate | yes | Geolocation tracking gated behind user consent (`useConsent`). Coordinates never transmitted to remote server. |

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — maplibre-gl, dexie, and OpenFreeMap already verified in Phase 1.
- Architecture: HIGH — GPS noise filtering and debounced IndexedDB writes are well-established mobile web patterns.
- Pitfalls: HIGH — SSR and background throttling mitigations tested and documented.

**Research date:** 2026-10-08  
**Valid until:** 2026-11-08

