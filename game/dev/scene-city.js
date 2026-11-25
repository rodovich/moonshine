// A piece of the wider city for Act 2 (24 x 18), composed to judge the city kit and landmarks
// together: the Bell Tower's foot, varied houses, the Blue Dome, the Fountain of the Fish, a
// sundial, terraces with outer and inner corners, a canal end, and a stretch of the Hundred Steps.

const W = 24, H = 18;
const blank = () => Array.from({ length: H }, () => Array(W).fill(null));
const ground = blank(), objects = blank(), overhead = blank();
const set = (layer, x, y, ref) => { if (x >= 0 && x < W && y >= 0 && y < H) layer[y][x] = ref; };

// Paving everywhere first; every third 2x2 block uses the second slab layout.
for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
  const bx = x >> 1, by = y >> 1, alt = ((bx * 7 + by * 13) % 3) === 0 ? 'pave2' : 'pave';
  set(ground, x, y, `street:${alt}_${y % 2 ? 's' : 'n'}${x % 2 ? 'e' : 'w'}`);
}

// ---- The Bell Tower (cols 0-5, rows 0-6) ----
for (let y = 0; y < 7; y++) for (let x = 0; x < 6; x++) set(ground, x, y, `landmarks:bell_tower_x${x}y${y}`.replace('landmarks:', 'bell_tower:'));

// ---- Houses between the tower and the Dome (cols 6-15, rows 0-3) ----
const B = (f, p) => `buildings:${f}${p ? '@' + p : ''}`;
const FA = (f, p) => `facades:${f}${p ? '@' + p : ''}`;
// an ochre house with an outside stair up to its roof
[[B('roof_l', 'ochre'), B('roof', 'ochre'), B('roof_r', 'ochre')],
 [B('roof_front_l', 'ochre'), B('roof_front', 'ochre'), B('roof_front_r', 'ochre')],
 [FA('ostair_tl', 'ochre'), FA('ostair_tm', 'ochre'), FA('ostair_tr', 'ochre')],
 [FA('ostair_bl', 'ochre'), FA('ostair_bm', 'ochre'), FA('ostair_br', 'ochre')]]
  .forEach((row, y) => row.forEach((r, i) => set(ground, 6 + i, y, r)));
// a rose house with a pitched roof seen end-on, and a shopfront
[[B('roof'), B('roof'), B('roof')],
 [B('wall_l', 'rose'), B('wall', 'rose'), B('wall_r', 'rose')],
 [B('window_box', 'rose'), B('wall', 'rose'), B('window', 'rose')],
 [FA('shopfront_l', 'rose'), FA('shopfront_r', 'rose'), B('wall_base_r', 'rose')]]
  .forEach((row, y) => row.forEach((r, i) => set(ground, 9 + i, y, r)));
['tl', 'tm', 'tr'].forEach((p, i) => set(objects, 9 + i, 0, `gables:gable_${p}@rose`));
['bl', 'bm', 'br'].forEach((p, i) => set(objects, 9 + i, 1, `gables:gable_${p}@rose`));
// a pale blue house with an arcade on the ground floor and a little cupola
[[B('roof_l', 'sky'), FA('dome_small', 'sky'), B('roof', 'sky'), B('roof_r', 'sky')],
 [B('roof_front_l', 'sky'), B('roof_front', 'sky'), B('roof_front', 'sky'), B('roof_front_r', 'sky')],
 [B('wall_l', 'sky'), B('balcony', 'sky'), B('window', 'sky'), B('wall_r', 'sky')],
 [FA('arcade_l', 'sky'), FA('arcade_m', 'sky'), FA('arcade_m', 'sky'), FA('arcade_r', 'sky')]]
  .forEach((row, y) => row.forEach((r, i) => set(ground, 12 + i, y, r)));

