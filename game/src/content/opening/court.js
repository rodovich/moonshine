// Cistern Court (20 × 26): Cheryl's roof and Her Next Door's at the top, the
// court at the bottom, joined by the outside stair at x7. Layout, lines, and
// puzzle from docs/design/01-opening.md; art from docs/art-opening.md.

import { composedMap, blankGrid } from './grid.js';
import { openingTiles } from './tiles.js';
import { morning, getItem, bump, cycle, talking, cherylDeclines } from './common.js';
import { moonrise } from './moonrise.js';
import { old_man_seated, neighbor, sweaty_kid } from '../../art/opening_npcs.js';
import { props } from '../../art/props.js';
import { fx, fx_mist } from '../../art/fx.js';
import { drawText, drawTextCentered, measure } from '../../engine/text.js';

const W = 20, H = 26;

// ---------------------------------------------------------------------------
// Tiles

// Transient flags the moonrise and the set pieces use to drive the art:
//   fx.tap ('on'), fx.tub ('filling' | 'slosh' | 'whirl' | 'empty'),
//   fx.chimney ('rattle'), fx.backline ('swung'), neighbor.stage (1–6).
function compose(g) {
  const f = (n) => g.flag(n);
  const am = !!f('act1.moonrise');
  const ground = blankGrid(W, H), detail = blankGrid(W, H), overhead = blankGrid(W, H);
  const solid = blankGrid(W, H, false);
  const step = blankGrid(W, H); // footstep sounds; the map's own is stone
  for (let y = 2; y <= 8; y++) for (let x = 1; x <= 18; x++) step[y][x] = 'step_plaster';
  for (let y = 8; y <= 12; y++) step[y][7] = 'step_stairs';
  step[24][15] = step[24][16] = step[25][15] = step[25][16] = 'step_stairs';
  const set = (layer, x, y, ref) => { layer[y][x] = ref; };
  const block = (x, y, s = true) => { solid[y][x] = s; };

  // ---- Roof level (rows 0–9) ----
  const floor = (x, y) => `roof:roof_floor_${y % 2 ? 's' : 'n'}${x % 2 ? 'e' : 'w'}`;
  for (let y = 2; y <= 8; y++) for (let x = 1; x <= 18; x++) ground[y][x] = floor(x, y);
  set(ground, 5, 2, 'roof:roof_floor_ne_patch');
  set(ground, 6, 7, 'roof:roof_floor_sw_cracked');
  set(ground, 16, 3, 'roof:roof_floor_sw_cracked');
  const back = ['backdrop_house', 'backdrop_house_window', 'backdrop_eave', 'backdrop_eave', 'backdrop_crown', 'backdrop_crown',
    'backdrop_crown_buttress', 'backdrop_crown', 'backdrop_crown', 'backdrop_crown', 'backdrop_crown_buttress', 'backdrop_crown',
    'backdrop_crown', 'backdrop_eave', 'backdrop_eave', 'backdrop_house_window', 'backdrop_house', 'backdrop_house_window', 'backdrop_eave', 'backdrop_eave'];
  back.forEach((fr, x) => { set(ground, x, 0, `roof:${fr}`); block(x, 0); });
  for (let x = 0; x < W; x++) { set(ground, x, 1, 'roof:parapet_n'); block(x, 1); }
  set(ground, 0, 1, 'roof:parapet_nw'); set(ground, 19, 1, 'roof:parapet_ne');
  for (let y = 2; y <= 8; y++) {
    set(ground, 0, y, 'roof:parapet_w'); set(ground, 19, y, 'roof:parapet_e');
    block(0, y); block(19, y);
  }
  for (let x = 0; x < W; x++) { set(ground, x, 9, 'roof:roof_edge_s'); block(x, 9); }
  set(ground, 0, 9, 'roof:roof_edge_sw'); set(ground, 19, 9, 'roof:roof_edge_se');
  // The low wall at x9, with its one-step gap at y5.
  for (const y of [2, 3, 7, 8]) set(ground, 9, y, 'roof:lowwall');
  set(ground, 9, 4, 'roof:lowwall_end_s'); set(ground, 9, 5, 'roof:lowwall_gap'); set(ground, 9, 6, 'roof:lowwall_end_n');
  // The sighting pins: on the low wall's south end and on the east parapet, lined up on the Gate.
  set(detail, 9, 4, 'sight_pin:wall'); set(detail, 19, 4, 'sight_pin:parapet');
  for (const y of [2, 3, 4, 6, 7, 8]) block(9, y);
  // Chimney stack.
  set(ground, 7, 2, 'roof:chimney_l'); set(ground, 8, 2, 'roof:chimney_r'); block(7, 2); block(8, 2);
  const rattle = f('fx.chimney') === 'rattle';
  set(overhead, 7, 1, rattle ? 'roof:over_chimney_rattle_l' : 'roof:over_chimney_l');
  set(overhead, 8, 1, rattle ? 'roof:over_chimney_rattle_r' : 'roof:over_chimney_r');
  // Herbs, tub, tap, chairs.
  set(detail, 1, 2, 'roof_props:herb_basil'); set(detail, 2, 2, 'roof_props:herb_rosemary'); block(1, 2); block(2, 2);
  set(detail, 2, 7, f('fx.cardigan') ? 'roof_props:chair_cardigan' : 'roof_props:chair_fold'); set(detail, 3, 7, 'roof_props:chair_fold'); block(2, 7); block(3, 7);
  let tubArt = 'tub_empty';
  if (!am) {
    if (f('tub.full')) tubArt = 'tub_full';
    else if (f('tub.plugged')) tubArt = 'tub_plugged';
    const fxTub = f('fx.tub');
    if (fxTub) tubArt = { filling: 'tub_filling', slosh: 'tub_slosh', whirl: 'tub_whirl_wrong', empty: 'tub_empty' }[fxTub];
  }
  set(detail, 3, 4, `tub:${tubArt}_l`); set(detail, 4, 4, `tub:${tubArt}_r`); block(3, 4); block(4, 4);
  set(detail, 2, 4, f('fx.tap') ? 'tub:tap_running' : 'tub:tap'); block(2, 4);
  // Clotheslines on x12 and x15: posts at y3 and y7, sheets between until they move.
  const stage = f('neighbor.stage') || 0;
  const moved = am || f('neighbor.sheetsMoved');
  for (const x of [12, 15]) {
    set(detail, x, 3, 'laundry:post'); set(detail, x, 7, 'laundry:post'); block(x, 3); block(x, 7);
    set(overhead, x, 2, 'laundry:over_post_top_line'); set(overhead, x, 3, 'laundry:over_line');
    const bare = moved || (x === 15 ? stage >= 1 : stage >= 2);
    if (bare) {
      set(overhead, x, 4, 'laundry:over_line'); set(overhead, x, 5, 'laundry:over_line'); set(overhead, x, 6, 'laundry:over_line_s');
    } else {
      set(overhead, x, 4, 'laundry:over_sheet_n'); set(overhead, x, 5, 'laundry:over_sheet_m'); set(overhead, x, 6, 'laundry:over_sheet_s');
      for (const y of [4, 5, 6]) block(x, y);
    }
  }
  // The back line from hook (11,1) to hook (18,1). Row 2 under it is never walkable.
  let line = 'sag';
  if (moved || stage >= 6) line = 'sheets';
  else if (stage >= 3) line = ['prop', 'one', 'two'][stage - 3];
  if (f('fx.backline') === 'swung') line = 'swung';
  const grey = am ? '@grey' : '';
  'abcdefgh'.split('').forEach((c, i) => {
    set(detail, 11 + i, 1, `laundry:backline_${line}_${c}_n${grey}`);
    set(detail, 11 + i, 2, `laundry:backline_${line}_${c}_s${grey}`);
    block(11 + i, 2);
  });
  block(10, 2); // the corner by the low wall, behind the line's first hook

  // ---- Facades (rows 10–11) and the stair at x7 ----
  const cheryl = ['wall_l', 'window_box', 'wall', 'door_top', 'wall', 'window', 'wall_r'];
  const cherylBase = ['wall_base_l', 'wall_base', 'wall_base', 'door_bot', 'wall_base', 'wall_base', 'wall_base_r'];
  cheryl.forEach((fr, x) => {
    set(ground, x, 10, fr.startsWith('door') ? `facade:${fr}` : `buildings:${fr}`);
    set(ground, x, 11, cherylBase[x].startsWith('door') ? `facade:${cherylBase[x]}` : `buildings:${cherylBase[x]}`);
    block(x, 10); block(x, 11, x !== 3); // Cheryl's door (3,11) is the way in
  });
  const nb = ['wall_l', 'wall', 'wall', 'window', 'wall', 'window_box', 'door_top', 'wall', 'window', 'wall', 'window_box', 'wall_r'];
  const nbBase = ['wall_base_l', 'wall_base', 'wall_base', 'wall_base', 'wall_base', 'wall_base', 'door_bot', 'wall_base', 'wall_base', 'wall_base', 'wall_base', 'wall_base_r'];
  nb.forEach((fr, i) => {
    const x = 8 + i;
    set(ground, x, 10, fr.startsWith('door') ? 'facade:door_top@sage' : `buildings:${fr}@white_sage`);
    set(ground, x, 11, nbBase[i].startsWith('door') ? 'facade:door_bot@sage' : `buildings:${nbBase[i]}@white_sage`);
    block(x, 10); block(x, 11);
  });
  set(ground, 7, 8, 'court:stair_head'); set(ground, 7, 9, 'court:stair_cut');
  set(ground, 7, 10, 'court:stair'); set(ground, 7, 11, 'court:stair');
  block(7, 9, false); block(7, 10, false); block(7, 11, false);

  // ---- The court (rows 12–23) ----
  const cob = 'abcde'.split('').map((v) => `court:cobble_${v}`);
  const hash = (x, y) => ((((x * 73856093) ^ (y * 19349663)) >>> 0) % 9973);
  for (let y = 12; y <= 23; y++) for (let x = 1; x <= 18; x++) ground[y][x] = cob[hash(x, y) % cob.length];
  set(ground, 7, 12, 'court:stair_foot');
  for (let y = 12; y <= 23; y++) {
    set(ground, 0, y, 'court:court_wall_w'); set(ground, 19, y, 'court:court_wall_e');
    block(0, y); block(19, y);
  }
  set(ground, 0, 19, 'court:gate_w');
  set(ground, 6, 20, 'court:cobble_drain');
  // Lemon tree: trunk solid, canopy overhead.
  set(detail, 3, 14, 'court_tree:lemon_trunk'); block(3, 14);
  [['nw', 'n', 'ne'], ['w', 'c', 'e'], ['sw', 's', 'se']].forEach((row, j) =>
    row.forEach((p, i) => set(overhead, 2 + i, 13 + j, `court_tree:over_lemon_${p}`)));
  // Chess: the Old Man's stool, the table, Gerald's chair.
  set(detail, 2, 16, 'court_props:stool'); block(2, 16);
  set(detail, 3, 16, am ? 'court_props:chess_slid' : f('oldMan.hasPepperKing') ? 'court_props:chess_pepper' : 'court_props:chess_plug'); block(3, 16);
  set(detail, 4, 16, 'court_props:gerald_chair'); block(4, 16);
  // The well.
  set(detail, 9, 16, 'court_well:well_nw'); set(detail, 10, 16, 'court_well:well_ne');
  set(detail, 9, 17, 'court_well:well_sw'); set(detail, 10, 17, 'court_well:well_se');
  block(9, 16); block(10, 16); block(9, 17); block(10, 17);
  // Flowerpots and the hurdle.
  if (am || f('kid.hasTimer')) {
    set(detail, 12, 17, 'court_tree:flowerpot'); set(detail, 14, 17, 'court_tree:flowerpot_kicked');
  } else {
    set(detail, 12, 17, 'court_tree:hurdle_l'); set(detail, 13, 17, 'court_tree:hurdle_m'); set(detail, 14, 17, 'court_tree:hurdle_r');
    block(13, 17);
  }
  block(12, 17); block(14, 17);
  // Bench and geraniums.
  set(detail, 16, 12, 'court_props:bench_l'); set(detail, 17, 12, 'court_props:bench_r'); block(16, 12); block(17, 12);
  for (const [x, y] of [[1, 21], [18, 21], [1, 23], [2, 23], [18, 23]]) { set(detail, x, y, 'props:pot_geranium'); block(x, y); }
  // Lower rooftops, and the Squeeze at x15–16.
  const lowTop = ['flat_edge_l', 'flat_edge', 'flat_edge', 'flat_edge_r', 'tiles_edge_l', 'tiles_edge', 'tiles_edge', 'tiles_edge', 'tiles_edge_r',
    'flat_edge_l', 'flat_edge', 'flat_edge', 'flat_edge', 'flat_edge_r', 'flat_edge_l', null, null, 'tiles_edge_l', 'tiles_edge', 'tiles_edge_r'];
  const low = ['flat_l', 'flat', 'flat_basin', 'flat_r', 'tiles_l', 'tiles', 'tiles', 'tiles', 'tiles_r',
    'flat_l', 'flat', 'flat_basin', 'flat', 'flat_r', 'flat_l', null, null, 'tiles_l', 'tiles', 'tiles_r'];
  lowTop.forEach((fr, x) => { if (fr) { set(ground, x, 24, `court:low_${fr}`); block(x, 24); } });
  low.forEach((fr, x) => { if (fr) { set(ground, x, 25, `court:low_${fr}`); block(x, 25); } });
  const pianoGone = am || f('piano.gone');
  const sq = pianoGone ? '_scraped' : '';
  set(ground, 15, 24, `court:squeeze_top_l${sq}`); set(ground, 16, 24, `court:squeeze_top_r${sq}`);
  set(ground, 15, 25, `court:squeeze_l${sq}`); set(ground, 16, 25, `court:squeeze_r${sq}`);
  if (!pianoGone) {
    // The piano, wedged at the top of the Squeeze: its top half is overhead.
    set(overhead, 15, 23, 'court_props:over_piano_nw'); set(overhead, 16, 23, 'court_props:over_piano_ne');
    set(detail, 15, 24, 'court_props:piano_sw'); set(detail, 16, 24, 'court_props:piano_se');
    for (const [x, y] of [[15, 23], [16, 23], [15, 24], [16, 24], [15, 25], [16, 25]]) block(x, y);
  }

  return { ground, detail, overhead, solid, step };
}

