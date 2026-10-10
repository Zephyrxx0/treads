'use client';

import * as React from 'react';
import { Bee, Butterfly, Ladybug } from '@/components/nature/insects';
import { blades, r1 } from '@/components/nature/grass';
import { cn } from '@/lib/utils';

/**
 * The signature at the foot of the landing page: "Zephyrxx0" in the heaviest
 * Fraunces, planted in grass. One vine climbs out of the ground, weaves over and
 * under the letters (the segments alternate between a layer behind the text and
 * a layer in front of it) and finishes back in the soil. Blooms open along it,
 * flowers grow from the meadow, and bees, butterflies and ladybugs work the lot.
 *
 * Everything sits in one 1000 x 300 box so the drawing and the lettering scale
 * together. The glyph positions were measured from the rendered font; if the
 * wordmark's font, size or text changes, re-measure (see WORD below).
 *
 * It is the colour-inverse of the app: ink ground with paper-coloured lettering in
 * light mode, paper ground with ink lettering in dark mode (bg-foreground / text-background).
 * On inner pages it paints over the fixed side vines (z-10 above their z-0), which is
 * where those vines end.
 *
 * Motion: draws once when the footer scrolls into view, then idles with CSS
 * only. Under prefers-reduced-motion it simply appears, at rest.
 */

const W = 1000;
const H = 300;
const GROUND = 297;

/** Measured with getExtentOfChar at fontSize 190, weight 900, SOFT 100, opsz 144. */
const WORD = { text: 'Zephyrxx0', x: 500, y: 230, size: 190, length: 928.9 };

type Pt = [number, number];
type Seg = { a: Pt; c1: Pt; c2: Pt; b: Pt; front: boolean };

/** S-curve from a to b with level tangents at both ends, so joins are smooth. */
function wave(a: Pt, b: Pt, front: boolean, k = 0.5): Seg {
  const dx = (b[0] - a[0]) * k;
  return { a, c1: [a[0] + dx, a[1]], c2: [b[0] - dx, b[1]], b, front };
}

/**
 * Crests sit above the lowercase letters and troughs below the baseline, which is
 * open air. Segments can therefore swap between "in front" and "behind" at those
 * points without the vine ever visibly snapping.
 */
const PEAKS_AND_TROUGHS: Pt[] = [
  [93, 62],
  [196, 262],
  [296, 112],
  [400, 264],
  [504, 110],
  [596, 262],
  [690, 112],
  [790, 262],
  [890, 72],
];

const SEGS: Seg[] = [
  { a: [12, GROUND + 4], c1: [4, 190], c2: [34, 62], b: PEAKS_AND_TROUGHS[0], front: true },
  wave(PEAKS_AND_TROUGHS[0], PEAKS_AND_TROUGHS[1], true),
  wave(PEAKS_AND_TROUGHS[1], PEAKS_AND_TROUGHS[2], false),
  wave(PEAKS_AND_TROUGHS[2], PEAKS_AND_TROUGHS[3], true),
  wave(PEAKS_AND_TROUGHS[3], PEAKS_AND_TROUGHS[4], false),
  wave(PEAKS_AND_TROUGHS[4], PEAKS_AND_TROUGHS[5], true),
  wave(PEAKS_AND_TROUGHS[5], PEAKS_AND_TROUGHS[6], false),
  wave(PEAKS_AND_TROUGHS[6], PEAKS_AND_TROUGHS[7], true),
  wave(PEAKS_AND_TROUGHS[7], PEAKS_AND_TROUGHS[8], false),
  { a: PEAKS_AND_TROUGHS[8], c1: [940, 72], c2: [992, 160], b: [988, GROUND + 4], front: true },
];

const SEG_STEP = 0.36;
const SEG_START = 0.15;
const segDelay = (i: number) => SEG_START + i * SEG_STEP;

const pathOf = (s: Seg) => `M${s.a[0]} ${s.a[1]} C${r1(s.c1[0])} ${r1(s.c1[1])} ${r1(s.c2[0])} ${r1(s.c2[1])} ${s.b[0]} ${s.b[1]}`;

