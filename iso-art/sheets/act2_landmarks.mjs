// Act 2's landmarks (docs/design/02-city.md; SNES landmarks.js, act2_objects.js,
// act2_interiors.js, chartroom.js). Models in iso-art/models/act2-landmarks.mjs.
// Anchors: the footprint's center at base height. "Fronts" are two-tile south
// faces (one 96 px storey, the face on the footprint's south edge) to stack in
// a facade like the town kit's wall pieces; the rest of each facade is the town kit.
//
// THE CROWN (content/act2/crown.js, 24×16)
//   bell_tower [6,4] h368 ...... x2–7; its south face on row 6 (footprint rows 3–6), door at x4–5 on row 6,
//                                Ambrose's slate step in front (row 7). Founders' slate base, limestone shaft,
//                                the Mayor's clock (10:11) on the south face, belfry with the bell. One piece for
//                                the SNES bell_tower_x0..5y0..6 (backdrop rows 0–2 are roofs above it).
//   blue_dome [6,6] h150 ....... the drum and dome only, on the Archive's flat roof over x15–22 (SNES blue_dome_x0..7y0..2);
//                                the plastered front (rows 3–6) is town-kit wall storeys.
//   dome_door [2,1] h96 ........ the Archive's door, x18–19 on row 6 (SNES dome_door_x0..1y0..1)
//   sundial [2,2] h52 .......... x11–12, y9–10 (SNES sundial_x0..1y0..1)
//   clockshop_front [2,1] h96 .. x10–11 on the shop's base row (6) (SNES school:clockshop_fascia_l/r over clockshop_window_l/r);
//                                its door at x12 is a town-kit door
//   clock_sign [1,1] h106 ...... on the street tile in front of the wall at x13 (SNES act2_props:clock_sign); its bracket
//                                fixes to a wall on the tile's north edge (y −0.5)
// FOUNTAIN SQUARE (content/act2/square.js, 24×18)
//   fountain_0..3 (anim fountain), fountain_low_0..3 (anim fountain_low), fountain_dry [4,4] h86
//                                x10–13, y7–10, anchor at the shared corner (world 12, 9). Each includes the
//                                bronze fish and its spout (SNES fountain_x<x>y<y>_<n> / fountain_low_… / fountain_dry_…;
//                                dry shows the hatch to the Pump Hall).
//   fish_0..3, fish_low_0..3, fish_dry [4,4] h86 ... the fish alone, cut from the same renders, same anchor as the
//                                fountain: for content that keeps the SNES `fish` entity (x11, y8). Drawn over the
//                                fountain frame it changes nothing, so either use is safe. Act 4 swaps fish_dry/fish.
//   shopfront_hat / shopfront_scope [2,1] h96 ... x6–7 on row 3 (SNES facades:shopfront_l/r @rose): the Shop's window
//                                with the straw hat, then (flag window.telescope) the Keeper's telescope
//   mayor_front [2,1] h96 ...... x19–20 on row 3: his door (x19) and the brass plaque (x20) (SNES square_props:plaque)
//   stall [2,2] h94 ............ market stalls x1–2 and x4–5, rows 12–13 (SNES over_stall_nw/ne over stall_sw/se)
//   cafe_table [1,1] h33 ....... (19, 13), (22, 13);  cafe_chair (facing south) (19, 12), (22, 12);
//   cafe_chair_back [1,1] h36 .. (19, 14), (22, 14), under the Tourist (SNES cafe_table / cafe_chair / cafe_chair_back)
//   mayor_crate [1,1] h13 ...... (8, 11); draw the Mayor 12 px up on it (SNES square_props:mayor_crate, offset −9)
// THE HUNDRED STEPS (content/act2/steps.js, 16×42). A flight tile drops 40 px to the south in 5 steps of 8 px.
//   steps_l / steps_r [1,1] h40 ............ every flight row (FLIGHTS: x6–7 y0–6, x2–3 y10–15, x9–10 y20–25, x4–5 y29–37)
//   steps_moon_l / steps_moon_r [1,1] h40 .. MOON_RISERS (6,3) (2,12) (9,22) (4,32) (4,35): a moon-eye in the third riser
//   landing_l / landing_r [1,1] h0 ......... big worn landing slabs (SNES landing_l/r; the maps' landings use town paving)
//   hollow_dry_l/_r, hollow_wet_l/_r_0..1 (anim hollow_wet_l/_r), hollow_open_l/_r [1,1] h0
//                                the hollow step at (9–10, 19), flush with landing 2: dry, wet (water in the joint,
//                                the trickle running in), open (the east half's slab gone: the shaft and its ladder).
//                                The map puts steps_l beside the open half; hollow_open_l is the dry slab.
// THE CRYPT (content/act2/archive.js, composeCrypt)
//   founders_door [2,1] h96 .... (5–6, 1–2) in the north wall: dark slate, 45° chamfers, no handle, cyan at the seams
//   founders_door_open [2,1] h96  the same once unbolted (Act 3 on; SNES chartroom founders_door_open): steps down into the dark
import { frame, split, POST } from '../lib/jobs.mjs';
import { render } from '../lib/render.mjs';
import { toImage, shadowImage, trim } from '../lib/post.mjs';
import * as A from '../models/act2-landmarks.mjs';

