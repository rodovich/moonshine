// Voices: turns instrument definitions (instruments.js) and one-shot layer lists (drums, sound
// effects) into Web Audio nodes. Every voice is built from oscillators with hand-shaped harmonic
// spectra, an envelope, and a filter, which gives the soft, slightly muffled "sampled" sound of
// SNES instruments without any audio files.

import { pitchToMidi, midiToFreq } from './sequencer.js';
import { INSTRUMENTS } from './instruments.js';

// Harmonic amplitudes (fundamental first) for the custom waveforms.
const WAVES = {
  flute: [1, 0.32, 0.1, 0.045, 0.02, 0.01],
  ocarina: [1, 0.12, 0.05, 0.02],
  harp: [1, 0.55, 0.32, 0.2, 0.13, 0.09, 0.06, 0.04, 0.03, 0.02],
  reed: [1, 0.75, 0.6, 0.48, 0.38, 0.3, 0.22, 0.16, 0.12, 0.09, 0.07, 0.05],
  string: Array.from({ length: 24 }, (_, i) => 1 / (i + 1)),
  bass: [1, 0.6, 0.28, 0.14, 0.07, 0.035],
  guitar: [1, 0.5, 0.33, 0.22, 0.12, 0.09, 0.05, 0.035, 0.02],
  piano: [1, 0.62, 0.42, 0.3, 0.24, 0.15, 0.12, 0.08, 0.06, 0.045, 0.03, 0.02],
  marimba: [1, 0, 0, 0.22, 0, 0, 0, 0, 0, 0.05],
  vibe: [1, 0, 0, 0.35, 0, 0, 0, 0, 0, 0.08],
  choir: [1, 0.55, 0.7, 0.25, 0.12, 0.08, 0.04],
  pulse25: Array.from({ length: 20 }, (_, i) => Math.abs(Math.sin(Math.PI * (i + 1) * 0.25)) / (i + 1)),
};
const BASIC = new Set(['sine', 'square', 'sawtooth', 'triangle']);

const waveCache = new WeakMap();
function periodicWave(ctx, name) {
  let m = waveCache.get(ctx);
  if (!m) waveCache.set(ctx, (m = new Map()));
  if (!m.has(name)) {
    const h = WAVES[name];
    if (!h) throw new Error(`unknown wave "${name}"`);
    const real = new Float32Array(h.length + 1);
    const imag = new Float32Array(h.length + 1);
    h.forEach((a, i) => { imag[i + 1] = a; });
    m.set(name, ctx.createPeriodicWave(real, imag));
  }
  return m.get(name);
}

function makeOsc(ctx, wave) {
  const o = ctx.createOscillator();
  if (BASIC.has(wave)) o.type = wave;
  else o.setPeriodicWave(periodicWave(ctx, wave));
  return o;
}

const noiseCache = new WeakMap();
function noiseBuffer(ctx) {
  if (!noiseCache.has(ctx)) {
    const len = Math.floor(ctx.sampleRate * 2);
    const buf = ctx.createBuffer(1, len, ctx.sampleRate);
    const d = buf.getChannelData(0);
    // Deterministic noise so offline renders are repeatable.
    let s = 0x2545f491;
    for (let i = 0; i < len; i++) {
      s ^= s << 13; s ^= s >>> 17; s ^= s << 5;
      d[i] = ((s >>> 0) / 4294967296) * 2 - 1;
    }
    noiseCache.set(ctx, buf);
  }
  return noiseCache.get(ctx);
}

function makeNoise(ctx) {
  const n = ctx.createBufferSource();
  n.buffer = noiseBuffer(ctx);
  n.loop = true;
  return n;
}

/**
 * Attack / decay / sustain / release on an AudioParam. The gate is `dur` seconds long.
 * Returns the time when the sound has died away.
 */
function applyEnv(param, t, dur, peak, env) {
  const a = Math.min(env.a ?? 0.002, Math.max(dur * 0.9, 0.001));
  const d = env.d ?? 0.2;
  const s = env.s ?? 0;
  const r = env.r ?? 0.05;
  param.setValueAtTime(0, t);
  param.linearRampToValueAtTime(peak, t + a);
  param.setTargetAtTime(peak * s, t + a, Math.max(d, 0.001) / 3);
  const off = t + Math.max(dur, a);
  param.setTargetAtTime(0, off, Math.max(r, 0.001) / 3);
  return off + Math.max(r, 0.001) * 2.2 + 0.02;
}

