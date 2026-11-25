# Moonshine engine

How to build the game on this engine: maps, tilesets, characters, items, and scripts. The engine test content in `src/content/test/index.js` uses every feature described here; copy from it.

Run the game with `npm run serve` (or `python3 -m http.server -d game`) and open http://localhost:8123/. Add `?map=test_street` to jump straight in.

## Contents

- [How it fits together](#how-it-fits-together)
- [Maps](#maps)
- [Tilesets](#tilesets)
- [Characters and objects (entities)](#characters-and-objects-entities)
- [Items](#items)
- [Scripts](#scripts)
- [Script API](#script-api)
- [Audio boundary](#audio-boundary)
- [Debug parameters](#debug-parameters)
- [Tests and screenshots](#tests-and-screenshots)
- [Engine decisions](#engine-decisions)
- [Module map](#module-map)

## How it fits together

`src/main.js` passes `src/content/index.js` to `startGame()`. The content object:

```js
export default {
  title: 'Moonshine',
  start: { map: 'cistern_court', x: 3, y: 6, facing: 'up' }, // new game location
  player: { name: 'Cheryl', sprite: { sheet: cheryl } },      // src/art/cheryl.js
  maps: { cistern_court: courtMap, ... },                    // by id
  items: { brass_key: { ... }, ... },                        // by id
  scripts: { intro: async (g) => { ... } },                  // runnable with ?run=intro
  onNewGame: async (g) => { ... },                           // optional, once per new game
  lighting: { dusk: [ ... ] },                               // optional: add or replace lighting presets
  defaults: {
    useFail: async (g, target, itemId) => g.describe("That won't help."), // item has no effect
    nothingToUseOn: "There's nothing there to use it on.",                 // keyboard use facing nothing
  },
};
```

Game state is `{ flags, inventory, looks, map, x, y, facing }` (`looks` counts how often each thing has been looked at). It saves to `localStorage` whenever a script finishes (walking through a door is a script), never in the middle of one, so a reload can't land halfway through a cutscene. The title screen offers Continue when a save exists.

**Old saves.** `main` deploys on every push, so players will load saves from older builds. On load the engine fills in missing fields, drops unknown item ids, falls back to `content.start` if the saved map no longer exists, and moves the player to the map's `spawn` (or the nearest open tile) if they'd stand inside something solid or off the map. For renamed flags or items, give the content a `migrate: (state) => state` function; it runs first. Characters' positions after `moveNpc` aren't saved: they reset to the map's layout when it reloads, so put lasting moves in the entity's `x`/`y` behind a `when`, or `g.place` them in `onEnter`.

## Maps

A map is a JS object; put each in its own module under `src/content/maps/`.

```js
export default {
  id: 'harbor_steps',
  tileset: townTiles,            // see Tilesets
  music: 'harbor',               // played on entry; null stops music; omit to leave it alone
  lighting: 'dusk',              // 'day', 'dusk', 'night', or (g) => one of them; see Lighting
  background: 'sea_dark',        // palette color shown outside small maps (default black)
  spawn: [5, 6],                 // default position for ?map= debug starts
  legend: {
    '.': 'pave',                              // a tile named in the tileset
    '#': { tile: 'buildings:wall@ochre', solid: true }, // an art reference plus properties
    '^': 'cloth:over_awning_m',               // an art reference: 'sheet:frame' or 'sheet:frame@palette'
  },                                          // ' ' is always empty
  ground:   [ '....', ... ],     // one character per 16×16 tile; opaque
  detail:   [ ' #  ', ... ],     // optional: transparent tiles on the ground, under characters (`objects` works too)
  overhead: [ ' ^  ', ... ],     // optional: drawn over characters (over_* frames)
  collision: [ '  # ', ... ],    // optional override: '#' solid, 'o' open, anything else = from tiles
  patches: (g) => [ ... ],       // optional: tile changes that follow the story (see below)
  exits: [ ... ],
  triggers: [ ... ],
  entities: [ ... ],
  onEnter: async (g) => { ... }, // runs after the fade-in each time the map loads
};
```

All layers are the same size as `ground`. The legend is shared by all layers, so give each tile its own character. A tile is solid if its ground or detail tile is solid (overhead tiles never block).

**Layering rule (3/4 view).** Ground, then detail, then characters sorted by their feet, then overhead (frames named `over_*`; the engine warns if one lands on another layer). Use the overhead layer only for things that are always above anyone walking there: roof eaves, arch tops, awnings, canopies, lamp tops. A lamp post is a detail tile with its top on the overhead layer. Anything a character can stand both in front of and behind (statues, people) should be an entity with a sprite, so it sorts by y.

**Patches** change tiles as the story moves on: a taken pepper mill leaves a bare counter, the piano's tiles clear from the Squeeze. `patches(g)` returns `[layer, x, y, value]` entries for the current state (`value` as in the legend, or `null` to clear), or `[layer, x, y, value, w, h]` to fill a rectangle; the engine re-applies them on map load, after every script, and on `setFlag`, restoring tiles whose patch no longer applies. `g.setTile(...)` makes a one-off change that lasts until the map reloads.

**Variants** replace whole layers for big changes (the canals drained, the fountain dry, the Teeth in three stages): `variants: [{ when, ground, detail, overhead, collision, legend }]`. The first variant whose `when` holds is used; layers it leaves out come from the base map, and its `legend` adds to the base legend. Patches apply on top. The map re-checks its variant whenever patches are re-applied, so a scene can drain a canal mid-script with `g.setFlag`.

**Darkness** (the Lamp Halls): `darkness: 0.9` (or `dark`; a number or a function of the state) covers the map in near-black (`darkColor`, default `void`) with holes around lights. Light sources: the map's `lights: [{ x, y, radius, color, when }]` (tiles; or a function returning such a list; `when` lets a flag relight a lamp), entities with `light: radius` or `light: { radius, color }`, and `playerLight` on the map or the content (a radius, `{ radius, color }`, or a function, e.g. `(g) => g.hasItem('moonglass_disc') && { radius: 3, color: 'relic_cyan' }`). Each light cuts a pool that fades out in three bands; a `color` tints the pool.

**Ambient events** happen on a timer without stopping the player: `ambient: [{ every: [18, 24], when, run: (g) => ... }]` (seconds, a random interval in the range). `run` is a plain callback, not a script, so use non-blocking calls there: `g.bark`, `g.emote`, `g.spawnEffect`, `g.sfx`, `g.setTile`. Timers pause while a script runs.

**Audio per map:** `ambience: ['crowd', 'wind']` starts those looping sounds when the map loads and fades out the previous map's (ids from the audio module's loops). `musicFilter: 'muffled'` and `step: 'step_stone'` (footstep sound; a tile's own `step` property wins) pass to the audio module if it supports them, and are quietly ignored until then. Scripts can also `g.startLoop(id)` / `g.stopLoop(id, fadeMs)`.

**Exits** fire when the player finishes a step onto them by walking. An exit whose `when` fails but has `blocked: 'line'` (a line, a list of lines, or an async function) explains itself in Cheryl's voice and steps her back. `confirm: 'Go down?'` asks first (options `choices`, default Yes / Not yet; anything but the first steps her back). Exits don't fire during a script: `movePlayer` onto a door does nothing, so call `changeMap` yourself. Click-to-walk paths never cross an exit on the way to somewhere else, and an exit is never chosen as "the nearest reachable tile" for an unreachable click.

```js
exits: [
  { x: 5, y: 4, to: 'shop', at: [4, 8], facing: 'up' },             // a door
  { x: 15, y: 17, w: 3, to: 'lane', at: [8, 1], facing: 'down' },   // an edge, 3 tiles wide
  { x: 2, y: 0, to: 'roof', at: [1, 1], when: (g) => g.flag('ladder_down') }, // conditional
  { x: 9, y: 9, run: async (g) => { await g.describe('Locked.'); } },         // custom script
]
```

A multi-tile exit keeps the player's offset: stepping onto the middle of a 3-wide edge arrives in the middle of the destination. `sfx` overrides the default `'door'` sound.

**Triggers** run a script when the player steps onto any tile in their area: `{ x, y, w, h, when, run, stop }`. Like exits, they don't fire during scripts. Guard one-shot triggers with a flag in `when`. `stop: false` lets the player keep walking afterwards; by default they stop.

## Tilesets

A tileset lists the sheets a map may reference and names any tiles that need more than a reference:

```js
import { street } from '../art/street.js';
import { buildings } from '../art/buildings.js';
import { canal } from '../art/canal.js';
export const townTiles = {
  sheets: { street, buildings, canal },   // legend references like 'buildings:wall@ochre' use these
  tiles: {
    // Paving is a 2×2 macro-tile: the frame is picked by the tile's position.
    pave: { sheet: street, pattern: [['pave_nw', 'pave_ne'], ['pave_sw', 'pave_se']] },
    water: { sheet: canal, solid: true },                     // animates water_0, water_1, ...
    counter: { sheet: shopSheet, solid: true, counter: true },
    wall_rose: { sheet: buildings, frame: 'wall', palette: 'rose' },
  },
};
```

- `solid`: blocks walking. `counter`: the player can talk across it (to someone one tile beyond).
- Animations: if the frame has numbered frames `name_0`, `name_1`, … they cycle using the sheet's `durations` (200 ms each by default; `ms` on the tile overrides).
- `palette`: a swap name from the sheet's `palettes` (laid over the base palette), or an object of overrides.
- `pattern`: rows of frame names picked by `x % width`, `y % height`.

Sheets follow the art module format in `docs/decisions.md` and the conventions in `docs/art-direction.md`.

## Characters and objects (entities)

Everything you can talk to, look at, or bump into that isn't a plain tile is an entity in the map's `entities` list:

```js
{
  id: 'old_man',                      // unique on this map
  name: 'Old Man',                    // speaker label
  x: 8, y: 7,                         // tile of the top-left of its footprint
  w: 1, h: 1,                         // footprint in tiles (default 1×1)
  facing: 'down',
  sprite: { sheet: peopleSheet, palette: 'old_man' },  // a character: directional frames
  behavior: 'face',                   // see below
  solid: true,                        // default true
  when: (g) => !g.flag('old_man_left'), // present only while this is true
  interact: async (g, self, looks) => { ... }, // look / talk; `looks` = times looked before
  use: {                              // using items on it
    brass_key: async (g, self) => { ... },
    '*': async (g, self, itemId) => { ... }, // any other item
  },
}
```

Shortcuts instead of `interact`:
- `talks: [first, second, ..., then]`: what it says each time (each entry a line or a list of lines); `talksRepeat: 'cycle'` cycles through the entries after the first instead of repeating the last.
- `talk: ['line', 'line']`: the entity says them.
- `look: 'text'` or `look: ['box', 'box']`: Cheryl describes it, the same every time.
- `looks: [first, second, …, then]`: a different description each time it's looked at; the last repeats (`looksRepeat: 'cycle'` cycles). Each entry is a line or a list of lines (boxes).
- `decline: 'line'`: the catch-all for items with no handler (said by a character, described for an object); see Items for the full order.
- `bark: { lines, range: 3, every: [4, 8], once, speaker }`: says lines at the top of the screen, without stopping anything, while Cheryl is within `range` (chanting girls, a busker).
- `emote: { frame: 'note', every: [3, 6], seconds }`: an icon over its head now and then (`note`, `exclaim`, `question`, or a frame from `sheet`).
- `light: radius`: lights up darkness around it (see Maps).

**Look counters.** Every interaction (not item use) bumps a counter saved in the game state, keyed by map and entity id. `interact` gets the count before this look as its third argument, and `g.looks(id)` reads it. Entities with the same `lookKey` share a counter (all the windows on a facade). Hotspots for wall features or groups of tiles are entities with no sprite: give them a footprint (`w`, `h`) over the tiles and `look`/`looks`.

**Sprites.**
- *Character sheets* (no `frame`), named as in `docs/decisions.md` and `src/art/cheryl.js`: `<dir>_0` stands, `<dir>_1`, `<dir>_2` are the steps (the walk plays 1, 0, 2, 0), for `down`, `up`, `left`, `right`. Longer cycles give `sprite.walk`, e.g. `[1, 2, 3, 4]` for the Kid's run. An optional `idle_<dir>_<n>` animation (a blink) plays while standing, with the sheet's `durations`. The alternative naming `walk_<dir>_<n>` / `idle_<dir>_<n>` also works. Walk frames advance with distance walked (one frame per 8 px), so feet stay planted at any speed. A missing `left` mirrors `right` (and vice versa). Frames may be up to 16×32, drawn bottom-centered on the footprint.
- *Static sprites*: `sprite: { sheet, frame: 'cat' }`. Numbered frames animate with the sheet's `durations`.
- `sprite` may also be a function `(g) => sprite`, re-checked after every script (a chessboard that changes with the game).
- *Poses*: `g.pose(id, 'jog')` plays `jog_<facing>` (or the mirrored side, or `jog` itself) instead of idle/walk until `g.pose(id, null)`, so a pose follows the character's facing; a full name like `'sit_right'` plays as is. `g.pose(id, 'sit_right', { offset: [0, -4] })` shifts the drawing while posed, and `poseOffsets: { sit_right: [0, -4] }` on the entity sets defaults. `talkPose: 'jog'` plays while the entity is being talked to, and a patrol's `nearPose` / `blockedPose` work the same way.
- `offset: [dx, dy]` nudges the drawing; `layer: 'ground'` draws it under everything that sorts (things lying on the floor).

**Behaviors.**
- `'idle'` (default): stands still; after a conversation turns back to its original facing.
- `'face'` (or `{ type: 'face', range: 3 }`): turns to watch the player when within range.
- `{ type: 'wander', area: [x, y, w, h], pause: [1, 3] }`: takes random steps inside the area, pausing 1–3 s. Never steps onto exits.
- `{ type: 'patrol', route: [[7, 14], [13, 14], [13, 19], [7, 19]], pause, ghost, blockedPose, stopNear, nearPose, onWaypoint }`: walks the waypoints in a loop. With `ghost: true` tiles don't block it (it hops the hurdle) but characters do; when someone is in the way it waits, playing `blockedPose` if given. With `stopNear: 2` it stops and faces Cheryl while she's within 2 tiles, or while she's walking over to it after a click or tap, playing `nearPose` (or `blockedPose`), then resumes its route. `onWaypoint(g, self, index)` is called at each waypoint (a ding every third lap); it's a plain callback, not a script, so it shouldn't await anything.
- Scripted moves: `g.moveNpc(...)` at any time.

Characters turn to face the player when talked to (`turnToTalk: false` to prevent it), and wandering and patrols pause while any script runs.

**Characters who move between maps.** Define a person once in `content.characters`, with `at: (g) => ({ map, x, y, facing, behavior })` (or `null` when they're nowhere): the Kid in Cistern Court during Act 1 and at the Steps in Act 2. The engine places them on whichever map is loaded and moves them when `at` changes (after a script or a `setFlag`). Everything else on a character is the same as a map entity. A map entity with the same id wins, if you need a one-off.

**Things that change.** To make something disappear for good (a picked-up item), give it `when: (g) => !g.flag('got_key')` and set the flag. To swap an object's look, use a sprite function, two entities with opposite `when`s, or `g.setSprite(id, sprite)`. Entities are re-checked after every script.

## Items

```js
items: {
  brass_key: {
    name: 'Brass Key',
    icon: { sheet: itemSheet, frame: 'brass_key' },  // 16×16
    description: "Warm from the sun. Somebody's going to want it back.", // Cheryl's voice
  },
}
```

The player opens the inventory with X/Escape or the bag button (top right), picks an item, and chooses **Use**. They are then "holding" it (a banner shows `Use Brass Key on…`). Keyboard: Z uses it on whatever Cheryl faces; X cancels. Pointer: click a character or object to walk over and use it there; click the banner to cancel. The order: the target's `use[itemId]`; else the item's own `useOn.npc` or `useOn.object` (a line, lines, or a function: "Crowbar on any NPC: No. Absolutely not."); else the target's `use['*']`; else its `decline`; else `defaults.useFail`. An entity counts as an NPC if it has a character sprite; `kind: 'npc'` or `'object'` overrides.

**Look** (a button in the bag; keyboard: Down from the last row to the buttons) examines the selected item: `examine: async (g, looks) => ...`, or `looks: [first, ..., then]` (with `looksRepeat`), or else its `description`. Looks are counted in the save like object looks, and the bag reopens afterwards. `g.trade(take, give)` swaps one item for another.

## Scripts

Scripts are async functions that take the script API `g` (and, for entity handlers, `self`). Always `await` calls that take time.

```js
interact: async (g, self) => {
  if (g.flag('met_baker')) return g.say(self, 'Back again?');
  g.setFlag('met_baker');
  await g.say(self, 'You look like someone who appreciates bread.');
  const i = await g.choose('Do you?', ['Deeply', 'Not really'], { speaker: self });
  if (i === 0) await g.giveItem('heel_of_bread');
  else await g.think('I lied to a baker. Is that a crime here?');
},
```

Only one script runs at a time; others queue. While a script runs the player can't move, and NPCs stop wandering. If a script throws, the error is logged and the game carries on; a `when`, sprite, lighting, or patches function that throws is logged and counts as false. The main loop also catches and logs errors, so a content typo can't freeze the game.

`setFlag`, `giveItem`, and `takeItem` re-check entities, sprite functions, and patches immediately, so `g.setFlag('chest_open'); g.npc('chest_open')` works within the same script. `g.refresh()` does the same on demand.

## Script API

Text:

| Call | What it does |
|---|---|
| `say(speaker, ...lines)` | NPC dialog. `speaker` is a label (`'Old Man'`), an entity, an entity id, or `null`. Each argument is its own box; long text pages automatically (3 lines a page). |
| `say(speaker, ...lines, { auto: 1.2 })` | Any of `say`, `describe`, `think` can end with options. `auto`: each box closes by itself that many seconds after it's fully shown, and input can't skip it (for overlapping shouts in a cutscene). |
| `describe(...lines)` | Cheryl's descriptions, in her warm-colored box with no label. |
| `think(...lines)` | Cheryl's internal monologue: warm, italic, dashed frame. |
| `choose(options)` / `choose(prompt, options, { speaker, cancel })` | Shows options; resolves to the chosen index. X/Escape picks `cancel` (default: the last option; `cancel: null` disables it). With no `speaker` the prompt is in Cheryl's style. A long prompt pages like normal text, with the options on its last page. |

Text normalizes `...` to an ellipsis and `--` to an em dash. The font has letters, digits, and common punctuation (`. , ! ? ' " ‘ ’ “ ” - — : ; ( ) / … + = * % & # ♪ < > _ $ ·`).

Items and flags:

| Call | What it does |
|---|---|
| `giveItem(id, { silent })` | Adds to the inventory and shows "Got X." (unless `silent`). Item calls warn in the console about ids missing from `content.items`. |
| `takeItem(id)` | Removes; returns whether it was there. |
| `hasItem(id)`, `items` | Check the inventory. |
| `setFlag(name, value = true)` | `false`/`null` deletes the flag. Values may be numbers or strings. |
| `flag(name)`, `flags` | Read flags. |

Characters and objects (an `id` may be an id string, an entity, or `'player'`):

| Call | What it does |
|---|---|
| `npc(id)`, `player` | The entity (has `x`, `y`, `facing`, `name`, …). |
| `moveNpc(id, target, { speed, ghost, face })` | Walks. `target` is `[x, y]` (pathfinds around things), a list of directions `['up', 'up', 'left']`, or a string `'u u l'`. `speed` is ticks per tile (player 12, NPCs 16), for this move only. `ghost: true` ignores collisions. A blocked scripted walk waits, re-routes, and after two seconds walks through the obstacle for that one step, so cutscenes never hang (move Cheryl out of the way if you don't want an NPC to pass through her). An unreachable `[x, y]` logs a warning and doesn't move. |
| `movePlayer(target, opts)` | Same for Cheryl. |
| `faceNpc(id, dir)`, `facePlayer(dir)` | `dir` is a direction or another entity's id (`'player'`). |
| `place(id, x, y, facing)` | Teleports. |
| `show(id)`, `hide(id)` | Toggle visibility. |
| `remove(id)` | Removes until the map reloads (use `when` + a flag for permanent removal). |
| `setSprite(id, sprite)` | Changes an entity's sprite. |
| `pose(id, anim)` | Plays animation `anim` instead of idle/walk; `null` returns to normal. |
| `looks(id)` | Times the player has looked at it before (0 the first time). |
| `setTile(layer, x, y, value)` | Changes a tile until the map reloads (use `patches` for lasting changes). |

Time, camera, and screen effects (all resolve when done; durations in seconds):

| Call | What it does |
|---|---|
| `wait(seconds)` | Pause. |
| `fade('out' \| 'in' \| alpha, seconds, color)` | Fade to/from a color (default black), in 8 brightness steps. |
| `shake(pixels, seconds)` | Screen shake. |
| `tilt(dx, dy, seconds)` | Eases the whole screen to a steady offset of a pixel or two and holds it (a hull over-tilting), unlike a jittery shake; `tilt(0, 0, seconds)` eases back. Shakes add on top. |
| `tint(color, amount, seconds, mode)` | Color wash over the world. `mode` is a canvas blend: `'source-over'` (default), `'multiply'`, `'screen'`, `'color'`, `'hue'`, `'saturation'`, `'difference'`. Amount 0 removes it. |
| `hueShift(degrees, seconds)` | Rotates every color's hue (palette-shift look), snapped to 15-bit color. 0 restores. |
| `distort(pixels, seconds, { freq, speed })` | Per-scanline wobble. 0 removes it. |
| `flicker(seconds, { color, rate })` | Rapid inverted flashes. |
| `clearEffects(seconds)` | Removes tint, hue shift, distortion, and tilt. |
| `panCamera(x, y, speed)` / `followPlayer(speed)` | Glide the camera to a tile and back to Cheryl. |
| `setLighting(name, seconds)`, `lighting` | Crossfade the scene lighting to `'day'`, `'dusk'`, `'night'`, a preset from `content.lighting`, or `null`; 0 seconds is a hard cut. Lasts until the next map load, which applies that map's own `lighting`. |
| `showPicture(spec, { fade })` / `hidePicture({ fade })` | Replace the map with a full-screen 256×224 picture (a vista): `{ sheet, frame, palette }` or a function `(ctx, ms)` that draws it, `ms` since it appeared. Text boxes, shake, and effects still work over it. `fade` is in seconds; 0 is a hard cut. |
| `waitForInput()` | Resolves on the next key or tap. For a picture the player dismisses: `await g.showPicture(plan, { fade: 0 }); await g.waitForInput(); await g.hidePicture({ fade: 0 });` (the Ship Plan, as an item's `examine`). |
| `card(text, seconds)` | Centered text on black ("Cheryl did not sleep well."), drawn above fades. |
| `bark(speaker, text, { seconds })` | One line of speech at the top of the screen that doesn't stop the player or the script (a chant, a voice from a window). |
| `say(speaker, line, { position: 'top' })` | A normal (blocking) line with its box at the top of the screen: an off-screen voice, the Clockmaker in his belfry. `'bottom'` and `'auto'` (the default) also work. |
| `emote(id, frame, { seconds })` | An icon over a character's head (`'note'`, `'exclaim'`, `'question'`). |
| `spawnEffect({ sprite, path or at, speed, seconds, offset, layer })` | A short-lived sprite moving along tiles (a trickle into a joint, a puff of mist); resolves when it's gone. `layer: 'top'` draws it among the characters instead of on the ground. |
| `tween(id, { offset, seconds, clipBelow })` | Slides an entity's drawing by `offset` pixels; `clipBelow` hides whatever goes below its footprint (lowering into a hole). |
| `cycle(flag, values)` | Steps a flag to the next value in a list and returns it (a mirror's three positions, a valve). Pair it with a sprite function. |
| `talk([[speaker, line], [null, line], ...])` | A conversation with several speakers; `null` (or a plain string) is Cheryl's description. |
| `trade(takeId, giveId)` | Take one item and give another. |
| `refresh()` | Re-check entities, characters, variants, and patches now. |
| `hint(text, seconds = 6, { untilBag })` | A small box at the bottom (wrapped if long) that fades in and out without blocking anything (control hints). It hides, and its clock stops, while dialog or the bag is open. `untilBag: true` removes it when the player opens the bag; pass `Infinity` seconds to keep it until then. |
| `usingTouch` | True when the player is on a touch screen (to word hints). |

Effects persist across map changes until cleared, so a scene can carry its mood through a door.

**Lighting** is separate from effects: a map's `lighting` (a preset name, or a function of the state such as `(g) => g.flag('act1.moonrise') ? 'day' : 'dusk'`) is applied on load, and `setLighting` changes it mid-scene. The presets come from the art task's `src/art/tints.js`; each is a `{ color, mode, amount }` pass (or a list of them) drawn over the world, not the UI. `content.lighting` adds or replaces presets. **Emissive colors** (`EMISSIVE` in `tints.js`: lamp glow, lamp warm, the relic glows; `content.emissive` overrides) skip the lighting wherever they appear in map tiles, so lit window glass and lamp flames stay bright at night while the walls around them dim. Character and object sprites don't glow yet.

Maps, audio, misc:

| Call | What it does |
|---|---|
| `changeMap(id, x, y, facing, { fade, seconds })` | Fades out, loads, fades in, then runs the map's `onEnter`, all before it resolves: `await g.changeMap('b'); await g.say(...)` shows the say after b's intro. |
| `map` | Current map id. |
| `playMusic(id)`, `stopMusic(fadeMs)`, `sfx(id)`, `playCue(id, { resume })`, `windDownMusic(ms)`, `startLoop(id)`, `stopLoop(id, fadeMs)`, `setWrongness(0..1)` | Audio (see below and `src/audio/README.md`). |
| `sfx(id, { at, range, volume })` | A sound placed in the world: `at` is a tile `[x, y]` or an entity id, and the volume falls off with Cheryl's distance, silent beyond `range` tiles (default 12). Use it for map-wide ambient sounds (a chess tap, the Kid's hop). |
| `save()` | Save now (saving also happens automatically). |
| `toTitle()` | Save and return to the title screen (end of a slice). |
| `random(min, max)` | Integer from the game's RNG (seedable with `?seed=`). |

## Audio boundary

The engine calls audio only through `src/engine/sound.js`, a bridge to the audio module (`src/audio/index.js`, documented in `src/audio/README.md`). It exports `unlockAudio()` (first key press or tap), `playMusic(id)`, `stopMusic()`, `playCue(id, { resume })`, `windDownMusic(ms)`, `sfx(id)`, `startLoop(id)`, `stopLoop(id, fadeMs)`, `stopAllLoops()`, and `setWrongness(0..1)`. The bridge maps the engine's generic sound ids (`text`, `text_cheryl`, `select`, `item`) to the audio ids (`cursor` has its own sound) and ignores unknown ids with a one-time console warning, so content can name music or sounds before they exist. Maps play their `music` on entry.

## Debug parameters

Add these to the URL. Giving `map` or `start` skips the title and, unless `save=1`, never writes the save slot (so testing doesn't clobber a real game).

| Parameter | Effect |
|---|---|
| `map=test_shop` | Start a new game on this map (at its `spawn`, or `x`/`y`). |
| `x=4&y=6&facing=up` | Starting position and facing. |
| `flags=met_baker,door_open,coins=3` | Set flags (`true` unless given a value). |
| `items=brass_key,letter` | Start with items. |
| `run=wrongness` | Run `content.scripts.wrongness` once the map loads. |
| `start=new` / `start=continue` | Skip the title screen. |
| `debug=1` | Overlay: solid tiles red, exits cyan, the current path yellow, map and position bottom left. |
| `seed=42` | Fix the random seed (NPC wandering). |
| `save=1` | Allow saving in a debug start. |

Examples:
- `?map=test_street&debug=1`
- `?map=test_shop&x=2&y=5&facing=up&items=letter&run=wrongness` (the shopkeeper's scripted sequence)
- `?map=test_street&x=12&y=7&run=moonrise` (a vista, auto-advancing shouts, a hard cut to night, a card)

`window.moonshine` is the running game; `moonshine.snapshot()` summarizes the state (position, text on screen, flags, items, looks, lighting, entities), which the tests use.

## Tests and screenshots

```
npm install
npx playwright install chromium
npm test                 # desktop and phone smoke tests (own server on port 8131); screenshots in tests/screenshots/
npm run check            # content validator (also part of npm test)
node tests/shot.js "?map=test_street" out.png 800 ArrowRight z   # one screenshot after some keys
```

## Authoring aids

- **`npm run check`** (`node tests/check-content.mjs`) loads the content in Node and reports errors: legend characters without entries, layers of different sizes, tile references to missing sheets, frames, or palettes, exits to unknown maps or arriving on solid tiles, `changeMap` calls to unknown maps or solid tiles, unknown item ids in scripts and `use` handlers, entity ids that aren't on any map, characters placed on solid tiles, unknown lighting. It warns about flags read but never set (typos), flags set but never read, music and sounds that don't exist yet, and `over_*` frames off the overhead layer. Script checks read each function's source, so they see literal ids only.
- **The map viewer** at `/dev/map.html` draws any map whole, with solid tiles, exits (faint when closed), triggers, entity footprints, and spawn points overlaid. Enter flags and items to see a story state (variants, patches, `when`s, sprite functions, and characters' `at` all follow). Hover a tile for its coordinates, tiles, and anything defined there; click to open the game there with those flags and items.

## Engine decisions

- **Walk animation follows distance, not the clock.** Walk frames advance one per 8 px moved, so a 4-frame cycle spans two tiles at any speed and feet never slide. **The sheets' `walk_*` durations are ignored**; at the current speeds a walk frame lasts 100 ms for Cheryl and 133 ms for NPCs. Idles and other animations do use `durations`.
- **Characters are lit at half strength** (`SPRITE_LIGHT`, or `content.spriteLight`): the map takes the full dusk or night tint, characters half, so they stay the most saturated things on screen.
- **Lighting is its own layer**, below screen effects: maps declare dusk/night/day, and scripts crossfade or cut between them, while tints and hue shifts stay free for the Wrongness.
- **Grid-stepped movement with smooth interpolation.** Characters occupy whole 16×16 tiles and glide between them (the player at one tile per 12 frames, 80 px/s; NPCs at one tile per 16 frames, 60 px/s). Cheryl's pace was slowed from 8 frames per tile after playtests read it as a jog; at 4/3 px per frame her motion steps 1, 1, 2 px, a steady rhythm that doesn't read as judder. Reasons: click-to-walk pathfinding, collision, and "walk next to that and face it" are exact on a grid, so the player never snags on corners or stops a pixel short; NPCs block whole tiles, so puzzles about who stands where are unambiguous; and it matches the tile-locked feel of many SNES adventures. Holding a direction chains steps with no pause; tapping a direction toward something solid turns Cheryl to face it.
- **Four directions only**, for both keyboard and pathfinding. Among equally short paths, A* leans toward fewer turns (a tie-break, not a guarantee).
- **Characters cast a small oval shadow** (ink at about a third opacity) under their feet; `shadow: false` turns it off for an entity.
- **Boxes** have a 3 px SNES-style frame (shade, light, deep) with notched corners; the thought box dashes its light line 2 px on, 2 off.
- **Clicks on unreachable spots** walk to the nearest reachable tile. Clicks on characters or objects walk to the nearest tile beside them (or across a counter), face them, and interact. Holding the pointer down and dragging steers.
- **Fixed 60 Hz update** with rendering every animation frame; frame times within 1.5 ms of a whole tick count as exactly one tick, so 60 Hz displays get no judder.
- **Display scaling.** The 256×224 frame is scaled by a whole number of *device* pixels when that uses at least 80% of the possible size; otherwise (very small screens) by the exact fit, with nearest-neighbor sampling. On a typical phone in portrait this gives a crisp 4× in device pixels. On tall portrait screens the frame sits near the top, leaving room below for thumbs.
- **Text** is a variable-width bitmap font (`src/art/font.js`, 7 px caps, 9 px cell, 12 px lines), revealed at about 42 characters per second with short pauses after punctuation. Any key or tap reveals the rest; the next press advances. The box sits at the bottom, or the top when Cheryl is in the lower part of the screen. NPC lines have a navy box and a speaker tab; Cheryl's descriptions a warm brown box; her thoughts the warm box in italics with a dashed frame.
- **One script at a time**, queued; the world pauses player control while scripts run. Autosave after each script and map change.

- **Text boxes unfold** over 4 frames when they open, like SNES windows, but not between back-to-back boxes in a conversation. A key or tap during the unfold isn't lost; it reveals the text as soon as the box is open.
- **Feel targets** (checked against SNES-era adventures): walking 80 px/s; text about 42 characters a second with punctuation pauses; door fades a quarter second each way in 8 brightness steps; click-to-walk starts on the next frame, and a new click mid-walk re-routes from the tile being entered.
- **Browsers.** The suite runs in Chromium and WebKit, plus Pixel 7 and iPhone 13 touch profiles (`npx playwright test --project=webkit`, `--project=iphone`). Audio unlocking is retried on every key and pointer gesture (down and up) until it succeeds, since iOS Safari only honors some gestures. Known limit: on iPhones with the ringer switch on silent, Web Audio is muted by the system.
- **Performance.** `tests/perf.spec.js` walks the 64×48 stress map (`?map=test_big`, 40 wandering people, night lighting with lamps) and measures our CPU time per frame: about 1 ms in Chromium and 0.3 ms in WebKit; 2-2.5 ms with darkness, a hue shift, and the wobble all on; and 6 ms walking (9 ms with effects) with Chromium's CPU throttled 6× (roughly a low-end phone), against a 16.7 ms budget. `?debug=1` shows live update and draw times.

## Module map

| File | Role |
|---|---|
| `game.js` | Boot, main loop, scenes, test hooks |
| `display.js` | Canvas, scaling, letterbox, coordinates |
| `input.js` | Keyboard and pointer |
| `art.js` | Sheet loader, palette swaps, animations |
| `text.js` | Bitmap font measuring, wrapping, drawing |
| `tilemap.js` | Layers, legend, collision, tile drawing |
| `pathfind.js` | A* and nearest-reachable search |
| `entity.js` | Player/NPC/object movement, animation, hit tests |
| `world.js` | Map loading, entities, script runner, NPC behaviors, camera, drawing |
| `control.js` | Player control: keys, clicks, interaction, held items, exits, HUD |
| `script.js` | The script API |
| `textbox.js` | Dialog box and choices |
| `inventory.js` | Inventory screen |
| `effects.js` | Fades, lighting, and screen effects |
| `sound.js` | Bridge to the audio module |
| `title.js` | Title screen |
| `save.js` | Game state and `localStorage` |
| `debug.js` | Debug URL parameters |
| `ui.js` | Box drawing and UI styles |

The inventory shows two rows of eight and scrolls (arrows, or the `<` `>` buttons) when there are more. Descriptions longer than four lines are cut off, with a console warning.
