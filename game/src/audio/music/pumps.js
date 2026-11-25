// "The Sisters Wake" — the pumps cue (docs/design/04-the-list.md, "The rise"). Starts when all
// three Sisters run together; loops until the burst, where the game cuts it off (stopMusic(0)).
// The one place Downstairs gets a beat: the three pumps' thumps make a rolling three-part rhythm
// (the stout one on every beat, the thin one in a 3-3-2 roll, the middle one on the off-beats),
// over a bowed bass holding D-flat. Above them, two moonglass voices an octave apart climb the
// D-flat Lydian scale one step a bar, the lower fading in as the upper fades out: when the loop
// comes round, the lower voice is where the upper was, so the line seems to keep rising forever,
// past the D-flat where it should come to rest. As the city rises, the game calls bendMusic() to
// creep the whole cue sharp. There is deliberately no melody to hold on to.
// Loop: 8 bars at 76 bpm = 25.3 s. Format: docs/audio-direction.md.

export default {
  id: 'pumps',
  title: 'The Sisters Wake',
  scene: true, // underscores a scripted moment; the game ends it
  bpm: 76,
  gain: 0.9,
  wrongness: 0.35,
  echo: { delay: 0.39, feedback: 0.45, wet: 0.4, lowpass: 1800, spread: 0.05 },
  channels: [
    { id: 'low', inst: 'glass', vol: 0.8, pan: -0.2, echo: 0.5, role: 'counter' },
    { id: 'high', inst: 'glass', vol: 0.8, pan: 0.2, echo: 0.5, role: 'counter' },
    { id: 'bass', inst: 'bowbass', vol: 0.55, pan: 0, echo: 0.15 },
    { id: 'stout', inst: 'kit', vol: 0.75, pan: -0.15, echo: 0.25 },
    { id: 'thin', inst: 'kit', vol: 0.6, pan: 0.3, echo: 0.25 },
    { id: 'middle', inst: 'kit', vol: 0.65, pan: 0.05, echo: 0.3 },
  ],
  patterns: {
    P: {
      harmony: 'Db | Db | Db | Db | Db | Db | Db | Db |',
      low: 'v15 Db4:16 | v25 Eb4 | v38 F4 | v50 G4 | v62 Ab4 | v75 Bb4 | v88 C5 | v100 Db5 |',
      high: 'v100 Db5:16 | v88 Eb5 | v75 F5 | v62 G5 | v50 Ab5 | v38 Bb5 | v25 C6 | v15 Db6 |',
      bass: '(Db2:16 |)x8',
      stout: '(stout:4 stout stout stout |)x8',
      thin: '(thin:3 thin thin:2 thin:3 thin thin:2 |)x8',
      middle: '(.:6 middle:8 middle:2 |)x8',
    },
  },
  intro: [],
  loop: ['P'],
  lintAllow: [
    { match: 'P/low bar 4', why: "the Founders' raised fourth (G over the D-flat pedal) is part of the climb" },
    { match: 'P/high bar 4', why: "the Founders' raised fourth (G over the D-flat pedal) is part of the climb" },
  ],
};
