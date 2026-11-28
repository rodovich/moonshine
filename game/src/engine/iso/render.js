// The isometric renderer: draws the world's grid as floors, blocks, faces,
// overhead slabs, and characters, sorted back to front; cuts away walls
// that would hide Cheryl; and keeps what it drew for picking.
//
// Until the isometric art lands, tiles are the SNES tiles themselves,
// sheared onto the diamond tops and wall faces, and characters are their
// SNES sprites at 2×. iso/sprites.js swaps in real art per sheet when it
// exists.

import { TILE, TileMap } from '../tilemap.js';
import { colorOf } from '../art.js';
import { safeCall, isInteractable } from '../world.js';
import { ISO_W, ISO_H, HW, HH, TW, TH, proj, inDiamond } from './project.js';
import { convertMap } from './convert.js';
import { isoFrameFor, isoSheet, isoFrameForSheet } from './sprites.js';

const warnedFrames = new Set();

const SPRITE_SCALE = 2; // SNES sprites as stand-ins
const SLAB_Z = 64;
// Walls and slabs in front of Cheryl within this far (screen px) of her are cut away.
const CUT_X = 112;
const CUT_Y = 80; // overhead tiles float this high above their floor
const SHADE = { top: 1, south: 0.8, east: 0.62 };

let nextId = 1;
const idOf = (img) => img.__isoId || (img.__isoId = nextId++);

// ---- Texture caches ------------------------------------------------------

const cache = new Map();
function cached(key, make) {
  let c = cache.get(key);
  if (!c) {
    c = make();
    cache.set(key, c);
    if (cache.size > 6000) cache.delete(cache.keys().next().value);
  }
  return c;
}

function canvas(w, h) {
  const c = document.createElement('canvas');
  c.width = Math.max(1, Math.ceil(w));
  c.height = Math.max(1, Math.ceil(h));
  const ctx = c.getContext('2d');
  ctx.imageSmoothingEnabled = false;
  return c;
}

function darken(ctx, w, h, k) {
  if (k >= 1) return;
  ctx.globalCompositeOperation = 'source-atop';
  ctx.fillStyle = `rgba(16, 12, 28, ${1 - k})`;
  ctx.fillRect(0, 0, w, h);
  ctx.globalCompositeOperation = 'source-over';
}

// Several 16×16 tile images drawn over each other.
function composite(imgs) {
  imgs = imgs.filter(Boolean);
  if (imgs.length <= 1) return imgs[0] || null;
  return cached(`c${imgs.map(idOf).join(',')}`, () => {
    const c = canvas(TILE, TILE);
    const ctx = c.getContext('2d');
    for (const i of imgs) ctx.drawImage(i, 0, 0);
    return c;
  });
}

// A tile image sheared onto a 64×32 floor diamond.
function diamond(img, shade = 1) {
  return cached(`d${idOf(img)}:${shade}`, () => {
    const c = canvas(TW, TH);
    const ctx = c.getContext('2d');
    ctx.setTransform(TW / 2 / img.width, TH / 2 / img.height, -TW / 2 / img.height, TH / 2 / img.height, TW / 2, 0);
    ctx.drawImage(img, 0, 0);
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    darken(ctx, TW, TH, shade);
    return c;
  });
}

// A stack of tile images (top to bottom) on a wall face `h` px tall. `side`
// 'south' runs down-right from its left corner, 'east' up-right.
function face(imgs, h, side) {
  const shade = SHADE[side];
  return cached(`f${imgs.map(idOf).join(',')}:${h}:${side}`, () => {
    const c = canvas(HW, HH + h);
    const ctx = c.getContext('2d');
    const per = h / imgs.length;
    imgs.forEach((img, i) => {
      const y0 = i * per;
      // x across the face (img px -> 2 px right, ±1 px down); y down the face.
      if (side === 'south') ctx.setTransform(HW / img.width, HH / img.width, 0, per / img.height, 0, y0);
      else ctx.setTransform(HW / img.width, -HH / img.width, 0, per / img.height, 0, HH + y0);
      ctx.drawImage(img, 0, 0);
    });
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    darken(ctx, c.width, c.height, shade);
    return c;
  });
}

function plainFace(color, h, side) {
  return cached(`p${color}:${h}:${side}`, () => {
    const c = canvas(HW, HH + h);
    const ctx = c.getContext('2d');
    ctx.fillStyle = color;
    ctx.beginPath();
    if (side === 'south') { ctx.moveTo(0, 0); ctx.lineTo(HW, HH); ctx.lineTo(HW, HH + h); ctx.lineTo(0, h); }
    else { ctx.moveTo(0, HH); ctx.lineTo(HW, 0); ctx.lineTo(HW, h); ctx.lineTo(0, HH + h); }
    ctx.fill();
    darken(ctx, c.width, c.height, SHADE[side]);
    return c;
  });
}

let shadowImg = null;
function shadow() {
  if (shadowImg) return shadowImg;
  shadowImg = canvas(28, 12);
  const ctx = shadowImg.getContext('2d');
  ctx.fillStyle = 'rgba(32, 24, 40, 0.38)';
  ctx.beginPath();
  ctx.ellipse(14, 6, 13, 5, 0, 0, Math.PI * 2);
  ctx.fill();
  return shadowImg;
}

// ---- The renderer --------------------------------------------------------

export class IsoRenderer {
  constructor() {
    this.hits = [];
    this.modelFor = null;
    this.hidden = new Set(); // entity ids the map's scene draws itself
  }

