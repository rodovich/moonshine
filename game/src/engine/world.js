// The world scene: the current map, its entities, the player, the camera,
// and the script runner. Player control lives in control.js; the script API
// in script.js.

import { WIDTH, HEIGHT } from './display.js';
import { TileMap, TILE, layerName, layerRows } from './tilemap.js';
import { Entity, DIR_VEC, dirBetween } from './entity.js';
import { findPath, nearestReachable } from './pathfind.js';
import { makeApi } from './script.js';
import { Control } from './control.js';
import { Ambient } from './ambient.js';
import { writeSave } from './save.js';
import { colorOf, loadSheet, rgbSetOf } from './art.js';
import { uiSmall } from '../art/ui.js';
import { TINTS, EMISSIVE } from '../art/tints.js';
import { drawText, measure, wrap, LINE_HEIGHT } from './text.js';
import { STYLES, drawBox } from './ui.js';
import { playMusic, stopMusic, setAmbience, setMusicFilter } from './sound.js';

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
    this.ambient = new Ambient(this);
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
    this.variant = this.pickVariant(def);
    this.map = new TileMap(this.layerDef());
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
    this.ambient.reset();
    this.camPan = null;
    this.snapCamera();
    this.applyLighting(0);
    // Audio: ambience beds and a music filter per map (see sound.js).
    // music, ambience, and musicFilter may be functions of the state, like
    // lighting, so a later act can change a map's mood before it fades in.
    const val = (v) => (typeof v === 'function' ? safeCall(v, this.api) : v);
    setAmbience(val(def.ambience) || []);
    setMusicFilter(val(def.musicFilter) || null);
    const music = val(def.music);
    if (music !== undefined) {
      if (music) playMusic(music);
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
    this.placeCharacters();
    this.applyPatches();
  }

  // content.characters: people defined once, placed by story state.
  //   kid: { name, sprite, talks, ..., at: (g) => ({ map, x, y, facing, behavior }) or null }
  // When `at` changes (after a script, or setFlag), the character appears,
  // leaves, or moves to the new spot.
  placeCharacters() {
    for (const [id, ch] of Object.entries(this.content.characters || {})) {
      const at = ch.at ? safeCall(ch.at, this.api) : null;
      let e = this.byId.get(id);
      const here = at && at.map === this.state.map;
      const key = here ? `${at.x},${at.y},${at.facing || ''},${JSON.stringify(at.behavior || null)}` : null;
      if (!here) {
        if (e && e.character) this.removeEntity(e);
        continue;
      }
      if (e && !e.character) continue; // a map entity with the same id wins
      if (e && e.atKey === key) continue;
      const def = { ...ch, id, x: at.x, y: at.y, facing: at.facing || ch.facing, behavior: at.behavior !== undefined ? at.behavior : ch.behavior };
      delete def.at;
      if (e) this.removeEntity(e);
      e = new Entity(def);
      e.character = true;
      e.atKey = key;
      e.home = { x: def.x, y: def.y, facing: e.facing };
      this.entities.push(e);
      this.byId.set(id, e);
    }
  }

  // Map variants: `variants: [{ when, ground, detail, overhead, collision,
  // legend }]` replace whole layers while `when` holds (the first match wins):
  // the canals drained, the fountain dry. Layers a variant leaves out come
  // from the base map; its legend adds to the base legend.
  pickVariant(def) {
    const list = def.variants || [];
    return list.findIndex((v) => !v.when || safeCall(v.when, this.api));
  }

  layerDef() {
    const def = this.mapDef;
    const v = this.variant >= 0 ? def.variants[this.variant] : null;
    if (!v) return def;
    return { ...def, ...v, legend: { ...def.legend, ...(v.legend || {}) }, id: def.id, tileset: def.tileset };
  }

  // A map's `patches(g)` returns [layer, x, y, value] changes for the current
  // state (a taken item leaves a bare counter, a moved piano clears the
  // stair). [layer, x, y, value, w, h] fills a rectangle.
  applyPatches() {
    // A different variant now? Rebuild the tiles first.
    const v = this.pickVariant(this.mapDef);
    if (v !== this.variant) {
      this.variant = v;
      this.map = new TileMap(this.layerDef());
      this.patched = [];
    }
    const fn = this.mapDef.patches;
    if (!fn) return;
    // Undo previous patches, then apply the current list.
    for (const [layer, x, y, tile] of [...(this.patched || [])].reverse()) this.map.setTile(layer, x, y, tile);
    this.patched = [];
    for (const [layer, x0, y0, value, w = 1, h = 1] of safeCall(fn, this.api) || []) {
      for (let y = y0; y < y0 + h; y++) {
        for (let x = x0; x < x0 + w; x++) {
          this.patched.push([layer, x, y, this.originalTile(layer, x, y)]);
          this.map.setTile(layer, x, y, value);
        }
      }
    }
  }

  originalTile(layer, x, y) {
    const def = this.layerDef();
    const ch = layerRows(def, layerName(layer))?.[y]?.[x];
    return ch && ch !== ' ' ? def.legend[ch] : null;
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
    return this.pickEntity(this.entities.filter((e) => !e.isPlayer && e.visible
      && e.x <= x && e.y <= y && x < e.x + e.w && y < e.y + e.h && isInteractable(e)));
  }

  // When several interactable things share a tile: solid things win over
  // non-solid ones (the solid broken edge over the Boatman drawn on it), and
  // among equals characters win over objects with sprites, which win over
  // sprite-less hotspots (the Kid standing on the hollow step).
  pickEntity(list) {
    const rank = (e) => (e.solid ? 0 : 3) + (e.directional ? 0 : e.art ? 1 : 2);
    return list.length ? list.reduce((a, b) => (rank(b) < rank(a) ? b : a)) : null;
  }

  blocked(x, y, mover = null) {
    if (this.map.solid(x, y)) return true;
    const e = this.entityAt(x, y, mover);
    if (e) return true;
    // Cheryl never walks onto a character, even one marked solid: false
    // (that only keeps it from blocking other characters' paths).
    if (mover && mover.isPlayer) {
      return this.entities.some((o) => o !== mover && o.directional && o.visible && o.occupies(x, y));
    }
    return false;
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

  // Like canEnter for Cheryl's route planning: characters don't count (they
  // step aside or turn back when she reaches them), unless they're marked
  // `blocks: true` (a guard who holds a doorway). Objects still block.
  canPlan(mover, x, y) {
    for (let dy = 0; dy < mover.h; dy++) {
      for (let dx = 0; dx < mover.w; dx++) {
        const tx = x + dx;
        const ty = y + dy;
        if (this.map.solid(tx, ty)) return false;
        for (const o of this.entities) {
          if (o === mover || !o.visible || !o.occupies(tx, ty)) continue;
          if (o.directional ? o.def.blocks : o.solid) return false;
        }
      }
    }
    return true;
  }

  // Ask character `e`, standing in Cheryl's way, to step aside: to the nearest
  // tile (within 5 steps) that isn't in `avoid` (her route) and isn't an exit.
  // In a one-tile corridor that means walking out of it ahead of her. Idle
  // characters go back to their spot once she's gone by. Returns whether he moves.
  yieldTo(e, avoid) {
    if (!e.directional || e.def.blocks || e.moving || e.talking || (e.route && e.route.length)) return false;
    const start = `${e.x},${e.y}`;
    const seen = new Map([[start, null]]);
    const queue = [[e.x, e.y, 0]];
    let goal = null;
    for (let i = 0; i < queue.length && !goal; i++) {
      const [x, y, d] = queue[i];
      if (d >= 5) continue;
      for (const [dx, dy] of Object.values(DIR_VEC)) {
        const nx = x + dx;
        const ny = y + dy;
        const k = `${nx},${ny}`;
        if (seen.has(k) || !this.canEnter(e, nx, ny) || this.isExit(nx, ny)) continue;
        seen.set(k, `${x},${y}`);
        if (!avoid.has(k)) {
          goal = [nx, ny];
          break;
        }
        queue.push([nx, ny, d + 1]);
      }
    }
    if (!goal) {
      if (!e.warnedYield) console.warn(`[world] ${e.id} is in Cheryl's way and has nowhere to step aside to`);
      e.warnedYield = true;
      return false;
    }
    const path = [];
    for (let k = `${goal[0]},${goal[1]}`; k !== start; k = seen.get(k)) path.unshift(k.split(',').map(Number));
    const b = e.def.behavior;
    const type = b && (typeof b === 'string' ? b : b.type);
    if (!e.yieldHome && (!type || type === 'idle' || type === 'face')) e.yieldHome = { x: e.x, y: e.y, facing: e.facing };
    e.route = pathToDirs([e.x, e.y], path);
    e.routeGoal = null;
    return true;
  }

  // Path for an entity to any of `goals`, avoiding solid tiles and entities.
  // If none is reachable and `closest` is set, path to the nearest reachable
  // tile. The player's paths never cross an exit unless it's the goal, so a
  // click near a door can't carry Cheryl through it.
  pathFor(mover, goals, { closest = false, ignoreEntities = false } = {}) {
    const goalKeys = new Set(goals.map(([x, y]) => `${x},${y}`));
    const avoidExits = mover.isPlayer;
    const exits = avoidExits ? this.activeExits() : null;
    // Cheryl's routes go around characters when they can. Moving non-solid
    // characters (patrollers, wanderers) never count, since they move on.
    // If characters are the only thing in the way, a second pass plans
    // through them: whoever is in the way steps aside when she gets there.
    const start = [mover.x, mover.y];
    const attempt = (mode) => {
      const blocked = (x, y) => {
        let bad;
        if (mode === 'raw') bad = this.map.solid(x, y);
        else if (mode === 'enter') bad = !this.canEnter(mover, x, y);
        else if (mode === 'around') bad = !this.canEnterAround(mover, x, y);
        else bad = !this.canPlan(mover, x, y);
        if (bad) return true;
        return avoidExits && !goalKeys.has(`${x},${y}`) && this.isExit(x, y, exits);
      };
      let path = findPath(start, goals, blocked, this.map.w, this.map.h);
      if (path || !closest || !goals.length) return path;
      const near = nearestReachable(start, goals[0], blocked, this.map.w, this.map.h);
      return findPath(start, [near], blocked, this.map.w, this.map.h);
    };
    if (ignoreEntities) return attempt('raw');
    if (!mover.isPlayer) return attempt('enter');
    const around = findPath(start, goals, (x, y) => !this.canEnterAround(mover, x, y) || (avoidExits && !goalKeys.has(`${x},${y}`) && this.isExit(x, y, exits)), this.map.w, this.map.h);
    if (around) return around;
    return attempt('through');
  }

  // canEnter for Cheryl's first planning pass: everyone blocks except moving
  // non-solid characters.
  canEnterAround(mover, x, y) {
    for (let dy = 0; dy < mover.h; dy++) {
      for (let dx = 0; dx < mover.w; dx++) {
        const tx = x + dx;
        const ty = y + dy;
        if (this.map.solid(tx, ty)) return false;
        for (const o of this.entities) {
          if (o === mover || !o.visible || !o.occupies(tx, ty)) continue;
          if (o.directional ? o.def.blocks || o.solid || !movesOnItsOwn(o) : o.solid) return false;
        }
      }
    }
    return true;
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

  // Fallback spots diagonal to `e`, for things whose sides can't be reached:
  // Cheryl faces up or down, and Z reaches what's diagonally ahead of her
  // when nothing is straight ahead (see Control.interactFront).
  diagonalSpots(e) {
    const spots = [];
    const seen = new Set();
    for (let fy = e.y; fy < e.y + e.h; fy++) {
      for (let fx = e.x; fx < e.x + e.w; fx++) {
        for (const [dx, dy] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) {
          const sx = fx + dx;
          const sy = fy + dy;
          const k = `${sx},${sy}`;
          if (seen.has(k) || e.occupies(sx, sy) || !this.map.inBounds(sx, sy) || this.map.solid(sx, sy) || this.isExit(sx, sy)) continue;
          seen.add(k);
          spots.push({ x: sx, y: sy, facing: dy > 0 ? 'up' : 'down', diagonal: true });
        }
      }
    }
    return spots;
  }

  // What Z reaches from tile (x, y) facing `facing`: the thing straight
  // ahead (across a counter if need be), else a character on her own tile,
  // else something diagonally ahead. Shared by the game and the keyboard
  // reachability check (tests/check-keyboard).
  zTarget(x, y, facing, self = this.player) {
    const [dx, dy] = DIR_VEC[facing];
    let e = this.interactableAt(x + dx, y + dy);
    if (!e && this.map.counter(x + dx, y + dy)) e = this.interactableAt(x + 2 * dx, y + 2 * dy);
    const here = this.pickEntity(this.entities.filter((o) => o !== self && !o.isPlayer && o.visible && o.directional && isInteractable(o) && o.x === x && o.y === y));
    if (here && (!e || !e.directional)) e = here;
    if (!e) {
      // Nothing ahead: something diagonally ahead (left or right of the tile in front).
      const [px, py] = [dy, dx]; // perpendicular
      e = this.pickEntity([this.interactableAt(x + dx + px, y + dy + py), this.interactableAt(x + dx - px, y + dy - py)].filter(Boolean));
    }
    return e;
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
      // A script that ended mid-visit without restorePlayer(): bring Cheryl back.
      if (this.cutscene && !this.queue.length) {
        console.warn('[world] a script ended during a cutscene visit; restoring the player');
        this.run(() => this.restorePlayer({ fade: false }));
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
    if (this.cutscene) return; // Cheryl is away from her real spot; restorePlayer() first
    const p = this.player;
    this.state.x = p.x;
    this.state.y = p.y;
    this.state.facing = p.facing;
    writeSave(this.state);
  }

  // Always called from inside a script (changeMap), so the new map's onEnter
  // runs inline: `await g.changeMap(...)` returns after it. No save here:
  // saves happen only between scripts, so a reload never lands mid-cutscene.
  // { cutscene: true } visits a map without Cheryl: her real map and spot are
  // kept, she's hidden, the map's onEnter doesn't run (unless onEnter: true),
  // and restorePlayer() brings her back. Point the camera with
  // g.cameraFollow(id) or g.panCamera.
  async transition(mapId, x, y, facing, { fade = true, seconds = 0.25, cutscene = false, onEnter: runEnter } = {}) {
    if (fade) await this.effects.fade('out', seconds);
    const p = this.player;
    if (cutscene && !this.cutscene) this.cutscene = { map: this.state.map, x: p.x, y: p.y, facing: p.facing };
    const spawn = this.content.maps[mapId]?.spawn || [0, 0];
    this.loadMap(mapId, x ?? spawn[0], y ?? spawn[1], facing);
    if (this.cutscene) {
      p.visible = false;
      p.solid = false;
    }
    const onEnter = this.mapDef.onEnter;
    if (fade) await this.effects.fade('in', seconds);
    if (onEnter && (runEnter ?? !this.cutscene)) await onEnter(this.api);
  }

  // Back from a cutscene visit: Cheryl's map, spot, and facing, visible again.
  async restorePlayer({ fade = true, seconds = 0.25 } = {}) {
    const c = this.cutscene;
    if (!c) return;
    this.cutscene = null;
    this.camFollow = null;
    await this.transition(c.map, c.x, c.y, c.facing, { fade, seconds, onEnter: false });
    this.player.visible = true;
    this.player.solid = true;
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

  // Using an item on something. Precedence: the target's use[item]; the
  // item's own useOn.npc / useOn.object (e.g. "Crowbar on any NPC: No.");
  // the target's use['*']; the target's `decline` line(s); defaults.useFail.
  async useItemOn(e, itemId) {
    const g = this.api;
    const use = e.def.use || {};
    if (use[itemId]) return use[itemId](g, e, itemId);
    const kind = e.def.kind || (e.directional ? 'npc' : 'object');
    const itemUse = this.content.items?.[itemId]?.useOn?.[kind];
    if (itemUse) return typeof itemUse === 'function' ? itemUse(g, e, itemId) : this.sayOrDescribe(e, itemUse);
    if (use['*']) return use['*'](g, e, itemId);
    if (e.def.decline) return this.sayOrDescribe(e, e.def.decline);
    const fallback = this.content.defaults?.useFail;
    if (fallback) return fallback(g, e, itemId);
    return g.describe("That doesn't do anything.");
  }

  // Characters say a line in their own voice; objects get Cheryl's description.
  sayOrDescribe(e, lines) {
    const list = Array.isArray(lines) ? lines : [lines];
    return e.directional && e.name ? this.api.say(e, ...list) : this.api.describe(...list);
  }

  // Looking at an item in the bag: items.x.examine(g, looks) or items.x.looks
  // ([first, second, ..., then]; `looksRepeat: 'cycle'` cycles after the first).
  async examineItem(id) {
    const def = this.content.items?.[id];
    if (!def) return;
    const key = `item:${id}`;
    this.state.looks = this.state.looks || {};
    const n = this.state.looks[key] || 0;
    this.state.looks[key] = n + 1;
    if (def.examine) return def.examine(this.api, n);
    const entry = pickByCount(def.looks || [def.description || def.name], n, def.looksRepeat);
    return this.api.describe(...(Array.isArray(entry) ? entry : [entry]));
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
      // During cutscenes, input only matters to g.waitForInput().
      const any = input.taps().length > 0 || input.pressed('confirm') || input.pressed('cancel');
      if (any && this.inputWaiters?.length) {
        const ws = this.inputWaiters;
        this.inputWaiters = [];
        ws.forEach((r) => r());
      }
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
    this.ambient.update();
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
    // Stepped aside for Cheryl: go back once she's well past.
    if (e.yieldHome) {
      const h = e.yieldHome;
      const p = this.player;
      if (e.x === h.x && e.y === h.y) {
        e.facing = h.facing;
        e.yieldHome = null;
      } else if (Math.abs(p.x - h.x) + Math.abs(p.y - h.y) > 2 && !(this.control.path && this.control.path.length)) {
        const path = this.pathFor(e, [[h.x, h.y]]);
        if (path) e.route = pathToDirs([e.x, e.y], path);
        return;
      } else return;
    }
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
    // noStop: [[x, y, w, h], ...] areas where he finishes the stretch first.
    const mayStop = !(b.noStop || []).some(([ax, ay, aw, ah]) => e.x >= ax && e.y >= ay && e.x < ax + aw && e.y < ay + ah);
    if ((near || approached) && mayStop) {
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
    const step = e.patrolReverse ? route.length - 1 : 1;
    if (e.x === tx && e.y === ty) {
      e.patrolIdx = (e.patrolIdx + step) % route.length;
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
      // Cheryl in the way (a narrow flight): after a moment he turns round and
      // runs his lap the other way, so neither waits on the other for ever.
      const [nx, ny] = [e.x + dx, e.y + dy];
      if (p.occupies(nx, ny) || (this.control.path && this.control.path.some(([px, py]) => px === nx && py === ny))) {
        e.patrolBlockedT = (e.patrolBlockedT || 0) + 1;
        if (e.patrolBlockedT > 30) {
          e.patrolBlockedT = 0;
          e.patrolReverse = !e.patrolReverse;
          e.patrolIdx = (e.patrolIdx + (e.patrolReverse ? route.length - 1 : 1)) % route.length;
        }
      }
      return;
    }
    e.patrolBlockedT = 0;
  }

  // Exits that count for pathing: open ones (no `when`, or `when` holds) and
  // closed ones that explain themselves (`blocked`). A closed exit without
  // `blocked` is just floor until it opens.
  activeExits() {
    return (this.mapDef.exits || []).filter((ex) => !ex.when || ex.blocked || safeCall(ex.when, this.api));
  }

  isExit(x, y, exits = null) {
    return (exits || this.activeExits()).some((ex) => inArea(ex, x, y));
  }

  // ---- Camera ---------------------------------------------------------

  cameraTarget() {
    const f = this.camFollow && this.byId.get(this.camFollow);
    if (f) return { x: f.px + (f.w * TILE) / 2, y: f.py + TILE / 2 - 8, speed: this.camFollowSpeed };
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
    const glide = (this.camFollow && this.camFollowSpeed) || (this.camPan && this.camPan.speed);
    if (glide) {
      // Glide toward the pan target.
      const s = glide;
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
    if (!this.picture) this.ambient.drawBark(ctx);
    this.drawHint(ctx);
    this.inventory.draw(ctx);
    // On tall phones the game draws the box below the frame instead.
    if (!this.textbox.below) this.textbox.draw(ctx, this.picture ? 0 : this.player.py - this.cam.y);
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
    this.ambient.drawEffects(ctx, cx, cy, 'ground');
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
    this.ambient.drawEffects(sprites, cx, cy, 'top');
    if (lit) this.compositeLit(ctx, sprites, this.content.spriteLight ?? SPRITE_LIGHT);
    const over = lit ? this.layer('overhead') : ctx;
    this.map.draw(over, 'overhead', cx, cy, WIDTH, HEIGHT, ms);
    if (lit) {
      this.compositeLit(ctx, over, 1);
      this.map.drawGlow(ctx, 'overhead', cx, cy, WIDTH, HEIGHT, ms, this.emissive());
    }
    this.drawDarkness(ctx, cx, cy);
    this.ambient.drawEmotes(ctx, cx, cy);
    if (this.game.debug.debug) this.drawDebug(ctx, cx, cy);
    this.effects.applyWorld(ctx);
  }

  // Colors that skip lighting: src/art/tints.js EMISSIVE, or content.emissive.
  emissive() {
    if (!this.emissiveSet) this.emissiveSet = rgbSetOf(this.content.emissive || EMISSIVE);
    return this.emissiveSet;
  }

  // Darkness with light sources (the Lamp Halls). A map's `darkness` (0..1, or
  // a function of the state) covers the screen in near-black, with holes
  // around lights: the map's `lights(g)` ([{ x, y, radius }] in tiles),
  // entities with `light: radius`, and the player's `playerLight` (a number
  // or (g) => number, on the map or the content). Holes fade in three bands.
  drawDarkness(ctx, cx, cy) {
    const def = this.mapDef;
    let dark = def.darkness ?? def.dark;
    if (typeof dark === 'function') dark = safeCall(dark, this.api);
    if (!dark) return;
    // A light is a radius in tiles, or { radius, color }.
    const asLight = (l) => (typeof l === 'number' ? { radius: l } : l);
    let mapLights = def.lights || [];
    if (typeof mapLights === 'function') mapLights = safeCall(mapLights, this.api) || [];
    const lights = mapLights.filter((l) => !l.when || safeCall(l.when, this.api)).map((l) => ({
      px: l.x * TILE + TILE / 2, py: l.y * TILE + TILE / 2, r: l.radius, color: l.color,
    }));
    for (const e of this.entities) {
      const l = e.visible && e.def.light && asLight(e.def.light);
      if (l) lights.push({ px: e.px + (e.w * TILE) / 2, py: e.py + (e.h * TILE) / 2 - 8, r: l.radius, color: l.color });
    }
    let pl = def.playerLight ?? this.content.playerLight;
    if (typeof pl === 'function') pl = safeCall(pl, this.api);
    if (pl) {
      pl = asLight(pl);
      lights.push({ px: this.player.px + TILE / 2, py: this.player.py, r: pl.radius, color: pl.color });
    }
    const layer = this.layer('dark');
    layer.fillStyle = colorOf(def.darkColor || 'void');
    layer.fillRect(0, 0, WIDTH, HEIGHT);
    // Light pools stay inside the map: no glow over the void around a room.
    // Clipped to the map, or to the map's lightArea rectangles (tiles), so a
    // small room's light doesn't spill past its walls into the void.
    const areas = def.lightArea ? def.lightArea.map(([x, y, w, h]) => [x * TILE - cx, y * TILE - cy, w * TILE, h * TILE]) : [[-cx, -cy, this.map.w * TILE, this.map.h * TILE]];
    const clipTo = (c) => {
      c.beginPath();
      for (const r of areas) c.rect(...r);
      c.clip();
    };
    layer.save();
    clipTo(layer);
    layer.globalCompositeOperation = 'destination-out';
    for (const l of lights) {
      for (const [k, a] of [[1, 0.4], [0.75, 0.6], [0.5, 1]]) {
        layer.globalAlpha = a;
        layer.drawImage(discImage(Math.round(l.r * TILE * k)), Math.round(l.px - cx - l.r * TILE * k), Math.round(l.py - cy - l.r * TILE * k));
      }
    }
    layer.restore();
    ctx.save();
    ctx.globalAlpha = Math.min(1, dark);
    ctx.drawImage(layer.canvas, 0, 0);
    // Colored lights tint their pool (inner bands a little more).
    clipTo(ctx);
    ctx.globalCompositeOperation = 'screen';
    for (const l of lights) {
      if (!l.color) continue;
      const tint = this.layer('tint');
      for (const [k, a] of [[1, 0.12], [0.5, 0.12]]) {
        const d = Math.round(l.r * TILE * k);
        tint.globalAlpha = a;
        tint.drawImage(discImage(d), Math.round(l.px - cx - d), Math.round(l.py - cy - d));
      }
      tint.globalAlpha = 1;
      tint.globalCompositeOperation = 'source-in';
      tint.fillStyle = colorOf(l.color);
      tint.fillRect(0, 0, WIDTH, HEIGHT);
      tint.globalCompositeOperation = 'source-over';
      ctx.drawImage(tint.canvas, 0, 0);
    }
    ctx.restore();
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
    const perf = this.game.perf;
    drawText(ctx, `${this.state.map} ${p.x},${p.y}  upd ${perf.update.toFixed(2)}ms  draw ${perf.render.toFixed(2)}ms`, 4, HEIGHT - 12, { color: 'ui_select' });
  }
}

// A filled pixel disc of radius r (crisp edges, no anti-aliasing), cached.
const discs = new Map();
function discImage(r) {
  let c = discs.get(r);
  if (c) return c;
  c = document.createElement('canvas');
  c.width = c.height = Math.max(1, r * 2);
  const ctx = c.getContext('2d');
  ctx.fillStyle = '#000';
  for (let y = 0; y < r * 2; y++) {
    const dy = y - r + 0.5;
    const half = Math.floor(Math.sqrt(Math.max(0, r * r - dy * dy)));
    ctx.fillRect(r - half, y, half * 2, 1);
  }
  discs.set(r, c);
  return c;
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

// A character that walks on its own (a patroller or wanderer).
function movesOnItsOwn(e) {
  const b = e.def.behavior;
  const t = b && (typeof b === 'string' ? b : b.type);
  return t === 'patrol' || t === 'wander';
}

export function isInteractable(e) {
  const d = e.def;
  return !!(d.interact || d.use || d.look || d.looks || d.talk || d.talks);
}

// Entry `n` (0-based) of a first/second/.../then list. repeat: 'last' (the
// last entry repeats) or 'cycle' (after the first, cycle through the rest).
export function pickByCount(list, n, repeat = 'last') {
  if (n < list.length) return list[n];
  if (repeat === 'cycle' && list.length > 1) return list[1 + ((n - 1) % (list.length - 1))];
  return list[list.length - 1];
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
    const entry = pickByCount(d.looks, looks, d.looksRepeat);
    return g.describe(...(Array.isArray(entry) ? entry : [entry]));
  }
  if (d.talks) {
    // talks: the same for things the entity says.
    const entry = pickByCount(d.talks, looks, d.talksRepeat);
    return g.say(e, ...(Array.isArray(entry) ? entry : [entry]));
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
  if (!DIR_VEC[dir]) {
    // Never let a bad step hang a scene: skip it.
    console.warn(`[world] ${e.id}: skipping a route step that isn't a direction:`, dir);
    e.route.shift();
    return;
  }
  const [dx, dy] = DIR_VEC[dir];
  const nx = e.x + dx;
  const ny = e.y + dy;
  const p = world.player;
  // Nobody ever walks into Cheryl: not ghosts, not forced steps.
  const intoPlayer = !e.isPlayer && p.solid && p.visible && occupiesWithFootprint(p, e, nx, ny);
  if (!intoPlayer && (e.routeGhost || e.routeForce || world.canEnter(e, nx, ny))) {
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
  if (intoPlayer) {
    // Cheryl is in the way. In a cutscene she can't move herself, so after a
    // moment she steps aside; otherwise the walker waits for her.
    if (world.busy && e.routeBlocked > 90 && !p.moving && !(p.route && p.route.length)) nudgeAside(world, p, e, dir);
    return;
  }
  // Cheryl's own scripted walk never passes through anyone: a character in
  // the way is asked to step aside; after three seconds blocked, she stops
  // where she is (and the script carries on).
  if (e.isPlayer) {
    if (e.routeBlocked % 30 === 12) {
      const blocker = world.entities.find((o) => o !== e && o.directional && o.visible && o.occupies(nx, ny));
      if (blocker) {
        const avoid = new Set([`${e.x},${e.y}`]);
        let [ax, ay] = [e.x, e.y];
        for (const d of e.route) {
          ax += DIR_VEC[d][0];
          ay += DIR_VEC[d][1];
          avoid.add(`${ax},${ay}`);
        }
        world.yieldTo(blocker, avoid);
      }
    }
    if (e.routeBlocked > 180) {
      console.warn(`[script] the player's walk is blocked at (${e.x},${e.y}); stopping it`);
      e.route = [];
    }
    return;
  }
  // A scripted move must finish: after two seconds, walk through another
  // character (never Cheryl, never a wall).
  if (e.routeBlocked > 120 && !world.map.solid(nx, ny)) e.routeForce = true;
  // Into a wall (a step a script asked for that can never happen): skip it
  // after two seconds rather than hang the scene.
  if (e.routeBlocked > 120 && world.map.solid(nx, ny)) {
    console.warn(`[world] ${e.id}: a scripted step ${dir} from (${e.x},${e.y}) runs into a wall; skipping it`);
    e.route.shift();
    e.routeBlocked = 0;
  }
}

// Does `p` overlap mover `e`'s footprint if `e` stood at (x, y)?
function occupiesWithFootprint(p, e, x, y) {
  for (let fy = 0; fy < e.h; fy++) for (let fx = 0; fx < e.w; fx++) if (p.occupies(x + fx, y + fy)) return true;
  return false;
}

// Step Cheryl one tile out of a walker's way: to the side if possible (not
// along the walker's next steps), else back.
function nudgeAside(world, p, e, dir) {
  const [dx, dy] = DIR_VEC[dir];
  const ahead = new Set();
  let [x, y] = [e.x, e.y];
  for (const d of e.route.slice(0, 4)) {
    x += DIR_VEC[d][0];
    y += DIR_VEC[d][1];
    ahead.add(`${x},${y}`);
  }
  const sides = dx ? ['up', 'down'] : ['left', 'right'];
  const back = Object.keys(DIR_VEC).find((d) => DIR_VEC[d][0] === dx && DIR_VEC[d][1] === dy);
  for (const d of [...sides, back]) {
    const tx = p.x + DIR_VEC[d][0];
    const ty = p.y + DIR_VEC[d][1];
    if (ahead.has(`${tx},${ty}`) || !world.canEnter(p, tx, ty) || world.isExit(tx, ty)) continue;
    const facing = p.facing;
    p.startStep(d);
    p.facing = facing; // she steps aside without turning her back
    e.routeBlocked = 0;
    return;
  }
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
