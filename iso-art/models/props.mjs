// Cistern Court's props. Each builder returns an SDF node with its origin at
// the center of its footprint, on the floor (z = 0). Footprints are noted.

import { box, boxAt, union, subtract, move, place, cylinder, sphere, capsule, custom, intersect, frustum, ellipsoid, torus, roundCone, smooth, squash, shell } from '../lib/sdf.mjs';
import { mat, hex, mix } from '../lib/render.mjs';
import { plaster, limestone, paintedWood, wood, iron, glass, terracotta, leaf, flat, brass, bronze, fbm, vnoise, stoneVaried } from './materials.mjs';
import { rng, hash3 } from '../lib/noise.mjs';
import { COLORS } from './arch.mjs';

const PI = Math.PI;

// ---------------------------------------------------------------------------
// The tub (2×1 along x): cast iron, clawfooted, enamel inside.

const TUB = { L: 0.84, W: 0.36, z0: 0.17, z1: 0.66 };

function tubShell() {
  const outerM = mat((x, y, z, lx, ly, lz) => {
    // Painted iron outside, gone a little chalky; a darker band under the roll rim.
    const n = fbm(lx * 12, ly * 12, lz * 12, 2);
    const base = hex('#2e4a5a');
    const k = 0.9 + n * 0.14;
    return [base[0] * k, base[1] * k, base[2] * k];
  }, { tag: 'prop', spec: 0.5, shin: 26 });
  const enamel = mat('#f0ece4', { tag: 'prop', spec: 0.6, shin: 40 });
  const { L, W, z0, z1 } = TUB;
  const cz = (z0 + z1) / 2, hz = (z1 - z0) / 2;
  // The body tapers toward the foot (−x) and is deepest at the head (+x).
  const outer = squash(move(box(L, W, hz, outerM, 0.2), 0, 0, cz / 1), 1, 1, 1);
  const inner = move(box(L - 0.06, W - 0.06, hz + 0.1, enamel, 0.17), 0, 0, cz + 0.1);
  const body = subtract(outer, inner, enamel);
  // Roll rim: a rounded lip all round the top.
  const rim = custom((x, y, z) => {
    const qx = Math.abs(x) - (L - 0.2 + 0.0), qy = Math.abs(y) - (W - 0.2);
    const d2 = Math.hypot(Math.max(qx, 0), Math.max(qy, 0)) + Math.min(Math.max(qx, qy), 0) - 0.17;
    return Math.hypot(d2, z - z1 + 0.01) - 0.028;
  }, [-L - 0.05, -W - 0.05, z1 - 0.05, L + 0.05, W + 0.05, z1 + 0.04], mat('#f4f0e8', { tag: 'prop', spec: 0.7, shin: 40 }));
  // Claw feet.
  const footM = mat('#c89a48', { tag: 'prop', spec: 0.8, shin: 30 });
  const feet = [];
  for (const sx of [-1, 1]) for (const sy of [-1, 1]) {
    const fx = sx * (L - 0.2), fy = sy * (W - 0.12);
    feet.push(roundCone([fx, fy, z0 + 0.06], [fx + sx * 0.05, fy + sy * 0.03, 0.04], 0.05, 0.035, footM));
    feet.push(move(ellipsoid(0.05, 0.045, 0.03, footM), fx + sx * 0.06, fy + sy * 0.035, 0.03));
  }
  return union(body, rim, ...feet);
}

/**
 * The tub in a state: 'empty' (drain hole), 'plugged', 'full', 'filling' (level 0–1),
 * 'slosh' (tilt), 'whirl' (drain vortex, the Wrongness). `t` is the animation phase 0–1.
 */