  // The map's isometric description, rebuilt when the map or its tiles change.
  model(world) {
    const m = world.map;
    if (this.modelFor !== m || this.modelVer !== (m.version || 0)) {
      this.modelFor = m;
      this.modelVer = m.version || 0;
      this.iso = convertMap(m, world.mapDef);
      this.ox = m.h * HW;
    }
    return this.iso;
  }

  // Height of the walkable surface at grid point (gx, gy).
  floorZ(world, gx, gy) {
    const iso = this.model(world);
    const fl = world.mapDef.iso && world.mapDef.iso.floor;
    if (fl && this.sceneReady(world)) return fl(Math.floor(gx), Math.floor(gy), world.api) ?? 0;
    const c = iso.at(Math.floor(gx), Math.floor(gy));
    if (!c) return 0;
    return c.kind === 'block' ? c.z + c.h : c.z; // (a door's floor is its z)
  }

  // Top of a cell (floor height, or a block's top).
  top(c) {
    if (!c) return null;
    if (c.kind === 'void') return null;
    return c.kind === 'block' || c.kind === 'door' ? c.z + c.h : c.z;
  }

  // Screen (map space) point for a world-pixel position.
  worldToMap(world, wx, wy) {
    const gx = wx / TILE;
    const gy = wy / TILE;
    return proj(gx, gy, this.floorZ(world, gx, gy), this.ox);
  }

  bounds(world) {
    const iso = this.model(world);
    const b = { x0: 0, x1: (iso.w + iso.h) * HW, y0: -iso.maxZ - 16, y1: (iso.w + iso.h) * HH + 16 };
    // A hand-built scene: as high and as low as its pieces reach (a hill's
    // top at z 1120, a stair going down below the map's last row).
    const scene = this.sceneFor(world);
    if (scene) {
      if (this.sceneCache.bounds) return this.sceneCache.bounds;
      let y0 = Infinity;
      let y1 = -Infinity;
      for (const d of scene) {
        const sheet = isoSheet(d.s);
        const name = sheet && (sheet.m.anims && sheet.m.anims[d.f] ? sheet.m.anims[d.f].frames[0] : d.f);
        const f = sheet && sheet.raw(name);
        if (!f) continue;
        const q = proj(d.x, d.y, d.z, this.ox);
        y0 = Math.min(y0, q.y - f.ay);
        y1 = Math.max(y1, q.y - f.ay + f.h);
      }
      if (y0 < Infinity) {
        b.y0 = Math.min(b.y0, y0 - 16);
        b.y1 = Math.max(b.y1, y1 + 16);
      }
      this.sceneCache.bounds = b;
    }
    return b;
  }

  // Tile images for a cell, by layer (current animation frames).
  images(world, x, y, ms) {
    const m = world.map;
    const g = m.tile('ground', x, y);
    const d = m.tile('detail', x, y);
    const o = m.tile('overhead', x, y);
    return { g: g && g.image(x, y, ms), d: d && d.image(x, y, ms), o: o && o.image(x, y, ms) };
  }

  ref(world, value, x, y, ms) {
    if (value == null) return null;
    const t = world.map.tileset.resolve(value);
    return t ? t.image(x, y, ms) : null;
  }

  draw(ctx, world) {
    const iso = this.model(world);
    const ms = (world.tick * 1000) / 60;
    const [sx, sy] = world.effects.shakeOffset();
    const cx = world.cam.x - Math.round(sx * 2.5);
    const cy = world.cam.y - Math.round(sy * 2.5);
    this.cx = cx;
    this.cy = cy;
    const bg = world.mapDef.background ? colorOf(world.mapDef.background) : '#000000';
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, ISO_W, ISO_H);

    // What to draw: cells, entities, slabs, each with a depth key.
    const items = [];
    const ox = this.ox;
    // Cull to cells whose diamond could reach the screen.
    const scene = this.sceneFor(world);
    if (scene) {
      for (const d of scene) {
        const k = d.x0 + d.fw - 1 + d.y0 + d.fd - 1;
        // Floors and decals on them (layer < 0.1) go down before anything stands on them.
        if (d.layer < 0.1) { items.push({ type: 'd', key: -1e6 + d.layer * 1e5 + k, order: 0, d }); continue; }
        // Pieces up to two tiles long sort whole by their front corner (a pent
        // roof's eave then stays over the wall beside it).
        if (Math.max(d.fw, d.fd) < 3) { items.push({ type: 'd', key: k, order: d.layer, d }); continue; }
        // A long piece (three tiles or more) is drawn in 32 px screen columns, one per
        // diagonal of its footprint, each sorted by its own front tile, so a
        // long back line or a tower sorts right against people beside it.
        const ac = d.x - d.y; // the anchor's column (x - y), in tiles
        const c0 = d.x0 - (d.y0 + d.fd - 1);
        const c1 = d.x0 + d.fw - 1 - d.y0;
        for (let c = c0; c <= c1; c++) {
          let key = -Infinity;
          for (let y = d.y0; y < d.y0 + d.fd; y++) {
            const x = c + y;
            if (x >= d.x0 && x < d.x0 + d.fw) key = Math.max(key, x + y);
          }
          const mid = (c - ac) * HW; // the column's center, from the anchor, in px
          items.push({ type: 'd', key, order: d.layer, d, strip: [c === c0 ? -1e4 : mid - HW / 2, c === c1 ? 1e4 : mid + HW / 2] });
        }
      }
    }
    for (const c of scene ? iso.cells.filter((c) => this.netCells?.has(`${c.x},${c.y}`)) : iso.cells) {
      const T = this.top(c);
      if (T == null) continue;
      const p = proj(c.x, c.y, T, ox);
      if (p.x + HW < cx - TW || p.x - HW > cx + ISO_W + TW) continue;
      if (p.y > cy + ISO_H + 200 || p.y + TH + 400 < cy) continue;
      items.push({ type: 'cell', key: c.x + c.y, order: 0, c, T });
      if (c.over && c.kind !== 'block') items.push({ type: 'slab', key: c.x + c.y, order: 2, c });
    }
    for (const pr of scene ? iso.props.filter((p) => p.cells.some((c) => this.netCells?.has(`${c.x},${c.y}`))) : iso.props) items.push({ type: 'prop', key: pr.x1 + pr.y1, order: 1, pr });
    const p = world.player;
    for (const e of world.entities) {
      if (!e.visible) continue;
      const k1 = e.x + e.w - 1 + e.y + e.h - 1;
      const k0 = e.fromX + e.w - 1 + e.fromY + e.h - 1;
      items.push({ type: 'ent', key: Math.max(k0, k1), order: e.layer === 'ground' ? -0.5 : 1.5, e });
    }
    for (const fx of world.ambient.effects) {
      items.push({ type: 'fx', key: Math.floor(fx.x / TILE) + Math.floor(fx.y / TILE), order: fx.layer === 'ground' ? -0.4 : 1.5, fx });
    }
    items.sort((a, b) => a.key - b.key || a.order - b.order || this.screenY(world, a) - this.screenY(world, b));

