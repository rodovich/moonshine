// Sounds of Act 6 (docs/design/06-moon-in-the-bowl.md, "Audio needed"): the bell at the turn, the
// hauling, the montages, the Long Keel and the Sighting Room, the bath, the lift, the dawn, and the
// epilogue. Format as in sfx.js; loops as in sfx-world.js.

import { INSTRUMENTS } from './instruments.js';

const rand = (a, b) => a + Math.random() * (b - a);
const pick = (xs) => xs[Math.floor(Math.random() * xs.length)];
const KIT = INSTRUMENTS.kit.kit;

// A long metal creak, as in sfx-under.js.
const creak = (t, len, f0, f1, g, res = 700) => ({
  type: 'tone', wave: 'sawtooth', at: t, freq: f0, path: [[len * 0.6, f1], [len, (f0 + f1) / 2]], dur: len, gain: g,
  filter: { type: 'bandpass', freq: res, q: 5 }, env: { a: 0.05, d: len, s: 0.8, r: 0.08 },
});

// A great bell stroke heard down a speaking tube: the low partials gone, hollow and ringing.
const tubeBell = (t, g) => [
  { type: 'tone', wave: 'sine', at: t, freq: 138.6, dur: 4, gain: g * 0.4, env: { a: 0.003, d: 3.8, s: 0, r: 0.3 }, filter: { type: 'bandpass', freq: 600, q: 2 } },
  { type: 'tone', wave: 'sine', at: t, freq: 277.2, dur: 3, gain: g * 0.5, env: { a: 0.003, d: 2.8, s: 0, r: 0.3 } },
  { type: 'tone', wave: 'sine', at: t, freq: 165, dur: 2.5, gain: g * 0.25, detune: 6, env: { a: 0.003, d: 2.3, s: 0, r: 0.3 } },
  { type: 'tone', wave: 'sine', at: t, freq: 554, dur: 1.2, gain: g * 0.15, env: { a: 0.002, d: 1.1, s: 0, r: 0.1 } },
  { type: 'noise', at: t, dur: 0.05, gain: g * 0.15, filter: { type: 'bandpass', freq: 800, q: 3 } },
];

// A moonglass chime (glass instrument notes).
const chime = (t, pitches, gap = 0.1, len = 1.6, vel = 0.6) => ({
  type: 'notes', inst: 'glass', at: t, notes: pitches.map((p, i) => [p, i * gap, len, vel]),
});

// One person's "oof" as they sit down hard: a short, low vocal grunt.
const oof = (t, g) => {
  const f = rand(110, 220);
  return [
    { type: 'tone', wave: 'sawtooth', at: t, freq: f, path: [[0.15, f * 0.8]], dur: 0.16, gain: g, filter: { type: 'bandpass', freq: rand(500, 800), q: 3 }, env: { a: 0.01, d: 0.15, s: 0.5, r: 0.04 } },
    { type: 'tone', wave: 'sine', at: t, freq: [rand(90, 130), 55], dur: 0.12, gain: g * 2 },
  ];
};

