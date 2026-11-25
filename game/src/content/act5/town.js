// Act 5 across the town (docs/design/05-high-and-dry.md): Fountain Square
// with the Fountain full and Dry Canal Day declared, the Shop's fallen window
// and its first swap, the Clockmaker's door on the Crown, and every
// resident's Act 5 lines. Each `with…5(def)` layers Act 5 onto another act's
// map without editing it (Act 3's withAct3 pattern), keyed to `act5.started`.

import { crowd_a, crowd_b } from '../../art/act5_sprites.js';
import { counting_woman } from '../../art/act2_npcs.js';
import { withSheets } from './tiles.js';
import { LOOKS } from '../act2/common.js';
import {
  started, after5, WRONGNESS, SURFACE_AMBIENCE, LAUNDRY_AMBIENCE,
  cycle, getItem, cherylDeclines, firstMeet,
  morePatches, untilAct5, openTiles, valueOf,
} from './common.js';
import { act5Loops } from './loops.js';

// ---------------------------------------------------------------------------
// Helpers

// Replace one entity's talk (and item answers) once Act 5 begins.
function act5Talk(entities, id, interact, use) {
  return (entities || []).map((e) => {
    if (e.id !== id) return e;
    const before = e.interact;
    const beforeUse = e.use || {};
    return {
      ...e,
      act5Before: { interact: before, use: beforeUse },
      interact: async (g, self, n) => (started(g) ? interact(g, self, n) : before && before(g, self, n)),
      use: use ? Object.fromEntries([...new Set([...Object.keys(beforeUse), ...Object.keys(use)])].map((k) => [
        k, async (g, self, item) => {
          const fn = started(g) ? (use[k] || use['*']) : (beforeUse[k] || beforeUse['*']);
          return fn ? fn(g, self, item) : cherylDeclines(g);
        },
      ])) : e.use,
    };
  });
}

// Steps these ids aside once Act 5 begins.
function hide(entities, ids) {
  return (entities || []).map((e) => (ids.includes(e.id) ? untilAct5(e) : e));
}

// Every outdoor Act 5 map: the Wrongness, the wind, the hull's creak.
function windOnEnter(base, loops = SURFACE_AMBIENCE) {
  return async (g) => {
    if (started(g)) {
      g.setWrongness(WRONGNESS);
      act5Loops(g, loops);
    } else if (after5(g)) act5Loops(g, []);
    if (base.onEnter) await base.onEnter(g);
  };
}

// ---------------------------------------------------------------------------
// Fountain Square: the Fountain full, the Mayor's crowd, the banner, the way
// down to the Bilge open.

async function fountain5(g) {
  if (g.flag('n.fountain5')) return g.describe("Flowing. Fuller than before. There's no getting to that hatch now.");
  g.setFlag('n.fountain5', 1);
  return g.describe('Flowing again. Fuller than before. I shut its feed down there, and the pumps found it anyway.', "There's no getting to that hatch now.");
}

async function fillBucket(g) {
  g.pose('player', 'reach_' + g.player.facing);
  g.sfx('bucket_fill');
  await g.wait(1.2);
  g.pose('player', null);
  g.setFlag('bucket.full');
  g.takeItem('bucket');
  await getItem(g, 'bucket_water');
  await g.describe("A bucket of the Fountain. Five hundred years of water from nowhere, and I'm carrying it to a boat.");
}

const fountainUse = {
  bucket: fillBucket,
  bucket_water: (g) => g.describe("It's full. Any fuller and it'd be a fountain."),
};

async function mayorTalk(g, self) {
  if (firstMeet(g, 'mayor5')) {
    return g.say(self,
      'Citizens! The sea has stepped out! And Tessel steps FORWARD! I give you: DRY CANAL DAY!',
      'Tonight, at moonrise, a celebration in the canal itself! Lanterns! Music! A speech, by me!',
      "...Miss. Don't. I know that look. Everything is fine. The canals are a feature.");
  }
  return g.say(self, cycle(g, 'mayor5.repeat', [
    "Dry Canal Day. Moonrise. Bring a lantern. Bring a friend. Bring nothing that floats, it's not that sort of day.",
    'The reef is an optical effect of the dry air. The Harbor Office says so. The Harbor Office is still looking for the landing.',
  ]));
}

