// "Cistern Court" — Cheryl's home theme, first heard at dusk on Moonshine Night.
// B-flat major, an unhurried waltz. An accordion sings over a nylon guitar's oom-pah-pah and a
// round bass. The melody climbs a broken chord (F–Bb–D) and settles back, like someone sitting
// down in a favorite chair. The arrangement changes each time round: A is guitar and accordion;
// A2 swaps the guitar for rippling harp; B hands the tune to the flute, in G minor, with the
// accordion holding long notes underneath; A3 brings everything back with a flute descant.
// Loop: 32 bars of 3/4 at 88 bpm = 65.5 s. Format: docs/audio-direction.md.

const oom = (a, b) => `.:4 ${a}:4 ${b}`; // guitar or harp "pah-pah" on beats 2 and 3
const roll = (a, b, c, d) => `${a}:2 ${b} ${c} ${d} ${c} ${b}`; // harp, six eighths

const harmonyA = 'Bb | Bb | Eb | Eb | Cm | F7 | Bb | F7 |';

const melodyA = `
  F4:4 Bb4 D5 |
  F5:6 Eb5:2 D5:4 |
  Eb5:4 G5 Bb5 |
  Bb5:6 A5:2 G5:4 |
  G5:6 F5:2 Eb5:4 |
  F5:6 Eb5:2 C5:4 |
  D5:12 |
  Eb5:4 C5 A4 |`;

const melodyA2 = `
  F4:4 Bb4 D5 |
  F5:6 Eb5:2 D5:4 |
  Eb5:4 G5 Bb5 |
  Bb5:6 A5:2 G5:4 |
  Eb5:6 D5:2 C5:4 |
  A4:4 C5 Eb5 |
  D5:6 C5:2 Bb4:4 |
  .:8 F5:4 |`;

const guitarA = `${oom('D4', 'F4')} | ${oom('F4', 'D4')} | ${oom('Eb4', 'G4')} | ${oom('Eb4', 'G4')} |
  ${oom('Eb4', 'G4')} | ${oom('A3', 'Eb4')} | ${oom('D4', 'F4')} | ${oom('A3', 'Eb4')} |`;

const bassA = 'Bb2:4 .:8 | F2:4 .:8 | Eb2:4 .:8 | Bb1:4 .:8 | C2:4 .:8 | F2:4 .:8 | Bb1:4 .:4 D2:4 | F2:4 A2 C3 |';

export default {
  id: 'cistern_court',
  title: 'Cistern Court',
  bpm: 88,
  beatsPerBar: 3,
  swing: 0.06,
  gain: 1.2,
  echo: { delay: 0.34, feedback: 0.3, wet: 0.26, lowpass: 2400 },
  channels: [
    { id: 'lead', inst: 'accordion', vol: 0.85, pan: 0.05, echo: 0.3 },
    { id: 'flute', inst: 'flute', vol: 0.6, pan: 0.25, echo: 0.4, role: 'counter' },
    { id: 'guitar', inst: 'guitar', vol: 0.6, pan: -0.3, echo: 0.2 },
    { id: 'harp', inst: 'harp', vol: 0.45, pan: 0.35, echo: 0.35 },
    { id: 'bass', inst: 'bass', vol: 0.6, pan: 0, echo: 0.05 },
    { id: 'perc', inst: 'kit', vol: 0.5, pan: -0.1, echo: 0.1 },
  ],
  patterns: {
    I: {
      harmony: 'Bb | F7 |',
      lead: '.:12 | .:12 |',
      flute: '.:12 | .:12 |',
      guitar: `${oom('D4', 'F4')} | ${oom('A3', 'Eb4')} |`,
      harp: 'Bb3:2 D4 F4 Bb4 D5 F5 | Eb5 C5 A4 F4 Eb4 C4 |',
      bass: 'Bb2:4 .:8 | F2:4 .:8 |',
      perc: '.:12 | .:4 sh_ sh_ |',
    },
    A: {
      harmony: harmonyA,
      lead: melodyA,
      flute: '(.:12 |)x8',
      guitar: guitarA,
      harp: '(.:12 |)x8',
      bass: bassA,
      perc: '(k_:4 sh_ sh_ |)x8',
    },
    A2: {
      harmony: 'Bb | Bb | Eb | Eb | Cm7 | F7 | Bb | Bb |',
      lead: melodyA2,
      flute: '(.:12 |)x8',
      guitar: '(.:12 |)x8',
      harp: `${roll('Bb3', 'D4', 'F4', 'Bb4')} | ${roll('Bb3', 'D4', 'F4', 'Bb4')} | ${roll('G3', 'Bb3', 'Eb4', 'G4')} | ${roll('G3', 'Bb3', 'Eb4', 'G4')} |
             ${roll('G3', 'C4', 'Eb4', 'G4')} | ${roll('A3', 'C4', 'Eb4', 'F4')} | ${roll('Bb3', 'D4', 'F4', 'Bb4')} | ${roll('Bb3', 'D4', 'F4', 'Bb4')} |`,
      bass: 'Bb2:4 .:8 | F2:4 .:8 | Eb2:4 .:8 | Bb1:4 .:8 | C2:4 .:8 | F2:4 .:8 | Bb1:4 .:8 | Bb1:4 D2 F2 |',
      perc: '(k_:4 sh sh_ |)x7 k_:4 sh sh! |',
    },
    B: {
      harmony: 'Gm | Gm | Eb | Eb | Cm | F | D7 | Gm:4 F7:8 |',
      melody: 'flute',
      lead: 'v70 Bb4:12 | D5 | G4 | Bb4 | G4 | A4 | F#4 | G4:4 A4:8 v100 |',
      flute: `
        G5:6 F5:2 D5:4 |
        Bb4:4 D5 G5 |
        Bb5:6 G5:2 Eb5:4 |
        Bb4:4 Eb5 G5 |
        G5:6 F5:2 Eb5 D5 |
        C5:8 F5:4 |
        A5:6 F#5:2 D5:4 |
        D5:4 C5 A4 |`,
      guitar: `${oom('Bb3', 'D4')} | ${oom('Bb3', 'D4')} | ${oom('Eb4', 'G4')} | ${oom('Eb4', 'G4')} |
               ${oom('Eb4', 'G4')} | ${oom('A3', 'C4')} | ${oom('F#3', 'C4')} | ${oom('A3', 'Eb4')} |`,
      harp: '(.:12 |)x8',
      bass: 'G2:4 .:8 | D2:4 .:8 | Eb2:4 .:8 | Bb1:4 .:8 | C2:4 .:8 | F2:4 .:4 A2:4 | D2:4 .:4 F#2:4 | G2:4 F2 A2 |',
      perc: '(k_:4 sh_ sh_ |)x7 k_:4 sh_:2 sh_ sh sh |',
    },
    A3: {
      harmony: harmonyA,
      lead: melodyA,
      flute: `v40
        F5:12 |
        Bb5:12 |
        Bb5:8 C6:4 |
        Eb6:12 |
        C6:8 Bb5:4 |
        A5:12 |
        Bb5:6 C6:2 D6:4 |
        C6:4 A5 F5 v100 |`,
      guitar: guitarA,
      harp: '(.:12 |)x8',
      bass: bassA,
      perc: '(k:4 sh sh_ |)x8',
    },
  },
  intro: ['I'],
  loop: ['A', 'A2', 'B', 'A3'],
};
