// The isometric renderer: draws the world's grid as floors, blocks, faces,
// overhead slabs, and characters, sorted back to front; cuts away walls
// that would hide Cheryl; and keeps what it drew for picking.
//
// Until the isometric art lands, tiles are the SNES tiles themselves,
// sheared onto the diamond tops and wall faces, and characters are their
// SNES sprites at 2×. iso/sprites.js swaps in real art per sheet when it
// exists.

import { TILE } from '../tilemap.js';
import { colorOf } from '../art.js';
import { safeCall, isInteractable } from '../world.js';
import { ISO_W, ISO_H, HW, HH, TW, TH, proj, inDiamond } from './project.js';
import { convertMap } from './convert.js';
import { isoFrameFor } from './sprites.js';

const SPRITE_SCALE = 2; // SNES sprites as stand-ins
const SLAB_Z = 64; // overhead tiles float this high above their floor
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
    return { x0: 0, x1: (iso.w + iso.h) * HW, y0: -iso.maxZ - 16, y1: (iso.w + iso.h) * HH + 16 };
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
    for (const c of iso.cells) {
      const T = this.top(c);
      if (T == null) continue;
      const p = proj(c.x, c.y, T, ox);
      if (p.x + HW < cx - TW || p.x - HW > cx + ISO_W + TW) continue;
      if (p.y > cy + ISO_H + 200 || p.y + TH + 400 < cy) continue;
      items.push({ type: 'cell', key: c.x + c.y, order: 0, c, T });
      if (c.over && c.kind !== 'block') items.push({ type: 'slab', key: c.x + c.y, order: 2, c });
    }
    for (const pr of iso.props) items.push({ type: 'prop', key: pr.x1 + pr.y1, order: 1, pr });
    const p = world.player;
    for (const e of world.entities) {
      if (!e.visible) continue;
      const k1 = e.x + e.w - 1 + e.y + e.h - 1;
      const k0 = e.fromX + e.w - 1 + e.fromY + e.h - 1;
      items.push({ type: 'ent', key: Math.max(k0, k1), order: e.layer === 'ground' ? -0.5 : 1, e });
    }
    for (const fx of world.ambient.effects) {
      items.push({ type: 'fx', key: Math.floor(fx.x / TILE) + Math.floor(fx.y / TILE), order: fx.layer === 'ground' ? -0.4 : 1.5, fx });
    }
    items.sort((a, b) => a.key - b.key || a.order - b.order || this.screenY(world, a) - this.screenY(world, b));

    // Cut-away: blocks and slabs in front of Cheryl that cover her are drawn
    // low (or not at all), as the era's games did with walls.
    const pr = this.entityRect(world, p);
    const pk = Math.max(p.x + p.y, p.fromX + p.fromY);
    const cut = new Set();
    if (pr && p.visible) {
      for (const it of items) {
        if (it.type !== 'cell' && it.type !== 'slab') continue;
        if (it.key <= pk) continue;
        const r = this.cellRect(it);
        if (r && overlap(r, pr)) cut.add(it);
      }
    }

    this.hits = [];
    let hidden = false;
    let drawnPlayer = false;
    for (const it of items) {
      if (it.type === 'cell') this.drawCell(ctx, world, it, ms, cut.has(it));
      else if (it.type === 'slab') { if (!cut.has(it)) this.drawSlab(ctx, world, it.c, ms); }
      else if (it.type === 'fx') this.drawFx(ctx, world, it.fx);
      else if (it.type === 'prop') {
        this.drawProp(ctx, world, it.pr, ms);
        if (drawnPlayer && pr && it.pr.rect && overlap(it.pr.rect, pr)) hidden = true;
      }
      else {
        this.drawEntity(ctx, world, it.e, ms);
        if (it.e === p) drawnPlayer = true;
        else if (drawnPlayer && pr && it.e.isoRect && overlap(it.e.isoRect, pr)) hidden = true;
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
      ctx.drawImage(plainTop(), q.x - HW - cx, q.y - cy);
    } else if (topImg) {
      ctx.drawImage(diamond(topImg), q.x - HW - cx, q.y - cy);
    }
    this.hits.push({ type: 'cell', c, T, sh, eh });
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
    if (e.directional && e.def.shadow !== false) ctx.drawImage(shadow(), Math.round(bx - 14), Math.round(by - 6));
    let f = isoFrameFor(e);
    let scale = 1;
    if (!f) {
      const sf = e.art && e.currentFrame();
      if (!sf || !sf.img) return;
      f = { img: sf.img, flip: sf.flip, ax: sf.img.width / 2, ay: sf.img.height };
      scale = SPRITE_SCALE;
    }
    const w = f.img.width * scale;
    const h = f.img.height * scale;
    const x = Math.round(bx - f.ax * scale);
    // Feet a little below the tile's center, as SNES sprites stand at the bottom of their tile.
    const y = Math.round(by - f.ay * scale + (e.directional ? 6 : (e.h * TH) / 4));
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
    const img = fx.art.frameAt(fx.frame, fx.t * (1000 / 60));
    if (!img) return;
    const q = this.worldToMap(world, fx.x + fx.offset[0], fx.y + fx.offset[1]);
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
