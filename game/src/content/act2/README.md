# Act 2, part 1 (content)

The upper town and Fountain Square: the morning after Moonshine Night, from Lamp Street to the hundredth step. The design is [docs/design/02-city.md](../../../../docs/design/02-city.md); its Decisions section splits the act in two, and this folder is part 1. Part 2 (the Goat Path, Harbor, lamp room, and Bilge) comes later. The engine guide is [src/engine/README.md](../../engine/README.md); this folder follows the opening's structure ([../opening/README.md](../opening/README.md)) and reuses its `grid.js` and dialog helpers.

## Files

| File | Contents |
|---|---|
| `index.js` | The maps, items, and scripts this folder hands to `src/content/index.js`. |
| `lamp_street.js` | Lamp Street (32 × 16): the Skipping Girls, the Woman with Watering Can, the Man on Bench, the scrape, the shut Goat Path gate. |
| `crown.js` | The Crown (24 × 16): Ambrose, the Clockmaker behind the tower door, the sundial, the parapet. |
| `archive.js` | The Archive (16 × 14) with Ottilie and the Eye, and the crypt (10 × 7) with the Founders' Door. |
| `steps.js` | The Hundred Steps (16 × 42): the Counting Woman, the Woman with Basin and her trickle, the Sweaty Kid, the Movers and the piano, the crowbar, the hollow step, and the end of the act. |
| `square.js` | Fountain Square (24 × 18): the Mayor, the Stranded Tourist, the Movers after the slide, the rope to the Bilge; and the Shop (10 × 8). |
| `ending.js` | The end card, then the title screen. |
| `common.js` | Act 2's items, tile helpers (paving, roofs, house fronts), stand-in looks for residents without bodies yet, the stitched piano sprite. |
| `standins.js` | Temporary stand-in art (see below). |
| `tiles.js` | The tileset. |

## Story flags

