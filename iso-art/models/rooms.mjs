// Room sets: the walls and floors of interiors, one set per kind of room, all
// cut away as the era drew rooms (docs/iso-art-direction.md, "Interiors"). The
// north and west walls show their inner faces at full height; the south and
// east walls are low stubs with a darker cut top. Same geometry as Cheryl's
// flat (models/flat.mjs), so its wall caps (flat:wall_cap_*) fit every set.
//
// Every builder has its origin at its tile's center on the floor.

import { boxAt, union, subtract, intersect, move, cylinder, place, solid } from '../lib/sdf.mjs';
import { mat, hex, mix } from '../lib/render.mjs';
import { plaster, limestone, wood } from './materials.mjs';
import { fbm, vnoise } from './materials.mjs';
import { hash3 } from '../lib/noise.mjs';
import { onFace, stairFlight } from './arch.mjs';
import { heightfield, sstep } from './ground.mjs';
import { PAL, ashlar, tint } from './act2-materials.mjs';
import { ROOM_H } from './flat.mjs';

const PI = Math.PI;
const STUB = 0.4;

// ---------------------------------------------------------------------------
// Floors (color functions over a tile's local x, y in −0.5…0.5; each repeats per tile, so they tile).

/** Oak boards running east–west, four to a tile, butt joints staggered. */
function planks(x, y, seed) {
  const Y = (y + 0.5) * 4, row = Math.floor(Y), fy = Y - row;
  const X = (x + 0.5) + hash3(row, seed, 3) * 0.8, seg = Math.floor(X * 1.25), fx = X * 1.25 - seg;
  const id = hash3(row, seg + seed * 7, 4);
  const grain = vnoise(x * 3, y * 60 + row * 5, seed) * 0.12 + fbm(x * 14, y * 40, seed, 2) * 0.08;
  const c = mix(hex('#a87448'), hex('#946038'), id);
  const joint = Math.min(fy, 1 - fy) < 0.05 || Math.min(fx, 1 - fx) < 0.015;
  return tint(c, (joint ? 0.62 : 1) * (0.92 + grain));
}

/** The Archive's floor: pale limestone on the diagonal with small cobalt keys (as under the Eye). */
function archiveStone(x, y) {
  const u = x + y, v = x - y;
  const fu = ((u % 1) + 1) % 1, fv = ((v % 1) + 1) % 1;
  const key = Math.abs(fu - 0.5) + Math.abs(fv - 0.5) > 0.86;
  const joint = Math.min(fu, 1 - fu) < 0.02 || Math.min(fv, 1 - fv) < 0.02;
  const id = hash3(Math.floor(u), Math.floor(v), 5);
  const n = fbm(x * 9, y * 9, 2, 2);
  if (key) return tint(hex('#3a64a8'), 0.9 + n * 0.15);
  return tint(mix(hex('#e4d8c0'), hex('#d4c6aa'), id), (joint ? 0.82 : 1) * (0.94 + n * 0.08));
}

/** Square slate plates, two to a tile edge, with fine pale joints. */
function slatePlates(x, y, seed) {
  const X = (x + 0.5) * 2, Y = (y + 0.5) * 2, i = Math.floor(X), j = Math.floor(Y);
  const fx = X - i, fy = Y - j;
  const id = hash3(i, j, 17 + seed);
  const n = fbm(x * 10, y * 10, seed + 4, 3);
  const c = mix(hex(PAL.slate), hex('#5a6a72'), id);
  const joint = Math.min(fx, 1 - fx, fy, 1 - fy) < 0.025;
  return joint ? hex('#98a4a8') : tint(c, 0.9 + n * 0.16);
}

/** Old cellar flags: big, uneven, worn dark, in two sizes. */
function cellarFlags(x, y, seed) {
  const Y = (y + 0.5) * 2, row = Math.floor(Y), fy = Y - row;
  const X = (x + 0.5) * 1.5 + (row % 2) * 0.5, i = Math.floor(X), fx = X - i;
  const id = hash3(i, row, 23 + seed);
  const n = fbm(x * 8, y * 8, seed + 9, 3);
  const c = mix(hex('#7a6c5c'), hex('#8c7c68'), id);
  const joint = Math.min(fy, 1 - fy) < 0.03 || Math.min(fx, 1 - fx) < 0.03;
  return tint(c, (joint ? 0.6 : 1) * (0.86 + n * 0.22));
}

