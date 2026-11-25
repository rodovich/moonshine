// Act 5 surface scenes (docs/design/05-high-and-dry.md), for judging the art in place.
// ?state=harbor (default; the Teeth at stage 1), harbor_teeth2, harbor_teeth3, clockshop,
// bilge (rope tied, the bronze door open), bilge_disc (the dim disc in the eye), shop (display
// fallen), shop_guide (the guidebook in pride of place), square (the banner), lamproom.
import { SCENE as A4 } from './scene-act4-surface.js';
import { SCENE as A2 } from './scene-act2-rooms.js';

export function SCENE(state = 'harbor') {
  if (state.startsWith('harbor')) return harbor(state === 'harbor_teeth3' ? 3 : state === 'harbor_teeth2' ? 2 : 1);
  if (state === 'clockshop') return clockshop();
  if (state.startsWith('bilge')) return bilge(state === 'bilge_disc');
  if (state.startsWith('shop')) return shop(state === 'shop_guide');
  if (state === 'square') return square();
  if (state === 'lamproom') return lamproom();
  return harbor(1);
}

function grid(W, H) {
  const blank = () => Array.from({ length: H }, () => Array(W).fill(null));
  const L = { ground: blank(), objects: blank(), overhead: blank() };
  L.set = (layer, x, y, ref) => { if (x >= 0 && x < W && y >= 0 && y < H) L[layer][y][x] = ref; };
  return L;
}
const pave = (x, y) => `street:pave_${y % 2 ? 's' : 'n'}${x % 2 ? 'e' : 'w'}`;
const V8 = 'abcdefgh';

function harbor(stage) {
  const W = 32, Hh = 15, L = grid(W, Hh);
  // rows 0-3: the Prow's rock, the Goat stair (2-3), the harbor-front houses (5-22), the lighthouse (26-29)
  for (let y = 0; y < 4; y++) for (let x = 0; x < W; x++) L.set('ground', x, y, (x + y) % 3 ? 'seacave:rock' : 'seacave:rock_face_a');
  for (let y = 0; y < 4; y++) { L.set('ground', 2, y, 'street:stairs_l'); L.set('ground', 3, y, 'street:stairs_r'); }
  const houses = [[5, 10, 'ochre'], [11, 16, 'rose'], [17, 22, 'sky']];
  for (const [x0, x1, pal] of houses) {
    for (let x = x0; x <= x1; x++) {
      const e = x === x0 ? '_l' : x === x1 ? '_r' : '';
      L.set('ground', x, 0, `rooftiles:ridge${e}`);
      L.set('ground', x, 1, `rooftiles:tiles${e}`);
      L.set('overhead', x, 1, `rooftiles:over_eave${e}`);
      L.set('ground', x, 2, `buildings:${(x - x0) % 2 ? 'window' : 'wall'}@${pal}`);
      L.set('ground', x, 3, `buildings:${x === x0 + 1 ? 'door_bot' : 'wall_base'}@${pal}`);
    }
    L.set('ground', x0 + 1, 2, `buildings:door_top@${pal}`);
  }
  for (let ty = 0; ty < 4; ty++) for (let tx = 0; tx < 4; tx++) L.set('objects', 26 + tx, ty, `lighthouse:lighthouse_x${tx}y${ty}`);
  // rows 4-8: the quay
  for (let y = 4; y <= 8; y++) for (let x = 0; x < W; x++) L.set('ground', x, y, pave(x, y));
  // row 9: the old quay edge; row 10: the exposed hull; the Keyhole (30-31, 9-10)
  for (let x = 0; x < W; x++) {
    L.set('ground', x, 9, `reveal:qwall_${V8[x % 8]}`);
    L.set('ground', x, 10, `harbor_hull:hull_${V8[x % 8]}`);
  }
  for (let ty = 0; ty < 2; ty++) for (let tx = 0; tx < 2; tx++) L.set('ground', 30 + tx, 9 + ty, `keyhole:keyhole_x${tx}y${ty}`);
  // rows 11-14: the sea, lower; row 11 laps the hull's foot
  for (let x = 0; x < W; x++) L.set('ground', x, 11, `sea:wash_${x % 2 ? 'b' : 'a'}`);
  for (let x = 0; x < W; x++) L.set('ground', x, 12, `sea:sea_n${x % 2 ? 'e' : 'w'}`);
  // rows 13-14: the far sea, paler and hazier, fading to haze at the bottom edge: the Teeth sit on it
  for (let x = 0; x < W; x++) {
    L.set('ground', x, 13, `sea:far_${x % 2 ? 'b' : 'a'}`);
    L.set('ground', x, 14, `sea:haze_${x % 2 ? 'b' : 'a'}`);
  }
  // props: bollards with the ferry's ropes, crates and nets, the laundry streaming
  L.set('objects', 8, 8, 'harbor_props:bollard_rope'); L.set('objects', 18, 8, 'harbor_props:bollard_rope');
  L.set('objects', 5, 4, 'props:crate'); L.set('objects', 6, 4, 'props:crate'); L.set('objects', 20, 4, 'harbor_props:nets');
  'abcdef'.split('').forEach((c, i) => L.set('overhead', 7 + i, 4, `cloth:over_wind_${c}`));
  const sprites = [
    { sheet: 'ferry', frame: 'persistence', x: 8 * 16, y: 8 * 16, topLeft: true },
    { sheet: 'teeth', frame: `stage${stage}`, x: 8 * 16, y: 13 * 16, topLeft: true },
    { sheet: 'mott', frame: 'down_0', x: 13 * 16 + 8, y: 9 * 16 },
    { sheet: 'sweaty_kid', frame: 'right_1', x: 22 * 16 + 8, y: 7 * 16 },
  ];
  // the Teeth draw over everything (an overhead sprite); keep them last
  sprites.sort((a, b) => (a.sheet === 'teeth') - (b.sheet === 'teeth'));
  return { title: `The risen Harbor (the Teeth, stage ${stage})`, ...L, sprites, scale: 2 };
}

