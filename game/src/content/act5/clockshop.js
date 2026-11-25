// The Clockmaker's Shop (10 × 8), on the Crown (docs/design/05-high-and-dry.md,
// "Clockmaker's Shop"): thirty clocks at thirty times, his bench with the
// clock's drive in pieces, and the door propped open with the bell's old
// clapper. He swaps it for Mott's square jug, a doorstop that doesn't roll.
//
//      x 0
//        0123456789
//  y  0  ##########
//     1  #cc#cc#cc#   c clocks on the wall, each a different time
//     2  #........#
//     3  #bbb.....#   bbb the workbench, the drive in pieces (1-3, 3)
//     4  #.K......#   K the Clockmaker (2, 4), at his bench, his back to us
//     5  #......d.#   d the doorstop: the clapper (7, 5)
//     6  #........#
//     7  ####DD####   the door (4-5, 7) → the Crown (12, 7)

import { composedMap, blankGrid } from '../opening/grid.js';
import { act5Tiles } from './tiles.js';
import { clockmaker } from '../../art/act4_sprites.js';
import { items_act4 } from '../../art/act4_sprites.js';
import { clockshop } from '../../art/act5_surface.js';
import { WRONGNESS, hasClapper, advanceTeeth, layout, bump, cycle, getItem, cherylDeclines, firstMeet } from './common.js';
import { act5Loops } from './loops.js';

const W = 10, H = 8;
const jugIn = (g) => !!g.flag('clockmaker.jug');

function compose(g) {
  const L = layout(W, H, blankGrid);
  for (let y = 2; y < H - 1; y++) for (let x = 1; x < W - 1; x++) L.set('ground', x, y, 'shop:floor', false);
  for (let x = 0; x < W; x++) {
    const e = x === 0 ? '_w' : x === W - 1 ? '_e' : '';
    L.set('ground', x, 0, `interior:wall_upper${e}`, true);
    L.set('ground', x, 1, `interior:wall_lower${e}`, true);
    L.set('ground', x, H - 1, `interior:wall_south${e}`, true);
  }
  for (let y = 2; y < H - 1; y++) { L.set('ground', 0, y, 'interior:wall_side_w', true); L.set('ground', W - 1, y, 'interior:wall_side_e', true); }
  ['clocks_a', 'clocks_b', 'clocks_c', 'clocks_d', 'clocks_e', 'clocks_f'].forEach((c, i) => L.set('detail', [1, 2, 4, 5, 7, 8][i], 1, `clockshop:${c}`));
  L.set('detail', 1, 3, 'clockshop:bench_l', true); L.set('detail', 2, 3, 'clockshop:bench_m', true); L.set('detail', 3, 3, 'clockshop:bench_r', true);
  // The door: propped open by the clapper, then swung shut once it's gone.
  const door = hasClapper(g) ? 'door_shut' : 'door_open';
  L.set('ground', 4, H - 1, `clockshop:${door}_l`, false); L.set('ground', 5, H - 1, `clockshop:${door}_r`, false);
  return L.done();
}

// ---------------------------------------------------------------------------

async function clockmakerTalk(g, self) {
  if (jugIn(g)) return g.say(self, 'Square. It just sits there. I could weep.');
  if (firstMeet(g, 'clockmaker5')) {
    return g.say(self,
      "Miss. Come in. Mind the door, it won't stay open on its own. Nothing in this town keeps still.",
      "Except that. My doorstop. The only thing on the island that's stayed where I put it all week.",
      "The clock's in pieces. The sun's thirteen minutes out. I've stopped writing to the observatory. They've stopped writing back.");
  }
  return g.say(self, cycle(g, 'clockmaker5.repeat', [
    'That doorstop came out of the bell, you know. When I fitted the clock. Ugly old thing. Heavy as sin.',
    "If I had a doorstop that didn't roll. Square. Heavy. I'd sleep at night.",
  ]));
}

async function giveJug(g, self) {
  g.takeItem('square_jug');
  g.sfx('give');
  g.setSprite(self, { sheet: clockmaker, frame: 'jug_down' });
  g.faceNpc(self, 'down');
  await g.say(self,
    'A jug. Square. Heavy. ...Doesn\'t roll. Doesn\'t ROLL, Miss.',
    "Smells of-- is that turpentine? Never mind. It's perfect. It's a perfect doorstop.");
  // He sets the jug down by the door, and hands her the old lump.
  g.setSprite(self, { sheet: clockmaker });
  await g.moveNpc(self, [6, 5]);
  g.faceNpc(self, 'down');
  g.sfx('knock');
  g.setFlag('clockmaker.jug');
  await g.wait(0.4);
  g.faceNpc(self, 'player');
  await g.say(self, 'Take the old lump. I never want to see it again. It hums at night.');
  g.setFlag('got.clapper');
  await getItem(g, 'clapper');
  await g.describe("Heavy as sin. He wasn't exaggerating.");
  advanceTeeth(g);
  await g.moveNpc(self, [2, 4]);
  g.faceNpc(self, 'up');
}

