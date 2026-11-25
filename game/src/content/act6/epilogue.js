// The epilogue (docs/design/06-moon-in-the-bowl.md, "The epilogue", "The
// piano"): a free walk through the town in its morning state. Everyone has a
// line about last night, and every one of them is wrong.
//
// Each export here is a function from another act's map to the states Act 6
// adds to it (see extend.js); src/content/act6/index.js applies them. While
// `epilogue` holds, each map's own residents are hidden and recast here with
// their epilogue lines (same place, same look, new id prefixed epi_).

import { epilogue, bump, cherylDeclines, getItem } from './common.js';
import { old_man_seated, neighbor, sweaty_kid } from '../../art/opening_npcs.js';
import { props } from '../../art/props.js';
import { LOOKS } from '../act2/common.js';
import { clockmaker } from '../../art/act4_sprites.js';
import { crowd_a, crowd_b, keeper } from '../../art/act5_sprites.js';
import { piano_delivered, luggage, well_lift, bunting, step_barrier } from '../../art/act6_surface.js';
import { counting_rosette, runner, kid_finish, tourist_case, pelletier_m, pelletier_f } from '../../art/act6_sprites.js';
import { finalScene } from './ending.js';

const said = (speaker) => (lines) => async (g, self) => g.say(self, ...[].concat(lines));

// A base entity, copied under a new id for the epilogue, with new lines.
function recast(map, id, over) {
  const base = (map.entities || []).find((e) => e.id === id);
  if (!base) return null;
  const { when, interact, talks, talk, look, looks, bark, use, decline, ...rest } = base;
  return { ...rest, id: `epi_${id}`, when: epilogue, use: { '*': cherylDeclines }, ...over };
}

// NPC lines that change with each talk: the first entries in order, then the
// last ones in turn.
function lines(name, first, repeat) {
  return async (g, self) => {
    const n = bump(g, `epi.${name}`);
    const l = n < first.length ? first[n] : repeat[(n - first.length) % repeat.length];
    return g.say(self, ...[].concat(l));
  };
}

const npcDecline = (line) => ({ '*': (g, self) => g.say(self, line) });

// ---------------------------------------------------------------------------
// Cistern Court: the dawn, the piano, and the door home.

