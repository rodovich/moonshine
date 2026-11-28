// Act 2's Harbor, lighthouse, Bilge, and Goat Path pieces. Each builder
// returns an SDF node with its origin at the center of its footprint on the
// floor (z = 0; for boats, the waterline), x east, y south. Footprints are
// noted. Boats are cut at the waterline, so they sit on any water tile.

import { box, boxAt, union, subtract, move, place, cylinder, sphere, capsule, custom, intersect, frustum, ellipsoid, torus, roundCone, smooth } from '../lib/sdf.mjs';
import { mat, hex, mix } from '../lib/render.mjs';
import { plaster, limestone, paintedWood, wood, iron, glass, terracotta, leaf, brass, bronze, fbm, vnoise } from './materials.mjs';
import { hash3, rng, voronoi } from '../lib/noise.mjs';
import { COLORS } from './arch.mjs';
import { PAL, water, seeThrough, tint, ashlar } from './act2-materials.mjs';
import { heightfield, sstep, clamp } from './ground.mjs';

const PI = Math.PI;

// ---------------------------------------------------------------------------
// Painted lettering: a tiny bitmap face, so boards and hulls carry real words
// at the size a sign painter would use (they read as lettering, not text).

const GLYPHS = {
  A: ['.##.', '#..#', '####', '#..#', '#..#'], B: ['###.', '#..#', '###.', '#..#', '###.'],
  C: ['.###', '#...', '#...', '#...', '.###'], E: ['####', '#...', '###.', '#...', '####'],
  G: ['.###', '#...', '#.##', '#..#', '.###'], H: ['#..#', '#..#', '####', '#..#', '#..#'],
  I: ['###', '.#.', '.#.', '.#.', '###'], L: ['#...', '#...', '#...', '#...', '####'],
  N: ['#..#', '##.#', '#.##', '#..#', '#..#'], O: ['.##.', '#..#', '#..#', '#..#', '.##.'],
  P: ['###.', '#..#', '###.', '#...', '#...'], R: ['###.', '#..#', '###.', '#.#.', '#..#'],
  S: ['.###', '#...', '.##.', '...#', '###.'], T: ['###', '.#.', '.#.', '.#.', '.#.'],
  Y: ['#.#', '#.#', '.#.', '.#.', '.#.'], F: ['####', '#...', '###.', '#...', '#...'],
  '>': ['..#..', '...#.', '#####', '...#.', '..#..'], '<': ['..#..', '.#...', '#####', '.#...', '..#..'],
  ' ': ['..', '..', '..', '..', '..'],
};
/** Is (u, v) on a letter? u runs right from the text's left end, v down from its top; px is one font pixel. */
export function lettering(text, px) {
  const cols = [];
  for (const ch of text) { const g = GLYPHS[ch] || GLYPHS[' ']; for (let c = 0; c < g[0].length; c++) cols.push(g.map((r) => r[c] === '#')); cols.push([false, false, false, false, false]); }
  const width = (cols.length - 1) * px;
  return { width, hit: (u, v) => { const c = Math.floor(u / px), r = Math.floor(v / px); return c >= 0 && r >= 0 && r < 5 && c < cols.length && cols[c][r]; } };
}

// ---------------------------------------------------------------------------
// Harbor furniture

const ironPaint = (base = '#2a2a34') => mat((x, y, z, lx, ly, lz) => {
  const n = fbm(lx * 30, ly * 30, lz * 30, 2), rust = fbm(lx * 9 + 4, ly * 9, lz * 9, 2);
  let c = tint(hex(base), 0.9 + n * 0.2);
  if (rust > 0.62) c = mix(c, hex('#8a4a2a'), Math.min(0.6, (rust - 0.62) * 3));
  return c;
}, { tag: 'prop', spec: 0.45, shin: 26 });

const hemp = () => mat((x, y, z, lx, ly, lz) => tint(hex('#c0a068'), 0.85 + Math.sin((lx + ly + lz) * 140) * 0.1), { tag: 'prop', spec: 0.05 });

/** An iron mushroom bollard (1×1); with `rope`, a mooring line looped on it and running off south to the water. */
export function bollard({ rope = false } = {}) {
  const m = ironPaint();
  const parts = [
    cylinder(0.2, 0, 0.06, limestone('#cbb898', { tag: 'prop' }), 0.02),
    frustum(0.15, 0.115, 0.05, 0.46, m, 0.02),
    move(ellipsoid(0.19, 0.19, 0.08, m), 0, 0, 0.5),
    move(torus(0.13, 0.02, m), 0, 0, 0.12),
  ];
  if (rope) {
    const r = hemp();
    parts.push(move(torus(0.125, 0.026, r), 0, 0, 0.4));
    parts.push(move(torus(0.13, 0.024, r), 0, 0, 0.35));
    // The line: off the loop's south side, sagging down to the quay's edge and over.
    const pts = [[0.02, 0.13, 0.37], [0.06, 0.25, 0.28], [0.08, 0.36, 0.16], [0.1, 0.45, 0.07], [0.11, 0.52, 0.03]];
    for (let i = 0; i < pts.length - 1; i++) parts.push(capsule(pts[i], pts[i + 1], 0.026, r));
    // The tail end, coiled on the paving to the west.
    parts.push(move(torus(0.12, 0.024, r), -0.28, 0.06, 0.025), move(torus(0.07, 0.022, r), -0.28, 0.06, 0.06));
  }
  return union(parts);
}

const crateWood = (seed = 0) => mat((x, y, z, lx, ly, lz, nx, ny, nz) => {
  const along = Math.abs(nz) > 0.7 ? lx : lz;
  const g = vnoise(along * 4, (lx + ly) * 70, seed);
  const c = mix(hex('#a88458'), hex('#c8a878'), hash3(Math.floor((lz + 1) * 7), seed, 2));
  return tint(c, 0.82 + g * 0.22);
}, { tag: 'prop', spec: 0.06 });

/** A slatted wooden crate (≈0.6 m), origin at its foot. */
export function crateBox(seed = 0, s = 1) {
  const w = 0.3 * s, h = 0.5 * s;
  const m = crateWood(seed), bat = wood('#8a6440', { grain: 'z' });
  const parts = [boxAt(-w + 0.02, -w + 0.02, 0.0, w - 0.02, w - 0.02, h - 0.02, m, 0.01)];
  // Slats with gaps on the sides: dark grooves.
  for (const z of [h * 0.33, h * 0.66]) parts.push(boxAt(-w - 0.002, -w - 0.002, z - 0.012, w + 0.002, w + 0.002, z + 0.012, mat('#4a3628', { tag: 'prop' })));
  for (const sx of [-1, 1]) for (const sy of [-1, 1]) parts.push(boxAt(sx * w - 0.035, sy * w - 0.035, 0, sx * w + 0.035, sy * w + 0.035, h, bat, 0.01));
  parts.push(boxAt(-w, -w, h - 0.03, w, w, h, m, 0.01));
  return union(parts);
}

/** One crate (1×1), turned a little. */
export const crate = (seed = 1) => place(crateBox(seed), { rz: 0.12 });
/** A pair of crates with a third on top (2×1 along x). */
export function cratesPair() {
  return union(place(crateBox(1), { at: [-0.45, 0.02, 0], rz: 0.06 }), place(crateBox(2), { at: [0.42, -0.04, 0], rz: -0.1 }), place(crateBox(3, 0.8), { at: [-0.35, 0.0, 0.5], rz: 0.3 }));
}

/** Nets drying on a rack (1×1): two posts and a rail, the net draped over it, cork floats, a heap at the foot. */
export function nets() {
  const post = wood('#8a6440', { grain: 'z' });
  const netM = mat((x, y, z, lx, ly, lz) => {
    // Mesh: dark holes between brown twine (opaque, so the holes are shade).
    const a = Math.abs(((x * 0.7 + z) * 18) % 1 - 0.5), b = Math.abs(((x * 0.7 - z) * 18) % 1 - 0.5);
    const twine = Math.min(a, b) < 0.14;
    return twine ? tint(hex('#8a6a48'), 0.95 + vnoise(x * 30, z * 30) * 0.15) : hex('#3a2a24');
  }, { tag: 'prop', spec: 0.05 });
  const cork = mat('#c87838', { tag: 'prop', spec: 0.1 });
  const parts = [
    boxAt(-0.42, -0.04, 0, -0.34, 0.04, 1.25, post, 0.01), boxAt(0.34, -0.04, 0, 0.42, 0.04, 1.25, post, 0.01),
    capsule([-0.46, 0, 1.2], [0.46, 0, 1.2], 0.03, post),
  ];
  // The drape: a sheet over the rail, hanging both sides with folds, hem waving.
  parts.push(custom((x, y, z) => {
    const s = Math.max(0, 1.2 - z);
    const fold = Math.sin(x * 22) * 0.02 + Math.sin(x * 9 + 1) * 0.02;
    const off = Math.sqrt(s) * 0.16 + fold;
    const dy = Math.abs(Math.abs(y) - off) - 0.012;
    const hem = 0.35 + Math.sin(x * 13) * 0.06 + (y > 0 ? 0.08 : 0);
    return Math.max(dy, Math.abs(x) - 0.33, hem - z, z - 1.23) * 0.7;
  }, [-0.34, -0.3, 0.2, 0.34, 0.3, 1.25], netM));
  // Floats strung along the hems.
  for (let i = 0; i < 5; i++) for (const s of [-1, 1]) {
    const x = -0.26 + i * 0.13;
    const z = 0.38 + Math.sin(x * 13) * 0.06 + (s > 0 ? 0.08 : 0);
    parts.push(move(ellipsoid(0.035, 0.03, 0.03, cork), x, s * Math.sqrt(Math.max(0, 1.2 - z)) * 0.16 + s * 0.01, z));
  }
  // A heap of net on the ground in front, with floats in it.
  parts.push(move(smooth(0.06, ellipsoid(0.28, 0.16, 0.08, netM), move(ellipsoid(0.16, 0.12, 0.1, netM), 0.08, 0.02, 0.04)), 0.05, 0.3, 0.03));
  for (const [x, y] of [[-0.12, 0.35], [0.12, 0.25], [0.22, 0.38]]) parts.push(move(ellipsoid(0.035, 0.03, 0.03, cork), x, y, 0.1));
  return union(parts);
}

