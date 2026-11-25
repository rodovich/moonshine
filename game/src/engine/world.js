// The world scene: the current map, its entities, the player, the camera,
// and the script runner. Player control lives in control.js; the script API
// in script.js.

import { WIDTH, HEIGHT } from './display.js';
import { TileMap, TILE } from './tilemap.js';
import { Entity, DIR_VEC, dirBetween } from './entity.js';
import { findPath, nearestReachable } from './pathfind.js';
import { makeApi } from './script.js';
import { Control } from './control.js';
import { writeSave } from './save.js';
import { colorOf, loadSheet, rgbSetOf } from './art.js';
import { uiSmall } from '../art/ui.js';
import { TINTS, EMISSIVE } from '../art/tints.js';
import { drawText, measure, wrap, LINE_HEIGHT } from './text.js';
import { STYLES, drawBox } from './ui.js';
import { playMusic, stopMusic } from './sound.js';

export class World {
  constructor(game, state) {
    this.game = game;
    this.content = game.content;
    this.state = state;
    this.effects = game.effects;
    this.textbox = game.textbox;
    this.inventory = game.inventory;
    this.tick = 0;
    this.busy = 0; // scripts running
    this.queue = [];
    this.waiters = [];
    this.cam = { x: 0, y: 0 }; // whole pixels, for drawing
    this.camF = { x: 0, y: 0 }; // exact position, for slow pans
    this.camPan = null; // { x, y } fixed camera center while panning
    this.marker = null;
    this.api = makeApi(this);
    this.control = new Control(this);
    this.small = loadSheet(uiSmall);
    this.player = new Entity({ id: 'player', x: state.x, y: state.y, facing: state.facing, ...this.content.player }, true);
    this.player.name = this.content.player.name || 'Cheryl';
    this.loadMap(state.map, state.x, state.y, state.facing);
  }

  // ---- Maps and entities ----------------------------------------------

  loadMap(id, x, y, facing) {
    const def = this.content.maps[id];
    if (!def) throw new Error(`no map "${id}"`);
    this.mapDef = def;
    this.map = new TileMap(def);
    this.state.map = id;
    const p = this.player;
    p.x = p.fromX = x;
    p.y = p.fromY = y;
    p.moving = false;
    p.walkPx = 0;
    p.route = null;
    if (facing) p.facing = facing;
    this.entities = [p];
    this.byId = new Map();
    this.removed = new Set(); // ids removed by scripts until the map reloads
    this.patched = [];
    this.refreshEntities();
    this.placeSafely(def);
    this.control.reset();
    this.camPan = null;
    this.snapCamera();
    this.applyLighting(0);
    if (def.music !== undefined) {
      if (def.music) playMusic(def.music);
      else stopMusic();
    }
  }

  // If the player would start inside something solid or off the map (an old
  // save, a typo in a door's `at`), move them to the map's spawn or the
  // nearest open tile.
  placeSafely(def) {
    const p = this.player;
    const ok = (x, y) => this.map.inBounds(x, y) && !this.blocked(x, y, p);
    if (ok(p.x, p.y)) return;
    console.warn(`[world] ${def.id}: (${p.x},${p.y}) isn't walkable; moving the player`);
    let best = def.spawn && ok(def.spawn[0], def.spawn[1]) ? def.spawn : null;
    if (!best) {
      let bestD = Infinity;
      const cx = this.map.inBounds(p.x, p.y) ? p.x : Math.floor(this.map.w / 2);
      const cy = this.map.inBounds(p.x, p.y) ? p.y : Math.floor(this.map.h / 2);
      for (let y = 0; y < this.map.h; y++) {
        for (let x = 0; x < this.map.w; x++) {
          const d = Math.abs(x - cx) + Math.abs(y - cy);
          if (d < bestD && ok(x, y) && !this.isExit(x, y)) {
            best = [x, y];
            bestD = d;
          }
        }
      }
    }
    if (best) {
      p.x = p.fromX = best[0];
      p.y = p.fromY = best[1];
    }
  }

