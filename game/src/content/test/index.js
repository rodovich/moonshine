// Engine test content: three small maps built from the real city art (the
// shop interior uses placeholder tiles until interiors are drawn). Together
// they exercise every engine feature: NPC dialog and choices, a look counter,
// item pickup, using an item on a door, a door and an edge exit, detail and
// overhead layers, a patrolling NPC, lighting that changes with the story,
// and two scripted sequences (the shopkeeper's Wrongness and a moonrise-style
// vista with auto-advancing shouts and a text card).
//
// Reach it with ?map=test_street (or test_shop, test_lane). Content authors:
// this is a working example of everything in src/engine/README.md.

import { street } from '../../art/street.js';
import { buildings } from '../../art/buildings.js';
import { rooftiles } from '../../art/rooftiles.js';
import { props } from '../../art/props.js';
import { cloth } from '../../art/cloth.js';
import { canal } from '../../art/canal.js';
import { items } from '../../art/items.js';
import { old_man, kid, shopkeeper } from '../../art/npcs.js';
import { COLORS } from '../../art/palette.js';
import { indoorTiles as I } from './art.js';

// Tiles can be named here or referenced directly from a legend as
// 'sheet:frame' or 'sheet:frame@palette' (sheets listed under `sheets`).
export const testTileset = {
  sheets: { street, buildings, rooftiles, props, cloth, canal },
  tiles: {
    // Paving is a 2×2 macro-tile: the frame is picked by position.
    pave: { sheet: street, pattern: [['pave_nw', 'pave_ne'], ['pave_sw', 'pave_se']] },
    floor: { sheet: I },
    inwall: { sheet: I, solid: true },
    inwall_top: { sheet: I, solid: true },
    void: { sheet: I, solid: true },
    rug: { sheet: I },
    counter: { sheet: I, solid: true, counter: true },
    doormat: { sheet: I },
  },
};

const solid = (tile) => ({ tile, solid: true });

export const testItemDefs = {
  brass_key: {
    name: 'Brass Key',
    icon: { sheet: items, frame: 'key' },
    description: "Warm from the sun. Somebody lost it, and somebody's going to want it back.",
  },
  letter: {
    name: 'Sealed Letter',
    icon: { sheet: items, frame: 'letter' },
    description: 'Addressed to "The Shop." The wax seal has a little crescent moon pressed into it. I\'m not going to open it. Probably.',
  },
};

// Dusk until the letter is delivered; night after.
const storyLight = (g) => (g.flag('letter_delivered') ? 'night' : 'dusk');