const clockmakerNpc = {
  id: 'clockmaker5', name: 'Clockmaker', x: 2, y: 4, facing: 'up',
  sprite: { sheet: clockmaker, frame: 'bench_up' },
  turnToTalk: true,
  interact: async (g, self) => {
    g.setSprite(self, { sheet: clockmaker });
    g.faceNpc(self, 'player');
    try { await clockmakerTalk(g, self); } finally {
      g.faceNpc(self, 'up');
      g.setSprite(self, { sheet: clockmaker, frame: 'bench_up' });
    }
  },
  use: {
    square_jug: async (g, self) => {
      g.setSprite(self, { sheet: clockmaker });
      g.faceNpc(self, 'player');
      await giveJug(g, self);
      g.setSprite(self, { sheet: clockmaker, frame: 'bench_up' });
    },
    clapper: (g, self) => g.say(self, 'Get it out of my shop, Miss. Respectfully.'),
    guidebook: (g, self) => g.say(self, "Don't. Page forty. I know what it says. I've written to them about page forty."),
    '*': (g, self) => g.say(self, "Does it keep still? Then I don't want it."),
  },
};

const objects = [
  {
    id: 'clocks', x: 1, y: 1, w: 8, lookKey: 'clocks5',
    looks: [['A wall of clocks, every one at a different time. All of them perfect. All of them different.', "He keeps them to prove the sun wrong. The sun isn't bothered."], 'A wall of clocks, ticking at each other.'],
  },
  {
    id: 'bench5', x: 1, y: 3, w: 3,
    look: 'His clock\'s drive, in pieces, laid out in rows. Every screw has its own little dish.',
  },
  {
    // Beside the door (4-5, 7), holding its east leaf open.
    id: 'doorstop', x: 6, y: 6, kind: 'object', solid: true,
    sprite: { sheet: clockshop, frame: 'clapper' },
    when: (g) => !hasClapper(g),
    interact: async (g) => {
      if (bump(g, 'doorstop') === 0) {
        return g.describe('A great bronze lump, propping the door. Rounded at one end, notched at the other, dark with age.', 'That notch is made to catch something.');
      }
      return g.describe('The bell\'s old clapper. Rounded, notched, and heavy as sin.');
    },
    use: {
      crowbar: (g) => g.describe("Not in front of him. He'd have a turn."),
      square_jug: (g) => g.describe('A swap. He should be the one to make it, though. It\'s his door.'),
      '*': cherylDeclines,
    },
  },
  {
    id: 'jug_doorstop', x: 6, y: 6, kind: 'object', solid: true,
    sprite: { sheet: items_act4, frame: 'square_jug' },
    when: jugIn,
    look: "Mott's jug, holding the door. It doesn't roll. It's never looked so happy.",
  },
].map((o) => ({ solid: false, use: { '*': cherylDeclines }, ...o }));

// Leaving with the clapper the first time: the door swings shut behind her.
async function leave(g) {
  const x = 12;
  if (hasClapper(g) && !g.flag('clockmaker.doorBanged')) {
    g.setFlag('clockmaker.doorBanged');
    g.sfx('door');
    await g.changeMap('crown', x, 7, 'down');
    g.sfx('door_close');
    g.shake(1, 0.3);
    await g.say('Clockmaker', "Ah! ...It's fine! The jug's fine! It's the DOOR that moved!", { position: 'top' });
    return;
  }
  g.sfx('door');
  return g.changeMap('crown', x, 7, 'down');
}

export const clockshopMap = composedMap(compose, {
  id: 'clockmaker_shop',
  name: "The Clockmaker's Shop",
  tileset: act5Tiles,
  music: 'neighborhood',
  musicFilter: 'muffled',
  lighting: 'day',
  background: 'ink',
  ambience: ['clock_tick'],
  step: 'step_wood',
  spawn: [4, 6],
  exits: [
    { x: 4, y: H - 1, to: 'crown', at: [12, 7], facing: 'down', run: leave },
    { x: 5, y: H - 1, to: 'crown', at: [12, 7], facing: 'down', run: leave },
  ],
  onEnter: async (g) => {
    g.setWrongness(WRONGNESS);
    act5Loops(g, []);
  },
  entities: [...objects, clockmakerNpc],
});

export const clockshopScripts = { giveJug, clockmakerTalk };
