# Art the descriptions promise (QA description sweep)

QA (task A6UaxuFHMT) compared every interactable's text with the art drawn around it, on main at d4367df. This page lists the art drawn so the two agree. New sheets are in `game/src/art/sweep.js`, drafted from `/tmp/moonshine-art/sweep.py`. Dev page: `?only=scene:sweep` shows each piece beside what it replaces.

Where the text is canonical in the design docs, the existing frames changed in place, so nothing needs placing. Everywhere else the art is new, under new names, and the act's owner chooses whether to use it or reword the line.

## Changed in place (no placement needed)

| What | Frames | Why |
|---|---|---|
| The Harbor's nets | `harbor_props:nets` | "Nets, drying." It read as a green bush. Now a brown net hung over a rail between two posts, with cork floats and a corner trailing to the stones. |
| The belfry bell | `belfry_bell:*` (palette only) | "Green and enormous" (04-the-list.md). The bell is verdigris, with a few worn bronze glints. Its steel clapper is unchanged. |
| The Clockmaker's doorstop | `clockshop:clapper` | "Green with age" (05-high-and-dry.md): the bell's old bronze clapper, green, with bronze where it's been knocked. |
| The court's lemon tree | `court_tree:over_lemon_*` | "Three lemons a year." Three lemons now, not five. |

`sweep.py` patches these four sheets after their own module drafts run (`act5_surface`, `act4_surface`, `court`). Rerun it if you regenerate those modules.

## New frames, for the owners to place

| What | Frames | Where | Layer |
|---|---|---|---|
| The Crown's tower door, wide open (Acts 4-6) | `tower_open:tower_open_x{0,1}y{0,1}` | Map (4-5, 5-6), in place of `bell_tower:bell_tower_x{2,3}y{5,6}` | ground |
| The Crown, epilogue: the Mayor's clock gone, a paler square where it hung | `tower_noclock:noclock_x{0,1}y{0,1,2}` | Map (4-5, 2-4), in place of `bell_tower:bell_tower_x{2,3}y{2,3,4}` | ground |
| The crypt's Founders' door, epilogue: open, with Ottilie's sign (OPEN, and a line of small writing) | `founders_door_sign:founders_door_sign_x{0,1}y{0,1}` | The Archive map (5-6, 1-2), in place of `founders_door:founders_door_x*y*` | ground |
| The Shop window, epilogue: the guidebook open at the Hundred Steps | `shop_epi:display_book_l/_r` | (7, 5) and (8, 5), in place of `shop:display_l/_r` | detail |
| The sea cave at low tide (Act 4), the old Goat Path | `cave_low:cave_mouth_low` | (0, 21), in place of `goatpath:cave_mouth` | ground |
| The sea cave at low tide, the rebuilt Goat Path | `cliff_low:x1y37_low`, `cliff_low:x1y38_low` | (1, 37) and (1, 38), in place of `goatcliff:x1y37`/`x1y38` | ground |
| The Water Stairs, Act 4: two more steps under | `bilge_deep:wstairs_deep_{l,m,r}` | The Bilge (22-25, 7), in place of `bilge_flood:wstairs_wet_*` (l, m, m, r) | ground |
| The court's back line, Acts 5-6: "flat as flags. Whiter than ever." | `laundry_wind:backline_wind_{a..h}_{n,s}` (2 frames, 160 ms) | Cistern Court (11-18, 1-2), in place of `laundry:backline_sheets_*@grey`; no `@grey` | detail. **Not used.** The writer reworded instead: the Neighbor says her whites are whiter than ever, and Cheryl still sees them as grey. So the sheets stay grey, and white sheets would contradict her. |
