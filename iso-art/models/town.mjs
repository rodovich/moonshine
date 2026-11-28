// The town kit: modular pieces for Tessel's streets, used by every surface map
// from Act 2 on. Floors are heightfields cut to the tile's diamond (see
// ground.mjs); wall faces are column pieces (see arch.mjs); everything else is
// a prop with its origin at its footprint's center on its base.

import { box, boxAt, union, subtract, move, place, cylinder, sphere, capsule, custom, intersect, frustum, ellipsoid, torus, roundCone, smooth } from '../lib/sdf.mjs';
import { mat, hex, mix } from '../lib/render.mjs';
import { plaster, limestone, wood, iron, terracotta, leaf, brass, bronze, fbm, vnoise } from './materials.mjs';
import { hash3, rng } from '../lib/noise.mjs';
import { heightfield, sstep } from './ground.mjs';
import { COLORS, windowFeature, doorFeature, onFace, wallColumn, stairFlight } from './arch.mjs';

const PI = Math.PI;
const m = (c, o = {}) => mat(c, { tag: 'prop', ...o });

/** The plasters (the SNES `buildings` swaps) and the shutters each one wears. */
export const PLASTERS = {
  white: { wall: '#ece6d8', shutters: COLORS.cobalt },
  ochre: { wall: '#e8bc78', shutters: COLORS.sage },
  rose: { wall: '#e8b0a0', shutters: COLORS.sage },
  sky: { wall: '#cfdfe2', shutters: '#8a5a34' },
  sage: { wall: '#e8eadc', shutters: COLORS.sage },
};

// ---------------------------------------------------------------------------
// Floors

/**
 * Limestone flagstones: rectangular slabs in courses, a 2×2 macro (q = 'nw'…'se').
 * variant: '' | 'b' (the second slab layout) | 'shade' (under arches and in doorways) | 'crack'.
 */
export function flagstones({ q = 'nw', variant = '', base = '#dcc8a6' } = {}) {
  const ox = q[1] === 'e' ? 1 : 0, oy = q[0] === 's' ? 1 : 0;
  const alt = variant === 'b';
  const c = hex(base), joint = hex('#9c8a72');
  const slab = (x, y) => {
    const X = x + 0.5 + ox, Y = y + 0.5 + oy; // macro coords in [0, 2)
    const rows = alt ? 3 : 4, rh = 2 / rows;
    const row = Math.floor(Y / rh);
    const lens = alt ? [0.7, 0.6, 0.7] : [0.5, 0.75, 0.75];
    let sx = (X + row * 0.37 + (alt ? 0.2 : 0)) % 2, col = 0, acc = 0;
    while (sx > acc + lens[col % lens.length] && acc < 2) { acc += lens[col % lens.length]; col++; }
    const L = lens[col % lens.length];
    const fx = (sx - acc) / L, fy = (Y - row * rh) / rh;
    const ex = Math.min(fx, 1 - fx) * L, ey = Math.min(fy, 1 - fy) * rh;
    return { e: Math.min(ex, ey), id: hash3(col, row, alt ? 7 : 3) };
  };
  const crack = (x, y) => (variant === 'crack' ? Math.abs(y + 0.15 * Math.sin(x * 8) - x * 0.4 - 0.05) : 1);
  const f = (x, y) => {
    const s = slab(x, y);
    let h = -0.02 + sstep(0.0, 0.03, s.e) * 0.02 + (s.id - 0.5) * 0.006;
    if (crack(x, y) < 0.012) h -= 0.006;
    return h;
  };
  const shade = variant === 'shade' ? 0.72 : 1;
  const mt = mat((x, y) => {
    const s = slab(x, y);
    const n = fbm((x + 0.5 + ox) * 5, (y + 0.5 + oy) * 5, 4, 3, 10);
    let col = c.map((v, i) => v * (0.9 + n * 0.14 + (s.id - 0.5) * 0.1) * shade * (i === 2 ? 0.98 : 1));
    col = mix(joint.map((v) => v * shade), col, sstep(0.0, 0.025, s.e));
    if (crack(x, y) < 0.008) col = mix(col, joint, 0.7);
    return col;
  }, { tag: 'floor', spec: 0.06, shin: 10 });
  return heightfield(f, mt);
}