  // Bring the map up to date with the game state: add entities whose `when`
  // now passes, remove ones whose `when` fails, re-pick sprites given as
  // functions, and apply the map's tile patches. Runs after every script.
  refreshEntities() {
    for (const def of this.mapDef.entities || []) {
      const show = !def.when || safeCall(def.when, this.api);
      let e = this.byId.get(def.id);
      if (show && !e && !this.removed.has(def.id)) {
        e = new Entity(def);
        e.home = { x: def.x, y: def.y, facing: e.facing };
        this.entities.push(e);
        this.byId.set(def.id, e);
      } else if (!show && e) {
        this.removeEntity(e);
        e = null;
      }
      if (e && typeof def.sprite === 'function') {
        const sprite = safeCall(def.sprite, this.api) || null;
        if (!sameSprite(sprite, e.sprite)) e.setSprite(sprite);
      }
    }
    this.applyPatches();
  }

  // A map's `patches(g)` returns [layer, x, y, tile] changes for the current
  // state (a taken item leaves a bare counter, a moved piano clears the stair).
  applyPatches() {
    const fn = this.mapDef.patches;
    if (!fn) return;
    // Undo previous patches, then apply the current list.
    for (const [layer, x, y, tile] of [...(this.patched || [])].reverse()) this.map.setTile(layer, x, y, tile);
    this.patched = [];
    for (const [layer, x, y, value] of safeCall(fn, this.api) || []) {
      this.patched.push([layer, x, y, this.originalTile(layer, x, y)]);
      this.map.setTile(layer, x, y, value);
    }
  }

  originalTile(layer, x, y) {
    const rows = this.mapDef[layer];
    const ch = rows?.[y]?.[x];
    return ch && ch !== ' ' ? this.mapDef.legend[ch] : null;
  }

  // The map's lighting: `lighting` is a preset name ('dusk', 'night', 'day')
  // or a function of the state returning one.
  applyLighting(seconds) {
    let l = this.mapDef.lighting;
    if (typeof l === 'function') l = safeCall(l, this.api);
    this.setLighting(l || null, seconds);
  }

  setLighting(name, seconds = 0) {
    const presets = { ...LIGHTING, ...(this.content.lighting || {}) };
    if (name && !presets[name]) console.warn(`[world] unknown lighting "${name}"`);
    this.lighting = name;
    return this.effects.setLight(name ? presets[name] || [] : [], seconds);
  }

  removeEntity(e) {
    this.entities = this.entities.filter((x) => x !== e);
    this.byId.delete(e.id);
  }

  entity(id) {
    if (id === 'player') return this.player;
    if (id instanceof Entity) return id;
    return this.byId.get(id) || null;
  }

  // Solid entity covering a tile (optionally ignoring one entity).
  entityAt(x, y, ignore = null) {
    for (const e of this.entities) {
      if (e !== ignore && e.solid && e.visible && e.occupies(x, y)) return e;
    }
    return null;
  }

  // Interactable entity at a tile (solid or not).
  interactableAt(x, y) {
    for (const e of this.entities) {
      if (e.isPlayer || !e.visible) continue;
      if (e.x <= x && e.y <= y && x < e.x + e.w && y < e.y + e.h && isInteractable(e)) return e;
    }
    return null;
  }

  blocked(x, y, mover = null) {
    if (this.map.solid(x, y)) return true;
    const e = this.entityAt(x, y, mover);
    return !!e;
  }

  // Can `mover` (with its footprint) step into x,y?
  canEnter(mover, x, y) {
    for (let dy = 0; dy < mover.h; dy++) {
      for (let dx = 0; dx < mover.w; dx++) {
        if (this.blocked(x + dx, y + dy, mover)) return false;
      }
    }
    return true;
  }

