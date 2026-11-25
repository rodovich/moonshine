// The Belfry (10 × 10), the top of the Bell Tower: the great bell, the
// Clockmaker's drive clamped onto its linkage, the DO NOT TOUCH lever, and the
// old rope going down through the floor (docs/design/04-the-list.md).
//
//       0123456789
//    0  ##########
//    1  #w#w##w#w#   w belfry openings
//    2  #........#   the bell hangs overhead over (3-4, 2-3)
//    3  #.....GG.#   GG the clock drive (6-7, 3-4)
//    4  #...r.GGL#   r the old bell rope (4, 4); L the lever (8, 4)
//    5  #...o....#   o the rope hole (4, 5)
//    6  #tt......#   tt the workbench (1-2, 6)
//    7  #........#
//    8  #^^......#   ^^ the stair down (1-2, 8)
//    9  ##########

import { composedMap, blankGrid, bump, cycle, cherylDeclines } from './common.js';
import { act4Tiles } from './tiles.js';
import { belfry_rope } from '../../art/act4_surface.js';
import { ambrose as ambroseArt } from '../../art/act2_npcs.js';

const W = 10, H = 10;

function compose(g) {
  const f = (n) => g.flag(n);
  const ground = blankGrid(W, H), detail = blankGrid(W, H), overhead = blankGrid(W, H);
  const solid = blankGrid(W, H, false);
  const step = blankGrid(W, H, 'step_wood');
  const set = (layer, x, y, ref, s) => { layer[y][x] = ref; if (s !== undefined) solid[y][x] = s; };
  const hash = (x, y) => ((x * 7 + y * 13) % 5);
  for (let y = 2; y <= 8; y++) for (let x = 1; x <= 8; x++) set(ground, x, y, `belfry:floor_${'abcab'[hash(x, y)]}`, false);
  for (let x = 0; x < W; x++) {
    set(ground, x, 0, 'belfry:wall_upper', true);
    set(ground, x, 1, [1, 3, 6, 8].includes(x) ? 'belfry:opening' : 'belfry:wall_lower', true);
    set(ground, x, 9, 'belfry:wall_south', true);
  }
  for (let y = 2; y <= 8; y++) { set(ground, 0, y, 'belfry:wall_side', true); set(ground, 9, y, 'belfry:wall_side', true); }
  set(ground, 4, 5, 'belfry:floor_hole', true);
  set(ground, 1, 8, 'belfry:stair_l', false); set(ground, 2, 8, 'belfry:stair_r', false);
  step[8][1] = step[8][2] = 'step_stairs';
  // The bell, overhead; it swings on each stroke (fx.bell: 1 west, 2 east).
  const swing = f('fx.bell') || 0;
  for (let y = 0; y < 2; y++) for (let x = 0; x < 2; x++) overhead[2 + y][3 + x] = `belfry_bell:over_bell_x${x}y${y}_${swing}`;
  // The Clockmaker's drive, ticking, or lifted off the linkage.
  const drive = f('clock.lifted') ? 'drive_lifted' : 'drive';
  for (let y = 0; y < 2; y++) for (let x = 0; x < 2; x++) set(detail, 6 + x, 3 + y, `belfry_props:${drive}_x${x}y${y}`, true);
  set(detail, 8, 4, f('clock.lifted') ? 'belfry_props:lever_pulled' : 'belfry_props:lever_up', true);
  set(detail, 1, 6, 'belfry_props:bench_l', true); set(detail, 2, 6, 'belfry_props:bench_r', true);
  solid[4][4] = true; // the rope
  return { ground, detail, overhead, solid, step };
}

// ---------------------------------------------------------------------------

