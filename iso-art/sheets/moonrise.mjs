// The moonrise picture at 640×480 (docs/design/01-opening.md, step 5), in
// layers the scene moves independently:
//   sky   — the eastern dusk sky with stars (opaque, full frame)
//   glow  — the silver brightening behind the Rim before the moon rises (alpha)
//   moon_* — the moon as it clears the Rim (peach-gold), climbs (cream), and whitens; moon_halo (alpha)
//   far   — the Rim, the Gate, the Bowl, the town (transparent where the sky shows)
//   path  — the moon's path on the water (alpha), drawn under the moon's x
//   fg    — Cheryl on the tub's rim, the low wall, and the sighting pins (transparent above)
//   twinkle_0..2 — basin glints for the rooftops (positions in meta.twinkles)
// Draw order: sky, glow, moon_halo, moon, far, path, fg, twinkles.

import { renderPersp } from '../lib/persp.mjs';
import { toImage, blank } from '../lib/post.mjs';
import { hex } from '../lib/render.mjs';
import { fbm, vnoise, hash3 } from '../lib/noise.mjs';
import * as V from '../models/vista.mjs';

const BANDS = 16;
const LAYERS = ['sky', 'far', 'fg'];

function bandJob(i) {
  const y0 = Math.floor((V.H * i) / BANDS), y1 = Math.floor((V.H * (i + 1)) / BANDS);
  return {
    name: `band_${i}`,
    render() {
      const r = renderPersp(V.scene(), { w: V.W, h: V.H, ss: 2, cam: V.CAM, sky: V.sky, ...V.lighting(), water: V.WATER, layers: LAYERS, defaultLayer: 'fg', rows: [y0, y1] });
      return LAYERS.map((name) => {
        const L = r.layers[name];
        const px = L.px.slice(y0 * V.W, y1 * V.W);
        const img = toImage({ w: V.W, h: y1 - y0, ax: 0, ay: 0, px }, { alphaCut: 0.5, dither: 0.6 });
        return { name: `${name}#${i}`, img, band: y0 };
      });
    },
  };
}

const toLin = (c) => Math.pow(c / 255, 2.2);
const toByte = (v) => Math.max(0, Math.min(255, Math.round(Math.pow(Math.max(0, v), 1 / 2.2) * 255)));
const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];
const q5 = (v, x, y) => { const d = (BAYER[(y & 3) * 4 + (x & 3)] + 0.5) / 16 - 0.5; return Math.max(0, Math.min(255, Math.round(Math.round(v / 255 * 31 + d) * 255 / 31))); };

/** Paint a small image with a per-pixel function returning [r, g, b, a] (linear rgb, a 0–1). */
function paint(name, w, h, f, opts = {}) {
  return {
    name,
    render() {
      const data = new Uint8Array(w * h * 4);
      const ss = 3;
      for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
        let r = 0, g = 0, b = 0, a = 0;
        for (let sy = 0; sy < ss; sy++) for (let sx = 0; sx < ss; sx++) {
          const c = f(x + (sx + 0.5) / ss, y + (sy + 0.5) / ss);
          if (!c) continue;
          r += c[0] * c[3]; g += c[1] * c[3]; b += c[2] * c[3]; a += c[3];
        }
        a /= ss * ss;
        if (a <= 0.004) continue;
        const i = (y * w + x) * 4;
        const n = a * ss * ss;
        let A = a;
        if (opts.hard) A = a >= 0.5 ? 1 : 0;
        if (!A) continue;
        data[i] = q5(toByte(r / n), x, y); data[i + 1] = q5(toByte(g / n), x + 1, y); data[i + 2] = q5(toByte(b / n), x, y + 1);
        // Alpha in 16 steps, ordered-dithered so soft glows don't band.
        const da = (BAYER[(y & 3) * 4 + (x & 3)] + 0.5) / 16 - 0.5;
        data[i + 3] = Math.round(Math.max(0, Math.min(16, Math.round(A * 16 + da))) / 16 * 255);
        if (!data[i + 3]) data[i] = data[i + 1] = data[i + 2] = 0;
      }
      return [{ name, img: { w, h, ax: opts.ax ?? Math.floor(w / 2), ay: opts.ay ?? Math.floor(h / 2), data } }];
    },
  };
}

const MOON_R = 36;
function moon(name, base, shade, mare) {
  const B = hex(base), S = hex(shade), M = hex(mare);
  const s = MOON_R * 2 + 4;
  return paint(name, s, s, (x, y) => {
    const dx = (x - s / 2) / MOON_R, dy = (y - s / 2) / MOON_R;
    const r2 = dx * dx + dy * dy;
    if (r2 > 1) return null;
    const z = Math.sqrt(1 - r2);
    // Maria: soft darker patches, fixed to the face (the same pattern each frame).
    const m = fbm(dx * 2.2 + 3, dy * 2.2 + 1, 0.5, 4);
    const maria = Math.max(0, Math.min(1, (m - 0.5) * 3.2));
    let c = [B[0] + (M[0] - B[0]) * maria * 0.6, B[1] + (M[1] - B[1]) * maria * 0.6, B[2] + (M[2] - B[2]) * maria * 0.6];
    // Slight limb darkening toward the edge.
    const limb = 0.82 + 0.18 * Math.pow(z, 0.4);
    c = c.map((v, i) => (v * limb + S[i] * (1 - limb)) * 1.0);
    return [...c, 1];
  }, { hard: true });
}

