// The Harbor (32 × 14) and the lamp room (8 × 8) at the top of the lighthouse.
// From docs/design/02-city.md.
//
//      x 0         1         2         3
//        01234567890123456789012345678901
//  y  0  ~~^^~~~~~~~~~~~~~~~~~~~~~~#ww#~~   ^ x2-3 up to the Goat Path; the lighthouse (26-29, 0-3)
//     2  ~~^^~#w##w##w##w##w##w#~~~#ww#~~   harbor-front houses (5-22)
//     3  ~~^^~#D##w##D##w##D##w#~~~#DD#~~   lighthouse door (27-28, 3)
//     4  ................................   the quay (y4-8); west edge (x0, y6-8) → the Bilge
//     9  nnnnnnnnnnnnnnnnnnnnnnnnnnnnnnKK   quay edge; KK the Keyhole (30-31, 9)
//    10  %%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%   the ferry (10-15, 10-11) alongside

import { composedMap, blankGrid } from '../opening/grid.js';
import { act2Tiles } from './tiles.js';
import { layout, house, pave, bump, cycle, firstMeet, getItem, cherylDeclines, actWrongness } from './common.js';
import { mott } from '../../art/act4_sprites.js';
import { mott_jug } from '../../art/act6_sprites.js';
import { ferry_level } from '../../art/act6_surface.js';
import { keeper } from '../../art/act5_sprites.js';
import { fx } from '../../art/fx.js';

const W = 32, H = 14;
const q = (x, y) => `${y % 2 ? 's' : 'n'}${x % 2 ? 'e' : 'w'}`;
const DOORS = { 6: 'locked', 12: 'office', 18: 'locked' };

// The Harbor's rows 0–8, exactly as Act 2 draws them: paving, the headland
// with the Goat stair, the harbor-front terrace, the lighthouse and its door,
// the crates, nets, and bollards. Exported so later states of the Harbor (Act
// 5's risen Harbor) keep the same harbor front. `L` is a layout from
// act2/common.js (`layout(W, H, blankGrid)`), at least 32 wide.
export function harborTopRows(L) {
  for (let y = 0; y <= 8; y++) for (let x = 0; x < W; x++) L.set('ground', x, y, pave(x, y));

  // ---- The headland behind the harbor front, the Goat stair, the lighthouse ----
  for (let y = 0; y <= 3; y++) for (let x = 0; x < W; x++) {
    let f = `cliff_${y % 2 ? 's' : 'n'}${x % 2 ? 'e' : 'w'}`;
    if (y === 1 && (x === 9 || x === 24)) f = 'cliff_gull';
    if (y === 3) f = `cliff_foot_${x % 2 ? 'b' : 'a'}`;
    L.set('ground', x, y, `headland:${f}`, true);
  }
  // A painted board at the west end: <- THE BILGE.
  ['0', '1', '2'].forEach((n, i) => L.set('detail', 1 + i, 4, `signpost:bilge_${n}`, true));
  const top = [], base = [];
  for (let x = 5; x <= 22; x++) {
    const door = DOORS[x];
    top.push(x === 5 || x === 22 ? '#' : door ? 'D' : x % 3 === 0 ? 'w' : '#');
    base.push(x === 5 || x === 22 ? '#' : door ? 'D' : x % 3 === 0 ? 'w' : '#');
  }
  house(L, 5, 2, { roofRows: 0, top: top.join(''), base: base.join(''), palette: 'white_sage' });
  for (let y = 0; y <= 3; y++) for (let x = 0; x <= 3; x++) L.set('detail', 26 + x, y, `lighthouse:lighthouse_x${x}y${y}`, true);
  L.set('ground', 27, 3, pave(27, 3), false); L.set('ground', 28, 3, pave(28, 3), false);
  L.block(27, 3, false); L.block(28, 3, false);

  // ---- The quay: crates, nets, bollards ----
  L.set('detail', 7, 4, 'props:crate', true); L.set('detail', 8, 4, 'props:crate', true);
  L.set('detail', 20, 4, 'harbor_props:nets', true);
  L.set('detail', 8, 8, 'harbor_props:bollard_rope', true);
  L.set('detail', 18, 8, 'harbor_props:bollard_rope', true);
  L.set('detail', 13, 8, 'harbor_props:bollard', true);
}

