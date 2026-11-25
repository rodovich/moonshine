# Art index: Act 6

Where to find the art for docs/design/06-moon-in-the-bowl.md's "Art needed". References are `sheet:frame`.

## Sprites

Lined up on the dev page at `/dev/art.html?only=scene:act6_people`. New sheets are in `game/src/art/act6_sprites.js`; additions to existing sheets are marked. Character frames are 16×32, bottom-anchored.

| Design | Frames |
| --- | --- |
| The crowd sitting down hard (the lurch) | `fall_down_0` (the jolt) and `fall_down_1` (sitting hard, legs out, soles showing), added to every resident body: `old_man`, `shopkeeper`, `kid` (npcs.js); `neighbor`, `sweaty_kid` (opening_npcs.js); `counting_woman`, `mover`, `tourist`, `mayor`, `ambrose`, `basin_woman`, `girl`, `watering_woman` (act2_npcs.js); `clockmaker`, `mott` (act4_sprites.js); `keeper`, `fishmonger`, `crowd_a`, `crowd_b` (act5_sprites.js). Palette swaps apply as usual. Play `_0` briefly, then hold `_1` |
| Flying chess pieces | `chess_fly:chess_fly_0..3` (16×16, a pawn and a king arcing off the board, 110 ms; draw at the chess table and remove after the last frame) |
| Cheryl in the Basin | `cheryl:bath_down_0` (eyes open), `bath_down_1` (eyes closed). The frame is cut flat at row 29, the waterline: draw her over the Basin with the cut on the water, and `bath_ripple:bath_ripple_0/1` (16×8, 900 ms) centred on the cut |
| Cheryl taking off her shoes | `cheryl:shoes_down_0` (sitting, reaching to her feet), `shoes_down_1` (one shoe off, held up). The shoes then sit beside the Basin as a tile |
| Cheryl climbing out of the well | `cheryl:well_down_0` (head and shoulders), `well_down_1` (hands on the rim), `well_down_2` (a knee up). Each is cut flat at its bottom edge: put that edge on the well's rim (draw her after the well tiles), then switch to `down_0` standing beside it |
| Cheryl writing at the table | `cheryl:write_up_0/1` (seated, seen from behind, her right elbow working). Put her on the chair's tile; the table is above |
| Cheryl turning the trim wheel; pulling the stop rod | the existing `cheryl:wheel_up_0/1` and `heave_up_0/1` |
| The Boatman with the piano in his boat | `boatman_piano:piano_rock_0..3` (450 ms) and `piano_sing_0/1`, 32×32, placed like `boatman:rock_*` |
| Mott raising a mug of tea (the climax montage) | `mott_jug:raise_mug_down_0` (mug raised, steam), `raise_mug_down_1` (raised higher). The earlier jug frames `raise_down_0/1` are kept |
| Ambrose at the rope at night; the Keeper at the window | the existing `ambrose:ring_up_*` and `keeper:window_up_*` |
| The Pelletiers home with luggage | `pelletier_m`, `pelletier_f`: `<dir>_0..2`, each with a suitcase in hand |
| The Tourist with her suitcase | `tourist_case:down_0..2` (standing, and walking toward the camera) |
| Two Stair Race runners | `runner` (palettes base: sage vest; `b`: mustard vest), the Kid's body with a race bib: run `<dir>_1..4` (`sprite.walk: [1, 2, 3, 4]`), `jog_<dir>_0/1`, `arms_up_0/1` |
| The Kid crossing the finish, the egg timer up | `kid_finish:finish_down_0/1` |
| The Counting Woman with a ribbon on her sash | `counting_rosette`: her `down/left/right_0..2` and `sit_down_0/1` with a gold rosette pinned on |
| A few crowd residents for the Steps | the existing `crowd_a`, `crowd_b` (`cheer_down`, `point_down`) |

## Full-screen images

Both are 256×224, drawn as stacked layers. Module: `game/src/art/act6_vistas.js`. Dev page: `?only=scene:act6_vistas&state=basin` (the trim steps), `state=basin_reflection` (the bath), `state=final`; add `&still` for the last moment or `&t=<ms>` to freeze the loop.

### The Basin view

A round mirror of still water in the Basin's slate rim, holding what the Founders' mirror at the top of the shaft sees: the night sky in full dark, about an hour after sunset (indigo, stars, no glow, only a faint blue-grey along the Rim), the Rim with the Gate's notch, the dark Bowl below. It is drawn upright, like a picture in a round frame (a periscope shows the world the right way up), so the Gate and the moon's steps read at once.

