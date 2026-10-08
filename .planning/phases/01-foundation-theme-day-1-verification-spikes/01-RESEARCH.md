# Phase 1: Foundation, Theme & Day 1 Verification Spikes - Research

**Phase:** 01-foundation-theme-day-1-verification-spikes  
**Date:** 2026-10-08  
**Status:** Complete  
**Confidence:** HIGH  

---

## 1. User Constraints

### Locked Decisions (from CONTEXT.md & DECISIONS.md)
- **D-01:** Deliver both headless API routes (`/api/spike/ai`, `/api/spike/map`) and an interactive visual playground page at `/spike` with MapLibre canvas and AI candidate runner. [CITED: 01-CONTEXT.md]
- **D-02:** Auto-detect Google AI Studio key: invoke live API if `GOOGLE_GENERATIVE_AI_API_KEY` is present; return mock candidate fixture with warning banner if missing, preventing developer blockage. [CITED: 01-CONTEXT.md]
- **D-03:** MapLibre OpenFreeMap spike includes load telemetry: mounts OpenFreeMap Liberty style (`https://tiles.openfreemap.org/styles/liberty`), listens to map `load` event, and reports style load latency and tile status badge. [CITED: 01-CONTEXT.md]
- **D-04:** Use string UUIDs (`crypto.randomUUID()`) for `walks`, `entries`, `notes`, `speechCache`, and an explicit string key (`'user_settings'`) for `settings` table — optimal for export stability and sync consistency. [CITED: 01-CONTEXT.md]
- **D-05:** Provide explicit manual dev controls: implement `seedDatabase()` and `clearDatabase()` utilities triggered via buttons on `/spike` and `/eval` for reproducible test data generation. [CITED: 01-CONTEXT.md]
- **D-06:** Front-load secondary query indexes in v1 schema: indexed `startedAt`, `endedAt` on `walks`; `walkId`, `timestamp`, `verified` on `entries`; `walkId` on `notes`. [CITED: 01-CONTEXT.md]
- **D-07:** Tangerin Dream theme persistence uses `localStorage` with inline head script (preventing FOUC) and background sync to Dexie `settings` table. [CITED: 01-CONTEXT.md]
- **D-08:** Complete component suite & strict library-first rule: Do NOT build UI components from scratch. Scaffold required components from component libraries (`shadcn` backed by `@base-ui-components/react`, `@toggles/within`, devl.dev). If a component is missing or unavailable, drop a request to the user to source it. [CITED: 01-CONTEXT.md]
- **D-09:** Store test fixtures in repo at `public/eval-fixtures/` with a structured `fixtures.json` manifest defining category (plants, birds, insects, non-organisms, people), expected taxon, and refusal flags. [CITED: 01-CONTEXT.md]
- **D-10:** Interactive benchmark dashboard on `/eval` in Phase 1: visual fixture card grid with "Run Batch" trigger button, progress indicator, and top-3 accuracy / refusal rate / latency metrics summary. [CITED: 01-CONTEXT.md]

### The Agent's Discretion
- Choice of initial CC0 open-domain sample images for test fixtures (e.g., Quercus alba leaf, Passer domesticus, Coccinella septempunctata, ceramic mug, human portrait).
- Exact in-memory LRU cache eviction and token bucket tick interval in dev rate limiter.

### Deferred Ideas
- None — discussion stayed within Phase 1 scope. [CITED: 01-CONTEXT.md]

---

## 2. Phase Requirements & Coverage

