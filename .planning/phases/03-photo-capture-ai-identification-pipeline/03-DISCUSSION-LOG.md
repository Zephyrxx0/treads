# Phase 3: Photo Capture & AI Identification Pipeline - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-10-08
**Phase:** 3-Photo Capture & AI Identification Pipeline
**Areas discussed:** Camera Capture & Canvas Compression, AI Candidate Selection & Refusal, Wikipedia Taxon Verification & Fact Cards, Walk Map Integration & Connectivity Handling

---

## Camera Capture & Canvas Compression

| Option | Description | Selected |
|--------|-------------|----------|
| Native OS camera via `<input type="file" capture="environment">` | Leverages phone's native camera with auto-focus, HDR, macro lens, and zero WebRTC permission friction | ✓ |
| Custom in-app viewfinder | `navigator.mediaDevices.getUserMedia` video stream inside web app | |
| You decide | Flexible choice | |

| Option | Description | Selected |
|--------|-------------|----------|
| Instant preview bottom sheet | Shows captured photo with "Retake" and "Identify Organism" buttons + "Stripping EXIF & optimizing..." badge | ✓ |
| Direct pipeline execution | Immediately start identification skipping preview | |
| You decide | Flexible choice | |

| Option | Description | Selected |
|--------|-------------|----------|
| Dual storage in Dexie | Store 1024px photo (~150KB) + generate lightweight 160px thumbnail (~15KB) for instant map pins and lists | ✓ |
| Single 1024px photo in Dexie | Store only 1024px photo and resize on the fly | |
| You decide | Flexible choice | |

| Option | Description | Selected |
|--------|-------------|----------|
| Universal file picker fallback | Desktop browsers allow standard file selection (JPG, PNG, HEIC, WebP) with identical Canvas stripping | ✓ |
| Strict mobile camera only | Block desktop or show unsupported message | |
| You decide | Flexible choice | |

---

## AI Candidate Selection & Refusal

| Option | Description | Selected |
|--------|-------------|----------|
| Bottom sheet drawer on `/walk` | Keeps walker in walk context, presenting up to 3 candidates as interactive cards with confidence badges | ✓ |
| Full-screen review page (`/identify/[id]`) | Navigates away from map to dedicated identification screen | |
| You decide | Flexible choice | |

| Option | Description | Selected |
|--------|-------------|----------|
| Educational refusal card | Explains clearly ("We noticed an inanimate object or person. Treads tracks living organisms in nature") with "Retake" and "Save as Unidentified Note" | ✓ |
| Minimal warning modal | Brief alert with single dismiss button | |
| You decide | Flexible choice | |

| Option | Description | Selected |
|--------|-------------|----------|
| Display candidates with advisory badge + fallback | Show candidates with amber "Unsure" badges and an explicit "None of these / Save as Unidentified" button alongside "Retake" | ✓ |
| Strict threshold filter | Bypass candidate list entirely if all unsure | |
| You decide | Flexible choice | |

| Option | Description | Selected |
|--------|-------------|----------|
| Specialized model pairing | Use Gemini Flash (multimodal) for `/api/identify` photo organism candidate generation, and Gemma (open-weight text) for `/api/facts` Wikipedia grounding | ✓ |
| Runtime cascade | Attempt Gemma first on `/api/identify`, fallback to Gemini Flash | |
| You decide | Flexible choice | |

---

## Wikipedia Taxon Verification & Fact Cards

| Option | Description | Selected |
|--------|-------------|----------|
| Taxon validation via Wikipedia metadata | Query Wikipedia API with `redirects=1` and check for biological categories / taxon markers; mark with green "Verified Biological Taxon" badge | ✓ |
| Strict binomial title matching | Exact match only on title | |
| You decide | Flexible choice | |

| Option | Description | Selected |
|--------|-------------|----------|
| Interactive cited fact cards | 3 bullet points with clickable citation pills (`[1]`, `[4]`) toggling inline popover showing verbatim Wikipedia sentence + "Open in Wikipedia" link | ✓ |
| Clean static fact cards | Static bullet points with footnote badges | |
| You decide | Flexible choice | |

| Option | Description | Selected |
|--------|-------------|----------|
| Multi-layer defense | Strict negative system prompt constraint + deterministic server-side regex blacklist (`edible|toxic|poisonous|medicinal|remedy|forag*|culinary|tasty`), rejecting/filtering flagged facts | ✓ |
| Post-processing sanitizer only | Regex redact words only without failing request | |
| You decide | Flexible choice | |

| Option | Description | Selected |
|--------|-------------|----------|
| Dedicated `/entry/[id]` page | Hero photo with pinch/zoom, common & scientific names, verified taxon badge, interactive fact card, GPS pill, and scaffolded "Listen" button | ✓ |
| Drawer-only view | Modal drawer without dedicated route | |
| You decide | Flexible choice | |

---

## Walk Map Integration & Connectivity Handling

| Option | Description | Selected |
|--------|-------------|----------|
| Circular thumbnail marker pin | 36px circular badge on trail with 160px photo thumbnail and color-coded taxon ring, tapping opens summary drawer | ✓ |
| Minimal numbered pin | Numbered dot on trail | |
| You decide | Flexible choice | |

| Option | Description | Selected |
|--------|-------------|----------|
| HUD specimen count pill | Compact glassmorphism chip (`🌱 X finds`) in top HUD; tapping opens horizontal quick drawer of walk finds | ✓ |
| Badge on camera button | Numeric badge overlay on shutter button | |
| You decide | Flexible choice | |

| Option | Description | Selected |
|--------|-------------|----------|
| Optimistic local draft save | Immediately save photo and GPS to Dexie with status `saved`, drop amber badge pin on map, show toast, provide 1-tap Retry button | ✓ |
| Immediate modal retry | Persistent retry modal | |
| You decide | Flexible choice | |

| Option | Description | Selected |
|--------|-------------|----------|
| Visual species reel in summary drawer | Horizontal scrolling reel of captured organism photos with common names and verified badges below distance/time metrics | ✓ |
| Compact stat count only | Stat number only without photos | |
| You decide | Flexible choice | |

---

## the agent's Discretion

- Canvas downscaling interpolation algorithm for 1024px photo and 160px thumbnail.
- Taxon category border ring colors on map pins.
- Debounce and retry delay timing for Wikipedia Action API queries.

## Deferred Ideas

None — discussion stayed within Phase 3 scope.