function clockshop() {
  const W = 10, Hh = 8, L = grid(W, Hh);
  for (let y = 2; y < 7; y++) for (let x = 1; x < 9; x++) L.set('ground', x, y, 'shop:floor');
  for (let x = 0; x < W; x++) {
    const e = x === 0 ? '_w' : x === W - 1 ? '_e' : '';
    L.set('ground', x, 0, `interior:wall_upper${e}`);
    L.set('ground', x, 1, `interior:wall_lower${e}`);
    L.set('ground', x, 7, `interior:wall_south${e}`);
  }
  for (let y = 2; y < 7; y++) { L.set('ground', 0, y, 'interior:wall_side_w'); L.set('ground', 9, y, 'interior:wall_side_e'); }
  // the clocks: (1-2, 4-5, 7-8) on row 1, each a different time
  const clocks = ['clocks_a', 'clocks_b', 'clocks_c', 'clocks_d', 'clocks_e', 'clocks_f'];
  [1, 2, 4, 5, 7, 8].forEach((x, i) => L.set('objects', x, 1, `clockshop:${clocks[i]}`));
  L.set('objects', 1, 3, 'clockshop:bench_l'); L.set('objects', 2, 3, 'clockshop:bench_m'); L.set('objects', 3, 3, 'clockshop:bench_r');
  L.set('objects', 7, 5, 'clockshop:clapper');
  L.set('ground', 4, 7, 'clockshop:door_open_l'); L.set('ground', 5, 7, 'clockshop:door_open_r');
  const sprites = [{ sheet: 'clockmaker', frame: 'down_0', x: 2 * 16 + 8, y: 3 * 16 }];
  return { title: "The Clockmaker's Shop", ...L, sprites, hero: [5 * 16 + 8, 7 * 16, 'up'], scale: 3 };
}

function bilge(disc) {
  const S = A4('dry');
  const set = (layer, x, y, ref) => { S[layer][y][x] = ref; };
  if (disc) {
    set('objects', 25, 7, 'stair_rope:ring');
    for (let ty = 0; ty < 2; ty++) for (let tx = 0; tx < 2; tx++) set('ground', 26 + tx, 8 + ty, `bilge_door5:door_disc_x${tx}y${ty}`);
  } else {
    set('objects', 25, 7, 'stair_rope:ring_tied');
    set('objects', 25, 8, 'stair_rope:rope_edge');
    set('objects', 25, 9, 'stair_rope:rope_hull');
    set('objects', 25, 10, 'stair_rope:rope_foot');
    for (let ty = 0; ty < 2; ty++) for (let tx = 0; tx < 2; tx++) set('ground', 26 + tx, 8 + ty, `bilge_door5:door_open_x${tx}y${ty}`);
    set('objects', 26, 10, 'bilge_door5:spill_l'); set('objects', 27, 10, 'bilge_door5:spill_r');
  }
  return { ...S, title: disc ? 'The dry Bilge, Act 5 (the dim disc in the eye)' : 'The dry Bilge, Act 5 (rope tied, the door open)' };
}

function shop(guide) {
  const S = A2('shop');
  S.objects[5][7] = guide ? 'shop5:display_guide_l' : 'shop5:display_fallen_l';
  S.objects[5][8] = guide ? 'shop5:display_guide_r' : 'shop5:display_fallen_r';
  return { ...S, title: guide ? 'Shop: the guidebook in pride of place' : 'Shop: the window display fallen over' };
}

function square() {
  const S = A2('square');
  'abcdef'.split('').forEach((c, i) => { S.overhead[4][10 + i] = `banner:over_banner_${c}`; });
  S.objects[5][10] = 'banner:pole_foot_l'; S.objects[5][15] = 'banner:pole_foot_r';
  S.sprites = [...(S.sprites || []), { sheet: 'mayor', frame: 'gesture_down', x: 8 * 16 + 8, y: 6 * 16 - 9 }];
  return { ...S, title: 'Fountain Square: DRY CANAL DAY' };
}

function lamproom() {
  const W = 8, Hh = 8, L = grid(W, Hh);
  for (let y = 2; y < 7; y++) for (let x = 1; x < 7; x++) L.set('ground', x, y, 'lamproom:floor');
  for (let x = 0; x < W; x++) {
    L.set('ground', x, 0, 'lamproom:wall');
    L.set('ground', x, 1, x === 0 || x === W - 1 ? 'lamproom:wall' : 'lamproom:window');
    L.set('ground', x, 7, x === 3 || x === 4 ? 'lamproom:floor' : 'lamproom:wall');
  }
  for (let y = 2; y < 7; y++) { L.set('ground', 0, y, 'lamproom:wall'); L.set('ground', 7, y, 'lamproom:wall'); }
  for (let ty = 0; ty < 2; ty++) for (let tx = 0; tx < 2; tx++) L.set('objects', 3 + tx, 2 + ty, `lamproom:lamp_x${tx}y${ty}`);
  L.set('objects', 2, 5, 'lamproom:polish_tin');
  return { title: 'Lamp room (the lamp lit and turning)', ...L, sprites: [], hero: [3 * 16 + 8, 7 * 16, 'up'], scale: 3 };
}