  // Path for an entity to any of `goals`, avoiding solid tiles and entities.
  // If none is reachable and `closest` is set, path to the nearest reachable
  // tile. The player's paths never cross an exit unless it's the goal, so a
  // click near a door can't carry Cheryl through it.
  pathFor(mover, goals, { closest = false, ignoreEntities = false } = {}) {
    const goalKeys = new Set(goals.map(([x, y]) => `${x},${y}`));
    const avoidExits = mover.isPlayer;
    const blocked = (x, y) => {
      if (ignoreEntities ? this.map.solid(x, y) : !this.canEnter(mover, x, y)) return true;
      return avoidExits && !goalKeys.has(`${x},${y}`) && this.isExit(x, y);
    };
    const start = [mover.x, mover.y];
    let path = findPath(start, goals, blocked, this.map.w, this.map.h);
    if (path || !closest || !goals.length) return path;
    const target = goals[0];
    const near = nearestReachable(start, target, blocked, this.map.w, this.map.h);
    path = findPath(start, [near], blocked, this.map.w, this.map.h);
    return path;
  }

  // Tiles from which the player can interact with `e`, each with the facing
  // to use there. Includes talking across counters.
  interactSpots(e) {
    const spots = [];
    const seen = new Set();
    for (let fy = e.y; fy < e.y + e.h; fy++) {
      for (let fx = e.x; fx < e.x + e.w; fx++) {
        for (const [dir, [dx, dy]] of Object.entries(DIR_VEC)) {
          let sx = fx - dx;
          let sy = fy - dy;
          if (e.occupies(sx, sy)) continue;
          if (this.map.counter(sx, sy)) {
            sx -= dx;
            sy -= dy;
          }
          const k = `${sx},${sy}`;
          if (seen.has(k) || !this.map.inBounds(sx, sy) || this.map.solid(sx, sy) || this.isExit(sx, sy)) continue;
          seen.add(k);
          spots.push({ x: sx, y: sy, facing: dir });
        }
      }
    }
    return spots;
  }

  // ---- Scripts ---------------------------------------------------------

  // Run an async content script `fn(api, ...args)`. Scripts run one at a time;
  // later ones queue. Resolves with the script's return value.
  run(fn, ...args) {
    return new Promise((resolve, reject) => {
      this.queue.push({ fn, args, resolve, reject });
      if (!this.busy) this.next();
    });
  }

  async next() {
    const job = this.queue.shift();
    if (!job) return;
    this.busy++;
    try {
      job.resolve(await job.fn(this.api, ...job.args));
    } catch (err) {
      console.error('[script]', err);
      job.resolve(undefined);
    } finally {
      this.busy--;
      try {
        this.refreshEntities();
      } catch (err) {
        console.error('[world] refresh after script', err);
      }
      if (!this.queue.length) this.save();
      this.next();
    }
  }

  // Promise that resolves after `ticks` ticks.
  waitTicks(ticks) {
    return new Promise((resolve) => this.waiters.push({ ticks: Math.max(0, Math.round(ticks)), resolve }));
  }

  // Promise that resolves once `pred()` is true (checked every tick).
  until(pred) {
    return new Promise((resolve) => this.waiters.push({ pred, resolve }));
  }

  save() {
    if (this.game.debug.nosave) return;
    const p = this.player;
    this.state.x = p.x;
    this.state.y = p.y;
    this.state.facing = p.facing;
    writeSave(this.state);
  }

  // Always called from inside a script (changeMap), so the new map's onEnter
  // runs inline: `await g.changeMap(...)` returns after it. No save here:
  // saves happen only between scripts, so a reload never lands mid-cutscene.
  async transition(mapId, x, y, facing, { fade = true, seconds = 0.25 } = {}) {
    if (fade) await this.effects.fade('out', seconds);
    this.loadMap(mapId, x, y, facing);
    const onEnter = this.mapDef.onEnter;
    if (fade) await this.effects.fade('in', seconds);
    if (onEnter) await onEnter(this.api);
  }

  // Interact with or use an item on an entity (player already in place).
  // How many times the player has looked at (interacted with) `e` before.
  // Entities sharing a `lookKey` share a count (all the windows on a street).
  lookKey(e) {
    return `${this.state.map}:${e.def.lookKey || e.id}`;
  }

