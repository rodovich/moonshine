// Tilemaps: three layers of one-character-per-tile grids (ground, detail,
// overhead) read through the map's legend and tileset. See README.md "Maps"
// and "Tilesets".
//
// A legend value is a tile name from the tileset, a direct art reference
// 'sheet:frame' or 'sheet:frame@palette' (sheets listed in tileset.sheets),
// or an object { tile, solid, counter } adding properties to either.

import { loadSheet, frameIndexAt, glowMask } from './art.js';

export const TILE = 16;
export const LAYERS = ['ground', 'detail', 'overhead'];

const warned = new Set();
function warnOnce(msg) {
  if (warned.has(msg)) return;
  warned.add(msg);
  console.warn(`[map] ${msg}`);
}

// One resolved tile: frames (an animation, or a 2-D pattern of animations
// picked by position) plus properties.
class Tile {
  constructor(name, def) {
    this.name = name;
    this.solid = !!def.solid;
    this.counter = !!def.counter;
    this.props = def;
    const art = loadSheet(def.sheet, def.palette);
    const anim = (frame) => ({ frames: art.anim(frame), durs: def.ms ? art.anim(frame).map(() => def.ms) : art.durations(frame) });
    if (def.pattern) {
      this.pattern = def.pattern.map((row) => row.map(anim));
    } else {
      this.single = anim(def.frame || name);
    }
    const frameNames = def.pattern ? def.pattern.flat() : [def.frame || name];
    this.over = frameNames.some((f) => f.startsWith('over_'));
  }

  image(x, y, ms) {
    let a = this.single;
    if (this.pattern) {
      const row = this.pattern[y % this.pattern.length];
      a = row[x % row.length];
    }
    if (!a.frames.length) return null;
    return a.frames.length > 1 ? a.frames[frameIndexAt(a.durs, ms)] : a.frames[0];
  }
}

export class Tileset {
  constructor(def) {
    this.def = def;
    this.sheets = def.sheets || {};
    this.tiles = {};
    for (const [name, t] of Object.entries(def.tiles || {})) this.tiles[name] = new Tile(name, t);
    this.refs = new Map();
  }

  // Resolve a legend value to a Tile (cached).
  resolve(value) {
    const key = typeof value === 'string' ? value : JSON.stringify(value);
    if (this.refs.has(key)) return this.refs.get(key);
    let tile = null;
    const spec = typeof value === 'string' ? { tile: value } : value;
    const base = this.tiles[spec.tile];
    if (base && Object.keys(spec).length === 1) {
      tile = base;
    } else if (base) {
      tile = new Tile(spec.tile, { ...base.props, ...spec, tile: undefined });
    } else {
      const m = /^([\w-]+):([\w-]+)(?:@([\w-]+))?$/.exec(spec.tile || '');
      const sheet = m && this.sheets[m[1]];
      if (!sheet) warnOnce(`no tile or sheet for "${spec.tile}"`);
      else tile = new Tile(spec.tile, { ...spec, sheet, frame: m[2], palette: m[3] });
    }
    this.refs.set(key, tile);
    return tile;
  }
}

const tilesetCache = new WeakMap();
function tilesetFor(def) {
  let ts = tilesetCache.get(def);
  if (!ts) {
    ts = new Tileset(def);
    tilesetCache.set(def, ts);
  }
  return ts;
}

export class TileMap {
  constructor(def) {
    this.def = def;
    this.id = def.id;
    const ground = def.ground;
    if (!ground) throw new Error(`map ${def.id}: no ground layer`);
    this.h = ground.length;
    this.w = Math.max(...ground.map((r) => r.length));
    this.tileset = tilesetFor(def.tileset);
    this.layers = {};
    for (const name of LAYERS) {
      const rows = def[name];
      this.layers[name] = this.parseLayer(name, rows);
    }
    this.collision = this.parseCollision(def.collision);
  }

