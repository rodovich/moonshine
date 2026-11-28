// The opening's residents, matching their SNES designs (game/src/art/opening_npcs.js):
// the Old Man (tan skin, silver hair, sage jacket, cream shirt, grey trousers,
// flat cap, stooped), Her Next Door (silver hair under a knotted sky-blue
// headscarf, rose dress, white apron, plum shoes), and the Sweaty Kid (black
// spiky hair, coral sweatband, white vest, cobalt shorts, white plimsolls).

import { figure, cloth, skinMat, hairMat, facing } from './figure.mjs';
import { sphere, ellipsoid, capsule, union, move, place, torus, box, boxAt, smooth, roundCone, squash, frustum, cylinder } from '../lib/sdf.mjs';
import { mat, hex } from '../lib/render.mjs';
import { fbm, vnoise } from '../lib/noise.mjs';

const PI = Math.PI;

// ---------------------------------------------------------------------------
// The Old Man

export function oldManLook() {
  return {
    height: 1.6,
    skin: '#c08050',
    brows: '#d0d0d8',
    hair: '#c8c8d8',
    top: cloth('#6e9a66', { noise: 0.1 }),
    sleeve: cloth('#6e9a66', { noise: 0.1 }),
    trousers: cloth('#5a6070', { noise: 0.08 }),
    shoes: '#4a3024',
    headScale: 1.12,
    build: 1.02,
    mouth: '#e8e8ee', // the white mustache sits where a mouth would
    hairNode: (s) => union(
      // Silver hair at the back and sides under a flat cap.
      move(ellipsoid(0.08 * s, 0.095 * s, 0.07 * s, hairMat('#c8c8d8', '#f0f0f8', 0.3)), -0.035 * s, 0, -0.005 * s),
      // Flat cap with a short brim.
      move(ellipsoid(0.11 * s, 0.1 * s, 0.055 * s, cloth('#8a7058', { tag: 'hair', noise: 0.1 })), -0.005 * s, 0, 0.065 * s),
      move(box(0.045 * s, 0.08 * s, 0.01 * s, cloth('#7a6048', { tag: 'hair' }), 0.008 * s), 0.1 * s, 0, 0.06 * s),
      // White mustache.
      move(ellipsoid(0.02 * s, 0.045 * s, 0.014 * s, mat('#ececf0', { tag: 'hair' })), 0.098 * s, 0, -0.03 * s),
    ),
    extras: ({ k, shZ, leanX }) => [
      // Cream shirt collar showing at the throat.
      capsule([0.06 * k + leanX * 0.6, -0.05 * k, shZ + 0.03 * k], [0.09 * k + leanX * 0.6, 0, shZ - 0.02 * k], 0.02 * k, mat('#f0e8d0', { tag: 'body' })),
      capsule([0.06 * k + leanX * 0.6, 0.05 * k, shZ + 0.03 * k], [0.09 * k + leanX * 0.6, 0, shZ - 0.02 * k], 0.02 * k, mat('#f0e8d0', { tag: 'body' })),
    ],
  };
}

/**
 * The Old Man seated on his stool facing east (+x), at the chess table.
 * pose: 'think' (chin on hand), 'reach' (reaching for a piece), 'mill' (turning
 * the pepper mill, n = 0/1), 'sneeze' (n = 0/1), 'talk' (n = 0/1).
 */
