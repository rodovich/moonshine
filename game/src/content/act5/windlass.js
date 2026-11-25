// Behind the bronze door: the Bow Passage (18 × 8) and the Windlass Room
// (22 × 14) under the lighthouse, where the act ends. From
// docs/design/05-high-and-dry.md ("Bow Passage", "Windlass Room", "The end
// of Act 5").
//
//  Bow Passage                      Windlass Room
//      x 0         1                    x 0         1         2
//        012345678901234567               0123456789012345678901
//  y  2  X#L####L####L###LX         y  1  X######HH###########XX   HH the sealed hatch (7-8, 1-2)
//     3  DD...............:            2  X#L####HH######T###L#X   T the speaking tube (15, 2)
//     4  DD...............:            3  X....................>   > the hawse (21, 3-4)
//     5  X................X            4  X....DDDDDDDDDDDDDDDD>   DDDD the drum and chain (5-20, 4-7)
//                                      6  :....DDDDDDDDDDDDDDDDX   : west → Bow Passage (x0, y6-7)
//                                      8  X......PP........B...X   PP the Tooth socket (7-8, 8-9); B the brake (17, 8)
//                                     10  X..cc..........cc....X   cc coils of spare chain

import { composedMap } from '../opening/grid.js';
import { act5Tiles } from './tiles.js';
import { deck, wall, floor, wallHotspots, founderUse } from '../act3/common.js';
import { brake, windlass } from '../../art/act5_under.js';
import { drawText, drawTextCentered, measure } from '../../engine/text.js';
import { WRONGNESS, toothOut, toothSet, hasClapper, bump, cherylDeclines } from './common.js';
import { act5Loops } from './loops.js';

// Act 6 sets `act5.next` (through src/content/index.js) to begin straight
// after the Moonrise card; until then the act ends on a card and the title.
export const act5 = { next: null };

const UNDER = {
  music: 'downstairs',
  lighting: null,
  background: 'void',
  ambience: ['hull', 'drips'],
  step: 'step_hullstone',
};

// The disc, dimmed after the relay, still lights a little around Cheryl.
const discLight = (g) => g.hasItem('moonglass_disc') && { radius: 2.2, color: 'relic_cyan' };

// ---------------------------------------------------------------------------
// The Bow Passage

const PW = 18, PH = 8;
const LAMPS = [2, 7, 12, 16];
const RIBS = [4, 9, 14];
const lit = (g) => !!g.flag('passage.lit');
let woken = null; // lamps awake so far, while the first-entry sequence runs

function composePassage(g) {
  const L = deck(PW, PH);
  wall(L, 1, 16, 1, RIBS);
  floor(L, 2, 16, 3, 5);
  floor(L, 1, 5, 5, 5);
  floor(L, 17, 17, 3, 4);
  L.set('ground', 17, 5, 'hull:top_edge_w', true);
  for (let x = 1; x <= 16; x++) L.set('ground', x, 6, 'hull:top_edge_n', true);
  // The bronze door, inside: open (the Bilge's evening light falling in).
  // The door's own tiles are its way back out (x1); x0 is the leaves.
  for (const [n, x, y] of [['nw', 0, 3], ['ne', 1, 3], ['sw', 0, 4], ['se', 1, 4]]) {
    L.set('ground', x, y, `bowdoor:bowdoor_open_${n}`, x === 0);
  }
  for (const x of LAMPS) {
    const on = lit(g);
    L.set('ground', x, 1, on ? 'keel_hatch:lamp_lit' : 'keel_hatch:lamp_dead', true);
    if (on) L.set('ground', x, 3, 'hull:floor_glow', false);
  }
  for (const x of RIBS) for (let y = 3; y <= 5; y++) L.set('overhead', x, y, 'hull:over_rib_v');
  return L.done();
}

function passageLights(g) {
  const out = [{ x: 0.9, y: 3.6, radius: 2, color: 'daylight_dim' }];
  const n = woken ?? (lit(g) ? LAMPS.length : 0);
  LAMPS.slice(0, n).forEach((x) => out.push({ x, y: 2.6, radius: 2.2, color: 'relic_cyan' }));
  return out;
}

