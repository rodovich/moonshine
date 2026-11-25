// Player control while exploring: keyboard stepping, click/tap-to-walk with
// A*, walking up to things to interact, using held items, the inventory
// button, and exits/triggers when the player arrives on a tile.

import { WIDTH, HEIGHT } from './display.js';
import { TILE } from './tilemap.js';
import { DIR_VEC, dirBetween } from './entity.js';
import { loadSheet } from './art.js';
import { uiIcons } from '../art/ui.js';
import { STYLES, drawBox, inRect } from './ui.js';
import { drawText, measure } from './text.js';
import { inArea, isInteractable, safeCall } from './world.js';
import { sfx, step } from './sound.js';

const BAG_BTN = { x: WIDTH - 26, y: 3, w: 22, h: 22 };
// A little more forgiving than the drawn button, for fingers.
const BAG_HIT = { x: BAG_BTN.x - 4, y: 0, w: BAG_BTN.w + 8, h: BAG_BTN.h + 8 };
const HOLD_BANNER = { x: 4, y: 3, w: 0, h: 22 }; // width set when drawn
const DIRS = ['up', 'down', 'left', 'right'];

export class Control {
  constructor(world) {
    this.world = world;
    this.icons = loadSheet(uiIcons);
    this.holding = null; // item id being used
    this.lastItem = null;
    this.reset();
  }

  reset() {
    this.path = null;
    this.goal = null; // [x, y] for plain walks
    this.pending = null; // { entity, item } to act on when we arrive
    this.waitT = 0;
    this.bump = 0;
    this.bufferedDir = null;
    this.bufferedConfirm = false;
    this.dragging = false;
    this.dragT = 0;
    this.holding = null;
    if (this.world) this.world.marker = null;
  }

  cancelMove() {
    this.path = null;
    this.goal = null;
    this.pending = null;
    this.world.marker = null;
    this.dragging = false;
  }

  get player() {
    return this.world.player;
  }

  // Called each tick while the player has control, before entities move.
  update(input) {
    for (const t of input.taps()) this.tap(t);
    for (const d of DIRS) {
      if (input.pressed(d)) this.bufferedDir = d;
    }
    if (input.pressed('confirm')) this.bufferedConfirm = true;
    if (input.pressed('cancel')) {
      if (this.holding) {
        this.holding = null;
        sfx('cancel');
      } else {
        this.openInventory();
        return;
      }
    }
    // Drag to steer (hold the pointer down and move it).
    const ptr = input.pointer;
    if (this.dragging) {
      if (!ptr.down) this.dragging = false;
      else if (++this.dragT % 6 === 0) {
        const tx = Math.floor((ptr.x + this.world.cam.x) / TILE);
        const ty = Math.floor((ptr.y + this.world.cam.y) / TILE);
        if (!this.goal || this.goal[0] !== tx || this.goal[1] !== ty) this.walkTo(tx, ty, false);
      }
    }
    // Pointer cursor hints on desktop.
    if (input.hover && input.lastScheme === 'pointer') {
      const over = this.entityAtPoint(input.hover.x, input.hover.y) || inRect(input.hover, BAG_BTN);
      this.world.game.display.canvas.style.cursor = over ? 'pointer' : 'default';
    }
  }

  // Called each tick after entities move. `input` is null when control is
  // suspended (dialog, inventory, cutscene).
  afterMove(input) {
    if (this.bump > 0) this.bump--;
    if (!input) return;
    const p = this.player;
    if (p.moving) return;
    const held = input.dir();
    const dir = held || this.bufferedDir;
    this.bufferedDir = null;
    if (dir) {
      this.cancelMove();
      this.bufferedConfirm = false;
      this.stepKeyboard(dir, !!held);
      return;
    }
    if (this.bufferedConfirm) {
      this.bufferedConfirm = false;
      this.cancelMove();
      this.interactFront();
      return;
    }
    if (this.path && this.path.length) {
      this.followPath();
      return;
    }
    if (this.path) this.pathDone();
  }

  stepKeyboard(dir, held) {
    const p = this.player;
    const [dx, dy] = DIR_VEC[dir];
    if (this.world.canEnter(p, p.x + dx, p.y + dy)) {
      p.startStep(dir);
      this.footstep();
    } else {
      p.facing = dir;
      if (held && this.bump === 0) {
        sfx('bump');
        this.bump = 20;
      }
    }
  }

