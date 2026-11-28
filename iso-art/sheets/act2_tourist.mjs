// The Stranded Tourist: sunburnt (rose skin, a red nose), a ginger ponytail, a
// loud blue check shirt, khaki shorts, sandals, her cobalt guidebook with its
// gold crest. SNES sheet: tourist (act2_npcs.js).
// Frames: down_0 (standing); sit_up_0/1 (seated facing up at the café table,
// fanning herself with the guidebook); sit_up_hat_0/1 (the same in the Shop's
// straw hat, cobalt band, for tourist.hasHat); fall_down_0/1.
// Seated: on a café chair, seat 0.45 m above the anchor, feet on the anchor's
// floor (the chair and table are the map's; the sprite is her alone).
import { tourist, touristLook, fig, fallFrames, anim } from '../models/act2-npcs.mjs';

export default {
  name: 'tourist',
  frames: () => [
    fig('down_0', () => tourist('down', {})),
    fig('sit_up_0', () => tourist('up', {}, 'sit', 0)), fig('sit_up_1', () => tourist('up', {}, 'sit', 1)),
    fig('sit_up_hat_0', () => tourist('up', {}, 'sit', 0, true)), fig('sit_up_hat_1', () => tourist('up', {}, 'sit', 1, true)),
    ...fallFrames(touristLook()),
  ],
  anims: {
    sit_up: anim(['sit_up_0', 'sit_up_1'], 300),
    sit_up_hat: anim(['sit_up_hat_0', 'sit_up_hat_1'], 300),
  },
};
