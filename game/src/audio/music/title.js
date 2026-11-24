// "Moonshine" — the title theme.
// Slow and wide. It opens with the home motif (A–C–F, the same rising figure that starts the
// neighborhood theme) and then turns, twice, to a D-flat chord that doesn't belong to F major:
// the first hint that something lies under the city. The last phrase climbs Db–Eb–F, hopeful.
// Loop: 16 bars at 72 bpm = 53.3 s. Format: docs/audio-direction.md.

const arp = (a, b, c, d, e) => `${a}:2 ${b} ${c} ${d} ${e} ${d} ${c} ${b}`;
const H = {
  F: arp('F3', 'C4', 'F4', 'A4', 'C5'),
  Am: arp('A3', 'C4', 'E4', 'A4', 'C5'),
  Bb: arp('F3', 'Bb3', 'D4', 'F4', 'Bb4'),
  Gm7: arp('G3', 'D4', 'F4', 'Bb4', 'D5'),
  Db: arp('Ab3', 'Db4', 'F4', 'Ab4', 'C5'),
  Csus: arp('G3', 'C4', 'F4', 'G4', 'C5'),
  C: arp('G3', 'C4', 'E4', 'G4', 'C5'),
  Bbm: arp('F3', 'Bb3', 'Db4', 'F4', 'Bb4'),
  Dm: arp('F3', 'A3', 'D4', 'F4', 'A4'),
  Eb: arp('G3', 'Bb3', 'Eb4', 'G4', 'Bb4'),
};

export default {
  id: 'title',
  title: 'Moonshine',
  bpm: 72,
  gain: 0.9,
  echo: { delay: 0.42, feedback: 0.42, wet: 0.36, lowpass: 2300, spread: 0.03 },
  channels: [
    { id: 'lead', inst: 'flute', vol: 0.8, pan: 0, echo: 0.45 },
    { id: 'bell', inst: 'bell', vol: 0.5, pan: 0.4, echo: 0.6 },
    { id: 'harp', inst: 'harp', vol: 0.5, pan: -0.4, echo: 0.4 },
    { id: 'pad', inst: 'strings', vol: 0.55, pan: 0.2, echo: 0.3 },
    { id: 'bass', inst: 'bowbass', vol: 0.5, pan: 0, echo: 0.1 },
    { id: 'perc', inst: 'kit', vol: 0.55, pan: -0.15, echo: 0.3 },
  ],
  patterns: {
    I: {
      lead: '.:16 | .:16 |',
      bell: '.:8 C6:8 | .:8 Ab5:8 |',
      harp: 'F3:2 C4 F4 A4 C5 F5 A5 C6 | Ab3 Db4 F4 Ab4 C5 F5 Ab5 C6 |',
      pad: '.:16 | .:16 |',
      bass: 'F2:16 | Db2:16 |',
      perc: '.:16 | .:8 swell:8 |',
    },
    A: {
      lead: `
        A4:2 C5 F5:8 E5:2 F5 |
        A5:8 G5:4 E5 |
        F5:6 D5:2 Bb4:4 C5:2 D5 |
        C5:12 A4:2 C5 |
        D5:4 F5 Bb5:6 A5:2 |
        Ab5:8 F5:4 Db5 |
        F5:8 G5:6 F5:2 |
        E5:12 .:4 |
        A4:2 C5 F5:8 E5:2 F5 |
        A5:8 C6:4 A5 |
        D6:6 C6:2 Bb5:4 F5 |
        Db6:6 C6:2 Bb5:4 F5 |
        A5:8 F5:4 D5 |
        F5:6 Ab5:2 Db6:8 |
        C6:4 Bb5 G5 Eb5 |
        F5:16 |`,
      bell: `
        C6:16 | .:16 | .:16 | .:4 A5 G5 F5 |
        .:16 | Db6:16 | .:16 | .:4 G5 C6 E6 |
        C6:16 | .:16 | .:16 | .:4 Db6 C6 Bb5 |
        .:16 | Ab5:16 | G5:8 Bb5 | .:4 A5 C6 F6 |`,
      harp: `${H.F} | ${H.Am} | ${H.Bb} | ${H.F} | ${H.Gm7} | ${H.Db} | ${H.Csus} | ${H.C} |
             ${H.F} | ${H.Am} | ${H.Bb} | ${H.Bbm} | ${H.Dm} | ${H.Db} | ${H.Eb} | ${H.F} |`,
      pad: `A3:16 | C4 | D4 | C4 | F4 | F4 | F4 | E4 |
            A3 | C4 | D4 | Db4 | D4 | F4 | G4 | A4 |`,
      bass: `F2:16 | A2 | Bb2 | A2 | G2 | Db2 | C2 | C2:8 C3 |
             F2:16 | A2 | Bb2 | Bb2 | D2 | Db2 | Eb2 | F2 |`,
      perc: `.:16 | .:16 | .:16 | .:16 | .:16 | .:16 | .:16 | .:8 swell:8 |
             .:16 | .:16 | .:16 | .:16 | k_:8 k_ | k_:8 k_ | tom:4 .:4 swell:8 | .:16 |`,
    },
  },
  intro: ['I'],
  loop: ['A'],
};
