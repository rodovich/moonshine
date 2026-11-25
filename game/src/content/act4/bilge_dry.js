// The dry Bilge (32 × 17): the changed-surface reveal. Every canal has run
// dry because Tessel has risen six feet out of the sea (docs/design/04-the-list.md,
// "The Bilge (Act 4 states)", "The reveal").
//
//       01234567890123456789012345678901
//    0  rrrrrrrrrrr..rrrrrrrrrrrrrrrrrrr   north: up to Fountain Square (11-12), declines
//    2  #w##w##w###..###w##w##w##w##w###
//    3  #D##D##D###..###D##D##D##D##D###   the Fishmonger's door (4, 3)
//    4  ................................   NORTH QUAY (y4-6)
//    6  ......................WWWW......   the Water Stairs' top step
//    7  nnnnnnnnnnnnBBnnnnnnnnWWWWnnnnnn   the old quay wall; the stairs continue down
//    8  hhhhhhhhhhhhBBhhhhhhhhbbbbDDhhhh   the exposed hull; bbbb the broken flight; DD the bronze door
//    9  hhhhhhhhhhhhBBhhhhhhhhhhhhDDhhMM
//   10  mmmmmmmmmmmmBBmmmmmmmmmmmm~~~MMM   the mud; the last trickle; the canal mouth
//   11  ssssssssssssBBssssssssssssssssss   the near quay lip
//   12  ................................   SOUTH QUAY (y12-14); east edge → Harbor, declines
//   15  rrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrr

import { composedMap, blankGrid, bump, cherylDeclines } from './common.js';
import { act4Tiles } from './tiles.js';
import { layout, house, pave, lowRoof } from '../act2/common.js';
import { bilgeTopRows } from '../act2/bilge.js';
import { mover, bench_man_glasses } from '../../art/act2_npcs.js';
import { bilge_boats, bilge_piano } from '../../art/act4_surface.js';
import { clockmaker, critters, boatman_mud } from '../../art/act4_sprites.js';
import { fishmonger } from '../../art/act5_sprites.js';
import { sweaty_kid } from '../../art/opening_npcs.js';
import { drawText, drawTextCentered, measure } from '../../engine/text.js';

const W = 32, H = 17;
const notYet = 'Not yet. That door.';
const v = (x) => 'abcdefgh'[x % 8];
const q = (x, y) => `${y % 2 ? 's' : 'n'}${x % 2 ? 'e' : 'w'}`;

