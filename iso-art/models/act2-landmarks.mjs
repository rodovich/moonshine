// Act 2's landmarks: the Crown (Bell Tower, Blue Dome, sundial, the
// Clockmaker's front), Fountain Square (the Fountain of the Fish, stalls,
// café, the Shop and the Mayor's fronts), the Hundred Steps, and the Founders'
// Door. Each builder returns an SDF node with its origin at the center of its
// footprint on the floor (z = 0), x east, y south; footprints are noted.
// Wall fronts are south faces: the wall's face plane is y = +0.5 of its
// footprint, as the court's facade pieces.

import { box, boxAt, union, subtract, move, place, cylinder, sphere, capsule, custom, intersect, frustum, ellipsoid, torus, roundCone, smooth, squash, NEAR, INF } from '../lib/sdf.mjs';
import { mat, hex, mix, LIGHT } from '../lib/render.mjs';
import { plaster, limestone, paintedWood, wood, iron, glass, terracotta, leaf, brass, bronze, fbm, vnoise } from './materials.mjs';
import { hash3, rng } from '../lib/noise.mjs';
import { COLORS } from './arch.mjs';
import { PAL, hullstone, relicCyan, moonEyeGlass, ashlar, domeTiles, water, seeThrough, tint } from './act2-materials.mjs';

const PI = Math.PI;
const m = (c, o = {}) => mat(c, { tag: 'prop', ...o });
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

// ---------------------------------------------------------------------------
// Helpers: 2D polygon distance, lathes and extrusions.

/** Signed distance from (px, py) to a closed polygon [[x, y]…] (Inigo Quilez). */
export function sdPoly(v, px, py) {
  let d = (px - v[0][0]) ** 2 + (py - v[0][1]) ** 2, s = 1;
  for (let i = 0, j = v.length - 1; i < v.length; j = i, i++) {
    const ex = v[j][0] - v[i][0], ey = v[j][1] - v[i][1];
    const wx = px - v[i][0], wy = py - v[i][1];
    const t = clamp((wx * ex + wy * ey) / (ex * ex + ey * ey), 0, 1);
    const bx = wx - ex * t, by = wy - ey * t;
    d = Math.min(d, bx * bx + by * by);
    const c1 = py >= v[i][1], c2 = py < v[j][1], c3 = ex * wy > ey * wx;
    if ((c1 && c2 && c3) || (!c1 && !c2 && !c3)) s = -s;
  }
  return s * Math.sqrt(d);
}

/** A solid of revolution about z from a closed (r, z) profile. */
export function lathe(pts, mt, round = 0) {
  const R = Math.max(...pts.map((p) => p[0])), z0 = Math.min(...pts.map((p) => p[1])), z1 = Math.max(...pts.map((p) => p[1]));
  return custom((x, y, z) => sdPoly(pts, Math.hypot(x, y), z) - round, [-R - round, -R - round, z0 - round, R + round, R + round, z1 + round], mt);
}

/** A polygon in the (x, z) plane extruded through y ∈ [−t, t]. */
export function extrudeXZ(pts, t, mt, round = 0) {
  const xs = pts.map((p) => p[0]), zs = pts.map((p) => p[1]);
  return custom((x, y, z) => {
    const d = sdPoly(pts, x, z) + round, dy = Math.abs(y) - t + round;
    return Math.min(Math.max(d, dy), 0) + Math.hypot(Math.max(d, 0), Math.max(dy, 0)) - round;
  }, [Math.min(...xs), -t, Math.min(...zs), Math.max(...xs), t, Math.max(...zs)], mt);
}

/** An arched (round-headed) opening facing +y: width w, from z0 to the arch top z1, depth from y0 to y1. */
function archCut(w, z0, z1, y0, y1) {
  const r = w / 2;
  return union(boxAt(-r, y0, z0, r, y1, z1 - r), place(cylinder(r, y0, y1, null), { at: [0, 0, z1 - r], rx: -PI / 2 }));
}

/**
 * Something seen through glass or water: an `under` function for seeThrough()
 * that finds `node` along the continued view ray and shades it simply (its own
 * material, key light by normal, sky fill), with `dim` for the dark behind glass.
 */
export function sdfUnder(node, { dim = 0.75, bg = null } = {}) {
  const L = LIGHT.dir, bgc = bg && hex(bg);
  return (x, y, z, s) => {
    const d = node.dist(x, y, z);
    if (d > 0.002) return s > 0.98 * 0.6 && bgc ? bgc : null;
    NEAR.d = INF; NEAR.leaf = null;
    node.near(x, y, z);
    const leaf = NEAR.leaf;
    const mt = leaf && leaf.mat;
    if (!mt) return null;
    const e = 0.004;
    const nx = node.dist(x + e, y, z) - node.dist(x - e, y, z), ny = node.dist(x, y + e, z) - node.dist(x, y - e, z), nz = node.dist(x, y, z + e) - node.dist(x, y, z - e);
    const nl = Math.hypot(nx, ny, nz) || 1;
    const ndl = Math.max(0, (nx * L[0] + ny * L[1] + nz * L[2]) / nl);
    const c = mt.color(x, y, z, NEAR.lx, NEAR.ly, NEAR.lz, nx / nl, ny / nl, nz / nl);
    const k = (0.35 + ndl * 0.75) * dim;
    if (mt.emit) return mix(tint(c, k), c, mt.emit);
    return tint(c, k);
  };
}

// ---------------------------------------------------------------------------
// The sundial (2×2): five hundred years old, a squat round limestone pedestal
// on a stepped base, a bronze dial with hour marks, and a tall gnomon.

export function sundial() {
  const st = limestone('#dcc49c', { tag: 'prop' });
  const st2 = limestone('#d0b890', { tag: 'prop' });
  const dialM = mat((x, y, z, lx, ly, lz) => {
    const r = Math.hypot(lx, ly), a = Math.atan2(ly, lx);
    let c = mix(hex('#a87848'), hex('#5a9a80'), Math.max(0, fbm(lx * 30, ly * 30, 1, 2) - 0.5) * 1.6);
    const hour = Math.abs(((a / PI) * 12 + 24) % 1 - 0.5) > 0.44 && r > 0.22 && r < 0.36 && ly > -0.05;
    if (hour || Math.abs(r - 0.38) < 0.008) c = tint(c, 0.45);
    return c;
  }, { tag: 'prop', spec: 0.7, shin: 30 });
  const b = bronze('#b08040');
  // Lichen on the old stone, low and on the north side.
  return union(
    cylinder(0.9, 0, 0.12, st2, 0.03),
    cylinder(0.72, 0.12, 0.24, st, 0.03),
    frustum(0.5, 0.42, 0.24, 0.78, st, 0.02),
    cylinder(0.52, 0.76, 0.86, st, 0.035),
    move(cylinder(0.44, 0, 0.02, dialM, 0.006), 0, 0, 0.86),
    custom((x, y, z) => {
      const dz = z - 0.88;
      const tri = Math.max(-dz, y - 0.3, -y - 0.32, (dz - (0.3 - y) * 0.62) * 0.85);
      return Math.max(Math.abs(x) - 0.012, tri);
    }, [-0.02, -0.35, 0.86, 0.02, 0.32, 1.3], b),
  );
}

// ---------------------------------------------------------------------------
// The Fountain of the Fish (4×4): a round limestone basin, a pedestal, and the
// bronze fish standing on its tail, spouting. The fish is a stylized Founder
// hull: its fins are oars. States: 'full' (animated), 'low' (a finger's width
// down, a wet band above the water), 'dry' (stopped, the hatch to the Pump
// Hall showing in the basin floor). Parts of the fish carry the tag 'fish'
// (and its water 'spout'), so a sheet can cut the fish out as its own frame.

const FOUNT = { R: 1.86, Ri: 1.58, rim: 0.5, floor: 0.08, full: 0.4, low: 0.34, ped: 0.72 };
// The fish faces the camera: its keel toward (1, 1), oars across the screen.
const FISH_TURN = -PI / 4;

function basinStone() {
  return mat((x, y, z, lx, ly, lz) => {
    const a = Math.atan2(y, x), r = Math.hypot(x, y);
    const fa = ((a / (2 * PI) + 0.5) * 22) % 1;
    const outer = r > FOUNT.Ri + 0.05 && z < FOUNT.rim - 0.06;
    const joint = outer && (Math.min(fa, 1 - fa) < 0.035 || Math.abs(z - 0.26) < 0.012);
    const id = hash3(Math.floor((a / (2 * PI) + 0.5) * 22), z > 0.26 ? 1 : 0, 5);
    let c = mix(hex('#d4bc96'), hex('#e2cca6'), id);
    const n = fbm(x * 10, y * 10, z * 10, 3);
    c = tint(c, (joint ? 0.74 : 1) * (0.9 + n * 0.16));
    // Lichen and moss specks on the coping; damp darkening at the foot.
    const sp = vnoise(x * 34, y * 34, z * 34);
    if (z > FOUNT.rim - 0.1 && sp > 0.8) c = mix(c, hex('#6a8a48'), 0.55);
    if (z < 0.12 && r > FOUNT.R - 0.1) c = mix(c, hex('#a89070'), 0.3);
    return c;
  }, { tag: 'prop', spec: 0.05, shin: 8 });
}

/** The basin floor's color at (x, y): limestone slabs, a scatter of coins; dried out if `dry`. */
function basinFloorColor(x, y, dry) {
  const r = Math.hypot(x, y);
  const slab = Math.floor((x + 10) / 0.62) + Math.floor((y + 10) / 0.62) * 31;
  const fx = ((x + 10) / 0.62) % 1, fy = ((y + 10) / 0.62) % 1;
  let c = mix(hex('#c8b490'), hex('#d8c4a0'), hash3(slab, 2, 9));
  if (Math.min(fx, 1 - fx, fy, 1 - fy) < 0.03) c = tint(c, 0.72);
  // Coins: every child in Tessel has thrown one.
  for (let i = 0; i < 26; i++) {
    const a = hash3(i, 1, 4) * 2 * PI, rr = 0.4 + hash3(i, 2, 4) * 1.05;
    if (Math.hypot(x - Math.cos(a) * rr, y - Math.sin(a) * rr) < 0.035) c = hash3(i, 3, 4) > 0.5 ? hex('#c89048') : hex('#b8b8b0');
  }
  if (dry) {
    // A dark ring where the water stood for five hundred years, and dried green scum.
    const sc = fbm(x * 3, y * 3, 2, 3);
    c = mix(c, hex('#7a8a58'), Math.max(0, sc - 0.45) * 0.9);
    if (r > FOUNT.Ri - 0.12) c = mix(c, hex('#8a7a60'), 0.4);
  } else c = mix(c, hex('#4a7860'), 0.25 + Math.max(0, fbm(x * 3, y * 3, 2, 3) - 0.4) * 0.6);
  return c;
}

