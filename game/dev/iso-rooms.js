// The four room sets side by side, built with S.room() (iso-kit), for the art
// dev page (?only=court&map=rooms&cam=map). A few Act 2 interior pieces stand
// in each, to judge the walls against the furniture.
import { isoScene } from '../src/content/iso-kit.js';

export const roomsIso = {
  scene() {
    const S = isoScene();
    S.room(1, 1, 6, 5, { set: 'shop', windows: [[3, 0], [0, 3]], doors: [[3, 6]] });
    S.prop('act2_interiors', 'shelving_2', 4, 1, 0, 2, 1);
    S.prop('act2_interiors', 'marble_jar', 1, 4);
    S.room(9, 1, 6, 5, { set: 'archive', windows: [[11, 0]], doors: [[8, 3], [15, 2]] });
    S.prop('act2_interiors', 'desk', 11, 2, 0, 2, 1);
    S.room(1, 9, 6, 5, { set: 'crypt', doors: [[4, 8]] });
    S.prop('act2_interiors', 'crate_stack', 1, 9);
    S.prop('act2_interiors', 'lectern', 3, 10);
    S.room(9, 9, 6, 5, { set: 'lamp', windows: [[10, 8], [12, 8], [14, 8], [8, 10], [8, 12]], doors: [[11, 14]] });
    return S.done();
  },
};