  looks(e) {
    return (this.state.looks || {})[this.lookKey(e)] || 0;
  }

  async interactWith(e, itemId = null) {
    const p = this.player;
    const [tx, ty] = nearestTileOf(e, p.x, p.y);
    const face = dirBetween(p.x, p.y, tx, ty);
    if (face) p.facing = face;
    const turn = e.directional && e.def.turnToTalk !== false;
    const prevFacing = e.facing;
    if (turn) e.facing = dirBetween(e.x, e.y, p.x, p.y) || e.facing;
    e.talking = true;
    if (e.def.talkPose) e.setPose(e.def.talkPose);
    try {
      if (itemId) await this.useItemOn(e, itemId);
      else await runInteract(this.api, e, this.looks(e));
    } finally {
      if (!itemId) {
        this.state.looks = this.state.looks || {};
        this.state.looks[this.lookKey(e)] = this.looks(e) + 1;
      }
      if (e.def.talkPose && e.pose === e.def.talkPose) e.setPose(null);
      e.talking = false;
      if (turn && (!e.def.behavior || e.def.behavior === 'idle') && !e.moving && this.byId.get(e.id) === e && e.facing !== prevFacing) {
        e.facing = e.home?.facing || prevFacing;
      }
    }
  }

  async useItemOn(e, itemId) {
    const g = this.api;
    const use = e.def.use || {};
    if (use[itemId]) return use[itemId](g, e, itemId);
    if (use['*']) return use['*'](g, e, itemId);
    const fallback = this.content.defaults?.useFail;
    if (fallback) return fallback(g, e, itemId);
    return g.describe("That doesn't do anything.");
  }

  // ---- Per-tick update ------------------------------------------------

  update(input) {
    this.tick++;
    if (this.textbox.open) {
      this.textbox.update(input);
    } else if (this.inventory.open) {
      this.inventory.update(input);
    } else if (!this.busy) {
      this.control.update(input);
    } else {
      input.taps(); // discard taps during cutscenes
    }

    for (const e of this.entities) {
      if (e.updateMove() && e.isPlayer) this.control.arrived();
    }
    for (const e of this.entities) {
      if (!e.moving && e.route && e.route.length) followRoute(this, e);
      else if (!e.isPlayer) this.updateNpc(e);
    }
    if (!this.textbox.open && !this.inventory.open && !this.busy) this.control.afterMove(input);
    else this.control.afterMove(null);
    for (const e of this.entities) e.tickAnim();
    if (this.picture) this.picture.ms += 1000 / 60;
    // Hints wait (and stay hidden) while a text box or the bag is open.
    if (this.hintState && !this.textbox.open && !this.inventory.open) this.hintState.t++;

    // Waiters
    if (this.waiters.length) {
      const still = [];
      for (const w of this.waiters) {
        if (w.pred ? w.pred() : w.ticks-- <= 0) w.resolve();
        else still.push(w);
      }
      this.waiters = still;
    }
    this.updateCamera();
  }

  updateNpc(e) {
    if (e.moving) return;
    if (this.busy || e.talking) return;
    const b = e.def.behavior;
    if (!b || b === 'idle') return;
    const type = typeof b === 'string' ? b : b.type;
    const p = this.player;
    if (type === 'face') {
      const range = b.range || 3;
      if (Math.abs(p.x - e.x) + Math.abs(p.y - e.y) <= range) e.facing = dirBetween(e.x, e.y, p.x, p.y) || e.facing;
    } else if (type === 'wander') {
      if (e.wanderWait == null) e.wanderWait = this.game.rng.int(30, 150);
      if (e.wanderWait-- > 0) return;
      const pause = b.pause || [1, 3];
      e.wanderWait = this.game.rng.int(pause[0] * 60, pause[1] * 60);
      const dirs = Object.keys(DIR_VEC);
      const dir = dirs[this.game.rng.int(0, 3)];
      const [dx, dy] = DIR_VEC[dir];
      const [ax, ay, aw, ah] = b.area || [e.home.x - 2, e.home.y - 2, 5, 5];
      const nx = e.x + dx;
      const ny = e.y + dy;
      e.facing = dir;
      if (nx < ax || ny < ay || nx + e.w > ax + aw || ny + e.h > ay + ah) return;
      if (this.canEnter(e, nx, ny) && !this.isExit(nx, ny)) e.startStep(dir);
    } else if (type === 'patrol') {
      this.patrol(e, b);
    }
  }