/** The hatch to the Pump Hall in the basin floor: a square bronze plate in two leaves. */
function fountainHatch() {
  // Founders' bronze gone green, a slate frame chamfered at its corners, two ring pulls.
  const b = bronze('#8a7448', { tag: 'prop' });
  const frameM = hullstone({ course: 0.3, block: 0.4, tag: 'prop' });
  const ir = iron('#3a3640', { tag: 'prop' });
  const chamfer = (h, z0, z1, mt) => custom((x, y, z) => Math.max(Math.abs(x) - h, Math.abs(y) - h, (Math.abs(x) + Math.abs(y) - (2 * h - 0.08)) / Math.SQRT2, z - z1, z0 - z), [-h, -h, z0, h, h, z1], mt);
  return place(union(
    chamfer(0.44, 0, 0.04, frameM),
    chamfer(0.36, 0.02, 0.06, b),
    boxAt(-0.008, -0.36, 0.05, 0.008, 0.36, 0.065, m('#2a2828')),
    place(torus(0.045, 0.01, ir), { at: [-0.14, 0, 0.068] }),
    place(torus(0.045, 0.01, ir), { at: [0.14, 0, 0.068] }),
  ), { at: [0.66, 0.66, FOUNT.floor], rz: FISH_TURN });
}

/** The basin with its pedestal and water (no fish). */
export function fountainBasin(state = 'full', { t = 0 } = {}) {
  const { R, Ri, rim, floor } = FOUNT;
  const stone = basinStone();
  const lvl = state === 'full' ? FOUNT.full : state === 'low' ? FOUNT.low : null;
  // The inner wall: wet and darker below the old waterline, a wet band above the low water.
  const innerM = mat((x, y, z, lx, ly, lz, nx, ny, nz) => {
    let c = stone.color(x, y, z, lx, ly, lz, nx, ny, nz);
    if (Math.hypot(x, y) < Ri + 0.02 && z < FOUNT.full + 0.02) {
      if (state === 'dry') c = mix(c, hex('#8a8064'), 0.35);
      else c = mix(c, hex('#6a7058'), z > (lvl ?? 0) ? 0.45 : 0.3);
    }
    return c;
  }, { tag: 'prop', spec: 0.06, shin: 8 });
  const wall = subtract(cylinder(R, 0, rim - 0.04, stone, 0.02), cylinder(Ri, floor, rim + 1, null), innerM);
  const coping = subtract(cylinder(R + 0.07, rim - 0.1, rim + 0.03, stone, 0.05), cylinder(Ri - 0.03, 0, rim + 1, null), innerM);
  const plinth = cylinder(R + 0.12, 0, 0.07, limestone('#cbb690', { tag: 'prop' }), 0.025);
  const floorM = mat((x, y) => basinFloorColor(x, y, state === 'dry'), { tag: 'prop', spec: 0.08, shin: 10 });
  const floorN = cylinder(Ri + 0.01, 0, floor, floorM);
  // The pedestal: a fluted column with a collar, the fish's tail rests on its top.
  const fl = mat((x, y, z, lx, ly, lz) => {
    const a = Math.atan2(y, x);
    let c = stone.color(x, y, z, lx, ly, lz);
    if (Math.cos(a * 10) > 0.6 && z > 0.12 && z < FOUNT.ped - 0.1) c = tint(c, 0.85);
    if (z < FOUNT.full && state !== 'dry') c = mix(c, hex('#5a6a50'), 0.35);
    return c;
  }, { tag: 'prop', spec: 0.05 });
  const ped = lathe([[0, floor], [0.34, floor], [0.34, 0.16], [0.25, 0.2], [0.22, 0.6], [0.3, 0.64], [0.3, FOUNT.ped], [0, FOUNT.ped]], fl, 0.01);
  const parts = [wall, coping, plinth, floorN, ped];
  if (lvl !== null) {
    // See through the water to the floor and its coins.
    const under = (x, y, z) => {
      const r = Math.hypot(x, y);
      if (r > Ri) return tint(innerM.color(x, y, z, 0, 0, 0, 0, 0, 1), 0.7);
      if (r < 0.3) return z < FOUNT.ped ? tint(hex('#8a9070'), 0.7) : null;
      if (z <= floor) return basinFloorColor(x, y, false);
      return null;
    };
    // Rings spreading where the fish's streams come down.
    const drops = [0, 1, 2, 3].map((i) => { const a = FISH_TURN + PI / 4 + i * PI / 2; return [Math.cos(a) * 0.62, Math.sin(a) * 0.62]; });
    const strength = state === 'full' ? 1 : 0.4;
    const film = (x, y, z) => {
      const rp = vnoise(x * 8 + t * 4, y * 8 - t * 3, t * 2);
      let c = mix(hex(PAL.waterDeep), hex(PAL.water), 0.35 + rp * 0.45 + Math.max(0, (x + y) / 4.5));
      for (const [dx, dy] of drops) {
        const d = Math.hypot(x - dx, y - dy);
        const ph = (d * 9 - t * 2 * PI * 1.0) % (2 * PI);
        const ring = Math.max(0, Math.cos(ph)) ** 6 * Math.max(0, 1 - d / 0.55) * strength;
        c = mix(c, hex(PAL.foam), ring * 0.7);
      }
      return c;
    };
    const wm = seeThrough(film, under, { k: 0.52, depth: 0.55, steps: 22, tag: 'prop', spec: 1.5, shin: 80, emit: 0.08 });
    parts.push(custom((x, y, z) => {
      const h = lvl + (vnoise(x * 12 + t * 3, y * 12, t) - 0.5) * 0.006;
      return Math.max(z - h, Math.hypot(x, y) - Ri - 0.005, floor + 0.01 - z);
    }, [-Ri, -Ri, floor, Ri, Ri, lvl + 0.01], wm));
  }
  if (state === 'dry') parts.push(fountainHatch());
  return union(parts);
}

/** The bronze fish on its pedestal top, with its spout: 'full', 'low', 'dry'. */
export function fish(state = 'full', { t = 0 } = {}) {
  const b = bronze('#a87848', { tag: 'fish' });
  const ribs = mat((x, y, z, lx, ly, lz, nx, ny, nz) => {
    let c = b.color(x, y, z, lx, ly, lz, nx, ny, nz);
    // Ribs across the hull, like planking frames, and a darker keel line.
    if (Math.abs(((lz - 0.9) * 11) % 1) < 0.16 && ly > 0.04) c = tint(c, 0.66);
    if (Math.abs(lx) < 0.018 && ly > 0.08) c = tint(c, 0.6);
    return c;
  }, { tag: 'fish', spec: 0.65, shin: 30 });
  const z0 = FOUNT.ped;
  const zc = z0 + 0.62;
  const parts = [];
  // The hull-body: beam across x, keel toward +y (the camera after the turn).
  parts.push(smooth(0.05,
    move(ellipsoid(0.16, 0.13, 0.44, ribs), 0, 0, zc),
    move(ellipsoid(0.03, 0.17, 0.36, ribs), 0, 0.01, zc - 0.02),
    move(ellipsoid(0.11, 0.09, 0.14, ribs), 0, 0, zc + 0.36),
  ));
  // Eyes, and the open mouth at the top.
  const eye = m('#3a2a24', { spec: 0.8, shin: 40, tag: 'fish' });
  for (const s of [-1, 1]) parts.push(move(sphere(0.032, eye), s * 0.09, 0.07, zc + 0.36));
  parts.push(move(torus(0.05, 0.018, b), 0, 0, zc + 0.5));
  // Tail: two lobes splayed on the pedestal.
  for (const s of [-1, 1]) parts.push(place(ellipsoid(0.07, 0.035, 0.17, b), { at: [s * 0.1, 0, z0 + 0.1], ry: s * 0.85 }));
  parts.push(move(ellipsoid(0.07, 0.06, 0.12, b), 0, 0, z0 + 0.18));
  // Oars: two to a side, angled down and out, with blades.
  for (const s of [-1, 1]) for (const [dz, len] of [[0.12, 0.42], [-0.12, 0.38]]) {
    const a = [s * 0.13, 0.04, zc + dz], e = [s * (0.13 + len), 0.1, zc + dz - len * 0.62];
    parts.push(capsule(a, e, 0.016, b));
    const ux = e[0] - a[0], uz = e[2] - a[2];
    const ang = Math.atan2(uz, ux);
    parts.push(place(ellipsoid(0.1, 0.014, 0.035, b), { at: [e[0] + Math.cos(ang) * 0.07, e[1], e[2] + Math.sin(ang) * 0.07], ry: -ang }));
  }
  // Fins along the back like a gunwale rail.
  parts.push(move(ellipsoid(0.02, 0.05, 0.3, b), 0, -0.13, zc));
  // The spout.
  if (state !== 'dry') {
    const wtr = mat((x, y, z) => mix(hex('#b8e8f0'), hex('#f0fcff'), vnoise(x * 40, y * 40, z * 30 + t * 9)), { tag: 'spout', spec: 1.2, shin: 60, emit: 0.35 });
    const top = zc + 0.52;
    const up = state === 'full' ? 0.32 : 0.1;
    parts.push(capsule([0, 0, top], [0, 0, top + up], state === 'full' ? 0.026 : 0.02, wtr));
    // Four streams falling away in arcs between the oars, broken into drops at the end.
    const n = 4;
    for (let i = 0; i < n; i++) {
      const a = PI / 4 + i * PI / 2;
      const reach = state === 'full' ? 0.62 : 0.36;
      const pts = [];
      for (let k = 0; k <= 6; k++) {
        const u = k / 6;
        const r = reach * u, zz = top + up - (top + up - FOUNT.full) * u * u;
        pts.push([Math.cos(a) * r, Math.sin(a) * r, zz]);
      }
      const solidTo = state === 'full' ? 4 : 2;
      for (let k = 0; k < solidTo; k++) parts.push(capsule(pts[k], pts[k + 1], 0.012 + k * 0.002, wtr));
      // Drops in the lower stream, moving with t.
      for (let d = 0; d < 3; d++) {
        const u = (solidTo / 6) + ((d / 3 + t) % 1) * ((6 - solidTo) / 6);
        const r = reach * u, zz = top + up - (top + up - FOUNT.full) * u * u;
        parts.push(move(sphere(0.016, wtr), Math.cos(a) * r, Math.sin(a) * r, zz));
      }
    }
    // A little crown of spray at the jet's top.
    for (let i = 0; i < 6; i++) {
      const a = i * PI / 3 + t * 2;
      parts.push(move(sphere(0.012, wtr), Math.cos(a) * 0.05, Math.sin(a) * 0.05, top + up + 0.02 + ((i + t * 6) % 3) * 0.012));
    }
  }
  return place(union(parts), { rz: FISH_TURN });
}

export function fountain(state = 'full', { t = 0 } = {}) {
  return union(fountainBasin(state, { t }), fish(state, { t }));
}

// ---------------------------------------------------------------------------
// The Bell Tower (6×4 footprint, x −3…3, y −2…2): Tessel's tallest building and
// the stump of the Founders' mast. Its base is older Founder stone: dark slate,
// fitted without mortar, 45° chamfers, relic cyan only at a seam. Above, the
// town's limestone shaft with the Mayor's clock on its south face (ten past
// ten, eleven minutes ahead of the sundial) and the belfry with the bell.

