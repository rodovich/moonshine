// Her Next Door: stand and walk in four directions, smoothing a sheet,
// admiring it (hands on hips), and reaching up to peg the back line.
import { frame, POST } from '../lib/jobs.mjs';
import { neighbor } from '../models/npcs.mjs';
import { characterAnims } from './cheryl.mjs';

const DIRS = ['down', 'right', 'up', 'left'];
const f = (name, dir, pose, n) => frame(name, () => neighbor(dir, pose, n), { post: POST.figure, shadow: true });

export default {
  name: 'neighbor',
  frames: () => {
    const out = [];
    for (const d of DIRS) {
      out.push(f(`${d}_0`, d, 'stand'));
      for (let i = 1; i <= 8; i++) out.push(f(`${d}_${i}`, d, 'walk', i - 1));
      out.push(f(`smooth_${d}_0`, d, 'smooth', 0), f(`smooth_${d}_1`, d, 'smooth', 1));
      out.push(f(`admire_${d}`, d, 'admire'));
      out.push(f(`reach_${d}_0`, d, 'reach', 0), f(`reach_${d}_1`, d, 'reach', 1));
    }
    return out;
  },
  anims: {
    ...characterAnims({ idle: false, ms: 110 }),
    ...Object.fromEntries(DIRS.map((d) => [`smooth_${d}`, { frames: [`smooth_${d}_0`, `smooth_${d}_1`], ms: [900, 900] }])),
    ...Object.fromEntries(DIRS.map((d) => [`reach_${d}`, { frames: [`reach_${d}_0`, `reach_${d}_1`], ms: 400 }])),
  },
};
