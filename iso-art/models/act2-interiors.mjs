// Act 2's interiors: the Shop's furniture, the Archive under the Blue Dome and
// its crypt, and the lighthouse's lamp room. Each builder returns an SDF node
// with its origin at the center of its footprint on the floor (z = 0), x east,
// y south. Wall-hung and wall-standing pieces put their backs on the north
// wall's plane, y = −0.5 of their row (as in Cheryl's flat).

import { box, boxAt, union, subtract, move, place, cylinder, sphere, capsule, custom, intersect, frustum, ellipsoid, torus, roundCone, smooth, NEAR } from '../lib/sdf.mjs';
import { mat, hex, mix } from '../lib/render.mjs';
import { limestone, wood, iron, brass, bronze, fbm, vnoise } from './materials.mjs';
import { hash3, rng } from '../lib/noise.mjs';
import { PAL, seeThrough, tint } from './act2-materials.mjs';

const PI = Math.PI;
const m = (c, o = {}) => mat(c, { tag: 'prop', ...o });
const china = () => m('#f4f2ec', { spec: 0.8, shin: 40 });

/** Bend a node along y by f(x) (small slopes only), so a straight case follows a curved wall. */
function bendY(node, f) {
  const k = 0.9;
  return {
    b: [node.b[0], node.b[1] - 0.6, node.b[2], node.b[3], node.b[4] + 0.6, node.b[5]],
    dist(x, y, z) { return node.dist(x, y - f(x), z) * k; },
    near(x, y, z) {
      const saved = NEAR.d;
      NEAR.d = saved / k;
      const d = node.near(x, y - f(x), z) * k;
      NEAR.d = Math.min(saved, NEAR.d * k);
      return d;
    },
  };
}

// ---------------------------------------------------------------------------
// The Shop

/** One shop item standing on a shelf at (x, y, z): 'lantern', 'oil', 'polish', 'string'. */
function shopItem(kind, x, y, z, R) {
  const b = brass();
  if (kind === 'lantern') {
    const gl = m('#c8dce0', { spec: 1.2, shin: 60, emit: 0.15 });
    return move(union(
      cylinder(0.065, 0, 0.03, b, 0.008),
      cylinder(0.05, 0.03, 0.17, gl, 0.01),
      ...[0, 1, 2, 3].map((i) => capsule([Math.cos(i * PI / 2 + 0.6) * 0.058, Math.sin(i * PI / 2 + 0.6) * 0.058, 0.03], [Math.cos(i * PI / 2 + 0.6) * 0.058, Math.sin(i * PI / 2 + 0.6) * 0.058, 0.17], 0.007, b)),
      frustum(0.068, 0.025, 0.17, 0.23, b, 0.006),
      place(torus(0.03, 0.006, b), { at: [0, 0, 0.26], rx: PI / 2 }),
    ), x, y, z);
  }
  if (kind === 'oil') {
    const c = ['#b83a30', '#3a6a48', '#c89a38'][Math.floor(R() * 3)];
    return move(union(
      boxAt(-0.05, -0.04, 0, 0.05, 0.04, 0.16, m(c, { spec: 0.5, shin: 24 }), 0.008),
      move(cylinder(0.014, 0.16, 0.2, b), 0.025, 0, 0),
      capsule([-0.03, 0, 0.16], [-0.03, 0, 0.21], 0.006, iron()),
    ), x, y, z);
  }
  if (kind === 'polish') {
    // A short stack of flat round tins with printed lids.
    const lid = m('#d8b048', { spec: 0.8, shin: 30 });
    const n = 1 + Math.floor(R() * 3);
    return union(Array.from({ length: n }, (_, i) => move(union(cylinder(0.045, 0, 0.032, m('#2e4a7a', { spec: 0.6 }), 0.006), cylinder(0.046, 0.026, 0.036, lid, 0.006)), x + (R() - 0.5) * 0.01, y, z + i * 0.037)));
  }
  // A ball of string.
  const s = mat((wx, wy, wz, lx, ly, lz) => tint(hex('#e6d8b4'), 0.85 + Math.abs(Math.sin((lx + lz) * 90)) * 0.2), { tag: 'prop', spec: 0.05 });
  return move(sphere(0.055, s), x, y, z + 0.055);
}

/** The Shop's wall shelves (w tiles wide, against the north wall): lanterns, lamp oil, brass polish, string. */
export function shopShelving(w = 4, { seed = 3 } = {}) {
  const wd = wood('#7a5030', { grain: 'z' });
  const hw = w / 2, y0 = -0.5, y1 = -0.12, top = 2.1;
  const parts = [
    boxAt(-hw, y0, 0, hw, y0 + 0.03, top, wood('#6a4428', { grain: 'x' })), // back boards
    boxAt(-hw - 0.02, y0, top - 0.02, hw + 0.02, y1 + 0.04, top + 0.06, wd, 0.012), // cornice
    boxAt(-hw, y0, 0, hw, y1, 0.12, wd, 0.01), // plinth
  ];
  for (let i = 0; i <= w; i++) parts.push(boxAt(-hw + i - 0.025 - (i === w ? 0.0 : 0) + (i === 0 ? 0.025 : i === w ? -0.025 : 0), y0, 0, -hw + i + 0.025 + (i === 0 ? 0.025 : i === w ? -0.025 : 0), y1, top, wd, 0.008));
  const R = rng(seed);
  const kinds = ['lantern', 'oil', 'polish', 'string'];
  const shelves = [0.12, 0.62, 1.12, 1.6];
  shelves.forEach((z, si) => {
    if (si) parts.push(boxAt(-hw, y0, z - 0.03, hw, y1 + 0.01, z, wd, 0.006));
    // Each shelf favors one stock, a few of another; all display, nothing missing.
    const main = kinds[(si + seed) % 4];
    for (let x = -hw + 0.12; x < hw - 0.08; x += 0.17 + R() * 0.03) {
      if (Math.abs(((x + hw) % 1)) < 0.08) continue;
      const k = R() < 0.75 ? main : kinds[Math.floor(R() * 4)];
      parts.push(shopItem(k, x, (y0 + y1) / 2 + 0.03, z, R));
    }
  });
  return union(parts);
}

