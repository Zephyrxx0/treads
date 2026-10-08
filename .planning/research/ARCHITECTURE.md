# Architecture Research

**Domain:** Nature-Walk Companion PWA & Grounded AI Field Journal  
**Researched:** 2026-10-08  
**Confidence:** HIGH  

---

## Standard Architecture

### System Overview

Treads is built as a **Client-First, Privacy-Centric Progressive Web Application (PWA)** backed by **Stateless Serverless Proxy Routes**. All journal data, GPS tracks, photos, voice notes, and user settings persist exclusively on the client in **IndexedDB via Dexie.js**. The serverless backend holds no persistent database or session state; it operates strictly as a hardened API gateway to protect API secrets, enforce token-bucket rate limiting, proxy upstream requests (Google AI Studio, Wikipedia, ElevenLabs, OpenRouteService), and validate AI inputs/outputs against strict taxonomic and safety schemas.

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                                CLIENT / BROWSER RUNTIME                                │
├────────────────────────────────────────────────────────────────────────────────────────┤
│  PRESENTATION LAYER (Next.js 15+ App Router, React 19, Tangerin Dream Theme)          │
│  ┌───────────────────┐  ┌───────────────────┐  ┌──────────────────┐  ┌───────────────┐ │
│  │ /walk (Map/Cam)   │  │ /journal (History)│  │ /collection(Hunt)│  │ /entry/[id]   │ │
│  └─────────┬─────────┘  └─────────┬─────────┘  └────────┬─────────┘  └───────┬───────┘ │
│            │                      │                     │                    │         │
├────────────┴──────────────────────┴─────────────────────┴────────────────────┴─────────┤
│  CORE DOMAIN & CONTROLLER HOOKS                                                        │
│  ┌───────────────────────┐  ┌──────────────────────┐  ┌──────────────────────────────┐ │
│  │ useActiveWalk         │  │ useCapturePipeline   │  │ useVoiceRecorder             │ │
│  │ - Session recovery    │  │ - Canvas EXIF strip  │  │ - Hold/Tap toggle            │ │
│  │ - GPS noise filter    │  │ - 1024px JPEG resize │  │ - Live Waveform analyser     │ │
│  └───────────┬───────────┘  └──────────┬───────────┘  └──────────────┬───────────────┘ │
│              │                         │                             │                 │
├──────────────┴─────────────────────────┴─────────────────────────────┴─────────────────┤
│  CLIENT PERSISTENCE & LOCAL ENGINE LAYER                                               │
│  ┌───────────────────────────────────────────────────────────────────────────────────┐ │
│  │ Dexie IndexedDB (`treads_db` v1)                                                  │ │
│  │ - walks (trackPoints, distance, duration)                                         │ │
│  │ - entries (photo blob, coordinates, candidates, confirmed taxon, facts)           │ │
│  │ - notes (audio blob, transcript, language)                                        │ │
│  │ - speechCache (sha256 textHash -> audio blob)                                     │ │
│  │ - settings (consent version, haptics, cuelume audio)                              │ │
│  └───────────────────────────────────────────────────────────────────────────────────┘ │
│  ┌────────────────────────────────────────┐  ┌───────────────────────────────────────┐ │
│  │ MapLibre GL + OpenFreeMap Vector Tiles │  │ Client-Side JSZip Obsidian Exporter   │ │
│  └────────────────────────────────────────┘  └───────────────────────────────────────┘ │
└────────────────────────────────────┬───────────────────────────────────────────────────┘
                                     │ HTTPS JSON / FormData (Zero Auth Cookies / Tokens)
                                     ▼
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                       SERVERLESS PROXY LAYER (Next.js Route Handlers)                  │
├────────────────────────────────────────────────────────────────────────────────────────┤
│  SECURITY, LIMITS & CACHING SHIELD                                                     │
│  ┌───────────────────────────────────────────────────────────────────────────────────┐ │
│  │ Dual-Mode Rate Limiter & Fact Cache: Upstash Redis (Prod) / In-Memory LRU (Dev)   │ │
│  │ Global Kill-Switch (`NEXT_PUBLIC_DISABLE_AI`) + Zod Input Validation              │ │
│  └───────────────────────────────────────────────────────────────────────────────────┘ │
│                                                                                        │
│  API GATEWAY ROUTES                                                                    │
│  ┌───────────────┐ ┌───────────────┐ ┌────────────────┐ ┌──────────────┐ ┌───────────┐ │
│  │ /api/identify │ │ /api/facts    │ │ /api/transcribe│ │ /api/speak   │ │ /api/route│ │
│  └───────┬───────┘ └───────┬───────┘ └────────┬───────┘ └──────┬───────┘ └─────┬─────┘ │
└──────────┼─────────────────┼──────────────────┼────────────────┼───────────────┼───────┘
           │                 │                  │                │               │
           ▼                 ▼                  ▼                ▼               ▼
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                               THIRD-PARTY UPSTREAM SERVICES                            │
├──────────────────────────────────┬─────────────────────────────┬───────────────────────┤
│ Google AI Studio                 │ Wikimedia Foundation        │ ElevenLabs API        │
│ - Gemma 4 / Gemini 2.0 Flash     │ - Action API (Lead extracts)│ - Scribe STT (Batch)  │
│ - Open-weight candidate proposer │ - REST Summary API          │ - TTS Speech Audio    │
├──────────────────────────────────┼─────────────────────────────┴───────────────────────┤
│ OpenFreeMap                      │ OpenRouteService                                    │
│ - Vector map style (`liberty`)   │ - Directions v2 (Pedestrian round-trip loop)        │
└──────────────────────────────────┴─────────────────────────────────────────────────────┘
```

---

### Component Responsibilities

| Component | Responsibility | Typical Implementation |
|-----------|----------------|------------------------|
| **Consent Gate** | Blocks `/walk`, camera, and mic access until versioned terms are accepted; requests `navigator.storage.persist()`. | Full-screen React modal mounted in root layout, querying `db.settings.get('consent')`. |
| **Active Walk Manager** | Lifecycle tracking (start, auto-resume on reload/crash, end summary) and GPS coordinate ingestion. | Custom hook `useActiveWalk` backed by Dexie `walks` table and `navigator.geolocation.watchPosition`. |
| **GPS Noise Filter** | Discards multipath jitter, low-accuracy reads, and static drift to ensure clean polyline trails. | Pure function filtering: rejects `accuracy > 35m`, rejects `distance < 5m` unless `dt > 15s`, speed cap 15 m/s. |
| **Image Preprocessor** | Strips EXIF/GPS metadata and compresses camera photos before local persistence or network transmission. | HTML5 Canvas drawing, downscaling to max dimension 1024px, exporting as JPEG `0.82` (~150KB Blob). |
| **Map Engine** | Renders interactive vector maps, user geolocation marker, active trail polyline, and organism capture pins. | `maplibre-gl` wrapping OpenFreeMap vector tile endpoint (`https://tiles.openfreemap.org/styles/liberty`). |
| **`/api/identify`** | Vision model inference to propose up to 3 candidate taxa, followed by Wikipedia existence check. | Route handler calling `@ai-sdk/google` (Gemma/Gemini Flash) with Zod structured output + Wikipedia Action API verify. |
| **`/api/facts`** | Fetches deep lead section (10–25 sentences) from Wikipedia, numbers sentences, prompts writer model, validates citations. | Route handler with Redis/LRU caching, Wikimedia Action API, sentence segmenter, Zod citation validator. |
| **`/api/transcribe`** | Converts user voice notes to text in any spoken language. | Route handler proxying ElevenLabs Scribe API, with browser Web Speech API client fallback if key is absent. |
| **`/api/speak`** | Synthesizes fact card summaries into spoken audio. | Route handler proxying ElevenLabs TTS; client caches MP3 audio in Dexie `speechCache` by SHA-256 text hash. |
| **`/api/route`** | Calculates circular walking loops from current GPS coordinates for 1–3 km routes. | Route handler proxying OpenRouteService `foot-walking` round-trip endpoint with graceful fallback to free-form walk. |
| **Dual-Mode Rate Limiter** | Prevents API key quota exhaustion and endpoint abuse across all 5 serverless routes. | Multi-tier token bucket: In-memory Map in development; `@upstash/ratelimit` via Redis REST in production. |
| **Export Engine** | Bundles journal entries, markdown field notes, photos, and JSON backup into a single download. | Client-side `jszip` creating an Obsidian-compatible directory structure with full local Dexie JSON dump. |

