// The disc and the Kid (docs/design/05-high-and-dry.md, "The disc and the
// Kid"): the disc drinks the lighthouse lamp, fades too fast for Cheryl, and
// the Sweaty Kid runs it from the lighthouse to the bronze door, with the
// camera following him while Cheryl waits at the lighthouse door.

import { kid_relay, disc_fx, keeper } from '../../art/act5_sprites.js';
import { critters } from '../../art/act4_sprites.js';
import { sweaty_kid } from '../../art/opening_npcs.js';
import { ship_plan } from '../../art/chartroom.js';
import { fx } from '../../art/fx.js';
import { started, doorOpen, advanceTeeth, cycle, firstMeet } from './common.js';
import { act5Loops } from './loops.js';

const kidHasDisc = (g) => doorOpen(g) && !g.flag('kid.gaveDisc');
const running = (g) => !!g.flag('relay.run');

const dash = (dir) => ({ sheet: kid_relay, frame: `dash_${dir}` });
const RUN = { sheet: sweaty_kid, walk: [1, 2, 3, 4] };

// ---------------------------------------------------------------------------
// The lamp: the disc drinks it, then starts to fade.

export async function chargeDisc(g) {
  const p = g.player;
  if (!(p.y === 4 && (p.x === 3 || p.x === 4))) await g.movePlayer([3, 4]);
  g.facePlayer('up');
  const k = 'keeper5';
  g.pose('player', 'discup_up');
  await g.wait(0.4);
  g.sfx('disc_drink');
  g.setSprite(k, { sheet: keeper, frame: 'shade_down' });
  g.faceNpc(k, 'down');
  const at = [g.player.x, g.player.y];
  g.flicker(0.25, { color: 'white_light' });
  await g.spawnEffect({ sprite: { sheet: disc_fx, frame: 'disc_flare' }, at, offset: [0, -14], seconds: 1.6, layer: 'top' });
  const glow = g.spawnEffect({ sprite: { sheet: disc_fx, frame: 'disc_full' }, at, offset: [0, -14], seconds: 3.2, layer: 'top' });
  await g.describe("It's drinking the lamp.", "It's full. It's never been this full.");
  await glow;
  g.sfx('disc_fade');
  await g.spawnEffect({ sprite: { sheet: disc_fx, frame: 'disc_dim' }, at, offset: [0, -14], seconds: 0.8, layer: 'top' });
  g.pose('player', null);
  g.facePlayer('right');
  await g.describe("And it's fading already. The canal's the length of the town away.", "I'll never get it there in time. Not at fifty-eight.");
  await g.say(k, "Then GIVE it to someone who can! There's a boy outside doing laps. He's done forty.");
  g.setFlag('disc.charged');
  g.setFlag('relay.ready');
  g.sfx('step_stairs');
  // Out of the lighthouse door: the Harbor's onEnter picks the scene up.
  await g.changeMap('harbor_risen', 27, 4, 'down');
}

// ---------------------------------------------------------------------------
// The Kid at the Harbor: laps of the Prow road, racing the reef.

async function kidTalk(g, self) {
  if (g.flag('kid.gaveDisc')) {
    return g.say(self, cycle(g, 'kid5.after', [
      'The Stair Race is going to be EASY after that.',
      "Fifty-two seconds, Miss! And I jumped! Off the QUAY! Don't tell Mum.",
    ]));
  }
  if (firstMeet(g, 'kid5')) {
    return g.say(self,
      "Miss! I'm racing the reef! Every lap it gets closer, and every lap I get faster!",
      "I've still got your egg! I time everything with it. I timed my breakfast.");
  }
  return g.say(self, cycle(g, 'kid5.repeat', [
    "Do you need anything FAST? I'm the fastest thing in Tessel. Except the wind.",
    "Reef's winning. For now.",
  ]));
}

function onKidWaypoint(g, self) {
  if (Math.random() < 0.4) {
    const side = self.facing === 'left' ? 0.35 : -0.35;
    g.spawnEffect({ sprite: { sheet: fx, frame: 'sweat_drop' }, path: [[self.x, self.y - 1.1], [self.x + side, self.y - 1.3]], speed: 0.35, layer: 'top' });
  }
}

