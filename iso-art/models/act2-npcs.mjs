// Act 2's people (and the goats, the skipping rope, and the Boatman's boat), for
// the isometric sheets iso-art/sheets/act2_*.mjs. Each keeps the colors,
// silhouette, and signature of its SNES sprite (game/src/art/act2_npcs.js,
// named_npcs.js, npcs.js, act4_sprites.js, act5_sprites.js, act6_sprites.js,
// act2b_goat.js); colors are the SNES palette entries by name.
//
// Everything is built with the figure rig (figure.mjs) facing +x with its feet
// at the origin, then turned to a grid direction. Things people hold are placed
// in that same frame, and the arms are posed onto them by a small IK search
// (`grip`), so a hand is always on its handle.
//
// Seated poses (`sitPose(look, seat)`) put the seat `seat` m above the anchor and
// the feet on the anchor's floor. The seat heights used are noted in the sheets.

import { figure, cloth, skinMat, hairMat, facing, limbDir, add, mul } from './figure.mjs';
import { walkPose } from './cheryl.mjs';
import { sphere, ellipsoid, capsule, roundCone, union, smooth, move, place, torus, box, boxAt, cylinder, frustum, subtract, intersect } from '../lib/sdf.mjs';
import { mat, hex, mix } from '../lib/render.mjs';
import { fbm, vnoise } from '../lib/noise.mjs';
import { frame, POST } from '../lib/jobs.mjs';
import { COLORS as C } from '../../game/src/art/palette.js';

const PI = Math.PI;
export const DIRS4 = ['down', 'right', 'up', 'left'];
const EYES = '#4a2c24';

// ---------------------------------------------------------------------------
// Materials

const body = (c, o = {}) => mat(c, { tag: 'body', spec: 0.05, ...o });
const shiny = (c, o = {}) => mat(c, { tag: 'body', spec: 0.8, shin: 40, ...o });
const glaze = (c, o = {}) => mat(c, { tag: 'body', spec: 0.4, shin: 26, ...o });
const glow = (c, emit = 0.85) => mat(c, { tag: 'body', emit, spec: 0 });
const hairCloth = (c, o = {}) => cloth(c, { tag: 'hair', ...o });
const woodMat = (c) => mat((x, y, z, lx, ly, lz) => {
  const g = hex(c), n = fbm(lx * 6, ly * 6, lz * 40, 2);
  return g.map((v) => v * (0.9 + n * 0.2));
}, { tag: 'body', spec: 0.15, shin: 14 });
/** Horizontal stripes in world height (jerseys, striped shirts). */
const stripes = (a, b, band = 0.045, o = {}) => mat((x, y, z, lx, ly, lz) => {
  const c = hex(Math.floor(z / band) % 2 ? a : b), n = 0.95 + fbm(lx * 30, ly * 30, z * 30, 2) * 0.1;
  return c.map((v) => v * n);
}, { tag: 'body', spec: 0.05, shin: 8, ...o });
/** A loud check (the Tourist's shirt). */
const check = (a, b, line, size = 0.05) => mat((x, y, z, lx, ly, lz) => {
  const u = Math.floor((lx + ly + 5) / size), v = Math.floor((z + 5) / size);
  const c = (u + v) % 2 ? hex(a) : hex(b);
  const onLine = ((lx + ly + 5) / size) % 1 < 0.22 || ((z + 5) / size) % 1 < 0.22;
  return onLine ? mix(c, hex(line), 0.6) : c;
}, { tag: 'body', spec: 0.05, shin: 8 });

// ---------------------------------------------------------------------------
// Rig helpers: where the hands and head are for a look and pose (mirrors figure.mjs).

const POSE0 = { hipL: 0, hipR: 0, kneeL: 0.05, kneeR: 0.05, shL: 0, shR: 0, elL: 0.2, elR: 0.2, outL: 0.12, outR: 0.12, bob: 0, lean: 0, turn: 0, nod: 0, twist: 0 };
const kOf = (look) => (look.height ?? 1.65) / 1.65;

/** The hand's center for `side` (-1 left, +1 right) with arm angles (sh, el, out). */
export function handAt(look, pose, side, sh, el, out) {
  const k = kOf(look), W = look.build ?? 1, p = { ...POSE0, ...pose };
  const shZ = 1.36 * k + p.bob, shY = 0.175 * k * W, leanX = Math.sin(p.lean) * 0.5 * k;
  const S = [leanX * 0.6 - 0.02 * k, side * shY, shZ - 0.02 * k];
  const d1 = limbDir(sh, out, side);
  const E = add(S, mul(d1, 0.27 * k));
  const d2 = limbDir(sh + el, out * 0.6, side);
  return add(add(E, mul(d2, 0.25 * k)), mul(d2, 0.025 * k));
}

/** The head's center and size (hs) for a look and pose. */
export function headAt(look, pose) {
  const k = kOf(look), p = { ...POSE0, ...pose };
  const hs = (look.headScale ?? 1) * k, leanX = Math.sin(p.lean) * 0.5 * k;
  return { c: [leanX * 0.6 - 0.028 * hs + Math.sin(p.nod) * 0.03, 0, 1.545 * k + p.bob + (hs - k) * 0.09], hs };
}

/** Pose one arm so its hand reaches `target` (a small search over the joint angles). */
export function grip(look, pose, side, target) {
  let best = null;
  const tryIt = (sh, el, out) => {
    if (el < 0 || el > 2.6) return;
    const h = handAt(look, pose, side, sh, el, out);
    const d = Math.hypot(h[0] - target[0], h[1] - target[1], h[2] - target[2]) + el * 0.004 + Math.abs(out) * 0.004;
    if (!best || d < best.d) best = { d, sh, el, out };
  };
  for (let sh = -1.2; sh <= 3.3; sh += 0.15) for (let el = 0; el <= 2.6; el += 0.15) for (let out = -0.7; out <= 1.5; out += 0.15) tryIt(sh, el, out);
  for (let step = 0.07; step > 0.004; step /= 2) {
    const b = best;
    for (const ds of [-step, 0, step]) for (const de of [-step, 0, step]) for (const dout of [-step, 0, step]) tryIt(b.sh + ds, b.el + de, b.out + dout);
  }
  return side < 0 ? { shL: best.sh, elL: best.el, outL: best.out } : { shR: best.sh, elR: best.el, outR: best.out };
}
/** Pose both arms onto two targets. */
const grip2 = (look, pose, l, r) => ({ ...pose, ...(l ? grip(look, pose, -1, l) : {}), ...(r ? grip(look, pose, 1, r) : {}) });

/** Seated on something `seat` m high, feet on the floor at the anchor. */
export function sitPose(look, seat, extra = {}) {
  const k = kOf(look);
  const h = seat + 0.08 * k; // the hip joint, just above the seat
  const c = Math.max(-0.9, Math.min(0.6, (h - 0.4 * k - 0.09 * k) / (0.42 * k)));
  const hip = Math.acos(c);
  return { bob: h - 0.86 * k, hipL: hip, hipR: hip - 0.06, kneeL: hip - 0.08, kneeR: hip - 0.02, shL: 0.35, elL: 0.9, outL: 0.2, shR: 0.35, elR: 0.9, outR: 0.2, ...extra };
}

/** The bob that puts the ankle of a leg at (hip, knee) on the floor. */
function groundBob(k, hip, knee) {
  return 0.09 * k - (0.86 * k - 0.42 * k * Math.cos(hip) - 0.4 * k * Math.cos(hip - knee));
}

/** A crouch (knees up, seat low). */
export function crouchPose(look, extra = {}) {
  const k = kOf(look);
  return { bob: groundBob(k, 2.0, 2.6), hipL: 2.0, hipR: 1.85, kneeL: 2.6, kneeR: 2.5, lean: 0.55, nod: 0.35, shL: 0.6, elL: 0.6, outL: 0.25, ...extra };
}

/** The jolt of the lurch: knees buckle, arms fly out. */
export const FALL0 = { hipL: 0.35, hipR: 0.2, kneeL: 0.7, kneeR: 0.55, bob: -0.1, shL: 0.35, shR: 0.35, outL: 1.05, outR: 1.05, elL: 0.9, elR: 0.9, lean: -0.12, nod: -0.25 };

/** Hands on hips (knuckles at the waist, elbows out). */
export function onHips(look, pose = {}, sides = [-1, 1]) {
  const k = kOf(look), W = look.build ?? 1, p = { ...pose };
  const z = 0.98 * k + (pose.bob ?? 0);
  for (const sd of sides) Object.assign(p, grip(look, { ...POSE0, ...pose }, sd, [-0.01 * k, sd * 0.19 * k * W, z]));
  return p;
}
/** Sitting down hard: legs out, soles showing, hands propped behind. */
export function fallSitPose(look) {
  const k = kOf(look);
  return { bob: 0.07 * k - 0.86 * k, hipL: PI / 2 - 0.12, hipR: PI / 2 - 0.2, kneeL: -0.05, kneeR: 0.1, shL: -0.7, shR: -0.7, elL: 0.05, elR: 0.05, outL: 0.35, outR: 0.35, lean: -0.08, nod: -0.05 };
}
/** The run: legs and arms pumping (8 phases). */
export function runPose(i, n = 8, amp = 1) {
  const ph = (i / n) * PI * 2, s = Math.sin(ph), c = Math.cos(ph);
  return { hipL: 0.55 * s * amp, hipR: -0.55 * s * amp, kneeL: 0.2 + 1.0 * Math.max(0, c) * amp, kneeR: 0.2 + 1.0 * Math.max(0, -c) * amp, shL: -0.6 * s * amp, shR: 0.6 * s * amp, elL: 1.3, elR: 1.3, outL: 0.15, outR: 0.15, bob: 0.035 * Math.abs(c) - 0.03, lean: 0.16 };
}

/** A person (look, pose, and held props in the figure frame) turned to `dir`. */
export function person(look, pose = {}, dir = 'down', props = [], shift = 0) {
  let node = props.length ? union(figure(look, pose), ...props) : figure(look, pose);
  if (shift) node = move(node, shift, 0, 0);
  return facing(node, dir);
}

// ---------------------------------------------------------------------------
// Hair, hats, faces (in the head's frame: centered, facing +x, `s` its size)

const capHair = (hm, s) => smooth(0.03 * s,
  move(ellipsoid(0.1 * s, 0.095 * s, 0.092 * s, hm), -0.032 * s, 0, 0.04 * s),
  move(ellipsoid(0.06 * s, 0.093 * s, 0.075 * s, hm), -0.05 * s, 0, -0.02 * s));
const bun = (hm, s, x = -0.12, z = 0.06, r = 0.055) => move(ellipsoid(r * s, r * 1.04 * s, r * 0.95 * s, hm), x * s, 0, z * s);
/** Curls: a cap of small balls over the back and top of the skull. */
function curls(hm, s, { r = 0.04, spread = 1, front = 0.02 } = {}) {
  const out = [move(ellipsoid(0.1 * s, 0.096 * s, 0.09 * s, hm), -0.03 * s, 0, 0.04 * s)];
  for (let i = 0; i < 16; i++) {
    const a = (i / 16) * PI * 2, e = (i % 4) / 4;
    const th = 0.25 + e * 1.1;
    const x = Math.cos(a) * Math.sin(th) * 0.095 * spread - 0.03, y = Math.sin(a) * Math.sin(th) * 0.098 * spread, z = Math.cos(th) * 0.1 + 0.03;
    if (x > front) continue;
    out.push(move(sphere(r * s, hm), x * s, y * s, z * s));
  }
  return union(out);
}
/** A ring of hair round the back and sides of a bald head. */
const ringHair = (hm, s) => union(
  move(ellipsoid(0.07 * s, 0.09 * s, 0.045 * s, hm), -0.05 * s, 0, -0.0 * s),
  move(ellipsoid(0.035 * s, 0.02 * s, 0.032 * s, hm), -0.025 * s, -0.08 * s, 0.01 * s),
  move(ellipsoid(0.035 * s, 0.02 * s, 0.032 * s, hm), -0.025 * s, 0.08 * s, 0.01 * s));
