# Phase 4: Voice Notes, Narration & Loop Routing - Research

**Researched:** 2026-10-08  
**Domain:** Web Audio AnalyserNode Waveform, ElevenLabs Scribe STT & TTS Audio Generation, Browser Web Speech API & SpeechSynthesis Fallbacks, Dexie Audio Caching & OpenRouteService Pedestrian Routing  
**Confidence:** HIGH

---

## Summary

Phase 4 completes Treads' outdoor sensory companion capabilities: hands-free audio journaling, spoken narration for grounded fact cards, and loop walk suggestions. On active walks or organism detail pages, walkers capture spontaneous voice reflections using a unified hold-or-tap gesture with real-time Web Audio `AnalyserNode` frequency visualization and a 60-second safety limit.

Field audio is transmitted to `/api/transcribe` (calling ElevenLabs Scribe STT with automatic language detection) or transcribed via the browser Web Speech API (`webkitSpeechRecognition`) if offline or unconfigured. Fact cards gain spoken voice narration via `/api/speak` (calling ElevenLabs TTS with a calm nature-guide voice preset) or browser `speechSynthesis`, with audio cached as Blobs in Dexie IndexedDB by SHA-256 text hash for instant zero-cost replays. Finally, the walk starting experience introduces "Suggest a loop" querying OpenRouteService (`/api/route`) for 1km, 2km, or 3km round-trip pedestrian routes, rendered as dashed terracotta guidelines on MapLibre with quiet off-route guidance and a resilient synthetic circle generator when offline.

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- **D-01:** Dual recording triggers — Mic button in the `/walk` bottom control dock attaches voice notes to the active walk session (`walkId`), and an "Add voice note" button on `/entry/[id]` attaches field reflections directly to that specific specimen find (`entryId`).
- **D-02:** Bottom sheet review drawer — When recording ends and transcription completes, a review bottom sheet displays audio playback controls, detected language badge, and editable transcript textarea with "Save Note" and "Discard" actions.
- **D-03:** Map trail audio pins & summary notes reel — Drops a distinct terracotta mic pin at the recording GPS coordinate along the MapLibre trail, and includes a scrollable notes list in the walk completion summary drawer (`walk-summary-sheet.tsx`).
- **D-04:** Compressed audio storage in Dexie — Store compressed audio (WebM/Opus) alongside editable transcript text in the Dexie `notes` table, preserving the authentic spoken voice note for replay while keeping IndexedDB storage light (~30-50KB per 60s note). — **Reversibility:** costly — audio compression format and Dexie blob schema require consistent data handling across export and backup modules.
- **D-05:** Unified smart gesture — Short tap toggles hands-free recording on/off (tap to start, tap to stop), while continuous press-and-hold records until finger release.
- **D-06:** 60-second limit & visual timer — A circular terracotta progress ring fills clockwise around the mic button with a live MM:SS counter, shifts to amber warning color at 50s, and automatically finishes & dispatches to transcription at 60.0s.
- **D-07:** Dynamic vertical bar equalizer — Real-time Web Audio `AnalyserNode` frequency bins rendered as 24-32 responsive terracotta bars (`#F35C2B` gradient) with rounded caps, smoothly animated via `requestAnimationFrame`.
- **D-08:** Cancellation & mic permissions — Sliding thumb away during hold-to-record aborts without transcribing; tapping a red trash button while hands-free discards the recording. If microphone access is denied, an inline friendly notice explains how to enable permissions in browser settings.
- **D-09:** Full audio card narration — The fact card "Listen" button narrates the organism name intro ("European Robin, Erithacus rubecula"), summary paragraph, and all numbered grounded facts in a seamless storytelling script.
- **D-10:** Inline fact-card audio pill — Replaces the "Listen" button with an interactive pill containing Play/Pause, scrubbing progress bar, elapsed time, and a 1x/1.2x speed toggle.
- **D-11:** Nature-documentary voice & device fallback — Uses a warm, contemplative ElevenLabs voice preset (nature guide); if unconfigured or offline, seamlessly falls back to browser `speechSynthesis` with an unobtrusive "Device voice" chip.
- **D-12:** Dexie `speechCache` hashing & LRU pruning — Audio clips keyed by SHA-256 hash of `text + voiceId` stored as Blobs with LRU pruning (up to 50 clips or 50MB) for instant offline replay without redundant API costs. — **Reversibility:** costly — cache key hashing algorithm and LRU pruning thresholds define the speech cache contract in IndexedDB.
- **D-13:** Pre-walk start drawer & distance picker — On `/walk` before starting a walk, a drawer lets the user toggle between "Free Walk" and "Loop Route", selecting 1km, 2km, or 3km via segmented pill picker to preview the calculated route geometry on MapLibre before confirming "Start Walk".
- **D-14:** Dashed terracotta guideline with chevrons — Suggested loop rendered as a dashed, semi-transparent terracotta polyline (`#F35C2B` with 0.6 opacity) with subtle directional indicators; the user's live GPS track paints a solid glowing polyline over it as they progress.
- **D-15:** Gentle non-intrusive off-route guidance — No jarring alarms or rerouting penalties; displays a quiet "Off route" badge on the top HUD with a 1-tap "Clear Route" button anytime.
- **D-16:** Graceful ORS fallback with synthetic loop — If `ORS_API_KEY` is missing or network fails, displays a calm banner, generates a synthetic geometric loop around current GPS for visual preview and testing, and provides an instant 1-tap "Start Free Walk" button. — **Reversibility:** costly — route response schema and fallback polyline generator integrate with both server `/api/route` and map renderers.

