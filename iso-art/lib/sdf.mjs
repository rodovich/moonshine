// Signed distance field modeling for the isometric art.
//
// World units: x east, y south, z up. One unit is one map tile's edge (about a
// meter). A model is a tree of nodes. Every node has `dist(x, y, z)` and a
// world-space axis-aligned bounding box `b` = [x0, y0, z0, x1, y1, z1], and can
// report which leaf is nearest (`near`), so the renderer can ask that leaf's
// material for a color. Groups skip children whose bounding box is farther
// than the best distance found so far, which keeps big scenes fast.

const INF = 1e9;

function boxDist(b, x, y, z) {
  const dx = Math.max(b[0] - x, 0, x - b[3]);
  const dy = Math.max(b[1] - y, 0, y - b[4]);
  const dz = Math.max(b[2] - z, 0, z - b[5]);
  return Math.sqrt(dx * dx + dy * dy + dz * dz);
}

// Scratch result for `near`: the leaf hit and the point in its local frame.
export const NEAR = { d: INF, leaf: null, lx: 0, ly: 0, lz: 0 };

// ---------------------------------------------------------------------------
// Leaves

class Leaf {
  constructor(fn, bounds, mat) {
    this.fn = fn; this.b = bounds; this.mat = mat; this.tag = mat && mat.tag;
  }
  dist(x, y, z) { return this.fn(x, y, z); }
  near(x, y, z) {
    const d = this.fn(x, y, z);
    if (d < NEAR.d) { NEAR.d = d; NEAR.leaf = this; NEAR.lx = x; NEAR.ly = y; NEAR.lz = z; }
    return d;
  }
}

const len2 = (x, y) => Math.sqrt(x * x + y * y);
const len3 = (x, y, z) => Math.sqrt(x * x + y * y + z * z);

/** Box with half-extents (hx, hy, hz) and rounded edges of radius r, centered at the origin. */
export function box(hx, hy, hz, mat, r = 0) {
  return new Leaf((x, y, z) => {
    const qx = Math.abs(x) - hx + r, qy = Math.abs(y) - hy + r, qz = Math.abs(z) - hz + r;
    return len3(Math.max(qx, 0), Math.max(qy, 0), Math.max(qz, 0)) + Math.min(Math.max(qx, qy, qz), 0) - r;
  }, [-hx, -hy, -hz, hx, hy, hz], mat);
}

