// Fountain Square (24 × 18), the middle of town, and the Shop (10 × 8) on it.
// From docs/design/02-city.md. Two ways in: the arch from the Hundred Steps
// (once the piano has gone through it first), and the stair up from the Bilge,
// the long way round.
//
//      x 0         1         2
//        012345678901234567890123
//  y  0  RRRRRRRRRR#::#RRRRRRRRRR   :: the arch from the Steps (11-12)
//     2  #w#ww#w####::####w#ww#w#   the Shop (0-7); the Mayor's office (16-23)
//     3  ####D######::######D####   Shop door (4, 3); Mayor's door (19, 3), locked
//     7  ..........FFFF..........   the Fountain (10-13, 7-10)
//    12  .ss.ss.........cc.....cc   ss market stalls; café tables and chairs
//    16  rrrrrrrrrrr==rrrrrrrrrrr   the stair down to the Bilge (11-12)

import { composedMap, blankGrid } from '../opening/grid.js';
import { act2Tiles } from './tiles.js';
import { layout, house, pave, lowRoof, LOOKS, pianoSprite, bump, cycle, firstMeet, getItem, cherylDeclines, actWrongness, notFounderOld } from './common.js';
import { fish } from '../../art/landmarks.js';

const W = 24, H = 18;
const slid = (g) => !!g.flag('piano.slid');
const counted = (g) => !!g.flag('counter.left');

function compose(g) {
  const L = layout(W, H, blankGrid);
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) L.set('ground', x, y, pave(x, y));

  // ---- North side: the Shop, houses, the arch, the Mayor's office ----
  house(L, 0, 0, { roofRows: 2, top: '#w#wDw##', base: '####D###', palette: 'rose', open: [[4, 3]] });
  L.set('ground', 6, 3, 'facades:shopfront_l@rose', true); L.set('ground', 7, 3, 'facades:shopfront_r@rose', true);
  house(L, 8, 0, { roofRows: 2, top: '#w#', base: '###', palette: 'ochre' });
  house(L, 13, 0, { roofRows: 2, top: '#w#', base: '###', palette: 'white_sage' });
  house(L, 16, 0, { roofRows: 2, top: '#w#D#ww#', base: '#w#D#ww#', palette: 'sky' });
  L.set('detail', 20, 3, 'square_props:plaque');
  // The arch (x11–12): shaded paving through, the arch's top over it.
  for (let y = 0; y <= 3; y++) for (const x of [11, 12]) L.set('ground', x, y, pave(x, y, true), false);
  L.set('overhead', 11, 1, 'buildings:over_arch_l'); L.set('overhead', 12, 1, 'buildings:over_arch_r');

  // ---- The Fountain of the Fish ----
  for (let y = 0; y < 4; y++) for (let x = 0; x < 4; x++) L.set('detail', 10 + x, 7 + y, `fountain:fountain_x${x}y${y}`, true);

  // ---- Market stalls and café tables ----
  for (const x0 of [1, 4]) {
    L.set('overhead', x0, 12, 'square_props:over_stall_nw'); L.set('overhead', x0 + 1, 12, 'square_props:over_stall_ne');
    L.set('detail', x0, 13, 'square_props:stall_sw', true); L.set('detail', x0 + 1, 13, 'square_props:stall_se', true);
    L.block(x0, 12); L.block(x0 + 1, 12);
  }
  // Two café tables, a chair facing each across it; the Tourist sits on the near chair of the first.
  for (const x of [19, 22]) {
    L.set('detail', x, 13, 'square_props:cafe_table', true);
    L.set('detail', x, 12, 'square_props:cafe_chair', true);
    L.set('detail', x, 14, 'square_props:cafe_chair_back', x !== 19); // the Tourist's chair: she's solid herself
  }
  // The Mayor's crate.
  L.set('detail', 8, 11, 'square_props:mayor_crate', true);

  // ---- Lamps ----
  L.lamp(3, 5); L.lamp(20, 5);

  // ---- South: roofs below, and the stair down to the Bilge ----
  for (let y = 16; y < H; y++) for (let x = 0; x < W; x++) L.set('ground', x, y, lowRoof(x, y), true);
  for (let x = 0; x < W; x++) L.set('ground', x, 16, 'street:retain_top', true);
  for (const y of [16, 17]) {
    L.set('ground', 11, y, 'steps:steps_l', false);
    L.set('ground', 12, y, 'steps:steps_r', false);
    L.step[y][11] = L.step[y][12] = 'step_stairs';
  }
  return L.done();
}

