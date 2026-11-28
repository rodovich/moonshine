// The moonrise vista (docs/design/01-opening.md, step 5): the Bowl at dusk from
// Cheryl's roof, looking east. Sun setting behind the viewer (west), so the
// eastern sky has no sunset glow: Earth's shadow along the Rim, the Belt of
// Venus above it, blue deepening to indigo. The Rim's cliffs catch the last sun
// (alpenglow); the town's west faces are warm, lamps coming on; the Bowl
// mirrors the cool sky. The Gate is a V notch at screen center, and the two
// sighting pins line up on it. (Story bible, "The sky over Tessel".)
//
// World: meters, x east, y south, z up; the tub's center is at (0, 0) on the
// deck, which stands D meters above the sea.

import { custom, union, move, place, boxAt, box, cylinder, torus, capsule, sphere, frustum } from '../lib/sdf.mjs';
import { mat, hex, mix } from '../lib/render.mjs';
import { fbm, vnoise, hash3 } from '../lib/noise.mjs';
import { figure } from './figure.mjs';
import { cherylLook } from './cheryl.mjs';
import { vistaCheryl } from './vista-cheryl.mjs';
import { tub, foldingChair } from './props.mjs';
import { plaster } from './materials.mjs';

export const D = 95; // deck height above the sea: the Upper Terraces, near the summit
export const W = 640, H = 480;
export const CAM = { pos: [-3.6, 0, D + 1.8], yaw: 0, pitch: -Math.atan(10 / 560), f: 560 };
const RIM_R = 3500;
const GATE = 0; // bearing of the Gate (east)

const sstep = (a, b, v) => { const t = Math.max(0, Math.min(1, (v - a) / (b - a))); return t * t * (3 - 2 * t); };
const lerp3 = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];

// ---------------------------------------------------------------------------
// Sky

const SKY = {
  earth: hex('#5a6888'), earthLow: hex('#4a5878'),
  venus: hex('#c890a8'), mauve: hex('#a08098'),
  blue: hex('#405888'), indigo: hex('#283060'), deep: hex('#1a1a40'),
  silver: hex('#d8e0f0'),
};

/** Sky color for a direction (linear). Bands by elevation above the true horizon, in degrees. */
export function sky(d, { stars = true } = {}) {
  const e = Math.asin(Math.max(-1, Math.min(1, d[2]))) * 180 / Math.PI;
  // Facing east at moonrise: the blue-grey Earth's shadow along the horizon, the
  // Belt of Venus a broad soft rose glow above it, blue overhead deepening to indigo.
  let c = lerp3(SKY.earthLow, SKY.earth, sstep(-1, 5, e));
  const belt = Math.exp(-(((e - 9.5) / 5.5) ** 2)) * sstep(2.5, 7, e);
  c = lerp3(c, lerp3(SKY.mauve, SKY.venus, 0.5), belt * 0.55);
  c = lerp3(c, SKY.blue, sstep(9, 22, e) * (1 - belt * 0.35));
  c = lerp3(c, SKY.indigo, sstep(18, 32, e));
  c = lerp3(c, SKY.deep, sstep(28, 45, e));
  if (stars && e > 19) {
    const az = Math.atan2(d[1], d[0]);
    const gx = Math.floor(az * 700), gy = Math.floor(e * 12);
    const hh = hash3(gx, gy, 3);
    if (hh > 0.9993) c = lerp3(c, hex('#e8ecf8'), (0.45 + 0.55 * (hh - 0.9993) / 0.0007) * sstep(19, 24, e));
  }
  return c;
}

// ---------------------------------------------------------------------------
// The Rim: cliffs ringing the Bowl, with the Gate notch due east.

const SPAN = 480; // the cliff band's depth, shore to skyline
const shoreR = (th) => 3250 + 120 * (fbm(th * 8 + 1, 0.5, 0, 3) - 0.5) + 40 * (fbm(th * 40, 2, 0, 2) - 0.5);
const ridged = (v) => 1 - (2 * v - 1) ** 2; // a smooth ridge (a sharp crease made vertical seams on the cliffs)
export const GATE_TH = 0.004, GATE_SADDLE = 128;

