// Entities: the player, NPCs, and interactable objects. Each occupies one or
// more tiles (its footprint, anchored at its top-left tile x,y) and moves one
// tile at a time with smooth pixel interpolation.

import { loadSheet } from './art.js';
import { TILE } from './tilemap.js';

export const DIR_VEC = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] };
const WALK_PX_PER_FRAME = 8;

export const OPPOSITE = { up: 'down', down: 'up', left: 'right', right: 'left' };

export function dirBetween(ax, ay, bx, by) {
  const dx = bx - ax;
  const dy = by - ay;
  if (Math.abs(dx) > Math.abs(dy)) return dx > 0 ? 'right' : 'left';
  if (dy !== 0) return dy > 0 ? 'down' : 'up';
  return null;
}

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
    this.stepTicks = def.stepTicks || (isPlayer ? 12 : 16);
    this.layer = def.layer || 'sprites'; // 'ground' draws under everything that sorts
    this.offset = def.offset || [0, 0];
    this.visible = def.visible !== undefined ? def.visible : true;
    // Movement
    this.moving = false;
    this.fromX = this.x;
    this.fromY = this.y;
    this.t = 0;
    // Animation clocks (ms). `phase` keeps neighbors' idles out of step.
    this.animMs = 0;
    this.walkPx = 0;
    this.phase = def.phase ?? Math.floor(Math.random() * 1000);
    this.setSprite(typeof def.sprite === 'function' ? null : def.sprite);
  }

  // sprite: { sheet, palette } for a character (idle_<dir>_<n>, walk_<dir>_<n>
  // frames), or { sheet, palette, frame } for a static or animated object.
  setSprite(sprite) {
    this.sprite = sprite || null;
    this.art = sprite ? loadSheet(sprite.sheet, sprite.palette) : null;
    this.directional = !!(sprite && !sprite.frame);
    this.pose = null;
  }

  // Play a named animation (e.g. 'sit_right') instead of idle/walk frames;
  // null returns to normal.
  setPose(base) {
    this.pose = base || null;
    this.poseMs = 0;
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
    if (this.t >= this.stepTicks) {
      this.moving = false;
      this.fromX = this.x;
      this.fromY = this.y;
      return true;
    }
    return false;
  }

  // Advance animation clocks by one tick.
  tickAnim() {
    const dt = 1000 / 60;
    this.animMs += dt;
    this.poseMs = (this.poseMs || 0) + dt;
    if (this.moving) this.walkPx += TILE / this.stepTicks;
    else this.walkPx = 0;
  }

  currentFrame() {
    const art = this.art;
    if (!art) return null;
    if (this.pose) return { img: art.frameAt(this.pose, this.poseMs), flip: false };
    if (!this.directional) {
      const fallback = this.sprite.fps ? 1000 / this.sprite.fps : 200;
      return { img: art.frameAt(this.sprite.frame, this.animMs + this.phase, fallback), flip: false };
    }
    const kind = this.moving || this.walkPx > 0 ? 'walk' : 'idle';
    const pick = (k, dir) => (art.has(`${k}_${dir}_0`) ? `${k}_${dir}` : null);
    const dir = this.facing;
    let flip = false;
    let base = pick(kind, dir);
    if (!base) {
      const mirror = { left: 'right', right: 'left' }[dir];
      if (mirror && pick(kind, mirror)) {
        base = pick(kind, mirror);
        flip = true;
      } else if (kind === 'idle' && pick('walk', dir)) {
        // No idle frames: stand on the first walk frame.
        return { img: art.frame(`walk_${dir}_0`), flip: false };
      } else {
        base = pick(kind, 'down') || pick('walk', 'down');
      }
    }
    if (!base) return null;
    if (kind === 'walk') {
      // Walk frames advance with distance (one per 8 px, a full 4-frame cycle
      // every two tiles), so feet stay planted at any walking speed.
      const frames = art.anim(base);
      return { img: frames[Math.floor(this.walkPx / WALK_PX_PER_FRAME) % frames.length], flip };
    }
    return { img: art.frameAt(base, this.animMs + this.phase), flip };
  }

  draw(ctx, camX, camY) {
    if (!this.visible || !this.art) return;
    const f = this.currentFrame();
    if (!f) return;
    const { img, flip } = f;
    if (!img) return;
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

  // A small oval shadow under a character's feet, drawn before any sprite so
  // it never covers another character. `shadow: false` on the def turns it off.
  drawShadow(ctx, camX, camY) {
    if (!this.visible || !this.directional || this.def.shadow === false) return;
    const img = shadowImage();
    const x = Math.round(this.px + (this.w * TILE - img.width) / 2 + this.offset[0] - camX);
    const y = Math.round(this.py + this.h * TILE - img.height + 1 + this.offset[1] - camY);
    ctx.drawImage(img, x, y);
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

let shadowCanvas = null;
function shadowImage() {
  if (shadowCanvas) return shadowCanvas;
  const rows = ['..######..', '##########', '..######..'];
  shadowCanvas = document.createElement('canvas');
  shadowCanvas.width = rows[0].length;
  shadowCanvas.height = rows.length;
  const ctx = shadowCanvas.getContext('2d');
  ctx.fillStyle = 'rgba(32, 24, 40, 0.35)'; // ink, see-through
  rows.forEach((r, y) => [...r].forEach((c, x) => c === '#' && ctx.fillRect(x, y, 1, 1)));
  return shadowCanvas;
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
