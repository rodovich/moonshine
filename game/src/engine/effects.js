// Screen effects: fade, shake, tint, flicker, hue shift, and scanline wave.
// Everything is tick-based and resolves promises when a transition ends.
//
// Order of application each frame: world draws -> tint -> hue shift ->
// flicker -> fade -> (UI draws) -> wave distortion at present time.

import { WIDTH, HEIGHT } from './display.js';
import { colorOf } from './art.js';

class Tween {
  constructor(from, to, ticks, resolve) {
    this.from = from;
    this.to = to;
    this.ticks = Math.max(1, ticks);
    this.t = 0;
    this.resolve = resolve;
  }
  step() {
    this.t++;
    return this.t >= this.ticks;
  }
  get value() {
    return this.from + (this.to - this.from) * Math.min(1, this.t / this.ticks);
  }
}

const secs = (s) => Math.round((s ?? 0) * 60);

export class Effects {
  constructor() {
    this.reset();
  }

  reset() {
    this.fadeAlpha = 0;
    this.fadeColor = '#000000';
    this.tintColor = '#000000';
    this.tintAmount = 0;
    this.tintMode = 'source-over';
    this.hue = 0; // degrees
    this.waveAmp = 0;
    this.waveFreq = 0.12;
    this.waveSpeed = 0.08;
    this.wavePhase = 0;
    this.shakeAmp = 0;
    this.shakeTicks = 0;
    this.flickerTicks = 0;
    this.flickerColor = '#ffffff';
    this.flickerRate = 4;
    this.tweens = new Map();
    this.tick = 0;
    // Lighting: crossfade from `lightFrom` to `lightTo` passes as lightMix goes 0 -> 1.
    this.lightFrom = [];
    this.lightTo = [];
    this.lightMix = 1;
  }

  // Change the scene lighting (a list of { color, mode, amount } passes) over
  // `seconds`; 0 is a hard cut.
  setLight(passes, seconds = 0) {
    // Mid-crossfade, start from whichever look currently dominates.
    this.lightFrom = this.lightMix >= 0.5 ? this.lightTo : this.lightFrom;
    this.lightTo = passes;
    this.lightMix = 0;
    return this.tween('lightMix', 1, seconds);
  }

  hasLight() {
    return (this.lightTo.length && this.lightMix > 0) || (this.lightFrom.length && this.lightMix < 1);
  }

  // Draw the lighting passes over everything on `ctx`, at `strength` (0..1).
  applyLight(ctx, strength = 1) {
    const draw = (passes, k) => {
      for (const p of passes) {
        const a = (p.amount ?? 1) * k * strength;
        if (a <= 0.001) continue;
        ctx.save();
        ctx.globalCompositeOperation = p.mode || 'source-over';
        ctx.globalAlpha = Math.min(1, a);
        ctx.fillStyle = colorOf(p.color);
        ctx.fillRect(0, 0, WIDTH, HEIGHT);
        ctx.restore();
      }
    };
    draw(this.lightFrom, 1 - this.lightMix);
    draw(this.lightTo, this.lightMix);
  }

  // Animate numeric property `key` to `to` over `seconds`. Resolves at the end.
  tween(key, to, seconds) {
    const prev = this.tweens.get(key);
    if (prev) prev.resolve();
    return new Promise((resolve) => {
      const ticks = secs(seconds);
      if (ticks <= 0) {
        this[key] = to;
        this.tweens.delete(key);
        resolve();
        return;
      }
      this.tweens.set(key, new Tween(this[key], to, ticks, resolve));
    });
  }

  fade(to, seconds = 0.4, color) {
    if (color) this.fadeColor = colorOf(color);
    const alpha = to === 'out' ? 1 : to === 'in' ? 0 : Number(to);
    return this.tween('fadeAlpha', alpha, seconds);
  }

  // A new shake replaces one in progress; the earlier promise resolves then.
  shake(amount = 3, seconds = 0.4) {
    this.shakeDone?.();
    this.shakeDone = null;
    const ticks = secs(seconds);
    if (ticks <= 0) {
      this.shakeAmp = 0;
      this.shakeTicks = 0;
      return Promise.resolve();
    }
    this.shakeAmp = amount;
    this.shakeTicks = ticks;
    return new Promise((resolve) => { this.shakeDone = resolve; });
  }

  // mode is a canvas composite operation: 'source-over' (wash), 'multiply'
  // (darken), 'screen' (lighten), 'color', 'hue', 'saturation', 'difference'.
  tint(color, amount = 0.5, seconds = 0.5, mode = 'source-over') {
    if (color) this.tintColor = colorOf(color);
    this.tintMode = mode;
    return this.tween('tintAmount', amount, seconds);
  }

  hueShift(degrees, seconds = 0.5) {
    return this.tween('hue', degrees, seconds);
  }

