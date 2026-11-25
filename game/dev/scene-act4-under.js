// Act 4 underground, laid out as docs/design/04-the-list.md's maps (for judging the art in place).
// ?state=pumphall (default: asleep, Middle's throat empty), pumphall_run (all three running, shaft turning,
// grates draining), pumphall_burst (grates burst, flood spreading, the emergency hatch banging),
// wheel (still), wheel_turn, shaft (the climb, 6 x 30), cave (still), cave_turn.

const hull = f => `hull:${f}`, sis = f => `sisters:${f}`, ph = f => `pumphall:${f}`, tw = f => `tidewheel:${f}`,
  ch = f => `tide_channel:${f}`, es = f => `eshaft:${f}`, cave = f => `seacave:${f}`, gr = f => `seagrate:${f}`;

function grid(W, H, fill) {
  const blank = () => Array.from({ length: H }, () => Array(W).fill(null));
  const L = { ground: blank(), objects: blank(), overhead: blank() };
  L.set = (layer, x, y, ref) => { if (x >= 0 && x < W && y >= 0 && y < H) L[layer][y][x] = ref; };
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) L.set('ground', x, y, fill);
  return L;
}
// a north wall face, two rows tall (upper row y, lower row y+1)
function wall(L, x0, x1, y) {
  for (let x = x0; x <= x1; x++) {
    L.set('ground', x, y, hull(x % 3 ? 'face_top' : 'face_top_b'));
    L.set('ground', x, y + 1, hull(x % 3 ? 'face_base' : 'face_base_b'));
  }
}
function floor(L, x0, x1, y0, y1) {
  for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) {
    const h = (x * 73 + y * 151) % 29;
    L.set('ground', x, y, hull(h === 0 ? 'floor_glyph' : h === 7 ? 'floor_worn' : h === 13 ? 'floor_broken' : 'floor'));
  }
}
// put a multi-tile machine (w x h tiles) on a layer, tiles named <base>_x<c>y<r>[ _<anim> ]
function machine(L, layer, x0, y0, w, h, base) {
  for (let r = 0; r < h; r++) for (let c = 0; c < w; c++) L.set(layer, x0 + c, y0 + r, `${base.sheet}:${base.name}_x${c}y${r}`);
}

function pumphall(mode) {
  const W = 26, H = 12, L = grid(W, H, hull('top'));
  const run = mode !== 'still', burst = mode === 'burst';
  wall(L, 1, 24, 1);
  L.set('ground', 2, 1, hull('ladder_top')); L.set('ground', 2, 2, hull('ladder_bot'));
  L.set('ground', 22, 1, ph(burst ? 'erung_top_bang' : 'erung_top_shut')); L.set('ground', 22, 2, ph('erung_bot'));
  floor(L, 1, 24, 3, 10);
  L.set('ground', 25, 6, hull('floor')); L.set('ground', 25, 7, hull('floor'));               // the east archway
  for (let y = 3; y <= 10; y++) { L.set('ground', 0, y, hull('top_edge_e')); if (y < 6 || y > 7) L.set('ground', 25, y, hull('top_edge_w')); }
  for (let x = 1; x <= 24; x++) L.set('ground', x, 11, hull('top_edge_n'));
  // the Three Sisters on the objects layer, and their wake-valves
  const st = run ? 'run' : 'sleep';
  machine(L, 'objects', 5, 2, 3, 3, { sheet: 'sisters', name: `stout_${st}` });
  machine(L, 'objects', 11, 2, 1, 3, { sheet: 'sisters', name: `thin_${run ? 'cough' : 'sleep'}` });
  machine(L, 'objects', 16, 2, 2, 3, { sheet: 'sisters', name: run ? `middle_${st}` : 'middle_empty' });
  for (const x of [6, 11, 16]) L.set('objects', x, 5, sis(run ? 'wake_open' : 'wake_shut'));
  // the drive shaft along the top of the north wall (overhead)
  for (let x = 3; x <= 24; x++) L.set('overhead', x, 1, sis(x % 7 === 0 ? (run ? 'over_shaft_bearing' : 'over_shaft_bearing_still') : (run ? 'over_shaft' : 'over_shaft_still')));
  L.set('overhead', 3, 1, sis('over_shaft_end_w'));
  // the cell grates: full while the Sisters sleep, draining once they run (they no longer burst)
  const g = run ? 'drain' : 'full';
  for (const x of [4, 9, 14, 19]) { L.set('ground', x, 9, ph(`grate_${g}_l`)); L.set('ground', x + 1, 9, ph(`grate_${g}_r`)); }
  // the big main along the west wall (x1): down the north wall's face, then along the floor to the south wall
  const mp = f => `mainpipe:${f}`;
  L.set('objects', 1, 1, mp('pipe_wall_top')); L.set('objects', 1, 2, mp('pipe_wall_bot'));
  for (let y = 3; y <= 10; y++) L.set('objects', 1, y, mp(y === 10 ? 'pipe_end' : y % 3 === 0 ? 'pipe_flange' : y % 2 ? 'pipe_run' : 'pipe_run_b'));
  if (!burst) L.set('objects', 1, 6, mp('pipe_weep'));
  if (burst) {
    // the main splits at (1, 6) and sprays east; the water spreads from the west end, its front at x10
    L.set('objects', 1, 6, mp('pipe_split'));
    L.set('overhead', 1, 5, mp('over_spray_pn')); L.set('overhead', 1, 7, mp('over_spray_ps'));
    for (const [c, x] of [['a', 2], ['b', 3]]) for (const [r, y] of [['n', 5], ['m', 6], ['s', 7]]) L.set('overhead', x, y, mp(`over_spray_${r}${c}`));
    for (let y = 3; y <= 10; y++) for (let x = 2; x <= 9; x++) if (!(y === 9 && [4, 5, 9].includes(x))) L.set('ground', x, y, ph(x <= 6 ? 'flood' : 'flood_film'));
    for (let y = 3; y <= 10; y++) L.set('ground', 10, y, ph('flood_edge_e'));
  }
  const title = { still: 'Pump Hall (asleep; the Middle Sister\'s throat empty)', run: 'Pump Hall (bell rung: running, draining)', burst: 'Pump Hall (the burst)' }[mode];
  return { title, ...L, hero: [21 * 16 + 8, 4 * 16, 'up'], scale: 2 };
}

