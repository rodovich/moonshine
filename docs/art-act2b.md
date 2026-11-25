# Art index: Act 2, part 2 (the Goat Path, Harbor, lamp room, Bilge)

Where to find the art for the second half of [design/02-city.md](design/02-city.md). References are `sheet:frame`.

## Goat Path

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
