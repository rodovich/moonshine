# Art index: Act 5

Where to find the art for the "Art needed" list in [design/05-high-and-dry.md](design/05-high-and-dry.md). References are `sheet:frame`.

## Underground

The Windlass Room and the Bow Passage (module `game/src/art/act5_under.js`). Walls, floors, ribs and light pools use the existing `hull:` tiles; the speaking tube is the existing `ds:horn`. On the dev page: `?only=scene:act5_under&state=windlass|windlass_clapper|passage|passage_lit`.

| Piece (position) | Frames | Layer |
| --- | --- | --- |
| The drum wound with chain (5–20, 4–7), 16×4 | `windlass_drum:drum_x<0-15>y<0-3>` (still); turning: `drum_x<c>y<r>_0..3` (180 ms; the chain pays out down the drum's face) | objects |
| The chain off the drum's east end | part of the drum's east column (`drum_x15y0`) | objects |
| The hawse (21, 3–4), the chain going out, the evening sea through it | `hawse:hawse_top_0/1`, `hawse_bot_0/1` (evening blue); `hawse_late_top/bot_0/1` (deep violet, as the evening goes) | ground |
| The Tooth socket (7–8, 8–9), 2×2: with the sheared stump / empty / the clapper seated | `windlass:socket_stump_<nw\|ne\|sw\|se>`, `socket_empty_*`, `socket_clapper_*` | ground |
| The stump, levered out and lying loose | `windlass:stump_loose` | objects |
| Coils of spare chain (3–4, 10) and (15–16, 10), 2×1 | `windlass:coil_a_l/r` (west, Cheryl sits here), `coil_b_l/r` | objects |
| The brake lever (17, 8), with its plate (bell, hand, arrow) | `brake:brake_locked`, `brake_thrown` (16×32, bottom-centred on the tile) | sprite |
| The speaking tube (15, 2) | `ds:horn` on the upper wall row (15, 1) | ground |
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
| The Clockmaker: at his bench; the square jug held up in rapture | `clockmaker:bench_up_0/1`, `jug_down_0/1` |
| The Boatman throwing the rope coil up | `boatman_mud:throw_0..2` (wind-up, swing, let go; 500/150/600 ms) |
| The Fishmonger handing over a bucket | `fishmonger:give_down_0/1`; walking `fishmonger:<dir>_0..2` (the Shopkeeper's body in a striped shirt and rubber apron) |
| Two crowd residents | `crowd_a`, `crowd_b`: `down_0`, `cheer_down_0/1`, `point_down_0/1` |
| Icons | `items_act5:bucket_empty`, `bucket_full`, `rope`, `brass_polish`, `clapper` |
