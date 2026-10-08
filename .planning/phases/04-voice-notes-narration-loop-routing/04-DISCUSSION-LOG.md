# Phase 4: Voice Notes, Narration & Loop Routing - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-10-08
**Phase:** 4-Voice Notes, Narration & Loop Routing
**Areas discussed:** Voice Note UI & Attachment Context, Audio Recording Interaction & Waveform, TTS Narration & Speech Playback, Loop Route Suggestion & Map Integration

---

## Voice Note UI & Attachment Context

| Option | Description | Selected |
|--------|-------------|----------|
| Both on active walks and organism detail pages | A mic button in the /walk bottom dock attaches a note to the active walk session, and an "Add voice note" button on /entry/[id] attaches observations directly to that specimen find. | ✓ |
| Active walk dock only | Notes are solely walk-level field log entries recorded during an active walk, viewable in the walk summary. | |
| Organism entries only | Notes can only be recorded as commentary attached to a photographed find. | |

**User's choice:** Both on active walks and organism detail pages
**Notes:** Walker can record walk-level notes and find-specific reflections.

| Option | Description | Selected |
|--------|-------------|----------|
| Bottom sheet review drawer | Displays audio playback controls, detected language badge, and editable transcript textarea with "Save Note" and "Discard" actions. | ✓ |
| Instant auto-save with toast | Automatically saves to Dexie immediately; shows a toast banner ("Transcribed: '...' — Tap to edit") to keep the walk flow uninterrupted. | |
| Modal overlay with full keyboard focus | Expands into a centered dialog dedicated to proofreading longer notes. | |

**User's choice:** Bottom sheet review drawer
**Notes:** Review before saving allows editing misrecognized words or adding text.

| Option | Description | Selected |
|--------|-------------|----------|
| Audio pins on trail map + notes reel in summary | Drops a small terracotta audio pin on the MapLibre trail at the recording coordinate, and includes a scrollable notes list in the walk summary sheet. | ✓ |
| Walk summary reel only (no map pin) | Keeps the trail map exclusively reserved for biological specimen markers, surfacing voice notes in the completion summary. | |
| Grouped into specimen pins only | Voice notes only appear on the map if attached directly to an organism entry find. | |

**User's choice:** Audio pins on trail map + notes reel in summary
**Notes:** Audio markers give geographic anchor to voice notes on the trail.

| Option | Description | Selected |
|--------|-------------|----------|
| Store compressed audio (WebM/Opus) + transcript in Dexie | Preserves the user's authentic spoken voice note for playback while keeping IndexedDB storage light (~30-50KB per 60s note). | ✓ |
| Store full uncompressed audio Blob + transcript | Maximum fidelity, captures raw recorded format directly into IndexedDB without client-side re-encoding overhead. | |
| Store transcript only (discard audio after transcription) | Ultra-lightweight storage; user keeps the textual field note but cannot replay their original audio. | |

**User's choice:** Store compressed audio (WebM/Opus) + transcript in Dexie
**Notes:** Balances authentic voice audio preservation with mobile storage hygiene.

---

## Audio Recording Interaction & Waveform

| Option | Description | Selected |
|--------|-------------|----------|
| Unified smart gesture | Short tap toggles hands-free recording on/off (tap to start, tap to stop), while continuous press-and-hold records until finger release. | ✓ |
| Explicit mode selector | A toggle pill above the mic button ("Tap" vs "Hold") allowing the walker to explicitly pick their preferred mode before recording. | |
| Tap-to-toggle with slide-to-lock | Swiping up while holding locks into hands-free mode (similar to WhatsApp/Telegram voice notes). | |

**User's choice:** Unified smart gesture
**Notes:** Natural dual gesture: quick tap for hands-free, long-press for hold-to-talk.

| Option | Description | Selected |
|--------|-------------|----------|
| Circular progress ring around mic + digital counter with auto-stop | A terracotta ring fills around the mic button with live seconds counter, turns amber at 50s, and automatically finishes & sends to transcribe at 60s. | ✓ |
| Floating recording HUD pill | A floating top pill showing blinking red recording indicator, elapsed timer (0:00 / 1:00), and a linear progress bar. | |
| Subtle timer badge only | Minimalist "0:42 / 1:00" badge next to waveform with auto-stop at 60s. | |

**User's choice:** Circular progress ring around mic + digital counter with auto-stop
**Notes:** Visual radial progress provides clear awareness of the 60s limit.

| Option | Description | Selected |
|--------|-------------|----------|
| Dynamic vertical bar equalizer | Web Audio AnalyserNode frequency bins rendered as 24-32 responsive terracotta bars with rounded caps, bouncing in real-time. | ✓ |
| Smooth oscilloscope waveform curve | A continuous flowing sine/bezier curve drawn on HTML5 canvas with a warm terracotta glow. | |
| Radial sound wave pulse rings | Concentric pulsing ripples expanding outward from the microphone button in rhythm with voice volume. | |

**User's choice:** Dynamic vertical bar equalizer
**Notes:** 24–32 responsive bars in Tangerin Dream terracotta styling.

| Option | Description | Selected |
|--------|-------------|----------|
| Slide-to-cancel gesture + red trash button | While holding, sliding thumb away aborts; while hands-free, a red trash icon discards without transcribing. Permission block shows inline friendly recovery instructions. | ✓ |
| Always confirm before discarding | Tapping an 'X' button prompts 'Discard recording?' to prevent losing field observations by accident. | |
| Quick double-tap to cancel | Double-tapping the mic immediately resets and clears recording. | |

**User's choice:** Slide-to-cancel gesture + red trash button
**Notes:** Smooth cancellation path without blocking modal dialogs.

---

## TTS Narration & Speech Playback

