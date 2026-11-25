// Sounds of the world: footsteps, puzzle objects, ambience, and the Wrongness.
// Format as in sfx.js. Many of these are functions so each play is a little different.
// Loops: { loop: { beds: [continuous sounds], layers, period, jitter, offset } } (see
// startLoopOn in index.js and startBed in synth.js).

const rand = (a, b) => a + Math.random() * (b - a);
const pick = (xs) => xs[Math.floor(Math.random() * xs.length)];

// ---- Footsteps ----
// One per step. All are `mono` with pitch jitter so a walk doesn't sound like a machine.
const step = (layers, jitter = 220, gain = 0.8) => ({ mono: true, jitter, gain, layers });

const FOOTSTEPS = {
  // Cobbles and stone paving outdoors (Cistern Court).
  step_stone: step([
    { type: 'noise', dur: 0.035, gain: 0.22, filter: { type: 'bandpass', freq: 1100, q: 1.1 } },
    { type: 'tone', wave: 'sine', freq: [140, 90], dur: 0.04, gain: 0.18 },
  ]),
  // Whitewashed plaster roof: flatter, a little gritty.
  step_plaster: step([
    { type: 'noise', dur: 0.04, gain: 0.2, filter: { type: 'bandpass', freq: 1500, q: 0.8 } },
    { type: 'noise', at: 0.012, dur: 0.03, gain: 0.05, filter: { type: 'highpass', freq: 5000 } },
    { type: 'tone', wave: 'sine', freq: [120, 85], dur: 0.035, gain: 0.12 },
  ]),
  // Terracotta tile indoors: a hard little clack.
  step_tile: step([
    { type: 'tone', wave: 'triangle', freq: [950, 700], dur: 0.018, gain: 0.12 },
    { type: 'noise', dur: 0.025, gain: 0.16, filter: { type: 'bandpass', freq: 2200, q: 1.6 } },
    { type: 'tone', wave: 'sine', freq: [170, 110], dur: 0.03, gain: 0.12 },
  ], 180),
  // The rug: soft and muffled.
  step_rug: step([
    { type: 'noise', dur: 0.06, gain: 0.55, filter: { type: 'lowpass', freq: 450 }, env: { a: 0.01, d: 0.05, s: 0, r: 0.02 } },
    { type: 'tone', wave: 'sine', freq: [110, 80], dur: 0.04, gain: 0.08 },
  ], 150),
  // Stone stairs: a heavier footfall with a scuff.
  step_stairs: step([
    { type: 'tone', wave: 'sine', freq: [130, 70], dur: 0.06, gain: 0.25 },
    { type: 'noise', dur: 0.04, gain: 0.2, filter: { type: 'bandpass', freq: 950, q: 1 } },
    { type: 'noise', at: 0.05, dur: 0.07, gain: 0.05, filter: { type: 'bandpass', freq: 2600, q: 1.5 }, env: { a: 0.02, d: 0.05, s: 0, r: 0.02 } },
  ]),
  // Wooden boards: a hollow knock.
  step_wood: step([
    { type: 'tone', wave: 'sine', freq: [190, 150], dur: 0.07, gain: 0.22 },
    { type: 'tone', wave: 'triangle', freq: 430, dur: 0.025, gain: 0.07 },
    { type: 'noise', dur: 0.03, gain: 0.12, filter: { type: 'bandpass', freq: 750, q: 1.4 } },
  ]),
  // The Sweaty Kid's quick, light feet: one step.
  step_kid: step([
    { type: 'noise', dur: 0.022, gain: 0.14, filter: { type: 'bandpass', freq: 1700, q: 1.2 } },
    { type: 'tone', wave: 'sine', freq: [210, 140], dur: 0.025, gain: 0.08 },
  ], 300, 0.7),
};

