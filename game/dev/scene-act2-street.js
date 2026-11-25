// A piece of Lamp Street and the Crown's edge, for judging the Act 2 objects in place
// (docs/design/02-city.md; index in docs/art-act2.md). Not a real map.
const W = 20, H = 14;
const blank = () => Array.from({ length: H }, () => Array(W).fill(null));
const ground = blank(), objects = blank(), overhead = blank();
const set = (L, x, y, ref) => { if (x >= 0 && x < W && y >= 0 && y < H) L[y][x] = ref; };
const pave = (x, y) => `street:pave_${y % 2 ? 's' : 'n'}${x % 2 ? 'e' : 'w'}`;
for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) set(ground, x, y, pave(x, y));

// The Little School (cols 1–6): flat roof with a bell-cote, the painted sign, double doors.
const b = f => `buildings:${f}`, s = f => `school:${f}`;
for (let x = 1; x <= 6; x++) { set(ground, x, 0, b(x === 1 ? 'roof_l' : x === 6 ? 'roof_r' : 'roof')); set(ground, x, 1, b(x === 1 ? 'roof_front_l' : x === 6 ? 'roof_front_r' : 'roof_front')); }
set(ground, 4, 1, s('school_bellcote'));
set(ground, 1, 2, b('wall_l')); set(ground, 6, 2, b('wall_r'));
'abcd'.split('').forEach((c, i) => set(ground, 2 + i, 2, s(`school_sign_${c}`)));
set(ground, 1, 3, b('window_closed')); set(ground, 2, 3, b('window'));
set(ground, 3, 3, s('school_door_tl')); set(ground, 4, 3, s('school_door_tr'));
set(ground, 5, 3, b('window')); set(ground, 6, 3, b('window_box'));
set(ground, 1, 4, b('wall_base_l')); set(ground, 2, 4, b('window_base'));
set(ground, 3, 4, s('school_door_bl')); set(ground, 4, 4, s('school_door_br'));
set(ground, 5, 4, b('window_base')); set(ground, 6, 4, b('wall_base_r'));

// The Clockmaker's (cols 11–14, ochre): fascia with a clock, a window full of clocks, a door, the hanging sign.
const o = f => `buildings:${f}@ochre`;
for (let x = 11; x <= 14; x++) { set(ground, x, 0, o(x === 11 ? 'roof_l' : x === 14 ? 'roof_r' : 'roof')); set(ground, x, 1, o(x === 11 ? 'roof_front_l' : x === 14 ? 'roof_front_r' : 'roof_front')); }
set(ground, 11, 2, o('wall_l')); set(ground, 12, 2, 'school:clockshop_fascia_l@ochre'); set(ground, 13, 2, 'school:clockshop_fascia_r@ochre'); set(ground, 14, 2, o('wall_r'));
set(ground, 11, 3, o('wall_l')); set(ground, 12, 3, o('wall')); set(ground, 13, 3, o('wall')); set(ground, 14, 3, o('door_top'));
set(ground, 11, 4, o('wall_base_l')); set(ground, 12, 4, 'school:clockshop_window_l@ochre'); set(ground, 13, 4, 'school:clockshop_window_r@ochre'); set(ground, 14, 4, o('door_bot'));
set(objects, 11, 3, 'act2_props:clock_sign');
// a pale blue house between them
const k = f => `buildings:${f}@sky`;
for (let x = 7; x <= 10; x++) { set(ground, x, 0, k('roof')); set(ground, x, 1, k('roof_front')); set(ground, x, 2, k(x === 8 ? 'balcony' : 'wall')); set(ground, x, 3, k(x === 9 ? 'window_box' : 'wall')); set(ground, x, 4, k(x === 9 ? 'window_base' : 'wall_base')); }
for (let x = 15; x <= 19; x++) for (let y = 0; y <= 2; y++) set(ground, x, y, b(y === 0 ? 'roof' : y === 1 ? 'roof_front' : 'wall'));

// The Goat Path gate at the street's west edge.
set(objects, 0, 5, 'act2_props:goat_gate');
// The piano's scrape marks along the street (rows 6), and the crowbar where it fell.
for (let x = 0; x < W; x++) set(objects, x, 6, `act2_marks:scrape_${x % 2 ? 'b' : 'a'}`);
set(objects, 7, 5, 'act2_props:crowbar_ground');

// The school yard (cols 1–7, rows 9–12): tiles, a hopscotch, the low wall and its gate.
for (let y = 9; y <= 12; y++) for (let x = 1; x <= 7; x++) set(ground, x, y, `schoolyard:${['yard', 'yard_b', 'yard_c'][(x * 7 + y * 3) % 3]}`);
set(ground, 3, 10, 'schoolyard:yard_hopscotch_n'); set(ground, 3, 11, 'schoolyard:yard_hopscotch_s');
set(objects, 1, 8, 'schoolyard:yardwall_end_l');
for (const x of [2, 3, 5, 6]) set(objects, x, 8, 'schoolyard:yardwall');
set(objects, 4, 8, 'schoolyard:yard_gate_open');
set(objects, 7, 8, 'schoolyard:yardwall_end_r');

// The Crown's south parapet with a stair cut (cols 9–19, row 9), the terrace face below it,
// and the rope barrier across the head of the stair.
for (let x = 9; x <= 19; x++) { set(objects, x, 9, 'crown_parapet:parapet'); set(ground, x, 10, 'street:retain'); set(ground, x, 11, 'street:retain_base'); }
set(objects, 13, 9, 'crown_parapet:parapet_end_l'); set(objects, 17, 9, 'crown_parapet:parapet_end_r');
for (const x of [14, 15, 16]) { set(objects, x, 9, null); set(ground, x, 10, x === 14 ? 'street:stairs_l' : x === 16 ? 'street:stairs_r' : 'street:stairs'); set(ground, x, 11, x === 14 ? 'street:stairs_l' : x === 16 ? 'street:stairs_r' : 'street:stairs'); }
set(objects, 14, 9, 'act2_props:rope_l'); set(objects, 15, 9, 'act2_props:rope_m'); set(objects, 16, 9, 'act2_props:rope_r');

// A landing below with Moonshine water trickling across it toward a step's joint.
for (const x of [9, 10, 11]) set(objects, x, 12, 'act2_water:trickle_h');
set(objects, 12, 12, 'act2_water:trickle_end');

export const SCENE = {
  title: 'Lamp Street and the Crown edge (Act 2 objects)',
  ground, objects, overhead,
  sprites: [{ sheet: 'piano', frame: 'piano_level', x: 11 * 16, y: 8 * 16 }],
  hero: [5 * 16 + 8, 7 * 16 + 14, 'right'],
  scale: 2,
};
