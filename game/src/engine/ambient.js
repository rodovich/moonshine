// Things that happen around the player without stopping them:
//   barks    one-line speech at the top of the screen (chanting girls, a
//            voice from a window); g.bark() or an entity's `bark` field
//   emotes   a little icon over a character's head (♪, !, ?); g.emote() or
//            an entity's `emote` field
//   effects  short-lived sprites that move along a path and vanish (a water
//            trickle, a puff of mist); g.spawnEffect()
//   events   a map's `ambient` list: callbacks every so many seconds (a woman
//            tips her basin every 20 s)
// None of these block input or take control from the player.

import { WIDTH } from './display.js';
import { TILE } from './tilemap.js';
import { loadSheet } from './art.js';
import { uiSmall } from '../art/ui.js';
import { STYLES, drawBox } from './ui.js';
import { drawText, measure, wrap, LINE_HEIGHT } from './text.js';
import { safeCall } from './world.js';

const TICK = 1000 / 60;

export class Ambient {
  constructor(world) {
    this.world = world;
    this.small = loadSheet(uiSmall);
    this.reset();
  }

  // Called on every map load.
  reset() {
    this.barkState = null;
    this.emotes = new Map(); // entity -> { frame, sheet, ticks }
    this.effects = [];
    this.timers = new Map(); // ambient event or entity -> ticks until next
  }

  rng(min, max) {
    return this.world.game.rng.int(Math.round(min * 60), Math.round(max * 60));
  }

  bark(speaker, text, { seconds = 3 } = {}) {
    this.barkState = { speaker, lines: wrap(text, WIDTH - 32 - (speaker ? measure(`${speaker}:`) + 4 : 0)).slice(0, 2), ticks: Math.round(seconds * 60), t: 0 };
  }

  emote(e, frame = 'note', { seconds = 1.2, sheet = null } = {}) {
    this.emotes.set(e, { frame, sheet, ticks: Math.round(seconds * 60), t: 0 });
  }

  // { sprite: { sheet, frame, palette }, path: [[tx, ty], ...] or at: [tx, ty],
  //   speed (px per tick, default 0.5), seconds (lifetime if not moving),
  //   offset: [dx, dy], layer: 'ground' | 'top', z (isometric view: px above
  //   the floor) }. Resolves when it's gone.
  spawnEffect(opts) {
    return new Promise((resolve) => {
      const pts = (opts.path || [opts.at]).map(([x, y]) => [x * TILE + TILE / 2, y * TILE + TILE / 2]);
      const art = loadSheet(opts.sprite.sheet, opts.sprite.palette);
      this.effects.push({
        art, frame: opts.sprite.frame, pts, seg: 0, segT: 0, x: pts[0][0], y: pts[0][1],
        speed: opts.speed ?? 0.5, life: opts.seconds != null ? Math.round(opts.seconds * 60) : null, t: 0,
        offset: opts.offset || [0, 0], layer: opts.layer || 'ground', z: opts.z || 0, resolve,
      });
    });
  }

