// The isometric raymarcher.
//
// Projection (shared with the engine, docs/iso-art-direction.md):
//   screen x = (wx − wy) · 32,  screen y = (wx + wy) · 16 − wz · ZPX
// with world units of one tile and ZPX screen pixels per unit of height.
// Every pixel is a parallel ray along V = (1, 1, 32/ZPX) toward the viewer.
//
// A frame renders one model around its origin (the anchor). The result keeps,
// per pixel, linear color, coverage, depth, normal, and the material tag of
// what was hit, so later passes can outline, split, and quantize.

import { NEAR, INF } from './sdf.mjs';

export const TILE_W = 64, TILE_H = 32, ZPX = 40;

const VX = 1, VY = 1, VZ = 32 / ZPX;
const VL = Math.hypot(VX, VY, VZ);
export const VIEW = [VX / VL, VY / VL, VZ / VL]; // toward the viewer

/** Project a world point (relative to the anchor) to screen pixels. */
export const project = (x, y, z) => [(x - y) * 32, (x + y) * 16 - z * ZPX];

export function srgbToLin(c) { return Math.pow(c / 255, 2.2); }
export function hex(h) {
  const n = parseInt(h.replace('#', ''), 16);
  return [srgbToLin((n >> 16) & 255), srgbToLin((n >> 8) & 255), srgbToLin(n & 255)];
}
export const mix = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
export const scale = (a, s) => [a[0] * s, a[1] * s, a[2] * s];

/**
 * A material. `color` is a hex string, a linear [r,g,b], or a function
 * (wx, wy, wz, lx, ly, lz, nx, ny, nz) → linear [r,g,b], where l* is the point in
 * the leaf's own frame. Options: spec (0–1), shin, emit (0–1: unlit glow),
 * tag (a name kept per pixel), rough (normal jitter amount).
 */
export function mat(color, opts = {}) {
  const c = typeof color === 'string' ? hex(color) : color;
  return { color: typeof c === 'function' ? c : () => c, spec: 0, shin: 24, emit: 0, ...opts };
}

// Lighting: one key light from the screen's upper left (world west, a little
// south, 45° up), a cool sky fill from above, and a warm bounce from below.
const L = (() => { const v = [-0.75, 0.55, 1.0]; const l = Math.hypot(...v); return v.map((c) => c / l); })();
export const LIGHT = {
  dir: L,
  key: [1.0, 0.95, 0.86],
  sky: [0.3, 0.38, 0.64],
  bounce: [0.2, 0.16, 0.12],
};

function normal(scene, x, y, z) {
  const e = 0.0015;
  const a = scene.dist(x + e, y - e, z - e), b = scene.dist(x - e, y - e, z + e);
  const c = scene.dist(x - e, y + e, z - e), d = scene.dist(x + e, y + e, z + e);
  const nx = a - b - c + d, ny = -a - b + c + d, nz = -a + b - c + d;
  const l = Math.hypot(nx, ny, nz) || 1;
  return [nx / l, ny / l, nz / l];
}

function softShadow(scene, x, y, z, k, maxT) {
  let res = 1, t = 0.012;
  for (let i = 0; i < 64 && t < maxT; i++) {
    const h = scene.dist(x + L[0] * t, y + L[1] * t, z + L[2] * t);
    if (h < 0.0008) return 0;
    res = Math.min(res, (k * h) / t);
    t += Math.min(Math.max(h, 0.008), 0.25);
  }
  return Math.max(0, Math.min(1, res));
}

function ambientOcclusion(scene, x, y, z, n, strength) {
  let occ = 0, w = 1;
  for (let i = 1; i <= 5; i++) {
    const h = 0.025 * i;
    const d = scene.dist(x + n[0] * h, y + n[1] * h, z + n[2] * h);
    occ += (h - d) * w;
    w *= 0.6;
  }
  return Math.max(0, Math.min(1, 1 - strength * 3.2 * occ));
}

