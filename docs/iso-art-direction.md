# Isometric art direction

The isometric version of Moonshine should look like a lovingly made pre-rendered PC adventure from about 1997: a 640×480 screen, a 2:1 isometric city modeled in 3D and rendered to sprites, real light with soft shadows, high color with a fine ordered dither, and a bevelled brass-and-navy interface. It's the same Tessel, the same Cheryl, and the same palette identity as the SNES version, seen through a different decade's technology. This document states the rules. The architecture it serves is in [iso.md](iso.md); the SNES look it carries over is in [art-direction.md](art-direction.md).

See every sheet, a composed Cistern Court, the UI in use, and the moonrise picture at `game/dev/iso-art.html` (run `npm run serve`, open `/dev/iso-art.html`). Rebuild the art with `npm run art:iso` (about three minutes on 7 threads; `npm run art:iso -- cheryl cistern` rebuilds only those sheets).

## The look in one paragraph

A whitewashed Mediterranean hill town seen from above at a 2:1 angle, built of real-looking volumes: rounded parapets, terracotta pent roofs, arched windows with blue or green shutters folded open, cobbled courts, laundry, geraniums. Light comes from the left of the screen (the west, where the sun sets on Moonshine Night), so roofs and paving are brightest, left-facing walls are lit, right-facing walls fall into a cool shade, and every object casts a soft shadow to the right. Surfaces have gentle texture (plaster unevenness, stone, grain, knit) rather than drawn detail. People are small 3D figures with a soft dark rim that keeps them readable on pale stone. The interface is a set of bevelled brass frames with blue glass studs, over navy (other people talking) or warm brown (Cheryl).

## The benchmark: what we take from the late 90s, and what we don't

We draw on the era's **pre-rendered isometric** style: scenes and characters modeled in 3D and rendered offline into sprites, at 640×480, in 16-bit "high color". What that means here:

- **Modeled, lit, and rendered, not painted.** Volumes are true 3D shapes; shading, shadows, and occlusion come from light, not from hand-placed ramps.
- **Crisp sprite edges.** Sprites are color-keyed: a pixel is either drawn or not (no soft alpha edges), as era hardware blitted them. Only shadows and glows are translucent.
- **High color with ordered dither.** Colors are quantized to 16 bits (5-6-5) through a 4×4 Bayer matrix, which gives the fine, regular grain of the period's renders over smooth gradients.
- **A real interface.** Bevelled frames, a proper inventory window with item slots, a mouse pointer, and an item icon rendered from a model for every item.

We don't imitate any particular game: no borrowed layouts, characters, interface designs, or color schemes. Tessel's own materials (whitewash, cobalt, terracotta, brass, moon-eye glass) decide how the era's techniques look here.

## Resolution, projection, and scale

- **Screen:** 640×480.
- **Projection:** 2:1 dimetric. Tile (x, y) is centered at world (x + 0.5, y + 0.5); a world point projects to screen x = (wx − wy)·32, screen y = (wx + wy)·16 − z. Map +x (east) runs down-right on screen, +y (south) down-left, north up-right. The camera looks from the south-east, so the **south and east faces** of things show. (Proposed to the engine task, JljzUh5NiS, which is building the renderer against it.)
- **Floor tile:** a 64×32 diamond. Floor frames are cut to exactly their diamond, so they tile without overlap.
- **Heights are screen pixels:** one tile edge of height is **40 px** (true orthographic would be 39.2; 40 keeps the numbers round). A tile is about a meter.

| Thing | Height |
| --- | --- |
| Cheryl, to the crown | 66 px (1.64 m) |
| Her Next Door, the Old Man | 64 px |
| The Sweaty Kid | 52 px |
| A door | 84 px |
| A facade storey on the court | 96 px |
| Cistern Court's roof terraces above the court | 120 px |
| A parapet / the low wall | 36 px / 22 px |
| A stair step | 8 px (5 per tile) |

