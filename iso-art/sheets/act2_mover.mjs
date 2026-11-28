// The Piano Movers. SNES sheet: mover (act2_npcs.js), palettes `big` (the default)
// and `other`.
// Palette swaps → iso sheets: mover@big → `mover` (this sheet: dark skin, black
// beard, navy overalls over a white shirt, terracotta cap); mover@other →
// `mover_other` (act2_mover_other.mjs: fair, ginger beard, moss overalls over a
// cream shirt, grey cap, a little smaller). Both have the same frames.
// Frames: <dir>_0 stand, <dir>_1…8 walk; idle_down_0/1 (hands on hips; a blink);
// push_up_0/1 (shoving, back view, braced); lookup_down (looking up);
// scrub_down_0/1, scrub_up_0/1 (crouched, a hand rubbing left and right);
// run_<dir>_0…7 (8-frame run; the SNES has 4, run_<dir>_0…3); fall_down_0/1.
import { moverFrames, moverAnims } from '../models/act2-npcs.mjs';

export default {
  name: 'mover',
  frames: () => moverFrames('big'),
  anims: moverAnims(),
};