/** The counter (5×1 along x), polished by a lifetime of not selling things, with the shop bell at its east end. */
export function shopCounter({ glint = 0 } = {}) {
  const body = wood('#8a5634', { grain: 'z' });
  const topM = mat((x, y, z) => tint(hex('#6e3e24'), 0.85 + vnoise(x * 3, y * 60, 1) * 0.25), { tag: 'prop', spec: 0.9, shin: 50 });
  const panel = wood('#9a643c', { grain: 'z' });
  const parts = [
    boxAt(-2.4, -0.3, 0, 2.4, 0.32, 0.9, body, 0.015),
    boxAt(-2.47, -0.36, 0.9, 2.47, 0.4, 0.96, topM, 0.02),
    boxAt(-2.42, 0.28, 0, 2.42, 0.36, 0.08, wood('#5a3420', { grain: 'x' }), 0.01), // kick board
  ];
  // Raised panels along the front (south) face.
  for (let i = 0; i < 6; i++) parts.push(boxAt(-2.3 + i * 0.78, 0.32, 0.16, -2.3 + i * 0.78 + 0.68, 0.345, 0.8, panel, 0.015));
  // The bell: a brass dome on a little black base, with its plunger.
  const b = mat('#e0b048', { tag: 'prop', spec: 1.2 + glint, shin: 50 + glint * 40, emit: glint * 0.25 });
  parts.push(move(union(
    cylinder(0.075, 0, 0.025, m('#2a2228', { spec: 0.6 }), 0.008),
    intersect(move(sphere(0.065, b), 0, 0, 0.025), boxAt(-0.1, -0.1, 0.025, 0.1, 0.1, 0.2, b)),
    capsule([0, 0, 0.08], [0, 0, 0.11], 0.008, b),
    move(sphere(0.014, b), 0, 0, 0.115),
  ), 2.15, 0.05, 0.96));
  // A ledger and a pencil, the business of not selling.
  parts.push(place(boxAt(-0.16, -0.12, 0, 0.16, 0.12, 0.025, m('#2e4058', { spec: 0.2 }), 0.006), { at: [-0.9, 0, 0.96], rz: 0.15 }));
  parts.push(place(boxAt(-0.15, -0.11, 0.025, 0.15, 0.11, 0.03, m('#efe6cc')), { at: [-0.9, 0, 0.96], rz: 0.15 }));
  parts.push(capsule([-0.4, 0.1, 0.97], [-0.25, 0.02, 0.97], 0.006, m('#d8a030')));
  return union(parts);
}

/** The marble jar on its little stand: every marble rolled to the east side. The jar is level. */
export function marbleJar() {
  const w = wood('#7a4e30', { grain: 'z' });
  const z0 = 0.5, r = 0.17, h = 0.34;
  const R = rng(17);
  const cols = ['#e04838', '#3a78d8', '#f8c838', '#48b060', '#f0ece4', '#9848b8', '#f88838'];
  const marbles = [];
  // Packed against the east wall of the jar, heaped up that side; the west half bare.
  const mr = 0.026;
  for (let l = 0; l < 5; l++) {
    for (let gx = -r; gx < r; gx += mr * 1.9) for (let gy = -r; gy < r; gy += mr * 1.9) {
      const x = gx + (l % 2) * mr + (R() - 0.5) * 0.01, y = gy + (l % 2) * mr + (R() - 0.5) * 0.01;
      if (Math.hypot(x, y) > r - mr - 0.012) continue;
      if (x < 0.02 + l * 0.032) continue;
      marbles.push([x, y, z0 + 0.03 + mr + l * mr * 1.7, mr, hex(cols[Math.floor(R() * cols.length)])]);
    }
  }
  const glassFilm = mix(hex('#b8d8d8'), hex('#e8f4f0'), 0.3);
  const under = (x, y, z) => {
    for (const [mx, my, mz, mr, c] of marbles) {
      const d = Math.hypot(x - mx, y - my, z - mz);
      if (d < mr) return tint(c, 0.75 + (z - mz) / mr * 0.3 + (x - y - mx + my) / mr * -0.1);
    }
    if (z < z0 + 0.03 && Math.hypot(x, y) < r) return hex('#a8c0c0');
    return null;
  };
  const glassM = seeThrough(glassFilm, under, { k: 0.22, depth: 0.45, steps: 50, emit: 0.1, spec: 1.4, shin: 70 });
  const parts = [
    // A little round table, three legs.
    cylinder(0.25, z0 - 0.04, z0, w, 0.012),
    cylinder(0.2, z0 - 0.1, z0 - 0.04, w, 0.01),
    move(cylinder(r, 0, h, glassM, 0.035), 0, 0, z0),
    // The neck and a cork stopper.
    move(cylinder(r - 0.04, 0, 0.03, glassM, 0.01), 0, 0, z0 + h - 0.01),
    move(cylinder(r - 0.05, 0, 0.05, m('#c09868', { spec: 0.1 }), 0.012), 0, 0, z0 + h + 0.015),
  ];
  for (let i = 0; i < 3; i++) { const a = PI / 2 + i * 2 * PI / 3; parts.push(capsule([Math.cos(a) * 0.15, Math.sin(a) * 0.15, z0 - 0.06], [Math.cos(a) * 0.2, Math.sin(a) * 0.2, 0], 0.018, w)); }
  return union(parts);
}

