// The Man on Bench, without his glasses: silver hair under a moss flat cap, a
// long stone-grey coat, the Tide-Sheet held up in front of his face. SNES sheet:
// bench_man (act2_npcs.js).
// Frames: sit_down_0/1 (behind his newspaper; frame 1 turns the page).
// Seated: on the bench, seat 0.45 m above the anchor, facing down (grid south),
// feet on the anchor's floor; the bench is the map's, the sprite is him alone.
import { benchMan, fig, anim } from '../models/act2-npcs.mjs';

export default {
  name: 'bench_man',
  frames: () => [fig('sit_down_0', () => benchMan(false, 'sit', 0)), fig('sit_down_1', () => benchMan(false, 'sit', 1))],
  anims: { sit_down: anim(['sit_down_0', 'sit_down_1'], [2600, 400]) },
};
