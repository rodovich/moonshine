// The town kit: modular pieces for Tessel's streets (Act 2 onward). Content
// assembles them with the scene helpers in game/src/content/iso-kit.js.
//
// Frame names:
//   Floors (64×32 diamonds, h 0): pave_<q>, pave2_<q> (q = nw|ne|sw|se, a 2×2 macro), pave_shade,
//     pave_crack, pave_moon_eye, pave_moon_eye_lit, cobble_0..3, yard_0..2, water_0..2 (anim water)
//   Ground storeys (96 px, with a plinth): w_<plaster>_s_<kind> on a south face, w_<plaster>_e_<kind> on an east face
//     s kinds: plain window window_box window_closed door shop arch; e kinds: plain window window_closed door
//   Upper storeys (96 px): u_<plaster>_s_<kind> (plain window window_box window_closed balcony), u_<plaster>_e_<kind> (plain window window_closed)
//   Courses (40 px): c_<plaster>_s, c_<plaster>_e; retain_s/e (ashlar), quay_s/e (wet stone at a canal)
//   plaster = white | ochre | rose | sky | sage (the SNES swaps; each wears its own shutters)
//   Roofs: roof_<plaster> (a flat roof's top, 64×32), lip_x, lip_y (its edge), hip_<w>x<d> (terracotta, w and d 1–6; base at the walls' top)
//   Domes: dome_1x1, dome_2x2
//   Stairs (40 px drop across a tile): stairs_down, stairs_up, stairs_right, stairs_left (named by the way they descend)
//   Props: lamp, lamp_lit, bench (2×1), pot_geranium, pot_bay, crate, barrel, awning_<coral|blue|green>,
//     sign_<blue|green|coral>, railing_x, railing_y, laundry_3, laundry_4, bridge_y (2×4), mooring_post
import { frame, split, POST } from '../lib/jobs.mjs';
import { move, place, union } from '../lib/sdf.mjs';
import { cobbles } from '../models/ground.mjs';
import { facade, retainingWall, stairFlight, U } from '../models/arch.mjs';
import * as T from '../models/town.mjs';
import { bench, pot } from '../models/props.mjs';

const PI = Math.PI;
const STOREY = U(96);
const left = (p, sx) => sx < 0;
const right = (p, sx) => sx >= 0;
const floor = (name, build) => frame(name, build, { diamond: [1], fp: [1, 1], h: 0 });
const prop = (name, build, fp = [1, 1], h = 40, opts = {}) => frame(name, build, { post: POST.prop, shadow: true, fp, h, ...opts });
const arch = (name, build, fp = [1, 1], h = 40) => frame(name, build, { post: POST.arch, shadow: false, fp, h });

const S_KINDS = ['window', 'window_box', 'window_closed', 'door', 'shop', 'arch'];
const E_KINDS = ['window', 'window_closed', 'door'];
const U_S = ['window', 'window_box', 'window_closed', 'balcony'];
const U_E = ['window', 'window_closed'];

function feature(kind, P) {
  if (kind === 'shop') return T.shopFeature({ color: P.shutters });
  if (kind === 'arch') return T.archFeature();
  if (kind === 'balcony') return T.balconyFeature();
  return null;
}
const piece = (name, face, h, kind, P, plinth) => split(name, () => facade(face, h, ['shop', 'arch', 'balcony'].includes(kind) ? 'custom' : kind, {
  color: P.shutters, wall: P.wall, plinth, feature: feature(kind, P), ...(plinth ? {} : { z0: 0.7, z1: 1.85 }),
}), { [name]: face === 's' ? left : right }, { trimTop: true, fp: [1, 1], h: Math.round(h * 40) });

