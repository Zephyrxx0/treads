# Roadmap: Treads

## Overview

Treads is built through 6 phased increments from foundation to release, strictly aligned with the 5-day hackathon window. Beginning with Next.js 16.4 (Cache Components, new agent features, lazy dynamic imports) and React 19.3 scaffolding, Tangerin Dream design tokens, and Day 1 AI/Map spikes, the journey proceeds through mobile-resilient walk tracking, camera capture with client-side Canvas EXIF stripping, Wikipedia-grounded Gemma identification, voice notes with Web Speech fallbacks, life list collection, Obsidian-compatible export, and outdoor evaluation testing.

---

## Phases

- [x] **Phase 1: Foundation, Theme & Day 1 Verification Spikes** - Next.js 16.4, React 19.3, shadcn Base UI, Tangerin Dream theme tokens, Dexie database initialization, and Day 1 API spikes. (completed 2026-10-08)
- [ ] **Phase 2: Walk Session & Geolocation Tracking** - Active walk lifecycle with auto-resume, GPS noise filtering, and MapLibre GL trail mapping with OpenFreeMap tiles.
- [ ] **Phase 3: Photo Capture & AI Identification Pipeline** - Native camera capture, 1024px canvas EXIF stripping, `/api/identify` with Gemma/Gemini Flash, Wikipedia taxon verification, and grounded fact cards.
- [ ] **Phase 4: Voice Notes, Narration & Loop Routing** - Hold/tap voice recorder with live waveform, ElevenLabs Scribe STT with Web Speech fallback, TTS narration, and ORS pedestrian loop routes.
- [ ] **Phase 5: Collection, Journal & Export** - Deterministic daily species hunt, Life List categorization on `/collection`, timeline heatmap, and Obsidian-compatible ZIP export.
- [ ] **Phase 6: Polish, Consent Gate, Evaluation & Submission** - Full-screen consent modal, Tegaki handwriting animations, Cuelume audio chimes, `/eval` batch benchmark runner, and outdoor verification.

---

## Phase Details

### Phase 1: Foundation, Theme & Day 1 Verification Spikes

**Goal**: Establish the core web application shell, Dexie client-side database schema, Tangerin Dream design tokens, and verify all external API capabilities (Google AI Studio Gemma/Gemini, MapLibre tile styles, and speech fallback) through automated spikes.  
**Depends on**: Nothing (first phase)  
**Requirements**: CONS-01, CONS-02, CONS-03, CONS-04, DSGN-01, DSGN-02, RATE-01, EVAL-01  
**Success Criteria**:

  1. Next.js app builds cleanly with Next.js 16.4, React 19.3, Tailwind CSS v4, and Tangerin Dream theme variables.
  2. Dexie IndexedDB initializes tables (`walks`, `entries`, `notes`, `speechCache`, `settings`) with live query hooks.
  3. Google AI Studio spike confirms structured candidate extraction and Gemini Flash fallback connectivity.
  4. MapLibre GL successfully loads OpenFreeMap vector style in a test container without API keys.
  5. Isolated `/eval` route harness is scaffolded for benchmark fixtures.  

**Plans**: 3/3 plans executed  

Plans:

- [x] 01-01-PLAN.md
- [x] 01-02-PLAN.md
- [x] 01-03-PLAN.md

**Wave 1**

- [x] 01-01: Next.js 16.4 + React 19.3 scaffold, Tailwind v4, shadcn Base UI setup, and Tangerin Dream theme tokens in `globals.css`.

**Wave 2** *(blocked on Wave 1 completion)*

- [x] 01-02: Dexie.js database schema implementation (`db.ts`), settings store, and in-memory dual-mode rate limiter.

**Wave 3** *(blocked on Wave 2 completion)*

- [x] 01-03: Day 1 verification spikes: Google AI Studio candidate generation, MapLibre OpenFreeMap style loading, and `/eval` harness shell.

---

### Phase 2: Walk Session & Geolocation Tracking

**Goal**: Build the outdoor walk tracking engine with resilient session recovery, GPS jitter suppression, and interactive MapLibre trail mapping.  
**Depends on**: Phase 1  
**Requirements**: WALK-01, WALK-02, WALK-03, GPS-01, GPS-02, MAP-01, MAP-02  
**Success Criteria**:

  1. User can tap "Start Walk" on `/walk` to initialize a track session with persistent status banner.
  2. Refreshing or backgrounding the browser tab automatically resumes the active walk without losing track points.
  3. Geolocation stream rejects readings with accuracy > 35m or displacement < 5m, rendering a smooth polyline trail.
  4. Ending a walk saves total duration, approximate distance, and displays the summary card.  

**Plans**: 2 plans  

Plans:

- [ ] 02-01-PLAN.md — Geolocation noise filter, distance engine & Dexie walk session store
- [ ] 02-02-PLAN.md — MapLibre GL trail map, outdoor HUD, and walk lifecycle interface

---

### Phase 3: Photo Capture & AI Identification Pipeline