const TOWER = { W: 3, D: 2, base: 2.4, x0: -1.85, x1: 1.85, y0: -1.75, y1: 1.45, top: 6.95, belfry: 5.4 };

function chamferBox(hx, hy, h, c, ct, mt) {
  // A box from z 0 to h, its vertical corners chamfered by c, its top edges by ct.
  return custom((x, y, z) => {
    const ax = Math.abs(x), ay = Math.abs(y);
    return Math.max(ax - hx, ay - hy, z - h, -z,
      (ax + ay - (hx + hy - c)) / Math.SQRT2,
      (ax + z - (hx + h - ct)) / Math.SQRT2,
      (ay + z - (hy + h - ct)) / Math.SQRT2);
  }, [-hx, -hy, 0, hx, hy, h], mt);
}

export function bellTower({ clock = true, t = 0 } = {}) {
  const T = TOWER;
  const parts = [];
  // ---- The Founders' base.
  const slate = hullstone({ course: 0.6, block: 1.15, seed: 4 });
  let base = chamferBox(T.W, T.D, T.base, 0.4, 0.22, slate);
  // The doorway: a chamfered (never arched) opening, 1.3 wide, 1.95 tall.
  const doorPoly = [[-0.66, -0.1], [0.66, -0.1], [0.66, 1.6], [0.32, 1.95], [-0.32, 1.95], [-0.66, 1.6]];
  const doorCut = move(extrudeXZ(doorPoly, 0.4, null), 0, T.D, 0);
  base = subtract(base, doorCut, hullstone({ course: 0.6, block: 1.15, seed: 4, base: '#5a6870' }));
  parts.push(base);
  // The surface folk's door in it: oak planks, iron studs and strap hinges.
  const oak = mat((x, y, z, lx, ly, lz) => {
    const p = ((x + 10) * 7) % 1;
    const g = vnoise(x * 50, z * 3, 0.5);
    return tint(hex('#8a5a30'), (p < 0.07 ? 0.62 : 1) * (0.86 + g * 0.18));
  }, { tag: 'wall', spec: 0.12, shin: 12 });
  parts.push(intersect(boxAt(-0.66, T.D - 0.3, 0, 0.66, T.D - 0.22, 1.95, oak), move(extrudeXZ(doorPoly, 1, oak), 0, T.D, 0)));
  parts.push(boxAt(-0.012, T.D - 0.23, 0.02, 0.012, T.D - 0.2, 1.9, m('#4a3020', { tag: 'wall' })));
  const ir = iron('#2e2c34', { tag: 'wall' });
  for (const z of [0.4, 1.35]) for (const s of [-1, 1]) parts.push(boxAt(s * 0.62, T.D - 0.22, z, s * 0.1, T.D - 0.19, z + 0.07, ir, 0.01));
  for (let i = 0; i < 4; i++) for (const s of [-1, 1]) parts.push(move(sphere(0.022, ir), s * (0.18 + (i % 2) * 0.26), T.D - 0.2, 0.7 + Math.floor(i / 2) * 0.4));
  parts.push(place(torus(0.06, 0.012, ir), { at: [0.2, T.D - 0.18, 1.0], rx: PI / 2 }));
  // The step where Ambrose sits: a long slate slab, chamfered.
  parts.push(move(chamferBox(1.05, 0.22, 0.16, 0.08, 0.05, slate), 0, T.D + 0.2, 0));
  // Relic cyan, only at seams: a hairline in one course joint, and up the door's chamfers.
  const cy = relicCyan({ emit: 0.7 });
  parts.push(boxAt(-2.2, T.D - 0.005, 1.198, -0.9, T.D + 0.006, 1.222, cy));
  parts.push(boxAt(1.4, T.D - 0.005, 1.198, 2.45, T.D + 0.006, 1.222, cy));
  parts.push(boxAt(T.W - 0.005, -1.3, 1.198, T.W + 0.006, 0.6, 1.222, cy));
  for (const s of [-1, 1]) parts.push(capsule([s * 0.7, T.D + 0.005, 1.62], [s * 0.35, T.D + 0.005, 1.97], 0.011, cy));
  // ---- The limestone shaft.
  const lime = ashlar({ course: 0.42, block: 0.62, tones: ['#ccb48e', '#dcc6a0'], seed: 31 });
  let shaft = boxAt(T.x0, T.y0, T.base - 0.05, T.x1, T.y1, T.top, lime);
  // The belfry: arched openings, three to the south and three to the east, and hollow inside.
  const hollow = boxAt(T.x0 + 0.3, T.y0 + 0.3, T.belfry + 0.05, T.x1 - 0.3, T.y1 - 0.3, T.top - 0.35, null);
  const opens = [];
  for (const u of [-1.1, 0, 1.1]) opens.push(move(archCut(0.62, T.belfry + 0.1, T.belfry + 1.3, -0.4, 0.2), u, T.y1, 0));
  for (const u of [-1.05, -0.15, 0.75]) opens.push(place(archCut(0.62, T.belfry + 0.1, T.belfry + 1.3, -0.4, 0.2), { at: [T.x1, u, 0], rz: -PI / 2 }));
  const reveal = ashlar({ course: 0.42, block: 0.62, tones: ['#8a7860', '#9a8868'], seed: 32 });
  shaft = subtract(shaft, union(hollow, ...opens), reveal);
  parts.push(shaft);
  // Sills and string course, cornice.
  const cap = limestone('#e4d4b4', { tag: 'wall' });
  parts.push(boxAt(T.x0 - 0.06, T.y0 - 0.06, T.belfry - 0.1, T.x1 + 0.06, T.y1 + 0.06, T.belfry + 0.06, cap, 0.025));
  parts.push(boxAt(T.x0 - 0.12, T.y0 - 0.12, T.top - 0.05, T.x1 + 0.12, T.y1 + 0.12, T.top + 0.14, cap, 0.04));
  parts.push(boxAt(T.x0 - 0.04, T.y0 - 0.04, T.base - 0.08, T.x1 + 0.04, T.y1 + 0.04, T.base + 0.06, cap, 0.02));
  // ---- The bell, on its headstock in the middle south opening's light.
  const bellM = bronze('#a87440', { tag: 'wall' });
  // Hung high and forward, so it shows through the south openings from the plaza.
  const bz = T.belfry + 0.5, cx = 0, cyy = T.y1 - 0.95;
  parts.push(move(lathe([[0, 0.62], [0.2, 0.62], [0.27, 0.52], [0.3, 0.3], [0.38, 0.08], [0.46, 0.0], [0.44, -0.04], [0.32, 0.02], [0, 0.04]].map(([r, z]) => [r * 1.15, z * 1.15]), bellM, 0.01), cx, cyy, bz));
  parts.push(boxAt(T.x0 + 0.3, cyy - 0.08, bz + 0.64, T.x1 - 0.3, cyy + 0.08, bz + 0.8, wood('#5a3a24', { grain: 'x', tag: 'wall' }), 0.01));
  parts.push(move(sphere(0.07, iron('#2e2c34', { tag: 'wall' })), cx, cyy, bz + 0.02));
  // ---- The Mayor's clock: white enamel, a gilt rim, ten past ten.
  if (clock) {
    const cz = 4.25, R = 0.62;
    const hourA = (10 + 11 / 60) / 12 * 2 * PI, minA = 11 / 60 * 2 * PI;
    const dial = mat((x, y, z, lx, ly, lz) => {
      const u = x, v = z - cz, r = Math.hypot(u, v);
      const a = (Math.atan2(u, v) + 2 * PI) % (2 * PI);
      const tick = (a / (2 * PI)) * 12;
      const onHour = Math.abs(tick - Math.round(tick)) < (Math.round(tick) % 3 === 0 ? 0.09 : 0.05) && r > R * 0.72 && r < R * 0.9;
      if (onHour) return hex('#2a2430');
      if (Math.abs(r - R * 0.93) < 0.008) return hex('#8a7a70');
      return mix(hex('#f4f0e4'), hex('#e4dcc8'), r / R * 0.5);
    }, { tag: 'wall', spec: 0.6, shin: 40 });
    parts.push(place(cylinder(R, 0, 0.05, dial, 0.01), { at: [0, T.y1, cz], rx: -PI / 2 }));
    parts.push(place(torus(R + 0.02, 0.04, brass('#d8a840', { tag: 'wall' })), { at: [0, T.y1 + 0.05, cz], rx: PI / 2 }));
    const hand = m('#1e1a24', { spec: 0.6, tag: 'wall' });
    const hp = (a, L) => [Math.sin(a) * L, T.y1 + 0.08, cz + Math.cos(a) * L];
    parts.push(capsule([0, T.y1 + 0.08, cz], hp(hourA, R * 0.5), 0.022, hand));
    parts.push(capsule([0, T.y1 + 0.09, cz], hp(minA, R * 0.78), 0.014, hand));
    parts.push(move(sphere(0.035, brass('#d8a840', { tag: 'wall' })), 0, T.y1 + 0.1, cz));
    // The plaque: TESSEL ENTERS THE MODERN AGE.
    const plq = mat((x, y, z) => (Math.abs(((z - 3.3) * 30) % 1 - 0.5) < 0.18 && Math.abs(x) < 0.3 ? hex('#8a6420') : hex('#e0b850')), { tag: 'wall', spec: 0.9, shin: 40 });
    parts.push(boxAt(-0.36, T.y1, 3.36, 0.36, T.y1 + 0.03, 3.54, plq, 0.01));
    // The clock's drive shaft running up into the belfry: a newcomer's iron pipe on old stone.
    parts.push(boxAt(-0.03, T.y1, cz + R + 0.05, 0.03, T.y1 + 0.05, T.belfry - 0.1, iron('#3a3a44', { tag: 'wall' })));
  }
  // ---- The roof: a pyramid of lead-grey slates on the cornice, and a finial.
  const roofM = mat((x, y, z) => {
    const c = hex('#6c7480');
    const course = ((z + 10) * 7) % 1;
    const n = vnoise(Math.floor((x - y + 10) * 6), Math.floor((z + 10) * 7), 2);
    return tint(c, (course < 0.15 ? 0.72 : 1) * (0.86 + n * 0.22));
  }, { tag: 'roof', spec: 0.35, shin: 20 });
  const rcx = (T.x0 + T.x1) / 2, rcy = (T.y0 + T.y1) / 2, rhx = (T.x1 - T.x0) / 2 + 0.2, rhy = (T.y1 - T.y0) / 2 + 0.2;
  const z0 = T.top + 0.14, rise = 1.5;
  parts.push(custom((x, y, z) => {
    const qx = Math.abs(x - rcx) / rhx, qy = Math.abs(y - rcy) / rhy;
    const q = Math.max(qx, qy);
    const top = z0 + (1 - q) * rise;
    return Math.max((z - top) * 0.5, z0 - 0.08 - z, q - 1);
  }, [rcx - rhx, rcy - rhy, z0 - 0.1, rcx + rhx, rcy + rhy, z0 + rise], roofM));
  const gilt = brass('#e0b048', { tag: 'roof' });
  parts.push(capsule([rcx, rcy, z0 + rise - 0.1], [rcx, rcy, z0 + rise + 0.45], 0.025, gilt));
  parts.push(move(sphere(0.07, gilt), rcx, rcy, z0 + rise + 0.18));
  // A crescent moon vane, turned to face the plaza.
  parts.push(place(subtract(place(cylinder(0.14, -0.012, 0.012, gilt), { rx: PI / 2 }), move(place(cylinder(0.12, -0.05, 0.05, null), { rx: PI / 2 }), 0.07, 0, 0.02)), { at: [rcx, rcy, z0 + rise + 0.5], rz: FISH_TURN }));
  void t;
  return union(parts);
}

