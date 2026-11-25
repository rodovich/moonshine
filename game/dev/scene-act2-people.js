// Act 2's residents lined up on street paving, each playing an idle or pose (for judging the art).
const W = 20, H = 9;
const blank = () => Array.from({ length: H }, () => Array(W).fill(null));
const ground = blank(), objects = blank(), overhead = blank();
for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
  ground[y][x] = `street:pave_${y % 2 ? 's' : 'n'}${x % 2 ? 'e' : 'w'}`;
}
// placed by tile; x is the tile's center, y its bottom
const at = (sheet, frame, tx, ty, extra = {}) => ({ sheet, frame, x: tx * 16 + 8, y: ty * 16 + 16, ...extra });

const sprites = [
  // row 1: poses and idles
  at('counting_woman', 'sit_down', 1, 2),
  at('counting_woman', 'climb_up', 3, 2),
  at('mover', 'push_up', 5, 2, { alt: 'big' }),
  at('mover', 'scrub_down', 7, 2, { alt: 'other' }),
  at('mover', 'idle_down', 9, 2, { alt: 'big' }),
  at('tourist', 'sit_up', 11, 2),
  at('tourist', 'sit_up_hat', 13, 2),
  at('mayor', 'gesture_down', 15, 2),
  at('ambrose', 'sit_down', 17, 2),
  at('bench_man', 'sit_down', 19, 2),
  // row 2: more poses
  at('basin_woman', 'tip_down', 1, 5),
  at('watering_woman', 'water_down', 3, 5),
  at('girl', 'turn_right', 6, 5, { alt: 'a' }),
  at('girl', 'jump_down', 7, 5, { alt: 'c' }),
  at('girl', 'turn_left', 8, 5, { alt: 'b' }),
  // the rope: top-left at the first turner's tile x, bottom on the turners' feet line
  { sheet: 'rope', frame: 'rope', x: 6 * 16, y: 5 * 16 + 16 - 32, topLeft: true },
  at('mover', 'scrub_up', 10, 5, { alt: 'big' }),
  at('mover', 'run_left', 12, 5, { alt: 'other' }),
  at('counting_woman', 'down_1', 14, 5),
  at('counting_woman', 'left_2', 15, 5),
  at('mayor', 'right_1', 17, 5),
  at('tourist', 'down_0', 19, 5),
  // row 3: standing / walk frames
  at('counting_woman', 'down_0', 1, 8),
  at('counting_woman', 'up_0', 2, 8),
  at('counting_woman', 'right_0', 3, 8),
  at('mover', 'down_0', 5, 8, { alt: 'big' }),
  at('mover', 'up_0', 6, 8, { alt: 'other' }),
  at('mover', 'left_0', 7, 8, { alt: 'big' }),
  at('mayor', 'down_0', 9, 8),
  at('mayor', 'up_0', 10, 8),
  at('ambrose', 'down_0', 12, 8),
  at('basin_woman', 'down_0', 14, 8),
  at('watering_woman', 'down_0', 15, 8),
  at('girl', 'down_0', 17, 8, { alt: 'a' }),
  at('girl', 'down_0', 18, 8, { alt: 'b' }),
  at('girl', 'down_0', 19, 8, { alt: 'c' }),
];

export const SCENE = { title: "Act 2's residents", ground, objects, overhead, sprites, scale: 3 };
