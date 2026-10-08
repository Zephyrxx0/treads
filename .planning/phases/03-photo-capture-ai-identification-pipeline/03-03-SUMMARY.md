# 03-03 SUMMARY: Grounded Facts, Safety Scrubber, FactCard & Trail Specimen Pins

## Execution Overview
- **Phase**: 03 - Photo Capture & AI Identification Pipeline
- **Plan**: 03-03 (Wave 3: Grounded facts generation, safety scrubber, interactive FactCard, `/entry/[id]` route, and map trail pins)
- **Status**: Completed successfully
- **Commit**: `78797df`

## Accomplishments
1. **Safety Scrubber & Citation Integrity Engine (`lib/facts-safety.ts`)**:
   - Implemented `containsSafetyViolations(text)` using strict deterministic regex:
     `/\b(edible|inedible|eat\w*|taste|tasty|culinary|recipe|salad|soup|boil\w*|cook\w*|forag\w*|medicinal|remedy|cure|toxic|poison\w*|consumption)\b/i`.
   - Built `validateCitations(facts, maxSentenceIndex)` to enforce 1-indexed sentence bounds and discard any contaminated foraging or toxic claims.
   - Built `getFallbackFact(leadSentences)` guaranteeing sentence #1 verified fallback if synthesis yields zero safe facts (per FACT-04).
   - Validated against positive and negative test cases via `scripts/test-facts-scrubber.ts`.
2. **Grounded Facts Route (`app/api/facts/route.ts`)**:
   - IP rate limited (60 requests / 24 hours per IP) via `checkRateLimit(req, 'facts')`.
   - Retrieves Wikipedia lead extract and tokenizes into indexed sentences using native `Intl.Segmenter`.
   - Synthesizes 2-3 sentence overview (max 40 words) and up to 3 biological facts (max 20 words each) citing source sentence numbers via `@ai-sdk/google` (Gemma/Gemini) or verified extract fallback when offline/unkeyed.
   - Enforces post-generation safety scrubbing and caches responses in memory by Wikipedia title (per FACT-06).
3. **Interactive FactCard (`components/entry/fact-card.tsx`) & Base UI Popover (`components/ui/popover.tsx`)**:
   - Built Base UI `Popover` primitive styled with Tangerin Dream design tokens.
   - FactCard features Amaranth overview text, interactive citation pills (`[1]`, `[4]`) toggling popovers revealing verbatim Wikipedia source sentences, mandatory safety disclaimer (*"This is an AI field estimate. Don't eat, touch, or ingest anything based on this app."*), CC BY-SA 4.0 license badge, external Wikipedia link, and scaffolded Phase 4 audio narration button.
4. **Specimen Detail Page (`app/entry/[id]/page.tsx`)**:
   - Dynamic route loading entry from Dexie IndexedDB.
   - Renders 1024px hero image, taxon headers, capture timestamp, and coordinates pill.
   - Embeds interactive `FactCard`, automatically querying `/api/facts` in background if not yet generated.
5. **Trail Map Specimen Pins, Walk HUD & End Walk Summary Reel**:
   - `WalkMap`: Dynamically renders 36px circular thumbnail pins on the MapLibre trail with color-coded taxon border rings (emerald for plants/trees, sky blue for birds, terracotta for insects, amber for fungi). Tapping opens `/entry/[id]`.
   - `WalkHud`: Renders live glassmorphism specimen counter pill (`🌱 X finds`).
   - `WalkSummarySheet`: Displays horizontal species reel (`Specimens Logged Today`) with thumbnail avatars linking to `/entry/[id]`.
