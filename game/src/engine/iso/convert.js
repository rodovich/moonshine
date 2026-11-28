// The isometric description of a map: per-tile kinds and heights, drafted
// from the map's layers and collision, then corrected by the map's own
// `iso` overrides. Content tasks hand-edit the overrides; the converter only
// has to make every map render and play, roughly, from the start.
//
// A cell is { kind, z, h }:
//   kind  'floor' | 'stair' | 'block' | 'water' | 'void'
//   z     floor height (screen px up) of a walkable cell, or a block's base
//   h     a block's height above its base (blocks only)
// plus `top` (the tile images drawn on its top face) and `over` (an overhead
// tile, drawn as a slab above it).
//
// Overrides, on the map: iso: { cells: [[x, y, w, h, props], ...], rise }
//   props: { kind, z, h, top, south, east, over } — any subset; `top`,
//   `south`, `east` and `over` are tile references like a legend's
//   ('sheet:frame', a tileset name) or null for none. `rise` is the height
//   (px) per stair row (default 24).
//
// The draft's rules (docs/iso.md, README "Isometric view"):
//   - Tiles named like water, canals or the sea that block are water.
//   - Walkable tiles named like stairs or steps are stairs. Walkable areas
//     joined only through stairs differ in height by the stair's length
//     (rows - 1) × rise; the largest area is at 0, lower ones go negative.
//   - A block directly south of a raised floor holds it up (its top is
//     flush with that floor); one directly north of it is a parapet (a
//     little above it). Other blocks stand on the floor south of them, as
//     tall as their run of blocks in that column suggests (32-96 px). A
//     tile that blocks only because of its detail layer (a crate on the
//     floor) is a low block (24 px).

const WATER = /water|canal|sea|harbou?r|river|pool|wave/i;
const LOW = /low|fence|rail|hedge|bench|crate|barrel|planter|post|stool|chair/i;
const FLOORISH = /floor|cobble|paving|plank|grass|path|tiles?_floor/i;
const PARAPET = /parapet|edge|lip|kerb|curb/i;
const STAIR = /stair|steps?\b|step_|ladder/i;
const RISE = 24;

export function tileName(t) {
  if (!t) return '';
  return `${t.name} ${t.props.frame || ''}`;
}