const objects = [
  { id: 'bell', x: 3, y: 2, w: 2, h: 2, look: 'The bell. Green and enormous, and much older than the tower around it. It looks like it\'s listening.' },
  {
    id: 'drive', x: 6, y: 3, w: 2, h: 2,
    interact: (g) => {
      if (g.flag('clock.lifted')) return g.describe('Still. Not even a tick. It looks embarrassed.');
      return g.describe(bump(g, 'belfry.drive') === 0
        ? 'The Clockmaker\'s machine, clamped onto the old bell linkage like a leech. Tick, tick, tick.'
        : "It's got its hooks in the bell. Ambrose is right.");
    },
  },
  {
    id: 'lever', x: 8, y: 4,
    interact: async (g) => {
      if (g.flag('clock.lifted')) return g.describe('Pulled. DO NOT TOUCH. I touched it.');
      if (bump(g, 'belfry.lever') === 0) {
        return g.describe('A lever. A card hung on it, in his handwriting: DO NOT TOUCH. VERY IMPORTANT.', 'Every pupil I ever had knew what a sign like that is for.');
      }
      return pullLever(g);
    },
  },
  {
    id: 'rope', x: 4, y: 4,
    interact: async (g) => {
      if (g.flag('bell.restored')) return g.describe("Ambrose's rope. I'm not touching it now. It's his.");
      if (!g.flag('clock.lifted')) return g.describe(bump(g, 'belfry.rope') === 0
        ? "The bell's old rope, hanging through a hole in the floor. It goes down much further than the ground floor."
        : 'Not while that machine has hold of it.');
      g.pose('player', 'reach_up');
      g.sfx('bell_stroke', { volume: 0.5 });
      g.setFlag('fx.bell', 1);
      await g.wait(0.25);
      g.setFlag('fx.bell', 0);
      g.pose('player', null);
      return g.describe('Clang. And nothing.', "Ambrose would say I've no idea when the tide turns. He'd be right. I'll fetch Ambrose.");
    },
  },
  { id: 'rope_hole', x: 4, y: 5, look: 'A hole in the floor, worn smooth by a rope. Cold air comes up it. It smells like the well.' },
  {
    id: 'workbench', x: 1, y: 6, w: 2,
    looks: [
      ['Tools laid out in perfect rows. Letters to the observatory, stacked by date.', "The top one says, 'Sirs, I must again draw your attention to the sun.'"],
      "'Sirs, I must again draw your attention to the sun.'",
    ],
  },
  ...[1, 3, 6, 8].map((x) => ({
    id: `opening_${x}`, x, y: 1, lookKey: 'openings',
    look: "All of Tessel, and the Bowl, and the Gate. From up here the town looks like it's leaning. It is leaning.",
  })),
].map((o) => ({ solid: false, use: { '*': cherylDeclines }, ...o }));

async function pullLever(g) {
  g.facePlayer('right');
  g.pose('player', 'reach_right');
  g.sfx('lever_clank');
  await g.wait(0.3);
  g.setFlag('clock.lifted');
  g.pose('player', null);
  g.stopLoop('belfry_tick', 0);
  g.sfx('clock_rundown');
  await g.wait(0.9);
  g.sfx('clamp_lift');
  g.setFlag('fx.rope', 'swing');
  await g.wait(1.4);
  g.setFlag('fx.rope', null);
  await g.describe('There. Unclamped.', "In thirty years of teaching, I never once touched a sign that said DO NOT TOUCH. I'm making up for lost time.");
}

// ---------------------------------------------------------------------------
// The ringing (design: "In the belfry: the ringing").

const FLYLEAF = [
  "'Moonshine, moonshine, catch it in a cup, ring the bell when the tide turns up.'",
  "'...sister, ...sister, Middle sister three, wake them one by one and they'll drink up the sea.'",
  'The first two names are under a tea stain.',
];
const FLYLEAF_END = [
  "'Middle sister's greedy, put her back to bed, or up jumps Tessel and bumps her head.'",
  "'Pull the old tooth when the bell says when, wind her in slowly, and home again.'",
  "'Moon in the Gate and moon in the bowl, Tessel's asleep and Tessel is whole.'",
];

export async function showFlyleaf(g, amb) {
  g.pose(amb, 'ledger_down');
  await g.describe(...FLYLEAF);
  await g.say(amb, 'TEA. MY GRANDFATHER. THE WINTER OF THE BIG FREEZE. WE DON\'T TALK ABOUT IT.');
  await g.describe(...FLYLEAF_END);
  g.pose(amb, null);
}

