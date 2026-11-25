// The moonrise: the end of Moonshine Night and the first glimpse of the
// Wrongness. Steps are numbered as in docs/design/01-opening.md, "The
// Moonrise sequence". Input is locked for the whole thing (it's one script).

import { fx } from '../../art/fx.js';
import { vista, vista_rim, vista_glow, vista_moon, vista_twinkle, vista_cheryl, VISTA_BASINS } from '../../art/vista.js';

// The vista, drawn each frame per docs/art-opening.md. The script moves it
// along by setting times on `scene` (in the picture's own milliseconds).
function makeVista(g) {
  const art = {
    bowl: g.sheet(vista), rim: g.sheet(vista_rim), glow: g.sheet(vista_glow),
    moon: g.sheet(vista_moon), twinkle: g.sheet(vista_twinkle), cheryl: g.sheet(vista_cheryl),
  };
  const scene = { now: 0, glowAt: null, moonAt: null };
  const phases = VISTA_BASINS.map((_, i) => (i * 677) % 1180);
  scene.draw = (ctx, ms) => {
    scene.now = ms;
    ctx.drawImage(art.bowl.frame('bowl_dusk'), 0, 0);
    if (scene.glowAt != null && ms >= scene.glowAt) {
      const t = ms - scene.glowAt;
      ctx.drawImage(art.glow.frame(`glow_${t < 1200 ? 0 : t < 2400 ? 1 : 2}`), 116, 42);
    }
    if (scene.moonAt != null && ms >= scene.moonAt) {
      // Slowly to half up (about six seconds), then clear of the ridge.
      const t = (ms - scene.moonAt) / 1000;
      const cy = Math.max(56, t < 6 ? 104 - t * 3 : 86 - (t - 6) * 6);
      ctx.drawImage(art.moon.frameAt('moon', ms), 176 - 16, Math.round(cy) - 16);
      // The Gate, where the moon should be, goes cold and empty.
      const cold = Math.min(0.6, Math.max(0, (t - 1) / 5) * 0.6);
      if (cold > 0) {
        const grad = ctx.createLinearGradient(0, 78, 0, 100);
        grad.addColorStop(0, 'rgba(40, 48, 96, 0)');
        grad.addColorStop(1, `rgba(40, 48, 96, ${cold})`);
        ctx.fillStyle = grad;
        ctx.fillRect(104, 78, 48, 34);
      }
    }
    ctx.drawImage(art.rim.frame('rim'), 0, 0);
    VISTA_BASINS.forEach(([x, y], i) => ctx.drawImage(art.twinkle.frameAt('twinkle', ms + phases[i]), x - 3, y - 3));
    ctx.drawImage(art.cheryl.frame('cheryl_tub'), 0, 128);
  };
  return scene;
}