/** Intersect the line P0 + s·V with an AABB; returns [s0, s1] or null. */
function slab(p0, b) {
  let s0 = -INF, s1 = INF;
  for (let i = 0; i < 3; i++) {
    const v = VIEW[i];
    const a = (b[i] - p0[i]) / v, c = (b[i + 3] - p0[i]) / v;
    s0 = Math.max(s0, Math.min(a, c)); s1 = Math.min(s1, Math.max(a, c));
  }
  return s0 <= s1 ? [s0, s1] : null;
}

/** Screen-space bounds of a world AABB, as [x0, y0, x1, y1]. */
export function screenBounds(b) {
  let x0 = INF, y0 = INF, x1 = -INF, y1 = -INF;
  for (let i = 0; i < 8; i++) {
    const [sx, sy] = project(i & 1 ? b[3] : b[0], i & 2 ? b[4] : b[1], i & 4 ? b[5] : b[2]);
    x0 = Math.min(x0, sx); y0 = Math.min(y0, sy); x1 = Math.max(x1, sx); y1 = Math.max(y1, sy);
  }
  return [x0, y0, x1, y1];
}

/**
 * Render a scene. Options:
 *   ss: supersampling per axis (default 3)
 *   rect: [x0, y0, w, h] in screen px relative to the anchor (default: fit the scene's bounds)
 *   ground: z of an invisible shadow-catching floor, or null
 *   shadowK: penumbra hardness (higher = sharper)
 *   ao: ambient occlusion strength
 *   lightScale: multiplies all lighting
 * Returns { w, h, ax, ay, px } where px[i] = { c: [r,g,b] linear, a: coverage, z: depth, n, tag, shadow }.
 */