// ---- Puzzle objects and characters (the opening) ----
const PUZZLE = {
  // A whole patter of the Kid running past (about half a second).
  kid_patter: {
    gain: 0.7,
    layers: () => Array.from({ length: 6 }, (_, i) => {
      const t = i * 0.085 + rand(-0.008, 0.008);
      const f = rand(1500, 2000);
      return [
        { type: 'noise', at: t, dur: 0.022, gain: 0.13 * (0.7 + 0.3 * (i % 2)), filter: { type: 'bandpass', freq: f, q: 1.2 } },
        { type: 'tone', wave: 'sine', at: t, freq: [210, 140], dur: 0.025, gain: 0.07 },
      ];
    }).flat(),
  },
  // The Kid hops the hurdle: a springy rise, then a two-footed landing.
  kid_hop: {
    gain: 0.8,
    layers: [
      { type: 'tone', wave: 'pulse25', freq: [300, 900], dur: 0.14, gain: 0.07, filter: { freq: 2500 } },
      { type: 'noise', dur: 0.1, gain: 0.04, filter: { type: 'bandpass', freq: [800, 2500], q: 1.5 } },
      { type: 'tone', wave: 'sine', at: 0.3, freq: [160, 80], dur: 0.06, gain: 0.25 },
      { type: 'noise', at: 0.3, dur: 0.035, gain: 0.18, filter: { type: 'bandpass', freq: 1200, q: 1 } },
      { type: 'noise', at: 0.33, dur: 0.03, gain: 0.12, filter: { type: 'bandpass', freq: 1500, q: 1 } },
    ],
  },
  // The roof standpipe tap: a stiff valve, two squeaks.
  tap_squeak: {
    gain: 1.9,
    layers: [
      { type: 'tone', wave: 'sawtooth', freq: 900, path: [[0.08, 1500], [0.2, 1250]], dur: 0.2, gain: 0.08,
        vibrato: { rate: 31, depth: 70 }, filter: { type: 'bandpass', freq: 1400, q: 4 }, env: { a: 0.02, d: 0.2, s: 0.7, r: 0.03 } },
      { type: 'tone', wave: 'sawtooth', at: 0.3, freq: 1100, path: [[0.1, 1650]], dur: 0.12, gain: 0.07,
        vibrato: { rate: 37, depth: 60 }, filter: { type: 'bandpass', freq: 1500, q: 4 }, env: { a: 0.015, d: 0.1, s: 0.6, r: 0.03 } },
      { type: 'tone', wave: 'triangle', at: 0.44, freq: [600, 400], dur: 0.03, gain: 0.1 },
    ],
  },
  // Water running into the tub (loop). Start with startLoop('water_pour'), stop when it's full.
  water_pour: {
    gain: 0.9,
    loop: {
      beds: [
        { type: 'noise', gain: 0.13, filter: { type: 'bandpass', freq: 1100, q: 0.6 }, lfo: { target: 'filter', rate: 0.7, depth: 300 } },
        { type: 'noise', gain: 0.045, filter: { type: 'highpass', freq: 4000 }, lfo: { target: 'gain', rate: 3.1, depth: 0.4 } },
        { type: 'noise', gain: 0.08, filter: { type: 'lowpass', freq: 350 } },
      ],
      period: 0.08, jitter: 0.14,
      layers: () => {
        const f = rand(350, 700);
        return [{ type: 'tone', wave: 'sine', freq: [f, f * rand(1.8, 2.6)], dur: rand(0.03, 0.06), gain: rand(0.02, 0.05) }];
      },
    },
  },
  // The tub is full: the water settles with a last slosh and a drip.
  tub_full: {
    gain: 1.6, echo: 0.15,
    layers: [
      { type: 'noise', dur: 0.5, gain: 0.16, filter: { type: 'bandpass', freq: [900, 350], q: 1 }, env: { a: 0.02, d: 0.4, s: 0, r: 0.1 } },
      { type: 'tone', wave: 'sine', at: 0.1, freq: [260, 480], dur: 0.06, gain: 0.08 },
      { type: 'tone', wave: 'sine', at: 0.25, freq: [200, 380], dur: 0.07, gain: 0.07 },
      { type: 'tone', wave: 'sine', at: 0.7, freq: [1900, 1300], dur: 0.05, gain: 0.07 },
    ],
  },
  // A wooden chess piece set down on the board.
  chess_tap: {
    mono: true, jitter: 120, gain: 0.8,
    layers: [
      { type: 'tone', wave: 'triangle', freq: [1900, 1700], dur: 0.025, gain: 0.18 },
      { type: 'noise', dur: 0.015, gain: 0.1, filter: { type: 'bandpass', freq: 3000, q: 3 } },
      { type: 'tone', wave: 'sine', freq: [420, 300], dur: 0.03, gain: 0.08 },
    ],
  },
  // A pepper mill turning: a crunchy ratchet, about 0.8 s.
  pepper_grind: {
    gain: 1.5,
    layers: () => {
      const out = [];
      for (let i = 0; i < 14; i++) {
        const t = i * 0.055 + rand(0, 0.015);
        out.push({ type: 'noise', at: t, dur: rand(0.02, 0.04), gain: rand(0.08, 0.16), filter: { type: 'bandpass', freq: rand(2500, 5500), q: 2 } });
        if (i % 3 === 0) out.push({ type: 'tone', wave: 'triangle', at: t, freq: rand(1300, 1600), dur: 0.012, gain: 0.05 });
      }
      return out;
    },
  },
  // The Old Man sneezes: ah… ah… CHOO.
  sneeze: {
    gain: 0.8,
    layers: [
      { type: 'tone', wave: 'sawtooth', freq: 300, path: [[0.35, 390]], dur: 0.35, gain: 0.07, filter: { type: 'bandpass', freq: 850, q: 3 }, env: { a: 0.08, d: 0.3, s: 0.8, r: 0.06 } },
      { type: 'noise', dur: 0.35, gain: 0.03, filter: { type: 'bandpass', freq: 1500, q: 1 }, env: { a: 0.1, d: 0.3, s: 0.8, r: 0.06 } },
      { type: 'tone', wave: 'sawtooth', at: 0.55, freq: 380, path: [[0.3, 520]], dur: 0.3, gain: 0.08, filter: { type: 'bandpass', freq: 950, q: 3 }, env: { a: 0.06, d: 0.25, s: 0.8, r: 0.05 } },
      { type: 'noise', at: 0.55, dur: 0.3, gain: 0.035, filter: { type: 'bandpass', freq: 1600, q: 1 }, env: { a: 0.08, d: 0.25, s: 0.8, r: 0.05 } },
      { type: 'noise', at: 1.05, dur: 0.22, gain: 0.4, filter: { type: 'bandpass', freq: [3500, 2200], q: 0.9 }, env: { a: 0.004, d: 0.2, s: 0, r: 0.05 } },
      { type: 'tone', wave: 'sawtooth', at: 1.05, freq: [320, 170], dur: 0.2, gain: 0.12, filter: { type: 'bandpass', freq: 700, q: 2 } },
    ],
  },
  // The egg timer ticking (loop): tick, tock.
  timer_tick: {
    gain: 0.8,
    loop: {
      period: 0.21,
      layers: (n) => [
        { type: 'tone', wave: 'triangle', freq: n % 2 ? 2900 : 3400, dur: 0.008, gain: 0.12 },
        { type: 'noise', dur: 0.006, gain: 0.06, filter: { type: 'bandpass', freq: n % 2 ? 4200 : 5000, q: 3 } },
      ],
    },
  },
  // The egg timer goes off: a clunk and a bright little bell.
  timer_ding: {
    gain: 0.75, echo: 0.2,
    layers: [
      { type: 'noise', dur: 0.03, gain: 0.12, filter: { type: 'lowpass', freq: 900 } },
      { type: 'tone', wave: 'sine', at: 0.03, freq: 2637, dur: 1.2, gain: 0.25, vibrato: { rate: 26, depth: 9 }, env: { a: 0.002, d: 1.1, s: 0, r: 0.2 } },
      { type: 'tone', wave: 'sine', at: 0.03, freq: 2637 * 2.76, dur: 0.3, gain: 0.05, env: { a: 0.001, d: 0.25, s: 0, r: 0.05 } },
      { type: 'tone', wave: 'sine', at: 0.03, freq: 2637 * 0.5, dur: 0.9, gain: 0.06, env: { a: 0.002, d: 0.8, s: 0, r: 0.1 } },
    ],
  },
  // Sheets flapping on the line: three soft whumps of cloth.
  sheets_flap: {
    gain: 1.6,
    layers: () => [0, 0.2, 0.33].map((t, i) => [
      { type: 'noise', at: t + rand(0, 0.03), dur: 0.12, gain: 0.2 - i * 0.04, filter: { type: 'bandpass', freq: [rand(600, 800), 280], q: 0.8 }, env: { a: 0.006, d: 0.1, s: 0, r: 0.04 } },
      { type: 'tone', wave: 'sine', at: t, freq: [110, 60], dur: 0.08, gain: 0.08 },
    ]).flat(),
  },
  // One piano key in the Squeeze: an A, a little flat, that hangs in the air.
  piano_flat: {
    gain: 0.9, echo: 0.3,
    layers: [{ type: 'notes', inst: 'piano', notes: [['A4', 0, 2.2, 0.85, -12, -38]] }],
  },
  // Doors, separately (the map exits use `door`, which is both).
  door_open: {
    gain: 1.6,
    layers: [
      { type: 'tone', wave: 'triangle', freq: 'C6', dur: 0.02, gain: 0.15 },
      { type: 'tone', wave: 'sawtooth', at: 0.04, freq: [95, 135], sweep: 0.35, curve: 'linear', dur: 0.35, gain: 0.12,
        vibrato: { rate: 21, depth: 90 }, filter: { type: 'bandpass', freq: 900, q: 3 }, env: { a: 0.05, d: 0.35, s: 0.8, r: 0.05 } },
    ],
  },
  door_close: {
    gain: 0.65,
    layers: [
      { type: 'tone', wave: 'sine', freq: [120, 55], dur: 0.16, gain: 0.6 },
      { type: 'noise', dur: 0.08, gain: 0.2, filter: { type: 'lowpass', freq: 600 } },
      { type: 'tone', wave: 'triangle', at: 0.05, freq: 'G6', dur: 0.02, gain: 0.12 },
    ],
  },
};