export function tub(state = 'empty', { t = 0, level = 1, grey = false, still = false, waterMat = null } = {}) {
  const { L, W, z0, z1 } = TUB;
  const parts = [tubShell()];
  const floorZ = z0 + 0.08;
  // Drain at the foot end (−x).
  const drainX = -L + 0.28;
  if (state === 'empty' || state === 'whirl') parts.push(move(cylinder(0.035, -0.01, 0.006, mat('#141018', { tag: 'prop' })), drainX, 0, floorZ));
  if (state === 'plugged' || ['full', 'filling', 'slosh'].includes(state)) {
    parts.push(move(cylinder(0.04, 0, 0.03, brass()), drainX, 0, floorZ));
    // The little chain, looping up to the rim.
    for (let i = 0; i < 6; i++) parts.push(move(torus(0.012, 0.004, brass()), drainX - 0.03 - i * 0.03, 0.04 + i * 0.03, floorZ + 0.02 + i * i * 0.012));
  }
  let lvl = null;
  if (state === 'full' || state === 'slosh' || state === 'whirl') lvl = z1 - 0.07;
  if (state === 'filling') lvl = floorZ + (z1 - 0.07 - floorZ) * level;
  if (lvl !== null) {
    const water = mat((x, y, z, lx, ly, lz, nx, ny, nz) => {
      // Cool sky in the water, with moving ripples.
      // Depth: dark toward the far (north and west) walls, the sky's reflection
      // brightening toward the near rim, and ripples catching the light.
      const r = vnoise(x * 9 + t * 6, y * 9, t * 3);
      const near = Math.max(0, Math.min(1, (x + y + 0.9) / 1.6));
      let base = mix(hex('#22405a'), hex('#6a92b4'), near * 0.8 + r * 0.2);
      if (r > 0.78) base = mix(base, hex('#d8ecf4'), (r - 0.78) * 3);
      if (state === 'whirl') {
        const a = Math.atan2(y, x - drainX), rr = Math.hypot(x - drainX, y);
        const sp = Math.sin(a * 3 + rr * 30 - t * 12);
        return sp > 0.3 ? mix(hex('#b830c8'), hex('#100010'), Math.min(1, rr * 2)) : mix(base, hex('#304060'), 0.5);
      }
      return base;
    }, { tag: 'prop', spec: 1.6, shin: 110 });
    const wm = waterMat || water;
    const tilt = state === 'slosh' ? Math.sin(t * PI * 2) * 0.12 : 0;
    const surf = custom((x, y, z) => {
      let h = lvl + x * tilt * 0.3;
      if (state !== 'whirl' && !still) h += (vnoise(x * 14 + t * 5, y * 14, t * 2) - 0.5) * 0.012;
      else { const rr = Math.hypot(x - drainX, y); h -= Math.max(0, 0.12 - rr) * 0.8; }
      return (z - h) * 0.7;
    }, [-L, -W, floorZ, L, W, lvl + 0.05], wm);
    parts.push(intersect(surf, move(box(L - 0.06, W - 0.06, 0.4, wm, 0.17), 0, 0, (z0 + z1) / 2 + 0.06)));
  }
  void grey;
  return union(parts);
}

/** The roof standpipe tap (1×1), optionally running. */
export function tap({ running = false, t = 0 } = {}) {
  const pipe = mat('#6a6e78', { tag: 'prop', spec: 0.5, shin: 30 });
  const b = brass();
  const parts = [
    cylinder(0.035, 0, 0.92, pipe, 0.01),
    move(cylinder(0.08, 0, 0.05, limestone('#d0c0a0'), 0.01), 0, 0, 0),
    capsule([0, 0, 0.9], [-0.16, 0, 0.9], 0.03, pipe),
    capsule([-0.16, 0, 0.9], [-0.18, 0, 0.82], 0.028, b),
    move(cylinder(0.006, 0, 0.06, b), 0, 0, 0.92),
    place(capsule([-0.06, 0, 0], [0.06, 0, 0], 0.014, b), { at: [0, 0, 0.99], rz: t * 3 }),
  ];
  if (running) {
    const water = mat('#b8d8e8', { tag: 'prop', spec: 1, shin: 50, emit: 0.2 });
    parts.push(capsule([-0.18, 0, 0.8], [-0.2 - Math.sin(t * 9) * 0.01, 0, 0.45], 0.018, water));
  }
  return union(parts);
}