// ---------------------------------------------------------------------------
// Objects

const FOUNTAIN = [
  ['The Fountain of the Fish. Five hundred years of water from nowhere. Every child in Tessel has been dared to drink it.', "It's lower than it should be. A finger's width. You'd only notice if you'd stared at it for thirty years."],
  "It's lower than it should be. A finger's width. You'd only notice if you'd stared at it for thirty years.",
];

const FISH = "A bronze fish, spouting. Its fins look like oars, if you squint. I've never squinted at it before.";

const fountainLook = async (g) => {
  if (slid(g) && bump(g, 'fountain.piano') === 0) return g.describe('The piano has come to rest against the Fountain. The fish looks offended.');
  const n = bump(g, 'fountain');
  if (n === 1) return g.describe(FISH);
  return g.describe(...[].concat(FOUNTAIN[Math.min(n, 1)]));
};

const objects = [
  {
    id: 'fountain', x: 10, y: 7, w: 4, h: 4, interact: fountainLook,
    use: { crowbar: (g) => g.describe('I am not prying up a five-hundred-year-old fountain in front of the Mayor.'), '*': cherylDeclines },
  },
  ...[[1, 'stall_a'], [4, 'stall_b']].map(([x, id], i) => ({
    id, x, y: 12, w: 2, h: 2, lookKey: 'stalls',
    interact: (g) => g.describe(cycle(g, 'stalls', ['Lemons, onions, and yesterday\'s gossip, all fresh.', 'Moonshine Night basins, half price. Nobody\'s buying. Bad luck, apparently.'])),
  })),
  ...[19, 22].map((x) => ({ id: `cafe_${x}`, x, y: 12, h: 2, lookKey: 'cafe', look: "Tessel's real government meets here every morning, over coffee." })),
  {
    id: 'mayor_door', x: 19, y: 2, h: 2,
    looks: ["The Mayor's office. Closed while the Mayor reassures people outside.", 'There\'s a telephone in there. It has never rung. He polishes it.'],
  },
  {
    id: 'shop_window', x: 6, y: 2, w: 2, h: 2,
    interact: (g) => hatWindow(g),
  },
  ...[[0, 11], [13, 11]].map(([x, w]) => ({ id: `south_${x}`, x, y: 16, w, lookKey: 'south_view', look: 'The lower town, roofs and laundry all the way down to the canals.' })),
].map((o) => ({ solid: false, use: { '*': cherylDeclines }, ...o }));

// Old, but not Founder-old (Ottilie's rubbing instruction: floors, where the light falls).
for (const o of objects) if (['fountain'].includes(o.id.replace(/_\d+.*$/, ''))) o.use = { ...o.use, paper_charcoal: notFounderOld };

// The Shop window (from the Square or inside the Shop): the straw hat until
// Cheryl swaps the Keeper's telescope in for it (structure pass, section 3).
export const swapped = (g) => !!g.flag('window.telescope');

export async function hatWindow(g) {
  if (swapped(g)) return g.describe("The Keeper's telescope, in pride of place. Looked at, not looked through. She'd approve.");
  if (!g.flag('tourist.met')) {
    return g.describe('A wide straw hat, in the window. Display stock. It\'s been in that window since before I went grey.');
  }
  if (bump(g, 'hat.window') === 0) return g.describe("Display stock. She'll be peeling by lunchtime.");
  return g.describe("Display stock. He'd let it go if something filled the gap. That's how he talks, anyway.");
}