    // Cut-away: blocks and slabs in front of Cheryl that cover her are drawn
    // low (or not at all), as the era's games did with walls.
    const pr = this.entityRect(world, p);
    const pk = Math.max(p.x + p.y, p.fromX + p.fromY);
    const pz = this.floorZ(world, p.px / TILE + 0.5, p.py / TILE + 0.5);
    const cut = new Set();
    if (pr && p.visible) {
      // The area around her, so the floor she'd walk or click on next shows too.
      const zone = { x: pr.x - CUT_X, y: pr.y - CUT_Y, w: pr.w + 2 * CUT_X, h: pr.h + 2 * CUT_Y };
      const near = { x: pr.x - 24, y: pr.y - 16, w: pr.w + 48, h: pr.h + 32 }; // a hand-built scene's walls: just around her
      for (const it of items) {
        if (it.type === 'd') {
          // A wall or roof (layer < 1) in front of her, near her, fades
          // while she's behind it. In front means its whole footprint is at
          // or past hers on both axes (side by side, or behind, it isn't).
          // Props don't fade: she shows through them instead (drawGhost).
          const d = it.d;
          if (d.layer < 0.1 || d.layer >= 1 || !d.rect || d.fade === false) continue;
          if (!(d.x0 >= p.x && d.y0 >= p.y) || (d.x0 === p.x && d.y0 === p.y && d.fw === 1 && d.fd === 1)) continue;
          if (d.topZ != null && d.topZ <= pz + 48) continue; // too low to hide her (a floor, a low wall)
          if (overlap(d.rect, near)) cut.add(it);
          continue;
        }
        if (it.type !== 'cell' && it.type !== 'slab') continue;
        if (it.key <= pk) continue;
        const r = this.cellRect(it);
        if (r && overlap(r, zone)) cut.add(it);
      }
    }

