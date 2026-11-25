// "We're a Boat" — the reveal cue (one-shot, playCue('reveal')), after "Oh, we're a boat." in
// the Chart Room (docs/design/03-downstairs.md).
// The skipping rhyme's first couplet, slowly, on glass bells over a held D-flat chord: the first
// time the player hears the rhyme in the Founders' voice. It is the children's tune moved to
// D-flat, the hidden city's key, with the raised fourth of the Founders' mode (G natural where
// the children sing G-flat), as in `downstairs`.
// `reveal_last` is its last phrase alone, softer, for under the dusk vista at the end of Act 3.
// 4 bars at 64 bpm = 15 s (reveal_last: 2 bars, 7.5 s), plus the echo. Format:
// docs/audio-direction.md.

// The rhyme's first couplet (RHYME in moonrise.js, bars 1–4), in D-flat with G natural.
const LINE1 = 'Ab4:4 Db5 F5 Ab5 | Ab5:3 G5:1 F5:2 Eb5 Eb5:8 |';
const LINE2 = 'Bb4:2 Db5 F5:4 G5:2 F5 Db5:4 | Eb5:4 Ab5:12 |';

const channels = [
  { id: 'bell', inst: 'bell', vol: 0.9, pan: 0.1, echo: 0.6, role: 'melody' },
  { id: 'glass', inst: 'glass', vol: 0.4, pan: -0.25, echo: 0.6, transpose: -12, role: 'counter' },
  { id: 'choir', inst: 'choir', vol: 0.45, pan: 0.3, echo: 0.5 },
  { id: 'pad', inst: 'strings', vol: 0.35, pan: -0.35, echo: 0.4 },
  { id: 'bass', inst: 'bowbass', vol: 0.5, pan: 0, echo: 0.2 },
];

export const reveal = {
  id: 'reveal',
  title: "We're a Boat",
  bpm: 64,
  gain: 1,
  echo: { delay: 0.55, feedback: 0.55, wet: 0.5, lowpass: 2200, spread: 0.04 },
  channels,
  patterns: {
    R: {
      harmony: 'Db | Db | Db | Db |',
      bell: `${LINE1} ${LINE2}`,
      glass: `${LINE1} ${LINE2}`,
      choir: 'F4:16 | F4 | F4 | F4 |',
      pad: 'Ab3:16 | Ab3 | Ab3 | Ab3 |',
      bass: 'Db2:16 | Db2 | Db2 | Db2 |',
    },
  },
  intro: ['R'],
  loop: null,
  lintAllow: [
    { match: 'R/bell bar 3 beat 3', why: "the Founders' raised fourth (G over D-flat) is the point" },
    { match: 'R/glass bar 3 beat 3', why: "the Founders' raised fourth, doubled an octave down" },
  ],
};

export const reveal_last = {
  ...reveal,
  id: 'reveal_last',
  title: "We're a Boat (last phrase)",
  gain: 0.6,
  patterns: {
    L: {
      harmony: 'Db | Db |',
      bell: LINE2,
      glass: LINE2,
      choir: 'F4:16 | F4 |',
      pad: 'Ab3:16 | Ab3 |',
      bass: 'Db2:16 | Db2 |',
    },
  },
  intro: ['L'],
  lintAllow: [
    { match: 'L/bell bar 1 beat 3', why: "the Founders' raised fourth (G over D-flat) is the point" },
    { match: 'L/glass bar 1 beat 3', why: "the Founders' raised fourth, doubled an octave down" },
  ],
};