const mustache = (c, s, w = 1) => union(
  place(ellipsoid(0.018 * s, 0.03 * s * w, 0.013 * s, mat(c, { tag: 'hair' })), { at: [0.1 * s, -0.022 * s * w, -0.032 * s], rx: 0.35 }),
  place(ellipsoid(0.018 * s, 0.03 * s * w, 0.013 * s, mat(c, { tag: 'hair' })), { at: [0.1 * s, 0.022 * s * w, -0.032 * s], rx: -0.35 }));
const beard = (hm, s) => union(
  move(ellipsoid(0.072 * s, 0.088 * s, 0.07 * s, hm), 0.035 * s, 0, -0.075 * s),
  move(ellipsoid(0.04 * s, 0.025 * s, 0.06 * s, hm), -0.005 * s, -0.08 * s, -0.03 * s),
  move(ellipsoid(0.04 * s, 0.025 * s, 0.06 * s, hm), -0.005 * s, 0.08 * s, -0.03 * s));
const flatCap = (c, s, peak = c) => union(
  move(ellipsoid(0.118 * s, 0.108 * s, 0.06 * s, hairCloth(c, { noise: 0.1 })), -0.015 * s, 0, 0.095 * s),
  place(box(0.045 * s, 0.085 * s, 0.01 * s, hairCloth(peak), 0.008 * s), { at: [0.095 * s, 0, 0.085 * s], ry: -0.15 }));
/** A peaked captain's cap: a flat top over a band, a dark peak, a small badge. */
const captainCap = (c, s, { peak = '#282838', badge = C.brass_light, band = c } = {}) => union(
  move(cylinder(0.098 * s, 0.055 * s, 0.11 * s, hairCloth(band), 0.01 * s), -0.015 * s, 0, 0),
  move(ellipsoid(0.125 * s, 0.115 * s, 0.035 * s, hairCloth(c, { noise: 0.08 })), -0.02 * s, 0, 0.125 * s),
  place(box(0.04 * s, 0.085 * s, 0.008 * s, glaze(peak, { tag: 'hair' }), 0.006 * s), { at: [0.095 * s, 0, 0.07 * s], ry: 0.2 }),
  move(sphere(0.018 * s, shiny(badge, { tag: 'hair' })), 0.09 * s, 0, 0.1 * s));
/** Round spectacles on the nose. */
const specs = (c, s, r = 0.03) => union(
  place(torus(r * s, 0.007 * s, shiny(c, { tag: 'hair' })), { at: [0.1 * s, -0.038 * s, 0.03 * s], ry: PI / 2 }),
  place(torus(r * s, 0.007 * s, shiny(c, { tag: 'hair' })), { at: [0.1 * s, 0.038 * s, 0.03 * s], ry: PI / 2 }),
  capsule([0.105 * s, -0.01 * s, 0.035 * s], [0.105 * s, 0.01 * s, 0.035 * s], 0.006 * s, shiny(c, { tag: 'hair' })),
  capsule([0.09 * s, -0.068 * s, 0.035 * s], [0.0, -0.09 * s, 0.03 * s], 0.005 * s, shiny(c, { tag: 'hair' })),
  capsule([0.09 * s, 0.068 * s, 0.035 * s], [0.0, 0.09 * s, 0.03 * s], 0.005 * s, shiny(c, { tag: 'hair' })));
/** A glint: a small bright star. */
const glint = (at, r) => union(
  move(sphere(r * 0.7, glow('#fffff0', 1)), ...at),
  capsule(add(at, [0, -r * 2.2, 0]), add(at, [0, r * 2.2, 0]), r * 0.35, glow('#fffff0', 1)),
  capsule(add(at, [0, 0, -r * 2.2]), add(at, [0, 0, r * 2.2]), r * 0.35, glow('#fffff0', 1)));
const openMouth = (s) => move(ellipsoid(0.012 * s, 0.02 * s, 0.016 * s, mat('#5a2830', { tag: 'skin' })), 0.098 * s, 0, -0.05 * s);

// ---------------------------------------------------------------------------
// Props, each in its own frame

/** A book: half-sizes (depth along x, width along y, height along z); cover color and crest. */
function book(cover, { w = 0.075, h = 0.1, t = 0.014, crest = null, pages = C.cream } = {}) {
  const cov = mat((x, y, z, lx, ly, lz) => {
    if (crest && lx > t * 0.6 && Math.hypot(ly, lz + 0.01) < w * 0.45 && lz < h * 0.3) return hex(crest);
    return hex(cover);
  }, { tag: 'body', spec: 0.15, shin: 14 });
  return union(box(t, w, h, cov, 0.003), box(t * 0.8, w * 0.97, h * 0.96, body(pages)));
}
/** An open book lying flat, spine along y. */
function openBook(cover, w = 0.1, d = 0.14) {
  const page = mat((x, y, z, lx, ly, lz) => (Math.abs(ly) < 0.006 ? hex(C.cream_shade) : (Math.floor((lx + 1) * 70) % 3 === 0 && Math.abs(Math.abs(ly) - w * 0.5) < w * 0.35 ? mix(hex(C.cream), hex('#605060'), 0.3) : hex(C.cream))), { tag: 'body', spec: 0.03 });
  return union(boxAt(-d / 2, -w, -0.012, d / 2, w, 0, body(cover), 0.004), boxAt(-d / 2 + 0.008, -w + 0.008, 0, d / 2 - 0.008, w - 0.008, 0.014, page, 0.003));
}
/** A folded newspaper sheet, standing in the y-z plane (half sizes). */
function paperMat() {
  return mat((x, y, z, lx, ly, lz) => {
    const base = hex(C.white_light);
    if (lz > 0.13) return mix(base, hex('#403848'), 0.55); // the masthead
    if (Math.floor((lz + 1) * 60) % 2 === 0 && (Math.abs(ly) % 0.08) > 0.012) return mix(base, hex(C.white_shade), 0.9);
    return base;
  }, { tag: 'body', spec: 0.03 });
}
function newspaper(turn = 0) {
  const pm = paperMat();
  const W = 0.17, H = 0.2;
  const half = (side, rz) => place(box(0.006, W, H, pm), { at: [Math.sin(rz) * side * -W, side * Math.cos(rz) * W, 0], rz: side * rz });
  const parts = [half(-1, -0.2), half(1, 0.2)];
  if (turn) parts.push(place(move(box(0.006, W * 0.95, H * 0.97, pm), 0, W * 0.95, 0), { at: [0.02, 0, 0], rz: -1.3 })); // a page mid-turn
  return union(parts);
}
const wateringCan = () => {
  const cb = glaze(C.cobalt);
  return union(
    cylinder(0.075, 0, 0.17, cb, 0.012),
    roundCone([0.05, 0, 0.04], [0.22, 0, 0.19], 0.022, 0.012, cb),
    move(place(frustum(0.012, 0.03, 0, 0.03, cb), { ry: PI / 2 + 0.6 }), 0.23, 0, 0.2),
    place(torus(0.06, 0.012, cb), { at: [-0.02, 0, 0.17], rx: PI / 2 }),
  );
};
const ledger = () => book(C.terra, { w: 0.075, h: 0.1, t: 0.02, pages: C.cream });
function telescope() {
  const b = shiny(C.brass_light), bs = shiny(C.brass);
  return union(
    roundCone([0, 0, 0], [0.16, 0, 0], 0.017, 0.019, b),
    roundCone([0.15, 0, 0], [0.32, 0, 0], 0.022, 0.024, bs),
    roundCone([0.31, 0, 0], [0.5, 0, 0], 0.028, 0.032, b),
    place(cylinder(0.026, -0.004, 0.004, glaze('#203048')), { at: [0.515, 0, 0], ry: PI / 2 }),
  );
}
function bucket() {
  const w = woodMat(C.wood), hoop = mat(C.iron, { tag: 'body', spec: 0.4 });
  return union(
    frustum(0.1, 0.125, 0, 0.22, w, 0.008),
    move(torus(0.111, 0.008, hoop), 0, 0, 0.05), move(torus(0.122, 0.008, hoop), 0, 0, 0.18),
    move(cylinder(0.11, 0.17, 0.19, glaze(C.water)), 0, 0, 0),
  );
}
function squareJug(c = C.wood_shade) {
  const g = glaze(c);
  return union(box(0.07, 0.07, 0.09, g, 0.025), move(cylinder(0.025, 0.08, 0.14, g, 0.006), 0, 0, 0), place(torus(0.035, 0.01, g), { at: [-0.06, 0, 0.06], rx: PI / 2 }), move(cylinder(0.018, 0.14, 0.16, body(C.wood_light)), 0, 0, 0));
}
function mug(steam) {
  const m = glaze(C.cream);
  const parts = [cylinder(0.04, -0.05, 0.05, m, 0.008), place(torus(0.028, 0.009, m), { at: [-0.045, 0, 0], rx: PI / 2 }), move(cylinder(0.034, 0.03, 0.046, glaze('#704830')), 0, 0, 0)];
  if (steam !== undefined) for (let i = 0; i < 3; i++) parts.push(move(sphere(0.018 - i * 0.003, glow(C.white_light, 0.5)), 0.01 * Math.sin(i * 2 + steam * 2), 0.012 * Math.cos(i * 3 + steam * 3), 0.08 + i * 0.045 + steam * 0.02));
  return union(parts);
}
function teacup() {
  const m = glaze(C.cream);
  return union(frustum(0.025, 0.035, 0, 0.045, m, 0.005), place(torus(0.016, 0.006, m), { at: [-0.035, 0, 0.025], rx: PI / 2 }), move(cylinder(0.03, 0.035, 0.042, glaze('#a06030')), 0, 0, 0));
}
const saucer = () => cylinder(0.055, -0.006, 0.004, glaze(C.cream), 0.003);
/** Ottilie's lamp: a brass lantern with a glowing glass, hanging from its ring (origin at the ring). */
function lantern(bright = 1) {
  const b = shiny(C.brass_shade), g = glow(C.lamp_glow, 0.75 + 0.2 * bright);
  return union(
    place(torus(0.022, 0.006, b), { rx: PI / 2 }),
    move(frustum(0.05, 0.02, -0.07, -0.03, b, 0.004), 0, 0, 0),
    move(cylinder(0.045 * (0.9 + 0.1 * bright), -0.17, -0.07, g), 0, 0, 0),
    ...[[1, 1], [1, -1], [-1, 1], [-1, -1]].map(([a, c]) => capsule([0.035 * a, 0.035 * c, -0.18], [0.035 * a, 0.035 * c, -0.065], 0.006, b)),
    move(cylinder(0.055, -0.2, -0.17, b, 0.006), 0, 0, 0),
  );
}
/** The copper coil from Mott's still, axis along y. */
function copperCoil() {
  const cu = shiny(C.terra_light, { spec: 0.7 });
  const parts = [];
  for (let i = 0; i < 4; i++) parts.push(place(torus(0.085, 0.018, cu), { at: [0, -0.09 + i * 0.06, 0], rx: PI / 2 + 0.15 }));
  parts.push(capsule([0.08, -0.12, 0], [0.12, -0.18, 0.06], 0.016, cu), capsule([-0.08, 0.1, 0], [-0.1, 0.16, -0.08], 0.016, cu));
  return union(parts);
}
function strawHat() {
  const straw = mat((x, y, z, lx, ly, lz) => hex(C.brass_light).map((v) => v * (0.9 + 0.1 * Math.sin(Math.atan2(ly, lx) * 40 + Math.hypot(lx, ly) * 200))), { tag: 'hair', spec: 0.1 });
  return union(cylinder(0.2, -0.008, 0.008, straw, 0.006), move(frustum(0.1, 0.085, 0, 0.09, straw, 0.015), 0, 0, 0), move(cylinder(0.102, 0.008, 0.035, mat(C.cobalt, { tag: 'hair' })), 0, 0, 0));
}

