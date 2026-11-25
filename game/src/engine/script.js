// The script API handed to content scripts as `g`:
//
//   interact: async (g, self) => { await g.say('Old Man', 'Hello.'); }
//
// Every function that takes time returns a promise; await it. See
// src/engine/README.md for the full reference.

import { DIR_VEC, dirBetween } from './entity.js';
import { pathToDirs } from './world.js';
import { playMusic, stopMusic, sfx, playCue, setWrongness } from './sound.js';
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

  // Lines may end with an options object: { auto: seconds }.
  async function showLines(lines, opts) {
    let extra = {};
    const last = lines[lines.length - 1];
    if (last && typeof last === 'object' && !Array.isArray(last)) {
      extra = last;
      lines = lines.slice(0, -1);
    }
    for (const text of lines.flat()) await tb.show({ text, position: 'auto', ...opts, ...extra });
  }

  const warnedItems = new Set();
  function checkItem(id) {
    if (world.content.items?.[id] || warnedItems.has(id)) return;
    warnedItems.add(id);
    console.warn(`[script] "${id}" isn't in content.items (a typo?)`);
  }

  function resolveEntity(id) {
    const e = world.entity(id);
    if (!e) throw new Error(`no entity "${id && id.id ? id.id : id}" on map ${world.state.map}`);
    return e;
  }

  // Shared by moveNpc and movePlayer.
  async function move(e, target, opts = {}) {
    const speedBefore = e.stepTicks;
    if (opts.speed) e.stepTicks = opts.speed;
    if (Array.isArray(target) && typeof target[0] === 'number') {
      let path = world.pathFor(e, [target], { ignoreEntities: false }) || world.pathFor(e, [target], { ignoreEntities: true });
      if (!path) {
        console.warn(`[script] ${e.id} can't reach (${target}) on ${world.state.map}; not moving`);
        path = [];
      }
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
    e.stepTicks = speedBefore;
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
        cancelIndex: 'cancel' in opts ? opts.cancel : options.length - 1,
      });
    },

    // ---- Items ----
    async giveItem(id, { silent = false } = {}) {
      checkItem(id);
      if (!world.state.inventory.includes(id)) world.state.inventory.push(id);
      world.refreshEntities();
      if (silent) return;
      const def = world.content.items[id] || { name: id };
      sfx('item');
      await tb.show({ text: `Got ${def.name}.`, style: 'npc', position: 'auto' });
    },
    takeItem(id) {
      checkItem(id);
      const i = world.state.inventory.indexOf(id);
      if (i >= 0) world.state.inventory.splice(i, 1);
      world.refreshEntities();
      return i >= 0;
    },
    hasItem(id) {
      checkItem(id);
      return world.state.inventory.includes(id);
    },
    get items() {
      return [...world.state.inventory];
    },

    // ---- Flags ----
    setFlag(name, value = true) {
      if (value === false || value == null) delete world.state.flags[name];
      else world.state.flags[name] = value;
      // Entities, sprites, and tile patches follow the new state at once.
      world.refreshEntities();
    },
    // Re-check entities' `when`s, sprite functions, and the map's patches now
    // (setFlag, giveItem, and takeItem already do this).
    refresh() {
      world.refreshEntities();
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
    // Play a named animation on an entity instead of its idle/walk frames
    // (e.g. 'sit_right'); null returns to normal.
    pose(id, anim) {
      resolveEntity(id).setPose(anim);
    },
    // How many times the player has looked at / talked to this entity before
    // (0 the first time). Also passed to `interact` as its third argument.
    looks(id) {
      return world.looks(resolveEntity(id));
    },
    // Change a tile until the map reloads. For changes that should last, use
    // the map's `patches`. `value` is a legend value (tile name or
    // 'sheet:frame'), or null to clear.
    setTile(layer, x, y, value) {
      world.map.setTile(layer, x, y, value);
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
    // Scene lighting: 'day', 'dusk', 'night', or a preset from
    // content.lighting; null for none. Lasts until the next map load, which
    // applies that map's own `lighting`.
    setLighting(name, seconds = 0) {
      return world.setLighting(name, seconds);
    },
    get lighting() {
      return world.lighting;
    },
    // Show a full-screen 256×224 picture instead of the map: either
    // { sheet, frame, palette } or a function (ctx, ms) that draws it (ms
    // since it appeared). Text boxes still work over it. `fade` in seconds
    // (0 = hard cut).
    async showPicture(spec, { fade = 0.5 } = {}) {
      if (fade) await fx.fade('out', fade / 2);
      world.picture = { spec, ms: 0 };
      if (fade) await fx.fade('in', fade / 2);
    },
    async hidePicture({ fade = 0.5 } = {}) {
      if (fade) await fx.fade('out', fade / 2);
      world.picture = null;
      if (fade) await fx.fade('in', fade / 2);
    },
    // Centered text over a black screen for `seconds` (e.g. "Cheryl did not
    // sleep well."). Draws above fades, so fade out first if you like.
    async card(text, seconds = 2.5) {
      world.game.card = { text };
      await world.waitTicks(secs(seconds));
      world.game.card = null;
    },
    // A small hint at the bottom of the screen for `seconds` (time spent in
    // dialog or the bag doesn't count). Doesn't block the player or the
    // script. { untilBag: true } keeps it up until the player opens the bag
    // (use seconds = Infinity for no time limit).
    hint(text, seconds = 6, { untilBag = false } = {}) {
      world.hintState = { text, t: 0, ticks: seconds === Infinity ? Infinity : secs(seconds), untilBag };
    },
    // True when the player is using touch (choose hint wording with this).
    get usingTouch() {
      return world.game.input.usingTouch();
    },
    // Back to the title screen (the game is saved first).
    async toTitle() {
      world.save();
      await world.game.backToTitle();
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
    stopMusic(fadeMs) {
      stopMusic(fadeMs);
    },
    // A one-shot music cue over the current track (which dips and returns,
    // unless { resume: false }).
    playCue(id, opts) {
      playCue(id, opts);
    },
    // How far the Wrongness has crept into the music, 0..1.
    setWrongness(amount) {
      setWrongness(amount);
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
