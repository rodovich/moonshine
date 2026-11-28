// Job helpers for sheet modules: render a model into one or more frames.

import { render } from './render.mjs';
import { toImage, shadowImage, trim, maskImage } from './post.mjs';

// Post-processing presets.
export const POST = {
  // Characters and small props: a soft dark rim on the silhouette and a crease
  // where one part passes in front of another, so they read on busy ground.
  figure: { ink: [36, 26, 46], inkAmount: 0.45, crease: 0.1, creaseAmount: 0.3 },
  prop: { ink: [48, 36, 56], inkAmount: 0.3, crease: 0.12, creaseAmount: 0.22 },
  // Architecture and ground: no outline; shapes separate by light.
  arch: {},
};

/**
 * One frame from one model.
 * opts: { post: POST.*, shadow: bool, fp: [w, d], h: px, ss, ...render options }
 */
export function frame(name, build, opts = {}) {
  return {
    name,
    render() {
      const rect = opts.diamond ? [-32 * opts.diamond[0], -16 * opts.diamond[0] - 4, 64 * opts.diamond[0], 32 * opts.diamond[0] + 8] : undefined;
      const fr = render(build(), { ss: opts.ss ?? 3, ground: opts.shadow ? (opts.ground ?? 0) : null, rect, ...opts.render });
      let img = toImage(fr, opts.post ?? POST.arch);
      // Floor tiles keep exactly their diamond, so they tile without overlap.
      if (opts.diamond) img = maskImage(img, fr, (p, i) => {
        const sx = (i % fr.w) - fr.ax + 0.5, sy = Math.floor(i / fr.w) - fr.ay + 0.5;
        return Math.abs(sx) / (32 * opts.diamond[0]) + Math.abs(sy) / (16 * opts.diamond[0]) <= 1;
      });
      img = trim(img);
      const out = { name, img, fp: opts.fp, h: opts.h };
      if (opts.shadow) out.shadow = trim(shadowImage(fr, opts.shadowOpts));
      return [out];
    },
  };
}

/**
 * A long thin prop along x (n tiles by 1), cut into one-tile slices `${name}_x0` … `_x<n−1>`,
 * west to east, each anchored at its own tile's center, so each sorts with its own tile (an
 * 8-tile frame sorts by its far end and draws over people standing in front of its near end).
 * Valid for things that stay within their row (the cut is by screen x: a tile is 64 px wide on
 * screen along x, 32 px per half). The whole prop's shadow rides on slice 0.
 */
export function sliceX(name, build, n, opts = {}) {
  return {
    name,
    render() {
      const fr = render(build(), { ss: opts.ss ?? 3, ground: opts.shadow ? 0 : null });
      const img = toImage(fr, opts.post ?? POST.prop);
      const out = [];
      for (let i = 0; i < n; i++) {
        // Tile i spans world x from i − n/2 to i + 1 − n/2 of the footprint's center; on the row's
        // center line (y = 0) that is screen x from 32·(i − n/2) to 32·(i + 1 − n/2), at any height.
        const a = 32 * (i - n / 2), b = 32 * (i + 1 - n / 2);
        const masked = maskImage(img, fr, (p, k) => {
          const sx = (k % fr.w) - fr.ax + 0.5;
          return (i === 0 || sx >= a) && (i === n - 1 || sx < b);
        });
        const dx = 32 * (i + 0.5 - n / 2), dy = 16 * (i + 0.5 - n / 2);
        const t = trim(masked);
        const shifted = { ...t, ax: t.ax + dx, ay: t.ay + dy };
        const f = { name: `${name}_x${i}`, img: shifted, fp: [1, 1], h: opts.h };
        if (i === 0 && opts.shadow) { const s = trim(shadowImage(fr)); f.shadow = { ...s, ax: s.ax + dx, ay: s.ay + dy }; }
        out.push(f);
      }
      return out;
    },
  };
}

/**
 * Several frames from one render, split by a classifier on each pixel's render
 * data (and screen x relative to the anchor). `parts` maps frame names to
 * predicates (p, sx, sy) → bool, where sx, sy are pixel offsets from the anchor.
 */
export function split(name, build, parts, opts = {}) {
  return {
    name,
    render() {
      const fr = render(build(), { ss: opts.ss ?? 3, ...opts.render });
      const img = toImage(fr, opts.post ?? POST.arch);
      return Object.entries(parts).map(([n, keep]) => {
        // trimTop: a wall face (a half of a column render) keeps nothing above its top edge, so the
        // column's lit top doesn't come with it (it showed over roofs the engine draws first).
        // The top edges run from the tile's south corner (0, 16) up h px and out half a px per px.
        const top = (sx, sy) => !opts.trimTop || sy >= 16 - opts.h - Math.abs(sx) / 2 - 0.5;
        const masked = maskImage(img, fr, (p, i) => {
          const sx = (i % fr.w) - fr.ax + 0.5, sy = Math.floor(i / fr.w) - fr.ay + 0.5;
          return keep(p, sx, sy) && top(sx, sy);
        });
        return { name: n, img: trim(masked), fp: opts.fp, h: opts.h };
      });
    },
  };
}
