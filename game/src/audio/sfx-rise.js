// Sounds of Act 4 (docs/design/04-the-list.md, "Audio needed"): the belfry, the Fountain, the
// Pump Hall and the rise, the Tide Wheel, the climb, the ice cellar, and the reveal.
// Format as in sfx.js; loops as in sfx-world.js.

import { INSTRUMENTS } from './instruments.js';

const rand = (a, b) => a + Math.random() * (b - a);
const KIT = INSTRUMENTS.kit.kit;

// A great bronze bell, struck once: hum, prime, minor third, fifth, and nominal partials, each
// with its own decay, and the hum swelling a little after the strike (the "bloom").
const greatBell = (t, f, g) => [
  { type: 'tone', wave: 'sine', at: t, freq: f * 0.5, dur: 7, gain: g * 0.5, env: { a: 0.6, d: 6.5, s: 0, r: 0.5 } },
  { type: 'tone', wave: 'sine', at: t, freq: f, dur: 5, gain: g * 0.7, env: { a: 0.003, d: 4.5, s: 0, r: 0.5 } },
  { type: 'tone', wave: 'sine', at: t, freq: f * 1.19, dur: 3.5, gain: g * 0.35, detune: 6, env: { a: 0.003, d: 3.2, s: 0, r: 0.3 } },
  { type: 'tone', wave: 'sine', at: t, freq: f * 1.5, dur: 2.5, gain: g * 0.2, env: { a: 0.003, d: 2.2, s: 0, r: 0.3 } },
  { type: 'tone', wave: 'sine', at: t, freq: f * 2.01, dur: 2, gain: g * 0.35, env: { a: 0.002, d: 1.8, s: 0, r: 0.2 } },
  { type: 'tone', wave: 'sine', at: t, freq: f * 2.67, dur: 0.8, gain: g * 0.12, env: { a: 0.001, d: 0.7, s: 0, r: 0.1 } },
  { type: 'noise', at: t, dur: 0.05, gain: g * 0.25, filter: { type: 'bandpass', freq: f * 4, q: 2 } },
];

// A long metal creak, as in sfx-under.js.
const creak = (t, len, f0, f1, g, res = 700) => ({
  type: 'tone', wave: 'sawtooth', at: t, freq: f0, path: [[len * 0.6, f1], [len, (f0 + f1) / 2]], dur: len, gain: g,
  filter: { type: 'bandpass', freq: res, q: 5 }, env: { a: 0.05, d: len, s: 0.8, r: 0.08 },
});

// A short pump cough.
const cough = (t, f, g) => [
  { type: 'tone', wave: 'sine', at: t, freq: [f, f * 0.5], dur: 0.2, gain: g },
  { type: 'noise', at: t + 0.05, dur: 0.22, gain: g * 0.25, filter: { type: 'bandpass', freq: [900, 400], q: 1.5, time: 0.2 } },
];

