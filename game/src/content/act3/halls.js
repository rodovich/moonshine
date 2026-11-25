// The Lamp Halls (32 × 14) and the Keepers' Bunk Room (10 × 7).
// From docs/design/03-downstairs.md.
//
//   Lamp Halls
//      x 0         1         2         3
//        01234567890123456789012345678901
//  y  0  XXXXXXXXXXXXXXXXXXXXXXXXX::XXXXX   :: the passage north → Chart Room (25-26, 0)
//     2  XXXXXXXXXXXXXXXXXXXXXXXX#~~PXXXX   ~~ flooded (25-26, 1-6); P the gushing pipe (27, 2)
//     4  X#######q#############WW#~~#XXXX   q the counterweighted ladder (8, 4-5)
//     5  X##CC###QL###DD###L#T#WW#~~#XXXX   CC chute mouth; L lamps (9, 18); DD bunk room door;
//     6  X........................~~..XXX   T speaking tube (20); WW the valve wheel (22-23, 4-5)
//    10  X............................XXX
//    11  XXXXXXXXXXXXXXXXX~~XXXXXXXXXXXXX   ~~ the drowned corridor (17-18, 11-13)
//
//   Bunk Room
//        0123456789
//  y  0  X#L#II#RRX   (upper wall row) L lamp (2); II duty roster (4-5); RR tool rack (7-8)
//     1  X########X   (lower wall row: the interaction tiles)
//     3  XBB....BBX   BB stone bunks
//     4  X..c.....X   c the table and cup (3, 4)
//     6  XXXX..XXXX   back to the Lamp Halls (4-5, 6)

import { composedMap } from '../opening/grid.js';
import { act3Tiles } from './tiles.js';
import { ds_rod, ds_rod_short, ds } from '../../art/downstairs.js';
import {
  UNDER, WRONGNESS, deck, wall, floor, hasDisc, valveTurned, wallHotspots, lampEntity, nicheTile,
  founderUse, getItem, cherylDeclines, ladderDeclines, discLight, keepLoops, bump, relight,
} from './common.js';

const W = 32, H = 14;
const RIBS = [4, 8, 12, 16, 20, 24];
const PIPES = [6, 14, 22];
const dropped = (g) => !!g.flag('halls.ladder');

function composeHalls(g) {
  const L = deck(W, H);
  // The main deck.
  wall(L, 1, 23, 4, RIBS);
  floor(L, 1, 28, 6, 10);
  // The north passage's side walls, and the wall face east of it.
  for (let y = 1; y <= 3; y++) { L.set('ground', 24, y, 'hull:top_edge_e', true); L.set('ground', 27, y, 'hull:top_edge_w', true); }
  L.set('ground', 24, 4, 'hull:face_top_end_r', true); L.set('ground', 24, 5, 'hull:face_base_end_r', true);
  L.set('ground', 27, 4, 'hull:face_top_end_l', true); L.set('ground', 27, 5, 'hull:face_base_end_l', true);
  L.set('ground', 27, 2, 'hull:face_base', true);
  // The passage: fast water until the valve, then wet floor.
  const drained = valveTurned(g);
  L.set('ground', 25, 0, 'hull:floor', false); L.set('ground', 26, 0, 'hull:floor', false);
  for (let y = 1; y <= 6; y++) for (const x of [25, 26]) {
    let f;
    if (drained) f = (x + y) % 3 === 0 ? 'ds_water:floor_soaked' : 'ds_water:floor_drained';
    else f = y === 1 ? 'ds_water:flood_edge_n' : x === 26 && y === 2 ? 'ds_water:flood_splash' : 'ds_water:flood';
    L.set('ground', x, y, f, false); // the passage entity blocks it while it's flooded
  }
  L.set('detail', 27, 2, drained ? 'ds_water:gush_stopped' : 'ds_water:gush');

  // Wall features on rows 4-5.
  L.set('ground', 3, 5, 'ds:chute_l', true); L.set('ground', 4, 5, 'ds:chute_r', true);
  L.set('ground', 8, 4, dropped(g) ? 'ds:cw_ladder_down_top' : 'ds:cw_ladder_up_top', true);
  L.set('ground', 8, 5, dropped(g) ? 'ds:cw_ladder_down_bot' : 'ds:cw_ladder_up_bot', !dropped(g));
  L.set('ground', 9, 4, nicheTile(g, 'halls_w'), true);
  L.set('ground', 18, 4, nicheTile(g, 'halls_e'), true);
  for (const x of [13, 14]) { L.set('ground', x, 4, 'hull:hatch_open_top', true); L.set('ground', x, 5, 'hull:hatch_open_bot', false); }
  L.set('ground', 20, 4, 'ds:horn', true);
  // The valve wheel (2×2 on the wall face).
  const v = drained ? 'valve_key_jammed' : 'valve_spindle';
  L.set('detail', 22, 4, `machines:${v}_nw`); L.set('detail', 23, 4, `machines:${v}_ne`);
  L.set('detail', 22, 5, `machines:${v}_sw`); L.set('detail', 23, 5, `machines:${v}_se`);

  // The drowned corridor south: steps going under black water.
  L.set('ground', 17, 11, 'ds_water:black_edge', true); L.set('ground', 18, 11, 'ds_water:black_edge', true);
  for (let y = 12; y <= 13; y++) { L.set('ground', 17, y, 'ds_water:black', true); L.set('ground', 18, y, 'ds_water:black', true); }

  // Pools of daylight under the light-pipes.
  for (const x of PIPES) L.set('ground', x, 8, 'hull:floor_glow', true);
  // Ribs show as rib faces on the wall only: overhead ribs across the floor hid Cheryl.
  return L.done();
}

