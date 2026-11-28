// Act 2's Harbor, lighthouse, Bilge, and Goat Path (docs/design/02-city.md;
// SNES index docs/art-act2b.md). Models in iso-art/models/act2-harbor.mjs.
// Anchors are at the footprint's center at base height (boats: the waterline;
// the Water Stairs: quay level, the steps going down below it).
//
// THE HARBOR (content/act2/harbor.js, 32×14)
//   bollard [1,1] h22 ............ (13, 8)                     harbor_props:bollard
//   bollard_rope [1,1] h22 ....... (8, 8), (18, 8); the line runs off the tile's south edge to the water
//                                                              harbor_props:bollard_rope
//   crates_pair [2,1] h40 ........ two crates and one on top, for (7–8, 4) (props:crate ×2; a single crate is town:crate)
//   nets [1,1] h52 ............... (20, 4)                     harbor_props:nets
//   sign_bilge [3,1] h52 ......... centered on (2, 4) (spans 1–3); '< THE BILGE'   signpost:bilge_0/1/2
//   persistence_0/1 [10,3] h168 .. Mott's ferry alongside the quay, waterline z=0, centered at world (13, 10.6)
//                                  (map object 10–15, 9–11; SNES ferry_level:persistence_level). Anim: bob.
//   keyhole_0..3 [2,1] h40 (anim keyhole) ... the quay face at (30–31, 9) in place of its quay_s course, from sea level:
//                                  the hole worn through the rock, the sea breathing in and out (foam spills at the top)
//   culvert_0..2 [2,1] h40 (anim culvert) ... the quay face at (1–2, 9) in place of quay_s: the canal's arch, its water
//                                  sliding out and down into the sea
//   outflow_0..2 [2,1] h0 (anim outflow) ... the sea at (1–2, 10) in place of town:water: the canal's water fanning out
//   (For all three: add at the two tiles' west tile with fw 2, z = the sea's height; keep the pave tops and lips.)
//   lighthouse [4,4] h390 ........ (26–29, 0–3), center at world (28, 2); its door faces south onto (27–28, 3)
//                                  (lighthouse:lighthouse_x<x>y<y>, rows 0–3 as one piece)
// THE BILGE (content/act2/bilge.js, 32×16)
//   fish_stall, fish_stall_blue, fish_stall_green [2,2] h96 ... stalls at x 2–3, 5–6, 8–9, rows 4–5 (center at
//                                  world (x0+1, 5)); the awning is part of the piece (SNES over_stall_l/r on row 4
//                                  over stall_l/r on row 5; palettes '', '@blue', '@green' in that order)
//   (mooring posts at (10, 6), (17, 6), (28, 6): use the town kit's town:mooring_post)   canal:mooring_post
//   rowboat [2,1] h20 ............ the Boatman's boat, waterline z=0, centered at world (15, 9.5) (boat at 14–15, 9;
//                                  the Boatman himself is a character drawn into it; SNES boatman:rock had the boat)
//   canal_boat_blue, canal_boat_green [2,1] h22 ... moored on the canal (rows 8–9) wherever the scene wants
//   wstairs_top [4,1] h0 ......... (22–25, 6): quay level at the anchor, the steps drop 18 px across it
//                                  (reveal:wstairs_top_l/m/m/r)
//   wstairs_wet_0..3 [4,1] h0 .... (22–25, 7): from 18 px below the quay on down under the canal water
//                                  (24 px below the quay), the lower steps seen through it (bilge_flood:wstairs_wet_*)
//   flood_0..2 [1,1] h0 (anim flood) ... the south quay's west end under ankle-deep water (x0–5, rows 11–12): paving
//                                  seen through it, ripples drifting (SNES bilge_flood:flood1_*)
//   flood_edge_e_0..2 [1,1] h0 (anim flood_edge_e) ... the tile east of the flood (x6): the water lapping in over its
//                                  west part, a foam line, wet stone beyond (bilge_flood:flood1_lap_w)
//   sign_harbor [3,1] h52 ........ centered on (30, 10) (spans 29–31); 'HARBOR >'   signpost:harbor_0/1/2
// THE GOAT PATH (content/act2/goat_path.js, 16×42; the SNES painted it as one picture, GOAT_PATH_TILES)
//   path_a, path_b, path_c [1,1] h0 ... floor diamonds: the path's '.' cells (c: hoof-scuffed)
//   rock_shelf [1,1] h0 .......... bare limestone (the viewpoint ledge 1, 21–22; shelves beside the path)
//   path_steps [1,1] h40 ......... the 's' cells (STEPS rectangles: 2–3,4–7; 2–3,18–21; …), down south one tile
//   cliff_s, cliff_e [1,1] h40 ... one 40 px course of rock face under a shelf's edge: south face, east face (seamless along a face and up a stack);
//                                  stack like wall courses (the '#' rock cells)
//   rock_a [1,1] h26, rock_b [2,1] h28 ... lichened outcrops the path goes round (e.g. 12–13, 9; 3–12, 29)
//   gorse_a, gorse_b [1,1] h22, thyme [1,1] h8 ... on rock and earth cells off the path
//   rail_post, rail_x, rail_y [1,1] h38 ... post-and-rope rail: down the west side of the steps (2, 18–21: rail_y)
//                                  and round the viewpoint ledge
//   mott_shack_0/1 [4,4] h118 .... (2–5, 12–15), center at world (4, 14); door on (3, 15), window on (4, 15);
//                                  frames 0/1 are the still's coil glinting (SNES shack_x1y2/x2y2 _0/_1, 1600/400 ms)
//   jugs [2,1] h34 ............... (7–8, 14)                   mott_jugs:jugs_l/jugs_r
//   sea_cave_0..3 [1,1] h60 ...... (1, 37): the tide running in; frames 1–2 show the brass glint (goatpath:cave_mouth)
//   (The goats are characters: the `goat` and `goat_brown` sheets.)