function compose(g) {
  const L = layout(W, H, blankGrid);
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) L.set('ground', x, y, pave(x, y));
  // The north quay (rows 0-6) exactly as Act 2's wet Bilge draws it, so the
  // reveal is the same street with the sea gone.
  bilgeTopRows(L);
  // Laundry streaming hard to the east.
  'abcdef'.split('').forEach((c, i) => L.set('overhead', 14 + i, 4, `cloth:over_wind_${c}`));
  // The trench: quay wall, two rows of Founder hull, the mud, the near lip.
  for (let x = 0; x < W; x++) {
    L.set('ground', x, 7, `reveal:qwall_${v(x)}`, true);
    L.set('ground', x, 8, `reveal:hull_n_${v(x)}`, true);
    L.set('ground', x, 9, `reveal:hull_s_${v(x)}`, true);
    L.set('ground', x, 10, `reveal:mud_${v(x)}`, true);
    L.set('ground', x, 11, `reveal:lip_${v(x)}`, true);
  }
  // The bridge spanning the ditch, its piers going down to the mud.
  ['n', 'down', 'n', 'up', 's'].forEach((p, i) => {
    L.set('ground', 12, 7 + i, `canal:bridge_${p}_l`, false);
    L.set('ground', 13, 7 + i, `canal:bridge_${p}_r`, false);
  });
  L.set('ground', 11, 8, 'reveal:hull_n_pier_w', true); L.set('ground', 11, 9, 'reveal:hull_s_pier_w', true); L.set('ground', 11, 10, 'reveal:mud_pier_w', true);
  L.set('ground', 14, 7, 'reveal:qwall_pier_e', true); L.set('ground', 14, 8, 'reveal:hull_n_pier_e', true);
  L.set('ground', 14, 9, 'reveal:hull_s_pier_e', true); L.set('ground', 14, 10, 'reveal:mud_pier_e', true);
  // The Water Stairs, four wide, broken at the foot.
  ['l', 'm', 'm', 'r'].forEach((k, i) => {
    L.set('ground', 22 + i, 6, `reveal:wstairs_top_${k}`, false);
    L.set('ground', 22 + i, 7, `reveal:wstairs_${k}`, false);
    L.set('ground', 22 + i, 8, `reveal:wstairs_broken_${k}`, true);
    L.step[6][22 + i] = L.step[7][22 + i] = 'step_stairs';
  });
  // The bronze door, set in the hull beside the foot of the stairs.
  for (let y = 0; y < 2; y++) for (let x = 0; x < 2; x++) L.set('ground', 26 + x, 8 + y, `reveal_door:bronze_door_x${x}y${y}`, true);
  // The last trickle, and the canal mouth spilling to the Bowl far below.
  'abc'.split('').forEach((c, i) => L.set('ground', 27 + i, 10, `reveal_mouth:trickle_${c}`, true));
  for (let y = 0; y < 2; y++) for (let x = 0; x < 2; x++) L.set('ground', 30 + x, 9 + y, `reveal_mouth:mouth_x${x}y${y}`, true);
  // The south quay, wet where the flood was, with stranded fish; the roofs below.
  for (let y = 12; y <= 14; y++) for (let x = 0; x < W; x++) if (x < 10) L.set('ground', x, y, `bilge_flood:wet_${q(x, y)}`, false);
  for (const [x, y, k] of [[3, 13, 'a'], [18, 12, 'b'], [14, 5, 'a'], [27, 13, 'b']]) L.set('detail', x, y, `bilge_flood:fish_stranded_${k}`);
  for (let y = 15; y < H; y++) for (let x = 0; x < W; x++) L.set('ground', x, y, lowRoof(x, y), true);
  // The west end (structure pass): steps up to the Goat Path, the cliff under them;
  // the Fishmonger's door, which leads back to her cellar; the HARBOR sign at the east end.
  L.set('ground', 0, 12, 'bilge_west:steps_n_dry', false);
  L.set('ground', 0, 13, 'bilge_west:steps_m_dry', false);
  L.set('ground', 0, 14, 'bilge_west:steps_s_dry', false);
  L.set('ground', 0, 15, 'bilge_west:cliff_a', true);
  L.set('ground', 0, 16, 'bilge_west:cliff_b', true);
  L.block(4, 3, false);
  ['harbor_0', 'harbor_1', 'harbor_2'].forEach((f, i) => L.set('detail', 29 + i, 12, `signpost:${f}`, false));
  // Mooring ropes running taut down to the boats.
  for (const x of [4, 9, 20]) L.set('detail', x, 11, 'reveal:rope_taut_v');
  return L.done();
}

// ---------------------------------------------------------------------------
// People and things on the mud and the quays.

const boat = (id, x, frame) => ({ unreachable: 'down on the mud', id, x, y: 10, w: 2, solid: false, shadow: false, sprite: { sheet: bilge_boats, frame }, look: 'Boats, lying on their sides like dogs asleep in the sun.', lookKey: 'boats' });

