// The Shopkeeper: round, bald with a ring of hair, a big mustache, a round apron
// tied at the neck. SNES sheet: shopkeeper (npcs.js), whose base palette Act 2
// uses (black hair, a teal shirt, navy trousers, a cream apron).
// Palette swaps → iso sheets, same frames each:
//   shopkeeper (base)    → `shopkeeper` (this sheet)
//   shopkeeper@coral     → `shopkeeper_coral` (act2_shopkeeper_coral.mjs): brown hair, coral shirt, wood-brown trousers, white apron
//   shopkeeper@mustard   → `shopkeeper_mustard` (act2_shopkeeper_mustard.mjs): darker skin, black hair, mustard shirt, iron trousers, sky apron
// Frames: <dir>_0 stand, <dir>_1…8 walk; idle_<dir>_0/1 (hands folded on the
// apron; frame 1 rubs them and blinks); fall_down_0/1.
import { shopkeeperFrames, shopkeeperAnims } from '../models/act2-npcs.mjs';

export default {
  name: 'shopkeeper',
  frames: () => shopkeeperFrames('base'),
  anims: shopkeeperAnims(),
};
