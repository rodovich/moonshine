// Art loader: turns palette-indexed text-grid sheets (see docs/decisions.md,
// "Art module format") into canvases.
//
//   const art = loadSheet(sheet);              // default palette
//   const alt = loadSheet(sheet, 'night');     // a named swap from sheet.palettes
//   const red = loadSheet(sheet, { a: 'ph_red' }); // ad-hoc overrides on top of the default
//   art.frame('wall_plain')   -> canvas (cached)
//   art.anim('water')         -> [canvas, canvas, ...] for water_0, water_1, ...
//   art.has('water_0')        -> boolean

import { COLORS } from '../art/palette.js';

const cache = new WeakMap(); // sheet -> Map(paletteKey -> SheetArt)
const warned = new Set();

function warnOnce(msg) {
  if (warned.has(msg)) return;
  warned.add(msg);
  console.warn(`[art] ${msg}`);
}

function resolveColor(name) {
  if (name.startsWith('#')) return name;
  const c = COLORS[name];
  if (!c) {
    warnOnce(`unknown color "${name}"`);
    return '#ff00ff';
  }
  return c;
}

function hexToRgb(hex) {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

export class SheetArt {
  constructor(sheet, palette, label) {
    this.sheet = sheet;
    this.w = sheet.size[0];
    this.h = sheet.size[1];
    this.label = label;
    this.rgb = {};
    for (const [ch, name] of Object.entries(palette)) this.rgb[ch] = hexToRgb(resolveColor(name));
    this.canvases = new Map();
    this.anims = new Map();
  }

  has(name) {
    return Object.prototype.hasOwnProperty.call(this.sheet.frames, name);
  }

  frame(name) {
    let c = this.canvases.get(name);
    if (c) return c;
    const rows = this.sheet.frames[name];
    if (!rows) {
      warnOnce(`${this.label}: missing frame "${name}"`);
      return null;
    }
    c = this.render(rows, name);
    this.canvases.set(name, c);
    return c;
  }

  // All numbered frames base_0, base_1, ... in order. A plain frame named `base`
  // counts as a one-frame animation.
  anim(base) {
    let list = this.anims.get(base);
    if (list) return list;
    list = [];
    for (let i = 0; this.has(`${base}_${i}`); i++) list.push(this.frame(`${base}_${i}`));
    if (!list.length && this.has(base)) list.push(this.frame(base));
    if (!list.length) warnOnce(`${this.label}: no frames for "${base}"`);
    this.anims.set(base, list);
    return list;
  }

  render(rows, name) {
    const { w, h } = this;
    if (rows.length !== h) warnOnce(`${this.label}.${name}: ${rows.length} rows, expected ${h}`);
    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d');
    const img = ctx.createImageData(w, h);
    const d = img.data;
    for (let y = 0; y < h && y < rows.length; y++) {
      const row = rows[y];
      if (row.length !== w) warnOnce(`${this.label}.${name}: row ${y} has ${row.length} pixels, expected ${w}`);
      for (let x = 0; x < w && x < row.length; x++) {
        const ch = row[x];
        if (ch === '.' || ch === ' ') continue;
        let rgb = this.rgb[ch];
        if (!rgb) {
          warnOnce(`${this.label}.${name}: palette has no entry "${ch}"`);
          rgb = [255, 0, 255];
        }
        const i = (y * w + x) * 4;
        d[i] = rgb[0];
        d[i + 1] = rgb[1];
        d[i + 2] = rgb[2];
        d[i + 3] = 255;
      }
    }
    ctx.putImageData(img, 0, 0);
    return canvas;
  }
}

// `variant` is undefined (default palette), a name from sheet.palettes, or an
// object of overrides merged over the default palette.
export function loadSheet(sheet, variant) {
  if (!sheet || !sheet.frames || !sheet.size) throw new Error('loadSheet: not a sheet');
  let byPal = cache.get(sheet);
  if (!byPal) {
    byPal = new Map();
    cache.set(sheet, byPal);
  }
  const key = variant == null ? '' : typeof variant === 'string' ? variant : JSON.stringify(variant);
  let art = byPal.get(key);
  if (art) return art;
  let palette = sheet.palette;
  if (typeof variant === 'string') {
    const swap = sheet.palettes && sheet.palettes[variant];
    if (!swap) warnOnce(`sheet has no palette "${variant}"`);
    palette = { ...sheet.palette, ...(swap || {}) };
  } else if (variant) {
    palette = { ...sheet.palette, ...variant };
  }
  art = new SheetArt(sheet, palette, sheet.name || 'sheet');
  byPal.set(key, art);
  return art;
}

// A canvas of one solid color, handy for placeholders and effects.
export function colorOf(name) {
  return resolveColor(name);
}
