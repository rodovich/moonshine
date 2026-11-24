// Bitmap text: measuring, wrapping, and drawing with the font sheet in
// src/art/font.js. Colors are palette names (or #rrggbb).

import { font as fontSheet } from '../art/font.js';
import { loadSheet } from './art.js';

export const LINE_HEIGHT = 12;
export const GLYPH_HEIGHT = 9;
const SPACE = 3;
const SPACING = 1;

const widths = new Map();
function glyphWidth(ch) {
  if (ch === ' ') return SPACE;
  let w = widths.get(ch);
  if (w != null) return w;
  const rows = fontSheet.frames[ch];
  if (!rows) {
    w = glyphWidth('?');
  } else {
    w = 0;
    for (const r of rows) {
      const last = r.lastIndexOf('a');
      if (last + 1 > w) w = last + 1;
    }
  }
  widths.set(ch, w);
  return w;
}

// Normalize typographic characters the font lacks.
export function normalize(text) {
  return String(text).replace(/\.\.\./g, '…').replace(/--/g, '—');
}

export function measure(text) {
  let w = 0;
  for (const ch of text) w += glyphWidth(ch) + SPACING;
  return Math.max(0, w - SPACING);
}

// Word-wrap into lines no wider than maxWidth. Honors '\n'.
export function wrap(text, maxWidth) {
  const out = [];
  for (const para of normalize(text).split('\n')) {
    const words = para.split(' ');
    let line = '';
    for (const word of words) {
      const trial = line ? `${line} ${word}` : word;
      if (measure(trial) <= maxWidth || !line) {
        line = trial;
      } else {
        out.push(line);
        line = word;
      }
    }
    out.push(line);
  }
  return out;
}

// Draw text with its top-left at (x, y). Options: color, shadow (color name
// or null), italic (shear top rows right by 1 px), count (draw only the first
// `count` characters, for typewriter reveal).
export function drawText(ctx, text, x, y, opts = {}) {
  const color = opts.color || 'ui_text';
  const shadow = opts.shadow === undefined ? 'ui_text_shadow' : opts.shadow;
  const italic = !!opts.italic;
  const count = opts.count == null ? Infinity : opts.count;
  const art = fontIn(color);
  const shadowArt = shadow ? fontIn(shadow) : null;
  let cx = Math.round(x);
  y = Math.round(y);
  let n = 0;
  for (const ch of text) {
    if (n++ >= count) break;
    if (ch !== ' ') {
      const key = fontSheet.frames[ch] ? ch : '?';
      if (shadowArt) blit(ctx, shadowArt.frame(key), cx + 1, y + 1, italic);
      blit(ctx, art.frame(key), cx, y, italic);
    }
    cx += glyphWidth(ch) + SPACING;
  }
  return cx - x;
}

const byColor = new Map();
function fontIn(color) {
  let art = byColor.get(color);
  if (!art) {
    art = loadSheet(fontSheet, { a: color });
    byColor.set(color, art);
  }
  return art;
}

function blit(ctx, img, x, y, italic) {
  if (!italic) {
    ctx.drawImage(img, x, y);
    return;
  }
  // Rows 0-3 shift right one pixel; rows 4+ stay put.
  ctx.drawImage(img, 0, 0, img.width, 4, x + 1, y, img.width, 4);
  ctx.drawImage(img, 0, 4, img.width, img.height - 4, x, y + 4, img.width, img.height - 4);
}

export function drawTextCentered(ctx, text, cx, y, opts) {
  return drawText(ctx, text, Math.round(cx - measure(text) / 2), y, opts);
}
