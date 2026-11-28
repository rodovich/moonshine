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
        const masked = maskImage(img, fr, (p, i) => keep(p, (i % fr.w) - fr.ax + 0.5, Math.floor(i / fr.w) - fr.ay + 0.5));
        return { name: n, img: trim(masked), fp: opts.fp, h: opts.h };
      });
    },
  };
}