Draw in this order:

1. `basin_view:basin` at (0, 0): the sky in the water, the reflected Bowl, the rim (its moonglass inlay dim), the floor beyond.
2. `basin_moon:moon` (24×24, 2-frame shimmer, 700 ms), centred on one of `BASIN_MOON_POS` (exported by the module). Two nights past full, it's a waning gibbous: slightly warm, its upper-right edge a hair flattened (see [art-direction.md](art-direction.md), Skies). Drawn like the vistas' moons: a clean disc with a lit limb on the lower left, soft mares in its own shade, and no dithered halo, which broke up its edge against the cliffs. Positions 2 and 3 sit at y 122, high enough that the moon shows whole in the Gate.

   | Trim step | Moon centre | Reads as |
   | --- | --- | --- |
   | 0 | (176, 112) | just risen over the cliffs, off to the right of the Gate |
   | 1 | (150, 114) | closer, dipping toward the Gate's right wall |
   | 2 | (128, 122) | dead in the Gate, framed by its walls |
   | 3 (true) | (121, 122) | two fingers past the middle, touching the left wall |

3. `basin_cliffs:cliffs` at (0, 0), over the moon, so it sits behind the cliffs and inside the notch.
4. Moon true: `basin_rimlit:rimlit_0` … `rimlit_3` at (0, 0), about 400 ms apart. The inlay lights cyan from the bottom of the ring all the way round, with a bright leading edge. Hold `rimlit_3`.
5. The bath: `basin_ripples:ripple` (4 frames, 260 ms) and then `basin_cheryl:reflection` (2 frames, 900 ms, a 1-px settle), both at (0, 0). Her reflection leans in from the lower left of the rim: her ash-and-silver bun with its coral tie, her face turned to the water, a coral shoulder. The ripples spread as broken arcs from where she sits. She bathes here in her clothes, not the costume: the costume is at home and she hadn't planned a bath (the writer's call; see the Act 6 design doc).

### The final vista

The Act 1 composition made right. Draw in this order:

