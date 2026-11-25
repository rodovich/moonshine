// The climax in the Windlass Room (docs/design/06-moon-in-the-bowl.md, "The
// bell", "The hauling"). The Windlass Room is Act 5's map (22 × 14); Act 6
// adds its night state on top (see extend.js): its own brake, speaking tube,
// drum, hawse, and hatch, while `act6.started` holds.
//
//      x 0         1         2
//        0123456789012345678901
//  y  1  X######HH###########XX   HH the hatch to the Long Keel (7-8, 1-2)
//     2  X#L####HH######T###L#X   T the speaking tube (15, 2)
//     3  X....................>   > the hawse (21, 3-4)
//     4  X....DDDDDDDDDDDDDDDD>   the drum and chain (5-20, 4-7)
//     8  X......PP........B...X   PP the Tooth socket, the clapper in it (7-8, 8-9); B the brake (17, 8)
//    10  X..cc..........cc....X   the coils (3-4, 10) and (15-16, 10)

import { brake, keel_hatch, windlass_drum } from '../../art/act5_under.js';
import { windlass_night, keel_lit } from '../../art/act6_under.js';
import { bump, cherylDeclines, night } from './common.js';
import { act6, HAULING_LINKS, queueScript } from './state.js';
import { lurchMontage } from './montage.js';

const Q = [['nw', 0, 0], ['ne', 1, 0], ['sw', 0, 1], ['se', 1, 1]];
const BELL_AFTER = 15; // seconds of anything else before the bell rings on its own

// ---------------------------------------------------------------------------
// The start of the act (after Act 5's Moonrise card): Cheryl on the west coil.

export async function act6Start(g) {
  g.setFlag('act6.started');
  g.setWrongness(0.5);
  bellClock = 0;
  if (g.map !== act6.ids.windlass) return;
  g.startLoop('tube_wind', { fadeMs: 1000 });
  g.setLoopVolume('tube_wind', 0.5, 0);
  await g.wait(1);
  g.pose('player', null);
}

// ---------------------------------------------------------------------------
// The bell

let bellClock = 0;

export async function bell(g) {
  if (g.flag('bell.final')) return;
  g.setFlag('bell.final');
  // 1. Cut (no fade) to the belfry at night: Ambrose at the rope, eyes shut, moonlight on his face.
  const belfry = act6.maps[act6.ids.belfry];
  if (belfry) {
    g.setFlag('fx.montage', 'bell');
    await g.changeMap(act6.ids.belfry, act6.pos.belfry[0], act6.pos.belfry[1], 'down', { cutscene: true, fade: false });
    g.setLighting('night', 0);
    await g.wait(2);
    // 2-3.
    await g.say('Ambrose', 'THE TURN. THE BIG ONE.', { position: 'top' });
    await g.say('Ambrose', '...NOW.', { position: 'top' });
    g.setFlag('fx.montage', null);
    // 4. Back to the Windlass Room.
    await g.restorePlayer({ fade: false });
  }
  // Three great strokes through the speaking tube, each with a shake; the brake unlocks on the first.
  g.sfx('bell_tube');
  for (let i = 0; i < 3; i++) {
    g.shake(1, 0.6);
    if (i === 0) {
      await g.wait(0.15);
      g.sfx('brake_clack');
      g.emote('act6_brake', 'exclaim', { seconds: 1 });
    }
    await g.wait(i === 0 ? 1.85 : 2);
  }
  // 5.
  await g.describe('The bell says when.');
}

// ---------------------------------------------------------------------------
// The hauling

export async function hauling(g) {
  // 1. The brake swings over. A deep shudder. Far off, the Tide Wheel bites.
  g.facePlayer('up');
  g.pose('player', 'heave_up');
  g.sfx('brake_throw');
  await g.wait(0.5);
  g.setFlag('brake.thrown');
  g.pose('player', null);
  g.playMusic('hauling', { fadeMs: 0 });
  g.stopLoop('tube_wind', 800);
  // The links' booms are in the cue; shake on each one, whatever else is on screen.
  const links = (async () => {
    let prev = 0;
    for (const t of HAULING_LINKS) {
      await g.wait(t - prev);
      prev = t;
      g.shake(2, 0.3);
    }
  })();
  g.shake(1, 1.2);
  g.sfx('wheel_bite');
  await g.wait(1.4);
  // The drum turns the wrong way first: the chain pays out a link, Cheryl staggers...
  g.setFlag('fx.haul', 'out');
  g.startLoop('drum_turn');
  g.shake(2, 0.4);
  await g.movePlayer('d', { speed: 10 });
  g.facePlayer('up');
  await g.wait(0.6);
  // ...then the clapper clacks into the drum's teeth and holds, and it turns the right way.
  g.sfx('brake_clack', { volume: 0.8 });
  g.setFlag('fx.haul', 'in');
  await g.wait(0.6);
  // 3. Internal monologue.
  await g.think('Wind her in slowly.', { auto: 1.3 });
  await g.think('And home again.', { auto: 1.3 });
  // 4. The montage, while the links come faster.
  await lurchMontage(g);
  // 5. Back in the Windlass Room: the booms slow; the last link comes in; the drum stops.
  await links;
  await g.wait(0.6);
  g.stopLoop('drum_turn', 500);
  g.setFlag('fx.haul', null);
  g.setFlag('chain.home');
  await g.wait(2.2);
  g.startLoop('hawse_wind', { fadeMs: 1500 });
  g.setLoopVolume('hawse_wind', 0.4, 0);
  // 6. The hatch's emblem lights cyan, and the hatch grinds open.
  g.sfx('emblem_hatch');
  g.setFlag('fx.hatch', 'lit');
  await g.wait(1.6);
  g.shake(1, 0.8);
  g.setFlag('fx.hatch', null);
  g.setFlag('hatch.open');
  await g.wait(0.8);
  // 7-8.
  await g.describe("It's stopped. We're home. Or near enough.");
  await g.describe('Now the moon in the bowl.');
  g.playMusic('keel');
}

