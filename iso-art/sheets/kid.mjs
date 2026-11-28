// The Sweaty Kid: stand, an 8-frame run, jog in place, a hurdle hop, and arms up.
import { frame, POST } from '../lib/jobs.mjs';
import { kid } from '../models/npcs.mjs';

const DIRS = ['down', 'right', 'up', 'left'];
const f = (name, dir, pose, n) => frame(name, () => kid(dir, pose, n), { post: POST.figure, shadow: true });

export default {
  name: 'sweaty_kid',
  frames: () => {
    const out = [];
    for (const d of DIRS) {
      out.push(f(`${d}_0`, d, 'stand'));
      for (let i = 1; i <= 8; i++) out.push(f(`${d}_${i}`, d, 'run', i - 1));
      out.push(f(`jog_${d}_0`, d, 'jog', 0), f(`jog_${d}_1`, d, 'jog', 1));
      out.push(f(`hop_${d}`, d, 'hop'));
      out.push(f(`arms_up_${d}_0`, d, 'arms', 0), f(`arms_up_${d}_1`, d, 'arms', 1));
    }
    return out;
  },
  anims: Object.fromEntries(DIRS.flatMap((d) => [
    [`walk_${d}`, { frames: Array.from({ length: 8 }, (_, i) => `${d}_${i + 1}`), ms: 70 }],
    [`jog_${d}`, { frames: [`jog_${d}_0`, `jog_${d}_1`], ms: 160 }],
    [`arms_up_${d}`, { frames: [`arms_up_${d}_0`, `arms_up_${d}_1`], ms: 220 }],
  ])),
};
