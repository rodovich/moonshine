// The Other Mover: the SNES sheet `mover` in palette `other` (act2_npcs.js).
// Palette swaps → iso sheets: mover@big → `mover` (act2_mover.mjs); mover@other →
// `mover_other` (this sheet: fair skin, ginger hair and beard, moss overalls over
// a cream shirt, an iron-grey cap). Same frames and anims as `mover`.
import { moverFrames, moverAnims } from '../models/act2-npcs.mjs';

export default {
  name: 'mover_other',
  frames: () => moverFrames('other'),
  anims: moverAnims(),
};