  update() {
    const w = this.world;
    // Barks
    if (this.barkState && !w.textbox.open && ++this.barkState.t > this.barkState.ticks) this.barkState = null;
    // Emotes
    for (const [e, em] of this.emotes) if (++em.t > em.ticks) this.emotes.delete(e);
    // Effects
    this.effects = this.effects.filter((fx) => {
      fx.t++;
      if (fx.seg < fx.pts.length - 1) {
        const [ax, ay] = fx.pts[fx.seg];
        const [bx, by] = fx.pts[fx.seg + 1];
        const len = Math.hypot(bx - ax, by - ay) || 1;
        fx.segT += fx.speed;
        if (fx.segT >= len) {
          fx.seg++;
          fx.segT -= len;
        }
        const k = Math.min(1, fx.segT / len);
        const [cx, cy] = fx.pts[Math.min(fx.seg, fx.pts.length - 1)];
        const [nx, ny] = fx.pts[Math.min(fx.seg + 1, fx.pts.length - 1)];
        fx.x = cx + (nx - cx) * k;
        fx.y = cy + (ny - cy) * k;
      }
      const done = fx.life != null ? fx.t >= fx.life : fx.seg >= fx.pts.length - 1;
      if (done) fx.resolve();
      return !done;
    });
    if (w.busy) return; // timed things wait while a scene plays
    // Map events
    for (const ev of w.mapDef.ambient || []) {
      if (!this.timers.has(ev)) this.timers.set(ev, this.rng(...(ev.every || [10, 10])));
      const left = this.timers.get(ev) - 1;
      this.timers.set(ev, left);
      if (left > 0) continue;
      this.timers.set(ev, this.rng(...(ev.every || [10, 10])));
      if (ev.when && !safeCall(ev.when, w.api)) continue;
      // { script: true } runs it as a full script (queued, takes control,
      // can say/changeMap): a bell that rings on its own after a while.
      if (ev.script) w.run(ev.run);
      else safeCall(ev.run, w.api);
    }
    // Entity barks and emotes
    const p = w.player;
    for (const e of w.entities) {
      const d = e.def;
      if (d.bark && !e.talking) this.entityBark(e, d.bark, p);
      if (d.emote && !this.emotes.has(e)) {
        const key = `emote:${e.id}`;
        if (!this.timers.has(key)) this.timers.set(key, this.rng(...(d.emote.every || [3, 6])));
        const left = this.timers.get(key) - 1;
        this.timers.set(key, left);
        if (left <= 0) {
          this.timers.delete(key);
          this.emote(e, d.emote.frame || 'note', { seconds: d.emote.seconds ?? 1.2, sheet: d.emote.sheet || null });
        }
      }
    }
  }

  // bark: { lines: [...], range: 3, every: [4, 8], once, speaker }
  entityBark(e, b, p) {
    const range = b.range ?? 3;
    if (Math.abs(p.x - e.x) + Math.abs(p.y - e.y) > range) return;
    const key = `bark:${e.id}`;
    if (!this.timers.has(key)) this.timers.set(key, 0);
    const left = this.timers.get(key) - 1;
    this.timers.set(key, left);
    if (left > 0) return;
    e.barkIndex = e.barkIndex || 0;
    if (b.once && e.barkIndex >= b.lines.length) return;
    const line = b.lines[e.barkIndex % b.lines.length];
    e.barkIndex++;
    this.bark(b.speaker ?? e.name, line, { seconds: b.seconds ?? 3 });
    this.timers.set(key, this.rng(...(b.every || [4, 8])));
  }

  drawEffects(ctx, cx, cy, layer) {
    for (const fx of this.effects) {
      if (fx.layer !== layer) continue;
      const img = fx.art.frameAt(fx.frame, fx.t * TICK);
      if (!img) continue;
      ctx.drawImage(img, Math.round(fx.x - img.width / 2 + fx.offset[0] - cx), Math.round(fx.y - img.height / 2 + fx.offset[1] - cy));
    }
  }

  drawEmotes(ctx, cx, cy) {
    for (const [e, em] of this.emotes) {
      const d = e.lastDrawn;
      if (!d || !e.visible) continue;
      const art = em.sheet ? loadSheet(em.sheet) : this.small;
      const img = art.frame(em.frame);
      if (!img) continue;
      const bob = Math.floor(em.t / 15) % 2;
      ctx.drawImage(img, Math.round(d.x + d.w / 2 - img.width / 2 - cx), d.y - img.height - 1 - bob - cy);
    }
  }

  drawBark(ctx) {
    const b = this.barkState;
    if (!b || this.world.textbox.open) return;
    const label = b.speaker ? `${b.speaker}:` : '';
    const lw = label ? measure(label) + 4 : 0;
    const h = b.lines.length * LINE_HEIGHT + 8;
    // Below the bag button and the "Use X on…" banner.
    const x = 8;
    const y = 28;
    const w = WIDTH - 16;
    drawBox(ctx, x, y, w, h, STYLES.npc);
    if (label) drawText(ctx, label, x + 8, y + 4, { color: 'ui_label' });
    b.lines.forEach((l, i) => drawText(ctx, l, x + 8 + lw, y + 4 + i * LINE_HEIGHT, { color: 'ui_text' }));
  }
}
