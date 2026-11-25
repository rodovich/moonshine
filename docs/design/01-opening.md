# Slice 1 — The Opening: Moonshine Night in Cistern Court

This is the build-ready design for the first playable slice. It covers Act 1 of the game ([overview](overview.md), [story bible](../story-bible.md)). Build this slice first and polish it to a high standard before widening.

## The slice in brief

At sunset on Moonshine Night, Cheryl is on her roof beside an empty bathtub. She wants her yearly cold bath while the full moon rises in the Gate. Two things stop her:

- **No plug.** The Old Man downstairs borrowed it as the black king in his seventeen-year chess game against himself. He'll trade it for another king: black, tall, dignified. Her pepper mill qualifies.
- **No view.** Her Next Door's moon-bleaching sheets hang across the view of the Gate. She'd move them to the back line, but it sags without the clothes prop, and the Sweaty Kid has the prop as a hurdle. He'll trade it for something that ticks. Her egg timer qualifies.

With the tub plugged and filled and the sheets moved, Cheryl sits on the edge of the tub, and the moon rises *in the wrong place*. A groan and a crack come from far below the city; the roof lurches; the piano blocking the only exit goes crashing down the Squeeze; her plug is sucked down the drain, and its echo goes much too deep. The next morning, the way out is clear.

**Playtime:** 8–12 minutes (about eight required interactions; longer for players who look at everything). **Maps:** 2 (Cistern Court, 20×26 tiles; Cheryl's flat, 12×9). **NPCs:** 3. **Items:** 5 at dusk, plus 2 more in the morning.

### What the slice teaches

| Skill | Where |
| --- | --- |
| Walk, use stairs, change maps | Roof ↔ court ↔ flat |
| Examine (and that things change) | Every object; the moon chart's three looks |
| Take | The flat's kitchen counter and washstand |
| Talk, and repeat-talk for hints | Old Man, Neighbor, Kid |
| Give an item to an NPC | Pepper mill → Old Man; egg timer → Kid; prop → Neighbor |
| Use an item on an object | Plug → tub |
| Operate an object | The tap |
| Work on two threads at once | Plug thread and view thread, in either order |
| Blocked exits explain themselves | The piano, the Pelletiers' gate, the roof edges |

## Maps

### Cistern Court (20 × 26 tiles)

One scrolling map with two levels: the roof terraces at the top and the courtyard at the bottom, joined by an outside stair that cuts through the facade between the houses. It's 1¼ screens wide and nearly 2 screens tall. North is up. In 3/4 view, the facade rows (y = 9–11) show the south-facing walls of Cheryl's house (left) and the Neighbor's house (right).

```
     x 0         1
       01234567890123456789
 y  0  ~~~~~~~~~~~~~~~~~~~~   backdrop: higher roofs, the Crown's lower walls
    1  ====================   north parapet (front face). Back-line hooks at x11 & x18
    2  =hh....CC=.........=
    3  =........=..|..|...=   | clothesline posts
    4  =.tTT....=..s..s...=   T tub, t tap, s sheets (two N–S lines)
    5  =...........s..s.N.=   gap in the low wall at x9 (one step down)
    6  =..@.....=..s..s...=   @ Cheryl starts here, facing the tub
    7  =.kk.....=..|..|...=   k two chairs
    8  =......^.=.........=   ^ top of the stair
    9  =======^============   roof edge
   10  #w#w#w#^###w#w##w###   facades with windows
   11  ###D###^######D#####   D Cheryl's door (x3), Neighbor's door (x14)
   12  #,,,,,,,,,,,,,,,bb,#   b bench
   13  #,lll,,,,,,,,,,,,,,#   l lemon canopy (overhead layer)
   14  #,lLl,,,,,K,,,,,,,,#   L lemon trunk; K Kid starts his laps here
   15  #,lll,,,,,,,,,,,,,,#
   16  #,Ocg,,,,WW,,,,,,,,#   O Old Man, c chess table, g Gerald's chair; W well (2×2)
   17  #,,,,,,,,WW,o-o,,,,#   o flowerpots (12, 14), - the prop laid across them as a hurdle (13)
   18  #,,,,,,,,,,,,,,,,,,#
   19  G,,,,,,,,,,,,,,,,,,#   G the Pelletiers' gate (locked)
   20  #,,,,,,,,,,,,,,,,,,#
   21  #p,,,,,,,,,,,,,,,,p#   p geraniums in pots
   22  #,,,,,,,,,,,,,,,,,,#
   23  #pp,,,,,,,,,,,,PP,p#   P the piano, wedged at the top of the Squeeze (2×2)
   24  rrrrrrrrrrrrrrrPPrrr   r rooftops of the houses below (seen from above)
   25  rrrrrrrrrrrrrrrvvrrr   v the Squeeze: a narrow stair down and out (exit)
```

**Legend and collision**

| Glyph | Tile | Walkable | Layer |
| --- | --- | --- | --- |
| `~` | Backdrop roofs | No | Ground |
| `=` | Parapet / low wall / roof edge | No | Ground (front faces visible) |
| `#` `w` | Facade wall / window | No | Ground |
| `.` | Roof paving | Yes | Ground |
| `,` | Courtyard cobbles | Yes | Ground |
| `^` | Stair | Yes | Ground |
| `D` | Door | Enter (Cheryl's) / no (Neighbor's) | Ground |
| `T` `t` | Tub (2×1), tap | No | Ground |
| `C` `h` `k` | Chimney stack, herb pots, chairs | No | Ground, with chimney caps on overhead |
| `\|` `s` | Clothesline posts, hanging sheets | No | Sheets on overhead |
| `l` | Lemon canopy | Yes (walk beneath) | Overhead |
| `L` | Lemon trunk | No | Ground |
| `c` `g` `O` | Chess table, Gerald's chair, Old Man's stool | No | Ground |
| `W` | Well | No | Ground |
| `o` `-` | Flowerpots, hurdle | No | Ground |
| `b` `p` | Bench, geraniums | No | Ground |
| `G` | Pelletiers' gate | No | Ground |
| `P` | Piano | No | Ground, with lid on overhead |
| `r` | Lower rooftops | No | Ground |
| `v` | Squeeze stair (exit south) | Yes, once the piano is gone | Ground |

**Named spots**

- **Cheryl's roof** (x1–8, y2–8): the tub, the tap, the herbs, the chimney, two chairs.
- **The low wall** (x9) between the two roofs, with a one-step gap at y5.
- **Her Next Door's roof** (x10–18, y2–8): two clotheslines running north–south at x12 and x15, hung with sheets. The *back line* runs along the north parapet from hook (11,1) to hook (18,1); without the prop it sags into her pots.
- **The east parapet** (x19, y3–7): the view of the Gate.
- **The stair** (x7, y8–11): down through the gap between the houses.
- **The court** (y12–23): the lemon tree and chess table to the west, the well in the middle, the Kid's lap track around the well, the bench under the Neighbor's window.
- **The Kid's lap**: a rectangle from (7,14) to (13,14) to (13,19) to (7,19) and back. He hops the hurdle at (13,17). **He stops and jogs in place, facing Cheryl, whenever she is within two tiles of him, or as soon as the player clicks or taps him**, so he's easy to talk to and to give things to with either control scheme. He resumes his lap when she moves away.
- **The cat**: the Pelletiers' cat, a sitting cat (the art kit's ginger cat) at (17,19) at dusk. In the morning she sits at (12,12) against the north wall, facing the well.

