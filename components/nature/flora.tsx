import * as React from 'react';

export type Kind = 'daisy' | 'cup' | 'cluster';

export function Flower({ kind, hue, h }: { kind: Kind; hue: number; h: number }) {
  const bloom = { fill: `var(--bloom-${hue})` };
  return (
    <svg
      viewBox="0 0 28 80"
      style={{ height: h, width: h * 0.35 }}
      className="overflow-visible"
      fill="none"
      stroke="currentColor"
      strokeWidth="0.9"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M14 80 C14 62 13 46 14 26" className="stroke-primary/70" strokeWidth="1.2" />
      <path d="M14 62 C7 62 3 57 3 52 C9 52 13 56 14 62 Z" className="fill-primary/30 stroke-primary/70" />
      <path d="M14 50 C21 50 25 45 25 40 C19 40 15 44 14 50 Z" className="fill-primary/30 stroke-primary/70" />
      {kind === 'daisy' && (
        <g style={bloom} className="stroke-foreground/35">
          {Array.from({ length: 8 }, (_, i) => (
            <ellipse key={i} cx="14" cy="14" rx="2.7" ry="6.2" transform={`rotate(${i * 45} 14 20)`} />
          ))}
          <circle cx="14" cy="20" r="3.2" style={{ fill: 'var(--bloom-center)' }} />
        </g>
      )}
      {kind === 'cup' && (
        <g style={bloom} className="stroke-foreground/35">
          <path d="M5 14 C5 24 9 28 14 28 C19 28 23 24 23 14 L18.5 19 L14 9 L9.5 19 Z" />
          <path d="M14 9 C12 15 12 22 14 28 C16 22 16 15 14 9 Z" className="opacity-60" />
        </g>
      )}
      {kind === 'cluster' && (
        <g style={bloom} className="stroke-foreground/35">
          <path d="M14 34 C10 30 8 26 7 22 M14 34 C18 30 20 26 21 22" className="stroke-primary/70" fill="none" />
          <circle cx="14" cy="14" r="4.6" />
          <circle cx="7" cy="21" r="4" />
          <circle cx="21" cy="21" r="4" />
          <circle cx="14" cy="14" r="1.4" style={{ fill: 'var(--bloom-center)' }} stroke="none" />
        </g>
      )}
    </svg>
  );
}
