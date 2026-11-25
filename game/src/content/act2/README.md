# Act 2 (content)

The morning after Moonshine Night, from Lamp Street to the hundredth step. The design is [docs/design/02-city.md](../../../../docs/design/02-city.md); its Decisions section splits the build in two. Part 1 is the upper town and Fountain Square; part 2 is the long way round: the Goat Path, the Harbor and its lamp room, and the Bilge. Both are here. The engine guide is [src/engine/README.md](../../engine/README.md); this folder follows the opening's structure ([../opening/README.md](../opening/README.md)) and reuses its `grid.js` and dialog helpers.

## Files

| File | Contents |
|---|---|
| `index.js` | The maps, items, and scripts this folder hands to `src/content/index.js`. |
| `lamp_street.js` | Lamp Street (32 × 16): the Skipping Girls, the Woman with Watering Can, the Man on Bench, the scrape, the way to the Goat Path. |
| `crown.js` | The Crown (24 × 16): Ambrose, the Clockmaker behind the tower door, the sundial, the parapet. |
| `archive.js` | The Archive (16 × 14) with Ottilie and the Eye, and the crypt (10 × 7) with the Founders' Door. |
| `steps.js` | The Hundred Steps (16 × 42): the Counting Woman, the Woman with Basin and her trickle, the Sweaty Kid, the Movers and the piano, the crowbar, the hollow step, and the end of the act. |
| `square.js` | Fountain Square (24 × 18): the Mayor, the Stranded Tourist, the Movers after the slide, the stair down to the Bilge; and the Shop (10 × 8). |
| `goat_path.js` | The Goat Path (16 × 24): Mott's shack, the goats, the sea cave mouth. |
| `harbor.js` | The Harbor (32 × 14): Captain Mott, the ferry, the Keyhole, the sea view; and the lamp room (8 × 8) with the Lighthouse Keeper. |
| `bilge.js` | The Bilge (32 × 16): the Fishmonger, the Boatman, the Water Stairs, the flooded end of the south quay. |
| `ending.js` | The end card, then the title screen. |
| `common.js` | Act 2's items, tile helpers (paving, roofs, house fronts), and each resident's look (sheet, pose, palette). |
| `tiles.js` | The tileset. |

## Story flags

From the design: `act2.started`, `movers.met`, `piano.slid`, `got.crowbar`, `tourist.met`, `tourist.hasHat`, `counter.left`, `step.found`, `step.open`, `ottilie.met`, `met.<name>`. Added by the build: `basin.inside` (the Woman with Basin goes indoors after the step opens), `mayor.count` (the Mayor and the Counting Woman's scene has played), `act2.done` (Cheryl went down the ladder), `fx.inFlood` (Cheryl is standing in the Bilge's flood, so the next wade can comment), and `n.*` counters for lines that alternate or change with repeat looks, as in the opening.

## Jumping to a moment

- Arriving on Lamp Street from the opening: `?map=lamp_street&x=3&y=1&facing=down&items=moon_chart,soap,hat`
- The Steps, ready to grease the piano: `?map=hundred_steps&x=8&y=38&flags=act2.started,n.stepsArrived,movers.met&items=soap,hat`
- The Square after the slide: `?map=fountain_square&x=11&y=4&flags=act2.started,piano.slid,got.crowbar&items=crowbar,hat`
- Ready to open the step: `?map=hundred_steps&x=9&y=18&facing=down&flags=act2.started,n.stepsArrived,piano.slid,got.crowbar,counter.left&items=crowbar,guidebook`
- The Goat Path from Lamp Street: `?map=goat_path&x=13&y=2&flags=act2.started`
- The Harbor, with the moon chart for Mott: `?map=harbor&x=12&y=7&flags=act2.started&items=moon_chart`
- The Bilge: `?map=bilge&x=11&y=5&flags=act2.started`
- The end card: add `&run=act2_end`

## Tests

