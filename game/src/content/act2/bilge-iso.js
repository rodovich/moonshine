// The Bilge in the isometric view (map: bilge.js, 32 × 16): houses along the
// north quay with the stair up to Fountain Square, the fish stalls, the canal
// with its stepped bridge and the Water Stairs walking down into it, and the
// south quay, flooded ankle-deep at its west end where the Goat Path comes
// down. The houses are bilge.js's own house() calls (deepened into the hill);
// the rest is the town kit (../iso-kit.js) and the harbor sheet (act2_harbor).
//
// Heights (px): both quays at 0; the canal at -40; the bridge's deck at 20;
// the stair up to the Square climbs 40 a row to 160 at row 0.

import { isoScene } from '../iso-kit.js';
import { composeBilge, BILGE_LAYOUT } from './bilge.js';

const W = 32;
const H2 = 'act2_harbor';
const PLASTER = { white_sage: 'sage', sky: 'sky', ochre: 'ochre', rose: 'rose' };
const { STALLS, POSTS } = BILGE_LAYOUT;
const CANAL = -40;

function build() {
  const S = isoScene();
  const { calls } = composeBilge();

  // ---- The quays: north (rows 4-6), south (rows 11-13).
  S.floor(0, 4, W, 3, { kind: 'pave' });
  S.floor(0, 11, W, 3, { kind: 'pave' });

  // ---- North: the houses along the quay, deepened back into the hill (rows 0-3), and the stair up.
  for (const c of calls.filter((c) => c.fn === 'house')) {
    const [x0, , { top, palette }] = c.args;
    S.house(x0, 0, top.length, 4, { front: top, upper: top.replace(/D/g, 'w'), plaster: PLASTER[palette] || 'white', roof: 'flat' });
  }
  for (let y = 0; y <= 3; y++) for (const x of [11, 12]) S.stairs(x, y, { dir: 'down', z: (4 - y) * 40 });

  // ---- The fish stalls, their awnings in their own colors; the mooring posts.
  ['fish_stall', 'fish_stall_blue', 'fish_stall_green'].forEach((f, i) => S.prop(H2, f, STALLS[i], 4, 0, 2, 2));
  for (const [x, y] of POSTS) S.prop('town', 'mooring_post', x, y, 0);

  // ---- The canal (rows 8-9) between its banks (rows 7, 10).
  for (let x = 0; x < W; x++) {
    if (x < 22 || x > 25) { S.column(x, 7, CANAL, [['quay_s', 40]], [], ['pave_nw', 0]); S.prop('town', 'lip_x', x, 7, 0); }
    S.add('town', 'water_n', x, 8, CANAL, 1, 1, 0); // along the north quay wall: its shadow and reflection
    S.add('town', 'water', x, 9, CANAL, 1, 1, 0);
    S.column(x, 10, CANAL, [], [], ['pave_nw', 0]);
  }
  // The stepped bridge (x12-13); the deck stands a little above the quays.
  for (const x of [12, 13]) for (let y = 7; y <= 10; y++) S.floor(x, y, 1, 1, { z: y === 8 || y === 9 ? 20 : 0, kind: 'none' });
  S.prop('town', 'bridge_y', 12, 7, CANAL, 2, 4);
  // The Water Stairs (x22-25): broad steps down from the north quay into the canal and on under it.
  S.add(H2, 'wstairs_top', 22, 6, 0, 4, 1, 0.3);
  S.add(H2, 'wstairs_wet', 22, 7, 0, 4, 1, 0.3);
  // Boats: the Boatman's rowboat (he sits in it) and two moored canal boats.
  S.prop(H2, 'rowboat', 14, 9, CANAL, 2, 1);
  S.prop(H2, 'canal_boat_blue', 4, 8, CANAL, 2, 1);
  S.prop(H2, 'canal_boat_green', 28, 8, CANAL, 2, 1);
  // The sign east to the Harbor, on the south bank.
  S.prop(H2, 'sign_harbor', 29, 10, 0, 3, 1);

  // ---- The south quay's west end, flooded ankle-deep (x0-5, rows 11-12), lapping onto x6.
  for (let y = 11; y <= 12; y++) {
    for (let x = 0; x <= 5; x++) S.add(H2, 'flood', x, y, 0, 1, 1, 0);
    S.add(H2, 'flood_edge_e', 6, y, 0, 1, 1, 0);
  }

  // ---- South: the edge over the roofs below.
  for (let x = 0; x < W; x++) {
    S.column(x, 14, -120, [['retain_s', 40], ['retain_s', 40], ['retain_s', 40]], x === W - 1 ? [['retain_e', 40], ['retain_e', 40], ['retain_e', 40]] : [], ['pave_nw', 0]);
    S.prop('cistern', 'parapet_x', x, 14, 0);
  }
  S.lowRoofs(0, 15, W, { z: -80 });
  return S;
}

const base = build();
const list = base.done().filter((d) => d.f !== 'none');
// follows: the Bilge doesn't change in Act 2 (Act 4's flood stages and dry Bilge fall back to the converter).
export const bilgeIso = { scene: () => list, floor: base.floorHeight(0), follows: [] };
