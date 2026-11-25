// Act 3: the Chart Room. An eight-sided room under the Blue Dome: the floor inlay of Tessel as a ship,
// the pool of light from the Eye above with the teapot's shadow in it, the last Keeper's chair, desk,
// cup and ledger, and the inside of the Founders' Door. ?state=open draws the bolt back.

export function SCENE(state) {
  const W = 16, H = 13;
  const blank = () => Array.from({ length: H }, () => Array(W).fill(null));
  const ground = blank(), objects = blank(), overhead = blank();
  const set = (layer, x, y, ref) => { if (x >= 0 && x < W && y >= 0 && y < H) layer[y][x] = ref; };
  const hull = f => `hull:${f}`, chart = f => `chart:${f}`, ds = f => `ds:${f}`;

  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) set(ground, x, y, hull('top'));
  // north wall face, x 3–12, rows 1–2, with the Founders' Door at x 7–8
  for (let x = 3; x <= 12; x++) { set(ground, x, 1, hull(x % 2 ? 'face_top' : 'face_top_b')); set(ground, x, 2, hull(x % 2 ? 'face_base' : 'face_base_b')); }
  set(ground, 4, 1, ds('niche_lit')); set(ground, 11, 1, ds('niche_lit'));
  set(ground, 5, 1, ds('inlay_sisters_l')); set(ground, 6, 1, ds('inlay_sisters_r'));
  set(ground, 9, 1, ds('inlay_roster_l')); set(ground, 10, 1, ds('inlay_roster_r'));
  const door = state === 'open' ? 'fdoor_in_open' : 'fdoor_in';
  set(ground, 7, 1, chart(`${door}_x0y0`)); set(ground, 8, 1, chart(`${door}_x1y0`));
  set(ground, 7, 2, chart(`${door}_x0y1`)); set(ground, 8, 2, chart(`${door}_x1y1`));
  // the floor: rows 3–11, x 1–14, its corners cut at 45 degrees to make eight sides
  for (let y = 3; y <= 11; y++) for (let x = 1; x <= 14; x++) set(ground, x, y, hull('floor'));
  const cut = [[1, 3, 'top'], [2, 3, 'top_chamfer_nw'], [1, 4, 'top_chamfer_nw'], [14, 3, 'top'], [13, 3, 'top_chamfer_ne'], [14, 4, 'top_chamfer_ne'],
    [1, 11, 'top'], [2, 11, 'top_chamfer_sw'], [1, 10, 'top_chamfer_sw'], [14, 11, 'top'], [13, 11, 'top_chamfer_se'], [14, 10, 'top_chamfer_se']];
  cut.forEach(([x, y, f]) => set(ground, x, y, hull(f)));
  set(ground, 2, 3, hull('top_chamfer_nw')); set(ground, 13, 3, hull('top_chamfer_ne'));
  for (let y = 4; y <= 10; y++) { set(ground, 0, y, hull('top_edge_e')); set(ground, 15, y, hull('top_edge_w')); }
  for (let x = 3; x <= 12; x++) set(ground, x, 12, hull('top_edge_n'));
  set(ground, 1, 3, hull('top')); set(ground, 14, 3, hull('top'));
  // the inlay, 10 x 6 tiles, at x 3–12, rows 4–9, and the light from the Eye over it
  for (let ty = 0; ty < 6; ty++) for (let tx = 0; tx < 10; tx++) {
    set(ground, 3 + tx, 4 + ty, chart(`inlay_x${tx}y${ty}`));
    set(objects, 3 + tx, 4 + ty, chart(`pool_x${tx}y${ty}`));
  }
  // the last Keeper's desk, with the ledger and the cup
  set(objects, 3, 10, chart('stone_desk_l')); set(objects, 4, 10, chart('stone_desk_r'));

  return {
    title: 'The Chart Room' + (state === 'open' ? ' (bolt drawn)' : ''),
    ground, objects, overhead,
    sprites: [{ sheet: 'chart_chair', frame: 'keeper_stone_chair', x: 4 * 16, y: 10 * 16 + 2 }],
    hero: [8 * 16, 11 * 16 + 14, 'up'],
    scale: 3,
  };
}