async function wakeLamps(g) {
  woken = 0;
  await g.wait(0.6);
  g.facePlayer('right');
  g.panCamera(15, 4, 0.6);
  for (const x of LAMPS) {
    g.setTile('ground', x, 1, 'keel_hatch:lamp_wake');
    g.sfx('lamp_wake', { at: [x, 2] });
    await g.wait(0.45);
    woken++;
    g.setTile('ground', x, 3, 'hull:floor_glow');
    await g.wait(0.6);
  }
  await g.wait(0.6);
  g.setFlag('passage.lit');
  woken = null;
  await g.describe("They're waking up. All the way along.", "Somebody's coming home, and they know it.");
  await g.followPlayer(3);
}

// The chain's creak grows louder toward the Windlass Room.
const creakAt = (x, v) => ({ x, y: 3, h: 3, stop: false, run: async (g) => g.setLoopVolume('chain_creak', v, 400) });

export const passageMap = composedMap(composePassage, {
  ...UNDER,
  id: 'bow_passage',
  name: 'The Bow Passage',
  tileset: act5Tiles,
  spawn: [2, 4],
  darkness: 0.85,
  lights: passageLights,
  playerLight: discLight,
  exits: [
    { x: 1, y: 3, to: 'bilge_dry', at: [26, 10], facing: 'down', sfx: 'step_hullstone', checkFlags: ['act5.started', 'door.open'] },
    { x: 1, y: 4, to: 'bilge_dry', at: [27, 10], facing: 'down', sfx: 'step_hullstone', checkFlags: ['act5.started', 'door.open'] },
    { x: 17, y: 3, h: 2, to: 'windlass_room', at: [1, 6], facing: 'right', sfx: 'step_hullstone' },
  ],
  triggers: [
    creakAt(3, 0.35), creakAt(6, 0.5), creakAt(10, 0.7), creakAt(14, 0.9),
    {
      x: 9, y: 3, h: 3, stop: false,
      when: (g) => !g.flag('n.chainHeard'),
      run: async (g) => {
        g.setFlag('n.chainHeard', 1);
        await g.describe('A creak, deep and slow, from the east. Like a ship at anchor. Exactly like a ship at anchor.');
      },
    },
  ],
  onEnter: async (g) => {
    g.setWrongness(WRONGNESS);
    act5Loops(g, ['chain_creak']);
    g.setLoopVolume('chain_creak', g.player.x > 9 ? 0.8 : 0.35, 0);
    if (!lit(g)) await wakeLamps(g);
  },
  entities: [
    {
      id: 'bowdoor_in', x: 0, y: 3, h: 2, solid: true, kind: 'object',
      look: "The door, from the inside. Evening light from the canal, falling in across the floor. That's the way back.",
      use: founderUse,
    },
    ...LAMPS.map((x) => ({
      id: `plamp_${x}`, x, y: 2, solid: false, lookKey: 'passage_lamps',
      looks: ['A moonglass lamp, awake. They lit themselves when the door opened. Like a house when you come in.', 'Lit, all the way along.'],
      use: { moonglass_disc: (g) => g.describe("They're awake already. They don't need me."), ...founderUse },
    })),
    ...wallHotspots('passage', 2, 1, 16, LAMPS, RIBS),
  ],
});

// ---------------------------------------------------------------------------
// The Windlass Room

const W = 22, H = 14;
const late = (g) => !!g.flag('windlass.late'); // the evening through the hawse gone violet
const sat = (g) => !!g.flag('windlass.sat');

const SOCKET = (g) => (toothSet(g) ? 'clapper' : toothOut(g) ? 'empty' : 'stump');

