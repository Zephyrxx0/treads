import * as React from 'react';

/**
 * Top-view bush for the walking garden.
 *
 * Every empty plot is filled to its edges and joined to its hedge neighbours
 * across the grid gap, so a run of plots reads as one bush. Drawn as a pencil
 * sketch of a spiky shrub seen from above: one outline round the mass, a few
 * big thorn-like leaf points along each exposed side (uneven, never a
 * sawtooth), and a single lighter layer of spiky leaf clumps inside a deeper
 * base.
 */

export interface HedgeSlot {
  col: number;
  row: number;
}

interface HedgeLayerProps {
  slots: HedgeSlot[];
  cols: number;
  rows: number;
  cell: number;
  gap: number;
  className?: string;
}

/** Bush greens: the garden's hedge and leaf colours, pulled darker toward black */
const BASE = 'color-mix(in oklab, var(--garden-hedge, #3a5d43) 78%, black)';
const CLUMP = 'color-mix(in oklab, var(--garden-leaf, #527d5c) 75%, black)';

const CORNER = 7;
/** How far an exposed side is pulled in, so the points rise out of a valley */
const VALLEY = 1.3;
/** Thickest part of the outline */
const OUTLINE = 3;

/** Deterministic 0..1 value per plot, so the bush never shimmers between renders */
function unit(col: number, row: number, salt: number) {
  const n = Math.sin(col * 127.1 + row * 311.7 + salt * 74.7) * 43758.5453;
  return n - Math.floor(n);
}

const r1 = (n: number) => Math.round(n * 10) / 10;

/** Rounded rectangle with a radius per corner (top-left, top-right, bottom-right, bottom-left) */
function plotPath(x0: number, y0: number, x1: number, y1: number, [tl, tr, br, bl]: number[]) {
  return [
    `M${x0 + tl} ${y0}`,
    `H${x1 - tr}`,
    tr ? `A${tr} ${tr} 0 0 1 ${x1} ${y0 + tr}` : '',
    `V${y1 - br}`,
    br ? `A${br} ${br} 0 0 1 ${x1 - br} ${y1}` : '',
    `H${x0 + bl}`,
    bl ? `A${bl} ${bl} 0 0 1 ${x0} ${y1 - bl}` : '',
    `V${y0 + tl}`,
    tl ? `A${tl} ${tl} 0 0 1 ${x0 + tl} ${y0}` : '',
    'Z',
  ].join(' ');
}

/** A spiky leaf clump: a star whose points are long and thin */
function clump(cx: number, cy: number, r: number, n: number, rot: number, k: number) {
  const pts: string[] = [];
  for (let i = 0; i < n * 2; i++) {
    const a = rot + (i * Math.PI) / n;
    const d = i % 2 ? r * k : r;
    pts.push(`${r1(cx + Math.cos(a) * d)} ${r1(cy + Math.sin(a) * d)}`);
  }
  return `M${pts.join('L')}Z`;
}

type Pt = [number, number];

const quad = (p0: Pt, c: Pt, p1: Pt, steps = 5): Pt[] =>
  Array.from({ length: steps }, (_, i) => {
    const t = (i + 1) / steps;
    const k = 1 - t;
    return [k * k * p0[0] + 2 * k * t * c[0] + t * t * p1[0], k * k * p0[1] + 2 * k * t * c[1] + t * t * p1[1]];
  });

const arc = (cx: number, cy: number, r: number, from: number, to: number, steps = 5): Pt[] =>
  Array.from({ length: steps + 1 }, (_, i) => {
    const a = from + ((to - from) * i) / steps;
    return [cx + Math.cos(a) * r, cy + Math.sin(a) * r];
  });

/**
 * Thorn-like leaf points along one exposed edge, from `a` to `b`, rising in
 * direction `dir`. Widths, heights and lean all differ from point to point.
 * Returns the filled shape and the line that follows its outer edge.
 */
