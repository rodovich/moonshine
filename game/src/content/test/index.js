// Engine test content: two small maps with placeholder art that exercise
// every engine feature (NPC dialog and choices, item pickup, use-item, a door
// to a second map, overhead layer, counter talk, wandering NPC, animated
// water, triggers, and a scripted sequence with screen effects).
//
// Reach it with ?map=test_yard (or test_house). Content authors: this is a
// working example of everything in src/engine/README.md.

import { outdoorTiles as O, buildingTiles as B, indoorTiles as I, testProps, testItems, testPerson } from './art.js';

export const testTileset = {
  tiles: {
    grass: { sheet: O },
    grass_tuft: { sheet: O },
    flowers: { sheet: O },
    path: { sheet: O },
    water: { sheet: O, solid: true, fps: 3 },
    trunk: { sheet: O, solid: true },
    canopy_tl: { sheet: O }, canopy_t: { sheet: O }, canopy_tr: { sheet: O },
    canopy_bl: { sheet: O }, canopy_b: { sheet: O }, canopy_br: { sheet: O },
    wall: { sheet: B, solid: true },
    window: { sheet: B, solid: true },
    door: { sheet: B },
    roof: { sheet: B, solid: true },
    roof_edge: { sheet: B, solid: true },
    stone: { sheet: B, solid: true },
    pillar: { sheet: B, solid: true },
    arch_l: { sheet: B }, arch_m: { sheet: B }, arch_r: { sheet: B },
    floor: { sheet: I },
    inwall: { sheet: I, solid: true },
    inwall_top: { sheet: I, solid: true },
    rug: { sheet: I },
    counter: { sheet: I, solid: true, counter: true },
    doormat: { sheet: I },
    void: { sheet: I, solid: true },
  },
};

const person = (palette) => ({ sheet: testPerson, palette });

export const testItemDefs = {
  brass_key: {
    name: 'Brass Key',
    icon: { sheet: testItems, frame: 'brass_key' },
    description: "Warm from the sun. Somebody lost it, and somebody's going to want it back.",
  },
  letter: {
    name: 'Sealed Letter',
    icon: { sheet: testItems, frame: 'letter' },
    description: "Addressed to \"The Shop.\" The wax seal has a little crescent moon pressed into it. I'm not going to open it. Probably.",
  },
};

