# Act 3: Downstairs (content)

The first descent: from the hundredth step, through the Step Gallery, the Cradle, the Lamp Halls, the Bunk Room, and the Chart Room, and up through the Founders' Door to the Crown at dusk. The design is [docs/design/03-downstairs.md](../../../../docs/design/03-downstairs.md); the art index is [docs/art-downstairs.md](../../../../docs/art-downstairs.md); the engine guide is [src/engine/README.md](../../engine/README.md). This folder follows the opening's and Act 2's structure and reuses their `grid.js` and dialog helpers.

## Files

| File | Contents |
|---|---|
| `index.js` | The maps, items, and scripts this folder hands to `src/content/index.js`. |
| `gallery.js` | The Step Gallery (24 × 11): the ladder, the lever, the mirror and its beam, the inlays, the moon-locked hatch, the grate. The Cradle (8 × 6): the disc and the chute. |
| `halls.js` | The Lamp Halls (32 × 14): light-pipes, lamps, the drop-ladder, the speaking tube, the valve, the flooded and the drowned passages. The Bunk Room (10 × 7): the dark lamp, the tool rack, the valve key. |
| `chart.js` | The Chart Room (16 × 14): the floor inlay and its first look, the Keeper's chair, cup, and ledger, the Founders' Door and its bolt. |
| `surface.js` | Act 3's states of Act 2's maps: the crypt with the door open and Ottilie's scene, the Archive at dusk, the Crown at dusk with the glowing moon-eyes, the residents, the vista, and the end card. |
| `common.js` | Act 3's items, the underground's wall, floor, and rib helpers, lamps, shared lines, and the settings every Downstairs map shares. |
| `tiles.js` | The tileset. |

## How Act 3 meets Act 2

