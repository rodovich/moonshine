// Cheryl's flat: one whitewashed room under her roof (docs/design/01-opening.md,
// "Cheryl's flat"). Terracotta floor tiles, walls with a cobalt dado, and her
// things. The north and west walls show their inner faces; the south and east
// walls, nearest the camera, are cut away to low stubs, as rooms were in the era.
// Every builder has its origin at its footprint's center on the floor.

import { box, boxAt, union, subtract, move, place, cylinder, sphere, capsule, torus, frustum, ellipsoid, roundCone, custom, intersect } from '../lib/sdf.mjs';
import { mat, hex, mix } from '../lib/render.mjs';
import { plaster, limestone, wood, iron, brass, glass, terracotta, leaf, fbm, vnoise } from './materials.mjs';
import { hash3, rng } from '../lib/noise.mjs';
import { onFace, windowFeature } from './arch.mjs';
import { heightfield, sstep } from './ground.mjs';

const PI = Math.PI;
const m = (c, o = {}) => mat(c, { tag: 'prop', ...o });
export const ROOM_H = 2.4; // 96 px
const DADO = 0.85;

// ---------------------------------------------------------------------------
// Floor: square terracotta tiles, three to a tile edge, with pale grout.

export function clayFloor({ seed = 0, worn = false } = {}) {
  const tones = ['#c07850', '#b87048', '#c88058', '#b06a44'].map(hex);
  const grout = hex('#d8c4a8');
  const cell = (x, y) => {
    const X = (x + 0.5) * 3, Y = (y + 0.5) * 3;
    const i = Math.floor(X), j = Math.floor(Y);
    const fx = X - i, fy = Y - j;
    return { e: Math.min(fx, 1 - fx, fy, 1 - fy) / 3, id: hash3(((i % 3) + 3) % 3, ((j % 3) + 3) % 3, 11 + seed) };
  };
  const f = (x, y) => { const c = cell(x, y); return -0.01 + sstep(0, 0.012, c.e) * 0.01; };
  const mt = mat((x, y) => {
    const c = cell(x, y);
    const base = tones[Math.floor(c.id * tones.length) % tones.length];
    const n = fbm((x + 0.5) * 6, (y + 0.5) * 6, seed, 3, 6);
    let col = base.map((v) => v * (0.9 + n * 0.18));
    if (worn) col = mix(col, hex('#d8a078'), Math.max(0, 0.35 - Math.hypot(x, y)) * 1.2);
    return mix(grout, col, sstep(0.0, 0.01, c.e));
  }, { tag: 'floor', spec: 0.18, shin: 16 });
  return heightfield(f, mt);
}

// ---------------------------------------------------------------------------
// Walls: a column of interior plaster with a cobalt-painted dado and skirting.

function roomWall(face, h = ROOM_H) {
  const pl = plaster('#f0e8da', { axis: face === 's' ? 'x' : 'y' });
  const dado = mat((x, y, z) => {
    const c = hex('#3a5a8c'), n = vnoise((face === 's' ? x : y) * 20, z * 20, 1);
    return c.map((v) => v * (0.9 + n * 0.14));
  }, { tag: 'wall', spec: 0.15, shin: 14 });
  const rail = m('#e8dcc4', { tag: 'wall' });
  // A thin wall (0.3 m) standing on the tile's room-side edge, so its cut top is a narrow section.
  const parts = [face === 's' ? boxAt(-0.5, 0.2, 0, 0.5, 0.5, h, pl) : boxAt(0.2, -0.5, 0, 0.5, 0.5, h, pl)];
  parts.push(onFace(boxAt(-0.5, -0.03, 0.08, 0.5, 0.012, DADO, dado), face));
  parts.push(onFace(boxAt(-0.5, -0.03, DADO, 0.5, 0.03, DADO + 0.05, rail, 0.01), face));
  parts.push(onFace(boxAt(-0.5, -0.03, 0, 0.5, 0.03, 0.09, wood('#5a3a24', { grain: 'x' }), 0.01), face));
  return union(parts);
}

