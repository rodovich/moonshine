// Fountain Square in the isometric view (map: square.js, 24 × 18). The houses
// along the north and the lamps are square.js's own layout calls replayed with
// the town kit (../iso-kit.js); this file adds the arch through to the Steps,
// the landmarks (act2_landmarks: the Fountain, the Shop window, the Mayor's
// door, the stalls, the café, the Mayor's crate), and the drop to the south
// with the stair down to the Bilge.
//
// Heights (px): the square at 0; the houses one storey (96) plus the roof; the
// roofs below the south edge at -80; the stair down at x11-12.

import { isoScene } from '../iso-kit.js';
import { composeSquare } from './square.js';

const W = 24;
const LM = 'act2_landmarks';

// What the SNES house() calls can't say, by the house's west column.
const HOUSE_ISO = {
  0: { roof: 'hip' }, // the Shop
  8: {},
  13: {},
  16: { roof: 'hip' }, // the Mayor's office
};

// Wall faces at the given tiles and height, for a landmark front to replace.
const isFace = (d, tiles, z) => d.layer === 0.1 && d.z === z && tiles.some(([x, y]) => d.x === x + 0.5 && d.y === y + 0.5);

function build(g) {
  const S = isoScene();
  const { calls } = composeSquare(g);
  const flag = (f) => !!(g && g.flag && g.flag(f));

  // ---- The square, and the shaded way through the arch to the Steps (x11-12, rows 0-3).
  S.floor(0, 4, W, 12, { kind: 'pave' });

  // ---- North: the Shop, two houses, the Mayor's office (square.js's calls), the lamps.
  S.replay(calls, (c) => (c.fn === 'house' ? HOUSE_ISO[c.args[0]] : c.fn === 'lamp' ? { lit: flag('lighting.dusk') } : {}));
  // The arch between the houses: a one-storey block over the passage, open beneath.
  S.house(11, 0, 2, 4, { front: 'AA', plaster: 'ochre', roof: 'flat' });
  S.floor(11, 0, 2, 4, { kind: 'pave_shade' });
  // The Shop window (the straw hat, then the Keeper's telescope), and the Mayor's door and plaque.
  S.prop(LM, flag('window.telescope') ? 'shopfront_scope' : 'shopfront_hat', 6, 3, 0, 2, 1);
  S.prop(LM, 'mayor_front', 19, 3, 0, 2, 1);

  // ---- The Fountain of the Fish (the fish itself is the 'fish' entity, drawn by its own sheet).
  S.prop(LM, 'fountain', 10, 7, 0, 4, 4);

  // ---- Market stalls, the café, the Mayor's crate.
  S.prop(LM, 'stall', 1, 12, 0, 2, 2); S.prop(LM, 'stall', 4, 12, 0, 2, 2);
  for (const x of [19, 22]) {
    S.prop(LM, 'cafe_chair', x, 12, 0);
    S.prop(LM, 'cafe_table', x, 13, 0);
    S.prop(LM, 'cafe_chair_back', x, 14, 0);
  }
  S.prop(LM, 'mayor_crate', 8, 11, 0);

  // ---- South: the edge over the roofs below, the stair down to the Bilge at x11-12.
  for (let x = 0; x < W; x++) {
    if (x === 11 || x === 12) continue;
    S.column(x, 16, -120, [['retain_s', 40], ['retain_s', 40], ['retain_s', 40]], x === W - 1 ? [['retain_e', 40], ['retain_e', 40], ['retain_e', 40]] : [], ['pave_nw', 0]);
    S.prop('cistern', x === 10 || x === 13 ? 'parapet_pier' : 'parapet_x', x, 16, 0);
  }
  S.lowRoofs(0, 17, W, { z: -80, skip: [11, 12] });
  for (const x of [11, 12]) { S.stairs(x, 16, { dir: 'down', z: 0 }); S.stairs(x, 17, { dir: 'down', z: -40 }); }

  // The landmark fronts replace the town kit's faces where they stand.
  const fronts = [[6, 3], [7, 3], [19, 3], [20, 3]];
  return { S, list: S.done().filter((d) => !isFace(d, fronts, 0)) };
}

const base = build(null);
export const squareIso = { scene: (g) => build(g).list, floor: base.S.floorHeight(0) };