  wave(amplitude = 2, seconds = 0.5, { freq, speed } = {}) {
    if (freq != null) this.waveFreq = freq;
    if (speed != null) this.waveSpeed = speed;
    return this.tween('waveAmp', amplitude, seconds);
  }

  flicker(seconds = 0.5, { color, rate } = {}) {
    if (color) this.flickerColor = colorOf(color);
    if (rate) this.flickerRate = rate;
    this.flickerDone?.();
    this.flickerDone = null;
    this.flickerTicks = secs(seconds);
    if (this.flickerTicks <= 0) return Promise.resolve();
    return new Promise((resolve) => { this.flickerDone = resolve; });
  }

  async clear(seconds = 0.3) {
    await Promise.all([
      this.tween('tintAmount', 0, seconds),
      this.tween('hue', 0, seconds),
      this.tween('waveAmp', 0, seconds),
    ]);
  }

  update() {
    this.tick++;
    for (const [key, tw] of this.tweens) {
      const done = tw.step();
      this[key] = tw.value;
      if (done) {
        this.tweens.delete(key);
        tw.resolve();
      }
    }
    if (this.shakeTicks > 0 && --this.shakeTicks === 0) {
      this.shakeAmp = 0;
      this.shakeDone?.();
      this.shakeDone = null;
    }
    if (this.flickerTicks > 0 && --this.flickerTicks === 0) {
      this.flickerDone?.();
      this.flickerDone = null;
    }
    this.wavePhase += this.waveSpeed;
  }

  shakeOffset() {
    if (!this.shakeAmp) return [0, 0];
    const a = this.shakeAmp * Math.min(1, this.shakeTicks / 10 + 0.3);
    return [Math.round((Math.random() * 2 - 1) * a), Math.round((Math.random() * 2 - 1) * a)];
  }

  // Effects on the world image (before UI).
  applyWorld(ctx) {
    if (this.tintAmount > 0.001) {
      ctx.save();
      ctx.globalCompositeOperation = this.tintMode;
      ctx.globalAlpha = Math.min(1, this.tintAmount);
      ctx.fillStyle = this.tintColor;
      ctx.fillRect(0, 0, WIDTH, HEIGHT);
      ctx.restore();
    }
    if (Math.abs(this.hue) > 0.5) applyHue(ctx, this.hue);
    if (this.flickerTicks > 0 && Math.floor(this.flickerTicks / this.flickerRate) % 2 === 0) {
      ctx.save();
      ctx.globalCompositeOperation = 'difference';
      ctx.fillStyle = this.flickerColor;
      ctx.fillRect(0, 0, WIDTH, HEIGHT);
      ctx.restore();
    }
  }

  // Fade covers the UI too, so it's applied after UI draws.
  applyFade(ctx) {
    if (this.fadeAlpha > 0.001) {
      ctx.save();
      // Quantize alpha to 8 steps, like SNES brightness levels.
      ctx.globalAlpha = Math.round(Math.min(1, this.fadeAlpha) * 8) / 8;
      ctx.fillStyle = this.fadeColor;
      ctx.fillRect(0, 0, WIDTH, HEIGHT);
      ctx.restore();
    }
  }

  waveParams() {
    return this.waveAmp > 0.05 ? { amp: this.waveAmp, freq: this.waveFreq, phase: this.wavePhase } : null;
  }
}

// Rotate hue of every pixel, then snap to 15-bit color.
function applyHue(ctx, degrees) {
  const img = ctx.getImageData(0, 0, WIDTH, HEIGHT);
  const d = img.data;
  const a = (degrees * Math.PI) / 180;
  const c = Math.cos(a);
  const s = Math.sin(a);
  // Standard luminance-preserving hue rotation matrix.
  const m = [
    0.213 + c * 0.787 - s * 0.213, 0.715 - c * 0.715 - s * 0.715, 0.072 - c * 0.072 + s * 0.928,
    0.213 - c * 0.213 + s * 0.143, 0.715 + c * 0.285 + s * 0.140, 0.072 - c * 0.072 - s * 0.283,
    0.213 - c * 0.213 - s * 0.787, 0.715 - c * 0.715 + s * 0.715, 0.072 + c * 0.928 + s * 0.072,
  ];
  for (let i = 0; i < d.length; i += 4) {
    const r = d[i], g = d[i + 1], b = d[i + 2];
    d[i] = Math.min(248, Math.max(0, m[0] * r + m[1] * g + m[2] * b)) & 0xf8;
    d[i + 1] = Math.min(248, Math.max(0, m[3] * r + m[4] * g + m[5] * b)) & 0xf8;
    d[i + 2] = Math.min(248, Math.max(0, m[6] * r + m[7] * g + m[8] * b)) & 0xf8;
  }
  ctx.putImageData(img, 0, 0);
}
