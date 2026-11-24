# Moonshine engine

How to build the game on this engine: maps, tilesets, characters, items, and scripts. The engine test content in `src/content/test/index.js` uses every feature described here; copy from it.

Run the game with `npm run serve` (or `python3 -m http.server -d game`) and open http://localhost:8123/. Add `?map=test_yard` to jump straight in.

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
  start: { map: 'test_yard', x: 5, y: 6, facing: 'down' }, // new game location
  player: { name: 'Cheryl', sprite: { sheet: cherylSheet } },
  maps: { test_yard: yardMap, ... },                         // by id
  items: { brass_key: { ... }, ... },                        // by id
  scripts: { intro: async (g) => { ... } },                  // runnable with ?run=intro
  onNewGame: async (g) => { ... },                           // optional, once per new game
  defaults: {
    useFail: async (g, target, itemId) => g.describe("That won't help."), // item has no effect
    nothingToUseOn: "There's nothing there to use it on.",                 // keyboard use facing nothing
  },
};
```

Game state is `{ flags, inventory, map, x, y, facing }`. It saves to `localStorage` after every script finishes and after every map change. The title screen offers Continue when a save exists.

## Maps

A map is a JS object; put each in its own module under `src/content/maps/`.

```js
export default {
  id: 'harbor_steps',
  tileset: townTiles,            // see Tilesets
  music: 'harbor',               // played on entry; null stops music; omit to leave it alone
  background: 'sea_dark',        // palette color shown outside small maps (default black)
  spawn: [5, 6],                 // default position for ?map= debug starts
  legend: { '.': 'cobble', '#': 'wall_plaster', '^': 'awning_mid', ' ': '(always empty)' },
  ground:   [ '....', ... ],     // one character per 16×16 tile
  objects:  [ ' #  ', ... ],     // optional: walls, furniture, trunks (drawn over ground)
  overhead: [ ' ^  ', ... ],     // optional: drawn over characters (eaves, arches, canopies)
  collision: [ '  # ', ... ],    // optional override: '#' solid, 'o' open, anything else = from tiles
  exits: [ ... ],
  triggers: [ ... ],
  entities: [ ... ],
  onEnter: async (g) => { ... }, // runs after the fade-in each time the map loads
};
```

All layers are the same size as `ground`. The legend is shared by all layers, so give each tile its own character. A tile is solid if its ground or objects tile is solid (overhead tiles never block).

**Layering rule (3/4 view).** Ground, then objects, then characters sorted by their feet, then overhead. Use the overhead layer only for things that are always above anyone walking there: roof eaves, arch tops, tree canopies over a trunk. Anything a character can stand both in front of and behind (lamp posts, statues, tall plants) should be an entity with a sprite, so it sorts by y.

**Exits** fire when the player finishes a step onto them:

```js
exits: [
  { x: 5, y: 4, to: 'shop', at: [4, 8], facing: 'up' },             // a door
  { x: 15, y: 17, w: 3, to: 'lane', at: [8, 1], facing: 'down' },   // an edge, 3 tiles wide
  { x: 2, y: 0, to: 'roof', at: [1, 1], when: (g) => g.flag('ladder_down') }, // conditional
  { x: 9, y: 9, run: async (g) => { await g.describe('Locked.'); } },         // custom script
]
```

A multi-tile exit keeps the player's offset: stepping onto the middle of a 3-wide edge arrives in the middle of the destination. `sfx` overrides the default `'door'` sound.

**Triggers** run a script when the player steps onto any tile in their area: `{ x, y, w, h, when, run, stop }`. Guard one-shot triggers with a flag in `when`. `stop: false` lets the player keep walking afterwards; by default they stop.

## Tilesets

A tileset names tiles and says where their art is and how they behave:

```js
import { townSheet, waterSheet } from '../art/town.js';
export const townTiles = {
  tiles: {
    cobble: { sheet: townSheet },                         // frame 'cobble'
    cobble_worn: { sheet: townSheet, frame: 'cobble_2' }, // a differently named frame
    canal: { sheet: waterSheet, frame: 'canal', solid: true, fps: 3 }, // animates canal_0, canal_1, ...
    shop_counter: { sheet: townSheet, solid: true, counter: true },
    cobble_night: { sheet: townSheet, frame: 'cobble', palette: 'night' }, // a palette swap
  },
};
```

- `solid`: blocks walking.
- `counter`: the player can talk across it (to someone one tile beyond).
- Animated tiles: if `frame` (or the tile name) has numbered frames `name_0`, `name_1`, … they cycle at `fps` (default 3).
- `palette`: a swap name from the sheet's `palettes`, or an object of overrides.

Sheets follow the art module format in `docs/decisions.md`. Tiles are 16×16; objects and overhead tiles may use `.` for transparency.

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
  interact: async (g, self) => { ... }, // look / talk
  use: {                              // using items on it
    brass_key: async (g, self) => { ... },
    '*': async (g, self, itemId) => { ... }, // any other item
  },
}
```

Shortcuts instead of `interact`: `talk: ['line', 'line']` (the entity says them) or `look: 'text'` (Cheryl describes it).

