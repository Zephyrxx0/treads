/**
 * Nest: a ring of twigs woven in two courses round an empty hollow. The
 * pointer is projected onto the ground and the twigs near its bearing lift
 * and part, each on its own spring, so the hollow can be looked into; the
 * read-out counts the twig and what the nest holds: nothing. At rest the wall
 * is high at the back and low at the front, and one bright dot sits in the
 * hollow where the first egg would go. The slider is the reach, in twigs.
 *
 * The pattern: a continuous field, drawn as an empty state. Springs, a
 * falloff by distance round the ring, a hit test on the ground plane.
 */
const {
  Cam, fit, prism, proj, rrect, facing, unproj, spring, stepS, poly,
  flatDot, mk, place, pointer, put, register, disposer, solid,
} = HL;

const N = 15, COURSE = [16, 20.5, 25], REACHES = [0.45, 0.8, 1], W = 3.2, H = 3.3, RISE = 10, STEP = (2 * Math.PI) / N, BACK = (5 * Math.PI) / 4;

/** The share of full lift at u reaches from the pointer: 1 → .31 at 42% → .09 beyond. */
const falloff = (u) =>
  u <= 0 ? 1 : u <= 0.417 ? 1 - (u / 0.417) * 0.6875 : u <= 1 ? 0.3125 - ((u - 0.417) / 0.583) * 0.2185 : 0.094;
/** A fixed scatter in 0..1, so the nest is irregular and always the same. */
const jit = (k) => Math.sin(k * 12.9898 + 4.1) * 0.5 + 0.5;

/** A rounded ring turned by a about (cx, cy). */
const turn = (ring, a, cx, cy) => {
  const c = Math.cos(a), s = Math.sin(a);
  return ring.map((q) => ({ u: cx + q.u * c - q.v * s, v: cy + q.u * s + q.v * c, nu: q.nu * c - q.nv * s, nv: q.nu * s + q.nv * c }));
};

function mount({ stage, svg, read }, value) {
  const bag = disposer();
  let R = value, over = null;

  const C = Cam(45, 0.5, 3.7);
  fit(C, [[-44, -44, -3], [44, 44, -3], [44, -44, -3], [-44, 44, -3], [0, 0, 24]], 200, 168);
  const P = proj(C), front = facing(C);
  const g = mk("g", {}, svg);

  // the ground the nest sits on, and the dim edge of its hollow
  const base = rrect(-43, -43, 43, 43, 43, 14), baseIn = rrect(-41, -41, 41, 41, 41, 14);
  put(solid(g), prism(P, front, base, baseIn, -3, 0));
  const hollow = Array.from({ length: 32 }, (_, k) => P(12 * Math.cos((k / 32) * 2 * Math.PI), 12 * Math.sin((k / 32) * 2 * Math.PI), 0));
  mk("path", { d: poly(hollow), class: "nf lo" }, g);
  const egg = flatDot(g, C, 1.2, "dot");
  place(egg, P(0, 0, 0));

  // three courses of crossed twigs, each wider than the one below, so the wall flares like a bowl;
  // then a few stray twigs on the ground, pointing outwards
  const twigs = [];
  const add = (c, i, th, rr, L, a, z0, live) => {
    const k = c * N + i, cx = rr * Math.cos(th), cy = rr * Math.sin(th);
    const ring = turn(rrect(-L / 2, -W / 2, L / 2, W / 2, 1.5, 3), a, cx, cy), inner = turn(rrect(-L / 2 + 0.7, -W / 2 + 0.7, L / 2 - 0.7, W / 2 - 0.7, 0.8, 3), a, cx, cy);
    const r0 = live ? 2.8 * (1 + Math.cos(th - BACK)) * (0.7 + 0.3 * jit(k + 3)) : 0;
    twigs.push({ c, live, th, ring, inner, z0, r0, key: cx + cy + c * 0.01, sp: spring(r0, { eps: 0.04 }), drawn: NaN });
  };
  for (let c = 0; c < 3; c++) for (let i = 0; i < N; i++) {
    const k = c * N + i, th = (i + 0.5 * c) * STEP + (jit(k) - 0.5) * 0.2, rr = COURSE[c] + (jit(k + 31) - 0.5) * 3;
    add(c, i, th, rr, 19 + jit(k + 7) * 10, th + Math.PI / 2 + (jit(k + 19) - 0.5) * 1.5, c * H * 0.8, true);
  }
  for (let i = 0; i < 6; i++) add(3, i, i * 1.05 + 0.4, 34 + jit(i + 90) * 4, 14 + jit(i + 50) * 6, i * 1.05 + 0.4 + (jit(i + 70) - 0.5) * 0.9, 0, false);
  // painted back to front: by the depth of each twig's middle
  twigs.sort((p, q) => p.key - q.key);
  for (const t of twigs) t.el = solid(g);

  function draw(t) {
    if (t.sp.x === t.drawn) return;
    t.drawn = t.sp.x;
    put(t.el, prism(P, front, t.ring, t.inner, t.z0 + t.sp.x, t.z0 + H + t.sp.x));
  }
  const B = register(stage, (dt) => {
    let m = false;
    for (const t of twigs) { if (stepS(t.sp, dt)) m = true; draw(t); }
    return m;
  });
  bag.add(B.unregister);

  const wrap = (d) => Math.abs(((d + Math.PI) % (2 * Math.PI) + 2 * Math.PI) % (2 * Math.PI) - Math.PI);
  function retarget() {
    const bearing = over ? Math.atan2(over[1], over[0]) : 0;
    let near = null;
    for (const t of twigs) {
      const d = wrap(t.th - bearing) / STEP;
      t.sp.t = t.r0 + (over && t.live ? RISE * falloff(d / R) * REACHES[t.c] : 0);
      if (over && t.c === 2 && (!near || d < near.d)) near = { t, d };
    }
    for (const t of twigs) t.el.sil.classList.toggle("hi", !!near && t === near.t);
    egg.classList.toggle("off", !!over);
    read.textContent = over ? `twig ${Math.round((((bearing / STEP) % N) + N) % N) % N + 1} · 0` : "rest";
    B.wake();
  }

  bag.add(pointer(stage, {
    move: (p) => { const q = unproj(C, p[0], p[1], 0); over = Math.hypot(q[0], q[1]) < 46 ? q : null; retarget(); },
    leave: () => { over = null; retarget(); },
  }));
  bag.add(() => svg.replaceChildren());

  return {
    set: (v) => { R = v; if (over) retarget(); },
    destroy: bag.dispose,
  };
}

hairline({
  name: "nest",
  means: "An empty nest of crossed twigs: the ones near the pointer lift and part, and the hollow holds nothing.",
  rules: [1, 3, 5, 9],
  range: [1.2, 2.2, 3.6],
  mount,
});
