// The Crown in the isometric view (map: crown.js, 24 × 16). The houses, lamps,
// benches and pots are crown.js's own layout calls replayed with the town kit
// (../iso-kit.js); this file adds what the SNES layers can't say: the blocks'
// depths and heights, the landmarks (act2_landmarks), and the drop to the
// south.
//
// Heights (px): the plaza at 0; the houses two storeys (192); the Archive
// under the Blue Dome two storeys, the dome on its flat roof; the roofs of
// the town below the parapet at -80; the stair down at x11-12.

import { isoScene, STOREY } from '../iso-kit.js';
import { composeCrown } from './crown.js';

const W = 24;
const LM = 'act2_landmarks';

// iso-kit's replay() reads a house call's args as house()'s own (L first).
const asHouseArgs = (calls) => calls.map((c) => (c.fn === 'house' ? { ...c, args: [null, ...c.args] } : c));

// Wall faces at the given tiles and height, for a landmark front to replace.
const isFace = (d, tiles, z) => d.layer === 0.1 && d.z === z && tiles.some(([x, y]) => d.x === x + 0.5 && d.y === y + 0.5);

function build(g) {
  const S = isoScene();
  const { calls } = composeCrown(g);

  // ---- The plaza, and behind the north buildings the roofs of the far side, lower down.
  S.floor(0, 7, W, 7, { kind: 'pave' });
  S.lowRoofs(0, 0, W, { z: -40 });

  // ---- The north edge: the small houses and the Clockmaker's (crown.js's house() calls).
  S.replay(asHouseArgs(calls.filter((c) => c.fn === 'house')), (c) => ({ roof: c.args[1] === 9 ? 'hip' : 'flat' }));
  // The Bell Tower (x2-7, rows 3-6), its door on row 6.
  S.prop(LM, 'bell_tower', 2, 3, 0, 6, 4);
  // The Archive under the Blue Dome: a deep two-storey block (x15-22, rows 0-6), the dome on its roof.
  S.house(15, 0, 8, 7, { front: '#w#__#w#', upper: '#w#ww#w#', plaster: 'white', roof: 'flat' });
  S.prop(LM, 'blue_dome', 16, 0, 2 * STOREY, 6, 6);
  S.prop(LM, 'dome_door', 18, 6, 0, 2, 1);
  // The Clockmaker's window and fascia (x10-11 on row 6) and his hanging sign.
  S.prop(LM, 'clockshop_front', 10, 6, 0, 2, 1);
  S.prop(LM, 'clock_sign', 13, 7, 0);

  // ---- The sundial.
  S.prop(LM, 'sundial', 11, 9, 0, 2, 2);

  // ---- The south parapet over all of Tessel, the stair down cut through it at x11-12.
  for (let x = 0; x < W; x++) {
    if (x === 11 || x === 12) continue;
    S.column(x, 14, -120, [['retain_s', 40], ['retain_s', 40], ['retain_s', 40]], x === W - 1 ? [['retain_e', 40], ['retain_e', 40], ['retain_e', 40]] : [], ['pave_nw', 0]);
    S.prop('cistern', x === 10 || x === 13 ? 'parapet_pier' : 'parapet_x', x, 14, 0);
  }
  S.lowRoofs(0, 15, W, { z: -80, skip: [11, 12] });
  for (const x of [11, 12]) { S.stairs(x, 14, { dir: 'down', z: 0 }); S.stairs(x, 15, { dir: 'down', z: -40 }); }

  // ---- Lamps, benches, pots (crown.js's own calls).
  S.replay(calls.filter((c) => c.fn !== 'house'), (c) => (c.fn === 'lamp' ? { lit: !!(g && g.flag && g.flag('lighting.dusk')) } : {}));

  // The landmark fronts replace the town kit's ground-storey faces where they stand.
  const fronts = [[10, 6], [11, 6], [18, 6], [19, 6]];
  const list = S.done();
  return { S, list: list.filter((d) => !isFace(d, fronts, 0)) };
}

const base = build(null);
export const crownIso = { scene: (g) => build(g).list, floor: base.S.floorHeight(0) };
