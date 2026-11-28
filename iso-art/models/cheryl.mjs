// Cheryl: 58, upright and brisk. Silver-streaked ash hair in a bun with a coral
// tie; coral cardigan over a cream blouse; navy mid-calf skirt; brown shoes; a
// leather satchel across her body, riding on her right hip.
// (docs/art-direction.md#cheryl for the SNES design this follows.)

import { figure, cloth, skinMat, hairMat, facing } from './figure.mjs';
import { sphere, ellipsoid, capsule, union, move, place, torus, box, smooth, roundCone, squash, frustum } from '../lib/sdf.mjs';
import { mat, hex, mix } from '../lib/render.mjs';
import { fbm, vnoise } from '../lib/noise.mjs';

export const C = {
  skin: '#e8b090',
  hair: '#8a8290',
  hairStreak: '#d8d8e4',
  coral: '#d05848',
  cream: '#f0e8d0',
  navy: '#3e4c80',
  shoes: '#6a4028',
  satchel: '#9a6438',
  strap: '#7a4a2a',
  brass: '#e0b048',
  stripeNavy: '#34406c',
};

/** The cardigan: coral knit, open over a cream blouse in a V at the front. */
function cardigan() {
  const coral = hex(C.coral), cream = hex(C.cream), btn = hex('#f0d8b0');
  return mat((x, y, z, lx, ly, lz, nx, ny, nz) => {
    // lx, ly, lz are in the torso part's own frame; use world-ish via the figure frame instead.
    return coral;
  }, { tag: 'body', spec: 0.03, shin: 6 });
}

const knit = (base) => {
  const c = hex(base);
  return (lx, ly, lz) => {
    const n = fbm(lx * 26, ly * 26, lz * 40, 2);
    const k = 0.93 + n * 0.14;
    return [c[0] * k, c[1] * k, c[2] * k];
  };
};

/**
 * Cheryl's look. Material functions get world-space coordinates, but the
 * figure is built at the origin facing +x before it's turned, so the torso
 * material is built per direction with the figure's own frame in mind: it
 * receives local (lx, ly, lz) of each part, which for the torso ellipsoid is
 * centered at chest height.
 */
export function cherylLook({ swim = false } = {}) {
  const coral = hex(C.coral), cream = hex(C.cream);
  const coralKnit = knit(C.coral);
  // Torso: the cardigan, with the blouse's V showing at the front.
  const top = swim ? swimTop() : mat((x, y, z, lx, ly, lz) => {
    // The blouse shows in a V at the front of the chest (the torso
    // ellipsoid's frame: lx forward, lz up from mid-chest). Other torso
    // parts have other frames, but only the ellipsoid reaches the front.
    
    return coralKnit(lx, ly, lz);
  }, { tag: 'body', spec: 0.03, shin: 6 });
  const look = {
    height: 1.64,
    skin: C.skin,
    hair: C.hair,
    brows: '#3e3440',
    featureScale: 1.0,
    eyes: '#4a2c24',
    eyeZ: 0.03,
    top,
    sleeve: swim ? null : mat(knit(C.coral), { tag: 'body', spec: 0.03, shin: 6 }),
    skirt: swim ? null : cloth(C.navy, { noise: 0.06 }),
    hem: 0.34,
    hemR: 0.205,
    shoes: swim ? C.skin : C.shoes,
    legs: swim ? C.skin : '#dcae90',
    headScale: 1.22,
    hairNode: (s) => cherylHair(s, swim),
    extras: (j) => cherylExtras(j, swim),
  };
  if (swim) {
    look.shortSleeves = true;
    look.sleeve = skinMat(C.skin);
    look.trousers = swimTop();
    look.shorts = true;
    look.shortsLen = 0.95;
    look.shoes = C.skin;
    look.legs = C.skin;
    look.toeUp = 0;
  }
  return look;
}

function swimTop() {
  const navy = hex(C.stripeNavy), cream = hex(C.cream), skin = hex(C.skin);
  return mat((x, y, z, lx, ly, lz) => {
    // A low back: bare skin across the shoulder blades, crossed by two navy straps
    // (only the torso's own frame has its back at lx < -0.06 and its top at lz > 0).
    if (lx < -0.07 && lz > 0.02 && lz < 0.3) {
      if (Math.abs(Math.abs(ly) - 0.07) < 0.018) return navy;
      return skin.map((v) => v * (0.96 + vnoise(ly * 40, lz * 40, 3) * 0.06));
    }
    // Knit: horizontal stripes in world height, with a fine vertical rib and soft wear.
    const band = Math.floor(z / 0.045);
    const base = band % 2 ? cream : navy;
    const rib = 0.94 + 0.06 * Math.abs(Math.sin((lx + ly) * 260));
    const n = 0.95 + fbm(lx * 30, ly * 30, z * 30, 2) * 0.1;
    return base.map((v) => v * rib * n);
  }, { tag: 'body', spec: 0.06, shin: 10 });
}

