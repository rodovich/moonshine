// Cheryl in her striped bathing costume and cap (the moonrise only): stand and walk.
// Sitting on the tub's rim is drawn with the tub (cistern: tub_sit_*), so the
// tub's near rim can cover her shins correctly.
import { cheryl } from '../models/cheryl.mjs';
import { characterFrames, characterAnims } from './cheryl.mjs';

export default {
  name: 'cheryl_swim',
  frames: () => characterFrames((d, p) => cheryl(d, p, { swim: true }), { reach: false }),
  anims: characterAnims(),
};
