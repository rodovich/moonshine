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
const LAYERS = ['sky', 'far', 'town', 'fg'];

function bandJob(i) {
  const y0 = Math.floor((V.H * i) / BANDS), y1 = Math.floor((V.H * (i + 1)) / BANDS);
  return {
    name: `band_${i}`,
    render() {
      const r = renderPersp(V.scene(), { w: V.W, h: V.H, ss: 3, cam: V.CAM, sky: V.sky, ...V.lighting(), water: V.WATER, layers: LAYERS, defaultLayer: 'fg', rows: [y0, y1] });
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
    out.push(paint('moon_halo', 340, 340, (x, y) => {
      // The moon brightens the sky round it: a broad, soft silver glow.
      const r = Math.hypot(x - 170, y - 170) / 170;
      if (r > 1) return null;
      const a = Math.pow(1 - r, 2.6) * 0.5;
      return [...sil, a];
    }));
    // The pre-rise brightening behind the Rim: a wide, low dome of silver light.
    out.push(paint('glow', 260, 110, (x, y) => {
      const dx = (x - 130) / 130, dy = (y - 110) / 110;
      const r = Math.hypot(dx, dy * 1.1);
      if (r > 1) return null;
      return [...hex('#d8e0f0'), Math.pow(1 - r, 1.8) * 0.75];
    }, { ax: 130, ay: 110 }));
    // The moon's path on the water: thin horizontal glints in a continuous column,
    // tight and bright just under the Rim, wider and more broken toward the viewer.
    // The town layer is drawn over it, so it shows only on the water.
    const gold = hex('#ffd8a0');
    out.push(paint('path', 120, 70, (x, y) => {
      const t = y / 70; // 0 at the far edge, 1 near
      const half = 7 + t * 44;
      const dx = Math.abs(x - 60) / half;
      if (dx > 1) return null;
      const pitch = 1.4 + t * 2.4; // rows of glints spread out toward the viewer
      const row = Math.floor(y / pitch), fy = (y / pitch) % 1;
      if (fy > 0.45 + 0.25 * (1 - t)) return null; // one-pixel lines with dark water between
      const seg = vnoise(x * (0.6 - t * 0.35), row * 5.3, 7);
      if (seg < 0.25 + dx * 0.55 + t * 0.15) return null;
      return [...gold, Math.min(1, (1.0 - t * 0.45) * (1 - dx * dx * 0.7))];
    }, { ax: 60, ay: 0 }));
    // Basin glints: a soft two-pixel glint of sky in a rooftop basin, three phases.
    for (let k = 0; k < 3; k++) {
      out.push(paint(`twinkle_${k}`, 5, 5, (x, y) => {
        const r = Math.hypot(x - 2.5, y - 2.5);
        const a = [1, 0.75, 0.45][k] * Math.max(0, 1 - r / 2.3);
        return a > 0.05 ? [...hex('#e0ecff'), a] : null;
      }, { ax: 2, ay: 2 }));
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
    // Lamps and lit windows: a soft warm halo round each, baked into the town layer
    // (over the water too, where the layer is otherwise clear).
    {
      const T = full.town, W0 = V.W, H0 = V.H, src = new Uint8Array(T.data);
      const hot = [];
      for (let i = 0; i < W0 * H0; i++) { const r = src[i * 4], g = src[i * 4 + 1], b = src[i * 4 + 2]; if (src[i * 4 + 3] && r > 235 && g > 165 && b < 150) hot.push(i); }
      const add = new Float32Array(W0 * H0);
      for (const i of hot) {
        const x0 = i % W0, y0 = Math.floor(i / W0);
        for (let dy = -5; dy <= 5; dy++) for (let dx = -5; dx <= 5; dx++) {
          const x = x0 + dx, y = y0 + dy; if (x < 0 || y < 0 || x >= W0 || y >= H0) continue;
          const r = Math.hypot(dx, dy); if (r > 5) continue;
          add[y * W0 + x] += Math.pow(1 - r / 5, 2) * 0.22;
        }
      }
      const BY = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];
      for (let i = 0; i < W0 * H0; i++) {
        const a = Math.min(0.85, add[i]); if (a < 0.03) continue;
        const x = i % W0, y = Math.floor(i / W0), dth = (BY[(y & 3) * 4 + (x & 3)] + 0.5) / 16 - 0.5;
        if (a + dth * 0.12 < 0.06) continue;
        const k = i * 4, glow = [255, 196, 110];
        if (T.data[k + 3]) { for (let c = 0; c < 3; c++) T.data[k + c] = Math.min(255, Math.round(T.data[k + c] + glow[c] * a * 0.7)); }
        else { T.data[k] = glow[0]; T.data[k + 1] = glow[1]; T.data[k + 2] = glow[2]; T.data[k + 3] = Math.round(Math.min(1, a) * 200); }
      }
    }
    TWINKLES.length = 0;
    TWINKLES.push(...findBasins(full.town, full.fg));
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
    order: ['sky', 'glow', 'moon_halo', 'moon', 'far', 'path', 'town', 'fg', 'twinkle'],
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
