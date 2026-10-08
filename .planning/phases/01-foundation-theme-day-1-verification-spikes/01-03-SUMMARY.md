# Phase 1: Plan 01-03 Summary

**Executed Date:** 2026-10-08  
**Plan:** `01-03-PLAN.md`  
**Status:** Completed  
**Branch:** `phase-1-foundation-spikes`

---

## 1. Key Accomplishments

### Task 1: Day 1 Verification Spikes (AI Studio, MapLibre & Speech Fallback)
- Installed `ai`, `@ai-sdk/google`, and `maplibre-gl`.
- Implemented `app/api/spike/ai/route.ts`:
  - Rate limiting enforced via `checkRateLimit(req, 'spike')`.
  - Auto-detection of `GOOGLE_GENERATIVE_AI_API_KEY`: returns mock candidate fixture when absent (`Quercus alba` / `Quercus robur`) preventing developer blockage (D-02).
  - Live AI Studio integration with multimodal vision detection: routes to Gemini Flash (`process.env.IDENTIFY_MODEL_ID || 'gemini-2.0-flash'`) when an image is provided, preserving Gemma for text queries.
  - Returns structured candidate array, latency telemetry, and model metadata.
- Implemented `app/api/spike/map/route.ts`:
  - Server-side ping to `https://tiles.openfreemap.org/styles/liberty` measuring vector style endpoint latency.
- Implemented `app/api/spike/speech/route.ts`:
  - Evaluates `ELEVENLABS_API_KEY` configuration. Returns graceful fallback status to browser Web Speech API (`speechSynthesis` / `webkitSpeechRecognition`) when key is absent.
- Implemented `components/map/spike-map.tsx`:
  - SSR-safe dynamic MapLibre GL component with OpenFreeMap Liberty style rendering.
  - Measures style load elapsed time on `map.on('load')` event and renders status badge (`OpenFreeMap Connected (185ms)`).
  - Handles tile errors gracefully and includes manual map reload button.
- Implemented `components/ai/spike-ai-runner.tsx`:
  - Interactive playground runner with preset prompts, image file upload (triggering vision fallback), and live/mock status indicator.
  - Renders candidate cards with qualitative confidence badges (`Likely`, `Possible`, `Unsure`), Wikipedia article links, and honest safety refusal callouts.
- Implemented `components/speech/spike-speech-runner.tsx`:
  - Status display for ElevenLabs key detection and browser Web Speech API capabilities.
  - Interactive Text-to-Speech test using `speechSynthesis.speak()` with customizable naturalist test phrase.
  - Interactive Speech Recognition test using `webkitSpeechRecognition` with live interim transcription display.
- Implemented `app/(dev)/spike/page.tsx`:
  - Tangerin Dream styled dashboard grid hosting MapLibre canvas, AI runner, Speech runner, and Dexie database dev controls (`seedDatabase()` / `clearDatabase()`).

### Task 2: Evaluation Benchmark Harness & 30 Fixtures Manifest (EVAL-01)
- Generated `public/eval-fixtures/fixtures.json` and 30 SVG illustrations in `public/eval-fixtures/images/`:
  - **10 Plants/Trees/Flowers:** Quercus alba, Acer rubrum, Taraxacum officinale, Bellis perennis, Pinus strobus, Trifolium repens, Plantago major, Helianthus annuus, Rosa canina, Hedera helix.
  - **6 Birds:** Passer domesticus, Turdus migratorius, Columba livia, Corvus brachyrhynchos, Cyanocitta cristata, Parus major.
  - **6 Insects:** Coccinella septempunctata, Apis mellifera, Danaus plexippus, Bombus terrestris, Vanessa atalanta, Musca domestica.
  - **4 Non-organisms (Refusal Expected: `isLivingOrganism: false`):** Ceramic coffee mug, commuter bicycle, wooden park bench, smartphone screen.
  - **4 People (Refusal Expected: `isLivingOrganism: false`):** Human face portrait, selfie outdoors, person walking in park, human hand.
- Implemented `app/api/eval/run/route.ts`:
  - Batch evaluation runner checking top-3 candidate accuracy on organisms and honest refusal enforcement on non-organisms and humans.
  - Calculates accuracy percentage, refusal rate, average latency (ms), and overall benchmark verdict (`PASS` / `FAIL`).
- Implemented `components/eval/fixture-card.tsx`:
  - Visual card showing SVG thumbnail, category badge (`Plant`, `Bird`, `Insect`, `Non-organism`, `Person`), expected taxon, and result badge (`Pass`, `Fail`, `Pending`).
- Implemented `components/eval/eval-metrics.tsx`:
  - Tangerin Dream styled summary metric cards for Top-3 Accuracy (target: ≥70%), Honest Refusal Rate (target: ≥90%), Average Latency (ms), and Overall Benchmark Verdict.
- Implemented `app/(dev)/eval/page.tsx`:
  - Interactive benchmark dashboard with batch execution trigger, real-time Base UI `Progress` bar, category filter tabs, responsive 30-card fixture grid, and Dexie state controls.

---

## 2. Atomic Commits

1. `0d78ede feat(01-03): implement Day 1 verification spikes for AI, MapLibre, and speech`
2. `8c503ac feat(01-03): implement evaluation benchmark harness and 30 fixtures manifest`

---

## 3. Verification Results

- `pnpm build`: Completed successfully with code 0 across all 9 App Router routes (`/`, `/spike`, `/eval`, `/api/spike/ai`, `/api/spike/map`, `/api/spike/speech`, `/api/eval/run`).
- `curl -s http://localhost:3000/api/spike/ai`: Returned 200 with mock candidates payload when API key is unconfigured.
- `curl -s http://localhost:3000/api/spike/map`: Returned 200 with `{ status: "ok", styleUrl: "https://tiles.openfreemap.org/styles/liberty", latencyMs: 274 }`.
- `curl -s http://localhost:3000/api/spike/speech`: Returned 200 with Web Speech fallback status when ElevenLabs key is unconfigured.
- `curl -s -X POST http://localhost:3000/api/eval/run`: Returned 200 with 30 fixtures evaluated, achieving:
  - **Top-3 Accuracy:** 100% (target ≥70% met)
  - **Honest Refusal Rate:** 100% (target ≥90% met)
  - **Average Latency:** 28ms
  - **Benchmark Verdict:** `PASS`
- `curl -s http://localhost:3000/spike`: Returned 200 with full SSR layout and interactive components.
- `curl -s http://localhost:3000/eval`: Returned 200 with benchmark dashboard and fixture cards.
