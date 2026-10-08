# Pitfalls Research

**Domain:** Mobile-first Nature Walk Web Application (Next.js, Vision AI, GPS, Web Audio, Device Storage)  
**Researched:** 8 October 2026  
**Confidence:** HIGH  

---

## Critical Pitfalls

### Pitfall 1: Android Chrome Background Tab Discarding & Memory Eviction

**What goes wrong:**  
A user starts a nature walk, turns off their phone screen, or switches to the native camera app. While the phone is pocketed or the native camera app is in use, Android's Low Memory Killer (LMK) throttles JavaScript timers, freezes background tabs, or completely terminates the Chrome renderer process. When the user takes a photo and unlocks their phone 20 minutes later, the web page reloads from scratch: the in-memory walk timer resets, the active route distance resets to 0, and unsaved transient finds disappear.

**Why it happens:**  
Unlike native Android applications that can spawn a persistent foreground service (`startForegroundService`) with an ongoing notification icon, browser tabs have no persistent background execution rights. Furthermore, modern native camera apps demand 300MB–800MB of RAM to process high-resolution HDR images. Android aggressively reclaims memory by killing background web browser tabs. Developers accustomed to desktop web development often hold session state in React component state (`useState`) or memory stores (`zustand`), assuming the page stays alive throughout the session.

**How to avoid:**  
1. **Continuous Dexie (IndexedDB) Persistence:** Write every walk state mutation (start time, each GPS fix, captured photo, identification status) directly to IndexedDB immediately. Never hold active walk progress purely in React state.
2. **Crash-Resilient Hydration:** On app boot (`/walk`), query Dexie for any walk record where `endedAt == null`. If found, automatically restore the active walk session seamlessly, calculating elapsed time from `Date.now() - walk.startedAt` rather than an accumulating `setInterval` counter.
3. **Explicit Foreground-Only Product Contract:** Acknowledge the web platform constraint upfront (as locked in PRD FR-W5 and A9): GPS sampling is active while the page is visible. The trail is explicitly labeled an "approximate path" formed by foreground breadcrumbs and capture pins.
4. **Page Lifecycle API Handling:** Hook into `document.addEventListener('visibilitychange')` and the `freeze` event to flush any buffered coordinates or state changes synchronously to Dexie before eviction.
5. **Request Persistent Storage:** Invoke `navigator.storage.persist()` during the consent flow to prevent Android Chrome from clearing IndexedDB under storage pressure.

**Warning signs:**  
- Launching the camera app from the file input causes the web app tab to refresh upon return.
- Leaving the phone locked for > 2 minutes resets the walk duration timer to 0:00.
- React state logs show initial mount lifecycle runs during an ongoing walk.

**Phase to address:**  
Phase 1 (Data schema, IndexedDB persistence, storage permission) & Phase 2 (Walk session lifecycle & crash recovery).

---

### Pitfall 2: Mobile GPS Drift, Multipath Jitter, and Severe Battery Drain

**What goes wrong:**  
Under outdoor conditions—especially tree foliage, wooded trails, or near rock formations—GNSS satellite signals suffer multipath interference. Raw coordinates jump wildly by 50 to 200 meters. A stationary user sitting on a park bench appears to be rapidly pacing around, accumulating hundreds of meters of phantom distance. Furthermore, keeping `navigator.geolocation.watchPosition` running with aggressive parameters causes the phone to heat up and drains 25%–40% of the battery within an hour.

**Why it happens:**  
Developers frequently attach raw `watchPosition` coordinates directly to the map polyline and accumulate distances via naive Haversine summation on every emitted coordinate fix. Raw mobile GPS chips report accuracy radii (`coords.accuracy`) that can exceed 100m in dense tree canopies. Continually polling the GNSS chip without caching thresholds (`maximumAge: 0`) forces high-power satellite tracking and prevents the mobile CPU from entering low-power sleep states.