export const kidAtHarbor = {
  id: 'kid5', name: 'Sweaty Kid', x: 18, y: 6, facing: 'right',
  sprite: RUN,
  stepTicks: 12,
  talkPose: 'jog',
  when: (g) => started(g) && !kidHasDisc(g),
  behavior: { type: 'patrol', route: [[18, 6], [26, 6], [26, 4], [18, 4]], stopNear: 2, nearPose: 'jog', onWaypoint: onKidWaypoint },
  interact: kidTalk,
  use: {
    moonglass_disc: (g, self) => (g.flag('disc.charged')
      ? g.say(self, "It's gone all dim again! It's still pretty, though.")
      : g.say(self, "It's glowing a bit! Is it a race thing? Is it a prize?")),
    egg_timer: (g, self) => g.say(self, "You gave me that! I'm keeping it. Finders keepers. Givers... also keepers? No."),
    '*': (g, self) => g.say(self, "Can't carry it! Aerodynamics!"),
  },
};

// On the Bilge, the Kid who bursts in from the Harbor during the run.
export const kidRelayBilge = {
  id: 'kid_relay', name: 'Sweaty Kid', x: 31, y: 13, facing: 'left', solid: false,
  sprite: dash('left'),
  when: running,
  interact: () => {},
};

// ---------------------------------------------------------------------------
// The run

// A hurdle: a few tiles at a run with a hop over whatever's in the way.
async function hurdle(g, id, dirs, speed = 6) {
  g.sfx('leap', { at: id });
  await Promise.all([
    g.moveNpc(id, dirs, { ghost: true, speed }),
    (async () => {
      await g.tween(id, { offset: [0, -12], seconds: 0.22 });
      await g.wait(0.08);
      await g.tween(id, { offset: [0, 0], seconds: 0.22 });
    })(),
  ]);
}

