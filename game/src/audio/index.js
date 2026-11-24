// Public audio API for the game. See README.md in this directory.

import { compileSong } from './sequencer.js';
import { MusicTrack } from './player.js';
import { playLayers, makeEcho } from './synth.js';
import { SONGS } from './music/index.js';
import { SFX } from './sfx.js';

const LOOKAHEAD = 0.3; // seconds of notes scheduled ahead of the clock
const TICK_MS = 50;
const MAX_SFX = 3; // simultaneous sound effects; with ≤6 music channels this keeps us near 8 voices
const STORE_KEY = 'moonshine.audio';

// Soft clipper: exactly linear up to 0.7 (-3 dBFS), then bends smoothly toward ±1.
// Used instead of DynamicsCompressor, which adds automatic makeup gain and pumps.
let clipCurve = null;
function softClipCurve() {
  if (clipCurve) return clipCurve;
  const n = 4096;
  const knee = 0.7;
  clipCurve = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    const x = (i / (n - 1)) * 2 - 1;
    const a = Math.abs(x);
    const y = a <= knee ? a : knee + (1 - knee) * Math.tanh((a - knee) / (1 - knee));
    clipCurve[i] = Math.sign(x) * y;
  }
  return clipCurve;
}

/**
 * The master chain: music (→ duck) and SFX buses → master volume → gentle lowpass (the SNES's
 * output was soft on top) → soft clipper as a safety net. Exported so the offline renderer
 * builds the same mix. With { limiter: false } the clipper is left out, to measure the raw mix.
 */
export function buildGraph(ctx, { limiter = true } = {}) {
  const music = ctx.createGain();
  const musicDuck = ctx.createGain(); // dips the music under jingles and stings
  const sfxBus = ctx.createGain();
  const master = ctx.createGain();
  const tone = ctx.createBiquadFilter();
  tone.type = 'lowpass';
  tone.frequency.value = 11000;
  tone.Q.value = 0.5;
  music.connect(musicDuck);
  musicDuck.connect(master);
  sfxBus.connect(master);
  master.connect(tone);
  if (limiter) {
    const clip = ctx.createWaveShaper();
    clip.curve = softClipCurve();
    tone.connect(clip);
    clip.connect(ctx.destination);
  } else {
    tone.connect(ctx.destination);
  }
  const sfxEcho = makeEcho(ctx, { delay: 0.18, feedback: 0.3, wet: 0.35, lowpass: 2600, spread: 0.02 }, sfxBus);
  return { music, musicDuck, sfx: sfxBus, master, sfxEcho };
}

const compiled = new Map();
/** Compiled form of a song (cached). Throws if the id is unknown or the data is bad. */
export function getCompiledSong(id) {
  if (!compiled.has(id)) {
    const song = SONGS[id];
    if (!song) throw new Error(`unknown music "${id}"`);
    compiled.set(id, compileSong(song));
  }
  return compiled.get(id);
}

/** Start one sound effect at context time `when` on the given graph. Returns the voice. */
export function startSfx(ctx, graph, id, when, opts = {}) {
  const def = SFX[id];
  if (!def) throw new Error(`unknown sfx "${id}"`);
  const g = ctx.createGain();
  g.gain.value = (def.gain ?? 1) * (opts.volume ?? 1);
  g.connect(graph.sfx);
  let send = null;
  if (def.echo) {
    send = ctx.createGain();
    send.gain.value = def.echo;
    g.connect(send);
    send.connect(graph.sfxEcho.input);
  }
  const j = def.jitter ?? 0;
  const cents = (opts.pitch ?? 0) * 100 + (j ? (Math.random() * 2 - 1) * j : 0);
  const voice = playLayers(ctx, def.layers, when, { dest: g, pitch: Math.pow(2, cents / 1200) });
  if (def.duck !== undefined) {
    // Dip the music so jingles and stings don't clash with it, then bring it back.
    const p = graph.musicDuck.gain;
    const hold = when + (def.duckFor ?? Math.max(0.1, voice.end - when - 0.6));
    p.cancelScheduledValues(when);
    p.setValueAtTime(p.value, when);
    p.linearRampToValueAtTime(def.duck, when + 0.05);
    p.setValueAtTime(def.duck, hold);
    p.linearRampToValueAtTime(1, hold + 0.8);
  }
  const disconnectAfter = voice.end - ctx.currentTime + 0.2;
  if (!('startRendering' in ctx)) { // live context: free the nodes once the effect is over
    setTimeout(() => { g.disconnect(); if (send) send.disconnect(); }, disconnectAfter * 1000);
  }
  return voice;
}