1. `vista_final:bowl_moonrise` at (0, 0): the Act 1 Bowl and roofs under the same eastern dusk sky (the Earth's shadow and the Belt of Venus; see [art-direction.md](art-direction.md), Skies), with more stars and the moon's pale gold path laid straight down the water from the Gate. The warmth comes from the alpenglow on the Rim and the lit town, not the sky.
2. `vista_glow:glow_<0-2>` (the Act 1 glow) bottom-centred on (128, 112), so it gathers in the Gate: `glow_0` from about 0.8 s, `glow_1` from 1.8 s, `glow_2` from 2.8 s.
3. `final_moon:moon` (32×32, 2-frame shimmer, 500 ms; pale peach-gold, as in Act 1; `moon_mid` and `moon_high` are its whiter stages if it ever climbs higher) centred on x = 128, rising from y = 126 (hidden behind the cliffs) at about 6 px/s, from 2 s, and stopping at y = 92: dead in the Gate, framed by its walls. (A new moon sprite: the Act 1 moon's markings read as a face once the whole disc is visible.)
4. `vista_rim:rim` at (0, 0), over the moon. The Gate is a V (see [art-opening.md](art-opening.md)); the moon stopping at y 92 rests in its mouth with the glow below it in the cleft.
5. `vista_twinkle:twinkle` on the `VISTA_BASINS` points (as in Act 1), if wanted.
6. `vista_cheryl_bath:cheryl_bath` at (0, 128): a year later, Cheryl sits in her tub, seen from behind and slightly above. The tub is an oval of white enamel with dark water inside, the moon's light lying on the water ahead and to her right. Above the water: a small head in the bathing cap, striped cream and navy like the costume, with the bun a bump on top, a little ash hair at the nape, and her cheek and nose showing as she turns slightly toward the moon, bare shoulders nearly three times its width with the costume's two navy straps and its striped back, and her arms out along the tub's sides. (At play size, a big head over narrow shoulders read as an egg on a plinth; keep the head small and the tub's rim curved. A solid navy cap went to a dark block against the night; the stripes and the turned cheek make it read as a woman at 1x.) (The Act 1 vista keeps `vista_cheryl:cheryl_tub`, perched on the edge in the same costume and cap.)
7. The title, once the moon has settled and the music has landed: `vista_title:title_0` (a half-dissolved first step) and then `title_1` (full), at (0, 0). MOONSHINE in cream with a dark outline and a soft violet glow, with a thin rule and a small moon-in-a-notch ornament beneath. The dev scene shows it at 10.5 s and 11.3 s. The credits roll over this picture.

## Underground

New sheets are in `game/src/art/act6_under.js`. On the dev page: `/dev/art.html?only=scene:act6_under&state=sighting` (also `sighting_dry`, `sighting_fill`, `sighting_full`, `sighting_plug`, `sighting_lit`, `basins` for every Basin state side by side, `keel`, `keel_open`, `windlass_night`). `<q>` is `nw`, `ne`, `sw`, `se` of a 2×2 piece.

| Design (position) | Frames | Layer |
| --- | --- | --- |
| The Basin (7–8, 5–6): dry with the plug glinting at the bottom | `basin:basin_dry_plug_<q>` | objects |
| …the plug's glint | `plug_glint:glint` (16×16, 4 frames, 900/90/150/90 ms: a point, then a brass-and-silver star). Put the frame's centre pixel (8, 8) on world (126, 93), the plug's bright edge: top-left (118, 85), or bottom-centre (126, 101). Draw it above the moonbeam | above overhead |
| …dry and empty | `basin:basin_dry_<q>` | objects |
| …filling | `basin:basin_fill_<q>_0..3` (350 ms; hold the last frame, then switch to full) | objects |
| …full and still | `basin:basin_full_<q>_0/1` (900 ms, the moon's reflection shivers a pixel) | objects |
| …full, the plug visible under the water | `basin:basin_plug_water_<q>_0/1` | objects |
| …full, the rim lit cyan | `basin:basin_lit_<q>_0/1` (260 ms) | objects |
| The moonlight column down the shaft, landing in the Basin | `moonbeam:over_moon_x<0-1>y<0-3>_0..2` (280 ms) over (7–8, 2–5) | overhead |
| The trim wheel (3–4, 1–2) | `sight_wall:trim_still_<q>`; turning `trim_<q>_0..3` (200 ms) | ground |
| The lift cage (6–7, 1–2), with its counterweight chain | `sight_wall:lift_closed_<q>`, `lift_open_<q>` | ground |
| The master stop (9, 6), the three-bars emblem with the Middle picked out | `master_stop:stop_locked`, `stop_risen` (the collar glowing), `stop_pulled` (16×32) | sprite |
| The Sighting Room's wall lamps (5, 1) and (10, 1), upper wall row: Keepers' sconces, a bronze bowl holding a moonglass moon (their emblem) | `sight_lamp:lamp_dead`; waking `lamp_wake_0..4` (300/120/120/220/600 ms, hold the last frame); lit `lamp_lit_0/1` (700 ms pulse) | ground |
| The sighting log on its stone stand (14, 4) | `sight_props:log_stand` | objects |
| Cheryl's shoes, side by side (beside the Basin, e.g. 6, 7) | `sight_props:shoes` | objects |
| Long Keel floor: the middle row's two worn grooves (y4) and the rows beside them (y3, y5) | `keel:keel_groove`, `keel_groove_b` (vary every few tiles); `keel_n` (y3), `keel_s` (y5) | ground |
| Long Keel lamps (2, 7, …, 37, upper wall row y1) waking | the existing `keel_hatch:lamp_dead`, `lamp_wake_0..4` (hold the last frame), `lamp_lit`, with `hull:floor_glow` under each lit one | ground |
| Long Keel ribs (every four tiles) | the existing `hull:face_rib_top/base` and `over_rib_v` | ground; overhead |
| The Sighting Room's door at the Keel's west end (0, 3–4), sliding up, the moon-in-bowl carving on its lintel | `keel:keel_door_closed_top/bot`, `keel_door_opening_top/bot_0..2` (260 ms), `keel_door_open_top/bot` | ground |
| Windlass Room at night: the chain coming in through the moonlit hawse (21, 3–4) | `windlass_night:hawse_in_top/bot_0..3` (220 ms, one link-length per loop; the same big opening and links as Act 5's hawse, the links travelling in toward the drum) | ground |
| Windlass Room at night: the Keepers' ladder beside the speaking tube (16, 1–2) | the same `keepers_rungs:rungs_top/rungs_bot` as Act 5 (see [art-act5.md](art-act5.md), Underground); unchanged at night | ground |
| The drum turning; the brake thrown | the existing `windlass_drum:drum_x<c>y<r>_0..3` and `brake:brake_thrown` | objects; sprite |
| The Long Keel hatch's emblem lighting (7–8, 1–2), then open | `keel_lit:keel_lit_<q>_0/1` (500 ms), then the existing `keel_hatch:keel_open_<q>` | ground |

## Items

| Design | Frame |
| --- | --- |
| The Shopkeeper's new plug ("same icon, shinier") | `items2:bath_plug_new`: the Act 1 `bath_plug` with brighter brass, a white highlight and two sparkles |

## Surface

Module `game/src/art/act6_surface.js`. Composed on the dev page: `/dev/art.html?only=scene:act6_surface&state=bilge_night|refill1|refill2|refill3|harbor_dawn|court_piano|steps_race`. The night states are shown under the night tint; the engine keeps lamp colors bright under it (`EMISSIVE` in `tints.js`), the dev page does not, so the lanterns look dimmer there than in play.

| Design item | Frames | Layer, placement |
| --- | --- | --- |
| Lantern poles along the dry Bilge quays (Dry Canal Day, night) | `lantern:lantern_a`, `lantern_b` (16×32, 2-frame flicker; `b` has bunting tied to the pole). The lantern hangs east of the pole | sprite, on the quays (the scene puts them at x 2, 7, 18, 24, 29 on row 6 and x 4, 10, 16, 22, 27 on row 12) |
| The pool of lamplight under each lantern | `lantern_pool:pool`, `pool_wide` (a dithered warm ring in emissive colors) | objects, the tile east of the pole |
| The crowd, the Mayor on the bridge | existing bodies: `crowd_a`, `crowd_b`, `counting_woman`, `basin_woman`, `watering_woman`, `kid`, `mayor:gesture_down` | sprites |
| The Teeth sliding away | `teeth_recede:recede_0..5` (176×48, 500/400/450/400/600/800 ms: stage 3, 2, 1, then gone) and `teeth_recede:gone` to hold | overhead sprite, where the Act 5 stages are: top-left (8·16, 12·16) |
| The canals refilling | `refill:rush_top` (the highest flooded row: water rushing west with a foaming lip), `refill:rush` (the rows under it), `refill:rush_deep` (the bottom row at stage 3); 4 frames each, 120/120/160 ms | ground, replacing the trench rows: stage 1 row 10; stage 2 rows 9 and 10; stage 3 rows 8 to 10 (the bridge deck at 12 and 13 stays). Then cut to the wet Bilge |
| The Boatman's boat lifting with the piano in it | `boatman_piano:piano_rock` (act6_sprites.js) | sprite at x = 23·16, its feet on the row below the water's surface: 11·16, 10·16, 9·16 for stages 1 to 3 |
| The piano delivered by Cheryl's door, upright and shining | `piano_delivered:piano_delivered` (32×32, ribbon, bow and a No. 9 tag; a glint every 1.6 s) | sprite, bottom-centred at (2·16+8, 13·16), just west of the door |
| The well's grate lifting (dawn) | `well_lift:well_lift_x<0-1>y<0-1>_<n>`, n = 0 closed, 1 half up, 2 up and leaning back | objects, replacing `court_well:well_*` at (9 to 10, 16 to 17) |
| Stair Race bunting over landing 2 | `bunting:over_bunting_a..d` (4 tiles, 2-frame flutter, 500 ms): pennants in cobalt, white, coral, mustard and sage on a sagging line | overhead, across the flight above the landing |
| The finish tape | `bunting:finish_tape_l/r`, broken `finish_broken_l/r` | objects, across the 2-wide flight |
| A little rope barrier round the open hundredth step | `step_barrier:step_barrier_x<0-3>y<0-2>` (4×3: four posts and a sagging rope round a 2-wide hole in the middle row, with a hand-lettered card on the front rope) | objects, with the hole (`steps:hollow_open_l/r`) at columns 1 and 2 of its middle row |
| The ferry level at her landing | `ferry_level:persistence_level` (176×80: no list, riding at her proper height, slack ropes, flag out) | sprite, same footprint as `ferry:persistence` (top-left (8·16, 8·16)) |
| The water back at the Harbor quay (morning) | existing `sea:wash_*` and `sea:sea_*` over the Act 5 hull row | ground: row 10 `sea:wash_a`, row 11 near sea |
| Luggage at the café (the Pelletiers, the Tourist) | `luggage:luggage` (a stack: hatbox, case, trunk), `luggage:suitcase` | objects |
