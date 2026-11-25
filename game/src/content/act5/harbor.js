// The risen Harbor (32 × 15) and the lamp room in Act 5
// (docs/design/05-high-and-dry.md, "The risen Harbor", "Lamp room").
//
// The Harbor has risen six feet out of the sea, so it's its own map, one row
// taller than Act 2's: rows 0-8 as before; below the old quay edge, a row of
// exposed hull, then the sea, lower, and on the horizon the Teeth.
//
//      x 0         1         2         3
//        01234567890123456789012345678901
//  y  0  ~~^^~RRRRRRRRRRRRRRRRRR~~~#ww#~~   ^^ the Goat stair (2-3); the lighthouse (26-29, 0-3)
//     3  ~~^^~#D##w##D##w##D##w#~~~#DD#~~   the lighthouse door (27-28, 3)
//     6  ................................   west edge (x0, y6-8) → bilge_dry; the Kid's laps (18-26, 4-6)
//     8  ........b.....M...b.............   bollards (8, 18); Mott at the edge (13, 8)
//     9  nnnnnnnnnnnnnnnnnnnnnnnnnnnnnnKK   the old quay edge; KK the Keyhole (30-31, 9-10)
//    10  hhhhhhhhhhhhhhhhhhhhhhhhhhhhhhKK   the exposed hull
//    11  %%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%   the sea, lower; the ferry hangs here (10-15, 11-12)
//    14  %%%%%%%%TTTTTTTTTTT%%%%%%%%%%%%%   the Teeth (8-18, 12-14), growing by stage

import { composedMap, blankGrid } from '../opening/grid.js';
import { act5Tiles, withSheets } from './tiles.js';
import { teeth, ferry } from '../../art/act5_surface.js';
import { mott } from '../../art/act4_sprites.js';
import { sweaty_kid } from '../../art/opening_npcs.js';
import { keeper } from '../../art/act5_sprites.js';
import { fx } from '../../art/fx.js';
import { harborTopRows } from '../act2/harbor.js';
import {
  started, after5, doorOpen, stage, WRONGNESS, LAUNDRY_AMBIENCE,
  layout, bump, cycle, cherylDeclines, firstMeet,
  both, not, morePatches, untilAct5,
} from './common.js';
import { act5Loops } from './loops.js';
import { relay, kidAtHarbor, chargeDisc } from './relay.js';
import { teethLook, showTeeth, SURF } from './teeth.js';

const W = 32, H = 15;
const V8 = (x) => 'abcdefgh'[x % 8];


function compose() {
  const L = layout(W, H, blankGrid);
  // Rows 0-8 exactly as Act 2 draws the Harbor: the headland, the Goat stair,
  // the harbor-front terrace, the lighthouse, the quay with its crates, nets,
  // and bollards. (Mott stands beside his bollard at (13, 8) in Act 5.)
  harborTopRows(L);
  // The old quay edge, the exposed hull, the Keyhole with the chain running out.
  for (let x = 0; x < W; x++) {
    L.set('ground', x, 9, `reveal:qwall_${V8(x)}`, true);
    L.set('ground', x, 10, `harbor_hull:hull_${V8(x)}`, true);
  }
  for (let ty = 0; ty < 2; ty++) for (let tx = 0; tx < 2; tx++) L.set('ground', 30 + tx, 9 + ty, `keyhole:keyhole_x${tx}y${ty}`, true);
  // The Bilge's canal comes out under the quay here; dry now, with no outflow.
  L.set('ground', 1, 9, 'harbor_culvert:culvert_dry_l', true); L.set('ground', 2, 9, 'harbor_culvert:culvert_dry_r', true);
  // The sea, lower; paler and hazier toward the horizon, where the Teeth sit.
  for (let x = 0; x < W; x++) {
    L.set('ground', x, 11, `sea:wash_${x % 2 ? 'b' : 'a'}`, true);
    L.set('ground', x, 12, `sea:sea_n${x % 2 ? 'e' : 'w'}`, true);
    L.set('ground', x, 13, `sea:far_${x % 2 ? 'b' : 'a'}`, true);
    L.set('ground', x, 14, `sea:haze_${x % 2 ? 'b' : 'a'}`, true);
  }
  // The laundry streaming over the quay (clear of the crates at 7-8).
  'abcdef'.split('').forEach((c, i) => L.set('overhead', 10 + i, 4, `cloth:over_wind_${c}`));
  return L.done();
}


