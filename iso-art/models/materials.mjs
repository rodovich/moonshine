// Shared materials for Tessel's surface. Colors come from the SNES palette's
// families (docs/art-direction.md) so both versions read as the same city;
// the renderer's lighting supplies the hue-shifted shading the SNES ramps drew
// by hand (cool sky fill in shadow, warm key light on tops).

import { mat, hex, mix } from '../lib/render.mjs';
import { fbm, vnoise, voronoi, hash3 } from '../lib/noise.mjs';

const tint = (c, k) => [c[0] * k, c[1] * k, c[2] * k];

/** Periodic coordinate helper: wrap world x/y (tile-centered frames) into [0, 1). */
const wrap = (v) => ((v + 0.5) % 1 + 1) % 1;

/**
 * Whitewashed plaster: warm white with soft, broad unevenness and a few faint
 * stains low on the wall. `base` lets the same recipe make ochre or rose plaster.
 * Noise tiles every unit horizontally so wall pieces join without seams.
 */
export function plaster(base = '#ece8dc', opts = {}) {
  const c = hex(base);
  const stain = hex(opts.stain ?? '#c8b89c');
  return mat((x, y, z) => {
    const u = opts.axis === 'y' ? wrap(y) : opts.axis === 'x' ? wrap(x) : wrap(x + y);
    const n = fbm(u * 6, z * 6, 3.1, 3, 6);
    const fine = vnoise(u * 40, z * 40, 1.7, 40);
    let col = tint(c, 0.94 + n * 0.1 + (fine - 0.5) * 0.03);
    // Damp and dust at the foot of the wall.
    if (opts.stainHeight) {
      const t = Math.max(0, 1 - (z - (opts.base ?? 0)) / opts.stainHeight) * (0.5 + n * 0.6);
      col = mix(col, tint(stain, 0.95), Math.min(0.45, t * 0.45));
    }
    return col;
  }, { tag: opts.tag ?? 'wall', spec: 0.02, shin: 6 });
}

/** Limestone (warm, slightly mauve in shadow via the lighting). */
export function limestone(base = '#dcc49c', opts = {}) {
  const c = hex(base);
  return mat((x, y, z, lx, ly, lz) => {
    const n = fbm(x * 9 + 11, y * 9, z * 9, 3);
    const sp = vnoise(x * 70, y * 70, z * 70);
    return tint(c, 0.9 + n * 0.16 + (sp > 0.85 ? -0.06 : 0));
  }, { tag: opts.tag ?? 'stone', spec: 0.04, shin: 8 });
}

/** A per-stone color: each stone (id in 0–1) picks a slightly different tone. */
export function stoneVaried(bases, opts = {}) {
  const cs = bases.map(hex);
  return (id) => {
    const c = cs[Math.floor(id * cs.length) % cs.length];
    const k = 0.92 + ((id * 7.31) % 1) * 0.14;
    return mat((x, y, z) => {
      const n = fbm(x * 14 + id * 30, y * 14, z * 14, 2);
      return tint(c, k * (0.93 + n * 0.12));
    }, { tag: opts.tag ?? 'floor', spec: opts.spec ?? 0.06, shin: 10 });
  };
}

export const terracotta = (base = '#c86a44', opts = {}) => {
  const c = hex(base);
  return mat((x, y, z, lx, ly, lz) => {
    const n = fbm(lx * 12 + 3, ly * 12, lz * 12, 3);
    return tint(c, 0.86 + n * 0.24);
  }, { tag: opts.tag ?? 'pot', spec: opts.spec ?? 0.08, shin: 10 });
};

/** Painted wood: a color with grain along one local axis and slight wear. */
export function paintedWood(base, opts = {}) {
  const c = hex(base), wear = hex(opts.wear ?? '#a88860');
  const ax = opts.grain ?? 'z';
  return mat((x, y, z, lx, ly, lz) => {
    const g = ax === 'z' ? vnoise(lx * 60, ly * 60, lz * 4) : ax === 'x' ? vnoise(lx * 4, ly * 60, lz * 60) : vnoise(lx * 60, ly * 4, lz * 60);
    const n = fbm(lx * 10, ly * 10, lz * 10, 2);
    let col = tint(c, 0.9 + g * 0.14);
    if (n > (opts.wearAt ?? 0.72)) col = mix(col, wear, 0.5);
    return col;
  }, { tag: opts.tag ?? 'wood', spec: opts.spec ?? 0.1, shin: 12 });
}

export function wood(base = '#a87040', opts = {}) {
  const c = hex(base);
  return mat((x, y, z, lx, ly, lz) => {
    const along = opts.grain === 'x' ? lx : opts.grain === 'y' ? ly : lz;
    const across = opts.grain === 'x' ? ly + lz : opts.grain === 'y' ? lx + lz : lx + ly;
    const g = vnoise(along * 5, across * 80, 0.5);
    const r = Math.sin((across * 120 + vnoise(along * 3, across * 10) * 6)) * 0.5 + 0.5;
    return tint(c, 0.86 + g * 0.14 + r * 0.06);
  }, { tag: opts.tag ?? 'wood', spec: opts.spec ?? 0.12, shin: 14 });
}

export const iron = (base = '#3c4250', opts = {}) => mat(base, { tag: opts.tag ?? 'iron', spec: 0.35, shin: 24, ...opts });
export const brass = (base = '#d8a840', opts = {}) => mat(base, { tag: opts.tag ?? 'metal', spec: 0.9, shin: 40, ...opts });
export const bronze = (base = '#a87838', opts = {}) => mat((x, y, z, lx, ly, lz) => {
  const n = fbm(lx * 40, ly * 40, lz * 40, 2);
  return mix(hex(base), hex('#5a9a80'), Math.max(0, n - 0.55) * 1.4);
}, { tag: opts.tag ?? 'metal', spec: 0.6, shin: 30 });

/** Window glass: dark, cool, with a sky reflection that brightens toward the top. */
export const glass = (opts = {}) => mat((x, y, z) => {
  const t = Math.max(0, Math.min(1, (z - (opts.z0 ?? 0)) / (opts.h ?? 1)));
  return mix(hex('#283048'), hex('#7090b8'), t * 0.55);
}, { tag: 'glass', spec: 1.2, shin: 60, emit: opts.emit ?? 0 });

export const leaf = (base = '#5e9a40', opts = {}) => {
  const c = hex(base);
  return mat((x, y, z, lx, ly, lz) => {
    const n = vnoise(lx * 50, ly * 50, lz * 50);
    return tint(c, 0.75 + n * 0.45);
  }, { tag: opts.tag ?? 'leaf', spec: 0.15, shin: 14 });
};

export const flat = (base, opts = {}) => mat(base, { tag: opts.tag ?? 'prop', spec: opts.spec ?? 0.05, ...opts });

export { tint, wrap, hash3, voronoi, fbm, vnoise };