// Cheryl puts the telescope in the window herself; the Shopkeeper won't touch it.
async function swapTelescope(g) {
  const keeper = g.npc('shopkeeper');
  g.takeItem('telescope');
  g.sfx('give');
  g.setFlag('window.telescope');
  await g.describe('In goes the telescope. Out comes the hat. The window is still complete.');
  await g.say(keeper, "...Display for display. That isn't selling. That's curating. I've never curated before.");
  await g.say(keeper, 'I feel quite light-headed. Take the hat, Miss, before I come to my senses.');
  await getItem(g, 'shop_hat');
}

const fishStatue = {
  id: 'fish', x: 11, y: 8, w: 2, solid: false, kind: 'object',
  sprite: { sheet: fish, frame: 'fish' },
  offset: [0, 3],
};

// The piano: its back end in the arch, then against the Fountain once it slides.
const pianoArch = {
  id: 'piano_arch', x: 11, y: 0, w: 2, h: 2, kind: 'object',
  sprite: pianoSprite('piano_back'),
  when: (g) => !slid(g),
  looks: ["The back end of a piano, wedged in the arch from the Steps side. I'd know that label anywhere.", "The Movers are on the other side of this. They'll want it moved more than I do."],
  use: { '*': cherylDeclines },
};
const pianoFountain = {
  // Against the Fountain's east rim (the design has the north rim, but there
  // the bronze fish, drawn tall, stands right across its keys).
  id: 'piano', x: 14, y: 8, w: 2, h: 2, kind: 'object',
  sprite: pianoSprite('piano_level'),
  when: slid,
  look: "Half a ton of piano, resting against the Fountain with its lid open, as if it's thinking of a tune.",
  use: { soap: (g) => g.describe("It's had all the soap it's getting."), '*': cherylDeclines },
};

// ---------------------------------------------------------------------------
// People

async function moversTalk(g) {
  if (firstMeet(g, 'movers_square')) {
    return g.talk([
      ['Big Mover', "It stopped on its own. Against a fountain. That's two things pianos don't do."],
      ['Big Mover', "Keep the crowbar, Miss. We're not taking our eyes off this one."],
    ]);
  }
  return g.talk([
    ['Other Mover', 'Hnn.'],
    ['Big Mover', "He says it's looking at the canal. He doesn't like how it's looking at the canal."],
  ]);
}

const movers = [
  { id: 'big_mover', name: 'Big Mover', x: 16, y: 8, facing: 'left', sprite: LOOKS.big_mover },
  { id: 'other_mover', name: 'Other Mover', x: 15, y: 10, facing: 'up', sprite: LOOKS.other_mover },
].map((m) => ({
  ...m, when: slid, interact: moversTalk,
  use: { '*': (g) => g.say('Big Mover', 'Very nice, Miss. Not grease, though.') },
}));

const mayorUse = {
  guidebook: (g, self) => g.say(self, '"The Mayor\'s office boasts the island\'s only telephone." Boasts. It does boast. It\'s a very good telephone.'),
  moon_chart: (g, self) => g.say(self, 'Very nice, Miss. Gold star. Please disperse.'),
  '*': (g, self) => g.say(self, 'Very nice, Miss. Gold star. Please disperse.'),
};