// ---------------------------------------------------------------------------
// Objects

const dusk = (g) => !morning(g);

// The sheets on the N–S lines, while they hang there.
const sheetsUp = (g) => !morning(g) && !g.flag('neighbor.sheetsMoved');

// The privacy beat (docs/design/01-opening.md, "Tub"): said once, on the third
// look at the tub, or on the first if the plug thread is already done, after
// the look's own line, so the state hints ("Plugged. Now the water.") still come.
async function tubPrivacy(g, n) {
  const plugDone = g.flag('oldMan.hasPepperKing') || g.flag('tub.plugged');
  if (g.flag('n.tub.privacy') || !(n >= 2 || (n === 0 && plugDone))) return;
  g.setFlag('n.tub.privacy', 1);
  await g.describe("In full view of Her Next Door's roof. On Moonshine Night nobody looks at anybody else's roof. That's the rule.", "We've both kept it for thirty-one years. She's very good at not looking. So am I.");
}

const tubLook = async (g) => {
  if (!morning(g)) {
    const n = bump(g, 'tub.looks');
    if (!(g.flag('tub.full') && g.flag('neighbor.sheetsMoved'))) {
      await tubState(g);
      return tubPrivacy(g, n);
    }
  }
  return tubState(g);
};

const tubState = async (g) => {
  if (morning(g)) {
    const n = bump(g, 'tub.morning');
    if (n === 0) await g.describe('Empty. No plug. It went down the drain last night, chain and all. Plugs don\'t do that.');
    else await g.describe("I put my ear to the drain. Water, very far down, and a cold draft coming up. Drains don't draft.");
    return;
  }
  if (g.flag('tub.full')) {
    if (g.flag('neighbor.sheetsMoved')) return moonrise(g);
    const n = bump(g, 'tub.fullNoView');
    if (n === 0) await g.describe("A full tub, cold water, and a fine view of Her Next Door's bedding.");
    else await g.describe("I am not watching the moon come up through somebody's sheets.");
    return;
  }
  if (g.flag('tub.plugged')) return g.describe('Plugged. Now the water.');
  if (g.hasItem('bath_plug')) return g.describe("The plug's in my bag. It would do more good in the tub.");
  if (bump(g, 'tub.noPlug') === 0) {
    await g.describe(
      'My tub. Cast iron, clawfooted, and twice as stubborn as me.',
      'It took four men and a song to get it up here. The song was the hard part.',
      'No plug, though. I lent it to him downstairs. A "chess emergency."',
    );
  } else {
    await g.describe("No plug. He's got it downstairs, playing chess with it.");
  }
};

