# Art index: the opening slice

Where to find the art for each object in [design/01-opening.md](design/01-opening.md). References are `sheet:frame` (the module is under `game/src/art/`). "Layer" is the map layer, or "sprite" for an entity. Animated frames are listed by their base name (`water` means `water_0`, `water_1`, …). See the composed maps on the dev page: `/dev/art.html?only=scene:court`, `scene:flat`, `scene:vista` (add `&state=morning` or `&tint=night`).

Rules for all of it are in [art-direction.md](art-direction.md).

## Tints

`game/src/art/tints.js` exports `TINTS.dusk`, `TINTS.night`, `TINTS.day`, each `{ color, amount, mode }` for `g.tint(color, amount, seconds, mode)`. Cistern Court opens under dusk; the cut back to the roof in the moonrise is night; the morning is day. The flat uses dusk, then day.

## Cistern Court

Modules: `roof.js` (sheets `roof`, `tub`, `roof_props`, `laundry`) and `court.js` (`court`, `facade`, `court_props`, `court_tree`, `court_well`). Facade walls and windows reuse `buildings:` tiles (Cheryl's side in the base palette, the Neighbor's `@white_sage`).

| Design | Frame(s) | Layer |
| --- | --- | --- |
| `~` backdrop | `roof:backdrop_house`, `backdrop_house_window`, `backdrop_eave`, `backdrop_crown`, `backdrop_crown_buttress` | ground |
| `=` north parapet | `roof:parapet_n`; corners `parapet_nw`, `parapet_ne` | ground |
| `=` west / east parapets | `roof:parapet_w`, `parapet_e` | ground |
| `=` south roof edge | `roof:roof_edge_s`, `roof_edge_sw`, `roof_edge_se` | ground |
| `=` low wall (x9) | `roof:lowwall`; `lowwall_end_s` (y4), `lowwall_gap` (y5), `lowwall_end_n` (y6) | ground |
| `.` roof floor | `roof:roof_floor_{nw,ne,sw,se}` (2×2 block, like street paving); `roof_floor_ne_patch`, `roof_floor_sw_cracked` | ground |
| `C` chimney (7–8, 2) | `roof:chimney_l/r`; pots and hats `over_chimney_l/r` on row 1; rattling `over_chimney_rattle_l/r` | ground; overhead |
| `h` herb pots | `roof_props:herb_basil`, `herb_rosemary` | objects |
| `k` chairs | `roof_props:chair_fold` (twice) | objects |
| `t` tap | `tub:tap`; running `tub:tap_running` | objects |
| `T` tub states | `tub:tub_empty_l/r`, `tub_plugged_l/r`, `tub_half_l/r`; animated `tub_filling_l/r`, `tub_full_l/r`, `tub_slosh_l/r`, `tub_whirl_wrong_l/r` (the drain flickers in Wrongness colors) | objects |
| `\|` clothesline posts | `laundry:post`; top `over_post_top_line` one row up | objects; overhead |
| `s` sheets on the N–S lines | `laundry:over_line` (y3); `over_sheet_n`, `over_sheet_m`, `over_sheet_s` (y4–6, flutter) | overhead |
| Bare N–S lines (after the move) | `laundry:over_line` (y4–5), `over_line_s` (y6) | overhead |
| Back line, (11,1)–(18,1) | `laundry:backline_<state>_<a–h>_<n\|s>`: columns a–h are x11–18, `n` row 1, `s` row 2. States `sag`, `prop`, `one`, `two` (sheets going up one per beat), `sheets` (flutter), `swung` (the groan). `@grey` for the morning | objects |
| `D` doors (3 and 14, rows 10–11) | `facade:door_top`, `door_bot` (blue moon-eye studs in the step) `@dim`; the Neighbor's `@sage_dim` | ground |
| `#` `w` facade walls and windows (rows 10–11) | `buildings:` wall, window, and window-box tiles `@facade` (Cheryl's) and `@facade_sage` (the Neighbor's): the wall face a step dimmer than the roof above, so the drop reads. For lit windows at dusk and night use `@facade_lit` / `@facade_sage_lit` (warm glass) on a few of them. | ground |
| `^` outside stair (x7) | `court:stair_head` (y8), `stair_cut` (y9), `stair` (y10–11), `stair_foot` (y12) | ground |
| `,` cobbles | `court:cobble_a` … `cobble_e` (pick by a hash of the position so no pattern repeats), `cobble_drain` | ground |
| `#` court side walls | `court:court_wall_w`, `court_wall_e` | ground |
| `G` Pelletiers' gate | `court:gate_w` | ground |
| `L` `l` lemon tree | trunk `court_tree:lemon_trunk`; canopy `court_tree:over_lemon_{nw,n,ne,w,c,e,sw,s,se}` | objects; overhead |
| `c` chess table | `court_props:chess_plug`, `chess_pepper`, `chess_slid` | objects |
| `O` `g` stool, Gerald's chair | `court_props:stool`, `gerald_chair` | objects |
| `W` well (2×2) | `court_well:well_nw/ne/sw/se`; mist `fx_mist:mist` | objects |
| `o` `-` pots and hurdle | `court_tree:hurdle_l`, `hurdle_m`, `hurdle_r`; after the trade `flowerpot`, `flowerpot_kicked` | objects |
| `b` bench | `court_props:bench_l/r` | objects |
| `p` geraniums | `props:pot_geranium` | objects |
| The Pelletiers' cat | `props:cat` (sitting; tail flick and blink), at (17,19) at dusk and (12,12) in the morning | sprite |
| `P` piano (2×2) | top `court_props:over_piano_nw/ne` (overhead: someone standing north of it is behind it); bottom `piano_sw/se` | overhead; objects |
| `r` lower rooftops | row 24 `court:low_{flat,tiles}_edge(_l/_r)`; row 25 `low_{flat,tiles}(_l/_r)`, `low_flat_basin` | ground |
| `v` the Squeeze | `court:squeeze_top_l/r` (y24), `squeeze_l/r` (y25); morning `_scraped` variants | ground |

