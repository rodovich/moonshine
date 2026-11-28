// Cistern Court: ground, walls, roof terraces, and props for the opening
// (docs/design/01-opening.md, "Art needed"). Frame names and footprints are
// listed in docs/iso-art-direction.md.

import { frame, split, sliceX, POST } from '../lib/jobs.mjs';
import { union, move, place, boxAt, torus } from '../lib/sdf.mjs';
import { cobbles, deck } from '../models/ground.mjs';
import { facade, parapet, parapetPier, stairFlight, retainingWall, lowRoof, roofTop, crownWall, lowHouse, COLORS, U } from '../models/arch.mjs';
import { sightPin } from '../models/props.mjs';
import * as P from '../models/props.mjs';
import { TUB } from '../models/props.mjs';
import { mat } from '../lib/render.mjs';
import { figure } from '../models/figure.mjs';
import { cherylLook } from '../models/cheryl.mjs';

const PI = Math.PI;
const STOREY = U(96); // the court's facades: 96 px to the eaves
const left = (p, sx) => sx < 0;
const right = (p, sx) => sx >= 0;

/** A wall piece rendered with its feature on the south face (kept: left half) or east face (right half). */
function wallPiece(name, face, h, kind, opts) {
  return split(name, () => facade(face, h, kind, opts), { [name]: face === 's' ? left : right }, { fp: [1, 1], h: Math.round(h * 40) });
}

const floor = (name, build) => frame(name, build, { diamond: [1], fp: [1, 1], h: 0 });
const prop = (name, build, fp = [1, 1], h = 40, opts = {}) => frame(name, build, { post: POST.prop, shadow: true, fp, h, ...opts });

function tubSitting(state, t) {
  // Cheryl in her costume on the tub's west rim, facing east: thighs level over
  // the rim, shins straight down into the water, a pale ring at each waterline.
  // Knees up, as you sit on a bath's edge: thighs rising a little, shins going
  // steeply down into the water a hand's width in from the rim.
  const water = TUB.z1 - 0.07, hipZ = 0.75, a = PI / 2 + 0.35, back = -0.1;
  const pose = { bob: hipZ - 0.86, hipL: a, hipR: a - 0.06, kneeL: a - back, kneeR: a - 0.06 - back + 0.05, shL: 0.25, elL: 0.6, outL: 0.35, shR: 0.25, elR: 0.6, outR: 0.35, lean: 0.06, nod: -0.06 };
  const x0 = -0.74;
  const her = move(figure(cherylLook({ swim: true }), pose), x0, 0, 0);
  const parts = [P.tub(state, { t }), her];
  if (state !== 'empty' && state !== 'whirl') {
    // Where each shin meets the water (the figure's own leg geometry: thigh 0.42, shin 0.4).
    const kx = Math.sin(a) * 0.42, kz = hipZ - Math.cos(a) * 0.42;
    const tw = (kz - water) / Math.cos(back);
    const wx = kx + Math.sin(back) * tw;
    const ring = mat('#e8f4f8', { tag: 'prop', spec: 1, emit: 0.3 });
    for (const y of [-0.085, 0.085]) parts.push(move(torus(0.07, 0.012, ring), x0 + wx, y, water + 0.004));
  }
  return union(parts);
}


// Parapet runs: each piece casts its shadow with its neighbors in place and keeps
// only its own share (traced back along the light to the wall's line), so a run's
// shadow is one continuous band. The light falls 0.75 east and 0.55 north per unit of height.
function runShadow(dir, build) {
  const run = union([-2, -1, 0, 1, 2].map((k) => (dir === 'x' ? move(build(), k, 0, 0) : move(build(), 0, k, 0))));
  const clip = dir === 'x'
    ? (gx, gy) => Math.abs(gx + (0.75 * gy) / 0.55) < 0.5
    : (gx, gy) => Math.abs(gy + (0.55 * gx) / 0.75) < 0.5;
  return { shadowScene: run, shadowClip: clip };
}
const runProp = (name, dir, build, h) => frame(name, build, { post: POST.arch, shadow: true, fp: [1, 1], h, render: runShadow(dir, () => parapet(dir, dir === 'y' && h < 30 ? 0.55 : 0.9, h < 30 ? { thick: 0.28 } : {})) });