/**
 * A painted board on two posts (3×1 along x), whitewashed, lettered in blue:
 * text like 'HARBOR >' or '< THE BILGE'.
 */
export function signBoard(text) {
  const post = wood('#8a6a48', { grain: 'z' });
  const px = 0.047;
  const L = lettering(text, px);
  const z1 = 1.2, z0 = 0.8, x0 = -1.4, x1 = 1.4;
  const tx0 = -L.width / 2, tv0 = z1 - (z1 - z0 - 5 * px) / 2;
  const board = mat((x, y, z, lx, ly, lz, nx, ny, nz) => {
    const n = fbm(x * 8, z * 8, 2, 2);
    let c = tint(hex('#eee8da'), 0.92 + n * 0.1);
    if (ny > 0.6 && L.hit(x - tx0, tv0 - z)) c = hex('#2c5ab0');
    // A painted cobalt border, and weathering at the bottom.
    if (ny > 0.6 && (Math.abs(x - x0) < 0.04 || Math.abs(x - x1) < 0.04 || Math.abs(z - z0) < 0.03 || Math.abs(z - z1) < 0.03)) c = hex('#3a6cc0');
    if (z < z0 + 0.1) c = mix(c, hex('#a89880'), (z0 + 0.1 - z) * 2.5 * n);
    return c;
  }, { tag: 'prop', spec: 0.08 });
  return union(
    boxAt(-1.15, -0.05, 0, -1.05, 0.03, 1.28, post, 0.012), boxAt(1.05, -0.05, 0, 1.15, 0.03, 1.28, post, 0.012),
    boxAt(x0, 0.03, z0, x1, 0.075, z1, board, 0.012),
    boxAt(x0 - 0.02, 0.025, z1 - 0.01, x1 + 0.02, 0.09, z1 + 0.03, wood('#9a7450', { grain: 'x' }), 0.01),
  );
}

// ---------------------------------------------------------------------------
// Boats

/**
 * A hull along x (bow +x), cut at the waterline (z = 0). Returns the node.
 * opts: L (length), B (half-beam), sheer (height amidships), bowRise, sternRise,
 * open (hollow with thwarts) or deck (z of a deck with a bulwark), colors.
 */
function hull({ L = 2.6, B = 0.5, sheer = 0.42, bowRise = 0.15, sternRise = 0.06, keel = -0.4, bow0 = 0.35, stern = 0.55, open = true, deck = null, th = 0.04,
  side = '#7a5236', band = PAL.cobalt, bandZ = [0.3, 0.38], boot = '#2a3040', inside = '#9a7048', rail = '#5a3a28', name = null, foam = 0 } = {}) {
  const hl = L / 2;
  const halfw = (x, z) => {
    const t = x / hl;
    let w = B;
    if (t > bow0) w = B * Math.max(0, 1 - Math.pow((t - bow0) / (1 - bow0), 1.7));
    if (t < -stern) w = B * Math.sqrt(Math.max(0, 1 - Math.pow((-t - stern) / (1 - stern), 2) * 0.55));
    const f = clamp((z - keel) / (sheer - keel), 0, 1);
    return w * (0.5 + 0.5 * Math.sqrt(f));
  };
  const sheerAt = (x) => { const t = x / hl; return sheer + (t > 0 ? bowRise * t * t : sternRise * t * t); };
  const lab = name ? lettering(name, 0.045) : null;
  const sideM = mat((x, y, z, lx, ly, lz, nx, ny, nz) => {
    const sh = sheerAt(lx);
    const g = vnoise(lx * 5, lz * 60, 1);
    let c = tint(hex(side), 0.9 + g * 0.12);
    // Planks (lapstrake lines) for wooden boats.
    if (open && ((sh - lz) * 14) % 1 < 0.1) c = tint(c, 0.75);
    if (lz > sh - 0.06) c = hex(rail);
    else if (lz > sh - 0.06 - (bandZ[1] - bandZ[0]) && lz < sh - 0.06) c = hex(band);
    if (lz < 0.08) c = mix(hex(boot), c, lz / 0.08 * 0.3);
    if (lab && ly > 0 && lx > hl * 0.05 && lx < hl * 0.05 + lab.width && lab.hit(lx - hl * 0.05, sh - 0.2 - lz)) c = hex('#283c78');
    if (foam && lz < 0.035) c = mix(c, hex('#e8f4f4'), 0.8);
    return c;
  }, { tag: 'prop', spec: open ? 0.15 : 0.35, shin: 24 });
  const outer = custom((x, y, z) => Math.max(Math.abs(y) - halfw(x, z), z - sheerAt(x), keel - z, Math.abs(x) - hl) * 0.6,
    [-hl, -B, keel, hl, B, sheer + bowRise + 0.02], sideM);
  const inM = wood(inside, { grain: 'x' });
  const floorZ = deck ?? 0.08;
  const inner = custom((x, y, z) => Math.max(Math.abs(y) - (halfw(x, z) - th), floorZ - z, Math.abs(x) - (hl - th * 3)) * 0.6,
    [-hl, -B, floorZ, hl, B, sheer + bowRise + 0.3], inM);
  const body = subtract(outer, inner, inM);
  return { node: intersect(body, boxAt(-hl - 0.1, -B - 0.1, 0, hl + 0.1, B + 0.1, sheer + bowRise + 1, sideM)), halfw, sheerAt, floorZ };
}

/** The Boatman's rowing boat (2×1 along x): brown, a blue band, two thwarts, oars shipped along the gunwales. */
export function rowboat({ side = '#7a5236', band = PAL.cobalt, oars = true, L = 2.4, B = 0.52, seed = 0 } = {}) {
  const h = hull({ L, B, side, band });
  const th = wood('#a07850', { grain: 'y' });
  const parts = [h.node];
  for (const x of [-0.35, 0.35]) parts.push(boxAt(x - 0.08, -h.halfw(x, 0.3) + 0.03, 0.26, x + 0.08, h.halfw(x, 0.3) - 0.03, 0.3, th, 0.01));
  parts.push(boxAt(-L / 2 + 0.12, -0.3, 0.24, -L / 2 + 0.36, 0.3, 0.28, th, 0.01)); // stern seat
  parts.push(boxAt(-0.7, -0.3, 0.09, 0.7, 0.3, 0.11, wood('#8a6038', { grain: 'x' }))); // bottom boards
  if (oars) {
    const o = wood('#c8a070', { grain: 'x' });
    for (const s of [-1, 1]) {
      const y = s * (h.halfw(0, 0.45) - 0.06);
      parts.push(capsule([-0.75, y, 0.45], [0.7, y * 0.9, 0.47], 0.022, o));
      parts.push(place(box(0.2, 0.05, 0.008, o, 0.006), { at: [0.85, y * 0.88, 0.47] }));
      parts.push(move(cylinder(0.012, 0.4, 0.52, iron()), -0.1, s * (h.halfw(-0.1, 0.45) - 0.01), 0));
    }
  }
  // A painter (mooring line) coiled in the bow.
  parts.push(move(torus(0.07, 0.018, hemp()), L / 2 - 0.45, 0, 0.15));
  void seed;
  return union(parts);
}

/** A painted canal boat (2×1 along x), moored: longer, with a canvas over the bow and a bailer. */
export function canalBoat({ side = PAL.cobalt, band = '#f0e8d0', rail = '#5a3a28', cover = '#c8b890' } = {}) {
  const h = hull({ L: 2.7, B: 0.55, sheer: 0.4, bowRise: 0.2, side, band, rail, bandZ: [0.3, 0.37] });
  const parts = [h.node];
  const th = wood('#b08858', { grain: 'y' });
  parts.push(boxAt(-0.25, -0.44, 0.24, -0.1, 0.44, 0.28, th, 0.01));
  parts.push(boxAt(-1.2, -0.32, 0.22, -0.95, 0.32, 0.26, th, 0.01));
  // Canvas over the bow, tied down.
  const cv = mat((x, y, z) => tint(hex(cover), 0.9 + vnoise(x * 20, y * 20, z * 20) * 0.15), { tag: 'prop', spec: 0.04 });
  parts.push(intersect(move(ellipsoid(0.75, 0.5, 0.2, cv), 0.75, 0, 0.36), boxAt(0.2, -0.6, 0.34, 1.4, 0.6, 0.7, cv)));
  parts.push(move(cylinder(0.07, 0.1, 0.2, mat('#8a9098', { tag: 'prop', spec: 0.6 }), 0.01), -0.6, 0.15, 0)); // a tin bailer
  return union(parts);
}

