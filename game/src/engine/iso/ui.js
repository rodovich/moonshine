// The isometric view's UI at 640×480, in a 90s PC idiom: bevelled panels, a
// proper inventory window. The text box, bag, and title share their logic
// (paging, typewriter, choices, input) with the SNES view's and only lay
// out and draw differently.
//
// The look comes from a skin, which the isometric art task replaces with
// its panel art and fonts through setIsoSkin(). The stand-in skin draws
// bevelled panels in the SNES UI's colors and the SNES pixel font at 2×.
//
// A skin:
//   font: { lineHeight, measure(text), wrap(text, width) -> lines,
//           draw(ctx, text, x, y, { color, italic, count, shadow }) }
//         (color is a palette name like 'ui_text'; count draws only the
//         first `count` characters, for the typewriter)
//   bigFont: the same, for the title
//   panel(ctx, x, y, w, h, styleName)   'npc' | 'cheryl' | 'thought' | 'button' | 'button_on'
//   icon(name) -> image                  'cursor', 'arrow_0', 'arrow_1', 'bag'
//   slot(ctx, x, y, w, h, filled)        an inventory slot

import { TextBox } from '../textbox.js';
import { Inventory } from '../inventory.js';
import { Title } from '../title.js';
import { drawText, measure, wrap } from '../text.js';
import { colorOf, loadSheet } from '../art.js';
import { uiSmall, uiIcons } from '../../art/ui.js';
import { STYLES } from '../ui.js';
import { sfx } from '../sound.js';
import { ISO_W, ISO_H } from './project.js';

// ---- The skin -------------------------------------------------------------

function scaledFont(k, lineHeight) {
  return {
    lineHeight,
    measure: (t) => measure(t) * k,
    wrap: (t, width) => wrap(t, width / k),
    draw(ctx, text, x, y, opts = {}) {
      ctx.save();
      ctx.translate(Math.round(x), Math.round(y));
      ctx.scale(k, k);
      drawText(ctx, text, 0, 0, opts);
      ctx.restore();
    },
  };
}

const small = () => loadSheet(uiSmall);
const icons = () => loadSheet(uiIcons);

function bevel(ctx, x, y, w, h, face, light, dark, alpha = 1) {
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.fillStyle = '#080810';
  ctx.fillRect(x, y, w, h);
  ctx.fillStyle = light;
  ctx.fillRect(x + 1, y + 1, w - 2, 2);
  ctx.fillRect(x + 1, y + 1, 2, h - 2);
  ctx.fillStyle = dark;
  ctx.fillRect(x + 1, y + h - 3, w - 2, 2);
  ctx.fillRect(x + w - 3, y + 1, 2, h - 2);
  ctx.fillStyle = face;
  ctx.fillRect(x + 3, y + 3, w - 6, h - 6);
  // A soft sheen toward the top, and an inset line.
  const g = ctx.createLinearGradient(0, y + 3, 0, y + h - 3);
  g.addColorStop(0, 'rgba(255, 255, 255, 0.10)');
  g.addColorStop(0.5, 'rgba(255, 255, 255, 0)');
  g.addColorStop(1, 'rgba(0, 0, 0, 0.18)');
  ctx.fillStyle = g;
  ctx.fillRect(x + 3, y + 3, w - 6, h - 6);
  ctx.strokeStyle = 'rgba(0, 0, 0, 0.35)';
  ctx.lineWidth = 1;
  ctx.strokeRect(x + 5.5, y + 5.5, w - 11, h - 11);
  ctx.restore();
}

const standIn = {
  font: scaledFont(2, 24),
  bigFont: scaledFont(5, 60),
  panel(ctx, x, y, w, h, styleName = 'npc') {
    const s = STYLES[styleName] || STYLES.npc;
    if (styleName === 'button' || styleName === 'button_on') {
      bevel(ctx, x, y, w, h, colorOf('ui_box'), styleName === 'button_on' ? '#f8d870' : colorOf('ui_frame'), colorOf('ui_box_deep'));
      return;
    }
    bevel(ctx, x, y, w, h, colorOf(s.fill), colorOf(s.frame), colorOf(s.deep), styleName === 'thought' ? 0.92 : 1);
  },
  icon(name) {
    if (name === 'bag') return icons().frame('bag');
    return small().frame(name);
  },
  slot(ctx, x, y, w, h, filled) {
    ctx.fillStyle = filled ? 'rgba(8, 8, 20, 0.55)' : 'rgba(8, 8, 20, 0.22)';
    ctx.fillRect(x + 3, y + 3, w - 6, h - 6);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.08)';
    ctx.fillRect(x + 3, y + h - 4, w - 6, 1);
    ctx.fillRect(x + w - 4, y + 3, 1, h - 6);
  },
};

