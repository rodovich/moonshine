// Sound effect definitions. Each effect is a list of layers (format in synth.js playLayers):
//   tone:  an oscillator with an optional pitch sweep
//   noise: filtered noise with an optional filter sweep
//   notes: a few notes on one of the music instruments
// Effect options:
//   gain   overall level           echo    send to the SFX echo (0..1)
//   jitter random pitch spread in cents, so repeated sounds don't machine-gun
//   mono   a new instance cuts off the previous one
//   duck   dip the music to this level (0..1) while the effect plays; duckFor sets how long (s)
// `layers` may be a function returning layers, called on every play (for randomized sounds).
// Loops (ambience, running water, ticking) have `loop` instead of `layers`; see sfx-world.js.
// Footsteps, puzzle sounds, ambience, and the Wrongness's sounds are in sfx-world.js.

import { WORLD_SFX } from './sfx-world.js';

const UI_SFX = {
  // Dialog text, one per letter or two. Bright, short, square-ish.
  blip: {
    mono: true, jitter: 12, gain: 1.5,
    layers: [{ type: 'tone', wave: 'pulse25', freq: 'F#5', dur: 0.032, gain: 0.16, filter: { freq: 3200 } }],
  },
  // Cheryl's narration and inner voice: lower, rounder, slightly uneven, like a thought.
  blip_cheryl: {
    mono: true, jitter: 45, gain: 0.9,
    layers: [{ type: 'tone', wave: 'ocarina', freq: ['D5', 'C#5'], dur: 0.05, gain: 0.26, env: { a: 0.006, d: 0.045, s: 0, r: 0.02 } }],
  },
  // Walking into something solid.
  bump: {
    mono: true, gain: 0.8,
    layers: [
      { type: 'tone', wave: 'triangle', freq: [110, 70], dur: 0.08, gain: 0.28 },
      { type: 'noise', dur: 0.03, gain: 0.07, filter: { type: 'lowpass', freq: 700 } },
    ],
  },
  // Interact / confirm: two quick rising notes.
  confirm: {
    gain: 1.6, echo: 0.15,
    layers: [
      { type: 'tone', wave: 'pulse25', freq: 'B5', dur: 0.045, gain: 0.14, filter: { freq: 4000 } },
      { type: 'tone', wave: 'pulse25', freq: 'E6', at: 0.05, dur: 0.09, gain: 0.14, filter: { freq: 4000 } },
    ],
  },
  // Cancel / back: two falling notes, duller.
  cancel: {
    gain: 0.9,
    layers: [
      { type: 'tone', wave: 'triangle', freq: 'E5', dur: 0.045, gain: 0.3 },
      { type: 'tone', wave: 'triangle', freq: 'A4', at: 0.05, dur: 0.08, gain: 0.3 },
    ],
  },
  // Moving a menu cursor: the smallest tick.
  cursor: {
    mono: true, gain: 1,
    layers: [{ type: 'tone', wave: 'pulse25', freq: 'A6', dur: 0.016, gain: 0.12, filter: { freq: 4500 } }],
  },
  // Giving an item to someone: a gentle downward pair on the harp, and a little rustle.
  give: {
    gain: 0.7, echo: 0.2,
    layers: [
      { type: 'noise', dur: 0.14, gain: 0.05, filter: { type: 'bandpass', freq: [1600, 600], q: 1.2 }, env: { a: 0.04, d: 0.1, s: 0, r: 0.03 } },
      { type: 'notes', inst: 'harp', notes: [['C6', 0.04, 0.3, 0.7], ['F5', 0.13, 0.6, 0.8]] },
    ],
  },
  // Menu opens: a quick upward harp run with a breath of air.
  menu_open: {
    gain: 0.5, echo: 0.2,
    layers: [
      { type: 'notes', inst: 'harp', gain: 0.8, notes: [['C5', 0, 0.2, 0.6], ['E5', 0.025, 0.2, 0.65], ['G5', 0.05, 0.2, 0.7], ['C6', 0.075, 0.35, 0.8]] },
      { type: 'noise', dur: 0.12, gain: 0.05, filter: { type: 'bandpass', freq: [1200, 5000], q: 1.5 }, env: { a: 0.06, d: 0.06, s: 0, r: 0.03 } },
    ],
  },
  // Menu closes: the same run, downward and shorter.
  menu_close: {
    gain: 0.55, echo: 0.15,
    layers: [
      { type: 'notes', inst: 'harp', gain: 0.75, notes: [['G5', 0, 0.15, 0.7], ['E5', 0.025, 0.15, 0.65], ['C5', 0.05, 0.25, 0.6]] },
      { type: 'noise', dur: 0.1, gain: 0.045, filter: { type: 'bandpass', freq: [4500, 1200], q: 1.5 }, env: { a: 0.04, d: 0.06, s: 0, r: 0.03 } },
    ],
  },
  // Item get: a short fanfare on the rhyme's opening (C–F–A–C, Cheryl's home phrase), ending on the home chord.
  item_get: {
    gain: 0.6, echo: 0.35, duck: 0.15, duckFor: 1.3,
    layers: [
      { type: 'notes', inst: 'vibes', notes: [['C5', 0, 0.1], ['F5', 0.1, 0.1], ['A5', 0.2, 0.1], ['C6', 0.3, 0.14, 0.9], ['A5', 0.44, 0.1, 0.7], ['C6', 0.54, 1.0, 1]] },
      { type: 'notes', inst: 'harp', gain: 0.8, notes: [['F4', 0.54, 0.9], ['A4', 0.56, 0.9], ['C5', 0.58, 0.9], ['F5', 0.6, 0.9]] },
      { type: 'notes', inst: 'bass', gain: 0.8, notes: [['C3', 0.3, 0.2], ['F2', 0.54, 0.6]] },
      { type: 'noise', at: 0.54, dur: 0.5, gain: 0.04, filter: { type: 'highpass', freq: 9000 }, env: { a: 0.01, d: 0.5, s: 0, r: 0.1 } },
    ],
  },
  // A wooden door: a short creak, then the latch and thump.
  door: {
    gain: 0.65,
    layers: [
      { type: 'tone', wave: 'sawtooth', freq: [95, 130], sweep: 0.28, curve: 'linear', dur: 0.28, gain: 0.12,
        vibrato: { rate: 23, depth: 90 }, filter: { type: 'bandpass', freq: 900, q: 3 }, env: { a: 0.05, d: 0.3, s: 0.8, r: 0.04 } },
      { type: 'tone', wave: 'triangle', freq: 'C6', at: 0.3, dur: 0.02, gain: 0.15 },
      { type: 'tone', wave: 'sine', freq: [120, 55], at: 0.32, dur: 0.16, gain: 0.6 },
      { type: 'noise', at: 0.32, dur: 0.08, gain: 0.2, filter: { type: 'lowpass', freq: 600 } },
    ],
  },
  // Something going into water, with a couple of bubbles.
  splash: {
    gain: 1.4, echo: 0.2,
    layers: [
      { type: 'noise', dur: 0.4, gain: 0.32, filter: { type: 'bandpass', freq: [3500, 500], q: 0.9, time: 0.35 }, env: { a: 0.004, d: 0.3, s: 0, r: 0.1 } },
      { type: 'noise', dur: 0.6, gain: 0.07, filter: { type: 'highpass', freq: 5000 }, env: { a: 0.02, d: 0.5, s: 0, r: 0.1 } },
      { type: 'tone', wave: 'sine', freq: [300, 900], at: 0.12, dur: 0.06, gain: 0.12 },
      { type: 'tone', wave: 'sine', freq: [420, 1100], at: 0.24, dur: 0.05, gain: 0.08 },
    ],
  },
  // The Wrongness: the home chord (F A C) rings out on bells, then each note slips flat at its own
  // rate while a low drone sags beneath it. Something you can't name has gone out of tune.
  wrong_sting: {
    gain: 0.7, echo: 0.5, duck: 0.1, duckFor: 2.4,
    layers: [
      { type: 'notes', inst: 'bell', notes: [['F5', 0, 2.4, 0.8, -45], ['A5', 0.04, 2.4, 0.7, -110], ['C6', 0.08, 2.4, 0.7, -70]] },
      { type: 'notes', inst: 'wrongpad', gain: 0.9, notes: [['F3', 0, 2.2, 0.9, -60]] },
      { type: 'tone', wave: 'sine', freq: ['F2', 'E2'], sweep: 2.2, dur: 2.2, gain: 0.35, vibrato: { rate: 0.9, depth: 25 }, env: { a: 0.4, d: 1, s: 1, r: 0.6 } },
      { type: 'noise', dur: 0.9, gain: 0.06, filter: { type: 'bandpass', freq: [600, 3000], q: 4, time: 0.9 }, env: { a: 0.85, d: 0.1, s: 0, r: 0.08 } },
    ],
  },
};

export const SFX = { ...UI_SFX, ...WORLD_SFX };