/** Mott's ferry, the Persistence (10×3 along x, bow east), at the waterline. `t` bobs it (0–1). */
export function persistence({ t = 0 } = {}) {
  const deckZ = 0.72;
  const h = hull({ L: 9.4, B: 1.38, sheer: 1.05, bowRise: 0.45, sternRise: 0.08, keel: -1.1, bow0: 0.3, stern: 0.78, open: false, deck: deckZ, th: 0.09,
    side: '#ecebe4', band: '#d05848', bandZ: [0.3, 0.4], boot: '#3a2c3a', inside: '#b08a60', rail: '#8a5a34', name: 'PERSISTENCE', foam: 1 });
  const white = paintedWood('#eceae2', { wear: '#b8b0a0', wearAt: 0.8, grain: 'z', tag: 'prop' });
  const parts = [h.node];
  // Deck planks.
  parts.push(custom((x, y, z) => Math.max(Math.abs(y) - h.halfw(x, deckZ) + 0.08, Math.abs(z - deckZ - 0.02) - 0.02, Math.abs(x) - 4.5) * 0.8, [-4.7, -1.4, deckZ - 0.02, 4.7, 1.4, deckZ + 0.05],
    mat((x, y, z) => tint(hex('#c09868'), (((y + 2) * 9) % 1 < 0.1 ? 0.7 : 0.95) + vnoise(x * 3, y * 30) * 0.1), { tag: 'prop', spec: 0.1 })));
  // The wheelhouse aft: white, a row of windows, a brown roof with a lip.
  const wx0 = -3.9, wx1 = -1.9;
  const glassM = mat((x, y, z) => mix(hex('#1c2438'), hex('#6a8ab0'), clamp((z - 1.5) / 0.4, 0, 1) * 0.6), { tag: 'prop', spec: 1.2, shin: 60 });
  parts.push(boxAt(wx0, -0.95, deckZ, wx1, 0.95, 2.0, white, 0.03));
  for (let i = 0; i < 4; i++) parts.push(boxAt(wx0 + 0.25 + i * 0.44, 0.94, 1.45, wx0 + 0.55 + i * 0.44, 0.97, 1.82, glassM));
  for (let i = 0; i < 3; i++) parts.push(boxAt(wx1 - 0.01, -0.75 + i * 0.52, 1.45, wx1 + 0.02, -0.4 + i * 0.52, 1.82, glassM));
  parts.push(boxAt(wx0 - 0.12, -1.06, 2.0, wx1 + 0.15, 1.06, 2.1, wood('#8a5a34', { grain: 'x' }), 0.02));
  // A stovepipe on the roof, and a life ring on the wheelhouse's south side.
  parts.push(move(cylinder(0.07, 2.08, 2.55, mat('#3a3440', { tag: 'prop', spec: 0.4 }), 0.01), wx0 + 0.4, -0.5, 0));
  parts.push(place(torus(0.2, 0.05, mat((x, y, z, lx, ly) => (Math.floor((Math.atan2(ly, lx) / PI + 1) * 4) % 2 ? hex('#d05848') : hex('#f0ece4')), { tag: 'prop', spec: 0.2 })), { at: [wx0 + 1.0, 0.99, 1.05], rx: PI / 2 }));
  // Stanchions and a rail round the foredeck.
  const rl = mat('#e8e6e0', { tag: 'prop', spec: 0.4 });
  for (let x = -1.6; x <= 3.6; x += 0.6) for (const s of [-1, 1]) {
    const y = s * (h.halfw(x, 1.0) - 0.05), z0 = h.sheerAt(x);
    parts.push(capsule([x, y, z0], [x, y, z0 + 0.32], 0.018, rl));
  }
  for (const s of [-1, 1]) for (let x = -1.6; x < 3.6; x += 0.6) {
    const a = [x, s * (h.halfw(x, 1.0) - 0.05), h.sheerAt(x) + 0.32], b = [x + 0.6, s * (h.halfw(x + 0.6, 1.0) - 0.05), h.sheerAt(x + 0.6) + 0.32];
    parts.push(capsule(a, b, 0.016, rl));
  }
  // The mast forward of the wheelhouse, a yard, and the red pennant.
  const mw = wood('#a07848', { grain: 'z' });
  parts.push(capsule([0.6, 0, deckZ], [0.6, 0, 4.0], 0.05, mw));
  parts.push(capsule([0.6, -0.55, 3.2], [0.6, 0.55, 3.2], 0.03, mw));
  parts.push(custom((x, y, z) => {
    const u = x - 0.62, v = z - 3.9;
    const wave = Math.sin(u * 9 + t * 6) * 0.03;
    return Math.max(Math.abs(y - wave) - 0.008, -u, u - 0.6, Math.abs(v) - 0.11 * (1 - u / 0.6)) * 0.8;
  }, [0.6, -0.1, 3.75, 1.25, 0.1, 4.05], mat('#d03838', { tag: 'prop', spec: 0.05 })));
  // Mooring cleats and a coiled line on the foredeck; a crate as cargo.
  parts.push(move(torus(0.14, 0.03, hemp()), 3.0, 0.2, deckZ + 0.06), move(torus(0.08, 0.028, hemp()), 3.0, 0.2, deckZ + 0.11));
  parts.push(place(crateBox(5, 0.9), { at: [1.6, -0.4, deckZ + 0.02], rz: 0.2 }));
  const bob = Math.sin(t * PI * 2) * 0.03;
  return place(union(parts), { at: [0, 0, 0], rx: bob * 0.6, s: 1 });
}

// ---------------------------------------------------------------------------
// The Prow Light (4×4): white tower with two red bands, door south, gallery,
// glazed lantern with the brass lamp, verdigris cap.

export function lighthouse({ t = 0 } = {}) {
  const r0 = 1.55, r1 = 1.12, top = 7.0;
  const rAt = (z) => r0 + (r1 - r0) * (z / top);
  const pl = plaster('#f0eee6', { axis: 'xy' });
  const red = hex('#c04440');
  const towerM = mat((x, y, z, lx, ly, lz, nx, ny, nz) => {
    const c = pl.color(x, y, z, lx, ly, lz, nx, ny, nz);
    const band = (z > 2.5 && z < 3.3) || (z > 5.2 && z < 6.0);
    return band ? tint(red, 0.92 + fbm(x * 6, y * 6, z * 6, 2) * 0.12) : c;
  }, { tag: 'wall', spec: 0.03 });
  let tower = frustum(r0, r1, 0.3, top, towerM, 0.02);
  // Door (south) and small windows: openings cut into the tower.
  const cutM = plaster('#d8d4cc', { tag: 'wall' });
  const doorCut = union(boxAt(-0.42, 0.9, 0.3, 0.42, 2.0, 2.1, null), place(cylinder(0.42, -0.6, 0.6, null), { at: [0, 1.4, 2.1], rx: PI / 2 }));
  const winCuts = [];
  for (const [a, z] of [[PI * 0.62, 3.9], [PI * 0.38, 6.4], [PI * 0.05, 4.6]]) {
    const r = rAt(z);
    winCuts.push(place(union(boxAt(-0.17, -0.4, -0.3, 0.17, 0.4, 0.2, null), place(cylinder(0.17, -0.4, 0.4, null), { at: [0, 0, 0.2], rx: PI / 2 })), { at: [Math.cos(a) * r, Math.sin(a) * r, z], rz: a - PI / 2 }));
  }
  tower = subtract(tower, union(doorCut, ...winCuts), cutM);
  const parts = [tower];
  // Plinth.
  parts.push(cylinder(r0 + 0.2, 0, 0.32, ashlar({ course: 0.32, block: 0.6, tag: 'wall' }), 0.03));
  // The door: planked oak in the arch, iron strap hinges, a stone step.
  const plank = mat((x, y, z, lx) => tint(hex('#8a5a34'), (((x + 2) * 8) % 1 < 0.1 ? 0.7 : 0.95) + vnoise(x * 40, z * 3) * 0.12), { tag: 'wall', spec: 0.12 });
  parts.push(intersect(boxAt(-0.42, 1.2, 0.3, 0.42, 1.32, 2.6, plank), union(boxAt(-0.42, 0, 0.3, 0.42, 2, 2.1, plank), place(cylinder(0.42, -1, 3, plank), { at: [0, 0, 2.1], rx: PI / 2 }))));
  for (const z of [0.7, 1.7]) parts.push(boxAt(-0.38, 1.31, z, 0.05, 1.34, z + 0.05, iron('#2a2a34')));
  parts.push(place(torus(0.04, 0.009, iron()), { at: [0.25, 1.34, 1.25], rx: PI / 2 }));
  parts.push(boxAt(-0.6, 1.35, 0, 0.6, 1.85, 0.3, limestone('#d8c8a8', { tag: 'wall' }), 0.02));
  // Window glass set back in the openings.
  for (const [a, z] of [[PI * 0.62, 3.9], [PI * 0.38, 6.4], [PI * 0.05, 4.6]]) {
    const r = rAt(z) - 0.14;
    parts.push(place(boxAt(-0.17, -0.03, -0.3, 0.17, 0.03, 0.35, glass({ z0: -0.3, h: 0.6 })), { at: [Math.cos(a) * r, Math.sin(a) * r, z], rz: a - PI / 2 }));
  }
  // The gallery: a stone slab on corbels, an iron railing.
  parts.push(cylinder(r1 + 0.42, top, top + 0.16, limestone('#e0d4bc', { tag: 'wall' }), 0.03));
  for (let i = 0; i < 12; i++) { const a = (i / 12) * PI * 2; parts.push(move(roundCone([0, 0, top - 0.35], [0, 0, top], 0.05, 0.1, limestone('#d4c4a8', { tag: 'wall' })), Math.cos(a) * (r1 + 0.18), Math.sin(a) * (r1 + 0.18), 0)); }
  const railM = iron('#2a3038');
  const rr = r1 + 0.36;
  for (let i = 0; i < 16; i++) { const a = (i / 16) * PI * 2; parts.push(capsule([Math.cos(a) * rr, Math.sin(a) * rr, top + 0.16], [Math.cos(a) * rr, Math.sin(a) * rr, top + 0.95], 0.018, railM)); }
  parts.push(move(torus(rr, 0.025, railM), 0, 0, top + 0.95), move(torus(rr, 0.015, railM), 0, 0, top + 0.55));
  // The lantern: a low drum, glazing in iron mullions with the lamp seen through it, the cap.
  const lz0 = top + 0.16, lz1 = lz0 + 0.4, gz1 = lz1 + 1.15, lr = 0.82;
  parts.push(cylinder(lr + 0.04, lz0, lz1, plaster('#ecebe4', { tag: 'wall' }), 0.02));
  const lamp = (x, y, z) => {
    // The brass lamp: a beehive of lens rings on a pedestal, glowing warm.
    const r = Math.hypot(x, y), zc = lz1 + 0.55;
    if (z < lz1 + 0.12 && r < 0.18) return hex('#8a6a30');
    const bee = Math.hypot(r / 0.4, (z - zc) / 0.5);
    if (bee < 1) return ((z - zc + 2) * 14) % 1 < 0.35 ? hex('#f8d060') : hex('#fff4c8');
    return null;
  };
  // (The see-through glazing rendered nearly black; the lamp is painted into the glass instead:
  // sky reflected high, the brass lamp's warm beehive glowing behind the panes in the middle.)
  void lamp;
  const glazing = mat((x, y, z) => {
    const t = clamp((z - lz1) / 1.15, 0, 1);
    let c = mix(hex('#6a809c'), hex('#c4d4e4'), t * 0.7);
    const bee = Math.abs(z - (lz1 + 0.55)) / 0.42;
    if (bee < 1) c = mix(c, ((z - lz1) * 14) % 1 < 0.35 ? hex('#f0c050') : hex('#fff0c0'), (1 - bee * bee) * 0.75);
    return c;
  }, { tag: 'wall', spec: 1.0, shin: 50, emit: 0.35 });
  parts.push(cylinder(lr - 0.02, lz1, gz1, glazing));
  for (let i = 0; i < 10; i++) { const a = (i / 10) * PI * 2 + 0.15; parts.push(capsule([Math.cos(a) * lr, Math.sin(a) * lr, lz1], [Math.cos(a) * lr, Math.sin(a) * lr, gz1], 0.025, railM)); }
  parts.push(move(torus(lr, 0.03, railM), 0, 0, lz1 + 0.58));
  const verd = bronze('#5a8a70');
  parts.push(cylinder(lr + 0.12, gz1, gz1 + 0.1, verd, 0.03));
  parts.push(intersect(move(ellipsoid(lr + 0.08, lr + 0.08, 0.6, verd), 0, 0, gz1 + 0.08), boxAt(-2, -2, gz1 + 0.08, 2, 2, gz1 + 1, verd)));
  parts.push(move(sphere(0.14, verd), 0, 0, gz1 + 0.72), capsule([0, 0, gz1 + 0.8], [0, 0, gz1 + 1.15], 0.02, verd));
  void t;
  return union(parts);
}