const mayorUse5 = {
  bucket_water: (g, self) => g.say(self, 'Miss, put that DOWN. It is DRY Canal Day.'),
  '*': (g, self) => g.say(self, 'Very nice, Miss. Gold star. Moonrise, in the canal.'),
};

async function touristTalk(g, self) {
  if (firstMeet(g, 'tourist5')) {
    return g.say(self,
      "The ferry's six feet DOWN now. I looked over the edge. It's hanging off its ropes like washing.",
      "My guidebook said nothing about the sea leaving. Then again, you've got my guidebook.");
  }
  return g.say(self, "Dry Canal Day. I'm going. I've nothing else to do. I'm wearing your hat.");
}

const crowd = [
  { id: 'crowd_a', x: 7, y: 13, sheet: crowd_a, frame: 'cheer_down', facing: 'up' },
  { id: 'crowd_b', x: 9, y: 13, sheet: crowd_b, frame: 'point_down', facing: 'up' },
].map(({ sheet, frame, ...c }) => ({
  ...c, name: 'Resident', kind: 'npc', turnToTalk: false,
  sprite: { sheet, frame },
  when: started,
  interact: (g, self) => g.say(self, cycle(g, `${self.id}.lines`, self.id === 'crowd_a'
    ? ['DRY CANAL DAY! ...What is it?', "I'm bringing a lantern. He said bring a lantern."]
    : ['Party in the canal! My nan says the sea will be cross.', 'Shh. He\'s doing the bit about lanterns.'])),
  use: { '*': (g, self) => g.say(self, "Is it a lantern? Bring a lantern, he said.") },
}));

function squarePatches(g) {
  if (!started(g)) return [];
  const out = [];
  // The rope's gone from the stair down to the Bilge.
  for (const x of [10, 11, 12]) out.push(['detail', x, 16, null]);
  for (const y of [16, 17]) { out.push(['ground', 11, y, 'steps:steps_l'], ['ground', 12, y, 'steps:steps_r']); }
  // DRY CANAL DAY -- TONIGHT -- MOONRISE, on two poles over the café.
  'abcdef'.split('').forEach((c, i) => out.push(['overhead', 16 + i, 11, `banner:over_banner_${c}`]));
  out.push(['detail', 16, 12, 'banner:pole_foot_l'], ['detail', 21, 12, 'banner:pole_foot_r']);
  return out;
}

export function withSquare5(def) {
  const base = withSheets(def);
  let entities = hide(base.entities, ['rope', 'counting_woman_square', 'piano', 'piano_arch', 'big_mover', 'other_mover']);
  entities = act5Talk(entities, 'mayor', mayorTalk, mayorUse5);
  entities = act5Talk(entities, 'tourist', touristTalk, { '*': (g, self) => g.say(self, "I've got a hat. I need a ferry.") });
  entities = entities.map((e) => (e.id === 'fountain'
    ? { ...e, act5Before: { interact: e.interact }, interact: async (g, ...a) => (started(g) ? fountain5(g) : e.interact(g, ...a)), use: { ...e.use, ...Object.fromEntries(Object.entries(fountainUse).map(([k, fn]) => [k, async (g, ...a) => (started(g) ? fn(g, ...a) : cherylDeclines(g))])) } }
    : e));
  return {
    ...base,
    patches: morePatches(base.patches, squarePatches),
    exits: [
      ...(base.exits || []),
    ],
    triggers: (base.triggers || []).map(untilAct5),
    entities: [
      ...entities,
      ...crowd,
      { id: 'banner', x: 16, y: 11, w: 6, solid: false, when: started, look: 'DRY CANAL DAY -- TONIGHT -- MOONRISE. Painted overnight. The paint on MOONRISE is still wet.' },
    ],
    onEnter: windOnEnter(base),
  };
}

// ---------------------------------------------------------------------------
// The Shop: the window display fallen over in the rise, and his first swap.

const swapped = (g) => g.flag('got.polish');