function composeWindlass(g) {
  const L = deck(W, H);
  wall(L, 1, 20, 1);
  floor(L, 1, 20, 3, 12);
  // Side walls: the way west (rows 6-7), the hawse east (rows 3-4).
  for (let y = 3; y <= 12; y++) { L.set('ground', 0, y, 'hull:top_edge_e', true); L.set('ground', 21, y, 'hull:top_edge_w', true); }
  floor(L, 0, 0, 6, 7);
  for (let x = 1; x <= 20; x++) L.set('ground', x, 13, 'hull:top_edge_n', true);
  const hw = late(g) ? 'hawse_late' : 'hawse';
  L.set('ground', 21, 3, `hawse:${hw}_top`, true); L.set('ground', 21, 4, `hawse:${hw}_bot`, true);
  // North wall: two lamps, the speaking tube, the sealed hatch to the Long Keel.
  L.set('ground', 2, 1, 'keel_hatch:lamp_lit', true); L.set('ground', 19, 1, 'keel_hatch:lamp_lit', true);
  L.set('ground', 2, 3, 'hull:floor_glow', false); L.set('ground', 19, 3, 'hull:floor_glow', false);
  L.set('ground', 15, 1, 'ds:horn', true);
  for (const [n, x, y] of [['nw', 7, 1], ['ne', 8, 1], ['sw', 7, 2], ['se', 8, 2]]) L.set('ground', x, y, `keel_hatch:keel_sealed_${n}`, true);
  // The drum, wound with chain: it strains and gives until the Tooth is set.
  for (let r = 0; r < 4; r++) for (let c = 0; c < 16; c++) {
    L.set('detail', 5 + c, 4 + r, `windlass_drum:drum_x${c}y${r}`, true);
  }
  // The Tooth socket.
  const s = SOCKET(g);
  for (const [n, x, y] of [['nw', 7, 8], ['ne', 8, 8], ['sw', 7, 9], ['se', 8, 9]]) L.set('ground', x, y, `windlass:socket_${s}_${n}`, true);
  // Coils of spare chain.
  L.set('detail', 3, 10, 'windlass:coil_a_l', true); L.set('detail', 4, 10, 'windlass:coil_a_r', true);
  L.set('detail', 15, 10, 'windlass:coil_b_l', true); L.set('detail', 16, 10, 'windlass:coil_b_r', true);
  return L.done();
}

function windlassLights(g) {
  return [
    { x: 2, y: 2.6, radius: 3, color: 'moonglass_light' },
    { x: 19, y: 2.6, radius: 3, color: 'moonglass_light' },
    { x: 20.4, y: 3.8, radius: 2.2, color: late(g) ? 'dusk_violet' : 'moonglass_dim' },
  ];
}

async function firstLook(g) {
  g.setFlag('windlass.seen');
  await g.wait(0.5);
  g.facePlayer('right');
  await g.wait(0.6);
  await g.panCamera(17, 5, 0.6);
  await g.wait(0.8);
  await g.describe('A drum the size of a chapel, lying on its side, wound with chain.', 'Each link is taller than I am.');
  g.sfx('drum_creak');
  g.shake(1, 0.4);
  await g.wait(1);
  await g.followPlayer(1.2);
  await g.wait(0.4);
  await g.think('This is what holds us.', "This is all that's holding us.");
}

// The Tooth socket: the stump, then empty, then the clapper.
async function socketLook(g) {
  if (toothSet(g)) return g.describe('The clapper, seated. It fits as if it was waiting.');
  if (toothOut(g)) {
    if (hasClapper(g)) return g.describe('An empty socket, waiting. Rounded at the bottom, notched at the top.', 'I know exactly what goes in there. It\'s in my bag.');
    return g.describe('An empty socket, waiting. Rounded at the bottom, notched at the top. It wants a tooth.', 'Every part does two jobs down here. Something up there is a spare tooth, doing its other job.');
  }
  if (bump(g, 'socket') === 0) {
    return g.describe('A socket in the floor beside the drum, and in it the stump of something bronze, sheared clean off.', "It should be catching the drum. Stopping it turning back. It isn't.");
  }
  if (hasClapper(g)) return g.describe("The stump of a tooth. A rounded bronze tooth, with a notch. I've got that shape in my bag.");
  return g.describe("The stump of a tooth. A rounded bronze tooth, with a notch. I've seen that shape.");
}

// Stand beside the socket, facing it, for the scripted bits.
async function toSocket(g) {
  const p = g.player;
  const beside = [[6, 8, 'right'], [6, 9, 'right'], [9, 8, 'left'], [9, 9, 'left'], [7, 10, 'up'], [8, 10, 'up']];
  const here = beside.find(([x, y]) => p.x === x && p.y === y);
  if (here) return g.facePlayer(here[2]);
  await g.movePlayer([7, 10]);
  g.facePlayer('up');
}