From the design: `act2.started`, `movers.met`, `piano.slid`, `got.crowbar`, `tourist.met`, `tourist.hasHat`, `counter.left`, `step.found`, `step.open`, `ottilie.met`, `met.<name>`. Added by the build: `basin.inside` (the Woman with Basin goes indoors after the step opens), `mayor.count` (the Mayor and the Counting Woman's scene has played), `act2.done` (Cheryl went down the ladder), and `n.*` counters for lines that alternate or change with repeat looks, as in the opening.

## Jumping to a moment

- Arriving on Lamp Street from the opening: `?map=lamp_street&x=3&y=1&facing=down&items=moon_chart,soap,hat`
- The Steps, ready to grease the piano: `?map=hundred_steps&x=8&y=38&flags=act2.started,n.stepsArrived,movers.met&items=soap,hat`
- The Square after the slide: `?map=fountain_square&x=11&y=4&flags=act2.started,piano.slid,got.crowbar&items=crowbar,hat`
- Ready to open the step: `?map=hundred_steps&x=9&y=18&facing=down&flags=act2.started,n.stepsArrived,piano.slid,got.crowbar,counter.left&items=crowbar,guidebook`
- The end card: add `&run=act2_end`

## Tests

`tests/act2.spec.js` plays part 1 start to finish by keyboard alone and by pointer alone, from Lamp Street with the opening's soap, hat, and moon chart, and saves screenshots as `tests/screenshots/act2-*.png`. A third test walks Cheryl up and down flight 3 through the gap beside the Counting Woman, by keyboard and by pointer, while the Kid runs laps.

## Build decisions

Where the design left something open, or didn't work in play, this is what the build does. The writer has been told about the ones that change the design.

- **Part 1's end state.** The Goat Path gate on Lamp Street is shut with a note ("GOATS ON THE PATH TODAY"); the stair from Fountain Square down to the Bilge is roped off ("CANAL CLEANING. KEEP OUT. -- by order of the Mayor"). Walking up to the rope the first time reads the sign. Neither has an exit yet.
- **The scrape runs down from the foot of the Squeeze stair and along the south edge of the street** (x3 from y5, then y12 to the Steps), not along y10. A hotspot on a walkable row catches clicks meant for walking, so the scrape's "looked at later" line sits on the west part of the y12 row only, where nobody needs to click to get anywhere. The arrival lines play automatically, as designed.
- **NPC looks come first.** Characters have one interaction, so each Look line from the design plays once, in Cheryl's voice, before that character's first talk.
- **The hollow step is reached by walking onto the landing's edge above it**, facing down: it's walkable (it's flush with the landing), so a keyboard player can't turn to face it without stepping. The Kid's crossing tile (10, 19) is the hotspot while the Counting Woman sits on (9, 19); both tiles after she leaves.
- **The open step is a trigger, not an exit**, with its own "Go down?" choice. The engine's pathfinding treats exit tiles as off-limits even while an exit's `when` is false, which would have cut the Steps in half for click-to-walk and for the Kid before the step opens. (Reported to the engine task.)
- **The Kid doesn't block Cheryl** (`solid: false`). In the one-tile gap the two of them could otherwise wait on each other forever; now she squeezes past him. He never stops by choice on x10, y18–24 (the engine's `noStop`).
- **The piano slide:** "Stand back, Miss" moves Cheryl to (11, 38); the Movers scrub either side of the piano (two beats, the piano jiggles), brace above it, and it shoots down through the arch. They run after it; the crowbar is left at (9, 40).
- **In Fountain Square the piano rests against the Fountain's east rim** at (14–15, 8–9), with the Movers beside it at (16, 8) and (15, 10). On the north rim the bronze fish, drawn two tiles tall, stood right across its keys.
- **The Tourist sits at (19, 14)**, facing her table at (18–19, 13); the design's (20, 14) faced the gap between the two tables.
- **The Man on Bench sits on the bench's left end** at (20, 12), rather than standing in front of it.
- **The Counting Woman's march** goes down flight 3, along landing 3, down flight 4, and out through the arch. If the piano were still there she'd climb over it with the Movers' exchange (the camera pans down to watch); in part 1 that can't happen, because the guidebook comes from the Square, which needs the piano gone. Her march stays in for part 2, when the Goat Path makes the other order possible.
- **The Counting Woman in the Square** has a guidebook line of her own ("I've READ it, thank you...").
- **The end card** matches the opening's: the title over "End of Act 2. / Downstairs continues soon." Cheryl is saved standing at (10, 18) beside the open step.
- **Lines added for states the design doesn't cover:** the Goat Path gate's note; the rope's second look; the yard wall, the bay tree, the lamps and the view on Lamp Street; the tower door with the crowbar; the piano and the crowbar, the piano in the Square with soap, the shop hat display with Cheryl's hat; the Woman with Basin's doorstep.

## Stand-ins (until the art lands)

Requested from the art task (Kn_OwEk0wq); each is one reference to swap.

- **Residents without bodies** wear palette swaps of existing bodies (`LOOKS` in `common.js`): Ambrose and the Man on Bench (the Old Man), the Counting Woman, Woman with Basin, Woman with Watering Can, and the Tourist (Her Next Door), the Mayor and the Movers (the Shopkeeper), the Skipping Girls (the Kid). None of them sits, tips, waters, gestures, scrubs, or skips yet; the Tourist doesn't visibly wear the hat; there is no skipping rope.
- **The piano** is the opening's four piano tiles stitched into one 32 × 32 sprite.
- **`standins.js`:** the scrape marks, the water trickle, the crowbar on the paving, the marble jar, the barometer, the rope barrier, the lectern, and the Eye.
- **Item icons:** paper and charcoal and the guidebook are the letter icon recolored; the crowbar is the clothes prop recolored.
- **Other substitutions from the kit:** the school's sign is the generic sign board; the Clockmaker's shop is a plain house front; the Archive's shelves are the flat's bookshelves and Ottilie's desk is the kitchen table; the teapot is the teacup icon; the market stalls are counters under awnings; the stair down to the crypt is a stair tile in the floor.

Audio: `neighborhood`, `archive`, the `discovery` cue, and the sounds `knock`, `shop_bell`, `stone_scrape`, `slab_lift`, `piano_slide`, `scrub`, `gurgle`, and loops `trickle`, `door_hum`, `clock_tick` are requested from the audio task (eoGdH4jg_3) and called by name now; the engine's sound bridge ignores them until they exist.
