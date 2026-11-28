// The isometric view's UI at 640×480, in a late-90s PC idiom: bevelled
// brass-framed panels (lit from the upper left like everything else), blue
// moon-eye studs at the corners, a leather satchel for the inventory, item
// icons rendered from 3D models, and a bitmap font grown from the SNES face.
//
// Panels are 9-slice frames: meta.slices[name] = [left, top, right, bottom].
// Fonts: meta.fonts via `fonts()`; each glyph is a frame `font_<style>_<code>`.

import { frame, POST } from '../lib/jobs.mjs';
import { hex } from '../lib/render.mjs';
import { fbm, vnoise, hash3 } from '../lib/noise.mjs';
import { font as snesFont } from '../../game/src/art/font.js';
import * as I from '../models/items.mjs';

// ---------------------------------------------------------------------------
// A tiny 2D painter (sRGB bytes), with 16-bit quantization and ordered dither.

const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];
const rgb = (h) => { const n = parseInt(h.slice(1), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; };
const mixc = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];

function canvas(w, h) {
  const data = new Uint8Array(w * h * 4);
  const c = {
    w, h, data, ax: 0, ay: 0,
    set(x, y, col, a = 1) {
      x |= 0; y |= 0;
      if (x < 0 || y < 0 || x >= w || y >= h) return;
      const i = (y * w + x) * 4;
      const ba = data[i + 3] / 255;
      const oa = a + ba * (1 - a);
      for (let k = 0; k < 3; k++) data[i + k] = oa ? (col[k] * a + data[i + k] * ba * (1 - a)) / oa : 0;
      data[i + 3] = Math.round(oa * 255);
    },
    fill(x0, y0, x1, y1, f) { for (let y = y0; y < y1; y++) for (let x = x0; x < x1; x++) { const r = f(x, y); if (r) c.set(x, y, r, r[3] ?? 1); } },
    quantize() {
      for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
        const i = (y * w + x) * 4;
        const d = (BAYER[(y & 3) * 4 + (x & 3)] + 0.5) / 16 - 0.5;
        data[i] = Math.round(Math.max(0, Math.min(31, Math.round(data[i] / 255 * 31 + d))) * 255 / 31);
        data[i + 1] = Math.round(Math.max(0, Math.min(63, Math.round(data[i + 1] / 255 * 63 + d))) * 255 / 63);
        data[i + 2] = Math.round(Math.max(0, Math.min(31, Math.round(data[i + 2] / 255 * 31 + d))) * 255 / 31);
      }
      return c;
    },
  };
  return c;
}
const job = (name, paintFn) => ({ name, render() { const c = paintFn(); return [{ name, img: c }]; } });

// ---------------------------------------------------------------------------
// Palette (from the SNES UI colors, docs/art-direction.md)

const P = {
  ink: rgb('#201828'),
  navy: rgb('#1c2450'), navyDeep: rgb('#121838'), navyLight: rgb('#2c3870'),
  warm: rgb('#3a2818'), warmDeep: rgb('#241810'), warmLight: rgb('#4c3420'),
  brassHi: rgb('#f8e0a0'), brass: rgb('#d0a858'), brassMid: rgb('#a87c38'), brassLo: rgb('#684820'),
  eye: rgb('#4890e0'), eyeHi: rgb('#c8e8ff'), eyeLo: rgb('#183868'),
  leather: rgb('#7a4a2a'), leatherLo: rgb('#4a2c18'), leatherHi: rgb('#a06a40'), stitch: rgb('#e0c898'),
  text: rgb('#f8f0e0'), narr: rgb('#f8e0a8'), thought: rgb('#f0d8b0'), label: rgb('#f8c860'), dim: rgb('#9890a8'), shadow: rgb('#0c0a18'),
};

/** A moon-eye stud: a round blue glass bead in a brass collar, lit from the upper left. */
function stud(c, cx, cy, r = 4) {
  for (let y = -r - 2; y <= r + 2; y++) for (let x = -r - 2; x <= r + 2; x++) {
    const d = Math.hypot(x + 0.5, y + 0.5);
    if (d > r + 1.6) continue;
    if (d > r) { c.set(cx + x, cy + y, (x + y) < 0 ? P.brassHi : P.brassLo); continue; }
    const lx = (x + 0.5 + r * 0.35) / r, ly = (y + 0.5 + r * 0.35) / r;
    const hl = Math.max(0, 1 - Math.hypot(lx, ly) * 1.6);
    let col = mixc(P.eye, P.eyeLo, Math.min(1, Math.max(0, (x + y + r) / (2.5 * r))));
    col = mixc(col, P.eyeHi, hl);
    c.set(cx + x, cy + y, col);
  }
}