- **Figures:** realistic proportions nudged toward readability: heads about 15% larger than life (Cheryl's head is about 1/6 of her height, the Kid's about 1/4.5), so faces and hair read at 66 px.

## Light, shading, and shadow

- **One key light from the screen's left:** world west-southwest, 45° up (the vector (−0.75, 0.55, 1.0)). Tops are brightest; south faces (screen left) are lit; east faces (screen right) are in shade. This matches the SNES's "light from the upper left" and the sunset behind Cheryl on Moonshine Night.
- **Fill:** a cool sky light from above (blue-violet, (0.30, 0.38, 0.64)) and a weak warm bounce from below, so shaded whitewash lands near the SNES `white_shade` (#c0c0d0) rather than neutral grey, and undersides warm. Never shade toward neutral grey.
- **Soft shadows and ambient occlusion** are rendered. Each prop and character also has a separate **cast shadow frame** (`<name>.shadow`, a translucent violet-black at 8 alpha levels), so shadows fall across neighboring tiles. **Draw in three passes:** floors and wall faces, then every cast shadow, then props and people back to front. (Drawing each shadow just before its own sprite let later floor tiles paint over it.) Pieces of a wall run (parapets, the low wall) render their shadow with their neighbors in place and keep only their own share, so a run casts one continuous band.
- **Specular** only on what shines: brass, glazed pots, enamel, glass, water, polished wood.
- **Time of day is a wash,** as in the SNES version: the art is rendered once in neutral late-afternoon light, and `game/assets/iso/tints.js` (`ISO_TINTS`) turns it to dusk, night, dawn, or day. Dusk is lighter than the SNES dusk (50% rose-amber and 26% violet, both multiply) because the renders already carry real shading. Characters should take the wash at about half strength.

## Palette

- **16-bit color, quantized with a 4×4 ordered dither** in every sprite and picture.
- **Colors come from the SNES palette's families** (`game/src/art/palette.js`): whitewash, cobalt and sage shutters, terracotta, stone, the cast's clothes, the UI navy and warm brown, and the dusk-sky colors. The renderer's light supplies the shading, so a material is one base color (or a small set for variety), not a ramp.
- **Keep big surfaces low in saturation** (whitewash, stone, paving) so the accents (shutters, geraniums, terracotta, clothes) and the characters carry the color.
- **The Wrongness keeps its reserved colors** (`wrong_*`): only frames whose names contain `wrong` may use them, as in the SNES rules.
- **No fixed 256-color palette per scene.** Many games of the era ran in high color; a fixed palette would fight the runtime tints and the smooth light, and the ordered dither already gives the period grain. (Considered and not taken; revisit if a scene needs the harder look.)

## The pre-rendered feel, in practice

- **Supersampled renders, hard edges.** Every pixel is rendered at 3×3 (4×4 for icons) and averaged; a pixel is drawn if at least half of it is covered.
- **Characters and props get a soft rim:** the silhouette's edge pixels are darkened 45% toward ink (`#241a2e`), and a pixel just behind a nearer part (an arm across the body) is darkened 30%. This is the SNES "ink outline" translated into a rendered idiom: it keeps figures readable on pale paving without the hard black line.
- **Architecture and ground have no rim.** Shapes separate by light, as in the SNES version.
- **Texture is gentle and procedural, and walls are weathered** the way a 90s texture map would carry it: broad patches of newer plaster, rain streaks running down, a damp darker band at the foot, a stain under each window sill, a drip line under eaves and pent roofs, soot at the top of chimneys. All low contrast. No noise "soup": a surface reads first as its base color and its light.

## The three looks

### The surface

Warm, bright, rounded, and lived in. Whitewash with soft, uneven plaster; plinths a shade warmer at the foot of each wall; arched window and door openings set into the wall's depth, with stone sills; shutters folded open (the Pelletiers', who are away, are closed); geraniums in window boxes and pots; terracotta pent roofs; cobbles of warm limestone; roof terraces in whitewashed slabs bordered by parapets with rounded coping. A walkable roof keeps the SNES's four steps: the slabs a step darker than whitewash (`white_dim`), the coping brightest, the parapet faces cooler, and a cast shadow at the parapet's foot. Doorsteps carry three blue glass **moon-eyes**, as in the story bible.

