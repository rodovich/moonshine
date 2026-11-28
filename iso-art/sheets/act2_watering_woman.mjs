// The Woman with Watering Can: black curls, a sage dress, a cobalt watering can.
// SNES sheet: watering_woman (act2_npcs.js), her plain look once she has given
// her husband's glasses back (with them: `watering_woman_glasses`).
// Frames: down_0 (the can at her side); water_down_0/1 (the can held out and
// tipped, drops falling from the rose); fall_down_0/1.
import { wateringWoman, wateringWomanLook, fig, fallFrames, anim } from '../models/act2-npcs.mjs';

export const wateringFrames = (glasses) => [
  fig('down_0', () => wateringWoman(glasses, 'down', {})),
  fig('water_down_0', () => wateringWoman(glasses, 'down', {}, 'water', 0)), fig('water_down_1', () => wateringWoman(glasses, 'down', {}, 'water', 1)),
  ...fallFrames(wateringWomanLook({ glasses })),
];

export default {
  name: 'watering_woman',
  frames: () => wateringFrames(false),
  anims: { water_down: anim(['water_down_0', 'water_down_1'], [700, 500]) },
};