/** A slatted wooden folding chair (1×1), facing `face` radians (0 = +x). */
export function foldingChair({ face = 0, cardigan = false } = {}) {
  const w = wood('#b07a48', { grain: 'x' });
  const frame = wood('#8a5a34', { grain: 'z' });
  const parts = [];
  // Seat slats.
  for (let i = 0; i < 4; i++) parts.push(boxAt(-0.2 + i * 0.105, -0.2, 0.44, -0.2 + i * 0.105 + 0.085, 0.2, 0.47, w, 0.01));
  // Legs crossing (X frame) on each side.
  for (const s of [-1, 1]) {
    parts.push(capsule([-0.2, s * 0.2, 0.02], [0.18, s * 0.2, 0.45], 0.018, frame));
    parts.push(capsule([0.2, s * 0.2, 0.02], [-0.18, s * 0.2, 0.45], 0.018, frame));
    parts.push(capsule([-0.22, s * 0.2, 0.44], [-0.27, s * 0.2, 0.92], 0.018, frame));
  }
  // Backrest slats.
  for (let i = 0; i < 2; i++) parts.push(place(boxAt(-0.018, -0.2, 0.62 + i * 0.16, 0.018, 0.2, 0.72 + i * 0.16, w, 0.01), { at: [-0.25, 0, 0], ry: -0.12 }));
  if (cardigan) {
    // Her cardigan, folded: coral knit with a ribbed hem showing along the front,
    // one sleeve hanging over the seat's edge.
    const coral = hex('#e0684e');
    const knitM = mat((x, y, z, lx, ly, lz) => {
      const n = fbm(lx * 30, ly * 30, lz * 60, 2);
      return coral.map((v) => v * (0.9 + n * 0.18));
    }, { tag: 'prop', spec: 0.03 });
    const ribM = mat((x, y, z, lx, ly, lz) => coral.map((v) => v * (Math.sin(ly * 160) > 0 ? 0.82 : 1.0)), { tag: 'prop', spec: 0.03 });
    parts.push(move(box(0.15, 0.17, 0.028, knitM, 0.03), 0.02, 0, 0.51));
    parts.push(move(box(0.14, 0.16, 0.024, knitM, 0.025), 0.03, 0.005, 0.56));
    parts.push(move(box(0.018, 0.16, 0.026, ribM, 0.012), 0.16, 0.005, 0.555)); // the ribbed hem along the fold
    parts.push(move(sphere(0.012, mat('#f0d8b0', { tag: 'prop', spec: 0.5 })), 0.12, -0.06, 0.585)); // a button
    // The sleeve: over the front edge and down.
    parts.push(capsule([0.1, 0.1, 0.56], [0.22, 0.12, 0.52], 0.032, knitM));
    parts.push(capsule([0.22, 0.12, 0.52], [0.25, 0.13, 0.32], 0.03, knitM));
    parts.push(move(cylinder(0.031, -0.025, 0.0, ribM), 0.25, 0.13, 0.32));
  }
  return place(union(parts), { rz: face });
}

/** A terracotta pot (r, h) with a plant: 'basil', 'rosemary', 'geranium', 'stray', or 'none'. */
export function pot({ r = 0.17, h = 0.3, plant = 'geranium', seed = 1, soil = true } = {}) {
  const tc = terracotta('#c06840');
  const parts = [
    frustum(r * 0.75, r, 0, h - 0.04, tc, 0.01),
    move(torus(r + 0.005, 0.03, tc), 0, 0, h - 0.03),
  ];
  if (soil) parts.push(move(cylinder(r - 0.02, -0.04, 0, mat('#5a4030', { tag: 'prop' })), 0, 0, h - 0.04));
  const R = rng(seed);
  const top = h - 0.04;
  if (plant === 'basil') {
    const lf = leaf('#5aa040', { tag: 'prop' });
    for (let i = 0; i < 18; i++) { const a = R() * PI * 2, rr = R() * r * 0.9; parts.push(move(ellipsoid(0.05, 0.04, 0.025, lf), Math.cos(a) * rr, Math.sin(a) * rr, top + 0.05 + R() * 0.14)); }
  } else if (plant === 'rosemary') {
    const lf = leaf('#4a7050', { tag: 'prop' });
    for (let i = 0; i < 16; i++) { const a = R() * PI * 2, rr = R() * r * 0.6, ht = 0.2 + R() * 0.2; parts.push(capsule([Math.cos(a) * rr * 0.4, Math.sin(a) * rr * 0.4, top], [Math.cos(a) * rr * 1.4, Math.sin(a) * rr * 1.4, top + ht], 0.014, lf)); }
    // The stray that blew in and stayed: a little yellow flower.
    parts.push(move(sphere(0.03, mat('#f0d040', { tag: 'prop' })), r * 0.4, -r * 0.3, top + 0.18));
  } else if (plant === 'geranium') {
    const lf = leaf(COLORS.leaf, { tag: 'prop' });
    for (let i = 0; i < 14; i++) { const a = R() * PI * 2, rr = R() * r * 1.0; parts.push(move(ellipsoid(0.065, 0.065, 0.04, lf), Math.cos(a) * rr, Math.sin(a) * rr, top + 0.05 + R() * 0.1)); }
    const bl = mat(R() < 0.6 ? COLORS.bloomRed : COLORS.bloomPink, { tag: 'prop', spec: 0.1 });
    for (let i = 0; i < 6; i++) { const a = R() * PI * 2, rr = R() * r * 0.8; parts.push(move(sphere(0.045, bl), Math.cos(a) * rr, Math.sin(a) * rr, top + 0.16 + R() * 0.08)); }
  }
  return union(parts);
}

