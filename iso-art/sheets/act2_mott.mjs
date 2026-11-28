// Captain Mott, the Ferryman: a full silver beard, a navy pea coat with two rows
// of buttons over a cream jersey collar, a navy captain's cap with a dark peak
// and a copper badge. SNES sheet: mott (act4_sprites.js; Act 2's Harbor uses it).
// Frames: <dir>_0 stand, <dir>_1…8 walk; sit_down_0/1 (sitting sober on his
// crates, hands on his knees; frame 1 a slow nod); coil_<dir>_0 stand and
// coil_<dir>_1…8 walk carrying the copper coil from his still (the SNES has
// coil_<dir>_0…2); fall_down_0/1.
// Seated: on his crates, seat 0.45 m above the anchor (the SNES draws him 8 px
// up), feet on the anchor's floor.
import { mott, mottLook, walkFrames, walkAnims, fallFrames, fig, anim } from '../models/act2-npcs.mjs';

export default {
  name: 'mott',
  frames: () => [
    ...walkFrames((d, p) => mott(d, p), { amp: 0.9 }),
    fig('sit_down_0', () => mott('down', {}, 'sit', 0)), fig('sit_down_1', () => mott('down', {}, 'sit', 1)),
    ...walkFrames((d, p) => mott(d, p, 'coil'), { prefix: 'coil_', amp: 0.85 }),
    ...fallFrames(mottLook()),
  ],
  anims: {
    ...walkAnims({ ms: 120 }),
    ...walkAnims({ ms: 120, prefix: 'coil_', name: (d) => `coil_${d}` }),
    sit_down: anim(['sit_down_0', 'sit_down_1'], [2400, 700]),
  },
};
