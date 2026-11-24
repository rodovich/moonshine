// Entities: the player, NPCs, and interactable objects. Each occupies one or
// more tiles (its footprint, anchored at its top-left tile x,y) and moves one
// tile at a time with smooth pixel interpolation.

import { loadSheet } from './art.js';
import { TILE } from './tilemap.js';

export const DIR_VEC = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] };
export const OPPOSITE = { up: 'down', down: 'up', left: 'right', right: 'left' };

export function dirBetween(ax, ay, bx, by) {
  const dx = bx - ax;
  const dy = by - ay;
  if (Math.abs(dx) > Math.abs(dy)) return dx > 0 ? 'right' : 'left';
  if (dy !== 0) return dy > 0 ? 'down' : 'up';
  return null;
}

const DEFAULT_CYCLE_3 = [1, 0, 2, 0];

export class Entity {
  constructor(def, isPlayer = false) {
    this.def = def;
    this.id = def.id;
    this.name = def.name || null;
    this.isPlayer = isPlayer;
    this.x = def.x;
    this.y = def.y;
    this.w = def.w || 1;
    this.h = def.h || 1;
    this.facing = def.facing || 'down';
    this.solid = def.solid !== undefined ? def.solid : true;
    this.stepTicks = def.stepTicks || (isPlayer ? 8 : 16);
    this.layer = def.layer || 'sprites'; // 'ground' draws under everything that sorts
    this.offset = def.offset || [0, 0];
    this.visible = def.visible !== undefined ? def.visible : true;
    // Movement
    this.moving = false;
    this.fromX = this.x;
    this.fromY = this.y;
    this.t = 0;
    this.walkDist = 0; // pixels walked in the current walk, drives animation
    this.path = null;
    this.onArrive = null;
    this.waitTicks = 0;
    // Animation for static sprites
    this.animTick = 0;
    this.setSprite(def.sprite);
  }

  setSprite(sprite) {
    this.sprite = sprite || null;
    this.art = sprite ? loadSheet(sprite.sheet, sprite.palette) : null;
    this.directional = !!(sprite && !sprite.frame);
    this.staticFrames = sprite && sprite.frame ? this.art.anim(sprite.frame) : null;
    this.cycles = {};
    if (this.directional) {
      for (const d of ['up', 'down', 'left', 'right']) {
        const frames = [];
        for (let i = 0; this.art.has(`${d}_${i}`); i++) frames.push(i);
        this.cycles[d] = frames.length;
      }
    }
    this.walkCycle = sprite?.walk || null;
  }

  occupies(x, y) {
    if (x >= this.x && y >= this.y && x < this.x + this.w && y < this.y + this.h) return true;
    if (this.moving && x >= this.fromX && y >= this.fromY && x < this.fromX + this.w && y < this.fromY + this.h) return true;
    return false;
  }

  // Pixel position of the footprint's top-left corner.
  get px() {
    if (!this.moving) return this.x * TILE;
    return Math.round((this.fromX + (this.x - this.fromX) * (this.t / this.stepTicks)) * TILE);
  }

  get py() {
    if (!this.moving) return this.y * TILE;
    return Math.round((this.fromY + (this.y - this.fromY) * (this.t / this.stepTicks)) * TILE);
  }

  // Bottom edge of the footprint in pixels: the y-sort key.
  get sortY() {
    return this.py + this.h * TILE;
  }

  startStep(dir) {
    const [dx, dy] = DIR_VEC[dir];
    this.facing = dir;
    this.fromX = this.x;
    this.fromY = this.y;
    this.x += dx;
    this.y += dy;
    this.t = 0;
    this.moving = true;
  }

  // Advance movement one tick. Returns true on the tick the step completes.
  updateMove() {
    if (!this.moving) return false;
    this.t++;
    this.walkDist += TILE / this.stepTicks;
    if (this.t >= this.stepTicks) {
      this.moving = false;
      this.fromX = this.x;
      this.fromY = this.y;
      return true;
    }
    return false;
  }

  currentFrame() {
    if (!this.art) return null;
    if (this.staticFrames) {
      const fps = this.sprite.fps || 4;
      const n = this.staticFrames.length;
      return n > 1 ? this.staticFrames[Math.floor(this.animTick / (60 / fps)) % n] : this.staticFrames[0];
    }
    let dir = this.facing;
    let flip = false;
    if (!this.cycles[dir]) {
      if (dir === 'left' && this.cycles.right) { dir = 'right'; flip = true; }
      else if (dir === 'right' && this.cycles.left) { dir = 'left'; flip = true; }
      else dir = 'down';
    }
    const n = this.cycles[dir] || 1;
    let idx = 0;
    if (this.walking && n > 1) {
      const cycle = this.walkCycle || (n === 3 ? DEFAULT_CYCLE_3 : n === 2 ? [1, 0] : [...Array(n).keys()]);
      idx = cycle[Math.floor(this.walkDist / 8) % cycle.length];
    }
    return { img: this.art.frame(`${dir}_${idx}`), flip };
  }

  get walking() {
    return this.moving || this.keepWalking;
  }

  draw(ctx, camX, camY) {
    if (!this.visible || !this.art) return;
    const f = this.currentFrame();
    if (!f) return;
    const img = f.img || f;
    const flip = !!f.flip;
    const x = this.px + (this.w * TILE - img.width) / 2 + this.offset[0] - camX;
    const y = this.py + this.h * TILE - img.height + this.offset[1] - camY;
    const rx = Math.round(x);
    const ry = Math.round(y);
    this.lastDrawn = { x: rx + camX, y: ry + camY, w: img.width, h: img.height, img, flip };
    if (flip) {
      ctx.save();
      ctx.scale(-1, 1);
      ctx.drawImage(img, -rx - img.width, ry);
      ctx.restore();
    } else {
      ctx.drawImage(img, rx, ry);
    }
  }

  // Pixel-accurate hit test against the last drawn frame (world pixels).
  hit(wx, wy) {
    const d = this.lastDrawn;
    if (!d || !this.visible) return false;
    if (wx < d.x || wy < d.y || wx >= d.x + d.w || wy >= d.y + d.h) return false;
    let ix = Math.floor(wx - d.x);
    const iy = Math.floor(wy - d.y);
    if (d.flip) ix = d.w - 1 - ix;
    // Be generous: a hit within 2 px of an opaque pixel counts.
    return opaqueNear(d.img, ix, iy, 2);
  }
}

const alphaCache = new WeakMap();
function opaqueNear(img, x, y, r) {
  let a = alphaCache.get(img);
  if (!a) {
    const ctx = img.getContext('2d');
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