// ---------------------------------------------------------------------------
// Looks

const legsMat = (c) => cloth(c, { noise: 0.06 });

/** The Counting Woman: silver curls, a cobalt dress, a gold civic sash. */
export function countingWomanLook() {
  const sash = body(C.mustard, { spec: 0.3, shin: 20 });
  return {
    height: 1.6, skin: C.skin, eyes: EYES, brows: C.silver_shade, hair: C.silver, featureScale: 1.15, eyeZ: 0.025,
    top: cloth(C.cobalt), sleeve: cloth(C.cobalt), skirt: cloth(C.cobalt), hem: 0.3, hemR: 0.21,
    shoes: C.wood, legs: C.skin_shade, headScale: 1.2, build: 1.05,
    hairNode: (s) => curls(hairMat(C.silver, C.silver_light, 0.3), s, { r: 0.042 }),
    extras: ({ k, shZ, waistZ, leanX }) => [
      // A cream collar, and the gold sash from her left shoulder to her right hip, knotted there.
      capsule([0.05 * k + leanX * 0.6, -0.06 * k, shZ + 0.02 * k], [0.09 * k + leanX * 0.6, 0, shZ - 0.03 * k], 0.02 * k, body(C.cream)),
      capsule([0.05 * k + leanX * 0.6, 0.06 * k, shZ + 0.02 * k], [0.09 * k + leanX * 0.6, 0, shZ - 0.03 * k], 0.02 * k, body(C.cream)),
      roundCone([0.07 * k + leanX * 0.6, -0.15 * k, shZ - 0.01 * k], [0.14 * k + leanX * 0.2, 0.1 * k, waistZ - 0.06 * k], 0.026 * k, 0.026 * k, sash),
      roundCone([-0.07 * k + leanX * 0.6, -0.15 * k, shZ - 0.01 * k], [-0.11 * k, 0.14 * k, waistZ - 0.04 * k], 0.026 * k, 0.026 * k, sash),
      move(sphere(0.04 * k, sash), 0.1 * k, 0.15 * k, waistZ - 0.07 * k),
    ],
  };
}

/** The Piano Movers: overalls over a shirt with rolled sleeves, a cap, a beard. */
export function moverLook(who = 'big') {
  const P = who === 'big'
    ? { skin: C.skin3, hair: C.hair_black, hair2: C.hair_black_shade, over: C.navy, shirt: C.white_light, cap: C.terra, height: 1.76, build: 1.42, eyes: '#241418' }
    : { skin: C.skin, hair: C.hair_ginger, hair2: C.hair_ginger_shade, over: C.moss, shirt: C.cream, cap: C.iron, height: 1.7, build: 1.25, eyes: EYES };
  const ov = cloth(P.over, { noise: 0.1 });
  return {
    height: P.height, build: P.build, skin: P.skin, eyes: P.eyes, brows: P.hair2, hair: P.hair, featureScale: 1.1, eyeZ: 0.03,
    top: ov, sleeve: cloth(P.shirt, { noise: 0.06 }), shortSleeves: true, trousers: ov, shoes: C.wood_shade, headScale: 1.15, mouth: P.hair2,
    hairNode: (s) => union(capHair(hairMat(P.hair, P.hair2, 0.3), s), beard(hairMat(P.hair, P.hair2, 0.3), s), flatCap(P.cap, s)),
    extras: ({ k, W, shZ, leanX }) => [
      // The shirt across the shoulders, and the overall straps over it.
      capsule([leanX * 0.6 - 0.02 * k, -0.165 * k * W, shZ - 0.02 * k], [leanX * 0.6 - 0.02 * k, 0.165 * k * W, shZ - 0.02 * k], 0.075 * k, cloth(P.shirt, { noise: 0.06 })),
      capsule([leanX * 0.6 + 0.05 * k, -0.08 * k * W, shZ + 0.04 * k], [leanX * 0.6 + 0.09 * k, -0.07 * k * W, shZ - 0.12 * k], 0.022 * k, ov),
      capsule([leanX * 0.6 + 0.05 * k, 0.08 * k * W, shZ + 0.04 * k], [leanX * 0.6 + 0.09 * k, 0.07 * k * W, shZ - 0.12 * k], 0.022 * k, ov),
      capsule([leanX * 0.6 - 0.07 * k, -0.08 * k * W, shZ + 0.04 * k], [leanX * 0.6 - 0.1 * k, -0.04 * k * W, shZ - 0.15 * k], 0.022 * k, ov),
      capsule([leanX * 0.6 - 0.07 * k, 0.08 * k * W, shZ + 0.04 * k], [leanX * 0.6 - 0.1 * k, 0.04 * k * W, shZ - 0.15 * k], 0.022 * k, ov),
    ],
  };
}

/** The Stranded Tourist: sunburnt, ginger ponytail, a loud blue check shirt, khaki shorts. */
export function touristLook({ hat = false } = {}) {
  const hm = hairMat(C.hair_ginger, C.hair_ginger_shade, 0.3);
  return {
    height: 1.62, skin: C.rose, eyes: EYES, brows: C.hair_ginger_shade, hair: C.hair_ginger, featureScale: 1.15, eyeZ: 0.03, mouth: C.rose_shade,
    top: check(C.sky_light, C.cobalt_light, C.sky_shade), sleeve: check(C.sky_light, C.cobalt_light, C.sky_shade), shortSleeves: true,
    trousers: cloth(C.stone, { noise: 0.08 }), shorts: true, shortsLen: 0.85, legs: C.rose, shoes: C.wood, headScale: 1.2,
    hairNode: (s) => union(
      capHair(hm, s),
      roundCone([-0.1 * s, 0, 0.06 * s], [-0.2 * s, 0, -0.04 * s], 0.035 * s, 0.022 * s, hm), // the ponytail
      move(sphere(0.022 * s, skinMat(C.rose_shade)), 0.112 * s, 0, -0.008 * s), // a red nose
      ...(hat ? [place(strawHat(), { at: [-0.01 * s, 0, 0.09 * s], ry: -0.1, s: s * 0.95 })] : []),
    ),
    extras: ({ k, shZ, leanX }) => [
      capsule([0.05 * k + leanX * 0.6, -0.06 * k, shZ + 0.025 * k], [0.09 * k + leanX * 0.6, -0.01 * k, shZ - 0.03 * k], 0.02 * k, body(C.sky_light)),
      capsule([0.05 * k + leanX * 0.6, 0.06 * k, shZ + 0.025 * k], [0.09 * k + leanX * 0.6, 0.01 * k, shZ - 0.03 * k], 0.02 * k, body(C.sky_light)),
    ],
  };
}

/** The Mayor: slicked black hair with a quiff, a charcoal suit, his gold chain of office. */
export function mayorLook() {
  const gold = shiny(C.brass_light);
  return {
    height: 1.72, build: 1.08, skin: C.skin, eyes: EYES, brows: C.hair_black, hair: C.hair_black, featureScale: 1.15, eyeZ: 0.03,
    top: cloth(C.iron, { noise: 0.06 }), sleeve: cloth(C.iron, { noise: 0.06 }), trousers: cloth(C.iron, { noise: 0.06 }), shoes: C.wood_deep, headScale: 1.18,
    hairNode: (s) => {
      const hm = hairMat(C.hair_black, '#605870', 0.25);
      return union(capHair(hm, s), place(ellipsoid(0.06 * s, 0.07 * s, 0.035 * s, hm), { at: [0.045 * s, -0.01 * s, 0.105 * s], ry: -0.4 }));
    },
    extras: ({ k, shZ, waistZ, leanX }) => {
      const x = leanX * 0.6;
      return [
        // White shirt front in the jacket's V, and the chain from both shoulders to a medallion.
        place(roundCone([0, 0, 0], [0.01 * k, 0, -0.13 * k], 0.04 * k, 0.012 * k, body(C.white_light)), { at: [x + 0.085 * k, 0, shZ + 0.02 * k] }),
        capsule([x + 0.08 * k, 0, shZ - 0.02 * k], [x + 0.11 * k, 0, shZ - 0.08 * k], 0.012 * k, body('#7a2838')), // a tie
        capsule([x + 0.02 * k, -0.13 * k, shZ + 0.01 * k], [x + 0.135 * k, -0.03 * k, shZ - 0.13 * k], 0.02 * k, gold),
        capsule([x + 0.02 * k, 0.13 * k, shZ + 0.01 * k], [x + 0.135 * k, 0.03 * k, shZ - 0.13 * k], 0.02 * k, gold),
        capsule([x - 0.06 * k, -0.13 * k, shZ + 0.01 * k], [x - 0.06 * k, 0.13 * k, shZ + 0.01 * k], 0.02 * k, gold),
        place(cylinder(0.048 * k, -0.008 * k, 0.008 * k, shiny(C.brass, { spec: 0.6 }), 0.005 * k), { at: [x + 0.145 * k, 0, shZ - 0.17 * k], ry: PI / 2 - 0.15 }),
      ];
    },
  };
}

/** Ambrose Tull: big and old, a cloud of white hair and a white mustache, a long brown coat. */
export function ambroseLook() {
  const hm = hairMat(C.silver_light, C.silver, 0.35);
  return {
    height: 1.74, build: 1.2, skin: C.skin2, eyes: '#3a2420', brows: C.silver_light, hair: C.silver_light, featureScale: 1.2, eyeZ: 0.025, mouth: C.silver_light,
    top: cloth(C.wood, { noise: 0.1 }), sleeve: cloth(C.wood, { noise: 0.1 }), skirt: cloth(C.wood, { noise: 0.1 }), hem: 0.48, hemR: 0.23,
    legsMat: legsMat(C.wood_shade), shoes: C.iron, headScale: 1.18,
    hairNode: (s) => union(
      // Bald on top, a cloud of white hair round the sides and back, bushy brows, a big mustache.
      // A wild white mop, standing up off the crown and out over the ears.
      curls(hm, s, { r: 0.05, spread: 1.15, front: 0.04 }),
      move(sphere(0.055 * s, hm), -0.01 * s, -0.1 * s, 0.03 * s), move(sphere(0.055 * s, hm), -0.01 * s, 0.1 * s, 0.03 * s),
      move(sphere(0.06 * s, hm), -0.08 * s, 0, 0.08 * s),
      mustache(C.silver_light, s, 1.35),
      move(ellipsoid(0.015 * s, 0.03 * s, 0.012 * s, mat(C.silver_light, { tag: 'hair' })), 0.088 * s, -0.04 * s, 0.05 * s),
      move(ellipsoid(0.015 * s, 0.03 * s, 0.012 * s, mat(C.silver_light, { tag: 'hair' })), 0.088 * s, 0.04 * s, 0.05 * s),
    ),
    extras: ({ k, W, shZ, waistZ, leanX }) => [
      // A cream shirt and terracotta neckerchief at the throat, and the coat's lapels.
      capsule([0.05 * k + leanX * 0.6, -0.05 * k, shZ + 0.03 * k], [0.1 * k + leanX * 0.6, 0, shZ - 0.06 * k], 0.024 * k, body(C.cream)),
      capsule([0.05 * k + leanX * 0.6, 0.05 * k, shZ + 0.03 * k], [0.1 * k + leanX * 0.6, 0, shZ - 0.06 * k], 0.024 * k, body(C.cream)),
      move(sphere(0.026 * k, body(C.terra)), 0.1 * k + leanX * 0.6, 0, shZ - 0.0 * k),
      capsule([0.13 * k * W + leanX * 0.3, 0, waistZ + 0.05 * k], [0.12 * k * W, 0, waistZ - 0.35 * k], 0.01 * k, body(C.wood_shade)),
    ],
  };
}