/** Point and heading (degrees) on a cubic Bezier at t. */
function onSeg(s: Seg, t: number) {
  const u = 1 - t;
  const x = u * u * u * s.a[0] + 3 * u * u * t * s.c1[0] + 3 * u * t * t * s.c2[0] + t * t * t * s.b[0];
  const y = u * u * u * s.a[1] + 3 * u * u * t * s.c1[1] + 3 * u * t * t * s.c2[1] + t * t * t * s.b[1];
  const dx = 3 * u * u * (s.c1[0] - s.a[0]) + 6 * u * t * (s.c2[0] - s.c1[0]) + 3 * t * t * (s.b[0] - s.c2[0]);
  const dy = 3 * u * u * (s.c1[1] - s.a[1]) + 6 * u * t * (s.c2[1] - s.c1[1]) + 3 * t * t * (s.b[1] - s.c2[1]);
  return { x: r1(x), y: r1(y), deg: r1((Math.atan2(dy, dx) * 180) / Math.PI) };
}

const LEAF = 'M0 0 C-7 -6 -7 -17 0 -24 C7 -17 7 -6 0 0 Z';

type LeafSpec = { seg: number; x: number; y: number; rot: number; scale: number; delay: number; dur: number; sway: number };

const LEAVES: LeafSpec[] = SEGS.flatMap((s, si) => {
  const ts = si === 0 || si === SEGS.length - 1 ? [0.2, 0.4, 0.6, 0.8] : [0.17, 0.38, 0.6, 0.82];
  return ts.map((t, k) => {
    const p = onSeg(s, t);
    const side = (si + k) % 2 === 0 ? 1 : -1;
    return {
      seg: si,
      x: p.x,
      y: p.y,
      rot: r1(p.deg + 90 + side * 52),
      scale: r1(0.8 + ((si * 3 + k * 5) % 5) * 0.09),
      delay: r1(segDelay(si) + 0.18 + k * 0.1),
      dur: r1(3.2 + ((si + k) % 4) * 0.7),
      sway: 5 + ((si * 2 + k) % 3) * 2,
    };
  });
});

/** Small curling tendrils: [x, y, flip, segment index it grows with]. */
const TENDRILS: Array<[number, number, 1 | -1, number]> = [
  [93, 62, 1, 0],
  [296, 112, -1, 2],
  [504, 110, 1, 4],
  [690, 112, -1, 6],
  [890, 72, 1, 8],
  [400, 264, -1, 3],
  [790, 262, 1, 7],
];
const TENDRIL = 'M0 0 C8 -4 18 -2 19 7 C20 15 11 18 7 13 C4 9 8 6 11 8';

// ---------------------------------------------------------------------------
// Blooms
// ---------------------------------------------------------------------------

type BloomKind = 'daisy' | 'poppy' | 'cup' | 'cluster' | 'aster';

/** Fill for each hue; poppies burn warm, the rest use the pastel meadow palette. */
const fillFor = (kind: BloomKind, hue: number) => `var(--${kind === 'poppy' ? 'heat' : 'bloom'}-${hue})`;
const CENTER = (kind: BloomKind) => (kind === 'poppy' ? 'oklch(0.27 0.03 80)' : 'var(--bloom-center)');

/** A bloom face centred on the origin; r is roughly its radius in box units. */
function Bloom({ kind, hue, r }: { kind: BloomKind; hue: number; r: number }) {
  const k = r / 12;
  const fill = { fill: fillFor(kind, hue) };
  const ink = 'stroke-background/45';
  return (
    <g transform={`scale(${r1(k)})`} style={fill} className={ink} strokeWidth={0.8 / k}>
      {kind === 'daisy' &&
        Array.from({ length: 10 }, (_, i) => <ellipse key={i} cx="0" cy="-7" rx="3.1" ry="7.4" transform={`rotate(${i * 36})`} />)}
      {kind === 'aster' &&
        Array.from({ length: 5 }, (_, i) => <ellipse key={i} cx="0" cy="-6" rx="4.6" ry="6.6" transform={`rotate(${i * 72})`} />)}
      {kind === 'poppy' &&
        Array.from({ length: 5 }, (_, i) => <ellipse key={i} cx="0" cy="-6.4" rx="6.4" ry="7.2" transform={`rotate(${i * 72 + 20})`} />)}
      {kind === 'cluster' && (
        <>
          <circle cx="0" cy="-5" r="6" />
          <circle cx="-7" cy="3" r="5.4" />
          <circle cx="7" cy="3" r="5.4" />
        </>
      )}
      {kind === 'cup' && (
        <>
          <path d="M-9 -8 C-9 4 -5 10 0 10 C5 10 9 4 9 -8 L4.5 -3 L0 -12 L-4.5 -3 Z" />
          <path d="M0 -12 C-3 -4 -3 4 0 10 C3 4 3 -4 0 -12 Z" className="opacity-60" />
        </>
      )}
      {kind !== 'cup' && kind !== 'cluster' && <circle cx="0" cy="0" r={kind === 'poppy' ? 3.4 : 3.8} style={{ fill: CENTER(kind) }} />}
      {kind === 'cluster' && <circle cx="0" cy="-1" r="2" style={{ fill: CENTER(kind) }} stroke="none" />}
    </g>
  );
}

