// The Pelletiers' ginger cat (the SNES `props:cat` frames): sitting and facing
// the camera's left (south), with a slow tail flick (cat_0…3, the SNES timing),
// and curled asleep (cat_sleep_0/1, breathing).
import { frame, POST } from '../lib/jobs.mjs';
import { cat } from '../models/npcs.mjs';
import { union, move, ellipsoid, capsule, place } from '../lib/sdf.mjs';
import { mat, hex } from '../lib/render.mjs';
import { vnoise } from '../lib/noise.mjs';
import { facing } from '../models/figure.mjs';

const fur = mat((x, y, z, lx, ly, lz) => {
  const stripe = Math.sin(lx * 50 + vnoise(lx * 10, ly * 10, lz * 10) * 4) > 0.4;
  return hex(stripe ? '#c86a28' : '#e89a48');
}, { tag: 'body', spec: 0.1 });

function asleep(breath) {
  const r = 1 + breath * 0.04;
  const parts = [
    move(ellipsoid(0.16 * r, 0.12 * r, 0.08 * r, fur), 0, 0, 0.08),
    move(ellipsoid(0.07, 0.075, 0.06, fur), 0.12, 0.05, 0.08),
    capsule([0.15, 0.03, 0.12], [0.14, 0.0, 0.15], 0.02, fur), capsule([0.15, 0.09, 0.12], [0.13, 0.11, 0.15], 0.02, fur),
  ];
  for (let i = 0; i < 6; i++) {
    const a0 = Math.PI * 0.9 + (i / 6) * Math.PI * 0.9, a1 = Math.PI * 0.9 + ((i + 1) / 6) * Math.PI * 0.9;
    parts.push(capsule([Math.cos(a0) * 0.17, Math.sin(a0) * 0.13, 0.03], [Math.cos(a1) * 0.17, Math.sin(a1) * 0.13, 0.03], 0.022, fur));
  }
  return facing(union(parts), 'down');
}

const f = (name, build) => frame(name, build, { post: POST.figure, shadow: true });

export default {
  name: 'cat',
  frames: () => [
    f('cat_0', () => cat('down', { tail: 0 })),
    f('cat_1', () => cat('down', { tail: 1 })),
    f('cat_2', () => cat('down', { tail: 0.4 })),
    f('cat_3', () => cat('down', { tail: -0.6 })),
    f('cat_sleep_0', () => asleep(0)),
    f('cat_sleep_1', () => asleep(1)),
  ],
  anims: {
    cat: { frames: ['cat_0', 'cat_1', 'cat_2', 'cat_3'], ms: [1800, 300, 1400, 160] },
    cat_sleep: { frames: ['cat_sleep_0', 'cat_sleep_1'], ms: 900 },
  },
};
void place;
