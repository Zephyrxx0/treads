'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import { HairlineFigure } from '@/components/hairline/hairline-figure';

export interface ThemeToggleProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /**
   * `button` is the small bordered control used in nav/settings.
   * `bare` is the large container-less Hairline sun/moon for the landing hero —
   * lines only, so it reads as part of the sky behind the page.
   */
  variant?: 'button' | 'bare';
  /** `button` variant only: draw a solid celestial body (default) or a thin outline. */
  filled?: boolean;
}

function readIsDark() {
  if (typeof document === 'undefined') return false;
  return document.documentElement.classList.contains('dark');
}

export function ThemeToggle({
  className,
  variant = 'button',
  filled = true,
  ...props
}: ThemeToggleProps) {
  // Tracks the DOM so the figure morphs even when another toggle flips the theme.
  const [isDark, setIsDark] = React.useState<boolean>(false);
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
    setIsDark(readIsDark());

    const onThemeChange = () => setIsDark(readIsDark());
    window.addEventListener('themechange', onThemeChange);

    // Catch class changes made directly on <html> (e.g. the other toggle).
    const observer = new MutationObserver(onThemeChange);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });

    return () => {
      window.removeEventListener('themechange', onThemeChange);
      observer.disconnect();
    };
  }, []);

  const handleToggle = () => {
    const nextDark = !readIsDark();
    document.documentElement.classList.toggle('dark', nextDark);
    try {
      localStorage.setItem('treads_theme', nextDark ? 'dark' : 'light');
    } catch {}
    setIsDark(nextDark);
    window.dispatchEvent(
      new CustomEvent('themechange', { detail: { theme: nextDark ? 'dark' : 'light' } }),
    );
  };

  // Before hydration we don't know the theme; render the sun so SSR and the
  // first client paint agree, and let the effect correct it.
  const showMoon = mounted && isDark;

  // The bare variant's drawing ignores the pointer; the hit circle hands its events to the figure's stage.
  const forwardPointer = (e: React.PointerEvent<HTMLElement>) => {
    const stage = e.currentTarget.closest('button')?.querySelector('[data-hairline]');
    stage?.dispatchEvent(
      new PointerEvent(e.type, {
        pointerType: e.pointerType,
        pointerId: e.pointerId,
        clientX: e.clientX,
        clientY: e.clientY,
      }),
    );
  };

  return (
    <button
      type="button"
      onClick={handleToggle}
      aria-label="Toggle color theme"
      aria-pressed={showMoon}
      title={showMoon ? 'Switch to light' : 'Switch to dark'}
      suppressHydrationWarning
      data-state={showMoon ? 'dark' : 'light'}
      className={cn(
        'group cursor-pointer touch-manipulation select-none focus-visible:outline-none',
        variant === 'button'
          ? 'inline-flex h-9 w-9 items-center justify-center rounded-[var(--radius)] border border-border bg-card text-foreground shadow-xs transition-colors hover:bg-muted/60 focus-visible:ring-2 focus-visible:ring-ring'
          : 'pointer-events-none inline-flex items-center justify-center rounded-full text-primary focus-visible:ring-2 focus-visible:ring-ring/60 focus-visible:ring-offset-4 focus-visible:ring-offset-background',
        className,
      )}
      {...props}
    >
      {variant === 'bare' ? (
        <>
          <HairlineFigure
            name="celestial"
            value={showMoon ? 1 : 0}
            label={showMoon ? 'A crescent moon drawn in lines' : 'A sun drawn in lines'}
            readout={false}
            className="hl-sky pointer-events-none absolute left-1/2 top-1/2 w-[var(--sun)] -translate-x-1/2 -translate-y-1/2 [&_svg]:overflow-visible"
          />
          {/*
            The only part of the toggle that takes the pointer: a circle round the sun at rest
            (106 of the figure's 400 viewBox units from the disc's centre at 200,168 — the
            tips of the longest rays). The drawing itself is click-through and gets the
            pointer from here, so the empty sky around it is not part of the control.
          */}
          <span
            aria-hidden="true"
            onPointerMove={forwardPointer}
            onPointerDown={forwardPointer}
            onPointerLeave={forwardPointer}
            className="pointer-events-auto absolute rounded-full touch-manipulation"
            style={{
              width: 'calc(var(--sun) * 0.53)',
              height: 'calc(var(--sun) * 0.53)',
              left: '50%',
              top: 'calc(50% + var(--sun) * 0.021)',
              transform: 'translate(-50%, -50%)',
            }}
          />
        </>
      ) : (
        <CelestialMark showMoon={showMoon} filled={filled} className="h-[55%] w-[55%]" />
      )}
    </button>
  );
}

/**
 * A Hairline-style sun that morphs into a crescent moon: thin rounded strokes,
 * no container. Driven entirely by the figure's `data-state` so it animates in
 * CSS. `filled` draws a solid disc; otherwise the body is a stroked outline and
 * the moon is a separate crescent outline that cross-fades in.
 */
function CelestialMark({
  showMoon,
  filled = true,
  className,
}: {
  showMoon: boolean;
  filled?: boolean;
  className?: string;
}) {
  const maskId = React.useId().replace(/:/g, '');

  // Eight rays around the disc; retract outward→in as the moon rises.
  const rays = Array.from({ length: 8 }, (_, i) => {
    const angle = (i * Math.PI) / 4;
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);
    const inner = 9.4;
    const outer = 12.6;
    return {
      x1: 16 + cos * inner,
      y1: 16 + sin * inner,
      x2: 16 + cos * outer,
      y2: 16 + sin * outer,
      delay: i * 22,
    };
  });

  // Crescent outline for the unfilled moon: the lit limb (a big arc) and the
  // terminator (a shallower arc curving back), meeting at the two cusps.
  const crescentPath = 'M 19.2 10.46 A 6.4 6.4 0 1 1 19.2 21.54 A 9 9 0 0 1 19.2 10.46 Z';

  return (
    <svg
      viewBox="0 0 32 32"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      data-state={showMoon ? 'moon' : 'sun'}
      className={cn('celestial', className)}
    >
      <defs>
        {/* Filled mode only: a dark circle slides in to bite the disc into a crescent. */}
        <mask id={`crescent-${maskId}`}>
          <rect x="0" y="0" width="32" height="32" fill="white" />
          <circle className="celestial-bite" cx={28} cy={6} r={6.4} fill="black" />
        </mask>
      </defs>

      {/* Rays */}
      <g className="celestial-rays">
        {rays.map((r, i) => (
          <line
            key={i}
            x1={r.x1}
            y1={r.y1}
            x2={r.x2}
            y2={r.y2}
            style={{ ['--d' as string]: `${r.delay}ms` }}
          />
        ))}
      </g>

      {filled ? (
        // Solid disc, carved to a crescent by the mask in the moon state.
        <circle
          className="celestial-body"
          cx={16}
          cy={16}
          r={6.4}
          fill="currentColor"
          stroke="none"
          mask={`url(#crescent-${maskId})`}
        />
      ) : (
        <>
          {/* Sun: a plain stroked ring that fades out as the moon rises */}
          <circle className="celestial-ring" cx={16} cy={16} r={6.4} />
          {/* Moon: a stroked crescent outline that fades in */}
          <path className="celestial-crescent" d={crescentPath} />
        </>
      )}
    </svg>
  );
}