function hallsLights(g) {
  const out = PIPES.map((x) => ({ x, y: 8.2, radius: 2.2, color: 'daylight' }));
  if (g.flag('lamp.halls_w')) out.push({ x: 9, y: 5.4, radius: 3, color: 'relic_cyan' });
  if (g.flag('lamp.halls_e')) out.push({ x: 18, y: 5.4, radius: 3, color: 'relic_cyan' });
  return out;
}

// ---------------------------------------------------------------------------
// The valve

async function turnValve(g) {
  const p = g.player;
  if (!(p.y === 6 && (p.x === 22 || p.x === 23))) await g.movePlayer([22, 6]);
  g.facePlayer('up');
  g.takeItem('valve_key');
  g.sfx('give');
  g.setTile('detail', 22, 4, 'machines:valve_key_nw'); g.setTile('detail', 23, 4, 'machines:valve_key_ne');
  g.setTile('detail', 22, 5, 'machines:valve_key_sw'); g.setTile('detail', 23, 5, 'machines:valve_key_se');
  await g.wait(0.6);
  // Two heaves; then it gives, with a long grinding squeal.
  g.pose('player', 'wheel_up');
  g.sfx('valve_turn');
  g.shake(1, 0.4);
  await g.wait(0.9);
  g.shake(2, 0.4);
  await g.wait(0.9);
  g.setTile('detail', 22, 4, 'machines:valve_key_turned_nw'); g.setTile('detail', 23, 4, 'machines:valve_key_turned_ne');
  g.setTile('detail', 22, 5, 'machines:valve_key_turned_sw'); g.setTile('detail', 23, 5, 'machines:valve_key_turned_se');
  g.shake(1, 1.2);
  await g.wait(1.2);
  g.pose('player', null);
  // The pipe slows and stops; the passage drains.
  g.stopLoop('water_gush', 2000);
  g.sfx('far_gurgle');
  g.facePlayer('right');
  await g.wait(1);
  g.setFlag('halls.valve');
  await g.wait(1.4);
  // Silence. Then, down the speaking tube, small and far away.
  await g.wait(1);
  g.sfx('tube_voice');
  g.startLoop('tube_murmur');
  await g.say('Far-off Voice', 'The FOUNTAIN! The Fountain\'s STOPPED!', { position: 'top' });
  await g.say('Far-off Voice', 'Five hundred YEARS!', { position: 'top' });
  g.stopLoop('tube_murmur', 1500);
  // She tries it back.
  g.facePlayer('up');
  g.pose('player', 'wheel_up');
  g.sfx('valve_jam');
  g.shake(1, 0.3);
  await g.wait(0.8);
  g.pose('player', null);
  await g.describe("It won't go back. It's jammed for good, key and all.");
  await g.describe("I've stopped the Fountain. Five hundred years, and I've stopped it.");
}

