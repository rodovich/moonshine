// A small street composed from the art sheets, for judging how the tiles work together.
// Each layer is 14 rows of 16 cells; a cell is 'sheet:frame' (or 'sheet:frame@palette'),
// several refs joined with '+' draw in order, and null is empty. An animation's base
// name (for example 'canal:water') plays the animation.

const W = 16, H = 14;
const blank = () => Array.from({ length: H }, () => Array(W).fill(null));
const ground = blank(), detail = blank(), overhead = blank();

const pave = (x, y) => `street:pave_${y % 2 ? 's' : 'n'}${x % 2 ? 'e' : 'w'}`;
for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) ground[y][x] = pave(x, y);

// A building: columns of frame names from the roof down to the base.
function building(x0, y0, cols, alt) {
  cols.forEach((col, i) => col.forEach((f, j) => {
    if (f) ground[y0 + j][x0 + i] = (f.includes(':') ? f : `buildings:${f}`) + (alt && !f.includes(':') ? `@${alt}` : '');
  }));
}
building(0, 0, [
  ['roof_front', 'window_box', 'wall_base'],
  ['roof_front', 'door_top', 'door_bot'],
  ['roof_front_r', 'window', 'window_base'],
], null);
building(3, 0, [
  ['roof_front_l', 'wall_l', 'wall_base_l'],
  ['roof_front', 'window_closed', 'window_base'],
  ['roof_front', 'wall', 'wall_base'],
  ['roof_front_r', 'window_box', 'wall_base_r'],
], 'ochre');
building(7, 0, [
  ['roof_front_l', 'wall_l', 'wall_base_l'],
  ['roof_front', 'door_top', 'door_bot'],
  ['roof_front_r', 'window_box', 'window_base'],
], 'rose');
building(10, 0, [
  ['roof_front', 'over_arch_l'],
  ['roof_front', 'over_arch_r'],
  ['roof_front', 'window', 'window_base'],
  ['roof_front', 'balcony', 'wall_base'],
  ['roof_front', 'window_closed', 'wall_base'],
  ['roof_front_r', 'wall_r', 'wall_base_r'],
], 'sky');
// The archway: shaded paving underneath, the arch itself overhead, jambs as detail.
ground[1][10] = 'street:pave_sw_shade'; ground[1][11] = 'street:pave_se_shade';
ground[2][10] = 'street:pave_nw_shade'; ground[2][11] = 'street:pave_ne_shade';
overhead[1][10] = 'buildings:over_arch_l@sky'; overhead[1][11] = 'buildings:over_arch_r@sky';
overhead[0][10] = 'buildings:roof_front@sky'; overhead[0][11] = 'buildings:roof_front@sky';
detail[2][10] = 'buildings:arch_jamb_l@sky'; detail[2][11] = 'buildings:arch_jamb_r@sky';

// Terrace wall with stairs down to the quay.
for (let x = 0; x < W; x++) { ground[6][x] = 'street:retain_top'; ground[7][x] = 'street:retain_base'; }
ground[6][2] = 'street:stairs_l'; ground[6][3] = 'street:stairs_r';
ground[7][2] = 'street:stairs_l'; ground[7][3] = 'street:stairs_r';
ground[4][6] = 'street:pave_se_crack';
ground[9][13] = 'street:pave_nw_drain';

// The canal along the bottom, with a stepped bridge.
for (let x = 0; x < W; x++) {
  ground[10][x] = 'canal:bank_n';
  ground[11][x] = 'canal:water';
  ground[12][x] = 'canal:water';
  ground[13][x] = 'canal:bank_s';
}
const bx = 8;
['n', 'down', 'up', 's'].forEach((p, i) => {
  ground[10 + i][bx] = `canal:bridge_${p}_l`;
  ground[10 + i][bx + 1] = `canal:bridge_${p}_r`;
});
ground[11][bx + 2] = 'canal:water_shadow';
ground[12][bx + 2] = 'canal:water_shadow';
detail[9][5] = 'canal:mooring_post';
detail[9][13] = 'canal:mooring_post';

export const SCENE = {
  ground, detail, overhead,
  sprites: [],
  hero: [120, 140],
  patrol: [[40, 140], [200, 140]],
};