export function convertMap(map, def = {}) {
  const { w, h } = map;
  const iso = def.iso || {};
  const rise = iso.rise ?? RISE;
  const cells = new Array(w * h);
  const at = (x, y) => (x >= 0 && y >= 0 && x < w && y < h ? cells[y * w + x] : null);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const g = map.tile('ground', x, y);
      const d = map.tile('detail', x, y);
      const o = map.tile('overhead', x, y);
      const names = `${tileName(g)} ${tileName(d)}`;
      const solid = map.solid(x, y);
      let kind;
      if (!g && !d) kind = solid ? 'void' : 'floor';
      else if (solid && WATER.test(names)) kind = 'water';
      else if (solid) kind = 'block';
      else if (STAIR.test(names)) kind = 'stair';
      else kind = 'floor';
      // A low block: something standing on the floor (the ground tile itself
      // is walkable), or a tile named like a low wall or a fence.
      const low = kind === 'block' && (!(g && g.solid) || LOW.test(names) || FLOORISH.test(tileName(g)));
      const lip = kind === 'block' && PARAPET.test(tileName(g));
      cells[y * w + x] = { x, y, kind, z: 0, h: 0, low, lip, over: !!o, detail: d && !(g && g.solid && !LOW.test(names) && !FLOORISH.test(tileName(g))) ? d : null };
    }
  }

  // Walkable areas and the stairs between them.
  const region = new Int32Array(w * h).fill(-1);
  const regions = [];
  const flood = (sx, sy, kinds, id) => {
    const list = [];
    const q = [[sx, sy]];
    region[sy * w + sx] = id;
    while (q.length) {
      const [x, y] = q.pop();
      list.push([x, y]);
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const c = at(x + dx, y + dy);
        if (!c || !kinds.includes(c.kind) || region[c.y * w + c.x] !== -1) continue;
        region[c.y * w + c.x] = id;
        q.push([c.x, c.y]);
      }
    }
    return list;
  };
  for (const c of cells) {
    if (c.kind === 'floor' && region[c.y * w + c.x] === -1) regions.push({ kind: 'floor', cells: flood(c.x, c.y, ['floor'], regions.length), z: null });
  }
  for (const c of cells) {
    if (c.kind === 'stair' && region[c.y * w + c.x] === -1) regions.push({ kind: 'stair', cells: flood(c.x, c.y, ['stair'], regions.length) });
  }
  const floors = regions.filter((r) => r.kind === 'floor');
  if (floors.length) {
    const main = floors.reduce((a, b) => (b.cells.length > a.cells.length ? b : a));
    main.z = 0;
    // Spread heights across stairs until nothing changes.
    for (let pass = 0; pass < regions.length; pass++) {
      let changed = false;
      for (const st of regions.filter((r) => r.kind === 'stair')) {
        const touching = new Map();
        for (const [x, y] of st.cells) {
          for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
            const id = at(x + dx, y + dy) ? region[(y + dy) * w + x + dx] : -1;
            if (id >= 0 && regions[id].kind === 'floor') touching.set(id, regions[id]);
          }
        }
        const ys = st.cells.map(([, y]) => y);
        const xs = st.cells.map(([x]) => x);
        const len = Math.max(Math.max(...ys) - Math.min(...ys), Math.max(...xs) - Math.min(...xs));
        const known = [...touching.values()].filter((r) => r.z != null);
        if (!known.length) continue;
        const base = known[0];
        const cy = (r) => r.cells.reduce((s, [, y]) => s + y, 0) / r.cells.length;
        for (const r of touching.values()) {
          if (r.z != null) continue;
          // North of the stair is up (3/4 maps draw climbs going up the screen).
          r.z = base.z + (cy(r) < cy(base) ? 1 : -1) * len * rise;
          changed = true;
        }
        // The stair ramps between its ends.
        const lo = Math.min(...[...touching.values()].map((r) => r.z ?? base.z));
        const hi = Math.max(...[...touching.values()].map((r) => r.z ?? base.z));
        const vertical = Math.max(...ys) - Math.min(...ys) >= Math.max(...xs) - Math.min(...xs);
        for (const [x, y] of st.cells) {
          const k = vertical ? (Math.max(...ys) - y) / Math.max(1, len) : 0.5;
          at(x, y).z = Math.round(lo + (hi - lo) * k);
        }
      }
      if (!changed) break;
    }
    for (const r of floors) {
      const z = r.z ?? 0;
      for (const [x, y] of r.cells) at(x, y).z = z;
    }
  }

  // Blocks.
  const walk = (c) => c && (c.kind === 'floor' || c.kind === 'stair');
  const nearFloor = (c) => {
    const n = [[0, 1], [0, -1], [1, 0], [-1, 0]].map(([dx, dy]) => at(c.x + dx, c.y + dy)).filter(walk);
    return n.length ? Math.max(...n.map((m) => m.z)) : null;
  };
  // Low things stand on the floor beside them.
  for (const c of cells) {
    if (c.kind !== 'block' || !c.low) continue;
    c.z = nearFloor(c) ?? 0;
    c.h = 28;
  }
  // Tall blocks, a column's run at a time (low things don't split a run's
  // view of the floors around it).
  const skipLow = (x, y, dy) => {
    let c = at(x, y);
    while (c && c.kind === 'block' && c.low) c = at(x, (y += dy));
    return c;
  };
  for (let x = 0; x < w; x++) {
    let y = 0;
    while (y < h) {
      const c0 = at(x, y);
      if (c0.kind !== 'block' || c0.low) { y++; continue; }
      const y0 = y;
      while (y < h && at(x, y).kind === 'block' && !at(x, y).low) y++;
      const y1 = y - 1; // run of blocks y0..y1 in this column
      const north = skipLow(x, y0 - 1, -1);
      const south = skipLow(x, y1 + 1, 1);
      const southLow = at(x, y1 + 1);
      const base = walk(south) ? south.z : southLow && southLow.low ? southLow.z : 0;
      const run = y1 - y0 + 1;
      for (let yy = y0; yy <= y1; yy++) {
        const c = at(x, yy);
        c.z = base;
        if (walk(north) && north.z > base) c.h = north.z - base; // holds up a raised floor
        else c.h = Math.min(96, 32 + 16 * (run - 1));
      }
      // A parapet or edge: a lip a little above the floor beside it.
      for (let yy = y0; yy <= y1; yy++) {
        const c = at(x, yy);
        const f = nearFloor(c);
        if (c.lip && f != null && f > 0 && c.z + c.h <= f + 12) { c.z = f; c.h = 12; }
      }
      // A short run just north of a raised floor (its parapet) stands on it.
      if (walk(south) && south.z > 0 && run <= 2) for (let yy = y0; yy <= y1; yy++) { at(x, yy).z = south.z; at(x, yy).h = 12; }
    }
  }
  // Doors: an exit set into a wall (blocks to its north) is drawn as part of
  // the wall, with the door on its face; Cheryl walks into it at floor level.
  for (const ex of def.exits || []) {
    for (let y = ex.y; y < ex.y + (ex.h || 1); y++) {
      for (let x = ex.x; x < ex.x + (ex.w || 1); x++) {
        const c = at(x, y);
        const n = at(x, y - 1);
        if (!walk(c) || !n || n.kind !== 'block' || n.low) continue;
        c.kind = 'door';
        c.h = n.z + n.h - c.z;
      }
    }
  }
  // Water sits a little below its neighbors.
  for (const c of cells) {
    if (c.kind !== 'water') continue;
    const n = [[1, 0], [-1, 0], [0, 1], [0, -1]].map(([dx, dy]) => at(c.x + dx, c.y + dy)).filter(walk);
    c.z = (n.length ? Math.min(...n.map((m) => m.z)) : 0) - 6;
  }

  // Hand overrides.
  for (const [x0, y0, ww = 1, hh = 1, props = {}] of iso.cells || []) {
    for (let y = y0; y < y0 + hh; y++) {
      for (let x = x0; x < x0 + ww; x++) {
        const c = at(x, y);
        if (c) Object.assign(c, props, { override: props });
      }
    }
  }
  // Low things that only hang overhead (washing on a line) draw as floor
  // with their overhead slab.
  for (const c of cells) if (c.kind === 'block' && c.low && !c.detail && c.over && !c.override) { c.kind = 'floor'; c.h = 0; }
  // Props: things on the floor drawn by the detail layer (a chair, the well)
  // are drawn upright, as their SNES tiles put back together, standing on
  // the floor. One prop is a connected group of such tiles from one sheet.
  const props = [];
  const sheetOf = (t) => (t ? String(t.name).split(':')[0] : '');
  const seen = new Set();
  for (const c of cells) {
    if (c.kind !== 'block' || !c.low || !c.detail || seen.has(c) || c.override) continue;
    const sheet = sheetOf(c.detail);
    const group = [];
    const q = [c];
    seen.add(c);
    while (q.length) {
      const g = q.pop();
      group.push(g);
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const n = at(g.x + dx, g.y + dy);
        if (n && !seen.has(n) && n.kind === 'block' && n.low && n.detail && !n.override && sheetOf(n.detail) === sheet) {
          seen.add(n);
          q.push(n);
        }
      }
    }
    const xs = group.map((g) => g.x);
    const ys = group.map((g) => g.y);
    const prop = { x0: Math.min(...xs), y0: Math.min(...ys), x1: Math.max(...xs), y1: Math.max(...ys), cells: group };
    prop.z = Math.max(...group.map((g) => g.z));
    for (const g of group) { g.prop = prop; g.kind = 'floor'; g.h = 0; }
    props.push(prop);
  }
  // Front walls: blocks with nothing walkable beyond them to the south or
  // east (the edge of the map, or void) but walkable floor behind them.
  const open = (c) => c && c.kind !== 'void';
  for (const c of cells) {
    if (c.kind !== 'block' || c.low) continue;
    const s = at(c.x, c.y + 1);
    const e = at(c.x + 1, c.y);
    const edgeS = !open(s) || (s.kind === 'block' && s.front);
    const edgeE = !open(e) || (e.kind === 'block' && e.front);
    const behind = [at(c.x, c.y - 1), at(c.x - 1, c.y)].some((n) => n && (n.kind === 'floor' || n.kind === 'stair' || (n.kind === 'block' && n.low)));
    if ((edgeS || edgeE) && behind && !c.override) c.front = true;
  }
  let maxZ = 0;
  for (const c of cells) maxZ = Math.max(maxZ, c.z + (c.kind === 'block' ? c.h : 0) + (c.over ? 64 : 0));
  return { w, h, cells, at, maxZ, props };
}

// The draft as override rows, for a content task to copy into a map and
// edit: one [x, y, 1, 1, { kind, z, h }] per cell that isn't floor at 0.
export function draftOverrides(model) {
  const out = [];
  for (const c of model.cells) {
    if (c.kind === 'floor' && c.z === 0) continue;
    const p = { kind: c.kind };
    if (c.z) p.z = c.z;
    if (c.kind === 'block') p.h = c.h;
    out.push([c.x, c.y, 1, 1, p]);
  }
  return out;
}
