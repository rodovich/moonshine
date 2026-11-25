// Shared UI drawing: boxes and their color styles.

import { colorOf } from './art.js';

export const STYLES = {
  // NPC dialog and system text.
  npc: { fill: 'ui_box', deep: 'ui_box_deep', frame: 'ui_frame', shade: 'ui_frame_shade', text: 'ui_text', italic: false, dashed: false },
  // Cheryl's descriptions: warm box and text.
  cheryl: { fill: 'ui_cheryl_box', deep: 'ui_cheryl_deep', frame: 'ui_cheryl_frame', shade: 'ui_frame_shade', text: 'ui_cheryl_text', italic: false, dashed: false },
  // Cheryl's internal monologue: warm, italic, dashed frame.
  thought: { fill: 'ui_cheryl_deep', deep: 'ui_ink', frame: 'ui_cheryl_frame', shade: 'ui_frame_shade', text: 'ui_cheryl_text', italic: true, dashed: true },
};

// An SNES-style box: a 3 px frame (outer shade line, light frame line, then a
// deep line inside it) with notched corners, around a fill that darkens
// toward the top. The thought style dashes the light line, 2 px on, 2 off.
export function drawBox(ctx, x, y, w, h, style = STYLES.npc) {
  const fill = colorOf(style.fill);
  const deep = colorOf(style.deep);
  const frame = colorOf(style.frame);
  const shade = colorOf(style.shade);
  // Outer ring (shade), corners notched.
  ctx.fillStyle = shade;
  ctx.fillRect(x + 1, y, w - 2, 1);
  ctx.fillRect(x + 1, y + h - 1, w - 2, 1);
  ctx.fillRect(x, y + 1, 1, h - 2);
  ctx.fillRect(x + w - 1, y + 1, 1, h - 2);
  // Light frame ring.
  ctx.fillStyle = style.dashed ? deep : frame;
  ctx.fillRect(x + 1, y + 1, w - 2, h - 2);
  if (style.dashed) {
    ctx.fillStyle = frame;
    for (let i = 0; i < w - 2; i += 4) {
      const n = Math.min(2, w - 2 - i);
      ctx.fillRect(x + 1 + i, y + 1, n, 1);
      ctx.fillRect(x + 1 + i, y + h - 2, n, 1);
    }
    for (let j = 0; j < h - 2; j += 4) {
      const n = Math.min(2, h - 2 - j);
      ctx.fillRect(x + 1, y + 1 + j, 1, n);
      ctx.fillRect(x + w - 2, y + 1 + j, 1, n);
    }
  }
  // Deep inner line, then the fill, darkening in 2 px bands toward the top.
  ctx.fillStyle = deep;
  ctx.fillRect(x + 2, y + 2, w - 4, h - 4);
  ctx.fillStyle = fill;
  ctx.fillRect(x + 3, y + 3, w - 6, h - 6);
  const bands = Math.min(4, Math.floor((h - 6) / 4));
  ctx.fillStyle = deep;
  for (let i = 0; i < bands; i++) {
    ctx.globalAlpha = 1 - (i + 1) / (bands + 1);
    ctx.fillRect(x + 3, y + 3 + i * 2, w - 6, 2);
  }
  ctx.globalAlpha = 1;
}

export function inRect(p, r) {
  return p.x >= r.x && p.y >= r.y && p.x < r.x + r.w && p.y < r.y + r.h;
}
