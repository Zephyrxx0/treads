# 04-02 SUMMARY: Fact Card TTS Narration with Speech Cache & OpenRouteService Pedestrian Loop Routing

## Execution Overview
- **Phase**: 04 - Voice Notes, Narration & Loop Routing
- **Plan**: 04-02 (Wave 2: Fact card narration with speech cache, ORS pedestrian loop routing, MapLibre guidelines, off-route HUD chip, and audio trail pins)
- **Status**: Completed successfully
- **Commit**: `2aa2b57`

## Accomplishments
1. **Fact Card TTS Narration & Speech Cache (`lib/speech.ts`)**:
   - Built `computeSpeechHash(text, voiceId)` for deterministic SHA-256 normalized text hashing.
   - Built `getCachedSpeech(textHash)` and `saveCachedSpeech(textHash, audio)` storing audio Blobs in Dexie `speechCache`.
   - Enforced LRU eviction keeping `<= 50` cached clips to prevent IndexedDB storage bloat.
   - Built `speakWithBrowserUtterance(text, options)` with sentence batching for reliable device speech fallback.
2. **ElevenLabs TTS API Endpoint (`app/api/speak/route.ts`)**:
   - Enforced rate limiting via dual-mode limiter (40 requests/day bucket).
   - Queries ElevenLabs TTS streaming endpoint with calm nature-documentary voice.
   - Returns `{ fallback: true }` gracefully when `ELEVENLABS_API_KEY` is absent or network fails.
3. **Interactive Inline Audio Pill (`components/speech/fact-audio-player.tsx`, `components/entry/fact-card.tsx`)**:
   - Replaced static "Listen" button on fact cards with an interactive audio player pill.
   - Features Play/Pause, progress scrubber, elapsed time (`0:14 / 0:42`), and `1.0x / 1.2x` speed toggle.
   - Displays subtle "Device voice" chip when falling back to browser `speechSynthesis`.
   - Checks Dexie `speechCache` by SHA-256 before making network calls.
4. **OpenRouteService & Synthetic Pedestrian Loop Engine (`lib/route.ts`, `app/api/route/route.ts`)**:
   - Built `generateSyntheticLoop(centerLng, centerLat, targetMeters)` generating smooth, organically perturbed closed loops around origin coordinates.
   - Built `calculateLoopDistance(coordinates)` using the Haversine formula.
   - Built `/api/route` supporting 1000m, 2000m, and 3000m loops with ORS pedestrian round-trip API and automatic synthetic fallback.
5. **Pre-Walk Route Preview & Discovery Sheet (`components/route/route-preview-sheet.tsx`)**:
   - Segmented toggle on `/walk` before starting: "Free Walk" vs "Loop Route".
   - Distance pill picker: "1 km (~15 min)", "2 km (~30 min)", "3 km (~45 min)".
   - Previews loop on MapLibre before starting; displays calm notice if using synthetic fallback loop.
6. **MapLibre Guidelines & Audio Note Pins (`components/map/walk-map.tsx`)**:
   - Added `walk-route-line` dashed terracotta polyline layer (`#F35C2B`, 0.6 opacity, `line-dasharray: [2, 2]`) for suggested loops underneath the solid GPS trail.
   - Added 32px circular terracotta pins with mic icon for recorded audio notes along the trail.
7. **Gentle Off-Route HUD & Completion Notes Reel (`components/walk/walk-hud.tsx`, `components/walk/walk-summary-sheet.tsx`, `app/walk/page.tsx`)**:
   - Added quiet "Off suggested loop" chip to `WalkHud` when divergence exceeds 60m, with 1-tap "Clear Route" button.
   - Added playable Voice Notes reel section to `WalkSummarySheet` below the Species Reel.
   - Wired geo-tagging (`lat`, `lng`) to voice notes recorded during active walks.
8. **Automated Verification Harnesses (`scripts/test-speak-route.ts`, `scripts/test-route-loop.ts`)**:
   - Verified SHA-256 hash determinism, 400 error handling, fallback signals, and rate limit headers for `/api/speak`.
   - Verified synthetic loop geometry, closed loop verification, 400 validation, and `/api/route` payload structure.
   - Verified zero TypeScript compilation errors with `pnpm exec tsc --noEmit`.