async function shopkeeperTalk(g, self) {
  if (swapped(g)) return g.say(self, "My first swap in thirty years. I'm going to have a sit down.");
  if (firstMeet(g, 'shopkeeper5')) {
    return g.say(self,
      'Miss. Look. The window. It went over in the night. When the whole shop lifted. The hat\'s on the floor.',
      "There's a GAP, Miss. In the window. A shop with a gap in the window is a shop that's given up.",
      'I need something to display. Something local. Something that says Tessel.');
  }
  return g.say(self, 'A gap. People will talk. They\'ll say, "Did you see his window?"');
}

async function giveGuidebook(g, self) {
  if (swapped(g)) return g.say(self, "It's in. It's perfect. Don't touch the window.");
  g.takeItem('guidebook');
  g.sfx('give');
  await g.say(self, 'A guidebook! "Tessel: A Pocket Companion." Genuinely local. Confidently wrong. PERFECT.');
  // In it goes.
  await g.moveNpc(self, [7, 4]);
  g.faceNpc(self, 'down');
  await g.wait(0.3);
  g.sfx('stone_scrape');
  g.setFlag('shop.guide');
  await g.wait(0.6);
  g.faceNpc(self, 'player');
  await g.say(self,
    'In it goes. There. The window is complete. Thank you, Miss. What can I-- no, I don\'t sell things.',
    '...Oh, go on. A swap. Display for display. What do you want?');
  g.facePlayer('up');
  await g.wait(0.8);
  await g.say(self, "The polish? That's lighthouse polish. Nobody needs lighthouse polish except--");
  g.facePlayer(self);
  await g.say(self, "Take it. Before I change my mind. I've never done this before. I feel quite light-headed.");
  g.sfx('tin_lid');
  g.setFlag('got.polish');
  await getItem(g, 'brass_polish');
}

function shopPatches(g) {
  if (!started(g)) return [];
  const f = g.flag('shop.guide') ? 'display_guide' : 'display_fallen';
  return [['detail', 7, 5, { tile: `shop5:${f}_l`, solid: true }], ['detail', 8, 5, { tile: `shop5:${f}_r`, solid: true }]];
}

const shopkeeper5 = {
  id: 'shopkeeper5', name: 'Shopkeeper', x: 6, y: 4, facing: 'right',
  sprite: LOOKS.shopkeeper,
  when: started,
  interact: shopkeeperTalk,
  use: {
    guidebook: giveGuidebook,
    hat: (g, self) => g.say(self, "Your hat? It's been in the window once already. People would think I'd gone backwards."),
    '*': (g, self) => g.say(self, "Is it local? It's not local, Miss. I need local."),
  },
};

const display5 = {
  id: 'display5', x: 7, y: 5, w: 2, solid: false, when: started,
  interact: (g) => (g.flag('shop.guide')
    ? g.describe('The guidebook, open in pride of place, on a little stand. "Tessel: A Pocket Companion." Somebody will buy it. He won\'t sell it.')
    : g.describe('The window display, flat on its back. The straw hat on the floor, the stand on its side. Like a crime scene, but for a hat.')),
  use: { guidebook: (g) => g.describe("It's his window. He should be the one to fill it."), '*': cherylDeclines },
};

export function withShop5(def) {
  const base = withSheets(def);
  return {
    ...base,
    patches: morePatches(base.patches, shopPatches),
    entities: [...hide(base.entities, ['shopkeeper', 'hat_display']), shopkeeper5, display5],
  };
}

// ---------------------------------------------------------------------------
// The Crown: the Clockmaker's door propped open (the way into his shop), and
// Ambrose.

async function ambroseTalk(g, self) {
  if (firstMeet(g, 'ambrose5')) {
    return g.say(self,
      "CHERYL. THE NEXT TURN'S AT MOONRISE. TONIGHT. A BIG ONE. THE SEA'S BEEN SAVING IT UP.",
      "I'LL RING. I'LL RING IF THE TOWER FALLS DOWN AROUND ME. WHICH IT MIGHT.",
      'ON HIS STEEL CLAPPER. RINGS LIKE A SAUCEPAN. MY BELL\'S OLD BRONZE TONGUE IS PROPPING HIS SHOP DOOR OPEN.');
  }
  return g.say(self, cycle(g, 'ambrose5.repeat', [
    'MOONRISE. LISTEN FOR ME. WHEREVER YOU ARE.',
    "HIS SHOP DOOR. PROPPED OPEN WITH MY BELL'S OLD TONGUE. I COULD WEEP.",
  ]));
}