**Sprites.**
- *Character sheets* (no `frame`): frames named `down_0`, `down_1`, `down_2`, `up_…`, `right_…`, and optionally `left_…` (otherwise `right` is mirrored). Frame 0 is standing. With three frames the walk cycle is 1, 0, 2, 0; with two it is 1, 0; otherwise all in order. Override with `sprite.walk: [1, 2, 3, 0]`. Frames may be up to 16×32; they are drawn bottom-centered on the footprint.
- *Static sprites*: `sprite: { sheet, frame: 'chest_closed' }`. If the frame has numbered variants they animate at `sprite.fps` (default 4).
- `offset: [dx, dy]` nudges the drawing; `layer: 'ground'` draws it under everything that sorts (rugs, things lying on the floor).

**Behaviors.**
- `'idle'` (default): stands still; after a conversation turns back to its original facing.
- `'face'` (or `{ type: 'face', range: 3 }`): turns to watch the player when within range.
- `{ type: 'wander', area: [x, y, w, h], pause: [1, 3] }`: takes random steps inside the area, pausing 1–3 s. Never steps onto exits.
- Scripted moves: `g.moveNpc(...)` at any time.

Characters turn to face the player when talked to (`turnToTalk: false` to prevent it), and wandering pauses while any script runs.

**Things that change.** To make something disappear for good (a picked-up item), give it `when: (g) => !g.flag('got_key')` and set the flag. To swap an object's look (a chest opening), either define two entities with opposite `when`s or call `g.setSprite(id, sprite)`. Entities are re-checked after every script.

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

The player opens the inventory with X/Escape or the bag button (top right), picks an item, and chooses **Use**. They are then "holding" it (a banner shows `Use Brass Key on…`). Keyboard: Z uses it on whatever Cheryl faces; X cancels. Pointer: click a character or object to walk over and use it there; click the banner to cancel. The target's `use[itemId]` handler runs, else `use['*']`, else `defaults.useFail`.

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

Only one script runs at a time; others queue. While a script runs the player can't move, and NPCs stop wandering. If a script throws, the error is logged and the game carries on.

## Script API

Text:

| Call | What it does |
|---|---|
| `say(speaker, ...lines)` | NPC dialog. `speaker` is a label (`'Old Man'`), an entity, an entity id, or `null`. Each argument is its own box; long text pages automatically (3 lines a page). |
| `describe(...lines)` | Cheryl's descriptions, in her warm-colored box with no label. |
| `think(...lines)` | Cheryl's internal monologue: warm, italic, dashed frame. |
| `choose(options)` / `choose(prompt, options, { speaker, cancel })` | Shows options; resolves to the chosen index. X/Escape picks `cancel` (default: the last option). With no `speaker` the prompt is in Cheryl's style. |

Text normalizes `...` to an ellipsis and `--` to an em dash. The font has letters, digits, and common punctuation (`. , ! ? ' " ‘ ’ “ ” - — : ; ( ) / … + = * % & # ♪ < > _ $`).

Items and flags:

| Call | What it does |
|---|---|
| `giveItem(id, { silent })` | Adds to the inventory and shows "Got X." (unless `silent`). |
| `takeItem(id)` | Removes; returns whether it was there. |
| `hasItem(id)`, `items` | Check the inventory. |
| `setFlag(name, value = true)` | `false`/`null` deletes the flag. Values may be numbers or strings. |
| `flag(name)`, `flags` | Read flags. |

Characters and objects (an `id` may be an id string, an entity, or `'player'`):

| Call | What it does |
|---|---|
| `npc(id)`, `player` | The entity (has `x`, `y`, `facing`, `name`, …). |
| `moveNpc(id, target, { speed, ghost, face })` | Walks. `target` is `[x, y]` (pathfinds around things), a list of directions `['up', 'up', 'left']`, or a string `'u u l'`. `speed` is ticks per tile (player 8, NPCs 16). `ghost: true` ignores collisions. A blocked scripted walk waits, re-routes, and after two seconds walks through the obstacle, so cutscenes never hang. |
| `movePlayer(target, opts)` | Same for Cheryl. |
| `faceNpc(id, dir)`, `facePlayer(dir)` | `dir` is a direction or another entity's id (`'player'`). |
| `place(id, x, y, facing)` | Teleports. |
| `show(id)`, `hide(id)` | Toggle visibility. |
| `remove(id)` | Removes until the map reloads (use `when` + a flag for permanent removal). |
| `setSprite(id, sprite)` | Changes an entity's sprite. |

Time, camera, and screen effects (all resolve when done; durations in seconds):