export const skin = { ...standIn };

// The art task's hook: replace any part of the skin.
export function setIsoSkin(parts) {
  Object.assign(skin, parts);
}

// Draw an icon at k× (SNES-size icons are 16 px; skin icons may be larger).
function drawIcon(ctx, name, x, y, size) {
  const img = skin.icon(name);
  if (!img) return;
  const k = size ? size / Math.max(img.width, img.height) : 2;
  ctx.drawImage(img, Math.round(x), Math.round(y), Math.round(img.width * k), Math.round(img.height * k));
}

// ---- Text box -------------------------------------------------------------

const OPEN_TICKS = 4;
const BOX_X = 24;
const BOX_W = ISO_W - 48;
const PAD_X = 22;
const PAD_Y = 16;
const LINES = 3;

export class IsoTextBox extends TextBox {
  get boxH() {
    return PAD_Y * 2 + LINES * skin.font.lineHeight - 4;
  }

  wrapText(text) {
    return skin.font.wrap(text, this.bw - PAD_X * 2);
  }

  applyLayout() {
    this.bx = BOX_X;
    this.bw = BOX_W;
  }

  draw(ctx, playerScreenY = 0) {
    const a = this.active;
    if (!a) return;
    const F = skin.font;
    const H = this.boxH;
    let pos = this.position;
    if (pos === 'auto') pos = playerScreenY > ISO_H * 0.62 ? 'top' : 'bottom';
    const y = pos === 'top' ? 20 : ISO_H - H - 20;
    const hasText = a.pages[a.page].length > 0;
    if (a.openT < OPEN_TICKS) {
      const h = Math.max(10, Math.round((H * (a.openT + 1)) / (OPEN_TICKS + 1)));
      skin.panel(ctx, this.bx, y + Math.round((H - h) / 2), this.bw, h, a.styleName);
      return;
    }
    if (hasText || !a.choice) {
      skin.panel(ctx, this.bx, y, this.bw, H, a.styleName);
      if (a.speaker) this.drawLabel(ctx, a.speaker, y, pos);
      let remaining = Math.floor(a.shown);
      a.pages[a.page].forEach((line, i) => {
        if (remaining <= 0) return;
        F.draw(ctx, line, this.bx + PAD_X, y + PAD_Y + i * F.lineHeight, { color: a.style.text, italic: a.style.italic, count: remaining });
        remaining -= [...line].length;
      });
      if (this.revealed() && a.auto == null && (!a.choice || a.page < a.pages.length - 1)) {
        drawIcon(ctx, Math.floor(this.tick / 16) % 2 ? 'arrow_1' : 'arrow_0', this.bx + this.bw - 34, y + H - 26);
      }
    }
    if (a.choice && this.revealed() && a.page === a.pages.length - 1) this.drawChoices(ctx, y, pos, hasText);
  }

  drawLabel(ctx, speaker, boxY, pos) {
    const F = skin.font;
    const w = F.measure(speaker) + 28;
    const h = F.lineHeight + 14;
    const lx = this.bx + 14;
    const ly = pos === 'top' ? boxY + this.boxH - 4 : boxY - h + 4;
    skin.panel(ctx, lx, ly, w, h, this.active.styleName);
    F.draw(ctx, speaker, lx + 14, ly + 8, { color: 'ui_label' });
  }

