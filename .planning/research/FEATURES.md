# Feature Research

**Domain:** Nature Exploration & Field Journal Web Application ("Touch Grass" Theme)  
**Researched:** 8 October 2026  
**Confidence:** HIGH  

---

## Feature Landscape

### Table Stakes (Users Expect These)

Features users assume exist in a nature-identification and walking application. Missing these causes the product to feel incomplete, untrustworthy, or broken.

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| **Two-Tap Photo Capture** | Walkers need to photograph organisms without fiddling through multi-step menus or losing sight of moving fauna. | LOW | Native `<input type="file" accept="image/*" capture="environment">` avoids custom WebRTC camera hassles, leverages OS camera auto-focus, macro mode, and hardware flash. |
| **Canvas EXIF Stripping** | Mobile photos embed high-precision GPS, device serials, and timestamps. Sending raw EXIF to external APIs violates baseline privacy expectations. | LOW | Client-side HTML5 Canvas decoding and re-rasterization to 1024px JPEG (`quality: 0.82`). Completely strips EXIF/TIFF tags and reduces upload payloads from ~6MB to ~150KB. |
| **3-Candidate Identification** | Nature AI can rarely be 100% certain from a single outdoor phone snap; presenting only one result leads to user distrust when wrong. | MEDIUM | Multimodal inference via Google AI Studio (`gemma-4` with `gemini-2.0-flash` fallback). Returns top 3 candidates with common name, scientific name, taxon kind, confidence level, and visible diagnostic features. |
| **Wikipedia Verification** | LLMs hallucinate non-existent binomials or confuse colloquial names. Users expect names to refer to real, documented living organisms. | MEDIUM | Server-side verification via Wikipedia REST / Action API (`redirects=1`). Checks that candidate scientific names resolve to biological taxonomy pages. Unverified candidates are flagged and suppressed from fact generation. |
| **Grounded Fact Cards** | Users want to learn interesting ecological context about what they found without wading through 10-page scientific papers. | MEDIUM | Fact generator fed *strictly* with numbered Wikipedia lead sentences (`exintro=1&explaintext=1`). Generates a ≤40-word summary and up to three ≤20-word bullet points, strictly citing sentence numbers. |
| **Local IndexedDB Journal** | A walking app must preserve history across sessions so walkers can revisit past finds, dates, and locations. | MEDIUM | Backed by Dexie.js in browser IndexedDB. Stores walks, entries, photos (as blobs/data URLs), audio notes, and coordinates on-device. Requests persistent browser storage (`navigator.storage.persist()`). |
| **Trail Map & Geolocation** | Walkers expect to see where their walk took place and where each specimen was spotted along their route. | MEDIUM | Interactive vector map powered by MapLibre GL with OpenFreeMap `liberty` style tiles. Displays real-time GPS position, filtered walk breadcrumbs, and specimen marker pins color-coded by organism kind. |

---

### Differentiators (Competitive Advantage)

