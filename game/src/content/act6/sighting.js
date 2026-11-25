// The Sighting Room (16 × 13), under Cistern Court: the Basin, the trim
// wheel, the lift, the master stop, and the sighting log. From
// docs/design/06-moon-in-the-bowl.md ("The Sighting Room", "Moon true",
// "The master stop and the refill", "The bath").
//
//      x 0         1
//        0123456789012345
//  y  0  XXXXXXXXXXXXXXXX
//     1  XX#WW#LL#####XXX   WW the trim wheel (3-4, 1-2); LL the lift (6-7, 1-2)
//     2  XX#WW#LL#####XXX
//     3  XX............XX
//     4  X.............sX   s the sighting log (14, 4)
//     5  X......BB......X   BB the Basin (7-8, 5-6); the moonlight falls on it
//     6  X......BBr.....X   r the master stop (9, 6)
//     7  X..............X
//    10  XX............XX
//    11  XXX....::....XXX
//    12  XXXXXXX::XXXXXXX   south → the Long Keel

import { composedMap, blankGrid } from '../opening/grid.js';
import { layout } from '../act2/common.js';
import { act6Tiles } from './tiles.js';
import { master_stop } from '../../art/act6_under.js';
import { disc_fx } from '../../art/act5_sprites.js';
import { bath_ripple } from '../../art/act6_sprites.js';
import { basinView, bump, cherylDeclines } from './common.js';
import { refillMontage } from './montage.js';
import { dawn } from './dawn.js';

const W = 16, H = 13;
const Q = [['nw', 0, 0], ['ne', 1, 0], ['sw', 0, 1], ['se', 1, 1]];

// The Basin's look for the current state (frames in docs/art-act6.md).
function basinState(g) {
  if (g.flag('moon.true')) return 'lit';
  if (g.flag('basin.plugged')) return 'full';
  return g.flag('got.plug') ? 'dry' : 'dry_plug';
}

function compose(g) {
  const L = layout(W, H, blankGrid);
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) L.set('ground', x, y, 'hull:top', true);
  // The north wall, x2-12, ending in chamfers.
  for (let x = 2; x <= 12; x++) {
    L.set('ground', x, 1, `hull:${x % 2 ? 'face_top' : 'face_top_b'}`, true);
    L.set('ground', x, 2, `hull:${x % 2 ? 'face_base' : 'face_base_b'}`, true);
  }
  L.set('ground', 2, 1, 'hull:face_top_end_l', true); L.set('ground', 2, 2, 'hull:face_base_end_l', true);
  L.set('ground', 12, 1, 'hull:face_top_end_r', true); L.set('ground', 12, 2, 'hull:face_base_end_r', true);
  // The floor, eight-sided: the corners are chamfered walls.
  const rows = { 3: [2, 12], 4: [2, 13], 5: [1, 14], 6: [1, 14], 7: [1, 14], 8: [1, 14], 9: [2, 13], 10: [3, 12], 11: [4, 11], 12: [7, 8] };
  for (const [y, [x0, x1]] of Object.entries(rows)) {
    for (let x = x0; x <= x1; x++) {
      const h = (x * 73 + +y * 151) % 23;
      L.set('ground', x, +y, `hull:${h === 0 ? 'floor_glyph' : h === 9 ? 'floor_worn' : 'floor'}`, false);
    }
  }
  for (const [x, y, c] of [[13, 3, 'ne'], [1, 4, 'nw'], [14, 4, 'ne'], [1, 9, 'sw'], [14, 9, 'se'], [2, 10, 'sw'], [13, 10, 'se'], [3, 11, 'sw'], [12, 11, 'se']]) {
    L.set('ground', x, y, `hull:top_chamfer_${c}`, true);
  }
  // The trim wheel (3-4, 1-2) and the lift (6-7, 1-2), in the north wall.
  const turning = g.flag('fx.trim');
  const liftOpen = g.flag('fx.liftOpen');
  for (const [q, dx, dy] of Q) {
    L.set('ground', 3 + dx, 1 + dy, `sight_wall:${turning ? 'trim' : 'trim_still'}_${q}`, true);
    L.set('ground', 6 + dx, 1 + dy, `sight_wall:${liftOpen ? 'lift_open' : 'lift_closed'}_${q}`, true);
  }
  // The Basin (7-8, 5-6), and the moonlight falling down the shaft onto it.
  const fill = g.flag('fx.basinFill');
  for (const [q, dx, dy] of Q) {
    const f = fill != null ? `basin_fill_${q}_${fill}` : `basin_${basinState(g)}_${q}`;
    L.set('detail', 7 + dx, 5 + dy, `basin:${f}`, true);
  }
  for (let r = 0; r < 4; r++) for (let c = 0; c < 2; c++) L.set('overhead', 7 + c, 2 + r, `moonbeam:over_moon_x${c}y${r}`);
  // The sighting log on its stand (14, 4), and Cheryl's shoes by the Basin while she bathes.
  L.set('detail', 14, 4, 'sight_props:log_stand', true);
  if (g.flag('fx.shoes')) L.set('detail', 6, 6, 'sight_props:shoes', true);
  // Light pools under the lamps once every lamp Downstairs blazes.
  if (g.flag('moon.true')) for (const x of [2, 12]) L.set('ground', x, 3, 'hull:floor_glow', false);
  return L.done();
}

