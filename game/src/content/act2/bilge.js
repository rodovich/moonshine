// The Bilge (32 × 16): the canal quarter at the island's foot. The canal runs
// east to west under a stepped bridge; the Water Stairs walk down into it; the
// west end of the south quay is flooded ankle-deep. From docs/design/02-city.md.
//
//      x 0         1         2         3
//        01234567890123456789012345678901
//  y  0  rrrrrrrrrrr..rrrrrrrrrrrrrrrrrrr   north: up to Fountain Square (11-12)
//     2  #w##w##w###..###w##w##w##w##w###
//     3  #D##D##D###..###D##D##D##D##D###
//     4  ................................   NORTH QUAY (y4-6)
//     5  ..ss.ss.ss......................   ss fish stalls
//     6  ......................WWWW......   WWWW the Water Stairs (22-25, 6-8)
//     7  nnnnnnnnnnnnBBnnnnnnnnWWWWnnnnnn   BB the bridge (12-13, 7-10)
//     9  %%%%%%%%%%%%BB%%%%%%%%%%%%%%%%%%   the Boatman's boat at (14-15, 9)
//    10  ssssssssssssBBssssssssssssssssss
//    11  ~~~~~~..........................   ~ flooded paving (x0-5, y11-12); east edge → the Harbor
//    13  ................................
//    14  rrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrr

import { composedMap, blankGrid } from '../opening/grid.js';
import { act2Tiles } from './tiles.js';
import { layout, house, pave, lowRoof, bump, cycle, firstMeet, cherylDeclines, actWrongness, notFounderOld } from './common.js';
import { props } from '../../art/props.js';
import { fishmonger } from '../../art/act5_sprites.js';
import { boatman } from '../../art/act4_sprites.js';

const W = 32, H = 16;
const q = (x, y) => `${y % 2 ? 's' : 'n'}${x % 2 ? 'e' : 'w'}`;
const STALLS = [2, 5, 8];
const POSTS = [[10, 6], [17, 6], [28, 6]];
const DOORS = [1, 4, 7, 16, 19, 22, 25, 28];

// The Bilge's rows 0–6, exactly as Act 2 draws them: paving, the houses along
// the north quay, the stair up to Fountain Square (11–12, 0–3), the fish stalls
// and their awnings, and the mooring posts. Exported so later states of the
// Bilge (Act 4's flooded and dry Bilge) keep the same quay. `L` is a layout from
// act2/common.js (`layout(W, H, blankGrid)`), at least 32 wide.
export function bilgeTopRows(L) {
  for (let y = 0; y <= 6; y++) for (let x = 0; x < W; x++) L.set('ground', x, y, pave(x, y));

  // ---- North: houses along the quay, and the stair up to Fountain Square ----
  for (let x = 0; x < W; x++) {
    if (x === 11 || x === 12) continue;
    L.set('ground', x, 0, lowRoof(x, 0), true);
  }
  const front = (x0, w, pal) => {
    const top = Array.from({ length: w }, (_, i) => (DOORS.includes(x0 + i) ? 'D' : (x0 + i) % 3 === 2 ? 'w' : '#')).join('');
    const base = top.replace(/w/g, '#');
    house(L, x0, 1, { roofRows: 1, top, base, palette: pal });
  };
  front(0, 3, 'sky'); front(3, 3, 'ochre'); front(6, 5, 'rose');
  front(13, 5, 'white_sage'); front(18, 4, 'ochre'); front(22, 5, 'sky'); front(27, 5, 'rose');
  for (let y = 0; y <= 3; y++) {
    L.set('ground', 11, y, 'street:stairs_l', false); L.set('ground', 12, y, 'street:stairs_r', false);
    L.step[y][11] = L.step[y][12] = 'step_stairs';
  }

  // ---- Fish stalls on the north quay ----
  STALLS.forEach((x0, i) => {
    const pal = ['', '@blue', '@green'][i];
    L.set('overhead', x0, 4, `fish_stall:over_stall_l${pal}`); L.set('overhead', x0 + 1, 4, `fish_stall:over_stall_r${pal}`);
    L.set('detail', x0, 5, 'fish_stall:stall_l', true); L.set('detail', x0 + 1, 5, 'fish_stall:stall_r', true);
  });
  for (const [x, y] of POSTS) L.set('detail', x, y, 'canal:mooring_post', true);
}

