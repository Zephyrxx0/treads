/** Small deterministic helpers, so server and browser draw the very same grass. */

export const GRASS_W = 1200;
export const r1 = (n: number) => Math.round(n * 10) / 10;

export function rng(seed: number) {
  let t = seed;
  return () => {
    t = (t + 0x6d2b79f5) >>> 0;
    let x = t;
    x = Math.imul(x ^ (x >>> 15), x | 1);
    x ^= x + Math.imul(x ^ (x >>> 7), x | 61);
    return ((x ^ (x >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Blades as one path inside a GRASS_W x height box. With `dip` the middle is
 * left nearly bare, so whatever sits there keeps its air.
 */
export function blades(seed: number, count: number, maxH: number, height: number, dip = true) {
  const rand = rng(seed);
  let d = '';
  for (let i = 0; i < count; i++) {
    const x = rand() * GRASS_W;
    // grass stays low about 60 units either side of the middle, then rises gradually to full height
    const edge = dip ? Math.min(1, Math.max(0.12, (Math.abs(x - GRASS_W / 2) - 60) / 320)) : 1;
    const h = (6 + rand() * maxH) * edge;
    const lean = (rand() - 0.5) * 16;
    d += `M${r1(x)} ${height} Q${r1(x + lean * 0.3)} ${r1(height - h * 0.6)} ${r1(x + lean)} ${r1(height - h)}`;
  }
  return d;
}
