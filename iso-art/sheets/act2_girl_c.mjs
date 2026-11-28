// The third Skipping Girl: the SNES sheet `girl` in palette `c` (act2_npcs.js):
// ginger bunches, a cream blouse, sky bodice, sage skirt.
// girl@a → `girl`, girl@b → `girl_b`, girl@c → `girl_c` (this sheet); same frames as `girl`.
import { girlFrames, girlAnims } from '../models/act2-npcs.mjs';

export default {
  name: 'girl_c',
  frames: () => girlFrames('c'),
  anims: girlAnims(),
};
