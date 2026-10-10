import * as React from 'react';
import { cn } from '@/lib/utils';

/**
 * Small line-and-fill insects shared by the walking garden and the landing
 * meadow. Wing and flight motion is CSS (see "nature" in globals.css) and
 * stops under prefers-reduced-motion.
 */

const BEE_YELLOW = 'oklch(0.86 0.16 92)';
const BEE_INK = 'oklch(0.27 0.03 80)';

export function Bee({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return (
    <svg
      viewBox="0 0 24 16"
      className={cn('overflow-visible', className)}
      style={style}
      fill="none"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <g className="nature-buzz" stroke="currentColor" strokeWidth="0.7" style={{ fill: 'var(--card)', fillOpacity: 0.8 }}>
        <ellipse cx="11" cy="4.6" rx="3.9" ry="2.5" transform="rotate(-24 11 4.6)" />
        <ellipse cx="15.4" cy="4.2" rx="3.6" ry="2.3" transform="rotate(14 15.4 4.2)" />
      </g>
      <ellipse cx="13.5" cy="10" rx="7" ry="4.3" fill={BEE_YELLOW} stroke={BEE_INK} strokeWidth="0.7" />
      <path d="M11.4 6.2 Q10.3 10 11.7 13.8 M15.4 6 Q14.4 10 15.6 14" stroke={BEE_INK} strokeWidth="1.5" />
      <circle cx="5.9" cy="10.6" r="2.6" fill={BEE_INK} />
      <path d="M20.4 10.2 L23 10.8" stroke={BEE_INK} strokeWidth="0.9" />
    </svg>
  );
}

export function Butterfly({
  className,
  style,
  color,
}: {
  className?: string;
  style?: React.CSSProperties;
  /** Any CSS colour, usually a var(--bloom-n) or var(--heat-n) */
  color: string;
}) {
  const upper = 'M16 13 C 10 1, 1 2, 2.5 10 C 3.4 15, 10 15.5, 16 14 Z';
  const lower = 'M16 14.5 C 10 15, 5 19, 7.6 24 C 10.8 27.4, 15.4 21.5, 16 14.5 Z';
  return (
    <svg
      viewBox="0 0 32 28"
      className={cn('overflow-visible', className)}
      style={style}
      fill="none"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <g className="nature-flutter" stroke="currentColor" strokeWidth="0.7" style={{ fill: color, fillOpacity: 0.85 }}>
        <path d={upper} />
        <path d={lower} />
        <g transform="translate(32 0) scale(-1 1)">
          <path d={upper} />
          <path d={lower} />
        </g>
        <circle cx="7.2" cy="8.2" r="1.7" style={{ fill: 'var(--card)', fillOpacity: 0.7 }} stroke="none" />
        <circle cx="24.8" cy="8.2" r="1.7" style={{ fill: 'var(--card)', fillOpacity: 0.7 }} stroke="none" />
      </g>
      <ellipse cx="16" cy="14.5" rx="1" ry="6.2" fill="currentColor" stroke="none" />
      <path d="M15.6 8.6 Q13.6 4.6 11.4 3.6 M16.4 8.6 Q18.4 4.6 20.6 3.6" stroke="currentColor" strokeWidth="0.6" />
    </svg>
  );
}
