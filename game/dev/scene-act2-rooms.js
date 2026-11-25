// Act 2 interiors and Fountain Square props, laid out roughly as docs/design/02-city.md's maps,
// for judging the art in place. ?state=archive (default), crypt, shop, square.

export function SCENE(state) {
  if (state === 'crypt') return crypt();
  if (state === 'shop') return shop();
  if (state === 'square') return square();
  return archive();
}

function grid(W, H, fill) {
  const blank = () => Array.from({ length: H }, () => Array(W).fill(null));
  const L = { ground: blank(), objects: blank(), overhead: blank() };
  L.set = (layer, x, y, ref) => { if (x >= 0 && x < W && y >= 0 && y < H) L[layer][y][x] = ref; };
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) L.set('ground', x, y, typeof fill === 'function' ? fill(x, y) : fill);
  return L;
}
const ar = f => `archive:${f}`, af = f => `archive_furniture:${f}`, cr = f => `crypt:${f}`, sh = f => `shop:${f}`,
  sq = f => `square_props:${f}`, it = f => `interior:${f}`;

// A room: row 0 is the top of the north wall, then `faceRows` rows of its face; side walls; a south wall.
function room(L, W, H, k, faceRows) {
  for (let x = 0; x < W; x++) {
    const edge = x === 0 ? '_w' : x === W - 1 ? '_e' : '';
    L.set('ground', x, 0, k.cap + edge);
    faceRows.forEach((f, i) => L.set('ground', x, 1 + i, f + (edge && k.faceCorners ? edge : '')));
    L.set('ground', x, H - 1, k.south + edge);
  }
  for (let y = 1 + faceRows.length; y < H - 1; y++) { L.set('ground', 0, y, k.west); L.set('ground', W - 1, y, k.east); }
  for (const x of [0, W - 1]) faceRows.forEach((f, i) => { if (!k.faceCorners) L.set('ground', x, 1 + i, x ? k.east : k.west); });
}

function archive() {
  const W = 16, H = 14;
  const L = grid(W, H, (x, y) => ar((x * 7 + y * 3) % 11 ? 'floor' : 'floor_b'));
  room(L, W, H, { cap: ar('wall_cap'), south: ar('wall_s'), west: ar('wall_w'), east: ar('wall_e'), faceCorners: true },
    [ar('wall_face_upper'), ar('wall_face_lower')]);
  // curved wall bookcases (1-4 and 11-14), high windows (7-8)
  'abcd'.split('').forEach((c, i) => {
    for (const x0 of [1, 11]) { L.set('ground', x0 + i, 1, af(`wallshelf_top_${c}`)); L.set('ground', x0 + i, 2, af(`wallshelf_bot_${c}`)); }
  });
  L.set('ground', 7, 1, ar('window_nw')); L.set('ground', 8, 1, ar('window_ne'));
  L.set('ground', 7, 2, ar('window_sw')); L.set('ground', 8, 2, ar('window_se'));
  // the Eye (7-8, 8-9) with the teapot on it; the stair down (13, 11); the door (7-8, 13)
  L.set('ground', 7, 8, ar('eye_nw')); L.set('ground', 8, 8, ar('eye_ne'));
  L.set('ground', 7, 9, ar('eye_sw')); L.set('ground', 8, 9, ar('eye_se'));
  L.set('objects', 7, 8, af('teapot'));
  L.set('ground', 13, 11, ar('stair_down'));
  L.set('ground', 7, 13, ar('door_l')); L.set('ground', 8, 13, ar('door_r'));
  // pools of light from the high windows, falling on the floor in front of the desk
  L.set('objects', 6, 6, ar('pool_nw')); L.set('objects', 7, 6, ar('pool_n')); L.set('objects', 8, 6, ar('pool_n')); L.set('objects', 9, 6, ar('pool_ne'));
  L.set('objects', 6, 7, ar('pool_sw')); L.set('objects', 7, 7, ar('pool_s')); L.set('objects', 8, 7, ar('pool_s')); L.set('objects', 9, 7, ar('pool_se'));
  // freestanding shelves and Ottilie's desk
  for (const [x, y] of [[2, 4], [12, 4], [2, 10], [12, 10]]) { L.set('objects', x, y, af('shelf_free_l')); L.set('objects', x + 1, y, af('shelf_free_r')); }
  L.set('objects', 7, 5, af('desk_l')); L.set('objects', 8, 5, af('desk_r'));
  return {
    title: 'Archive (16×14)', ...L, scale: 2,
    sprites: [{ sheet: 'ottilie', frame: 'teacup_down', x: 7 * 16 + 8, y: 5 * 16 }],
    hero: [9 * 16 + 8, 12 * 16 + 14, 'up'],
  };
}

