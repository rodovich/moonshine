// Offline rendering for checks and tools (the dev page and Playwright tests). Not used by the game.
// Renders through the same graph as live play, at full volume settings (the loudest a player
// can make it), so the numbers are the worst case for clipping.

import { buildGraph, getCompiledSong, startSfx, startLoopOn } from './index.js';
import { MusicTrack } from './player.js';
import { compileSong } from './sequencer.js';
import { SONGS } from './music/index.js';

function makeCtx(seconds, sampleRate) {
  return new OfflineAudioContext(2, Math.ceil(seconds * sampleRate), sampleRate);
}

/**
 * Render `seconds` of a music track (from its start, through the loop point if long enough).
 * With windDownAt, the track runs down (windDownMusic) at that time over windDownSec.
 */
export async function renderMusic(id, seconds, { sampleRate = 44100, limiter = true, windDownAt = null, windDownSec = 4 } = {}) {
  const ctx = makeCtx(seconds, sampleRate);
  const graph = buildGraph(ctx, { limiter });
  const track = new MusicTrack(ctx, SONGS[id], getCompiledSong(id), graph.music);
  track.start(0.05);
  if (windDownAt !== null) {
    track.schedule(windDownAt);
    track.windDown(windDownSec);
  }
  track.schedule(seconds);
  return ctx.startRendering();
}

/**
 * Render one pass of one pattern with a single channel playing and no echo (or every channel,
 * if channelId is null), for measuring the balance between voices.
 */
export async function renderPatternSolo(id, pattern, channelId, { sampleRate = 22050 } = {}) {
  const song = SONGS[id];
  const solo = {
    ...song,
    echo: { ...song.echo, wet: 0 },
    channels: song.channels.map((c) => ({ ...c, vol: channelId === null || c.id === channelId ? c.vol : 0 })),
    intro: [pattern],
    loop: null,
  };
  const c = compileSong(solo);
  const ctx = makeCtx(c.introSeconds + 0.5, sampleRate);
  const graph = buildGraph(ctx, { limiter: false });
  const track = new MusicTrack(ctx, solo, c, graph.music);
  track.start(0);
  track.schedule(c.introSeconds + 1);
  return ctx.startRendering();
}

/** Render a looping effect for `seconds`, stopping it half a second before the end. */
export async function renderLoop(id, seconds = 6, { sampleRate = 44100, limiter = true } = {}) {
  const ctx = makeCtx(seconds, sampleRate);
  const graph = buildGraph(ctx, { limiter });
  const h = startLoopOn(ctx, graph, id, 0.02, 0.3);
  h.schedule(seconds);
  h.stop(seconds - 0.5, 0.2);
  return ctx.startRendering();
}

/** Render one sound effect. */
export async function renderSfx(id, seconds = 3, { sampleRate = 44100, limiter = true } = {}) {
  const ctx = makeCtx(seconds, sampleRate);
  const graph = buildGraph(ctx, { limiter });
  startSfx(ctx, graph, id, 0.02);
  return ctx.startRendering();
}

const db = (x) => (x > 0 ? 20 * Math.log10(x) : -Infinity);

/**
 * Levels of a rendered buffer: peak and RMS (dBFS), the loudest 300 ms window, the number of
 * samples at or above full scale, and when the sound falls below -60 dB for good.
 */
export function analyze(buffer) {
  let peak = 0;
  let sum = 0;
  let clipped = 0;
  let lastLoud = 0;
  const n = buffer.length;
  const win = Math.floor(buffer.sampleRate * 0.3);
  const winSums = new Float64Array(Math.ceil(n / win));
  for (let ch = 0; ch < buffer.numberOfChannels; ch++) {
    const d = buffer.getChannelData(ch);
    for (let i = 0; i < n; i++) {
      const a = Math.abs(d[i]);
      if (a > peak) peak = a;
      if (a >= 0.999) clipped++;
      if (a > 0.001 && i > lastLoud) lastLoud = i;
      sum += d[i] * d[i];
      winSums[Math.floor(i / win)] += d[i] * d[i];
    }
  }
  const rms = Math.sqrt(sum / (n * buffer.numberOfChannels));
  let loudest = 0;
  for (const s of winSums) loudest = Math.max(loudest, Math.sqrt(s / (win * buffer.numberOfChannels)));
  return {
    seconds: n / buffer.sampleRate,
    peakDb: db(peak),
    rmsDb: db(rms),
    loudestWindowDb: db(loudest),
    clipped,
    soundUntil: lastLoud / buffer.sampleRate,
  };
}

// ---- Spectrum ----

function fft(re, im) {
  const n = re.length;
  for (let i = 1, j = 0; i < n; i++) {
    let bit = n >> 1;
    for (; j & bit; bit >>= 1) j ^= bit;
    j ^= bit;
    if (i < j) { [re[i], re[j]] = [re[j], re[i]]; [im[i], im[j]] = [im[j], im[i]]; }
  }
  for (let len = 2; len <= n; len <<= 1) {
    const ang = (-2 * Math.PI) / len;
    const wr = Math.cos(ang);
    const wi = Math.sin(ang);
    for (let i = 0; i < n; i += len) {
      let cr = 1;
      let ci = 0;
      for (let k = 0; k < len / 2; k++) {
        const a = i + k;
        const b = a + len / 2;
        const tr = re[b] * cr - im[b] * ci;
        const ti = re[b] * ci + im[b] * cr;
        re[b] = re[a] - tr; im[b] = im[a] - ti;
        re[a] += tr; im[a] += ti;
        const nr = cr * wr - ci * wi;
        ci = cr * wi + ci * wr;
        cr = nr;
      }
    }
  }
}

