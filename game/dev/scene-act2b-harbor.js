// Act 2 part 2 (docs/design/02-city.md), laid out as the design's maps, for judging the art in
// place. ?state=harbor (default): the Harbor at its normal sea level. ?state=bilge: the wet
// Bilge with the fish stalls (ankle-deep south quay at x0-5).

export function SCENE(state = 'harbor') {
  return state === 'bilge' ? bilge() : harbor();
}

function grid(W, H) {
  const blank = () => Array.from({ length: H }, () => Array(W).fill(null));
  const L = { ground: blank(), objects: blank(), overhead: blank() };
  L.set = (layer, x, y, ref) => { if (x >= 0 && x < W && y >= 0 && y < H) L[layer][y][x] = ref; };
  L.add = (layer, x, y, ref) => { const cur = L[layer][y] && L[layer][y][x]; L.set(layer, x, y, cur ? `${cur}+${ref}` : ref); };
  return L;
}
const pave = (x, y) => `street:pave_${y % 2 ? 's' : 'n'}${x % 2 ? 'e' : 'w'}`;
const cliff = (x, y) => `headland:cliff_${y % 2 ? 's' : 'n'}${x % 2 ? 'e' : 'w'}`;

function harbor() {
  const W = 32, H = 14, L = grid(W, H);
  // rows 0-3: the Prow's rock behind everything ('~'), the Goat stair (2-3), houses (5-22), the lighthouse (26-29)
  for (let y = 0; y < 4; y++) for (let x = 0; x < W; x++) L.set('ground', x, y, y === 3 ? `headland:cliff_foot_${x % 2 ? 'b' : 'a'}` : cliff(x, y));
  L.set('ground', 24, 1, 'headland:cliff_gull'); L.set('ground', 0, 1, 'headland:cliff_gull');
  for (let y = 0; y < 4; y++) for (let x = 0; x < 2; x++) L.set('ground', 2 + x, y, `headland:goatstair_x${x}y${y}`);
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
  // row 9: the quay edge over the water, and the Keyhole (30-31)
  for (let x = 0; x < 30; x++) L.set('ground', x, 9, `harbor_quay:quay_${x % 2 ? 'b' : 'a'}`);
  L.set('ground', 30, 9, 'harbor_quay:keyhole_l'); L.set('ground', 31, 9, 'harbor_quay:keyhole_r');
  // rows 10-13: the Bowl at its normal height
  for (let y = 10; y < H; y++) for (let x = 0; x < W; x++) L.set('ground', x, y, `sea:sea_${y % 2 ? 's' : 'n'}${x % 2 ? 'e' : 'w'}`);
  // props: bollards, crates and nets
  L.set('objects', 8, 8, 'harbor_props:bollard'); L.set('objects', 18, 8, 'harbor_props:bollard');
  L.set('objects', 5, 4, 'props:crate'); L.set('objects', 6, 4, 'props:crate'); L.set('objects', 20, 4, 'harbor_props:nets');
  const sprites = [
    { sheet: 'ferry_level', frame: 'persistence_level', x: 8 * 16, y: 8 * 16, topLeft: true },
    { sheet: 'mott', frame: 'sit_down', x: 13 * 16 + 8, y: 9 * 16 - 8 },
  ];
  return { title: 'The Harbor (Act 2, normal sea level)', ...L, sprites, scale: 2 };
}

function bilge() {
  const W = 32, H = 16, L = grid(W, H);
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) L.set('ground', x, y, pave(x, y));
  for (let x = 0; x < W; x++) {
    if (x === 11 || x === 12) continue;
    L.set('ground', x, 0, `rooftiles:${x % 5 === 0 ? 'ridge' : 'tiles'}`);
    L.set('ground', x, 1, `rooftiles:${x % 7 === 3 ? 'tiles_moss' : 'tiles'}`);
    L.set('ground', x, 2, `buildings:${x % 3 === 1 ? 'window' : 'wall'}@ochre`);
    L.set('ground', x, 3, `buildings:${x % 3 === 1 ? 'door_bot' : 'wall_base'}@ochre`);
    L.set('ground', x, 14, `rooftiles:${x % 6 === 2 ? 'ridge' : 'tiles'}`);
    L.set('ground', x, 15, 'rooftiles:tiles');
  }
  for (const x of [1, 4, 7, 16, 19, 22, 25, 28]) { L.set('ground', x, 2, 'buildings:door_top@ochre'); L.set('ground', x, 3, 'buildings:door_bot@ochre'); }
  // the canal (rows 7-10), the stepped bridge (12-13), the Water Stairs going under (22-25)
  for (let x = 0; x < W; x++) {
    L.set('ground', x, 7, 'canal:bank_n'); L.set('ground', x, 8, 'canal:water'); L.set('ground', x, 9, 'canal:water'); L.set('ground', x, 10, 'canal:bank_s');
  }
  ['n', 'down', 'up', 's'].forEach((p, i) => { L.set('ground', 12, 7 + i, `canal:bridge_${p}_l`); L.set('ground', 13, 7 + i, `canal:bridge_${p}_r`); });
  L.set('ground', 14, 8, 'canal:water_shadow'); L.set('ground', 14, 9, 'canal:water_shadow');
  [22, 23, 24, 25].forEach((x, i) => {
    const k = i === 0 ? 'l' : i === 3 ? 'r' : 'm';
    L.set('ground', x, 6, `reveal:wstairs_top_${k}`); L.set('ground', x, 7, `bilge_flood:wstairs_wet_${k}`);
  });
  // the south quay's west end, ankle-deep (x0-5, y11-12)
  for (const y of [11, 12]) for (let x = 0; x <= 5; x++) L.set('ground', x, y, `bilge_flood:flood1_${y % 2 ? 's' : 'n'}${x % 2 ? 'e' : 'w'}`);
  for (const y of [11, 12]) L.add('objects', 6, y, 'bilge_flood:flood1_lap_w');
  for (let x = 0; x <= 5; x++) L.add('objects', x, 13, 'bilge_flood:flood1_lap_n');
  // the fish stalls (2-3, 5-6, 8-9 on row 5): tables with the catch, canopies overhead on row 4
  [[2, null], [5, 'blue'], [8, 'green']].forEach(([x, pal]) => {
    const p = pal ? `@${pal}` : '';
    L.set('objects', x, 5, 'fish_stall:stall_l'); L.set('objects', x + 1, 5, 'fish_stall:stall_r');
    L.set('overhead', x, 4, `fish_stall:over_stall_l${p}`); L.set('overhead', x + 1, 4, `fish_stall:over_stall_r${p}`);
  });
  for (const x of [4, 17, 28]) L.add('objects', x, 6, 'canal:mooring_post');
  const sprites = [
    { sheet: 'fishmonger', frame: 'down_0', x: 5 * 16 + 8, y: 5 * 16 },
    { sheet: 'boatman', frame: 'rock', x: 15 * 16, y: 10 * 16 },
    { sheet: 'props', frame: 'cat', x: 20 * 16 + 8, y: 5 * 16 },
  ];
  return { title: 'The Bilge (Act 2): fish stalls', ...L, sprites, scale: 2 };
}
