import * as React from 'react';
import type { FlowerPaletteDef, FlowerSpecies, Stage } from '@/components/journal/flower-garden';

/**
 * Three blooms seen from above, each its own flower rather than a recolour:
 *   orange  Field Marigold   layers of many narrow, ruffled ray petals round a dense disc
 *   purple  Wild Bellflower  a five-pointed star of fused lobes, creased down the middle
 *   pink    Prairie Rose     rounded petals wrapped in rings, winding into a spiral heart
 *
 * Drawn in line with a single dim stroke; colour is carried by the petals only.
 */

type Level = 1 | 2 | 3 | 4;
type BloomStage = Exclude<Stage, 0>;

interface Parts {
  stage: BloomStage;
  spin: number;
  seed: number;
  colors: FlowerPaletteDef;
}

const fillOf = (colors: FlowerPaletteDef, n: Level) => ({ fill: colors.stageColors[n] });
const centreOf = (colors: FlowerPaletteDef) => ({ fill: colors.centerColor });

/** `n` copies of a shape spaced evenly round the middle of the 40 × 40 plot */
function around(n: number, spin: number, draw: (angle: number, i: number) => React.ReactNode) {
  return Array.from({ length: n }, (_, i) => draw(spin + (360 / n) * i, i));
}

/** A cozy botanical leaf peeking out from under petals */
export function Leaf({
  angle,
  len = 13,
  w = 3.6,
  curve = 0,
}: {
  angle: number;
  len?: number;
  w?: number;
  curve?: number;
}) {
  const tipY = 20 - len;
  const midY = 20 - len * 0.52;
  const d = `M 20 20 C ${20 - w + curve} ${20 - len * 0.28}, ${20 - w} ${midY}, 20 ${tipY} C ${20 + w} ${midY}, ${20 + w + curve} ${20 - len * 0.28}, 20 20 Z`;
  const rib = `M 20 20 Q ${20 + curve * 0.5} ${midY} 20 ${tipY + 1.2}`;

  return (
    <g transform={`rotate(${angle} 20 20)`}>
      <path
        d={d}
        className="fill-[var(--garden-leaf,#4d7355)]"
        strokeWidth="0.8"
        stroke="currentColor"
        strokeOpacity="0.4"
      />
      <path d={rib} fill="none" strokeWidth="0.5" stroke="currentColor" strokeOpacity="0.3" />
    </g>
  );
}

/** Leaves tucked under the bloom; more and larger as the walk gets longer */
function Foliage({ stage, spin, seed }: Pick<Parts, 'stage' | 'spin' | 'seed'>) {
  if (stage < 3) return null;
  if (stage === 3) {
    return (
      <g className="opacity-95">
        <Leaf angle={(spin + 120 + (seed % 20)) % 360} len={13.5} w={3.6} curve={-1} />
        <Leaf angle={(spin + 225 + ((seed * 7) % 20)) % 360} len={11.2} w={3} curve={0.8} />
      </g>
    );
  }
  return (
    <g className="opacity-95">
      <Leaf angle={(spin + 105 + (seed % 18)) % 360} len={15.5} w={4} curve={-1.2} />
      <Leaf angle={(spin + 195 + ((seed * 5) % 18)) % 360} len={13.2} w={3.4} curve={1} />
      <Leaf angle={(spin + 295 + ((seed * 11) % 18)) % 360} len={11.8} w={3} curve={-0.6} />
    </g>
  );
}

/** Small green sepals that cup a bud */
function Sepals({ n, len, spin }: { n: number; len: number; spin: number }) {
  return (
    <>
      {around(n, spin, (a, i) => (
        <Leaf key={i} angle={a} len={len} w={1.7} curve={0} />
      ))}
    </>
  );
}

/* ───────────────────────── Field Marigold ───────────────────────── */