// ---------------------------------------------------------------------------
// The Basin

async function showBasin(g, v, { hold = 0.6 } = {}) {
  await g.showPicture(v.draw, { fade: 0.6 });
  await g.wait(hold);
}

async function takePlug(g) {
  await g.think('My plug.');
  await g.describe(
    'My plug. Chain and all. It went down my drain on Moonshine Night and fell all the way here.',
    'Of course it did. Everything in this town goes down eventually.',
  );
  g.sfx('plug_glint', { volume: 0.6 });
  g.setFlag('got.plug');
  await g.giveItem('found_plug');
}

async function plugBasin(g) {
  g.takeItem('found_plug');
  await g.describe("The Basin's own stopper went missing centuries ago. Mine fits.", 'Plugs are plugs.');
  g.setFlag('basin.plugged');
  // Water wells up through the grille, slow and clean, over about four seconds.
  g.sfx('basin_fill');
  for (let i = 0; i < 4; i++) {
    g.setFlag('fx.basinFill', i);
    await g.wait(i === 3 ? 1.6 : 0.9);
  }
  g.setFlag('fx.basinFill', null);
  g.sfx('moon_settle');
  await g.wait(1);
  // The Basin view: the moonlight breaks on the water and settles.
  const v = basinView(g, { step: 0 });
  await showBasin(g, v, { hold: 0.2 });
  v.shimmer = { at: v.now };
  await g.wait(2.8);
  await g.describe("The moon, in the bowl. And the Gate. And the moon's not in the Gate.", 'Moon in the Gate and moon in the bowl.');
  await g.hidePicture({ fade: 0.6 });
}

async function basinInteract(g) {
  if (g.flag('sisters.asleep') && !g.flag('bathed')) return bath(g);
  if (g.flag('bathed')) {
    if (bump(g, 'basin.after') === 0) {
      return g.describe('Full, still, with the moon in it. My plug in the bottom.', "I'm leaving it. It's the Basin's plug now. Moon in the bowl.");
    }
    return g.describe(bump(g, 'basin.after2') % 2 ? 'Full, still, with the moon in it. My plug in the bottom.' : 'No. It belongs here. I\'ll find another one.');
  }
  if (!g.flag('got.plug')) return takePlug(g);
  if (!g.flag('basin.plugged')) {
    return g.describe('A stone bowl, big enough to sit in, at the bottom of the shaft. A plughole in the middle, and no stopper. Long gone.');
  }
  // Full: look into it (the Basin view at the current trim).
  const v = basinView(g, { step: g.flag('trim') || 0 });
  await showBasin(g, v);
  if (g.flag('moon.true')) {
    v.rimAt = -10000;
    await g.describe(g.flag('sisters.asleep') ? 'Moon in the Gate, and moon in the bowl. Still.' : 'Moon in the Gate, and moon in the bowl.');
  } else {
    await g.describe(['The moon, off to the right of the Gate.', 'Closer to the Gate. Not there yet.', "Dead in the Gate. But it isn't Moonshine Night. 'Allow two fingers.'"][g.flag('trim') || 0]);
  }
  await g.hidePicture({ fade: 0.6 });
}