/** Two pots with the clothes prop laid across them as a hurdle (3×1 along x, centered on the middle tile). */
export function hurdle({ prop = true } = {}) {
  const parts = [move(pot({ plant: 'geranium', seed: 4, r: 0.16, h: 0.3 }), -1, 0, 0), move(pot({ plant: 'geranium', seed: 7, r: 0.16, h: 0.3 }), 1, 0, 0)];
  if (prop) parts.push(clothesProp([-1.25, 0.02, 0.42], [1.3, -0.02, 0.43]));
  return union(parts);
}

/** The clothes prop: a long, pale wooden pole with a fork at one end. */
export function clothesProp(a, b) {
  const w = wood('#c8a070', { grain: 'x' });
  const dx = b[0] - a[0], dy = b[1] - a[1], dz = b[2] - a[2];
  const L = Math.hypot(dx, dy, dz);
  const ux = dx / L, uy = dy / L, uz = dz / L;
  const end = b;
  return union(
    capsule(a, b, 0.022, w),
    capsule(end, [end[0] + ux * 0.12, end[1] + uy * 0.12 + 0.05, end[2] + uz * 0.12 + 0.04], 0.016, w),
    capsule(end, [end[0] + ux * 0.12, end[1] + uy * 0.12 - 0.05, end[2] + uz * 0.12 + 0.04], 0.016, w),
  );
}

/** Chimney stack (2×1 along x) with two pots in little tin hats. */
export function chimney({ rattle = 0 } = {}) {
  const pl = plaster('#e6e0d4', { axis: 'x', top: 0.9, stain: '#8a8080' });
  const parts = [boxAt(-0.9, -0.36, 0, 0.9, 0.36, 0.9, pl, 0.03), boxAt(-0.95, -0.41, 0.88, 0.95, 0.41, 0.98, mat('#f0eae0', { tag: 'wall' }), 0.03)];
  const tc = terracotta('#b8603a');
  const tin = mat('#9aa0a8', { tag: 'prop', spec: 0.7, shin: 30 });
  for (const [i, px] of [[0, -0.45], [1, 0.45]]) {
    const wob = rattle ? (i ? -1 : 1) * rattle * 0.05 : 0;
    parts.push(move(frustum(0.13, 0.11, 0.98, 1.38, tc, 0.01), px, 0, 0));
    parts.push(move(torus(0.115, 0.022, tc), px, 0, 1.38));
    // Tin hat: a little conical cap on legs.
    parts.push(place(union(
      move(frustum(0.2, 0.02, 1.5, 1.62, tin, 0.005), 0, 0, 0),
      capsule([0.08, 0, 1.38], [0.1, 0, 1.52], 0.008, tin), capsule([-0.08, 0, 1.38], [-0.1, 0, 1.52], 0.008, tin),
    ), { at: [px, 0, 0], ry: wob }));
  }
  return union(parts);
}

/** A wooden clothesline post (1×1) with a crossbar along y. */
export function linePost({ height = 1.9 } = {}) {
  const w = wood('#9a7048', { grain: 'z' });
  return union(
    boxAt(-0.05, -0.05, 0, 0.05, 0.05, height, w, 0.01),
    boxAt(-0.04, -0.2, height - 0.12, 0.04, 0.2, height - 0.04, w, 0.01),
    move(cylinder(0.1, 0, 0.08, limestone('#cbb898'), 0.02), 0, 0, 0),
  );
}

/**
 * Sheets hanging from a line along y between y0 and y1 at height zl.
 * swing: sideways angle (the lurch); t: flutter phase; grey: the morning.
 */
