# Decisions

This file records the project's technical and process decisions. Creative decisions live in their own documents, linked below. When you make a decision that affects other collaborators, add it here (or to the linked document) with a short reason.

## Sources

- The client's brief is in [brief.md](brief.md). It is the root authority for what the game must be.
- The isometric 640×480 version (client request): [iso.md](iso.md); its visual identity and art pipeline: [iso-art-direction.md](iso-art-direction.md).
- Creative direction: [story-bible.md](story-bible.md), [art-direction.md](art-direction.md), [audio-direction.md](audio-direction.md) (each written by the task that owns it).
- Game design: [design/overview.md](design/overview.md) (world map, gating, puzzle dependencies, interaction rules) and one build-ready document per slice, starting with [design/01-opening.md](design/01-opening.md).

## Technology

- **Plain JavaScript ES modules, no build step, no runtime dependencies.** The `game/` directory is the whole deployed site and runs as-is from any static file server (`npx serve game` or `python3 -m http.server -d game`). Reason: many tasks edit the code in parallel; no toolchain means nothing to install, nothing to break in deploy, and every change is directly reviewable. Dev-only tools (Playwright for tests and screenshots) may live in a root `package.json` as devDependencies; they never ship.
- **`game/package.json` contains only `"type": "module"`**, so Node loads the game's `.js` files as ES modules and tests can import game code directly (`node --test tests/…`). Without it, a root `package.json` with `"type": "commonjs"` (which `npm init` now writes by default) would make Node read them as CommonJS. It ships with the site but is inert there.
- **Canvas 2D at an internal resolution of 256×224**, the SNES's usual output size, scaled up by an integer factor with smoothing off, letterboxed to fit the window.
- **16×16 tiles. Characters are 16 wide and up to 32 tall**, anchored at their feet. The view is top-down 3/4 ("2.5D"): walls show their front faces, and an overhead layer (eaves, arches, awnings, tree canopies) draws above characters so they can walk behind things.
- **Art is code.** Tiles and sprites are palette-indexed text grids (one character per pixel, `.` for transparent) in JS modules under `game/src/art/`, rendered to canvases at load. Colors come from a master palette quantized to 15-bit RGB (5 bits per channel, like the SNES). Each tile or sprite uses at most 15 colors plus transparency. Reason: agents can author, diff, and review pixel art as text, and the constraints keep the SNES look honest.
- **Art module format.** `game/src/art/palette.js` exports `COLORS`, a map from color names to `#rrggbb` strings whose channels are multiples of 8 (15-bit color). Every other art module exports one or more *sheets*. A sheet works like an SNES sub-palette plus its tiles:

  ```js
  export const plaster = {
    palette: { a: 'plaster_white', b: 'plaster_shade', c: 'mortar' }, // ≤15 entries; '.' is always transparent
    size: [16, 16],                       // width, height of every frame in this sheet
    frames: {
      wall_plain: ['aaaaaaaaaaaaaaaa', /* … 16 rows … */],
      water_0: [/* … */], water_1: [/* … */],   // animation frames are numbered _0, _1, …
    },
  };
  ```

  A sheet may also export `palettes: { alt_name: { a: '…', … } }` for palette swaps (for example, NPC color variants). An alt palette is laid over the base `palette`, so it may list only the letters it changes. Tile properties such as collision belong to map and tileset data in `game/src/content/`, not to the art.

  A sheet may also set `durations: { anim_name: ms }` for its animations (frames `anim_name_0`, `anim_name_1`, …): either one number for every frame, or an array with one entry per frame (for example `[2400, 160]` for a long hold and a quick blink). Without it, use 200 ms. (Added by the art task.)
- **Map layers and art naming.** Maps draw three tile layers, as the engine README describes: `ground` (opaque), `objects` (transparent tiles on the ground and under characters, such as pots, signs, and jambs), and `overhead` (above characters). Frames whose names start with `over_` are made for the overhead layer. Character sheets use the engine's names: `<dir>_0` stands and `<dir>_1`, `<dir>_2` are the steps (the walk plays 1, 0, 2, 0), with `<dir>` one of `down`, `up`, `left`, `right`; longer cycles (the Sweaty Kid's run, `down_1`…`down_4`) say so in their module header and need `sprite.walk`. Other poses are named `<pose>_<dir>` or `<pose>_<dir>_<n>` (for example `reach_up`, `sit_right`, `jog_left_0`). Frames are anchored at the bottom center. Details are in [art-direction.md](art-direction.md). `node tests/check-art.mjs` checks every art module. (Added by the art task; renamed in round 2 to match the engine.)
- **Time-of-day tints** live in `game/src/art/tints.js` (`TINTS.dusk`, `TINTS.night`, `TINTS.day`: a color, an amount, and a blend mode for `effects.tint()`), so the art task owns how dusk and night look. (Added by the art task.)
- **Audio is synthesized with Web Audio** at runtime. Music is note data (a small tracker-style format) under `game/src/audio/music/`; sound effects are synth parameter definitions. No audio files. Audio starts on the first user input, as browsers require.
- **Controls.** Keyboard: arrow keys (WASD also works) to move, Z / Space / Enter to interact and advance text, X / Escape to open the inventory and cancel. Pointer: click or tap a spot to walk there by A* pathfinding; click or tap a character or object to walk next to it and interact; tap to advance text; an on-screen button opens the inventory. Every action must be possible with either scheme alone.
- **Content is data plus small scripts.** Maps, characters, items, and text live under `game/src/content/`. Interactions and cutscenes are async functions that call a small engine API (say a line, give an item, set a flag, move a character, change map, play music). Game state is a set of flags plus the inventory, saved to `localStorage`.
- **Debug hooks for testing.** URL parameters let a tester start at a given map and position with given flags and items (documented in the engine README), so reviewers and Playwright tests can reach any scene quickly.
- **New Game starts the opening** (Cheryl's roof in Cistern Court). The engine test maps stay in the game but are reachable only through debug parameters (`?map=test_street`). The opening's content and its build decisions are in `game/src/content/opening/README.md`. (Added by the opening content task.)
- **Each act's content lives in its own folder under `game/src/content/`** with a README of its build decisions and stand-ins: `opening/`, then `act2/` (both parts of Act 2; its README is `game/src/content/act2/README.md`). Act folders reuse the opening's `grid.js` (maps from a `compose(g)` function) and dialog helpers rather than copying them. (Added by the Act 2 content task.)
- **A later act adds its states to an earlier act's map by layering, not by editing that act's files**: it wraps the map's entities, patches, exits, lights, and `onEnter` (Act 3's `withAct3`, Act 6's `extendMap` in `game/src/content/act6/extend.js`), and `src/content/index.js` applies the layers in act order. A map that changes too much to layer becomes a new map and the ways into the old one are redirected (Act 5's risen Harbor; see `game/src/content/act5/README.md`). Each act still owns its files, and the wrappers keep the wrapped functions' source visible to `npm run check`. Once Cheryl climbs out of the well in Act 6 (flag `epilogue`), every act's world states (dry canals, risen Harbor, laundry, dusk on the Crown) should come out false, so the surface returns to its plain Act 2 daytime look for the epilogue. (Added by the Act 6 content task.)

