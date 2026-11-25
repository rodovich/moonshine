// The game's content, handed to the engine at boot (see src/main.js).
// A new game starts the opening on Cheryl's roof. The engine test maps are
// still here, reachable only through debug parameters (?map=test_street).

import { testMaps, testItemDefs, testScripts, testCharacters } from './test/index.js';
import { openingMaps, openingItems, openingScripts, openingIntro, opening } from './opening/index.js';
import { cherylDeclines } from './opening/common.js';
import { act2Maps, act2Items, act2Scripts, act2 } from './act2/index.js';
import { act3Maps, act3Items, act3Scripts, withAct3 } from './act3/index.js';
import { act6Maps, act6Items, act6Scripts, act6Lighting, addAct6 } from './act6/index.js';
import { cheryl } from '../art/cheryl.js';

// Act 3 layers its states onto Act 2's maps (the crypt, the Archive, the Crown at dusk).
const maps = withAct3({ ...openingMaps, ...act2Maps, ...act3Maps, ...act6Maps, ...testMaps });
// Act 6 adds its night, dawn, and epilogue states to the other acts' maps (last, so it sees them all).
addAct6(maps);
// The Squeeze leads on to Lamp Street once Act 2 registers it; until then it ends the slice.
opening.squeezeTo = maps.lamp_street ? 'lamp_street' : null;
// The ladder under the hundredth step leads into Act 3 once it registers the Step Gallery; until then Act 2 ends on a card.
act2.stepTo = maps.step_gallery ? 'step_gallery' : null;

export default {
  title: 'Moonshine',

  // Where a new game begins: Cheryl on her roof, facing the tub.
  start: { map: 'cistern_court', x: 3, y: 6, facing: 'up' },

  // Sitting on the tub's edge, she sits on its rim, a little above her tile.
  player: { name: 'Cheryl', sprite: { sheet: cheryl }, poseOffsets: { sit_right: [0, -4], rise_right: [0, -2] } },

  maps,
  // People defined once and placed by story state (see the engine README).
  characters: { ...testCharacters },
  items: { ...openingItems, ...act2Items, ...act3Items, ...act6Items, ...testItemDefs },

  // Named scripts, runnable with ?run=<name> for testing.
  scripts: { ...openingScripts, ...act2Scripts, ...act3Scripts, ...act6Scripts, ...testScripts },

  // Lighting presets beyond the art task's day, dusk, and night.
  lighting: { ...act6Lighting },

  // Runs once when a new game starts.
  onNewGame: openingIntro,

  defaults: {
    // Using an item on something with no handler for it.
    useFail: async (g) => cherylDeclines(g),
    // Using an item (keyboard) while facing nothing.
    nothingToUseOn: "There's nothing there to use it on.",
  },
};