export function courtEpilogue(map) {
  const oldMan = {
    id: 'epi_old_man', name: 'Old Man', x: 2, y: 16, facing: 'right',
    sprite: { sheet: old_man_seated, frame: 'think_right_0' },
    talkPose: 'talk_right', turnToTalk: false, when: epilogue,
    interact: async (g, self) => {
      if (g.flag('epi.piano')) {
        return g.say(self, bump(g, 'epi.oldMan.p') % 2 ? 'Gerald and I have agreed to a draw. Seventeen years. It seemed about time.' : "Play it when you're ready. Gerald's in no hurry. Gerald's never been in a hurry.");
      }
      return g.say(self, bump(g, 'epi.oldMan') % 2 ? 'Morning.' : 'Gerald and I have agreed to a draw. Seventeen years. It seemed about time.');
    },
    use: npcDecline("Not now. Gerald's deciding whether a draw counts as a win."),
  };
  const neighborEpi = {
    id: 'epi_neighbor', name: 'Neighbor', x: 14, y: 3, facing: 'up', sprite: { sheet: neighbor }, when: epilogue,
    interact: lines('neighbor', [
      ["Whitest sheets of my life. The moon was straight on last night. I don't know where it had been."],
    ], ["Mother's recipe. Vinegar and something. And a straight moon. That's the secret."]),
    use: npcDecline("I've no use for that. I've got everything I need. Look at them."),
  };
  const cat = {
    id: 'epi_cat', x: 16, y: 12, solid: false, sprite: { sheet: props, frame: 'cat' }, when: epilogue,
    look: "Back on the bench, in the sun. There's no uphill side any more.",
  };
  const well = {
    id: 'epi_well', x: 9, y: 16, w: 2, h: 2, when: epilogue, use: { '*': cherylDeclines },
    look: 'The well. Quiet again. Not breathing. Just a well, as far as anyone knows.',
  };
  const tub = {
    id: 'epi_tub', x: 3, y: 4, w: 2, when: epilogue,
    interact: async (g) => {
      if (g.hasItem('new_plug')) return g.describe("A new plug. It'll do. Next year.");
      if (bump(g, 'epi.tub') === 0) return g.describe('My tub. No plug. Of course.', 'It can wait till next year.');
      return g.describe('It can wait till next year.');
    },
    use: {
      new_plug: (g) => g.describe('Next year. On Moonshine Night. With the moon in the Gate.'),
      '*': cherylDeclines,
    },
  };
  const piano = {
    id: 'epi_piano', x: 4, y: 12, w: 2, kind: 'object',
    sprite: { sheet: piano_delivered, frame: 'piano_delivered' },
    when: (g) => epilogue(g) && !!g.flag('epi.leftCourt'),
    interact: async (g) => {
      if (bump(g, 'epi.pianoLook') === 0) {
        g.sfx('piano_flat');
        await g.wait(0.6);
        return g.describe('Middle C. Flat, after the week it\'s had.', "I'll tune it.");
      }
      return g.describe("Later. I'll play later.");
    },
    use: { '*': cherylDeclines },
  };
  const movers = [
    { ...LOOKS.big_mover, id: 'epi_big_mover', name: 'Big Mover', x: 7, y: 13 },
    { ...LOOKS.other_mover, id: 'epi_other_mover', name: 'Other Mover', x: 6, y: 12 },
  ].map(({ sheet, palette, ...m }) => ({
    ...m, facing: 'down', sprite: { sheet, palette }, when: (g) => epilogue(g) && !!g.flag('epi.leftCourt') && !g.flag('epi.piano'),
    interact: said('Delivered.'),
  }));

  return {
    sheets: { well_lift },
    hide: [{ when: epilogue, ids: ['old_man', 'neighbor_morning', 'cat_morning', 'tub', 'well', 'kid_morning'] }],
    entities: [oldMan, neighborEpi, cat, well, tub, piano, ...movers],
    exits: [
      // The door home: not yet; then (after the piano) the final scene; after the game, as usual.
      {
        x: 3, y: 11, when: (g) => epilogue(g) && !g.flag('act6.done'),
        run: async (g) => {
          if (!g.flag('epi.piano')) {
            await g.describe('Not yet. I want to see the town first.');
            return g.movePlayer([3, 12]);
          }
          g.sfx('door');
          await g.changeMap('flat', 5, 7, 'up');
          return finalScene(g);
        },
      },
      // Leaving the court for the first time in the epilogue: the piano arrives while she's away.
      {
        x: 15, y: 25, w: 2, when: (g) => epilogue(g),
        run: async (g) => {
          g.setFlag('epi.leftCourt');
          return g.changeMap('lamp_street', 3 + g.player.x - 15, 1, 'down');
        },
      },
    ],
    patches: (g) => {
      const s = g.flag('fx.wellGrate');
      if (s == null) return [];
      const out = [];
      for (let y = 0; y < 2; y++) for (let x = 0; x < 2; x++) out.push(['detail', 9 + x, 16 + y, `well_lift:well_lift_x${x}y${y}_${s}`]);
      return out;
    },
    // Pale pink and gold at dawn, until she first leaves the court; plain morning after.
    lighting: (g) => (epilogue(g) ? (g.flag('epi.leftCourt') || g.flag('act6.done') ? 'day' : 'dawn') : undefined),
    quiet: epilogue,
    onEnter: async (g, base) => {
      if (!epilogue(g)) return base(g);
      if (g.flag('fx.dawn') === 'scene') return; // the dawn script stages itself
      g.playMusic('neighborhood');
      if (!g.flag('epi.leftCourt')) g.startLoop('dawn_birds', { fadeMs: 1500 });
      if (g.flag('epi.leftCourt') && !g.flag('epi.piano')) await pianoScene(g);
    },
  };
}

