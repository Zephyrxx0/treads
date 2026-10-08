# Project Research Summary

**Project:** Treads  
**Domain:** Mobile Web Nature Walk Companion (PWA / Field Journal)  
**Researched:** 8 October 2026  
**Confidence:** HIGH  

---

## Executive Summary

Treads is a privacy-first mobile web application for casual nature walkers that identifies living organisms from camera captures, grounds facts strictly in Wikipedia text, supports multilingual voice notes, and stores all personal journal data exclusively on the user's device in IndexedDB. Built under a 5-day hackathon timeline for the "Touch Grass" theme, the app prioritizes minimal screen engagement ("the screen is the shortest part of the experience: capture fast, review later"), honest taxonomic uncertainty over confident guesses, and verifiable open-weight AI execution.

The research establishes an architecture centered on **client-side autonomy and serverless stateless proxies**: the entire journal, media blobs, active walk trail, and life list live locally in **Dexie.js (IndexedDB)** with `navigator.storage.persist()`. Server routes (`/api/identify`, `/api/facts`, `/api/transcribe`, `/api/speak`, `/api/route`) act strictly as stateless API proxies keeping vendor secrets off the client, while enforcing dual-mode rate limiting (in-memory for local development, Upstash Redis for production).

The primary technical risks identified—Android mobile browser tab freezing, GPS wander/spiderweb drift under tree canopies, 48MP+ mobile camera memory spikes causing canvas crashes, and AI foraging/edibility hallucinations—have concrete, validated architectural mitigations: continuous write-through IndexedDB persistence with session auto-resumption, multi-tier GPS accuracy and displacement thresholding, client-side canvas re-rasterization to 1024px JPEG (~150KB) that natively strips EXIF metadata, and automated regex/prompt stripping of any toxic, edibility, or medicinal claims.

---

## Key Findings

### Recommended Stack