export default {
  name: 'cistern',
  frames: () => {
    const out = [];
    // ---- Ground
    for (let s = 0; s < 4; s++) out.push(floor(`cobble_${s}`, () => cobbles({ seed: s })));
    out.push(floor('cobble_drain', () => cobbles({ seed: 5, grate: true })));
    for (const q of ['nw', 'ne', 'sw', 'se']) out.push(floor(`deck_${q}`, () => deck({ q })));
    out.push(floor('deck_crack', () => deck({ q: 'sw', variant: 'crack' })));
    out.push(floor('deck_patch', () => deck({ q: 'ne', variant: 'patch' })));
    out.push(floor('roof_top', () => roofTop()));

    // ---- Facades (96 px storeys): Cheryl's (blue shutters, blue door) and Her Next Door's (green)
    for (const [suffix, color] of [['blue', COLORS.cobalt], ['green', COLORS.sage]]) {
      for (const kind of ['window', 'window_box', 'door']) out.push(wallPiece(`facade_s_${kind}_${suffix}`, 's', STOREY, kind, { color }));
    }
    out.push(split('facade_plain', () => facade('s', STOREY, 'plain'), { facade_s_plain: left, facade_e_plain: right }, { fp: [1, 1], h: 96 }));
    // The Pelletiers' house closes the court's west side: ochre, shutters closed (they're away), and the gate.
    out.push(wallPiece('facade_e_window_closed_ochre', 'e', STOREY, 'window_closed', { color: COLORS.cobalt, wall: COLORS.ochre }));
    out.push(wallPiece('facade_e_gate_ochre', 'e', STOREY, 'gate', { wall: COLORS.ochre }));
    out.push(split('facade_plain_ochre', () => facade('e', STOREY, 'plain', { wall: COLORS.ochre }), { facade_s_plain_ochre: left, facade_e_plain_ochre: right }, { fp: [1, 1], h: 96 }));
    // Upper storeys and courses for stacking (no plinth).
    out.push(split('upper_plain', () => facade('s', STOREY, 'plain', { plinth: 0 }), { upper_s_plain: left, upper_e_plain: right }, { fp: [1, 1], h: 96 }));
    out.push(wallPiece('upper_s_window_blue', 's', STOREY, 'window', { color: COLORS.cobalt, plinth: 0, z0: 0.7, z1: 1.85 }));
    out.push(wallPiece('upper_e_window_closed_ochre', 'e', STOREY, 'window_closed', { color: COLORS.cobalt, wall: COLORS.ochre, plinth: 0, z0: 0.7, z1: 1.85 }));
    out.push(split('upper_plain_ochre', () => facade('e', STOREY, 'plain', { wall: COLORS.ochre, plinth: 0 }), { upper_s_plain_ochre: left, upper_e_plain_ochre: right }, { fp: [1, 1], h: 96 }));
    out.push(split('course', () => facade('s', 1, 'plain', { plinth: 0 }), { course_s: left, course_e: right }, { fp: [1, 1], h: 40 }));
    out.push(split('course24', () => facade('s', 0.6, 'plain', { plinth: 0 }), { course24_s: left, course24_e: right }, { fp: [1, 1], h: 24 }));
    out.push(split('retain', () => retainingWall(1), { retain_s: left, retain_e: right }, { fp: [1, 1], h: 40 }));
    // The backdrop: the Crown's lower walls and higher houses, above Cheryl's roof.
    out.push(split('crown', () => crownWall(4), { crown_s: left, crown_e: right }, { fp: [1, 1], h: 160 }));
    out.push(split('crown_buttress', () => crownWall(4, { buttress: true }), { crown_s_buttress: left }, { fp: [1, 1], h: 160 }));
    out.push(wallPiece('house_s_window_blue', 's', 3, 'window', { color: COLORS.cobalt, plinth: 0, z0: 1.4, z1: 2.5 }));
    out.push(wallPiece('house_s_window_rose', 's', 3, 'window_box', { color: COLORS.sage, wall: COLORS.rose, plinth: 0, z0: 1.4, z1: 2.5 }));
    out.push(split('house_plain', () => facade('s', 3, 'plain', { plinth: 0 }), { house_s_plain: left, house_e_plain: right }, { fp: [1, 1], h: 120 }));

    // ---- Roof terraces: parapets (36 px), the low wall (22 px), sighting pins, stairs, pent roof
    out.push(runProp('parapet_x', 'x', () => parapet('x', 0.9), 36));
    out.push(runProp('parapet_y', 'y', () => parapet('y', 0.9), 36));
    out.push(prop('parapet_pier', () => parapetPier(0.95), [1, 1], 38, { shadow: true, post: POST.arch }));
    out.push(runProp('parapet_y_pin', 'y', () => union(parapet('y', 0.9), move(sightPin('blade'), 0, 0, 0.9)), 58));
    out.push(runProp('lowwall_y', 'y', () => parapet('y', 0.55, { thick: 0.28 }), 22));
    // The low wall's ends at its gap: end_s ends the northern run at its south end (pier to +y), end_n starts the southern run.
    out.push(prop('lowwall_end_s', () => union(parapet('y', 0.55, { thick: 0.28, from: -0.5, to: 0.36 }), parapetPier(0.6, { oy: 0.32, w: 0.34 })), [1, 1], 24, { shadow: true, post: POST.arch }));
    out.push(prop('lowwall_end_s_pin', () => union(parapet('y', 0.55, { thick: 0.28, from: -0.5, to: 0.36 }), parapetPier(0.6, { oy: 0.32, w: 0.34 }), move(sightPin('ring'), 0, 0.32, 0.6)), [1, 1], 46, { shadow: true, post: POST.arch }));
    out.push(prop('lowwall_end_n', () => union(parapet('y', 0.55, { thick: 0.28, from: -0.36, to: 0.5 }), parapetPier(0.6, { oy: -0.32, w: 0.34 })), [1, 1], 24, { shadow: true, post: POST.arch }));
        for (const [n, drop] of [['stair', 1]]) out.push(prop(n, () => move(stairFlight(drop, { below: 0 }), 0, 0, drop), [1, 1], 40, { shadow: false, post: POST.arch }));
    out.push(prop('pent_roof', () => P.pentRoof({ rise: 0.6 }), [1, 2], 24, { shadow: false, post: POST.arch }));
    // The same at a house's east end, its gable wall closing the triangle under the slope.
    out.push(prop('pent_roof_end_e', () => P.pentRoof({ rise: 0.6, gable: 'e' }), [1, 2], 24, { shadow: false, post: POST.arch }));
    out.push(prop('chimney', () => P.chimney(), [2, 1], 66));
    out.push(prop('chimney_rattle_0', () => P.chimney({ rattle: 1 }), [2, 1], 66));
    out.push(prop('chimney_rattle_1', () => P.chimney({ rattle: -1 }), [2, 1], 66));

    // ---- Cheryl's roof
    out.push(prop('herb_basil', () => P.pot({ plant: 'basil', r: 0.2, h: 0.32, seed: 2 }), [1, 1], 20));
    out.push(prop('herb_rosemary', () => P.pot({ plant: 'rosemary', r: 0.2, h: 0.32, seed: 3 }), [1, 1], 24));
    out.push(prop('chair_fold', () => P.foldingChair({ face: -PI / 2 }), [1, 1], 38));
    out.push(prop('chair_cardigan', () => P.foldingChair({ face: -PI / 2, cardigan: true }), [1, 1], 38));
    out.push(prop('tap', () => P.tap(), [1, 1], 40));
    out.push(prop('tap_running_0', () => P.tap({ running: true, t: 0 }), [1, 1], 40));
    out.push(prop('tap_running_1', () => P.tap({ running: true, t: 0.5 }), [1, 1], 40));
    const tub = (n, st, o = {}) => prop(n, () => P.tub(st, o), [2, 1], 28);
    out.push(tub('tub_empty', 'empty'), tub('tub_plugged', 'plugged'));
    for (let i = 0; i < 3; i++) out.push(tub(`tub_full_${i}`, 'full', { t: i / 3 }));
    for (let i = 0; i < 2; i++) out.push(tub(`tub_filling_${i}`, 'filling', { level: 0.35 + i * 0.35, t: i / 2 }));
    for (let i = 0; i < 2; i++) out.push(tub(`tub_slosh_${i}`, 'slosh', { t: 0.25 + i * 0.5 }));
    for (let i = 0; i < 3; i++) out.push(tub(`tub_whirl_wrong_${i}`, 'whirl', { t: i / 3 }));
    // With Cheryl sitting on the rim in her costume.
    for (let i = 0; i < 3; i++) out.push(prop(`tub_sit_full_${i}`, () => tubSitting('full', i / 3), [2, 1], 66));
    for (let i = 0; i < 2; i++) out.push(prop(`tub_sit_slosh_${i}`, () => tubSitting('slosh', 0.25 + i * 0.5), [2, 1], 66));
    for (let i = 0; i < 3; i++) out.push(prop(`tub_sit_whirl_wrong_${i}`, () => tubSitting('whirl', i / 3), [2, 1], 66));
    out.push(prop('tub_sit_empty', () => tubSitting('empty', 0), [2, 1], 66));

    // ---- Her Next Door's roof: line posts and sheets
    out.push(prop('line_post', () => P.linePost(), [1, 1], 76));
    for (const grey of [false, true]) {
      const g = grey ? '_grey' : '';
      for (let i = 0; i < 2; i++) out.push(prop(`sheets_ns${g}_${i}`, () => P.sheetsY({ t: i * 0.9, grey }), [1, 3], 76));
      for (let i = 0; i < 2; i++) out.push(prop(`backline_sheets${g}_${i}`, () => P.sheetsX({ y0: -3.6, y1: 3.6, t: i * 0.9, grey, n: 4, drop: 1.2 }), [8, 1], 76));
      out.push(prop(`backline_swung${g}`, () => P.sheetsX({ y0: -3.6, y1: 3.6, t: 0.4, grey, n: 4, drop: 1.2, swing: 0.55 }), [8, 1], 76));
    }
    out.push(prop('backline_one', () => P.sheetsX({ y0: -3.6, y1: -1.8, n: 1, drop: 1.2 }), [8, 1], 76));
    out.push(prop('backline_two', () => P.sheetsX({ y0: -3.6, y1: 0, n: 2, drop: 1.2 }), [8, 1], 76));
    out.push(prop('backline_prop', () => union(P.sheetsX({ y0: -3.6, y1: 3.6, n: 0 }), P.clothesProp([0, 0.15, 0], [0, -0.05, 1.86])), [8, 1], 76));
    out.push(prop('backline_sag', () => P.sheetsX({ y0: -3.6, y1: 3.6, n: 0, zl: 1.4 }), [8, 1], 60));
    // The back line again, in one-tile slices (<name>_x0 … _x7, west to east, at (11 + i, 2)), so
    // someone standing in front of it on row 3 isn't drawn under its sheets.
    const sl = (name, build, h = 76) => sliceX(name, build, 8, { shadow: true, h });
    for (const grey of [false, true]) {
      const g = grey ? '_grey' : '';
      for (let i = 0; i < 2; i++) out.push(sl(`backline_sheets${g}_${i}`, () => P.sheetsX({ y0: -3.6, y1: 3.6, t: i * 0.9, grey, n: 4, drop: 1.2 })));
      out.push(sl(`backline_swung${g}`, () => P.sheetsX({ y0: -3.6, y1: 3.6, t: 0.4, grey, n: 4, drop: 1.2, swing: 0.55 })));
    }
    out.push(sl('backline_one', () => P.sheetsX({ y0: -3.6, y1: -1.8, n: 1, drop: 1.2 })));
    out.push(sl('backline_two', () => P.sheetsX({ y0: -3.6, y1: 0, n: 2, drop: 1.2 })));
    out.push(sl('backline_prop', () => union(P.sheetsX({ y0: -3.6, y1: 3.6, n: 0 }), P.clothesProp([0, 0.15, 0], [0, -0.05, 1.86]))));
    out.push(sl('backline_sag', () => P.sheetsX({ y0: -3.6, y1: 3.6, n: 0, zl: 1.4 }), 60));

    // ---- The court
    out.push(prop('lemon_tree', () => P.lemonTree(), [1, 1], 120));
    out.push(prop('lemon_trunk', () => P.lemonTree({ part: 'trunk' }), [1, 1], 80));
    out.push(prop('over_lemon_canopy', () => P.lemonTree({ part: 'canopy' }), [3, 3], 120, { shadow: false }));
    for (const st of ['plug', 'pepper', 'slid']) out.push(prop(`chess_${st}`, () => P.chessTable({ state: st }), [1, 1], 32));
    out.push(prop('stool', () => P.stool(), [1, 1], 18));
    out.push(prop('gerald_chair', () => P.woodChair({ face: PI }), [1, 1], 38));
    out.push(prop('well', () => P.well(), [2, 2], 30));
    // Act 6's dawn: the grate lifting (1) and lifted open (2) so Cheryl can climb out (fx.wellGrate).
    out.push(prop('well_grate_1', () => P.well({ grate: 1 }), [2, 2], 50));
    out.push(prop('well_grate_2', () => P.well({ grate: 2 }), [2, 2], 60));
    out.push(prop('hurdle', () => P.hurdle(), [3, 1], 22));
    out.push(prop('pots_bare', () => P.hurdle({ prop: false }), [3, 1], 22));
    for (let i = 0; i < 3; i++) out.push(prop(`geraniums_${i}`, () => P.pot({ plant: 'geranium', r: 0.2, h: 0.34, seed: 20 + i }), [1, 1], 24));
    out.push(prop('bench', () => P.bench(), [2, 1], 18));
    out.push(prop('piano', () => P.piano(), [2, 2], 56));

    // ---- Below the court: lower roofs and the Squeeze
    out.push(prop('lowroof_terra', () => lowRoof('terra', { h: 0.4 }), [1, 1], 30, { shadow: false, post: POST.arch }));
    out.push(prop('lowroof_flat', () => lowRoof('flat', { h: 0.4 }), [1, 1], 20, { shadow: false, post: POST.arch }));
    // The houses below the court, flanking the Squeeze (walls 60 px to the eaves).
    out.push(prop('lowhouse_terra_3x2', () => lowHouse({ w: 3, d: 2, roof: 'terra', seed: 1 }), [3, 2], 80, { shadow: false, post: POST.arch }));
    out.push(prop('lowhouse_terra_2x2', () => lowHouse({ w: 2, d: 2, roof: 'terra', seed: 2, color: COLORS.ochre }), [2, 2], 80, { shadow: false, post: POST.arch }));
    out.push(prop('lowhouse_flat_2x2', () => lowHouse({ w: 2, d: 2, roof: 'flat' }), [2, 2], 70, { shadow: false, post: POST.arch }));
    out.push(prop('lowhouse_flat_3x2', () => lowHouse({ w: 3, d: 2, roof: 'flat', color: COLORS.rose }), [3, 2], 70, { shadow: false, post: POST.arch }));
    out.push(prop('lowhouse_flat_1x2', () => lowHouse({ w: 1, d: 2, roof: 'flat', color: COLORS.ochre }), [1, 2], 70, { shadow: false, post: POST.arch }));
    out.push(prop('lowhouse_terra_1x2', () => lowHouse({ w: 1, d: 2, roof: 'terra', seed: 5 }), [1, 2], 80, { shadow: false, post: POST.arch }));
    out.push(prop('lowhouse_flat_2x2_tall', () => lowHouse({ w: 2, d: 2, roof: 'flat', wallH: 3 }), [2, 2], 130, { shadow: false, post: POST.arch }));
    out.push(prop('lowhouse_terra_3x2_tall', () => lowHouse({ w: 3, d: 2, roof: 'terra', seed: 4, wallH: 3 }), [3, 2], 140, { shadow: false, post: POST.arch }));
    out.push(prop('stair_scraped', () => move(stairFlight(1, { below: 0, scraped: true }), 0, 0, 1), [1, 1], 40, { shadow: false, post: POST.arch }));
    return out;
  },
  anims: {
    tub_full: { frames: ['tub_full_0', 'tub_full_1', 'tub_full_2'], ms: 260 },
    tub_filling: { frames: ['tub_filling_0', 'tub_filling_1'], ms: 400 },
    tub_slosh: { frames: ['tub_slosh_0', 'tub_slosh_1'], ms: 220 },
    tub_whirl_wrong: { frames: ['tub_whirl_wrong_0', 'tub_whirl_wrong_1', 'tub_whirl_wrong_2'], ms: [500, 120, 260] },
    tub_sit_full: { frames: ['tub_sit_full_0', 'tub_sit_full_1', 'tub_sit_full_2'], ms: 260 },
    tub_sit_slosh: { frames: ['tub_sit_slosh_0', 'tub_sit_slosh_1'], ms: 220 },
    tub_sit_whirl_wrong: { frames: ['tub_sit_whirl_wrong_0', 'tub_sit_whirl_wrong_1', 'tub_sit_whirl_wrong_2'], ms: [500, 120, 260] },
    tap_running: { frames: ['tap_running_0', 'tap_running_1'], ms: 120 },
    chimney_rattle: { frames: ['chimney_rattle_0', 'chimney_rattle_1'], ms: 70 },
    sheets_ns: { frames: ['sheets_ns_0', 'sheets_ns_1'], ms: 600 },
    sheets_ns_grey: { frames: ['sheets_ns_grey_0', 'sheets_ns_grey_1'], ms: 600 },
    backline_sheets: { frames: ['backline_sheets_0', 'backline_sheets_1'], ms: 600 },
    backline_sheets_grey: { frames: ['backline_sheets_grey_0', 'backline_sheets_grey_1'], ms: 600 },
    ...Object.fromEntries([0, 1, 2, 3, 4, 5, 6, 7].flatMap((i) => [
      [`backline_sheets_x${i}`, { frames: [`backline_sheets_0_x${i}`, `backline_sheets_1_x${i}`], ms: 600 }],
      [`backline_sheets_grey_x${i}`, { frames: [`backline_sheets_grey_0_x${i}`, `backline_sheets_grey_1_x${i}`], ms: 600 }],
    ])),
  },
};
void boxAt; void place;
