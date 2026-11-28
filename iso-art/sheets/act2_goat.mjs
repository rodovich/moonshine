// The Goat Path's goats. SNES sheet: goat (act2b_goat.js, 16×16), palettes base
// (white) and `brown`.
// Palette swaps → iso sheets, same frames each: goat (base, white with grey
// horns) → `goat` (this sheet); goat@brown → `goat_brown` (act2_goat_brown.mjs).
// Frames: <dir>_0 stand, <dir>_1…8 walk (the SNES has <dir>_0…2);
// eat_left_0/1, eat_right_0/1, eat_down_0/1 (head down to the grass, chewing).
import { goatFrames, goatAnims } from '../models/act2-npcs.mjs';

export default {
  name: 'goat',
  frames: () => goatFrames('white'),
  anims: goatAnims(),
};
