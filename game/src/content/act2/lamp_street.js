// Lamp Street (32 × 16): the winding lane under the Crown, and the Little
// School. Layout, lines, and puzzle hints from docs/design/02-city.md.
//
//      x 0         1         2         3
//        01234567890123456789012345678901
//  y  0  RRR^^RRRRRRRRRRRRRRRRR^^RRRRRRRR   ^ x3-4 the Squeeze stair; x22-23 the Crown stair
//     2  ###^^#[ the Little School ]###^^#   houses and the school (x7-18) face the street
//     4  #D#^^#D#####DD######D#^^#D##D##D
//     5  #..s...=,,,,,,,,,,=.............   , the school yard; s the scrape, down from the Squeeze
//     8  #..s...=====,,=====.............
//     9  G..s............................   G the Goat Path gate (shut in part 1)
//    12  #..sssssssssssssssssbbsssssss...   the scrape runs along the parapet to the Steps
//    13  ===========================^^===   x27-28 down to the Hundred Steps
//    15  rrrrrrrrrrrrrrrrrrrrrrrrrrr^^rrr

import { composedMap, blankGrid } from '../opening/grid.js';
import { act2Tiles } from './tiles.js';
import { layout, house, pave, lowRoof, LOOKS, bump, cycle, firstMeet, cherylDeclines } from './common.js';
import { props } from '../../art/props.js';

const W = 32, H = 16;

function compose(g) {
  const L = layout(W, H, blankGrid);
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) L.set('ground', x, y, pave(x, y));

  // ---- Houses and the school (rows 0–4) ----
  house(L, 0, 0, { roofRows: 2, mid: '#w#', top: '#D#', base: '#D#', palette: 'sky' });
  house(L, 5, 0, { roofRows: 2, mid: 'w#', top: '#D', base: '#D', palette: 'ochre' });
  house(L, 7, 0, { roofRows: 2, mid: '#w#w#w#w#w##', top: '#w#w#DD#w#w#', base: '#####DD#####', palette: 'white_sage' });
  house(L, 19, 0, { roofRows: 2, mid: '#b#', top: '#D#', base: '#D#', palette: 'rose' });
  house(L, 24, 0, { roofRows: 2, mid: '#b#', top: '#D#', base: '#D#' });
  house(L, 27, 0, { roofRows: 2, mid: '#w#', top: '#Dw', base: '#Dw', palette: 'ochre' });
  house(L, 30, 0, { roofRows: 2, mid: 'w#', top: '#D', base: '#D', palette: 'sky' });
  // The school's sign over its doors.
  L.set('detail', 12, 2, 'props:sign_board');
  // The two stairs up between the houses.
  for (const x0 of [3, 22]) for (let y = 0; y <= 4; y++) {
    L.set('ground', x0, y, 'street:stairs_l', false);
    L.set('ground', x0 + 1, y, 'street:stairs_r', false);
    L.step[y][x0] = L.step[y][x0 + 1] = 'step_stairs';
  }

  // ---- The school yard (x8–17, y5–7), its low wall, and the gate at x12–13 ----
  const cob = ['a', 'b', 'c', 'd', 'e'];
  for (let y = 5; y <= 7; y++) for (let x = 8; x <= 17; x++) L.set('ground', x, y, `court:cobble_${cob[(x * 3 + y * 5) % 5]}`);
  for (let y = 5; y <= 7; y++) { L.set('ground', 7, y, 'roof:lowwall', true); L.set('ground', 18, y, 'roof:lowwall', true); }
  for (let x = 7; x <= 18; x++) if (x !== 12 && x !== 13) L.set('ground', x, 8, 'street:retain_top', true);

  // ---- The west edge: walls, and the Goat Path gate (shut until part 2) ----
  for (let y = 5; y <= 12; y++) L.set('ground', 0, y, 'court:court_wall_w', true);
  L.set('ground', 0, 10, 'court:gate_w', true);

  // ---- The south edge: the parapet over the lower town, and the Steps ----
  for (let x = 0; x < W; x++) {
    L.set('ground', x, 13, 'street:retain_top', true);
    L.set('ground', x, 14, 'street:retain', true);
    L.set('ground', x, 15, lowRoof(x, 15), true);
  }
  for (let y = 13; y <= 15; y++) {
    L.set('ground', 27, y, 'steps:steps_l', false);
    L.set('ground', 28, y, 'steps:steps_r', false);
    L.step[y][27] = L.step[y][28] = 'step_stairs';
  }

  // ---- The scrape: down from the foot of the Squeeze, then east to the Steps ----
  for (let y = 5; y <= 11; y++) L.set('detail', 3, y, 'standins:scrape_v');
  L.set('detail', 3, 12, 'standins:scrape_corner');
  for (let x = 4; x <= 26; x++) if (x !== 20 && x !== 21) L.set('detail', x, 12, 'standins:scrape');

  // ---- Props ----
  L.lamp(5, 9); L.lamp(16, 9); L.lamp(25, 9);
  L.bench(20, 12);
  L.block(20, 12, false); // the Man on Bench sits on its left end
  L.pot(24, 5); L.pot(26, 5); L.pot(1, 5, 'pot_bay');
  return L.done();
}

