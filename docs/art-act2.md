# Art index: Act 2, part 1

Where to find the art the Act 2 content needs (docs/design/02-city.md, Art needed), by the request's item numbers. References are `sheet:frame`.

## Objects and tiles

Module `game/src/art/act2_objects.js`. See them composed at `/dev/art.html?only=scene:act2_street`.

| # | Piece | Frames | Layer |
| --- | --- | --- | --- |
| 10 | Icons | `items_act2:paper_charcoal`, `guidebook`, `crowbar` | inventory |
| 10 | Crowbar lying on the paving | `act2_props:crowbar_ground` (2 frames: a glint runs along it, 1400/160 ms) | sprite (16×16) or objects |
| 11 | The piano as one entity (32×32, bottom-centered) | `piano:piano_front` (wedged at an angle, as in the court), `piano_level` (standing level), `piano_slide_0/1` (tipping as it slides, 120 ms), `piano_back` (seen from behind and above, for the Fountain Square arch) | sprite |
| 12 | Water trickle across a landing | `act2_water:trickle_h` (4 frames; tiles chain along a row, west to east), ending in `trickle_end` (4 frames: the stream narrows and slips into the step's joint). Transparent overlays | objects |
| 13 | The piano's scrape marks along Lamp Street | `act2_marks:over_scrape_a`, `over_scrape_b`: transparent overlays on any paving; alternate a and b along a row and they join | objects |
| 14 | The Little School | sign band `school:school_sign_a`…`school_sign_d` (4 wall tiles reading LITTLE SCHOOL); `school_bellcote` (on the roof-front row); double doors `school_door_tl/tr` (wall row) over `school_door_bl/br` (base row). The rest of the facade is ordinary `buildings:` tiles. The `school` sheet has the same letters and plaster swaps as `buildings` (`ochre`, `rose`, `sky`, `white_sage`) | ground |
| 14 | School yard | paving `schoolyard:yard`, `yard_b`, `yard_c` (mix them); a chalked hopscotch `yard_hopscotch_n` over `yard_hopscotch_s` | ground |
| 14 | Low yard wall and gate | `schoolyard:yardwall` (east–west run), `yardwall_end_l/_r`, `yardwall_v` (running north–south), `yardwall_corner_w/_e` (an east–west run turning north); gate `yard_gate` (shut) / `yard_gate_open` | objects |
| 19 | The Clockmaker's shop front | fascia with a painted clock `school:clockshop_fascia_l/_r` (wall row); a window full of clocks `clockshop_window_l/_r` (base row); door from `buildings:door_top/door_bot`. Shown with `@ochre` | ground |
| 19 | Hanging clock sign | `act2_props:clock_sign`, over a wall tile beside the shop | objects |
| 19 | The Crown's south parapet with a stair cut | `crown_parapet:parapet` (run), `parapet_end_l` (ends with a newel post, cut to the east), `parapet_end_r` (post, cut to the west); put `street:stairs_l`, `stairs`, `stairs_r` in the cut, and the terrace face below (`street:retain`, `retain_base`) | objects (parapet), ground |
| 20 | Rope barrier (CANAL CLEANING. KEEP OUT.) | `act2_props:rope_l`, `rope_m`, `rope_r` (3 wide: posts and a sagging red rope with a hanging sign plate; the text is for the description, not legible) | objects |
| 20 | The Goat Path gate | `act2_props:goat_gate` (a shut wooden field gate tied with a rope loop), in a gap at Lamp Street's west edge | objects |
