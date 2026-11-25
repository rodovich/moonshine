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

- Arriving on Lamp Street from the opening: `?map=lamp_street&x=3&y=1&facing=down&items=moon_chart,soap`
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
- **There's room past the Counting Woman, and the game says so:** after her first talk, "She's planted on the edge of the landing like a bollard. There's just room to squeeze past her.", and the look at her step ends "There's just room to get past her, if I mind her feet." (Playtest: she read as a gate.)
- **NPC looks come first.** Characters have one interaction, so each Look line from the design plays once, in Cheryl's voice, before that character's first talk.
- **The hollow step is reached by walking onto the landing's edge above it**, facing down: it's walkable (it's flush with the landing), so a keyboard player can't turn to face it without stepping. The Kid's crossing tile (10, 19) is the hotspot while the Counting Woman sits on (9, 19); both tiles after she leaves.
- **Once open, the hundredth step is the east half of the step, (10, 19): an exit that asks "Go down?" when Cheryl walks onto it** ("Not yet" steps her back), with a hotspot there too, so looking at it from beside it or clicking it asks the same. Its west half, (9, 19), is an ordinary stair, so the Steps stay open between Lamp Street and the Square for the rest of the game. (The first version's walk-on trigger over both tiles cut the Steps in half; the second, a solid hole you had to look at, meant walking into it did nothing, which playtesters tried first. The engine now routes clicks round open exits, so an exit works.)
- **The Kid is solid, and his lap keeps clear of the one way past the Counting Woman.** While she sits on (9, 19), the only way through is (10, 19) then (10, 20), so his lap runs from (10, 21) down to landing 3 and back, and Cheryl goes by on the flight's free west column; once she's gone he runs up to landing 2 again. After the step opens, (9, 19) is the only way past the hole, so his lap stops at (10, 20). (A non-solid Kid could end up on Cheryl's tile, or on the hollow step's hotspot, and then couldn't be talked to.) People come first in the Steps' entity list, so on a shared tile the person answers, not the hotspot.
- **The piano slide:** "Stand back, Miss" moves Cheryl to (11, 38); the Movers scrub either side of the piano (two beats, the piano jiggles), brace above it, and it shoots down through the arch. They run after it; the crowbar is left at (9, 40).
- **In Fountain Square the piano rests against the Fountain's east rim** at (14–15, 8–9), with the Movers beside it at (16, 8) and (15, 10). On the north rim the bronze fish, drawn two tiles tall, stood right across its keys.
- **The Tourist sits at (19, 14)**, facing her table at (18–19, 13); the design's (20, 14) faced the gap between the two tables.
- **The bench on Lamp Street is at (20–21, 11)**, and the Man on Bench sits on its west end, (20, 11).
- **The Skipping Girls stand at (10–12, 6)**, two turners and the jumper between them, with the rope over all three (the design spread them over x10–14).
- **The Woman with Basin's door is at (7, 15)** and she stands at (7, 16): the trickle art runs west to east along a row, so her water runs along landing 2's lower edge (row 18) from x7 and slips into the joint at (10, 18), above the hollow step.
- **The Clockmaker's shop door is at x12**; its painted clock and window of clocks take x10–11.
- **The yard gate is one tile (x12)**, open.
- **The Counting Woman's march** goes down flight 3, along landing 3, down flight 4, and out through the arch. If the piano were still there she'd climb over it with the Movers' exchange (the camera pans down to watch); in part 1 that can't happen, because the guidebook comes from the Square, which needs the piano gone. Part 2 makes that order possible: by the long way round, the guidebook can come first, and she climbs over the piano while the Movers protest.
- **The Counting Woman in the Square** has a guidebook line of her own ("I've READ it, thank you...").
- **With the long way open, the blocked arch says so:** "I'm not climbing over a piano that isn't mine. The Goat Path goes round the long way." (The writer's age-free line, from client feedback that Cheryl must read as a vigorous late-50s woman.)
- **Wrongness is 0.1 in Act 2** (story bible: "about 0.1 after Act 1"). Every Act 2 map sets it on entry while `act2.done` isn't set, so later acts' levels win once Act 2 is over.
- **Part 2 placements:** the Lighthouse Keeper polishes the lamp from (4, 4), facing it (the art's `polish_up`), rather than from (5, 3) facing left. Mott sits on the middle bollard at (13, 8) with his jug; he takes a swig every so often, and when shown the moon chart. The Boatman's boat is part of his sprite at (14–15, 9). The Bilge's fish stalls reuse the Square's market stall. The Fishmonger stands at (4, 4), between her stalls and in front of her own door, and the west mooring post is at (10, 6), so the north quay's west end isn't sealed off. The fountain's bronze fish is its second look (the fish sits on the solid fountain). In part 1, the Woman with Watering Can stands at (27, 5), beside her pots at (24, 5) and (26, 5) (not under one) and the bay tree at (2, 5), so the house doors behind them can be reached; the clock face's middle column is the tower door's hotspot, and the clock is looked at from either side. Wading into the flooded end of the south quay gives the design's first and second looks, on the first and second wades.
- **The lamp room** plays `harbor` muffled ("harbor, quieter"). The Harbor and Bilge have gulls (and the Harbor wind); gulls fly over the Harbor now and then.
- **The end card** matches the opening's: the title over "End of Act 2. / Downstairs continues soon." Cheryl is saved standing at (10, 18) beside the open step.
- **Lines added after the playtest:** the shop window's hat once Cheryl's own hat has left the wardrobe ("...I have a perfectly good hat in my bag." / "...Mine is out in the Square on a tourist, and it suits her."); the Crown's east bench ("The other bench. Same view, no cat. The cat has made its choice."); the Harbor's nets; Cheryl's thought after Mott turns down the moon chart ("Not today, he says. So some other day. I'll hold him to that."). The Mayor now asks "did you show her a guidebook?", since Cheryl keeps it.
- **Lines added for states the design doesn't cover:** the Bilge cat; the harbor water west of the sea view; the lighthouse from below; the cliff behind the Harbor; the yard wall, the bay tree, the lamps and the view on Lamp Street; the tower door with the crowbar; the piano and the crowbar, the piano in the Square with soap, the shop hat display with Cheryl's hat; the Woman with Basin's doorstep.

## The structure pass

After the client played to Act 4, Act 2 was restructured ([docs/design/structure-pass.md](../../../../docs/design/structure-pass.md), sections 3 to 5, which win over 02-city.md where they differ). As built:

- **Three required threads.** The piano (soap, crowbar) is unchanged. **The guidebook** now comes through a chain: the Shopkeeper names what would fill the window's gap ("Something brass. Something nautical."); the Tourist and Mott point east; the Lighthouse Keeper hands over her telescope (on the second talk, or on the first if Cheryl has already looked at it under its dust sheet at (6, 5)); the Shopkeeper won't touch the window ("Curating is hands-off"), so Cheryl uses the telescope on the window display herself and gets the straw hat (`shop_hat`); the Tourist trades the straw hat for the guidebook. **The Tide-Sheet:** the Man on Bench can't read without his glasses; his wife has them in her hair (her first-meet description says so, and the Third Girl hints once he's been met); talking to her after he's met makes her walk to the bench, put them on his nose, and he gives Cheryl the Tide-Sheet.
- **The Counting Woman needs both printed sources,** in either order. The first gets a reaction that names the other; she keeps the Tide-Sheet "as EVIDENCE"; the guidebook stays with Cheryl. The second sends her storming off (over the piano if it's still there). Then the camera comes back up to her step, the Woman with Basin tips, the water vanishes into it, and Cheryl says "Steps don't drink." (`step.found`).
- **Signposting:** walking onto the free hollow step goes bonk (`step_bonk`; the first time, "Bonk." / "The Kid was right."); the Kid's line after she's gone points at her step; in the Square, her repeat and the Mayor's point back to it.
- **Rubbings:** Ottilie's handover and repeat say "floors, where the light falls"; paper and charcoal on the sundial, the bell tower, the Fountain, the mooring posts and the Water Stairs answer "Old, but not Founder-old. And Ottilie said floors."; the Founders' Door answers "Rubbed to a shine."
- **Cheryl's own hat is retired** in Act 2's files: no handler uses `hat`. The Shop window shows the telescope after the swap; `shop_hat` has its own declines. Old saves: `content.migrate` (act2/common.js, `migrateAct2`) takes `hat` out of the bag unless the Tourist already has it, and gives a save past the old hat trade `window.telescope` and `telescope.migrated`, so Act 5's telescope chain works.
- **Geography:** the Goat Path is a 16 × 42 cliff path (`PATH` in goat_path.js): irregular switchbacks, rough steps where it's steep, Mott's shack and yard partway down, a hairpin viewpoint halfway, the sea cave mouth at the waterline, the lower town's roofs at eye level near the bottom. It's 129 steps top to bottom, about 26 seconds. Lamp Street's west gate arrives at its top right, facing left, and the way back is the east edge's rows 2–3 ((15, 1) is cliff, because the bag button covers that corner of the screen and a click there would open the bag), with "The Goat Path. Down the back of the island the long way. The Steps and then some, plus goats." the first time; its bottom leaves by the east edge onto the Bilge's flooded west end, and the Bilge's new west exit (0, 11–13) comes back up. The Harbor's goat stair is gone (`harborTopRows` draws rock there, so Act 5's risen Harbor follows); signs at the Bilge's east end and the Harbor's west end point between them.

New flags: `got.telescope`, `window.telescope`, `telescope.migrated`, `glasses.back`, `got.tideSheet`, `counter.sawBook`, `counter.sawPaper`. New items: `telescope`, `shop_hat` (Straw Hat), `tide_sheet` (Tide-Sheet; Look reads the letter).

Lines the build adds for the new states (the writer has them): the window with the telescope ("The Keeper's telescope, in pride of place. Looked at, not looked through. She'd approve."), the window before the swap once the Tourist is met ("Display stock. He'd let it go if something filled the gap..."), the Shopkeeper after the swap, Mott with the telescope, the telescope's description, the straw hat on the window, the Counting Woman in the Square shown the Tide-Sheet, the Mayor's "a guidebook and a letter", the Goat Path's viewpoint, views and roofs, and the two signs.

**Art and sound for the pass:** the Goat Path is the art task's painted cliff (`GOAT_PATH_TILES`, with gulls) and plays the `goatpath` loop; the Bilge's west stair (`bilge_west`), the signposts, the Harbor culvert, the dust sheet (`lamproom:scope_sheet_top/bot` on the detail layer, `sheet_empty` once taken), the Shop's `display_scope`, the glasses sprites, and the `telescope`, `shop_hat` and `tide_sheet` icons are all real; the telescope changing hands plays `telescope`.

**The boarded step:** from Act 4 on (`act4.started` or `epilogue`), the open hundredth step is boarded over in steps.js, flush and walkable (`steps_lid:boarded_l/_r`, chalked in the epilogue), with `step_bonk` underfoot and the writer's lines the first time Cheryl walks over it. steps.js owns it for every act, since it lasts across all of them. Between Act 2 and Act 4 it's still the hole with "Go down?". (Design: the client's rule that blockers must be earned; the writer's revision.)

**Other acts on the new path:** to keep main playable, this branch moved Act 4's Mott to the yard (2, 16), its sea cave exit to (1, 37) (back out at (2, 37)); Act 4 has since built on them.

## Art and audio

**Part 2's own art** is in `act2b_goat.js` (the Goat Path's terrain, cove and cave mouth, Mott's shack and jugs, the goats) and `act2b_harbor.js` (the Harbor's headland, Goat stair, quay edge and Keyhole; the Bilge's fish stalls); index in [docs/art-act2b.md](../../../../docs/art-act2b.md). The goats stop to eat now and then. There are no stand-ins left in Act 2.

The Harbor, lamp room, and Bilge use art made for later acts in their normal state: `mott` and `mott_jug`, `boatman:rock`/`sing`, `fishmonger`, `keeper:polish_up`, `lamproom`, `lighthouse`, `harbor_props`, `ferry_level`, `sea`, `canal`, `bilge_flood:flood1` (ankle-deep) and `wstairs_wet`, `reveal:wstairs_top`, `seacave`.

All of this part's art is the art task's (index: [docs/art-act2.md](../../../../docs/art-act2.md); modules `act2_npcs.js`, `act2_objects.js`, `act2_interiors.js`). Residents who sit or hold a pose (the Counting Woman on her step, Ambrose, the Tourist, the Mayor on his crate, the Man on Bench, the Woman with Watering Can, the Skipping Girls, the Woman with Basin) wear an animated pose frame and don't turn to talk; the Counting Woman and the Movers switch to their walking sheets when they leave. The Movers scrub crouched above the piano and run with `run_down`. The piano is `piano_front` wedged, `piano_slide` as it goes, `piano_back` in the Square's arch, and `piano_level` by the Fountain.

Audio is the audio task's, called by id: music `neighborhood` (the Shop muffled) and `archive`; the `discovery` cue; `knock`, `shop_bell`, `stone_scrape`, `slab_lift`, `piano_slide`, `scrub`, `skip_rope`, `sink_gurgle`, `well_breath`; loops `town` (Lamp Street and the Square), `clock_tick` (the Crown), `trickle`, and `door_hum` (beside the Founders' Door). Part 2: music `harbor` (muffled in the lamp room); `goat`, `gull`, `boatman_sing`, `step_splash` (the flooded quay); loops `canal`, `gulls`, `wind`, `goats`.