const mayor = {
  id: 'mayor', name: 'Mayor', x: 8, y: 11, facing: 'down',
  sprite: LOOKS.mayor, // on his crate, gesturing grandly at nobody
  offset: [0, -9],
  turnToTalk: false,
  interact: async (g, self) => {
    if (counted(g)) {
      if (!g.flag('mayor.count')) {
        g.setFlag('mayor.count');
        g.setFlag('met.mayor');
        return g.talk([
          ['Counting Woman', "A HUNDRED, Duncan! It's in the NAME!"],
          ['Mayor', 'Madam, a guidebook and a letter are not official documents--'],
          ['Counting Woman', 'Then make it OFFICIAL! Count them! Get a committee!'],
          ['Mayor', '...Miss, did you show her those? Why would you show her those?'],
        ]);
      }
      return g.say(self, cycle(g, 'mayor.after', [
        'There will be a committee. There is always a committee.',
        'Miss, if you want it settled, go and count them yourself. Leave me out of it.',
      ]));
    }
    if (firstMeet(g, 'mayor')) {
      await g.describe('The Mayor. Duncan, when he was seven. I taught him long division. Twice.');
      return g.say(self,
        "People of Tessel! Last night's moon was an atmospheric event. Entirely normal. Tessel: Forward!",
        '...Oh. Miss. Hello, Miss.',
        "Don't look at me like that. You've looked at me like that since I was seven.",
        'Everything is fine. The clock is perfect. The moon is atmospheric. Please disperse.');
    }
    return g.say(self, cycle(g, 'mayor.repeat', [
      'Tessel: Forward! ...Please disperse.',
      "My clock is the finest thing on this island. It's ahead of its time. By eleven minutes, I'm told. That's the sun's fault.",
    ]));
  },
  use: mayorUse,
};

const countingWoman = {
  id: 'counting_woman_square', name: 'Counting Woman', x: 7, y: 12, facing: 'up',
  sprite: LOOKS.counting_woman,
  when: counted,
  interact: async (g, self) => {
    if (firstMeet(g, 'counting_square')) return g.say(self, "A HUNDRED, Duncan! It's in the NAME!");
    return g.say(self, cycle(g, 'counting_square.repeat', [
      "I'm not leaving until there's a committee.",
      'And nobody\'s minding my step. The wet one, at the top of the third flight.',
    ]));
  },
  use: {
    guidebook: (g, self) => g.say(self, "I've READ it, thank you. I've read it four times. It doesn't get any more right."),
    tide_sheet: (g, self) => g.say(self, "I've got my own copy. As EVIDENCE."),
    '*': (g, self) => g.say(self, "Don't hand me things. I lose count."),
  },
};

const tourist = {
  id: 'tourist', name: 'Stranded Tourist', x: 19, y: 14, facing: 'up',
  sprite: (g) => (g.flag('tourist.hasHat') ? LOOKS.tourist_hat : LOOKS.tourist),
  turnToTalk: false,
  interact: async (g, self) => {
    if (g.flag('tourist.hasHat')) {
      return g.say(self, cycle(g, 'tourist.after', ['Shade. Portable shade. I could weep.', "I'm keeping this hat. I'm going to sit right here until the ferry comes or I turn into a raisin."]));
    }
    if (!g.flag('tourist.met')) {
      g.setFlag('tourist.met');
      await g.describe('A tourist. Stranded, sunburnt, and still holding that guidebook like it might apologize.');
      return g.say(self,
        "Four days. The ferry hasn't come in four days. The captain says the island moved. Islands don't move.",
        'My guidebook promised "gentle sea breezes and abundant shade." I have found neither.',
        "I'd give anything for a hat. There's one in the shop window and he won't SELL it. \"Display stock.\"");
    }
    return g.say(self, cycle(g, 'tourist.repeat', [
      "A hat. Any hat. I'm peeling like an onion.",
      'The ferry captain says there\'s no ferry. The lighthouse woman says there\'s no sea.',
      "According to this map your lighthouse is on the wrong end of the island. I've stopped asking.",
    ]));
  },
  use: {
    shop_hat: async (g, self) => {
      g.takeItem('shop_hat');
      g.sfx('give');
      g.setFlag('tourist.met');
      await g.say(self, 'A hat! A real, wearable -- you got it out of the WINDOW?');
      await g.say(self, "Take this. It's been wrong about everything else. Maybe it'll be right for you.");
      g.setFlag('tourist.hasHat');
      await getItem(g, 'guidebook');
    },
    tide_sheet: (g, self) => g.say(self, "They printed my letter! ...Don't tell the woman with the sash it was me."),
    moon_chart: (g, self) => g.say(self, "The guidebook has a chart too. It's also wrong."),
    soap: (g, self) => g.say(self, "I've been washing in seawater. Don't ask."),
    '*': (g, self) => g.say(self, "Unless it's a hat or a ferry, I don't want it."),
  },
};