type Blossom = { x: number; y: number; kind: BloomKind; hue: number; r: number; delay: number };

/** Bloom on every crest and trough of the vine, bigger up top, smaller where the grass hides them. */
const BLOSSOMS: Blossom[] = PEAKS_AND_TROUGHS.map(([x, y], i) => {
  const kinds: BloomKind[] = ['poppy', 'aster', 'daisy', 'cluster', 'poppy', 'aster', 'daisy', 'cluster', 'poppy'];
  const up = y < 150;
  return { x, y, kind: kinds[i], hue: (i % 4) + 1, r: up ? 19 : 13, delay: r1(segDelay(i) + 0.3) };
});

type Stalk = { x: number; h: number; kind: BloomKind; hue: number; lean: number; deg: number; dur: number; delay: number };

const STALK_SPECS: Array<[number, number, BloomKind, number]> = [
  [62, 74, 'daisy', 1],
  [128, 46, 'cluster', 3],
  [172, 96, 'poppy', 2],
  [226, 58, 'cup', 4],
  [318, 86, 'cluster', 2],
  [372, 50, 'daisy', 3],
  [436, 98, 'poppy', 1],
  [486, 62, 'cup', 2],
  [580, 90, 'daisy', 4],
  [632, 52, 'cluster', 1],
  [702, 96, 'cup', 3],
  [760, 58, 'poppy', 4],
  [818, 88, 'daisy', 2],
  [868, 54, 'cluster', 3],
  [934, 92, 'poppy', 1],
  [966, 60, 'cup', 2],
];

const STALKS: Stalk[] = STALK_SPECS.map(([x, h, kind, hue], i) => ({
  x,
  h,
  kind,
  hue,
  lean: ((i * 7) % 5) - 2,
  deg: r1(2 + (i % 3) * 0.7),
  dur: r1(4.2 + (i % 5) * 0.55),
  delay: r1(1.4 + i * 0.1),
}));

const GRASS = [
  { d: blades(11, 190, 38, 0, false), opacity: 0.5, dur: 8, delay: -2 },
  { d: blades(23, 230, 30, 0, false), opacity: 0.85, dur: 6.5, delay: -4 },
];

// ---------------------------------------------------------------------------
// Insects. HTML, positioned in the same 1000 x 300 space as percentages, and
// sized in container units so they scale with the lettering.
// ---------------------------------------------------------------------------

const px = (x: number) => `${r1(x / 10)}%`;
const py = (y: number) => `${r1((y / H) * 100)}%`;
const size = (cqw: number, min: number) => `max(${min}px, ${cqw}cqw)`;

const BEES = [
  { x: 93, y: 62, dur: 9, delay: -2, r: 1.2 },
  { x: 504, y: 110, dur: 11, delay: -6, r: 1.3 },
  { x: 890, y: 72, dur: 10, delay: -4, r: 1.2 },
  { x: 436, y: 200, dur: 8.5, delay: -1, r: 1 },
];

const FLITTERS = [
  { x: 296, y: 100, color: 'var(--bloom-3)', dur: 15, delay: -3, bob: 3.6, w: 3.4 },
  { x: 690, y: 98, color: 'var(--heat-3)', dur: 17, delay: -8, bob: 4.1, w: 3.6 },
  { x: 150, y: 150, color: 'var(--bloom-1)', dur: 19, delay: -12, bob: 3.9, w: 2.8 },
];

/** Ladybugs walk along the tops of letters: x and y are the top of the spot they stand on. */
const LADYBUGS = [
  { x: 52, y: 95, dist: 6.2, dur: 17, delay: -3 }, // across the top bar of the Z
  { x: 648, y: 142, dist: 4.8, dur: 14, delay: -7 }, // along the first x
  { x: 562, y: 142, dist: 2.2, dur: 11, delay: -1 }, // on the r
];