// ---------------------------------------------------------------------------
// The Blue Dome (6×6, sits on the Archive's flat roof): a squat whitewashed
// drum ringed with oculi, a cobalt dome in glazed courses with ribs, a little
// lantern ring, and a moon finial (a crescent on a stem). Never a postcard dome
// on a cube with a cross.

export function blueDome() {
  const Rd = 2.75, hd = 1.05, Rdome = 2.62, hDome = 1.75;
  const pl = plaster('#ece6d8', { axis: 'x', base: 0, top: hd });
  const parts = [];
  // The drum, its plinth ring, and its cornice.
  let drum = cylinder(Rd, 0, hd, pl);
  const oc = [], rings = [];
  const n = 10;
  const glassM = mat((x, y, z) => mix(hex('#1c2438'), hex('#4a6a98'), clamp((z - 0.4) / 0.4, 0, 1) * 0.5), { tag: 'wall', spec: 1.2, shin: 60 });
  const stoneM = limestone('#e0d0b0', { tag: 'wall' });
  for (let i = 0; i < n; i++) {
    const a = (i + 0.5) / n * 2 * PI;
    const ax = Math.cos(a), ay = Math.sin(a);
    oc.push(place(cylinder(0.2, Rd - 0.12, Rd + 0.3, null), { at: [0, 0, 0.56], ry: PI / 2, rz: a }));
    // Rotating a z-cylinder by ry = π/2 lays it along x; rz turns it to the radial direction.
    parts.push(place(cylinder(0.2, Rd - 0.12, Rd - 0.08, glassM), { at: [0, 0, 0.56], ry: PI / 2, rz: a }));
    rings.push(place(torus(0.215, 0.035, stoneM), { at: [ax * (Rd + 0.0), ay * (Rd + 0.0), 0.56], ry: PI / 2, rz: a }));
  }
  drum = subtract(drum, union(oc), plaster('#d4ccbc', { tag: 'wall' }));
  parts.push(drum, ...rings);
  parts.push(cylinder(Rd + 0.1, 0, 0.16, plaster('#ddd4c4', { axis: 'x' }), 0.03));
  parts.push(cylinder(Rd + 0.14, hd - 0.04, hd + 0.1, limestone('#eae0c8', { tag: 'wall' }), 0.04));
  // The dome: a squashed hemisphere, sixteen shallow ribs raised a little.
  const tiles = domeTiles({ ribs: 16 });
  const z0 = hd + 0.08;
  parts.push(custom((x, y, z) => {
    const lz = z - z0;
    const k0 = Math.hypot(x / Rdome, y / Rdome, lz / hDome);
    const k1 = Math.hypot(x / (Rdome * Rdome), y / (Rdome * Rdome), lz / (hDome * hDome));
    let d = k1 === 0 ? -1 : (k0 * (k0 - 1)) / k1;
    const a = Math.atan2(y, x);
    const rib = Math.max(0, Math.cos(a * 16)) ** 30 * 0.035 * clamp(1 - lz / hDome, 0, 1);
    d -= rib;
    return Math.max(d, -lz);
  }, [-Rdome - 0.05, -Rdome - 0.05, z0, Rdome + 0.05, Rdome + 0.05, z0 + hDome + 0.05], {
    ...tiles,
    color: (x, y, z, lx, ly, lz) => tiles.color(x, y, z, x, y, (z - z0) / hDome * 1.4),
  }));
  // The lantern ring at the crown, and the moon finial.
  const top = z0 + hDome;
  parts.push(cylinder(0.34, top - 0.12, top + 0.12, plaster('#ece6d8'), 0.03));
  parts.push(cylinder(0.4, top + 0.1, top + 0.17, limestone('#eae0c8', { tag: 'wall' }), 0.025));
  parts.push(move(sphere(0.18, domeTiles({ ribs: 8 })), 0, 0, top + 0.17));
  const gilt = brass('#e8b848', { tag: 'roof' });
  parts.push(capsule([0, 0, top + 0.3], [0, 0, top + 0.7], 0.022, gilt));
  parts.push(move(sphere(0.045, gilt), 0, 0, top + 0.44));
  // The crescent: a disc less an offset disc, turned to face the viewer.
  const disc = place(cylinder(0.17, -0.018, 0.018, gilt, 0.006), { rx: PI / 2 });
  const bite = move(place(cylinder(0.15, -0.1, 0.1, null), { rx: PI / 2 }), 0.09, 0, 0.03);
  parts.push(place(subtract(disc, bite), { at: [0, 0, top + 0.86], rz: FISH_TURN }));
  return union(parts);
}

// ---------------------------------------------------------------------------
// Fronts: two-tile south faces (x −1…1, the face at y = +0.5), one storey (96 px).

const STOREY = 2.4;

function frontWall(color, { h = STOREY, plinth = 0.2, w = 1 } = {}) {
  const pl = plaster(color, { axis: 'x', stainHeight: 0.5, base: plinth, top: h });
  return [
    boxAt(-w, -0.5, plinth, w, 0.5, h, pl),
    boxAt(-w, -0.5, 0, w, 0.5, plinth, plaster('#d8ccb4', { axis: 'x' })),
    boxAt(-w, 0.48, 0, w, 0.525, plinth, plaster('#d4c8b0', { axis: 'x' }), 0.012),
  ];
}

const moonEyes = (xs, y, z) => xs.map((x) => move(sphere(0.026, moonEyeGlass()), x, y, z));

/** The Archive's door (2×1 south face): an arched limestone surround with a keystone, a cobalt double door, a fanlight, three moon-eyes in the step. */
export function domeDoor() {
  const parts = frontWall(COLORS.whitewash);
  const w = 1.1, z1 = 2.2, Y = 0.5;
  const surround = limestone('#e2d2b0', { tag: 'wall' });
  let wall = union(parts);
  wall = subtract(wall, move(archCut(w, 0, z1, -0.2, 0.2), 0, Y, 0), plaster('#d0c8b8', { tag: 'wall' }));
  const out = [wall];
  // The surround: an arch of limestone standing proud, with a keystone.
  const ring = subtract(move(archCut(w + 0.34, 0, z1 + 0.17, -0.05, 0.05), 0, Y, 0), move(archCut(w, -0.1, z1, -0.2, 0.2), 0, Y, 0), surround);
  out.push(ring);
  out.push(move(extrudeXZ([[-0.12, z1 - 0.02], [0.12, z1 - 0.02], [0.16, z1 + 0.24], [-0.16, z1 + 0.24]], 0.07, surround), 0, Y + 0.02, 0));
  // The doors: cobalt panels with mouldings, set back.
  const cob = paintedWood('#2c5cb0', { tag: 'wall', wear: '#8aa0c0', wearAt: 0.8 });
  const zr = z1 - w / 2; // springing line
  for (const s of [-1, 1]) {
    out.push(boxAt(s > 0 ? 0.008 : -w / 2, Y - 0.16, 0.02, s > 0 ? w / 2 : -0.008, Y - 0.1, zr, cob));
    for (const [za, zb] of [[0.18, 0.75], [0.9, zr - 0.12]]) out.push(boxAt(s * 0.08 + (s > 0 ? 0 : -0.38), Y - 0.1, za, s * 0.08 + (s > 0 ? 0.38 : 0), Y - 0.08, zb, cob, 0.012));
    out.push(move(sphere(0.03, brass('#d8a840', { tag: 'wall' })), s * 0.07, Y - 0.07, 1.0));
  }
  // The transom and fanlight with radiating bars.
  out.push(boxAt(-w / 2, Y - 0.17, zr - 0.02, w / 2, Y - 0.08, zr + 0.04, cob));
  const fan = mat((x, y, z) => {
    const a = Math.atan2(z - zr, x), r = Math.hypot(x, z - zr);
    const bar = Math.abs(((a / PI) * 6) % 1 - 0.5) > 0.44 || Math.abs(r - 0.22) < 0.018;
    return bar ? hex('#e8e4d8') : mix(hex('#283048'), hex('#7090b8'), clamp((z - zr) / 0.5, 0, 1) * 0.6);
  }, { tag: 'wall', spec: 1.0, shin: 50 });
  out.push(intersect(boxAt(-w / 2, Y - 0.17, zr, w / 2, Y - 0.12, z1, fan), move(archCut(w, 0, z1, -0.5, 0.5), 0, Y, 0)));
  // The step, with its moon-eyes.
  out.push(boxAt(-w / 2 - 0.1, Y - 0.16, 0, w / 2 + 0.1, Y + 0.18, 0.08, limestone('#d8c8a8', { tag: 'wall' }), 0.015));
  out.push(...moonEyes([-0.28, 0, 0.28], Y + 0.06, 0.077));
  return union(out);
}

/** A tiny clock face (on the YZ-facing plane) for the shop window: center (x, z), radius r. */
function smallClock(x, y, z, r, seed) {
  const R0 = rng(seed);
  const caseM = R0() < 0.5 ? wood(R0() < 0.5 ? '#6a4028' : '#8a5a30', { tag: 'wall' }) : brass('#d0a040', { tag: 'wall' });
  const h1 = R0() * 2 * PI, h2 = R0() * 2 * PI;
  const face = mat((wx, wy, wz) => {
    const u = wx - x, v = wz - z, rr = Math.hypot(u, v);
    const a = Math.atan2(u, v);
    const d1 = Math.abs(Math.sin(a - h1)) * rr, d2 = Math.abs(Math.sin(a - h2)) * rr;
    const along1 = Math.cos(a - h1) > 0 && rr < r * 0.5, along2 = Math.cos(a - h2) > 0 && rr < r * 0.8;
    if ((along1 && d1 < 0.012) || (along2 && d2 < 0.008)) return hex('#201820');
    return hex('#f0e8d4');
  }, { tag: 'wall', spec: 0.5 });
  const shape = R0();
  const out = [];
  if (shape < 0.35) {
    out.push(place(cylinder(r + 0.025, -0.03, 0.03, caseM, 0.01), { at: [x, y, z], rx: -PI / 2 }));
  } else if (shape < 0.7) {
    // A mantel clock: an arch-topped case.
    out.push(boxAt(x - r - 0.04, y - 0.06, z - r - 0.1, x + r + 0.04, y + 0.02, z + r * 0.2, caseM, 0.01));
    out.push(place(cylinder(r + 0.04, -0.06, 0.02, caseM, 0.01), { at: [x, y, z], rx: -PI / 2 }));
  } else {
    // A little longcase: a tall narrow case under the dial.
    out.push(boxAt(x - r - 0.02, y - 0.06, z - r - 0.45, x + r + 0.02, y + 0.02, z + r + 0.04, caseM, 0.01));
  }
  out.push(place(cylinder(r, 0, 0.012, face), { at: [x, y + 0.025, z], rx: -PI / 2 }));
  return union(out);
}

