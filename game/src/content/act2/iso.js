// Act 2's cast in the isometric view: each isometric sheet (game/assets/iso,
// named as the SNES sheet) paired with the SNES sheet whose characters it
// draws, for content.iso.sheets (engine README, "Isometric view"). The
// palette swaps (mover_other, girl_b, girl_c, shopkeeper_coral,
// shopkeeper_mustard, goat_brown) wait on the engine binding them by palette.

import { counting_woman, mover, tourist, mayor, ambrose, basin_woman, girl, rope, watering_woman, bench_man, watering_woman_glasses, bench_man_glasses } from '../../art/act2_npcs.js';
import { goat } from '../../art/act2b_goat.js';
import { ottilie } from '../../art/named_npcs.js';
import { shopkeeper } from '../../art/npcs.js';
import { mott, boatman } from '../../art/act4_sprites.js';
import { mott_jug } from '../../art/act6_sprites.js';
import { keeper, fishmonger } from '../../art/act5_sprites.js';
import { fish } from '../../art/landmarks.js';

export const act2IsoSheets = {
  counting_woman, mover, tourist, mayor, ambrose, basin_woman, girl, rope,
  watering_woman, bench_man, watering_woman_glasses, bench_man_glasses,
  goat, ottilie, shopkeeper, mott, boatman, mott_jug, keeper, fishmonger,
  // The Fountain's bronze fish (the 'fish' entity in square.js), cut out of the fountain's renders.
  act2_landmarks: fish,
};