// ---------------------------------------------------------------------------
// Captain Mott, at the quay edge

const mottTalk = async (g, self) => {
  if (firstMeet(g, 'mott5')) {
    return g.say(self,
      'Look at her, Cheryl. Riding high as a cork. Every gust takes another bite of her.',
      "See that white line, out by the mouth? That's the Teeth. They weren't there this morning. Well, they were. We weren't.",
      'Whatever holds her is at the bow end. Always was. Grandad said the chain went out under the lighthouse.');
  }
  return g.say(self, {
    1: "The Teeth. A good mile off yet. A good mile's not much, at the speed she's going.",
    2: "Closer. I can count the rocks now. I'd rather not.",
    3: 'I can hear the surf on them. Do it quick, Cheryl. Whatever it is.',
  }[stage(g)]);
};

const mottNpc = {
  id: 'mott5', name: 'Mott', x: 14, y: 8, facing: 'down',
  sprite: { sheet: mott },
  interact: mottTalk,
  use: {
    clapper: (g, self) => g.say(self, "That's a bell's tongue. Big bell. ...The Crown bell's? What've you been doing, Cheryl? No. Don't tell me."),
    square_jug: (g, self) => g.say(self, "Keep it. I'm off it. I'm off all of it till she's tied up again."),
    moonglass_disc: (g, self) => g.say(self, "Grandad had a bit of glass like that. Said it came off a door. I thought he meant a pub door."),
    '*': (g, self) => g.say(self, 'Not now, Cheryl. Look at the sea.'),
  },
};

// ---------------------------------------------------------------------------
// Objects

const objects = [
  {
    // Her hull and the quay edge beside her, so she can be reached from the quay.
    id: 'ferry_look', x: 10, y: 9, w: 6, h: 3,
    look: "The Persistence, hanging off her ropes, lower than the quay. Mott's not looking at her. He's looking at the Teeth.",
    use: { bucket: (g) => g.describe("Six feet down. My arms aren't."), '*': cherylDeclines },
  },
  {
    // The sea and the reef, with the quay edge in front of them (reached from the quay).
    id: 'teeth_view', x: 8, y: 9, w: 11, h: 6, lookKey: 'harbor_teeth', interact: (g) => teethLook(g),
    use: { bucket: (g) => g.describe("Six feet down. My arms aren't."), '*': cherylDeclines },
  },
  ...[[0, 8], [19, 11]].map(([x, w]) => ({
    id: `quay_edge_${x}`, x, y: 9, w, lookKey: 'quay_edge',
    look: "Six feet down to the water now. The sea didn't go anywhere. We came up out of it.",
    use: { bucket: (g) => g.describe("Six feet down. My arms aren't."), '*': cherylDeclines },
  })),
  { id: 'keyhole5', x: 30, y: 9, w: 2, look: 'The Keyhole. A chain runs out through it now, taut, down into the sea. It never did that before. Or it did, and the sea hid it.' },
  {
    id: 'harbor_office', x: 12, y: 3, look: 'A new note: GONE TO LOOK FOR THE LANDING. STILL.',
  },
  ...[[5, 1], [7, 5], [13, 5], [19, 4]].map(([x, w]) => ({
    id: `fronts_${x}`, x, y: 2, w, h: 2, lookKey: 'harbor_laundry',
    look: 'Every line of washing in Tessel is pointing the same way. Out to sea.',
  })),
  // Either side of the door, reaching down to row 3, so they can be reached from the quay.
  ...[26, 29].map((x) => ({ id: `lighthouse5_${x}`, x, y: 0, h: 4, lookKey: 'lighthouse5', look: 'The lighthouse, lit in broad daylight. Somebody up there has seen what I\'ve seen.' })),
  { id: 'nets5', x: 20, y: 4, look: 'Nets, drying. Everything in Tessel is drying today.' },
  ...[7, 8].map((x) => ({ id: `crate5_${x}`, x, y: 4, lookKey: 'crates5', look: 'Crates. Stencilled MAINLAND, and waiting for a ferry that\'s six feet below them.' })),
  ...[8, 18].map((x) => ({ id: `bollard5_${x}`, x, y: 8, lookKey: 'bollards5', look: "A bollard, with the ferry's rope round it, pulled as tight as a fiddle string." })),
  { id: 'bollard5_13', x: 13, y: 8, look: "Mott's bollard. He's not sitting on it today. He's standing, and watching." },
  ...[6, 18].map((x) => ({ id: `door5_${x}`, x, y: 2, h: 2, lookKey: 'harbor_doors5', look: 'Not my door. Fishing nets drying on the handle, flapping out to sea.' })),
].map((o) => ({ solid: false, use: { '*': cherylDeclines }, ...o }));