// The piano, delivered at last (on coming back to the court after leaving it).
export async function pianoScene(g) {
  await g.wait(0.4);
  await g.panCamera(8, 14, 2);
  await g.wait(0.4);
  // Cheryl comes over.
  const pan = g.followPlayer(2);
  await g.movePlayer([7, 14]);
  await pan;
  g.facePlayer('left');
  g.faceNpc('epi_big_mover', 'player');
  await g.say('epi_big_mover', 'No. 9, Cistern Court. Delivered. FINALLY. Sign here, Miss.');
  g.faceNpc('epi_other_mover', 'player');
  await g.say('epi_other_mover', 'Hnn.');
  await g.say('epi_big_mover', 'He says it came by boat. It did. Don\'t ask.');
  // They leave down the Squeeze.
  const a = g.moveNpc('epi_big_mover', [15, 24]).then(() => g.moveNpc('epi_big_mover', 'd', { ghost: true })).then(() => g.hide('epi_big_mover'));
  await g.wait(0.5);
  await g.moveNpc('epi_other_mover', [16, 24]).then(() => g.moveNpc('epi_other_mover', 'd', { ghost: true })).then(() => g.hide('epi_other_mover'));
  await a;
  // The Old Man, at his chess, without looking up.
  g.facePlayer('down');
  await g.wait(0.6);
  await g.say('epi_old_man', "It's from Gerald.");
  await g.say('epi_old_man', 'Gerald heard you play once. Through the wall. Years ago.');
  await g.say('epi_old_man', 'Gerald thought you should have it.');
  await g.describe("Gerald has very good manners for a man who doesn't exist.");
  g.setFlag('epi.piano');
}

// ---------------------------------------------------------------------------
// Lamp Street

export function lampStreetEpilogue(map) {
  const chant = '♪ Moon in the Gate and moon in the bowl, Tessel\'s asleep and Tessel is whole! ♪';
  const girls = ['girl_1', 'girl_2', 'girl_3'].map((id) => recast(map, id, {
    interact: id === 'girl_3'
      ? lines('girl3', [], ["Miss! Tessel's WHOLE! It's in the song! ...What's a bowl got to do with it?"])
      : async (g) => g.say('Skipping Girls', chant),
    use: npcDecline("We're SKIPPING, Miss."),
    ...(id === 'girl_2' ? { bark: { lines: [chant], speaker: 'Skipping Girls', range: 4, every: [5, 8] } } : {}),
  }));
  return {
    hide: [{ when: epilogue, ids: ['girl_1', 'girl_2', 'girl_3', 'bench_man', 'watering_woman'] }],
    entities: [
      ...girls,
      recast(map, 'bench_man', {
        interact: lines('benchMan', [], ['Says here it was a "seiche." A wave that goes back and forth in a bay. I said seiche. Didn\'t I say seiche?']),
        use: npcDecline("I've got my paper, thank you."),
      }),
      recast(map, 'watering_woman', {
        interact: lines('wateringWoman', [], ["My husband says it was the clock going. Everything's the clock with him. This time, I believe him."]),
        use: npcDecline("I've got my hands full, love."),
      }),
    ].filter(Boolean),
  };
}

// ---------------------------------------------------------------------------
// The Crown

