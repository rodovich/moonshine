// The rebuilt Goat Path (docs/design/structure-pass.md, "The Goat Path, rebuilt", 16 x 42), placed
// from act2b_goat.js's GOAT_PATH_TILES to the Act 2 builder's layout, to judge the art in place:
// Mott's shack (2-5, 12-15) and jugs (7-8, 14), the Bilge paving at the foot, gulls wheeling over
// the drop, goats and Cheryl on the path.

import { GOAT_PATH_TILES } from '../src/art/act2b_goat.js';

export function SCENE() {
  const H = GOAT_PATH_TILES.length, W = GOAT_PATH_TILES[0].length;
  const blank = () => Array.from({ length: H }, () => Array(W).fill(null));
  const ground = blank(), objects = blank(), overhead = blank();
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) ground[y][x] = GOAT_PATH_TILES[y][x];
  for (let r = 0; r < 4; r++) for (let c = 0; c < 4; c++) ground[12 + r][2 + c] = `mott_shack:shack_x${c}y${r}`;
  objects[14][7] = 'mott_jugs:jugs_l'; objects[14][8] = 'mott_jugs:jugs_r';
  for (let y = 39; y <= 41; y++) for (let x = 9; x <= 15; x++) ground[y][x] = `street:pave_${y % 2 ? 's' : 'n'}${x % 2 ? 'e' : 'w'}`;
  const px = (x, y) => [x * 16 + 8, y * 16 + 16];
  const sprite = (sheet, frame, [x, y], extra = {}) => ({ sheet, frame, x, y, ...extra });
  return {
    title: 'Goat Path, rebuilt (16 x 42)',
    ground, objects, overhead,
    sprites: [
      // gulls wheeling below the path, over the sea at the top and off the viewpoint
      sprite('gull', 'wheel', [16, 90]),
      sprite('gull', 'wheel', [14, 200], { phase: 600 }),
      sprite('gull', 'wheel', [12, 300], { phase: 300 }),
      sprite('goat', 'eat_left', px(12, 11)),
      sprite('goat', 'left_1', px(6, 17), { alt: 'brown' }),
      sprite('goat', 'eat_right', px(8, 32), { alt: 'brown', phase: 300 }),
      sprite('mott', 'sit_down', px(4, 16)),
    ],
    hero: [14 * 16 + 8, 2 * 16 + 16, 'left'],
    scale: 2,
  };
}
