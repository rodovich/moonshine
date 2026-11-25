# Art index: Act 2, part 2 (the Goat Path, Harbor, lamp room, Bilge)

Where to find the art for the second half of [design/02-city.md](design/02-city.md). References are `sheet:frame`.

## Goat Path, rebuilt (the structure pass)

Module `game/src/art/act2b_goat.js`; dev page `?only=scene:act2b_cliff`. Per [design/structure-pass.md](design/structure-pass.md), "The Goat Path, rebuilt", the map is a natural cliff path, 16×42 tiles, down the island's west side. It is laid out to the Act 2 builder's rectangles on `content/act2-structure`.

It is painted as one picture and sliced into ground tiles, not built from autotiles, because a path assembled from one-tile pieces read as a grid in playtest. The painting has bare limestone shelves, scree fans below the steep places, gorse and wild thyme, and goat-worn terra rossa earth. Rough cut steps go where the path is steep, a rock face drops under each shelf's lower edge, and there are two lichened outcrops the path goes round.

- **Placement:** `GOAT_PATH_TILES` (exported) gives each cell's ground frame. They are in the `goatcliff`, `goatcliff_a`, … sheets as `x<col>y<row>`; identical tiles share a name, and tiles with water are animated (3 frames, 420 ms) and named by base. `null` cells are the builder's own: Mott's shack (`mott_shack:shack_x<c>y<r>` at 2–5, 12–15) and the Bilge paving (`street:pave`, 9–15, 39–41).
- **Walk mask:** `GOAT_PATH_WALK` is the mask the picture is painted to. `.` path, `s` steps, `#` rock, `~` sea, `v` the viewpoint ledge (1, 21–22), `H` the shack, `D` its door (3, 15), `j` the jugs (7–8, 14), `C` the sea cave mouth (1, 37), `R` the lower town's roofs (14–15, 28–38), `P` Bilge paving, `G` in from Lamp Street (15, 1–3), `X` out to the Bilge (15, 39–41).
- **Height cues:**
  - At the top, the sea far below on the west, with gulls wheeling under the path.
  - The lower town far below to the east (13–15, 4–7), a mass of tiny hazed rooftops.
  - The hairpin viewpoint (1, 21–22), a ledge of flat stones out over the drop.
  - From row 28, the sea close, breaking on the rocks.
  - The town's roofs at eye level at the east edge (14–15, 28–38).
- **Rails:** post-and-rope, painted into the ground tiles. They run down the west side of the steps at (2, 18–21), and round the viewpoint ledge.
- **Gulls:** `gull:wheel` (8 frames, 160 ms). It's a 32×32 sprite or detail piece of a gull flying a small loop. Set two or three over the west drop, below the path: about (0–1, 4–6) and (0, 13), and off the viewpoint at (0, 19).
- **Retired:** the `goatpath:beans_*` garden beds and `wall*` terrace walls aren't used on the rebuilt path. They stay in the module for old saves and maps.

## Goat Path (Act 2's original 16×24 map)

Module `game/src/art/act2b_goat.js`; dev page `?only=scene:act2b_goat` (the 16×24 map from [design/02-city.md](design/02-city.md), "Goat Path"). Glyphs refer to that map.

| Glyph / piece (position) | Frames | Layer |
| --- | --- | --- |
| `:` packed dirt path | `goatpath:path_a`, `path_b`, `path_c` (scuffed); mix by a hash of the position | ground |
| `g` bean terraces | `goatpath:beans_a`, `beans_b` (alternate by x + y) | ground |
| `=` terrace wall (dry-stone face dropping to the row below) | `goatpath:wall`; where the path runs past its end `wall_end_r` (path to the east) / `wall_end_l` (path to the west); the north–south edge at (11, 1–3) `wall_v`; above the cove (row 19) `wall_cove` (4 frames, water at its foot) | ground |
| `~` the sea far below the cliffs | `goatpath:sea` (4 frames); next to land use the tile with the cliff lip on that side: `cliff_e` (land to the east), `cliff_w` (land to the west), `cliff_s` (land to the south, e.g. row 0), `cliff_n` (land to the north, e.g. row 23); all 4 frames, foam working at the cliff foot | ground |
| `%` the cove (rows 20–22) | `goatpath:cove` (4 frames); its west shore beside the path (x3) `cove_w` | ground |
| `O` the sea cave mouth (0, 21) | `goatpath:cave_mouth` (4 frames: an arch in the cliff, dark inside, the tide running in, a glint of brass far back on frames 1–2) | ground |
| `R` `#` `w` `D` Mott's shack (1–4, 9–12) | `mott_shack:shack_x<col>y<row>` at (1 + col, 9 + row): rows 9–10 the patched tin roof, row 11 the wall with the window (the still glints: `shack_x1y2` and `shack_x2y2` animate, 2 frames, 1600/400 ms), row 12 the door (2, 12) with its GONE FERRYING / (NOT REALLY) sign | ground |
| `cc` the stack of empty square jugs (3–4, 14) | `mott_jugs:jugs_l`, `jugs_r` (match `items_act4:square_jug`) | objects |
| Goats (two) | `goat:<dir>_0`, `_1`, `_2` (walk: `_0` stands, `_1`/`_2` step), `eat_left`, `eat_right`, `eat_down` (2 frames, 300 ms: head down, chewing); the second goat uses palette `@brown` | sprite (16×16, bottom-centred) |

