// Cheryl for the moonrise picture: seated on the tub's west rim in her
// bathing costume, seen from behind at about 200 px tall. At this size the
// sprite rig's rounded primitives read as a toy, so she is sculpted here as a
// 1997 pre-rendered hero would be: a modeled cap with ribbing and folds over
// the bun, an ear and the line of the jaw, the nape with a few loose strands
// of ash hair, shoulders, blades and a spine under the skin, arms with form,
// hands with fingers on the rim, real straps, and a knit costume.
//
// Local frame: she faces +x; +y is her right; the origin is the point of the
// rim she sits on, at the rim's top. (meters)

import { ellipsoid, capsule, roundCone, union, smooth, move, place, box, boxAt, custom, intersect, subtract, sphere, torus, inflate } from '../lib/sdf.mjs';
import { mat, hex, mix } from '../lib/render.mjs';
import { fbm, vnoise, hash3 } from '../lib/noise.mjs';

const C = {
  skin: hex('#e6ac8c'), skinWarm: hex('#d88a70'), skinPale: hex('#f0c4a8'),
  navy: hex('#30406c'), cream: hex('#eee4cc'),
  hair: hex('#4e4852'), hairSilver: hex('#8a8494'),
};

/** Skin: warm, with soft variation, a little redder over the shoulders where the sun has been. */
const skin = mat((x, y, z, lx, ly, lz) => {
  const n = fbm(x * 30, y * 30, z * 30, 3);
  let c = mix(C.skin, C.skinWarm, Math.max(0, n - 0.5) * 0.7);
  c = mix(c, C.skinPale, Math.max(0, 0.5 - n) * 0.4);
  // freckles across the shoulders
  if (z > 0.48 && hash3(Math.floor(x * 400), Math.floor(y * 400), Math.floor(z * 400)) > 0.985) c = mix(c, hex('#b86a50'), 0.5);
  return c;
}, { tag: 'skin', spec: 0.14, shin: 18, layer: 'fg' });

/** The costume's knit: horizontal stripes in world height, a fine rib, and a soft weave. */
const knit = mat((x, y, z) => {
  const band = Math.floor((z + 10) / 0.045) % 2;
  const base = band ? C.cream : C.navy;
  const rib = 0.9 + 0.1 * Math.abs(Math.sin((x * 0.7 + y) * 380));
  const weave = 0.94 + vnoise(x * 160, y * 160, z * 160) * 0.1;
  return base.map((v) => v * rib * weave);
}, { tag: 'body', spec: 0.05, shin: 10, layer: 'fg' });
const navyM = mat(C.navy, { tag: 'body', spec: 0.08, layer: 'fg' });

/** The cap: navy rubber with fine horizontal ribbing, a cream band at the edge. */
const capM = mat((x, y, z) => {
  const rib = Math.sin(z * 520) > 0.2 ? 0.9 : 1;
  return C.navy.map((v) => v * rib);
}, { tag: 'hair', spec: 0.12, shin: 24, layer: 'fg' }); // navy rubber, a soft sheen
const bandM = mat(C.cream, { tag: 'hair', spec: 0.3, shin: 20, layer: 'fg' });
const hairM = mat((x, y, z) => mix(C.hair, C.hairSilver, vnoise(x * 900, z * 80, 1) > 0.6 ? 0.6 : 0.1), { tag: 'hair', spec: 0.3, layer: 'fg' });

/** A displaced node: d − f(x,y,z), with a safety factor. */
const displace = (node, f, k = 0.8) => ({
  b: node.b.map((v, i) => (i < 3 ? v - 0.01 : v + 0.01)),
  dist: (x, y, z) => (node.dist(x, y, z) - f(x, y, z)) * k,
  near: (x, y, z) => node.near(x, y, z),
});

function arm(side, S, E, Wr, hand) {
  // Upper arm: deltoid cap, a fuller muscle belly, tapering to the elbow; forearm tapering to the wrist.
  const mid = [(S[0] + E[0]) / 2, (S[1] + E[1]) / 2, (S[2] + E[2]) / 2];
  return smooth(0.025,
    move(ellipsoid(0.042, 0.045, 0.055, skin), S[0] - 0.005, S[1], S[2] - 0.025),
    roundCone(S, E, 0.036, 0.028, skin),
    move(ellipsoid(0.026, 0.027, 0.06, skin), mid[0] - 0.006, mid[1], mid[2] + 0.01),
    roundCone(E, Wr, 0.027, 0.02, skin),
    hand,
  );
}

