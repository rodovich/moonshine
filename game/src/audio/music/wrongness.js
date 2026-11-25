// "Something Wrong" — the Wrongness motif, a one-shot cue (no loop) that interrupts the music
// through playCue('wrongness').
// The skipping rhyme starts on sagging bells (MOON-shine, MOON-shine) but its second
// "moonshine" lands a half step low, and "catch it in a cup" slides down chromatically
// (C–B–Bb–A–Ab) while a choir holds a B against the F below: a tritone where home should be.
// Everything drifts flat. 2 bars at 66 bpm ≈ 7.3 s, then the echo rings out.
// Format: docs/audio-direction.md.

export default {
  id: 'wrongness',
  title: 'Something Wrong',
  bpm: 66,
  gain: 1,
  wrongness: 0.5,
  lint: { clashes: false }, // the clashes are the point
  echo: { delay: 0.37, feedback: 0.55, wet: 0.45, lowpass: 1800, spread: 0.05 },
  channels: [
    { id: 'bell', inst: 'wrongbell', vol: 0.8, pan: -0.15, echo: 0.6, role: 'melody' },
    { id: 'pad', inst: 'wrongpad', vol: 0.7, pan: 0.2, echo: 0.4 },
    { id: 'ghost', inst: 'choir', vol: 0.45, pan: 0.35, echo: 0.6 },
    { id: 'bass', inst: 'bowbass', vol: 0.5, pan: 0, echo: 0.1 },
    { id: 'perc', inst: 'kit', vol: 0.6, pan: 0, echo: 0.4 },
  ],
  patterns: {
    W: {
      harmony: 'N | N |',
      bell: 'C5:4 A4 Db5 Ab4 | C5:2 B4 Bb4 A4 Ab4:8 |',
      pad: 'F3:16 | E3:16 |',
      ghost: '.:8 B4:8 | Bb4:12 .:4 |',
      bass: 'F2:16 | E2:12 .:4 |',
      perc: 'tom:16 | .:16 |',
    },
  },
  intro: ['W'],
  loop: null,
};
