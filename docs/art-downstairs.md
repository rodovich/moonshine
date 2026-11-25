# Art index: Downstairs (Act 3)

Where to find the art for every item in the "Art needed" list of [design/03-downstairs.md](design/03-downstairs.md). References are `sheet:frame`; the modules are `game/src/art/downstairs.js`, `chartroom.js`, `underground.js`, `machines.js`, `cheryl.js`, `named_npcs.js`, `items.js`, and `vista2.js`. "Layer" is the map layer, or "sprite" for an entity. Animated frames are listed by base name (`flood` means `flood_0`, `flood_1`, …).

On the dev page: `/dev/art.html?only=scene:downstairs` (the Step Gallery; `&state=dark` before the lever, `&state=halls` for the Lamp Halls), `scene:chartroom` (`&state=open` bolt drawn, `&state=opened` door open), `scene:crown` (`&state=day` for plain studs), `scene:vista2`.

## How the walls work

A north wall face is two tiles tall: an upper row (`hull:face_top`) over a lower row (`hull:face_base`). The design's maps mark wall features on the lower row (y2 in the Step Gallery, y5 in the Lamp Halls, y1 in the Bunk Room). Pieces drawn for the **lower row** go exactly there: the lever, the chute, the chain, the cradle niche, the gushing pipe. Pieces drawn for the **upper row** (lamp niches, inlays, the speaking horn, the tool rack) go one tile above, in the same column; their interaction tile stays where the design puts it. The sealed hatch and the Founders' Door are 2×2 and fill both rows.

## Tiles and objects

