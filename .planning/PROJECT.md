# Treads

## What This Is

Treads is a global nature-walk companion web application for casual walkers, curious parents, and amateur naturalists. On an outdoor walk, walkers photograph living organisms, an open-weight AI model identifies them, the server verifies and grounds facts exclusively in Wikipedia text, and audio voice notes can be recorded in any language. The entire journal, trail map, and life list live privately on the device in IndexedDB.

## Core Value

Get from launch to first organism capture in two taps, delivering fast, honest, Wikipedia-grounded identification that stays entirely private on the user's phone.

## Requirements

### Validated

(None yet — ship to validate)

### Active

- [ ] **CONSENT-01**: Global first-run consent gate blocking camera/mic until accepted with version tracking
- [ ] **WALK-01**: Active walk session tracking with auto-resume across reload and backgrounding
- [ ] **PHOTO-01**: System camera photo capture with HTML5 Canvas EXIF/GPS stripping and 1024px JPEG resizing
- [ ] **GPS-01**: Real-time geolocation tracking with GPS drift filtering (accuracy ≤ 35m, displacement ≥ 5m)
- [ ] **MAP-01**: MapLibre GL map rendering with OpenFreeMap tiles (`liberty` style) and capture pins
- [ ] **AI-01**: AI organism identification via Google AI Studio (Gemma with Gemini Flash fallback) returning top 3 candidates
- [ ] **WIKI-01**: Wikipedia taxon verification validating biological taxonomy and resolving redirects
- [ ] **FACTS-01**: Sourced fact card generator citing numbered Wikipedia sentences, stripped of toxic/edibility advice
- [ ] **VOICE-01**: Voice notes with hold-to-record & tap toggle, live waveform, ElevenLabs Scribe STT, and Web Speech API fallback
- [ ] **LISTEN-01**: Text-to-speech audio narration for fact cards with device-level audio caching
- [ ] **ROUTE-01**: Optional loop route suggestion via OpenRouteService with graceful degradation to free-form walks
- [ ] **HUNT-01**: Daily species hunt seeded deterministically by date hash (`YYYY-MM-DD`)
- [ ] **LIFE-01**: Collection / Life list grouped by taxonomic kind (Trees, Flowers, Plants, Birds, Insects, etc.)
- [ ] **JOURNAL-01**: Historical walk journal with timeline, species counts, and contribution heatmap
- [ ] **EXPORT-01**: Full journal export to Obsidian-compatible ZIP (Markdown + photos + JSON backup)
- [ ] **THEME-01**: Tangerin Dream design system implementation with shadcn Base UI primitives and Motion animations
- [ ] **TEGAKI-01**: Progressive Tegaki handwriting reveals with accessible web font fallback
- [ ] **AUDIO-01**: Synthesized Cuelume audio chimes (off by default) and haptic feedback
- [ ] **CACHE-01**: Dual-mode rate limiting and fact caching (in-memory dev, Upstash Redis prod)
- [ ] **EVAL-01**: Isolated `app/(dev)/eval` batch evaluation harness with benchmark sample set

### Out of Scope

- Offline mode, offline caches, service-worker sync, or PMTiles — Online only by design to keep the pipeline simple and reliable.
- User accounts, server-side sync, or social feeds — Journal remains 100% on-device for total privacy.
- Edibility, foraging, safety, or medicinal advice — Explicitly banned and filtered out of fact cards.
- Native iOS/Android app wrappers or Capacitor — Focused on mobile web on Android and desktop Chrome.
- Background geolocation tracking with phone locked — Web location foreground only.
- Bird-call audio identification — Visual organism identification only.

## Context

- 5-Day Hackathon build (Challenge theme: "Touch Grass")
- Hardware target: Android Chrome (outdoors) and desktop Chrome
- Open-weight AI demonstration showing transparent sourcing against Wikipedia
- Hardware constraints: Location only samples while the browser screen is on

## Constraints

- **Tech Stack**: Next.js 16.4 (App Router, Cache Components, Agent features, Lazy dynamic imports), React 19.3, Tailwind CSS, shadcn (Base UI), Dexie (IndexedDB), MapLibre GL
- **AI Backend**: Google AI Studio API key (`GOOGLE_GENERATIVE_AI_API_KEY`)
- **Speech**: ElevenLabs Creator plan for Scribe batch STT and TTS, with browser Web Speech API fallback
- **Maps & Tiles**: OpenFreeMap (free tiles) and OpenRouteService (2,000 req/day cap)
- **Timeframe**: 5 days to complete MVP, audit, outdoor walk validation, and video demo submission

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Next.js 16.4 App Router + React 19.3 | Cutting-edge framework with Cache Components, agent features, lazy dynamic imports, and performance | — Pending |
| Tangerin Dream theme only | Single, cohesive aesthetic for nature walk field journal | — Pending |
| Canvas EXIF stripping client-side | Privacy protection & payload reduction (~150KB) | — Pending |
| Gemini Flash vision fallback for Gemma | Guarantees multimodal JSON identification if Gemma vision is limited | — Pending |
| Wikipedia Action API deep lead text | Provides 10–25 sentences so model reliably extracts 3 distinct cited facts | — Pending |
| Browser Web Speech fallback for ElevenLabs | Enables zero-friction local development without API keys | — Pending |
| In-memory dev cache + Upstash prod | Zero external signup required for development | — Pending |
| Deterministic date hash daily hunt | Client-side daily challenge rotation without server state | — Pending |
| Isolated `app/(dev)/eval` route | Benchmark suite that can be ripped out cleanly for production | — Pending |

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each phase transition** (via `/gsd-transition`):
1. Requirements invalidated? → Move to Out of Scope with reason
2. Requirements validated? → Move to Validated with phase reference
3. New requirements emerged? → Add to Active
4. Decisions to log? → Add to Key Decisions
5. "What This Is" still accurate? → Update if drifted

**After each milestone** (via `/gsd-complete-milestone`):
1. Full review of all sections
2. Core Value check — still the right priority?
3. Audit Out of Scope — reasons still valid?
4. Update Context with current state

---
*Last updated: 8 October 2026 after initialization*