/** Packed earth and grit (the school yard, the goat path). */
export function yard({ seed = 0, base = '#c8a878' } = {}) {
  const c = hex(base);
  const f = (x, y) => -0.015 + (fbm((x + 0.5) * 6, (y + 0.5) * 6, seed, 3, 6) - 0.5) * 0.02;
  const mt = mat((x, y) => {
    const n = fbm((x + 0.5) * 4, (y + 0.5) * 4, seed + 2, 3, 4);
    const grit = hash3(Math.floor((x + 0.5) * 60), Math.floor((y + 0.5) * 60), seed) > 0.93 ? 0.85 : 1;
    return c.map((v) => v * (0.88 + n * 0.2) * grit);
  }, { tag: 'floor', spec: 0.02 });
  return heightfield(f, mt);
}

/** Canal water at its surface (z = 0), animated by phase t. Seen from above: dark, green-teal, with sky glints. */
export function water({ t = 0 } = {}) {
  const f = (x, y) => (vnoise((x + 0.5) * 3 + t * 2, (y + 0.5) * 3, t * 3, 3) - 0.5) * 0.02 + (vnoise((x + 0.5) * 9, (y + 0.5) * 9 - t * 3, 1, 9) - 0.5) * 0.008;
  const mt = mat((x, y) => {
    const n = vnoise((x + 0.5) * 4 + t, (y + 0.5) * 4, 7, 4);
    return mix(hex('#1e4a52'), hex('#3a7a80'), n * 0.6);
  }, { tag: 'floor', spec: 1.4, shin: 80 });
  return heightfield(f, mt);
}

// ---------------------------------------------------------------------------
// Walls: extra facade kinds (balcony, shopfront, archway)

/** A small iron balcony on an upper-storey window: a slab and railing. */
export function balconyFeature({ z0 = 0.75 } = {}) {
  const w = windowFeature({ color: COLORS.cobalt, z0: z0 + 0.05, z1: z0 + 1.6, w: 0.55, sill: false });
  const ir = iron('#2e2e3a', { tag: 'wall' });
  const parts = [...w.parts, boxAt(-0.48, -0.02, z0 - 0.08, 0.48, 0.38, z0, limestone('#d8c8a8', { tag: 'wall' }), 0.02)];
  for (let i = 0; i <= 8; i++) parts.push(capsule([-0.44 + i * 0.11, 0.34, z0], [-0.44 + i * 0.11, 0.34, z0 + 0.5], 0.008, ir));
  parts.push(capsule([-0.46, 0.34, z0 + 0.5], [0.46, 0.34, z0 + 0.5], 0.015, ir), capsule([-0.46, 0.02, z0 + 0.5], [-0.46, 0.34, z0 + 0.5], 0.015, ir), capsule([0.46, 0.02, z0 + 0.5], [0.46, 0.34, z0 + 0.5], 0.015, ir));
  return { cut: w.cut, parts };
}

/** A shopfront: a wide window with a painted frame and a stall board under it. */
export function shopFeature({ color = COLORS.cobalt } = {}) {
  const cut = boxAt(-0.42, -0.14, 0.6, 0.42, 0.1, 1.9, null);
  const frameM = mat(color, { tag: 'wall', spec: 0.15 });
  const glassM = mat((x, y, z) => mix(hex('#2a3048'), hex('#6c88a8'), Math.max(0, Math.min(1, (z - 0.6) / 1.3)) * 0.6), { tag: 'glass', spec: 1.2, shin: 60 });
  const parts = [
    boxAt(-0.42, -0.14, 0.6, 0.42, -0.1, 1.9, glassM),
    boxAt(-0.46, -0.02, 0.56, 0.46, 0.04, 0.62, frameM, 0.01), boxAt(-0.46, -0.02, 1.88, 0.46, 0.04, 1.96, frameM, 0.01),
    boxAt(-0.46, -0.02, 0.56, -0.4, 0.04, 1.96, frameM, 0.01), boxAt(0.4, -0.02, 0.56, 0.46, 0.04, 1.96, frameM, 0.01),
    boxAt(-0.01, -0.12, 0.62, 0.01, -0.1, 1.88, frameM),
    boxAt(-0.46, 0.0, 0.0, 0.46, 0.08, 0.56, frameM, 0.01), // stall board
  ];
  return { cut, parts };
}

