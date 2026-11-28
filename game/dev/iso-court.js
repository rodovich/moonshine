// A hand-composed isometric Cistern Court for the art dev page: it shows how
// the art kit fits together (heights, wall stacks, roofs, props, people) at
// dusk on Moonshine Night. The engine's converter builds the real one from the
// map; this is the art task's reference for it.
//
// Projection: tile (x, y) centered at world (x + 0.5, y + 0.5);
// screen x = (wx − wy)·32, screen y = (wx + wy)·16 − z (z in px).

export const W = 20, H = 26;
export const DECK = 120; // the roof terraces, 3 m above the court
export const STOREY = 96; // the facades' first storey (to the pent roof)
export const LOW = -120; // the roofs of the houses below the court

/**
 * Build the court's drawables. Each is { s: sheet, f: frame, x, y, z, fw, fd, layer }
 * at the footprint's center (x, y in tiles) and base height z (px). `state`
 * picks dusk or morning details.
 */
export function court(state = {}) {
  const morning = !!state.morning;
  const out = [];
  const add = (s, f, x, y, z = 0, fw = 1, fd = 1, layer = 1) => out.push({ s, f, x: x + fw / 2, y: y + fd / 2, z, fw, fd, x0: x, y0: y, layer });
  const C = 'cistern';
  /** A column at (x, y): faces stacked from z0, top floor at the end. */
  const column = (x, y, z0, sFaces, eFaces, top) => {
    let z = z0;
    for (const f of sFaces) { add(C, f[0] + '', x, y, z, 1, 1, 0.1); z += f[1]; }
    z = z0;
    for (const f of eFaces) { add(C, f[0] + '', x, y, z, 1, 1, 0.1); z += f[1]; }
    if (top) add(C, top[0], x, y, top[1], 1, 1, 0.2);
  };

  // ---- Backdrop (row 0): the Crown's lower walls in the middle, higher houses either side.
  for (let x = 0; x < W; x++) {
    const crown = x >= 4 && x <= 12;
    const faces = crown ? [['crown_s' + (x === 6 || x === 10 ? '_buttress' : ''), 160]] : [[x % 3 === 1 ? 'house_s_window_' + (x > 12 ? 'rose' : 'blue') : 'house_s_plain', 120]];
    const top = crown ? DECK + 160 : DECK + 120;
    column(x, 0, DECK, faces, x === W - 1 ? [['house_e_plain', 120]] : [], ['roof_top', top]);
  }

  // ---- The houses (rows 1–11), roof terraces on top (rows 1–9), pent roofs over rows 10–11.
  const cheryl = { 1: 'window_box', 3: 'door', 5: 'window' };
  const nb = { 11: 'window', 13: 'window_box', 14: 'door', 16: 'window', 18: 'window_box' };
  for (let x = 0; x < W; x++) {
    for (let y = 1; y <= 11; y++) {
      if (x === 7 && y >= 9) continue; // the stair cuts through
      const front = y === 11;
      const roofRow = y <= 9;
      const h = roofRow ? DECK : STOREY;
      let s = [];
      if (front) {
        const blue = x < 7;
        const k = blue ? cheryl[x] : nb[x];
        s = [[k ? `facade_s_${k}_${blue ? 'blue' : 'green'}` : 'facade_s_plain', STOREY]];
      }
      let e = [];
      if (x === W - 1 || x === 6) e = roofRow ? [['facade_e_plain', STOREY], ['course24_e', 24]] : [['facade_e_plain', STOREY]];
      column(x, y, 0, s, e, roofRow ? [deckFloor(x, y), DECK] : null);
    }
    if (x !== 7) add(C, 'pent_roof', x, 10, STOREY, 1, 2, 1);
  }
  // Parapets.
  for (let x = 0; x < W; x++) add(C, x === 0 || x === W - 1 ? 'parapet_pier' : 'parapet_x', x, 1, DECK);
  for (let y = 2; y <= 8; y++) { add(C, 'parapet_y', 0, y, DECK); add(C, y === 4 ? 'parapet_y_pin' : 'parapet_y', W - 1, y, DECK); }
  for (let x = 0; x < W; x++) if (x !== 7) add(C, x === 0 || x === W - 1 ? 'parapet_pier' : 'parapet_x', x, 9, DECK);
  // The low wall at x9 with its gap at y5, and the pins.
  for (const y of [2, 3, 7, 8]) add(C, 'lowwall_y', 9, y, DECK);
  add(C, 'lowwall_end_s_pin', 9, 4, DECK); add(C, 'lowwall_end_n', 9, 6, DECK);
  // The stair down through the gap at x7.
  add(C, 'stair', 7, 9, 80, 1, 1, 0.3); add(C, 'stair', 7, 10, 40, 1, 1, 0.3); add(C, 'stair', 7, 11, 0, 1, 1, 0.3);
  // Cheryl's roof.
  add(C, morning ? 'chimney' : 'chimney', 7, 2, DECK, 2, 1);
  add(C, 'herb_basil', 1, 2, DECK); add(C, 'herb_rosemary', 2, 2, DECK);
  add(C, 'chair_fold', 2, 7, DECK); add(C, 'chair_fold', 3, 7, DECK);
  add(C, 'tap', 2, 4, DECK);
  add(C, morning ? 'tub_empty' : (state.tub || 'tub_full_0'), 3, 4, DECK, 2, 1);
  // Her Next Door's roof.
  for (const x of [12, 15]) { add(C, 'line_post', x, 3, DECK); add(C, 'line_post', x, 7, DECK); }
  if (morning || state.sheetsMoved) add(C, morning ? 'backline_sheets_grey_0' : 'backline_sheets_0', 11, 2, DECK, 8, 1);
  else {
    add(C, 'sheets_ns_0', 12, 4, DECK, 1, 3); add(C, 'sheets_ns_1', 15, 4, DECK, 1, 3);
    add(C, 'backline_sag', 11, 2, DECK, 8, 1);
  }

  // ---- The court (rows 12–23).
  for (let y = 12; y <= 23; y++) for (let x = 1; x <= 18; x++) {
    const f = x === 6 && y === 20 ? 'cobble_drain' : `cobble_${(x * 7 + y * 3 + ((x * y) % 5)) % 4}`;
    if (y === 23) column(x, y, LOW, [['retain_s', 40], ['retain_s', 40], ['retain_s', 40]], [], [f, 0]);
    else add(C, f, x, y, 0, 1, 1, 0);
  }
  // West: the Pelletiers' house, two storeys, shutters closed; the gate at y19.
  for (let y = 12; y <= 23; y++) {
    const k = y === 19 ? 'facade_e_gate_ochre' : y % 3 === 0 ? 'facade_e_window_closed_ochre' : 'facade_e_plain_ochre';
    const up = y % 3 === 0 ? 'upper_e_window_closed_ochre' : 'upper_e_plain_ochre';
    column(0, y, 0, y === 23 ? [['facade_s_plain_ochre', 96], ['upper_s_plain_ochre', 96]] : [], [[k, 96], [up, 96]], ['roof_top', 192]);
  }
  // East: a low wall with a view over the town below.
  for (let y = 12; y <= 23; y++) column(W - 1, y, 0, y === 23 ? [['retain_s', 40]] : [], [['retain_e', 40]], ['roof_top', 40]);
  add(C, 'lemon_tree', 3, 14, 0);
  add(C, 'stool', 2, 16, 0);
  add(C, morning ? 'chess_slid' : state.pepper ? 'chess_pepper' : 'chess_plug', 3, 16, 0);
  add(C, 'gerald_chair', 4, 16, 0);
  add(C, 'well', 9, 16, 0, 2, 2);
  add(C, state.kidHasTimer ? 'pots_bare' : 'hurdle', 12, 17, 0, 3, 1);
  add(C, 'bench', 16, 12, 0, 2, 1);
  for (const [x, y, i] of [[1, 21, 0], [18, 21, 1], [1, 23, 2], [2, 23, 0], [18, 23, 1]]) add(C, `geraniums_${i}`, x, y, 0);
  if (!morning) add(C, 'piano', 15, 22, 0, 2, 2);

  // ---- Below: the roofs of the next houses down, and the Squeeze between them.
  for (let y = 24; y <= 25; y++) for (let x = 0; x < W; x++) {
    if (x === 15 || x === 16) continue;
    add(C, (x * 5 + y) % 3 ? 'lowroof_terra' : 'lowroof_flat', x, y, LOW, 1, 1, 0.5);
  }
  add(C, 'stair', 15, 24, -40, 1, 1, 0.3); add(C, 'stair', 16, 24, -40, 1, 1, 0.3);
  add(C, 'stair', 15, 25, -80, 1, 1, 0.3); add(C, 'stair', 16, 25, -80, 1, 1, 0.3);

  // ---- People.
  if (state.people !== false) {
    add('old_man_seated', 'think_right_0', 2, 16, 0, 1, 1, 2);
    if (!morning) {
      add('neighbor', 'smooth_left_0', 17, 5, DECK, 1, 1, 2);
      add('sweaty_kid', 'right_3', 10, 14, 0, 1, 1, 2);
      add('cheryl', 'right_0', 3, 6, DECK, 1, 1, 2);
    } else {
      add('neighbor', 'up_0', 14, 3, DECK, 1, 1, 2);
      add('sweaty_kid', 'jog_down_0', 15, 22, 0, 1, 1, 2);
      add('cheryl', 'down_0', 9, 19, 0, 1, 1, 2);
      add('fx', 'mist_1', 9, 16, 26, 2, 2, 3); // the well breathes
    }
  }
  return out;
}