/** The skyline height at bearing th: broken, with buttresses, and the Gate's worn saddle. */
export function skyline(th) {
  let H = 370 + 160 * (fbm(th * 5 + 2, 1.1, 0, 4) - 0.5) + 70 * (fbm(th * 18, 3.3, 0, 3) - 0.5);
  const b = ridged(vnoise(th * 45, 5.5, 0)); H += 55 * b * b * b; // towers on the buttresses
  H -= 45 * Math.pow(Math.max(0, ridged(vnoise(th * 30 + 7, 2.2, 1)) - 0.7) / 0.3, 2); // small notches
  const g = th - GATE_TH;
  const sad = GATE_SADDLE + 14 * (vnoise(th * 400, 1, 1) - 0.5);
  // North side (left) steep; south side (right) gentler, with a shoulder part-way up.
  const t = g < 0 ? sstep(0.006, 0.07, -g) : sstep(0.01, 0.17, g) * 0.86 + 0.14 * sstep(0.03, 0.06, g);
  return sad + (H - sad) * t;
}

function rimH(th, r, rs) {
  const t = (r - rs) / SPAN;
  const H = skyline(th);
  if (t < -0.22) return -6;
  if (t < 0) { const u = (t + 0.22) / 0.22; return -6 + u * u * (H * 0.13 + 12 * fbm(th * 300, r * 0.02, 4, 2)); } // scree fans
  if (t > 1) return H + Math.min(40, (t - 1) * 60) + 10 * (fbm(th * 60, r * 0.01, 6, 2) - 0.5);
  // The cliff: ledges and steep risers, beds of rock stepping back.
  // Ledges run along the Rim and fade slowly in and out (a fast-changing offset cut the face into vertical seams).
  const q = t * 5 + 0.6 * fbm(th * 6, 2, 7, 2), fl = Math.floor(q), fr = q - fl;
  const step = Math.min(1, (fl + sstep(0.45, 1, fr)) / 5);
  return H * (0.13 + 0.87 * step);
}

export function rim() {
  const rock = [hex('#c8a892'), hex('#b8a6a8'), hex('#dcc8b4'), hex('#a68478'), hex('#cdb4a4')];
  const cliff = mat((x, y, z, lx, ly, lz, nx, ny, nz) => {
    const th = Math.atan2(y, x);
    const bed = fbm(z * 0.012 + th * 9 + Math.sin(th * 14) * 0.8, th * 6, 1, 3); // beds tilting along the Rim
    const i = Math.floor(bed * rock.length * 1.4) % rock.length;
    let c = lerp3(rock[i], rock[(i + 1) % rock.length], (bed * rock.length * 1.4) % 1);
    c = lerp3(c, hex('#d0987c'), Math.max(0, fbm(th * 6, z * 0.004, 11, 3) - 0.55) * 1.6); // warmer, iron-stained rock in places
    c = c.map((v) => v * (0.88 + vnoise(x * 0.05, y * 0.05, z * 0.05) * 0.2));
    if (nz > 0.6 && z > 20) c = lerp3(c, hex('#58604c'), (0.35 + 0.45 * vnoise(x * 0.05, y * 0.05, 3)) * sstep(0.6, 0.85, nz)); // scrub on the ledges
    if (z < 60) c = lerp3(c, hex('#9a8e94'), sstep(60, 20, z) * 0.6); // scree
    if (z < 2.5) c = lerp3(c, hex('#d8d0d8'), sstep(2.5, 0.4, z) * 0.75); // the wet line
    return c;
  }, {
    layer: 'far', tag: 'rim',
    // Crags: the rock's surface broken at two scales, by bending the normal rather than the shape.
    bump: (x, y, z, n) => {
      const e = 5, f = (a, b, c) => fbm(a * 0.05, b * 0.05, c * 0.06, 2) + 0.6 * fbm(a * 0.012, b * 0.012, c * 0.02, 2);
      const g0 = f(x, y, z);
      const gx = (f(x + e, y, z) - g0) / e, gy = (f(x, y + e, z) - g0) / e, gz = (f(x, y, z + e) - g0) / e;
      const k = 20;
      return [n[0] - gx * k, n[1] - gy * k, n[2] - gz * k];
    },
  });
  return custom((x, y, z) => {
    const r = Math.hypot(x, y);
    // Before the cliffs: the nearest surface is the water-level floor below, or the cliffs
    // ahead, which are no nearer than the gap to them and no higher than ~650 m.
    if (r < 2500) return Math.min(z + 6, Math.max(2600 - r, z - 650));
    const th = Math.atan2(y, x);
    const butt = 150 * (fbm(th * 13 + 4, 0.7, 3, 3) - 0.5) * 2; // great buttresses standing out, bays falling back
    const g = sstep(0.55, 0.95, ridged(vnoise(th * 40 + fbm(th * 15, 1, 2, 2) * 2, 1.5, 9)));
    const rs = shoreR(th) - butt + 45 * g; // and a few broad gullies
    // (Only while well short of the cliffs; close to them the heightfield bound takes over,
    // or rays above the scree would creep up to the guard's edge and stop there.)
    const gap = rs - 0.22 * SPAN - 40 - r;
    if (gap > 40) return Math.min(z + 6, Math.max(gap, z - 650));
    return (z - rimH(th, r, rs)) * 0.24;
  }, [-6000, -6000, -10, 6000, 6000, 700], cliff);
}