// ---- Live state ----

let ctx = null;
let graph = null;
let timer = null;
let current = null; // { id, track }
const fading = new Set(); // tracks fading out
let cue = null; // { track, resume, ducked (the track it interrupted), ended }
let pendingMusic = null;
let wrongness = 0;
const activeSfx = []; // { id, voice }
const settings = loadSettings();

function loadSettings() {
  const s = { master: 0.8, music: 0.8, sfx: 0.9, muted: false };
  try {
    Object.assign(s, JSON.parse(globalThis.localStorage?.getItem(STORE_KEY) || '{}'));
  } catch { /* ignore bad or missing storage */ }
  return s;
}

function saveSettings() {
  try { globalThis.localStorage?.setItem(STORE_KEY, JSON.stringify(settings)); } catch { /* ignore */ }
}

function applyLevels(rampSec = 0.05) {
  if (!ctx) return;
  const now = ctx.currentTime;
  const set = (param, v) => { param.cancelScheduledValues(now); param.setValueAtTime(param.value, now); param.linearRampToValueAtTime(v, now + rampSec); };
  // Squared so the sliders feel even to the ear.
  set(graph.master.gain, settings.muted ? 0 : settings.master ** 2);
  set(graph.music.gain, settings.music ** 2);
  set(graph.sfx.gain, settings.sfx ** 2);
}

function tick() {
  const until = ctx.currentTime + LOOKAHEAD;
  if (current) current.track.schedule(until);
  if (cue) cue.track.schedule(until);
  for (const t of fading) {
    if (ctx.currentTime > t.stopAt + 0.5) { t.dispose(); fading.delete(t); } else t.schedule(until);
  }
  if (cue && ctx.currentTime > cue.track.endTime + 0.05 && !cue.ended) endCue();
}

/**
 * Create and resume the audio context. Call from the first user input event (key, click, tap),
 * since browsers only allow audio to start then. Safe to call more than once.
 */
export async function initAudio() {
  if (!ctx) {
    const AC = globalThis.AudioContext || globalThis.webkitAudioContext;
    if (!AC) return false;
    ctx = new AC({ latencyHint: 'interactive' });
    graph = buildGraph(ctx);
    applyLevels(0);
    timer = setInterval(tick, TICK_MS);
    // Suspend while the tab is hidden so the timer's throttling can't cause stutters.
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) ctx.suspend(); else ctx.resume();
    });
  }
  if (ctx.state !== 'running') await ctx.resume();
  if (pendingMusic) {
    const { id, opts } = pendingMusic;
    pendingMusic = null;
    playMusic(id, { ...opts, fadeMs: 0 });
  }
  return true;
}

/** True once initAudio() has run and the context is running. */
export function audioReady() {
  return !!ctx && ctx.state === 'running';
}

/**
 * Play a music track, crossfading from whatever is playing over `fadeMs`.
 * Asking for the track that's already playing does nothing. Before initAudio(), the request is
 * remembered and starts as soon as audio is ready.
 */
export function playMusic(id, { fadeMs = 800 } = {}) {
  getCompiledSong(id); // validate early
  if (!ctx) { pendingMusic = { id, opts: { fadeMs } }; return; }
  if (cue) cue.ducked = null; // the new request takes over from whatever the cue interrupted
  if (current && current.id === id) {
    current.track.setDuck(1, ctx.currentTime, fadeMs / 1000);
    return;
  }
  const now = ctx.currentTime;
  const fadeSec = fadeMs / 1000;
  if (current) {
    current.track.stop(now, fadeSec);
    fading.add(current.track);
  }
  const track = new MusicTrack(ctx, SONGS[id], getCompiledSong(id), graph.music, () => wrongness);
  track.start(now + 0.05, current ? fadeSec : 0);
  current = { id, track };
  track.schedule(ctx.currentTime + LOOKAHEAD);
}