    // Her outline shows through things that cover her body, not just her
    // feet (a parapet in front of her hides her feet, as it should).
    const body = pr && { x: pr.x, y: pr.y, w: pr.w, h: Math.round(pr.h * 0.6) };
    this.hits = [];
    let hidden = false;
    let drawnPlayer = false;
    let shadowsDone = !scene;
    for (const it of items) {
      // Every cast shadow goes down after the floors and before anything
      // stands on them, so no floor tile paints over one.
      if (!shadowsDone && !(it.type === 'd' && it.d.layer < 0.1)) {
        this.drawShadows(ctx, world, items, ms, cut);
        shadowsDone = true;
      }
      if (it.type === 'd') {
        this.drawDrawable(ctx, it.d, ms, cut.has(it), it.strip);
        // A prop drawn over her: her outline shows through it.
        if (drawnPlayer && body && it.d.layer >= 1 && it.d.rect && overlap(stripRect(it.d.rect, it.strip), body)) hidden = true;
      }
      else if (it.type === 'cell') this.drawCell(ctx, world, it, ms, cut.has(it));
      else if (it.type === 'slab') { if (!cut.has(it)) this.drawSlab(ctx, world, it.c, ms); }
      else if (it.type === 'fx') this.drawFx(ctx, world, it.fx);
      else if (it.type === 'prop') {
        this.drawProp(ctx, world, it.pr, ms);
        if (drawnPlayer && body && it.pr.rect && overlap(it.pr.rect, body)) hidden = true;
      }
      else {
        this.drawEntity(ctx, world, it.e, ms);
        if (it.e === p) drawnPlayer = true;
        else if (drawnPlayer && body && it.e.isoRect && overlap(it.e.isoRect, body)) hidden = true;
      }
    }
    this.drawMarker(ctx, world);
    // Anything else in front of her (another character): her outline shows through.
    if (hidden && pr) this.drawGhost(ctx, p);
  }

  screenY(world, it) {
    if (it.type === 'ent') return it.e.py;
    if (it.type === 'fx') return it.fx.y;
    if (it.type === 'prop') return it.pr.y1 * TILE;
    if (it.type === 'd') return it.d.y * TILE;
    return it.c.y * TILE;
  }

  cellRect(it) {
    const c = it.c;
    if (it.type === 'slab') {
      const q = proj(c.x, c.y, c.z + SLAB_Z, this.ox);
      return { x: q.x - HW - this.cx, y: q.y - this.cy, w: TW, h: TH };
    }
    if ((c.kind !== 'block' && c.kind !== 'door') || c.h < 20) return null;
    const q = proj(c.x, c.y, c.z + c.h, this.ox);
    return { x: q.x - HW - this.cx, y: q.y - this.cy, w: TW, h: TH + c.h };
  }

  // Screen rect where an entity is drawn (from the last frame), or a guess.
  entityRect(world, e) {
    return e.isoRect || null;
  }

  drawCell(ctx, world, it, ms, cutAway) {
    const { c } = it;
    let T = it.T;
    const { x, y } = c;
    const iso = this.iso;
    const im = this.images(world, x, y, ms);
    const o = c.override || {};
    let topImg = 'top' in o ? this.ref(world, o.top, x, y, ms) : composite(c.prop ? [im.g] : [im.g, im.d]);
    let faceImgs = null;
    const wall = (k) => k === 'block' || k === 'door';
    if (wall(c.kind)) {
      // The wall face shows the block's SNES face rows (the bottom of its
      // run in this column), the top shows the roof (the run's top) or the
      // raised floor it holds up.
      const run = [];
      let yy = y;
      while (iso.at(x, yy) && wall(iso.at(x, yy).kind) && !iso.at(x, yy).low) run.push(yy++);
      let y0 = y;
      while (iso.at(x, y0 - 1) && wall(iso.at(x, y0 - 1).kind) && !iso.at(x, y0 - 1).low) y0--;
      const all = [];
      for (let k = y0; k < yy; k++) all.push(k);
      const rows = Math.max(1, Math.min(all.length, Math.round(c.h / 32) || 1));
      const faceRows = all.slice(-rows);
      faceImgs = faceRows.map((k) => {
        const i = this.images(world, x, k, ms);
        return composite([i.g, i.d]);
      }).filter(Boolean);
      if ('south' in o) faceImgs = [this.ref(world, o.south, x, y, ms)].filter(Boolean);
      if (!('top' in o) && faceRows.includes(y)) {
        const north = iso.at(x, y0 - 1);
        const above = all.length > rows ? this.images(world, x, all[all.length - rows - 1], ms) : null;
        if (above) topImg = composite([above.g, above.d]);
        else if (north && north.kind !== 'void' && north.kind !== 'block') {
          const n = this.images(world, x, y0 - 1, ms);
          topImg = composite([n.g]);
        }
      }
    }
    // Cut away: a wall in front of Cheryl drawn as a low stub. Walls along
    // the map's front edges (nothing beyond them to the south or east) are
    // always low, so they don't hide the room.
    if (cutAway && wall(c.kind)) T = c.z + Math.min(c.h, 10);
    else if (wall(c.kind) && c.front) T = c.z + Math.min(c.h, 16);
    const ox = this.ox;
    const cx = this.cx;
    const cy = this.cy;
    const q = proj(x, y, T, ox); // top corner of the top diamond
    // Faces down to the neighbors' tops (south: lower-left, east: lower-right).
    const south = this.top(iso.at(x, y + 1));
    const east = this.top(iso.at(x + 1, y));
    const sh = T - (south == null ? Math.min(0, c.z) : Math.min(south, T));
    const eh = T - (east == null ? Math.min(0, c.z) : Math.min(east, T));
    const sideImgs = faceImgs && faceImgs.length ? faceImgs : topImg ? [topImg] : null;
    if (sh > 0) {
      const img = sideImgs ? face(sideImgs, Math.round(sh), 'south') : plainFace('#403850', Math.round(sh), 'south');
      ctx.drawImage(img, q.x - HW - cx, q.y + HH - cy);
    }
    if (eh > 0) {
      const img = sideImgs ? face(sideImgs, Math.round(eh), 'east') : plainFace('#403850', Math.round(eh), 'east');
      ctx.drawImage(img, q.x - cx, q.y + HH - cy);
    }
    if (cutAway && wall(c.kind)) {
      // A cut-away wall's stub shows its own top, dimmed.
      ctx.drawImage(topImg ? diamond(topImg, 0.55) : plainTop(), q.x - HW - cx, q.y - cy);
    } else if (topImg) {
      ctx.drawImage(diamond(topImg), q.x - HW - cx, q.y - cy);
    }
    this.hits.push({ type: 'cell', c, T, sh, eh });
  }

  // ---- Hand-described maps (map.iso.scene) ----

  // Are the scene's art sheets loaded? (Until then, the converter's draft.)
  sceneReady(world) {
    const def = world.mapDef.iso;
    if (!def || !def.scene) return false;
    if (this.sceneSheetsFor !== def) {
      this.sceneSheetsFor = def;
      this.sceneSheets = null;
    }
    if (!this.sceneSheets) {
      const names = new Set(safeCall(def.scene, world.api).map((d) => d.s));
      this.sceneSheets = [...names].map((n) => isoSheet(n)).filter(Boolean);
    }
    return this.sceneSheets.every((s) => s.ready);
  }

  // The scene's drawables for the current flags (cached until a flag changes).
  sceneFor(world) {
    if (!this.sceneReady(world)) {
      this.hidden = new Set();
      return null;
    }
    // Scenes follow the flags (and the player's pose: Cheryl seated on the tub).
    // ...and the map's run-time tile changes (g.setTile).
    const key = JSON.stringify(world.state.flags) + (world.player.pose || '') + (world.map.version || 0);
    if (this.sceneCache && this.sceneCache.def === world.mapDef.iso && this.sceneCache.key === key) return this.sceneCache.list;
    const iso = world.mapDef.iso;
    const norm = (d) => {
      const fw = d.fw || 1;
      const fd = d.fd || 1;
      return { ...d, fw, fd, x0: Math.round(d.x - fw / 2), y0: Math.round(d.y - fd / 2), z: d.z || 0, layer: d.layer ?? 1 };
    };
    let list = safeCall(iso.scene, world.api) || [];
    // Later acts extend an earlier act's scene for the maps they change:
    // iso.extend: [(g, drawables, kit) => drawables].
    for (const fn of iso.extend || []) list = safeCall(fn, world.api, list, sceneKit()) || list;
    list = list.map(norm);
    // The safety net: cells whose tiles differ from what the scene was built
    // for (a later act's patch, variant, or overlay) drop the scene's pieces
    // and show the converter's version instead.
    this.netCells = this.changedCells(world);
    if (this.netCells.size) list = list.filter((d) => !footprint(d).some((k) => this.netCells.has(k)));
    this.sceneCache = { def: world.mapDef.iso, key, list };
    // Entities the scene draws itself (their own sprites are hidden).
    let hide = world.mapDef.iso.hide || [];
    if (typeof hide === 'function') hide = safeCall(hide, world.api) || [];
    this.hidden = new Set(hide);
    return list;
  }

  // Cells whose tiles differ from the map as its scene knows it: the map
  // rebuilt with only the flags the scene follows (iso.follows: names, or
  // prefixes ending in '*'). Without `follows`, nothing is checked.
  changedCells(world) {
    const out = new Set();
    const follows = world.mapDef.iso.follows;
    if (!follows) return out;
    const keep = (name) => follows.some((f) => (f.endsWith('*') ? name.startsWith(f.slice(0, -1)) : name === f));
    const all = world.state.flags;
    const saved = { variant: world.variant, map: world.map, patched: world.patched };
    let base;
    try {
      world.state.flags = Object.fromEntries(Object.entries(all).filter(([k]) => keep(k)));
      world.variant = world.pickVariant(world.mapDef);
      world.map = new TileMap(world.layerDef());
      world.patched = [];
      const fn = world.mapDef.patches;
      for (const [layer, x0, y0, value, w = 1, h = 1] of (fn && safeCall(fn, world.api)) || []) {
        for (let y = y0; y < y0 + h; y++) for (let x = x0; x < x0 + w; x++) world.map.setTile(layer, x, y, value);
      }
      base = world.map;
    } finally {
      world.state.flags = all;
      Object.assign(world, saved);
    }
    const now = world.map;
    const name = (m, l, x, y) => { const t = m.tile(l, x, y); return t ? t.name : ''; };
    for (let y = 0; y < now.h; y++) {
      for (let x = 0; x < now.w; x++) {
        const same = ['ground', 'detail', 'overhead'].every((l) => name(base, l, x, y) === name(now, l, x, y)) && base.solid(x, y) === now.solid(x, y);
        if (!same) out.add(`${x},${y}`);
      }
    }
    return out;
  }

  // One drawable: its frame (or animation) with its anchor on the
  // footprint's center at its base height, its cast shadow first.
  drawDrawable(ctx, d, ms, faded, strip = null) {
    const sheet = isoSheet(d.s);
    if (!sheet) return;
    const f = sheet.m.anims && sheet.m.anims[d.f] ? sheet.frameAt(d.f, ms) : sheet.frame(d.f);
    if (!f) {
      if (!warnedFrames.has(`${d.s}:${d.f}`)) { warnedFrames.add(`${d.s}:${d.f}`); console.warn(`[iso art] no frame ${d.s}:${d.f}`); }
      return;
    }
    const q = proj(d.x, d.y, d.z, this.ox);
    const x = q.x - this.cx;
    const y = q.y - this.cy;
    if (faded) ctx.globalAlpha = 0.35;
    if (strip) {
      // One screen column of it: image x from the anchor's column.
      const sx0 = Math.max(0, Math.round(f.ax + strip[0]));
      const sx1 = Math.min(f.img.width, Math.round(f.ax + strip[1]));
      if (sx1 > sx0) ctx.drawImage(f.img, sx0, 0, sx1 - sx0, f.img.height, Math.round(x - f.ax) + sx0, Math.round(y - f.ay), sx1 - sx0, f.img.height);
    } else drawAnchored(ctx, f, x, y);
    ctx.globalAlpha = 1;
    d.topZ = d.z + (f.hpx || Math.max(0, f.ay - HH)); // how high it rises
    d.rect = { anchorX: f.ax, x: Math.round(x - f.ax), y: Math.round(y - f.ay), w: f.img.width, h: f.img.height, img: f.img, flip: false, scale: 1 };
    if (!faded || d.layer < 0.1) this.hits.push({ type: 'd', d, rect: d.rect, strip });
  }

  // The shadow pass: drawables' and characters' cast shadows.
  drawShadows(ctx, world, items, ms, cut) {
    for (const it of items) {
      if (cut.has(it)) continue;
      if (it.type === 'd') {
        if (it.d.layer < 0.1) continue;
        const sheet = isoSheet(it.d.s);
        if (!sheet) continue;
        const f = sheet.m.anims && sheet.m.anims[it.d.f] ? sheet.frameAt(it.d.f, ms) : sheet.frame(it.d.f);
        const sh = f && sheet.frame(`${f.name}.shadow`);
        if (!sh) continue;
        const q = proj(it.d.x, it.d.y, it.d.z, this.ox);
        drawAnchored(ctx, sh, q.x - this.cx, q.y - this.cy);
      } else if (it.type === 'ent') {
        const e = it.e;
        if (!e.visible || e.def.shadow === false || e.def.iso === false || this.hidden.has(e.id)) continue;
        const f = isoFrameFor(e);
        if (!f || !f.shadow) continue;
        const b = this.entityBase(world, e);
        drawAnchored(ctx, f.shadow, b.x, b.y, f.flip);
      }
    }
  }

  // Where an entity's anchor (the footprint's center at its floor) is on screen.
  entityBase(world, e) {
    const gx = e.px / TILE + e.w / 2;
    const gy = e.py / TILE + e.h / 2;
    const zFrom = this.floorZ(world, e.fromX + e.w / 2, e.fromY + e.h / 2);
    const zTo = this.floorZ(world, e.x + e.w / 2, e.y + e.h / 2);
    const k = e.moving ? e.t / e.stepTicks : 1;
    const q = proj(gx, gy, Math.round(zFrom + (zTo - zFrom) * k), this.ox);
    return { x: q.x - this.cx, y: q.y - this.cy };
  }

  // The tile of a drawable's footprint nearest a map-space point.
  cellUnder(d, mx, my) {
    let best = null;
    let bestD = Infinity;
    for (let y = d.y0; y < d.y0 + d.fd; y++) {
      for (let x = d.x0; x < d.x0 + d.fw; x++) {
        const q = proj(x + 0.5, y + 0.5, d.z, this.ox);
        const dist = Math.hypot((q.x - mx) / 2, q.y - my);
        if (dist < bestD) { bestD = dist; best = { x, y }; }
      }
    }
    return best;
  }

  // A prop: its SNES detail tiles put back together, upright, at 2×.
  drawProp(ctx, world, pr, ms) {
    const w = pr.x1 - pr.x0 + 1;
    const h = pr.y1 - pr.y0 + 1;
    const imgs = [];
    for (const c of pr.cells) imgs.push([c, this.images(world, c.x, c.y, ms).d]);
    const key = `prop${imgs.map(([, i]) => (i ? idOf(i) : 0)).join(',')}`;
    const img = cached(key, () => {
      const cv = canvas(w * TILE, h * TILE);
      const g = cv.getContext('2d', { willReadFrequently: true });
      for (const [c, i] of imgs) if (i) g.drawImage(i, (c.x - pr.x0) * TILE, (c.y - pr.y0) * TILE);
      return cv;
    });
    const base = proj((pr.x0 + pr.x1 + 1) / 2, pr.y1 + 0.5, pr.z, this.ox);
    const k = SPRITE_SCALE;
    const x = Math.round(base.x - (img.width * k) / 2 - this.cx);
    const y = Math.round(base.y + 6 - img.height * k - this.cy);
    ctx.drawImage(img, x, y, img.width * k, img.height * k);
    pr.rect = { x, y, w: img.width * k, h: img.height * k, img, flip: false, scale: k };
    this.hits.push({ type: 'prop', pr, rect: pr.rect });
  }

  drawSlab(ctx, world, c, ms) {
    const o = c.override || {};
    const img = 'over' in o ? this.ref(world, o.over, c.x, c.y, ms) : this.images(world, c.x, c.y, ms).o;
    if (!img) return;
    const q = proj(c.x, c.y, c.z + SLAB_Z, this.ox);
    ctx.drawImage(diamond(img), q.x - HW - this.cx, q.y - this.cy);
  }

  drawEntity(ctx, world, e, ms) {
    e.isoRect = null;
    const gx = e.px / TILE + e.w / 2;
    const gy = e.py / TILE + e.h / 2;
    // Height: interpolate between the tiles she's stepping from and to.
    const zFrom = this.floorZ(world, e.fromX + e.w / 2, e.fromY + e.h / 2);
    const zTo = this.floorZ(world, e.x + e.w / 2, e.y + e.h / 2);
    const k = e.moving ? e.t / e.stepTicks : 1;
    const z = Math.round(zFrom + (zTo - zFrom) * k);
    const base = proj(gx, gy, z, this.ox);
    const bx = base.x - this.cx;
    const by = base.y - this.cy;
    if (e.def.iso === false) return; // drawn by the map's scene instead (still there to click)
    let f = e.visible && !this.hidden.has(e.id) ? isoFrameFor(e) : null;
    let scale = 1;
    let drop = 0;
    if (f) {
      // Isometric art: its own cast shadow, under it (in a scene, the shadow pass drew it).
      if (f.shadow && e.def.shadow !== false && !this.sceneCache?.list) drawAnchored(ctx, f.shadow, bx, by, f.flip);
    } else {
      if (this.hidden.has(e.id)) return; // the map's scene draws it
      if (e.directional && e.def.shadow !== false) ctx.drawImage(shadow(), Math.round(bx - 14), Math.round(by - 6));
      const sf = e.art && e.currentFrame();
      if (!sf || !sf.img) return;
      f = { img: sf.img, flip: sf.flip, ax: sf.img.width / 2, ay: sf.img.height };
      scale = SPRITE_SCALE;
      // SNES sprites stand at the bottom of their tile: feet a little below its center.
      drop = e.directional ? 6 : (e.h * TH) / 4;
    }
    const w = f.img.width * scale;
    const h = f.img.height * scale;
    // A flipped frame mirrors its anchor too.
    const x = Math.round(bx - (f.flip ? f.img.width - f.ax : f.ax) * scale);
    const y = Math.round(by - f.ay * scale + drop);
    ctx.save();
    if (e.clipBelow) {
      ctx.beginPath();
      ctx.rect(0, 0, ISO_W, by + 4);
      ctx.clip();
    }
    if (f.flip) {
      ctx.scale(-1, 1);
      ctx.drawImage(f.img, -x - w, y, w, h);
    } else {
      ctx.drawImage(f.img, x, y, w, h);
    }
    ctx.restore();
    e.isoRect = { x, y, w, h, img: f.img, flip: f.flip, scale };
    this.hits.push({ type: 'ent', e, rect: e.isoRect });
  }

  drawGhost(ctx, e) {
    const r = e.isoRect;
    if (!r) return;
    ctx.save();
    ctx.globalAlpha = 0.45;
    if (r.flip) {
      ctx.scale(-1, 1);
      ctx.drawImage(r.img, -r.x - r.w, r.y, r.w, r.h);
    } else ctx.drawImage(r.img, r.x, r.y, r.w, r.h);
    ctx.restore();
  }

  drawFx(ctx, world, fx) {
    const ms = fx.t * (1000 / 60);
    const q = this.worldToMap(world, fx.x + fx.offset[0], fx.y + fx.offset[1] + (fx.lift || 0) * TILE);
    // The art's version, standing at its point (raised by the effect's z, in px).
    const art = isoFrameForSheet(fx.art.sheet, fx.frame, ms);
    if (art) {
      drawAnchored(ctx, art, q.x - this.cx, q.y - (fx.z || 0) - this.cy);
      return;
    }
    const img = fx.art.frameAt(fx.frame, ms);
    if (!img) return;
    ctx.drawImage(img, Math.round(q.x - img.width - this.cx), Math.round(q.y - img.height - this.cy), img.width * 2, img.height * 2);
  }

  drawMarker(ctx, world) {
    const m = world.marker;
    if (!m) return;
    m.t++;
    if (m.t > 14 && !m.persist) return;
    const z = this.top(this.iso.at(m.x, m.y)) ?? 0;
    const c = proj(m.x + 0.5, m.y + 0.5, z, this.ox);
    const k = m.t < 8 ? 1 - m.t / 16 : 0.5 + 0.1 * Math.sin(m.t / 4);
    ctx.save();
    ctx.strokeStyle = '#f8d870';
    ctx.lineWidth = 2;
    ctx.beginPath();
    const x = c.x - this.cx;
    const y = c.y - this.cy;
    ctx.moveTo(x, y - HH * k);
    ctx.lineTo(x + HW * k, y);
    ctx.lineTo(x, y + HH * k);
    ctx.lineTo(x - HW * k, y);
    ctx.closePath();
    ctx.stroke();
    ctx.restore();
  }

  // What's under a screen point: the front-most interactable entity, and the tile.
  pick(world, sx, sy) {
    const mx = sx + world.cam.x;
    const my = sy + world.cam.y;
    let tile = null;
    let entity = null;
    for (let i = this.hits.length - 1; i >= 0; i--) {
      const h = this.hits[i];
      if (h.type === 'd') {
        if (tile || !hitRect(h.rect, sx, sy)) continue;
        // A piece that stands for an entity (pick: 'ferry'): clicks on it reach that entity.
        if (h.d.pick && !entity) {
          const pe = world.entity(h.d.pick);
          if (pe && pe.visible && isInteractable(pe)) entity = pe;
        }
        if (h.strip) {
          const local = sx - (h.rect.x + h.rect.anchorX); // from the anchor's column
          if (local < h.strip[0] || local >= h.strip[1]) continue;
        }
        tile = this.cellUnder(h.d, mx, my);
        continue;
      }
      if (h.type === 'prop') {
        if (tile || !hitRect(h.rect, sx, sy)) continue;
        // The prop's cell under the pointer's column (front row first).
        const col = Math.floor(((sx - h.rect.x) / h.rect.w) * (h.pr.x1 - h.pr.x0 + 1));
        const cands = h.pr.cells.filter((c) => c.x === h.pr.x0 + col);
        tile = (cands.length ? cands : h.pr.cells).reduce((a, b) => (b.y > a.y ? b : a));
        continue;
      }
      if (h.type === 'ent') {
        const e = h.e;
        if (entity || e.isPlayer || !isInteractable(e) || !world.entities.includes(e)) continue;
        if (hitRect(h.rect, sx, sy)) entity = e;
        continue;
      }
      if (tile) continue;
      const c = h.c;
      if (inDiamond(mx, my, c.x, c.y, h.T, this.ox) || inFace(mx, my, c, h, this.ox)) tile = c;
      if (tile && entity) break;
    }
    // A click that just misses a character's pixels (a running Kid) still
    // reaches the character before the tile behind them.
    if (!entity) {
      let best = null;
      let bestD = 10;
      for (const e of world.entities) {
        const r = e.isoRect;
        if (!r || e.isPlayer || !e.visible || !e.directional || !isInteractable(e)) continue;
        const dx = Math.max(r.x - sx, 0, sx - (r.x + r.w));
        const dy = Math.max(r.y - sy, 0, sy - (r.y + r.h));
        const d = Math.max(dx, dy);
        if (d < bestD) { bestD = d; best = e; }
      }
      if (best) entity = best;
    }
    if (!entity && tile) {
      const list = world.entities.filter((e) => !e.isPlayer && e.visible && isInteractable(e) && e.occupies(tile.x, tile.y) && !e.moving);
      entity = world.pickEntity(list) || null;
    }
    return { entity, tx: tile ? tile.x : null, ty: tile ? tile.y : null };
  }
}

