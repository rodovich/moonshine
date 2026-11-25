// The Chart Room (16 × 14), under the Blue Dome: the great floor inlay of
// Tessel drawn as a ship, the last Keeper's chair, cup, and ledger, and the
// inside of the Founders' Door. From docs/design/03-downstairs.md.
//
//      x 0         1
//        0123456789012345
//  y  2  XX#####FF#####XX   FF the Founders' Door (7-8, 1-2), bolted from this side
//     4  X.kt...........X   k the Keeper's chair (2, 4); t table and cup (3, 4); ledger (4, 4)
//     5  X..mmmmmmmmmm..X   mm the floor inlay (3-12, 5-10), walkable
//    10  X..mmmmmmmmmm..X
//    12  XXX....::....XXX
//    13  XXXXXXX::XXXXXXX   :: back to the Lamp Halls (7-8, 13)

import { composedMap } from '../opening/grid.js';
import { act3Tiles } from './tiles.js';
import { chart_chair, chart } from '../../art/chartroom.js';
import { UNDER, WRONGNESS, deck, floor, unbolted, founderUse, cherylDeclines, discLight, keepLoops, bump } from './common.js';
import { throughFoundersDoor } from './surface.js';

const W = 16, H = 14;

// The floor's rows: [first x, last x] (the corners are cut at 45°).
const ROWS = { 3: [2, 13], 4: [1, 14], 5: [1, 14], 6: [1, 14], 7: [1, 14], 8: [1, 14], 9: [1, 14], 10: [1, 14], 11: [2, 13], 12: [3, 12] };

function composeChart(g) {
  const L = deck(W, H);
  // The north wall: x3–12 on row 1, x2–13 on row 2.
  for (let x = 2; x <= 13; x++) {
    const b = x % 2 ? '' : '_b';
    if (x >= 3 && x <= 12) L.set('ground', x, 1, `hull:face_top${b}`, true);
    L.set('ground', x, 2, `hull:face_base${b}`, true);
  }
  L.set('ground', 2, 2, 'hull:face_base_end_l', true); L.set('ground', 13, 2, 'hull:face_base_end_r', true);
  L.set('ground', 4, 1, 'ds:niche_lit', true); L.set('ground', 11, 1, 'ds:niche_lit', true);
  // The Founders' Door: bolted; then open, a doorway up into the crypt.
  const door = unbolted(g) ? 'fdoor_in_opened' : 'fdoor_in';
  for (let y = 0; y < 2; y++) for (let x = 0; x < 2; x++) L.set('ground', 7 + x, 1 + y, `chart:${door}_x${x}y${y}`, y === 0 || !unbolted(g));
  // The floor, with 45° corners.
  for (const [y, [x0, x1]] of Object.entries(ROWS)) floor(L, x0, x1, +y, +y);
  L.set('ground', 1, 3, 'hull:top_chamfer_nw', true); L.set('ground', 14, 3, 'hull:top_chamfer_ne', true);
  L.set('ground', 1, 11, 'hull:top_chamfer_sw', true); L.set('ground', 14, 11, 'hull:top_chamfer_se', true);
  L.set('ground', 2, 12, 'hull:top_chamfer_sw', true); L.set('ground', 13, 12, 'hull:top_chamfer_se', true);
  floor(L, 7, 8, 13, 13);
  // The inlay, and the Eye's pool of light with the teapot's shadow over it.
  for (let ty = 0; ty < 6; ty++) for (let tx = 0; tx < 10; tx++) {
    L.set('ground', 3 + tx, 5 + ty, `chart:inlay_x${tx}y${ty}`, false);
    if (chart.frames[`pool_x${tx}y${ty}`]) L.set('detail', 3 + tx, 5 + ty, `chart:pool_x${tx}y${ty}`);
  }
  // The Keeper's table, with his cup; his ledger beside it.
  L.set('detail', 3, 4, 'ds:stone_table', true);
  L.set('detail', 4, 4, 'chart:keeper_ledger', true);
  return L.done();
}

// ---------------------------------------------------------------------------
// The first look: a band of light passes up the floor, from the hull to the
// Crown, then settles on the waterline. (The room is exactly one screen, so
// the design's camera pan is a light sweep instead; see README.)

let sweep = null; // { y } while the sweep runs; { row } to pick out one row
let dim = 0.5;

function chartLights(g) {
  const out = [{ x: 7.5, y: 7.5, radius: 3, color: 'daylight' }];
  if (unbolted(g)) out.push({ x: 7.5, y: 2.6, radius: 1.6, color: 'lamp_warm' });
  out.push({ x: 4, y: 1.6, radius: 1.5, color: 'relic_cyan' }, { x: 11, y: 1.6, radius: 1.5, color: 'relic_cyan' });
  if (sweep) for (let x = 3; x <= 12; x += 1.5) out.push({ x, y: sweep.y, radius: 1.4, color: 'daylight' });
  return out;
}

