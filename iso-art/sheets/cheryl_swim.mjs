// Cheryl in her striped bathing costume and cap (the moonrise only): stand and walk.
// Sitting on the tub's rim is drawn with the tub (cistern: tub_sit_*), so the
// tub's near rim can cover her shins correctly.
import { cheryl } from '../models/cheryl.mjs';
import { characterFrames, characterAnims, SIT_TUB } from './cheryl.mjs';
import { frame, POST } from '../lib/jobs.mjs';

export default {
  name: 'cheryl_swim',
  // sit_tub_right on its own (anchored at her hips' tile, 0.75 above the floor), for a
  // renderer that poses her separately; the cistern sheet's tub_sit_* draw her with the tub.
  frames: () => characterFrames((d, p) => cheryl(d, p, { swim: true }), { reach: false, sit: true, extra: [
    frame('sit_tub_right', () => cheryl('right', SIT_TUB, { swim: true }), { post: POST.figure }),
  ] }),
  anims: characterAnims(),
};
