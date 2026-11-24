# Decisions

This file records the project's technical and process decisions. Creative decisions live in their own documents, linked below. When you make a decision that affects other collaborators, add it here (or to the linked document) with a short reason.

## Sources

- The client's brief is in [brief.md](brief.md). It is the root authority for what the game must be.
- Creative direction: [story-bible.md](story-bible.md), [art-direction.md](art-direction.md), [audio-direction.md](audio-direction.md) (each written by the task that owns it).
- Game design: [design/overview.md](design/overview.md) (world map, gating, puzzle dependencies, interaction rules) and one build-ready document per slice, starting with [design/01-opening.md](design/01-opening.md).

## Technology

- **Plain JavaScript ES modules, no build step, no runtime dependencies.** The `game/` directory is the whole deployed site and runs as-is from any static file server (`npx serve game` or `python3 -m http.server -d game`). Reason: many tasks edit the code in parallel; no toolchain means nothing to install, nothing to break in deploy, and every change is directly reviewable. Dev-only tools (Playwright for tests and screenshots) may live in a root `package.json` as devDependencies; they never ship.
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

  A sheet may also export `palettes: { alt_name: { a: '…', … } }` for palette swaps (for example, NPC color variants). Tile properties such as collision belong to map and tileset data in `game/src/content/`, not to the art.
- **Audio is synthesized with Web Audio** at runtime. Music is note data (a small tracker-style format) under `game/src/audio/music/`; sound effects are synth parameter definitions. No audio files. Audio starts on the first user input, as browsers require.
- **Controls.** Keyboard: arrow keys (WASD also works) to move, Z / Space / Enter to interact and advance text, X / Escape to open the inventory and cancel. Pointer: click or tap a spot to walk there by A* pathfinding; click or tap a character or object to walk next to it and interact; tap to advance text; an on-screen button opens the inventory. Every action must be possible with either scheme alone.
- **Content is data plus small scripts.** Maps, characters, items, and text live under `game/src/content/`. Interactions and cutscenes are async functions that call a small engine API (say a line, give an item, set a flag, move a character, change map, play music). Game state is a set of flags plus the inventory, saved to `localStorage`.
- **Debug hooks for testing.** URL parameters let a tester start at a given map and position with given flags and items (documented in the engine README), so reviewers and Playwright tests can reach any scene quickly.

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
- **Original work.** The game draws on the feel of SNES-era adventures but does not recreate any existing game's story, characters, art, music, or maps.
