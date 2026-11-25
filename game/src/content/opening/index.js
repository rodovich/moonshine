// The opening: Moonshine Night in Cistern Court (docs/design/01-opening.md).

import { courtMap, flySwifts, opening } from './court.js';
import { flatMap } from './flat.js';
import { openingItems } from './common.js';
import { moonrise } from './moonrise.js';

export const openingMaps = { cistern_court: courtMap, flat: flatMap };
export { openingItems, opening };

// The start of a new game: the roof at sunset.
export async function openingIntro(g) {
  g.playMusic('cistern_court');
  await g.wait(0.9);
  flySwifts(g);
  g.sfx('swifts');
  await g.wait(1.2);
  await g.think(
    'Moonshine Night.',
    "A tub on the roof and the moon on its way. Thirty-one years, and I haven't missed one.",
    "Everything's ready. Nearly. On Moonshine Night there's always a nearly.",
  );
  g.hint(g.usingTouch ? 'Tap to walk. Tap things to look.' : 'Arrows/click: walk   Z/click: look, talk   X: bag', 6);
}

export const openingScripts = {
  // ?map=cistern_court&run=opening_intro
  opening_intro: openingIntro,
  // ?map=cistern_court&x=3&y=5&flags=tub.full,neighbor.sheetsMoved&run=opening_moonrise
  opening_moonrise: moonrise,
};
