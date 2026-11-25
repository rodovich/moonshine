# Art index: Act 4

Where to find the art for the "Art needed" list in [design/04-the-list.md](design/04-the-list.md) (on design/story-bible). References are `sheet:frame`; animated frames are listed by base name.

## Surface

Module `game/src/art/act4_surface.js`. Composed on the dev page: `/dev/art.html?only=scene:act4_surface&state=belfry|square|bilge1|bilge2|dry|dry_lit|cellar` (`dry` is the `bilge_dry` map; `dry_lit` shows the moon-lock charged).

### Belfry (10 × 10)

| Piece | Frames | Layer, placement |
| --- | --- | --- |
| North wall, upper / lower row | `belfry:wall_upper` (row 0), `wall_lower` (row 1) | ground |
| Belfry openings with louvres and sky | `belfry:opening` (row 1 at x1, 3, 6, 8) | ground |
| Side walls, south wall | `belfry:wall_side`, `wall_south` | ground |
| Plank floor | `belfry:floor_a`, `floor_b`, `floor_c` (pick by a hash) | ground |
| The rope hole (4, 5) | `belfry:floor_hole` | ground |
| The stair down (1–2, 8) | `belfry:stair_l`, `stair_r` | ground |
| The great bell over (3–4, 2–3) | `belfry_bell:over_bell_x<0-1>y<0-1>_<n>`: `_0` still, `_1` swung west, `_2` swung east (play 0, 1, 0, 2 for a stroke) | overhead |
| The Clockmaker's drive (6–7, 3–4), ticking / lifted and stopped | `belfry_props:drive_x<0-1>y<0-1>` (3 frames, 330 ms) / `drive_lifted_x<0-1>y<0-1>` | objects |
| DO NOT TOUCH lever with its card (8, 4) | `belfry_props:lever_up`, `lever_pulled` | objects |
| The old bell rope (4, 4) down into the hole (4, 5) | `belfry_rope:rope_still`, `rope_swing` (4 frames), `rope_run` (4 frames, running down through the floor for each stroke); 16×32 sprite, anchored bottom-centre on (4, 5) | sprite |
| The workbench with tools and stacked letters (1–2, 6) | `belfry_props:bench_l`, `bench_r` | objects |

### Fountain Square, Act 4

| Piece | Frames | Layer, placement |
| --- | --- | --- |
| The dry basin full of coins and buttons, hatch closed, with the step-over in the south rim at (11–12, 10) | `square4:fountain_coins_closed_x<0-3>y<0-3>` on (10–13, 7–10), replacing `fountain:fountain_dry_*` | objects |
| The same with the bronze ring hatch open onto a ladder at (11–12, 8) | `square4:fountain_coins_open_x<0-3>y<0-3>` | objects |
| The bronze fish (11–12, 7) | `fish:fish_dry` (landmarks), feet at the bottom of row 7 | sprite |
| The cordon: posts at (9, 6), (14, 6), (9, 11), (14, 11) | `square4:cordon_post` | objects |
| Rope between the posts | `square4:cordon_rope_h` (rows 6 and 11), `cordon_rope_v` (columns 9 and 14); the PENDING AN INQUIRY sign hangs from `cordon_rope_sign` on the south rope | objects |
| The Fountain flowing again over the closed hatch | the existing `fountain:fountain_x<c>y<r>` (animated) | objects |

### The Bilge (32 × 16)