function applyFilter(ctx, spec, t, keyFreq) {
  const f = ctx.createBiquadFilter();
  const top = Math.min(20000, ctx.sampleRate * 0.49); // stay under Nyquist at any sample rate
  f.type = spec.type || 'lowpass';
  f.Q.value = spec.q ?? 0.7;
  const track = spec.track ?? 0;
  const ratio = keyFreq ? Math.pow(keyFreq / 261.63, track) : 1;
  const sweep = Array.isArray(spec.freq) ? spec.freq : null;
  const base = Math.min((sweep ? sweep[1] : spec.freq) * ratio, top);
  if (sweep) {
    f.frequency.setValueAtTime(Math.min(sweep[0] * ratio, top), t);
    f.frequency.exponentialRampToValueAtTime(base, t + (spec.time ?? 0.2));
  } else if (spec.env) {
    f.frequency.setValueAtTime(Math.min(base + spec.env * ratio, top), t);
    f.frequency.setTargetAtTime(base, t, (spec.decay ?? 0.2) / 3);
  } else {
    f.frequency.value = base;
  }
  return f;
}

/** A gain node that can cut a voice off quickly (for monophonic channels and SFX retriggers). */
function makeChoke(ctx, dest) {
  const g = ctx.createGain();
  g.connect(dest);
  let choked = false;
  return {
    node: g,
    choke(at, fade = 0.012) {
      if (choked) return;
      choked = true;
      const t = Math.max(at, ctx.currentTime);
      g.gain.setValueAtTime(1, t);
      g.gain.linearRampToValueAtTime(0, t + fade);
    },
  };
}

/**
 * Play one note on an instrument.
 * opts: { time, dur, midi | freq, vel, detune (cents), bend (cents over the note), dest }
 * Returns { end, choke(time) }.
 */
export function playNote(ctx, instName, opts) {
  const inst = typeof instName === 'string' ? INSTRUMENTS[instName] : instName;
  if (!inst) throw new Error(`unknown instrument "${instName}"`);
  const t = opts.time;
  const dur = Math.max(opts.dur, 0.01);
  const vel = opts.vel ?? 0.8;
  const freq = opts.freq ?? midiToFreq(opts.midi);
  const out = makeChoke(ctx, opts.dest);

  const amp = ctx.createGain();
  let chainIn = amp;
  if (inst.filter) {
    const f = applyFilter(ctx, inst.filter, t, freq);
    amp.connect(f);
    f.connect(out.node);
  } else {
    amp.connect(out.node);
  }
  let end = applyEnv(amp.gain, t, dur, vel * (inst.gain ?? 0.5), inst.env || {});

  let lfo = null;
  let lfoGain = null;
  if (inst.vibrato) {
    lfo = ctx.createOscillator();
    lfo.frequency.value = inst.vibrato.rate ?? 5;
    lfoGain = ctx.createGain();
    const delay = inst.vibrato.delay ?? 0;
    lfoGain.gain.setValueAtTime(0, t);
    lfoGain.gain.linearRampToValueAtTime(0, t + delay);
    lfoGain.gain.linearRampToValueAtTime(inst.vibrato.depth ?? 10, t + delay + (inst.vibrato.fade ?? 0.3));
    lfo.connect(lfoGain);
  }

  const sources = [];
  const bend = (opts.bend ?? 0) + (inst.drift?.cents ?? 0);
  const bendTime = inst.drift?.time ?? dur;
  for (const o of inst.osc) {
    const osc = makeOsc(ctx, o.wave);
    osc.frequency.value = freq * (o.ratio ?? 1);
    const det = (o.detune ?? 0) + (opts.detune ?? 0);
    osc.detune.setValueAtTime(det, t);
    if (bend) osc.detune.linearRampToValueAtTime(det + bend, t + bendTime);
    if (lfoGain) lfoGain.connect(osc.detune);
    let node = osc;
    if (o.env || o.gain !== undefined) {
      const g = ctx.createGain();
      // A per-oscillator envelope shapes a partial within the main envelope (e.g. a bell's
      // upper partial dying faster); the main envelope still decides when the note ends.
      if (o.env) applyEnv(g.gain, t, dur, o.gain ?? 1, o.env);
      else g.gain.value = o.gain;
      osc.connect(g);
      node = g;
    }
    node.connect(chainIn);
    sources.push(osc);
  }

  if (inst.noise) {
    const n = makeNoise(ctx);
    const g = ctx.createGain();
    const nd = inst.noise.decay ?? 0.05;
    applyEnv(g.gain, t, nd, vel * (inst.noise.gain ?? 0.1), { a: inst.noise.a ?? 0.003, d: nd, s: inst.noise.s ?? 0, r: 0.05 });
    let nn = n;
    if (inst.noise.filter) {
      const f = applyFilter(ctx, inst.noise.filter, t, freq);
      n.connect(f);
      nn = f;
    }
    nn.connect(g);
    g.connect(out.node);
    n.start(t, Math.random() * 1.5);
    n.stop(Math.min(end, t + dur + nd + 0.5));
    sources.push(n);
  }

  for (const s of sources) {
    if (s instanceof OscillatorNode) {
      s.start(t);
      s.stop(end);
    }
  }
  if (lfo) { lfo.start(t); lfo.stop(end); }

  return {
    end,
    choke(at) {
      out.choke(at);
      const stopAt = Math.max(at, ctx.currentTime) + 0.03;
      if (stopAt < end) {
        for (const s of sources) { try { s.stop(stopAt); } catch { /* already stopped */ } }
        if (lfo) { try { lfo.stop(stopAt); } catch { /* ignore */ } }
      }
    },
  };
}