**How to avoid:**  
1. **Accuracy Threshold Filtering:** Reject any GPS fix with `coords.accuracy > 35` meters (Decision 4). Discard the reading and do not append it to the walk's track points.
2. **Stationary Jitter Suppression:** Reject displacement changes `< 5` meters from the last recorded point unless at least `15` seconds have elapsed. This prevents the "spiderweb trail" artifact when the user pauses to inspect a flower.
3. **Plausible Speed Clamping:** Discard fixes that imply human walking speeds exceeding 15 km/h (4.2 m/s) between successive timestamps, marking them as anomalous satellite teleportation.
4. **Power-Conscious Geolocation Options:** Set `maximumAge: 5000` (allow 5-second cached fixes) rather than `maximumAge: 0`, and throttle map coordinate commits so the main thread remains idle between readings.
5. **Decouple Capture Location from Trail Jitter:** When the user taps capture, take the best available coordinate fix from the last 10 seconds or wait up to 3 seconds for a fix with `accuracy <= 25m`. If unavailable, record coordinates with their explicit accuracy radius.

**Warning signs:**  
- Walk distance accumulates while the phone is stationary on a desk or bench.
- Track line zig-zags across water bodies, buildings, or off marked hiking trails.
- Phone feels hot to the touch after 10 minutes of walking.

**Phase to address:**  
Phase 2 (Walk GPS tracking, noise filtering, and battery tuning).

---

### Pitfall 3: Camera Memory Spikes, Canvas OOM Crashes & Payload Caps (High-Megapixel Photos)

**What goes wrong:**  
A user takes a photo using a modern Android smartphone with a 48MP, 50MP, or 108MP camera. When the browser attempts to handle the image file, the tab silently crashes with an "Aw, Snap!" error (error code `Out of Memory` / SIGKILL). If the image avoids crashing the browser, converting it to a raw Base64 string creates an 8MB–20MB string that exceeds Next.js / Vercel Serverless payload limits (4.5MB ceiling), returning HTTP 413 (Payload Too Large).

**Why it happens:**  
Decoding a 12,000 × 9,000 pixel camera capture into an in-memory DOM `<img>` or full-size HTML5 Canvas requires allocating raw uncompressed 32-bit RGBA bitmap buffers: `12,000 × 9,000 × 4 bytes ≈ 432 MB` of uncompressed RAM. Mid-range Android devices allocate only 256MB–512MB of RAM per browser tab. Loading the full-resolution bitmap causes immediate mobile browser heap exhaustion. Furthermore, raw camera uploads leak sensitive EXIF metadata (exact home coordinates, timestamp, device model).

**How to avoid:**  
1. **Canvas Downsampling & Re-rasterization (Decision 6):** Use `createImageBitmap` with downsampling options (`resizeWidth: 1024`, `resizeHeight: 1024`, `resizeQuality: 'medium'`) or draw onto an off-screen canvas constrained to a maximum edge of 1024px.
2. **JPEG Compression & EXIF Stripping:** Re-export the canvas as a JPEG at 0.82 quality (`canvas.toBlob(callback, 'image/jpeg', 0.82)`). This produces crisp ~120KB–200KB images, perfectly sized for Dexie storage and vision model inference. Drawing to canvas completely strips all EXIF/GPS metadata client-side, enforcing privacy guarantees.
3. **Strict Payload Envelopes:** Enforce client-side file size guards before processing. On the server route (`/api/identify`), set a strict body parser limit (e.g., max 2MB) with Zod validation.
4. **Immediate Object URL Cleanup:** Always call `URL.revokeObjectURL(url)` immediately after loading local blobs to release memory back to the JavaScript garbage collector.

**Warning signs:**  
- High-end Android phones (Pixel, Galaxy S-series) crash the web app as soon as a photo is confirmed in the camera app.
- Next.js server logs report `413 FUNCTION_PAYLOAD_TOO_LARGE` or `FUNCTION_INVOCATION_TIMEOUT` on `/api/identify`.
- Memory profiler shows heap spikes above 300MB upon capturing an image.

**Phase to address:**  
Phase 2 (Camera capture, Canvas resizing pipeline, and upload validation).

---

### Pitfall 4: AI Vision Hallucinations & Missing / Ambiguous Wikipedia Taxon Pages

**What goes wrong:**  
The vision model returns a hallucinated species name (e.g., an invented scientific binomial like *Quercus sylvatica var. imaginaria*), misidentifies a common English vernacular name that resolves to a Wikipedia disambiguation page (e.g., "Robin" resolving to a page listing comic characters and towns), or proposes a species whose Wikipedia article does not exist or lacks biological detail. The application then either crashes, displays nonsensical facts about comic books, or shows broken empty cards.

