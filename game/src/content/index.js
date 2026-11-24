// The game's content, handed to the engine at boot (see src/main.js).
// Until the opening area exists, the game starts in the engine test yard.

import { testMaps, testItemDefs, testScripts } from './test/index.js';
import { testPerson } from './test/art.js';

export default {
  title: 'Moonshine',

  // Where a new game begins.
  start: { map: 'test_yard', x: 5, y: 6, facing: 'down' },

  // Cheryl. `sprite` follows the character sheet convention in the engine README.
  player: { name: 'Cheryl', sprite: { sheet: testPerson } },

  maps: { ...testMaps },
  items: { ...testItemDefs },

  // Named scripts, runnable with ?run=<name> for testing.
  scripts: { ...testScripts },

  // Optional: runs once when a new game starts.
  // onNewGame: async (g) => {},

  defaults: {
    // Using an item on something with no handler for it.
    useFail: async (g, _target, _itemId) => {
      await g.describe("I don't think that's going to help here.");
    },
    // Using an item (keyboard) while facing nothing.
    nothingToUseOn: "There's nothing there to use it on.",
  },
};