export const RISE_SFX = {
  // ---- The belfry ----
  // The Mayor's clock, up close in the belfry: loud, with the drive's whirr (loop).
  belfry_tick: {
    gain: 0.9, echo: 0.3,
    loop: {
      beds: [{ type: 'noise', gain: 0.015, filter: { type: 'bandpass', freq: 2500, q: 3 }, lfo: { target: 'gain', rate: 2, depth: 0.5 } }],
      period: 0.5,
      layers: (n) => [
        { type: 'tone', wave: 'triangle', freq: n % 2 ? 1300 : 1600, dur: 0.02, gain: 0.2 },
        { type: 'tone', wave: 'sine', freq: n % 2 ? 210 : 250, dur: 0.06, gain: 0.18 },
        { type: 'noise', dur: 0.012, gain: 0.06, filter: { type: 'bandpass', freq: 3500, q: 2 } },
      ],
    },
  },
  // The clock winding down when its drive is lifted: ticks slowing, then a last clunk.
  clock_rundown: {
    gain: 0.9, echo: 0.3,
    layers: () => {
      const out = [];
      let t = 0;
      let gap = 0.5;
      for (let i = 0; i < 6; i++) {
        out.push({ type: 'tone', wave: 'triangle', at: t, freq: 1500 - i * 80, dur: 0.02, gain: 0.18 * (1 - i * 0.1) });
        out.push({ type: 'tone', wave: 'sine', at: t, freq: 230 - i * 10, dur: 0.06, gain: 0.15 });
        t += gap;
        gap *= 1.35;
      }
      out.push({ type: 'tone', wave: 'sine', at: t, freq: [140, 60], dur: 0.2, gain: 0.35 });
      out.push({ type: 'noise', at: t, dur: 0.08, gain: 0.1, filter: { type: 'lowpass', freq: 900 } });
      return out;
    },
  },
  // The DO NOT TOUCH lever: a hard iron clank.
  lever_clank: {
    gain: 0.75, echo: 0.3,
    layers: [
      { type: 'tone', wave: 'triangle', freq: 640, dur: 0.12, gain: 0.25, env: { a: 0.001, d: 0.12, s: 0, r: 0.05 } },
      { type: 'tone', wave: 'triangle', freq: 1480, dur: 0.06, gain: 0.12 },
      { type: 'tone', wave: 'sine', freq: [150, 70], dur: 0.15, gain: 0.4 },
      { type: 'noise', dur: 0.04, gain: 0.15, filter: { type: 'bandpass', freq: 2500, q: 1.5 } },
    ],
  },
  // The clamp lifting the clock's drive off the old bell linkage: a grind and a release.
  clamp_lift: {
    gain: 0.75, echo: 0.3,
    layers: [
      creak(0, 0.5, 70, 95, 0.12, 900),
      { type: 'noise', dur: 0.5, gain: 0.08, filter: { type: 'bandpass', freq: 1800, q: 2 } },
      { type: 'tone', wave: 'triangle', at: 0.52, freq: 900, dur: 0.05, gain: 0.15 },
      { type: 'tone', wave: 'sine', at: 0.52, freq: [180, 90], dur: 0.1, gain: 0.25 },
    ],
  },
  // One great stroke of the Crown's bell, with its long bloom (about 7 s).
  bell_stroke: {
    gain: 0.6, echo: 0.35, duck: 0.3, duckFor: 3,
    layers: () => greatBell(0, 138.6, 0.6), // C#3/Db3: the hidden city's note
  },
  // Ambrose's three great strokes at the turn of the tide (about 13 s with the bloom).
  bell_strokes: {
    gain: 0.5, echo: 0.35, duck: 0.25, duckFor: 9,
    layers: () => [0, 3, 6].flatMap((t) => greatBell(t, 138.6, 0.6)),
  },
  // A deep thrum rising from below as the Tide Wheel starts, settling (about 5 s). Follow it
  // with the `thrum` loop.
  thrum_rise: {
    gain: 0.85, echo: 0.3,
    layers: [
      { type: 'tone', wave: 'sawtooth', freq: 24, path: [[3, 38], [5, 36]], dur: 5, gain: 0.3, filter: { type: 'lowpass', freq: 220 }, env: { a: 2.5, d: 2, s: 0.8, r: 0.6 } },
      { type: 'tone', wave: 'sine', freq: 36, path: [[3, 55]], dur: 5, gain: 0.25, env: { a: 2.5, d: 2, s: 0.8, r: 0.6 } },
      { type: 'noise', dur: 5, gain: 0.08, filter: { type: 'lowpass', freq: [80, 200], time: 3 }, env: { a: 2.5, d: 2, s: 0.7, r: 0.6 } },
    ],
  },
  // The Tide Wheel's steady low rumble, felt up on the surface for a while afterward (loop).
  thrum: {
    gain: 0.85,
    loop: {
      beds: [
        { type: 'tone', wave: 'sine', freq: 55, gain: 0.07, lfo: { target: 'gain', rate: 0.45, depth: 0.35 } },
        { type: 'noise', gain: 0.04, filter: { type: 'lowpass', freq: 150 }, lfo: { target: 'gain', rate: 0.45, depth: 0.4 } },
      ],
    },
  },
  // ---- The surface in Act 4 ----
  // The hull creak, faint, every 40 seconds or so (loop).
  hull_far: {
    gain: 0.6, echo: 0.4,
    loop: {
      offset: 12, period: 34, jitter: 12,
      layers: () => [creak(0, rand(1.8, 2.6), rand(25, 32), rand(38, 48), 0.12, rand(250, 380))],
    },
  },
  // Stepping into the dry Fountain: coins and buttons skittering.
  coins_rattle: {
    gain: 1.3,
    layers: () => Array.from({ length: 9 }, (_, i) => {
      const t = i * 0.045 + rand(0, 0.03);
      const f = rand(2500, 4800);
      return [
        { type: 'tone', wave: 'sine', at: t, freq: f, dur: rand(0.06, 0.15), gain: rand(0.03, 0.07), env: { a: 0.001, d: 0.12, s: 0, r: 0.03 } },
        { type: 'tone', wave: 'sine', at: t, freq: f * 2.4, dur: 0.04, gain: 0.015 },
      ];
    }).flat(),
  },
  // The Fountain's heavy bronze ring and hatch: the ring lifts, the hatch heaves open.
  ring_hatch: {
    gain: 0.6, echo: 0.4,
    layers: [
      { type: 'tone', wave: 'triangle', freq: 880, dur: 0.4, gain: 0.1, env: { a: 0.001, d: 0.35, s: 0, r: 0.05 } },
      { type: 'tone', wave: 'sine', freq: 880 * 2.3, dur: 0.2, gain: 0.04 },
      creak(0.4, 0.8, 55, 80, 0.16, 500),
      { type: 'tone', wave: 'sine', at: 1.25, freq: [100, 48], dur: 0.35, gain: 0.55 },
      { type: 'tone', wave: 'sine', at: 1.25, freq: 196, dur: 1.2, gain: 0.12, env: { a: 0.001, d: 1.1, s: 0, r: 0.1 } },
    ],
  },

  // ---- The Pump Hall ----
  // A wake-valve turning with a squeal.
  valve_squeal: {
    gain: 0.75, echo: 0.35,
    layers: [
      creak(0, 0.8, 950, 1350, 0.07, 1400),
      { type: 'noise', dur: 0.8, gain: 0.04, filter: { type: 'bandpass', freq: [2500, 3500], q: 3, time: 0.8 } },
      { type: 'tone', wave: 'sine', at: 0.82, freq: [150, 80], dur: 0.12, gain: 0.25 },
    ],
  },
  // A Sister coughing (two variants, at random). Three coughs and she catches: play this twice,
  // then her `pump_*` loop.
  pump_cough: {
    gain: 0.8, echo: 0.35,
    layers: () => (Math.random() < 0.5
      ? cough(0, 90, 0.45)
      : [...cough(0, 85, 0.35), ...cough(0.28, 95, 0.4)]),
  },
  // The Sisters stopping all at once (the wrong order): ragged chugs, a hiss, a clunk.
  pump_stall: {
    gain: 0.8, echo: 0.35,
    layers: [
      ...[0, 0.55, 0.95, 1.5].flatMap((t, i) => cough(t, 95 - i * 8, 0.45 * (1 - i * 0.18))),
      { type: 'noise', at: 1.8, dur: 0.9, gain: 0.1, filter: { type: 'highpass', freq: 3000 }, env: { a: 0.01, d: 0.8, s: 0, r: 0.1 } },
      { type: 'tone', wave: 'sine', at: 2.1, freq: 180, dur: 0.8, gain: 0.15, env: { a: 0.001, d: 0.7, s: 0, r: 0.1 } },
      { type: 'tone', wave: 'sine', at: 2.1, freq: [120, 55], dur: 0.2, gain: 0.35 },
    ],
  },
  // One working thump from each Sister (the same sounds as the pumps cue's rhythm).
  thump_thin: { gain: 0.8, echo: 0.3, layers: KIT.thin },
  thump_stout: { gain: 0.8, echo: 0.3, layers: KIT.stout },
  thump_middle: { gain: 0.8, echo: 0.3, layers: KIT.middle },
  // A Sister running on her own, before all three go (loops). Their periods fit the pumps cue's
  // tempo; stop them when it starts, since the cue carries the thumps.
  pump_thin: { gain: 0.75, echo: 0.3, loop: { period: 60 / 76 * 0.75, layers: KIT.thin } },
  pump_stout: { gain: 0.55, echo: 0.3, loop: { period: 60 / 76, layers: KIT.stout } },
  // The drive shaft turning along the wall (loop).
  shaft_hum: {
    gain: 0.75,
    loop: {
      beds: [
        { type: 'tone', wave: 'sawtooth', freq: 62, gain: 0.03, lfo: { target: 'freq', rate: 0.3, depth: 8 } },
        { type: 'tone', wave: 'sine', freq: 124, gain: 0.04, lfo: { target: 'gain', rate: 1.3, depth: 0.3 } },
        { type: 'noise', gain: 0.02, filter: { type: 'bandpass', freq: 400, q: 2 } },
      ],
    },
  },
  // Water dropping away under the cell grates (about 4 s).
  grate_drain: {
    gain: 0.8, echo: 0.45,
    layers: () => [
      { type: 'noise', dur: 4, gain: 0.14, filter: { type: 'bandpass', freq: [800, 200], q: 1.5, time: 4 }, env: { a: 0.3, d: 3.5, s: 0.5, r: 0.4 } },
      ...Array.from({ length: 16 }, (_, i) => {
        const f = rand(150, 350) * (1 - i / 30);
        return { type: 'tone', wave: 'sine', at: 0.2 + i * 0.22 + rand(0, 0.1), freq: [f, f * 1.9], dur: 0.06, gain: rand(0.04, 0.08) };
      }),
    ],
  },
  // A long, low creak through the whole hull (about 3.5 s; the floor levelling, then tilting).
  hull_creak_long: {
    gain: 1.7, echo: 0.45, duck: 0.5, duckFor: 3,
    layers: [
      creak(0, 3.5, 22, 34, 0.25, 320),
      creak(0.4, 3, 30, 45, 0.12, 600),
      { type: 'noise', dur: 3.5, gain: 0.06, filter: { type: 'lowpass', freq: 160 }, env: { a: 0.8, d: 2.5, s: 0.6, r: 0.5 } },
    ],
  },
  // The Middle Sister's stuck valve: a held hiss, with a sweet, sharp smell (loop).
  valve_hiss: {
    gain: 0.8,
    loop: {
      beds: [
        { type: 'noise', gain: 0.06, filter: { type: 'highpass', freq: 3500 }, lfo: { target: 'gain', rate: 0.6, depth: 0.25 } },
        { type: 'noise', gain: 0.03, filter: { type: 'bandpass', freq: 2200, q: 4 } },
      ],
    },
  },
  // Cheryl's ears pop: a short, high, muffled tone while everything dips for half a second.
  ear_pop: {
    gain: 0.8, dipAll: { level: 0.15, sec: 0.5 },
    layers: [
      { type: 'tone', wave: 'sine', freq: 1760, path: [[0.4, 1700]], dur: 0.45, gain: 0.08, env: { a: 0.02, d: 0.4, s: 0.6, r: 0.15 }, filter: { freq: 2200 } },
      { type: 'tone', wave: 'sine', freq: [220, 120], dur: 0.05, gain: 0.12 },
    ],
  },
  // The great groan through the hull (bigger than the opening's `groan`; about 4 s).
  groan_great: {
    gain: 0.8, echo: 0.4, duck: 0.2, duckFor: 4,
    layers: [
      { type: 'tone', wave: 'sawtooth', freq: 34, path: [[2, 30], [4, 33]], dur: 4, gain: 0.5, vibrato: { rate: 0.6, depth: 40 }, filter: { type: 'lowpass', freq: 280, q: 2 }, env: { a: 0.5, d: 1, s: 1, r: 0.8 } },
      { type: 'tone', wave: 'sawtooth', freq: 15, path: [[1.5, 24], [3, 18], [4, 21]], dur: 4, gain: 0.3, filter: { type: 'bandpass', freq: [380, 800], q: 6, time: 4 }, env: { a: 0.4, d: 1, s: 1, r: 0.5 } },
      { type: 'tone', wave: 'sine', freq: 82, dur: 4, gain: 0.1, vibrato: { rate: 0.3, depth: 25 }, env: { a: 1, d: 1, s: 1, r: 0.8 } },
      { type: 'noise', dur: 4, gain: 0.12, filter: { type: 'lowpass', freq: 150 }, env: { a: 0.5, d: 1, s: 1, r: 0.6 } },
    ],
  },
  // The burst: a crack, and a roar of water surging out of the grate (about 3 s). Start the
  // `roar` loop as it fades.
  burst: {
    gain: 0.5, echo: 0.35, duck: 0.1, duckFor: 2,
    layers: [
      { type: 'noise', dur: 0.05, gain: 0.7, filter: { type: 'highpass', freq: 600 }, env: { a: 0.001, d: 0.05, s: 0, r: 0.01 } },
      { type: 'tone', wave: 'sine', freq: [80, 30], sweep: 0.8, dur: 1, gain: 0.8, env: { a: 0.002, d: 0.9, s: 0, r: 0.1 } },
      { type: 'noise', at: 0.05, dur: 3, gain: 0.45, filter: { type: 'bandpass', freq: [2500, 700], q: 0.6, time: 1.5 }, env: { a: 0.05, d: 2.5, s: 0.5, r: 0.4 } },
      { type: 'noise', at: 0.05, dur: 3, gain: 0.3, filter: { type: 'lowpass', freq: 300 }, env: { a: 0.1, d: 2.5, s: 0.6, r: 0.4 } },
    ],
  },
  // Water roaring up through the burst grate and filling the bottom of the shaft (loop). Fade it
  // with setLoopVolume as Cheryl climbs.
  roar: {
    gain: 0.85,
    loop: {
      beds: [
        { type: 'noise', gain: 0.2, filter: { type: 'bandpass', freq: 700, q: 0.5 }, lfo: { target: 'filter', rate: 0.5, depth: 250 } },
        { type: 'noise', gain: 0.18, filter: { type: 'lowpass', freq: 220 }, lfo: { target: 'gain', rate: 0.3, depth: 0.25 } },
        { type: 'noise', gain: 0.04, filter: { type: 'highpass', freq: 4000 }, lfo: { target: 'gain', rate: 3, depth: 0.4 } },
      ],
    },
  },
  // Floodwater spreading across the floor plates, tile by tile (loop).
  water_spread: {
    gain: 0.8, echo: 0.3,
    loop: {
      beds: [{ type: 'noise', gain: 0.06, filter: { type: 'bandpass', freq: 1200, q: 0.8 }, lfo: { target: 'gain', rate: 1.2, depth: 0.4 } }],
      period: 0.15, jitter: 0.2,
      layers: () => [{ type: 'noise', dur: rand(0.1, 0.25), gain: rand(0.03, 0.07), filter: { type: 'bandpass', freq: [rand(1500, 2500), rand(600, 900)], q: 1 }, env: { a: 0.02, d: 0.2, s: 0, r: 0.05 } }],
    },
  },
  // The emergency hatch banging open.
  hatch_bang: {
    gain: 0.65, echo: 0.4,
    layers: [
      { type: 'tone', wave: 'sine', freq: [130, 50], dur: 0.3, gain: 0.7 },
      { type: 'noise', dur: 0.08, gain: 0.3, filter: { type: 'lowpass', freq: 1500 } },
      { type: 'tone', wave: 'sine', freq: 233, dur: 1.2, gain: 0.15, env: { a: 0.001, d: 1.1, s: 0, r: 0.1 } },
      { type: 'tone', wave: 'sine', freq: 233 * 2.32, dur: 0.6, gain: 0.08, env: { a: 0.001, d: 0.5, s: 0, r: 0.1 } },
      { type: 'tone', wave: 'sine', at: 0.25, freq: [110, 60], dur: 0.15, gain: 0.3 },
    ],
  },
  // Cold air whistling down the open hatch (loop).
  air_whistle: {
    gain: 1.6,
    loop: {
      beds: [
        { type: 'noise', gain: 0.04, filter: { type: 'bandpass', freq: 1500, q: 8 }, lfo: { target: 'filter', rate: 0.23, depth: 300 } },
        { type: 'noise', gain: 0.04, filter: { type: 'lowpass', freq: 500 }, lfo: { target: 'gain', rate: 0.17, depth: 0.5 } },
      ],
    },
  },

  // ---- The Tide Wheel ----
  // Slack water lapping in the channel while the wheel is still (loop).
  slack_lap: {
    gain: 1.2, echo: 0.5,
    loop: {
      beds: [{ type: 'noise', gain: 0.03, filter: { type: 'lowpass', freq: 300 } }],
      period: 1.1, jitter: 1.4,
      layers: () => [{ type: 'noise', dur: rand(0.5, 0.9), gain: rand(0.05, 0.09), filter: { type: 'bandpass', freq: [rand(600, 800), rand(250, 350)], q: 1.2 }, env: { a: 0.2, d: 0.5, s: 0.2, r: 0.3 } }],
    },
  },
  // Water rushing through the channel once the tide runs (loop; with `tide_wheel` for the wheel).
  channel_rush: {
    gain: 0.8, echo: 0.3,
    loop: {
      beds: [
        { type: 'noise', gain: 0.14, filter: { type: 'bandpass', freq: 900, q: 0.6 }, lfo: { target: 'filter', rate: 0.7, depth: 200 } },
        { type: 'noise', gain: 0.08, filter: { type: 'lowpass', freq: 250 } },
      ],
    },
  },

  // ---- The climb, the cellar, the reveal ----
  // A gull, far too close: no distance in it at all.
  gull_close: {
    gain: 2.4,
    layers: [
      { type: 'tone', wave: 'sawtooth', freq: 1150, path: [[0.07, 1900], [0.45, 980]], dur: 0.45, gain: 0.09, vibrato: { rate: 28, depth: 40 }, filter: { type: 'bandpass', freq: 2000, q: 2.5 }, env: { a: 0.015, d: 0.45, s: 0.7, r: 0.05 } },
      { type: 'noise', dur: 0.4, gain: 0.015, filter: { type: 'bandpass', freq: 3000, q: 2 } },
    ],
  },
  // Shoving the slab over the hatch: a grinding scrape, light leaking in.
  slab_scrape: {
    gain: 0.8, echo: 0.3,
    layers: [
      { type: 'noise', dur: 1, gain: 0.24, filter: { type: 'bandpass', freq: [700, 1300], q: 1.3, time: 1 }, env: { a: 0.08, d: 0.9, s: 0.8, r: 0.1 } },
      { type: 'tone', wave: 'sawtooth', freq: 45, path: [[1, 60]], dur: 1, gain: 0.12, vibrato: { rate: 11, depth: 70 }, filter: { type: 'lowpass', freq: 300 } },
    ],
  },
  // The slab grinding back into place behind her, with a thud (one way).
  slab_close: {
    gain: 0.8, echo: 0.3,
    layers: [
      { type: 'noise', dur: 0.7, gain: 0.2, filter: { type: 'bandpass', freq: [1100, 600], q: 1.3, time: 0.7 }, env: { a: 0.05, d: 0.6, s: 0.8, r: 0.1 } },
      { type: 'tone', wave: 'sine', at: 0.72, freq: [120, 50], dur: 0.25, gain: 0.6 },
      { type: 'noise', at: 0.72, dur: 0.1, gain: 0.15, filter: { type: 'lowpass', freq: 700 } },
    ],
  },
  // Many people shouting upstairs, heard from the cellar through floorboards (loop).
  shouting: {
    gain: 1.2,
    loop: {
      beds: [{ type: 'noise', gain: 0.05, filter: { type: 'bandpass', freq: 450, q: 1 }, lfo: { target: 'gain', rate: 0.5, depth: 0.4 } }],
      period: 0.05, jitter: 0.08,
      layers: () => {
        const f = rand(350, 650);
        return [Math.random() < 0.25
          ? { type: 'tone', wave: 'sawtooth', freq: f, path: [[0.15, f * 1.25], [0.35, f]], dur: 0.35, gain: 0.03, filter: { type: 'lowpass', freq: 700 }, env: { a: 0.03, d: 0.3, s: 0.6, r: 0.05 } }
          : { type: 'noise', dur: rand(0.1, 0.25), gain: rand(0.03, 0.06), filter: { type: 'bandpass', freq: rand(300, 700), q: 6 }, env: { a: 0.02, d: 0.15, s: 0.5, r: 0.05 } }];
      },
    },
  },
  // A single soft, low bell tone at the bronze door (the discovery sting's root, D-flat).
  bell_low: {
    gain: 0.6, echo: 0.6,
    layers: [
      { type: 'tone', wave: 'sine', freq: 138.6, dur: 5, gain: 0.25, env: { a: 0.01, d: 4.5, s: 0, r: 0.5 } },
      { type: 'tone', wave: 'sine', freq: 277.2, dur: 3, gain: 0.08, env: { a: 0.005, d: 2.8, s: 0, r: 0.3 } },
      { type: 'tone', wave: 'sine', freq: 138.6 * 2.76, dur: 1.2, gain: 0.04, env: { a: 0.003, d: 1.1, s: 0, r: 0.2 } },
    ],
  },
  // The town's noise rushing back after the silence: voices swelling up (about 2 s). Start the
  // `crowd` or `town` loop as it lands.
  town_rush: {
    gain: 2.2, echo: 0.2,
    layers: () => [
      { type: 'noise', dur: 2.2, gain: 0.1, filter: { type: 'bandpass', freq: [300, 900], q: 0.8, time: 2 }, env: { a: 1.4, d: 0.6, s: 0.6, r: 0.4 } },
      ...Array.from({ length: 30 }, (_, i) => {
        const t = 0.3 + (i / 30) * 1.8 + rand(0, 0.1);
        return { type: 'noise', at: t, dur: rand(0.1, 0.25), gain: rand(0.02, 0.05) * (0.3 + 0.7 * i / 30), filter: { type: 'bandpass', freq: rand(350, 1500), q: rand(5, 9) }, env: { a: 0.02, d: 0.15, s: 0.4, r: 0.05 } };
      }),
    ],
  },
  // Crabs clicking about on the mud (loop).
  crabs: {
    gain: 0.8,
    loop: {
      offset: 0.3, period: 0.6, jitter: 1.4,
      layers: () => Array.from({ length: 2 + Math.floor(Math.random() * 4) }, (_, i) => (
        { type: 'tone', wave: 'triangle', at: i * rand(0.05, 0.09), freq: rand(2600, 3800), dur: 0.01, gain: rand(0.03, 0.06) }
      )),
    },
  },
  // A stranded fish flopping on the quay.
  fish_flop: {
    gain: 0.85,
    layers: () => [0, 0.22, 0.38].map((t, i) => [
      { type: 'noise', at: t + rand(0, 0.03), dur: 0.06, gain: 0.18 - i * 0.04, filter: { type: 'bandpass', freq: 1300, q: 1 }, env: { a: 0.002, d: 0.05, s: 0, r: 0.02 } },
      { type: 'tone', wave: 'sine', at: t, freq: [220, 120], dur: 0.05, gain: 0.12 - i * 0.03 },
    ]).flat(),
  },
};