### Interiors

Rooms use the same light from the screen's left as the streets (the SNES rule for interiors), and the same cutaway the era used: the two walls away from the camera (north and west) show their inner faces at full height; the two nearest the camera (south and east) are cut down to a 16 px stub, with a dark warm-grey section (`wall_cap`) on top of every cut wall, so the player always sees the whole floor. Cheryl's flat (`flat`) is whitewash over a cobalt-painted dado with a wooden skirting, on square terracotta floor tiles; the window on the north wall glows with the evening outside. Doors in a cut wall are a threshold between two jamb stubs. Furniture is modeled at real size and takes the prop rim; things that change in the story have a frame per state (the counter with and without the pepper mill or the egg timer, the table with the moon chart or a clean rectangle in the crumbs, the washstand with and without the soap). The photograph on the side table lies face down, its plain back showing, in every state.

### The underground (direction for future sheets)

The Founders' work is the opposite of the town: straight, precise, and dark. In the iso view that means fitted slate-dark hullstone blocks with hairline joints, 45° chamfers instead of arches, floors of large square plates, ribs crossing the corridors, verdigris bronze. **The sun key light is off underground:** scenes are lit by local point lights at the relic glows (`relic_cyan` moonglass, `relic_amber` machinery), with no sky fill, so pools of light fall on the plates and the rest stays near black. Surface colors stay out, so a fallen terracotta tile down there means something. The renderer will need point lights for this; it's the next pipeline addition when the underground is drawn.

### The Wrongness

An error in the world, not a monster. It uses only the reserved `wrong_*` colors, ignores the light (rendered emissive, no shading, no shadow), crosses joints and seams, misregisters by a pixel between frames, and pulses with uneven timings (500/120/260 ms). The first example is the tub's drain vortex (`tub_whirl_wrong_*`, `tub_sit_whirl_wrong_*`).

## Same city, same people

- **Cheryl:** upright: head over her shoulders, neck vertical, chin level, chest a touch proud (the client rejected a Cheryl who read older; the first iso pass had her head jutting forward). Ash hair with silver *streaks* (about a fifth of it), not silver all over, in a bun with a coral tie that shows from the side and back. A coral knit cardigan over a cream blouse that shows only as a narrow, shaded V below bare skin at the throat, with two small collar points (a wide white V read as a beard at 1×); a navy mid-calf skirt whose hem trails her stride by a quarter step, brown shoes, a leather satchel on her right hip with its strap across her chest. Upright and brisk: an 8-frame walk with a modest stride and a slight forward lean. Her bathing costume: navy and cream stripes, knee-length, bare arms, a navy cap with a cream band over the bun.
- **Faces at 66 px:** Cheryl's eyes are single pixels of dark warm brown (`#4a2c24`), at eye height under the brow; a 2×2 near-black eye read as an open mouth.
- **More on faces:** heads are drawn about 20% larger than life, and features (eyes, brows, a mouth line, a warm cheek) are painted about 30% larger than life (`featureScale`), so a face reads as a face at 1× when a character faces the camera. Hair stops well back from the brow.
- **The opening's residents** keep their SNES colors and silhouettes: the Old Man's flat cap, white mustache, sage jacket, and grey trousers; Her Next Door's sky-blue knotted headscarf, rose dress, and white apron; the Sweaty Kid's spiky black hair, coral sweatband, white vest, and cobalt shorts.
- **The court** keeps its layout and objects (the map is shared). The dev page's composed court (`game/dev/iso-court.js`) is the art task's reference for how the pieces fit; the engine's converter and the content tasks decide the real one.
- **The interface** keeps the SNES's text logic: navy for others, warm brown for Cheryl's descriptions, the warm box with a dashed frame and italics for her thoughts, a gold speaker label, and a font grown from the SNES face.

