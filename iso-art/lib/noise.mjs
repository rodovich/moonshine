// Deterministic noise for procedural materials: hashes, value noise, fbm,
// and a cellular (Voronoi) pattern for stones.

export function hash3(x, y, z) {
  let h = (x * 374761393 + y * 668265263 + z * 2147483647) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  h ^= h >>> 16;
  return (h >>> 0) / 4294967296;
}
export const hash2 = (x, y) => hash3(x, y, 1013);
export const hash1 = (x) => hash3(x, 7, 1013);

/** Seeded random generator (mulberry32). */
export function rng(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const fade = (t) => t * t * (3 - 2 * t);

/** Value noise in [0, 1]. `period` (in cells) makes it tile; 0 means no tiling. */
export function vnoise(x, y, z = 0, period = 0) {
  const xi = Math.floor(x), yi = Math.floor(y), zi = Math.floor(z);
  const xf = fade(x - xi), yf = fade(y - yi), zf = fade(z - zi);
  const w = (i, j, k) => {
    let a = xi + i, b = yi + j;
    if (period) { a = ((a % period) + period) % period; b = ((b % period) + period) % period; }
    return hash3(a, b, zi + k);
  };
  const l = (a, b, t) => a + (b - a) * t;
  return l(
    l(l(w(0, 0, 0), w(1, 0, 0), xf), l(w(0, 1, 0), w(1, 1, 0), xf), yf),
    l(l(w(0, 0, 1), w(1, 0, 1), xf), l(w(0, 1, 1), w(1, 1, 1), xf), yf),
    zf,
  );
}

/** Fractal value noise in [0, 1]. */
export function fbm(x, y, z = 0, oct = 4, period = 0) {
  let s = 0, a = 0.5, n = 0, f = 1;
  for (let i = 0; i < oct; i++) {
    s += a * vnoise(x * f, y * f, z * f, period ? period * f : 0);
    n += a; a *= 0.5; f *= 2;
  }
  return s / n;
}

/** Voronoi in 2D: returns { f1, f2, id } where id is a stable hash of the nearest cell. */
export function voronoi(x, y, period = 0, jitter = 0.8, seed = 0) {
  const xi = Math.floor(x), yi = Math.floor(y);
  let f1 = 9, f2 = 9, id = 0;
  for (let j = -1; j <= 1; j++) for (let i = -1; i <= 1; i++) {
    let cx = xi + i, cy = yi + j;
    let hx = cx, hy = cy;
    if (period) { hx = ((cx % period) + period) % period; hy = ((cy % period) + period) % period; }
    const px = cx + 0.5 + (hash3(hx, hy, 31 + seed) - 0.5) * jitter;
    const py = cy + 0.5 + (hash3(hx, hy, 77 + seed) - 0.5) * jitter;
    const d = Math.hypot(px - x, py - y);
    if (d < f1) { f2 = f1; f1 = d; id = hash3(hx, hy, 5 + seed); } else if (d < f2) f2 = d;
  }
  return { f1, f2, id };
}

// Value noise with a quintic fade: its gradient is smooth too, so normals bent by it (bump
// maps) don't crease along the lattice planes, which read as straight seams on a big surface.
const fade5 = (t) => t * t * t * (t * (t * 6 - 15) + 10);
export function vnoiseQ(x, y, z = 0) {
  const xi = Math.floor(x), yi = Math.floor(y), zi = Math.floor(z);
  const xf = fade5(x - xi), yf = fade5(y - yi), zf = fade5(z - zi);
  const w = (i, j, k) => hash3(xi + i, yi + j, zi + k);
  const l = (a, b, t) => a + (b - a) * t;
  return l(
    l(l(w(0, 0, 0), w(1, 0, 0), xf), l(w(0, 1, 0), w(1, 1, 0), xf), yf),
    l(l(w(0, 0, 1), w(1, 0, 1), xf), l(w(0, 1, 1), w(1, 1, 1), xf), yf),
    zf,
  );
}
export function fbmQ(x, y, z = 0, oct = 4) {
  let s = 0, a = 0.5, n = 0, f = 1;
  for (let i = 0; i < oct; i++) { s += a * vnoiseQ(x * f, y * f, z * f); n += a; a *= 0.5; f *= 2; }
  return s / n;
}