`game/dev/scene-court.js` composes the whole map; `?state=morning` shows the morning state.

## Cheryl's flat (`interior.js`)

| Design | Frame(s) | Layer |
| --- | --- | --- |
| `#` north wall, row 0 / row 1 | `interior:wall_upper`, `wall_lower`; corners `wall_upper_w`, `wall_upper_e`, `wall_lower_w`, `wall_lower_e` | ground |
| `#` west and east walls (rows 2–7) | `interior:wall_side_w`, `wall_side_e` | ground |
| `#` south wall (row 8) | `interior:wall_south`, `wall_south_w`, `wall_south_e` | ground |
| `.` floor | `interior:floor`, `floor_b`, `floor_c`; `floor_n` along row 2, `floor_w` along x1, `floor_nw` at (1,2) | ground |
| `W` window (5–6, 1) | `interior:window_l`, `window_r` on row 1; `window_top_l`, `window_top_r` on row 0 | ground |
| `D` door (5, 8) | `interior:door` | ground |
| `H` plug hook (6, 8) | `interior:wall_south_hook` | ground |
| `m` kitchen shelf | `furniture:shelf_l`, `shelf_r` | objects |
| `c` clock | `fittings:clock` | objects |
| `b` bookshelf | `furniture:bookshelf_l`, `bookshelf_r` | objects |
| `1` counter, with pepper mill / bare | `furniture:counter_l_mill` / `counter_l` | objects |
| `2` counter, with egg timer / bare | `furniture:counter_r_timer` / `counter_r` | objects |
| `S` stove | `fittings:stove` | objects |
| `B` bed (2×2) | `furniture:bed_nw`, `bed_ne`, `bed_sw`, `bed_se` | objects |
| `f` side table with the face-down photo | `furniture:side_table` | objects |
| `X` table, with moon chart / bare | `furniture:table_chart_l`, `table_chart_r` / `table_l`, `table_r` | objects |
| `k` chairs | `furniture:chair_l` at (3,4), `chair_r` at (6,4) | objects |
| `r` rug (3×2) | `rug:rug_nw`, `rug_nm`, `rug_ne`, `rug_sw`, `rug_sm`, `rug_se` | objects |
| `A` wardrobe (1×2) | `furniture:wardrobe_top`, `wardrobe_bot` | objects |
| `w` washstand, with soap / without | `fittings:washstand_soap` / `washstand` | objects |

## Characters (`cheryl.js`, `opening_npcs.js`)