function plainTop() {
  return cached('plainTop', () => {
    const c = canvas(TW, TH);
    const ctx = c.getContext('2d');
    ctx.fillStyle = '#28203a';
    ctx.beginPath();
    ctx.moveTo(HW, 0); ctx.lineTo(TW, HH); ctx.lineTo(HW, TH); ctx.lineTo(0, HH);
    ctx.fill();
    return c;
  });
}

// A frame { img, ax, ay } with its anchor at (x, y), optionally mirrored.
function drawAnchored(ctx, f, x, y, flip = false) {
  const dx = Math.round(x - (flip ? f.img.width - f.ax : f.ax));
  const dy = Math.round(y - f.ay);
  if (!flip) { ctx.drawImage(f.img, dx, dy); return; }
  ctx.save();
  ctx.scale(-1, 1);
  ctx.drawImage(f.img, -dx - f.img.width, dy);
  ctx.restore();
}

// The tiles a drawable stands on, as 'x,y' keys.
function footprint(d) {
  const out = [];
  for (let y = d.y0; y < d.y0 + d.fd; y++) for (let x = d.x0; x < d.x0 + d.fw; x++) out.push(`${x},${y}`);
  return out;
}

// Helpers for building drawables (what iso.extend functions receive).
function sceneKit() {
  const add = (list, s, f, x, y, z = 0, fw = 1, fd = 1, layer = 1) => {
    const d = { s, f, x: x + fw / 2, y: y + fd / 2, z, fw, fd, layer };
    list.push(d);
    return d;
  };
  return {
    // A piece on tile (x, y)'s footprint (top-left tile, like the scenes' add()).
    add,
    // A wall column: face pieces [frame, heightPx] stacked from z0, then its top [frame, z].
    column(list, s, x, y, z0, sFaces = [], eFaces = [], top = null) {
      let z = z0;
      for (const [f, h] of sFaces) { add(list, s, f, x, y, z, 1, 1, 0.1); z += h; }
      z = z0;
      for (const [f, h] of eFaces) { add(list, s, f, x, y, z, 1, 1, 0.1); z += h; }
      if (top) add(list, s, top[0], x, y, top[1], 1, 1, 0.2);
    },
    // Remove the pieces standing on any of these tiles ([[x, y], ...]).
    clear(list, tiles) {
      const keys = new Set(tiles.map(([x, y]) => `${x},${y}`));
      return list.filter((d) => {
        const fw = d.fw || 1;
        const fd = d.fd || 1;
        const x0 = Math.round(d.x - fw / 2);
        const y0 = Math.round(d.y - fd / 2);
        for (let y = y0; y < y0 + fd; y++) for (let x = x0; x < x0 + fw; x++) if (keys.has(`${x},${y}`)) return false;
        return true;
      });
    },
  };
}