  drawChoices(ctx, boxY, pos, hasText) {
    const F = skin.font;
    const c = this.active.choice;
    const optW = Math.max(...c.options.map((o) => F.measure(o))) + 64;
    const optH = c.options.length * (F.lineHeight + 6) + 22;
    const x = this.bx + this.bw - optW;
    let y;
    if (!hasText) y = pos === 'top' ? 20 : ISO_H - optH - 20;
    else y = pos === 'top' ? boxY + this.boxH + 6 : boxY - optH - 6;
    skin.panel(ctx, x, y, optW, optH, this.active.styleName);
    c.rects = [];
    c.options.forEach((o, i) => {
      const oy = y + 12 + i * (F.lineHeight + 6);
      c.rects.push({ x, y: oy - 3, w: optW, h: F.lineHeight + 6 });
      const selected = i === c.index;
      if (selected) {
        ctx.fillStyle = 'rgba(248, 216, 112, 0.12)';
        ctx.fillRect(x + 6, oy - 3, optW - 12, F.lineHeight + 6);
        drawIcon(ctx, 'cursor', x + 14, oy + 2);
      }
      F.draw(ctx, o, x + 44, oy + 2, { color: selected ? 'ui_select' : this.active.style.text });
    });
  }
}

// ---- Inventory ------------------------------------------------------------

const PANEL = { x: 100, y: 36, w: 440, h: 222 };
const COLS = 8;
const SLOT = 48;
const ROWS = 2;
const GRID_X = PANEL.x + (PANEL.w - COLS * SLOT) / 2;
const GRID_Y = PANEL.y + 50;
const DESC = { x: 40, y: 290, w: ISO_W - 80, h: 150 };
const BTN_Y = PANEL.y + PANEL.h - 54;
const CLOSE_BTN = { x: PANEL.x + PANEL.w - 22 - 100, y: BTN_Y, w: 100, h: 36 };
const USE_BTN = { x: CLOSE_BTN.x - 8 - 92, y: BTN_Y, w: 92, h: 36 };
const LOOK_BTN = { x: USE_BTN.x - 8 - 92, y: BTN_Y, w: 92, h: 36 };
const UP_BTN = { x: PANEL.x + 22, y: BTN_Y, w: 40, h: 36 };
const DOWN_BTN = { x: PANEL.x + 66, y: BTN_Y, w: 40, h: 36 };

export class IsoInventory extends Inventory {
  constructor(items) {
    super(items);
    this.L = {
      PANEL, COLS, SLOT, GRID_X, GRID_Y, ROWS, DESC, DESC_LINES: 4,
      BUTTONS: [['look', LOOK_BTN, 'Look'], ['use', USE_BTN, 'Use'], ['close', CLOSE_BTN, 'Close']],
      UP_BTN, DOWN_BTN,
    };
  }

  draw(ctx) {
    const s = this.openState;
    if (!s) return;
    const F = skin.font;
    const L = this.L;
    ctx.fillStyle = 'rgba(8, 8, 16, 0.55)';
    ctx.fillRect(0, 0, ISO_W, ISO_H);
    skin.panel(ctx, PANEL.x, PANEL.y, PANEL.w, PANEL.h, 'npc');
    const title = 'Belongings';
    F.draw(ctx, title, PANEL.x + PANEL.w / 2 - F.measure(title) / 2, PANEL.y + 14, { color: 'ui_label' });
    for (let k = 0; k < COLS * ROWS; k++) {
      const i = s.scroll * COLS + k;
      const r = this.slotRect(i);
      skin.slot(ctx, r.x, r.y, r.w, r.h, i < s.owned.length);
    }
    s.owned.forEach((id, i) => {
      const r = this.slotRect(i);
      if (!r) return;
      const img = this.icon(id);
      if (img) ctx.drawImage(img, r.x + 8, r.y + 8, 32, 32);
      else F.draw(ctx, '?', r.x + r.w / 2 - 6, r.y + 12);
      if (i === s.index) this.drawSelection(ctx, r, s.button >= 0);
    });
    if (this.rowCount() > ROWS) {
      this.drawButton(ctx, UP_BTN, '<', s.scroll > 0);
      this.drawButton(ctx, DOWN_BTN, '>', s.scroll < this.rowCount() - ROWS);
    }
    L.BUTTONS.forEach(([action, rect, label], i) => {
      this.drawButton(ctx, rect, label, action === 'close' || s.owned.length > 0, i === s.button);
    });
    skin.panel(ctx, DESC.x, DESC.y, DESC.w, DESC.h, 'cheryl');
    if (!s.owned.length) {
      F.draw(ctx, 'My pockets are empty. Even the lint left.', DESC.x + 22, DESC.y + 18, { color: STYLES.cheryl.text });
      return;
    }
    const def = this.items[s.owned[s.index]] || { name: s.owned[s.index], description: '' };
    F.draw(ctx, def.name || s.owned[s.index], DESC.x + 22, DESC.y + 16, { color: 'ui_label' });
    const lines = F.wrap(def.description || '', DESC.w - 44).slice(0, 4);
    lines.forEach((line, i) => F.draw(ctx, line, DESC.x + 22, DESC.y + 16 + (i + 1) * F.lineHeight, { color: STYLES.cheryl.text }));
  }

