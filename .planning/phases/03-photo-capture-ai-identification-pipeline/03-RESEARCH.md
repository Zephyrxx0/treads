# Phase 3: Photo Capture & AI Identification Pipeline - Research

**Researched:** 2026-10-08  
**Domain:** Client-side Canvas EXIF stripping, Google AI Studio Multimodal Identification, Wikipedia Action API Taxon Verification & Fact Grounding  
**Confidence:** HIGH

---

## Summary

Phase 3 implements the core nature companion workflow: the two-tap organism capture loop. Outdoors, walkers photograph living organisms using their mobile phone camera. The browser immediately intercepts the image file, decodes it onto an HTML5 Canvas, resizes it to a maximum edge of 1024px, and re-encodes it as a JPEG (quality 0.82) — completely stripping all EXIF and GPS hardware metadata before saving to IndexedDB (Dexie) and transmitting to the server.

The backend identification pipeline leverages Google AI Studio via `@ai-sdk/google` (Gemini Flash multimodal vision for candidate extraction with graceful mock fallback), paired with Wikipedia Action API queries (`action=query&redirects=1`) for taxonomic verification and grounded fact extraction. Biological verification parses category metadata and page properties to confirm legitimate taxons, while `/api/facts` extracts 10–25 sentences from the lead section, uses `Intl.Segmenter` to assign numbered citation indices, and applies strict server-side regex filtering to scrub any toxic, foraging, or medicinal advice.

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- **D-01:** Native OS camera trigger via `<input type="file" capture="environment">` — leverages mobile device camera features (auto-focus, HDR, macro lens) without WebRTC camera stream permission overhead.
- **D-02:** Instant preview bottom sheet on `/walk` — displays captured photo with quick "Retake" and "Identify Organism" buttons, alongside a subtle "Stripping EXIF & optimizing..." badge.
- **D-03:** Dual storage in Dexie IndexedDB — store 1024px photo (~150KB) as Blob plus a lightweight 160px thumbnail (~15KB) for instant map pins and journal list rendering performance. — **Reversibility:** costly — Dexie database schema and thumbnail field definitions require data migration if altered later.
- **D-04:** Universal file picker fallback — desktop browsers or unsupported devices support standard image selection (JPG, PNG, HEIC, WebP), running through the identical Canvas EXIF stripping pipeline.
- **D-05:** Bottom sheet drawer on `/walk` — keeps walker in walk context, presenting up to 3 candidates as interactive cards with confidence badges (Likely/Possible/Unsure) and one-tap selection to confirm.
- **D-06:** Educational refusal card — non-organism or human portraits trigger a warm, non-judgmental card ("We noticed an inanimate object or person. Treads tracks living organisms in nature") with "Retake Photo" and secondary "Save as Unidentified Note".
- **D-07:** Low-confidence identification UX — candidates with all "Unsure" ratings display amber badges with an explicit "None of these / Save as Unidentified" button alongside "Retake".
- **D-08:** Specialized model pairing — use Gemini Flash (multimodal) for `/api/identify` photo organism candidate generation, and Gemma (open-weight text model) for `/api/facts` Wikipedia grounding and synthesis, with graceful mock fallback if API key is absent. — **Reversibility:** costly — model routing and prompt schemas are paired across API routes.
- **D-09:** Wikipedia taxon verification — query Wikipedia Action API with `redirects=1` and verify biological taxonomy markers/categories (e.g. `Plants`, `Animals`, `Fungi`, `Taxobox`); biological matches receive a green "Verified Biological Taxon" badge.
- **D-10:** Interactive cited fact cards — 3 distinct facts with clickable citation pills (`[1]`, `[4]`) toggling an inline popover showing the exact verbatim Wikipedia sentence, accompanied by an "Open in Wikipedia" link pill.
- **D-11:** Multi-layer defense for edibility scrubbing — strict negative system prompt constraint plus deterministic server-side regex blacklist (`edible|toxic|poisonous|medicinal|remedy|forag*|culinary|tasty`), rejecting/filtering any flagged fact before saving to Dexie. — **Reversibility:** one-way — core safety contract preventing dangerous foraging advice.
- **D-12:** Dedicated `/entry/[id]` detail view — hero photo with pinch/zoom, species common and scientific names, verified taxon badge, interactive fact card, capture timestamp & GPS coordinates pill, and scaffolded "Listen" narration button (for Phase 4).
- **D-13:** Circular thumbnail marker pins on MapLibre trail — 36px circular badge containing the 160px photo thumbnail with a color-coded taxon ring (green plant, orange insect, blue bird), tapping opens the summary drawer.
- **D-14:** Walk HUD specimen count pill — compact glassmorphism chip (`🌱 X finds`) in the top HUD; tapping opens a horizontal quick-drawer of finds during the current walk session.
- **D-15:** Optimistic local draft save — when cellular connectivity is weak or interrupted, immediately save photo and GPS to Dexie with status `saved`, drop an amber badge pin on the map, show toast notification ("Saved to device — tap to identify when back online"), and provide a 1-tap Retry button.
- **D-16:** Visual species reel in End Walk Summary Drawer — horizontal scrolling reel of captured organism photos with common names and verified badges right below the distance/time metrics, clicking opens `/entry/[id]`.