const ambroseUse5 = {
  clapper: (g, self) => g.say(self, "THAT'S MY BELL'S OLD TONGUE. KEEP IT. HIS STEEL ONE RINGS LIKE A SAUCEPAN, BUT IT RINGS."),
  '*': (g, self) => g.say(self, 'NOT NOW, CHERYL. I\'M LISTENING TO THE SEA.'),
};

// A map's ground tile at (x, y), by name, without its properties (solidity).
function tileAt(def, x, y) {
  const v = def.legend[def.ground[y][x]];
  return v && typeof v === 'object' ? v.tile : v;
}

// Ambrose on the Crown, at his tower step, until Act 4's belfry is registered
// (withAct5 turns this off then; in Act 5 he's up in the belfry).
export const crownLinks = { ambroseHere: true, belfry: false };
const ambrose5 = {
  id: 'ambrose5', name: 'Ambrose', x: 6, y: 7, facing: 'down',
  sprite: LOOKS.ambrose, turnToTalk: false,
  when: (g) => started(g) && crownLinks.ambroseHere,
  interact: ambroseTalk,
  use: ambroseUse5,
};

// Act 3's dusk state of the Crown (keyed on `act3.surfaced`, so it would
// otherwise last forever) steps aside for Act 5's afternoon: daylight, the
// moon-eye studs plain, Act 3's people and its ending on the stair gone.
export function withCrown5(def) {
  const base = withSheets(def);
  const entities = hide(base.entities, ['shop_door', 'ambrose', 'ambrose_dusk', 'kid_dusk', 'watering_dusk']);
  return {
    ...base,
    lighting: (g) => (started(g) ? 'day' : valueOf(base.lighting, g)),
    darkness: (g) => (started(g) ? 0 : valueOf(base.darkness, g) || 0),
    lights: (g) => (started(g) ? [] : valueOf(base.lights, g) || []),
    patches: (g) => {
      const list = base.patches ? base.patches(g) : [];
      if (!started(g)) return list;
      // The tower doorway (4-5, 6), walkable: the way up to the belfry.
      if (crownLinks.belfry) for (const x of [4, 5]) list.push(['ground', x, 6, tileAt(base, x, 6)]);
      return list.map(([layer, x, y, v, ...r]) => {
        const name = typeof v === 'object' && v ? v.tile : v;
        if (!name || !name.endsWith('_eye_glow')) return [layer, x, y, v, ...r];
        const plain = name.replace(/_glow$/, '');
        return [layer, x, y, typeof v === 'object' ? { ...v, tile: plain } : plain, ...r];
      });
    },
    // The Clockmaker's door (12, 6) is the way into his shop in Act 5. The
    // tile is open for the checker's sake; before Act 5 a solid, silent
    // stopper entity keeps it shut, so Acts 2-4 are unchanged.
    collision: openTiles(base, [[12, 6]]),
    exits: [
      // Act 4's tower door up to the belfry stays open in Act 5 (Ambrose is up there).
      ...(base.exits || []).map((e) => (e.run ? untilAct5(e) : e.to === 'belfry' ? { ...e, act5Before: e.when, when: (g) => started(g) || !e.when || e.when(g) } : e)),
      {
        x: 12, y: 6, to: 'clockmaker_shop', at: [4, 6], facing: 'up', when: started,
      },
    ],
    triggers: (base.triggers || []).map(untilAct5),
    entities: [...entities, ambrose5, { id: 'clockshop_door_shut', x: 12, y: 6, solid: true, shadow: false, when: (g) => !started(g) }],
    onEnter: async (g) => {
      if (!started(g)) {
        if (after5(g)) act5Loops(g, []);
        return base.onEnter && base.onEnter(g);
      }
      g.setWrongness(WRONGNESS);
      g.playMusic('neighborhood');
      act5Loops(g, SURFACE_AMBIENCE);
    },
  };
}

// The belfry (Act 4's map), if it's registered: Ambrose there instead.
export function withBelfry5(def) {
  // Ambrose stands under the bell (4, 3), inside its hotspot; listed first, he's the one who answers.
  const entities = act5Talk(def.entities, 'ambrose_belfry', ambroseTalk, ambroseUse5);
  const first = entities.filter((e) => e.id === 'ambrose_belfry');
  return { ...def, entities: [...first, ...entities.filter((e) => e.id !== 'ambrose_belfry')] };
}