const streetMap = {
  id: 'test_street',
  name: 'Test Street',
  tileset: testTileset,
  music: 'neighborhood',
  lighting: storyLight,
  spawn: [5, 7],
  legend: {
    // House A (whitewash and cobalt, the base palette)
    a: solid('buildings:roof_l'), b: solid('buildings:roof'), c: solid('buildings:roof_r'), C: solid('buildings:roof_chimney'),
    d: solid('buildings:roof_front_l'), e: solid('buildings:roof_front'), f: solid('buildings:roof_front_r'),
    g: solid('buildings:wall_l'), h: solid('buildings:window_box'), i: solid('buildings:wall'), j: solid('buildings:door_top'),
    k: solid('buildings:window'), l: solid('buildings:wall_r'),
    m: solid('buildings:wall_base_l'), n: solid('buildings:wall_base'), o: solid('buildings:door_bot'),
    p: solid('buildings:window_base'), q: solid('buildings:wall_base_r'),
    // Shop B (ochre, tiled roof with overhead eaves)
    1: solid('rooftiles:ridge_l'), 2: solid('rooftiles:ridge'), 3: solid('rooftiles:ridge_r'),
    4: solid('rooftiles:tiles_l'), 5: solid('rooftiles:tiles'), 6: solid('rooftiles:tiles_moss'), 7: solid('rooftiles:tiles_r'),
    A: solid('buildings:wall_l@ochre'), B: solid('buildings:wall@ochre'), D: solid('buildings:wall_r@ochre'),
    E: solid('buildings:window_box@ochre'), F: solid('buildings:window_closed@ochre'), G: solid('buildings:door_top@ochre'),
    H: solid('buildings:window@ochre'),
    I: solid('buildings:wall_base_l@ochre'), J: solid('buildings:wall_base@ochre'), K: solid('buildings:window_closed_base@ochre'),
    L: 'buildings:door_bot@ochre', M: solid('buildings:window_base@ochre'), N: solid('buildings:wall_base_r@ochre'),
    // House C (sky blue)
    r: solid('buildings:roof_l@sky'), s: solid('buildings:roof@sky'), t: solid('buildings:roof_r@sky'), u: solid('buildings:roof_hatch@sky'),
    v: solid('buildings:roof_front_l@sky'), w: solid('buildings:roof_front@sky'), x: solid('buildings:roof_front_r@sky'),
    y: solid('buildings:wall_l@sky'), z: solid('buildings:window@sky'), O: solid('buildings:balcony@sky'), P: solid('buildings:wall@sky'),
    Q: solid('buildings:window_closed@sky'), S: solid('buildings:window_box@sky'), T: solid('buildings:wall_r@sky'),
    U: solid('buildings:wall_base_l@sky'), V: solid('buildings:window_base@sky'), W: solid('buildings:wall_base@sky'),
    X: solid('buildings:window_closed_base@sky'), Y: solid('buildings:wall_base_r@sky'),
    // Street, terrace, canal
    '.': 'pave', '%': 'street:pave_se_crack',
    '=': solid('street:retain_top'), _: solid('street:retain_base'), '<': 'street:stairs_l', '>': 'street:stairs_r',
    '-': solid('canal:bank_n'), '~': solid('canal:water'), '^': solid('canal:bank_s'), Z: solid('canal:water_shadow'),
    '[': 'canal:bridge_n_l', ']': 'canal:bridge_n_r', '{': 'canal:bridge_down_l', '}': 'canal:bridge_down_r',
    '(': 'canal:bridge_up_l', ')': 'canal:bridge_up_r', '/': 'canal:bridge_s_l', '\\': 'canal:bridge_s_r',
    // Detail layer (on the ground, under characters)
    '*': solid('props:pot_geranium'), '&': solid('props:pot_bay'), '#': solid('props:crate'), '|': solid('props:lamp_post'),
    '+': solid('canal:mooring_post'), 9: solid('props:bench_l'), 0: solid('props:bench_r'),
    // Overhead layer
    8: 'props:over_lamp_top', ';': 'rooftiles:over_eave_l', ':': 'rooftiles:over_eave', '?': 'rooftiles:over_eave_r',
    '@': 'cloth:over_awning_l', $: 'cloth:over_awning_m', '`': 'cloth:over_awning_r',
    "'": 'cloth:over_vine_l', '"': 'cloth:over_vine_r',
  },
  ground: [
    'abbbbbbc12222223rsssssst',
    'abbCbbbc45565557rsssusst',
    'deeeeeefABBBBBBDvwwwwwwx',
    'ghijikilAEFBGBHDyzOPQSzT',
    'mnnonpnqIJKJLJMNUVWWXWVY',
    '........................',
    '........................',
    '...........%............',
    '........................',
    '........................',
    '====<>==================',
    '____<>__________________',
    '........................',
    '----------------[]------',
    '~~~~~~~~~~~~~~~~{}Z~~~~~',
    '~~~~~~~~~~~~~~~~()Z~~~~~',
    '^^^^^^^^^^^^^^^^/\\^^^^^^',
    '........................',
  ],
  detail: [
    '                        ',
    '                        ',
    '                        ',
    '                        ',
    '                        ',
    ' *             *      & ',
    '                        ',
    '       |                ',
    '                    #   ',
    ' 90                     ',
    '                        ',
    '                        ',
    '+                      +',
    '                        ',
    '                        ',
    '                        ',
    '                        ',
    '                        ',
  ],
  overhead: [
    '                        ',
    '                        ',
    '        ;::::::?        ',
    '                        ',
    '             @$`        ',
    '                        ',
    '       8                ',
    '                        ',
    '                        ',
    '                        ',
    "            '\"          ",
    '                        ',
    '                        ',
    '                        ',
    '                        ',
    '                        ',
    '                        ',
    '                        ',
  ],
  exits: [
    { x: 12, y: 4, to: 'test_shop', at: [4, 8], facing: 'up' },
    // A two-tile edge exit: the player keeps their offset across it.
    { x: 16, y: 17, w: 2, to: 'test_lane', at: [8, 1], facing: 'down' },
  ],
  triggers: [
    {
      x: 0, y: 12, w: 24,
      when: (g) => !g.flag('saw_canal'),
      run: async (g) => {
        g.setFlag('saw_canal');
        await g.think('The canal. It smells of salt and somebody\'s supper.');
      },
    },
  ],
  onEnter: async (g) => {
    if (g.flag('street_intro')) return;
    g.setFlag('street_intro');
    await g.wait(0.3);
    await g.think('Right. The engine test street. Everything here is pretend, including me.');
    g.hint(g.usingTouch ? 'Tap to walk   Tap things to look' : 'Arrows: walk   Z: look/talk   X: bag');
  },
  entities: [
    {
      id: 'old_man',
      name: 'Old Man',
      x: 9, y: 7, facing: 'down',
      sprite: { sheet: old_man },
      behavior: 'face',
      interact: async (g, self, looks) => {
        if (g.flag('letter_delivered')) {
          await g.say(self, 'Getting dark early tonight. Darker than it ought to.');
          return;
        }
        if (looks > 0) {
          await g.say(self, g.hasItem('letter') ? 'The shop. With the awning. Go on.' : 'Did you lose my letter? No? Good.');
          return;
        }
        await g.say(self, "Evening. Don't mind me, I'm watching the canal.");
        const i = await g.choose('Is it doing anything?', ['Flowing', 'Not really'], { speaker: self });
        if (i === 0) await g.say(self, 'Slowly! That\'s the trick of it. You have to be slower than the water.');
        else await g.say(self, 'That\'s what it wants you to think.');
        await g.say(self, 'Would you take this to the shop for me? The door sticks. I dropped my key down by the water.');
        await g.giveItem('letter');
      },
      use: {
        brass_key: async (g, self) => {
          await g.say(self, 'My key! Keep it, keep it. The shop door, with the awning. My knees won\'t do it.');
        },
      },
    },
    {
      id: 'kid',
      name: 'Sweaty Kid',
      x: 14, y: 6,
      sprite: { sheet: kid },
      // Stops and faces Cheryl when she's within 2 tiles or walking over to him.
      behavior: { type: 'patrol', route: [[14, 6], [19, 6], [19, 9], [14, 9]], stopNear: 2 },
      talk: ["I'm not running. I'm walking really fast in a square.", "Don't tell my mum."],
    },
    {
      id: 'cat',
      x: 10, y: 9,
      sprite: { sheet: props, frame: 'cat' },
      // Look counter: a different line each time, then the last one repeats.
      looks: [
        'A ginger cat. It is pretending I don\'t exist.',
        'Still pretending. It\'s very good at it.',
        ['We\'ve reached an understanding.', 'The understanding is that I\'m furniture.'],
      ],
    },
    {
      id: 'sign',
      x: 10, y: 5,
      sprite: { sheet: props, frame: 'sign_board' },
      look: ['"ENGINE TEST STREET. Please do not feed the placeholders."', 'Somebody has drawn a little moon in the corner.'],
    },
    {
      id: 'key',
      x: 3, y: 12,
      solid: false,
      layer: 'ground',
      sprite: { sheet: items, frame: 'key' },
      when: (g) => !g.flag('got_key'),
      interact: async (g) => {
        g.setFlag('got_key');
        await g.giveItem('brass_key');
        await g.describe('A little brass key, warm from the sun.');
        // A one-time hint that stays until the bag is opened.
        if (!g.flag('bag_hint')) {
          g.setFlag('bag_hint');
          g.hint(g.usingTouch ? 'Tap the bag, pick something, then tap where it goes.' : 'X: bag. Pick something, then use it on someone or something.', Infinity, { untilBag: true });
        }
      },
    },
    {
      // A hotspot with no sprite: the locked shop door. Solid until unlocked.
      id: 'shop_door',
      x: 12, y: 4,
      when: (g) => !g.flag('door_unlocked'),
      looks: [
        ['The shop door. Locked, with a card in the window: BACK SOON.'],
        "Still locked. 'Soon' is doing a lot of work on that card.",
      ],
      use: {
        brass_key: async (g) => {
          g.takeItem('brass_key');
          g.setFlag('door_unlocked');
          g.sfx('door');
          await g.describe('The key turns with a satisfying clunk.');
        },
      },
    },
    {
      id: 'blue_door',
      x: 3, y: 4,
      lookKey: 'doors', // shares a look counter with any other 'doors'
      looks: ['A blue door. Everyone in Tessel has a blue door.', 'Nobody remembers deciding.'],
    },
  ],
};