/** The Clockmaker's shop front (2×1, ochre): a fascia with a painted clock over a window full of clocks. */
export function clockshopFront() {
  const Y = 0.5;
  let wall = union(frontWall(COLORS.ochre));
  // The window opening: flat-headed, deep, with a sage-painted frame.
  const wx = 0.82, wz0 = 0.45, wz1 = 1.8;
  wall = subtract(wall, boxAt(-wx, Y - 0.25, wz0, wx, Y + 0.1, wz1, null), plaster('#d4b070', { tag: 'wall' }));
  const out = [wall];
  const frameM = paintedWood('#2c5cb0', { tag: 'wall', wearAt: 0.8 });
  out.push(boxAt(-wx - 0.06, Y - 0.06, wz0 - 0.08, wx + 0.06, Y + 0.08, wz0, limestone('#e0d0b4', { tag: 'wall' }), 0.012));
  for (const x of [-wx, wx]) out.push(boxAt(x - 0.045, Y - 0.12, wz0, x + 0.045, Y + 0.02, wz1, frameM, 0.01));
  out.push(boxAt(-wx, Y - 0.12, wz1 - 0.06, wx, Y + 0.02, wz1 + 0.02, frameM, 0.01));
  for (const x of [-0.28, 0.28]) out.push(boxAt(x - 0.018, Y - 0.13, wz0, x + 0.018, Y - 0.1, wz1 - 0.05, frameM));
  out.push(boxAt(-wx, Y - 0.13, 1.18, wx, Y - 0.1, 1.215, frameM));
  // Behind the glass: two shelves of clocks, every one telling a different time.
  const clocks = [];
  const shelfM = wood('#6a4428', { grain: 'x', tag: 'wall' });
  const yb = Y - 0.36;
  clocks.push(boxAt(-wx, yb - 0.1, 0.62, wx, yb + 0.12, 0.66, shelfM), boxAt(-wx, yb - 0.1, 1.2, wx, yb + 0.12, 1.24, shelfM));
  let s = 1;
  for (const [x, z, r] of [[-0.62, 0.86, 0.11], [-0.36, 0.8, 0.07], [-0.12, 0.88, 0.12], [0.16, 0.82, 0.08], [0.4, 0.9, 0.12], [0.66, 0.8, 0.07],
    [-0.6, 1.42, 0.12], [-0.3, 1.36, 0.08], [-0.05, 1.46, 0.13], [0.24, 1.38, 0.09], [0.5, 1.44, 0.11], [0.7, 1.36, 0.06]]) clocks.push(smallClock(x, yb, z, r, s++));
  // A pendulum wall clock hanging on the back wall, in the middle.
  const inside = union(...clocks, boxAt(-wx, Y - 0.62, wz0, wx, Y - 0.58, wz1, m('#3a2a24', { tag: 'wall' })));
  const film = (x, y, z) => mix(hex('#1e2232'), hex('#8aa0c0'), clamp((z - wz0) / (wz1 - wz0), 0, 1) * 0.5 + (Math.abs(((x - z * 0.7) * 2.2) % 1) < 0.12 ? 0.25 : 0));
  out.push(boxAt(-wx, Y - 0.12, wz0, wx, Y - 0.105, wz1, seeThrough(film, sdfUnder(inside, { dim: 0.95 }), { k: 0.3, depth: 0.75, steps: 60, tag: 'wall', spec: 1.2, shin: 60, emit: 0.1 })));
  // The fascia: a cream board with a cobalt border, a painted clock in the middle.
  const fasc = mat((x, y, z) => {
    const u = x, v = z - 2.12, r = Math.hypot(u, v);
    if (Math.abs(u) > 0.9 || Math.abs(v) > 0.16) return hex('#2c5cb0');
    if (r < 0.15) {
      const a = Math.atan2(u, v);
      if (Math.abs(r - 0.14) < 0.012) return hex('#2c5cb0');
      if ((Math.abs(Math.sin(a - 0.3)) * r < 0.012 && Math.cos(a - 0.3) > 0 && r < 0.1) || (Math.abs(Math.sin(a + 1.9)) * r < 0.01 && Math.cos(a + 1.9) > 0 && r < 0.13)) return hex('#201820');
      return hex('#f4ecd8');
    }
    // Lettering, suggested: a row of cobalt strokes either side.
    if (Math.abs(v) < 0.05 && r > 0.22 && Math.abs(u) < 0.8 && Math.abs(((u + 2) * 18) % 1 - 0.5) < 0.26) return hex('#2c5cb0');
    return hex('#f0e6cc');
  }, { tag: 'wall', spec: 0.15 });
  out.push(boxAt(-0.98, Y, 1.92, 0.98, Y + 0.05, 2.32, fasc, 0.01));
  return union(out);
}

/** The Clockmaker's hanging sign (1×1): a wrought-iron bracket out from the wall (at y = −0.5) with a double-sided clock. */
export function clockSign() {
  const ir = iron('#2a2830', { tag: 'prop' });
  const parts = [];
  const z = 2.45, y0 = -0.5;
  parts.push(boxAt(-0.05, y0, z - 0.25, 0.05, y0 + 0.03, z + 0.1, ir, 0.01));
  parts.push(capsule([0, y0, z + 0.05], [0, y0 + 0.62, z + 0.05], 0.018, ir));
  parts.push(capsule([0, y0, z - 0.2], [0, y0 + 0.32, z + 0.05], 0.012, ir));
  // A curl.
  parts.push(place(torus(0.06, 0.01, ir), { at: [0, y0 + 0.2, z - 0.02], ry: PI / 2 }));
  // The sign: a round clock in a gilt case, hung on two rings, facing east and west.
  const cy = y0 + 0.42, cz = z - 0.28;
  parts.push(capsule([0, cy - 0.08, z + 0.03], [0, cy - 0.08, cz + 0.12], 0.008, ir), capsule([0, cy + 0.08, z + 0.03], [0, cy + 0.08, cz + 0.12], 0.008, ir));
  const dial = mat((x, y, zz) => {
    const u = y - cy, v = zz - cz, r = Math.hypot(u, v), a = Math.atan2(u, v);
    if (r > 0.13) return hex('#d8a840');
    const tk = (a / (2 * PI)) * 12;
    if (r > 0.1 && Math.abs(tk - Math.round(tk)) < 0.08) return hex('#201820');
    if ((Math.abs(Math.sin(a - 0.5)) * r < 0.01 && Math.cos(a - 0.5) > 0 && r < 0.07) || (Math.abs(Math.sin(a + 2.6)) * r < 0.008 && Math.cos(a + 2.6) > 0 && r < 0.1)) return hex('#201820');
    return hex('#f4ecd8');
  }, { tag: 'prop', spec: 0.6, shin: 40 });
  parts.push(place(cylinder(0.16, -0.035, 0.035, dial, 0.012), { at: [0, cy, cz], ry: PI / 2 }));
  parts.push(place(torus(0.16, 0.02, brass('#d8a840')), { at: [0, cy, cz], ry: PI / 2 }));
  return union(parts);
}

/** The Shop's front window (2×1, rose plaster) with its display: 'hat' (the straw hat) or 'scope' (the Keeper's telescope). */
export function shopFront(display = 'hat') {
  const Y = 0.5;
  let wall = union(frontWall(COLORS.rose));
  const wx = 0.84, wz0 = 0.5, wz1 = 1.9;
  wall = subtract(wall, boxAt(-wx, Y - 0.6, wz0, wx, Y + 0.1, wz1, null), plaster('#d89a8a', { tag: 'wall' }));
  const out = [wall];
  const frameM = paintedWood('#4a7048', { tag: 'wall', wearAt: 0.8 });
  // Stallriser, frame, and bars.
  out.push(boxAt(-wx - 0.08, Y - 0.08, wz0 - 0.1, wx + 0.08, Y + 0.07, wz0, frameM, 0.012));
  for (const x of [-wx, wx]) out.push(boxAt(x - 0.05, Y - 0.12, wz0, x + 0.05, Y + 0.03, wz1, frameM, 0.01));
  out.push(boxAt(-wx, Y - 0.12, wz1 - 0.07, wx, Y + 0.03, wz1 + 0.02, frameM, 0.01));
  out.push(boxAt(-0.015, Y - 0.13, wz0, 0.015, Y - 0.1, wz1 - 0.06, frameM));
  // The display: a stand with a cream cloth, and on it the hat or the telescope.
  const dz = 0.82, yb = Y - 0.38;
  const inside = [];
  const cloth = m('#f0e4cc', { tag: 'wall', spec: 0.05 });
  inside.push(boxAt(-0.6, yb - 0.18, wz0, 0.6, yb + 0.18, dz, cloth, 0.02));
  inside.push(boxAt(-wx, Y - 0.62, wz0, wx, Y - 0.58, wz1, m('#5a3a34', { tag: 'wall' })));
  if (display === 'hat') {
    // The wide straw hat on a head-stand, a cobalt band, and its coral price card.
    const straw = mat((x, y, z) => tint(hex('#e8c878'), 0.85 + vnoise(x * 80, y * 80, z * 30) * 0.2 + (Math.sin(Math.hypot(x, yb - y) * 140) > 0.6 ? -0.08 : 0)), { tag: 'wall', spec: 0.1 });
    inside.push(capsule([0, yb, dz], [0, yb, dz + 0.24], 0.025, wood('#6a4428', { tag: 'wall' })));
    inside.push(move(cylinder(0.36, 0, 0.022, straw, 0.01), 0, yb, dz + 0.3));
    inside.push(move(frustum(0.15, 0.12, 0.02, 0.17, straw, 0.03), 0, yb, dz + 0.3));
    inside.push(move(cylinder(0.153, 0.02, 0.07, m('#2c5cb0', { tag: 'wall' })), 0, yb, dz + 0.3));
    inside.push(place(boxAt(-0.08, -0.004, 0, 0.08, 0.004, 0.1, m('#e06048', { tag: 'wall' })), { at: [0.32, yb + 0.1, dz], rx: -0.4 }));
  } else {
    // The telescope on two little wooden cradles, angled up toward the window. Curated, not for sale.
    const b = brass('#d8a840', { tag: 'wall' });
    const cr = wood('#7a5032', { tag: 'wall' });
    for (const x of [-0.25, 0.22]) inside.push(boxAt(x - 0.04, yb - 0.08, dz, x + 0.04, yb + 0.08, dz + 0.1 + (x < 0 ? 0 : 0.08), cr, 0.01));
    const a = [-0.5, yb, dz + 0.15], e = [0.5, yb, dz + 0.32];
    inside.push(roundCone(a, [0, yb, dz + 0.235], 0.04, 0.05, b));
    inside.push(roundCone([0, yb, dz + 0.235], e, 0.055, 0.065, b));
    inside.push(place(torus(0.06, 0.012, m('#3a2a24', { tag: 'wall' })), { at: [0.05, yb, dz + 0.245], ry: PI / 2 - 0.17 }));
  }
  const film = (x, y, z) => mix(hex('#1e2232'), hex('#9ab0cc'), clamp((z - wz0) / (wz1 - wz0), 0, 1) * 0.45 + (Math.abs(((x - z * 0.7) * 2.0) % 1) < 0.1 ? 0.3 : 0));
  out.push(boxAt(-wx, Y - 0.12, wz0, wx, Y - 0.105, wz1, seeThrough(film, sdfUnder(union(inside), { dim: 1.0 }), { k: 0.28, depth: 0.8, steps: 70, tag: 'wall', spec: 1.2, shin: 60, emit: 0.12 })));
  // A painted fascia: SHOP, suggested.
  const fasc = mat((x, y, z) => {
    const v = z - 2.12;
    if (Math.abs(x) > 0.92 || Math.abs(v) > 0.13) return hex('#4a7048');
    if (Math.abs(v) < 0.05 && Math.abs(x) < 0.4 && Math.abs(((x + 2) * 12) % 1 - 0.5) < 0.3) return hex('#4a7048');
    return hex('#f0e6cc');
  }, { tag: 'wall', spec: 0.15 });
  out.push(boxAt(-0.98, Y, 1.96, 0.98, Y + 0.05, 2.28, fasc, 0.01));
  return union(out);
}