  // Walk a loop of waypoints: { type: 'patrol', route: [[x, y], ...], pause,
  // ghost, blockedPose, stopNear, nearPose }. With ghost, tiles don't block
  // (hurdles, low walls) but characters still do; when someone is in the way
  // the patroller waits. With stopNear: n, it stops and faces Cheryl while
  // she's within n tiles or walking over to it (clicked), then carries on.
  patrol(e, b) {
    const p = this.player;
    const near = b.stopNear && Math.abs(p.x - e.x) + Math.abs(p.y - e.y) <= b.stopNear;
    const approached = this.control.pending && this.control.pending.entity === e;
    if (near || approached) {
      e.facing = dirBetween(e.x, e.y, p.x, p.y) || e.facing;
      const pose = b.nearPose || b.blockedPose;
      if (pose && e.pose !== pose) e.setPose(pose);
      e.patrolHeld = true;
      return;
    }
    if (e.patrolHeld) {
      e.patrolHeld = false;
      if (e.pose === (b.nearPose || b.blockedPose)) e.setPose(null);
    }
    if (e.patrolWait > 0) {
      e.patrolWait--;
      return;
    }
    const route = b.route;
    e.patrolIdx = e.patrolIdx ?? 0;
    let [tx, ty] = route[e.patrolIdx % route.length];
    if (e.x === tx && e.y === ty) {
      e.patrolIdx = (e.patrolIdx + 1) % route.length;
      e.patrolWait = Math.round((b.pause || 0) * 60);
      // A plain callback, not a script: it mustn't take control from the player.
      if (b.onWaypoint) b.onWaypoint(this.api, e, e.patrolIdx);
      [tx, ty] = route[e.patrolIdx];
      if (e.patrolWait) return;
    }
    let dir;
    if (b.ghost) {
      dir = tx !== e.x ? (tx > e.x ? 'right' : 'left') : ty > e.y ? 'down' : 'up';
    } else {
      const path = this.pathFor(e, [[tx, ty]]);
      dir = path && path.length ? dirBetween(e.x, e.y, path[0][0], path[0][1]) : null;
    }
    if (!dir) return;
    const [dx, dy] = DIR_VEC[dir];
    const free = b.ghost ? !this.entityAt(e.x + dx, e.y + dy, e) : this.canEnter(e, e.x + dx, e.y + dy);
    if (free) {
      if (b.blockedPose && e.pose === b.blockedPose) e.setPose(null);
      e.startStep(dir);
    } else {
      e.facing = dir;
      if (b.blockedPose && e.pose !== b.blockedPose) e.setPose(b.blockedPose);
    }
  }

  isExit(x, y) {
    return (this.mapDef.exits || []).some((ex) => inArea(ex, x, y));
  }

  // ---- Camera ---------------------------------------------------------

  cameraTarget() {
    if (this.camPan) return this.camPan;
    const p = this.player;
    return { x: p.px + TILE / 2, y: p.py + TILE / 2 - 8 };
  }

  clampCamera(cx, cy) {
    const mw = this.map.w * TILE;
    const mh = this.map.h * TILE;
    let x = Math.round(cx - WIDTH / 2);
    let y = Math.round(cy - HEIGHT / 2);
    x = mw <= WIDTH ? Math.floor((mw - WIDTH) / 2) : Math.max(0, Math.min(mw - WIDTH, x));
    y = mh <= HEIGHT ? Math.floor((mh - HEIGHT) / 2) : Math.max(0, Math.min(mh - HEIGHT, y));
    return { x, y };
  }