// ---------------------------------------------------------------------------
// The Bilge

/** A fish stall (2×2): trestle table at the front with fish on ice, a striped awning on four poles. */
export function fishStall({ stripe = '#d05848', seed = 1 } = {}) {
  const R = rng(seed);
  const tw = wood('#9a7048', { grain: 'x' }), leg = wood('#7a5636', { grain: 'z' });
  const parts = [];
  // Trestles and top (front row).
  const ty0 = 0.15, ty1 = 0.85, tz = 0.82;
  parts.push(boxAt(-0.92, ty0, tz - 0.05, 0.92, ty1, tz, tw, 0.012));
  for (const x of [-0.75, 0.75]) {
    parts.push(capsule([x, ty0 + 0.05, 0], [x, (ty0 + ty1) / 2, tz - 0.05], 0.025, leg), capsule([x, ty1 - 0.05, 0], [x, (ty0 + ty1) / 2, tz - 0.05], 0.025, leg));
  }
  // A tray of crushed ice with fish laid in rows.
  const ice = mat((x, y, z) => tint(hex('#e4f0f2'), 0.82 + vnoise(x * 60, y * 60, z * 60) * 0.25), { tag: 'prop', spec: 0.9, shin: 40 });
  parts.push(boxAt(-0.86, ty0 + 0.03, tz, 0.86, ty1 - 0.03, tz + 0.06, wood('#b89060', { grain: 'x' }), 0.01));
  parts.push(custom((x, y, z) => Math.max((z - (tz + 0.07 + vnoise(x * 30, y * 30) * 0.02)) * 0.7, Math.abs(x) - 0.82, Math.abs(y - (ty0 + ty1) / 2) - 0.3, tz + 0.02 - z), [-0.82, ty0 + 0.05, tz, 0.82, ty1 - 0.05, tz + 0.1], ice));
  const fishCols = ['#a8b8c8', '#c0c8d0', '#d06a58', '#8a98a8'];
  for (let i = 0; i < 9; i++) {
    const x = -0.7 + (i % 5) * 0.34 + (R() - 0.5) * 0.05, y = ty0 + 0.2 + Math.floor(i / 5) * 0.28;
    const c = hex(fishCols[Math.floor(R() * fishCols.length)]);
    const fm = mat((px, py, pz, lx, ly, lz) => mix(tint(c, 0.7), tint(c, 1.15), clamp(lz * 20 + 0.5, 0, 1)), { tag: 'prop', spec: 1.0, shin: 50 });
    const a = (R() - 0.5) * 0.5 + PI / 2;
    parts.push(place(union(ellipsoid(0.12, 0.04, 0.03, fm), move(ellipsoid(0.04, 0.035, 0.012, fm), -0.14, 0, 0), move(sphere(0.008, mat('#141018', { tag: 'prop' })), 0.09, 0.02, 0.012)), { at: [x, y, tz + 0.1], rz: a }));
  }
  // A basket of fish on the ground, and a hand scale hanging from the front pole.
  parts.push(move(subtract(frustum(0.16, 0.2, 0, 0.24, wood('#b89458', { grain: 'z' }), 0.02), cylinder(0.17, 0.05, 0.4, null)), -0.55, 0.05, 0));
  // Poles and the awning: sloping down to the front, striped along the slope, a scalloped valance.
  const pole = wood('#8a6a48', { grain: 'z' });
  const zb = 2.3, zf = 1.95, yb = -0.92, yf = 0.95;
  for (const x of [-0.95, 0.95]) for (const [y, z] of [[yb, zb], [yf, zf]]) parts.push(capsule([x, y, 0], [x, y, z], 0.03, pole));
  const st = hex(stripe), wh = hex('#f2ece0');
  const canvas = mat((x, y, z) => {
    const s = Math.floor((x + 2) * 5) % 2;
    return tint(s ? st : wh, 0.92 + vnoise(x * 20, y * 20) * 0.1);
  }, { tag: 'prop', spec: 0.05, emit: 0.12 });
  const slope = (zb - zf) / (yf - yb);
  parts.push(custom((x, y, z) => {
    const top = zb - (y - yb) * slope + Math.sin((x + 2) * PI * 5) * 0.012 + Math.sin(y * 4) * 0.02;
    return Math.max(Math.abs(z - top) - 0.015, Math.abs(x) - 1.02, Math.abs(y - (yb + yf) / 2) - (yf - yb) / 2 - 0.08) * 0.8;
  }, [-1.04, yb - 0.1, zf - 0.05, 1.04, yf + 0.1, zb + 0.1], canvas));
  // Valance along the front, scalloped.
  parts.push(custom((x, y, z) => {
    const hem = zf - 0.24 + Math.abs(Math.sin((x + 2) * PI * 5)) * 0.08;
    return Math.max(Math.abs(y - yf - 0.08) - 0.012, Math.abs(x) - 1.02, z - zf + 0.02, hem - z);
  }, [-1.04, yf, zf - 0.35, 1.04, yf + 0.12, zf], canvas));
  // A chalk price slate leaning on the table leg.
  parts.push(place(boxAt(-0.13, -0.01, 0, 0.13, 0.01, 0.32, mat('#2c3038', { tag: 'prop' }), 0.01), { at: [0.55, ty1 + 0.12, 0.02], rx: -0.25 }));
  return union(parts);
}

/** A mooring post (1×1): a squat oak post in a stone collar, rope-worn at the waist, an iron band. */
export function mooringPost() {
  const oak = mat((x, y, z, lx, ly, lz) => {
    const g = vnoise(Math.atan2(ly, lx) * 8, lz * 4, 2);
    const worn = lz > 0.45 && lz < 0.62 ? 1.12 : 1;
    return tint(hex('#7a5a40'), (0.82 + g * 0.2) * worn);
  }, { tag: 'prop', spec: 0.2, shin: 20 });
  const waist = custom((x, y, z) => {
    let r = 0.15;
    if (z > 0.42 && z < 0.64) r -= Math.sin(((z - 0.42) / 0.22) * PI) * 0.035;
    r += Math.sin(z * 90) * 0.003;
    const dr = Math.hypot(x, y) - r;
    const dz = Math.max(-z, z - 0.78);
    return Math.max(dr, dz) * 0.9;
  }, [-0.16, -0.16, 0, 0.16, 0.16, 0.8], oak);
  return union(
    waist,
    move(ellipsoid(0.15, 0.15, 0.07, oak), 0, 0, 0.78),
    move(torus(0.152, 0.018, ironPaint('#3a3a44')), 0, 0, 0.22),
    cylinder(0.26, 0, 0.08, limestone('#c8b898', { tag: 'prop' }), 0.03),
  );
}

/**
 * The Water Stairs, one 4-wide row: limestone steps going down south, end
 * blocks with rounded coping either side. part 'top' (row 6: quay level 0
 * down to −0.45) or 'wet' (row 7: −0.45 on down under the canal at −0.6).
 * `t` animates the water.
 */
const WS = { rise: 0.15, run: 1 / 3, water: -0.6 };
function wsTop(y) { // the tread height at y, for the whole two-row flight (row 6 spans y −0.5..0.5; row 7 is +1)
  const i = Math.floor((y + 0.5) / WS.run);
  return -WS.rise * Math.max(0, i);
}
export function waterStairs(part = 'top', { t = 0 } = {}) {
  const oy = part === 'top' ? 0 : 1; // this row's offset in the flight
  const stone = mat((x, y, z, lx, ly, lz) => {
    const n = fbm(x * 7, y * 7, z * 7, 3);
    const c = mix(hex('#d8c8a8'), hex('#cbb898'), hash3(Math.floor((x + 3) * 1.2), Math.floor((y + 3) * 3), 4));
    let col = tint(c, 0.88 + n * 0.16);
    // Wet and weedy low down.
    const wet = clamp((-0.3 - z) / 0.3, 0, 1);
    col = mix(col, hex('#6a7a60'), wet * 0.55);
    return col;
  }, { tag: 'floor', spec: 0.08, shin: 14 });
  const nose = mat('#ece2cc', { tag: 'floor', spec: 0.06 });
  const parts = [];
  for (let i = 0; i < 3; i++) {
    const y0 = -0.5 + i * WS.run, top = wsTop(y0 + oy + 0.001);
    parts.push(boxAt(-1.75, y0, -2, 1.75, y0 + WS.run + 0.001, top, stone, 0.01));
    if (top > WS.water) parts.push(boxAt(-1.75, y0 + WS.run - 0.03, top - 0.03, 1.75, y0 + WS.run, top, nose, 0.01));
  }
  // End blocks: a cheek wall each side, coping sloping with the steps.
  const cope = limestone('#e6dcc4', { tag: 'wall' });
  const cheek = ashlar({ course: 0.3, block: 0.45, tones: ['#ccb896', '#dcc8a6'], tag: 'wall' });
  for (const s of [-1, 1]) {
    const x0 = s < 0 ? -2 : 1.75, x1 = s < 0 ? -1.75 : 2;
    const topAt = (y) => 0.38 - (y + oy + 0.5) * 0.3;
    parts.push(custom((x, y, z) => Math.max(x0 - x, x - x1, -0.5 - y, y - 0.5, z - topAt(y), -2 - z), [x0, -0.5, -2, x1, 0.5, 0.4], cheek));
    parts.push(custom((x, y, z) => Math.max(Math.hypot(Math.max(x0 - 0.03 - x, x - x1 - 0.03, 0), z - topAt(y) - 0.02) - 0.05, Math.abs(y) - 0.5), [x0 - 0.1, -0.5, -1, x1 + 0.1, 0.5, 0.5], cope));
    if (part === 'top') parts.push(boxAt(x0 - 0.02, -0.5, 0.38, x1 + 0.02, -0.25, 0.5, cope, 0.04)); // a newel cap at the head
  }
  // Keep only what shows: this row's treads down to where the next row (or the water) takes over.
  const zmin = part === 'top' ? -0.46 : WS.water - 0.03;
  let scene = intersect(union(parts), boxAt(-2.1, -0.5, zmin, 2.1, 0.5, 1, stone));
  if (part === 'wet') {
    // The canal's surface over the lower steps, which show through, darker with depth.
    const wm = water({ t });
    const under = (x, y, z) => {
      if (Math.abs(x) > 1.75) return z < 0.38 - (y + 1.5) * 0.3 ? hex('#5a6a58') : null;
      const top = wsTop(y + 1);
      if (z > top) return null;
      const d = clamp((WS.water - z) / 0.9, 0, 1);
      return mix(hex('#8a9a78'), hex('#183848'), d);
    };
    const surf = seeThrough((x, y, z, lx, ly, lz, nx, ny, nz) => wm.color(x, y, z, lx, ly, lz, nx, ny, nz), under, { k: 0.5, depth: 1.6, steps: 40, tag: 'floor', spec: 1.4, shin: 90, fallback: '#183848' });
    const ripple = (x, y) => (vnoise(x * 9 + t * 6, y * 9, t * 3) - 0.5) * 0.008;
    // The water starts where the steps go under; a line of foam lapping at the edge.
    const surfNode = custom((x, y, z) => Math.max((z - WS.water - ripple(x, y)) * 0.8, WS.water - 0.05 - z, Math.abs(x) - 2, Math.abs(y) - 0.5), [-2, -0.5, WS.water - 0.06, 2, 0.5, WS.water + 0.02], surf);
    scene = union(subtract(scene, boxAt(-1.75, -0.5, -3, 1.75, 0.5, WS.water, null)), surfNode);
  }
  return scene;
}