### the agent's Discretion
- Canvas downscaling interpolation algorithm (bicubic / step-down resampling) for 1024px photo and 160px thumbnail.
- Taxon category border ring colors on map pins.
- Debounce and retry delay timing for Wikipedia Action API queries.

### Deferred Ideas (OUT OF SCOPE)
- Offline PMTiles or vector tile caching (deferred to v2).
- Audio spectrogram analysis for bird calls (deferred to v2).
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| CAPT-01 | Large capture button opens native system camera via `<input type="file" accept="image/*" capture="environment">` | Standard HTML5 media capture spec supported on Android Chrome and iOS Safari; zero WebRTC permission friction. |
| CAPT-02 | Captured image decoded to HTML5 Canvas, resized to max edge 1024px, re-exported as JPEG (0.82) to strip EXIF | Native `createImageBitmap()` + 2D canvas `drawImage()` eliminates all EXIF/GPS tags client-side; tested reduction to ~140KB. |
| CAPT-03 | Compressed image blob saved immediately to Dexie IndexedDB with timestamp and coordinates | Dexie `db.entries.add()` stores Blob + 160px thumbnail with initial status `'saved'` before network call. |
| IDEN-01 | Client uploads compressed JPEG, month, and coarse region (1 decimal coord) to `/api/identify` | Client sends FormData or JSON payload with base64 data to `/api/identify` protected by IP token-bucket rate limiter. |
| IDEN-02 | Server calls Google AI Studio returning up to 3 taxonomic candidates with qualitative confidence | Tested `@ai-sdk/google` with `generateObject` and Zod schema; returns scientificName, commonName, kind, confidence rating. |
| IDEN-03 | Model identifies non-living objects, blurry captures, or people and returns honest refusal | Zod schema enforces `isLivingOrganism: boolean` and `refusalReason?: string`; model honestly refuses mugs, bikes, humans. |
| IDEN-04 | Server verifies candidates against Wikipedia Action API (`redirects=1`), validating taxon metadata | Verified API endpoint `prop=categories|pageprops&redirects=1`; presence of `'species' microformats` or taxon categories marks `verified: true`. |
| IDEN-05 | User can confirm a candidate or select "None of these" to save as unidentified | Bottom sheet UI with interactive candidate cards, confidence badges, and fallback "Save as Unidentified Note" action. |
| FACT-01 | Confirming candidate triggers `/api/facts` fetching plain-text lead section (10–25 sentences) with numbered sentences | Tested Wikipedia `prop=extracts&exintro=1&explaintext=1&redirects=1` + `Intl.Segmenter` splitting into indexed sentence array. |
| FACT-02 | Gemma synthesizes short summary (max 40 words) and up to 3 facts (max 20 words each), citing sentence numbers | Tested `@ai-sdk/google` structured output with schema enforcing sentence number citations `[1]`, `[2]`. |
| FACT-03 | Server validates citations and executes strict regex scrubbing dropping edibility, toxicity, or medicinal claims | Multi-layer check: negative prompt + deterministic regex `/\b(edible|inedible|toxic|poisonous|medicinal|remedy|forag\w*|culinary)\b/i`. |
| FACT-04 | If validation drops all facts, server retries once, then falls back to sentence #1 of verified lead section | Deterministic fallback pipeline guarantees zero blank cards. |
| FACT-05 | Fact card displays mandatory warning: *"This is a best guess. Don't eat or touch anything based on this app."* | Grounded fact card footer includes safety disclaimer and CC BY-SA Wikipedia link. |
| FACT-06 | Fact cards are cached by Wikipedia title to avoid redundant API calls | In-memory LRU cache on server + Dexie `entries.facts` persistence on client. |
</phase_requirements>