**Exits**

| Exit | At dusk | In the morning |
| --- | --- | --- |
| Cheryl's door (3,11) | → Cheryl's flat, arriving at (5,7) | Same |
| Neighbor's door (14,11) | Locked: she's on her roof | Locked: she's on her roof |
| Pelletiers' gate (0,19) | Locked: they're away | Locked: still away |
| The Squeeze (15–16, 25) | Blocked by the piano | **Open** → leaves the slice (see "End of slice") |
| Roof edges | Described, never crossable | Same |

### Cheryl's flat (12 × 9 tiles)

A single room, smaller than a screen; the engine centers it. The top two rows are the north wall's inner face.

```
     x 0         1
       012345678901
 y  0  ############
    1  #mm#cWW##bb#   wall: m kitchen shelf, c clock, W window, b bookshelf
    2  #12S.....BB#   1 pepper mill, 2 egg timer (on the counter), S stove, B bed
    3  #.......fBB#   f side table with the photo, face down
    4  #..kXXk....#   X table (moon chart on it), k chairs
    5  #...rrr...A#   r rug, A wardrobe
    6  #w..rrr...A#   w washstand (soap)
    7  #..........#   Cheryl enters at (5,7)
    8  #####DH#####   D door → court (3,12), H plug hook
```

**Collision:** `#` walls, wall objects (`m`, `c`, `W`, `b`, `H`), and all furniture (`1`, `2`, `S`, `B`, `f`, `X`, `k`, `A`, `w`) are solid. Floor (`.`) and rug (`r`) are walkable. The counter row is solid; the player stands on row 3 to reach the counter and shelf.

Wall objects (`m`, `c`, `W`, `b`, `H`) are interacted with from the floor tile next to them. The pepper mill (1,2) and egg timer (2,2) sit on the counter; taking them swaps the tile to a bare counter.

## State

| Flag | Set when | Effect |
| --- | --- | --- |
| `oldMan.wantsKing` | First talk with the Old Man | His repeat lines change |
| `oldMan.hasPepperKing` | Pepper mill given | Chessboard tile shows the pepper mill; Cheryl has the plug |
| `kid.wantsTimer` | First talk with the Kid | Repeat lines change |
| `kid.hasTimer` | Egg timer given | Hurdle tile becomes bare pots; Cheryl has the prop; the Kid's laps get a ding |
| `neighbor.wantsProp` | First talk with the Neighbor | Repeat lines change |
| `neighbor.sheetsMoved` | Prop given | The N–S lines are bare posts; sheets hang on the back line (11–18, y2, impassable) |
| `tub.plugged` | Plug used on tub | Tub tile: plugged, empty |
| `tub.full` | Tap operated while plugged | Tub tile: full |
| `act1.moonrise` | Moonrise sequence finished | Morning state (below) |

Every examinable object also keeps a look counter, so that its first look, second look, and later looks can differ.

### Morning state (`act1.moonrise`)

- Day tint everywhere.
- The piano is gone; the Squeeze is open, with scrape marks on every step. The tiles where the piano stood become court paving at (15–16, 23) and Squeeze stair at (15–16, 24).
- The tub is empty, with no plug.
- Sheets on the back line, palette-swapped to grey.
- The chessboard's pieces have slid to the lemon-tree end.
- The well breathes: a faint mist rises every few seconds, with a cold whoosh.
- The Kid jogs in place at (15,22), by the Squeeze. The Old Man is at chess. The Neighbor stands on her roof at (14,3), facing her grey sheets.
- The moon chart and the hat can now be taken.