---

## Recommended Project Structure

```
treads/
├── app/
│   ├── (app)/                          # Core application routes (wrapped in BottomNav & ConsentGate)
│   │   ├── walk/                       # Active walk & organism capture cockpit
│   │   │   └── page.tsx
│   │   ├── journal/                    # Historical walk timeline & heatmap
│   │   │   ├── page.tsx
│   │   │   └── [walkId]/page.tsx       # Single walk breakdown with route map & finds
│   │   ├── entry/
│   │   │   └── [id]/page.tsx           # Find detail: photo, candidates, fact card, voice note
│   │   ├── collection/                 # Taxonomic life list & daily species hunt
│   │   │   └── page.tsx
│   │   └── settings/                   # Consent status, storage persist, haptic/audio toggles, export
│   │       └── page.tsx
│   ├── (dev)/
│   │   └── eval/page.tsx               # Isolated benchmark test harness (removable in prod)
│   ├── api/                            # Stateless serverless proxy routes
│   │   ├── identify/route.ts           # Vision inference + Wikipedia taxon verification
│   │   ├── facts/route.ts              # Wikipedia fetch + grounded fact generation + citation safety
│   │   ├── transcribe/route.ts         # ElevenLabs Scribe STT proxy
│   │   ├── speak/route.ts              # ElevenLabs TTS proxy
│   │   └── route/route.ts              # OpenRouteService pedestrian loop proxy
│   ├── privacy/page.tsx                # Plain-language data & privacy declaration
│   ├── layout.tsx                      # Root HTML layout, theme providers, font definitions
│   ├── page.tsx                        # Landing page (hero, live demo, why-open manifest)
│   └── globals.css                     # Tangerin Dream CSS variables & Base UI styles
├── components/
│   ├── ui/                             # shadcn / Base UI primitives (button, card, dialog, badge)
│   ├── map/                            # MapLibre GL wrapper, marker pins, GeoJSON polyline layers
│   ├── walk/                           # Capture shutter button, candidate selector, Sprout progress
│   ├── journal/                        # Activity heatmap, timeline card, Obsidian export triggers
│   ├── voice/                          # Live waveform Canvas, hold/tap toggle button
│   └── motion/                         # Tegaki handwriting reveal, sprout animations, transitions
├── hooks/
│   ├── use-active-walk.ts              # Auto-recovery walk session & GPS watch management
│   ├── use-gps-stream.ts               # Filtered geolocation stream with accuracy gating
│   ├── use-photo-capture.ts            # Native file input trigger, Canvas resize & EXIF strip
│   └── use-voice-recorder.ts           # MediaRecorder, Web Speech fallback, waveform audio stream
├── lib/
│   ├── db/
│   │   ├── index.ts                    # Dexie database instance & table schema definitions
│   │   └── queries.ts                  # Typed database accessors & transactions
│   ├── geo/
│   │   ├── distance.ts                 # Haversine distance & bearing calculations
│   │   └── filter.ts                   # Pedestrian GPS noise filter algorithms
│   ├── ai/
│   │   ├── provider.ts                 # Google AI Studio / Vercel AI SDK configuration
│   │   ├── prompts.ts                  # Grounded system prompts (identify & fact writer)
│   │   └── safety.ts                   # Edibility/medicinal/handling claim detection & strip
│   ├── wiki/
│   │   ├── verify.ts                   # Wikipedia Action API taxon page existence validator
│   │   └── fetch-lead.ts               # Lead section extract fetcher & sentence splitter
│   ├── audio/
│   │   └── cuelume.ts                  # Synthesized Web Audio UI sound effects
│   ├── ratelimit/
│   │   └── limiter.ts                  # Dual-mode rate limiter (In-Memory LRU vs Upstash Redis)
│   └── export/
│       └── obsidian-zip.ts             # JSZip Markdown & media bundler
└── types/                              # Shared TypeScript interfaces (Walk, Entry, FactCard, etc.)
```