const basinUse = {
  found_plug: async (g) => {
    if (g.flag('basin.plugged')) return g.describe('No. Leave it be.');
    return plugBasin(g);
  },
  crowbar: (g) => g.describe('No. Not here.'),
  // The disc is Act 3's item; matched by id here so this map doesn't depend on it.
  '*': (g, self, item) => {
    if (item === 'moonglass_disc') return g.describe("It doesn't need my light. It has the moon.");
    return g.flag('basin.plugged') ? g.describe('No. Leave it be.') : cherylDeclines(g);
  },
};

// ---------------------------------------------------------------------------
// The trim wheel and moon true

async function trimWheel(g) {
  if (!g.flag('basin.plugged')) {
    return g.describe('A bronze wheel, marked with a moon and an arrow. It won\'t turn. It wants something to look at first.');
  }
  if (g.flag('moon.true')) return g.describe("It won't go any further. It knows.");
  const step = (g.flag('trim') || 0) + 1;
  // Cheryl hauls the wheel round a notch: a deep creak, and the whole hull swings a hair on its chain.
  g.facePlayer('up');
  g.pose('player', 'wheel_up');
  g.setFlag('fx.trim', true);
  g.sfx('trim_turn');
  g.shake(1, 0.8);
  await g.wait(1.1);
  g.setFlag('fx.trim', null);
  g.pose('player', null);
  g.setFlag('trim', step);
  await g.wait(0.2);
  const v = basinView(g, { step: step - 1 });
  await showBasin(g, v, { hold: 0.4 });
  v.moveTo(step);
  await g.wait(v.glideMs / 1000 + 0.4);
  if (step === 1) {
    await g.describe('Closer.');
  } else if (step === 2) {
    await g.describe('Dead in the Gate. Like every Moonshine Night of my life.', "But it isn't Moonshine Night. It's two nights past full. 'Allow two fingers.'");
  } else {
    await moonTrue(g, v);
    return;
  }
  await g.hidePicture({ fade: 0.6 });
}

async function moonTrue(g, v) {
  // 1-2. The water goes perfectly still; the moonglass rim lights all the way round.
  await g.wait(0.8);
  g.sfx('rim_light');
  v.rimAt = v.now;
  await g.wait(2.2);
  // 3-4. Back in the room: the lamps flare; down the Long Keel, lamp after lamp. Wrongness 0.
  g.setFlag('moon.true');
  g.setWrongness(0);
  await g.hidePicture({ fade: 0 });
  g.playCue('moon_true', { resume: false });
  g.sfx('lamps_blaze');
  await g.wait(3.5);
  // 5. The master stop unlocks with a clack and rises an inch.
  g.sfx('master_stop', { volume: 0.7 });
  await g.tween('master_stop', { offset: [0, -2], seconds: 0.3 });
  await g.tween('master_stop', { offset: [0, 0], seconds: 0 });
  await g.wait(0.8);
  // 6-7.
  await g.describe('Moon in the Gate, and moon in the bowl.');
  await g.describe('And the greedy one. Put her back to bed.');
}

// ---------------------------------------------------------------------------
// The master stop

async function masterStop(g) {
  if (g.flag('sisters.asleep')) return g.describe(bump(g, 'stop.after') % 2 ? 'Down. Asleep. Leave her be.' : 'Pulled. The Middle Sister is asleep, and so is the rest of us, nearly.');
  if (!g.flag('moon.true')) {
    return g.describe('A bronze rod in the floor, with the three-bars emblem, and the middle bar picked out. Locked.');
  }
  // Pull: Cheryl heaves the rod up.
  g.facePlayer('master_stop');
  g.pose('player', 'heave_up');
  await g.wait(0.7);
  g.setFlag('sisters.asleep');
  g.pose('player', null);
  // 1. Far off, a cough, and a thump that stops. Then silence.
  g.sfx('sisters_sleep');
  await g.wait(2.2);
  // 2. The room eases down, gently.
  await g.tilt(0, 1, 0.6);
  await g.tilt(0, 0, 2);
  await g.wait(0.6);
  // 3.
  await g.describe('There. Asleep.', "And we're settling. Down to where we belong.");
  // 4. The refill montage.
  await refillMontage(g);
  // 5. Back to the Sighting Room: quiet.
  await g.wait(1.2);
}

