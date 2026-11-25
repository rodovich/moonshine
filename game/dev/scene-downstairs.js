// Act 3 Downstairs, laid out as docs/design/03-downstairs.md's maps (for judging the art in place).
// Default: the Step Gallery (24 x 11), with the lever pulled and the beam on the hatch (up-right).
// ?state=halls: the Lamp Halls (32 x 14). ?state=dark: the Step Gallery before the lever.
// ?state=nw / n / rest: the mirror aimed up-left (Sisters inlay), straight up (moons inlay), or resting
// (beam lying flat along the floor to the east).

export function SCENE(state) {
  if (state === 'halls') return halls();
  return gallery(state === 'dark', ['nw', 'n', 'rest'].includes(state) ? state : 'ne');
}

const hull = f => `hull:${f}`, ds = f => `ds:${f}`, day = f => `ds_day:${f}`, wat = f => `ds_water:${f}`;
function grid(W, H) {
  const blank = () => Array.from({ length: H }, () => Array(W).fill(null));
  const L = { ground: blank(), objects: blank(), overhead: blank() };
  L.set = (layer, x, y, ref) => { if (x >= 0 && x < W && y >= 0 && y < H) L[layer][y][x] = ref; };
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) L.set('ground', x, y, hull('top'));
  return L;
}
// a north wall face two rows tall (upper row y, lower row y+1) from x0 to x1
function wall(L, x0, x1, y) {
  for (let x = x0; x <= x1; x++) {
    L.set('ground', x, y, hull(x % 3 ? 'face_top' : 'face_top_b'));
    L.set('ground', x, y + 1, hull(x % 3 ? 'face_base' : 'face_base_b'));
  }
}
function floor(L, x0, x1, y0, y1) {
  // mostly plain plates; a worn or inlaid one now and then (by a hash, so no pattern shows)
  for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) {
    const h = (x * 73 + y * 151) % 29;
    L.set('ground', x, y, hull(h === 0 ? 'floor_glyph' : h === 7 ? 'floor_worn' : h === 13 ? 'floor_broken' : 'floor'));
  }
}

function gallery(dark, aim) {
  const W = 24, H = 11, L = grid(W, H);
  wall(L, 1, 22, 1);
  floor(L, 1, 22, 3, 9);
  // Wall pieces sit on the doc's x; upper-row pieces (niches, inlays) on y1, lower-row pieces (lever) on y2.
  L.set('ground', 2, 1, ds(dark ? 'niche_dead' : 'niche_lit'));
  L.set('ground', 22, 1, ds('niche_dead'));
  // The mirror's three targets on the north wall, four rows above it (03-downstairs.md).
  // Inlays are upper-row pieces (y1) over their target tiles (y2); the moon-lock hatch is on the lower row.
  L.set('ground', 6, 1, ds('inlay_sisters_l')); L.set('ground', 7, 1, ds('inlay_sisters_r'));
  L.set('ground', 10, 1, ds('inlay_moon_l')); L.set('ground', 11, 1, ds('inlay_moon_r'));
  L.set('ground', 19, 2, ds(dark ? 'lever_jammed' : 'lever_pulled'));
  L.set('ground', 15, 2, ds(!dark && aim === 'ne' ? 'moonhatch_lit' : 'moonhatch'));
  // the ladder up to the Hundred Steps at (3,3), in its column of daylight
  L.set('ground', 3, 3, day('day_spot'));
  L.set('overhead', 3, 2, day('over_shaft_open'));
  L.set('overhead', 3, 3, day('over_column'));
  // the floor grate (6,8), closed
  L.set('ground', 6, 8, ds('grate_closed'));
  // ceiling ribs across the deck
  for (const x of [5, 17, 21]) for (let y = 3; y <= 9; y++) L.set('overhead', x, y, hull('over_rib_v'));
  // the light shaft over the mirror (11,6)
  L.set('overhead', 11, 4, day(dark ? 'over_shaft_shut' : 'over_shaft_open'));
  if (!dark) { L.set('overhead', 11, 5, day('over_column')); L.set('ground', 11, 6, day('day_spot')); }
  // the reflected beam: 45 degrees up-left or up-right, straight up, or flat along the floor to the east
  const add = (x, y, ref) => { const cur = L.overhead[y][x]; L.set('overhead', x, y, cur ? `${cur}+${ref}` : ref); };
  if (!dark) {
    if (aim === 'ne') { add(12, 5, day('over_beam_ne')); add(13, 4, day('over_beam_ne')); add(14, 3, day('over_beam_ne')); add(15, 2, day('over_beam_end_n')); }
    if (aim === 'nw') { add(10, 5, day('over_beam_nw')); add(9, 4, day('over_beam_nw')); add(8, 3, day('over_beam_nw')); add(7, 2, day('over_beam_end_n')); }
    if (aim === 'n') { add(11, 3, day('over_beam_v')); add(11, 2, day('over_beam_end_n')); }
    if (aim === 'rest') { for (let x = 12; x <= 21; x++) add(x, 6, day('over_beam_h')); add(22, 6, day('over_beam_end_e')); }
  }
  const mirror = dark ? 'mirror_s' : { ne: 'mirror_ne', nw: 'mirror_nw', n: 'mirror_n', rest: 'mirror_e' }[aim];
  const sprites = [
    { sheet: 'ds_mirror', frame: mirror, x: 11 * 16 + 8, y: 7 * 16 },
    { sheet: 'cheryl', frame: 'down_0', x: 5 * 16 + 8, y: 8 * 16 },   // under a rib: the beam must not hide her
    { sheet: 'ds_mirror', frame: 'dropladder_down', x: 3 * 16 + 8, y: 4 * 16 },
  ];
  return { title: 'Step Gallery' + (dark ? ' (before the lever)' : ` (mirror ${aim})`), ...L, sprites, hero: [9 * 16, 4 * 16 + 14, 'up'], scale: 2 };
}