## Interface

- **Panels** are 9-slice frames (insets in `manifest.sheets.ui.slices`): a 1 px ink line, a 4 px brass bevel lit from the upper left, an ink line, an inner shadow line, then the field with a soft vertical gradient and faint grain. Blue moon-eye studs sit at the corners of the main panels.
  - `panel_dialog` (navy): other people talking. `panel_label` (navy, small): the speaker's name in gold capitals, as a tab over the dialog panel's top-left.
  - `panel_narration` (warm brown): Cheryl's descriptions. `panel_thought` (warm brown, dashed frame, no studs): her thoughts, in italics.
  - `panel_menu` (navy): choices, with the gold crescent `choice_marker` beside the current one.
  - `panel_inventory`: the inside of Cheryl's satchel, brown leather with stitching and a brass frame; `slot` and `slot_selected` are 48×48 wells.
- **Font:** five pre-colored styles (`text`, `narr`, `thought` (italic), `label`, `dim`) in `manifest.fonts`, each glyph `[x, y, w, h, advance]` in `ui.png`, line height 22, caps 14 px. The glyphs are the SNES font grown to 4× with Scale2x twice (which rounds diagonals; corners where a stem meets a bar stay square) and averaged down to 2×, with soft edges and a 1 px drop shadow. The SNES font's character set applies (story bible, "Text conventions").
- **Item icons** are 40×40, rendered from small models in three-quarter view with a dark rim, one dominant material each.
- **The bag button** is Cheryl's satchel, rendered (`bag`, `bag_hover`, `bag_open`). **The pointer** is a cream arrow with an ink outline (`cursor_arrow`, hot spot at its tip).

## Full-screen pictures

Pictures are rendered in true perspective at 640×480 by `iso-art/lib/persp.mjs`, in layers the scene can move: a complete sky, the far scene, the foreground, and small sprites (moon, glow, halo, path, glints). The draw order and the positions the scene needs (the Gate, where the moon rises, where the basins glint) are in the sheet's manifest entry.

**The moonrise** (`moonrise`) looks east from behind the tub. At lower left, Cheryl in her costume and cap sits on the tub's rim, the rim passing under her hips and her right hand on it, the water in front of her; her ears and the nape of her neck show below the cap. To her right on the roof's long whitewashed slabs stand the two folding chairs, her cardigan folded on the nearer. Her low-backed costume shows her shoulder blades between the straps, and the bun makes a bump under the cap. The roof's slabs lead to the low wall, unbroken, with the near pin at the bottom center and the far pin on the far parapet's end directly above it, both lined up on the Gate. Beyond: the town runs ahead in rows and streets down the island's back, its west walls in the last warm light and a few lamplit windows glowing, to the Prow and its lighthouse on the headland, lantern lit. Then the Bowl, mirroring the sky and the Gate's V in long streaks. Then the Rim: rose alpenglow on its upper cliffs, ledges where the beds step back, scree fans at the foot, a pale wet line at the shore, the air graying it with distance. The Gate is a deep V at screen center. The sky follows the story bible: no sunset glow in the east, the blue-grey Earth's shadow along the Rim, the Belt of Venus as a soft rose band just above it, blue, then indigo with only the brightest few stars. The moon rises from behind the Rim right of the Gate, peach-gold with a cool silver halo, and climbs up and to the right; its path is a column of thin horizontal glints, and because the town is its own layer drawn over the path, the glints show only on the water.

## Do and don't

