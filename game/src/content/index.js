// The game's content, handed to the engine at boot (see src/main.js).
// A new game starts the opening on Cheryl's roof. The engine test maps are
// still here, reachable only through debug parameters (?map=test_street).

import { testMaps, testItemDefs, testScripts, testCharacters } from './test/index.js';
import { openingMaps, openingItems, openingScripts, openingIntro, opening } from './opening/index.js';
import { cherylDeclines } from './opening/common.js';
import { act2Maps, act2Items, act2Scripts, act2 } from './act2/index.js';
import { act3Maps, act3Items, act3Scripts, withAct3, act3 } from './act3/index.js';
import { act4Maps, act4Items, act4Scripts, shipPlanAct4, seaCave, withAct4, startAct4, act4End } from './act4/index.js';
import { act5Maps, act5Items, act5Scripts, withAct5, standInItems, startAct5, act5 } from './act5/index.js';
import { act6Maps, act6Items, act6Scripts, act6Lighting, addAct6 } from './act6/index.js';
import { act6Start } from './act6/climax.js';
import { cheryl } from '../art/cheryl.js';

// Each later act lays its states over earlier acts' maps (by id), in act order:
// Act 3 (the crypt, the Archive, the Crown at dusk), Act 4 (its states of the
// town), Act 5 (the dry Bilge, the lamp room, the town; and stand-ins for maps
// whose acts aren't merged yet).
const maps = withAct5(withAct4(withAct3({ ...openingMaps, ...act2Maps, ...act3Maps, ...act4Maps, ...act5Maps, ...act6Maps, ...testMaps })));
// Act 6 adds its night, dawn, and epilogue states to the other acts' maps (last, so it sees them all).
addAct6(maps);
// The Squeeze leads on to Lamp Street once Act 2 registers it; until then it ends the slice.
opening.squeezeTo = maps.lamp_street ? 'lamp_street' : null;
// The ladder under the hundredth step leads into Act 3 once it registers the Step Gallery; until then Act 2 ends on a card.
act2.stepTo = maps.step_gallery ? 'step_gallery' : null;
// After the dusk vista Act 3 hands over to Act 4: the Morning card and the flat.
act3.next = startAct4;
// The sea cave's mouth opens onto the Goat Path once Act 2 part 2 registers it.
seaCave.goatPath = maps.goat_path ? 'goat_path' : null;
// After Act 4's last lines at the bronze door, Act 5 begins.
act4End.next = startAct5;
// After Act 5's Moonrise card, Act 6 begins in the Windlass Room.
act5.next = act6Start;

const items = { ...standInItems, ...openingItems, ...act2Items, ...act3Items, ...act4Items, ...act5Items, ...act6Items, ...testItemDefs };
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
  scripts: { ...openingScripts, ...act2Scripts, ...act3Scripts, ...act4Scripts, ...act5Scripts, ...act6Scripts, ...testScripts },

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
