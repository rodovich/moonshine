# Art index: Act 2, part 1

Where to find the art the Act 2 content needs (docs/design/02-city.md, Art needed), by the request's item numbers. References are `sheet:frame`.

## Characters

Module `game/src/art/act2_npcs.js` (16×32, bottom-centered). Walks use the engine's names: `<dir>_0` stands, `<dir>_1`/`<dir>_2` step. Poses are `<pose>_<dir>`, with `_0`/`_1` where they animate (durations are in the sheet). Same palette letters as `npcs.js`. See them all at `/dev/art.html?only=scene:act2_people`.

| # | Who | Frames | Notes |
| --- | --- | --- | --- |
| 1 | Counting Woman (civic sash) | `counting_woman:<dir>_0..2` (a march; arms swing on the down steps); `sit_down_0/1` (counting: she nods and her lips move, 700/500 ms); `climb_up_0/1` (back view, a knee high, then the other, rising 3 and 5 px: over the piano) | blue dress, gold sash |
| 2 | Big Mover, Other Mover | `mover:<dir>_0..2`; `idle_down_0/1`; `push_up_0/1` (shoving, back view, braced); `scrub_down_0/1`, `scrub_up_0/1` (crouched, hand rubbing left and right); `run_<dir>_0..3` (use `sprite.walk: [0, 1, 2, 3]` on the `run_` frames, or play them as an animation) | palettes `big` (navy overalls, terracotta cap) and `other` (moss overalls, grey cap, ginger beard) |
| 3 | Stranded Tourist | `tourist:down_0` (standing); `sit_up_0/1` (seated facing up at the café table, fanning with the guidebook); `sit_up_hat_0/1` (the same wearing Cheryl's straw hat, for `tourist.hasHat`) | sunburnt, ginger, a loud blue check shirt, khaki shorts |
| 4 | Mayor | `mayor:<dir>_0..2`; `gesture_down_0/1` (finger raised, then the arm sweeping out) | Drawn standing on the ground. On his crate, draw him with `offset: [0, -<crate height>]` (the crate's top is about 10 px above the floor; match it to `act2_props` when the crate lands) |
| 5 | Ambrose Tull | `ambrose:sit_down_0/1` (on the tower step with his ledger; frame 1 looks up and scowls, 2600/900 ms); `down_0` standing | big, old, white hair, brown coat, red ledger |
| 6 | Woman with Basin | `basin_woman:down_0` (holding the basin); `tip_down_0/1` (tipping: the water pours off the rim). Start the trickle overlay on frame 1 | |
| 7 | Skipping Girls | `girl:down_0`; `turn_right_0/1`, `turn_left_0/1` (turning: hand up, hand down); `jump_down_0` (in the air, 4 px up) / `jump_down_1` (landed); palettes `a`, `b`, `c` | Two turners stand two tiles apart facing each other: the left one plays `turn_right`, the right one `turn_left`; the jumper stands between them |
| 7 | The rope | `rope:rope_0..3` (48×32, 110 ms: over their heads, in front, on the ground, behind) | Draw with its top-left at the left turner's tile x (pixel x = tile × 16) and its bottom on the turners' feet line (y = feet − 32). Sync the jumper: up on frames 2–3 |
| 8 | Woman with Watering Can | `watering_woman:down_0`; `water_down_0/1` (the can tips; drops fall) | curls, sage dress. This is her plain sprite, once she has given the glasses back |
| 8 | …with her husband's glasses up in her hair (structure pass, the Tide-Sheet thread) | `watering_woman_glasses`: the same frames (`down_0`, `water_down_0/1`, `fall_down_0/1`) with thin gold reading glasses pushed up on her curls, drawn large (two lenses, each 4×3) with a gold glint star above the left one. It's an observation clue, so it has to read on a 16-px sprite | swap the sheet back to `watering_woman` when she returns them |
| 8 | Man on Bench | `bench_man:sit_down_0/1` (behind his newspaper; frame 1 turns the page) | Draw over the bench, feet on the floor tile in front. Without his glasses |
| 8 | …with his glasses on (structure pass) | `bench_man_glasses:sit_down_0/1` (the paper lowered so his face shows over it, the gold rims on his nose with his eyes behind them; frame 1 turns the page); standing `down_0` (paper folded under his arm); `look_down_0/1` (his head dipped, looking down over a rail; the glint crosses lenses on frame 1, 1600/600 ms); `fall_down_0/1` | Act 4: he stands in for the Man on Bridge, `bench_man_glasses:look_down` in place of `clockmaker@bridge:look_down` |

## Objects and tiles

Module `game/src/art/act2_objects.js`. See them composed at `/dev/art.html?only=scene:act2_street`.

| # | Piece | Frames | Layer |
| --- | --- | --- | --- |
| 10 | Icons | `items_act2:paper_charcoal`, `guidebook`, `crowbar` (light iron with a white gleam and no ink outline, so it reads on the navy bag panel) | inventory |
| SP | Structure-pass icons | `items_act2:telescope` (the Keeper's brass telescope, three drawn sections, its glass catching the light), `tide_sheet` (the island's paper folded in half: masthead, columns, a small picture), `shop_hat` (the Shop window's straw hat: wide brim, cobalt band, its coral price card still on). The guidebook now has a big gold shield crest with a white star, so "a proper BOOK, with a crest on" reads at icon size | inventory |
| 10 | Crowbar lying on the paving | `act2_props:crowbar_ground` (2 frames: a glint runs along it, 1400/160 ms) | sprite (16×16) or objects |
| 11 | The piano as one entity (32×32, bottom-centered) | `piano:piano_front` (wedged at an angle, as in the court), `piano_level` (standing level), `piano_slide_0/1` (tipping as it slides, 120 ms), `piano_back` (seen from behind and above, for the Fountain Square arch) | sprite |
| 12 | Water trickle across a landing | `act2_water:trickle_h` (4 frames; tiles chain along a row, west to east), ending in `trickle_end` (4 frames: the stream narrows and slips into the step's joint). Transparent overlays | objects |
| 13 | The piano's scrape marks along Lamp Street | `act2_marks:scrape_a`, `scrape_b`: transparent overlays on any paving; alternate a and b along a row and they join | objects |
| 14 | The Little School | sign band `school:school_sign_a`…`school_sign_d` (4 wall tiles reading LITTLE SCHOOL); `school_bellcote` (on the roof-front row); double doors `school_door_tl/tr` (wall row) over `school_door_bl/br` (base row). The rest of the facade is ordinary `buildings:` tiles. The `school` sheet has the same letters and plaster swaps as `buildings` (`ochre`, `rose`, `sky`, `white_sage`) | ground |
| 14 | School yard | paving `schoolyard:yard`, `yard_b`, `yard_c` (mix them); a chalked hopscotch `yard_hopscotch_n` over `yard_hopscotch_s` | ground |
| 14 | Low yard wall and gate | `schoolyard:yardwall` (east–west run), `yardwall_end_l/_r`, `yardwall_v` (running north–south), `yardwall_corner_w/_e` (an east–west run turning north); gate `yard_gate` (shut) / `yard_gate_open` | objects |
| 19 | The Clockmaker's shop front | fascia with a painted clock `school:clockshop_fascia_l/_r` (wall row); a window full of clocks `clockshop_window_l/_r` (base row); door from `buildings:door_top/door_bot`. Shown with `@ochre` | ground |
| 19 | Hanging clock sign | `act2_props:clock_sign`, over a wall tile beside the shop | objects |
| 19 | The Crown's south parapet with a stair cut | `crown_parapet:parapet` (run), `parapet_end_l` (ends with a newel post, cut to the east), `parapet_end_r` (post, cut to the west); put `street:stairs_l`, `stairs`, `stairs_r` in the cut, and the terrace face below (`street:retain`, `retain_base`) | objects (parapet), ground |
| 20 | Rope barrier (CANAL CLEANING. KEEP OUT.) | `act2_props:rope_l`, `rope_m`, `rope_r` (3 wide: posts and a sagging red rope with a hanging sign plate; the text is for the description, not legible) | objects |
| 20 | The Goat Path gate | `act2_props:goat_gate` (a shut wooden field gate tied with a rope loop), in a gap at Lamp Street's west edge | objects |

## Interiors and the Square

Module `game/src/art/act2_interiors.js`. On the dev page: `/dev/art.html?only=scene:act2_rooms&state=archive` (or `crypt`, `shop`, `square`).

| # | Piece | Frame(s) | Layer |
| --- | --- | --- | --- |
| 15 | Market stall (2×2) | canopy `square_props:over_stall_nw`, `over_stall_ne` (top row); counter with lemons, onions and Moonshine basins `stall_sw`, `stall_se` (bottom row) | overhead; objects |
| 15 | Café table and chairs | `square_props:cafe_table`; `cafe_chair` (facing the viewer, empty); `cafe_chair_back` (seen from behind: put it under a sitter who faces up, like the Tourist at (20,14)) | objects |
| 15 | The Mayor's crate | `square_props:mayor_crate`. Its lid is 10 px above the floor, so draw the Mayor 9 px higher than normal (sprite `offset: [0, -9]`) | objects |
| 15 | Brass plaque | `square_props:plaque`, over the wall tile beside the Mayor's door | objects |
| 16 | Archive floor | `archive:floor`, `floor_b` (limestone set on the diagonal with cobalt keys) | ground |
| 16 | Archive walls | top of the north wall `archive:wall_cap` (`_w`, `_e` at the corners); its face `wall_face_upper` (cobalt frieze) and `wall_face_lower` (stone dado and skirting), with `_w` / `_e` corners; sides `wall_w`, `wall_e`; south `wall_s`, `wall_s_w`, `wall_s_e`; door to the Crown (7–8, 13) `door_l`, `door_r` | ground |
| 16 | Curved wall bookcases (1–4 and 11–14, rows 1–2) | `archive_furniture:wallshelf_top_a` … `_d` on row 1, `wallshelf_bot_a` … `_d` on row 2 (a–d left to right; the outer ends turn away into the round room) | ground |
| 16 | Freestanding shelves (2×1) | `archive_furniture:shelf_free_l`, `shelf_free_r` | objects |
| 16 | Ottilie's desk with seven cold cups (7–8, 5) | `archive_furniture:desk_l`, `desk_r` | objects |
| 16 | High windows (7–8, rows 1–2) | `archive:window_nw`, `window_ne`, `window_sw`, `window_se` | ground |
| 16 | Pooled light on the floor (removable) | `archive:pool_nw`, `pool_n`, `pool_ne`, `pool_sw`, `pool_s`, `pool_se` (opaque lit-floor tiles: lay them over the floor and take them away at night). The scene puts a 4×2 pool at (6–9, 6–7) | objects |
| 16 | The Eye (7–8, 8–9) | `archive:eye_nw`, `eye_ne`, `eye_sw`, `eye_se` (thick glass in a stone ring, dark beneath, one highlight) | ground |
| 16 | The teapot (7, 8) | `archive_furniture:teapot` (white, cobalt flowers), drawn on the Eye | objects |
| 16 | Stair down to the crypt (13, 11) | `archive:stair_down` | ground |
| 17 | Crypt floor and walls | `crypt:floor`, `floor_b`; north wall top `wall_cap`, face `wall_face` (row 1) and `wall_face_lower` (row 2); sides `wall_w`, `wall_e`; south `wall_s`. The Founders' Door is `founders_door:founders_door_x0y0` … `_x1y1` at (5–6, 1–2) | ground |
| 17 | Crates of records | `archive_furniture:crate` (1×1); a stack two rows tall, `crate_stack_top` over `crate_stack_bot` (1–2 and 8, rows 1–2) | objects |
| 17 | Lectern with the monograph (3, 3) | `archive_furniture:lectern` | objects |
| 17 | Stair up to the Archive (1, 5) | `crypt:stair_up` | ground |
| 18 | Shop floor | `shop:floor` (wooden planks). The walls are the flat's: `interior:wall_upper` (row 0), `wall_lower`, sides, south, `door` | ground |
| 18 | Shelves of lanterns, lamp oil, brass polish and string (1–4 and 7–8, row 1) | `shop:shelving_a` … `_d` (4 wide), `shelving_e`, `shelving_f` (2 wide) | ground |
| 18 | Counter (2–6, 3) | `shop:counter_l`, `counter_m` (repeat; it has the shop bell), `counter_r` | objects |
| 18 | Marble jar (1, 5), every marble on the east side | `shop:marble_jar` | objects |
| 18 | Window display with the straw hat (7–8, 5) | `shop:display_l`, `display_r` (the hat matches `items2:hat`) | objects |
| SP | Window display with the Keeper's telescope (7–8, 5), Acts 2 and 4, after the swap | `shop:display_scope_l`, `display_scope_r`: the same stand, the brass telescope on two little wooden cradles angled up toward the window, no price card (it's curated, not for sale). Act 5's fallen state is `shop5:display_fallen_l/r` (see [art-act5.md](art-act5.md)) | objects |
| SP | The lamp room's telescope under its dust sheet, facing the wall (6, 4–5) | `lamproom:scope_sheet_bot` at (6, 5) and `scope_sheet_top` at (6, 4): a shrouded shape on a tripod leaning toward the north wall, iron legs and brass feet below the hem, the brass eyepiece poking out toward the room. Put the top tile on the overhead layer if (6, 4) is walkable. Once it's taken, `lamproom:sheet_empty` at (6, 5) (the sheet in a heap) and nothing at (6, 4). Module `act5_surface.js` | objects (top: overhead or objects) |
| 18 | Barometer, stuck on FAIR | `shop:barometer`, hung on the wall over (7, 0) because the shelves fill row 1 | objects |