function points(
  col: number,
  row: number,
  salt: number,
  [ax, ay]: Pt,
  [bx, by]: Pt,
  [dx, dy]: Pt
): { fill: string; line: Pt[] } {
  const len = Math.hypot(bx - ax, by - ay);
  if (len < 4) return { fill: '', line: [] };
  const ux = (bx - ax) / len;
  const uy = (by - ay) / len;

  // Uneven widths that add up to the edge
  const n = Math.max(1, Math.round(len / 9));
  const raw = Array.from({ length: n }, (_, i) => 0.7 + unit(col, row, salt * 13 + i) * 0.7);
  const total = raw.reduce((s, v) => s + v, 0);

  let t = 0;
  let fill = '';
  const line: Pt[] = [[ax - dx * 0.8, ay - dy * 0.8]];
  for (let i = 0; i < n; i++) {
    const w = (raw[i] / total) * len;
    const h = 2.6 + unit(col, row, salt * 29 + i + 5) * 1.8;
    const lean = (unit(col, row, salt * 7 + i + 11) - 0.5) * w * 0.8;
    // base sits 0.8 inside the edge so the point merges with the mass
    const p0: Pt = [ax + ux * t - dx * 0.8, ay + uy * t - dy * 0.8];
    const p1: Pt = [ax + ux * (t + w) - dx * 0.8, ay + uy * (t + w) - dy * 0.8];
    const tip: Pt = [
      (p0[0] + p1[0]) / 2 + dx * (h + 0.8) + ux * lean,
      (p0[1] + p1[1]) / 2 + dy * (h + 0.8) + uy * lean,
    ];
    // Sides curve in toward the base, like a thorn or a holly point
    const c0: Pt = [p0[0] + dx * h * 0.55 + ux * w * 0.1, p0[1] + dy * h * 0.55 + uy * w * 0.1];
    const c1: Pt = [p1[0] + dx * h * 0.55 - ux * w * 0.1, p1[1] + dy * h * 0.55 - uy * w * 0.1];
    fill += `M${r1(p0[0])} ${r1(p0[1])}Q${r1(c0[0])} ${r1(c0[1])} ${r1(tip[0])} ${r1(tip[1])}Q${r1(c1[0])} ${r1(c1[1])} ${r1(p1[0])} ${r1(p1[1])}Z`;
    line.push(...quad(p0, c0, tip), ...quad(tip, c1, p1));
    t += w;
  }
  return { fill, line };
}

/**
 * A pen stroke that follows `line`, thickest in the middle and tapering to a
 * point at both ends. Returned as a closed shape to be filled.
 */
function taper(line: Pt[], maxW: number) {
  if (line.length < 2) return '';
  const cum = [0];
  for (let i = 1; i < line.length; i++) {
    cum.push(cum[i - 1] + Math.hypot(line[i][0] - line[i - 1][0], line[i][1] - line[i - 1][1]));
  }
  const total = cum[cum.length - 1] || 1;
  const left: Pt[] = [];
  const right: Pt[] = [];
  line.forEach(([x, y], i) => {
    const [px, py] = line[Math.max(0, i - 1)];
    const [nx, ny] = line[Math.min(line.length - 1, i + 1)];
    const tl = Math.hypot(nx - px, ny - py) || 1;
    const nxv = -(ny - py) / tl;
    const nyv = (nx - px) / tl;
    const half = (maxW / 2) * Math.pow(Math.sin(Math.PI * (cum[i] / total)), 0.6);
    left.push([x + nxv * half, y + nyv * half]);
    right.push([x - nxv * half, y - nyv * half]);
  });
  return `M${[...left, ...right.reverse()].map(([x, y]) => `${r1(x)} ${r1(y)}`).join('L')}Z`;
}

