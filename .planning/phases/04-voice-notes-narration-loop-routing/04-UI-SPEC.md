---
phase: 4
slug: voice-notes-narration-loop-routing
status: approved
shadcn_initialized: true
preset: default
created: 2026-10-08
---

# Phase 4 — UI Design Contract

> Visual and interaction contract for Phase 4: Voice Notes, Narration & Loop Routing. Strictly enforces shadcn Base UI primitives, Tangerin Dream design tokens, Web Audio waveform aesthetics, and readymade component library reuse.

---

## Design System

| Property | Value |
|----------|-------|
| Tool | shadcn |
| Preset | default (cssVariables: true) |
| Component library | @base-ui-components/react |
| Icon library | lucide-react |
| Font | Amaranth (sans), Noto Serif (serif), JetBrains Mono (mono) |

**Component Library Mandate:** All UI surfaces must strictly compose existing library primitives (`Button`, `Card`, `Badge`, `Sheet`, `Dialog`, `Popover`, `Progress`, `ScrollArea` from `@/components/ui/*`). Custom roll-your-own primitives are forbidden.

---

## Spacing Scale

Declared values (multiples of 4):

| Token | Value | Usage |
|-------|-------|-------|
| xs | 4px | Icon gaps, badge padding, mini equalizer bar gaps |
| sm | 8px | Button inline padding, distance pill gaps, audio playback scrubber margins |
| md | 16px | Default card internal padding, bottom sheet horizontal padding, review drawer gutters |
| lg | 24px | Section padding, drawer content spacing, modal gutters |
| xl | 32px | Loop route option gap, waveform container vertical padding |
| 2xl | 48px | Drawer top clearance, major layout breaks |
| 3xl | 64px | Full-screen hero container margins |

**Exceptions:**
- Microphone Action FAB: 56px (`w-14 h-14`) touch target with 64px outer circular SVG progress track to guarantee outdoor thumb usability.
- Audio Trail Pins: 32px circular terracotta pin diameter on MapLibre vector canvas.
- Equalizer Bars: 24–32 bars of width 3px with 2px gap (sub-pixel responsive layout within Web Audio visualizer container).

---

## Typography

Declared sizes and weights:

| Role | Size | Weight | Line Height | Font Family |
|------|------|--------|-------------|-------------|
| Body | 16px | 400 (Regular) | 1.5 | Amaranth (`var(--font-sans)`) |
| Label / Micro | 14px | 600 (Semibold) | 1.4 | Amaranth (`var(--font-sans)`) / JetBrains Mono (timer counters) |
| Heading | 20px | 600 (Semibold) | 1.2 | Amaranth (`var(--font-sans)`) |
| Display | 28px | 600 (Semibold) | 1.2 | Amaranth (`var(--font-sans)`) |

---

## Color

60/30/10 Tangerin Dream color distribution:

| Role | Value (Light / Dark) | Usage |
|------|----------------------|-------|
| Dominant (60%) | `oklch(0.9592 0.0288 72.48)` / `oklch(0.2376 0.0036 345.53)` | App background, map viewport surrounds, full-page canvases |
| Secondary (30%) | `oklch(0.9772 0.0175 73.08)` / `oklch(0.2763 0.0048 355.08)` | Bottom sheets (`Sheet`), review drawers, cards (`Card`), audio player pills |
| Accent (10%) | `#F35C2B` / `oklch(0.6559 0.2328 34.52)` | Terracotta mic button, circular progress ring, waveform bars, loop polyline |
| Warning | `#F59E0B` / `oklch(0.795 0.184 86.05)` | Timer warning in final 10 seconds (50s–60s), ORS offline notice badge |
| Destructive | `#DC2626` / `oklch(0.6559 0.2328 34.5244)` | Slide-to-cancel trash icon, "Discard Note" button |

**Accent Reserved For:**
- Microphone trigger FAB and animated recording pulse ring
- Web Audio equalizer bars (gradient from `#F35C2B` to `#FF8C66`)
- Suggested pedestrian loop dashed route line (`#F35C2B` with 0.6 opacity)
- Fact card "Listen" active playback progress fill
- Audio trail marker pins on MapLibre map

---

## Copywriting Contract

| Element | Copy |
|---------|------|
| Mic Idle Tooltip / Label | `"Record voice note"` |
| Mic Recording Label | `"Recording... tap to finish"` |
| Mic Hold Gesture Cue | `"Hold to talk, release to send"` |
| Mic Slide Cancel Cue | `"Slide left to cancel"` |
| 60s Warning Label | `"Recording ends in 10s"` |
| Transcription Loading | `"Transcribing field audio..."` |
| Review Sheet Heading | `"Field Voice Note"` |
| Review Transcript Placeholder | `"Transcribed field notes will appear here..."` |
| Review Language Badge | `"Detected: English"` / `"Detected: [Language]"` |
| Review Primary CTA | `"Save Note"` |
| Review Secondary CTA | `"Discard"` |
| TTS Listen Idle | `"Listen"` |
| TTS Listen Loading | `"Synthesizing speech..."` |
| TTS Device Voice Badge | `"Device voice"` |
| TTS Speed Toggle | `"1.0x"` / `"1.2x"` |
| Loop Mode Picker Tab 1 | `"Free Walk"` |
| Loop Mode Picker Tab 2 | `"Loop Route"` |
| Loop Distance 1km | `"1 km (~15 min)"` |
| Loop Distance 2km | `"2 km (~30 min)"` |
| Loop Distance 3km | `"3 km (~45 min)"` |
| Loop Loading | `"Calculating pedestrian loop..."` |
| Loop Start Primary CTA | `"Start Loop Walk"` |
| Free Walk Primary CTA | `"Start Free Walk"` |
| Off-Route HUD Chip | `"Off suggested loop"` |
| Clear Route Action | `"Clear Route"` |
| ORS Fallback Notice Heading | `"Pedestrian routing unavailable"` |
| ORS Fallback Notice Body | `"OpenRouteService key not configured or offline. Showing a synthetic local loop for preview. You can start a free-form walk anytime."` |
| Mic Permission Blocked Heading | `"Microphone access required"` |
| Mic Permission Blocked Body | `"Please grant microphone permissions in your browser settings to record hands-free voice notes."` |