**Why it happens:**  
Open-weight vision models and LLMs predict statistically plausible text tokens rather than consulting a formal biological taxonomy registry. Furthermore, Wikipedia article titles use either scientific binomials (*Erithacus rubecula*), localized vernacular titles (*European robin*), or redirect pages. If code naively assumes every AI-generated name matches a valid, factual Wikipedia taxon summary, queries will fail or fetch irrelevant articles.

**How to avoid:**  
1. **Structured Candidate Schema (PRD FR-I2, FR-I4):** The model is strictly prompted to return both scientific name (binomial or genus) and common name, alongside visible morphological features, month, and coarse region context. The system prompt instructs: "If unsure, give a genus-level name rather than guess a species."
2. **Wikipedia Taxon Verification Gate (PRD FR-I5, Decision 8):** `/api/identify` verifies each candidate using the Wikipedia REST API (`/api/rest_v1/page/summary/{title}`) with `redirects=true`. 
3. **Disambiguation & Taxon Content Check:** Check the Wikipedia response for taxon confirmation (ensuring it is not a disambiguation page and contains biological keywords in the extract or description).
4. **Explicit "Unverified" State:** If no valid biological Wikipedia page resolves, the candidate is flagged as **Unverified** (`verified: false`). The user sees "Unverified" with honest uncertainty, and fact generation is bypassed entirely.
5. **Human Confirmation Loop:** The user explicitly selects the candidate or chooses "None of these." Facts are never generated speculatively before user confirmation.

**Warning signs:**  
- Common names resolving to pop culture or geographical Wikipedia pages.
- `/api/facts` returning 404 Not Found errors on Wikipedia titles.
- Fact cards presenting trivia that has nothing to do with botany or zoology.

**Phase to address:**  
Phase 2 (Vision candidate extraction, Wikipedia taxon verification gate, and fact generation).

---

### Pitfall 5: Edibility, Toxicity, and Medicinal Liability (The Foraging Trap)

**What goes wrong:**  
A nature walker snaps a photo of a wild mushroom or berry cluster. The AI vision model identifies it as an edible species (e.g., field mushroom *Agaricus campestris* or wild carrot *Daucus carota*). In reality, the specimen is a deadly lookalike (e.g., death cap *Amanita phalloides* or poison hemlock *Conium maculatum*). If the app mentions culinary use, edibility, or safe handling, a user might consume it, leading to fatal poisoning, severe organ damage, and catastrophic legal liability for the developer.

**Why it happens:**  
General-purpose LLMs are trained on massive corpuses of foraging books, herbal medicine blogs, and culinary recipes. When asked to summarize a plant or fungus, models instinctively output phrases like "Historically used in herbal teas" or "Valued by foragers for its sweet berries." Moreover, computer vision alone cannot reliably distinguish between deadly toxic fungi and edible lookalikes (spore print and microscopic examination are often required).

**How to avoid:**  
1. **System Prompt Hard Prohibition (PRD B6):** The fact-writing prompt strictly commands: *"Never say or imply that anything is safe to eat, touch or use as medicine. Omit all foraging, medicinal, preparation, or handling details."*
2. **Deterministic Server-Side Banned Term Filter (Decision 9):** Before any fact is returned to the client, a regex scanner strips sentences containing liability keywords (`edible`, `eat`, `culinary`, `cook`, `taste`, `poison*`, `toxic`, `medicinal`, `remedy`, `tea`, `forag*`, `brew`, `chew`, `touch`). If an output sentence touches these domains, it is discarded immediately.
3. **Unconditional Safety Disclaimer (PRD FR-F4):** Every fact card permanently renders a prominent, immutable disclaimer: *"This is a best guess. Don't eat or touch anything based on this app."*
4. **PRD Explicit Non-Goal:** Edibility and foraging advice is formally codified as a non-goal in the consent screen (PRD FR-C1) and privacy statement (`/privacy`).

**Warning signs:**  
- Any generated fact card containing the words "flavor", "tea", "remedy", "edible", or "salad".
- Eval suite card audits flagging unverified safety assertions.

**Phase to address:**  
Phase 1 (Consent & disclaimer copy) & Phase 2 (Fact generation prompt & post-processing validation).

---

### Pitfall 6: Outdoor Voice Recording: Wind Noise, Ambient Clutter & Gesture Strain

