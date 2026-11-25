// Cheryl's flat (12 x 9), composed from the interior sheets per docs/design/01-opening.md.
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
//
// state: 'dusk' (everything in place) or 'morning' (mill and timer taken, the soap too).

export function SCENE(state = 'dusk') {
  const W = 12, H = 9;
  const blank = () => Array.from({ length: H }, () => Array(W).fill(null));
  const ground = blank(), objects = blank(), overhead = blank();
  const morning = state === 'morning';

  // Floor, with the walls' shadows along the north and west edges and a few odd tiles.
  for (let y = 2; y < 8; y++) for (let x = 1; x < 11; x++) {
    let f = 'floor';
    if ((x * 7 + y * 3) % 11 === 0) f = 'floor_b';
    if (x === 7 && y === 6) f = 'floor_c';
    if (y === 2) f = x === 1 ? 'floor_nw' : 'floor_n';
    else if (x === 1) f = 'floor_w';
    ground[y][x] = `interior:${f}`;
  }
  // Walls.
  for (let x = 1; x < 11; x++) { ground[0][x] = 'interior:wall_upper'; ground[1][x] = 'interior:wall_lower'; ground[8][x] = 'interior:wall_south'; }
  ground[0][0] = 'interior:wall_upper_w'; ground[0][11] = 'interior:wall_upper_e';
  ground[1][0] = 'interior:wall_lower_w'; ground[1][11] = 'interior:wall_lower_e';
  for (let y = 2; y < 8; y++) { ground[y][0] = 'interior:wall_side_w'; ground[y][11] = 'interior:wall_side_e'; }
  ground[8][0] = 'interior:wall_south_w'; ground[8][11] = 'interior:wall_south_e';
  ground[0][5] = 'interior:window_top_l'; ground[0][6] = 'interior:window_top_r';
  ground[1][5] = 'interior:window_l'; ground[1][6] = 'interior:window_r';
  ground[8][5] = 'interior:door';
  ground[8][6] = 'interior:wall_south_hook';

  // Wall pieces (objects layer, over the wall).
  objects[1][1] = 'furniture:shelf_l'; objects[1][2] = 'furniture:shelf_r';
  objects[1][4] = 'fittings:clock';
  objects[1][9] = 'furniture:bookshelf_l'; objects[1][10] = 'furniture:bookshelf_r';

  // Furniture.
  objects[2][1] = morning ? 'furniture:counter_l' : 'furniture:counter_l_mill';
  objects[2][2] = morning ? 'furniture:counter_r' : 'furniture:counter_r_timer';
  objects[2][3] = 'fittings:stove';
  objects[2][9] = 'furniture:bed_nw'; objects[2][10] = 'furniture:bed_ne';
  objects[3][9] = 'furniture:bed_sw'; objects[3][10] = 'furniture:bed_se';
  objects[3][8] = 'furniture:side_table';
  objects[4][3] = 'furniture:chair_l'; objects[4][6] = 'furniture:chair_r';
  objects[4][4] = 'furniture:table_chart_l'; objects[4][5] = 'furniture:table_chart_r';
  for (const [y, row] of [[5, 'n'], [6, 's']]) {
    objects[y][4] = `rug:rug_${row}w`; objects[y][5] = `rug:rug_${row}m`; objects[y][6] = `rug:rug_${row}e`;
  }
  objects[5][10] = 'furniture:wardrobe_top'; objects[6][10] = 'furniture:wardrobe_bot';
  objects[6][1] = morning ? 'fittings:washstand' : 'fittings:washstand_soap';

  return {
    title: `Cheryl's flat (${state})`,
    ground, objects, overhead,
    sprites: [],
    hero: [5 * 16 + 8, 7 * 16 + 16, 'up'],
    tint: morning ? 'day' : 'dusk',
    scale: 3,
  };
}