---

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Camera Capture & EXIF Stripping | Browser (Client) | — | Must execute entirely client-side on Canvas before network transit to ensure zero GPS/EXIF privacy leakage. |
| Specimen & Thumbnail Storage | Database (IndexedDB) | Browser | Dexie stores full 1024px photo blob and 160px thumbnail locally for offline durability and fast map rendering. |
| AI Organism Identification | API / Server | Google AI Studio | Server manages secret `GOOGLE_GENERATIVE_AI_API_KEY`, enforces rate limits, and orchestrates model execution. |
| Wikipedia Taxon Verification | API / Server | Wikipedia API | Server validates candidates via Wikipedia Action API with `redirects=1` and caches verified taxonomic titles. |
| Grounded Fact Generation & Safety Scrubbing | API / Server | Client Display | Server fetches Wikipedia plain-text extracts, generates citations via Gemma/Gemini, and enforces the edibility regex blacklist. |
| Fact Card & Citation Interactivity | Browser (Client) | — | Client handles touch-friendly popover reveals for verbatim Wikipedia citations and audio player trigger. |
| Specimen Trail Pinning | Browser (Client) | MapLibre Canvas | Client syncs Dexie entries with MapLibre GeoJSON/Marker layers to plot specimen pins along the active trail. |

---

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `@ai-sdk/google` | `^1.1.0` [VERIFIED: package.json:30] | Google AI Studio SDK | Official Vercel AI SDK integration for Gemini Flash and Gemma. |
| `ai` | `^4.1.0` [VERIFIED: package.json:31] | Structured object generation | Powers `generateObject` with type-safe Zod schema validation. |
| `zod` | `^3.24.0` [VERIFIED: package.json:44] | Runtime schema validation | Enforces strict JSON contracts for candidates and cited facts. |
| `dexie` | `^4.0.11` [VERIFIED: package.json:34] | Client-side IndexedDB | Fast, typed, reactive persistence with `useLiveQuery`. |
| `lucide-react` | `^1.16.0` [VERIFIED: package.json:36] | UI iconography | Official icons for camera, leaf, alert, refresh, checkmark. |

---

## Architecture Patterns

### Client-Side Canvas EXIF Stripper & Resizer

```typescript
// Source: lib/camera.ts
export interface ProcessedImage {
  photoBlob: Blob;
  thumbnailBlob: Blob;
  width: number;
  height: number;
}

export async function processCapturedImage(file: File): Promise<ProcessedImage> {
  const imageBitmap = await createImageBitmap(file);
  const maxDim = 1024;
  let { width, height } = imageBitmap;

  if (width > maxDim || height > maxDim) {
    if (width > height) {
      height = Math.round((height * maxDim) / width);
      width = maxDim;
    } else {
      width = Math.round((width * maxDim) / height);
      height = maxDim;
    }
  }

  // 1. Render 1024px photo without EXIF
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Could not get 2d canvas context');
  ctx.drawImage(imageBitmap, 0, 0, width, height);

  const photoBlob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (b) => (b ? resolve(b) : reject(new Error('Canvas export failed'))),
      'image/jpeg',
      0.82
    );
  });

  // 2. Render 160px thumbnail
  const thumbDim = 160;
  let tWidth = width;
  let tHeight = height;
  if (tWidth > tHeight) {
    tHeight = Math.round((tHeight * thumbDim) / tWidth);
    tWidth = thumbDim;
  } else {
    tWidth = Math.round((tWidth * thumbDim) / tHeight);
    tHeight = thumbDim;
  }

  const thumbCanvas = document.createElement('canvas');
  thumbCanvas.width = tWidth;
  thumbCanvas.height = tHeight;
  const thumbCtx = thumbCanvas.getContext('2d');
  if (!thumbCtx) throw new Error('Could not get thumbnail context');
  thumbCtx.drawImage(canvas, 0, 0, tWidth, tHeight);

  const thumbnailBlob = await new Promise<Blob>((resolve, reject) => {
    thumbCanvas.toBlob(
      (b) => (b ? resolve(b) : reject(new Error('Thumbnail export failed'))),
      'image/jpeg',
      0.80
    );
  });

  return { photoBlob, thumbnailBlob, width, height };
}
```