**What goes wrong:**  
A walker attempts to record a field note on a windy trail. Low-frequency wind gusts buffet the phone microphone, causing severe audio clipping. The transcription service (ElevenLabs Scribe or Web Speech API) returns empty strings, garbled phonetic gibberish, or hallucinates phantom sentences. Meanwhile, requiring the user to hold down a small button while walking causes hand fatigue or accidental finger slips that abort the recording mid-sentence.

**Why it happens:**  
Microphones on smartphones lack physical wind muffs. Wind velocity over the microphone port creates extreme sub-100Hz pressure fluctuations that blow out the analog-to-digital converter dynamic range. On the UX side, a pure "hold-to-record" interaction fails when walking over rough terrain, where natural hand movements cause accidental `pointerup` / `touchcancel` events.

**How to avoid:**  
1. **Dual Trigger Interaction (Decision 10):** Support BOTH "hold-to-record" (for quick 5-second thoughts) AND "tap-to-start / tap-to-stop" (for relaxed, longer reflections while walking).
2. **Web Audio Noise Filtering Constraints:** When requesting microphone access via `getUserMedia`, configure audio track constraints:
   ```ts
   {
     audio: {
       echoCancellation: true,
       noiseSuppression: true,
       autoGainControl: true
     }
   }
   ```
3. **Live Waveform Feedback (Decision 10, PRD FR-V1):** Render the live audio waveform (using Web Audio `AnalyserNode` or ElevenLabs UI). If the signal is flatlined or pegged at maximum saturation due to wind, the user immediately sees the visual feedback before wasting 60 seconds.
4. **Resilient Local Audio Preservation (PRD FR-V3):** Always store the raw recorded audio Blob in IndexedDB *before* attempting transcription. If the network drops or transcription fails, the recording remains intact with a "Couldn't transcribe, retry" button.
5. **Always-Available Text Fallback:** Never make voice mandatory; provide an inline text note editing area for silent or windy environments.

**Warning signs:**  
- Scribe transcripts coming back as "..." or repetitive punctuation marks when recorded outdoors.
- User test recordings cutting off after 2 seconds due to accidental touch release.
- Audio blobs exceeding upload limits due to uncompressed WAV recording.

**Phase to address:**  
Phase 3 (Voice notes, audio capture pipeline, and transcription retry flow).

---

### Pitfall 7: API Quota Exhaustion & Cost Explosion (Upstream Rate Limits & DOS)

**What goes wrong:**  
During the judging period or public testing, multiple evaluators or bot crawlers trigger `/api/identify`, `/api/facts`, or `/api/transcribe`. Google AI Studio or ElevenLabs quotas are exhausted within minutes. Subsequent API calls fail with HTTP 429 (Too Many Requests), crippling the entire application for judges.

**Why it happens:**  
Public demo endpoints deployed on Vercel without token-bucket rate limits or caching can be hammered by automated scrapers, rapid-fire button clicking, or concurrent judging evaluations. Uncached LLM calls to `/api/facts` redundantly re-query the model for common species (e.g., dandelion or house sparrow) over and over again.

**How to avoid:**  
1. **Dual-Mode Rate Limiting (Decision 15, PRD FR-R1):** Enforce strict per-IP token bucket limits via Upstash Redis (or in-memory rate limiting in local dev). Limits per IP:
   - `/api/identify`: Burst 10, refill 1 per 20s, max 200/day.
   - `/api/facts`: Max 60/day.
   - `/api/transcribe`: Max 20/day.
   - `/api/route`: Max 40/day with global ORS ceiling.
2. **Global Circuit Breaker (Kill Switch):** Configure an environment variable `NEXT_PUBLIC_DISABLE_AI="false"` and an automated daily quota ceiling. When triggered, the app gracefully degrades to "Saved. Identification pauses until tomorrow" rather than crashing with unhandled 500 errors.
3. **Aggressive Fact Caching (Decision 15, PRD FR-F6):** Cache generated fact cards in Redis / local storage keyed by `wikipedia_title + prompt_version`. Common species are generated once and served instantly from cache at 0 token cost and ~30ms latency.
4. **Client-Side Throttling & Pacing:** Client respects `Retry-After` headers and displays a polite "Waiting for its turn" status instead of throwing toast errors.
5. **Local TTS Cache:** Audio generated via `/api/speak` is cached in IndexedDB `SpeechCache` by text hash (PRD FR-V4), preventing repeated billing for replaying species cards.

