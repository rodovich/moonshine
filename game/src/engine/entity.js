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

  // Play a named animation instead of idle/walk frames; null returns to
  // normal. A base like 'jog' plays jog_<facing> (or its mirror) when the
  // sheet has it, so the pose follows the character's facing; a full name
  // like 'sit_right' plays as is. `offset` [dx, dy] shifts the drawing while
  // posed (Cheryl sitting on the tub's rim); the def's poseOffsets: { sit_right:
  // [0, -4] } gives defaults.
  setPose(base, offset = null) {
    this.pose = base || null;
    this.poseMs = 0;
    this.poseOffset = offset || (base && this.def.poseOffsets && this.def.poseOffsets[base]) || null;
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
      this.lastFrom = [this.fromX, this.fromY]; // where the finished step began
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

  // Does the sheet have a frame or an animation called `name`?
  hasAnim(name) {
    return this.art.has(name) || this.art.has(`${name}_0`);
  }

  // `fn(dir)` for the facing, else the mirrored facing (flipped), else down.
  byFacing(fn) {
    const dir = this.facing;
    let r = fn(dir);
    if (r) return { ...r, flip: false };
    const mirror = { left: 'right', right: 'left' }[dir];
    if (mirror && (r = fn(mirror))) return { ...r, flip: true };
    r = fn('down');
    return r ? { ...r, flip: false } : null;
  }

  // Character sheets come in two namings, and both work:
  //   art names (docs/decisions.md): <dir>_0 stands, <dir>_1, <dir>_2 step
  //     (walk 1, 0, 2, 0; longer cycles give sprite.walk, e.g. [1, 2, 3, 4]),
  //     idle_<dir>_<n> an optional idle (blinks)
  //   alternative: walk_<dir>_<n> and idle_<dir>_<n>
  walkFrames(dir) {
    const art = this.art;
    if (art.has(`walk_${dir}_0`)) return art.anim(`walk_${dir}`);
    if (!art.has(`${dir}_1`)) return null;
    let cycle = this.sprite.walk;
    if (!cycle) {
      let n = 0;
      while (art.has(`${dir}_${n}`)) n++;
      cycle = n === 3 ? [1, 0, 2, 0] : n === 2 ? [1, 0] : Array.from({ length: n - 1 }, (_, i) => i + 1);
    }
    return cycle.filter((i) => art.has(`${dir}_${i}`)).map((i) => art.frame(`${dir}_${i}`));
  }

  idleFrame(dir, ms) {
    const art = this.art;
    if (this.hasAnim(`idle_${dir}`)) return art.frameAt(`idle_${dir}`, ms);
    if (art.has(`${dir}_0`)) return art.frame(`${dir}_0`);
    if (art.has(`walk_${dir}_0`)) return art.frame(`walk_${dir}_0`);
    return null;
  }

  currentFrame() {
    const art = this.art;
    if (!art) return null;
    if (this.pose) {
      // pose_<facing>, else the mirrored facing flipped, else the pose itself.
      const p = this.pose;
      const mirror = { left: 'right', right: 'left' }[this.facing];
      let name = p;
      let flip = false;
      if (this.hasAnim(`${p}_${this.facing}`)) name = `${p}_${this.facing}`;
      else if (mirror && this.hasAnim(`${p}_${mirror}`)) { name = `${p}_${mirror}`; flip = true; }
      else if (!this.hasAnim(p) && this.hasAnim(`${p}_down`)) name = `${p}_down`;
      return { img: art.frameAt(name, this.poseMs), flip };
    }
    if (!this.directional) {
      const fallback = this.sprite.fps ? 1000 / this.sprite.fps : 200;
      return { img: art.frameAt(this.sprite.frame, this.animMs + this.phase, fallback), flip: false };
    }
    if (this.moving || this.walkPx > 0) {
      // Walk frames advance with distance (one per 8 px), so feet stay
      // planted at any walking speed.
      const r = this.byFacing((d) => {
        const frames = this.walkFrames(d);
        return frames && frames.length ? { frames } : null;
      });
      if (r) return { img: r.frames[Math.floor(this.walkPx / WALK_PX_PER_FRAME) % r.frames.length], flip: r.flip };
    }
    const r = this.byFacing((d) => {
      const img = this.idleFrame(d, this.animMs + this.phase);
      return img ? { img } : null;
    });
    return r ? { img: r.img, flip: r.flip } : null;
  }

  draw(ctx, camX, camY) {
    if (!this.visible || !this.art) return;
    const f = this.currentFrame();
    if (!f) return;
    const { img, flip } = f;
    if (!img) return;
    const po = (this.pose && this.poseOffset) || [0, 0];
    const x = this.px + (this.w * TILE - img.width) / 2 + this.offset[0] + po[0] - camX;
    const y = this.py + this.h * TILE - img.height + this.offset[1] + po[1] - camY;
    const rx = Math.round(x);
    const ry = Math.round(y);
    this.lastDrawn = { x: rx + camX, y: ry + camY, w: img.width, h: img.height, img, flip };
    ctx.save();
    if (this.clipBelow) {
      // Sinking into a hole: nothing below the footprint's bottom edge shows.
      ctx.beginPath();
      ctx.rect(0, 0, ctx.canvas.width, this.py + this.h * TILE - camY);
      ctx.clip();
    }
    if (flip) {
      ctx.scale(-1, 1);
      ctx.drawImage(img, -rx - img.width, ry);
    } else {
      ctx.drawImage(img, rx, ry);
    }
    ctx.restore();
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
