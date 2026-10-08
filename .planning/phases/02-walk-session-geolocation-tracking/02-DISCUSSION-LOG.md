# Phase 2: Walk Session & Geolocation Tracking - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-10-08
**Phase:** 2-Walk Session & Geolocation Tracking
**Areas discussed:** Walk Session UI & HUD Layout, GPS Jitter & Weak Signal UX, Map Camera & Trail Navigation, End Walk Flow & Summary Modal

---

## Walk Session UI & HUD Layout

| Option | Description | Selected |
|--------|-------------|----------|
| Full-screen Map with floating glassmorphism HUD | Full-screen Map with floating glassmorphism HUD pills (timer, distance) and bottom action bar (End Walk, capture trigger) — max outdoor readability | ✓ |
| Split view | Split view with top half map and bottom half stats card / control panel — structured traditional layout | |
| You decide | Implement best mobile-first layout following Tangerin Dream tokens | |

**User's choice:** Full-screen Map with floating glassmorphism HUD pills (timer, distance) and bottom action bar
**Notes:** Maximizes map screen real estate and spatial immersion while walking outdoors.

| Option | Description | Selected |
|--------|-------------|----------|
| Elapsed duration, distance, and GPS signal status | Elapsed duration (MM:SS), distance in meters/km, and GPS signal status chip (e.g., Live / Searching) | ✓ |
| Minimalist | Minimalist duration and distance only — zero extra indicators | |
| Expanded stats | Duration, distance, walking pace (min/km), and species count pill | |
| You decide | Flexible metrics selection | |

**User's choice:** Elapsed duration (MM:SS), distance in meters/km, and GPS signal status chip
**Notes:** Provides vital live feedback on tracking quality without overwhelming the outdoor interface.

| Option | Description | Selected |
|--------|-------------|----------|
| Interactive map with floating 'Start Walk' card | Interactive map centered on current location with floating bottom card: 'Start Walk' button and walk mode badge | ✓ |
| Resource-saver view | Clean pre-walk card prompting 'Start Walk'; MapLibre initializes only when walk begins | |
| You decide | Pre-walk landing experience | |

**User's choice:** Interactive map centered on current location with floating bottom card: 'Start Walk' button and walk mode badge
**Notes:** Pre-initializes the map and GPS fix so starting the walk is seamless and immediate.

| Option | Description | Selected |
|--------|-------------|----------|
| Seamless auto-restoration with toast | Seamless automatic restoration with a brief toast ('Active walk resumed') and camera fly-to current point | ✓ |
| Session recovery banner | Session recovery banner at the top with walk start timestamp and explicit 'Resume' confirmation | |
| Silent instant resume | Silent instant resume with zero notification | |
| You decide | Auto-resume notification approach | |

**User's choice:** Seamless automatic restoration with a brief toast ('Active walk resumed') and camera fly-to current point
**Notes:** Unobtrusive and resilient when switching apps, taking native photos, or recovering from tab crashes.

---

## GPS Jitter & Weak Signal UX

| Option | Description | Selected |
|--------|-------------|----------|
| Subtle amber status chip in HUD | Subtle amber status chip in HUD ('Weak GPS ±Xm') while quietly pausing breadcrumb recording until accuracy improves | ✓ |
| Persistent top notification banner | Persistent top notification banner explaining that GPS accuracy has dropped with troubleshooting hint | |
| Silent filtering | Quietly skip inaccurate points without disturbing user | |
| You decide | Weak GPS behavior | |

**User's choice:** Subtle amber status chip in HUD ('Weak GPS ±Xm') while quietly pausing breadcrumb recording until accuracy improves
**Notes:** Avoids polluting the polyline with noisy spikes (> 35m) while transparently signaling GPS quality.

| Option | Description | Selected |
|--------|-------------|----------|
| Don't append duplicate jitter points while stationary | Don't append duplicate jitter points to the trail polyline while stationary; maintain last known point and update active timestamp | ✓ |
| Append stationary heartbeat points | Append stationary heartbeat points every 15s to Dexie, but visually collapse them in the map polyline | |
| Strict displacement only | Never append any point unless displacement >= 5m | |
| You decide | Stationary stop point recording | |

**User's choice:** Don't append duplicate jitter points to the trail polyline while stationary; maintain last known point and update active timestamp
**Notes:** Prevents messy spiderweb loops on the trail when users stop to observe plants or snap pictures.

| Option | Description | Selected |
|--------|-------------|----------|
| Connect background gap continuously | Connect the background gap continuously to the new fix and recalculate cumulative distance via Haversine formula | ✓ |
| Distinct dashed line | Render the gap as a distinct dashed line labeled 'background segment' | |
| Prompt user on foreground return | Ask user if they want to stitch or split path | |
| You decide | Gap handling | |

**User's choice:** Connect the background gap continuously to the new fix and recalculate cumulative distance via Haversine formula
**Notes:** Handles OS mobile browser throttling gracefully upon reopening the app.

| Option | Description | Selected |
|--------|-------------|----------|
| Keep walk active with actionable re-enable alert | Keep walk active, show an actionable top alert with 'Re-enable Location' trigger, and preserve all prior track points | ✓ |
| Auto-pause walk timer | Auto-pause the walk timer and display dismissible dialog | |
| Auto-finalize walk | Automatically finalize and end session | |
| You decide | Permission loss handling | |

**User's choice:** Keep walk active, show an actionable top alert with 'Re-enable Location' trigger, and preserve all prior track points
**Notes:** Resilient against OS battery saver turning off GPS temporarily.