export async function relay(g) {
  g.setFlag('relay.ready', false);
  const kid = 'kid5';
  g.facePlayer('down');
  await g.wait(0.4);
  // He's always within earshot of a challenge: he skids to a stop in front of her.
  g.place(kid, 21, 5, 'right');
  g.setSprite(kid, dash('right'));
  g.sfx('step_kid', { at: kid });
  await g.moveNpc(kid, [27, 5], { speed: 7, ghost: true });
  g.setSprite(kid, RUN);
  g.faceNpc(kid, 'up');
  g.sfx('bump');
  await g.say(kid, "Miss? Is that GLOWING? What is it? Where's it going? Can I take it?");
  // She holds out the disc, shows him the Ship Plan, and points west, toward the Bilge.
  if (g.hasItem('ship_plan')) {
    await g.showPicture({ sheet: ship_plan, frame: 'plan' }, { fade: 0.25 });
    await g.wait(1.6);
    await g.hidePicture({ fade: 0.25 });
  }
  g.pose('player', 'point_left');
  await g.wait(0.7);
  await g.say(kid, 'The bottom of the canal? The big door? With the eye? ...I can do that. I can do that SO fast.');
  g.pose('player', null);
  g.facePlayer('down');
  g.takeItem('moonglass_disc');
  g.sfx('give');
  await g.wait(0.3);
  // He winds the egg timer.
  g.setSprite(kid, { sheet: kid_relay, frame: 'wind_down' });
  g.sfx('timer_wind');
  await g.wait(0.9);
  g.startLoop('timer_tick');
  await g.say(kid, 'Ready. Steady. EGG.');
  g.stopMusic(0);
  g.playMusic('relay');
  const t0 = Date.now();
  g.setFlag('relay.run');

  // Along the quay, west, at full speed, scattering a gull.
  g.cameraFollow(kid, 3);
  g.setSprite(kid, RUN);
  await g.moveNpc(kid, 'd', { speed: 7 });
  g.setSprite(kid, dash('left'));
  await g.moveNpc(kid, [17, 6], { speed: 6, ghost: true });
  g.sfx('gull');
  g.spawnEffect({ sprite: { sheet: fx, frame: 'gull' }, path: [[15, 5], [13, 3], [10, 0]], speed: 1.6, layer: 'top' });
  g.bark('Mott', 'Mind the edge, boy!', { seconds: 1.6 });
  await g.moveNpc(kid, [0, 6], { speed: 6, ghost: true });

  // Into the Bilge from the east, without Cheryl.
  await g.changeMap('bilge_dry', 28, 12, 'left', { cutscene: true, fade: false });
  const r = 'kid_relay';
  g.cameraFollow(r, 0);
  g.setSprite(r, dash('left'));
  await g.moveNpc(r, 'l l l l l l l l l l l l l l l l l l', { speed: 6, ghost: true });
  // Over the bridge to the north quay.
  g.setSprite(r, RUN);
  await g.moveNpc(r, 'u u u u u u u', { speed: 6, ghost: true });
  g.setSprite(r, dash('right'));
  await g.moveNpc(r, 'r r r r r', { speed: 6, ghost: true });
  // Off the quay onto the mud.
  g.faceNpc(r, 'down');
  g.setSprite(r, { sheet: kid_relay, frame: 'jump_down_0' });
  await g.wait(0.35);
  g.sfx('leap', { at: r });
  g.setSprite(r, { sheet: kid_relay, frame: 'jump_down_1' });
  await g.tween(r, { offset: [0, -6], seconds: 0.15 });
  g.place(r, 18, 10, 'down');
  g.npc(r).offset = [0, -70];
  g.setSprite(r, { sheet: kid_relay, frame: 'jump_down_2' });
  await g.tween(r, { offset: [0, 0], seconds: 0.45 });
  g.sfx('mud_splat', { at: r });
  g.setSprite(r, { sheet: kid_relay, frame: 'splat_down_0' });
  g.spawnEffect({ sprite: { sheet: critters, frame: 'mud_splash' }, at: [18, 10], seconds: 0.6, layer: 'top' });
  g.shake(1, 0.2);
  g.bark('Other Mover', 'Hnn!', { seconds: 1.2 });
  await g.wait(0.6);
  g.setSprite(r, { sheet: kid_relay, frame: 'splat_down_1' });
  await g.wait(0.4);
  // Along the mud, hurdling the boats.
  g.setSprite(r, dash('right'));
  await hurdle(g, r, 'r r r');
  g.bark('Boatman', 'Go on, lad!', { seconds: 1.6 });
  await hurdle(g, r, 'r r r');
  await g.moveNpc(r, 'r r', { speed: 6, ghost: true });
  // The disc, slapped into the eye.
  g.faceNpc(r, 'up');
  g.setSprite(r, { sheet: kid_relay, frame: 'slap_up_0' });
  await g.wait(0.25);
  g.setSprite(r, { sheet: kid_relay, frame: 'slap_up_1' });
  for (let dy = 0; dy < 2; dy++) for (let dx = 0; dx < 2; dx++) g.setTile('ground', 26 + dx, 8 + dy, `bilge_door5:door_disc_x${dx}y${dy}`);
  g.sfx('disc_drink');
  g.flicker(0.3, { color: 'relic_cyan' });
  await g.spawnEffect({ sprite: { sheet: disc_fx, frame: 'disc_flare' }, at: [26.5, 8.5], seconds: 1.2, layer: 'top' });
  g.setSprite(r, RUN);
  g.faceNpc(r, 'up');
  await g.moveNpc(r, 'l l', { speed: 8, ghost: true });
  g.faceNpc(r, 'up');
  // The eye flares; the barnacles crack; the door grinds open.
  g.sfx('barnacles_crack');
  g.shake(1, 0.5);
  await g.wait(0.9);
  g.sfx('door_grind');
  for (const f of [0, 1, 2]) {
    for (let dy = 0; dy < 2; dy++) for (let dx = 0; dx < 2; dx++) g.setTile('ground', 26 + dx, 8 + dy, `bilge_door5:door_opening_x${dx}y${dy}_${f}`);
    g.shake(1, 0.3);
    await g.wait(0.7);
  }
  g.setFlag('door.open');
  g.sfx('light_spill');
  g.stopLoop('timer_tick', 0);
  // The relay's last note is the egg timer's ding. If the run beat the music,
  // cut it short and let the timer ding by itself.
  if (Date.now() - t0 < 47000) {
    g.stopMusic(200);
    g.sfx('timer_ding');
  }
  await g.wait(1.2);
  g.setSprite(r, { sheet: sweaty_kid, frame: 'arms_up' });
  await g.say(r, '...I BEAT THE EGG. I BEAT THE EGG!');
  g.setFlag('relay.run', false);
  advanceTeeth(g);

  // Back to Cheryl at the lighthouse door.
  g.followPlayer(0);
  await g.restorePlayer({ fade: true });
  g.facePlayer('left');
  await g.wait(0.6);
  g.bark('Sweaty Kid', '...I BEAT THE EGG!...', { seconds: 2.5 });
  g.sfx('gull');
  await g.wait(2.6);
  g.playMusic('harbor');
  act5Loops(g, ['wind', 'hull_far', 'laundry', 'surf']);
  await g.describe("He did it. I heard him from here. Half of Tessel heard him from here.");
}

export const relayScripts = { chargeDisc, relay };
