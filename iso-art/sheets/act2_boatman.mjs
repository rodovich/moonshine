// The Boatman in his rowing boat, afloat (boat and man are one sprite, as in the
// SNES): bald with a ring of white hair, a neat white mustache, a navy-and-cream
// striped jersey, sitting on the thwart of a white boat with a cobalt stripe and
// a wooden gunwale, an oar shipped. He faces along the boat toward grid right
// (+x, screen down-right), three-quarters to the camera (the SNES shows him face on). SNES sheet: boatman (act4_sprites.js, 32×32;
// Act 2's Bilge uses it).
// Frames: rock_0…3 (a gentle bob and roll, 450 ms); sing_0/1 (chin up, mouth
// open, an arm out; 600/400 ms).
// The boat lies along the grid's x over two tiles; the anchor is the middle of
// the boat, on the edge between its two tiles, at the water's surface. The hull
// is cut at the waterline (the map's water tiles show below it).
import { frame, POST } from '../lib/jobs.mjs';
import { boatman, anim } from '../models/act2-npcs.mjs';

const f = (name, o) => frame(name, () => boatman(o), { post: POST.figure, shadow: true });

export default {
  name: 'boatman',
  frames: () => [
    ...[0, 1, 2, 3].map((n) => f(`rock_${n}`, { rock: n })),
    f('sing_0', { rock: 0, sing: true }), f('sing_1', { rock: 2, sing: true }),
  ],
  anims: {
    rock: anim(['rock_0', 'rock_1', 'rock_2', 'rock_3'], 450),
    sing: anim(['sing_0', 'sing_1'], [600, 400]),
  },
};