/** A wall piece with a feature: 'plain', 'window' (north light), 'clock', 'shelf', 'hook'. */
export function wallPiece(face, kind = 'plain', { half } = {}) {
  let wall = roomWall(face);
  const parts = [];
  if (kind === 'window') {
    // A two-tile window is two pieces: `half` = 'l' or 'r' shifts the opening to straddle the seam.
    const off = half === 'l' ? 0.5 : half === 'r' ? -0.5 : 0;
    const f = windowFeature({ w: 0.9, z0: 1.0, z1: 2.15, color: '#3a6cc0', sill: true });
    const cut = move(f.cut, off, 0, 0);
    wall = subtract(wall, onFace(cut, face), plaster('#e0d6c4'));
    // Evening light in the glass: the outside, brighter than the room.
    // The window is the brightest thing in the room: the evening outside.
    const sky = mat((x, y, z) => mix(hex('#fff0d0'), hex('#ffe4b8'), Math.max(0, Math.min(1, (z - 1) / 1.1))), { tag: 'glass', emit: 1 });
    parts.push(onFace(boxAt(-0.45 + off, -0.16, 1.0, 0.45 + off, -0.12, 2.15, sky), face));
    parts.push(onFace(boxAt(-0.015 + off, -0.13, 1.0, 0.015 + off, -0.1, 2.1, m('#e8e4d8', { tag: 'wall' })), face));
    parts.push(onFace(boxAt(-0.45 + off, -0.13, 1.55, 0.45 + off, -0.1, 1.58, m('#e8e4d8', { tag: 'wall' })), face));
    parts.push(onFace(boxAt(-0.5 + off, -0.13, 0.94, 0.5 + off, 0.07, 1.0, limestone('#e0d0b4', { tag: 'wall' }), 0.01), face));
  }
  if (kind === 'clock') {
    // "That clock has never once been right, but it's always been confident."
    const faceM = mat((x, y, z, lx, ly, lz) => {
      const r = Math.hypot(lx, lz), a = Math.atan2(lz, lx);
      if (r > 0.15) return hex('#6a4028');
      if (Math.abs(((a / (2 * PI)) * 12 + 120) % 1 - 0.5) > 0.42 && r > 0.11) return hex('#302830');
      return hex('#f2ead6');
    }, { tag: 'wall', spec: 0.5, shin: 30 });
    parts.push(onFace(place(cylinder(0.18, -0.03, 0.03, faceM, 0.02), { at: [0, 0.02, 1.7], rx: PI / 2 }), face));
    parts.push(onFace(capsule([0, 0.06, 1.7], [0.06, 0.06, 1.78], 0.008, m('#201820')), face));
    parts.push(onFace(capsule([0, 0.06, 1.7], [-0.08, 0.06, 1.66], 0.008, m('#201820')), face));
  }
  if (kind === 'shelf_l' || kind === 'shelf_r') {
    // The kitchen shelf: tins, a jar of capers, and a teapot that drips.
    const w = wood('#8a5a34', { grain: 'x' });
    parts.push(onFace(boxAt(-0.5, 0, 1.45, 0.5, 0.24, 1.49, w, 0.01), face));
    parts.push(onFace(boxAt(-0.5, 0, 1.85, 0.5, 0.24, 1.89, w, 0.01), face));
    const R = rng(kind === 'shelf_l' ? 3 : 7);
    const items = [];
    if (kind === 'shelf_l') {
      items.push(move(cylinder(0.06, 0, 0.14, m('#c04838', { spec: 0.6 }), 0.01), -0.3, 0.12, 1.49));
      items.push(move(cylinder(0.06, 0, 0.16, m('#d8b040', { spec: 0.6 }), 0.01), -0.12, 0.12, 1.49));
      items.push(move(cylinder(0.055, 0, 0.13, m('#4a7aa8', { spec: 0.6 }), 0.01), 0.06, 0.12, 1.49));
      items.push(move(union(cylinder(0.05, 0, 0.12, m('#7a9a50', { spec: 1.0, emit: 0.05 }), 0.02), move(cylinder(0.04, 0.12, 0.15, m('#c8a060', { spec: 0.4 })), 0, 0, 0)), 0.28, 0.12, 1.49));
      items.push(move(cylinder(0.07, 0, 0.1, m('#e8e0d0', { spec: 0.6 }), 0.01), -0.2, 0.12, 1.89));
      items.push(move(cylinder(0.07, 0, 0.1, m('#e8e0d0', { spec: 0.6 }), 0.01), 0.0, 0.12, 1.89));
    } else {
      const pot = m('#3a6cc0', { spec: 0.8, shin: 30 });
      items.push(move(union(ellipsoid(0.12, 0.1, 0.09, pot), move(sphere(0.025, pot), 0, 0, 0.1), roundCone([0.1, 0, 0.0], [0.19, 0, 0.07], 0.025, 0.012, pot), place(torus(0.06, 0.012, pot), { at: [-0.12, 0, 0.01], rx: PI / 2 })), -0.15, 0.12, 1.58));
      items.push(move(cylinder(0.05, 0, 0.12, m('#e0c890', { spec: 0.3 }), 0.01), 0.2, 0.12, 1.49));
      items.push(move(box(0.12, 0.06, 0.08, m('#b85040'), 0.01), 0.1, 0.12, 1.97));
    }
    void R;
    parts.push(...items.map((n) => onFace(n, face)));
  }
  return union(wall, ...parts);
}