// ---------------------------------------------------------------------------
// The Archive: Ottilie, revising.

async function ottilieTalk(g, self) {
  if (firstMeet(g, 'ottilie5')) {
    return g.say(self,
      "Cheryl! The canals! The Founders' walls, exposed! Slate! No mortar! It's a FOUNDATION, Cheryl.",
      "I've revised. Not eels. Not smugglers. A cellar. A vast cellar. Under everything. For storing... something.",
      "I'll know when I see the right glyph. I'm close. I can feel a fourth monograph coming on.");
  }
  return g.say(self, 'Storing what, Cheryl? Storing WHAT?');
}

export function withArchive5(def) {
  const base = withSheets(def);
  return {
    ...base,
    // Act 3's dusk (keyed on the Founders' Door being open) gives way to the afternoon.
    lighting: (g) => (started(g) ? 'day' : valueOf(base.lighting, g)),
    entities: act5Talk(base.entities, 'ottilie', ottilieTalk, {
      clapper: (g, self) => g.say(self, 'Bronze! Founder bronze, Cheryl, look at the patina! ...Why is it shaped like a tongue? Don\'t answer. I\'ll have a theory by teatime.'),
      '*': (g, self) => g.say(self, "Primary sources only, Cheryl. That's secondary at best."),
    }),
  };
}

// ---------------------------------------------------------------------------
// The Hundred Steps: the Counting Woman, back on her step.

const countingWoman5 = {
  // On landing 2, clear of flight 3 (her old seat at (9, 19) would leave only the open step's tile to pass).
  id: 'counting_woman5', name: 'Counting Woman', x: 12, y: 17, facing: 'down',
  sprite: { sheet: counting_woman, frame: 'sit_down' },
  turnToTalk: false,
  when: started,
  interact: async (g, self) => {
    if (firstMeet(g, 'counting5')) return g.say(self, "A hundred. A hundred again. I count every hour now, to be sure. It's always a hundred.");
    return g.say(self, "The town's gone mad and the sea's gone out, but the steps are RIGHT, Cheryl.");
  },
  use: { '*': (g, self) => g.say(self, "Don't hand me things. I lose count.") },
};

export function withSteps5(def) {
  const base = withSheets(def);
  return {
    ...base,
    entities: [...hide(base.entities, ['kid', 'kid_after']), countingWoman5],
    onEnter: windOnEnter(base),
  };
}

// ---------------------------------------------------------------------------
// Lamp Street: the Skipping Girls, and the song come true.

async function girlsTalk5(g) {
  if (firstMeet(g, 'girls5')) {
    return g.talk([
      ['Third Girl', 'Miss! Tessel bumped her HEAD! The sea went OUT! It\'s just like the song!'],
      ['First Girl', "It's not like the song. Songs don't DO things."],
      ['Second Girl', '...Do they, Miss?'],
    ]);
  }
  return g.say('Skipping Girls', '♪ Up jumps Tessel and bumps her head! ♪');
}

export function withLampStreet5(def) {
  const base = withSheets(def);
  let entities = base.entities;
  for (const id of ['girl_1', 'girl_2', 'girl_3']) entities = act5Talk(entities, id, girlsTalk5);
  return { ...base, entities, onEnter: windOnEnter(base, LAUNDRY_AMBIENCE) };
}

// ---------------------------------------------------------------------------
// Cistern Court: the Old Man and the Neighbor.

export function withCourt5(def) {
  const base = withSheets(def);
  let entities = act5Talk(base.entities, 'old_man', (g, self) => g.say(self, "The whole house lifted in the night. Gerald says we've risen in the world. Gerald thinks he's funny."));
  for (const id of ['neighbor', 'neighbor_after', 'neighbor_morning']) {
    entities = act5Talk(entities, id, (g) => g.say('Neighbor', "The wind! My sheets are out on the line flat as flags. Whiter than ever. I don't trust it."));
  }
  return { ...base, entities, onEnter: windOnEnter(base, LAUNDRY_AMBIENCE) };
}

export const townScripts = { fillBucket, giveGuidebook, mayorTalk, ambroseTalk, ottilieTalk };