export function oldManSeated(pose = 'think', n = 0) {
  const seat = 0.46;
  const p = {
    bob: seat - 0.86 + 0.06,
    hipL: PI / 2 - 0.1, hipR: PI / 2 - 0.2, kneeL: PI / 2 - 0.15, kneeR: PI / 2 - 0.3,
    lean: 0.32, nod: 0.12,
    shL: 0.5, elL: 0.9, outL: 0.25, shR: 0.4, elR: 0.6, outR: 0.2,
  };
  if (pose === 'think') Object.assign(p, { shR: 0.75, elR: 2.2, outR: 0.12, nod: 0.25 }); // chin on his right hand
  if (pose === 'reach') Object.assign(p, { shR: 1.1, elR: 0.25, outR: 0.05, lean: 0.42, nod: 0.3 });
  if (pose === 'mill') Object.assign(p, { shL: 1.0, elL: 1.0, shR: 1.0, elR: 1.0, outL: 0.05, outR: 0.05, nod: n ? 0.0 : 0.1 });
  if (pose === 'sneeze') Object.assign(p, n ? { lean: 0.55, nod: 0.45, shR: 1.2, elR: 1.9 } : { lean: 0.05, nod: -0.25, shR: 1.1, elR: 2.0 });
  if (pose === 'talk') Object.assign(p, { shL: 0.7 + n * 0.25, elL: 1.2, outL: 0.25, nod: n ? 0.05 : 0.15 });
  const look = oldManLook();
  const parts = [figure(look, p)];
  if (pose === 'mill') {
    const pm = mat('#1e1a20', { tag: 'body', spec: 0.6, shin: 30 });
    parts.push(place(union(frustum(0.045, 0.035, -0.09, 0.09, pm, 0.01), move(sphere(0.04, pm), 0, 0, 0.11)), { at: [0.38, 0, 0.92], rz: n * 0.8 }));
  }
  return union(parts);
}

// ---------------------------------------------------------------------------
// Her Next Door

export function neighborLook() {
  return {
    height: 1.6,
    skin: '#e8b090',
    hair: '#c8c8d8',
    brows: '#9090a8',
    top: cloth('#e8a090', { noise: 0.08 }),
    sleeve: cloth('#e8a090', { noise: 0.08 }),
    skirt: cloth('#e8a090', { noise: 0.08 }),
    hem: 0.3,
    hemR: 0.22,
    shoes: '#704058',
    legs: '#e0a888',
    headScale: 1.12,
    build: 1.08,
    hairNode: (s) => union(
      // A sky-blue headscarf over silver hair, knotted at the front-top.
      move(ellipsoid(0.115 * s, 0.103 * s, 0.11 * s, cloth('#a8d0dc', { tag: 'hair', noise: 0.1 })), -0.02 * s, 0, 0.03 * s),
      move(ellipsoid(0.035 * s, 0.05 * s, 0.03 * s, cloth('#90b8c8', { tag: 'hair' })), 0.02 * s, 0, 0.13 * s),
      move(sphere(0.025 * s, cloth('#90b8c8', { tag: 'hair' })), 0.05 * s, -0.03 * s, 0.14 * s),
      move(sphere(0.025 * s, cloth('#90b8c8', { tag: 'hair' })), 0.05 * s, 0.03 * s, 0.14 * s),
      // Silver curls showing at the nape.
      move(ellipsoid(0.05 * s, 0.08 * s, 0.04 * s, hairMat('#c8c8d8', '#f0f0f8', 0.3)), -0.07 * s, 0, -0.06 * s),
    ),
    extras: ({ k, waistZ, shZ, leanX }) => [
      // A white apron over the front of the dress.
      place(box(0.012 * k, 0.13 * k, 0.24 * k, cloth('#f4f2ea', { noise: 0.05 }), 0.01 * k), { at: [0.155 * k, 0, waistZ - 0.2 * k], ry: -0.12 }),
      capsule([0.13 * k, -0.15 * k, waistZ + 0.01 * k], [0.13 * k, 0.15 * k, waistZ + 0.01 * k], 0.015 * k, cloth('#f4f2ea')),
      capsule([0.05 * k + leanX * 0.6, -0.06 * k, shZ + 0.03 * k], [0.1 * k + leanX * 0.6, 0, shZ - 0.03 * k], 0.018 * k, cloth('#f4f2ea')),
      capsule([0.05 * k + leanX * 0.6, 0.06 * k, shZ + 0.03 * k], [0.1 * k + leanX * 0.6, 0, shZ - 0.03 * k], 0.018 * k, cloth('#f4f2ea')),
    ],
  };
}