// ---------------------------------------------------------------------------
// The Goat Path

const earthTones = ['#9a6c52', '#a6785a', '#8a624c'];

/** Goat-worn terra rossa earth with limestone chips and grit (floor tile). variant: 'a', 'b', 'c' (scuffed). */
export function pathEarth({ variant = 'a' } = {}) {
  const seed = { a: 1, b: 2, c: 3 }[variant];
  const chips = (x, y) => voronoi((x + 0.5) * 6, (y + 0.5) * 6, 6, 0.9, seed);
  const isChip = (x, y) => { const v = chips(x, y); return v.id > 0.84 && v.f1 < 0.16 + (v.id - 0.84) * 1.2 + (vnoise(x * 30, y * 30, seed) - 0.5) * 0.06; };
  const f = (x, y) => {
    let h = -0.02 + (fbm((x + 0.5) * 3, (y + 0.5) * 3, seed, 2, 3) - 0.5) * 0.02;
    if (isChip(x, y)) h += 0.012;
    // Two hoof-worn ruts (the scuffed variant).
    if (variant === 'c') h -= Math.exp(-Math.pow((x - y * 0.3 - 0.12) / 0.07, 2)) * 0.01;
    return h;
  };
  const m = mat((x, y, z) => {
    const n = fbm((x + 0.5) * 10, (y + 0.5) * 10, seed + 4, 3, 10);
    const tone = hex(earthTones[Math.floor(vnoise((x + 0.5) * 2, (y + 0.5) * 2, seed, 2) * 3) % 3]);
    let c = tint(tone, 0.86 + n * 0.22);
    if (isChip(x, y)) c = tint(hex('#c4b8a0'), 0.85 + n * 0.15);
    if (vnoise((x + 0.5) * 40, (y + 0.5) * 40, seed, 40) > 0.82) c = tint(c, 0.8);
    if (variant === 'c') c = mix(c, hex('#c0886a'), Math.exp(-Math.pow((x - y * 0.3 - 0.12) / 0.09, 2)) * 0.35);
    return c;
  }, { tag: 'floor', spec: 0.03, shin: 8 });
  return heightfield(f, m);
}

/** Bare limestone shelf: pale, cracked (karst), with lichen spots (floor tile). */
export function rockShelf({ seed = 5 } = {}) {
  const cell = (x, y) => voronoi((x + 0.5) * 2.5, (y + 0.5) * 2.5, 0, 0.9, seed);
  const f = (x, y) => { const v = cell(x, y); return -0.02 + sstep(0, 0.08, v.f2 - v.f1) * 0.02 + (fbm(x * 6, y * 6, seed, 2) - 0.5) * 0.015; };
  const m = mat((x, y, z) => {
    const v = cell(x, y), e = v.f2 - v.f1;
    const n = fbm(x * 12, y * 12, seed, 3);
    let c = tint(mix(hex('#d4ccbc'), hex('#c4bca8'), v.id), 0.88 + n * 0.16);
    if (e < 0.03) c = tint(c, 0.6);
    const li = vnoise(x * 18 + 3, y * 18, seed);
    if (li > 0.8) c = mix(c, hex('#c8b048'), 0.5);
    else if (li < 0.12) c = mix(c, hex('#8a9a80'), 0.4);
    return c;
  }, { tag: 'floor', spec: 0.04, shin: 8 });
  return heightfield(f, m);
}

/** Rough cut steps down south across one tile (z = 1 at the north edge, 0 at the south), earth on the treads. */
export function pathSteps({ seed = 2 } = {}) {
  const steps = 4, run = 1 / steps, rise = 1 / steps;
  const rock = mat((x, y, z) => {
    const n = fbm(x * 9, y * 9, z * 9 + seed, 3);
    return tint(hex('#c8bea8'), 0.82 + n * 0.22);
  }, { tag: 'floor', spec: 0.04 });
  const earth = mat((x, y, z) => tint(hex('#9a6c52'), 0.85 + fbm(x * 14, y * 14, seed, 2) * 0.2), { tag: 'floor', spec: 0.03 });
  return custom((x, y, z) => {
    const i = clamp(Math.floor((y + 0.5) / run), 0, steps - 1);
    // Irregular nosings and tread tops.
    const edge = -0.5 + (i + 1) * run + (vnoise(x * 6, i * 3, seed) - 0.5) * 0.08;
    const top = 1 - i * rise + (vnoise(x * 5, y * 5, seed + i) - 0.5) * 0.03;
    const below = y > edge ? 1 - (i + 1) * rise : top;
    const h = y > edge ? Math.max(below, top - (y - edge) * 6) : top;
    return Math.max((z - h) * 0.5, -z - 0.05, Math.abs(x) - 0.5, Math.abs(y) - 0.5);
  }, [-0.5, -0.5, -0.05, 0.5, 0.5, 1.05], mat((x, y, z, lx, ly, lz, nx, ny, nz) => (nz > 0.8 && fbm(x * 7, y * 7, seed, 2) > 0.62 ? earth : rock).color(x, y, z, lx, ly, lz, nx, ny, nz), { tag: 'floor', spec: 0.04 }));
}

// periodic: noise over (x + y, z) repeating every unit, for pieces that tile along a face and stack in courses.
const rockMat = (seed = 1, base = '#bfb49c', periodic = false) => mat((x, y, z, lx, ly, lz, nx, ny, nz) => {
  const n = periodic ? fbm((x + y) * 6 + seed * 6, z * 6, 0, 3, 6) : fbm(x * 6 + seed, y * 6, z * 6, 3);
  let c = tint(hex(base), 0.84 + n * 0.22);
  // Bedding lines, lichen on the tops, a dark wet streak here and there.
  if (((z + n * 0.15) * 7) % 1 < 0.07) c = tint(c, 0.78);
  const li = periodic ? vnoise((x + y) * 14 + seed * 14, z * 14, 0, 14) : vnoise(x * 14, y * 14, z * 14 + seed);
  if (nz > 0.3 && li > 0.8) c = mix(c, hex('#c0a848'), 0.45);
  else if (li < 0.14) c = mix(c, hex('#7a8a6a'), 0.45);
  return c;
}, { tag: 'prop', spec: 0.05, shin: 10 });

/** Rock displaced by noise: a rough version of a node. */
function rough(node, amp = 0.06, freq = 5) {
  return {
    b: node.b.map((v, i) => (i < 3 ? v - amp : v + amp)),
    dist(x, y, z) { return (node.dist(x, y, z) + (fbm(x * freq, y * freq, z * freq, 3) - 0.5) * amp * 2) * 0.8; },
    near(x, y, z) { return node.near(x, y, z); },
  };
}

/**
 * A rock face, one tile wide and one course (40 px) tall: face 's' (its south face) or 'e' (its
 * east face). The rock runs past the tile's ends and is clipped at them, and its roughness repeats
 * every tile along the face and every course up it, so neighbors and stacked courses meet without
 * a seam. (It used to stop short of the tile's far end, and the sea showed through the gap.)
 */
export function cliffFace({ face = 's', seed = 3 } = {}) {
  const amp = 0.07, f = 6;
  const box = face === 's' ? boxAt(-0.7, -0.7, -0.2, 0.7, 0.42, 1.2, rockMat(seed, '#c4bca6', true), 0.04) : boxAt(-0.7, -0.7, -0.2, 0.42, 0.7, 1.2, rockMat(seed, '#c4bca6', true), 0.04);
  const r = {
    b: box.b.map((v, i) => (i < 3 ? v - amp : v + amp)),
    // (x + y) and z, each periodic over one unit (fbm's period wraps its first two arguments).
    dist(x, y, z) { return (box.dist(x, y, z) + (fbm((x + y) * f, z * f, 0, 3, f) - 0.5) * amp * 2) * 0.8; },
    near(x, y, z) { return box.near(x, y, z); },
  };
  return intersect(r, boxAt(-0.5, -0.5, 0, 0.5, 0.5, 1, rockMat(seed, '#c4bca6', true)));
}

/** A lichened limestone outcrop: 'a' (1×1, a waist-high boulder) or 'b' (2×1, a long ledge of rock). */
export function rockOutcrop(kind = 'a') {
  const m = rockMat(kind === 'a' ? 2 : 6);
  if (kind === 'a') return rough(smooth(0.15, move(ellipsoid(0.42, 0.36, 0.34, m), 0, 0, 0.22), move(ellipsoid(0.26, 0.24, 0.3, m), -0.12, 0.08, 0.5), move(ellipsoid(0.2, 0.2, 0.14, m), 0.24, 0.16, 0.08)), 0.07, 5);
  return rough(smooth(0.2, move(ellipsoid(0.8, 0.38, 0.3, m), 0, 0, 0.18), move(ellipsoid(0.45, 0.3, 0.36, m), -0.35, -0.05, 0.38), move(ellipsoid(0.3, 0.25, 0.2, m), 0.55, 0.12, 0.12)), 0.08, 4);
}

