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
