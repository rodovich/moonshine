// The Shopkeeper's body in the SNES palette `mustard` (npcs.js shopkeeper@mustard):
// darker skin, black hair, a mustard shirt, iron-grey trousers, a sky apron. Same
// frames as `shopkeeper` (act2_shopkeeper.mjs, which lists the swap mapping).
import { shopkeeperFrames, shopkeeperAnims } from '../models/act2-npcs.mjs';

export default {
  name: 'shopkeeper_mustard',
  frames: () => shopkeeperFrames('mustard'),
  anims: shopkeeperAnims(),
};
