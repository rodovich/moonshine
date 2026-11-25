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
  // Moonglass: a glass harmonica, soft attack and a cool shimmer. The Founders' melody voice.
  glass: {
    osc: [
      { wave: 'sine' },
      { wave: 'sine', ratio: 2, detune: 3, gain: 0.18 },
      { wave: 'sine', ratio: 3, gain: 0.06 },
      { wave: 'sine', ratio: 1, detune: 9, gain: 0.35 },
    ],
    env: { a: 0.18, d: 1.2, s: 0.75, r: 0.9 },
    vibrato: { rate: 3.8, depth: 7, delay: 0.3, fade: 0.8 },
    gain: 0.36,
  },
  // A child's singing voice, for the Skipping Girls' chant (bright, a little nasal).
  voice: {
    osc: [{ wave: 'pulse25' }, { wave: 'ocarina', gain: 0.6 }],
    env: { a: 0.02, d: 0.2, s: 0.8, r: 0.06 },
    filter: { type: 'bandpass', freq: 1300, q: 1.4, track: 0.4 },
    vibrato: { rate: 6, depth: 18, delay: 0.1, fade: 0.15 },
    gain: 0.5,
  },
  // The Boatman: a reedy, wobbling voice that never quite finds the note.
  boatman: {
    osc: [{ wave: 'reed' }, { wave: 'reed', detune: 23, gain: 0.5 }],
    env: { a: 0.06, d: 0.3, s: 0.85, r: 0.12 },
    filter: { type: 'bandpass', freq: 800, q: 1.2, track: 0.5 },
    vibrato: { rate: 4.2, depth: 45, delay: 0.05, fade: 0.2 },
    gain: 0.4,
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
      // A slow, deep pulse: the machinery's heartbeat underground (no hand percussion there).
      pulse: [{ type: 'tone', wave: 'sine', freq: [78, 44], sweep: 0.25, dur: 0.5, gain: 0.7, env: { a: 0.01, d: 0.45, s: 0, r: 0.1 } }],
      // The Three Sisters' working thumps (the pumps cue, and the sister_* sounds): the stout one
      // heavy and low, the thin one light and quick, the middle one in between with a greedy gasp.
      stout: [
        { type: 'tone', wave: 'sine', freq: [88, 50], sweep: 0.3, dur: 0.38, gain: 0.9, env: { a: 0.004, d: 0.35, s: 0, r: 0.06 } },
        { type: 'noise', dur: 0.1, gain: 0.2, filter: { type: 'lowpass', freq: 300 } },
        { type: 'tone', wave: 'triangle', at: 0.02, freq: 410, dur: 0.03, gain: 0.05 },
      ],
      thin: [
        { type: 'tone', wave: 'sine', freq: [150, 90], sweep: 0.1, dur: 0.13, gain: 0.5 },
        { type: 'noise', dur: 0.03, gain: 0.08, filter: { type: 'bandpass', freq: 1500, q: 1.5 } },
        { type: 'tone', wave: 'triangle', freq: 900, dur: 0.015, gain: 0.04 },
      ],
      middle: [
        { type: 'tone', wave: 'sine', freq: [100, 55], sweep: 0.2, dur: 0.24, gain: 0.7 },
        { type: 'noise', at: 0.04, dur: 0.22, gain: 0.09, filter: { type: 'bandpass', freq: [500, 1000], q: 1.5, time: 0.2 }, env: { a: 0.04, d: 0.18, s: 0.3, r: 0.05 } },
      ],
      // A heartbeat, lub-dub's "lub" (the climb); the ghost mark makes the softer "dub".
      heart: [
        { type: 'tone', wave: 'sine', freq: [62, 40], sweep: 0.15, dur: 0.2, gain: 0.85, env: { a: 0.006, d: 0.18, s: 0, r: 0.05 } },
        { type: 'noise', dur: 0.06, gain: 0.08, filter: { type: 'lowpass', freq: 220 } },
      ],
      // A chain link arriving through the hawse: a deep metal BOOM (the hauling cue's beat).
      boom: [
        { type: 'tone', wave: 'sine', freq: [70, 34], sweep: 0.9, dur: 1.4, gain: 0.85, env: { a: 0.003, d: 1.3, s: 0, r: 0.1 } },
        { type: 'tone', wave: 'sine', freq: 131, dur: 1.6, gain: 0.16, env: { a: 0.002, d: 1.5, s: 0, r: 0.1 } },
        { type: 'tone', wave: 'sine', freq: 131 * 2.32, dur: 0.8, gain: 0.08, env: { a: 0.002, d: 0.7, s: 0, r: 0.1 } },
        { type: 'noise', dur: 0.12, gain: 0.25, filter: { type: 'lowpass', freq: 900 } },
      ],
      // The clapper's ratchet clacking into the drum's teeth after each link.
      clack: [
        { type: 'tone', wave: 'triangle', freq: 1500, dur: 0.03, gain: 0.18 },
        { type: 'tone', wave: 'sine', freq: [260, 150], dur: 0.06, gain: 0.2 },
        { type: 'noise', dur: 0.02, gain: 0.08, filter: { type: 'bandpass', freq: 3000, q: 2 } },
      ],
      // The egg timer's bell, as a note: pitched at D7 (the third of B-flat) so it can end the
      // relay as its final note. The sound effect `timer_ding` is the same bell at E7.
      ding: [
        { type: 'noise', dur: 0.03, gain: 0.12, filter: { type: 'lowpass', freq: 900 } },
        { type: 'tone', wave: 'sine', at: 0.03, freq: 2349, dur: 1.6, gain: 0.3, vibrato: { rate: 26, depth: 9 }, env: { a: 0.002, d: 1.5, s: 0, r: 0.2 } },
        { type: 'tone', wave: 'sine', at: 0.03, freq: 2349 * 2.76, dur: 0.3, gain: 0.05, env: { a: 0.001, d: 0.25, s: 0, r: 0.05 } },
        { type: 'tone', wave: 'sine', at: 0.03, freq: 1174.7, dur: 1.2, gain: 0.08, env: { a: 0.002, d: 1.1, s: 0, r: 0.1 } },
      ],
      // Water lapping against a quay, as part of the harbor music's texture.
      wave: [{ type: 'noise', dur: 1.4, gain: 0.12, filter: { type: 'bandpass', freq: [700, 350], q: 0.8, time: 1.4 }, env: { a: 0.45, d: 0.8, s: 0.2, r: 0.4 } }],
      // Low tom for fills and the title's swells.
      tom: [{ type: 'tone', wave: 'sine', freq: [190, 110], sweep: 0.2, dur: 0.3, gain: 0.55, env: { a: 0.002, d: 0.28, s: 0, r: 0.05 } }],
      // Soft cymbal swell (long noise with slow attack).
      swell: [{ type: 'noise', dur: 1.6, gain: 0.1, filter: { type: 'highpass', freq: [3000, 7000], time: 1.6 }, env: { a: 1.4, d: 1, s: 1, r: 0.5 } }],
    },
  },
};