// ---------------------------------------------------------------------------
// The speaking tube: one far-off line per listen, in turn.

async function listen(g) {
  if (valveTurned(g)) return g.describe('Very quiet up there now. Very, very quiet.');
  const lines = ['...Tessel: Forward!... ...please disperse...'];
  if (g.flag('counter.left')) lines.push('...a HUNDRED, Duncan...');
  lines.push('...lemons, onions...');
  const n = bump(g, 'halls.tube');
  g.startLoop('tube_murmur');
  await g.say('Far-off Voice', lines[n % lines.length], { position: 'top' });
  g.stopLoop('tube_murmur', 800);
  if (n === 0) await g.describe("A speaking tube. Somebody up there is saying 'Tessel: Forward.' It's coming from the Square.");
}

// ---------------------------------------------------------------------------
// Objects

async function dropLadder(g) {
  if (g.player.x !== 8 || g.player.y !== 6) await g.movePlayer([8, 6]);
  g.facePlayer('up');
  g.pose('player', 'reach_up');
  await g.wait(0.4);
  g.sfx('ladder_drop');
  await g.wait(0.5);
  g.pose('player', null);
  await g.movePlayer('d');
  g.facePlayer('up');
  g.setFlag('halls.ladder');
  g.shake(2, 0.4);
  await g.wait(0.6);
  await g.describe('There. A back door.');
}

async function climbLadder(g) {
  if (g.player.x !== 8 || g.player.y !== 6) await g.movePlayer([8, 6]);
  g.facePlayer('up');
  keepLoops(g, []);
  g.sfx('step_rung');
  g.pose('player', 'climb_up');
  await g.tween('player', { offset: [0, -10], seconds: 0.35 });
  g.sfx('step_rung');
  await g.tween('player', { offset: [0, -20], seconds: 0.35 });
  await g.fade('out', 0.3);
  g.pose('player', null);
  await g.tween('player', { offset: [0, 0], seconds: 0 });
  await g.changeMap('step_gallery', 6, 7, 'down');
}

const PIPE_LOOKS = [
  ['A glass rod coming down through the ceiling, full of daylight.', "That's the bottom of a moon-eye. Somebody's doorstep is up there.", 'Daylight, coming down. Did I do that? I think I did that.'],
  "Somebody's doorstep. I wonder whose.",
];

const hallObjects = [
  ...wallHotspots('halls', 5, 1, 23, [3, 4, 8, 9, 13, 14, 18, 20, 22, 23], RIBS),
  lampEntity('halls_w', 9, 5),
  lampEntity('halls_e', 18, 5),
  { id: 'chute_mouth', x: 3, y: 5, w: 2, look: "Where I came in. It's a long way up, and it's polished." },
  {
    id: 'drop_ladder', x: 8, y: 5,
    interact: async (g) => {
      if (!dropped(g)) {
        await g.describe('A ladder, hooked up high on the wall, and a bronze chain hanging from its cleat. Up above it, a dark square.');
        if ((await g.choose('Pull the chain?', ['Yes', 'Not yet'])) === 0) await dropLadder(g);
        return;
      }
      if (valveTurned(g)) return ladderDeclines(g);
      await g.describe('The ladder, down. A way back to the gallery and the Steps.');
      if ((await g.choose('Climb up?', ['Yes', 'Not yet'])) === 0) await climbLadder(g);
    },
  },
  { id: 'speaking_tube', x: 20, y: 5, interact: listen },
  {
    id: 'valve', x: 22, y: 4, w: 2, h: 2,
    interact: async (g) => {
      if (valveTurned(g)) return g.describe("Jammed. Whatever I've done, I've done it.");
      if (bump(g, 'halls.valveLook') === 0) return g.describe("A big bronze wheel, beside the flooded passage. Its handle's gone; there's only a bare square spindle.");
      return g.describe('A square spindle. It wants a key.');
    },
    use: {
      valve_key: (g) => turnValve(g),
      crowbar: (g) => (valveTurned(g) ? g.describe("It's jammed. The crowbar won't change its mind.") : g.describe("Square. The crowbar's round. Nothing doing.", 'Somebody had a key for this.')),
      '*': cherylDeclines,
    },
  },
  {
    id: 'passage', x: 25, y: 1, w: 2, h: 6, when: (g) => !valveTurned(g), solid: true,
    looks: [
      ['The passage north. Toward the Crown.', "Knee-deep and running fast. It'd have me off my feet and down the other corridor in a moment."],
      'Knee-deep and running. Not without a reason to.',
    ],
    use: { '*': (g) => g.describe('Not into that. It would take it, and me.') },
  },
  {
    id: 'pipe', x: 27, y: 2, h: 4,
    interact: async (g) => {
      if (valveTurned(g)) return g.describe('Dry. A drip, then nothing. The Fountain on a hot day, gone.');
      return g.describe('Fresh water, gushing out of a cracked pipe. Not seawater. It smells like the Fountain on a hot day.');
    },
  },
  {
    id: 'drowned', x: 17, y: 11, w: 2, h: 3,
    looks: [['The floor slopes down into black water. It doesn\'t ripple.', "It goes down a long way. I'm brave, not stupid."], 'No.'],
    use: { '*': (g) => g.describe('No. Not into that.') },
  },
].map((o) => ({ solid: false, use: founderUse, ...o }));