// ---------------------------------------------------------------------------

export const squareMap = composedMap(compose, {
  id: 'fountain_square',
  name: 'Fountain Square',
  tileset: act2Tiles,
  music: 'neighborhood',
  lighting: 'day',
  ambience: ['town'],
  step: 'step_stone',
  spawn: [11, 4],
  exits: [
    { x: 11, y: 0, w: 2, to: 'hundred_steps', at: [6, 39], facing: 'up', when: slid, sfx: 'step_stone' },
    { x: 4, y: 3, to: 'shop', at: [4, 6], facing: 'up' },
    { x: 11, y: 17, w: 2, to: 'bilge', at: [11, 4], facing: 'down', sfx: 'step_stairs' },
  ],
  onEnter: async (g) => { actWrongness(g); },
  entities: [...objects, fishStatue, pianoArch, pianoFountain, ...movers, mayor, countingWoman, tourist],
});

// ---------------------------------------------------------------------------
// The Shop

const SW = 10, SH = 8;

function composeShop(g) {
  const L = layout(SW, SH, blankGrid);
  for (let y = 2; y < SH - 1; y++) for (let x = 1; x < SW - 1; x++) {
    L.set('ground', x, y, 'shop:floor', false);
  }
  for (let x = 1; x < SW - 1; x++) {
    L.set('ground', x, 0, 'interior:wall_upper', true);
    L.set('ground', x, 1, 'interior:wall_lower', true);
    L.set('ground', x, SH - 1, 'interior:wall_south', true);
  }
  L.set('ground', 0, 0, 'interior:wall_upper_w', true); L.set('ground', SW - 1, 0, 'interior:wall_upper_e', true);
  L.set('ground', 0, 1, 'interior:wall_lower_w', true); L.set('ground', SW - 1, 1, 'interior:wall_lower_e', true);
  for (let y = 2; y < SH - 1; y++) { L.set('ground', 0, y, 'interior:wall_side_w', true); L.set('ground', SW - 1, y, 'interior:wall_side_e', true); }
  L.set('ground', 0, SH - 1, 'interior:wall_south_w', true); L.set('ground', SW - 1, SH - 1, 'interior:wall_south_e', true);
  // Shelves of lanterns, lamp oil, brass polish and string; the barometer over them, stuck on FAIR.
  'abcd'.split('').forEach((c, i) => L.set('ground', 1 + i, 1, `shop:shelving_${c}`, true));
  L.set('ground', 7, 1, 'shop:shelving_e', true); L.set('ground', 8, 1, 'shop:shelving_f', true);
  L.set('detail', 7, 0, 'shop:barometer');
  // The counter, with its bell (talk across it).
  for (let x = 2; x <= 6; x++) {
    L.set('detail', x, 3, `shop:counter_${x === 2 ? 'l' : x === 6 ? 'r' : 'm'}`, true);
    L.counter[3][x] = true;
  }
  // The marble jar and the window display: the straw hat, then (STAND-IN until
  // the art lands) the bare display table once the telescope is in.
  L.set('detail', 1, 5, 'shop:marble_jar', true);
  if (g.flag('window.telescope')) {
    L.set('detail', 7, 5, 'furniture:table_l', true); L.set('detail', 8, 5, 'furniture:table_r', true);
  } else {
    L.set('detail', 7, 5, 'shop:display_l', true); L.set('detail', 8, 5, 'shop:display_r', true);
  }
  // The door.
  L.set('ground', 4, SH - 1, 'interior:door', false); L.set('ground', 5, SH - 1, 'interior:door', false);
  return L.done();
}

