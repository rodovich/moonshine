// Act 4 surface maps (docs/design/04-the-list.md), laid out roughly as the design's maps, for
// judging the art in place. ?state=belfry (default) | square | bilge1 | bilge2 | dry | cellar

export function SCENE(state) {
  switch (state) {
    case 'square': return square();
    case 'bilge1': return bilge(1);
    case 'bilge2': return bilge(2);
    case 'dry': return bilge(0);
    case 'cellar': return cellar();
    default: return belfry();
  }
}

function grid(W, H, fill) {
  const blank = () => Array.from({ length: H }, () => Array(W).fill(null));
  const L = { ground: blank(), objects: blank(), overhead: blank(), W, H };
  L.set = (layer, x, y, ref) => { if (x >= 0 && x < W && y >= 0 && y < H) L[layer][y][x] = ref; };
  L.add = (layer, x, y, ref) => { const cur = L[layer][y] && L[layer][y][x]; L.set(layer, x, y, cur ? `${cur}+${ref}` : ref); };
  if (fill) for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) L.set('ground', x, y, fill(x, y));
  return L;
}
const pave = (x, y) => `street:pave_${y % 2 ? 's' : 'n'}${x % 2 ? 'e' : 'w'}`;
const hash = (x, y) => (x * 73 + y * 151) % 997;
const pick = (arr, x, y) => arr[hash(x, y) % arr.length];
const done = (L, title, sprites, extra) => ({ title, ground: L.ground, objects: L.objects, overhead: L.overhead, sprites: sprites || [], scale: 2, ...extra });

