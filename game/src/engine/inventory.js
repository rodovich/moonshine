// Inventory screen: two rows of item icons (scrolling when there are more),
// the selected item's name and description (in Cheryl's voice), and Use /
// Close buttons.
//
// Keyboard: arrows select (and scroll), Z uses, X closes.
// Pointer: tap an item to select it, tap it again or tap Use to use it, tap
// the arrows to scroll, tap Close or outside the panel to close.

import { WIDTH, HEIGHT } from './display.js';
import { drawText, drawTextCentered, measure, wrap, LINE_HEIGHT } from './text.js';
import { loadSheet } from './art.js';
import { uiSmall } from '../art/ui.js';
import { STYLES, drawBox, inRect } from './ui.js';
import { sfx } from './sound.js';

const PANEL = { x: 24, y: 14, w: 208, h: 96 };
const COLS = 8;
const SLOT = 22;
const GRID_X = PANEL.x + (PANEL.w - COLS * SLOT) / 2;
const GRID_Y = PANEL.y + 22;
const ROWS = 2; // visible rows; more scroll
const DESC = { x: 8, y: 150, w: WIDTH - 16, h: 66 };
const DESC_LINES = 4;
const BTN_Y = PANEL.y + PANEL.h - 24;
const CLOSE_BTN = { x: PANEL.x + PANEL.w - 10 - 48, y: BTN_Y, w: 48, h: 17 };
const USE_BTN = { x: CLOSE_BTN.x - 4 - 44, y: BTN_Y, w: 44, h: 17 };
const UP_BTN = { x: PANEL.x + 10, y: BTN_Y, w: 18, h: 17 };
const DOWN_BTN = { x: PANEL.x + 30, y: BTN_Y, w: 18, h: 17 };
const warnedLong = new Set();

export class Inventory {
  constructor(items) {
    this.items = items; // content item definitions by id
    this.openState = null;
    this.small = loadSheet(uiSmall);
    this.tick = 0;
  }

  get open() {
    return !!this.openState;
  }

  // Opens the screen; resolves to { use: itemId } or null when closed.
  show(owned, selectId = null) {
    sfx('select');
    return new Promise((resolve) => {
      const index = Math.max(0, owned.indexOf(selectId));
      this.openState = { owned: [...owned], index, scroll: 0, resolve };
      this.keepVisible();
    });
  }

  icon(id) {
    const def = this.items[id];
    if (!def || !def.icon) return null;
    return loadSheet(def.icon.sheet, def.icon.palette).anim(def.icon.frame)[0];
  }

  // Screen rect of slot i, or null if it's scrolled out of view.
  slotRect(i) {
    const row = Math.floor(i / COLS) - (this.openState?.scroll || 0);
    if (row < 0 || row >= ROWS) return null;
    return { x: GRID_X + (i % COLS) * SLOT, y: GRID_Y + row * SLOT, w: SLOT, h: SLOT };
  }

  rowCount() {
    return Math.max(ROWS, Math.ceil(this.openState.owned.length / COLS));
  }

  keepVisible() {
    const s = this.openState;
    const row = Math.floor(s.index / COLS);
    if (row < s.scroll) s.scroll = row;
    if (row >= s.scroll + ROWS) s.scroll = row - ROWS + 1;
  }

  scrollBy(d) {
    const s = this.openState;
    const max = this.rowCount() - ROWS;
    const next = Math.max(0, Math.min(max, s.scroll + d));
    if (next === s.scroll) return;
    s.scroll = next;
    // Keep the selection on a visible row.
    const row = Math.floor(s.index / COLS);
    const col = s.index % COLS;
    const want = Math.max(s.scroll, Math.min(s.scroll + ROWS - 1, row));
    s.index = Math.min(s.owned.length - 1, want * COLS + col);
    sfx('cursor');
  }

  update(input) {
    this.tick++;
    const s = this.openState;
    if (!s) return;
    const n = s.owned.length;
    const d = input.menuDir();
    if (d && n) {
      let i = s.index;
      if (d === 'left') i = (i + n - 1) % n;
      if (d === 'right') i = (i + 1) % n;
      if (d === 'up' && i - COLS >= 0) i -= COLS;
      if (d === 'down' && i + COLS < n) i += COLS;
      if (i !== s.index) { s.index = i; this.keepVisible(); sfx('cursor'); }
    }
    if (input.pressed('confirm') && n) return this.close({ use: s.owned[s.index] });
    if (input.pressed('cancel')) return this.close(null);
    for (const t of input.taps()) {
      if (inRect(t, CLOSE_BTN)) return this.close(null);
      if (n && inRect(t, USE_BTN)) return this.close({ use: s.owned[s.index] });
      if (this.rowCount() > ROWS && inRect(t, UP_BTN)) return this.scrollBy(-1);
      if (this.rowCount() > ROWS && inRect(t, DOWN_BTN)) return this.scrollBy(1);
      for (let i = 0; i < n; i++) {
        const r = this.slotRect(i);
        if (r && inRect(t, r)) {
          if (i === s.index) return this.close({ use: s.owned[i] });
          s.index = i;
          sfx('cursor');
          return;
        }
      }
      const inPanel = inRect(t, PANEL) || inRect(t, DESC);
      if (!inPanel) return this.close(null);
    }
  }