**Warning signs:**  
- Upstream logs displaying 429 status codes from Google AI Studio or ElevenLabs.
- Upstash or ElevenLabs usage dashboards showing steep linear spikes during development.
- Rapid capture in the UI triggering cascading failed network calls.

**Phase to address:**  
Phase 1 (Rate limiting architecture & Redis client) & Phase 3 (Caching and client queue pacing).

---

### Pitfall 8: Mobile Safari / Android Storage Eviction (IndexedDB Silently Cleared)

**What goes wrong:**  
A user spends days building an extensive nature journal with dozens of captured species and voice notes. The device experiences low storage space (e.g., downloading an OS update or streaming video). Mobile OS triggers automatic temporary cache cleanup, wiping out the origin's IndexedDB database without warning. The user opens Treads and discovers their entire journal is permanently lost.

**Why it happens:**  
Modern mobile browsers manage web storage under "best-effort" eviction policies by default. When device disk capacity falls below 10%, the OS purges IndexedDB, Cache API, and localStorage of web applications that have not been granted persistent storage status.

**How to avoid:**  
1. **Explicit `navigator.storage.persist()` Request (PRD FR-J5, Decision 3):** Request persistent storage immediately upon user consent during initial onboarding.
2. **Storage Quota & Persistence Indicator:** Display persistent storage status and current disk usage in `/settings` (PRD FR-J5, FR-B7).
3. **Low Storage Warnings:** Inspect `navigator.storage.estimate()`. If available storage drops below 50MB, show an inline alert advising the user to export their journal.
4. **One-Tap Offline Export (PRD FR-J3, Decision 14):** Provide a robust, one-tap export mechanism generating an Obsidian-compatible ZIP containing Markdown files, images, and a full `treads-backup.json` database dump.

**Warning signs:**  
- `navigator.storage.persisted()` returns `false`.
- Browser developer tools "Clear site data" simulator reproduces empty journal states.

**Phase to address:**  
Phase 1 (Storage initialization & consent gate) & Phase 4 (Export & settings).

---

## Technical Debt Patterns

Shortcuts that seem reasonable during a 5-day hackathon sprint but create fatal architectural failure modes.

| Shortcut | Immediate Benefit | Long-term Cost | When Acceptable |
|---|---|---|---|
| **Storing raw camera images in IndexedDB** | Saves coding the Canvas resize & compression step | Blows out IndexedDB storage quota within 10 photos; crashes low-RAM devices | **NEVER**. Must resize to 1024px JPEG (Q=0.82) before storing. |
| **Storing walk track points only in React state** | Avoids Dexie write overhead on every GPS update | A single tab discard or camera switch wipes the entire walk distance and track | **NEVER**. Write active breadcrumbs to Dexie incrementally. |
| **Calling Wikipedia search without checking taxon category** | Simpler API call; grabs first search result | Generates fact cards about movies, books, or people sharing species names | **NEVER**. Must verify taxon page and disambiguation flag. |
| **In-memory token bucket rate limiting in serverless** | Zero external service setup (no Upstash Redis needed) | Each Vercel serverless instance has isolated memory; does not prevent distributed DOS | **Acceptable in local development only**; must support Upstash in production. |
| **Using raw percent confidence (e.g., "78% match")** | Easy to pass directly from model output | Misleads users into false certainty; AI vision probabilities are poorly calibrated | **NEVER**. PRD FR-I7 mandates qualitative words (*Likely*, *Possible*, *Unsure*). |
| **Skipping text note fallback for voice recording** | Eliminates secondary text input UI component | Renders notes unusable in windy conditions, quiet areas, or when mic permission is denied | **NEVER**. PRD FR-C5 mandates text notes are always available. |
| **Hardcoding AI Studio model name in application code** | Saves defining environment variables | Cannot switch between Gemma 2 9B, Gemma 4, or Gemini Flash without code re-deployment | **NEVER**. Model IDs must reside in environment variables. |

---

## Integration Gotchas

Common mistakes when connecting to external APIs and web platform features.

