// A hand-composed isometric Cheryl's flat (12 × 9) for the art dev page, the
// art task's reference for how the interior pieces fit. Same drawable format
// as iso-court.js. North and west walls show their inner faces; the south and
// east walls are cut away to low stubs.

export const W = 12, H = 9;

export function flat(state = {}) {
  const out = [];
  const add = (s, f, x, y, z = 0, fw = 1, fd = 1, layer = 1) => out.push({ s, f, x: x + fw / 2, y: y + fd / 2, z, fw, fd, x0: x, y0: y, layer });
  const F = 'flat';
  // Floor.
  for (let y = 2; y <= 7; y++) for (let x = 1; x <= 10; x++) add(F, x === 5 && y === 7 ? 'floor_worn' : `floor_${(x * 7 + y * 3) % 5 === 0 ? 1 : 0}`, x, y, 0, 1, 1, 0);
  add(F, 'floor_0', 5, 8, 0, 1, 1, 0);
  // North wall (row 1's south faces), with the shelf, clock, and window; west wall (column 0's east faces).
  const north = { 1: 'room_s_shelf_l', 2: 'room_s_shelf_r', 4: 'room_s_clock', 5: 'room_s_window_l', 6: 'room_s_window_r' };
  for (let x = 0; x <= 11; x++) add(F, north[x] || 'room_s_plain', x, 1, 0, 1, 1, 0.1);
  for (let y = 2; y <= 7; y++) add(F, 'room_e_plain', 0, y, 0, 1, 1, 0.1);
  for (let x = 0; x <= 11; x++) add(F, 'wall_cap', x, 1, 96, 1, 1, 0.2);
  for (let y = 2; y <= 8; y++) add(F, 'wall_cap', 0, y, 96, 1, 1, 0.2);
  // Near walls cut away.
  for (let x = 0; x <= 11; x++) add(F, x === 5 ? 'cut_door' : x === 6 ? 'cut_hook' : 'cut_x', x, 8, 0);
  for (let y = 2; y <= 7; y++) add(F, 'cut_y', 11, y, 0);
  // Furniture.
  add(F, 'bookshelf_l', 9, 1); add(F, 'bookshelf_r', 10, 1);
  add(F, state.gotMill ? 'counter_l' : 'counter_l_mill', 1, 2);
  add(F, state.gotTimer ? 'counter_r' : 'counter_r_timer', 2, 2);
  add(F, 'stove', 3, 2);
  add(F, 'bed', 9, 2, 0, 2, 2);
  add(F, 'side_table', 8, 3);
  add(F, 'chair_e', 3, 4); add(F, 'chair_w', 6, 4);
  add(F, state.morning ? 'table' : 'table_chart', 4, 4, 0, 2, 1);
  add(F, 'rug', 4, 5, 0, 3, 2, 0.05);
  add(F, 'wardrobe', 10, 5, 0, 1, 2);
  add(F, state.gotSoap ? 'washstand_bare' : 'washstand', 1, 6);
  if (state.people !== false) add('cheryl', state.morning ? 'down_0' : 'up_0', state.morning ? 8 : 5, state.morning ? 4 : 7, 0, 1, 1, 2);
  return out;
}
