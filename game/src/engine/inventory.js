// Inventory screen: two rows of item icons (scrolling when there are more),
// the selected item's name and description (in Cheryl's voice), and Use /
// Close buttons.
//
// Keyboard: arrows select (and scroll), Z uses, X closes. Down from the last
// row moves to the buttons (Look, Use, Close); Z presses the one selected.
// Pointer: tap an item to select it, tap it again or tap Use to use it, tap
// Look to examine it, tap the arrows to scroll, tap Close or outside the
// panel to close.

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
const LOOK_BTN = { x: USE_BTN.x - 4 - 44, y: BTN_Y, w: 44, h: 17 };
const BUTTONS = [['look', LOOK_BTN, 'Look'], ['use', USE_BTN, 'Use'], ['close', CLOSE_BTN, 'Close']];
const UP_BTN = { x: PANEL.x + 10, y: BTN_Y, w: 18, h: 17 };
const DOWN_BTN = { x: PANEL.x + 30, y: BTN_Y, w: 18, h: 17 };
const warnedLong = new Set();

export class Inventory {
  constructor(items) {
    // Layout (the isometric view's bag gives its own, and its own drawing).
    this.L = { PANEL, COLS, SLOT, GRID_X, GRID_Y, ROWS, DESC, DESC_LINES, BUTTONS, UP_BTN, DOWN_BTN };
    this.items = items; // content item definitions by id
    this.openState = null;
    this.small = loadSheet(uiSmall);
    this.tick = 0;
  }

  get open() {
    return !!this.openState;
  }

