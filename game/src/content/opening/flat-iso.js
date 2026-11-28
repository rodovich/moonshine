// Cheryl's flat in the isometric view: the art task's composition
// (game/dev/iso-flat.js) driven by the same flags as compose() in flat.js.
// The north and west walls show their inner faces; the south and east
// walls are cut away to low stubs. Everything stands on the floor at 0.

const F = 'flat';

function scene(g) {
  const f = (n) => g.flag(n);
  const out = [];
  const add = (s, fr, x, y, z = 0, fw = 1, fd = 1, layer = 1) => out.push({ s, f: fr, x: x + fw / 2, y: y + fd / 2, z, fw, fd, layer });
  // Floor.
  for (let y = 2; y <= 7; y++) {
    for (let x = 1; x <= 10; x++) add(F, x === 5 && y === 7 ? 'floor_worn' : `floor_${(x * 7 + y * 3) % 5 === 0 ? 1 : 0}`, x, y, 0, 1, 1, 0);
  }
  add(F, 'floor_0', 5, 8, 0, 1, 1, 0);
  // North wall (row 1's south faces) with the shelf, clock, and window; west wall (column 0's east faces).
  const north = { 1: 'room_s_shelf_l', 2: 'room_s_shelf_r', 4: 'room_s_clock', 5: 'room_s_window_l', 6: 'room_s_window_r' };
  add(F, 'room_corner', 0, 1, 0, 1, 1, 0.1);
  for (let x = 1; x <= 10; x++) add(F, north[x] || 'room_s_plain', x, 1, 0, 1, 1, 0.1);
  for (let y = 2; y <= 7; y++) add(F, 'room_e_plain', 0, y, 0, 1, 1, 0.1);
  // The walls' section caps (the frames carry their own height).
  for (let x = 1; x <= 10; x++) add(F, 'wall_cap_s', x, 1, 0, 1, 1, 0.2);
  add(F, 'wall_cap_corner', 0, 1, 0, 1, 1, 0.2);
  for (let y = 2; y <= 7; y++) add(F, 'wall_cap_e', 0, y, 0, 1, 1, 0.2);
  // The near walls, cut away: the door at (5, 8), the plug hook beside it.
  for (let x = 1; x <= 10; x++) add(F, x === 5 ? 'cut_door' : x === 6 ? 'cut_hook' : 'cut_x', x, 8, 0);
  for (let y = 1; y <= 7; y++) add(F, 'cut_y', 11, y, 0);
  // Furniture.
  add(F, 'bookshelf_l', 9, 1);
  add(F, 'bookshelf_r', 10, 1);
  add(F, f('got.pepper_mill') ? 'counter_l' : 'counter_l_mill', 1, 2);
  add(F, f('got.egg_timer') ? 'counter_r' : 'counter_r_timer', 2, 2);
  add(F, 'stove', 3, 2);
  add(F, 'bed', 9, 2, 0, 2, 2);
  add(F, 'side_table', 8, 3);
  add(F, 'chair_e', 3, 4);
  add(F, 'chair_w', 6, 4);
  add(F, f('got.moon_chart') ? 'table' : 'table_chart', 4, 4, 0, 2, 1);
  add(F, 'rug', 4, 5, 0, 3, 2, 0.05);
  add(F, 'wardrobe', 10, 5, 0, 1, 2);
  add(F, f('got.soap') ? 'washstand_bare' : 'washstand', 1, 6);
  return out;
}

// The flags this scene follows (see court-iso.js).
const follows = ['got.pepper_mill', 'got.egg_timer', 'got.moon_chart', 'got.soap'];

export const flatIso = { scene, floor: () => 0, follows };