function compose() {
  const L = layout(W, H, blankGrid);
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) L.set('ground', x, y, pave(x, y));
  bilgeTopRows(L);

  // ---- The canal, the stepped bridge, and the Water Stairs ----
  for (let x = 0; x < W; x++) {
    L.set('ground', x, 7, 'canal:bank_n', true);
    L.set('ground', x, 8, `canal:water_${q(x, 8)}`, true);
    L.set('ground', x, 9, `canal:water_${q(x, 9)}`, true);
    L.set('ground', x, 10, 'canal:bank_s', true);
  }
  for (const [y, f] of [[7, 'bridge_n'], [8, 'bridge_up'], [9, 'bridge_down'], [10, 'bridge_s']]) {
    L.set('ground', 12, y, `canal:${f}_l`, false); L.set('ground', 13, y, `canal:${f}_r`, false);
    L.step[y][12] = L.step[y][13] = 'step_stairs';
  }
  ['l', 'm', 'm', 'r'].forEach((k, i) => {
    const x = 22 + i;
    L.set('ground', x, 6, `reveal:wstairs_top_${k}`, false);
    L.set('ground', x, 7, `bilge_flood:wstairs_wet_${k}`, false);
    L.step[6][x] = L.step[7][x] = 'step_stairs';
  });

  // ---- The south quay, flooded ankle-deep at its west end ----
  for (let y = 11; y <= 12; y++) for (let x = 0; x <= 5; x++) {
    L.set('ground', x, y, `bilge_flood:flood1_${q(x, y)}`, false);
    L.step[y][x] = 'step_splash';
  }
  L.set('detail', 6, 11, 'bilge_flood:flood1_lap_w'); L.set('detail', 6, 12, 'bilge_flood:flood1_lap_w');
  for (let y = 14; y < H; y++) for (let x = 0; x < W; x++) L.set('ground', x, y, lowRoof(x, y), true);
  // A painted board at the east end: HARBOR ->.
  ['0', '1', '2'].forEach((n, i) => L.set('detail', 29 + i, 10, `signpost:harbor_${n}`));
  // The west end: steps up from the flooded quay to the Goat Path, and the cliff below.
  L.set('ground', 0, 11, 'bilge_west:steps_n_f1', false); L.set('ground', 0, 12, 'bilge_west:steps_m_f1', false);
  L.set('ground', 0, 13, 'bilge_west:steps_s', false);
  L.set('ground', 0, 14, 'bilge_west:cliff_a', true); L.set('ground', 0, 15, 'bilge_west:cliff_b', true);
  return L.done();
}

// ---------------------------------------------------------------------------
// Objects

const objects = [
  { id: 'sign_harbor', x: 29, y: 10, w: 3, look: 'A painted board: HARBOR, and an arrow pointing east along the canal.' },
  {
    id: 'water_stairs', x: 22, y: 8, w: 4,
    looks: [
      ['The Water Stairs. Broad and grand, and they walk straight down into the canal and keep going.', 'Tourists photograph them. Children dare each other. Nobody knows where they went.'],
      'Under the water, the steps go down further than I can see.',
    ],
  },
  // The canal with its banks, so it can be looked at from either quay (not
  // over the bridge, the Boatman's boat at 14–15, or the Water Stairs).
  ...[[0, 12], [16, 6], [26, 6]].map(([x, w]) => ({
    id: `canal_${x}`, x, y: 7, w, h: 4, lookKey: 'canal', look: 'Canal water. Green, cold, and full of opinions.',
  })),
  ...STALLS.map((x) => ({ id: `stall_${x}`, x, y: 5, w: 2, lookKey: 'fish_stalls', look: "Yesterday's catch, today's price, tomorrow's smell." })),
  ...POSTS.map(([x, y]) => ({ id: `post_${x}`, x, y, lookKey: 'mooring_posts', look: 'A mooring post, worn smooth by ropes. Older than the houses, somebody told me once.' })),
  // (The Fishmonger stands in front of her own door at (4, 3).)
  ...DOORS.filter((x) => x !== 4).map((x) => ({ id: `door_${x}`, x, y: 2, h: 2, lookKey: 'bilge_doors', look: 'Not my door. Wet doorstep, though.' })),
].map((o) => ({ solid: false, use: { '*': cherylDeclines }, ...o }));

// Old, but not Founder-old (Ottilie's rubbing instruction: floors, where the light falls).
for (const o of objects) if (['water_stairs', 'post'].includes(o.id.replace(/_\d+.*$/, ''))) o.use = { ...o.use, paper_charcoal: notFounderOld };

// ---------------------------------------------------------------------------
// People