  snapCamera() {
    const t = this.cameraTarget();
    this.cam = this.clampCamera(t.x, t.y);
    this.camF = { ...this.cam };
  }

  updateCamera() {
    const t = this.cameraTarget();
    const want = this.clampCamera(t.x, t.y);
    if (this.camPan && this.camPan.speed) {
      // Glide toward the pan target.
      const s = this.camPan.speed;
      const dx = want.x - this.camF.x;
      const dy = want.y - this.camF.y;
      const dist = Math.hypot(dx, dy);
      if (dist <= s) this.camF = { ...want };
      else this.camF = { x: this.camF.x + (dx / dist) * s, y: this.camF.y + (dy / dist) * s };
    } else {
      this.camF = { ...want };
    }
    this.cam = { x: Math.round(this.camF.x), y: Math.round(this.camF.y) };
  }

  // ---- Drawing --------------------------------------------------------

  draw(ctx) {
    if (this.picture) {
      this.drawPicture(ctx);
    } else {
      this.drawWorld(ctx);
    }
    if (!this.busy && !this.textbox.open && !this.inventory.open && !this.picture) this.control.drawHud(ctx);
    this.drawHint(ctx);
    this.inventory.draw(ctx);
    this.textbox.draw(ctx, this.picture ? 0 : this.player.py - this.cam.y);
  }

