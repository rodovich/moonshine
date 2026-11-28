// Ottilie Brask, the Archivist: tall and thin, brown hair up in a bun, round
// spectacles, a long mustard scarf, a plum coat with rose lapels over navy.
// SNES sheet: ottilie (named_npcs.js).
// Frames: <dir>_0 stand, <dir>_1…8 walk; lamp_<dir>_0 stand and lamp_<dir>_1…8
// walk carrying her lit brass lantern in her right hand (the SNES has
// lamp_<dir>_0…2); teacup_down_0/1 (cup and saucer; frame 1 sips);
// lamp_idle_down_0/1 (holding the lantern up, the flame flickering).
// No fall_down: the SNES sheet has none.
import { ottilie, walkFrames, walkAnims, fig, anim } from '../models/act2-npcs.mjs';

export default {
  name: 'ottilie',
  frames: () => [
    ...walkFrames((d, p) => ottilie(d, p), { amp: 0.95 }),
    ...walkFrames((d, p) => ottilie(d, p, 'lamp'), { prefix: 'lamp_', amp: 0.9 }),
    fig('teacup_down_0', () => ottilie('down', {}, 'teacup', 0)), fig('teacup_down_1', () => ottilie('down', {}, 'teacup', 1)),
    fig('lamp_idle_down_0', () => ottilie('down', {}, 'lampIdle', 0)), fig('lamp_idle_down_1', () => ottilie('down', {}, 'lampIdle', 1)),
  ],
  anims: {
    ...walkAnims({ ms: 110 }),
    // Walking with the lamp: the SNES plays lamp_<dir>_0…2 as a cycle.
    ...walkAnims({ ms: 110, prefix: 'lamp_', name: (d) => `lamp_${d}` }),
    teacup_down: anim(['teacup_down_0', 'teacup_down_1'], [1800, 900]),
    lamp_idle_down: anim(['lamp_idle_down_0', 'lamp_idle_down_1'], 240),
  },
};
