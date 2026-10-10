/**
 * Celestial: a sun of twelve rays, drawn as lines only, so whatever is behind
 * it shows through. The rays nearest the pointer reach out; a press folds the
 * rays back one after another from where it landed while a circle bites the
 * disc into a crescent moon, and the next press brings the sun back. The
 * read-out names what is under the pointer. The slider is the phase: 0 the
 * sun, 1 the moon.
 *
 * The pattern: one choice with a ripple. The choice is a tween with a stagger
 * by distance round the ring, the reach is a spring per ray, and the hit test
 * reads the target pose, so a ray folding away cannot flip what is chosen.
 */
const {
  Cam, circ, clamp, fit, lerp, open, poly, proj, rad, rrect, seg, spring, stepS,
  tdone, tset, tval, tween, disposer, mk, pointer, register,
} = HL;

const N = 12, STEP = (2 * Math.PI) / N, TAU = 2 * Math.PI;
const RS = 34, RM = 44, RB = 38, D0 = RS + RB + 6, D1 = 21, PHI = rad(38);
const GAP = 9, WID = 5, T = 6, STAGGER = 45, REACH = 3, BOOST = 16, FAR = 92;
const K = Math.SQRT1_2, ZF = Math.sqrt(0.75);

/** The share of full reach at u reaches from the pointer: 1 → .31 at 42% → .09 beyond. */
const falloff = (u) =>
  u <= 0 ? 1 : u <= 0.417 ? 1 - (u / 0.417) * 0.6875 : u <= 1 ? 0.3125 - ((u - 0.417) / 0.583) * 0.2185 : 0.094;
/** The angle between a and b, 0 to π. */
const gap = (a, b) => Math.abs((((a - b + Math.PI) % TAU) + TAU) % TAU - Math.PI);
/** A point of the disc's plane (u across, v up, d towards the viewer) as a world point: that plane faces the screen. */
const world = (u, v, d) => [(u + d) * K, (d - u) * K, v / ZF];

/** The disc of radius R with the circle RB, d away towards phi, bitten out of it: a ring of samples {u, v, nu, nv}. */
function bitten(R, d, phi) {
  if (d >= R + RB - 0.01) return circ(R, 72);
  const a = Math.acos(clamp((R * R + d * d - RB * RB) / (2 * R * d), -1, 1));
  const b = Math.acos(clamp((RB * RB + d * d - R * R) / (2 * RB * d), -1, 1));
  const bx = d * Math.cos(phi), by = d * Math.sin(phi), out = [];
  // the disc's own edge, round the far side; then the bite's edge, back across it
  for (let k = 0; k <= 44; k++) {
    const t = phi + a + ((TAU - 2 * a) * k) / 44;
    out.push({ u: R * Math.cos(t), v: R * Math.sin(t), nu: Math.cos(t), nv: Math.sin(t) });
  }
  for (let k = 0; k <= 24; k++) {
    const t = phi + Math.PI + b - (2 * b * k) / 24;
    out.push({ u: bx + RB * Math.cos(t), v: by + RB * Math.sin(t), nu: -Math.cos(t), nv: -Math.sin(t) });
  }
  return out;
}

/** A thin plate standing in the disc's plane: its outline, and the dim rim of its thickness along the edges that face up. */
function plate(Q, ring) {
  const s = ring.findIndex((q) => q.nv <= 1e-6), n = ring.length;
  let band = "", run = [];
  const flush = () => {
    if (!run.length) return;
    const b = run.map((q) => Q(q.u, q.v, -T)), f = [run[0], run[run.length - 1]].map((q) => Q(q.u, q.v, 0));
    band += open(b) + seg(f[0], b[0]) + seg(f[1], b[b.length - 1]);
    run = [];
  };
  for (let k = 1; k <= n; k++) {
    const q = ring[(s + k) % n];
    if (q.nv > 1e-6) run.push(q); else flush();
  }
  return { sil: poly(ring.map((q) => Q(q.u, q.v, 0))), band };
}