/** The window display stand (2×1 along x): a stepped plinth draped in cobalt; the straw hat or the telescope. */
export function displayStand(item = 'hat') {
  const w = wood('#8a5634', { grain: 'x' });
  const cloth = mat((x, y, z) => tint(hex('#2e4e8c'), 0.85 + vnoise(x * 20, y * 20, z * 20) * 0.2), { tag: 'prop', spec: 0.15, shin: 10 });
  const parts = [
    boxAt(-0.85, -0.32, 0, 0.85, 0.32, 0.42, w, 0.02),
    boxAt(-0.88, -0.35, 0.42, 0.88, 0.35, 0.46, cloth, 0.02),
    // The cloth hangs a little over the front edge.
    boxAt(-0.88, 0.33, 0.34, 0.88, 0.355, 0.46, cloth, 0.01),
  ];
  if (item === 'hat') {
    // A turned wooden hat stand, so the hat sits up where the window shows it.
    const tw = wood('#a87448', { grain: 'z' });
    parts.push(move(union(cylinder(0.11, 0, 0.03, tw, 0.01), cylinder(0.022, 0.03, 0.4, tw, 0.006), move(ellipsoid(0.1, 0.1, 0.07, tw), 0, 0, 0.42)), -0.3, -0.05, 0.46));
    const straw = mat((x, y, z, lx, ly, lz) => {
      const a = Math.atan2(ly, lx), rr = Math.hypot(lx, ly);
      const weave = (Math.sin(a * 60) > 0) !== (Math.sin(rr * 120) > 0);
      return tint(hex('#e8cc84'), weave ? 0.9 : 1.04);
    }, { tag: 'prop', spec: 0.15, shin: 12 });
    const hat = union(
      // A wide, slightly drooping brim.
      custom((x, y, z) => {
        const rr = Math.hypot(x, y);
        const zz = z + Math.max(0, rr - 0.14) ** 2 * 0.5;
        return Math.max(rr - 0.34, Math.abs(zz) - 0.008) * 0.9;
      }, [-0.35, -0.35, -0.06, 0.35, 0.35, 0.02], straw),
      move(ellipsoid(0.135, 0.12, 0.11, straw), 0, 0, 0.0),
      move(cylinder(0.133, 0.005, 0.05, m(PAL.cobalt, { spec: 0.3 }), 0.01), 0, 0, 0),
    );
    parts.push(place(hat, { at: [-0.3, -0.05, 0.96], rx: 0.18, ry: -0.08 }));
    // The coral price card on a little wire stand, turned to the street.
    const card = mat((x, y, z, lx, ly, lz) => (Math.abs(lz - 0.06) < 0.012 && Math.sin(lx * 160) > -0.2 && Math.abs(lx) < 0.05 ? hex('#5a2420') : hex('#e87860')), { tag: 'prop', spec: 0.1 });
    parts.push(place(union(boxAt(-0.08, -0.004, 0.0, 0.08, 0.004, 0.11, card), capsule([0, -0.01, -0.08], [0, -0.01, 0.0], 0.005, iron())), { at: [0.38, 0.12, 0.54], rx: -0.2, rz: -0.6 }));
  } else {
    // The Keeper's telescope on two small wooden cradles, angled up toward the window (south-east). No card: curated, not for sale.
    const b = mat('#dcac48', { tag: 'prop', spec: 1.3, shin: 60 });
    const A = [-0.55, -0.12, 0.6];
    const d = (() => { const v = [1, 0.32, 0.32]; const l = Math.hypot(...v); return v.map((c) => c / l); })();
    const P = (t) => [A[0] + d[0] * t, A[1] + d[1] * t, A[2] + d[2] * t];
    parts.push(capsule(P(0.06), P(0.5), 0.055, b), capsule(P(0.5), P(0.82), 0.046, b), capsule(P(0.82), P(1.08), 0.037, b));
    for (const [t, r] of [[0.1, 0.062], [0.48, 0.062], [0.8, 0.052], [1.06, 0.043]]) parts.push(capsule(P(t - 0.015), P(t + 0.015), r, b));
    parts.push(capsule(P(-0.04), P(0.06), 0.022, b)); // eyepiece
    parts.push(move(sphere(0.04, m('#1a2838', { spec: 1.8, shin: 90 })), ...P(1.09))); // the objective
    const cw = wood('#a8784c', { grain: 'x' });
    for (const t of [0.22, 0.72]) {
      const [cx, cy, cz] = P(t);
      parts.push(subtract(place(boxAt(-0.04, -0.08, 0.46 - cz + 0.0, 0.04, 0.08, 0.0, cw, 0.01), { at: [cx, cy, cz], rz: Math.atan2(d[1], d[0]) }),
        place(capsule([-0.3, 0, 0], [0.3, 0, 0], 0.056, null), { at: [cx, cy, cz], rz: Math.atan2(d[1], d[0]), ry: -Math.asin(d[2]) }), cw));
    }
  }
  return union(parts);
}

/** The banjo barometer on the north wall, stuck on FAIR for nine years (mounted at y = −0.5). */
export function barometer() {
  const w = mat((x, y, z) => tint(hex('#5a3020'), 0.85 + vnoise(x * 4, z * 60, 2) * 0.25), { tag: 'prop', spec: 0.8, shin: 40 });
  const b = brass();
  const face = mat((x, y, z) => {
    const dx = x, dz = z - 1.25, rr = Math.hypot(dx, dz), a = Math.atan2(dx, dz);
    if (rr > 0.115) return hex('#c8a040');
    // Ticks round the top two-thirds, and three bands of lettering (FAIR in the middle-right).
    if (rr > 0.09 && Math.abs(a) < 2.2 && Math.abs(((a * 8 / PI) + 40) % 1 - 0.5) > 0.38) return hex('#2a2228');
    if (rr > 0.055 && rr < 0.075 && Math.abs(a - 0.9) < 0.3 && Math.sin(a * 60) > 0) return hex('#2a2228');
    if (rr > 0.055 && rr < 0.075 && Math.abs(a + 0.9) < 0.3 && Math.sin(a * 60) > 0) return hex('#6a6070');
    return hex('#f0e6cc');
  }, { tag: 'prop', spec: 0.6, shin: 40 });
  const y0 = 0;
  const parts = [
    // The banjo case: a round body and a long neck with a thermometer.
    move(place(cylinder(0.17, 0, 0.05, w, 0.02), { rx: -PI / 2 }), 0, y0, 1.25),
    boxAt(-0.055, y0, 1.38, 0.055, y0 + 0.045, 1.8, w, 0.02),
    move(place(cylinder(0.07, 0, 0.045, w, 0.02), { rx: -PI / 2 }), 0, y0, 1.82),
    move(place(cylinder(0.125, 0, 0.012, face), { rx: -PI / 2 }), 0, y0 + 0.05, 1.25),
    move(place(torus(0.128, 0.01, b), { rx: PI / 2 }), 0, y0 + 0.062, 1.25),
    // The needle, pointing at FAIR.
    capsule([0, y0 + 0.068, 1.25], [Math.sin(0.9) * 0.085, y0 + 0.068, 1.25 + Math.cos(0.9) * 0.085], 0.0045, m('#1a1418', { spec: 0.6 })),
    move(sphere(0.01, b), 0, y0 + 0.07, 1.25),
    // The thermometer in the neck.
    boxAt(-0.012, y0 + 0.045, 1.45, 0.012, y0 + 0.05, 1.74, m('#e8e4dc')),
    boxAt(-0.004, y0 + 0.05, 1.47, 0.004, y0 + 0.054, 1.58, m('#c03030')),
    move(sphere(0.013, m('#c03030')), 0, y0 + 0.05, 1.47),
  ];
  // Built at the origin's plane, then hung on the north wall (y = −0.5) at full size.
  return place(union(parts), { at: [0, -0.5, -0.45], s: 1.45 });
}

