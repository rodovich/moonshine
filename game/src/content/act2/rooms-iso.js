// Act 2's interiors in the isometric view: the Shop (square.js), the Archive
// and its crypt (archive.js), and the lighthouse's lamp room (harbor.js).
// Each is a room from the town kit's S.room (../iso-kit.js; the wall sets on
// sheet `rooms`) with the art task's furniture (act2_interiors), placed where
// the SNES map has it. The back walls (north, west) stand full height; the
// near ones (south, east) are cut to stubs, the doors in them thresholds.

import { isoScene } from '../iso-kit.js';

const I = 'act2_interiors';
const LM = 'act2_landmarks';
const flagOf = (g) => (f) => !!(g && g.flag && g.flag(f));

// Wall faces on the given tiles, for a piece in the wall to replace.
const notFaceAt = (tiles) => (d) => !(d.layer === 0.1 && tiles.some(([x, y]) => d.x === x + 0.5 && d.y === y + 0.5));

// follows: the flags whose changes to the map the scene draws itself (engine README, "Isometric view").
const sceneOf = (build, follows = []) => {
  const base = build(null);
  return { scene: (g) => build(g).list, floor: base.S.floorHeight(0), follows };
};

// The Shop (10 × 8): floor x1-8, rows 1-6; the door at (4-5, 7).
export const shopIso = sceneOf((g) => {
  const flag = flagOf(g);
  const S = isoScene();
  S.room(1, 1, 8, 6, { set: 'shop', doors: [[4, 7], [5, 7]] });
  S.prop(I, 'shelving', 1, 1, 0, 4, 1);
  S.prop(I, 'shelving_2', 7, 1, 0, 2, 1);
  S.prop(I, 'barometer', 7, 0, 0);
  S.prop(I, 'counter_glint', 2, 3, 0, 5, 1);
  S.prop(I, 'marble_jar', 1, 5, 0);
  S.prop(I, flag('window.telescope') ? 'display_scope' : 'display_hat', 7, 5, 0, 2, 1);
  return { S, list: S.done() };
}, ['window.telescope']);

// The Archive (16 × 14): floor x1-14, rows 2-12; the high windows at (7-8, 1); the door at (7-8, 13).
export const archiveIso = sceneOf(() => {
  const S = isoScene();
  S.room(1, 2, 14, 11, { set: 'archive', doors: [[7, 13], [8, 13]], windows: [[7, 1], [8, 1]] });
  S.prop(I, 'wallshelf_l', 1, 2, 0, 4, 1);
  S.prop(I, 'wallshelf_r', 11, 2, 0, 4, 1);
  for (const [x, y] of [[2, 4], [12, 4], [2, 10], [12, 10]]) S.prop(I, 'shelf_free', x, y, 0, 2, 1);
  S.prop(I, 'desk', 7, 5, 0, 2, 1);
  S.add(I, 'eye', 7, 8, 0, 2, 2, 0);
  S.prop(I, 'teapot', 7, 8, 0);
  S.add(I, 'stair_down', 13, 11, 0, 1, 1, 0);
  return { S, list: S.done() };
});

// The crypt (10 × 7): floor x1-8, rows 2-5; the Founders' Door in the north wall at (5-6, 1);
// the stair up to the Archive at (1, 5).
export const cryptIso = sceneOf(() => {
  const S = isoScene();
  S.room(1, 2, 8, 4, { set: 'crypt' });
  for (const x of [1, 2, 8]) S.prop(I, 'crate_stack', x, 2, 0);
  S.prop(I, 'lectern', 3, 3, 0);
  // The stair up runs west, out of the room under the west wall.
  S.stairs(1, 5, { dir: 'right', z: 40 });
  // (Act 3 opens it: founders_door_open is Act 3's to place.)
  S.prop(LM, 'founders_door', 5, 1, 0, 2, 1);
  const list = S.done().filter(notFaceAt([[5, 1], [6, 1]]))
    .map((d) => (d.s === 'town' && d.f === 'stairs_right' ? { ...d, s: 'rooms', f: 'crypt_stairs_right' } : d));
  return { S, list };
});

// The lamp room (8 × 8): floor x1-6, rows 2-6; windows all along the north wall; the stair down at (3-4, 7).
export const lampRoomIso = sceneOf((g) => {
  const flag = flagOf(g);
  const S = isoScene();
  S.room(1, 2, 6, 5, { set: 'lamp', doors: [[3, 7], [4, 7]], windows: [1, 2, 3, 4, 5, 6].map((x) => [x, 1]) });
  S.prop(I, 'lamp', 3, 2, 0, 2, 2);
  // The telescope under its dust sheet, until the Keeper gives it away.
  S.prop(I, flag('got.telescope') || flag('telescope.migrated') ? 'sheet_empty' : 'scope_sheet', 6, 5, 0);
  S.prop(I, 'polish_tin', 1, 6, 0);
  return { S, list: S.done() };
}, ['got.telescope', 'telescope.migrated']);