export function sheetsY({ y0 = -1.5, y1 = 1.5, zl = 1.85, t = 0, swing = 0, grey = false, n = 2, drop = 1.25 } = {}) {
  const col = grey ? hex('#b4b0ac') : hex('#f8f6f0');
  const m = mat((x, y, z, lx, ly, lz) => {
    const fold = Math.sin(ly * 22 + t * 4) * 0.5 + 0.5;
    const k = 0.92 + fold * 0.1;
    return [col[0] * k, col[1] * k, col[2] * k];
  }, { tag: 'cloth', spec: 0.05, shin: 8, emit: 0.18 }); // thin cloth: some light comes through
  const lineM = mat('#d8d0c0', { tag: 'cloth' });
  const parts = [capsule([0, y0 - 0.2, zl + 0.02], [0, y1 + 0.2, zl + 0.02], 0.008, lineM)];
  const gap = 0.06, each = (y1 - y0 - gap * (n - 1)) / n;
  for (let i = 0; i < n; i++) {
    const a = y0 + i * (each + gap), b = a + each;
    const sheet = custom((x, y, z) => {
      const s = (z - zl) / -drop; // 0 at the line, 1 at the hem
      const wave = Math.sin(y * 9 + t * 5 + i) * 0.03 * (0.4 + s) + Math.sin(y * 23 + t * 3) * 0.008;
      const off = swing * Math.max(0, zl - z) * 0.6;
      const dx = Math.abs(x - wave - off) - 0.012;
      const dy = Math.max(a - y, y - b);
      const hem = zl - drop - Math.sin((y - a) / each * PI) * 0.04;
      const dz = Math.max(z - zl, hem - z);
      return Math.max(dx, dy, dz) * 0.8;
    }, [-0.3 - Math.abs(swing), a, zl - drop - 0.1, 0.3 + Math.abs(swing), b, zl + 0.02], m);
    parts.push(sheet);
    // Pegs.
    for (const py of [a + 0.06, b - 0.06]) parts.push(boxAt(-0.012, py - 0.008, zl - 0.06, 0.012, py + 0.008, zl + 0.03, mat('#c8a878', { tag: 'cloth' })));
  }
  return union(parts);
}

/** Sheets on a line along x (the back line). */
export function sheetsX(opts) {
  return place(sheetsY(opts), { rz: -PI / 2 });
}

/** A bronze sighting pin: a short post with a slotted vane, set into a wall top. */
export function sightPin() {
  const b = bronze('#b08040');
  return union(
    cylinder(0.025, 0, 0.18, b, 0.005),
    move(box(0.012, 0.05, 0.05, b, 0.004), 0, 0, 0.2),
    move(cylinder(0.05, 0, 0.02, b, 0.005), 0, 0, 0),
  );
}

/** The lemon tree: trunk at the origin, canopy about 3 tiles across. Its three lemons are drawn. */
export function lemonTree({ part = 'all', t = 0 } = {}) {
  const bark = mat((x, y, z, lx, ly, lz) => { const n = vnoise(lx * 30, ly * 30, lz * 6); const c = hex('#7a6048'); return [c[0] * (0.8 + n * 0.3), c[1] * (0.8 + n * 0.3), c[2] * (0.8 + n * 0.3)]; }, { tag: 'tree', spec: 0.05 });
  const parts = [];
  if (part !== 'canopy') {
    parts.push(roundCone([0, 0, 0], [0.05, -0.04, 1.2], 0.11, 0.07, bark));
    parts.push(roundCone([0.05, -0.04, 1.15], [0.35, -0.25, 1.75], 0.06, 0.035, bark));
    parts.push(roundCone([0.05, -0.04, 1.15], [-0.3, 0.2, 1.8], 0.06, 0.035, bark));
    parts.push(roundCone([0.05, -0.04, 1.2], [0.1, 0.3, 1.95], 0.055, 0.03, bark));
    // A ring of cobbles left out around the trunk: a little earth bed.
    parts.push(move(cylinder(0.32, -0.01, 0.03, mat('#6a5038', { tag: 'tree' }), 0.02), 0, 0, 0));
  }
  if (part !== 'trunk') {
    const R = rng(11);
    // Glossy, dark lemon leaves in clumps, lighter where the clumps catch the sun.
    const lf = mat((x, y, z, lx, ly, lz) => {
      const n = vnoise(x * 26, y * 26, z * 26), clump = vnoise(x * 4, y * 4, z * 4);
      return mix(mix(hex('#2e6428'), hex('#5e9a3a'), n), hex('#7aae48'), Math.max(0, clump - 0.6));
    }, { tag: 'leaf', spec: 0.35, shin: 22 });
    const blobs = [];
    for (let i = 0; i < 38; i++) {
      const a = R() * PI * 2, rr = Math.sqrt(R()) * 1.05, h = 1.7 + R() * 0.85 - rr * 0.3;
      blobs.push(move(sphere(0.24 + R() * 0.16, lf), Math.cos(a) * rr, Math.sin(a) * rr, h));
    }
    // Lumpy foliage: blobs smoothed together, then roughened by noise.
    const canopy = smooth(0.18, blobs);
    const rough = {
      b: canopy.b.map((v, i) => (i < 3 ? v - 0.1 : v + 0.1)),
      dist(x, y, z) { return canopy.dist(x, y, z) + (vnoise(x * 9 + t, y * 9, z * 9) - 0.5) * 0.1 + (vnoise(x * 24, y * 24, z * 24) - 0.5) * 0.05; },
      near(x, y, z) { return canopy.near(x, y, z); },
    };
    parts.push(rough);
    const lemon = mat('#f4d23a', { tag: 'leaf', spec: 0.5, shin: 20 });
    for (const [x, y, z] of [[0.75, 0.55, 1.75], [-0.2, 0.95, 1.9], [0.95, -0.2, 2.1]]) parts.push(move(ellipsoid(0.07, 0.055, 0.055, lemon), x, y, z));
  }
  return union(parts);
}