export const HOME_SFX = {
  // ---- The bell and the brake ----
  // Ambrose's three strokes at the turn, heard through the Windlass Room's speaking tube at night.
  bell_tube: {
    gain: 0.7, echo: 0.55, duck: 0.3, duckFor: 8,
    layers: () => [0, 2.6, 5.2].flatMap((t) => tubeBell(t, 0.6)),
  },
  // The brake lever unlocking: a loud clack.
  brake_clack: {
    gain: 0.75, echo: 0.35,
    layers: [
      { type: 'tone', wave: 'triangle', freq: 820, dur: 0.1, gain: 0.3, env: { a: 0.001, d: 0.1, s: 0, r: 0.03 } },
      { type: 'tone', wave: 'triangle', freq: 1900, dur: 0.04, gain: 0.15 },
      { type: 'tone', wave: 'sine', freq: [170, 80], dur: 0.12, gain: 0.45 },
      { type: 'noise', dur: 0.04, gain: 0.2, filter: { type: 'bandpass', freq: 2500, q: 1.5 } },
    ],
  },
  // The brake thrown: a heavy lever swinging over, and a deep shudder through the floor.
  brake_throw: {
    gain: 0.7, echo: 0.4,
    layers: [
      creak(0, 0.5, 60, 85, 0.14, 800),
      { type: 'tone', wave: 'sine', at: 0.5, freq: [130, 55], dur: 0.3, gain: 0.6 },
      { type: 'tone', wave: 'sine', at: 0.5, freq: 233, dur: 1, gain: 0.12, env: { a: 0.001, d: 0.9, s: 0, r: 0.1 } },
      { type: 'tone', wave: 'sawtooth', at: 0.55, freq: 30, dur: 1.4, gain: 0.25, filter: { type: 'lowpass', freq: 150 }, vibrato: { rate: 9, depth: 80 }, env: { a: 0.05, d: 1.3, s: 0.4, r: 0.2 } },
    ],
  },
  // Far off through the walls, the Tide Wheel bites: a huge slow groan rising to a roar (about 5 s).
  wheel_bite: {
    gain: 0.75, echo: 0.45,
    layers: [
      { type: 'tone', wave: 'sawtooth', freq: 22, path: [[2.5, 34], [5, 38]], dur: 5, gain: 0.4, filter: { type: 'lowpass', freq: 260, q: 2 }, vibrato: { rate: 0.5, depth: 40 }, env: { a: 1, d: 3, s: 1, r: 1 } },
      creak(0.5, 3, 20, 30, 0.18, 350),
      { type: 'noise', at: 2, dur: 3, gain: 0.22, filter: { type: 'lowpass', freq: [200, 700], time: 2.5 }, env: { a: 1.5, d: 1.5, s: 0.8, r: 0.8 } },
    ],
  },
  // The great drum turning (loop): a deep rumble and a slow rhythmic creak.
  drum_turn: {
    gain: 0.8, echo: 0.35,
    loop: {
      beds: [{ type: 'tone', wave: 'sawtooth', freq: 38, gain: 0.06, lfo: { target: 'gain', rate: 0.7, depth: 0.4 }, filter: { type: 'lowpass', freq: 200 } }],
      period: 1.5,
      layers: () => [creak(0, 0.9, rand(32, 36), rand(40, 46), 0.1, 420)],
    },
  },
  // One chain link arriving (the hauling cue already has these; use this outside it).
  link_boom: { gain: 0.6, echo: 0.35, layers: [...KIT.boom, ...KIT.clack.map((l) => ({ ...l, at: (l.at ?? 0) + 0.19 }))] },

  // ---- The montage ----
  // A lurch: a deep thud through everything.
  lurch: {
    gain: 0.8, echo: 0.3,
    layers: [
      { type: 'tone', wave: 'sine', freq: [80, 30], dur: 0.6, gain: 0.85, env: { a: 0.005, d: 0.55, s: 0, r: 0.08 } },
      { type: 'noise', dur: 0.2, gain: 0.2, filter: { type: 'lowpass', freq: 400 } },
    ],
  },
  // A whole crowd sitting down hard at once: a soft chorus of thumps and "oof"s.
  crowd_oof: {
    gain: 0.9, echo: 0.25,
    layers: () => Array.from({ length: 18 }, () => oof(rand(0, 0.35), rand(0.04, 0.08))).flat(),
  },
  // The piano rolling along the mud, gathering speed, and dropping into a boat with a crash of chords.
  piano_boat: {
    gain: 0.32, echo: 0.3,
    layers: () => {
      const out = [
        { type: 'noise', dur: 1.6, gain: 0.2, filter: { type: 'lowpass', freq: [300, 700], time: 1.5 }, env: { a: 0.3, d: 1.2, s: 0.6, r: 0.2 } },
        { type: 'tone', wave: 'sawtooth', freq: 40, path: [[1.6, 70]], dur: 1.6, gain: 0.1, filter: { type: 'lowpass', freq: 250 }, vibrato: { rate: 7, depth: 120 } },
      ];
      const low = ['C2', 'Eb2', 'G2', 'Bb2'];
      const mid = ['C3', 'Eb3', 'F#3', 'A3', 'C4', 'Eb4', 'G4'];
      const high = ['C5', 'Eb5', 'G5', 'Bb5', 'D6'];
      const crash = [pick(low), pick(low), pick(mid), pick(mid), pick(mid), pick(high), pick(high)].map((p, i) => [p, i * 0.006, 1.8, 1]);
      out.push({ type: 'notes', inst: 'piano', at: 1.65, notes: crash });
      out.push({ type: 'tone', wave: 'sine', at: 1.65, freq: [120, 50], dur: 0.35, gain: 0.6 });
      out.push({ type: 'noise', at: 1.65, dur: 0.3, gain: 0.25, filter: { type: 'lowpass', freq: 1200 } });
      out.push({ type: 'tone', wave: 'sine', at: 1.68, freq: 196, dur: 0.6, gain: 0.15, env: { a: 0.002, d: 0.55, s: 0, r: 0.05 } }); // the boat's hull
      return out;
    },
  },
  // Chess pieces flying off the board and scattering on the cobbles.
  chess_scatter: {
    gain: 0.85,
    layers: () => Array.from({ length: 12 }, (_, i) => {
      const t = i * 0.05 + rand(0, 0.06);
      return [
        { type: 'tone', wave: 'triangle', at: t, freq: rand(1400, 2200), dur: 0.025, gain: rand(0.08, 0.15) },
        { type: 'tone', wave: 'sine', at: t, freq: rand(300, 450), dur: 0.03, gain: 0.05 },
      ];
    }).flat(),
  },
  // Sheets cracking in the wind like flags.
  sheets_crack: {
    gain: 0.85,
    layers: () => [0, 0.16, 0.28, 0.5].map((t, i) => [
      { type: 'noise', at: t, dur: 0.05, gain: 0.3 - i * 0.04, filter: { type: 'bandpass', freq: rand(1200, 1800), q: 1 }, env: { a: 0.001, d: 0.045, s: 0, r: 0.02 } },
      { type: 'tone', wave: 'sine', at: t, freq: [140, 70], dur: 0.05, gain: 0.12 },
    ]).flat(),
  },

  // ---- The hatch, the Long Keel, the Sighting Room ----
  // The moon-in-bowl emblem lighting cyan, then the hatch grinding open.
  emblem_hatch: {
    gain: 0.6, echo: 0.5,
    layers: [
      chime(0, ['Db5', 'F5', 'Ab5', 'C6'], 0.12, 2, 0.5),
      { type: 'noise', at: 1, dur: 1.4, gain: 0.2, filter: { type: 'bandpass', freq: [500, 900], q: 1.4, time: 1.4 }, env: { a: 0.08, d: 1.3, s: 0.8, r: 0.1 } },
      { type: 'tone', wave: 'sawtooth', at: 1, freq: 42, path: [[1.4, 56]], dur: 1.4, gain: 0.1, filter: { type: 'lowpass', freq: 300 } },
      { type: 'tone', wave: 'sine', at: 2.4, freq: [110, 55], dur: 0.25, gain: 0.4 },
    ],
  },
  // A stone door sliding up into the wall (the Sighting Room).
  door_slide_up: {
    gain: 0.65, echo: 0.45,
    layers: [
      { type: 'noise', dur: 1.6, gain: 0.18, filter: { type: 'bandpass', freq: [400, 1000], q: 1.3, time: 1.6 }, env: { a: 0.1, d: 1.5, s: 0.8, r: 0.1 } },
      { type: 'tone', wave: 'sawtooth', freq: 40, path: [[1.6, 62]], dur: 1.6, gain: 0.1, filter: { type: 'lowpass', freq: 280 } },
      { type: 'tone', wave: 'sine', at: 1.6, freq: [150, 70], dur: 0.2, gain: 0.35 },
    ],
  },
  // The plug's glint at the bottom of the bowl: a tiny, high sparkle.
  plug_glint: {
    gain: 0.6, echo: 0.5,
    layers: [
      { type: 'tone', wave: 'sine', freq: 3520, dur: 0.6, gain: 0.08, env: { a: 0.002, d: 0.55, s: 0, r: 0.05 } },
      { type: 'tone', wave: 'sine', at: 0.07, freq: 4699, dur: 0.4, gain: 0.05, env: { a: 0.002, d: 0.35, s: 0, r: 0.05 } },
    ],
  },
  // Water welling up through the Basin's grille, slow and clean (about 4 s).
  basin_fill: {
    gain: 1.35, echo: 0.4,
    layers: () => [
      { type: 'noise', dur: 4, gain: 0.1, filter: { type: 'bandpass', freq: [500, 1100], q: 2, time: 4 }, env: { a: 0.6, d: 3, s: 0.7, r: 0.5 } },
      ...Array.from({ length: 10 }, (_, i) => {
        const f = rand(300, 500) * (1 + i * 0.05);
        return { type: 'tone', wave: 'sine', at: 0.3 + i * 0.35 + rand(0, 0.1), freq: [f, f * 1.6], dur: 0.06, gain: 0.04 };
      }),
    ],
  },
  // The moonlight landing on the water, breaking into pieces, then settling: a soft shimmer.
  moon_settle: {
    gain: 0.6, echo: 0.6,
    layers: [
      chime(0, ['F6', 'C6', 'A6', 'F6', 'C7', 'A6'], 0.09, 1.8, 0.3),
      { type: 'noise', dur: 2.5, gain: 0.025, filter: { type: 'highpass', freq: 7000 }, env: { a: 0.3, d: 2, s: 0, r: 0.3 } },
    ],
  },
  // One step of the trim wheel: a deep creak, and a small groan as the hull swings a hair.
  trim_turn: {
    gain: 0.8, echo: 0.4,
    layers: () => [
      creak(0, 0.8, 50, 70, 0.16, 500),
      { type: 'tone', wave: 'sine', at: 0.8, freq: [120, 60], dur: 0.15, gain: 0.3 },
      creak(0.7, 1.5, 26, 32, 0.12, 300),
    ],
  },
  // Moon true: the Basin's moonglass rim lighting, a chime running all the way round.
  rim_light: {
    gain: 0.45, echo: 0.55,
    layers: [chime(0, ['F5', 'A5', 'C6', 'F6', 'A6', 'C7', 'F7'], 0.12, 2.2, 0.5)],
  },
  // Every lamp in the Long Keel blazing, far off: a run of chimes going away.
  lamps_blaze: {
    gain: 0.7, echo: 0.55,
    layers: () => ['F6', 'C6', 'A5', 'F6', 'C6', 'A5', 'F6', 'C6', 'A5'].map((p, i) => ({
      type: 'notes', inst: 'glass', at: i * 0.22, gain: Math.pow(0.82, i), notes: [[p, 0, 1.4, 0.55]],
    })),
  },
  // The master stop pulled: a clack.
  master_stop: {
    gain: 0.75, echo: 0.4,
    layers: [
      { type: 'tone', wave: 'triangle', freq: 700, dur: 0.1, gain: 0.25, env: { a: 0.001, d: 0.1, s: 0, r: 0.03 } },
      { type: 'tone', wave: 'sine', freq: [160, 80], dur: 0.12, gain: 0.4 },
      { type: 'tone', wave: 'sine', freq: 330, dur: 0.8, gain: 0.08, env: { a: 0.001, d: 0.7, s: 0, r: 0.1 } },
    ],
  },
  // Far off, the Middle Sister: a cough, and a thump that stops; then the room settling.
  sisters_sleep: {
    gain: 0.75, echo: 0.55,
    layers: [
      { type: 'tone', wave: 'sine', freq: [95, 48], dur: 0.25, gain: 0.3, filter: { freq: 400 } },
      { type: 'noise', at: 0.08, dur: 0.25, gain: 0.06, filter: { type: 'bandpass', freq: 500, q: 2 } },
      { type: 'tone', wave: 'sine', at: 0.9, freq: [85, 40], dur: 0.35, gain: 0.35, filter: { freq: 300 } },
      creak(1.6, 2, 34, 28, 0.1, 300),
    ],
  },
  // The canals refilling: water rushing back along the trench, foaming (about 4 s).
  canal_rush: {
    gain: 0.75, echo: 0.25,
    layers: [
      { type: 'noise', dur: 4, gain: 0.3, filter: { type: 'bandpass', freq: [400, 1200], q: 0.6, time: 2 }, env: { a: 0.6, d: 3, s: 0.6, r: 0.5 } },
      { type: 'noise', dur: 4, gain: 0.12, filter: { type: 'highpass', freq: [2000, 5000], time: 2 }, env: { a: 0.8, d: 3, s: 0.5, r: 0.5 } },
      { type: 'noise', dur: 4, gain: 0.18, filter: { type: 'lowpass', freq: 250 }, env: { a: 0.5, d: 3, s: 0.7, r: 0.5 } },
    ],
  },
  // A crowd cheering (the refill, and the Stair Race): about 3 s.
  crowd_cheer: {
    gain: 2.2, echo: 0.2,
    layers: () => [
      { type: 'noise', dur: 3, gain: 0.1, filter: { type: 'bandpass', freq: 900, q: 0.8 }, env: { a: 0.2, d: 2.5, s: 0.5, r: 0.5 } },
      ...Array.from({ length: 24 }, () => {
        const t = rand(0, 2.2);
        const f = rand(300, 700);
        return { type: 'tone', wave: 'sawtooth', at: t, freq: f, path: [[0.2, f * rand(1.2, 1.5)], [0.5, f * rand(0.9, 1.2)]], dur: rand(0.35, 0.6), gain: rand(0.012, 0.025),
          filter: { type: 'bandpass', freq: rand(900, 1500), q: 3 }, env: { a: 0.04, d: 0.4, s: 0.6, r: 0.08 } };
      }),
      ...Array.from({ length: 20 }, () => ({ type: 'noise', at: rand(0, 2.5), dur: 0.02, gain: rand(0.03, 0.06), filter: { type: 'bandpass', freq: rand(1500, 2500), q: 2 } })),
    ],
  },

  // ---- The bath ----
  // Climbing into the Basin: water taking her weight.
  bath_enter: {
    gain: 1.3, echo: 0.4,
    layers: [
      { type: 'noise', dur: 1.2, gain: 0.14, filter: { type: 'bandpass', freq: [1400, 500], q: 1, time: 1.1 }, env: { a: 0.05, d: 1, s: 0.3, r: 0.2 } },
      { type: 'tone', wave: 'sine', at: 0.2, freq: [200, 420], dur: 0.08, gain: 0.06 },
      { type: 'tone', wave: 'sine', at: 0.6, freq: [260, 500], dur: 0.07, gain: 0.05 },
    ],
  },
  // Ripples settling: a few soft laps against stone.
  ripples: {
    gain: 2.2, echo: 0.5,
    layers: () => [0, 0.6, 1.3, 2.1].map((t, i) => ({
      type: 'noise', at: t, dur: 0.5, gain: 0.07 * (1 - i * 0.2), filter: { type: 'bandpass', freq: [900, 500], q: 2 }, env: { a: 0.15, d: 0.3, s: 0.2, r: 0.15 },
    })),
  },

  // ---- The lift and the dawn ----
  // The lift cage's gate closing: an iron clank.
  lift_gate: {
    gain: 0.7, echo: 0.4,
    layers: [
      { type: 'tone', wave: 'triangle', freq: 520, dur: 0.15, gain: 0.25, env: { a: 0.001, d: 0.15, s: 0, r: 0.05 } },
      { type: 'tone', wave: 'triangle', freq: 1240, dur: 0.08, gain: 0.1 },
      { type: 'tone', wave: 'sine', freq: [150, 70], dur: 0.15, gain: 0.35 },
      { type: 'tone', wave: 'triangle', at: 0.22, freq: 480, dur: 0.08, gain: 0.1 },
    ],
  },
  // The lift going up: the counterweight's long rumble going down, and chain running (about 4.5 s).
  lift_ride: {
    gain: 0.75, echo: 0.35,
    layers: () => [
      { type: 'tone', wave: 'sawtooth', freq: 45, path: [[4.5, 38]], dur: 4.5, gain: 0.12, filter: { type: 'lowpass', freq: 220 }, env: { a: 0.5, d: 3.5, s: 0.8, r: 0.6 } },
      { type: 'noise', dur: 4.5, gain: 0.07, filter: { type: 'lowpass', freq: 300 }, env: { a: 0.5, d: 3.5, s: 0.8, r: 0.6 } },
      ...Array.from({ length: 28 }, (_, i) => ({ type: 'tone', wave: 'triangle', at: 0.3 + i * 0.14 + rand(0, 0.03), freq: rand(1500, 2400), dur: 0.03, gain: 0.03 })),
    ],
  },
  // Dawn birds in Cistern Court (loop): small chirps and a blackbird-ish phrase now and then.
  dawn_birds: {
    gain: 1.5, echo: 0.3,
    loop: {
      offset: 0.3, period: 0.8, jitter: 1.6,
      layers: () => {
        if (Math.random() < 0.2) {
          const base = rand(1800, 2400);
          return [1, 1.25, 1.12, 1.5, 1.33].map((r, i) => ({ type: 'tone', wave: 'sine', at: i * 0.13, freq: base * r, path: [[0.1, base * r * rand(0.95, 1.08)]], dur: 0.11, gain: 0.035, vibrato: { rate: 30, depth: 30 } }));
        }
        return Array.from({ length: 1 + Math.floor(Math.random() * 3) }, (_, i) => {
          const f = rand(3500, 5200);
          return { type: 'tone', wave: 'sine', at: i * 0.08, freq: [f, f * rand(0.8, 1.2)], dur: 0.05, gain: 0.025 };
        });
      },
    },
  },
  // The well's iron grate lifting.
  well_grate: {
    gain: 0.75, echo: 0.3,
    layers: [
      creak(0, 0.5, 90, 120, 0.1, 900),
      { type: 'tone', wave: 'triangle', at: 0.55, freq: 640, dur: 0.12, gain: 0.2, env: { a: 0.001, d: 0.12, s: 0, r: 0.05 } },
      { type: 'tone', wave: 'sine', at: 0.55, freq: [150, 75], dur: 0.15, gain: 0.35 },
      { type: 'tone', wave: 'sine', at: 0.56, freq: 330, dur: 0.9, gain: 0.08, env: { a: 0.001, d: 0.8, s: 0, r: 0.1 } },
    ],
  },
  // The Stair Race: many running feet on stone steps (about 2 s).
  race_feet: {
    gain: 0.85,
    layers: () => Array.from({ length: 30 }, (_, i) => {
      const t = rand(0, 2);
      return [
        { type: 'noise', at: t, dur: 0.025, gain: rand(0.06, 0.12), filter: { type: 'bandpass', freq: rand(1100, 1900), q: 1.2 } },
        { type: 'tone', wave: 'sine', at: t, freq: [rand(140, 210), 90], dur: 0.03, gain: 0.06 },
      ];
    }).flat(),
  },
  // Writing with a pen (the sighting log, the moon chart): a few short scratches.
  pen_scratch: {
    gain: 2.2,
    layers: () => Array.from({ length: 6 }, (_, i) => ({
      type: 'noise', at: i * 0.14 + rand(0, 0.04), dur: rand(0.06, 0.12), gain: rand(0.04, 0.07),
      filter: { type: 'bandpass', freq: rand(3500, 5000), q: 3 }, env: { a: 0.01, d: 0.08, s: 0.4, r: 0.02 },
    })),
  },

  // ---- The piano, delivered ----
  // One middle C, in tune.
  piano_c: { gain: 0.9, echo: 0.3, layers: [{ type: 'notes', inst: 'piano', notes: [['C4', 0, 2.4, 0.8]] }] },
  // Four notes of the rhyme, in tune: its opening (C–F–A–C, Cheryl's home phrase).
  piano_rhyme: {
    gain: 0.9, echo: 0.3,
    layers: [{ type: 'notes', inst: 'piano', notes: [['C4', 0, 0.5, 0.75], ['F4', 0.5, 0.5, 0.75], ['A4', 1, 0.5, 0.75], ['C5', 1.5, 2, 0.85]] }],
  },
};
