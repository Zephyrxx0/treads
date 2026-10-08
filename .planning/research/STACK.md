# Stack Research

**Domain:** Global Nature-Walk Companion Web Application (Client-First Geolocation, AI Vision & Fact Grounding)  
**Researched:** 2026-10-08  
**Confidence:** HIGH  

---

## Recommended Stack

### Core Technologies

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| **Next.js (App Router)** | `15.x` (`canary`) | Fullstack web application framework, edge & node route handlers, React Server Components (RSC) | Industry benchmark for React-based production web apps. App Router provides zero-bundle-cost server components for marketing pages, isolated API route handlers (`/api/identify`, `/api/facts`, `/api/transcribe`, `/api/speak`, `/api/route`) protecting API keys, and built-in optimization pipelines. |
| **React** | `19.0.0` (`19.x`) | UI runtime and component architecture | First-class Actions, `use()` hook for promise and context unwrapping, automatic compiler optimizations, and seamless integration with Next.js 15 App Router. |
| **Tailwind CSS** | `^4.0.0` (or `^3.4.17` with `@tailwindcss/postcss`) | Utility-first CSS engine and styling architecture | Eliminates style overhead; zero runtime style compilation. Integrates directly with CSS custom properties for theme token binding. |
| **shadcn UI (Base UI preset)** | `@base-ui-components/react` (`^1.0.0-alpha.x`) | Headless, accessible UI component primitives | Replaces Radix UI with Base UI (MUI/Floating UI collaboration) under the shadcn CLI generator pattern. Components are copied directly into the codebase (`components/ui/`), providing complete styling freedom without locked external package dependencies. |
| **Tangerin Dream Theme** | CSS Tokens (TweakCN spec `cmoiegs7i000004l3h5in1zey`) | Warm, organic earthy color palette & typography tokens | Cohesive visual identity specifically fitted to outdoor nature walks (warm amber/tangerine accents, earthy slate neutrals, natural contrast). Pure CSS variables in `:root` and `.dark` blocks with zero runtime overhead. |
| **Dexie.js** | `^4.0.10` (`dexie` + `dexie-react-hooks`) | Client-side IndexedDB wrapper with reactive queries (`useLiveQuery`) | Solves on-device local journal requirements. Pure client storage without requiring server database sync. Handles binary Blobs (1024px camera captures, voice notes) and provides atomic ACID transactions in the browser with `storage.persist()` integration. |
| **MapLibre GL** | `^5.1.0` | Open-source WebGL vector tile map renderer | Fork of Mapbox GL without vendor lock-in or telemetry. Renders 60fps vector maps, GPS breadcrumbs, and custom SVG markers directly on mobile GPU without licensing fees or mandatory API keys. |
| **OpenFreeMap** | Cloud tile endpoint (`liberty` style) | Vector map tile provider and styling | Fully free, open-source vector tile service backed by OpenStreetMap data. Zero API keys, zero rate-limit friction for public map loading, perfectly pairing with MapLibre GL. |
| **Google AI Studio (Gemma & Gemini Flash)** | `@ai-sdk/google` (`^1.1.x`) via Vercel `ai` (`^4.1.x`) | Multimodal organism identification and Wikipedia fact synthesis | Hosted access to Google's open-weight Gemma models (`gemma-2-9b-it` / Gemma 4) for fact generation, with seamless fallback to `gemini-2.0-flash` for multimodal vision identification with strict structured JSON output. |
| **ElevenLabs Scribe & TTS** | REST API v1 (`scribe_v1` STT & ElevenLabs TTS) | Global speech-to-text voice notes and fact card text-to-speech audio narration | Scribe delivers superior multilingual audio transcription with automatic language detection (supporting Hindi, Marathi, Spanish, etc. out of the box). TTS provides lifelike field-guide narration. |
| **Web Speech API** | Browser Native (`webkitSpeechRecognition` / `speechSynthesis`) | Zero-config, offline-tolerant speech fallback | Fallback voice layer when `ELEVENLABS_API_KEY` is omitted in development or quota is exhausted. Requires zero dependencies and zero network roundtrips. |
| **Upstash Redis (Dual-Mode)** | `@upstash/redis` (`^1.34.4`) + `@upstash/ratelimit` (`^2.0.5`) | Distributed rate limiting and fact caching with in-memory dev fallback | Serverless HTTP-based Redis client suited for Vercel edge/node environments. Enforces per-IP token buckets and Wikipedia fact caching. Automatically switches to an in-memory LRU/token bucket in dev if credentials are not configured. |

