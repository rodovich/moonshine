// A posable human figure for the isometric sprites.
//
// The figure is built facing +x (east) with its feet at the origin; +y is its
// right-hand side (the world is x east, y south, z up). `figure(look, pose)`
// returns an SDF node; turn it with `facing(node, dir)`.
//
// `look` describes the person (sizes, colors, clothes); `pose` the joint
// angles (radians). Angles: hip and shoulder swing forward (+) and back (−),
// knees bend back, elbows bend forward, `out` raises an arm sideways.

import { sphere, ellipsoid, capsule, roundCone, union, smooth, place, move, squash, frustum, boxAt, box, custom, subtract, torus, intersect } from '../lib/sdf.mjs';
import { mat, hex, mix } from '../lib/render.mjs';
import { fbm, vnoise } from '../lib/noise.mjs';

export const DIRS = { right: 0, down: Math.PI / 2, left: Math.PI, up: -Math.PI / 2 };
export const facing = (node, dir) => place(node, { rz: typeof dir === 'number' ? dir : DIRS[dir] });

const add = (a, b) => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
const mul = (a, s) => [a[0] * s, a[1] * s, a[2] * s];

/** Direction of a limb hanging down, swung forward by `fwd` (about y) and outward by `out` (toward ±y). */
function limbDir(fwd, out, side) {
  const s = Math.sin(fwd), c = Math.cos(fwd);
  const so = Math.sin(out), co = Math.cos(out);
  return [s * co, side * so, -c * co];
}

/** A fabric material with a little weave noise and soft folds. */
export function cloth(base, opts = {}) {
  const c = hex(base);
  const amt = opts.noise ?? 0.08;
  return mat((x, y, z, lx, ly, lz) => {
    const n = fbm(lx * 22, ly * 22, lz * 22, 2);
    const k = 1 + (n - 0.5) * amt * 2;
    return [c[0] * k, c[1] * k, c[2] * k];
  }, { tag: opts.tag ?? 'body', spec: opts.spec ?? 0.04, shin: 8 });
}

export function skinMat(base, opts = {}) {
  const c = hex(base), warm = hex('#d87868');
  return mat((x, y, z, lx, ly, lz) => {
    const n = fbm(lx * 25 + 3, ly * 25, lz * 25, 2);
    return mix(c, warm, Math.max(0, n - 0.55) * 0.5).map((v) => v * (0.96 + n * 0.08));
  }, { tag: 'skin', spec: 0.12, shin: 14, ...opts });
}

/**
 * Build a figure.
 * look: {
 *   height, skin, hair, hairStreak, eyes, top, topTrim, sleeve, skirt|trousers, hem (z), shoes, legs (stocking color),
 *   build (width scale), headScale, hairStyle ('bun' | 'cap' | 'scarf' | 'spiky' | 'short'), extras(parts, j) → nodes
 * }
 */