/** The chess table (1×1) with its board. state: 'plug' | 'pepper' | 'slid'. */
export function chessTable({ state = 'plug', t = 0 } = {}) {
  const w = wood('#8a5a38', { grain: 'x' });
  const top = 0.72;
  const board = mat((x, y, z, lx, ly, lz) => {
    const i = Math.floor((lx + 0.2) / 0.05), j = Math.floor((ly + 0.2) / 0.05);
    if (Math.abs(lx) > 0.2 || Math.abs(ly) > 0.2) return hex('#6a4028');
    return (i + j) % 2 ? hex('#3a2a20') : hex('#e0c898');
  }, { tag: 'prop', spec: 0.3, shin: 24 });
  const parts = [
    move(box(0.25, 0.25, 0.025, w, 0.01), 0, 0, top - 0.025),
    move(box(0.22, 0.22, 0.008, board, 0.004), 0, 0, top + 0.005),
    cylinder(0.04, 0.05, top - 0.04, w, 0.01),
    move(cylinder(0.18, 0, 0.05, w, 0.02), 0, 0, 0),
  ];
  const white = mat('#ece4d0', { tag: 'prop', spec: 0.4, shin: 30 });
  const black = mat('#2a2228', { tag: 'prop', spec: 0.5, shin: 30 });
  const zb = top + 0.013;
  const pawn = (m, x, y) => union(move(cylinder(0.014, 0, 0.022, m, 0.004), x, y, zb), move(sphere(0.012, m), x, y, zb + 0.032));
  const sq = (i, j) => [-0.2 + 0.025 + i * 0.05, -0.2 + 0.025 + j * 0.05];
  const slid = state === 'slid';
  // A thinned-out endgame: a few pawns each, the improvised pieces in the middle.
  const layout = [[1, 1, white], [2, 2, white], [5, 1, white], [6, 6, black], [4, 6, black], [1, 5, black]];
  for (const [i, j, m] of layout) { const [x, y] = sq(slid ? 0 : i, j); parts.push(pawn(m, x, y)); }
  // Thimble queen (white, silver), cork bishop.
  { const [x, y] = sq(slid ? 0 : 3, 3); parts.push(move(frustum(0.016, 0.013, 0, 0.035, mat('#c8c8d0', { tag: 'prop', spec: 0.9, shin: 50 }), 0.004), x, y, zb)); }
  { const [x, y] = sq(slid ? 0 : 5, 4); parts.push(move(frustum(0.015, 0.012, 0, 0.04, mat('#c89a68', { tag: 'prop', spec: 0.1 }), 0.005), x, y, zb)); }
  // The black king: the bath plug, or the pepper mill.
  const [kx, ky] = sq(slid ? 1 : 4, 5);
  if (state === 'plug') {
    parts.push(move(frustum(0.022, 0.026, 0, 0.03, brass(), 0.004), kx, ky, zb));
    parts.push(move(torus(0.01, 0.003, brass()), kx, ky, zb + 0.04));
  } else {
    // Pepper mill: tall, black, dignified.
    const pm = mat('#1e1a20', { tag: 'prop', spec: 0.6, shin: 30 });
    parts.push(move(union(frustum(0.024, 0.018, 0, 0.09, pm, 0.006), move(sphere(0.022, pm), 0, 0, 0.1), move(sphere(0.008, mat('#c0c0c8', { tag: 'prop', spec: 0.9 })), 0, 0, 0.125)), kx, ky, zb));
  }
  void t;
  return union(parts);
}

