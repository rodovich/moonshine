// Post-processing: render buffers → 16-bit-color RGBA images with hard
// (color-keyed) edges, optional outlines, dithering, and shadow layers.

const BAYER4 = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5].map((v) => (v + 0.5) / 16 - 0.5);

/** Linear light → display value 0–1, with a soft shoulder instead of clipping. */
export function tone(x) {
  if (x > 0.75) x = 0.75 + 0.25 * (1 - Math.exp(-(x - 0.75) * 4));
  return Math.pow(Math.max(0, x), 1 / 2.2);
}

/** Quantize a 0–1 display value to `bits` bits (with an ordered-dither offset), back to 0–255. */
export function q(v, bits, d) {
  const levels = (1 << bits) - 1;
  const x = Math.max(0, Math.min(levels, Math.round(v * levels + d)));
  return Math.round((x * 255) / levels);
}

/**
 * Convert a rendered frame to an image.
 * opts.alphaCut: coverage needed to draw a pixel (default 0.5)
 * opts.ink: [r,g,b] 0–255 color to blend into silhouette edge pixels, with opts.inkAmount (0–1)
 * opts.crease: depth jump (world units) that darkens the far side of an internal edge; opts.creaseAmount
 * opts.dither: amplitude of ordered dither in quantization steps (default 0.5)
 * opts.bits: [r, g, b] bits per channel (default 5, 6, 5: 16-bit color)
 */
export function toImage(fr, opts = {}) {
  const { w, h, px } = fr;
  const cut = opts.alphaCut ?? 0.5;
  const bits = opts.bits ?? [5, 6, 5];
  const dith = opts.dither ?? 0.5;
  const data = new Uint8Array(w * h * 4);
  const on = (x, y) => x >= 0 && y >= 0 && x < w && y < h && px[y * w + x].a >= cut;
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const p = px[y * w + x];
    if (p.a < cut) continue;
    let c = [tone(p.c[0]), tone(p.c[1]), tone(p.c[2])];
    if (opts.ink) {
      const edge = !on(x - 1, y) || !on(x + 1, y) || !on(x, y - 1) || !on(x, y + 1);
      if (edge && !(opts.inkSkip && opts.inkSkip(p))) {
        const k = opts.inkAmount ?? 0.6;
        c = c.map((v, i) => v * (1 - k) + (opts.ink[i] / 255) * k);
      }
    }
    if (opts.crease) {
      let behind = false;
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        if (!on(x + dx, y + dy)) continue;
        const o = px[(y + dy) * w + x + dx];
        if (o.z - p.z > opts.crease) behind = true;
      }
      if (behind) {
        const k = opts.creaseAmount ?? 0.35;
        const ink = opts.ink || [32, 24, 40];
        c = c.map((v, i) => v * (1 - k) + (ink[i] / 255) * k);
      }
    }
    const d = BAYER4[(y & 3) * 4 + (x & 3)] * dith * 2;
    const i = (y * w + x) * 4;
    data[i] = q(c[0], bits[0], d);
    data[i + 1] = q(c[1], bits[1], d);
    data[i + 2] = q(c[2], bits[2], d);
    data[i + 3] = 255;
  }
  return { w, h, ax: fr.ax, ay: fr.ay, data };
}

/**
 * The cast-shadow layer of a frame: a dark, translucent image of the shadow on
 * the invisible floor, outside the object's own pixels. Alpha is stepped to 8
 * levels so it stays honest to a 16-bit-era blend.
 */
export function shadowImage(fr, opts = {}) {
  const { w, h, px } = fr;
  const col = opts.color ?? [24, 16, 40];
  const strength = opts.strength ?? 0.55;
  const data = new Uint8Array(w * h * 4);
  for (let i = 0; i < w * h; i++) {
    const p = px[i];
    const a = Math.min(1, p.shadow) * strength;
    if (a < 0.02) continue;
    data[i * 4] = col[0]; data[i * 4 + 1] = col[1]; data[i * 4 + 2] = col[2];
    data[i * 4 + 3] = Math.round(Math.round(a * 8) / 8 * 255);
  }
  return { w, h, ax: fr.ax, ay: fr.ay, data };
}

/** Keep only the pixels for which keep(p) is true (by render buffer), e.g. to split a column by facing. */
export function maskImage(img, fr, keep) {
  const out = new Uint8Array(img.data);
  for (let i = 0; i < fr.w * fr.h; i++) if (!keep(fr.px[i], i)) out[i * 4 + 3] = 0, out[i * 4] = out[i * 4 + 1] = out[i * 4 + 2] = 0;
  return { ...img, data: out };
}

/** Crop an image to its opaque pixels (keeping the anchor consistent). */
export function trim(img, pad = 0) {
  const { w, h, data } = img;
  let x0 = w, y0 = h, x1 = -1, y1 = -1;
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) if (data[(y * w + x) * 4 + 3]) {
    x0 = Math.min(x0, x); y0 = Math.min(y0, y); x1 = Math.max(x1, x); y1 = Math.max(y1, y);
  }
  if (x1 < 0) return { w: 1, h: 1, ax: img.ax, ay: img.ay, data: new Uint8Array(4) };
  x0 = Math.max(0, x0 - pad); y0 = Math.max(0, y0 - pad); x1 = Math.min(w - 1, x1 + pad); y1 = Math.min(h - 1, y1 + pad);
  const nw = x1 - x0 + 1, nh = y1 - y0 + 1;
  const out = new Uint8Array(nw * nh * 4);
  for (let y = 0; y < nh; y++) out.set(data.subarray(((y + y0) * w + x0) * 4, ((y + y0) * w + x0 + nw) * 4), y * nw * 4);
  return { w: nw, h: nh, ax: img.ax - x0, ay: img.ay - y0, data: out };
}

/** Blank image. */
export const blank = (w, h) => ({ w, h, ax: 0, ay: 0, data: new Uint8Array(w * h * 4) });

/** Alpha-composite src onto dst with src's anchor at (x, y) in dst. */
export function blit(dst, src, x, y, alphaScale = 1) {
  const ox = Math.round(x - src.ax), oy = Math.round(y - src.ay);
  for (let sy = 0; sy < src.h; sy++) {
    const dy = oy + sy;
    if (dy < 0 || dy >= dst.h) continue;
    for (let sx = 0; sx < src.w; sx++) {
      const dx = ox + sx;
      if (dx < 0 || dx >= dst.w) continue;
      const si = (sy * src.w + sx) * 4, di = (dy * dst.w + dx) * 4;
      const a = (src.data[si + 3] / 255) * alphaScale;
      if (!a) continue;
      for (let k = 0; k < 3; k++) dst.data[di + k] = Math.round(dst.data[di + k] * (1 - a) + src.data[si + k] * a);
      dst.data[di + 3] = Math.max(dst.data[di + 3], Math.round(a * 255));
    }
  }
}

/** Scale an image up by an integer factor (for previews). */
export function upscale(img, k) {
  const w = img.w * k, h = img.h * k, data = new Uint8Array(w * h * 4);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const si = (((y / k) | 0) * img.w + ((x / k) | 0)) * 4, di = (y * w + x) * 4;
    data[di] = img.data[si]; data[di + 1] = img.data[si + 1]; data[di + 2] = img.data[si + 2]; data[di + 3] = img.data[si + 3];
  }
  return { w, h, ax: img.ax * k, ay: img.ay * k, data };
}