/**
 * A worn stone threshold: grey-buff slabs, two to a tile along the wall (dir 'x' runs
 * east–west, 'y' north–south), darker and smoother where feet have crossed (the
 * middle of the wall's thickness), with fine joints.
 */
function wornStone(dir = 'x') {
  return mat((x, y) => {
    const along = dir === 'y' ? y : x, across = dir === 'y' ? x : y;
    const A = (along + 10.5) * 2, i = Math.floor(A), f = A - i;
    const id = hash3(i, 3, 41);
    const n = fbm(x * 11, y * 11, 6, 3);
    const wear = Math.exp(-((Math.abs(across) % 1) ** 2) / 0.012);
    const c = mix(mix(hex('#a8987c'), hex('#9a8a70'), id), hex('#8a7c68'), wear * 0.45);
    const joint = Math.min(f, 1 - f) < 0.03;
    return tint(c, (joint ? 0.66 : 1) * (0.9 + n * 0.16 - wear * 0.04));
  }, { tag: 'floor', spec: 0.16, shin: 16 });
}

// ---------------------------------------------------------------------------
// The sets. wall(face) is the main wall material; band is an optional dado
// { z0, z1, mat }; rail and skirt are thin moldings; glass is the window's light.

const panel = (axis) => {
  // Honey-colored tongue-and-groove boards standing upright.
  const c = hex('#b0804c');
  return mat((x, y, z) => {
    const u = axis === 'x' ? x : y;
    const b = ((u + 10) * 8) % 1;
    const n = vnoise(u * 8, z * 2, 3) * 0.1 + fbm(u * 30, z * 6, 5, 2) * 0.08;
    return tint(c, (b < 0.08 ? 0.66 : 1) * (0.92 + n));
  }, { tag: 'wall', spec: 0.25, shin: 18 });
};

export const SETS = {
  // The Shop: honey boards to the rail, warm cream plaster above, oak floor.
  shop: {
    wall: (axis) => plaster('#ecdcb4', { axis }),
    band: { z0: 0.09, z1: 1.05, mat: panel },
    rail: () => wood('#6a4228', { grain: 'x' }),
    skirt: () => wood('#5a3a24', { grain: 'x' }),
    glass: ['#fff4d8', '#ffe8c0'],
    floor: (s) => mat((x, y) => planks(x, y, s), { tag: 'floor', spec: 0.22, shin: 18 }),
  },
  // The Archive: limestone ashlar with a band of cobalt glazed tile, its floor as under the Eye.
  archive: {
    wall: () => ashlar({ course: 0.4, block: 0.6, tones: ['#d8c8a8', '#e8dcc0'], seed: 31 }),
    band: { z0: 0.7, z1: 0.92, mat: () => mat((x, y, z, lx, ly, lz, nx, ny) => {
      const u = Math.abs(ny) > Math.abs(nx) ? x : y;
      const f = ((u + 10) * 5) % 1, g = ((z + 10) * 9) % 1;
      const j = Math.min(f, 1 - f) < 0.04 || Math.min(g, 1 - g) < 0.06;
      return j ? hex('#d8d0c0') : tint(hex(PAL.cobalt), 0.9 + vnoise(u * 10, z * 10, 2) * 0.2);
    }, { tag: 'wall', spec: 0.9, shin: 50 }) },
    rail: () => limestone('#e8dcc0', { tag: 'wall' }),
    skirt: () => limestone('#c8b898', { tag: 'wall' }),
    glass: ['#f4f0e0', '#e0ecf4'],
    floor: () => mat((x, y) => archiveStone(x, y), { tag: 'floor', spec: 0.08, shin: 14 }),
  },
  // The crypt: rough, darker coursed stone and worn cellar flags; no moldings.
  crypt: {
    wall: () => ashlar({ course: 0.34, block: 0.55, tones: ['#8c7c66', '#a08e74'], seed: 37, joint: 0.05 }),
    glass: ['#c8d0d8', '#b0bcc8'],
    frame: () => limestone('#7c6c58', { tag: 'wall' }),
    floor: (s) => mat((x, y) => cellarFlags(x, y, s), { tag: 'floor', spec: 0.1, shin: 10 }),
  },
  // The lighthouse's lamp room: whitewash over a slate dado, slate plates underfoot, tall sea-light windows.
  lamp: {
    wall: (axis) => plaster('#f4f0e8', { axis }),
    band: { z0: 0.09, z1: 0.9, mat: () => mat((x, y, z) => tint(hex(PAL.slate), 0.92 + vnoise(x * 9 + y * 9, z * 9, 4) * 0.14), { tag: 'wall', spec: 0.3, shin: 24 }) },
    rail: () => mat('#e8e4dc', { tag: 'wall', spec: 0.3 }),
    skirt: () => mat(PAL.slateDeep, { tag: 'wall', spec: 0.3 }),
    glass: ['#e8f6fa', '#b8dcec'],
    frame: () => mat(PAL.slateShade, { tag: 'wall', spec: 0.3, shin: 24 }),
    tallWindow: true,
    floor: (s) => mat((x, y) => slatePlates(x, y, s), { tag: 'floor', spec: 0.3, shin: 26 }),
  },
};

