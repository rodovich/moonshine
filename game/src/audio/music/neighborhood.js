// "Stairs to the Water" — the upper town by day: Lamp Street, the Crown, the Hundred Steps,
// and Fountain Square (docs/design/02-city.md). In the Shop it plays muffled (muffleMusic).
// F major, a lilting walk with light swing. Flute melody over rippling harp, a round bass, and a
// soft shaker. The arrangement builds across the loop: A is sparse, A2 adds strings, B is the
// lyrical bridge, A3 brings in an accordion singing in thirds under the flute.
// Loop: 32 bars at 100 bpm = 76.8 s. Format: docs/audio-direction.md.

// Rising broken chord, two times per bar (eighth notes): water rippling up the steps.
const arp = (a, b, c, d) => `${a}:2 ${b} ${c} ${d} ${a} ${b} ${c} ${d}`;
const arpHalf = (a, b, c, d) => `${a}:2 ${b} ${c} ${d}`;
const H = {
  F: arp('F3', 'C4', 'F4', 'A4'),
  CE: arp('E3', 'C4', 'E4', 'G4'),
  Bb: arp('F3', 'Bb3', 'D4', 'F4'),
  C: arp('G3', 'C4', 'E4', 'G4'),
  Dm: arp('F3', 'A3', 'D4', 'F4'),
  Gm: arp('G3', 'Bb3', 'D4', 'G4'),
  C7: arp('G3', 'Bb3', 'C4', 'E4'),
  Am: arp('E3', 'A3', 'C4', 'E4'),
  Gm7C7: `${arpHalf('G3', 'Bb3', 'D4', 'F4')} ${arpHalf('G3', 'Bb3', 'C4', 'E4')}`,
  Am7D7: `${arpHalf('E3', 'G3', 'C4', 'E4')} ${arpHalf('F#3', 'A3', 'C4', 'D4')}`,
};

const leadA1to4 = `
  A4:2 C5 F5:3 E5:1 F5:4 A5 |
  G5:3 F5:1 E5:2 D5 C5:8 |
  D5:2 F5 Bb5:3 A5:1 G5:4 F5 |
  E5:2 F5 G5:8 C5:2 D5 |`;

const lead = {
  A: `${leadA1to4}
    F5:3 E5:1 D5:2 A4 D5:4 F5 |
    F5:3 E5:1 D5:2 Bb4 D5:4 C5 |
    Bb4:2 C5 D5 F5 E5 G5 Bb5 G5 |
    A5:6 G5:2 F5:8 |`,
  A2: `${leadA1to4}
    F5:3 E5:1 D5:2 A4 D5:4 F5:2 A5 |
    Bb5:4 A5:2 G5 F5:4 D5 |
    E5:2 G5 C6:4 Bb5:3 A5:1 G5:4 |
    F5:12 .:4 |`,
  B: `
    D5:6 C5:2 Bb4:4 D5 |
    E5:6 D5:2 C5:4 E5 |
    A5:6 G5:2 E5:4 C5 |
    D5:8 E5:4 F5 |
    G5:6 F5:2 D5:4 Bb5 |
    Bb5:3 A5:1 G5:4 E5 C5 |
    A5:4 G5:2 E5 F#5:4 A5:2 C6 |
    Bb5:4 A5:2 G5 E5 F5 D5 C5 |`,
};

// Accordion harmony for A3: mostly a third or sixth under the flute, like two old friends singing.
const harmonyA3 = `@accordion v100
  F4:2 A4 A4:3 G4:1 A4:4 C5 |
  E5:3 D5:1 C5:2 B4 E4:4 G4 |
  Bb4:2 D5 F5:3 F5:1 D5:4 D5 |
  C5:2 D5 E5:8 .:4 |
  D5:3 C5:1 A4:2 F4 A4:4 D5:2 F5 |
  G5:4 F5:2 E5 D5:4 Bb4 |
  C5:2 E5 G5:4 G5:3 F5:1 E5:4 |
  A4:12 .:4 |`;

const bassA1to4 = `
  F2:4 C3 A2 C3 |
  E2 C3 G2 C3 |
  Bb1 F2 D2 F2 |
  C2 G2 C3 C#3 |`;
const bassA2_5to7 = `
  D3:4 A2 F2 A2 |
  G2 D3 Bb2 D3 |
  C2 G2 Bb2 E2 |`;

const shaker = '(sh_:2 sh)x4';
const tamb = '(sh_:2 sh tam sh)x2';
const groove = 'k:4 rim .:2 k rim:4';

