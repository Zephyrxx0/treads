# Phase 4: Voice Notes, Narration & Loop Routing - Context

**Gathered:** 2026-10-08
**Status:** Ready for planning

<domain>
## Phase Boundary

Phase 4 delivers voice notes recording and transcription on active walks and organism entries, live Web Audio waveform visualization, ElevenLabs Scribe STT with Web Speech fallback, fact card TTS narration with browser speech fallback and text-hash caching, and OpenRouteService pedestrian loop routing (1km, 2km, 3km) with non-intrusive trail overlay and graceful free-form fallbacks.

</domain>

<decisions>
## Implementation Decisions

### Voice Note UI & Attachment Context
- **D-01:** Dual recording triggers — Mic button in the `/walk` bottom control dock attaches voice notes to the active walk session (`walkId`), and an "Add voice note" button on `/entry/[id]` attaches field reflections directly to that specific specimen find (`entryId`).
- **D-02:** Bottom sheet review drawer — When recording ends and transcription completes, a review bottom sheet displays audio playback controls, detected language badge, and editable transcript textarea with "Save Note" and "Discard" actions.
- **D-03:** Map trail audio pins & summary notes reel — Drops a distinct terracotta mic pin at the recording GPS coordinate along the MapLibre trail, and includes a scrollable notes list in the walk completion summary drawer (`walk-summary-sheet.tsx`).
- **D-04:** Compressed audio storage in Dexie — Store compressed audio (WebM/Opus) alongside editable transcript text in the Dexie `notes` table, preserving the authentic spoken voice note for replay while keeping IndexedDB storage light (~30-50KB per 60s note). — **Reversibility:** costly — audio compression format and Dexie blob schema require consistent data handling across export and backup modules.

### Audio Recording Interaction & Waveform
- **D-05:** Unified smart gesture — Short tap toggles hands-free recording on/off (tap to start, tap to stop), while continuous press-and-hold records until finger release.
- **D-06:** 60-second limit & visual timer — A circular terracotta progress ring fills clockwise around the mic button with a live MM:SS counter, shifts to amber warning color at 50s, and automatically finishes & dispatches to transcription at 60.0s.
- **D-07:** Dynamic vertical bar equalizer — Real-time Web Audio `AnalyserNode` frequency bins rendered as 24-32 responsive terracotta bars (`#F35C2B` gradient) with rounded caps, smoothly animated via `requestAnimationFrame`.
- **D-08:** Cancellation & mic permissions — Sliding thumb away during hold-to-record aborts without transcribing; tapping a red trash button while hands-free discards the recording. If microphone access is denied, an inline friendly notice explains how to enable permissions in browser settings.

### TTS Narration & Speech Playback
- **D-09:** Full audio card narration — The fact card "Listen" button narrate the organism name intro ("European Robin, Erithacus rubecula"), summary paragraph, and all numbered grounded facts in a seamless storytelling script.
- **D-10:** Inline fact-card audio pill — Replaces the "Listen" button with an interactive pill containing Play/Pause, scrubbing progress bar, elapsed time, and a 1x/1.2x speed toggle.
- **D-11:** Nature-documentary voice & device fallback — Uses a warm, contemplative ElevenLabs voice preset (nature guide); if unconfigured or offline, seamlessly falls back to browser `speechSynthesis` with an unobtrusive "Device voice" chip.
- **D-12:** Dexie `speechCache` hashing & LRU pruning — Audio clips keyed by SHA-256 hash of `text + voiceId` stored as Blobs with LRU pruning (up to 50 clips or 50MB) for instant offline replay without redundant API costs. — **Reversibility:** costly — cache key hashing algorithm and LRU pruning thresholds define the speech cache contract in IndexedDB.

### Loop Route Suggestion & Map Integration
- **D-13:** Pre-walk start drawer & distance picker — On `/walk` before starting a walk, a drawer lets the user toggle between "Free Walk" and "Loop Route", selecting 1km, 2km, or 3km via segmented pill picker to preview the calculated route geometry on MapLibre before confirming "Start Walk".
- **D-14:** Dashed terracotta guideline with chevrons — Suggested loop rendered as a dashed, semi-transparent terracotta polyline (`#F35C2B` with 0.6 opacity) with subtle directional indicators; the user's live GPS track paints a solid glowing polyline over it as they progress.
- **D-15:** Gentle non-intrusive off-route guidance — No jarring alarms or rerouting penalties; displays a quiet "Off route" badge on the top HUD with a 1-tap "Clear Route" button anytime.
- **D-16:** Graceful ORS fallback with synthetic loop — If `ORS_API_KEY` is missing or network fails, displays a calm banner, generates a synthetic geometric loop around current GPS for visual preview and testing, and provides an instant 1-tap "Start Free Walk" button. — **Reversibility:** costly — route response schema and fallback polyline generator integrate with both server `/api/route` and map renderers.

