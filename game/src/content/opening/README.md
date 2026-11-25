# The opening (content)

The first playable slice: Moonshine Night in Cistern Court. The design is [docs/design/01-opening.md](../../../../docs/design/01-opening.md) and the art index is [docs/art-opening.md](../../../../docs/art-opening.md); this folder builds them on the engine ([src/engine/README.md](../../engine/README.md)). New Game starts here, on Cheryl's roof. The engine test maps are reachable only with `?map=test_street`.

## Files

| File | Contents |
|---|---|
| `index.js` | The maps, items, and scripts this folder hands to `src/content/index.js`; the new-game intro. |
| `court.js` | Cistern Court (20 × 26): tiles, objects, the Old Man, Her Next Door, the Sweaty Kid, the cat, the end of the slice. |
| `flat.js` | Cheryl's flat (12 × 9). |
| `moonrise.js` | The moonrise sequence, steps numbered as in the design. |
| `common.js` | Items, the item hint, saved counters, and Cheryl's fallback lines. |
| `grid.js` | Turns a map's `compose(g)` function into the engine's legend, layers, and patches. |
| `tiles.js` | The tileset (the sheets the maps reference). |

## How the maps are built

Each map module has one `compose(g)` function that lays out every tile (ground, detail, overhead, and which tiles are solid) for the current game state, written like the art task's dev scenes. `composedMap` runs it once for a new game to make the engine's map, and again after every script to produce `patches`: the tiles that differ. So a taken pepper mill, a moved sheet, a filling tub, or the piano gone in the morning is just an `if` in `compose`. Solidity rides on the ground tile, so a tile that stops blocking is just another patch.

Set pieces drive the art with short-lived flags that `compose` reads: `fx.tap`, `fx.tub` (`filling`, `slosh`, `whirl`, `empty`), `fx.chimney`, `fx.backline`, and `neighbor.stage` (1–6, the sheets moving). The moonrise clears them before the morning.

## Story flags

`oldMan.wantsKing`, `oldMan.hasPepperKing`, `kid.wantsTimer`, `kid.hasTimer`, `neighbor.wantsProp`, `neighbor.sheetsMoved`, `tub.plugged`, `tub.full`, `act1.moonrise` (the morning), `act1.done` (left by the Squeeze). `act2.started` (set by Act 2 on first entering Lamp Street) takes the Kid out of the court and gives the Old Man and the Neighbor new repeat lines. The Squeeze leads to Lamp Street once `src/content/index.js` finds that map; until then it shows the end card. Taken things are `got.<item>`. `n.<name>` flags are counters for lines that change with repeat looks or alternate (`bump` and `cycle` in `common.js`). `hint.bag` marks the one-time item hint.

## Jumping to a moment

- The intro: `?map=cistern_court&run=opening_intro`
- Ready for the moonrise: `?map=cistern_court&x=3&y=5&facing=up&flags=tub.full,neighbor.sheetsMoved`, then look at the tub (or add `&run=opening_moonrise`)
- The morning: `?map=flat&x=8&y=4&flags=act1.moonrise`
- Mid-puzzle: add `items=pepper_mill,egg_timer` or flags such as `oldMan.hasPepperKing,kid.hasTimer` (give items to match)

## Tests

`tests/opening.spec.js` plays the whole opening twice, by keyboard alone (the plug thread first) and by pointer alone (the view thread first), and saves screenshots of key moments as `tests/screenshots/opening-*.png`. `node tests/play.mjs "<query>" step …` is a small dev tool for poking at a scene and taking screenshots (see its header).

## Sound

Maps play their music in `onEnter` (`cistern_court` at dusk, `morning_after` in the morning). Footsteps follow the surface: plaster on the roofs, stone in the court, stairs on the outside stair and the Squeeze, tile and rug in the flat. The tap runs the `water_pour` loop while the tub fills; the egg timer ticks (`timer_tick` loop) while the Kid admires it. The moonrise uses the `crowd` and `wind` loops and the drain in its three parts, timed to the tub's animation.

## Build decisions

Where the design left something open or didn't work in play, this is what the build does. The writer has been told about the ones that change the design.

- **Row 2 under the back line is never walkable.** The sheets go up there, and the Neighbor stands at (14,3) to hang them.
- **The bare N–S lines are walkable once the sheets move**; only the posts stay solid. It opens up her roof for the moonrise and morning.
- **Hotspots on the facade span both rows** (windows, the Neighbor's door), so they can be looked at from the court. **The bookshelf's hotspot reaches one tile west, to (8,1)**, because the bed blocks the tile below it; Cheryl looks at it from (8,2).
- **The counter tiles are counters**, so the kitchen shelf can be looked at across them from row 3 (by keyboard once the counter is bare; by pointer any time).
- **Lines added for states the design doesn't cover:** the N–S lines after the sheets move ("Her empty lines…"), the table after the chart is taken, the wardrobe after the hat is taken.
- **The sheets move in a little scene:** she unpegs the x15 sheets from (16,4), the x12 sheets from (13,4), props the back line from (14,3), the sheets go up in three beats with a flap each, and she goes back to (16,3).
- **The Kid's hop:** extra waypoints at (13,16) and (13,18) bracket the hurdle; he holds the hop pose between them. Sweat flies off at the four corners. After the timer, every third lap ends with a ding and both arms up. When he shows off ("Watch!") he runs to the hurdle, hops it, and comes back.
- **Walking down into the piano** (onto (15–16,22) facing down) gives the design's "not climbing over a piano" line. Clicking past it lands there too.
- **The Squeeze in the morning:** the first step onto the stair top (15–16,24) gives its line; the exit is the row below (15–16,25).
- **Moonrise staging:** Cheryl sits at (3,5) facing east (design step 2). The dip to the vista goes through black (the engine's picture fade). When the moon appears the crowd loop stops dead and the music box winds down (`g.windDownMusic`). For step 16, the Neighbor walks to the low wall at (10,4) and says her lines over it.
- **Idles:** the Neighbor smooths her sheet three times, then steps back to admire it for two seconds. Every 6–11 seconds the Old Man reaches out, moves a piece (tap), and moves it back (tap). In the morning the well breathes every 5–8 seconds (mist and a cold whoosh), and the Kid jogs in place, facing Cheryl when she's near.
- **The end card** shows the title in the title screen's style over "End of the opening. / Tessel continues soon.", then returns to the title screen. Cheryl is saved standing at the top of the Squeeze, so Continue doesn't drop her on the exit.