// ------------------------------------------------------------------------------------
// The Bilge (32 x 16). stage 1, stage 2, or 0 = the dry reveal.
// ------------------------------------------------------------------------------------
function bilge(stage) {
  const L = grid(32, 16, pave);
  // rooftops of the houses above (north) and below (south)
  for (let x = 0; x < 32; x++) {
    if (x === 11 || x === 12) continue;
    L.set('ground', x, 0, `rooftiles:${x % 5 === 0 ? 'ridge' : 'tiles'}`);
    L.set('ground', x, 1, `rooftiles:${x % 7 === 3 ? 'tiles_moss' : 'tiles'}`);
    L.set('ground', x, 2, `buildings:${x % 3 === 1 ? 'window' : 'wall'}@ochre`);
    L.set('ground', x, 3, `buildings:${x % 3 === 1 ? 'door_bot' : 'wall_base'}@ochre`);
    L.set('ground', x, 14, `rooftiles:${x % 6 === 2 ? 'ridge' : 'tiles'}`);
    L.set('ground', x, 15, 'rooftiles:tiles');
  }
  for (const x of [1, 4, 7, 16, 19, 22, 25, 28]) { L.set('ground', x, 2, 'buildings:door_top@ochre'); L.set('ground', x, 3, 'buildings:door_bot@ochre'); }
  const sprites = [];
  if (stage === 0) {
    // the canal rows become a deep, dry trench
    for (let x = 0; x < 32; x++) {
      if (x === 12 || x === 13) continue;
      L.set('ground', x, 7, `act4_reveal:${pick(['qwall_a', 'qwall_b', 'qwall_c'], x, 7)}`.replace('act4_reveal', 'reveal'));
      L.set('ground', x, 8, `reveal:${pick(['hull_a', 'hull_b', 'hull_c', 'hull_d'], x, 8)}`);
      L.set('ground', x, 9, `reveal:${pick(['mud_a', 'mud_b', 'mud_c', 'mud_d', 'mud_a', 'mud_puddle_a', 'mud_b', 'mud_puddle_b'], x, 9)}`);
      L.set('ground', x, 10, `reveal:${pick(['lip_a', 'lip_b'], x, 10)}`);
    }
    // the bridge stays, casting its shadow on the trench to the east
    ['n', 'down', 'up', 's'].forEach((p, i) => { L.set('ground', 12, 7 + i, `canal:bridge_${p}_l`); L.set('ground', 13, 7 + i, `canal:bridge_${p}_r`); });
    L.set('ground', 14, 7, 'reveal:qwall_bridge_shadow'); L.set('ground', 14, 8, 'reveal:hull_bridge_shadow'); L.set('ground', 14, 9, 'reveal:mud_bridge_shadow');
    // the Water Stairs, extended down to a broken last flight
    [22, 23, 24, 25].forEach((x, i) => {
      const k = i === 0 ? 'l' : i === 3 ? 'r' : 'm';
      L.set('ground', x, 6, `reveal:wstairs_top_${k}`);
      L.set('ground', x, 7, `reveal:wstairs_${k}`);
      L.set('ground', x, 8, `reveal:wstairs_broken_${k}`);
    });
    // the bronze door in the canal wall at the foot of the stairs
    for (let dy = 0; dy < 2; dy++) for (let dx = 0; dx < 2; dx++) L.set('ground', 26 + dx, 7 + dy, `reveal_door:bronze_door_x${dx}y${dy}`);
    // taut mooring ropes from the north quay's posts down to the boats
    L.set('objects', 4, 7, 'reveal:rope_taut_v'); L.set('objects', 4, 8, 'reveal:rope_taut_v');
    L.set('objects', 17, 7, 'reveal:rope_taut_se'); L.set('objects', 18, 8, 'reveal:rope_taut_se');
    // wet quays with stranded fish
    for (let x = 0; x < 32; x++) for (const y of [4, 5, 6, 11, 12, 13]) if (hash(x, y) % 5 === 0) L.set('ground', x, y, `bilge_flood:wet_${y % 2 ? 's' : 'n'}${x % 2 ? 'e' : 'w'}`);
    L.set('objects', 10, 5, 'bilge_flood:fish_stranded_a'); L.set('objects', 6, 12, 'bilge_flood:fish_stranded_b'); L.set('objects', 27, 11, 'bilge_flood:fish_stranded_a');
    sprites.push({ sheet: 'bilge_boats', frame: 'boat_side_a', x: 4 * 16, y: 10 * 16 });
    sprites.push({ sheet: 'bilge_boats', frame: 'boat_side_b', x: 9 * 16, y: 10 * 16 });
    sprites.push({ sheet: 'bilge_boats', frame: 'boat_side_a', x: 20 * 16, y: 10 * 16 });
    sprites.push({ sheet: 'bilge_boats', frame: 'boat_upright', x: 23 * 16, y: 10 * 16 });
    sprites.push({ sheet: 'bilge_piano', frame: 'piano_mud', x: 16 * 16, y: 10 * 16 });
  } else {
    // the canal (rows 7-10) with the bridge and the Water Stairs going under
    for (let x = 0; x < 32; x++) {
      L.set('ground', x, 7, 'canal:bank_n'); L.set('ground', x, 8, 'canal:water'); L.set('ground', x, 9, 'canal:water'); L.set('ground', x, 10, 'canal:bank_s');
    }
    ['n', 'down', 'up', 's'].forEach((p, i) => { L.set('ground', 12, 7 + i, `canal:bridge_${p}_l`); L.set('ground', 13, 7 + i, `canal:bridge_${p}_r`); });
    L.set('ground', 14, 8, 'canal:water_shadow'); L.set('ground', 14, 9, 'canal:water_shadow');
    [22, 23, 24, 25].forEach((x, i) => {
      const k = i === 0 ? 'l' : i === 3 ? 'r' : 'm';
      L.set('ground', x, 6, `reveal:wstairs_top_${k}`); L.set('ground', x, 7, `bilge_flood:wstairs_wet_${k}`);
    });
    // floods: stage 1 = south quay x0-5 (y11-12) and north quay x0-1 (y4-6); stage 2 = south quay all, north quay x0-9
    const fl = stage === 1 ? 'flood1' : 'flood2';
    const flooded = (x, y) => stage === 1
      ? ((y === 11 || y === 12) && x <= 5) || (y >= 4 && y <= 6 && x <= 1)
      : (y >= 11 && y <= 13) || (y >= 4 && y <= 6 && x <= 9);
    for (let y = 4; y <= 13; y++) for (let x = 0; x < 32; x++) {
      if (y >= 7 && y <= 10) continue;
      if (flooded(x, y)) L.set('ground', x, y, `bilge_flood:${fl}_${y % 2 ? 's' : 'n'}${x % 2 ? 'e' : 'w'}`);
      else {
        // water lapping onto the dry paving next to a flooded tile
        if (flooded(x - 1, y)) L.add('objects', x, y, `bilge_flood:${fl}_lap_w`);
        if (flooded(x, y - 1) && !(y - 1 >= 7 && y - 1 <= 10)) L.add('objects', x, y, `bilge_flood:${fl}_lap_n`);
        if (flooded(x, y + 1) && !(y + 1 >= 7 && y + 1 <= 10)) L.add('objects', x, y, `bilge_flood:${fl}_lap_s`);
      }
    }
    sprites.push({ sheet: 'bilge_piano', frame: stage === 1 ? 'piano_halfsunk' : 'piano_lid', x: 7 * 16, y: 10 * 16 });
  }
  // fish stalls and mooring posts on the north quay
  for (const x of [2, 5, 8]) L.set('objects', x, 5, 'props:crate');
  for (const x of [4, 17, 28]) L.add('objects', x, 6, 'canal:mooring_post');
  return done(L, stage === 0 ? 'The Bilge, dry: the reveal' : `The Bilge, flood stage ${stage}`, sprites, { tint: null });
}