export function crownEpilogue(map) {
  return {
    hide: [{ when: epilogue, ids: ['ambrose'] }],
    entities: [
      recast(map, 'ambrose', {
        interact: lines('ambrose', ['RANG AT THE TURN. ALL WELL.'], ["THE CLOCK'S GONE. THE MAYOR SAYS IT'S \"UNDER REVIEW.\" I SAY IT'S UNDER MY BED.", 'RANG AT THE TURN. ALL WELL.']),
        use: npcDecline("I DON'T WANT THAT. I'VE GOT MY BELL."),
      }),
      {
        id: 'epi_clockmaker', name: 'Clockmaker', x: 13, y: 10, facing: 'left', when: epilogue,
        sprite: { sheet: clockmaker }, behavior: { type: 'face', range: 3 },
        interact: lines('clockmaker', ["The sun's come round, Miss! Eleven minutes, then twelve, then thirteen, and now NOTHING. It apologized."],
          ["I'm going to write to the observatory. To say sorry. No. To say I was right."]),
        use: npcDecline('Not now, Miss. I\'m watching the shadow. It\'s EXACTLY where it should be.'),
      },
    ].filter(Boolean),
    onEnter: async (g, base) => {
      await base(g);
      if (epilogue(g)) g.stopLoop('clock_tick', 0); // the Mayor's clock is gone
    },
  };
}

// ---------------------------------------------------------------------------
// The Archive and the crypt

export function archiveEpilogue(map) {
  return {
    hide: [{ when: epilogue, ids: ['ottilie'] }],
    entities: [
      recast(map, 'ottilie', {
        interact: async (g, self) => {
          if (!g.flag('epi.ottilie')) {
            g.setFlag('epi.ottilie');
            return g.say(self,
              'Cheryl! The bowl on your rubbing! The glyph over it! I\'ve read it! "Where the moon shines in."',
              'MOONSHINE, Cheryl. The Founders\' great cellar, the canals, the fish, all of it. They were BOOTLEGGERS.',
              'Monograph four. "Moonshine: The Founders as Distillers." It all fits. It all finally fits.');
          }
          return g.say(self, "Bootleggers. The most organized bootleggers in history. I'm so proud of them.");
        },
        use: npcDecline('Later, Cheryl. I\'m on chapter one.'),
      }),
    ].filter(Boolean),
  };
}

export function cryptEpilogue(map) {
  return {
    hide: [{ when: epilogue, ids: ['founders_door'] }],
    entities: [recast(map, 'founders_door', { look: "Open. Ottilie's put a little sign on it: DOOR (OPEN). FURTHER STUDY NEEDED." })].filter(Boolean),
  };
}

// ---------------------------------------------------------------------------
// Fountain Square and the Shop

export function squareEpilogue(map) {
  return {
    hide: [{ when: epilogue, ids: ['mayor', 'tourist', 'counting_woman_square', 'big_mover', 'other_mover', 'piano', 'fountain'] }],
    entities: [
      recast(map, 'mayor', {
        interact: lines('mayor', ['Citizens! Last night, my clock steadied the city. The clock has since been removed. Its legacy remains!'],
          ["Dry Canal Day will be held again. When the canals are dry. Which they won't be. Tessel: Forward!"]),
        use: npcDecline("Not now, Cheryl. I'm addressing the citizens."),
      }),
      {
        id: 'epi_tourist', name: 'Stranded Tourist', x: 18, y: 14, facing: 'down', when: epilogue,
        sprite: { sheet: tourist_case }, behavior: { type: 'face', range: 3 },
        interact: lines('tourist', ["The ferry's in! It found us! I'm going home. I'm never coming back."],
          ["...I'll come back next year. For Moonshine Night. Keep the guidebook. I'm keeping your hat."]),
        use: npcDecline("I'm all packed, thank you."),
      },
      { id: 'epi_luggage', x: 19, y: 15, sprite: { sheet: luggage, frame: 'luggage' }, when: epilogue, look: 'Her luggage. More of it than she came with. Tessel does that.' },
      recast(map, 'fountain', { look: 'Flowing, as it has for five hundred years, apart from a week nobody will mention.' }),
    ].filter(Boolean),
  };
}

