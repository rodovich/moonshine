// Act 6 sprites lined up on paving, idles animating (docs/art-act6.md, "Sprites").
const W = 22, H = 12;
const pave = (x, y) => `street:pave_${y % 2 ? 's' : 'n'}${x % 2 ? 'e' : 'w'}`;
const ground = Array.from({ length: H }, (_, y) => Array.from({ length: W }, (_, x) => pave(x, y)));
const at = (sheet, frame, tx, ty, extra = {}) => ({ sheet, frame, x: tx * 16 + 8, y: ty * 16 + 16, ...extra });

const sprites = [
  // row 1: the crowd falls over (fall_down_1), and the lurch itself (fall_down_0)
  at('mayor', 'fall_down_0', 1, 2), at('mayor', 'fall_down_1', 2, 2),
  at('crowd_a', 'fall_down_1', 4, 2), at('crowd_b', 'fall_down_1', 5, 2),
  at('mover', 'fall_down_1', 7, 2, { alt: 'big' }), at('mover', 'fall_down_1', 8, 2, { alt: 'other' }),
  at('fishmonger', 'fall_down_1', 10, 2), at('counting_woman', 'fall_down_1', 11, 2),
  at('tourist', 'fall_down_1', 13, 2), at('neighbor', 'fall_down_1', 14, 2),
  at('old_man', 'fall_down_1', 16, 2), at('shopkeeper', 'fall_down_1', 17, 2), at('kid', 'fall_down_1', 18, 2),
  at('sweaty_kid', 'fall_down_1', 19, 2), at('clockmaker', 'fall_down_1', 20, 2),
  // row 2: Cheryl
  at('cheryl', 'bath_down', 1, 5), at('bath_ripple', 'bath_ripple', 1, 5, { y: 5 * 16 + 16 - 3 + 4 }),
  at('cheryl', 'shoes_down_0', 3, 5), at('cheryl', 'shoes_down_1', 4, 5),
  at('cheryl', 'well_down_0', 6, 5), at('cheryl', 'well_down_1', 7, 5), at('cheryl', 'well_down_2', 8, 5),
  at('cheryl', 'write_up', 10, 5),
  at('mott_jug', 'raise_down', 12, 5),
  at('kid_finish', 'finish_down', 14, 5),
  at('chess_fly', 'chess_fly', 16, 5),
  { sheet: 'boatman_piano', frame: 'piano_rock', x: 19 * 16, y: 5 * 16 + 16 },
  // row 3: the epilogue people
  at('pelletier_m', 'down_0', 1, 8), at('pelletier_m', 'left_1', 2, 8),
  at('pelletier_f', 'down_0', 4, 8), at('pelletier_f', 'right_1', 5, 8),
  at('tourist_case', 'down_0', 7, 8), at('tourist_case', 'down_1', 8, 8),
  at('runner', 'down_1', 10, 8), at('runner', 'left_2', 11, 8), at('runner', 'down_3', 12, 8, { alt: 'b' }),
  at('counting_rosette', 'sit_down', 14, 8), at('counting_rosette', 'down_0', 15, 8),
];

// Each bath_ripple sits at Cheryl's waterline (row 29 of her frame).
sprites.forEach((s) => { if (s.sheet === 'bath_ripple') { s.x = 1 * 16 + 8; s.y = 5 * 16 + 16 - 2 + 6; } });

export const SCENE = { title: "Act 6's people", ground, sprites, scale: 2 };