### Structure Rationale

- **`app/(app)/` vs `app/page.tsx`:** Isolates the heavy interactive application routes from the lightweight marketing landing page (`/`). The landing page can render with smooth Lenis scrolling and marketing hero sections without mounting heavy IndexedDB hooks or geolocation listeners.
- **`app/api/` as Pure Proxies:** Server routes contain zero database connections (no Prisma, Mongoose, or Drizzle). They are isolated stateless functional workers that accept requests, check token-bucket rate limits, interact with upstream AI/Wiki endpoints, and respond with verified JSON or audio streams.
- **`lib/db/` as Central Source of Truth:** Dexie tables serve as the local relational database. Isolating it under `lib/db/` ensures all UI components interact with IndexedDB through typed abstractions and live reactive hooks (`useLiveQuery`).
- **`lib/geo/` and `lib/ai/` Modularization:** Mathematical GPS algorithms (Haversine, spatial jitter reduction) and AI prompting/safety routines are decoupled from React components, enabling clean unit testing and offline harness benchmarking in `app/(dev)/eval`.

---

## Architectural Patterns

### Pattern 1: Crash-Resilient Client-First Walk State Recovery

**What:** Continuous write-through persistence to IndexedDB for all GPS points and photo entries, paired with an optimistic auto-resume hook on application mount.  
**When to use:** Crucial for mobile nature walks where browser tabs may be killed by OS low-memory managers, the screen is turned off, or the page is refreshed.  
**Trade-offs:** Minimal I/O overhead on IndexedDB writes (~2ms per point), but completely eliminates walk data loss.

