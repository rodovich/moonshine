// "The Best Bath" — Cheryl in the Basin (Act 6, "The bath"). The music box from Act 1's moonrise,
// playing the whole skipping rhyme slowly and perfectly in tune this time, with a soft held pad.
// The rhyme's ten lines take the tune two and a half times: lines 1–4 and 5–8 are the whole
// eight-bar tune, and lines 9–10 ("Moon in the Gate and moon in the bowl, / Tessel's asleep and
// Tessel is whole") take its first two bars and its last two, so the tune comes home to F.
// Wrongness 0: nothing sags. It loops, in case the scene runs long.
// Loop: 20 bars at 60 bpm = 80 s. Format: docs/audio-direction.md.

import { RHYME, RHYME_HARMONY, COMB, BOX_BASS, bars } from './moonrise.js';

const H = bars(RHYME_HARMONY);
const pick = (part, idx) => `${idx.map((i) => bars(part)[i]).join(' | ')} |`;
const LAST = [0, 1, 6, 7]; // bars 1, 2, 7, 8: "Moon in the Gate…", home to F

// A soft pad: one guide tone a bar (the third, or the seventh on dominants).
const PAD = 'A3:16 | A3:8 Bb3:8 | A3:8 Bb3:8 | E4:16 | A3:8 Bb3:8 | F4:16 | G4:16 | Bb3:8 A3:8 |';

export default {
  id: 'bath',
  title: 'The Best Bath',
  bpm: 60,
  gain: 1.1,
  wrongness: 0,
  echo: { delay: 0.5, feedback: 0.42, wet: 0.42, lowpass: 3000, spread: 0.03 },
  channels: [
    { id: 'lead', inst: 'musicbox', vol: 0.9, pan: 0.1, echo: 0.45 },
    { id: 'comb', inst: 'musicbox', vol: 0.6, pan: -0.15, echo: 0.4 },
    { id: 'bass', inst: 'musicbox', vol: 0.95, pan: 0, echo: 0.3 },
    { id: 'pad', inst: 'strings', vol: 0.3, pan: 0.2, echo: 0.4 },
  ],
  patterns: {
    R: { harmony: RHYME_HARMONY, lead: RHYME, comb: COMB, bass: BOX_BASS, pad: PAD },
    E: {
      harmony: `${LAST.map((i) => H[i]).join(' | ')} |`,
      lead: pick(RHYME, LAST),
      comb: pick(COMB, LAST),
      bass: pick(BOX_BASS, LAST),
      pad: pick(PAD, LAST),
    },
  },
  intro: [],
  loop: ['R', 'R', 'E'],
};