| Design item | Frame(s) | Layer, placement |
| --- | --- | --- |
| Slate wall faces: plain / with a lamp niche / cracked | `hull:face_top`, `face_base` (and `_b` offset seams); `ds:niche_dead` / `niche_lit` (2 frames) on the upper row; `ds:wall_cracked` (lower row) | ground |
| Floor plates (variants, wet) | `hull:floor`, `floor_worn`, `floor_glyph`, `floor_broken`, `floor_wet` | ground |
| Rock void | `hull:top` | ground |
| Chamfered 45° corner walls (Chart Room) | `hull:top_chamfer_nw/ne/sw/se`; the north face's ends `hull:face_base_end_l/r` | ground |
| Ceiling ribs | `hull:over_rib_v` (across an east–west deck: one per row at the rib's x), `over_rib_h`; crossing `ds:over_rib_x`. See-through: solid edges and a sparse dither between, so Cheryl shows when she walks under one | overhead |
| Bronze ladder up into daylight (Step Gallery, 3, 3) | `ds_mirror:dropladder_down` (16×32 sprite at the tile) under `ds_day:over_shaft_open` (one tile north, overhead) and `ds_day:over_column` (on the tile, overhead), with `ds_day:day_spot` on the floor. A wall-face version also exists: `ds_day:day_ladder_top/bot` | sprite; overhead; ground |
| Wall lever: seized / open (Step Gallery, 10, 2) | `ds:lever_jammed` / `lever_ready` / `lever_pulled` (lower row) | ground |
| The lid over the mirror: closed / open | `ds_day:over_shaft_shut` / `over_shaft_open`, two tiles north of the mirror (11, 4) | overhead |
| Mirror on a pedestal (11, 6), one frame per `gallery.mirror` state | 0 flat east: `ds_mirror:mirror_e`; 1 up-left to the Sisters inlay: `mirror_nw`; 2 straight up to the moons inlay: `mirror_n`; 3 up-right to the hatch: `mirror_ne`. Before the lever: `mirror_s` (resting) | sprite |
| Vertical daylight column | `ds_day:over_column` (3 frames) on (11, 5); `ds_day:day_spot` on (11, 6) | overhead; ground |
| The reflected beam, with the glow where it lands | Overhead tiles that chain: 45° `ds_day:over_beam_nw` on (10,5), (9,4), (8,3) and `over_beam_end_n` on (7,2); straight up `over_beam_v` on (11,3) and `over_beam_end_n` on (11,2) (the daylight column fills (11,4)–(11,5)); 45° `over_beam_ne` on (12,5), (13,4), (14,3) and `over_beam_end_n` on (15,2); flat east `over_beam_h` along y6 from x12 and `over_beam_end_e` at the wall. All 2 frames. Earlier full-room versions: `ds_beams:beam_lamp_w`, `beam_lamp_e`, `beam_hatch` (336×96, top-left at map pixel (32, 16)) | overhead |
| Inlays (2 wide), with lit variants | Three Sisters `ds:inlay_sisters_l/r`, lit `inlay_sisters_lit_l/r` (Step Gallery 6–7); moon phases `ds:inlay_moon_l/r`, lit `inlay_moon_lit_l/r` (14–15); duty roster `ds:inlay_roster_l/r` (Bunk Room 4–5). All on the upper row | ground |
| Sealed hatch with a moon-lock eye: dark / glowing / open (Step Gallery, 19–20) | `ds:seal_nw/ne/sw/se`, `seal_lit_*`, `seal_open_*` (2×2: nw/ne on y1, sw/se on y2) | ground |
| Disc cradle: with and without the disc, glowing (Cradle, 5, 2) | wall niche (lower row): `ds:cradle_niche`, `cradle_niche_disc`, `cradle_niche_glow` (2 frames). A freestanding version: `ds:cradle`, `cradle_disc`, `cradle_glow` | ground (objects for the freestanding one) |
| Chute mouth (Cradle 2–3, 2; Lamp Halls 3–4, 5) | `ds:chute_l`, `chute_r` (2 wide, lower row); a 1-wide `ds:chute` | ground |
| Moonglass lamps in niches: dead / lit | `ds:niche_dead`, `niche_lit` (upper row); put `hull:floor_glow` on the floor below a lit one | ground |
| Light-pipes from the ceiling, with a pool below (Lamp Halls 5, 12, 20 on y8) | `ds_rod:rod` (3 frames), `rod_dark` (16×32 sprites); `hull:floor_glow` under each | sprite; ground |
| A shorter light-pipe rod, for spots where the tall rod would reach into the row above (e.g. Lamp Halls 22, 8, under the valve's standing spot) | `ds_rod_short:rod_short` (3 frames), `rod_short_dark` (16×16 sprites: the rod fits within its own tile); `hull:floor_glow` under it | sprite; ground |
| Drop-ladder: hooked up / down (Lamp Halls, 8, 6) | `ds:over_dropladder_hooked` / `ds_mirror:dropladder_down` | overhead / sprite |
| The drop-ladder's chain on the wall (Lamp Halls, 7, 5) | `ds:wall_chain` (lower row) | ground |
| Floor grate (Step Gallery, 6, 8): closed / open with the ladder top | `ds:grate_closed` / `grate_open` | ground |
| Speaking tube, a bronze horn (Lamp Halls, 20, 5) | `ds:horn` (upper row); also `machines:speaking_tube` | ground; objects |
| Fountain valve (Lamp Halls, 22–23, 4–5; used from 22–23, 6), 2×2 | bare square spindle (no key) `machines:valve_spindle_nw/ne/sw/se`; key fitted `valve_key_*`; key turned `valve_key_turned_*`; jammed `valve_key_jammed_<q>` (2 frames, a strained shake). The older handwheel `machines:valve_big_*` is still there for other valves | objects |
| Bunk Room tool rack, with / without the valve key | `ds:tool_rack_key` / `tool_rack` (upper wall row); it reads once the lamp is relit | ground |
| Valve key icon | `items3:valve_key` (bronze T-handle with a square socket) | inventory |
| Ship Plan icon | `items3:ship_plan` (Cheryl's charcoal rubbing folded once, the hull drawn pale on it) | inventory |
| Gushing pipe (27, 2) / stopped | `ds_water:gush` (4 frames) / `gush_stopped`, over `hull:face_base` | objects |
| Flooded fast water (north passage 25–26, 1–6) | `ds_water:flood` (4 frames); where it meets dry floor `flood_edge_n`; under the pipe `flood_splash` | ground |
| Drained wet floor (after the valve) | `ds_water:floor_drained`, `floor_soaked` | ground |
| Still black deep water sloping away (17–18, 11–13) | `ds_water:black_edge` (the steps going under, top row), `black` (2 frames, very slow) | ground |
| Bunk Room: stone bunks (1–2, 7–8 on y3), tool rack (7–8, y1), stone table with a cup (3, 4) | `ds:bunk_l/r` (2×1); `ds:tool_rack` (upper row, use twice or once); `ds:stone_table` | objects; ground |
| Chart Room floor inlay (3–12, 5–10) | `chart:inlay_x<0-9>y<0-5>`: column = map x − 3, row = map y − 5. The sea comes halfway up the hill: the waterline crosses the hull at its widest, on the boundary between map rows 7 and 8, and the ribbed, hollow belly lies under it. Map positions: town and houses on the hill (4–11, 5–7, the crown on 5–6); mast and bell (7, 5–6), its rope to a wheel (7, 6); hull above water, from the hill's slopes down to the main deck (4–11, 6–7); waterline (3–12, between rows 7 and 8); hull below water, the ribbed belly (4–11, 8, its keel just touching row 9); the Sisters' three bars, underwater (8–9, 8); the shaft from a narrow house (5, 5–6) straight down to the bowl with a moon in it (5, 10); the chain from the bow (11, 7) down to the anchor (12, 10); sparse swells below the waterline (rows 8–10); the teapot's shadow in the pool (7–8, 7–8). The Ship Plan rubbing (`ship_plan:plan`) matches | ground |
| The Eye's pool of light with the teapot shadow (an overlay) | `chart:pool_x<c>y<r>` on the same cells as the inlay (only the cells it touches exist) | objects |
| The Keeper's stone chair (2, 4) | `chart_chair:keeper_stone_chair` | sprite |
| Table with a cup and a bronze-bound ledger (3, 4) | `ds:stone_table` with `chart:keeper_ledger`; or the 2×1 `chart:stone_desk_l/r` | objects |
| The Founders' Door, inside (7–8, 1–2): bolt shot / drawn / door open | `chart:fdoor_in_x<0-1>y<0-1>` / `fdoor_in_open_x..y..` / `fdoor_in_opened_x..y..` | ground |
| Crypt: the Founders' Door open, steps going down | `founders_door_open:founders_door_open_x<0-1>y<0-1>` (replaces `landmarks:founders_door_*`) | ground |
| Crown: moon-eye studs in the plaza paving and stair, plain / glowing | `moon_eyes:pave_<q>_eye` / `pave_<q>_eye_glow` (2 frames), where `<q>` is the paving quadrant for that tile (`nw` on even x and y, `ne` odd x, `sw` odd y, `se` both odd); stair `moon_eyes:stairs_l_eye` / `stairs_r_eye` / `stairs_eye` and `_glow`. The glow's halo is dithered `relic_cyan` (emissive), so it stays cool under the dusk tint | ground |

## Sprites

| Design item | Frame(s) |
| --- | --- |
| Cheryl sitting on the floor (after the chute) | `cheryl:sitfloor_down` |
| Cheryl heaving on a lever | `cheryl:heave_up_0` (hands high on the grip), `heave_up_1` (hauled down, leaning back) |
| Cheryl kneeling (the rubbing; the hundredth step) | `cheryl:kneel_down`, `kneel_up` |
| Ottilie walking with a lamp | `ottilie:lamp_<dir>_0..2` (engine walk names: `_0` stands, `_1`/`_2` step; the lamp is in her right hand, and `lamp_right` is drawn so it's on the near side). Without the lamp: `ottilie:<dir>_0..2`. Idles: `teacup_down` (2 frames, sipping), `lamp_idle_down` (2 frames, lamp raised) |
| The disc's light | drawn by the engine; the disc item icon is `items3:moonglass_disc` |

## Full-screen images

| Design item | Frame(s) |
| --- | --- |
| The Ship Plan, a charcoal rubbing of the inlay | `ship_plan:plan` (256×224) |
| Vista: Tessel from the Crown at dusk, every doorstep glowing | `vista2:crown_dusk` (256×224); then `vista2_light:light` (8×8, 3 frames) centered on each point of `VISTA2_LIGHTS` (exported by `vista2.js`, offset −4, −4), each with its own phase. `game/dev/scene-vista2.js` turns them on in a wave from the Crown down to the water |

## Notes for the design

- **Ribs over the light-pipes.** In the Lamp Halls the ribs at x12 and x20 fall on the light-pipes at (12, 8) and (20, 8), so the overhead ribs hide the rods and their pools. Moving the ribs to x13 and x21, or the pipes to x11 and x19, avoids it.