## Harbor and Bilge

Module `game/src/art/act2b_harbor.js`; dev page `?only=scene:act2b_harbor` (`&state=harbor`, the default: the 32×14 Harbor at its normal sea level; `&state=bilge`: the wet Bilge with the fish stalls). Positions refer to the maps in [design/02-city.md](design/02-city.md), "Harbor" and "The Bilge". The Harbor also uses `sea:*`, `harbor_props:*`, `lighthouse:*`, `street:pave_*` and `ferry_level:*`.

| Piece (position) | Frames | Layer |
| --- | --- | --- |
| Harbor `~` backdrop, the Prow's rock face (rows 0–2, wherever no house or lighthouse stands) | `headland:cliff_nw`, `cliff_ne`, `cliff_sw`, `cliff_se` (a 32×32 block of boulders with grass and gorse; pick by `y % 2` (n/s) and `x % 2` (w/e)); swap in `cliff_gull` here and there (2 frames, 1800/700 ms: a gull on a ledge) | ground |
| Harbor row 3 under the rock, where it meets the quay | `headland:cliff_foot_a`, `cliff_foot_b` (alternate by `x % 2`: scree and a contact line) | ground |
| Where the Goat stair was (2–3, 0–3) | Since the structure pass, plain `headland:cliff_*` and `cliff_foot_*` like the rest of the rock. The Goat Path now comes down to the Bilge, and `goatstair_*` is retired | ground |
| Quay edge over the water (row 9, x0–29) | `harbor_quay:quay_a`, `quay_b` (alternate by `x % 2`; 4 frames, 300 ms: coping, a two-course wall face, the wet weed band, foam working at the foot) | ground |
| Keyhole sea arch (30–31, 9) | `harbor_quay:keyhole_l`, `keyhole_r` (4 frames, 300 ms: the quay's corner with the arch cut through it and the sea running in; no chain, which is Act 5) | ground |
| Bilge fish stalls (2–3, 5), (5–6, 5), (8–9, 5) | `fish_stall:stall_l`, `stall_r` (trestle table with fish on ice, 3/4 view) | objects |
| Their awnings (row 4 above each stall) | `fish_stall:over_stall_l`, `over_stall_r` (striped canopy and valance on poles); coral by default, `@blue` and `@green` for the other two stalls | overhead |

## The structure pass's west ends, signs and culvert

The Goat Path now comes down to the Bilge, not the Harbor ([design/structure-pass.md](design/structure-pass.md), "Exits that change", "The Harbor and the canal"). These frames are in `game/src/art/act2b_harbor.js`. The dev page is `?only=scene:act2b_harbor` with `&state=bilge` (wet), `bilge2` (Act 4 stage 2), `bilge_dry` or `harbor`.

| Piece (position) | Frames | Layer |
| --- | --- | --- |
| The Bilge's west end, wet: Act 2, Act 4 stage 1, the Act 6 epilogue (0, 11–13) | `bilge_west:steps_n_f1` (11) and `steps_m_f1` (12) are 4 frames, 280 ms, over the ankle-deep flood; `steps_s` (13) is over paving. Two broad rough steps climb west off the quay to the Goat Path's earth, with a boulder against the canal bank and the cliff's foot at the south | ground |
| …Act 4 stage 2, the south quay all under (0, 11–13) | `bilge_west:steps_n_f2`, `steps_m_f2`, `steps_s_f2` (4 frames, 280 ms) | ground |
| …the dry Bilge, Act 4 reveal and Act 5 (0, 12–14) | `bilge_west:steps_n_dry`, `steps_m_dry`, `steps_s_dry` (over the wet paving where the flood was) | ground |
| The cliff the path comes down, in place of the south roofs at x0 (wet: rows 14–15; dry: 15–16) | `bilge_west:cliff_a` above, `cliff_b` below | ground |
| 'HARBOR →' sign at the Bilge's east end (29–31, 10; the dry Bilge's quay is lower, so 29–31, 12 there) | `signpost:harbor_0`, `_1`, `_2`: a whitewashed board on two posts, the letters in blue paint | objects |
| '← THE BILGE' sign at the Harbor's west end (1–3, 4) | `signpost:bilge_0`, `_1`, `_2` | objects |
| The canal running out under the Harbor quay (1–2, 9) | `harbor_culvert:culvert_l`, `culvert_r` (4 frames, 300 ms: a low arch in the quay wall, the canal water coming out of the dark); risen Harbor (Act 5): `culvert_dry_l`, `culvert_dry_r` (empty, a trickle) | ground |
| …its water spreading on the harbor (1–2, 10; Act 2 and Act 6 only) | `harbor_culvert:outflow_l`, `outflow_r` (4 frames, 300 ms: foam rings fanning out on the sea) | ground |

The QA description sweep added or changed art for this act: see [art-sweep.md](art-sweep.md).