// ---- The Blue Dome (cols 16-23): dome and drum rows 0-2, its front rows 3-5 ----
for (let y = 0; y < 3; y++) for (let x = 0; x < 8; x++) set(ground, 16 + x, y, `blue_dome:blue_dome_x${x}y${y}`);
const domeFront = [
  ['wall_l', 'window', 'wall', 'window', 'window', 'wall', 'window', 'wall_r'],
  ['wall_l', 'wall', 'window', null, null, 'window', 'wall', 'wall_r'],
  ['wall_base_l', 'wall_base', 'window_base', null, null, 'window_base', 'wall_base', 'wall_base_r'],
];
domeFront.forEach((row, y) => row.forEach((f, i) => { if (f) set(ground, 16 + i, 3 + y, B(f)); }));
set(ground, 19, 4, 'blue_dome:dome_door_x0y0'); set(ground, 20, 4, 'blue_dome:dome_door_x1y0');
set(ground, 19, 5, 'blue_dome:dome_door_x0y1'); set(ground, 20, 5, 'blue_dome:dome_door_x1y1');

// ---- The Fountain of the Fish (cols 10-13, rows 6-9) and the sundial ----
for (let y = 0; y < 4; y++) for (let x = 0; x < 4; x++) set(objects, 10 + x, 6 + y, `fountain:fountain_x${x}y${y}`);
for (let y = 0; y < 2; y++) for (let x = 0; x < 2; x++) set(objects, 3 + x, 8 + y, `sundial:sundial_x${x}y${y}`);

// ---- Terraces: the plaza is the upper level. On the right it ends at row 10 (wall rows 11-12);
// on the left it reaches down to row 12 (wall rows 13-14), making an inner and an outer corner at x=11.
for (let x = 12; x < 24; x++) { set(ground, x, 11, 'street:retain_top'); set(ground, x, 12, 'street:retain_base'); }
set(ground, 11, 11, 'terrace:retain_top_inner_l'); set(ground, 11, 12, 'terrace:retain_base_inner_l');
for (let x = 0; x < 11; x++) { set(ground, x, 13, 'street:retain_top'); set(ground, x, 14, 'street:retain_base'); }
set(ground, 11, 13, 'terrace:retain_top_end_r'); set(ground, 11, 14, 'terrace:retain_base_end_r');
set(ground, 1, 13, 'street:stairs_l'); set(ground, 2, 13, 'street:stairs_r');
set(ground, 1, 14, 'street:stairs_l'); set(ground, 2, 14, 'street:stairs_r');
// a stretch of the Hundred Steps going down through the lower wall (cols 20-21)
['steps', 'steps_moon', 'steps', 'hollow_open', 'steps', 'landing', 'steps'].forEach((n, i) => {
  set(ground, 20, 11 + i, `steps:${n}_l`); set(ground, 21, 11 + i, `steps:${n}_r`);
});
// lower ground on the right continues as paving; a canal end on the left (cols 4-10, rows 15-17)
for (let x = 5; x < 10; x++) { set(ground, x, 15, 'canal:bank_n'); set(ground, x, 16, 'canal:water'); set(ground, x, 17, 'canal:bank_s'); }
set(ground, 4, 15, 'canal_edges:bank_n_end_w'); set(ground, 4, 16, 'canal_edges:bank_w'); set(ground, 4, 17, 'canal_edges:bank_s_end_w');
set(ground, 10, 15, 'canal_edges:bank_n_end_e'); set(ground, 10, 16, 'canal_edges:bank_e'); set(ground, 10, 17, 'canal_edges:bank_s_end_e');

// ---- Props ----
set(objects, 7, 5, 'props:lamp_post'); set(overhead, 7, 4, 'props:over_lamp_top');
set(objects, 15, 5, 'props:lamp_post'); set(overhead, 15, 4, 'props:over_lamp_top');
set(objects, 6, 9, 'props:bench_l'); set(objects, 7, 9, 'props:bench_r');
set(objects, 16, 9, 'props:pot_geranium'); set(objects, 0, 7, 'props:pot_geranium'); set(objects, 9, 4, 'props:pot_bay');
set(objects, 14, 16, 'canal:mooring_post'); set(objects, 6, 15, 'canal:mooring_post');

export const SCENE = {
  title: 'City kit and landmarks',
  ground, objects, overhead,
  sprites: [
    { sheet: 'fish', frame: 'fish', x: 12 * 16, y: 6 * 16 + 35 },
    { sheet: 'props', frame: 'cat', x: 17 * 16 + 8, y: 10 * 16 + 14 },
  ],
  hero: [8 * 16 + 8, 7 * 16 + 14, 'down'],
  patrol: [[6 * 16, 7 * 16 + 14], [9 * 16, 11 * 16 + 14]],
  scale: 2,
};