### the agent's Discretion
- Specific Web Audio `AnalyserNode` FFT size (`fftSize: 64` or `128`) and smoothing time constant (`0.8`) for optimal 60fps mobile responsiveness.
- Exact ElevenLabs voice ID selected for the nature guide narration preset.
- Exact radius math for synthetic circle/cardioid loop generation during dev and offline fallback.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Architecture & Requirements
- `DECISIONS.md` § Decisions 3, 5, 8 — Voice note capture, ElevenLabs Scribe STT fallback, TTS audio caching, OpenRouteService loops
- `PRD.md` § 4.4, § 4.5, § 5.3, § 5.5 — Voice notes, speech playback, pedestrian loop routing, Dexie schema
- `.planning/ROADMAP.md` § Phase 4 — Phase 4 scope, dependencies, requirements, and success criteria
- `.planning/REQUIREMENTS.md` § VOIC-01..03, SPK-01..02, ROUT-01..02 — Locked Phase 4 requirement specifications

### Database & Types
- `lib/db.ts` — `Note`, `SpeechCache`, and `Walk` table schemas and Dexie stores
- `lib/rate-limit.ts` — Rate limiting utility for `/api/transcribe`, `/api/speak`, `/api/route`

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `lib/db.ts`: `db.notes` (`id, walkId, entryId, kind, audio, duration, transcript, language, createdAt`) and `db.speechCache` (`id, textHash, audio, createdAt`) tables are already defined and ready.
- `components/walk/walk-controls.tsx`: Bottom action dock already contains camera capture and can host the microphone button with circular progress ring.
- `components/walk/walk-hud.tsx`: Floating top HUD pills; can host the loop route distance badge and quiet "Off route" status chip.
- `components/map/walk-map.tsx`: Full-screen MapLibre tracking component with GeoJSON trail rendering, ready to add suggested loop source and layer (`walk-route-line`).
- `components/entry/fact-card.tsx`: Fact card component containing the scaffolded "Listen" button ready for the inline audio player pill.
- `components/walk/walk-summary-sheet.tsx`: Walk completion summary drawer ready to display the recorded voice notes list alongside captured species.
- `app/api/spike/speech/route.ts`: Day 1 spike showing ElevenLabs key detection and fallback patterns.

### Established Patterns
- Client-side persistence in Dexie with `crypto.randomUUID()` string keys.
- Next.js 16.4 App Router API routes (`app/api/.../route.ts`) returning JSON with dual-mode rate limiting (`lib/rate-limit.ts`).
- Tangerin Dream CSS variable tokens (`--color-primary`, terracotta `#F35C2B`, warm dark backgrounds).
- Sheet / Dialog drawers from shadcn Base UI for mobile interaction flows.

### Integration Points
- `app/api/transcribe/route.ts`: ElevenLabs Scribe STT endpoint with Web Speech fallback contract.
- `app/api/speak/route.ts`: ElevenLabs TTS endpoint with audio stream generation.
- `app/api/route/route.ts`: OpenRouteService pedestrian round-trip endpoint with synthetic loop fallback.
- `components/voice/voice-recorder-sheet.tsx`: Audio recording sheet with live waveform and review drawer.
- `components/speech/fact-audio-player.tsx`: Inline fact-card audio playback pill.
- `components/route/route-preview-sheet.tsx`: Pre-walk loop distance selector and preview.

</code_context>

<specifics>
## Specific Ideas

- Unified smart gesture: short tap toggles hands-free recording on/off, while press-and-hold records until release.
- 60-second limit with circular progress ring around mic, digital seconds counter, turns amber at 50s, auto-stops and transcribes at 60s.
- Dynamic 24–32 vertical bar equalizer in terracotta gradient rendered via Web Audio `AnalyserNode`.
- SHA-256 hash of `text + voiceId` stored in Dexie `speechCache` with LRU pruning for instant offline replays.
- Pre-walk start drawer with distance pill picker (1km / 2km / 3km) previewing loop on MapLibre before starting walk.
- Gentle non-intrusive off-route guidance: no jarring alarms, quiet "Off route" badge on HUD with 1-tap "Clear Route" button.

</specifics>

<deferred>
## Deferred Ideas

- None — discussion stayed within Phase 4 scope.

</deferred>

---

*Phase: 4-Voice Notes, Narration & Loop Routing*
*Context gathered: 2026-10-08*