| Integration | Common Mistake | Correct Approach |
|---|---|---|
| **Google AI Studio (Gemma / Gemini)** | Expecting OpenAI-compatible JSON mode or reliable structured output from small open weights | Use `@ai-sdk/google` with Zod schema. If the model fails structured output, request JSON in prompt and parse with tolerant Zod validator + single retry. |
| **Wikipedia REST API** | Calling API from the client browser without a customized `User-Agent` header | Wikipedia blocks requests lacking a descriptive User-Agent. Proxy calls through `/api/facts` and `/api/identify` with header `User-Agent: TreadsNatureApp/1.0 (contact: info@treads.app)`. |
| **OpenFreeMap Tiles** | Attempting to sign up for API keys or using proprietary Mapbox raster SDKs | Use MapLibre GL with public vector style URL: `https://tiles.openfreemap.org/styles/liberty`. Zero API key or billing required. |
| **OpenRouteService (ORS)** | Assuming ORS can generate closed round-trip loops anywhere on Earth | In rural or unmapped trails, ORS walking profile may fail with 404 or 400. Catch errors gracefully and fall back to free-form walk mode without blocking the user. |
| **ElevenLabs Scribe** | Sending large uncompressed audio chunks or raw base64 over HTTP | Record in compact WebM/Opus or MP4/AAC format, capping audio clips at 60 seconds (PRD FR-V1) and enforcing a 5MB payload limit. |
| **Web Audio API (Cuelume)** | Creating an `AudioContext` immediately on page load | Mobile browsers block autoplaying Web Audio until an explicit user gesture (tap/click). Instantiate or resume `AudioContext` only inside user event handlers. |
| **Browser Geolocation API** | Assuming permissions persist across subdomains or remain granted in incognito | Always query `navigator.permissions.query({ name: 'geolocation' })` before starting a walk, and provide a clear UI prompt when permission is denied. |

---

## Performance Traps

Patterns that appear to function in local desktop testing but fail on mobile devices outdoors.

| Trap | Symptoms | Prevention | When It Breaks |
|---|---|---|---|
| **Full Map Re-rendering on GPS Fix** | Map stutters, UI thread freezes, high battery drain | Update MapLibre GeoJSON source data directly via `source.setData()` instead of re-mounting map components or recreating layers. | Breaks immediately after ~50 GPS updates on mobile. |
| **Unbounded IndexedDB Image Blobs** | Journal list takes 5+ seconds to open; mobile browser freezes | Store compressed thumbnails (~150px) separately from 1024px captures, or lazily load full-resolution images only on `/entry/[id]`. | Breaks when journal exceeds ~30 entries. |
| **Animation Loops in Background** | Phone overheats in pocket; battery drops rapidly | Pause all Motion or SVG animation loops when `document.visibilityState === 'hidden'`. PRD FR-D3 mandates max 1 looping animation on screen. | Breaks after 15 minutes of walking with phone in pocket. |
| **Uncached Wikipedia Summaries** | Redundant network requests; slow fact card generation (4s+) | Cache Wikipedia summaries and generated fact cards in Redis / local memory keyed by Wikipedia title. Cached retrieval drops to ~30ms. | Breaks during multi-user demos or repeated finds of common species. |
| **Excessive GPS Coordinate Density** | GeoJSON polylines grow to tens of thousands of coordinates | Filter fixes with displacement `< 5m` and accuracy `> 35m`. Compress historical tracks on walk completion. | Breaks on walks longer than 45 minutes (~3,000 raw points). |

---

## Security & Privacy Mistakes

Domain-specific security and data privacy vulnerabilities.

| Mistake | Risk | Prevention |
|---|---|---|
| **Leaking EXIF GPS Data in Uploaded Photos** | Uploading photos with embedded GPS coordinates to external AI providers exposes user's home or precise location | Re-rasterize all captures on client Canvas to completely strip EXIF metadata before network transmission (Decision 6). |
| **Transmitting Fine-Grained Coordinates to AI** | Sending exact 6-decimal latitude/longitude to AI Studio violates privacy promises | Round coordinates to one decimal place (~11km coarse region) before sending to `/api/identify` (PRD FR-I2, B8). |
| **Exposing Server API Keys in Client Bundles** | Leaking `GOOGLE_GENERATIVE_AI_API_KEY` or `ELEVENLABS_API_KEY` leading to quota theft and runaway billing | Route all external API calls through Next.js server route handlers (`/api/*`). Never prefix backend secrets with `NEXT_PUBLIC_`. |
| **Unvalidated Wikipedia Content Injection** | Malicious or vandalized Wikipedia text could attempt prompt injection against the fact-writing LLM | Treat Wikipedia text strictly as raw data. Wrap in isolation tags in the prompt: `<source_data>{text}</source_data>` and instruct model to ignore any instructions inside. |
| **Storing User Media on Centralized Cloud Servers** | Privacy breach of user's personal nature photos and voice recordings | Enforce local-only data architecture: all photos, transcripts, and walk logs reside strictly in device IndexedDB (PRD A5). |

