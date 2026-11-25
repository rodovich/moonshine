// Shared pieces for Act 3, Downstairs (docs/design/03-downstairs.md): items,
// the underground's wall and floor helpers, lines used on several maps, and
// the audio and darkness settings every Downstairs map shares.

import { items3 } from '../../art/items.js';
import { ship_plan } from '../../art/chartroom.js';
import { layout, bump, cycle, getItem, cherylDeclines } from '../act2/common.js';
import { blankGrid } from '../opening/grid.js';

export { bump, cycle, getItem, cherylDeclines, blankGrid, layout };

// ---------------------------------------------------------------------------
// Story state

export const lever = (g) => !!g.flag('gallery.lever');
export const hatchOpen = (g) => !!g.flag('gallery.hatch');
export const hasDisc = (g) => g.hasItem('moonglass_disc');
export const valveTurned = (g) => !!g.flag('halls.valve');
export const unbolted = (g) => !!g.flag('founders.unbolted');

// The Wrongness for this act (story bible: about 0.2 in Act 3). The audio's
// global amount isn't saved, so every Act 3 map sets it on entry.
export const WRONGNESS = 0.2;

// Loops that scripts start Downstairs. Map `ambience` only manages its own
// list, so each map says which of these it wants and the rest stop.
const SCRIPT_LOOPS = ['beam_hum', 'water_gush', 'moonglass_hum', 'tube_murmur'];
export function keepLoops(g, want = []) {
  for (const id of SCRIPT_LOOPS) if (!want.includes(id)) g.stopLoop(id, 600);
  for (const id of want) g.startLoop(id);
}

// Settings every Downstairs map shares.
export const UNDER = {
  music: 'downstairs',
  lighting: null,
  background: 'void',
  ambience: ['hull', 'drips'],
  step: 'step_hullstone',
};

// The disc's light follows Cheryl once she has it (radius 3; the Bunk Room
// swallows light and gets 2).
export const discLight = (radius = 3) => (g) => hasDisc(g) && { radius, color: 'relic_cyan' };

// ---------------------------------------------------------------------------
// Items

export const act3Items = {
  moonglass_disc: {
    name: 'Moonglass Disc',
    icon: { sheet: items3, frame: 'moonglass_disc' },
    description: "A disc of milky glass. It glows, and it's warm. Lamps Downstairs like it.",
    useOn: { object: 'It glows at it. Nothing happens. The disc doesn\'t seem to mind.' },
  },
  valve_key: {
    name: 'Valve Key',
    icon: { sheet: items3, frame: 'valve_key' },
    description: "A Keepers' valve key. Bronze, heavy, with a square socket. Somebody hung it up neatly.",
    useOn: { object: "It's a key for something square. That isn't square." },
  },
  ship_plan: {
    name: 'Ship Plan',
    icon: { sheet: items3, frame: 'ship_plan' },
    description: "My rubbing of the Founders' floor. Tessel, drawn as a boat. I've folded it in quarters, which feels rude.",
    // Looking at it unfolds it full-screen; any key or tap folds it again.
    examine: async (g) => {
      await g.showPicture({ sheet: ship_plan, frame: 'plan' }, { fade: 0.3 });
      await g.waitForInput();
      await g.hidePicture({ fade: 0.3 });
    },
  },
};

// ---------------------------------------------------------------------------
// Building underground maps

// A deck: solid rock everywhere, to be carved.
export function deck(W, H) {
  const L = layout(W, H, blankGrid);
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) L.set('ground', x, y, 'hull:top', true);
  return L;
}

// A north wall face two rows tall (upper row y, lower row y + 1), x0..x1,
// with a rib face at the given columns. Solid.
export function wall(L, x0, x1, y, ribs = []) {
  for (let x = x0; x <= x1; x++) {
    const rib = ribs.includes(x);
    const b = x % 3 === 0 ? '_b' : '';
    L.set('ground', x, y, rib ? 'hull:face_rib_top' : `hull:face_top${b}`, true);
    L.set('ground', x, y + 1, rib ? 'hull:face_rib_base' : `hull:face_base${b}`, true);
  }
}

