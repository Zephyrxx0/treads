# Phase 3: Photo Capture & AI Identification Pipeline - Context

**Gathered:** 2026-10-08
**Status:** Ready for planning

<domain>
## Phase Boundary

Phase 3 delivers the two-tap organism capture workflow, client-side EXIF/GPS stripping with HTML5 Canvas compression, Google AI Studio identification with Gemini Flash, Wikipedia Action API biological taxon verification, grounded fact cards with sentence citations and edibility scrubbing, and integration into the `/walk` tracking HUD and MapLibre map.

</domain>

<decisions>
## Implementation Decisions

### Camera Capture & Canvas Compression
- **D-01:** Native OS camera trigger via `<input type="file" capture="environment">` — leverages mobile device camera features (auto-focus, HDR, macro lens) without WebRTC camera stream permission overhead.
- **D-02:** Instant preview bottom sheet on `/walk` — displays captured photo with quick "Retake" and "Identify Organism" buttons, alongside a subtle "Stripping EXIF & optimizing..." badge.
- **D-03:** Dual storage in Dexie IndexedDB — store 1024px photo (~150KB) as Blob plus a lightweight 160px thumbnail (~15KB) for instant map pins and journal list rendering performance. — **Reversibility:** costly — Dexie database schema and thumbnail field definitions require data migration if altered later.
- **D-04:** Universal file picker fallback — desktop browsers or unsupported devices support standard image selection (JPG, PNG, HEIC, WebP), running through the identical Canvas EXIF stripping pipeline.

### AI Candidate Selection & Refusal
- **D-05:** Bottom sheet drawer on `/walk` — keeps walker in walk context, presenting up to 3 candidates as interactive cards with confidence badges (Likely/Possible/Unsure) and one-tap selection to confirm.
- **D-06:** Educational refusal card — non-organism or human portraits trigger a warm, non-judgmental card ("We noticed an inanimate object or person. Treads tracks living organisms in nature") with "Retake Photo" and secondary "Save as Unidentified Note".
- **D-07:** Low-confidence identification UX — candidates with all "Unsure" ratings display amber badges with an explicit "None of these / Save as Unidentified" button alongside "Retake".
- **D-08:** Specialized model pairing — use Gemini Flash (multimodal) for `/api/identify` photo organism candidate generation, and Gemma (open-weight text model) for `/api/facts` Wikipedia grounding and synthesis, with graceful mock fallback if API key is absent. — **Reversibility:** costly — model routing and prompt schemas are paired across API routes.

### Wikipedia Taxon Verification & Fact Cards
- **D-09:** Wikipedia taxon verification — query Wikipedia Action API with `redirects=1` and verify biological taxonomy markers/categories (e.g. `Plants`, `Animals`, `Fungi`, `Taxobox`); biological matches receive a green "Verified Biological Taxon" badge.
- **D-10:** Interactive cited fact cards — 3 distinct facts with clickable citation pills (`[1]`, `[4]`) toggling an inline popover showing the exact verbatim Wikipedia sentence, accompanied by an "Open in Wikipedia" link pill.
- **D-11:** Multi-layer defense for edibility scrubbing — strict negative system prompt constraint plus deterministic server-side regex blacklist (`edible|toxic|poisonous|medicinal|remedy|forag*|culinary|tasty`), rejecting/filtering any flagged fact before saving to Dexie. — **Reversibility:** one-way — core safety contract preventing dangerous foraging advice.
- **D-12:** Dedicated `/entry/[id]` detail view — hero photo with pinch/zoom, species common and scientific names, verified taxon badge, interactive fact card, capture timestamp & GPS coordinates pill, and scaffolded "Listen" narration button (for Phase 4).