**Example:**
```typescript
// hooks/use-active-walk.ts
import { useEffect, useState } from 'react';
import { db } from '@/lib/db';
import { Walk } from '@/types';

export function useActiveWalk() {
  const [activeWalk, setActiveWalk] = useState<Walk | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function recoverWalkSession() {
      // Find the most recent walk that has not been ended
      const unclosedWalk = await db.walks
        .filter((w) => w.endedAt === null)
        .reverse()
        .first();

      if (unclosedWalk) {
        setActiveWalk(unclosedWalk);
      }
      setIsLoading(false);
    }

    recoverWalkSession();
  }, []);

  const appendTrackPoint = async (point: { lat: number; lng: number; accuracy: number }) => {
    if (!activeWalk) return;
    const newPoints = [...activeWalk.trackPoints, { ...point, timestamp: Date.now() }];
    
    // Immediate write-through to IndexedDB
    await db.walks.update(activeWalk.id, {
      trackPoints: newPoints,
      distance: calculateTotalDistance(newPoints),
    });
  };

  return { activeWalk, isLoading, appendTrackPoint };
}
```

---

### Pattern 2: Multi-Stage Pedestrian GPS Noise & Drift Filtering

**What:** A multi-tier spatial and temporal filter applied to browser `watchPosition` events before appending points to the trail or recalculating walked distance.  
**When to use:** Pedestrian GPS signals outdoors suffer from satellite multipath reflection, tree canopy attenuation, and stationary jitter (GPS "wandering" while standing still).  
**Trade-offs:** Rejects noisy data points, but slightly delays path updates when transitioning from poor signal to clear view.

**Example:**
```typescript
// lib/geo/filter.ts
import { haversineDistanceMeters } from './distance';

export interface RawGpsSample {
  lat: number;
  lng: number;
  accuracy: number;
  timestamp: number;
}

export function shouldAcceptGpsSample(
  sample: RawGpsSample,
  lastAccepted: RawGpsSample | null
): boolean {
  // Gate 1: Reject low-accuracy fixes
  if (sample.accuracy > 35) {
    return false;
  }

  if (!lastAccepted) {
    return true; // First valid sample
  }

  const distanceM = haversineDistanceMeters(
    lastAccepted.lat,
    lastAccepted.lng,
    sample.lat,
    sample.lng
  );
  const dtSeconds = (sample.timestamp - lastAccepted.timestamp) / 1000;

  // Gate 2: Velocity sanity check (> 15 m/s = 54 km/h is impossible for a walker)
  if (dtSeconds > 0 && distanceM / dtSeconds > 15) {
    return false;
  }

  // Gate 3: Spatial displacement gating (< 5m is considered stationary noise)
  // unless 15 seconds have passed (heartbeat update)
  if (distanceM < 5 && dtSeconds < 15) {
    return false;
  }

  return true;
}
```

---

### Pattern 3: Dual-Stage AI Vision & Wikipedia Taxon Verification Pipeline

**What:** An open-weight vision model suggests candidate species, but no candidate is presented as verified until a deterministic Wikipedia Action API query resolves to a biological taxon or genus article.  
**When to use:** Avoids hallucinated species names and guarantees that downstream fact cards have a verifiable, authoritative encyclopedia page.  
**Trade-offs:** Adds ~200ms of Wikipedia API latency during the identification call, but guarantees 100% grounding integrity.