const pipes = PIPES.map((x) => ({
  id: `light_pipe_${x}`, x, y: 8, kind: 'object', lookKey: 'light_pipes',
  // The rod under the valve's standing spot is the short one, so it stays in its tile.
  sprite: x === 22 ? { sheet: ds_rod_short, frame: 'rod_short' } : { sheet: ds_rod, frame: 'rod' }, shadow: false,
  looks: PIPE_LOOKS,
  use: { ...founderUse, paper_charcoal: (g) => g.describe('A rubbing of daylight. No.') },
}));

export const hallsMap = composedMap(composeHalls, {
  ...UNDER,
  id: 'lamp_halls',
  name: 'The Lamp Halls',
  tileset: act3Tiles,
  spawn: [3, 7],
  darkness: 0.9,
  lights: hallsLights,
  playerLight: discLight(3),
  exits: [
    { x: 25, y: 0, w: 2, to: 'chart_room', at: [7, 12], facing: 'up', when: valveTurned, sfx: 'step_hullstone' },
    { x: 13, y: 5, w: 2, to: 'bunk_room', at: [4, 5], facing: 'up', sfx: 'step_hullstone' },
    { x: 8, y: 5, when: (g) => dropped(g) && !valveTurned(g), run: climbLadder },
    { x: 8, y: 5, when: (g) => dropped(g) && valveTurned(g), run: async (g) => { await ladderDeclines(g); await g.movePlayer([8, 6]); } },
  ],
  triggers: [
    {
      // First steps onto the drained passage.
      x: 25, y: 1, w: 2, h: 6, stop: false,
      when: (g) => valveTurned(g) && !g.flag('n.drainedSeen'),
      run: async (g) => { g.setFlag('n.drainedSeen', 1); await g.describe('Drained. Wet, but walkable. North.'); },
    },
  ],
  onEnter: async (g) => {
    g.setWrongness(WRONGNESS);
    keepLoops(g, valveTurned(g) ? [] : ['water_gush']);
  },
  entities: [...hallObjects, ...pipes],
});

// ---------------------------------------------------------------------------
// The Bunk Room

const BW = 10, BH = 7;
const lampLit = (g) => !!g.flag('lamp.bunk');

function composeBunk(g) {
  const L = deck(BW, BH);
  wall(L, 1, 8, 0);
  floor(L, 1, 8, 2, 5);
  floor(L, 4, 5, 6, 6);
  L.set('ground', 2, 0, nicheTile(g, 'bunk'), true);
  L.set('ground', 4, 0, 'ds:inlay_roster_l', true); L.set('ground', 5, 0, 'ds:inlay_roster_r', true);
  L.set('ground', 7, 0, 'ds:tool_rack', true);
  L.set('ground', 8, 0, g.flag('got.valveKey') ? 'ds:tool_rack' : 'ds:tool_rack_key', true);
  for (const x0 of [1, 7]) { L.set('detail', x0, 3, 'ds:bunk_l', true); L.set('detail', x0 + 1, 3, 'ds:bunk_r', true); }
  L.set('detail', 3, 4, 'ds:stone_table', true);
  return L.done();
}

