// "The Climb" — the emergency shaft in Act 4 (docs/design/04-the-list.md, "The climb"). Nothing
// but a slow heartbeat under the shaft's own sounds. The game raises its pitch as Cheryl climbs
// (bendMusic, a few hundred cents over the climb) and fades it out by row 7 (stopMusic(3000)).
// Loop: 1 bar at 52 bpm = 4.6 s. Format: docs/audio-direction.md.

export default {
  id: 'climb',
  title: 'The Climb',
  scene: true, // underscores a scripted moment; the game ends it
  bpm: 52,
  gain: 1,
  echo: { delay: 0.45, feedback: 0.35, wet: 0.35, lowpass: 900 },
  channels: [{ id: 'heart', inst: 'kit', vol: 0.8, pan: 0, echo: 0.4 }],
  patterns: {
    H: { harmony: 'N |', heart: '(heart:1 heart_:3)x4 |' },
  },
  intro: [],
  loop: ['H'],
};