import { frame, split, POST } from '../lib/jobs.mjs';
import { place, move, union } from '../lib/sdf.mjs';
import * as H from '../models/act2-harbor.mjs';

const PI = Math.PI;
const prop = (name, build, fp = [1, 1], h = 40, opts = {}) => frame(name, build, { post: POST.prop, shadow: true, fp, h, ...opts });
const arch = (name, build, fp = [1, 1], h = 40, opts = {}) => frame(name, build, { post: POST.arch, fp, h, ...opts });
const floor = (name, build) => frame(name, build, { diamond: [1], fp: [1, 1], h: 0 });
const DIRS = { right: 0, down: PI / 2, left: PI, up: -PI / 2 };

export default {
  name: 'act2_harbor',
  frames: () => {
    const out = [];
    // ---- The Harbor
    out.push(prop('bollard', () => H.bollard(), [1, 1], 22));
    out.push(prop('bollard_rope', () => H.bollard({ rope: true }), [1, 1], 22));
    // A single crate is the town kit's `town:crate`; this is the harbor's stacked pair.
    out.push(prop('crates_pair', () => H.cratesPair(), [2, 1], 40));
    out.push(prop('nets', () => H.nets(), [1, 1], 52));
    out.push(prop('sign_bilge', () => H.signBoard('< THE BILGE'), [3, 1], 52));
    out.push(prop('sign_harbor', () => H.signBoard('HARBOR >'), [3, 1], 52));
    for (let i = 0; i < 2; i++) out.push(prop(`persistence_${i}`, () => H.persistence({ t: i * 0.5 }), [10, 3], 168));
    out.push(prop('lighthouse', () => H.lighthouse(), [4, 4], 390));
    // The Keyhole and the culvert: two-tile quay faces (keep the south face: screen x left of +16),
    // and the culvert's outflow on the sea below it.
    const face2 = (name, build) => split(name, build, { [name]: (p, sx) => sx < 17 }, { fp: [2, 1], h: 40 });
    for (let i = 0; i < 4; i++) out.push(face2(`keyhole_${i}`, () => H.keyhole({ t: i / 4 })));
    for (let i = 0; i < 3; i++) out.push(face2(`culvert_${i}`, () => H.culvert({ t: i / 3 })));
    for (let i = 0; i < 3; i++) out.push(arch(`outflow_${i}`, () => H.outflow({ t: i / 3 }), [2, 1], 0));
    // ---- The Bilge
    for (const [n, c] of [['fish_stall', '#d05848'], ['fish_stall_blue', '#3870c8'], ['fish_stall_green', '#78a870']]) out.push(prop(n, () => H.fishStall({ stripe: c }), [2, 2], 96));
    // The Bilge's mooring posts are the town kit's `town:mooring_post`.
    // The south quay's west end under an ankle-deep flood, and its lapping east edge.
    for (let i = 0; i < 3; i++) out.push(floor(`flood_${i}`, () => H.shallowFlood({ t: i / 3 })), floor(`flood_edge_e_${i}`, () => H.shallowFlood({ t: i / 3, edge: 'e' })));
    out.push(prop('rowboat', () => H.rowboat(), [2, 1], 20));
    out.push(prop('canal_boat_blue', () => H.canalBoat({ side: '#3870c8', band: '#f0e8d0' }), [2, 1], 22));
    out.push(prop('canal_boat_green', () => H.canalBoat({ side: '#5a8a58', band: '#e8b868', cover: '#b8a888' }), [2, 1], 22));
    out.push(arch('wstairs_top', () => H.waterStairs('top'), [4, 1], 0));
    for (let i = 0; i < 4; i++) out.push(arch(`wstairs_wet_${i}`, () => H.waterStairs('wet', { t: i / 4 }), [4, 1], 0));
    // ---- The Goat Path
    for (const v of ['a', 'b', 'c']) out.push(floor(`path_${v}`, () => H.pathEarth({ variant: v })));
    out.push(floor('rock_shelf', () => H.rockShelf()));
    out.push(arch('path_steps', () => H.pathSteps(), [1, 1], 40));
    // The faces stand 0.08 in from the tile's edge (room for their roughness), so each reaches
    // about 2.6 px past the anchor's screen x: cut at 3 px, or neighbors leave a gap between them.
    out.push(split('cliff_s', () => H.cliffFace({ face: 's' }), { cliff_s: (p, sx) => sx < 3 }, { fp: [1, 1], h: 40 }));
    out.push(split('cliff_e', () => H.cliffFace({ face: 'e' }), { cliff_e: (p, sx) => sx >= -3 }, { fp: [1, 1], h: 40 }));
    out.push(prop('rock_a', () => H.rockOutcrop('a'), [1, 1], 26));
    out.push(prop('rock_b', () => H.rockOutcrop('b'), [2, 1], 28));
    out.push(prop('gorse_a', () => H.bush('gorse', 1), [1, 1], 22));
    out.push(prop('gorse_b', () => H.bush('gorse', 4), [1, 1], 22));
    out.push(prop('thyme', () => H.bush('thyme', 2), [1, 1], 8));
    out.push(prop('rail_post', () => H.rail(), [1, 1], 38));
    out.push(prop('rail_x', () => H.rail('x'), [1, 1], 38));
    out.push(prop('rail_y', () => H.rail('y'), [1, 1], 38));
    for (let i = 0; i < 2; i++) out.push(prop(`mott_shack_${i}`, () => H.mottShack({ glint: i * 0.5 }), [4, 4], 118));
    out.push(prop('jugs', () => H.jugs(), [2, 1], 34));
    for (let i = 0; i < 4; i++) out.push(arch(`sea_cave_${i}`, () => H.seaCave({ t: i / 4, glint: i === 1 || i === 2 }), [1, 1], 60));
    // (The goats are characters, in the `goat` and `goat_brown` sheets.)
    return out;
  },
  anims: (() => {
    const a = {
      persistence: { frames: ['persistence_0', 'persistence_1'], ms: 900 },
      wstairs_wet: { frames: [0, 1, 2, 3].map((i) => `wstairs_wet_${i}`), ms: 280 },
      mott_shack: { frames: ['mott_shack_0', 'mott_shack_1'], ms: [1600, 400] },
      sea_cave: { frames: [0, 1, 2, 3].map((i) => `sea_cave_${i}`), ms: 300 },
      keyhole: { frames: [0, 1, 2, 3].map((i) => `keyhole_${i}`), ms: [700, 500, 300, 600] },
      culvert: { frames: [0, 1, 2].map((i) => `culvert_${i}`), ms: 160 },
      outflow: { frames: [0, 1, 2].map((i) => `outflow_${i}`), ms: 300 },
      flood: { frames: [0, 1, 2].map((i) => `flood_${i}`), ms: 380 },
      flood_edge_e: { frames: [0, 1, 2].map((i) => `flood_edge_e_${i}`), ms: 380 },
    };
    return a;
  })(),
};
void move; void union; void place; void DIRS;