| Piece | Frames | Layer, placement |
| --- | --- | --- |
| Flooded paving, stage 1 (ankle-deep: the stone shows, water in the joints) | `bilge_flood:flood1_<q>` (4 frames, 280 ms), `<q>` = the paving quadrant (`nw` on even x and y, `ne` odd x, `sw` odd y, `se` both odd) | ground |
| Flooded paving, stage 2 (deeper) | `bilge_flood:flood2_<q>` (4 frames) | ground |
| Water lapping onto the dry paving next to a flood | `bilge_flood:flood<1-2>_lap_w` (flood to the west), `_lap_n`, `_lap_s` (4 frames) on the dry tile | objects |
| The Water Stairs' top steps (22–25, 6) | `reveal:wstairs_top_l`, `wstairs_top_m` (×2), `wstairs_top_r` | ground |
| The flight going under water (22–25, 7), flood stages | `bilge_flood:wstairs_wet_l/m/r` | ground |
| The piano half-sunk, lid up (6–7, 8–9), stage 1 | `bilge_piano:piano_halfsunk` (32×32) | sprite |
| Just its lid showing, stage 2 | `bilge_piano:piano_lid` | sprite |
| **Dry (`bilge_dry`, 32 × 17):** the trench rows. Every trench row is cut from two continuous 64-px strips, so blocks, weed, and barnacle crusts run across tile seams: **use variant `a`…`h` by `x % 8`** in every row | row 7 the old limestone quay wall, ending in a crisp lime tide line: `reveal:qwall_<v>`; rows 8–9 the Founder hull (dark fitted slate, chamfered blocks, weed hanging from the tide line, barnacle crusts thickest at the foot): `hull_n_<v>` (row 8), `hull_s_<v>` (row 9); row 10 the mud bed (puddles holding the sky, shells): `mud_<v>`; row 11 the near quay's lip: `lip_<v>` | ground |
| **Dry:** the bridge (12–13, 7–11) spanning the ditch, its piers going down to the mud | deck `canal:bridge_n_l/r` (7), `bridge_down_*` (8), `bridge_n_*` (9), `bridge_up_*` (10), `bridge_s_*` (11); west pier on x11: `reveal:hull_n_pier_w` (8), `hull_s_pier_w` (9), `mud_pier_w` (10) (row 7 stays `qwall_d`); east pier and the bridge's shadow on x14: `qwall_pier_e` (7), `hull_n_pier_e` (8), `hull_s_pier_e` (9), `mud_pier_e` (10). The pier tiles are built on the variants at those columns (`d` at x11, `g` at x14) | ground |
| **Dry:** the Water Stairs (22–25, 6–9), four wide (`l`, `m`, `m`, `r`) | top step (6) `reveal:wstairs_top_<k>`; limestone flight through the quay wall (7) `wstairs_<k>`; slate flight through the hull, barnacled, the tide line across it (8) `wstairs_slate_<k>`; the broken last flight ending in a jagged drop to the mud (9) `wstairs_broken_<k>` | ground |
| **Dry:** the bronze door (26–27, 8–9), set into the hull rows: Founder work, square with chamfered corners, bronze gone green under barnacle crusts, a moon-lock eye in the middle | `reveal_door:bronze_door_x<0-1>y<0-1>` (eye dark); charged: `bronze_door_x<0-1>y<0-1>_lit` (the eye in `relic_cyan`, which the engine keeps bright under tints) | ground |
| **Dry:** taut mooring ropes from the quay down to the boats | `reveal:rope_taut_v`, `rope_taut_se`, `rope_taut_sw` | objects |
| **Dry:** wet quay paving and stranded fish | `bilge_flood:wet_<q>`; `fish_stranded_a`, `fish_stranded_b` (the flopping fish is a sprite in "Sprites and icons") | ground; objects |
| **Dry:** boats on their sides in the mud, keels toward the camera, oars spilled, at (3–4, 10), (8–9, 10), (19–20, 10); the Boatman's boat upright at (22–23, 10) | `bilge_boats:boat_side_a` (blue), `boat_side_b` (coral, mirrored), `boat_side_c` (white); `boat_upright` (32×16, anchored bottom-centre on the boat's two tiles) | sprite |
| **Dry:** the piano on the mud, upright, lid open (15–16, 10) | `bilge_piano:piano_mud` | sprite |

### Ice Cellar (10 × 8)

| Piece | Frames | Layer, placement |
| --- | --- | --- |
| Walls (north upper / lower rows, sides, south), floor | `ice_cellar:wall_upper`, `wall_lower`, `wall_side`, `wall_south`; `floor_a`, `floor_b`, `floor_c` | ground |
| The wooden stair up (6–7, 1) to the door with daylight under it (row 0) | `ice_cellar:stair_top_l/r` (row 0), `stair_l/r` (row 1) | ground |
| The hatch (2, 6): shut under its slab / slab shoved aside | `ice_cellar:hatch_shut`, `hatch_open` | ground |
| Hanging fish on hooks (row 1 marks; drawn on the upper row) | `ice_cellar_props:fish_hanging` | objects |
| Ice blocks in sawdust (1–2, 3–4) and (7–8, 3–4) | `ice_cellar_props:ice_x<0-1>y<0-1>` (2×2) | objects |
| Crates (8, 4) | `ice_cellar_props:crate_fish` | objects |

## Sprites and icons

