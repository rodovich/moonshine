// Shared pieces for Act 2: items, tile helpers, the residents' looks, and
// the small dialog helpers (the opening's, reused).

import { shopkeeper } from '../../art/npcs.js';
import { items_act2, piano } from '../../art/act2_objects.js';
import { counting_woman, mover, tourist, mayor, ambrose, basin_woman, girl, rope, watering_woman, bench_man } from '../../art/act2_npcs.js';
import { bump, cycle, getItem, talking, cherylDeclines } from '../opening/common.js';

export { bump, cycle, getItem, talking, cherylDeclines };

// ---------------------------------------------------------------------------
// Items new in Act 2.

export const act2Items = {
  paper_charcoal: {
    name: 'Paper and Charcoal',
    icon: { sheet: items_act2, frame: 'paper_charcoal' },
    description: "Ottilie's paper and a stub of charcoal. For rubbings. Primary sources, Cheryl.",
  },
  guidebook: {
    name: 'Guidebook',
    icon: { sheet: items_act2, frame: 'guidebook' },
    description: 'Tessel: A Pocket Companion. Confidently wrong on every page, from the Steps to the time of day. I\'ve grown fond of it.',
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
    icon: { sheet: items_act2, frame: 'crowbar' },
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
// Characters (art: game/src/art/act2_npcs.js, index in docs/art-act2.md).
// Residents who sit or hold a pose wear a static animated frame and don't
// turn to talk; those who walk somewhere use their walking sheet.

export const SHEETS = { counting_woman, mover, tourist, mayor, ambrose, basin_woman, girl, rope, watering_woman, bench_man, shopkeeper, piano };

export const LOOKS = {
  ambrose: { sheet: ambrose, frame: 'sit_down' },
  counting_woman_sitting: { sheet: counting_woman, frame: 'sit_down' },
  counting_woman: { sheet: counting_woman },
  basin_woman: { sheet: basin_woman, frame: 'down_0' },
  basin_tip: { sheet: basin_woman, frame: 'tip_down' },
  watering_woman: { sheet: watering_woman, frame: 'water_down' },
  tourist: { sheet: tourist, frame: 'sit_up' },
  tourist_hat: { sheet: tourist, frame: 'sit_up_hat' },
  bench_man: { sheet: bench_man, frame: 'sit_down' },
  mayor: { sheet: mayor, frame: 'gesture_down' },
  big_mover: { sheet: mover, palette: 'big' },
  other_mover: { sheet: mover, palette: 'other' },
  shopkeeper: { sheet: shopkeeper },
  girl_a: { sheet: girl, palette: 'a', frame: 'turn_right' },
  girl_c: { sheet: girl, palette: 'c', frame: 'jump_down' },
  girl_b: { sheet: girl, palette: 'b', frame: 'turn_left' },
  rope: { sheet: rope, frame: 'rope' },
};

// A Mover's pose ('scrub_down', 'push_up', 'run_down', ...): a static frame in his palette.
export const moverPose = (who, frame) => ({ sheet: mover, palette: who, frame });

export const pianoSprite = (frame) => ({ sheet: piano, frame });

// "Miss" — first talk sets met.<id>; returns true the first time.
export function firstMeet(g, id) {
  if (g.flag(`met.${id}`)) return false;
  g.setFlag(`met.${id}`);
  return true;
}

// Act 2's Wrongness: faint (story bible: about 0.1 after Act 1). Each Act 2 map
// sets it on entry while Act 2 is the current act; later acts set their own.
export function actWrongness(g) {
  if (!g.flag('act2.done')) g.setWrongness(0.1);
}