/** Her Next Door. pose: 'stand', 'walk' (n of 8), 'smooth' (n 0/1), 'admire', 'reach' (n 0/1). */
export function neighbor(dir, pose = 'stand', n = 0) {
  let p = {};
  if (pose === 'walk') p = walkPoseGeneric(n, 8, 0.85);
  if (pose === 'smooth') p = { shL: 1.0 + n * 0.25, elL: 0.3, shR: 1.0 + (1 - n) * 0.25, elR: 0.3, outL: -0.1, outR: -0.1, lean: 0.12, nod: 0.15 };
  if (pose === 'admire') p = { shL: -0.2, elL: 2.2, outL: 0.75, shR: -0.2, elR: 2.2, outR: 0.75, lean: -0.05, nod: -0.12 };
  if (pose === 'reach') p = { shL: 2.6 + n * 0.2, elL: 0.2, shR: 2.5 + (1 - n) * 0.2, elR: 0.25, outL: 0.1, outR: 0.1, nod: -0.35 };
  return facing(figure(neighborLook(), p), dir);
}

// ---------------------------------------------------------------------------
// The Sweaty Kid

export function kidLook() {
  return {
    height: 1.3,
    skin: '#c08050',
    hair: '#282028',
    brows: '#282028',
    top: cloth('#f4f2ec', { noise: 0.06 }),
    sleeve: skinMat('#c08050'),
    shortSleeves: true,
    trousers: cloth('#3a6cc0', { noise: 0.08 }),
    shorts: true,
    legs: '#c08050',
    shoes: '#f0f0f0',
    headScale: 1.32,
    build: 0.95,
    hairNode: (s) => {
      const hm = hairMat('#282028', '#484050', 0.2);
      const spikes = [];
      for (let i = 0; i < 9; i++) {
        const a = (i / 9) * PI * 2;
        spikes.push(roundCone([-0.01 * s, 0, 0.05 * s], [Math.cos(a) * 0.08 * s - 0.03 * s, Math.sin(a) * 0.09 * s, 0.16 * s + (i % 2) * 0.02 * s], 0.045 * s, 0.01 * s, hm));
      }
      return union(
        move(ellipsoid(0.105 * s, 0.096 * s, 0.09 * s, hm), -0.02 * s, 0, 0.035 * s),
        ...spikes,
        // Coral sweatband.
        place(torus(0.1 * s, 0.017 * s, cloth('#d05848', { tag: 'hair' })), { at: [-0.01 * s, 0, 0.072 * s], ry: -0.18 }),
      );
    },
  };
}

/** Kid walk/run poses use shorts: legs bare from mid-thigh. */
export function kid(dir, pose = 'stand', n = 0, opts = {}) {
  let p = {};
  if (pose === 'run') {
    const ph = (n / 8) * PI * 2, s = Math.sin(ph), c = Math.cos(ph);
    p = { hipL: 0.65 * s, hipR: -0.65 * s, kneeL: 0.2 + 1.1 * Math.max(0, c), kneeR: 0.2 + 1.1 * Math.max(0, -c), shL: -0.7 * s, shR: 0.7 * s, elL: 1.4, elR: 1.4, outL: 0.15, outR: 0.15, bob: 0.04 * Math.abs(c) - 0.02, lean: 0.18 };
  }
  if (pose === 'jog') {
    const s = n ? 1 : -1;
    p = { hipL: 0.35 * s, hipR: -0.35 * s, kneeL: 0.5 + 0.4 * (s > 0), kneeR: 0.5 + 0.4 * (s < 0), shL: -0.5 * s, shR: 0.5 * s, elL: 1.5, elR: 1.5, outL: 0.15, outR: 0.15, bob: n ? 0.02 : -0.01, lean: 0.1 };
  }
  if (pose === 'hop') p = { hipL: 0.9, hipR: 0.5, kneeL: 1.4, kneeR: 1.0, shL: 1.2, shR: 1.2, elL: 0.6, elR: 0.6, outL: 0.4, outR: 0.4, bob: 0.22, lean: 0.15 };
  if (pose === 'arms') p = { shL: 2.8 + n * 0.15, shR: 2.8 + n * 0.15, elL: 0.2, elR: 0.2, outL: 0.35, outR: 0.35, bob: n ? 0.03 : 0, nod: -0.25 };
  const look = kidLook();
  const parts = [figure(look, p)];
  return facing(union(parts), dir);
}

