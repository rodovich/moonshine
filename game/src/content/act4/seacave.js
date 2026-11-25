// The Sea Cave (10 × 8), off the Goat Path: optional. The tide is out, so the
// cave can be entered; at the back, a Founder grate shows the Tide Wheel
// (docs/design/04-the-list.md, "Sea Cave").
//
//       0123456789
//    0  ##########
//    1  ####GG####   GG the Founder grate (4-5, 1)
//    2  #........#
//    3  #.pp.....#   pp a tide pool (2-3, 3)
//    4  #........#
//    5  #......k.#   k a crab
//    6  #........#
//    7  ####..####   the mouth (4-5, 7) → the Goat Path

import { composedMap, blankGrid, cherylDeclines } from './common.js';
import { act4Tiles } from './tiles.js';
import { critters } from '../../art/act4_sprites.js';

function compose(g) {
  const W = 10, H = 8;
  const turning = !!g.flag('bell.restored');
  const ground = blankGrid(W, H), detail = blankGrid(W, H), overhead = blankGrid(W, H);
  const solid = blankGrid(W, H, true);
  const step = blankGrid(W, H, 'step_sand');
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) ground[y][x] = 'seacave:rock';
  for (let x = 1; x < 9; x++) ground[1][x] = x % 2 ? 'seacave:rock_face_a' : 'seacave:rock_face_b';
  ground[1][4] = `seagrate:${turning ? 'fgrate_turn' : 'fgrate'}_l`; ground[1][5] = `seagrate:${turning ? 'fgrate_turn' : 'fgrate'}_r`;
  for (let y = 2; y <= 6; y++) {
    ground[y][0] = 'seacave:rock_edge_w'; ground[y][9] = 'seacave:rock_edge_e';
    for (let x = 1; x <= 8; x++) {
      ground[y][x] = y >= 5 ? 'seacave:sand_wet' : ['seacave:sand', 'seacave:sand_b', 'seacave:sand_shells'][(x * 3 + y) % 3];
      solid[y][x] = false;
    }
  }
  ground[3][2] = 'seacave:pool_l'; ground[3][3] = 'seacave:pool_r'; solid[3][2] = solid[3][3] = true;
  ground[7][4] = 'seacave:mouth_l'; ground[7][5] = 'seacave:mouth_r'; solid[7][4] = solid[7][5] = false;
  return { ground, detail, overhead, solid, step };
}

// Where the cave mouth leads: set by src/content/index.js when the Goat Path exists.
export const seaCave = { goatPath: null };

export const seaCaveMap = composedMap(compose, {
  id: 'sea_cave',
  name: 'The Sea Cave',
  tileset: act4Tiles,
  dark: 0.5,
  lights: (g) => [{ x: 4.5, y: 7, radius: 4 }, ...(g.flag('bell.restored') ? [{ x: 4.5, y: 1, radius: 2, color: 'relic_amber' }] : [])],
  ambience: ['surf', 'drips'],
  spawn: [4, 6],
  exits: [{
    x: 4, y: 7, w: 2,
    run: (g) => (seaCave.goatPath ? g.changeMap(seaCave.goatPath, 2, 37, 'right') : g.describe('The Goat Path, outside. (Not built yet.)')),
  }],
  entities: [
    {
      id: 'founder_grate', x: 4, y: 1, w: 2,
      interact: (g) => g.describe(g.flag('bell.restored')
        ? "The wheel behind the grate is turning, slow as a clock's hand. Amber light flickers through it."
        : 'A bronze grate, square, Founder-made. Behind it, in the dark, the rim of an enormous wheel. Still.'),
    },
    { id: 'tide_pool', x: 2, y: 3, w: 2, looks: [['A tide pool. A crab, a weed, and a single brass screw, polished by the sea.', "Mott's grandfather found his copper about here, I'd bet."], 'A crab, a weed, and a brass screw. The screw is the interesting one.'] },
    {
      id: 'crab', x: 7, y: 5, solid: false, shadow: false, sprite: { sheet: critters, frame: 'crab_walk' },
      behavior: { type: 'wander', area: [5, 4, 4, 3], pause: [1, 3] }, stepTicks: 36,
      look: 'A crab. It moves sideways, which is more than the rest of Tessel can manage today.',
    },
  ].map((o) => ({ solid: false, use: { moon_chart: (g) => g.describe("The moon chart isn't that sort of chart."), '*': cherylDeclines }, ...o })),
});