export function shopEpilogue(map) {
  return {
    hide: [{ when: epilogue, ids: ['shopkeeper', 'hat_display'] }],
    entities: [
      recast(map, 'shopkeeper', {
        interact: async (g, self) => {
          if (!g.flag('got.newPlug')) {
            await g.say(self, "Miss! The Old Man says you've lost your plug. I've got one. Display stock.");
            await g.say(self, '...Oh, take it. Take it. My first sale in thirty years. Well, my first gift. I feel wonderful.');
            g.setFlag('got.newPlug');
            await getItem(g, 'new_plug');
            return g.describe("A new plug. Brass, with a little chain. It isn't the same. It'll do.");
          }
          return g.say(self, "Two transactions in one week. I'll have to have a lie down.");
        },
        use: npcDecline("No, no. You keep it. I'm a giver now."),
      }),
      recast(map, 'hat_display', { look: 'The guidebook, in pride of place, open at the Hundred Steps.' }),
    ].filter(Boolean),
  };
}

// ---------------------------------------------------------------------------
// The Hundred Steps: the Stair Race

// Landing 2 is rows 16-18, the hundredth step (9-10, 19), flight 3 (x9-10, rows 20-25),
// landing 3 rows 26-28, flight 4 (x4-5, rows 29-37). The race comes up flight 4 and
// flight 3; the finish is the hundredth step's flight, so the tape is across flight 3.
const STEPS = {
  counter: [7, 18],   // the Counting Woman, by the open hundredth step
  basin: [7, 16],     // the Woman with Basin on her doorstep
  kid: [[9, 26], [9, 21]],                       // the Kid: start (top of landing 3) and over the finish line
  runners: [[[4, 32], [8, 27]], [[5, 35], [12, 28]]], // start on flight 4; where they stop, on landing 3
  tape: [9, 21],      // the finish tape across flight 3, below the barrier
  crowd: [[3, 17, crowd_a, 'cheer_down'], [12, 17, crowd_b, 'cheer_down'], [6, 26, crowd_b, 'point_down'], [13, 26, crowd_a, 'cheer_down']],
};