/** The near (south/east) walls, cut away to a low stub that shows the wall's thickness. */
export function cutaway(dir = 'x', { door = false, hook = false } = {}) {
  const pl = plaster('#f0e8da', { axis: dir });
  const top = m('#d8ccb8', { tag: 'wall' });
  const parts = [];
  const H = 0.4;
  const run = (a, b) => (dir === 'x' ? boxAt(a, -0.18, 0, b, 0.18, H, pl) : boxAt(-0.18, a, 0, 0.18, b, H, pl));
  if (dir === 'corner') {
    // The south-east corner, where the two stubs meet: a short post with its cut top.
    // An L reaching back along both walls to the neighboring stubs.
    return union(boxAt(-0.5, -0.18, 0, 0.18, 0.18, H, pl), boxAt(-0.18, -0.5, 0, 0.18, 0.18, H, pl),
      boxAt(-0.5, -0.18, H - 0.01, 0.18, 0.18, H + 0.005, top), boxAt(-0.18, -0.5, H - 0.01, 0.18, 0.18, H + 0.005, top));
  }
  if (door) {
    // The doorway: a stone threshold between two jamb stubs, and the door standing open inward.
    parts.push(run(-0.5, -0.36), run(0.36, 0.5));
    parts.push(boxAt(-0.36, -0.2, 0, 0.36, 0.2, 0.04, limestone('#d8c8a8', { tag: 'floor' }), 0.01));
  } else parts.push(run(-0.5, 0.5));
  // A cut edge: the top of the stub is plain, a shade darker, so it reads as a section.
  parts.push(dir === 'x' ? boxAt(-0.5, -0.18, H - 0.01, 0.5, 0.18, H + 0.005, top) : boxAt(-0.18, -0.5, H - 0.01, 0.18, 0.5, H + 0.005, top));
  if (hook) {
    // The plug hook, on a little brass plate on the stub's inner face.
    const b = brass();
    parts.push(boxAt(-0.06, -0.21, 0.22, 0.06, -0.18, 0.34, b, 0.01));
    parts.push(capsule([0, -0.22, 0.28], [0, -0.28, 0.27], 0.012, b), capsule([0, -0.28, 0.27], [0, -0.28, 0.32], 0.012, b));
  }
  return union(parts);
}

// ---------------------------------------------------------------------------
// Furniture

