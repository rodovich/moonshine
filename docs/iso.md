# The isometric version

The client asked for a second version of Moonshine: "a 640x480 version with a 2:1 isometric view. still sprite-based, but this time benchmarking the visuals against a mid/late-90s PC game." This file records the decisions for it. The SNES-style version stays as it is, live and fully supported.

## One game, two views

- **The story, puzzles, maps' logic, dialog, items, flags, and saves are shared.** Both versions run the same content (`game/src/content/`) and the same engine core (world, scripts, saves, pathfinding, input meaning). The isometric version is a second *presentation*: its own renderer, display, UI skin, and art. Reason: every puzzle, line, and fix then exists once, and the two versions can't drift apart. Maps are tile grids where all logic (collision, entities, exits, triggers) lives on the grid, so an isometric renderer can draw the same grid.
- **Saves are shared.** A save made in one view continues in the other.
- **Choosing a view:** `?view=iso` (or `?view=snes`) in the URL, and, once the isometric opening is ready, a choice on the title screen. The choice is remembered in `localStorage`. Until the isometric opening passes review, it's reachable only by URL, so the live game's title screen doesn't change.
- **Audio is shared** (the existing synthesized score and effects). A 90s-flavored instrument set may come later; it isn't part of this plan.

## Projection and display

- **640×480 internal resolution**, scaled by whole numbers where possible and letterboxed, like the SNES version's 256×224.
- **2:1 dimetric projection.** One map tile is a floor diamond 64 px wide and 32 px tall. Heights are screen pixels: a tile edge's worth of height is 40 px, a storey 120 (agreed by the engine and art tasks). The art's manifest format is in the engine README, "Isometric view", and docs/iso-art-direction.md.
- **Grid directions stay the game's four directions.** On screen they run along the diagonals: the game's up is up-right on screen, right is down-right. Each arrow key walks the grid direction of the same name, which turns it 45° clockwise on screen (Up walks up-right); `?keys=ccw` offers the other turn for playtesting. Decided by the engine task: it keeps every arrow on one grid direction and opposite keys opposite; revisit if playtests disagree. Details in the engine README, "Isometric view".
- **Depth sorting:** tiles, walls, props, and characters sort back to front by their position on the grid (and height), so Cheryl walks behind buildings and in front of them correctly. Where a wall would hide her, the renderer cuts it away or shows her outline, as games of the era did. Walls along a map's front edges are always drawn low, so rooms show; a wall or slab that would cover Cheryl drops to a stub while it does, and a character or prop in front of her lets her show through at half strength.
- **Clicks and taps** map from the screen back to the grid tile under the pointer (accounting for height), then use the shared pathfinding.

## Maps

- **Each map may carry an `iso` description** alongside its layers: per-tile heights and kinds (floor, step, wall block, roof, water) and which isometric art to draw. Content tasks write it per map.
- **A converter drafts it** from the map's existing layers and collision, so every map renders in the isometric view from the start (roughly), and content tasks hand-correct each map to full quality act by act. The whole game stays playable in both views at all times. A map with isometric art is described by a scene, `iso: { scene: (g) => [drawables], floor: (x, y) => z }`, agreed between the engine and art tasks: drawables are the art's frames placed at footprint centers and base heights, walls are columns of stacked face pieces, and the scene follows the story's flags. Without one, the converter's draft shows, correctable with `iso: { cells: [...] }` overrides. Both formats are in the engine README, "Isometric view". Until a map has isometric art, its SNES tiles are drawn sheared onto the floor diamonds and wall faces, and its characters and props at 2×.

## Art

- **The benchmark is a mid/late-90s PC game:** higher resolution, many more colors (16-bit color, with 256-color-per-scene discipline where it helps the look), detailed tiles and characters with a pre-rendered feel, era-appropriate UI (bevelled panels, a proper inventory window). The art is original: it draws on the era without imitating any particular game. The city, characters, and palette identity carry over from the SNES version so both read as the same Tessel.
- **The art is made by code, and shipped as images.** Text grids don't scale to 64-pixel detail in several directions, and the era made such art by pre-rendering models. So the isometric art is built from source models or scenes kept in the repo and rendered by committed scripts into PNG sprite sheets under `game/assets/iso/`. The generated sheets are committed too, so the site still deploys with no build step. This is the one exception to "no image files" in [decisions.md](decisions.md), and it applies to the isometric version only. The art task chooses the modeling method and records it in `docs/iso-art-direction.md`.

## Process

- **Narrow slice first:** the opening (Cistern Court, Cheryl's flat, the moonrise and its picture at 640×480) built to high quality in the isometric view, reviewed (code, art, a real-browser playtest by a first-time player), and fixed, before widening act by act.
- **`main` stays playable in both views.** The usual rule holds: merge only on a green full suite. The isometric view adds its own smoke tests and screenshots.

## Later acts' changes to earlier acts' maps

Later acts change earlier acts' maps (patches, variants, overlays: Act 4's flood stages and dry canal, Act 5's risen Harbor). A hand-built isometric scene can't see those tile changes on its own. Decision (orchestrator, raised by the Act 2 builder):

- **Each act's builder owns the isometric side of its own changes.** A later act supplies an `iso` hook for the maps it changes, given the base scene's kit, that adds or replaces drawables; the engine composes it with the base scene.
- **The engine keeps a safety net:** for any cell whose current tile differs from the tile the base scene was built for, it draws the converter's version of that cell, so a later act's change always shows (roughly) in the isometric view until that act hand-builds it.