/**
 * A bevelled panel w×h: an ink outline, a 4-px brass frame (bright top-left,
 * dark bottom-right), an inset line, and an interior with a soft vertical
 * gradient and faint grain. Studs at the corners. `style`: 'navy' | 'warm'.
 */
function panel(w, h, { style = 'navy', studs = true, frameW = 4, dashed = false } = {}) {
  const c = canvas(w, h);
  const [top, bot] = style === 'navy' ? [P.navyLight, P.navyDeep] : [P.warmLight, P.warmDeep];
  const F = frameW;
  c.fill(0, 0, w, h, (x, y) => {
    const edge = Math.min(x, y, w - 1 - x, h - 1 - y);
    if (edge === 0) return P.ink;
    if (edge <= F) {
      if (dashed && edge > 1 && edge < F && ((x + y) >> 2) % 2) return style === 'navy' ? P.navyDeep : P.warmDeep;
      // Bevel: which side are we on? Top/left faces light, bottom/right dark; the
      // ridge of the frame is brightest in the middle.
      const tl = (x <= y ? x : y) === edge && (x < w - 1 - x || y < h - 1 - y) && (edge === x ? x <= w - 1 - x : y <= h - 1 - y);
      const t = (edge - 1) / (F - 1);
      const ridge = 1 - Math.abs(t - 0.4) * 1.6;
      let col = tl ? mixc(P.brass, P.brassHi, ridge) : mixc(P.brassLo, P.brassMid, ridge);
      const n = vnoise(x * 0.7, y * 0.7, 3);
      col = col.map((v) => v * (0.94 + n * 0.1));
      return col;
    }
    if (edge === F + 1) return P.ink;
    if (edge === F + 2) return mixc(top, P.ink, 0.5); // inner shadow line
    const t = y / h;
    let col = mixc(top, bot, t);
    const g = fbm(x * 0.15, y * 0.15, 1, 3);
    col = col.map((v) => v * (0.95 + g * 0.1));
    return col;
  });
  if (studs) for (const [x, y] of [[F / 2 + 1, F / 2 + 1], [w - F / 2 - 2, F / 2 + 1], [F / 2 + 1, h - F / 2 - 2], [w - F / 2 - 2, h - F / 2 - 2]]) stud(c, Math.round(x), Math.round(y), 4);
  return c.quantize();
}

/** The satchel's inside, for the inventory: brown leather, stitched round, with a brass frame. */
function leatherPanel(w, h) {
  const c = canvas(w, h);
  c.fill(0, 0, w, h, (x, y) => {
    const edge = Math.min(x, y, w - 1 - x, h - 1 - y);
    if (edge === 0) return P.ink;
    if (edge <= 4) {
      const tl = x + y < (w - 1 - x) + (h - 1 - y) ? (x < y ? x : y) === edge : false;
      return tl ? mixc(P.brass, P.brassHi, 0.4) : mixc(P.brassLo, P.brassMid, 0.5);
    }
    if (edge === 5) return P.ink;
    const n = fbm(x * 0.09, y * 0.09, 7, 4), fine = vnoise(x * 0.9, y * 0.9, 2);
    let col = mixc(P.leatherLo, P.leatherHi, 0.35 + n * 0.5 + (fine - 0.5) * 0.12);
    if (edge === 6) col = mixc(col, P.ink, 0.5);
    // Stitching: a dashed line 5 px in from the frame.
    if (edge === 10 && ((x + y) % 6) < 3) return mixc(P.stitch, col, 0.25);
    if (edge === 11 && ((x + y) % 6) < 3) return mixc(P.leatherLo, P.ink, 0.4);
    return col;
  });
  for (const [x, y] of [[3, 3], [w - 4, 3], [3, h - 4], [w - 4, h - 4]]) stud(c, x, y, 3);
  return c.quantize();
}

/** An inset slot well for an item, 48×48 (selected: a warm glow and brass ring). */
function slot(selected) {
  const s = 48, c = canvas(s, s);
  c.fill(0, 0, s, s, (x, y) => {
    const edge = Math.min(x, y, s - 1 - x, s - 1 - y);
    if (edge === 0) return x + y < s ? P.leatherLo.map((v) => v * 0.6) : P.leatherHi;
    if (edge === 1) return x + y < s ? P.ink : mixc(P.leatherHi, P.leather, 0.5);
    const d = Math.hypot(x - s / 2, y - s / 2) / (s / 2);
    let col = mixc(rgb('#3a2414'), rgb('#24160c'), d * 0.7);
    if (selected) {
      col = mixc(col, rgb('#a07038'), Math.max(0, 0.55 - d * 0.5));
      if (edge === 2 || edge === 3) return edge === 2 ? P.brassHi : P.brass;
    }
    return col;
  });
  c.ax = 24; c.ay = 24;
  return c.quantize();
}

