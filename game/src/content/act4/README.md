# Act 4: The List (content)

Waking the Sisters, and the sea going out. The design is [docs/design/04-the-list.md](../../../../docs/design/04-the-list.md); the art index is [docs/art-act4.md](../../../../docs/art-act4.md); the sound plan is in [docs/audio-direction.md](../../../../docs/audio-direction.md). This folder follows the opening's structure ([../opening/README.md](../opening/README.md)): maps are `compose(g)` functions turned into engine maps by `composedMap`.

## Files

| File | Contents |
|---|---|
| `index.js` | The act's maps, items, scripts, and the Ship Plan's Act 4 looks. |
| `common.js` | Items (copper throat, square jug), the act's state helpers, and `overlayMap`. |
| `tiles.js` | The tileset: Act 2's sheets, the underground's, and Act 4's. |
| `surface.js` | `withAct4(maps)`: Act 4's states of the Crown, Fountain Square, Lamp Street, the Archive, the Hundred Steps, Cistern Court, and the flat; `startAct4`. |
| `belfry.js` | The Belfry (10 × 10): the lever, the rope, Ambrose's ringing, the flyleaf. |
| `pumphall.js` | The Pump Hall (26 × 12): the Sisters, waking them, the rise; the Tide Wheel (12 × 10). |
| `climb.js` | The Emergency Shaft (6 × 30) and the Ice Cellar (10 × 8). |
| `bilge_dry.js` | The dry Bilge (32 × 17): the reveal, free roam, and the end of the act. |
| `seacave.js` | The Sea Cave (10 × 8), off the Goat Path. |
| `part2.js` | Act 4's states of Act 2 part 2's maps (called from `withAct4`). |

## Layering onto other acts' maps

Act 4 changes maps that the opening and Act 2 built. It doesn't edit their files. `overlayMap(base, { when, tiles, hide, entities, exits, triggers, ambient, onEnter, tileset })` returns a copy of a map with Act 4's state layered on while `when` holds: tile changes (computed over the base map's current tiles, including its own patches), base entities hidden by id, new entities, exits and triggers checked before the base's, and `onEnter` instead of the base's. `withAct4(maps)` applies the act's overlays to a maps object, so it can wrap maps that Act 3 has already wrapped; `src/content/index.js` calls it last.

Every Act 4 state yields once `act5.started` or `epilogue` is set (`act4(g)` in `common.js`), so Acts 5 and 6 can layer their own states the same way.

## Flags

`act4.started`, `clockmaker.atDoor`, `clockmaker.out`, `clock.lifted`, `ambrose.inBelfry`, `bell.restored`, `mayor.atCrown`, `read.flyleaf`, `got.throat`, `ottilie.readPlan`, `girls.heard` (0–3) and `heard.girl_<n>`, `hatch.open`, `stepped.rope`, `pump.throat`, `pump.order` (0–3), `pumps.running`, `rise.tried`, `pumps.burst`, `shaft.slab`, `cellar.shut`, `act4.risen`, `act4.done`. Short-lived flags drive art during scenes: `fx.bell`, `fx.rope`, `fx.valve.<sister>`, `fx.cough.<sister>`, `fx.grates`, `fx.flood`, `fx.hatch`.

## Jumping to a moment

- The start: `?map=flat&x=8&y=4&flags=act1.moonrise,act2.started,act2.done,piano.slid,counter.left,step.open,act3.surfaced,act3.done,founders.unbolted,halls.valve,got.crowbar&items=moon_chart,guidebook,crowbar,ship_plan&run=act4_start`
- The Crown, ready to ring: add `clockmaker.out,clock.lifted` and start at `?map=crown&x=6&y=8&facing=up`
- The Pump Hall: `?map=pump_hall&x=2&y=3&flags=act4.started,bell.restored,mayor.atCrown,hatch.open&items=copper_throat`
- The reveal: `?map=ice_cellar&x=6&y=2&flags=act4.started,pumps.burst,cellar.shut&run=act4_reveal`

## Hand-offs

- **In:** Act 3's ending calls `act3.next(g)`, which `src/content/index.js` sets to `startAct4`. `startAct4` shows the Morning card, sets `act4.started` and Wrongness 0.35, and wakes Cheryl in her flat.
- **Out:** looking at the bronze door ends the act. `endOfAct4` says the door lines, sets `act4.done`, then calls `act4End.next(g)` if Act 5 has set it; otherwise the end card and the title screen.
- **Act 2 part 2:** `part2.js` lays Act 4 over the Bilge (flood stages 1 and 2 by `listStage`, the piano in the canal, the Movers fishing, the Fishmonger on her crate), the Goat Path (Mott on his crates at (3, 13) and the copper-throat scene; the sea-cave mouth (0, 21) as an exit), the Harbor (Mott's empty bollard, the ferry, the office note), and the lamp room (the Keeper).

## Build decisions

- **The surface maps keep their ids**; Act 4 is a state of them, not new maps, except the dry Bilge (`bilge_dry`), a separate map per the design.
- **The Clockmaker** opens the tower door a crack on the first knock in Act 4 and stays in the doorway (4, 7) until shown the guidebook; then he runs to the sundial (13, 10). The tower door becomes an exit to the Belfry.
- **Ambrose goes up with Cheryl:** talking to him after the lever, he walks into the tower and the map changes to the Belfry with him at the rope (4, 3), where the ringing plays at once.
- **The cordon** answers bumps with the Mayor's line only when Cheryl walks into it facing it, then steps her back. Once the Mayor has gone to the Crown, the south rope (11–12, 11) is walkable.
- **The rise:** the floor eases a pixel back toward level (`tilt`) when the grates drain, then tilts two pixels the other way as she staggers east to (20, 6); the tilt holds until she leaves by the shaft. The flood spreads one column at a time from x2 to x18.
- **The climb** shows Cheryl in her climbing pose the whole way. The slab opens on the step onto row 1.
- **The reveal pan** runs east along the canal at one tile per 0.4 s, holds at the canal mouth, and settles on the bronze door before gliding back.
- **The dry Bilge's top rows** (houses, the fish stalls) are composed here to match 02-city's Bilge layout, since the wet Bilge isn't built yet. The Kid runs the west reach of the mud (x1–10), so he doesn't pass through the Movers and the Boatman. Crabs patrol short beats.
- **After the Act 3 builder's playtest:** the Tide Wheel's channel edges are walkable, so the wheel can be looked at, and the daylight grate to the sea cave is in the west wall at (0, 7), beside the archway, where it can be reached (the design puts it in the east wall, which the channel cuts off). The flood's front is ragged and keeps creeping east after the burst, never past x18. The Thin and Stout valves, before the throat, name the Middle Sister. Overlays skip a base map's timed event if its character has been swapped for an Act 4 one; the Old Man's fidget has an Act 4 version.
- **Lines added** for states the design doesn't cover: the lever after pulling, the rope after the bell, the Clockmaker's declines, the tower door's states, the fish in the Square (dry and flowing), the crate in the cellar, the piano on the mud, the main pipe, the dry grates, the second tide-pool look.