/** A generic brisk walk at phase i of n. */
export function walkPoseGeneric(i, n = 8, amp = 1) {
  const ph = (i / n) * PI * 2;
  const s = Math.sin(ph), c = Math.cos(ph);
  const A = 0.3 * amp;
  return {
    hipL: A * s, hipR: -A * s,
    kneeL: 0.08 + 0.45 * Math.max(0, c) * amp, kneeR: 0.08 + 0.45 * Math.max(0, -c) * amp,
    shL: -0.3 * s * amp, shR: 0.3 * s * amp,
    elL: 0.25 + 0.2 * Math.max(0, -s), elR: 0.25 + 0.2 * Math.max(0, s),
    bob: -0.018 * Math.abs(s), lean: 0.03,
  };
}

// ---------------------------------------------------------------------------
// The Pelletiers' cat: a ginger cat sitting upright, tail curled round.

export function cat(dir = 'down', { tail = 0 } = {}) {
  const fur = mat((x, y, z, lx, ly, lz) => {
    const stripe = Math.sin((lx * 50) + vnoise(lx * 10, ly * 10, lz * 10) * 4) > 0.4;
    const c = hex(stripe ? '#c86a28' : '#e89a48');
    return c;
  }, { tag: 'body', spec: 0.1 });
  const white = mat('#f4eee4', { tag: 'body' });
  const eye = mat('#7ab040', { tag: 'body', spec: 0.8 });
  const parts = [
    move(ellipsoid(0.11, 0.09, 0.13, fur), -0.03, 0, 0.12), // haunches
    smooth(0.04, move(ellipsoid(0.07, 0.07, 0.12, fur), 0.04, 0, 0.2), move(ellipsoid(0.03, 0.05, 0.06, white), 0.09, 0, 0.18)),
    move(ellipsoid(0.075, 0.08, 0.07, fur), 0.07, 0, 0.33), // head
    roundCone([0.07, -0.05, 0.37], [0.06, -0.055, 0.44], 0.025, 0.006, fur),
    roundCone([0.07, 0.05, 0.37], [0.06, 0.055, 0.44], 0.025, 0.006, fur),
    move(sphere(0.011, eye), 0.135, -0.028, 0.345), move(sphere(0.011, eye), 0.135, 0.028, 0.345),
    move(ellipsoid(0.02, 0.025, 0.015, white), 0.14, 0, 0.315),
    capsule([0.1, -0.035, 0.0], [0.1, -0.035, 0.16], 0.022, fur), capsule([0.1, 0.035, 0.0], [0.1, 0.035, 0.16], 0.022, fur),
  ];
  // Tail curled round the feet; `tail` flicks the tip.
  const pts = [];
  for (let i = 0; i <= 8; i++) { const a = PI * 0.9 + (i / 8) * PI * 1.0; pts.push([-0.03 + Math.cos(a) * 0.15, Math.sin(a) * 0.15, 0.025 + (i === 8 ? tail * 0.06 : 0)]); }
  for (let i = 0; i < 8; i++) parts.push(capsule(pts[i], pts[i + 1], 0.022, fur));
  return facing(union(parts), dir);
}
