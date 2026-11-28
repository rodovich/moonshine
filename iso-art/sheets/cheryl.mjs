// Cheryl: stand, 8-frame walk, blink, and reach in the four grid directions.
import { frame, POST } from '../lib/jobs.mjs';
import { cheryl, walkPose } from '../models/cheryl.mjs';

const DIRS = ['down', 'right', 'up', 'left'];
const WALK_MS = 90;

const PI = Math.PI;
// Seated on a ledge (shins hanging), half-way up, and seated on the tub's rim (shins down into the water).
export const SIT = { bob: 0.5 - 0.86, hipL: PI / 2, hipR: PI / 2 - 0.05, kneeL: PI / 2, kneeR: PI / 2 + 0.1, shL: 0.2, elL: 0.5, outL: 0.3, shR: 0.2, elR: 0.5, outR: 0.3 };
export const RISE = { bob: 0.68 - 0.86, hipL: 0.9, hipR: 0.85, kneeL: 1.3, kneeR: 1.25, shL: 0.5, elL: 0.4, outL: 0.25, shR: 0.5, elR: 0.4, outR: 0.25, lean: 0.35, nod: 0.1 };
export const SIT_TUB = { bob: 0.75 - 0.86, hipL: PI / 2 + 0.35, hipR: PI / 2 + 0.29, kneeL: PI / 2 + 0.45, kneeR: PI / 2 + 0.44, shL: 0.25, elL: 0.6, outL: 0.35, shR: 0.25, elR: 0.6, outR: 0.35, lean: 0.06, nod: -0.06 };

export function characterFrames(build, { walk = true, idle = true, reach = true, n = 8, extra = [], sit = false } = {}) {
  const out = [];
  for (const d of DIRS) {
    out.push(frame(`${d}_0`, () => build(d, {}), { post: POST.figure, shadow: true }));
    if (walk) for (let i = 1; i <= n; i++) out.push(frame(`${d}_${i}`, () => build(d, walkPose(i - 1, n)), { post: POST.figure, shadow: true }));
    if (idle) out.push(frame(`idle_${d}_1`, () => build(d, { blink: true }), { post: POST.figure }));
    if (reach) out.push(frame(`reach_${d}`, () => build(d, { shR: 1.35, elR: 0.15, outR: 0.02, shL: 0.1, lean: 0.12, nod: 0.12 }), { post: POST.figure, shadow: true }));
  }
  if (sit) {
    out.push(frame('sit_right', () => build('right', SIT), { post: POST.figure, shadow: true }));
    out.push(frame('sit_left', () => build('left', SIT), { post: POST.figure, shadow: true }));
    out.push(frame('rise_right', () => build('right', RISE), { post: POST.figure, shadow: true }));
    out.push(frame('rise_left', () => build('left', RISE), { post: POST.figure, shadow: true }));
  }
  return out.concat(extra);
}

export function characterAnims({ walk = true, idle = true, n = 8, ms = WALK_MS } = {}) {
  const a = {};
  for (const d of DIRS) {
    if (walk) a[`walk_${d}`] = { frames: Array.from({ length: n }, (_, i) => `${d}_${i + 1}`), ms };
    if (idle) a[`idle_${d}`] = { frames: [`${d}_0`, `idle_${d}_1`], ms: [2600, 130] };
  }
  return a;
}

export default {
  name: 'cheryl',
  frames: () => characterFrames((d, p) => cheryl(d, p), { sit: true }),
  anims: characterAnims(),
};