| Option | Description | Selected |
|--------|-------------|----------|
| Full audio card narration | Reads organism name intro, summary paragraph, and all numbered grounded facts in a natural storytelling sequence. | ✓ |
| Summary paragraph only | Reads just the short lead summary (under 15-20s), keeping audio concise for quick trail listening. | |
| Interactive per-fact audio | Reads summary by default, with small speaker icons on each individual fact bullet to listen to single facts on demand. | |

**User's choice:** Full audio card narration
**Notes:** Rich storytelling experience covering name, summary, and verified facts.

| Option | Description | Selected |
|--------|-------------|----------|
| Inline fact-card audio pill | Replaces the 'Listen' button with an interactive pill containing Play/Pause, scrubbing progress bar, elapsed time, and a 1x/1.2x speed toggle. | ✓ |
| Persistent bottom audio dock | Floats at the bottom edge so walker can scroll the entry page, zoom photos, or check map pins while listening. | |
| Minimalist play/stop button | Simple speaker icon that toggles between playing and stopped with no complex scrubbers. | |

**User's choice:** Inline fact-card audio pill
**Notes:** Clean inline integration on the fact card itself.

| Option | Description | Selected |
|--------|-------------|----------|
| Calm nature-documentary voice + subtle 'Device voice' badge on fallback | Uses a warm, measured ElevenLabs voice; silently falls back to browser speechSynthesis with a small 'Device voice' pill when offline/unconfigured. | ✓ |
| Silent fallback without indicator | Seamlessly uses browser speechSynthesis without any badge or banner when ElevenLabs is absent. | |
| Voice selection setting in /settings | Let user choose between a Calm Storyteller or Energetic Guide voice preset in settings. | |

**User's choice:** Calm nature-documentary voice + subtle 'Device voice' badge on fallback
**Notes:** Nature documentary tone with transparent fallback indicator.

| Option | Description | Selected |
|--------|-------------|----------|
| SHA-256 hash of text+voice stored as Blob with LRU pruning (up to 50 clips or 50MB) | Guarantees instant offline replay for previously visited species cards while safeguarding mobile storage. | ✓ |
| Unbounded IndexedDB persistence | Never auto-prunes; keeps all synthesized audio until user explicitly taps 'Delete all data' in /settings. | |
| Title-keyed cache without cryptographic hash | Keyed simply by Wikipedia page title and species name in Dexie. | |

**User's choice:** SHA-256 hash of text+voice stored as Blob with LRU pruning (up to 50 clips or 50MB)
**Notes:** Cryptographic hash avoids collision, LRU protects IndexedDB quota.

---

## Loop Route Suggestion & Map Integration

| Option | Description | Selected |
|--------|-------------|----------|
| Pre-walk start drawer with distance pill picker | Before starting a walk on /walk, the user can choose 'Free Walk' or select 'Loop (1km / 2km / 3km)' to preview the calculated route on the map before hitting 'Start Walk'. | ✓ |
| In-walk floating 'Suggest Loop' chip | Allows generating a loop at any time, even after having already started a walk from current GPS coordinates. | |
| Separate 'Plan Route' screen | A dedicated /routes page where users preview different loops before navigating to /walk. | |

**User's choice:** Pre-walk start drawer with distance pill picker
**Notes:** Pre-walk preview lets walker see and confirm the loop geometry before starting.

| Option | Description | Selected |
|--------|-------------|----------|
| Dashed terracotta guideline with direction arrows | Rendered as a dashed, semi-transparent terracotta polyline; the user's active GPS trail paints a solid glowing trail on top as they walk. | ✓ |
| Contrasting slate-blue planned route | Uses an earthy slate/sage tone for the planned loop to clearly contrast against the vivid terracotta walk trail. | |
| Turn-by-turn navigation waypoints | Adds turn dots and distance pills along the loop line for step-by-step guidance. | |

**User's choice:** Dashed terracotta guideline with direction arrows
**Notes:** Harmonious with Tangerin Dream theme while clearly distinguishing planned vs actual path.

| Option | Description | Selected |
|--------|-------------|----------|
| Gentle non-intrusive guidance | No annoying off-track alarms; keeps nature peaceful with a quiet 'Off route' badge on the HUD, offering a 1-tap 'Clear Route' button anytime. | ✓ |
| Purely informational reference | The dashed loop remains visible on the map without any distance/divergence tracking or HUD badges. | |
| Dynamic re-routing | Automatically queries OpenRouteService to calculate a new loop if the walker diverges over 150m. | |

**User's choice:** Gentle non-intrusive guidance
**Notes:** Maintains peaceful outdoor immersion without fitness-app pressure.

| Option | Description | Selected |
|--------|-------------|----------|
| Graceful banner with synthetic geometric loop + instant 'Start Free Walk' | If ORS fails or key is missing, shows a calm notice, offers a local synthetic circle loop for testing/visual preview, and lets walker start a free walk with one tap. | ✓ |
| Auto-fallback to Free Walk with toast | Immediately reverts to Free Walk mode and displays a brief toast ('Routing unavailable — starting free-form walk'). | |
| Strict key reminder modal | Shows a dialog informing that ORS_API_KEY is required for loops, with instructions to configure environment variables. | |

**User's choice:** Graceful banner with synthetic geometric loop + instant 'Start Free Walk'
**Notes:** Reliable dev experience and offline resilience without blocking walkers.

---

## the agent's Discretion

- Specific Web Audio `AnalyserNode` FFT size (`fftSize: 64` or `128`) and smoothing time constant (`0.8`).
- Exact ElevenLabs voice ID selected for the nature guide narration preset.
- Exact radius math for synthetic circle/cardioid loop generation during dev and offline fallback.

## Deferred Ideas

- None — discussion stayed within Phase 4 scope.
