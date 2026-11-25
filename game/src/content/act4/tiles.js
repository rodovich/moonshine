// Act 4's tileset: Act 2's sheets (for the surface maps Act 4 changes), the
// underground's, and Act 4's own.

import { act2Tiles } from '../act2/tiles.js';
import { canal } from '../../art/canal.js';
import { fish } from '../../art/landmarks.js';
import { hull, hull_water } from '../../art/underground.js';
import { ds, ds_water } from '../../art/downstairs.js';
import {
  reveal, reveal_mouth, reveal_door, bilge_flood, square4,
  belfry, belfry_bell, belfry_props, ice_cellar, ice_cellar_props,
} from '../../art/act4_surface.js';
import { sisters, pumphall, tidewheel, tide_channel, eshaft, seacave, seagrate, mainpipe } from '../../art/act4_under.js';
import { act4_props } from '../../art/act4_sprites.js';

export const act4Tiles = {
  sheets: {
    ...act2Tiles.sheets,
    canal, fish, hull, hull_water, ds, ds_water,
    reveal, reveal_mouth, reveal_door, bilge_flood, square4,
    belfry, belfry_bell, belfry_props, ice_cellar, ice_cellar_props,
    sisters, pumphall, tidewheel, tide_channel, eshaft, seacave, seagrate, mainpipe,
    act4_props,
  },
  tiles: { ...act2Tiles.tiles },
};
