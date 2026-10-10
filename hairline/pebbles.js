/**
 * Pebbles: ten river pebbles lying on a slab of wet sand, each an oval of its
 * own size and heading, three of them banded with a seam of quartz. The pebble
 * under the pointer is picked up; its neighbours slide away from it, the
 * nearer the further, staggered outwards. At rest the largest pebble is the
 * bright one. The slider is the stagger, in ms.
 *
 * The pattern: discrete items. Tweens, a stagger by distance, and a hit test
 * against each pebble's resting top, so a pebble that has been lifted or has
 * slid cannot change the choice.
 */
const {
  Cam, fit, open, prism, proj, rrect, facing, unproj, rings, seg,
  tdone, tset, tval, tween, disposer, mk, pointer, put, register, solid, flatDot, place,
} = HL;

const XE = 150, YE = 110, PB = 8, LIFT = 7, PUSH = 5, HI = 3;
// [x, y, length, width, heading in degrees, height, banded]
const PEBBLES = [
  [38, 30, 34, 22, 20, 5, 0], [80, 24, 28, 19, -30, 4, 0], [116, 34, 30, 21, 70, 5.5, 0], [58, 58, 38, 25, -10, 6, 1],
  [100, 66, 32, 22, 35, 5, 1], [30, 76, 26, 18, 60, 4, 0], [74, 88, 30, 20, 5, 4.5, 0], [120, 92, 26, 17, -40, 3.5, 1],
  [14, 50, 16, 12, 0, 3, 0], [98, 44, 14, 10, 0, 3, 0],
];
// the sea's edge on the sand: [y, x from, x to]
const WASH = [[104, 8, 56], [104, 92, 142], [99, 20, 44], [99, 100, 130]];

/** A ring turned by a degrees about the origin. */
const turn = (ring, a) => {
  const r = (a * Math.PI) / 180, c = Math.cos(r), s = Math.sin(r);
  return ring.map((q) => ({ u: q.u * c - q.v * s, v: q.u * s + q.v * c, nu: q.nu * c - q.nv * s, nv: q.nu * s + q.nv * c }));
};
const move = (ring, x, y) => ring.map((q) => ({ u: q.u + x, v: q.v + y, nu: q.nu, nv: q.nv }));

function mount({ stage, svg, read }, value) {
  const bag = disposer();
  let stag = value;

  const C = Cam(45, 0.5, 1.9);
  fit(C, [[0, 0, -PB], [XE, 0, -PB], [0, YE, -PB], [XE, YE, -PB], [75, 55, 20]], 200, 166);
  const P = proj(C), front = facing(C);

  const g = mk("g", {}, svg);
  const [pr, pi] = rings(0, 0, XE, YE, 16, 2.2);
  put(solid(g), prism(P, front, pr, pi, -PB, 0));
  mk("path", { d: WASH.map(([y, a, b]) => seg(P(a, y, 0), P(b, y, 0))).join(""), class: "nf lo" }, g);

  // painted back to front by the depth of each pebble's middle
  const items = PEBBLES.map(([x, y, L, W, a, h, band], i) => {
    const r = W / 2 * 0.98;
    const ring = turn(rrect(-L / 2, -W / 2, L / 2, W / 2, r, 7), a), inner = turn(rrect(-L / 2 + 1.6, -W / 2 + 1.6, L / 2 - 1.6, W / 2 - 1.6, r - 1.6, 7), a);
    return { i, x, y, h, a, W, band, ring, inner, z: tween(0), dx: tween(0), dy: tween(0), drawn: "" };
  }).sort((p, q) => p.x + p.y - (q.x + q.y));
  for (const t of items) {
    t.el = solid(g);
    t.seam = band(t, g);
  }
  function band(t, parent) { return t.band ? mk("path", { class: "nf lo" }, parent) : null; }

  function draw(t, now) {
    const o = tval(t.z, now), x = tval(t.dx, now), y = tval(t.dy, now), key = `${o}|${x}|${y}`;
    if (key === t.drawn) return;
    t.drawn = key;
    put(t.el, prism(P, front, move(t.ring, t.x + x, t.y + y), move(t.inner, t.x + x, t.y + y), 0, t.h + o));
    if (t.seam) {
      // a seam of quartz across the short axis, bowed over the top
      const r = (t.a * Math.PI) / 180, ux = -Math.sin(r), uy = Math.cos(r), z = t.h + o, w = t.W * 0.42;
      const at = (k, lift) => P(t.x + x + ux * w * k + Math.cos(r) * 2.5, t.y + y + uy * w * k + Math.sin(r) * 2.5, z + lift);
      t.seam.setAttribute("d", open([at(-1, -1.2), at(-0.5, 0), at(0, 0), at(0.5, 0), at(1, -1.2)]));
    }
  }

  const B = register(stage, (_dt, now) => {
    let moving = false;
    for (const t of items) { draw(t, now); if (!tdone(t.z, now) || !tdone(t.dx, now) || !tdone(t.dy, now)) moving = true; }
    return moving;
  });
  bag.add(B.unregister);

  /** The pebble whose resting top the pointer is nearest, or -1. Never the pose on screen. */
  function hit([sx, sy]) {
    let best = -1, bd = 1.1;
    for (const t of items) {
      const [x, y] = unproj(C, sx, sy, t.h), r = (t.a * Math.PI) / 180, p = PEBBLES[t.i];
      const u = (x - t.x) * Math.cos(r) + (y - t.y) * Math.sin(r), v = -(x - t.x) * Math.sin(r) + (y - t.y) * Math.cos(r);
      const d = Math.hypot(u / (p[2] / 2), v / (p[3] / 2));
      if (d < bd) { bd = d; best = t.i; }
    }
    return best;
  }

  let act = -1;
  function lit(a) {
    for (const t of items) {
      const on = t.i === (a < 0 ? HI : a);
      t.el.sil.classList.toggle("hi", on);
      if (t.seam) t.seam.setAttribute("class", on ? "nf hi" : "nf lo");
    }
  }
  function setActive(a) {
    if (a === act) return;
    const now = performance.now(), from = a >= 0 ? a : act, f = PEBBLES[from < 0 ? 0 : from];
    act = a;
    for (const t of items) {
      const delay = Math.hypot(t.x - f[0], t.y - f[1]) / 30 * stag;
      if (a < 0) { tset(t.z, 0, now, delay); tset(t.dx, 0, now, delay); tset(t.dy, 0, now, delay); continue; }
      const c = PEBBLES[a], vx = t.x - c[0], vy = t.y - c[1], d = Math.hypot(vx, vy) || 1, push = t.i === a ? 0 : PUSH * Math.exp(-((d / 34) ** 2));
      tset(t.z, t.i === a ? LIFT : 0, now, delay);
      tset(t.dx, (vx / d) * push, now, delay);
      tset(t.dy, (vy / d) * push, now, delay);
    }
    lit(a);
    read.textContent = a < 0 ? "rest" : `pebble ${a + 1}`;
    B.wake();
  }

  for (const t of items) draw(t, 0);
  lit(-1);
  bag.add(pointer(stage, { move: (p) => setActive(hit(p)), leave: () => setActive(-1) }));
  bag.add(() => svg.replaceChildren());

  return {
    set: (v) => { stag = v; },
    destroy: bag.dispose,
  };
}

hairline({
  name: "pebbles",
  means: "Ten river pebbles on wet sand: the one under the pointer is picked up, and its neighbours slide away in turn.",
  rules: [1, 2, 5, 9],
  range: [0, 45, 100],
  mount,
});