/** The kitchen counter, one tile each: 'l' (with the pepper mill) and 'r' (with the egg timer). */
export function counter(side, { item = true } = {}) {
  const w = wood('#9a6a40', { grain: 'z' });
  const top = mat((x, y) => {
    const X = (x + 0.5) * 4, Y = (y + 0.5) * 4, fx = X % 1, fy = Y % 1;
    const g = Math.min(fx, 1 - fx, fy, 1 - fy) < 0.05;
    return g ? hex('#c8bca8') : (Math.floor(X) + Math.floor(Y)) % 2 ? hex('#f0ece0') : hex('#4a78b0');
  }, { tag: 'prop', spec: 0.5, shin: 30 });
  const parts = [boxAt(-0.5, -0.4, 0, 0.5, 0.42, 0.86, w, 0.01), boxAt(-0.5, -0.42, 0.86, 0.5, 0.45, 0.92, top, 0.01)];
  // Cupboard doors and knobs on the front.
  parts.push(boxAt(-0.44, 0.42, 0.1, -0.02, 0.44, 0.8, wood('#a87448', { grain: 'z' }), 0.01), boxAt(0.02, 0.42, 0.1, 0.44, 0.44, 0.8, wood('#a87448', { grain: 'z' }), 0.01));
  parts.push(move(sphere(0.022, brass()), -0.06, 0.46, 0.6), move(sphere(0.022, brass()), 0.06, 0.46, 0.6));
  if (item && side === 'l') {
    const pm = m('#1e1a20', { spec: 0.7, shin: 30 });
    parts.push(move(union(frustum(0.05, 0.04, 0, 0.2, pm, 0.01), move(sphere(0.045, pm), 0, 0, 0.22), move(sphere(0.012, m('#c8c8d0', { spec: 1 })), 0, 0, 0.27)), 0.05, 0.05, 0.92));
  }
  if (item && side === 'r') {
    // The egg timer: a key item, so drawn larger than life (about 1.8×, as faces are) to read at 1×:
    // a fat red tomato-shaped dial with a cream face toward the room and a brass knob.
    const red = m('#e03c2c', { spec: 0.7, shin: 30 });
    const face = m('#f6eed8', { spec: 0.4 });
    parts.push(move(union(
      ellipsoid(0.14, 0.14, 0.12, red),
      place(cylinder(0.105, -0.012, 0.012, face, 0.008), { at: [0.07, 0.07, 0.02], rx: PI / 2, rz: PI / 4 }),
      move(cylinder(0.035, 0.1, 0.16, m('#3a7a3a', { spec: 0.3 }), 0.01), 0, 0, 0),
      move(sphere(0.035, brass()), 0, 0, 0.17),
    ), -0.04, 0.06, 1.04));
  }
  return union(parts);
}

/** A small iron cooking range with a flue. */
export function stove() {
  const ir = iron('#2e2e38');
  return union(
    boxAt(-0.42, -0.4, 0, 0.42, 0.38, 0.78, ir, 0.03),
    boxAt(-0.44, -0.42, 0.78, 0.44, 0.4, 0.82, iron('#3e3e48'), 0.02),
    move(torus(0.13, 0.02, iron('#555560')), -0.18, 0, 0.83), move(torus(0.11, 0.02, iron('#555560')), 0.18, 0, 0.83),
    boxAt(-0.3, 0.38, 0.2, 0.3, 0.41, 0.5, iron('#3a3a44'), 0.02),
    capsule([-0.2, 0.43, 0.46], [0.2, 0.43, 0.46], 0.012, brass()),
    cylinder(0.08, 0.82, 2.4, iron('#2a2a32'), 0.01),
  );
}

