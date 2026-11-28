// Lamp Street in the isometric view, assembled from the town kit with the
// scene helpers (../iso-kit.js). It follows lamp_street.js's compose() line
// for line: the houses and the Little School along the north (two storeys,
// fronts on the street), the two stairs up between them, the school yard, the
// west wall with the way to the Goat Path, the parapet over the lower town on
// the south with the Hundred Steps going down at x27–28, and the lamps,
// bench, and pots.
//
// Heights (px): the street at 0; the stairs climb 40 a tile to 200 at row 0;
// the houses are two 96 px storeys; the roofs below the parapet have their
// eaves at -80.

import { isoScene } from '../iso-kit.js';

const W = 32;

function build(g) {
  const S = isoScene();
  // ---- The street and the school yard.
  S.floor(1, 5, W - 1, 8, { kind: 'pave' });
  S.floor(0, 9, 1, 3, { kind: 'pave' }); // the way west, to the Goat Path
  S.floor(8, 5, 10, 3, { kind: 'yard' });

  // ---- Houses and the Little School along the north (fronts on row 4).
  S.house(0, 0, 3, 5, { front: '#D#', upper: '#w#', plaster: 'sky', roof: 'hip' });
  S.house(5, 0, 2, 5, { front: '#D', upper: 'w#', plaster: 'ochre', side: '##w##' });
  S.house(7, 0, 12, 5, { front: '#w#w#DD#w#c#', upper: '#w#w####w#w#', plaster: 'sage', side: '##w#w' }); // the Little School
  S.house(19, 0, 3, 5, { front: '#D#', upper: '#b#', plaster: 'rose', roof: 'hip' });
  S.house(24, 0, 3, 5, { front: '#D#', upper: '#b#', plaster: 'white' });
  S.house(27, 0, 3, 5, { front: '#Dw', upper: '#w#', plaster: 'ochre', roof: 'hip' });
  S.house(30, 0, 2, 5, { front: '#D', upper: 'w#', plaster: 'sky', side: '#w#w#' });
  // The Little School's bell-cote: a small dome on its roof.
  S.prop('town', 'dome_1x1', 12, 1, 2 * 96);

  // ---- The two stairs up between the houses (to the Squeeze, x3–4; to the Crown, x22–23).
  for (const x0 of [3, 22]) for (let y = 0; y <= 4; y++) for (const x of [x0, x0 + 1]) S.stairs(x, y, { dir: 'down', z: (5 - y) * 40 });

  // ---- The school yard's low wall (an open gate at x12–13) and its side walls.
  for (let x = 8; x <= 17; x++) if (x !== 12 && x !== 13) S.prop('cistern', 'parapet_x', x, 8, 0);
  for (let y = 5; y <= 7; y++) { S.prop('cistern', 'parapet_y', 7, y, 0); S.prop('cistern', 'parapet_y', 18, y, 0); }
  S.prop('cistern', 'parapet_pier', 7, 8, 0); S.prop('cistern', 'parapet_pier', 18, 8, 0);

  // ---- The west edge: a wall, with the way to the Goat Path open at y9–11.
  S.house(0, 5, 1, 4, { plaster: 'white', side: '####' });
  S.house(0, 12, 1, 1, { plaster: 'white', side: '#' });

  // ---- The south edge: the parapet over the lower town, the roofs below, the Steps going down.
  for (let x = 0; x < W; x++) {
    if (x === 27 || x === 28) continue;
    S.column(x, 13, -120, [['retain_s', 40], ['retain_s', 40], ['retain_s', 40]], x === W - 1 ? [['retain_e', 40], ['retain_e', 40], ['retain_e', 40]] : [], ['pave_nw', 0]);
    S.prop('cistern', 'parapet_x', x, 13, 0);
  }
  S.lowRoofs(0, 14, W, { z: -80, skip: [27, 28] });
  for (const x of [27, 28]) {
    S.stairs(x, 13, { dir: 'down', z: 0 });
    S.stairs(x, 14, { dir: 'down', z: -40 });
    S.stairs(x, 15, { dir: 'down', z: -80 });
  }

  // ---- Lamps, the bench, pots.
  for (const x of [5, 16, 25]) S.lamp(x, 9, 0, { lit: !!(g && g.flag && g.flag('lighting.dusk')) });
  S.bench(20, 11);
  S.pot(24, 5); S.pot(26, 5); S.pot(2, 5, 'pot_bay');
  return S;
}

const base = build(null);
export const lampStreetIso = { scene: (g) => build(g).done(), floor: base.floorHeight(0) };
