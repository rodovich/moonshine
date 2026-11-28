// Materials shared by Act 2's landmarks, harbor, and interiors. Colors come
// from the SNES palette's families (game/src/art/palette.js); the renderer's
// light does the shading.
//
// Two of them fake what a 90s renderer faked: `seeThrough` lets a glass or
// water surface show what lies under it (marbles in a jar, steps under the
// canal, the dark under the Archive's Eye) by casting the view ray on into a
// small analytic scene, since sprites can't be translucent.

import { mat, hex, mix, VIEW } from '../lib/render.mjs';
import { fbm, vnoise, hash3 } from '../lib/noise.mjs';

const tint = (c, k) => [c[0] * k, c[1] * k, c[2] * k];
export { tint };

export const PAL = {
  slateLight: '#98a8b0', slate: '#687880', slateShade: '#485860', slateDeep: '#303840', void: '#101820',
  relicCyan: '#68f0e0', moonEye: '#5aa8e8',
  cobaltLight: '#78b0f0', cobalt: '#3870c8', cobaltShade: '#285098', cobaltDeep: '#183060',
  sage: '#78a870', sageShade: '#507850',
  terra: '#c8683f', coral: '#d05848', cream: '#f0e8d0',
  water: '#48a8b8', waterMid: '#308098', waterDeep: '#205070', foam: '#e8f8f8',
  bronze: '#a87848', brass: '#d8a840', wood: '#a87040', woodShade: '#784830', woodDeep: '#503028',
  ink: '#241a2e',
};

/** Founders' hullstone: dark slate blocks told apart only by tone, hairline joints, no mortar. */
export function hullstone({ course = 0.5, block = 0.9, base = PAL.slate, tag = 'wall', seed = 3, joint = 0.008 } = {}) {
  const c0 = hex(base), dark = hex(PAL.slateDeep);
  return mat((x, y, z, lx, ly, lz, nx, ny, nz) => {
    // Pick the face's horizontal coordinate by its normal, so any wall face gets courses.
    const top = Math.abs(nz) > 0.7;
    const u = top ? x : Math.abs(ny) > Math.abs(nx) ? x : y;
    const v = top ? y : z;
    const row = Math.floor((v + 50) / course);
    const off = (row % 2) * 0.5;
    const bu = (u + 50) / block + off, col = Math.floor(bu);
    const fu = bu - col, fv = (v + 50) / course - row;
    const id = hash3(col, row, seed);
    const j = Math.min(fu * block, (1 - fu) * block, fv * course, (1 - fv) * course) < joint;
    const n = fbm(x * 7, y * 7, z * 7, 2);
    let col3 = tint(c0, 0.82 + id * 0.26 + (n - 0.5) * 0.08);
    if (j) col3 = mix(col3, dark, 0.7);
    return col3;
  }, { tag, spec: 0.18, shin: 20 });
}

/** The relic glow: moonglass at a seam. Emissive; listed in the SNES EMISSIVE colors. */
export const relicCyan = (opts = {}) => mat(PAL.relicCyan, { tag: opts.tag ?? 'wall', emit: opts.emit ?? 0.85, spec: 0.4, shin: 30 });

/** A moon-eye: the round blue glass stud of every doorstep. */
export const moonEyeGlass = (opts = {}) => mat(PAL.moonEye, { tag: opts.tag ?? 'wall', spec: 1.0, shin: 50, emit: 0.25 });

