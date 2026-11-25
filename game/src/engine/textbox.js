// Dialog box: typewriter text in pages of three lines, a speaker label for
// NPCs, Cheryl's descriptions and thoughts in their own styles, and choices.

import { WIDTH, HEIGHT } from './display.js';
import { drawText, measure, wrap, LINE_HEIGHT } from './text.js';
import { loadSheet } from './art.js';
import { uiSmall } from '../art/ui.js';
import { STYLES, drawBox, inRect } from './ui.js';
import { sfx } from './sound.js';

const BOX_X = 8;
const BOX_W = WIDTH - 16;
const PAD_X = 8;
const PAD_Y = 7;
const LINES = 3;
const BOX_H = PAD_Y * 2 + LINES * LINE_HEIGHT - 3;
const CHARS_PER_TICK = 0.7; // ~42 characters per second
const PAUSES = { '.': 8, '!': 8, '?': 8, '…': 10, ',': 4, ';': 5, ':': 5, '—': 5 };

export class TextBox {
  constructor() {
    this.active = null; // { pages, page, shown, style, speaker, resolve, choice }
    this.position = 'bottom';
    this.tick = 0;
    this.small = loadSheet(uiSmall);
  }

  get open() {
    return !!this.active;
  }

  // Show text; resolves when the player dismisses the last page. With
  // `auto` (seconds), each page closes on its own that long after it's fully
  // shown, and input neither skips nor advances it.
  show({ text, speaker = null, style = 'npc', position = 'bottom', auto = null }) {
    return new Promise((resolve) => {
      const s = STYLES[style] || STYLES.npc;
      const lines = wrap(text, BOX_W - PAD_X * 2);
      const pages = [];
      for (let i = 0; i < lines.length; i += LINES) pages.push(lines.slice(i, i + LINES));
      this.position = position;
      this.active = { pages, page: 0, shown: 0, pause: 0, style: s, styleName: style, speaker, resolve, choice: null, auto, autoT: 0 };
    });
  }

  // Show a prompt (optional) with options; resolves to the chosen index.
  // Cancel picks `cancelIndex` if given (default: none, cancel does nothing).
  choose({ options, prompt = null, speaker = null, style = 'npc', position = 'bottom', cancelIndex = null }) {
    return new Promise((resolve) => {
      const s = STYLES[style] || STYLES.npc;
      // A long prompt pages like normal text; the options appear on its last page.
      const lines = prompt ? wrap(prompt, BOX_W - PAD_X * 2) : [];
      const pages = [];
      for (let i = 0; i < lines.length; i += LINES) pages.push(lines.slice(i, i + LINES));
      if (!pages.length) pages.push([]);
      this.position = position;
      this.active = {
        pages, page: 0, shown: 0, pause: 0, style: s, styleName: style, speaker, resolve,
        choice: { options, index: 0, cancelIndex, rects: [] },
      };
      if (!prompt) this.active.shown = Infinity;
    });
  }

  pageText() {
    return this.active.pages[this.active.page].join('\n');
  }

  pageLength() {
    return this.active.pages[this.active.page].reduce((n, l) => n + [...l].length, 0);
  }

  revealed() {
    return this.active.shown >= this.pageLength();
  }

