// Act 3: Downstairs, the first descent (docs/design/03-downstairs.md).
// Five underground maps, plus Act 3's states of Act 2's Hundred Steps, crypt,
// Archive, and Crown (see surface.js).

import { galleryMap, cradleMap, galleryScripts } from './gallery.js';
import { hallsMap, bunkMap, hallsScripts } from './halls.js';
import { chartMap, chartScripts } from './chart.js';
import { act3Items } from './common.js';
import { withAct3, crownEnding, surfaceScripts, act3 } from './surface.js';

export const act3Maps = {
  step_gallery: galleryMap,
  cradle: cradleMap,
  lamp_halls: hallsMap,
  bunk_room: bunkMap,
  chart_room: chartMap,
};

export { act3Items, withAct3, act3 };

export const act3Scripts = {
  ...galleryScripts,
  ...hallsScripts,
  ...chartScripts,
  ...surfaceScripts,
  // ?map=crown&x=11&y=12&flags=founders.unbolted,act3.surfaced,moonEyes.glow,act3.crypt&run=act3_end
  act3_end: crownEnding,
};
