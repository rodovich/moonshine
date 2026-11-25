// Act 4's states of the surface maps other acts built: the Crown (the
// Clockmaker, Ambrose, the tower door), Fountain Square (the dry Fountain and
// its cordon), Lamp Street (the Skipping Girls' versions), the Archive
// (Ottilie), the Hundred Steps, Cistern Court, and Cheryl's flat
// (docs/design/04-the-list.md). Each is an overlay on that act's map.

import { act4Tiles } from './tiles.js';
import { overlayMap, act4, risen, listing, bump, cycle, getItem, cherylDeclines } from './common.js';
import { ringTheBell } from './belfry.js';
import { clockmaker as clockmakerArt } from '../../art/act4_sprites.js';
import { act4_props } from '../../art/act4_sprites.js';
import { ambrose as ambroseArt, mayor as mayorArt } from '../../art/act2_npcs.js';
import { LOOKS } from '../act2/common.js';
import { fish as fishArt } from '../../art/landmarks.js';

const find = (map, id) => map.entities.find((e) => e.id === id);

// A base character with a new first talk in Act 4, then their old repeats.
function firstTalk(base, lines) {
  return {
    ...base,
    id: `${base.id}_a4`,
    when: (g) => act4(g) && (!base.when || base.when(g)),
    interact: async (g, self, looks) => {
      if (bump(g, `a4.${base.id}`) === 0) return g.say(self, ...lines);
      return base.interact ? base.interact(g, self, looks) : g.say(self, ...lines.slice(-1));
    },
  };
}

// The surface's faint hull creak, every forty seconds or so, for the whole act.
async function surfaceAudio(g) {
  g.stopLoop('belfry_tick', 0);
  if (listing(g)) g.startLoop('hull_far');
}

// Act 4's states of the given maps (built by earlier acts, possibly already
// wrapped by them), as overlays over the same ids.
import { withAct4Part2 } from './part2.js';

