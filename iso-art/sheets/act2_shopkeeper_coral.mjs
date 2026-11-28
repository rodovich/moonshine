// The Shopkeeper's body in the SNES palette `coral` (npcs.js shopkeeper@coral):
// brown hair, a coral shirt, wood-brown trousers, a white apron. Same frames as
// `shopkeeper` (act2_shopkeeper.mjs, which lists the swap mapping).
import { shopkeeperFrames, shopkeeperAnims } from '../models/act2-npcs.mjs';

export default {
  name: 'shopkeeper_coral',
  frames: () => shopkeeperFrames('coral'),
  anims: shopkeeperAnims(),
};
