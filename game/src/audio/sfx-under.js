// Sounds of the underground: the Founders' hullstone halls, bronze fittings, moonglass, and the
// machines (pumps, valves, chains, the Tide Wheel, water). Downstairs everything is harder and
// rings longer than on the surface, so most of these send generously to the echo.
// Format as in sfx.js; loops as in sfx-world.js.

const rand = (a, b) => a + Math.random() * (b - a);

// Bronze: a struck metal partial set (inharmonic), used for clanks and rungs.
const bronze = (t, f, g, d = 0.5) => [
  { type: 'tone', wave: 'sine', at: t, freq: f, dur: d, gain: g, env: { a: 0.001, d, s: 0, r: 0.1 } },
  { type: 'tone', wave: 'sine', at: t, freq: f * 2.32, dur: d * 0.6, gain: g * 0.5, env: { a: 0.001, d: d * 0.6, s: 0, r: 0.05 } },
  { type: 'tone', wave: 'sine', at: t, freq: f * 3.87, dur: d * 0.3, gain: g * 0.3, env: { a: 0.001, d: d * 0.3, s: 0, r: 0.05 } },
  { type: 'noise', at: t, dur: 0.02, gain: g * 0.6, filter: { type: 'bandpass', freq: f * 3, q: 2 } },
];

// A long metal creak: stick-slip pulses through a resonance (valves, hatches, the wheel).
const creak = (t, len, f0, f1, g, res = 700) => ({
  type: 'tone', wave: 'sawtooth', at: t, freq: f0, path: [[len * 0.6, f1], [len, (f0 + f1) / 2]], dur: len, gain: g,
  filter: { type: 'bandpass', freq: res, q: 5 }, env: { a: 0.05, d: len, s: 0.8, r: 0.08 },
});

// A chain link clinking against another.
const link = (t, g) => [
  { type: 'tone', wave: 'triangle', at: t, freq: rand(1400, 2600), dur: 0.05, gain: g },
  { type: 'tone', wave: 'sine', at: t, freq: rand(180, 260), dur: 0.08, gain: g * 1.4 },
  { type: 'noise', at: t, dur: 0.02, gain: g * 0.5, filter: { type: 'bandpass', freq: 3500, q: 2 } },
];

// A moonglass chime: notes on the glass instrument (D-flat, the hidden city's chord).
const chime = (t, pitches, gap = 0.09, len = 1.6, vel = 0.7) => ({
  type: 'notes', inst: 'glass', at: t, notes: pitches.map((p, i) => [p, i * gap, len, vel]),
});

