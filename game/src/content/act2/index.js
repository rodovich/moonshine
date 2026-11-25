// Act 2, part 1: the upper town and Fountain Square (docs/design/02-city.md).
// Part 2 (the Goat Path, Harbor, lamp room, and Bilge) is built later; until
// then the Goat Path gate is shut and the stair down to the Bilge is roped off.

import { lampStreetMap } from './lamp_street.js';
import { crownMap } from './crown.js';
import { archiveMap, cryptMap } from './archive.js';
import { stepsMap, act2 } from './steps.js';
import { squareMap, shopMap } from './square.js';
import { act2Items } from './common.js';
import { endOfAct } from './ending.js';

export const act2Maps = {
  lamp_street: lampStreetMap,
  crown: crownMap,
  archive: archiveMap,
  crypt: cryptMap,
  hundred_steps: stepsMap,
  fountain_square: squareMap,
  shop: shopMap,
};

export { act2Items, act2 };

export const act2Scripts = {
  // ?map=hundred_steps&x=10&y=18&flags=act2.started,piano.slid,counter.left,step.open&run=act2_end
  act2_end: endOfAct,
};