const shopMap = {
  id: 'test_shop',
  name: 'Test Shop',
  tileset: testTileset,
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
    { x: 4, y: 9, to: 'test_street', at: [12, 5], facing: 'down' },
  ],
  entities: [
    {
      id: 'shopkeeper',
      name: 'Shopkeeper',
      x: 2, y: 3, facing: 'down',
      sprite: { sheet: shopkeeper },
      interact: async (g, self) => {
        if (g.flag('letter_delivered')) {
          await g.say(self, "We're closed. We've always been closed. Please come again.");
          return;
        }
        await g.say(self, 'Welcome! Everything in the shop is free today, on account of there being nothing in the shop.');
      },
      use: { letter: deliverLetter },
    },
  ],
};

const laneMap = {
  id: 'test_lane',
  name: 'Test Lane',
  tileset: testTileset,
  music: 'neighborhood',
  lighting: storyLight,
  spawn: [8, 2],
  legend: {
    '.': 'pave', '!': 'street:pave_wrong',
    '=': solid('street:retain_top'), _: solid('street:retain_base'), '<': 'street:stairs_l', '>': 'street:stairs_r',
    '-': solid('canal:bank_n'), '~': solid('canal:water'),
  },
  ground: [
    '========<>==========',
    '________<>__________',
    '....................',
    '....................',
    '....................',
    '....................',
    '..............!.....',
    '....................',
    '....................',
    '....................',
    '--------------------',
    '~~~~~~~~~~~~~~~~~~~~',
  ],
  // The lane's sides are walls the art doesn't show yet.
  collision: [
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
    '#                  #',
    '#                  #',
  ],
  exits: [
    { x: 8, y: 0, w: 2, to: 'test_street', at: [16, 16], facing: 'up' },
  ],
  // First visit: pan the camera to the sign and back.
  onEnter: async (g) => {
    if (g.flag('lane_intro')) return;
    g.setFlag('lane_intro');
    await g.panCamera(16, 7);
    await g.wait(0.4);
    await g.think('A dead end with a sign. And something wrong with the paving.');
    await g.followPlayer();
  },
  entities: [
    {
      id: 'lane_sign',
      x: 17, y: 7,
      sprite: { sheet: props, frame: 'sign_board' },
      look: '"DEAD END. For now."',
    },
    {
      id: 'crack',
      x: 14, y: 6,
      solid: false,
      looks: ['The paving has a crack in it that moves when I\'m not looking straight at it.', 'I am not going to step on that.'],
    },
  ],
};