const bunkObjects = [
  ...wallHotspots('bunk', 1, 1, 8, [2, 4, 5, 7, 8]),
  {
    id: 'lamp_bunk', x: 2, y: 1,
    interact: async (g) => {
      if (lampLit(g)) return g.describe("Lit. Somebody's home.");
      if (hasDisc(g)) return g.describe('A dead lamp. It looks like the disc, only hungrier.');
      return g.describe('A lamp of milky glass in a niche. Dead. Cold.');
    },
    use: {
      moonglass_disc: async (g) => {
        if (lampLit(g)) return g.describe("It's already lit. It doesn't want seconds.");
        await relight(g, 'lamp.bunk');
        await g.describe('It drinks from the disc and wakes up, and so does the room.');
      },
      ...founderUse,
    },
  },
  {
    id: 'roster', x: 4, y: 1, w: 2,
    looks: [['A bell, then a wave. A bell, then a wave. All along the wall.', 'A timetable. For ringing a bell when the tide turns.'], 'Ambrose would like this wall.'],
    use: { paper_charcoal: (g) => g.describe("Bell, wave, bell, wave. I don't need a rubbing to remember that."), ...founderUse },
  },
  {
    id: 'tool_rack', x: 7, y: 1, w: 2,
    interact: async (g) => {
      if (!lampLit(g)) return g.describe("Too dark to see what's there. Something hangs on the wall.");
      if (g.flag('got.valveKey')) return g.describe('Spanners. Somebody looked after these.');
      await g.describe('Bronze tools, hung up neatly. Spanners as long as my arm. Somebody looked after these.', "And a key with a square socket. The same size as that spindle, I'd bet.");
      g.pose('player', 'reach_up');
      await g.wait(0.4);
      g.setFlag('got.valveKey');
      g.pose('player', null);
      await getItem(g, 'valve_key');
    },
  },
  {
    id: 'bunks_w', x: 1, y: 3, w: 2, lookKey: 'bunks',
    looks: [['Stone bunks. Hard as a church pew, and narrower.', 'People slept down here. Lived down here.'], "Nobody's slept here for a very long time."],
  },
  {
    id: 'bunks_e', x: 7, y: 3, w: 2, lookKey: 'bunks',
    looks: [['Stone bunks. Hard as a church pew, and narrower.', 'People slept down here. Lived down here.'], "Nobody's slept here for a very long time."],
  },
  {
    id: 'cup', x: 3, y: 4, kind: 'object',
    sprite: { sheet: ds, frame: 'cup' }, offset: [0, -7], shadow: false,
    look: 'A cup. Left on the table as if someone meant to come back for it.',
  },
].map((o) => ({ solid: false, use: { '*': cherylDeclines }, ...o }));

export const bunkMap = composedMap(composeBunk, {
  ...UNDER,
  id: 'bunk_room',
  name: 'The Bunk Room',
  tileset: act3Tiles,
  spawn: [4, 5],
  darkness: 0.97,
  lights: [
    { x: 4.5, y: 2.5, radius: 4.6, color: 'relic_cyan', when: lampLit },
    // A faint glint on the dead lamp, so there's something to walk toward in the dark.
    { x: 2, y: 1, radius: 0.7, color: 'relic_cyan', when: (g) => !lampLit(g) },
  ],
  playerLight: discLight(2),
  exits: [{ x: 4, y: 6, w: 2, to: 'lamp_halls', at: [13, 6], facing: 'down', sfx: 'step_hullstone' }],
  onEnter: async (g) => {
    g.setWrongness(WRONGNESS);
    keepLoops(g, []);
    if (lampLit(g) || g.flag('n.bunkDark')) return;
    g.setFlag('n.bunkDark', 1);
    await g.describe('Pitch dark in here. Darker than the hall. My disc barely gets past the door.');
  },
  entities: bunkObjects,
});

// Named scripts (runnable with ?run=, and visible to npm run check).
export const hallsScripts = { turnValve, listen, dropLadder, climbLadder };