## Opening

1. Fade in on Cistern Court at dusk, with the camera on Cheryl's roof. Cheryl stands at (3,6) facing the tub. Music: **Cistern Court**. A pair of swifts crosses the backdrop.
2. Internal monologue (input advances):
   - *Moonshine Night.*
   - *A tub on the roof and the moon on its way. Thirty-one years, and I haven't missed one.*
   - *Everything's ready. Nearly. On Moonshine Night there's always a nearly.*
3. Control is given. A one-time control hint fades in at the bottom for about six seconds: "Arrows: walk   Z: look/talk   X: bag" (on touch devices: "Tap to walk. Tap things to look."). The font has no "·", so don't use it in game text.
4. **Item hint.** The first time anything goes into the satchel, a second one-time hint appears and stays until the player opens the bag: "X: bag. Pick something, then use it on someone or something." (Touch: "Tap the bag, pick something, then tap where it goes.").

The first thing most players touch is the tub, and its first description names the problem and who has the plug.

## The puzzle

```
 PLUG THREAD                                    VIEW THREAD
 talk to Old Man (optional) ─┐            ┌─ talk to Neighbor (optional)
 take pepper mill (flat) ────┴─► give to  │  talk to Kid (optional)
                                 Old Man  │  take egg timer (flat) ─► give to Kid
                                   │      │                              │
                                   ▼      │                              ▼
                                 PLUG     │                            PROP
                                   │      │                              │
                     use on tub ◄──┘      └──► give to Neighbor ◄────────┘
                         │                          │
                    turn the tap                SHEETS MOVED
                         │                          │
                     TUB FULL ──────────┬───────────┘
                                        ▼
                         interact with the tub → MOONRISE
```

Every order works. NPCs accept their item whether or not the player has talked to them first. The soap is optional in this slice; it's used in Act 2.

## Objects and descriptions

Lines are Cheryl's descriptions unless labeled otherwise. Each line is one text box. "First / second / then" refers to the look counter. "→" marks an action or state change.

### Roof

**Tub** (3–4, 4)
- No plug, player doesn't have the plug:
  - First: "My tub. Cast iron, clawfooted, and twice as stubborn as me." / "It took four men and a song to get it up here. The song was the hard part." / "No plug, though. I lent it to him downstairs. A 'chess emergency.'"
  - Then: "No plug. He's got it downstairs, playing chess with it."
- Player has the plug but hasn't used it: "The plug's in my bag. It would do more good in the tub."
- Use **bath plug** on tub: "In it goes. Brass, with a little chain to pull it out by. A good plug." → remove plug; `tub.plugged`.
- Plugged, empty: "Plugged. Now the water."
- Full, sheets still up: First: "A full tub, cold water, and a fine view of Her Next Door's bedding." Then: "I am not watching the moon come up through somebody's sheets."
- Full, sheets moved: → **Moonrise sequence**.
- Morning: First: "Empty. No plug. It went down the drain last night, chain and all. Plugs don't do that." Then: "I put my ear to the drain. Water, very far down, and a cold draft coming up. Drains don't draft."

**Tap** (2, 4)
- Tub not plugged: "The roof tap. I'm not filling the tub just to watch it leave."
- Plugged and empty: → squeak, pour, the tub fills over about two seconds; `tub.full`. Then: "Cold as the sea. That's how it's done. Hot baths are for Tuesdays." Then, if the sheets are already moved: "Now I sit, and wait for the moon." If not: "Now the view."
- Full: "Full. Any more and I'll be bailing."
- Morning: "I'm not filling it again until I know where the last lot went."

**Chairs** (2–3, 7): "Two chairs. I only sit in the one." (The same every time.)

**Herb pots** (1–2, 2): "Basil, rosemary, and something that blew in and refused to leave. I've grown fond of it."

**Chimney** (7–8, 2): "My chimney pots, in their little tin hats. Hers next door go bareheaded. Make of that what you will."

**South roof edge** (any `=` on y9): Dusk: "Tessel, all the way down to the water. Every roof has a basin on it tonight, waiting for the moon." Morning: "Basins on every roof, still full. Nobody wants to be the first to tip theirs out."

**West and north parapets**: "The next roof over is a long step and a short fall. I was nineteen once. Never again."

**Low wall** (x9): "The wall between my roof and hers. Low enough to talk over. She does."

**Sheets on the N–S lines** (x12 and x15, posts included)
- First: "Her Next Door's sheets. Strung right across my view of the Gate. Every year they creep a little further over."
- Then: "I could unpeg them. I could also move to the mainland. Neither is happening tonight."
- Use **clothes prop** on them: "It's her prop and her sheets. She can do the honors."

**Back line** (hooks at 11,1 and 18,1)
- Before: "The back line. Without the prop it sags right into her geraniums."
- After the move: "Her sheets, on the back line where they belong. They're glowing a little in this light. Don't tell her."
- Morning: "Grey. She's right. They're grey."

**East parapet / the view** (x19, y3–7)
- Dusk: First: "The Gate. A notch in the Rim, as if something took a bite out of the mountains." / "The moon comes up right in it. Every Moonshine Night. You could set your life by it." Then: "From here I can see the Gate. From my tub, so far, I can see laundry." (After the sheets move, the second line becomes "From my tub I can see it too, now. Good.")
- Morning: "In daylight the Gate looks the same as ever. So it isn't the Gate that moved."