export const UNDER_SFX = {
  // ---- Moving about ----
  // A footstep on hullstone plates: hard, short, with a little ring.
  step_hullstone: {
    mono: true, jitter: 150, gain: 0.8, echo: 0.3,
    layers: [
      { type: 'tone', wave: 'triangle', freq: [620, 420], dur: 0.025, gain: 0.1 },
      { type: 'noise', dur: 0.03, gain: 0.16, filter: { type: 'bandpass', freq: 1700, q: 1.4 } },
      { type: 'tone', wave: 'sine', freq: [150, 95], dur: 0.05, gain: 0.16 },
    ],
  },
  // A hand or foot on a bronze ladder rung.
  step_rung: { mono: true, jitter: 120, gain: 0.7, echo: 0.3, layers: () => bronze(0, rand(480, 560), 0.12, 0.35) },
  // Prying a jammed bronze lid with the crowbar: a squeal, a strain, then it gives.
  lid_pry: {
    gain: 0.6, echo: 0.3,
    layers: [
      creak(0, 0.6, 900, 1300, 0.07, 1500),
      { type: 'noise', dur: 0.6, gain: 0.08, filter: { type: 'bandpass', freq: [2000, 3500], q: 3, time: 0.6 } },
      ...bronze(0.65, 330, 0.35, 0.8),
      { type: 'tone', wave: 'sine', at: 0.65, freq: [110, 60], dur: 0.2, gain: 0.35 },
    ],
  },
  // A heavy bronze hatch: the hinge groans, then it lands open with a hollow clang.
  hatch_open: {
    gain: 0.6, echo: 0.4,
    layers: [
      creak(0, 0.7, 60, 90, 0.16, 500),
      ...bronze(0.75, 196, 0.4, 1.2),
      { type: 'tone', wave: 'sine', at: 0.75, freq: [90, 45], dur: 0.35, gain: 0.5 },
    ],
  },
  // Daylight comes down a light shaft: air, and the moonglass inlays waking in a rising shimmer.
  light_beam: {
    gain: 0.7, echo: 0.5,
    layers: [
      { type: 'noise', dur: 1.6, gain: 0.08, filter: { type: 'bandpass', freq: [600, 3000], q: 1.5, time: 1.4 }, env: { a: 0.6, d: 0.8, s: 0.4, r: 0.4 } },
      chime(0.3, ['Db5', 'F5', 'Ab5', 'Db6', 'F6'], 0.12, 1.8, 0.5),
    ],
  },
  // A bronze mirror pivoting on its post, then clicking into place.
  mirror_turn: {
    gain: 0.75, echo: 0.3,
    layers: [
      creak(0, 0.5, 80, 110, 0.12, 900),
      { type: 'noise', dur: 0.5, gain: 0.06, filter: { type: 'bandpass', freq: 1800, q: 2 }, env: { a: 0.05, d: 0.45, s: 0.7, r: 0.05 } },
      ...bronze(0.52, 880, 0.12, 0.25),
    ],
  },
  // A moon-lock opening: its glass eye fills with light (a chime), the bolt slides, a low hum swells.
  moonlock_open: {
    gain: 0.55, echo: 0.5, duck: 0.4, duckFor: 1.5,
    layers: [
      chime(0, ['Ab4', 'Db5', 'F5', 'Ab5', 'C6'], 0.1, 2, 0.6),
      { type: 'tone', wave: 'sine', freq: 69.3, dur: 2, gain: 0.15, env: { a: 0.6, d: 1, s: 0.8, r: 0.6 } },
      { type: 'noise', at: 0.7, dur: 0.3, gain: 0.12, filter: { type: 'bandpass', freq: [600, 300], q: 2, time: 0.3 } },
      ...bronze(1, 220, 0.25, 0.7),
    ],
  },
  // The moonglass disc lighting up in Cheryl's hand: a soft swell and shimmer.
  disc_glow: {
    gain: 0.75, echo: 0.5,
    layers: [
      chime(0, ['Db5', 'Ab5', 'F6'], 0.15, 2.4, 0.45),
      { type: 'noise', dur: 1.8, gain: 0.03, filter: { type: 'highpass', freq: 6000 }, env: { a: 0.8, d: 0.8, s: 0.4, r: 0.4 } },
    ],
  },
  // The chute: a long smooth slide down hullstone, then a bump at the bottom.
  chute_slide: {
    gain: 0.75, echo: 0.35,
    layers: [
      { type: 'noise', dur: 2, gain: 0.2, filter: { type: 'bandpass', freq: [1800, 300], q: 1.2, time: 2 }, env: { a: 0.1, d: 1.8, s: 0.7, r: 0.1 } },
      { type: 'tone', wave: 'sine', freq: 300, path: [[2, 90]], dur: 2, gain: 0.04 },
      { type: 'tone', wave: 'sine', at: 2.05, freq: [140, 55], dur: 0.25, gain: 0.55 },
      { type: 'noise', at: 2.05, dur: 0.1, gain: 0.2, filter: { type: 'lowpass', freq: 900 } },
    ],
  },
  // Kicking the bronze ladder down: a scrape, a long drop, a big clang, and its rattle.
  ladder_kick: {
    gain: 0.45, echo: 0.45,
    layers: [
      { type: 'noise', dur: 0.3, gain: 0.15, filter: { type: 'bandpass', freq: [2500, 1200], q: 2, time: 0.3 } },
      ...bronze(0.45, 260, 0.5, 1.5),
      ...bronze(0.47, 390, 0.25, 1),
      { type: 'tone', wave: 'sine', at: 0.45, freq: [100, 50], dur: 0.3, gain: 0.5 },
      ...[0.65, 0.8, 0.92, 1.0].flatMap((t, i) => bronze(t, rand(400, 600), 0.1 * (1 - i / 5), 0.3)),
    ],
  },
  // A voice coming down a speaking tube from far above: hollow, muffled, two syllables
  // (for "The FOUNTAIN!"; the words are in the dialog box).
  tube_voice: {
    gain: 2.4, echo: 0.6,
    layers: [
      { type: 'tone', wave: 'sawtooth', freq: 240, path: [[0.25, 290]], dur: 0.28, gain: 0.1, filter: { type: 'bandpass', freq: 700, q: 6 }, vibrato: { rate: 6, depth: 30 }, env: { a: 0.03, d: 0.25, s: 0.8, r: 0.05 } },
      { type: 'tone', wave: 'sawtooth', at: 0.33, freq: 330, path: [[0.45, 250]], dur: 0.5, gain: 0.12, filter: { type: 'bandpass', freq: 650, q: 6 }, vibrato: { rate: 6, depth: 30 }, env: { a: 0.03, d: 0.45, s: 0.8, r: 0.08 } },
      { type: 'noise', dur: 0.9, gain: 0.02, filter: { type: 'bandpass', freq: 600, q: 4 } },
    ],
  },

  // ---- Valves and water ----
  // Turning a big bronze valve wheel: a ratchet of clicks under a groan.
  valve_turn: {
    gain: 0.75, echo: 0.35,
    layers: () => [
      creak(0, 1.4, 50, 75, 0.14, 450),
      ...Array.from({ length: 8 }, (_, i) => bronze(0.1 + i * 0.16 + rand(0, 0.03), rand(700, 850), 0.06, 0.12)).flat(),
      ...bronze(1.45, 300, 0.25, 0.6),
    ],
  },
  // A valve wheel jamming: it lurches, strains, and stops dead with a tink.
  valve_jam: {
    gain: 0.75, echo: 0.35,
    layers: [
      { type: 'tone', wave: 'sine', freq: [130, 60], dur: 0.2, gain: 0.45 },
      ...bronze(0, 250, 0.25, 0.5),
      creak(0.15, 0.6, 70, 55, 0.12, 600),
      ...bronze(0.85, 1760, 0.06, 0.4),
    ],
  },
  // Water gushing from a broken pipe (loop).
  water_gush: {
    gain: 0.85,
    loop: {
      beds: [
        { type: 'noise', gain: 0.18, filter: { type: 'bandpass', freq: 900, q: 0.5 }, lfo: { target: 'filter', rate: 0.9, depth: 250 } },
        { type: 'noise', gain: 0.12, filter: { type: 'lowpass', freq: 280 } },
        { type: 'noise', gain: 0.04, filter: { type: 'highpass', freq: 4500 }, lfo: { target: 'gain', rate: 4, depth: 0.3 } },
      ],
      period: 0.12, jitter: 0.2,
      layers: () => [{ type: 'tone', wave: 'sine', freq: [rand(250, 500), rand(700, 1100)], dur: 0.04, gain: rand(0.02, 0.05) }],
    },
  },
  // Water draining away somewhere far off: a long, deep gurgle.
  far_gurgle: {
    gain: 0.85, echo: 0.6,
    layers: () => {
      const out = [{ type: 'noise', dur: 3, gain: 0.12, filter: { type: 'bandpass', freq: [500, 150], q: 4, time: 3 }, env: { a: 0.4, d: 2.5, s: 0.4, r: 0.4 } }];
      for (let i = 0; i < 12; i++) {
        const f = rand(90, 220);
        out.push({ type: 'tone', wave: 'sine', at: 0.3 + i * 0.22 + rand(0, 0.1), freq: [f, f * 2], dur: 0.08, gain: rand(0.04, 0.08) * (1 - i / 16) });
      }
      return out;
    },
  },
  // Drips in the dark, one every few seconds (loop).
  drips: {
    gain: 0.7, echo: 0.6,
    loop: {
      offset: 0.5, period: 1.4, jitter: 3,
      layers: () => {
        const f = rand(1400, 2400);
        return [{ type: 'tone', wave: 'sine', freq: f, path: [[0.05, f * 0.55]], dur: 0.06, gain: rand(0.03, 0.07) }];
      },
    },
  },
  // The hull itself (loop): a low drone you feel more than hear, and now and then a deep creak.
  hull: {
    gain: 0.9, echo: 0.4,
    loop: {
      beds: [
        { type: 'tone', wave: 'sine', freq: 55, gain: 0.07, lfo: { target: 'gain', rate: 0.07, depth: 0.4 } },
        { type: 'noise', gain: 0.05, filter: { type: 'lowpass', freq: 140 }, lfo: { target: 'gain', rate: 0.05, depth: 0.5 } },
      ],
      offset: 4, period: 7, jitter: 8,
      layers: () => [creak(0, rand(1.2, 2.2), rand(25, 35), rand(40, 55), 0.12, rand(300, 500))],
    },
  },

  // ---- The machines ----
  // A pump running (loop): a heavy chug, the gasp of water through a valve, a clack.
  pump_run: {
    gain: 0.6, echo: 0.3,
    loop: {
      beds: [{ type: 'tone', wave: 'sawtooth', freq: 41, gain: 0.05, lfo: { target: 'gain', rate: 1.1, depth: 0.5 } }],
      period: 0.9,
      layers: () => [
        { type: 'tone', wave: 'sine', freq: [95, 50], dur: 0.25, gain: 0.45 },
        { type: 'noise', at: 0.15, dur: 0.4, gain: 0.12, filter: { type: 'bandpass', freq: [400, 900], q: 1.5, time: 0.35 }, env: { a: 0.1, d: 0.3, s: 0.3, r: 0.1 } },
        ...bronze(0.55, rand(600, 680), 0.05, 0.15),
      ],
    },
  },
  // A pump coughing and stopping (the wrong order): a few ragged chugs, a hiss, a clunk.
  pump_cough: {
    gain: 0.8, echo: 0.35,
    layers: [
      ...[0, 0.55, 0.95, 1.5].flatMap((t, i) => [
        { type: 'tone', wave: 'sine', at: t, freq: [95 - i * 8, 45], dur: 0.25, gain: 0.45 * (1 - i * 0.18) },
        { type: 'noise', at: t + 0.1, dur: 0.25, gain: 0.1, filter: { type: 'bandpass', freq: 600, q: 1.5 } },
      ]),
      { type: 'noise', at: 1.8, dur: 0.9, gain: 0.1, filter: { type: 'highpass', freq: 3000 }, env: { a: 0.01, d: 0.8, s: 0, r: 0.1 } },
      ...bronze(2.1, 180, 0.3, 0.8),
    ],
  },
  // A length of heavy chain rattling (about 1.2 s).
  chain_rattle: {
    gain: 0.75, echo: 0.35,
    layers: () => Array.from({ length: 16 }, (_, i) => link(i * 0.07 + rand(0, 0.04), 0.08 * (1 - i / 24))).flat(),
  },
  // Chain hauling in link by link over a drum (loop).
  chain_haul: {
    gain: 0.75, echo: 0.3,
    loop: {
      beds: [{ type: 'noise', gain: 0.03, filter: { type: 'lowpass', freq: 200 } }],
      period: 0.42,
      layers: () => [...link(0, 0.09), ...link(rand(0.05, 0.1), 0.05), { type: 'tone', wave: 'sine', freq: [70, 45], dur: 0.15, gain: 0.25 }],
    },
  },
  // The Tide Wheel turning (loop): a huge slow rumble, a groan on each spoke, and water.
  tide_wheel: {
    gain: 0.85, echo: 0.4,
    loop: {
      beds: [
        { type: 'tone', wave: 'sawtooth', freq: 32, gain: 0.12, lfo: { target: 'gain', rate: 0.45, depth: 0.4 } },
        { type: 'noise', gain: 0.07, filter: { type: 'bandpass', freq: 500, q: 0.6 }, lfo: { target: 'filter', rate: 0.45, depth: 200 } },
      ],
      period: 2.2,
      layers: () => [
        creak(0, 1.2, rand(28, 34), rand(42, 50), 0.16, 380),
        { type: 'noise', at: 0.6, dur: 1.2, gain: 0.1, filter: { type: 'bandpass', freq: [900, 400], q: 1, time: 1.2 }, env: { a: 0.3, d: 0.8, s: 0.2, r: 0.3 } },
      ],
    },
  },
};