| Requirement ID | Description | Phase 1 Implementation Target |
|---|---|---|
| **CONS-01** | First run displays full-screen consent modal explaining data handling (photos to AI, audio to ElevenLabs, coarse coords to server, journal stays on device). | `components/consent/consent-modal.tsx` backed by shadcn Base UI `Dialog`/`Sheet`. [CITED: REQUIREMENTS.md] |
| **CONS-02** | Consent acceptance stores timestamped version number in IndexedDB, gating access to all walk and capture features. | `lib/db.ts` settings store (`consentVersion: '1.0'`, `consentTimestamp: Date.now()`) with `useConsent()` gate hook. [CITED: REQUIREMENTS.md] |
| **CONS-03** | App requests `navigator.storage.persist()` on consent acceptance and reports persistence status in `/settings`. | Consent acceptance triggers `navigator.storage.persist()`, persisting `storagePersisted: boolean` to Dexie settings. [CITED: REQUIREMENTS.md] |
| **CONS-04** | Permissions (camera, mic, location) requested just-in-time at point of use with non-blocking inline fallback messaging if denied. | `lib/permissions.ts` utility module providing just-in-time permission request wrappers with inline fallback warning states. [CITED: REQUIREMENTS.md] |
| **DSGN-01** | All UI components implement Tangerin Dream color palette, typography tokens, and border radii using shadcn Base UI. | `app/globals.css` with verified Tangerin Dream CSS variable tokens (`:root` and `.dark`), Amaranth/Noto Serif font tokens, 0.5rem radius. [CITED: REQUIREMENTS.md] |
| **DSGN-02** | Motion animations honor `prefers-reduced-motion` with simple opacity fades and pause when browser tab is hidden. | Motion configuration with `useReducedMotion()`, fallback CSS classes, and `document.addEventListener('visibilitychange')` pause listeners. [CITED: REQUIREMENTS.md] |
| **RATE-01** | Server routes enforce IP token bucket rate limiting with in-memory dev mode and Upstash Redis production mode. | `lib/rate-limit.ts` dual-mode rate limiter: in-memory token bucket fallback for development; `@upstash/ratelimit` when Redis credentials exist. [CITED: REQUIREMENTS.md] |
| **EVAL-01** | Isolated `app/(dev)/eval` developer route executes batch benchmarks on 30 test fixtures, scoring accuracy (≥70%) and refusal rates (≥90%). | `app/(dev)/eval/page.tsx` + `public/eval-fixtures/fixtures.json` (30 fixtures manifest) + visual batch runner dashboard. [CITED: REQUIREMENTS.md] |

---

## 3. Technical Stack Deep-Dive

### 3.1 Next.js 16.4, React 19.3 & Tailwind CSS v4 Scaffolding

- **Next.js Version:** `16.4.0` [VERIFIED: npm registry]
- **React Version:** `19.3.0` [VERIFIED: npm registry]
- **Tailwind CSS Version:** `4.3.3` [VERIFIED: npm registry]
- **Package Manager:** `pnpm` (version `12.10.1` installed in environment) [VERIFIED: local environment]

#### Tailwind v4 PostCSS & CSS Directives
In Tailwind CSS v4, configuration is CSS-first using `@import "tailwindcss";` and `@theme` definitions, supported by `@tailwindcss/postcss`:
```javascript
// postcss.config.mjs
export default {
  plugins: {
    '@tailwindcss/postcss': {},
  },
};
```

In `app/globals.css`:
```css
@import "tailwindcss";

@theme {
  --color-background: var(--background);
  --color-foreground: var(--foreground);
  --color-card: var(--card);
  --color-card-foreground: var(--card-foreground);
  --color-popover: var(--popover);
  --color-popover-foreground: var(--popover-foreground);
  --color-primary: var(--primary);
  --color-primary-foreground: var(--primary-foreground);
  --color-secondary: var(--secondary);
  --color-secondary-foreground: var(--secondary-foreground);
  --color-muted: var(--muted);
  --color-muted-foreground: var(--muted-foreground);
  --color-accent: var(--accent);
  --color-accent-foreground: var(--accent-foreground);
  --color-destructive: var(--destructive);
  --color-destructive-foreground: var(--destructive-foreground);
  --color-border: var(--border);
  --color-input: var(--input);
  --color-ring: var(--ring);
  --radius-lg: var(--radius);
  --radius-md: calc(var(--radius) - 2px);
  --radius-sm: calc(var(--radius) - 4px);
  --font-sans: var(--font-sans);
  --font-serif: var(--font-serif);
  --font-mono: var(--font-mono);
}
```

---

### 3.2 Tangerin Dream Design System Tokens

Extracted directly from authoritative TweakCN theme definition (`cmoiegs7i000004l3h5in1zey`): [VERIFIED: tweakcn.com/themes/cmoiegs7i000004l3h5in1zey]

