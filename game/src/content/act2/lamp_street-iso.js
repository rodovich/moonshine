// Lamp Street in the isometric view (map: lamp_street.js, 32 × 16). The houses
// and the Little School along the north, the lamps, the bench and the pots
// are lamp_street.js's own layout calls replayed with the town kit
// (../iso-kit.js); this file adds what the SNES layers can't say: the hipped
// roofs and side faces, the two stairs up between the houses, the school's
// bell-cote and yard walls, the west wall, and the parapet over the lower town
// with the Hundred Steps going down at x27-28. (First built by the art task as
// the kit's worked example.)
//
// Heights (px): the street at 0; the stairs climb 40 a tile to 200 at row 0;
// the houses are two 96 px storeys; the roofs below the parapet have their
// eaves at -80.

import { isoScene } from '../iso-kit.js';
import { townBeyond } from './iso-edges.js';
import { composeLampStreet } from './lamp_street.js';

const W = 32;

// What the SNES house() calls can't say, by the house's west column.
const HOUSE_ISO = {
  0: { roof: 'hip' },
  5: { side: '##w##' },
  7: { side: '##w#w' }, // the Little School
  19: { roof: 'hip' },
  27: { roof: 'hip' },
  30: { side: '#w#w#' },
};

function build(g) {
  const S = isoScene();
  const { calls } = composeLampStreet(g);

  // ---- The street and the school yard.
  S.floor(1, 5, W - 1, 8, { kind: 'pave' });
  S.floor(0, 9, 1, 3, { kind: 'pave' }); // the way west, to the Goat Path
  S.floor(8, 5, 10, 3, { kind: 'yard' });

  // ---- The houses, the lamps, the bench and the pots (lamp_street.js's calls).
  S.replay(calls, (c) => (c.fn === 'house' ? HOUSE_ISO[c.args[0]] : {}));
  // The Little School's bell-cote: a small dome on its roof.
  S.prop('town', 'dome_1x1', 12, 1, 2 * 96);

  // ---- The two stairs up between the houses (to the Squeeze, x3-4; to the Crown, x22-23).
  for (const x0 of [3, 22]) for (let y = 0; y <= 4; y++) for (const x of [x0, x0 + 1]) S.stairs(x, y, { dir: 'down', z: (5 - y) * 40 });

  // ---- The school yard's low wall (an open gate at x12-13) and its side walls.
  for (let x = 8; x <= 17; x++) if (x !== 12 && x !== 13) S.prop('cistern', 'parapet_x', x, 8, 0);
  for (let y = 5; y <= 7; y++) { S.prop('cistern', 'parapet_y', 7, y, 0); S.prop('cistern', 'parapet_y', 18, y, 0); }
  S.prop('cistern', 'parapet_pier', 7, 8, 0); S.prop('cistern', 'parapet_pier', 18, 8, 0);

  // ---- The west edge: a wall, with the way to the Goat Path open at y9-11.
  S.house(0, 5, 1, 4, { plaster: 'white', side: '####' });
  S.house(0, 12, 1, 1, { plaster: 'white', side: '#' });

  // ---- The south edge: the parapet over the lower town, the roofs below, the Steps going down.
  for (let x = 0; x < W; x++) {
    if (x === 27 || x === 28) continue;
    S.column(x, 13, -120, [['retain_s', 40], ['retain_s', 40], ['retain_s', 40]], x === W - 1 ? [['retain_e', 40], ['retain_e', 40], ['retain_e', 40]] : [], ['pave_nw', 0]);
    S.prop('cistern', 'parapet_x', x, 13, 0);
  }
  S.lowRoofs(0, 14, W, { z: -80, skip: [27, 28] });
  // The town beyond the street's east end.
  townBeyond(S, { side: 'east', x: W - 1, y0: 5, y1: 12 });
  for (const x of [27, 28]) {
    S.stairs(x, 13, { dir: 'down', z: 0 });
    S.stairs(x, 14, { dir: 'down', z: -40 });
    S.stairs(x, 15, { dir: 'down', z: -80 });
  }
  return S;
}

const base = build(null);
export const lampStreetIso = { scene: (g) => build(g).done(), floor: base.floorHeight(0), follows: [] };
