// The Crown (24 × 16): the summit plaza. The Bell Tower (x2–7), the
// Clockmaker's shop (x9–13), the Blue Dome (x15–22), the sundial, and the
// south parapet over all of Tessel. From docs/design/02-city.md.
//
//      x 0         1         2
//        012345678901234567890123
//  y  0  ~~TTTTTT~~~~~~~DDDDDDDD~   T the Bell Tower (6×7); D the Blue Dome (8×3)
//     3  ~~TTTTTT~RRRRR~DDDDDDDD~   R the Clockmaker's roof
//     6  ####dd#####d######dd####   tower door (4-5); shop door (11); Dome door (18-19)
//     9  ...........SS...........   S the sundial (11-12, 9-10)
//    14  ===========^^===========   the south parapet; stair down at x11-12

import { composedMap, blankGrid } from '../opening/grid.js';
import { act2Tiles } from './tiles.js';
import { layout, house, pave, LOOKS, bump, firstMeet, cherylDeclines } from './common.js';
import { props } from '../../art/props.js';

const W = 24, H = 16;

function compose(g) {
  const L = layout(W, H, blankGrid);
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) L.set('ground', x, y, pave(x, y));

  // The sky behind the summit: distant roofs and eaves, all solid.
  const backdrop = ['backdrop_eave', 'backdrop_house', 'backdrop_house_window', 'backdrop_eave'];
  for (let y = 0; y < 4; y++) for (let x = 0; x < W; x++) L.set('ground', x, y, `roof:${backdrop[(x + y) % 4]}`, true);

  // The Bell Tower (its art is 6×7: belfry, clock, and an older stone base with the door).
  for (let y = 0; y < 7; y++) for (let x = 0; x < 6; x++) L.set('ground', 2 + x, y, `bell_tower:bell_tower_x${x}y${y}`, true);
  // A small house on either side of the tower, to close the plaza's north edge.
  house(L, 0, 3, { roofRows: 2, top: '##', base: '#w', palette: 'ochre' });
  house(L, 8, 3, { roofRows: 2, top: '#', base: '#' });
  // The Clockmaker's shop (x9–13): a painted clock over a window full of clocks, the door at x12, the hanging sign.
  house(L, 9, 2, { roofRows: 2, mid: '#w#w#', top: '###D#', base: '###D#', palette: 'ochre' });
  L.set('ground', 12, 5, 'buildings:door_top@ochre', true); L.set('ground', 12, 6, 'buildings:door_bot@ochre', true);
  L.set('ground', 10, 5, 'school:clockshop_fascia_l@ochre', true); L.set('ground', 11, 5, 'school:clockshop_fascia_r@ochre', true);
  L.set('ground', 10, 6, 'school:clockshop_window_l@ochre', true); L.set('ground', 11, 6, 'school:clockshop_window_r@ochre', true);
  L.set('detail', 13, 5, 'act2_props:clock_sign');
  house(L, 14, 3, { roofRows: 2, top: '#', base: '#' });
  // The Blue Dome: dome and drum (rows 0–2), a plastered front (rows 3–6), its door at x18–19.
  for (let y = 0; y < 3; y++) for (let x = 0; x < 8; x++) L.set('ground', 15 + x, y, `blue_dome:blue_dome_x${x}y${y}`, true);
  const front = [
    ['wall_l', 'window', 'wall', 'window', 'window', 'wall', 'window', 'wall_r'],
    ['wall_l', 'wall', 'window', 'wall', 'wall', 'window', 'wall', 'wall_r'],
    ['wall_l', 'window', 'wall', null, null, 'wall', 'window', 'wall_r'],
    ['wall_base_l', 'wall_base', 'window_base', null, null, 'window_base', 'wall_base', 'wall_base_r'],
  ];
  front.forEach((row, y) => row.forEach((f, i) => { if (f) L.set('ground', 15 + i, 3 + y, `buildings:${f}`, true); }));
  for (let y = 0; y < 2; y++) for (let x = 0; x < 2; x++) L.set('ground', 18 + x, 5 + y, `blue_dome:dome_door_x${x}y${y}`, true);
  L.block(18, 6, false); L.block(19, 6, false); // the door is the way in
  house(L, 23, 3, { roofRows: 2, top: '#', base: '#', palette: 'rose' });

  // The sundial.
  for (let y = 0; y < 2; y++) for (let x = 0; x < 2; x++) L.set('detail', 11 + x, 9 + y, `sundial:sundial_x${x}y${y}`, true);

  // The south parapet, with the stair cut through it at x11–12, and the terrace face below.
  for (let x = 0; x < W; x++) {
    L.set('detail', x, 14, 'crown_parapet:parapet', true);
    L.set('ground', x, 15, 'street:retain', true);
  }
  L.set('detail', 10, 14, 'crown_parapet:parapet_end_l', true);
  L.set('detail', 13, 14, 'crown_parapet:parapet_end_r', true);
  for (const y of [14, 15]) {
    L.set('detail', 11, y, null); L.set('detail', 12, y, null);
    L.set('ground', 11, y, 'street:stairs_l', false);
    L.set('ground', 12, y, 'street:stairs_r', false);
    L.step[y][11] = L.step[y][12] = 'step_stairs';
  }

  // Props.
  L.lamp(8, 8); L.lamp(15, 8);
  L.bench(2, 11); L.bench(20, 11);
  for (const [x, y] of [[1, 7], [22, 7], [1, 13], [22, 13]]) L.pot(x, y);
  return L.done();
}

