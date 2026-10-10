'use client';

import * as React from 'react';
import { Bee, Butterfly } from '@/components/nature/insects';
import { Leaf } from '@/components/landing/ambient-walk';
import { cn } from '@/lib/utils';

/**
 * Life in the margins of the inner pages:
 * A lush botanical vine on each side running from top to bottom of the viewport,
 * with fluttering butterflies, buzzing pollinating bees, and drifting leaves.
 * Positioned in the outer gutters so it frames the content without obscuring it.
 * Entire container is pointer-events-none so it never intercepts user interaction.
 */

const TILE_H = 260;
const TILE_W = 84;

/** One repeating piece of botanical vine. Joins seamlessly top to bottom. */
function VineTile({ index }: { index: number }) {
  const hue = (index % 4) + 1;
  // Natural leaf shape with pointed tip
  const leaf = 'M0 0 C-8 -7 -8 -19 0 -26 C8 -19 8 -7 0 0 Z';
  // [x, y, rotation] along the flowing stem
  const leaves: Array<[number, number, number]> = [
    [48, 32, 52],
    [32, 98, -52],
    [48, 164, 52],
    [32, 230, -52],
  ];

  return (
    <div className="relative shrink-0" style={{ width: TILE_W, height: TILE_H }}>
      <svg
        viewBox={`0 0 ${TILE_W} ${TILE_H}`}
        className="absolute inset-0 h-full w-full overflow-visible"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        {/* Main curved vine stem */}
        <path
          d="M42 0 C66 45 18 90 42 135 C66 180 18 225 42 260"
          className="stroke-primary dark:stroke-primary/90"
          strokeWidth="2.4"
        />

        {/* Delicate curling tendrils */}
        <path
          d="M42 65 C58 61 68 70 60 79 C52 86 44 80 48 74"
          className="stroke-primary/75"
          strokeWidth="1.2"
        />
        <path
          d="M42 195 C26 191 16 200 24 209 C32 216 40 210 36 204"
          className="stroke-primary/75"
          strokeWidth="1.2"
        />

        {/* Leaves swaying gently in the breeze */}
        {leaves.map(([x, y, rot], i) => (
          <g key={i} transform={`translate(${x} ${y}) rotate(${rot})`}>
            <g
              className="nature-sway"
              style={{
                ['--deg' as string]: '6deg',
                ['--dur' as string]: `${3.4 + (i % 3) * 0.8}s`,
                ['--delay' as string]: `${-(index * 1.2 + i * 0.85)}s`,
              }}
            >
              {/* Leaf blade */}
              <path
                d={leaf}
                className="fill-primary/55 stroke-primary dark:fill-primary/45 dark:stroke-primary"
                strokeWidth="1.4"
              />
              {/* Leaf central vein */}
              <path d="M0 0 V-22" className="stroke-primary/80" strokeWidth="1.1" />
            </g>
          </g>
        ))}

        {/* Little botanical blossoms with warm petals */}
        <g
          transform="translate(68 20)"
          className="stroke-foreground/25"
          strokeWidth="0.6"
          style={{ fill: `var(--bloom-${hue})` }}
        >
          {Array.from({ length: 5 }, (_, i) => (
            <ellipse key={i} cx="0" cy="-3.6" rx="2.1" ry="3.6" transform={`rotate(${i * 72})`} />
          ))}
          <circle r="1.8" className="fill-amber-500" stroke="none" />
        </g>
        <g
          transform="translate(10 84)"
          className="stroke-foreground/25"
          strokeWidth="0.6"
          style={{ fill: `var(--bloom-${((index + 1) % 4) + 1})` }}
        >
          {Array.from({ length: 5 }, (_, i) => (
            <ellipse key={i} cx="0" cy="-3" rx="1.8" ry="3" transform={`rotate(${i * 72})`} />
          ))}
          <circle r="1.5" className="fill-amber-500" stroke="none" />
        </g>
      </svg>

      {/* Occasional pollinating bee perched near a blossom */}
      {index % 2 === 1 && (
        <div className="absolute text-foreground/85" style={{ left: 66, top: 16 }}>
          <div
            className="nature-wander"
            style={{
              ['--dur' as string]: `${6 + index * 1.5}s`,
              ['--delay' as string]: `${-index * 1.6}s`,
              ['--r' as string]: 1.2,
            }}
          >
            <Bee className="-ml-3 -mt-4 h-5 w-7" />
          </div>
        </div>
      )}
    </div>
  );
}

function VineColumn({ side, count }: { side: 'left' | 'right'; count: number }) {
  return (
    <div
      className={cn(
        'absolute top-0 flex flex-col',
        side === 'right' && '-scale-x-100'
      )}
      style={{
        [side]: 'var(--vine-offset, 12px)',
        width: TILE_W,
      } as React.CSSProperties}
    >
      {Array.from({ length: count }, (_, i) => (
        <VineTile key={i} index={i + (side === 'right' ? 2 : 0)} />
      ))}
    </div>
  );
}

