// Act 6 underground, laid out as docs/design/06-moon-in-the-bowl.md's maps (for judging the art in place).
// ?state=sighting (default): the Sighting Room, the Basin dry with the plug glinting at the bottom.
// ?state=sighting_fill / sighting_full / sighting_lit: the Basin filling, full and still, and full with its rim lit
//   (sighting_lit also shows the trim wheel turning, the master stop risen and Cheryl's shoes by the Basin).
// ?state=keel: the Long Keel, the lamps waking, the west door shut. ?state=keel_open: the door slid up.
// ?state=windlass_night: the Windlass Room at night, the chain coming in, the hatch's emblem lit.

export function SCENE(state) {
  if (state === 'basins') return basins();
  if (state === 'keel' || state === 'keel_open') return keel(state === 'keel_open');
  if (state === 'windlass_night') return windlassNight();
  return sighting(state || 'sighting');
}

const hull = f => `hull:${f}`, s6 = s => f => `${s}:${f}`;
const basin = s6('basin'), beam = s6('moonbeam'), sw = s6('sight_wall'), props = s6('sight_props'), keelS = s6('keel');

function grid(W, H) {
  const blank = () => Array.from({ length: H }, () => Array(W).fill(null));
  const L = { ground: blank(), objects: blank(), overhead: blank() };
  L.set = (layer, x, y, ref) => { if (x >= 0 && x < W && y >= 0 && y < H) L[layer][y][x] = ref; };
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) L.set('ground', x, y, hull('top'));
  return L;
}
const Q = [['nw', 0, 0], ['ne', 1, 0], ['sw', 0, 1], ['se', 1, 1]];

function sighting(state) {
  const W = 16, H = 13, L = grid(W, H);
  // north wall face x2–12, rows 1–2, ending in chamfers
  for (let x = 2; x <= 12; x++) {
    L.set('ground', x, 1, hull(x % 2 ? 'face_top' : 'face_top_b'));
    L.set('ground', x, 2, hull(x % 2 ? 'face_base' : 'face_base_b'));
  }
  L.set('ground', 12, 1, hull('face_top_end_r')); L.set('ground', 12, 2, hull('face_base_end_r'));
  L.set('ground', 2, 1, hull('face_top_end_l')); L.set('ground', 2, 2, hull('face_base_end_l'));
  // the floor, eight-sided
  const rows = { 3: [2, 13], 4: [1, 14], 5: [1, 14], 6: [1, 14], 7: [1, 14], 8: [1, 14], 9: [1, 14], 10: [2, 13], 11: [3, 12] };
  for (const [y, [x0, x1]] of Object.entries(rows)) for (let x = x0; x <= x1; x++) {
    const h = (x * 73 + +y * 151) % 23;
    L.set('ground', x, +y, hull(h === 0 ? 'floor_glyph' : h === 9 ? 'floor_worn' : 'floor'));
  }
  L.set('ground', 13, 3, hull('top_chamfer_ne')); L.set('ground', 1, 4, hull('top_chamfer_nw')); L.set('ground', 14, 4, hull('top_chamfer_ne'));
  L.set('ground', 1, 9, hull('top_chamfer_sw')); L.set('ground', 14, 9, hull('top_chamfer_se'));
  L.set('ground', 2, 10, hull('top_chamfer_sw')); L.set('ground', 13, 10, hull('top_chamfer_se'));
  L.set('ground', 3, 11, hull('top_chamfer_sw')); L.set('ground', 12, 11, hull('top_chamfer_se'));
  L.set('ground', 7, 12, hull('floor')); L.set('ground', 8, 12, hull('floor'));
  const lit = state === 'sighting_lit';
  // the trim wheel (3–4, 1–2) and the lift (6–7, 1–2)
  for (const [q, dx, dy] of Q) {
    L.set('ground', 3 + dx, 1 + dy, lit ? sw(`trim_${q}`) : sw(`trim_still_${q}`));
    L.set('ground', 6 + dx, 1 + dy, sw(lit ? `lift_open_${q}` : `lift_closed_${q}`));
  }
  // the Basin (7–8, 5–6) and the moonlight column falling onto it (7–8, 2–4)
  const b = { sighting: 'dry_plug', sighting_fill: 'fill', sighting_full: 'full', sighting_lit: 'lit', sighting_plug: 'plug_water', sighting_dry: 'dry' }[state] || 'dry_plug';
  for (const [q, dx, dy] of Q) {
    L.set('objects', 7 + dx, 5 + dy, (b === 'dry_plug' || b === 'dry') ? basin(`basin_${b}_${q}`) : basin(`basin_${b}_${q}`));
  }
  for (let r = 0; r < 4; r++) for (let c = 0; c < 2; c++) L.set('overhead', 7 + c, 2 + r, beam(`over_moon_x${c}y${r}`));
  // the sighting log on its stand (14, 4); Cheryl's shoes by the Basin once she's in it
  L.set('objects', 14, 4, props('log_stand'));
  if (lit) L.set('objects', 6, 7, props('shoes'));
  // the Keepers' sconces in the north wall (5, 1) and (10, 1), lit once the moon is true
  for (const x of [5, 10]) L.set('ground', x, 1, `sight_lamp:${lit ? 'lamp_lit' : 'lamp_dead'}`);
  const sprites = [{ sheet: 'master_stop', frame: lit ? 'stop_risen' : 'stop_locked', x: 9 * 16 + 8, y: 7 * 16 }];
  // the plug's glint over the dry Basin: the star's centre (8, 8) on world (126, 93)
  if (b === 'dry_plug') sprites.push({ sheet: 'plug_glint', frame: 'glint', x: 126, y: 101 });
  const titles = { sighting: 'dry, the plug glinting', sighting_fill: 'filling', sighting_full: 'full and still', sighting_lit: 'the rim lit', sighting_plug: 'the plug under the water', sighting_dry: 'dry and empty' };
  return { title: `Sighting Room (${titles[state] || titles.sighting})`, ...L, sprites,
    hero: lit ? null : [7 * 16 + 8, 11 * 16, 'up'], scale: 3 };
}