/** The choice marker: a small gold crescent. */
function crescent() {
  const c = canvas(14, 14);
  c.fill(0, 0, 14, 14, (x, y) => {
    const a = Math.hypot(x + 0.5 - 7, y + 0.5 - 7), b = Math.hypot(x + 0.5 - 9.5, y + 0.5 - 5.5);
    if (a <= 6 && b > 5) { const t = (x + y) / 26; return mixc(P.brassHi, P.brass, t); }
    if (a <= 7 && b > 4.2 && a > 6) return P.ink;
    return null;
  });
  c.ax = 7; c.ay = 7;
  return c.quantize();
}

/** The mouse pointer: a classic arrow, cream with an ink outline and a soft drop shadow. */
function arrow() {
  const shape = [
    'X..........',
    'XX.........',
    'XoX........',
    'XooX.......',
    'XoooX......',
    'XooooX.....',
    'XoooooX....',
    'XooooooX...',
    'XoooooooX..',
    'XooooooooX.',
    'XoooooXXXXX',
    'XooXooX....',
    'XoX.XooX...',
    'XX..XooX...',
    'X....XooX..',
    '.....XooX..',
    '......XX...',
  ];
  const c = canvas(13, 19);
  shape.forEach((row, y) => [...row].forEach((ch, x) => { if (ch !== '.') c.set(x + 2, y + 2, P.shadow, 0.45); }));
  shape.forEach((row, y) => [...row].forEach((ch, x) => {
    if (ch === 'X') c.set(x, y, P.ink);
    if (ch === 'o') c.set(x, y, mixc(rgb('#fff8e8'), rgb('#d8c8a8'), (x + y) / 24));
  }));
  return c.quantize();
}

// ---------------------------------------------------------------------------
// The font: the SNES face scaled 4× with Scale2x twice (which rounds the
// diagonals), averaged back down to 2× for soft edges, with a drop shadow.

/** Square corners: a lit pixel where a vertical stem meets a horizontal bar (an L). Scale2x would round them, and D would read as O. */
function cornerMask(g, w, h) {
  const at = (x, y) => (x < 0 || y < 0 || x >= w || y >= h ? 0 : g[y][x]);
  return g.map((row, y) => row.map((p, x) => {
    if (!p) return 0;
    const stem = (at(x, y + 1) && at(x, y + 2)) || (at(x, y - 1) && at(x, y - 2));
    const bar = (at(x + 1, y) && at(x + 2, y)) || (at(x - 1, y) && at(x - 2, y));
    return stem && bar ? 1 : 0;
  }));
}
const up2 = (m) => m.flatMap((row) => { const r = row.flatMap((v) => [v, v]); return [r, r.slice()]; });

function scale2x(g, w, h, keep) {
  const out = Array.from({ length: h * 2 }, () => new Array(w * 2).fill(0));
  const at = (x, y) => (x < 0 || y < 0 || x >= w || y >= h ? 0 : g[y][x]);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const P0 = at(x, y), A = at(x, y - 1), B = at(x + 1, y), C = at(x - 1, y), D = at(x, y + 1);
    if (keep && keep[y][x]) { out[y * 2][x * 2] = out[y * 2][x * 2 + 1] = out[y * 2 + 1][x * 2] = out[y * 2 + 1][x * 2 + 1] = P0; continue; }
    out[y * 2][x * 2] = C === A && C !== D && A !== B ? A : P0;
    out[y * 2][x * 2 + 1] = A === B && A !== C && B !== D ? B : P0;
    out[y * 2 + 1][x * 2] = D === C && D !== B && C !== A ? C : P0;
    out[y * 2 + 1][x * 2 + 1] = B === D && B !== A && D !== C ? D : P0;
  }
  return out;
}

const FONT_STYLES = {
  text: { color: P.text },
  narr: { color: P.narr },
  thought: { color: P.thought, italic: true },
  label: { color: P.label },
  dim: { color: P.dim },
};