/** The bed (2×2): a wooden frame, a cream quilt with a blue pattern, a plump pillow at the head (north). */
export function bed() {
  const w = wood('#8a5a34', { grain: 'x' });
  const quilt = mat((x, y, z) => {
    const u = (x + 2) * 4, v = (y + 2) * 4;
    const d = Math.abs(((u + v) % 1) - 0.5) < 0.08 || Math.abs(((u - v + 40) % 1) - 0.5) < 0.08;
    return d ? hex('#4a6aa0') : hex('#efe6d2');
  }, { tag: 'prop', spec: 0.05 });
  const parts = [
    boxAt(-0.75, -0.95, 0.2, 0.75, 0.95, 0.42, w, 0.03),
    boxAt(-0.72, -0.9, 0.42, 0.72, 0.9, 0.55, m('#f4f0e6'), 0.06),
    boxAt(-0.74, -0.55, 0.5, 0.74, 0.92, 0.62, quilt, 0.07),
    move(ellipsoid(0.55, 0.2, 0.09, m('#fbf8f0', { spec: 0.05 })), 0, -0.68, 0.64),
    boxAt(-0.8, -1.0, 0, 0.8, -0.92, 1.05, w, 0.03), // headboard
    boxAt(-0.8, 0.92, 0, 0.8, 1.0, 0.62, w, 0.03), // footboard
  ];
  for (const sx of [-1, 1]) for (const sy of [-1, 1]) parts.push(boxAt(sx * 0.72 - 0.04, sy * 0.92 - 0.04, 0, sx * 0.72 + 0.04, sy * 0.92 + 0.04, 0.25, w));
  return union(parts);
}

/** The side table, with the photograph lying face down. "I know what it is." */
export function sideTable() {
  const w = wood('#7a4e30', { grain: 'z' });
  const parts = [boxAt(-0.24, -0.24, 0.56, 0.24, 0.24, 0.6, w, 0.01)];
  for (const sx of [-1, 1]) for (const sy of [-1, 1]) parts.push(boxAt(sx * 0.2 - 0.02, sy * 0.2 - 0.02, 0, sx * 0.2 + 0.02, sy * 0.2 + 0.02, 0.56, w));
  // The frame, face down: only its plain card back shows.
  parts.push(place(boxAt(-0.1, -0.13, 0, 0.1, 0.13, 0.02, m('#5a3a24', { spec: 0.4 }), 0.005), { at: [0.02, 0, 0.6], rz: 0.3 }));
  parts.push(place(boxAt(-0.085, -0.115, 0.02, 0.085, 0.115, 0.024, m('#b8a888')), { at: [0.02, 0, 0.6], rz: 0.3 }));
  return union(parts);
}

/** The kitchen table (2×1 along x), with the moon chart or bare (a clean rectangle in the crumbs). */
export function table({ chart = true } = {}) {
  const w = wood('#a0703f', { grain: 'x' });
  const parts = [boxAt(-0.9, -0.42, 0.7, 0.9, 0.42, 0.76, w, 0.02)];
  for (const sx of [-1, 1]) for (const sy of [-1, 1]) parts.push(boxAt(sx * 0.82 - 0.03, sy * 0.35 - 0.03, 0, sx * 0.82 + 0.03, sy * 0.35 + 0.03, 0.7, w));
  if (chart) {
    // The moon chart: a sheet of paper ruled in years, ticks in two hands.
    const paper = mat((x, y) => {
      const u = (x + 0.35) / 0.7, v = (y + 0.25) / 0.5;
      if (Math.abs(u - 0.5) < 0.012) return hex('#a04040'); // the Gate's line
      const row = Math.floor(v * 16), rf = (v * 16) % 1;
      if (rf < 0.12) return hex('#c8bca0');
      const tickU = 0.5 + (hash3(row, 1, 4) - 0.5) * 0.08 + (row > 12 ? (row - 12) * 0.03 : 0);
      if (Math.abs(u - tickU) < 0.02 && rf > 0.3 && rf < 0.8) return row < 9 && hash3(row, 2, 2) > 0.5 ? hex('#4a4a68') : hex('#283048');
      return hex('#f2ead2');
    }, { tag: 'prop', spec: 0.05 });
    parts.push(place(boxAt(-0.35, -0.25, 0, 0.35, 0.25, 0.008, paper), { at: [0.1, 0, 0.76], rz: -0.12 }));
  } else {
    // Crumbs, with a clean rectangle where the chart lay.
    const R = rng(9);
    for (let i = 0; i < 40; i++) {
      const x = -0.8 + R() * 1.6, y = -0.38 + R() * 0.76;
      const rx = x - 0.1, ry = y;
      if (Math.abs(rx * Math.cos(0.12) - ry * Math.sin(0.12)) < 0.36 && Math.abs(rx * Math.sin(0.12) + ry * Math.cos(0.12)) < 0.26) continue;
      parts.push(move(sphere(0.008 + R() * 0.006, m('#d8b888')), x, y, 0.765));
    }
  }
  return union(parts);
}

