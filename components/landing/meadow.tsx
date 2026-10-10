import * as React from 'react';
import { Bee, Butterfly } from '@/components/nature/insects';
import { Flower, type Kind } from '@/components/nature/flora';
import { blades, r1, rng } from '@/components/nature/grass';

/**
 * A strip of meadow across the landing page: grass in three layers that lean
 * a little in the wind, flowers that sway on their stems, bees working the
 * blooms and butterflies drifting across. Decorative only. Everything is
 * drawn from fixed numbers, so the server and the browser agree.
 */

const W = 1200;
const H = 64;

const GRASS = [
  { d: blades(11, 170, 40, H), cls: 'stroke-primary/30', dur: 8, delay: -2 },
  { d: blades(23, 190, 30, H), cls: 'stroke-primary/50', dur: 6.5, delay: -4 },
  { d: blades(37, 150, 20, H), cls: 'stroke-foreground/35', dur: 5.5, delay: -1 },
];

type FlowerSpec = { x: number; h: number; kind: Kind; hue: 1 | 2 | 3 | 4; deg: number; dur: number; delay: number };

// Flowers are spread across the whole width. Towards the middle, where the three
// links of the secondary navigation sit, they grow smaller and shorter, and stop
// just beside the text.
const FLOWERS: FlowerSpec[] = (() => {
  const rand = rng(7);
  const kinds: Kind[] = ['daisy', 'cup', 'cluster'];
  const out: FlowerSpec[] = [];
  const count = 70;
  for (let i = 0; i < count; i++) {
    const x = r1(((i + 0.15 + rand() * 0.7) / count) * 100);
    const away = Math.abs(x - 50) - 7; // percent clear of the links
    if (away < 0) continue;
    const t = Math.min(1, away / 30);
    const taper = t * t * (3 - 2 * t); // smoothstep: 0 beside the links, 1 in the open meadow
    const full = 44 + rand() * 42;
    out.push({
      x,
      h: Math.round(18 + (full - 18) * taper),
      kind: kinds[Math.floor(rand() * 3)],
      hue: (1 + Math.floor(rand() * 4)) as 1 | 2 | 3 | 4,
      deg: r1(2 + rand() * 2),
      dur: r1(4.4 + rand() * 2.4),
      delay: -r1(rand() * 6),
    });
  }
  return out;
})();

const BEES = [
  { x: 8, lift: 74, dur: 9, delay: -2, r: 1.1 },
  { x: 32, lift: 70, dur: 11, delay: -6, r: 1 },
  { x: 76, lift: 58, dur: 8.5, delay: -4, r: 1.2 },
  { x: 92, lift: 84, dur: 10, delay: -1, r: 1 },
];

const BUTTERFLIES = [
  { lift: 150, dur: 62, delay: -14, bob: 4.2, size: 30, color: 'var(--heat-3)' },
  { lift: 120, dur: 78, delay: -52, bob: 5.1, size: 24, color: 'var(--bloom-3)' },
  { lift: 190, dur: 70, delay: -33, bob: 3.7, size: 27, color: 'var(--bloom-1)' },
];

export function Meadow() {
  return (
    <div
      aria-hidden="true"
      className="reveal pointer-events-none absolute inset-x-0 select-none text-foreground"
      style={{ bottom: 0, height: H, ['--i' as string]: 4 }}
    >
      {/* flying things stay behind the flowers' blooms but over the grass */}
      {BUTTERFLIES.map((b, i) => (
        <div
          key={i}
          className="nature-cross absolute left-0"
          style={{ bottom: b.lift, ['--dur' as string]: `${b.dur}s`, ['--delay' as string]: `${b.delay}s` }}
        >
          <div className="nature-bob" style={{ ['--bob' as string]: `${b.bob}s` }}>
            <Butterfly color={b.color} style={{ width: b.size, height: b.size * 0.875 }} />
          </div>
        </div>
      ))}

      <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" className="absolute inset-0 h-full w-full" fill="none" strokeLinecap="round">
        <path d={`M0 ${H - 0.5} H${W}`} className="stroke-foreground/25" vectorEffect="non-scaling-stroke" />
        {GRASS.map((g, i) => (
          <g key={i} className="nature-grass" style={{ ['--dur' as string]: `${g.dur}s`, ['--delay' as string]: `${g.delay}s` }}>
            <path d={g.d} className={g.cls} strokeWidth="1.1" vectorEffect="non-scaling-stroke" />
          </g>
        ))}
      </svg>

      {FLOWERS.map((f, i) => (
        <div
          key={i}
          className={['absolute bottom-0', i % 2 && 'max-sm:hidden', Math.abs(f.x - 50) < 26 && 'max-sm:hidden'].filter(Boolean).join(' ')}
          style={{ left: `${f.x}%` }}
        >
          <div
            className="nature-sway -translate-x-1/2"
            style={{ ['--deg' as string]: `${f.deg}deg`, ['--dur' as string]: `${f.dur}s`, ['--delay' as string]: `${f.delay}s` }}
          >
            <Flower kind={f.kind} hue={f.hue} h={f.h} />
          </div>
        </div>
      ))}

      {BEES.map((b, i) => (
        <div key={i} className={i % 2 ? 'absolute max-sm:hidden' : 'absolute'} style={{ left: `${b.x}%`, bottom: b.lift }}>
          <div
            className="nature-wander"
            style={{ ['--dur' as string]: `${b.dur}s`, ['--delay' as string]: `${b.delay}s`, ['--r' as string]: b.r }}
          >
            <Bee className="-ml-3 h-5 w-[30px]" />
          </div>
        </div>
      ))}
    </div>
  );
}