export async function ringTheBell(g) {
  const amb = g.npc('ambrose_belfry');
  g.faceNpc(amb, 'up');
  await g.say(amb, "THE TURN'S AT TWENTY PAST. TULLS DON'T NEED CLOCKS. WE NEED KNEES.");
  g.pose(amb, 'ring_up_0');
  await g.wait(2);
  g.sfx('gull');
  await g.wait(1.2);
  await g.say(amb, '...NOW.');
  for (let i = 0; i < 3; i++) {
    g.pose(amb, 'ring_up_1');
    g.setFlag('fx.rope', 'run');
    g.setFlag('fx.bell', 1);
    g.sfx('bell_stroke');
    g.shake(1, 0.4);
    g.tint('lamp_warm', 0.18, 0.1, 'screen').then(() => g.tint('lamp_warm', 0, 0.6, 'screen'));
    await g.wait(0.5);
    g.setFlag('fx.bell', 0);
    g.pose(amb, 'ring_up_2');
    await g.wait(0.45);
    g.setFlag('fx.bell', 2);
    g.setFlag('fx.rope', 'swing');
    await g.wait(0.45);
    g.setFlag('fx.bell', 0);
    g.pose(amb, 'ring_up_0');
    await g.wait(0.6);
  }
  g.setFlag('fx.rope', null);
  // Under everything, something enormous begins to turn.
  await g.wait(1.2);
  g.sfx('thrum_rise');
  await g.shake(2, 2.4);
  g.startLoop('thrum', { fadeMs: 1500 });
  g.setFlag('bell.restored');
  g.setFlag('mayor.atCrown');
  g.pose(amb, null);
  g.faceNpc(amb, 'player');
  await g.describe('Under the floor, under the tower, under all of it, something very big has started to turn.', 'I can feel it in my teeth.');
  await g.say(amb, "THERE. HEAR THAT? THAT'S THE SEA SAYING THANK YOU.", "HERE. YOU'VE EARNED A LOOK. MY GRANDMOTHER'S HAND.");
  g.setFlag('read.flyleaf');
  await showFlyleaf(g, amb);
  await g.think("It's the skipping rhyme. All of it. It's instructions.");
}

const ambroseBelfry = {
  id: 'ambrose_belfry', name: 'Ambrose', x: 4, y: 3, facing: 'up',
  sprite: { sheet: ambroseArt },
  when: (g) => !!g.flag('ambrose.inBelfry'),
  interact: async (g, self) => {
    if (bump(g, 'ambrose.belfry') === 0) return g.say(self, "I'LL BE HERE. EVERY TURN. TELL THE MAYOR. NO. DON'T. I'LL TELL HIM MYSELF.");
    const n = bump(g, 'ambrose.belfryRepeat');
    if (n % 2 === 1) {
      await g.say(self, 'THE LEDGER? GO ON.');
      return showFlyleaf(g, self);
    }
    return g.say(self, 'TWENTY PAST, AND TEN TO NINE TONIGHT. THE SEA KEEPS BETTER TIME THAN HE DOES.');
  },
  use: {
    ship_plan: (g, self) => g.say(self, 'A ROPE FROM THE BELL TO A WHEEL. I KNEW IT. I ALWAYS KNEW IT WAS ATTACHED TO SOMETHING.'),
    copper_throat: (g, self) => g.say(self, 'COPPER. GOOD FOR BELLS. NOT FOR THIS ONE.'),
    '*': (g, self) => g.say(self, "I DON'T WANT THAT. I'VE GOT MY BELL."),
  },
};

// The old rope: a 16×32 sprite anchored on the hole, swinging or running.
const rope = {
  id: 'rope_sprite', x: 4, y: 5, solid: false, shadow: false,
  sprite: (g) => ({ sheet: belfry_rope, frame: { swing: 'rope_swing', run: 'rope_run' }[g.flag('fx.rope')] || 'rope_still' }),
};

export const belfryMap = composedMap(compose, {
  id: 'belfry',
  name: 'The Belfry',
  tileset: act4Tiles,
  lighting: 'day',
  spawn: [2, 7],
  exits: [{ x: 1, y: 8, w: 2, to: 'crown', at: [4, 7], facing: 'down' }],
  onEnter: async (g) => {
    g.playMusic('neighborhood');
    if (!g.flag('clock.lifted')) g.startLoop('belfry_tick');
    else g.stopLoop('belfry_tick', 0);
  },
  entities: [rope, ...objects, ambroseBelfry],
});

