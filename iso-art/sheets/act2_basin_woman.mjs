// The Woman with Basin: brown hair in a bun, an ochre dress, a shallow iron basin
// of water held at her waist. SNES sheet: basin_woman (act2_npcs.js).
// Frames: down_0 (holding the basin level); tip_down_0/1 (tipping it: the water
// pours off the far rim to a splash at her feet; start the trickle overlay on
// frame 1, as in the SNES); fall_down_0/1.
import { basinWoman, basinWomanLook, fig, fallFrames, anim } from '../models/act2-npcs.mjs';

export default {
  name: 'basin_woman',
  frames: () => [
    fig('down_0', () => basinWoman('down', {})),
    fig('tip_down_0', () => basinWoman('down', {}, 'tip', 0)), fig('tip_down_1', () => basinWoman('down', {}, 'tip', 1)),
    ...fallFrames(basinWomanLook()),
  ],
  anims: { tip_down: anim(['tip_down_0', 'tip_down_1'], 260) },
};