async function fillTub(g) {
  g.sfx('tap_squeak');
  g.setFlag('fx.tap', 'on');
  await g.wait(0.25);
  g.startLoop('water_pour');
  g.setFlag('fx.tub', 'filling');
  await g.wait(2);
  g.stopLoop('water_pour', 250);
  g.setFlag('fx.tap', null);
  g.setFlag('fx.tub', null);
  g.setFlag('tub.full');
  g.sfx('tub_full');
  await g.wait(0.3);
  await g.describe('Cold as the sea. That\'s how it\'s done. Hot baths are for Tuesdays.');
  if (g.flag('neighbor.sheetsMoved')) await g.describe('Now I sit on the edge of the tub, and wait for the moon.');
  else await g.describe('Now the view.');
}

const tubUse = {
  bath_plug: async (g) => {
    if (morning(g)) return cherylDeclines(g);
    g.takeItem('bath_plug');
    g.sfx('chess_tap');
    g.setFlag('tub.plugged');
    await g.describe('In it goes. Brass, with a little chain to pull it out by. A good plug.');
  },
  pepper_mill: (g) => g.describe('Pepper in the bath. Bold. No.'),
  egg_timer: (g) => g.describe("I don't time my baths. My baths time me."),
  soap: (g) => g.describe(g.flag('tub.full') ? 'Later. Moon first.' : 'Soap comes after the water. Even I know that.'),
  '*': cherylDeclines,
};

// Hotspots don't block anything themselves: the map's tiles under them already
// do, and a solid hotspot would stop the Kid hopping the hurdle.
const hotspot = (o) => ({ solid: false, ...o });