Act 2's maps belong to Act 2 (`../act2/`). The way down is Act 2's own hook: `src/content/index.js` sets `act2.stepTo = 'step_gallery'`, and the hundredth step's ladder leads to (3, 3) there. For the way back up, `withAct3(maps)` in `surface.js` returns them with Act 3's states layered on, without editing them: extra exits, triggers, and entities; `when`s on the Act 2 entities that step aside (the closed Founders' Door, day-time Ambrose); extra tile patches; lighting and `onEnter` chained. `src/content/index.js` applies it to the whole map set. What it relies on in Act 2: the map ids `hundred_steps`, `crypt`, `archive`, `crown`; the crypt's door at (5–6, 1–2), its `founders_door` entity, and its stair at (1, 5); the Archive's door (7–8, 13) and its `ottilie`; the Crown's parapet row 14, stair (11–12, 14–15), and `ambrose`; the items `crowbar` and `paper_charcoal`.

## Handing on to Act 4, and reuse

- **The end.** After the dusk vista, if `act3.next` (exported from `index.js`) is set, Act 3 fades to black, sets `act3.done`, leaves Cheryl at (11, 12) on the Crown, and awaits `act3.next(g)`; `src/content/index.js` sets it to Act 4's `startAct4` once Act 4 registers. Until then it shows the end card and returns to the title.
- **Act 3's dusk states** (the Crown's darkness, glowing studs, residents, and ending triggers; the Crypt's and Archive's dusk lighting stays) switch off once `act4.started` or `epilogue` is set.
- **Flags later acts can read:** `act3.surfaced`, `act3.done`, `halls.valve` (the Fountain's feed jammed), `moonEyes.glow`, `got.shipPlan`, `founders.unbolted`.
- **For other underground maps:** `tiles.js` exports the tileset (`act3Tiles`), and `common.js` exports `deck`, `wall`, `floor`, `ribs`, `wallHotspots`, `lampEntity`, `nicheTile`, `discLight`, `keepLoops`, `UNDER` (music, ambience, footsteps), `WRONGNESS`, and the shared lines. Import rather than copy.

## Story flags

From the design: `act3.started`, `gallery.lever`, `gallery.mirror` (0–3), `gallery.hatch`, `got.disc`, `halls.ladder`, `lamp.<id>` (`gallery_w`, `gallery_e`, `halls_w`, `halls_e`, `bunk`), `got.valveKey`, `halls.valve`, `chart.seen`, `got.shipPlan`, `founders.unbolted`, `act3.surfaced`, `moonEyes.glow`. Added by the build: `gallery.lit1`, `gallery.lit2` (the beam has lit that inlay once), `crypt.ottilie` (Ottilie is in the crypt, during her scene), `act3.crypt` (her scene has played), `act3.done` (the end card has shown), and `n.*` counters for looks and first-time lines.

## Jumping to a moment

- Down the hundredth step: `?map=hundred_steps&x=10&y=18&facing=down&flags=act2.started,piano.slid,counter.left,step.open,basin.inside,got.crowbar,n.stepsArrived=1&items=crowbar,paper_charcoal`, then step down.
- The Step Gallery with the lever pulled: `?map=step_gallery&x=13&y=7&flags=act3.started,gallery.lever,gallery.mirror=0&items=crowbar,paper_charcoal`
- The Lamp Halls with the disc: `?map=lamp_halls&x=3&y=7&flags=act3.started,gallery.lever,gallery.hatch,got.disc&items=moonglass_disc,crowbar,paper_charcoal`
- Ready to turn the valve: `?map=lamp_halls&x=22&y=6&facing=up&flags=act3.started,got.disc,got.valveKey&items=moonglass_disc,valve_key`
- The Chart Room's first look: `?map=chart_room&x=7&y=12&facing=up&flags=act3.started,got.disc,halls.valve&items=moonglass_disc,paper_charcoal`
- Through the Founders' Door: `?map=chart_room&x=7&y=3&facing=up&flags=act3.started,got.disc,halls.valve,chart.seen,founders.unbolted&items=moonglass_disc`, then step up.
- The Crown at dusk: `?map=crown&x=18&y=7&facing=down&flags=founders.unbolted,act3.surfaced,moonEyes.glow,act3.crypt&items=moonglass_disc`; the vista and end card: add `&run=act3_end`.

Every script in this folder is also a named script (`?run=pullLever`, `?run=turnValve`, …), which lets `npm run check` see the ids they use.

## Tests

`tests/act3.spec.js` plays the act start to finish by keyboard alone and by pointer alone, from the open hundredth step, and saves screenshots as `tests/screenshots/act3-*.png`. The keyboard run brings Ottilie's paper and takes the rubbing on the way. The pointer run arrives without it, gets it from Ottilie in the crypt, and goes back down through the Founders' Door for the rubbing; it also takes the drop-ladder and the Steps' ladder both ways before the valve, and checks that the ladders decline after it. `node tests/act3-look.mjs <dir> [scene …]` saves still screenshots of Act 3's states for checking the art in place.

## Build decisions

Where the design left something open, or didn't work in play, this is what the build does. The writer (ibWBNxYUAE) has been told about the ones that change the design.

- **Wrongness 0.2** (the story bible's level for Act 3) is set on entering every Act 3 map and the Crown at dusk, since the audio's global amount isn't saved.
- **Ribs are rib faces on the walls, not overhead beams.** Step Gallery at x5, x17, x21 (the design's x9 and x13 lie on the diagonal beams' paths); Lamp Halls at x4, x8, x12, x16, x20, x24 where the wall is plain. Overhead ribs across the floor hid Cheryl, who is one tile wide (playtest, oPzkJ-fHFT).
- **The beam is lit**: small lights run along it and a glow sits where it lands, so the darkness doesn't dim it.
- **Each target's lines play the first time the beam lights it**; later turns just clunk and swing the beam.
- **The ladder up, the grate, and the drop-ladder are walked into** (walking up into the ladder, onto the open grate, or up into the dropped ladder climbs at once). Clicking or facing one gives its look line and then a "Climb up?" / "Climb down?" choice, so a pointer player can climb and the look line isn't lost. The hooked-up ladder's look is followed by "Pull the chain?".
- **The first arrival in the Step Gallery** starts nearly black and eases to the room's darkness as Cheryl's eyes adjust; after "Under the Steps." the camera drifts east across the gallery (mirror, inlays, hatch, lever) and back before "Thirty-one years I've gone up and down those Steps…" and "And all this was underneath. All this time." (lines from the writer, design 3f5f0ff) (playtest: the threshold needed more weight).
- **Lights stay inside small rooms**: the Cradle's daylight from the hatch and the Step Gallery's ladder light are kept within the walls, so no pool shows in the black outside.
- **The Bunk Room's dead lamp glints faintly** until it's lit, so there's something to walk toward in the dark.
- **Ladders up are climbed on screen**: Cheryl climbs out of sight before the fade.
- **The light-pipes** are at (6, 8), (14, 8), (22, 8), clear of the ribs, and solid. The one at (22, 8) is the art's short rod, so it doesn't reach up to Cheryl's feet when she stands at the valve.
- **The flooded passage's floor is walkable ground**, blocked by the passage hotspot until the valve turns, so arriving from the Chart Room at (25–26, 1) is on open floor. "Drained. Wet, but walkable. North." plays the first time Cheryl steps onto it (a hotspot on a walkable passage would catch clicks meant for walking).
- **The gushing pipe** is looked at from below, at (27, 6); after the valve it has a dry line.
- **The Bunk Room's doorway line** plays on first entering, as "Pitch dark in here…": a hotspot on the doorway would catch clicks meant for walking through it.
- **The Bunk Room's wall** is rows 0–1 (the tool rack, roster, and lamp on the upper row, used from row 2). Its lamp's light covers the room from its middle, so the rack at the far end reads once it's lit.
- **The Chart Room's first look is a light sweep, not a camera pan.** The room is exactly one screen, so the camera can't move; instead the room dims and a band of daylight passes up the floor from the hull to the Crown, then back down to the waterline at the hull's middle for "the sea comes up to… there," and fades into the room under the reveal cue.
- **The Chart Room's hotspots follow the art** (`chart:inlay_*`; the art index lists them): the sea comes up to the boundary between rows 7 and 8, crossing the hull at its widest. Town rows 5–6; hull rows 7–8 (above and below the water); waterline at the hull's ends (x3 and x12 from row 7) and the sea below it (rows 9–10); mast (7, 5–6); shaft and bowl (5, 5–10); chain from the bow (11, 7) to the anchor (12, 8–10); Sisters (8–9, 8, underwater); teapot (7–8, 7–8). The design's priority order applies. Every inlay tile is its own hotspot, so clicking the inlay looks at that part of it.
- **The Keeper's cup is on the table at (3, 4) and the ledger beside it at (4, 4)**, as the art draws them.
- **The Founders' Door** is looked at once, and the second interaction draws the bolt. The crowbar has its own line ("It's a bolt. It doesn't want prying; it wants pulling.").
- **Ottilie's crypt scene** has her come down the stair to (4, 3), beside Cheryl at (5, 3), and go back up. She carries her lamp (her `lamp_*` frames as a walking sheet) and lights the dusk crypt around her.
- **The Crown at dusk** has its own light: a dusk tint plus a light indigo darkness, with a cyan pool at each moon-eye and a warm one at each lamp post, so the studs read as lights. The residents stand at (6, 7) (Ambrose, at his step), (10, 10) (the Kid, by the sundial), and (14, 12) (the Woman with Watering Can, near the stair). Cheryl has one line on arriving: "Dusk already. And the plaza is full of little blue lights." The Crown has no music at dusk, only the `glow_shimmer` loop; by day it plays its music from `onEnter`.
- **The vista starts when Cheryl steps onto row 13**, anywhere along the parapet (the stair at x11–12 is beyond it). After the end card Cheryl is saved at (11, 12) on the plaza; on Continue, the way down the stair shows the end card again, until Act 4 exists.
- **The moon-eye studs on the Crown** are Act 2's (`CROWN_MOON_EYES`); Act 3 swaps them for their glowing frames at dusk.
- **Rubbing what Ottilie didn't mean** (structure pass, section 4): paper and charcoal on plain Founder walls says "Walls. Ottilie said floors, where the light falls.", and on the Step Gallery's inlays and the Bunk Room's duty roster that line comes before their own. On the mirror, once the shaft is open and the daylight falls there, it's the near miss: "Floor, and light, but nothing written on it. Not this one." (the shaft's light lands on the mirror's tile, so the mirror is the place to try it). The Ship Plan's first look, after its picture, adds "It's a map. Of us, I think." and "Ottilie will want to read the writing. She'll be wrong about it, but she can read it."
- **Lines added for states the design doesn't cover:** a lit lamp used again ("It's already lit. It doesn't want seconds."), the moons inlay with paper ("Four moons. I'll remember four moons."), the mirror with the disc, paper, or crowbar, the grate and the jammed valve with the crowbar, the passage and the drowned corridor with anything, the light-pipes and ledger with paper, the duty roster with paper, the Ship Plan on the inlay, Ottilie in the crypt if talked to mid-scene, and the dusk residents' "not now" answers to items.
