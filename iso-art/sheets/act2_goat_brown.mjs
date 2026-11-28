// The second goat: the SNES sheet `goat` in palette `brown` (act2b_goat.js).
// goat → `goat`, goat@brown → `goat_brown` (this sheet); same frames as `goat`.
import { goatFrames, goatAnims } from '../models/act2-npcs.mjs';

export default {
  name: 'goat_brown',
  frames: () => goatFrames('brown'),
  anims: goatAnims(),
};