---

## UX Pitfalls

Common user experience mistakes on outdoor nature walks.

| Pitfall | User Impact | Better Approach |
|---|---|---|
| **Modal Dialog Blockers During Walks** | Walkers in motion are forced to stop and tap through dismissible dialogs | Use non-blocking bottom toasts and inline alerts. Capture must work in exactly two taps from app launch (PRD Goal 1). |
| **Presenting Model Guesses as Absolute Truth** | Misidentification breeds confusion or hazardous interactions with plants | Present top 3 candidates with honest qualitative confidence (*Likely*, *Possible*, *Unsure*) and require user confirmation (PRD A5). |
| **Disorienting Map North Rotation** | Map constantly spins and jitters due to inaccurate mobile compass sensors | Lock map bearing to North up by default, allowing optional manual rotation only when explicitly toggled. |
| **Unreadable UI in Direct Sunlight** | Tangerin Dream pastel or low-contrast elements wash out under bright outdoor sun | Maintain strict WCAG AA contrast (≥ 4.5:1) for text against backgrounds. Avoid subtle gray-on-white text for critical data. |
| **Hiding Offline / Error States** | App appears frozen when cellular connectivity drops on remote trails | Show immediate, clear status badges: "Couldn't identify. Saved to journal. Tap to retry when connected" (PRD FR-I8, B7). |
| **Forced Audio Playback** | Sudden loud synthesized audio disturbs wildlife or other park visitors | Synthesized sounds and TTS ("Listen") must be **off by default** (PRD FR-D4, Decision 11). Enable only via manual user tap. |

---

## "Looks Done But Isn't" Checklist

Critical verification items that frequently appear functional in desktop demos but break on real mobile walks.

- [ ] **Camera Flow:** Often works with webcam on desktop — verify that `<input type="file" accept="image/*" capture="environment">` opens the native camera on Android Chrome, resizes down to 1024px JPEG without OOM crashes, and strips EXIF tags.
- [ ] **Tab Discard Recovery:** Often works during brief testing — verify by starting a walk, taking a photo, navigating away to heavy apps (or triggering Chrome tab discard in `chrome://discards`), returning, and verifying the walk resumes seamlessly.
- [ ] **GPS Noise Suppression:** Often works with mock coordinates — verify on real mobile hardware that standing still for 3 minutes does not accumulate phantom distance or spiderweb trails.
- [ ] **Wikipedia Disambiguation Defense:** Often works with obvious binomials — verify that ambiguous names (e.g., "Daisy", "Robin", "Apple") resolve to valid biological taxon pages or safely flag as **Unverified**.
- [ ] **Edibility Sanitization:** Often works with benign plants — verify that queries for toxic species (e.g., *Amanita virosa*, *Conium maculatum*, *Taxus baccata*) unconditionally purge all culinary, herbal, or touching references.
- [ ] **Microphone Permission Refusal:** Often works when granted — verify that clicking "Deny" on microphone permission does not break the UI and leaves text notes fully operational.
- [ ] **Offline / Network Loss Handling:** Often works on fast WiFi — verify that enabling Airplane Mode during capture saves the entry locally with a clear "Couldn't identify — retry" state.
- [ ] **Obsidian Export Archive:** Often creates an unvalidated ZIP — verify the downloaded archive extracts cleanly, media links resolve properly to `media/[id].jpg`, and CC BY-SA Wikipedia attributions are present.

---

## Recovery Strategies

How the application gracefully recovers when pitfalls occur in production.