export function stepsEpilogue(map) {
  const raced = (g) => !!g.flag('epi.race');
  const before = (g) => epilogue(g) && !raced(g);
  const after = (g) => epilogue(g) && raced(g);
  const counter = {
    id: 'epi_counting_woman', name: 'Counting Woman', x: STEPS.counter[0], y: STEPS.counter[1], facing: 'down', when: epilogue,
    sprite: { sheet: counting_rosette }, behavior: { type: 'face', range: 3 },
    interact: lines('counter', [], ['Official counter of the Stair Race, Cheryl. The Mayor gave me a ribbon. A hundred. Every time.']),
    use: npcDecline("I'm counting. Don't make me lose my place."),
  };
  // Before the race, and after it (where it left them): separate entities, so a reload puts them right.
  const kidTalk = {
    name: 'Sweaty Kid',
    interact: lines('kid', [], ['Miss! You can have your egg back. No. Wait. Can I keep it? It\'s lucky.']),
    use: npcDecline("Can't carry it! I'm the CHAMPION!"),
  };
  const kid = [
    { ...kidTalk, id: 'epi_kid_start', x: STEPS.kid[0][0], y: STEPS.kid[0][1], facing: 'up', when: before, sprite: { sheet: sweaty_kid, walk: [1, 2, 3, 4] } },
    { ...kidTalk, id: 'epi_kid', x: STEPS.kid[1][0], y: STEPS.kid[1][1], facing: 'down', when: after, sprite: { sheet: kid_finish, frame: 'finish_down' } },
  ];
  const runners = STEPS.runners.flatMap(([start, end], i) => {
    const palette = i ? 'b' : undefined;
    const talk = { name: 'Runner', interact: said(i ? 'Next year. NEXT year.' : 'He had an EGG. How do you beat an egg?') };
    return [
      { ...talk, id: `epi_runner_${i}_start`, x: start[0], y: start[1], facing: 'up', when: before, sprite: { sheet: runner, palette, walk: [1, 2, 3, 4] } },
      { ...talk, id: `epi_runner_${i}`, x: end[0], y: end[1], facing: 'up', when: after, sprite: { sheet: runner, palette, frame: 'arms_up' } },
    ];
  });
  const crowd = STEPS.crowd.map(([x, y, sheet, frame], i) => ({
    id: `epi_crowd_${i}`, name: 'Crowd', x, y, facing: 'down', when: epilogue, sprite: { sheet, frame },
    interact: said(['Did you see him go?', 'The egg won! Well, the boy did.', 'A hundred steps! I counted them myself. Well, she did.', 'Again next year!'][i]),
  }));
  const basin = recast(map, 'basin_woman', {
    x: STEPS.basin[0], y: STEPS.basin[1],
    interact: async (g, self) => {
      await g.say(self, "Into the hole, for luck. It's lucky now. I've decided.");
      g.setSprite(self, LOOKS.basin_tip);
      g.sfx('sink_gurgle');
      await g.wait(1.2);
      g.setSprite(self, LOOKS.basin_woman);
    },
    use: npcDecline("I've got my basin, love."),
  });
  return {
    sheets: { bunting, step_barrier },
    hide: [{ when: epilogue, ids: ['counting_woman', 'basin_woman', 'kid', 'kid_after'] }],
    entities: [counter, ...kid, ...runners, ...crowd, basin].filter(Boolean),
    // Bunting over landing 2; the finish tape across flight 3; the rope barrier round the open step.
    patches: (g) => {
      if (!epilogue(g)) return [];
      const out = [];
      'abcd'.split('').forEach((s, i) => out.push(['overhead', 4 + i, 16, `bunting:over_bunting_${s}`]));
      const broken = g.flag('epi.race') || g.flag('fx.tape') ? 'finish_broken' : 'finish_tape';
      out.push(['detail', STEPS.tape[0], STEPS.tape[1], `bunting:${broken}_l`], ['detail', STEPS.tape[0] + 1, STEPS.tape[1], `bunting:${broken}_r`]);
      for (let y = 0; y < 3; y++) for (let x = 0; x < 4; x++) {
        if ((x === 1 || x === 2) && y === 1) continue; // the hole itself
        out.push(['detail', 8 + x, 18 + y, `step_barrier:step_barrier_x${x}y${y}`]);
      }
      return out;
    },
    // The open step doesn't ask "Go down?" any more: she steps round the rope.
    triggers: [{ x: 9, y: 19, w: 2, when: epilogue, stop: false, run: async () => {} }],
    onEnter: async (g, base) => {
      if (!epilogue(g)) return base(g);
      await base(g);
      if (!raced(g)) await stairRace(g);
    },
  };
}

export async function stairRace(g) {
  // 1-2. The crowd; the Counting Woman counting; the Kid pounds up the Steps, far ahead of two runners.
  g.startLoop('crowd', { fadeMs: 800 });
  const kid = 'epi_kid_start';
  await g.panCamera(9, 23, 4);
  await g.wait(0.3);
  g.sfx('race_feet');
  g.say('epi_counting_woman', 'Ninety-six! Ninety-seven!', { auto: 0.9 });
  const r = STEPS.runners.map(([, end], i) => g.moveNpc(`epi_runner_${i}_start`, end, { speed: 11 }));
  await g.moveNpc(kid, 'u u u', { speed: 9 });
  g.say('epi_counting_woman', 'Ninety-eight!', { auto: 0.6 });
  await g.moveNpc(kid, 'u', { speed: 9 });
  g.say('epi_counting_woman', 'Ninety-nine!', { auto: 0.6 });
  await g.moveNpc(kid, 'u', { speed: 9 });
  // 3. He breaks the tape.
  g.setFlag('fx.tape', true);
  g.sfx('crowd_cheer');
  g.faceNpc(kid, 'down');
  await g.say('epi_counting_woman', 'ONE HUNDRED!');
  // 4. The egg timer, held up. It dings.
  g.setSprite(kid, { sheet: kid_finish, frame: 'finish_down' });
  g.sfx('timer_ding');
  await g.say(kid, 'I WON! I beat everyone AND the egg!');
  await Promise.all(r);
  await g.wait(0.6);
  g.setFlag('epi.race');
  g.setFlag('fx.tape', null);
  g.stopLoop('crowd', 2000);
  // 5. Control returns.
  await g.followPlayer(4);
}

