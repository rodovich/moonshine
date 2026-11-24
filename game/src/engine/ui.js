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

// A box with a vertical two-tone gradient, a 1 px frame with clipped corners,
// and an inner shade line.
export function drawBox(ctx, x, y, w, h, style = STYLES.npc) {
  const fill = colorOf(style.fill);
  const deep = colorOf(style.deep);
  // Gradient in bands of 4 px between deep (top) and fill (bottom).
  ctx.fillStyle = fill;
  ctx.fillRect(x + 1, y + 1, w - 2, h - 2);
  const bands = Math.min(4, Math.floor(h / 4));
  ctx.fillStyle = deep;
  for (let i = 0; i < bands; i++) {
    ctx.globalAlpha = 1 - i / bands;
    ctx.fillRect(x + 1, y + 1 + i * 2, w - 2, 2);
  }
  ctx.globalAlpha = 1;
  const frame = colorOf(style.frame);
  const shade = colorOf(style.shade);
  ctx.fillStyle = frame;
  if (style.dashed) {
    for (let i = 2; i < w - 2; i += 2) {
      ctx.fillRect(x + i, y, 1, 1);
      ctx.fillRect(x + i, y + h - 1, 1, 1);
    }
    for (let j = 2; j < h - 2; j += 2) {
      ctx.fillRect(x, y + j, 1, 1);
      ctx.fillRect(x + w - 1, y + j, 1, 1);
    }
  } else {
    ctx.fillRect(x + 2, y, w - 4, 1);
    ctx.fillRect(x + 2, y + h - 1, w - 4, 1);
    ctx.fillRect(x, y + 2, 1, h - 4);
    ctx.fillRect(x + w - 1, y + 2, 1, h - 4);
    ctx.fillRect(x + 1, y + 1, 1, 1);
    ctx.fillRect(x + w - 2, y + 1, 1, 1);
    ctx.fillRect(x + 1, y + h - 2, 1, 1);
    ctx.fillRect(x + w - 2, y + h - 2, 1, 1);
    ctx.fillStyle = shade;
    ctx.fillRect(x + 2, y + h - 2, w - 4, 1);
    ctx.fillRect(x + w - 2, y + 2, 1, h - 4);
  }
}

export function inRect(p, r) {
  return p.x >= r.x && p.y >= r.y && p.x < r.x + r.w && p.y < r.y + r.h;
}
