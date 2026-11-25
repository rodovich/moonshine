// "Downstairs" — the Founders' world: the Step Gallery and the Lamp Halls (the first underground
// theme; overview.md, Act 3).
// It is the surface's music turned inside out. The key is D-flat, the flat sixth that the
// surface pieces only glance at, in the Lydian mode: its fourth is raised (G natural). The tune,
// on moonglass, is the skipping rhyme upside down: "Moonshine, moonshine" falls (Ab–F–Db–Ab)
// instead of rising, and "catch it in a" sings sol–FA–mi with the raised fourth, as if the
// Founders' own version of the rhyme were a little stranger than the children's. No hand
// percussion: only a slow pulse, like machinery a long way off, and long, wet echo.
// The loop ends on that raised G, glowing and unresolved.
// Loop: 16 bars of 4/4 at 54 bpm = 71.1 s. Format: docs/audio-direction.md.

export default {
  id: 'downstairs',
  title: 'Downstairs',
  bpm: 54,
  gain: 0.75, // quiet enough to hear the hull creak (03-downstairs.md)
  echo: { delay: 0.6, feedback: 0.5, wet: 0.45, lowpass: 1800, spread: 0.05 },
  channels: [
    { id: 'lead', inst: 'glass', vol: 0.9, pan: 0.05, echo: 0.55 },
    { id: 'bell', inst: 'bell', vol: 0.45, pan: 0.4, echo: 0.7 },
    { id: 'choir', inst: 'choir', vol: 0.5, pan: -0.25, echo: 0.5 },
    { id: 'bass', inst: 'bowbass', vol: 0.5, pan: 0, echo: 0.2 },
    { id: 'pulse', inst: 'kit', vol: 0.6, pan: 0, echo: 0.35 },
  ],
  patterns: {
    A: {
      harmony: 'Db | Db Eb/Db | Db | Eb/Db | Bbm | Ab | Gbmaj7 | Ab |',
      lead: `
        Ab5:4 F5 Db5 Ab4 |
        Ab5:6 G5:2 F5:4 Eb5 |
        Eb5:8 Db5 |
        .:16 |
        F5:4 Bb5 Db6:8 |
        C6:6 Bb5:2 Ab5:8 |
        Bb5:8 F5 |
        Eb5:16 |`,
      bell: `
        .:16 | .:16 | .:16 | .:4 Bb5 G5 Eb5 |
        .:16 | .:16 | .:16 | .:8 Ab5:4 Eb6 |`,
      choir: 'F4:16 | F4:8 Bb4 | F4:16 | G4 | F4 | Eb4 | F4 | Eb4 |',
      bass: 'Db2:16 | Db2 | Db2 | Db2 | Bb2 | Ab2 | Gb2 | Ab2 |',
      pulse: '(pulse:4 pulse_ .:8 |)x8',
    },
    B: {
      harmony: 'Bbm | Fm | Gbmaj7 | Db/F | Ebm7 | Ab7sus4 | Db | Eb/Db |',
      lead: `
        Db5:4 F5 Bb5:8 |
        Ab5:6 G5:2 F5:4 C5 |
        Db5:8 Bb4 |
        Ab4:16 |
        Bb4:4 Eb5 Gb5:8 |
        Db5:8 Eb5 |
        F5:16 |
        G5:16 |`,
      bell: `
        .:16 | .:16 | .:16 | .:8 F5:4 Ab5 |
        .:16 | .:16 | .:16 | .:8 Bb5:8 |`,
      choir: 'F4:16 | Ab4 | Bb4 | F4 | Gb4 | Gb4 | F4 | G4 |',
      bass: 'Bb2:16 | F2 | Gb2 | F2 | Eb2 | Ab2 | Db2 | Db2 |',
      pulse: '(pulse:4 pulse_ .:8 |)x8',
    },
  },
  intro: [],
  loop: ['A', 'B'],
};
