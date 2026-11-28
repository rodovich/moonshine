// The game's content, handed to the engine at boot (see src/main.js).
// A new game starts the opening on Cheryl's roof. The engine test maps are
// still here, reachable only through debug parameters (?map=test_street).

import { testMaps, testItemDefs, testScripts, testCharacters } from './test/index.js';
import { openingMaps, openingItems, openingScripts, openingIntro, opening } from './opening/index.js';
import { cherylDeclines } from './opening/common.js';
import { act2Maps, act2Items, act2Scripts, act2, migrateAct2 } from './act2/index.js';
import { act2IsoSheets } from './act2/iso.js';
import { act3Maps, act3Items, act3Scripts, withAct3, act3 } from './act3/index.js';
import { act4Maps, act4Items, act4Scripts, shipPlanAct4, seaCave, withAct4, startAct4, act4End } from './act4/index.js';
import { act5Maps, act5Items, act5Scripts, withAct5, standInItems, startAct5, act5, shipPlanAct5, telescopeAct5 } from './act5/index.js';
import { act6Maps, act6Items, act6Scripts, addAct6 } from './act6/index.js';
import { act6Start } from './act6/climax.js';
import { cheryl, cheryl_swim } from '../art/cheryl.js';
import { old_man_seated, neighbor, sweaty_kid } from '../art/opening_npcs.js';
import { props } from '../art/props.js';
import { fx, fx_mist } from '../art/fx.js';

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
// The Ship Plan (Act 3's) gains its Act 4 and Act 5 looks.
items.ship_plan = shipPlanAct5(shipPlanAct4(items.ship_plan));
// Act 2's telescope gains Act 5's line on anything but the Keeper.
if (items.telescope) items.telescope = telescopeAct5(items.telescope);

export default {
  // Old saves: Act 2's structure pass retired Cheryl's own hat (see act2/common.js).
  migrate: (state) => migrateAct2(state),
  title: 'Moonshine',

  // Where a new game begins: Cheryl on her roof, by the tub.
  start: { map: 'cistern_court', x: 3, y: 6, facing: 'down' }, // facing the player (client feedback)

  // Sitting on the tub's edge, she sits on its rim, a little above her tile.
  // The isometric view: which isometric art sheet (game/assets/iso/manifest.js)
  // draws each SNES sheet's characters.
  // aliases: SNES frame names with a different isometric name ({dir} is the facing).
  iso: {
    sheets: { cheryl, cheryl_swim, old_man_seated, neighbor, sweaty_kid, cat: props, fx, fx_mist, ...act2IsoSheets },
    aliases: { neighbor: { tend: 'smooth_{dir}' } },
  },
  player: { name: 'Cheryl', sprite: { sheet: cheryl }, poseOffsets: { sit_right: [0, -4], rise_right: [0, -2] } },

  maps,
  // People defined once and placed by story state (see the engine README).
  characters: { ...testCharacters },
  items,

  // Named scripts, runnable with ?run=<name> for testing.
  scripts: { ...openingScripts, ...act2Scripts, ...act3Scripts, ...act4Scripts, ...act5Scripts, ...act6Scripts, ...testScripts },


  // Runs once when a new game starts.
  onNewGame: openingIntro,

  // Old-save rules, run on every load (Continue or a debug start), never on a new
  // game. Each does nothing on a save that doesn't need it (structure pass).
  // Cheryl's own hat is retired: the engine drops the unknown 'hat' item before
  // these run, so it goes back to the wardrobe on its own. A save past the old hat
  // trade (the Tourist has the hat, but no telescope was ever placed) gets the
  // telescope in the Shop window, so Act 5's door thread can be finished.
  onLoad: [
    (g) => {
      if (g.flag('tourist.hasHat') && !g.flag('window.telescope') && !g.flag('got.telescope') && !g.flag('telescope.back')) {
        g.setFlag('window.telescope');
        g.setFlag('telescope.migrated');
      }
    },
  ],

  defaults: {
    // Using an item on something with no handler for it.
    useFail: async (g) => cherylDeclines(g),
    // Using an item on nothing in particular (facing nothing, or tapping plain ground).
    nothingToUseOn: "No. That isn't where that goes.",
  },
};