/** The Woman with Basin: brown hair in a bun, an ochre dress. */
export function basinWomanLook() {
  return {
    height: 1.6, skin: C.skin2, eyes: '#3a2420', brows: C.hair_brown_shade, hair: C.hair_brown, featureScale: 1.15, eyeZ: 0.03,
    top: cloth(C.ochre), sleeve: cloth(C.ochre), skirt: cloth(C.ochre), hem: 0.3, hemR: 0.22, shoes: C.wood, legs: C.skin2_shade, headScale: 1.2, build: 1.06,
    hairNode: (s) => { const hm = hairMat(C.hair_brown, C.hair_brown_shade, 0.3); return union(capHair(hm, s), bun(hm, s, -0.11, 0.08, 0.058)); },
    extras: ({ k, waistZ }) => [capsule([0.13 * k, -0.15 * k, waistZ], [0.13 * k, 0.15 * k, waistZ], 0.016 * k, body(C.ochre_shade))],
  };
}

/** The Skipping Girls: bunches, a white blouse, a dress; palettes a, b, c. */
export function girlLook(pal = 'a') {
  const P = {
    a: { skin: C.skin, hair: C.hair_brown, hair2: C.hair_brown_shade, blouse: C.white, top: C.bloom_pink, skirt: C.rose, eyes: EYES },
    b: { skin: C.skin3, hair: C.hair_black, hair2: C.hair_black_shade, blouse: C.white, top: C.mustard, skirt: C.teal, eyes: '#201418' },
    c: { skin: C.skin2, hair: C.hair_ginger, hair2: C.hair_ginger_shade, blouse: C.cream, top: C.sky, skirt: C.sage, eyes: EYES },
  }[pal];
  return {
    height: 1.3, skin: P.skin, eyes: P.eyes, brows: P.hair2, hair: P.hair, featureScale: 1.2, eyeZ: 0.03,
    top: cloth(P.top), sleeve: cloth(P.blouse), shortSleeves: true, skirt: cloth(P.skirt), hem: 0.44, hemR: 0.23, shoes: C.wood, legs: P.skin, headScale: 1.3, build: 0.95,
    hairNode: (s) => {
      const hm = hairMat(P.hair, P.hair2, 0.3);
      return union(capHair(hm, s), move(sphere(0.05 * s, hm), -0.04 * s, -0.1 * s, 0.05 * s), move(sphere(0.05 * s, hm), -0.04 * s, 0.1 * s, 0.05 * s),
        move(sphere(0.016 * s, body(P.skirt, { tag: 'hair' })), -0.02 * s, -0.075 * s, 0.07 * s), move(sphere(0.016 * s, body(P.skirt, { tag: 'hair' })), -0.02 * s, 0.075 * s, 0.07 * s));
    },
    extras: ({ k, shZ, leanX }) => [
      capsule([0.05 * k + leanX * 0.6, -0.07 * k, shZ + 0.025 * k], [0.09 * k + leanX * 0.6, 0, shZ - 0.03 * k], 0.026 * k, body(P.blouse)),
      capsule([0.05 * k + leanX * 0.6, 0.07 * k, shZ + 0.025 * k], [0.09 * k + leanX * 0.6, 0, shZ - 0.03 * k], 0.026 * k, body(P.blouse)),
    ],
  };
}

/** The Woman with Watering Can: black curls, a sage dress; `glasses` up in her hair. */
export function wateringWomanLook({ glasses = false } = {}) {
  return {
    height: 1.6, skin: C.skin3, eyes: '#201418', brows: C.hair_black_shade, hair: C.hair_black, featureScale: 1.2, eyeZ: 0.03, mouth: '#603038',
    top: cloth(C.sage), sleeve: cloth(C.sage), skirt: cloth(C.sage), hem: 0.3, hemR: 0.22, shoes: C.wood, legs: C.skin3, headScale: 1.2, build: 1.05,
    hairNode: (s) => {
      const parts = [curls(hairMat(C.hair_black, '#585068', 0.3), s, { r: 0.045, spread: 1.08 })];
      if (glasses) {
        // Her husband's gold reading glasses pushed up on her curls, drawn large, with a glint.
        const g = shiny(C.brass_light, { tag: 'hair' });
        for (const y of [-0.058, 0.058]) parts.push(place(torus(0.048 * s, 0.017 * s, g), { at: [0.045 * s, y * s, 0.19 * s], ry: -0.35 }));
        parts.push(capsule([0.05 * s, -0.012 * s, 0.195 * s], [0.05 * s, 0.012 * s, 0.195 * s], 0.014 * s, g));
        parts.push(glint([0.06 * s, -0.08 * s, 0.27 * s], 0.02 * s));
      }
      return union(parts);
    },
    extras: ({ k, waistZ }) => [capsule([0.12 * k, -0.16 * k, waistZ], [0.12 * k, 0.16 * k, waistZ], 0.015 * k, body(C.sage_shade))],
  };
}

/** The Man on Bench: silver hair under a moss flat cap, a long stone-grey coat; `glasses` gold rims. */
export function benchManLook({ glasses = false, glintOn = false } = {}) {
  return {
    height: 1.7, skin: C.skin, eyes: EYES, brows: C.silver_shade, hair: C.silver, featureScale: 1.15, eyeZ: 0.03,
    top: cloth(C.stone_mid, { noise: 0.1 }), sleeve: cloth(C.stone_mid, { noise: 0.1 }), skirt: cloth(C.stone_mid, { noise: 0.1 }), hem: 0.52, hemR: 0.21,
    legsMat: legsMat(C.stone_deep), shoes: C.wood_deep, headScale: 1.18, build: 1.02,
    hairNode: (s) => union(
      move(ellipsoid(0.07 * s, 0.097 * s, 0.06 * s, hairMat(C.silver, C.silver_light, 0.3)), -0.04 * s, 0, 0.0),
      flatCap(C.moss, s, C.moss_shade),
      ...(glasses ? [specs(C.brass_light, s, 0.028)] : []),
      ...(glintOn ? [glint([0.13 * s, -0.04 * s, 0.04 * s], 0.012 * s)] : []),
    ),
    extras: ({ k, shZ, waistZ, leanX }) => [
      capsule([0.05 * k + leanX * 0.6, -0.05 * k, shZ + 0.03 * k], [0.1 * k + leanX * 0.6, 0, shZ - 0.05 * k], 0.022 * k, body(C.white_shade)),
      capsule([0.05 * k + leanX * 0.6, 0.05 * k, shZ + 0.03 * k], [0.1 * k + leanX * 0.6, 0, shZ - 0.05 * k], 0.022 * k, body(C.white_shade)),
      capsule([0.13 * k + leanX * 0.3, 0, waistZ + 0.1 * k], [0.12 * k, 0, waistZ - 0.38 * k], 0.01 * k, body(C.stone_dark)),
    ],
  };
}

/** The Shopkeeper: round, bald with a ring of hair, a big mustache, a round apron. Palettes base, coral, mustard. */
export function shopkeeperLook(pal = 'base') {
  const P = {
    base: { skin: C.skin, hair: C.hair_black, hair2: C.hair_black_shade, shirt: C.teal, trousers: C.navy, apron: C.cream, eyes: EYES },
    coral: { skin: C.skin2, hair: C.hair_brown, hair2: C.hair_brown_shade, shirt: C.coral, trousers: C.wood, apron: C.white_light, eyes: '#3a2420' },
    mustard: { skin: C.skin3, hair: C.hair_black, hair2: C.hair_black_shade, shirt: C.mustard, trousers: C.iron, apron: C.sky_light, eyes: '#201418' },
  }[pal];
  return {
    height: 1.68, build: 1.18, skin: P.skin, eyes: P.eyes, brows: P.hair2, hair: P.hair, featureScale: 1.15, eyeZ: 0.035, mouth: P.hair,
    top: cloth(P.shirt), sleeve: cloth(P.shirt), trousers: cloth(P.trousers), shoes: C.wood_shade, headScale: 1.18,
    hairNode: (s) => union(ringHair(hairMat(P.hair, P.hair2, 0.3), s), mustache(P.hair, s, 1.4)),
    extras: ({ k, W, waistZ, shZ, leanX, z0 }) => [
      // A round belly and the round apron over it, tied at the neck.
      move(ellipsoid(0.15 * k, 0.17 * k * W, 0.17 * k, cloth(P.shirt)), 0.03 * k, 0, waistZ + 0.04 * k),
      intersect(move(ellipsoid(0.17 * k, 0.15 * k * W, 0.3 * k, cloth(P.apron, { noise: 0.05 })), 0.04 * k, 0, waistZ - 0.06 * k), boxAt(0.02 * k, -1, z0 + 0.4 * k, 1, 1, shZ - 0.06 * k, cloth(P.apron))),
      capsule([0.06 * k + leanX * 0.6, -0.08 * k, shZ + 0.02 * k], [0.12 * k + leanX * 0.3, -0.07 * k, shZ - 0.1 * k], 0.013 * k, cloth(P.apron)),
      capsule([0.06 * k + leanX * 0.6, 0.08 * k, shZ + 0.02 * k], [0.12 * k + leanX * 0.3, 0.07 * k, shZ - 0.1 * k], 0.013 * k, cloth(P.apron)),
    ],
  };
}

/** Ottilie Brask: tall and thin, brown hair up, spectacles, a long mustard scarf, a plum coat. */
export function ottilieLook() {
  const scarf = cloth(C.mustard, { noise: 0.12 });
  return {
    height: 1.76, build: 0.86, skin: C.skin, eyes: EYES, brows: C.hair_brown_shade, hair: C.hair_brown, featureScale: 1.15, eyeZ: 0.03,
    top: cloth(C.plum), sleeve: cloth(C.plum), skirt: cloth(C.plum), hem: 0.3, hemR: 0.19,
    legsMat: legsMat(C.navy), shoes: C.navy_shade, headScale: 1.16,
    hairNode: (s) => { const hm = hairMat(C.hair_brown, C.hair_brown_shade, 0.3); return union(capHair(hm, s), bun(hm, s, -0.06, 0.12, 0.06), specs(C.brass_shade, s, 0.03)); },
    extras: ({ k, W, shZ, waistZ, leanX }) => {
      const x = leanX * 0.6;
      return [
        // The scarf: wound at the neck, its two ends hanging down the front to the knees.
        place(torus(0.075 * k, 0.03 * k, scarf), { at: [x + 0.0, 0, shZ + 0.04 * k], ry: -0.2 }),
        roundCone([x + 0.1 * k, -0.06 * k, shZ], [0.15 * k * W + x * 0.3, -0.07 * k, waistZ - 0.32 * k], 0.03 * k, 0.026 * k, scarf),
        roundCone([x + 0.1 * k, 0.05 * k, shZ - 0.02 * k], [0.14 * k * W + x * 0.3, 0.05 * k, waistZ - 0.22 * k], 0.03 * k, 0.026 * k, scarf),
        // The coat's rose-lined lapels.
        capsule([x + 0.06 * k, -0.1 * k, shZ - 0.01 * k], [0.13 * k * W, -0.04 * k, waistZ + 0.08 * k], 0.016 * k, body(C.rose_shade)),
      ];
    },
  };
}