/** A plain wooden chair (Gerald's) facing `face` (radians, 0 = +x). */
export function woodChair({ face = 0 } = {}) {
  const w = wood('#94603a', { grain: 'z' });
  const parts = [move(box(0.2, 0.2, 0.025, w, 0.01), 0, 0, 0.45)];
  for (const sx of [-1, 1]) for (const sy of [-1, 1]) parts.push(boxAt(sx * 0.17 - 0.02, sy * 0.17 - 0.02, 0, sx * 0.17 + 0.02, sy * 0.17 + 0.02, 0.45, w));
  for (const sy of [-1, 1]) parts.push(boxAt(-0.21, sy * 0.17 - 0.02, 0.45, -0.17, sy * 0.17 + 0.02, 0.95, w));
  parts.push(boxAt(-0.21, -0.19, 0.78, -0.17, 0.19, 0.92, w, 0.01));
  return place(union(parts), { rz: face });
}

/** The Old Man's three-legged stool. */
export function stool() {
  const w = wood('#7a5032', { grain: 'z' });
  const parts = [cylinder(0.17, 0.42, 0.46, w, 0.015)];
  for (let i = 0; i < 3; i++) { const a = i * PI * 2 / 3; parts.push(capsule([Math.cos(a) * 0.1, Math.sin(a) * 0.1, 0.43], [Math.cos(a) * 0.17, Math.sin(a) * 0.17, 0.0], 0.02, w)); }
  return union(parts);
}

/** The well (2×2): a ring of fitted stones with an iron grate across the top. */
export function well({ breath = 0 } = {}) {
  const R = 0.78, h = 0.62;
  const stone = mat((x, y, z, lx, ly, lz) => {
    const a = Math.atan2(y, x), course = Math.floor(z / 0.155);
    const blk = Math.floor((a / (2 * PI) + 0.5) * 14 + (course % 2) * 0.5);
    const id = hash3(blk, course, 3);
    const fa = ((a / (2 * PI) + 0.5) * 14 + (course % 2) * 0.5) % 1, fz = (z / 0.155) % 1;
    const joint = Math.min(fa, 1 - fa) < 0.04 || Math.min(fz, 1 - fz) < 0.05;
    const c = mix(hex('#cbb898'), hex('#e0d0b0'), id);
    const n = fbm(x * 18, y * 18, z * 18, 2);
    const k = (joint ? 0.72 : 1) * (0.92 + n * 0.12);
    return [c[0] * k, c[1] * k, c[2] * k];
  }, { tag: 'prop', spec: 0.05 });
  const ring = subtract(cylinder(R, 0, h, stone, 0.03), cylinder(R - 0.2, -0.1, h + 0.1, stone), stone);
  const coping = subtract(cylinder(R + 0.04, h - 0.06, h + 0.04, limestone('#e4d6b8'), 0.04), cylinder(R - 0.22, h - 0.2, h + 0.2, null), limestone('#d8c8a8'));
  const ironM = iron('#2c2c38');
  const bars = [];
  for (let i = -4; i <= 4; i++) {
    const x = i * 0.13, half = Math.sqrt(Math.max(0, (R - 0.12) ** 2 - x * x));
    bars.push(capsule([x, -half, h + 0.06], [x, half, h + 0.06], 0.018, ironM));
  }
  for (const y of [-0.3, 0.3]) bars.push(capsule([-0.6, y, h + 0.08], [0.6, y, h + 0.08], 0.02, ironM));
  // Darkness inside.
  const dark = move(cylinder(R - 0.2, 0.02, h - 0.3, mat('#100c14', { tag: 'prop' })), 0, 0, 0);
  void breath;
  return union(ring, coping, dark, ...bars);
}