#### Light Mode Tokens (`:root`)
```css
:root {
  --background: #feefdd;
  --foreground: #201e1f;
  --card: #fff6eb;
  --card-foreground: #201e1f;
  --popover: #fff6eb;
  --popover-foreground: #201e1f;
  --primary: #ff4000;
  --primary-foreground: #feefdd;
  --secondary: #faaa8d;
  --secondary-foreground: #201e1f;
  --muted: #f8dcc8;
  --muted-foreground: #6f4f43;
  --accent: #faaa8d;
  --accent-foreground: #201e1f;
  --destructive: #ff4000;
  --destructive-foreground: #feefdd;
  --border: #efd0ba;
  --input: #fff6eb;
  --ring: #ff4000;
  --chart-1: #ff4000;
  --chart-2: #faaa8d;
  --chart-3: #201e1f;
  --chart-4: #ff7a3d;
  --chart-5: #f8c6ae;
  --sidebar: #fff4e7;
  --sidebar-foreground: #201e1f;
  --sidebar-primary: #ff4000;
  --sidebar-primary-foreground: #feefdd;
  --sidebar-accent: #f8dcc8;
  --sidebar-accent-foreground: #201e1f;
  --sidebar-border: #efd0ba;
  --sidebar-ring: #ff4000;
  --font-sans: "Amaranth", ui-sans-serif, sans-serif, system-ui;
  --font-serif: "Noto Serif", ui-serif, serif;
  --font-mono: "JetBrains Mono", "Courier New", monospace;
  --radius: 0.5rem;
  --shadow-color: #201e1f;
  --shadow-opacity: 0.08;
  --shadow-blur: 12px;
  --shadow-spread: 0px;
  --shadow-offset-x: 0;
  --shadow-offset-y: 1px;
}
```

#### Dark Mode Tokens (`.dark`)
```css
.dark {
  --background: #201e1f;
  --foreground: #feefdd;
  --card: #2a2728;
  --card-foreground: #feefdd;
  --popover: #2a2728;
  --popover-foreground: #feefdd;
  --primary: #ff4000;
  --primary-foreground: #feefdd;
  --secondary: #faaa8d;
  --secondary-foreground: #201e1f;
  --muted: #393334;
  --muted-foreground: #d9bba5;
  --accent: #faaa8d;
  --accent-foreground: #201e1f;
  --destructive: #ff4000;
  --destructive-foreground: #feefdd;
  --border: #443b3a;
  --input: #2a2728;
  --ring: #ff4000;
  --chart-1: #ff4000;
  --chart-2: #faaa8d;
  --chart-3: #feefdd;
  --chart-4: #ff7a3d;
  --chart-5: #f8c6ae;
  --sidebar: #1b191a;
  --sidebar-foreground: #feefdd;
  --sidebar-primary: #ff4000;
  --sidebar-primary-foreground: #feefdd;
  --sidebar-accent: #393334;
  --sidebar-accent-foreground: #feefdd;
  --sidebar-border: #443b3a;
  --sidebar-ring: #ff4000;
  --font-sans: "Amaranth", ui-sans-serif, sans-serif, system-ui;
  --font-serif: "Noto Serif", ui-serif, serif;
  --font-mono: "JetBrains Mono", "Courier New", monospace;
  --radius: 0.5rem;
  --shadow-color: #000000;
  --shadow-opacity: 0.3;
  --shadow-blur: 14px;
  --shadow-spread: 0px;
  --shadow-offset-x: 0;
  --shadow-offset-y: 1px;
}
```

#### Zero-FOUC Head Script Pattern
To prevent flash of unstyled theme on page load (D-07), inject an inline script in `app/layout.tsx`:
```tsx
<script
  dangerouslySetInnerHTML={{
    __html: `
      (function() {
        try {
          var stored = localStorage.getItem('treads_theme');
          var systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
          if (stored === 'dark' || (!stored && systemDark)) {
            document.documentElement.classList.add('dark');
          } else {
            document.documentElement.classList.remove('dark');
          }
        } catch (e) {}
      })();
    `,
  }}
/>
```

---

### 3.3 shadcn Component Suite backed by Base UI

- **shadcn CLI:** `4.21.4` supports `--base base` (uses `@base-ui-components/react@1.0.0-rc.0`). [VERIFIED: npm registry]
- **Library-First Rule (D-08):** UI components must NOT be created from scratch. Use shadcn Base UI primitives.
- **Theme Toggle (@toggles/within):** Available via `@theme-toggles/react` or `npx shadcn@latest add https://toggles.dev/r/within`. Provides animated SVG sun/moon toggle reading CSS theme variables. [VERIFIED: toggles.dev]