See detailed specification in [.planning/research/STACK.md](file:///.planning/research/STACK.md).

- **App Framework & Runtime**: Next.js 16.4 (App Router, Cache Components, new agent features, lazy dynamic imports) with React 19.3, TypeScript (`strict: true`), and `pnpm`.
- **UI & Design System**: Tailwind CSS v4 with Tangerin Dream CSS custom property tokens, shadcn UI components backed by `@base-ui-components/react`, Lucide icons, and `motion/react`. Progressive Tegaki handwriting reveals with web font fallback.
- **Local Storage**: Dexie.js (`dexie`, `dexie-react-hooks`) for IndexedDB with `storage.persist()` and live queries.
- **Maps & Geolocation**: MapLibre GL with OpenFreeMap vector tiles (`liberty` style) and OpenRouteService pedestrian routing.
- **AI Vision & Fact Engine**: Vercel AI SDK (`ai` + `@ai-sdk/google`) connecting to Google AI Studio Gemma open-weights (with Gemini 2.0 Flash fallback for vision candidate identification).
- **Voice & Narration**: ElevenLabs Scribe STT and TTS with zero-friction browser Web Speech API (`webkitSpeechRecognition` / `speechSynthesis`) fallback and live Web Audio waveform visualization.
- **Rate Limiting & Caching**: Dual-mode in-memory dev cache and token bucket, upgrading automatically to Upstash Redis in production.
- **Export & Audio Micro-FX**: Obsidian-compatible ZIP export via JSZip, Web Audio synthesized UI chimes via Cuelume oscillator recipes, and native device haptic vibration.

### Expected Features

See detailed feature hierarchy in [.planning/research/FEATURES.md](file:///.planning/research/FEATURES.md).

**Must Have (Table Stakes):**
- Two-tap photo capture launching native camera `<input capture="environment">`.
- Client-side Canvas EXIF & GPS stripping (1024px JPEG, Q=0.82).
- Top-3 candidate identification with qualitative confidence tiers (Likely, Possible, Unsure).
- Wikipedia biological taxon existence and redirect verification.
- Grounded fact cards citing numbered Wikipedia lead sentences.
- Active walk tracking with continuous write-through and auto-resume on tab reload.
- MapLibre GL map rendering with OpenFreeMap tiles and capture pins.
- Local IndexedDB journal with entry detail, life list, and Obsidian ZIP export.
- Global first-run consent gate blocking camera/mic until accepted.

**Should Have (Differentiators):**
- Multilingual voice notes via ElevenLabs Scribe with browser Web Speech API fallback.
- Audio narration ("Listen" button) reading fact cards aloud with local audio caching.
- Deterministic client-side daily species hunt seeded by `YYYY-MM-DD` date hash.
- Pedestrian loop route suggestion ("Suggest a loop") via OpenRouteService with graceful degradation.
- Tangerin Dream aesthetic with Tegaki handwriting animation and synthesized Cuelume chimes.
- Contribution activity heatmap in the journal view.

**Defer (Out of Scope):**
- Accounts, user logins, and cloud databases (100% on-device privacy guarantee).
- Social feeds, leaderboards, or public geotag sharing (prevents screen addiction and plant poaching).
- Offline service worker caching, PMTiles, or sync queues (online-only fixed scope).
- Edibility, foraging, or medicinal advice (strictly banned and scrubbed).

### Architecture Approach

See full architecture design in [.planning/research/ARCHITECTURE.md](file:///.planning/research/ARCHITECTURE.md).

1. **Client-First Reactive Core**: Dexie IndexedDB acts as the single source of truth. UI subscribes via `useLiveQuery()`. Walk state is written continuously, allowing instant recovery if Android Chrome suspends the tab.
2. **Stateless Edge Proxy Routes**: Next.js route handlers (`/api/*`) accept size-capped payloads, inject server-side API keys, validate inputs with Zod, and return structured JSON.
3. **Dual-Stage Fact Pipeline**: Candidate verification resolves Wikipedia taxon metadata; fact generation extracts 10–25 sentences from Wikipedia Action API extracts, numbers each sentence, prompts Gemma for citations, and validates them server-side before delivery.

### Critical Pitfalls & Mitigations

See full analysis in [.planning/research/PITFALLS.md](file:///.planning/research/PITFALLS.md).

1. **Android Chrome Tab Killing & State Loss**: Continuous Dexie persistence for every breadcrumb and capture; `useActiveWalk` auto-resumes any walk where `endedAt == null`.
2. **GPS Drift & Wander**: Reject readings with accuracy > 35m; discard displacement < 5m (unless 15s elapsed); clamp walking speed to 15 km/h.
3. **Mobile Camera Heap Spikes (48MP–108MP)**: Decode and downsample on Canvas to 1024px max edge before memory allocation grows; re-export as ~150KB JPEG.
4. **Wikipedia Disambiguation & Hallucinations**: Enforce biological taxon page verification (`redirects=1`, category/taxobox validation) before generating facts.
5. **Edibility / Foraging Liability**: Strict system prompt ban + server-side regex scrubber purging banned words (`edible`, `toxic`, `poison*`, `medicinal`) + mandatory disclaimer.
6. **API Quota Exhaustion**: Dual-mode IP token bucket rate limiting (Upstash Redis / in-memory dev) + local client fact & speech caching.

---

## Implications for Roadmap

Suggested 5-day / 6-phase execution structure aligned with [PRD.md](file:///home/zeph/Code/treads/PRD.md#L140-L147):

### Phase 1: Foundation, Theme & Day 1 Verification Spikes
- **Rationale**: Validates foundational gates before building product logic: Next.js 16.4 + React 19.3 + shadcn Base UI + Tangerin Dream theme, Dexie database initialization, Google AI Studio vision/structured output spike, MapLibre OpenFreeMap spike, and speech fallback spike.
- **Delivers**: Project scaffolding, theme tokens, database schemas, and passing Day 1 verification tests.
- **Avoids**: Late discovery of Gemma vision limitations or MapLibre styling errors.

### Phase 2: Walk Session & Geolocation Tracking
- **Rationale**: The walk is the central container for all captures and notes. Must be reliable outdoors.
- **Delivers**: Start/end walk lifecycle, foreground GPS tracking, jitter filtering, active walk auto-resume, MapLibre trail polyline and capture pins.
- **Avoids**: Tab crash data loss and GPS spiderweb wander.

### Phase 3: Photo Capture & AI Identification Pipeline
- **Rationale**: The core value proposition—photograph an organism, identify candidates, verify on Wikipedia, generate grounded fact cards.
- **Delivers**: Camera capture with Canvas EXIF stripping, `/api/identify` with Gemma/Gemini Flash, Wikipedia taxon verification, `/api/facts` with sentence citations and edibility scrubber, and entry detail view.
- **Avoids**: Camera OOM crashes, non-organism hallucinations, and foraging safety liabilities.

### Phase 4: Voice Notes, Narration & Loop Routing
- **Rationale**: Enriches the walk with peripheral sensory capabilities while keeping them graceful under network/credential absence.
- **Delivers**: Hold/tap voice recorder with live waveform, `/api/transcribe` with ElevenLabs Scribe and Web Speech API fallback, `/api/speak` TTS with client audio cache, and ORS pedestrian loop routing with free-form fallback.
- **Avoids**: Broken audio recording on rough terrain and routing API quota lockouts.

### Phase 5: Collection, Journal & Export
- **Rationale**: Completes the lifecycle by allowing walkers to reflect on, organize, and export their finds.
- **Delivers**: Deterministic daily species hunt, Life List on `/collection`, historical journal with heatmap and timeline, and Obsidian-compatible ZIP export.
- **Avoids**: Mobile browser disk eviction without export options.

### Phase 6: Polish, Consent Gate, Evaluation & Submission
- **Rationale**: Hardens the app for judging, outdoor testing, and submission assets.
- **Delivers**: Global first-run consent modal, Tegaki handwriting animations, Cuelume audio chimes, `/eval` batch benchmark runner, real outdoor walk validation, and documentation.
- **Avoids**: Consent violations, theme inconsistencies, and unverified accuracy metrics.

---

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | Modern Next.js 16.4 + React 19.3 + Dexie + MapLibre + Vercel AI SDK stack fully verified |
| Features | HIGH | Clear MoSCoW boundaries aligned with solo 5-day hackathon timeline |
| Architecture | HIGH | Zero-server IndexedDB model eliminates backend infrastructure fragility |
| Pitfalls | HIGH | Deeply researched mobile web browser constraints and safety mitigations |

**Overall confidence:** HIGH

---

## Sources

### Primary (HIGH confidence)
- Next.js 16.4 App Router & React 19.3 Documentation
- Vercel AI SDK Core & `@ai-sdk/google` Specification
- Dexie.js 4.0 IndexedDB API & `storage.persist()` W3C Standard
- MapLibre GL JS Documentation & OpenFreeMap Tiles Style Specification
- Wikipedia Action API (`prop=extracts`) & REST API (`/page/summary`)

### Secondary (MEDIUM confidence)
- OpenRouteService `/v2/directions/foot-walking` Round Trip API
- ElevenLabs Scribe STT & Text-to-Speech Documentation
- W3C Web Speech API (`webkitSpeechRecognition`) Browser Compatibility Matrix

---
*Research completed: 8 October 2026*  
*Ready for roadmap: yes*