  parseLayer(name, rows) {
    const grid = new Array(this.w * this.h).fill(null);
    if (!rows) return grid;
    if (rows.length !== this.h) warnOnce(`${this.id}.${name}: ${rows.length} rows, expected ${this.h}`);
    for (let y = 0; y < this.h; y++) {
      const row = rows[y] || '';
      for (let x = 0; x < this.w; x++) {
        const ch = row[x] ?? ' ';
        if (ch === ' ') continue;
        const value = this.def.legend[ch];
        if (!value) {
          warnOnce(`${this.id}.${name}: no legend entry for "${ch}"`);
          continue;
        }
        grid[y * this.w + x] = this.checked(name, this.tileset.resolve(value));
      }
    }
    return grid;
  }

  checked(layer, tile) {
    if (tile && tile.over !== (layer === 'overhead')) {
      warnOnce(`${this.id}: "${tile.name}" is on the ${layer} layer; over_* frames belong on overhead and only there`);
    }
    return tile;
  }

  // Optional collision override grid: '#' solid, 'o' open, anything else = from tiles.
  parseCollision(rows) {
    const grid = new Array(this.w * this.h).fill(null);
    if (!rows) return grid;
    for (let y = 0; y < this.h; y++) {
      const row = rows[y] || '';
      for (let x = 0; x < this.w; x++) {
        if (row[x] === '#') grid[y * this.w + x] = true;
        else if (row[x] === 'o') grid[y * this.w + x] = false;
      }
    }
    return grid;
  }

  inBounds(x, y) {
    return x >= 0 && y >= 0 && x < this.w && y < this.h;
  }

  tile(layer, x, y) {
    if (!this.inBounds(x, y)) return null;
    return this.layers[layer][y * this.w + x];
  }

  // Replace one tile at run time. `value` is anything a legend value can be,
  // or null to clear.
  setTile(layer, x, y, value) {
    if (!this.inBounds(x, y) || !this.layers[layer]) return;
    this.layers[layer][y * this.w + x] = value == null ? null : this.checked(layer, this.tileset.resolve(value));
  }

  // Static (tile) solidity. Out of bounds is solid.
  solid(x, y) {
    if (!this.inBounds(x, y)) return true;
    const i = y * this.w + x;
    const o = this.collision[i];
    if (o !== null) return o;
    const g = this.layers.ground[i];
    const d = this.layers.detail[i];
    return !!((g && g.solid) || (d && d.solid));
  }

  counter(x, y) {
    if (!this.inBounds(x, y)) return false;
    const i = y * this.w + x;
    const g = this.layers.ground[i];
    const d = this.layers.detail[i];
    return !!((g && g.counter) || (d && d.counter));
  }

  // Draw only the emissive pixels (colors in `rgbSet`) of a layer's tiles,
  // after lighting, so they keep their full brightness.
  drawGlow(ctx, layer, camX, camY, viewW, viewH, ms, rgbSet) {
    this.draw(ctx, layer, camX, camY, viewW, viewH, ms, (img) => glowMask(img, rgbSet));
  }

  draw(ctx, layer, camX, camY, viewW, viewH, ms, transform = null) {
    const grid = this.layers[layer];
    const x0 = Math.max(0, Math.floor(camX / TILE));
    const y0 = Math.max(0, Math.floor(camY / TILE));
    const x1 = Math.min(this.w - 1, Math.floor((camX + viewW - 1) / TILE));
    const y1 = Math.min(this.h - 1, Math.floor((camY + viewH - 1) / TILE));
    for (let y = y0; y <= y1; y++) {
      for (let x = x0; x <= x1; x++) {
        const t = grid[y * this.w + x];
        if (!t) continue;
        let img = t.image(x, y, ms);
        if (img && transform) img = transform(img);
        if (img) ctx.drawImage(img, x * TILE - camX, y * TILE - camY);
      }
    }
  }
}