// ---------------------------------------------------------------------------
// The Windlass Room's Act 6 state

const before = (g) => night(g) && !g.flag('brake.thrown');

export async function brakeLever(g) {
  if (!g.flag('bell.final')) {
    await g.describe("Locked. 'When the bell says when.'");
    return bell(g);
  }
  if (!g.flag('brake.thrown')) return hauling(g);
  return g.describe("Thrown. I'm leaving it thrown.");
}

export async function speakingTube(g) {
  if (g.flag('brake.thrown')) return g.describe('Somebody up there is laughing. A lot of people are laughing. And somebody\'s crying about a piano.');
  if (bump(g, 'tube.night') === 0) {
    g.setLoopVolume('tube_wind', 1, 400);
    await g.describe('Far off, through the tube: a crowd. Music. An accordion.');
    await g.say('Far-off Voice', '...citizens... ...the canals are a FEATURE...', { position: 'top' });
    g.setLoopVolume('tube_wind', 0.5, 1200);
    return;
  }
  return g.describe('The crowd, far off. An accordion. The Mayor, still going.');
}

export function windlassAct6(map) {
  const objects = [
    {
      id: 'act6_brake', x: 17, y: 8, kind: 'object',
      sprite: (g) => ({ sheet: brake, frame: g.flag('brake.thrown') ? 'brake_thrown' : 'brake_locked' }),
      interact: brakeLever,
    },
    { id: 'act6_tube', x: 15, y: 1, h: 2, interact: speakingTube },
    {
      id: 'act6_drum', x: 5, y: 4, w: 16, h: 4,
      interact: (g) => g.describe(g.flag('chain.home') ? "Still. Holding. The clapper's doing a job it never knew it had." : 'The drum. Wound with chain, every link taller than me. Waiting.'),
    },
    {
      id: 'act6_hawse', x: 21, y: 3, h: 2,
      interact: (g) => g.describe(g.flag('chain.home') ? "The sea's quieter. It's had its say." : 'Moonlight, through the hawse. The chain goes out into it, tight as a held breath.'),
    },
    {
      id: 'act6_hatch', x: 7, y: 1, w: 2, h: 2, when: (g) => night(g) && !g.flag('hatch.open'),
      look: 'The hatch with the moon in a bowl on it. Sealed. Not for long, I think.',
    },
    { id: 'act6_coil', x: 3, y: 10, w: 2, look: 'The coil I sat on to wait. Spare chain. I hope we never need it.' },
  ].map((o) => ({ solid: true, ...o, when: o.when || night, use: { crowbar: (g) => g.describe("No. The crowbar's done its part."), '*': cherylDeclines } }));

  return {
    sheets: { brake, keel_hatch, windlass_drum, windlass_night, keel_lit },
    hide: [{ when: night, ids: act6.windlassHide || [] }],
    entities: objects,
    exits: [0, 1].map((i) => ({ x: 7 + i, y: 2, to: 'long_keel', at: [38, 3 + i], facing: 'left', when: (g) => !!g.flag('hatch.open') })),
    patches: (g) => {
      if (!g.flag('act6.started')) return [];
      const out = [];
      // The hatch: sealed, the emblem lit, then open (walkable: its lower row is the way through).
      const h = g.flag('hatch.open') ? 'open' : g.flag('fx.hatch') === 'lit' ? 'lit' : 'sealed';
      for (const [q, dx, dy] of Q) {
        const ref = h === 'lit' ? `keel_lit:keel_lit_${q}` : `keel_hatch:keel_${h}_${q}`;
        out.push(['ground', 7 + dx, 1 + dy, h === 'open' && dy === 1 ? { tile: ref } : { tile: ref, solid: true }]);
      }
      // The hawse: the chain coming in through the moonlight while she hauls.
      if (g.flag('fx.haul')) {
        out.push(['ground', 21, 3, { tile: 'windlass_night:hawse_in_top', solid: true }], ['ground', 21, 4, { tile: 'windlass_night:hawse_in_bot', solid: true }]);
        // The drum turning (its animated frames).
        for (let r = 0; r < 4; r++) for (let c = 0; c < 16; c++) out.push(['detail', 5 + c, 4 + r, { tile: `windlass_drum:drum_x${c}y${r}`, solid: true }]);
      }
      return out;
    },
    // Moonlight, silver, through the hawse.
    lights: [{ x: 20.5, y: 3.5, radius: 2, color: 'moon_light', when: night }],
    ambient: [{
      every: [1, 1],
      when: (g) => night(g) && !g.flag('bell.final'),
      run: (g) => {
        bellClock++;
        if (bellClock >= BELL_AFTER) {
          bellClock = -1000;
          queueScript(bell);
        }
      },
    }],
    onEnter: async (g, base) => {
      if (!night(g)) return base(g);
      bellClock = 0;
      if (!g.flag('brake.thrown')) g.startLoop('tube_wind', { fadeMs: 1000 });
      if (g.flag('chain.home')) g.playMusic('keel');
    },
  };
}
