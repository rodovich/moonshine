// Stand-ins for other acts' maps that Act 5 needs but whose branches aren't
// merged yet: the dry Bilge (Act 4) and the lamp room (Act 2, part 2). Each
// is geometry only, laid out as its act's design and the art task's dev
// scenes draw it; Act 5's layer adds everyone and everything in it.
// `withAct5` registers a stand-in only when the real map is missing, so
// these go quiet as soon as those acts land, and can then be deleted.

import { composedMap } from '../opening/grid.js';
import { act5Tiles } from './tiles.js';
import { layout } from './common.js';
import { blankGrid } from '../opening/grid.js';
import { pave } from '../act2/common.js';

// ---------------------------------------------------------------------------
// bilge_dry (32 × 17), from docs/design/04-the-list.md ("The Bilge (Act 4
// states)") and game/dev/scene-act4-surface.js.

const V8 = (x) => 'abcdefgh'[x % 8];

function composeBilgeDry() {
  const W = 32, H = 17;
  const L = layout(W, H, blankGrid);
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) L.set('ground', x, y, pave(x, y), false);
  // The houses of the north quay, the way up to Fountain Square between them (x11-12).
  for (let x = 0; x < W; x++) {
    if (x !== 11 && x !== 12) {
      L.set('ground', x, 0, `rooftiles:${x % 5 === 0 ? 'ridge' : 'tiles'}`, true);
      L.set('ground', x, 1, `rooftiles:${x % 7 === 3 ? 'tiles_moss' : 'tiles'}`, true);
      L.set('ground', x, 2, `buildings:${x % 3 === 1 ? 'window' : 'wall'}@ochre`, true);
      L.set('ground', x, 3, `buildings:${x % 3 === 1 ? 'door_bot' : 'wall_base'}@ochre`, true);
    }
    L.set('ground', x, 15, `rooftiles:${x % 6 === 2 ? 'ridge' : 'tiles'}`, true);
    L.set('ground', x, 16, 'rooftiles:tiles', true);
  }
  for (const x of [1, 4, 7, 16, 19, 22, 25, 28]) { L.set('ground', x, 2, 'buildings:door_top@ochre', true); L.set('ground', x, 3, 'buildings:door_bot@ochre', true); }
  for (let y = 0; y <= 3; y++) for (const x of [11, 12]) L.set('ground', x, y, pave(x, y, true), false);
  // The trench: quay wall (7), Founder hull (8-9), mud (10), the near lip (11).
  for (let x = 0; x < W; x++) {
    L.set('ground', x, 7, `reveal:qwall_${V8(x)}`, true);
    L.set('ground', x, 8, `reveal:hull_n_${V8(x)}`, true);
    L.set('ground', x, 9, `reveal:hull_s_${V8(x)}`, true);
    L.set('ground', x, 10, `reveal:mud_${V8(x)}`, false);
    L.set('ground', x, 11, `reveal:lip_${V8(x)}`, true);
  }
  // The bridge spans the ditch on piers; you can't step off it onto the mud.
  ['n', 'down', 'n', 'up', 's'].forEach((p, i) => {
    L.set('ground', 12, 7 + i, `canal:bridge_${p}_l`, false);
    L.set('ground', 13, 7 + i, `canal:bridge_${p}_r`, false);
  });
  [['hull_n', 8], ['hull_s', 9], ['mud', 10]].forEach(([r, y]) => L.set('ground', 11, y, `reveal:${r}_pier_w`, true));
  [['qwall', 7], ['hull_n', 8], ['hull_s', 9], ['mud', 10]].forEach(([r, y]) => L.set('ground', 14, y, `reveal:${r}_pier_e`, y !== 10));
  // The Water Stairs, down to row 7; the last flight broken.
  [22, 23, 24, 25].forEach((x, i) => {
    const k = i === 0 ? 'l' : i === 3 ? 'r' : 'm';
    L.set('ground', x, 6, `reveal:wstairs_top_${k}`, false);
    L.set('ground', x, 7, `reveal:wstairs_${k}`, false);
    L.set('ground', x, 8, `reveal:wstairs_broken_${k}`, true);
  });
  // The last trickle, and the canal mouth falling to the Bowl.
  ['a', 'b', 'c'].forEach((c, i) => L.set('ground', 27 + i, 10, `reveal_mouth:trickle_${c}`, i > 0));
  for (const [q, x, y] of [['x0y0', 30, 9], ['x1y0', 31, 9], ['x0y1', 30, 10], ['x1y1', 31, 10]]) L.set('ground', x, y, `reveal_mouth:mouth_${q}`, true);
  // The bronze door.
  for (let dy = 0; dy < 2; dy++) for (let dx = 0; dx < 2; dx++) L.set('ground', 26 + dx, 8 + dy, `reveal_door:bronze_door_x${dx}y${dy}`, true);
  // Taut mooring ropes down to the boats; the fish stalls; mooring posts.
  for (const y of [7, 8, 9]) L.set('detail', 4, y, 'reveal:rope_taut_v');
  L.set('detail', 17, 7, 'reveal:rope_taut_se'); L.set('detail', 18, 8, 'reveal:rope_taut_se'); L.set('detail', 19, 9, 'reveal:rope_taut_se');
  for (let x = 0; x < W; x++) for (const y of [4, 5, 6, 12, 13, 14]) {
    if ((x * 73 + y * 151) % 997 % 5 === 0) L.set('ground', x, y, `bilge_flood:wet_${y % 2 ? 's' : 'n'}${x % 2 ? 'e' : 'w'}`, false);
  }
  [[2, null], [5, 'blue'], [8, 'green']].forEach(([x, pal]) => {
    const p = pal ? `@${pal}` : '';
    L.set('detail', x, 5, 'fish_stall:stall_l', true); L.set('detail', x + 1, 5, 'fish_stall:stall_r', true);
    L.counter[5][x] = L.counter[5][x + 1] = true;
    L.set('overhead', x, 4, `fish_stall:over_stall_l${p}`); L.set('overhead', x + 1, 4, `fish_stall:over_stall_r${p}`);
  });
  for (const x of [17, 28]) L.set('detail', x, 6, 'canal:mooring_post', true);
  L.set('detail', 27, 12, 'bilge_flood:fish_stranded_a');
  L.set('detail', 6, 13, 'bilge_flood:fish_stranded_b');
  // Laundry over the north quay, streaming hard in the wind.
  'abcdef'.split('').forEach((c, i) => L.set('overhead', 14 + i, 4, `cloth:over_wind_${c}`));
  return L.done();
}

