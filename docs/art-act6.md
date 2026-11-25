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
| Mott raising his empty jug | `mott_jug:raise_down_0` (jug raised), `raise_down_1` (tipped: empty) |
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

A round mirror of still water in the Basin's slate rim, holding what the Founders' mirror at the top of the shaft sees: the night sky with stars, the Rim with the Gate's notch, the dark Bowl below. It is drawn upright, like a picture in a round frame (a periscope shows the world the right way up), so the Gate and the moon's steps read at once.

Draw in this order:

1. `basin_view:basin` at (0, 0): the sky in the water, the reflected Bowl, the rim (its moonglass inlay dim), the floor beyond.
2. `basin_moon:moon` (24×24, 2-frame shimmer, 700 ms), centred on one of `BASIN_MOON_POS` (exported by the module):

   | Trim step | Moon centre | Reads as |
   | --- | --- | --- |
   | 0 | (176, 112) | just risen over the cliffs, off to the right of the Gate |
   | 1 | (150, 114) | closer, dipping toward the Gate's right wall |
   | 2 | (128, 130) | dead in the Gate, framed by its walls |
   | 3 (true) | (121, 130) | two fingers past the middle, touching the left wall |

3. `basin_cliffs:cliffs` at (0, 0), over the moon, so it sits behind the cliffs and inside the notch.
4. Moon true: `basin_rimlit:rimlit_0` … `rimlit_3` at (0, 0), about 400 ms apart. The inlay lights cyan from the bottom of the ring all the way round, with a bright leading edge. Hold `rimlit_3`.
5. The bath: `basin_ripples:ripple` (4 frames, 260 ms) and then `basin_cheryl:reflection` (2 frames, 900 ms, a 1-px settle), both at (0, 0). Her reflection leans in from the lower left of the rim: the silver bun with its coral tie, her face turned to the water, a coral shoulder. The ripples spread as broken arcs from where she sits.

### The final vista

The Act 1 composition made right. Draw in this order:

1. `vista_final:bowl_moonrise` at (0, 0): the Act 1 Bowl and roofs, with more stars in a clearer sky and the moon's path laid straight down the water from the Gate.
2. `vista_glow:glow_<0-2>` (the Act 1 glow) bottom-centred on (128, 112), so it gathers in the Gate: `glow_0` from about 0.8 s, `glow_1` from 1.8 s, `glow_2` from 2.8 s.
3. `final_moon:moon` (32×32, 2-frame shimmer, 500 ms) centred on x = 128, rising from y = 126 (hidden behind the cliffs) at about 6 px/s, from 2 s, and stopping at y = 92: dead in the Gate, framed by its walls. (A new moon sprite: the Act 1 moon's markings read as a face once the whole disc is visible.)
4. `vista_rim:rim` at (0, 0), over the moon.
5. `vista_twinkle:twinkle` on the `VISTA_BASINS` points (as in Act 1), if wanted.
6. `vista_cheryl:cheryl_tub` at (0, 128).
7. The title, once the moon has settled and the music has landed: `vista_title:title_0` (a half-dissolved first step) and then `title_1` (full), at (0, 0). MOONSHINE in cream with a dark outline and a soft violet glow, with a thin rule and a small moon-in-a-notch ornament beneath. The dev scene shows it at 10.5 s and 11.3 s. The credits roll over this picture.