  drawSelection(ctx, r, dim = false) {
    const blink = Math.floor(this.tick / 20) % 2 === 0;
    ctx.save();
    ctx.strokeStyle = dim ? '#887048' : blink ? '#f8d870' : '#c8a040';
    ctx.lineWidth = 2;
    ctx.strokeRect(r.x + 1, r.y + 1, r.w - 2, r.h - 2);
    ctx.restore();
  }

  drawButton(ctx, r, label, enabled, selected = false) {
    const F = skin.font;
    skin.panel(ctx, r.x, r.y, r.w, r.h, selected ? 'button_on' : 'button');
    F.draw(ctx, label, r.x + Math.round((r.w - F.measure(label)) / 2), r.y + Math.round((r.h - 18) / 2), { color: selected ? 'ui_select' : enabled ? 'ui_text' : 'ui_dim' });
  }
}

// ---- Title ----------------------------------------------------------------

export class IsoTitle extends Title {
  constructor(game, state) {
    super(game, state);
    this.stars = [];
    let s = 11;
    const r = () => ((s = (s * 16807) % 2147483647) / 2147483647);
    for (let i = 0; i < 180; i++) this.stars.push([Math.floor(r() * ISO_W), Math.floor(r() * 330), r()]);
  }

  draw(ctx) {
    const g = ctx.createLinearGradient(0, 0, 0, ISO_H);
    g.addColorStop(0, '#060614');
    g.addColorStop(0.55, '#23234a');
    g.addColorStop(1, '#3a3a66');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, ISO_W, ISO_H);
    for (const [x, y, b] of this.stars) {
      const tw = Math.sin(this.tick / 30 + b * 20) > 0.6 ? 1 : 0;
      ctx.fillStyle = b > 0.8 || tw ? '#f8f8f0' : '#8888a8';
      ctx.fillRect(x, y, b > 0.9 ? 2 : 1, b > 0.9 ? 2 : 1);
    }
    // Crescent moon with a soft glow.
    ctx.save();
    const glow = ctx.createRadialGradient(490, 110, 10, 490, 110, 90);
    glow.addColorStop(0, 'rgba(248, 240, 200, 0.25)');
    glow.addColorStop(1, 'rgba(248, 240, 200, 0)');
    ctx.fillStyle = glow;
    ctx.fillRect(390, 10, 200, 200);
    if (!this.moon) {
      // The crescent, cut on its own canvas so the sky shows through.
      this.moon = document.createElement('canvas');
      this.moon.width = 80;
      this.moon.height = 80;
      const m = this.moon.getContext('2d');
      m.fillStyle = '#f8f0c8';
      m.beginPath();
      m.arc(40, 40, 36, 0, Math.PI * 2);
      m.fill();
      m.globalCompositeOperation = 'destination-out';
      m.beginPath();
      m.arc(58, 30, 31, 0, Math.PI * 2);
      m.fill();
    }
    ctx.drawImage(this.moon, 450, 70);
    ctx.restore();
    // Skyline.
    ctx.fillStyle = '#101020';
    const roofs = [[0, 400, 100], [90, 380, 76], [156, 420, 110], [256, 360, 56], [300, 395, 124], [415, 372, 86], [490, 410, 76], [555, 386, 85]];
    for (const [x, y, w] of roofs) ctx.fillRect(x, y, w, ISO_H - y);
    ctx.beginPath();
    ctx.arc(284, 360, 28, Math.PI, 0);
    ctx.fill();
    ctx.fillRect(281, 322, 6, 12);
    ctx.fillStyle = '#f8d870';
    for (const [x, y] of [[120, 410], [200, 445], [325, 420], [440, 400], [580, 425], [270, 385], [520, 440]]) ctx.fillRect(x, y, 4, 6);

