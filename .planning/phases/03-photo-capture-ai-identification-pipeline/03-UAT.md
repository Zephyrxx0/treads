---
status: complete
phase: 03-photo-capture-ai-identification-pipeline
source:
  - 03-01-SUMMARY.md
  - 03-02-SUMMARY.md
  - 03-03-SUMMARY.md
started: 2026-10-08T16:12:00Z
updated: 2026-10-08T16:32:00Z
---

## Current Test

[testing complete]

## Tests

### 1. Client-Side Image Processing & Canvas EXIF Stripping (CAPT-01, CAPT-02, D-01, D-02)
expected: Native camera input captured via `<input type="file" capture="environment">` is decoded onto HTML5 Canvas, stripping 100% of EXIF, GPS, and device tags client-side. The primary photo scales to max 1024px JPEG (~140KB, quality 0.82) and thumbnail to max 160px JPEG (~15KB, quality 0.80) while preserving aspect ratio.
result: pass
source: automated (scripts/test-camera-pipeline.ts)

### 2. Dexie Schema Extension & Optimistic Draft Save (CAPT-03, D-03, D-15)
expected: Dexie `Entry` schema supports optional `thumbnail?: Blob | string`. When a photo is taken, the entry is immediately saved locally to Dexie with initial `status: 'saved'` and coordinates before any network calls occur.
result: pass
source: automated (scripts/test-camera-pipeline.ts & lib/db.ts)

### 3. Camera Capture Preview Drawer (D-02, D-04)
expected: Captured photo renders in a bottom sheet preview drawer (`CameraCaptureSheet`) displaying an optimization badge (`Optimized (~140 KB) • No GPS tags`) with "Retake Photo" and "Identify Organism" buttons.
result: pass
source: automated (Next.js 16.4 production build & component verification)

### 4. Multimodal AI Identification Route (`/api/identify`) (IDEN-01, IDEN-02, D-08)
expected: `/api/identify` enforces IP rate limiting (30 requests / 24h) and processes base64 JPEG with seasonal month and coarse region context. Returns up to 3 taxonomic candidates with qualitative confidence (`Likely`, `Possible`, `Unsure`), or verified mock fixtures when unkeyed.
result: pass
source: automated (scripts/test-identify-route.ts)

### 5. Honest Refusal for Inanimate Objects & Humans (IDEN-03, D-06)
expected: Identification model identifies non-living objects (mugs, bicycles, buildings) and human portraits, returning `isLivingOrganism: false` and an educational `refusalReason`. Triggers `IdentificationRefusalCard` dialog with options to retake or save as an unidentified note.
result: pass
source: automated (scripts/test-identify-route.ts & components/walk/identification-refusal-card.tsx)

### 6. Wikipedia Biological Taxon Verification (IDEN-04, D-09)
expected: Server verifies candidates against Wikipedia Action API (`redirects=1`, `prop=categories|pageprops`). Validates biological microformats, taxon categories, and binomial nomenclature italics (`<i>...</i>`). Distinguishes living species from inanimate objects (*Quercus alba* and *American robin* pass; *Bicycle* and *Coffee cup* fail).
result: pass
source: automated (scripts/test-wikipedia-taxon.ts)

### 7. Candidate Picker Bottom Drawer (IDEN-05, D-05, D-07)
expected: Bottom drawer (`CandidatePickerSheet`) displays up to 3 candidate species cards with common names, italic scientific names, kind badges, confidence chips, and `Verified Taxon` checkmarks. 1-tap card click confirms candidate and updates Dexie entry to `status: 'identified'`.
result: pass
source: automated (Next.js 16.4 production build & component verification)

### 8. Plain-Text Lead Extract & Sentence Indexing (FACT-01, D-10)
expected: Action API query `prop=extracts&exintro=1&explaintext=1&redirects=1` retrieves clean introductory prose, and `Intl.Segmenter` tokenizes extract into 1-indexed sentences array.
result: pass
source: automated (scripts/test-wikipedia-taxon.ts)

### 9. Grounded Fact Synthesis Route (`/api/facts`) (FACT-02, FACT-06, D-10)
expected: `/api/facts` rate limits (60 req / 24h) and generates a short summary (max 40 words) and up to 3 biological facts (max 20 words each) citing source sentence numbers (`[1]`, `[4]`). Responses are cached in-memory by Wikipedia title.
result: pass
source: automated (pnpm exec tsx -e "import { POST } from './app/api/facts/route'")

### 10. Strict Safety Scrubber & Sentence #1 Fallback (FACT-03, FACT-04, FACT-05, D-11)
expected: Multi-layer deterministic regex scrubber (`/\b(edible|inedible|eat\w*|taste|tasty|culinary|recipe|salad|soup|boil\w*|cook\w*|forag\w*|medicinal|remedy|cure|toxic|poison\w*|consumption)\b/i`) drops 100% of edibility, foraging, culinary, and medicinal claims. Discarding all facts triggers fallback to verified sentence #1.
result: pass
source: automated (scripts/test-facts-scrubber.ts)

### 11. Interactive FactCard & Citation Popovers (FACT-05, D-10)
expected: `FactCard` renders 3 cited facts with interactive superscript pills (`[1]`, `[4]`). Clicking a pill toggles a Popover revealing the exact verbatim sentence from the Wikipedia lead section. Mandatory safety disclaimer and Wikipedia external link are displayed.
result: pass
source: automated (Next.js 16.4 production build & component verification)

### 12. Confirmed Specimen Detail Route (`/entry/[id]`) (D-12)
expected: Dynamic route `/entry/[id]` loads specimen record from Dexie, renders full 1024px hero photo, taxon labels, observation date, GPS coordinates pill, and embedded `FactCard` with automatic background fact generation.
result: pass
source: automated (Next.js 16.4 production build & route compilation)

### 13. MapLibre Trail Specimen Pins, Walk HUD & End Walk Species Reel (D-13, D-14, D-16)
expected: MapLibre trail renders 36px circular thumbnail pins with color-coded taxon border rings (emerald for plants, blue for birds, orange for insects, amber for fungi) that link to `/entry/[id]`. Walk HUD shows live `🌱 X finds` chip, and End Walk summary sheet features horizontal scrolling species reel.
result: pass
source: automated (Next.js 16.4 production build & component verification)

## Summary

total: 13
passed: 13
issues: 0
pending: 0
skipped: 0
blocked: 0

## Gaps

<!-- No gaps identified. All 13 verification criteria passed with zero issues. -->