/** Fade the current music out over `fadeMs` (0 stops it at once). */
export function stopMusic(fadeMs = 800) {
  pendingMusic = null;
  if (!ctx || !current) return;
  current.track.stop(ctx.currentTime, fadeMs / 1000);
  fading.add(current.track);
  current = null;
}

/** Id of the music track playing (or requested before init), or null. */
export function currentMusic() {
  return current?.id ?? pendingMusic?.id ?? null;
}

/**
 * Interrupt with a one-shot cue (such as 'wrongness'): the current music dips out, the cue plays,
 * and the music comes back. With { resume: false } the music stays stopped after the cue.
 */
export function playCue(id, { resume = true } = {}) {
  const c = getCompiledSong(id);
  if (c.loopSteps) throw new Error(`"${id}" loops; playCue needs a one-shot piece`);
  if (!ctx) return;
  const now = ctx.currentTime;
  if (cue) { cue.track.stop(now, 0.2); fading.add(cue.track); }
  if (current) current.track.setDuck(0, now, 0.15);
  const track = new MusicTrack(ctx, SONGS[id], c, graph.music, () => 0);
  track.start(now + 0.03, 0);
  track.schedule(now + LOOKAHEAD);
  cue = { track, resume, ducked: current?.track ?? null, ended: false };
}

function endCue() {
  cue.ended = true;
  fading.add(cue.track);
  cue.track.stopAt = cue.track.endTime + 6; // let the echo ring out before disposal
  if (cue.ducked && cue.ducked === current?.track) {
    if (cue.resume) current.track.setDuck(1, ctx.currentTime, 1.5);
    else stopMusic(0);
  }
  cue = null;
}

/**
 * Play a sound effect. opts: { pitch (semitones), volume (0..1) }.
 * Effects marked `mono` cut off their own previous instance (text blips, footsteps).
 */
export function sfx(id, opts = {}) {
  if (!SFX[id]) throw new Error(`unknown sfx "${id}"`);
  if (!ctx || ctx.state !== 'running') return;
  const now = ctx.currentTime;
  for (let i = activeSfx.length - 1; i >= 0; i--) {
    if (activeSfx[i].voice.end < now) activeSfx.splice(i, 1);
  }
  if (SFX[id].mono) {
    for (let i = activeSfx.length - 1; i >= 0; i--) {
      if (activeSfx[i].id === id) { activeSfx[i].voice.choke(now); activeSfx.splice(i, 1); }
    }
  }
  while (activeSfx.length >= MAX_SFX) activeSfx.shift().voice.choke(now);
  const voice = startSfx(ctx, graph, id, now + 0.005, opts);
  activeSfx.push({ id, voice });
}

/** Set 'master', 'music', or 'sfx' volume, 0..1. Saved in localStorage. */
export function setVolume(kind, v) {
  if (!(kind in settings) || kind === 'muted') throw new Error(`unknown volume "${kind}"`);
  settings[kind] = Math.min(1, Math.max(0, v));
  saveSettings();
  applyLevels();
}

export function getVolume(kind) {
  return settings[kind];
}

/** Mute or unmute everything. Saved in localStorage. */
export function setMuted(m) {
  settings.muted = !!m;
  saveSettings();
  applyLevels();
}

export function isMuted() {
  return settings.muted;
}

/**
 * How far the Wrongness has crept into the music, 0..1. Above 0, notes drift slightly out of
 * tune and some sag flat. Applies to notes scheduled from now on.
 */
export function setWrongness(amount) {
  wrongness = Math.min(1, Math.max(0, amount));
}

export const MUSIC_IDS = Object.keys(SONGS);
export const SFX_IDS = Object.keys(SFX);
