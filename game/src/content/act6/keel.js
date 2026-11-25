// The Long Keel (40 × 7): the straight spine along the bottom of the hull,
// from the Windlass Room (east) to the Sighting Room (west). Its lamps wake
// as Cheryl comes, each when she's three tiles from it, so she always walks
// into light. From docs/design/06-moon-in-the-bowl.md ("The Long Keel").
//
//      x 0         1         2         3
//        0123456789012345678901234567890123456789
//  y  0  XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
//     1  X######################################X
//     2  X#L####L####L####L####L####L####L####L#X   L lamps (x2, 7, ..., 37), ribs every four
//     3  D......................................:   D the Sighting Room's door (0, 3-4); : east → Windlass Room
//     4  D......................................:
//     5  X......................................X
//     6  XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
//
// The design draws the lamps on row 2; the art puts the lamp in the upper
// wall row (y1) with its glow on the floor (y3), as in the Bow Passage.

import { composedMap, blankGrid } from '../opening/grid.js';
import { layout } from '../act2/common.js';
import { act6Tiles } from './tiles.js';
import { cherylDeclines } from './common.js';
import { showSource } from './extend.js';

const W = 40, H = 7;
export const KEEL_LAMPS = [37, 32, 27, 22, 17, 12, 7, 2]; // in the order Cheryl reaches them, walking west
const RIBS = [4, 8, 16, 20, 24, 28, 36];

// How many lamps are awake (flag keel.lamps, 0..8), and whether the door has slid up.
const awake = (g) => g.flag('keel.lamps') || (g.flag('moon.true') ? KEEL_LAMPS.length : 0);
const isAwake = (g, x) => KEEL_LAMPS.indexOf(x) < awake(g);

function compose(g) {
  const L = layout(W, H, blankGrid);
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) L.set('ground', x, y, 'hull:top', true);
  for (let x = 1; x <= 38; x++) {
    L.set('ground', x, 1, `hull:${x % 3 ? 'face_top' : 'face_top_b'}`, true);
    L.set('ground', x, 2, `hull:${x % 3 ? 'face_base' : 'face_base_b'}`, true);
    L.set('ground', x, 3, 'keel:keel_n', false);
    // The two grooves worn down the middle; every few tiles a different wear.
    L.set('ground', x, 4, `keel:${x % 5 === 2 ? 'keel_groove_b' : 'keel_groove'}`, false);
    L.set('ground', x, 5, 'keel:keel_s', false);
  }
  L.set('ground', 39, 3, 'keel:keel_n', false); L.set('ground', 39, 4, 'keel:keel_groove', false);
  for (const x of KEEL_LAMPS) {
    const on = isAwake(g, x);
    L.set('ground', x, 1, `keel_hatch:${on ? 'lamp_lit' : 'lamp_dead'}`, true);
    if (on) L.set('ground', x, 3, 'hull:floor_glow', false);
  }
  for (const x of RIBS) {
    L.set('ground', x, 1, 'hull:face_rib_top', true); L.set('ground', x, 2, 'hull:face_rib_base', true);
    for (let y = 3; y <= 5; y++) L.set('overhead', x, y, 'hull:over_rib_v');
  }
  // The Sighting Room's door, a moon in a bowl carved over it.
  const open = g.flag('keel.doorOpen');
  L.set('ground', 0, 3, `keel:${open ? 'keel_door_open_top' : 'keel_door_closed_top'}`, !open);
  L.set('ground', 0, 4, `keel:${open ? 'keel_door_open_bot' : 'keel_door_closed_bot'}`, !open);
  return L.done();
}

// ---------------------------------------------------------------------------
// The lamps waking. An ambient callback every tenth of a second: when Cheryl
// comes within three tiles of the next dead lamp, it wakes (lamp_wake, then
// lit), with a chime panned by where it is on screen.

const WAKE = ['lamp_wake_0', 'lamp_wake_1', 'lamp_wake_2', 'lamp_wake_3', 'lamp_wake_4'];
const WAKE_TICKS = [3, 1, 1, 2, 6]; // tenths of a second per frame (the art's 300/120/120/220/600 ms)
let waking = []; // { x, t } lamps mid-animation (reset when the map loads)

export function wakeLamps(g) {
  const p = g.player;
  let n = awake(g);
  while (n < KEEL_LAMPS.length && p.x - KEEL_LAMPS[n] <= 3) {
    const x = KEEL_LAMPS[n];
    n++;
    g.setFlag('keel.lamps', n);
    waking.push({ x, t: 0 });
    g.setTile('ground', x, 1, `keel_hatch:${WAKE[0]}`);
    g.setTile('ground', x, 3, 'keel:keel_n');
    const pan = Math.max(-1, Math.min(1, (x - p.x) / 8));
    g.sfx('lamp_wake', { pan, volume: 0.8 });
  }
  for (const w of waking) {
    w.t++;
    let acc = 0;
    let i = 0;
    while (i < WAKE.length && w.t >= acc + WAKE_TICKS[i]) acc += WAKE_TICKS[i++];
    if (i >= WAKE.length) {
      g.setTile('ground', w.x, 1, 'keel_hatch:lamp_lit');
      g.setTile('ground', w.x, 3, 'hull:floor_glow');
      w.done = true;
    } else g.setTile('ground', w.x, 1, `keel_hatch:${WAKE[i]}`);
  }
  waking = waking.filter((w) => !w.done);
}