Modules: `act4_sprites.js` (new), plus new frames in `act2_npcs.js` and `cheryl.js` (existing frames unchanged). Walks use the engine's names (`<dir>_0` stands, `_1`/`_2` step). On the dev page: `/dev/art.html?only=scene:act4_people`.

| Design | Frame(s) |
| --- | --- |
| The Clockmaker: standing in a doorway | `clockmaker:down_0` (walks `<dir>_0..2`) |
| The Clockmaker: running | `clockmaker:run_left_0/1`, `run_right_0/1`, `run_down_0/1` (play as a separate animation, or swap in with `setSprite`) |
| The Clockmaker: crouching over the sundial with his loupe | `clockmaker:crouch_right_0/1` (facing east; `crouch_left_*` facing west) |
| The Clockmaker arguing back | `clockmaker:argue_left_0/1`, `argue_right_0/1` |
| The Mayor arguing | `mayor:argue_left_0/1`, `argue_right_0/1` (new in `act2_npcs.js`) |
| Man on Bridge, looking down | `clockmaker` sheet with palette `bridge`: `look_down_0/1` (idle), `down_0` (no loupe in this swap) |
| Ambrose: standing; climbing the stairs | `ambrose:down_0..2`, `up_0..2` (new) |
| Ambrose: pulling the bell rope | `ambrose:ring_up_0` (hands high), `ring_up_1` (hauling down), `ring_up_2` (lifted on the upswing); seen from behind, with the rope in the frame above his hands |
| Ambrose: holding out the ledger | `ambrose:ledger_down` |
| Mott: sitting sober on the crates | `mott:sit_down_0/1`. His seat is about 8 px up, so draw him with `offset [0, -8]` on the crates |
| Mott: walking with the coil | `mott:coil_<dir>_0..2`; without it `mott:<dir>_0..2` |
| Movers on the mud, looking up | `mover:lookup_down` (`@big`, `@other`; new) |
| Crabs | `critters:crab_walk_0/1` (sideways), `crab_idle_0/1` (claws up) |
| A flopping fish | `critters:fish_flop_0/1` |
| The Kid running on mud | his run (`sweaty_kid:<dir>_1..4`) with `critters:mud_splash_0/1` at his feet |
| Cheryl: climbing a ladder | `cheryl:climb_up_0/1` |
| Cheryl: heaving on a valve | `cheryl:wheel_up_0/1` (hands on the rim, one high, one low, then swapped) |
| Cheryl: shoving a slab overhead | `cheryl:shove_up_0/1` |
| The teacup (Cheryl's flat) | `act4_props:teacup` (objects layer, on a table) |
| Copper coil and square jug icons | `items_act4:copper_coil`, `items_act4:square_jug` |

### The Boatman

Boat and man are one 32×32 sprite (`act4_sprites.js`), so he reads as part of the boat: draw it bottom-centered on the boat's 2×1 tiles (x = the boat's right tile × 16, y = the row below the boat × 16). Bald, a ring of white hair, a neat white moustache, a navy-and-cream striped jersey; the near gunwale hides his waist. The frame's bottom three rows are a strip of water or mud under the hull.

| Use | Frames |
| --- | --- |
| Afloat in the wet Bilge (Act 2, Act 4 floods) | `boatman:rock` (4 frames, 450 ms, gentle bob and lean); singing `boatman:sing` (2 frames, chin up, mouth open) |
| Beached on the dry canal, very upright (Act 4 dry, Act 5) at (22–23, 10) | `boatman_mud:mud` (2 frames: a long hold, then a moustache twitch); singing `boatman_mud:sing` |
| Act 5: the bucket | `boatman_mud:pour_0` (bucket raised over the boat), `pour_1` (tipping, water pouring in) |
| Act 5: "AFLOAT!" | `boatman_mud:afloat` (2 frames: arms up, beaming, a little hop) |
| The singing note | `note_bubble:note` (16×16, 4 frames: pops in, holds, fades, gone; 120/1200/300/200 ms). Draw it bottom-centered about 30 px above his feet line, a little left of center, and move it up a few px per frame while it plays |

## Underground

