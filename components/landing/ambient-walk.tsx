import * as React from 'react';

/**
 * A quiet, decorative background for the landing page: leaves drifting down,
 * a few birds crossing high up, and a trail of footprints that walks across
 * the bottom of the screen and fades behind itself. Line art only, in the
 * ink colour. All motion is CSS (see "ambient" in globals.css) and stops
 * under prefers-reduced-motion.
 */

const LEAVES: Array<{ shape: 'blade' | 'oval' | 'fern'; x: number; size: number; dur: number; delay: number; rest: number; tone: 'ink' | 'moss' }> = [
  { shape: 'blade', x: 8, size: 44, dur: 31, delay: -6, rest: 18, tone: 'moss' },
  { shape: 'oval', x: 19, size: 34, dur: 38, delay: -22, rest: 62, tone: 'ink' },
  { shape: 'fern', x: 31, size: 57, dur: 44, delay: -14, rest: 38, tone: 'moss' },
  { shape: 'blade', x: 44, size: 29, dur: 35, delay: -30, rest: 76, tone: 'ink' },
  { shape: 'oval', x: 58, size: 39, dur: 41, delay: -3, rest: 24, tone: 'moss' },
  { shape: 'blade', x: 69, size: 49, dur: 33, delay: -19, rest: 52, tone: 'ink' },
  { shape: 'fern', x: 81, size: 52, dur: 47, delay: -36, rest: 70, tone: 'moss' },
  { shape: 'oval', x: 91, size: 31, dur: 36, delay: -11, rest: 30, tone: 'ink' },
];

const CLOUDS = [
  { top: 2, size: 220, dur: 190, delay: -60 },
  { top: 9, size: 120, dur: 150, delay: -120 },
  { top: 5, size: 160, dur: 230, delay: -200 },
  { top: 15, size: 84, dur: 170, delay: -20 },
];

const BIRDS = [
  { top: 14, size: 60, dur: 58, delay: -8 },
  { top: 22, size: 42, dur: 74, delay: -41 },
  { top: 8, size: 31, dur: 66, delay: -27 },
];

// Footprints cross the screen left to right along a gentle wave, one foot at a time.
const STEPS = Array.from({ length: 18 }, (_, i) => {
  const t = i / 17;
  // rounded, so the server and the browser print the very same numbers
  const r1 = (n: number) => Math.round(n * 10) / 10;
  const left = r1(5 + t * 90);
  const top = r1(84 + Math.sin(t * Math.PI * 2.2) * 3.2 + (i % 2 === 0 ? -0.9 : 0.9));
  const heading = Math.round(90 + Math.cos(t * Math.PI * 2.2) * 12);
  return { left, top, heading, mirror: i % 2 === 1, delay: Math.round(i * 85) / 100 };
});