const people = [
  {
    id: 'fishmonger', name: 'Fishmonger', x: 5, y: 4, facing: 'down',
    sprite: { sheet: fishmonger },
    interact: (g, self) => (bump(g, 'dry.fishmonger') === 0
      ? g.say(self, 'The sea LEFT, Miss! Five hundred years and it finally LEFT me! I always knew it would!')
      : g.say(self, 'Look at my fish. On the ground. Like a common pavement.')),
  },
  {
    // The Man on Bench (glasses on), come down to look at the canal from the bridge.
    id: 'bridge_man', name: 'Man on Bridge', x: 13, y: 9, facing: 'down',
    sprite: { sheet: bench_man_glasses, frame: 'look_down' }, turnToTalk: false,
    interact: (g, self) => (bump(g, 'dry.bridge') === 0
      ? g.say(self, "Spring tide. That's all it is. A very, very low spring tide. It'll be back by teatime.")
      : g.say(self, "It'll be back by teatime.")),
  },
  {
    // Beached at the foot of the broken stairs; his footprint reaches up the broken flight so
    // Cheryl can talk to him from the bottom step (22-23, 7), calling down.
    id: 'boatman', name: 'Boatman', x: 22, y: 8, w: 2, h: 3, facing: 'down', solid: false, shadow: false,
    sprite: { sheet: boatman_mud, frame: 'mud' }, turnToTalk: false, talkPose: 'sing',
    interact: async (g, self) => {
      if (bump(g, 'dry.boatman') === 0) {
        return g.say(self, '♪ The boat is a boat, and the man is a man ♪ ...and the water is somewhere else.', "She's never been out of the water, Miss. Forty years. You can hear her planks drying.");
      }
      return g.say(self, "I'm still in the boat, Miss. I'm still a boatman. Technically. Don't take that from me.");
    },
  },
  boat('boat_a', 3, 'boat_side_a'), boat('boat_b', 8, 'boat_side_b'), boat('boat_c', 19, 'boat_side_c'),
  {
    unreachable: 'down on the mud', id: 'piano', x: 15, y: 10, w: 2, solid: false, shadow: false, sprite: { sheet: bilge_piano, frame: 'piano_mud' },
    look: "The piano, on the mud, lid open. It got to the sea after all. The sea had left.",
  },
  {
    id: 'big_mover', name: 'Big Mover', x: 14, y: 10, facing: 'down', sprite: { sheet: mover, palette: 'big', frame: 'lookup_down' }, turnToTalk: false,
    interact: async (g, self) => {
      await g.say(self, "It's DRY, Miss. We just walked down to it. We jumped, he jumped, we walked.");
      await g.say('Other Mover', 'Hnn.');
      await g.say(self, "He says now it's dry, we don't know how to get it back UP.");
    },
  },
  { unreachable: 'down on the mud', id: 'other_mover', name: 'Other Mover', x: 17, y: 10, facing: 'down', sprite: { sheet: mover, palette: 'other', frame: 'lookup_down' }, turnToTalk: false, talk: 'Hnn.' },
  {
    unreachable: 'down on the mud (he can be talked to as he passes the bridge pier)', id: 'kid', name: 'Sweaty Kid', x: 2, y: 10, facing: 'right',
    sprite: { sheet: sweaty_kid, walk: [1, 2, 3, 4] }, stepTicks: 11,
    // He runs the west reach of the mud, from the far end to the bridge pier.
    behavior: { type: 'patrol', route: [[1, 10], [11, 10]], ghost: true, stopNear: 3, nearPose: 'jog' },
    talkPose: 'jog',
    interact: async (g, self) => {
      if (bump(g, 'dry.kid') === 0) await g.describe('He jumped. I could. Getting back up six feet of slime is another matter.');
      return g.say(self, "It's a ROAD, Miss! I've done eleven laps! There's a CRAB that's faster than me!");
    },
  },
  ...[[6, 10], [21, 10], [28, 10]].map(([x, y], i) => ({
    unreachable: 'down on the mud', id: `crab_${i}`, x, y, solid: false, shadow: false,
    sprite: { sheet: critters, frame: 'crab_walk' },
    behavior: { type: 'patrol', route: [[x, 10], [x + 2, 10]], ghost: true, pause: 1.5 }, stepTicks: 40,
    look: 'A crab. It moves sideways, which is more than the rest of Tessel can manage today.', lookKey: 'crab',
  })),
  {
    id: 'flop', x: 10, y: 5, solid: false, shadow: false, sprite: { sheet: critters, frame: 'fish_flop' },
    look: 'A fish, on the quay. It\'s looking at me. I look away first.',
  },
].map((o) => ({ use: { '*': cherylDeclines }, ...o }));