const objects = [
  // ---- Cheryl's roof ----
  { id: 'tub', x: 3, y: 4, w: 2, interact: tubLook, use: tubUse },
  {
    id: 'tap', x: 2, y: 4,
    interact: async (g) => {
      if (morning(g)) return g.describe("I'm not filling it again until I know where the last lot went.");
      if (g.flag('tub.full')) return g.describe("Full. Any more and I'll be bailing.");
      if (!g.flag('tub.plugged')) return g.describe("The roof tap. I'm not filling the tub just to watch it leave.");
      return fillTub(g);
    },
    use: { '*': cherylDeclines },
  },
  {
    id: 'chairs', x: 2, y: 7, w: 2,
    interact: (g) => g.describe(!morning(g) && g.flag('tub.full') && g.flag('neighbor.sheetsMoved')
      ? "Not tonight. Tonight it's the tub."
      : 'Two chairs. I only sit in the one.'),
  },
  { id: 'herbs', x: 1, y: 2, w: 2, look: 'Basil, rosemary, and something that blew into the rosemary pot and refused to leave. I\'ve grown fond of it.' },
  { id: 'chimney', x: 7, y: 2, w: 2, look: 'My chimney pots, in their little tin hats. Hers next door go bareheaded. Make of that what you will.' },
  {
    id: 'roof_edge', x: 0, y: 9, w: 7,
    interact: (g) => g.describe(morning(g)
      ? 'Basins on every roof, still full. Nobody wants to be the first to tip theirs out.'
      : 'Tessel, all the way down to the water. Every roof has a basin on it tonight, waiting for the moon.'),
  },
  {
    id: 'roof_edge_e', x: 8, y: 9, w: 12, lookKey: 'roof_edge',
    interact: (g) => g.describe(morning(g)
      ? 'Basins on every roof, still full. Nobody wants to be the first to tip theirs out.'
      : 'Tessel, all the way down to the water. Every roof has a basin on it tonight, waiting for the moon.'),
  },
  { id: 'parapet_w', x: 0, y: 2, h: 7, lookKey: 'parapets', look: "The next roof over is a long step and a short fall. I've made it before. Not tonight, and not in my good cardigan." },
  { id: 'parapet_n', x: 1, y: 1, w: 9, lookKey: 'parapets', look: "The next roof over is a long step and a short fall. I've made it before. Not tonight, and not in my good cardigan." },
  // The sighting pins (client feedback): one on the low wall, one on the far parapet,
  // lined up on the Gate from the tub. Listed before the wall and the view they sit on.
  ...[[9, 4], [19, 4]].map(([x, y]) => ({
    id: `pin_${x}`, x, y, lookKey: 'pins',
    interact: async (g) => {
      if (morning(g)) return g.describe("Still lined up on the Gate. So it isn't the pins that moved either.");
      if (bump(g, 'pins') === 0) {
        return g.describe('Two bronze pins. One on our wall, one on the far parapet, past her sheets.', 'Sit in the tub and they line up on the Gate. The moon comes up right between them. Every year.');
      }
      return g.describe('The pins. Lined up on the Gate, waiting.');
    },
  })),
  { id: 'low_wall_n', x: 9, y: 2, h: 3, lookKey: 'low_wall', look: 'The wall between my roof and hers. Low enough to talk over. She does.' },
  { id: 'low_wall_s', x: 9, y: 6, h: 3, lookKey: 'low_wall', look: 'The wall between my roof and hers. Low enough to talk over. She does.' },

  // ---- Her Next Door's roof ----
  ...[12, 15].map((x) => ({
    id: `sheets_${x}`, x, y: 3, h: 5, lookKey: 'sheets',
    interact: async (g) => {
      if (!sheetsUp(g)) {
        return g.describe(cycle(g, 'bareLines', ['Her empty lines. Looking at my view instead of blocking it. Much better.']));
      }
      if (g.looks(`sheets_${x}`) === 0 && !g.flag('n.sheetsLooked')) {
        g.setFlag('n.sheetsLooked', 1);
        return g.describe("Her Next Door's sheets. Strung right across my view of the Gate. Every year they creep a little further over.");
      }
      return g.describe('I could unpeg them. I could also move to the mainland. Neither is happening tonight.');
    },
    use: {
      clothes_prop: (g) => g.describe("It's her prop and her sheets. She can do the honors."),
      '*': cherylDeclines,
    },
  })),
  {
    id: 'back_line', x: 10, y: 1, w: 9, h: 2,
    interact: (g) => {
      if (morning(g)) return g.describe("Grey. She's right. They're grey.");
      if (g.flag('neighbor.sheetsMoved')) return g.describe("Her sheets, on the back line where they belong. They're glowing a little in this light. Don't tell her.");
      return g.describe('The back line. Without the prop it sags right into her geraniums.');
    },
    use: {
      clothes_prop: (g) => g.describe("It's her prop and her sheets. She can do the honors."),
      '*': cherylDeclines,
    },
  },
  {
    id: 'view', x: 19, y: 2, h: 7,
    interact: async (g) => {
      if (morning(g)) return g.describe("In daylight the Gate looks the same as ever. So it isn't the Gate that moved.");
      if (bump(g, 'view') === 0) {
        await g.describe('The Gate. A notch in the Rim, as if something took a bite out of the mountains.', 'The moon comes up right in it. Every Moonshine Night. You could set your life by it.');
      } else if (g.flag('neighbor.sheetsMoved')) {
        await g.describe('From my tub I can see it too, now. Good.');
      } else {
        await g.describe('From here I can see the Gate. From my tub, so far, I can see laundry.');
      }
    },
  },

  // ---- Facades ----
  {
    id: 'nb_door', x: 14, y: 10, h: 2,
    interact: (g) => g.describe(morning(g)
      ? "Shut. She's upstairs being disappointed at her sheets."
      : "Her door. She's up on the roof with her sheets, where she always is on Moonshine Night."),
  },
  ...[[1, 10], [5, 10]].map(([x, y]) => ({
    id: `window_${x}`, x, y, h: 2, lookKey: 'windows',
    look: 'Blue shutters. Everyone in Tessel has blue shutters, except Her Next Door, who has green ones and opinions.',
  })),
  // (Not the window at x16: the bench below it leaves nowhere to stand. The others share its line.)
  ...[[11, 10], [13, 10], [18, 10]].map(([x, y]) => ({
    id: `window_${x}`, x, y, h: 2, lookKey: 'nb_windows',
    look: "Her green shutters. She repaints them every spring, in case anyone's forgotten they're green.",
  })),
  {
    // The court's drain: every basin in Tessel empties downhill tonight.
    id: 'drain', x: 6, y: 20, solid: false,
    interact: (g) => g.describe(morning(g)
      ? "The drain's making a noise like somebody breathing through a straw. It never used to make any noise at all."
      : 'The court drain. Tomorrow every basin in Tessel gets tipped out, and it all goes downhill. Somewhere.'),
  },

  // ---- The court ----
  // The whole canopy (2-4, 13-15), which is what people click; the trunk is its middle.
  { id: 'lemon', x: 2, y: 13, w: 3, h: 3, look: 'The lemon tree. It produces three lemons a year and expects applause for each one.' },
  {
    id: 'chess', x: 3, y: 16,
    interact: async (g) => {
      if (morning(g)) return g.describe('Every piece has slid to the lemon-tree end of the board. The pepper king is holding firm.');
      if (g.flag('oldMan.hasPepperKing')) return g.describe("A thimble queen, a cork bishop, and my pepper mill. Gerald's in trouble.");
      if (bump(g, 'chess') === 0) return g.describe("Chess. The Old Man versus the Old Man. He's losing. Both of him.");
      return g.describe('A thimble queen, a cork bishop, and my bath plug, presiding over all of it.');
    },
  },
  { id: 'gerald', x: 4, y: 16, look: "Gerald's chair. Nobody's sat in it for seventeen years. Including Gerald." },
  {
    id: 'well', x: 9, y: 16, w: 2, h: 2,
    interact: async (g) => {
      if (morning(g)) {
        g.sfx('well_breath');
        return g.describe("Cold air is coming up out of the well. It smells like the sea. Wells shouldn't smell like the sea.");
      }
      if (bump(g, 'well') === 0) {
        await g.describe('The old well, with an iron grate over it. Dry for as long as anyone remembers.', 'Drop a pebble and you never hear it land. Children love it. Parents don\'t.');
      } else {
        await g.describe('Drop a pebble and you never hear it land. Children love it. Parents don\'t.');
      }
    },
    use: { '*': (g) => g.describe("I'm not dropping anything down there. I'd only wonder about it.") },
  },
  {
    id: 'hurdle', x: 12, y: 17, w: 3,
    interact: async (g) => {
      if (morning(g) || g.flag('kid.hasTimer')) return g.describe('Two flowerpots. Mine. Slightly kicked.');
      if (bump(g, 'hurdle') === 0) return g.describe("Her Next Door's clothes prop, laid across two of my flowerpots. He's using it as a hurdle.");
      return g.describe("He'd notice if I took it. He notices everything at ankle height.");
    },
  },
  { id: 'bench', x: 16, y: 12, w: 2, look: 'The bench. It soaks up sun all day and holds on to it all evening, like a cat.' },
  ...[[1, 21], [18, 21], [1, 23], [2, 23], [18, 23]].map(([x, y]) => ({
    id: `geranium_${x}_${y}`, x, y, lookKey: 'geraniums',
    look: 'Geraniums. Everyone in Tessel has geraniums. Nobody remembers planting them.',
  })),
  {
    id: 'gate', x: 0, y: 19,
    interact: async (g) => {
      if (morning(g)) return g.describe('Still locked. Still no Pelletiers. Still no ferry, I expect.');
      if (bump(g, 'gate') === 0) {
        await g.describe('The Pelletiers\' gate. Locked. They went across to the mainland on Tuesday.', "The ferry should have brought them back yesterday. It didn't. Nobody's said why.");
      } else {
        await g.describe("The ferry should have brought them back yesterday. It didn't. Nobody's said why.");
      }
    },
  },
  {
    id: 'piano', x: 15, y: 23, w: 2, h: 2, when: (g) => dusk(g) && !g.flag('piano.gone'),
    interact: async (g) => {
      const n = bump(g, 'piano');
      if (n === 0) return g.describe('Someone has tried to bring a piano up the Squeeze. The Squeeze has won.');
      if (n === 1) return g.describe("There's a label. 'No. 9, Cistern Court.' That's me. I didn't order a piano.");
      if (n === 2) return g.describe('A note on the lid: BACK AFTER MOON. DO NOT TOUCH PIANO.');
      g.sfx('piano_flat');
      await g.wait(0.6);
      return g.describe("Middle C. A little flat. I'd know.");
    },
    use: {
      soap: (g) => g.describe("Not now. It isn't going anywhere."),
      '*': cherylDeclines,
    },
  },
  {
    // Morning: the top of the Squeeze, walkable; the exit is the row below.
    id: 'squeeze', x: 15, y: 24, w: 2, solid: false, when: morning,
    // The first look and the first step onto it share the line, and say it once (iso playtest).
    interact: async (g) => {
      if (g.flag('n.squeezeSeen')) return g.describe('Clear, and scraped all the way down.');
      g.setFlag('n.squeezeSeen', 1);
      return g.describe('The Squeeze is clear. There\'s a long scrape down every step, and at the bottom, a lot of surprised geraniums.');
    },
  },
];

