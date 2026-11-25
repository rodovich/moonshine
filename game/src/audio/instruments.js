// The instrument palette. See docs/audio-direction.md for what each one is for.
//
// Pitched instrument fields:
//   osc:     [{ wave, ratio = 1, detune = 0 (cents), gain, env }]  waves are in synth.js
//   env:     { a, d, s, r }  attack, decay time, sustain level (0..1), release time (seconds)
//   filter:  { type, freq, q, env (Hz added at note start), decay, track (key tracking 0..1) }
//   vibrato: { rate (Hz), depth (cents), delay, fade }
//   noise:   { gain, decay, filter }  breath or pick noise at the start of the note
//   drift:   { cents, time }  every note slides by this much (the Wrongness instruments)
//   gain:    overall level before velocity
// A drum kit has `kit: { name: [layers] }`; the layers use the sound-effect format (sfx.js).

export const INSTRUMENTS = {
  // Soft lead with breath and delayed vibrato. The main melody voice on the surface.
  flute: {
    osc: [{ wave: 'flute' }, { wave: 'sine', ratio: 2, detune: 4, gain: 0.08 }],
    env: { a: 0.045, d: 0.4, s: 0.78, r: 0.12 },
    filter: { freq: 2600, q: 0.5, track: 0.5 },
    vibrato: { rate: 5.2, depth: 14, delay: 0.22, fade: 0.25 },
    noise: { gain: 0.12, decay: 0.07, filter: { type: 'bandpass', freq: 2400, q: 0.9, track: 0.6 } },
    gain: 0.42,
  },
  // Rounder, hollower lead for gentle or mysterious moments.
  ocarina: {
    osc: [{ wave: 'ocarina' }],
    env: { a: 0.03, d: 0.3, s: 0.85, r: 0.1 },
    vibrato: { rate: 4.6, depth: 10, delay: 0.3, fade: 0.3 },
    noise: { gain: 0.06, decay: 0.05, filter: { type: 'bandpass', freq: 1800, q: 1, track: 0.6 } },
    gain: 0.45,
  },
  // Plucked harp / mandolin-ish. Arpeggios and broken chords.
  harp: {
    osc: [{ wave: 'harp' }, { wave: 'sine', ratio: 1, detune: 7, gain: 0.25 }],
    env: { a: 0.003, d: 1.1, s: 0, r: 0.25 },
    filter: { freq: 900, env: 3200, decay: 0.25, q: 0.8, track: 0.7 },
    noise: { gain: 0.05, decay: 0.012, filter: { type: 'highpass', freq: 3000 } },
    gain: 0.33,
  },
  // Nylon-string guitar: warm pluck, for waltz accompaniment ("oom-pah-pah").
  guitar: {
    osc: [{ wave: 'guitar' }, { wave: 'guitar', detune: 5, gain: 0.4 }],
    env: { a: 0.003, d: 0.9, s: 0, r: 0.15 },
    filter: { freq: 650, env: 2200, decay: 0.15, q: 0.7, track: 0.6 },
    noise: { gain: 0.04, decay: 0.01, filter: { type: 'bandpass', freq: 2500, q: 1 } },
    gain: 0.4,
  },
  // Music box: a steel comb. Bright tine, a high inharmonic partial, and a tiny click.
  musicbox: {
    osc: [
      { wave: 'sine' },
      { wave: 'sine', ratio: 2, gain: 0.12, env: { a: 0.001, d: 0.5, s: 0, r: 0.1 } },
      { wave: 'sine', ratio: 4.2, gain: 0.16, env: { a: 0.001, d: 0.12, s: 0, r: 0.05 } },
    ],
    env: { a: 0.001, d: 1.6, s: 0, r: 0.5 },
    noise: { gain: 0.05, decay: 0.006, filter: { type: 'highpass', freq: 5000 } },
    gain: 0.34,
  },
  // Upright piano, a bit out of the way: two slightly detuned strings, hammer thump.
  piano: {
    osc: [{ wave: 'piano', detune: -3 }, { wave: 'piano', detune: 4, gain: 0.7 }],
    env: { a: 0.002, d: 1.4, s: 0.08, r: 0.3 },
    filter: { freq: 900, env: 3500, decay: 0.35, q: 0.6, track: 0.6 },
    noise: { gain: 0.07, decay: 0.015, filter: { type: 'bandpass', freq: 1800, q: 0.8 } },
    gain: 0.3,
  },
  // Wooden mallet: marimba-like, short and warm.
  marimba: {
    osc: [{ wave: 'marimba' }],
    env: { a: 0.002, d: 0.45, s: 0, r: 0.1 },
    filter: { freq: 1800, env: 2500, decay: 0.08, track: 0.6 },
    gain: 0.45,
  },
  // Metal mallet with a slow shimmer: vibraphone-ish, for twinkles and the title.
  vibes: {
    osc: [{ wave: 'vibe' }],
    env: { a: 0.002, d: 1.8, s: 0, r: 0.5 },
    vibrato: { rate: 5.5, depth: 6, delay: 0 },
    filter: { freq: 3000, env: 3000, decay: 0.1, track: 0.4 },
    gain: 0.3,
  },
  // Glassy bell with an inharmonic partial. The underground's voice, and part of the title.
  bell: {
    osc: [
      { wave: 'sine' },
      { wave: 'sine', ratio: 2.76, gain: 0.35, env: { a: 0.001, d: 0.5, s: 0, r: 0.1 } },
      { wave: 'sine', ratio: 5.4, gain: 0.12, env: { a: 0.001, d: 0.18, s: 0, r: 0.05 } },
    ],
    env: { a: 0.002, d: 2.4, s: 0, r: 0.6 },
    gain: 0.28,
  },
  // Accordion-like reed: two slightly detuned voices. Cafe warmth on the surface.
  accordion: {
    osc: [{ wave: 'reed' }, { wave: 'reed', detune: 11, gain: 0.8 }],
    env: { a: 0.03, d: 0.3, s: 0.8, r: 0.08 },
    filter: { freq: 1700, q: 0.6, track: 0.5 },
    vibrato: { rate: 5.8, depth: 3, delay: 0 },
    gain: 0.28,
  },
  // Slow string pad (two detuned saw-like voices, filtered).
  strings: {
    osc: [{ wave: 'string', detune: -6 }, { wave: 'string', detune: 7, gain: 0.85 }],
    env: { a: 0.35, d: 1, s: 0.85, r: 0.6 },
    filter: { freq: 1300, q: 0.4, track: 0.35 },
    vibrato: { rate: 4.8, depth: 6, delay: 0.4, fade: 0.6 },
    gain: 0.2,
  },
  // Soft "ooh" pad for the underground and big moments.
  choir: {
    osc: [{ wave: 'choir', detune: -5 }, { wave: 'choir', detune: 6, gain: 0.8 }],
    env: { a: 0.25, d: 1, s: 0.9, r: 0.7 },
    filter: { type: 'lowpass', freq: 1500, q: 1.2, track: 0.3 },
    vibrato: { rate: 4.5, depth: 9, delay: 0.3, fade: 0.5 },
    gain: 0.22,
  },
  // Round fingered bass.
  bass: {
    osc: [{ wave: 'bass' }, { wave: 'sine', gain: 0.3 }],
    env: { a: 0.006, d: 0.7, s: 0.45, r: 0.07 },
    filter: { freq: 500, env: 900, decay: 0.12, q: 0.9, track: 0.5 },
    gain: 0.6,
  },
  // Sustained bowed bass for slow pieces.
  bowbass: {
    osc: [{ wave: 'string' }, { wave: 'sine', gain: 0.6 }],
    env: { a: 0.12, d: 1, s: 0.8, r: 0.4 },
    filter: { freq: 380, q: 0.6, track: 0.5 },
    gain: 0.42,
  },
  // --- The Wrongness. Same palette, but things slip. ---
  // A bell whose notes sag flat as they ring.
  wrongbell: {
    osc: [
      { wave: 'sine' },
      { wave: 'sine', ratio: 2.93, gain: 0.4, env: { a: 0.001, d: 0.9, s: 0, r: 0.1 } },
      { wave: 'sine', ratio: 4.1, gain: 0.15, env: { a: 0.001, d: 0.4, s: 0, r: 0.05 } },
    ],
    env: { a: 0.002, d: 3, s: 0, r: 0.8 },
    drift: { cents: -70, time: 2.5 },
    gain: 0.3,
  },
  // A pad that beats against itself, with a slow sour wobble.
  wrongpad: {
    osc: [{ wave: 'string', detune: -22 }, { wave: 'choir', detune: 19 }, { wave: 'sine', ratio: 1.5, detune: -35, gain: 0.25 }],
    env: { a: 0.8, d: 1, s: 0.9, r: 1 },
    filter: { freq: 900, q: 2, track: 0.3 },
    vibrato: { rate: 0.7, depth: 28, delay: 0, fade: 1.5 },
    gain: 0.2,
  },
  // Light percussion: a soft kit, nothing loud or modern.
  kit: {
    kit: {
      // Soft kick: a quick falling sine.
      k: [{ type: 'tone', wave: 'sine', freq: [150, 48], sweep: 0.09, dur: 0.18, gain: 0.85, env: { a: 0.001, d: 0.16, s: 0, r: 0.03 } }],
      // Rim / woodblock click.
      rim: [
        { type: 'tone', wave: 'triangle', freq: [1700, 1500], dur: 0.04, gain: 0.32 },
        { type: 'noise', dur: 0.015, gain: 0.12, filter: { type: 'bandpass', freq: 3000, q: 2 } },
      ],
      // Brushy snare.
      sn: [
        { type: 'noise', dur: 0.16, gain: 0.32, filter: { type: 'bandpass', freq: 2400, q: 0.6 }, env: { a: 0.002, d: 0.12, s: 0, r: 0.04 } },
        { type: 'tone', wave: 'triangle', freq: [260, 180], dur: 0.06, gain: 0.25 },
      ],
      // Shaker: short filtered noise.
      sh: [{ type: 'noise', dur: 0.05, gain: 0.22, filter: { type: 'highpass', freq: 6000 }, env: { a: 0.012, d: 0.04, s: 0, r: 0.02 } }],
      // Closed hat.
      hh: [{ type: 'noise', dur: 0.03, gain: 0.11, filter: { type: 'highpass', freq: 8000 } }],
      // Tambourine jingle.
      tam: [
        { type: 'noise', dur: 0.14, gain: 0.13, filter: { type: 'bandpass', freq: 9000, q: 1.5 }, env: { a: 0.002, d: 0.11, s: 0, r: 0.04 } },
        { type: 'noise', dur: 0.04, gain: 0.06, filter: { type: 'highpass', freq: 5000 } },
      ],
      // Clock tick and tock (Morning After).
      tick: [{ type: 'tone', wave: 'triangle', freq: 2600, dur: 0.012, gain: 0.16 }, { type: 'noise', dur: 0.008, gain: 0.05, filter: { type: 'bandpass', freq: 4000, q: 3 } }],
      tock: [{ type: 'tone', wave: 'triangle', freq: 1900, dur: 0.014, gain: 0.16 }, { type: 'noise', dur: 0.008, gain: 0.05, filter: { type: 'bandpass', freq: 3000, q: 3 } }],
      // Low tom for fills and the title's swells.
      tom: [{ type: 'tone', wave: 'sine', freq: [190, 110], sweep: 0.2, dur: 0.3, gain: 0.55, env: { a: 0.002, d: 0.28, s: 0, r: 0.05 } }],
      // Soft cymbal swell (long noise with slow attack).
      swell: [{ type: 'noise', dur: 1.6, gain: 0.1, filter: { type: 'highpass', freq: [3000, 7000], time: 1.6 }, env: { a: 1.4, d: 1, s: 1, r: 0.5 } }],
    },
  },
};