Components required in Phase 1:
- `button`
- `card`
- `dialog` (for consent modal)
- `badge` (for telemetry and test statuses)
- `progress` (for batch runner progress)
- `sheet` (for slide-out panels)
- `theme-toggle` (via `@toggles/within`)

---

### 3.4 Client-Side Database: Dexie.js Schema (`db.ts`)

- **Dexie Version:** `4.4.6` (`dexie` + `dexie-react-hooks`) [VERIFIED: npm registry]
- **Primary Keys:** UUID strings via `crypto.randomUUID()` for entities, fixed string `'user_settings'` for settings (D-04).
- **Secondary Indexes:** Front-loaded in v1 schema (D-06):
  - `walks`: `id, startedAt, endedAt`
  - `entries`: `id, walkId, createdAt, timestamp, status, verified`
  - `notes`: `id, walkId, entryId, createdAt`
  - `settings`: `key`
  - `speechCache`: `id, textHash, createdAt`

#### TypeScript Models & Schema Definition
```typescript
import Dexie, { type Table } from 'dexie';

export interface Walk {
  id: string; // crypto.randomUUID()
  startedAt: number;
  endedAt: number | null;
  mode: 'free' | 'loop';
  routeLine?: [number, number][] | null;
  trackPoints: Array<{ lat: number; lng: number; accuracy: number; timestamp: number }>;
  distance: number;
}

export interface Candidate {
  scientificName: string;
  commonName: string;
  kind: 'tree' | 'flower' | 'plant' | 'bird' | 'insect' | 'fungus' | 'other';
  confidence: 'Likely' | 'Possible' | 'Unsure';
  wikipediaTitle: string;
  verified?: boolean;
}

export interface Entry {
  id: string;
  walkId: string;
  createdAt: number;
  timestamp: number;
  photo: Blob | string;
  lat: number;
  lng: number;
  accuracy: number;
  status: 'saved' | 'identifying' | 'identified' | 'confirmed' | 'unidentified' | 'failed';
  candidates: Candidate[];
  confirmed?: Candidate | null;
  verified: boolean;
  facts?: {
    summary: string;
    facts: Array<{ sentenceNumber: number; text: string }>;
    sourceUrl: string;
  } | null;
}

export interface Note {
  id: string;
  walkId?: string;
  entryId?: string;
  kind: 'voice' | 'text';
  audio?: Blob | null;
  duration?: number;
  transcript: string;
  language?: string;
  createdAt: number;
}

export interface UserSettings {
  key: string; // 'user_settings'
  consentVersion: string | null;
  consentTimestamp: number | null;
  storagePersisted: boolean;
  soundEnabled: boolean;
  hapticsEnabled: boolean;
  theme: 'light' | 'dark' | 'system';
}

export interface SpeechCache {
  id: string;
  textHash: string;
  audio: Blob;
  createdAt: number;
}

export class TreadsDB extends Dexie {
  walks!: Table<Walk, string>;
  entries!: Table<Entry, string>;
  notes!: Table<Note, string>;
  settings!: Table<UserSettings, string>;
  speechCache!: Table<SpeechCache, string>;

  constructor() {
    super('treads_db');
    this.version(1).stores({
      walks: 'id, startedAt, endedAt',
      entries: 'id, walkId, createdAt, timestamp, status, verified',
      notes: 'id, walkId, entryId, createdAt',
      settings: 'key',
      speechCache: 'id, textHash, createdAt',
    });
  }
}

export const db = new TreadsDB();
```

#### Reproducible Dev Controls (D-05)
- `seedDatabase()`: populates sample walks, entries (leaves, birds, insects), notes, and initialized settings for test verification.
- `clearDatabase()`: clears all Dexie tables (`await db.walks.clear()`, etc.).
- Both actions exposed via control buttons on `/spike` and `/eval`.

---

### 3.5 Dual-Mode Rate Limiter (RATE-01)

