// "Morning After" — the morning after Moonshine Night, in Cheryl's flat and the court.
// A thinner, uneasy variation of Cistern Court: the same tune, but in G minor, on a lone ocarina
// over a harp's pah-pah and a bowed bass, with a clock ticking (the Mayor's clock, though nobody
// says so). Its second half quotes the skipping rhyme's opening (sol–do–mi–sol, rising to a held
// top note) in E-flat and doesn't finish it, and the
// last note leans on F# so the loop comes back to F with a little lurch. Everything is very
// slightly out of tune.
// Loop: 16 bars of 3/4 at 76 bpm = 37.9 s. Format: docs/audio-direction.md.

const pah = (a, b) => `.:4 ${a}:4 ${b}`;

export default {
  id: 'morning_after',
  title: 'Morning After',
  bpm: 76,
  beatsPerBar: 3,
  gain: 0.95,
  wrongness: 0.12,
  echo: { delay: 0.4, feedback: 0.35, wet: 0.3, lowpass: 2000 },
  channels: [
    { id: 'lead', inst: 'ocarina', vol: 0.85, pan: 0, echo: 0.4 },
    { id: 'harp', inst: 'harp', vol: 0.75, pan: -0.3, echo: 0.35 },
    { id: 'pad', inst: 'strings', vol: 0.4, pan: 0.3, echo: 0.3 },
    { id: 'bass', inst: 'bowbass', vol: 0.6, pan: 0, echo: 0.1 },
    { id: 'clock', inst: 'kit', vol: 0.5, pan: 0.2, echo: 0.15 },
  ],
  patterns: {
    M1: {
      harmony: 'Gm7 | Gm | Eb | Eb | Cm | D7 | Gm | D7 |',
      lead: `
        F4:4 Bb4 D5 |
        F5:6 Eb5:2 D5:4 |
        Eb5:4 G5 Bb5 |
        Bb5:8 G5:4 |
        G5:6 F5:2 Eb5:4 |
        F#5:6 Eb5:2 C5:4 |
        D5:12 |
        Eb5:4 C5 A4 |`,
      harp: `${pah('Bb3', 'F4')} | ${pah('Bb3', 'D4')} | ${pah('Bb3', 'Eb4')} | ${pah('Bb3', 'Eb4')} |
             ${pah('Eb4', 'G4')} | ${pah('F#3', 'C4')} | ${pah('Bb3', 'D4')} | ${pah('F#3', 'C4')} |`,
      pad: '(.:12 |)x8',
      bass: 'G2:12 | G2 | Eb2 | Eb2 | C2 | D2 | G2 | D2 |',
      clock: '(tick:4 tock tick | tock tick tock |)x4',
    },
    M2: {
      harmony: 'Ebmaj7 | Ebmaj7 | Cm | Cm | Gm | Gm | D7sus4 | D7 |',
      lead: `
        Bb4:4 Eb5 G5 |
        Bb5:12 |
        Bb5:6 Ab5:2 G5:4 |
        F5:8 Eb5:4 |
        D5:12 |
        .:12 |
        C5:4 A4 G4 |
        F#4:12 |`,
      harp: `${pah('Bb3', 'G4')} | ${pah('Bb3', 'G4')} | ${pah('Eb4', 'G4')} | ${pah('Eb4', 'G4')} |
             ${pah('Bb3', 'D4')} | ${pah('Bb3', 'D4')} | ${pah('G3', 'C4')} | ${pah('F#3', 'C4')} |`,
      pad: 'G4:12 | G4 | Eb4 | Eb4 | Bb3 | Bb3 | A3 | A3 |',
      bass: 'Eb2:12 | Eb2 | C2 | C2 | G2 | G2 | D2 | D2 |',
      clock: '(tick:4 tock tick | tock tick tock |)x4',
    },
  },
  intro: [],
  loop: ['M1', 'M2'],
  lintAllow: [
    { match: 'M1/lead bar 8 beat 1', why: 'E-flat over D7 (a flat ninth) is the unease this piece is about' },
  ],
};