// ---------------------------------------------------------------------------
// Characters

// A sheet of the neighbor's frames plus her idle: smoothing a sheet a few
// times, then stepping back to admire it.
const neighborIdle = {
  ...neighbor,
  frames: {
    ...neighbor.frames,
    tend_0: neighbor.frames.smooth_left_0, tend_1: neighbor.frames.smooth_left_1,
    tend_2: neighbor.frames.smooth_left_0, tend_3: neighbor.frames.smooth_left_1,
    tend_4: neighbor.frames.smooth_left_0, tend_5: neighbor.frames.smooth_left_1,
    tend_6: neighbor.frames.admire_left,
  },
  durations: { ...neighbor.durations, tend: [450, 450, 450, 450, 450, 450, 2200] },
};

const oldMan = {
  id: 'old_man', name: 'Old Man', x: 2, y: 16, facing: 'right',
  sprite: { sheet: old_man_seated, frame: 'think_right_0' },
  talkPose: 'talk_right',
  turnToTalk: false,
  interact: async (g, self) => {
    if (morning(g)) {
      if (bump(g, 'oldMan.morning') === 0) {
        return g.say(self, "Piano went down the Squeeze in the night. Took the Pelletiers' geraniums with it.", "Gerald says it was the wind. Gerald's an idiot.");
      }
      if (g.flag('act2.started')) return g.say(self, "Gerald says the board's tilting. I said, then play uphill.");
      return g.say(self, 'Every piece slid to one end of the board. Gerald blames me. I blame the board.');
    }
    if (g.flag('oldMan.hasPepperKing')) {
      return g.say(self, cycle(g, 'oldMan.after', ["The pepper king's doing very well. Gerald hasn't moved in an hour. Terror, I think.", "Check, Gerald. ...No. That's not check. Never mind."]));
    }
    if (!g.flag('oldMan.wantsKing')) {
      g.setFlag('oldMan.wantsKing');
      return g.say(self,
        "Shh. Gerald's thinking.",
        "He's been thinking since Tuesday. Seventeen years, this game, and I'm one move from beating him.",
        "...You're looking at the king. Yes, it's your plug. A very good king. Heavy. Doesn't blow over.",
        "Bring me another king and you can have it back. Black. Tall. Dignified. Gerald's particular.");
    }
    return g.say(self, cycle(g, 'oldMan.repeat', [
      "Black. Tall. Dignified. Gerald won't play against a teaspoon. I've tried.",
      "I could win in one move. I won't. I'd never hear the end of it.",
      "Gerald says it'll come up straight in the Gate again. He says it every year. He's always right. It's maddening.",
      'Shh.',
    ]));
  },
  use: {
    pepper_mill: async (g, self) => {
      g.takeItem('pepper_mill');
      g.sfx('give');
      g.pose(self, 'mill_right');
      g.sfx('pepper_grind');
      await g.wait(1.2);
      g.pose(self, 'talk_right');
      await g.say(self, 'Black. Tall.');
      g.pose(self, 'sneeze_right');
      await g.wait(0.7);
      g.sfx('sneeze');
      await g.wait(0.6);
      g.pose(self, 'talk_right');
      await g.say(self, '...Dignified.');
      g.sfx('chess_tap');
      g.setFlag('oldMan.hasPepperKing');
      await g.say(self, "Gerald says it'll do. Gerald has never been so frightened in his life.", 'Here. Your plug. It was a good king. Never once tried to castle.');
      await getItem(g, 'bath_plug');
    },
    egg_timer: (g, self) => g.say(self, "A clock? Gerald and I don't use clocks. Time's for people who expect to finish."),
    soap: (g, self) => g.say(self, 'I washed on Sunday.'),
    clothes_prop: (g, self) => g.say(self, "That's hers. I'm not getting involved. Gerald got involved once. Never again."),
    bath_plug: (g, self) => g.say(self, "No, no. It's retired. It was a good king. Let it rest."),
    moon_chart: (g, self) => g.say(self, 'Moons. Not my department.'),
    '*': (g, self) => g.say(self, "Not now. Gerald's thinking."),
  },
};

