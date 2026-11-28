// Ambrose Tull, the Bell-ringer: big and seventy-eight, bald on top with a cloud
// of white hair, bushy white brows and a big white mustache, a long brown coat
// over a cream shirt with a terracotta neckerchief, his red Tull Ledger, and the
// bell rope with its striped sally. SNES sheet: ambrose (act2_npcs.js).
// Frames: sit_down_0/1 (on the tower step, the ledger open on his knees; frame 1
// looks up and scowls); <dir>_0 stand, <dir>_1…8 walk in all four directions
// (the SNES draws only down/up); ring_up_0/1/2 (from behind at the rope: hands
// high, hauling down, lifted on the upswing; the rope runs up out of the frame);
// ledger_down (holding out the ledger); fall_down_0/1.
// Seated: on the tower step, 0.22 m above the anchor, feet on the anchor's floor.
import { ambrose, ambroseLook, walkFrames, walkAnims, fallFrames, fig, anim } from '../models/act2-npcs.mjs';

export default {
  name: 'ambrose',
  frames: () => [
    fig('sit_down_0', () => ambrose('down', {}, 'sit', 0)), fig('sit_down_1', () => ambrose('down', {}, 'sit', 1)),
    ...walkFrames((d, p) => ambrose(d, p), { amp: 0.8 }),
    ...[0, 1, 2].map((n) => fig(`ring_up_${n}`, () => ambrose('up', {}, 'ring', n))),
    fig('ledger_down', () => ambrose('down', {}, 'ledger')),
    ...fallFrames(ambroseLook()),
  ],
  anims: {
    ...walkAnims({ ms: 140 }),
    sit_down: anim(['sit_down_0', 'sit_down_1'], [2600, 900]),
    ring_up: anim(['ring_up_0', 'ring_up_1', 'ring_up_2'], [500, 600, 400]),
  },
};
