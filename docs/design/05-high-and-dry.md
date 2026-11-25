# Slice 5 — High and Dry: the Door at the Bottom of the Canal

This is the build-ready design for Act 5 ([overview](overview.md), [story bible](../story-bible.md)). It picks up the same afternoon as the end of [04-the-list.md](04-the-list.md): the canals dry, the bronze door in the exposed hull, and the city riding six feet higher than it should. It ends at dusk in the Windlass Room under the lighthouse, with the bell's old clapper seated where the broken Tooth was, waiting for moonrise.

## The slice in brief

Riding high, Tessel catches the wind and drifts faster. From the harbor and the lighthouse the Teeth, the reef at the mouth of the Bowl, are plainly visible, and closer each time Cheryl looks. The Lighthouse Keeper has finally turned round: "There's a REEF. Why is there a REEF?" The Mayor has declared Dry Canal Day, with a celebration in the canal bed at moonrise. Ambrose says the next turn of the tide is at moonrise too.

The Ship Plan shows what's left: the chain runs from the bow to the anchor, and something at the bow holds it. The way to the bow is the bronze door at the foot of the Water Stairs. Three threads, in any order:

- **The rope.** The Water Stairs end in a broken flight above a six-foot drop. The Boatman sits in his beached boat at the bottom, mourning his drying planks, with a coil of mooring rope he won't give up. The Fishmonger lends Cheryl a bucket ("what use is a bucket now the sea's gone?"). She fills it at the refilled Fountain and lowers it to him. He pours it into his boat: "AFLOAT!" A boat that floats doesn't need tying up, so he hands up his rope. Cheryl ties it to the stair's ring and climbs down.
- **The door.** The door's glass eye wants more light than Cheryl's disc holds. Only the lighthouse lamp is bright enough, and the Keeper, who has polished in a frenzy since she saw the reef, won't let anyone near it without polish. The Shopkeeper's window display fell over in the rise and now has a gap; he'll take the guidebook to fill it and gives her brass polish. In the lamp, the disc blazes, but the charge fades in under a minute, and the door is the length of the town away. The Sweaty Kid, who still has Cheryl's egg timer, winds the egg, takes the disc, and runs. He beats the egg. The door opens.
- **The Tooth.** The Clockmaker's doorstop, "the only thing in this town that keeps still," is a great notched bronze lump: the bell's old clapper. He trades it for Mott's square jug, "a doorstop that doesn't roll."

Down the rope, through the door, along the bow passage, into the **Windlass Room**: a bronze drum like a chapel on its side, chain links taller than Cheryl, and beside the drum the stump of the sheared Tooth. She levers out the stump with the crowbar and sets the clapper in its socket. It fits as if it was waiting. *Every part does two jobs.* The speaking tube from the bell brings down wind and gulls and nothing else yet. She sits on a coil of chain to wait for moonrise.