const PI = Math.PI;
const prop = (name, build, fp = [1, 1], h = 40, opts = {}) => frame(name, build, { post: POST.prop, shadow: true, fp, h, ...opts });
const arch = (name, build, fp, h, opts = {}) => frame(name, build, { post: POST.arch, fp, h, ...opts });
const floor = (name, build) => frame(name, build, { diamond: [1], fp: [1, 1], h: 0 });
/** A two-tile south face: keep the face (screen x < 16 from the anchor), not the column's east end. */
const front = (name, build, h = 96) => split(name, build, { [name]: (p, sx) => sx < 16 }, { fp: [2, 1], h });

/**
 * The fountain with its fish, rendered once: the whole landmark (with its cast
 * shadow, the fish's shadow falling on the water), and the fish cut out of the
 * same render as its own frame, for content that keeps the fish as an entity.
 * The fish frame lies exactly over the fountain frame's fish (same anchor).
 */
function fountainJob(name, fishName, state, t) {
  return {
    name,
    render() {
      const fr = render(A.fountain(state, { t }), { ss: 3, ground: 0 });
      const img = trim(toImage(fr, POST.prop));
      const shadow = trim(shadowImage(fr));
      const isFish = (p) => p.tag === 'fish' || p.tag === 'spout';
      const fishFr = { ...fr, px: fr.px.map((p) => (isFish(p) ? p : { ...p, a: 0 })) };
      const fishImg = trim(toImage(fishFr, { ...POST.prop, inkSkip: (p) => p.tag === 'spout' }));
      return [{ name, img, shadow, fp: [4, 4], h: 86 }, { name: fishName, img: fishImg, fp: [4, 4], h: 86 }];
    },
  };
}

export default {
  name: 'act2_landmarks',
  frames: () => {
    const out = [];
    // ---- The Crown
    out.push(arch('bell_tower', () => A.bellTower(), [6, 4], 368, { shadow: true }));
    out.push(arch('blue_dome', () => A.blueDome(), [6, 6], 150, { shadow: true }));
    out.push(front('dome_door', () => A.domeDoor()));
    out.push(prop('sundial', () => A.sundial(), [2, 2], 52));
    out.push(front('clockshop_front', () => A.clockshopFront()));
    out.push(prop('clock_sign', () => A.clockSign(), [1, 1], 106));
    // ---- Fountain Square
    for (let i = 0; i < 4; i++) out.push(fountainJob(`fountain_${i}`, `fish_${i}`, 'full', i / 4));
    for (let i = 0; i < 4; i++) out.push(fountainJob(`fountain_low_${i}`, `fish_low_${i}`, 'low', i / 4));
    out.push(fountainJob('fountain_dry', 'fish_dry', 'dry', 0));
    out.push(front('shopfront_hat', () => A.shopFront('hat')));
    out.push(front('shopfront_scope', () => A.shopFront('scope')));
    out.push(front('mayor_front', () => A.mayorFront()));
    out.push(prop('stall', () => A.marketStall(), [2, 2], 94));
    out.push(prop('cafe_table', () => A.cafeTable(), [1, 1], 33));
    out.push(prop('cafe_chair', () => A.cafeChair({ face: PI / 2 }), [1, 1], 36));
    out.push(prop('cafe_chair_back', () => A.cafeChair({ face: -PI / 2 }), [1, 1], 36));
    out.push(prop('mayor_crate', () => A.mayorCrate(), [1, 1], 13));
    // ---- The Hundred Steps
    for (const h of ['l', 'r']) {
      out.push(arch(`steps_${h}`, () => A.stepsTile(h), [1, 1], 40));
      out.push(arch(`steps_moon_${h}`, () => A.stepsTile(h, { moon: true }), [1, 1], 40));
      out.push(floor(`landing_${h}`, () => A.landingTile(h)));
      out.push(floor(`hollow_dry_${h}`, () => A.landingTile(h, { hollow: 'dry' })));
      for (let i = 0; i < 2; i++) out.push(floor(`hollow_wet_${h}_${i}`, () => A.landingTile(h, { hollow: 'wet', t: i * 0.5 })));
    }
    out.push(floor('hollow_open_l', () => A.landingTile('l', { hollow: 'dry' })));
    out.push(floor('hollow_open_r', () => A.landingTile('r', { hollow: 'open' })));
    // ---- The Founders' Door
    out.push(front('founders_door', () => A.foundersDoor()));
    out.push(front('founders_door_open', () => A.foundersDoor({ open: true })));
    return out;
  },
  anims: {
    fountain: { frames: ['fountain_0', 'fountain_1', 'fountain_2', 'fountain_3'], ms: 220 },
    fountain_low: { frames: ['fountain_low_0', 'fountain_low_1', 'fountain_low_2', 'fountain_low_3'], ms: 300 },
    fish: { frames: ['fish_0', 'fish_1', 'fish_2', 'fish_3'], ms: 220 },
    fish_low: { frames: ['fish_low_0', 'fish_low_1', 'fish_low_2', 'fish_low_3'], ms: 300 },
    hollow_wet_l: { frames: ['hollow_wet_l_0', 'hollow_wet_l_1'], ms: 300 },
    hollow_wet_r: { frames: ['hollow_wet_r_0', 'hollow_wet_r_1'], ms: 300 },
  },
};