  drawWorld(ctx) {
    const bg = this.mapDef.background ? colorOf(this.mapDef.background) : '#000000';
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, WIDTH, HEIGHT);
    const [sx, sy] = this.effects.shakeOffset();
    const cx = this.cam.x - sx;
    const cy = this.cam.y - sy;
    const ms = (this.tick * 1000) / 60;
    // Lighting is applied per layer: the map at full strength, characters at
    // SPRITE_LIGHT (as SNES color math often spared sprites), so they stay
    // the most saturated things on screen at dusk and night.
    this.map.draw(ctx, 'ground', cx, cy, WIDTH, HEIGHT, ms);
    this.map.draw(ctx, 'detail', cx, cy, WIDTH, HEIGHT, ms);
    this.drawMarker(ctx, cx, cy);
    const lit = this.effects.hasLight();
    if (lit) {
      this.effects.applyLight(ctx, 1);
      // Emissive pixels (lit windows, lamps) skip the lighting.
      this.map.drawGlow(ctx, 'ground', cx, cy, WIDTH, HEIGHT, ms, this.emissive());
      this.map.drawGlow(ctx, 'detail', cx, cy, WIDTH, HEIGHT, ms, this.emissive());
    }
    const sorted = [...this.entities].sort((a, b) => {
      const la = a.layer === 'ground' ? 0 : 1;
      const lb = b.layer === 'ground' ? 0 : 1;
      return la - lb || a.sortY - b.sortY || a.px - b.px;
    });
    const sprites = lit ? this.layer('sprites') : ctx;
    for (const e of sorted) e.drawShadow(sprites, cx, cy);
    for (const e of sorted) e.draw(sprites, cx, cy);
    if (lit) this.compositeLit(ctx, sprites, this.content.spriteLight ?? SPRITE_LIGHT);
    const over = lit ? this.layer('overhead') : ctx;
    this.map.draw(over, 'overhead', cx, cy, WIDTH, HEIGHT, ms);
    if (lit) {
      this.compositeLit(ctx, over, 1);
      this.map.drawGlow(ctx, 'overhead', cx, cy, WIDTH, HEIGHT, ms, this.emissive());
    }
    if (this.game.debug.debug) this.drawDebug(ctx, cx, cy);
    this.effects.applyWorld(ctx);
  }

  // Colors that skip lighting: src/art/tints.js EMISSIVE, or content.emissive.
  emissive() {
    if (!this.emissiveSet) this.emissiveSet = rgbSetOf(this.content.emissive || EMISSIVE);
    return this.emissiveSet;
  }

  // A cleared, transparent offscreen layer the size of the screen.
  layer(name) {
    this.layers = this.layers || {};
    let c = this.layers[name];
    if (!c) {
      c = document.createElement('canvas');
      c.width = WIDTH;
      c.height = HEIGHT;
      this.layers[name] = c.getContext('2d');
      c = this.layers[name];
      c.imageSmoothingEnabled = false;
    }
    c.clearRect(0, 0, WIDTH, HEIGHT);
    return c;
  }

  // Light a transparent layer at `strength` (keeping its transparency) and
  // draw it onto ctx.
  compositeLit(ctx, layerCtx, strength) {
    const scratch = this.layer('scratch');
    scratch.drawImage(layerCtx.canvas, 0, 0);
    this.effects.applyLight(scratch, strength);
    scratch.globalCompositeOperation = 'destination-in';
    scratch.drawImage(layerCtx.canvas, 0, 0);
    scratch.globalCompositeOperation = 'source-over';
    ctx.drawImage(scratch.canvas, 0, 0);
  }

  // Full-screen picture (a vista): `draw(ctx, ms)` or { sheet, frame }.
  drawPicture(ctx) {
    const pic = this.picture;
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, WIDTH, HEIGHT);
    const [sx, sy] = this.effects.shakeOffset();
    ctx.save();
    ctx.translate(sx, sy);
    if (typeof pic.spec === 'function') pic.spec(ctx, pic.ms);
    else {
      const img = loadSheet(pic.spec.sheet, pic.spec.palette).frameAt(pic.spec.frame, pic.ms);
      if (img) ctx.drawImage(img, 0, 0);
    }
    ctx.restore();
    this.effects.applyWorld(ctx);
  }

  // A small, non-blocking hint box at the bottom of the screen.
  drawHint(ctx) {
    const h = this.hintState;
    if (!h || this.textbox.open || this.inventory.open) return;
    if (h.t > h.ticks) {
      this.hintState = null;
      return;
    }
    const fade = 20;
    const a = Math.min(1, h.t / fade, (h.ticks - h.t) / fade);
    const lines = wrap(h.text, WIDTH - 32);
    const w = Math.max(...lines.map((l) => measure(l))) + 16;
    const bh = lines.length * LINE_HEIGHT + 6;
    const x = Math.round((WIDTH - w) / 2);
    const y = HEIGHT - 7 - bh;
    ctx.save();
    ctx.globalAlpha = Math.round(a * 8) / 8;
    drawBox(ctx, x, y, w, bh, STYLES.npc);
    lines.forEach((l, i) => drawText(ctx, l, x + 8, y + 4 + i * LINE_HEIGHT, { color: 'ui_text' }));
    ctx.restore();
  }

  drawMarker(ctx, cx, cy) {
    const m = this.marker;
    if (!m) return;
    m.t++;
    const frame = m.t < 4 ? 'marker_0' : m.t < 8 ? 'marker_1' : m.t < 14 ? 'marker_2' : Math.floor(m.t / 24) % 2 ? 'marker_1' : 'marker_0';
    if (m.t > 14 && !m.persist) return;
    ctx.drawImage(this.small.frame(frame), m.x * TILE + 4 - cx, m.y * TILE + 6 - cy);
  }

  drawDebug(ctx, cx, cy) {
    ctx.save();
    ctx.globalAlpha = 0.35;
    for (let y = 0; y < this.map.h; y++) {
      for (let x = 0; x < this.map.w; x++) {
        if (this.map.solid(x, y)) {
          ctx.fillStyle = '#f80000';
          ctx.fillRect(x * TILE - cx, y * TILE - cy, TILE, TILE);
        }
      }
    }
    ctx.fillStyle = '#00f8f8';
    for (const ex of this.mapDef.exits || []) ctx.fillRect(ex.x * TILE - cx, ex.y * TILE - cy, (ex.w || 1) * TILE, (ex.h || 1) * TILE);
    ctx.fillStyle = '#f8f800';
    for (const [x, y] of this.control.path || []) ctx.fillRect(x * TILE + 6 - cx, y * TILE + 6 - cy, 4, 4);
    ctx.restore();
    const p = this.player;
    drawText(ctx, `${this.state.map} ${p.x},${p.y}`, 4, HEIGHT - 12, { color: 'ui_select' });
  }
}

