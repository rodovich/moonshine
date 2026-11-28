// Captain Mott raising things to the moon. SNES sheet: mott_jug (act6_sprites.js;
// Act 2's Harbor alternates it with mott:sit_down).
// Frames: raise_down_0/1 (the empty square jug raised overhead, then higher, his
// head tipped back); raise_mug_down_0/1 (a mug of tea raised, steam rising: the
// climax montage). Standing, facing down.
import { mott, fig, anim } from '../models/act2-npcs.mjs';

export default {
  name: 'mott_jug',
  frames: () => [
    fig('raise_down_0', () => mott('down', {}, 'jug', 0)), fig('raise_down_1', () => mott('down', {}, 'jug', 1)),
    fig('raise_mug_down_0', () => mott('down', {}, 'mug', 0)), fig('raise_mug_down_1', () => mott('down', {}, 'mug', 1)),
  ],
  anims: {
    raise_down: anim(['raise_down_0', 'raise_down_1'], [900, 600]),
    raise_mug_down: anim(['raise_mug_down_0', 'raise_mug_down_1'], [900, 600]),
  },
};