// Floor plates, mostly plain, with a worn, cracked, or glyph plate now and
// then (by a hash, so no pattern shows).
export function floor(L, x0, x1, y0, y1) {
  for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) {
    const h = (x * 73 + y * 151) % 29;
    const f = h === 0 ? 'floor_glyph' : h === 7 ? 'floor_worn' : h === 13 ? 'floor_broken' : 'floor';
    L.set('ground', x, y, `hull:${f}`, false);
  }
}

// Ceiling ribs on the overhead layer, one per row from y0 to y1 at each x.
export function ribs(L, xs, y0, y1, skip = () => false) {
  for (const x of xs) for (let y = y0; y <= y1; y++) if (!skip(x, y)) L.set('overhead', x, y, 'hull:over_rib_v');
}

// ---------------------------------------------------------------------------
// Lines shared by every Downstairs map

export const WALL_LOOKS = [
  ["Stone, fitted so tight you couldn't get a hair between the blocks. No mortar.", 'Nobody in Tessel builds like this. Nobody in Tessel builds straight.'],
  'Straight lines, all the way along.',
];
export const RIB_LOOK = 'Ribs across the ceiling, every few paces. Like being inside something.';
export const NO_SEAM = "No seam. Whoever made this didn't make things for crowbars.";

// Crowbar on Founder stone; everything else falls through to the disc's or
// the default decline.
export const founderUse = { crowbar: (g) => g.describe(NO_SEAM), '*': cherylDeclines };

// Hotspots along a wall: one entity per run of plain wall tiles between
// `taken` columns, sharing the 'walls' look counter. Rib columns get the rib
// line instead.
export function wallHotspots(prefix, y, x0, x1, taken, ribCols = []) {
  const out = [];
  let run = null;
  const flush = () => {
    if (run) out.push({ id: `${prefix}_wall_${run.x}`, x: run.x, y, w: run.w, lookKey: 'walls', looks: WALL_LOOKS });
    run = null;
  };
  for (let x = x0; x <= x1; x++) {
    if (taken.includes(x)) { flush(); continue; }
    if (ribCols.includes(x)) {
      flush();
      out.push({ id: `${prefix}_rib_${x}`, x, y, lookKey: 'ribs', look: RIB_LOOK });
      continue;
    }
    if (run) run.w++;
    else run = { x, w: 1 };
  }
  flush();
  return out.map((o) => ({ solid: false, use: founderUse, ...o }));
}

// A moonglass lamp in a niche: dead until the disc wakes it (flag lamp.<id>).
// The niche is on the upper wall row (y - 1); the lamp is used from below.
export function lampEntity(id, x, y) {
  const flag = `lamp.${id}`;
  return {
    id: `lamp_${id}`, x, y, solid: false, lookKey: 'lamps',
    interact: async (g) => {
      if (g.flag(flag)) return g.describe('Lit. Somebody\'s home.');
      if (hasDisc(g)) return g.describe('A dead lamp. It looks like the disc, only hungrier.');
      return g.describe('A lamp of milky glass in a niche. Dead. Cold.');
    },
    use: {
      moonglass_disc: async (g) => {
        if (g.flag(flag)) return g.describe("It's already lit. It doesn't want seconds.");
        await relight(g, flag);
        await g.describe('It drinks from the disc and wakes up. So do I, a little.');
      },
      ...founderUse,
    },
  };
}

// The relighting itself: the disc's glow pours into the lamp.
export async function relight(g, flag) {
  g.sfx('lamp_relight');
  g.pose('player', 'reach_up');
  await g.wait(0.5);
  g.setFlag(flag);
  await g.wait(0.6);
  g.pose('player', null);
}

// Patches for a lamp niche on the upper wall row.
export const nicheTile = (g, id) => (g.flag(`lamp.${id}`) ? 'ds:niche_lit' : 'ds:niche_dead');

// Ladders up decline after the valve (the act's only exit is then the
// Founders' Door).
export async function ladderDeclines(g) {
  if (unbolted(g)) return g.describe("Not that way. Ottilie's door is quicker.");
  return g.describe("Not now. I want to see where that passage goes.");
}