export const SET_NAMES = Object.keys(SETS);

/** A floor tile of a set (seed picks the variant). */
export function roomFloor(set, seed = 0) {
  return heightfield(() => -0.01, SETS[set].floor(seed));
}

/** A back wall's inner face ('s' for the north wall, 'e' for the west), with kind 'plain', 'window', or 'door'. */
export function roomWall(set, face, kind = 'plain') {
  const S = SETS[set];
  const axis = face === 's' ? 'x' : 'y';
  let wall = face === 's' ? boxAt(-0.5, 0.2, 0, 0.5, 0.5, ROOM_H, S.wall(axis)) : boxAt(0.2, -0.5, 0, 0.5, 0.5, ROOM_H, S.wall(axis));
  const parts = [];
  // Moldings on the room side, broken by a door.
  const span = kind === 'door' ? [[-0.5, -0.36], [0.36, 0.5]] : [[-0.5, 0.5]];
  for (const [a, b] of span) {
    if (S.band) parts.push(onFace(boxAt(a, -0.03, S.band.z0, b, 0.012, S.band.z1, S.band.mat(axis)), face));
    if (S.rail) parts.push(onFace(boxAt(a, -0.035, S.band ? S.band.z1 : 0.9, b, 0.03, (S.band ? S.band.z1 : 0.9) + 0.05, S.rail(), 0.01), face));
    if (S.skirt) parts.push(onFace(boxAt(a, -0.03, 0, b, 0.03, 0.09, S.skirt(), 0.01), face));
  }
  if (kind === 'window') {
    const [z0, z1, w] = S.tallWindow ? [0.98, 2.28, 0.8] : [1.0, 2.15, 0.62];
    const cut = union(boxAt(-w / 2, -0.2, z0, w / 2, 0.1, z1 - w / 2, null), place(cylinder(w / 2, -0.2, 0.1, null), { at: [0, 0, z1 - w / 2], rx: PI / 2 }));
    wall = subtract(wall, onFace(cut, face), S.wall(axis));
    // The light outside, brighter than the room; a glazing bar and transom.
    const sky = mat((x, y, z) => mix(hex(S.glass[0]), hex(S.glass[1]), Math.max(0, Math.min(1, (z - z0) / (z1 - z0)))), { tag: 'glass', emit: 1 });
    parts.push(onFace(boxAt(-w / 2, -0.2, z0, w / 2, -0.16, z1, sky), face));
    const bar = mat('#e8e4d8', { tag: 'wall' });
    parts.push(onFace(boxAt(-0.015, -0.17, z0, 0.015, -0.14, z1 - 0.04, bar), face));
    parts.push(onFace(boxAt(-w / 2, -0.17, (z0 + z1) / 2 - 0.02, w / 2, -0.14, (z0 + z1) / 2 + 0.01, bar), face));
    parts.push(onFace(boxAt(-w / 2 - 0.05, -0.17, z0 - 0.06, w / 2 + 0.05, 0.06, z0, limestone('#e0d0b4', { tag: 'wall' }), 0.01), face));
  }
  if (kind === 'door') {
    // A doorway through the wall into the dark beyond: an arched opening with a
    // dressed frame (architrave) proud of the face, and a worn threshold.
    const w = 0.72, z1 = 2.0, fw = 0.075;
    const opening = (grow, y0, y1) => union(
      boxAt(-w / 2 - grow, y0, 0, w / 2 + grow, y1, z1 - w / 2, null),
      place(cylinder(w / 2 + grow, -(y1 - y0) / 2, (y1 - y0) / 2, null), { at: [0, (y0 + y1) / 2, z1 - w / 2], rx: PI / 2 }));
    wall = subtract(wall, onFace(opening(0, -0.4, 0.2), face), S.wall(axis));
    // The dark: a near-black void a little way in, so the reveal's sides catch light.
    parts.push(onFace(boxAt(-w / 2, -0.3, 0, w / 2, -0.24, z1 + 0.02, mat('#140e12', { tag: 'wall', spec: 0 })), face));
    // The frame: the opening grown by fw, as a thin slab on the face, minus the opening.
    const frameMat = S.frame ? S.frame() : S.rail();
    parts.push(onFace(subtract(solid(opening(fw, -0.02, 0.028), frameMat), opening(0, -0.1, 0.1), frameMat), face));
    // Plinth blocks at the frame's feet.
    for (const s of [-1, 1]) parts.push(onFace(boxAt(s > 0 ? w / 2 - 0.005 : -w / 2 - fw - 0.012, -0.02, 0, s > 0 ? w / 2 + fw + 0.012 : -w / 2 + 0.005, 0.036, 0.1, frameMat, 0.008), face));
    parts.push(onFace(boxAt(-w / 2, -0.3, 0, w / 2, 0.05, 0.025, wornStone(axis), 0.008), face));
  }
  return union(wall, ...parts);
}