**Playtime:** 30–40 minutes. **Maps:** 3 new (Clockmaker's Shop, Bow Passage, Windlass Room), plus new states of the dry Bilge, the risen Harbor, the lamp room, Fountain Square, the Shop, and Act 5 lines across the town. **New items:** bucket, rope, brass polish, clapper. **Wrongness:** 0.5.

## Building the danger

Act 5 is the act where the player *sees* the threat. Rules for the build:

1. **The Teeth get closer.** The reef appears on the Harbor map's horizon and in the lighthouse's window looks, in three stages: at the start of the act; after either the door opens or the clapper is in hand; after both. The Harbor reef sprite grows; the looks change.
2. **The wind is always there.** Laundry streams on every surface map; a steady wind loop plays under the music; the hull creak is more frequent (every 25 seconds or so).
3. **Nobody understands, everybody reacts.** Every resident has a wrong reason for the reef "coming closer": the tide, the light, the Mayor, the clock. Only Mott and the Keeper are frightened, and only Mott is right.
4. **Dry Canal Day is the comic counterweight,** and it sets up Act 6: at moonrise the whole town will be standing in and around the canal when the windlass hauls the city home.

## Time of day

The act takes place on one afternoon: **day** tint, shading to **dusk** for the final scene in the Windlass Room (the card at the end reads **Moonrise.**). Act 6 begins at night.

## Maps

Surface maps use the legend from [02-city.md](02-city.md); underground maps use the legend from [03-downstairs.md](03-downstairs.md).

### The dry Bilge (Act 5 state)

The `bilge_dry` map from Act 4 (32 × 17), with these changes:

- **Exits open:** north to Fountain Square, east to the risen Harbor, and the Fishmonger's door (it leads back into the ice cellar, which now has nothing in it but ice: "Ice. Fish. A hatch I'm not opening.").
- **The broken edge** (22–25, 8) is an interaction strip, used from the stair tiles (22–25, 7). It's how Cheryl talks to the Boatman below and hands things down to him (see "The Boatman, from above").
- **The stair ring** (25, 7), a bronze mooring ring set in the last good tread. Once the rope is tied there (`rope.tied`), (25, 8) becomes a climb: walking down into it from (25, 7) plays a short climb and puts Cheryl on the mud at (25, 10); walking up into it from (25, 10) brings her back to (25, 7).
- **Mud** (row 10, x0–26) is walkable once Cheryl is down. The bronze door (26–27, 8–9) is used from (26, 10) or (27, 10).
- **Entities:** the Fishmonger at (5, 4), behind her stall, with a bucket beside her (a separate entity at (6, 4) until lent). The Boatman in his boat at (22–23, 10). The Piano Movers at (14, 10) and (17, 10) with the piano at (15–16, 10). Crabs on the mud. The laundry streaming. No Man on Bridge; no Kid (he's at the Harbor).

### The risen Harbor (32 × 15)

The Harbor from Act 2, after the rise. The quay now stands six feet above the water. Rows 0–8 are as before. Below the quay edge, a new row of exposed hull, then the sea, and on the horizon the Teeth.

```
     x 0         1         2         3
       01234567890123456789012345678901
    8  ................................   the quay (rows 4-8), as before
    9  nnnnnnnnnnnnnnnnnnnnnnnnnnnnnnKK   n the old quay edge (stone); KK the Keyhole (30-31, 9)
   10  hhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhh   h exposed Founder hull: slate, barnacles, tide line at its top
   11  %%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%   the sea, lower; the ferry lies here (10-15, 11-12)
   12  %%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%
   13  %%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%
   14  %%%%%%%%TTTTTTTTTTT%%%%%%%%%%%%%   TTT the Teeth on the horizon (8-18, 14), growing by stage
```

- **The ferry** (10–15, 11–12) hangs lower than the quay, tilted, its mooring ropes running taut up to the bollards.
- **The Teeth** (an overhead sprite along row 14): stage 1, a thin white line of surf on dark rocks, small; stage 2, larger and clearer, rocks distinct; stage 3, large, the surf visibly breaking. Never a fail state: the city never reaches them.
- **Entities:** Captain Mott at the quay edge (13, 8), facing the sea. The Sweaty Kid running laps of the Prow road (patrol: (18, 6) → (26, 6) → (26, 4) → (18, 4)), stopping for Cheryl as usual. Bollards, crates, nets as before. Laundry streaming.
- **Exits:** west (0, 6–8) → `bilge_dry` (30, 12–14); Goat stair (2–3, 0) → Goat Path; lighthouse door (27–28, 3) → lamp room.

### Lamp room (Act 5 state)

The Act 2 lamp room. The Keeper now stands at the window, at (5, 2), facing *out*, polishing the glass instead of the lamp. The lamp at (3–4, 2–3) is lit (it's a lighthouse; it's afternoon, but she lit it "for the REEF"). An empty polish tin lies on the floor at (2, 5).

- **Light:** the lamp is a strong light source (radius 4, warm), and its turning shine sweeps the room.

### Clockmaker's Shop (10 × 8), on the Crown

A narrow workshop full of clocks, every one showing a slightly different time. The Clockmaker sits at his workbench repairing his clock's drive. The door is propped open by a great bronze lump.

```
     x 0
       0123456789
 y  0  ##########
    1  #cc#cc#cc#   c clocks on the wall, each a different time
    2  #.K......#   K the Clockmaker (2, 2), at his bench
    3  #bbb.....#   bbb the workbench, with the clock drive in pieces (1-3, 3)
    4  #........#
    5  #......d.#   d the doorstop: the bell's old clapper (7, 5), holding the door
    6  #........#
    7  ####DD####   door (4-5, 7) → the Crown (12, 7)
```

The Crown's shop door (12, 6; as built in Act 2) → Clockmaker's Shop (4–5, 6), facing up. Once the clapper is taken, the door swings shut behind Cheryl when she leaves (a bang, and the Clockmaker's yelp).

### Fountain Square (Act 5 state)

- The Fountain is flowing again, full to the brim, over its hatch. Its basin can be used with the bucket (see Items).
- The Mayor on his crate at (8, 11), now addressing a small crowd (two resident sprites) about Dry Canal Day. A painted banner on two poles over the café (overhead, 17–22, 11): DRY CANAL DAY — TONIGHT — MOONRISE.
- The Stranded Tourist at the café.
- The Counting Woman is back on the Steps (not here).

### Shop (Act 5 state)

The window display (7–8, 5) has fallen over in the rise: the straw hat is on the floor, the stand on its side. The Shopkeeper stands looking at it in horror.

### Bow Passage (18 × 8), behind the bronze door

A low, straight passage running east from the door toward the bow, with ribs every three tiles. When the door opens, its moonglass lamps wake one by one down the passage, each with a soft chime, so the way ahead is lit. The deep sound of the chain, a slow creak like a ship at anchor, gets louder going east.

```
     x 0         1
       012345678901234567
 y  0  XXXXXXXXXXXXXXXXXX
    1  X################X
    2  X#L####L####L###LX   L lamps (2, 7, 12, 16), wake when the door opens
    3  DD...............:   DD the bronze door, inside (0-1, 3-4) → bilge_dry (26-27, 10)
    4  DD...............:   : east → Windlass Room (x17, y3-4)
    5  X................X
    6  XXXXXXXXXXXXXXXXXX
    7  XXXXXXXXXXXXXXXXXX
```

**Exits:** the door (0–1, 3–4) → `bilge_dry` (26, 10), facing down; east (17, 3–4) → Windlass Room (1, 6–7), facing right. **Light:** `dark: 0.85`; the lamps (radius 3) once lit. **Music:** `downstairs`, with the chain creak.

### Windlass Room (22 × 14), under the lighthouse

The machine that holds Tessel to its anchor. A bronze drum the size of a chapel on its side fills the middle, wound with chain whose links are taller than Cheryl. The chain runs off the drum's east end and out through the hawse, a great round hole in the east wall, toward the anchor. Beside the drum, a socket in the floor holds the stump of the sheared **Tooth**, the pawl that should stop the drum turning backward. There's a long brake lever, a speaking tube that carries the bell down from the Crown, heaped coils of spare chain, and a sealed hatch in the north wall marked with a moon in a bowl.

```
     x 0         1         2
       0123456789012345678901
 y  0  XXXXXXXXXXXXXXXXXXXXXX
    1  X######HH###########XX   HH the sealed hatch to the Long Keel (7-8, 1-2), moon-in-bowl emblem
    2  X#L####HH######T###L#X   L lamps (2, 19); T the speaking tube from the bell (15, 2)
    3  X....................>   > the hawse, the chain's way out (21, 3-4)
    4  X....DDDDDDDDDDDDDDDD>   DDDD the drum and chain (5-20, 4-7), solid
    5  X....DDDDDDDDDDDDDDDDX
    6  :....DDDDDDDDDDDDDDDDX   : west → Bow Passage (x0, y6-7)
    7  :....DDDDDDDDDDDDDDDDX
    8  X......PP........B...X   PP the Tooth socket, with the stump (7-8, 8-9); B the brake lever (17, 8)
    9  X......PP............X
   10  X..cc..........cc....X   cc coils of spare chain (3-4, 10) and (15-16, 10): Cheryl sits on the west one
   11  X....................X
   12  X....................X
   13  XXXXXXXXXXXXXXXXXXXXXX
```

**Exits:** west (0, 6–7) → Bow Passage (16, 3–4), facing left. The Long Keel hatch (7–8, 1–2) stays sealed in Act 5 (it opens in Act 6, when the chain comes home). **Light:** `dark: 0.8`; two lamps; a cold blue light through the hawse (radius 2), the evening sea. **Music:** `downstairs`, quieter, with the chain's slow creak and the wind through the hawse.

## State

| Flag | Set when | Effect |
| --- | --- | --- |
| `act5.started` | After the Act 4 end card | Act 5 states and lines everywhere |
| `teeth.stage` | 1 at the start; +1 for each of `door.open` and `got.clapper` (max 3) | The reef sprite and window looks |
| `got.bucket` | The Fishmonger lends her bucket | |
| `bucket.full` | Bucket used on the Fountain | The bucket item becomes "bucket of water" |
| `boatman.afloat` | Full bucket lowered to the Boatman | He's AFLOAT; Cheryl has the rope |
| `rope.tied` | Rope used on the stair ring | The rope climb at (25, 8) |
| `got.polish` | Guidebook given to the Shopkeeper | Guidebook gone; polish in the bag |
| `disc.charged` | Polish given to the Keeper, then the disc held in the lamp | Starts the relay scene |
| `door.open` | The relay scene ends | The bronze door open; Bow Passage lamps lit; the disc back, dim |
| `got.clapper` | The square jug given to the Clockmaker | |
| `tooth.out` | Crowbar used on the stump | |
| `tooth.set` | Clapper used on the empty socket | The act's ending |

## The puzzle

```
 ROPE THREAD                         DOOR THREAD                           TOOTH THREAD
 Fishmonger ─► BUCKET                guidebook (Act 2) ─► Shopkeeper       square jug (Act 4)
     │                                   ("the window has a GAP")             ─► Clockmaker
 fill at the Fountain                        │                                    │
     │                                   BRASS POLISH ─► the Keeper             CLAPPER
 lower it to the Boatman                     │                                    │
     │ ("AFLOAT!")                       hold the disc in the lamp                │
     ▼                                       │ (it fades in a minute)             │
   ROPE ─► tie at the stair ring         the Kid's relay ─► DOOR OPEN             │
     │                                       │                                    │
     └──── climb down to the mud ─────► through the door ◄───────────────────────┘
                                             │
                                  Bow Passage ─► Windlass Room
                                             │
                              crowbar on the stump; clapper in the socket
                                             │
                                   wait for moonrise: END OF ACT 5
```

- **All three threads are independent.** The Kid jumps down to the mud for the relay, so the door can open before the rope is down; Cheryl needs both the open door and the rope to get through it herself.
- **Reaching the Windlass Room without the clapper is fine.** The stump and socket point at it (see the descriptions), and the rope is a two-way climb.
- **No item is consumed early.** The guidebook is only accepted by the Shopkeeper now that his window has a gap (Act 2's decline was "My window is complete"). The jug is only useful to the Clockmaker.

### Hints in the world

| What the player needs | Who or what says so |
| --- | --- |
| The bronze door is the way on | The Act 4 ending; the Ship Plan's chain from the bow; Mott ("Whatever holds her is at the bow end") |
| The Boatman has rope and wants water | His own lines; Cheryl at the broken edge ("He's sitting on a coil of rope. Of course he is.") |
| The Fountain is the only water | The Fountain look ("Fuller than before"); the Fishmonger ("Not a drop in the whole Bilge") |
| The eye needs more light than the disc | The disc on the door: "The eye stays dark. It wants more than my disc has in it." |
| The lighthouse lamp is bright enough | Cheryl at the door ("Brighter. The brightest light in Tessel."); the Keeper ("Brightest lamp on any coast"); the lamp's own shine |
| The Keeper needs polish; the Shop has it | The Keeper's lines; the Shop's shelves (Act 2: "Brass polish, lamp oil… Everything a lighthouse could want") |
| The guidebook fills the Shopkeeper's gap | The Shopkeeper's new lines; the Act 2 decline ("My window is complete") |
| The disc fades too fast for Cheryl | Holding it after the charge: "It's fading already. I'll never get it to the canal in time. Not at my age." Then the Kid in the harbor |
| The clapper is the spare Tooth | The doorstop's look; the stump's look in the Windlass Room |

## Characters and dialog

Each line is one box. "→" marks an action or state change. Every NPC keeps their usual decline line for wrong items (see 02).

### Captain Mott (risen Harbor, at the quay edge)

Sober, watching the sea.

**First talk**
- MOTT: Look at her, Cheryl. Riding high as a cork. Every gust takes another bite of her.
- MOTT: See that white line, out by the mouth? That's the Teeth. They weren't there this morning. Well, they were. We weren't.
- MOTT: Whatever holds her is at the bow end. Always was. Grandad said the chain went out under the lighthouse.

**Repeat** (alternate, by stage)
- Stage 1: MOTT: The Teeth. A good mile off yet. A good mile's not much, at the speed she's going.
- Stage 2: MOTT: Closer. I can count the rocks now. I'd rather not.
- Stage 3: MOTT: I can hear the surf on them. Do it quick, Cheryl. Whatever it is.

**Items:** clapper: MOTT: That's a bell's tongue. Big bell. …The Crown bell's? What've you been doing, Cheryl? No. Don't tell me.

### The Sweaty Kid (risen Harbor, the Prow road)

Running laps; stops for Cheryl within two tiles.

**First talk**
- SWEATY KID: Miss! I'm racing the reef! Every lap it gets closer, and every lap I get faster!
- SWEATY KID: I've still got your egg! I time everything with it. I timed my breakfast.

**Repeat** (alternate)
- SWEATY KID: Do you need anything FAST? I'm the fastest thing in Tessel. Except the wind.
- SWEATY KID: Reef's winning. For now.

(The relay is in "The disc and the Kid.")

### The Lighthouse Keeper (lamp room)

At the window, facing out.

**First talk**
- LIGHTHOUSE KEEPER: There's a REEF. Why is there a REEF? Twenty-two years and nobody mentions a REEF?
- LIGHTHOUSE KEEPER: I turned round this morning to see what the shouting was. I've never turned round. And THERE IT WAS.
- LIGHTHOUSE KEEPER: I've lit the lamp. In the afternoon. For the reef. I've polished it eleven times. I've run out of polish.
- LIGHTHOUSE KEEPER: Nobody touches the lamp. Not without polish. If I can't polish it after, I'll go to pieces.

**Repeat** (alternate)
- LIGHTHOUSE KEEPER: Polish. I need polish. The Shop has polish. He won't sell it. He never sells anything.
- LIGHTHOUSE KEEPER: Don't look at the window. No. Do. Somebody has to.

**Give brass polish** → `got.polish` removed
- LIGHTHOUSE KEEPER: Polish! Real polish! Oh, Cheryl. You've saved my life. Possibly everyone's. Don't tell me which.
- LIGHTHOUSE KEEPER: What do you want? Anything. …The LAMP? You want to put your hand in my lamp?
- LIGHTHOUSE KEEPER: …Go on, then. Quickly. Then I'm polishing it.
- → The lamp becomes usable: use the disc on it (see "The disc and the Kid").

**After the relay** (repeat)
- LIGHTHOUSE KEEPER: Polished it again. Twice. I feel better. The reef doesn't care, but I do.

**Items:** disc (before the polish): LIGHTHOUSE KEEPER: Not near the lamp. Not without polish. I mean it.

### The Fishmonger (dry Bilge)

**First talk**
- FISHMONGER: Miss. Look at it. A trench. Five hundred years of sea, and it's left me a TRENCH.
- FISHMONGER: Not a drop in the whole Bilge. My fish are on ice in the cellar, and the cellar's the only wet thing left.
- FISHMONGER: Take my bucket if you want it. What use is a bucket now the sea's gone?
- → *Got Bucket.* (`got.bucket`)

**Repeat** (alternate)
- FISHMONGER: The Mayor wants to hold a PARTY in it. A party. In my sea.
- FISHMONGER: If it comes back, I'll be civil to it. I've decided. Very civil.

### The Boatman, from above (dry Bilge, the broken edge)

Cheryl talks to him from the stair tiles (22–25, 7) by interacting with the broken edge. His lines appear with his label as usual.

**First look at the edge:** "The stairs end in a broken edge, six feet above the mud. The Boatman's right below, in his boat." / "He's sitting on a coil of rope. Of course he is."

**First talk**
- BOATMAN: Miss. Up there. Hello. You can hear her, can't you? Her planks. Drying. Creaking. Forty years she's been wet.
- BOATMAN: A boat out of water is just a shape. A boatman out of water is just a man in a shape.
- BOATMAN: The rope? It's my mooring rope. A boatman's rope stays with his boat. That's the law. My law.

**Repeat** (alternate)
- BOATMAN: ♪ The boat is a boat, and the water is gone ♪ …that doesn't scan. Nothing scans today.
- BOATMAN: If I had a drop. Just a drop in the bottom of her. So she'd remember.

**Lower the empty bucket:** "An empty bucket. He'd only look at it sadly. I'd better fill it first."

**Lower the full bucket** → `boatman.afloat`; bucket gone; *Got Rope.*
1. "I lie down on the last good step and lower the bucket to him at full stretch."
2. He takes it, looks at it, and pours it into the bottom of his boat (pour frames; a splash).
3. BOATMAN: …
4. BOATMAN: AFLOAT! I'M AFLOAT, MISS! In the bottom of her! Look! A WAVE!
5. BOATMAN: A boat that floats doesn't need tying up. Here. Take it. Take the rope. I'm a BOATMAN.
6. → He throws the coil up; Cheryl catches it (a thump; she staggers). "Got it. Mostly."

**After** (repeat)
- BOATMAN: ♪ The boat is a boat, and it's AFLOAT ♪ That scans! It scans again!
- BOATMAN: Two inches. Two glorious inches. Mind the step, Miss.

### The Shopkeeper (Shop)

Staring at the fallen display.

**First talk**
- SHOPKEEPER: Miss. Look. The window. It went over in the night. When the whole shop lifted. The hat's on the floor.
- SHOPKEEPER: There's a GAP, Miss. In the window. A shop with a gap in the window is a shop that's given up.
- SHOPKEEPER: I need something to display. Something local. Something that says Tessel.

**Repeat:** SHOPKEEPER: A gap. People will talk. They'll say, "Did you see his window?"

**Give guidebook** → guidebook gone; *Got Brass Polish.*
- SHOPKEEPER: A guidebook! "Tessel: A Pocket Companion." Genuinely local. Confidently wrong. PERFECT.
- SHOPKEEPER: In it goes. There. The window is complete. Thank you, Miss. What can I— no, I don't sell things.
- SHOPKEEPER: …Oh, go on. A swap. Display for display. What do you want?
- → Cheryl looks at the shelf with the brass polish. SHOPKEEPER: The polish? That's lighthouse polish. Nobody needs lighthouse polish except—
- SHOPKEEPER: Take it. Before I change my mind. I've never done this before. I feel quite light-headed.

**After** (repeat): SHOPKEEPER: My first swap in thirty years. I'm going to have a sit down.

### The Clockmaker (Clockmaker's Shop)

At his bench, repairing the clock drive she unclamped. Calm now, in a brittle way.

**First talk**
- CLOCKMAKER: Miss. Come in. Mind the door, it won't stay open on its own. Nothing in this town keeps still.
- CLOCKMAKER: Except that. My doorstop. The only thing on the island that's stayed where I put it all week.
- CLOCKMAKER: The clock's in pieces. The sun's thirteen minutes out. I've stopped writing to the observatory. They've stopped writing back.

**Repeat** (alternate)
- CLOCKMAKER: That doorstop came out of the bell, you know. When I fitted the clock. Ugly old thing. Heavy as sin.
- CLOCKMAKER: If I had a doorstop that didn't roll. Square. Heavy. I'd sleep at night.

**Give square jug** → jug gone; *Got Clapper.*
- CLOCKMAKER: A jug. Square. Heavy. …Doesn't roll. Doesn't ROLL, Miss.
- CLOCKMAKER: Smells of— is that turpentine? Never mind. It's perfect. It's a perfect doorstop.
- CLOCKMAKER: Take the old lump. I never want to see it again. It hums at night.
- → *Got Clapper.* "Heavy as sin. He wasn't exaggerating."

**After** (repeat): CLOCKMAKER: Square. It just sits there. I could weep.

**Items:** clapper (shown back to him): CLOCKMAKER: Get it out of my shop, Miss. Respectfully.

### The Mayor (Fountain Square)

**First talk**
- MAYOR: Citizens! The sea has stepped out! And Tessel steps FORWARD! I give you: DRY CANAL DAY!
- MAYOR: Tonight, at moonrise, a celebration in the canal itself! Lanterns! Music! A speech, by me!
- MAYOR: …Miss. Don't. I know that look. Everything is fine. The canals are a feature.

**Repeat** (alternate)
- MAYOR: Dry Canal Day. Moonrise. Bring a lantern. Bring a friend. Bring nothing that floats, it's not that sort of day.
- MAYOR: The reef is an optical effect of the dry air. The Harbor Office says so. The Harbor Office is still looking for the landing.

### Ambrose (belfry)

- AMBROSE: CHERYL. THE NEXT TURN'S AT MOONRISE. TONIGHT. A BIG ONE. THE SEA'S BEEN SAVING IT UP.
- AMBROSE: I'LL RING. I'LL RING IF THE TOWER FALLS DOWN AROUND ME. WHICH IT MIGHT.
- Repeat: AMBROSE: MOONRISE. LISTEN FOR ME. WHEREVER YOU ARE.
- Items: clapper: AMBROSE: THAT'S MY BELL'S TONGUE. WHAT ARE YOU DOING WITH MY BELL'S TONGUE? …NO. KEEP IT. I'VE GOT A ROPE.

### Ottilie (Archive)

- OTTILIE: Cheryl! The canals! The Founders' walls, exposed! Slate! No mortar! It's a FOUNDATION, Cheryl.
- OTTILIE: I've revised. Not eels. Not smugglers. A cellar. A vast cellar. Under everything. For storing… something.
- OTTILIE: I'll know when I see the right glyph. I'm close. I can feel a fourth monograph coming on.
- Repeat: OTTILIE: Storing what, Cheryl? Storing WHAT?

### The Piano Movers (on the mud)

- BIG MOVER: Miss. It's on the mud and it's not going anywhere. First time all week.
- OTHER MOVER: Hnn.
- BIG MOVER: He says that's what worries him.
- Repeat: BIG MOVER: Party's tonight, they say. In the canal. We'll be here. Guarding it. From the party.

### Stranded Tourist (Fountain Square, café)

- STRANDED TOURIST: The ferry's six feet DOWN now. I looked over the edge. It's hanging off its ropes like washing.
- STRANDED TOURIST: My guidebook said nothing about the sea leaving. Then again, you've got my guidebook.
- Repeat: STRANDED TOURIST: Dry Canal Day. I'm going. I've nothing else to do. I'm wearing your hat.

### The Counting Woman (Hundred Steps)

- COUNTING WOMAN: A hundred. A hundred again. I count every hour now, to be sure. It's always a hundred.
- Repeat: COUNTING WOMAN: The town's gone mad and the sea's gone out, but the steps are RIGHT, Cheryl.

### The Skipping Girls (Lamp Street)

- THIRD GIRL: Miss! Tessel bumped her HEAD! The sea went OUT! It's just like the song!
- FIRST GIRL: It's not like the song. Songs don't DO things.
- SECOND GIRL: …Do they, Miss?
- Repeat (all): SKIPPING GIRLS: ♪ Up jumps Tessel and bumps her head! ♪

### Cistern Court

- OLD MAN: The whole house lifted in the night. Gerald says we've risen in the world. Gerald thinks he's funny.
- NEIGHBOR: The wind! My sheets are out on the line flat as flags. Whiter than ever. I don't trust it.

## Objects and descriptions

### Dry Bilge

- **The bronze door** (from the quay): "The door. Bronze, barnacled, a glass eye in the middle. At the bottom of a canal that's been full for five hundred years." / "It opens onto the mud. And the stairs don't reach the mud."
- **The bronze door** (from the mud, eye dark): "A glass eye, the size of a dinner plate. Like the lock in the Step Gallery, only hungrier."
- **Disc on the door's eye** (uncharged): "The eye stays dark. It wants more than my disc has in it." / "Brighter. It wants the brightest light in Tessel."
- **The stair ring** (25, 7): "A bronze mooring ring, set in the last good step." With the rope: use → `rope.tied`: "A round turn and two half hitches. My father taught me that, on a lake a long way from here." Then: "Tied. I'm not proud. I'm not not proud."
- **The rope climb** (first time down): "Fifty-eight years old, going down a rope into a canal." / "My mother would have something to say. She'd have said it at length."
- **The bucket on the Fountain** (Fountain Square) → `bucket.full`: "A bucket of the Fountain. Five hundred years of water from nowhere, and I'm carrying it to a boat."

### Risen Harbor

- **The quay edge**: "Six feet down to the water now. The sea didn't go anywhere. We came up out of it."
- **The ferry**: "The Persistence, hanging off her ropes, lower than the quay. Mott's not looking at her. He's looking at the Teeth."
- **The Teeth** (by stage): Stage 1: "The Teeth. A white line of surf out at the mouth of the Bowl. Closer than they've ever been. Than we've ever been." Stage 2: "Closer. I can see the rocks between the surf." Stage 3: "I can hear them. The sea, chewing."
- **The laundry**: "Every line of washing in Tessel is pointing the same way. Out to sea."

### Lamp room

- **The lamp** (before the polish): "The lamp, lit in the middle of the afternoon. Brightest light in Tessel." / "She's standing between me and it."
- **The window** (by stage): as the Teeth, but from up here: Stage 1: "From up here, the Teeth are a white line across the mouth of the Bowl. And we're pointing at them." Stage 2: "Closer. The whole town's leaning toward them like a dog on a lead." Stage 3: "Close enough to count. I don't."
- **The empty polish tin**: "Empty. Scraped. She's been at it with a fingernail."

### Clockmaker's Shop

- **The clocks**: "Thirty clocks, thirty times. All of them perfect. All of them different." / "He keeps them to prove the sun wrong. The sun isn't bothered."
- **The doorstop** (before): First: "A great bronze lump, propping the door. Rounded at one end, notched at the other, green with age." / "I've seen that shape. Downstairs, somewhere. On the Ship Plan." Then: "The bell's old clapper. Rounded, notched, and heavy as sin."
- **The bench**: "His clock's drive, in pieces, laid out in rows. Every screw has its own little dish."

### Bow Passage

- **On first entering** (after the door opens): the lamps wake one after another, east down the passage, each with a chime. "They're waking up. All the way along." / "Somebody's coming home, and they know it."
- **The chain sound**: "A creak, deep and slow, from the east. Like a ship at anchor. Exactly like a ship at anchor."

### Windlass Room

**On first entering** (a pause; the camera pans east along the drum to the hawse and back):
- "A drum the size of a chapel, lying on its side, wound with chain." / "Each link is taller than I am."
- Internal monologue: *This is what holds us.* / *This is all that's holding us.*

- **The drum**: "Bronze. Wound with chain. It creaks every time the wind gusts, and gives a little. Just a little. Every time."
- **The chain**: "Links like doorways. It runs off the drum and out through that hole, toward the anchor. Toward the bottom of the Bowl."
- **The hawse** (21, 3–4): "A round hole in the wall, big enough to drive a cart through. The chain goes out. The sea comes in, cold, and blue with evening."
- **The Tooth socket, with the stump** (7–8, 8–9): First: "A socket in the floor beside the drum, and in it the stump of something bronze, sheared clean off." / "It should be catching the drum. Stopping it turning back. It isn't." / Then: "The stump of a tooth. A rounded bronze tooth, with a notch. I've seen that shape." (If Cheryl already has the clapper: "The stump of a tooth. A rounded bronze tooth, with a notch. I've got that shape in my bag.")
- **Crowbar on the stump** → `tooth.out`: Cheryl heaves; a grind, a crack, and the stump comes free and drops with a clang. "Out. Three hundred years of sitting there, and out in one go. I'm stronger than I look. Or it's tireder."
- **The empty socket** (after `tooth.out`, without the clapper): "An empty socket, waiting. Rounded at the bottom, notched at the top. It wants a tooth." / "Every part does two jobs down here. Something up there is a spare tooth, doing its other job."
- **The clapper on the socket, before the stump is out**: "The stump's in the way. It needs levering out first."
- **The clapper on the empty socket** → `tooth.set`: see "The end of Act 5."
- **The brake lever** (17, 8): "A long bronze lever, locked. A plate on it shows a bell, and a hand, and an arrow." / "When the bell says when."
- **The speaking tube** (15, 2): "A tube from somewhere far above. I can hear wind in it, and gulls. And, very faintly, the Mayor." Later (after `tooth.set`): "Wind. Gulls. Nothing yet."
- **The sealed hatch** (7–8, 1–2): "A sealed hatch, marked with a moon in a bowl. The same as on the Ship Plan, at the bottom of the shaft." / "Shut tight. Not yet, it seems to say."
- **The chain coils**: "Spare chain, coiled and waiting. A good place to sit, if you're me, and you've nothing to do but wait."

### Items and wrong combinations

| Item | Icon idea | Inventory description |
| --- | --- | --- |
| Bucket | A wooden bucket, empty | "The Fishmonger's bucket. It smells, as you'd expect." |
| Bucket of water | The same, full, with a glint | "A bucket of the Fountain. Heavy. Holy, nearly." |
| Rope | A coil of tarry rope | "The Boatman's mooring rope. Tarry, salty, and longer than I'd like to climb." |
| Brass polish | A round tin with a lighthouse on the lid | "Lighthouse polish. It says so on the tin. The tin is very shiny." |
| Clapper | A great bronze tongue, rounded and notched | "The bell's old clapper. Rounded at one end, notched at the other. Heavy as sin." |

- Bucket of water on anything else: "No. That's for a boat."
- Rope on anything but the stair ring: "There's nothing here worth tying."
- Polish on anything: "It's for a lighthouse. It says so on the tin."
- Clapper on anything but the socket: "It's heavy, and it wants to be somewhere particular."
- Disc on the lamp before the polish: the Keeper's decline.

## The disc and the Kid

**Trigger:** the disc used on the lamp, after the polish.

1. Cheryl holds the disc into the lamp's focus. The lamp's beam swings through it; the disc flares white, then a deep, brilliant cyan. A rising glassy chime. The Keeper shades her eyes.
2. "It's drinking the lamp." / "It's full. It's never been this full."
3. Two seconds later the glow dims a step. "And it's fading already. The canal's the length of the town away." / "I'll never get it there in time. Not at fifty-eight."
4. LIGHTHOUSE KEEPER: Then GIVE it to someone who can! There's a boy outside doing laps. He's done forty.
5. Cut to the Harbor: Cheryl comes out of the lighthouse door; the Kid skids to a stop in front of her (he's always within earshot of a challenge).
6. SWEATY KID: Miss? Is that GLOWING? What is it? Where's it going? Can I take it?
7. Cheryl holds out the disc, and the Ship Plan, and points (a pointing pose) west, toward the Bilge.
8. SWEATY KID: The bottom of the canal? The big door? With the eye? …I can do that. I can do that SO fast.
9. He winds the egg timer (tick-tick-tick). SWEATY KID: Ready. Steady. EGG.
10. **The run** (a scripted chase, camera following the Kid; Cheryl stays at the lighthouse door, hidden from the montage): the Harbor quay, west at full speed, scattering a gull; a cut to `bilge_dry` as he bursts in from the east; he leaps off the quay onto the mud (a jump, a splat), races along the mud past the Movers (OTHER MOVER: Hnn!) and the Boatman (BOATMAN: Go on, lad!), and slaps the disc into the door's eye.
11. The eye flares. The barnacles crack. With a long bronze grind the door swings inward, and cyan light spills out across the mud. The egg timer, still in his pocket, goes *DING*.
12. SWEATY KID: …I BEAT THE EGG. I BEAT THE EGG!
13. Cut back to Cheryl at the lighthouse door, at the Harbor. Far off: a faint "I BEAT THE EGG!" on the wind.
14. `door.open`. The disc goes back to Cheryl (the Kid's line next time she meets him on the mud: SWEATY KID: The eye ate all the light and spat this out! It's still a bit glowy. Here. → *Got Moonglass Disc*, now dim). Until then, the dim disc sits in the eye; Cheryl can take it from the door herself.

The run is fully scripted and always succeeds.

**Engine calls** (engine/core, 3fd9f41): `g.cameraFollow('kid')` on the Harbor while Cheryl stands at the lighthouse door; `await g.changeMap('bilge_dry', x, y, facing, { cutscene: true })` to follow him without her (her map, spot, and facing are kept; nothing is saved); `await g.restorePlayer()` to come back to her at the lighthouse door.

**The Kid afterward** (on the mud by the door, then back at the Harbor):
- SWEATY KID: Fifty-two seconds, Miss! And I jumped! Off the QUAY! Don't tell Mum.
- Repeat: SWEATY KID: The Stair Race is going to be EASY after that.

## The end of Act 5

**Trigger:** the clapper used on the empty socket.

1. Cheryl sets the clapper into the socket. It drops the last inch on its own with a deep, solid *clunk*, and the whole drum settles against it. The creaking stops.
2. "It fits. Of course it fits." / "Every part does two jobs. The bell's tongue was a spare tooth all along, propping a door open."
3. A long breath of silence. Then the speaking tube: wind, gulls, and very far off the Mayor's voice ("…Dry Canal Day!…").
4. "The bell says when. Ambrose said moonrise."
5. Cheryl walks to the west chain coil (3–4, 10) and sits (scripted).
6. "So I'll wait." / "I'm good at waiting. Ask anyone who's had me for a teacher."
7. The light through the hawse shades from evening blue to deep violet.
8. Fade to black. Card: **Moonrise.** (2 seconds.)
9. Until Act 6 exists: a card reading **MOONSHINE** over **End of Act 5. Tessel continues soon.**, then the title. When Act 6 exists, it begins straight after the Moonrise card.

## Art needed

**Tiles and objects**
- Dry Bilge: the stair ring (bronze, set in a tread); the rope tied and hanging down the hull to the mud (2 tiles tall); the bronze door opening (grinding open, a few frames), and open with cyan light spilling out; the dim disc sitting in the door's eye
- Risen Harbor: the old quay edge row; a row of exposed hull with barnacles and a tide line; the sea, lower; the ferry hanging low and tilted on taut ropes; **the Teeth** on the horizon in three stages (a line of white surf on dark rocks, then larger, then with surf visibly breaking)
- Lamp room: the lamp lit and turning; the Keeper at the window; an empty polish tin
- Clockmaker's Shop: wall clocks (each face showing a different time), a workbench with the clock drive in pieces in little dishes, the door propped open by the clapper and the door swung shut
- Fountain Square: a DRY CANAL DAY banner on two poles (overhead); two crowd residents
- Shop: the window display fallen over, the hat on the floor; then the display with the guidebook in pride of place
- Bow Passage: a short underground passage with ribs; lamps waking (a lighting-up sequence); the inside of the bronze door
- Windlass Room: the **drum** (16×4 tiles, bronze, wound with enormous chain), the chain running off its east end through the **hawse** (a round hole in the east wall, the evening sea glimpsed through it); the **Tooth socket** with a sheared stump, empty, and with the clapper seated; the stump lying loose; the brake lever with its plate (bell, hand, arrow; locked and thrown); the speaking tube; coils of spare chain; the sealed hatch with a moon-in-bowl emblem (sealed, and open for Act 6)
- Laundry streaming on every surface map that has laundry

**Sprites**
- The Fishmonger handing over a bucket
- The Boatman: pouring and AFLOAT frames (drawn), plus throwing the rope coil up
- The Kid: running flat-out; jumping off the quay; landing on the mud (splat); slapping the disc into the eye; winding the egg timer; celebrating
- The Keeper: at the window; shading her eyes
- The Clockmaker: at his bench; holding up the square jug in rapture
- Cheryl: lying on the step lowering a bucket; catching a rope coil; climbing a rope (2 frames); pointing; holding the disc up into the lamp; heaving on the crowbar (reuse); sitting on a chain coil
- The disc, flaring (an overlay of 3–4 frames) and dim
- Two crowd residents (swaps) for the Mayor's audience

**Item icons:** bucket (empty and full), rope coil, brass polish tin, clapper

## Audio needed

All of this is built (audio/foundation, 0518c2a); ids and a suggested order are in [audio-direction.md](../audio-direction.md). Two timing notes for the build: start `relay` with `playMusic('relay', { fadeMs: 0 })` as the Kid says "EGG," and time the slap so the door opens in its last bars (its final note is the egg timer's ding). Raise the `surf` loop with `setLoopVolume` at each Teeth stage, and stop `drum_strain` with `clapper_seat` so the creaking stops when the clapper seats.

**Music**
- `neighborhood` and `harbor` at Wrongness 0.5, with the wind loop under them
- **`relay`** (new, short): the Kid's run. A quick, bright chase on the surface instruments (flute and harp racing, tambourine), the home motif in double time, about 50 seconds, ending on the egg timer's ding as its final note
- `downstairs` for the Bow Passage and Windlass Room

**Sound effects**
- Wind (a steady loop on every surface map in Act 5) and laundry snapping
- The surf on the Teeth, faint on the Harbor, louder at each stage
- A bucket filling at the Fountain; a bucket lowered (a creak of the handle); pouring into a boat; a small splash
- A rope coil thrown and caught (a thump); rope creak on the climb
- The Shop: the bell on the door; a tin lid
- The lighthouse lamp: its turning hum; the disc drinking the light (a rising glassy chime that blooms), then a soft fading tone
- The Kid: running on stone; a leap and a splat on mud; the egg timer winding and ticking (from Act 1), and its ding
- The door: barnacles cracking; a long bronze grind; cyan light spilling (a soft shimmer)
- The Bow Passage: lamps waking, one chime each, east down the passage; the chain's deep slow creak (louder near the Windlass)
- The Windlass Room: wind through the hawse; the drum's creak and give with each gust; the stump levered out (grind, crack, clang); the clapper seating (a deep, solid clunk), and the creaking stopping
- The speaking tube: wind and gulls; the Mayor far off

## Playtest checklist

- [ ] The three threads can be done in any order; the relay can happen before or after the rope.
- [ ] The Teeth visibly grow across the act, and the player sees them at least twice.
- [ ] The Boatman can be talked to and handed things from the stairs without confusion.
- [ ] The relay reads clearly: who's running, where, and why, and the door opening is a big moment.
- [ ] Reaching the Windlass Room without the clapper gives a clear pointer back up.
- [ ] The clapper seating feels like a payoff (the clunk and the silence).
- [ ] Every line fits in its box.
- [ ] First-time players finish in 30–40 minutes.

## Decisions

- **Act 5 is one afternoon, ending at dusk in the Windlass Room** with the Tooth replaced, so Act 6 can begin with the bell.
- **Seating the clapper moves from Act 6 to the end of Act 5.** It's the act's payoff; Act 6 then starts with the wait and the bell. (The story bible is updated to match.)
- **The Kid jumps down for the relay, so the rope and the door are independent.** Cheryl needs both to get through the door herself.
- **The disc comes back, dimmed,** so Cheryl still carries a light for Act 6.
- **The Teeth are a visible, growing sprite on the Harbor horizon** and a changing look from the lighthouse, never a fail state.
- **Dry Canal Day** puts the whole town in and around the canal at moonrise, for Act 6's lurch.
- **The Shopkeeper's first swap** pays off his Act 2 foible ("display for display").
- **Cheryl's father taught her knots, "on a lake a long way from here."** A small glimpse of her mainland past, consistent with the bible's gaps: it explains nothing.
