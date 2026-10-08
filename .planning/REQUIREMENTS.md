# Requirements: Treads

**Defined:** 8 October 2026  
**Core Value:** Get from launch to first organism capture in two taps, delivering fast, honest, Wikipedia-grounded identification that stays entirely private on the user's phone.

---

## v1 Requirements

Requirements committed for the 5-day hackathon release. Each requirement is testable and mapped to a roadmap phase.

### Consent & Privacy

- [x] **CONS-01**: First run displays a full-screen consent modal explaining data handling (photos to AI, audio to ElevenLabs, coarse coords to server, journal stays on device).
- [x] **CONS-02**: Consent acceptance stores a timestamped version number in IndexedDB, gating access to all walk and capture features.
- [x] **CONS-03**: App requests `navigator.storage.persist()` on consent acceptance and reports persistence status in `/settings`.
- [x] **CONS-04**: Permissions (camera, mic, location) are requested just-in-time at point of use with non-blocking inline fallback messaging if denied.

### Walk Lifecycle & Tracking

- [ ] **WALK-01**: User can start a new walk session from `/walk` with a single tap, generating a unique session in IndexedDB.
- [ ] **WALK-02**: Active walk automatically resumes if the browser tab is reloaded, backgrounded, or restored after camera use (`endedAt == null`).
- [ ] **WALK-03**: User can end a walk to see a summary card displaying duration, distance, and confirmed species count.
- [ ] **GPS-01**: App tracks foreground GPS position, applying noise filtering (reject accuracy > 35m, ignore displacement < 5m unless 15s elapsed).
- [ ] **GPS-02**: Capture pins and breadcrumb trail are saved to the active walk record and labeled as "approximate path".
- [ ] **MAP-01**: MapLibre GL renders vector map using OpenFreeMap tiles (`liberty` style) centered on the user.
- [ ] **MAP-02**: Map displays custom SVG markers for each capture categorized by organism kind.

### Photo Capture & Processing

- [ ] **CAPT-01**: Large capture button opens the native system camera app via `<input type="file" accept="image/*" capture="environment">`.
- [ ] **CAPT-02**: Captured image is decoded to HTML5 Canvas, resized to max edge 1024px, and re-exported as JPEG (quality 0.82) to strip all EXIF/GPS metadata client-side.
- [ ] **CAPT-03**: Compressed image blob (~150KB) is saved immediately to Dexie IndexedDB with timestamp and coordinates before any network upload.

### AI Identification & Verification

- [ ] **IDEN-01**: Client uploads compressed JPEG, month, and coarse region (1 decimal coord) to `/api/identify`.
- [ ] **IDEN-02**: Server calls Google AI Studio (Gemma with automatic fallback to Gemini 2.0 Flash) returning up to 3 taxonomic candidates with qualitative confidence (Likely, Possible, Unsure).
- [ ] **IDEN-03**: Model identifies non-living objects, blurry captures, or people and returns honest refusal ("Can't tell, try a closer shot").
- [ ] **IDEN-04**: Server verifies each candidate against the Wikipedia Action API (`redirects=1`), validating taxon metadata. Taxons that do not resolve are flagged as Unverified.
- [ ] **IDEN-05**: User can confirm a candidate or select "None of these" to save as unidentified.

### Fact Cards & Grounding Safety

- [ ] **FACT-01**: Confirming a candidate triggers `/api/facts` to fetch the plain-text lead section (10–25 sentences) from Wikipedia with numbered sentences.
- [ ] **FACT-02**: Gemma synthesizes a short summary (max 40 words) and up to 3 facts (max 20 words each), strictly citing source sentence numbers.
- [ ] **FACT-03**: Server validates citations and executes strict regex scrubbing to drop any claims regarding edibility, toxicity, handling, or medicinal use.
- [ ] **FACT-04**: If validation drops all facts, server retries once, then falls back to displaying sentence #1 of the verified Wikipedia lead section.
- [ ] **FACT-05**: Fact card displays mandatory warning: *"This is a best guess. Don't eat or touch anything based on this app."* and CC BY-SA Wikipedia attribution link.
- [ ] **FACT-06**: Fact cards are cached by Wikipedia title to avoid redundant API calls.

### Voice Notes & Narration

- [ ] **VOIC-01**: User can record up to 60s voice notes using either hold-to-record or tap-to-toggle, complete with a live Web Audio waveform visualization.
- [ ] **VOIC-02**: Audio is sent to `/api/transcribe` via ElevenLabs Scribe STT with automatic language detection, saving editable transcripts in IndexedDB.
- [ ] **VOIC-03**: If `ELEVENLABS_API_KEY` is missing or fails, app gracefully falls back to browser Web Speech API (`webkitSpeechRecognition`) and manual text notes.
- [ ] **SPK-01**: "Listen" button calls `/api/speak` (ElevenLabs TTS with browser `speechSynthesis` fallback) to read fact cards aloud.
- [ ] **SPK-02**: Synthesized speech audio is cached in IndexedDB by text hash for zero-cost replay.