export default {
  id: 'neighborhood',
  title: 'Stairs to the Water',
  bpm: 100,
  swing: 0.14,
  gain: 0.85,
  echo: { delay: 0.3, feedback: 0.3, wet: 0.28, lowpass: 2600 },
  channels: [
    { id: 'lead', inst: 'flute', vol: 0.85, pan: 0.08, echo: 0.35 },
    { id: 'harp', inst: 'harp', vol: 0.55, pan: -0.35, echo: 0.3 },
    { id: 'pad', inst: 'strings', vol: 0.5, pan: 0.3, echo: 0.2 },
    { id: 'bass', inst: 'bass', vol: 0.62, pan: 0, echo: 0.05 },
    { id: 'drum', inst: 'kit', vol: 0.5, pan: -0.1, echo: 0.1 },
    { id: 'shaker', inst: 'kit', vol: 0.8, pan: 0.25, echo: 0.1 },
  ],
  patterns: {
    I: {
      harmony: 'F | C7 |',
      lead: '.:16 | .:16 |',
      harp: `${arp('F3', 'C4', 'F4', 'A4')} | ${arp('G3', 'Bb3', 'C4', 'E4')} |`,
      pad: '.:16 | .:16 |',
      bass: 'F2:16 | C2:12 E2:4 |',
      drum: '.:16 | .:12 k:2 k_ |',
      shaker: `.:16 | ${shaker} |`,
    },
    A: {
      harmony: 'F | C/E | Bb | C | Dm | Bb | Gm7 C7 | F |',
      lead: lead.A,
      harp: `${H.F} | ${H.CE} | ${H.Bb} | ${H.C} | ${H.Dm} | ${H.Bb} | ${H.Gm7C7} | ${H.F} |`,
      pad: '(.:16 |)x8',
      bass: `${bassA1to4}
        D3:4 A2 F2 A2 |
        Bb2 F2 D2 F2 |
        G2 D3 C3 Bb2 |
        A2 F2 C3:2 C3 E2:4 |`,
      drum: '(k:4 rim k rim |)x8',
      shaker: `(${shaker} |)x8`,
    },
    A2: {
      harmony: 'F | C/E | Bb | C | Dm | Gm | C7 | F |',
      lead: lead.A2,
      harp: `${H.F} | ${H.CE} | ${H.Bb} | ${H.C} | ${H.Dm} | ${H.Gm} | ${H.C7} | ${H.F} |`,
      pad: `@strings v100 C4:16 | C4 | D4 | G4 | F4 | D4 | E4:8 Bb3 | A3:16 |`,
      bass: `${bassA1to4} ${bassA2_5to7}
        F2:4 C3 F2 A2 |`,
      drum: `(${groove} |)x7 k:4 rim k:2 rim_ rim rim_ |`,
      shaker: `(${shaker} |)x8`,
    },
    B: {
      harmony: 'Bb | C | Am | Dm7 | Gm7 | C7 | Am7 D7 | Gm7 C7 |',
      lead: lead.B,
      harp: `${H.Bb} | ${H.C} | ${H.Am} | ${H.Dm} | ${H.Gm} | ${H.C7} | ${H.Am7D7} | ${H.Gm7C7} |`,
      pad: '@strings v90 D4:16 | E4 | E4 | F4 | D4 | E4 | E4:8 F#4 | F4:8 Bb3 |',
      bass: `
        Bb1:6 F2:2 Bb2:4 F2 |
        C2:6 G2:2 C3:4 G2 |
        A1:6 E2:2 A2:4 E2 |
        D2:6 A2:2 D3:4 C3 |
        G2:6 D3:2 G2:4 F2 |
        E2:6 G2:2 C3:4 Bb2 |
        A2:4 E2 D2 F#2 |
        G2 D2 C2 E2 |`,
      drum: '(k:6 k:2 sn_:8 |)x7 k:4 tom:2 tom sn sn_ sn sn! |',
      shaker: `(${shaker} |)x7 ${shaker} |`,
    },
    A3: {
      harmony: 'F | C/E | Bb | C | Dm | Gm | C7 | F |',
      lead: lead.A2,
      harp: `${H.F} | ${H.CE} | ${H.Bb} | ${H.C} | ${H.Dm} | ${H.Gm} | ${H.C7} | ${H.F} |`,
      pad: harmonyA3,
      bass: `${bassA1to4} ${bassA2_5to7}
        F2:4 C3 A2 E2 |`,
      drum: `(${groove} |)x7 k:4 rim k:2 k .:4 |`,
      shaker: `(${tamb} |)x7 ${shaker} |`,
    },
  },
  intro: ['I'],
  loop: ['A', 'A2', 'B', 'A3'],
  lintAllow: [
    { match: 'A/bass bar 8 beat 4', why: 'E2 is a leading tone into F2 at the top of the next section' },
    { match: 'A3/bass bar 8 beat 4', why: 'E2 is a leading tone into F2 when the loop restarts' },
  ],
};
