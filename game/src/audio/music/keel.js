// "The Long Keel" — Act 6 (docs/design/06-moon-in-the-bowl.md, "The Long Keel").
// `downstairs`, warm and lit. The same instruments (moonglass, choir, bells, bowed bass, a soft
// pulse) and the same opening, the rhyme upside down (Ab–F–Db–Ab), but in plain D-flat major
// rather than the Lydian, with the raised fourth gone. For the first time Downstairs, the melody
// resolves: the first phrase climbs and lands on D-flat, the second settles on F. The lamps
// chime on the beat as they wake, on bells.
// Loop: 16 bars at 60 bpm = 64 s. Format: docs/audio-direction.md.

export default {
  id: 'keel',
  title: 'The Long Keel',
  bpm: 60,
  gain: 0.85,
  echo: { delay: 0.5, feedback: 0.42, wet: 0.4, lowpass: 2600, spread: 0.04 },
  channels: [
    { id: 'lead', inst: 'glass', vol: 0.9, pan: 0.05, echo: 0.5 },
    { id: 'bell', inst: 'bell', vol: 0.3, pan: 0.4, echo: 0.6 },
    { id: 'choir', inst: 'choir', vol: 0.45, pan: -0.25, echo: 0.45 },
    { id: 'bass', inst: 'bowbass', vol: 0.45, pan: 0, echo: 0.2 },
    { id: 'pulse', inst: 'kit', vol: 0.4, pan: 0, echo: 0.3 },
  ],
  patterns: {
    A: {
      harmony: 'Db | Ab/C | Bbm | Gb | Db/F | Gb | Ab | Db |',
      lead: `
        Ab5:4 F5 Db5 Ab4 |
        Ab5:6 Gb5:2 F5:4 Eb5 |
        Db5:8 F5 |
        Bb4:4 Db5 Gb5:8 |
        F5:4 Ab5 Db6:8 |
        Bb5:6 Ab5:2 Gb5:8 |
        Eb5:4 Ab5 C6:8 |
        Db6:16 |`,
      bell: `
        Ab6:8 F6 | Eb6:8 C6 | F6:8 Db6 | Db6:8 Bb5 |
        Ab6:8 F6 | Gb6:8 Db6 | Eb6:8 C6 | F6:8 Db6 |`,
      choir: 'F4:16 | Eb4 | F4 | Bb3 | Ab4 | Bb4 | C5 | F4 |',
      bass: 'Db2:16 | C2 | Bb2 | Gb2 | F2 | Gb2 | Ab2 | Db2 |',
      pulse: '(pulse_:8 pulse_ |)x8',
    },
    B: {
      harmony: 'Bbm | Ebm7 | Ab | Db/F | Gbmaj7 | Ebm7 | Ab7 | Db |',
      lead: `
        F5:4 Db5 Bb4:8 |
        Gb5:6 F5:2 Eb5:8 |
        C5:4 Eb5 Ab5:8 |
        F5:8 Ab5 |
        Bb5:4 F5 Db5:8 |
        Gb5:6 Eb5:2 Bb4:8 |
        C5:4 Eb5 Gb5:8 |
        F5:16 |`,
      bell: `
        Db6:8 F6 | Bb5:8 Gb6 | Eb6:8 C6 | Ab5:8 F6 |
        F6:8 Db6 | Gb6:8 Eb6 | Gb6:8 Eb6 | Ab6:8 F6 |`,
      choir: 'F4:16 | Gb4 | Eb4 | Ab4 | Bb4 | Gb4 | Gb4 | F4 |',
      bass: 'Bb2:16 | Eb2 | Ab2 | F2 | Gb2 | Eb2 | Ab2 | Db2 |',
      pulse: '(pulse_:8 pulse_ |)x8',
    },
  },
  intro: [],
  loop: ['A', 'B'],
};