/** An open archway through the wall: a round-headed opening into shade. */
export function archFeature({ w = 0.9, z1 = 2.2 } = {}) {
  const r = w / 2;
  const cut = union(boxAt(-r, -1.2, -0.1, r, 0.2, z1 - r, null), place(cylinder(r, -1.2, 0.2, null), { at: [0, 0, z1 - r], rx: PI / 2 }));
  const dark = mat('#2a2430', { tag: 'wall' });
  return { cut, parts: [boxAt(-r, -1.05, -0.02, r, -1.0, z1, dark)] };
}

// ---------------------------------------------------------------------------
// Roofs and domes

/** A hipped terracotta roof over a w×d block, eaves just past the walls; base at z = 0. */
export function hipRoof(w, d, { rise = 0.55, seed = 1 } = {}) {
  const hw = w / 2, hd = d / 2, ov = 0.1;
  const m0 = Math.min(hw, hd);
  const tile = mat((x, y, z) => {
    const c = hex('#c4643e');
    const onX = Math.abs(x) / hw > Math.abs(y) / hd;
    const along = onX ? y : x, across = onX ? x : y;
    const ridge = Math.abs(Math.sin((along + 10) * PI * 5));
    const course = ((Math.abs(across) + 10) * 4.5) % 1;
    const n = vnoise(Math.floor((along + 10) * 5), Math.floor((across + 10) * 4.5), seed);
    const moss = fbm(x * 2, y * 2, seed, 2) > 0.66 ? 0.85 : 1;
    const k = (0.72 + ridge * 0.3) * (course > 0.88 ? 0.75 : 1) * (0.88 + n * 0.22) * moss;
    return [c[0] * k, c[1] * k * (moss < 1 ? 1.05 : 1), c[2] * k];
  }, { tag: 'roof', spec: 0.12 });
  return custom((x, y, z) => {
    const t = Math.min(hw + ov - Math.abs(x), hd + ov - Math.abs(y)) / m0;
    const top = 0.02 + Math.max(0, Math.min(1, t)) * rise * Math.min(1, m0 / 1.2);
    return Math.max((z - top) * 0.6, -0.1 - z, Math.abs(x) - hw - ov, Math.abs(y) - hd - ov);
  }, [-hw - ov, -hd - ov, -0.12, hw + ov, hd + ov, rise + 0.05], tile);
}

/** A flat roof's edge: a low whitewashed lip along x or y (as a 1-tile prop). */
export function roofLip(dir = 'x', color = '#ece6d8') {
  const pl = plaster(color, { axis: dir, weather: false });
  return dir === 'x' ? boxAt(-0.5, -0.1, 0, 0.5, 0.1, 0.22, pl, 0.04) : boxAt(-0.1, -0.5, 0, 0.1, 0.5, 0.22, pl, 0.04);
}