const DRIFT_LEAVES: Array<{
  side: 'left' | 'right';
  x: number;
  shape: 'blade' | 'oval' | 'fern';
  size: number;
  dur: number;
  delay: number;
  rest: number;
}> = [
  { side: 'left', x: 20, shape: 'blade', size: 32, dur: 30, delay: -6, rest: 20 },
  { side: 'left', x: 55, shape: 'oval', size: 26, dur: 38, delay: -22, rest: 60 },
  { side: 'right', x: 25, shape: 'fern', size: 36, dur: 34, delay: -2, rest: 35 },
  { side: 'right', x: 65, shape: 'blade', size: 28, dur: 42, delay: -18, rest: 75 },
];

/**
 * Top-to-bottom vines with lively butterflies and bees.
 * Frames the page content in the outer margins.
 */
export function PageAmbience({ pageWidth = 1152 }: { pageWidth?: number }) {
  const [tileCount, setTileCount] = React.useState(8);

  React.useEffect(() => {
    const updateCount = () => {
      const h = window.innerHeight || 900;
      setTileCount(Math.max(6, Math.ceil(h / TILE_H) + 2));
    };
    updateCount();
    window.addEventListener('resize', updateCount);
    return () => window.removeEventListener('resize', updateCount);
  }, []);

  // Position vines in the side gutters:
  // On screens wider than pageWidth, center in the margin.
  // On smaller screens, hug the side edges with a small pad.
  const midCalc = `calc((100vw - min(100vw, ${pageWidth}px)) / 4)`;
  const vars = {
    ['--vine-offset' as string]: `max(8px, calc(${midCalc} - ${TILE_W / 2}px))`,
    ['--gutter-mid' as string]: `max(${TILE_W / 2 + 10}px, ${midCalc})`,
  } as React.CSSProperties;

  return (
    <aside
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-0 select-none overflow-hidden text-foreground max-md:hidden"
      style={vars}
    >
      {/* 1. Left & Right Top-to-Bottom Vines */}
      <div className="absolute inset-0">
        <VineColumn side="left" count={tileCount} />
        <VineColumn side="right" count={tileCount} />
      </div>

      {/* 2. Drifting Falling Leaves down both gutters */}
      {DRIFT_LEAVES.map((l, i) => (
        <div
          key={i}
          className="ambient-fall absolute top-0"
          style={
            {
              [l.side]: `calc(var(--gutter-mid) + ${l.x - 45}px)`,
              width: l.size,
              height: l.size,
              '--dur': `${l.dur}s`,
              '--delay': `${l.delay}s`,
              '--rest': `${l.rest}vh`,
              '--drift': `${l.side === 'left' ? 45 : -45}px`,
            } as React.CSSProperties
          }
        >
          <div
            className={i % 2 ? 'ambient-sway text-foreground/45' : 'ambient-sway text-primary/75'}
            style={{ '--sway': `${5 + (i % 3)}s`, '--sdelay': `${-i * 1.3}s` } as React.CSSProperties}
          >
            <Leaf shape={l.shape} />
          </div>
        </div>
      ))}

      {/* 3. Fluttering Butterflies & Buzzing Bees along margins */}
      {(['left', 'right'] as const).map((side, i) => (
        <React.Fragment key={side}>
          {/* Upper butterfly */}
          <div
            className="absolute"
            style={{ [side]: 'var(--gutter-mid)', top: i === 0 ? '24%' : '56%' } as React.CSSProperties}
          >
            <div
              className="nature-wander"
              style={{
                ['--dur' as string]: `${14 + i * 3}s`,
                ['--delay' as string]: `${-i * 5}s`,
                ['--r' as string]: 3.5,
              }}
            >
              <div className="nature-bob" style={{ ['--bob' as string]: `${3.4 + i * 0.4}s` }}>
                <Butterfly
                  color={i === 0 ? 'var(--bloom-2)' : 'var(--bloom-3)'}
                  className="-ml-4 h-7 w-8"
                />
              </div>
            </div>
          </div>

          {/* Lower butterfly or bee */}
          <div
            className="absolute"
            style={{ [side]: 'calc(var(--gutter-mid) + 16px)', top: i === 0 ? '72%' : '18%' } as React.CSSProperties}
          >
            <div
              className="nature-wander"
              style={{
                ['--dur' as string]: `${16 + i * 2}s`,
                ['--delay' as string]: `${-i * 4 - 2}s`,
                ['--r' as string]: 2.8,
              }}
            >
              <div className="nature-bob" style={{ ['--bob' as string]: `${3.8 + i * 0.5}s` }}>
                {i === 0 ? (
                  <Butterfly color="var(--bloom-1)" className="-ml-3 h-6 w-7" />
                ) : (
                  <Bee className="-ml-3 h-5 w-7 text-foreground/85" />
                )}
              </div>
            </div>
          </div>
        </React.Fragment>
      ))}
    </aside>
  );
}
