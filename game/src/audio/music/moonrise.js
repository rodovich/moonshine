// "Moonrise" — a music box playing the skipping rhyme, slowly, on Cheryl's roof as the moon
// comes up. The rhyme's tune is the game's central motif (see docs/audio-direction.md).
// At the moment the moon appears in the wrong place, the game calls windDownMusic(): the box
// slows, sags flat, and stops mid-phrase.
//
// The tune, to the rhyme's first four lines:
//   MOON-shine, MOON-shine, CATCH it in a CUP,
//   ring the BELL when the TIDE turns UP.
//   THIN sister, STOUT sister, MIDdle sister THREE,
//   wake them ONE by ONE and they'll DRINK up the SEA.
// Loop: 8 bars of 4/4 at 63 bpm = 30.5 s. Format: docs/audio-direction.md.

export const RHYME = `
  C6:4 A5 D6 A5 |
  C6:2 Bb5 A5 F5 G5:8 |
  A5:2 Bb5 C6:4 D6:2 C6 A5:4 |
  A5:4 C6:12 |
  F5:4 G5:2 A5 G5:4 A5:2 Bb5 |
  A5:2 Bb5 C6 Bb5 A5:8 |
  C6:2 C6 D6:4 C6:2 A5:4 F5:2 |
  G5:2 Bb5:4 A5:1 G5 F5:8 |`;

export const RHYME_HARMONY = 'F | C7 | F Dm | F:4 C:12 | F Gm7 | F | F Dm | C7 F |';

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
        E4 G4 Bb4 G4 |
        F4 A4 D4 F4 |
        A4 G4 E4 G4 |
        F4 A4 G4 Bb4 |
        F4 C5 A4 C5 |
        F4 A4 D4 F4 |
        E4 Bb4 F4 A4 |`,
      bass: 'F3:16 | C3 | F3:8 D3 | F3:4 C3:12 | F3:8 G3 | F3:16 | F3:8 D3 | C3 F3 |',
    },
  },
  intro: [],
  loop: ['R'],
};
