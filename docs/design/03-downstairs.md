# Slice 3 — Downstairs: the First Descent

This is the build-ready design for Act 3 ([overview](overview.md), [story bible](../story-bible.md)). It picks up where [02-city.md](02-city.md) ends: Cheryl climbing down the ladder under the hundredth step. It ends when she walks out of the Founders' Door into Ottilie's crypt and up into the Crown at dusk, to find every doorstep in Tessel glowing.

## The slice in brief

Under the Hundred Steps is a place nobody in Tessel knows exists: straight, dark, fitted stone, ribbed like the inside of something, with dead glass lamps in the walls. Cheryl forces a seized lever with the Movers' crowbar. It's the Keepers' master shutter: a lid in the ceiling opens and daylight falls onto a bronze mirror, and a long run of clunks goes away up the hill as every light-pipe shutter under every doorstep in Tessel opens for the first time since the Great Shake. Turning the mirror sends the beam to three places: two wall inlays (three bars of different widths; the moon's phases) and a sealed hatch with a glass eye. The eye drinks the light and the hatch opens. Inside is a **moonglass disc**, glowing and warm: her light from now on. Behind it, a polished chute drops her, one-way, into the **Lamp Halls**.

The Lamp Halls are dark except for pools of daylight under the street's moon-eyes (which she has just opened) and whatever Cheryl's disc lights. There's a ladder she can drop to make a shortcut back up, a speaking tube that carries the Mayor's voice down from Fountain Square, and a black flooded corridor sloping down that she won't touch. The way north, toward the Crown, is knee-deep in water gushing from a big pipe. The valve wheel beside it has lost its handle: its spindle is square, and the crowbar slips off. In the pitch-dark Keepers' bunk room, once she relights its lamp with the disc, a tool rack holds a bronze valve key. With the key on the spindle, the wheel turns; the passage drains; and down the speaking tube comes a tiny, outraged voice: "The FOUNTAIN!" The wheel jams and won't go back. She has stopped the Fountain of the Fish.

North is the **Chart Room**, under the Blue Dome, lit by a pool of light from the Eye in Ottilie's floor, with a teapot-shaped shadow in it. The last Keeper's chair, cup, and ledger are here (*Rang at the turn. All well.*). The floor is a great picture made of stone: the Crown, the Steps, and the sea coming halfway up the hill. *Oh. Oh, we're a boat.* She takes a charcoal rubbing (the **Ship Plan**) if she has Ottilie's paper. She draws the Founders' Door's three-hundred-year-old bolt and walks into the crypt, where Ottilie decides she must have come in the front and gone round behind.

Up in the Crown it's dusk, and every moon-eye in the plaza is glowing blue. So is every doorstep down the hill. The moonglass drank daylight all afternoon through the shutters she opened, and now it's giving it back. Cheryl did that, and she did the Fountain too.

**Playtime:** 18–25 minutes. **Maps:** 5 new (Step Gallery, Cradle, Lamp Halls, Bunk Room, Chart Room), plus dusk versions of the Crypt and the Crown. **NPCs:** Ottilie, plus Ambrose, the Kid, and the Woman with Watering Can on the Crown at dusk. **New items:** moonglass disc, valve key, Ship Plan.

### What the slice adds

| New thing | Where |
| --- | --- |
| Darkness, and carrying your own light | The Lamp Halls, with the disc |
| Light as a puzzle tool: redirect a beam, wake a lock | The Step Gallery's mirror |
| One-way passages, and making a shortcut home | The chute; the drop-ladder |
| An action that visibly harms the city above | The valve and the Fountain |
| Reading a place instead of being told | The Chart Room floor |

This act is more linear than the others on purpose: it's a descent into an unknown place, and the player should feel led *down*. Its one multi-step puzzle is the valve: the crowbar fails on the square spindle, the dark bunk room needs its lamp relit with the disc, and only then is the valve key on the tool rack visible. The side content (the speaking tube, the ledger, the inlays, the other lamps) keeps it from feeling like a corridor, and the shortcut ladder can be dropped at any point.

## The look and sound of Downstairs

Everything follows the art direction's underground section and the story bible's "Architecture and technology."

- **Straight, dark, precise.** Fitted slate blocks with no mortar; chamfered corners; large square floor plates. Ceiling ribs on the overhead layer every four tiles, like a hull's frames (nobody says so).
- **Light is local.** The underground is dark; light comes from daylight shafts, light-pipes, moonglass lamps (cool cyan), and Cheryl's disc. The surface's warm colors never appear here.
- **Quiet.** Cheryl's descriptions get shorter. Humor drops nearly to nothing. A slow, deep creak sounds every 20 seconds or so, far off: the city at its mooring.

### Engine need: darkness and lights

Downstairs maps can be **dark**: a darkness layer over everything, with light sources cutting soft-edged circles out of it, stepped in 2–3 bands rather than smooth gradients (to keep the SNES look).