// ---------------------------------------------------------------------------
// The town below the roof: whitewashed houses stepping down to the water.

// The island is a long loaf running east–west; Cheryl's roof is near its
// summit, and the town runs ahead of her, down the island's back toward the
// Prow and its lighthouse (east), with the Bowl on either side.
const PROW = 760;
const halfWidth = (x) => (x < PROW ? 300 * Math.sqrt(Math.max(0, 1 - (Math.max(0, x) / PROW) ** 2)) + 30 * (1 - x / PROW) : 0);
export function ground(x, y) {
  // A steep drop below the Upper Terraces, then the long slope down to the Prow.
  const along = D - 6 - 26 * sstep(8, 45, x) - (D - 32) * Math.pow(Math.max(0, x) / PROW, 1.4);
  const w = halfWidth(x);
  if (w <= 0) return -6;
  const s = Math.abs(y) / w;
  return s < 1 ? along - s * s * 18 : along - 18 - (s - 1) * 200;
}

export function houseAt(i, j) {
  // Rows run across the island (along y) every 10 m, a street every third row.
  const street = ((i % 3) + 3) % 3 === 2;
  const cx = i * 10 + 5, cy = j * 10 + 5 + (hash3(i, j, 2) - 0.5) * 1.5;
  const g = ground(i * 10 + 5, cy); // one base per row: terraces
  const hx = 3.6 + hash3(i, j, 3) * 1.1, hy = 3.4 + hash3(i, j, 4) * 1.4;
  const hh = 6 + hash3(i, j, 5) * 8;
  const kind = hash3(i, j, 6);
  return { cx, cy, g, hx, hy, hh, top: g + hh, roof: kind < 0.28 ? 'terra' : kind < 0.31 ? 'dome' : 'flat', lit: hash3(i, j, 7), tint: hash3(i, j, 8), ok: !street && g > 1.5 && cx > 50 && Math.abs(cy) < halfWidth(cx) - 6 && cx < PROW - 60 };
}

function houseDist(hs, x, y, z) {
  if (!hs.ok) return 1e9;
  const qx = Math.abs(x - hs.cx) - hs.hx, qy = Math.abs(y - hs.cy) - hs.hy, qz = Math.abs(z - (hs.top - 15)) - 15;
  let d = Math.hypot(Math.max(qx, 0), Math.max(qy, 0), Math.max(qz, 0)) + Math.min(Math.max(qx, qy, qz), 0);
  if (hs.roof === 'terra') {
    // A low hipped roof on top.
    const rz = hs.top + 1.6 - Math.max(Math.abs(x - hs.cx) - hs.hx * 0.3, Math.abs(y - hs.cy) - hs.hy * 0.5, 0) * 0.5;
    const dr = Math.max((z - rz) * 0.8, hs.top - z, qx - 0.3, qy - 0.3);
    d = Math.min(d, dr);
  } else if (hs.roof === 'dome') {
    const dd = Math.hypot(x - hs.cx, y - hs.cy, (z - hs.top) * 1.1) - Math.min(hs.hx, hs.hy) * 0.75;
    d = Math.min(d, dd);
  } else {
    // A lip round the flat roof; the basin sits in the middle (material).
    const lip = Math.max(Math.abs(qx) - 0.25, Math.abs(qy) - 0.25) < 0 ? 0 : 0;
    void lip;
  }
  return d;
}