function halls() {
  const W = 32, H = 14, L = grid(W, H);
  wall(L, 1, 23, 4); wall(L, 27, 27, 4);
  floor(L, 1, 28, 6, 10);
  // the flooded north passage (25–26, 1–6) with the gushing pipe at (27,2)
  for (let y = 1; y <= 6; y++) { L.set('ground', 25, y, wat('flood')); L.set('ground', 26, y, wat('flood')); }
  L.set('ground', 25, 0, hull('floor')); L.set('ground', 26, 0, hull('floor'));
  for (let y = 1; y <= 3; y++) { L.set('ground', 24, y, hull('top_edge_w')); L.set('ground', 27, y, hull('top_edge_e')); }
  L.set('ground', 27, 2, hull('face_base')); L.set('objects', 27, 2, wat('gush'));
  L.set('ground', 25, 2, wat('flood_splash'));
  // wall features on row 5: chute (3–4), chain (7), lamps (9, 18), the bunk room doorway (13–14), speaking tube (22), valve (23)
  L.set('ground', 3, 5, ds('chute_l')); L.set('ground', 4, 5, ds('chute_r'));
  L.set('ground', 7, 5, ds('wall_chain'));
  L.set('ground', 9, 4, ds('niche_dead')); L.set('ground', 18, 4, ds('niche_lit'));
  L.set('ground', 13, 4, hull('hatch_open_top')); L.set('ground', 14, 4, hull('hatch_open_top'));
  L.set('ground', 13, 5, hull('hatch_open_bot')); L.set('ground', 14, 5, hull('hatch_open_bot'));
  L.set('ground', 22, 4, ds('horn'));
  L.set('ground', 6, 4, ds('inlay_roster_l')); L.set('ground', 7, 4, ds('inlay_roster_r'));
  L.set('objects', 22, 5, 'machines:valve_big_nw'); L.set('objects', 23, 5, 'machines:valve_big_ne');
  L.set('objects', 22, 6, 'machines:valve_big_sw'); L.set('objects', 23, 6, 'machines:valve_big_se');
  // the drop-ladder hooked against the ceiling at (8,6)
  L.set('overhead', 8, 6, ds('over_dropladder_hooked'));
  // light-pipes at (5,8), (12,8), (20,8), each with its pool
  for (const x of [5, 12, 20]) L.set('ground', x, 8, hull('floor_glow'));
  // the drowned corridor south (17–18, 11–13): steps going under black water
  L.set('ground', 17, 11, wat('black_edge')); L.set('ground', 18, 11, wat('black_edge'));
  for (let y = 12; y <= 13; y++) { L.set('ground', 17, y, wat('black')); L.set('ground', 18, y, wat('black')); }
  for (const x of [4, 8, 12, 16, 20, 24]) for (let y = 6; y <= 10; y++) L.set('overhead', x, y, hull('over_rib_v'));
  const sprites = [5, 12, 20].map(x => ({ sheet: 'ds_rod', frame: 'rod', x: x * 16 + 8, y: 9 * 16 - 2 }));
  sprites.push({ sheet: 'cheryl', frame: 'sitfloor_down', x: 3 * 16 + 8, y: 8 * 16 });
  return { title: 'Lamp Halls', ...L, sprites, scale: 2 };
}