function glyph(ch, style) {
  const rows = snesFont.frames[ch];
  const g0 = rows.map((r) => [...r].map((c) => (c === '.' ? 0 : 1)));
  let w = 8, h = 9;
  const keep = cornerMask(g0, w, h);
  let g = scale2x(g0, w, h, keep); g = scale2x(g, w * 2, h * 2, up2(keep));
  // Average 2×2 blocks: 4× → 2×, coverage 0–1.
  const W2 = w * 2, H2 = h * 2;
  const cov = Array.from({ length: H2 }, (_, y) => Array.from({ length: W2 }, (_, x) => (g[y * 2][x * 2] + g[y * 2][x * 2 + 1] + g[y * 2 + 1][x * 2] + g[y * 2 + 1][x * 2 + 1]) / 4));
  const { color, italic } = FONT_STYLES[style];
  const pad = italic ? 4 : 0;
  const c = canvas(W2 + 2 + pad, H2 + 1);
  const shear = (y) => (italic ? Math.round((13 - y) / 4) : 0);
  // Shadow first (offset 1, 1), then the glyph; coverage stepped to quarters.
  for (let pass = 0; pass < 2; pass++) for (let y = 0; y < H2; y++) for (let x = 0; x < W2; x++) {
    const a = Math.round(cov[y][x] * 4) / 4;
    if (!a) continue;
    const sx = x + shear(y) + 1 + (pass === 0 ? 1 : 0), sy = y + (pass === 0 ? 1 : 0);
    if (pass === 0) c.set(sx, sy, P.shadow, a * 0.85);
    else c.set(sx, sy, color, a);
  }
  // Advance: the SNES rule (rightmost lit column + 1 px), doubled.
  let right = -1;
  for (const r of rows) for (let x = 0; x < 8; x++) if (r[x] !== '.') right = Math.max(right, x);
  c.advance = (right + 2) * 2;
  return c;
}

const FONT_CHARS = Object.keys(snesFont.frames);
const code = (ch) => ch.codePointAt(0).toString(16);

// ---------------------------------------------------------------------------

export default {
  name: 'ui',
  frames: () => {
    const out = [
      job('panel_dialog', () => panel(96, 96, { style: 'navy' })),
      job('panel_narration', () => panel(96, 96, { style: 'warm' })),
      job('panel_thought', () => panel(96, 96, { style: 'warm', studs: false, dashed: true })),
      job('panel_label', () => panel(40, 28, { style: 'navy', studs: false, frameW: 3 })),
      job('panel_menu', () => panel(96, 96, { style: 'navy' })),
      job('panel_inventory', () => leatherPanel(128, 128)),
      job('slot', () => slot(false)),
      job('slot_selected', () => slot(true)),
      job('choice_marker', crescent),
      job('cursor_arrow', arrow),
      // The bag button: Cheryl's satchel, rendered from its model.
      frame('bag', () => I.satchel(), { post: POST.prop, render: { lightScale: 1.05 } }),
      frame('bag_hover', () => I.satchel(), { post: POST.prop, render: { lightScale: 1.3 } }),
      frame('bag_open', () => I.satchel({ open: true }), { post: POST.prop }),
    ];
    // Item icons, rendered in three-quarter view and fitted to 40×40.
    for (const [name, build] of Object.entries(I.ICONS)) out.push(I.iconJob(`item_${name}`, build));
    // Font glyphs, one frame each.
    for (const style of Object.keys(FONT_STYLES)) {
      out.push({
        name: `font_${style}`,
        render() {
          return FONT_CHARS.map((ch) => { const g = glyph(ch, style); return { name: `font_${style}_${code(ch)}`, img: g.quantize(), advance: g.advance }; });
        },
      });
    }
    return out;
  },
  meta: {
    ui: true,
    slices: {
      panel_dialog: [12, 12, 12, 12], panel_narration: [12, 12, 12, 12], panel_thought: [12, 12, 12, 12],
      panel_label: [6, 6, 6, 6], panel_menu: [12, 12, 12, 12], panel_inventory: [16, 16, 16, 16],
    },
    // Where the cursor's hot spot is, from its top-left.
    hotspots: { cursor_arrow: [0, 0] },
  },
  fonts(frames) {
    const fonts = {};
    for (const style of Object.keys(FONT_STYLES)) {
      const glyphs = {};
      for (const ch of FONT_CHARS) {
        const f = frames[`font_${style}_${code(ch)}`];
        if (f) glyphs[ch] = [f[0], f[1], f[2], f[3], ADV.get(`${style}:${ch}`) ?? 12];
      }
      glyphs[' '] = [0, 0, 0, 0, 6];
      fonts[style] = { image: 'ui.png', lineHeight: 22, baseline: 14, capHeight: 14, italic: !!FONT_STYLES[style].italic, glyphs };
    }
    return fonts;
  },
};

// Advances, computed here too so the main thread knows them (glyph() is cheap).
const ADV = new Map();
for (const style of Object.keys(FONT_STYLES)) for (const ch of FONT_CHARS) {
  const rows = snesFont.frames[ch];
  let right = -1;
  for (const r of rows) for (let x = 0; x < 8; x++) if (r[x] !== '.') right = Math.max(right, x);
  ADV.set(`${style}:${ch}`, (right + 2) * 2);
}
void hash3; void hex;
