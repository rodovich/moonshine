// Act 2: the morning after, the wider city (docs/design/02-city.md). Part 1 is
// the upper town and Fountain Square; part 2 the long way round: the Goat Path,
// the Harbor and its lamp room, and the Bilge.

import { lampStreetMap } from './lamp_street.js';
import { crownMap } from './crown.js';
import { archiveMap, cryptMap } from './archive.js';
import { stepsMap, act2 } from './steps.js';
import { squareMap, shopMap } from './square.js';
import { goatPathMap } from './goat_path.js';
import { harborMap, lampRoomMap } from './harbor.js';
import { bilgeMap } from './bilge.js';
import { act2Items, migrateAct2 } from './common.js';
import { endOfAct } from './ending.js';
import { crownIso } from './crown-iso.js';
import { lampStreetIso } from './lamp_street-iso.js';

// The isometric view's hand-built scenes (each map's <map>-iso.js, from the town kit).
// Wired here, not in the map files, because each scene replays its map's compose().
lampStreetMap.iso = lampStreetIso;
crownMap.iso = crownIso;

export const act2Maps = {
  lamp_street: lampStreetMap,
  crown: crownMap,
  archive: archiveMap,
  crypt: cryptMap,
  hundred_steps: stepsMap,
  fountain_square: squareMap,
  shop: shopMap,
  goat_path: goatPathMap,
  harbor: harborMap,
  lamp_room: lampRoomMap,
  bilge: bilgeMap,
};

export { act2Items, act2, migrateAct2 };

export const act2Scripts = {
  // ?map=hundred_steps&x=10&y=18&flags=act2.started,piano.slid,counter.left,step.open&run=act2_end
  act2_end: endOfAct,
};
