// The Goat Path (docs/design/02-city.md, "Goat Path", 16 x 24), composed from act2b_goat.js
// to judge the art in place. Glyphs follow the design's map.

const MAP = [
  '~~~~~~~~~~~~~::~',
  '~gggggggggg=:::~',
  '~gggggggggg=:::~',
  '~gggggggggg=:::~',
  '~::::::::::::::~',
  '~::===========~~',
  '~::ggggggggggg~~',
  '~::ggggggggggg~~',
  '~::::::::::::::~',
  '~RRRR=====::::~~',
  '~RRRR:::::::::~~',
  '~#ww#:::::::::~~',
  '~#D##:::::::::~~',
  '~::::::::::::::~',
  '~::cc::::::::::~',
  '~======::::====~',
  '~gggggg::::gggg~',
  '~gggggg::::gggg~',
  '~::::::::::::::~',
  '~::============~',
  '~::%%%%%%%%%%%%~',
  'O::%%%%%%%%%%%%~',
  '~::%%%%%%%%%%%%~',
  '~::~~~~~~~~~~~~~',
];

export function SCENE() {
  const H = MAP.length, W = MAP[0].length;
  const blank = () => Array.from({ length: H }, () => Array(W).fill(null));
  const ground = blank(), objects = blank(), overhead = blank();
  const at = (x, y) => (y >= 0 && y < H && x >= 0 && x < W ? MAP[y][x] : '~');
  const land = (c) => !['~', '%', 'O'].includes(c);
  const gp = (f) => `goatpath:${f}`;
  const pathTile = (x, y) => gp(['path_a', 'path_b', 'path_a', 'path_c'][(x * 7 + y * 13) % 4]);
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const c = at(x, y);
    let ref;
    if (c === '~') {
      if (land(at(x + 1, y))) ref = gp('cliff_e');
      else if (land(at(x - 1, y))) ref = gp('cliff_w');
      else if (land(at(x, y + 1))) ref = gp('cliff_s');
      else if (land(at(x, y - 1))) ref = gp('cliff_n');
      else ref = gp('sea');
    } else if (c === ':' || c === 'c') ref = pathTile(x, y);
    else if (c === 'g') ref = gp((x + y) % 2 ? 'beans_a' : 'beans_b');
    else if (c === '=') {
      if (at(x - 1, y) === 'g' && at(x + 1, y) === ':') ref = gp('wall_v');
      else if (at(x, y + 1) === '%') ref = gp('wall_cove');
      else if (at(x + 1, y) === ':') ref = gp('wall_end_r');
      else if (at(x - 1, y) === ':') ref = gp('wall_end_l');
      else ref = gp('wall');
    } else if (c === '%') ref = gp(at(x - 1, y) === ':' ? 'cove_w' : 'cove');
    else if (c === 'O') ref = gp('cave_mouth');
    else if ('R#wD'.includes(c)) {
      const sx = x - 1, sy = y - 9;
      ref = `mott_shack:shack_x${sx}y${sy}`;
    }
    ground[y][x] = ref;
  }
  objects[14][3] = 'mott_jugs:jugs_l'; objects[14][4] = 'mott_jugs:jugs_r';
  const px = (x, y) => [x * 16 + 8, y * 16 + 16];
  const sprite = (sheet, frame, [x, y], extra = {}) => ({ sheet, frame, x, y, ...extra });
  return {
    title: 'Goat Path (16 x 24)',
    ground, objects, overhead,
    sprites: [
      sprite('goat', 'eat_left', px(8, 6)),
      sprite('goat', 'left_1', px(11, 17), { alt: 'brown' }),
      sprite('goat', 'eat_right', px(4, 18), { alt: 'brown', phase: 300 }),
      sprite('mott', 'sit_down', px(5, 12)),
    ],
    hero: [12 * 16 + 8, 10 * 16 + 16, 'down'],
    scale: 2,
  };
}