export function town() {
  const m = mat((x, y, z, lx, ly, lz, nx, ny, nz) => {
    const i = Math.floor(x / 10), j = Math.floor(y / 10);
    let best = null, bd = 1e9;
    for (let a = -1; a <= 1; a++) for (let b = -1; b <= 1; b++) {
      const hs = houseAt(i + a, j + b);
      const d = houseDist(hs, x, y, z);
      if (d < bd) { bd = d; best = hs; }
    }
    const hs = best;
    if (!hs) return hex('#d8d0c0');
    const walls = [hex('#ece6d8'), hex('#ecd8b8'), hex('#e8c8b8'), hex('#e0e4e0'), hex('#ece6d8')];
    let c = walls[Math.floor(hs.tint * walls.length)];
    if (z > hs.top - 0.05 && nz > 0.6) {
      if (hs.roof === 'terra') return hex('#c06a48');
      if (hs.roof === 'dome') return hex('#3a6cc0');
      // Flat roof: whitewash, with a basin of water in the middle catching the sky.
      if (Math.hypot(x - hs.cx, y - hs.cy) < 0.9) return hex('#a8c0e0');
      return hex('#e8e2d6');
    }
    if (hs.roof === 'terra' && z > hs.top) return hex('#c06a48');
    if (hs.roof === 'dome' && z > hs.top) return hex('#3a6cc0');
    // Windows on the walls: a grid of dark openings; a few lit by lamps.
    const u = Math.abs(nx) > 0.5 ? y : x;
    const wu = ((u - hs.cx - hs.cy + 100) / 2.4) % 1, wz = (z - hs.g) / 2.8;
    const fz = wz % 1, row = Math.floor(wz);
    const cell = Math.floor((u - hs.cx - hs.cy + 100) / 2.4);
    const lit = hash3(cell, row, Math.floor(hs.cx)) < 0.12 + hs.lit * 0.1;
    if (wu > 0.3 && wu < 0.7 && fz > 0.25 && fz < 0.8 && z < hs.top - 0.8 && z > hs.g + 0.5) {
      return lit ? [...hex('#ffcc66'), 1] : hex('#38384c');
    }
    // A lamp's glow on the wall round a lit window (dithered by the 16-bit pass).
    if (lit && Math.abs(nx) > 0.5 && z < hs.top - 0.5 && z > hs.g + 0.3) {
      const dw = Math.max(0, Math.abs(wu - 0.5) - 0.2) * 2.4, dz = Math.max(0, Math.abs(fz - 0.52) - 0.28) * 2.8;
      const glow = Math.max(0, 1 - Math.hypot(dw, dz) / 0.9);
      if (glow > 0) return [...lerp3(c, hex('#ffb850'), glow * 0.6), glow * 0.55];
    }
    return c;
  }, { layer: 'town', tag: 'town', noShadow: true });
  // Lamplit windows glow: mark the material emissive per pixel via a wrapper.
  const node = custom((x, y, z) => {
    const i = Math.floor(x / 10), j = Math.floor(y / 10);
    let d = (z - ground(x, y)) * 0.5;
    for (let a = -1; a <= 1; a++) for (let b = -1; b <= 1; b++) d = Math.min(d, houseDist(houseAt(i + a, j + b), x, y, z));
    return d;
  }, [10, -400, -30, PROW + 20, 400, D], m);
  m.layer = 'town';
  // The Prow Light on its headland: a white tower about 24 m tall, a gallery,
  // and a lantern room whose lamp has just been lit.
  const LX = PROW - 45, LY = 60, LZ = Math.max(3, ground(LX, LY));
  const towerM = mat((x, y, z) => hex('#eeeae2'), { layer: 'town', tag: 'town', noShadow: true });
  const lantern = mat([...hex('#ffe0a0')], { layer: 'town', emit: 1 });
  const ironM = mat('#3a3a48', { layer: 'town', noShadow: true });
  const roofM = mat('#a84838', { layer: 'town', noShadow: true });
  const rock = mat((x, y, z) => lerp3(hex('#8a7a78'), hex('#b0a098'), vnoise(x * 0.3, y * 0.3, z * 0.3)), { layer: 'town', noShadow: true });
  const tower = union(
    move(cylinder(14, -6, 2, rock, 4), LX, LY, LZ - 2), // the headland's rocks
    move(frustum(3.4, 2.6, 0, 20, towerM, 0.3), LX, LY, LZ),
    move(cylinder(3.6, 20, 21, ironM, 0.2), LX, LY, LZ),
    move(cylinder(2.2, 21, 24, lantern), LX, LY, LZ),
    move(frustum(2.6, 0.4, 24, 26, roofM, 0.2), LX, LY, LZ),
  );
  return union(node, tower);
}