| Pitfall | Recovery Cost | Recovery Steps |
|---|---|---|
| **Android Chrome Tab Killed During Walk** | LOW | Dexie state is already up to date. On reload, detect `endedAt == null` in Dexie, reconstruct the active walk session, and resume the timer from `Date.now() - walk.startedAt`. |
| **Upstream AI Studio Quota Exhausted (429)** | MEDIUM | Trip the client circuit breaker. Mark pending entries as "Saved. Identification pauses until tomorrow." Allow user to continue capturing and adding notes. Provide manual retry when quota resets. |
| **OpenRouteService Route Calculation Failure** | LOW | Catch the API error in `/api/route`. Display toast: "Route loop unavailable; switching to free walk." Seamlessly continue walk tracking without a route line. |
| **Voice Transcription Service Failure** | LOW | Keep the recorded audio Blob safely in IndexedDB. Display the audio player with "Couldn't transcribe, retry" button and open the inline text editor for manual typing. |
| **Wikipedia Article Resolution Fails** | LOW | Mark candidate as `verified: false` ("Unverified"). Do not call `/api/facts`. Display species name with visible features noted by the vision model and an honest uncertainty badge. |
| **IndexedDB Quota Warning (<50MB free)** | MEDIUM | Display a persistent banner: "Device storage low. Export your journal now." Provide immediate one-click ZIP download to ensure zero data loss. |

---

## Pitfall-to-Phase Mapping

How each roadmap phase prevents or mitigates these pitfalls.

| Pitfall | Prevention Phase | Verification |
|---|---|---|
| **Background Tab Killing & Session Loss** | Phase 1 & Phase 2 | Simulate tab discard via `chrome://discards` and confirm walk state resumes with exact duration and pin count. |
| **GPS Drift & Battery Drain** | Phase 2 | Outdoor stationary test: verify 0m drift accumulated over 5 minutes and verify battery drain < 10%/hr. |
| **Camera Memory Spikes & OOM Crashes** | Phase 2 | Test capture on a 50MP+ Android device; verify memory heap remains < 100MB and re-exported JPEG is ~150KB. |
| **AI Hallucinations & Non-Taxon Wikipedia Pages** | Phase 2 | Run evaluation suite (`/eval`) against 30 species test set; verify ambiguous terms resolve to taxon articles or mark Unverified. |
| **Edibility & Medicinal Liability** | Phase 1 & Phase 2 | Audit 30 fact cards for toxic/edible species; confirm 0 occurrences of banned foraging terms and confirm static disclaimer present. |
| **Outdoor Voice Recording Wind & Gesture Issues** | Phase 3 | Test outdoor recording in gusty conditions; verify both tap-to-record and hold-to-record work; confirm audio Blob preserved if transcription fails. |
| **API Quota Exhaustion & DOS** | Phase 1 & Phase 3 | Run load test script against `/api/identify`; verify token bucket returns 429 with `Retry-After`; verify repeated species served from cache. |
| **Storage Eviction on Mobile** | Phase 1 & Phase 4 | Verify `navigator.storage.persist()` requested on consent; verify export produces valid Obsidian-compatible ZIP archive. |

---

## Sources

- [W3C Geolocation API Specification](https://www.w3.org/TR/geolocation/) — Accuracy models, caching options (`maximumAge`), and battery implications.
- [Google Chrome Page Lifecycle API Documentation](https://developer.chrome.com/docs/web-platform/page-lifecycle-api) — Tab discard, freezing, and memory eviction behaviors.
- [MediaWiki / Wikipedia REST API Specification](https://en.wikipedia.org/api/rest_v1/) — Summary endpoint formatting, redirect handling, and User-Agent requirements.
- [W3C Storage Living Standard](https://storage.spec.whatwg.org/) — Persistent vs. best-effort storage eviction algorithms in modern browsers.
- [Web Audio API W3C Recommendation](https://www.w3.org/TR/webaudio/) — AudioContext user-gesture activation constraints and input node filtering.
- [Vercel Serverless Function Limits](https://vercel.com/docs/functions/limitations) — 4.5MB request payload body ceiling and execution timeouts.
- Project Specifications: [PRD.md](file:///home/zeph/Code/treads/PRD.md) and [DECISIONS.md](file:///home/zeph/Code/treads/DECISIONS.md).

---
*Pitfalls research for: Treads Nature Walk Companion*  
*Researched: 8 October 2026*
