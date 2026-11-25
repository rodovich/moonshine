// The Crown at dusk (docs/design/03-downstairs.md, "Crypt and Crown at dusk"): moon-eye studs set in the
// plaza's paving glow cyan at (5,8), (9,12), (14,9), (18,12), (3,10), (20,8), and in the stair at (11–12,14).
// This is only the plaza floor and the stair, to judge the studs; ?state=day shows them plain.

export function SCENE(state) {
  const day = state === 'day';
  const W = 24, H = 16;
  const blank = () => Array.from({ length: H }, () => Array(W).fill(null));
  const ground = blank(), objects = blank(), overhead = blank();
  const q = (x, y) => `${y % 2 ? 's' : 'n'}${x % 2 ? 'e' : 'w'}`;
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) ground[y][x] = `street:pave_${q(x, y)}`;
  for (let x = 0; x < W; x++) { ground[13][x] = 'street:retain_top'; ground[14][x] = 'street:retain'; ground[15][x] = 'street:retain_base'; }
  ground[13][11] = 'street:stairs_l'; ground[13][12] = 'street:stairs_r';
  const suf = day ? '_eye' : '_eye_glow';
  ground[14][11] = `moon_eyes:stairs_l${suf}`; ground[14][12] = `moon_eyes:stairs_r${suf}`;
  ground[15][11] = 'street:stairs_l'; ground[15][12] = 'street:stairs_r';
  for (const [x, y] of [[5, 8], [9, 12], [14, 9], [18, 12], [3, 10], [20, 8]]) ground[y][x] = `moon_eyes:pave_${q(x, y)}${suf}`;
  return {
    title: 'The Crown at ' + (day ? 'day' : 'dusk') + ': moon-eye studs',
    ground, objects, overhead,
    sprites: [],
    hero: [11 * 16, 11 * 16, 'down'],
    tint: day ? null : 'dusk',
    scale: 2,
  };
}