/** A Tessel dome: blue, on a squat drum with round windows, a small moon finial. (Never an Aegean postcard.) */
export function dome(r = 0.9, { drum = 0.45 } = {}) {
  const blue = mat((x, y, z, lx, ly, lz) => {
    const c = hex('#3a6cc0');
    const rib = Math.abs(Math.sin(Math.atan2(ly, lx) * 8)) > 0.96 ? 0.82 : 1;
    return c.map((v) => v * rib * (0.92 + vnoise(lx * 10, ly * 10, lz * 10) * 0.12));
  }, { tag: 'roof', spec: 0.5, shin: 30 });
  const pl = plaster('#ece6d8', { axis: 'x' });
  const parts = [
    cylinder(r * 1.05, 0, drum, pl, 0.03),
    intersect(move(sphere(r, blue), 0, 0, drum), boxAt(-r - 0.1, -r - 0.1, drum, r + 0.1, r + 0.1, drum + r + 0.1, blue)),
    move(torus(r * 1.06, 0.04, plaster('#f2ece2')), 0, 0, drum),
    capsule([0, 0, drum + r], [0, 0, drum + r + 0.25], 0.025, brass()),
    place(torus(0.08, 0.02, brass()), { at: [0, 0, drum + r + 0.33], ry: PI / 2 }),
  ];
  // Oculi round the drum.
  const glassM = mat('#2a3048', { tag: 'glass', spec: 1 });
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * PI * 2;
    parts.push(place(cylinder(0.08, -0.03, 0.03, glassM), { at: [Math.cos(a) * r * 1.04, Math.sin(a) * r * 1.04, drum * 0.55], ry: PI / 2, rz: a }));
  }
  return union(parts);
}

// ---------------------------------------------------------------------------
// Street furniture

/** A street lamp: an iron post with a lantern; `lit` glows (for dusk and night). */
export function streetLamp({ lit = false } = {}) {
  const ir = iron('#2a2a36');
  const glass = lit ? mat('#ffd890', { tag: 'prop', emit: 1 }) : mat('#a8b8c8', { tag: 'prop', spec: 1.2, shin: 60 });
  return union(
    move(cylinder(0.1, 0, 0.1, ir, 0.02), 0, 0, 0),
    roundCone([0, 0, 0.08], [0, 0, 2.3], 0.05, 0.03, ir),
    move(frustum(0.1, 0.13, 2.3, 2.58, glass, 0.01), 0, 0, 0),
    move(frustum(0.16, 0.03, 2.58, 2.72, ir, 0.01), 0, 0, 0),
    move(sphere(0.03, ir), 0, 0, 2.76),
    capsule([0, 0, 2.05], [0.18, 0, 2.15], 0.012, ir), capsule([0, 0, 2.05], [-0.18, 0, 2.15], 0.012, ir),
  );
}

/** A bay tree trimmed into a ball, in a terracotta pot. */
export function bayPot() {
  const lf = mat((x, y, z) => mix(hex('#3a6a30'), hex('#6a9a48'), vnoise(x * 30, y * 30, z * 30)), { tag: 'leaf', spec: 0.2 });
  const tc = terracotta('#b8603a');
  const ballLeaf = custom((x, y, z) => (Math.hypot(x, y, z - 0.88) - 0.32 + (vnoise(x * 25, y * 25, z * 25) - 0.5) * 0.05) * 0.8, [-0.36, -0.36, 0.5, 0.36, 0.36, 1.25], lf);
  return union(frustum(0.16, 0.2, 0, 0.36, tc, 0.01), move(torus(0.2, 0.03, tc), 0, 0, 0.35), capsule([0, 0, 0.35], [0, 0, 0.6], 0.025, wood('#6a4a30')), ballLeaf);
}

/** A wooden crate and a barrel (market and harbor clutter). */
export const crate = () => boxAt(-0.3, -0.3, 0, 0.3, 0.3, 0.5, wood('#a87a48', { grain: 'x' }), 0.02);
export function barrel() {
  const w = wood('#8a5a34', { grain: 'z' });
  return union(
    custom((x, y, z) => Math.max(Math.hypot(x, y) - (0.26 + 0.04 * Math.sin(Math.max(0, Math.min(1, z / 0.8)) * PI)), -z, z - 0.8), [-0.31, -0.31, 0, 0.31, 0.31, 0.8], w),
    move(torus(0.285, 0.015, iron()), 0, 0, 0.15), move(torus(0.285, 0.015, iron()), 0, 0, 0.65),
  );
}

