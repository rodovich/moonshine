// "Moonshine" — the title theme.
// The skipping rhyme's tune (see moonrise.js), sung broadly on the flute over rippling harp and
// strings. After the first couplet the music turns, twice, to a D-flat chord that doesn't
// belong in F major: the first hint that something lies under the city. The last phrase climbs
// Db–Eb–F, hopeful.
// Loop: 16 bars at 72 bpm = 53.3 s. Format: docs/audio-direction.md.

const arp = (a, b, c, d, e) => `${a}:2 ${b} ${c} ${d} ${e} ${d} ${c} ${b}`;
const half = (a, b, c, d) => `${a}:2 ${b} ${c} ${d}`;
const H = {
  F: arp('F3', 'C4', 'F4', 'A4', 'C5'),
  C7: arp('G3', 'C4', 'E4', 'Bb4', 'C5'),
  Gm7: arp('G3', 'D4', 'F4', 'Bb4', 'D5'),
  Db: arp('Ab3', 'Db4', 'F4', 'Ab4', 'Db5'),
  Csus: arp('G3', 'C4', 'F4', 'G4', 'C5'),
  C: arp('G3', 'C4', 'E4', 'G4', 'C5'),
  Dm: arp('F3', 'A3', 'D4', 'F4', 'A4'),
  Eb: arp('G3', 'Bb3', 'Eb4', 'G4', 'Bb4'),
  hF: half('F3', 'C4', 'F4', 'A4'),
  hDm: half('F3', 'A3', 'D4', 'F4'),
  hGm7: half('G3', 'D4', 'F4', 'Bb4'),
  hC7: half('G3', 'C4', 'E4', 'Bb4'),
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
    { id: 'harp', inst: 'harp', vol: 0.6, pan: -0.4, echo: 0.4 },
    { id: 'pad', inst: 'strings', vol: 0.55, pan: 0.2, echo: 0.3 },
    { id: 'bass', inst: 'bowbass', vol: 0.5, pan: 0, echo: 0.1 },
    { id: 'perc', inst: 'kit', vol: 0.55, pan: -0.15, echo: 0.3 },
  ],
  patterns: {
    I: {
      harmony: 'F | Db |',
      lead: '.:16 | .:16 |',
      bell: '.:8 C6:8 | .:8 Ab5:8 |',
      harp: 'F3:2 C4 F4 A4 C5 F5 A5 C6 | Ab3 Db4 F4 Ab4 Db5 F5 Ab5 Db6 |',
      pad: '.:16 | .:16 |',
      bass: 'F2:16 | Db2:16 |',
      perc: '.:16 | .:8 swell:8 |',
    },
    A: {
      harmony: `F | C7 | F Dm | F:4 C:12 | Gm7 | Db | Csus4 | C |
                F Gm7 | F | F Dm | C7 F | Dm | Db | Eb | F |`,
      lead: `
        C6:4 A5 D6 A5 |
        C6:2 Bb5 A5 F5 G5:8 |
        A5:2 Bb5 C6:4 D6:2 C6 A5:4 |
        A5:4 C6:6 Bb5:2 A5 F5 |
        D5:4 F5 Bb5:6 A5:2 |
        Ab5:8 F5:4 Db5 |
        F5:8 G5:6 F5:2 |
        E5:12 .:4 |
        F5:4 G5:2 A5 G5:4 A5:2 Bb5 |
        A5:2 Bb5 C6 Bb5 A5:8 |
        C6:2 C6 D6:4 C6:2 A5:4 F5:2 |
        G5:2 Bb5:4 A5:1 G5 F5:8 |
        A5:8 F5:4 D5 |
        F5:6 Ab5:2 Db6:8 |
        C6:4 Bb5 G5 Eb5 |
        F5:16 |`,
      bell: `
        .:16 | .:8 E6:4 C6 | .:16 | .:16 |
        .:16 | Db6:16 | .:16 | .:4 G5 C6 E6 |
        .:16 | .:8 F6:4 C6 | .:16 | .:8 A5:4 C6 |
        .:16 | Ab5:16 | G5:8 Bb5 | .:4 A5 C6 F6 |`,
      harp: `${H.F} | ${H.C7} | ${H.hF} ${H.hDm} | F3:2 C4 E4 G4 C5 G4 E4 C4 |
             ${H.Gm7} | ${H.Db} | ${H.Csus} | ${H.C} |
             ${H.hF} ${H.hGm7} | F3:2 C4 F4 C5 A4 C5 F4 C4 | ${H.hF} ${H.hDm} | ${H.hC7} ${H.hF} |
             ${H.Dm} | ${H.Db} | ${H.Eb} | ${H.F} |`,
      pad: `A3:16 | Bb3 | A3 | A3:4 G3:12 | F4:16 | F4 | F4 | E4 |
            A3:8 Bb3 | C4:16 | C4:8 D4 | Bb3 A3 | D4:16 | F4 | G4 | A4 |`,
      bass: `F2:16 | C2 | F2:8 D2 | F2:4 C2:12 | G2:16 | Db2 | C2 | C2 |
             F2:8 G2 | F2:16 | F2:8 D2 | C2 F2 | D2:16 | Db2 | Eb2 | F2 |`,
      perc: `.:16 | .:16 | .:16 | .:16 | .:16 | .:16 | .:16 | .:8 swell:8 |
             .:16 | .:16 | .:16 | .:16 | k_:8 k_ | k_:8 k_ | tom:4 .:4 swell:8 | .:16 |`,
    },
  },
  intro: ['I'],
  loop: ['A'],
};