/** Limestone ashlar in courses on any vertical face (block joints chosen by the face's normal). */
export function ashlar({ course = 0.4, block = 0.5, tones = ['#c8b090', '#dcc6a2'], tag = 'wall', seed = 21, joint = 0.035 } = {}) {
  const a = hex(tones[0]), b = hex(tones[1]);
  return mat((x, y, z, lx, ly, lz, nx, ny, nz) => {
    const top = Math.abs(nz) > 0.7;
    const u = top ? x : Math.abs(ny) > Math.abs(nx) ? x : y;
    const v = top ? y : z;
    const row = Math.floor((v + 100) / course);
    const off = (row % 2) * 0.5;
    const bu = (u + 100) / block + off, col = Math.floor(bu);
    const fu = bu - col, fv = (v + 100) / course - row;
    const isJ = Math.min(fu, 1 - fu) * block < joint * block * 2 * 0.5 + 0.004 || Math.min(fv, 1 - fv) < joint * 1.4;
    const id = hash3(col, row, seed);
    const n = fbm(x * 8 + 3, y * 8, z * 8, 3);
    const c = mix(a, b, id);
    return tint(c, (isJ ? 0.72 : 1) * (0.9 + n * 0.16));
  }, { tag, spec: 0.04, shin: 8 });
}

/** Cobalt glazed dome tiles in courses, with ribs every `ribs` around (u = angle 0–1, v = height). */
export function domeTiles({ ribs = 16, base = PAL.cobalt, tag = 'roof' } = {}) {
  const c = hex(base), light = hex(PAL.cobaltLight), deep = hex(PAL.cobaltDeep);
  return mat((x, y, z, lx, ly, lz) => {
    const a = (Math.atan2(ly, lx) / (2 * Math.PI) + 1) % 1;
    const seg = (a * ribs) % 1;
    const course = Math.floor(lz * 9), cf = (lz * 9) % 1;
    const id = hash3(Math.floor(a * ribs * 6), course, 7);
    let col = tint(c, 0.9 + id * 0.16);
    if (cf < 0.12) col = mix(col, deep, 0.35);
    if (id > 0.88) col = mix(col, light, 0.3);
    if (seg < 0.04 || seg > 0.96) col = mix(col, light, 0.25);
    return col;
  }, { tag, spec: 0.55, shin: 28 });
}

/** Water: cool sky in it, ripples, glints. `t` is the animation phase; `color` the body. */
export function water({ t = 0, deep = PAL.waterDeep, light = PAL.water, tag = 'prop', glint = 0.8, scale = 9, emit = 0 } = {}) {
  const d = hex(deep), l = hex(light), foam = hex(PAL.foam);
  return mat((x, y, z) => {
    const r = vnoise(x * scale + t * 6, y * scale - t * 2, t * 3);
    const r2 = vnoise(x * scale * 2.3 - t * 4, y * scale * 2.3, 5 + t * 2);
    let c = mix(d, l, 0.35 + r * 0.4 + r2 * 0.15);
    if (r * 0.6 + r2 * 0.4 > glint) c = mix(c, foam, Math.min(1, (r * 0.6 + r2 * 0.4 - glint) * 5));
    return c;
  }, { tag, spec: 1.4, shin: 90, emit });
}

/**
 * A surface you see into: when the view ray hits it, cast the ray on (away
 * from the viewer) into `under(x, y, z)` → linear color or null (search to
 * `depth`), and tint what's found by the surface `film` color, `k` of it.
 * `under` takes a world point along the continued ray, so give it analytic
 * shapes (spheres, steps) rather than the scene.
 */
export function seeThrough(film, under, { k = 0.45, depth = 1.2, steps = 48, tag = 'prop', spec = 1.2, shin = 60, emit = 0.15, fallback = null } = {}) {
  const f = typeof film === 'string' ? hex(film) : film;
  return mat((x, y, z, lx, ly, lz, nx, ny, nz) => {
    let hit = null;
    for (let i = 1; i <= steps && !hit; i++) {
      const s = (i / steps) * depth;
      hit = under(x - VIEW[0] * s, y - VIEW[1] * s, z - VIEW[2] * s, s);
    }
    const base = typeof f === 'function' ? f(x, y, z, lx, ly, lz, nx, ny, nz) : f;
    if (!hit) return fallback ? mix(base, hex(fallback), 0.5) : base;
    return mix(hit, base, k);
  }, { tag, spec, shin, emit });
}

export { mat, hex, mix, fbm, vnoise, hash3 };