---

### Supporting Libraries

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| **Zod** | `^3.24.2` | Runtime schema declaration and validation | Validates all incoming API payloads (`/api/identify`, `/api/facts`), outgoing structured JSON from LLMs, and IndexedDB model definitions. |
| **Motion (`motion/react`)** | `^12.4.7` | Hardware-accelerated UI transitions and physics micro-animations | Sprout loading indicator, leaf-unfurl card entrance, capture seed-drop feedback, and layout transitions. |
| **JSZip** | `^3.10.1` | In-browser archive compression | Obsidian-compatible export (`walks/`, `species/`, `media/`, `treads-backup.json`) assembled entirely client-side without sending user files to the server. |
| **OpenRouteService REST** | API v2 (`/v2/directions/foot-walking`) | Pedestrian loop routing suggestions | Generating 1km, 2km, 3km round-trip walking routes. Proxied through Next.js server route to protect API key. |
| **Lucide React** | `^1.16.0` | Accessible, consistent icon system | Navigation, action buttons, taxonomic category markers (footprint, leaf, sprout, tree). |
| **Lenis** | `^1.1.20` | Smooth momentum scrolling | Landing page (`/`) only. Disabled in app views (`/walk`, `/journal`) to preserve native mobile scroll physics. |
| **Cuelume (Synthesized Web Audio)** | Web Audio Native Recipe (`lib/audio/cuelume.ts`) | Synthesized UI audio chimes (capture snap, hunt celebration) | Lightweight audio feedback without loading static `.mp3`/`.wav` assets. Disabled by default in settings. |
| **Tegaki (Progressive Handwriting)** | SVG Dash Offset + Font Fallback (`components/motion/tegaki-text.tsx`) | Handwriting stroke reveals for field notes | Landing hero and first fact card view. Built with `motion/react` and Google Font `Caveat` fallback. |
| **clsx & tailwind-merge** | `^2.1.1` & `^3.0.2` | Dynamic class concatenation and Tailwind utility conflict resolution | Essential utility (`cn()`) across all shadcn components. |

---

### Development Tools

| Tool | Purpose | Notes |
|------|---------|-------|
| **pnpm** | Strict, deterministic package manager | Fast installs, content-addressable storage, avoids phantom dependency resolution errors common in npm/yarn. |
| **oxlint** | High-performance Rust-based linter | Fast lint checks during pre-commit and CI; catches syntax and React hook mistakes in milliseconds. |
| **fallow** | Dead-code and unused export detector | Audits project exports to eliminate unused component bloat before feature freeze. |
| **graphify** | Code dependency mapping | Visualizes circular dependencies and cross-module couplings in app structure. |
| **TypeScript** | Static typing engine (`^5.7.x`) | Strict mode enabled (`strict: true`, `noImplicitAny: true`) across API routes and client state. |

---

## Installation

```bash
# Core Next.js, React 19, and Styling
pnpm add next@canary react@rc react-dom@rc
pnpm add tailwindcss @tailwindcss/postcss postcss clsx tailwind-merge class-variance-authority

# UI Primitives, Animation & Icons
pnpm add @base-ui-components/react motion lucide-react lenis

# Storage, Validation & AI Engine
pnpm add dexie dexie-react-hooks zod jszip
pnpm add ai @ai-sdk/google

# Mapping & Geolocation
pnpm add maplibre-gl

# Production Cache & Rate Limiting (Optional in local dev)
pnpm add @upstash/redis @upstash/ratelimit
```

```bash
# Dev dependencies & Tooling
pnpm add -D typescript @types/node @types/react @types/react-dom @types/maplibre-gl @types/jszip oxlint
```

---

## Alternatives Considered

