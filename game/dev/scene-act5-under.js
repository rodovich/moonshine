// Act 5 underground, laid out as docs/design/05-high-and-dry.md's maps (for judging the art in place).
// ?state=windlass (default): the Windlass Room, the Tooth's stump in its socket, the brake locked, the drum still.
// ?state=windlass_clapper: the clapper seated, the brake thrown, the drum turning, the hawse gone violet.
// ?state=passage: the Bow Passage, the door shut, the lamps dead. ?state=passage_lit: the door open, the lamps lit.

export function SCENE(state) {
  if (state === 'passage' || state === 'passage_lit') return passage(state === 'passage_lit');
  return windlass(state === 'windlass_clapper');
}

const hull = f => `hull:${f}`, w5 = s => f => `${s}:${f}`;
const drum = w5('windlass_drum'), wl = w5('windlass'), haw = w5('hawse'), kh = w5('keel_hatch'), bd = w5('bowdoor');

function grid(W, H) {
  const blank = () => Array.from({ length: H }, () => Array(W).fill(null));
  const L = { ground: blank(), objects: blank(), overhead: blank() };
  L.set = (layer, x, y, ref) => { if (x >= 0 && x < W && y >= 0 && y < H) L[layer][y][x] = ref; };
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) L.set('ground', x, y, hull('top'));
  return L;
}
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

function windlass(clapper) {
  const W = 22, H = 14, L = grid(W, H);
  wall(L, 1, 20, 1);
  floor(L, 1, 20, 3, 12);
  // side walls (tops only), the exit west at rows 6–7, the hawse east at rows 3–4
  for (let y = 3; y <= 12; y++) { L.set('ground', 0, y, hull('top_edge_e')); L.set('ground', 21, y, hull('top_edge_w')); }
  L.set('ground', 0, 6, hull('floor')); L.set('ground', 0, 7, hull('floor'));
  for (let x = 1; x <= 20; x++) L.set('ground', x, 13, hull('top_edge_n'));
  const hw = clapper ? 'hawse_late' : 'hawse';
  L.set('ground', 21, 3, haw(`${hw}_top`)); L.set('ground', 21, 4, haw(`${hw}_bot`));
  // north wall: lamps (2, 19) and the speaking tube (15) on the upper row; the Long Keel hatch (7–8, 1–2)
  L.set('ground', 2, 1, kh('lamp_lit')); L.set('ground', 19, 1, kh('lamp_lit'));
  L.set('ground', 15, 1, 'ds:horn');
  for (const [n, x, y] of [['nw', 7, 1], ['ne', 8, 1], ['sw', 7, 2], ['se', 8, 2]]) L.set('ground', x, y, kh(`keel_sealed_${n}`));
  // light pools under the lamps
  L.set('ground', 2, 3, hull('floor_glow')); L.set('ground', 19, 3, hull('floor_glow'));
  // the drum and its chain (5–20, 4–7)
  for (let r = 0; r < 4; r++) for (let c = 0; c < 16; c++) L.set('objects', 5 + c, 4 + r, drum(clapper ? `drum_x${c}y${r}` : `drum_x${c}y${r}_0`));
  if (clapper) for (let r = 0; r < 4; r++) for (let c = 0; c < 16; c++) L.objects[4 + r][5 + c] = drum(`drum_x${c}y${r}`);
  // the Tooth socket (7–8, 8–9)
  const sk = clapper ? 'clapper' : 'stump';
  for (const [n, x, y] of [['nw', 7, 8], ['ne', 8, 8], ['sw', 7, 9], ['se', 8, 9]]) L.set('ground', x, y, wl(`socket_${sk}_${n}`));
  if (clapper) L.set('objects', 10, 10, wl('stump_loose'));
  // coils of spare chain (3–4, 10) and (15–16, 10)
  L.set('objects', 3, 10, wl('coil_a_l')); L.set('objects', 4, 10, wl('coil_a_r'));
  L.set('objects', 15, 10, wl('coil_b_l')); L.set('objects', 16, 10, wl('coil_b_r'));
  const sprites = [{ sheet: 'brake', frame: clapper ? 'brake_thrown' : 'brake_locked', x: 17 * 16 + 8, y: 9 * 16 }];
  return { title: 'Windlass Room' + (clapper ? ' (the clapper seated, the brake thrown)' : ''), ...L, sprites,
    hero: clapper ? [3 * 16 + 8, 11 * 16, 'right'] : [11 * 16 + 8, 10 * 16, 'up'], scale: 2,
    after: clapper ? null : undefined };
}

function passage(lit) {
  const W = 18, H = 8, L = grid(W, H);
  wall(L, 1, 16, 1);
  floor(L, 2, 16, 3, 5);
  L.set('ground', 1, 5, hull('floor'));
  for (let x = 1; x <= 16; x++) L.set('ground', x, 6, hull('top_edge_n'));
  L.set('ground', 17, 3, hull('floor')); L.set('ground', 17, 4, hull('floor'));
  L.set('ground', 17, 5, hull('top_edge_w'));
  // the bronze door, inside (0–1, 3–4)
  const ds = lit ? 'open' : 'shut';
  for (const [n, x, y] of [['nw', 0, 3], ['ne', 1, 3], ['sw', 0, 4], ['se', 1, 4]]) L.set('ground', x, y, bd(`bowdoor_${ds}_${n}`));
  // lamps at x 2, 7, 12, 16 on the upper row; ribs between them, every few tiles
  for (const x of [2, 7, 12, 16]) {
    L.set('ground', x, 1, lit ? 'keel_hatch:lamp_wake' : 'keel_hatch:lamp_dead');
    if (lit) L.set('ground', x, 3, hull('floor_glow'));
  }
  for (const x of [4, 9, 14]) {
    L.set('ground', x, 1, hull('face_rib_top')); L.set('ground', x, 2, hull('face_rib_base'));
    for (let y = 3; y <= 5; y++) L.set('overhead', x, y, hull('over_rib_v'));
  }
  return { title: 'Bow Passage' + (lit ? ' (the lamps awake)' : ''), ...L, sprites: [],
    hero: [3 * 16 + 8, 4 * 16 + 16, 'right'], scale: 3 };
}