- **Do** check every new piece at 1× in the composed court and under `tint=dusk` and `tint=night`.
- **Do** model the real thing at its real size (a tub is 1.7 m long and stands on claw feet; a window is half a meter wide) and let the projection decide the pixels.
- **Do** give every prop and character a cast shadow frame, and keep cast shadows inside a tile or two.
- **Do** keep characters the most saturated, highest-contrast things on screen.
- **Don't** light anything from the right on the surface, or add a second key light.
- **Don't** add soft alpha edges to sprites; only shadows and glows are translucent.
- **Don't** outline architecture, or use pure black or pure white.
- **Don't** use `wrong_*` colors outside the Wrongness.
- **Don't** imitate a particular game's interface, characters, or art; don't use downloaded models, textures, or fonts.

## The pipeline

All isometric art is made by code in `iso-art/` and rendered to PNG atlases plus `game/assets/iso/manifest.js`. Node only; no dependencies beyond the dev-only Playwright (for screenshots).

- **Modeling: signed distance fields** (`iso-art/lib/sdf.mjs`). A model is a tree of primitives (boxes, spheres, capsules, cones, cylinders, tori, heightfields) combined by union, smooth union, subtraction, and intersection, placed with transforms. Materials (`iso-art/models/materials.mjs`) are functions of position that return a base color, with specular and emission. SDFs suit this city: rounded plaster, domes, claw feet, and cloth are easy, soft shadows and occlusion are cheap, and a model is a short, reviewable text file.
- **Rendering:** `iso-art/lib/render.mjs` raymarches each sprite in the exact iso projection, with the key light, sky fill, bounce, soft shadows, occlusion, and specular, at 3×3 supersampling. `iso-art/lib/post.mjs` turns renders into color-keyed 16-bit images with the rim and crease lines, and the cast-shadow layer. `iso-art/lib/persp.mjs` renders perspective pictures with a mirror-water plane.
- **Models:** `figure.mjs` (a posable person: legs, skirt or trousers or shorts, torso, arms, head with eyes and brows), `cheryl.mjs`, `npcs.mjs`, `ground.mjs` (cobbles, roof slabs), `arch.mjs` (wall pieces, windows, doors, gate, parapets, stairs, roofs), `props.mjs` (the court's furniture), `items.mjs` (icons and the satchel), `vista.mjs` (the moonrise scene).
- **Sheets:** each module in `iso-art/sheets/` lists its frames as jobs; `iso-art/build.mjs` renders them on worker threads, packs atlases, and writes the manifest.
- **Manifest:** `export default { tile: { w: 64, h: 32, zPx: 40 }, sheets, fonts }`. A sheet is `{ image, frames, anims?, … }`; a frame is `[x, y, w, h, anchorX, anchorY, footprintW?, footprintD?, heightPx?]`. The anchor is the pixel that lands on the projection of the object's footprint center at its base height (a character's feet). `anims.<name> = { frames, ms }`, with `ms` a number or one value per frame. Directions in frame names are grid directions (`down` = south, which is screen down-left).
- **Characters:** `<dir>_0` stands; `<dir>_1`…`<dir>_8` walk (`anims.walk_<dir>`); poses are `<pose>_<dir>[_n]`.
- **Walls** are pieces of one tile's face: a frame named `…_s_…` is a south face (left half of the column), `…_e_…` an east face (right half), each with its own height (96 px storeys, 40 px courses, 24 px courses). Stack them from the column's base; draw the floor tile on top. Columns drawn back to front hide each other's inner faces.

### Adding art

Add or change a model in `iso-art/models/`, list its frames in a sheet in `iso-art/sheets/`, run `npm run art:iso -- <sheet>`, and look at it on the dev page at 1× in the composed court. Commit the models, the sheet, the PNG, and the manifest together.

## Sheets