// ---------------------------------------------------------------------------
// The Archive

const BOOKS = ['#7a3028', '#4a3020', '#2e4a3a', '#8a6a3a', '#3a3a5a', '#a04838', '#5a2a30', '#c8b088', '#6a5030'];

/** A run of books along x from x0 to x1 standing on z, spines facing +y at y1, depth back to y0. */
function books(x0, x1, y0, y1, z, R, { hMin = 0.22, hMax = 0.34, gap = 0.1 } = {}) {
  const parts = [];
  let x = x0;
  while (x < x1 - 0.03) {
    const bw = 0.03 + R() * 0.045, bh = hMin + R() * (hMax - hMin);
    if (R() < gap) { // a gap, or a book lying flat
      if (R() < 0.5 && x + 0.26 < x1) { parts.push(boxAt(x, y0 + 0.02, z, x + 0.24, y1 - 0.02, z + 0.04, m(BOOKS[Math.floor(R() * BOOKS.length)], { spec: 0.2 }), 0.006)); x += 0.26; }
      else x += 0.05;
      continue;
    }
    const lean = R() < 0.06 ? 0.15 : 0;
    const col = hex(BOOKS[Math.floor(R() * BOOKS.length)]);
    const spine = mat((wx, wy, wz, lx, ly, lz) => {
      const t = (wz - z) / bh;
      return (Math.abs(t - 0.82) < 0.03 || Math.abs(t - 0.18) < 0.03) ? hex('#c8a048') : col;
    }, { tag: 'prop', spec: 0.25, shin: 16 });
    const bk = boxAt(-bw / 2 + 0.002, y0, 0, bw / 2 - 0.002, y1 - (R() * 0.03), bh, spine, 0.006);
    parts.push(lean ? place(bk, { at: [x + bw / 2, 0, z], ry: lean }) : move(bk, x + bw / 2, 0, z));
    x += bw + (lean ? 0.04 : 0);
  }
  return parts;
}

/**
 * The curved wall bookcase (4×1, against the north wall), 2.2 m tall, concave
 * to follow the round room: its outer end ('l' = west, 'r' = east) turns
 * forward into the room.
 */
export function wallShelf(outer = 'l', { seed = 4 } = {}) {
  const wd = wood('#5e3a22', { grain: 'z' });
  const R = rng(seed);
  const top = 2.2, y0 = -0.48, y1 = -0.12;
  const parts = [boxAt(-2, y0 - 0.02, 0, 2, y0 + 0.02, top, wood('#4a2c1a', { grain: 'x' }))];
  parts.push(boxAt(-2.02, y0 - 0.02, top, 2.02, y1 + 0.05, top + 0.1, wd, 0.02)); // cornice
  parts.push(boxAt(-2.02, y0 - 0.02, top - 0.04, 2.02, y1 + 0.07, top + 0.02, wood('#6a4428', { grain: 'x' }), 0.015));
  parts.push(boxAt(-2, y0, 0, 2, y1 + 0.02, 0.1, wd, 0.01));
  for (let i = 0; i <= 4; i++) parts.push(boxAt(-2 + i - 0.03 + (i === 0 ? 0.03 : 0) - (i === 4 ? 0.03 : 0), y0, 0, -2 + i + 0.03 + (i === 0 ? 0.03 : 0) - (i === 4 ? 0.03 : 0), y1 + 0.03, top, wd, 0.008));
  for (const z of [0.1, 0.52, 0.94, 1.36, 1.78]) {
    if (z > 0.1) parts.push(boxAt(-2, y0, z - 0.03, 2, y1 + 0.02, z, wd, 0.006));
    for (let i = 0; i < 4; i++) parts.push(...books(-2 + i + 0.04, -1 + i - 0.04, y0 + 0.02, y1 - 0.01, z, R));
  }
  // A brass bay label on each upright, and a little rolling ladder rail.
  for (let i = 0; i < 4; i++) parts.push(boxAt(-1.5 + i - 0.05, y1 + 0.021, top + 0.02, -1.5 + i + 0.05, y1 + 0.06, top + 0.07, brass(), 0.004));
  const s = outer === 'l' ? -1 : 1;
  // The bend: the outer end comes forward 0.45 m along a parabola.
  return bendY(union(parts), (x) => 0.45 * Math.max(0, (s * x + 2) / 4) ** 2 * (1) * 1 + 0 * x);
}

/** A freestanding double-sided bookcase (2×1 along x), about chest high: Ottilie's monographs. */
export function shelfFree({ seed = 6 } = {}) {
  const wd = wood('#5e3a22', { grain: 'z' });
  const R = rng(seed);
  const top = 1.45;
  const parts = [
    boxAt(-0.9, -0.02, 0.08, 0.9, 0.02, top, wood('#4a2c1a', { grain: 'x' })),
    boxAt(-0.94, -0.26, top, 0.94, 0.26, top + 0.05, wd, 0.015),
    boxAt(-0.9, -0.24, 0, 0.9, 0.24, 0.1, wd, 0.01),
    boxAt(-0.94, -0.25, 0, -0.88, 0.25, top, wd, 0.01), boxAt(0.88, -0.25, 0, 0.94, 0.25, top, wd, 0.01),
    boxAt(-0.03, -0.25, 0, 0.03, 0.25, top, wd, 0.008),
  ];
  for (const z of [0.1, 0.55, 1.0]) {
    if (z > 0.1) parts.push(boxAt(-0.9, -0.24, z - 0.03, 0.9, 0.24, z, wd, 0.006));
    for (const [a, b] of [[-0.86, -0.05], [0.05, 0.86]]) {
      parts.push(...books(a, b, 0.02, 0.23, z, R, { hMin: 0.24, hMax: 0.36 }));
      parts.push(...books(a, b, -0.23, -0.02, z, R, { hMin: 0.24, hMax: 0.36 }));
    }
  }
  // On top: a pile of monographs and a brass reading lamp.
  parts.push(boxAt(0.3, -0.12, top + 0.05, 0.62, 0.12, top + 0.09, m('#7a3028', { spec: 0.2 }), 0.01));
  parts.push(place(boxAt(-0.15, -0.11, 0, 0.15, 0.11, 0.04, m('#2e4a3a', { spec: 0.2 }), 0.01), { at: [0.46, 0, top + 0.09], rz: 0.2 }));
  return union(parts);
}