export function Leaf({ shape }: { shape: 'blade' | 'oval' | 'fern' }) {
  if (shape === 'fern') {
    return (
      <svg viewBox="0 0 40 40" className="h-full w-full" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round">
        <path d="M20 38 C 20 26, 21 14, 20 2" />
        {[8, 14, 20, 26, 32].map((y, i) => {
          const w = 3 + (i < 3 ? i : 5 - i) * 3;
          return (
            <path key={y} d={`M20 ${y + 3} L ${20 - w} ${y - 2} M20 ${y + 3} L ${20 + w} ${y - 2}`} />
          );
        })}
      </svg>
    );
  }
  if (shape === 'oval') {
    return (
      <svg viewBox="0 0 40 40" className="h-full w-full" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20 5 C 33 9, 35 26, 20 34 C 5 26, 7 9, 20 5 Z" />
        <path d="M20 5 L20 38 M20 16 L27 11 M20 16 L13 11 M20 24 L28 19 M20 24 L12 19" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 40 40" className="h-full w-full" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 2 C 31 12, 32 27, 20 36 C 8 27, 9 12, 20 2 Z" />
      <path d="M20 2 L20 39 M20 13 L25 9 M20 13 L15 9 M20 20 L26 15 M20 20 L14 15 M20 27 L25 23 M20 27 L15 23" />
    </svg>
  );
}

export function AmbientWalk() {
  return (
    <div aria-hidden="true" className="ambient pointer-events-none absolute inset-0 overflow-hidden select-none">
      {LEAVES.map((l, i) => (
        <div
          key={i}
          className="ambient-fall absolute top-0"
          style={
            {
              left: `${l.x}%`,
              width: l.size,
              height: l.size,
              '--dur': `${l.dur}s`,
              '--delay': `${l.delay}s`,
              '--rest': `${l.rest}vh`,
              '--drift': `${(i % 2 ? 1 : -1) * 60}px`,
            } as React.CSSProperties
          }
        >
          <div
            className={l.tone === 'moss' ? 'ambient-sway text-primary/60' : 'ambient-sway text-foreground/35'}
            style={{ '--sway': `${5 + (i % 3)}s`, '--sdelay': `${-i * 1.3}s` } as React.CSSProperties}
          >
            <Leaf shape={l.shape} />
          </div>
        </div>
      ))}

      {CLOUDS.map((c, i) => (
        <div
          key={i}
          className="ambient-cloud absolute left-0 text-foreground/25"
          style={{ top: `${c.top}%`, width: c.size, '--dur': `${c.dur}s`, '--delay': `${c.delay}s` } as React.CSSProperties}
        >
          <svg viewBox="0 0 120 48" className="w-full" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 40 H98 C110 40 116 33 114 26 C112 18 104 15 98 17 C97 8 88 3 79 5 C73 -1 60 -1 54 6 C44 3 34 9 34 18 C24 15 14 20 14 28 C8 29 6 40 18 40 Z" />
            <path d="M30 45 H70 M80 45 H92" className="opacity-60" />
          </svg>
        </div>
      ))}

      {BIRDS.map((b, i) => (
        <div
          key={i}
          className="ambient-cross absolute left-0 text-foreground/45"
          style={{ top: `${b.top}%`, width: b.size, '--dur': `${b.dur}s`, '--delay': `${b.delay}s` } as React.CSSProperties}
        >
          <svg viewBox="0 0 28 12" className="ambient-flap w-full" fill="none" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" strokeLinejoin="round" style={{ '--flap': `${0.9 + i * 0.15}s` } as React.CSSProperties}>
            <path d="M1 8 Q7 0 14 8 Q21 0 27 8" />
          </svg>
        </div>
      ))}

      {STEPS.map((s, i) => (
        <div
          key={i}
          className="ambient-step absolute text-primary/60"
          style={
            {
              left: `${s.left}%`,
              top: `${s.top}%`,
              width: 16,
              height: 32,
              '--delay': `${s.delay}s`,
              transform: `rotate(${s.heading}deg) scaleX(${s.mirror ? -1 : 1})`,
            } as React.CSSProperties
          }
        >
          <svg viewBox="0 0 12 24" className="h-full w-full" fill="none" stroke="currentColor" strokeWidth="1" strokeLinejoin="round">
            <path d="M6 1 C 10 1, 11 7, 9.5 11 C 8.8 13, 8 13.5, 6 13.5 C 4 13.5, 2.5 12.5, 2.3 10 C 1.8 6, 2.5 1, 6 1 Z" />
            <ellipse cx="6" cy="19.5" rx="3" ry="3.6" />
          </svg>
        </div>
      ))}

      {/* pebbles resting at the foot of the page */}
      <svg viewBox="0 0 120 40" className="absolute -bottom-1 -left-2 w-40 text-foreground/25 sm:w-56" fill="none" stroke="currentColor" strokeWidth="1">
        <ellipse cx="34" cy="30" rx="26" ry="9" transform="rotate(-4 34 30)" />
        <ellipse cx="78" cy="33" rx="16" ry="6" transform="rotate(3 78 33)" />
        <ellipse cx="62" cy="22" rx="11" ry="4.5" transform="rotate(-10 62 22)" />
      </svg>
      <svg viewBox="0 0 120 40" className="absolute -bottom-1 -right-2 w-36 text-foreground/25 sm:w-52" fill="none" stroke="currentColor" strokeWidth="1">
        <ellipse cx="82" cy="30" rx="24" ry="8.5" transform="rotate(5 82 30)" />
        <ellipse cx="38" cy="34" rx="15" ry="5.5" transform="rotate(-3 38 34)" />
      </svg>
    </div>
  );
}
