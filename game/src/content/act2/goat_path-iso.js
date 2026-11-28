// The Goat Path in the isometric view (map: goat_path.js, 16 × 42): the cliff
// path down the back of the island, from Lamp Street's west gate (top right)
// to the Bilge's west quay (bottom right), in the art task's rock and path
// pieces (act2_harbor). Its own map is a painted picture, so this scene works
// from the map's PATH and STEPS rectangles: the legs are level, each row of
// rough steps drops 40 px, and the rock between the switchbacks stands at the
// height of the path above it, with cliff faces down to the path below.
//
// Heights (px): the top leg at 800; down to the Bilge's quay (rows 39-41) at
// 0; the sea at -40 along the west edge.

import { isoScene } from '../iso-kit.js';
import { GOAT_PATH } from './goat_path.js';

const H2 = 'act2_harbor';
const { PATH, STEPS, W, H } = GOAT_PATH;
const inRect = ([x0, y0, x1, y1], x, y) => x >= x0 && x <= x1 && y >= y0 && y <= y1;
const isPath = (x, y) => PATH.some((r) => inRect(r, x, y));
const stepRect = (x, y) => STEPS.find((r) => inRect(r, x, y));
const SEA = -40;

const hash = (x, y, s = 0) => {
  let h = (x * 374761393 + y * 668265263 + s * 2147483647) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
};

// The path's height at each walkable tile: walk the path's rectangles top to
// bottom; legs are level, steps drop 40 px a row (the high edge of the tile).
function pathHeights() {
  const z = new Map();
  let level = 800;
  for (const r of PATH) {
    const s = STEPS.find((q) => q[0] === r[0] && q[1] === r[1] && q[2] === r[2] && q[3] === r[3]);
    for (let y = r[1]; y <= r[3]; y++) for (let x = r[0]; x <= r[2]; x++) {
      if (z.has(`${x},${y}`)) continue;
      z.set(`${x},${y}`, s ? level - (y - r[1]) * 40 : level);
    }
    if (s) level -= (r[3] - r[1] + 1) * 40;
  }
  // The last stretch is the Bilge's quay.
  for (let y = 39; y <= 41; y++) for (let x = 2; x <= 15; x++) z.set(`${x},${y}`, 0);
  return z;
}
const PZ = pathHeights();

// Every tile's height: the path's own; the sea; the shack's yard; otherwise the
// rock at the height of the nearest path (ties go to the higher), so the
// hillside follows the path and the cliffs stand between neighboring legs.
const PATH_TILES = [...PZ].map(([k, z]) => { const [x, y] = k.split(',').map(Number); return [x, y, z - (stepRect(x, y) ? 40 : 0)]; });
// Past the map's east edge the hill goes on up, 40 px a tile (EAST tiles of it drawn, so
// the screen there isn't black); at the bottom, the Bilge's quay goes on at 0.
const EAST = 4;
const QUAY = (x, y) => y >= 39 && x >= 9;
function heightAt(x, y) {
  if (x >= W) return y >= 39 ? 0 : heightAt(W - 1, y) + 40 * (x - W + 1);
  if (PZ.has(`${x},${y}`)) {
    const s = stepRect(x, y);
    return s ? PZ.get(`${x},${y}`) - 40 : PZ.get(`${x},${y}`); // a step tile's low edge
  }
  if (x <= 1 && !((x === 1) && (y === 21 || y === 22))) return SEA;
  if (x === 1) return 360; // the viewpoint ledge
  if (x >= 2 && x <= 8 && y >= 12 && y <= 15) return 520; // Mott's shack and jugs, on the yard's level
  let best = null;
  for (const [px, py, pz] of PATH_TILES) {
    const d = Math.abs(px - x) + Math.abs(py - y);
    if (!best || d < best[0] || (d === best[0] && pz > best[1])) best = [d, pz];
  }
  return best[1];
}