/** A teacup on its saucer at (x, y, z), half-drunk and cold. */
function teacup(x, y, z, R) {
  const c = china();
  const a = R() * PI * 2;
  return move(union(
    cylinder(0.055, 0, 0.008, c, 0.004),
    subtract(frustum(0.03, 0.042, 0.008, 0.06, c, 0.004), frustum(0.026, 0.038, 0.014, 0.08, c)),
    cylinder(0.035, 0.008, 0.035, m('#6a3a1e', { spec: 1.0, shin: 60 })), // cold tea, halfway down
    place(torus(0.016, 0.0045, c), { at: [Math.cos(a) * 0.045, Math.sin(a) * 0.045, 0.036], rx: PI / 2, rz: a + PI / 2 }),
    move(cylinder(0.04, 0.059, 0.061, m(PAL.cobalt)), 0, 0, 0),
  ), x, y, z);
}

/** Ottilie's desk (2×1 along x): papers, an open book, an inkwell, and seven cups of tea, all cold. */
export function desk() {
  const wd = wood('#6a4026', { grain: 'x' });
  const topM = mat((x, y) => tint(hex('#5a3420'), 0.85 + vnoise(x * 50, y * 3, 3) * 0.2), { tag: 'prop', spec: 0.6, shin: 30 });
  const leather = m('#3a5a48', { spec: 0.2 });
  const parts = [
    boxAt(-0.95, -0.42, 0.72, 0.95, 0.42, 0.78, topM, 0.015),
    boxAt(-0.62, -0.32, 0.785, 0.62, 0.32, 0.79, leather),
    boxAt(-0.92, -0.38, 0.02, -0.5, 0.38, 0.72, wd, 0.015), // drawer pedestals
    boxAt(0.5, -0.38, 0.02, 0.92, 0.38, 0.72, wd, 0.015),
    boxAt(-0.5, 0.3, 0.42, 0.5, 0.36, 0.72, wd, 0.01), // modesty panel (south)
  ];
  for (const sx of [-1, 1]) for (const z of [0.12, 0.32, 0.52]) {
    parts.push(boxAt(sx * 0.71 - 0.19, 0.38, z, sx * 0.71 + 0.19, 0.395, z + 0.17, wood('#7a4c2e', { grain: 'x' }), 0.01));
    parts.push(move(sphere(0.016, brass()), sx * 0.71, 0.4, z + 0.09));
  }
  const paper = m('#efe6cc', { spec: 0.05 });
  const R = rng(21);
  // Stacks of paper and an open book in the middle.
  for (const [px, py, n, r] of [[-0.6, -0.2, 6, 0.1], [0.35, -0.22, 4, -0.2], [-0.15, 0.05, 2, 0.35]]) {
    for (let i = 0; i < n; i++) parts.push(place(boxAt(-0.15, -0.1, 0, 0.15, 0.1, 0.008, paper), { at: [px + (R() - 0.5) * 0.02, py, 0.79 + i * 0.01], rz: r + (R() - 0.5) * 0.15 }));
  }
  parts.push(place(union(
    boxAt(-0.18, -0.12, 0, 0, 0.12, 0.02, m('#f2ead4')), boxAt(0, -0.12, 0, 0.18, 0.12, 0.02, m('#f2ead4')),
    boxAt(-0.19, -0.13, -0.008, 0.19, 0.13, 0.0, m('#7a3028')),
  ), { at: [0.05, -0.02, 0.8], rz: -0.1, ry: 0 }));
  parts.push(move(union(cylinder(0.03, 0, 0.04, m('#1a1a28', { spec: 1, shin: 50 }), 0.008), capsule([0, 0, 0.04], [0.05, -0.05, 0.16], 0.004, m('#e8e0d0'))), 0.6, -0.28, 0.79));
  // Seven cups, scattered where she put them down.
  for (const [cx, cy] of [[-0.82, 0.28], [-0.75, -0.3], [-0.35, 0.25], [0.24, 0.25], [0.55, 0.05], [0.84, -0.28], [0.8, 0.3]]) parts.push(teacup(cx, cy, 0.78, R));
  return union(parts);
}

/** Her mother's teapot: white china with cobalt flowers. It sits on the Eye. */
export function teapot() {
  const pot = mat((x, y, z, lx, ly, lz) => {
    // Cobalt flowers: five-petal sprigs scattered over the belly.
    const a = Math.atan2(ly, lx), t = lz;
    const u = a * 3, v = t * 18;
    const cu = Math.round(u), cv = Math.round(v);
    const du = (u - cu) * 0.6, dv = (v - cv) * 0.35;
    const r = Math.hypot(du, dv), ang = Math.atan2(dv, du);
    const petal = r < 0.13 * (0.6 + 0.4 * Math.abs(Math.cos(ang * 2.5))) && (cu + cv) % 2 === 0 && t > 0.04 && t < 0.17;
    if (petal) return r < 0.04 ? hex('#e8c860') : hex('#2850a0');
    if (Math.abs(t - 0.19) < 0.008) return hex('#2850a0');
    return hex('#f4f2ec');
  }, { tag: 'prop', spec: 0.9, shin: 45 });
  const c = china();
  return place(union(
    cylinder(0.075, 0, 0.02, c, 0.006),
    move(ellipsoid(0.13, 0.13, 0.105, pot), 0, 0, 0.115),
    move(cylinder(0.075, 0.19, 0.215, c, 0.008), 0, 0, 0),
    move(ellipsoid(0.07, 0.07, 0.03, c), 0, 0, 0.215),
    move(sphere(0.02, m('#2850a0', { spec: 0.8 })), 0, 0, 0.25),
    roundCone([0.1, 0, 0.09], [0.21, 0, 0.2], 0.03, 0.012, c), // spout (east)
    place(torus(0.06, 0.013, c), { at: [-0.13, 0, 0.13], rx: PI / 2 }), // handle (west)
  ), { s: 1.25 }); // a big pot: book club served eight
}

