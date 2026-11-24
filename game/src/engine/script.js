// The script API handed to content scripts as `g`:
//
//   interact: async (g, self) => { await g.say('Old Man', 'Hello.'); }
//
// Every function that takes time returns a promise; await it. See
// src/engine/README.md for the full reference.

import { DIR_VEC, dirBetween } from './entity.js';
import { pathToDirs } from './world.js';
import { playMusic, stopMusic, sfx } from '../audio/index.js';
import { loadSheet } from './art.js';
import { TILE } from './tilemap.js';

export function makeApi(world) {
  const fx = world.effects;
  const tb = world.textbox;
  const secs = (s) => Math.round(s * 60);

  function speakerName(speaker) {
    if (speaker == null) return null;
    if (typeof speaker === 'string') {
      const e = world.entity(speaker);
      return e && e.name ? e.name : speaker;
    }
    return speaker.name || null;
  }

  async function showLines(lines, opts) {
    for (const text of lines.flat()) await tb.show({ text, position: 'auto', ...opts });
  }

  function resolveEntity(id) {
    const e = world.entity(id);
    if (!e) throw new Error(`no entity "${id && id.id ? id.id : id}" on map ${world.state.map}`);
    return e;
  }

  // Shared by moveNpc and movePlayer.
  async function move(e, target, opts = {}) {
    if (opts.speed) e.stepTicks = opts.speed;
    if (Array.isArray(target) && typeof target[0] === 'number') {
      const path = world.pathFor(e, [target], { ignoreEntities: false }) || world.pathFor(e, [target], { ignoreEntities: true }) || [];
      e.route = pathToDirs([e.x, e.y], path);
      e.routeGoal = target;
    } else {
      const dirs = typeof target === 'string' ? target.trim().split(/[\s,]+/) : target;
      e.route = dirs.map((d) => ({ u: 'up', d: 'down', l: 'left', r: 'right' })[d] || d);
      e.routeGoal = null;
    }
    e.routeGhost = !!opts.ghost;
    e.routeBlocked = 0;
    await world.until(() => !e.moving && (!e.route || !e.route.length));
    e.route = null;
    e.routeGhost = false;
    if (opts.face) face(e, opts.face);
  }

  function face(e, dir) {
    if (DIR_VEC[dir]) e.facing = dir;
    else {
      const o = resolveEntity(dir);
      e.facing = dirBetween(e.x, e.y, o.x, o.y) || e.facing;
    }
  }

  const g = {
    // ---- Text ----
    // say('Old Man', 'line', 'next line', ...). Speaker may be an entity or id.
    say(speaker, ...lines) {
      return showLines(lines, { speaker: speakerName(speaker), style: 'npc' });
    },
    // Cheryl's descriptions of things, in her voice.
    describe(...lines) {
      return showLines(lines, { style: 'cheryl' });
    },
    // Cheryl's internal monologue.
    think(...lines) {
      return showLines(lines, { style: 'thought' });
    },
    // choose(['Yes', 'No']) or choose('Prompt?', ['Yes', 'No'], { speaker, cancel })
    // Resolves to the chosen index. `cancel` is the index X/Escape picks.
    choose(a, b, c) {
      let prompt = null;
      let options = a;
      let opts = b || {};
      if (typeof a === 'string') {
        prompt = a;
        options = b;
        opts = c || {};
      }
      return tb.choose({
        options, prompt, position: 'auto',
        speaker: speakerName(opts.speaker), style: opts.style || (opts.speaker ? 'npc' : 'cheryl'),
        cancelIndex: opts.cancel ?? options.length - 1,
      });
    },

    // ---- Items ----
    async giveItem(id, { silent = false } = {}) {
      if (!world.state.inventory.includes(id)) world.state.inventory.push(id);
      if (silent) return;
      const def = world.content.items[id] || { name: id };
      sfx('item');
      await tb.show({ text: `Got ${def.name}.`, style: 'npc', position: 'auto' });
    },
    takeItem(id) {
      const i = world.state.inventory.indexOf(id);
      if (i >= 0) world.state.inventory.splice(i, 1);
      return i >= 0;
    },
    hasItem(id) {
      return world.state.inventory.includes(id);
    },
    get items() {
      return [...world.state.inventory];
    },

    // ---- Flags ----
    setFlag(name, value = true) {
      if (value === false || value == null) delete world.state.flags[name];
      else world.state.flags[name] = value;
    },
    flag(name) {
      return world.state.flags[name];
    },
    get flags() {
      return world.state.flags;
    },

    // ---- Characters and objects ----
    npc(id) {
      return resolveEntity(id);
    },
    get player() {
      return world.player;
    },
    moveNpc(id, target, opts) {
      return move(resolveEntity(id), target, opts);
    },
    movePlayer(target, opts) {
      return move(world.player, target, opts);
    },
    faceNpc(id, dir) {
      face(resolveEntity(id), dir);
    },
    facePlayer(dir) {
      face(world.player, dir);
    },
    // Place an entity instantly.
    place(id, x, y, facing) {
      const e = resolveEntity(id);
      e.x = e.fromX = x;
      e.y = e.fromY = y;
      e.moving = false;
      if (facing) e.facing = facing;
      if (e.isPlayer) world.snapCamera();
    },
    show(id) {
      resolveEntity(id).visible = true;
    },
    hide(id) {
      resolveEntity(id).visible = false;
    },
    // Remove an entity until the map reloads. For permanent removal, give the
    // entity a `when` that checks a flag.
    remove(id) {
      const e = resolveEntity(id);
      world.removed.add(e.id);
      world.removeEntity(e);
    },
    setSprite(id, sprite) {
      resolveEntity(id).setSprite(sprite);
    },

    // ---- Time and screen ----
    wait(seconds) {
      return world.waitTicks(secs(seconds));
    },
    fade(to = 'out', seconds = 0.4, color) {
      return fx.fade(to, seconds, color);
    },
    shake(amount = 3, seconds = 0.4) {
      return fx.shake(amount, seconds);
    },
    // Color wash. mode: 'source-over' (default), 'multiply', 'screen',
    // 'color', 'hue', 'saturation', 'difference'. Amount 0 removes it.
    tint(color, amount = 0.5, seconds = 0.5, mode) {
      return fx.tint(color, amount, seconds, mode);
    },
    // Rotate every color's hue (degrees); 0 restores.
    hueShift(degrees, seconds = 0.5) {
      return fx.hueShift(degrees, seconds);
    },
    // Scanline wobble. Amplitude in pixels; 0 removes it.
    distort(amplitude = 2, seconds = 0.5, opts) {
      return fx.wave(amplitude, seconds, opts);
    },
    // Rapid inverted flashes for `seconds`.
    flicker(seconds = 0.5, opts) {
      return fx.flicker(seconds, opts);
    },
    clearEffects(seconds = 0.3) {
      return fx.clear(seconds);
    },
    // Glide the camera to center on tile x,y (pixels per tick `speed`), or
    // back to the player with followPlayer().
    async panCamera(x, y, speed = 2) {
      world.camPan = { x: x * TILE + TILE / 2, y: y * TILE + TILE / 2, speed };
      const want = world.clampCamera(world.camPan.x, world.camPan.y);
      await world.until(() => world.cam.x === want.x && world.cam.y === want.y);
    },
    async followPlayer(speed = 3) {
      const p = world.player;
      const t = { x: p.px + TILE / 2, y: p.py + TILE / 2 - 8 };
      world.camPan = { ...t, speed };
      const want = world.clampCamera(t.x, t.y);
      await world.until(() => world.cam.x === want.x && world.cam.y === want.y);
      world.camPan = null;
    },

    // ---- Maps ----
    changeMap(mapId, x, y, facing, opts) {
      return world.transition(mapId, x, y, facing, opts);
    },
    get map() {
      return world.state.map;
    },

    // ---- Audio ----
    playMusic(id) {
      playMusic(id);
    },
    stopMusic() {
      stopMusic();
    },
    sfx(id) {
      sfx(id);
    },

    // ---- Misc ----
    save() {
      world.save();
    },
    random(min, max) {
      return world.game.rng.int(min, max);
    },
    // Art helper for content that wants to draw an icon in text, etc.
    sheet(sheet, variant) {
      return loadSheet(sheet, variant);
    },
  };
  return g;
}