| Call | What it does |
|---|---|
| `wait(seconds)` | Pause. |
| `fade('out' \| 'in' \| alpha, seconds, color)` | Fade to/from a color (default black), in 8 brightness steps. |
| `shake(pixels, seconds)` | Screen shake. |
| `tint(color, amount, seconds, mode)` | Color wash over the world. `mode` is a canvas blend: `'source-over'` (default), `'multiply'`, `'screen'`, `'color'`, `'hue'`, `'saturation'`, `'difference'`. Amount 0 removes it. |
| `hueShift(degrees, seconds)` | Rotates every color's hue (palette-shift look), snapped to 15-bit color. 0 restores. |
| `distort(pixels, seconds, { freq, speed })` | Per-scanline wobble. 0 removes it. |
| `flicker(seconds, { color, rate })` | Rapid inverted flashes. |
| `clearEffects(seconds)` | Removes tint, hue shift, and distortion. |
| `panCamera(x, y, speed)` / `followPlayer(speed)` | Glide the camera to a tile and back to Cheryl. |

Effects persist across map changes until cleared, so a scene can carry its mood through a door.

Maps, audio, misc:

| Call | What it does |
|---|---|
| `changeMap(id, x, y, facing, { fade, seconds })` | Fades out, loads, fades in, then runs the map's `onEnter`. |
| `map` | Current map id. |
| `playMusic(id)`, `stopMusic()`, `sfx(id)` | Audio (see below). |
| `save()` | Save now (saving also happens automatically). |
| `random(min, max)` | Integer from the game's RNG (seedable with `?seed=`). |

## Audio boundary

The engine only calls the four functions exported by `src/audio/index.js`: `unlockAudio()` (first key press or tap), `playMusic(id)`, `stopMusic()`, and `sfx(id)`. The comment at the top of that file lists the sound effect ids the engine uses (`text`, `text_cheryl`, `cursor`, `select`, `cancel`, `bump`, `door`, `item`). Unknown ids must be ignored, so content can name music before it exists. Maps play their `music` on entry.

## Debug parameters

Add these to the URL. Giving `map` or `start` skips the title and, unless `save=1`, never writes the save slot (so testing doesn't clobber a real game).

| Parameter | Effect |
|---|---|
| `map=test_house` | Start a new game on this map (at its `spawn`, or `x`/`y`). |
| `x=4&y=6&facing=up` | Starting position and facing. |
| `flags=met_baker,door_open,coins=3` | Set flags (`true` unless given a value). |
| `items=brass_key,letter` | Start with items. |
| `run=wrongness` | Run `content.scripts.wrongness` once the map loads. |
| `start=new` / `start=continue` | Skip the title screen. |
| `debug=1` | Overlay: solid tiles red, exits cyan, the current path yellow, map and position bottom left. |
| `seed=42` | Fix the random seed (NPC wandering). |
| `save=1` | Allow saving in a debug start. |

Examples:
- `?map=test_yard&debug=1`
- `?map=test_house&x=2&y=5&facing=up&items=letter&run=wrongness` (the scripted sequence)

`window.moonshine` is the running game; `moonshine.snapshot()` summarizes the state (position, text on screen, flags, items, entities), which the tests use.

## Tests and screenshots

```
npm install
npx playwright install chromium
npm test                 # desktop and phone smoke tests; screenshots in tests/screenshots/
node tests/shot.js "?map=test_yard" out.png 800 ArrowRight z   # one screenshot after some keys
```

## Engine decisions

- **Grid-stepped movement with smooth interpolation.** Characters occupy whole 16×16 tiles and glide between them (the player at 2 px per frame, one tile per 8 frames; NPCs at 1 px per frame). Reasons: click-to-walk pathfinding, collision, and "walk next to that and face it" are exact on a grid, so the player never snags on corners or stops a pixel short; NPCs block whole tiles, so puzzles about who stands where are unambiguous; and it matches the tile-locked feel of many SNES adventures. Holding a direction chains steps with no pause; tapping a direction toward something solid turns Cheryl to face it.
- **Four directions only**, for both keyboard and pathfinding. Paths prefer fewer turns so they look deliberate.
- **Clicks on unreachable spots** walk to the nearest reachable tile. Clicks on characters or objects walk to the nearest tile beside them (or across a counter), face them, and interact. Holding the pointer down and dragging steers.
- **Fixed 60 Hz update** with rendering every animation frame; frame times within 1.5 ms of a whole tick count as exactly one tick, so 60 Hz displays get no judder.
- **Display scaling.** The 256×224 frame is scaled by a whole number of *device* pixels when that uses at least 80% of the possible size; otherwise (very small screens) by the exact fit, with nearest-neighbor sampling. On a typical phone in portrait this gives a crisp 4× in device pixels.
- **Text** is a variable-width bitmap font (`src/art/font.js`, 7 px caps, 9 px cell, 12 px lines), revealed at about 42 characters per second with short pauses after punctuation. Any key or tap reveals the rest; the next press advances. The box sits at the bottom, or the top when Cheryl is in the lower part of the screen. NPC lines have a navy box and a speaker tab; Cheryl's descriptions a warm brown box; her thoughts the warm box in italics with a dashed frame.
- **One script at a time**, queued; the world pauses player control while scripts run. Autosave after each script and map change.

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
| `effects.js` | Fades and screen effects |
| `title.js` | Title screen |
| `save.js` | Game state and `localStorage` |
| `debug.js` | Debug URL parameters |
| `ui.js` | Box drawing and UI styles |