/** The Archive's floor: pale limestone set on the diagonal, with small cobalt keys at the corners. */
function archiveFloorColor(x, y) {
  const u = (x + y) * 1.0, v = (x - y) * 1.0;
  const fu = ((u % 1) + 1) % 1, fv = ((v % 1) + 1) % 1;
  const key = Math.abs(fu - 0.5) + Math.abs(fv - 0.5) > 0.86;
  const joint = Math.min(fu, 1 - fu) < 0.02 || Math.min(fv, 1 - fv) < 0.02;
  const id = hash3(Math.floor(u), Math.floor(v), 5);
  const n = fbm(x * 9, y * 9, 2, 2);
  if (key) return tint(hex('#3a64a8'), 0.9 + n * 0.15);
  return tint(mix(hex('#e4d8c0'), hex('#d4c6aa'), id), (joint ? 0.82 : 1) * (0.94 + n * 0.08));
}

/**
 * The Eye (2×2 floor piece, origin at the shared corner of its four tiles):
 * a round window in the floor, thick as a hand, in a stone ring; under it a
 * shaft going down into the dark, with one highlight on the glass.
 */
export function eye() {
  const R0 = 0.66, ring = 0.82;
  const floorM = mat((x, y) => archiveFloorColor(x, y), { tag: 'floor', spec: 0.08, shin: 14 });
  const ringM = mat((x, y, z) => {
    const a = Math.atan2(y, x), r = Math.hypot(x, y);
    const seg = ((a / (2 * PI) + 1) * 12) % 1;
    const n = fbm(x * 12, y * 12, 1, 2);
    if (seg < 0.03 || Math.abs(r - ring + 0.02) < 0.012) return tint(hex('#a89878'), 0.9);
    return tint(hex('#cbbb9a'), 0.92 + n * 0.1);
  }, { tag: 'floor', spec: 0.1, shin: 12 });
  // Under the glass: the glass's own thickness, then a shaft of fitted dark stone
  // dropping away, black at the bottom, with a faint cyan far below.
  const under = (x, y, z) => {
    const r = Math.hypot(x, y);
    if (z > -0.1) return null; // the glass is a hand thick
    if (r > R0 - 0.02) {
      const depth = -z;
      const c = mix(hex('#5a6470'), hex('#101820'), Math.min(1, depth / 1.0));
      return (((z * 6) % 1) + 1) % 1 < 0.06 ? tint(c, 0.6) : c;
    }
    if (z < -1.6) return hex('#0c1418');
    return null;
  };
  // The glass: dark and cool, a little sky toward the near rim, and one bright
  // crescent of highlight on its west (lit) side.
  const film = (x, y) => {
    const r = Math.hypot(x, y), a = Math.atan2(y, x);
    const da = Math.abs(((a - PI + 3 * PI) % (2 * PI)) - PI);
    if (r > 0.44 && r < 0.56 && da < 0.55) return mix(hex('#3a5068'), hex('#e8f4f8'), (1 - da / 0.55) * (1 - Math.abs(r - 0.5) / 0.06));
    return mix(hex('#18222e'), hex('#4a6a80'), Math.max(0, Math.min(1, (x + y + 0.4) / 1.4)) * 0.5);
  };
  const glassM = seeThrough(film, under, { k: 0.55, depth: 2.4, steps: 60, tag: 'floor', spec: 1.6, shin: 140, emit: 0.1, fallback: '#08101a' });
  return union(
    subtract(boxAt(-1, -1, -0.2, 1, 1, 0, floorM), cylinder(ring, -0.5, 0.5, null), floorM),
    subtract(cylinder(ring, -0.2, 0.004, ringM, 0.01), cylinder(R0, -0.5, 0.5, null), ringM),
    move(cylinder(R0, -0.2, -0.008, glassM), 0, 0, 0),
  );
}

/** The stair down to the crypt (1×1): an opening in the floor, stone steps going down westward, a low brass rail. */
export function stairDown() {
  const floorM = mat((x, y) => archiveFloorColor(x, y), { tag: 'floor', spec: 0.08, shin: 14 });
  const st = limestone('#c8b896', { tag: 'floor' });
  const nose = mat('#ddd0b4', { tag: 'floor', spec: 0.06 });
  const hx = 0.4, hy = 0.4;
  const parts = [subtract(boxAt(-0.5, -0.5, -0.3, 0.5, 0.5, 0, floorM), boxAt(-hx, -hy, -2, hx, hy, 1, null), mat('#9a8e78', { tag: 'floor' }))];
  // Treads stepping down to the west, top step at the east edge.
  const n = 6;
  for (let i = 0; i < n; i++) {
    const x1 = hx - i * (2 * hx / n), x0 = x1 - 2 * hx / n, zt = -0.2 * (i + 1);
    parts.push(boxAt(x0, -hy, zt - 0.4, x1, hy, zt, st, 0.006));
    parts.push(boxAt(x0, -hy, zt - 0.025, x0 + 0.03, hy, zt, nose, 0.006));
  }
  // The dark where the stair turns under the floor.
  parts.push(boxAt(-hx, -hy, -2.4, -hx + 0.12, hy, -0.9, mat('#100c14', { tag: 'floor' })));
  const b = mat('#d8a840', { tag: 'prop', spec: 0.9, shin: 40 });
  // A low rail round the south and east of the opening (the open side is the west).
  for (const [x, y] of [[hx + 0.04, hy + 0.04], [hx + 0.04, -hy - 0.04], [-hx - 0.04, hy + 0.04]]) {
    parts.push(move(cylinder(0.018, 0, 0.62, b, 0.004), x, y, 0));
    parts.push(move(sphere(0.026, b), x, y, 0.64));
  }
  parts.push(capsule([hx + 0.04, -hy - 0.04, 0.62], [hx + 0.04, hy + 0.04, 0.62], 0.014, b));
  parts.push(capsule([hx + 0.04, hy + 0.04, 0.62], [-hx - 0.04, hy + 0.04, 0.62], 0.014, b));
  return union(parts);
}