---

## Component Inventory & Readymade Mapping

All surfaces mapped directly to existing shadcn Base UI primitives:

| Surface | Readymade Component | Props / Styling |
|---------|---------------------|-----------------|
| Mic Trigger FAB | `components/ui/button.tsx` | `size="icon"`, `className="w-14 h-14 rounded-full bg-primary text-primary-foreground shadow-xl relative"` |
| Circular Timer Progress | SVG overlay | 64px circular viewBox with SVG `stroke-dashoffset` animated circle around FAB |
| Voice Recorder Sheet | `components/ui/sheet.tsx` | Bottom drawer `side="bottom"`, `SheetContent`, `SheetHeader`, `SheetTitle` |
| Dynamic Audio Waveform | HTML5 Canvas | Responsive 24–32 bar visualizer inside `Card` container |
| Transcript Review Area | HTML `<textarea>` styled with Tailwind | `rounded-lg border bg-background/50 p-3 text-sm focus:ring-1 focus:ring-primary` |
| Audio Playback Scrubber | `components/ui/progress.tsx` | Progress bar with interactive scrub handle and elapsed timer |
| Fact Card Audio Pill | `components/ui/badge.tsx` & `Button` | Replaces "Listen" button on `components/entry/fact-card.tsx` with interactive player pill |
| Pre-Walk Route Drawer | `components/ui/sheet.tsx` | Bottom drawer `side="bottom"`, containing mode toggle and distance picker |
| Distance Pill Selector | `components/ui/badge.tsx` / `Button` | Segmented group (`1 km`, `2 km`, `3 km`) with active primary highlight |
| Off-Route HUD Pill | `components/ui/badge.tsx` | Glassmorphism chip in `components/walk/walk-hud.tsx` with warning icon and "Clear" action |
| Walk Summary Notes Reel | `components/ui/scroll-area.tsx` | List in `components/walk/walk-summary-sheet.tsx` displaying audio snippets & transcripts |

---

## UI Considerations

Applicable state considerations resolved:

| Category | Element(s) | Status | Resolution / Reason |
|----------|------------|--------|---------------------|
| `recording-gesture` | Mic Button | ✅ covered | Unified gesture: tap starts hands-free recording with persistent stop/trash, continuous press-and-hold records until release |
| `time-limit` | 60s Limit | ✅ covered | Circular progress ring fills over 60s; shifts to warning amber at 50s; auto-stops & transcribes at 60.0s |
| `cancel-action` | Recording HUD | ✅ covered | Slide thumb away during hold cancels; red trash button during hands-free cancels without transcribing |
| `loading` | STT & TTS | ✅ covered | STT renders pulsating waveform skeleton with `"Transcribing field audio..."`; TTS renders spinner on "Listen" pill |
| `playback-controls` | Audio Card | ✅ covered | Inline pill provides Play/Pause, timeline scrubber, elapsed duration (`0:14 / 0:42`), and `1.0x / 1.2x` speed toggle |
| `fallback` | TTS Engine | ✅ covered | Silently falls back to browser `speechSynthesis` with subtle `"Device voice"` badge if ElevenLabs unconfigured |
| `fallback` | Loop Routing | ✅ covered | Displays calm notice with synthetic geometric loop and instant `"Start Free Walk"` action if ORS fails or key missing |
| `off-route` | Map & HUD | ✅ covered | Quiet `"Off suggested loop"` badge with 1-tap `"Clear Route"` button; no jarring fitness alarms |
| `touch-target` | Outdoor Controls | ✅ covered | Minimum 48px touch targets enforced across all controls (56px for main mic FAB) |

---

## Registry Safety

| Registry | Blocks Used | Safety Gate |
|----------|-------------|-------------|
| shadcn official | Button, Card, Sheet, Dialog, Badge, Popover, Progress, ScrollArea | not required (pre-installed official Base UI primitives) |
| third-party | none | not applicable |

---

## Checker Sign-Off

- [x] Dimension 1 Copywriting: PASS
- [x] Dimension 2 Visuals: PASS
- [x] Dimension 3 Color: PASS
- [x] Dimension 4 Typography: PASS
- [x] Dimension 5 Spacing: PASS
- [x] Dimension 6 Registry Safety: PASS

**Approval:** approved 2026-10-08