// every Basin state side by side, without the moonlight over them (for judging the Basin itself)
function basins() {
  const states = ['dry_plug', 'dry', 'fill', 'full', 'plug_water', 'lit'];
  const W = states.length * 3 + 1, H = 4, L = grid(W, H);
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) L.set('ground', x, y, hull('floor'));
  states.forEach((st, i) => {
    for (const [q, dx, dy] of Q) L.set('objects', 1 + i * 3 + dx, 1 + dy, basin(`basin_${st}_${q}`));
  });
  return { title: 'The Basin: dry with plug, dry, filling, full, plug under water, rim lit', ...L, sprites: [], hero: null, scale: 4 };
}

function keel(open) {
  const W = 40, H = 7, L = grid(W, H);
  for (let x = 1; x <= 38; x++) {
    L.set('ground', x, 1, hull(x % 3 ? 'face_top' : 'face_top_b'));
    L.set('ground', x, 2, hull(x % 3 ? 'face_base' : 'face_base_b'));
  }
  for (let x = 1; x <= 38; x++) {
    L.set('ground', x, 3, keelS('keel_n'));
    L.set('ground', x, 4, keelS(x % 5 === 2 ? 'keel_groove_b' : 'keel_groove'));
    L.set('ground', x, 5, keelS('keel_s'));
  }
  L.set('ground', 39, 3, keelS('keel_n')); L.set('ground', 39, 4, keelS('keel_groove'));
  // lamps every five (2, 7, …, 37) on the upper row, waking toward the west; ribs every four
  for (const x of [2, 7, 12, 17, 22, 27, 32, 37]) {
    const awake = x >= 17;
    L.set('ground', x, 1, awake ? 'keel_hatch:lamp_lit' : x === 12 ? 'keel_hatch:lamp_wake' : 'keel_hatch:lamp_dead');
    if (awake) L.set('ground', x, 3, hull('floor_glow'));
  }
  for (let x = 4; x <= 36; x += 4) {
    if (L.ground[1][x] && String(L.ground[1][x]).includes('lamp')) continue;
    L.set('ground', x, 1, hull('face_rib_top')); L.set('ground', x, 2, hull('face_rib_base'));
    for (let y = 3; y <= 5; y++) L.set('overhead', x, y, hull('over_rib_v'));
  }
  // the west door (0, 3–4), sliding up
  L.set('ground', 0, 3, keelS(open ? 'keel_door_open_top' : 'keel_door_closed_top'));
  L.set('ground', 0, 4, keelS(open ? 'keel_door_open_bot' : 'keel_door_closed_bot'));
  return { title: 'Long Keel' + (open ? ' (the door slid up)' : ' (the lamps waking ahead of her)'), ...L, sprites: [],
    hero: [20 * 16 + 8, 4 * 16 + 16, 'left'], scale: 2 };
}

function windlassNight() {
  const W = 22, H = 14, L = grid(W, H);
  for (let x = 1; x <= 20; x++) {
    L.set('ground', x, 1, hull(x % 3 ? 'face_top' : 'face_top_b'));
    L.set('ground', x, 2, hull(x % 3 ? 'face_base' : 'face_base_b'));
  }
  for (let y = 3; y <= 12; y++) for (let x = 1; x <= 20; x++) L.set('ground', x, y, hull('floor'));
  for (let y = 3; y <= 12; y++) { L.set('ground', 0, y, hull('top_edge_e')); L.set('ground', 21, y, hull('top_edge_w')); }
  for (let x = 1; x <= 20; x++) L.set('ground', x, 13, hull('top_edge_n'));
  L.set('ground', 21, 3, 'windlass_night:hawse_in_top'); L.set('ground', 21, 4, 'windlass_night:hawse_in_bot');
  L.set('ground', 2, 1, 'keel_hatch:lamp_lit'); L.set('ground', 19, 1, 'keel_hatch:lamp_lit');
  for (const [q, dx, dy] of Q) L.set('ground', 7 + dx, 1 + dy, `keel_lit:keel_lit_${q}`);
  for (let r = 0; r < 4; r++) for (let c = 0; c < 16; c++) L.set('objects', 5 + c, 4 + r, `windlass_drum:drum_x${c}y${r}`);
  for (const [q, dx, dy] of Q) L.set('ground', 7 + dx, 8 + dy, `windlass:socket_clapper_${q}`);
  L.set('objects', 3, 10, 'windlass:coil_a_l'); L.set('objects', 4, 10, 'windlass:coil_a_r');
  return { title: 'Windlass Room at night (the chain coming in)', ...L,
    sprites: [{ sheet: 'brake', frame: 'brake_thrown', x: 17 * 16 + 8, y: 9 * 16 }], hero: null, scale: 2 };
}
