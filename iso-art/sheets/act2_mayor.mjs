// The Mayor: slicked black hair with a quiff, chin up, a charcoal suit, a white
// shirt and wine tie, his gold chain of office with its medallion. SNES sheet:
// mayor (act2_npcs.js).
// Frames: <dir>_0 stand, <dir>_1…8 walk; gesture_down_0/1 (a finger raised, then
// the arm sweeping out); argue_left_0/1, argue_right_0/1 (leaning in, a finger
// jabbing); fall_down_0/1.
// Drawn standing on the anchor's floor. On his crate (its lid is ~0.25 m up), the
// engine raises him by the crate's height, as the SNES does with `offset`.
import { mayor, mayorLook, walkFrames, walkAnims, fallFrames, fig, anim } from '../models/act2-npcs.mjs';

export default {
  name: 'mayor',
  frames: () => [
    ...walkFrames((d, p) => mayor(d, p), { amp: 0.95 }),
    fig('gesture_down_0', () => mayor('down', {}, 'gesture', 0)), fig('gesture_down_1', () => mayor('down', {}, 'gesture', 1)),
    ...['left', 'right'].flatMap((d) => [0, 1].map((n) => fig(`argue_${d}_${n}`, () => mayor(d, {}, 'argue', n)))),
    ...fallFrames(mayorLook()),
  ],
  anims: {
    ...walkAnims({ ms: 115 }),
    gesture_down: anim(['gesture_down_0', 'gesture_down_1'], [900, 700]),
    argue_left: anim(['argue_left_0', 'argue_left_1'], 300),
    argue_right: anim(['argue_right_0', 'argue_right_1'], 300),
  },
};
