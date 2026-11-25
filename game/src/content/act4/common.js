// Shared pieces for Act 4 (docs/design/04-the-list.md): items, the tileset,
// the act's state helpers, and `overlayMap`, which lays Act 4's states over a
// map another act built without editing that act's files.

import { items_act4 } from '../../art/act4_sprites.js';
import { bump, cycle, getItem, talking, cherylDeclines } from '../opening/common.js';
import { buildLayers } from '../opening/grid.js';

export { bump, cycle, getItem, talking, cherylDeclines };

// ---------------------------------------------------------------------------
// Items new in Act 4.

export const act4Items = {
  copper_throat: {
    name: 'Copper Throat',
    icon: { sheet: items_act4, frame: 'copper_coil' },
    description: "Mott's grandfather's copper. A coil of pipe that hums when the tide turns. It came off 'the greedy one.'",
    useOn: { object: 'That goes somewhere particular. Not here.' },
  },
  square_jug: {
    name: 'Square Jug',
    icon: { sheet: items_act4, frame: 'square_jug' },
    description: "Mott's square jug. Empty. Doesn't roll. Smells like a mistake.",
    useOn: { object: "A square jug. It doesn't roll. That's its whole personality.", npc: "A square jug. It doesn't roll. That's its whole personality." },
  },
};

// ---------------------------------------------------------------------------
// The act's state.

// Act 4's states yield to Act 5's (which takes over these maps) and to the epilogue.
export const act4 = (g) => !!g.flag('act4.started') && !g.flag('act5.started') && !g.flag('epilogue');
export const risen = (g) => !!g.flag('act4.risen');
// Before the reveal: the list is getting worse.
export const listing = (g) => act4(g) && !risen(g);

// Bilge flood stage: 1 at the start, 2 once two of the three threads are done.
export function listStage(g) {
  const done = ['bell.restored', 'got.throat', 'ottilie.readPlan'].filter((f) => g.flag(f)).length;
  return done >= 2 ? 2 : 1;
}

// ---------------------------------------------------------------------------
// Overlays: Act 4's version of a map built by another act.
//
//   overlayMap(base, {
//     when: (g) => act4(g),              // when the overlay applies
//     tileset,                            // a superset of the base's sheets, if it needs more
//     tiles: (g, T) => { T.set('detail', 11, 8, 'square4:...', solid) },
//     hide: ['mayor', 'movers'],          // base entities that step aside while it applies
//     entities: [...],                    // added entities (give them their own `when`)
//     exits: [...], triggers: [...],      // added (checked before the base's)
//     ambient: [...], onEnter: async (g) => {}, music, lighting, ambience
//   })
//
// `tiles` sees the base map's current tiles (after its own patches) and sets
// legend values over them; the result becomes the map's patches. Solidity goes
// on the ground tile, as in opening/grid.js.
export function overlayMap(base, o) {
  const on = (g) => !o.when || o.when(g);
  const h = base.ground.length;
  const w = base.ground[0].length;
  const legendAt = (layer, x, y) => {
    const ch = base[layer]?.[y]?.[x];
    return ch && ch !== ' ' ? base.legend[ch] : null;
  };
  const tileName = (v) => (v == null ? null : typeof v === 'string' ? v : v.tile);
  const isSolid = (v) => !!(v && typeof v === 'object' && v.solid);
  const patches = (g) => {
    const list = base.patches ? base.patches(g) || [] : [];
    if (!on(g) || !o.tiles) return list;
    // Current base cells, after the base's own patches.
    const cur = { ground: new Map(), detail: new Map(), overhead: new Map() };
    for (const [layer, x, y, v, pw = 1, ph = 1] of list) {
      for (let dy = 0; dy < ph; dy++) for (let dx = 0; dx < pw; dx++) cur[layer]?.set(`${x + dx},${y + dy}`, v);
    }
    const get = (layer, x, y) => (cur[layer].has(`${x},${y}`) ? cur[layer].get(`${x},${y}`) : legendAt(layer, x, y));
    const out = [];
    const T = {
      w, h, get,
      tile: (layer, x, y) => tileName(get(layer, x, y)),
      solid: (x, y) => isSolid(get('ground', x, y)) || isSolid(get('detail', x, y)),
      // Set a layer's tile; `solid` (true/false) rides on the ground tile.
      set(layer, x, y, ref, solid) {
        if (x < 0 || y < 0 || x >= w || y >= h) return;
        if (layer === 'ground' || solid === undefined) {
          let v = ref;
          if (layer === 'ground' && ref != null) {
            const prev = get('ground', x, y);
            const keep = typeof prev === 'object' && prev ? { ...prev } : {};
            delete keep.tile;
            if (solid !== undefined) keep.solid = solid;
            if (!keep.solid) delete keep.solid;
            v = Object.keys(keep).length ? { tile: ref, ...keep } : ref;
          }
          cur[layer].set(`${x},${y}`, v);
          out.push([layer, x, y, v]);
        } else {
          cur[layer].set(`${x},${y}`, ref);
          out.push([layer, x, y, ref]);
          T.block(x, y, solid);
        }
      },
      // Set a cell to a legend value as is ({ tile, solid, step, ... }).
      raw(layer, x, y, v) {
        if (x < 0 || y < 0 || x >= w || y >= h) return;
        cur[layer].set(`${x},${y}`, v);
        out.push([layer, x, y, v]);
      },
      // Change a tile's solidity, keeping its art.
      block(x, y, solid = true) {
        const g0 = get('ground', x, y);
        const name = tileName(g0);
        if (!name) return;
        const v = typeof g0 === 'object' ? { ...g0 } : { tile: g0 };
        if (solid) v.solid = true; else delete v.solid;
        const val = Object.keys(v).length === 1 ? name : v;
        cur.ground.set(`${x},${y}`, val);
        out.push(['ground', x, y, val]);
        // A solid detail tile blocks on its own: clear its solidity by re-setting it plain.
        const d = get('detail', x, y);
        if (!solid && isSolid(d)) { cur.detail.set(`${x},${y}`, tileName(d)); out.push(['detail', x, y, tileName(d)]); }
      },
    };
    o.tiles(g, T);
    return [...list, ...out];
  };
  const hide = new Set(o.hide || []);
  const baseEntities = (base.entities || []).map((e) => (hide.has(e.id)
    ? { ...e, when: (g) => !on(g) && (!e.when || e.when(g)) }
    : e));
  const pick = (key) => (g) => {
    const v = on(g) && o[key] !== undefined ? o[key] : base[key];
    return typeof v === 'function' ? v(g) : v;
  };
  return {
    ...base,
    tileset: o.tileset || base.tileset,
    patches,
    lighting: o.lighting !== undefined ? pick('lighting') : base.lighting,
    entities: [...baseEntities, ...(o.entities || [])],
    exits: [...(o.exits || []), ...(base.exits || [])],
    // `baseTriggers: false` switches the base map's triggers off while the overlay applies.
    triggers: [...(o.triggers || []), ...(base.triggers || []).map((t) => (o.baseTriggers === false
      ? { ...t, when: (g) => !on(g) && (!t.when || t.when(g)) }
      : t))],
    ambient: [...(base.ambient || []), ...(o.ambient || [])],
    onEnter: async (g) => {
      if (on(g) && o.onEnter) return o.onEnter(g);
      if (base.onEnter) return base.onEnter(g);
    },
  };
}

// A whole new map built from art references, like opening/grid's composedMap,
// re-exported here for the act's own maps.
export { composedMap, blankGrid } from '../opening/grid.js';
export { buildLayers };
