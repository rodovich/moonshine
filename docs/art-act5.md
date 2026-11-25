# Art index: Act 5

Where to find the art for the "Art needed" list in [design/05-high-and-dry.md](design/05-high-and-dry.md). References are `sheet:frame`.

## Surface

Module `game/src/art/act5_surface.js`. Dev page: `/dev/art.html?only=scene:act5_surface&state=harbor` (also `harbor_teeth2`, `harbor_teeth3`, `clockshop`, `bilge`, `bilge_disc`, `shop`, `shop_guide`, `square`, `lamproom`).

| Design | Frame(s) | Layer, placement |
| --- | --- | --- |
| Risen Harbor: the old quay edge (row 9) | `reveal:qwall_<a-h>` (the Bilge's own quay wall; place by x % 8) | ground |
| Risen Harbor: exposed hull with barnacles and a tide line (row 10) | `harbor_hull:hull_<a-h>` (the top of `reveal:hull_n` over the foot of `reveal:hull_s`; place by x % 8) | ground |
| The sea against the hull (row 11) | `sea:wash_a` (even x) / `wash_b` (odd x), 4 frames: a wet black band at the hull's foot, foam lapping | ground |
| The sea, lower (row 12) | `sea:sea_nw` (even x) / `sea_ne` (odd x), 4 frames: dark, slow swells (the 2×2 block `sea_<nw,ne,sw,se>` also tiles larger seas) | ground |
| The far sea and haze (rows 13–14), where the Teeth sit | `sea:far_a/b` on row 13, `sea:haze_a/b` on row 14 (a/b by even/odd x), 4 frames: paler, calmer water fading into a pale sea haze at the bottom edge, so the band reads as far away | ground |
| **The Teeth**, three stages | `teeth:stage1`, `stage2`, `stage3` (4 frames each; stage 3 at uneven timing). A 176×48 sprite drawn top-left at (8·16, 12·16). Stages 1 and 2 sit on the far-sea band in the sprite's bottom 32 rows, blue-grey and hazed over, so they read as quiet, distant warnings: stage 1 a faint line of dots and surf, stage 2 a little larger and darker. Stage 3 is close and threatening: big jagged dark rocks rim-lit on the west, rising out of the far band into the near sea, with foam collars at their feet, white surf breaking up their faces and spray thrown high | overhead sprite, drawn behind the ferry |
| The ferry *Persistence*, hanging low and tilted on taut ropes | `ferry:persistence`, a 176×80 sprite drawn top-left at (8·16, 8·16): the ropes run from the bollards at (8, 8) and (18, 8) down to her cleats; she lies over (10–15, 11–12), down by the stern | sprite |
| Bollards (with the ferry's rope), nets | `harbor_props:bollard_rope` at (8, 8) and (18, 8) (`bollard` without the rope); `harbor_props:nets` at (20, 4); crates are `props:crate` | objects |
| The Keyhole, with the anchor chain running out (30–31, 9–10) | `keyhole:keyhole_x<0-1>y<0-1>` | ground |
| The lighthouse's foot (26–29, 0–3), door at (27–28, 3) | `lighthouse:lighthouse_x<0-3>y<0-3>` (transparent at the sides: put it on the objects layer over rock) | objects |
| Dry Bilge: the stair ring (25, 7) | `stair_rope:ring`; tied, `stair_rope:ring_tied` | objects, over `reveal:wstairs_r` |
| The rope hanging down the hull to the mud | `stair_rope:rope_edge` (25, 8), `rope_hull` (25, 9), `rope_foot` (25, 10, a coil on the mud) | objects |
| The bronze door opening; open with cyan light; light on the mud | grinding open: `bilge_door5:door_opening_x<0-1>y<0-1>_<0-2>` (play 0, 1, 2); open: `door_open_x<0-1>y<0-1>` (2 frames, the light flickering); the spill on the mud at (26–27, 10): `bilge_door5:spill_l`, `spill_r` (2 frames) | ground (the door at 26–27, 8–9); objects (the spill) |
| The dim disc sitting in the door's eye | `bilge_door5:door_disc_x<0-1>y<0-1>` | ground |
| Clockmaker's Shop: wall clocks, each a different time (1–2, 4–5, 7–8 on row 1) | `clockshop:clocks_a`, `clocks_b`, `clocks_c` (a pendulum, 4 frames), `clocks_d`, `clocks_e` (a cuckoo clock with swinging weights, 4 frames), `clocks_f` | objects, over `interior:wall_lower` |
| The workbench with the drive in little dishes (1–3, 3) | `clockshop:bench_l`, `bench_m`, `bench_r` | objects |
| The doorstop: the bell's clapper (7, 5) | `clockshop:clapper` | objects |
| The door (4–5, 7): propped open / swung shut | `clockshop:door_open_l/r` / `door_shut_l/r` | ground, in the south wall |
| Walls and floor | `interior:wall_*`, `shop:floor` | ground |
| Shop: the window display fallen over in the rise, the telescope in it (7–8, 5) | `shop5:display_fallen_l/r` (structure pass: redrawn with the Keeper's telescope rolled out across the floor beside the plinth, a cradle tipped under it, in place of the hat) | objects |
| Shop: the guidebook in pride of place (7–8, 5) | `shop5:display_guide_l/r` | objects |
| Fountain Square: DRY CANAL DAY — TONIGHT — MOONRISE on two poles over the café (17–22, 11) | `banner:over_banner_<a-f>` (2 frames, a ripple), overhead in a row; the poles' feet `banner:pole_foot_l` / `pole_foot_r` on the objects layer in the row below, under the first and last banner tiles | overhead; objects |
| Lamp room: the window ring (row 1), walls, floor | `lamproom:window`, `wall`, `floor` | ground |
| The lamp, lit and turning (3–4, 2–3) | `lamproom:lamp_x<0-1>y<0-1>` (4 frames): a lighthouse lens, a faceted glass beehive of prism rings bound in brass under a domed brass top, on a brass pedestal, with the blazing core showing through and the turning shine sweeping across the facets | objects |
| The empty polish tin (2, 5) | `lamproom:polish_tin` | objects |
| The dust sheet left empty where the telescope stood (6, 5) | `lamproom:sheet_empty` (the sheet in a heap). In Act 2 the telescope stands under it: `scope_sheet_top/bot` (see [art-act2.md](art-act2.md)) | objects |
| The way out (3–4, 7): the head of the lighthouse stair going down through the floor, treads falling into the dark, iron rails capped in brass (not a house door) | `lamproom:stair_down_l`, `stair_down_r` | ground |
| Laundry streaming | `cloth:over_wind_<a-f>` (from Act 4), overhead in a row | overhead |
| Belfry: the Keepers' hatch beside the rope (5, 6), from Act 5 on | `keepers_hatch:shut` (a flush bronze plate let into the planks, riveted, with a flush ring and no handle: it's bolted from underneath) / `keepers_hatch:open` (the lid standing up on its north hinge with the bolt on its underside, bronze staples going down into the dark). Full tiles on the `belfry:floor_a` plank pattern, in module `act4_surface.js` beside the belfry sheet. Dev page: `?only=scene:act4_surface&state=belfry_hatch` / `belfry_hatch_open` | ground or detail |

## Underground

The Windlass Room and the Bow Passage (module `game/src/art/act5_under.js`). Walls, floors, ribs and light pools use the existing `hull:` tiles; the speaking tube is the existing `ds:horn`. On the dev page: `?only=scene:act5_under&state=windlass|windlass_clapper|passage|passage_lit`.

| Piece (position) | Frames | Layer |
| --- | --- | --- |
| The drum wound with chain (5–20, 4–7), 16×4 | `windlass_drum:drum_x<0-15>y<0-3>` (still); turning: `drum_x<c>y<r>_0..3` (180 ms). One horizontal bronze barrel, shaded round from a lit top to a dark underside, with heavy bolted end flanges on slate bearings. The chain is wound in horizontal turns of interlocking links that crowd together over the top and under the bottom; as it turns, the turns roll down over the front and the flange bolts travel round | objects |
| The chain off the drum's east end | a thick run of big links rising off the top of the drum's east end (`drum_x13y0` to `drum_x15y0`) into the hawse; in the turning frames the links move toward the drum | objects |
| The hawse (21, 3–4), the chain going out, the evening sea through it | `hawse:hawse_top_0/1`, `hawse_bot_0/1` (evening blue); `hawse_late_top/bot_0/1` (deep violet, as the evening goes). A big round opening filling both tiles, in deep shadow with a heavy bronze collar; the chain's big links enter it from the drum at its lower left | ground |
| The Tooth socket (7–8, 8–9), 2×2: with the sheared stump / empty / the clapper seated | `windlass:socket_stump_<nw\|ne\|sw\|se>`, `socket_empty_*`, `socket_clapper_*` | ground |
| The stump, levered out and lying loose | `windlass:stump_loose` | objects |
| Coils of spare chain (3–4, 10) and (15–16, 10), 2×1 | `windlass:coil_a_l/r` (west, Cheryl sits here), `coil_b_l/r` | objects |
| The brake lever (17, 8), with its plate (bell, hand, arrow) | `brake:brake_locked`, `brake_thrown` (16×32, bottom-centred on the tile) | sprite |
| The speaking tube (15, 2) | `ds:horn` on the upper wall row (15, 1) | ground |
| The Keepers' ladder beside the tube (16, 1–2), up into the dark toward the belfry | `keepers_rungs:rungs_top` at (16, 1), in place of `hull:face_top`; `rungs_bot` at (16, 2), in place of `hull:face_base`. Bronze staples set in the wall, one every 4 px and centered in the tile (x 4–11, as in the emergency shaft), so `cheryl:climb_up_0/1` sits on them. At the top the wall opens into a dark notch and the last staple dims, so the shaft reads as going on up. Dev page: `state=windlass_ladder` shows Cheryl on them | ground |
| The sealed hatch to the Long Keel (7–8, 1–2), moon-in-bowl emblem | `keel_hatch:keel_sealed_<nw\|ne\|sw\|se>`, `keel_open_*` (Act 6) | ground |
| Lamps (Windlass 2 and 19; Bow Passage 2, 7, 12, 16) | `keel_hatch:lamp_dead`, `lamp_flicker_0/1`, `lamp_warming`, `lamp_lit`; the whole wake as one animation `lamp_wake_0..4` (300/120/120/220/600 ms; hold on `_4`, or swap to `lamp_lit`). Upper wall row; put `hull:floor_glow` on the floor below a lit one | ground |
| The bronze door, inside (Bow Passage 0–1, 3–4) | `bowdoor:bowdoor_shut_<nw\|ne\|sw\|se>` (eye dim), `bowdoor_open_*` (leaves swung back, evening light from the Bilge falling in) | ground |
| Ribs in the Bow Passage | `hull:face_rib_top/base` on the wall and `hull:over_rib_v` overhead (the scene puts them at x 4, 9, 14, clear of the lamps) | ground; overhead |

## Sprites and icons

Modules: `game/src/art/act5_sprites.js` (new sheets), plus additions to `cheryl.js` and `act4_sprites.js` (no existing frame changed). All 16×32 sprites are anchored bottom-centre. On the dev page: `?only=scene:act5_people`.

| Design | Frames |
| --- | --- |
| Kid: running flat-out | `kid_relay:dash_left_0..3`, `dash_right_0..3`, `dash_down_0..3` (90 ms; the run cycle leaning forward; play as an animation via `setSprite`, not the walk) |
| Kid: jumping off the quay | `kid_relay:jump_down_0` (crouch), `_1` (airborne, knees tucked, 3 px up), `_2` (falling feet first, arms up) |
| Kid: landing on the mud (splat) | `kid_relay:splat_down_0` (squashed flat, arms flung out), `_1` (picking himself up); add `critters:mud_splash` at his feet |
| Kid: slapping the disc into the eye | `kid_relay:slap_up_0` (arm raised), `_1` (on tiptoe, palm flat on the eye); draw `disc_fx:disc_flare` at his hand as the eye drinks it |
| Kid: winding the egg timer | `kid_relay:wind_down_0/1` (120 ms) |
| Kid: celebrating | `sweaty_kid:arms_up_0/1` (existing) |
| Cheryl: lying on the step lowering a bucket | `cheryl:lower_down_0/1` (the rope runs out of the bottom of the frame; hang `bucket_rope:bucket_rope_empty/full` below her, moving down) |
| Cheryl: catching a rope coil | `cheryl:catch_up` |
| Cheryl: climbing a rope | `cheryl:climbrope_up_0/1` (the rope runs through her, top to bottom of the frame) |
| Cheryl: pointing | `cheryl:point_left`, `point_right` |
| Cheryl: holding the disc up into the lamp | `cheryl:discup_up`, with `disc_fx:disc_flare_0..3` drawn between her hands (about 22 px above her feet) |
| Cheryl: heaving on the crowbar | `cheryl:heave_up_0/1` (existing) |
| Cheryl: sitting on a chain coil | `cheryl:sitcoil_down` (draw her about 6 px up so she sits on `windlass:coil_a_l/r`) |
| The disc: flaring and dim | `disc_fx:disc_flare_0..3` (white, then deep cyan; 90/120/200/400 ms), `disc_full`, `disc_dim` (16×16) |
| The Keeper: polishing; at the window; shading her eyes | `keeper:polish_up_0/1`, `window_up_0/1`, `shade_down_0/1`; standing `keeper:<dir>_0` |
| The Keeper with her telescope (structure pass: after the swap) | `keeper:scope_up_0/1` (at the window, from behind: it runs up past her cap, her right hand gripping it; frame 1 swings a pixel, 1600 ms each); `scope_down_0/1` (facing us, looking out through it: it runs down from her eye over her chest to the round brass end and dark glass, the glint moving, 1400/700 ms); `hold_down_0` (holding it across her body, for talking) |
| The Clockmaker: at his bench; the square jug held up in rapture | `clockmaker:bench_up_0/1`, `jug_down_0/1` |
| The Boatman throwing the rope coil up | `boatman_mud:throw_0..2` (wind-up, swing, let go; 500/150/600 ms) |
| The Fishmonger handing over a bucket | `fishmonger:give_down_0/1`; walking `fishmonger:<dir>_0..2` (the Shopkeeper's body in a striped shirt and rubber apron) |
| Two crowd residents | `crowd_a`, `crowd_b`: `down_0`, `cheer_down_0/1`, `point_down_0/1` |
| Icons | `items_act5:bucket_empty`, `bucket_full`, `rope`, `brass_polish`, `clapper` |

The QA description sweep added or changed art for this act: see [art-sweep.md](art-sweep.md).