Features that set Treads apart from legacy platforms (iNaturalist, Seek, PictureThis, Google Lens). These embody the product's philosophy: *"The phone is a lens, not a feed."*

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| **Honest Taxonomic Uncertainty** | Avoids false precision. Instead of claiming 98.4% certainty on a blurry leaf, Treads surfaces qualitative tiers (*Likely*, *Possible*, *Unsure*) and backs off to genus-level names. | MEDIUM | Prompt instructions enforce genus fallbacks when species-level visual markers are ambiguous. Candidates also show *why* the model proposed them (visible morphological clues). |
| **Wikipedia Sentence Citations** | Complete transparency against AI hallucinations. Every single fact bullet points to its exact verifiable Wikipedia sentence index. | HIGH | Strict pipeline: Server extracts lead sentences, model generates facts citing `[1]`, `[2]`, etc., and server validates citations before delivering JSON to the client. Retries once on invalid citations; falls back to raw lead sentence #1. |
| **Active Edibility & Poison Filter** | Eliminates dangerous foraging or herbalism hallucinations. Absolute safety guarantee for curious parents and children. | LOW | Two-stage defense: System prompt bans edibility, medicinal, or tactile safety claims; server regex/keyword filter immediately drops any sentence mentioning eating, taste, toxicity, poison, ingestion, or remedy. Permanent disclaimer on every card. |
| **Open-Weight Transparency** | High ethical standard: core identification and writing are designed for open-weight models (Gemma 4), avoiding lock-in to proprietary black-box APIs. | MEDIUM | Implemented via Vercel AI SDK (`@ai-sdk/google`). Model IDs are environment-configured (`IDENTIFY_MODEL_ID`, `FACTS_MODEL_ID`), allowing seamless self-hosting via Ollama or vLLM in private clouds. |
| **Zero Server Storage (Privacy-First)** | Walkers explore sensitive, private, or remote locations. Zero user data, photos, audio notes, or GPS coordinates are stored on remote servers. | LOW | Server routes (`/api/identify`, `/api/facts`, `/api/transcribe`) operate strictly as stateless proxies. No database on the backend; all state lives in client IndexedDB. |
| **Multilingual Voice Notes with Web Speech Fallback** | Hands-free nature journaling: walkers can dictate thoughts in any language without typing on a keyboard under harsh sunlight. | MEDIUM | Dual-mode implementation: ElevenLabs Scribe STT with automatic language detection + ElevenLabs UI Live Waveform. Seamlessly falls back to browser native Web Speech API (`webkitSpeechRecognition`) if API key is absent. |
| **Deterministic Daily Species Hunt** | Gamification without cloud servers, social comparison, or dark patterns. Encourages diverse outdoor observation. | LOW | Client-side daily challenge seeded deterministically by hashing the local calendar date (`YYYY-MM-DD`) against a rule matrix (e.g. "Find 3 plants and 1 insect"). Instant evaluation against confirmed entries. |
| **Obsidian-Compatible Markdown Export** | True data sovereignty: users aren't locked into a proprietary silo. They can export their entire walk history into their personal knowledge base. | MEDIUM | Client-side JSZip compilation: creates `walks/YYYY-MM-DD-walk-[id].md` linking to local photos in `media/`, formatted species fact cards with CC BY-SA Wikipedia attribution in `species/`, and a raw `treads-backup.json` Dexie dump. |

---

### Anti-Features (Commonly Requested, Often Problematic)

Features that seem appealing on the surface but conflict with Treads' product philosophy, user privacy, or hackathon timeline constraints.

| Feature | Why Requested | Why Problematic | Alternative |
|---------|---------------|-----------------|-------------|
| **User Accounts & Cloud Sync** | "Sync my journal across phone, tablet, and laptop." | Requires authentication backends, cloud databases, user privacy policies, GDPR compliance, image hosting costs, and credential management. Dilutes the privacy promise. | Pure client-side IndexedDB storage with persistent storage API grant + one-tap full JSON/Markdown ZIP export and import. |
| **Social Feeds, Likes & Leaderboards** | "Share finds with friends, see what neighbors found." | Induces screen addiction, gamifies nature into dopamine loops, leads to geotag poaching of rare flora/fauna, and requires moderation infrastructure. Violates "Touch Grass" theme. | Keep the phone as a field lens. Personal life list (`/collection`) and celebration animations celebrate personal curiosity, not social clout. |
| **Offline Caching & Sync Queues (PMTiles / PWA Offline)** | "Nature walks often have spotty cellular signal." | Enormous architectural complexity: Service Worker caching, background sync queues, conflict resolution, multi-gigabyte vector tile bundles (PMTiles), offline SLMs. Risk of silent sync failures. | Lean, honest online-only contract. When network drops, the app informs the user cleanly ("Saved locally. Identification paused — tap Retry when back in range") without silent background queues. |
| **Foraging & Edibility Advice** | "Can I eat this mushroom / berry / weed?" | Extreme liability and physical danger. AI models notoriously confuse deadly toxic lookalikes (e.g., Destroying Angel vs. Meadow Mushroom, Hemlock vs. Wild Carrot). | Absolute zero-tolerance policy. Banned in system prompts, filtered by server validators, accompanied by mandatory card banner: *"This is a best guess. Don't eat or touch anything based on this app."* |
| **Background GPS Trail Tracking (Screen Off)** | "Track my hike path while phone is locked in pocket." | Progressive Web Apps in mobile browsers cannot reliably run background GPS without native OS background location permissions (which kill battery and get suspended by OS task killers). | Foreground-only tracking: record GPS coordinate on each photo capture pin, and sample points while screen is active. Label the resulting route "Approximate trail". |
| **Real-Time Video / Continuous Camera Scanning** | "Point camera at bush and see bounding boxes live." | Massive battery drain, device overheating outdoors, excessive AI inference costs, and forces the user to stare at their phone screen instead of the trail. | Intentional discrete two-tap capture: snap photo, receive haptic buzz confirmation, put phone back in pocket, enjoy the walk, review results at leisure. |