### Routing & Discovery

- [ ] **ROUT-01**: "Suggest a loop" calls `/api/route` (OpenRouteService pedestrian round-trip) for 1km, 2km, or 3km loops.
- [ ] **ROUT-02**: If `ORS_API_KEY` is missing or routing fails, UI displays a graceful notice and allows immediate free-form walking without blocking.
- [ ] **HUNT-01**: Client generates one daily species hunt challenge deterministically by hashing the local date (`YYYY-MM-DD`) against a rule catalog.
- [ ] **HUNT-02**: App tracks daily hunt progress across confirmed finds and triggers a celebration animation upon completion.

### Collection, Journal & Export

- [ ] **LIFE-01**: `/collection` displays all unique confirmed species grouped by organism kind (Trees, Flowers, Plants, Birds, Insects, Other) with find counts.
- [ ] **JOUR-01**: `/journal` displays past walks grouped by date with species counts and an activity heatmap.
- [ ] **JOUR-02**: `/journal/[walkId]` shows walk route, track statistics, and find pins.
- [ ] **EXPT-01**: User can export their full journal as an Obsidian-compatible ZIP archive containing Markdown walk notes, species cards with CC BY-SA attribution, media JPEGs, and a `treads-backup.json` database dump.
- [ ] **SETT-01**: Settings provides "Delete all data" action with confirmation dialog, clearing all IndexedDB tables.

### Design System, Motion & Sound

- [x] **DSGN-01**: All UI components implement the Tangerin Dream color palette, typography tokens, and border radii using shadcn Base UI.
- [x] **DSGN-02**: Motion animations honor `prefers-reduced-motion` with simple opacity fades and pause when the browser tab is hidden.
- [ ] **DSGN-03**: Fact card headers and landing tagline feature progressive Tegaki handwriting reveals with web font fallbacks.
- [ ] **DSGN-04**: Synthesized Web Audio chimes (Cuelume) provide soft feedback on capture and hunt completion (toggle in `/settings`, off by default).
- [ ] **DSGN-05**: Native `navigator.vibrate` haptic pulses trigger on capture and confirmation.

### Infrastructure & Developer Tools

- [x] **RATE-01**: Server routes enforce IP token bucket rate limiting with in-memory dev mode and Upstash Redis production mode.
- [x] **EVAL-01**: Isolated `app/(dev)/eval` developer route executes batch benchmarks on 30 test fixtures, scoring accuracy (≥70%) and refusal rates (≥90%).

---

## v2 Requirements (Deferred to Future Releases)

- **OFFL-01**: Vector tile caching via PMTiles and offline service worker sync queue.
- **SYNC-01**: End-to-end encrypted peer-to-peer cloud sync across devices.
- **BIRD-01**: Audio spectrogram machine learning for bird call identification.
- **SOCIAL-01**: Exportable share cards / field journal social snippets.

---

## Out of Scope

| Feature | Reason |
|---------|--------|
| User accounts & passwords | 100% on-device private journal; no remote user database needed |
| Social feeds & leaderboards | Prevents nature distraction, gamified poaching, and sensitive habitat disruption |
| Offline map tile bundles | High storage complexity and bandwidth; out of scope for 5-day build |
| Foraging & edibility advice | High legal/safety liability; app explicitly bans edibility guidance |
| Background GPS with screen locked | Web browser security limitations on mobile; foreground only |

---

## Traceability Matrix

| Requirement | Phase | Status |
|-------------|-------|--------|
| CONS-01, CONS-02, CONS-03, CONS-04 | Phase 1 | Pending |
| DSGN-01, DSGN-02, DSGN-03, DSGN-04, DSGN-05 | Phase 1 | Pending |
| RATE-01, EVAL-01 | Phase 1 | Pending |
| WALK-01, WALK-02, WALK-03 | Phase 2 | Pending |
| GPS-01, GPS-02, MAP-01, MAP-02 | Phase 2 | Pending |
| CAPT-01, CAPT-02, CAPT-03 | Phase 3 | Pending |
| IDEN-01, IDEN-02, IDEN-03, IDEN-04, IDEN-05 | Phase 3 | Pending |
| FACT-01, FACT-02, FACT-03, FACT-04, FACT-05, FACT-06 | Phase 3 | Pending |
| VOIC-01, VOIC-02, VOIC-03 | Phase 4 | Pending |
| SPK-01, SPK-02 | Phase 4 | Pending |
| ROUT-01, ROUT-02 | Phase 4 | Pending |
| HUNT-01, HUNT-02 | Phase 5 | Pending |
| LIFE-01, JOUR-01, JOUR-02 | Phase 5 | Pending |
| EXPT-01, SETT-01 | Phase 5 | Pending |

**Coverage:**

- v1 requirements: 33 total
- Mapped to phases: 33
- Unmapped: 0 ✓

---
*Requirements defined: 8 October 2026*  
*Last updated: 8 October 2026 after initial definition*