/** A stone bench (2×1 along x). */
export function bench() {
  const st = limestone('#dcc8a6', { tag: 'prop' });
  return union(
    boxAt(-0.85, -0.22, 0.38, 0.85, 0.22, 0.46, st, 0.03),
    boxAt(-0.75, -0.17, 0, -0.55, 0.17, 0.38, st, 0.02),
    boxAt(0.55, -0.17, 0, 0.75, 0.17, 0.38, st, 0.02),
  );
}

/** The piano, wedged at an angle at the top of the Squeeze (2×2). */
export function piano({ angle = 0.35, tilt = 0.08 } = {}) {
  const case_ = mat((x, y, z, lx, ly, lz) => {
    const g = vnoise(lx * 4, ly * 60, lz * 4);
    const c = hex('#4a2a22');
    return [c[0] * (0.85 + g * 0.25), c[1] * (0.85 + g * 0.25), c[2] * (0.85 + g * 0.25)];
  }, { tag: 'prop', spec: 0.7, shin: 40 });
  const keysM = mat((x, y, z, lx, ly, lz) => {
    const k = ((ly + 1) * 26) % 1;
    if (lz > 0.005 && Math.abs((ly * 26 + 0.5) % 1.0 - 0.5) < 0.18 && Math.floor(ly * 26) % 7 !== 2) return hex('#1a1418');
    return k < 0.08 ? hex('#a8a090') : hex('#f0ead8');
  }, { tag: 'prop', spec: 0.4 });
  const label = mat('#f0e6c8', { tag: 'prop' });
  const parts = [
    boxAt(-0.32, -0.75, 0.12, 0.32, 0.75, 1.32, case_, 0.03), // body
    boxAt(-0.36, -0.78, 1.3, 0.36, 0.78, 1.36, case_, 0.02), // lid
    boxAt(0.32, -0.7, 0.66, 0.58, 0.7, 0.72, case_, 0.015), // key bed
    boxAt(0.33, -0.66, 0.72, 0.55, 0.66, 0.75, keysM, 0.005),
    boxAt(0.32, -0.7, 0.75, 0.38, 0.7, 0.95, case_, 0.01), // fallboard back
    // Legs and casters.
    boxAt(0.48, -0.68, 0.12, 0.56, -0.6, 0.66, case_, 0.02), boxAt(0.48, 0.6, 0.12, 0.56, 0.68, 0.66, case_, 0.02),
    boxAt(-0.3, -0.74, 0, 0.3, 0.74, 0.14, case_, 0.02),
    // The delivery label and the note on the lid.
    boxAt(0.32, 0.2, 1.0, 0.335, 0.5, 1.15, label),
    place(boxAt(-0.12, -0.18, 0, 0.12, 0.18, 0.006, mat('#f8f4e8', { tag: 'prop' })), { at: [0, 0.1, 1.36], rz: 0.2 }),
  ];
  return place(union(parts), { rz: angle, rx: tilt });
}

/** A terracotta pent roof sloping down toward +y over a 1×2 footprint (from y = −1 to +1), rising `rise`. */
export function pentRoof({ rise = 0.6, len = 1 } = {}) {
  const tile = mat((x, y, z, lx, ly, lz) => {
    // Barrel tiles: ridges along the slope, courses across it.
    const c = hex('#c4643e');
    const ridge = Math.abs(Math.sin((x + 10) * PI * 5));
    const course = ((y + 10) * 4.5) % 1;
    const n = vnoise(Math.floor((x + 10) * 5), Math.floor((y + 10) * 4.5), 3);
    let k = (0.72 + ridge * 0.3) * (course > 0.88 ? 0.75 : 1) * (0.9 + n * 0.2);
    return [c[0] * k, c[1] * k, c[2] * k];
  }, { tag: 'roof', spec: 0.12, shin: 12 });
  const slope = rise / 2;
  const roof = custom((x, y, z) => {
    const top = rise - (y + 1) * slope;
    const dz = (z - top) / Math.hypot(1, slope);
    const ridges = Math.abs(Math.sin((x + 10) * PI * 5)) * 0.025;
    return Math.max(dz - ridges, -0.06 - dz, Math.abs(x) - len / 2, Math.abs(y) - 1.06);
  }, [-len / 2, -1.06, -0.2, len / 2, 1.06, rise + 0.05], tile);
  return roof;
}

export { TUB };
