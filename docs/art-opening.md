# Art index: the opening slice

Where to find the art for each object in [design/01-opening.md](design/01-opening.md). References are `sheet:frame` (the module is under `game/src/art/`). "Layer" is the map layer, or "sprite" for an entity. Animated frames are listed by their base name (`water` means `water_0`, `water_1`, …). See the composed maps on the dev page: `/dev/art.html?only=scene:court`, `scene:flat`, `scene:vista` (add `&state=morning` or `&tint=night`).

Rules for all of it are in [art-direction.md](art-direction.md).

## Tints

`game/src/art/tints.js` exports `TINTS.dusk`, `TINTS.night`, `TINTS.day`, each `{ color, amount, mode }` for `g.tint(color, amount, seconds, mode)`. Cistern Court opens under dusk; the cut back to the roof in the moonrise is night; the morning is day. The flat uses dusk, then day.

## Cistern Court

COURT_INDEX

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
| Cheryl: sit on the tub edge facing east; stand up | `cheryl:sit_right` (and `sit_left`); `rise_right` is the half-way frame between `sit_right` and `right_0` |
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

Draw in this order, each frame:

1. `vista:bowl_dusk` at (0, 0).
2. `vista_glow:glow_<n>` with its bottom center at (176, 90), so its top-left is (116, 42). Glow 0 from about 1 s, 1 from 2.2 s, 2 from 3.4 s.
3. `vista_moon:moon` (2-frame shimmer) centered on x = 176. Its center starts at y = 104, hidden behind the cliffs, rises about 3 px/s, and stops at y = 56. About half of it is up at center y ≈ 86.
4. `vista_rim:rim` at (0, 0), over the moon.
5. `vista_twinkle:twinkle` at each point in `VISTA_BASINS` (exported by `vista.js`), offset by (−3, −3), each with its own phase.
6. `vista_cheryl:cheryl_tub` at (0, 128).

`game/dev/scene-vista.js` plays the sequence in a loop; `?still` holds the moment the moon is half up.
