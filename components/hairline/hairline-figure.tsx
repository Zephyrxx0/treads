'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

/**
 * Hosts a Hairline figure (public/hairline/<name>.js) on the page.
 *
 * The kernel (public/hairline/kernel.js) is the unchanged engine; each figure
 * registers itself through `window.hairline`, exactly as the bench does, and
 * is mounted here into a plain div. The page chooses the ink through the
 * `.hl-figure` class in globals.css; the figure sets no colour of its own.
 */

type Handle = { set: (v: number) => void; destroy: () => void };
type Figure = {
  name: string;
  means: string;
  range: [number, number, number];
  mount: (
    ctx: { stage: HTMLElement; svg: SVGSVGElement; read: { textContent: string | null } },
    value: number
  ) => Handle;
};
type HairlineWindow = Window & {
  HL?: { inject: (root: Document) => void; mk: (tag: string, attrs: Record<string, string>, parent: Element) => SVGSVGElement };
  hairline?: (figure: Figure) => void;
  __hairlineFigures?: Record<string, Figure>;
};

const BASE = '/hairline';
const pending = new Map<string, Promise<void>>();

function load(src: string, type?: string): Promise<void> {
  let p = pending.get(src);
  if (!p) {
    p = new Promise<void>((resolve, reject) => {
      const s = document.createElement('script');
      s.src = src;
      if (type) s.type = type;
      s.onload = () => resolve();
      s.onerror = () => reject(new Error(`Could not load ${src}`));
      document.head.appendChild(s);
    });
    pending.set(src, p);
  }
  return p;
}

async function figureFor(name: string): Promise<Figure> {
  const w = window as HairlineWindow;
  w.__hairlineFigures ??= {};
  w.hairline ??= (figure) => {
    w.__hairlineFigures![figure.name] = figure;
  };
  await load(`${BASE}/kernel.js`);
  if (!w.__hairlineFigures[name]) await load(`${BASE}/${name}.js`, 'module');
  const figure = w.__hairlineFigures[name];
  if (!figure) throw new Error(`Figure ${name} did not register`);
  return figure;
}

export interface HairlineFigureProps {
  /** File name in public/hairline, without .js */
  name: 'pebbles' | 'nest' | 'celestial';
  /** The slider value as a share of the figure's range: 0, 0.5 (default) or 1 */
  intensity?: 0 | 0.5 | 1;
  /**
   * The figure's own number, driven from outside (celestial: 0 sun, 1 moon).
   * Overrides `intensity` and is pushed to the figure whenever it changes.
   */
  value?: number;
  /** What the figure shows, for assistive technology */
  label: string;
  /** Show the corner read-out that names the part under the pointer */
  readout?: boolean;
  className?: string;
}

export function HairlineFigure({ name, intensity = 0.5, value: driven, label, readout = true, className }: HairlineFigureProps) {
  const stageRef = React.useRef<HTMLDivElement>(null);
  const readRef = React.useRef<HTMLSpanElement>(null);
  const handleRef = React.useRef<Handle | null>(null);
  const drivenRef = React.useRef(driven);

  // Push an externally driven value into the mounted figure.
  React.useEffect(() => {
    drivenRef.current = driven;
    if (driven !== undefined) handleRef.current?.set(driven);
  }, [driven]);

  // A press the figure answered by itself may not end as a click (the pointer
  // can slide off first). Once it is over, hold the figure to the driven value.
  React.useEffect(() => {
    if (drivenRef.current === undefined) return;
    let t = 0;
    const settle = () => {
      window.clearTimeout(t);
      t = window.setTimeout(() => {
        if (drivenRef.current !== undefined) handleRef.current?.set(drivenRef.current);
      }, 80);
    };
    window.addEventListener('pointerup', settle);
    window.addEventListener('pointercancel', settle);
    return () => {
      window.clearTimeout(t);
      window.removeEventListener('pointerup', settle);
      window.removeEventListener('pointercancel', settle);
    };
  }, [driven === undefined]);

  React.useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;
    let handle: Handle | null = null;
    let cancelled = false;

    figureFor(name)
      .then((figure) => {
        const w = window as HairlineWindow;
        if (cancelled || !w.HL) return;
        w.HL.inject(document);
        const svg = w.HL.mk('svg', { viewBox: '0 0 400 320', 'aria-hidden': 'true' }, stage);
        const read = {
          get textContent() {
            return readRef.current?.textContent ?? null;
          },
          set textContent(v: string | null) {
            if (readRef.current) readRef.current.textContent = v ?? '';
          },
        };
        const [lo, mid, hi] = figure.range;
        const value = drivenRef.current ?? (intensity === 0 ? lo : intensity === 1 ? hi : mid);
        handle = figure.mount({ stage, svg, read }, value);
        handleRef.current = handle;
        if (readRef.current && !readRef.current.textContent) readRef.current.textContent = 'rest';
      })
      .catch(() => {
        /* the page reads fine without the drawing */
      });

    return () => {
      cancelled = true;
      handleRef.current = null;
      handle?.destroy();
      stage.replaceChildren();
    };
  }, [name, intensity]);

  return (
    <div className={cn('relative', className)}>
      {readout && (
        <span
          ref={readRef}
          aria-hidden="true"
          className="pointer-events-none absolute right-3 top-3 z-10 font-mono text-[11px] tabular-nums tracking-wide text-muted-foreground"
        />
      )}
      <div
        ref={stageRef}
        data-hairline={name}
        role="img"
        aria-label={label}
        className="hl-figure w-full"
      />
    </div>
  );
}