/** Captain Mott: a silver beard, a navy pea coat and captain's cap. */
export function mottLook() {
  const hm = hairMat(C.silver, C.silver_light, 0.3);
  const coat = cloth(C.navy, { noise: 0.1 });
  return {
    height: 1.7, build: 1.12, skin: C.skin2, eyes: '#3a2420', brows: C.silver, hair: C.silver, featureScale: 1.15, eyeZ: 0.03, mouth: C.silver_shade,
    top: coat, sleeve: coat, skirt: coat, hem: 0.66, hemR: 0.21, legsMat: legsMat(C.navy_shade), shoes: C.wood_deep, headScale: 1.18,
    hairNode: (s) => union(
      move(ellipsoid(0.07 * s, 0.097 * s, 0.06 * s, hm), -0.04 * s, 0, 0.0),
      beard(hm, s), mustache(C.silver_light, s, 1.2),
      captainCap(C.navy, s, { peak: C.navy_shade, badge: C.terra_light }),
    ),
    extras: ({ k, W, shZ, waistZ, leanX }) => {
      const x = leanX * 0.6;
      return [
        // A cream jersey collar at the throat; two rows of buttons on the pea coat.
        capsule([x + 0.02 * k, -0.07 * k, shZ + 0.04 * k], [x + 0.02 * k, 0.07 * k, shZ + 0.04 * k], 0.03 * k, cloth(C.cream)),
        ...[0, 1, 2].flatMap((i) => [-1, 1].map((sd) => move(sphere(0.012 * k, glaze(C.cream_shade)), 0.135 * k * W + x * 0.3, sd * 0.05 * k, waistZ + 0.2 * k - i * 0.12 * k))),
      ];
    },
  };
}

/** The Fishmonger: ginger hair up, a sky-striped shirt, a long grey rubber apron. */
export function fishmongerLook() {
  return {
    height: 1.64, build: 1.15, skin: C.skin2, eyes: '#3a2420', brows: C.hair_ginger_shade, hair: C.hair_ginger, featureScale: 1.15, eyeZ: 0.03,
    top: stripes(C.sky_light, C.sky, 0.04), sleeve: stripes(C.sky_light, C.sky, 0.04), trousers: cloth(C.navy), shoes: C.wood_shade, headScale: 1.18,
    hairNode: (s) => { const hm = hairMat(C.hair_ginger, C.hair_ginger_shade, 0.3); return union(capHair(hm, s), bun(hm, s, -0.11, 0.07, 0.06)); },
    extras: ({ k, W, waistZ, shZ, leanX, z0 }) => [
      intersect(move(ellipsoid(0.16 * k, 0.16 * k * W, 0.55 * k, glaze(C.white_shade, { spec: 0.35 })), 0.03 * k, 0, waistZ - 0.2 * k), boxAt(0.03 * k, -1, z0 + 0.22 * k, 1, 1, shZ - 0.07 * k, glaze(C.white_shade))),
      capsule([0.05 * k + leanX * 0.6, -0.08 * k, shZ + 0.02 * k], [0.12 * k + leanX * 0.3, -0.07 * k, shZ - 0.1 * k], 0.013 * k, glaze(C.white_deep)),
      capsule([0.05 * k + leanX * 0.6, 0.08 * k, shZ + 0.02 * k], [0.12 * k + leanX * 0.3, 0.07 * k, shZ - 0.1 * k], 0.013 * k, glaze(C.white_deep)),
    ],
  };
}

/** The Lighthouse Keeper: brown bob under a navy cap, a navy uniform coat with brass buttons, cream trousers. */
export function keeperLook() {
  const coat = cloth(C.navy, { noise: 0.08 });
  return {
    height: 1.66, build: 1.02, skin: C.skin, eyes: EYES, brows: C.hair_brown_shade, hair: C.hair_brown, featureScale: 1.15, eyeZ: 0.03,
    top: coat, sleeve: coat, skirt: coat, hem: 0.72, hemR: 0.2, legsMat: legsMat(C.cream), shoes: C.wood_shade, headScale: 1.18,
    hairNode: (s) => {
      const hm = hairMat(C.hair_brown, C.hair_brown_shade, 0.3);
      return union(capHair(hm, s), move(ellipsoid(0.07 * s, 0.105 * s, 0.07 * s, hm), -0.04 * s, 0, -0.04 * s), captainCap(C.navy, s, { peak: C.navy_shade, badge: C.brass_light }));
    },
    extras: ({ k, W, shZ, waistZ, leanX }) => {
      const x = leanX * 0.6;
      return [
        capsule([x + 0.05 * k, -0.05 * k, shZ + 0.03 * k], [x + 0.1 * k, 0, shZ - 0.04 * k], 0.02 * k, body(C.cream)),
        capsule([x + 0.05 * k, 0.05 * k, shZ + 0.03 * k], [x + 0.1 * k, 0, shZ - 0.04 * k], 0.02 * k, body(C.cream)),
        ...[0, 1, 2, 3].map((i) => move(sphere(0.012 * k, shiny(C.brass_light)), 0.135 * k * W + x * 0.4, 0, shZ - 0.08 * k - i * 0.1 * k)),
      ];
    },
  };
}

/** The Boatman: bald with a ring of white hair, a neat white mustache, a navy-and-cream striped jersey. */
export function boatmanLook({ sing = false } = {}) {
  return {
    height: 1.68, build: 1.12, skin: C.skin2, eyes: '#3a2420', brows: C.silver_light, hair: C.silver_light, featureScale: 1.2, eyeZ: 0.03, mouth: C.silver_light,
    top: stripes(C.navy, C.cream, 0.045), sleeve: stripes(C.navy, C.cream, 0.045), trousers: cloth(C.navy), shoes: C.wood_shade, headScale: 1.2,
    hairNode: (s) => union(ringHair(hairMat(C.silver_light, C.white_shade, 0.3), s), mustache(C.silver_light, s, 1.2), ...(sing ? [openMouth(s)] : [])),
  };
}

// ---------------------------------------------------------------------------
// Frame helpers for the sheets

const FIG = { post: POST.figure, shadow: true };
/** One figure frame. */
export const fig = (name, build) => frame(name, build, FIG);
/** `<dir>_0` stand and `<dir>_1…8` walk in four directions (prefix for `lamp_`, `coil_`). */
export function walkFrames(build, { prefix = '', amp = 1, dirs = DIRS4, n = 8 } = {}) {
  const out = [];
  for (const d of dirs) {
    out.push(fig(`${prefix}${d}_0`, () => build(d, {})));
    for (let i = 1; i <= n; i++) out.push(fig(`${prefix}${d}_${i}`, () => build(d, walkPose(i - 1, n, amp))));
  }
  return out;
}
export function walkAnims({ prefix = '', ms = 110, dirs = DIRS4, n = 8, name = (d) => `walk_${d}` } = {}) {
  return Object.fromEntries(dirs.map((d) => [name(d), { frames: Array.from({ length: n }, (_, i) => `${prefix}${d}_${i + 1}`), ms }]));
}
/** fall_down_0 (the jolt) and fall_down_1 (sat down hard, legs out), facing down. */
export function fallFrames(look, props0 = [], extra = {}) {
  const k = kOf(look);
  return [
    fig('fall_down_0', () => person(look, { ...FALL0, ...extra }, 'down', props0)),
    fig('fall_down_1', () => person(look, fallSitPose(look), 'down', [], -0.32 * k)),
  ];
}
/** An anim of named frames. */
export const anim = (frames, ms) => ({ frames, ms });

// ---------------------------------------------------------------------------
// Builders per character (dir, pose name, n) → SDF node

export function countingWoman(dir, pose = {}, kind = null, n = 0) {
  const look = countingWomanLook();
  if (kind === 'sit') {
    // Seated on a step 0.2 m up (one stair step), counting: nods, lips moving.
    const p = sitPose(look, 0.2, { nod: n ? 0.18 : 0.05, shL: 0.55, elL: 0.75, shR: n ? 0.9 : 0.55, elR: n ? 1.4 : 0.75 });
    return person({ ...look, mouth: n ? '#703040' : '#a05050' }, p, 'down');
  }
  if (kind === 'climb') {
    // Back view, a knee high, rising over the piano.
    const p = n ? { bob: 0.31, hipR: 1.3, kneeR: 1.6, hipL: -0.15, kneeL: 0.3, shL: 1.9, elL: 0.3, shR: 1.5, elR: 0.5, lean: 0.25 }
      : { bob: 0.19, hipL: 1.3, kneeL: 1.6, hipR: -0.1, kneeR: 0.25, shR: 1.9, elR: 0.3, shL: 1.5, elL: 0.5, lean: 0.25 };
    return person(look, p, 'up');
  }
  return person(look, pose, dir);
}

export function mover(who, dir, pose = {}, kind = null, n = 0) {
  const look = moverLook(who);
  if (kind === 'idle') return person(look, onHips(look, { blink: !!n, nod: n ? 0.08 : 0 }), 'down');
  if (kind === 'push') return person(look, { hipL: 0.55 + n * 0.08, kneeL: 0.5, hipR: -0.45 - n * 0.05, kneeR: 0.12, lean: 0.5, shL: 1.45, elL: 0.15 + n * 0.1, shR: 1.45, elR: 0.25 - n * 0.1, outL: 0.05, outR: 0.05, bob: -0.07 - n * 0.02, nod: 0.25 }, 'up');
  if (kind === 'lookup') return person(look, { nod: -0.5, lean: -0.1, shL: 0.1, elL: 0.3, shR: 0.1, elR: 0.3, outL: 0.25, outR: 0.25 }, 'down');
  if (kind === 'scrub') {
    const p = crouchPose(look);
    const k = kOf(look);
    return person(look, { ...p, ...grip(look, p, 1, [0.55 * k, (n ? 0.18 : -0.06) * k, 0.06]), ...grip(look, p, -1, [0.45 * k, -0.28 * k, 0.12]) }, dir);
  }
  if (kind === 'run') return person(look, runPose(n), dir);
  return person(look, pose, dir);
}

export function tourist(dir, pose = {}, kind = null, n = 0, hat = false) {
  const look = touristLook({ hat });
  if (kind === 'sit') {
    // Seated on a café chair (seat 0.45 m) facing up at the table, fanning herself with the guidebook.
    const p = sitPose(look, 0.45, { lean: 0.05, nod: -0.05 });
    const hc = headAt(look, p).c;
    const bookAt = add(hc, n ? [0.12, 0.2, -0.02] : [0.14, 0.12, 0.05]);
    const q = { ...p, ...grip(look, p, 1, bookAt), ...grip(look, p, -1, [0.38, -0.12, 0.74]) };
    const gb = place(book(C.cobalt, { crest: C.brass_light }), { at: add(bookAt, [0.02, 0.05, 0.05]), rz: n ? -0.9 : 0.5, rx: n ? -0.35 : 0.35 });
    return person(look, q, 'up', [gb]);
  }
  return person(look, pose, dir);
}

