// Ground tiles: one tile's top surface, modeled as a heightfield and clipped to
// the tile's footprint ([−0.5, 0.5]² around the origin), so tiles join without
// seams. Patterns tile with period 1 (or 2 for macro tiles).

import { custom, intersect, boxAt, union } from '../lib/sdf.mjs';
import { mat, hex, mix } from '../lib/render.mjs';
import { voronoi, fbm, vnoise, hash3 } from '../lib/noise.mjs';

const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const sstep = (a, b, v) => { const t = clamp((v - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };

/**
 * A heightfield leaf: surface z = f(x, y) (≤ 0 + small bumps), solid below,
 * down to `bottom`. Lipschitz-safe by scaling the vertical distance.
 */
function heightfield(f, matFn, bottom = -0.07, k = 0.4) {
  return custom((x, y, z) => Math.max((z - f(x, y)) * k, bottom - z), [-1.5, -1.5, bottom, 1.5, 1.5, 0.05], matFn);
}

const clip = (node, x0 = -0.5, y0 = -0.5, x1 = 0.5, y1 = 0.5) => intersect(node, boxAt(x0, y0, -1, x1, y1, 1, mat('#8a7a68', { tag: 'floor' })));

/**
 * Cobbles: rounded limestone setts in a sand bed. `seed` picks the variant;
 * `n` is setts per tile edge.
 */
export function cobbles({ seed = 0, n = 3, tones = ['#d8c4a0', '#d0bc98', '#dcc8a4', '#c8b494', '#d4c09c'], bed = '#b09c80', worn = 0, grate = false } = {}) {
  const inGrate = (x, y) => grate && Math.abs(x) < 0.2 && Math.abs(y) < 0.2;
  const N = Math.round(n);
  const toneC = tones.map(hex), bedC = hex(bed);
  const cell = (x, y) => voronoi((x + 0.5) * N, (y + 0.5) * N, N, 0.7, seed);
  const f = (x, y) => {
    if (inGrate(x, y)) return Math.abs(x) < 0.17 && Math.abs(y) < 0.17 && Math.abs(((x + 0.17) / 0.34 * 6) % 1 - 0.5) < 0.28 ? -0.05 : -0.008;
    const v = cell(x, y);
    const e = (v.f2 - v.f1);
    const dome = sstep(0.0, 0.45, e) * 0.03 + (v.id - 0.5) * 0.006;
    return -0.03 + dome;
  };
  const m = mat((x, y, z) => {
    if (inGrate(x, y)) return z < -0.03 ? hex('#141018') : hex('#4a4a58');
    const v = cell(x, y);
    const e = v.f2 - v.f1;
    const c = toneC[Math.floor(v.id * toneC.length) % toneC.length];
    const nz = fbm((x + 0.5) * 16, (y + 0.5) * 16, v.id * 9, 2, 16);
    let col = [c[0] * (0.92 + nz * 0.14), c[1] * (0.92 + nz * 0.14), c[2] * (0.92 + nz * 0.14)];
    if (worn) col = mix(col, [col[0] * 1.08, col[1] * 1.08, col[2] * 1.08], sstep(0.2, 0.5, e) * worn);
    return mix(bedC, col, sstep(0.03, 0.14, e));
  }, { tag: 'floor', spec: 0.1, shin: 10, aoScale: 1.6 });
  return heightfield(f, m);
}

/**
 * Roof-terrace paving: whitewashed plaster slabs (half a tile, in running
 * bond) with soft joints. A 2×2 macro: quadrant q in 'nw', 'ne', 'sw', 'se'.
 * Variants: 'crack' (a crack across a slab), 'patch' (one slab re-plastered).
 */
export function deck({ q = 'nw', variant = '', base = '#e4dccc' } = {}) {
  const ox = q[1] === 'e' ? 1 : 0, oy = q[0] === 's' ? 1 : 0;
  const c = hex(base), joint = hex('#bcb4a8'), patch = hex('#f0ece0');
  const slab = (x, y) => {
    // Macro coordinates in [0, 2).
    const X = x + 0.5 + ox, Y = y + 0.5 + oy;
    const row = Math.floor(Y * 2);
    const sx = X * 2 + (row % 2 ? 0.5 : 0);
    const col = Math.floor(sx);
    const fx = sx - col, fy = Y * 2 - row;
    const ex = Math.min(fx, 1 - fx), ey = Math.min(fy, 1 - fy);
    return { e: Math.min(ex, ey) * 0.5, id: hash3(((col % 4) + 4) % 4, row % 4, 9) };
  };
  const crack = (x, y) => {
    if (variant !== 'crack') return 1;
    // A wandering line across the tile.
    const t = y + 0.18 * Math.sin(x * 9) + 0.08 * (vnoise(x * 14, 3) - 0.5) - 0.1;
    return Math.abs(t - x * 0.35);
  };
  const f = (x, y) => {
    const s = slab(x, y);
    let h = -0.012 + sstep(0.0, 0.02, s.e) * 0.012 + (s.id - 0.5) * 0.004;
    const cr = crack(x, y);
    if (cr < 0.012) h -= 0.008 * (1 - cr / 0.012);
    return h;
  };
  const m = mat((x, y, z) => {
    const s = slab(x, y);
    const n = fbm((x + 0.5 + ox) * 4, (y + 0.5 + oy) * 4, 2, 3, 8);
    let col = [c[0] * (0.95 + n * 0.08 + (s.id - 0.5) * 0.04), c[1] * (0.95 + n * 0.08 + (s.id - 0.5) * 0.04), c[2] * (0.95 + n * 0.07)];
    if (variant === 'patch' && s.id > 0.6) col = mix(col, patch, 0.6);
    col = mix(joint, col, sstep(0.0, 0.014, s.e));
    if (crack(x, y) < 0.01) col = mix(col, joint, 0.7);
    return col;
  }, { tag: 'floor', spec: 0.03, shin: 8 });
  return heightfield(f, m);
}

export { clip, heightfield, sstep, clamp };