export function HedgeLayer({ slots, cols, rows, cell, gap, className }: HedgeLayerProps) {
  const uid = React.useId().replace(/[^a-zA-Z0-9]/g, '');
  const clip = `${uid}-clip`;
  const step = cell + gap;
  const width = cols * cell + (cols - 1) * gap;
  const height = rows * cell + (rows - 1) * gap;

  const { plots, spikes, outline, clumps } = React.useMemo(() => {
    const has = new Set(slots.map((s) => `${s.col},${s.row}`));
    const at = (c: number, r: number) => has.has(`${c},${r}`);
    const half = gap / 2;

    interface Box {
      col: number;
      row: number;
      x0: number;
      y0: number;
      x1: number;
      y1: number;
      radii: number[];
      exposed: { up: boolean; down: boolean; left: boolean; right: boolean };
    }

    const plots: Array<{ key: string; d: string }> = [];
    const clumps: Array<{ key: string; d: string }> = [];
    const boxes: Box[] = [];

    for (const { col, row } of slots) {
      const left = at(col - 1, row);
      const right = at(col + 1, row);
      const up = at(col, row - 1);
      const down = at(col, row + 1);
      // A corner is rounded only where the bush actually ends
      const radii = [
        !left && !up ? CORNER : 0,
        !right && !up ? CORNER : 0,
        !right && !down ? CORNER : 0,
        !left && !down ? CORNER : 0,
      ];
      const x0 = col * step + (left ? -half : VALLEY);
      const y0 = row * step + (up ? -half : VALLEY);
      const x1 = col * step + cell + (right ? half : -VALLEY);
      const y1 = row * step + cell + (down ? half : -VALLEY);
      plots.push({ key: `${col}-${row}`, d: plotPath(x0, y0, x1, y1, radii) });
      boxes.push({
        col,
        row,
        x0,
        y0,
        x1,
        y1,
        radii,
        exposed: { up: !up, down: !down, left: !left, right: !right },
      });

      // Lighter leaf clumps inside: long thin points, a different turn each
      const cx = col * step + cell / 2;
      const cy = row * step + cell / 2;
      for (let i = 0; i < 2; i++) {
        const mx = cx + (unit(col, row, i * 3 + 20) - 0.5) * cell * 0.8;
        const my = cy + (unit(col, row, i * 3 + 21) - 0.5) * cell * 0.8;
        const r = 7 + unit(col, row, i * 3 + 22) * 3.5;
        const rot = unit(col, row, i + 40) * Math.PI;
        clumps.push({
          key: `${col}-${row}-${i}`,
          d: clump(mx, my, r, 5 + (i % 2), rot, 0.42),
        });
      }
    }

    // Plots that share an exposed side and touch each other form one run, so
    // the points and the outline continue across the join instead of restarting
    const runsOf = (side: 'up' | 'down' | 'left' | 'right') => {
      const horizontal = side === 'up' || side === 'down';
      const list = boxes.filter((b) => b.exposed[side]);
      const line = (b: Box) => (horizontal ? b.row : b.col);
      const along = (b: Box) => (horizontal ? b.col : b.row);
      list.sort((p, q) => line(p) - line(q) || along(p) - along(q));
      const runs: Box[][] = [];
      for (const b of list) {
        const last = runs[runs.length - 1];
        const prev = last?.[last.length - 1];
        if (prev && line(prev) === line(b) && along(prev) + 1 === along(b)) last.push(b);
        else runs.push([b]);
      }
      return runs;
    };

    let spikes = '';
    let outline = '';

    const add = (run: Box[], salt: number, a: Pt, b: Pt, dir: Pt, lead: Pt[] = [], trail: Pt[] = []) => {
      const { fill, line } = points(run[0].col, run[0].row, salt, a, b, dir);
      spikes += fill;
      outline += taper([...lead, ...line, ...trail], OUTLINE);
    };

    for (const run of runsOf('up')) {
      const f = run[0];
      const l = run[run.length - 1];
      const [tl] = f.radii;
      const tr = l.radii[1];
      add(
        run,
        1,
        [f.x0 + tl, f.y0],
        [l.x1 - tr, l.y0],
        [0, -1],
        tl ? arc(f.x0 + tl, f.y0 + tl, tl, Math.PI, 1.5 * Math.PI) : [],
        tr ? arc(l.x1 - tr, l.y0 + tr, tr, 1.5 * Math.PI, 2 * Math.PI) : []
      );
    }
    for (const run of runsOf('down')) {
      const f = run[0];
      const l = run[run.length - 1];
      const bl = f.radii[3];
      const br = l.radii[2];
      add(
        run,
        2,
        [f.x0 + bl, f.y1],
        [l.x1 - br, l.y1],
        [0, 1],
        bl ? arc(f.x0 + bl, f.y1 - bl, bl, Math.PI, 0.5 * Math.PI) : [],
        br ? arc(l.x1 - br, l.y1 - br, br, 0.5 * Math.PI, 0) : []
      );
    }
    for (const run of runsOf('left')) {
      const f = run[0];
      const l = run[run.length - 1];
      add(run, 3, [f.x0, f.y0 + f.radii[0]], [f.x0, l.y1 - l.radii[3]], [-1, 0]);
    }
    for (const run of runsOf('right')) {
      const f = run[0];
      const l = run[run.length - 1];
      add(run, 4, [f.x1, f.y0 + f.radii[1]], [f.x1, l.y1 - l.radii[2]], [1, 0]);
    }

    return { plots, spikes, outline, clumps };
  }, [slots, step, cell, gap]);

  if (slots.length === 0) return null;

  return (
    <svg
      aria-hidden="true"
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      className={className}
      style={{ overflow: 'visible' }}
    >
      <defs>
        <clipPath id={clip}>
          {plots.map((p) => (
            <path key={p.key} d={p.d} />
          ))}
        </clipPath>
      </defs>

      {/* The deep base, points included */}
      <g style={{ fill: BASE }}>
        {plots.map((p) => (
          <path key={p.key} d={p.d} />
        ))}
        <path d={spikes} />
      </g>

      {/* The one lighter layer: spiky leaf clumps, kept inside the bush */}
      <g clipPath={`url(#${clip})`} strokeLinejoin="round">
        <g style={{ fill: CLUMP, stroke: BASE }} strokeWidth="0.6" opacity="0.85">
          {clumps.map((c) => (
            <path key={c.key} d={c.d} />
          ))}
        </g>
      </g>

      {/* Dark green pen outline: thick mid-side, tapering to nothing at each end */}
      <path
        d={outline}
        strokeWidth="0.4"
        strokeLinejoin="round"
        style={{
          fill: 'color-mix(in oklab, var(--garden-hedge, #3a5d43) 60%, black)',
          stroke: 'color-mix(in oklab, var(--garden-hedge, #3a5d43) 60%, black)',
        }}
      />
    </svg>
  );
}
