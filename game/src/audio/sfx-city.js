// Sounds of the wider city (Act 2, docs/design/02-city.md "Audio needed").
// Format as in sfx.js; loops as in sfx-world.js.

const rand = (a, b) => a + Math.random() * (b - a);
const pick = (xs) => xs[Math.floor(Math.random() * xs.length)];

// A gull's cry, shared by `gull` (sfx-world.js has its own) and the `gulls` loop.
const gullCry = (t, len, g) => ({
  type: 'tone', wave: 'sawtooth', at: t, freq: rand(1000, 1200), path: [[0.07, rand(1600, 1850)], [len, rand(900, 1000)]], dur: len, gain: g,
  vibrato: { rate: 28, depth: 35 }, filter: { type: 'bandpass', freq: 1800, q: 3 }, env: { a: 0.02, d: len, s: 0.7, r: 0.05 },
});

// A goat: a trembling "meh-eh-eh".
const bleat = (t, g) => {
  const f = rand(380, 520);
  return [
    { type: 'tone', wave: 'sawtooth', at: t, freq: f, path: [[0.5, f * 0.9]], dur: rand(0.45, 0.65), gain: g,
      vibrato: { rate: rand(8, 11), depth: 110 }, filter: { type: 'bandpass', freq: 1100, q: 2 }, env: { a: 0.03, d: 0.5, s: 0.7, r: 0.08 } },
    { type: 'noise', at: t, dur: 0.4, gain: g * 0.2, filter: { type: 'bandpass', freq: 2200, q: 2 }, env: { a: 0.03, d: 0.3, s: 0.5, r: 0.08 } },
  ];
};

// Stone and mortar: a scrape and a crunch. Three variants, picked at random.
const SCRAPES = [
  { f: [1800, 700], len: 0.4, crunch: 0.42 },
  { f: [1300, 500], len: 0.5, crunch: 0.5 },
  { f: [2200, 900], len: 0.32, crunch: 0.35 },
];
function stoneScrape() {
  const v = pick(SCRAPES);
  const out = [
    { type: 'noise', dur: v.len, gain: 0.26, filter: { type: 'bandpass', freq: v.f, q: 1.4, time: v.len }, env: { a: 0.03, d: v.len, s: 0.6, r: 0.05 } },
    { type: 'tone', wave: 'sawtooth', freq: rand(55, 75), dur: v.len, gain: 0.08, filter: { type: 'bandpass', freq: 500, q: 3 }, vibrato: { rate: 17, depth: 60 } },
    // The crunch: mortar giving way.
    { type: 'tone', wave: 'sine', at: v.crunch, freq: [140, 60], dur: 0.12, gain: 0.45 },
    { type: 'noise', at: v.crunch, dur: 0.09, gain: 0.3, filter: { type: 'lowpass', freq: 1500 } },
  ];
  for (let i = 0; i < 7; i++) {
    out.push({ type: 'noise', at: v.crunch + rand(0, 0.18), dur: 0.015, gain: rand(0.05, 0.12), filter: { type: 'bandpass', freq: rand(2500, 5000), q: 3 } });
  }
  return out;
}