async function leverStump(g) {
  if (toothSet(g)) return g.describe('No. That stays exactly where it is.');
  if (toothOut(g)) return g.describe("It's out. I'm not putting it back.");
  await toSocket(g);
  g.pose('player', 'heave_up');
  g.sfx('stump_lever');
  await g.wait(0.7);
  g.shake(1, 0.5);
  await g.wait(0.8);
  g.shake(2, 0.3);
  g.setFlag('tooth.out');
  g.pose('player', null);
  await g.wait(0.6);
  await g.describe("Out. Three hundred years of sitting there, and out in one go. I'm stronger than I look. Or it's tireder.");
}

async function setClapper(g) {
  if (toothSet(g)) return g.describe("It's in. It's staying in.");
  if (!toothOut(g)) return g.describe("The stump's in the way. It needs levering out first.");
  await seatTheTooth(g);
}

// ---------------------------------------------------------------------------
// The end of Act 5

export async function seatTheTooth(g) {
  await toSocket(g);
  g.pose('player', 'kneel_' + (g.player.facing === 'up' ? 'up' : 'down'));
  await g.wait(0.6);
  g.takeItem('clapper');
  g.setFlag('tooth.set');
  g.sfx('clapper_seat');
  g.stopLoop('drum_strain', 0);
  g.shake(2, 0.4);
  await g.wait(1.4);
  g.pose('player', null);
  await g.describe('It fits. Of course it fits.', "Every part does two jobs. The bell's tongue was a spare tooth all along, propping a door open.");
  // A long breath of silence. Then the speaking tube.
  await g.wait(2.2);
  g.startLoop('tube_wind');
  await g.wait(1.4);
  g.bark('Mayor', '...Dry Canal Day!...', { seconds: 2.5 });
  await g.wait(2.6);
  await g.describe('The bell says when. Ambrose said moonrise.');
  await sitAndWait(g);
}

async function sitAndWait(g) {
  await g.movePlayer([3, 11]);
  g.facePlayer('up');
  await g.wait(0.2);
  g.place('player', 3, 10, 'down');
  g.pose('player', 'sitcoil_down', { offset: [4, -6] });
  g.setFlag('windlass.sat');
  await g.wait(1);
  await g.describe("So I'll wait.", "I'm good at waiting. Ask anyone who's had me for a teacher.");
  await g.wait(1);
  g.setFlag('windlass.late'); // the hawse shades from evening blue to violet
  g.setLoopVolume('tube_wind', 0.5, 3000);
  await g.wait(3);
  g.stopMusic(2500);
  await g.fade('out', 2.5);
  await g.card('Moonrise.', 2);
  g.setFlag('act5.done');
  if (act5.next) return act5.next(g);
  await endCard(g);
}

function endCardPicture() {
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
    drawTextCentered(ctx, 'End of Act 5.', 128, 118, { color: 'ui_text' });
    drawTextCentered(ctx, 'Tessel continues soon.', 128, 132, { color: 'ui_text' });
  };
}

async function endCard(g) {
  act5Loops(g, []);
  await g.showPicture(endCardPicture(), { fade: 0 });
  await g.fade('in', 1);
  await g.wait(4);
  await g.fade('out', 1);
  await g.toTitle();
}

// ---------------------------------------------------------------------------