  // Opens the screen; resolves to { use: itemId }, { look: itemId }, or null.
  show(owned, selectId = null) {
    sfx('select');
    return new Promise((resolve) => {
      const index = Math.max(0, owned.indexOf(selectId));
      this.openState = { owned: [...owned], index, scroll: 0, resolve, button: -1 };
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
    const row = Math.floor(i / this.L.COLS) - (this.openState?.scroll || 0);
    if (row < 0 || row >= this.L.ROWS) return null;
    return { x: this.L.GRID_X + (i % this.L.COLS) * this.L.SLOT, y: this.L.GRID_Y + row * this.L.SLOT, w: this.L.SLOT, h: this.L.SLOT };
  }

  rowCount() {
    return Math.max(this.L.ROWS, Math.ceil(this.openState.owned.length / this.L.COLS));
  }

  keepVisible() {
    const s = this.openState;
    const row = Math.floor(s.index / this.L.COLS);
    if (row < s.scroll) s.scroll = row;
    if (row >= s.scroll + this.L.ROWS) s.scroll = row - this.L.ROWS + 1;
  }

  scrollBy(d) {
    const s = this.openState;
    const max = this.rowCount() - this.L.ROWS;
    const next = Math.max(0, Math.min(max, s.scroll + d));
    if (next === s.scroll) return;
    s.scroll = next;
    // Keep the selection on a visible row.
    const row = Math.floor(s.index / this.L.COLS);
    const col = s.index % this.L.COLS;
    const want = Math.max(s.scroll, Math.min(s.scroll + this.L.ROWS - 1, row));
    s.index = Math.min(s.owned.length - 1, want * this.L.COLS + col);
    sfx('cursor');
  }

  update(input) {
    this.tick++;
    const s = this.openState;
    if (!s) return;
    const n = s.owned.length;
    const d = input.menuDir();
    if (s.button >= 0) {
      // Keyboard focus on the button row.
      if (d === 'left' || d === 'right') {
        s.button = (s.button + (d === 'left' ? this.L.BUTTONS.length - 1 : 1)) % this.L.BUTTONS.length;
        sfx('cursor');
      }
      if (d === 'up') { s.button = -1; sfx('cursor'); }
      if (input.pressed('confirm')) return this.press(this.L.BUTTONS[s.button][0]);
      if (input.pressed('cancel')) return this.close(null);
    } else if (d === 'down' && (!n || s.index + this.L.COLS >= n)) {
      s.button = n ? 1 : 2;
      sfx('cursor');
    } else if (d && n) {
      let i = s.index;
      if (d === 'left') i = (i + n - 1) % n;
      if (d === 'right') i = (i + 1) % n;
      if (d === 'up' && i - this.L.COLS >= 0) i -= this.L.COLS;
      if (d === 'down' && i + this.L.COLS < n) i += this.L.COLS;
      if (i !== s.index) { s.index = i; this.keepVisible(); sfx('cursor'); }
    }
    if (s.button < 0 && input.pressed('confirm') && n) return this.close({ use: s.owned[s.index] });
    if (input.pressed('cancel')) return this.close(null);
    for (const t of input.taps()) {
      for (const [action, rect] of this.L.BUTTONS) if (inRect(t, rect)) return this.press(action);
      if (this.rowCount() > this.L.ROWS && inRect(t, this.L.UP_BTN)) return this.scrollBy(-1);
      if (this.rowCount() > this.L.ROWS && inRect(t, this.L.DOWN_BTN)) return this.scrollBy(1);
      for (let i = 0; i < n; i++) {
        const r = this.slotRect(i);
        if (r && inRect(t, r)) {
          // The first tap on an item only selects it (even if it was already
          // selected when the bag opened); a second tap on it uses it.
          if (i === s.index && s.tapped === i) return this.close({ use: s.owned[i] });
          s.index = i;
          s.tapped = i;
          s.button = -1;
          sfx('cursor');
          return;
        }
      }
      const inPanel = inRect(t, this.L.PANEL) || inRect(t, this.L.DESC);
      if (!inPanel) return this.close(null);
    }
  }

  press(action) {
    const s = this.openState;
    const id = s.owned[s.index];
    if (action === 'close') return this.close(null);
    if (!id) return undefined;
    return this.close(action === 'look' ? { look: id } : { use: id });
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
    drawBox(ctx, this.L.PANEL.x, this.L.PANEL.y, this.L.PANEL.w, this.L.PANEL.h, STYLES.npc);
    drawTextCentered(ctx, 'Belongings', this.L.PANEL.x + this.L.PANEL.w / 2, this.L.PANEL.y + 7, { color: 'ui_label' });
    // Slots: occupied ones darker than empty ones, so a short list doesn't
    // read as a big empty grid.
    for (let k = 0; k < this.L.COLS * this.L.ROWS; k++) {
      const i = s.scroll * this.L.COLS + k;
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
      // With keyboard focus on the buttons, the item keeps a dim frame.
      if (i === s.index) this.drawSelection(ctx, r, s.button >= 0);
    });
    // Buttons, inside the panel's bottom edge
    if (this.rowCount() > this.L.ROWS) {
      this.drawButton(ctx, this.L.UP_BTN, '<', s.scroll > 0);
      this.drawButton(ctx, this.L.DOWN_BTN, '>', s.scroll < this.rowCount() - this.L.ROWS);
    }
    this.L.BUTTONS.forEach(([action, rect, label], i) => {
      this.drawButton(ctx, rect, label, action === 'close' || s.owned.length > 0, i === s.button);
    });
    // Description
    drawBox(ctx, this.L.DESC.x, this.L.DESC.y, this.L.DESC.w, this.L.DESC.h, STYLES.cheryl);
    if (!s.owned.length) {
      drawText(ctx, 'My pockets are empty. Even the lint left.', this.L.DESC.x + 8, this.L.DESC.y + 8, { color: STYLES.cheryl.text });
      return;
    }
    const def = this.items[s.owned[s.index]] || { name: s.owned[s.index], description: '' };
    drawText(ctx, def.name || s.owned[s.index], this.L.DESC.x + 8, this.L.DESC.y + 7, { color: 'ui_label' });
    const all = wrap(def.description || '', this.L.DESC.w - 16);
    if (all.length > this.L.DESC_LINES && !warnedLong.has(s.owned[s.index])) {
      warnedLong.add(s.owned[s.index]);
      console.warn(`[inventory] description of "${s.owned[s.index]}" is ${all.length} lines; only ${this.L.DESC_LINES} fit`);
    }
    const lines = all.slice(0, this.L.DESC_LINES);
    lines.forEach((line, i) => drawText(ctx, line, this.L.DESC.x + 8, this.L.DESC.y + 7 + (i + 1) * LINE_HEIGHT, { color: STYLES.cheryl.text }));
  }

  drawSelection(ctx, r, dim = false) {
    const blink = Math.floor(this.tick / 20) % 2 === 0;
    ctx.fillStyle = dim ? '#887048' : blink ? '#f8d870' : '#c8a040';
    ctx.fillRect(r.x, r.y, r.w, 1);
    ctx.fillRect(r.x, r.y + r.h - 1, r.w, 1);
    ctx.fillRect(r.x, r.y, 1, r.h);
    ctx.fillRect(r.x + r.w - 1, r.y, 1, r.h);
  }

  drawButton(ctx, r, label, enabled, selected = false) {
    drawBox(ctx, r.x, r.y, r.w, r.h, STYLES.npc);
    const w = measure(label);
    drawText(ctx, label, r.x + Math.round((r.w - w) / 2), r.y + 4, { color: selected ? 'ui_select' : enabled ? 'ui_text' : 'ui_dim' });
    if (selected) ctx.drawImage(this.small.frame('cursor'), r.x - 2, r.y + 5);
  }
}