async function sweepTo(g, from, to, seconds) {
  const steps = Math.round(seconds * 20);
  for (let i = 0; i <= steps; i++) {
    sweep = { y: from + ((to - from) * i) / steps };
    await g.wait(1 / 20);
  }
}

async function firstLook(g) {
  g.stopMusic(1200);
  await g.movePlayer([7, 11]);
  g.facePlayer('up');
  await g.wait(0.6);
  await g.describe("The floor's a picture. Stone, set in stone.");
  dim = 0.82;
  await sweepTo(g, 11, 4.6, 4.5);
  await g.wait(0.4);
  await g.describe("The Crown. The Steps. That's us.");
  await sweepTo(g, 4.6, 7.5, 1.8);
  await g.wait(0.5);
  await g.describe('And the sea comes up to... there. Halfway up the hill.');
  await g.wait(0.6);
  await g.think('Oh.');
  await g.wait(0.4);
  await g.think("Oh, we're a boat.");
  g.playCue('reveal', { resume: false });
  for (let k = 0; k <= 20; k++) { // the band fades into the room
    dim = 0.82 - (0.32 * k) / 20;
    await g.wait(0.1);
  }
  sweep = null;
  dim = 0.5;
  g.setFlag('chart.seen');
}

// ---------------------------------------------------------------------------
// The inlay's hotspots. Positions follow the art (chart:inlay_*, see
// docs/art-downstairs.md); where they overlap the first in this order wins.

const HOTSPOTS = [
  ['sisters', (x, y) => y === 8 && (x === 8 || x === 9)],
  ['teapot', (x, y) => (x === 7 || x === 8) && (y === 7 || y === 8)],
  ['shaft', (x) => x === 5],
  ['mast', (x, y) => x === 7 && (y === 5 || y === 6)],
  // The chain runs down from the bow to the anchor in the corner.
  ['chain', (x, y) => (x === 11 && (y === 8 || y === 9)) || (x === 12 && (y === 9 || y === 10))],
  // The sea comes up to the row 7/8 boundary: little waves at the hull's ends...
  ['waterline', (x, y) => (x === 3 || x === 12) && (y === 7 || y === 8)],
  // ...and open sea under the hull.
  ['sea', (x, y) => y >= 9],
  ['town', (x, y) => (y === 5 && x >= 5 && x <= 10) || (y === 6 && x >= 4 && x <= 11) || (x === 11 && y === 7)],
  ['hull', (x, y) => y >= 7 && x >= 4 && x <= 11],
  ['border', () => true], // the plain band inside the frame, at the top corners
];

const INLAY_LOOKS = {
  town: ['Tessel, in little stone houses. Somebody got the Steps exactly right.'],
  mast: [['The Bell Tower, drawn as a mast. A rope from the bell goes down inside the hull, to a wheel.', "Ambrose's bell is attached to something."]],
  hull: ['Decks, ribs, rooms. Everything under our feet, all this time.'],
  sisters: ['Three upright shapes, amidships. Different sizes. Ottilie would have a theory.'],
  chain: ['A chain from the Prow to an anchor. The links are drawn like little eyes.'],
  shaft: [
    ['A straight shaft, from a narrow house near the top of town all the way down to a bowl at the bottom.', "There's a moon drawn in the bowl.", "That's my end of town. That's very nearly my house."],
    "A moon in a bowl. A narrow house. I'll think about that later.",
  ],
  waterline: ['Little waves at the hill\'s shoulders. I keep looking at them and they keep being true.'],
  sea: ['Below the waves, just sea, drawn in little dashes. The hull sits down in it, like a hand in a bath.'],
  border: ['A plain band of stone round the picture, worn smooth where people stood to look.'],
  teapot: ["And over the middle of the town, the shadow of a teapot. Ottilie's mother, keeping an eye on things."],
};

async function takeRubbing(g) {
  g.facePlayer(g.player.facing);
  g.pose('player', 'kneel_down');
  await g.wait(0.4);
  g.sfx('rubbing');
  await g.wait(1.2);
  g.sfx('rubbing');
  await g.wait(1);
  await g.describe("I kneel on the Founders' floor and rub charcoal over it like a schoolgirl doing a brass.", "Ottilie would faint. Then she'd want it framed.");
  g.pose('player', null);
  g.setFlag('got.shipPlan');
  await g.trade('paper_charcoal', 'ship_plan');
}

const inlayUse = {
  paper_charcoal: takeRubbing,
  ship_plan: (g) => g.describe("I've got it. Folded in quarters, which feels rude."),
  '*': (g) => g.describe('No. Not on this.'),
};