const windlassObjects = [
  {
    id: 'drum', x: 5, y: 4, w: 13, h: 4,
    interact: (g) => (toothSet(g)
      ? g.describe('Still. Settled against the Tooth. Not a creak.')
      : g.describe('Bronze. Wound with chain. It creaks every time the wind gusts, and gives a little. Just a little. Every time.')),
    use: { crowbar: (g) => g.describe('Against that? I might as well lever the island.'), clapper: (g) => g.describe("It's heavy, and it wants to be somewhere particular. Lower down. Beside it."), '*': cherylDeclines },
  },
  {
    id: 'chain', x: 18, y: 4, w: 3, h: 4,
    look: 'Links like doorways. It runs off the drum and out through that hole, toward the anchor. Toward the bottom of the Bowl.',
  },
  {
    id: 'hawse', x: 21, y: 3, h: 2,
    interact: (g) => (late(g)
      ? g.describe('The sea through the hawse, violet now. Nearly night.')
      : g.describe('A round hole in the wall, big enough to drive a cart through. The chain goes out. The sea comes in, cold, and blue with evening.')),
  },
  {
    id: 'socket', x: 7, y: 8, w: 2, h: 2,
    interact: socketLook,
    use: { crowbar: leverStump, clapper: setClapper, '*': cherylDeclines },
  },
  {
    id: 'stump', x: 10, y: 10, kind: 'object',
    sprite: { sheet: windlass, frame: 'stump_loose' },
    when: toothOut,
    looks: ['The old stump. Sheared clean, three hundred years ago, and holding on ever since.', 'The old stump. It can rest now.'],
  },
  {
    id: 'brake', x: 17, y: 8, kind: 'object',
    sprite: { sheet: brake, frame: 'brake_locked' },
    looks: [['A long bronze lever, locked. A plate on it shows a bell, and a hand, and an arrow.', 'When the bell says when.'], 'Locked. When the bell says when.'],
    use: { crowbar: (g) => g.describe("It's locked, not stuck. It's waiting for the bell."), '*': cherylDeclines },
  },
  {
    id: 'speaking_tube', x: 15, y: 2,
    interact: (g) => (toothSet(g)
      ? g.describe('Wind. Gulls. Nothing yet.')
      : g.describe('A tube from somewhere far above. I can hear wind in it, and gulls. And, very faintly, the Mayor.')),
  },
  {
    id: 'keel_hatch', x: 7, y: 2, w: 2,
    looks: [['A sealed hatch, marked with a moon in a bowl. The same as on the Ship Plan, at the bottom of the shaft.', 'Shut tight. Not yet, it seems to say.'], 'Shut tight. Not yet.'],
    use: { crowbar: (g) => g.describe('Not yet, it says. I believe it.'), '*': cherylDeclines },
  },
  {
    id: 'coil_west', x: 3, y: 10, w: 2,
    look: "Spare chain, coiled and waiting. A good place to sit, if you're me, and you've nothing to do but wait.",
  },
  {
    id: 'coil_east', x: 15, y: 10, w: 2, lookKey: 'coil_west',
    look: "Spare chain, coiled and waiting. A good place to sit, if you're me, and you've nothing to do but wait.",
  },
  ...[2, 19].map((x) => ({ id: `wlamp_${x}`, x, y: 2, lookKey: 'windlass_lamps', look: 'A moonglass lamp, lit. Somebody left the lights on for us.' })),
  ...wallHotspots('windlass', 2, 1, 20, [2, 7, 8, 15, 19]),
].map((o) => ({ solid: false, use: founderUse, ...o }));

export const windlassMap = composedMap(composeWindlass, {
  ...UNDER,
  id: 'windlass_room',
  name: 'The Windlass Room',
  tileset: act5Tiles,
  spawn: [1, 6],
  darkness: 0.8,
  lights: windlassLights,
  playerLight: discLight,
  exits: [
    { x: 0, y: 6, h: 2, to: 'bow_passage', at: [16, 3], facing: 'left', sfx: 'step_hullstone', when: (g) => !sat(g) },
  ],
  ambient: [
    // The drum creaks and gives with each gust, until the Tooth is set.
    { every: [7, 12], when: (g) => !toothSet(g), run: (g) => { g.sfx('drum_creak'); g.shake(1, 0.25); } },
  ],
  onEnter: async (g) => {
    g.setWrongness(WRONGNESS);
    act5Loops(g, toothSet(g) ? ['chain_creak', 'hawse_wind', 'tube_wind'] : ['chain_creak', 'hawse_wind', 'drum_strain']);
    g.setLoopVolume('chain_creak', 1, 0);
    if (sat(g)) g.pose('player', 'sitcoil_down', { offset: [4, -6] });
    if (!g.flag('windlass.seen')) await firstLook(g);
  },
  entities: windlassObjects,
});

export const windlassScripts = { wakeLamps, windlassFirstLook: firstLook, leverStump, seatTheTooth, sitAndWait };