/** The Mayor's office front (2×1, pale sky plaster): his door (west tile) and the brass plaque (east tile). */
export function mayorFront() {
  const Y = 0.5;
  let wall = union(frontWall('#d8e4e8'));
  const dx = -0.5, w = 0.7, z1 = 2.2;
  wall = subtract(wall, move(archCut(w, 0, z1, -0.2, 0.2), dx, Y, 0), plaster('#c8d0d4', { tag: 'wall' }));
  const out = [wall];
  // A polished door: dark varnished wood, a brass knocker and letterbox, a fanlight.
  const varn = mat((x, y, z) => tint(hex('#5a3424'), 0.85 + vnoise(x * 60, z * 4, 0.3) * 0.2 + (((x + 10) * 8) % 1 < 0.06 ? -0.2 : 0)), { tag: 'wall', spec: 0.5, shin: 30 });
  const zr = z1 - w / 2;
  out.push(boxAt(dx - w / 2, Y - 0.16, 0.02, dx + w / 2, Y - 0.1, zr, varn));
  for (const [za, zb] of [[0.2, 0.8], [0.95, zr - 0.12]]) out.push(boxAt(dx - 0.26, Y - 0.1, za, dx + 0.26, Y - 0.085, zb, varn, 0.01));
  const b = brass('#e0b048', { tag: 'wall' });
  out.push(place(torus(0.05, 0.011, b), { at: [dx, Y - 0.06, 1.3], rx: PI / 2 }));
  out.push(boxAt(dx - 0.1, Y - 0.09, 0.86, dx + 0.1, Y - 0.07, 0.9, b));
  out.push(move(sphere(0.025, b), dx + 0.24, Y - 0.07, 1.0));
  const fan = mat((x, y, z) => mix(hex('#283048'), hex('#7090b8'), clamp((z - zr) / 0.4, 0, 1) * 0.6), { tag: 'wall', spec: 1.0, shin: 50 });
  out.push(intersect(boxAt(dx - w / 2, Y - 0.17, zr, dx + w / 2, Y - 0.12, z1, fan), move(archCut(w, 0, z1, -0.5, 0.5), dx, Y, 0)));
  out.push(boxAt(dx - w / 2, Y - 0.16, zr - 0.02, dx + w / 2, Y - 0.08, zr + 0.03, varn));
  // Two steps up to it.
  const st = limestone('#dccab0', { tag: 'wall' });
  out.push(boxAt(dx - 0.5, Y - 0.16, 0, dx + 0.5, Y + 0.34, 0.08, st, 0.012));
  out.push(boxAt(dx - 0.44, Y - 0.16, 0.08, dx + 0.44, Y + 0.14, 0.16, st, 0.012));
  out.push(...moonEyes([dx - 0.2, dx, dx + 0.2], Y + 0.24, 0.077));
  // The plaque: brass, engraved, polished every morning.
  const plq = mat((x, y, z) => (Math.abs(((z - 1.2) * 26) % 1 - 0.5) < 0.16 && Math.abs(x - 0.5) < 0.17 && z > 1.24 && z < 1.52 ? hex('#8a6420') : hex('#e8c058')), { tag: 'wall', spec: 1.1, shin: 50 });
  out.push(boxAt(0.28, Y, 1.18, 0.72, Y + 0.03, 1.58, plq, 0.012));
  for (const x of [0.32, 0.68]) for (const z of [1.22, 1.54]) out.push(move(sphere(0.012, b), x, Y + 0.035, z));
  // A carved town crest over the door: a moon disc on a shield.
  out.push(move(extrudeXZ([[-0.1, 2.37], [0.1, 2.37], [0.1, 2.27], [0, 2.2], [-0.1, 2.27]], 0.03, limestone('#e8dcc0', { tag: 'wall' }), 0.008), dx + 0.48, Y + 0.02, 0));
  out.push(place(cylinder(0.04, 0, 0.02, m('#2c5cb0', { tag: 'wall', spec: 0.4 })), { at: [dx + 0.48, Y + 0.05, 2.29], rx: -PI / 2 }));
  return union(out);
}

// ---------------------------------------------------------------------------
// Fountain Square's props.

/** A market stall (2×2): a counter along the south row with lemons, onions and Moonshine basins, under a striped canopy on poles. */
export function marketStall({ stripe = '#d05848' } = {}) {
  const parts = [];
  const w = wood('#9a6a40', { grain: 'x' });
  const pole = wood('#7a5032', { grain: 'z' });
  // Counter: plank front, a top board, and a shelf behind.
  const front = mat((x, y, z) => tint(hex('#8a6038'), (((z + 10) * 7) % 1 < 0.08 ? 0.65 : 1) * (0.88 + vnoise(x * 40, z * 4, 2) * 0.16)), { tag: 'prop', spec: 0.08 });
  parts.push(boxAt(-0.95, 0.05, 0, 0.95, 0.5, 0.8, front, 0.015));
  parts.push(boxAt(-0.99, 0.0, 0.8, 0.99, 0.55, 0.86, w, 0.015));
  // Crates of lemons and onions on top.
  const crate = wood('#b88a58', { grain: 'x' });
  const lem = m('#f2cc30', { spec: 0.5, shin: 20 }), oni = m('#c88a48', { spec: 0.3 });
  for (const [cx, fruit, seed] of [[-0.55, lem, 1], [0.05, oni, 2]]) {
    parts.push(subtract(boxAt(cx - 0.26, 0.1, 0.86, cx + 0.26, 0.46, 1.0, crate, 0.01), boxAt(cx - 0.23, 0.13, 0.9, cx + 0.23, 0.43, 1.1, null), crate));
    const R = rng(seed);
    for (let i = 0; i < 14; i++) parts.push(move(fruit === lem ? ellipsoid(0.05, 0.04, 0.04, lem) : sphere(0.045, oni), cx - 0.18 + (i % 5) * 0.09 + (R() - 0.5) * 0.02, 0.17 + Math.floor(i / 5) * 0.1 + (R() - 0.5) * 0.02, 0.97 + R() * 0.03));
  }
  // A stack of tin basins (Moonshine Night basins, half price).
  const tin = mat('#a8b0b8', { tag: 'prop', spec: 0.8, shin: 40 });
  for (let i = 0; i < 4; i++) parts.push(move(subtract(frustum(0.15, 0.2, 0, 0.08, tin, 0.008), frustum(0.13, 0.18, 0.015, 0.2, null)), 0.62, 0.28, 0.86 + i * 0.035));
  // A chalk price board leaning on the counter front.
  parts.push(place(boxAt(-0.16, -0.01, 0, 0.16, 0.01, 0.34, m('#3a3a38', { spec: 0.05 }), 0.01), { at: [-0.55, 0.62, 0.0], rx: -0.22 }));
  parts.push(place(boxAt(-0.11, -0.003, 0.1, 0.11, 0.003, 0.12, m('#e8e8e0')), { at: [-0.55, 0.6, 0.06], rx: -0.22 }));
  // Poles: higher at the back, so the canopy runs down toward the shoppers.
  const back = -0.9, frontY = 0.52, zb = 2.3, zf = 1.95;
  for (const x of [-0.95, 0.95]) {
    parts.push(capsule([x, frontY, 0], [x, frontY, zf], 0.03, pole));
    parts.push(capsule([x, back, 0], [x, back, zb], 0.03, pole));
  }
  // The canopy: striped cloth with a scalloped valance along the front.
  const cream = hex('#f0e8d0'), red = hex(stripe);
  const cl = mat((x, y, z) => {
    const s = Math.floor((x + 10) / 0.19) % 2;
    return tint(s ? red : cream, 0.92 + vnoise(x * 20, y * 20, z * 20) * 0.1);
  }, { tag: 'prop', spec: 0.05, emit: 0.12 });
  const slope = (zb - zf) / (frontY - back);
  parts.push(custom((x, y, z) => {
    const top = zb - (y - back) * slope + Math.sin((x + 1) * 16) * 0.01 - Math.max(0, 0.03 - Math.abs(x) * 0.0);
    const dz = Math.abs(z - top) - 0.012;
    return Math.max(dz * 0.9, Math.abs(x) - 1.02, back - 0.08 - y, y - frontY - 0.06);
  }, [-1.05, back - 0.1, zf - 0.05, 1.05, frontY + 0.08, zb + 0.08], cl));
  parts.push(custom((x, y, z) => {
    const hem = zf - 0.22 + Math.abs(Math.sin((x + 1) * PI * 2.6)) * 0.08;
    return Math.max(Math.abs(y - frontY - 0.06) - 0.01, Math.abs(x) - 1.02, z - zf + 0.0, hem - z) * 0.9;
  }, [-1.05, frontY + 0.03, zf - 0.32, 1.05, frontY + 0.09, zf + 0.02], cl));
  return union(parts);
}

/** A café table (1×1): a round marble top on an iron pedestal, a coffee cup and saucer. */
export function cafeTable() {
  const ir = iron('#2e2c34');
  const marble = mat((x, y, z) => mix(hex('#ece8e0'), hex('#b8b4b0'), Math.max(0, Math.sin(x * 14 + fbm(x * 4, y * 4, 1, 3) * 6) - 0.7) * 2), { tag: 'prop', spec: 0.6, shin: 40 });
  const cup = m('#f4f0e8', { spec: 0.8, shin: 40 });
  return union(
    move(cylinder(0.32, 0.7, 0.735, marble, 0.012), 0, 0, 0),
    move(cylinder(0.33, 0.69, 0.705, ir, 0.006), 0, 0, 0),
    capsule([0, 0, 0.06], [0, 0, 0.7], 0.025, ir),
    ...[0, 1, 2].map((i) => { const a = i * 2 * PI / 3 + 0.3; return capsule([0, 0, 0.12], [Math.cos(a) * 0.24, Math.sin(a) * 0.24, 0.015], 0.018, ir); }),
    move(cylinder(0.07, 0.735, 0.745, cup, 0.004), 0.1, 0.06, 0),
    move(subtract(frustum(0.035, 0.042, 0.745, 0.81, cup, 0.004), move(cylinder(0.032, 0.76, 0.85, null), 0, 0, 0), cup), 0.1, 0.06, 0),
    move(cylinder(0.03, 0.795, 0.8, m('#3a2418', { spec: 0.6 })), 0.1, 0.06, 0),
    place(torus(0.018, 0.005, cup), { at: [0.145, 0.06, 0.78], rx: PI / 2 }),
  );
}