// ------------------------------------------------------------------------------------
// Belfry (10 x 10), inside the Bell Tower.
// ------------------------------------------------------------------------------------
function belfry() {
  const L = grid(10, 10, (x, y) => `belfry:floor_${'abc'[hash(x, y) % 3]}`);
  for (let x = 0; x < 10; x++) {
    L.set('ground', x, 0, 'belfry:wall_upper');
    L.set('ground', x, 1, [1, 3, 6, 8].includes(x) ? 'belfry:opening' : 'belfry:wall_lower');
    L.set('ground', x, 9, 'belfry:wall_south');
  }
  for (let y = 2; y < 9; y++) { L.set('ground', 0, y, 'belfry:wall_side'); L.set('ground', 9, y, 'belfry:wall_side'); }
  L.set('ground', 4, 5, 'belfry:floor_hole');
  L.set('ground', 1, 8, 'belfry:stair_l'); L.set('ground', 2, 8, 'belfry:stair_r');
  // the great bell overhead (3-4, 2-3)
  for (let dy = 0; dy < 2; dy++) for (let dx = 0; dx < 2; dx++) L.set('overhead', 3 + dx, 2 + dy, `belfry_bell:over_bell_x${dx}y${dy}_0`);
  // the Clockmaker's drive (6-7, 3-4), ticking
  for (let dy = 0; dy < 2; dy++) for (let dx = 0; dx < 2; dx++) L.set('objects', 6 + dx, 3 + dy, `belfry_props:drive_x${dx}y${dy}`);
  L.set('objects', 8, 4, 'belfry_props:lever_up');
  L.set('objects', 1, 6, 'belfry_props:bench_l'); L.set('objects', 2, 6, 'belfry_props:bench_r');
  const sprites = [{ sheet: 'belfry_rope', frame: 'rope_still', x: 4 * 16 + 8, y: 6 * 16 }];
  return done(L, 'Belfry', sprites, { hero: [5 * 16 + 8, 8 * 16, 'up'], scale: 3 });
}

