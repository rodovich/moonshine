// The game's content, handed to the engine at boot (see src/main.js).
// Until the opening area exists, the game starts in the engine test street.

import { testMaps, testItemDefs, testScripts, testCharacters } from './test/index.js';
import { cheryl } from '../art/cheryl.js';

export default {
  title: 'Moonshine',

  // Where a new game begins.
  start: { map: 'test_street', x: 5, y: 7, facing: 'down' },

  // Cheryl. Character sheets use idle_<dir>_<n> and walk_<dir>_<n> frames.
  player: { name: 'Cheryl', sprite: { sheet: cheryl } },

  maps: { ...testMaps },
  // People defined once and placed by story state (see the engine README).
  characters: { ...testCharacters },
  items: { ...testItemDefs },

  // Named scripts, runnable with ?run=<name> for testing.
  scripts: { ...testScripts },

  // Optional: runs once when a new game starts.
  // onNewGame: async (g) => {},

  // Optional: lighting presets added to (or replacing) the engine's 'day',
  // 'dusk', and 'night'. Each is a list of { color, mode, amount } passes.
  // lighting: { dusk: [{ color: 'coral', mode: 'multiply', amount: 0.5 }] },

  defaults: {
    // Using an item on something with no handler for it.
    useFail: async (g, _target, _itemId) => {
      await g.describe("I don't think that's going to help here.");
    },
    // Using an item (keyboard) while facing nothing.
    nothingToUseOn: "There's nothing there to use it on.",
  },
};