export default {
  name: 'moonrise',
  frames: () => {
    const out = [];
    for (let i = 0; i < BANDS; i++) out.push(bandJob(i));
    // The moon as it clears the Rim, climbs, and whitens.
    out.push(moon('moon_peach', '#f8d4a8', '#e0a888', '#d8b098'));
    out.push(moon('moon_cream', '#f4e4bc', '#d8c098', '#c8b090'));
    out.push(moon('moon_white', '#f4f4ea', '#d0d0cc', '#c4c4c0'));
    // Cool silver halo round the moon.
    const sil = hex('#c8d4f0');
    out.push(paint('moon_halo', 220, 220, (x, y) => {
      const r = Math.hypot(x - 110, y - 110) / 110;
      if (r > 1) return null;
      const a = Math.pow(1 - r, 2.2) * 0.55;
      return [...sil, a];
    }));
    // The pre-rise brightening behind the Rim: a wide, low dome of silver light.
    out.push(paint('glow', 260, 110, (x, y) => {
      const dx = (x - 130) / 130, dy = (y - 110) / 110;
      const r = Math.hypot(dx, dy * 1.1);
      if (r > 1) return null;
      return [...hex('#d8e0f0'), Math.pow(1 - r, 1.8) * 0.75];
    }, { ax: 130, ay: 110 }));
    // The moon's path on the water: broken horizontal streaks of peach-gold, widening toward the viewer.
    const gold = hex('#ffd49a');
    out.push(paint('path', 90, 110, (x, y) => {
      const t = y / 110; // 0 at the far edge (just below the Rim), 1 near
      const half = 6 + t * 38;
      const dx = Math.abs(x - 45) / half;
      if (dx > 1) return null;
      const row = Math.floor(y / (1.5 + t * 2.5));
      const streak = vnoise(x * (0.25 - t * 0.12), row * 3.7, 2) > 0.45 + dx * 0.35;
      if (!streak) return null;
      return [...gold, (0.95 - t * 0.45) * (1 - dx * 0.5)];
    }, { ax: 45, ay: 0 }));
    // Basin glints: a tiny four-point sparkle in three phases.
    for (let k = 0; k < 3; k++) {
      out.push(paint(`twinkle_${k}`, 9, 9, (x, y) => {
        const dx = Math.abs(x - 4.5), dy = Math.abs(y - 4.5);
        const arm = k === 1 ? 4.5 : k === 0 ? 2.5 : 1.5;
        const on = (dx < 0.6 && dy < arm) || (dy < 0.6 && dx < arm) || (dx < 1.2 && dy < 1.2);
        if (!on) return null;
        const core = dx < 0.7 && dy < 0.7;
        return core ? [...hex('#ffffff'), 1] : [...hex('#d8e4f8'), 0.8];
      }, { hard: true, ax: 4, ay: 4 }));
    }
    return out;
  },
  // Stitch the bands into full-frame layers.
  assemble(outs) {
    const full = {};
    const rest = [];
    for (const o of outs) {
      const m = /^(\w+)#\d+$/.exec(o.name);
      if (!m) { rest.push(o); continue; }
      const name = m[1];
      full[name] ??= { w: V.W, h: V.H, ax: 0, ay: 0, data: new Uint8Array(V.W * V.H * 4) };
      full[name].data.set(o.img.data, o.band * V.W * 4);
    }
    TWINKLES.length = 0;
    TWINKLES.push(...findBasins(full.far, full.fg));
    // Where the Rim's top is at the moon's column, so it starts just hidden behind it.
    const top = (x) => { for (let y = 0; y < V.H; y++) if (full.far.data[(y * V.W + x) * 4 + 3]) return y; return V.H; };
    const mx = 438;
    RISE.glowAt = [mx, top(mx) + 2];
    RISE.moonRise = { from: [mx, top(mx) + MOON_R + 3], to: [mx + 70, top(mx) - 120] };
    RISE.gate = [320, top(320)];
    return [...LAYERS.map((n) => ({ name: n, img: full[n] })), ...rest];
  },
  meta: () => ({
    twinkles: TWINKLES,
    picture: true,
    size: [V.W, V.H],
    order: ['sky', 'glow', 'moon_halo', 'moon', 'far', 'path', 'fg', 'twinkle'],
    // Where things are, in picture pixels: the Gate's notch (bottom of the V), where the
    // glow and moon rise (right of the Gate, outside the pins), and the moon's climb.
    ...RISE,
    pathTop: 268,
  }),
};

const TWINKLES = [];
const RISE = {};
/** Screen positions of rooftop basins that show in the picture (flat roofs, unhidden). */
function findBasins(far, fg) {
  const { pos, pitch, f } = V.CAM;
  const out = [];
  for (let i = 5; i < 80; i++) for (let j = -40; j < 40; j++) {
    const hs = V.houseAt(i, j);
    if (!hs.ok || hs.roof !== 'flat') continue;
    const dx = hs.cx - pos[0], dy = hs.cy - pos[1], dz = hs.top - pos[2];
    // Camera space (yaw 0): forward x, right y, up z, pitched.
    const fx = dx * Math.cos(pitch) + dz * Math.sin(pitch), uz = -dx * Math.sin(pitch) + dz * Math.cos(pitch);
    if (fx <= 1) continue;
    const sx = Math.round(V.W / 2 + (dy / fx) * f), sy = Math.round(V.H / 2 - (uz / fx) * f);
    if (sx < 4 || sx >= V.W - 4 || sy < 4 || sy >= V.H - 4) continue;
    const k = (sy * V.W + sx) * 4;
    if (!far.data[k + 3] || fg.data[k + 3]) continue;
    if (hash3(i, j, 99) < 0.55) continue; // not every basin catches the light at once
    out.push([sx, sy]);
  }
  return out.slice(0, 40);
}
void blank; void hash3; void toLin;