  close(result) {
    const s = this.openState;
    this.openState = null;
    sfx(result ? 'select' : 'cancel');
    s.resolve(result);
  }

  draw(ctx) {
    const s = this.openState;
    if (!s) return;
    ctx.fillStyle = 'rgba(8, 8, 16, 0.55)';
    ctx.fillRect(0, 0, WIDTH, HEIGHT);
    drawBox(ctx, PANEL.x, PANEL.y, PANEL.w, PANEL.h, STYLES.npc);
    drawTextCentered(ctx, 'Belongings', PANEL.x + PANEL.w / 2, PANEL.y + 7, { color: 'ui_label' });
    // Slots: occupied ones darker than empty ones, so a short list doesn't
    // read as a big empty grid.
    for (let k = 0; k < COLS * ROWS; k++) {
      const i = s.scroll * COLS + k;
      const r = this.slotRect(i);
      ctx.fillStyle = i < s.owned.length ? 'rgba(16, 16, 32, 0.45)' : 'rgba(16, 16, 32, 0.15)';
      ctx.fillRect(r.x + 2, r.y + 2, r.w - 4, r.h - 4);
    }
    s.owned.forEach((id, i) => {
      const r = this.slotRect(i);
      if (!r) return;
      const img = this.icon(id);
      if (img) ctx.drawImage(img, r.x + 3, r.y + 3);
      else drawTextCentered(ctx, '?', r.x + r.w / 2, r.y + 7);
      if (i === s.index) this.drawSelection(ctx, r);
    });
    // Buttons, inside the panel's bottom edge
    if (this.rowCount() > ROWS) {
      this.drawButton(ctx, UP_BTN, '<', s.scroll > 0);
      this.drawButton(ctx, DOWN_BTN, '>', s.scroll < this.rowCount() - ROWS);
    }
    this.drawButton(ctx, USE_BTN, 'Use', s.owned.length > 0);
    this.drawButton(ctx, CLOSE_BTN, 'Close', true);
    // Description
    drawBox(ctx, DESC.x, DESC.y, DESC.w, DESC.h, STYLES.cheryl);
    if (!s.owned.length) {
      drawText(ctx, 'My pockets are empty. Even the lint left.', DESC.x + 8, DESC.y + 8, { color: STYLES.cheryl.text });
      return;
    }
    const def = this.items[s.owned[s.index]] || { name: s.owned[s.index], description: '' };
    drawText(ctx, def.name || s.owned[s.index], DESC.x + 8, DESC.y + 7, { color: 'ui_label' });
    const all = wrap(def.description || '', DESC.w - 16);
    if (all.length > DESC_LINES && !warnedLong.has(s.owned[s.index])) {
      warnedLong.add(s.owned[s.index]);
      console.warn(`[inventory] description of "${s.owned[s.index]}" is ${all.length} lines; only ${DESC_LINES} fit`);
    }
    const lines = all.slice(0, DESC_LINES);
    lines.forEach((line, i) => drawText(ctx, line, DESC.x + 8, DESC.y + 7 + (i + 1) * LINE_HEIGHT, { color: STYLES.cheryl.text }));
  }

  drawSelection(ctx, r) {
    const blink = Math.floor(this.tick / 20) % 2 === 0;
    ctx.fillStyle = blink ? '#f8d870' : '#c8a040';
    ctx.fillRect(r.x, r.y, r.w, 1);
    ctx.fillRect(r.x, r.y + r.h - 1, r.w, 1);
    ctx.fillRect(r.x, r.y, 1, r.h);
    ctx.fillRect(r.x + r.w - 1, r.y, 1, r.h);
  }

  drawButton(ctx, r, label, enabled) {
    drawBox(ctx, r.x, r.y, r.w, r.h, STYLES.npc);
    const w = measure(label);
    drawText(ctx, label, r.x + Math.round((r.w - w) / 2), r.y + 4, { color: enabled ? 'ui_text' : 'ui_dim' });
  }
}
