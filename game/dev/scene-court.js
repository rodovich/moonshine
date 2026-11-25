// Cistern Court (20 × 26), composed from the opening-slice sheets after the ASCII layout in
// docs/design/01-opening.md. SCENE(state) takes 'dusk' (default) or 'morning'.
// Layers: ground (opaque), objects (transparent, under characters), overhead (over characters).

const W = 20, H = 26;

export function SCENE(state = 'dusk') {
  const morning = state === 'morning';
  const moonrise = state === 'moonrise';   // Cheryl seated on the full tub's edge, under the night tint
  const blank = () => Array.from({ length: H }, () => Array(W).fill(null));
  const ground = blank(), objects = blank(), overhead = blank();
  const set = (layer, x, y, ref) => { layer[y][x] = ref; };

  // ---------------- Roof level (rows 0–9) ----------------
  // roof floor: a 2x2 macro-tile, like the street paving, with one patch and one crack
  const floor = (x, y) => `roof:roof_floor_${y % 2 ? 's' : 'n'}${x % 2 ? 'e' : 'w'}`;
  for (let y = 2; y <= 8; y++) for (let x = 1; x <= 18; x++) ground[y][x] = floor(x, y);
  set(ground, 5, 2, 'roof:roof_floor_ne_patch');      // (5,2): x odd, y even
  set(ground, 6, 7, 'roof:roof_floor_sw_cracked');    // (6,7): x even, y odd
  set(ground, 16, 3, 'roof:roof_floor_sw_cracked');
  // backdrop: higher houses and the Crown's lower walls
  const back = ['backdrop_house', 'backdrop_house_window', 'backdrop_eave', 'backdrop_eave', 'backdrop_crown', 'backdrop_crown',
    'backdrop_crown_buttress', 'backdrop_crown', 'backdrop_crown', 'backdrop_crown', 'backdrop_crown_buttress', 'backdrop_crown',
    'backdrop_crown', 'backdrop_eave', 'backdrop_eave', 'backdrop_house_window', 'backdrop_house', 'backdrop_house_window', 'backdrop_eave', 'backdrop_eave'];
  back.forEach((f, x) => set(ground, x, 0, `roof:${f}`));
  for (let x = 0; x < W; x++) set(ground, x, 1, 'roof:parapet_n');
  set(ground, 0, 1, 'roof:parapet_nw'); set(ground, 19, 1, 'roof:parapet_ne');
  for (let y = 2; y <= 8; y++) { set(ground, 0, y, 'roof:parapet_w'); set(ground, 19, y, 'roof:parapet_e'); }
  for (let x = 0; x < W; x++) set(ground, x, 9, 'roof:roof_edge_s');
  set(ground, 0, 9, 'roof:roof_edge_sw'); set(ground, 19, 9, 'roof:roof_edge_se');
  // the low dividing wall at x9, with its one-step gap at y5
  for (const y of [2, 3, 7, 8]) set(ground, 9, y, 'roof:lowwall');
  set(ground, 9, 4, 'roof:lowwall_end_s'); set(ground, 9, 5, 'roof:lowwall_gap'); set(ground, 9, 6, 'roof:lowwall_end_n');
  // chimney stack (7–8, 2), its pots and hats overhead
  set(ground, 7, 2, 'roof:chimney_l'); set(ground, 8, 2, 'roof:chimney_r');
  set(overhead, 7, 1, 'roof:over_chimney_l'); set(overhead, 8, 1, 'roof:over_chimney_r');
  // herbs, tub, tap, chairs
  set(objects, 1, 2, 'roof_props:herb_basil'); set(objects, 2, 2, 'roof_props:herb_rosemary');
  const tub = moonrise ? 'tub_full' : 'tub_empty';
  set(objects, 3, 4, `tub:${tub}_l`); set(objects, 4, 4, `tub:${tub}_r`);
  set(objects, 2, 4, 'tub:tap');
  set(objects, 2, 7, moonrise ? 'roof_props:chair_cardigan' : 'roof_props:chair_fold'); set(objects, 3, 7, 'roof_props:chair_fold');
  // clotheslines: posts at y3 and y7 on x12 and x15
  for (const x of [12, 15]) {
    set(objects, x, 3, 'laundry:post'); set(objects, x, 7, 'laundry:post');
    set(overhead, x, 2, 'laundry:over_post_top_line'); set(overhead, x, 3, 'laundry:over_line');
    if (morning) {
      set(overhead, x, 4, 'laundry:over_line'); set(overhead, x, 5, 'laundry:over_line'); set(overhead, x, 6, 'laundry:over_line_s');
    } else {
      set(overhead, x, 4, 'laundry:over_sheet_n'); set(overhead, x, 5, 'laundry:over_sheet_m'); set(overhead, x, 6, 'laundry:over_sheet_s');
    }
  }
  // the back line from hook (11,1) to hook (18,1)
  'abcdefgh'.split('').forEach((c, i) => {
    const s = morning ? `laundry:backline_swung_${c}` : `laundry:backline_sag_${c}`;
    const alt = morning ? '@grey' : '';
    if (morning) { set(objects, 11 + i, 1, `laundry:backline_sheets_${c}_n${alt}`); set(objects, 11 + i, 2, `laundry:backline_sheets_${c}_s${alt}`); }
    else { set(objects, 11 + i, 1, `${s}_n`); set(objects, 11 + i, 2, `${s}_s`); }
  });

  // ---------------- Facades (rows 10–11) and the stair at x7 ----------------
  const cheryl = ['wall_l', 'window_box', 'wall', 'door_top', 'wall', 'window', 'wall_r'];
  const cherylBase = ['wall_base_l', 'wall_base', 'wall_base', 'door_bot', 'wall_base', 'wall_base', 'wall_base_r'];
  // The facades take the dimmer 'facade' plaster so the drop below the roof's coping reads.
  // At dusk a few windows are lit (the _lit swaps put warm glass in them).
  const litC = morning ? [] : [5], litN = morning ? [] : [3, 8];
  cheryl.forEach((f, x) => {
    const pal = litC.includes(x) ? 'facade_lit' : 'facade';
    set(ground, x, 10, f.startsWith('door') ? `facade:${f}@dim` : `buildings:${f}@${pal}`);
    set(ground, x, 11, cherylBase[x].startsWith('door') ? `facade:${cherylBase[x]}@dim` : `buildings:${cherylBase[x]}@facade`);
  });
  const nb = ['wall_l', 'wall', 'wall', 'window', 'wall', 'window_box', 'door_top', 'wall', 'window', 'wall', 'window_box', 'wall_r'];
  const nbBase = ['wall_base_l', 'wall_base', 'wall_base', 'wall_base', 'wall_base', 'wall_base', 'door_bot', 'wall_base', 'wall_base', 'wall_base', 'wall_base', 'wall_base_r'];
  nb.forEach((f, i) => {
    const x = 8 + i;
    const pal = litN.includes(i) ? 'facade_sage_lit' : 'facade_sage';
    set(ground, x, 10, f.startsWith('door') ? 'facade:door_top@sage_dim' : `buildings:${f}@${pal}`);
    set(ground, x, 11, nbBase[i].startsWith('door') ? 'facade:door_bot@sage_dim' : `buildings:${nbBase[i]}@facade_sage`);
  });
  set(ground, 7, 8, 'court:stair_head'); set(ground, 7, 9, 'court:stair_cut');
  set(ground, 7, 10, 'court:stair'); set(ground, 7, 11, 'court:stair');

  // ---------------- The court (rows 12–23) ----------------
  // cobble variants all share their tile-edge stones, so any mix works; pick by a hash so no pattern shows
  const cob = 'abcde'.split('').map(v => `court:cobble_${v}`);
  const hash = (x, y) => ((((x * 73856093) ^ (y * 19349663)) >>> 0) % 9973);
  for (let y = 12; y <= 23; y++) for (let x = 1; x <= 18; x++) ground[y][x] = cob[hash(x, y) % cob.length];
  set(ground, 7, 12, 'court:stair_foot');
  for (let y = 12; y <= 23; y++) { set(ground, 0, y, 'court:court_wall_w'); set(ground, 19, y, 'court:court_wall_e'); }
  set(ground, 0, 19, 'court:gate_w');
  set(ground, 6, 20, 'court:cobble_drain');
  // lemon tree at (3,14): trunk on the objects layer, canopy overhead over 2–4 × 13–15
  set(objects, 3, 14, 'court_tree:lemon_trunk');
  const canopy = [['nw', 'n', 'ne'], ['w', 'c', 'e'], ['sw', 's', 'se']];
  canopy.forEach((row, j) => row.forEach((p, i) => set(overhead, 2 + i, 13 + j, `court_tree:over_lemon_${p}`)));
  // chess: stool (2,16) under the Old Man, table (3,16), Gerald's chair (4,16)
  set(objects, 2, 16, 'court_props:stool');
  set(objects, 3, 16, morning ? 'court_props:chess_slid' : 'court_props:chess_plug');
  set(objects, 4, 16, 'court_props:gerald_chair');
  // the well, 2×2 at (9–10, 16–17)
  set(objects, 9, 16, 'court_well:well_nw'); set(objects, 10, 16, 'court_well:well_ne');
  set(objects, 9, 17, 'court_well:well_sw'); set(objects, 10, 17, 'court_well:well_se');
  // flowerpots and the hurdle (12–14, 17)
  if (morning) {
    set(objects, 12, 17, 'court_tree:flowerpot'); set(objects, 14, 17, 'court_tree:flowerpot_kicked');
  } else {
    set(objects, 12, 17, 'court_tree:hurdle_l'); set(objects, 13, 17, 'court_tree:hurdle_m'); set(objects, 14, 17, 'court_tree:hurdle_r');
  }
  // bench (16–17, 12)
  set(objects, 16, 12, 'court_props:bench_l'); set(objects, 17, 12, 'court_props:bench_r');
  // geraniums
  for (const [x, y] of [[1, 21], [18, 21], [1, 23], [2, 23], [18, 23]]) set(objects, x, y, 'props:pot_geranium');
  // lower rooftops (rows 24–25), and the Squeeze at x15–16
  const lowTop = ['flat_edge_l', 'flat_edge', 'flat_edge', 'flat_edge_r', 'tiles_edge_l', 'tiles_edge', 'tiles_edge', 'tiles_edge', 'tiles_edge_r',
    'flat_edge_l', 'flat_edge', 'flat_edge', 'flat_edge', 'flat_edge_r', 'flat_edge_l', null, null, 'tiles_edge_l', 'tiles_edge', 'tiles_edge_r'];
  const low = ['flat_l', 'flat', 'flat_basin', 'flat_r', 'tiles_l', 'tiles', 'tiles', 'tiles', 'tiles_r',
    'flat_l', 'flat', 'flat_basin', 'flat', 'flat_r', 'flat_l', null, null, 'tiles_l', 'tiles', 'tiles_r'];
  lowTop.forEach((f, x) => f && set(ground, x, 24, `court:low_${f}`));
  low.forEach((f, x) => f && set(ground, x, 25, `court:low_${f}`));
  const sq = morning ? '_scraped' : '';
  set(ground, 15, 24, `court:squeeze_top_l${sq}`); set(ground, 16, 24, `court:squeeze_top_r${sq}`);
  set(ground, 15, 25, `court:squeeze_l${sq}`); set(ground, 16, 25, `court:squeeze_r${sq}`);
  if (!morning) {
    set(objects, 15, 23, 'court_props:piano_nw'); set(objects, 16, 23, 'court_props:piano_ne');
    set(objects, 15, 24, 'court_props:piano_sw'); set(objects, 16, 24, 'court_props:piano_se');
    // the top half of the piano is overhead: anyone north of it stands behind it
    set(overhead, 15, 23, 'court_props:over_piano_nw'); set(overhead, 16, 23, 'court_props:over_piano_ne');
    set(objects, 15, 23, null); set(objects, 16, 23, null);
  }

  const px = (x, y) => [x * 16 + 8, y * 16 + 16];
  const sprites = [];
  const at = (sheet, frame, [x, y], extra = {}) => sprites.push({ sheet, frame, x, y, ...extra });
  at('old_man_seated', 'think_right', px(2, 16));
  if (morning) {
    at('neighbor', 'up_0', px(14, 3));
    at('sweaty_kid', 'jog_down', px(15, 22));
  } else {
    at('neighbor', 'smooth_left', px(17, 5));
    at('sweaty_kid', 'jog_down', px(13, 15));
  }
  // the moonrise: Cheryl, in her bathing costume, sits on the tub's west-end rim, facing east, shins
  // in the water, her cardigan folded on the chair. She stands on (3,5) and the content draws her
  // sit_tub_right frame 2 px west and 25 px up (offset [-2, -25]), so her back hangs just outside
  // the tub's west end.
  if (moonrise) at('cheryl_swim', 'sit_tub_right', [3 * 16 + 8 - 2, 5 * 16 + 16 - 25]);
  // the Pelletiers' cat, sitting: by their gate side of the court at dusk, by the bench in the morning
  at('props', 'cat', morning ? px(12, 12) : px(17, 19));

  return {
    title: `Cistern Court — ${morning ? 'morning' : 'dusk'}`,
    ground, objects, overhead, sprites,
    tint: morning ? 'day' : moonrise ? 'night' : 'dusk',
    hero: moonrise ? null : [3 * 16 + 8, 6 * 16 + 16, 'right'],
    scale: 2,
  };
}
