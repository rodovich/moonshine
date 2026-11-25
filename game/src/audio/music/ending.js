// "Moon in the Bowl" — the ending, over the final vista and the credits (Act 6, "The final scene").
// The music box plays the skipping rhyme alone, whole and in tune, as the moon rises dead in the
// Gate; then the full title theme opens out under it (title.js), with its D-flat turns resolved by
// the D-flat, E-flat, F climb. At the very end, the music box plays Cheryl's home phrase one last
// time, and instead of rising to the open C it has always ended on, it lands on F, the tonic: the
// home motif, home. Wrongness 0. After the coda it goes back to the title theme, so it keeps
// playing for as long as the credits run; fade it when the title screen appears.
// Intro 8 bars (26.7 s), then loop 16 + 2 bars at 72 bpm = 60 s. Format: docs/audio-direction.md.

import title from './title.js';
import { RHYME, RHYME_HARMONY, COMB, BOX_BASS } from './moonrise.js';

const rest = (n) => `(.:16 |)x${n}`;
const T = title.patterns.A;

export default {
  id: 'ending',
  title: 'Moon in the Bowl',
  bpm: 72,
  gain: 0.9,
  wrongness: 0,
  echo: title.echo,
  channels: title.channels.map((c) => (c.id === 'bell' ? { ...c, vol: 0.6 } : c)),
  patterns: {
    // The music box alone (on the bell channel, switched to the music box), with its comb on the
    // harp channel and its low notes on the bass channel.
    R: {
      harmony: RHYME_HARMONY,
      melody: 'bell',
      lead: rest(8),
      bell: `@musicbox ${RHYME}`,
      harp: `@musicbox v80 ${COMB}`,
      pad: rest(8),
      bass: `@musicbox v120 ${BOX_BASS}`,
      perc: `${rest(7)} .:8 swell:8 |`,
    },
    // The full title theme.
    T: {
      ...T,
      bell: `@bell v100 ${T.bell}`,
      harp: `@harp v100 ${T.harp}`,
      bass: `@bowbass v100 ${T.bass}`,
    },
    // The home phrase lands on the tonic.
    C: {
      harmony: 'F | F |',
      melody: 'bell',
      lead: '.:16 | .:16 |',
      bell: '@musicbox v150 C5:4 F5 A5 F5 | F5:16 |',
      harp: '@harp v50 F3:2 C4 F4 A4 C5 F5 A5 C6 | F3:16 |',
      pad: 'C4:16 | A3:16 |',
      bass: '@bowbass F2:16 | F2:16 |',
      perc: '.:16 | .:16 |',
    },
  },
  intro: ['R'],
  loop: ['T', 'C'],
};