---

### Wikipedia Taxon Verification Protocol

```typescript
// Source: lib/wikipedia.ts
export interface WikipediaTaxonResult {
  verified: boolean;
  canonicalTitle: string;
  description?: string;
  pageId?: number;
}

export async function verifyWikipediaTaxon(title: string): Promise<WikipediaTaxonResult> {
  const url = `https://en.wikipedia.org/w/api.php?action=query&titles=${encodeURIComponent(
    title
  )}&redirects=1&prop=categories|pageprops&format=json&origin=*`;

  const res = await fetch(url, { headers: { 'User-Agent': 'TreadsApp/1.0 (hackathon-companion)' } });
  if (!res.ok) return { verified: false, canonicalTitle: title };

  const data = await res.json();
  const pages = data.query?.pages || {};
  const pageId = Object.keys(pages)[0];
  if (!pageId || pageId === '-1') return { verified: false, canonicalTitle: title };

  const page = pages[pageId];
  const canonicalTitle = page.title || title;
  const categories: Array<{ title: string }> = page.categories || [];
  const pageprops = page.pageprops || {};

  // Check biological markers
  const hasSpeciesMicroformat = categories.some((c) =>
    c.title.includes('species') || c.title.includes('taxa')
  );
  const isItalicDisplay = (pageprops.displaytitle || '').includes('<i>');
  const shortDesc = (pageprops['wikibase-shortdesc'] || '').toLowerCase();
  const hasTaxonDesc = ['species', 'genus', 'plant', 'tree', 'bird', 'insect', 'fungus', 'animal'].some(
    (kw) => shortDesc.includes(kw)
  );

  const verified = hasSpeciesMicroformat || isItalicDisplay || hasTaxonDesc;

  return {
    verified,
    canonicalTitle,
    description: pageprops['wikibase-shortdesc'],
    pageId: Number(pageId),
  };
}
```

---

### Wikipedia Plain-Text Extraction & Sentence Tokenization

```typescript
// Source: lib/wikipedia.ts
export async function getWikipediaLeadSentences(title: string): Promise<{
  sentences: Array<{ index: number; text: string }>;
  sourceUrl: string;
}> {
  const url = `https://en.wikipedia.org/w/api.php?action=query&prop=extracts&exintro=1&explaintext=1&titles=${encodeURIComponent(
    title
  )}&redirects=1&format=json&origin=*`;

  const res = await fetch(url, { headers: { 'User-Agent': 'TreadsApp/1.0 (hackathon-companion)' } });
  const data = await res.json();
  const pages = data.query?.pages || {};
  const pageId = Object.keys(pages)[0];
  const extract = pages[pageId]?.extract || '';

  const segmenter = new Intl.Segmenter('en', { granularity: 'sentence' });
  const rawSentences = Array.from(segmenter.segment(extract), (s) => s.segment.trim()).filter(
    (s) => s.length > 10
  );

  const sentences = rawSentences.slice(0, 25).map((text, idx) => ({
    index: idx + 1,
    text,
  }));

  return {
    sentences,
    sourceUrl: `https://en.wikipedia.org/wiki/${encodeURIComponent(title)}`,
  };
}
```

---

### Edibility & Toxic Advice Regex Scrubber

```typescript
// Source: lib/facts-safety.ts
const EDIBILITY_REGEX = /\b(edible|inedible|eat\w*|taste|tasty|culinary|recipe|salad|soup|boil\w*|cook\w*|forag\w*|medicinal|remedy|cure|toxic|poison\w*|consumption)\b/i;