function freqOf(v) {
  return typeof v === 'string' ? midiToFreq(pitchToMidi(v)) : v;
}

/**
 * Play a list of one-shot layers (a drum hit or a sound effect). Layer kinds:
 *   { type: 'tone', wave, freq: f | [from, to], sweep, curve, path: [[sec, f], ...], dur, env, gain,
 *     at, filter, vibrato, detune }
 *   { type: 'noise', dur, env, gain, at, filter }
 *   { type: 'notes', inst, notes: [[pitch, at, dur, vel?, bendCents?, detuneCents?], ...], gain }
 * opts: { dest, vel, pitch (frequency multiplier for every layer) }
 * Returns { end, choke(time) }.
 */
export function playLayers(ctx, layers, t0, opts) {
  const out = makeChoke(ctx, opts.dest);
  const vel = opts.vel ?? 1;
  const pm = opts.pitch ?? 1;
  let end = t0;
  const sources = [];
  const voices = [];
  for (const L of layers) {
    const t = t0 + (L.at ?? 0);
    if (L.type === 'notes') {
      const g = ctx.createGain();
      g.gain.value = L.gain ?? 1;
      g.connect(out.node);
      for (const [p, at, dur, v = 0.8, bend = 0, detune = 0] of L.notes) {
        const f = freqOf(p) * pm;
        const vce = playNote(ctx, L.inst, { time: t + at, dur, freq: f, vel: v * vel, bend, detune, dest: g });
        voices.push(vce);
        end = Math.max(end, vce.end);
      }
      continue;
    }
    const dur = L.dur ?? 0.1;
    const g = ctx.createGain();
    const e = applyEnv(g.gain, t, dur, vel * (L.gain ?? 0.5), L.env || { a: 0.002, d: dur, s: 0, r: 0.02 });
    end = Math.max(end, e);
    let src;
    if (L.type === 'noise') {
      src = makeNoise(ctx);
    } else {
      src = makeOsc(ctx, L.wave || 'square');
      const f = Array.isArray(L.freq) ? L.freq.map(freqOf) : [freqOf(L.freq), freqOf(L.freq)];
      src.frequency.setValueAtTime(f[0] * pm, t);
      if (L.path) {
        // Pitch contour: [[seconds, freq], ...] after the start, ramped exponentially.
        for (const [pt, pf] of L.path) src.frequency.exponentialRampToValueAtTime(freqOf(pf) * pm, t + pt);
      } else if (f[1] !== f[0]) {
        const st = L.sweep ?? dur;
        if (L.curve === 'linear') src.frequency.linearRampToValueAtTime(f[1] * pm, t + st);
        else src.frequency.exponentialRampToValueAtTime(f[1] * pm, t + st);
      }
      if (L.vibrato) {
        const lfo = ctx.createOscillator();
        lfo.frequency.value = L.vibrato.rate;
        const lg = ctx.createGain();
        lg.gain.value = L.vibrato.depth;
        lfo.connect(lg);
        lg.connect(src.detune);
        lfo.start(t);
        lfo.stop(e);
        sources.push(lfo);
      }
      if (L.detune) src.detune.value = L.detune;
    }
    let node = src;
    if (L.filter) {
      const f = applyFilter(ctx, { ...L.filter, freq: Array.isArray(L.filter.freq) ? L.filter.freq.map((x) => x * pm) : L.filter.freq * pm, time: L.filter.time ?? dur }, t, 0);
      src.connect(f);
      node = f;
    }
    node.connect(g);
    g.connect(out.node);
    if (L.type === 'noise') src.start(t, Math.random() * 1.5);
    else src.start(t);
    src.stop(e);
    sources.push(src);
  }
  return {
    end,
    choke(at) {
      out.choke(at);
      for (const v of voices) v.choke(at);
      const stopAt = Math.max(at, ctx.currentTime) + 0.03;
      if (stopAt < end) for (const s of sources) { try { s.stop(stopAt); } catch { /* ignore */ } }
    },
  };
}