| Recommended | Alternative | When to Use Alternative |
|-------------|-------------|-------------------------|
| **Next.js App Router** | Vite + React SPA | Use Vite if the project has zero server-side requirements. Next.js was selected because secure API proxying is mandatory to protect Google AI Studio, ElevenLabs, and ORS API keys from browser inspection. |
| **shadcn (Base UI)** | Radix UI / MUI Core | Radix is standard for shadcn, but Base UI provides unstyled primitives with cleaner React 19 support, modern CSS anchor positioning, and zero dependency conflicts. |
| **Dexie (IndexedDB)** | SQLite (WASM/OPFS) or WatermelonDB | SQLite WASM is powerful for complex relational queries but adds heavy WASM binaries (~1-2MB download) and SharedArrayBuffer COOP/COEP headers that interfere with external map tiles and CDNs. Dexie is native, zero-dependency, and lightweight (~20KB). |
| **MapLibre GL + OpenFreeMap** | Leaflet with OSM raster tiles | Leaflet is simpler, but raster tiles look blurry on high-DPI smartphone displays, cannot dynamically tilt or rotate with walking compass orientation, and consume more cellular data than vector tiles. |
| **Google AI Studio (Gemma / Gemini)** | Local WebLLM / Transformers.js | On-device browser models require downloading 2GB+ model weights to mobile devices, draining outdoor walking battery and crashing mobile WebGL contexts. Google AI Studio keeps inference off-device, delivering ~2–4s turnarounds. |
| **ElevenLabs Scribe** | On-device Whisper WASM | Whisper WASM takes 30–60s on mobile CPU/GPU and lacks reliable Hindi/Marathi/accents on small quantization levels. Scribe processes 60s of multilingual audio in <2s server-side. |
| **Dual-Mode (Memory + Upstash)** | PostgreSQL / Supabase | A full database is unnecessary and introduces server-side persistence that conflicts with user privacy principles (zero server journal storage). Upstash only stores ephemeral rate-limiting tokens and public Wikipedia fact summaries. |

---

## What NOT to Use

| Avoid | Why | Use Instead |
|-------|-----|-------------|
| **Capacitor / React Native** | PRD explicitly targets mobile web on Android Chrome and desktop. Wrapping adds native build overhead, App Store/Play Store review blockers, and device plugin debugging. | Native PWA / responsive web app with standard browser APIs (`<input capture>`, `navigator.geolocation`, `navigator.vibrate`). |
| **Offline PMTiles / Service Worker Sync** | PRD explicitly cuts offline mode ("Online only. No offline modes, no offline caches, no fallback chains"). Offline vector tiles require tens of megabytes of downloads, complex cache invalidation, and custom worker protocols. | OpenFreeMap vector tile endpoint via MapLibre GL with clean UI error states on network drop. |
| **Raw Unfiltered Model Memory Facts** | LLM hallucination risk for biological organisms. Hallucinations can suggest toxic plants or incorrect species taxonomy. | Wikipedia Action API / REST API deep lead text extraction + strict cited sentence verification. |
| **Client-Side Direct AI/Voice Calls** | Exposes private API keys (`GOOGLE_GENERATIVE_AI_API_KEY`, `ELEVENLABS_API_KEY`) to browser devtools and network inspection. | Server-side Next.js Route Handlers (`/api/identify`, `/api/facts`, `/api/transcribe`, `/api/speak`). |
| **Full Canvas EXIF Retainers** | Violates privacy; raw photos contain precise home/walk GPS coordinates, camera serial numbers, and capture timestamps. | Canvas re-rasterization to 1024px JPEG (Q=0.82) to strip all EXIF metadata before network or Dexie storage. |
| **Overpass API (Live OSM Queries)** | Slow (5–15s query latencies), frequent 429/504 timeouts, heavy query language complexity. | Pre-configured OpenRouteService walking loop routing endpoint. |

---

## Stack Patterns by Variant

### 1. AI Vision Candidate Identification (`/api/identify`)
**If `GOOGLE_GENERATIVE_AI_API_KEY` is present and Gemma 4 supports vision + structured JSON:**
- Use `google('gemma-4')` via `@ai-sdk/google`
- Because it delivers open-weight identification directly aligned with the open-source mission.

**If Gemma 4 lacks vision input or fails strict JSON schema generation during Day 1 spikes:**
- Use `google('gemini-2.0-flash')` for the vision identification stage (`/api/identify`), while retaining `google('gemma-2-9b-it')` for text fact synthesis (`/api/facts`).
- Because vision identification requires multimodal token ingestion and JSON schema compliance to return valid candidate lists.

