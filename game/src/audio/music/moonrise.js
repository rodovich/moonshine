// "Moonrise" — a music box playing the skipping rhyme, slowly, on Cheryl's roof as the moon
// comes up. The rhyme's tune is the game's central motif (see docs/audio-direction.md).
// At the moment the moon appears in the wrong place, the game calls windDownMusic(): the box
// slows, sags flat, and stops mid-phrase.
//
// The tune is built from Cheryl's home theme (Cistern Court), so the home tune turns out to be a
// fragment of the Founders' rhyme:
//   MOON-shine, MOON-shine, CATCH it in a CUP,     Cistern Court's opening, note for note, in F:
//                                                  C–F–A–C (sol–do–mi–sol), then C–Bb–A (sol–fa–mi)
//   ring the BELL when the TIDE turns UP.          the same thirds and fourth, rearranged:
//                                                  D–F–A, Bb–A–F, then G up a fourth to C
//   THIN sister, STOUT sister, MIDdle sister THREE,  two sisters climb on F and C7; the greedy
//                                                  Middle sister turns to D-flat (the flat sixth)
//   wake them ONE by ONE and they'll DRINK up the SEA.  E-flat, then C7, home to F
//                                                  (the Db–Eb–F climb of the title)
// Loop: 8 bars of 4/4 at 63 bpm = 30.5 s. Format: docs/audio-direction.md.

export const RHYME = `
  C5:4 F5 A5 C6 |
  C6:3 Bb5:1 A5:2 G5 G5:8 |
  D5:2 F5 A5:4 Bb5:2 A5 F5:4 |
  G5:4 C6:12 |
  F5:4 A5:2 C6 G5:4 Bb5:2 C6 |
  Ab5:2 F5 Db5 F5 Ab5:8 |
  G5:2 G5 Bb5:4 G5:2 Eb5:4 F5:2 |
  G5:2 A5:4 G5:1 E5 F5:8 |`;

export const RHYME_HARMONY = 'F | F C7 | Dm Bb | C | F C7 | Db | Eb | C7 F |';

export default {
  id: 'moonrise',
  title: 'Moonrise',
  bpm: 63,
  gain: 1.15,
  echo: { delay: 0.45, feedback: 0.4, wet: 0.4, lowpass: 3000, spread: 0.03 },
  channels: [
    { id: 'lead', inst: 'musicbox', vol: 0.9, pan: 0.1, echo: 0.45 },
    { id: 'comb', inst: 'musicbox', vol: 0.65, pan: -0.15, echo: 0.4 },
    { id: 'bass', inst: 'musicbox', vol: 1, pan: 0, echo: 0.3 },
  ],
  patterns: {
    R: {
      harmony: RHYME_HARMONY,
      lead: RHYME,
      comb: `
        F4:4 A4 C5 A4 |
        F4 A4 E4 Bb4 |
        D4 A4 Bb3 F4 |
        E4 G4 C5 G4 |
        F4 A4 E4 Bb4 |
        Db4 F4 Ab4 F4 |
        Eb4 G4 Bb4 G4 |
        E4 Bb4 F4 A4 |`,
      bass: 'F3:16 | F3:8 C3 | D3 Bb2 | C3:16 | F3:8 C3 | Db3:16 | Eb3 | C3:8 F3 |',
    },
  },
  intro: [],
  loop: ['R'],
};