```
┌─────────────────┐      ┌─────────────────────────┐      ┌───────────────────────┐
│ Client Captured │ ───► │ /api/identify           │ ───► │ Google AI Studio      │
│ 1024px Photo    │      │ (Zod Validation)        │      │ (Gemma 4 Vision)      │
└─────────────────┘      └───────────┬─────────────┘      └───────────┬───────────┘
                                     │                                │
                                     │ Proposes 1-3 Taxa              │ Returns Candidates:
                                     │ (common, scientific, kind)     │ { commonName, ... }
                                     ▼                                ▼
                         ┌─────────────────────────┐      ┌───────────────────────┐
                         │ Wikipedia Action API    │ ◄─── │ For each candidate:   │
                         │ `action=query&titles=`  │      │ Validate taxon page   │
                         └───────────┬─────────────┘      └───────────────────────┘
                                     │
                                     ▼
                         ┌────────────────────────────────────────────────────────┐
                         │ Returns Candidates with `verified: boolean`            │
                         │ Unverified items are labeled; facts never run for them │
                         └────────────────────────────────────────────────────────┘
```

---

### Pattern 4: Dual-Mode Rate Limiting & Tiered Cache (Dev / Prod)

**What:** A uniform interface for rate limiting and key-value caching that automatically switches between an In-Memory Token Bucket / LRU cache (zero-setup development) and Upstash Redis REST (production edge).  
**When to use:** Enables rapid local development and automated CI testing without requiring live Redis credentials, while seamlessly protecting external APIs in production.  
**Trade-offs:** In-memory limits do not share state across multiple serverless lambda instances, but are ideal for single-developer local testing.

**Example:**
```typescript
// lib/ratelimit/limiter.ts
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  reset: number;
}

// In-Memory Token Bucket for local development
const memoryBuckets = new Map<string, { tokens: number; lastRefill: number }>();

export async function checkRateLimit(
  identifier: string,
  limit: number,
  windowSeconds: number
): Promise<RateLimitResult> {
  const isUpstashConfigured =
    Boolean(process.env.UPSTASH_REDIS_REST_URL) &&
    Boolean(process.env.UPSTASH_REDIS_REST_TOKEN);

  if (isUpstashConfigured) {
    const redis = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL!,
      token: process.env.UPSTASH_REDIS_REST_TOKEN!,
    });
    const ratelimit = new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(limit, `${windowSeconds} s`),
    });
    const res = await ratelimit.limit(identifier);
    return {
      success: res.success,
      limit: res.limit,
      remaining: res.remaining,
      reset: res.reset,
    };
  }

  // Fallback: In-memory token bucket
  const now = Date.now();
  const bucket = memoryBuckets.get(identifier) || { tokens: limit, lastRefill: now };
  const elapsed = (now - bucket.lastRefill) / 1000;
  bucket.tokens = Math.min(limit, bucket.tokens + elapsed * (limit / windowSeconds));
  bucket.lastRefill = now;

  if (bucket.tokens >= 1) {
    bucket.tokens -= 1;
    memoryBuckets.set(identifier, bucket);
    return { success: true, limit, remaining: Math.floor(bucket.tokens), reset: now + 1000 };
  }

  return { success: false, limit, remaining: 0, reset: now + windowSeconds * 1000 };
}
```

---

## Data Flow

### Request Flow

```
[User Action: Take Photo]
       │
       ▼
[Canvas Preprocessor] ──(Strip EXIF, Resize 1024px, JPEG 0.82)
       │
       ├───────────────────────────────────────────┐
       ▼                                           ▼
[Dexie IndexedDB: entries]                   [/api/identify]
(Status: "identifying", local photo saved)         │
                                             [Token Bucket Rate Limiter]
                                                   │
                                             [Google AI Studio: Gemma Vision]
                                                   │ (1-3 Species Candidates)
                                             [Wikipedia Taxon Verification]
                                                   │ (Check page existence)
                                                   ▼
[Client Receives Candidates] ◄───────────────[Response: Verified Candidates]
       │
[User Confirms Species]
       │
       ▼
[/api/facts] ───────────────────────────────►[Upstash/Memory Cache Check]
       │                                           │ (Miss)
       │                                           ▼
       │                                     [Wikipedia Action API Lead Extract]
       │                                           │ (10-25 Sentences Cleaned & Numbered)
       │                                           ▼
       │                                     [Google AI Studio: Gemma Fact Writer]
       │                                           │ (Summary + 3 Cited Facts)
       │                                           ▼
       │                                     [Safety Validator & Citation Checker]
       │                                           │ (Strip toxicity/edibility/unsupported)
       │                                           ▼
[Dexie IndexedDB: entries] ◄─────────────────[Cached & Returned Fact Card]
(Status: "confirmed", facts attached)
```