function Marigold({ stage, spin, colors }: Parts) {
  if (stage === 1) {
    return (
      <>
        <Sepals n={5} len={8.5} spin={spin} />
        <circle cx="20" cy="20" r="4.6" style={fillOf(colors, 1)} />
        <path d="M16.4 18.6 Q20 21.4 23.6 18.6 M16.8 22.4 Q20 24.4 23.2 22.4" fill="none" strokeOpacity="0.7" />
      </>
    );
  }

  // [petal count, distance from centre, half-width, half-length, colour level]
  const layers: Array<[number, number, number, number, Level]> =
    stage === 2
      ? [[8, 6.4, 2.3, 4.6, 2]]
      : stage === 3
        ? [
            [12, 8.2, 2.5, 6.8, 3],
            [8, 5.2, 2, 4.2, 2],
          ]
        : [
            [16, 10.2, 2.4, 8.6, 4],
            [12, 7.2, 2.3, 6, 3],
            [8, 4.4, 1.9, 3.8, 2],
          ];
  const disc = stage === 2 ? 2.8 : stage === 3 ? 3.4 : 4;

  return (
    <>
      {layers.map(([n, reach, rx, ry, level], layer) => (
        <g key={layer} style={fillOf(colors, level)}>
          {around(n, spin + layer * (180 / n), (a, i) => (
            <ellipse key={i} cx="20" cy={20 - reach} rx={rx} ry={ry} transform={`rotate(${a} 20 20)`} />
          ))}
        </g>
      ))}
      <circle cx="20" cy="20" r={disc} style={centreOf(colors)} />
      {stage > 2 && (
        <g fill="none" strokeOpacity="0.55" strokeWidth="0.6">
          <circle cx="20" cy="20" r={disc * 0.55} />
          {around(6, spin, (a, i) => (
            <circle key={i} cx="20" cy={20 - disc * 0.95} r="0.1" strokeWidth="0.9" transform={`rotate(${a} 20 20)`} />
          ))}
        </g>
      )}
    </>
  );
}

/* ───────────────────────── Wild Bellflower ───────────────────────── */

const lobe = (len: number, w: number) =>
  `M20 20 Q${20 - w} ${20 - len * 0.55} 20 ${20 - len} Q${20 + w} ${20 - len * 0.55} 20 20Z`;

function Bellflower({ stage, spin, colors }: Parts) {
  if (stage === 1) {
    return (
      <>
        <Sepals n={5} len={7} spin={spin} />
        {/* A closed bell, seen from above as a pleated cap */}
        <circle cx="20" cy="20" r="4.4" style={fillOf(colors, 1)} />
        <g fill="none" strokeOpacity="0.6">
          {around(5, spin, (a, i) => (
            <path key={i} d="M20 20 L20 16.2" transform={`rotate(${a} 20 20)`} />
          ))}
        </g>
      </>
    );
  }

  const star = (n: number, len: number, w: number, level: Level, rot: number) => (
    <g style={fillOf(colors, level)}>
      {around(5, rot, (a, i) => (
        <path key={i} d={lobe(len, w)} transform={`rotate(${a} 20 20)`} />
      ))}
      {/* the lobes are fused into a bell: one disc joins them */}
      <circle cx="20" cy="20" r={n} />
    </g>
  );

  const creases = (len: number) => (
    <g fill="none" strokeOpacity="0.45" strokeWidth="0.7">
      {around(5, spin, (a, i) => (
        <path key={i} d={`M20 ${20 - len * 0.3} L20 ${20 - len * 0.82}`} transform={`rotate(${a} 20 20)`} />
      ))}
    </g>
  );

  if (stage === 2) {
    return (
      <>
        {star(2.6, 8.4, 3.6, 2, spin)}
        {creases(8.4)}
        <circle cx="20" cy="20" r="1.8" style={centreOf(colors)} />
      </>
    );
  }
  if (stage === 3) {
    return (
      <>
        {star(4, 12, 4.7, 3, spin)}
        {creases(12)}
        <circle cx="20" cy="20" r="2.6" style={centreOf(colors)} />
      </>
    );
  }
  return (
    <>
      {star(5, 14.4, 5.6, 4, spin)}
      {star(3.6, 9.6, 4, 3, spin + 36)}
      {creases(9.6)}
      <circle cx="20" cy="20" r="3" style={centreOf(colors)} />
      <g fill="none" strokeOpacity="0.55" strokeWidth="0.9">
        {around(5, spin + 36, (a, i) => (
          <circle key={i} cx="20" cy="16.2" r="0.1" transform={`rotate(${a} 20 20)`} />
        ))}
      </g>
    </>
  );
}

