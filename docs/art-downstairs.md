# Art index: Downstairs (Act 3)

Where to find the art for the Act 3 pieces the writer listed ahead of `docs/design/03-downstairs.md`. References are `sheet:frame`; modules are `game/src/art/downstairs.js`, `chartroom.js`, `underground.js`, and `machines.js`. "Layer" is the map layer, or "sprite" for an entity. Animated frames are listed by base name. See them composed on the dev page: `/dev/art.html?only=scene:downstairs` and `?only=scene:chartroom` (add `&state=open` for the drawn bolt). Positions will follow the design doc once it lands.

| # | Piece | Frames | Layer |
| --- | --- | --- | --- |
| 1 | Bronze ladder up into daylight (underside of the hundredth step) | `ds_day:day_ladder_top`, `day_ladder_bot` (1×2 on the wall face); `ds_day:day_spot` on the floor below | ground |
| 2 | Wall lever; light-shaft lid; daylight | `ds:lever_jammed`, `lever_ready`, `lever_pulled` (lower wall-face tile); `ds_day:over_shaft_shut` / `over_shaft_open`; `ds_day:over_column` (3 frames) over `day_spot`; beams `over_beam_h`, `over_beam_v` (2 frames, tile along the path) with ends `over_beam_end_e`, `_w`, `_s` | ground; overhead |
| 3 | Bronze mirror on a pedestal, 3 positions | `ds_mirror:mirror_e`, `mirror_s`, `mirror_w` | sprite (16×32) |
| 4 | Moon-lock hatch | `ds:moonhatch` (dark), `moonhatch_lit`, `moonhatch_opening` (2 frames), `moonhatch_open` | ground |
| 5 | Cradle and moonglass disc | `ds:cradle`, `cradle_disc`, `cradle_glow` (2 frames); icon `items3:moonglass_disc` | objects; inventory |
| 6 | Chute | `ds:chute` (lower wall-face tile) | ground |
| 7 | Niche lamps | `ds:niche_dead`, `niche_lit` (2 frames); `hull:floor_glow` below a lit one | ground |
| 8 | Light-pipes from the ceiling | `ds_rod:rod` (3 frames), `rod_dark`; `hull:floor_glow` beneath | sprite (16×32) |
| 9 | Ceiling ribs | `hull:over_rib_v`, `over_rib_h`; crossing `ds:over_rib_x` | overhead |
| 10 | Wall inlays (2 wide, upper wall row) | moon phases `ds:inlay_moon_l/r`; the Three Sisters `inlay_sisters_l/r`; bell and wave `inlay_roster_l/r` | ground |
| 11 | Valve, gushing pipe, flooded passage | valve `machines:valve_big_*`; `ds_water:gush` (4 frames, objects over a lower wall-face tile), `flood` and `flood_edge_n` and `flood_splash` (4 frames), `floor_drained`, `floor_soaked` | ground; objects |
| 12 | Counterweighted ladder | hooked up `ds:cw_ladder_up_top/bot` (with chain and cleat); dropped `cw_ladder_down_top/bot` | ground |
| 13 | Speaking tubes | `ds:horn` (upper wall-face tile); also `machines:speaking_tube` | ground; objects |
| 14 | Black still water on a slope | `ds_water:slope_steps`, `black_edge` (2 frames, steps going under), `black` (2 frames) | ground |
| 15 | Keepers' bunk room | `ds:bunk_l/r` (2×1), `tool_rack` (upper wall-face tile), `cup` | objects; ground |
| 16 | The Chart Room | inlay `chart:inlay_x0y0` … `inlay_x9y5` (10×6); light pool with the teapot's shadow `chart:pool_x<x>y<y>` (removable, same cells); the Founders' Door inside `chart:fdoor_in_x<0-1>y<0-1>` (bolted) / `fdoor_in_open_x..y..` (bolt drawn); `chart:stone_desk_l/r` (ledger and cup), `keeper_cup`, `keeper_ledger`; `chart_chair:keeper_stone_chair` (sprite); eight sides from `hull:top_chamfer_*` on the diagonals | ground; objects; sprite |
| 17 | The Ship Plan rubbing | `ship_plan:plan` (256×224) | full screen |

Also redrawn: the ballast pump (`machines:pump_*`, now a beam pump) and the windlass chain (`machines:windlass_*`, `chain_v`, with interlocking links).
