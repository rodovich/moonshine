// "Moon True" — a short swell as the Basin's rim lights and every lamp blazes (Act 6, "Moon
// true"). A one-shot: playCue('moon_true', { resume: false }) or playMusic('moon_true').
// The choir and strings swell on D-flat, step up to E-flat, and land on F major, the home chord,
// with moonglass and bells running up it. Its built-in Wrongness is 0, and from here on the game's
// is too: the first time the music is entirely in tune.
// 3 bars at 66 bpm = 10.9 s, then the chord rings. Format: docs/audio-direction.md.

export default {
  id: 'moon_true',
  title: 'Moon True',
  bpm: 66,
  gain: 0.9,
  wrongness: 0,
  echo: { delay: 0.5, feedback: 0.45, wet: 0.45, lowpass: 3000, spread: 0.04 },
  channels: [
    { id: 'lead', inst: 'glass', vol: 0.85, pan: 0.05, echo: 0.5 },
    { id: 'bell', inst: 'bell', vol: 0.5, pan: 0.35, echo: 0.6 },
    { id: 'choir', inst: 'choir', vol: 0.55, pan: -0.25, echo: 0.45, role: 'counter' },
    { id: 'pad', inst: 'strings', vol: 0.5, pan: 0.25, echo: 0.35 },
    { id: 'bass', inst: 'bowbass', vol: 0.5, pan: 0, echo: 0.2 },
  ],
  patterns: {
    M: {
      harmony: 'Db | Eb | F |',
      lead: 'Ab4:8 Db5:8 | Bb4:8 Eb5:8 | C5:2 F5 A5 C6 A5:8 |',
      bell: '.:16 | .:16 | F5:2 A5 C6 F6:10 |',
      choir: 'v25 F4:4 v45 -:4 v65 -:4 v85 -:4 | v100 G4:16 | A4:16 |',
      pad: 'v25 Ab3:4 v45 -:4 v65 -:4 v85 -:4 | v100 Bb3:16 | C4:16 |',
      bass: 'Db2:16 | Eb2:16 | F2:16 |',
    },
  },
  intro: ['M'],
  loop: null,
};