// Call a content callback (a `when`, a sprite or lighting function); a throw
// is logged and counts as a falsy result instead of stopping the game.
export function safeCall(fn, ...args) {
  try {
    return fn(...args);
  } catch (err) {
    console.error('[content]', err);
    return undefined;
  }
}

export function isInteractable(e) {
  const d = e.def;
  return !!(d.interact || d.use || d.look || d.looks || d.talk);
}

function sameSprite(a, b) {
  if (!a || !b) return a === b;
  return a.sheet === b.sheet && a.palette === b.palette && a.frame === b.frame;
}

// How strongly scene lighting tints characters, relative to the map.
// content.spriteLight overrides it.
export const SPRITE_LIGHT = 0.5;

// Lighting presets come from the art task's time-of-day tints
// (src/art/tints.js): each is one { color, amount, mode } pass or a list of
// them. content.lighting may add or replace presets.
export const LIGHTING = Object.fromEntries(
  Object.entries(TINTS).map(([name, t]) => [name, (Array.isArray(t) ? t : [t]).filter((p) => (p.amount ?? 1) > 0)]),
);

// `looks` is how many times the player looked before this time.
async function runInteract(g, e, looks) {
  const d = e.def;
  if (d.interact) return d.interact(g, e, looks);
  if (d.looks) {
    // looks: [first, second, ..., then]; each entry a line or a list of lines.
    const entry = d.looks[Math.min(looks, d.looks.length - 1)];
    return g.describe(...(Array.isArray(entry) ? entry : [entry]));
  }
  if (d.talk) {
    const lines = Array.isArray(d.talk) ? d.talk : [d.talk];
    return g.say(e.name, ...lines);
  }
  if (d.look) {
    const lines = Array.isArray(d.look) ? d.look : [d.look];
    return g.describe(...lines);
  }
  return undefined;
}

export function inArea(a, x, y) {
  return x >= a.x && y >= a.y && x < a.x + (a.w || 1) && y < a.y + (a.h || 1);
}

function nearestTileOf(e, x, y) {
  const nx = Math.max(e.x, Math.min(e.x + e.w - 1, x));
  const ny = Math.max(e.y, Math.min(e.y + e.h - 1, y));
  return [nx, ny];
}

// Scripted movement for NPCs (and the player during cutscenes): e.route is a
// list of directions; e.routeGoal (optional) lets us re-path around obstacles.
export function followRoute(world, e) {
  const dir = e.route[0];
  const [dx, dy] = DIR_VEC[dir];
  const nx = e.x + dx;
  const ny = e.y + dy;
  if (e.routeGhost || e.routeForce || world.canEnter(e, nx, ny)) {
    e.route.shift();
    e.startStep(dir);
    e.routeBlocked = 0;
    e.routeForce = false; // walking through only lasts the one step that needed it
    return;
  }
  e.facing = dir;
  e.routeBlocked = (e.routeBlocked || 0) + 1;
  if (e.routeGoal && e.routeBlocked % 20 === 0) {
    const path = world.pathFor(e, [e.routeGoal]);
    if (path) e.route = pathToDirs([e.x, e.y], path);
  }
  // A scripted move must finish: after two seconds, walk through whatever is in the way.
  if (e.routeBlocked > 120 && !world.map.solid(nx, ny)) e.routeForce = true;
}

export function pathToDirs(start, path) {
  const dirs = [];
  let [x, y] = start;
  for (const [nx, ny] of path) {
    dirs.push(dirBetween(x, y, nx, ny));
    x = nx;
    y = ny;
  }
  return dirs;
}