### 2. Voice Notes & Narration (`/api/transcribe` & `/api/speak`)
**If `ELEVENLABS_API_KEY` is configured:**
- Use ElevenLabs Scribe API for `/api/transcribe` and ElevenLabs TTS for `/api/speak`.
- Because it produces high-fidelity transcriptions across 90+ languages with auto-detection and natural narration voice.

**If `ELEVENLABS_API_KEY` is missing or quota exhausted:**
- Fall back client-side to native Web Speech API (`webkitSpeechRecognition` for dictation, `window.speechSynthesis` for audio playback) and manual text entry.
- Because developers and users without paid ElevenLabs credentials must retain full functionality without build errors.

### 3. Rate Limiting & Fact Caching
**If `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` are configured (Production):**
- Use `@upstash/ratelimit` with Redis sliding window tokens and Redis string keys (`facts:${wikipediaTitle}:${promptVersion}`).
- Because distributed serverless lambdas share state and prevent endpoint abuse across IP clusters.

**If Upstash credentials are empty (Local Development):**
- Use in-memory `Map` with an LRU eviction policy and token-bucket algorithm (`lib/cache/memory-cache.ts`).
- Because local development and test runs work out of the box with zero external infrastructure setup.

### 4. Routing & Loop Suggestions (`/api/route`)
**If `ORS_API_KEY` is configured:**
- Call OpenRouteService `/v2/directions/foot-walking` with round-trip options to return a closed GeoJSON loop.
- Because it gives the user structured trail guidance on unfamiliar routes.

**If `ORS_API_KEY` is missing or upstream fails:**
- Gracefully return `available: false` and render the walk view in free-form mode with GPS breadcrumbs.
- Because routing is an optional enhancement (Should/Could priority), and walks must never be blocked by external map services.

---

## Version Compatibility

| Package A | Compatible With | Notes |
|-----------|-----------------|-------|
| `next@15.x` (`canary`) | `react@19.x`, `react-dom@19.x` | Next.js 15 requires React 19. Ensure async route handler params (`const { id } = await params`) are awaited to adhere to Next.js 15 breaking changes. |
| `maplibre-gl@^5.1.0` | Next.js App Router | `maplibre-gl` references `window` and WebGL contexts during module initialization. It MUST be imported dynamically (`next/dynamic` with `ssr: false`) or initialized inside a client-side `useEffect` hook. |
| `@base-ui-components/react` | `react@19.x` | Base UI components are designed without legacy React context patterns, providing seamless compatibility with React 19 compiler and server components. |
| `dexie@^4.0.10` | Browser IndexedDB | IndexedDB is unavailable on Node.js/SSR environments. All Dexie operations must be confined to client components (`'use client'`) or guarded by `typeof window !== 'undefined'`. |
| `@ai-sdk/google@^1.1.x` | `ai@^4.1.x` | Ensure Vercel AI SDK version 4.x is installed; version 3.x uses deprecated streaming patterns and incompatible provider APIs. |
| `tailwindcss@^4.0.0` | PostCSS / `@tailwindcss/postcss` | Tailwind v4 uses CSS-first configuration (`@theme` in CSS). If using Tailwind v3, ensure standard `tailwind.config.ts` matches Tangerin Dream CSS variable names. |

---

## Sources

- [DECISIONS.md](file:///home/zeph/Code/treads/DECISIONS.md) — Locked decisions matrix, acquisition registry, and architectural specifications
- [PRD.md](file:///home/zeph/Code/treads/PRD.md) — Product requirements, MoSCoW priorities, and library status register
- [Vercel AI SDK Documentation](https://ai-sdk.dev/docs) — Verified `@ai-sdk/google` usage, model configurations, and structured output patterns
- [MapLibre GL Documentation](https://maplibre.org/maplibre-gl-js/docs/) — Vector tile styling and Next.js client-side integration rules
- [OpenFreeMap Documentation](https://openfreemap.org/) — Vector tile endpoint URLs and liberty style JSON structure
- [Dexie.js Documentation](https://dexie.org/docs/) — `useLiveQuery` hooks and persistent storage requests

---
*Stack research for: Global Nature-Walk Companion Web Application (Treads)*  
*Researched: 2026-10-08*