function compose() {
  const L = layout(W, H, blankGrid);
  harborTopRows(L);

  // ---- The quay edge, the Keyhole, and the sea ----
  for (let x = 0; x < W; x++) {
    L.set('ground', x, 9, `harbor_quay:quay_${x % 2 ? 'b' : 'a'}`, true);
    for (let y = 10; y < H; y++) L.set('ground', x, y, `sea:sea_${q(x, y)}`, true);
  }
  L.set('ground', 30, 9, 'harbor_quay:keyhole_l', true); L.set('ground', 31, 9, 'harbor_quay:keyhole_r', true);
  // The canal runs out under the quay here.
  L.set('ground', 1, 9, 'harbor_culvert:culvert_l', true); L.set('ground', 2, 9, 'harbor_culvert:culvert_r', true);
  L.set('ground', 1, 10, 'harbor_culvert:outflow_l', true); L.set('ground', 2, 10, 'harbor_culvert:outflow_r', true);
  return L.done();
}

// ---------------------------------------------------------------------------
// Objects

const objects = [
  {
    // Includes the quay edge beside her, so she can be reached from the quay.
    id: 'ferry', x: 10, y: 9, w: 6, h: 3,
    looks: ["Mott's ferry, the Persistence. It hasn't crossed since Tuesday.", 'There\'s a mainland over there, with the Pelletiers on it, waiting.'],
  },
  { id: 'sign_bilge', x: 1, y: 4, w: 3, look: 'A painted board: THE BILGE, and an arrow pointing west, back along the canal.' },
  { id: 'harbor_office', x: 12, y: 2, h: 2, look: 'The Harbor Office. A note on the door: GONE TO LOOK FOR THE LANDING.' },
  ...[6, 18].map((x) => ({ id: `door_${x}`, x, y: 2, h: 2, lookKey: 'harbor_doors', look: 'Not my door. It smells of tar and yesterday\'s fish.' })),
  {
    id: 'sea_view', x: 19, y: 9, w: 11,
    looks: [
      ['The Bowl, flat calm. On the far side, the mouth, and the Teeth, white with surf.', "Nobody sails near the Teeth. Nobody needs to. They're a long way off."],
      'The Teeth. A long way off.',
    ],
  },
  ...[[0, 10], [16, 3]].map(([x, w]) => ({ id: `harbor_water_${x}`, x, y: 9, w, lookKey: 'harbor_water', look: 'The harbor, slopping at the quay. The sea has nothing to say this morning. It\'s thinking.' })),
  {
    id: 'keyhole', x: 30, y: 9, w: 2,
    look: 'Under the lighthouse the rock has a hole worn clean through it. The Keyhole. The sea goes in and out of it like breath.',
  },
  ...[8, 18].map((x) => ({ id: `bollard_${x}`, x, y: 8, lookKey: 'bollards', look: "A bollard. Mott's sitting on the good one." })),
  { id: 'crates', x: 7, y: 4, w: 2, lookKey: 'crates', look: 'Crates of nothing much, waiting for a ferry.' },
  { id: 'nets', x: 20, y: 4, look: 'Nets, drying. Or forgotten. With nets it\'s hard to tell.' },
  // The lighthouse, round its door (the door itself is the way in).
  ...[[26, 0, 1, 4], [29, 0, 1, 4]].map(([x, y, w, h]) => ({
    id: `lighthouse_${x}`, x, y, w, h, lookKey: 'lighthouse', look: 'The Prow Light. Somebody up there polishes it every hour of the day.',
  })),
  { id: 'cliff', x: 23, y: 2, w: 3, h: 2, lookKey: 'cliff', look: "The Prow's cliff comes right down to the water here. The goats don't." },
].map((o) => ({ solid: false, use: { '*': cherylDeclines }, ...o }));

const ferrySprite = {
  // Drawn as a sprite (176 × 80) whose top-left is at (8, 8); its ropes run to the bollards.
  id: 'ferry_sprite', x: 8, y: 12, w: 11, solid: false, shadow: false,
  sprite: { sheet: ferry_level, frame: 'persistence_level' },
  layer: 'ground',
};

// ---------------------------------------------------------------------------
// Captain Mott, on his bollard with a square jug.