export function figure(look, pose = {}) {
  const H = look.height ?? 1.65;
  const k = H / 1.65; // everything scales with height
  const W = look.build ?? 1;
  const p = { hipL: 0, hipR: 0, kneeL: 0.05, kneeR: 0.05, shL: 0, shR: 0, elL: 0.2, elR: 0.2, outL: 0.12, outR: 0.12, bob: 0, lean: 0, turn: 0, nod: 0, twist: 0, ...pose };
  const parts = [];
  const z0 = p.bob;

  // Joint heights (for a 1.65 figure).
  const hipZ = (0.86 * k) + z0, shZ = (1.36 * k) + z0, neckZ = 1.43 * k + z0, headZ = 1.545 * k + z0;
  const thigh = 0.42 * k, shin = 0.4 * k, upper = 0.27 * k, fore = 0.25 * k;
  const hipY = 0.085 * k * W, shY = 0.175 * k * W;
  const leanX = Math.sin(p.lean) * 0.5 * k; // shoulders move forward when leaning

  // ---- Legs and shoes
  const legMat = look.legsMat ?? skinMat(look.legs ?? look.skin);
  const shoeMat = mat(look.shoes, { tag: 'body', spec: 0.25, shin: 20 });
  const thighs = [];
  for (const [side, hip, knee] of [[-1, p.hipL, p.kneeL], [1, p.hipR, p.kneeR]]) {
    const H0 = [0, side * hipY, hipZ];
    const d1 = limbDir(hip, 0.03, side);
    const K = add(H0, mul(d1, thigh));
    const d2 = limbDir(hip - knee, 0.02, side);
    const A = add(K, mul(d2, shin));
    thighs.push([H0, add(H0, mul(d1, thigh * 1.25))]);
    const legR = 0.058 * k * W;
    if (look.shorts) {
      const mid = add(H0, mul(d1, thigh * (look.shortsLen ?? 0.62)));
      parts.push(roundCone(H0, mid, legR * 1.45, legR * 1.35, look.trousers));
      parts.push(roundCone(mid, K, legR * 1.0, legR * 0.9, legMat));
      parts.push(roundCone(K, A, legR * 0.9, legR * 0.6, legMat));
    } else if (look.trousers) {
      parts.push(roundCone(H0, K, legR * 1.35, legR * 1.15, look.trousers));
      parts.push(roundCone(K, A, legR * 1.15, legR * 0.95, look.trousers));
    } else {
      parts.push(roundCone(H0, K, legR * 1.15, legR * 0.95, legMat));
      parts.push(roundCone(K, A, legR * 0.95, legR * 0.62, legMat));
    }
    // Shoe: a rounded wedge pointing along the foot.
    const footAng = hip - knee + (look.toeUp ?? 0);
    const fx = Math.cos(footAng * 0.6), fz = Math.sin(footAng * 0.6);
    const shoeLen = 0.13 * k;
    const toe = add(A, [shoeLen * fx, 0, -0.045 * k + shoeLen * fz * 0.4]);
    const heel = add(A, [-0.035 * k, 0, -0.04 * k]);
    parts.push(roundCone(heel, toe, 0.05 * k, 0.038 * k, shoeMat));
  }

  // ---- Skirt or hips
  const hem = (look.hem ?? 0.36) * k + z0;
  const waistZ = 1.0 * k + z0;
  if (look.skirt) {
    // An elliptical, slightly flared cone that leans with the stride.
    // The cloth drapes over the thighs, so it swings with the stride.
    const bell = squash(frustum(look.hemR ?? 0.2 * k * W, 0.15 * k * W, hem - 0.05, waistZ, look.skirt, 0.012), 0.82, 1, 1);
    const drape = thighs.map(([a, b]) => capsule(a, b, 0.115 * k * W, look.skirt));
    let skirt = intersect(smooth(0.1 * k, bell, ...drape), boxAt(-1, -1, hem, 1, 1, waistZ + 0.05, look.skirt));
    if (p.sway) {
      // Shear the cloth so the hem leads and trails the step while the waist stays put.
      const sw = p.sway * k, base = skirt;
      const off = (z) => sw * Math.max(0, Math.min(1, (waistZ - z) / (waistZ - hem)));
      skirt = {
        b: [base.b[0] - Math.abs(sw), base.b[1], base.b[2], base.b[3] + Math.abs(sw), base.b[4], base.b[5]],
        dist: (x, y, z) => base.dist(x - off(z), y, z) * 0.9,
        near: (x, y, z) => base.near(x - off(z), y, z) * 0.9,
      };
    }
    parts.push(skirt);
  } else if (look.trousers) {
    parts.push(squash(move(ellipsoid(0.15 * k * W, 0.17 * k * W, 0.12 * k, look.trousers), 0, 0, (hipZ + 0.04 * k) / 1), 0.85, 1, 1));
  }

  // ---- Torso (cardigan, shirt, apron…)
  const torsoTop = shZ + 0.02 * k;
  const torso = smooth(0.07 * k,
    squash(move(ellipsoid(0.12 * k, 0.16 * k * W, 0.2 * k, look.top), 0.012 * k, 0, 1.17 * k + z0), 1, 1, 1),
    capsule([leanX * 0.6 - 0.02 * k, -shY * 0.82, shZ - 0.015 * k], [leanX * 0.6 - 0.02 * k, shY * 0.82, shZ - 0.015 * k], 0.07 * k, look.top),
    roundCone([0, 0, waistZ - 0.05 * k], [leanX * 0.3, 0, 1.12 * k + z0], 0.13 * k * W, 0.14 * k * W, look.top),
  );
  parts.push(torso);
  void torsoTop;

  // ---- Arms
  for (const [side, sh, el, out] of [[-1, p.shL, p.elL, p.outL], [1, p.shR, p.elR, p.outR]]) {
    const S = [leanX * 0.6 - 0.02 * k, side * shY, shZ - 0.02 * k];
    const d1 = limbDir(sh, out, side);
    const E = add(S, mul(d1, upper));
    const d2 = limbDir(sh + el, out * 0.6, side);
    const Wr = add(E, mul(d2, fore));
    const sleeve = look.sleeve ?? look.top;
    parts.push(roundCone(S, E, 0.055 * k, 0.045 * k, sleeve));
    if (look.shortSleeves) {
      const mid = add(E, mul(d2, fore * 0.15));
      parts.push(roundCone(E, Wr, 0.04 * k, 0.032 * k, skinMat(look.skin)));
      void mid;
    } else {
      const cuff = add(E, mul(d2, fore * 0.85));
      parts.push(roundCone(E, cuff, 0.045 * k, 0.04 * k, sleeve));
      parts.push(roundCone(cuff, Wr, 0.03 * k, 0.03 * k, skinMat(look.skin)));
    }
    parts.push(move(sphere(0.042 * k, skinMat(look.skin)), ...add(Wr, mul(d2, 0.025 * k))));
  }

  // ---- Neck and head
  const hs = (look.headScale ?? 1) * k;
  // The head sits over the shoulders, raised clear of them in proportion to its size.
  const headC = [leanX * 0.6 - 0.028 * hs + Math.sin(p.nod) * 0.03, 0, headZ + (hs - k) * 0.09];
  parts.push(capsule([leanX * 0.6 - 0.025 * k, 0, neckZ - 0.06 * k], [leanX * 0.6 - 0.025 * k, 0, neckZ + 0.05 * k], 0.045 * k, skinMat(look.skin)));
  const head = headNode(look, hs, p);
  parts.push(place(head, { at: headC, rz: p.turn, ry: p.nod }));

  if (look.extras) parts.push(...look.extras({ k, W, z0, hipZ, shZ, waistZ, hem, leanX, headC, p, hs }));
  return union(parts);
}