// ---------------------------------------------------------------------------
// The foreground: Cheryl's roof, the tub, Cheryl in her costume, the pins.

export function foreground() {
  const slabPl = plaster('#e2d6c6', { tag: 'fg', weather: false });
  const deckM = mat((x, y, z, lx, ly, lz, nx, ny, nz) => {
    const c = slabPl.color(x, y, z, lx, ly, lz, nx, ny, nz);
    const row = Math.floor(x * 2), sy = y + (row % 2 ? 0.5 : 0);
    const fy = sy - Math.floor(sy), fx = x * 2 - row;
    const tone = 0.96 + hash3(row, Math.floor(sy), 3) * 0.06;
    return Math.min(fx * 0.5, (1 - fx) * 0.5, fy, 1 - fy) < 0.012 ? c.map((v) => v * 0.86) : c.map((v) => v * tone);
  }, { tag: 'fg', layer: 'fg', spec: 0.03 });
  const fg = (m) => { m.layer = 'fg'; return m; };
  const wallM = fg(plaster('#ece6d8'));
  const bronzeM = fg(mat('#b08040', { spec: 0.6 }));
  const parts = [];
  // Cheryl's roof ends at the low wall (5.5 m east); beyond it the town falls away.
  // (The Neighbor's roof is left out of the picture so the town shows: the
  // far pin stands on its parapet's end pier, rising from below.)
  parts.push(boxAt(-6, -9, D - 1, 5.64, 9, D, deckM));
  parts.push(boxAt(5.36, -9, D - 6, 5.64, 9, D + 0.3, wallM, 0.03));
  parts.push(boxAt(5.32, -9, D + 0.26, 5.68, 9, D + 0.34, fg(plaster('#f6f2ea', { weather: false })), 0.03));
  // The far parapet's end (Her Next Door's east parapet): a short whitewashed run at 15.5 m.
  // A low run, so it reads as a parapet rather than a post.
  parts.push(boxAt(15.35, -0.8, D - 0.6, 15.65, 0.8, D + 0.3, wallM, 0.03));
  parts.push(boxAt(15.3, -0.85, D + 0.26, 15.7, 0.85, D + 0.36, fg(plaster('#f6f2ea', { weather: false })), 0.03));
  // The sighting pins: matched bronze ring sights on slender rods, the near on the low
  // wall and the far on the far parapet, set so that from the tub they line up on the
  // Gate's saddle like a gunsight, the far ring centered inside the near one.
  const C0 = CAM.pos, P = [3550 * Math.cos(GATE_TH), 3550 * Math.sin(GATE_TH), GATE_SADDLE + 6];
  const onLine = (x) => { const f = (x - C0[0]) / (P[0] - C0[0]); return [x, C0[1] + (P[1] - C0[1]) * f, C0[2] + (P[2] - C0[2]) * f]; };
  const ringSight = (x, base, R) => {
    const c = onLine(x);
    return union(
      capsule([x, c[1], base], [x, c[1], c[2] - R], 0.018, bronzeM), // the rod
      move(cylinder(0.05, base - 0.01, base + 0.04, bronzeM, 0.01), x, c[1], 0), // its foot
      place(torus(R, R * 0.09, bronzeM), { at: c, ry: Math.PI / 2 }), // the ring
      capsule([x, c[1] - R, c[2]], [x, c[1] + R, c[2]], R * 0.025, bronzeM), // fine crosswires
      capsule([x, c[1], c[2] - R], [x, c[1], c[2] + R], R * 0.025, bronzeM),
    );
  };
  parts.push(ringSight(5.5, D + 0.34, 0.26), ringSight(15.5, D + 0.36, 0.2));
  // The tub, and Cheryl on its rim in her costume, from behind.
  const t = tub('full', { t: 0.2 });
  const TY = -0.62; // the tub's center, a little north of the camera's line
  const tubNode = { b: [t.b[0], t.b[1] + TY, t.b[2] + D, t.b[3], t.b[4] + TY, t.b[5] + D], dist: (x, y, z) => t.dist(x, y - TY, z - D), near: (x, y, z) => t.near(x, y - TY, z - D) };
  parts.push(tubNode);
  // On the west rim, knees up, shins in the water, her right hand on the rim beside her.
  const herNode = move(vistaCheryl(), -0.74, TY - 0.14, D + 0.69);
  // "Two chairs. I only sit in the one." Her cardigan lies folded on the nearer.
  const chairs = union(move(foldingChair({ face: 2.7, cardigan: true }), 0.2, 0.85, 0), move(foldingChair({ face: 2.9 }), 1.1, 1.5, 0));
  parts.push({ b: [chairs.b[0], chairs.b[1], chairs.b[2] + D, chairs.b[3], chairs.b[4], chairs.b[5] + D], dist: (x, y, z) => chairs.dist(x, y, z - D), near: (x, y, z) => chairs.near(x, y, z - D) });
  parts.push(herNode);
  return union(parts);
}