async function moveSheets(g, self) {
  // She takes the sheets off the N–S lines, props up the back line, and hangs them there.
  await g.say(self, "My prop! Is it damp? It's damp. Never mind.");
  g.setSprite(self, { sheet: neighbor });
  await g.moveNpc(self, [16, 4]);
  g.faceNpc(self, 'left');
  g.pose(self, 'smooth_left');
  g.sfx('sheets_flap');
  await g.wait(0.5);
  g.setFlag('neighbor.stage', 1);
  await g.wait(0.3);
  g.pose(self, null);
  await g.moveNpc(self, [13, 4]);
  g.faceNpc(self, 'left');
  g.pose(self, 'smooth_left');
  g.sfx('sheets_flap');
  await g.wait(0.5);
  g.setFlag('neighbor.stage', 2);
  await g.wait(0.3);
  g.pose(self, null);
  await g.moveNpc(self, [14, 3]);
  g.faceNpc(self, 'up');
  g.pose(self, 'reach_up');
  await g.wait(0.4);
  g.setFlag('neighbor.stage', 3);
  g.sfx('chess_tap');
  for (const stage of [4, 5]) {
    await g.wait(0.6);
    g.sfx('sheets_flap');
    g.setFlag('neighbor.stage', stage);
  }
  await g.wait(0.6);
  g.sfx('sheets_flap');
  g.setFlag('neighbor.stage', 6);
  await g.wait(0.5);
  g.pose(self, null);
  await g.moveNpc(self, [16, 3]);
  g.faceNpc(self, 'player');
  // Swap to her after-the-move self, standing in the same spot.
  g.setFlag('neighbor.sheetsMoved');
  g.setFlag('neighbor.stage', null);
  const after = g.npc('neighbor_after');
  g.faceNpc(after, 'player');
  await g.say(after, "There. They'll get more moon back here anyway. Don't say anything.");
}

const neighborTalk = async (g, self) => {
    if (morning(g)) {
      if (bump(g, 'neighbor.morning') === 0) {
        return g.say(self,
          'Grey. GREY. Thirty years of Moonshine Nights and they\'ve come out grey.',
          "The moon wasn't straight on. I don't know where it was, but it wasn't straight on.",
          "And the house LEANED. I've changed bleach. Mother's recipe. There's vinegar in it, and something she wouldn't tell me.");
      }
      if (g.flag('act2.started')) return g.say(self, "I'm rewashing them. I'll moon them again next month. Mother would.");
      return g.say(self, 'Mother would be mortified. Mother would blame the moon. Mother was usually right.');
    }
    if (g.flag('neighbor.sheetsMoved')) {
      return g.say(self, cycle(g, 'neighbor.after', ['Look at them. Drinking it in.', 'Straight up the Gate, it\'ll be. Between your pins, like always. My sheets know.', "Enjoy your bath. Don't splash my whites."]));
    }
    if (!g.flag('neighbor.wantsProp')) {
      g.setFlag('neighbor.wantsProp');
      return g.say(self,
        "Mind the sheets! They're bleaching.",
        "Full moon on Moonshine Night. Whiter than a gull's conscience, my mother used to say.",
        "I know they're across your view. I'd put them on the back line, but it sags into my pots without the prop.",
        'And that sweaty boy downstairs has run off with my prop.');
    }
    return g.say(self, cycle(g, 'neighbor.repeat', [
      "Bring me my prop and I'll move them. I'm not unreasonable. I'm just right.",
      "And it's the striped costume tonight, is it? Good. Not that I'll be looking. Nobody looks. That's the rule.",
      'I can hear you thinking. You think very loudly for a quiet woman.',
    ]));
};

const neighborUse = {
  clothes_prop: async (g, self) => {
    g.takeItem('clothes_prop');
    g.sfx('give');
    await moveSheets(g, self);
  },
  pepper_mill: (g, self) => g.say(self, "Pepper? On Moonshine Night? I've no idea what you're getting at."),
  egg_timer: (g, self) => g.say(self, "I don't need timing. The moon does the timing."),
  soap: (g, self) => g.say(self, "Lovely. Are you saying something? You're saying something."),
  bath_plug: (g, self) => g.say(self, "That's yours. Keep it away from my laundry."),
  moon_chart: (g, self) => g.say(self, "See? Outside the Gate! I knew it wasn't straight on. Not that anyone asked me."),
  // "...and I've told you so" only once she has.
  '*': (g, self) => g.say(self, bump(g, 'neighbor.declined') ? "I've no use for that, and I've told you so." : "I've no use for that."),
};

