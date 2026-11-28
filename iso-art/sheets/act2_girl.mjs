// The Skipping Girls (three). SNES sheet: girl (act2_npcs.js), palettes a, b, c.
// Palette swaps → iso sheets, same frames each:
//   girl@a → `girl` (this sheet): brown bunches, white blouse, pink bodice, rose skirt.
//   girl@b → `girl_b` (act2_girl_b.mjs): black bunches, darker skin, white blouse, mustard bodice, teal skirt.
//   girl@c → `girl_c` (act2_girl_c.mjs): ginger bunches, cream blouse, sky bodice, sage skirt.
// Frames: down_0; turn_right_0/1, turn_left_0/1 (turning the rope: hand up, hand
// down, a wooden handle in the hand); jump_down_0 (in the air) / jump_down_1
// (landed); fall_down_0/1.
// The turners stand two tiles apart facing each other along the grid's x (east-
// west): the west one plays turn_right, the east one turn_left; the jumper stands
// on the tile between them, where the `rope` sheet is anchored.
import { girlFrames, girlAnims } from '../models/act2-npcs.mjs';

export default {
  name: 'girl',
  frames: () => girlFrames('a'),
  anims: girlAnims(),
};