### State Management

```
┌────────────────────────────────────────────────────────┐
│                   DEXIE INDEXEDDB                      │
│            (Single Source of Truth on Device)          │
└───────┬────────────────────────┬───────────────────────┘
        │                        │
        │ `useLiveQuery`         │ Direct writes
        ▼                        ▲
┌─────────────────────┐  ┌───────────────────────────────┐
│ React UI Components │  │ Background Controllers        │
│ - Map Markers       │  │ - GPS Watch Listener          │
│ - Walk Timeline     │  │ - Camera Shutter Pipeline     │
│ - Life List Count   │  │ - Audio Voice Recorder        │
└─────────────────────┘  └───────────────────────────────┘
```

### Key Data Flows

1. **Walk Session Lifecycle & Crash Recovery:**
   - User clicks "Start Walk" on `/walk`.
   - `db.walks.add({ startedAt: Date.now(), endedAt: null, trackPoints: [], distance: 0 })` creates record.
   - Geolocation watcher activates, feeding filtered points into `db.walks.update(id, ...)`.
   - If user navigates away, reloads, or OS kills browser: on mount, `useActiveWalk` queries `db.walks.filter(w => !w.endedAt).last()`. If found, seamlessly resumes tracking without resetting distance or entries.
   - "End Walk" writes `endedAt: Date.now()` and navigates to walk summary.

2. **Organism Capture & Image Processing:**
   - Shutter button opens `<input type="file" accept="image/*" capture="environment">`.
   - Selected file is loaded into an HTML `ImageBitmap` / `HTMLCanvasElement`.
   - Canvas is drawn with max bounding box 1024×1024 to re-rasterize and strip all EXIF/GPS tags.
   - Canvas exports JPEG Blob (quality 0.82, ~150KB).
   - Blob is saved directly to Dexie `entries` table (`status: "identifying"`).
   - Triggers haptic pulse (`navigator.vibrate(50)`).
   - Entry is scheduled for `/api/identify`.

3. **Grounded Fact Card Generation & Safety Filter:**
   - User reviews candidate list and taps "Confirm" on a verified species (e.g. *Monstera deliciosa*).
   - Client requests `/api/facts?title=Monstera_deliciosa`.
   - Server checks Redis cache key `facts:Monstera_deliciosa:v1`. If hit, returns in ~20ms.
   - On miss: Wikimedia Action API fetches intro extract (`prop=extracts&exintro=1&explaintext=1`).
   - Cleaned text is segmented into numbered sentences `[1]`, `[2]`, ...
   - Gemma is prompted with: *"Use ONLY the SOURCE text. Cite sentence numbers. Max 40 words summary, max 3 facts of 20 words each."*
   - Code validation checks:
     - All cited sentence indices exist in the source extract.
     - Content does not mention keywords relating to ingestion, eating, medicinal treatment, or handling safety.
     - If all facts fail validation, retry prompt once; if still failing, fall back safely to sentence `[1]` of the verified lead.
   - Facts cached in Redis (TTL: 30 days) and saved to Dexie `entry.facts`.

4. **Voice Note Recording & Dual Fallback:**
   - User holds or taps record button on `/entry/[id]`.
   - Web Audio `AnalyserNode` streams audio levels to `<LiveWaveform />`.
   - Countdown timer caps audio at 60 seconds.
   - If `ELEVENLABS_API_KEY` is present: client posts audio Blob to `/api/transcribe`. ElevenLabs Scribe returns high-accuracy transcript with detected language.
   - If API key is missing or call fails: client falls back to browser `webkitSpeechRecognition` or stores audio note with prompt: *"Transcription unavailable, tap to type notes."*
   - Note record saved to Dexie `notes` table linking `entryId` and `walkId`.

