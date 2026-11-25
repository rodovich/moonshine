# Slice 2 — The Morning After: the Wider City

This is the build-ready design for Act 2 ([overview](overview.md), [story bible](../story-bible.md)). It picks up where [01-opening.md](01-opening.md) ends: the morning after Moonshine Night, when Cheryl walks out of Cistern Court through the Squeeze. It ends when she pries up the hundredth step and climbs down into the dark.

## The slice in brief

Tessel is open. Cheryl follows the piano's scrape marks from the Squeeze to the Hundred Steps, where two problems block her lead:

- **The piano** has rolled down the Steps in the night and jammed in the arch to Fountain Square. The Piano Movers can't shift it: "If it was greased, it'd shoot through like a pip." Cheryl's lavender soap does the job. The piano shoots into the Square with the Movers chasing it, and they leave their **crowbar** behind.
- **The Counting Woman**, Keeper of the Count, sits on one particular step every morning, counting ninety-nine and refusing to move. A stranded, sunburnt Tourist in Fountain Square will trade her guidebook for a hat. The guidebook says, in print, that the Hundred Steps number ninety-nine, and the Counting Woman storms off to the Mayor.

The water that residents tip down the Steps for luck runs into the joint of the step the Counting Woman was sitting on, and vanishes. "Steps don't drink." Cheryl pries it up with the crowbar and finds a bronze ladder going down into the dark: *Ninety-nine steps up to the Crown, and the hundredth step goes down.*

Around the two threads, the player meets nearly everyone who matters later, and each of them has a confident wrong theory about last night.

**Playtime:** 30–40 minutes. **Maps:** 11 (8 outdoor, 3 interiors). **NPCs:** 21 (4 of them return from Act 1). **New items:** 3 (paper and charcoal, guidebook, crowbar), plus the hat and moon chart from the opening's morning.

### What the slice adds to the player's skills

| Skill | Where |
| --- | --- |
| Finding a long way round when the short way is blocked | The piano blocks the Steps; the Goat Path loops down the Back to the Harbor |
| Using an item from an earlier area | Soap (Act 1) on the piano; the hat from the flat |
| Showing an item without losing it | Guidebook to the Counting Woman (Cheryl keeps it) |
| Observing the world, not just clicking it | Water vanishing into a step |
| Gathering hints from several people | The saying, the "bonk," the wet feet, the scrape marks |

## Map of the slice

```
                         ┌─────────────┐
                         │  THE CROWN  │──door──►[ ARCHIVE ]──stair──►[ CRYPT ]
                         └──────┬──────┘
 [CISTERN COURT]──Squeeze──[ LAMP STREET ]───────west gate──────┐
                                │                               │
                         ┌──────┴──────┐                 ┌──────┴──────┐
                         │HUNDRED STEPS│ (hundredth step │  GOAT PATH  │
                         │             │  → END OF ACT 2)│ Mott's shack│
                         └──────┬──────┘                 │  sea cave   │
                    arch (piano jams it)                 └──────┬──────┘
                         ┌──────┴──────┐                        │
          [ SHOP ]◄─door─│FOUNTAIN SQ. │                        │
                         └──────┬──────┘                        │
                         ┌──────┴──────┐                 ┌──────┴──────┐
                         │  THE BILGE  │────east─────────│   HARBOR    │──door──►[ LAMP ROOM ]
                         └─────────────┘                 └─────────────┘
```

All maps are in the **day** tint. Until the piano is moved, the only way from the upper town to Fountain Square is the long loop: Lamp Street → Goat Path → Harbor → Bilge → Square. That loop takes about two minutes of walking and passes Mott, the sea cave, the Keeper, the Fishmonger, and the Boatman, which is the point.

### Exits

| From | Tiles | To | Arrive at, facing |
| --- | --- | --- | --- |
| Cistern Court, Squeeze | (15–16, 25) | Lamp Street | (3–4, 1), down |
| Lamp Street, Squeeze stair | (3–4, 0) | Cistern Court | (15–16, 23), up |
| Lamp Street, Crown stair | (22–23, 0) | The Crown | (11–12, 13), up |
| Lamp Street, west gate | (0, 9–11) | Goat Path | (13–14, 1), down |
| Lamp Street, Steps | (27–28, 15) | Hundred Steps | (6–7, 1), down |
| The Crown, south stair | (11–12, 15) | Lamp Street | (22–23, 5), down |
| The Crown, Dome door | (18–19, 6) | Archive | (7–8, 12), up |
| Archive, door | (7–8, 13) | The Crown | (18–19, 7), down |
| Archive, stair | (13, 11) | Crypt | (2, 5), right |
| Crypt, stair | (1, 5) | Archive | (12, 11), left |
| Hundred Steps, top | (6–7, 0) | Lamp Street | (27–28, 12), up |
| Hundred Steps, arch | (6–7, 41) | Fountain Square | (11–12, 4), down. **Blocked by the piano until it slides.** |
| Fountain Square, north arch | (11–12, 0) | Hundred Steps | (6–7, 39), up. **Blocked by the piano until it slides.** |
| Fountain Square, Shop door | (4, 3) | Shop | (4–5, 6), up |
| Shop, door | (4–5, 7) | Fountain Square | (4, 4), down |
| Fountain Square, south | (11–12, 17) | The Bilge | (11–12, 4), down |
| The Bilge, north | (11–12, 0) | Fountain Square | (11–12, 15), up |
| The Bilge, east | (31, 11–13) | Harbor | (1, 6–8), right |
| Harbor, west | (0, 6–8) | The Bilge | (30, 11–13), left |
| Harbor, Goat stair | (2–3, 0) | Goat Path | (1–2, 22), up |
| Harbor, lighthouse door | (27–28, 3) | Lamp room | (3–4, 6), up |
| Lamp room, stair door | (3–4, 7) | Harbor | (27–28, 4), down |
| Goat Path, top | (13–14, 0) | Lamp Street | (1, 9–11), right |
| Goat Path, bottom | (1–2, 23) | Harbor | (2–3, 4), down |

## Maps

The legend below is shared by all maps in this slice. Each map lists its own named spots and characters. Building faces follow the art direction's building recipe (roof, front edge, wall rows, base row with doors); "R" marks the roofs of buildings whose fronts face the camera, and "r" the roofs of buildings seen only from above (their fronts face away).