/** A-weighting gain (linear power) at frequency f: roughly how loud the ear finds it. */
function aWeightPower(f) {
  const f2 = f * f;
  const ra = (12194 ** 2 * f2 * f2) / ((f2 + 20.6 ** 2) * Math.sqrt((f2 + 107.7 ** 2) * (f2 + 737.9 ** 2)) * (f2 + 12194 ** 2));
  return (ra * 1.2589) ** 2; // +2 dB normalizes 1 kHz to 0 dB
}

export const BANDS = [
  ['sub', 20, 60], ['bass', 60, 200], ['lowmid', 200, 500], ['mid', 500, 2000], ['presence', 2000, 6000], ['air', 6000, 20000],
];

/**
 * Average power spectrum of a buffer (mono sum, 4096-point Hann frames). Returns the share of
 * energy in each band (dB relative to the total) and an A-weighted level in dBFS, a fair
 * stand-in for loudness that doesn't let low bass notes count for more than the ear hears.
 */
export function spectrum(buffer) {
  const N = 4096;
  const sr = buffer.sampleRate;
  const chans = Array.from({ length: buffer.numberOfChannels }, (_, i) => buffer.getChannelData(i));
  const power = new Float64Array(N / 2);
  const win = Float64Array.from({ length: N }, (_, i) => 0.5 - 0.5 * Math.cos((2 * Math.PI * i) / (N - 1)));
  let frames = 0;
  for (let start = 0; start + N <= buffer.length; start += N) {
    const re = new Float64Array(N);
    const im = new Float64Array(N);
    for (let i = 0; i < N; i++) {
      let v = 0;
      for (const d of chans) v += d[start + i];
      re[i] = (v / chans.length) * win[i];
    }
    fft(re, im);
    for (let k = 0; k < N / 2; k++) power[k] += re[k] * re[k] + im[k] * im[k];
    frames++;
  }
  const bands = Object.fromEntries(BANDS.map(([name]) => [name, 0]));
  let total = 0;
  let weighted = 0;
  for (let k = 1; k < N / 2; k++) {
    const f = (k * sr) / N;
    total += power[k];
    weighted += power[k] * aWeightPower(f);
    for (const [name, lo, hi] of BANDS) if (f >= lo && f < hi) bands[name] += power[k];
  }
  const rel = Object.fromEntries(Object.entries(bands).map(([k, v]) => [k, Math.round(10 * Math.log10(v / total + 1e-12) * 10) / 10]));
  // Scale so a full-scale sine reads about 0 dB (Hann window coherent gain 0.5, N/2 bins).
  const norm = frames * (N * 0.5) ** 2 / 2;
  return { bands: rel, aWeightedDb: Math.round(10 * Math.log10(weighted / norm + 1e-20) * 10) / 10 };
}

// ---- Reports ----

function roleOf(song, pattern, ch) {
  const melody = song.patterns[pattern].melody || song.channels.find((c) => (c.role || (c.id === 'lead' ? 'melody' : '')) === 'melody')?.id;
  if (ch.id === melody) return 'melody';
  if (ch.inst === 'kit') return 'perc';
  return ch.role === 'melody' ? 'counter' : ch.role || (ch.id === 'bass' ? 'bass' : 'acc');
}

/**
 * For each section (pattern) of a song: the A-weighted level of each pitched voice played alone,
 * dry. `ok` is false if any other voice comes within `margin` dB of the melody.
 */
export async function balanceReport(id, margin = 1) {
  const song = SONGS[id];
  const order = [...new Set([...(song.intro || []), ...(song.loop || [])])];
  const out = [];
  for (const pattern of order) {
    const levels = {};
    for (const ch of song.channels) {
      const text = song.patterns[pattern][ch.id];
      if (!text || ch.inst === 'kit' || !/[A-G][#b]?-?\d/.test(text)) continue; // drums or rests only
      levels[ch.id] = spectrum(await renderPatternSolo(id, pattern, ch.id)).aWeightedDb;
    }
    const melody = song.channels.find((c) => roleOf(song, pattern, c) === 'melody' && levels[c.id] !== undefined)?.id;
    if (!melody) { out.push({ pattern, melody: null, levels, ok: true, rivals: [] }); continue; }
    const rivals = Object.entries(levels).filter(([k, v]) => k !== melody && v > levels[melody] - margin).map(([k]) => k);
    out.push({ pattern, melody, levels, ok: rivals.length === 0, rivals });
  }
  return out;
}

/** Spectrum of the whole mix over one pass of the loop (or the whole cue). */
export async function spectrumReport(id) {
  const c = getCompiledSong(id);
  const seconds = c.loopSteps ? c.introSeconds + c.loopSeconds : c.introSeconds + 3;
  return spectrum(await renderMusic(id, Math.min(seconds, 90), { limiter: false, sampleRate: 32000 }));
}