// ---------------------------------------------------------------------------
// The crypt

/** A crate of council minutes (about 0.7 × 0.5 × 0.42 m), slatted, stencilled, its lid nailed on. */
export function crate({ seed = 1 } = {}) {
  const R = rng(seed);
  const wd = wood(['#9a7048', '#8a6440', '#a07850'][seed % 3], { grain: 'x' });
  const dark = wood('#6a4a30', { grain: 'z' });
  const parts = [boxAt(-0.35, -0.25, 0, 0.35, 0.25, 0.42, wd, 0.01)];
  // Corner battens and a band round the middle; the lid's boards.
  for (const sx of [-1, 1]) for (const sy of [-1, 1]) parts.push(boxAt(sx * 0.35 - 0.025, sy * 0.25 - 0.025, 0, sx * 0.35 + 0.025, sy * 0.25 + 0.025, 0.42, dark, 0.006));
  parts.push(boxAt(-0.37, -0.27, 0.19, 0.37, 0.27, 0.23, dark, 0.006));
  for (let i = 0; i < 3; i++) parts.push(boxAt(-0.35, -0.25 + i * 0.168 + 0.004, 0.42, 0.35, -0.25 + (i + 1) * 0.168 - 0.004, 0.44, wd, 0.004));
  // A stencilled label on the south face.
  parts.push(boxAt(-0.15, 0.25, 0.27, 0.15, 0.256, 0.38, mat((x, y, z) => (Math.sin(x * 140) > 0.2 && Math.abs(z - 0.325) < 0.03 ? hex('#3a2a28') : hex('#e0d0b0')), { tag: 'prop' })));
  void R;
  return union(parts);
}

/** Two (or three) crates stacked against the north wall. */
export function crateStack() {
  return union(
    move(crate({ seed: 1 }), 0, -0.12, 0),
    place(crate({ seed: 2 }), { at: [0.03, -0.14, 0.44], rz: 0.06 }),
    place(crate({ seed: 0 }), { at: [-0.02, -0.12, 0.88], rz: -0.08 }),
  );
}

/** The lectern with Ottilie's monograph open on it: 'The Door That Does Not Open'. */
export function lectern() {
  const wd = wood('#5a3622', { grain: 'z' });
  const page = mat((x, y, z, lx, ly) => (Math.abs(((ly + 1) * 40) % 1 - 0.5) < 0.15 && Math.abs(lx) > 0.02 && Math.abs(lx) < 0.15 ? hex('#8a8070') : hex('#f2ead4')), { tag: 'prop', spec: 0.05 });
  const top = place(union(
    boxAt(-0.3, -0.22, -0.03, 0.3, 0.22, 0, wd, 0.01),
    boxAt(-0.3, 0.2, 0, 0.3, 0.24, 0.04, wd, 0.008), // the book ledge (south)
    // The book, open: two pages bowed a little toward the spine.
    custom((x, y, z) => Math.max(Math.abs(x) - 0.2, Math.abs(y) - 0.14, Math.abs(z - 0.02 - Math.abs(x) * 0.08) - 0.012), [-0.21, -0.15, 0, 0.21, 0.15, 0.05], page),
    boxAt(-0.21, -0.15, 0.0, 0.21, 0.15, 0.012, m('#7a3028', { spec: 0.2 }), 0.004),
  ), { at: [0, 0, 1.0], rx: -0.45 });
  return union(
    boxAt(-0.25, -0.2, 0, 0.25, 0.2, 0.06, wd, 0.015),
    boxAt(-0.07, -0.07, 0.06, 0.07, 0.07, 0.92, wd, 0.01),
    top,
  );
}

// ---------------------------------------------------------------------------
// The lamp room

/**
 * The great lamp (2×2): a Fresnel lens drum of glass prism rings round a
 * central burner, four bull's-eye panels, brass frame and cap, on a brass
 * pedestal. `turn` rotates the lens (0–1 over a quarter turn: four panels).
 */
export function lamp({ turn = 0 } = {}) {
  const b = mat('#e0b448', { tag: 'prop', spec: 1.3, shin: 60 });
  const bDark = mat('#a87830', { tag: 'prop', spec: 1.0, shin: 40 });
  const rot = turn * PI / 2;
  const prism = mat((x, y, z, lx, ly, lz, nx, ny, nz) => {
    // Cool clear glass catching the room: brighter where the rings face up and to the light.
    const a = Math.atan2(y, x) - rot;
    const panel = Math.cos(a * 4);
    const c = mix(hex('#5a8090'), hex('#e8f8f4'), 0.35 + 0.35 * nz + 0.2 * panel);
    return c;
  }, { tag: 'prop', spec: 2.0, shin: 120, emit: 0.18 });
  const parts = [
    // Pedestal: a stepped round base and a fluted column.
    cylinder(0.62, 0, 0.08, bDark, 0.02),
    cylinder(0.5, 0.08, 0.16, b, 0.02),
    frustum(0.3, 0.24, 0.16, 0.8, b, 0.02),
    cylinder(0.42, 0.78, 0.86, b, 0.02),
  ];
  // The lens drum: stacked prism rings, waisted at the middle where the bull's-eyes are.
  const z0 = 0.88, z1 = 1.98, R = 0.55;
  for (let i = 0; i < 11; i++) {
    const z = z0 + 0.05 + i * 0.1, t = (z - (z0 + z1) / 2) / ((z1 - z0) / 2);
    const rr = R * (1 - 0.18 * t * t);
    parts.push(move(torus(rr, 0.045, prism), 0, 0, z));
  }
  parts.push(move(cylinder(R * 0.82, z0, z1, prism), 0, 0, 0));
  // Four bull's-eye panels, turning.
  for (let k = 0; k < 4; k++) {
    const a = rot + k * PI / 2;
    // Each a round bull's-eye standing proud of the rings, in a heavy brass collar,
    // its center catching the burner's glow.
    const eyeM = mat((x, y, z, lx, ly, lz) => {
      const r = Math.hypot(ly, lz);
      return r < 0.06 ? hex('#fff4d0') : mix(hex('#c8ecf0'), hex('#6a98a8'), Math.min(1, r / 0.22));
    }, { tag: 'prop', spec: 2.2, shin: 140, emit: 0.4 });
    parts.push(place(union(
      move(ellipsoid(0.1, 0.22, 0.22, eyeM), 0.04, 0, 0),
      place(torus(0.225, 0.03, b), { ry: PI / 2 }),
    ), { at: [Math.cos(a) * (R * 0.92), Math.sin(a) * (R * 0.92), (z0 + z1) / 2], rz: a }));
  }
  // Brass frame: verticals between the panels, rings top and bottom, and a domed cap with a vent.
  for (let k = 0; k < 4; k++) {
    const a = rot + k * PI / 2 + PI / 4;
    parts.push(capsule([Math.cos(a) * R * 1.0, Math.sin(a) * R * 1.0, z0], [Math.cos(a) * R * 1.0, Math.sin(a) * R * 1.0, z1], 0.022, b));
  }
  parts.push(move(torus(R + 0.02, 0.035, b), 0, 0, z0), move(torus(R + 0.02, 0.035, b), 0, 0, z1));
  parts.push(move(ellipsoid(R + 0.04, R + 0.04, 0.22, b), 0, 0, z1 + 0.02));
  parts.push(move(cylinder(0.1, 0, 0.12, b, 0.02), 0, 0, z1 + 0.2), move(sphere(0.06, b), 0, 0, z1 + 0.36));
  return union(parts);
}