export function mayor(dir, pose = {}, kind = null, n = 0) {
  const look = mayorLook();
  const k = kOf(look);
  const finger = (p, side) => { const h = handAt(look, p, side, p.shR, p.elR, p.outR); const d = limbDir(p.shR + p.elR, p.outR * 0.6, side); return capsule(h, add(h, mul(d, 0.08)), 0.012, skinMat(look.skin)); };
  if (kind === 'gesture') {
    const p0 = n ? { shR: 1.2, elR: 0.15, outR: 1.15, nod: -0.1, lean: -0.04 } : { shR: 2.1, elR: 1.0, outR: 0.2, nod: -0.12 };
    const p = onHips(look, p0, [-1]);
    return person(look, p, 'down', [finger({ ...POSE0, ...p }, 1)]);
  }
  if (kind === 'argue') {
    const p0 = n ? { shR: 1.75, elR: 0.5, outR: 0.12, lean: 0.18, nod: 0.05, hipL: 0.2, kneeL: 0.15 } : { shR: 1.35, elR: 0.25, outR: 0.1, lean: 0.12, nod: -0.05 };
    const p = onHips(look, p0, [-1]);
    return person(look, p, dir, [finger({ ...POSE0, ...p }, 1)]);
  }
  void k;
  return person(look, { nod: -0.06, ...pose }, dir);
}

export function ambrose(dir, pose = {}, kind = null, n = 0) {
  const look = ambroseLook();
  const k = kOf(look);
  if (kind === 'sit') {
    // On the tower step (seat 0.22 m), his ledger open on his knees; frame 1 looks up and scowls.
    const p = sitPose(look, 0.22, { lean: 0.1, nod: n ? -0.22 : 0.3 });
    // The ledger lies open on his knees (just above the coat over the thighs).
    const hipZ = 0.86 * k + p.bob, kx = 0.42 * k * Math.sin(p.hipL), kz = hipZ - 0.42 * k * Math.cos(p.hipL);
    const at = [kx * 0.7, 0, kz + 0.13 * k + (n ? -0.02 : 0.02)];
    const q = { ...p, ...grip(look, p, -1, add(at, [0, -0.11, 0.02])), ...grip(look, p, 1, add(at, [0, 0.11, 0.02])) };
    return person({ ...look, brows: n ? '#e0e0f0' : look.brows }, q, 'down', [place(openBook(C.terra), { at, ry: -0.35 })]);
  }
  if (kind === 'ring') {
    // At the bell rope, from behind: hands high (0), hauling down (1), lifted on the upswing (2).
    const hz = [1.95, 1.3, 2.08][n] * k, bob = [0, -0.06, 0.05][n];
    const p = { lean: [0.02, 0.18, -0.04][n], bob, kneeL: n === 1 ? 0.35 : 0.05, kneeR: n === 1 ? 0.3 : 0.05, hipL: n === 1 ? 0.2 : 0, hipR: n === 1 ? 0.15 : 0, nod: [-0.3, 0.1, -0.4][n] };
    const rx = 0.24 * k;
    const q = { ...p, ...grip(look, p, -1, [rx, -0.02, hz + 0.08]), ...grip(look, p, 1, [rx, 0.02, hz - 0.06]) };
    const rope = mat(C.wood_light, { tag: 'body', spec: 0.1 });
    const sally = mat((x, y, z) => (Math.floor(z / 0.04) % 2 ? hex(C.terra) : hex(C.cream)), { tag: 'body', spec: 0.05 });
    return person(look, q, 'up', [
      capsule([rx, 0, hz + 0.15], [rx, 0, 2.6 * k], 0.02, rope),
      capsule([rx, 0, hz - 0.17], [rx, 0, hz + 0.17], 0.042, sally),
      roundCone([rx, 0, hz - 0.15], [rx + 0.05, 0.03, hz - 0.65], 0.014, 0.012, rope),
    ]);
  }
  if (kind === 'ledger') {
    const p = { lean: 0.08, nod: 0.05 };
    const at = [0.42 * k, 0, 1.12 * k];
    const q = { ...p, ...grip(look, p, -1, add(at, [-0.02, -0.08, -0.05])), ...grip(look, p, 1, add(at, [-0.02, 0.08, -0.05])) };
    return person(look, q, 'down', [place(ledger(), { at, ry: -0.25 })]);
  }
  return person(look, { lean: 0.06, ...pose }, dir);
}

export function basinWoman(dir, pose = {}, kind = null, n = 0) {
  const look = basinWomanLook();
  const k = kOf(look);
  const tilt = kind === 'tip' ? (n ? 0.55 : 0.3) : 0;
  const c = [0.33 * k, 0, 0.92 * k];
  const p = { lean: 0.04, nod: 0.12 };
  const q = { ...p, ...grip(look, p, -1, add(c, [-0.03, -0.2 * k, 0.02])), ...grip(look, p, 1, add(c, [-0.03, 0.2 * k, 0.02])) };
  const ir = mat(C.iron_light, { tag: 'body', spec: 0.5, shin: 30 });
  const basin = union(
    subtract(intersect(ellipsoid(0.24, 0.24, 0.1, ir), boxAt(-1, -1, -0.1, 1, 1, 0.03, ir)), move(ellipsoid(0.215, 0.215, 0.09, ir), 0, 0, 0.012), ir),
    move(torus(0.228, 0.012, ir), 0, 0, 0.025),
    move(cylinder(0.205, -0.02, 0.01 - tilt * 0.03, glaze(C.water_light, { spec: 0.6 })), 0, 0, 0),
  );
  const parts = [place(basin, { at: c, ry: tilt })];
  if (kind === 'tip') {
    // The water pours off the far rim.
    const lip = [c[0] + 0.22 * Math.cos(tilt), 0, c[2] - 0.22 * Math.sin(tilt)];
    const w = glow(C.water_light, 0.25);
    const len = n ? 1 : 0.5;
    parts.push(roundCone(lip, add(lip, [0.07, 0, -0.35 * len]), 0.03, 0.02, w));
    if (n) parts.push(roundCone(add(lip, [0.07, 0, -0.35]), add(lip, [0.1, 0, -c[2] + 0.06]), 0.02, 0.035, w), move(ellipsoid(0.14, 0.12, 0.015, w), lip[0] + 0.1, 0, 0.012));
    else parts.push(move(sphere(0.022, w), lip[0] + 0.1, 0.03, lip[2] - 0.32));
  }
  return person(look, q, 'down', parts);
}

/** The Skipping Girls. kind: 'turn' (dir right/left, n 0 hand up / 1 hand down), 'jump' (n 0 up / 1 landed). */
export function girl(pal, dir, pose = {}, kind = null, n = 0) {
  const look = girlLook(pal);
  const k = kOf(look);
  if (kind === 'turn') {
    const p = { nod: -0.05 };
    const hand = [0.32 * k, 0.05, (n ? 0.62 : 0.95) * k];
    const q = { ...p, ...grip(look, p, 1, hand), shL: 0.15, elL: 0.6, outL: 0.25 };
    const rope = mat(C.wood_light, { tag: 'body', spec: 0.1 });
    return person(look, q, dir, [capsule(add(hand, [0, 0, 0]), add(hand, [0.12, 0, n ? -0.08 : 0.1]), 0.022, mat(C.wood, { tag: 'body' })), capsule(add(hand, [0.1, 0, n ? -0.06 : 0.08]), add(hand, [0.28, 0, n ? -0.1 : 0.16]), 0.016, rope)]);
  }
  if (kind === 'jump') {
    const p = n ? { hipL: 0.35, hipR: 0.3, kneeL: 0.6, kneeR: 0.55, bob: -0.07, shL: 0.3, shR: 0.3, elL: 0.9, elR: 0.9, outL: 0.5, outR: 0.5, lean: 0.08 }
      : { hipL: 0.6, hipR: 0.5, kneeL: 1.3, kneeR: 1.2, bob: 0.2, shL: 0.5, shR: 0.5, elL: 0.7, elR: 0.7, outL: 0.7, outR: 0.7, nod: -0.1 };
    return person(look, p, 'down');
  }
  return person(look, pose, dir);
}

/**
 * The skipping rope between the two turners, at phase n (0 over their heads, 1 in
 * front, 2 on the ground, 3 behind). Built along x (the turners face each other
 * east-west, two tiles apart), centered on the jumper's tile.
 */
export function skippingRope(n) {
  const rope = mat(C.wood_light, { tag: 'body', spec: 0.12 });
  // The rope swings round the line between the turners' hands (0.62 m up, the
  // girls' hands 0.33 m in from their tile centers), bellying out by `amp`.
  const ends = 0.67, hz = 0.62;
  const ang = [0, PI / 2, PI, -PI / 2][n];
  const amp = n === 2 ? hz - 0.03 : 0.72;
  const pts = [];
  for (let i = 0; i <= 12; i++) {
    const t = i / 12, x = -ends + 2 * ends * t, a = Math.sin(PI * t);
    // On the ground it lies flat along the middle instead of dipping under the floor.
    const aa = n === 2 ? Math.min(1, a * 1.6) : a;
    pts.push([x, Math.sin(ang) * aa * amp, hz + Math.cos(ang) * aa * amp]);
  }
  const segs = [];
  for (let i = 0; i < 12; i++) segs.push(capsule(pts[i], pts[i + 1], 0.018, rope));
  return union(segs);
}

export function wateringWoman(glasses, dir, pose = {}, kind = null, n = 0) {
  const look = wateringWomanLook({ glasses });
  const k = kOf(look);
  if (kind === 'water') {
    // The can held out and tipped, drops falling from the rose.
    const tip = n ? 0.75 : 0.5;
    const hand = [0.34 * k, 0.12, 0.88 * k];
    const p = { lean: 0.06, nod: 0.25 };
    const q = { ...p, ...grip(look, p, 1, hand), shL: 0.1, elL: 0.3 };
    const can = place(move(wateringCan(), 0.0, 0, -0.18), { at: hand, ry: tip });
    const rose = add(hand, [0.23 * Math.cos(tip) + 0.02 * Math.sin(tip), 0, 0.2 * Math.cos(tip) - 0.18 - 0.23 * Math.sin(tip)]);
    const w = glow(C.water_light, 0.3);
    const drops = [];
    for (let i = 0; i < 6; i++) drops.push(move(sphere(0.016, w), rose[0] + 0.02 + (i % 3) * 0.025, ((i * 7) % 5 - 2) * 0.02, rose[2] - 0.06 - ((i + n * 3) % 6) * 0.07));
    return person(look, q, 'down', [can, ...drops]);
  }
  const hand = [0.08 * k, 0.26 * k, 0.72 * k];
  const q = { ...pose, ...grip(look, pose, 1, hand) };
  return person(look, q, dir, [place(move(wateringCan(), 0, 0, -0.18), { at: hand, ry: 0.05 })]);
}

