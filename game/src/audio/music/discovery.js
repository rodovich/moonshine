// "The Hundredth Step" — a short discovery sting (a cue: playCue('discovery')), for the
// hundredth step opening and other first glimpses of the Founders' work.
// Bells and choir on the D-flat chord, the hidden city's color, then the bass climbs
// Db–Eb–F (the same climb that ends the title) and lands on F major with A on top. Wonder, with
// a chill: the long echo keeps ringing after it stops.
// 2 bars at 60 bpm = 8 s, plus the echo. Format: docs/audio-direction.md.

export default {
  id: 'discovery',
  title: 'The Hundredth Step',
  bpm: 60,
  gain: 1,
  echo: { delay: 0.5, feedback: 0.55, wet: 0.5, lowpass: 2400, spread: 0.04 },
  channels: [
    { id: 'bell', inst: 'bell', vol: 0.9, pan: 0.1, echo: 0.6, role: 'melody' },
    { id: 'glass', inst: 'glass', vol: 0.45, pan: -0.3, echo: 0.6 },
    { id: 'choir', inst: 'choir', vol: 0.5, pan: 0.3, echo: 0.5 },
    { id: 'bass', inst: 'bowbass', vol: 0.5, pan: 0, echo: 0.2 },
  ],
  patterns: {
    D: {
      harmony: 'Db | Eb F |',
      bell: 'Db5:2 F5 Ab5 Db6 F6:8 | G5:8 A5:8 |',
      glass: 'Ab4:16 | Bb4:8 C5:8 |',
      choir: 'F4:16 | G4:8 A4:8 |',
      bass: 'Db2:16 | Eb2:8 F2:8 |',
    },
  },
  intro: ['D'],
  loop: null,
};