---

## Map Camera & Trail Navigation

| Option | Description | Selected |
|--------|-------------|----------|
| Auto-follow with pan unlock & Recenter FAB | Auto-follow camera by default; dragging the map pauses follow-mode and displays a floating 'Recenter' button | ✓ |
| Locked follow camera | Map always keeps user at center and cannot be panned away | |
| Free camera | User controls viewport manually | |
| You decide | Camera follow logic | |

**User's choice:** Auto-follow camera by default; dragging the map pauses follow-mode and displays a floating 'Recenter' button
**Notes:** Industry standard outdoor navigation UX (Google Maps / Strava pattern).

| Option | Description | Selected |
|--------|-------------|----------|
| Tangerin Dream themed marker with beacon & heading | Tangerin Dream themed marker: terracotta/orange dot with subtle pulsing beacon ring and heading arrow if available | ✓ |
| Standard blue dot | Standard platform blue dot with semi-transparent GPS accuracy circle | |
| Minimal static dot | Static dot without continuous animation | |
| You decide | Marker aesthetic | |

**User's choice:** Tangerin Dream themed marker: terracotta/orange dot with subtle pulsing beacon ring and heading arrow if available
**Notes:** High visual polish aligning with Tangerin Dream design identity.

| Option | Description | Selected |
|--------|-------------|----------|
| Terracotta polyline with 'Approximate path' pill | Terracotta brand color polyline (4px width, rounded joints) with a subtle 'Approximate path' micro-legend pill in map corner | ✓ |
| Dashed hiking-trail line | Dashed trail line mimicking topographic maps | |
| Thin minimalist solid stroke | Thin minimalist solid stroke (2px) | |
| You decide | Trail styling | |

**User's choice:** Terracotta brand color polyline (4px width, rounded joints) with a subtle 'Approximate path' micro-legend pill in map corner
**Notes:** Clearly visualizes the tracked path and satisfies GPS-02 transparency requirements.

| Option | Description | Selected |
|--------|-------------|----------|
| Floating right thumb-accessible control stack | Clean floating thumb-accessible control stack on right edge: Recenter button, Zoom +/- buttons, and North compass reset | ✓ |
| Default MapLibre controls | Standard top-right MapLibre navigation widget | |
| Touch gestures only | Touch gestures only with single Recenter FAB | |
| You decide | On-screen controls | |

**User's choice:** Clean floating thumb-accessible control stack on right edge: Recenter button, Zoom +/- buttons, and North compass reset
**Notes:** Optimized for one-handed mobile field operation.

---

## End Walk Flow & Summary Modal

| Option | Description | Selected |
|--------|-------------|----------|
| Hold-to-confirm button / 2-tap confirmation | Hold-to-confirm button or 2-tap confirmation sheet to guard against accidental pocket taps outdoors | ✓ |
| Standard confirmation dialog | Standard confirmation dialog alert with Cancel/Confirm | |
| Single-tap end with 5s Undo | Single-tap end with a 5-second 'Undo' snackbar | |
| You decide | Accidental end guard | |

**User's choice:** Hold-to-confirm button or 2-tap confirmation sheet to guard against accidental pocket taps outdoors
**Notes:** Prevents frustrating accidental stops while moving or handling the phone in outdoors conditions.

| Option | Description | Selected |
|--------|-------------|----------|
| Bottom drawer / modal sheet over map | Bottom drawer / modal sheet over the map with bounding-box fitted trail review and metrics grid (duration, distance, species count) | ✓ |
| Navigate to dedicated /walk/[id] route | Dedicated full-page summary route | |
| Replace map view in-place | In-place card replacing the map | |
| You decide | Summary presentation | |

**User's choice:** Bottom drawer / modal sheet over the map with bounding-box fitted trail review and metrics grid (duration, distance, species count)
**Notes:** Retains spatial map context behind the completion drawer, letting users immediately admire their completed route.

| Option | Description | Selected |
|--------|-------------|----------|
| Prompt 'Discard Walk' vs 'Save Anyway' for short walks | If under 1 minute or under 25 meters, prompt 'Discard Walk' vs 'Save Anyway' to prevent cluttering Dexie history | ✓ |
| Save all sessions unconditionally | Save all initiated sessions unconditionally | |
| Auto-discard micro-sessions | Silently discard sessions under 30s | |
| You decide | Short walk handling | |

**User's choice:** If under 1 minute or under 25 meters, prompt 'Discard Walk' vs 'Save Anyway' to prevent cluttering Dexie history
**Notes:** Keeps the journal clean when users accidentally start or quickly test the walk feature.

| Option | Description | Selected |
|--------|-------------|----------|
| 'Done' button resets /walk with link to Journal | 'Done' button closes summary and resets /walk back to the ready-to-start state (with a link to 'View in Journal') | ✓ |
| Navigate directly to /journal | Direct redirect to journal page | |
| Keep summary open | Keep summary open on /walk until user navigates | |
| You decide | Post-summary flow | |

**User's choice:** 'Done' button closes summary and resets /walk back to the ready-to-start state (with a link to 'View in Journal')
**Notes:** Leaves user in control of whether to review past entries in Journal or prepare for another walk.

---

## the agent's Discretion

- Kalman / rolling window heading calculation parameters for smooth heading arrow transitions.
- Backdrop-blur and border highlights for glassmorphism HUD pills.
- Bounding-box padding coordinates when fitting completed trail inside MapLibre.

## Deferred Ideas

None — all discussion focused on Phase 2 scope.
