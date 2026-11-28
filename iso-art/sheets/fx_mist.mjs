// The well's breath under the SNES sheet's own name (fx_mist), so the engine can
// map the SNES sheet to this one directly. Same frames as fx:mist_*.
import fx from './fx.mjs';

export default {
  name: 'fx_mist',
  frames: () => fx.frames().filter((j) => j.name.startsWith('mist_')),
  anims: { mist: { frames: ['mist_0', 'mist_1', 'mist_2'], ms: 420 } },
};
