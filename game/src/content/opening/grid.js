// Builds engine maps from a compose function instead of hand-typed character
// grids. A map's art changes with the story (a taken pepper mill, a moved
// sheet, a piano gone in the morning), so each map module writes one function
// that lays out every tile for a given game state:
//
//   compose(g) -> { ground, detail, overhead, solid, counter? }   (2-D arrays, [y][x])
//
// where a tile is an art reference ('sheet:frame' or 'sheet:frame@palette')
// or null, `solid` marks blocked tiles, and `counter` marks tiles the player
// can reach across. `buildLayers` turns the layout for
// the starting state into the engine's legend and strings, and `patchesFor`
// turns any later state into the engine's `patches` (the tiles that differ).
// Solidity rides on the ground tile, so a tile that stops blocking (the piano's
// spot in the morning) is just another patch.

export function blankGrid(w, h, fill = null) {
  return Array.from({ length: h }, () => Array(w).fill(fill));
}

// The legend value for one cell of one layer.
function cellValue(layout, layer, x, y) {
  const ref = layout[layer][y][x];
  if (layer !== 'ground') return ref || null;
  const solid = !!layout.solid[y][x];
  const counter = !!layout.counter?.[y][x];
  if (!ref) {
    if (solid) console.warn(`[opening] solid tile at ${x},${y} has no ground art`);
    return null;
  }
  if (!solid && !counter) return ref;
  return { tile: ref, ...(solid && { solid: true }), ...(counter && { counter: true }) };
}

const key = (v) => (v == null ? '' : typeof v === 'string' ? v : JSON.stringify(v));

// Legend characters: anything but a space works; these are all single UTF-16 units.
function* legendChars() {
  for (let c = 0x21; c < 0x7f; c++) yield String.fromCharCode(c);
  for (let c = 0xa1; c < 0x2000; c++) yield String.fromCharCode(c);
}

export function buildLayers(layout) {
  const h = layout.ground.length;
  const w = layout.ground[0].length;
  const legend = {};
  const byKey = new Map();
  const chars = legendChars();
  const out = {};
  for (const layer of ['ground', 'detail', 'overhead']) {
    const rows = [];
    for (let y = 0; y < h; y++) {
      let row = '';
      for (let x = 0; x < w; x++) {
        const v = cellValue(layout, layer, x, y);
        if (v == null) {
          row += ' ';
          continue;
        }
        const k = key(v);
        let ch = byKey.get(k);
        if (!ch) {
          ch = chars.next().value;
          byKey.set(k, ch);
          legend[ch] = v;
        }
        row += ch;
      }
      rows.push(row);
    }
    out[layer] = rows;
  }
  return { legend, ...out };
}

// [layer, x, y, value] for every cell where `layout` differs from `base`.
export function patchesFor(layout, base) {
  const list = [];
  const h = base.ground.length;
  const w = base.ground[0].length;
  for (const layer of ['ground', 'detail', 'overhead']) {
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const v = cellValue(layout, layer, x, y);
        if (key(v) !== key(cellValue(base, layer, x, y))) list.push([layer, x, y, v]);
      }
    }
  }
  return list;
}

// A map definition from a compose function: the starting state is the base
// layout and everything else is patches.
export function composedMap(compose, def) {
  const start = { flag: () => undefined, hasItem: () => false };
  const base = compose(start);
  return {
    ...def,
    ...buildLayers(base),
    patches: (g) => patchesFor(compose(g), base),
  };
}
