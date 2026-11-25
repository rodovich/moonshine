# Act 6: Moon in the Bowl (content)

The climax and the ending: the bell and the hauling in the Windlass Room, the Long Keel, the Sighting Room (the plug, the Basin, the trim, the master stop, the bath), the lift up to the dawn, the epilogue walk, the tick on the moon chart, the final vista, and the credits. The design is [docs/design/06-moon-in-the-bowl.md](../../../../docs/design/06-moon-in-the-bowl.md); the art index is [docs/art-act6.md](../../../../docs/art-act6.md); the audio order is in [docs/audio-direction.md](../../../../docs/audio-direction.md) ("In Act 6"). This folder follows the opening's and Act 2's structure and reuses their `grid.js`, `layout()`, and dialog helpers.

## Files

| File | Contents |
|---|---|
| `index.js` | The maps, items, lighting, and scripts this folder hands to `src/content/index.js`, and `addAct6(maps)`, which layers Act 6's states onto other acts' maps. |
| `keel.js` | The Long Keel (40 × 7): lamps that wake ahead of Cheryl, the grooves, the ribs, the Sighting Room's door. |
| `sighting.js` | The Sighting Room (16 × 13): the Basin, the trim wheel, moon true, the master stop, the sighting log, the bath, the lift. |
| `climax.js` | The Windlass Room's Act 6 state (Act 5's map): the bell, the brake, the hauling, the hatch to the Long Keel. |
| `montage.js` | The two montages (the lurch and the refill): instant cuts to other acts' maps at night. |
| `night.js` | The montage cuts' night props on other acts' maps (the dry Bilge's lanterns and crowd, the piano and the Boatman's boat, the canals refilling; the wet Bilge's crowd; the Keeper at the lamp room's window; Ambrose at the rope), shown only during a cut. |
| `dawn.js` | The lift ride, Cheryl climbing out of the well, "Morning." |
| `epilogue.js` | Act 6's states of the surface maps: everyone's morning-after line, the piano, the Stair Race, the Shopkeeper's plug, the door home. |
| `ending.js` | The tick on the chart, the final vista, the credits, back to the title. |
| `extend.js` | `extendMap(map, ext)`: adds entities, exits, triggers, patches, lights, sheets, and an `onEnter` to another act's map without editing it. |
| `state.js` | Other acts' map ids and positions Act 6 relies on, the hauling cue's link times, and `queueScript`. |
| `common.js` | Act 6's items, the state predicates (`night`, `epilogue`), and the Basin view. |
| `tiles.js` | The tileset for the two underground maps. |

## How Act 6 meets the other acts

Act 6 owns two maps (`long_keel`, `sighting_room`); everything else it touches belongs to another act. `addAct6(maps)` in `index.js` runs last in `src/content/index.js` and, for each map it knows that exists, applies an extension from `climax.js` or `epilogue.js` through `extendMap`. The base map's own patches, lights, `onEnter`, and ambient events keep running underneath; Act 6 hides the other act's residents while its state holds and adds its own, with ids prefixed `epi_` (the epilogue) or `act6_` (the Windlass Room). A wrapper's source includes what it wraps, so `npm run check` still sees the flags and ids inside.

What Act 6 relies on, by map:

- **`windlass_room`** (Act 5, `content/act5`, not merged yet): the layout in docs/design/05-high-and-dry.md (drum 5-20,4-7; hawse 21,3-4; hatch 7-8,1-2), with Act 5's entities `brake` (17,8), `speaking_tube` (15,2), and `coil_west` (3-4,10), which Act 6 hides at night and replaces. Act 5 exports `act5 = { next }`; `src/content/index.js` should set `act5.next = act6Start` (the `act6_start` script) when Act 5 is merged. Act 5 calls it right after its Moonrise card, the screen still black, with Cheryl sitting on the west coil. Until the map exists, the Long Keel's east exit is left out.
- **`belfry`** (Act 4; Ambrose there is `ambrose_belfry`), **`bilge_dry`** (Act 4), **`lamp_room`**, **`bilge`** (Act 2), **`harbor_risen`** (Act 5): the montage cuts, centred on walkable tiles given in `montage.js`. Act 6's props there (`night.js`) show only while `fx.montage` is set. A cut whose map isn't built (`harbor_risen`, for Mott's toast) is skipped.
- **`bilge`**, **`harbor`** (Act 2): the epilogue. Hidden there: `fishmonger`, `boatman`, `canal_0`, `canal_16`, `canal_26`, `water_stairs`; `mott`.
- **`cistern_court`**, **`flat`** (the opening), **`lamp_street`**, **`crown`**, **`archive`**, **`crypt`**, **`hundred_steps`**, **`fountain_square`**, **`shop`** (Act 2): the epilogue. Entity ids hidden there: `old_man`, `neighbor_morning`, `cat_morning`, `tub`, `well`, `kid_morning`; `girl_1..3`, `bench_man`, `watering_woman`; `ambrose`; `ottilie`; `founders_door`; `mayor`, `tourist`, `counting_woman_square`, the Movers and the piano, `fountain`; `shopkeeper`, `hat_display`; `counting_woman`, `basin_woman`, `kid`, `kid_after`.

The other builders were asked to make their own world states (dry canals, the dry Fountain, laundry, the risen Harbor, the Teeth, hull-creak loops, Act 3's Crown at dusk) come out false once `epilogue` is set, so every surface map falls back to its plain Act 2 daytime look.

## Story flags

From the design: `act6.started`, `bell.final`, `brake.thrown`, `chain.home`, `got.plug`, `basin.plugged`, `trim` (0-3), `moon.true`, `sisters.asleep`, `bathed`, `log.signed`, `epilogue`, `epi.leftCourt`, `epi.piano`, `got.newPlug`. Added by the build: `hatch.open` (the Long Keel hatch, after the emblem lights), `keel.lamps` (0-8, the Long Keel's lamps awake), `keel.doorOpen`, `epi.race` (the Stair Race has run), `epi.ottilie`, `act6.done` (the ending has played; set just before `game.complete`), `fx.*` flags that drive art during scenes (`fx.trim`, `fx.basinFill`, `fx.shoes`, `fx.liftOpen`, `fx.wellGrate`, `fx.dawn`, `fx.chart`, `fx.tape`, `fx.haul`, `fx.hatch`, `fx.montage`, `fx.lurch`, `fx.pianoBoat`, `fx.teeth`, `fx.mottToast`, `fx.refill`), and `n.*` / `epi.*` counters for looks and repeat lines.

## Items

`found_plug` (Bath Plug, found in the Basin, then left there) and `new_plug` (the Shopkeeper's gift). Both use the Act 1 plug icon. Act 1's own `bath_plug` id is left alone, since it went down the drain.

## Jumping to a moment

- The Long Keel, just after the hauling: `?map=long_keel&x=38&y=4&facing=left&flags=act1.moonrise,act2.started,act6.started,bell.final,brake.thrown,chain.home,hatch.open&items=moonglass_disc,crowbar,moon_chart`
- The Sighting Room, the plug in the bag: `?map=sighting_room&x=8&y=7&facing=up&flags=act6.started,chain.home,keel.doorOpen,n.sightEntered=1,got.plug&items=moonglass_disc,found_plug`
- Ready to trim: add `basin.plugged` and remove `found_plug`; stand at `x=4&y=3`.
- Ready to bathe: `...,basin.plugged,trim=3,moon.true,sisters.asleep` at `x=7&y=7`, then talk to the Basin.
- The lift: `...,bathed` at `x=6&y=3&facing=up`.
- The epilogue, piano due: `?map=lamp_street&x=3&y=1&facing=up&flags=act1.moonrise,act2.started,piano.slid,step.open,counter.left,act6.started,epilogue,epi.leftCourt,n.squeezeSeen=1`
- The final scene: `?map=cistern_court&x=3&y=12&facing=up&flags=act1.moonrise,act2.started,act6.started,epilogue,epi.leftCourt,epi.piano&items=moon_chart`, then step up.
- The vista and the credits alone: `?map=flat&x=5&y=7&run=act6_vista`

Every script here is also a named script (`?run=act6_trim`, `act6_bath`, `act6_dawn`, …).

## Tests

`tests/act6.spec.js` plays from the Long Keel to the title screen by keyboard alone and by pointer alone (the keyboard run also checks that Continue reopens the flat with the game complete), and tours the epilogue (the Skipping Girls, the Stair Race, the Mayor, the Shopkeeper's plug). Screenshots go to `tests/screenshots/act6-*.png`. `node tests/act6-look.mjs <dir>` saves a still of each epilogue map.

## Build decisions

Where the design left something open, or didn't work in play, this is what the build does. The writer (ibWBNxYUAE) has been told about the ones that change the design.

- **Act 6's states live on the other acts' maps through `extendMap`**, not in their files, as Act 3 does with `withAct3`. Each act keeps its own files; Act 6 runs last so it sees every map.
- **The Long Keel's lamps sit in the upper wall row (y1), glowing on the floor below (y3)**, as the art draws them, not on row 2 as in the design's sketch. They wake when Cheryl is three tiles away, each with a chime panned by where it is; ribs at x4, 8, 16, 20, 24, 28, 36.
- **The grooves are a line, not a hotspot**: Cheryl remarks on them the first time she walks in them, well along. A hotspot down the middle row caught every click meant for walking.
- **The Sighting Room's door slides up in a short scene** when Cheryl reaches x5, with her line. (Ambient timers pause while text shows, so it can't animate in the background.)
- **The Sighting Room has two Keepers' sconces (`sight_lamp`) on its north wall (x5 and x10)**, dark until the moon sits true, so "the lamps all along the walls flare" has lamps to flare.
- **The plug's glint** is `plug_glint:glint` over the dry Basin every few seconds, with the `plug_glint` sound, until the plug is taken. It draws among the characters, so the moonbeam overhead softens it.
- **Looking into the full Basin** shows the Basin view at the current trim, with a line for each position, so the player can check the moon before turning the wheel.
- **The moon glides between trim positions** (about 1.6 s) rather than jumping.
- **The trim wheel asks which way to turn** (toward the Gate, back, or leave it), so stopping two fingers past rather than dead in the Gate is the player's choice (from the playtest).
- **Items used on the moonbeam go to the Basin** below it, since a click on the beam lands on the shaft's hotspot.
- **Lines added from the playtest:** in the lift, "The cage creaks past numbers painted on the shaft wall. Nine. Eight. Up and up."; on surfacing, before the Old Man looks up, "Cistern Court. My own front door, from underneath." (the writer's line); halfway along the Long Keel, "A grate in the floor. Far below, a slow thump, and another. The Middle Sister, still at it."
- **Act 6 doesn't need the disc**: the Long Keel and the Sighting Room give Cheryl her pool of light themselves.
- **The master stop is pulled from below it (9, 7)** (she walks there first); the room's "1 px tilt" is `g.tilt(0, 1)` easing back over two seconds.
- **The bath**: Cheryl steps to (6, 6) beside the Basin, takes her shoes off there (the shoes stay on that tile while she bathes), and sits in the middle of the Basin. After **Later.** she stands at (7, 7) and the Long Keel's `keel` music plays in the room.
- **The lift doesn't work before the bath**, and says so ("Not yet. Not with the moon off to one side like that.").
- **The lift ride** is a full-screen picture of the shaft wall sliding down past her disc's pool of light, about four seconds.
- **Dawn is the art task's `dawn` lighting** (pink with a gold lift), on Cistern Court from the climb out of the well until Cheryl first leaves the court; it's plain day after that.
- **Cheryl climbs out at the well's mouth**, her cut-off frames drawn 20 px up from (9, 17) so the cut sits on the rim, and steps down to (9, 18).
- **The door home is a scripted exit** in the epilogue: "Not yet" until the piano has come, then the final scene; after the credits it's an ordinary door again.
- **The piano stands at (4-5, 12)**, east of Cheryl's door (the design's position; the art index's suggested spot west of it would cover the door). The Movers wait at (6, 12) and (7, 13) and leave down the Squeeze.
- **The Stair Race** comes up flight 4 and flight 3; the finish tape is across flight 3 at row 21, just below the open hundredth step, where the Counting Woman (7, 18) counts. The Kid starts at the top of landing 3 and stops on the line; the two runners stop on landing 3. Two crowds stand on landing 2 and two on landing 3; the bunting is over landing 2.
- **The rope barrier round the open hundredth step can be walked through.** The open step spans the whole of flight 3, so a solid barrier would cut the Steps in two. It sits on the ground layer. In the epilogue, walking onto the open step (Act 2's exit at (10, 19)) gets "Not today. I've been down enough for one week." and a step back, instead of "Go down?".
- **The Woman with Basin tips her basin when talked to**, on her doorstep (7, 16).
- **The Tourist stands at (18, 14) with her luggage at (19, 15)**, by the café.
- **The Crown's clock tick stops** in the epilogue (the clock is gone).
- **The final vista's title fades out again before the credits**, and the picture dims a little under them, so the lines read where they cross the moon. The roll starts with the roles: the title has just shown, so it isn't repeated as a line of text.
- **After the credits**, Cheryl is saved in the flat at (5, 7) with `act6.done` and `game.complete`; every map keeps its epilogue state.
- **The bell's 15-second timer** is an ambient event with `script: true`: it counts only while no scene plays, and resets when the map loads.
- **The montage cuts** follow the art task's composed scenes: lanterns on poles along both quays of the dry Bilge with pools of light, the crowd on the north quay (they sit down hard in the lurch and cheer in the refill), the Mayor on the bridge, the piano rolling along the mud into the Boatman's boat. The court cut starts at the chess table and pans up to the Neighbor's sheets. Ambrose pulls the rope from below the bell. The lamp room cut shows the Keeper at the window; the Teeth themselves aren't visible through it.
- **The Bilge and Harbor epilogue**: the Boatman afloat in his own (empty) boat; the Pelletiers at (15-16, 6) on the Harbor quay with their luggage at (17, 6); Mott on his bollard; the Keeper on the quay at (21, 7).
- **Lines added for states the design doesn't cover:** looking into the full Basin at each trim; the shaft's repeat; the walls; the log's signed repeat; the lift before the bath; the master stop after it's pulled; the Basin after the bath (a second repeat); the Long Keel's lamps and the shut door; the Windlass drum and hawse before the hauling, the coil, the sealed hatch, the tube's repeat; the Old Man after the piano ("Play it when you're ready..."); the tub with the new plug; the Movers ("Delivered."); the Stair Race runners and crowd; the Tourist's luggage; the Clockmaker's, Ambrose's, Ottilie's, and the Shopkeeper's answers to items.

## Stand-ins and gaps

- **The Windlass Room climax** (the bell, the brake, the hauling, the hatch) and the risen Harbor's cut (Mott's toast, the Teeth receding) wait for Act 5's maps. The bell's cut to the belfry and the other four montage cuts play now (`?run=act6_bell`, `act6_lurch`, `act6_refill`).
