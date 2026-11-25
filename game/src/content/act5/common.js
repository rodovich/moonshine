// Shared pieces for Act 5, High and Dry (docs/design/05-high-and-dry.md):
// story state, items, the settings every Act 5 map shares, and helpers for
// layering Act 5's states onto other acts' maps.

import { items_act5 } from '../../art/act5_sprites.js';
import { items_act4 } from '../../art/act4_sprites.js';
import { bump, cycle, getItem, cherylDeclines, firstMeet, talking, layout } from '../act2/common.js';

export { bump, cycle, getItem, cherylDeclines, firstMeet, talking, layout };

// ---------------------------------------------------------------------------
// Story state

export const started = (g) => !!g.flag('act5.started');
export const doorOpen = (g) => !!g.flag('door.open');
export const ropeTied = (g) => !!g.flag('rope.tied');
export const afloat = (g) => !!g.flag('boatman.afloat');
export const hasClapper = (g) => !!g.flag('got.clapper');
export const toothOut = (g) => !!g.flag('tooth.out');
export const toothSet = (g) => !!g.flag('tooth.set');

// The Teeth: stage 1 at the start, one more for each of the door and the clapper.
export const stage = (g) => g.flag('teeth.stage') || 1;
export function advanceTeeth(g) {
  const n = 1 + (doorOpen(g) ? 1 : 0) + (hasClapper(g) ? 1 : 0);
  if (n !== stage(g)) g.setFlag('teeth.stage', n);
}

// The story bible's Wrongness for Act 5. The audio's global amount isn't
// saved, so every Act 5 map sets it on entry.
export const WRONGNESS = 0.5;

// The wind is always there (design: "Building the danger", rule 2): every
// surface map in Act 5 has the wind under its music, the faint hull creak,
// and the laundry snapping where there's laundry.
export const SURFACE_AMBIENCE = ['wind', 'hull_far'];
export const LAUNDRY_AMBIENCE = ['wind', 'hull_far', 'laundry'];

// ---------------------------------------------------------------------------
// Items new in Act 5

export const act5Items = {
  bucket: {
    name: 'Bucket',
    icon: { sheet: items_act5, frame: 'bucket_empty' },
    description: "The Fishmonger's bucket. It smells, as you'd expect.",
  },
  bucket_water: {
    name: 'Bucket of Water',
    icon: { sheet: items_act5, frame: 'bucket_full' },
    description: 'A bucket of the Fountain. Heavy. Holy, nearly.',
    useOn: { npc: "No. That's for a boat.", object: "No. That's for a boat." },
  },
  rope: {
    name: 'Rope',
    icon: { sheet: items_act5, frame: 'rope' },
    description: "The Boatman's mooring rope. Tarry, salty, and longer than I'd like to climb.",
    useOn: { object: "There's nothing here worth tying.", npc: "There's nothing here worth tying." },
  },
  brass_polish: {
    name: 'Brass Polish',
    icon: { sheet: items_act5, frame: 'brass_polish' },
    description: 'Lighthouse polish. It says so on the tin. The tin is very shiny.',
    useOn: { object: "It's for a lighthouse. It says so on the tin.", npc: "It's for a lighthouse. It says so on the tin." },
  },
  clapper: {
    name: 'Clapper',
    icon: { sheet: items_act5, frame: 'clapper' },
    description: "The bell's old clapper. Rounded at one end, notched at the other. Heavy as sin.",
    useOn: { object: "It's heavy, and it wants to be somewhere particular." },
  },
};

// Act 4's square jug, for playing Act 5 before Act 4's branch is merged.
// src/content/index.js lists Act 4's own items after these, so theirs wins.
export const standInItems = {
  square_jug: {
    name: 'Square Jug',
    icon: { sheet: items_act4, frame: 'square_jug' },
    description: "Mott's square jug. Empty. Doesn't roll. Smells like a mistake.",
  },
};

// ---------------------------------------------------------------------------
// Layering Act 5 onto other acts' maps (Act 3's withAct3 pattern): their
// maps stay as they are; Act 5 adds to them and steps their pieces aside.

export const both = (a, b) => (g) => (!a || a(g)) && (!b || b(g));
export const not = (f) => (g) => !f(g);

export function chain(...fns) {
  const list = fns.filter(Boolean);
  return async (g) => { for (const f of list) await f(g); };
}

export function morePatches(base, extra) {
  return (g) => [...(base ? base(g) : []), ...extra(g)];
}

// An entity, exit, or trigger that steps aside once Act 5 begins.
// Wrapped functions keep the original beside them as `act5Before`, which the
// engine ignores and `npm run check` reads (it sees ids only in the
// functions it can reach).
export const untilAct5 = (o) => ({ ...o, when: both(o.when, not(started)), act5Before: o.when });

// A map's `collision` override with some tiles forced open ('o'), for exits
// on tiles that an Act 5 patch clears (the checker reads collision, not
// patches). Something else (an entity, an exit's `blocked`) has to keep
// them shut before Act 5.
export function openTiles(def, cells) {
  const h = def.ground.length, w = def.ground[0].length;
  const rows = (def.collision || Array(h).fill(' '.repeat(w))).map((r) => r.padEnd(w, ' ').split(''));
  for (const [x, y] of cells) rows[y][x] = 'o';
  return rows.map((r) => r.join(''));
}

// A map's lighting or ambience, which may be a value or a function.
export const valueOf = (v, g) => (typeof v === 'function' ? v(g) : v);

// Swap one tile layer's frame for another wherever it appears in a list of
// patches' values (string or { tile } values).
export function tileName(v) {
  return v && typeof v === 'object' ? v.tile : v;
}

// Two-by-two block patches: [layer, x0 + i, y0 + j, `${prefix}_${suffix(i, j)}`].
export function block2(layer, x0, y0, name, solid) {
  const out = [];
  const q = [['nw', 'ne'], ['sw', 'se']];
  for (let j = 0; j < 2; j++) for (let i = 0; i < 2; i++) {
    const tile = name(i, j, q[j][i]);
    out.push([layer, x0 + i, y0 + j, solid ? { tile, solid: true } : tile]);
  }
  return out;
}