### Facades and stair

**Neighbor's door** (14, 11): Dusk: "Her door. She's up on the roof with her sheets, where she always is on Moonshine Night." Morning: "Shut. She's upstairs being disappointed at her sheets."

**Windows** (any `w` in the facade): "Blue shutters. Everyone in Tessel has blue shutters, except Her Next Door, who has green ones and opinions."

### Court

**Lemon tree** (3, 14): "The lemon tree. It produces three lemons a year and expects applause for each one."

**Chessboard** (3, 16)
- Before the trade: First: "Chess. The Old Man versus the Old Man. He's losing. Both of him." Then: "A thimble queen, a cork bishop, and my bath plug, presiding over all of it."
- After the trade: "A thimble queen, a cork bishop, and my pepper mill. Gerald's in trouble."
- Morning: "Every piece has slid to the lemon-tree end of the board. The pepper king is holding firm."

**Gerald's chair** (4, 16): "Gerald's chair. Nobody's sat in it for seventeen years. Including Gerald."

**Well** (9–10, 16–17)
- Dusk: First: "The old well, with an iron grate over it. Dry for as long as anyone remembers." / "Drop a pebble and you never hear it land. Children love it. Parents don't." Then: the second line only.
- Morning: "Cold air is coming up out of the well. It smells like the sea. Wells shouldn't smell like the sea."
- Any item used on it: "I'm not dropping anything down there. I'd only wonder about it."

**Hurdle** (13, 17; with the pots at 12 and 14)
- Before the trade: First: "Her Next Door's clothes prop, laid across two of my flowerpots. He's using it as a hurdle." Then: "He'd notice if I took it. He notices everything at ankle height."
- After the trade (pots only): "Two flowerpots. Mine. Slightly kicked."

**Bench** (16–17, 12): "The bench. It soaks up sun all day and holds on to it all evening, like a cat."

**The Pelletiers' cat** (17, 19 at dusk; 12, 12 in the morning)
- Dusk: "The Pelletiers' cat. Minding the house while they're away. Badly."
- Morning: First: "She's moved to the uphill side of the court, staring at the well." / "I didn't know the court had an uphill side." Then: "Still staring at the well. So am I, now."

**Geraniums** (any `p`): "Geraniums. Everyone in Tessel has geraniums. Nobody remembers planting them."

**Pelletiers' gate** (0, 19)
- Dusk: First: "The Pelletiers' gate. Locked. They went across to the mainland on Tuesday." / "The ferry should have brought them back yesterday. It didn't. Nobody's said why." Then: the second line only.
- Morning: "Still locked. Still no Pelletiers. Still no ferry, I expect."

**Piano** (15–16, 23–24), dusk only
- First: "Someone has tried to bring a piano up the Squeeze. The Squeeze has won."
- Second: "There's a label. 'No. 9, Cistern Court.' That's me. I didn't order a piano."
- Third: "A note on the lid: BACK AFTER MOON. DO NOT TOUCH PIANO."
- Then: → plays one key (a slightly flat note). "Middle C. A little flat. I'd know."
- Use **soap** on it: "Not now. It isn't going anywhere."
- Walking or clicking into the blocked Squeeze: "I'm not climbing over a piano at my age. Besides, I'm not going anywhere tonight."

**The Squeeze** (morning): First: "The Squeeze is clear. There's a long scrape down every step, and at the bottom, a lot of surprised geraniums." Walking into the exit leaves the slice.

### Cheryl's flat

**Pepper mill** (counter, 1,2): Interact to look and take in one go.
- If `oldMan.wantsKing`: "My pepper mill. Black. Tall. Dignified, if you squint." → take.
- Otherwise: "My pepper mill. Black, tall, and older than some of my friends. I'll bring it. You never know." → take.

**Egg timer** (counter, 2,2): "My egg timer. It ticks like it's furious about something. Then it dings, and it's over it." → take.

**Kitchen shelf** (1–2, 1): "Tins, a jar of capers I've been meaning to open since spring, and a teapot that drips."

**Stove** (3, 2): "The stove. No kettle tonight. Cold baths only on Moonshine Night. That's the rule."

**Clock** (4, 1): Dusk: "Nearly moonrise. Roughly. That clock has never once been right, but it's always been confident." Morning: "Half past something."

**Window** (5–6, 1): "My window looks at the Pelletiers' wall. I didn't buy this house for the window. I bought it for the roof."

**Bookshelf** (9–10, 1): "Twenty-nine years of lesson plans. In case anyone ever needs the water cycle explained in a hurry."

**Bed** (9–10, 2–3): Dusk: "My bed. Later. Moon first." Morning: "I didn't sleep. The house creaked all night. Houses settle. This one felt like it was unsettling."

**Photo frame** (8, 3): "I know what it is." (Always. Never changes, never explained.)

**Moon chart** (table, 4–5, 4)
- Dusk: First: "My moon chart. Thirty-one Moonshine Nights, a tick for every moonrise. Every one of them in the Gate." Second: "The first nineteen years are in two hands. The neat ticks are mine." Then: "The last few ticks have crept a little to the right. My eyes, probably. Everything creeps right after fifty."
- Morning: First: "Last night's tick. I put it where the moon really was: outside the Gate. It looks like a mistake. It isn't." / "I'm taking it with me. I have questions for it." → take **moon chart**.