/** A hand resting palm-down, fingers forward (+x) and curling over an edge at fx. */
function handOnRim(W, side) {
  const parts = [move(ellipsoid(0.042, 0.035, 0.016, skin), W[0] + 0.035, W[1], W[2] - 0.005)];
  for (let i = 0; i < 4; i++) {
    const fy = W[1] + (i - 1.5) * 0.017;
    const a = [W[0] + 0.07, fy, W[2] - 0.005], b = [W[0] + 0.1, fy, W[2] - 0.01], c = [W[0] + 0.115, fy, W[2] - 0.04];
    parts.push(capsule(a, b, 0.0085, skin), capsule(b, c, 0.008, skin));
  }
  parts.push(capsule([W[0] + 0.03, W[1] - side * 0.035, W[2] - 0.005], [W[0] + 0.07, W[1] - side * 0.045, W[2] - 0.01], 0.01, skin)); // thumb
  return union(parts);
}

export function vistaCheryl() {
  const parts = [];
  // ---- Seat and legs (mostly hidden behind her; they anchor the pose).
  const seat = move(ellipsoid(0.12, 0.17, 0.1, knit), 0.0, 0, 0.07);
  const thighs = [-1, 1].map((s) => roundCone([0.02, s * 0.085, 0.07], [0.4, s * 0.1, 0.16], 0.075, 0.055, knit));
  const shins = [-1, 1].map((s) => roundCone([0.4, s * 0.1, 0.15], [0.36, s * 0.1, -0.33], 0.05, 0.035, skin));
  // ---- Torso: waist, ribcage, shoulders, smoothly joined; the costume covers it below a low back.
  const torso = smooth(0.06,
    move(ellipsoid(0.105, 0.14, 0.15, knit), 0.0, 0, 0.24),
    move(ellipsoid(0.11, 0.16, 0.16, knit), 0.01, 0, 0.42),
    capsule([-0.01, -0.11, 0.545], [-0.01, 0.11, 0.545], 0.05, knit),
  );
  // The low back: bare skin from the shoulders down to ~0.36, between and outside the straps,
  // modeled as a skin layer just proud of the knit, cut to the costume's back opening.
  const backOpening = custom((x, y, z) => {
    // A U-shaped opening, deepest at the spine.
    const bottom = 0.36 + Math.abs(y) * 0.5;
    return Math.max(bottom - z, x + 0.02);
  }, [-0.3, -0.3, 0.3, 0.1, 0.3, 0.7], skin);
  const backSkin = intersect(smooth(0.06,
    move(ellipsoid(0.112, 0.162, 0.162, skin), 0.008, 0, 0.42),
    capsule([-0.012, -0.112, 0.546], [-0.012, 0.112, 0.546], 0.052, skin),
    // Shoulder blades, just under the skin.
    move(ellipsoid(0.03, 0.05, 0.065, skin), -0.08, -0.062, 0.46),
    move(ellipsoid(0.03, 0.05, 0.065, skin), -0.08, 0.062, 0.46),
  ), backOpening);
  // The spine's groove: a shallow channel down the middle of the back.
  const backWithSpine = displace(backSkin, (x, y, z) => -0.006 * Math.exp(-(y * y) / 0.0002) * (z > 0.36 ? 1 : 0), 0.9);
  // Straps: real bands over the shoulders and down the back to the opening.
  const straps = [-1, 1].map((s) => union(
    capsule([0.07, s * 0.075, 0.5], [0.0, s * 0.085, 0.605], 0.013, navyM),
    capsule([0.0, s * 0.085, 0.605], [-0.06, s * 0.083, 0.592], 0.013, navyM),
    capsule([-0.06, s * 0.083, 0.592], [-0.105, s * 0.078, 0.52], 0.013, navyM),
    capsule([-0.105, s * 0.078, 0.52], [-0.122, s * 0.066, 0.39], 0.013, navyM),
  ));
  // ---- Neck, nape, head.
  const neck = smooth(0.03,
    capsule([-0.01, 0, 0.55], [0.01, 0, 0.66], 0.053, skin),
    move(ellipsoid(0.032, 0.062, 0.042, skin), -0.035, 0, 0.59), // the nape's muscles
  );
  const HZ = -0.035; // the head sits this much lower than first drafted
  const cranium = move(ellipsoid(0.1, 0.086, 0.112, skin), 0.02, 0, 0.8 + HZ);
  const jaw = move(ellipsoid(0.072, 0.068, 0.06, skin), 0.055, 0, 0.725 + HZ);
  const ears = [-1, 1].map((s) => {
    const outer = place(ellipsoid(0.016, 0.03, 0.036, skin), { at: [0.0, s * 0.084, 0.785 + HZ], rz: s * 0.4, rx: s * 0.25 });
    const lobe = move(sphere(0.011, skin), 0.004, s * 0.086, 0.755 + HZ);
    return union(outer, lobe);
  });
  const head = smooth(0.025, cranium, jaw);
  // The cap: over the crown and the bun, its edge above the ears and nape, ribbed, with folds at the back.
  const capShape = smooth(0.03,
    move(ellipsoid(0.109, 0.095, 0.121, capM), 0.02, 0, 0.8 + HZ),
    move(ellipsoid(0.058, 0.068, 0.058, capM), -0.098, 0, 0.81 + HZ), // over the bun
  );
  const edgeAt = (x, y) => 0.775 + HZ + 0.014 * Math.cos(Math.atan2(y, x - 0.02) * 2);
  const capCut = custom((x, y, z) => edgeAt(x, y) - z, [-0.3, -0.3, 0.5, 0.3, 0.3, 1.0], capM);
  const folds = (x, y, z) => {
    // A few soft folds where the cap gathers over the bun, and its fine ribbing.
    const back = Math.max(0, -x - 0.05);
    return 0.003 * Math.sin(Math.atan2(y, x + 0.1) * 9 + z * 30) * Math.min(1, back * 20) + 0.0012 * Math.sin(z * 520);
  };
  const cap = displace(intersect(capShape, capCut), folds);
  const capBand = intersect(move(ellipsoid(0.113, 0.099, 0.125, bandM), 0.02, 0, 0.8 + HZ),
    custom((x, y, z) => { const e = edgeAt(x, y); return Math.max(e - 0.002 - z, z - e - 0.017); }, [-0.3, -0.3, 0.5, 0.3, 0.3, 1.0], bandM));
  // Loose strands of ash hair escaping at the nape and behind the ears.
  const strands = [];
  for (let i = 0; i < 7; i++) {
    const a = Math.PI + (i - 3) * 0.3, r = 0.088;
    const x0 = 0.02 + Math.cos(a) * r, y0 = Math.sin(a) * r * 1.08;
    const z0 = edgeAt(x0, y0) + 0.004;
    const len = 0.02 + hash3(i, 3, 1) * 0.03;
    strands.push(capsule([x0, y0, z0], [x0 - 0.006 + (hash3(i, 1, 1) - 0.5) * 0.012, y0 * 1.04 + (hash3(i, 2, 1) - 0.5) * 0.02, z0 - len], 0.0022, hairM));
  }
  // ---- Arms. Her right hand rests on the rim beside her; her left on her knee.
  const rS = [-0.015, 0.16, 0.54], rE = [-0.07, 0.235, 0.31], rW = [-0.06, 0.25, 0.07];
  const lS = [-0.015, -0.16, 0.54], lE = [0.07, -0.215, 0.33], lW = [0.27, -0.15, 0.22];
  const rightArm = arm(1, rS, rE, rW, handOnRim([rW[0] - 0.03, rW[1], 0.012], 1));
  const leftArm = arm(-1, lS, lE, lW, move(ellipsoid(0.05, 0.035, 0.018, skin), lW[0] + 0.04, lW[1] + 0.01, lW[2] - 0.01));
  parts.push(seat, ...thighs, ...shins, torso, backWithSpine, ...straps, neck, head, ...ears, cap, capBand, ...strands, rightArm, leftArm);
  return union(parts);
}
