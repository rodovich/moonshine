// The isometric UI skin from the art task's sheets (manifest.sheets.ui and
// manifest.fonts): nine-slice panels, bitmap fonts with their own metrics,
// icons, inventory slots. Each part falls back to the stand-in skin until
// its image has loaded. Installed by IsoView.attach() with setIsoSkin().

import { isoSheet, isoFonts, fontImage } from './sprites.js';
import { normalize } from '../text.js';

// Text box style -> panel frame.
const PANELS = {
  npc: 'panel_dialog', cheryl: 'panel_narration', thought: 'panel_thought',
  label: 'panel_label', button: 'panel_menu', button_on: 'panel_menu', inventory: 'panel_inventory',
};
// Engine icon name -> UI frame.
const ICONS = { cursor: 'choice_marker', bag: 'bag', bag_hover: 'bag_hover', bag_open: 'bag_open' };

// A palette color the SNES-era code asks for -> one of the art's font styles.
function fontStyle(opts = {}) {
  if (opts.italic && isoFonts.thought) return 'thought';
  const c = opts.color || 'ui_text';
  if ((c === 'ui_label' || c === 'ui_select') && isoFonts.label) return 'label';
  if (c === 'ui_cheryl_text' && isoFonts.narr) return 'narr';
  if (c === 'ui_dim' && isoFonts.dim) return 'dim';
  return 'text';
}

function artFont(fallback) {
  const metric = isoFonts.text;
  const glyph = (f, ch) => f.glyphs[ch] || f.glyphs['?'];
  const advance = (f, ch) => (ch === ' ' && !f.glyphs[' '] ? Math.round(f.lineHeight / 4) : glyph(f, ch)[4]);
  const measure = (text) => [...normalize(text)].reduce((w, ch) => w + advance(metric, ch), 0);
  return {
    lineHeight: metric.lineHeight,
    measure,
    wrap(text, width) {
      const out = [];
      for (const para of normalize(text).split('\n')) {
        let line = '';
        for (const word of para.split(' ')) {
          const trial = line ? `${line} ${word}` : word;
          if (measure(trial) <= width || !line) line = trial;
          else { out.push(line); line = word; }
        }
        out.push(line);
      }
      return out;
    },
    draw(ctx, text, x, y, opts = {}) {
      const f = isoFonts[fontStyle(opts)] || metric;
      const rec = fontImage(f);
      if (!rec.ready) return fallback.draw(ctx, text, x, y, opts);
      const count = opts.count == null ? Infinity : opts.count;
      let cx = Math.round(x);
      let n = 0;
      for (const ch of normalize(text)) {
        if (n++ >= count) break;
        const g = glyph(f, ch);
        if (g && g[2] && ch !== ' ') ctx.drawImage(rec.img, g[0], g[1], g[2], g[3], cx, Math.round(y), g[2], g[3]);
        cx += advance(f, ch);
      }
    },
  };
}

export function artSkin(standIn) {
  const ui = isoSheet('ui');
  if (!ui || !isoFonts.text) return {};
  const skin = { font: artFont(standIn.font) };
  skin.panel = (ctx, x, y, w, h, styleName = 'npc') => {
    const name = PANELS[styleName] || 'panel_dialog';
    const r = ui.ready && ui.raw(name);
    const sl = ui.m.slices && ui.m.slices[name];
    if (!r || !sl) return standIn.panel(ctx, x, y, w, h, styleName);
    const [l, t, rr, b] = sl;
    const cols = [[0, l, x, l], [l, r.w - l - rr, x + l, w - l - rr], [r.w - rr, rr, x + w - rr, rr]];
    const rows = [[0, t, y, t], [t, r.h - t - b, y + t, h - t - b], [r.h - b, b, y + h - b, b]];
    for (const [sx, sw, dx, dw] of cols) {
      for (const [sy, sh, dy, dh] of rows) {
        if (sw > 0 && sh > 0 && dw > 0 && dh > 0) ctx.drawImage(r.img, r.sx + sx, r.sy + sy, sw, sh, Math.round(dx), Math.round(dy), Math.round(dw), Math.round(dh));
      }
    }
    if (styleName === 'button_on') {
      ctx.save();
      ctx.strokeStyle = '#f8d870';
      ctx.lineWidth = 2;
      ctx.strokeRect(x + 3, y + 3, w - 6, h - 6);
      ctx.restore();
    }
  };
  skin.icon = (name) => {
    const f = ui.ready && ICONS[name] && ui.frame(ICONS[name]);
    return f ? f.img : standIn.icon(name);
  };
  skin.slot = (ctx, x, y, w, h, filled) => {
    const f = ui.ready && ui.frame('slot');
    if (!f) return standIn.slot(ctx, x, y, w, h, filled);
    ctx.drawImage(f.img, Math.round(x + w / 2 - f.ax), Math.round(y + h / 2 - f.ay));
  };
  skin.slotSelected = (ctx, x, y, w, h) => {
    const f = ui.ready && ui.frame('slot_selected');
    if (!f) return false;
    ctx.drawImage(f.img, Math.round(x + w / 2 - f.ax), Math.round(y + h / 2 - f.ay));
    return true;
  };
  skin.itemIcon = (id) => {
    const f = ui.ready && ui.frame(`item_${id}`);
    return f ? f.img : null;
  };
  return skin;
}
