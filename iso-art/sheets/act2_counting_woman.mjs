// The Counting Woman (the Keeper of the Count): silver curls, a cobalt dress,
// a cream collar, the gold civic sash. SNES sheet: counting_woman (act2_npcs.js).
// Frames: <dir>_0 stand, <dir>_1…8 walk (a brisk march); sit_down_0/1 (counting
// on the hollow step: she nods and her lips move); climb_up_0/1 (back view, a
// knee high, rising 0.19 m and 0.31 m: over the piano); fall_down_0/1.
// Seated: on a step 0.2 m (one stair step, 8 px) above the anchor, feet on the anchor's floor.
import { countingWoman, countingWomanLook, walkFrames, walkAnims, fallFrames, fig, anim } from '../models/act2-npcs.mjs';

export default {
  name: 'counting_woman',
  frames: () => [
    ...walkFrames((d, p) => countingWoman(d, { ...p, lean: (p.lean ?? 0) + 0.04 }), { amp: 1.05 }),
    fig('sit_down_0', () => countingWoman('down', {}, 'sit', 0)),
    fig('sit_down_1', () => countingWoman('down', {}, 'sit', 1)),
    fig('climb_up_0', () => countingWoman('up', {}, 'climb', 0)),
    fig('climb_up_1', () => countingWoman('up', {}, 'climb', 1)),
    ...fallFrames(countingWomanLook()),
  ],
  anims: {
    ...walkAnims({ ms: 100 }),
    sit_down: anim(['sit_down_0', 'sit_down_1'], [700, 500]),
    climb_up: anim(['climb_up_0', 'climb_up_1'], 260),
  },
};