const teethSprite = {
  // A 176×48 sprite on the horizon (8-18, 12-14). It sorts as if its feet
  // were on row 13, and the ferry as if on row 14, so the ferry hangs in front.
  id: 'teeth', x: 8, y: 13, w: 11, kind: 'object', solid: false, offset: [0, 16],
  sprite: (g) => ({ sheet: teeth, frame: `stage${stage(g)}` }),
};

const ferrySprite = {
  id: 'ferry5', x: 8, y: 14, w: 11, kind: 'object', solid: false, offset: [0, -32],
  sprite: { sheet: ferry, frame: 'persistence' },
};

// ---------------------------------------------------------------------------

async function onEnter(g) {
  g.setWrongness(WRONGNESS);
  g.playMusic('harbor');
  act5Loops(g, [...LAUNDRY_AMBIENCE, 'surf']);
  g.setLoopVolume('surf', SURF[stage(g)], 0);
  if (g.flag('relay.ready')) return relay(g);
  if ((g.flag('teeth.seen') || 0) < stage(g)) await showTeeth(g);
}

export const harborMap = composedMap(compose, {
  id: 'harbor_risen',
  name: 'The Harbor',
  tileset: act5Tiles,
  // Music plays from onEnter, so the relay's cutscene visits don't cut its own music off.
  lighting: 'day',
  background: 'ink',
  step: 'step_stone',
  spawn: [4, 6],
  exits: [
    { x: 0, y: 6, h: 3, to: 'bilge_dry', at: [30, 12], facing: 'left' },
    { x: 27, y: 3, w: 2, to: 'lamp_room', at: [3, 6], facing: 'up' },
  ],
  ambient: [
    { every: [9, 16], run: (g) => g.sfx('gull', { at: [g.random(4, 28), 3] }) },
  ],
  onEnter,
  entities: [...objects, teethSprite, ferrySprite, mottNpc, kidAtHarbor],
});

// ---------------------------------------------------------------------------
// The lamp room in Act 5: the Keeper at the window, the lamp lit for the reef.

// The telescope (docs/design/structure-pass.md, section 6): the Keeper gave
// it away in Act 2 and Cheryl put it in the Shop window. Now she wants it back
// to watch the reef, and won't let anyone near the lamp until she has it.
const hasTelescope = (g) => !!g.flag('keeper.telescope');

async function keeperTalk(g, self) {
  if (doorOpen(g)) return g.say(self, "Twenty-two years I looked at the lamp. Now I can't stop looking at that reef.");
  if (hasTelescope(g)) return g.say(self, "Go on, then. Quickly. I'll be at the window.");
  if (!g.flag('keeper.asked')) {
    g.setFlag('keeper.asked');
    g.setFlag('met.keeper5');
    return g.say(self,
      "There's a REEF. Why is there a REEF? Twenty-two years and nobody mentions a REEF?",
      "I turned round this morning to see what the shouting was. I've never turned round. And THERE IT WAS.",
      'I need to SEE it. Properly. And my telescope\'s in a SHOP WINDOW.',
      g.flag('telescope.migrated')
        ? "And my telescope's in a SHOP WINDOW. Don't ask me how."
        : 'You put it there. I said somewhere it\'d be looked at. ...I did say that.',
      'Bring me my telescope, and you can have anything. Anything.');
  }
  return g.say(self, cycle(g, 'keeper5.repeat', [
    'My telescope. In a shop window. Being LOOKED AT.',
    "Don't look at the window. No. Do. Somebody has to.",
  ]));
}

