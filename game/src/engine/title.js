// Title screen: the game's name and Continue / New Game.

import { WIDTH, HEIGHT } from './display.js';
import { drawText, drawTextCentered, measure, LINE_HEIGHT } from './text.js';
import { loadSheet } from './art.js';
import { uiSmall } from '../art/ui.js';
import { inRect } from './ui.js';
import { sfx } from './sound.js';

export class Title {
  constructor(game, { canContinue }) {
    this.game = game;
    this.tick = 0;
    this.small = loadSheet(uiSmall);
    this.options = canContinue ? ['Continue', 'New Game'] : ['New Game'];
    this.index = 0;
    this.confirming = false; // asking before overwriting a save
    this.rects = [];
    this.done = false;
    // Deterministic starfield
    this.stars = [];
    let s = 7;
    const r = () => ((s = (s * 16807) % 2147483647) / 2147483647);
    for (let i = 0; i < 70; i++) this.stars.push([Math.floor(r() * WIDTH), Math.floor(r() * 150), r()]);
  }

  update(input) {
    this.tick++;
    if (this.done) return;
    const opts = this.currentOptions();
    const d = input.menuDir();
    if (d === 'up' || d === 'down') {
      this.index = (this.index + (d === 'up' ? opts.length - 1 : 1)) % opts.length;
      sfx('cursor');
    }
    if (input.hover && input.lastScheme === 'pointer') {
      const i = this.rects.findIndex((r) => inRect(input.hover, r));
      if (i >= 0) this.index = i;
    }
    let chosen = null;
    if (input.pressed('confirm')) chosen = this.index;
    if (input.pressed('cancel') && this.confirming) {
      this.confirming = false;
      this.index = 0;
      sfx('cancel');
      return;
    }
    for (const t of input.taps()) {
      const i = this.rects.findIndex((r) => inRect(t, r));
      if (i >= 0) chosen = i;
    }
    if (chosen == null) return;
    sfx('select');
    const label = opts[chosen];
    if (this.confirming) {
      this.confirming = false;
      this.index = 0;
      if (label === 'Start over') this.finish('new');
      return;
    }
    if (label === 'Continue') this.finish('continue');
    else if (this.options.includes('Continue')) {
      this.confirming = true;
      this.index = 1;
    } else this.finish('new');
  }

  currentOptions() {
    return this.confirming ? ['Start over', 'Keep my game'] : this.options;
  }

  finish(choice) {
    this.done = true;
    this.game.startFromTitle(choice);
  }

  draw(ctx) {
    // Night sky gradient in 8 px bands.
    const sky = ['#080818', '#101028', '#181838', '#202048', '#282858', '#303060', '#383868', '#404070'];
    for (let i = 0; i < 28; i++) {
      ctx.fillStyle = sky[Math.min(sky.length - 1, Math.floor(i / 3.5))];
      ctx.fillRect(0, i * 8, WIDTH, 8);
    }
    for (const [x, y, b] of this.stars) {
      const tw = Math.sin(this.tick / 30 + b * 20) > 0.6 ? 1 : 0;
      ctx.fillStyle = b > 0.8 || tw ? '#f8f8f0' : '#8888a8';
      ctx.fillRect(x, y, 1, 1);
    }
    // Moon
    // Crescent moon, drawn pixel by pixel so it stays crisp.
    for (let y = -14; y <= 14; y++) {
      for (let x = -14; x <= 14; x++) {
        if (x * x + y * y > 14 * 14) continue;
        const dx = x - 7;
        const dy = y + 4;
        if (dx * dx + dy * dy <= 12 * 12) continue;
        ctx.fillStyle = x + y > 6 ? '#d8c8a0' : '#f8f0c8';
        ctx.fillRect(196 + x, 44 + y, 1, 1);
      }
    }
    // Rooftops silhouette
    ctx.fillStyle = '#101020';
    const roofs = [[0, 170, 40], [36, 160, 30], [62, 176, 44], [102, 150, 22], [120, 166, 50], [166, 156, 34], [196, 172, 30], [222, 162, 34]];
    for (const [x, y, w] of roofs) ctx.fillRect(x, y, w, HEIGHT - y);
    // A dome and a few chimneys, so the skyline reads as Tessel.
    for (let dy = 0; dy <= 11; dy++) {
      const half = Math.round(Math.sqrt(121 - dy * dy));
      ctx.fillRect(113 - half, 150 - dy, half * 2, 1);
    }
    ctx.fillRect(112, 135, 2, 4);
    for (const [x, y] of [[44, 152], [70, 168], [176, 148], [230, 154]]) ctx.fillRect(x, y, 4, 8);
    ctx.fillStyle = '#f8d870';
    for (const [x, y] of [[48, 172], [80, 186], [130, 176], [176, 168], [232, 178], [108, 160]]) ctx.fillRect(x, y, 2, 3);

    if (!this.titleImg) this.titleImg = renderLarge(this.game.content.title || 'Moonshine');
    ctx.drawImage(this.titleImg, Math.round(WIDTH / 2 - this.titleImg.width), 64, this.titleImg.width * 2, this.titleImg.height * 2);
    const opts = this.currentOptions();
    if (this.confirming) drawTextCentered(ctx, 'Your saved game will be replaced.', WIDTH / 2, 112, { color: 'ui_cheryl_text' });
    this.rects = [];
    const top = 132;
    opts.forEach((o, i) => {
      const y = top + i * (LINE_HEIGHT + 6);
      const w = measure(o);
      const x = Math.round(WIDTH / 2 - w / 2);
      this.rects.push({ x: x - 16, y: y - 4, w: w + 32, h: LINE_HEIGHT + 4 });
      const sel = i === this.index;
      if (sel) ctx.drawImage(this.small.frame('cursor'), x - 12, y);
      drawText(ctx, o, x, y, { color: sel ? 'ui_select' : 'ui_text' });
    });
  }
}

// The title text at 1×, drawn once; the screen scales it up 2×.
function renderLarge(text) {
  const tmp = document.createElement('canvas');
  tmp.width = measure(text) + 2;
  tmp.height = 11;
  drawText(tmp.getContext('2d'), text, 0, 0, { color: 'ui_select', shadow: 'ui_cheryl_box' });
  return tmp;
}
