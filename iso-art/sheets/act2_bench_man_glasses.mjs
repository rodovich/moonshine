// The Man on Bench with his gold-rimmed glasses on. SNES sheet: bench_man_glasses (act2_npcs.js).
// Frames: sit_down_0/1 (the paper lowered so his face shows over it, the gold rims
// on his nose; frame 1 turns the page); down_0 (standing, the paper folded under
// his arm); look_down_0/1 (head dipped, looking down over a rail, his hands on it;
// a glint crosses his lenses on frame 1: the Man on Bridge in Act 4); fall_down_0/1.
// Seated: on the bench, seat 0.45 m above the anchor, facing down, feet on the anchor's floor.
import { benchMan, benchManLook, fig, fallFrames, anim } from '../models/act2-npcs.mjs';

export default {
  name: 'bench_man_glasses',
  frames: () => [
    fig('sit_down_0', () => benchMan(true, 'sit', 0)), fig('sit_down_1', () => benchMan(true, 'sit', 1)),
    fig('down_0', () => benchMan(true, 'stand')),
    fig('look_down_0', () => benchMan(true, 'look', 0)), fig('look_down_1', () => benchMan(true, 'look', 1)),
    ...fallFrames(benchManLook({ glasses: true })),
  ],
  anims: {
    sit_down: anim(['sit_down_0', 'sit_down_1'], [2600, 400]),
    look_down: anim(['look_down_0', 'look_down_1'], [1600, 600]),
  },
};