export const CITY_SFX = {
  // Knocking on a door: three raps.
  knock: {
    gain: 0.9, echo: 0.1,
    layers: () => [0, 0.2, 0.4].map((t) => [
      { type: 'tone', wave: 'sine', at: t + rand(0, 0.02), freq: [rand(170, 200), 110], dur: 0.07, gain: 0.45 },
      { type: 'noise', at: t, dur: 0.03, gain: 0.15, filter: { type: 'bandpass', freq: 900, q: 1.5 } },
    ]).flat(),
  },
  // The Shop door's bell, on its spring.
  shop_bell: {
    gain: 0.7, echo: 0.2,
    layers: [
      { type: 'tone', wave: 'sine', freq: 2093, dur: 0.9, gain: 0.2, vibrato: { rate: 14, depth: 12 }, env: { a: 0.002, d: 0.8, s: 0, r: 0.1 } },
      { type: 'tone', wave: 'sine', freq: 2093 * 2.76, dur: 0.2, gain: 0.04, env: { a: 0.001, d: 0.18, s: 0, r: 0.05 } },
      { type: 'tone', wave: 'sine', at: 0.09, freq: 2349, dur: 0.8, gain: 0.15, vibrato: { rate: 13, depth: 12 }, env: { a: 0.002, d: 0.7, s: 0, r: 0.1 } },
      { type: 'tone', wave: 'sine', at: 0.2, freq: 2093, dur: 0.5, gain: 0.07, env: { a: 0.002, d: 0.45, s: 0, r: 0.1 } },
    ],
  },
  // Prying at stone and mortar with the crowbar (three variants).
  stone_scrape: { gain: 0.85, jitter: 150, layers: stoneScrape },
  // Soap rubbed hard on wooden runners: two strokes.
  scrub: {
    gain: 0.9,
    layers: () => [0, 0.38].map((t, i) => [
      { type: 'noise', at: t, dur: 0.3, gain: 0.16, filter: { type: 'bandpass', freq: [rand(1100, 1400), rand(1700, 2100)], q: 1.6 }, env: { a: 0.05, d: 0.25, s: 0.7, r: 0.05 } },
      { type: 'tone', wave: 'sawtooth', at: t, freq: rand(90, 120), dur: 0.28, gain: 0.04, vibrato: { rate: 24, depth: 70 }, filter: { type: 'bandpass', freq: 900, q: 3 } },
      { type: 'noise', at: t + 0.05, dur: 0.2, gain: 0.03 * (1 + i), filter: { type: 'highpass', freq: 6000 } },
    ]).flat(),
  },
  // A skipping rope slapping the paving, once.
  skip_rope: {
    mono: true, jitter: 120, gain: 0.8,
    layers: [
      { type: 'noise', dur: 0.05, gain: 0.25, filter: { type: 'bandpass', freq: 1500, q: 1 }, env: { a: 0.002, d: 0.045, s: 0, r: 0.02 } },
      { type: 'noise', dur: 0.15, gain: 0.03, filter: { type: 'bandpass', freq: [3000, 1200], q: 2, time: 0.12 } },
    ],
  },
  // A stone slab lifting away: a grind, the weight coming free, and air moving.
  slab_lift: {
    gain: 0.85, echo: 0.25,
    layers: [
      { type: 'noise', dur: 0.7, gain: 0.22, filter: { type: 'bandpass', freq: [900, 400], q: 1.6, time: 0.7 }, env: { a: 0.05, d: 0.7, s: 0.8, r: 0.1 } },
      { type: 'tone', wave: 'sawtooth', freq: 48, path: [[0.7, 62]], dur: 0.7, gain: 0.12, filter: { type: 'lowpass', freq: 300 } },
      { type: 'tone', wave: 'sine', at: 0.72, freq: [120, 55], dur: 0.2, gain: 0.5 },
      { type: 'noise', at: 0.72, dur: 0.12, gain: 0.2, filter: { type: 'lowpass', freq: 800 } },
      { type: 'noise', at: 0.75, dur: 1.1, gain: 0.08, filter: { type: 'bandpass', freq: [300, 700], q: 1.2, time: 1 }, env: { a: 0.3, d: 0.8, s: 0.3, r: 0.3 } },
    ],
  },
  // The soaped piano shoots down into Fountain Square: a soapy whoosh, a long scrape, a jangle of
  // strings, all receding (about 3.5 s).
  piano_slide: {
    gain: 0.5, echo: 0.3,
    layers: () => {
      const out = [
        { type: 'noise', dur: 0.5, gain: 0.25, filter: { type: 'bandpass', freq: [3500, 1200], q: 1.5, time: 0.5 }, env: { a: 0.08, d: 0.4, s: 0.3, r: 0.1 } },
        { type: 'noise', at: 0.2, dur: 3, gain: 0.3, filter: { type: 'bandpass', freq: [800, 250], q: 1.3, time: 3 }, env: { a: 0.15, d: 2.8, s: 0.2, r: 0.3 } },
        { type: 'tone', wave: 'sawtooth', at: 0.2, freq: 70, path: [[3, 40]], dur: 3, gain: 0.12, filter: { type: 'lowpass', freq: 400 }, vibrato: { rate: 13, depth: 80 }, env: { a: 0.1, d: 2.8, s: 0.3, r: 0.3 } },
      ];
      const notes = ['C3', 'E3', 'G#3', 'B3', 'D4', 'F4', 'A4', 'C5', 'Eb5', 'F#5'];
      for (let i = 0; i < 8; i++) {
        const t = 0.35 + i * 0.32 + rand(0, 0.1);
        const k = 1 - i / 9;
        out.push({ type: 'notes', inst: 'piano', at: t, gain: 0.5 * k * k, notes: [[pick(notes), 0, 0.5, rand(0.5, 0.9)], [pick(notes), 0.015, 0.5, rand(0.4, 0.8)]] });
        out.push({ type: 'tone', wave: 'sine', at: t, freq: [rand(90, 130), 55], dur: 0.12, gain: 0.3 * k });
      }
      return out;
    },
  },
  // A trickle of water running down the Steps (loop).
  trickle: {
    gain: 0.8,
    loop: {
      beds: [
        { type: 'noise', gain: 0.06, filter: { type: 'bandpass', freq: 2600, q: 1.5 }, lfo: { target: 'gain', rate: 2.3, depth: 0.4 } },
        { type: 'noise', gain: 0.03, filter: { type: 'bandpass', freq: 900, q: 1 }, lfo: { target: 'filter', rate: 0.6, depth: 200 } },
      ],
      period: 0.09, jitter: 0.18,
      layers: () => {
        const f = rand(1100, 2600);
        return [{ type: 'tone', wave: 'sine', freq: [f, f * rand(1.2, 1.6)], dur: rand(0.02, 0.04), gain: rand(0.01, 0.03) }];
      },
    },
  },
  // The last water running out at the far end of the dry Bilge (loop): a faint, distant trickle,
  // with nothing else of the sea in it. Quieter and farther off than `trickle`.
  runoff: {
    gain: 1.2, echo: 0.45,
    loop: {
      beds: [{ type: 'noise', gain: 0.025, filter: { type: 'bandpass', freq: 1800, q: 2 }, lfo: { target: 'gain', rate: 1.7, depth: 0.5 } }],
      period: 0.18, jitter: 0.35,
      layers: () => {
        const f = rand(900, 1800);
        return [{ type: 'tone', wave: 'sine', freq: [f, f * rand(1.2, 1.5)], dur: rand(0.02, 0.04), gain: rand(0.008, 0.02) }];
      },
    },
  },
  // Water sinking into a crack: a small gurgle, going down.
  sink_gurgle: {
    gain: 1.8, echo: 0.3,
    layers: () => {
      const out = [{ type: 'noise', dur: 0.7, gain: 0.08, filter: { type: 'bandpass', freq: [700, 220], q: 3, time: 0.7 }, env: { a: 0.05, d: 0.6, s: 0.3, r: 0.1 } }];
      for (let i = 0; i < 6; i++) {
        const f = rand(250, 450) * (1 - i * 0.08);
        out.push({ type: 'tone', wave: 'sine', at: i * 0.1 + rand(0, 0.04), freq: [f, f * 1.8], dur: 0.05, gain: 0.07 * (1 - i / 8) });
      }
      return out;
    },
  },
  // A footstep on the flooded street in the Bilge.
  step_splash: {
    mono: true, jitter: 200, gain: 0.8,
    layers: [
      { type: 'noise', dur: 0.12, gain: 0.2, filter: { type: 'bandpass', freq: [2400, 800], q: 1, time: 0.12 }, env: { a: 0.004, d: 0.1, s: 0, r: 0.04 } },
      { type: 'tone', wave: 'sine', freq: [150, 90], dur: 0.04, gain: 0.12 },
      { type: 'tone', wave: 'sine', at: 0.05, freq: [500, 900], dur: 0.03, gain: 0.03 },
    ],
  },
  // The Founders' Door: a very quiet, steady tone, felt as much as heard (loop).
  door_hum: {
    gain: 0.35,
    loop: {
      beds: [
        { type: 'tone', wave: 'sine', freq: 69.3, gain: 0.08, lfo: { target: 'gain', rate: 0.15, depth: 0.25 } }, // Db2
        { type: 'tone', wave: 'sine', freq: 207.7, gain: 0.025, lfo: { target: 'freq', rate: 0.11, depth: 6 } }, // Ab3
        { type: 'tone', wave: 'sine', freq: 1108.7, gain: 0.004, lfo: { target: 'gain', rate: 0.3, depth: 0.6 } }, // Db6 shimmer
      ],
    },
  },
  // The upper town by day (loop): distant voices here and there, a shutter, a hammer, sparrows.
  town: {
    gain: 3.0,
    loop: {
      beds: [{ type: 'noise', gain: 0.025, filter: { type: 'bandpass', freq: 600, q: 0.7 }, lfo: { target: 'gain', rate: 0.2, depth: 0.4 } }],
      period: 0.25, jitter: 0.5,
      layers: () => {
        const r = Math.random();
        if (r < 0.03) { // a distant hammer: three taps
          return [0, 0.35, 0.7].map((t) => ({ type: 'tone', wave: 'triangle', at: t, freq: [900, 700], dur: 0.03, gain: 0.03 }));
        }
        if (r < 0.06) { // a shutter or a door
          return [{ type: 'tone', wave: 'sine', freq: [200, 120], dur: 0.06, gain: 0.05 }, { type: 'noise', dur: 0.04, gain: 0.03, filter: { type: 'lowpass', freq: 1000 } }];
        }
        if (r < 0.12) { // sparrows
          return Array.from({ length: 2 + Math.floor(Math.random() * 3) }, (_, i) => {
            const f = rand(3500, 5000);
            return { type: 'tone', wave: 'sine', at: i * 0.09, freq: [f, f * rand(0.75, 1.2)], dur: 0.05, gain: 0.02 };
          });
        }
        return [{ type: 'noise', dur: rand(0.08, 0.22), gain: rand(0.012, 0.03), filter: { type: 'bandpass', freq: rand(350, 1400), q: rand(5, 10) }, env: { a: 0.025, d: 0.12, s: 0.4, r: 0.05 } }];
      },
    },
  },
  // Canal water lapping against stone, and now and then a boat knocking (loop).
  canal: {
    gain: 0.9,
    loop: {
      beds: [{ type: 'noise', gain: 0.05, filter: { type: 'lowpass', freq: 320 }, lfo: { target: 'gain', rate: 0.17, depth: 0.5 } }],
      period: 0.7, jitter: 1.1,
      layers: () => {
        const out = [{ type: 'noise', dur: rand(0.6, 1.2), gain: rand(0.06, 0.12), filter: { type: 'bandpass', freq: [rand(700, 1000), rand(300, 450)], q: 1 }, env: { a: 0.25, d: 0.6, s: 0.2, r: 0.3 } }];
        if (Math.random() < 0.15) out.push({ type: 'tone', wave: 'sine', at: rand(0.2, 0.6), freq: [rand(150, 190), 110], dur: 0.12, gain: 0.08 });
        if (Math.random() < 0.2) out.push({ type: 'tone', wave: 'sine', at: rand(0.1, 0.8), freq: [rand(350, 500), rand(800, 1000)], dur: 0.04, gain: 0.02 });
        return out;
      },
    },
  },
  // Gulls over the harbor, every few seconds (loop).
  gulls: {
    gain: 1.5, echo: 0.3,
    loop: {
      offset: 1, period: 3.5, jitter: 5,
      layers: () => {
        const n = 1 + Math.floor(Math.random() * 3);
        return Array.from({ length: n }, (_, i) => gullCry(i * rand(0.45, 0.6), rand(0.25, 0.4), rand(0.03, 0.06)));
      },
    },
  },
  // One goat.
  goat: { gain: 1.6, echo: 0.2, layers: () => bleat(0, 0.1) },
  // Goats on the Goat Path, now and then (loop).
  goats: {
    gain: 1.4, echo: 0.25,
    loop: { offset: 2, period: 4, jitter: 7, layers: () => bleat(0, rand(0.05, 0.1)) },
  },
  // The Mayor's clock on the Crown, close up: a heavy tick, tock, once a second (loop).
  clock_tick: {
    gain: 0.8, echo: 0.25,
    loop: {
      period: 1,
      layers: (n) => [
        { type: 'tone', wave: 'triangle', freq: n % 2 ? 900 : 1150, dur: 0.02, gain: 0.12 },
        { type: 'tone', wave: 'sine', freq: n % 2 ? 160 : 190, dur: 0.06, gain: 0.12 },
        { type: 'noise', dur: 0.015, gain: 0.04, filter: { type: 'bandpass', freq: 2500, q: 2 } },
      ],
    },
  },
  // The Boatman sings a few notes, badly: a wobbly reed voice that never quite finds the pitch.
  boatman_sing: {
    gain: 0.75, echo: 0.3,
    layers: () => {
      // Fragments of his song (an original shanty in D minor) and the skipping rhyme's opening.
      const phrases = [
        [['D4', 0.6], ['F4', 0.3], ['A4', 0.9], ['G4', 0.3], ['F4', 0.6], ['E4', 0.9]],
        [['A4', 0.45], ['A4', 0.45], ['D5', 0.9], ['C5', 0.3], ['A4', 1.2]],
        [['C4', 0.4], ['F4', 0.4], ['A4', 0.4], ['C5', 1.2]],
        [['F4', 0.6], ['E4', 0.3], ['D4', 0.6], ['A3', 1.4]],
      ];
      let t = 0;
      const notes = [];
      for (const [p, len] of pick(phrases)) {
        notes.push([p, t, len * 0.95, rand(0.6, 0.9), rand(-60, 40), rand(-45, 45)]);
        t += len;
      }
      return [{ type: 'notes', inst: 'boatman', notes }];
    },
  },
  // The Crown at dusk, every moon-eye glowing (end of Act 3): a light, rising, glassy shimmer in
  // the air, now and then (loop).
  glow_shimmer: {
    gain: 0.3, echo: 0.6,
    loop: {
      offset: 0.5, period: 2.2, jitter: 2.5,
      layers: () => {
        const runs = [['Db6', 'F6', 'Ab6'], ['Ab5', 'Db6', 'F6'], ['F5', 'Ab5', 'Db6', 'F6']];
        const run = runs[Math.floor(Math.random() * runs.length)];
        return [{ type: 'notes', inst: 'glass', notes: run.map((p, i) => [p, i * 0.14, 1.4, 0.35]) }];
      },
    },
  },
  // The Skipping Girls chant the rhyme's opening (and a rope slaps the ground on each beat).
  girls_chant: {
    gain: 0.5, echo: 0.15,
    layers: () => {
      const beat = 0.32;
      const tune = [['C5', 1], ['F5', 1], ['A5', 1], ['C6', 1], ['C6', 0.75], ['Bb5', 0.25], ['A5', 0.5], ['G5', 0.5], ['G5', 2]];
      const notes = [];
      let t = 0;
      for (const [p, b] of tune) { notes.push([p, t, b * beat * 0.9, 0.8, 0, rand(-15, 15)]); t += b * beat; }
      const rope = Array.from({ length: 8 }, (_, i) => ({ type: 'noise', at: i * beat * 1 + 0.01, dur: 0.04, gain: 0.08, filter: { type: 'bandpass', freq: 1500, q: 1 } }));
      return [{ type: 'notes', inst: 'voice', notes }, ...rope];
    },
  },
};
