# Act 5: High and Dry (content)

The afternoon after the reveal: the rope, the door, and the Tooth, ending at dusk in the Windlass Room with the bell's old clapper seated and Cheryl waiting for moonrise. The design is [docs/design/05-high-and-dry.md](../../../../docs/design/05-high-and-dry.md); the art index is [docs/art-act5.md](../../../../docs/art-act5.md); the engine guide is [src/engine/README.md](../../engine/README.md). This folder follows the earlier acts' structure and reuses their `grid.js`, tile helpers, and dialog helpers.

## Files

| File | Contents |
|---|---|
| `index.js` | The maps, items, and scripts this folder hands to `src/content/index.js`; `withAct5(maps)`. |
| `start.js` | `startAct5`: the act's opening (Act 4's ending calls it through its hook). |
| `bilge.js` | Act 5 on the dry Bilge: the Fishmonger's bucket, the Boatman from the broken edge, the ring, the rope climb, the bronze door, the Kid on the mud with the disc, the Movers, boats, crabs. |
| `harbor.js` | The risen Harbor (32 × 15, a new map): the Teeth in three stages, the ferry, Mott, the Kid's laps. The lamp room in Act 5: the Keeper at the window, the polish. |
| `relay.js` | The disc in the lamp, and the Kid's run to the door (a cutscene across the Harbor and the Bilge). |
| `teeth.js` | The Teeth's looks by stage, the surf's volume, and the camera's trip out to them. |
| `clockshop.js` | The Clockmaker's Shop (10 × 8, a new map), the doorstop, and the swap for Mott's jug. |
| `windlass.js` | The Bow Passage (18 × 8) and the Windlass Room (22 × 14), the Tooth, and the end of the act. Exports the `act5.next` hook for Act 6. |
| `town.js` | Act 5 on Fountain Square, the Shop, the Crown, the Archive, the Hundred Steps, Lamp Street, and Cistern Court. |
| `standins.js` | Geometry-only stand-ins for `bilge_dry` (Act 4) and `lamp_room` (Act 2 part 2), used only while those maps are missing. |
| `common.js`, `loops.js`, `tiles.js` | Items, story-state helpers, layering helpers; the ambient loops Act 5 manages; the tileset. |

## How Act 5 meets the other acts