/** The Man on Bench. kind: 'sit' (n 0/1 turns the page), 'stand', 'look' (over a rail), 'fall'. */
export function benchMan(glasses, kind, n = 0) {
  const look = benchManLook({ glasses, glintOn: kind === 'look' && n === 1 });
  const k = kOf(look);
  if (kind === 'sit') {
    // Seated on the bench (seat 0.45 m), facing down. Without glasses the paper hides his face;
    // with them it is lowered to his chest so his face shows over it.
    const p = sitPose(look, 0.45, { lean: 0.05, nod: glasses ? 0.15 : 0 });
    const hc = headAt(look, p).c;
    const at = glasses ? [0.36 * k, 0, hc[2] - 0.4] : [0.3 * k, 0, hc[2] - 0.04];
    const q = { ...p, ...grip(look, p, -1, add(at, [-0.03, -0.2, -0.02])), ...grip(look, p, 1, add(at, n ? [-0.08, 0.12, 0.02] : [-0.03, 0.2, -0.02])) };
    return person(look, q, 'down', [place(newspaper(n), { at })]);
  }
  if (kind === 'stand') {
    // Standing, the paper folded under his left arm.
    const p = { shL: 0.15, elL: 1.3, outL: 0.18 };
    return person(look, p, 'down', [place(box(0.12, 0.018, 0.08, paperMat(), 0.005), { at: [0.02 * k, -0.235 * k, 1.07 * k], rz: 0.1, ry: 0.3 })]);
  }
  if (kind === 'look') {
    // Head dipped, looking down over a rail, his hands on it.
    const p = { lean: 0.2, nod: 0.5 };
    const q = { ...p, ...grip(look, p, -1, [0.36 * k, -0.18, 1.0 * k]), ...grip(look, p, 1, [0.36 * k, 0.18, 1.0 * k]) };
    return person(look, q, 'down');
  }
  return person(look, {}, 'down');
}

export function shopkeeper(pal, dir, pose = {}, kind = null, n = 0) {
  const look = shopkeeperLook(pal);
  const k = kOf(look);
  if (kind === 'idle') {
    // Hands folded on the apron; frame 1 rubs them together and blinks.
    const p = { blink: !!n };
    const c = [0.27 * k, 0, 0.98 * k];
    return person(look, { ...p, ...grip(look, p, -1, add(c, [0, n ? -0.01 : -0.035, n ? 0.02 : 0])), ...grip(look, p, 1, add(c, [0, n ? 0.04 : 0.035, n ? -0.01 : 0])) }, dir);
  }
  return person(look, pose, dir);
}

/** Ottilie. kind: 'lamp' (walk/stand with her lamp), 'lampIdle' (n flicker), 'teacup' (n 0 holding / 1 sipping). */
export function ottilie(dir, pose = {}, kind = null, n = 0) {
  const look = ottilieLook();
  const k = kOf(look);
  if (kind === 'lamp') {
    const p = { ...pose, shR: 0.3, elR: 0.35, outR: 0.12 };
    const h = handAt(look, p, 1, p.shR, p.elR, p.outR);
    return person(look, p, dir, [place(lantern(1), { at: add(h, [0, 0, -0.03]) })]);
  }
  if (kind === 'lampIdle') {
    const p = { nod: 0.15 };
    const h = [0.34 * k, 0.06, 1.05 * k];
    const q = { ...p, ...grip(look, p, 1, h), ...grip(look, p, -1, add(h, [-0.02, -0.12, -0.18])) };
    return person(look, q, 'down', [place(lantern(n ? 0.6 : 1), { at: add(h, [0, 0, -0.03]) })]);
  }
  if (kind === 'teacup') {
    const p = { nod: n ? -0.1 : 0.12 };
    const hc = headAt(look, p).c;
    const sau = [0.27 * k, -0.02, 1.0 * k];
    const cup = n ? add(hc, [0.16, 0.0, -0.11]) : add(sau, [0, 0, 0.01]);
    const q = { ...p, ...grip(look, p, -1, add(sau, [-0.02, -0.03, -0.02])), ...grip(look, p, 1, add(cup, [-0.02, 0.05, 0.02])) };
    return person(look, q, 'down', [move(saucer(), ...sau), place(teacup(), { at: cup, ry: n ? 0.6 : 0 })]);
  }
  return person(look, pose, dir);
}

/** Captain Mott. kind: 'coil' (walking with the copper coil), 'sit' (on his crates), 'jug'/'mug' (raised, n 0/1). */
export function mott(dir, pose = {}, kind = null, n = 0) {
  const look = mottLook();
  const k = kOf(look);
  if (kind === 'coil') {
    const p = { ...pose, shL: 0, shR: 0, elL: 0, elR: 0 };
    const c = [0.3 * k, 0, 1.02 * k + (p.bob ?? 0)];
    const q = { ...p, ...grip(look, p, -1, add(c, [-0.02, -0.12, -0.04])), ...grip(look, p, 1, add(c, [-0.02, 0.12, -0.04])) };
    return person(look, q, dir, [move(copperCoil(), ...c)]);
  }
  if (kind === 'sit') {
    // Sitting sober on his crates (seat 0.45 m), hands on his knees; frame 1 a slow nod.
    const p = sitPose(look, 0.45, { lean: 0.15, nod: n ? 0.35 : 0.1 });
    const knees = [0.45 * k, 0.1, 0.45 + 0.12];
    return person(look, { ...p, ...grip(look, p, -1, [knees[0], -0.12, knees[2]]), ...grip(look, p, 1, [knees[0], 0.12, knees[2]]) }, 'down');
  }
  if (kind === 'jug' || kind === 'mug') {
    // Raised to the moon: the empty jug (Act 2) or a mug of tea (the climax).
    const p = { nod: n ? -0.35 : -0.2, lean: -0.04, shL: -0.1, elL: 2.1, outL: 0.7 };
    const at = n ? [0.18 * k, 0.16, 2.02 * k] : [0.24 * k, 0.2, 1.88 * k];
    const q = { ...p, ...grip(look, p, 1, at) };
    const thing = kind === 'jug' ? place(squareJug(), { at: add(at, [0, 0, 0.04]), ry: -0.3 }) : place(mug(n), { at: add(at, [0, 0, 0.03]) });
    return person(look, q, 'down', [thing]);
  }
  return person(look, pose, dir);
}

export function fishmonger(dir, pose = {}, kind = null, n = 0) {
  const look = fishmongerLook();
  const k = kOf(look);
  if (kind === 'give') {
    const p = { lean: n ? 0.12 : 0.04 };
    const c = n ? [0.5 * k, 0, 0.78 * k] : [0.36 * k, 0, 0.72 * k];
    const q = { ...p, ...grip(look, p, -1, add(c, [0, -0.13, 0.2])), ...grip(look, p, 1, add(c, [0, 0.13, 0.2])) };
    return person(look, q, 'down', [move(bucket(), ...c), capsule(add(c, [0, -0.12, 0.2]), add(c, [0, 0.12, 0.2]), 0.01, mat(C.wood_light, { tag: 'body' }))]);
  }
  return person(look, pose, dir);
}

/** The Lighthouse Keeper. kind: polish, window, shade, scopeUp, scopeDown, hold. */
export function keeper(dir, pose = {}, kind = null, n = 0) {
  const look = keeperLook();
  const k = kOf(look);
  const cl = mat(C.cream, { tag: 'body' });
  if (kind === 'polish') {
    const p = { lean: 0.1, nod: 0.15 };
    const h = [0.4 * k, n ? 0.12 : -0.06, 1.12 * k];
    const q = { ...p, ...grip(look, p, 1, h), ...grip(look, p, -1, [0.36 * k, -0.2, 1.08 * k]) };
    return person(look, q, 'up', [move(ellipsoid(0.05, 0.06, 0.035, cl), ...add(h, [0.02, 0, 0]))]);
  }
  if (kind === 'window') {
    const p = { lean: n ? 0.15 : 0.04, nod: 0.05 };
    const hc = headAt(look, p).c;
    return person(look, { ...p, ...grip(look, p, -1, add(hc, [0.12, -0.03, 0.08])), shR: 0.05, elR: 0.3 }, 'up');
  }
  if (kind === 'shade') {
    const p = { nod: -0.05, turn: n ? 0.3 : 0 };
    const hc = headAt(look, p).c;
    return person(look, onHips(look, { ...p, ...grip(look, p, 1, add(hc, [0.13, 0.02, 0.08])) }, [-1]), 'down');
  }
  if (kind === 'scopeUp' || kind === 'scopeDown') {
    const up = kind === 'scopeUp';
    const ang = up ? 0.35 + n * 0.04 : -0.04;
    const yaw = up ? n * 0.06 : 0;
    const p = { nod: -ang * 0.6 };
    const { c: hc, hs } = headAt(look, p);
    const eye = add(hc, [0.11 * hs, 0.036 * hs, 0.012 * hs]);
    const d = [Math.cos(ang) * Math.cos(yaw), Math.sin(yaw), Math.sin(ang)];
    const q = { ...p, ...grip(look, p, 1, add(add(eye, mul(d, 0.1)), [0, 0.02, -0.04])), ...grip(look, p, -1, add(add(eye, mul(d, 0.34)), [0, -0.01, -0.04])) };
    const scope = place(telescope(), { at: eye, ry: -ang, rz: yaw });
    const parts = [scope];
    if (!up) parts.push(glint(add(eye, add(mul(d, 0.53), [0, n ? 0.012 : -0.012, n ? 0.012 : -0.008])), 0.008));
    return person(look, q, up ? 'up' : 'down', parts);
  }
  if (kind === 'hold') {
    const a = [0.2 * k, -0.2, 0.86 * k], b = [0.2 * k, 0.22, 1.22 * k];
    const dir3 = [b[0] - a[0], b[1] - a[1], b[2] - a[2]], L = Math.hypot(...dir3);
    const at = (t) => add(a, mul(dir3, t));
    const q = { ...grip(look, {}, -1, at(0.3)), ...grip(look, {}, 1, at(0.75)) };
    const yaw = Math.atan2(dir3[1], dir3[0]), pitch = Math.atan2(dir3[2], Math.hypot(dir3[0], dir3[1]));
    void L;
    return person(look, q, 'down', [place(telescope(), { at: a, rz: yaw, ry: -pitch })]);
  }
  return person(look, pose, dir);
}

// ---------------------------------------------------------------------------
// The Boatman in his rowing boat (boat and man are one sprite, as in the SNES).

// A clinker-built wooden dinghy, like the harbor's brown rowboat: overlapping strakes (each
// plank's lower edge stands proud, so every lap catches the light above a dark line), painted
// brown with a cobalt top strake, the paint worn through to grey-gold wood along the laps and
// at the waterline, and a varnished wooden gunwale capping the sheer.
function rowingBoat() {
  const ST = 0.055; // strake width (height on the side)
  // (In the boat's own frame, so the paint rides with the hull as it bobs and rolls.)
  const paint = mat((wx, wy, wz, x, y, z) => {
    const f = ((z / ST) % 1 + 1) % 1, k = Math.floor(z / ST);
    const blue = z > 0.235;
    let c = hex(blue ? '#3c5c94' : '#7a5236');
    c = c.map((v) => v * (0.9 + vnoise(x * 6, k * 3.1, 2) * 0.14));
    // Worn paint: bare weathered wood showing in patches, most along each lap and low down.
    const wear = fbm(x * 9, z * 30, y * 4, 2) + (f > 0.8 ? 0.18 : 0) + (z < 0.06 ? 0.15 : 0);
    if (wear > 0.68) c = mix(c, hex('#a89070'), Math.min(0.8, (wear - 0.68) * 5));
    if (f < 0.18) c = c.map((v) => v * 0.55); // the shadowed lap under the plank above
    if (z < 0.085) c = mix(c, hex('#3a4038'), 0.5); // weed at the waterline
    return c;
  }, { tag: 'body', spec: 0.12, shin: 14 });
  const inside = woodMat(C.wood);
  const shellE = ellipsoid(0.98, 0.4, 0.42, paint);
  // The laps: each strake's lower edge stands out a little from the one below.
  const laps = { b: shellE.b.map((v, i) => (i < 3 ? v - 0.01 : v + 0.01)),
    dist(x, y, z) { const f = ((z / ST) % 1 + 1) % 1; return shellE.dist(x, y, z) - 0.014 * (1 - f); },
    near(x, y, z) { return shellE.near(x, y, z); } };
  const hull = intersect(laps, boxAt(-1, -1, 0, 1, 1, 0.29, paint));
  const hollow = subtract(hull, move(ellipsoid(0.92, 0.35, 0.36, inside), 0, 0, 0.04), inside);
  const gun = mat((x, y, z) => hex('#9a6a3a').map((v) => v * (0.88 + fbm(x * 20, y * 4, 3, 2) * 0.22)), { tag: 'body', spec: 0.35, shin: 26 });
  const gunwale = intersect(subtract(ellipsoid(1.0, 0.425, 0.445, gun), ellipsoid(0.93, 0.36, 0.38, gun), gun), boxAt(-1.1, -1, 0.27, 1.1, 1, 0.31, gun));
  return union(
    hollow, gunwale,
    intersect(ellipsoid(0.92, 0.35, 0.36, inside), boxAt(-1, -1, 0.03, 1, 1, 0.07, inside)), // the bottom boards
    boxAt(-0.08, -0.33, 0.2, 0.08, 0.33, 0.24, woodMat(C.wood_light), 0.01), // the thwart he sits on
    boxAt(-0.75, -0.2, 0.2, -0.62, 0.2, 0.235, woodMat(C.wood_light), 0.01),
    capsule([0.45, -0.34, 0.31], [0.85, -0.42, 0.1], 0.018, woodMat(C.wood_light)), // an oar shipped along the side
  );
}