export const bilgeDryStandIn = composedMap(composeBilgeDry, {
  id: 'bilge_dry',
  name: 'The Bilge',
  tileset: act5Tiles,
  lighting: 'day',
  ambience: ['wind', 'runoff'],
  step: 'step_stone',
  spawn: [24, 6],
  exits: [],
  entities: [],
});

// ---------------------------------------------------------------------------
// lamp_room (8 × 8), from docs/design/02-city.md ("Lamp room") and
// game/dev/scene-act5-surface.js.

function composeLampRoom() {
  const W = 8, H = 8;
  const L = layout(W, H, blankGrid);
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) L.set('ground', x, y, 'lamproom:wall', true);
  for (let y = 2; y < 7; y++) for (let x = 1; x < 7; x++) L.set('ground', x, y, 'lamproom:floor', false);
  for (let x = 1; x < 7; x++) L.set('ground', x, 1, 'lamproom:window', true);
  L.set('ground', 3, 7, 'lamproom:floor', false); L.set('ground', 4, 7, 'lamproom:floor', false);
  for (let ty = 0; ty < 2; ty++) for (let tx = 0; tx < 2; tx++) L.set('detail', 3 + tx, 2 + ty, `lamproom:lamp_x${tx}y${ty}`, true);
  return L.done();
}

export const lampRoomStandIn = composedMap(composeLampRoom, {
  id: 'lamp_room',
  name: 'The Lamp Room',
  tileset: act5Tiles,
  lighting: 'day',
  background: 'ink',
  step: 'step_stone',
  spawn: [3, 6],
  exits: [],
  entities: [],
});