### the agent's Discretion
- Web Audio `AnalyserNode` parameters: `fftSize: 64` (providing 32 frequency bins) with `smoothingTimeConstant: 0.8` for silky 60fps canvas updates.
- Default ElevenLabs voice ID: `21m00Tcm4TlvDq8ikWAM` (Rachel - warm, clear narration) or `onwK4e9ZLuTAKqWW03F9` (Daniel - calm naturalist).
- Synthetic route math: Archimedean circle with jittered radial offsets around `[lng, lat]` matching requested kilometer perimeter.

### Deferred Ideas (OUT OF SCOPE)
- Audio spectrogram ML for bird call recognition (v2).
- Turn-by-turn spoken audio navigation prompts (v2).
- Offline PMTiles or vector tile caching (v2).
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| VOIC-01 | Record up to 60s voice notes with hold-to-record or tap-to-toggle and live Web Audio waveform | Implemented via `MediaRecorder` + Web Audio `AnalyserNode` rendering 24-32 canvas bars with circular SVG countdown timer. |
| VOIC-02 | Audio sent to `/api/transcribe` via ElevenLabs Scribe STT with language detection, saving editable transcripts in IndexedDB | Implemented via `POST /api/transcribe` forwarding audio buffer to ElevenLabs STT API (`https://api.elevenlabs.io/v1/speech-to-text`) or returning fallback flag. |
| VOIC-03 | If `ELEVENLABS_API_KEY` missing or fails, app gracefully falls back to browser Web Speech API (`webkitSpeechRecognition`) and manual text notes | Client-side feature-detection for `webkitSpeechRecognition` / `SpeechRecognition` handles speech streaming locally with manual review fallback. |
| SPK-01 | "Listen" button calls `/api/speak` (ElevenLabs TTS with browser `speechSynthesis` fallback) to read fact cards aloud | Implemented via `POST /api/speak` streaming MP3 audio from ElevenLabs (`https://api.elevenlabs.io/v1/text-to-speech/{voice_id}`) with client `speechSynthesis` fallback. |
| SPK-02 | Synthesized speech audio is cached in IndexedDB by text hash for zero-cost replay | Web Crypto `crypto.subtle.digest('SHA-256', ...)` creates a hexadecimal key stored in Dexie `speechCache` table (`[textHash, audio, createdAt]`). |
| ROUT-01 | "Suggest a loop" calls `/api/route` (OpenRouteService pedestrian round-trip) for 1km, 2km, or 3km loops | Implemented via `POST /api/route` calling OpenRouteService `/v2/directions/foot-walking` with `options.round_trip` parameters. |
| ROUT-02 | If `ORS_API_KEY` is missing or routing fails, UI displays graceful notice and allows immediate free-form walking without blocking | Client renders notice banner, draws synthetic circular loop for preview, and provides immediate 1-tap "Start Free Walk". |
</phase_requirements>

---

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Audio Recording & Live Waveform | Browser (Client) | Web Audio API | `getUserMedia`, `MediaRecorder`, and `AnalyserNode` execute entirely client-side with zero audio streaming latency. |
| STT Transcription | Server (`/api/transcribe`) | ElevenLabs Scribe | Server protects `ELEVENLABS_API_KEY` and handles multipart audio payloads with rate limiting. |
| STT Browser Fallback | Browser (Client) | `webkitSpeechRecognition` | Client provides zero-config offline transcription when API key is missing or mobile device is offline. |
| TTS Audio Generation | Server (`/api/speak`) | ElevenLabs TTS | Server streams high-fidelity MP3 voice stream, enforcing daily quota rate limits. |
| TTS Offline Speech Fallback | Browser (Client) | `speechSynthesis` | Client speaks fact cards natively using device voice when offline or unconfigured. |
| Speech Audio Cache | Database (Dexie IndexedDB) | Web Crypto API | Client stores synthesized audio Blobs by SHA-256 hash, eliminating redundant network calls on replay. |
| Loop Route Generation | Server (`/api/route`) | OpenRouteService | Server manages `ORS_API_KEY`, issues pedestrian round-trip requests, and formats GeoJSON LineStrings. |
| Synthetic Loop Fallback | Server / Client | Turf/Trig Math | Generates smooth circular walking loops around current GPS coordinates when ORS is unreachable. |
| Map Route & Note Pins | Browser (Client) | MapLibre GL Canvas | Client overlays dashed suggested route line and drops terracotta audio note pins on the trail map. |

