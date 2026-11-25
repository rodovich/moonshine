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
import { canal } from '../../art/canal.js';
import { interior } from '../../art/interior.js';
import { moon_eyes } from '../../art/downstairs.js';
import { act2_marks, act2_props, act2_water, crown_parapet, school, schoolyard } from '../../art/act2_objects.js';
import { archive, archive_furniture, crypt, shop, square_props } from '../../art/act2_interiors.js';
import { reveal, bilge_flood } from '../../art/act4_surface.js';
import { seacave } from '../../art/act4_under.js';
import { sea, harbor_props, keyhole, lighthouse, lamproom } from '../../art/act5_surface.js';
import { roof_props } from '../../art/roof.js';
import { goatpath, mott_shack, mott_jugs, goatcliff, goatcliff_a, goatcliff_b, goatcliff_c, goatcliff_d, gull } from '../../art/act2b_goat.js';
import { headland, harbor_quay, fish_stall, bilge_west, signpost, harbor_culvert } from '../../art/act2b_harbor.js';
import { steps_lid } from '../../art/hundredth.js';

export const act2Tiles = {
  sheets: {
    street, buildings, rooftiles, props, cloth,
    terrace, facades, gables,
    fountain, bell_tower, blue_dome, sundial, steps, founders_door, moon_eyes,
    roof, laundry, court, interior, canal,
    act2_marks, act2_props, act2_water, crown_parapet, school, schoolyard,
    archive, archive_furniture, crypt, shop, square_props,
    reveal, bilge_flood, seacave, sea, harbor_props, keyhole, lighthouse, lamproom, roof_props,
    goatpath, mott_shack, mott_jugs, headland, harbor_quay, fish_stall,
    goatcliff, goatcliff_a, goatcliff_b, goatcliff_c, goatcliff_d, gull, bilge_west, signpost, harbor_culvert, steps_lid,
  },
  tiles: {},
};