- **Coming in:** Act 4's ending calls `startAct5(g)` through its hook (`act4End.next`, set in `src/content/index.js`) instead of its end card. It sets `act5.started` and `teeth.stage = 1`, shows "That afternoon.", and puts Cheryl at the top of the Water Stairs (23, 6). Until Act 4 is merged, start with `&run=act5_start`.
- **Layering:** `withAct5(maps)` wraps other acts' maps (Act 3's `withAct3` pattern). Once `act5.started`: on `bilge_dry` and `lamp_room` every earlier entity, trigger, and exit steps aside and Act 5's take over; on the town maps only the named people step aside (the Mayor's and the Tourist's talk is replaced; the Shopkeeper, the Movers, the piano, the Counting Woman in the Square, the Kid on the Steps, Act 3's dusk people on the Crown are hidden). Ways into Act 2's `harbor` and wet `bilge` (from the Goat Path, the Square, the lamp room) lead to `harbor_risen` and `bilge_dry` instead.
- **What it relies on:** map ids `bilge_dry`, `lamp_room`, `fountain_square`, `shop`, `crown`, `archive`, `hundred_steps`, `lamp_street`, `cistern_court` (and `belfry`, `goat_path` when they exist); the positions in the design's maps; entity ids `mayor`, `tourist`, `fountain`, `rope`, `shopkeeper`, `hat_display`, `shop_door`, `ambrose`, `ottilie`, `girl_1..3`, `old_man`, `neighbor*`, `kid`, `kid_after`; items `crowbar`, `guidebook`, `moonglass_disc`, `ship_plan`, `square_jug` (a stand-in definition is used until Act 4 defines it).
- **Going out:** after the **Moonrise.** card, `act5.next` (Act 6's `act6Start`, set in `src/content/index.js`) is called with the screen black and Cheryl sitting on the west chain coil (3, 10); without it, an end card and the title.
- **Act 6 and the epilogue:** Act 5's world (dry canals, the risen Harbor, wind, the Teeth) lasts through Act 6's night and gives way once `epilogue` is set (`started` is `act5.started` and not `epilogue`; the loops stop then). From `act6.started` the Windlass Room's evening light through the hawse and its loops are off; Act 6 brings its own.
- **Wrapped functions and the checker:** wrappers keep the originals as `act5Before` on entities, and wrapped map `onEnter`/`patches`/`lighting` are listed as `before_<map>_<key>` scripts, so `npm run check` still sees the ids they use. `act5_flags` lists the flags Act 5's helpers read.

## Story flags

From the design: `act5.started`, `teeth.stage` (1–3), `got.bucket`, `bucket.full`, `boatman.afloat`, `rope.tied`, `got.polish`, `disc.charged`, `door.open`, `got.clapper`, `tooth.out`, `tooth.set`. Added by the build: `teeth.seen` (the highest stage the Harbor's pan has shown), `keeper.polished`, `relay.ready` and `relay.run` (during the run only), `kid.gaveDisc`, `shop.guide`, `clockmaker.jug`, `clockmaker.doorBanged`, `passage.lit`, `windlass.seen`, `windlass.sat`, `windlass.late`, `act5.done`, and `n.*` / `met.*` counters.

## Jumping to a moment

Prior flags (everything Acts 1–4 leave set): `P=act1.moonrise,act1.done,act2.started,piano.slid,got.crowbar,counter.left,step.open,basin.inside,tourist.met,tourist.hasHat,ottilie.met,act3.started,got.disc,got.shipPlan,founders.unbolted,act3.surfaced,moonEyes.glow,act3.crypt,act3.done,act4.started,act4.risen,got.throat`

- The start of the act: `?map=bilge_dry&flags=$P&items=moon_chart,crowbar,guidebook,moonglass_disc,ship_plan,square_jug&run=act5_start`
- The lamp, polished, ready for the relay: `?map=lamp_room&x=3&y=4&facing=up&flags=$P,act5.started,keeper.polished,teeth.seen=1&items=moonglass_disc,ship_plan&run=chargeDisc`
- The Windlass Room, ready to finish: `?map=windlass_room&x=7&y=10&facing=up&flags=$P,act5.started,door.open,passage.lit,windlass.seen,tooth.out,got.clapper,teeth.stage=3&items=crowbar,clapper,moonglass_disc`

## Tests

`tests/act5.spec.js` plays the act start to finish by keyboard alone and by pointer alone, taking the threads in different orders, and saves screenshots as `tests/screenshots/act5-*.png`. The keyboard run does the rope, then the relay, reaches the Windlass Room without the clapper (levers the stump out, reads the pointer back up), climbs back up and crosses town for the clapper, and returns to seat it. The pointer run gets the clapper first, does the relay before the rope (the Kid throws the disc up from the mud), then the rope, and goes down once.

## Build decisions

Where the design left something open, or didn't work in play, this is what the build does. The writer (ibWBNxYUAE) has been told about the ones that change the design.

- **The risen Harbor is its own map, `harbor_risen`**, because it's a row taller than Act 2's. Its rows 0–8 follow the art task's Act 2 Harbor scene. Music on it and on `bilge_dry` plays from `onEnter`, so the relay's cutscene visits don't cut the relay music off.
- **The Teeth sort behind the ferry** (the Teeth as if on row 13, the ferry on row 14, both offset back into place). The first time Cheryl is on the Harbor at each stage (arriving, or back at the lighthouse door after the relay) the camera pans down and across to them, holds two seconds while the surf swells, and she says the stage's line in a box at the top of the screen, so the reef stays in view.
- **The Fishmonger's cellar door is a look, not a way in** ("Ice. Fish. A hatch I'm not opening.").
- **The Fishmonger is talked to across her stall**; her own stall has no hotspot of its own, so talking across it reaches her.
- **The ring and the rope:** the rope ties from the ring tile facing the broken edge, from beside the ring, or facing the quay wall from the ring. Walking down onto the rope (25, 8) climbs down; walking up into it from the mud (25, 9) climbs up. Clicking the ring or the rope offers "Climb down?" / "Climb up?" for pointer players.
- **The Movers are talked to from the bridge** (13, 10), beside the Big Mover; the rest of the mud is out of reach (the Boatman's boat fills the strip by the door).
- **The relay route:** the Kid dashes west along the Harbor quay (Mott: "Mind the edge, boy!"), bursts into the Bilge on the south quay, runs west, crosses the bridge to the north quay, runs east, jumps off the quay onto the mud by the Movers, hurdles a beached boat and the Boatman's boat, and slaps the disc into the eye. The eye shows the disc (`door_disc`) while it flares; then the door grinds open.
- **The relay music:** `relay` (15.8 s, cut by the audio task to fit) starts at "EGG" with no fade. The run takes about 10.5 s; the script then waits so that the barnacles crack and the door grinds open (3 s) just before the cue's last note, the egg timer's DING (`RELAY_DING`). The Kid's line is "Fifteen seconds, Miss!" (the design's "Fifty-two" was for the long cue).
- **The disc comes back from the Kid,** who waits on the mud by the open door with it: talking to him on the mud, or from the broken edge (he throws it up), returns it. He then goes back to his laps at the Harbor.
- **The Clockmaker sits at (2, 4), his back to us, working at the bench** (2, 3) as the art draws him (`bench_up`); he turns to talk.
- **The Counting Woman sits on landing 2 at (12, 17).** Her old seat (9, 19) would leave only the open step's tile to pass.
- **Ambrose is up in Act 4's belfry** (`ambrose_belfry`), with Act 5's talk. Act 4 shuts the tower door once Act 5 starts, so Act 5 opens it again (4-5, 6) as the way up. He stands inside the bell's hotspot, so the layer lists him first. (Without the belfry he'd be on the Crown at his step.)
- **The DRY CANAL DAY banner hangs over x16–21** (the design's 17–22 would put its east pole on a café chair).
- **The Windlass Room:** the first look pans east to the hawse and back; the drum creaks and shakes the screen a pixel every 7–12 s until the clapper seats. The ending walks Cheryl to the west coil and sits her on it (`sitcoil_down`, drawn up and right onto the coil).
- **Lines added for states the design doesn't cover:** the act's opening ("That afternoon." and two lines on the quay), Cheryl after the relay ("He did it. I heard him from here..."), the crowd residents in the Square, the Kid with the disc and egg timer, Mott with the jug and disc, the Clockmaker's yelp when the door swings shut, the Shop's display before and after, the lamp after the relay, the open step, the passage's lamps and door, the Windlass Room's lamps, the empty and seated socket, and declines for Act 5's items on the new people.

## Stand-ins

- `bilge_dry` and `lamp_room` have stand-ins, unused now that Act 4 and Act 2 part 2 are merged; they can be deleted once those branches are on `main`.
- **Act 4's mud is solid**, so the layer opens the strip by the door (24-27, 10) where the rope comes down.