/** A bush: gorse ('gorse', spiky dark green with yellow flowers) or thyme (a low grey-green cushion with mauve flowers). */
export function bush(kind = 'gorse', seed = 1) {
  const R = rng(seed);
  const g = kind === 'gorse';
  const lf = mat((x, y, z) => {
    const n = vnoise(x * 40, y * 40, z * 40), c = vnoise(x * 5, y * 5, z * 5);
    const fl = vnoise(x * 22 + seed, y * 22, z * 22);
    if (fl > (g ? 0.72 : 0.78)) return hex(g ? '#f0c830' : '#b088b8');
    return tint(hex(g ? '#3e6a30' : '#7a9070'), 0.7 + n * 0.4 + c * 0.15);
  }, { tag: 'leaf', spec: 0.1 });
  const blobs = [];
  const n = g ? 9 : 6;
  for (let i = 0; i < n; i++) {
    const a = R() * PI * 2, rr = R() * (g ? 0.22 : 0.16);
    blobs.push(move(sphere((g ? 0.17 : 0.12) + R() * 0.07, lf), Math.cos(a) * rr, Math.sin(a) * rr, (g ? 0.22 : 0.06) + R() * (g ? 0.18 : 0.04)));
  }
  const s = smooth(0.1, blobs);
  return intersect({
    b: s.b.map((v, i) => (i < 3 ? v - 0.06 : v + 0.06)),
    dist(x, y, z) { return s.dist(x, y, z) + (vnoise(x * 30, y * 30, z * 30) - 0.5) * (g ? 0.09 : 0.05); },
    near(x, y, z) { return s.near(x, y, z); },
  }, boxAt(-1, -1, 0, 1, 1, 1.2, lf));
}

/** The path's post-and-rope rail: a post at the tile's center and the rope sagging to the tile's edges along 'x' or 'y' (or none). */
export function rail(dir = null) {
  const w = wood('#8a6a48', { grain: 'z' });
  const parts = [
    boxAt(-0.045, -0.045, 0, 0.045, 0.045, 0.95, w, 0.015),
    move(cylinder(0.12, 0, 0.05, rockMat(4), 0.02), 0, 0, 0),
    move(torus(0.05, 0.016, hemp()), 0, 0, 0.88),
  ];
  if (dir) {
    for (const s of [-1, 1]) {
      const pts = [0, 0.15, 0.3, 0.5].map((u) => [u * s, 0, 0.88 - Math.sin(u * PI) * 0.1 - u * 0.12]);
      for (let i = 0; i < 3; i++) {
        const a = pts[i], b = pts[i + 1];
        parts.push(dir === 'x' ? capsule(a, b, 0.016, hemp()) : capsule([a[1], a[0], a[2]], [b[1], b[0], b[2]], 0.016, hemp()));
      }
    }
  }
  return union(parts);
}

/** Mott's shack (4×4): plank walls, a patched corrugated tin roof sloping south, a window with the still's copper coil, the door at x −0.5 with its sign. */
export function mottShack({ glint = 0 } = {}) {
  const H = 2.1, hw = 1.85, hd = 1.7;
  const planks = mat((x, y, z, lx, ly, lz, nx, ny, nz) => {
    const u = Math.abs(ny) > Math.abs(nx) ? x : y;
    const p = Math.floor((u + 5) * 5.5), fp = ((u + 5) * 5.5) % 1;
    const c = mix(hex('#8a6440'), hex('#a8805a'), hash3(p, 3, 1));
    let col = tint(c, 0.82 + vnoise(u * 20, z * 3, p) * 0.25);
    if (fp < 0.07) col = tint(col, 0.5);
    if (z < 0.25) col = mix(col, hex('#5a4434'), (0.25 - z) * 2);
    return col;
  }, { tag: 'wall', spec: 0.05 });
  const parts = [boxAt(-hw, -hd, 0, hw, hd, H, planks)];
  // Window (south, x +0.5): glass through which the copper still glints.
  const coil = (x, y, z) => {
    const cx = 0.0, cy = hd - 0.5, cz = 0.85;
    const r = Math.hypot(x - cx, y - cy);
    const helix = Math.abs(r - 0.16) < 0.04 && Math.abs((((z - cz) * 12 + Math.atan2(y - cy, x - cx) / (2 * PI)) % 1 + 1) % 1 - 0.5) < 0.2 && Math.abs(z - cz) < 0.22;
    if (helix) {
      const k = 0.7 + 0.5 * Math.max(0, Math.cos((z - cz) * 20 + glint * PI * 2 + Math.atan2(y - cy, x - cx)));
      return tint(hex('#d88040'), k);
    }
    if (r < 0.1 && Math.abs(z - cz - 0.05) < 0.25) return hex('#a85a2a');
    if (y < hd - 1.1) return hex('#2a2024');
    return null;
  };
  const winM = seeThrough(mat((x, y, z) => mix(hex('#283040'), hex('#708ab0'), clamp((z - 1.0) / 0.5, 0, 1) * 0.4)), coil, { k: 0.3, depth: 1.6, steps: 50, tag: 'wall', emit: 0.25 });
  parts[0] = subtract(parts[0], boxAt(0.2, hd - 0.1, 0.95, 0.8, hd + 0.1, 1.5, null), wood('#6a4a30', { grain: 'z' }));
  parts.push(boxAt(0.2, hd - 0.06, 0.95, 0.8, hd - 0.04, 1.5, winM));
  parts.push(boxAt(0.17, hd - 0.02, 0.9, 0.83, hd + 0.08, 0.95, wood('#7a5a3a', { grain: 'x' }), 0.01));
  parts.push(boxAt(0.48, hd - 0.05, 0.95, 0.52, hd - 0.03, 1.5, wood('#6a4a30', { grain: 'z' })));
  // Door (south, x −0.5): planks, a crooked painted sign.
  const doorM = mat((x, y, z) => tint(hex('#6e4c30'), ((x + 5) * 9 % 1 < 0.1 ? 0.6 : 0.9) + vnoise(x * 30, z * 3) * 0.15), { tag: 'wall', spec: 0.08 });
  parts.push(boxAt(-0.85, hd, 0, -0.15, hd + 0.05, 1.9, doorM, 0.01));
  const L1 = lettering('GONE', 0.035), L2 = lettering('FERRYING', 0.035);
  const signM = mat((x, y, z) => {
    let c = tint(hex('#e8dcc0'), 0.92 + vnoise(x * 20, z * 20) * 0.1);
    if (L1.hit(x + 0.5 + L1.width / 2, 1.62 - z) || L2.hit(x + 0.5 + L2.width / 2, 1.43 - z)) c = hex('#2a2430');
    if (z < 1.24 && z > 1.2 && x > -0.72 && x < -0.3) c = hex('#6a3030'); // (NOT REALLY), scrawled under
    return c;
  }, { tag: 'wall', spec: 0.04 });
  parts.push(place(boxAt(-0.33, -0.01, -0.25, 0.33, 0.01, 0.25, signM, 0.01), { at: [-0.5, hd + 0.07, 1.4], ry: 0.06 }));
  parts.push(place(boxAt(-0.33, -0.01, -0.25, 0.33, 0.01, 0.25, signM, 0.01), { at: [-0.5, hd + 0.07, 1.4], ry: 0.06 }));
  parts.push(boxAt(-0.95, hd, 0, -0.05, hd + 0.3, 0.08, rockMat(7), 0.02)); // a flat stone for a step
  // The roof: corrugated tin, mono-pitch falling south, overhanging; rust, and two patches.
  const tin = mat((x, y, z) => {
    const r = Math.sin((x + 5) * PI * 9);
    let c = tint(hex('#9aa0a6'), 0.78 + r * 0.12 + vnoise(x * 4, y * 4) * 0.1);
    const rust = fbm(x * 3 + 2, y * 3, 1, 3);
    if (rust > 0.55) c = mix(c, hex('#9a5a34'), Math.min(0.8, (rust - 0.55) * 3));
    if (x > -1.4 && x < -0.5 && y > -0.6 && y < 0.3) c = tint(hex('#c0c8cc'), 0.85 + r * 0.12); // a newer sheet
    if (x > 0.7 && x < 1.5 && y > 0.6 && y < 1.4) c = tint(hex('#4a6a8a'), 0.85 + r * 0.1); // an old painted sign, nailed on
    return c;
  }, { tag: 'roof', spec: 0.5, shin: 26 });
  const zb = H + 0.75, zf = H + 0.1, y0 = -hd - 0.25, y1 = hd + 0.3;
  const sl = (zb - zf) / (y1 - y0);
  parts.push(custom((x, y, z) => {
    const top = zb - (y - y0) * sl + Math.abs(Math.sin((x + 5) * PI * 9)) * 0.025;
    return Math.max((z - top) * 0.8, top - 0.05 - z, Math.abs(x) - hw - 0.25, y0 - y, y - y1);
  }, [-hw - 0.25, y0, zf - 0.1, hw + 0.25, y1, zb + 0.05], tin));
  // Gable fill between the walls and the sloping roof.
  parts.push(custom((x, y, z) => Math.max(Math.abs(x) - hw, Math.abs(y) - hd, H - z, z - (zb - (y - y0) * sl) + 0.04), [-hw, -hd, H, hw, hd, zb], planks));
  // A stovepipe, a rain barrel at the east end.
  parts.push(move(cylinder(0.07, zb - 0.4, zb + 0.7, ironPaint('#3a3a40'), 0.01), -1.2, -0.8, 0));
  parts.push(move(union(cylinder(0.28, 0, 0.75, wood('#7a5a3a', { grain: 'z' }), 0.03), move(torus(0.285, 0.015, iron()), 0, 0, 0.18), move(torus(0.285, 0.015, iron()), 0, 0, 0.58), move(cylinder(0.25, 0.7, 0.72, water({ t: 0 })), 0, 0, 0)), hw + 0.06, 1.2, 0));
  return union(parts);
}

