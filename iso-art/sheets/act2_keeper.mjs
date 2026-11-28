// The Lighthouse Keeper: a brown bob under a navy peaked cap with a brass badge,
// a navy uniform coat with brass buttons, cream trousers, and (after the swap)
// her brass telescope. SNES sheet: keeper (act5_sprites.js; Act 2's Harbor uses it).
// Frames: <dir>_0 stand (the SNES has no walk); polish_up_0/1 (from behind,
// polishing with a cream cloth); window_up_0/1 (at the window from behind, a
// hand at her brow, then leaning in); shade_down_0/1 (facing us, shading her
// eyes, then turning her head); scope_up_0/1 (the telescope at the window from
// behind, swinging a little); scope_down_0/1 (looking out through it toward the
// viewer, the glint on the glass moving); hold_down_0 (holding it across her
// body); fall_down_0/1.
import { keeper, keeperLook, fig, fallFrames, anim, DIRS4 } from '../models/act2-npcs.mjs';

const two = (name, kind, dir) => [fig(`${name}_0`, () => keeper(dir, {}, kind, 0)), fig(`${name}_1`, () => keeper(dir, {}, kind, 1))];

export default {
  name: 'keeper',
  frames: () => [
    ...DIRS4.map((d) => fig(`${d}_0`, () => keeper(d, {}))),
    ...two('polish_up', 'polish', 'up'),
    ...two('window_up', 'window', 'up'),
    ...two('shade_down', 'shade', 'down'),
    ...two('scope_up', 'scopeUp', 'up'),
    ...two('scope_down', 'scopeDown', 'down'),
    fig('hold_down_0', () => keeper('down', {}, 'hold')),
    ...fallFrames(keeperLook()),
  ],
  anims: {
    polish_up: anim(['polish_up_0', 'polish_up_1'], 260),
    window_up: anim(['window_up_0', 'window_up_1'], [1800, 1200]),
    shade_down: anim(['shade_down_0', 'shade_down_1'], [900, 300]),
    scope_up: anim(['scope_up_0', 'scope_up_1'], [1600, 1600]),
    scope_down: anim(['scope_down_0', 'scope_down_1'], [1400, 700]),
  },
};