const yard = {
  id: 'test_yard',
  name: 'Test Yard',
  tileset: testTileset,
  music: 'test_yard',
  background: 'ph_grass_dark',
  spawn: [5, 6],
  legend: {
    '.': 'grass', ',': 'grass_tuft', '*': 'flowers', '=': 'path', '~': 'water',
    '#': 'stone', R: 'roof', E: 'roof_edge', W: 'wall', N: 'window', D: 'door', T: 'trunk', P: 'pillar',
    '(': 'canopy_tl', '^': 'canopy_t', ')': 'canopy_tr', '[': 'canopy_bl', '_': 'canopy_b', ']': 'canopy_br',
    '<': 'arch_l', '-': 'arch_m', '>': 'arch_r',
  },
  ground: [
    '........................',
    '........................',
    '................=.......',
    '........,.......=.......',
    '................=...*...',
    '.....=..........=.......',
    '.....=...*......=.......',
    '.....=..........=.......',
    '.....=....,.....=...,...',
    '.....=..........=.......',
    '.....============.......',
    '................=..*....',
    '..~~~~..........=.......',
    '..~~~~~.....*...=.......',
    '..~~~~~.........=.......',
    '...~~~..........=.....,.',
    '...............===......',
    '...............===......',
  ],
  objects: [
    '########################',
    '# RRRRRRR              #',
    '# RRRRRRR              #',
    '# EEEEEEE              #',
    '# WNWDWNW  T           #',
    '#                      #',
    '#                      #',
    '#              P P     #',
    '#              P P     #',
    '#                      #',
    '#                      #',
    '#                      #',
    '#                      #',
    '#                   T  #',
    '#                      #',
    '#                      #',
    '#                      #',
    '###############   ######',
  ],
  overhead: [
    '                        ',
    '                        ',
    '          (^)           ',
    '          [_]           ',
    '                        ',
    '                        ',
    '               <->      ',
    '                        ',
    '                        ',
    '                        ',
    '                        ',
    '                   (^)  ',
    '                   [_]  ',
    '                        ',
    '                        ',
    '                        ',
    '                        ',
    '                        ',
  ],
  exits: [
    { x: 5, y: 4, to: 'test_house', at: [4, 8], facing: 'up' },
    // A three-tile edge exit: the player keeps their offset across it.
    { x: 15, y: 17, w: 3, to: 'test_lane', at: [8, 1], facing: 'down' },
  ],
  triggers: [
    {
      x: 7, y: 12, h: 4,
      when: (g) => !g.flag('saw_pond'),
      run: async (g) => {
        g.setFlag('saw_pond');
        await g.think('A pond. When did they put in a pond?');
      },
    },
  ],
  onEnter: async (g) => {
    if (g.flag('yard_intro')) return;
    g.setFlag('yard_intro');
    await g.wait(0.3);
    await g.think('Right. The engine test yard. Everything here is pretend, including me.');
  },
  entities: [
    {
      id: 'old_man',
      name: 'Old Man',
      x: 8, y: 7, facing: 'down',
      sprite: person('old_man'),
      behavior: 'face',
      interact: async (g, self) => {
        if (g.flag('chest_open')) {
          await g.say(self, 'You opened my chest! I never could find that key.', 'Go on, take the letter to the shop. It was always meant to go there.');
          return;
        }
        await g.say(self, "Afternoon. Don't mind me, I'm watching the grass.");
        const i = await g.choose('Is it doing anything?', ['Growing', 'Not really'], { speaker: self });
        if (i === 0) await g.say(self, 'Slowly! That\'s the trick of it. You have to be slower than the grass.');
        else await g.say(self, 'That\'s what it wants you to think.');
        if (!g.hasItem('brass_key')) await g.say(self, 'If you see a little brass key, it\'s mine. I dropped it near the pond.');
      },
      use: {
        brass_key: async (g, self) => {
          await g.say(self, 'My key! Keep it, keep it. Open my chest over by the tree for me, would you? My knees.');
        },
      },
    },
    {
      id: 'kid',
      name: 'Sweaty Kid',
      x: 19, y: 4,
      sprite: person('kid'),
      behavior: { type: 'wander', area: [18, 2, 5, 6], pause: [1, 2.5] },
      talk: ["I'm not running. I'm walking really fast in a circle.", "Don't tell my mom."],
    },
    {
      id: 'sign',
      x: 6, y: 6,
      sprite: { sheet: testProps, frame: 'sign' },
      look: ['"ENGINE TEST YARD. Please do not feed the placeholders."', 'Somebody has drawn a little moon in the corner.'],
    },
    {
      id: 'key',
      x: 13, y: 14,
      solid: false,
      layer: 'ground',
      sprite: { sheet: testItems, frame: 'key_glint', fps: 1.5 },
      when: (g) => !g.flag('got_key'),
      interact: async (g) => {
        g.setFlag('got_key');
        g.remove('key');
        await g.giveItem('brass_key');
        await g.describe('A little brass key, warm from the sun.');
      },
    },
    {
      id: 'chest',
      x: 21, y: 15,
      sprite: { sheet: testProps, frame: 'chest_closed' },
      when: (g) => !g.flag('chest_open'),
      look: "A sturdy little chest. Locked. Of course it's locked.",
      use: {
        brass_key: async (g) => {
          g.takeItem('brass_key');
          g.setFlag('chest_open');
          g.sfx('select');
          await g.describe('The key turns with a satisfying clunk.');
          await g.giveItem('letter');
        },
      },
    },
    {
      id: 'chest_open',
      x: 21, y: 15,
      sprite: { sheet: testProps, frame: 'chest_open' },
      when: (g) => !!g.flag('chest_open'),
      look: 'Empty now, apart from a smell of cedar and old paper.',
    },
  ],
};