// ---------------------------------------------------------------------------
// The sighting log: one entry per look, newest first; after moon true, Cheryl signs it.

async function sightingLog(g) {
  const n = bump(g, 'log.read');
  if (g.flag('moon.true') && !g.flag('log.signed') && n >= 1) {
    g.setFlag('log.signed');
    g.sfx('pen_scratch');
    return g.describe(
      'There\'s a stub of pencil in the stand. Pencils keep.',
      "I write under his: 'Rang at the turn. Moon true in the bowl. All well.' And a C.",
      'Somebody should.',
    );
  }
  if (g.flag('log.signed')) return g.describe("'Rang at the turn. Moon true in the bowl. All well.' C. Under a B, three hundred years later.");
  const entries = [
    "'Moon true in the bowl.' Signed with a B. The last entry. Three hundred years ago.",
    "'Past full: allow two fingers. Past half: allow a hand.' A rule, written large, for anyone who comes after.",
    "Pages of it. 'Moon true. Moon true. A finger west; corrected. Moon true.'",
  ];
  return g.describe(entries[n % entries.length]);
}

// ---------------------------------------------------------------------------
// The bath (docs/design/06-moon-in-the-bowl.md, "The bath")

export async function bath(g) {
  // 1.
  await g.describe("The best bath I'll ever have, and I didn't bring a towel.");
  // 2. Shoes off, side by side; in she climbs.
  await g.movePlayer([6, 7]);
  g.facePlayer('up');
  await g.movePlayer('u'); // beside the Basin, on the tile where her shoes will sit
  g.facePlayer('down');
  g.stopMusic(1500);
  g.pose('player', 'shoes_down_0');
  await g.wait(0.9);
  g.pose('player', 'shoes_down_1');
  await g.wait(0.9);
  g.pose('player', 'shoes_down_0');
  await g.wait(0.6);
  g.setFlag('fx.shoes', true);
  g.place('player', 7, 6, 'down');
  g.sfx('bath_enter');
  g.player.def.shadow = false;
  g.pose('player', 'bath_down_0', { offset: [0, -4] });
  const ripple = g.spawnEffect({ sprite: { sheet: bath_ripple, frame: 'bath_ripple' }, at: [7, 6], offset: [0, 1], seconds: 6, layer: 'top' });
  await g.wait(1.2);
  // 3. The music box: the skipping rhyme, slowly, in tune.
  g.playMusic('bath');
  await g.wait(2.5);
  g.pose('player', 'bath_down_1', { offset: [0, -4] });
  await g.wait(1.5);
  // 4. The Basin view, with her reflection at the edge.
  const v = basinView(g, { step: 3 });
  v.rimAt = -10000;
  v.bath = true;
  g.sfx('ripples', { volume: 0.6 });
  await g.showPicture(v.draw, { fade: 1.2 });
  await g.wait(2);
  // 5. The game's last thoughts.
  await g.think('The best bath of my life is in a stone bowl at the bottom of the city, with my own plug.');
  await g.think('Nobody will ever know.');
  await g.think('Most of the best things, nobody ever knows.');
  // 6. Hold, then Later.
  await g.wait(3);
  g.stopMusic(2500);
  await g.fade('out', 2);
  await ripple;
  await g.hidePicture({ fade: 0 });
  await g.card('Later.', 2.5);
  // 7. Cheryl beside the Basin, shoes on, hair a little damp.
  g.setFlag('fx.shoes', null);
  g.pose('player', null);
  g.player.def.shadow = undefined;
  g.place('player', 7, 7, 'up');
  g.setFlag('bathed');
  await g.fade('in', 1.5);
  g.playMusic('keel');
}

