// "Home Again" — the hauling cue, the climax (docs/design/06-moon-in-the-bowl.md, "The hauling").
// A one-shot: playMusic('hauling', { fadeMs: 0 }) as the brake is thrown.
// Huge and slow at first: a held D-flat with the Tide Wheel's groan under it as a drone. Then the
// chain comes in, and each link's BOOM (with the clapper's ratchet clack after it) is the beat.
// The choir sings the rhyme's own phrase for "wind her in slowly, and home again" (RHYME bars
// 7–8: E-flat, C7, home to F), four times, each statement shorter than the last (twice as slow,
// one and a half times, then at its own speed twice), so the music speeds up with the links
// and carries the montage. Then the booms slow, the harmony climbs D-flat, E-flat, and the last
// link lands on a held F major chord, the city home.
//
// The links (BOOMs), in seconds from the start, for timing the 2 px shakes: see HAULING_LINKS.
// 304 steps at 160 bpm (a step is 0.094 s) = 28.5 s, then the chord rings. Format:
// docs/audio-direction.md.

const STEP = 60 / 160 / 4;

// The rhyme's bars 7–8 (moonrise.js RHYME), scaled: pitches with lengths in steps.
const PITCHES = ['G4', 'G4', 'Bb4', 'G4', 'Eb4', 'F4', 'G4', 'A4', 'G4', 'E4', 'F4'];
const phrase = (lens) => PITCHES.map((p, i) => `${p}:${lens[i]}`).join(' ');
const X1 = [2, 2, 4, 2, 4, 2, 2, 4, 1, 1, 8]; // 32 steps: the rhyme's own speed
const X15 = [3, 3, 6, 3, 6, 3, 3, 6, 2, 1, 12]; // 48 steps
const X2 = X1.map((n) => n * 2); // 64 steps

// Gaps between links, in steps, section by section.
const GAPS = {
  S1: [16, 16, 16, 16],
  S2: [12, 12, 12, 12],
  S3: [8, 8, 8, 8],
  S4: [6, 6, 5, 5, 5, 5],
  S5: [8, 8, 16],
  S6: [48], // the last link, under the held chord
};
const booms = (gaps) => gaps.map((g) => `boom!:${g}`).join(' ');
const clacks = (gaps) => gaps.map((g) => `.:2 clack:${g - 2}`).join(' ');

/** Seconds from the start of the cue at which each chain link arrives (22 links). */
export const HAULING_LINKS = (() => {
  const out = [];
  let step = 48; // three bars of drone before the first link
  for (const sec of ['S1', 'S2', 'S3', 'S4', 'S5', 'S6']) {
    for (const g of GAPS[sec]) { out.push(Math.round(step * STEP * 1000) / 1000); step += g; }
  }
  return out;
})();

export default {
  id: 'hauling',
  title: 'Home Again',
  scene: true,
  bpm: 160,
  gain: 0.85,
  echo: { delay: 0.47, feedback: 0.45, wet: 0.35, lowpass: 1800, spread: 0.05 },
  channels: [
    { id: 'lead', inst: 'choir', vol: 1.4, pan: 0, echo: 0.4 },
    { id: 'pad', inst: 'strings', vol: 0.65, pan: 0.3, echo: 0.35 },
    { id: 'bass', inst: 'bowbass', vol: 0.55, pan: 0, echo: 0.15 },
    { id: 'drone', inst: 'bowbass', vol: 0.4, pan: -0.25, echo: 0.3, transpose: -12 },
    { id: 'link', inst: 'kit', vol: 0.6, pan: 0, echo: 0.35 },
    { id: 'clack', inst: 'kit', vol: 0.45, pan: 0.2, echo: 0.2 },
  ],
  patterns: {
    // The Tide Wheel bites: a held D-flat and its groan.
    S0: {
      harmony: 'Db | Db | Db |',
      lead: '.:48',
      pad: 'F4:48',
      bass: 'Db2:48',
      drone: 'Db3:48',
      link: '.:48',
      clack: '.:48',
    },
    // The first links, slow: the phrase at half speed.
    S1: {
      harmony: 'Eb | Eb | C7 | F |',
      lead: phrase(X2),
      pad: 'Eb4:32 E4:16 C4:16',
      bass: 'Eb2:32 C2:16 F2:16',
      drone: 'C3:64',
      link: booms(GAPS.S1),
      clack: clacks(GAPS.S1),
    },
    // Faster.
    S2: {
      harmony: 'Eb | Eb:8 C7:8 | C7:4 F:12 |',
      lead: phrase(X15),
      pad: 'Eb4:24 E4:12 C4:12',
      bass: 'Eb2:24 C2:12 F2:12',
      drone: 'C3:48',
      link: booms(GAPS.S2),
      clack: clacks(GAPS.S2),
    },
    // At the rhyme's own speed, twice, carrying the montage.
    S3: {
      harmony: 'Eb | C7 F |',
      lead: phrase(X1),
      pad: 'Eb4:16 E4:8 C4:8',
      bass: 'Eb2:16 C2:8 F2:8',
      drone: 'C3:32',
      link: booms(GAPS.S3),
      clack: clacks(GAPS.S3),
    },
    S4: {
      harmony: 'Eb | C7 F |',
      lead: phrase(X1),
      pad: 'G4:16 E4:8 F4:8',
      bass: 'Eb2:16 C2:8 F2:8',
      drone: 'C3:32',
      link: booms(GAPS.S4),
      clack: clacks(GAPS.S4),
    },
    // The links slow; the harmony climbs D-flat, E-flat…
    S5: {
      harmony: 'Db | Eb |',
      lead: 'Ab4:8 Bb4:8 Bb4:16',
      pad: 'F4:16 G4:16',
      bass: 'Db2:16 Eb2:16',
      drone: 'Db3:16 Eb3:16',
      link: booms(GAPS.S5),
      clack: clacks(GAPS.S5),
    },
    // …and the last link lands on F major, held: home.
    S6: {
      harmony: 'F | F | F |',
      lead: 'A4:48',
      pad: 'C5:48',
      bass: 'F2:48',
      drone: 'F3:48',
      link: booms(GAPS.S6),
      clack: clacks(GAPS.S6),
    },
  },
  intro: ['S0', 'S1', 'S2', 'S3', 'S4', 'S5', 'S6'],
  loop: null,
};
