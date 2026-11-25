// Act 6's underground tileset: every sheet the Long Keel and the Sighting
// Room reference as 'sheet:frame' (art index: docs/art-act6.md).

import { hull } from '../../art/underground.js';
import { keel_hatch } from '../../art/act5_under.js';
import { basin, moonbeam, sight_wall, sight_props, keel, keel_lit } from '../../art/act6_under.js';

export const act6Tiles = {
  sheets: { hull, keel_hatch, basin, moonbeam, sight_wall, sight_props, keel, keel_lit },
  tiles: {},
};
