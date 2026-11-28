// The skipping rope between the two turning girls. SNES sheet: rope (act2_npcs.js, 48×32).
// Frames rope_0…3 (110 ms): over their heads, in front (toward the camera, grid
// south), on the ground, behind. The turners stand two tiles apart along the
// grid's x; this sprite is anchored on the jumper's tile between them (the SNES
// anchors its top-left at the left turner's tile instead). Sync the jumper: up
// (jump_down_0) on frames 2–3.
import { frame, POST } from '../lib/jobs.mjs';
import { skippingRope, anim } from '../models/act2-npcs.mjs';

export default {
  name: 'rope',
  frames: () => [0, 1, 2, 3].map((n) => frame(`rope_${n}`, () => skippingRope(n), { post: POST.prop, shadow: true })),
  anims: { rope: anim(['rope_0', 'rope_1', 'rope_2', 'rope_3'], 110) },
};
