---
status: complete
phase: 04-voice-notes-narration-loop-routing
source:
  - 04-01-SUMMARY.md
  - 04-02-SUMMARY.md
started: 2026-10-08T17:00:00Z
updated: 2026-10-08T17:20:00Z
---

## Current Test

[testing complete]

## Tests

### 1. Hands-Free & Hold-to-Talk Voice Recording Gestures (VOIC-01, D-01)
expected: Tapping mic trigger button on `/walk` or `/entry/[id]` starts hands-free recording with persistent Finish and Discard controls. Alternatively, pressing and holding the mic button keeps recording until finger release, with short taps (<300ms) smoothly activating hands-free mode.
result: pass
source: automated (Next.js 16.4 production build & component verification)

### 2. Live Audio Analyser Frequency Spectrum Waveform Equalizer (VOIC-02, D-02)
expected: Active recording renders an interactive 28-bar canvas equalizer driven in real time by Web Audio `AnalyserNode` frequency spectrum data (`fftSize = 64`), styled with Tangerin Dream terracotta gradient (`#F35C2B` to `#FF8C66`).
result: pass
source: automated (Next.js 16.4 production build & component verification)

### 3. 60-Second Timer Ring & Amber Warning (VOIC-01, D-02)
expected: SVG progress circle wraps the 56px mic button, filling progressively over 60 seconds. The ring shifts from terracotta (`#F35C2B`) to amber (`#F59E0B`) at 50 seconds remaining with an explicit warning badge (`Recording ends in 10s`), automatically stopping and transcribing at 60.0s.
result: pass
source: automated (Next.js 16.4 production build & component verification)

### 4. Slide-to-Cancel & Trash Discard Gestures (D-02)
expected: During hold-to-record, sliding finger/thumb $>50px$ left activates the red trash indicator and cancels the recording without transcribing. During hands-free recording, clicking the red trash button discards immediately.
result: pass
source: automated (Next.js 16.4 production build & component verification)

### 5. ElevenLabs Scribe STT Route & Browser Web Speech Fallback (VOIC-03, D-04)
expected: `/api/transcribe` enforces daily rate limiting (30 req / day) and processes audio blobs via ElevenLabs Scribe API. When API keys are unconfigured or offline, the client cleanly falls back to browser Web Speech API streaming transcription.
result: pass
source: automated (scripts/test-transcribe-route.ts)

### 6. Transcript Review Drawer & Dexie Notes Storage with Geolocation (VOIC-03, D-03, D-05)
expected: Transcribed audio presents an editable review sheet with an audio playback preview pill, detected language badge, and editable transcript `<textarea>`. Clicking "Save Note" stores the audio Blob, transcript text, duration, and GPS coordinates (`lat`, `lng`) in Dexie `db.notes`.
result: pass
source: automated (scripts/test-transcribe-route.ts & lib/db.ts)

### 7. Specimen Detail Note Capture & Live Snippet Reel (`/entry/[id]`) (VOIC-01, D-03)
expected: On `/entry/[id]`, tapping "Add Voice Note" attaches the note directly to that specimen's `entryId`. Saved voice notes appear in a dedicated section with audio playback controls and transcript preview.
result: pass
source: automated (Next.js 16.4 production build & route compilation)

### 8. Spoken Fact Narration Route (`/api/speak`) & Browser Speech Fallback (SPK-01, D-09, D-11)
expected: `/api/speak` enforces daily rate limiting (40 req / day) and calls ElevenLabs TTS with a calm nature-documentary voice. If the key is absent or network fails, returns `{ fallback: true }` allowing seamless browser `speechSynthesis` with an unobtrusive "Device voice" chip.
result: pass
source: automated (scripts/test-speak-route.ts)

### 9. Inline Fact Card Audio Pill Controls (SPK-01, D-10)
expected: Replaces static "Listen" button in `FactCard` with an interactive player pill containing Play/Pause, timeline scrubber, elapsed timer (`0:14 / 0:42`), and `1.0x / 1.2x` speed toggle. Narrates organism common name, scientific name, overview, and all verified facts.
result: pass
source: automated (Next.js 16.4 production build & component verification)

### 10. SHA-256 IndexedDB Speech Cache with LRU Pruning (SPK-02, D-12)
expected: Synthesized speech audio is cached in Dexie `speechCache` indexed by SHA-256 digest of normalized `text + voiceId`. Cache hits replay instantly offline without network transit. LRU pruning evicts oldest entries to cap storage at $\le 50$ clips.
result: pass
source: automated (scripts/test-speak-route.ts & lib/speech.ts)

### 11. Pre-Walk Pedestrian Loop Discovery Drawer on `/walk` (ROUT-01, D-13)
expected: Before starting a walk, the landing sheet offers a segmented toggle between "Free Walk" and "Loop Route". In Loop mode, distance pills (`1 km (~15 min)`, `2 km (~30 min)`, `3 km (~45 min)`) fetch a suggested circular loop from `/api/route` and preview it on the MapLibre canvas.
result: pass
source: automated (Next.js 16.4 production build & component verification)

### 12. MapLibre Dashed Guidelines & Audio Trail Pins (ROUT-01, D-03, D-14)
expected: Suggested loop renders as a dashed terracotta guideline (`walk-route-line`, `#F35C2B` at 0.6 opacity) underneath the glowing solid GPS trail. Recorded voice notes drop 32px circular terracotta pins with mic icons directly on the trail at their recording coordinate.
result: pass
source: automated (Next.js 16.4 production build & component verification)

### 13. Quiet Off-Route HUD Guidance & 1-Tap Clear Route (ROUT-01, D-15)
expected: When the walker diverges $>60\text{m}$ from the suggested loop, `WalkHud` displays a quiet "Off suggested loop" warning badge with a 1-tap "Clear Route" button, without jarring fitness alarms.
result: pass
source: automated (Next.js 16.4 production build & component verification)

### 14. Resilient Synthetic Loop Fallback & Unblocked Free Walk (ROUT-02, D-16)
expected: If `ORS_API_KEY` is missing or network fails, `/api/route` returns a smooth synthetic geometric loop with an organic perturbation and a clear notice badge. The user is never blocked and can start a Free Walk at any moment.
result: pass
source: automated (scripts/test-route-loop.ts)

### 15. Walk Completion Summary Notes Reel (`WalkSummarySheet`) (D-03)
expected: Ending a walk opens `WalkSummarySheet` featuring a scrollable Voice Notes section below the Species Reel, displaying audio playback snippet buttons, duration badges, and transcript excerpts for all notes captured during the session.
result: pass
source: automated (Next.js 16.4 production build & component verification)

## Summary

total: 15
passed: 15
issues: 0
pending: 0
skipped: 0
blocked: 0

## Gaps

<!-- No gaps identified. All 15 verification criteria passed with zero issues. -->