/** An awning over a door or shopfront, projecting from a south face (the prop stands on that tile). */
export function awning(color = '#d05848') {
  const c = hex(color), cream = hex('#f0e6d0');
  const cloth = mat((x) => (Math.floor((x + 1) * 6) % 2 ? c : cream), { tag: 'cloth', spec: 0.05 });
  const pts = [];
  return union(
    custom((x, y, z) => {
      // A sloping canvas from the wall (y = 0.5, z = 2.45) out to y = -0.2, z = 2.15, with a scalloped edge.
      const t = Math.max(0, Math.min(1, (0.5 - y) / 0.7));
      const zz = 2.45 - t * 0.3;
      const scal = y < -0.15 ? 0.04 * Math.abs(Math.sin(x * PI * 6)) : 0;
      return Math.max(Math.abs(z - zz) - 0.012, Math.abs(x) - 0.48, y - 0.5, -0.2 - scal - y) * 0.8;
    }, [-0.5, -0.3, 2.0, 0.5, 0.5, 2.5], cloth),
    capsule([-0.46, -0.18, 2.16], [-0.46, 0.48, 2.42], 0.01, iron()), capsule([0.46, -0.18, 2.16], [0.46, 0.48, 2.42], 0.01, iron()),
  );
  void pts;
}

/** A hanging sign on an iron bracket off a south face; `color` paints the board. */
export function hangingSign(color = '#3a6cc0', emblem = '#f0d080') {
  const ir = iron('#2a2a36');
  const board = mat((x, y, z, lx, ly, lz) => (Math.hypot(lx, lz) < 0.08 ? hex(emblem) : hex(color)), { tag: 'prop', spec: 0.2 });
  return union(
    capsule([0, 0.5, 2.3], [0, 0.0, 2.3], 0.015, ir),
    capsule([0, 0.5, 2.05], [0, 0.15, 2.3], 0.01, ir),
    capsule([0, 0.05, 2.3], [0, 0.05, 2.22], 0.006, ir), capsule([0, -0.2, 2.3], [0, -0.2, 2.22], 0.006, ir),
    move(box(0.02, 0.18, 0.13, board, 0.01), 0, -0.07, 2.08),
  );
}

/** An iron railing along x (or y) through the tile's center, 0.9 m. */
export function railing(dir = 'x') {
  const ir = iron('#2a2a36');
  const parts = [capsule([-0.5, 0, 0.9], [0.5, 0, 0.9], 0.02, ir), capsule([-0.5, 0, 0.15], [0.5, 0, 0.15], 0.012, ir)];
  for (let i = 0; i < 5; i++) parts.push(capsule([-0.4 + i * 0.2, 0, 0], [-0.4 + i * 0.2, 0, 0.9], 0.01, ir));
  const r = union(parts);
  return dir === 'x' ? r : place(r, { rz: PI / 2 });
}

/** A laundry line across a street along x (the span w tiles), sheets and shirts on it, at height zl. */
export function laundryLine(w = 3, { zl = 3.2, seed = 1, colors = ['#f4f0e8', '#e8a090', '#a8c8d8', '#f0e0a0'] } = {}) {
  const R = rng(seed);
  const parts = [capsule([-w / 2, 0, zl], [w / 2, 0, zl - 0.05], 0.008, mat('#d0c8b8', { tag: 'cloth' }))];
  let x = -w / 2 + 0.2;
  while (x < w / 2 - 0.4) {
    const cw = 0.25 + R() * 0.35, ch = 0.3 + R() * 0.4, col = colors[Math.floor(R() * colors.length)];
    parts.push(boxAt(x, -0.01, zl - ch, x + cw, 0.01, zl, mat(col, { tag: 'cloth', emit: 0.12 })));
    x += cw + 0.1 + R() * 0.3;
  }
  return union(parts);
}