function cherylHair(s, swim) {
  const hm = hairMat(C.hair, C.hairStreak, 0.2);
  if (swim) {
    // A snug navy cap with a cream band, over the bun.
    const cap = mat((x, y, z, lx, ly, lz) => (Math.abs(lz - 0.02 * s) < 0.014 * s ? hex(C.cream) : hex(C.stripeNavy)), { tag: 'hair', spec: 0.2, shin: 16 });
    return union(
      move(ellipsoid(0.11 * s, 0.086 * s, 0.1 * s, cap), -0.01 * s, 0, 0.038 * s),
      move(ellipsoid(0.07 * s, 0.072 * s, 0.065 * s, cap), -0.115 * s, 0, 0.07 * s), // the bun's bump under the cap
    );
  }
  const tie = mat(C.coral, { tag: 'hair', spec: 0.15 });
  return union(
    // Hair swept back over the crown, leaving the face clear.
    smooth(0.03 * s,
      move(ellipsoid(0.1 * s, 0.095 * s, 0.092 * s, hm), -0.032 * s, 0, 0.04 * s),
      move(ellipsoid(0.06 * s, 0.092 * s, 0.07 * s, hm), -0.05 * s, 0, -0.02 * s),
    ),
    // The bun, high at the back, and its coral tie.
    move(ellipsoid(0.056 * s, 0.058 * s, 0.052 * s, hm), -0.12 * s, 0, 0.06 * s),
    place(torus(0.05 * s, 0.021 * s, tie), { at: [-0.09 * s, 0, 0.05 * s], ry: Math.PI / 2 - 0.5 }),
  );
}

function cherylExtras(j, swim) {
  if (swim) return [];
  const { k, z0, shZ, waistZ, leanX } = j;
  const leather = mat((x, y, z, lx, ly, lz) => {
    const c = hex(C.satchel);
    const n = fbm(lx * 30, ly * 30, lz * 30, 3);
    const t = 0.9 + n * 0.2;
    return [c[0] * t, c[1] * t, c[2] * t];
  }, { tag: 'body', spec: 0.3, shin: 18 });
  const strapM = mat(C.strap, { tag: 'body', spec: 0.2 });
  const brass = mat(C.brass, { tag: 'body', spec: 0.8, shin: 40 });
  const cream = mat(C.cream, { tag: 'body', spec: 0.05 });
  const blouse = mat('#eedcbc', { tag: 'body', spec: 0.05, emit: 0.1 });
  const blouseShade = mat('#e2c49c', { tag: 'body', spec: 0.03, emit: 0.12 }); // warm even in shade
  // Satchel on the right hip (+y), strap from the left shoulder across the chest.
  const bagC = [0.02 * k, 0.2 * k, waistZ - 0.08 * k];
  return [
    place(box(0.1 * k, 0.04 * k, 0.085 * k, leather, 0.025 * k), { at: bagC }),
    place(box(0.102 * k, 0.03 * k, 0.04 * k, leather, 0.02 * k), { at: [bagC[0], bagC[1] + 0.02 * k, bagC[2] + 0.055 * k], rx: 0.15 }), // flap
    move(sphere(0.014 * k, brass), bagC[0] + 0.02 * k, bagC[1] + 0.045 * k, bagC[2] + 0.02 * k),
    capsule([0.11 * k + leanX * 0.6, -0.12 * k, shZ - 0.02 * k], [0.11 * k, 0.14 * k, waistZ - 0.03 * k], 0.017 * k, strapM),
    capsule([-0.1 * k + leanX * 0.6, -0.13 * k, shZ - 0.01 * k], [-0.06 * k, 0.17 * k, waistZ + 0.0 * k], 0.017 * k, strapM),
    // The cardigan's ribbed hem, over the top of the skirt.
    squash(frustum(0.172 * k, 0.15 * k, waistZ - 0.13 * k, waistZ + 0.06 * k, mat(knit(C.coral), { tag: 'body', spec: 0.03 }), 0.012), 0.84, 1, 1),
    // The blouse: a narrow V of shaded cream below bare skin at the throat,
    // with two small collar points lying on the cardigan, so it reads as fabric.
    // Centered under the chin and joined to the throat: skin, then the V, then two collar points.
    capsule([0.03 * k, 0, shZ + 0.04 * k], [0.06 * k, 0, shZ + 0.0 * k], 0.022 * k, skinMat(C.skin)),
    place(roundCone([0, 0, 0], [0.012 * k, 0, -0.07 * k], 0.024 * k, 0.005 * k, blouseShade), { at: [0.062 * k, 0, shZ + 0.005 * k] }),
    place(roundCone([0, 0, 0], [0.014 * k, 0, -0.04 * k], 0.013 * k, 0.004 * k, blouse), { at: [0.058 * k, -0.03 * k, shZ + 0.022 * k], rx: 0.55 }),
    place(roundCone([0, 0, 0], [0.014 * k, 0, -0.04 * k], 0.013 * k, 0.004 * k, blouse), { at: [0.058 * k, 0.03 * k, shZ + 0.022 * k], rx: -0.55 }),
  ];
}

/** Walk pose at phase i of n (8 frames per stride pair). */
export function walkPose(i, n = 8, amp = 1) {
  const ph = (i / n) * Math.PI * 2;
  const s = Math.sin(ph), c = Math.cos(ph);
  const A = 0.3 * amp;
  return {
    hipL: A * s, hipR: -A * s,
    kneeL: 0.08 + 0.45 * Math.max(0, c) * amp, kneeR: 0.08 + 0.45 * Math.max(0, -c) * amp,
    shL: -0.32 * s * amp, shR: 0.32 * s * amp,
    elL: 0.25 + 0.2 * Math.max(0, -s), elR: 0.25 + 0.2 * Math.max(0, s),
    bob: -0.018 * Math.abs(s),
    lean: 0.0,
    sway: -0.045 * c * amp, // the hem trails the stride by a quarter step
  };
}

export function cheryl(dir, pose = {}, opts = {}) {
  return facing(figure(cherylLook(opts), pose), dir);
}