/** Where the north and west walls meet: a post of wall. */
export function roomCorner(set) {
  return boxAt(0.2, 0.2, 0, 0.5, 0.5, ROOM_H, SETS[set].wall('x'));
}

// ---------------------------------------------------------------------------
// The lantern: back walls glazed all the way along, for the lamp room. Tall panes
// over a low wall, a slim iron mullion at each tile's center (so the panes run
// across tile edges and the corner chamfer meets a mullion), an iron head under
// the cut top, and two thin glazing bars. In the face's own frame (onFace): x
// along the wall, the room at +y, the wall's body from −0.3 to 0.

const SILL = 0.92, HEAD = ROOM_H - 0.16;
const iron = () => mat('#2a3036', { tag: 'wall', spec: 0.45, shin: 30 });

/** The sea and sky through the glass, by height only, so panes join across pieces. */
function lanternGlass(set) {
  const S = SETS[set];
  const hz = 1.32;
  return mat((x, y, z) => {
    if (z < hz) return mix(hex('#6c9cb4'), hex('#94c0d0'), Math.max(0, Math.min(1, (z - SILL) / (hz - SILL))));
    return mix(hex(S.glass[0]), hex(S.glass[1]), Math.max(0, Math.min(1, (z - hz) / (HEAD - hz))));
  }, { tag: 'glass', emit: 1 });
}

/** One glazed stretch of wall in face coordinates, x from a to b (a mullion at x = 0 when 0 is inside). */
function glazedRun(set, axis, a, b, { mullions = [0], over = 0 } = {}) {
  const S = SETS[set];
  const ir = iron();
  const parts = [boxAt(a, -0.3, 0, b, 0, SILL - 0.05, S.wall(axis))];
  if (S.band) parts.push(boxAt(a, -0.03, S.band.z0, b, 0.012, Math.min(S.band.z1, SILL - 0.04), S.band.mat(axis)));
  if (S.skirt) parts.push(boxAt(a, -0.03, 0, b, 0.03, 0.09, S.skirt(), 0.01));
  // The sill, glass and bars are tagged so the sheet's face split keeps them whole: they lie
  // deeper than the face, so they reach past the column's center line on screen. They run
  // `over` past the ends: a sill's end is diagonal on screen, and two pieces meeting exactly
  // there would each drop the half-covered pixels and leave a notch.
  const A = a - over, B = b + over;
  parts.push(boxAt(A, -0.32, SILL - 0.05, B, 0.055, SILL, mat(PAL.slateLight, { tag: 'glazing', spec: 0.35, shin: 26 })));
  parts.push(boxAt(A, -0.17, SILL, B, -0.14, HEAD, lanternGlass(set)));
  parts.push(boxAt(a, -0.3, HEAD, b, 0.02, ROOM_H, ir));
  const bar = mat('#2a3036', { tag: 'glazing', spec: 0.45, shin: 30 });
  for (const t of [1 / 3, 2 / 3]) { const z = SILL + (HEAD - SILL) * t; parts.push(boxAt(A, -0.18, z - 0.009, B, -0.125, z + 0.009, bar)); }
  for (const m of mullions) if (m >= a && m <= b) parts.push(boxAt(m - 0.024, -0.2, SILL, m + 0.024, 0.03, HEAD, ir, 0.006));
  return parts;
}

/** A back wall glazed full height above a low wall ('s' north wall, 'e' west wall); same frame as roomWall. */
export function roomGlazed(set, face) {
  const axis = face === 's' ? 'x' : 'y';
  return union(glazedRun(set, axis, -0.5, 0.5, { over: 0.03 }).map((p) => onFace(p, face)));
}

