// Act 2's tileset: every sheet its maps reference as 'sheet:frame'.

import { street } from '../../art/street.js';
import { buildings } from '../../art/buildings.js';
import { rooftiles } from '../../art/rooftiles.js';
import { props } from '../../art/props.js';
import { cloth } from '../../art/cloth.js';
import { terrace, facades, gables } from '../../art/city.js';
import { fountain, bell_tower, blue_dome, sundial, steps, founders_door } from '../../art/landmarks.js';
import { roof, laundry } from '../../art/roof.js';
import { court, court_props } from '../../art/court.js';
import { interior, furniture, fittings, rug } from '../../art/interior.js';
import { moon_eyes } from '../../art/downstairs.js';
import { standins } from './standins.js';

export const act2Tiles = {
  sheets: {
    street, buildings, rooftiles, props, cloth,
    terrace, facades, gables,
    fountain, bell_tower, blue_dome, sundial, steps, founders_door, moon_eyes,
    roof, laundry, court, court_props,
    interior, furniture, fittings, rug,
    standins,
  },
  tiles: {},
};