// The part of a drawable's rect in one of its screen columns.
function stripRect(r, strip) {
  if (!strip) return r;
  const ax = r.x + (r.anchorX || 0);
  const x0 = Math.max(r.x, ax + strip[0]);
  const x1 = Math.min(r.x + r.w, ax + strip[1]);
  return { x: x0, y: r.y, w: Math.max(0, x1 - x0), h: r.h };
}

function overlap(a, b) {
  return a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h;
}

function hitRect(r, x, y) {
  if (x < r.x || y < r.y || x >= r.x + r.w || y >= r.y + r.h) return false;
  let ix = Math.floor((x - r.x) / r.scale);
  const iy = Math.floor((y - r.y) / r.scale);
  if (r.flip) ix = r.img.width - 1 - ix;
  return opaqueNear(r.img, ix, iy, 2);
}

const alphaCache = new WeakMap();
function opaqueNear(img, x, y, r) {
  let a = alphaCache.get(img);
  if (!a) {
    const ctx = img.getContext ? img.getContext('2d') : null;
    if (!ctx) return true;
    const data = ctx.getImageData(0, 0, img.width, img.height).data;
    a = new Uint8Array(img.width * img.height);
    for (let i = 0; i < a.length; i++) a[i] = data[i * 4 + 3] > 0 ? 1 : 0;
    alphaCache.set(img, a);
  }
  for (let yy = y - r; yy <= y + r; yy++) {
    for (let xx = x - r; xx <= x + r; xx++) {
      if (xx >= 0 && yy >= 0 && xx < img.width && yy < img.height && a[yy * img.width + xx]) return true;
    }
  }
  return false;
}

// Is (mx, my) on the south or east face drawn for a cell?
function inFace(mx, my, c, h, ox) {
  const q = proj(c.x, c.y, h.T, ox);
  // South face: x from q.x - HW to q.x; its top edge rises toward the left.
  if (h.sh > 0 && mx >= q.x - HW && mx < q.x) {
    const top = q.y + HH + (mx - (q.x - HW)) / 2;
    if (my >= top && my < top + h.sh) return true;
  }
  if (h.eh > 0 && mx >= q.x && mx < q.x + HW) {
    const top = q.y + TH - (mx - q.x) / 2;
    if (my >= top && my < top + h.eh) return true;
  }
  return false;
}

export { safeCall };
