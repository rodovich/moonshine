// Offline rendering for checks and tools (the dev page and Playwright tests). Not used by the game.
// Renders through the same graph as live play, at full volume settings (the loudest a player
// can make it), so the numbers are the worst case for clipping.

import { buildGraph, getCompiledSong, startSfx } from './index.js';
import { MusicTrack } from './player.js';
import { SONGS } from './music/index.js';

function makeCtx(seconds, sampleRate) {
  return new OfflineAudioContext(2, Math.ceil(seconds * sampleRate), sampleRate);
}

/** Render `seconds` of a music track (from its start, through the loop point if long enough). */
export async function renderMusic(id, seconds, { sampleRate = 44100, limiter = true } = {}) {
  const ctx = makeCtx(seconds, sampleRate);
  const graph = buildGraph(ctx, { limiter });
  const track = new MusicTrack(ctx, SONGS[id], getCompiledSong(id), graph.music);
  track.start(0.05);
  track.schedule(seconds);
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
