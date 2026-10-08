# Treads Outdoor Field Verification Protocol

This document defines the standardized manual verification protocol for real-world testing of **Treads** (`treads.local` or deployed instance) on a mobile device outdoors.

---

## Prerequisites
- Mobile browser (iOS Safari, Android Chrome, or mobile Chromium).
- Location services enabled on device.
- Camera and microphone permissions allowed.
- Outdoor or garden environment with natural organisms (plants, trees, insects, birds).

---

## Verification Protocol Steps

### 1. First-Run Consent Gate & Persistent Storage (`CONS-01`, `CONS-02`, `CONS-03`)
1. Open the application in an incognito or fresh browser session.
2. **Observe**: The app-wide blocking modal overlay (`Welcome to Treads`) appears immediately.
3. Verify that tapping the background or pressing back/escape does not dismiss the modal (`disablePointerDismissal`).
4. Read the 4 privacy pillars:
   - AI Vision Identification (ephemeral Gemini analysis)
   - Voice Transcription (ephemeral ElevenLabs transcription)
   - Pedestrian Routing (coarse routing via OpenRouteService)
   - 100% On-Device Journal (local IndexedDB persistence)
5. Tap **"I Understand & Accept"**.
6. **Verify**: Modal dismisses, consent version `1.0.0` and timestamp are written to `db.settings`, and `navigator.storage.persist()` is silently invoked.
7. Navigate to `/settings` and verify the persistence status badge reads `Persisted` (or `Best Effort` with a manual retry button).

### 2. Live Walk Session & Geolocation Tracking (`WALK-01`, `WALK-02`, `WALK-03`)
1. From home, navigate to `/walk`.
2. Tap **"Start Free Walk"** (or generate a suggested loop).
3. **Observe**: Map centers on the live GPS coordinate pin.
4. Walk at least 50 meters outdoors.
5. **Verify**:
   - GPS accuracy filter suppresses erratic readings (>35m accuracy rejected).
   - Breadcrumb polyline trail renders smoothly behind your current position.
   - Live walk metrics update: elapsed duration timer and distance traveled in meters.

### 3. Two-Tap Specimen Capture, Sensory Cuelume Chime & Haptics (`CAPT-01`, `DSGN-04`, `DSGN-05`)
1. Stop at an observed plant, tree, or insect.
2. Tap the large circular **Camera** button in the walk dock.
3. Snap a clear photo of the specimen.
4. **Observe**: EXIF GPS metadata is scrubbed client-side before sending to Gemini.
5. In the candidate drawer, review up to 3 taxonomic candidates with confidence ratings (`Likely`, `Possible`, `Unsure`).
6. Tap the checkmark on the matching candidate.
7. **Verify**:
   - Dual-oscillator Cuelume chime plays (warm major-third dual tone E5 659.25Hz -> G#5 830.61Hz with exponential decay).
   - Device triggers a crisp tactile vibration (`[25ms]` on tap, `[40ms, 60ms, 80ms]` on confirmation).
   - Candidate is recorded into the local IndexedDB journal.

### 4. Progressive Tegaki Handwriting & Wikipedia Fact Cards (`DSGN-03`, `SPEC-01`)
1. Tap the specimen card or open `/entry/[id]`.
2. **Observe**: The confirmed common name renders via **Tegaki handwriting reveal** (`Caveat` cursive stroke wipe across ~1.2s).
3. Review the Wikipedia educational facts. Tap any of the 3 bullet points to expand sentence-level verified Wikipedia citations.
4. Toggle "Reduced Motion" in device accessibility settings and reload: verify text displays immediately without stroke animation.

### 5. Daily Species Hunt Challenge Completion (`HUNT-01`, `HUNT-02`, `DSGN-04`, `DSGN-05`)
1. Review today's daily hunt target on the landing page or walk screen (e.g. "Find a wild bird or flower").
2. Capture and confirm a specimen satisfying today's hunt challenge.
3. **Observe**: The Daily Hunt Celebration dialog displays automatically with animated completion seal.
4. **Verify**:
   - Cuelume 4-note ascending celebration arpeggio plays (C5 -> E5 -> G5 -> C6).
   - Double resonant tactile haptic vibration triggers.

### 6. Voice Observation Recording & TTS Playback (`VOIC-01`, `VOIC-02`)
1. On the walk screen or entry detail, tap the **Microphone** icon.
2. Speak a field note (e.g., "Noticed early morning dew on petals, solitary bee foraging nearby").
3. **Observe**: Live canvas waveform visualizes microphone input.
4. Tap Stop: speech note is saved to IndexedDB and transcribed.
5. Tap **"Listen to Field Summary"**: ElevenLabs natural voice reads the summary with cached audio replay.

### 7. Life List & Journal Review (`JOUR-01`, `JOUR-02`)
1. Tap End Walk -> Save Walk.
2. Navigate to `/journal`: verify activity heatmap shows today's walk square filled, distance, duration, and specimens cataloged.
3. Navigate to `/collection`: verify the taxonomic Life List grouped by kingdom and family.

### 8. Obsidian Vault Export (`EXP-01`, `EXP-02`)
1. Navigate to `/settings`.
2. Tap **"Export Obsidian Vault (.zip)"**.
3. **Verify**:
   - Clean progress bar animates through packaging stages.
   - ZIP file downloads with format `treads-vault-YYYY-MM-DD.zip`.
4. Open the ZIP on desktop or Obsidian:
   - Markdown specimen notes have clean YAML frontmatter (`common_name`, `scientific_name`, `lat`, `lng`, `date`).
   - Photos are preserved in high quality.
   - `treads-backup.json` contains full schema restoration data.

---

## Verification Results Checklist

| Step | Feature | Expected Behavior | Status |
|:---|:---|:---|:---:|
| 1 | Consent Gate | Blocking modal, persistent storage opt-in, semver 1.0.0 | [ ] |
| 2 | GPS Tracking | Live polyline, 35m accuracy filter, elapsed metrics | [ ] |
| 3 | Specimen Capture | 2-tap photo, EXIF stripping, Cuelume E5-G#5 chime, haptic tick | [ ] |
| 4 | Tegaki Reveal | Ink-stroke cursive handwriting reveal, Caveat fallback | [ ] |
| 5 | Daily Species Hunt | Challenge resolution, celebration modal, C5-E5-G5-C6 arpeggio | [ ] |
| 6 | Voice Note | Canvas waveform, transcription, TTS audio replay | [ ] |
| 7 | Journal & Life List | Heatmap calendar, taxonomic groupings, offline IndexedDB | [ ] |
| 8 | Obsidian Vault Export | Clean Markdown YAML notes, images, backup JSON | [ ] |