const objects = [
  {
    id: 'canal', x: 0, y: 7, w: 12, h: 4, lookKey: 'canal',
    looks: [
      ["Six feet down, to mud. The canal walls aren't stone, under the old waterline. They're slate, fitted, like Downstairs.", 'Barnacles, all the way up to a line. The line where the sea used to be. On us.'],
      'Barnacles, all the way up to a line. The line where the sea used to be. On us.',
    ],
  },
  {
    id: 'canal_e', x: 14, y: 7, w: 8, h: 4, lookKey: 'canal',
    looks: [
      ["Six feet down, to mud. The canal walls aren't stone, under the old waterline. They're slate, fitted, like Downstairs.", 'Barnacles, all the way up to a line. The line where the sea used to be. On us.'],
      'Barnacles, all the way up to a line. The line where the sea used to be. On us.',
    ],
  },
  { id: 'mouth', x: 28, y: 7, w: 4, h: 4, look: "The last of the canal, running out to the Bowl. And the Bowl's down there. Lower. Of course it's lower." },
  // On the facade row the lines hang from, not the quay under them: a hotspot on walkable
  // tiles would turn every click along that stretch into a look.
  { id: 'laundry', x: 14, y: 3, w: 6, look: "Every line of washing on the quay is streaming out sideways, hard. The wind's got more of us to push now." },
  // The bronze door and the Water Stairs: looking at either ends the act.
  { id: 'door_view', x: 24, y: 7, w: 4, h: 3, interact: (g) => endOfAct4(g) },
  
].map((o) => ({ solid: false, use: { '*': cherylDeclines }, ...o }));


export const bilgeDryMap = composedMap(compose, {
  id: 'bilge_dry',
  name: 'The Bilge',
  tileset: act4Tiles,
  lighting: 'day',
  ambience: ['wind'],
  step: 'step_stone',
  spawn: [4, 4],
  // Leaving the Bilge ends the act: Cheryl looks back at the bronze door first,
  // and its lines close Act 4 (Act 5 opens these ways properly).
  exits: [
    { x: 11, y: 0, w: 2, run: (g) => lookBackAtDoor(g) },
    { x: 31, y: 12, h: 3, run: (g) => lookBackAtDoor(g) },
    { x: 0, y: 12, h: 3, run: (g) => lookBackAtDoor(g) }, // west, up to the Goat Path
    { x: 4, y: 3, run: (g) => lookBackAtDoor(g) }, // the Fishmonger's door, back to the cellar
  ],
  onEnter: async (g) => {
    if (!g.flag('act4.risen')) return; // the reveal runs it
    g.playMusic('neighborhood_thin');
    g.setWrongness(0.5);
    g.startLoop('runoff'); g.startLoop('crabs');
  },
  entities: [...people, ...objects],
});

// ---------------------------------------------------------------------------
// The reveal (design steps 1–13), from the top of the cellar stair.

