// Cheryl's flat (12 × 9): one room under her roof, where her things are.
// Layout and lines from docs/design/01-opening.md; art from docs/art-opening.md.
//
//      012345678901
//   0  ############
//   1  #mm#cWW##bb#   m kitchen shelf, c clock, W window, b bookshelf
//   2  #12S.....BB#   1 pepper mill, 2 egg timer (on the counter), S stove, B bed
//   3  #.......fBB#   f side table with the photo, face down
//   4  #..kXXk....#   X table (moon chart on it), k chairs
//   5  #...rrr...A#   r rug, A wardrobe
//   6  #w..rrr...A#   w washstand (soap)
//   7  #..........#
//   8  #####DH#####   D door, H plug hook

import { composedMap, blankGrid } from './grid.js';
import { openingTiles } from './tiles.js';
import { morning, getItem, bump, cherylDeclines } from './common.js';

const W = 12, H = 9;

function compose(g) {
  const f = (n) => g.flag(n);
  const ground = blankGrid(W, H), detail = blankGrid(W, H), overhead = blankGrid(W, H);
  const solid = blankGrid(W, H, false);
  const step = blankGrid(W, H); // the map's own footstep is tile
  for (let y = 5; y <= 6; y++) for (let x = 4; x <= 6; x++) step[y][x] = 'step_rug';
  const counter = blankGrid(W, H, false);
  counter[2][1] = counter[2][2] = true; // reach the shelf across the counter
  const block = (x, y) => { solid[y][x] = true; };

  // Floor, with the walls' shadows along the north and west edges.
  for (let y = 2; y < 8; y++) for (let x = 1; x < 11; x++) {
    let fr = 'floor';
    if ((x * 7 + y * 3) % 11 === 0) fr = 'floor_b';
    if (x === 7 && y === 6) fr = 'floor_c';
    if (y === 2) fr = x === 1 ? 'floor_nw' : 'floor_n';
    else if (x === 1) fr = 'floor_w';
    ground[y][x] = `interior:${fr}`;
  }
  // Walls.
  for (let x = 1; x < 11; x++) {
    ground[0][x] = 'interior:wall_upper'; ground[1][x] = 'interior:wall_lower'; ground[8][x] = 'interior:wall_south';
  }
  ground[0][0] = 'interior:wall_upper_w'; ground[0][11] = 'interior:wall_upper_e';
  ground[1][0] = 'interior:wall_lower_w'; ground[1][11] = 'interior:wall_lower_e';
  for (let y = 2; y < 8; y++) { ground[y][0] = 'interior:wall_side_w'; ground[y][11] = 'interior:wall_side_e'; }
  ground[8][0] = 'interior:wall_south_w'; ground[8][11] = 'interior:wall_south_e';
  ground[0][5] = 'interior:window_top_l'; ground[0][6] = 'interior:window_top_r';
  ground[1][5] = 'interior:window_l'; ground[1][6] = 'interior:window_r';
  ground[8][5] = 'interior:door';
  ground[8][6] = 'interior:wall_south_hook';
  for (let x = 0; x < W; x++) { block(x, 0); block(x, 1); if (x !== 5) block(x, 8); }
  for (let y = 2; y < 8; y++) { block(0, y); block(11, y); }

  // Wall pieces.
  detail[1][1] = 'furniture:shelf_l'; detail[1][2] = 'furniture:shelf_r';
  detail[1][4] = 'fittings:clock';
  detail[1][9] = 'furniture:bookshelf_l'; detail[1][10] = 'furniture:bookshelf_r';

  // Furniture (all solid).
  const put = (x, y, ref) => { detail[y][x] = ref; block(x, y); };
  put(1, 2, f('got.pepper_mill') ? 'furniture:counter_l' : 'furniture:counter_l_mill');
  put(2, 2, f('got.egg_timer') ? 'furniture:counter_r' : 'furniture:counter_r_timer');
  put(3, 2, 'fittings:stove');
  put(9, 2, 'furniture:bed_nw'); put(10, 2, 'furniture:bed_ne');
  put(9, 3, 'furniture:bed_sw'); put(10, 3, 'furniture:bed_se');
  put(8, 3, 'furniture:side_table');
  put(3, 4, 'furniture:chair_l'); put(6, 4, 'furniture:chair_r');
  const chart = f('got.moon_chart') ? '' : '_chart';
  put(4, 4, `furniture:table${chart}_l`); put(5, 4, `furniture:table${chart}_r`);
  for (const [y, row] of [[5, 'n'], [6, 's']]) {
    detail[y][4] = `rug:rug_${row}w`; detail[y][5] = `rug:rug_${row}m`; detail[y][6] = `rug:rug_${row}e`;
  }
  put(10, 5, 'furniture:wardrobe_top'); put(10, 6, 'furniture:wardrobe_bot');
  put(1, 6, f('got.soap') ? 'fittings:washstand' : 'fittings:washstand_soap');

  return { ground, detail, overhead, solid, counter, step };
}

// Taking something from the room: look, take, and remember it's gone.
async function take(g, id, ...lines) {
  await g.describe(...lines);
  g.setFlag(`got.${id}`);
  await getItem(g, id);
}

