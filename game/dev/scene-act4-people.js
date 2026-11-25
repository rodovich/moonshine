// Act 4 sprites and icons lined up on paving, with their idles and poses animating
// (docs/design/04-the-list.md, Art needed > Sprites).
const W = 20, H = 10;
const blank = () => Array.from({ length: H }, () => Array(W).fill(null));
const ground = blank(), objects = blank(), overhead = blank();
for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) ground[y][x] = `street:pave_${y % 2 ? 's' : 'n'}${x % 2 ? 'e' : 'w'}`;

const at = (sheet, frame, tx, row, extra = {}) => ({ sheet, frame, x: tx * 16 + 8, y: row * 16 + 15, ...extra });
const sprites = [
  // row 1: the Clockmaker and the Mayor arguing; the Clockmaker's other poses
  at('clockmaker', 'down_0', 1, 3),
  at('clockmaker', 'run_left', 3, 3),
  at('clockmaker', 'crouch_right', 5, 3),
  at('clockmaker', 'argue_right', 8, 3),
  at('mayor', 'argue_left', 9, 3),
  at('clockmaker', 'look_down', 12, 3, { alt: 'bridge' }),
  at('clockmaker', 'down_0', 13, 3, { alt: 'bridge' }),
  // Ambrose: climbing, ringing, holding out the ledger
  at('ambrose', 'up', 15, 3),
  at('ambrose', 'ring_up', 17, 3),
  at('ambrose', 'ledger_down', 19, 3),
  // row 2: Mott, the Movers on the mud, Cheryl's new poses
  at('mott', 'sit_down', 1, 6),
  at('mott', 'coil_down', 3, 6),
  at('mott', 'coil_left', 5, 6),
  at('mover', 'lookup_down', 7, 6, { alt: 'big' }),
  at('mover', 'lookup_down', 8, 6, { alt: 'other' }),
  at('cheryl', 'climb_up', 11, 6),
  at('cheryl', 'wheel_up', 13, 6),
  at('cheryl', 'shove_up', 15, 6),
  // row 3: critters, the Kid's mud splash, the teacup, and the two icons
  at('critters', 'crab_walk', 1, 8),
  at('critters', 'crab_idle', 3, 8),
  at('critters', 'fish_flop', 5, 8),
  at('sweaty_kid', 'left', 8, 8),
  at('critters', 'mud_splash', 9, 8),
  at('act4_props', 'teacup', 12, 8),
  at('items_act4', 'copper_coil', 15, 8),
  at('items_act4', 'square_jug', 17, 8),
];

export const SCENE = { title: 'Act 4 sprites and icons', ground, objects, overhead, sprites, scale: 2 };