function deckFloor(x, y) {
  if (x === 6 && y === 7) return 'deck_crack';
  if (x === 16 && y === 3) return 'deck_crack';
  if (x === 5 && y === 2) return 'deck_patch';
  return `deck_${y % 2 ? 's' : 'n'}${x % 2 ? 'e' : 'w'}`;
}

/** Screen position (px) of a world point. */
export const proj = (wx, wy, z = 0) => [(wx - wy) * 32, (wx + wy) * 16 - z];

/**
 * Painter's order: by the footprint's front (x1 + y1), then layer, then height.
 * Good enough for a still composition; the engine does proper box sorting.
 */
export function sortDrawables(list) {
  return list.slice().sort((a, b) => {
    const da = a.x0 + a.fw - 1 + a.y0 + a.fd - 1, db = b.x0 + b.fw - 1 + b.y0 + b.fd - 1;
    if (a.layer === 0 && b.layer !== 0) return -1; // ground floors first
    if (b.layer === 0 && a.layer !== 0) return 1;
    return da - db || a.z - b.z || a.layer - b.layer;
  });
}

/** Draw drawables to a 2D context with the camera's top-left at (cx, cy) in screen px. */
export function draw(ctx, list, images, manifest, cx, cy, opts = {}) {
  for (const d of sortDrawables(list)) {
    const sheet = manifest.sheets[d.s];
    if (!sheet) continue;
    const fr = sheet.frames[d.f];
    if (!fr) { if (opts.missing) opts.missing(d); continue; }
    const [sx, sy] = proj(d.x, d.y, d.z);
    const img = images[d.s];
    if (opts.shadows !== false && sheet.frames[d.f + '.shadow']) {
      const sh = sheet.frames[d.f + '.shadow'];
      ctx.drawImage(img, sh[0], sh[1], sh[2], sh[3], Math.round(sx - cx - sh[4]), Math.round(sy - cy - sh[5]), sh[2], sh[3]);
    }
    ctx.drawImage(img, fr[0], fr[1], fr[2], fr[3], Math.round(sx - cx - fr[4]), Math.round(sy - cy - fr[5]), fr[2], fr[3]);
  }
}
