// The script API handed to content scripts as `g`:
//
//   interact: async (g, self) => { await g.say('Old Man', 'Hello.'); }
//
// Every function that takes time returns a promise; await it. See
// src/engine/README.md for the full reference.

import { DIR_VEC, dirBetween } from './entity.js';
import { pathToDirs } from './world.js';
import { playMusic, stopMusic, sfx, playCue, windDownMusic, startLoop, stopLoop, setWrongness, muffleMusic, bendMusic, setLoopVolume } from './sound.js';
import { loadSheet } from './art.js';
import { TILE } from './tilemap.js';
import { WIDTH, HEIGHT } from './display.js';
import { drawTextCentered, LINE_HEIGHT } from './text.js';

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
    // A base like 'jog' follows facing (jog_<dir>); { offset: [dx, dy] }
    // shifts the drawing while posed.
    pose(id, anim, { offset } = {}) {
      resolveEntity(id).setPose(anim, offset);
    },
    // How many times the player has looked at / talked to this entity before
    // (0 the first time). Also passed to `interact` as its third argument.
    looks(id) {
      return world.looks(resolveEntity(id));
    },
    // Move an entity's drawing offset to [dx, dy] over `seconds` (a piano
    // shooting through an arch, Cheryl lowering into a hole). With
    // clipBelow: true, the part below its footprint is hidden.
    tween(id, { offset = [0, 0], seconds = 0.5, clipBelow } = {}) {
      const e = resolveEntity(id);
      if (clipBelow !== undefined) e.clipBelow = clipBelow;
      const [x0, y0] = e.offset;
      const ticks = Math.max(1, secs(seconds));
      let t = 0;
      return world.until(() => {
        t++;
        const k = Math.min(1, t / ticks);
        e.offset = [Math.round(x0 + (offset[0] - x0) * k), Math.round(y0 + (offset[1] - y0) * k)];
        return k >= 1;
      });
    },
    // Step a flag through a list of values (a mirror with three positions, a
    // valve): sets it to the value after its current one and returns it.
    cycle(flagName, values) {
      const i = values.indexOf(world.state.flags[flagName]);
      const next = values[(i + 1) % values.length];
      g.setFlag(flagName, next);
      return next;
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
    // A slow, held screen offset (not a jitter): eases to (dx, dy) pixels
    // over `seconds` and stays until tilt(0, 0, seconds) eases it back.
    tilt(dx, dy, seconds = 1) {
      return fx.tilt(dx, dy, seconds);
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
    // Resolves on the next key (Z/X and friends) or tap: for a full-screen
    // picture the player dismisses (the Ship Plan).
    waitForInput() {
      return new Promise((resolve) => {
        world.inputWaiters = world.inputWaiters || [];
        world.inputWaiters.push(resolve);
      });
    },
    // Centered text over a black screen for `seconds` (e.g. "Cheryl did not
    // sleep well."). Draws above fades, so fade out first if you like.
    // Credits: lines of centered text rolling up over a full-screen picture
    // (or black), at `speed` px per second. The last line stops at the
    // middle of the screen and holds for `hold` seconds. After `skipAfter`
    // seconds any key or tap jumps to the held last line. A line is a string
    // ('' for a gap) or { text, heading: true } for a gold heading.
    async credits(lines, { picture = null, speed = 14, skipAfter = 3, hold = 4, fade = 1 } = {}) {
      const items = lines.map((l) => (typeof l === 'string' ? { text: l } : l));
      const gap = LINE_HEIGHT + 2;
      const last = items.length - 1;
      const restY = Math.round(HEIGHT / 2 - LINE_HEIGHT / 2);
      // Scroll distance at which every line but the last has left the top.
      const endScroll = Math.max(HEIGHT + 8 + last * gap - restY, HEIGHT + 8 + (last - 1) * gap + gap);
      let scroll = 0;
      let skipped = false;
      const art = picture && !(typeof picture === 'function') ? loadSheet(picture.sheet, picture.palette) : null;
      const draw = (ctx, ms) => {
        if (typeof picture === 'function') picture(ctx, ms);
        else if (art) ctx.drawImage(art.frameAt(picture.frame, ms), 0, 0);
        else {
          ctx.fillStyle = '#000000';
          ctx.fillRect(0, 0, WIDTH, HEIGHT);
        }
        scroll = skipped ? endScroll : Math.min(endScroll, (ms / 1000) * speed);
        items.forEach((it, i) => {
          let y = HEIGHT + 8 + i * gap - scroll;
          if (i === last) y = Math.max(restY, y);
          if (y < -gap || y > HEIGHT) return;
          drawTextCentered(ctx, it.text, WIDTH / 2, Math.round(y), { color: it.heading ? 'ui_label' : 'ui_text' });
        });
      };
      await g.showPicture(draw, { fade });
      const t0 = world.picture.ms;
      // Wait for the roll to finish, or a key or tap after skipAfter seconds.
      let pressed = false;
      const listen = () => g.waitForInput().then(() => { pressed = true; });
      listen();
      await world.until(() => {
        const ms = world.picture.ms - t0;
        if (pressed) {
          if (ms / 1000 >= skipAfter) skipped = true;
          pressed = false;
          listen();
        }
        return skipped || scroll >= endScroll;
      });
      await g.wait(hold);
      world.inputWaiters = [];
    },
    // Mark the game finished: sets the flag 'game.complete' (saved when the
    // script ends, or by toTitle). Put Cheryl where the epilogue should reopen
    // first; Continue returns her there with the flag set.
    markComplete() {
      g.setFlag('game.complete');
      world.state.complete = true;
    },
    async card(text, seconds = 2.5) {
      world.game.card = { text };
      await world.waitTicks(secs(seconds));
      world.game.card = null;
    },
    // One line of speech at the top of the screen that doesn't stop anything
    // (a chant, a voice from a window). Replaces any bark already showing.
    bark(speaker, text, opts) {
      world.ambient.bark(speakerName(speaker), text, opts);
    },
    // An icon over a character's head: 'note', 'exclaim', 'question', or a
    // frame from { sheet } in opts. { seconds } defaults to 1.2.
    emote(id, frame = 'note', opts) {
      world.ambient.emote(resolveEntity(id), frame, opts);
    },
    // A short-lived sprite: { sprite: { sheet, frame }, path: [[x, y], ...]
    // (tiles) or at: [x, y], speed (px/tick), seconds, offset, layer }.
    // Resolves when it's gone; don't await it if the scene shouldn't wait.
    spawnEffect(opts) {
      return world.ambient.spawnEffect(opts);
    },
    // Swap one item for another (hat for guidebook). Shows "Got X." unless silent.
    async trade(takeId, giveId, opts) {
      g.takeItem(takeId);
      await g.giveItem(giveId, opts);
    },
    // Several speakers in one conversation: g.talk([['Mover 1', 'Lift!'], ['Mover 2', 'I am lifting!']]).
    // A line without a speaker ([null, '...'] or a plain string) is Cheryl's description.
    async talk(lines) {
      for (const l of lines) {
        if (typeof l === 'string') await g.describe(l);
        else if (l[0] == null) await g.describe(...l.slice(1));
        else await g.say(l[0], ...l.slice(1));
      }
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
    // Keep the camera on another character as they move (and across a
    // cutscene changeMap); `speed` glides there first (px per frame), 0 snaps.
    // followPlayer() returns it to Cheryl.
    cameraFollow(id, speed = 0) {
      world.camFollow = resolveEntity(id).id;
      world.camFollowSpeed = speed;
    },
    // After changeMap(..., { cutscene: true }): back to Cheryl's own map and
    // spot, visible again. { fade: false } cuts.
    restorePlayer(opts) {
      return world.restorePlayer(opts);
    },
    async followPlayer(speed = 3) {
      world.camFollow = null;
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
    // g.sfx(id) plays at full volume. g.sfx(id, { at: [x, y] or an entity id,
    // range: 12 }) fades with Cheryl's distance (in tiles) from the source,
    // silent beyond `range`: the chess tap is clear beside the table and
    // gone on the roof. `volume` scales it further.
    sfx(id, opts = {}) {
      let volume = opts.volume ?? 1;
      if (opts.at != null) {
        let x;
        let y;
        if (Array.isArray(opts.at)) [x, y] = opts.at;
        else {
          const e = world.entity(opts.at);
          if (!e) return;
          [x, y] = [e.x, e.y];
        }
        const p = world.player;
        const d = Math.hypot(p.x - x, p.y - y);
        const range = opts.range ?? 12;
        volume *= Math.max(0, 1 - d / range) ** 1.5;
        if (volume < 0.03) return;
      }
      sfx(id, { volume, pitch: opts.pitch });
    },
    // A one-shot music cue over the current track (which dips and returns,
    // unless { resume: false }).
    playCue(id, opts) {
      playCue(id, opts);
    },
    windDownMusic(ms) {
      windDownMusic(ms);
    },
    muffleMusic(on, opts) {
      muffleMusic(on, opts);
    },
    bendMusic(cents, ms) {
      bendMusic(cents, ms);
    },
    setLoopVolume(id, v, fadeMs) {
      setLoopVolume(id, v, fadeMs);
    },
    startLoop(id, opts) {
      startLoop(id, opts);
    },
    stopLoop(id, fadeMs) {
      stopLoop(id, fadeMs);
    },
    setWrongness(amount) {
      setWrongness(amount);
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
