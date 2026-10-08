---
phase: 3
slug: photo-capture-ai-identification-pipeline
status: approved
shadcn_initialized: true
preset: default
created: 2026-10-08
---

# Phase 3 — UI Design Contract

> Visual and interaction contract for Phase 3: Photo Capture & AI Identification Pipeline. Strictly enforces shadcn Base UI primitives, Tangerin Dream design tokens, and readymade component library reuse.

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
| xs | 4px | Icon gaps, badge padding, citation superscript offsets |
| sm | 8px | Button inline padding, chip gaps, card headers |
| md | 16px | Default card internal padding, bottom sheet horizontal padding |
| lg | 24px | Section padding, drawer content spacing, modal gutters |
| xl | 32px | Candidate card stack spacing, hero section gap |
| 2xl | 48px | Drawer top clearance, major layout breaks |
| 3xl | 64px | Full-screen hero container margins |

**Exceptions:** 
- Shutter Camera FAB: 56px (`w-14 h-14`) touch target to guarantee outdoor thumb usability.
- Map Specimen Pins: 36px circular badge diameter on MapLibre vector canvas.

---

## Typography

Declared sizes and weights:

| Role | Size | Weight | Line Height | Font Family |
|------|------|--------|-------------|-------------|
| Body | 16px | 400 (Regular) | 1.5 | Amaranth (`var(--font-sans)`) |
| Label / Micro | 14px | 600 (Semibold) | 1.4 | Amaranth (`var(--font-sans)`) / Noto Serif (italic for scientific binomials) |
| Heading | 20px | 600 (Semibold) | 1.2 | Amaranth (`var(--font-sans)`) |
| Display | 28px | 600 (Semibold) | 1.2 | Amaranth (`var(--font-sans)`) |

---

## Color

60/30/10 Tangerin Dream color distribution:

| Role | Value (Light / Dark) | Usage |
|------|----------------------|-------|
| Dominant (60%) | `oklch(0.9592 0.0288 72.48)` / `oklch(0.2376 0.0036 345.53)` | App background, map viewport surrounds, full-page canvases |
| Secondary (30%) | `oklch(0.9772 0.0175 73.08)` / `oklch(0.2763 0.0048 355.08)` | Bottom sheets (`Sheet`), cards (`Card`), dialogs (`Dialog`), fact cards |
| Accent (10%) | `#F35C2B` / `oklch(0.6559 0.2328 34.52)` | Terracotta primary CTAs, camera FAB icon, citation pills, verified species markers |
| Destructive | `#DC2626` / `oklch(0.6559 0.2328 34.5244)` | Hold-to-end walk button, walk discard confirmations |

**Accent Reserved For:**
- Camera trigger icon and shutter focus ring
- Primary action button: `"Identify Organism"`
- Superscript citation pills (`[1]`, `[2]`) in fact cards
- Verified biological taxon badge checkmark
- Map trail polyline and selected specimen pin ring

---

## Copywriting Contract

| Element | Copy |
|---------|------|
| Primary CTA (Preview) | `"Identify Organism"` |
| Secondary CTA (Preview) | `"Retake Photo"` |
| Empty State Heading | `"No organisms captured yet"` |
| Empty State Body | `"Tap the camera shutter below to photograph and identify your first living organism."` |
| Identification Loading | `"Analyzing specimen with Gemini Flash..."` |
| Educational Refusal Heading | `"Organism not recognized"` |
| Educational Refusal Body | `"We noticed an inanimate object or human. Treads is designed to track living organisms in nature. Try a closer shot of leaves, bark, or wildlife."` |
| Refusal Action Primary | `"Retake Photo"` |
| Refusal Action Secondary | `"Save as Unidentified Note"` |
| Low Confidence Notice | `"Lighting or angle makes this tricky. None of these match?"` |
| Error State | `"Identification request timed out. Saved locally to device — tap to retry when back online."` |
| Destructive Confirmation | `"Discard Walk: Are you sure? Unsaved tracks and unverified captures from this walk will be lost."` |

---

## Component Inventory & Readymade Mapping

All surfaces mapped directly to existing shadcn Base UI primitives:

| Surface | Readymade Component | Props / Styling |
|---------|---------------------|-----------------|
| Camera Shutter FAB | `components/ui/button.tsx` | `size="icon"`, `className="w-14 h-14 rounded-full bg-muted/80 border-border shadow-xl"` |
| Camera Preview Sheet | `components/ui/sheet.tsx` | Bottom drawer `side="bottom"`, `SheetContent`, `SheetHeader`, `SheetTitle` |
| Candidate Picker Drawer | `components/ui/sheet.tsx` | Bottom drawer `side="bottom"`, scrolling `SheetContent` |
| Candidate Card | `components/ui/card.tsx` | `Card`, `CardHeader`, `CardTitle`, `CardDescription`, hover highlight, active press |
| Taxon & Confidence Chips | `components/ui/badge.tsx` | `variant="outline"` / `variant="secondary"`, color tokens |
| Fact Card Container | `components/ui/card.tsx` | `Card`, `CardHeader`, `CardContent`, Tangerin Dream warm background |
| Citation Popover | `components/ui/popover.tsx` or `Sheet` | Interactive tooltip/popover displaying verbatim Wikipedia source sentence |
| Educational Refusal Modal | `components/ui/dialog.tsx` | `Dialog`, `DialogContent`, `DialogHeader`, `DialogFooter` |
| Walk HUD Specimen Chip | `components/ui/badge.tsx` | Glassmorphism chip with terracotta icon and count |
| Summary Species Reel | `components/ui/scroll-area.tsx` | Horizontal scroll area with thumbnail cards |

---

## UI Considerations

Applicable state considerations resolved:

| Category | Element(s) | Status | Resolution / Reason |
|----------|------------|--------|---------------------|
| `loading` | Candidate Drawer | ✅ covered | Renders animated Tangerin Dream pulse and scan line with `"Analyzing specimen with Gemini Flash..."` |
| `empty` | Specimen Reel | ✅ covered | When 0 captures on walk, summary displays `"0 Organisms Logged"` with subtle prompt to photograph wildlife |
| `error` | API Identify | ✅ covered | Network failure saves draft to Dexie with amber dashed map pin and displays toast with 1-tap retry |
| `refusal` | Non-organism / Human | ✅ covered | Renders educational refusal dialog with `"Retake Photo"` and `"Save as Unidentified Note"` actions |
| `low-confidence` | Candidate Stack | ✅ covered | Amber `"Unsure"` chips with explicit fallback action: `"None of these match / Save as Unidentified"` |
| `citations` | Fact Card | ✅ covered | Clicking superscript citation pill toggles inline popover revealing verbatim Wikipedia sentence |
| `long-text` | Taxon Names | 🧪 backstop | Clamped to 2 lines max with ellipsis on cards; full title visible on `/entry/[id]` |
| `touch-target` | Shutter & Buttons | ✅ covered | Minimum 48px touch targets enforced across all outdoor controls (56px for camera FAB) |

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