// ---- Ambience ----
const AMBIENCE = {
  // Swifts screaming past at dusk (about two seconds).
  swifts: {
    gain: 1.2, echo: 0.25,
    layers: () => {
      const out = [];
      const n = 6 + Math.floor(Math.random() * 3);
      for (let i = 0; i < n; i++) {
        const t = i * 0.26 + rand(0, 0.12);
        const f = rand(5200, 6800);
        const fade = Math.sin(Math.PI * (i + 0.5) / n); // passing by: loudest in the middle
        out.push({ type: 'tone', wave: 'triangle', at: t, freq: [f, f * 0.82], dur: rand(0.18, 0.35), gain: 0.05 * fade,
          vibrato: { rate: rand(45, 60), depth: 140 }, env: { a: 0.02, d: 0.3, s: 0.6, r: 0.05 } });
      }
      return out;
    },
  },
  // The festival in the city below, far off (loop). Stop it dead at moonrise: stopLoop('crowd', 0).
  crowd: {
    gain: 0.9,
    loop: {
      beds: [
        { type: 'noise', gain: 0.1, filter: { type: 'bandpass', freq: 480, q: 0.8 }, lfo: { target: 'gain', rate: 0.27, depth: 0.3 } },
        { type: 'noise', gain: 0.05, filter: { type: 'bandpass', freq: 1050, q: 1.3 }, lfo: { target: 'filter', rate: 0.17, depth: 250 } },
      ],
      period: 0.06, jitter: 0.1,
      // Syllables of distant voices, and now and then a child's shout or a laugh.
      layers: () => {
        if (Math.random() < 0.015) {
          const f = rand(500, 750);
          return [{ type: 'tone', wave: 'sawtooth', freq: f, path: [[0.12, f * 1.3], [0.3, f * 0.9]], dur: 0.3, gain: 0.025,
            filter: { type: 'bandpass', freq: 1200, q: 3 }, env: { a: 0.03, d: 0.25, s: 0.6, r: 0.06 } }];
        }
        return [{ type: 'noise', dur: rand(0.07, 0.2), gain: rand(0.025, 0.055),
          filter: { type: 'bandpass', freq: rand(350, 1500), q: rand(5, 10) }, env: { a: 0.025, d: 0.12, s: 0.4, r: 0.05 } }];
      },
    },
  },
  // One dog, far off.
  dog_bark: {
    gain: 1.0, echo: 0.45,
    layers: [
      { type: 'tone', wave: 'sawtooth', freq: 470, path: [[0.04, 560], [0.14, 360]], dur: 0.14, gain: 0.14, filter: { type: 'bandpass', freq: 850, q: 2 }, env: { a: 0.008, d: 0.12, s: 0.3, r: 0.03 } },
      { type: 'noise', dur: 0.1, gain: 0.05, filter: { type: 'bandpass', freq: 1100, q: 1.5 } },
      { type: 'tone', wave: 'sawtooth', at: 0.32, freq: 450, path: [[0.04, 530], [0.12, 340]], dur: 0.12, gain: 0.11, filter: { type: 'bandpass', freq: 800, q: 2 }, env: { a: 0.008, d: 0.1, s: 0.3, r: 0.03 } },
      { type: 'noise', at: 0.32, dur: 0.08, gain: 0.04, filter: { type: 'bandpass', freq: 1100, q: 1.5 } },
    ],
  },
  // A gull: two cries and a short laugh.
  gull: {
    gain: 1.8, echo: 0.3,
    layers: () => {
      const cry = (t, len, g) => ({ type: 'tone', wave: 'sawtooth', at: t, freq: 1100, path: [[0.07, 1750], [len, 950]], dur: len, gain: g,
        vibrato: { rate: 28, depth: 35 }, filter: { type: 'bandpass', freq: 1800, q: 3 }, env: { a: 0.02, d: len, s: 0.7, r: 0.05 } });
      const laugh = [0, 0.13, 0.26].map((x) => ({ type: 'tone', wave: 'sawtooth', at: 1.15 + x, freq: 1400, path: [[0.08, 1150]], dur: 0.08, gain: 0.04,
        filter: { type: 'bandpass', freq: 1700, q: 3 } }));
      return [cry(0, 0.4, 0.07), cry(0.55, 0.32, 0.06), ...(Math.random() < 0.6 ? laugh : [])];
    },
  },
  // Wind over the rooftops (loop).
  wind: {
    gain: 0.9,
    loop: {
      beds: [
        { type: 'noise', gain: 0.17, filter: { type: 'lowpass', freq: 420, q: 0.6 }, lfo: { target: 'gain', rate: 0.13, depth: 0.55 } },
        { type: 'noise', gain: 0.025, filter: { type: 'bandpass', freq: 1300, q: 5 }, lfo: { target: 'filter', rate: 0.09, depth: 450 } },
      ],
    },
  },
  // The Mayor's new clock on the Crown strikes the hour, far off: three strokes, fading.
  clock_strike: {
    gain: 0.8, echo: 0.5,
    layers: [0, 1.7, 3.4].map((t, i) => [
      { type: 'tone', wave: 'sine', at: t, freq: 330, dur: 2.2, gain: 0.22 * (1 - i * 0.22), env: { a: 0.003, d: 2, s: 0, r: 0.3 }, filter: { freq: 1400 } },
      { type: 'tone', wave: 'sine', at: t, freq: 330 * 2.4, dur: 1.2, gain: 0.08 * (1 - i * 0.22), env: { a: 0.002, d: 1, s: 0, r: 0.2 } },
      { type: 'tone', wave: 'sine', at: t, freq: 330 * 3.9, dur: 0.5, gain: 0.04 * (1 - i * 0.22), env: { a: 0.001, d: 0.4, s: 0, r: 0.1 } },
    ]).flat(),
  },
  // Morning: the well breathes out, cold.
  well_breath: {
    gain: 0.8, echo: 0.3,
    layers: [
      { type: 'noise', dur: 1.6, gain: 0.16, filter: { type: 'bandpass', freq: [260, 650], q: 1.5, time: 0.9 }, env: { a: 0.7, d: 0.6, s: 0.5, r: 0.7 } },
      { type: 'tone', wave: 'sine', freq: 55, dur: 1.6, gain: 0.1, env: { a: 0.6, d: 0.6, s: 0.6, r: 0.7 } },
    ],
  },
};