async function giveTelescope(g, self) {
  g.takeItem('telescope');
  g.sfx('give');
  g.setFlag('keeper.telescope');
  await g.say(self,
    "My telescope! Oh, Cheryl. You've saved my life. Possibly everyone's. Don't tell me which.",
    'What do you want? Anything. ...The LAMP? You want to put your hand in my lamp?',
    "...Go on, then. Quickly. I'll be at the window.");
}

const keeperNpc = {
  id: 'keeper5', name: 'Lighthouse Keeper', x: 5, y: 2, facing: 'up',
  // At the window: shading her eyes, then with her telescope raised once she
  // has it back (holding it across her body while she talks).
  sprite: (g) => ({ sheet: keeper, frame: hasTelescope(g) ? 'scope_up' : 'shade_down' }),
  talkPose: 'hold_down_0',
  turnToTalk: false,
  interact: keeperTalk,
  use: {
    telescope: giveTelescope,
    moonglass_disc: (g, self) => (hasTelescope(g) ? g.say(self, 'Not me. The LAMP.') : g.say(self, "Not near the lamp. Not till I've got my telescope. I mean it.")),
    '*': (g, self) => g.say(self, "Is it my telescope? It's not my telescope."),
  },
};

const WINDOW_LOOKS = {
  1: "From up here, the Teeth are a white line across the mouth of the Bowl. And we're pointing at them.",
  2: "Closer. The whole town's leaning toward them like a dog on a lead.",
  3: "Close enough to count. I don't.",
};

async function lampLook(g) {
  if (doorOpen(g)) return g.describe("The lamp, turning. She's had her eye to the telescope the whole time.");
  if (hasTelescope(g)) return g.describe("The lamp. Brightest light in Tessel. She's let me near it.");
  return g.describe('The lamp, lit in the middle of the afternoon. Brightest light in Tessel.', "She's standing between me and it.");
}

const lampObjects = [
  {
    id: 'lamp5', x: 3, y: 2, w: 2, h: 2, solid: true,
    interact: lampLook,
    use: {
      moonglass_disc: async (g) => {
        if (doorOpen(g)) return g.describe("It's had its drink. Once was plenty.");
        if (!hasTelescope(g)) return g.say('Lighthouse Keeper', "Not near the lamp. Not till I've got my telescope. I mean it.");
        return chargeDisc(g);
      },
      '*': cherylDeclines,
    },
  },
  {
    id: 'lamp_window', x: 1, y: 1, w: 6, solid: true, lookKey: 'lamp_window5',
    interact: (g) => g.describe(WINDOW_LOOKS[stage(g)]),
  },
  {
    // Where the telescope stood under it in Act 2 (6, 5).
    id: 'dust_sheet5', x: 6, y: 5, solid: true,
    look: "The dust sheet the telescope lived under. She's kicked it into a corner.",
  },
].map((o) => ({ use: { '*': cherylDeclines }, ...o }));


function lampPatches(g) {
  if (!started(g)) return [];
  // The dust sheet in a heap where the telescope stood (and nothing above it).
  const out = [['detail', 6, 5, { tile: 'lamproom:sheet_empty', solid: true }], ['overhead', 6, 4, null], ['detail', 6, 4, null]];
  for (let ty = 0; ty < 2; ty++) for (let tx = 0; tx < 2; tx++) out.push(['detail', 3 + tx, 2 + ty, { tile: `lamproom:lamp_x${tx}y${ty}`, solid: true }]);
  return out;
}

export function withLampRoom5(def) {
  const base = withSheets(def);
  return {
    ...base,
    patches: morePatches(base.patches, lampPatches),
    exits: [
      ...(base.exits || []).map(untilAct5),
      { x: 3, y: 7, w: 2, to: 'harbor_risen', at: [27, 4], facing: 'down', when: started },
    ],
    triggers: (base.triggers || []).map(untilAct5),
    entities: [
      ...(base.entities || []).map(untilAct5),
      ...[...lampObjects, keeperNpc].map((e) => ({ ...e, when: both(e.when, started) })),
    ],
    onEnter: async (g) => {
      if (!started(g)) {
        if (after5(g)) act5Loops(g, []);
        return base.onEnter && base.onEnter(g);
      }
      g.setWrongness(WRONGNESS);
      act5Loops(g, ['wind', 'lamp_hum']);
      g.setLoopVolume('wind', 0.4, 0);
    },
  };
}

export const harborScripts = { showTeeth, giveTelescope, keeperTalk, mottTalk };
