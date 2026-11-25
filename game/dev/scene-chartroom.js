// Act 3: the Chart Room, laid out as docs/design/03-downstairs.md's map (16 x 14). An eight-sided room
// under the Blue Dome: the floor inlay at x3–12, y5–10, the pool of light from the Eye with the teapot's
// shadow, the last Keeper's chair (2,4) and table (3,4), and the inside of the Founders' Door (7–8, 1–2).
// ?state=open draws the bolt back; ?state=opened shows the door standing open.

export function SCENE(state) {
  const W = 16, H = 14;
  const blank = () => Array.from({ length: H }, () => Array(W).fill(null));
  const ground = blank(), objects = blank(), overhead = blank();
  const set = (layer, x, y, ref) => { if (x >= 0 && x < W && y >= 0 && y < H) layer[y][x] = ref; };
  const hull = f => `hull:${f}`, chart = f => `chart:${f}`, ds = f => `ds:${f}`;

  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) set(ground, x, y, hull('top'));
  // the north wall's face, rows 1–2: x3–12 on row 1, x2–13 on row 2 (the map's chamfered corners)
  for (let x = 2; x <= 13; x++) {
    if (x >= 3 && x <= 12) set(ground, x, 1, hull(x % 2 ? 'face_top' : 'face_top_b'));
    set(ground, x, 2, hull(x % 2 ? 'face_base' : 'face_base_b'));
  }
  set(ground, 2, 2, hull('face_base_end_l')); set(ground, 13, 2, hull('face_base_end_r'));
  set(ground, 4, 1, ds('niche_lit')); set(ground, 11, 1, ds('niche_lit'));
  const door = state === 'opened' ? 'fdoor_in_opened' : state === 'open' ? 'fdoor_in_open' : 'fdoor_in';
  set(ground, 7, 1, chart(`${door}_x0y0`)); set(ground, 8, 1, chart(`${door}_x1y0`));
  set(ground, 7, 2, chart(`${door}_x0y1`)); set(ground, 8, 2, chart(`${door}_x1y1`));
  // the floor: rows 3–12 per the map, with 45° corners
  const rows = { 3: [2, 13], 4: [1, 14], 5: [1, 14], 6: [1, 14], 7: [1, 14], 8: [1, 14], 9: [1, 14], 10: [1, 14], 11: [2, 13], 12: [3, 12] };
  for (const [y, [x0, x1]] of Object.entries(rows)) for (let x = x0; x <= x1; x++) set(ground, x, +y, hull('floor'));
  set(ground, 1, 3, hull('top_chamfer_nw')); set(ground, 14, 3, hull('top_chamfer_ne'));
  set(ground, 1, 11, hull('top_chamfer_sw')); set(ground, 14, 11, hull('top_chamfer_se'));
  set(ground, 2, 12, hull('top_chamfer_sw')); set(ground, 13, 12, hull('top_chamfer_se'));
  set(ground, 7, 13, hull('floor')); set(ground, 8, 13, hull('floor'));          // the passage south
  // the inlay (x3–12, y5–10) and the Eye's pool of light over it
  for (let ty = 0; ty < 6; ty++) for (let tx = 0; tx < 10; tx++) {
    set(ground, 3 + tx, 5 + ty, chart(`inlay_x${tx}y${ty}`));
    if (state !== 'dark') set(objects, 3 + tx, 5 + ty, chart(`pool_x${tx}y${ty}`));
  }
  // the last Keeper's table with the cup and ledger (3,4); the chair (2,4) is a sprite
  set(objects, 3, 4, ds('stone_table'));
  set(objects, 4, 4, chart('keeper_ledger'));

  return {
    title: 'The Chart Room' + (state === 'open' ? ' (bolt drawn)' : state === 'opened' ? ' (door open)' : ''),
    ground, objects, overhead,
    sprites: [{ sheet: 'chart_chair', frame: 'keeper_stone_chair', x: 2 * 16 + 8, y: 5 * 16 }],
    hero: [8 * 16, 12 * 16 + 14, 'up'],
    scale: 3,
  };
}