`tests/act2.spec.js` plays the act start to finish three ways, from Lamp Street with the opening's soap, hat, and moon chart: by keyboard and by pointer with the piano first, and by keyboard the long way round (Goat Path, Harbor, lamp room, Bilge, the Square from below) with the Count thread first, so the Counting Woman climbs over the piano. A pointer test tours part 2's people, and another walks Cheryl up and down flight 3 through the gap beside the Counting Woman while the Kid runs laps. Screenshots go to `tests/screenshots/act2-*.png`.

## Build decisions

Where the design left something open, or didn't work in play, this is what the build does. The writer has been told about the ones that change the design.

- **Part 1 shipped first with the long way round closed** (a shut Goat Path gate, a rope across the stair to the Bilge). Part 2 removes both: Lamp Street's west edge (0, 9–11) leads to the Goat Path, with the design's line the first time, and the Square's south stair leads down to the Bilge.
- **The scrape runs along y10** as designed (x3–28), turning down x27–28 to the Steps. A hotspot on a walkable row catches clicks meant for walking, so its "looked at later" line is only at x3–5.
- **NPC looks come first.** Characters have one interaction, so each Look line from the design plays once, in Cheryl's voice, before that character's first talk.
- **The hollow step is reached by walking onto the landing's edge above it**, facing down: it's walkable (it's flush with the landing), so a keyboard player can't turn to face it without stepping. The Kid's crossing tile (10, 19) is the hotspot while the Counting Woman sits on (9, 19); both tiles after she leaves.
- **The open step is a trigger, not an exit**, with its own "Go down?" choice. The engine's pathfinding treats exit tiles as off-limits even while an exit's `when` is false, which would have cut the Steps in half for click-to-walk and for the Kid before the step opens. (Reported to the engine task.)
- **The Kid doesn't block Cheryl** (`solid: false`). In the one-tile gap the two of them could otherwise wait on each other forever; now she squeezes past him. He never stops by choice on x10, y18–24 (the engine's `noStop`).
- **The piano slide:** "Stand back, Miss" moves Cheryl to (11, 38); the Movers scrub either side of the piano (two beats, the piano jiggles), brace above it, and it shoots down through the arch. They run after it; the crowbar is left at (9, 40).
- **In Fountain Square the piano rests against the Fountain's east rim** at (14–15, 8–9), with the Movers beside it at (16, 8) and (15, 10). On the north rim the bronze fish, drawn two tiles tall, stood right across its keys.
- **The Tourist sits at (19, 14)**, facing her table at (18–19, 13); the design's (20, 14) faced the gap between the two tables.
- **The bench on Lamp Street is at (20–21, 11)**, and the Man on Bench sits on it from the tile in front, (20, 12), as the art is drawn.
- **The Skipping Girls stand at (10–12, 6)**, two turners and the jumper between them, with the rope over all three (the design spread them over x10–14).
- **The Woman with Basin's door is at (7, 15)** and she stands at (7, 16): the trickle art runs west to east along a row, so her water runs along landing 2's lower edge (row 18) from x7 and slips into the joint at (10, 18), above the hollow step.
- **The Clockmaker's shop door is at x12**; its painted clock and window of clocks take x10–11.
- **The yard gate is one tile (x12)**, open.
- **The Counting Woman's march** goes down flight 3, along landing 3, down flight 4, and out through the arch. If the piano were still there she'd climb over it with the Movers' exchange (the camera pans down to watch); in part 1 that can't happen, because the guidebook comes from the Square, which needs the piano gone. Part 2 makes that order possible: by the long way round, the guidebook can come first, and she climbs over the piano while the Movers protest.
- **The Counting Woman in the Square** has a guidebook line of her own ("I've READ it, thank you...").
- **With the long way open, the blocked arch says so:** "I'm not climbing over a piano at my age. The Goat Path goes round the long way." (The design's full line; part 1 dropped its second half.)
- **Wrongness is 0.1 in Act 2** (story bible: "about 0.1 after Act 1"). Every Act 2 map sets it on entry while `act2.done` isn't set, so later acts' levels win once Act 2 is over.
- **Part 2 placements:** the Lighthouse Keeper polishes the lamp from (4, 4), facing it (the art's `polish_up`), rather than from (5, 3) facing left. Mott sits on the middle bollard at (13, 8) with his jug; he takes a swig every so often, and when shown the moon chart. The Boatman's boat is part of his sprite at (14–15, 9). The Bilge's fish stalls reuse the Square's market stall. The Fishmonger stands at (4, 4), between her stalls and in front of her own door, and the west mooring post is at (10, 6), so the north quay's west end isn't sealed off. The fountain's bronze fish is its second look (the fish sits on the solid fountain). In part 1, the Woman with Watering Can stands at (24, 6) and the bay tree at (2, 5), so the house doors behind them can be reached; the clock face's middle column is the tower door's hotspot, and the clock is looked at from either side. Wading into the flooded end of the south quay gives the design's first and second looks, on the first and second wades.
- **The lamp room** plays `harbor` muffled ("harbor, quieter"). The Harbor and Bilge have gulls (and the Harbor wind); gulls fly over the Harbor now and then.
- **The end card** matches the opening's: the title over "End of Act 2. / Downstairs continues soon." Cheryl is saved standing at (10, 18) beside the open step.
- **Lines added for states the design doesn't cover:** the Bilge cat; the harbor water west of the sea view; the lighthouse from below; the cliff behind the Harbor; the yard wall, the bay tree, the lamps and the view on Lamp Street; the tower door with the crowbar; the piano and the crowbar, the piano in the Square with soap, the shop hat display with Cheryl's hat; the Woman with Basin's doorstep.

## Art and audio

**Stand-ins (part 2), until the art task's pieces land:** the Goat Path's terrain (sea-cave sand for the path, potted herbs for the bean terraces, sea-cave rock for the cliffs, plain sea for the cove, the sea-cave interior's mouth tile for the cave in the cliff), Mott's shack (a plain ochre house), the empty jugs (crates), the goats (the cat, whitewashed), the Harbor's quay edge (the canal bank) and its Keyhole (Act 5's, with the anchor chain), and the Bilge's fish stalls (the Square's market stalls). Requested from the art task.

The Harbor, lamp room, and Bilge use art made for later acts in their normal state: `mott` and `mott_jug`, `boatman:rock`/`sing`, `fishmonger`, `keeper:polish_up`, `lamproom`, `lighthouse`, `harbor_props`, `ferry_level`, `sea`, `canal`, `bilge_flood:flood1` (ankle-deep) and `wstairs_wet`, `reveal:wstairs_top`, `seacave`.

All of this part's art is the art task's (index: [docs/art-act2.md](../../../../docs/art-act2.md); modules `act2_npcs.js`, `act2_objects.js`, `act2_interiors.js`). Residents who sit or hold a pose (the Counting Woman on her step, Ambrose, the Tourist, the Mayor on his crate, the Man on Bench, the Woman with Watering Can, the Skipping Girls, the Woman with Basin) wear an animated pose frame and don't turn to talk; the Counting Woman and the Movers switch to their walking sheets when they leave. The Movers scrub crouched above the piano and run with `run_down`. The piano is `piano_front` wedged, `piano_slide` as it goes, `piano_back` in the Square's arch, and `piano_level` by the Fountain.

The scrape-mark frames are named `over_scrape_*` but belong under characters, so `tiles.js` aliases them as `scrape_a`/`scrape_b` on the detail layer; `npm run check` warns about them until the art task renames the frames.

Audio is the audio task's, called by id: music `neighborhood` (the Shop muffled) and `archive`; the `discovery` cue; `knock`, `shop_bell`, `stone_scrape`, `slab_lift`, `piano_slide`, `scrub`, `skip_rope`, `sink_gurgle`, `well_breath`; loops `town` (Lamp Street and the Square), `clock_tick` (the Crown), `trickle`, and `door_hum` (beside the Founders' Door). Part 2: music `harbor` (muffled in the lamp room); `goat`, `gull`, `boatman_sing`, `step_splash` (the flooded quay); loops `canal`, `gulls`, `wind`, `goats`.
