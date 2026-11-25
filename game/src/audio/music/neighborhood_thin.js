// "Stairs to the Water (thin)" — `neighborhood` stripped to its flute, for the reveal at the end
// of Act 4 (docs/design/04-the-list.md): the dry Bilge, the city risen out of the sea. Same tune,
// a little slower, nothing under it but a long echo, and its notes sagging at Wrongness 0.5.
// Loop: 32 bars at 86 bpm = 89.3 s (no intro). Format: docs/audio-direction.md.

import base from './neighborhood.js';

export default {
  id: 'neighborhood_thin',
  title: 'Stairs to the Water (thin)',
  bpm: 86,
  swing: 0,
  gain: 1,
  wrongness: 0.5,
  echo: { delay: 0.5, feedback: 0.5, wet: 0.45, lowpass: 1800, spread: 0.04 },
  channels: base.channels.filter((c) => c.id === 'lead').map((c) => ({ ...c, vol: 0.8, echo: 0.6 })),
  patterns: Object.fromEntries(
    Object.entries(base.patterns).map(([name, p]) => [name, { harmony: p.harmony, lead: p.lead }]),
  ),
  intro: [],
  loop: base.loop,
};