| Sheet | What's in it |
| --- | --- |
| `cheryl` | stand, 8-frame walk, blink, and reach in four directions |
| `cheryl_swim` | Cheryl in her bathing costume: stand and walk |
| `old_man_seated` | thinking and reaching, turning the pepper mill, sneezing, talking (seated, facing east) |
| `neighbor` | stand and walk; smoothing a sheet, admiring it, reaching up to the line |
| `sweaty_kid` | stand, 8-frame run, jog in place, hop, arms up |
| `cistern` | Cistern Court: cobbles, roof slabs, facade storeys (blue, green, the Pelletiers' ochre with the gate), upper storeys, courses, retaining wall, the Crown's walls and higher houses, parapets and the low wall with the pins, the stair, pent roofs, chimney, herbs, chairs, tap, the tub in every state (and with Cheryl sitting on its rim), line posts and sheets (N–S and the back line, white and grey, flapping and swung), the lemon tree, the chess table (plug, pepper, slid), stool, Gerald's chair, the well, hurdle and pots, geraniums, bench, piano, the houses below the court (flat roofs with their Moonshine basins, hipped terracotta roofs, taller ones flanking the Squeeze), the stair and its scraped morning version |
| `flat` | Cheryl's flat: terracotta floor, the north and west walls' inner faces (plain, window, clock, kitchen shelf), cut wall caps and stubs (door, plug hook), counter (with and without the mill or the timer), stove, bed, side table with the photograph face down, table (with the chart, bare), chairs, wardrobe, washstand (with and without the soap), bookshelf, rug |
| `fx` | blob shadow, sweat drops, the well's breath, dust, swifts, a gull |
| `moonrise` | the moonrise picture in layers |
| `ui` | panels, slots, choice marker, pointer, bag button, item icons, fonts |

## Decisions

- **Modeling with signed distance fields and rendering with a Node raymarcher** (rather than voxels or a browser rasterizer): smooth rounded forms, cheap soft shadows and occlusion, short text models anyone can review, and no dependencies. Renders run on worker threads.
- **One key light from the screen's left (world west-southwest),** matching the SNES convention and Moonshine Night's sunset; time of day stays a runtime wash.
- **Heights at 40 px per tile edge,** close to true orthographic; Cheryl at 66 px. Proposed to the engine task; `docs/iso.md` keeps 64×32 tiles.
- **Walls as per-tile face pieces with their own heights,** stacked by the engine, so the converter can build any wall from a few kinds.
- **Color-keyed sprites with a soft dark rim on characters and props;** no rim on architecture.
- **16-bit color with ordered dither, no fixed per-scene 256-color palette** (see Palette).
- **Cistern Court's roofs stand 120 px above the court, the facades are 96 px storeys under terracotta pent roofs over rows 10–11, and the court opens to the east over a low wall,** so the near side of the court never hides the play area. This is the art task's reference composition; the engine's converter decides the real heights.
- **Cheryl on the tub's rim is drawn with the tub** (`tub_sit_*`), so the tub's near rim covers her shins correctly without special sorting. She sits knees up, shins going steeply down into the water, with a pale ring at each waterline (a level-thigh pose read as kneeling on the water). The water is dark toward the far wall, brighter toward the near rim, with glints.
- **The moonrise looks down the island's back toward the Prow** (east, as the story bible places it), so the town, the water, and the lighthouse all show beyond the low wall. The Neighbor's roof is left out of the picture so the town shows, and the far pin stands on the end pier of her parapet.
- **The moonrise has a separate `town` layer** between the moon's path and the foreground, so the path can follow the moon and still show only on the water.
- **Rooms are cut away on the camera side** (north and west walls full height, south and east cut to a stub with a dark section cap), so furniture and Cheryl are never hidden behind a wall.
- **The houses below the court are whole modeled houses** (2×2 and 3×2, flat or hipped), with the two beside the Squeeze a storey taller so the stair runs down between walls rather than standing up as a block.
- **The font is grown from the SNES font** rather than drawn anew, so both versions share a voice, and so its character set and the story bible's text conventions carry over.