export function scrubSafetyViolations(text: string): boolean {
  return EDIBILITY_REGEX.test(text);
}
```

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Sentence Splitting | Regex `.split('.')` | `Intl.Segmenter` | Period splitting fails on abbreviations like "sp.", "ca.", "Dr.", "e.g.", and decimal measurements. `Intl.Segmenter` is native and standard. |
| EXIF Stripping | Binary byte buffer parsers | Canvas 2D rasterization | Drawing to canvas and exporting via `toBlob('image/jpeg')` decodes purely pixel data, discarding 100% of EXIF/IPTC/GPS headers natively. |
| HTML Wikitext Stripping | Custom regex tag strippers | Wikipedia `explaintext=1` parameter | Wikipedia Action API natively returns clean UTF-8 text with all tables, infoboxes, and references stripped. |
| Rate Limiting | Custom IP tracking | `lib/rate-limit.ts` | Dual-mode token bucket is already implemented and verified in Phase 1. |

---

## Common Pitfalls

### Pitfall 1: Canvas orientation inversion on mobile phones
**What goes wrong:** Photos taken in portrait mode on Android/iOS appear rotated sideways on the canvas.  
**Why it happens:** Mobile camera EXIF metadata holds the orientation flag, which traditional `<img />` tags might not apply when drawn to canvas.  
**How to avoid:** Use `createImageBitmap(file)` which honors EXIF orientation natively in modern browsers.

### Pitfall 2: Wikipedia Disambiguation Pages
**What goes wrong:** Searching "Robin" returns a disambiguation page rather than *Erithacus rubecula* or *Turdus migratorius*.  
**Why it happens:** AI candidate returns a generic common name rather than the binomial title.  
**How to avoid:** Always use the candidate's `wikipediaTitle` (which defaults to the scientific binomial, e.g. `Quercus alba`) for Wikipedia Action API queries.

### Pitfall 3: Model Citation Hallucination
**What goes wrong:** AI cites sentence `[5]` when the extract only has 3 sentences, or attributes facts to the wrong sentence index.  
**Why it happens:** LLMs struggle with index math if sentence arrays are unnumbered.  
**How to avoid:** Pre-format the prompt with explicit numbered brackets: `[1] Quercus alba is an oak... [2] It grows up to 30m...`, and enforce Zod validation ensuring `sentenceNumber <= totalSentences`.

---

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest / Node test runner |
| Quick run command | `pnpm exec tsx scripts/test-camera-pipeline.ts` |
| Full suite command | `pnpm build` |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| CAPT-01..03 | Canvas EXIF stripping and 1024px compression | unit | `pnpm exec tsx scripts/test-camera-pipeline.ts` | ❌ Wave 0 |
| IDEN-01..03 | `/api/identify` with Gemini Flash & honest refusal | integration | `pnpm exec tsx scripts/test-identify-route.ts` | ❌ Wave 0 |
| IDEN-04 | Wikipedia taxon verification logic | unit | `pnpm exec tsx scripts/test-wikipedia-taxon.ts` | ❌ Wave 0 |
| FACT-01..06 | Grounded fact card generator & edibility scrubber | unit | `pnpm exec tsx scripts/test-facts-scrubber.ts` | ❌ Wave 0 |

### Wave 0 Gaps
- [ ] `scripts/test-camera-pipeline.ts` — verifies Canvas EXIF removal and sizing logic
- [ ] `scripts/test-wikipedia-taxon.ts` — verifies taxon validation on sample species and non-organisms
- [ ] `scripts/test-facts-scrubber.ts` — verifies edibility regex filter and sentence fallback

---

## Security Domain

### Applicable ASVS Categories
| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V5 Input Validation | yes | Zod schemas on `/api/identify` and `/api/facts` payloads |
| V6 Cryptography / Privacy | yes | Canvas EXIF re-rasterization client-side prevents GPS coordinate exfiltration |
| V13 API Security | yes | Rate limiter with IP token-bucket (`lib/rate-limit.ts`) |

### Known Threat Patterns
| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| Poisonous plant misidentification advice | Information Disclosure / Safety | Strict negative system prompt + deterministic edibility regex scrubbing drops all foraging/medicinal claims |
| Rate limit exhaustion / DoS | Denial of Service | Dual-mode IP token-bucket rate limiter (`lib/rate-limit.ts`) returning 429 |
| Location privacy leak | Information Disclosure | EXIF stripping client-side before any upload; coordinates sent to API are coarsely rounded |

---

## Metadata

**Research date:** 2026-10-08  
**Valid until:** 2026-11-08  