const house = {
  id: 'test_house',
  name: 'Test Shop',
  tileset: testTileset,
  music: 'test_shop',
  spawn: [4, 8],
  legend: { x: 'inwall_top', v: 'void', w: 'inwall', '.': 'floor', r: 'rug', c: 'counter', m: 'doormat' },
  ground: [
    'xxxxxxxxxx',
    'vwwwwwwwwv',
    'v........v',
    'v........v',
    'vcccc....v',
    'v........v',
    'v...rrr..v',
    'v...rrr..v',
    'v........v',
    'vvvvmvvvvv',
  ],
  exits: [
    { x: 4, y: 9, to: 'test_yard', at: [5, 5], facing: 'down' },
  ],
  entities: [
    {
      id: 'shopkeeper',
      name: 'Shopkeeper',
      x: 2, y: 3, facing: 'down',
      sprite: person('shopkeeper'),
      interact: async (g, self) => {
        if (g.flag('letter_delivered')) {
          await g.say(self, "We're closed. We've always been closed. Please come again.");
          return;
        }
        await g.say(self, 'Welcome! Everything in the shop is free today, on account of there being nothing in the shop.');
      },
      use: {
        letter: deliverLetter,
      },
    },
  ],
};

const lane = {
  id: 'test_lane',
  name: 'Test Lane',
  tileset: testTileset,
  music: 'test_yard',
  spawn: [9, 1],
  legend: { '.': 'grass', ',': 'grass_tuft', '*': 'flowers', '=': 'path', '#': 'stone' },
  ground: [
    '........===.........',
    '........===.........',
    '........===....*....',
    '........===.........',
    '........==========..',
    '.................=..',
    '..*..............=..',
    '.................=..',
    '.......,.........=..',
    '.................=..',
    '....................',
    '....................',
  ],
  objects: [
    '########   #########',
    '#                  #',
    '#                  #',
    '#                  #',
    '#                  #',
    '#                  #',
    '#                  #',
    '#                  #',
    '#                  #',
    '#                  #',
    '#                  #',
    '####################',
  ],
  exits: [
    { x: 8, y: 0, w: 3, to: 'test_yard', at: [15, 16], facing: 'up' },
  ],
  // First visit: pan the camera to the sign and back.
  onEnter: async (g) => {
    if (g.flag('lane_intro')) return;
    g.setFlag('lane_intro');
    await g.panCamera(17, 8);
    await g.wait(0.4);
    await g.think('A dead end with a sign. Signs at dead ends are never good news.');
    await g.followPlayer();
  },
  entities: [
    {
      id: 'lane_sign',
      x: 18, y: 9,
      sprite: { sheet: testProps, frame: 'sign' },
      look: '"DEAD END. For now."',
    },
  ],
};

// The scripted sequence: walking, camera, and the screen effects the
// Wrongness can use.
async function deliverLetter(g, self) {
  g.takeItem('letter');
  await g.say(self, 'A letter? For the shop? Nobody writes to the shop.');
  await g.moveNpc(self, [6, 3]);
  await g.moveNpc(self, ['down', 'down']);
  g.faceNpc(self, 'player');
  await g.say(self, 'Let me just...');
  g.playMusic('wrongness');
  await Promise.all([g.tint('ph_purple_dark', 0.45, 1.2, 'multiply'), g.distort(2, 1.2)]);
  await g.shake(3, 0.6);
  await g.flicker(0.5);
  await g.hueShift(140, 0.6);
  await g.say(self, 'The letter is blank. It was always blank. Why did I think it would say something?');
  await g.think("Did the floor just... breathe? No. Floors don't do that.");
  await g.clearEffects(0.8);
  g.playMusic('test_shop');
  await g.moveNpc(self, [2, 3]);
  g.faceNpc(self, 'down');
  g.setFlag('letter_delivered');
  await g.say(self, "Sorry. Where was I? Welcome! We're closed.");
}

export const testMaps = { test_yard: yard, test_house: house, test_lane: lane };

export const testScripts = {
  // ?map=test_house&x=2&y=5&facing=up&items=letter&run=wrongness
  wrongness: async (g) => deliverLetter(g, g.npc('shopkeeper')),
};