### Walk Map Integration & Connectivity Handling
- **D-13:** Circular thumbnail marker pins on MapLibre trail — 36px circular badge containing the 160px photo thumbnail with a color-coded taxon ring (green plant, orange insect, blue bird), tapping opens the summary drawer.
- **D-14:** Walk HUD specimen count pill — compact glassmorphism chip (`🌱 X finds`) in the top HUD; tapping opens a horizontal quick-drawer of finds during the current walk session.
- **D-15:** Optimistic local draft save — when cellular connectivity is weak or interrupted, immediately save photo and GPS to Dexie with status `saved`, drop an amber badge pin on the map, show toast notification ("Saved to device — tap to identify when back online"), and provide a 1-tap Retry button.
- **D-16:** Visual species reel in End Walk Summary Drawer — horizontal scrolling reel of captured organism photos with common names and verified badges right below the distance/time metrics, clicking opens `/entry/[id]`.

### the agent's Discretion
- Exact Canvas interpolation and downscaling algorithm (bicubic / step-down resampling) for 1024px photo and 160px thumbnail generation.
- Exact colors for taxon category border rings on map pins (green for plants/trees, amber for fungi, sky-blue for birds, orange for insects).
- Precise debounce and retry delay timing for Wikipedia Action API queries.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Architecture & Decisions
- `DECISIONS.md` § Decisions 2, 7, 10, 11 — Canvas EXIF stripping client-side, Wikipedia Action API deep lead text, open-weight AI model pairings
- `PRD.md` § 4.2, § 4.3, § 5.2, § 5.3 — Capture workflow, identification, fact cards, and Dexie `entries` schema
- `.planning/ROADMAP.md` § Phase 3 — Phase 3 goals, dependencies, requirements, and success criteria
- `.planning/REQUIREMENTS.md` § CAPT-01..03, IDEN-01..05, FACT-01..06 — Locked Phase 3 requirement specifications

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `lib/db.ts`: `Entry` table interface with fields `id`, `walkId`, `createdAt`, `timestamp`, `photo`, `lat`, `lng`, `accuracy`, `status`, `candidates`, `confirmed`, `verified`, `facts`.
- `app/api/spike/ai/route.ts`: Tested Google AI Studio candidate generation with `IdentificationResponseSchema`, Gemini Flash fallback, mock fixture fallback, and rate limiting.
- `components/walk/walk-controls.tsx`: Bottom action dock with camera capture trigger button scaffold (`Camera` icon button calling `onCameraClick`).
- `components/walk/walk-hud.tsx`: Floating top HUD pills; can be extended with the specimen count pill (`🌱 X finds`).
- `components/map/walk-map.tsx`: Full-screen MapLibre tracking component ready for specimen marker GeoJSON layer or HTML Marker additions.
- `components/walk/walk-summary-sheet.tsx`: Walk completion summary drawer ready for the visual species reel.
- `components/ui/`: Existing shadcn Base UI primitives (`Button`, `Card`, `Badge`, `Sheet`, `Dialog`, `Progress`) styled with Tangerin Dream theme tokens.

### Established Patterns
- Client-side persistence in Dexie with `crypto.randomUUID()` string keys.
- Next.js 16.4 App Router API routes (`app/api/.../route.ts`) returning JSON with dual-mode rate limiting (`lib/rate-limit.ts`).
- Tangerin Dream CSS variable tokens (`--color-primary`, terracotta `#F35C2B`, warm dark backgrounds).

### Integration Points
- `app/api/identify/route.ts`: Multimodal vision identification endpoint calling Google AI Studio.
- `app/api/facts/route.ts`: Wikipedia lead sentence extractor and grounded fact generator with edibility scrubbing.
- `components/walk/camera-capture-sheet.tsx`: Capture preview and confirmation drawer on `/walk`.
- `components/walk/candidate-picker-sheet.tsx`: AI candidate presentation drawer.
- `app/entry/[id]/page.tsx`: Confirmed entry detail route.

</code_context>

<specifics>
## Specific Ideas

- Two-tap organism capture: Walker taps camera button -> snaps photo -> previews -> AI identifies -> confirmed and pinned to trail.
- Multi-layer edibility scrubbing to strictly eliminate foraging and toxic risk.
- Interactive citation pills `[1]`, `[2]` linking directly to verbatim Wikipedia sentences.
- 160px local thumbnail generation alongside 1024px photo ensures zero map jank and lightning-fast journal scrolling.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within Phase 3 scope.

</deferred>

---

*Phase: 3-Photo Capture & AI Identification Pipeline*
*Context gathered: 2026-10-08*