const MOTT_SIT = { sheet: mott, frame: 'sit_down' };

async function swig(g, self) {
  g.setSprite(self, { sheet: mott_jug, frame: 'raise_down' });
  await g.wait(1.4);
  g.setSprite(self, MOTT_SIT);
}

const mottNpc = {
  id: 'mott', name: 'Mott', x: 13, y: 8, facing: 'down',
  sprite: MOTT_SIT,
  offset: [0, -8],
  turnToTalk: false,
  interact: async (g, self) => {
    if (firstMeet(g, 'mott')) {
      await g.describe("Captain Mott. Ferryman, distiller, and the only person in Tessel saying something I believe.");
      return g.say(self,
        "Cheryl. Sit down. No, don't. Nobody sits with me this week. I'm the man who says the island moves.",
        "It moves. The whole island. I came in Tuesday and the landing wasn't where I left it. A hand to the left.",
        "I know that face. Everyone makes that face. I'm only a little drunk, and only because I'm right.",
        'Everyone says "That\'s moonshine, Mott." Well, it is. I make it. Doesn\'t mean I\'m wrong.');
    }
    return g.say(self, ...[].concat(cycle(g, 'mott.repeat', [
      'A hand to the left. A bit more every day.',
      ["Keeper's got a telescope she's never looked through. I asked to borrow it, to look at the Gate.",
        "Moon's a hand to the left, Cheryl. I wanted to measure it. She said I'd smudge it."],
      "Ferry's not crossing till the island holds still.",
      "My grandfather found copper in the sea cave, down the Back. Built a still around it. Best thing he ever did.",
    ])));
  },
  use: {
    moon_chart: async (g, self) => {
      await g.say(self, '...Thirty-one years of moons. Huh.');
      await swig(g, self);
      await g.say(self, "No. Not today. Today I'm drinking.");
      await g.think("Not today, he says. So some other day. I'll hold him to that.");
    },
    telescope: (g, self) => g.say(self, "She gave it you? ...Keep it. I don't need a telescope to see the Gate's wrong. I need a drink."),
    guidebook: (g, self) => g.say(self, '"The friendly ferryman." Ha.'),
    '*': (g, self) => g.say(self, 'Not unless it holds the island still.'),
  },
};

// ---------------------------------------------------------------------------

export const harborMap = composedMap(compose, {
  id: 'harbor',
  name: 'The Harbor',
  tileset: act2Tiles,
  music: 'harbor',
  lighting: 'day',
  ambience: ['gulls', 'wind'],
  step: 'step_stone',
  spawn: [2, 6],
  exits: [
    { x: 0, y: 6, h: 3, to: 'bilge', at: [30, 11], facing: 'left', sfx: 'step_stone' },
    { x: 27, y: 3, w: 2, to: 'lamp_room', at: [3, 6], facing: 'up' },
  ],
  onEnter: async (g) => { actWrongness(g); },
  ambient: [
    // Mott takes a swig now and then; gulls wheel over the quay.
    { every: [10, 16], run: (g) => { const m = g.npc('mott'); if (m) { g.setSprite(m, { sheet: mott_jug, frame: 'raise_down' }); setTimeout(() => { if (g.npc('mott')) g.setSprite('mott', MOTT_SIT); }, 1400); } } },
    {
      every: [6, 11],
      run: (g) => {
        const y = 4 + g.random(0, 4);
        const from = g.random(0, 1) ? -1 : 33;
        g.spawnEffect({ sprite: { sheet: fx, frame: 'gull' }, path: [[from, y], [32 - from, y - 3]], speed: 1.1, layer: 'top' });
        if (g.random(0, 2) === 0) g.sfx('gull', { volume: 0.5 });
      },
    },
  ],
  entities: [...objects, ferrySprite, mottNpc],
});

// ---------------------------------------------------------------------------
// The lamp room

const LW = 8, LH = 8;

