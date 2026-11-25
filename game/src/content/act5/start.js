// The start of Act 5: the same afternoon as Act 4's reveal. Act 4's ending
// calls this through its hook (src/content/index.js sets it) instead of its
// end card. Cheryl is back on the north quay of the dry Bilge, at the top of
// the Water Stairs, with the screen black.

import { started } from './common.js';

export async function startAct5(g) {
  if (started(g)) return;
  g.setFlag('act5.started');
  g.setFlag('teeth.stage', 1);
  await g.card('That afternoon.', 2);
  await g.changeMap('bilge_dry', 23, 6, 'down', { fade: true });
  await g.wait(0.6);
  g.sfx('sheets_flap');
  await g.describe(
    'The wind\'s getting up. Every line of washing on the quay is pointing out to sea.',
    "A door at the bottom of the canal, and stairs that don't reach it. Well. One thing at a time.",
  );
}