// Her Next Door appears in three places: among her sheets at dusk (smoothing
// them), by the back line once they've moved, and facing them in the morning.
const neighborDefs = [
  { id: 'neighbor', x: 17, y: 5, facing: 'left', sprite: { sheet: neighborIdle, frame: 'tend' }, when: (g) => !morning(g) && !g.flag('neighbor.sheetsMoved') },
  { id: 'neighbor_after', x: 16, y: 3, facing: 'down', sprite: { sheet: neighbor }, behavior: { type: 'face', range: 3 }, when: (g) => !morning(g) && !!g.flag('neighbor.sheetsMoved') },
  { id: 'neighbor_morning', x: 14, y: 3, facing: 'up', sprite: { sheet: neighbor }, when: morning },
].map((d) => ({
  ...d,
  name: 'Neighbor',
  interact: talking(neighbor, neighborTalk),
  use: Object.fromEntries(Object.entries(neighborUse).map(([k, fn]) => [k, talking(neighbor, fn)])),
}));

// The Kid's lap of the well, with extra waypoints either side of the hurdle
// so he can hop it.
const LAP = [[7, 14], [13, 14], [13, 16], [13, 18], [13, 19], [7, 19]];
let laps = 0;

// Sweat flies off him at the corners.
function sweat(g, self) {
  const side = self.facing === 'left' ? 0.35 : -0.35;
  g.spawnEffect({ sprite: { sheet: fx, frame: 'sweat_drop' }, path: [[self.x, self.y - 1.1], [self.x + side, self.y - 1.3]], speed: 0.35, layer: 'top' });
}

function onKidWaypoint(g, self, next) {
  // `next` is the index he's now heading for.
  const reached = (next + LAP.length - 1) % LAP.length;
  if ([0, 1, 4, 5].includes(reached)) sweat(g, self);
  if (reached === 2 && !g.flag('kid.hasTimer')) {
    g.pose(self, 'hop');
    g.sfx('kid_hop', { at: self });
  } else if (reached === 3) {
    if (self.pose === 'hop') g.pose(self, null);
  } else if (reached === 0 && g.flag('kid.hasTimer')) {
    laps++;
    if (laps % 3 === 0) {
      g.sfx('timer_ding', { at: self });
      g.pose(self, 'arms_up');
      self.patrolWait = 70;
      setTimeout(() => { if (self.pose === 'arms_up') self.setPose(null); }, 1150);
    }
  }
}

const kidNpc = {
  id: 'kid', name: 'Sweaty Kid', x: 7, y: 14, facing: 'right',
  sprite: { sheet: sweaty_kid, walk: [1, 2, 3, 4] },
  stepTicks: 13,
  when: (g) => !morning(g),
  behavior: { type: 'patrol', route: LAP, ghost: true, stopNear: 2, nearPose: 'jog', onWaypoint: onKidWaypoint },
  talkPose: 'jog',
  interact: async (g, self) => {
    if (g.flag('kid.hasTimer')) {
      return g.say(self, cycle(g, 'kid.after', ['I set it to five minutes and ran till it dinged. I won! Against the EGG!', 'Three minutes forty! ...Is that good? It feels good.']));
    }
    if (!g.flag('kid.wantsTimer')) {
      g.setFlag('kid.wantsTimer');
      await g.say(self,
        "Can't stop! Stair Race in three days. I'm gonna win it by SO much.",
        "I'm doing laps. Forty laps. Or thirty. I keep losing count, because the well's round.",
        "If I had a timer I'd know if I was getting faster. Mum says I'm only getting sweatier.",
        "The prop? It's my hurdle. Watch!");
      await kidShowsOff(g, self);
      return g.say(self, 'Did you see? I was in the AIR.');
    }
    return g.say(self, cycle(g, 'kid.repeat', ['Need a timer! Something that ticks!', 'I just did a lap in... about... a while.']));
  },
  use: {
    egg_timer: async (g, self) => {
      g.takeItem('egg_timer');
      g.sfx('give');
      g.startLoop('timer_tick');
      await g.say(self, "Whoa. Is that a TIMER? It ticks! It's got a BELL!");
      g.stopLoop('timer_tick', 200);
      g.sfx('timer_ding');
      await g.say(self, "Okay. Okay okay okay. You can have the hurdle. Hurdles are for babies. I'm doing pure speed now.");
      await kidFetchesProp(g, self);
      await getItem(g, 'clothes_prop');
    },
    pepper_mill: (g, self) => g.say(self, "I don't need pepper. I need SPEED."),
    soap: (g, self) => g.say(self, 'I had a bath last WEEK.'),
    bath_plug: (g, self) => g.say(self, "That's a plug. ...Why are you showing me a plug?"),
    clothes_prop: (g, self) => g.say(self, 'Keep it! Hurdles are for babies.'),
    '*': (g, self) => g.say(self, "Can't carry it! Aerodynamics!"),
  },
};

// Puts the Kid back on his lap at the waypoint nearest to where he is.
function rejoinLap(g, self) {
  let best = 0, bestD = Infinity;
  LAP.forEach(([x, y], i) => {
    const d = Math.abs(x - self.x) + Math.abs(y - self.y);
    if (d < bestD) { bestD = d; best = i; }
  });
  return best;
}

async function kidShowsOff(g, self) {
  const home = [self.x, self.y];
  g.pose(self, null);
  await g.moveNpc(self, [13, 15], { speed: 12 });
  g.faceNpc(self, 'down');
  await g.wait(0.2);
  await g.moveNpc(self, 'd', { speed: 10 });
  g.pose(self, 'hop');
  g.sfx('kid_hop');
  await g.moveNpc(self, 'd d', { speed: 10, ghost: true });
  g.pose(self, null);
  await g.moveNpc(self, home, { speed: 12 });
  g.faceNpc(self, 'player');
  g.pose(self, 'jog');
  self.patrolIdx = rejoinLap(g, self);
}

async function kidFetchesProp(g, self) {
  const home = [self.x, self.y];
  g.pose(self, null);
  await g.moveNpc(self, [13, 16], { speed: 12 });
  g.faceNpc(self, 'down');
  g.pose(self, 'jog');
  await g.wait(0.3);
  g.setFlag('kid.hasTimer'); // the hurdle comes apart
  await g.wait(0.2);
  g.pose(self, null);
  await g.moveNpc(self, home, { speed: 12 });
  g.faceNpc(self, 'player');
  g.pose(self, 'jog');
  self.patrolIdx = rejoinLap(g, self);
}