// ------------------------------------------------------------------------------------
// Fountain Square, Act 4 (the part around the Fountain): the dry basin with coins and buttons,
// the bronze ring hatch, the cordon with its sign.
// ------------------------------------------------------------------------------------
function square() {
  const L = grid(16, 13, pave);
  // the fountain basin at (10-13, 7-10), its bronze fish at (11-12, 7)
  for (let dy = 0; dy < 4; dy++) for (let dx = 0; dx < 4; dx++) L.set('objects', 10 + dx, 7 + dy, `square4:fountain_coins_closed_x${dx}y${dy}`);
  // the cordon: posts at the corners (9,6), (14,6), (9,11), (14,11), rope between, the sign on the south rope
  for (const [x, y] of [[9, 6], [14, 6], [9, 11], [14, 11]]) L.set('objects', x, y, 'square4:cordon_post');
  for (let x = 10; x <= 13; x++) { L.set('objects', x, 6, 'square4:cordon_rope_h'); L.set('objects', x, 11, x === 11 ? 'square4:cordon_rope_sign' : 'square4:cordon_rope_h'); }
  for (let y = 7; y <= 10; y++) { L.add('objects', 9, y, 'square4:cordon_rope_v'); L.add('objects', 14, y, 'square4:cordon_rope_v'); }
  L.set('objects', 8, 11, 'square_props:mayor_crate');
  const sprites = [{ sheet: 'fish', frame: 'fish_dry', x: 12 * 16, y: 8 * 16 + 4 }];
  // a second basin, hatch open, alongside for comparison
  for (let dy = 0; dy < 4; dy++) for (let dx = 0; dx < 4; dx++) L.set('objects', 1 + dx, 7 + dy, `square4:fountain_coins_open_x${dx}y${dy}`);
  return done(L, 'Fountain Square, Act 4 (left: hatch open; right: closed, cordoned)', sprites, { hero: [7 * 16 + 8, 12 * 16, 'up'], scale: 3 });
}

// ------------------------------------------------------------------------------------
// Ice Cellar (10 x 8), under the Fishmonger's house.
// ------------------------------------------------------------------------------------
function cellar() {
  const L = grid(10, 8, (x, y) => `ice_cellar:floor_${'abc'[hash(x, y) % 3]}`);
  for (let x = 0; x < 10; x++) { L.set('ground', x, 0, 'ice_cellar:wall_upper'); L.set('ground', x, 1, 'ice_cellar:wall_lower'); L.set('ground', x, 7, 'ice_cellar:wall_south'); }
  for (let y = 2; y < 7; y++) { L.set('ground', 0, y, 'ice_cellar:wall_side'); L.set('ground', 9, y, 'ice_cellar:wall_side'); }
  // the stair up (6-7, 1) to the door in the north wall
  L.set('ground', 6, 0, 'ice_cellar:stair_top_l'); L.set('ground', 7, 0, 'ice_cellar:stair_top_r');
  L.set('ground', 6, 1, 'ice_cellar:stair_l'); L.set('ground', 7, 1, 'ice_cellar:stair_r');
  // hanging fish on the wall (1-3 and 8 on row 1), shown on the upper row
  for (const x of [1, 2, 3, 8]) L.set('objects', x, 0, 'ice_cellar_props:fish_hanging');
  // ice blocks in sawdust (1-2, 3-4) and (7-8, 3-4); crates (8, 4)... the map puts crates at (8,4)
  for (let dy = 0; dy < 2; dy++) for (let dx = 0; dx < 2; dx++) { L.set('objects', 1 + dx, 3 + dy, `ice_cellar_props:ice_x${dx}y${dy}`); L.set('objects', 6 + dx, 3 + dy, `ice_cellar_props:ice_x${dx}y${dy}`); }
  L.set('objects', 8, 4, 'ice_cellar_props:crate_fish');
  L.set('ground', 2, 6, 'ice_cellar:hatch_open');
  return done(L, 'Ice Cellar', [], { hero: [2 * 16 + 8, 6 * 16 + 14, 'up'], scale: 3 });
}