/**
 * The lantern's back corner cut off on the diagonal: a glazed facet from the middle of
 * the north wall's first tile to the middle of the west wall's first, so the room reads
 * round. Anchored on the room's first floor tile (x0, y0), whose north-west corner is the
 * room's corner; it covers the north-west half of that tile's back edge (Cheryl can still
 * stand on the tile's center) and draws after the two walls behind it. Carries its own cut top.
 */
export function roomChamfer(set) {
  const L = Math.SQRT1_2 / 2 + 0.004; // half the facet's length (0.354)
  const facet = (n) => place(n, { at: [-0.25, -0.25, 0], rz: -PI / 4 });
  const parts = glazedRun(set, 'x', -L, L, { mullions: [-L + 0.024, L - 0.024] }).map(facet);
  // Fill behind the facet down to the corner, clipped to the walls' inner faces.
  const capM = mat('#6a5650', { tag: 'floor' });
  parts.push(facet(boxAt(-L, -0.6, 0, L, -0.3, SILL, SETS[set].wall('x'))));
  parts.push(facet(boxAt(-L, -0.6, HEAD, L, -0.3, ROOM_H, iron())));
  parts.push(facet(boxAt(-L, -0.6, ROOM_H - 0.01, L, 0.02, ROOM_H + 0.01, capM)));
  // Nothing past the walls' inner faces (the walls behind are drawn first).
  return intersect(union(parts), boxAt(-0.5, -0.5, -0.02, 0.1, 0.1, ROOM_H + 0.03, SETS[set].wall('x')));
}

/** A near wall cut to a stub ('x' runs east–west on the south side, 'y' north–south on the east, 'corner'), door: a threshold. */
export function roomCut(set, dir = 'x', { door = false } = {}) {
  const S = SETS[set];
  const wm = S.wall(dir === 'y' ? 'y' : 'x');
  const top = mat('#6a5650', { tag: 'wall' });
  const parts = [];
  const run = (a, b) => (dir === 'x' ? boxAt(a, -0.18, 0, b, 0.18, STUB, wm) : boxAt(-0.18, a, 0, 0.18, b, STUB, wm));
  const cap = (a, b) => (dir === 'x' ? boxAt(a, -0.18, STUB - 0.01, b, 0.18, STUB + 0.005, top) : boxAt(-0.18, a, STUB - 0.01, 0.18, b, STUB + 0.005, top));
  if (dir === 'corner') {
    // An L reaching back along both walls to the neighboring stubs.
    parts.push(boxAt(-0.5, -0.18, 0, 0.18, 0.18, STUB, wm), boxAt(-0.18, -0.5, 0, 0.18, 0.18, STUB, wm));
    parts.push(boxAt(-0.5, -0.18, STUB - 0.01, 0.18, 0.18, STUB + 0.005, top), boxAt(-0.18, -0.5, STUB - 0.01, 0.18, 0.18, STUB + 0.005, top));
  } else if (door) {
    // A doorway: only the worn threshold, across the wall's thickness and the tile's
    // whole width. The jambs are the neighboring stubs, whose ends (the wall's finish
    // under the dark cut top) stand at this tile's edges; a two-tile door is two of
    // these side by side, so nothing stands in the middle of the opening.
    const th = wornStone(dir);
    parts.push(dir === 'x' ? boxAt(-0.5, -0.19, -0.01, 0.5, 0.19, 0.022, th, 0.006) : boxAt(-0.19, -0.5, -0.01, 0.19, 0.5, 0.022, th, 0.006));
  } else parts.push(run(-0.5, 0.5), cap(-0.5, 0.5));
  // The room's own wall finish on the stub's inner face, so the band carries round.
  if (S.band && !door && dir !== 'corner') {
    const z1 = Math.min(S.band.z1, STUB - 0.02);
    parts.push(dir === 'x' ? boxAt(-0.5, -0.2, S.band.z0, 0.5, -0.17, z1, S.band.mat('x')) : boxAt(-0.2, -0.5, S.band.z0, -0.17, 0.5, z1, S.band.mat('y')));
  }
  return union(parts);
}

/** The crypt's stair: one tile of old cellar steps in the town kit's stair geometry (descending toward +y before `place`). */
export function cryptStairs() {
  return move(stairFlight(1, { below: 0, stone: '#8a7a66', noseColor: '#a49280' }), 0, 0, 1);
}

void sstep;
