# Treads 🌿

> *Step outside. Notice what lives.*

Treads is a mindful, local-first naturalist companion that turns outdoor walks into observational field journals. It combines pedestrian loop generation, on-device AI species identification, Wikipedia-verified naturalist notes, voice observation capture, tactile sensory cues, and one-tap Obsidian vault exports.

Built for the **Google AI Studio / Gemini Naturalist Challenge**.

---

## Key Highlights

- **🔒 100% Local-First & Privacy Sovereign (`CONS-01` - `CONS-04`):**
  - All field observations, GPS breadcrumbs, photos, and voice notes live directly in browser IndexedDB.
  - EXIF GPS metadata is stripped before client queries.
  - Strict first-visit privacy consent gate with durable storage request (`navigator.storage.persist()`).

- **🧭 Pedestrian Loop Navigation (`WALK-01` - `WALK-03`):**
  - Interactive MapLibre GL vector maps with outdoor topography tiles.
  - Suggested walking loops (15m, 30m, 45m) generated via OpenRouteService pedestrian routing.
  - Background-resilient GPS tracking with 35m accuracy filtering and automatic wake resumption.

- **🔍 Two-Tap Taxonomic Species Identification (`CAPT-01`, `EVAL-01`):**
  - Multimodal vision identification powered by Google Gemini.
  - Returns up to 3 candidate species with taxonomic ranks and confidence scoring.
  - Honest refusal engine refusing non-living inanimate objects and human portraits.
  - Headless 30-fixture evaluation suite (`pnpm test:eval`) verifying ≥70% organism accuracy and ≥90% honest refusal rate.

- **📖 Wikipedia Educational Fact Cards (`SPEC-01`):**
  - Three verified sentence-level natural history facts linked to source Wikipedia citations.
  - Cached for offline retrieval.

- **🖋️ Tegaki Handwriting & Cuelume Sensory Polish (`DSGN-03` - `DSGN-05`):**
  - Progressive Japanese Tegaki-style ink handwriting reveal with `Caveat` font and `prefers-reduced-motion` bypass.
  - Dual-oscillator synthesized Web Audio chimes (E5–G#5 major third capture chime, C5–E5–G5–C6 celebration arpeggio).
  - Tactile native haptic vibration (`navigator.vibrate`) on capture and hunt victory.

- **🎙️ Voice Observation Notes & Speech (`VOIC-01`, `VOIC-02`):**
  - Voice recording with live canvas waveform visualization.
  - ElevenLabs speech-to-text transcription and high-fidelity text-to-speech naturalist narration.

- **🎯 Daily Species Hunt Challenge (`HUNT-01`, `HUNT-02`):**
  - Daily rotation of naturalist targets (birds, trees, insects, fungi).
  - Celebration dialog and celebratory audio/haptic rewards on fulfillment.

- **📓 Obsidian-Compatible Vault Export (`EXP-01`, `EXP-02`):**
  - One-tap export generating a zip archive containing Markdown notes with YAML frontmatter, organized photos, and full database backup.

---

## Tech Stack

- **Framework:** Next.js 16.4 (App Router, Turbopack) & React 19
- **UI & Tokens:** Tailwind CSS v4, Base UI primitives, Lucide React, a bone-paper and forest-ink design system, with isometric Hairline line figures for the hero and empty states
- **Database:** Dexie 4.4 (IndexedDB) with `dexie-react-hooks`
- **Maps:** MapLibre GL 6.13
- **AI & Speech:** Google Gemini (`@ai-sdk/google`, `ai`), ElevenLabs API
- **Audio & Motion:** Web Audio API (Cuelume dual-oscillator synthesizer), Motion

---

## Getting Started

### 1. Install Dependencies
```bash
pnpm install
```

### 2. Environment Variables
Create a `.env.local` file with the following keys:
```bash
# Google AI Studio (Gemini)
GOOGLE_GENERATIVE_AI_API_KEY=your_gemini_api_key

# ElevenLabs (Voice transcription & TTS)
ELEVENLABS_API_KEY=your_elevenlabs_api_key

# OpenRouteService (Pedestrian loops)
OPENROUTESERVICE_API_KEY=your_ors_api_key
```

### 3. Run Development Server
```bash
pnpm dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

### 4. Headless Evaluation Benchmark
Run the automated 30-fixture taxonomic identification and refusal test suite:
```bash
pnpm test:eval
```

### 5. Production Build
```bash
pnpm build
```

---

## Field Verification

See [`FIELD-VERIFICATION.md`](./FIELD-VERIFICATION.md) for the 8-step outdoor field walkthrough protocol.

---

## License
MIT