5. **Obsidian-Compatible ZIP & JSON Backup Export:**
   - User triggers "Export Journal" from `/settings`.
   - Exporter queries Dexie for all walks, entries, and notes.
   - Instantiates `JSZip`.
   - Generates folder hierarchy:
     - `walks/YYYY-MM-DD-walk-[id].md` with YAML frontmatter and Obsidian wikilinks (`![[media/entry-[id].jpg]]`).
     - `species/[ScientificName].md` with verified fact cards and Wikipedia CC BY-SA 4.0 attribution.
     - `media/entry-[id].jpg` storing binary JPEG blobs.
     - `treads-backup.json` containing raw database dump for 100% data portability.
   - Generates compressed ZIP blob in memory and initiates browser download via temporary anchor element.

---

## Scaling Considerations

| Scale | Architecture Adjustments |
|-------|--------------------------|
| **0–1k Users** (Hackathon & Demo) | In-memory token bucket & LRU cache. Single-region Vercel deployment. Client-side IndexedDB bears 100% of journal storage and compute burden. |
| **1k–100k Users** | Enable Upstash Redis REST for centralized rate limiting and shared fact caching across edge regions. Fact cache hit rate reaches >80%, drastically cutting Google AI Studio token costs. |
| **100k+ Users** | Add Cloudflare / Edge CDN caching in front of `/api/facts` (public cache headers on static Wikipedia titles). Offload MapLibre tile requests to dedicated tile cache if OpenFreeMap limits require. |

### Scaling Priorities & Bottlenecks

1. **First Bottleneck: External AI & Wikipedia Quotas**
   - *Problem:* Google AI Studio rate limits (e.g. 15 RPM on free tier) or Wikipedia User-Agent throttling if multiple users identify popular species simultaneously.
   - *Mitigation:* The two-tier fact cache ensures identical species are never processed twice. Server routes return explicit `Retry-After` headers, and the client displays a friendly *"Waiting for its turn"* sprout animation without erroring out.
2. **Second Bottleneck: Client Storage Exhaustion on Low-End Devices**
   - *Problem:* Storing hundreds of uncompressed camera images (5–12MB each) will rapidly crash mobile browser IndexedDB quotas (typically 50MB–1GB depending on available disk space).
   - *Mitigation:* Mandatory Canvas pre-processing strips EXIF and downscales every capture to 1024px JPEG at quality 0.82 (~150KB). A user can store over 1,500 captures before consuming 250MB of storage. Storage persistence is explicitly requested via `navigator.storage.persist()`.

---

## Anti-Patterns

### Anti-Pattern 1: Server-Side Journal Persistence or User Accounts

**What people do:** Setting up Supabase/PostgreSQL, user auth (NextAuth/Clerk), and uploading all user photos to an S3/R2 bucket.  
**Why it's wrong:** Violates the core product tenet ("The phone is a lens, not a feed; you own your journal"). Adds unnecessary infrastructure cost, GDPR/privacy exposure for outdoor location data, and maintenance burden.  
**Do this instead:** Store 100% of personal data in IndexedDB via Dexie. Let the user export their data as an Obsidian-compatible ZIP anytime. Zero user accounts required.

### Anti-Pattern 2: Unfiltered High-Frequency GPS Logging

**What people do:** Directly appending raw `navigator.geolocation.watchPosition` coords to an array on every tick.  
**Why it's wrong:** GPS jitter while standing still causes the trail to look like a tangled ball of yarn and artificially inflates walking distance by hundreds of meters.  
**Do this instead:** Apply the multi-stage filter (`accuracy <= 35m`, Haversine displacement `>= 5m` unless stationary for 15s, velocity cap 15 m/s).

### Anti-Pattern 3: Unconstrained Model Fact Generation (Hallucinated Botany)

**What people do:** Passing an organism name to an LLM and asking it to *"Generate 3 interesting facts and explain if it is edible."*  
**Why it's wrong:** LLMs notoriously hallucinate toxic lookalikes, medicinal uses, and incorrect species attributes, posing dangerous real-world liabilities.  
**Do this instead:** Feed the model **only** numbered sentences extracted directly from the verified Wikipedia lead section. Enforce strict sentence citation requirements, run regex/string filters to strip any mention of edibility, toxicity, or medical treatment, and display a mandatory permanent disclaimer.

