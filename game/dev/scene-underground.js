// An underground pump chamber opening onto a ribbed corridor, composed from the
// Founders' sheets (underground.js, machines.js). Format as in art-scene.js.

const W = 20, H = 14;
const blank = () => Array.from({ length: H }, () => Array(W).fill(null));
const ground = blank(), objects = blank(), overhead = blank();
const set = (layer, x, y, ref) => { if (x >= 0 && x < W && y >= 0 && y < H) layer[y][x] = ref; };
const hull = f => `hull:${f}`, water = f => `hull_water:${f}`, wrong = f => `hull_wrong:${f}`, mach = f => `machines:${f}`;

// The hull's dark mass everywhere, then carve the rooms out of it.
for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) set(ground, x, y, hull('top'));

// ---- The pump chamber: x 1–11, north face on rows 2–3, floor rows 4–8, channel rows 9–11. ----
const faceTop = ['face_top', 'ladder_top', 'face_top', 'face_top_b', 'lamp_cyan', 'face_top', 'face_top_b', 'face_top_line', 'lightpipe', 'face_top', 'face_top_b'];
const faceBase = ['face_base', 'ladder_bot', 'face_base', 'face_base_b', 'face_base', 'face_base', 'face_base_b', 'face_base', 'face_base', 'face_base', 'face_base_b'];
faceTop.forEach((f, i) => { set(ground, 1 + i, 2, hull(f)); set(ground, 1 + i, 3, hull(faceBase[i])); });
set(ground, 10, 2, wrong('face_wrong'));                       // the Wrongness, seeping out of a seam
for (let y = 4; y <= 8; y++) for (let x = 1; x <= 11; x++) set(ground, x, y, hull('floor'));
[[4, 6, 'floor_worn'], [5, 6, 'floor_worn'], [6, 7, 'floor_glyph'], [2, 8, 'floor_broken'], [8, 8, 'floor_wet'],
 [9, 4, 'floor_glow'], [5, 4, 'floor_glow'], [3, 7, 'floor_hatch'], [11, 7, 'floor_worn']].forEach(([x, y, f]) => set(ground, x, y, hull(f)));
set(ground, 10, 4, wrong('floor_wrong'));
set(ground, 10, 5, hull('floor_displaced'));
// the channel, with a grate
for (let x = 1; x <= 11; x++) { set(ground, x, 9, water('chan_n')); set(ground, x, 10, water('chan')); set(ground, x, 11, water('chan_s')); }
set(ground, 1, 10, water('chan_end_w')); set(ground, 11, 10, water('chan_end_e'));
set(ground, 6, 10, water('chan_grate'));
// walls round the chamber
for (let y = 2; y <= 11; y++) set(ground, 0, y, hull('top_edge_e'));
for (let x = 1; x <= 11; x++) set(ground, x, 12, hull('top_edge_n'));
set(ground, 0, 12, hull('top'));
for (let y = 9; y <= 12; y++) set(ground, 12, y, hull('top_edge_w'));
set(ground, 12, 4, hull('top_chamfer_ne')); set(ground, 12, 5, hull('top_edge_w'));

// ---- The corridor: x 12–19, north face rows 4–5, floor rows 6–8, ribs at x 15 and 18. ----
const cTop = ['face_top_end_l', 'face_top', 'face_rib_top', 'moonlock_nw', 'moonlock_ne', 'face_rib_top', 'lamp_amber'];
const cBase = ['face_base_end_l', 'face_base_b', 'face_rib_base', 'moonlock_sw', 'moonlock_se', 'face_rib_base', 'face_base'];
cTop.forEach((f, i) => { set(ground, 13 + i, 4, hull(f)); set(ground, 13 + i, 5, hull(cBase[i])); });
for (let y = 6; y <= 8; y++) for (let x = 12; x <= 19; x++) set(ground, x, y, hull('floor'));
set(ground, 16, 7, hull('floor_worn')); set(ground, 17, 7, hull('floor_worn')); set(ground, 19, 7, hull('floor_glyph')); set(ground, 19, 6, hull('floor_glow_amber'));
for (let x = 12; x <= 19; x++) set(ground, x, 9, hull('top_edge_n'));
for (const x of [15, 18]) for (let y = 6; y <= 8; y++) set(overhead, x, y, hull('over_rib_v'));
set(objects, 14, 7, mach('pipe_h')); set(objects, 13, 7, mach('pipe_h')); set(objects, 12, 7, mach('pipe_t'));

// ---- Machines in the chamber. ----
[['pump_nw', 6, 2], ['pump_ne', 7, 2], ['pump_w', 6, 3], ['pump_e', 7, 3], ['pump_sw', 6, 4], ['pump_se', 7, 4]]
  .forEach(([f, x, y]) => set(objects, x, y, mach(f)));
set(objects, 3, 2, mach('valve_big_nw_0')); set(objects, 4, 2, mach('valve_big_ne_0'));
set(objects, 3, 3, mach('valve_big_sw_0')); set(objects, 4, 3, mach('valve_big_se_0'));
set(objects, 5, 3, mach('gauge'));
set(objects, 9, 3, mach('speaking_tube'));
set(objects, 8, 5, mach('pipe_t')); set(objects, 9, 5, mach('pipe_h')); set(objects, 10, 5, mach('pipe_h')); set(objects, 11, 5, mach('pipe_h'));
set(objects, 8, 6, mach('pipe_v')); set(objects, 8, 7, mach('pipe_v')); set(objects, 8, 8, mach('pipe_v'));
set(objects, 4, 5, mach('cell_hatch'));
set(objects, 1, 3, mach('gears_l')); set(objects, 2, 3, null);

export const SCENE = {
  title: 'Underground: a pump chamber and a ribbed corridor',
  ground, objects, overhead,
  sprites: [],
  hero: [4 * 16 + 8, 8 * 16 + 16, 'right'],
  patrol: [[4 * 16 + 8, 8 * 16 + 16], [17 * 16 + 8, 8 * 16 + 16]],
  scale: 3,
};