const inlay = [];
for (let y = 5; y <= 10; y++) for (let x = 3; x <= 12; x++) {
  const [key] = HOTSPOTS.find(([, test]) => test(x, y));
  inlay.push({ id: `inlay_${x}_${y}`, x, y, solid: false, lookKey: `inlay_${key}`, looks: INLAY_LOOKS[key], use: inlayUse });
}

// ---------------------------------------------------------------------------
// The Keeper's things

const LEDGER = [
  "'Rang at the turn. All well.' The last page.",
  "'Stair fallen. Brannoc and the others beneath it. I have bolted the door. Someone must stay.'",
  "'Sisters asleep. Moon true in the bowl.'",
  "'Past full: allow two fingers.'",
  "'Bell at the turn. Bell at the turn. Bell at the turn.' Pages of it.",
];

const LEDGER_COUNT = 'n.chart.ledger'; // bump()'s counter

async function readLedger(g) {
  const n = bump(g, 'chart.ledger');
  const boxes = [];
  if (n === 0) boxes.push("Old spelling, a shaky hand, but I can read it.");
  boxes.push(LEDGER[n % LEDGER.length]);
  if (n === LEDGER.length) boxes.push("'Rang at the turn.' That's what Ambrose says. Word for word.");
  await g.describe(...boxes);
}

async function drawBolt(g) {
  const p = g.player;
  if (!(p.y === 3 && (p.x === 7 || p.x === 8))) await g.movePlayer([7, 3]);
  g.facePlayer('up');
  g.pose('player', 'heave_up');
  g.sfx('bolt_draw');
  g.shake(1, 0.5);
  await g.wait(1.1);
  for (let y = 0; y < 2; y++) for (let x = 0; x < 2; x++) g.setTile('ground', 7 + x, 1 + y, `chart:fdoor_in_open_x${x}y${y}`);
  g.shake(1, 0.2);
  await g.wait(0.6);
  g.pose('player', null);
  g.sfx('founders_door');
  await g.wait(0.6);
  g.setFlag('founders.unbolted');
  await g.wait(0.6);
  await g.describe("Three hundred years. It moves like it's been waiting.");
}

const keeperObjects = [
  {
    id: 'founders_door_in', x: 7, y: 2, w: 2, when: (g) => !unbolted(g),
    interact: async (g) => {
      if (bump(g, 'chart.door') === 0) {
        const read = (g.flag(LEDGER_COUNT) || 0) >= 2;
        return g.describe(
          "The other side of Ottilie's door. A bronze bolt as thick as my arm, shot home from this side.",
          read ? "'I have bolted the door. Someone must stay.'" : 'Somebody bolted this from in here. And stayed in here.',
        );
      }
      return drawBolt(g);
    },
    use: { crowbar: (g) => g.describe("It's a bolt. It doesn't want prying; it wants pulling."), '*': cherylDeclines },
  },
  {
    id: 'keeper_chair', x: 2, y: 4, kind: 'object',
    sprite: { sheet: chart_chair, frame: 'keeper_stone_chair' },
    looks: [['A stone chair, worn smooth in the seat.', 'Somebody sat here and waited a long time.'], "I'm not sitting in it. It's still somebody's."],
  },
  { id: 'keeper_cup', x: 3, y: 4, look: 'A cup. Empty three hundred years, by the look of it. I know that cup. Every teacher has that cup.' },
  {
    id: 'ledger', x: 4, y: 4, interact: readLedger,
    use: { paper_charcoal: (g) => g.describe("It's his handwriting, not a carving. I'll remember it."), '*': cherylDeclines },
  },
].map((o) => ({ solid: false, use: founderUse, ...o }));

export const chartMap = composedMap(composeChart, {
  ...UNDER,
  id: 'chart_room',
  lightArea: [[1, 1, 14, 12], [7, 13, 2, 1]], // light stays inside the room and its walls
  name: 'The Chart Room',
  tileset: act3Tiles,
  spawn: [7, 12],
  darkness: () => dim,
  lights: chartLights,
  playerLight: discLight(3),
  exits: [
    { x: 7, y: 13, w: 2, to: 'lamp_halls', at: [25, 1], facing: 'down', sfx: 'step_hullstone' },
    { x: 7, y: 2, w: 2, when: unbolted, run: throughFoundersDoor },
  ],
  onEnter: async (g) => {
    g.setWrongness(WRONGNESS);
    keepLoops(g, []);
    sweep = null;
    dim = 0.5;
    if (!g.flag('chart.seen')) await firstLook(g);
  },
  entities: [...inlay, ...keeperObjects],
});

// Named scripts (runnable with ?run=, and visible to npm run check).
export const chartScripts = { chart_first_look: firstLook, takeRubbing, readLedger, drawBolt };