// The west end: the Sighting Room's door slides up as she comes near, and she says so.
export async function keelDoor(g) {
  g.sfx('door_slide_up');
  for (let f = 0; f < 3; f++) {
    g.setTile('ground', 0, 3, `keel:keel_door_opening_top_${f}`);
    g.setTile('ground', 0, 4, `keel:keel_door_opening_bot_${f}`);
    await g.wait(0.26);
  }
  g.setFlag('keel.doorOpen');
  await g.wait(0.3);
  await g.describe('A door, opening on its own. A moon in a bowl, carved over it.');
}

// Lights: the woken lamps (radius 3), cyan-white.
function lights(g) {
  return KEEL_LAMPS.filter((x) => isAwake(g, x)).map((x) => ({ x, y: 2.5, radius: 3, color: 'moonglass_light' }));
}

// ---------------------------------------------------------------------------

const objects = [
  ...RIBS.map((x) => ({
    id: `rib_${x}`, x, y: 1, h: 2, lookKey: 'ribs',
    look: 'Ribs, every few paces, all the way along. The inside of a hull. I know that now.',
  })),
  ...KEEL_LAMPS.map((x) => ({
    id: `lamp_${x}`, x, y: 1, h: 2, lookKey: 'keel_lamps',
    looks: ['Moonglass lamps. They woke as I came, one after another, like they\'d been waiting.', 'Awake. All of them, all the way down.'],
  })),
  // Only while it's shut: once open, the doorway is the way through.
  { id: 'keel_door', x: 0, y: 3, h: 2, when: (g) => !g.flag('keel.doorOpen'), look: 'A door, shut. A moon in a bowl, carved over it.' },
].map((o) => ({ solid: true, use: { '*': cherylDeclines }, ...o }));

// Lines along the way: first entering (after two steps), and the west end.
const triggers = [
  {
    x: 34, y: 3, w: 3, h: 3, stop: false,
    when: (g) => !g.flag('n.keelArrived'),
    run: async (g) => {
      g.setFlag('n.keelArrived', 1);
      await g.describe('The Long Keel. It runs the whole length of us, straight as a ruler.', "The lamps wake up as I come. Like they've been waiting.");
    },
  },
  // The grooves down the middle: a line the first time she walks in them, well along
  // (a hotspot on the walkway would catch clicks meant for walking).
  {
    x: 24, y: 4, w: 6, h: 1, stop: false,
    when: (g) => !!g.flag('n.keelArrived') && !g.flag('n.keelGrooves'),
    run: async (g) => {
      g.setFlag('n.keelGrooves', 1);
      await g.describe('Two grooves worn in the floor, down the middle. Footsteps. Three hundred years of Keepers, walking this way.');
    },
  },
  // Halfway: a grate in the floor, and the Middle Sister still thumping somewhere below.
  {
    x: 15, y: 3, w: 1, h: 3, stop: false,
    when: (g) => !g.flag('n.keelGrate') && !g.flag('sisters.asleep'),
    run: async (g) => {
      g.setFlag('n.keelGrate', 1);
      g.sfx('thump_middle', { volume: 0.5 });
      await g.describe('A grate in the floor. Far below, a slow thump, and another. The Middle Sister, still at it.');
    },
  },
  { x: 5, y: 3, w: 1, h: 3, stop: false, when: (g) => !g.flag('keel.doorOpen'), run: keelDoor },
];

export const keelMap = showSource(composedMap(compose, {
  id: 'long_keel',
  name: 'The Long Keel',
  tileset: act6Tiles,
  music: 'keel',
  dark: 0.9,
  playerLight: { radius: 3, color: 'relic_cyan' },
  lights,
  ambience: ['hull', 'drips'],
  step: 'step_hullstone',
  spawn: [37, 4],
  exits: [
    // Each tile of a two-tile edge is its own exit, since these doors turn a corner (west edge → north-facing door).
    // (Run as scripts: the door's tiles are solid until it slides up.)
    ...[0, 1].map((i) => ({
      x: 0, y: 3 + i, when: (g) => !!g.flag('keel.doorOpen'),
      run: (g) => { g.sfx('door'); return g.changeMap('sighting_room', 7 + i, 11, 'up'); },
    })),
    ...[0, 1].map((i) => ({ x: 39, y: 3 + i, to: 'windlass_room', at: [7 + i, 3], facing: 'down' })),
  ],
  triggers,
  entities: objects,
  ambient: [{ every: [0.1, 0.1], run: wakeLamps }],
  onEnter: async (g) => {
    waking = [];
    g.setWrongness(g.flag('moon.true') ? 0 : 0.5);
  },
}), compose, awake);
