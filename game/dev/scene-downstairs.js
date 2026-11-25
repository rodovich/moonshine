// Act 3, Downstairs: a Keepers' hall under the hundredth step and the flooded passage below it,
// composed from downstairs.js with underground.js and machines.js. Format as in art-scene.js.

const W = 20, H = 14;
const blank = () => Array.from({ length: H }, () => Array(W).fill(null));
const ground = blank(), objects = blank(), overhead = blank();
const set = (layer, x, y, ref) => { if (x >= 0 && x < W && y >= 0 && y < H) layer[y][x] = ref; };
const hull = f => `hull:${f}`, ds = f => `ds:${f}`, day = f => `ds_day:${f}`, dw = f => `ds_water:${f}`, mach = f => `machines:${f}`;

for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) set(ground, x, y, hull('top'));

// ---- The hall: north face rows 1–2, floor rows 3–7, x 1–18. ----
const fTop = ['face_top', 'face_top_b', 'niche', 'tool_rack', 'inlay_roster_l', 'inlay_roster_r', 'horn', 'face_rib_top',
  'face_top', 'lever', 'inlay_moon_l', 'inlay_moon_r', 'niche_lit', 'inlay_sisters_l', 'inlay_sisters_r', 'face_top_b', 'face_top', 'face_top_line'];
fTop.forEach((f, i) => {
  const x = 1 + i;
  const top = { niche: ds('niche_dead'), tool_rack: ds('tool_rack'), horn: ds('horn'), niche_lit: ds('niche_lit'),
    lever: hull('face_top') }[f] || (f.startsWith('inlay') ? ds(f) : hull(f));
  set(ground, x, 1, top);
  set(ground, x, 2, f === 'lever' ? ds('lever_ready') : f === 'face_rib_top' ? hull('face_rib_base') : hull(i % 2 ? 'face_base_b' : 'face_base'));
});
set(ground, 1, 1, day('day_ladder_top')); set(ground, 1, 2, day('day_ladder_bot'));   // up into the daylight under the step
for (let y = 3; y <= 7; y++) for (let x = 1; x <= 18; x++) set(ground, x, y, hull('floor'));
set(ground, 1, 3, day('day_spot'));
[[3, 5, 'floor_worn'], [4, 5, 'floor_worn'], [10, 4, 'floor_glyph'], [7, 7, 'floor_broken'], [16, 5, 'floor_glow'], [13, 3, 'floor_glow']]
  .forEach(([x, y, f]) => set(ground, x, y, hull(f)));
set(ground, 12, 6, day('day_spot'));
set(ground, 10, 7, ds('moonhatch_lit'));
for (let y = 1; y <= 7; y++) { set(ground, 0, y, hull('top_edge_e')); set(ground, 19, y, hull('top_edge_w')); }
for (let x = 1; x <= 18; x++) set(ground, x, 8, hull('top_edge_n'));
// a rib across the hall
for (let y = 3; y <= 7; y++) set(overhead, 8, y, hull('over_rib_v'));
// the light shaft: lid open in the ceiling, a column of daylight onto the mirror, a beam off to the east
set(overhead, 12, 3, day('over_shaft_open'));
set(overhead, 12, 4, day('over_column')); set(overhead, 12, 5, day('over_column'));
for (let x = 13; x <= 17; x++) set(overhead, x, 6, day('over_beam_h'));
set(overhead, 18, 6, day('over_beam_end_e'));
// the bunk room end: bunks, a cup
set(objects, 3, 4, ds('bunk_l')); set(objects, 4, 4, ds('bunk_r'));
set(objects, 3, 6, ds('bunk_l')); set(objects, 4, 6, ds('bunk_r'));
set(objects, 6, 4, ds('cup'));
set(objects, 14, 3, ds('cradle_glow'));

// ---- The lower passage: north face rows 9–10, floor rows 11–13. ----
const lTop = ['face_top', 'lightpipe', 'face_top_b', 'face_top', 'face_top', 'face_top', 'cw_ladder_up_top', 'face_top_b',
  'face_top', 'face_top', 'face_top', 'face_top', 'face_top_b', 'face_top', 'face_top', 'face_top', 'face_top', 'face_top'];
lTop.forEach((f, i) => {
  const x = 1 + i;
  set(ground, x, 9, f.startsWith('cw_') ? ds(f) : hull(f));
  set(ground, x, 10, f.startsWith('cw_') ? ds('cw_ladder_up_bot') : hull(i % 2 ? 'face_base_b' : 'face_base'));
});
set(ground, 5, 10, ds('chute'));
for (let y = 9; y <= 13; y++) { set(ground, 0, y, hull('top_edge_e')); set(ground, 19, y, hull('top_edge_w')); }
// black still water where the passage slopes down to the west and north
for (let x = 1; x <= 4; x++) { set(ground, x, 11, dw('black')); set(ground, x, 12, dw('black_edge')); set(ground, x, 13, dw('slope_steps')); }
// drained and soaked plates between
for (let y = 11; y <= 13; y++) for (let x = 5; x <= 9; x++) set(ground, x, y, hull('floor'));
[[6, 11, 'floor_drained'], [8, 12, 'floor_soaked'], [9, 11, 'floor_soaked']].forEach(([x, y, f]) => set(ground, x, y, dw(f)));
// the flooded passage, fed by a gushing pipe, with the big valve beside it
for (let x = 10; x <= 18; x++) { set(ground, x, 11, dw('flood_edge_n')); set(ground, x, 12, dw('flood')); set(ground, x, 13, dw('flood')); }
set(ground, 12, 11, dw('flood_splash'));
set(objects, 12, 10, dw('gush'));
set(objects, 13, 9, mach('valve_big_nw')); set(objects, 14, 9, mach('valve_big_ne'));
set(objects, 13, 10, mach('valve_big_sw')); set(objects, 14, 10, mach('valve_big_se'));
set(objects, 11, 10, mach('pipe_wall'));

export const SCENE = {
  title: 'Downstairs: the Keepers\' hall under the hundredth step, and the flooded passage',
  ground, objects, overhead,
  sprites: [
    { sheet: 'ds_mirror', frame: 'mirror_e', x: 12 * 16 + 8, y: 6 * 16 + 15 },
    { sheet: 'ds_rod', frame: 'rod', x: 16 * 16 + 8, y: 5 * 16 + 10 },
    { sheet: 'ds_rod', frame: 'rod', x: 13 * 16 + 8, y: 3 * 16 + 10, phase: 300 },
  ],
  hero: [6 * 16 + 8, 7 * 16 + 14, 'right'],
  patrol: [[2 * 16 + 8, 7 * 16 + 14], [10 * 16 + 8, 7 * 16 + 14]],
  scale: 3,
};
