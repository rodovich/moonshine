// Display: the game draws into a fixed-size buffer (256×224 for the SNES
// view, 640×480 for the isometric one); present() scales it onto a
// full-window canvas at an integer factor of *device* pixels, centered and
// letterboxed, with nearest-neighbor sampling.
//
// If the best integer factor would waste a lot of screen (small phones), we use
// the exact fit factor instead; pixels then vary by one device pixel, which is
// hard to see at phone pixel densities. See README.md, "Engine decisions".

export const WIDTH = 256;
export const HEIGHT = 224;

export class Display {
  // `phonePanels`: on tall phones, put dialogue and a bag button below the
  // frame (the SNES view; the isometric view keeps everything in frame).
  constructor(parent, { width = WIDTH, height = HEIGHT, phonePanels = true } = {}) {
    this.width = width;
    this.height = height;
    this.phonePanels = phonePanels;
    this.canvas = document.createElement('canvas');
    this.canvas.id = 'screen';
    parent.appendChild(this.canvas);
    this.ctx = this.canvas.getContext('2d', { alpha: false });

    this.buffer = document.createElement('canvas');
    this.buffer.width = width;
    this.buffer.height = height;
    this.bctx = this.buffer.getContext('2d');
    this.bctx.imageSmoothingEnabled = false;

    // Second buffer for post effects (scanline wave).
    this.post = document.createElement('canvas');
    this.post.width = width;
    this.post.height = height;
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
    const W = this.width;
    const H = this.height;
    const fit = Math.min(devW / W, devH / H);
    const whole = Math.floor(fit);
    this.scale = whole >= 1 && whole / fit >= 0.8 ? whole : fit;
    this.drawW = Math.round(W * this.scale);
    this.drawH = Math.round(H * this.scale);
    this.ox = Math.floor((devW - this.drawW) / 2);
    // In tall portrait screens, sit near the top and leave the space below
    // for thumbs; otherwise center.
    const portrait = this.phonePanels && devH > devW * 1.3;
    this.oy = Math.floor(((devH - this.drawH) / 2) * (portrait ? 0.4 : 1));
    // On tall portrait screens there's room below the frame for a big bag
    // button (in game pixels, below y = 224, drawn at twice the frame's scale).
    const below = (devH - this.oy - this.drawH) / this.scale;
    this.touchBar = portrait && below >= 64 ? { x: W / 2 - 24, y: H + Math.min(24, (below - 48) / 2), w: 48, h: 48 } : null;
    // On tall portrait screens, dialogue is drawn below the frame at 1.5× the
    // frame's scale (whole device pixels), so phone text is readable.
    this.dialogArea = null;
    if (portrait) {
      const k = Math.max(1, Math.round(this.scale * 1.5));
      const top = this.oy + this.drawH + Math.round(6 * this.scale);
      const w = Math.min(W, Math.floor((devW - 2 * Math.round(2 * this.scale)) / k));
      const h = 124; // label + 3-line box + up to 4 options
      if (devH - top >= h * k && w >= 160) this.dialogArea = { x: Math.floor((devW - w * k) / 2), y: top, w, h, k };
    }
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

  // Client coordinates -> pixels of the dialogue canvas below the frame.
  dialogLocal(clientX, clientY) {
    const a = this.dialogArea;
    const rect = this.canvas.getBoundingClientRect();
    return { x: ((clientX - rect.left) * this.dpr - a.x) / a.k, y: ((clientY - rect.top) * this.dpr - a.y) / a.k };
  }

  // Dialogue canvas pixels -> client coordinates (for tests).
  dialogToClient(x, y) {
    const a = this.dialogArea;
    const rect = this.canvas.getBoundingClientRect();
    return { x: rect.left + (a.x + x * a.k) / this.dpr, y: rect.top + (a.y + y * a.k) / this.dpr };
  }

  touchBarHit(p) {
    const r = this.touchBar;
    return !!r && p.x >= r.x && p.y >= r.y && p.x < r.x + r.w && p.y < r.y + r.h;
  }

  // fx: { wave: {amp, freq, phase} } post-processing handled here; color
  // effects are applied to the buffer by effects.js before present.
  // `overlay`: a canvas drawn into the touch bar's rect (below the frame).
  present(wave, overlay = null, dialog = null) {
    const ctx = this.ctx;
    ctx.imageSmoothingEnabled = false;
    ctx.fillStyle = this.letterbox;
    ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    if (wave && wave.amp > 0) {
      // Per-scanline horizontal offset, like SNES HDMA wobble.
      const p = this.pctx;
      const W = this.width;
      const H = this.height;
      const k = H / HEIGHT; // the wave is in SNES pixels; scale it to this buffer
      p.clearRect(0, 0, W, H);
      for (let y = 0; y < H; y++) {
        const off = Math.round(Math.sin((y / k) * wave.freq + wave.phase) * wave.amp * k);
        p.drawImage(this.buffer, 0, y, W, 1, off, y, W, 1);
      }
      ctx.drawImage(this.post, 0, 0, W, H, this.ox, this.oy, this.drawW, this.drawH);
    } else {
      ctx.drawImage(this.buffer, 0, 0, this.width, this.height, this.ox, this.oy, this.drawW, this.drawH);
    }
    if (dialog && this.dialogArea) {
      const a = this.dialogArea;
      this.ctx.drawImage(dialog, 0, 0, a.w, a.h, a.x, a.y, a.w * a.k, a.h * a.k);
    }
    if (overlay && this.touchBar) {
      const r = this.touchBar;
      this.ctx.drawImage(overlay, this.ox + r.x * this.scale, this.oy + r.y * this.scale, r.w * this.scale, r.h * this.scale);
    }
  }
}