/** A kitchen chair facing `face` (radians; 0 = east). One of them wobbles. */
export function kitchenChair({ face = 0 } = {}) {
  const w = wood('#94603a', { grain: 'z' });
  const parts = [boxAt(-0.2, -0.2, 0.44, 0.2, 0.2, 0.48, w, 0.015)];
  for (const sx of [-1, 1]) for (const sy of [-1, 1]) parts.push(boxAt(sx * 0.17 - 0.02, sy * 0.17 - 0.02, 0, sx * 0.17 + 0.02, sy * 0.17 + 0.02, 0.44, w));
  for (const sy of [-1, 1]) parts.push(boxAt(-0.21, sy * 0.17 - 0.02, 0.48, -0.17, sy * 0.17 + 0.02, 1.0, w));
  for (const z of [0.66, 0.8, 0.94]) parts.push(boxAt(-0.21, -0.17, z, -0.17, 0.17, z + 0.04, w, 0.01));
  return place(union(parts), { rz: face });
}

/** The wardrobe (1×2 along y), tall dark wood with two doors. */
export function wardrobe() {
  const w = wood('#6a4228', { grain: 'z' });
  const door = wood('#7a4e30', { grain: 'z' });
  return union(
    boxAt(-0.32, -0.95, 0.06, 0.32, 0.95, 2.05, w, 0.02),
    boxAt(-0.36, -0.99, 2.05, 0.36, 0.99, 2.14, w, 0.02),
    boxAt(-0.34, -0.97, 0, 0.34, 0.97, 0.08, w, 0.02),
    boxAt(-0.34, -0.9, 0.16, -0.32, -0.02, 1.95, door, 0.01), boxAt(-0.34, 0.02, 0.16, -0.32, 0.9, 1.95, door, 0.01),
    move(sphere(0.025, brass()), -0.36, -0.07, 1.1), move(sphere(0.025, brass()), -0.36, 0.07, 1.1),
  );
}

/** The washstand: jug, basin, mirror on the wall above, and the soap (or not). */
export function washstand({ soap = true } = {}) {
  const w = wood('#8a5a34', { grain: 'z' });
  const china = m('#f4f2ee', { spec: 0.8, shin: 40 });
  const parts = [boxAt(-0.3, -0.36, 0, 0.3, 0.36, 0.8, w, 0.02), boxAt(-0.32, -0.38, 0.8, 0.32, 0.38, 0.84, limestone('#e8dcc8', { tag: 'prop' }), 0.01)];
  parts.push(subtract(move(ellipsoid(0.22, 0.22, 0.08, china), 0, 0.05, 0.9), move(ellipsoid(0.19, 0.19, 0.08, china), 0, 0.05, 0.94), china));
  parts.push(move(union(frustum(0.08, 0.06, 0, 0.22, china, 0.01), roundCone([0.06, 0, 0.2], [0.11, 0, 0.24], 0.02, 0.01, china), place(torus(0.05, 0.012, china), { at: [-0.08, 0, 0.13], rx: PI / 2 })), 0, -0.2, 0.84));
  // The mirror "I avoid before ten", hung on the wall behind (west).
  parts.push(boxAt(-0.36, -0.22, 1.3, -0.32, 0.22, 1.85, wood('#6a4228', { grain: 'z' }), 0.02));
  parts.push(boxAt(-0.33, -0.18, 1.34, -0.315, 0.18, 1.81, mat('#a8b8c8', { tag: 'prop', spec: 1.4, shin: 80 })));
  if (soap) parts.push(move(box(0.06, 0.035, 0.025, m('#c8a8e0', { spec: 0.4 }), 0.015), 0.12, 0.25, 0.865));
  return union(parts);
}