// The shopkeeper's scene: scripted walking and the screen effects the
// Wrongness can use. Afterwards the street is lit for night.
async function deliverLetter(g, self) {
  g.takeItem('letter');
  await g.say(self, 'A letter? For the shop? Nobody writes to the shop.');
  await g.moveNpc(self, [6, 3]);
  await g.moveNpc(self, ['down', 'down']);
  g.faceNpc(self, 'player');
  await g.say(self, 'Let me just...');
  g.playCue('wrongness');
  g.setWrongness(0.6);
  g.sfx('wrong_sting');
  await Promise.all([g.tint('wrong_deep', 0.45, 1.2, 'multiply'), g.distort(2, 1.2)]);
  await g.shake(3, 0.6);
  await g.flicker(0.5);
  await g.hueShift(140, 0.6);
  await g.say(self, 'The letter is blank. It was always blank. Why did I think it would say something?');
  await g.think("Did the floor just... breathe? No. Floors don't do that.");
  await g.clearEffects(0.8);
  g.setWrongness(0);
  await g.moveNpc(self, [2, 3]);
  g.faceNpc(self, 'down');
  g.setFlag('letter_delivered');
  await g.say(self, "Sorry. Where was I? Welcome! We're closed.");
}

// A vista in the manner of the opening's moonrise: a full-screen picture with
// a moon rising in the wrong place, auto-advancing shouts, a hard cut back to
// the map under night lighting, and a text card.
function vista(ctx, ms) {
  const t = ms / 1000;
  const sky = ['wrong_void', 'cobalt_deep', 'navy_shade', 'navy', 'plum_shade', 'plum', 'rose_shade', 'coral', 'terra_light', 'ochre_light'];
  sky.forEach((name, i) => {
    ctx.fillStyle = COLORS[name];
    ctx.fillRect(0, i * 14, 256, 14);
  });
  // The moon rises behind the rim, right of the notch.
  const moonY = Math.max(104, 140 - t * 6);
  ctx.fillStyle = COLORS.lamp_glow;
  for (let y = -12; y <= 12; y++) {
    const half = Math.floor(Math.sqrt(144 - y * y));
    ctx.fillRect(176 - half, Math.round(moonY) + y, half * 2, 1);
  }
  // The rim's cliffs, with the Gate notch at the center.
  ctx.fillStyle = COLORS.wrong_deep;
  for (let x = 0; x < 256; x++) {
    const notch = Math.abs(x - 128) < 14 ? 18 - Math.abs(x - 128) : 0;
    const h = 118 + Math.round(Math.sin(x / 19) * 4 + Math.sin(x / 7) * 2) + Math.max(0, notch);
    ctx.fillRect(x, h, 1, 160 - h);
  }
  // The bay, with the moon's gleam.
  ctx.fillStyle = COLORS.cobalt_deep;
  ctx.fillRect(0, 140, 256, 84);
  ctx.fillStyle = COLORS.water_light;
  for (let y = 146; y < 200; y += 6) ctx.fillRect(170 + ((y * 7) % 13), y, 12 - ((y / 6) % 5), 1);
}

