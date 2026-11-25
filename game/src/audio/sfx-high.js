// Sounds of Act 5 (docs/design/05-high-and-dry.md, "Audio needed"): the windy, risen city, the
// bucket and the rope, the lighthouse lamp and the disc, the Kid's run, the bronze door, the Bow
// Passage, and the Windlass Room.
// Format as in sfx.js; loops as in sfx-world.js.

const rand = (a, b) => a + Math.random() * (b - a);

// A long metal creak, as in sfx-under.js.
const creak = (t, len, f0, f1, g, res = 700) => ({
  type: 'tone', wave: 'sawtooth', at: t, freq: f0, path: [[len * 0.6, f1], [len, (f0 + f1) / 2]], dur: len, gain: g,
  filter: { type: 'bandpass', freq: res, q: 5 }, env: { a: 0.05, d: len, s: 0.8, r: 0.08 },
});

// A rope taking strain: a short, fibrous creak.
const ropeCreak = (t, g) => ({
  type: 'tone', wave: 'sawtooth', at: t, freq: rand(110, 150), path: [[0.25, rand(160, 210)]], dur: 0.3, gain: g,
  vibrato: { rate: rand(28, 40), depth: 90 }, filter: { type: 'bandpass', freq: 1100, q: 3 }, env: { a: 0.04, d: 0.25, s: 0.6, r: 0.05 },
});

// A moonglass chime (glass instrument notes).
const chime = (t, pitches, gap = 0.1, len = 1.6, vel = 0.6) => ({
  type: 'notes', inst: 'glass', at: t, notes: pitches.map((p, i) => [p, i * gap, len, vel]),
});

// One heavy cloth flap.
const flap = (t, g) => [
  { type: 'noise', at: t, dur: 0.09, gain: g, filter: { type: 'bandpass', freq: [rand(900, 1300), 400], q: 0.9 }, env: { a: 0.004, d: 0.08, s: 0, r: 0.03 } },
  { type: 'tone', wave: 'sine', at: t, freq: [100, 60], dur: 0.06, gain: g * 0.4 },
];

