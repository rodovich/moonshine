// Cistern Court in the isometric view: the art task's composition
// (game/dev/iso-court.js) driven by the same flags as the SNES court in
// court.js. See the engine README, "Isometric view", for the format.
//
// Heights (px): the roof terraces at 120 over rows 1-9, the facades a
// 96 px storey on row 11's south faces under pent roofs, the court at 0,
// the eaves of the houses below it at -80.

const W = 20;
const DECK = 120;
const STOREY = 96;
const LOW = -80; // the eaves of the houses below the court
const C = 'cistern';

const deckFloor = (x, y) => {
  if (x === 6 && y === 7) return 'deck_crack';
  if (x === 16 && y === 3) return 'deck_crack';
  if (x === 5 && y === 2) return 'deck_patch';
  return `deck_${y % 2 ? 's' : 'n'}${x % 2 ? 'e' : 'w'}`;
};

function scene(g) {
  const f = (n) => g.flag(n);
  const am = !!f('act1.moonrise');
  const out = [];
  const add = (s, fr, x, y, z = 0, fw = 1, fd = 1, layer = 1) => out.push({ s, f: fr, x: x + fw / 2, y: y + fd / 2, z, fw, fd, layer });
  // A column at (x, y): faces stacked from z0 up, then its top.
  const column = (x, y, z0, sFaces, eFaces, top) => {
    let z = z0;
    for (const [fr, h] of sFaces) { add(C, fr, x, y, z, 1, 1, 0.1); z += h; }
    z = z0;
    for (const [fr, h] of eFaces) { add(C, fr, x, y, z, 1, 1, 0.1); z += h; }
    if (top) add(C, top[0], x, y, top[1], 1, 1, 0.2);
  };

  // ---- Backdrop (row 0): the Crown's lower walls in the middle, houses either side.
  for (let x = 0; x < W; x++) {
    const crown = x >= 4 && x <= 12;
    const faces = crown ? [[`crown_s${x === 6 || x === 10 ? '_buttress' : ''}`, 160]] : [[x % 3 === 1 ? `house_s_window_${x > 12 ? 'rose' : 'blue'}` : 'house_s_plain', 120]];
    column(x, 0, DECK, faces, x === W - 1 ? [['house_e_plain', 120]] : [], ['roof_top', DECK + (crown ? 160 : 120)]);
  }

  // ---- The houses (rows 1-11): roof terraces on top (rows 1-9), pent roofs over rows 10-11.
  const cheryl = { 1: 'window_box', 3: 'door', 5: 'window' };
  const nb = { 11: 'window', 13: 'window_box', 14: 'door', 16: 'window', 18: 'window_box' };
  for (let x = 0; x < W; x++) {
    for (let y = 1; y <= 11; y++) {
      if (x === 7 && y >= 9) continue; // the stair cuts through
      const roofRow = y <= 9;
      let s = [];
      if (y === 11) {
        const blue = x < 7;
        const k = blue ? cheryl[x] : nb[x];
        s = [[k ? `facade_s_${k}_${blue ? 'blue' : 'green'}` : 'facade_s_plain', STOREY]];
      }
      let e = [];
      if (x === W - 1 || x === 6) e = roofRow ? [['facade_e_plain', STOREY], ['course24_e', 24]] : [['facade_e_plain', STOREY]];
      column(x, y, 0, s, e, roofRow ? [deckFloor(x, y), DECK] : null);
    }
    if (x !== 7) add(C, 'pent_roof', x, 10, STOREY, 1, 2, 1);
  }
  // Parapets, the low wall at x9 (its gap at y5), the stair down at x7.
  for (let x = 0; x < W; x++) add(C, x === 0 || x === W - 1 ? 'parapet_pier' : 'parapet_x', x, 1, DECK);
  for (let y = 2; y <= 8; y++) { add(C, 'parapet_y', 0, y, DECK); add(C, y === 4 ? 'parapet_y_pin' : 'parapet_y', W - 1, y, DECK); }
  for (let x = 0; x < W; x++) if (x !== 7) add(C, x === 0 || x === W - 1 ? 'parapet_pier' : 'parapet_x', x, 9, DECK);
  for (const y of [2, 3, 7, 8]) add(C, 'lowwall_y', 9, y, DECK);
  add(C, 'lowwall_end_s_pin', 9, 4, DECK);
  add(C, 'lowwall_end_n', 9, 6, DECK);
  add(C, 'stair', 7, 9, 80, 1, 1, 0.3);
  add(C, 'stair', 7, 10, 40, 1, 1, 0.3);
  add(C, 'stair', 7, 11, 0, 1, 1, 0.3);

  // ---- Cheryl's roof: chimney, herbs, chairs, tap, tub.
  add(C, f('fx.chimney') === 'rattle' ? 'chimney_rattle' : 'chimney', 7, 2, DECK, 2, 1);
  add(C, 'herb_basil', 1, 2, DECK);
  add(C, 'herb_rosemary', 2, 2, DECK);
  add(C, f('fx.cardigan') ? 'chair_cardigan' : 'chair_fold', 2, 7, DECK);
  add(C, 'chair_fold', 3, 7, DECK);
  add(C, f('fx.tap') ? 'tap_running' : 'tap', 2, 4, DECK);
  let tub = 'tub_empty';
  if (!am) {
    if (f('tub.full')) tub = 'tub_full';
    else if (f('tub.plugged')) tub = 'tub_plugged';
    const fx = f('fx.tub');
    if (fx) tub = { filling: 'tub_filling', slosh: 'tub_slosh', whirl: 'tub_whirl_wrong', empty: 'tub_empty' }[fx];
  }
  // Seated on the rim, she's drawn with the tub, so the rim covers her shins
  // (the player's own sprite is hidden then; see `hide` below).
  if (seated(g)) tub = { tub_full: 'tub_sit_full', tub_plugged: 'tub_sit_full', tub_filling: 'tub_sit_full', tub_slosh: 'tub_sit_slosh', tub_whirl_wrong: 'tub_sit_whirl_wrong', tub_empty: 'tub_sit_empty' }[tub] || 'tub_sit_full';
  add(C, tub, 3, 4, DECK, 2, 1);

  // ---- Her Next Door's roof: the line posts, the sheets, the back line.
  const stage = f('neighbor.stage') || 0;
  const moved = am || f('neighbor.sheetsMoved');
  // Grey the morning after; white again in Act 6's epilogue (act6/epilogue.js patches the SNES line the same way).
  const grey = am && !f('epilogue') ? '_grey' : '';
  for (const x of [12, 15]) {
    add(C, 'line_post', x, 3, DECK);
    add(C, 'line_post', x, 7, DECK);
    const bare = moved || (x === 15 ? stage >= 1 : stage >= 2);
    if (!bare) add(C, `sheets_ns${grey}`, x, 4, DECK, 1, 3);
  }
  let line = 'backline_sag';
  if (moved || stage >= 6) line = `backline_sheets${grey}`;
  else if (stage >= 3) line = ['backline_prop', 'backline_one', 'backline_two'][stage - 3];
  if (f('fx.backline') === 'swung') line = `backline_swung${grey}`;
  add(C, line, 11, 2, DECK, 8, 1);

  // ---- The court (rows 12-23).
  for (let y = 12; y <= 23; y++) {
    for (let x = 1; x <= 18; x++) {
      const fr = x === 6 && y === 20 ? 'cobble_drain' : `cobble_${(x * 7 + y * 3 + ((x * y) % 5)) % 4}`;
      if (y === 23) column(x, y, -160, [['retain_s', 40], ['retain_s', 40], ['retain_s', 40], ['retain_s', 40]], [], [fr, 0]);
      else add(C, fr, x, y, 0, 1, 1, 0);
    }
  }
  // West: the Pelletiers' house, two storeys, shutters closed; the gate at y19.
  for (let y = 12; y <= 23; y++) {
    const k = y === 19 ? 'facade_e_gate_ochre' : y % 3 === 0 ? 'facade_e_window_closed_ochre' : 'facade_e_plain_ochre';
    const up = y % 3 === 0 ? 'upper_e_window_closed_ochre' : 'upper_e_plain_ochre';
    column(0, y, 0, y === 23 ? [['facade_s_plain_ochre', 96], ['upper_s_plain_ochre', 96]] : [], [[k, 96], [up, 96]], ['roof_top', 192]);
  }
  // East: a low wall with a view over the town below.
  for (let y = 12; y <= 23; y++) column(W - 1, y, 0, y === 23 ? [['retain_s', 40]] : [], [['retain_e', 40]], ['roof_top', 40]);
  add(C, 'lemon_tree', 3, 14, 0);
  add(C, 'stool', 2, 16, 0);
  add(C, am ? 'chess_slid' : f('oldMan.hasPepperKing') ? 'chess_pepper' : 'chess_plug', 3, 16, 0);
  add(C, 'gerald_chair', 4, 16, 0);
  add(C, 'well', 9, 16, 0, 2, 2);
  add(C, am || f('kid.hasTimer') ? 'pots_bare' : 'hurdle', 12, 17, 0, 3, 1);
  add(C, 'bench', 16, 12, 0, 2, 1);
  for (const [x, y, i] of [[1, 21, 0], [18, 21, 1], [1, 23, 2], [2, 23, 0], [18, 23, 1]]) add(C, `geraniums_${i}`, x, y, 0);
  // Wedged at the top of the Squeeze, over rows 23-24 as on the SNES map, so (15-16, 22) stays clear in front of it.
  if (!(am || f('piano.gone'))) add(C, 'piano', 15, 23, 0, 2, 2);

  // ---- Below: the roofs of the next houses down, and the Squeeze between them.
  // Their walls stand 60 px from LOW - 60 to the eaves (the two beside the Squeeze a storey taller).
  for (const [x, fr] of [[0, 'lowhouse_terra_3x2'], [3, 'lowhouse_flat_2x2'], [5, 'lowhouse_flat_3x2'], [8, 'lowhouse_terra_2x2'], [10, 'lowhouse_terra_3x2'], [13, 'lowhouse_flat_2x2_tall'], [17, 'lowhouse_terra_3x2_tall']]) {
    add(C, fr, x, 24, LOW - 60, fr.includes('3x2') ? 3 : 2, 2, 1);
  }
  const step = am || f('piano.gone') ? 'stair_scraped' : 'stair';
  for (const x of [15, 16]) {
    add(C, step, x, 24, -40, 1, 1, 0.3);
    add(C, step, x, 25, -80, 1, 1, 0.3);
  }
  return out;
}

// Where characters stand (px), for the tiles they can walk on.
function floor(x, y) {
  if (y <= 9) {
    if (x === 7 && y === 9) return 100; // the stair's top step
    return DECK;
  }
  if (x === 7 && y === 10) return 60;
  if (x === 7 && y === 11) return 20;
  if (y >= 24) return y === 24 ? -20 : -60; // down the Squeeze
  return 0;
}

const seated = (g) => g.player.pose === 'sit_tub_right';

export const courtIso = { scene, floor, hide: (g) => (seated(g) ? ['player'] : []) };