// ---------------------------------------------------------------------------
// The lift

async function lift(g) {
  if (!g.flag('bathed')) {
    if (bump(g, 'lift.early') === 0) return g.describe("A bronze cage in a shaft of its own, with a counterweight. 'Up,' says the arrow.", 'Not yet. Not with the moon off to one side like that.');
    return g.describe(g.flag('moon.true') ? "'Up.' Not yet." : "'Up,' says the arrow. Not yet.");
  }
  await g.describe("A bronze cage in a shaft of its own, with a counterweight. 'Up,' says the arrow.");
  const i = await g.choose('Go up?', ['Yes', 'Not yet']);
  if (i !== 0) return;
  await dawn(g);
}

// ---------------------------------------------------------------------------

const objects = [
  { id: 'basin', x: 7, y: 5, w: 2, h: 2, kind: 'object', interact: basinInteract, use: basinUse },
  { id: 'trim_wheel', x: 3, y: 1, w: 2, h: 2, interact: trimWheel },
  { id: 'lift', x: 6, y: 1, w: 2, h: 2, interact: lift },
  { id: 'sighting_log', x: 14, y: 4, interact: sightingLog },
  {
    id: 'master_stop', x: 9, y: 6, kind: 'object',
    sprite: (g) => ({ sheet: master_stop, frame: g.flag('sisters.asleep') ? 'stop_pulled' : g.flag('moon.true') ? 'stop_risen' : 'stop_locked' }),
    interact: masterStop,
  },
  {
    id: 'shaft', x: 7, y: 2, w: 2, solid: false,
    looks: [['Straight up. All the way up to my roof. To my tub.', "I've been bathing on top of this for thirty-one years."], 'Straight up. Moonlight all the way down.'],
  },
  { id: 'walls', x: 9, y: 1, w: 4, h: 2, look: 'Eight walls, plain slate. Nothing on them but the wheel and the lift. The Basin is the point.' },
].map((o) => ({ solid: true, ...o, use: { crowbar: (g) => g.describe('No. Not here.'), '*': cherylDeclines, ...(o.use || {}) } }));

// The glint at the bottom of the dry Basin, every few seconds until the plug is taken.
const glint = {
  every: [2.2, 3.4],
  when: (g) => !g.flag('got.plug'),
  run: (g) => {
    g.spawnEffect({ sprite: { sheet: disc_fx, frame: 'disc_flare' }, at: [7.5, 5.6], seconds: 0.8, layer: 'top' });
    g.sfx('plug_glint', { at: [7, 5], range: 10, volume: 0.7 });
  },
};

export const sightingMap = composedMap(compose, {
  id: 'sighting_room',
  name: 'The Sighting Room',
  tileset: act6Tiles,
  music: null,
  dark: (g) => (g.flag('moon.true') ? 0.35 : 0.6),
  playerLight: { radius: 3, color: 'relic_cyan' },
  lights: [
    { x: 7.5, y: 5, radius: 3, color: 'moon_light' },
    { x: 7.5, y: 5.5, radius: 4, color: 'relic_cyan', when: (g) => !!g.flag('moon.true') },
    { x: 2, y: 2, radius: 4, color: 'moonglass_light', when: (g) => !!g.flag('moon.true') },
    { x: 12, y: 2, radius: 4, color: 'moonglass_light', when: (g) => !!g.flag('moon.true') },
  ],
  ambience: ['hull', 'drips'],
  step: 'step_hullstone',
  spawn: [7, 10],
  exits: [0, 1].map((i) => ({ x: 7 + i, y: 12, to: 'long_keel', at: [1, 3 + i], facing: 'right' })),
  entities: objects,
  ambient: [glint],
  onEnter: async (g) => {
    if (g.flag('n.sightEntered')) {
      if (g.flag('bathed') || g.flag('moon.true')) g.playMusic('keel');
      return;
    }
    g.setFlag('n.sightEntered', 1);
    // The music falls away to silence; a column of moonlight; something glints.
    g.stopMusic(1500);
    await g.wait(1.4);
    glint.run(g);
    await g.wait(1);
  },
});
