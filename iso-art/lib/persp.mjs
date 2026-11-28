// A perspective raymarcher for full-screen pictures (the moonrise vista).
//
// World units are meters; x east, y south, z up (as the iso art). The camera
// has a position, a yaw (0 = looking east, +x), a pitch, and a focal length in
// pixels. Each pixel's hit is assigned to a layer by its material's `layer`,
// so the scene can be split into planes the engine moves independently (sky,
// far, foreground…). Misses go to the sky function.

import { NEAR, INF } from './sdf.mjs';

const norm = (v) => { const l = Math.hypot(v[0], v[1], v[2]); return [v[0] / l, v[1] / l, v[2] / l]; };

function normalAt(scene, x, y, z, e) {
  const a = scene.dist(x + e, y - e, z - e), b = scene.dist(x - e, y - e, z + e);
  const c = scene.dist(x - e, y + e, z - e), d = scene.dist(x + e, y + e, z + e);
  return norm([a - b - c + d, -a - b + c + d, -a + b - c + d]);
}

/** March a ray; returns { t, hit } (t in meters). */
function march(scene, o, d, tMax, relEps = 0.0006, maxSteps = 500) {
  let t = 0.01;
  for (let i = 0; i < maxSteps && t < tMax; i++) {
    const x = o[0] + d[0] * t, y = o[1] + d[1] * t, z = o[2] + d[2] * t;
    const h = scene.dist(x, y, z);
    if (h < Math.max(0.002, t * relEps)) return { t, hit: true };
    t += h * 0.8;
  }
  return { t, hit: false };
}

function softShadow(scene, p, l, k, tMax) {
  let res = 1, t = 0.05;
  for (let i = 0; i < 80 && t < tMax; i++) {
    const h = scene.dist(p[0] + l[0] * t, p[1] + l[1] * t, p[2] + l[2] * t);
    if (h < 0.001 * t + 0.002) return 0;
    res = Math.min(res, (k * h) / t);
    t += Math.max(h * 0.9, 0.02 + t * 0.01);
  }
  return Math.max(0, Math.min(1, res));
}

/**
 * Render. opts:
 *   w, h, ss — size and supersampling
 *   cam: { pos: [x,y,z], yaw, pitch, f, cx?, cy? } (cx, cy: the principal point, default center)
 *   sky(dir) → linear rgb
 *   sun: { dir (toward the sun), color }, ambient(n, p) → rgb (sky fill)
 *   water: { z, ripple(x, y) → [dnx, dny] } — a mirror plane below everything else
 *   shade(m, p, n, ctx) optional per-material hook → rgb (overrides default lighting)
 *   layers: list of layer names; a material's `layer` picks one (default first non-sky layer)
 * Returns { layers: { name: { w, h, px: [{ c, a }] } } } with linear colors.
 */