const shopObjects = [
  {
    id: 'hat_display', x: 7, y: 5, w: 2, interact: (g) => hatWindow(g),
    use: {
      telescope: (g) => swapTelescope(g),
      shop_hat: (g) => g.describe('It\'s out now. Putting it back would only confuse him.'),
      '*': cherylDeclines,
    },
  },
  {
    id: 'marble_jar', x: 1, y: 5,
    looks: [
      ['A jar of marbles. Every single marble has rolled to the same side of the jar.', 'The jar is level. I checked.'],
      "Every marble, on the same side. Downhill, if the floor was a hill. It isn't.",
    ],
  },
  { id: 'shelves', x: 1, y: 1, w: 3, h: 2, lookKey: 'shop_shelves', look: 'Brass polish, lamp oil, string, lanterns. Everything a lighthouse could want. All display.' },
  { id: 'shelves_e', x: 8, y: 1, h: 2, lookKey: 'shop_shelves', look: 'Brass polish, lamp oil, string, lanterns. Everything a lighthouse could want. All display.' },
  { id: 'barometer', x: 7, y: 0, h: 3, look: "The barometer says FAIR. It's said FAIR for nine years. He won't tap it in case it changes its mind." },
  ...[2, 6].map((x) => ({ id: `counter_${x}`, x, y: 3, lookKey: 'counter', look: 'A counter, polished by a lifetime of not selling things.' })),
].map((o) => ({ solid: false, use: { '*': cherylDeclines }, ...o }));

const shopkeeper = {
  id: 'shopkeeper', name: 'Shopkeeper', x: 4, y: 2, facing: 'down',
  sprite: LOOKS.shopkeeper,
  interact: async (g, self) => {
    if (firstMeet(g, 'shopkeeper')) {
      await g.describe('The Shopkeeper. He has never sold anything to anyone and he\'s proud of it.');
      return g.say(self,
        'Morning, Miss. Browse, browse. Everything\'s display stock.',
        'The hat in the window? Display. The lanterns? Display. The marbles? Display. They all rolled into one corner overnight.',
        "I'd sell you something from the back, if I had a back. I don't. It's all front.");
    }
    if (g.flag('window.telescope')) {
      return g.say(self, cycle(g, 'shopkeeper.after', [
        "Display for display. I've been thinking about it all morning.",
        'Customers stop and look at it. Nobody buys it. Perfect.',
      ]));
    }
    return g.say(self, ...[].concat(cycle(g, 'shopkeeper.repeat', [
      ["If I sell the hat, the window has a gap. A shop with a gap in the window is a shop that's given up.",
        'Now, if I had something to put in its place. Something brass. Something nautical. Never used.'],
      "Display stock. It's a principle.",
    ])));
  },
  use: {
    telescope: (g, self) => g.say(self, "Oh, that's lovely. But I don't touch the window, Miss. Curating is hands-off."),
    shop_hat: (g, self) => g.say(self, "No returns, Miss. The window's complete."),
    guidebook: (g, self) => g.say(self, 'A genuine local guidebook! Lovely. But my window is complete.'),
    moon_chart: (g, self) => g.say(self, 'I could frame that. For display.'),
    '*': (g, self) => g.say(self, 'My window is complete, Miss.'),
  },
};

export const shopMap = composedMap(composeShop, {
  id: 'shop',
  name: 'The Shop',
  tileset: act2Tiles,
  music: 'neighborhood',
  musicFilter: 'muffled',
  lighting: 'day',
  background: 'ink',
  step: 'step_wood',
  spawn: [4, 6],
  exits: [{ x: 4, y: SH - 1, w: 2, to: 'fountain_square', at: [4, 4], facing: 'down' }],
  onEnter: async (g) => { actWrongness(g); g.sfx('shop_bell'); },
  entities: [...shopObjects, shopkeeper],
});
