// Room sets: the walls and floors of interiors, one set per kind of room, all
// cut away as the era drew rooms (docs/iso-art-direction.md, "Interiors"). The
// north and west walls show their inner faces at full height; the south and
// east walls are low stubs with a darker cut top. Same geometry as Cheryl's
// flat (models/flat.mjs), so its wall caps (flat:wall_cap_*) fit every set.
//
// Every builder has its origin at its tile's center on the floor.

import { boxAt, union, subtract, move, cylinder, place } from '../lib/sdf.mjs';
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
    floor: (s) => mat((x, y) => cellarFlags(x, y, s), { tag: 'floor', spec: 0.1, shin: 10 }),
  },
  // The lighthouse's lamp room: whitewash over a slate dado, slate plates underfoot, tall sea-light windows.
  lamp: {
    wall: (axis) => plaster('#f4f0e8', { axis }),
    band: { z0: 0.09, z1: 0.9, mat: () => mat((x, y, z) => tint(hex(PAL.slate), 0.92 + vnoise(x * 9 + y * 9, z * 9, 4) * 0.14), { tag: 'wall', spec: 0.3, shin: 24 }) },
    rail: () => mat('#e8e4dc', { tag: 'wall', spec: 0.3 }),
    skirt: () => mat(PAL.slateDeep, { tag: 'wall', spec: 0.3 }),
    glass: ['#e8f6fa', '#b8dcec'],
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
    // A doorway through the wall into the dark beyond, with a stone threshold.
    const w = 0.72, z1 = 2.0;
    const cut = union(boxAt(-w / 2, -0.2, 0, w / 2, 0.1, z1 - w / 2, null), place(cylinder(w / 2, -0.2, 0.1, null), { at: [0, 0, z1 - w / 2], rx: PI / 2 }));
    wall = subtract(wall, onFace(cut, face), S.wall(axis));
    parts.push(onFace(boxAt(-w / 2, -0.22, 0, w / 2, -0.19, z1, mat('#1c1418', { tag: 'wall', spec: 0 })), face));
    parts.push(onFace(boxAt(-w / 2, -0.3, 0, w / 2, 0.04, 0.03, limestone('#d0c0a0', { tag: 'floor' }), 0.01), face));
  }
  return union(wall, ...parts);
}

/** Where the north and west walls meet: a post of wall. */
export function roomCorner(set) {
  return boxAt(0.2, 0.2, 0, 0.5, 0.5, ROOM_H, SETS[set].wall('x'));
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
    parts.push(boxAt(-0.18, -0.18, 0, 0.18, 0.18, STUB, wm), boxAt(-0.18, -0.18, STUB - 0.01, 0.18, 0.18, STUB + 0.005, top));
  } else if (door) {
    parts.push(run(-0.5, -0.36), run(0.36, 0.5), cap(-0.5, -0.36), cap(0.36, 0.5));
    const th = limestone('#d8c8a8', { tag: 'floor' });
    parts.push(dir === 'x' ? boxAt(-0.36, -0.2, 0, 0.36, 0.2, 0.04, th, 0.01) : boxAt(-0.2, -0.36, 0, 0.2, 0.36, 0.04, th, 0.01));
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
