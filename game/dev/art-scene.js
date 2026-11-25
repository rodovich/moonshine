// A small street composed from the art sheets, for judging how the tiles work together.
// Each layer is 14 rows of 16 cells; a cell is 'sheet:frame' (or 'sheet:frame@palette'),
// several refs joined with '+' draw in order, and null is empty. An animation's base
// name (for example 'canal:water') plays the animation.
//
// Layers: ground (opaque), detail (transparent pieces on the ground, under characters),
// overhead (drawn over characters).

const W = 16, H = 14;
const blank = () => Array.from({ length: H }, () => Array(W).fill(null));
const ground = blank(), detail = blank(), overhead = blank();

// Two slab layouts, each a 2x2 block of tiles; a hash of the block position picks one.
const quad = (x, y) => `${y % 2 ? 's' : 'n'}${x % 2 ? 'e' : 'w'}`;
const blockHash = (x, y) => (((x >> 1) * 73856093) ^ ((y >> 1) * 19349663)) >>> 0;
const pave = (x, y) => `street:${blockHash(x, y) % 3 === 0 ? 'pave2' : 'pave'}_${quad(x, y)}`;
const water = (x, y) => `canal:water_${quad(x, y)}`;
for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) ground[y][x] = pave(x, y);

// A building: columns of frame names from the top row down to the base.
function building(x0, y0, cols, alt) {
  cols.forEach((col, i) => col.forEach((f, j) => {
    if (!f) return;
    const ref = f.includes(':') ? f : `buildings:${f}` + (alt ? `@${alt}` : '');
    ground[y0 + j][x0 + i] = ref;
  }));
}

// West: a whitewashed house with a blue dome; its front sits back at row 3.
building(0, 0, [
  ['roof', 'roof', 'roof_front', 'window_box', 'wall_base'],
  ['dome_nw', 'dome_sw', 'roof_front', 'door_top', 'door_bot'],
  ['dome_ne', 'dome_se', 'roof_front', 'window', 'window_base'],
  ['roof_r', 'roof_r', 'roof_front_r', 'window_closed', 'wall_base_r'],
]);
// Middle: an ochre shop that juts forward into the street.
building(4, 0, [
  ['rooftiles:ridge_l', 'rooftiles:tiles_l', 'wall_l', 'window_box', 'wall_l', 'wall_base_l'],
  ['rooftiles:ridge', 'rooftiles:tiles_moss', 'wall', 'balcony', 'window', 'window_base'],
  ['rooftiles:ridge', 'rooftiles:tiles', 'wall', 'window_closed', 'door_top', 'door_bot'],
  ['rooftiles:ridge_r', 'rooftiles:tiles_r', 'wall_r', 'window_box', 'window', 'window_base'],
], 'ochre');
overhead[2][4] = 'rooftiles:over_eave_l'; overhead[2][5] = 'rooftiles:over_eave';
overhead[2][6] = 'rooftiles:over_eave'; overhead[2][7] = 'rooftiles:over_eave_r';
// East: a pale blue house set further back, with an arched passage through it.
building(8, 0, [
  ['roof_front_l', 'wall_l', 'wall_base_l'],
  ['roof_front', 'window_box', 'wall_base'],
  ['roof_front', 'over_arch_l'],
  ['roof_front', 'over_arch_r'],
  ['roof_front', 'balcony', 'wall_base'],
  ['roof_front', 'window', 'window_base'],
  ['roof_front', 'window_closed', 'wall_base'],
  ['roof_front_r', 'wall_r', 'wall_base_r'],
], 'sky');
ground[1][10] = 'street:pave_sw_shade'; ground[1][11] = 'street:pave_se_shade';
ground[2][10] = 'street:pave_nw_shade'; ground[2][11] = 'street:pave_ne_shade';
overhead[0][10] = 'buildings:roof_front@sky'; overhead[0][11] = 'buildings:roof_front@sky';
overhead[1][10] = 'buildings:over_arch_l@sky'; overhead[1][11] = 'buildings:over_arch_r@sky';
detail[2][10] = 'buildings:arch_jamb_l@sky'; detail[2][11] = 'buildings:arch_jamb_r@sky';

// Shop awning over the ochre shop's ground floor, and its sign.
overhead[4][5] = 'cloth:over_awning_l'; overhead[4][6] = 'cloth:over_awning_m'; overhead[4][7] = 'cloth:over_awning_r';
ground[4][5] = 'buildings:window_box@ochre';
detail[4][4] = 'props:sign_bakery';
// Laundry strung across the gap between the shop and the blue house.
overhead[3][8] = 'cloth:over_laundry_l'; overhead[3][9] = 'cloth:over_laundry_m'; overhead[3][10] = 'cloth:over_laundry_r';

// Terrace wall, with stairs down to the quay and bougainvillea spilling over it.
for (let x = 0; x < W; x++) { ground[7][x] = 'street:retain_top'; ground[8][x] = 'street:retain_base'; }
ground[7][2] = 'street:stairs_l'; ground[7][3] = 'street:stairs_r';
ground[8][2] = 'street:stairs_l'; ground[8][3] = 'street:stairs_r';
overhead[7][12] = 'cloth:over_vine_l'; overhead[7][13] = 'cloth:over_vine_r';
overhead[7][6] = 'cloth:over_vine_r';
ground[5][11] = 'street:pave_se_crack';
// Something Wrong, seeping up through the paving.
ground[5][13] = 'street:pave_wrong';
ground[0][0] = 'buildings:roof_chimney';
ground[9][14] = 'street:pave_nw_drain';

// The canal along the bottom, with a stepped bridge.
for (let x = 0; x < W; x++) {
  ground[10][x] = 'canal:bank_n';
  ground[11][x] = water(x, 11);
  ground[12][x] = water(x, 12);
  ground[13][x] = 'canal:bank_s';
}
const bx = 7;
['n', 'down', 'up', 's'].forEach((p, i) => {
  ground[10 + i][bx] = `canal:bridge_${p}_l`;
  ground[10 + i][bx + 1] = `canal:bridge_${p}_r`;
});
ground[11][bx + 2] = 'canal:water_shadow';
ground[12][bx + 2] = 'canal:water_shadow';

// Props.
detail[9][5] = 'canal:mooring_post';
detail[9][12] = 'canal:mooring_post';
detail[5][14] = 'props:lamp_post'; overhead[4][14] = 'props:over_lamp_top';
detail[9][10] = 'props:bench_l'; detail[9][11] = 'props:bench_r';
detail[4][0] = 'props:pot_geranium';
detail[4][3] = 'props:pot_bay';
detail[6][3] = 'props:crate';
detail[6][7] = 'props:sign_board';
detail[3][12] = 'props:pot_geranium';
detail[6][1] = 'props:pot_geranium';

export const SCENE = {
  ground, detail, overhead,
  // Standing sprites, anchored at their feet (x center, y bottom).
  sprites: [
    { sheet: 'props', frame: 'cat', x: 8 * 16 + 8, y: 6 * 16 + 14 },
    { sheet: 'shopkeeper', frame: 'idle_down', x: 6 * 16 + 8, y: 6 * 16 + 6, phase: 300 },
    { sheet: 'old_man', frame: 'idle_left', x: 13 * 16 + 2, y: 9 * 16 + 13 },
    { sheet: 'kid', frame: 'idle_right', x: 1 * 16 + 4, y: 9 * 16 + 14, alt: 'coral', phase: 500 },
    { sheet: 'props', frame: 'cat_sleep', x: 15 * 16 + 8, y: 9 * 16 + 12 },
  ],
  hero: [184, 110],
  patrol: [[120, 106], [200, 106]],
};