// ---------------------------------------------------------------------------
// Objects

const HOUSE_DOORS = [[1, 4], [6, 4], [20, 4], [25, 4], [28, 4], [31, 4]];

const objects = [
  ...[[7, 5, 4], [12, 2, 3], [14, 5, 4]].map(([x, w, h]) => ({
    id: `school_${x}`, x, y: 1, w, h, lookKey: 'school',
    looks: [
      'The Little School. Twenty-nine years. I could find my old desk in the dark, and twice I had to.',
      'Summer holiday. The building is having the best weeks of its year.',
    ],
  })),
  { id: 'school_doors', x: 12, y: 4, w: 2, look: 'Locked. Good. The building deserves a rest.' },
  ...HOUSE_DOORS.map(([x, y]) => ({
    id: `door_${x}`, x, y, lookKey: 'house_doors',
    interact: (g) => g.describe(cycle(g, 'lamp.doors', ['Not my door.', "The Venns'. They'll be asleep. They're always asleep. It's a gift."])),
  })),
  {
    id: 'goat_gate', x: 0, y: 9, h: 3,
    looks: [
      ['The Goat Path. Down the back of the island the long way, past the goats and Mott\'s shack.', 'The gate\'s shut. A note on the latch: GOATS ON THE PATH TODAY.'],
      'The goats have the path today. The goats have it most days, if you ask the goats.',
    ],
  },
  {
    id: 'scrape', x: 4, y: 12, w: 16, lookKey: 'scrape',
    look: 'The piano\'s trail. It knew where it was going, which is more than I do.',
  },
  {
    id: 'lamp_view', x: 0, y: 13, w: 27, lookKey: 'lamp_view',
    look: 'Roofs all the way down to the water, and every basin still full.',
  },
  { id: 'yard_wall', x: 7, y: 8, w: 5, lookKey: 'yard', look: 'The school yard. Hopscotch squares I painted in my second year. Somebody keeps repainting them.' },
  { id: 'yard_wall_e', x: 14, y: 8, w: 5, lookKey: 'yard', look: 'The school yard. Hopscotch squares I painted in my second year. Somebody keeps repainting them.' },
  ...[[24, 5], [26, 5]].map(([x, y]) => ({ id: `geranium_${x}`, x, y, lookKey: 'geraniums', look: 'Geraniums. Nobody remembers planting them.' })),
  { id: 'bay', x: 1, y: 5, look: 'A bay tree in a pot, trimmed into a ball. Somebody on this street has a great deal of free time.' },
  ...[5, 16, 25].map((x) => ({ id: `lamp_${x}`, x, y: 9, lookKey: 'lamps', look: 'Lamp Street\'s lamps. Lit at dusk by hand. The lamplighter is eighty-one and refuses help.' })),
].map((o) => ({ solid: false, use: { '*': cherylDeclines }, ...o }));

// ---------------------------------------------------------------------------
// Characters

const CHANT = '♪ Moonshine, moonshine, catch it in a cup, ring the bell when the tide turns up! ♪';