/** A café chair (1×1): bentwood with a cane seat, facing `face` radians (0 = +x; PI/2 = south, toward the viewer). */
export function cafeChair({ face = PI / 2 } = {}) {
  const bw = wood('#4a2c20', { grain: 'z', spec: 0.4 });
  const cane = mat((x, y, z) => {
    const a = Math.sin(x * 120) * Math.sin(y * 120);
    return tint(hex('#d8b878'), 0.85 + (a > 0 ? 0.12 : -0.05));
  }, { tag: 'prop', spec: 0.15 });
  const parts = [move(cylinder(0.2, 0.43, 0.46, cane, 0.01), 0, 0, 0), move(torus(0.2, 0.016, bw), 0, 0, 0.445)];
  for (let i = 0; i < 4; i++) {
    const a = PI / 4 + i * PI / 2;
    parts.push(capsule([Math.cos(a) * 0.15, Math.sin(a) * 0.15, 0.44], [Math.cos(a) * 0.19, Math.sin(a) * 0.19, 0.0], 0.016, bw));
  }
  parts.push(move(torus(0.15, 0.01, bw), 0, 0, 0.2));
  // The back: a bent hoop at the chair's rear (−x before turning).
  for (const s of [-1, 1]) parts.push(capsule([-0.15, s * 0.11, 0.44], [-0.2, s * 0.12, 0.88], 0.016, bw));
  parts.push(place(torus(0.12, 0.016, bw), { at: [-0.2, 0, 0.84], ry: PI / 2 + 0.1 }));
  parts.push(capsule([-0.18, 0, 0.45], [-0.19, 0, 0.74], 0.012, bw));
  return place(union(parts), { rz: face });
}

/** The Mayor's crate (1×1): a stout fruit crate turned over, stencilled, its lid 0.3 m up (12 px). */
export function mayorCrate() {
  const slat = mat((x, y, z, lx, ly, lz) => {
    const s = ((lz + 1) * 10) % 1;
    let c = tint(hex('#b88a58'), (s < 0.12 ? 0.68 : 1) * (0.86 + vnoise(lx * 40, ly * 40, lz * 3) * 0.18));
    // A stencilled mark on the south face.
    if (ly > 0.2 && Math.abs(lx) < 0.12 && Math.abs(lz - 0.16) < 0.06 && Math.abs(((lx + 1) * 30) % 1 - 0.5) < 0.3) c = tint(c, 0.55);
    return c;
  }, { tag: 'prop', spec: 0.08 });
  const corner = wood('#8a6038', { grain: 'z' });
  const parts = [boxAt(-0.3, -0.23, 0, 0.3, 0.23, 0.3, slat, 0.012)];
  for (const sx of [-1, 1]) for (const sy of [-1, 1]) parts.push(boxAt(sx * 0.3 - 0.03, sy * 0.23 - 0.03, 0, sx * 0.3 + 0.03, sy * 0.23 + 0.03, 0.31, corner, 0.01));
  return union(parts);
}

// ---------------------------------------------------------------------------
// The Hundred Steps. One tile of flight descends one tile height (40 px) to
// the south in five steps of 8 px, like the court's stair: the frame's base is
// the south edge (z = 0), the north edge is at z = 1. `l` and `r` are the two
// halves of the two-wide flight. Old limestone, the treads dished in the middle
// by four hundred years of feet; moon-eyes set in some risers.

const STEP_RISE = 0.2;

function stepStone(seed, { wet = 0 } = {}) {
  return mat((x, y, z, lx, ly, lz, nx, ny, nz) => {
    const id = hash3(Math.floor(z * 5 + 0.5 + 50), seed, 7);
    let c = mix(hex('#d4bf98'), hex('#e2d0ac'), id);
    const n = fbm(x * 9 + seed, y * 9, z * 9, 3);
    c = tint(c, 0.88 + n * 0.18);
    // Worn, slightly polished in the middle of each tread, where the feet go.
    if (nz > 0.7) c = mix(c, hex('#ead8b4'), Math.max(0, 0.3 - Math.abs(x - 0.0) * 0.5) * 0.6);
    // A joint between the two halves' stones.
    if (Math.abs(x) > 0.485) c = tint(c, 0.78);
    if (wet && nz > 0.7) c = mix(c, hex('#8a8070'), wet);
    return c;
  }, { tag: 'floor', spec: 0.06, shin: 10 });
}

/** One tile of the flight: half 'l' or 'r'; `moon` sets a moon-eye in the middle riser. */
export function stepsTile(half = 'l', { moon = false } = {}) {
  const seed = half === 'l' ? 1 : 2;
  const st = stepStone(seed);
  const nose = limestone('#eadcc0', { tag: 'floor' });
  const parts = [];
  const run = 1 / 5;
  for (let i = 0; i < 5; i++) {
    const y0 = -0.5 + i * run, ztop = 1 - STEP_RISE * i;
    // Each tread is dished a little in the middle (worn), and its nose is rounded.
    parts.push(custom((x, y, z) => {
      const dish = Math.max(0, 1 - Math.abs(x - (half === 'l' ? 0.35 : -0.35)) / 0.45) * 0.018;
      return Math.max(Math.abs(x) - 0.5, y0 - y, y - (y0 + run + 0.001), z - (ztop - dish), -z);
    }, [-0.5, y0, 0, 0.5, y0 + run + 0.001, ztop], st));
    parts.push(boxAt(-0.5, y0 + run - 0.035, ztop - 0.045, 0.5, y0 + run + 0.004, ztop - 0.005, nose, 0.014));
  }
  if (moon) {
    // The moon-eye: a blue glass stud in the third riser, a little toward the flight's middle.
    const i = 2, yR = -0.5 + (i + 1) * run, zm = 1 - STEP_RISE * i - STEP_RISE / 2 - 0.02;
    const x = half === 'l' ? 0.2 : -0.2;
    parts.push(place(cylinder(0.055, -0.01, 0.012, limestone('#c8b490', { tag: 'floor' }), 0.006), { at: [x, yR + 0.004, zm], rx: -PI / 2 }));
    parts.push(move(sphere(0.04, moonEyeGlass({ tag: 'floor' })), x, yR + 0.01, zm));
  }
  return union(parts);
}

// A 3×5 stencil font for the lid's words.
const GLYPHS = {
  M: ['101', '111', '111', '101', '101'], I: ['111', '010', '010', '010', '111'], N: ['101', '111', '111', '111', '101'],
  D: ['110', '101', '101', '101', '110'], T: ['111', '010', '010', '010', '010'], H: ['101', '101', '111', '101', '101'],
  E: ['111', '100', '110', '100', '111'], S: ['111', '100', '111', '001', '111'], P: ['110', '101', '110', '100', '100'],
  1: ['010', '110', '010', '010', '111'], 0: ['111', '101', '101', '101', '111'], '!': ['010', '010', '010', '000', '010'],
};
/** Is (u, v) inside a stroke of `word` set centered at u = 0, v = 0 (cell size c, v down the letter)? */
function inWord(word, u, v, c) {
  const n = word.length, lw = 4 * c, x0 = -(n * lw - c) / 2;
  const i = Math.floor((u - x0) / lw);
  if (i < 0 || i >= n) return false;
  const cx = Math.floor((u - x0 - i * lw) / c), cy = Math.floor((v + 2.5 * c) / c);
  if (cx < 0 || cx > 2 || cy < 0 || cy > 4) return false;
  return GLYPHS[word[i]][cy][cx] === '1';
}

/** The boards over the hundredth step's hole: this half's share of three planks running across the flight. */
function boardLid(half, chalk, R) {
  const words = ['MIND', 'THE', 'STEP'];
  const pw = (2 * R + 0.1) / 3;
  const lid = mat((x, y) => {
    const gx = x + (half === 'l' ? -0.5 : 0.5); // 0 at the seam between the halves
    const k =Math.max(0, Math.min(2, Math.floor((y + R + 0.05) / pw)));
    const v = y + R + 0.05 - (k + 0.5) * pw;
    const g = vnoise(gx * 4, y * 60 + k * 7, 5) * 0.14 + fbm(gx * 20, y * 30, k, 2) * 0.1;
    let c = tint(mix(hex('#8a6a48'), hex('#7a5c3e'), hash3(k, 0, 41)), 0.88 + g);
    if (Math.abs(v) > pw / 2 - 0.012) c = tint(c, 0.55);
    if (inWord(words[k], gx, v, 0.042)) c = mix(c, hex('#f0e8d0'), 0.85 - fbm(gx * 40, y * 40, 3, 2) * 0.35);
    if (chalk && k === 1 && inWord('100!', gx + 0.03, v + 0.01, 0.05) && vnoise(gx * 90, y * 90, 8) > 0.25) c = mix(c, hex('#fafaf4'), 0.8);
    return c;
  }, { tag: 'floor', spec: 0.08, shin: 12 });
  // Flush with the landing; the boards run past the seam, so the halves meet in one lid.
  const xa = half === 'l' ? -R - 0.045 : -0.5, xb = half === 'l' ? 0.5 : R + 0.045;
  const parts = [boxAt(xa, -R - 0.045, -0.2, xb, R + 0.045, -0.002, lid, 0.006)];
  // Nail heads at the plank ends.
  const nail = m('#4a4448', { tag: 'floor', spec: 0.6 });
  const xe = half === 'l' ? -R + 0.01 : R - 0.01;
  for (let k = 0; k < 3; k++) for (const dy of [-0.05, 0.05]) parts.push(move(sphere(0.012, nail), xe, -R - 0.045 + (k + 0.5) * pw + dy, -0.004));
  return union(parts);
}