export async function revealFromCellar(g) {
  // 1. The door opens into sunlight; hold the glare.
  g.sfx('door_open');
  await g.fade('out', 0.5, 'white_light');
  g.stopMusic(0);
  g.stopLoop('shouting', 0); g.stopLoop('drips', 0);
  await g.wait(1);
  // 2. The Bilge, dry, resolving out of the glare like eyes adjusting.
  await g.changeMap('bilge_dry', 4, 4, 'down', { fade: false });
  g.tint('white_light', 0.6, 0);
  g.tint('white_light', 0, 2.4);
  await g.fade('in', 2, 'white_light');
  // 3–4.
  await g.wait(1.2);
  g.sfx('gull');
  await g.wait(0.5);
  // 5. A slow pan east along the empty canal, then down to the foot of the Water Stairs.
  const slow = 16 / 24; // a tile per 0.4 s
  await g.panCamera(9, 8, slow);
  await g.panCamera(16, 9, slow);
  await g.panCamera(24, 9, slow);
  await g.panCamera(29, 9, slow);
  await g.wait(1.2);
  // 6. Settle on the bronze door.
  await g.panCamera(26, 8, slow);
  await g.wait(1);
  g.sfx('bell_low');
  await g.wait(2.2);
  // 7. The neighborhood theme, thin and strange.
  g.setWrongness(0.5);
  g.playMusic('neighborhood_thin');
  await g.wait(1);
  // 8. Back to Cheryl.
  await g.followPlayer(1.2);
  // 9.
  await g.think('...Ah.');
  // 10. The town's noise comes back.
  g.sfx('town_rush');
  g.startLoop('crowd', { fadeMs: 600 });
  g.faceNpc('fishmonger', 'down');
  await g.say('Fishmonger', "The SEA! The SEA'S GONE OUT!", { auto: 1.2 });
  await g.say('Man on Bridge', "The sea doesn't go OUT, Brenda. It's the SEA.", { auto: 1.2 });
  await g.say('Fishmonger', 'Then where IS it, Albert?', { auto: 1.2 });
  // 11.
  await g.say('Sweaty Kid', "IT'S A ROAD!", { auto: 1.2 });
  g.stopLoop('crowd', 2500);
  // 12.
  await g.think("The sea didn't go anywhere.", 'We came up out of it.', 'I did that.');
  // 13.
  g.setFlag('act4.risen');
  g.startLoop('runoff'); g.startLoop('crabs');
}

// ---------------------------------------------------------------------------
// The end of the act, at the door.

function endCard() {
  let title = null;
  return (ctx) => {
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, 256, 224);
    if (!title) {
      title = document.createElement('canvas');
      title.width = measure('Moonshine') + 2;
      title.height = 11;
      drawText(title.getContext('2d'), 'Moonshine', 0, 0, { color: 'ui_select', shadow: 'ui_cheryl_box' });
    }
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(title, Math.round(128 - title.width), 72, title.width * 2, title.height * 2);
    drawTextCentered(ctx, 'End of Act 4.', 128, 118, { color: 'ui_text' });
    drawTextCentered(ctx, 'Tessel continues soon.', 128, 132, { color: 'ui_text' });
  };
}

// Act 5 sets this to a script that carries on instead of the end card.
export const act4End = { next: null };

// On the way out, she can't leave without looking at the door properly.
async function lookBackAtDoor(g) {
  await g.describe('Before I go anywhere: that door.');
  await g.panCamera(26, 8, 2);
  await g.wait(0.6);
  await endOfAct4(g);
}

export async function endOfAct4(g) {
  if (g.flag('act4.done') && act4End.next) return act4End.next(g);
  await g.describe('At the bottom of the Water Stairs, where the sea used to be: a door.', 'Bronze, barnacled, as big as a cart. A glass eye in the middle.', 'The last flight of stairs is broken. Of course it is.');
  await g.describe('A door at the bottom of the sea. Well. The bottom of the canal.', 'Same thing, this week.');
  g.setFlag('act4.done');
  await g.followPlayer(3); // back from the door, if the camera went to look at it
  if (act4End.next) return act4End.next(g);
  g.stopMusic(1500);
  await g.fade('out', 1.5);
  g.place('player', 24, 6, 'down');
  await g.showPicture(endCard(), { fade: 0 });
  await g.fade('in', 1);
  await g.wait(4);
  await g.fade('out', 1);
  await g.toTitle();
}