---

## Feature Dependencies

```
[System Camera Photo Capture]
    │
    └──requires──> [Canvas EXIF Stripping & 1024px Resizing]
                       │
                       └──stores──> [Local IndexedDB Journal (Dexie)]
                       │
                       └──sends───> [/api/identify (Gemma 4 / Flash)]
                                        │
                                        └──requires──> [Wikipedia Taxon Verification]
                                                           │
                                                           └──triggers──> [/api/facts (Numbered Lead Sentences)]
                                                                              │
                                                                              └──requires──> [Sentence Citation Validator & Edibility Filter]
                                                                                                 │
                                                                                                 └──renders──> [Grounded Fact Card]
                                                                                                                   │
                                                                                                                   ├──enhances──> [TTS "Listen" Narration]
                                                                                                                   └──feeds─────> [Life List & Daily Hunt]

[GPS Geolocation API]
    │
    └──filters───> [GPS Drift Noise Filter (≤35m)]
                       │
                       └──renders──> [MapLibre GL Trail Map & Capture Pins]
                                         │
                                         └──enhances──> [Loop Route Suggestion (ORS)]

[IndexedDB Journal]
    │
    └──exports───> [Obsidian-Compatible Markdown ZIP]

[Microphone Stream]
    │
    └──records───> [ElevenLabs Scribe STT / Web Speech Fallback]
                       │
                       └──attaches──> [Journal Entry Voice Note]
```

### Dependency Notes

- **`[Canvas EXIF Stripping]` requires `[System Camera Capture]`:** Raw camera captures must pass through an in-memory HTML5 Canvas before touching either IndexedDB or network requests to guarantee total removal of location metadata from the JPEG binary.
- **`[Wikipedia Taxon Verification]` requires `[/api/identify]`:** Identification yields proposed scientific binomials; verification actively hits Wikipedia REST API with redirects enabled to guarantee the species is a biological organism before fact generation is permitted.
- **`[Grounded Fact Card]` requires `[Citation Validator & Edibility Filter]`:** Fact generation cannot deliver raw model outputs directly to the UI. Sourced sentence numbers must be verified against actual indices, and safety filters must verify zero mentions of consumption.
- **`[Obsidian Markdown ZIP]` requires `[IndexedDB Journal]`:** The export engine reads directly from Dexie's `walks`, `entries`, and `notes` tables, packaging them alongside blob photos into an organized folder structure.
- **`[Trail Map]` enhances `[Loop Route Suggestion]`:** The map provides the visual canvas, while OpenRouteService provides the optional circular walking route starting from the user's current GPS location.
- **`[Zero Server Storage]` conflicts with `[User Accounts & Social Feeds]`:** Maintaining 100% on-device private data prevents implementation of central user accounts, shared social activity streams, or remote sync backends.
- **`[Online-Only Architecture]` conflicts with `[PMTiles / Offline Service Worker Queue]`:** Choosing a simple, rock-solid online-first workflow with explicit user retries eliminates the need for heavyweight offline tile caches and complex synchronization state machines.

---

## MVP Definition

### Launch With (v1)

The minimum viable product necessary to validate the concept and submit to the 5-day hackathon challenge:

- [ ] **First-Run Privacy Consent Screen (`/`)**: Versioned consent modal explaining AI transmission, local storage, and safety boundaries before allowing camera or GPS access.
- [ ] **Two-Tap Photo Capture with Canvas EXIF Stripper**: Fast capture flow resizing to 1024px JPEG and stripping EXIF metadata.
- [ ] **3-Candidate Identification Pipeline (`/api/identify`)**: Gemma 4 multimodal model with Gemini Flash fallback, returning top 3 taxonomic candidates with visual diagnostic clues.
- [ ] **Wikipedia Taxon Verification**: Automatic validation that candidate scientific names resolve to biological taxonomy pages on Wikipedia.
- [ ] **Grounded Fact Card Engine (`/api/facts`)**: Model extracts summary and up to 3 facts strictly citing numbered Wikipedia sentences, validated server-side.
- [ ] **Edibility & Safety Filter**: Strict regex/keyword stripping of any toxic, medicinal, or ingestion claims, plus persistent warning banner.
- [ ] **Active Walk Session & GPS Map (`/walk`)**: Start/End walk controls, MapLibre GL map with OpenFreeMap tiles, capture pins, and approximate trail line.
- [ ] **Local IndexedDB Journal (`/journal`, `/entry/[id]`)**: Dexie.js persistence for all walks, photos, coordinates, and verified fact cards.
- [ ] **Voice Notes (`/api/transcribe`)**: Hold-to-record voice memo with ElevenLabs Scribe STT and browser Web Speech API fallback.
- [ ] **Obsidian-Compatible ZIP Export (`/settings`)**: Export all walks, entries, photos, and JSON backup into a clean ZIP file.
- [ ] **Tangerin Dream Design System & Lucide Icons**: Consistent, beautiful nature-inspired UI with warm autumn palette and responsive layout.

### Add After Validation (v1.x)

Features to add once core capture, identification, and journaling are verified end-to-end:

- [ ] **Deterministic Daily Species Hunt (`/collection`)**: Client-side date-seeded challenge (e.g. "Find 2 plants and 1 insect") with celebratory progress triggers.
- [ ] **TTS "Listen" Audio Narration (`/api/speak`)**: ElevenLabs Text-to-Speech reading fact cards aloud with local audio hash caching.
- [ ] **Loop Route Suggestion (`/api/route`)**: OpenRouteService integration generating a 1–3 km circular walking path from current GPS location.
- [ ] **Tegaki Progressive Handwriting Reveal**: Animated handwriting stroke effect on landing hero and fact card titles.
- [ ] **Cuelume Synthesized Audio Chimes**: Web Audio oscillator feedback for capture and hunt completion (off by default).
- [ ] **Walk Summary Micro-Charts**: Sparklines and duration/species mini-visualizations on walk completion card.
- [ ] **Journal Activity Heatmap**: Visual contribution-style calendar grid of walk activity in the journal view.

### Future Consideration (v2+)

Features deferred until post-hackathon validation and community feedback:

- [ ] **Dark / Light Mode Toggle**: Implement theme switching if Tangerin Dream token contrast is verified across all outdoor lighting conditions.
- [ ] **QR Code Landing Portal**: Quick QR code on desktop landing page allowing instant mobile phone handoff to `/walk`.
- [ ] **Shareable Social Summary Card**: Canvas-rendered graphic summarizing walk stats and photos for export to messaging apps.
- [ ] **Local On-Device Gemma Inference (WebGPU / Ollama)**: Pure offline local inference when WebGPU browser models achieve sufficient speed and vision accuracy.
- [ ] **Multilingual UI Localization**: Localizing the interface into Spanish, French, Hindi, and Japanese (beyond Scribe's automatic audio transcription).

---

## Feature Prioritization Matrix

| Feature | User Value | Implementation Cost | Priority |
|---------|------------|---------------------|----------|
| **Two-Tap Photo Capture & EXIF Strip** | HIGH | LOW | P1 |
| **Gemma / Flash 3-Candidate Identification** | HIGH | MEDIUM | P1 |
| **Wikipedia Taxon Verification** | HIGH | MEDIUM | P1 |
| **Grounded Fact Cards with Citations** | HIGH | MEDIUM | P1 |
| **Edibility & Safety Stripping** | HIGH | LOW | P1 |
| **Local Dexie Journal & Entry Views** | HIGH | MEDIUM | P1 |
| **MapLibre GL Map & Walk Pins** | HIGH | MEDIUM | P1 |
| **First-Run Versioned Consent Sheet** | HIGH | LOW | P1 |
| **Obsidian Markdown ZIP Export** | HIGH | MEDIUM | P1 |
| **Voice Notes (Scribe + Web Speech)** | MEDIUM | MEDIUM | P1 |
| **Deterministic Daily Species Hunt** | HIGH | LOW | P2 |
| **Loop Route Suggestion (ORS)** | MEDIUM | MEDIUM | P2 |
| **TTS "Listen" Narration** | MEDIUM | LOW | P2 |
| **Cuelume Sound & Haptic Feedback** | MEDIUM | LOW | P2 |
| **Tegaki Handwriting Animation** | MEDIUM | MEDIUM | P2 |
| **Walk Summary Micro-Charts** | MEDIUM | LOW | P2 |
| **Journal Activity Heatmap** | MEDIUM | MEDIUM | P2 |
| **Dark/Light Theme Toggle** | LOW | LOW | P3 |
| **Landing Page QR Code** | LOW | LOW | P3 |
| **Shareable Walk Summary Image** | MEDIUM | MEDIUM | P3 |

**Priority key:**
- **P1:** Must have for hackathon MVP launch (Days 1–3)
- **P2:** Should have, integrated as soon as core pipeline is green (Day 4)
- **P3:** Nice to have, polish or post-hackathon enhancements

---

## Competitor Feature Analysis

| Feature | iNaturalist / Seek | PictureThis / PlantNet | Google Lens | Treads Approach |
|---------|--------------------|------------------------|-------------|-----------------|
| **Privacy & Storage** | Public cloud upload; exact coordinates published unless obscured; account mandatory (iNat). | Requires account; photos stored on company servers; aggressive subscriptions. | Cloud-linked to Google account; photos indexed for search and ads. | **100% on-device (IndexedDB)**. Canvas strips EXIF client-side. Zero server persistence or user accounts. |
| **Identification Honesty** | Seek offers single computer-vision guess; iNaturalist relies on human crowdsourcing (takes hours/days). | Single definitive answer, often overconfident and inaccurate on obscure species. | Generic web visual search; prioritizes commercial product matches. | **Top 3 candidates with qualitative certainty** (*Likely*, *Possible*, *Unsure*) and genus-level fallbacks. |
| **Fact Grounding & Hallucinations** | Static encyclopedia blurbs from Wikipedia or nature guides without direct sentence attribution. | Unverified LLM/proprietary text blurb; prone to hallucinatory care instructions. | Direct Google search links; pulls user out of nature into web browsing. | **Strict sentence citation from Wikipedia**. Every fact cites source sentence numbers; non-traceable claims dropped. |
| **Safety & Foraging Guardrails** | Community warnings on poisonous species; no active filter against user foraging queries. | Suggests whether plants are edible/medicinal, presenting serious toxic risk if misidentified. | Generic search snippets with no liability guardrail. | **Zero foraging advice**. Model instructed never to discuss edibility; server aggressively scrubs any ingestion claims. |
| **Voice Journaling** | None. Text comments only. | None. | None (image search only). | **Multilingual voice notes** via ElevenLabs Scribe STT + Web Speech fallback, with live audio waveform. |
| **Data Ownership & Export** | CSV export of observations (metadata only, no bundled media). | Locked behind proprietary paywalled app. | Google Takeout (clunky, unformatted). | **Obsidian-compatible ZIP**: formatted Markdown, linked photos, CC BY-SA attributions, and full JSON dump. |
| **Screen Time Philosophy** | Encourages social browsing, commenting, and forum discussions (high screen time). | High-friction paywalls, upsells, daily plant care alerts, push notifications. | E-commerce links and search rabbit holes. | **"The screen is the shortest part."** Snap in 2 taps, pocket phone, explore outdoors, review facts later. |

---

## Sources

- **Internal Project Documents:**
  - `PRD.md` — Product Requirements Document (V1.0, 8 Oct 2026)
  - `DECISIONS.md` — Architecture & Design Decisions Matrix (V1.0, 8 Oct 2026)
  - `.planning/PROJECT.md` — Project Charter & Core Value Definition
- **Competitor Platforms:**
  - iNaturalist & Seek by iNaturalist (California Academy of Sciences & National Geographic)
  - PictureThis (Glority LLC) / Pl@ntNet (Inria / CIRAD)
  - Merlin Bird ID (Cornell Lab of Ornithology)
- **Open Standards & APIs:**
  - Wikipedia REST API & Action API (`exintro=1&explaintext=1`, CC BY-SA 4.0 licensing)
  - OpenFreeMap & MapLibre GL Vector Tile Standards
  - OpenRouteService Directions API (Foot-Walking profile)
  - ElevenLabs Scribe STT & Web Speech API W3C Recommendation
  - W3C File API & HTML5 Canvas 2D Context Specification
- **Design & Theme Specifications:**
  - Tangerin Dream CSS Design System (TweakCN)
  - Base UI Primitives (`@base-ui-components/react` / shadcn)

---
*Feature research for: Treads — Global Nature-Walk Companion*  
*Researched: 8 October 2026*