export function withAct4(maps) {
  // ---------------------------------------------------------------------------
  // The Crown

  const crown = maps.crown;

  const clockmaker = (g, self, ...lines) => g.say(self || 'Clockmaker', ...lines);

  async function showGuidebook(g, self) {
    g.setFlag('clockmaker.atDoor');
    await g.say(self || 'Clockmaker', 'A guidebook? I haven\'t got time for-- "Tessel keeps its own time, eleven minutes behind the mainland."', "ELEVEN? Behind? That's MY eleven! Somebody's PUBLISHED my eleven!", "I have to measure it. Now. The sundial. Don't touch ANYTHING.");
    const cm = g.npc('clockmaker_door');
    g.setSprite(cm, { sheet: clockmakerArt });
    g.pose(cm, 'run');
    g.sfx('door_open');
    await g.moveNpc(cm, [13, 10], { speed: 8, ghost: true });
    g.setFlag('clockmaker.out');
  }

  const towerDoor = {
    id: 'tower_door_a4', x: 4, y: 4, w: 2, h: 3, solid: false, when: act4,
    interact: async (g) => {
      if (g.flag('clockmaker.out')) {
        // Open: looking at it (or clicking it) goes in.
        if (bump(g, 'tower.open') === 0 && !g.flag('clock.lifted')) await g.describe('The tower door, wide open. He left in a hurry. Tick, tick, tick, from up there.');
        g.sfx('door');
        return g.changeMap('belfry', 1, 7, 'up');
      }
      if (g.flag('clockmaker.atDoor')) return g.describe("He's in the doorway, guarding it with his whole waistcoat.");
      g.sfx('knock');
      await g.wait(0.8);
      g.sfx('door_open');
      g.setFlag('clockmaker.atDoor');
      const cm = g.npc('clockmaker_door');
      g.faceNpc(cm, 'player');
      await clockmaker(g, cm, "Miss! I'm very busy. The sun is TWELVE minutes wrong now. Twelve. It's getting worse.", "I've checked the clock nine times. The clock is perfect. Therefore the sun is wrong. That's just logic, Miss.", 'I wrote to the observatory. They wrote back "Are you all right?" I am NOT all right.', "And nobody has ever written down what time Tessel keeps. If they had, I'd have it framed. Or burned.");
    },
    use: { guidebook: (g) => (g.flag('clockmaker.out') ? cherylDeclines(g) : g.flag('clockmaker.atDoor') ? showGuidebook(g, g.npc('clockmaker_door')) : g.describe("Nobody's answering. I'll knock first.")), '*': cherylDeclines },
  };

  const clockmakerDoor = {
    // In the doorway itself (the door tile), so he never lands on Cheryl below it.
    id: 'clockmaker_door', name: 'Clockmaker', x: 4, y: 6, facing: 'down',
    sprite: { sheet: clockmakerArt },
    when: (g) => act4(g) && !!g.flag('clockmaker.atDoor') && !g.flag('clockmaker.out'),
    interact: (g, self) => clockmaker(g, self, cycle(g, 'clockmaker.door', [
      "Is it time yet? Don't answer that. I know exactly what time it is. It's the sun that doesn't.",
      "I'm not coming out. I'm guarding the clock. From the sun, mainly.",
    ])),
    use: {
      guidebook: (g, self) => showGuidebook(g, self),
      '*': (g, self) => clockmaker(g, self, "Not now, Miss. The SUN, Miss."),
    },
  };

  const clockmakerSundial = {
    id: 'clockmaker_sundial', name: 'Clockmaker', x: 13, y: 10, facing: 'left',
    sprite: (g) => ({ sheet: clockmakerArt, frame: g.flag('mayor.atCrown') ? 'argue_right' : 'crouch_left' }),
    turnToTalk: false,
    when: (g) => act4(g) && !!g.flag('clockmaker.out'),
    look: 'The Clockmaker. He couldn\'t tell the time until he was nine. Now he can\'t stop.',
    interact: async (g, self) => {
      if (g.flag('mayor.atCrown')) {
        if (bump(g, 'clockmaker.argue') === 0) {
          return g.talk([
            ['Mayor', 'Who rang the bell at TWENTY PAST? My clock doesn\'t DO twenty past!'],
            ['Clockmaker', "It's stopped, Mr. Mayor! The sun--"],
            ['Mayor', "Don't start with the sun."],
          ]);
        }
        return clockmaker(g, self, "I'll fix it. I'll fix it tonight. Once the sun goes down and can't interfere.");
      }
      if (g.flag('clock.lifted') && bump(g, 'clockmaker.stopped') === 0) {
        return clockmaker(g, self, "The clock's STOPPED. I can hear it not ticking from here. ...The sun has done this.");
      }
      return clockmaker(g, self, cycle(g, 'clockmaker.sundial', [
        "Twelve and a half. It's moving, Miss. The SUN is moving. I'm going to need a bigger letter.",
        "Don't go in the tower. I mean it. Respectfully.",
      ]));
    },
    use: { '*': (g, self) => clockmaker(g, self, 'Not now, Miss. I\'m measuring.') },
  };

  const mayorCrown = {
    id: 'mayor_crown', name: 'Mayor', x: 14, y: 10, facing: 'left',
    sprite: { sheet: mayorArt, frame: 'argue_left' }, turnToTalk: false,
    when: (g) => act4(g) && !!g.flag('mayor.atCrown') && !risen(g),
    interact: (g, self) => g.say(self, "Twenty past! Twenty past is not an HOUR, Miss! It's a FRACTION!"),
    use: { '*': (g, self) => g.say(self, 'Not now, Miss. I am conducting an ARGUMENT.') },
  };

  async function ambroseIntoTower(g, self) {
    await g.say(self, "THE TICKING'S STOPPED. WHAT DID YOU DO? ...NO. DON'T TELL ME. I HEARD WHAT YOU DID.");
    g.setSprite(self, { sheet: ambroseArt });
    self.facing = 'left';
    await g.wait(0.4);
    await g.moveNpc(self, [5, 7], { speed: 20 });
    g.faceNpc(self, 'up');
    await g.moveNpc(self, 'u', { speed: 20, ghost: true });
    g.hide(self);
    g.setFlag('ambrose.inBelfry');
    await g.changeMap('belfry', 2, 7, 'up');
    await ringTheBell(g);
  }

  const ambrose4 = {
    id: 'ambrose_a4', name: 'Ambrose', x: 6, y: 7, facing: 'down',
    sprite: LOOKS.ambrose, turnToTalk: false,
    when: (g) => act4(g) && !g.flag('ambrose.inBelfry'),
    interact: async (g, self) => {
      if (g.flag('clock.lifted')) return ambroseIntoTower(g, self);
      if (bump(g, 'ambrose.a4') === 0) {
        return g.say(self,
          "CHERYL. THE STEPS GLOWED LAST NIGHT. ALL OF THEM. AND THE FOUNTAIN'S DRY. SOMETHING'S AWAKE DOWN THERE.",
          "AND THE SEA'S TURNING AND NOBODY'S RINGING FOR IT. FIVE WEEKS. IT'S PILING UP, CHERYL. I CAN FEEL IT.",
          "GET THAT CLOCK OFF MY BELL AND I'LL RING AT THE TURN. HE'S GOT IT CLAMPED ON LIKE A LEECH.");
      }
      return g.say(self, cycle(g, 'ambrose.a4repeat', ['GET THAT CLOCK OFF MY BELL.', "HE WON'T COME OUT. HE SAYS THE SUN'S AFTER HIM."]));
    },
    use: {
      ship_plan: (g, self) => g.say(self, 'A ROPE FROM THE BELL TO A WHEEL. I KNEW IT. I ALWAYS KNEW IT WAS ATTACHED TO SOMETHING.'),
      copper_throat: (g, self) => g.say(self, 'COPPER. GOOD FOR BELLS. NOT FOR THIS ONE.'),
      guidebook: (g, self) => g.say(self, "GIVE IT TO HIM. HE'LL READ ANYTHING WITH A NUMBER IN IT."),
      '*': (g, self) => g.say(self, "I DON'T WANT THAT. I WANT MY BELL."),
    },
  };

  const crown4 = overlayMap(crown, {
    when: act4,
    hide: ['ambrose', 'tower_door', 'sundial'],
    tiles: (g, T) => {
      if (g.flag('clockmaker.out')) { T.block(4, 6, false); T.block(5, 6, false); }
    },
    exits: [{ x: 4, y: 6, w: 2, to: 'belfry', at: [1, 7], facing: 'up', when: (g) => act4(g) && !!g.flag('clockmaker.out') }],
    entities: [{
      // The sundial points at the guidebook's page on Tessel time (the key to the Clockmaker).
      id: 'sundial_a4', x: 11, y: 9, w: 2, h: 2, solid: false, when: act4,
      looks: [
        ['The sundial and the clock disagree by eleven minutes.', "The guidebook has a page on Tessel's time. It's wrong too, naturally."],
        "The sundial has been here five hundred years. The clock arrived last month. I know which one I'd ask for directions.",
      ],
    }, towerDoor, clockmakerDoor, clockmakerSundial, mayorCrown, ambrose4],
    onEnter: async (g) => {
      await surfaceAudio(g);
      if (g.flag('clock.lifted')) g.stopLoop('clock_tick', 0);
    },
  });

  // ---------------------------------------------------------------------------
  // Fountain Square

  const square = maps.fountain_square;
  const CORDON = { x0: 9, y0: 6, x1: 14, y1: 11 };
  const mayorHere = (g) => act4(g) && (!g.flag('mayor.atCrown') || risen(g));
  const fountainDry = (g) => act4(g) && !g.flag('pumps.burst');

  // The Fountain's rims, east and west, so the basin, the hatch, and the fish keep their own clicks.
  const fountainRim = (x) => ({
    id: `fountain_a4_${x}`, lookKey: 'fountain_a4', x, y: 7, w: 1, h: 4, solid: false, when: act4,
    interact: async (g) => {
      if (g.flag('pumps.burst')) {
        return g.describe('Flowing again. Fuller than before. I shut its feed down there, and the pumps found it anyway.', "There's no getting to that hatch now.");
      }
      if (bump(g, 'fountain.a4') === 0 && mayorHere(g)) {
        return g.describe('The Fountain, dry. Five hundred years, and I stopped it with a wheel and a key.', "There's a rope round it now, and the Mayor in front of the rope.");
      }
      return g.describe('Dry. A heap of coins in the bottom, and something round and bronze under them.');
    },
    use: { crowbar: (g) => g.describe('Not with the whole Square watching.'), '*': cherylDeclines },
  });

  const hatch = {
    id: 'ring_hatch', x: 11, y: 8, w: 2, solid: false, when: (g) => fountainDry(g) && !g.flag('hatch.open'),
    interact: async (g) => {
      await g.describe('A bronze ring set in a square hatch, under the coins.', "On the Ship Plan, there's a shaft going down right here.");
      g.pose('player', 'reach_down');
      g.sfx('ring_hatch');
      await g.shake(1, 0.4);
      g.setFlag('hatch.open');
      g.pose('player', null);
      await g.describe('It lifts. A ladder, going down, and the sound of something big, breathing.');
    },
    use: { crowbar: (g) => g.describe("It's got a ring. Rings are for pulling."), '*': cherylDeclines },
  };

  const basin = {
    id: 'basin', x: 11, y: 9, w: 2, solid: false, when: fountainDry,
    look: 'Five hundred years of wishes in a heap. Mostly buttons. Somebody wished with a whole spoon.',
  };

  const cordonSign = { id: 'cordon_sign', x: 13, y: 11, solid: false, when: fountainDry, look: 'PENDING AN INQUIRY. The inquiry is me.' };

  const mayor4 = {
    ...find(square, 'mayor'), id: 'mayor_a4', when: mayorHere,
    interact: async (g, self) => {
      if (risen(g)) return g.say(self, 'The Fountain has been restored by the inquiry! Tessel: Forward! ...The canals are a separate inquiry.');
      if (bump(g, 'mayor.a4') === 0) {
        return g.say(self, 'Citizens! The Fountain is closed pending an inquiry. There will be no touching of the Fountain.', "Water thieves! With glowing paint! I've seen it all before. No I haven't. Nobody has.", "...Miss. Please don't look at the Fountain like that. You'll give people ideas.");
      }
      return g.say(self, cycle(g, 'mayor.a4repeat', ['Pending an inquiry, Miss. Behind the rope.', "The Bilge is a little damp. The Bilge has always been damp. It's called the BILGE."]));
    },
    use: {
      ...(find(square, 'mayor').use || {}),
      ship_plan: (g, self) => g.say(self, 'A drawing of a fish. Lovely, Miss. Gold star. Behind the rope.'),
    },
  };

  // Walking into the cordon while he's guarding it: his line, and a step back.
  const ropeTrigger = (x, y, w, h, facing, back) => ({
    x, y, w, h,
    when: (g) => fountainDry(g) && mayorHere(g) && g.player.facing === facing,
    run: async (g) => {
      await g.say('Mayor', 'Miss! Behind the rope, please. Pending an inquiry.');
      await g.movePlayer([back]);
    },
  });

  const square4 = overlayMap(square, {
    when: act4,
    tileset: act4Tiles,
    hide: ['fountain', 'mayor', 'piano', 'piano_arch', 'big_mover', 'other_mover', 'counting_woman_square', 'fish'],
    tiles: (g, T) => {
      if (!fountainDry(g)) return; // after the rise it flows again, over its hatch, as before
      const art = g.flag('hatch.open') ? 'fountain_coins_open' : 'fountain_coins_closed';
      for (let y = 0; y < 4; y++) for (let x = 0; x < 4; x++) T.set('detail', 10 + x, 7 + y, `square4:${art}_x${x}y${y}`, true);
      // The basin floor and the step-over in the south rim are walkable; the fish and rim aren't.
      for (const [x, y] of [[11, 9], [12, 9], [11, 10], [12, 10]]) T.block(x, y, false);
    // The hatch blocks until it's lifted; then it's the way down.
    for (const x of [11, 12]) T.block(x, 8, !g.flag('hatch.open'));
      // The cordon.
      const { x0, y0, x1, y1 } = CORDON;
      for (const [x, y] of [[x0, y0], [x1, y0], [x0, y1], [x1, y1]]) T.set('detail', x, y, 'square4:cordon_post', true);
      for (let x = x0 + 1; x < x1; x++) { T.set('detail', x, y0, 'square4:cordon_rope_h', true); T.set('detail', x, y1, x === 13 ? 'square4:cordon_rope_sign' : 'square4:cordon_rope_h', true); }
      for (let y = y0 + 1; y < y1; y++) { T.set('detail', x0, y, 'square4:cordon_rope_v', true); T.set('detail', x1, y, 'square4:cordon_rope_v', true); }
      if (!mayorHere(g)) { T.block(11, 11, false); T.block(12, 11, false); }
    },
    exits: [{ x: 11, y: 8, w: 2, to: 'pump_hall', at: [2, 3], facing: 'down', sfx: 'step_stairs', when: (g) => fountainDry(g) && !!g.flag('hatch.open') }],
    triggers: [
      ropeTrigger(10, 12, 4, 1, 'up', [11, 13]),
      ropeTrigger(10, 5, 4, 1, 'down', [11, 4]),
      ropeTrigger(8, 7, 1, 4, 'right', [7, 8]),
      ropeTrigger(15, 7, 1, 4, 'left', [16, 8]),
      {
        x: 11, y: 11, w: 2, stop: false,
        when: (g) => fountainDry(g) && !mayorHere(g) && !g.flag('stepped.rope'),
        run: async (g) => {
          g.setFlag('stepped.rope');
          await g.describe("Nobody's watching. I step over the rope like it's a playground wall.");
        },
      },
      { x: 11, y: 9, w: 2, stop: false, when: fountainDry, run: (g) => g.sfx('coins_rattle') },
    ],
    // The hatch and basin come before the whole-Fountain hotspot, so they win on their tiles.
    entities: [hatch, basin, cordonSign, mayor4, fountainRim(10), fountainRim(13), {
      id: 'fish_a4', x: 11, y: 7, w: 2, solid: false, kind: 'object', when: act4, offset: [0, 19], // on the rim row, drawn where Act 2 draws it
      sprite: (g) => ({ sheet: fishArt, frame: fountainDry(g) ? 'fish_dry' : 'fish' }),
      interact: (g) => g.describe(fountainDry(g) ? "The bronze fish, with nothing coming out of its mouth. It looks like it's waiting to be asked." : 'The fish, spouting again. Harder than before. It looks pleased with itself.'),
    }],
    onEnter: surfaceAudio,
  });

  // ---------------------------------------------------------------------------
  // Lamp Street: the Skipping Girls, each with her own version.

  const lamp = maps.lamp_street;

  const VERSIONS = {
    girl_1: [
      "Miss! Listen! I've got it properly now!",
      '♪ Moonshine, moonshine, catch it in a cup, ring the bell when the tide turns up! ♪',
      "♪ Stout sister, Thin sister, Middle sister three, wake them one by one and they'll drink up the sea! ♪",
      "♪ Middle sister's ready, put her in the shed! ♪ ...I don't know the rest. Nobody does.",
    ],
    girl_2: [
      "She's WRONG, Miss. It's like this:",
      "♪ Thin sister, Stout sister, Little sister three, wake them one by one and they'll drink up the sea! ♪",
      "Then there's a bit about a greedy one, but that's where you jump out. You don't sing it. You JUMP.",
    ],
    girl_3: [
      "They're both wrong and I'm right. Thin sister, FAT sister. Fat. Not stout.",
      "♪ Thin sister, Fat sister, Middle sister three, wake them one by one and they'll drink up the sea! ♪",
      "♪ Middle sister's greedy, put her back to bed, or up jumps Tessel and bumps her head! ♪",
      "That's the BEST bit. Tessel bumps her HEAD. Like a big daft dog.",
    ],
  };
  const GIRL_REPEAT = {
    girl_1: 'Stout first. My nan says. My nan\'s never wrong, except about everything.',
    girl_2: "Little sister three. She's the littlest so she goes last. It's OBVIOUS.",
    girl_3: '♪ Up jumps Tessel! ♪ Bump!',
  };

  const girls4 = ['girl_1', 'girl_2', 'girl_3'].map((id) => {
    const base = find(lamp, id);
    return {
      ...base, id: `${id}_a4`, bark: undefined, when: act4,
      interact: async (g, self) => {
        if (g.flag(`heard.${id}`)) return g.say(self, GIRL_REPEAT[id]);
        g.setFlag(`heard.${id}`);
        g.setFlag('girls.heard', (g.flag('girls.heard') || 0) + 1);
        await g.say(self, ...VERSIONS[id]);
        if (g.flag('girls.heard') === 3) await g.describe('Two of them say thin first. Two of them say middle last. Three sisters, one by one.');
      },
    };
  });

  const lamp4 = overlayMap(lamp, {
    when: act4,
    hide: ['girl_1', 'girl_2', 'girl_3', 'bench_man', 'watering_woman'],
    entities: [
      ...girls4,
      { ...firstTalk(find(lamp, 'bench_man'), ['Says here the Fountain stopped because of "subterranean adjustments." I said adjustments. I said it yesterday.']) },
      { ...firstTalk(find(lamp, 'watering_woman'), ["My husband says the doorsteps are the clock's fault. I said, everything's the clock's fault with you.", 'He said, exactly.']) },
    ],
    onEnter: surfaceAudio,
  });

  // ---------------------------------------------------------------------------
  // The Archive: Ottilie reads the Ship Plan.

  const archive = maps.archive;

  const ottilie4 = {
    ...find(archive, 'ottilie'), id: 'ottilie_a4', when: act4,
    interact: async (g, self) => {
      if (g.flag('ottilie.readPlan')) return g.say(self, cycle(g, 'ottilie.a4after', ['Three eels, side by side, in the belly of a ceremonial fish. It all fits.', "Snails for the doorsteps. Eels for the fish. I'm on a roll, Cheryl."]));
      if (bump(g, 'ottilie.a4') === 0) {
        return g.say(self, 'Cheryl. Glowing doorsteps. A dry fountain. And you, coming out of my door that doesn\'t open.', "I've decided not to think about the door. I'm thinking about the doorsteps. Phosphorescent snails, I think.");
      }
      return g.say(self, "Snails. I'm nearly sure. Have you got anything for me? Primary sources, Cheryl.");
    },
    use: {
      ...(find(archive, 'ottilie').use || {}),
      ship_plan: async (g, self) => {
        if (g.flag('ottilie.readPlan')) return g.say(self, 'Thin, Stout, and Middle. I\'ve written it on my hand.');
        await g.say(self, "Your rubbing! Let me-- oh. Oh, Cheryl. That's a FISH. A big, hollow, ceremonial fish.", 'And glyphs! Founder glyphs! I know these three. This one\'s "thin." This one\'s "stout." This one\'s "middle."', 'Thin, Stout, and Middle. Types of eel, obviously. A thin eel, a stout eel, and a medium eel.', "This is the most important document in Tessel. I'm going to need a bigger monograph.");
        g.setFlag('ottilie.readPlan');
        await g.describe('Thin, Stout, and Middle. The three bars. The three sisters in the rhyme.');
      },
      moon_chart: (g, self) => g.say(self, 'Your habit chart. Still a habit. Interesting new tick, though.'),
    },
  };

  const archive4 = overlayMap(archive, { when: act4, hide: ['ottilie'], entities: [ottilie4] });

  // ---------------------------------------------------------------------------
  // The Hundred Steps: the Kid in the dark, the Counting Woman at a hundred.

  const steps = maps.hundred_steps;
  const kidBase = find(steps, 'kid_after');

  const steps4 = overlayMap(steps, {
    when: act4,
    // The open hundredth step: in Act 4 it's a hole in the east half of the flight,
    // with room to pass on the west, so the Steps lead down to the Square again.
    baseTriggers: false,
    tiles: (g, T) => { if (g.flag('step.open')) T.block(10, 19, true); },
    triggers: [{
      x: 9, y: 19, stop: false,
      when: (g) => act4(g) && !!g.flag('step.open') && !g.flag('stepped.hundredth'),
      run: async (g) => { g.setFlag('stepped.hundredth'); await g.describe('I step over the open step, the way you step over a sleeping dog.'); },
    }],
    hide: ['kid', 'kid_after', 'counting_woman', 'basin_woman'],
    entities: [
      {
        id: 'open_step_a4', x: 10, y: 19, solid: false, when: (g) => act4(g) && !!g.flag('step.open'),
        look: "The hundredth step, open. Downstairs is down there, waiting. I've got the Fountain to see to first.",
      },
      {
        ...kidBase, id: 'kid_a4', when: act4,
        interact: (g, self) => (bump(g, 'kid.a4') === 0
          ? g.say(self, 'Miss! The steps glowed last night and I ran them in the DARK! I could see my FEET!', "Mrs. Count's counting a hundred now. She's so happy it's weird.")
          : g.say(self, "Everything's rolling downhill. Even me! I'm FASTER downhill!")),
      },
      {
        ...find(steps, 'counting_woman'), id: 'counting_a4', x: 8, y: 17, when: act4, behavior: undefined,
        interact: (g, self) => (bump(g, 'counting.a4') === 0
          ? g.say(self, 'Ninety-eight. Ninety-nine. ONE HUNDRED. Cheryl. Cheryl! One HUNDRED!', "Somebody's opened a hole in my steps, and I counted it, and it's a hundred. I'm not asking who.", "I'm not asking anything. I'm counting. A hundred, every time. It's the best week of my life.")
          : g.say(self, "A hundred. Don't talk to me. I want to do it again.")),
      },
      {
        ...find(steps, 'basin_woman'), id: 'basin_a4', when: act4,
        interact: (g, self) => (bump(g, 'basin.a4') === 0
          ? g.say(self, "I didn't see anything. There isn't a hole. I'm tipping my basin round it.")
          : g.say(self, 'Round it. Not into it. Never into it.')),
      },
    ],
    onEnter: surfaceAudio,
  });

  // ---------------------------------------------------------------------------
  // Cistern Court and the flat.

  const court = maps.cistern_court;
  const flat = maps.flat;

  const court4 = overlayMap(court, {
    when: act4,
    hide: ['old_man', 'neighbor_morning', 'well', 'cat_morning'],
    entities: [
      firstTalk(find(court, 'old_man'), ["Gerald's pieces won't stay on the board. Gerald says it's a sign. I said, a sign of what. He said, of pieces."]),
      firstTalk(find(court, 'neighbor_morning'), ['The doorsteps GLOWED. So I put my sheets on the step all night. Nothing. Grey as a Tuesday.']),
      { ...find(court, 'well'), id: 'well_a4', when: act4, interact: (g) => g.describe("The well's breathing harder this morning. In and out, slow, like it's asleep.") },
      { ...find(court, 'cat_morning'), id: 'cat_a4', when: act4, interact: (g) => g.describe("She's moved her bed against the uphill wall. She's not wrong.") },
    ],
    onEnter: async (g) => { g.playMusic('morning_after'); await surfaceAudio(g); },
    ambient: [{
      // The Old Man still moves a piece and moves it back (his Act 1 fidget, for his Act 4 self).
      every: [6, 11], when: act4,
      run: (g) => {
        const old = g.npc('old_man_a4');
        if (old.pose) return;
        g.pose(old, 'think_right_1');
        g.sfx('chess_tap', { at: old });
        setTimeout(() => { if (old.pose === 'think_right_1') { old.setPose(null); g.sfx('chess_tap', { at: old }); } }, 900);
      },
    }],
  });

  const teacup = {
    id: 'teacup', x: 5, y: 4, solid: false, shadow: false, when: act4,
    sprite: { sheet: act4_props, frame: 'teacup' }, offset: [4, -6],
    interact: (g) => g.describe(...(bump(g, 'teacup') === 0
      ? ["My teacup, at the very edge of the table. Downhill. The table isn't downhill."]
      : ["I've moved it back to the middle three times. It keeps going."])),
  };

  const chart4 = {
    id: 'moon_chart_a4', x: 4, y: 4, w: 1, solid: false, when: (g) => act4(g) && !g.flag('got.moon_chart'),
    interact: async (g) => {
      await g.describe("Thirty-one ticks, and the last one outside. Somebody else says the moon's wrong.");
      g.setFlag('got.moon_chart');
      await getItem(g, 'moon_chart');
    },
  };

  const flat4 = overlayMap(flat, {
    when: act4,
    hide: ['moon_chart'],
    entities: [teacup, chart4],
    onEnter: async (g) => { g.playMusic('morning_after'); await surfaceAudio(g); },
  });


  return { ...withAct4Part2(maps), crown: crown4, fountain_square: square4, lamp_street: lamp4, archive: archive4, hundred_steps: steps4, cistern_court: court4, flat: flat4 };
}

// The act's start: the morning after Act 3, in the flat (design: "What changes when Act 4 begins").
export async function startAct4(g) {
  g.stopMusic(1000);
  await g.fade('out', 1);
  await g.card('Morning.', 2);
  g.setFlag('act4.started');
  g.setWrongness(0.35);
  await g.changeMap('flat', 8, 4, 'down', { seconds: 1 });
  await g.wait(0.6);
  await g.describe('Morning. The Fountain\'s stopped. The doorsteps glow in the dark.', 'And my teacup has walked to the edge of the table in the night.');
}