/** Mott's empty square jugs (2×1 along x): stoneware, the top half a darker glaze, little handles and corks; stacked. */
export function jugs() {
  const jug = (seed) => {
    const m = mat((x, y, z, lx, ly, lz) => {
      const n = vnoise(lx * 30, ly * 30, lz * 30 + seed);
      return lz > 0.2 ? tint(hex('#7a5034'), 0.85 + n * 0.2) : tint(hex('#d8c8a4'), 0.88 + n * 0.14);
    }, { tag: 'prop', spec: 0.45, shin: 30 });
    return union(
      boxAt(-0.13, -0.13, 0, 0.13, 0.13, 0.28, m, 0.035),
      move(frustum(0.1, 0.05, 0.27, 0.34, m, 0.01), 0, 0, 0),
      move(cylinder(0.035, 0.33, 0.39, mat('#b08a5a', { tag: 'prop' }), 0.008), 0, 0, 0),
      place(torus(0.045, 0.014, m), { at: [0.1, 0, 0.3], rx: PI / 2 }),
    );
  };
  const parts = [];
  [[-0.66, 0.05, 0, 0.1], [-0.36, -0.04, 0, -0.08], [-0.06, 0.06, 0, 0.12], [0.3, -0.02, 0, 0.0], [0.6, 0.1, 0, -0.15],
    [-0.5, 0.01, 0.28, 0.2], [-0.2, 0.02, 0.28, -0.05], [0.45, 0.04, 0.28, 0.1], [-0.35, 0.02, 0.56, 0.3]].forEach(([x, y, z, a], i) => parts.push(place(jug(i), { at: [x, y, z], rz: a })));
  parts.push(place(jug(11), { at: [0.25, 0.33, 0.13], ry: PI / 2, rz: 0.4 })); // one on its side
  return union(parts);
}

/** The sea cave mouth (1×1, 1.5 tall): an arch in the rock at the waterline, the tide running in, a glint of brass far back. */
export function seaCave({ t = 0, glint = false } = {}) {
  const m = rockMat(9, '#bcb4a0');
  const rock = rough(boxAt(-0.5, -0.5, -0.2, 0.45, 0.45, 1.5, m, 0.05), 0.08, 5);
  const arch = union(boxAt(-0.32, -0.3, -0.5, 0.3, 0.7, 0.6, null), place(cylinder(0.31, -0.3, 0.7, null), { at: [-0.01, 0, 0.6], rx: PI / 2 }));
  const dark = (x, y, z) => {
    if (glint && Math.hypot(x + 0.05, z - 0.15) < 0.05 && y < -0.25) return hex('#f8d060');
    return y < 0.2 ? hex('#0c1018') : null;
  };
  const inside = seeThrough(mat('#101820'), dark, { k: 0.2, depth: 1, steps: 20, tag: 'wall', emit: glint ? 0.6 : 0, spec: 0 });
  const back = boxAt(-0.35, -0.42, -0.2, 0.35, -0.3, 1.0, inside);
  const wm = water({ t, scale: 7, glint: 0.72 });
  const sea = custom((x, y, z) => Math.max(z - 0.0 - (vnoise(x * 8 + t * 6, y * 8, t * 2) - 0.5) * 0.02, -0.1 - z, Math.abs(x) - 0.5, y - 0.5, -0.3 - y), [-0.5, -0.3, -0.1, 0.5, 0.5, 0.03], wm);
  return intersect(union(subtract(rock, arch, rockMat(10, '#8a8274')), back, sea), boxAt(-0.5, -0.5, -0.1, 0.5, 0.5, 1.7, m));
}

// ---------------------------------------------------------------------------
// Goats

/**
 * A goat facing +x, about 0.75 m at the shoulder. pose: 'stand', 'walk' (phase
 * 0–1), 'eat' (head down; chew 0/1). brown: the second goat's coat.
 */
export function goat({ pose = 'stand', phase = 0, chew = 0, brown = false } = {}) {
  const coat = hex(brown ? '#8a5a38' : '#ece6d8'), coatDark = hex(brown ? '#5a3a28' : '#c8c0b4');
  const fur = mat((x, y, z, lx, ly, lz) => {
    const n = vnoise(lx * 40, ly * 40, lz * 25);
    let c = tint(coat, 0.86 + n * 0.2);
    if (brown && lz > 0.58 && Math.abs(ly) < 0.05) c = tint(coatDark, 1); // dorsal stripe
    return c;
  }, { tag: 'figure', spec: 0.05, shin: 8 });
  const hoof = mat('#3a2e2c', { tag: 'figure', spec: 0.3 });
  const horn = mat('#9a8c78', { tag: 'figure', spec: 0.3, shin: 20 });
  const eye = mat('#2a1c14', { tag: 'figure', spec: 0.8 });
  const parts = [];
  const bodyZ = 0.55;
  parts.push(move(ellipsoid(0.36, 0.17, 0.17, fur), 0, 0, bodyZ));
  parts.push(move(ellipsoid(0.16, 0.16, 0.18, fur), 0.2, 0, bodyZ + 0.02)); // chest
  parts.push(move(ellipsoid(0.15, 0.15, 0.16, fur), -0.22, 0, bodyZ + 0.01)); // rump
  // Legs: thigh and shank, swinging in the walk (diagonal pairs together).
  const legs = [[0.24, 0.09, 0], [0.24, -0.09, 0.5], [-0.24, 0.09, 0.5], [-0.24, -0.09, 0]];
  for (const [lx, ly, off] of legs) {
    const sw = pose === 'walk' ? Math.sin((phase + off) * PI * 2) * 0.32 : 0;
    const lift = pose === 'walk' ? Math.max(0, Math.cos((phase + off) * PI * 2)) * 0.06 : 0;
    const hip = [lx, ly, bodyZ - 0.05], knee = [lx + Math.sin(sw) * 0.2, ly, bodyZ - 0.28 + lift * 0.5];
    const foot = [knee[0] + Math.sin(sw * 0.5) * 0.06 - (lx < 0 ? 0.03 : 0), ly, 0.04 + lift];
    parts.push(roundCone(hip, knee, 0.06, 0.035, fur), roundCone(knee, foot, 0.032, 0.026, fur), move(cylinder(0.028, -0.04, 0.02, hoof, 0.008), foot[0], foot[1], foot[2]));
  }
  // Tail: a short flag, up.
  parts.push(roundCone([-0.34, 0, bodyZ + 0.08], [-0.42, 0, bodyZ + 0.2], 0.035, 0.02, fur));
  // Neck and head.
  const eat = pose === 'eat';
  const neck0 = [0.28, 0, bodyZ + 0.1];
  const head = eat ? [0.58, 0, 0.14 + chew * 0.02] : [0.42, 0, bodyZ + 0.34 + (pose === 'walk' ? Math.sin(phase * PI * 4) * 0.01 : 0)];
  parts.push(roundCone(neck0, head, 0.1, 0.07, fur));
  // Head pointing forward and down (or straight down to the grass when eating).
  const hd = eat ? [0.08, 0, -0.12] : [0.14, 0, -0.06];
  const muzzle = [head[0] + hd[0], 0, head[2] + hd[2]];
  parts.push(roundCone(head, muzzle, 0.075, 0.045, fur));
  parts.push(move(sphere(0.042, mat(brown ? '#4a3028' : '#b8a8a0', { tag: 'figure' })), muzzle[0] + 0.02, 0, muzzle[2] - 0.01)); // nose
  if (eat) parts.push(move(ellipsoid(0.06, 0.05, 0.02, leaf('#5a7a3a', { tag: 'figure' })), muzzle[0] + 0.06, 0.02 - chew * 0.03, 0.03 + chew * 0.02)); // a mouthful of gorse
  for (const s of [-1, 1]) {
    // Eyes, ears out sideways, horns sweeping back.
    parts.push(move(sphere(0.016, eye), head[0] + 0.04, s * 0.06, head[2] + 0.02));
    parts.push(roundCone([head[0] - 0.02, s * 0.06, head[2] + 0.03], [head[0] - 0.08, s * 0.17, head[2] - 0.01], 0.022, 0.03, fur));
    const h0 = [head[0] - 0.01, s * 0.035, head[2] + 0.07];
    const h1 = eat ? [head[0] - 0.12, s * 0.06, head[2] + 0.12] : [head[0] - 0.1, s * 0.06, head[2] + 0.17];
    const h2 = eat ? [head[0] - 0.22, s * 0.08, head[2] + 0.1] : [head[0] - 0.2, s * 0.08, head[2] + 0.16];
    parts.push(roundCone(h0, h1, 0.025, 0.018, horn), roundCone(h1, h2, 0.018, 0.008, horn));
  }
  // The beard.
  parts.push(roundCone([muzzle[0] - 0.04, 0, muzzle[2] - 0.04], [muzzle[0] - 0.06, 0, muzzle[2] - 0.13], 0.025, 0.008, mat(brown ? '#3a2820' : '#d8d0c4', { tag: 'figure' })));
  return union(parts);
}

export { PI };

// ---------------------------------------------------------------------------
// The Bilge's ankle-deep flood, the Harbor's Keyhole and culvert

/** Wet flagstones in the town's sizes (half-meter slabs in offset rows), as an analytic color for under water. */
function slabColor(x, y) {
  const row = Math.floor((y + 10) * 2), off = row % 2 ? 0.5 : 0;
  const u = (x + 10) * 2 + off, col = Math.floor(u);
  const fu = u - col, fv = (y + 10) * 2 - row;
  const joint = Math.min(fu, 1 - fu) < 0.04 || Math.min(fv, 1 - fv) < 0.04;
  const c = mix(hex('#b8a888'), hex('#a89878'), hash3(col, row, 31));
  return tint(c, (joint ? 0.6 : 1) * (0.9 + fbm((x + 0.5) * 7, (y + 0.5) * 7, 3, 2, 7) * 0.15));
}

/** Shallow water's film: the sky's cool light, ripples drifting, glints; `t` the phase (0–1, loops). */
function floodFilm(t) {
  const sky = hex('#8ab0b4'), deep = hex('#4e6e70'), foam = hex(PAL.foam);
  return (x, y) => {
    const r = vnoise((x + 0.5) * 5 + t * 5, (y + 0.5) * 5 - t * 5, 4, 5);
    const r2 = vnoise((x + 0.5) * 11 - t * 11, (y + 0.5) * 11, 9, 11);
    let c = mix(deep, sky, 0.3 + r * 0.45 + r2 * 0.15);
    if (r * 0.6 + r2 * 0.4 > 0.8) c = mix(c, foam, 0.5);
    return c;
  };
}