const SHEET_C = '#d6cfc0';
const clothM = () => mat((x, y, z, lx, ly, lz) => tint(hex(SHEET_C), 0.85 + vnoise(x * 14, y * 14, z * 14) * 0.18), { tag: 'prop', spec: 0.04, shin: 6 });

/**
 * The telescope under its dust sheet, on a tripod, pointing at the north wall
 * "like it's being punished": iron legs and brass feet below the hem, the
 * eyepiece poking out toward the room.
 */
export function scopeSheet() {
  const ir = iron('#30303a');
  const b = brass();
  const head = [0, 0.05, 1.0];
  const parts = [];
  for (let k = 0; k < 3; k++) {
    const a = PI / 2 + k * 2 * PI / 3;
    const foot = [Math.cos(a) * 0.5, 0.05 + Math.sin(a) * 0.5, 0.03];
    parts.push(capsule(head, foot, 0.014, ir));
    parts.push(move(sphere(0.028, b), foot[0], foot[1], 0.028));
  }
  // The tube's axis: from the eyepiece (south, low) up toward the wall (north, high).
  const e0 = [0.02, 0.32, 1.06], e1 = [-0.02, -0.42, 1.24];
  // The sheet: a soft shroud over the tube and down over the head, with a wavy hem.
  const cm = clothM();
  const shroud = custom((x, y, z) => {
    // Distance to the tube's segment, swollen.
    const ax = e1[0] - e0[0], ay = e1[1] - e0[1], az = e1[2] - e0[2];
    const L2 = ax * ax + ay * ay + az * az;
    const t = Math.max(0, Math.min(1, ((x - e0[0]) * ax + (y - e0[1]) * ay + (z - e0[2]) * az) / L2));
    const tube = Math.hypot(x - e0[0] - ax * t, y - e0[1] - ay * t, z - e0[2] - az * t) - 0.15;
    // The drape: a broad tent hanging from the tube to a wavy hem.
    const ang = Math.atan2(y + 0.02, x);
    const hem = 0.46 + Math.sin(ang * 5) * 0.05;
    const rr = Math.hypot(x, (y + 0.02) * 0.85);
    const drape = Math.max(rr - (0.18 + (1.12 - z) * 0.4), hem - z, z - 1.12);
    const folds = Math.sin(ang * 9) * 0.014 * Math.max(0, 1.1 - z);
    const k = 0.2;
    const h = Math.max(k - Math.abs(tube - drape), 0) / k;
    return (Math.min(tube, drape) - h * h * k * 0.25 + folds) * 0.8;
  }, [-0.6, -0.6, 0.35, 0.6, 0.6, 1.45], cm);
  parts.push(shroud);
  // The eyepiece, out from under the sheet toward the room.
  parts.push(capsule([0.02, 0.4, 1.06], [0.03, 0.62, 1.02], 0.03, b));
  parts.push(place(torus(0.034, 0.009, b), { at: [0.028, 0.56, 1.03], rx: PI / 2 }));
  parts.push(move(sphere(0.03, m('#1a2030', { spec: 1.5, shin: 80 })), 0.03, 0.645, 1.015));
  return union(parts);
}

/** The dust sheet in a heap on the floor: nothing under it now but a clean patch of floor. */
export function sheetEmpty() {
  const cm = clothM();
  const R = rng(31);
  const blobs = [];
  for (let i = 0; i < 9; i++) {
    const a = R() * PI * 2, r = R() * 0.22;
    blobs.push(move(ellipsoid(0.16 + R() * 0.08, 0.14 + R() * 0.08, 0.05 + R() * 0.05, cm), Math.cos(a) * r, Math.sin(a) * r, 0.04 + R() * 0.06));
  }
  const heap = smooth(0.08, blobs);
  return {
    b: heap.b.map((v, i) => (i === 2 ? 0 : i < 3 ? v - 0.03 : v + 0.03)),
    dist(x, y, z) { return Math.max(heap.dist(x, y, z) + Math.sin(x * 40 + y * 25) * 0.006, -z); },
    near(x, y, z) { return heap.near(x, y, z); },
  };
}

/** A tin of brass polish with its rag. */
export function polishTin() {
  const lid = mat((x, y, z, lx, ly) => (Math.hypot(lx, ly) < 0.03 ? hex('#c83a30') : hex('#d8b048')), { tag: 'prop', spec: 0.9, shin: 40 });
  return union(
    cylinder(0.06, 0, 0.04, m('#2e4a7a', { spec: 0.7, shin: 30 }), 0.006),
    move(cylinder(0.062, 0.035, 0.048, lid, 0.006), 0, 0, 0),
    move(ellipsoid(0.1, 0.07, 0.025, clothM()), 0.14, 0.04, 0.02),
  );
}

void bronze; void intersect;