export function SignatureFooter({ className }: { className?: string }) {
  const ref = React.useRef<HTMLElement>(null);
  const [seen, setSeen] = React.useState(false);

  React.useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setSeen(true);
          io.disconnect();
        }
      },
      { threshold: 0.3 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const back = SEGS.map((s, i) => ({ s, i })).filter(({ s }) => !s.front);
  const front = SEGS.map((s, i) => ({ s, i })).filter(({ s }) => s.front);

  const leafGroup = (ls: LeafSpec[]) =>
    ls.map((l, i) => (
      <g key={i} transform={`translate(${l.x} ${l.y}) rotate(${l.rot}) scale(${l.scale})`}>
        <g className="sig-pop" style={{ ['--delay' as string]: `${l.delay}s` }}>
          <g
            className="nature-sway"
            style={{ ['--deg' as string]: `${l.sway}deg`, ['--dur' as string]: `${l.dur}s`, ['--delay' as string]: `${-i * 0.7}s` }}
          >
            <path d={LEAF} fill="var(--vine-leaf)" stroke="var(--vine-leaf-edge)" strokeWidth="1.3" />
            <path d="M0 -1 V-20" stroke="var(--vine-leaf-edge)" strokeWidth="1" opacity="0.7" />
          </g>
        </g>
      </g>
    ));

  return (
    <footer ref={ref} className={cn('relative z-10 w-full select-none overflow-hidden bg-foreground pt-8 text-background sm:pt-14', className)}>
      <div
        data-in={seen ? '' : undefined}
        className="sig relative mx-auto w-full max-w-[1500px] [container-type:inline-size]"
        style={{ aspectRatio: `${W} / ${H}` }}
      >
        <svg
          viewBox={`0 0 ${W} ${H}`}
          className="absolute inset-0 h-full w-full overflow-visible"
          role="img"
          aria-label="Zephyrxx0"
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          {/* 1. vine behind the letters */}
          <g>
            {back.map(({ s, i }) => (
              <path
                key={i}
                d={pathOf(s)}
                pathLength={1}
                className="sig-draw"
                stroke="var(--vine)"
                strokeWidth="4.4"
                style={{ ['--delay' as string]: `${segDelay(i)}s` }}
              />
            ))}
            {leafGroup(LEAVES.filter((l) => !SEGS[l.seg].front))}
          </g>

          {/* 2. the wordmark */}
          <text
            x={WORD.x}
            y={WORD.y}
            textAnchor="middle"
            fontSize={WORD.size}
            textLength={WORD.length}
            lengthAdjust="spacingAndGlyphs"
            className="fill-background font-serif font-black"
            style={{ fontVariationSettings: '"SOFT" 100, "opsz" 144', fontVariantNumeric: 'lining-nums' }}
          >
            {WORD.text}
          </text>

          {/* 3. vine in front of the letters, with a thin halo of page colour so it reads on the ink */}
          <g>
            {front.map(({ s, i }) => (
              <g key={i} style={{ ['--delay' as string]: `${segDelay(i)}s` }}>
                <path d={pathOf(s)} pathLength={1} className="sig-draw" stroke="var(--foreground)" strokeWidth="10" />
                <path d={pathOf(s)} pathLength={1} className="sig-draw" stroke="var(--vine)" strokeWidth="4.4" />
              </g>
            ))}
            {leafGroup(LEAVES.filter((l) => SEGS[l.seg].front))}
          </g>

          {/* tendrils */}
          {TENDRILS.map(([x, y, flip, si], i) => (
            <g key={i} transform={`translate(${x} ${y}) scale(${flip} 1)`}>
              <path
                d={TENDRIL}
                pathLength={1}
                className="sig-draw"
                stroke="var(--vine)"
                strokeWidth="2.4"
                style={{ ['--delay' as string]: `${segDelay(si) + 0.35}s`, ['--len' as string]: '0.7s' }}
              />
            </g>
          ))}

          {/* 4. blooms on the vine */}
          {BLOSSOMS.map((b, i) => (
            <g key={i} transform={`translate(${b.x} ${b.y})`}>
              <g className="sig-pop-c" style={{ ['--delay' as string]: `${b.delay}s` }}>
                <g className="nature-sway" style={{ ['--deg' as string]: '5deg', ['--dur' as string]: `${4 + (i % 4) * 0.6}s`, ['--delay' as string]: `${-i}s` }}>
                  <Bloom kind={b.kind} hue={b.hue} r={b.r} />
                </g>
              </g>
            </g>
          ))}

          {/* 5. the meadow it all grows from */}
          <g transform={`translate(0 ${GROUND}) scale(${r1(W / 1200)})`}>
            {GRASS.map((g, i) => (
              <g key={i} className="nature-grass" style={{ ['--dur' as string]: `${g.dur}s`, ['--delay' as string]: `${g.delay}s` }}>
                <path d={g.d} stroke="var(--vine)" strokeOpacity={g.opacity} strokeWidth="1.7" />
              </g>
            ))}
          </g>

          {STALKS.map((f, i) => {
            const topY = GROUND - f.h;
            const tx = f.x + f.lean * 2;
            return (
              <g key={i} transform={`translate(${f.x} ${GROUND})`} className={i % 2 ? 'max-sm:hidden' : undefined}>
                <g className="sig-pop" style={{ ['--delay' as string]: `${f.delay}s` }}>
                  <g className="nature-sway" style={{ ['--deg' as string]: `${f.deg}deg`, ['--dur' as string]: `${f.dur}s`, ['--delay' as string]: `${-i * 0.9}s` }}>
                    <path
                      d={`M0 0 C${f.lean * 2} ${-f.h * 0.35} ${f.lean * 3} ${-f.h * 0.7} ${tx - f.x} ${-f.h + 8}`}
                      stroke="var(--vine)"
                      strokeWidth="2.6"
                    />
                    <path d={`M${f.lean} ${-f.h * 0.3} c-10 -2 -16 -8 -16 -14 c8 0 14 5 16 14 Z`} fill="var(--vine-leaf)" stroke="var(--vine-leaf-edge)" strokeWidth="1" />
                    <path d={`M${f.lean * 2} ${-f.h * 0.5} c10 -2 16 -8 16 -14 c-8 0 -14 5 -16 14 Z`} fill="var(--vine-leaf)" stroke="var(--vine-leaf-edge)" strokeWidth="1" />
                    <g transform={`translate(${tx - f.x} ${topY - GROUND})`}>
                      <Bloom kind={f.kind} hue={f.hue} r={11 + (i % 3) * 2} />
                    </g>
                  </g>
                </g>
              </g>
            );
          })}

          <path d={`M0 ${GROUND + 0.5} H${W}`} className="stroke-background/30" strokeWidth="1" />
        </svg>

        {/* life: decorative, never in the way */}
        <div aria-hidden="true" className="sig-fade pointer-events-none absolute inset-0" style={{ ['--delay' as string]: '1.8s' }}>
          {FLITTERS.map((b, i) => (
            <div key={i} className={i === 2 ? 'absolute max-sm:hidden' : 'absolute'} style={{ left: px(b.x), top: py(b.y) }}>
              <div className="nature-wander" style={{ ['--dur' as string]: `${b.dur}s`, ['--delay' as string]: `${b.delay}s`, ['--r' as string]: 2.4 }}>
                <div className="nature-bob" style={{ ['--bob' as string]: `${b.bob}s` }}>
                  <Butterfly color={b.color} className="-translate-x-1/2 -translate-y-1/2" style={{ width: size(b.w, 22), height: size(b.w * 0.875, 19) }} />
                </div>
              </div>
            </div>
          ))}

          <div className="nature-cross absolute left-0" style={{ top: py(40), ['--dur' as string]: '58s', ['--delay' as string]: '-20s' }}>
            <div className="nature-bob" style={{ ['--bob' as string]: '4.4s' }}>
              <Butterfly color="var(--heat-4)" style={{ width: size(3, 20), height: size(2.6, 17) }} />
            </div>
          </div>

          {BEES.map((b, i) => (
            <div key={i} className={i % 2 ? 'absolute max-sm:hidden' : 'absolute'} style={{ left: px(b.x), top: py(b.y) }}>
              <div className="nature-wander" style={{ ['--dur' as string]: `${b.dur}s`, ['--delay' as string]: `${b.delay}s`, ['--r' as string]: b.r }}>
                <Bee className="-translate-x-1/2 -translate-y-1/2" style={{ width: size(3.2, 24), height: size(2.1, 16) }} />
              </div>
            </div>
          ))}

          {LADYBUGS.map((l, i) => (
            <div key={i} className="absolute" style={{ left: px(l.x), bottom: py(H - l.y) }}>
              <div className="sig-crawl" style={{ ['--dist' as string]: `${l.dist}cqw`, ['--dur' as string]: `${l.dur}s`, ['--delay' as string]: `${l.delay}s` }}>
                <div className="sig-wobble" style={{ transformOrigin: '50% 100%' }}>
                  <Ladybug style={{ width: size(2.6, 20), height: size(1.82, 14), display: 'block' }} />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </footer>
  );
}