/**
 * The flood over the Bilge's south quay, west end: paving seen through a few centimeters of water.
 * edge: null (all water), or 'e' (the tile east of the flood: the water lapping in over its west
 * part onto dry paving, with a foam line at the margin and dark wet stone beyond). A floor piece;
 * `t` loops 0–1.
 */
export function shallowFlood({ t = 0, edge = null } = {}) {
  const film = floodFilm(t);
  // The margin wanders (noise, not a regular scallop) and creeps in and out with the phase.
  const margin = (y) => 0.02 + 0.07 * Math.sin(t * PI * 2) + 0.16 * (vnoise((y + 0.5) * 4, 3 + t * 2, 1, 4) - 0.5);
  const under = (x, y, z) => (z < -0.005 ? slabColor(x, y) : null);
  const wetM = seeThrough((x, y) => {
    const c = film(x, y);
    return edge === 'e' && x > margin(y) - 0.05 ? mix(c, hex(PAL.foam), 0.7) : c;
  }, under, { k: 0.38, depth: 0.2, steps: 8, tag: 'floor', spec: 1.6, shin: 90, emit: 0.05 });
  const dryM = mat((x, y) => {
    const damp = edge === 'e' ? Math.max(0, 1 - (x - margin(y)) / 0.18) : 0;
    return tint(slabColor(x, y), 1 - Math.min(1, damp) * 0.35);
  }, { tag: 'floor', spec: 0.1, shin: 12 });
  const ground = heightfield(() => -0.02, dryM);
  if (!edge) return union(ground, boxAt(-0.6, -0.6, -0.02, 0.6, 0.6, 0.004, wetM));
  const sheet = custom((x, y, z) => Math.max(Math.abs(z + 0.008) - 0.012, x - margin(y), -0.6 - x, Math.abs(y) - 0.6), [-0.6, -0.6, -0.03, 0.4, 0.6, 0.01], wetM);
  return union(ground, sheet);
}

/** The town's quay stone (as town:quay_s), for faces with openings. */
const quayStone = () => mat((x, y, z) => {
  const course = Math.floor((z + 100) / 0.4), off = course % 2 ? 0.5 : 0;
  const bu = (x + 10) * 2 + off, blk = Math.floor(bu), fu = bu - blk, fz = ((z + 100) / 0.4) % 1;
  const joint = Math.min(fu, 1 - fu) < 0.035 || Math.min(fz, 1 - fz) < 0.05;
  let c = mix(hex('#bca88a'), hex('#d0bc9c'), hash3(blk, course, 21));
  c = mix(c, hex('#4a5a48'), Math.max(0, 1 - z / 0.6) * 0.7);
  return c.map((v) => v * (joint ? 0.72 : 1) * (0.9 + fbm((x + 0.5) * 8, z * 8, 1, 3, 8) * 0.16));
}, { tag: 'wall', spec: 0.08 });

const foamM = () => mat(PAL.foam, { tag: 'prop', spec: 0.6, emit: 0.1 });

/**
 * The Keyhole (2×1, the quay edge at the Harbor's 30–31, 9; origin at the shared edge of the two
 * tiles, at the sea's level; the face is the south side, y = 0.5): a hole worn through the rock
 * under the lighthouse, a round head (r 0.3) over a slot 0.4 wide, and the sea breathing in and out of it.
 * `t` 0–1 is one breath: the water in the throat rises and falls, and at the top of it a gout of
 * foam spills out over the sea.
 */
export function keyhole({ t = 0 } = {}) {
  const st = quayStone();
  const ragged = (x, z) => 0.03 * (fbm(x * 14 + 3, z * 14, 5, 2) - 0.5);
  // Negative inside the hole's outline on the face: round head (r 0.2 at z 0.62) over a slot 0.24 wide.
  const holeD = (x, z) => Math.min(Math.hypot(x, z - 0.58) - 0.3, Math.max(Math.abs(x) - 0.2, z - 0.58, -z - 0.2)) + ragged(x, z);
  // The hole's own sides: wet, dark rock, darker the deeper in; the face is quay stone.
  const faceM = mat((x, y, z, lx, ly, lz, nx, ny, nz) => {
    if (holeD(x, z) > 0.03 || y > 0.47) return st.color(x, y, z, lx, ly, lz, nx, ny, nz);
    return tint(mix(hex('#4a4a44'), hex('#6a6658'), fbm(x * 12, z * 12, y * 6, 2)), 0.35 + Math.max(0, y) * 1.1);
  }, { tag: 'wall', spec: 0.2, shin: 20 });
  const wall = custom((x, y, z) => Math.max(Math.abs(x) - 1, Math.abs(y) - 0.5, -z, z - 1, -holeD(x, z)), [-1, -0.5, 0, 1, 0.5, 1], faceM);
  const breath = 0.5 - 0.5 * Math.cos(t * PI * 2); // 0 low, 1 high
  const parts = [wall];
  // Inside: the dark going back into the headland.
  parts.push(boxAt(-0.4, -0.3, 0, 0.4, 0.05, 0.95, mat('#141820', { tag: 'wall', spec: 0 })));
  // The water in the throat, at the breath's height.
  parts.push(boxAt(-0.34, -0.2, 0, 0.34, 0.47, 0.04 + breath * 0.2, water({ t, glint: 0.7 })));
  if (breath > 0.55) {
    const k = (breath - 0.55) / 0.45, fm = foamM();
    for (let i = 0; i < 6; i++) {
      const a = (i / 5 - 0.5) * 1.6;
      parts.push(move(ellipsoid(0.12 + 0.05 * k, 0.1 + 0.08 * k, 0.04, fm), Math.sin(a) * 0.25 * k, 0.55 + Math.cos(a) * 0.25 * k, 0.02));
    }
  }
  return union(parts);
}

/**
 * The culvert (2×1, the quay edge at the Harbor's 1–2, 9; origin at the shared edge, at sea level):
 * a stone arch in the quay face where the canal runs out under the quay, the canal water sliding
 * out over its sill and dropping a hand's breadth into the sea. `t` loops 0–1.
 */
export function culvert({ t = 0 } = {}) {
  const st = quayStone();
  const voussoir = limestone('#d8c8a6', { tag: 'wall' });
  const R = 0.42, cz = 0.42; // half-round head over short jambs, the sill at 0.14
  const openD = (x, z) => Math.min(Math.hypot(x, z - cz) - R, Math.max(Math.abs(x) - R, z - cz, 0.14 - z));
  const wall = custom((x, y, z) => Math.max(Math.abs(x) - 1, Math.abs(y) - 0.5, -z, z - 1, -openD(x, z)), [-1, -0.5, 0, 1, 0.5, 1], st);
  // The arch's ring of dressed stones, standing a little proud of the face.
  const ring = custom((x, y, z) => Math.max(Math.abs(Math.hypot(x, z - cz) - R - 0.06) - 0.06, cz - z, Math.abs(y - 0.5) - 0.03), [-0.6, 0.45, cz - 0.02, 0.6, 0.55, 1], voussoir);
  const parts = [wall, ring];
  parts.push(boxAt(-0.42, -0.4, 0.14, 0.42, 0.3, 0.98, mat('#10141a', { tag: 'wall', spec: 0 })));
  const flow = mat((x, y, z) => {
    const s = vnoise(x * 10, (y - t) * 14 - z * 10, 3);
    return mix(hex('#3a7a80'), hex('#cfe8ec'), s > 0.62 ? 0.7 : 0.15 + s * 0.2);
  }, { tag: 'prop', spec: 1.4, shin: 80, emit: 0.05 });
  parts.push(boxAt(-0.4, 0.3, 0.14, 0.4, 0.5, 0.2, flow));
  parts.push(custom((x, y, z) => {
    // The fall: a curved sheet from the sill's lip (y 0.5, z 0.2) down to the sea (y 0.66, z 0).
    const u = Math.max(0, Math.min(1, (0.2 - z) / 0.2)), yc = 0.5 + 0.16 * u * u;
    return Math.max(Math.abs(y - yc) - 0.02, Math.abs(x) - 0.38, -z, z - 0.2);
  }, [-0.4, 0.46, 0, 0.4, 0.7, 0.21], flow));
  const fm = foamM();
  const R2 = rng(7 + Math.floor(t * 3) * 13);
  for (let i = 0; i < 7; i++) parts.push(move(ellipsoid(0.08 + R2() * 0.05, 0.06, 0.025, fm), -0.34 + i * 0.11 + (R2() - 0.5) * 0.04, 0.7 + R2() * 0.08, 0.01));
  return union(parts);
}

/**
 * The culvert's outflow (2×1 of sea, the Harbor's 1–2, 10; origin at the shared edge, sea level):
 * the town's sea with a fan of paler, quicker canal water spreading from the quay, foam drifting
 * off on it. `t` loops 0–1.
 */
export function outflow({ t = 0 } = {}) {
  const mt = mat((x, y) => {
    const n = vnoise((x + 1) * 4 + t, (y + 0.5) * 4, 7, 4);
    let c = mix(hex('#1e4a52'), hex('#3a7a80'), n * 0.6); // as town:water
    // The fan, from the culvert's mouth (0, −0.5) spreading south, streaked with the current.
    const d = Math.hypot(x / 1.1, y + 0.5), fan = Math.max(0, 1 - d) * sstep(-0.55, -0.3, y);
    const streak = vnoise(Math.atan2(x, y + 0.6) * 6, d * 6 - t * 6, 2);
    c = mix(c, hex('#5a9aa0'), fan * (0.5 + streak * 0.4));
    if (streak > 0.7 && fan > 0.15) c = mix(c, hex(PAL.foam), Math.min(1, (streak - 0.7) * 2.4 * fan));
    return c;
  }, { tag: 'floor', spec: 1.4, shin: 80 });
  return custom((x, y, z) => Math.max(Math.abs(x) - 1, Math.abs(y) - 0.5, z - 0.004 - (vnoise((x + 1) * 3 + t * 2, (y + 0.5) * 3, t * 3) - 0.5) * 0.02, -z - 0.05), [-1, -0.5, -0.05, 1, 0.5, 0.02], mt);
}