// ---------------------------------------------------------------------------
// Objects

// The Clockmaker, heard through the belfry: lines at the top of the screen.
const clockmaker = (g, line) => g.say('Clockmaker', line, { position: 'top' });

async function towerDoor(g) {
  const n = bump(g, 'tower.door');
  if (n === 0) {
    await g.describe('Bolted from inside. There\'s a card in the keyhole: CLOCK IN PROGRESS. NO ADMITTANCE.');
    g.sfx('knock');
    await g.wait(0.8);
    await clockmaker(g, "Go away! I'm calibrating!");
    await clockmaker(g, '...I know that knock. Is that Miss? Go away, Miss! Respectfully!');
    return;
  }
  g.sfx('knock');
  await g.wait(0.6);
  if (n % 2 === 1) return clockmaker(g, 'Eleven minutes! The sun is ELEVEN MINUTES WRONG! I\'ve written to the observatory!');
  return clockmaker(g, "Is it time yet? No. Don't answer that. I KNOW what time it is.");
}

const objects = [
  { id: 'tower_door', x: 4, y: 4, w: 2, h: 3, interact: towerDoor },
  // The tower's clock face and its flanks (so it can be looked at from the plaza by keyboard).
  ...[[4, 0, 2, 4], [2, 0, 2, 7], [6, 0, 2, 7]].map(([x, y, w, h]) => ({
    id: `clock_${x}`, x, y, w, h, lookKey: 'clock',
    looks: [
      ['The Mayor\'s clock. The plaque says TESSEL ENTERS THE MODERN AGE.', "It's eleven minutes ahead of the sundial and very pleased about it."],
      "It rings the hours loud enough to rattle the plaza. Ambrose says it rings like a cow. I don't know what that means. I agree with it.",
    ],
  })),
  {
    id: 'sundial', x: 11, y: 9, w: 2, h: 2,
    looks: [
      ['The sundial and the clock disagree by eleven minutes.', "The sundial has been here five hundred years. The clock arrived last month. I know which one I'd ask for directions."],
      "The sundial has been here five hundred years. The clock arrived last month. I know which one I'd ask for directions.",
    ],
  },
  {
    id: 'shop_door', x: 12, y: 5, h: 2,
    looks: [
      "The Clockmaker's shop. A sign: AT THE BELFRY. CLOCK IS PERFECT. DO NOT ASK.",
      "He was the boy who asked 'is it time yet?' every four minutes. Now it's his job.",
    ],
  },
  ...[[15, 0, 3, 7], [18, 0, 2, 5], [20, 0, 3, 7]].map(([x, y, w, h]) => ({
    id: `dome_${x}`, x, y, w, h, lookKey: 'dome',
    look: "The Blue Dome. The Archive's inside it, and Ottilie is inside the Archive, and that's where she'll stay.",
  })),
  ...[[0, 10], [13, 10]].map(([x, w]) => ({
    id: `parapet_${x}`, x, y: 14, w: x === 0 ? 11 : 11, lookKey: 'parapet',
    looks: [
      ['From the Crown you can see the whole Bowl. The Gate looks perfectly ordinary.', "That's the worst part."],
      'The whole Bowl, calm as a plate. On the far side, the Teeth, white with surf.',
    ],
  })),
  ...[2, 20].map((x) => ({ id: `bench_${x}`, x, y: 11, w: 2, lookKey: 'benches', look: 'A bench with the best view in Tessel, and a cat who knows it.' })),
  ...[[1, 7], [22, 7], [1, 13], [22, 13]].map(([x, y]) => ({ id: `pot_${x}_${y}`, x, y, lookKey: 'geraniums', look: 'Geraniums. Nobody remembers planting them.' })),
].map((o) => ({ solid: false, use: { '*': cherylDeclines }, ...o }));

