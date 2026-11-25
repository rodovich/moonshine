# Art direction

Moonshine should look like a lovingly made 16-bit adventure: warm, legible, a little storybook. The surface city is sunlit and inviting; the tunnels below are cool, geometric, and older than anyone remembers; the Wrongness looks like nothing else in the game. This document states the rules that keep those three looks consistent. Follow it for every new sheet; change it (and say why) when it stops serving the game.

The file format itself (palette-indexed text grids, the 15-color limit) is in [decisions.md](decisions.md). See every sheet and a composed street at `game/dev/art.html` (run `npx serve game` and open `/dev/art.html`). Run `node tests/check-art.mjs` before committing art.

## The look in one paragraph

A Mediterranean hill town drawn in a top-down 3/4 view: whitewashed and pastel plaster walls, blue and green shutters, blue domes and terracotta roofs, warm limestone paving, teal canal water, geraniums and bougainvillea. The light comes from the upper left (northwest) in the late morning, so tops are brightest, south-facing walls are a step darker, and shadows fall down and to the right. Characters carry a dark outline so they always read against the busy, pale streets; architecture has no black outline and separates by value instead.

The city is reminiscent of Santorini and Venice but copies neither. Mix their ingredients (flat whitewashed roofs and domes; canals, stepped bridges, and tiled roofs) with invented ones, and avoid famous silhouettes or landmarks. (From the client's brief.)

## Palette

The master palette is `game/src/art/palette.js`. Every color is 15-bit (channels are multiples of 8).

- **Ramps, not loose colors.** Most families are a ramp of four: `_light`, base, `_shade`, `_deep`. Shade a surface by stepping along its ramp, not by mixing in black or gray.
- **Hue-shift the ramps.** Shadows lean toward violet/blue, highlights toward yellow. Whitewash shades to a lavender gray (`white_shade`), not to neutral gray; limestone darkens toward mauve (`stone_deep`). This is what makes the surface feel sunlit rather than flat.
- **Outline color is `ink`** (#201828, a warm violet-black). Pure black never appears.
- **Accents are few and saturated.** Cobalt and sage for doors, shutters, and domes; terracotta for roofs and pots; coral, mustard, and teal for clothing; `bloom_red` and `bloom_pink` for flowers. Keep big surfaces (walls, paving, water) low in saturation so these accents and the characters pop.
- **Families by place.**
  - Surface: `stone_*`, plaster (`white_*`, `ochre_*`, `rose_*`, `sky_*`), `cobalt_*`, `sage_*`, `terra_*`, `wood_*`, `iron_*`, `leaf_*`, `water_*`.
  - Underground: `slate_*`, `void`, `verdigris_*`, lit by `relic_amber` and `relic_cyan`. The underground keeps surface colors out, except where something from the surface has fallen or been carried down.
  - The Wrongness: `wrong_glow`, `wrong`, `wrong_deep`, `wrong_void`, `wrong_bile`. **Reserved.** Nothing else in the game uses them, so the player learns to read them as "this is Wrong." `tests/check-art.mjs` rejects any frame that uses them unless its name contains `wrong`.
- **Add colors to the master palette when a sheet truly needs one**, as a full ramp where possible, under the right family heading. Don't add a near-duplicate of an existing color.

## Light, shading, and shadow

- **Light from the upper left.** Top surfaces (roofs, paving, coping, treads) are the lightest value of their ramp. South-facing walls use the base value. The right-hand edges of objects and right-facing sides take the shade value.
- **Every edge that faces the light gets a highlight line; every edge that faces away gets a shade line.** Paving slabs have a light top-left bevel and a darker bottom-right joint; doors and windows have their shadow inside the top and left of the opening (they're recessed).
- **Shadows are short and down-right.** A roof lip casts a 2–3 px band of `_deep`/`_shade` onto the wall below it; a dome casts a short wedge onto the roof to its right; a bridge darkens the water on its east side. Walls meet the ground with a one-pixel contact line in the darkest value. No long cast shadows: they fight the tile grid.
- **Recesses go dark.** Window glass is `glass_dark` with a single `glass_light` glint at the upper left. Doorways and archways use shaded paving (`pave_*_shade`).

## Outlines

- **Characters, props, and item icons:** a 1 px `ink` outline around the silhouette, plus interior `ink` lines only where shapes overlap (an arm against the body, the brim of a cap). This keeps them readable on pale stone and white walls.
- **Architecture and ground:** no `ink` outline. Separate shapes by value: a lighter top, a darker face, a deep contact line. Use `ink` in architecture only for the very darkest recesses (inside a door arch, behind window muntins).
- **Overhead cloth and foliage** (awnings, laundry, vines) take an outline, because they sit over characters and need to read as separate objects.

## Dithering

- **Default: no dithering.** Flat clusters of color read better at 256×224 and survive scaling.
- Allowed sparingly: a checkerboard transition of at most two rows on a large gradient (deep water, sky glimpsed through a skylight, a lamp's glow on a wall).
- **The Wrongness may break this rule** — scattered single pixels, noise, misregistered dithering — precisely because nothing else does.
- Avoid "pixel soup": isolated single pixels of a contrasting color scattered across a surface. Texture comes from a few deliberate specks per tile (2–3 at most), from joints and bevels, and from variant tiles.

## The three looks

### The surface city

Warm, bright, and soft-edged. Curves are rounded (domes, arches, the lips of flat roofs, scalloped awnings). Plaster walls are mostly empty space with a few strong features (a blue door, a shuttered window with a flower box), so the eye rests. Streets are limestone flagstones; terraces step down the hillside behind ashlar retaining walls topped by pale coping; stairs and stepped bridges connect the levels. Life spills into the street: pots of geraniums, laundry, a bench, a sleeping cat.

### The underground (direction for future sheets)

A different architecture by a different people. Where the city is rounded, soft, and whitewashed, the tunnels are **straight-edged, precise, and dark**: long corridors of fitted slate blocks with no visible mortar, chamfered (45°) corners instead of arches, repeated geometric inlays, and floors of large square plates. Colors are cool and desaturated (`slate_*`, `void`), with verdigris on old metal. Light comes from the long-forgotten technology itself — panels, channels, and lenses glowing `relic_amber` or `relic_cyan` — so here light sources are local and shading is lit from the glow, not from the upper left. Keep surface colors out of the underground so that the first glimpse of whitewash or a terracotta tile down there (a fallen roof, a dropped pot) means something.

**Building it** (`underground.js`, `machines.js`). Rooms are carved out of the hull's dark mass: fill with `hull:top`, then cut the floor. A north wall shows its face two tiles tall (`face_top` over `face_base`, with `_b` offset seams and lit or inlaid variants: `face_top_line`, `lightpipe`, `lamp_*`). Other walls show only their top, with a lit edge facing the floor (`top_edge_n` along a south wall, `top_edge_e` / `top_edge_w` along the west / east walls). Where floor meets wall the corner is a 45° cut (`top_chamfer_*`), never square or rounded. Floors are one plate per tile with hairline seams, so the grid is meant to show; break it with a few variants (`floor_glyph`, `floor_worn`, `floor_broken`, `floor_wet`), not noise. Corridors get a rib every 3 tiles: `face_rib_*` on the wall and `over_rib_v` / `over_rib_h` overhead across the floor. Anything overhead that crosses walkable floor must let Cheryl show through: the rib beams are solid only along their edges, with a sparse dither between (a solid beam hid her completely in playtest). In a dark room even the dithered beam leaves her murky, so there use only the wall ribs (`face_rib_*`), as Act 3 does in the Step Gallery (the Act 3 builder's call after playtest). Openings are hatches (`hatch_*`, `floor_hatch*`, the moon-lock door), never arches. Light is local: put a `floor_glow` / `floor_glow_amber` pool under each light-pipe or lamp and leave the rest dark. Machines sit on the objects layer, bronze darkened with verdigris. The Wrongness uses `hull_wrong` frames only, crossing seams rather than following them. The underground is authored at its final lighting; it takes no tint.

The Founders' style first shows on the surface in the Bell Tower's base and the Founders' Door: dark slate, blocks told apart only by tone, 45° chamfers, `relic_cyan` only at seams.

### The Wrongness

It should look like an error in the world rather than a monster in it.

- **Only it uses the `wrong_*` colors.** A hot violet-magenta (`wrong`, `wrong_glow`) over a near-black `wrong_void`, with an acid `wrong_bile` used rarely.
- **It ignores the grid and the light.** It crosses joints and tile seams instead of following them, isn't lit from the upper left, and casts no shadow.
- **It misregisters.** Pixels slip by one, edges jitter between frames, and dithering appears where none should be.
- **It pulses irregularly** (uneven frame timings, such as 500/120/260 ms), never with a smooth, regular rhythm.
- Symptoms on the surface can be small: a crack in the paving (`street:pave_wrong`), a window that reflects the wrong color, a cat that won't sit on one particular slab. Make them small and few at first.

## Props and furniture in 3/4

Every freestanding object shows three things: its **top plane** (the lightest value, 3–5 rows deep for a table, crate, or bench seat), its **south face** (one step darker), and a **contact shadow** (a dark line or two where it meets the floor, offset to the right). An object drawn as only a front face reads as a picture on the wall. Signs and boards that stand at an angle show their slant and their legs. Props take an `ink` outline; the edge of a board or frame inside the outline uses a lighter value than `ink`.

## Domes

Tessel's domes are blue, but they are not Aegean postcards: they sit on a squat drum with round windows (oculi), and they carry a small moon finial (a disc or crescent on a one-pixel stem). Avoid the blue-dome-on-white-cube-with-a-cross silhouette.

## Proportions and characters

- Tiles are 16×16. Character frames are 16×32, anchored at the bottom center: the bottom row of the frame is where the feet touch the ground.
- **Adults stand about 24 px to the crown** (Cheryl's bun adds 4 more; the Old Man's stoop and cap make him about 23); the head is 9–11 px, around 40% of the height. This is the chunky, expressive SNES proportion: big heads for readable faces, short legs. **Children are about 19 px**, with even bigger heads. Door openings are 26 px tall to the top of the arch, so an adult fits with a little room.
- **Personality is in the silhouette first.** Each character needs one shape you'd recognize as a black blob: Cheryl's bun and satchel, the Old Man's cap and cane, Her Next Door's knotted headscarf, the Shopkeeper's round apron, the Sweaty Kid's spiky hair and sweatband. Then color, then face.
- Faces are minimal: 1 px eyes in `ink`, a 2 px mouth or a mustache, a shade pixel for the nose in profile.
- Side views (`left`) are drawn. `right` frames may be mirrors of `left` when the character is symmetric enough; when an asymmetric detail matters (Cheryl's satchel is always on her right hip), draw `right` properly. The engine mirrors `right` into `left` only when `left` is missing.

### Cheryl

Late 50s, the player, and vigorous with it. Silver-streaked hair (an ash-grey base, `cheryl_hair`, with streaks of `silver`, never white all over) pulled back into a bun with a small coral tie; a smallish, neat head, an upright back, and a skirt that falls straight rather than bundling. The client found the first version read older than 58, so keep her brisk and upright in every pose and vista. A coral cardigan over a cream blouse; a navy mid-calf skirt; sensible brown shoes; a leather satchel on a strap across her body, riding on her right hip (the inventory lives in it). She stands straight; she walks briskly and stops to look at things. Coral and navy make her the most saturated, highest-contrast figure on warm stone, and they hold up under the dusk tint. Keep her palette distinct from every NPC's.

The story bible defers to this section for her look. (Round 2 briefly redrew her in a mustard cardigan and teal skirt to match an earlier draft of the bible while the bible was being changed to match this design. The coral look won: mustard sits too close in value and hue to the warm paving, especially at dusk.)

Her sheet also has interaction poses: `reach_up`, `reach_down`, `reach_left`, `reach_right`; `sit_left`/`sit_right` (seated on a ledge, shins hanging); `sit_tub_right` (on the tub's west-end rim, facing east, shins in the water: they stop at a pale ring at the waterline and the tub shows through around her); `rise_left`/`rise_right` (half-way up); and `idle_<dir>_0/1` (a blink) for scripts.

For the moonrise only, she changes into a 1920s bathing costume (`cheryl_swim`, its own character sheet; the writer's design in docs/design/01-opening.md): navy and cream horizontal stripes, wide straps, a low back, knee-length legs, bare arms and feet, and a snug navy cap with a cream band over her bun, which keeps the bun's bump in her silhouette. The stripes are one pixel each in sprites and three in the vistas. Her coral cardigan goes folded onto a chair (`roof_props:chair_cardigan`). Both vista silhouettes of her in the tub (Act 1 and the final vista) wear the costume and cap. She wears it as unselfconsciously as her cardigan: same upright stance, same brisk walk.

### Generic residents

`old_man`, `shopkeeper`, and `kid` in `npcs.js`, and the opening's `old_man_seated`, `neighbor`, and `sweaty_kid` in `opening_npcs.js`, share one palette letter scheme (`k` outline; `F f x` skin; `H h` hair; `A a Z` main garment; `B b` second garment; `E e` accent; `o O` wood and shoes), so a swap written for one reads the same on the others. Each has two swaps today. To make a new resident, add a swap that changes skin, hair, and clothes together; vary skin tone across the town (`skin`, `skin2`, `skin3`). A named, story-significant character should get its own body rather than a swap.

## Animation

- Frames numbered `_0`, `_1`, … form an animation. Optional `durations` on a sheet set the time per frame in ms: a number for every frame, or an array with one entry per frame.
- **Walks use the engine's names:** `<dir>_0` stands, `<dir>_1` and `<dir>_2` are the two steps, and the engine plays 1, 0, 2, 0. The body sits one pixel lower on the step frames. The Sweaty Kid runs on a 4-frame cycle (`<dir>_1`…`<dir>_4`; set `sprite.walk: [1, 2, 3, 4]`). **Walk timing comes from distance, not `durations`:** the engine advances one walk frame per 8 px walked (a 4-frame cycle every two tiles), so Cheryl at 80 px/s shows about 100 ms per frame and NPCs at 60 px/s about 133 ms; `walk_*`/`<dir>_*` entries in `durations` are ignored. Idles and all other animations use `durations` as drawn. (From the engine task.)
- **Idles and poses carry personality** and are 2 frames with a long hold and a short beat where they loop: Cheryl blinks; the Old Man rests his chin on his hand and now and then reaches for a piece; Her Next Door smooths a sheet and then admires it, hands on hips; the Kid jogs in place and throws both arms up.
- **Walk-cycle checklist:** the legs touch the body on every frame (no transparent row between hem and foot); the two step frames are visibly different (the near leg lighter, the far leg darker, and the forward foot swaps); the arms or what they carry move opposite to the legs (a hand or a bag rides one pixel); the body bobs one pixel down on the steps.
- **Shadows under characters:** the engine draws a small oval ground shadow under the feet, which grounds sprites on pale paving. `fx:shadow` is the art's version of that oval if the engine wants to use a drawn frame instead.
- Ambient animation is slow and small: water at 260 ms with ripples that sway rather than scroll; laundry flaps at 600 ms; the cat's tail flicks after a long pause. Nothing on the surface should feel frantic.

## Tiles and maps

- **Three map layers** (the engine's names): `ground` (opaque tiles), `objects` (transparent tiles drawn on the ground, under characters: pots, jambs, signs, mooring posts, furniture), and `overhead` (drawn over characters). Anything a character can stand both in front of and behind (a lamp post, a tall plant) should be a sprite that sorts by its feet, not a tile. **Frames named `over_*` belong on the overhead layer.** Roof tiles above a walk-through passage also go on the overhead layer.
- **Paving is a 2×2 macro-tile** (`pave_nw`, `pave_ne`, `pave_sw`, `pave_se`) so the slab pattern repeats every 32 px instead of every 16. Place by position: `pave_{y even ? n : s}{x even ? w : e}`. Accent variants (`pave_se_crack`, `pave_nw_drain`, `pave_wrong`) replace the quadrant they're named for. Shaded versions (`pave_*_shade`) go under arches and deep doorways.
- **Building recipe**, top to bottom: roof surface (`roof`, `roof_l`, `roof_r`, or `rooftiles:*`), the front edge (`roof_front*`, or for tiled roofs a plain `wall` row under an overhead `rooftiles:over_eave*`), one or more wall rows (`wall`, `window`, `window_box`, `window_closed`, `balcony`, `door_top`), and a base row with the plinth (`wall_base`, `window_base`, `window_closed_base`, `door_bot`). Use `_l`/`_r` variants at the building's corners. Choose plaster color with a palette swap: base (white with cobalt), `ochre` and `rose` (with sage), `sky` (with wood), `white_sage`.
- **Arched passage** (2 tiles wide): shaded paving on the ground, `over_arch_l/r` overhead on the wall row, `arch_jamb_l/r` on the objects layer in the row below, and the roof above the passage on the overhead layer.
- **Terraces**: `retain_top` (coping), any number of `retain`, then `retain_base`. Cut stairs through with `stairs_l` + `stairs_r` (or `stairs` between them for wider flights).
- **Canal**: `bank_n` (the far quay's wall face), `water` rows, `bank_s` (the near quay's lip). The stepped bridge is 2 wide and 4 tall: `bridge_n_*`, `bridge_down_*`, `bridge_up_*`, `bridge_s_*`, with `water_shadow` on its east side.
- **Terrace corners** (`city:terrace`): where the upper terrace reaches further south on the left, put `retain_top_inner_l` and `retain_base_inner_l` in the corner column for the right-hand wall's rows, and below them in the same column `retain_top_end_r` and `retain_base_end_r` to end the lower wall, so the north–south coping stays in one pixel column. `ledge_e` / `ledge_w` carry the drop's edge north.
- **Canal ends** (`city:canal_edges`): `bank_n_end_w`, then `bank_w` for each water row, then `bank_s_end_w` (and the `_e` versions at the other end). A north–south canal uses `bank_w` / `bank_e` as its sides.
- **More buildings** (`city:facades`, same letters and swaps as `buildings`): an outside stair (3×2), an arcade row, a shopfront, a cupola and a squat dome; `city:gables` puts a pitched roof's gable end on the objects layer over a roof row and a wall row.
- **Landmarks** (`landmarks.js`): grids are named `name_x<col>y<row>`, with `_<frame>` for animated tiles: the Fountain of the Fish (full, low, dry) with the bronze fish as an entity, the Bell Tower, the Blue Dome and its door, the sundial, the Hundred Steps (flights, landings, the moon-eye riser, the hollow step dry / wet / open), and the Founders' Door.
- **Multi-tile objects** are drawn whole and cut into tiles (dome 2×2, bench 2×1, awning 3×1, laundry 3×1, vine 2×1), so their pieces only make sense together and in order.

## Time of day

The tiles are painted in neutral late-morning light. Dusk, night, day, and dawn are global washes from `game/src/art/tints.js`, applied with the engine's `tint()`:

- **Dusk** is two multiply passes: a deep rose-amber at 62% and a violet at 30%. Whitewash goes rose and dim and shadows cool, so it reads as sunset with the moon on its way. (It was 42% apricot, then 50% rose-amber; both read as afternoon in play.)
- **Night** first takes out 60% of the color (a `saturation` pass with grey), then multiplies by a moonlit blue at 70%: dark and cool, but every shape still readable. Moonlight is nearly colorless to the eye; without the first pass, saturated warm things (terracotta chimney pots, wooden chairs, roof tiles) kept their daytime warmth while the whitewash went blue (blind playtest).
- **Day** multiplies by a light warm grey at 35%, so whitewash in full sun isn't blown out (playtesters found the untinted morning bleached).
- **Dawn** (Act 6, Cistern Court after the climb out of the well) is a pink multiply at 45% and then a gold screen at 16%: whitewash goes pale pink with a warm lift, lighter than dusk. The Act 6 build chose the values; art keeps them in `tints.js`.

Check new tiles under `?tint=dusk` and `?tint=night` on the dev page. Tints compress hue, so never rely on hue alone for contrast (a coral cardigan against terracotta pots, a pale blue door on white): separate important shapes by value too. Shapes that depend on a small hue difference (a pale blue door on white) can vanish at night; separate them by value too. Colors listed in `EMISSIVE` (in `tints.js`: lamp glow, lit window glass, relic amber and cyan) skip the tint, so lit windows and lamps glow at dusk and night; anything meant to give off light should use one of them, and only things that give off light: an emissive color on a plain surface glows at night. A glow's halo must be emissive too (dither the emissive color rather than ringing it with a dim non-emissive one), or the dusk wash turns the halo warm and the glow reads as lamplight (the Crown's moon-eyes, blind playtest). The dev page restores emissive pixels after the tint, as the engine does. Light some windows at dusk and night with the buildings sheet's `_lit` swaps (warm glass): a few, not all, so the town looks lived in.

## Walkable roofs

Roof terraces people walk on (Cheryl's roof) are paved like a street, not left as the flat, empty top surface of an unwalkable roof: a whitewashed plaster floor in slabs with joints, a step darker than an unwalkable roof's top, with 2×2 macro variants and a cracked slab. They are bordered by parapets that show their top (lightest), their inner face (toward the terrace, base value, visible on the north parapet because it faces south), and, on the south edge, the drop beyond. The low wall between two roofs is a parapet seen from both sides. The facade below a walkable roof uses the dimmer `facade` plaster swap (`white_dim` for the wall face), so floor, coping, shade band, and wall read as four distinct steps; and a sheet hung on a line running north–south is seen nearly edge-on, as a tall narrow drape lit on its west side with a soft shadow to the east.

## Interiors

Light indoors comes from the room's window, which for Cheryl's flat is on the north wall, so interiors keep the same upper-left convention for consistency; the window itself is the brightest thing in the room. Rooms are seen in the same 3/4 view: the north wall's inner face fills the top two rows (wall objects such as shelves, clocks, and windows hang there), the side and south walls show only their tops, and the floor is warm terracotta (`clay_*`). Furniture sits on the objects layer with an `ink` outline like props. Keep rooms lived-in but calm: a few strong pieces, empty floor between them.

## Cutscene pictures

Full-screen pictures (the moonrise vista) are separate 256×224 sheets with their own palettes, split into layers the scene can move: background, a transparent foreground or skyline overlay, and small sprites (the moon, the glow, twinkles). They may use richer gradients than tiles (a limited two-row checker between sky bands), but the same rules otherwise: big clear shapes, light from a stated direction, no pixel soup.

### Skies

Paint skies the way the sun and moon really sit (client feedback). A full moon rises in the east as the sun sets in the west, so a moonrise horizon never has a sunset glow.

- **Looking east at dusk** (the moonrise vistas): from the horizon up, the Earth's shadow (`earth_shadow*`, blue-grey), the Belt of Venus (`venus_pink`, `venus_mauve`), then blue (`sky_east_blue`) deepening to indigo, with stars. Whatever faces the viewer catches the last sun from behind them: the Rim's cliffs glow rose (`alpen_rose*`, lit tops, cool `alpen_shadow` at the feet), and town walls and roofs facing the viewer are warm. The water reflects the cool sky and the pink band. Before the moon rises, the sky above that spot brightens with a cool silver glow (`moonrise_glow*`). The moon comes up large and pale, faintly peach-gold as it first clears the Rim (`moon_peach*`), and whitens as it climbs; its path on the water is the same pale gold (the writer's reconciliation in the story bible, "The sky over Tessel"). The sky around it stays cool.
- **Full dark** (the Act 6 Basin view, about an hour after sunset): indigo to the horizon with no glow, only a faint blue-grey (`earth_shadow_deep`) along the Rim. Two nights past full the moon is a waning gibbous: rising in the east, its lit limb faces the sun below the horizon, down and to the left, so its upper-right edge is a hair flattened (drawn for a northern-hemisphere sky). It's slightly warm (the cream `moon*` ramp).
- **Looking west at dusk** (the Act 3 dusk vista): the sunset's afterglow is right here, orange low to violet and indigo high. Cliffs and the faces of houses toward the viewer are backlit, so they're dark; edges facing the glow catch it.
- Stars are cool (silver or moon-white) whichever way the picture looks.
- Before painting a sky, find which way the picture looks in the design doc, and keep the Gate (east) out of westward views.

## Do and don't

- **Do** leave calm areas. A wall with one window and a flower box beats a wall covered in detail.
- **Do** check every new tile at 1× next to its neighbors on the dev page; that's how the player sees it.
- **Do** keep characters the most saturated, highest-contrast things on screen.
- **Do** make variant tiles to break repetition (a cracked slab, a mossy roof tile) rather than adding noise to the base tile.
- **Don't** outline architecture in `ink`, or use pure black or pure white.
- **Don't** shade with a different hue family than the surface's own ramp (no gray shadows on ochre plaster).
- **Don't** light anything from the right on the surface.
- **Don't** use `wrong_*` colors for anything but the Wrongness, or make the Wrongness pretty and orderly.
- **Don't** recreate the sprites, tiles, or landmarks of an existing game or a real famous building.

## Sheets

| Module | Sheets | What's in it |
| --- | --- | --- |
| `palette.js` | `COLORS` | master palette |
| `street.js` | `street` | flagstones (2×2 macro + variants + shaded), the Wrongness crack, retaining wall, stairs |
| `buildings.js` | `buildings` | flat roofs and lips, rooftop chimney and hatch, walls, windows, door, balcony, archway, dome; plaster swaps |
| `rooftiles.js` | `rooftiles` | terracotta tiled roof, ridge, gable edges, overhead eaves |
| `canal.js` | `canal` | animated water, quay banks, bridge shadow, stepped bridge, mooring post |
| `props.js` | `props` | street lamp, pots, crate, bench, signs, a ginger cat (sitting and asleep) |
| `cloth.js` | `cloth` | awnings (coral, blue, green), laundry line, bougainvillea — all overhead |
| `cheryl.js` | `cheryl` | the player: walk in four directions (`right` drawn, not mirrored), reach, sit, rise, blink |
| `npcs.js` | `old_man`, `shopkeeper`, `kid` | resident bodies with idle and walk in four directions, and palette swaps |
| `opening_npcs.js` | `old_man_seated`, `neighbor`, `sweaty_kid` | the opening's Old Man at chess, Her Next Door, and the Sweaty Kid, with their poses |
| `roof.js`, `court.js` | see module headers | Cistern Court: roof terraces, tub, sheets, facades, stair, courtyard, well, lemon tree, chess, piano, the Squeeze |
| `interior.js` | `interior`, `furniture`, `fittings`, `rug` | Cheryl's flat: floor, walls, window, door, furniture |
| `fx.js` | `fx`, `fx_mist` | sweat drops, swifts, gulls, dust puffs, splashes, the well's breath |
| `vista.js` | `vista`, `vista_rim`, `vista_glow`, `vista_moon`, `vista_twinkle`, `vista_cheryl` | the moonrise picture and its moving parts |
| `tints.js` | `TINTS` | dusk, night, and day washes |
| `underground.js` | `hull`, `hull_water`, `hull_wrong`, … | the Founders' tunnels and chambers: plates, walls, ribs, hatches, moon-lock door, ladders, channels, lights, the Wrongness |
| `machines.js` | `machines`, `keeper`, `keeper_chair` | ballast pump, valves, gauges, conduits, speaking tube, gears, windlass and chain, the Keeper's desk and chair |
| `city.js` | `terrace`, `canal_edges`, `facades`, `gables` | terrace corners and ledges, canal ends, more facades, domes, gable ends |
| `landmarks.js` | `fountain`, `fish`, `bell_tower`, `blue_dome`, `sundial`, `steps`, `founders_door` | Act 2's landmarks |
| `items.js` | `items`, `items2` | inventory icons: key, letter, teacup, bread, watering can, spectacles; the opening's pepper mill, egg timer, clothes prop, bath plug, soap, moon chart, hat |

### Item icons

16×16, outlined in `ink`, lit from the upper left, drawn at a slight angle or three-quarter view so they read as objects rather than diagrams. Leave a pixel or two of margin. Use one dominant material color per item so they're distinguishable at a glance in the inventory. The bag panel is dark navy (`ui_box`), so an `ink` outline disappears there: a dark object (the crowbar, the black pepper mill) needs a light rim or a light body to read. Check icons on `&bg=182048`.

## Working method

The art modules are the source of truth; edit the text grids directly. Drafting scripts that generate grids are fine but stay out of the repo. After any change, open the dev page (`?only=<sheet>&zoom=8&expand` shows one sheet's frames at 8×; `&bg=e0c8a0` puts them on stone; `?only=scene:court`, `scene:flat`, `scene:vista`, or `scene:street` shows one composed scene; `&tint=night` and `&state=morning` change the light and the story state) and look at it at 1× and 3×, then run `node tests/check-art.mjs`.