/** The head, centered at its middle, facing +x. */
function headNode(look, s, p) {
  const skin = look.skin;
  const eyeCol = hex(look.eyes ?? '#201828');
  const browCol = hex(look.brows ?? look.hair ?? '#504040');
  const skinC = hex(skin);
  const blink = p.blink;
  // Features sized to read at 66 px: eyes about a pixel and a half, firm brows,
  // a warm cheek, a mouth line. (ox, oz) shift a part's frame back to the head's,
  // so the jaw piece paints the same face as the skull.
  const fs = look.featureScale ?? 1.3;
  const blush = mix(skinC, hex('#e07870'), 0.35);
  const faceAt = (ox, oz) => mat((x, y, z, lx0, ly, lz0) => {
    const lx = lx0 + ox, lz = lz0 + oz;
    if (lx > 0.04 * s) {
      for (const ey of [-0.036 * s, 0.036 * s]) {
        const dy = ly - ey, dz = lz - 0.012 * s;
        if (blink) { if (Math.abs(dz + 0.004 * s) < 0.009 * s * fs && Math.abs(dy) < 0.02 * s * fs) return mix(skinC, eyeCol, 0.75); }
        else if (dy * dy / (0.016 * s * fs) ** 2 + dz * dz / (0.019 * s * fs) ** 2 < 1) return eyeCol;
        if (look.brows !== false && Math.abs(lz - (0.022 + 0.03 * fs) * s) < 0.006 * s * fs && Math.abs(dy) < 0.026 * s * fs) return mix(skinC, browCol, 0.85);
      }
      if (Math.abs(lz + 0.045 * s) < 0.007 * s * fs && Math.abs(ly) < 0.024 * s) return mix(skinC, hex(look.mouth ?? '#a05050'), 0.65);
      if (Math.hypot(Math.abs(ly) - 0.052 * s, lz + 0.022 * s) < 0.02 * s) return blush;
    }
    return skinC;
  }, { tag: 'skin', spec: 0.1, shin: 12 });
  const faceMat = faceAt(0, 0);
  const parts = [
    smooth(0.03 * s,
      ellipsoid(0.1 * s, 0.088 * s, 0.112 * s, faceMat),
      move(ellipsoid(0.07 * s, 0.07 * s, 0.06 * s, faceAt(0.025 * s, -0.05 * s)), 0.025 * s, 0, -0.05 * s),
    ),
    move(ellipsoid(0.03 * s, 0.018 * s, 0.03 * s, skinMat(skin)), 0.1 * s, 0, -0.005 * s), // nose
    move(sphere(0.022 * s, skinMat(skin)), -0.005 * s, -0.088 * s, -0.005 * s), // ears
    move(sphere(0.022 * s, skinMat(skin)), -0.005 * s, 0.088 * s, -0.005 * s),
  ];
  if (look.hairNode) parts.push(look.hairNode(s, p));
  return union(parts);
}

/** Hair material: a base color with streaks running back from the brow. */
export function hairMat(base, streak, amount = 0.35) {
  const b = hex(base), st = streak ? hex(streak) : b;
  return mat((x, y, z, lx, ly, lz) => {
    const n = vnoise(ly * 60, lz * 9, lx * 9);
    const n2 = fbm(lx * 30, ly * 30, lz * 30, 2);
    const t = Math.max(0, Math.min(1, (n - (1 - amount)) * 4));
    const c = mix(b, st, t);
    const k = 0.92 + n2 * 0.16;
    return [c[0] * k, c[1] * k, c[2] * k];
  }, { tag: 'hair', spec: 0.25, shin: 10 });
}

export { add, mul, limbDir };