// ---------------------------------------------------------------------------
// The Bilge, wet again

export function bilgeEpilogue(map) {
  const canal = 'Full. Green, cold, and full of opinions. You\'d never know.';
  return {
    hide: [{ when: epilogue, ids: ['fishmonger', 'boatman', 'canal_0', 'canal_16', 'canal_26', 'water_stairs'] }],
    entities: [
      recast(map, 'fishmonger', {
        interact: lines('fishmonger', [], ['The sea came back, Miss! I\'ve forgiven it. Mostly. It\'s on probation.']),
        use: npcDecline("Not today, Miss. Today I'm just enjoying the smell."),
      }),
      recast(map, 'boatman', {
        interact: lines('boatman', ['♪ The boat is a boat, and the water is back ♪ I delivered a piano, Miss. By BOAT. A first.'],
          ['♪ ...and the man is a man ♪ Still in the boat. Always in the boat.']),
        use: npcDecline("I've got everything a man needs, Miss. A boat. Water under it."),
      }),
      ...['canal_0', 'canal_16', 'canal_26'].map((id) => recast(map, id, { lookKey: 'epi_canals', look: canal })),
      recast(map, 'water_stairs', {
        look: ['The Water Stairs walk down into the canal and keep going. Nobody knows where they go.', 'Nearly nobody.'],
      }),
    ].filter(Boolean),
  };
}

// ---------------------------------------------------------------------------
// The Harbor: the ferry in, the Pelletiers home, Mott by the ferry, the Keeper on the quay.

export function harborEpilogue(map) {
  const pelletiers = lines('pelletiers', ["We've been on the mainland all week! The ferry couldn't FIND the island! Can you imagine!"],
    ['Did anything happen while we were away? No? It never does.']);
  return {
    hide: [{ when: epilogue, ids: ['mott'] }],
    entities: [
      { id: 'epi_pelletier_m', name: 'The Pelletiers', x: 15, y: 6, facing: 'down', when: epilogue, sprite: { sheet: pelletier_m }, behavior: { type: 'face', range: 3 }, interact: pelletiers, use: npcDecline("We've got enough luggage, thank you.") },
      { id: 'epi_pelletier_f', name: 'The Pelletiers', x: 16, y: 6, facing: 'down', when: epilogue, sprite: { sheet: pelletier_f }, behavior: { type: 'face', range: 3 }, interact: pelletiers, use: npcDecline("We've got enough luggage, thank you.") },
      { id: 'epi_pelletier_bags', x: 17, y: 6, when: epilogue, sprite: { sheet: luggage, frame: 'luggage' }, look: 'The Pelletiers\' luggage. A week on the mainland, and they bought a hatbox.' },
      recast(map, 'mott', {
        interact: async (g, self) => {
          const n = bump(g, 'epi.mott');
          if (n === 0) return g.say(self, 'Morning, Cheryl. Landed first go, this morning. Right where I left her.');
          if (n === 1) {
            await g.say(self, 'Lovely view of the Gate. Same as ever.');
            await g.wait(1.6);
            return;
          }
          return g.say(self, '...');
        },
        use: npcDecline('No, no. I\'ve given up the jug. Tea, now. Mostly tea.'),
      }),
      {
        id: 'epi_keeper', name: 'Lighthouse Keeper', x: 21, y: 7, facing: 'down', when: epilogue,
        sprite: { sheet: keeper }, behavior: { type: 'face', range: 3 },
        interact: lines('keeper', [], ["It's lovely, isn't it. The sea. Twenty-two years. Who knew."]),
        use: npcDecline("I've no use for that down here. I'm just looking."),
      },
    ].filter(Boolean),
  };
}