  followPath() {
    const p = this.player;
    const [nx, ny] = this.path[0];
    const dir = dirBetween(p.x, p.y, nx, ny);
    if (Math.abs(nx - p.x) + Math.abs(ny - p.y) !== 1) {
      this.repath();
      return;
    }
    if (this.world.canEnter(p, nx, ny)) {
      this.path.shift();
      this.waitT = 0;
      p.startStep(dir);
      this.footstep();
      return;
    }
    // Someone is in the way: wait a moment, then route around them.
    this.waitT++;
    if (this.waitT === 8 || this.waitT % 30 === 0) this.repath();
    if (this.waitT > 150) this.cancelMove();
  }

  pathDone() {
    const p = this.player;
    this.path = null;
    this.world.marker = null;
    const pend = this.pending;
    this.pending = null;
    if (!pend) return;
    const e = pend.entity;
    if (!this.world.entities.includes(e)) return;
    const spot = this.world.interactSpots(e).find((s) => s.x === p.x && s.y === p.y);
    if (spot) {
      p.facing = spot.facing;
      this.act(e, pend.item);
    } else if ((pend.tries || 0) < 3) {
      // The target moved (a wandering NPC) or was blocked: try again.
      this.pending = { ...pend, tries: (pend.tries || 0) + 1 };
      this.repath();
      if (!this.path.length) this.pending = null;
    }
  }

  repath() {
    const p = this.player;
    const w = this.world;
    if (this.pending) {
      const spots = w.interactSpots(this.pending.entity);
      let path = w.pathFor(p, spots.map((s) => [s.x, s.y]));
      if (!path) path = w.pathFor(p, [[this.pending.entity.x, this.pending.entity.y]], { closest: true });
      this.setPath(path);
    } else if (this.goal) {
      this.setPath(w.pathFor(p, [this.goal], { closest: true }));
    }
  }

  setPath(path) {
    this.path = path || [];
    this.waitT = 0;
    const end = this.path.length ? this.path[this.path.length - 1] : [this.player.x, this.player.y];
    if (this.path.length) this.world.marker = { x: end[0], y: end[1], t: this.world.marker?.t ?? 0, persist: true };
    else this.world.marker = null;
  }

  walkTo(tx, ty, ping = true) {
    this.pending = null;
    this.goal = [tx, ty];
    this.repath();
    if (ping && this.world.marker) this.world.marker.t = 0;
  }

  approach(e, item) {
    this.goal = null;
    this.pending = { entity: e, item };
    this.repath();
    if (this.world.marker) this.world.marker.t = 0;
  }

  entityAtPoint(sx, sy) {
    const w = this.world;
    const wx = sx + w.cam.x;
    const wy = sy + w.cam.y;
    const tx = Math.floor(wx / TILE);
    const ty = Math.floor(wy / TILE);
    const list = w.entities.filter((e) => !e.isPlayer && e.visible && isInteractable(e)).sort((a, b) => b.sortY - a.sortY);
    for (const e of list) if (e.hit(wx, wy)) return e;
    for (const e of list) if (tx >= e.x && ty >= e.y && tx < e.x + e.w && ty < e.y + e.h) return e;
    return null;
  }

  tap(t) {
    // Taps in the letterbox, outside the 256×224 frame, aren't world taps
    // (the phone touch bar below the frame is handled first).
    if (this.world.game.display.touchBarHit && this.world.game.display.touchBarHit(t)) {
      this.openInventory();
      return;
    }
    if (t.x < 0 || t.y < 0 || t.x >= WIDTH || t.y >= HEIGHT) return;
    if (inRect(t, BAG_HIT)) {
      this.openInventory();
      return;
    }
    if (this.holding && inRect(t, { ...HOLD_BANNER, w: this.bannerW || 0 })) {
      this.holding = null;
      sfx('cancel');
      return;
    }
    const w = this.world;
    const e = this.entityAtPoint(t.x, t.y);
    if (e) {
      this.approach(e, this.holding);
      return;
    }
    const tx = Math.floor((t.x + w.cam.x) / TILE);
    const ty = Math.floor((t.y + w.cam.y) / TILE);
    if (!w.map.inBounds(tx, ty)) return;
    this.walkTo(tx, ty);
    this.dragging = true;
    this.dragT = 0;
  }

  interactFront() {
    const p = this.player;
    const w = this.world;
    const [dx, dy] = DIR_VEC[p.facing];
    let e = w.interactableAt(p.x + dx, p.y + dy);
    if (!e && w.map.counter(p.x + dx, p.y + dy)) e = w.interactableAt(p.x + 2 * dx, p.y + 2 * dy);
    if (e) {
      this.act(e, this.holding);
    } else if (this.holding) {
      this.holding = null;
      const line = w.content.defaults?.nothingToUseOn || "There's nothing there to use it on.";
      w.run((g) => g.describe(line));
    }
  }