/** The bookshelf against the north wall (2 tiles along x): twenty-nine years of lesson plans. */
export function bookshelf(side) {
  const w = wood('#7a4e30', { grain: 'z' });
  const parts = [boxAt(-0.5, -0.2, 0, 0.5, 0.15, 1.9, w, 0.01)];
  const R = rng(side === 'l' ? 5 : 8);
  const cols = ['#a04838', '#3a5a8c', '#c8a050', '#4a7048', '#e8dcc0', '#6a4a7a', '#b86838'];
  for (const z of [0.1, 0.55, 1.0, 1.45]) {
    parts.push(boxAt(-0.48, -0.2, z - 0.03, 0.48, 0.17, z, w, 0.005));
    let x = -0.46;
    while (x < 0.44) {
      const bw = 0.04 + R() * 0.04, bh = 0.26 + R() * 0.12;
      if (R() < 0.08) { x += 0.06; continue; }
      parts.push(boxAt(x, -0.16, z, x + bw - 0.005, 0.13, z + bh, m(cols[Math.floor(R() * cols.length)], { spec: 0.15 }), 0.005));
      x += bw;
    }
  }
  // The sides and top, so the shelves read as a case.
  parts.push(boxAt(-0.52, -0.2, 1.9, 0.52, 0.18, 1.95, w, 0.01));
  return union(parts);
}

/** The rug (3×2): a woven runner, faded rose with a cobalt border. */
export function rug() {
  const mt = mat((x, y) => {
    const ex = 1.4 - Math.abs(x), ey = 0.9 - Math.abs(y);
    const e = Math.min(ex, ey);
    if (e < 0.08) return hex('#2e4a7a');
    if (e < 0.13) return hex('#e8d8b8');
    const u = x * 6, v = y * 6;
    const diamond = Math.abs(((u + v + 100) % 2) - 1) + Math.abs(((u - v + 100) % 2) - 1) < 0.5;
    const n = vnoise(x * 30, y * 30, 2);
    return (diamond ? hex('#c89a58') : hex('#b05a4c')).map((c) => c * (0.9 + n * 0.15));
  }, { tag: 'floor', spec: 0.03 });
  return boxAt(-1.4, -0.9, 0, 1.4, 0.9, 0.02, mt, 0.01);
}

/** The top of a cut wall: a flat, dark warm-grey section over the wall's 0.3 m thickness ('s', 'e', or 'corner'). */
export function wallCap(which = 's') {
  const m = mat((x, y) => hex('#6a5650').map((c) => c * (0.95 + vnoise(x * 12, y * 12, 3) * 0.1)), { tag: 'floor' });
  const z0 = ROOM_H - 0.01, z1 = ROOM_H + 0.01;
  if (which === 's') return boxAt(-0.5, 0.2, z0, 0.5, 0.5, z1, m);
  if (which === 'e') return boxAt(0.2, -0.5, z0, 0.5, 0.5, z1, m);
  return boxAt(0.2, 0.2, z0, 0.5, 0.5, z1, m);
}

/** The inside corner where the north and west walls meet: a 0.3 m post of wall. */
export function roomCorner() {
  return boxAt(0.2, 0.2, 0, 0.5, 0.5, ROOM_H, plaster('#f0e8da'));
}

export { clayFloor as floor };
void custom; void intersect; void leaf; void terracotta; void glass;
