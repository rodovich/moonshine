// "Low Tide" — the Bilge, the Harbor, and the Goat Path (docs/design/02-city.md).
// The same world as the upper town, but lower and slower: D minor, a lilting 6/8, an accordion
// leading over a rocking guitar and a plucked bass, with water lapping in the percussion. It opens
// with Cheryl's home phrase in the minor (A–D–F–A, then G–F–E falling to D), so it sounds like
// home seen from the waterline. The middle section lifts into F major and leans on an A-major
// chord for salt and longing. The last time round, a flute answers the accordion like a gull.
// Loop: 24 bars of 6/8 at 52 dotted-quarter beats a minute = 55.4 s. Format:
// docs/audio-direction.md.

// Six eighths up and back: the guitar's rocking 6/8.
const rock = (a, b, c, d) => `${a}:2 ${b} ${c} ${d} ${c} ${b}`;
const G = {
  Dm: rock('D3', 'A3', 'D4', 'F4'),
  Bb: rock('Bb2', 'F3', 'Bb3', 'D4'),
  C: rock('C3', 'G3', 'C4', 'E4'),
  Gm: rock('G2', 'D3', 'G3', 'Bb3'),
  A7: rock('A2', 'E3', 'G3', 'C#4'),
  A: rock('A2', 'E3', 'A3', 'C#4'),
  F: rock('F2', 'C3', 'F3', 'A3'),
};

const harmonyA = 'Dm | Dm | Bb | C | Dm | Gm | A7 | Dm |';
const melodyA = `
  A4:2 D5 F5 A5:6 |
  G5:3 F5:1 E5:2 D5:6 |
  D5:2 F5 Bb5 A5:4 G5:2 |
  G5:4 F5:2 E5:6 |
  A4:2 D5 F5 A5:4 Bb5:2 |
  Bb5:4 A5:2 G5:6 |
  E5:3 F5:1 G5:2 C#5:6 |
  D5:9 .:3 |`;
const guitarA = `${G.Dm} | ${G.Dm} | ${G.Bb} | ${G.C} | ${G.Dm} | ${G.Gm} | ${G.A7} | ${G.Dm} |`;
const bassA = 'D2:6 A2 | D2 A2 | Bb1 F2 | C2 G2 | D2 A2 | G2 D2 | A1 E2 | D2 A1 |';

export default {
  id: 'harbor',
  title: 'Low Tide',
  bpm: 52,
  stepsPerBeat: 6, // a beat is a dotted quarter
  beatsPerBar: 2,
  gain: 1.1,
  echo: { delay: 0.38, feedback: 0.32, wet: 0.28, lowpass: 2200 },
  channels: [
    { id: 'lead', inst: 'accordion', vol: 0.9, pan: 0.05, echo: 0.3 },
    { id: 'flute', inst: 'flute', vol: 0.5, pan: 0.35, echo: 0.5, role: 'counter' },
    { id: 'guitar', inst: 'guitar', vol: 0.55, pan: -0.3, echo: 0.2 },
    { id: 'pad', inst: 'strings', vol: 0.4, pan: 0.25, echo: 0.3 },
    { id: 'bass', inst: 'bass', vol: 0.55, pan: 0, echo: 0.05 },
    { id: 'water', inst: 'kit', vol: 0.7, pan: -0.2, echo: 0.3 },
  ],
  patterns: {
    I: {
      harmony: 'Dm |',
      lead: '.:12 |',
      flute: '.:12 |',
      guitar: `${G.Dm} |`,
      pad: '.:12 |',
      bass: 'D2:6 A1 |',
      water: 'wave:12 |',
    },
    A: {
      harmony: harmonyA,
      lead: melodyA,
      flute: '(.:12 |)x8',
      guitar: guitarA,
      pad: '(.:12 |)x8',
      bass: bassA,
      water: '(.:12 | wave:12 |)x4',
    },
    B: {
      harmony: 'F | C | Dm | A | Bb | F | Gm | A7 |',
      lead: `
        C5:6 F5:3 G5:1 A5:2 |
        G5:6 E5 |
        F5:3 E5:1 D5:2 A5:6 |
        C#5:6 E5 |
        D5:2 F5 Bb5 D6:6 |
        C6:6 A5 |
        Bb5:3 A5:1 G5:2 D5:6 |
        C#5:6 E5 |`,
      flute: '(.:12 |)x8',
      guitar: `${G.F} | ${G.C} | ${G.Dm} | ${G.A} | ${G.Bb} | ${G.F} | ${G.Gm} | ${G.A7} |`,
      pad: 'A4:12 | G4 | F4 | E4 | F4 | A4 | G4 | G4 |',
      bass: 'F2:6 C2 | C2 G2 | D2 A2 | A1 E2 | Bb1 F2 | F2 C2 | G2 D2 | A1 E2 |',
      water: '(wave:12 | .:12 |)x4',
    },
    A2: {
      harmony: harmonyA,
      lead: melodyA,
      // The flute answers in the accordion's long notes, like a gull over the water.
      flute: `
        .:12 |
        .:6 A5:2 G5 F5 |
        .:12 |
        .:6 G5:2 A5 G5 |
        .:12 |
        .:6 D6:2 Bb5 A5 |
        .:12 |
        .:6 A5:2 F5 D5 |`,
      guitar: guitarA,
      pad: 'F4:12 | F4 | D4 | E4 | F4 | D4 | E4 | F4 |',
      bass: bassA,
      water: '(.:12 | wave:12 |)x4',
    },
  },
  intro: ['I'],
  loop: ['A', 'B', 'A2'],
};
