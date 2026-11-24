// Tilemaps: three layers of one-character-per-tile grids (ground, objects,
// overhead) interpreted through the map's legend and tileset.
//
// Tileset:  { tiles: { grass: { sheet, frame: 'grass' }, water: { sheet, frame: 'water', solid: true, fps: 3 } } }
//   A tile whose frame has numbered frames (water_0, water_1, ...) animates.
//   Properties: solid (blocks walking), counter (can talk across it).
// Map legend: { '.': 'grass', '~': 'water' }; ' ' is always empty.

import { loadSheet } from './art.js';

export const TILE = 16;

export class Tileset {
  constructor(def) {
    this.def = def;
    this.tiles = {};
    for (const [name, t] of Object.entries(def.tiles)) {
      const art = loadSheet(t.sheet, t.palette);
      const frames = art.anim(t.frame || name);
      this.tiles[name] = {
        name,
        frames,
        frameTicks: Math.max(1, Math.round(60 / (t.fps || 3))),
        solid: !!t.solid,
        counter: !!t.counter,
        props: t,
      };
    }
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

const LAYERS = ['ground', 'objects', 'overhead'];

export class TileMap {
  constructor(def) {
    this.def = def;
    this.id = def.id;
    const ground = def.ground || def.layers?.ground;
    if (!ground) throw new Error(`map ${def.id}: no ground layer`);
    this.h = ground.length;
    this.w = Math.max(...ground.map((r) => r.length));
    this.tileset = tilesetFor(def.tileset);
    this.layers = {};
    for (const name of LAYERS) {
      const rows = def[name] || def.layers?.[name];
      this.layers[name] = this.parseLayer(name, rows);
    }
    this.collision = this.parseCollision(def.collision);
  }

  parseLayer(name, rows) {
    const grid = new Array(this.w * this.h).fill(null);
    if (!rows) return grid;
    if (rows.length !== this.h) console.warn(`[map] ${this.id}.${name}: ${rows.length} rows, expected ${this.h}`);
    for (let y = 0; y < this.h; y++) {
      const row = rows[y] || '';
      for (let x = 0; x < this.w; x++) {
        const ch = row[x] ?? ' ';
        if (ch === ' ') continue;
        const tileName = this.def.legend[ch];
        if (!tileName) {
          console.warn(`[map] ${this.id}.${name}: no legend entry for "${ch}" at ${x},${y}`);
          continue;
        }
        const tile = this.tileset.tiles[tileName];
        if (!tile) {
          console.warn(`[map] ${this.id}: tileset has no tile "${tileName}"`);
          continue;
        }
        grid[y * this.w + x] = tile;
      }
    }
    return grid;
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

  // Static (tile) solidity. Out of bounds is solid.
  solid(x, y) {
    if (!this.inBounds(x, y)) return true;
    const i = y * this.w + x;
    const o = this.collision[i];
    if (o !== null) return o;
    const g = this.layers.ground[i];
    const ob = this.layers.objects[i];
    return !!((g && g.solid) || (ob && ob.solid));
  }

  counter(x, y) {
    if (!this.inBounds(x, y)) return false;
    const i = y * this.w + x;
    const g = this.layers.ground[i];
    const ob = this.layers.objects[i];
    return !!((g && g.counter) || (ob && ob.counter));
  }

  draw(ctx, layer, camX, camY, viewW, viewH, tick) {
    const grid = this.layers[layer];
    const x0 = Math.max(0, Math.floor(camX / TILE));
    const y0 = Math.max(0, Math.floor(camY / TILE));
    const x1 = Math.min(this.w - 1, Math.floor((camX + viewW - 1) / TILE));
    const y1 = Math.min(this.h - 1, Math.floor((camY + viewH - 1) / TILE));
    for (let y = y0; y <= y1; y++) {
      for (let x = x0; x <= x1; x++) {
        const t = grid[y * this.w + x];
        if (!t || !t.frames.length) continue;
        const img = t.frames.length > 1 ? t.frames[Math.floor(tick / t.frameTicks) % t.frames.length] : t.frames[0];
        ctx.drawImage(img, x * TILE - camX, y * TILE - camY);
      }
    }
  }
}