async function moonrise(g) {
  await g.think('Plug in. Water in. Sheets out of the way.', 'Now, the moon.');
  g.stopMusic(2000);
  await g.showPicture(vista, { fade: 1 });
  await g.wait(3);
  await g.think('No.', 'It comes up in the Gate.');
  await g.hidePicture({ fade: 0 }); // hard cut
  await g.setLighting('night', 0);
  const groan = g.shake(1, 3);
  await g.say('Sweaty Kid', 'WHOA!', { auto: 1.2 });
  await g.say('Neighbor', 'My SHEETS!', { auto: 1.2 });
  await groan;
  await g.shake(3, 0.5);
  await g.wait(1);
  await g.fade('out', 2);
  await g.card('Cheryl did not sleep well.', 2.5);
  await g.setLighting('day', 0);
  await g.fade('in', 1);
  await g.think('I\'d like to know why.');
  await g.setLighting(null, 0);
  g.hint('Lighting returns to the map\'s own on the next map load.', 3);
}

export const testMaps = { test_street: streetMap, test_shop: shopMap, test_lane: laneMap };

export const testScripts = {
  // ?map=test_shop&x=2&y=5&facing=up&items=letter&run=wrongness
  wrongness: async (g) => deliverLetter(g, g.npc('shopkeeper')),
  // ?map=test_street&run=moonrise
  moonrise,
};