// In the morning he jogs in place by the Squeeze, waiting to run it.
const kidMorning = {
  id: 'kid_morning', name: 'Sweaty Kid', x: 15, y: 22, facing: 'down',
  sprite: { sheet: sweaty_kid, walk: [1, 2, 3, 4] },
  behavior: { type: 'face', range: 3 },
  when: (g) => morning(g) && !g.flag('act2.started'), // in Act 2 he's on the Hundred Steps
  interact: async (g, self) => {
    if (bump(g, 'kid.morning') === 0) {
      return g.say(self, 'Did you see the well? It BREATHED. I put my face over it and it breathed on me.', "It smelled like fish. Old fish. Like the bottom of the sea's armpit.");
    }
    return g.say(self, "Squeeze is clear! I'm gonna run it, down AND up. Time me! ...Oh. I've got the egg.");
  },
  use: {
    moon_chart: (g, self) => g.say(self, "Is that a race map? ...It's just ticks. Boring ticks."),
    soap: (g, self) => g.say(self, 'I had a bath last WEEK.'),
    '*': (g, self) => g.say(self, "Can't carry it! Aerodynamics!"),
  },
};

const cat = {
  id: 'cat',
  x: 17, y: 19,
  sprite: { sheet: props, frame: 'cat' },
  when: dusk,
  look: "The Pelletiers' cat. Minding the house while they're away. Badly.",
};

const catMorning = {
  id: 'cat_morning', x: 12, y: 12,
  sprite: { sheet: props, frame: 'cat' },
  when: morning,
  interact: async (g) => {
    if (bump(g, 'cat.morning') === 0) return g.describe("She's moved to the uphill side of the court, staring at the well.", "I didn't know the court had an uphill side.");
    return g.describe('Still staring at the well. So am I, now.');
  },
};

const swifts = [0, 1].map((i) => ({
  id: `swift_${i}`, x: 0, y: i, solid: false, visible: false, shadow: false,
  sprite: { sheet: fx, frame: 'swift' },
  when: dusk,
}));

// ---------------------------------------------------------------------------

// Set by src/content/index.js: where the Squeeze leads in the morning ('lamp_street'
// once Act 2's maps are registered), or null for the end-of-slice card.
export const opening = { squeezeTo: null };

export const courtMap = composedMap(compose, {
  id: 'cistern_court',
  name: 'Cistern Court',
  tileset: openingTiles,
  lighting: (g) => (morning(g) ? 'day' : 'dusk'),
  spawn: [3, 6],
  exits: [
    { x: 3, y: 11, to: 'flat', at: [5, 7], facing: 'up' },
    // Down the Squeeze in the morning: to Lamp Street when Act 2 is in the game,
    // else the end-of-slice card.
    {
      x: 15, y: 25, w: 2, when: morning,
      run: async (g) => {
        if (!g.flag('act2.started')) await g.think('Down, then.'); // only the first time out
        if (opening.squeezeTo) return g.changeMap(opening.squeezeTo, 3 + g.player.x - 15, 1, 'down');
        return endOfSlice(g);
      },
    },
  ],
  triggers: [
    {
      // Walking down into the piano.
      x: 15, y: 22, w: 2,
      when: (g) => !morning(g) && g.player.facing === 'down',
      run: (g) => g.describe("I'm not climbing over a piano I didn't order. Besides, I'm not going anywhere tonight."),
    },
    {
      // The first step onto the cleared Squeeze.
      x: 15, y: 24, w: 2, stop: false,
      when: (g) => morning(g) && !g.flag('n.squeezeSeen'),
      run: async (g) => {
        g.setFlag('n.squeezeSeen', 1);
        await g.describe('The Squeeze is clear. There\'s a long scrape down every step, and at the bottom, a lot of surprised geraniums.');
      },
    },
  ],
  step: 'step_stone',
  onEnter: async (g) => {
    g.playMusic(morning(g) ? 'morning_after' : 'cistern_court');
    // Only while he's here: later acts move him on, and their layers hide him.
    if (morning(g)) { try { g.pose('kid_morning', 'jog'); } catch { /* not on the map in this act */ } }
  },
  ambient: [
    // The Old Man reaches out, moves a piece, thinks better of it, and moves it back.
    { every: [6, 11], run: oldManFidgets },
    // The Kid's feet patter as he runs (when he's near enough to hear).
    {
      every: [0.5, 0.55], when: (g) => !morning(g),
      run: (g) => {
        const k = g.npc('kid');
        if (k.moving) g.sfx('kid_patter', { at: k, range: 9 });
      },
    },
    // In the morning the well breathes: a cold mist every few seconds.
    {
      every: [5, 8], when: morning,
      run: (g) => {
        g.sfx('well_breath');
        g.spawnEffect({ sprite: { sheet: fx_mist, frame: 'mist' }, at: [9.5, 16.5], seconds: 1.8, layer: 'top' });
      },
    },
  ],
  entities: [...objects.map(hotspot), oldMan, ...neighborDefs, kidNpc, kidMorning, cat, catMorning, ...swifts],
});

function oldManFidgets(g) {
  const old = g.npc('old_man');
  if (old.pose) return;
  g.pose(old, 'think_right_1');
  g.sfx('chess_tap', { at: old });
  setTimeout(() => {
    if (old.pose !== 'think_right_1') return;
    old.setPose(null);
    g.sfx('chess_tap', { at: old });
  }, 900);
}

export async function flySwifts(g) {
  const run = async (id, y, delay) => {
    await g.wait(delay);
    g.place(id, -1, y, 'right');
    g.show(id);
    await g.moveNpc(id, Array(22).fill('r'), { ghost: true, speed: 5 });
    g.hide(id);
  };
  run('swift_0', 0, 0);
  run('swift_1', 1, 0.35);
}

// The end of the slice: a title card, then back to the title screen.
function endCard() {
  let title = null;
  return (ctx) => {
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, 256, 224);
    if (!title) {
      title = document.createElement('canvas');
      title.width = measure('Moonshine') + 2;
      title.height = 11;
      drawText(title.getContext('2d'), 'Moonshine', 0, 0, { color: 'ui_select', shadow: 'ui_cheryl_box' });
    }
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(title, Math.round(128 - title.width), 72, title.width * 2, title.height * 2);
    drawTextCentered(ctx, 'End of the opening.', 128, 118, { color: 'ui_text' });
    drawTextCentered(ctx, 'Tessel continues soon.', 128, 132, { color: 'ui_text' });
  };
}

export async function endOfSlice(g) {
  g.stopMusic(1500);
  await g.fade('out', 1.5);
  g.place('player', 15, 23, 'up');
  g.setFlag('act1.done');
  await g.showPicture(endCard(), { fade: 0 });
  await g.fade('in', 1);
  await g.wait(4);
  await g.fade('out', 1);
  await g.toTitle();
}