  update(input) {
    this.tick++;
    const a = this.active;
    if (!a) return;
    // Typewriter
    if (!this.revealed()) {
      if (a.pause > 0) {
        a.pause--;
      } else {
        const before = Math.floor(a.shown);
        a.shown += CHARS_PER_TICK;
        const after = Math.floor(a.shown);
        if (after > before) {
          const chars = [...a.pages[a.page].join('')];
          const ch = chars[after - 1];
          if (PAUSES[ch] && after < chars.length) a.pause = PAUSES[ch];
          if (after % 3 === 1 && ch !== ' ') sfx(a.styleName === 'npc' ? 'text' : 'text_cheryl');
        }
      }
    }

    const taps = input.taps();
    if (a.auto != null) {
      input.flush();
      if (!this.revealed()) return;
      if (++a.autoT < a.auto * 60) return;
      a.autoT = 0;
      if (a.page < a.pages.length - 1) {
        a.page++;
        a.shown = 0;
      } else {
        this.finish();
      }
      return;
    }
    const lastPage = a.page === a.pages.length - 1;
    if (a.choice && this.revealed() && lastPage) {
      const c = a.choice;
      const d = input.menuDir();
      if (d === 'up' || d === 'left') { c.index = (c.index + c.options.length - 1) % c.options.length; sfx('cursor'); }
      if (d === 'down' || d === 'right') { c.index = (c.index + 1) % c.options.length; sfx('cursor'); }
      if (input.pressed('confirm')) return this.finish(c.index);
      if (input.pressed('cancel') && c.cancelIndex != null) { sfx('cancel'); return this.finish(c.cancelIndex); }
      for (const t of taps) {
        const i = c.rects.findIndex((r) => inRect(t, r));
        if (i >= 0) {
          c.index = i;
          return this.finish(i);
        }
      }
      // Hover highlights options under a mouse.
      if (input.hover) {
        const i = c.rects.findIndex((r) => inRect(input.hover, r));
        if (i >= 0 && i !== c.index && input.lastScheme === 'pointer') c.index = i;
      }
      return;
    }

    const advance = input.pressed('confirm') || input.pressed('cancel') || taps.length > 0;
    if (!advance) return;
    if (!this.revealed()) {
      a.shown = Infinity;
      a.pause = 0;
    } else if (a.page < a.pages.length - 1) {
      a.page++;
      a.shown = 0;
    } else {
      this.finish();
    }
  }

  finish(value) {
    const a = this.active;
    this.active = null;
    if (a.choice) sfx('select');
    a.resolve(value);
  }

  // `playerScreenY`: where the player is, to keep the box off them.
  draw(ctx, playerScreenY = 0) {
    const a = this.active;
    if (!a) return;
    let pos = this.position;
    if (pos === 'auto') pos = playerScreenY > HEIGHT * 0.62 ? 'top' : 'bottom';
    const y = pos === 'top' ? 8 : HEIGHT - BOX_H - 8;
    const hasText = a.pages[a.page].length > 0;
    if (hasText || !a.choice) {
      drawBox(ctx, BOX_X, y, BOX_W, BOX_H, a.style);
      if (a.speaker) this.drawLabel(ctx, a.speaker, y, pos);
      let remaining = Math.floor(a.shown);
      a.pages[a.page].forEach((line, i) => {
        if (remaining <= 0) return;
        const n = [...line].length;
        drawText(ctx, line, BOX_X + PAD_X, y + PAD_Y + i * LINE_HEIGHT, {
          color: a.style.text, italic: a.style.italic, count: remaining,
        });
        remaining -= n;
      });
      if (this.revealed() && a.auto == null && (!a.choice || a.page < a.pages.length - 1)) {
        const frame = this.small.frame(Math.floor(this.tick / 16) % 2 ? 'arrow_1' : 'arrow_0');
        ctx.drawImage(frame, BOX_X + BOX_W - 14, y + BOX_H - 11);
      }
    }
    if (a.choice && this.revealed() && a.page === a.pages.length - 1) this.drawChoices(ctx, y, pos, hasText);
  }

  drawLabel(ctx, speaker, boxY, pos) {
    const w = measure(speaker) + 12;
    const h = 17;
    const lx = BOX_X + 6;
    const ly = pos === 'top' ? boxY + BOX_H - 3 : boxY - h + 3;
    drawBox(ctx, lx, ly, w, h, this.active.style);
    drawText(ctx, speaker, lx + 6, ly + 4, { color: 'ui_label' });
  }

  drawChoices(ctx, boxY, pos, hasText) {
    const c = this.active.choice;
    const optW = Math.max(...c.options.map((o) => measure(o))) + 24;
    const optH = c.options.length * LINE_HEIGHT + 10;
    const x = BOX_X + BOX_W - optW;
    let y;
    if (!hasText) y = pos === 'top' ? 8 : HEIGHT - optH - 8;
    else y = pos === 'top' ? boxY + BOX_H + 2 : boxY - optH - 2;
    drawBox(ctx, x, y, optW, optH, this.active.style);
    c.rects = [];
    c.options.forEach((o, i) => {
      const oy = y + 5 + i * LINE_HEIGHT;
      c.rects.push({ x, y: oy - 1, w: optW, h: LINE_HEIGHT });
      const selected = i === c.index;
      if (selected) ctx.drawImage(this.small.frame('cursor'), x + 6, oy);
      drawText(ctx, o, x + 16, oy, { color: selected ? 'ui_select' : this.active.style.text });
    });
  }
}
