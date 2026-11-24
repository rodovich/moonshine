// Display: the game draws into a 256×224 buffer; present() scales it onto a
// full-window canvas at an integer factor of *device* pixels, centered and
// letterboxed, with nearest-neighbor sampling.
//
// If the best integer factor would waste a lot of screen (small phones), we use
// the exact fit factor instead; pixels then vary by one device pixel, which is
// hard to see at phone pixel densities. See README.md, "Engine decisions".

export const WIDTH = 256;
export const HEIGHT = 224;

export class Display {
  constructor(parent) {
    this.canvas = document.createElement('canvas');
    this.canvas.id = 'screen';
    parent.appendChild(this.canvas);
    this.ctx = this.canvas.getContext('2d', { alpha: false });

    this.buffer = document.createElement('canvas');
    this.buffer.width = WIDTH;
    this.buffer.height = HEIGHT;
    this.bctx = this.buffer.getContext('2d');
    this.bctx.imageSmoothingEnabled = false;

    // Second buffer for post effects (scanline wave).
    this.post = document.createElement('canvas');
    this.post.width = WIDTH;
    this.post.height = HEIGHT;
    this.pctx = this.post.getContext('2d');

    this.scale = 1;
    this.ox = 0;
    this.oy = 0;
    this.letterbox = '#000000';
    this.resize = this.resize.bind(this);
    window.addEventListener('resize', this.resize);
    window.visualViewport?.addEventListener('resize', this.resize);
    this.resize();
  }

  resize() {
    const dpr = window.devicePixelRatio || 1;
    const cssW = window.innerWidth;
    const cssH = window.innerHeight;
    const devW = Math.round(cssW * dpr);
    const devH = Math.round(cssH * dpr);
    this.canvas.width = devW;
    this.canvas.height = devH;
    this.canvas.style.width = `${cssW}px`;
    this.canvas.style.height = `${cssH}px`;
    const fit = Math.min(devW / WIDTH, devH / HEIGHT);
    const whole = Math.floor(fit);
    this.scale = whole >= 1 && whole / fit >= 0.8 ? whole : fit;
    this.drawW = Math.round(WIDTH * this.scale);
    this.drawH = Math.round(HEIGHT * this.scale);
    this.ox = Math.floor((devW - this.drawW) / 2);
    this.oy = Math.floor((devH - this.drawH) / 2);
    this.dpr = dpr;
    this.ctx.imageSmoothingEnabled = false;
  }

  // Client (CSS pixel) coordinates -> game pixel coordinates (may be outside 0..W/H).
  toGame(clientX, clientY) {
    const rect = this.canvas.getBoundingClientRect();
    const dx = (clientX - rect.left) * this.dpr;
    const dy = (clientY - rect.top) * this.dpr;
    return { x: (dx - this.ox) / this.scale, y: (dy - this.oy) / this.scale };
  }

  // Game pixel -> client (CSS pixel) coordinates. Used by tests.
  toClient(x, y) {
    const rect = this.canvas.getBoundingClientRect();
    return { x: rect.left + (this.ox + x * this.scale) / this.dpr, y: rect.top + (this.oy + y * this.scale) / this.dpr };
  }

  // fx: { wave: {amp, freq, phase} } post-processing handled here; color
  // effects are applied to the buffer by effects.js before present.
  present(wave) {
    const ctx = this.ctx;
    ctx.imageSmoothingEnabled = false;
    ctx.fillStyle = this.letterbox;
    ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    if (wave && wave.amp > 0) {
      // Per-scanline horizontal offset, like SNES HDMA wobble.
      const p = this.pctx;
      p.clearRect(0, 0, WIDTH, HEIGHT);
      for (let y = 0; y < HEIGHT; y++) {
        const off = Math.round(Math.sin(y * wave.freq + wave.phase) * wave.amp);
        p.drawImage(this.buffer, 0, y, WIDTH, 1, off, y, WIDTH, 1);
      }
      ctx.drawImage(this.post, 0, 0, WIDTH, HEIGHT, this.ox, this.oy, this.drawW, this.drawH);
    } else {
      ctx.drawImage(this.buffer, 0, 0, WIDTH, HEIGHT, this.ox, this.oy, this.drawW, this.drawH);
    }
  }
}
