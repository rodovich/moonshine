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

### The Wrongness

It should look like an error in the world rather than a monster in it.

- **Only it uses the `wrong_*` colors.** A hot violet-magenta (`wrong`, `wrong_glow`) over a near-black `wrong_void`, with an acid `wrong_bile` used rarely.
- **It ignores the grid and the light.** It crosses joints and tile seams instead of following them, isn't lit from the upper left, and casts no shadow.
- **It misregisters.** Pixels slip by one, edges jitter between frames, and dithering appears where none should be.
- **It pulses irregularly** (uneven frame timings, such as 500/120/260 ms), never with a smooth, regular rhythm.
- Symptoms on the surface can be small: a crack in the paving (`street:pave_wrong`), a window that reflects the wrong color, a cat that won't sit on one particular slab. Make them small and few at first.

## Proportions and characters

- Tiles are 16×16. Character frames are 16×32, anchored at the bottom center: the bottom row of the frame is where the feet touch the ground.
- **Adults stand about 24 px to the crown** (Cheryl's bun adds 4 more; the Old Man's stoop and cap make him about 23); the head is 9–11 px, around 40% of the height. This is the chunky, expressive SNES proportion: big heads for readable faces, short legs. **Children are about 19 px**, with even bigger heads. Door openings are 26 px tall to the top of the arch, so an adult fits with a little room.
- **Personality is in the silhouette first.** Each character needs one shape you'd recognize as a black blob: Cheryl's bun and satchel, the Old Man's cap and cane, the Shopkeeper's round apron, the Kid's cowlick. Then color, then face.
- Faces are minimal: 1 px eyes in `ink`, a 2 px mouth or a mustache, a shade pixel for the nose in profile.
- Side views (`left`) are drawn; `right` frames are mirrors of `left`. Asymmetric details (a satchel strap) flip with them. That's an accepted convention.

### Cheryl

Late 50s, the player. Silver hair pulled up in a bun with a coral tie; coral cardigan over a cream blouse; navy mid-calf skirt; sensible brown shoes; a leather satchel on a strap across her body (her right hip). She is the most saturated thing on most screens: coral and navy against pale stone. She stands straight; her walk is brisk and purposeful (140 ms per frame). Keep her palette distinct from every NPC's.

### Generic residents

`old_man`, `shopkeeper`, and `kid` in `npcs.js` share one palette letter scheme (`k` outline; `F f x` skin; `H h` hair; `A a Z` main garment; `B b` second garment; `E e` accent; `o O` wood and shoes), so a swap written for one reads the same on the others. Each has two swaps today. To make a new resident, add a swap that changes skin, hair, and clothes together; vary skin tone across the town (`skin`, `skin2`, `skin3`). A named, story-significant character should get its own body rather than a swap.

## Animation

- Frames numbered `_0`, `_1`, … form an animation. Optional `durations` on a sheet set the time per frame in ms: a number for every frame, or an array with one entry per frame.
- **Walk cycles are 4 frames: step, pass, step (other foot), pass**, with the body one pixel lower on the step frames. `walk_down`, `walk_up`, `walk_left`, `walk_right`; Cheryl at 140 ms, residents at 160 ms.
- **Idles are 2 frames with a long hold and a short beat**, and carry personality: Cheryl blinks; the Old Man nods; the Shopkeeper wipes his hands on his apron; the Kid hops.
- Ambient animation is slow and small: water at 260 ms with ripples that sway rather than scroll; laundry flaps at 600 ms; the cat's tail flicks after a long pause. Nothing on the surface should feel frantic.

## Tiles and maps

- **Three map layers:** `ground` (opaque tiles), `detail` (transparent tiles drawn on the ground, under characters: lamp posts, pots, jambs, signs, mooring posts), and `overhead` (drawn over characters). **Frames named `over_*` belong on the overhead layer.** Roof tiles above a walk-through passage also go on the overhead layer.
- **Paving is a 2×2 macro-tile** (`pave_nw`, `pave_ne`, `pave_sw`, `pave_se`) so the slab pattern repeats every 32 px instead of every 16. Place by position: `pave_{y even ? n : s}{x even ? w : e}`. Accent variants (`pave_se_crack`, `pave_nw_drain`, `pave_wrong`) replace the quadrant they're named for. Shaded versions (`pave_*_shade`) go under arches and deep doorways.
- **Building recipe**, top to bottom: roof surface (`roof`, `roof_l`, `roof_r`, or `rooftiles:*`), the front edge (`roof_front*`, or for tiled roofs a plain `wall` row under an overhead `rooftiles:over_eave*`), one or more wall rows (`wall`, `window`, `window_box`, `window_closed`, `balcony`, `door_top`), and a base row with the plinth (`wall_base`, `window_base`, `window_closed_base`, `door_bot`). Use `_l`/`_r` variants at the building's corners. Choose plaster color with a palette swap: base (white with cobalt), `ochre` and `rose` (with sage), `sky` (with wood), `white_sage`.
- **Arched passage** (2 tiles wide): shaded paving on the ground, `over_arch_l/r` overhead on the wall row, `arch_jamb_l/r` on the detail layer in the row below, and the roof above the passage on the overhead layer.
- **Terraces**: `retain_top` (coping), any number of `retain`, then `retain_base`. Cut stairs through with `stairs_l` + `stairs_r` (or `stairs` between them for wider flights).
- **Canal**: `bank_n` (the far quay's wall face), `water` rows, `bank_s` (the near quay's lip). The stepped bridge is 2 wide and 4 tall: `bridge_n_*`, `bridge_down_*`, `bridge_up_*`, `bridge_s_*`, with `water_shadow` on its east side.
- **Multi-tile objects** are drawn whole and cut into tiles (dome 2×2, bench 2×1, awning 3×1, laundry 3×1, vine 2×1), so their pieces only make sense together and in order.

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
| `cheryl.js` | `cheryl` | the player: idle and walk in four directions |
| `npcs.js` | `old_man`, `shopkeeper`, `kid` | resident bodies with idle and walk in four directions, and palette swaps |
| `items.js` | `items` | inventory icons: key, letter, teacup, bread, watering can, spectacles |

### Item icons

16×16, outlined in `ink`, lit from the upper left, drawn at a slight angle or three-quarter view so they read as objects rather than diagrams. Leave a pixel or two of margin. Use one dominant material color per item so they're distinguishable at a glance in the inventory.

## Working method

The art modules are the source of truth; edit the text grids directly. Drafting scripts that generate grids are fine but stay out of the repo. After any change, open the dev page (`?only=<sheet>&zoom=8&expand` shows one sheet's frames at 8×; `&bg=e0c8a0` puts them on stone; `?only=scene` shows the composed street) and look at it at 1× and 3×, then run `node tests/check-art.mjs`.