/** A stepped stone bridge over a canal, crossing along y (w wide, len long, rising h). */
export function bridge({ w = 2, len = 4, h = 0.9 } = {}) {
  const st = limestone('#d4c09c', { tag: 'prop' });
  const parts = [];
  const n = 8;
  for (let i = 0; i < n; i++) {
    const y0 = -len / 2 + (i / n) * len, y1 = y0 + len / n;
    const mid = Math.sin(((i + 0.5) / n) * PI);
    parts.push(boxAt(-w / 2, y0, -1.2, w / 2, y1 + 0.001, h * mid, st, 0.01));
  }
  // The arch underneath.
  const arch = place(cylinder(len * 0.32, -w, w, null), { at: [0, 0, -1.25], ry: PI / 2 });
  const body = subtract(union(parts), arch, limestone('#a89878', { tag: 'prop' }));
  const parapetM = plaster('#ece6d8');
  return union(body, ...[-1, 1].map((s) => custom((x, y, z) => {
    const top = h * Math.sin(Math.max(0, Math.min(1, (y + len / 2) / len)) * PI) + 0.45;
    return Math.max(Math.abs(x - s * (w / 2 - 0.1)) - 0.1, Math.abs(y) - len / 2, z - top, -1.2 - z);
  }, [-w / 2 - 0.1, -len / 2, -1.2, w / 2 + 0.1, len / 2, h + 0.5], parapetM)));
}

/** A mooring post. */
export const mooringPost = () => union(roundCone([0, 0, -0.6], [0, 0, 0.6], 0.09, 0.07, wood('#6a4a30')), move(sphere(0.08, wood('#5a3a24')), 0, 0, 0.62));

void box; void smooth; void leaf; void ellipsoid; void bronze; void stairFlight; void onFace; void wallColumn; void doorFeature;

/** A flat roof's top in a plaster's own white (an unwalkable roof seen from above). */
export function roofTopFor(color) {
  return boxAt(-1.5, -1.5, -0.2, 1.5, 1.5, 0, plaster(color, { tag: 'floor' }));
}

/** A quay wall at a canal: limestone blocks darkened and greened toward the water, with a tide line. */
export function quayWall(h) {
  const mt = mat((x, y, z) => {
    const u = Math.abs(x) > Math.abs(y) ? y : x;
    const course = Math.floor((z + 100) / 0.4), off = course % 2 ? 0.5 : 0;
    const bu = (u + 0.5) * 2 + off, blk = Math.floor(bu), fu = bu - blk, fz = ((z + 100) / 0.4) % 1;
    const joint = Math.min(fu, 1 - fu) < 0.035 || Math.min(fz, 1 - fz) < 0.05;
    let c = mix(hex('#bca88a'), hex('#d0bc9c'), hash3(((blk % 2) + 2) % 2, course, 21));
    const wet = Math.max(0, 1 - z / 0.6);
    c = mix(c, hex('#4a5a48'), wet * 0.7);
    return c.map((v) => v * (joint ? 0.72 : 1) * (0.9 + fbm((u + 0.5) * 8, z * 8, 1, 3, 8) * 0.16));
  }, { tag: 'wall', spec: 0.08 });
  return boxAt(-0.5, -0.5, 0, 0.5, 0.5, h, mt);
}

/**
 * A flagstone with a moon-eye set in it: a round blue glass stud, the top of a
 * Founders' light-pipe. lit: it glows relic cyan (Act 3 on, at dusk and night).
 */
export function moonEyeStone({ lit = false } = {}) {
  const glass = lit ? mat('#68f0e0', { tag: 'floor', emit: 1 }) : mat('#4a88c8', { tag: 'floor', spec: 1.2, shin: 60, emit: 0.15 });
  const rim = mat('#a89070', { tag: 'floor', spec: 0.4 });
  return union(
    flagstones({ q: 'nw' }),
    cylinder(0.11, -0.03, 0.002, rim, 0.01),
    intersect(sphere(0.085, glass), boxAt(-0.1, -0.1, -0.01, 0.1, 0.1, 0.05, glass)),
  );
}
