// The second Skipping Girl: the SNES sheet `girl` in palette `b` (act2_npcs.js):
// black bunches, darker skin, a white blouse, mustard bodice, teal skirt.
// girl@a → `girl`, girl@b → `girl_b` (this sheet), girl@c → `girl_c`; same frames as `girl`.
import { girlFrames, girlAnims } from '../models/act2-npcs.mjs';

export default {
  name: 'girl_b',
  frames: () => girlFrames('b'),
  anims: girlAnims(),
};
