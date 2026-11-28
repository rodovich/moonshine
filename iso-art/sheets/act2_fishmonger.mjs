// The Fishmonger: ginger hair in a bun, a sky-and-white striped shirt, navy
// trousers, a long grey rubber apron (the Shopkeeper's body in the SNES).
// SNES sheet: fishmonger (act5_sprites.js; Act 2's Bilge uses it).
// Frames: <dir>_0 stand, <dir>_1…8 walk; give_down_0/1 (holding out a wooden
// bucket of water, then further); fall_down_0/1.
import { fishmonger, fishmongerLook, walkFrames, walkAnims, fallFrames, fig, anim } from '../models/act2-npcs.mjs';

export default {
  name: 'fishmonger',
  frames: () => [
    ...walkFrames((d, p) => fishmonger(d, p)),
    fig('give_down_0', () => fishmonger('down', {}, 'give', 0)), fig('give_down_1', () => fishmonger('down', {}, 'give', 1)),
    ...fallFrames(fishmongerLook()),
  ],
  anims: {
    ...walkAnims({ ms: 105 }),
    give_down: anim(['give_down_0', 'give_down_1'], [700, 500]),
  },
};