// Crowbar on the tower door: no.
objects[0].use = { crowbar: (g) => g.describe("It's bolted, not stuck. And he's in there. And I was raised properly."), '*': cherylDeclines };

// ---------------------------------------------------------------------------
// Characters

const ambrose = {
  id: 'ambrose', name: 'Ambrose', x: 6, y: 7, facing: 'down',
  sprite: LOOKS.ambrose, // on the tower step with his ledger; looks up at the clock and scowls
  turnToTalk: false,
  interact: async (g, self) => {
    if (firstMeet(g, 'ambrose')) {
      await g.describe('Ambrose Tull. He rang that bell for fifty-two years. Now he sits under it, like a dog outside a shop.');
      return g.say(self,
        'CHERYL. YOU SAW IT. THE MOON. YOU SAW WHERE IT CAME UP.',
        "FIVE WEEKS THAT CLOCK'S BEEN RINGING MY BELL. ON THE HOUR. LIKE A COW.",
        "A BELL ISN'T FOR HOURS. A BELL IS FOR THE TURN OF THE TIDE. TULLS HAVE RUNG AT THE TURN FOR THREE HUNDRED YEARS.",
        "CLOCKS DON'T KNOW THE SEA. THE SEA DOESN'T KNOW CLOCKS. ONE OF THEM IS IN CHARGE, AND IT ISN'T THE CLOCK.");
    }
    const lines = [
      'I STILL KEEP THE LEDGER. EVERY TURN, TWICE A DAY. NOBODY ASKS.',
      "WHAT? I'M NOT SHOUTING. THIS IS HOW I TALK. THE BELL DID IT.",
      "THEY GAVE ME A PLAQUE. A PLAQUE DOESN'T KNOW THE SEA EITHER.",
    ];
    return g.say(self, lines[bump(g, 'ambrose.repeat') % lines.length]);
  },
  use: {
    moon_chart: (g, self) => g.say(self, 'OUTSIDE THE GATE. HM. THE SEA KNEW FIRST. THE SEA ALWAYS KNOWS FIRST.'),
    guidebook: (g, self) => g.say(self, '"BELL RUNG AT RANDOM BY A LOCAL ECCENTRIC." RANDOM! I\'LL GIVE THEM ECCENTRIC.'),
    '*': (g, self) => g.say(self, "I DON'T WANT THAT. I WANT MY BELL."),
  },
};

const cat = {
  id: 'cat', x: 3, y: 11, solid: false,
  sprite: { sheet: props, frame: 'cat_sleep' },
  look: 'A bench with the best view in Tessel, and a cat who knows it.',
  lookKey: 'benches',
};

// ---------------------------------------------------------------------------

export const crownMap = composedMap(compose, {
  id: 'crown',
  name: 'The Crown',
  tileset: act2Tiles,
  music: 'neighborhood',
  lighting: 'day',
  ambience: ['clock_tick'],
  step: 'step_stone',
  spawn: [11, 12],
  exits: [
    { x: 11, y: 15, w: 2, to: 'lamp_street', at: [22, 5], facing: 'down' },
    { x: 18, y: 6, w: 2, to: 'archive', at: [7, 12], facing: 'up' },
  ],
  entities: [...objects, ambrose, cat],
});