/** n: rock phase 0..3; sing: chin up, mouth open. The boat lies along x, centered on the anchor; he sits facing along it toward +x (grid right), turned three-quarters to the camera. */
export function boatman({ rock = 0, sing = false } = {}) {
  const look = boatmanLook({ sing });
  const k = kOf(look);
  const p = sitPose(look, 0.24, { nod: sing ? -0.3 : 0.02, shL: 0.6, elL: 1.0, shR: 0.6, elR: 1.0, outL: 0.3, outR: 0.3, lean: sing ? -0.08 : 0.02 });
  if (sing) Object.assign(p, { shL: 0.3, elL: 0.9, outL: 0.6, shR: 1.1, elR: 1.4, outR: 0.6 });
  const man = figure(look, p); // facing the stern (+x, grid right), legs along the boat
  void k;
  const ph = (rock / 4) * PI * 2;
  const roll = Math.sin(ph) * 0.045, bob = Math.cos(ph) * 0.02 - 0.05;
  const all = union(rowingBoat(), move(man, -0.04, 0, 0));
  // Clip at the waterline: the hull sits in the water of the tile it's drawn on.
  return intersect(place(all, { at: [0, 0, bob], rx: roll }), boxAt(-2, -2, 0, 2, 2, 3, mat(C.water, { tag: 'body' })));
}

// ---------------------------------------------------------------------------
// The goats (white, and the brown one): a walk and grazing.

const clamp01 = (v) => Math.max(0, Math.min(1, v));

export function goat(dir, { pal = 'white', walk = -1, eat = -1 } = {}) {
  // Coat: an off-white (or brown) that the light can model, a little darker and cooler on the
  // belly and the inside of the legs, the lower legs greyer (or near-black on the brown goat), and
  // a soft broken texture of tufts (low contrast, so it reads as fur, not noise).
  const brown = pal === 'brown';
  const P = brown
    ? { fur: '#9a6640', furD: '#5e3c28', sock: '#3a2a22', nose: '#3a2a26', ear: '#7a4e34', beard: '#3a2820', horn: '#5a4a3c' }
    : { fur: '#e6e1d4', furD: '#a8a4ac', sock: '#b4aca0', nose: '#7a5a58', ear: '#c8b0a8', beard: '#b0a898', horn: '#6e665c' };
  const fur = mat((x, y, z) => {
    const n = fbm(x * 14, y * 14, z * 14, 2);
    let c = mix(hex(P.fur), hex(P.furD), clamp01((0.42 - z) * 2.6) * 0.55 + (n - 0.5) * 0.25);
    if (z < 0.2) c = mix(c, hex(P.sock), clamp01((0.2 - z) * 8) * 0.7);
    return c;
  }, { tag: 'body', spec: 0.04, shin: 8 });
  const horn = mat((x, y, z, lx, ly, lz) => mix(hex(P.horn), hex('#c8bca8'), clamp01((lz - 0.1) * 12) * 0.5), { tag: 'body', spec: 0.35, shin: 24 });
  const hoof = mat('#2c2424', { tag: 'body', spec: 0.3, shin: 20 });
  const eyeM = mat('#241a14', { tag: 'body', spec: 0.9, shin: 50 });
  const noseM = mat(P.nose, { tag: 'body', spec: 0.4, shin: 30 });
  const earM = mat(P.ear, { tag: 'body', spec: 0.04 });
  const beardM = mat(P.beard, { tag: 'body', spec: 0.03 });
  const ph = walk >= 0 ? (walk / 8) * PI * 2 : 0, s = walk >= 0 ? Math.sin(ph) : 0;
  const legs = [];
  for (const [x, y, sg] of [[0.24, -0.09, 1], [0.24, 0.09, -1], [-0.22, -0.09, -1], [-0.22, 0.09, 1]]) {
    const sw = s * sg * 0.12;
    const top = [x, y, 0.34], foot = [x + sw, y, 0.03 + Math.max(0, s * sg) * 0.04];
    legs.push(roundCone(top, foot, 0.045, 0.026, fur), move(cylinder(0.03, -0.01, 0.045, hoof, 0.008), foot[0] + 0.008, foot[1], foot[2] - 0.03));
  }
  const bodyN = smooth(0.06, move(ellipsoid(0.33, 0.16, 0.17, fur), 0, 0, 0.43), move(ellipsoid(0.13, 0.14, 0.15, fur), 0.18, 0, 0.46));
  // The head: up and forward, or down to the grass when eating.
  const down = eat >= 0;
  const neckTop = down ? [0.47, 0, 0.18 + (eat ? 0.03 : 0)] : [0.42, 0, 0.7 + s * 0.01];
  const headRot = down ? 1.25 : 0.35;
  // The head (local +x forward): skull, a long muzzle tapering to a dark nose, eyes set wide
  // under the brow, ears held out sideways, horns sweeping back, and the beard under the chin.
  const hparts = [
    move(ellipsoid(0.1, 0.068, 0.078, fur), 0.03, 0, 0.01),
    roundCone([0.06, 0, -0.005], [0.17, 0, -0.04], 0.056, 0.04, fur),
    move(ellipsoid(0.026, 0.036, 0.024, noseM), 0.2, 0, -0.04), // nose and lips
    roundCone([0.13, 0, -0.07], [0.115, 0, -0.17 - (down && eat ? 0.02 : 0)], 0.026, 0.01, beardM), // the beard
  ];
  for (const s of [-1, 1]) {
    hparts.push(move(sphere(0.021, eyeM), 0.075, s * 0.058, 0.03)); // eye
    hparts.push(place(ellipsoid(0.075, 0.024, 0.034, earM), { at: [-0.02, s * 0.1, 0.0], rz: s * 0.7, rx: s * 0.35 })); // ear, out and a little down
    hparts.push(roundCone([0.0, s * 0.03, 0.07], [-0.07, s * 0.045, 0.15], 0.024, 0.016, horn), roundCone([-0.07, s * 0.045, 0.15], [-0.15, s * 0.065, 0.14], 0.016, 0.006, horn));
  }
  const head = place(union(hparts), { at: neckTop, ry: headRot });
  const neck = roundCone([0.25, 0, 0.48], down ? add(neckTop, [-0.03, 0, 0.05]) : neckTop, 0.08, 0.06, fur);
  const tail = roundCone([-0.31, 0, 0.52], [-0.37, 0, 0.62], 0.03, 0.015, fur);
  const g = union(bodyN, neck, head, tail, ...legs);
  return facing(move(g, -0.03, 0, 0), dir);
}

// ---------------------------------------------------------------------------
// Frame lists shared by the sheets of characters with palette swaps (one iso
// sheet per swap, all with the same frames).

const pair = (base) => [`${base}_0`, `${base}_1`];

export function moverFrames(who) {
  const look = moverLook(who);
  const out = walkFrames((d, p) => mover(who, d, p));
  out.push(fig('idle_down_0', () => mover(who, 'down', {}, 'idle', 0)), fig('idle_down_1', () => mover(who, 'down', {}, 'idle', 1)));
  out.push(fig('push_up_0', () => mover(who, 'up', {}, 'push', 0)), fig('push_up_1', () => mover(who, 'up', {}, 'push', 1)));
  out.push(fig('lookup_down', () => mover(who, 'down', {}, 'lookup')));
  for (const d of ['down', 'up']) for (const n of [0, 1]) out.push(fig(`scrub_${d}_${n}`, () => mover(who, d, {}, 'scrub', n)));
  for (const d of DIRS4) for (let i = 0; i < 8; i++) out.push(fig(`run_${d}_${i}`, () => mover(who, d, {}, 'run', i)));
  out.push(...fallFrames(look));
  return out;
}
export function moverAnims() {
  return {
    ...walkAnims({ ms: 115 }),
    idle_down: anim(pair('idle_down'), [1800, 600]),
    push_up: anim(pair('push_up'), 220),
    scrub_down: anim(pair('scrub_down'), 160),
    scrub_up: anim(pair('scrub_up'), 160),
    ...Object.fromEntries(DIRS4.map((d) => [`run_${d}`, anim(Array.from({ length: 8 }, (_, i) => `run_${d}_${i}`), 70)])),
  };
}

export function girlFrames(pal) {
  return [
    fig('down_0', () => girl(pal, 'down', {})),
    ...['right', 'left'].flatMap((d) => [0, 1].map((n) => fig(`turn_${d}_${n}`, () => girl(pal, d, {}, 'turn', n)))),
    fig('jump_down_0', () => girl(pal, 'down', {}, 'jump', 0)), fig('jump_down_1', () => girl(pal, 'down', {}, 'jump', 1)),
    ...fallFrames(girlLook(pal)),
  ];
}
export const girlAnims = () => ({ turn_left: anim(pair('turn_left'), 220), turn_right: anim(pair('turn_right'), 220), jump_down: anim(pair('jump_down'), 220) });

export function shopkeeperFrames(pal) {
  const out = walkFrames((d, p) => shopkeeper(pal, d, p), { amp: 0.85 });
  for (const d of DIRS4) out.push(fig(`idle_${d}_0`, () => shopkeeper(pal, d, {}, 'idle', 0)), fig(`idle_${d}_1`, () => shopkeeper(pal, d, {}, 'idle', 1)));
  out.push(...fallFrames(shopkeeperLook(pal)));
  return out;
}
export const shopkeeperAnims = () => ({ ...walkAnims({ ms: 120 }), ...Object.fromEntries(DIRS4.map((d) => [`idle_${d}`, anim(pair(`idle_${d}`), [1600, 500])])) });

export function goatFrames(pal) {
  const out = [];
  for (const d of DIRS4) {
    out.push(fig(`${d}_0`, () => goat(d, { pal })));
    for (let i = 1; i <= 8; i++) out.push(fig(`${d}_${i}`, () => goat(d, { pal, walk: i - 1 })));
  }
  for (const d of ['left', 'right', 'down']) for (const n of [0, 1]) out.push(fig(`eat_${d}_${n}`, () => goat(d, { pal, eat: n })));
  return out;
}
export const goatAnims = () => ({ ...walkAnims({ ms: 120 }), eat_left: anim(pair('eat_left'), 300), eat_right: anim(pair('eat_right'), 300), eat_down: anim(pair('eat_down'), 300) });