// ---- The Wrongness (the moonrise) ----
const WRONG = {
  // A long, deep metallic groan from far below: an enormous chain under strain (about 3 s).
  groan: {
    gain: 0.85, echo: 0.35, duck: 0.2, duckFor: 3,
    layers: [
      { type: 'tone', wave: 'sawtooth', freq: 42, path: [[1.5, 38], [3, 40]], dur: 3, gain: 0.5, vibrato: { rate: 0.7, depth: 30 },
        filter: { type: 'lowpass', freq: 320, q: 2 }, env: { a: 0.6, d: 1, s: 1, r: 0.6 } },
      // The creak: stick-slip pulses through a resonant band, like a rope or a cable taking strain.
      { type: 'tone', wave: 'sawtooth', freq: 17, path: [[1, 26], [2.2, 19], [3, 23]], dur: 3, gain: 0.3,
        filter: { type: 'bandpass', freq: [450, 900], q: 6, time: 3 }, env: { a: 0.4, d: 1, s: 1, r: 0.4 } },
      { type: 'tone', wave: 'sine', freq: 97, dur: 3, gain: 0.1, vibrato: { rate: 0.4, depth: 20 }, env: { a: 1, d: 1, s: 1, r: 0.6 } },
      { type: 'tone', wave: 'sine', freq: 151, dur: 3, gain: 0.07, detune: 9, env: { a: 1.2, d: 1, s: 1, r: 0.6 } },
      { type: 'tone', wave: 'sine', freq: 233, dur: 3, gain: 0.05, detune: -14, env: { a: 1.4, d: 1, s: 1, r: 0.6 } },
      { type: 'noise', dur: 3, gain: 0.12, filter: { type: 'lowpass', freq: 180 }, env: { a: 0.5, d: 1, s: 1, r: 0.5 } },
    ],
  },
  // A huge, deep metallic CRACK: the Tooth shearing (the ring lasts about 2.5 s).
  crack: {
    gain: 0.4, echo: 0.4, duck: 0.1, duckFor: 1.5,
    layers: [
      { type: 'noise', dur: 0.04, gain: 0.7, filter: { type: 'highpass', freq: 700 }, env: { a: 0.001, d: 0.04, s: 0, r: 0.01 } },
      { type: 'noise', dur: 0.35, gain: 0.35, filter: { type: 'bandpass', freq: [1800, 250], q: 0.8, time: 0.3 }, env: { a: 0.001, d: 0.3, s: 0, r: 0.05 } },
      { type: 'tone', wave: 'sine', freq: [75, 28], sweep: 1.2, dur: 1.4, gain: 0.85, env: { a: 0.002, d: 1.3, s: 0, r: 0.1 } },
      { type: 'tone', wave: 'sine', freq: 311, dur: 2.5, gain: 0.08, env: { a: 0.001, d: 2.4, s: 0, r: 0.2 } },
      { type: 'tone', wave: 'sine', freq: 487, dur: 2, gain: 0.07, env: { a: 0.001, d: 1.8, s: 0, r: 0.2 } },
      { type: 'tone', wave: 'sine', freq: 829, dur: 1.4, gain: 0.05, env: { a: 0.001, d: 1.2, s: 0, r: 0.2 } },
      { type: 'tone', wave: 'sine', freq: 1231, dur: 0.9, gain: 0.04, env: { a: 0.001, d: 0.8, s: 0, r: 0.1 } },
    ],
  },
  // Chimney pots rattling and the house's timbers creaking (about 2 s).
  rattle: {
    gain: 1.4,
    layers: () => {
      const out = [];
      for (let i = 0; i < 12; i++) {
        const t = rand(0, 1.8);
        out.push({ type: 'tone', wave: 'triangle', at: t, freq: rand(2100, 3400), dur: 0.03, gain: rand(0.04, 0.09) });
        out.push({ type: 'noise', at: t, dur: 0.02, gain: 0.04, filter: { type: 'bandpass', freq: 4000, q: 2 } });
      }
      for (const t of [0.1, 0.8, 1.4]) {
        const f = rand(70, 95);
        out.push({ type: 'tone', wave: 'sawtooth', at: t + rand(0, 0.1), freq: f, path: [[0.25, f * 1.4], [0.5, f * 1.1]], dur: 0.5, gain: 0.13,
          vibrato: { rate: 19, depth: 50 }, filter: { type: 'bandpass', freq: 650, q: 4 }, env: { a: 0.06, d: 0.4, s: 0.7, r: 0.08 } });
      }
      return out;
    },
  },
  // The piano escapes down the Squeeze: a crash of chords, then thumps and jangles receding
  // downhill (about 3.5 s).
  piano_tumble: {
    gain: 0.28, echo: 0.3,
    layers: () => {
      const low = ['C2', 'D2', 'E2', 'G2', 'A2'];
      const mid = ['C3', 'Eb3', 'F#3', 'A3', 'C4', 'D4', 'F4', 'G#4', 'B4'];
      const high = ['C5', 'D5', 'F5', 'Ab5', 'B5', 'D6', 'E6'];
      const crash = [pick(low), pick(low), pick(mid), pick(mid), pick(mid), pick(high), pick(high)]
        .map((p, i) => [p, i * 0.006, 1.6, 1]);
      const out = [
        { type: 'notes', inst: 'piano', notes: crash },
        { type: 'tone', wave: 'sine', freq: [110, 50], dur: 0.25, gain: 0.5 },
        { type: 'noise', dur: 0.12, gain: 0.25, filter: { type: 'lowpass', freq: 900 } },
      ];
      let t = 0.45;
      for (let i = 0; i < 9; i++) {
        const k = 1 - i / 10; // farther away each bump
        out.push({ type: 'tone', wave: 'sine', at: t, freq: [rand(100, 140), 55], dur: 0.15, gain: 0.4 * k });
        out.push({ type: 'noise', at: t, dur: 0.07, gain: 0.15 * k, filter: { type: 'lowpass', freq: 500 + 400 * k } });
        const n = 1 + Math.floor(Math.random() * 3);
        const jangle = Array.from({ length: n }, (_, j) => [pick([...mid, ...high]), 0.01 * j, 0.6, rand(0.5, 0.9)]);
        out.push({ type: 'notes', inst: 'piano', at: t, gain: 0.55 * k * k, notes: jangle });
        t += rand(0.22, 0.4);
      }
      return out;
    },
  },
  // The drain: glunk, a gurgling whirlpool (1.5 s), a hollow sound falling away and away, and
  // about 2.5 s later a tiny, faraway splash. About 5 s in all.
  drain: {
    gain: 0.85, echo: 0.5,
    layers: () => {
      const out = [
        { type: 'tone', wave: 'sine', freq: 210, path: [[0.12, 65]], dur: 0.14, gain: 0.6 },
        { type: 'noise', dur: 0.06, gain: 0.15, filter: { type: 'lowpass', freq: 500 } },
        { type: 'noise', at: 0.1, dur: 1.5, gain: 0.12, filter: { type: 'bandpass', freq: [700, 260], q: 2, time: 1.5 }, env: { a: 0.1, d: 1.4, s: 0.5, r: 0.2 } },
      ];
      for (let i = 0; i < 14; i++) {
        const f = rand(180, 500);
        out.push({ type: 'tone', wave: 'sine', at: 0.15 + i * 0.1 + rand(0, 0.05), freq: [f, f * rand(1.8, 2.5)], dur: rand(0.04, 0.08), gain: rand(0.05, 0.1) * (1 - i / 20) });
      }
      // Falling away: a hollow resonance sliding down, and a ghost of a tone with it.
      out.push({ type: 'noise', at: 1.6, dur: 2.4, gain: 0.14, filter: { type: 'bandpass', freq: [950, 110], q: 9, time: 2.4 }, env: { a: 0.08, d: 2.2, s: 0.4, r: 0.3 } });
      out.push({ type: 'tone', wave: 'sine', at: 1.6, freq: 520, path: [[2.4, 70]], dur: 2.4, gain: 0.05, env: { a: 0.1, d: 2.2, s: 0.6, r: 0.3 } });
      // The far splash.
      out.push({ type: 'noise', at: 4.1, dur: 0.22, gain: 0.07, filter: { type: 'bandpass', freq: [2200, 700], q: 1, time: 0.2 }, env: { a: 0.003, d: 0.2, s: 0, r: 0.05 } });
      out.push({ type: 'tone', wave: 'sine', at: 4.16, freq: [330, 700], dur: 0.04, gain: 0.025 });
      return out;
    },
  },
};

export const WORLD_SFX = {
  ...FOOTSTEPS,
  step: FOOTSTEPS.step_stone, // the default footstep
  ...PUZZLE,
  ...AMBIENCE,
  ...WRONG,
};
