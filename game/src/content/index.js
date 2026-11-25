// The game's content, handed to the engine at boot (see src/main.js).
// A new game starts the opening on Cheryl's roof. The engine test maps are
// still here, reachable only through debug parameters (?map=test_street).

import { testMaps, testItemDefs, testScripts, testCharacters } from './test/index.js';
import { openingMaps, openingItems, openingScripts, openingIntro, opening } from './opening/index.js';
import { cherylDeclines } from './opening/common.js';
import { act2Maps, act2Items, act2Scripts, act2 } from './act2/index.js';
import { act3Maps, act3Items, act3Scripts, withAct3, act3 } from './act3/index.js';
import { act4Maps, act4Items, act4FallbackItems, act4Scripts, shipPlanAct4, seaCave, withAct4, startAct4 } from './act4/index.js';
import { cheryl } from '../art/cheryl.js';

// Each act layers its states onto earlier acts' maps, in order: Act 3 (the crypt,
// the Archive, the Crown at dusk), then Act 4 (its states of the town).
const maps = withAct4(withAct3({ ...openingMaps, ...act2Maps, ...act3Maps, ...act4Maps, ...testMaps }));
// The Squeeze leads on to Lamp Street once Act 2 registers it; until then it ends the slice.
opening.squeezeTo = maps.lamp_street ? 'lamp_street' : null;
// The ladder under the hundredth step leads into Act 3 once it registers the Step Gallery; until then Act 2 ends on a card.
act2.stepTo = maps.step_gallery ? 'step_gallery' : null;
// After the dusk vista Act 3 hands over to Act 4: the Morning card and the flat.
act3.next = startAct4;
// The sea cave's mouth opens onto the Goat Path once Act 2 part 2 registers it.
seaCave.goatPath = maps.goat_path ? 'goat_path' : null;

const items = { ...act4FallbackItems, ...openingItems, ...act2Items, ...act3Items, ...act4Items, ...testItemDefs };
// The Ship Plan (Act 3's) gains its Act 4 looks.
items.ship_plan = shipPlanAct4(items.ship_plan);

export default {
  title: 'Moonshine',

  // Where a new game begins: Cheryl on her roof, by the tub.
  start: { map: 'cistern_court', x: 3, y: 6, facing: 'down' }, // facing the player (client feedback)

  // Sitting on the tub's edge, she sits on its rim, a little above her tile.
  player: { name: 'Cheryl', sprite: { sheet: cheryl }, poseOffsets: { sit_right: [0, -4], rise_right: [0, -2] } },

  maps,
  // People defined once and placed by story state (see the engine README).
  characters: { ...testCharacters },
  items,

  // Named scripts, runnable with ?run=<name> for testing.
  scripts: { ...openingScripts, ...act2Scripts, ...act3Scripts, ...act4Scripts, ...testScripts },

  // Runs once when a new game starts.
  onNewGame: openingIntro,

  defaults: {
    // Using an item on something with no handler for it.
    useFail: async (g) => cherylDeclines(g),
    // Using an item (keyboard) while facing nothing.
    nothingToUseOn: "There's nothing there to use it on.",
  },
};