/**
 * A continuous sound for looping ambience (wind, running water, a crowd's hum).
 * spec: { type: 'noise' | 'tone', wave, freq, gain, filter: { type, freq, q },
 *         lfo: { target: 'gain' | 'filter' | 'freq', rate, depth } }
 * depth is a fraction of gain, Hz for the filter, or cents for pitch.
 * Fades in over `fadeIn` seconds from time t. Returns { stop(time, fadeSec) }.
 */
export function startBed(ctx, spec, t, dest, fadeIn = 0.3) {
  const src = spec.type === 'tone' ? makeOsc(ctx, spec.wave || 'sine') : makeNoise(ctx);
  if (spec.type === 'tone') src.frequency.value = freqOf(spec.freq);
  const g = ctx.createGain();
  const level = spec.gain ?? 0.2;
  g.gain.setValueAtTime(0, t);
  g.gain.linearRampToValueAtTime(level, t + Math.max(fadeIn, 0.005));
  let node = src;
  let filter = null;
  if (spec.filter) {
    filter = ctx.createBiquadFilter();
    filter.type = spec.filter.type || 'lowpass';
    filter.frequency.value = spec.filter.freq;
    filter.Q.value = spec.filter.q ?? 0.7;
    src.connect(filter);
    node = filter;
  }
  // The LFO adds to a separate gain so it doesn't disturb the fade automation.
  const wob = ctx.createGain();
  node.connect(wob);
  wob.connect(g);
  g.connect(dest);
  const extra = [];
  if (spec.lfo) {
    const lfo = ctx.createOscillator();
    lfo.frequency.value = spec.lfo.rate;
    const lg = ctx.createGain();
    lg.gain.value = spec.lfo.depth;
    lfo.connect(lg);
    if (spec.lfo.target === 'filter' && filter) lg.connect(filter.frequency);
    else if (spec.lfo.target === 'freq' && spec.type === 'tone') lg.connect(src.detune);
    else { wob.gain.value = 1 - spec.lfo.depth; lg.connect(wob.gain); }
    lfo.start(t);
    extra.push(lfo);
  }
  if (spec.type === 'noise') src.start(t, Math.random() * 1.5); else src.start(t);
  return {
    stop(at, fadeSec = 0.3) {
      const s = Math.max(at, ctx.currentTime);
      g.gain.cancelScheduledValues(s);
      // After the fade-in the level is known; reading .value would be wrong for future times.
      g.gain.setValueAtTime(s >= t + fadeIn ? level : g.gain.value, s);
      g.gain.linearRampToValueAtTime(0, s + Math.max(fadeSec, 0.005));
      const end = s + Math.max(fadeSec, 0.005) + 0.05;
      for (const n of [src, ...extra]) { try { n.stop(end); } catch { /* ignore */ } }
    },
  };
}

/**
 * Stereo echo in the spirit of the SNES's echo unit: two delay lines with feedback through a
 * lowpass, so repeats get darker as they fade.
 * spec: { delay (s), feedback (0..1), wet (0..1), lowpass (Hz), spread (s, extra delay on the right) }
 */
export function makeEcho(ctx, spec, dest) {
  const input = ctx.createGain();
  const wet = ctx.createGain();
  wet.gain.value = spec.wet ?? 0.3;
  const merger = ctx.createChannelMerger(2);
  const nodes = [];
  [0, 1].forEach((side) => {
    const d = ctx.createDelay(2);
    d.delayTime.value = (spec.delay ?? 0.3) + (side ? spec.spread ?? 0.02 : 0);
    const lp = ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.value = spec.lowpass ?? 3000;
    const fb = ctx.createGain();
    fb.gain.value = Math.min(spec.feedback ?? 0.35, 0.85);
    input.connect(d);
    d.connect(lp);
    lp.connect(fb);
    fb.connect(d);
    lp.connect(merger, 0, side);
    nodes.push(d, lp, fb);
  });
  merger.connect(wet);
  wet.connect(dest);
  return {
    input,
    disconnect() {
      for (const n of [input, wet, merger, ...nodes]) n.disconnect();
    },
  };
}