**Goal**: Implement the two-tap organism capture workflow, client-side EXIF-stripping compression, Google AI Studio identification, Wikipedia taxon verification, and grounded fact card generation.  
**Depends on**: Phase 2  
**Requirements**: CAPT-01, CAPT-02, CAPT-03, IDEN-01, IDEN-02, IDEN-03, IDEN-04, IDEN-05, FACT-01, FACT-02, FACT-03, FACT-04, FACT-05, FACT-06  
**Success Criteria**:

  1. Tapping the capture button triggers the system camera app and compresses photos to 1024px JPEG (~150KB) on Canvas, stripping all EXIF/GPS tags before storing in Dexie.
  2. `/api/identify` returns up to 3 taxonomic candidates with qualitative confidence or honest refusal for non-organisms/people.
  3. Server resolves candidates on Wikipedia with `redirects=1` and taxon verification, marking biological matches as Verified.
  4. User confirmation triggers `/api/facts` to extract Wikipedia lead sentences, generating fact cards with exact citation numbers and zero edibility/medicinal claims.
  5. Entry detail view (`/entry/[id]`) renders photo, confirmed label, fact card, and attribution link.  

**Plans**: 3 plans  

Plans:

- [ ] 03-01: Camera capture button, HTML5 Canvas re-rasterizer, and Dexie entry storage with local thumbnail generation.
- [ ] 03-02: `/api/identify` route with Vercel AI SDK (Gemma / Gemini Flash fallback) and Wikipedia Action API taxon verification.
- [ ] 03-03: `/api/facts` route with deep lead section extraction, citation validation, edibility scrubbing regex, and entry detail UI.

---

### Phase 4: Voice Notes, Narration & Loop Routing

**Goal**: Integrate multilingual voice notes, audio playback for fact cards, and pedestrian loop route suggestions with robust fallbacks.  
**Depends on**: Phase 3  
**Requirements**: VOIC-01, VOIC-02, VOIC-03, SPK-01, SPK-02, ROUT-01, ROUT-02  
**Success Criteria**:

  1. Walker can record up to 60s of voice notes using either hold-to-record or tap-to-toggle with live audio waveform visualization.
  2. Notes are transcribed via ElevenLabs Scribe or browser Web Speech API fallback, storing editable text and audio in Dexie.
  3. Fact cards feature a working "Listen" button calling TTS with text-hash caching in IndexedDB.
  4. "Suggest a loop" fetches a 1–3km walking loop from OpenRouteService or gracefully informs the user without blocking free-form walking.  

**Plans**: 2 plans  

Plans:

- [ ] 04-01: Audio recording component with Web Audio `AnalyserNode` live waveform, `/api/transcribe` Scribe handler, and Web Speech API fallback.
- [ ] 04-02: Fact card "Listen" TTS player with Dexie speech cache, and `/api/route` OpenRouteService round-trip loop generator.

---

### Phase 5: Collection, Journal & Export

**Goal**: Build the life list collection screen, daily species hunt gamification, past walk timeline with activity heatmap, and full Obsidian-compatible ZIP export.  
**Depends on**: Phase 4  
**Requirements**: HUNT-01, HUNT-02, LIFE-01, JOUR-01, JOUR-02, EXPT-01, SETT-01  
**Success Criteria**:

  1. `/collection` displays all unique confirmed finds grouped by organism kind with date badges and daily hunt progress.
  2. Daily hunt is deterministically seeded from local date (`YYYY-MM-DD`) and celebrates upon completion.
  3. `/journal` renders previous walks grouped by date with statistics and activity heatmap.
  4. Export button generates a downloadable ZIP containing structured Markdown files, images, and full database JSON dump.  

**Plans**: 2 plans  

Plans:

- [ ] 05-01: `/collection` page with daily species hunt rules engine, life list taxon grouping, and completion animation.
- [ ] 05-02: `/journal` timeline with heatmap, walk detail page (`/journal/[walkId]`), and JSZip Obsidian export generator.

---

### Phase 6: Polish, Consent Gate, Evaluation & Submission

**Goal**: Harden the user experience with the global consent gate, Tegaki handwriting animations, Cuelume chimes, automated batch evaluation benchmarks, and outdoor walk verification.  
**Depends on**: Phase 5  
**Requirements**: DSGN-03, DSGN-04, DSGN-05  
**Success Criteria**:

  1. First visit displays the versioned consent modal, blocking camera/mic until accepted and requesting `storage.persist()`.
  2. Fact card headers and hero headline display progressive Tegaki handwriting reveals with accessible web font fallback.
  3. Capture and hunt completion trigger soft synthesized Cuelume chimes (if enabled) and native haptic vibrations.
  4. Batch evaluation harness on `/eval` executes against 30 test fixtures, verifying ≥70% top-3 accuracy and ≥90% refusal.
  5. Production build passes linting (`oxlint`, `fallow`) and is deployed for outdoor field verification.  

**Plans**: 2 plans  

Plans:

- [ ] 06-01: Global consent modal gate (`components/consent-modal.tsx`), Tegaki stroke animation component, and Cuelume sound synthesis helper.
- [ ] 06-02: Benchmark evaluation runner (`app/(dev)/eval`), 30-fixture test set, end-to-end verification audit, and production build checks.

---

## Progress

**Execution Order:**
Phases execute in numeric order: 1 → 2 → 3 → 4 → 5 → 6

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Foundation, Theme & Day 1 Verification Spikes | 4/3 | Complete    | 2026-10-08 |
| 2. Walk Session & Geolocation Tracking | 0/2 | Not started | - |
| 3. Photo Capture & AI Identification Pipeline | 0/3 | Not started | - |
| 4. Voice Notes, Narration & Loop Routing | 0/2 | Not started | - |
| 5. Collection, Journal & Export | 0/2 | Not started | - |
| 6. Polish, Consent Gate, Evaluation & Submission | 0/2 | Not started | - |