export function render(scene, opts = {}) {
  const ss = opts.ss ?? 3;
  let rect = opts.rect;
  if (!rect) {
    let bb = scene.b;
    if (opts.ground != null) {
      // Room for the cast shadow: the light falls ~0.75 east and 0.55 north per unit of height.
      const hgt = Math.max(0, bb[5] - opts.ground);
      bb = [bb[0] - 0.1, bb[1] - hgt * 0.6 - 0.25, bb[2], bb[3] + hgt * 0.8 + 0.25, bb[4] + 0.1, bb[5]];
    }
    const [x0, y0, x1, y1] = screenBounds(bb);
    const m = opts.margin ?? 1;
    rect = [Math.floor(x0) - m, Math.floor(y0) - m, Math.ceil(x1) - Math.floor(x0) + 2 * m, Math.ceil(y1) - Math.floor(y0) + 2 * m];
  }
  const [rx, ry, w, h] = rect;
  const ground = opts.ground ?? null;
  const shadowK = opts.shadowK ?? 10;
  const aoStr = opts.ao ?? 1;
  const ls = opts.lightScale ?? 1;
  const keyCol = opts.key ?? LIGHT.key, skyCol = opts.sky ?? LIGHT.sky, bounceCol = opts.bounce ?? LIGHT.bounce;
  const shadowMaxT = opts.shadowMaxT ?? 6;
  const px = new Array(w * h);
  const sceneB = scene.b;

  for (let py = 0; py < h; py++) {
    for (let pxi = 0; pxi < w; pxi++) {
      let cr = 0, cg = 0, cb = 0, cov = 0, zsum = 0, sh = 0, nsum = [0, 0, 0];
      const tags = new Map();
      for (let sy = 0; sy < ss; sy++) for (let sx = 0; sx < ss; sx++) {
        const X = rx + pxi + (sx + 0.5) / ss, Y = ry + py + (sy + 0.5) / ss;
        // The point on the plane z = 0 that projects to (X, Y).
        const a = X / 32, c = Y / 16;
        const p0 = [(a + c) / 2, (c - a) / 2, 0];
        const sl = slab(p0, sceneB);
        let hit = false, hx = 0, hy = 0, hz = 0, s = 0;
        if (sl) {
          s = sl[1];
          for (let i = 0; i < 300 && s >= sl[0]; i++) {
            hx = p0[0] + VIEW[0] * s; hy = p0[1] + VIEW[1] * s; hz = p0[2] + VIEW[2] * s;
            const d = scene.dist(hx, hy, hz);
            if (d < 0.0006) { hit = true; break; }
            s -= Math.max(d * 0.85, 0.0004);
          }
        }
        if (hit) {
          NEAR.d = INF; NEAR.leaf = null;
          scene.near(hx, hy, hz);
          const leaf = NEAR.leaf, lx = NEAR.lx, ly = NEAR.ly, lz = NEAR.lz;
          const m = (leaf && leaf.mat) || DEFAULT_MAT;
          const n = normal(scene, hx, hy, hz);
          let alb = m.color(hx, hy, hz, lx, ly, lz, n[0], n[1], n[2]);
          let nn = n;
          if (m.bump) nn = m.bump(hx, hy, hz, lx, ly, lz, n);
          const ndl = nn[0] * L[0] + nn[1] * L[1] + nn[2] * L[2];
          const ox = hx + n[0] * 0.003, oy = hy + n[1] * 0.003, oz = hz + n[2] * 0.003;
          const shad = ndl > 0 ? softShadow(scene, ox, oy, oz, shadowK, shadowMaxT) : 0;
          const ao = ambientOcclusion(scene, hx, hy, hz, n, aoStr * (m.aoScale ?? 1));
          const up = nn[2] * 0.5 + 0.5;
          const kd = Math.max(ndl, 0) * shad;
          let r = alb[0] * (keyCol[0] * kd + (skyCol[0] * up + bounceCol[0] * (1 - up)) * ao);
          let g = alb[1] * (keyCol[1] * kd + (skyCol[1] * up + bounceCol[1] * (1 - up)) * ao);
          let b = alb[2] * (keyCol[2] * kd + (skyCol[2] * up + bounceCol[2] * (1 - up)) * ao);
          if (m.spec && kd > 0) {
            const hv = [L[0] + VIEW[0], L[1] + VIEW[1], L[2] + VIEW[2]];
            const hl = Math.hypot(...hv);
            const ndh = Math.max(0, (nn[0] * hv[0] + nn[1] * hv[1] + nn[2] * hv[2]) / hl);
            const sp = m.spec * Math.pow(ndh, m.shin) * kd;
            r += sp * keyCol[0]; g += sp * keyCol[1]; b += sp * keyCol[2];
          }
          r *= ls; g *= ls; b *= ls;
          if (m.emit) { r = r * (1 - m.emit) + alb[0] * m.emit; g = g * (1 - m.emit) + alb[1] * m.emit; b = b * (1 - m.emit) + alb[2] * m.emit; }
          cr += r; cg += g; cb += b; cov++;
          zsum += s;
          nsum[0] += n[0]; nsum[1] += n[1]; nsum[2] += n[2];
          const t = m.tag || '';
          tags.set(t, (tags.get(t) || 0) + 1);
        } else if (ground !== null) {
          // Shadow on the invisible floor.
          const t = (ground - p0[2]) / VIEW[2];
          const gx = p0[0] + VIEW[0] * t, gy = p0[1] + VIEW[1] * t;
          const shad = softShadow(scene, gx, gy, ground + 0.002, shadowK, shadowMaxT);
          const ao = ambientOcclusion(scene, gx, gy, ground, [0, 0, 1], aoStr);
          sh += Math.min(1, (1 - shad) * 0.75 + (1 - ao) * 0.9);
        }
      }
      const n2 = ss * ss;
      let tag = '', best = 0;
      for (const [t, k] of tags) if (k > best) { best = k; tag = t; }
      px[py * w + pxi] = cov
        ? { c: [cr / cov, cg / cov, cb / cov], a: cov / n2, z: zsum / cov, n: nsum.map((v) => v / cov), tag, shadow: sh / n2 }
        : { c: [0, 0, 0], a: 0, z: -INF, n: [0, 0, 1], tag: '', shadow: sh / n2 };
    }
  }
  return { w, h, ax: -rx, ay: -ry, px };
}

const DEFAULT_MAT = mat([0.5, 0.5, 0.5]);