export const HIGH_SFX = {
  // ---- The risen city ----
  // Laundry snapping in the wind on every line in town (loop).
  laundry: {
    gain: 0.8,
    loop: {
      offset: 0.4, period: 0.7, jitter: 1.6,
      layers: () => {
        const n = 1 + Math.floor(Math.random() * 3);
        return Array.from({ length: n }, (_, i) => flap(i * rand(0.08, 0.15), rand(0.06, 0.13))).flat();
      },
    },
  },
  // The surf on the Teeth (loop). Faint at the Harbor at first; raise it with setLoopVolume at each
  // of the three stages (0.35, 0.65, 1).
  surf: {
    gain: 0.9, echo: 0.2,
    loop: {
      beds: [{ type: 'noise', gain: 0.05, filter: { type: 'lowpass', freq: 500 }, lfo: { target: 'gain', rate: 0.12, depth: 0.5 } }],
      offset: 0.5, period: 2.6, jitter: 2.2,
      layers: () => [
        { type: 'noise', dur: rand(1.6, 2.4), gain: rand(0.12, 0.2), filter: { type: 'bandpass', freq: [rand(1800, 2600), rand(500, 700)], q: 0.6, time: 1.8 }, env: { a: 0.5, d: 1.4, s: 0.2, r: 0.5 } },
        { type: 'noise', at: 0.45, dur: 1, gain: rand(0.03, 0.06), filter: { type: 'highpass', freq: 4000 }, env: { a: 0.05, d: 0.9, s: 0, r: 0.2 } },
      ],
    },
  },

  // ---- The bucket and the rope ----
  // Filling the bucket at the Fountain: water drumming into tin, the pitch rising as it fills
  // (about 2.5 s).
  bucket_fill: {
    gain: 0.85,
    layers: [
      { type: 'noise', dur: 2.5, gain: 0.14, filter: { type: 'bandpass', freq: [900, 2200], q: 3, time: 2.4 }, env: { a: 0.05, d: 2.3, s: 0.8, r: 0.15 } },
      { type: 'tone', wave: 'sine', dur: 2.5, freq: 380, path: [[2.4, 900]], gain: 0.04, env: { a: 0.1, d: 2.2, s: 0.7, r: 0.15 } },
      { type: 'tone', wave: 'triangle', freq: 1250, dur: 0.06, gain: 0.08 },
    ],
  },
  // Lowering the full bucket on its handle: the handle creaks, the bucket swings.
  bucket_lower: {
    gain: 2.1,
    layers: [
      creak(0, 0.4, 600, 820, 0.06, 1500),
      creak(0.55, 0.35, 650, 760, 0.05, 1500),
      { type: 'noise', at: 0.2, dur: 0.5, gain: 0.04, filter: { type: 'bandpass', freq: [700, 1100], q: 2, time: 0.5 } },
    ],
  },
  // Pouring the bucket into the Boatman's boat: a glug and a gush, then a small splash.
  pour: {
    gain: 0.85, echo: 0.2,
    layers: () => [
      { type: 'noise', dur: 1.4, gain: 0.16, filter: { type: 'bandpass', freq: [1400, 700], q: 1, time: 1.3 }, env: { a: 0.08, d: 1.2, s: 0.7, r: 0.15 } },
      ...Array.from({ length: 5 }, (_, i) => ({ type: 'tone', wave: 'sine', at: 0.1 + i * 0.2, freq: [rand(200, 300), rand(450, 600)], dur: 0.06, gain: 0.08 })),
      { type: 'noise', at: 1.4, dur: 0.25, gain: 0.12, filter: { type: 'bandpass', freq: [2500, 800], q: 1, time: 0.25 }, env: { a: 0.003, d: 0.2, s: 0, r: 0.05 } },
    ],
  },
  // A small splash.
  splash_small: {
    mono: true, jitter: 150, gain: 0.85,
    layers: [
      { type: 'noise', dur: 0.25, gain: 0.16, filter: { type: 'bandpass', freq: [2600, 800], q: 1, time: 0.22 }, env: { a: 0.003, d: 0.2, s: 0, r: 0.05 } },
      { type: 'tone', wave: 'sine', at: 0.06, freq: [320, 800], dur: 0.04, gain: 0.05 },
    ],
  },
  // A rope coil thrown up and caught: a whirr through the air, then a soft heavy thump.
  rope_throw: {
    gain: 0.85,
    layers: [
      { type: 'noise', dur: 0.5, gain: 0.08, filter: { type: 'bandpass', freq: [500, 1500], q: 2, time: 0.45 }, env: { a: 0.15, d: 0.3, s: 0.3, r: 0.05 } },
      { type: 'tone', wave: 'sine', at: 0.55, freq: [140, 70], dur: 0.15, gain: 0.5 },
      { type: 'noise', at: 0.55, dur: 0.08, gain: 0.15, filter: { type: 'lowpass', freq: 900 } },
    ],
  },
  // The rope creaking under Cheryl's weight: one per hand-over-hand step on the climb.
  rope_creak: {
    mono: true, jitter: 100, gain: 2.0,
    layers: () => [ropeCreak(0, 0.07), { type: 'noise', dur: 0.15, gain: 0.03, filter: { type: 'bandpass', freq: 2500, q: 2 } }],
  },
  // A tin lid prised off (the Shop's brass polish).
  tin_lid: {
    gain: 0.8,
    layers: [
      { type: 'noise', dur: 0.15, gain: 0.08, filter: { type: 'bandpass', freq: 3500, q: 3 } },
      { type: 'tone', wave: 'triangle', at: 0.15, freq: 1750, dur: 0.3, gain: 0.12, env: { a: 0.001, d: 0.28, s: 0, r: 0.05 } },
      { type: 'tone', wave: 'sine', at: 0.15, freq: 1750 * 2.4, dur: 0.15, gain: 0.04 },
      { type: 'tone', wave: 'triangle', at: 0.32, freq: 1600, dur: 0.15, gain: 0.06, env: { a: 0.001, d: 0.14, s: 0, r: 0.03 } },
    ],
  },

  // ---- The lighthouse lamp and the disc ----
  // The great lamp turning: a soft mechanical hum and a slow swell as the beam comes round (loop).
  lamp_hum: {
    gain: 0.8,
    loop: {
      beds: [
        { type: 'tone', wave: 'sine', freq: 98, gain: 0.05, lfo: { target: 'gain', rate: 0.25, depth: 0.35 } },
        { type: 'tone', wave: 'triangle', freq: 196, gain: 0.015, lfo: { target: 'freq', rate: 0.25, depth: 6 } },
        { type: 'noise', gain: 0.012, filter: { type: 'bandpass', freq: 1200, q: 3 }, lfo: { target: 'gain', rate: 0.25, depth: 0.5 } },
      ],
    },
  },
  // The disc drinking the lamp: a rising glassy chime that blooms into a bright chord (about 3 s).
  disc_drink: {
    gain: 0.6, echo: 0.5, duck: 0.2, duckFor: 2.5,
    layers: [
      { type: 'tone', wave: 'sine', freq: 300, path: [[0.8, 1400]], dur: 0.8, gain: 0.06, env: { a: 0.1, d: 0.7, s: 0.6, r: 0.1 } },
      chime(0.1, ['Db5', 'F5', 'Ab5', 'Db6', 'F6', 'Ab6'], 0.11, 2.4, 0.6),
      { type: 'notes', inst: 'bell', at: 0.8, notes: [['Db6', 0, 2.5, 0.6], ['Ab6', 0.05, 2.2, 0.45]] },
      { type: 'noise', at: 0.7, dur: 2, gain: 0.04, filter: { type: 'highpass', freq: 6500 }, env: { a: 0.2, d: 1.8, s: 0, r: 0.2 } },
    ],
  },
  // The disc's glow dimming a step: a soft tone fading away.
  disc_fade: {
    gain: 0.7, echo: 0.5,
    layers: [{ type: 'notes', inst: 'glass', notes: [['Ab5', 0, 1.8, 0.5, -50]] }],
  },

  // ---- The Kid's run ----
  // The Kid winding the egg timer: a quick ratchet (tick-tick-tick).
  timer_wind: {
    gain: 0.8,
    layers: () => Array.from({ length: 9 }, (_, i) => (
      { type: 'tone', wave: 'triangle', at: i * 0.055 + rand(0, 0.01), freq: rand(2700, 3200), dur: 0.01, gain: 0.12 }
    )),
  },
  // A leap off the quay: a rush of air.
  leap: {
    gain: 2.0,
    layers: [{ type: 'noise', dur: 0.45, gain: 0.1, filter: { type: 'bandpass', freq: [600, 1600], q: 1.5, time: 0.4 }, env: { a: 0.08, d: 0.35, s: 0.3, r: 0.05 } }],
  },
  // Landing on mud: a wet splat.
  mud_splat: {
    gain: 0.85,
    layers: [
      { type: 'tone', wave: 'sine', freq: [160, 60], dur: 0.15, gain: 0.5 },
      { type: 'noise', dur: 0.25, gain: 0.2, filter: { type: 'bandpass', freq: [1200, 400], q: 1.2, time: 0.2 }, env: { a: 0.003, d: 0.22, s: 0, r: 0.05 } },
      { type: 'tone', wave: 'sine', at: 0.08, freq: [400, 250], dur: 0.06, gain: 0.06 },
    ],
  },

  // ---- The bronze door ----
  // Barnacles cracking as the door starts to move.
  barnacles_crack: {
    gain: 1.7,
    layers: () => Array.from({ length: 14 }, (_, i) => (
      { type: 'noise', at: i * 0.05 + rand(0, 0.04), dur: 0.02, gain: rand(0.08, 0.16), filter: { type: 'bandpass', freq: rand(2000, 4500), q: 3 } }
    )),
  },
  // The bronze door's long grind inward (about 3 s).
  door_grind: {
    gain: 0.6, echo: 0.4,
    layers: [
      creak(0, 3, 38, 52, 0.18, 450),
      { type: 'noise', dur: 3, gain: 0.14, filter: { type: 'bandpass', freq: [500, 900], q: 1.4, time: 3 }, env: { a: 0.2, d: 2.6, s: 0.8, r: 0.3 } },
      { type: 'tone', wave: 'sine', at: 3, freq: [110, 50], dur: 0.35, gain: 0.5 },
    ],
  },
  // Cyan light spilling out across the mud: a soft shimmer.
  light_spill: {
    gain: 0.6, echo: 0.6,
    layers: [
      chime(0, ['Ab5', 'Db6', 'F6', 'Ab6'], 0.18, 2.4, 0.35),
      { type: 'noise', dur: 2.5, gain: 0.03, filter: { type: 'highpass', freq: 7000 }, env: { a: 0.6, d: 1.5, s: 0.3, r: 0.4 } },
    ],
  },
  // The whole door, in order: barnacles, grind, shimmer (about 4.5 s).
  bronze_door: {
    gain: 0.6, echo: 0.45,
    layers: () => [
      ...Array.from({ length: 14 }, (_, i) => (
        { type: 'noise', at: i * 0.05 + rand(0, 0.04), dur: 0.02, gain: rand(0.08, 0.16), filter: { type: 'bandpass', freq: rand(2000, 4500), q: 3 } }
      )),
      creak(0.5, 3, 38, 52, 0.18, 450),
      { type: 'noise', at: 0.5, dur: 3, gain: 0.14, filter: { type: 'bandpass', freq: [500, 900], q: 1.4, time: 3 }, env: { a: 0.2, d: 2.6, s: 0.8, r: 0.3 } },
      chime(2, ['Ab5', 'Db6', 'F6', 'Ab6'], 0.18, 2.4, 0.3),
    ],
  },

  // ---- The Bow Passage and the Windlass Room ----
  // One moonglass lamp waking.
  lamp_wake: {
    gain: 0.7, echo: 0.5,
    layers: () => [chime(0, [['Db6', 'F6', 'Ab6', 'Eb6'][Math.floor(Math.random() * 4)]], 0, 1.6, 0.5)],
  },
  // The Bow Passage's lamps waking one by one, going away east down the passage (about 3 s).
  lamps_wake: {
    gain: 0.7, echo: 0.55,
    layers: () => ['Db6', 'Ab5', 'F6', 'Db6', 'Ab5', 'Eb6', 'Db6'].map((p, i) => ({
      type: 'notes', inst: 'glass', at: i * 0.42, gain: Math.pow(0.78, i), notes: [[p, 0, 1.5, 0.55]],
    })),
  },
  // The chain's deep, slow creak (loop; louder near the Windlass with setLoopVolume).
  chain_creak: {
    gain: 0.85, echo: 0.4,
    loop: {
      offset: 1, period: 4.5, jitter: 3,
      layers: () => [creak(0, rand(1.5, 2.5), rand(22, 28), rand(32, 40), 0.18, rand(250, 350))],
    },
  },
  // Wind through the hawse: a hollow, breathy note (loop).
  hawse_wind: {
    gain: 1.7,
    loop: {
      beds: [
        { type: 'noise', gain: 0.06, filter: { type: 'bandpass', freq: 330, q: 9 }, lfo: { target: 'gain', rate: 0.15, depth: 0.6 } },
        { type: 'noise', gain: 0.03, filter: { type: 'bandpass', freq: 660, q: 6 }, lfo: { target: 'filter', rate: 0.1, depth: 60 } },
        { type: 'noise', gain: 0.04, filter: { type: 'lowpass', freq: 300 }, lfo: { target: 'gain', rate: 0.15, depth: 0.5 } },
      ],
    },
  },
  // The drum creaking and giving a little with a gust: one strain.
  drum_creak: {
    gain: 0.8, echo: 0.4,
    layers: () => [
      creak(0, 1.5, rand(26, 32), rand(36, 44), 0.2, 380),
      { type: 'tone', wave: 'sine', at: 1.4, freq: [90, 45], dur: 0.25, gain: 0.3 },
      ...Array.from({ length: 3 }, (_, i) => ({ type: 'tone', wave: 'triangle', at: 1.45 + i * 0.07, freq: rand(1300, 2200), dur: 0.04, gain: 0.04 })),
    ],
  },
  // The drum straining with every gust, until the clapper seats (loop). Stop it at clapper_seat.
  drum_strain: {
    gain: 0.8, echo: 0.4,
    loop: {
      offset: 1.5, period: 5, jitter: 4,
      layers: () => [
        creak(0, 1.5, rand(26, 32), rand(36, 44), 0.18, 380),
        { type: 'tone', wave: 'sine', at: 1.4, freq: [90, 45], dur: 0.25, gain: 0.25 },
      ],
    },
  },
  // Levering the sheared Tooth's stump out with the crowbar: a grind, a crack, and a clang as it falls.
  stump_lever: {
    gain: 0.6, echo: 0.4,
    layers: [
      creak(0, 1, 50, 70, 0.15, 600),
      { type: 'noise', dur: 1, gain: 0.12, filter: { type: 'bandpass', freq: [1500, 900], q: 2, time: 1 }, env: { a: 0.1, d: 0.9, s: 0.8, r: 0.05 } },
      { type: 'noise', at: 1.05, dur: 0.05, gain: 0.5, filter: { type: 'highpass', freq: 800 }, env: { a: 0.001, d: 0.05, s: 0, r: 0.01 } },
      { type: 'tone', wave: 'sine', at: 1.05, freq: [90, 40], dur: 0.3, gain: 0.5 },
      { type: 'tone', wave: 'sine', at: 1.5, freq: 247, dur: 1.4, gain: 0.25, env: { a: 0.001, d: 1.3, s: 0, r: 0.1 } },
      { type: 'tone', wave: 'sine', at: 1.5, freq: 247 * 2.32, dur: 0.7, gain: 0.12, env: { a: 0.001, d: 0.6, s: 0, r: 0.1 } },
      { type: 'tone', wave: 'sine', at: 1.5, freq: [140, 60], dur: 0.2, gain: 0.4 },
    ],
  },
  // The clapper dropping into the socket: a deep, solid clunk, and the drum settling against it.
  clapper_seat: {
    gain: 0.75, echo: 0.45, duck: 0.3, duckFor: 2,
    layers: [
      { type: 'tone', wave: 'sine', freq: [110, 45], dur: 0.5, gain: 0.8 },
      { type: 'noise', dur: 0.08, gain: 0.25, filter: { type: 'lowpass', freq: 700 } },
      { type: 'tone', wave: 'sine', freq: 138.6, dur: 2.5, gain: 0.12, env: { a: 0.002, d: 2.4, s: 0, r: 0.2 } },
      creak(0.3, 1.2, 34, 28, 0.08, 300),
    ],
  },
  // The speaking tube up to the town: wind and gulls, and very far off the Mayor declaiming (loop).
  tube_wind: {
    gain: 2.1, echo: 0.5,
    loop: {
      beds: [{ type: 'noise', gain: 0.04, filter: { type: 'bandpass', freq: 700, q: 4 }, lfo: { target: 'gain', rate: 0.2, depth: 0.6 } }],
      offset: 1, period: 2.5, jitter: 3,
      layers: () => {
        if (Math.random() < 0.35) { // a gull, thin and far
          const f = rand(1100, 1300);
          return [{ type: 'tone', wave: 'sawtooth', freq: f, path: [[0.07, f * 1.5], [0.35, f * 0.85]], dur: 0.35, gain: 0.02, filter: { type: 'bandpass', freq: 1500, q: 4 } }];
        }
        // The Mayor, a few declaiming syllables, small and hollow.
        return Array.from({ length: 3 + Math.floor(Math.random() * 3) }, (_, i) => {
          const f = rand(160, 230);
          return { type: 'tone', wave: 'sawtooth', at: i * rand(0.18, 0.28), freq: f, path: [[0.15, f * rand(0.9, 1.2)]], dur: 0.17, gain: 0.03,
            filter: { type: 'bandpass', freq: 750, q: 6 }, env: { a: 0.02, d: 0.15, s: 0.6, r: 0.04 } };
        });
      },
    },
  },
};