async function girlsTalk(g, self, mine) {
  if (firstMeet(g, 'girls')) {
    await g.describe('The Skipping Girls. Nobody taught them that rhyme. Not me, not their mothers. It\'s just there, like the stairs.');
    await g.talk([
      ['First Girl', 'Miss! Miss! Tell her it\'s "Stout sister, Thin sister." She says it\'s Thin first.'],
      ['Second Girl', 'It IS Thin first. "Thin sister, Stout sister, Little sister three!"'],
      ['Third Girl', "It's FAT sister, not Stout. Nobody says stout. Stout is a beer."],
      ['First Girl', "You're both wrong and you're both OUT."],
    ]);
    return;
  }
  // Each girl alternates her own line with the chant.
  if (bump(g, `girls.${self.id}`) % 2 === 0) return g.say(self, mine);
  return g.say('Skipping Girls', CHANT);
}

const GIRL_LINES = {
  girl_1: ['First Girl', 'Stout first. My nan says.'],
  girl_2: ['Second Girl', 'Little sister three. She\'s the littlest, so she goes last.'],
  girl_3: ['Third Girl', "There's a bit about Tessel bumping her head. It's the BEST bit."],
};

const girls = [[10, 'girl_1', 'girl1', 'right'], [12, 'girl_2', 'girl2', 'down'], [14, 'girl_3', 'girl3', 'left']].map(([x, id, look, facing]) => ({
  id, name: GIRL_LINES[id][0], x, y: 6, facing,
  sprite: LOOKS[look],
  behavior: 'idle',
  ...(id === 'girl_2' && { bark: { lines: [CHANT], range: 3, once: true, speaker: 'Skipping Girls' }, emote: { frame: 'note', every: [3, 6] } }),
  interact: (g, self) => girlsTalk(g, self, GIRL_LINES[id][1]),
  use: { '*': (g) => g.say('First Girl', "We're BUSY, Miss.") },
}));

const wateringWoman = {
  id: 'watering_woman', name: 'Woman with Watering Can', x: 25, y: 5, facing: 'left',
  sprite: LOOKS.watering_woman,
  interact: async (g, self) => {
    if (firstMeet(g, 'watering_woman')) {
      await g.describe("She waters the geraniums at nine every morning. The geraniums would set their watches by her, if geraniums had watches.");
      return g.say(self,
        'Did you see the moon, Cheryl? Sideways! The whole street saw.',
        "My husband says it's the new clock. Everything's the new clock, with him. The milk went off: the clock.");
    }
    return g.say(self, 'The clock. I ask you.');
  },
  use: { '*': (g, self) => g.say(self, "Lovely, dear. I've got my hands full of can.") },
};

const benchMan = {
  id: 'bench_man', name: 'Man on Bench', x: 20, y: 12, facing: 'down',
  sprite: LOOKS.bench_man,
  turnToTalk: false,
  interact: async (g, self) => {
    if (firstMeet(g, 'bench_man')) {
      await g.describe("He's read the same page of the Tide-Sheet three times this morning. He's hoping it changes its mind.");
      return g.say(self, 'Says here the moon was "refracted by unusual atmospheric conditions." Refracted. I said refracted. Last night.');
    }
    return g.say(self, 'Refracted. Look it up.');
  },
  use: { '*': (g, self) => g.say(self, "Not now. I'm being right.") },
};

const cat = {
  id: 'cat', x: 17, y: 9,
  sprite: { sheet: props, frame: 'cat' },
  looks: [
    'A cat, on the uphill side of the street. They\'re all on the uphill side this morning. Every one.',
    'Cats know where level is. Today, level is uphill.',
  ],
};

// ---------------------------------------------------------------------------

export const lampStreetMap = composedMap(compose, {
  id: 'lamp_street',
  name: 'Lamp Street',
  tileset: act2Tiles,
  music: 'neighborhood',
  lighting: 'day',
  ambience: ['crowd'],
  step: 'step_stone',
  spawn: [3, 6],
  exits: [
    { x: 3, y: 0, w: 2, to: 'cistern_court', at: [15, 23], facing: 'up' },
    { x: 22, y: 0, w: 2, to: 'crown', at: [11, 13], facing: 'up' },
    { x: 27, y: 15, w: 2, to: 'hundred_steps', at: [6, 1], facing: 'down' },
  ],
  onEnter: async (g) => {
    if (g.flag('act2.started')) return;
    g.setFlag('act2.started');
    await g.describe(
      'A long scrape in the cobbles, from the Squeeze all the way to the top of the Hundred Steps.',
      "The piano went this way. I'll follow it. It's the only lead I've got, and it weighs half a ton.",
    );
  },
  entities: [...objects, ...girls, wateringWoman, benchMan, cat],
});