- A map has `dark: 0..1` (Step Gallery 0.6, Lamp Halls and Bunk Room 0.9, Chart Room 0.5).
- Light sources: a radius in tiles and a color. Some are fixed (light-pipes, lit lamps, the daylight shaft, the Eye's pool). One follows Cheryl while she carries the disc (radius 3, cyan).
- Lights can be turned on by script (relit lamps, the beam, the opened hatch).

Without the disc, the Lamp Halls would be almost black; but the player always has the disc before reaching them.

The engine supports this (engine/core, 156a0cc): `dark: 0.6` on the map; fixed sources as `lights: [{ x, y, radius, color, when }]`, where `when` ties a lamp or beam to its flag; and `playerLight: (g) => g.hasItem('moonglass_disc') && { radius: 3, color: 'relic_cyan' }`. Lights don't stop at walls, so keep light sources away from walls they shouldn't shine through. The Ship Plan's full-screen view uses the item `examine` hook with `g.showPicture(...)`, `g.waitForInput()`, and `g.hidePicture(...)`.

## Maps

North walls are two tiles tall. Wall features marked on the lower wall row (lamp niches, inlays, the speaking horn, the tool rack) are drawn on the upper row by the art; the interaction tile stays where the map marks it. The art index for every piece, with positions, is `docs/art-downstairs.md` (art/foundation). The Chart Room inlay's tiles are `chart:inlay_x<col>y<row>` with col = map x − 3 and row = map y − 5.

Shared underground legend:

| Glyph | Meaning | Walkable |
| --- | --- | --- |
| `X` | Solid rock (black void) | No |
| `#` | Slate wall face | No |
| `.` | Floor plates | Yes |
| `:` | Floor plates, passage | Yes |
| `~` | Water: flooded floor or deep water (see notes) | No, unless noted |
| Letters | Named in each map's notes | As noted |

### Step Gallery (24 × 11)

A long, low deck under the Hundred Steps. The ladder from the hollow step comes down the north wall at the west end, into a spot of daylight. In the middle of the ceiling is a lidded light shaft over a bronze mirror on a pedestal at (11, 6). The north wall carries two inlays, a lever, and a sealed hatch. **The three beam targets lie on straight lines from the mirror:** the Sisters inlay up and to the left at 45° (its right half, x7), the moons inlay straight up (its right half, x11), and the hatch up and to the right at 45° (x15), each four rows up.

```
     x 0         1         2
       012345678901234567890123
 y  0  XXXXXXXXXXXXXXXXXXXXXXXX
    1  X##H###################X   H the ladder up to the Hundred Steps, on the wall face (3, 1-2)
    2  X#LH##II##II###O###V##LX   L lamps (2, 22); II inlays: Sisters (6-7), moons (10-11)
    3  X......................X   O the sealed hatch with its moon-lock (15); V lever (19)
    4  X......................X   daylight spot under the ladder (3, 3)
    5  X......................X
    6  X..........M...........X   M the mirror on its pedestal (11, 6), under the light shaft
    7  X......................X
    8  X.....G................X   G floor grate (6, 8): later the drop-ladder from the Lamp Halls
    9  X......................X
   10  XXXXXXXXXXXXXXXXXXXXXXXX
```

**Light:** `dark: 0.6`. The daylight column at the ladder (radius 2, warm white: the only warm light Downstairs). The two lamps start dead. Once the lever is pulled, the shaft light falls on the mirror (radius 1), and a beam sprite runs from the mirror to whichever target it's pointed at, with a small glow where it lands.

**Ceiling ribs** (overhead) cross at x5, x9, x13, x17, x21.

**Exits:** ladder (3, 2), entered by walking up into it from (3, 3) → Hundred Steps (10, 18), facing down. Arriving from the Steps puts Cheryl at (3, 3). Hatch (15, 2), once open, entered from (15, 3) → Cradle (3–4, 4), facing up. Floor grate (6, 8), once the ladder is dropped → Lamp Halls (8, 6), facing down.

**Ladders after the valve.** From `halls.valve` until the act ends, both ways back up (this ladder and the Lamp Halls' drop-ladder) decline: before the Chart Room, "Not now. I want to see where that passage goes."; after `founders.unbolted`, "Not that way. Ottilie's door is quicker." The act's only exit is then the Founders' Door, so the world is never seen in an unspecified state (a dry Fountain by daylight). Before the valve, going back up is fine: the surface is in its Act 2 daytime state.

**Music:** `downstairs`.

### Cradle (8 × 6)

A small chamber behind the hatch: the disc in its cradle, and the mouth of the chute.

```
     x 0
       01234567
 y  0  XXXXXXXX
    1  X######X
    2  X#CC#d#X   CC chute mouth (2-3, 2); d the disc's cradle, a wall niche (5, 2)
    3  X......X
    4  X......X
    5  XXX..XXX   exit south (3-4, 5) → Step Gallery (15, 3)
```

**Light:** `dark: 0.6`; the cradle glows (radius 2, cyan) until the disc is taken, after which the disc lights Cheryl instead.

### Lamp Halls (32 × 14)

The main deck: a long hall with light-pipes coming down from the street above, the chute's mouth, the drop-ladder's chain, a doorway to the Keepers' bunk room, a speaking tube, the big valve wheel, and two flooded ways: the passage north (to the Chart Room), which drains when the valve turns, and the corridor south and down, which never does.

```
     x 0         1         2         3
       01234567890123456789012345678901
 y  0  XXXXXXXXXXXXXXXXXXXXXXXXX::XXXXX   :: passage north → Chart Room (25-26, 0)
    1  XXXXXXXXXXXXXXXXXXXXXXXX#~~#XXXX   ~~ the flooded north passage (25-26, 1-6)
    2  XXXXXXXXXXXXXXXXXXXXXXXX#~~PXXXX   P the gushing pipe (27, 2)
    3  XXXXXXXXXXXXXXXXXXXXXXXX#~~#XXXX
    4  X#######q#############WW#~~#XXXX   qQ the counterweighted ladder, on the wall face (8, 4-5)
    5  X##CC###QL###DD###L#T#WW#~~#XXXX   CC chute mouth (3-4); L lamps (9, 18);
    6  X........................~~..XXX   DD doorway to the bunk room (13-14); T speaking tube (20);
    7  X............................XXX   WW the valve wheel, 2x2 (22-23, 4-5), used from (22-23, 6)
    8  X............................XXX
    9  X............................XXX
   10  X............................XXX
   11  XXXXXXXXXXXXXXXXX~~XXXXXXXXXXXXX   ~~ the drowned corridor south (17-18, 11-13)
   12  XXXXXXXXXXXXXXXXX~~XXXXXXXXXXXXX
   13  XXXXXXXXXXXXXXXXX~~XXXXXXXXXXXXX
```

- `~` in the north passage (25–26, 1–6) is fast, knee-deep water: solid until the valve turns, then drained floor (walkable, wet-looking).
- `~` in the south corridor (17–18, 11–13) is still, black, deep water sloping away: always solid.

**Entities:** light-pipes at (6, 8), (14, 8), (22, 8), placed between the ceiling ribs so the overhead layer never hides them: glass rods from the ceiling with a pool of daylight under each (radius 2). The drop-ladder is on the north wall at (8, 4–5), hooked up high with its chain and cleat, until pulled down. Cheryl lands from the chute at (3, 7).

**Ceiling ribs** at x4, x8, x12, x16, x20, x24.

**Light:** `dark: 0.9`. Light-pipe pools (lit, because the lever opened their shutters; the player never sees them shut); dead lamps at (9, 5) and (18, 5) until relit (radius 3 when lit); Cheryl's disc.

**Exits:** north passage (25–26, 0), once drained → Chart Room (7–8, 12), facing up. Bunk room doorway (13–14, 5) → Bunk Room (4–5, 5), facing up. Drop-ladder (8, 5), once dropped, entered by walking up into it from (8, 6) → Step Gallery (6, 7), facing down. Coming down through the Step Gallery's grate arrives at (8, 6).

**Music:** `downstairs`.

### Bunk Room (10 × 7)

Where the Keepers slept. Stone bunks, a tool rack, a table with a cup, and a wall inlay of a bell and a wave, alternating. It's pitch dark: no light-pipes reach it, and the disc alone lights only the doorway half of the room. The tool rack, with the **valve key** on it, is in the dark corner, and only shows once the lamp at (2, 1) is relit.

```
     x 0
       0123456789
 y  0  XXXXXXXXXX
    1  X#L#II#RRX   L lamp (2); II the duty-roster inlay (4-5); RR the tool rack (7-8)
    2  X........X
    3  XBB....BBX   BB stone bunks (1-2, 7-8)
    4  X..c.....X   c a stone table with a cup (3, 4)
    5  X........X
    6  XXXX..XXXX   exit south (4-5, 6) → Lamp Halls (13-14, 6)
```

**Light:** `dark: 0.97`. The disc's radius here is 2 (the room swallows light). One dead lamp at (2, 1); once lit (radius 4) it shows the whole room, including the rack. Until then the rack's tiles are drawn but too dark to read, and interacting there gets "Too dark to see what's there. Something hangs on the wall."

### Chart Room (16 × 14)

An eight-sided room under the Blue Dome. A pool of light falls from the Eye in Ottilie's floor onto the middle of a great pictorial floor inlay, with the shadow of her teapot in it. The last Keeper's chair and table sit to one side. The Founders' Door is in the north wall, bolted from this side.

```
     x 0         1
       0123456789012345
 y  0  XXXXXXXXXXXXXXXX
    1  XXX##########XXX
    2  XX#####FF#####XX   FF the Founders' Door, inside (7-8, 2): a bronze bolt across it
    3  XX............XX
    4  X.kt...........X   k the Keeper's chair (2, 4); t table with cup and ledger (3, 4)
    5  X..mmmmmmmmmm..X
    6  X..mmmmmmmmmm..X   mm the floor inlay (3-12, 5-10), walkable
    7  X..mmmmmmmmmm..X
    8  X..mmmmmmmmmm..X
    9  X..mmmmmmmmmm..X
   10  X..mmmmmmmmmm..X
   11  XX............XX
   12  XXX....::....XXX
   13  XXXXXXX::XXXXXXX   :: passage south → Lamp Halls (25-26, 1)
```

The corners (`X` at the row ends) are chamfered walls; draw them as 45° wall pieces.

**The floor inlay** (10×6 tiles): Tessel drawn as a ship, in the Founders' pattern language, but pictorial. Hotspots (each is a look target; see the dialog below). Positions follow the art task's drawing (`chart:inlay_x0y0`…`x9y5`), placed at x3–12, y5–10. Where hotspots overlap, the first one in this priority order wins: **Sisters > teapot > shaft > mast > chain > waterline > hull > town.**

| Hotspot | Tiles | Shows |
| --- | --- | --- |
| The mast | (7, 5–6) | The Bell Tower drawn as a mast at the hill's crown, a rope from the bell going down into the hull |
| The town | (4–11, 6–7) | Little houses stepping up the hill on both sides of the mast |
| The teapot shadow | (7–8, 6–8) | Inside the Eye's pool of light, over the middle of the town |
| The shaft and bowl | (6, 6–9) | A straight cyan line from a house near the top down to a round bowl at the bottom |
| The waterline | (3, 8–9) and (12, 8–9) | Little waves on either side, at the hill's shoulders: the sea comes up to there |
| The hull | (4–11, 8–10) | Below the waves, the hill keeps going, curved underneath, hollow, ribbed |
| The Sisters | (8–9, 9) | Three upright bars of different widths |
| The chain | (11–12, 8–10) | From the bow end, a chain down to an anchor |

**Light:** `dark: 0.5`; the Eye's pool (radius 3, cool daylight) centered at (7–8, 7–8).

**Exits:** south (7–8, 13) → Lamp Halls (25–26, 1), facing down. Founders' Door (7–8, 2), once unbolted → Crypt (5–6, 3), facing down.

**Music:** `downstairs`, which drops out when the inlay sequence starts; then the **reveal** cue.

### Crypt and Crown at dusk (Act 2 maps, new states)

- **Crypt:** the Founders' Door can now be open (a dark doorway with steps going down). Walking into it → Chart Room (7–8, 3), facing down. It's two-way from now on.
- **Crown at dusk:** dusk tint. Moon-eye studs set into the plaza's paving glow cyan, at (5, 8), (9, 12), (14, 9), (18, 12), (3, 10), (20, 8), and in the stair at (11–12, 14). Act-end residents are placed (see "Surfacing").

## State

| Flag | Set when | Effect |
| --- | --- | --- |
| `act3.started` | Cheryl first climbs down from the hollow step | |
| `gallery.lever` | Crowbar used on the lever | Shaft lid open; beam on the mirror; every light-pipe shutter in Tessel open (the Lamp Halls' pipes lit; the moon-eyes charge all afternoon) |
| `gallery.mirror` | 0 = flat along the floor, east (no target), 1 = up-left to the Sisters inlay, 2 = straight up to the moons inlay, 3 = up-right to the hatch | Which target is lit |
| `gallery.hatch` | The beam reaches the moon-lock | Hatch open, for good |
| `got.disc` | Disc taken | Cheryl carries light |
| `halls.ladder` | Chain pulled | Drop-ladder down; Step Gallery grate open; two-way shortcut |
| `lamp.<id>` | Disc used on a dead lamp | That lamp lit, permanently; the Bunk Room's lamp reveals the tool rack |
| `got.valveKey` | Key taken from the tool rack | |
| `halls.valve` | Valve key used on the valve wheel | North passage drained; **the Fountain stops**; wheel jammed; key stays on the spindle; both ladders up decline |
| `chart.seen` | The inlay sequence plays | |
| `got.shipPlan` | Paper and charcoal used on the inlay | Paper consumed; Ship Plan gained |
| `founders.unbolted` | The bolt is drawn | Founders' Door two-way |
| `act3.surfaced` | Cheryl first leaves the Archive after `founders.unbolted` (the only way up by then) | Crown at dusk; moon-eyes glow; act-end sequence |
| `moonEyes.glow` | Set with `act3.surfaced` | In later acts, moon-eyes glow on every surface map at dusk and night |

## The puzzle

```
 crowbar (Act 2) ─► lever ─► daylight on the mirror ─► turn mirror to the hatch ─► hatch opens
                                                                                      │
                                                                          take the DISC (light)
                                                                                      │
                                                                       chute (one-way) to the Lamp Halls
                                                                                      │
             ┌────────────────────────────────┬──────────────────────────────────────┤
             ▼                                ▼                                      ▼
   pull the chain: drop-ladder       crowbar on the valve wheel:              (optional) relight hall
   (shortcut to the Step Gallery;    slips off the square spindle             lamps, speaking tube
    declines after the valve)                 │
                                     disc on the Bunk Room's dead lamp:
                                     the room lights; the tool rack shows
                                              │
                                     take the VALVE KEY
                                              │
                                     valve key on the wheel: the passage
                                     drains, the Fountain stops, it jams
                                                │
                                                ▼
                                     Chart Room: the inlay ─► "Oh, we're a boat."
                                                │
                           ┌────────────────────┼─────────────────────┐
                           ▼                    ▼                     ▼
                read the Keeper's ledger   draw the bolt         paper and charcoal on the inlay
                     (optional)                 │                  → SHIP PLAN (needs Ottilie's paper;
                                                ▼                    if missing, get it from her and
                                     crypt → Ottilie → Archive        come back through the door)
                                                │
                                                ▼
                                   the Crown at dusk: the glowing doorsteps
                                          END OF ACT 3
```

- **The crowbar opens the act; the valve key finishes it.** The player can't reach Act 3 without the crowbar (it opened the hundredth step). The valve key is in the Bunk Room, which is always reachable from the Lamp Halls, so there's no softlock.
- **The Ship Plan isn't required to end the act,** only to make progress in Act 4. A player without paper gets it from Ottilie in the crypt scene and can go straight back down through the Founders' Door.
- **The mirror is a toy, not a puzzle.** It cycles through three targets; every position lights something, and one of them opens the hatch. Its job is to teach that light opens Founder locks.

### Hints in the world

| What the player needs | Who or what says so |
| --- | --- |
| The lever opens something above the mirror | Cheryl's look at the lever |
| The crowbar works as a lever | "I need a lever for my lever. I happen to have a crowbar." (the seized lever's second look) |
| The wheel needs a proper key | The crowbar slipping off the square spindle: "Square. The crowbar's round. Nothing doing." / "Somebody had a key for this." |
| The bunk room is worth lighting | Its doorway look: "Pitch dark in there. Darker than the hall. My disc barely gets past the door." The disc already relit a lamp in the Step Gallery or the hall |
| The hatch wants light | The hatch's look: "A glass eye in the middle. It looks like it's waiting for something." Then the beam |
| The north passage is the way on | Cheryl: "North. Toward the Crown. Knee-deep and running fast." The valve is right next to it |
| The disc can relight lamps | The disc's description, and the first dead lamp's look while carrying it |

## Objects and descriptions

All Cheryl unless labeled. "First / then" follows the look counter.

### Arriving

On first arriving in the Step Gallery (from the ladder), after a two-second pause with Cheryl standing in the daylight column:
- *Under the Steps.*
- *All this, under the Steps. All this time.*

### Step Gallery

- **Walls**: First: "Stone, fitted so tight you couldn't get a hair between the blocks. No mortar." / "Nobody in Tessel builds like this. Nobody in Tessel builds *straight*." Then: "Straight lines, all the way along."
- **Ceiling ribs** (look from under one): "Ribs across the ceiling, every few paces. Like being inside something."
- **The ladder** (3, 2): "The ladder back up. Daylight, and the Woman with Basin, pretending she can't see me." → climbing up is an exit.
- **Lamps** (2, 2 and 22, 2): Without the disc: "A lamp of milky glass in a niche. Dead. Cold." With the disc, as a hint: "A dead lamp. It looks like the disc, only hungrier." Use the disc → lit: "It drinks from the disc and wakes up. So do I, a little." Lit: "Lit. Somebody's home."
- **The lever** (19, 2): First: "A bronze lever, green and seized solid." / "There's a lid in the ceiling over the mirror. I think this opens it." Then: "Seized. I need a lever for my lever. I happen to have a crowbar."
- **Crowbar on the lever** → `gallery.lever`: Cheryl heaves (two shakes, a grind). The ceiling lid scrapes open. Daylight drops onto the mirror (a light column, then a beam in its current direction). Then, from the ceiling, a long run of clunks going away up the hill, one after another, fainter and fainter, for about four seconds. "Daylight. Straight down a shaft from somewhere above." / "And that clunking, all the way up the hill. I've opened more than one lid."
- **Lever after**: "Open. It stays open. Whatever else it opened stays open too."
- **The mirror** (11, 6): Before the lever: "A bronze mirror on a pivot. Tarnished, but true. It's pointing at nothing in particular." After the lever, each interaction turns it one step (a clunk), cycling 1 → 2 → 3 → 1, and the beam swings:
  - **Position 1, up-left: the Sisters inlay** (6–7, 2): the inlay lights. "Three bars of different widths, side by side." / "They mean something to somebody."
  - **Position 2, straight up: the moons inlay** (10–11, 2): the inlay lights. "Moons, as squares filling up. New, quarter, half, full." / "Somebody watched the moon very carefully. I know the feeling."
  - **Position 3, up-right: the hatch** (15, 2): see "The hatch opens."
  - The mirror starts at position 0, throwing the beam flat along the floor to the east, where it pools on nothing. The first turn always produces something.
- **Inlays**, looked at directly (lit or not): the lines above, without the beam.
- **The hatch** (15, 2): Before: "A square hatch, sealed flush. No handle. A round glass eye in the middle." / "It looks like it's waiting for something." Crowbar: "No seam. Whoever made this didn't make doors for crowbars." (The same as the Founders' Door, deliberately.)
- **The hatch opens** (beam at position 3, the first time) → `gallery.hatch`: the eye fills with light and glows cyan; a chime; the hatch grinds open. "The glass drinks the light, and the hatch opens." / "Not a lock that wants a key. A lock that wants the sun."
- **Floor grate** (6, 8): Before the drop-ladder: "A grate in the floor. Underneath, a darker kind of dark." After: "The top of the ladder I dropped. My way back, if I want one."

### Cradle

- **The cradle** (5, 2), with the disc: "A disc of milky glass, in a bronze cradle. It's glowing." → take → `got.disc`: "It's warm. I wasn't expecting warm." → *Got Moonglass Disc.* The disc's light now follows Cheryl.
- **The empty cradle**: "An empty cradle. I'll bring it back. I think I'll bring it back."
- **The chute** (2–3, 2): "A smooth slot in the wall, sloping away into the dark. Polished smooth. People used this. Often."
  - Without the disc: "Not into the dark without a light."
  - With the disc: choice "Go down?" — **Yes** / **Not yet**. Yes → the chute sequence.

### The chute

Cheryl sits at the mouth and lets go. Fade to black with a long sliding whoosh that drops in pitch, two bumps, a soft thump. Fade in on the Lamp Halls, dark, with Cheryl sitting at (3, 7) in her own pool of cyan light. She stands. A description (not monologue): "Well. I won't be going back up that."

### Lamp Halls

- **The hall** (first look anywhere on the floor, or automatically 3 seconds after landing): "A long hall going east, ribbed like the gallery. Pools of daylight here and there, coming down through the ceiling."
- **Light-pipes**: First: "A glass rod coming down through the ceiling, full of daylight." / "That's the bottom of a moon-eye. Somebody's doorstep is up there." / "Daylight, coming down. Did I do that? I think I did that." Then: "Somebody's doorstep. I wonder whose."
- **Lamps** (9, 5) and (18, 5): as in the Step Gallery.
- **The hooked-up ladder** (8, 4–5): First: "A ladder, hooked up high on the wall, and a bronze chain hanging from its cleat. Up above it, a dark square." Pull the chain → `halls.ladder`: a rattle, a crash, and the ladder drops to the floor. "That'll save my knees." Then: "The ladder, down. A way back to the gallery and the Steps."
- **The chute mouth** (3–4, 5): "Where I came in. It's a long way up, and it's polished."
- **The speaking tube** (20, 5): a bronze horn in the wall. Before the valve, each listen plays one faint line in turn (speaker label FAR-OFF VOICE, small italic):
  1. FAR-OFF VOICE: …Tessel: Forward!… …please disperse…
  2. *(only if `counter.left`)* FAR-OFF VOICE: …a HUNDRED, Duncan…
  3. FAR-OFF VOICE: …lemons, onions…
  Cheryl, after the first: "A speaking tube. Somebody up there is saying 'Tessel: Forward.' It's coming from the Square." After the valve: "Very quiet up there now. Very, very quiet."
- **The valve wheel** (22–23, 4–5; art `machines:valve_spindle_*`, then `valve_key_*`, `valve_key_turned_*`, `valve_key_jammed_*`): First: "A big bronze wheel, beside the flooded passage. Its handle's gone; there's only a bare square spindle." Then: "A square spindle. It wants a key."
- **Crowbar on the wheel**: "Square. The crowbar's round. Nothing doing." / "Somebody had a key for this."
- **The north passage, flooded** (25–26, 1–6): First: "The passage north. Toward the Crown." / "Knee-deep and running fast. It'd have me off my feet and down the other corridor in a moment." Then: "Knee-deep and running. Not without a reason to."
- **The gushing pipe** (27, 2): "Fresh water, gushing out of a cracked pipe. Not seawater. It smells like the Fountain on a hot day."
- **Valve key on the valve wheel** → `halls.valve`. See "The valve."
- **The bunk room doorway** (13–14, 5): "Pitch dark in there. Darker than the hall. My disc barely gets past the door."
- **The drowned corridor** (17–18, 11–13): First: "The floor slopes down into black water. It doesn't ripple." / "It goes down a long way. I'm brave, not stupid." Then: "No."
- **Walls, ribs**: as in the Step Gallery.

### The valve

1. Cheryl fits the valve key onto the spindle and heaves. A groan; a 1 px shake; again; a 2 px shake. The wheel turns with a long grinding squeal.
2. The gushing pipe slows and stops. Down the passage the water drains away over two seconds with a gurgle (tiles swap from flowing water to wet floor).
3. Silence for one second.
4. Down the speaking tube at (20, 5), small and far away: FAR-OFF VOICE: The FOUNTAIN! The Fountain's STOPPED!
5. FAR-OFF VOICE: Five hundred YEARS!
6. Cheryl tries the wheel back. It won't move. "It won't go back. It's jammed for good, key and all."
7. "I've stopped the Fountain. Five hundred years, and I've stopped it."

The valve key stays jammed on the spindle (removed from the inventory). Afterward, the wheel: "Jammed. Whatever I've done, I've done it." The passage: "Drained. Wet, but walkable. North."

### Bunk Room

- **Bunks**: First: "Stone bunks. Hard as a church pew, and narrower." / "People slept down here. Lived down here." Then: "Nobody's slept here for a very long time."
- **The duty-roster inlay** (4–5, 1): First: "A bell, then a wave. A bell, then a wave. All along the wall." / "A timetable. For ringing a bell when the tide turns." Then: "Ambrose would like this wall."
- **The tool rack** (7–8, 1): Before the lamp is lit: "Too dark to see what's there. Something hangs on the wall." After: "Bronze tools, hung up neatly. Spanners as long as my arm. Somebody looked after these." / "And a key with a square socket. The same size as that spindle, I'd bet." → take → `got.valveKey`; *Got Valve Key.* Then: "Spanners. Somebody looked after these."
- **The cup** (3, 4): "A cup. Left on the table as if someone meant to come back for it."
- **The lamp** (2, 1): Dead: "A dead lamp. It looks like the disc, only hungrier." Disc on it → lit, and the whole room comes up out of the dark: "It drinks from the disc and wakes up, and so does the room."

### Chart Room

**Entering** (first time): the music drops out. Cheryl walks to the inlay's edge at (7, 11) and stops (scripted). The camera pans slowly up across the inlay from bottom to top, then settles back on her. The pan does the work; Cheryl says only enough to point:
1. "The floor's a picture. Stone, set in stone."
2. "The Crown. The Steps. That's us."
3. "And the sea comes up to… there. Halfway up the hill."
4. Internal monologue: *Oh.*
5. Internal monologue: *Oh, we're a boat.*
6. The **reveal** cue plays. `chart.seen`.

The hollow hull, the chain, and the bowl are left to the hotspots for players who look.

**Hotspots** (looked at afterward):
- **The town**: "Tessel, in little stone houses. Somebody got the Steps exactly right."
- **The mast**: "The Bell Tower, drawn as a mast. A rope from the bell goes down inside the hull, to a wheel." / "Ambrose's bell is attached to something."
- **The hull**: "Decks, ribs, rooms. Everything under our feet, all this time."
- **The Sisters**: "Three upright shapes, amidships. Different sizes. Ottilie would have a theory."
- **The chain**: "A chain from the Prow to an anchor. The links are drawn like little eyes."
- **The shaft and bowl**: First: "A straight shaft, from a narrow house near the top of town all the way down to a bowl at the bottom." / "There's a moon drawn in the bowl." / "That's my end of town. That's very nearly my house." Then: "A moon in a bowl. A narrow house. I'll think about that later."
- **The waterline**: "Little waves at the hill's shoulders. I keep looking at them and they keep being true."
- **The teapot shadow**: "And over the middle of the town, the shadow of a teapot. Ottilie's mother, keeping an eye on things."
- **Paper and charcoal on the inlay** → `got.shipPlan`: "I kneel on the Founders' floor and rub charcoal over it like a schoolgirl doing a brass." / "Ottilie would faint. Then she'd want it framed." → paper and charcoal removed; *Got Ship Plan.*
- **Anything else on the inlay**: "No. Not on this."

**The Keeper's things:**
- **The chair** (2, 4): First: "A stone chair, worn smooth in the seat." / "Somebody sat here and waited a long time." Then: "I'm not sitting in it. It's still somebody's."
- **The cup** (3, 4): "A cup. Empty three hundred years, by the look of it. I know that cup. Every teacher has that cup."
- **The ledger** (3, 4): Each look reads one entry, newest first, cycling. "Old spelling, a shaky hand, but I can read it." precedes the first.
  1. "'Rang at the turn. All well.' The last page."
  2. "'Stair fallen. Brannoc and the others beneath it. I have bolted the door. Someone must stay.'"
  3. "'Sisters asleep. Moon true in the bowl.'"
  4. "'Past full: allow two fingers.'"
  5. "'Bell at the turn. Bell at the turn. Bell at the turn.' Pages of it."
  After the first time through: "'Rang at the turn.' That's what Ambrose says. Word for word."

**The Founders' Door** (7–8, 2), bolted:
- First: "The other side of Ottilie's door. A bronze bolt as thick as my arm, shot home from this side." / "'I have bolted the door. Someone must stay.'" (Only the second box if the ledger hasn't been read: "Somebody bolted this from in here. And stayed in here.")
- Interact again → draw the bolt → `founders.unbolted`: a long grind, a clank, and the door swings outward, letting a little lamplight down from the crypt. "Three hundred years. It moves like it's been waiting." The door is now an exit; walking through starts "Surfacing."

## Surfacing

**Trigger:** first walk through the Founders' Door after unbolting.

**In the crypt** (dusk; lamplight from the stair):
1. Cheryl steps out at (5–6, 3). From the stair (1, 5), Ottilie comes down holding a lamp.
2. OTTILIE: Who's down there? I heard— CHERYL?
3. OTTILIE: The Founders' Door. It's open. That door doesn't open. I have a monograph.
4. OTTILIE: …You came in the front and went round behind. There's probably a gap. I'll find it. I'll write about it.
5. *If Cheryl doesn't have paper and charcoal:* OTTILIE: And if you're going to wander about behind my walls, take rubbings. Here. → *Got Paper and Charcoal.*
6. *If Cheryl has the Ship Plan:* OTTILIE: Cheryl. Is that charcoal on your knees? What did you rub? Don't tell me. Yes, tell me. Tomorrow. I'm too upset.
7. OTTILIE: It's nearly dark. Have you been in my crypt all afternoon? Go home. Have some soup.
8. Ottilie goes back up the stair. Control returns. (The door stays open behind Cheryl; she can go back down for the rubbing.)

**Ottilie in the Archive afterward** (repeat): OTTILIE: A gap. There's a gap somewhere. Three hundred years and I missed a gap. / With the Ship Plan shown: OTTILIE: Tomorrow, Cheryl. I need a night with this. And a sherry.

**The Crown at dusk** (`act3.surfaced`, the first time Cheryl leaves the Archive):
1. The Crown, dusk tint. The moon-eye studs in the plaza glow cyan, each slowly brightening and dimming. A light, rising, glassy shimmer is in the air.
2. Ambrose at his step, the Kid by the sundial, and the Woman with Watering Can by the stair (all new placements for this scene). Each can be talked to; the scene ends when Cheryl walks to the south parapet.
   - AMBROSE: THE STEPS ARE GLOWING. EVERY STEP IN TESSEL. NOBODY RANG FOR THAT.
   - AMBROSE (repeat): SOMETHING'S AWAKE THAT WASN'T. I CAN FEEL IT IN MY TEETH.
   - SWEATY KID: Miss! The steps are GLOWING! I ran down AND up and they glow ALL THE WAY!
   - SWEATY KID (repeat): I'm gonna run them in the dark. You can see where to put your feet!
   - WOMAN WITH WATERING CAN: Glowing doorsteps, and the Fountain's stopped dead. Five hundred years! Everyone's in the Square.
   - WOMAN WITH WATERING CAN: My husband says it's the Pelletier boys.
   - WOMAN WITH WATERING CAN: Who are on the mainland. Which is exactly what they'd want you to think.
   - WOMAN WITH WATERING CAN (repeat): The Mayor says it's thieves. Water thieves. With glowing paint.
3. **At the south parapet** (trigger): Cheryl stops and looks out. Cut to the **vista**: Tessel from the Crown at dusk, stepping down to the Bowl, every doorstep and stair a point of cyan light, like a necklace spilled down a hill; the Bowl dark; the Rim and the Gate against a violet sky. Music: the **reveal** cue's last phrase, softly.
4. Internal monologue over the vista: *That was me.* / *The Fountain was me, and the lights were me.* / *I've been down there one afternoon.*
5. Fade to black. Card: **MOONSHINE** over **End of Act 3. Tessel continues soon.** Until Act 4 exists, back to the title. When it exists, Act 4 begins the next morning.

If the vista isn't ready when the slice is built, play step 4 over the Crown map with the camera on the parapet, and keep the vista for polish.

## Items

| Item | Icon idea | Inventory description |
| --- | --- | --- |
| Moonglass disc | A milky disc with a cyan glow and a thin bronze rim | "A disc of milky glass. It glows, and it's warm. Lamps down here like it." |
| Valve key | A bronze T-handle with a square socket | "A Keepers' valve key. Bronze, heavy, with a square socket. Somebody hung it up neatly." |
| Ship Plan | A folded sheet, charcoal-grey, with a curve drawn on it | "My rubbing of the Founders' floor. Tessel, drawn as a boat. I've folded it in quarters, which feels rude." |

**Reading the Ship Plan** (examining it in the inventory) shows it full-screen: a 256×224 charcoal rubbing of the inlay on off-white paper, with smudges and Cheryl's thumbprint in one corner. Any key or tap closes it. This needs an item-examine hook in the engine (the same hook the guidebook uses to cycle its entries in Act 2).

### Wrong combinations

- Disc on any object without a specific line: "It glows at it. Nothing happens. The disc doesn't seem to mind."
- Crowbar on Founder walls, inlays, or doors: "No seam. Whoever made this didn't make things for crowbars."
- Paper and charcoal on the Step Gallery inlays: "Three bars. I'll remember three bars." (The rubbing worth taking is in the Chart Room.)
- Guidebook anywhere Downstairs: the generic fallback.
- Anything on the drowned corridor: "No. Not into that."
- Valve key on anything but the valve wheel: "It's a key for something square. That isn't square."

## Art needed

Sent early to the art task (Kn_OwEk0wq). Everything is in the underground style unless noted.

**Tiles and objects**
- Slate wall faces (plain, with a lamp niche, cracked); floor plates (2–3 variants, wet variant); rock void; chamfered 45° corner walls (for the Chart Room)
- Ceiling ribs (overhead, crossing the full width of a corridor)
- The bronze ladder up into a square of daylight (underside of the hundredth step)
- The wall lever (seized, open) and the ceiling lid over the mirror (closed, open: drawn as a shaft opening on the overhead layer)
- The mirror on a pedestal, in four angles: flat to the east (rest), up-left, straight up, and up-right
- Beam sprites: a vertical daylight column onto the mirror; a horizontal beam (for the rest position, ending in a glow on the floor); a vertical beam up to the wall; **45° diagonal beams up-left and up-right** (4 tiles each, ending on the wall); a small glow where a beam lands
- The art index for these pieces is [art-downstairs.md](../art-downstairs.md) (on the art branch until merged)
- Two wall inlays (2 wide): three bars of different widths; moon phases as filling squares; both with lit variants. A third, the duty roster (a bell, a wave, alternating), for the Bunk Room
- The sealed hatch with a moon-lock eye: dark, glowing, open
- The disc cradle (with and without the disc, glowing)
- The chute mouth
- Moonglass lamps in niches: dead and lit
- Light-pipes: glass rods descending from the ceiling, glowing, with a pool of light below
- The drop-ladder on the wall face: hooked up (with its chain and cleat), and down; the floor grate in the Step Gallery (closed, and open with a ladder top)
- The speaking tube: a bronze horn
- The valve wheel with a bare square spindle (and with the valve key fitted, turned, jammed); the gushing pipe (animated) and its stopped state; flooded fast-water floor (animated); drained wet floor; still black deep water sloping away (animated very slowly)
- Bunk Room: stone bunks, a tool rack (with the valve key hanging on it, and without), a stone table with a cup
- Item icon: the valve key (a bronze T-handle with a square socket)
- Chart Room: the floor inlay (10×6 tiles, pictorial; see the hotspot table), the Eye's pool of light with a teapot-shaped shadow (an overlay), the Keeper's stone chair, a table with a cup and a bronze-bound ledger, the inside of the Founders' Door with its bolt (shot and drawn) and the door open
- Crypt: the Founders' Door open (a dark doorway with steps going down)
- Crown: moon-eye studs set in the plaza paving and stair, plain (day) and glowing (dusk)

**Sprites**
- Cheryl: sitting on the floor (after the chute), heaving on a lever (2 frames), kneeling (for the rubbing, and reused for the hundredth step)
- Ottilie: walking with a lamp
- The disc's light: no sprite; the engine draws it

**Full-screen images**
- The Ship Plan: a charcoal rubbing of the inlay (256×224)
- Vista: Tessel from the Crown at dusk with every doorstep glowing (256×224)

## Audio needed

All of this is built (audio/foundation, e4adffd): `downstairs`, `reveal`, and `reveal_last` (the reveal's last phrase, softer, for the dusk vista), plus the sounds. The ids and a suggested order for the hundredth step, the valve, and the Chart Room are in [audio-direction.md](../audio-direction.md).

**Music**
- **`downstairs`** (new): the underground theme, following the audio direction: bells, choir, and bowed bass; no hand percussion; a slow pulse; a mode outside the surface's major keys; long, wet echo; a melody built from the surface motifs' intervals, rearranged. Quiet enough to hear the creaks.
- **Reveal cue** (new, one-shot, about 15 seconds): plays after "Oh, we're a boat." The skipping-rhyme tune, slowly, on glass bells over a held D-flat chord: the first time the player hears the rhyme in the Founders' voice. Its last phrase is reused softly under the dusk vista.

**Sound effects**
- Ambience: the slow, deep hull creak (every 20 seconds or so, Downstairs only); dripping; a faint hum near moonglass
- The lever: a seized grind, then a release; the ceiling lid scraping open; then a long run of shutter clunks going away up the hill, each fainter (about 4 seconds)
- The beam: a soft, sustained glassy tone while a beam is lit; a clunk for each mirror turn
- The moon-lock: a rising chime, then the hatch's stone grind
- Taking the disc: a warm, glassy shimmer (a variant of `item_get`)
- Relighting a lamp: a soft "drink," then a shimmer
- The chute: a long sliding whoosh falling in pitch, two bumps, a thump
- The drop-ladder: a chain rattle, then a crash
- The valve: a groaning wheel, rushing water slowing to a stop, a draining gurgle
- The speaking tube: far-off, filtered murmur (to play under the FAR-OFF VOICE lines)
- The bolt: a long bronze grind and a clank; the Founders' Door swinging open
- Charcoal rubbing: a scratchy sweep

## Playtest checklist

- [ ] The beam's three targets are easy to tell apart, and the hatch opening is unmistakable.
- [ ] With the disc, the Lamp Halls feel dark but never frustrating; the player can always see the next exit or object within a few tiles.
- [ ] Turning the valve reads clearly as the cause of the Fountain stopping.
- [ ] A player without paper can still finish the act and come back for the rubbing through the Founders' Door.
- [ ] The drop-ladder works both ways before the valve; both ladders up decline after the valve; the Founders' Door works both ways after unbolting.
- [ ] No route shows the surface in an unspecified state: test going up the ladders before the valve (Act 2 day, Fountain running), and trying them after the valve and after unbolting (both decline).
- [ ] The clunks after the lever are noticeable, so the glowing doorsteps at dusk have a cause the player can name.
- [ ] The valve chain is discoverable: the crowbar slips, the dark bunk room invites the disc, the key shows once the lamp is lit.
- [ ] The inlay sequence lands: the player should see it's a boat a beat before Cheryl says "Oh."
- [ ] Every line fits in its box.
- [ ] First-time players finish in 18–25 minutes.

## Decisions

- **Act 3 is five underground maps, ending at dusk on the Crown.** It's the first descent; it ends on the first surface change caused by the player (the glowing doorsteps) and the first harm (the Fountain).
- **Daylight, not moonlight, powers the Step Gallery puzzle.** Moonglass drinks any light (see the story bible). Using daylight keeps the act in the day, so the dusk surfacing feels like time has passed.
- **The disc is a carried light,** which makes darkness a gentle mechanic rather than a maze. This needs an engine darkness layer with light sources.
- **The crowbar works the hundredth step and the lever, and fails on the valve.** The failure points the player at the bunk room and the valve key, which turns three optional systems (lamps, the bunk room, the tools) into the act's one multi-step puzzle. The crowbar returns in Act 6 for the Tooth. (From review by xaKh8TS_PJ.)
- **The lever is the Keepers' master shutter for every light-pipe in Tessel.** The clunks going up the hill give the glowing doorsteps a cause the player has seen. (From review.)
- **After the valve, the act's only exit is the Founders' Door,** so the dry Fountain is first seen at dusk with the rest of the act's ending. (From review.)
- **Internal monologue is kept to three moments:** arriving, the reveal, and the vista. (From review; see the story bible's voice rules.)
- **The ledger plants "Past full: allow two fingers"** for the Act 6 trim, and gives the last Keeper a few lines of his own. Brannoc is the only Founder-era name in the game.
- **The shaft-and-bowl hotspot stops at "very nearly my house."** Cheryl suspects but doesn't conclude, so the Act 6 discovery of her plug in the Basin is still a surprise.
- **Ottilie's paper can be had in the crypt scene,** so missing her in Act 2 never blocks anything.