export default {
  name: 'town',
  frames: () => {
    const out = [];
    // ---- Floors
    for (const q of ['nw', 'ne', 'sw', 'se']) {
      out.push(floor(`pave_${q}`, () => T.flagstones({ q })));
      out.push(floor(`pave2_${q}`, () => T.flagstones({ q, variant: 'b' })));
    }
    out.push(floor('pave_shade', () => T.flagstones({ q: 'nw', variant: 'shade' })));
    out.push(floor('pave_crack', () => T.flagstones({ q: 'se', variant: 'crack' })));
    // The moon-eyes set in the Crown's paving (CROWN_MOON_EYES); lit from Act 3 at dusk.
    out.push(floor('pave_moon_eye', () => T.moonEyeStone()), floor('pave_moon_eye_lit', () => T.moonEyeStone({ lit: true })));
    for (let s = 0; s < 4; s++) out.push(floor(`cobble_${s}`, () => cobbles({ seed: s })));
    for (let s = 0; s < 3; s++) out.push(floor(`yard_${s}`, () => T.yard({ seed: s })));
    for (let i = 0; i < 3; i++) out.push(floor(`water_${i}`, () => T.water({ t: i / 3 })));

    // ---- Walls in each plaster
    for (const [name, P] of Object.entries(T.PLASTERS)) {
      out.push(split(`w_${name}_plain`, () => facade('s', STOREY, 'plain', { wall: P.wall }), { [`w_${name}_s_plain`]: left, [`w_${name}_e_plain`]: right }, { trimTop: true, fp: [1, 1], h: 96 }));
      for (const k of S_KINDS) out.push(piece(`w_${name}_s_${k}`, 's', STOREY, k, P, 0.2));
      for (const k of E_KINDS) out.push(piece(`w_${name}_e_${k}`, 'e', STOREY, k, P, 0.2));
      out.push(split(`u_${name}_plain`, () => facade('s', STOREY, 'plain', { wall: P.wall, plinth: 0 }), { [`u_${name}_s_plain`]: left, [`u_${name}_e_plain`]: right }, { trimTop: true, fp: [1, 1], h: 96 }));
      for (const k of U_S) out.push(piece(`u_${name}_s_${k}`, 's', STOREY, k, P, 0));
      for (const k of U_E) out.push(piece(`u_${name}_e_${k}`, 'e', STOREY, k, P, 0));
      out.push(split(`c_${name}`, () => facade('s', 1, 'plain', { wall: P.wall, plinth: 0 }), { [`c_${name}_s`]: left, [`c_${name}_e`]: right }, { trimTop: true, fp: [1, 1], h: 40 }));
      out.push(floor(`roof_${name}`, () => T.roofTopFor(P.wall)));
    }
    out.push(split('retain', () => retainingWall(1), { retain_s: left, retain_e: right }, { trimTop: true, fp: [1, 1], h: 40 }));
    out.push(split('quay', () => T.quayWall(1), { quay_s: left, quay_e: right }, { trimTop: true, fp: [1, 1], h: 40 }));

    // ---- Roofs and domes
    out.push(arch('lip_x', () => T.roofLip('x'), [1, 1], 9), arch('lip_y', () => T.roofLip('y'), [1, 1], 9));
    for (let w = 1; w <= 6; w++) for (let d = 1; d <= 6; d++) out.push(arch(`hip_${w}x${d}`, () => T.hipRoof(w, d, { seed: w * 3 + d }), [w, d], 22));
    out.push(prop('dome_1x1', () => T.dome(0.42, { drum: 0.25 }), [1, 1], 30));
    out.push(prop('dome_2x2', () => T.dome(0.9), [2, 2], 56));

    // ---- Stairs, descending one 40 px step-run across the tile, in each direction
    const flight = () => move(stairFlight(1, { below: 0 }), 0, 0, 1);
    out.push(arch('stairs_down', () => flight(), [1, 1], 40));
    out.push(arch('stairs_up', () => place(flight(), { rz: PI }), [1, 1], 40));
    out.push(arch('stairs_left', () => place(flight(), { rz: PI / 2 }), [1, 1], 40));
    out.push(arch('stairs_right', () => place(flight(), { rz: -PI / 2 }), [1, 1], 40));

    // ---- Street furniture
    out.push(prop('lamp', () => T.streetLamp(), [1, 1], 110), prop('lamp_lit', () => T.streetLamp({ lit: true }), [1, 1], 110));
    out.push(prop('bench', () => bench(), [2, 1], 18));
    out.push(prop('pot_geranium', () => pot({ plant: 'geranium', r: 0.2, h: 0.34, seed: 31 }), [1, 1], 24));
    out.push(prop('pot_bay', () => T.bayPot(), [1, 1], 50));
    out.push(prop('crate', () => T.crate(), [1, 1], 20), prop('barrel', () => T.barrel(), [1, 1], 32));
    for (const [n, c] of [['coral', '#d05848'], ['blue', '#3a6cc0'], ['green', '#5e8a58']]) {
      out.push(prop(`awning_${n}`, () => T.awning(c), [1, 1], 100, { shadow: true }));
      out.push(prop(`sign_${n}`, () => T.hangingSign(c), [1, 1], 96));
    }
    out.push(prop('railing_x', () => T.railing('x'), [1, 1], 36), prop('railing_y', () => T.railing('y'), [1, 1], 36));
    out.push(prop('laundry_3', () => T.laundryLine(3, { seed: 3 }), [3, 1], 130, { shadow: false }));
    out.push(prop('laundry_4', () => T.laundryLine(4, { seed: 4 }), [4, 1], 130, { shadow: false }));
    out.push(prop('bridge_y', () => T.bridge(), [2, 4], 54));
    out.push(prop('mooring_post', () => T.mooringPost(), [1, 1], 26));
    return out;
  },
  anims: { water: { frames: ['water_0', 'water_1', 'water_2'], ms: 300 } },
};
void union;