function crypt() {
  const W = 10, H = 7;
  const L = grid(W, H, (x, y) => cr((x + y * 3) % 5 ? 'floor' : 'floor_b'));
  room(L, W, H, { cap: cr('wall_cap'), south: cr('wall_s'), west: cr('wall_w'), east: cr('wall_e'), faceCorners: false },
    [cr('wall_face'), cr('wall_face_lower')]);
  for (let x = 1; x < W - 1; x++) { L.set('ground', x, 0, cr('wall_cap')); }
  L.set('ground', 0, 0, cr('wall_w')); L.set('ground', W - 1, 0, cr('wall_e'));
  // crates of records (1-2 and 8), the Founders' Door (5-6, 1-2), the lectern (3, 3), the stair up (1, 5)
  for (const x of [1, 2, 8]) { L.set('objects', x, 1, af('crate_stack_top')); L.set('objects', x, 2, af('crate_stack_bot')); }
  L.set('ground', 5, 1, 'founders_door:founders_door_x0y0'); L.set('ground', 6, 1, 'founders_door:founders_door_x1y0');
  L.set('ground', 5, 2, 'founders_door:founders_door_x0y1'); L.set('ground', 6, 2, 'founders_door:founders_door_x1y1');
  L.set('objects', 3, 3, af('lectern'));
  L.set('ground', 1, 5, cr('stair_up'));
  return { title: 'Crypt (10×7)', ...L, scale: 3, sprites: [], hero: [6 * 16 + 8, 4 * 16 + 14, 'up'] };
}

function shop() {
  const W = 10, H = 8;
  const L = grid(W, H, sh('floor'));
  for (let x = 0; x < W; x++) {
    L.set('ground', x, 0, it(x === 0 ? 'wall_upper_w' : x === W - 1 ? 'wall_upper_e' : 'wall_upper'));
    L.set('ground', x, 1, it(x === 0 ? 'wall_lower_w' : x === W - 1 ? 'wall_lower_e' : 'wall_lower'));
    L.set('ground', x, H - 1, it(x === 0 ? 'wall_south_w' : x === W - 1 ? 'wall_south_e' : 'wall_south'));
  }
  for (let y = 2; y < H - 1; y++) { L.set('ground', 0, y, it('wall_side_w')); L.set('ground', W - 1, y, it('wall_side_e')); }
  'abcd'.split('').forEach((c, i) => L.set('ground', 1 + i, 1, sh(`shelving_${c}`)));
  L.set('ground', 7, 1, sh('shelving_e')); L.set('ground', 8, 1, sh('shelving_f'));
  L.set('objects', 7, 0, sh('barometer'));
  L.set('objects', 2, 3, sh('counter_l'));
  for (let x = 3; x <= 5; x++) L.set('objects', x, 3, sh('counter_m'));
  L.set('objects', 6, 3, sh('counter_r'));
  L.set('objects', 1, 5, sh('marble_jar'));
  L.set('objects', 7, 5, sh('display_l')); L.set('objects', 8, 5, sh('display_r'));
  L.set('ground', 4, 7, it('door')); L.set('ground', 5, 7, it('door'));
  return {
    title: 'Shop (10×8)', ...L, scale: 3,
    sprites: [{ sheet: 'shopkeeper', frame: 'idle_down', x: 4 * 16 + 8, y: 3 * 16 }],
    hero: [4 * 16 + 8, 6 * 16 + 14, 'up'],
  };
}

function square() {
  // A corner of Fountain Square: the Mayor's office front with its plaque, two market stalls, the
  // Mayor's crate, and two cafe tables.
  const W = 16, H = 10;
  const pave = (x, y) => `street:pave_${y % 2 ? 's' : 'n'}${x % 2 ? 'e' : 'w'}`;
  const L = grid(W, H, pave);
  for (let x = 0; x < W; x++) {
    L.set('ground', x, 0, 'buildings:roof_front@ochre');
    L.set('ground', x, 1, `buildings:${x === 11 ? 'door_top' : x % 3 === 1 ? 'window' : 'wall'}@ochre`);
    L.set('ground', x, 2, `buildings:${x === 11 ? 'door_bot' : x % 3 === 1 ? 'window_base' : 'wall_base'}@ochre`);
  }
  L.set('objects', 12, 1, sq('plaque'));
  for (const x0 of [1, 4]) {
    L.set('overhead', x0, 5, sq('over_stall_nw')); L.set('overhead', x0 + 1, 5, sq('over_stall_ne'));
    L.set('objects', x0, 6, sq('stall_sw')); L.set('objects', x0 + 1, 6, sq('stall_se'));
  }
  L.set('objects', 8, 5, sq('mayor_crate'));
  for (const x of [11, 14]) {
    L.set('objects', x, 6, sq('cafe_table'));
    L.set('objects', x, 5, sq('cafe_chair'));
    L.set('objects', x, 7, sq('cafe_chair_back'));
  }
  return { title: 'Fountain Square props (a corner)', ...L, scale: 2, sprites: [], hero: [9 * 16 + 8, 8 * 16 + 14, 'up'] };
}