const fishmongerNpc = {
  id: 'fishmonger', name: 'Fishmonger', x: 4, y: 4, facing: 'down',
  sprite: { sheet: fishmonger },
  behavior: { type: 'face', range: 3 },
  interact: async (g, self) => {
    if (firstMeet(g, 'fishmonger')) {
      await g.describe('The Fishmonger. In my class she cried when we did the water cycle. She took that personally too.');
      return g.say(self,
        'Miss! Look at my street! LOOK at it! Under water! Every high tide this week!',
        "It's never done that. Never. The sea's jealous of me, that's what it is. Always has been.",
        'Two more inches and it\'s in my cellar. Then where do I keep my ice? Where do I keep my DIGNITY?');
    }
    return g.say(self, cycle(g, 'fishmonger.repeat', [
      'The sea. Jealous. I\'ve always said.',
      "Buy a fish. Don't buy a fish. Nothing matters. The sea is coming for me personally.",
    ]));
  },
  use: {
    moon_chart: (g, self) => g.say(self, 'Very pretty. Can it stop the sea? Then I don\'t want it.'),
    '*': (g, self) => g.say(self, "Can it stop the sea? Then I don't want it."),
  },
};

// The Boatman, in his boat beside the bridge; talk to him from the bridge at (13, 9).
const boatmanNpc = {
  id: 'boatman', name: 'Boatman', x: 14, y: 9, w: 2, facing: 'down',
  sprite: { sheet: boatman, frame: 'rock' },
  turnToTalk: false,
  shadow: false,
  emote: { frame: 'note', every: [4, 7] },
  interact: async (g, self) => {
    g.setSprite(self, { sheet: boatman, frame: 'sing' });
    if (firstMeet(g, 'boatman')) {
      g.sfx('boatman_sing');
      await g.say(self, '♪ Oh the water is wet, and the boat is a boat ♪ ...Morning, Miss!');
      g.setSprite(self, { sheet: boatman, frame: 'rock' });
      await g.describe("The Boatman. He's been in that boat since he was fourteen. I'm not sure he has legs.");
      return g.say(self,
        "Want a ride? I don't go anywhere. I just float. A boatman stays in his boat.",
        'The Water Stairs? Go down forever. My uncle swam to the bottom once. Came up on a Tuesday. He went in on a Thursday.');
    }
    const n = bump(g, 'boatman.repeat');
    if (n % 2 === 0) {
      g.sfx('boatman_sing');
      await g.say(self, '♪ The man is a man, and the boat is a boat ♪');
    } else {
      await g.say(self, "Out of the boat, I'm just a man standing about. In the boat, I'm a BOATMAN.");
    }
    g.setSprite(self, { sheet: boatman, frame: 'rock' });
  },
  use: { '*': (g, self) => g.say(self, "It won't fit in the boat. Nothing fits in the boat but me.") },
};

const cat = {
  id: 'cat', x: 20, y: 4, sprite: { sheet: props, frame: 'cat' },
  look: 'A Bilge cat, sitting as far from the water as the quay allows. Which is not very far.',
};

// ---------------------------------------------------------------------------

export const bilgeMap = composedMap(compose, {
  id: 'bilge',
  name: 'The Bilge',
  tileset: act2Tiles,
  music: 'harbor',
  lighting: 'day',
  ambience: ['canal', 'gulls'],
  step: 'step_stone',
  spawn: [11, 4],
  exits: [
    { x: 11, y: 0, w: 2, to: 'fountain_square', at: [11, 15], facing: 'up' },
    { x: 31, y: 11, h: 3, to: 'harbor', at: [1, 6], facing: 'right', sfx: 'step_stone' },
    // West: up the Goat Path (structure pass). Arrives at its bottom, (14, 39–41).
    { x: 0, y: 11, h: 3, to: 'goat_path', at: [14, 39], facing: 'left', sfx: 'step_stone' },
  ],
  triggers: [
    {
      // Wading into the flooded end of the south quay.
      x: 0, y: 11, w: 6, h: 2, stop: false,
      when: (g) => (g.flag('n.floodSeen') || 0) < 2 && !g.flag('fx.inFlood'),
      run: async (g) => {
        const n = bump(g, 'floodSeen');
        g.setFlag('fx.inFlood', true);
        if (n === 0) await g.describe("The lowest street, under an inch of water. It's high tide. It was never this high at high tide.");
        else await g.describe("Wet feet in the Bilge. That's new.");
      },
    },
    {
      // Out of the water again: the next wade can comment.
      x: 6, y: 11, h: 3, stop: false,
      when: (g) => !!g.flag('fx.inFlood'),
      run: async (g) => { g.setFlag('fx.inFlood', null); },
    },
    {
      x: 0, y: 13, w: 6, stop: false,
      when: (g) => !!g.flag('fx.inFlood'),
      run: async (g) => { g.setFlag('fx.inFlood', null); },
    },
  ],
  onEnter: async (g) => {
    actWrongness(g);
    g.setFlag('fx.inFlood', null);
  },
  ambient: [
    // The Boatman hums to himself.
    { every: [9, 15], run: (g) => { if (Math.abs(g.player.x - 14) + Math.abs(g.player.y - 9) <= 8) g.sfx('boatman_sing', { volume: 0.5 }); } },
  ],
  entities: [...objects, fishmongerNpc, boatmanNpc, cat],
});
