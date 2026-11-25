// Shared pieces for Act 2: items, tile helpers, stand-in character looks, and
// the small dialog helpers (the opening's, reused).

import { items, items2 } from '../../art/items.js';
import { old_man, shopkeeper, kid } from '../../art/npcs.js';
import { neighbor } from '../../art/opening_npcs.js';
import { court_props } from '../../art/court.js';
import { bump, cycle, getItem, talking, cherylDeclines } from '../opening/common.js';

export { bump, cycle, getItem, talking, cherylDeclines };

// ---------------------------------------------------------------------------
// Items new in Act 2. Icons are stand-ins (recolored opening icons) until the
// art task draws paper_charcoal, guidebook, and crowbar.

export const act2Items = {
  paper_charcoal: {
    name: 'Paper and Charcoal',
    icon: { sheet: items, frame: 'letter', palette: { b: 'charcoal', B: 'charcoal_deep' } },
    description: "Ottilie's paper and a stub of charcoal. For rubbings. Primary sources, Cheryl.",
  },
  guidebook: {
    name: 'Guidebook',
    icon: { sheet: items, frame: 'letter', palette: { W: 'coral_light', w: 'coral', v: 'coral_shade', b: 'brass_light', B: 'brass' } },
    description: 'Tessel: A Pocket Companion. Confidently wrong on every page. I\'ve grown fond of it.',
    // One entry per look, in order (docs/design/02-city.md, "Reading the guidebook").
    looks: [
      ["'The Hundred Steps (there are, in fact, 99). A charming climb.'", "In fact. In print. Somebody's going to be upset about that."],
      ["'The Bell: rung at random by a local eccentric.'", 'Ambrose would like a word.'],
      ["'The Prow Light, at the western tip of the island.'", 'Eastern. Southeast. Not western.'],
      ["'Tessel keeps its own time, eleven minutes behind the mainland.'", 'Somebody at the Crown would like a word about that too.'],
      ["'Founded by fishermen in the year of the Great Shoal.'", 'Ottilie will scream.'],
    ],
    looksRepeat: 'cycle',
    useOn: { object: 'The guidebook has an opinion about this. It\'s wrong.' },
  },
  crowbar: {
    name: 'Crowbar',
    icon: { sheet: items2, frame: 'clothes_prop', palette: { o: 'iron_light', O: 'iron', p: 'iron_deep', W: 'white_light' } },
    description: "The Movers' crowbar. Heavy, honest, and slightly bent.",
    useOn: { npc: 'No. Absolutely not. Put it away, Cheryl.' },
  },
};

// ---------------------------------------------------------------------------
// Tile helpers for compose functions.

const q = (x, y) => `${y % 2 ? 's' : 'n'}${x % 2 ? 'e' : 'w'}`;

// Limestone paving in 2×2 slabs; every third block uses the second slab layout.
export function pave(x, y, shade = false) {
  if (shade) return `street:pave_${q(x, y)}_shade`;
  const alt = (((x >> 1) * 7 + (y >> 1) * 13) % 3) === 0 ? 'pave2' : 'pave';
  return `street:${alt}_${q(x, y)}`;
}

// Roofs seen from above, below a street: terracotta and whitewash, by block.
export function lowRoof(x, y) {
  const b = ((x >> 2) * 5 + (y >> 1) * 3) % 4;
  if (b === 0) return 'rooftiles:tiles_moss';
  if (b === 1) return 'buildings:roof@ochre';
  if (b === 2) return 'buildings:roof';
  return 'rooftiles:tiles';
}

// A house front facing the camera: `top` and `base` are strings with one
// letter per column: '#' wall, 'w' window, 'b' window box, 'D' door, 'c'
// closed shutters. `roofRows` rows of roof above. Puts everything on `ground`
// and marks it solid, except doors listed in `open` (exits).
export function house(L, x0, y0, { top, mid, base, roofRows = 1, palette, open = [] }) {
  const p = palette ? `@${palette}` : '';
  const w = top.length;
  let yTop = y0 + roofRows;
  if (mid) {
    // An upper storey: walls and windows only.
    for (let i = 0; i < w; i++) {
      const edge = i === 0 ? '_l' : i === w - 1 ? '_r' : '';
      const f = { '#': `wall${edge}`, w: 'window', b: 'window_box', c: 'window_closed', B: 'balcony' }[mid[i]];
      L.set('ground', x0 + i, yTop, `buildings:${f}${p}`, true);
    }
    yTop++;
  }
  for (let r = 0; r < roofRows; r++) {
    for (let i = 0; i < w; i++) {
      const edge = i === 0 ? '_l' : i === w - 1 ? '_r' : '';
      const fr = r === roofRows - 1 ? `roof_front${edge}` : `roof${edge}`;
      L.set('ground', x0 + i, y0 + r, `buildings:${fr}${p}`, true);
    }
  }
  for (let i = 0; i < w; i++) {
    const x = x0 + i;
    const edge = i === 0 ? '_l' : i === w - 1 ? '_r' : '';
    const t = top[i];
    const tf = { '#': `wall${edge}`, w: 'window', b: 'window_box', c: 'window_closed', D: 'door_top' }[t];
    L.set('ground', x, yTop, `buildings:${tf}${p}`, true);
    const bch = base[i];
    const bf = { '#': `wall_base${edge}`, w: 'window_base', c: 'window_closed_base', D: 'door_bot' }[bch];
    L.set('ground', x, yTop + 1, `buildings:${bf}${p}`, !open.some(([ox, oy]) => ox === x && oy === yTop + 1));
  }
}