/** Landing paving at the Steps (flat, at a flight's head): big worn slabs, 'l' and 'r' halves of a two-wide pattern. */
export function landingTile(half = 'l', { hollow = null, t = 0 } = {}) {
  // Slabs: the two-wide landing is laid in big stones 0.66 deep; the hollow
  // step is its own slab (most of the tile), its joint all round.
  const R = 0.38;
  const slabM = mat((x, y, z) => {
    const gx = x + (half === 'l' ? -0.5 : 0.5); // flight coordinates: 0 at the middle seam
    const row = Math.floor((y + 10) / 0.5), col = Math.floor((gx + 10 + (row % 2) * 0.33) / 0.66);
    const fy = ((y + 10) / 0.5) % 1, fx = ((gx + 10 + (row % 2) * 0.33) / 0.66) % 1;
    let c = mix(hex('#d0bc96'), hex('#e0cca6'), hash3(col, row, 12));
    const n = fbm(x * 8 + 3, y * 8, 1, 3);
    c = tint(c, 0.88 + n * 0.18);
    if (!hollow && (Math.min(fy, 1 - fy) * 0.5 < 0.012 || Math.min(fx, 1 - fx) * 0.66 < 0.012)) c = tint(c, 0.7);
    return c;
  }, { tag: 'floor', spec: 0.05, shin: 10 });
  const parts = [boxAt(-0.6, -0.6, -0.3, 0.6, 0.6, 0, slabM)];
  if (hollow) {
    // The hollow step: one big slab per half, a dark joint round it.
    const hs = mat((x, y, z) => {
      let c = tint(hex('#d6c29c'), 0.88 + fbm(x * 8 + 9, y * 8, 2, 3) * 0.18);
      const e = Math.min(R + 0.05 - Math.abs(x), R + 0.05 - Math.abs(y));
      if (hollow === 'wet') {
        // Water running across the landing and into the joint: darker damp stone along the joint, a glint moving.
        c = mix(c, hex('#8a8474'), clamp(1 - e / 0.12, 0, 1) * 0.6);
      }
      return c;
    }, { tag: 'floor', spec: 0.06, shin: 10 });
    const jointM = m('#2a2228', { tag: 'floor' });
    if (hollow === 'dry' || hollow === 'wet') {
      parts.length = 0;
      parts.push(subtract(boxAt(-0.6, -0.6, -0.3, 0.6, 0.6, 0, slabM), boxAt(-R - 0.06, -R - 0.06, -0.2, R + 0.06, R + 0.06, 0.1, null), jointM));
      parts.push(boxAt(-R - 0.06, -R - 0.06, -0.3, R + 0.06, R + 0.06, -0.04, jointM));
      parts.push(boxAt(-R - 0.045, -R - 0.045, -0.2, R + 0.045, R + 0.045, -0.002, hs, 0.01));
      if (hollow === 'wet') {
        // The water in the joint: a thin bright line and glints that move between frames.
        const wt = mat((x, y, z) => {
          const g = vnoise(x * 30 + t * 9, y * 30 - t * 7, t * 3);
          return mix(hex('#5a8090'), hex('#e0f4f8'), g > 0.6 ? 1 : 0.2);
        }, { tag: 'floor', spec: 1.4, shin: 80, emit: 0.2 });
        parts.push(subtract(boxAt(-R - 0.06, -R - 0.06, -0.03, R + 0.06, R + 0.06, -0.012, wt), boxAt(-R - 0.045, -R - 0.045, -0.1, R + 0.045, R + 0.045, 0.1, null)));
        // A wet film running in from the west (the trickle from the doorstep).
        const film = mat((x, y, z) => mix(hex('#9a907c'), hex('#d8ecf0'), vnoise(x * 24 - t * 8, y * 24, t * 4) > 0.65 ? 0.8 : 0.0), { tag: 'floor', spec: 1.2, shin: 60 });
        parts.push(custom((x, y, z) => Math.max(Math.abs(z + 0.001) - 0.003, Math.abs(y - (0.42 + Math.sin(x * 9) * 0.02)) - 0.05 - (x < -0.2 ? 0.0 : 0), x - (half === 'r' ? 0.38 : 0.6), -0.6 - x), [-0.6, 0.3, -0.01, 0.6, 0.55, 0.005], film));
      }
    } else if (hollow === 'boarded' || hollow === 'chalked') {
      // Acts 4–6: the hole boarded over flush, three planks across both halves, MIND / THE / STEP stenciled
      // one word to a plank (docs/art-act4.md); in the epilogue someone has chalked 100! over THE.
      parts.length = 0;
      // One hole across both halves: open to the seam side.
      const [ha, hb] = half === 'l' ? [-R - 0.06, 0.6] : [-0.6, R + 0.06];
      parts.push(subtract(boxAt(-0.6, -0.6, -0.3, 0.6, 0.6, 0, slabM), boxAt(ha, -R - 0.06, -0.2, hb, R + 0.06, 0.1, null), jointM));
      parts.push(boxAt(ha, -R - 0.06, -0.3, hb, R + 0.06, -0.04, jointM));
      parts.push(boardLid(half, hollow === 'chalked', R));
    } else {
      // Open: the slab gone, the shaft dark below, a ladder's top rungs.
      parts.length = 0;
      const dark = m('#120e16', { tag: 'floor' });
      const rim = mat((x, y, z) => tint(hex('#b8a888'), 0.8 + fbm(x * 9, y * 9, z * 9, 2) * 0.2), { tag: 'floor', spec: 0.04 });
      parts.push(subtract(boxAt(-0.6, -0.6, -1.4, 0.6, 0.6, 0, slabM), boxAt(-R - 0.06, -R - 0.06, -2, R + 0.06, R + 0.06, 0.1, null), rim));
      parts.push(boxAt(-R - 0.06, -R - 0.06, -1.45, R + 0.06, R + 0.06, -1.3, dark));
      // The ladder: bronze rails gone green and iron rungs, fixed to the shaft's north wall.
      const lad = bronze('#7a6040', { tag: 'floor' });
      for (const x of [-0.2, 0.2]) parts.push(boxAt(x - 0.02, -R - 0.02, -1.3, x + 0.02, -R + 0.03, 0.06, lad, 0.008));
      for (let i = 0; i < 6; i++) parts.push(capsule([-0.2, -R + 0.02, -0.12 - i * 0.22], [0.2, -R + 0.02, -0.12 - i * 0.22], 0.012, lad));
      // A breath of cool air: the shaft's walls are Founders' slate below the paving.
      parts.push(subtract(boxAt(-R - 0.06, -R - 0.06, -1.3, R + 0.06, R + 0.06, -0.3, hullstone({ course: 0.3, block: 0.4 })), boxAt(-R - 0.02, -R - 0.02, -1.4, R + 0.02, R + 0.02, -0.2, null), hullstone({ course: 0.3, block: 0.4 })));
    }
  }
  return union(parts);
}

// ---------------------------------------------------------------------------
// The Founders' Door (2×1, in the crypt's north wall: its inner face at
// y = +0.5): dark slate, cut dead straight, no mortar, the corners cut off at
// 45°, no handle; relic cyan only at its seams. 'bolted' or 'open' (Act 3 on:
// the leaves slid into the wall, steps going down into the dark toward the
// Chart Room).

export function foundersDoor({ open = false } = {}) {
  const Y = 0.5, H = 2.4;
  // The crypt wall: older limestone, dimmer, big blocks.
  const old = ashlar({ course: 0.48, block: 0.7, tones: ['#a89a84', '#b8a890'], seed: 41 });
  let wall = boxAt(-1, 0.2, 0, 1, 0.5, H, old);
  // The slate surround: fitted blocks, chamfered at 45°, standing a hand proud of the wall.
  const slate = hullstone({ course: 0.42, block: 0.62, seed: 9 });
  const outer = [[-0.8, 0], [0.8, 0], [0.8, 1.84], [0.52, 2.12], [-0.52, 2.12], [-0.8, 1.84]];
  const inner = [[-0.56, -0.1], [0.56, -0.1], [0.56, 1.66], [0.36, 1.86], [-0.36, 1.86], [-0.56, 1.66]];
  wall = subtract(wall, move(extrudeXZ(outer, 0.2, null), 0, Y, 0), slate);
  if (open) wall = subtract(wall, move(extrudeXZ(inner, 1, null), 0, Y, 0), slate);
  const out = [wall];
  out.push(subtract(move(extrudeXZ(outer, 0.06, slate), 0, Y, 0), move(extrudeXZ(inner, 1, null), 0, Y, 0), hullstone({ course: 0.42, block: 0.62, seed: 9, base: '#58686e' })));
  // The threshold: one long slate plate.
  out.push(boxAt(-0.72, Y - 0.25, 0, 0.72, Y + 0.16, 0.05, slate, 0.01));
  const cy = relicCyan({ emit: 0.8 });
  // The chamfer seams of the surround catch the glow, faintly.
  for (const s of [-1, 1]) out.push(capsule([s * 0.57, Y + 0.065, 1.66], [s * 0.37, Y + 0.065, 1.87], 0.008, cy));
  if (!open) {
    // Two leaves meeting dead center, set back; a hairline of cyan where they meet. No handle.
    const leafM = hullstone({ course: 0.66, block: 0.62, seed: 12, base: '#5e6e76', joint: 0.004 });
    out.push(move(extrudeXZ(inner, 0.04, leafM), 0, Y - 0.12, 0));
    out.push(boxAt(-0.011, Y - 0.085, 0.04, 0.011, Y - 0.07, 1.84, cy));
    // A ring of inlay at the meeting: a round glyph, rubbed to a shine by Ottilie.
    out.push(place(torus(0.1, 0.014, bronze('#6a7a68', { tag: 'wall' })), { at: [0, Y - 0.075, 1.2], rx: PI / 2 }));
  } else {
    // Open: the leaves slid into the jambs; behind, a slate passage and steps going down
    // into the dark, a cyan glow far off. Everything behind is clipped to what the
    // opening shows, so nothing hangs below the floor line in the sprite.
    const V = [1, 1, 0.8];
    const view = custom((x, y, z) => {
      const s = (Y - y) / V[1];
      return Math.max(sdPoly(inner, x + s * V[0], z + s * V[2]) * 0.55, y - Y + 0.02);
    }, [-3, -3, -3, 3, Y, 3], null);
    const dark = m('#0c1016', { tag: 'wall' });
    const deep = hullstone({ course: 0.3, block: 0.5, seed: 13, base: '#38444c' });
    const back = [];
    back.push(boxAt(-0.56, Y - 1.6, -1.6, 0.56, Y - 1.5, 1.86, dark));
    back.push(boxAt(-0.7, Y - 1.6, -1.6, -0.56, Y - 0.04, 1.86, deep));
    back.push(boxAt(0.56, Y - 1.6, -1.6, 0.7, Y - 0.04, 1.86, deep));
    back.push(boxAt(-0.7, Y - 1.6, 1.86, 0.7, Y - 0.04, 2.0, deep));
    for (let i = 0; i < 7; i++) back.push(boxAt(-0.56, Y - 0.24 - i * 0.2, -1.6, 0.56, Y - 0.04 - i * 0.2, -0.0 - i * 0.18, deep, 0.005));
    back.push(boxAt(-0.12, Y - 1.49, -0.2, 0.12, Y - 1.47, -0.14, cy));
    out.push(intersect(union(back), view));
    // The leaves' edges show in the jambs.
    out.push(boxAt(-0.56, Y - 0.14, 0, -0.5, Y - 0.06, 1.66, slate));
    out.push(boxAt(0.5, Y - 0.14, 0, 0.56, Y - 0.06, 1.66, slate));
  }
  return union(out);
}

export { PI, FISH_TURN, FOUNT, TOWER };