function composeLamp(g) {
  const L = layout(LW, LH, blankGrid);
  for (let y = 0; y < LH; y++) for (let x = 0; x < LW; x++) L.set('ground', x, y, 'lamproom:wall', true);
  for (let x = 1; x < LW - 1; x++) L.set('ground', x, 1, 'lamproom:window', true);
  for (let y = 2; y < LH - 1; y++) for (let x = 1; x < LW - 1; x++) L.set('ground', x, y, 'lamproom:floor', false);
  for (let y = 0; y < 2; y++) for (let x = 0; x < 2; x++) L.set('detail', 3 + x, 2 + y, `lamproom:lamp_x${x}y${y}`, true);
  L.set('ground', 3, LH - 1, 'lamproom:stair_down_l', false); L.set('ground', 4, LH - 1, 'lamproom:stair_down_r', false);
  // The telescope under a dust sheet, facing the wall, until she gives it away.
  if (!telescopeGone(g)) {
    L.set('detail', 6, 5, 'lamproom:scope_sheet_bot', true);
    L.set('detail', 6, 4, 'lamproom:scope_sheet_top', true);
  } else {
    L.set('detail', 6, 5, 'lamproom:sheet_empty', true);
  }
  return L.done();
}

// The telescope has left the lamp room (given to Cheryl, or, for old saves, put
// straight into the Shop window).
const telescopeGone = (g) => !!(g.flag('got.telescope') || g.flag('telescope.migrated'));

async function giveTelescope(g, self) {
  await g.say(self,
    "That thing. Take it. Every time I turn my back, it's pointing at the sea.",
    "Brass wants looking AT, not looking through. Put it somewhere it'll be looked at.");
  g.setFlag('got.telescope');
  g.sfx('telescope');
  await getItem(g, 'telescope');
}

const keeperNpc = {
  id: 'keeper', name: 'Lighthouse Keeper', x: 4, y: 4, facing: 'up',
  sprite: { sheet: keeper, frame: 'polish_up' },
  turnToTalk: false,
  interact: async (g, self) => {
    if (firstMeet(g, 'keeper')) {
      await g.describe('The Lighthouse Keeper. In my class she sat with her back to the window. Every year. I thought it was the glare.');
      await g.say(self,
        "Don't come near the lamp. I've just done it.",
        "Twenty-two years I've kept this light. Brightest lamp on any coast. Look at that shine.",
        "The sea? I don't look at the sea. You don't look at the sea. You look at the lamp.");
      // If Cheryl has already looked at the telescope, she hands it over now.
      if (!telescopeGone(g) && g.looks('telescope') > 0) await giveTelescope(g, self);
      return;
    }
    // On the second talk she hands it over.
    if (!telescopeGone(g)) return giveTelescope(g, self);
    return g.say(self, cycle(g, 'keeper.repeat', ['Polish, polish.', "A keeper who looks at the sea is a keeper who's stopped polishing."]));
  },
  use: { '*': (g, self) => g.say(self, "Don't bring that near the lamp.") },
};

const lampObjects = [
  { id: 'lamp', x: 3, y: 2, w: 2, h: 2, look: "The lamp. Brass and glass, polished till it hurts. She'd notice if I breathed on it." },
  {
    id: 'telescope', x: 6, y: 5, when: (g) => !telescopeGone(g),
    look: 'A brass telescope under a dust sheet, facing the wall. Like it\'s being punished.',
  },
  {
    // The empty dust sheet once the telescope is gone (Act 4's lamp room has its own).
    id: 'empty_sheet', x: 6, y: 5, when: (g) => telescopeGone(g) && !g.flag('act4.started'),
    look: 'The dust sheet, in a heap. Nothing under it now but a clean patch of floor.',
  },
  { id: 'windows', x: 1, y: 1, w: 6, look: 'From up here: the whole Bowl, the Rim, the mouth, the Teeth. She only has eyes for the lamp.' },
].map((o) => ({ solid: false, use: { '*': cherylDeclines }, ...o }));

export const lampRoomMap = composedMap(composeLamp, {
  id: 'lamp_room',
  name: 'The lamp room',
  tileset: act2Tiles,
  music: 'harbor',
  musicFilter: 'muffled',
  lighting: 'day',
  background: 'ink',
  ambience: ['wind'],
  step: 'step_stone',
  spawn: [3, 6],
  exits: [{ x: 3, y: LH - 1, w: 2, to: 'harbor', at: [27, 4], facing: 'down', sfx: 'step_stairs' }],
  onEnter: async (g) => { actWrongness(g); },
  entities: [...lampObjects, keeperNpc],
});