## Engine

The engine's own decisions (grid-stepped movement, display scaling, text style, scripting model) and the full content-authoring guide live in [game/src/engine/README.md](../game/src/engine/README.md). The ones that shape content:

- **Movement is grid-stepped**: characters occupy whole 16×16 tiles and glide smoothly between them, in four directions. Puzzle layouts can rely on "who stands on which tile".
- **The overhead layer is for things always above characters** (eaves, arch tops, canopies). Anything a character can stand both in front of and behind is a sprite entity, which sorts by its feet.
- **Text style**: NPC dialog in a navy box with a speaker tab; Cheryl's descriptions in a warm brown box with no label; her thoughts in the warm box, italic, with a dashed frame. The bitmap font is in `game/src/art/font.js`.
- **The audio boundary** is `game/src/engine/sound.js`, a bridge to the audio module that maps engine sound ids to audio ids and ignores unknown ids. Scripts reach it through `g.playMusic`, `g.stopMusic`, `g.playCue`, `g.sfx`, and `g.setWrongness`.
- **Walk animation follows distance walked** (one frame per 8 px), not the sheet's `walk_*` durations, so feet stay planted; the `walk_*` durations are ignored. Cheryl walks a tile per 12 frames (80 px/s, about 100 ms per walk frame), NPCs a tile per 16. Idles and other animations use `durations`. Scene lighting tints characters at half strength.
- **Authoring aids:** `npm run check` validates all content (maps, exits, art references, ids used by scripts); `/dev/map.html` renders any map in any story state with collision, exits, triggers, and entities overlaid. Run the check before pushing content.
- **People who move between maps are defined once** in `content.characters` with an `at(g)` placement, rather than duplicated per map.
- **Lighting (dusk, night, day) is an engine layer**, declared per map and changeable mid-scene, separate from the Wrongness's screen effects.
- **UI colors** are the `ui_*` entries in `game/src/art/palette.js`. The `ph_*` entries are placeholder art for the engine test maps and go away with them.

## Repository layout

```
game/                 deployed site (GitHub Pages serves this directory)
  index.html
  src/engine/         engine: loop, rendering, input, pathfinding, text, scripting, save
  src/art/            palette, tiles, sprites, font
  src/audio/          synth, sound effects, music
  src/content/        maps, characters, items, scripts, dialog
docs/                 brief, decisions, creative direction, design notes
tests/                Playwright smoke tests and screenshot scripts
```

## Process

- **Iterate from a narrow slice.** First build the opening confined area to high quality, then widen in stages: wider city, first underground entrance, the changed-surface reveal, the ending. (From the client's brief.)
- **The orchestrator task owns `main`.** Child tasks work on their own branches in their own worktrees. Another task reviews the work (code, writing, art, and a real-browser playtest with screenshots), the author addresses the feedback, and the orchestrator merges. Pushing to and merging into rodovich/moonshine is authorized by the client.
- **`main` is always playable.** Every push to `main` deploys `game/` to GitHub Pages through `.github/workflows/pages.yml`.
- **Merge only on a green full suite.** The orchestrator merges a branch into `main` only after the full desktop, phone, and isometric Playwright suite passes on the branch merged with current `main` (`npx playwright test --project=desktop --project=phone --project=iso`, about an hour; the `iso` project replays the story in the isometric view). Each checkout gets its own test server port, so worktrees can test in parallel.
- **Every blocker must earn its place.** A blocked path, a refused exit, or a locked door is fine only if it gates a puzzle or a story moment, and it must look blocked and stay consistent (no slipping past it later). A blocker whose only job is to send the player the long way round goes. Every interactable must also be reachable and usable by keyboard alone (`npm run check:keyboard`). (From the client's feedback after playing through Act 4: "obstacles are fine if they're earned, if they make sense and force me to solve a particular puzzle or experience a particular part of the story.")
- **Original work.** The game draws on the feel of SNES-era adventures but does not recreate any existing game's story, characters, art, music, or maps.