const entities = [
  {
    id: 'pepper_mill', x: 1, y: 2, when: (g) => !g.flag('got.pepper_mill'),
    interact: (g) => (g.flag('oldMan.wantsKing')
      ? take(g, 'pepper_mill', 'My pepper mill. Black. Tall. Dignified, if you squint.')
      : take(g, 'pepper_mill', 'My pepper mill. Black, tall, and older than some of my friends. I\'ll bring it. You never know.')),
  },
  {
    id: 'egg_timer', x: 2, y: 2, when: (g) => !g.flag('got.egg_timer'),
    interact: (g) => take(g, 'egg_timer', "My egg timer. It ticks like it's furious about something. Then it dings, and it's over it."),
  },
  { id: 'shelf', x: 1, y: 1, w: 2, look: "Tins, a jar of capers I've been meaning to open since spring, and a teapot that drips." },
  { id: 'stove', x: 3, y: 2, look: "The stove. No kettle tonight. Cold baths only on Moonshine Night. That's the rule." },
  {
    id: 'clock', x: 4, y: 1,
    interact: (g) => g.describe(morning(g) ? 'Half past something.' : "Nearly moonrise. Roughly. That clock has never once been right, but it's always been confident."),
  },
  { id: 'window', x: 5, y: 1, w: 2, look: "My window looks at the Pelletiers' wall. I didn't buy this house for the window. I bought it for the roof." },
  // The bookshelf sits above the bed; the hotspot reaches one tile west so it can be looked at from (8,2).
  { id: 'bookshelf', x: 8, y: 1, w: 3, look: 'Twenty-nine years of lesson plans. In case anyone ever needs the water cycle explained in a hurry.' },
  {
    id: 'bed', x: 9, y: 2, w: 2, h: 2,
    interact: (g) => g.describe(morning(g)
      ? "I didn't sleep. The house creaked all night. Houses settle. This one felt like it was unsettling."
      : 'My bed. Later. Moon first.'),
  },
  { id: 'photo', x: 8, y: 3, look: 'I know what it is.' },
  {
    id: 'moon_chart', x: 4, y: 4, w: 2,
    interact: async (g) => {
      if (morning(g)) {
        if (g.flag('got.moon_chart')) return g.describe('The kitchen table. The chart left a clean rectangle in the crumbs.');
        await g.describe("Last night's tick. I put it where the moon really was: outside the Gate. It looks like a mistake. It isn't.");
        return take(g, 'moon_chart', "I'm taking it with me. I have questions for it.");
      }
      const n = bump(g, 'chart');
      if (n === 0) return g.describe('My moon chart. Thirty-one Moonshine Nights, a tick for every moonrise. Every one of them in the Gate.');
      if (n === 1) return g.describe('The first nineteen years are in two hands. The neat ticks are mine.');
      return g.describe('The last few ticks have crept a little to the right. My eyes, probably. Everything creeps right after fifty.');
    },
  },
  ...[3, 6].map((x) => ({ id: `chair_${x}`, x, y: 4, lookKey: 'kitchen_chairs', look: 'Kitchen chairs. One wobbles. I know which one, and I sit in the other.' })),
  {
    id: 'wardrobe', x: 10, y: 5, h: 2,
    interact: async (g) => {
      if (morning(g)) {
        if (g.flag('got.hat')) return g.describe('My good cardigan, and my other good cardigan. The hat is out seeing the world.');
        return take(g, 'hat', "My hat. It's daytime, and I'm going out.");
      }
      if (bump(g, 'wardrobe') === 0) return g.describe('My good cardigan, my other good cardigan, and my hat.');
      return g.describe("The hat's for daytime. It isn't daytime.");
    },
  },
  {
    id: 'washstand', x: 1, y: 6,
    interact: (g) => (g.flag('got.soap')
      ? g.describe('A jug, a basin, and a mirror I avoid before ten.')
      : take(g, 'soap', 'Lavender and pumice soap. The pumice is for my heels. The lavender is for my soul.')),
  },
  {
    id: 'plug_hook', x: 6, y: 8,
    interact: (g) => {
      if (morning(g)) return g.describe("The plug hook. Empty. I'm going to find out why.");
      if (g.hasItem('bath_plug') || g.flag('tub.plugged')) return g.describe('The plug hook. Empty, but only because the plug is busy.');
      if (g.flag('n.tub.noPlug') || g.flag('oldMan.wantsKing')) return g.describe("The plug hook. Empty. He's still got it downstairs.");
      return g.describe('The plug hook. Empty. Oh -- I lent the plug to him downstairs. A "chess emergency."');
    },
  },
].map((e) => ({ solid: false, use: { '*': cherylDeclines }, ...e })); // the tiles under hotspots are solid already

export const flatMap = composedMap(compose, {
  id: 'flat',
  name: "Cheryl's flat",
  tileset: openingTiles,
  lighting: (g) => (morning(g) ? 'day' : 'dusk'),
  background: 'ink',
  step: 'step_tile',
  spawn: [5, 7],
  exits: [{ x: 5, y: 8, to: 'cistern_court', at: [3, 12], facing: 'down' }],
  onEnter: async (g) => {
    g.playMusic(morning(g) ? 'morning_after' : 'cistern_court');
  },
  entities,
});
