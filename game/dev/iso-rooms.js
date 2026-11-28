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
    S.add('rooms', 'crypt_stairs_right', 1, 12, 0, 1, 1, 0.3);
    // The hundredth step's lid, Acts 4–6 and the epilogue, on a strip of landing.
    for (const [x, f] of [[17, 'landing_l'], [18, 'landing_r'], [19, 'landing_l'], [20, 'landing_r']]) for (const y of [3, 5]) S.add('act2_landmarks', f, x, y, 0, 1, 1, 0);
    for (const [x, f] of [[17, 'lid_boarded_l'], [18, 'lid_boarded_r'], [19, 'lid_chalked_l'], [20, 'lid_chalked_r']]) S.add('act2_landmarks', f, x, 4, 0, 1, 1, 0);
    // A Goat Path cliff: a 4×2 shelf three courses up, faced south and east (act2_harbor:cliff_s/_e).
    for (let x = 17; x < 21; x++) for (let y = 10; y < 12; y++) {
      const south = y === 11 ? [0, 1, 2].map(() => ['cliff_s', 40]) : [];
      const east = x === 20 ? [0, 1, 2].map(() => ['cliff_e', 40]) : [];
      S.column(x, y, 0, south, east, null, 'act2_harbor');
      S.add('act2_harbor', 'rock_shelf', x, y, 120, 1, 1, 0);
    }
    return S.done();
  },
};