- **Mode A (Production):** Activated when `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` are defined. Uses `@upstash/ratelimit` with Redis sliding window.
- **Mode B (Development):** Zero-signup in-memory token bucket. Automatically active if Upstash credentials are omitted.
- **Quotas:**
  - `identify`: 30 req/day/IP
  - `facts`: 60 req/day/IP
  - `transcribe`: 30 req/day/IP
  - `speak`: 40 req/day/IP
  - `route`: 40 req/day/IP
  - `spike`: 60 req/day/IP

#### In-Memory Token Bucket Implementation Architecture
```typescript
interface TokenBucket {
  tokens: number;
  lastRefill: number;
}

class MemoryRateLimiter {
  private buckets = new Map<string, TokenBucket>();
  
  check(key: string, limit: number, windowMs: number): { success: boolean; remaining: number; reset: number } {
    const now = Date.now();
    let bucket = this.buckets.get(key);
    
    if (!bucket || now - bucket.lastRefill >= windowMs) {
      bucket = { tokens: limit - 1, lastRefill: now };
      this.buckets.set(key, bucket);
      return { success: true, remaining: limit - 1, reset: Math.ceil((now + windowMs) / 1000) };
    }
    
    if (bucket.tokens > 0) {
      bucket.tokens -= 1;
      return { success: true, remaining: bucket.tokens, reset: Math.ceil((bucket.lastRefill + windowMs) / 1000) };
    }
    
    return { success: false, remaining: 0, reset: Math.ceil((bucket.lastRefill + windowMs) / 1000) };
  }
}
```

---

### 3.6 Day 1 Verification Spikes Architecture

#### AI Candidate Spike (`/api/spike/ai` & `/spike`)
- **Key Auto-Detection (D-02):**
  - If `GOOGLE_GENERATIVE_AI_API_KEY` is missing: return mock candidate fixture with `{ warning: 'GOOGLE_GENERATIVE_AI_API_KEY not configured. Returning mock candidate.', mock: true }`.
  - If present: call Google AI Studio via `@ai-sdk/google`.
- **Gemma Vision Check & Gemini Flash Fallback:**
  - Gemma models on Google AI Studio (`gemma-2-9b-it`, `gemma-2-27b-it`) do not accept multimodal vision inputs. [VERIFIED: ai.google.dev]
  - When an image payload is passed, fallback immediately to `gemini-2.0-flash` (or configured `IDENTIFY_MODEL_ID`), while preserving Gemma for text generation.
  - Return up to 3 taxonomic candidates with qualitative confidence (`Likely`, `Possible`, `Unsure`).

#### MapLibre OpenFreeMap Spike (`/api/spike/map` & `/spike`)
- **OpenFreeMap Liberty Style:** `https://tiles.openfreemap.org/styles/liberty` (Returns HTTP 200, Cloudflare cached vector style). [VERIFIED: curl test]
- **Telemetry (D-03):**
  - Measure elapsed time from `new maplibregl.Map(...)` instantiation to `map.on('load')`.
  - Display badge on `/spike`: `OpenFreeMap Connected (185ms)`.
  - Report tile load errors or network failures gracefully with inline warning.
- **SSR Safety:**
  - MapLibre GL touches `window` and WebGL; dynamically import using `next/dynamic` with `{ ssr: false }` or client-only mount guard.

---

### 3.7 Evaluation Harness & Benchmark Dashboard (EVAL-01)

- **Isolated Route:** `app/(dev)/eval/page.tsx`
- **Fixtures Directory:** `public/eval-fixtures/`
- **Fixtures Manifest:** `public/eval-fixtures/fixtures.json` (30 test fixtures):
  - 10 Plants/Trees/Flowers (expected taxonomic identification)
  - 6 Birds (expected taxonomic identification)
  - 6 Insects (expected taxonomic identification)
  - 4 Non-organisms (expected refusal: `isLivingOrganism: false`, e.g., mug, bicycle, bench, smartphone)
  - 4 People (expected refusal: `isLivingOrganism: false`, e.g., selfie, human portrait, hand)
- **Batch Benchmark Dashboard:**
  - Visual fixture card grid with category badges and thumbnails.
  - "Run Batch" button running evaluations with rate limit throttle.
  - Top-3 Accuracy metric (Target: ≥70%).
  - Refusal Rate metric (Target: ≥90%).
  - Average Latency metric (ms).
  - Pass/Fail benchmark badge.

---

### 3.8 Consent & Permission Gate Architecture (CONS-01..04)

