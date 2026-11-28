// Small effects: a soft blob shadow for anything without a cast-shadow frame,
// the Kid's sweat drops, the well's breath (morning), dust puffs, swifts at
// dusk, and a gull in the morning.

import { frame, POST } from '../lib/jobs.mjs';
import { union, move, place, ellipsoid, sphere, capsule, roundCone } from '../lib/sdf.mjs';
import { mat, hex } from '../lib/render.mjs';
import { vnoise, fbm } from '../lib/noise.mjs';

const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];

/** A soft translucent image from a function (x, y) → [r, g, b (0–255), a (0–1)] | null, alpha dithered to 16 steps. */
function soft(name, w, h, ax, ay, f) {
  return {
    name,
    render() {
      const data = new Uint8Array(w * h * 4);
      for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
        const c = f(x + 0.5, y + 0.5);
        if (!c || c[3] <= 0) continue;
        const d = (BAYER[(y & 3) * 4 + (x & 3)] + 0.5) / 16 - 0.5;
        const a = Math.max(0, Math.min(16, Math.round(c[3] * 16 + d))) / 16;
        if (!a) continue;
        const i = (y * w + x) * 4;
        data[i] = c[0]; data[i + 1] = c[1]; data[i + 2] = c[2]; data[i + 3] = Math.round(a * 255);
      }
      return [{ name, img: { w, h, ax, ay, data } }];
    },
  };
}

const drop = mat('#8cc8f0', { tag: 'fx', spec: 1.6, shin: 60, emit: 0.35 });
const tear = (x, y, z, r) => roundCone([x, y, z], [x - r * 0.4, y, z + r * 2.4], r, r * 0.15, drop);
const bird = (body, wing, flap) => {
  const b = mat(body, { tag: 'fx', spec: 0.2 }), wg = mat(wing, { tag: 'fx', spec: 0.1 });
  return union(
    move(ellipsoid(0.12, 0.05, 0.045, b), 0, 0, 0),
    place(roundCone([0, 0, 0], [-0.05, 0.28, flap], 0.035, 0.008, wg), {}),
    place(roundCone([0, 0, 0], [-0.05, -0.28, flap], 0.035, 0.008, wg), {}),
    roundCone([-0.1, 0, 0], [-0.2, 0, 0.01], 0.025, 0.004, b),
  );
};

export default {
  name: 'fx',
  frames: () => [
    // Blob shadow, 40×20, for the engine's characters if it prefers one to cast shadows.
    soft('shadow', 40, 20, 20, 10, (x, y) => {
      const r = Math.hypot((x - 20) / 18, (y - 10) / 8.5);
      return r < 1 ? [24, 16, 40, 0.5 * Math.min(1, (1 - r) * 2.2)] : null;
    }),
    // Sweat drops flying off the Kid.
    // Teardrops (round below, pointed above), pale blue with no dark rim: a ringed white sphere read as a ball.
    frame('sweat_0', () => union(tear(0, 0, 1.2, 0.034), tear(0.12, 0.05, 1.3, 0.026)), { post: POST.arch }),
    frame('sweat_1', () => union(tear(0.05, 0.02, 1.12, 0.03), tear(0.2, 0.08, 1.2, 0.022)), { post: POST.arch }),
    // The well's cold breath: a pale plume, three frames.
    ...[0, 1, 2].map((k) => soft(`mist_${k}`, 72, 96, 36, 92, (x, y) => {
      const t = (92 - y) / 92; // 0 at the well's mouth, 1 at the top
      const wob = Math.sin(t * 5 + k * 2.1) * 6 * t;
      const half = 14 + t * 18;
      const dx = Math.abs(x - 36 - wob) / half;
      if (dx > 1 || t < 0 || t > 1) return null;
      const n = fbm(x * 0.08, y * 0.06 + k * 1.7, k, 3);
      const a = (1 - dx * dx) * Math.sin(t * Math.PI) * (0.3 + n * 0.5) * (1 - k * 0.08);
      return [224, 236, 244, a];
    })),
    // Dust puffs (the piano's tumble, the hurdle hop).
    ...[0, 1, 2].map((k) => soft(`dust_${k}`, 40, 28, 20, 24, (x, y) => {
      const r = Math.hypot((x - 20) / (8 + k * 5), (y - 18 + k * 2) / (5 + k * 3));
      const n = vnoise(x * 0.3, y * 0.3, k);
      return r < 1 ? [220, 200, 170, (1 - r) * (0.7 - k * 0.2) * (0.6 + n * 0.5)] : null;
    })),
    // Swifts crossing the dusk sky; a gull in the morning.
    frame('swift_0', () => bird('#282430', '#302c38', 0.12), { post: POST.prop, render: { lightScale: 0.8 } }),
    frame('swift_1', () => bird('#282430', '#302c38', -0.08), { post: POST.prop, render: { lightScale: 0.8 } }),
    frame('gull_0', () => place(bird('#f0f0ec', '#c8ccd4', 0.14), { s: 2.2 }), { post: POST.prop }),
    frame('gull_1', () => place(bird('#f0f0ec', '#c8ccd4', -0.1), { s: 2.2 }), { post: POST.prop }),
  ],
  anims: {
    sweat: { frames: ['sweat_0', 'sweat_1'], ms: 150 },
    sweat_drop: { frames: ['sweat_0', 'sweat_1'], ms: 150 }, // the SNES sheet's name for it
    mist: { frames: ['mist_0', 'mist_1', 'mist_2'], ms: 420 },
    dust: { frames: ['dust_0', 'dust_1', 'dust_2'], ms: 120 },
    swift: { frames: ['swift_0', 'swift_1'], ms: 110 },
    gull: { frames: ['gull_0', 'gull_1'], ms: 300 },
  },
};
void hex; void capsule;