Walks use the engine's names: `<dir>_0` stands, `<dir>_1`, `<dir>_2` step.

| Design | Frame(s) |
| --- | --- |
| Cheryl: walk and idle, 4 directions | `cheryl:<dir>_0..2`; blink `idle_<dir>` (2 frames) |
| Cheryl: reach / interact (up, side, down) | `cheryl:reach_up`, `reach_left`, `reach_right`, `reach_down` |
| Cheryl: sit on the tub edge facing east; stand up | `cheryl:sit_right` (and `sit_left`); `rise_right` is the half-way frame between `sit_right` and `right_0`. For the moonrise she stands on (3,5) and the sprite is drawn with offset `[0, -17]`, so her seat lands on the tub's rim and her shins hang down its front (and hide her ground shadow, which stays on the floor otherwise). See `?only=scene:court&state=moonrise` |
| Old Man: seated idle (thinking, reaching for a piece) | `old_man_seated:think_right` (frame 0 chin on hand, frame 1 reaching; durations 2600/900 ms) |
| Old Man: turning the pepper mill | `old_man_seated:mill_right` (2 frames) |
| Old Man: sneeze | `old_man_seated:sneeze_right_0` (head back), `sneeze_right_1` (achoo) |
| Old Man: talk | `old_man_seated:talk_right` (2 frames) |
| Neighbor: walk, 4 directions | `neighbor:<dir>_0..2` |
| Neighbor: idle smoothing, then admiring | `neighbor:smooth_left` (2 frames), then `admire_left` (also `_right`) |
| Neighbor: reaching up to the line | `neighbor:reach_up` (2 frames) |
| Sweaty Kid: run, 4 directions | `sweaty_kid:<dir>_1..4` (`<dir>_0` stands; set `sprite.walk: [1, 2, 3, 4]`) |
| Sweaty Kid: jog in place | `sweaty_kid:jog_<dir>` (2 frames) |
| Sweaty Kid: hop | `sweaty_kid:hop_<dir>` (drawn 4 px up; hold it for the hop) |
| Sweaty Kid: arms up | `sweaty_kid:arms_up` (2 frames) |
| Sweat drop particle | `fx:sweat_drop` (2 frames) |
| Ground shadow under any character | `fx:shadow` (a soft oval at the bottom of the frame; the engine draws it under the feet) |

## Items (`items.js`, sheet `items2`)

`items2:pepper_mill`, `egg_timer`, `clothes_prop`, `bath_plug`, `soap`, `moon_chart`, `hat`.

## Effects (`fx.js`)

| Design | Frame(s) |
| --- | --- |
| Swifts at dusk | `fx:swift` (3 frames, 90 ms) |
| Gull in the morning | `fx:gull` (3 frames) |
| Well mist (morning) | `fx_mist:mist` (32×32, 3 frames); draw bottom-centered on the 2×2 well |
| Chimney pots rattling, the piano | `fx:dust` (3 frames) |
| Tub sloshing | `fx:splash` (2 frames) |

## The moonrise vista (`vista.js`)

Cheryl's silhouette shows her bun with its coral tie and her coral cardigan. Draw in this order, each frame:

1. `vista:bowl_dusk` at (0, 0).
2. `vista_glow:glow_<n>` with its bottom center at (176, 90), so its top-left is (116, 42). Glow 0 from about 1 s, 1 from 2.2 s, 2 from 3.4 s.
3. `vista_moon:moon` (2-frame shimmer) centered on x = 176. Its center starts at y = 104, hidden behind the cliffs, rises about 3 px/s, and stops at y = 56. About half of it is up at center y ≈ 86.
4. `vista_rim:rim` at (0, 0), over the moon.
5. `vista_twinkle:twinkle` at each point in `VISTA_BASINS` (exported by `vista.js`), offset by (−3, −3), each with its own phase.
6. `vista_cheryl:cheryl_tub` at (0, 128).

The Gate goes cold: as the moon clears the ridge off to the side, draw `vista_gate_cold:cold_0` (half) and then `cold_1` (full) over the background, after step 1 and before the glow. The notch's apricot drains to violet while the glow stays on the moon, so the wrongness is unmistakable. The dev scene switches at 7 s and 8 s.

`game/dev/scene-vista.js` plays the sequence in a loop; `?still` holds the moment the moon is half up.