- **Consent Gate (`ConsentModal`):**
  - Full-screen modal on first launch explaining: photos sent to AI Studio, audio sent to ElevenLabs, coarse coords sent for loops, field journal stays 100% on device.
  - Acceptance writes `{ key: 'user_settings', consentVersion: '1.0', consentTimestamp: Date.now() }` to Dexie.
  - Calls `navigator.storage.persist()`, persisting storage status (CONS-03).
- **Just-In-Time Permissions (`lib/permissions.ts`) (CONS-04):**
  - Camera: requested when user taps capture in `<input type="file" capture="environment">`.
  - Location: requested when user taps "Start Walk" on `/walk`.
  - Microphone: requested when user triggers voice note.
  - If permission is denied: displays non-blocking inline message without crashing or locking the application.

---

## 4. Standard Patterns & Pitfalls

### Critical Pitfalls & Mitigation Strategies

| Pitfall | Risk | Mitigation |
|---|---|---|
| **SSR Crash with MapLibre GL** | `ReferenceError: window is not defined` during Next.js build or SSR | Dynamically import MapLibre components with `{ ssr: false }` via `next/dynamic`, or mount only after `useEffect` verification. [CITED: STACK.md] |
| **Dark Mode FOUC** | Screen flashes light background before theme script loads | Inline script in `app/layout.tsx` `<head>` reads `localStorage` and toggles `.dark` class synchronously before body render. [CITED: 01-CONTEXT.md] |
| **Missing Google API Key Crash** | Local developers unable to test application shell or spikes | Auto-detect key presence; return structured mock candidate fixture with clear UI warning banner (D-02). [CITED: 01-CONTEXT.md] |
| **Dexie Schema Migrations** | Changing primary key or index types corrupts client data | Front-load secondary query indexes (`startedAt`, `endedAt`, `walkId`, `timestamp`, `verified`) in v1 schema (D-04, D-06). [CITED: 01-CONTEXT.md] |
| **Mobile Memory / Android LMK** | Tab discarded in background during walk | Continuous Dexie persistence for all state; never rely on transient React state for walk sessions. [CITED: PITFALLS.md] |
| **Rate Limit Lockout during Dev** | Developer hitting 429 errors running tests | In-memory token bucket dev mode with generous dev limits and reset button. [CITED: DECISIONS.md] |

---

## 5. Verification & Success Criteria

### Plan 01-01 Verification
- [ ] `pnpm build` succeeds with Next.js 16.4, React 19.3, and Tailwind CSS v4.
- [ ] `globals.css` contains Tangerin Dream CSS variable tokens for `:root` and `.dark`.
- [ ] Inline head script eliminates FOUC when toggling theme.
- [ ] Theme toggle component (`@toggles/within`) switches themes dynamically and syncs to `localStorage`.
- [ ] Base UI shadcn components (`button`, `card`, `dialog`, `badge`, `sheet`) render properly.

### Plan 01-02 Verification
- [ ] `lib/db.ts` initializes Dexie database (`treads_db`) with `walks`, `entries`, `notes`, `settings`, `speechCache` tables.
- [ ] `seedDatabase()` and `clearDatabase()` utilities populate and wipe test data correctly.
- [ ] `ConsentModal` appears on first load, saves timestamped consent version to Dexie, and invokes `navigator.storage.persist()`.
- [ ] `lib/permissions.ts` provides non-blocking just-in-time permission request handlers with fallback messages.
- [ ] `lib/rate-limit.ts` enforces dual-mode rate limiting: memory token bucket in dev and Upstash in prod.

### Plan 01-03 Verification
- [ ] `/api/spike/ai` returns mock fixture if API key is missing; calls Google AI Studio if present.
- [ ] Gemma vision limitation triggers automatic fallback to Gemini Flash for vision candidate identification.
- [ ] `/api/spike/map` and `/spike` load OpenFreeMap Liberty style, reporting latency telemetry.
- [ ] `public/eval-fixtures/fixtures.json` contains 30 test fixtures manifest.
- [ ] `/eval` dashboard renders fixture cards, executes batch run, and displays accuracy/refusal benchmark metrics.

---
*Generated by GSD Phase Researcher for Phase 01: foundation-theme-day-1-verification-spikes*