    const name = this.game.content.title || 'Moonshine';
    const B = skin.bigFont;
    B.draw(ctx, name, ISO_W / 2 - B.measure(name) / 2, 150, { color: 'ui_select', shadow: 'ui_cheryl_box' });
    const F = skin.font;
    const opts = this.currentOptions();
    if (this.confirming) {
      const t = 'Your saved game will be replaced.';
      F.draw(ctx, t, ISO_W / 2 - F.measure(t) / 2, 250, { color: 'ui_cheryl_text' });
    }
    this.rects = [];
    opts.forEach((o, i) => {
      const y = 300 + i * 44;
      const w = F.measure(o);
      const x = Math.round(ISO_W / 2 - w / 2);
      const r = { x: x - 40, y: y - 8, w: w + 80, h: 38 };
      this.rects.push(r);
      const sel = i === this.index;
      skin.panel(ctx, r.x, r.y, r.w, r.h, sel ? 'button_on' : 'button');
      F.draw(ctx, o, x, y + 2, { color: sel ? 'ui_select' : 'ui_text' });
    });
  }
}

// ---- HUD, barks, hints, cards ---------------------------------------------

export const BAG_BTN = { x: ISO_W - 60, y: 8, w: 52, h: 52 };
export const BANNER = { x: 8, y: 8, h: 52 };

export function drawHud(ctx, world) {
  const c = world.control;
  skin.panel(ctx, BAG_BTN.x, BAG_BTN.y, BAG_BTN.w, BAG_BTN.h, 'npc');
  drawIcon(ctx, 'bag', BAG_BTN.x + 10, BAG_BTN.y + 10, 32);
  c.bannerW = 0;
  if (c.holding) {
    const F = skin.font;
    const def = world.content.items[c.holding] || {};
    const text = `Use ${def.name || c.holding} on…`;
    const w = F.measure(text) + 74;
    c.bannerW = w;
    skin.panel(ctx, BANNER.x, BANNER.y, w, BANNER.h, 'cheryl');
    const icon = world.inventory.icon(c.holding);
    if (icon) ctx.drawImage(icon, BANNER.x + 10, BANNER.y + 10, 32, 32);
    F.draw(ctx, text, BANNER.x + 52, BANNER.y + 16, { color: STYLES.cheryl.text });
  }
}

export function drawBark(ctx, world) {
  const b = world.ambient.barkState;
  if (!b || world.textbox.open) return;
  const F = skin.font;
  const label = b.speaker ? `${b.speaker}:` : '';
  const lw = label ? F.measure(label) + 10 : 0;
  const lines = F.wrap(b.text || b.lines.join(' '), ISO_W - 80 - lw).slice(0, 2);
  const h = lines.length * F.lineHeight + 24;
  skin.panel(ctx, 16, 70, ISO_W - 32, h, 'npc');
  if (label) F.draw(ctx, label, 34, 82, { color: 'ui_label' });
  lines.forEach((l, i) => F.draw(ctx, l, 34 + lw, 82 + i * F.lineHeight, { color: 'ui_text' }));
}

export function drawHint(ctx, world) {
  const h = world.hintState;
  if (!h || world.textbox.open || world.inventory.open) return;
  if (h.t > h.ticks) {
    world.hintState = null;
    return;
  }
  const F = skin.font;
  const a = Math.min(1, h.t / 20, (h.ticks - h.t) / 20);
  const lines = F.wrap(h.text, ISO_W - 96);
  const w = Math.max(...lines.map((l) => F.measure(l))) + 40;
  const bh = lines.length * F.lineHeight + 22;
  const x = Math.round((ISO_W - w) / 2);
  const y = ISO_H - 18 - bh;
  ctx.save();
  ctx.globalAlpha = Math.round(a * 8) / 8;
  skin.panel(ctx, x, y, w, bh, 'npc');
  lines.forEach((l, i) => F.draw(ctx, l, x + 20, y + 11 + i * F.lineHeight, { color: 'ui_text' }));
  ctx.restore();
}

export function drawCard(ctx, text) {
  ctx.fillStyle = '#000000';
  ctx.fillRect(0, 0, ISO_W, ISO_H);
  const F = skin.font;
  const lines = F.wrap(text, ISO_W - 120);
  const top = Math.round(ISO_H / 2 - (lines.length * F.lineHeight) / 2);
  lines.forEach((line, i) => F.draw(ctx, line, ISO_W / 2 - F.measure(line) / 2, top + i * F.lineHeight, { color: 'ui_text' }));
}

export { sfx };
