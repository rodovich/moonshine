// "Beat the Egg" — the Kid's run in Act 5 (docs/design/05-high-and-dry.md, "The disc and the
// Kid"). A one-shot: play it with playMusic('relay', { fadeMs: 0 }) as he sets off.
// A quick, bright chase on the surface instruments: one bar of harp and ticking as the timer
// starts, then Cheryl's home phrase (Cistern Court's opening, F–Bb–D–F, then F–Eb–D) in double
// time on the flute over harp racing in sixteenths, a bouncing bass, tambourine and a light kit;
// then a coda races up broken chords to the door. Then everything stops for the last bar, and the
// egg timer's DING is the final note (pitched on D, the third of B-flat, so it lands as a
// resolution). Sized to the run as built (about 15 s; content/act5).
// 10 bars of 4/4 at 152 bpm = 15.8 s: the DING lands at 14.21 s and rings about 1.6 s.
// Format: docs/audio-direction.md.

/** Seconds from the start of `relay` to its final DING (the door should open just before). */
export const RELAY_DING = (9 * 4 * 60) / 152;

const arp = (a, b, c, d) => `(${a}:1 ${b} ${c} ${d})x4`;
const half = (a, b, c, d) => `(${a}:1 ${b} ${c} ${d})x2`;
const bounce = (r, f) => `(${r}:2 ${f})x4`;
const bounceHalf = (r, f) => `(${r}:2 ${f})x2`;

const HARP = {
  Bb: arp('Bb3', 'D4', 'F4', 'Bb4'),
  Eb: arp('Bb3', 'Eb4', 'G4', 'Bb4'),
  CmF7: `${half('C4', 'Eb4', 'G4', 'C5')} ${half('A3', 'C4', 'Eb4', 'F4')}`,
  Gm: arp('G3', 'Bb3', 'D4', 'G4'),
  F: arp('A3', 'C4', 'F4', 'A4'),
  F7: arp('A3', 'C4', 'Eb4', 'F4'),
  D7: arp('F#3', 'A3', 'C4', 'D4'),
};
const BASS = {
  Bb: bounce('Bb2', 'F2'),
  Eb: bounce('Eb2', 'Bb2'),
  CmF7: `${bounceHalf('C2', 'G2')} ${bounceHalf('F2', 'C3')}`,
  Gm: bounce('G2', 'D2'),
  F: bounce('F2', 'C3'),
  F7: bounce('F2', 'C3'),
  D7: bounce('D2', 'A2'),
};

const firstHalf = (part) => `${part.split('|').map((b) => b.trim()).filter(Boolean).slice(0, 4).join(' | ')} |`;
const harmonyA = 'Bb | Eb | Cm F7 | Bb | Bb | Eb | Cm F7 | Bb |';
const melodyA = `
  F4:2 Bb4 D5 F5 F5:3 Eb5:1 D5:4 |
  Eb5:2 G5 Bb5 G5 Eb5:4 G5 |
  G5:2 F5 Eb5 C5 F5 Eb5 C5 A4 |
  Bb4:4 D5:2 F5 Bb5:4 F5:2 Bb4 |
  F4:2 Bb4 D5 F5 F5:3 Eb5:1 D5:4 |
  G5:2 Bb5 Eb6 Bb5 G5:4 Eb5 |
  Eb5:2 D5 C5 Eb5 A5 C6 A5 F5 |
  Bb5:4 F5:2 D5 Bb4:4 .:4 |`;
const harpA = `${HARP.Bb} | ${HARP.Eb} | ${HARP.CmF7} | ${HARP.Bb} | ${HARP.Bb} | ${HARP.Eb} | ${HARP.CmF7} | ${HARP.Bb} |`;
const bassA = `${BASS.Bb} | ${BASS.Eb} | ${BASS.CmF7} | ${BASS.Bb} | ${BASS.Bb} | ${BASS.Eb} | ${BASS.CmF7} | ${BASS.Bb} |`;
const tamb = '(sh_:2 sh tam sh)x2';
const kick = 'k:4 sn_ k sn';

export default {
  id: 'relay',
  title: 'Beat the Egg',
  bpm: 152,
  gain: 0.95,
  wrongness: 0,
  echo: { delay: 0.2, feedback: 0.25, wet: 0.2, lowpass: 3000 },
  channels: [
    { id: 'lead', inst: 'flute', vol: 0.85, pan: 0.05, echo: 0.25 },
    { id: 'harp', inst: 'harp', vol: 0.42, pan: -0.35, echo: 0.2 },
    { id: 'bass', inst: 'bass', vol: 0.55, pan: 0, echo: 0.05 },
    { id: 'tamb', inst: 'kit', vol: 0.55, pan: 0.3, echo: 0.1 },
    { id: 'drums', inst: 'kit', vol: 0.5, pan: -0.1, echo: 0.1 },
  ],
  patterns: {
    I: {
      harmony: 'F7 |',
      lead: '.:16 |',
      harp: `${HARP.F7} |`,
      bass: `${BASS.F7} |`,
      tamb: '(tick:2 tock)x4 |',
      drums: '.:8 k:2 k sn sn! |',
    },
    A: {
      harmony: firstHalf(harmonyA),
      lead: firstHalf(melodyA),
      harp: firstHalf(harpA),
      bass: firstHalf(bassA),
      tamb: `(${tamb} |)x4`,
      drums: `(${kick} |)x3 k:4 sn:2 sn sn sn! tom:4 |`,
    },
    C: {
      harmony: 'Gm | Eb | F | F7 | Bb |',
      lead: `
        D5:2 G5 Bb5 D6 D5 G5 Bb5 D6 |
        Eb5:2 G5 Bb5 Eb6 Eb5 G5 Bb5 Eb6 |
        F5:2 A5 C6 F6:10 |
        A5:2 C6 Eb6 F6 Eb6:4 C6 |
        .:16 |`,
      harp: `${HARP.Gm} | ${HARP.Eb} | ${HARP.F} | ${HARP.F7} | Bb3:1 D4 F4 Bb4:13 |`,
      bass: `${BASS.Gm} | ${BASS.Eb} | ${BASS.F} | ${BASS.F7} | Bb2:2 .:14 |`,
      tamb: `(${tamb} |)x3 tam:2 tam tam tam tam! tam! tam! tam! | .:16 |`,
      // The last bar: everything stops, and the egg timer's DING is the final note.
      drums: `(${kick} |)x3 k:2 k k k sn sn sn! sn! | ding!:16 |`,
    },
  },
  intro: ['I', 'A', 'C'],
  loop: null,
};