**Kitchen chairs** (3, 4 and 6, 4): "Kitchen chairs. One wobbles. I know which one, and I sit in the other."

**Wardrobe** (10, 5–6)
- Dusk: First: "My good cardigan, my other good cardigan, and my hat." Then: "The hat's for daytime. It isn't daytime."
- Morning: "My hat. It's daytime, and I'm going out." → take **hat** (used in Act 2; harmless in this slice).

**Washstand** (1, 6)
- With soap: "Lavender and pumice soap. The pumice is for my heels. The lavender is for my soul." → take **soap**.
- After: "A jug, a basin, and a mirror I avoid before ten."

**Plug hook** (6, 8)
- Before the plug comes back: "The plug hook. Empty. Oh — I lent the plug to him downstairs. A 'chess emergency.'"
- While Cheryl has the plug or it's in the tub: "The plug hook. Empty, but only because the plug is busy."
- Morning: "The plug hook. Empty. I'm going to find out why."

## Characters and dialog

### Old Man

Sits at (2,16) on his stool, facing Gerald's empty chair. Idle animation: chin on hand; now and then he reaches out, moves a piece (tap), and then moves it back.

**First talk** → `oldMan.wantsKing`
- OLD MAN: Shh. Gerald's thinking.
- OLD MAN: He's been thinking since Tuesday. Seventeen years, this game, and I'm one move from beating him.
- OLD MAN: …You're looking at the king. Yes, it's your plug. A very good king. Heavy. Doesn't blow over.
- OLD MAN: Bring me another king and you can have it back. Black. Tall. Dignified. Gerald's particular.

**Repeat** (alternate)
- OLD MAN: Black. Tall. Dignified. Gerald won't play against a teaspoon. I've tried.
- OLD MAN: I could win in one move. I won't. I'd never hear the end of it.
- OLD MAN: Shh.

