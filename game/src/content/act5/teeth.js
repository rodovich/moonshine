// The Teeth, the reef at the mouth of the Bowl, seen from the risen Harbor
// (docs/design/05-high-and-dry.md, "Building the danger"): their look by
// stage, the surf's loudness, and the camera's trip out to them.

import { stage } from './common.js';

const TEETH_LOOKS = {
  1: ["The Teeth. A white line of surf out at the mouth of the Bowl. Closer than they've ever been. Than we've ever been."],
  2: ['Closer. I can see the rocks between the surf.'],
  3: ['I can hear them. The sea, chewing.'],
};
export const teethLook = (g, opts = {}) => g.describe(...TEETH_LOOKS[stage(g)], opts);

// The surf loop's volume at each stage.
export const SURF = { 1: 0.35, 2: 0.65, 3: 1 };

// The first time Cheryl is on the Harbor at each stage, the camera goes down
// and across to the reef and holds there while the surf swells, then comes
// back to her, so the player sees them grow.
export async function showTeeth(g) {
  const s = stage(g);
  g.setFlag('teeth.seen', s);
  g.facePlayer('down');
  await g.wait(0.4);
  await g.panCamera(13, 13, 1.2);
  g.setLoopVolume('surf', Math.min(1, SURF[s] + 0.3), 600);
  await g.wait(2);
  // The box at the top, so the reef stays in view under it.
  await teethLook(g, { position: 'top' });
  g.setLoopVolume('surf', SURF[s], 1500);
  await g.followPlayer(2);
}