Module `game/src/art/act4_under.js`. Composed on the dev page: `/dev/art.html?only=scene:act4_under` with `&state=` `pumphall` (asleep, the Middle Sister's throat empty), `pumphall_run`, `pumphall_burst`, `wheel`, `wheel_turn`, `shaft`, `cave`, `cave_turn`. Multi-tile pieces are named `<name>_x<col>y<row>`, with `_<frame>` for animated ones.

| Design item | Frame(s) | Layer, placement |
| --- | --- | --- |
| The Three Sisters (beam pumps) | `sisters:stout_<state>_x<col>y<row>` (3 wide), `thin_<state>_x0y<row>` (1 wide), `middle_<state>_x<col>y<row>` (2 wide). States: `sleep` (still), `cough` (3 frames: a lamp flicker and a puff of steam), `run` (4 frames: the beam rocking and the flywheel turning). Each is drawn 3 tiles tall: row y0 stands in front of the north wall's lower face (map y2), and rows y1–y2 are the solid footprint the map gives (y3–4). Stout at x5–7, Thin at x11, Middle at x16–17 | objects |
| The Middle Sister's throat | empty socket: `sisters:middle_empty_x<col>y<row>` (asleep); with the copper fitted: the `middle_sleep`, `middle_cough`, `middle_run` frames | objects |
| Wake-valves (6,5), (11,5), (16,5) | `sisters:wake_shut`, `wake_open` (its tell-tale lit amber), `wake_turn` (2 frames, while turning) | objects |
| The drive shaft along the top of the north wall (x3–24, y1) | `sisters:over_shaft` (4 frames, turning) / `over_shaft_still`; a bearing bracket every few tiles: `over_shaft_bearing` (4 frames) / `over_shaft_bearing_still`; where it leaves the west wall: `over_shaft_end_w` | overhead |
| Cell grates (2 wide, y9) | `pumphall:grate_<state>_l` / `_r`: `full` (2 frames: dark water just under the bars, a faint cyan glint), `drain` (3 frames: the level dropping, with a swirl), `dry`, `burst` (4 frames: the surge thrown up through the bars) | ground |
| Spreading floodwater | `pumphall:flood_film` (a thin skin over the plates, 4 frames), `flood` (deep, 4 frames), and the advancing front `flood_edge_n` / `_s` / `_e` / `_w` (4 frames; the letter names the dry side) | ground |
| Emergency rungs and hatch (22, 1–2) | upper wall row: `pumphall:erung_top_shut` (a wave and an up-arrow on the lid), `erung_top_bang` (3 frames: jumping on its hinge, spray at the gap), `erung_top_open`; lower row: `erung_bot` | ground |
| The ladder up to the Fountain (2, 1–2) | `hull:ladder_top`, `ladder_bot` | ground |
| The Tide Wheel (4–7, 3–8) | `tidewheel:wheel_x<col>y<row>` (still) / `wheel_turn_x<col>y<row>` (4 frames), 4 × 6: drawn face-on so it reads as a wheel (bronze rim and spokes, slate paddles, the amber axle housing); its foot stands in the channel in the piece's bottom two rows | objects |
| The channel | `tide_channel:chan_slack` / `chan_rush` (4 frames each), with stone edges `chan_slack_w` / `_e` and `chan_rush_w` / `_e` | ground |
| The grate to the sea cave (10, 5) | `tide_channel:day_grate` (bronze bars on daylight, light spilling onto the floor) | ground |
| Emergency Shaft rungs (x2–3, y1–28) | `eshaft:rungs_l` / `_r`; lower down (sea level, wet and barnacled) `rungs_wet_l` / `_r`; higher up `rungs_dry_l` / `_r`; near the top, catching light from the slab, `rungs_light_l` / `_r`; the bottom row `rungs_foot_l` / `_r` | ground |
| The shaft's sides (x1, x4) | `eshaft:side_l`, `side_r`; wet lower down: `side_wet_l` / `_r` | ground |
| The slab at the top (2–3, 0) | `eshaft:slab_l` / `_r` (shut, daylight round its edge), `slab_open_l` / `_r` (shoved aside) | ground |
| Sea Cave rock and floor | `seacave:rock` (mass), `rock_face_a` / `_b` (the north wall face, weed and the tide line at its foot), `rock_edge_e` / `_w` / `_n` (inner edges), `sand`, `sand_b`, `sand_shells`, `sand_wet` | ground |
| The tide pool (2–3, 3) | `seacave:pool_l` / `_r` (3 frames; a brass screw glints in it) | ground |
| The mouth (4–5, 7) | `seacave:mouth_l` / `_r` (3 frames: daylight and foam) | ground |
| The Founder grate (4–5, 1) | `seagrate:fgrate_l` / `_r` (still: the wheel's rim behind the bars) / `fgrate_turn_l` / `_r` (3 frames: paddles passing, amber flickering through) | ground |

No palette colors were added for the underground.