function wheel(turning) {
  const W = 12, H = 10, L = grid(W, H, hull('top'));
  wall(L, 1, 10, 1);
  floor(L, 1, 10, 3, 8);
  for (let y = 3; y <= 8; y++) { if (y < 4 || y > 5) L.set('ground', 0, y, hull('top_edge_e')); L.set('ground', 11, y, hull('top_edge_w')); }
  L.set('ground', 0, 4, hull('floor')); L.set('ground', 0, 5, hull('floor'));
  for (let x = 1; x <= 10; x++) L.set('ground', x, 9, hull('top_edge_n'));
  // the channel under the wheel, past both sides of it
  const k = turning ? 'rush' : 'slack';
  for (let y = 7; y <= 8; y++) { L.set('ground', 3, y, ch(`chan_${k}_w`)); L.set('ground', 8, y, ch(`chan_${k}_e`)); }
  machine(L, 'objects', 4, 3, 4, 6, { sheet: 'tidewheel', name: turning ? 'wheel_turn' : 'wheel' });
  L.set('ground', 10, 5, ch('day_grate'));
  L.set('ground', 2, 1, hull('lamp_amber')); L.set('ground', 9, 1, hull('lamp_amber'));
  return { title: `Tide Wheel (${turning ? 'turning' : 'still'})`, ...L, hero: [1 * 16 + 8, 5 * 16 + 16, 'right'], scale: 2 };
}

function shaft() {
  const W = 6, H = 30, L = grid(W, H, hull('top'));
  L.set('ground', 2, 0, es('slab_l')); L.set('ground', 3, 0, es('slab_r'));
  for (let y = 1; y <= 28; y++) {
    const kind = y <= 3 ? '_light' : y <= 12 ? '_dry' : y >= 22 ? '_wet' : '';
    const k = y === 28 ? 'rungs_foot' : `rungs${kind}`;
    L.set('ground', 2, y, es(`${k}_l`)); L.set('ground', 3, y, es(`${k}_r`));
    L.set('ground', 1, y, es(y >= 20 ? 'side_wet_l' : 'side_l')); L.set('ground', 4, y, es(y >= 20 ? 'side_wet_r' : 'side_r'));
  }
  return { title: 'Emergency Shaft (6 x 30)', ...L, hero: [3 * 16, 20 * 16, 'up'], scale: 2 };
}

function seacave(turning) {
  const W = 10, H = 8, L = grid(W, H, cave('rock'));
  for (let x = 1; x <= 8; x++) L.set('ground', x, 1, cave(x % 2 ? 'rock_face_a' : 'rock_face_b'));
  L.set('ground', 4, 1, gr(turning ? 'fgrate_turn_l' : 'fgrate_l')); L.set('ground', 5, 1, gr(turning ? 'fgrate_turn_r' : 'fgrate_r'));
  for (let y = 2; y <= 6; y++) for (let x = 1; x <= 8; x++) {
    const h = (x * 31 + y * 17) % 7;
    L.set('ground', x, y, cave(y === 2 ? 'sand_wet' : h === 0 ? 'sand_shells' : h === 3 ? 'sand_b' : 'sand'));
  }
  L.set('ground', 2, 3, cave('pool_l')); L.set('ground', 3, 3, cave('pool_r'));
  for (let y = 2; y <= 6; y++) { L.set('ground', 0, y, cave('rock_edge_e')); L.set('ground', 9, y, cave('rock_edge_w')); }
  for (const x of [1, 2, 3, 6, 7, 8]) L.set('ground', x, 7, cave('rock_edge_n'));
  L.set('ground', 4, 7, cave('mouth_l')); L.set('ground', 5, 7, cave('mouth_r'));
  return { title: `Sea Cave (${turning ? 'the wheel turning' : 'still'})`, ...L, hero: [5 * 16, 6 * 16 + 14, 'up'], scale: 3 };
}

export function SCENE(state) {
  switch (state) {
    case 'pumphall_run': return pumphall('run');
    case 'pumphall_burst': return pumphall('burst');
    case 'wheel': return wheel(false);
    case 'wheel_turn': return wheel(true);
    case 'shaft': return shaft();
    case 'cave': return seacave(false);
    case 'cave_turn': return seacave(true);
    default: return pumphall('still');
  }
}