export async function moonrise(g) {
  // 1.
  await g.think('Plug in. Water in. Sheets out of the way.', 'Now, the moon.');

  // 2. To the tub's edge, and sit.
  await g.movePlayer([3, 5]);
  g.facePlayer('right');
  await g.wait(0.3);
  // She sits on the tub's near rim, in the middle (no floor shadow while she's up there).
  g.player.def.shadow = false;
  g.pose('player', 'rise_right', { offset: [4, -6] });
  await g.wait(0.15);
  g.pose('player', 'sit_right', { offset: [7, -13] });
  await g.wait(0.6);

  // 3. The court's music fades; the festival below; the Crown clock strikes
  // the hour (three strokes, fading).
  g.stopMusic(2000);
  g.startLoop('crowd', { fadeMs: 2000 });
  await g.wait(1.2);
  g.sfx('clock_strike');
  await g.wait(4);

  // 4–5. To the vista.
  const scene = makeVista(g);
  await g.showPicture(scene.draw, { fade: 1 });
  g.playMusic('moonrise');
  await g.wait(1.5);

  // 6. A glow behind the Rim, to the right of the Gate.
  scene.glowAt = scene.now;
  await g.wait(3.6 + 2);

  // 7. The moon's rim comes up over the cliff. The murmur stops dead.
  scene.moonAt = scene.now;
  await g.wait(0.9);
  g.stopLoop('crowd', 0);
  g.windDownMusic(4500);
  await g.wait(0.7);
  g.sfx('dog_bark');
  await g.wait(8);

  // 8.
  g.sfx('wrong_sting');
  await g.think('No.', 'It comes up in the Gate.', 'It has come up in the Gate every year of my life.');
  await g.wait(0.6);

  // 9. Hard cut back to the roof, at night.
  await g.hidePicture({ fade: 0 });
  await g.setLighting('night', 0);
  await g.wait(0.7);

  // 10. The groan.
  g.sfx('groan');
  const groan = g.shake(1, 3);
  g.setFlag('fx.tub', 'slosh');
  await g.wait(0.6);
  g.setFlag('fx.chimney', 'rattle');
  g.sfx('rattle');
  g.setFlag('fx.backline', 'swung');
  await g.say('Sweaty Kid', 'WHOA!', { auto: 0.8 });
  await g.say('Neighbor', 'My SHEETS!', { auto: 0.9 });
  await groan;
  g.setFlag('fx.chimney', null);

  // 11. The crack.
  g.sfx('crack');
  await g.shake(3, 0.5);

  // 12. The piano goes down the Squeeze. Down to the court to see it gone.
  g.sfx('piano_tumble');
  g.setFlag('piano.gone');
  const pan = g.panCamera(15, 22, 4);
  for (const [x, y] of [[15, 23], [16, 24], [15, 25]]) {
    g.spawnEffect({ sprite: { sheet: fx, frame: 'dust' }, at: [x + 0.5, y], seconds: 0.4, layer: 'top' });
    await g.wait(0.35);
  }
  await pan;
  await g.wait(1.6);
  await g.followPlayer(4);
  await g.wait(0.3);

  // 13. The drain takes the plug.
  g.sfx('drain_glunk');
  g.setFlag('fx.tub', 'whirl');
  g.sfx('drain_gurgle');
  await g.wait(1.5);
  g.setFlag('fx.tub', 'empty');
  g.sfx('drain_echo'); // falls away, then a tiny, faraway splash
  await g.wait(2.6);

  // 14. Silence. A gull. Wind.
  await g.wait(1.5);
  g.sfx('gull');
  await g.wait(0.6);
  g.startLoop('wind', { fadeMs: 1500 });
  await g.wait(1.2);

  // 15. Cheryl stands.
  g.pose('player', 'rise_right', { offset: [4, -6] });
  await g.wait(0.25);
  g.pose('player', null);
  g.player.def.shadow = undefined;
  g.facePlayer('right');
  await g.wait(0.4);
  await g.think('That drain goes to the gutter. The gutter goes to the lane.', 'That sound went somewhere else entirely.');

  // 16. She comes to the low wall to talk over it.
  const nb = g.npc('neighbor_after');
  await g.moveNpc(nb, [10, 4], { speed: 11 });
  g.faceNpc(nb, 'left');
  await g.say(nb, 'Did you FEEL that? The whole house went sideways!', "It's the bleach. I've overdone the bleach.");

  // 17.
  await g.think("Something's wrong.", 'Not wrong like a dropped stitch. Wrong like a step that isn\'t there.');

  // 18. Morning.
  g.stopLoop('wind', 2500);
  await g.fade('out', 2);
  await g.card('Morning.', 2);

  // 19. The morning state, in the flat.
  for (const f of ['fx.tub', 'fx.backline', 'fx.chimney', 'tub.full', 'tub.plugged']) g.setFlag(f, null);
  g.setFlag('act1.moonrise');
  await g.changeMap('flat', 8, 4, 'left', { seconds: 1 });

  // 20.
  await g.wait(0.6);
  await g.think(
    'My plug is gone. The moon came up in the wrong place. There\'s a piano loose in the city.',
    "I'd like to know why.",
    "I'd also like my plug back.",
  );
  // 21. Control returns.
}
