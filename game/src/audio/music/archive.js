// "Dust in Sunlight" — the Archive in the Blue Dome, and the crypt beneath it.
// Quiet harp and a single bell, slow. The bell picks out the skipping rhyme's opening (C–F–A) and
// a few more notes, far apart, like someone reading aloud to themselves. At the end the harmony
// turns to D-flat, the hidden city's chord, and the bell stops on C against it and doesn't
// resolve: the loop starts again as if nothing happened.
// Loop: 12 bars of 4/4 at 56 bpm = 51.4 s. Format: docs/audio-direction.md.

const wave = (a, b, c, d, e) => `${a}:2 ${b} ${c} ${d} ${e} ${d} ${c} ${b}`;

export default {
  id: 'archive',
  title: 'Dust in Sunlight',
  bpm: 56,
  gain: 1.6,
  echo: { delay: 0.48, feedback: 0.42, wet: 0.38, lowpass: 2600, spread: 0.03 },
  channels: [
    { id: 'bell', inst: 'bell', vol: 0.95, pan: 0.15, echo: 0.55, role: 'melody' },
    { id: 'harp', inst: 'harp', vol: 0.4, pan: -0.3, echo: 0.4 },
    { id: 'pad', inst: 'strings', vol: 0.3, pan: 0.3, echo: 0.3 },
    { id: 'bass', inst: 'bowbass', vol: 0.4, pan: 0, echo: 0.1 },
  ],
  patterns: {
    A: {
      harmony: `Fmaj7 | Fmaj7 | Bbmaj7 | Bbmaj7 | Dm7 | Gm7 | Fmaj7 | Fmaj7 |
                Bbmaj7 | Gm7 | Db | Db |`,
      bell: `
        C5:4 F5 A5:8 |
        .:16 |
        .:4 A5 G5 F5 |
        D5:16 |
        .:8 A5:4 C6 |
        Bb5:8 A5:4 F5 |
        E5:16 |
        .:16 |
        D5:4 F5 A5:8 |
        G5:8 F5:4 D5 |
        F5:4 Ab5 Db6:8 |
        C6:12 .:4 |`,
      harp: `
        ${wave('F3', 'C4', 'F4', 'A4', 'C5')} |
        ${wave('F3', 'C4', 'E4', 'A4', 'C5')} |
        ${wave('Bb2', 'F3', 'A3', 'D4', 'F4')} |
        ${wave('Bb2', 'F3', 'A3', 'D4', 'F4')} |
        ${wave('D3', 'A3', 'C4', 'F4', 'A4')} |
        ${wave('G3', 'D4', 'F4', 'Bb4', 'D5')} |
        ${wave('F3', 'C4', 'E4', 'A4', 'C5')} |
        ${wave('F3', 'C4', 'E4', 'A4', 'C5')} |
        ${wave('Bb2', 'F3', 'A3', 'D4', 'F4')} |
        ${wave('G3', 'D4', 'F4', 'Bb4', 'D5')} |
        ${wave('Db3', 'Ab3', 'Db4', 'F4', 'Ab4')} |
        ${wave('Db3', 'Ab3', 'Db4', 'F4', 'Ab4')} |`,
      pad: 'A3:16 | A3 | D4 | D4 | C4 | Bb3 | A3 | A3 | D4 | D4 | F4 | F4 |',
      bass: 'F2:16 | F2 | Bb2 | Bb2 | D2 | G2 | F2 | F2 | Bb2 | G2 | Db2 | Db2 |',
    },
  },
  intro: [],
  loop: ['A'],
};