**Give pepper mill** (works whether or not they've talked) → remove pepper mill; give **bath plug**; `oldMan.hasPepperKing`
- (He turns the mill over. *Grind.*)
- OLD MAN: Black. Tall.
- (*Sneeze.*)
- OLD MAN: …Dignified.
- OLD MAN: Gerald says it'll do. Gerald has never been so frightened in his life.
- OLD MAN: Here. Your plug. It was a good king. Never once tried to castle.

**Repeat after** (alternate)
- OLD MAN: The pepper king's doing very well. Gerald hasn't moved in an hour. Terror, I think.
- OLD MAN: Check, Gerald. …No. That's not check. Never mind.

**Other items**
- Egg timer: OLD MAN: A clock? Gerald and I don't use clocks. Time's for people who expect to finish.
- Soap: OLD MAN: I washed on Sunday.
- Clothes prop: OLD MAN: That's hers. I'm not getting involved. Gerald got involved once. Never again.
- Bath plug: OLD MAN: No, no. It's retired. It was a good king. Let it rest.
- Anything else: OLD MAN: Not now. Gerald's thinking.

**Morning**
- First: OLD MAN: Piano went down the Squeeze in the night. Took the Pelletiers' geraniums with it.
- OLD MAN: Gerald says it was the wind. Gerald's an idiot.
- Repeat: OLD MAN: Every piece slid to one end of the board. Gerald blames me. I blame the board.
- Moon chart: OLD MAN: Moons. Not my department.

### Neighbor (Her Next Door)

Stands at (17,5) among her sheets. Idle animation: smoothing a sheet, then stepping back to admire it.

**First talk** → `neighbor.wantsProp`
- NEIGHBOR: Mind the sheets! They're bleaching.
- NEIGHBOR: Full moon on Moonshine Night. Whiter than a gull's conscience, my mother used to say.
- NEIGHBOR: I know they're across your view. I'd put them on the back line, but it sags into my pots without the prop.
- NEIGHBOR: And that sweaty boy downstairs has run off with my prop.

**Repeat** (alternate)
- NEIGHBOR: Bring me my prop and I'll move them. I'm not unreasonable. I'm just right.
- NEIGHBOR: I can hear you thinking. You think very loudly for a quiet woman.

**Give clothes prop** (works without talking first) → remove prop; `neighbor.sheetsMoved`
- NEIGHBOR: My prop! Is it damp? It's damp. Never mind.
- → She walks to the back line, sets the prop under it, and moves the sheets across: the N–S lines go bare, and the sheets appear on the back line, one per beat, each with a flap. She returns to (16,3).
- NEIGHBOR: There. They'll get more moon back here anyway. Don't say anything.

**Repeat after** (alternate)
- NEIGHBOR: Look at them. Drinking it in.
- NEIGHBOR: Enjoy your bath. Don't splash my whites.

**Other items**
- Pepper mill: NEIGHBOR: Pepper? On Moonshine Night? I've no idea what you're getting at.
- Egg timer: NEIGHBOR: I don't need timing. The moon does the timing.
- Soap: NEIGHBOR: Lovely. Are you saying something? You're saying something.
- Bath plug: NEIGHBOR: That's yours. Keep it away from my laundry.
- Anything else: NEIGHBOR: I've no use for that, and I've told you so.

**Morning** (at 14,3, facing the grey sheets)
- First: NEIGHBOR: Grey. GREY. Thirty years of Moonshine Nights and they've come out grey.
- NEIGHBOR: The moon wasn't straight on. I don't know where it was, but it wasn't straight on.
- NEIGHBOR: And the house LEANED. I've changed bleach. Mother's recipe. There's vinegar in it, and something she wouldn't tell me.
- Repeat: NEIGHBOR: Mother would be mortified. Mother would blame the moon. Mother was usually right.
- Moon chart: NEIGHBOR: See? Outside the Gate! I knew it wasn't straight on. Not that anyone asked me.

### Sweaty Kid

About ten. Runs laps of the well (see the map notes) at a steady jog, hopping the hurdle each time round. Sweat drops fly off him at the corners. Whenever Cheryl is within two tiles of him, or the player clicks or taps him, he stops where he is and jogs in place, facing her, so talking to him and giving him things work like any standing NPC.

**First talk** → `kid.wantsTimer`
- SWEATY KID: Can't stop! Stair Race in nine days. I'm gonna win it by SO much.
- SWEATY KID: I'm doing laps. Forty laps. Or thirty. I keep losing count, because the well's round.
- SWEATY KID: If I had a timer I'd know if I was getting faster. Mum says I'm only getting sweatier.
- SWEATY KID: The prop? It's my hurdle. Watch! → he hops the hurdle once and comes back.
- SWEATY KID: Did you see? I was in the AIR.

**Repeat** (alternate)
- SWEATY KID: Need a timer! Something that ticks!
- SWEATY KID: I just did a lap in… about… a while.

**Give egg timer** (works without talking first) → remove egg timer; give **clothes prop**; `kid.hasTimer`
- SWEATY KID: Whoa. Is that a TIMER? It ticks! It's got a BELL!
- SWEATY KID: Okay. Okay okay okay. You can have the hurdle. Hurdles are for babies. I'm doing pure speed now.
- → He lifts the prop off the pots and hands it over. From then on, every third lap ends with a *ding*, and he throws both arms up.

**Repeat after** (alternate)
- SWEATY KID: I set it to five minutes and ran till it dinged. I won! Against the EGG!
- SWEATY KID: Three minutes forty! …Is that good? It feels good.

**Other items**
- Pepper mill: SWEATY KID: I don't need pepper. I need SPEED.
- Soap: SWEATY KID: I had a bath last WEEK.
- Bath plug: SWEATY KID: That's a plug. …Why are you showing me a plug?
- Clothes prop (after the trade): SWEATY KID: Keep it! Hurdles are for babies.
- Moon chart (morning): SWEATY KID: Is that a race map? …It's just ticks. Boring ticks.
- Hat (morning): SWEATY KID: No hats! Hats are drag!
- Anything else: SWEATY KID: Can't carry it! Aerodynamics!

**Morning** (jogging in place at 15,22 by the Squeeze)
- First: SWEATY KID: Did you see the well? It BREATHED. I put my face over it and it breathed on me.
- SWEATY KID: It smelled like fish. Old fish. Like the bottom of the sea's armpit.
- Repeat: SWEATY KID: Squeeze is clear! I'm gonna run it, down AND up. Time me! …Oh. I've got the egg.

## Items

| Item | Icon idea | Inventory description |
| --- | --- | --- |
| Pepper mill | Tall black mill | "Black. Tall. Dignified, if you squint." |
| Egg timer | Little round wind-up timer with a bell | "Ticks when it's wound. Dings when it's done. Very sure of itself." |
| Clothes prop | Long forked pole (diagonal) | "A long forked pole for holding up washing lines. Slightly damp. Sweaty Kid damp." |
| Bath plug | Brass plug with a little chain and ring | "My plug. Brass, with a little chain to pull it out by." |
| Soap | Lilac bar | "Lavender and pumice. For heels and soul, respectively." |
| Moon chart *(morning)* | Rolled paper with a crescent | "Thirty-one ticks in the Gate, and one outside it." |
| Hat *(morning)* | Wide-brimmed straw hat | "My daytime hat. Wide brim. It has seen things." |

### Wrong combinations

Specific lines (Cheryl):
- Pepper mill on tub: "Pepper in the bath. Bold. No."
- Egg timer on tub: "I don't time my baths. My baths time me."
- Soap on tub, before it's full: "Soap comes after the water. Even I know that." Once full: "Later. Moon first."
- Anything on the well: "I'm not dropping anything down there. I'd only wonder about it."
- Soap on the piano: "Not now. It isn't going anywhere."
- Clothes prop on the sheets: "It's her prop and her sheets. She can do the honors."

Each NPC has its own "Anything else" decline (listed with their dialog), so giving an NPC the wrong thing always gets an answer in that NPC's voice. Cheryl's generic fallback is only for objects (cycle in order):
- "No."
- "That's not where that goes."
- "I don't think so, somehow."
- "I'd only have to explain it later."

## The Moonrise sequence

**Trigger:** interact with the tub when `tub.full` and `neighbor.sheetsMoved`. Input is locked until step 17. "Auto" boxes advance on their own after about 1.2 seconds and do not wait for input. All other boxes wait for input.

1. Internal monologue: *Plug in. Water in. Sheets out of the way.* / *Now, the moon.*
2. Cheryl walks to (3,5), just south of the tub, turns east, and sits on the tub's edge (sit pose).
3. **Cistern Court** fades out over two seconds. Ambient sound rises: the festival murmur from the city below. Far off, the Mayor's new clock on the Crown strikes the hour (three strokes, fading).
4. Crossfade (one second) to the **vista**.
5. **Vista.** The Bowl at dusk from Cheryl's roof, looking east. Foreground: Cheryl's silhouette from behind, lower left (the bun and its coral tie), and the rim of the tub. Below her, roofs stepping down to the water, each with a tiny basin that twinkles. Middle: the dark Bowl with a long gleam. Background: the Rim's cliffs, deep violet against a sky shading from apricot to indigo, with the Gate notch at screen center (x ≈ 128). Music: **Moonrise**, a music box playing the rhyme melody slowly.
6. A glow brightens behind the Rim, *to the right of the Gate* (x ≈ 176). Hold two seconds. The music box keeps playing; the murmur continues.
7. The moon's rim appears over the cliff at x ≈ 176 and rises slowly (about six seconds until half of it is up). As it appears, the festival murmur stops dead. A single dog barks, far off. The music box slows, drifts flat, and stops mid-phrase.
8. Internal monologue over the vista: *No.* / *It comes up in the Gate.* / *It has come up in the Gate every year of my life.*
9. **Hard cut** (no fade) back to the roof, now under the **night** tint, with Cheryl seated at the tub.
10. **The groan.** A long, low metallic groan from far below (about three seconds). Light screen shake (1 px) for its whole length. The tub water sloshes. The chimney pots rattle. The sheets on the back line swing out to one side and hang there at an angle. Auto boxes: SWEATY KID: WHOA! then NEIGHBOR: My SHEETS!
11. **The crack.** An enormous, sharp metallic CRACK from very deep, with a strong screen shake (3 px, half a second).
12. **The piano.** From the court below comes a crash of chords, then a tumbling run of thumps and jangles that recedes downhill over about three seconds. (It's off-screen. In the morning the piano is gone.)
13. **The drain.** *Glunk.* The plug is yanked out of sight (tub anim: plug gone), a whirlpool spins in the tub, and the water drains in about 1.5 seconds with a gurgle. Then, from the drain, a long hollow echo falls away and away, and about 2.5 seconds later there's a tiny, faraway splash.
14. Silence for 1.5 seconds. A gull. Wind.
15. Cheryl stands. Internal monologue: *That drain goes to the gutter. The gutter goes to the lane.* / *That sound went somewhere else entirely.*
16. NEIGHBOR: Did you FEEL that? The whole house went sideways! / NEIGHBOR: It's the bleach. I've overdone the bleach.
17. Internal monologue: *Something's wrong.* / *Not wrong like a dropped stitch. Wrong like a step that isn't there.*
18. Fade to black over two seconds. Text card, centered: **Morning.** (2 seconds.)
19. Set `act1.moonrise` and the morning state. Fade in on the flat under the **day** tint, with Cheryl standing at (8,4) by the bed. Music: **Morning After**.
20. Internal monologue: *My plug is gone. The moon came up in the wrong place. There's a piano loose in the city.* / *I'd like to know why.* / *I'd also like my plug back.*
21. Control returns.

## End of slice

Walking into the Squeeze exit in the morning ends the slice for now: fade to black, then a card reading **MOONSHINE** over **End of the opening. Tessel continues soon.**, then back to the title screen. When Act 2 is built, this exit leads to Lamp Street instead.

Nothing in the morning is required before leaving. If the player leaves without the moon chart or the hat, Act 2 lets them come back for both.

## Art needed

The tints (dusk, night, day) are global color treatments by the engine, not separate tile sets, except where listed.

**Tiles — roof level**
- Roof paving (whitewashed plaster floor; 3 variants, one cracked)
- Parapets: north parapet with front face; west, east, and south edges; the low dividing wall with its one-step gap
- Backdrop row: higher roofs and the lower walls of the Crown
- Chimney stack, 2×1, with pots wearing little hats (caps on the overhead layer)
- Herb pots (2)
- Folding chairs (2, matching)
- Clawfoot tub, 2×1. States: empty with no plug; empty, plugged; filling (2 frames); full (shimmer, 3 frames); sloshing (2 frames); whirlpool (3 frames); half; empty with no plug (morning, the same as the first state)
- Roof standpipe tap
- Clothesline posts; N–S lines hung with sheets (overhead, flutter, 2 frames); the back line sagging, empty; the back line with prop and sheets (flutter, plus one "swung sideways" frame); grey-sheet palette for the morning

**Tiles — facades and stair**
- Whitewashed facade with blue shutters (Cheryl's house) and green shutters (the Neighbor's); windows, some with flower boxes
- Two doors: Cheryl's blue door and the Neighbor's
- Outside stair cut through the facade (3 rows plus top and bottom landings)

**Tiles — court**
- Cobbles (3 variants) and a drain grate
- Lemon tree: trunk, 3×3 canopy (overhead), with a few lemons
- Chess table with board: plug-king version, pepper-king version, and slid-pieces version (morning); the Old Man's stool and Gerald's chair
- Well, 2×2: stone ring and iron grate
- Flowerpots (terracotta), the hurdle (prop across two pots), bare pots
- Geraniums in pots
- Bench, 2×1
- West wall with the Pelletiers' iron gate
- Lower rooftops seen from above (terracotta and flat whitewashed roofs)
- The Squeeze: narrow stair going down, 2 wide; morning variant with scrape marks
- Piano wedged at an angle, 2×2, with a label and a note on the lid

**Tiles — flat**
- Floor (terracotta), interior wall face, rug (3×2)
- Kitchen counter (2), with the pepper mill and egg timer, and bare; stove
- Wall clock, window, bookshelf (2)
- Bed (2×2); side table with a face-down photo frame
- Table (2×1) with the moon chart, and bare; two chairs
- Wardrobe (1×2); washstand with jug, basin, mirror, and soap, and without soap
- Door; plug hook (empty)

**Sprites**
- **Cheryl:** walk in 4 directions; idle in 4 directions; reach/interact (up, side, down); sit on the tub edge facing east; stand up
- **Old Man:** seated idle (2 frames: thinking, reaching for a piece); turning the pepper mill; sneeze; talk
- **Neighbor:** idle smoothing (2 frames); walk in 4 directions; reaching up to the line
- **Sweaty Kid:** run in 4 directions (4 frames); jog in place (2 frames); hop; arms up; sweat-drop particle (2 frames)
- **Ambient:** swifts at dusk (optional); a gull in the morning (optional)

**Vista (full screen, 256×224)**
- Background: the Bowl at dusk looking east from Cheryl's roof, as described in step 5 of the sequence, with the Gate at screen center
- Separate pieces: the moon (about 32×32), the glow behind the Rim, Cheryl's silhouette with the tub rim (foreground), and rooftop basin twinkles (2–3 frames)

**Effects**
- Global tints: dusk, night (moonlit), day
- Screen shake (light and strong); fade to and from black; centered text card
- Well mist (morning, 3 frames)

**UI** (if not already built): dialog box with speaker label; a separate style for internal monologue; inventory panel; 16×16 icons for the seven items above.

## Audio needed

**Music**
- **Cistern Court**: a warm dusk theme, unhurried, in a gentle triple meter. Plucked strings and a reedy, accordion-like lead. Loops in 60–90 seconds. It becomes Cheryl's home theme for the whole game.
- **Moonrise**: a music box playing the skipping-rhyme melody. The rhyme's tune is the game's central motif; later it returns underground and at the ending. Following the [audio direction](../audio-direction.md#leitmotifs), build it from the home motif's intervals rearranged, with a turn to the flat sixth, so that Tessel's home tune turns out to be a fragment of the Founders' rhyme. It needs a "detune and stop mid-phrase" ending for this scene.
- **Morning After**: a thinner, slightly uneasy variation of Cistern Court, short and looping.

**Sound effects**
- UI: text blip, menu open and close, cursor move, select, item get (a short jingle), give item
- Movement: footsteps on stone (outdoors), on tile (indoors), on stairs; door open and close
- Puzzle: tap squeak; water pouring (loop) and tub full; chess piece tap; pepper grind; a comic sneeze; egg timer ticking (loop) and ding; sheets flapping; Kid's footstep patter and hop; one slightly flat piano note
- Ambience: evening swifts; distant festival crowd murmur (loop, which must stop abruptly); one distant dog bark; gulls; wind; the Crown clock striking, distant
- The Wrongness: a long, deep metallic groan (an enormous rope or chain under strain); a huge deep metallic CRACK; chimney pots rattling and house timbers creaking; a piano tumbling down stairs (a chord crash, then thumps and jangles receding); the drain's *glunk*, gurgle, and long falling echo ending in a faint far splash
- Morning: the well's cold breath (a soft whoosh)

## Playtest checklist

- [ ] Both threads can be finished in either order, and interleaved, with no softlock.
- [ ] Every NPC accepts their item whether or not the player has talked to them first.
- [ ] Every object has a first and repeat description; nothing says "nothing happens."
- [ ] All blocked exits explain why.
- [ ] Every action works with keyboard alone and with pointer alone.
- [ ] Each text box fits (about 90 characters).
- [ ] The moonrise sequence lands: the off-center moon is clear even to someone not looking for it, the silence after the murmur stops is felt, and the cut back to the roof is sharp.
- [ ] Morning state: piano gone, Squeeze open, sheets grey, chessboard slid, well breathing, every NPC has new lines.
- [ ] First-time players finish in 8–12 minutes (up to about 20 if they look at everything).
- [ ] The item hint appears on the first pickup and stays until the bag is opened.
- [ ] The Kid stops for Cheryl when she's within two tiles, and when he's clicked.

## Decisions

- **Revised after review (xaKh8TS_PJ):** the hurdle's position fixed on the map; an item-use hint; the Kid stops within two tiles or when clicked; per-NPC declines for wrong items; flat collision and a shelf line; the tap points to the next step; fewer ship clues in the morning (the bed and drain lines no longer say "boat" or "rope"); Gerald's game is seventeen years, so it can't be read as a clue to Cheryl's past; the Pelletiers' cat added (an existing art-kit sprite).
- **The slice is two maps: Cistern Court (roof and court in one scrolling map) and the flat.** That's big enough for two parallel threads and small enough to polish soon.
- **The roof and court share one map, joined by an outside stair.** Players see the vertical, stair-stacked feel of Tessel from the first minute.
- **The flat supplies the tradeable items.** It's natural that Cheryl's own home is where her things are, and it teaches taking items before giving them.
- **The confinement is explained in-world:** the piano in the Squeeze, the Pelletiers away (which also foreshadows the stopped ferry), and roof edges too dangerous for Cheryl.
- **The Wrongness itself opens the way out:** the lurch sends the piano down the Squeeze.
- **The moonrise is staged as a full-screen vista,** because a top-down map can't show the horizon. It's the slice's one big art piece.
- **One new engine feature is needed: auto-advancing text boxes** for overlapping shouts during the sequence. The engine also needs global tints that can change mid-scene (dusk → night → day).
- **The slice ends at the Squeeze with an end card** until Act 2 exists.