### Anti-Pattern 4: Raw Camera Capture Storage

**What people do:** Taking the `File` object from `<input type="file">` and directly writing it to IndexedDB or transmitting it over the network.  
**Why it's wrong:** Mobile camera photos are 5–15 MB in size and contain private EXIF metadata (exact home GPS coordinates, device serial number). This exhausts client storage and leaks private coordinates to upstream AI providers.  
**Do this instead:** Decode to Canvas, strip EXIF metadata, downsample to 1024px maximum dimension, and export as JPEG (Q=0.82).

### Anti-Pattern 5: Hard External Service Dependencies Without Fallbacks

**What people do:** Making ElevenLabs API keys or OpenRouteService keys hard requirements for local dev or normal app operation.  
**Why it's wrong:** Breaks local development for contributors without paid keys and prevents evaluation when external APIs have downtime.  
**Do this instead:** Support browser Web Speech API (`webkitSpeechRecognition` / `speechSynthesis`) when ElevenLabs keys are omitted, and gracefully fall back to free-form walks if OpenRouteService is unreachable.

---

## Integration Points

### External Services

| Service | Integration Pattern | Notes & Gotchas |
|---------|---------------------|-----------------|
| **Google AI Studio** (`@ai-sdk/google`) | Server route proxy (`/api/identify`, `/api/facts`). Open-weight Gemma with Gemini Flash fallback. | Model ID configured via `IDENTIFY_MODEL_ID` and `FACTS_MODEL_ID`. Structured output enforced via Zod schema. |
| **Wikimedia Action API** | Server route fetch (`/api/identify`, `/api/facts`). | Must specify custom `User-Agent: TreadsNatureCompanion/1.0` header. Extract intro text using `explaintext=1&exintro=1`. |
| **ElevenLabs API** | Server route proxy (`/api/transcribe`, `/api/speak`). | Scribe STT for auto-detecting spoken language. Streamed TTS audio. Falls back cleanly to Web Speech API if unconfigured. |
| **OpenFreeMap** | Client-side MapLibre GL style link (`https://tiles.openfreemap.org/styles/liberty`). | Zero API key required. High-performance vector tiles. |
| **OpenRouteService** | Server route proxy (`/api/route`). | Pedestrian `foot-walking` profile with `round_trip` parameters. Daily cap of 2,000 requests. |
| **Upstash Redis** (`@upstash/redis`) | Serverless REST connection in rate limiter and fact cache. | Enabled automatically if `UPSTASH_REDIS_REST_URL` is set; falls back to in-memory store if unset. |

### Internal Boundaries

| Boundary | Communication Pattern | Architectural Invariant |
|----------|-----------------------|-------------------------|
| **Components ↔ Dexie DB** | `dexie-react-hooks` (`useLiveQuery`) | Direct component reads are reactive. Writes use centralized transaction helpers in `lib/db/queries.ts`. |
| **Walk Page ↔ Geolocation** | `useGpsStream` hook wrapping `watchPosition` | Filtered coordinates are validated before hitting either Dexie or MapLibre GeoJSON sources. |
| **Client ↔ Serverless Routes** | Typed `fetch` with JSON / FormData payloads | No cookies or auth tokens. Responses validated client-side with Zod. Client handles `Retry-After` gracefully. |
| **Entry ↔ Voice Recorder** | Custom Web Audio `MediaRecorder` hook | Keeps raw audio Blobs client-side; sends only to server if transcription is explicitly triggered. |

---

## Sources

- [Treads PRD & FRD (v1.0)](file:///home/zeph/Code/treads/PRD.md)
- [Treads Architecture & Design Decisions](file:///home/zeph/Code/treads/DECISIONS.md)
- [Dexie.js Best Practices for Progressive Web Apps](https://dexie.org/docs/Tutorial/React)
- [Wikimedia REST & Action API Etiquette Guidelines](https://www.mediawiki.org/wiki/API:Etiquette)
- [Vercel AI SDK Structured Output Documentation](https://sdk.vercel.ai/docs/ai-sdk-core/generating-structured-data)
- [OpenFreeMap Tile Hosting Specifications](https://openfreemap.org/)

---
*Architecture research for: Treads Nature-Walk Companion*  
*Researched: 2026-10-08*