---

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `dexie` | `4.4.6` [VERIFIED: package.json:21] | IndexedDB storage | Pre-configured `db.notes` and `db.speechCache` tables with reactive `useLiveQuery`. |
| `lucide-react` | `^1.52.0` [VERIFIED: package.json:23] | Iconography | Official icons: `Mic`, `MicOff`, `Volume2`, `VolumeX`, `Trash2`, `Play`, `Pause`, `Route`, `Compass`. |
| `maplibre-gl` | `^6.13.0` [VERIFIED: package.json:24] | Map rendering | Native GeoJSON `LineString` layer support for dashed loop route and audio marker pins. |
| `zod` | `^4.6.5` [VERIFIED: package.json:32] | Request validation | Type-safe JSON schemas for `/api/transcribe`, `/api/speak`, `/api/route`. |

---

## Architecture Patterns

### Pattern 1: Web Audio Live Waveform Loop
```typescript
// Client-side Web Audio AnalyserNode setup
const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
const analyser = audioCtx.createAnalyser();
analyser.fftSize = 64; // 32 frequency bins
analyser.smoothingTimeConstant = 0.8;

const source = audioCtx.createMediaStreamSource(stream);
source.connect(analyser);

const dataArray = new Uint8Array(analyser.frequencyBinCount);
function render() {
  analyser.getByteFrequencyData(dataArray);
  // draw 24-32 terracotta bars on canvas
  requestAnimationFrame(render);
}
```

### Pattern 2: SHA-256 Text Hashing for Dexie Speech Cache
```typescript
export async function computeSpeechHash(text: string, voiceId: string = 'default'): Promise<string> {
  const normalized = `${voiceId}:${text.trim().toLowerCase()}`;
  const msgBuffer = new TextEncoder().encode(normalized);
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}
```

### Pattern 3: OpenRouteService Pedestrian Round-Trip Loop
```typescript
// POST https://api.openrouteservice.org/v2/directions/foot-walking/geojson
const body = {
  coordinates: [[lng, lat]],
  options: {
    round_trip: {
      length: targetMeters, // 1000, 2000, 3000
      points: 5,
      seed: Math.floor(Math.random() * 10000),
    },
  },
};
```

---

## Don't Hand-Roll

- **Do NOT hand-roll an audio recorder from scratch:** Use standard `MediaRecorder` with `audio/webm;codecs=opus` (or `audio/mp4` on Safari).
- **Do NOT re-fetch speech audio on replay:** Always check `db.speechCache` by SHA-256 hash before calling `/api/speak`.
- **Do NOT block the walk if ORS fails:** If OpenRouteService fails or `ORS_API_KEY` is missing, generate a synthetic circular loop and let the walker start immediately.
- **Do NOT trigger jarring fitness alarms:** If walker deviates from the suggested loop, display a quiet `"Off suggested loop"` chip on the HUD with a 1-tap `"Clear Route"` button.

---

## Common Pitfalls

- **Mobile Safari Web Audio Suspension:** iOS Safari suspends `AudioContext` if not initialized during a direct user gesture (`touchstart` / `click`). Always call `audioContext.resume()` immediately within the user tap event handler.
- **Microphone Stream Leaks:** When recording ends, cancels, or the component unmounts, explicitly call `stream.getTracks().forEach(track => track.stop())` to turn off the hardware microphone indicator.
- **SpeechSynthesis Cancellation:** In browser `speechSynthesis`, long texts can pause unexpectedly on Chrome. Splitting utterances into sentences and calling `window.speechSynthesis.cancel()` before starting prevents overlapping speech.

---

## Validation Architecture

The phase will be verified through automated route harness tests and component smoke tests:

1. **Audio Recording & Web Audio:**
   - Verify `MediaRecorder` initializes and generates valid audio Blobs.
   - Verify `computeSpeechHash` produces consistent deterministic SHA-256 hex strings.
2. **API Routes:**
   - `/api/transcribe`: Verify multipart/JSON payload handling, rate limiting, and mock fallback response when `ELEVENLABS_API_KEY` is unset.
   - `/api/speak`: Verify TTS payload validation, rate limiting, and fallback signal when `ELEVENLABS_API_KEY` is unset.
   - `/api/route`: Verify 1km, 2km, 3km round-trip loop calculation, rate limiting, and synthetic circular loop geometry generation when `ORS_API_KEY` is unset.
3. **Dexie Persistence:**
   - Verify `db.notes` stores voice note records with `walkId`/`entryId`, duration, transcript, and audio Blob.
   - Verify `db.speechCache` caches audio Blobs by `textHash` and prunes when exceeding limits.