// A layout under construction: layers plus solidity, with a `set` helper.
export function layout(W, H, blankGrid) {
  const L = {
    ground: blankGrid(W, H), detail: blankGrid(W, H), overhead: blankGrid(W, H),
    solid: blankGrid(W, H, false), counter: blankGrid(W, H, false), step: blankGrid(W, H),
    set(layer, x, y, ref, solid) {
      if (x < 0 || y < 0 || x >= W || y >= H) return;
      L[layer][y][x] = ref;
      if (solid !== undefined) L.solid[y][x] = solid;
    },
    block(x, y, s = true) { if (x >= 0 && y >= 0 && x < W && y < H) L.solid[y][x] = s; },
    lamp(x, y) { L.set('detail', x, y, 'props:lamp_post', true); L.set('overhead', x, y - 1, 'props:over_lamp_top'); },
    pot(x, y, kind = 'pot_geranium') { L.set('detail', x, y, `props:${kind}`, true); },
    bench(x, y) { L.set('detail', x, y, 'props:bench_l', true); L.set('detail', x + 1, y, 'props:bench_r', true); },
    done() { return { ground: L.ground, detail: L.detail, overhead: L.overhead, solid: L.solid, counter: L.counter, step: L.step }; },
  };
  return L;
}

// ---------------------------------------------------------------------------
// Characters. Most Act 2 residents have no bodies yet; until the art task
// draws them, each wears a palette swap of an existing body (see README.md).

export const LOOKS = {
  ambrose: { sheet: old_man, palette: 'plum' },
  counting_woman: { sheet: neighbor, palette: { A: 'cobalt_light', a: 'cobalt', Z: 'cobalt_shade', B: 'mustard_light', b: 'mustard_shade', H: 'hair_brown', h: 'hair_brown_shade' } },
  basin_woman: { sheet: neighbor, palette: { A: 'sage_light', a: 'sage', Z: 'sage_shade', H: 'hair_black', h: 'hair_black_shade', F: 'skin2_light', f: 'skin2', x: 'skin2_shade' } },
  watering_woman: { sheet: neighbor, palette: { A: 'ochre_light', a: 'ochre', Z: 'ochre_shade', B: 'leaf_light', b: 'leaf_shade' } },
  tourist: { sheet: neighbor, palette: { F: 'bloom_pink', f: 'coral_light', x: 'coral', A: 'white_light', a: 'white', Z: 'white_shade', H: 'hair_ginger', h: 'hair_ginger_shade', B: 'teal', b: 'teal_shade' } },
  bench_man: { sheet: old_man, palette: 'mustard' },
  mayor: { sheet: shopkeeper, palette: 'mustard' },
  big_mover: { sheet: shopkeeper, palette: 'coral' },
  other_mover: { sheet: shopkeeper, palette: { A: 'iron_light', a: 'iron', Z: 'iron_deep', H: 'hair_ginger', h: 'hair_ginger_shade', F: 'skin3_light', f: 'skin3', x: 'skin3_shade' } },
  shopkeeper: { sheet: shopkeeper },
  girl1: { sheet: kid, palette: 'coral' },
  girl2: { sheet: kid, palette: 'mustard' },
  girl3: { sheet: kid, palette: { A: 'rose_light', a: 'rose', Z: 'rose_shade', H: 'hair_brown', h: 'hair_brown_shade' } },
};

// The piano as one 32×32 sprite, stitched from the opening's four piano tiles.
const pf = court_props.frames;
const stitch = (a, b) => a.map((r, i) => r + b[i]);
export const pianoSheet = {
  palette: court_props.palette,
  size: [32, 32],
  frames: { piano: [...stitch(pf.piano_nw, pf.piano_ne), ...stitch(pf.piano_sw, pf.piano_se)] },
};

// "Miss" — first talk sets met.<id>; returns true the first time.
export function firstMeet(g, id) {
  if (g.flag(`met.${id}`)) return false;
  g.setFlag(`met.${id}`);
  return true;
}