export function scene() {
  return union(rim(), town(), foreground());
}

export function lighting() {
  return {
    sun: { dir: [-0.995, 0.06, 0.06], color: [1.3, 0.8, 0.78] },
    ambient: (n, p) => {
      const up = n[2] * 0.5 + 0.5;
      if (p[0] > 2000) {
        // The cliffs' shaded feet face west, toward the afterglow behind the viewer:
        // a soft rose-violet fill from low in the west, so their ribs still read,
        // fading toward the water where the Earth's shadow is deepest.
        const west = Math.max(0, -n[0] * 0.9 + n[2] * 0.2);
        const k = 0.55 + 0.45 * Math.min(1, p[2] / 200);
        return [(0.09 * up + 0.03 + west * 0.2) * k, (0.07 * up + 0.03 + west * 0.12) * k, (0.14 * up + 0.06 + west * 0.2) * k];
      }
      return [0.16 * up + 0.06, 0.17 * up + 0.06, 0.27 * up + 0.08];
    },
    // Aerial perspective: the far Rim takes on the colour of the air (the Earth's shadow band).
    fog: (c, p, t) => {
      const k = (1 - Math.exp(-t / 9000)) * 0.9;
      const air = [0.1, 0.13, 0.24];
      return c.map((v, i) => v * (1 - k) + air[i] * k);
    },
    // Alpenglow: only the upper cliffs still catch the sun; the town's lowest streets are in shadow.
    sunAt: (p) => (p[0] > 2000 || Math.hypot(p[0], p[1]) > 2000 ? sstep(150, 330, p[2]) : sstep(2, 20, p[2]) * 0.85 + 0.15),
  };
}

export const WATER = {
  z: 0,
  color: hex('#141e3a'),
  fresnel: [0.28, 0.72],
  // Long, low swells: streaks across the view that break up the reflections.
  ripple: (x, y, t) => {
    const a = vnoise(x * 0.09, y * 0.006, 0) - 0.5, b = vnoise(x * 0.31 + 7, y * 0.02, 3) - 0.5;
    return [a * 0.09 + b * 0.04, (vnoise(x * 0.05, y * 0.05, 9) - 0.5) * 0.02];
  },
  layer: 'far',
};