/* ───────────────────────── Prairie Rose ───────────────────────── */

/** A rose heart: petals winding in on themselves */
const SPIRAL = 'M20.9 19.6 A1 1 0 1 0 19.2 20.7 A2.2 2.2 0 1 0 22.3 18.9 A3.6 3.6 0 1 0 17.2 22.6';

function Rose({ stage, spin, colors }: Parts) {
  if (stage === 1) {
    return (
      <>
        <Sepals n={5} len={8} spin={spin} />
        <circle cx="20" cy="20" r="4.6" style={fillOf(colors, 1)} />
        <path d="M20.8 19.6 A1 1 0 1 0 19.4 20.6 A2.4 2.4 0 1 0 22.3 18.6" fill="none" strokeOpacity="0.7" />
      </>
    );
  }

  // [petal count, distance from centre, petal radius, colour level]
  const rings: Array<[number, number, number, Level]> =
    stage === 2
      ? [
          [5, 4.2, 4.4, 2],
          [4, 1.8, 2.6, 3],
        ]
      : stage === 3
        ? [
            [5, 6.2, 5.6, 2],
            [5, 3.6, 4, 3],
            [3, 1.6, 2.4, 4],
          ]
        : [
            [7, 8, 6, 1],
            [6, 5.4, 4.9, 2],
            [5, 3.2, 3.6, 3],
            [3, 1.5, 2.4, 4],
          ];

  return (
    <>
      {rings.map(([n, reach, r, level], ring) => (
        <g key={ring} style={fillOf(colors, level)}>
          {around(n, spin + ring * (180 / n), (a, i) => (
            <circle key={i} cx="20" cy={20 - reach} r={r} transform={`rotate(${a} 20 20)`} />
          ))}
        </g>
      ))}
      <path d={SPIRAL} fill="none" strokeOpacity="0.6" strokeWidth="0.8" strokeLinecap="round" />
    </>
  );
}

/* ───────────────────────── Bloom ───────────────────────── */

const BLOOM_SCALE: Record<BloomStage, number> = { 1: 1.6, 2: 1.45, 3: 1.2, 4: 1.08 };

/** A bloom that opens with the day: bud, small flower, open flower, full double bloom. */
export function Bloom({
  stage,
  seed,
  palette,
  colors,
}: {
  stage: BloomStage;
  seed: number;
  palette: FlowerSpecies;
  colors: FlowerPaletteDef;
}) {
  const spin = (seed * 17) % 60;
  const parts: Parts = { stage, spin, seed, colors };

  return (
    <svg viewBox="0 0 40 40" className="pointer-events-none h-full w-full overflow-visible" aria-hidden="true">
      <g
        className="origin-center stroke-foreground/35 transition-transform duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] [transform-box:fill-box] motion-safe:group-hover:scale-110 motion-safe:group-hover:rotate-6"
        strokeWidth="1"
        strokeLinejoin="round"
      >
        {/* Small blooms are drawn up so every plot is filled; the plot itself stays the same size */}
        <g transform={`translate(20 20) scale(${BLOOM_SCALE[stage]}) translate(-20 -20)`}>
          <Foliage stage={stage} spin={spin} seed={seed} />
          {palette === 'orange' && <Marigold {...parts} />}
          {palette === 'purple' && <Bellflower {...parts} />}
          {palette === 'pink' && <Rose {...parts} />}
        </g>
      </g>
    </svg>
  );
}