/** Box from corner (x0,y0,z0) to (x1,y1,z1), rounded by r. */
export function boxAt(x0, y0, z0, x1, y1, z1, mat, r = 0) {
  return move(box((x1 - x0) / 2, (y1 - y0) / 2, (z1 - z0) / 2, mat, r), (x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2);
}

export function sphere(r, mat) {
  return new Leaf((x, y, z) => len3(x, y, z) - r, [-r, -r, -r, r, r, r], mat);
}

/** Ellipsoid with radii (rx, ry, rz) (approximate distance, good enough to march). */
export function ellipsoid(rx, ry, rz, mat) {
  return new Leaf((x, y, z) => {
    const k0 = len3(x / rx, y / ry, z / rz);
    const k1 = len3(x / (rx * rx), y / (ry * ry), z / (rz * rz));
    return k1 === 0 ? -Math.min(rx, ry, rz) : k0 * (k0 - 1) / k1;
  }, [-rx, -ry, -rz, rx, ry, rz], mat);
}

/** Capsule between points a and b with radius r. */
export function capsule(a, b, r, mat) {
  return roundCone(a, b, r, r, mat);
}

/** Cone-ish capsule from a (radius ra) to b (radius rb). */
export function roundCone(a, b, ra, rb, mat) {
  const [ax, ay, az] = a, [bx, by, bz] = b;
  const bax = bx - ax, bay = by - ay, baz = bz - az;
  const l2 = bax * bax + bay * bay + baz * baz;
  const rr = ra - rb, a2 = l2 - rr * rr, il2 = 1 / l2;
  const fn = (x, y, z) => {
    const pax = x - ax, pay = y - ay, paz = z - az;
    const yy = pax * bax + pay * bay + paz * baz;
    const zz = yy - l2;
    const cx = pax * l2 - bax * yy, cy = pay * l2 - bay * yy, cz = paz * l2 - baz * yy;
    const x2 = cx * cx + cy * cy + cz * cz;
    const y2 = yy * yy * l2, z2 = zz * zz * l2;
    const k = Math.sign(rr) * rr * rr * x2;
    if (Math.sign(zz) * a2 * z2 > k) return Math.sqrt(x2 + z2) * il2 - rb;
    if (Math.sign(yy) * a2 * y2 < k) return Math.sqrt(x2 + y2) * il2 - ra;
    return (Math.sqrt(x2 * a2 * il2) + yy * rr) * il2 - ra;
  };
  const r = Math.max(ra, rb);
  return new Leaf(fn, [Math.min(ax, bx) - r, Math.min(ay, by) - r, Math.min(az, bz) - r,
    Math.max(ax, bx) + r, Math.max(ay, by) + r, Math.max(az, bz) + r], mat);
}

/** Vertical cylinder of radius r from z0 to z1, edges rounded by e. */
export function cylinder(r, z0, z1, mat, e = 0) {
  const hz = (z1 - z0) / 2, cz = (z0 + z1) / 2;
  return new Leaf((x, y, z) => {
    const dx = len2(x, y) - r + e, dz = Math.abs(z - cz) - hz + e;
    return Math.min(Math.max(dx, dz), 0) + len2(Math.max(dx, 0), Math.max(dz, 0)) - e;
  }, [-r, -r, z0, r, r, z1], mat);
}

/** Vertical tapered cylinder: radius r0 at z0, r1 at z1 (a frustum), edge rounding e. */
export function frustum(r0, r1, z0, z1, mat, e = 0) {
  const h = (z1 - z0) / 2, cz = (z0 + z1) / 2;
  const fn = (px, py, pz) => {
    // Inigo Quilez's capped cone, centered.
    const qx = len2(px, py), qy = pz - cz;
    const k1x = r1, k1y = h, k2x = r1 - r0, k2y = 2 * h;
    const cax = qx - Math.min(qx, qy < 0 ? r0 : r1), cay = Math.abs(qy) - h;
    const t = Math.min(Math.max(((k1x - qx) * k2x + (k1y - qy) * k2y) / (k2x * k2x + k2y * k2y), 0), 1);
    const cbx = qx - k1x + k2x * t, cby = qy - k1y + k2y * t;
    const s = cbx < 0 && cay < 0 ? -1 : 1;
    return s * Math.sqrt(Math.min(cax * cax + cay * cay, cbx * cbx + cby * cby)) - e;
  };
  const r = Math.max(r0, r1) + e;
  return new Leaf(fn, [-r, -r, z0 - e, r, r, z1 + e], mat);
}

/** Torus around the z axis: ring radius R, tube radius r. */
export function torus(R, r, mat) {
  return new Leaf((x, y, z) => len2(len2(x, y) - R, z) - r, [-R - r, -R - r, -r, R + r, R + r, r], mat);
}

/** Generic leaf from a distance function and its local bounds. */
export function custom(fn, bounds, mat) { return new Leaf(fn, bounds, mat); }

// ---------------------------------------------------------------------------
// Groups and operations

// For composite nodes: if distance d beats the best so far, find which leaf is
// responsible by asking `child` (with the best reset), then record d.
function nearVia(d, child, x, y, z) {
  if (d < NEAR.d) {
    NEAR.d = INF; NEAR.leaf = null;
    child.near(x, y, z);
    NEAR.d = d;
  }
  return d;
}

class Union {
  constructor(kids) {
    this.kids = kids.filter(Boolean);
    const b = [INF, INF, INF, -INF, -INF, -INF];
    for (const k of this.kids) for (let i = 0; i < 3; i++) { b[i] = Math.min(b[i], k.b[i]); b[i + 3] = Math.max(b[i + 3], k.b[i + 3]); }
    this.b = b;
  }
  dist(x, y, z) {
    let d = INF;
    for (const k of this.kids) {
      if (boxDist(k.b, x, y, z) >= d) continue;
      const kd = k.dist(x, y, z);
      if (kd < d) d = kd;
    }
    return d;
  }
  near(x, y, z) {
    let d = INF;
    for (const k of this.kids) {
      if (boxDist(k.b, x, y, z) >= Math.min(d, NEAR.d)) continue;
      const kd = k.near(x, y, z);
      if (kd < d) d = kd;
    }
    return d;
  }
}
export const union = (...kids) => new Union(kids.flat());

/** Smooth union with blend radius k; the material is the nearest child's. */
class SmoothUnion {
  constructor(k, kids) {
    this.k = k; this.kids = kids.filter(Boolean);
    const b = [INF, INF, INF, -INF, -INF, -INF];
    for (const c of this.kids) for (let i = 0; i < 3; i++) { b[i] = Math.min(b[i], c.b[i] - k); b[i + 3] = Math.max(b[i + 3], c.b[i + 3] + k); }
    this.b = b;
  }
  dist(x, y, z) {
    const k = this.k;
    let d = INF;
    for (const c of this.kids) {
      if (boxDist(c.b, x, y, z) - k >= d) continue;
      const cd = c.dist(x, y, z);
      if (d === INF) { d = cd; continue; }
      const h = Math.max(k - Math.abs(d - cd), 0) / k;
      d = Math.min(d, cd) - h * h * k * 0.25;
    }
    return d;
  }
  near(x, y, z) {
    const d = this.dist(x, y, z);
    if (d < NEAR.d) {
      NEAR.d = INF; NEAR.leaf = null;
      for (const c of this.kids) c.near(x, y, z);
      NEAR.d = d;
    }
    return d;
  }
}
export const smooth = (k, ...kids) => new SmoothUnion(k, kids.flat());

/** a minus b. */
class Subtract {
  constructor(a, b, mat) { this.a = a; this.c = b; this.b = a.b; this.mat = mat; this.tag = mat && mat.tag; }
  dist(x, y, z) {
    const da = this.a.dist(x, y, z);
    if (boxDist(this.c.b, x, y, z) > Math.abs(da)) return da;
    return Math.max(da, -this.c.dist(x, y, z));
  }
  near(x, y, z) {
    const da = this.a.dist(x, y, z), dc = -this.c.dist(x, y, z);
    const d = Math.max(da, dc);
    if (d < NEAR.d) {
      if (dc > da && this.mat) { NEAR.d = d; NEAR.leaf = this; NEAR.lx = x; NEAR.ly = y; NEAR.lz = z; }
      else nearVia(d, dc > da ? this.c : this.a, x, y, z);
    }
    return d;
  }
}
/** Carve b out of a. The cut surface takes b's material unless `cutMat` is given. */
export const subtract = (a, b, cutMat) => new Subtract(a, b, cutMat);

class Intersect {
  constructor(a, b) { this.a = a; this.c = b; this.b = [Math.max(a.b[0], b.b[0]), Math.max(a.b[1], b.b[1]), Math.max(a.b[2], b.b[2]), Math.min(a.b[3], b.b[3]), Math.min(a.b[4], b.b[4]), Math.min(a.b[5], b.b[5])]; }
  dist(x, y, z) { return Math.max(this.a.dist(x, y, z), this.c.dist(x, y, z)); }
  near(x, y, z) {
    const da = this.a.dist(x, y, z), dc = this.c.dist(x, y, z);
    return nearVia(Math.max(da, dc), da >= dc ? this.a : this.c, x, y, z);
  }
}
/** The part of a inside b; the surface keeps whichever child's surface it is. */
export const intersect = (a, b) => new Intersect(a, b);

/** Shell of thickness t around a node. */
export function shell(node, t) {
  return {
    b: node.b.map((v, i) => (i < 3 ? v - t : v + t)),
    dist(x, y, z) { return Math.abs(node.dist(x, y, z)) - t; },
    near(x, y, z) { return nearVia(this.dist(x, y, z), node, x, y, z); },
  };
}

/** Grow (positive) or shrink a node's surface by r. */
export function inflate(node, r) {
  return {
    b: node.b.map((v, i) => (i < 3 ? v - r : v + r)),
    dist(x, y, z) { return node.dist(x, y, z) - r; },
    near(x, y, z) { return nearVia(this.dist(x, y, z), node, x, y, z); },
  };
}

// ---------------------------------------------------------------------------
// Transforms

function rotMatrix(rx, ry, rz) {
  // R = Rz * Ry * Rx (applied to a local point gives world orientation).
  const cx = Math.cos(rx), sx = Math.sin(rx), cy = Math.cos(ry), sy = Math.sin(ry), cz = Math.cos(rz), sz = Math.sin(rz);
  return [
    cz * cy, cz * sy * sx - sz * cx, cz * sy * cx + sz * sx,
    sz * cy, sz * sy * sx + cz * cx, sz * sy * cx - cz * sx,
    -sy, cy * sx, cy * cx,
  ];
}

class Transform {
  // world = R * (s * local) + t
  constructor(child, t, R, s) {
    this.child = child; this.t = t; this.R = R; this.s = s;
    // World bounds from the 8 transformed corners.
    const cb = child.b;
    const b = [INF, INF, INF, -INF, -INF, -INF];
    for (let i = 0; i < 8; i++) {
      const lx = (i & 1 ? cb[3] : cb[0]) * s, ly = (i & 2 ? cb[4] : cb[1]) * s, lz = (i & 4 ? cb[5] : cb[2]) * s;
      const w = [R[0] * lx + R[1] * ly + R[2] * lz + t[0], R[3] * lx + R[4] * ly + R[5] * lz + t[1], R[6] * lx + R[7] * ly + R[8] * lz + t[2]];
      for (let k = 0; k < 3; k++) { b[k] = Math.min(b[k], w[k]); b[k + 3] = Math.max(b[k + 3], w[k]); }
    }
    this.b = b;
  }
  local(x, y, z) {
    const R = this.R, px = x - this.t[0], py = y - this.t[1], pz = z - this.t[2], is = 1 / this.s;
    // Inverse rotation is the transpose.
    return [(R[0] * px + R[3] * py + R[6] * pz) * is, (R[1] * px + R[4] * py + R[7] * pz) * is, (R[2] * px + R[5] * py + R[8] * pz) * is];
  }
  dist(x, y, z) {
    const [lx, ly, lz] = this.local(x, y, z);
    return this.child.dist(lx, ly, lz) * this.s;
  }
  near(x, y, z) {
    const [lx, ly, lz] = this.local(x, y, z);
    const s = this.s, saved = NEAR.d;
    NEAR.d = saved / s;
    const d = this.child.near(lx, ly, lz) * s;
    NEAR.d = Math.min(saved, NEAR.d * s);
    return d;
  }
}

/** Move a node by (x, y, z). */
export const move = (node, x, y, z = 0) => new Transform(node, [x, y, z], [1, 0, 0, 0, 1, 0, 0, 0, 1], 1);
/** Rotate about the origin (radians: rx about x, ry about y, rz about z, applied x, then y, then z), then move. */
export const place = (node, { at = [0, 0, 0], rx = 0, ry = 0, rz = 0, s = 1 } = {}) =>
  new Transform(node, at, rotMatrix(rx, ry, rz), s);

/** Bake a node into a group so `near` works through it as a leaf with one material (for subtract results). */
export function solid(node, mat) {
  return {
    b: node.b, mat, tag: mat && mat.tag,
    dist(x, y, z) { return node.dist(x, y, z); },
    near(x, y, z) { const d = node.dist(x, y, z); if (d < NEAR.d) { NEAR.d = d; NEAR.leaf = this; NEAR.lx = x; NEAR.ly = y; NEAR.lz = z; } return d; },
  };
}

export { INF, boxDist };

/** Non-uniform scale (sx, sy, sz) about the origin. The distance is scaled by the smallest factor, so it stays safe to march. */
export function squash(node, sx, sy, sz) {
  const k = Math.min(sx, sy, sz);
  const cb = node.b;
  return {
    b: [cb[0] * sx, cb[1] * sy, cb[2] * sz, cb[3] * sx, cb[4] * sy, cb[5] * sz],
    dist(x, y, z) { return node.dist(x / sx, y / sy, z / sz) * k; },
    near(x, y, z) {
      const saved = NEAR.d;
      NEAR.d = saved / k;
      const d = node.near(x / sx, y / sy, z / sz) * k;
      NEAR.d = Math.min(saved, NEAR.d * k);
      return d;
    },
  };
}
