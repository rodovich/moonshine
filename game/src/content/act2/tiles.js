// Act 2's tileset: every sheet its maps reference as 'sheet:frame'.

import { street } from '../../art/street.js';
import { buildings } from '../../art/buildings.js';
import { rooftiles } from '../../art/rooftiles.js';
import { props } from '../../art/props.js';
import { cloth } from '../../art/cloth.js';
import { terrace, facades, gables } from '../../art/city.js';
import { fountain, bell_tower, blue_dome, sundial, steps, founders_door } from '../../art/landmarks.js';
import { roof, laundry } from '../../art/roof.js';
import { court } from '../../art/court.js';
import { interior } from '../../art/interior.js';
import { moon_eyes } from '../../art/downstairs.js';
import { act2_marks, act2_props, act2_water, crown_parapet, school, schoolyard } from '../../art/act2_objects.js';
import { archive, archive_furniture, crypt, shop, square_props } from '../../art/act2_interiors.js';

export const act2Tiles = {
  sheets: {
    street, buildings, rooftiles, props, cloth,
    terrace, facades, gables,
    fountain, bell_tower, blue_dome, sundial, steps, founders_door, moon_eyes,
    roof, laundry, court, interior,
    act2_marks, act2_props, act2_water, crown_parapet, school, schoolyard,
    archive, archive_furniture, crypt, shop, square_props,
  },
  tiles: {
    // The piano's scrape marks lie on the paving, under characters; the art names them over_* (asked to rename).
    scrape_a: { sheet: act2_marks, frame: 'over_scrape_a' },
    scrape_b: { sheet: act2_marks, frame: 'over_scrape_b' },
  },
};
