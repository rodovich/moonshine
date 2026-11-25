# Art index: Act 4

Where to find the art for the "Art needed" list in [design/04-the-list.md](design/04-the-list.md) (on design/story-bible). References are `sheet:frame`; animated frames are listed by base name.

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