  act(e, item) {
    this.cancelMove();
    if (item) this.holding = null;
    this.world.run(() => this.world.interactWith(e, item));
  }

  openInventory() {
    const w = this.world;
    this.cancelMove();
    this.holding = null;
    if (w.hintState && w.hintState.untilBag) w.hintState = null;
    w.run(async () => {
      // Looking at an item shows its text, then returns to the bag.
      for (;;) {
        const r = await w.inventory.show(w.state.inventory, this.lastItem);
        if (r && r.look) {
          this.lastItem = r.look;
          await w.examineItem(r.look);
          continue;
        }
        if (r && r.use) {
          this.holding = r.use;
          this.lastItem = r.use;
        }
        return;
      }
    });
  }

  // A footstep sound for the tile Cheryl steps onto: the tile's `step` id
  // (e.g. 'step_splash'), else the map's `step`, else 'step'.
  footstep() {
    const w = this.world;
    const p = this.player;
    const t = w.map.tile('detail', p.x, p.y) || w.map.tile('ground', p.x, p.y);
    step((t && t.props.step) || w.mapDef.step || 'step');
  }

  // The player finished a step onto a new tile.
  arrived() {
    const w = this.world;
    if (w.busy) return;
    const p = this.player;
    const def = w.mapDef;
    const here = (def.exits || []).filter((ex) => inArea(ex, p.x, p.y));
    const exit = here.find((ex) => !ex.when || safeCall(ex.when, w.api));
    const stepBack = async (g) => {
      if (p.lastFrom) await g.movePlayer([p.lastFrom[0], p.lastFrom[1]]);
    };
    // A closed exit that explains itself: say why, then step back off it.
    const closed = !exit && here.find((ex) => ex.blocked);
    if (closed) {
      this.cancelMove();
      this.bufferedDir = null;
      w.run(async (g) => {
        const why = closed.blocked;
        if (typeof why === 'function') await why(g);
        else await g.describe(...(Array.isArray(why) ? why : [why]));
        await stepBack(g);
      });
      return;
    }
    if (exit) {
      this.cancelMove();
      this.bufferedDir = null;
      w.run(async (g) => {
        // `confirm: 'Go down?'` asks first; "Not yet" steps back.
        if (exit.confirm) {
          const i = await g.choose(exit.confirm, exit.choices || ['Yes', 'Not yet']);
          if (i !== 0) return stepBack(g);
        }
        if (exit.run) return exit.run(g);
        const multi = (exit.w || 1) > 1 || (exit.h || 1) > 1;
        const x = exit.at[0] + (multi ? p.x - exit.x : 0);
        const y = exit.at[1] + (multi ? p.y - exit.y : 0);
        sfx(exit.sfx || 'door');
        return g.changeMap(exit.to, x, y, exit.facing || p.facing);
      });
      return;
    }
    const trig = (def.triggers || []).find((tr) => inArea(tr, p.x, p.y) && (!tr.when || safeCall(tr.when, w.api)));
    if (trig) {
      if (trig.stop !== false) this.cancelMove();
      w.run(trig.run);
    }
  }

  drawHud(ctx) {
    // Inventory button
    ctx.save();
    ctx.globalAlpha = 0.9;
    drawBox(ctx, BAG_BTN.x, BAG_BTN.y, BAG_BTN.w, BAG_BTN.h, STYLES.npc);
    ctx.drawImage(this.icons.frame('bag'), BAG_BTN.x + 3, BAG_BTN.y + 3);
    ctx.restore();
    // "Using" banner
    if (this.holding) {
      const def = this.world.content.items[this.holding] || {};
      const text = `Use ${def.name || this.holding} on…`;
      const wdt = measure(text) + 34;
      this.bannerW = wdt;
      drawBox(ctx, HOLD_BANNER.x, HOLD_BANNER.y, wdt, HOLD_BANNER.h, STYLES.cheryl);
      const icon = this.world.inventory.icon(this.holding);
      if (icon) ctx.drawImage(icon, HOLD_BANNER.x + 3, HOLD_BANNER.y + 3);
      drawText(ctx, text, HOLD_BANNER.x + 22, HOLD_BANNER.y + 7, { color: STYLES.cheryl.text });
    }
  }
}