| Glyph | Meaning | Walkable |
| --- | --- | --- |
| `~` | Backdrop: cliff, distant roofs, or void | No |
| `R` `r` | Roof surfaces | No |
| `#` `w` | Wall, window | No |
| `D` | Door (an exit or locked; see the map's notes) | Exit only |
| `=` | Retaining wall, coping, low wall, or parapet | No |
| `.` | Limestone paving | Yes |
| `,` | Yard paving | Yes |
| `:` | Shaded paving (under an arch) or dirt path | Yes |
| `^` | Stairs | Yes |
| `%` | Water | No |
| `n` `s` | Canal bank: far quay wall face / near quay lip | No |
| `B` | Stepped bridge | Yes |
| `g` | Terrace garden beds | No |
| Other letters | Named in each map's notes | As noted |

Characters, lamp posts, benches you can stand behind, and small objects are entities placed at the coordinates listed; they aren't drawn in the grids unless noted.

### Lamp Street (32 × 16)

The winding lane under the Crown. Cheryl taught at the Little School here for twenty-nine years. A long scrape in the cobbles runs from the foot of the Squeeze stair (3–4, 5) east along the street to the top of the Hundred Steps (27–28, 13).

```
     x 0         1         2         3
       01234567890123456789012345678901
 y  0  RRR^^RRRRRRRRRRRRRRRRR^^RRRRRRRR   ^ at x3-4: the Squeeze stair (up to Cistern Court)
    1  RRR^^RRRRRRRRRRRRRRRRR^^RRRRRRRR   ^ at x22-23: the Crown stair (up)
    2  #w#^^#w#w#w#w#w#w###w#^^#w##w##w
    3  #w#^^#w#w#w#w#w#w###w#^^#w##w##w   x7-18: the Little School's facade
    4  #D#^^#D#####DD######D#^^#D##D##D   school doors (12-13); house doors
    5  #......=,,,,,,,,,,=.............
    6  #......=,,,,,,,,,,=.............   , the school yard (x8-17, y5-7)
    7  #......=,,,,,,,,,,=.............
    8  #......=====,,=====.............   yard gate at x12-13
    9  ................................   west edge (x0, y9-11): gate to the Goat Path
   10  ................................
   11  ................................
   12  #...................bb..........   bb bench (20-21, 12)
   13  rrrrrrrrrrrrrrrrrrrrrrrrrrr^^rrr   ^ at x27-28: down to the Hundred Steps
   14  rrrrrrrrrrrrrrrrrrrrrrrrrrr^^rrr
   15  rrrrrrrrrrrrrrrrrrrrrrrrrrr^^rrr
```

**Entities:** Skipping Girls at (10, 6), (12, 6), (14, 6), with a rope between the first two. Woman with Watering Can at (25, 5). Man on Bench at (20, 11), facing down. A cat at (17, 9), on the uphill (north) side of the street. Lamp posts at (5, 9), (16, 9), (25, 9). The scrape marks: a ground-layer strip of tiles along y10 from x3 to x28 (an object you can look at from anywhere along it).

**Music:** `neighborhood`.

### The Crown (24 × 16)

The summit plaza. The Bell Tower stands to the northwest, with its new clock face; the Clockmaker's shop sits between it and the Blue Dome to the northeast. The sundial is in the middle. The south parapet looks out over all of Tessel and the Bowl.

```
     x 0         1         2
       012345678901234567890123
 y  0  ~~RRRRRR~~~~~~~RRRRRRRR~   tower top (2-7); dome (15-22)
    1  ~~#w##w#~~~~~~~RRRRRRRR~   w at y1: belfry openings
    2  ~~##CC##~RRRRR~RRRRRRRR~   CC the clock face (4-5, 2-3)
    3  ~~##CC##~RRRRR~#w#ww#w#~
    4  ##########w#w###w#ww#w##   shop facade (9-13); dome facade (15-22)
    5  ##########w#w###w#ww#w##
    6  ####DD#####D######DD####   tower door (4-5); shop door (11); Dome door (18-19)
    7  ........................
    8  ........................
    9  ...........SS...........   SS the sundial (11-12, 9-10)
   10  ...........SS...........
   11  ..bb................bb..   bb benches
   12  ........................
   13  ........................
   14  ===========^^===========   south parapet; stair down at x11-12
   15  ~~~~~~~~~~~^^~~~~~~~~~~~
```

**Entities:** Ambrose Tull sitting on the tower's step at (6, 7), facing down. Lamp posts at (8, 8) and (15, 8). Pots of geraniums at (1, 7), (22, 7), (1, 13), (22, 13). A cat asleep on the uphill bench (2–3, 11).

**Locked doors:** the tower door (the Clockmaker has bolted it from inside) and the Clockmaker's shop door (a sign).

**Music:** `neighborhood`.

### Archive (16 × 14), inside the Blue Dome

A round, book-lined room under the dome, lit from above. In the middle of the floor is the *Eye*: a round window of thick, old glass, with Ottilie's mother's teapot sitting on it. A stair in the southeast corner goes down to the crypt.

```
     x 0         1
       0123456789012345
 y  0  ################
    1  #bbbb##ww##bbbb#   b shelves on the wall face; ww high windows
    2  #bbbb##ww##bbbb#
    3  #..............#
    4  #.bb...O....bb.#   O Ottilie, behind her desk; bb freestanding shelves
    5  #......dd......#   dd her desk
    6  #..............#
    7  #..............#
    8  #......EE......#   EE the Eye (7-8, 8-9): walkable glass, except the teapot's tile
    9  #......EE......#
   10  #.bb........bb.#
   11  #............v.#   v stair down to the crypt (13, 11)
   12  #..............#
   13  #######DD#######   door to the Crown
```

**Entities:** Ottilie at (7, 4), facing down. The teapot at (7, 8), solid. **Music:** `archive`.

### Crypt (10 × 7), under the Archive

A low storeroom of council records. The back wall holds the **Founders' Door**: the player's first sight of Founder architecture. It's dark slate, cut perfectly straight, with no mortar, chamfered corners, and no handle. See the art direction's underground section; this one door should look as though it belongs to a different world from the plaster around it.

```
     x 0
       0123456789
 y  0  ##########
    1  #cc##FF#c#   c crates of records; FF the Founders' Door (5-6, 1-2)
    2  #cc##FF#c#
    3  #..l.....#   l Ottilie's lectern (3, 3)
    4  #........#
    5  #^.......#   ^ stair up to the Archive (1, 5)
    6  ##########
```

**Music:** `archive`, with the Founders' Door adding a faint hum when Cheryl stands next to it (a looping sound effect).

### Hundred Steps (16 × 42), three screens tall

The great stair, in four flights with three landings and a bottom landing. Some risers are set with moon-eyes (round blue glass studs). The **hollow step** is at (9–10, 19), the top of flight 3. It sits flush with landing 2 and is paved like the landing, so it reads as the landing's edge and everyone steps over it without counting it. That's why everyone counts ninety-nine. Once it's open, it really is a step, and it goes down.

```
     x 0         1
       0123456789012345
 y  0  rrrrrr^^rrrrrrrr   top: from Lamp Street (6-7)
    1  rrrrr=^^=rrrrrrr   FLIGHT 1 (x6-7)
    2  rrrrr=^^=rrrrrrr
    3  rrrrr=^^=rrrrrrr
    4  rrrrr=^^=rrrrrrr
    5  #w#w#=^^=#w##w##
    6  #D#w#=^^=#w##D##
    7  ................   LANDING 1 (y7-9)
    8  ................
    9  ................
   10  ==^^============   FLIGHT 2 (x2-3)
   11  r=^^=rrrrrrrrrrr
   12  r=^^=rrrrrrrrrrr
   13  r=^^=rrrrrrrrrrr
   14  r=^^=rrrrrrrrrrr
   15  r=^^=#w##w#D#w##   D (11, 15): the Woman with Basin's doorstep
   16  ................   LANDING 2 (y16-18)
   17  ................
   18  ................
   19  =========HH=====   HH THE HOLLOW STEP (9-10, 19), paved like the landing
   20  rrrrrrrr=^^=rrrr   FLIGHT 3 (x9-10)
   21  rrrrrrrr=^^=rrrr
   22  rrrrrrrr=^^=rrrr
   23  rrrrrrrr=^^=rrrr
   24  rrrrrrrr=^^=rrrr
   25  #w##w#D#=^^=#w##
   26  ................   LANDING 3 (y26-28)
   27  ................
   28  ................
   29  ====^^==========   FLIGHT 4 (x4-5)
   30  rrr=^^=rrrrrrrrr
   31  rrr=^^=rrrrrrrrr
   32  rrr=^^=rrrrrrrrr
   33  rrr=^^=rrrrrrrrr
   34  rrr=^^=rrrrrrrrr
   35  rrr=^^=rrrrrrrrr
   36  rrr=^^=rrrrrrrrr
   37  ##w=^^=##w##w###
   38  ................   BOTTOM LANDING (y38-40)
   39  ................
   40  ......PP........   PP the piano, jammed in the arch (6-7, 40-41)
   41  ######PP########   the arch to Fountain Square (6-7, 41)
```

**Entities:**
- Landing 1: pots at (1, 8) and (15, 8); a cat at (12, 7).
- Landing 2: Woman with Basin at (11, 16), facing down; pots at (1, 17), (14, 17).
- Top of flight 3: the Counting Woman, sitting on the hollow step at (9, 19), facing down. The right half of the step (10, 19) stays walkable, so the player can get past her.
- Landing 3: the Sweaty Kid, running laps: from landing 2 at (10, 18), down column x10 through the gap beside the Counting Woman and down flight 3 to landing 3, along to (13, 27), back, and up again. He passes the Counting Woman each lap. **He never stops on the narrow stretch (x10, y18–24).** If Cheryl comes within two tiles while he's there, he finishes the stretch first and stops on the next landing tile, so he can never block the one-tile gap. A bench at (2–3, 27). A view parapet on the east edge.
- Bottom landing: Big Mover at (4, 39) and Other Mover at (9, 39), facing the piano.

**The water trickle.** Every 20 seconds or so, and whenever Cheryl talks to her, the Woman with Basin tips her basin. An animated trickle sprite runs from (11, 17) across the landing to the hollow step at (10, 19), where it shrinks into the joint and disappears instead of running on down flight 3. While the Counting Woman is sitting there, it runs around her feet.

**Music:** `neighborhood`.

### Fountain Square (24 × 18)

The middle of town: the Fountain of the Fish, market stalls, café tables, the Shop, and the Mayor's office.

```
     x 0         1         2
       012345678901234567890123
 y  0  RRRRRRRRRR#::#RRRRRRRRRR   :: the arch from the Steps (11-12)
    1  RRRRRRRRRR#::#RRRRRRRRRR
    2  #w#ww#w####::####w#ww#w#   Shop facade (0-7); Mayor's office facade (16-23)
    3  ####D######::######D####   Shop door (4, 3); Mayor's door (19, 3), locked
    4  ........................
    5  ........................
    6  ........................
    7  ..........FFFF..........   FFFF the Fountain (10-13, 7-10); the bronze fish is an entity on top
    8  ..........FFFF..........
    9  ..........FFFF..........
   10  ..........FFFF..........
   11  ........................
   12  .ss.ss............tt.tt.   ss market stalls (awnings overhead); tt café tables
   13  .ss.ss............tt.tt.
   14  ........................
   15  ........................
   16  rrrrrrrrrrr..rrrrrrrrrrr   south: down to the Bilge (11-12)
   17  rrrrrrrrrrr..rrrrrrrrrrr
```

**Entities:** the Mayor standing on a crate at (8, 11), facing down. The Stranded Tourist seated at (20, 14), facing up toward her table. Lamp posts at (3, 5) and (20, 5). The bronze fish on the Fountain (11–12, 7, drawn tall). Before the piano slides, the piano's back end fills the arch at (11–12, 0–1). After it slides, the piano sits at (11–12, 5–6) against the Fountain's north rim, with the Movers at (10, 5) and (13, 5).

**Later in the slice:** after the Counting Woman leaves the Steps, she stands at (7, 12) beside the Mayor's crate.

**Music:** `neighborhood`.

### Shop (10 × 8)

```
     x 0
       0123456789
 y  0  ##########
    1  #ssss##ss#   s shelves: lanterns, lamp oil, brass polish, string
    2  #...K....#   K the Shopkeeper (4, 2), behind the counter
    3  #.ccccc..#   c the counter (2-6, 3); talk across it
    4  #........#
    5  #j.....hh#   j the marble jar (1, 5); hh the window display with the hat (7-8, 5)
    6  #........#
    7  ####DD####   door (4-5, 7)
```

A barometer hangs on the wall at (7, 1). A shop bell rings on entry. **Music:** `neighborhood` (muffled; see audio).

### The Bilge (32 × 16)

The canal quarter at the island's foot. One canal runs east to west, crossed by a stepped bridge. On the north quay are the fish market and the Water Stairs, which walk down into the canal and disappear. The west end of the south quay is flooded ankle-deep.

```
     x 0         1         2         3
       01234567890123456789012345678901
 y  0  rrrrrrrrrrr..rrrrrrrrrrrrrrrrrrr   north: up to Fountain Square (11-12)
    1  RRRRRRRRRRR..RRRRRRRRRRRRRRRRRRR
    2  #w##w##w###..###w##w##w##w##w###
    3  #D##D##D###..###D##D##D##D##D###
    4  ................................   NORTH QUAY (y4-6)
    5  ..ss.ss.ss......................   ss fish stalls (2-3, 5-6, 8-9)
    6  ......................WWWW......   WWWW the Water Stairs (22-25, 6-8)
    7  nnnnnnnnnnnnBBnnnnnnnnWWWWnnnnnn   BB the bridge (12-13, 7-10)
    8  %%%%%%%%%%%%BB%%%%%%%%WWWW%%%%%%   W on y8: submerged steps (solid)
    9  %%%%%%%%%%%%BB%%%%%%%%%%%%%%%%%%   the Boatman's boat at (14-15, 9)
   10  ssssssssssssBBssssssssssssssssss
   11  ~~~~~~..........................   ~ here: flooded paving, walkable (x0-5)
   12  ~~~~~~..........................   east edge (x31, y11-13): to the Harbor
   13  ................................
   14  rrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrr   SOUTH QUAY (y11-13)
   15  rrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrr
```

Here `~` on y11–12 means *flooded paving* (shallow water over stone; animated; walkable, with a splashy footstep), not backdrop. `W` on y6–7 is walkable stairs; on y8 it's steps under water and solid.

**Entities:** the Fishmonger at (5, 4), behind her stalls, facing down. The Boatman in his boat (2×1 at 14–15, 9); he's at (14, 9), next to the bridge, so you talk to him from (13, 9). Mooring posts at (4, 6), (17, 6), (28, 6). A cat at (20, 4). **Music:** `harbor`.

### Harbor (32 × 14)

The quay, the ferry, harbor-front houses, and the road out along the Prow to the lighthouse. To the south, the open Bowl; across it, the Teeth.

```
     x 0         1         2         3
       01234567890123456789012345678901
 y  0  ~~^^~~~~~~~~~~~~~~~~~~~~~~#ww#~~   ^ at x2-3: up to the Goat Path
    1  ~~^^~~~~~~~~~~~~~~~~~~~~~~####~~   the lighthouse (26-29, 0-3); ww lamp room
    2  ~~^^~#w##w##w##w##w##w#~~~#ww#~~   harbor-front houses (5-22)
    3  ~~^^~#D##w##D##w##D##w#~~~#DD#~~   lighthouse door (27-28, 3)
    4  ................................
    5  ................................
    6  ................................   west edge (x0, y6-8): to the Bilge
    7  ................................
    8  ................................
    9  nnnnnnnnnnnnnnnnnnnnnnnnnnnnnnKK   quay edge; KK the Keyhole sea arch (30-31, 9)
   10  %%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%   the ferry (10-15, 10-11) lies alongside
   11  %%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%
   12  %%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%
   13  %%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%
```

**Entities:** Captain Mott sitting on a bollard at (13, 8), facing down toward his ferry, with a square jug. Bollards at (8, 8) and (18, 8). Crates and nets at (5–6, 4) and (20, 4). The ferry, *Persistence* (6×2 at 10–15, 10–11). Gulls (ambient). The house doors at (6, 3) and (18, 3) are locked; the one at (12, 3) is the Harbor Office (locked, with a note). The quay's south edge between x19 and x29 is the "sea view" spot for the Teeth.

**Music:** `harbor`.

### Lamp room (8 × 8), top of the lighthouse

```
     x 0
       01234567
 y  0  ########
    1  #wwwwww#   windows all round (the north wall face shows them)
    2  #..LL..#   LL the great lamp (3-4, 2-3), turning shine
    3  #..LL..#
    4  #......#
    5  #......#
    6  #......#
    7  ###DD###   stair door down (3-4, 7)
```

**Entities:** the Lighthouse Keeper at (5, 3), facing the lamp (left), with her back to the windows. **Music:** `harbor`, quieter.

### Goat Path (16 × 24), down the Back

A switchback path down the steep back of the island, through terrace gardens and goats, past Mott's shack, to a sea cave and the Harbor.

```
     x 0         1
       0123456789012345
 y  0  ~~~~~~~~~~~~~::~   top: from Lamp Street (13-14)
    1  ~gggggggggg=:::~
    2  ~gggggggggg=:::~
    3  ~gggggggggg=:::~
    4  ~::::::::::::::~
    5  ~::===========~~
    6  ~::ggggggggggg~~
    7  ~::ggggggggggg~~
    8  ~::::::::::::::~
    9  ~RRRR=====::::~~   Mott's shack (1-4, 9-12)
   10  ~RRRR:::::::::~~
   11  ~#ww#:::::::::~~   ww the shack window (2-3, 11): the still is visible through it
   12  ~#D##:::::::::~~   D shack door (2, 12), locked
   13  ~::::::::::::::~
   14  ~::cc::::::::::~   cc a stack of empty square jugs (3-4, 14)
   15  ~======::::====~
   16  ~gggggg::::gggg~
   17  ~gggggg::::gggg~
   18  ~::::::::::::::~
   19  ~::============~
   20  ~::%%%%%%%%%%%%~
   21  O::%%%%%%%%%%%%~   O the sea cave mouth (0, 21), looked at from (1, 21)
   22  ~::%%%%%%%%%%%%~
   23  ~::~~~~~~~~~~~~~   bottom: down to the Harbor (1-2)
```

**Entities:** two goats wandering the path (area 1–14, 4–8 and 1–14, 13–18). **Music:** `harbor`, with goat bleats.

## State

| Flag | Set when | Effect |
| --- | --- | --- |
| `act2.started` | Cheryl first enters Lamp Street | Cistern Court NPCs get Act 2 lines; the Kid moves to the Steps |
| `movers.met` | First talk with the Movers | Piano description adds the soap hint if Cheryl has soap |
| `piano.slid` | Soap used on the piano | Arch open both ways; piano and Movers in Fountain Square; crowbar on the bottom landing |
| `got.crowbar` | Crowbar picked up | |
| `tourist.met` | First talk with the Tourist | Shop window hat description adds the hint |
| `tourist.hasHat` | Hat given | Tourist sprite wears it; Cheryl has the guidebook |
| `counter.left` | Guidebook shown to the Counting Woman | She's gone from the Steps and appears beside the Mayor |
| `step.found` | Cheryl examines the hollow step after `counter.left` | |
| `step.open` | Crowbar used on the hollow step | End-of-act sequence |
| `ottilie.met` | First talk with Ottilie | Cheryl has paper and charcoal |
| `met.<name>` | First talk with any other NPC | Their repeat lines start |

Look counters work as in the opening (first, second, then).

### Changes to Cistern Court once `act2.started`

- The Sweaty Kid is gone (he's on the Hundred Steps).
- Old Man repeat: OLD MAN: Gerald says the board's tilting. I said, then play uphill.
- Neighbor repeat: NEIGHBOR: I'm rewashing them. I'll moon them again next month. Mother would.

## The puzzle

```
 PIANO THREAD                                COUNT THREAD
 soap (from Act 1) ─┐                         hat (Cheryl's wardrobe) ─┐
 talk to Movers (opt)┴► use soap on piano      talk to Tourist (opt) ───┴► give hat to Tourist
                          │                                                  │
                          ▼                                                  ▼
                 piano slides into the Square;                          GUIDEBOOK
                 CROWBAR left on the landing;                                │
                 the arch opens                       show guidebook to the Counting Woman
                          │                                                  │
                          │                              she storms off to the Mayor
                          │                                                  │
                          │                         look at her step: the water drains into it
                          │                                                  │
                          └──────────────► use crowbar on the hollow step ◄──┘
                                                       │
                                               END OF ACT 2
```

- The two threads are independent and can be done in either order, or interleaved.
- Before the piano moves, the Square (and the Tourist) is reachable only by the long way round (the Goat Path).
- The Counting Woman leaves whether or not the piano has moved. If it hasn't, she climbs over it (see her dialog).
- Using the crowbar on the hollow step works as soon as she's gone, even if the player hasn't looked at the step yet.
- If the player didn't take the hat in the morning, it's still in the wardrobe.

### Hints in the world

| What the player needs to realize | Who or what says so |
| --- | --- |
| Follow the piano | The scrape marks on Lamp Street, on first arrival |
| The piano needs grease | Big Mover; then Cheryl's piano description mentions her soap |
| The Square is reachable another way | Cheryl at the blocked arch: "The Goat Path goes round the long way." |
| The Tourist wants a hat; the Shop won't sell its hat | The Tourist; the Shopkeeper; Cheryl at the shop window, on the second look ("I have a perfectly good hat at home.") |
| The guidebook is what will move the Counting Woman | Reading the guidebook: its first entry is the "in fact, 99" line |
| The Counting Woman cares about the number above all | Her own lines |
| Something's odd about *her* step | Her wet feet; the Woman with Basin; the Kid's "bonk" |
| A step goes *down* | Ottilie's saying; the opening's last line, "Wrong like a step that isn't there" |

## Characters and dialog

Lines follow the conventions in the story bible and the opening. Each line is one text box; all have been measured to fit three lines of the real box. Former pupils call Cheryl "Miss." "→" marks an action or state change.

### Returning: the Sweaty Kid (Hundred Steps, landing 3)

As in the opening, he stops and jogs in place whenever Cheryl is within two tiles, or when he's clicked or tapped.

**First talk**
- SWEATY KID: Can't stop! Stair training! Real stairs! …They're SO much harder than the well.
- SWEATY KID: I tripped on a step up there that went BONK. Steps go "tap." That one went BONK.
- SWEATY KID: Mrs. Count yells at me every lap. She says I make her lose count.

**Repeat** (alternate)
- SWEATY KID: BONK. Not tap. BONK.
- SWEATY KID: I can't get past the piano. It's in my way AND it's in my race.

**After `counter.left`:** SWEATY KID: Mrs. Count's gone! I can do the whole flight now! …Except the piano.
**After `piano.slid`:** SWEATY KID: The piano WENT! It went faster than me! …I need to train harder.

### The Skipping Girls (Lamp Street, school yard)

Two turn the rope; the third jumps; every so often they swap. They chant the first couplet of the rhyme as ambient text the first time Cheryl comes within three tiles (a speech line at the top of the screen that doesn't stop the player): SKIPPING GIRLS: ♪ Moonshine, moonshine, catch it in a cup, ring the bell when the tide turns up! ♪

**Talk to any of them** (first time)
- FIRST GIRL: Miss! Miss! Tell her it's "Stout sister, Thin sister." She says it's Thin first.
- SECOND GIRL: It IS Thin first. "Thin sister, Stout sister, Little sister three!"
- THIRD GIRL: It's FAT sister, not Stout. Nobody says stout. Stout is a beer.
- FIRST GIRL: You're both wrong and you're both OUT.

**Repeat** (each, alternating with the chant)
- FIRST GIRL: Stout first. My nan says.
- SECOND GIRL: Little sister three. She's the littlest, so she goes last.
- THIRD GIRL: There's a bit about Tessel bumping her head. It's the BEST bit.

**Look:** "The Skipping Girls. Nobody taught them that rhyme. Not me, not their mothers. It's just there, like the stairs."

### Woman with Watering Can (Lamp Street)

- First: WOMAN WITH WATERING CAN: Did you see the moon, Cheryl? Sideways! The whole street saw.
- WOMAN WITH WATERING CAN: My husband says it's the new clock. Everything's the new clock, with him. The milk went off: the clock.
- Repeat: WOMAN WITH WATERING CAN: The clock. I ask you.
- Look: "She waters the geraniums at nine every morning. The geraniums would set their watches by her, if geraniums had watches."

### Man on Bench (Lamp Street)

- First: MAN ON BENCH: Says here the moon was "refracted by unusual atmospheric conditions." Refracted. I said refracted. Last night.
- Repeat: MAN ON BENCH: Refracted. Look it up.
- Look: "He's read the same page of the Tide-Sheet three times this morning. He's hoping it changes its mind."

### Ambrose Tull (the Crown)

Sits on the tower step with his ledger on his knees. Idle: looks up at the clock and scowls.

**First talk**
- AMBROSE: CHERYL. YOU SAW IT. THE MOON. YOU SAW WHERE IT CAME UP.
- AMBROSE: FIVE WEEKS THAT CLOCK'S BEEN RINGING MY BELL. ON THE HOUR. LIKE A COW.
- AMBROSE: A BELL ISN'T FOR HOURS. A BELL IS FOR THE TURN OF THE TIDE. TULLS HAVE RUNG AT THE TURN FOR THREE HUNDRED YEARS.
- AMBROSE: CLOCKS DON'T KNOW THE SEA. THE SEA DOESN'T KNOW CLOCKS. ONE OF THEM IS IN CHARGE, AND IT ISN'T THE CLOCK.

**Repeat** (cycle)
- AMBROSE: I STILL KEEP THE LEDGER. EVERY TURN, TWICE A DAY. NOBODY ASKS.
- AMBROSE: WHAT? I'M NOT SHOUTING. THIS IS HOW I TALK. THE BELL DID IT.
- AMBROSE: THEY GAVE ME A PLAQUE. A PLAQUE DOESN'T KNOW THE SEA EITHER.

**Items**
- Moon chart: AMBROSE: OUTSIDE THE GATE. HM. THE SEA KNEW FIRST. THE SEA ALWAYS KNOWS FIRST.
- Guidebook: AMBROSE: "BELL RUNG AT RANDOM BY A LOCAL ECCENTRIC." RANDOM! I'LL GIVE THEM ECCENTRIC.
- Anything else: AMBROSE: I DON'T WANT THAT. I WANT MY BELL.

**Look:** "Ambrose Tull. He rang that bell for fifty-two years. Now he sits under it, like a dog outside a shop."

### The Clockmaker (the Crown, heard only)

He's inside the bolted Bell Tower. Interacting with the tower door:
- First: "Bolted from inside. There's a card in the keyhole: CLOCK IN PROGRESS. NO ADMITTANCE." → Cheryl knocks (knock sound).
- CLOCKMAKER: Go away! I'm calibrating!
- CLOCKMAKER: …I know that knock. Is that Miss? Go away, Miss! Respectfully!
- Repeat (knock): CLOCKMAKER: Eleven minutes! The sun is ELEVEN MINUTES WRONG! I've written to the observatory!
- Second repeat: CLOCKMAKER: Is it time yet? No. Don't answer that. I KNOW what time it is.

The Clockmaker's lines appear with his label at the top of the screen, as a voice from the belfry window.

### Ottilie Brask (Archive)

Stands behind her desk. Idle: turns a page; sips a cold cup of tea; makes a face.

**First talk** → give **paper and charcoal**; `ottilie.met`
- OTTILIE: Cheryl! You saw the moon. Everyone saw the moon. Nobody is asking the right question.
- OTTILIE: The right question is: what did the Founders know? The Founders knew EVERYTHING. Then they went into the hill.
- OTTILIE: Eels, I used to think. Now I'm leaning toward smugglers. Smugglers would know about moons.
- OTTILIE: You've got your investigating look. Here. Paper and charcoal. If you find anything old, take a rubbing.
- → *Got Paper and Charcoal.*
- OTTILIE: And remember my grandmother's saying: "Ninety-nine steps up to the Crown, and the hundredth step goes down."
- OTTILIE: It's about humility. Probably. I've written about it.

**Repeat** (cycle)
- OTTILIE: "Ninety-nine steps up to the Crown, and the hundredth step goes down." Humility. Probably.
- OTTILIE: The Founders' Door is in the crypt. It doesn't open. I've written a monograph about how it doesn't open.
- OTTILIE: Mind the teapot. It's on the Eye. The Eye is ancient glass. The teapot was my mother's. Both are irreplaceable.

**Items**
- Moon chart: OTTILIE: Thirty-one years of data! …They're all in the same place, Cheryl. That's not data, that's a habit.
- (then) OTTILIE: Except the last one. Well. Everyone has an off night.
- Guidebook: OTTILIE: "Founded by fishermen in the year of the Great Shoal." FISHERMEN. I could scream. I may scream.
- Hat: OTTILIE: It suits you. It always has. Put it on, the Dome's drafty.
- Soap: OTTILIE: Lavender. Is this about book club? I said I was sorry.
- Paper and charcoal: OTTILIE: Not on ME, Cheryl. On something OLD. …Don't say it.

**Look:** "Ottilie Brask. My oldest friend in Tessel. Never once right about the Founders. Never once in doubt."

### The Counting Woman (Hundred Steps, sitting on the hollow step)

Wears a civic sash. Idle: nods along as she counts, lips moving.

**First talk**
- COUNTING WOMAN: Ninety-seven. Ninety-eight. Ninety-nine. …Ninety-nine. Every day. Every DAY.
- COUNTING WOMAN: It's the Hundred Steps, Cheryl. A hundred. It's in the name. I am the Keeper of the Count. It's a civic title.
- COUNTING WOMAN: Every morning I count them, and every morning I get it wrong. Ninety-nine. So I sit, and I count again.
- COUNTING WOMAN: And every morning somebody tips their Moonshine water down the Steps, and my feet get wet. Right here.

**Repeat** (alternate)
- COUNTING WOMAN: Fourteen. Fifteen. Don't talk to me, I'm counting. …Fifteen? Sixteen.
- COUNTING WOMAN: There are a hundred. I'm just bad at it. I've been bad at it for twenty years.

**Show guidebook** → `counter.left`
- COUNTING WOMAN: What's this? "The Hundred Steps (there are, in fact, ninety-nine)."
- COUNTING WOMAN: In FACT? In PRINT? Some mainlander has COUNTED MY STEPS and PRINTED it?
- COUNTING WOMAN: There are a HUNDRED. I'm going to the Mayor. I'm going to the Mayor RIGHT NOW.
- → She stands and marches down the Steps. If the piano is still in the arch, she climbs straight over it while the Movers watch:
  - BIG MOVER: Madam! That's a PIANO!
  - COUNTING WOMAN: And these are MY STEPS.
- → She leaves through the arch. Cheryl keeps the guidebook.

**Other items**
- Moon chart: COUNTING WOMAN: Ticks. Counting ticks. At least you can count, Cheryl.
- Hat: COUNTING WOMAN: I don't need a hat. I need a hundredth step.

**Look:** "The Keeper of the Count. It's a real title. There's a sash. She's wearing the sash."

**In Fountain Square** (after `counter.left`), standing beside the Mayor's crate:
- COUNTING WOMAN: A HUNDRED, Duncan! It's in the NAME!
- Repeat: COUNTING WOMAN: I'm not leaving until there's a committee.

### Woman with Basin (Hundred Steps, landing 2)

- First: WOMAN WITH BASIN: Moonshine water down the Steps, for luck. My mother did it, and her mother. → she tips the basin (trickle).
- WOMAN WITH BASIN: It's not working this year, is it. Did you see that moon? I'm tipping extra.
- Repeat (alternate): WOMAN WITH BASIN: Extra luck. Can't hurt. → tips. / WOMAN WITH BASIN: Funny. It always runs down the same way, and then it's just… gone.

### The Piano Movers (Hundred Steps, bottom landing)

Big Mover talks. Other Mover grunts, and Big Mover translates.

**First talk** → `movers.met`
- BIG MOVER: Miss! Don't come any closer. It's wedged. It's been wedged since sunrise.
- BIG MOVER: We came back after moon, like the note said. Piano gone. Found it here. Came down the Hundred Steps by itself.
- OTHER MOVER: Hnn.
- BIG MOVER: He says pianos don't do that. I said, this one did.
- BIG MOVER: If it was greased it'd shoot through that arch like a pip. We've no grease. We've a crowbar and a grudge.

**Repeat** (alternate)
- BIG MOVER: Grease. Or butter. Or a miracle.
- OTHER MOVER: Hnn. / BIG MOVER: He says it's the heaviest piano he's ever met, and he's met a lot of pianos.

**Use soap on the piano, or give it to either Mover** → remove soap; `piano.slid`
- BIG MOVER: Soap? …Lavender. Worth a try. Stand back, Miss.
- → The Movers rub the soap along the piano's base (two beats of scrubbing). They brace and shove. The piano shoots through the arch with a whoosh, a scrape, and a jangle of strings, and vanishes.
- BIG MOVER: Not THAT fast!
- OTHER MOVER: HNN!
- → They run through the arch after it. Their crowbar lies on the landing at (9, 40), glinting.

**Other items**
- Moon chart, hat, guidebook: BIG MOVER: Very nice, Miss. Not grease, though.

**In Fountain Square** (after `piano.slid`), standing guard by the piano against the Fountain:
- First: BIG MOVER: It stopped on its own. Against a fountain. That's two things pianos don't do.
- BIG MOVER: Keep the crowbar, Miss. We're not taking our eyes off this one.
- Repeat: OTHER MOVER: Hnn. / BIG MOVER: He says it's looking at the canal. He doesn't like how it's looking at the canal.

**Look:** "The Piano Movers. I taught them both. The big one talked for two even then."

### The Mayor (Fountain Square, on a crate)

Idle: gestures grandly at nobody.

**First talk**
- MAYOR: People of Tessel! Last night's moon was an atmospheric event. Entirely normal. Tessel: Forward!
- MAYOR: …Oh. Miss. Hello, Miss.
- MAYOR: Don't look at me like that. You've looked at me like that since I was seven.
- MAYOR: Everything is fine. The clock is perfect. The moon is atmospheric. Please disperse.

**Repeat** (cycle)
- MAYOR: Tessel: Forward! …Please disperse.
- MAYOR: My clock is the finest thing on this island. It's ahead of its time. By eleven minutes, I'm told. That's the sun's fault.

**After `counter.left`** (first talk)
- COUNTING WOMAN: A HUNDRED, Duncan! It's in the NAME!
- MAYOR: Madam, a guidebook is not an official document—
- COUNTING WOMAN: Then make it OFFICIAL! Count them! Get a committee!
- MAYOR: …Miss, did you give her a guidebook? Why would you give her a guidebook?
- Repeat: MAYOR: There will be a committee. There is always a committee.

**Items**
- Guidebook: MAYOR: "The Mayor's office boasts the island's only telephone." Boasts. It does boast. It's a very good telephone.
- Moon chart: MAYOR: Very nice, Miss. Gold star. Please disperse.

**Look:** "The Mayor. Duncan, when he was seven. I taught him long division. Twice."

### The Stranded Tourist (Fountain Square, café)

Seated, fanning herself with her guidebook. Very pink.

**First talk** → `tourist.met`
- STRANDED TOURIST: Four days. The ferry hasn't come in four days. The captain says the island moved. Islands don't move.
- STRANDED TOURIST: My guidebook promised "gentle sea breezes and abundant shade." I have found neither.
- STRANDED TOURIST: I'd give anything for a hat. There's one in the shop window and he won't SELL it. "Display stock."

**Repeat** (alternate)
- STRANDED TOURIST: A hat. Any hat. I'm peeling like an onion.
- STRANDED TOURIST: According to this map your lighthouse is on the wrong end of the island. I've stopped asking.

**Give hat** → remove hat; give **guidebook**; `tourist.hasHat`
- STRANDED TOURIST: A hat! A real, wearable — you're GIVING it to me?
- STRANDED TOURIST: Take this. It's been wrong about everything else. Maybe it'll be right for you.
- → She puts the hat on (sprite swap). *Got Guidebook.*

**Repeat after** (alternate)
- STRANDED TOURIST: Shade. Portable shade. I could weep.
- STRANDED TOURIST: I'm going to sit right here until the ferry comes or I turn into a raisin.

**Other items**
- Moon chart: STRANDED TOURIST: The guidebook has a chart too. It's also wrong.
- Soap: STRANDED TOURIST: I've been washing in seawater. Don't ask.

**Look:** "A tourist. Stranded, sunburnt, and still holding that guidebook like it might apologize."

### The Shopkeeper (Shop)

Idle: wipes his hands on his apron and straightens something that was already straight.

**First talk**
- SHOPKEEPER: Morning, Miss. Browse, browse. Everything's display stock.
- SHOPKEEPER: The hat in the window? Display. The lanterns? Display. The marbles? Display. They all rolled into one corner overnight.
- SHOPKEEPER: I'd sell you something from the back, if I had a back. I don't. It's all front.

**Repeat** (alternate)
- SHOPKEEPER: Display stock. It's a principle.
- SHOPKEEPER: If I sell the hat, the window has a gap. A shop with a gap in the window is a shop that's given up.

**Items**
- Hat: SHOPKEEPER: That's YOUR hat, Miss. I don't take hats in. Where would I display it?
- Guidebook: SHOPKEEPER: A genuine local guidebook! Lovely. But my window is complete. *(This changes in Act 5.)*
- Moon chart: SHOPKEEPER: I could frame that. For display.

**Look:** "The Shopkeeper. He has never sold anything to anyone and he's proud of it."

### The Fishmonger (the Bilge)

**First talk**
- FISHMONGER: Miss! Look at my street! LOOK at it! Under water! Every high tide this week!
- FISHMONGER: It's never done that. Never. The sea's jealous of me, that's what it is. Always has been.
- FISHMONGER: Two more inches and it's in my cellar. Then where do I keep my ice? Where do I keep my DIGNITY?

**Repeat** (alternate)
- FISHMONGER: The sea. Jealous. I've always said.
- FISHMONGER: Buy a fish. Don't buy a fish. Nothing matters. The sea is coming for me personally.

**Items:** Moon chart: FISHMONGER: Very pretty. Can it stop the sea? Then I don't want it.

**Look:** "The Fishmonger. In my class she cried when we did the water cycle. She took that personally too."

### The Boatman (the Bilge, in his boat)

Idle: rocks gently and sings. A "♪" bubble rises from him every few seconds.

**First talk**
- BOATMAN: ♪ Oh the water is wet, and the boat is a boat ♪ …Morning, Miss!
- BOATMAN: Want a ride? I don't go anywhere. I just float. A boatman stays in his boat.
- BOATMAN: The Water Stairs? Go down forever. My uncle swam to the bottom once. Came up on a Tuesday. He went in on a Thursday.

**Repeat** (alternate)
- BOATMAN: ♪ The man is a man, and the boat is a boat ♪
- BOATMAN: Out of the boat, I'm just a man standing about. In the boat, I'm a BOATMAN.

**Look:** "The Boatman. He's been in that boat since he was fourteen. I'm not sure he has legs."

### Captain Mott (Harbor)

Sits on a bollard by his ferry with a square jug. Idle: takes a swig; looks east at the Gate; shakes his head.

**First talk**
- MOTT: Cheryl. Sit down. No, don't. Nobody sits with me this week. I'm the man who says the island moves.
- MOTT: It moves. The whole island. I came in Tuesday and the landing wasn't where I left it. A hand to the left.
- MOTT: I know that face. Everyone makes that face. I'm only a little drunk, and only because I'm right.
- MOTT: Everyone says "That's moonshine, Mott." Well, it is. I make it. Doesn't mean I'm wrong.

**Repeat** (cycle)
- MOTT: A hand to the left. A bit more every day.
- MOTT: Ferry's not crossing till the island holds still.
- MOTT: My grandfather found copper in the sea cave, down the Back. Built a still around it. Best thing he ever did.

**Items**
- Moon chart: MOTT: …Thirty-one years of moons. Huh. → he takes a long swig → MOTT: No. Not today. Today I'm drinking. *(In Act 4 the Bilge is flooding and the doorsteps glow at night; he has sobered up out of fright, and the same chart convinces him.)*
- Hat: MOTT: Keep it. You'll want it. Bright out here, drifting.
- Guidebook: MOTT: "The friendly ferryman." Ha.

**Look:** "Captain Mott. Ferryman, distiller, and the only person in Tessel saying something I believe."

### The Lighthouse Keeper (lamp room)

Polishes the lamp with her back to the windows. Idle: a polishing loop; she breathes on the brass and rubs.

**First talk**
- LIGHTHOUSE KEEPER: Don't come near the lamp. I've just done it.
- LIGHTHOUSE KEEPER: Twenty-two years I've kept this light. Brightest lamp on any coast. Look at that shine.
- LIGHTHOUSE KEEPER: The sea? I don't look at the sea. You don't look at the sea. You look at the lamp.

**Repeat** (alternate)
- LIGHTHOUSE KEEPER: Polish, polish.
- LIGHTHOUSE KEEPER: A keeper who looks at the sea is a keeper who's stopped polishing.

**Look:** "The Lighthouse Keeper. In my class she sat with her back to the window. Every year. I thought it was the glare."

### Goats (Goat Path)

- GOAT: Meh.
- Look: "A goat. It's eating a geranium and making eye contact."

## Objects and descriptions

Cheryl's descriptions unless labeled. "First / then" follows the look counter.

### Lamp Street

- **Scrape marks** — on first entering the map, automatically: "A long scrape in the cobbles, from the Squeeze all the way to the top of the Hundred Steps." / "The piano went this way. I'll follow it. It's the only lead I've got, and it weighs half a ton." Looked at later: "The piano's trail. It knew where it was going, which is more than I do."
- **The Little School** (facade): First: "The Little School. Twenty-nine years. I could find my old desk in the dark, and twice I had to." Then: "Summer holiday. The building is having the best weeks of its year."
- **School doors**: "Locked. Good. The building deserves a rest."
- **House doors**: "Not my door." (cycle with) "The Venns'. They'll be asleep. They're always asleep. It's a gift."
- **Cat** (uphill side): First: "A cat, on the uphill side of the street. They're all on the uphill side this morning. Every one." Then: "Cats know where level is. Today, level is uphill."
- **Goat Path gate** (west edge, first time only, before the exit fires): "The Goat Path. Down the back of the island the long way, past the goats and Mott's shack."
- **Bench** (when not occupied): the Man on Bench is on it.

### The Crown

- **Bell Tower door**: see the Clockmaker.
- **Clock face**: First: "The Mayor's clock. The plaque says TESSEL ENTERS THE MODERN AGE." / "It's eleven minutes ahead of the sundial and very pleased about it." Then: "It rings the hours loud enough to rattle the plaza. Ambrose says it rings like a cow. I don't know what that means. I agree with it."
- **Sundial**: First: "The sundial and the clock disagree by eleven minutes." / "The sundial has been here five hundred years. The clock arrived last month. I know which one I'd ask for directions." Then: the second line.
- **Clockmaker's shop door**: First: "The Clockmaker's shop. A sign: AT THE BELFRY. CLOCK IS PERFECT. DO NOT ASK." Then: "He was the boy who asked 'is it time yet?' every four minutes. Now it's his job."
- **Blue Dome** (facade): "The Blue Dome. The Archive's inside it, and Ottilie is inside the Archive, and that's where she'll stay."
- **South parapet**: First: "From the Crown you can see the whole Bowl. The Gate looks perfectly ordinary." / "That's the worst part." Then: "The whole Bowl, calm as a plate. On the far side, the Teeth, white with surf."
- **Benches, pots**: "A bench with the best view in Tessel, and a cat who knows it." / "Geraniums. Nobody remembers planting them."

### Archive

- **The Eye**: First: "A round window in the floor, thick as my hand. Under it, dark. Not cellar dark. Deep dark." Then: "Ottilie calls it the Eye and keeps her teapot on it. Five hundred years old, and it's a coaster."
- **Teapot**: "Her mother's teapot. I learned to keep away from it at book club."
- **Wall shelves**: First: "Records of Tessel. Births, deaths, and a whole shelf of complaints about the bell." Then: "Three hundred years of people writing down that the bell rang. Nobody ever wrote down why."
- **Freestanding shelves**: "Ottilie's monographs. 'The Founders: A Theory of Eels.' 'The Founders: Smugglers?' 'The Door That Does Not Open.'"
- **High windows**: "Light comes in under the dome and pools on the floor. It's lovely. I'd never tell her."
- **Desk**: "Seven cups of tea, all half-drunk, all cold. She's working."
- **Paper and charcoal on anything here**: "Ottilie would never forgive me for a rubbing of her desk."

### Crypt

- **The Founders' Door**: First: "A door. Not one of ours. Dark stone, cut dead straight. No mortar. The corners are cut off at an angle." / "There's no handle on this side. Ottilie says it's bolted from the other side. There is no other side. It's a hill." Then: "I put my hand on it. It's cold, and it hums, very faintly, like a held breath."
- Crowbar on the door: "There isn't a seam to get it into. Whoever made this didn't make doors for crowbars."
- Paper and charcoal on the door: "Nothing carved on it to rub. Just smooth, perfect stone."
- Anything else on the door: "It doesn't want that."
- **Lectern**: "'The Door That Does Not Open,' by O. Brask. Forty pages. The door has not opened once while I've been reading it."
- **Crates**: "Minutes of council meetings. Three hundred years of people agreeing to look into it."

### Hundred Steps

- **On first arrival** (trigger at the top): "The Hundred Steps. Ninety-nine of them. Everybody knows that, and everybody calls them the Hundred Steps anyway." / "That's Tessel."
- **Moon-eyes** (riser tiles with glass studs, any of them): First: "A moon-eye: a round blue glass stud set in the step. They're all over town. For luck, people say." Then: "Thirty-one years I've walked over these and never wondered what was under them. I'm wondering now."
- **Paper and charcoal on a moon-eye**: "A rubbing of a glass bump. Ottilie would frame it. No."
- **The hollow step** (9–10, 19)
  - While the Counting Woman sits there (looked at from 10, 19 or beside it): "The edge of the landing, where she's sitting. Water has pooled along it, just there, by her feet."
  - After `counter.left`, first look → `step.found`: "It's paved like the landing, but it's a step. Thirty-one years and I never noticed." / "Water is running across the landing and into its joint. Not over it. *Into* it. Steps don't drink." / "I tap it with my foot. Every other step goes tap. This one goes bonk."
  - Then: "Bonk."
  - Crowbar while she's sitting there: "She's sitting on it. I'm brave, not rude."
- **Crowbar on any other step**: "These steps are older than the Mayor's great-grandmother. I'm not prying them up at random."
- **The piano** (bottom landing, before it slides): First: "The piano, wedged in the arch like a cork. The label still says No. 9, Cistern Court." Then: "Somebody sent me a piano, and the piano has other ideas." After `movers.met`, first look: "Grease. Where would I get grease on a Moonshine morning?" Second and later looks, while Cheryl has the soap: "Grease, he said. My soap is slippery enough to lose in a bath." (The soap stays on the washstand in Cheryl's flat until taken, if the player skipped it in Act 1.)
- **The blocked arch** (walking into it): "I'm not climbing over a piano at my age. The Goat Path goes round the long way."
- **The crowbar** (after the piano slides) → take: "Their crowbar. They'll want it back. They'll have to catch a piano first."
- **Landing 3 view parapet**: "Halfway down Tessel. Halfway up, if you're the Kid."
- **Bench, pots, cat**: "A bench for the halfway point. Nobody has ever sat on it going down." / "Geraniums." / "Another cat, on the uphill side."

### Fountain Square

- **The Fountain**: First: "The Fountain of the Fish. Five hundred years of water from nowhere. Every child in Tessel has been dared to drink it." / "It's lower than it should be. A finger's width. You'd only notice if you'd stared at it for thirty years." Then: the second line. After `piano.slid`: "The piano has come to rest against the Fountain. The fish looks offended."
- **The bronze fish**: "A bronze fish, spouting. Its fins look like oars, if you squint. I've never squinted at it before."
- **The arch** (before `piano.slid`): First: "The back end of a piano, wedged in the arch from the Steps side. I'd know that label anywhere." Then: "The Movers are on the other side of this. They'll want it moved more than I do."
- **The piano** (after it slides): "Half a ton of piano, resting against the Fountain with its lid open, as if it's thinking of a tune."
- **Market stalls**: "Lemons, onions, and yesterday's gossip, all fresh." / "Moonshine Night basins, half price. Nobody's buying. Bad luck, apparently."
- **Café tables**: "Tessel's real government meets here every morning, over coffee."
- **Mayor's office door**: First: "The Mayor's office. Closed while the Mayor reassures people outside." Then: "There's a telephone in there. It has never rung. He polishes it."
- **Crowbar on the Fountain**: "I am not prying up a five-hundred-year-old fountain in front of the Mayor."

### Shop

- **Window hat display**: First: "A wide straw hat, in the window. Display stock. It's been in that window since before I went grey." After `tourist.met`, first look: "Display stock. She'll be peeling by lunchtime." Second and later looks: "Display stock. I have a perfectly good hat at home, in the wardrobe."
- **Marble jar**: First: "A jar of marbles. Every single marble has rolled to the same side of the jar." / "The jar is level. I checked." Then: "Every marble, on the same side. Downhill, if the floor was a hill. It isn't."
- **Shelves**: "Brass polish, lamp oil, string, lanterns. Everything a lighthouse could want. All display."
- **Barometer**: "The barometer says FAIR. It's said FAIR for nine years. He won't tap it in case it changes its mind."
- **Counter**: "A counter, polished by a lifetime of not selling things."

### The Bilge

- **Flooded street**: First: "The lowest street, under an inch of water. It's high tide. It was never this high at high tide." Then: "Wet feet in the Bilge. That's new."
- **The Water Stairs**: First: "The Water Stairs. Broad and grand, and they walk straight down into the canal and keep going." / "Tourists photograph them. Children dare each other. Nobody knows where they went." Then: "Under the water, the steps go down further than I can see."
- **Canal**: "Canal water. Green, cold, and full of opinions."
- **Fish stalls**: "Yesterday's catch, today's price, tomorrow's smell."
- **Mooring posts**: "A mooring post, worn smooth by ropes. Older than the houses, somebody told me once."
- **House doors**: "Not my door. Wet doorstep, though."

### Harbor

- **Ferry**: First: "Mott's ferry, the Persistence. It hasn't crossed since Tuesday." Then: "There's a mainland over there, with the Pelletiers on it, waiting."
- **Harbor Office door**: "The Harbor Office. A note on the door: GONE TO LOOK FOR THE LANDING."
- **Other house doors**: "Not my door. Fishing nets drying on the handle."
- **Sea view** (quay edge x19–29): First: "The Bowl, flat calm. On the far side, the mouth, and the Teeth, white with surf." / "Nobody sails near the Teeth. Nobody needs to. They're a long way off." Then: "The Teeth. A long way off."
- **The Keyhole**: "Under the lighthouse the rock has a hole worn clean through it. The Keyhole. The sea goes in and out of it like breath."
- **Bollards, crates, nets**: "A bollard. Mott's sitting on the good one." / "Crates of nothing much, waiting for a ferry."

### Lamp room

- **The lamp**: "The lamp. Brass and glass, polished till it hurts. She'd notice if I breathed on it."
- **Windows**: "From up here: the whole Bowl, the Rim, the mouth, the Teeth. She has her back to all of it."

### Goat Path

- **Mott's shack door**: "Mott's shack. A sign: GONE FERRYING. Underneath, in different ink: (NOT REALLY)."
- **Shack window**: "Through the window: a still. A copper coil, polished like a trophy. It's the only thing in there he dusts."
- **Square jugs**: "Empty jugs. Lots of them. Square. Mott's."
- **Sea cave**: First: "A sea cave under the cliff. The tide's in, and the water goes right to the back." / "Something down there catches the light. Brass, maybe." Then: "The tide's in. I'm not swimming. Not today."
- **View** (any `~` edge on the seaward side): "The back of the island. Cliff, goats, sea. You can't see the Gate from here. It's very restful."
- **Terrace beds**: "Beans, mostly. The goats have opinions about the beans."

### Declines: wrong items given to NPCs

Every NPC answers an item they have no line for in their own voice, never with Cheryl's generic fallback.

| NPC | Decline |
| --- | --- |
| Sweaty Kid | SWEATY KID: Can't carry it! Aerodynamics! |
| Skipping Girls | FIRST GIRL: We're BUSY, Miss. |
| Woman with Watering Can | WOMAN WITH WATERING CAN: Lovely, dear. I've got my hands full of can. |
| Man on Bench | MAN ON BENCH: Not now. I'm being right. |
| Ambrose | AMBROSE: I DON'T WANT THAT. I WANT MY BELL. |
| Ottilie | OTTILIE: Is it old? It isn't old. Bring me something old. |
| Counting Woman | COUNTING WOMAN: Don't hand me things. I lose count. |
| Woman with Basin | WOMAN WITH BASIN: Not unless it's lucky. |
| Piano Movers | BIG MOVER: Very nice, Miss. Not grease, though. |
| Mayor | MAYOR: Very nice, Miss. Gold star. Please disperse. |
| Stranded Tourist | STRANDED TOURIST: Unless it's a hat or a ferry, I don't want it. |
| Shopkeeper | SHOPKEEPER: My window is complete, Miss. |
| Fishmonger | FISHMONGER: Can it stop the sea? Then I don't want it. |
| Boatman | BOATMAN: It won't fit in the boat. Nothing fits in the boat but me. |
| Mott | MOTT: Not unless it holds the island still. |
| Lighthouse Keeper | LIGHTHOUSE KEEPER: Don't bring that near the lamp. |
| Goat | GOAT: Meh. → it tries to eat the item; Cheryl pulls it back: "No." |

### Wrong combinations (new)

- Crowbar on the Founders' Door, the Fountain, random steps: see above.
- Crowbar on any NPC: "No. Absolutely not. Put it away, Cheryl."
- Paper and charcoal on anything not listed: "Nothing old enough to be worth a rubbing."
- Guidebook on any object: "The guidebook has an opinion about this. It's wrong."
- The generic fallbacks from the opening still apply.

## Items

| Item | Icon idea | Inventory description |
| --- | --- | --- |
| Paper and charcoal | A few sheets with a black stub on top | "Ottilie's paper and a stub of charcoal. For rubbings. Primary sources, Cheryl." |
| Guidebook | A small red paperback with a gold crest | "Tessel: A Pocket Companion. Confidently wrong on every page. I've grown fond of it." |
| Crowbar | An iron bar with a hooked end | "The Movers' crowbar. Heavy, honest, and slightly bent." |

The hat, moon chart, and soap carry over from the opening. The soap stays on the washstand and the hat in the wardrobe until taken, so a player who skipped them in Act 1 can still get them.

### Reading the guidebook

Examining the guidebook in the inventory (the bag's Look button) reads one entry per look, cycling in this order. In the engine this is the item's `looks: [...]` list with `looksRepeat: 'cycle'`; each numbered entry below is one look, and its two quoted parts are two boxes. The first look always lands on the Steps entry, which is what the Count thread needs. The fourth entry plants the Act 4 Clockmaker lure.

1. "'The Hundred Steps (there are, in fact, 99). A charming climb.'" / "In fact. In print. Somebody's going to be upset about that."
2. "'The Bell: rung at random by a local eccentric.'" / "Ambrose would like a word."
3. "'The Prow Light, at the western tip of the island.'" / "Eastern. Southeast. Not western."
4. "'Tessel keeps its own time, eleven minutes behind the mainland.'" / "Somebody at the Crown would like a word about that too."
5. "'Founded by fishermen in the year of the Great Shoal.'" / "Ottilie will scream."

The inventory's one-line description stays: "Tessel: A Pocket Companion. Confidently wrong on every page. I've grown fond of it."

## End of Act 2: the hundredth step

**Trigger:** use the crowbar on the hollow step after `counter.left`.

1. Cheryl kneels at the step (reach-down pose). Three scrape-and-crunch sounds, each with a 1 px shake.
2. "The mortar's old and soft, as if somebody put it in hoping nobody would ever check."
3. The step lifts away (tile swap: the step becomes a square of darkness with bronze rungs going down). A cold breath of air comes up (the well's breath sound from the opening), with a little mist.
4. Cheryl stands. Internal monologue: *Ninety-nine steps up to the Crown.* / *And the hundredth step goes down.*
5. "A ladder. Bronze, gone green, going straight down into the dark. It smells like the well. It smells like the sea."
6. From landing 2: WOMAN WITH BASIN: Cheryl? Did you just — is that a HOLE in the STEPS?
7. WOMAN WITH BASIN: …No. I didn't see anything. I'm tipping my basin. → she tips her basin and goes back inside her house.
8. Control returns. The step is now an exit. Walking onto it asks, in Cheryl's style: "Go down?" — **Yes** / **Not yet**.
9. **Yes:** Cheryl climbs down (sprite lowers into the hole and disappears). Fade to black. Until Act 3 exists: a card reading **MOONSHINE** over **End of Act 2. Downstairs continues soon.**, then the title screen. When Act 3 exists, this leads to the Step Gallery.

Once open, the step stays open for the rest of the game. Residents walk around it and never mention it (see the story bible on wrong explanations; this one is a refusal to explain).

## Art needed

The art kit already covers most of the surface: paving, walls, windows, doors, flat and tiled roofs, retaining walls, stairs, canal water, banks, the stepped bridge, mooring posts, lamp posts, pots, benches, awnings, laundry, and the cat. New pieces:

**Tiles and objects**
- **Lamp Street:** the Little School facade (a modest civic building with a painted sign, LITTLE SCHOOL), yard paving, the yard's low wall and gate, the scrape-mark strip (2 variants that join along a row)
- **The Crown:** the Bell Tower (4–6 wide, tall: belfry openings, clock face 2×2, heavy door), the Blue Dome exterior (8 wide: a big blue dome over a plastered drum), the Clockmaker's shop front with a hanging clock sign, the sundial (2×2), the south parapet with a stair cut
- **Archive:** curved bookshelves (wall face and freestanding), a desk with teacups, high windows with pooled light on the floor, the Eye (2×2 thick glass in the floor, dark beneath, one highlight), the teapot, the crypt stair
- **Crypt:** record crates, a lectern with a monograph, and **the Founders' Door** (2×2): the first piece of Founder architecture, made in the underground style (dark slate, no mortar, chamfered corners, a faint `relic_cyan` line where the two halves meet)
- **Hundred Steps:** 2-wide flights with retaining walls; a moon-eye riser variant (a round blue stud); the hollow step in three states (dry, wet with water at the joint, open with bronze rungs going down into darkness); a basin; an animated water trickle overlay (about 4 frames) that runs over stairs and landing paving
- **Fountain Square:** the Fountain (4×4 basin), the bronze fish (an entity drawn about 2 tiles tall; its fins look like oars), market stalls with awnings, café tables and chairs, the Mayor's crate, the Mayor's office facade with a small brass plaque
- **Shop:** shelves of lanterns and tins, the counter, the window display with the straw hat, the marble jar (marbles all to one side), a barometer
- **The Bilge:** the Water Stairs (4 wide, walkable top steps; submerged steps under animated water), fish stalls, flooded paving (animated, a thin sheet of water over flagstones), the Boatman's boat (2×1)
- **Harbor:** quay edge, bollards, crates and nets, the ferry *Persistence* (6×2), the lighthouse exterior (a 4-wide tower with the lamp room windows at the top), the Keyhole sea arch, open water
- **Lamp room:** the great lamp (2×2) with a turning shine (3–4 frames), the window ring
- **Goat Path:** terrace bed tiles (beans), a dirt path, cliff edges, Mott's shack (small and weathered), its window showing a copper still, stacked square jugs, the sea cave mouth

**Sprites**
- **New bodies (named characters):** Ambrose Tull (big, old, a bell-ringer's shoulders; sitting with a ledger), Ottilie Brask (tall and thin, spectacles, a long scarf; idle with a teacup), Captain Mott (cap and beard; sitting on a bollard with a square jug)
- **Resident swaps:** Counting Woman (with a civic sash; sitting and counting, plus a march), Woman with Basin (tipping), Woman with Watering Can, Man on Bench (with newspaper), the Mayor (with a chain of office; on a crate, gesturing), Stranded Tourist (sunburnt; sitting; hat and no-hat versions), Fishmonger (apron), Lighthouse Keeper (polishing), Boatman (upper body in the boat, rocking)
- **Kids:** three Skipping Girls (kid-body swaps): rope-turning (2 frames) and jumping (2 frames), plus the rope itself
- **Piano Movers:** Big Mover and Other Mover (a burly body, two swaps): idle, pushing, scrubbing, running
- **The piano** as a movable entity (2×2) for the slide
- **Goats** (walk, 2 frames)
- **Effects:** the water trickle; mist rising from the opened step; "♪" bubble for the Boatman and the Girls

The Clockmaker is heard, not seen, in this slice.

## Audio needed

**Music**
- `neighborhood` (exists): Lamp Street, the Crown, the Hundred Steps, Fountain Square. In the Shop, the same track played muffled (low-pass) as if from outside.
- **`harbor`** (new): the Bilge, the Harbor, and the Goat Path. Same world as `neighborhood` but lower and slower: accordion leading, a lilting 6/8, gulls and water as part of the texture. It should feel salty and a little melancholy.
- **`archive`** (new): the Archive and the crypt. Quiet harp and a single bell, slow, with one turn to the flat sixth (the hidden-city color) that it doesn't resolve. It should feel like dust in sunlight.
- **Discovery sting** (new, short): for the hundredth step opening. Bells on the D-flat chord, rising D♭–E♭–F, with a long echo. Not the Wrongness: wonder, with a chill.

**Sound effects**
- Knocking on a door; a shop bell on entry
- Scrape and crunch of stone and mortar (3 variants); a stone slab lifting
- The piano's slide: a soapy whoosh, a long scrape, a jangle of strings, receding
- A water trickle (loop) and water sinking into a crack (a small gurgle)
- Splashy footsteps for the flooded street
- The Founders' Door hum: a very quiet, steady tone near the door (loop)
- Ambience: town murmur (loop) for the upper town; canal lapping and gulls for the Bilge and Harbor; wind and goat bleats on the Goat Path; the clock's tick on the Crown
- The clock striking the hour (exists in the opening's list) at the Crown
- The Boatman's singing: a wobbly, slightly off-pitch "voice" melody on a reedy synth, a few notes at a time

## Playtest checklist

- [ ] Both threads can be finished in either order, with no softlock, whether or not the piano has moved when the Counting Woman leaves.
- [ ] The long way round (Goat Path → Harbor → Bilge → Square) works and takes no more than about two minutes.
- [ ] Every NPC has a first talk, a repeat, and the item reactions listed; nobody says nothing.
- [ ] The water trickle is easy to see and clearly vanishes into the step.
- [ ] The scrape marks lead the player to the Steps without being told.
- [ ] A player who misses Ottilie still finishes the act (the paper and charcoal are needed only in Act 3).
- [ ] Every line fits in its box.
- [ ] The Kid never blocks the gap beside the Counting Woman: walk up and down flight 3 toward him from both directions, with keyboard and with pointer.
- [ ] The first look at the guidebook in the inventory shows the "ninety-nine" entry.
- [ ] A player who skipped the soap or the hat in Act 1 can still get them from the flat.
- [ ] First-time players finish in 30–40 minutes.

## Decisions

- **Act 2 is eleven maps, all at day, ending at the hundredth step.** The act's job is to open the city, introduce everyone who matters later, and get Cheryl underground.
- **The piano blocks the direct route,** so the first thing the wider city teaches is that there's a long way round, and that way passes half the cast.
- **The Counting Woman climbs over the piano when she storms off,** which Cheryl refuses to do. The thread can't softlock, and it's funny.
- **The Shop's hat is display stock,** so the Tourist's need points at the Shopkeeper's foible, and the answer is Cheryl's own hat at home.
- **Former pupils call Cheryl "Miss."** It's a warm, cheap way to show her history with the town.
- **The Clockmaker is only heard in Act 2.** He appears in Act 4, when his thread starts, which saves a sprite for this slice.
- **The Founders' Door is seen (bolted) in Act 2** and opened from the other side in Act 3. It's the player's first look at Founder architecture.
- **Build Act 2 in two parts** (suggested by the reviewer, xaKh8TS_PJ). **2a:** Lamp Street, the Crown, the Archive and crypt, the Hundred Steps, Fountain Square, and the Shop. The Goat Path gate is shut ("The goats have the path today.") and the Square's way down to the Bilge is roped off ("CANAL CLEANING. KEEP OUT. — by order of the Mayor"). Both threads work, provided the piano goes first, and the act can be finished. **2b:** the Goat Path, Harbor, lamp room, and Bilge loop; then open the gate and the rope. That gets a polished, playable Act 2 out sooner. In 2a, the blocked arch line drops its Goat Path half: "I'm not climbing over a piano at my age."
- **The hollow step is flush with landing 2 and paved like it,** so everyone steps over it without counting. That's why the count is ninety-nine. (From review.)
- **The guidebook can be read,** one entry per look, so the Count thread and the Act 4 Clockmaker lure are discoverable rather than found by trying every item on everyone. (From review.)
- **Residents refuse to notice the open step.** It extends the "wrong explanations" running joke to its limit: some things Tessel just won't see.