function build() {
  const S = isoScene();
  for (let y = 0; y < H; y++) for (let x = 0; x < W + EAST; x++) {
    const z = heightAt(x, y);
    const below = y + 1 < H ? heightAt(x, y + 1) : SEA;
    const east = x + 1 < W + EAST ? heightAt(x + 1, y) : z; // the last drawn column: no face
    // Rock courses, each a crag variant picked by position so the face doesn't repeat tile by tile.
    const courses = (to, f) => Array.from({ length: Math.max(0, Math.ceil((z - to) / 40)) }, (_, i) => [[f, `${f}_1`, `${f}_2`][(x * 7 + y * 13 + i * 5) % 3], 40]);
    if (z === SEA) { S.add('town', 'water', x, y, SEA, 1, 1, 0); continue; }
    const step = isPath(x, y) && stepRect(x, y);
    const top = step ? PZ.get(`${x},${y}`) : z;
    const south = courses(below, 'cliff_s');
    const eastFaces = courses(east, 'cliff_e');
    // The rock under the tile, faced where it's higher than its neighbors.
    if (south.length || eastFaces.length) {
      S.column(x, y, z - south.length * 40, south, [], null, H2);
      if (eastFaces.length) S.column(x, y, z - eastFaces.length * 40, [], eastFaces, null, H2);
    }
    if (step) {
      S.add(H2, 'path_steps', x, y, top - 40, 1, 1, 0.3);
    } else if (x >= W && QUAY(x, y)) {
      S.add('town', 'pave_nw', x, y, 0, 1, 1, 0);
    } else if (isPath(x, y)) {
      if (QUAY(x, y)) S.floor(x, y, 1, 1, { z, kind: 'pave' });
      else S.add(H2, hash(x, y, 3) < 0.12 ? 'path_c' : hash(x, y, 4) < 0.5 ? 'path_a' : 'path_b', x, y, z, 1, 1, 0);
    } else {
      S.add(H2, 'rock_shelf', x, y, z, 1, 1, 0);
      // Gorse and thyme on the rock, here and there (not where the shack and jugs stand).
      const r = hash(x, y, 7);
      const yard = x >= 2 && x <= 8 && y >= 12 && y <= 15;
      if (!yard) {
        if (r < 0.14) S.prop(H2, r < 0.07 ? 'gorse_a' : 'gorse_b', x, y, z);
        else if (r < 0.22) S.prop(H2, 'thyme', x, y, z);
        else if (r < 0.25) S.prop(H2, 'rock_a', x, y, z);
      }
    }
  }
  // The path's walkable heights (a step tile stands at its middle).
  for (const [k, z] of PZ) {
    const [x, y] = k.split(',').map(Number);
    if (stepRect(x, y)) S.stairs(x, y, { z, walk: true, dir: 'down' }); else S.floor(x, y, 1, 1, { z, kind: 'none' });
  }

  // Mott's shack and yard, the jugs; the rail down the steps by the drop and round the viewpoint.
  S.prop(H2, 'mott_shack', 2, 12, 520, 4, 4);
  S.prop(H2, 'jugs', 7, 14, 520, 2, 1);
  for (let y = 18; y <= 21; y++) S.prop(H2, 'rail_y', 2, y, PZ.get(`2,${y}`) - 40);
  S.prop(H2, 'rail_post', 1, 21, 360); S.prop(H2, 'rail_x', 1, 22, 360);
  // The sea cave's mouth at the waterline, the tide running in and out of it.
  S.prop(H2, 'sea_cave', 1, 37, SEA + 40);

  // Drop the placeholder floors and stairs that only record heights.
  return S;
}

const base = build();
const list = base.done().filter((d) => d.f !== 'none' && !(d.s === 'town' && d.f.startsWith('stairs_')));
// follows: the Goat Path doesn't change in Act 2 (Act 4's low tide at the cave falls back to the converter).
export const goatPathIso = { scene: () => list, floor: base.floorHeight(0), follows: [] };