export function renderPersp(scene, opts) {
  const { w, h } = opts;
  const ss = opts.ss ?? 2;
  const cam = opts.cam;
  const cy0 = cam.cy ?? h / 2, cx0 = cam.cx ?? w / 2;
  const cyaw = Math.cos(cam.yaw), syaw = Math.sin(cam.yaw), cp = Math.cos(cam.pitch), sp = Math.sin(cam.pitch);
  // Camera basis: forward, right, up.
  const fwd = [cyaw * cp, syaw * cp, sp];
  const right = [-syaw, cyaw, 0];
  const up = [-cyaw * sp, -syaw * sp, cp];
  const layers = {};
  for (const name of opts.layers) layers[name] = { w, h, px: new Array(w * h) };
  const y0 = opts.rows ? opts.rows[0] : 0, y1 = opts.rows ? opts.rows[1] : h;
  const sun = norm(opts.sun.dir);
  const tMax = opts.tMax ?? 20000;

  const shadeHit = (o, d, t, depth) => {
    const p = [o[0] + d[0] * t, o[1] + d[1] * t, o[2] + d[2] * t];
    NEAR.d = INF; NEAR.leaf = null;
    scene.near(p[0], p[1], p[2]);
    const leaf = NEAR.leaf;
    const m = leaf && leaf.mat;
    const n = normalAt(scene, p[0], p[1], p[2], Math.max(0.002, t * 0.0004));
    const alb = m ? m.color(p[0], p[1], p[2], NEAR.lx, NEAR.ly, NEAR.lz, n[0], n[1], n[2]) : [0.5, 0.5, 0.5];
    let n0 = n;
    if (m && m.bump) { const bn = m.bump(p[0], p[1], p[2], n); const l = Math.hypot(bn[0], bn[1], bn[2]); n0 = [bn[0] / l, bn[1] / l, bn[2] / l]; }
    const em = alb[3] ?? (m ? m.emit : 0) ?? 0;
    if (em >= 1) return { c: alb.slice(0, 3).map((v) => v * 1.4), m, p, n };
    const ndl = Math.max(0, n0[0] * sun[0] + n0[1] * sun[1] + n0[2] * sun[2]);
    let sh = 0;
    if (ndl > 0) { const off = Math.max(0.02, t * 0.002); sh = (m && m.noShadow) ? 1 : softShadow(scene, [p[0] + n[0] * off, p[1] + n[1] * off, p[2] + n[2] * off], sun, 12, opts.shadowMax ?? 400); }
    const sunAmt = opts.sunAt ? opts.sunAt(p) : 1;
    const amb = opts.ambient(n0, p);
    let c = [0, 1, 2].map((i) => alb[i] * (opts.sun.color[i] * ndl * sh * sunAmt + amb[i]));
    if (m && m.spec) {
      const r = [d[0] - 2 * n[0] * (d[0] * n[0] + d[1] * n[1] + d[2] * n[2]), d[1] - 2 * n[1] * (d[0] * n[0] + d[1] * n[1] + d[2] * n[2]), d[2] - 2 * n[2] * (d[0] * n[0] + d[1] * n[1] + d[2] * n[2])];
      const sk = opts.sky(norm(r));
      c = c.map((v, i) => v * (1 - m.spec * 0.5) + sk[i] * m.spec * 0.5);
    }
    if (em) c = c.map((v, i) => v * (1 - em) + alb[i] * em);
    if (opts.rim) { const rl = opts.rim(p, n0, d, m); if (rl) c = c.map((v, i) => v + alb[i] * rl[i]); }
    if (opts.fog) c = opts.fog(c, p, t);
    return { c, m, p, n };
  };

  for (let py = y0; py < y1; py++) for (let px = 0; px < w; px++) {
    const acc = {};
    for (const name of opts.layers) acc[name] = { r: 0, g: 0, b: 0, n: 0 };
    for (let sy = 0; sy < ss; sy++) for (let sx = 0; sx < ss; sx++) {
      const u = (px + (sx + 0.5) / ss - cx0) / cam.f, v = -(py + (sy + 0.5) / ss - cy0) / cam.f;
      const d = norm([fwd[0] + right[0] * u + up[0] * v, fwd[1] + right[1] * u + up[1] * v, fwd[2] + right[2] * u + up[2] * v]);
      const o = cam.pos;
      let { t, hit } = march(scene, o, d, tMax);
      // Water plane.
      let tw = INF;
      if (opts.water && d[2] < 0) tw = (opts.water.z - o[2]) / d[2];
      let col, layer;
      if (hit && t < tw) {
        const s = shadeHit(o, d, t, 0);
        col = s.c; layer = (s.m && s.m.layer) || opts.defaultLayer || opts.layers[1];
      } else if (tw < INF && tw < tMax) {
        // Reflect: the sky and anything the reflected ray meets.
        const p = [o[0] + d[0] * tw, o[1] + d[1] * tw, opts.water.z + 0.001];
        const [rx, ry] = opts.water.ripple(p[0], p[1], tw);
        const n = norm([rx, ry, 1]);
        const dn = d[0] * n[0] + d[1] * n[1] + d[2] * n[2];
        let r = [d[0] - 2 * n[0] * dn, d[1] - 2 * n[1] * dn, Math.abs(d[2] - 2 * n[2] * dn)];
        r = norm(r);
        const rm = march(scene, p, r, tMax);
        let rc;
        if (rm.hit) rc = shadeHit(p, r, rm.t, 1).c;
        else rc = opts.sky(r);
        const [f0, f1] = opts.water.fresnel || [0.55, 0.45];
        const fres = f0 + f1 * Math.pow(1 - Math.max(0, -d[2]), 5);
        const deep = opts.water.color;
        col = rc.map((v, i) => v * fres + deep[i] * (1 - fres));
        if (opts.water.extra) col = opts.water.extra(col, p, tw);
        layer = opts.water.layer || opts.layers[1];
      }
      // The sky layer is complete everywhere, so the moon and the far planes can move over it.
      const skyC = opts.sky(d), sa = acc[opts.layers[0]];
      sa.r += skyC[0]; sa.g += skyC[1]; sa.b += skyC[2]; sa.n++;
      if (layer && layer !== opts.layers[0]) { const a = acc[layer]; a.r += col[0]; a.g += col[1]; a.b += col[2]; a.n++; }
    }
    const n2 = ss * ss;
    for (const name of opts.layers) {
      const a = acc[name];
      layers[name].px[py * w + px] = a.n ? { c: [a.r / a.n, a.g / a.n, a.b / a.n], a: a.n / n2 } : { c: [0, 0, 0], a: 0 };
    }
  }
  return { layers };
}

/** Sky color by elevation for an eastern dusk (docs/iso-art-direction.md, "Skies"). */
export { norm };
