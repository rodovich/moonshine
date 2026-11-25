// The game's content, handed to the engine at boot (see src/main.js).
// A new game starts the opening on Cheryl's roof. The engine test maps are
// still here, reachable only through debug parameters (?map=test_street).

import { testMaps, testItemDefs, testScripts } from './test/index.js';
import { openingMaps, openingItems, openingScripts, openingIntro } from './opening/index.js';
import { cherylDeclines, characterSheet } from './opening/common.js';
import { cheryl } from '../art/cheryl.js';

export default {
  title: 'Moonshine',

  // Where a new game begins: Cheryl on her roof, facing the tub.
  start: { map: 'cistern_court', x: 3, y: 6, facing: 'up' },

  player: { name: 'Cheryl', sprite: { sheet: characterSheet(cheryl) } },

  maps: { ...openingMaps, ...testMaps },
  items: { ...openingItems, ...testItemDefs },

  // Named scripts, runnable with ?run=<name> for testing.
  scripts: { ...openingScripts, ...testScripts },

  // Runs once when a new game starts.
  onNewGame: openingIntro,

  defaults: {
    // Using an item on something with no handler for it.
    useFail: async (g) => cherylDeclines(g),
    // Using an item (keyboard) while facing nothing.
    nothingToUseOn: "There's nothing there to use it on.",
  },
};
