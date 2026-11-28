// Cheryl: stand, 8-frame walk, blink, and reach in the four grid directions.
import { frame, POST } from '../lib/jobs.mjs';
import { cheryl, walkPose } from '../models/cheryl.mjs';

const DIRS = ['down', 'right', 'up', 'left'];
const WALK_MS = 90;

export function characterFrames(build, { walk = true, idle = true, reach = true, n = 8, extra = [] } = {}) {
  const out = [];
  for (const d of DIRS) {
    out.push(frame(`${d}_0`, () => build(d, {}), { post: POST.figure, shadow: true }));
    if (walk) for (let i = 1; i <= n; i++) out.push(frame(`${d}_${i}`, () => build(d, walkPose(i - 1, n)), { post: POST.figure, shadow: true }));
    if (idle) out.push(frame(`idle_${d}_1`, () => build(d, { blink: true }), { post: POST.figure }));
    if (reach) out.push(frame(`reach_${d}`, () => build(d, { shR: 1.35, elR: 0.15, outR: 0.02, shL: 0.1, lean: 0.12, nod: 0.12 }), { post: POST.figure, shadow: true }));
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
  frames: () => characterFrames((d, p) => cheryl(d, p)),
  anims: characterAnims(),
};
