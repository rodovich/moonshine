// The Woman with Watering Can with her husband's gold reading glasses pushed up
// on her curls, drawn large, with a glint star above the left lens (an
// observation clue, so it has to read at 1×). SNES sheet: watering_woman_glasses
// (act2_npcs.js); the same frames as `watering_woman`: down_0, water_down_0/1, fall_down_0/1.
import { anim } from '../models/act2-npcs.mjs';
import { wateringFrames } from './act2_watering_woman.mjs';

export default {
  name: 'watering_woman_glasses',
  frames: () => wateringFrames(true),
  anims: { water_down: anim(['water_down_0', 'water_down_1'], [700, 500]) },
};