function mount({ stage, svg, read }, value) {
  const bag = disposer();
  const C = Cam(45, 0.5, 1.6), P = proj(C);
  fit(C, [world(-92, 0, 0), world(92, 0, 0), world(0, 92, -T), world(0, -92, 0)], 200, 166);
  const Q = (u, v, d) => P(...world(u, v, d)), c0 = Q(0, 0, 0);

  let tgt = value, over = null;
  const g = mk("g", {}, svg), ph = tween(value), lean = spring(0, { eps: 0.002 });
  const body = { k: "", band: mk("path", { class: "nf lo" }, g), sil: mk("path", { class: "nf sil hi" }, g) };
  // the rays alternate long and short, so the sun is never a regular star
  const rays = Array.from({ length: N }, (_, i) => ({
    k: "", psi: Math.PI / 2 + i * STEP, len: i % 2 ? 14 : 23, a: tween(1 - value), b: spring(0, { eps: 0.05 }),
    band: mk("path", { class: "nf lo" }, g), sil: mk("path", { class: "nf sil" }, g),
  }));

  function draw(now) {
    const p = tval(ph, now), R = lerp(RS, RM, p), bk = Math.round(p * 1000) + "|" + Math.round(lean.x * 1000);
    if (bk !== body.k) {
      body.k = bk;
      const q = plate(Q, bitten(R, lerp(D0, D1, p), PHI + lean.x));
      body.sil.setAttribute("d", q.sil);
      body.band.setAttribute("d", q.band);
    }
    for (const r of rays) {
      const a = tval(r.a, now), len = (r.len + r.b.x) * a, ri = R + GAP * a + r.b.x * 0.6 * a, rk = Math.round(len * 20) + "|" + Math.round(ri * 20);
      if (rk === r.k) continue;
      r.k = rk;
      let q = { sil: "", band: "" };
      if (len > 1.5) {
        const c = Math.cos(r.psi), s = Math.sin(r.psi);
        q = plate(Q, rrect(0, -WID / 2, len, WID / 2, WID / 2, 3).map((m) => ({
          u: (ri + m.u) * c - m.v * s, v: (ri + m.u) * s + m.v * c, nu: m.nu * c - m.nv * s, nv: m.nu * s + m.nv * c,
        })));
      }
      r.sil.setAttribute("d", q.sil);
      r.band.setAttribute("d", q.band);
    }
  }

  const B = register(stage, (dt, now) => {
    let moving = !tdone(ph, now);
    if (stepS(lean, dt)) moving = true;
    for (const r of rays) { if (stepS(r.b, dt) || !tdone(r.a, now)) moving = true; }
    draw(now);
    return moving;
  });
  bag.add(B.unregister);

  const nearest = (ang) => (((Math.round((ang - Math.PI / 2) / STEP) % N) + N) % N);
  /** What the pointer is over, from the target pose: a ray, the body (-1), or nothing. */
  function pick([x, y]) {
    const u = (x - c0[0]) / C.S, v = (c0[1] - y) / C.S, r = Math.hypot(u, v), ang = Math.atan2(v, u);
    if (r > FAR) return null;
    return { ang, i: tgt < 0.5 && r > lerp(RS, RM, tgt) + 4 ? nearest(ang) : -1 };
  }

  function retarget() {
    const hit = over ? over.i : -1;
    rays.forEach((r, i) => {
      r.b.t = over && tgt < 0.5 ? BOOST * falloff(gap(r.psi, over.ang) / STEP / REACH) : 0;
      r.sil.classList.toggle("hi", i === hit);
    });
    body.sil.classList.toggle("hi", hit < 0);
    const sd = over ? ((over.ang - PHI + 3 * Math.PI) % TAU) - Math.PI : 0;
    lean.t = over && tgt >= 0.5 ? clamp(sd * 0.2, -0.45, 0.45) : 0;
    read.textContent = !over ? "rest" : hit >= 0 ? "ray " + String(hit + 1).padStart(2, "0") : tgt < 0.5 ? "sun" : "moon";
    B.wake();
  }

  /** Moves to phase v: the disc at once, the rays folding or opening outwards from ray `from`. */
  function aim(v, from) {
    if (v === tgt) return;
    const now = performance.now();
    tgt = v;
    tset(ph, v, now, 0);
    rays.forEach((r, i) => { const d = Math.abs(i - from); tset(r.a, 1 - v, now, Math.min(d, N - d) * STAGGER); });
    retarget();
  }

  bag.add(pointer(stage, {
    move: (p) => { over = pick(p); retarget(); },
    down: (p) => { over = pick(p); aim(tgt < 0.5 ? 1 : 0, over ? nearest(over.ang) : 0); retarget(); },
    leave: () => { over = null; retarget(); },
  }));
  bag.add(() => svg.replaceChildren());

  return {
    set: (v) => aim(clamp(v, 0, 1), 0),
    destroy: bag.dispose,
  };
}

hairline({
  name: "celestial",
  means: "A sun drawn in lines: its rays reach for the pointer, and a press folds them in as a circle bites the disc into a moon.",
  rules: [1, 2, 4, 5, 8],
  range: [0, 0, 1],
  mount,
});
