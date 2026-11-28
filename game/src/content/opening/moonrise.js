// The moonrise: the end of Moonshine Night and the first glimpse of the
// Wrongness. Steps are numbered as in docs/design/01-opening.md, "The
// Moonrise sequence". Input is locked for the whole thing (it's one script).

import { fx } from '../../art/fx.js';
import { vista_pins } from '../../art/pins.js';
import { vista, vista_gate_cold, vista_rim, vista_glow, vista_moon, vista_path, vista_twinkle, vista_cheryl, VISTA_BASINS } from '../../art/vista.js';
import { cheryl, cheryl_swim } from '../../art/cheryl.js';
import { isoSheet } from '../../engine/iso/sprites.js';

// The vista, drawn each frame per docs/art-opening.md. The script moves it
// along by setting times on `scene` (in the picture's own milliseconds).
function makeVista(g) {
  const art = {
    bowl: g.sheet(vista), cold: g.sheet(vista_gate_cold), rim: g.sheet(vista_rim), glow: g.sheet(vista_glow),
    moon: g.sheet(vista_moon), path: g.sheet(vista_path), twinkle: g.sheet(vista_twinkle), cheryl: g.sheet(vista_cheryl), pins: g.sheet(vista_pins),
  };
  const scene = { now: 0, glowAt: null, moonAt: null };
  const phases = VISTA_BASINS.map((_, i) => (i * 677) % 1180);
  scene.draw = (ctx, ms) => {
    scene.now = ms;
    ctx.drawImage(art.bowl.frame('bowl_dusk'), 0, 0);
    // As the moon clears the ridge, the Gate's apricot drains to violet: it's empty.
    if (scene.moonAt != null) {
      const t = (ms - scene.moonAt) / 1000;
      if (t >= 8) ctx.drawImage(art.cold.frame('cold_1'), 0, 0);
      else if (t >= 7) ctx.drawImage(art.cold.frame('cold_0'), 0, 0);
    }
    if (scene.glowAt != null && ms >= scene.glowAt) {
      const t = ms - scene.glowAt;
      ctx.drawImage(art.glow.frame(`glow_${t < 1200 ? 0 : t < 2400 ? 1 : 2}`), 116, 42);
    }
    if (scene.moonAt != null && ms >= scene.moonAt) {
      // Slowly to half up (about six seconds), then clear of the ridge.
      const t = (ms - scene.moonAt) / 1000;
      const cy = Math.max(56, t < 6 ? 104 - t * 3 : 86 - (t - 6) * 6);
      // It whitens as it climbs.
      const moon = cy < 64 ? 'moon_high' : cy < 80 ? 'moon_mid' : 'moon';
      // It climbs on a slant, up and to the right, away from the pins and the Gate.
      const cx = 176 + (104 - cy) * 0.35;
      ctx.drawImage(art.moon.frameAt(moon, ms), Math.round(cx) - 16, Math.round(cy) - 16);
    }
    ctx.drawImage(art.rim.frame('rim'), 0, 0);
    // Its path across the Bowl: faint once it's half up, then shimmering.
    if (scene.moonAt != null) {
      const t = (ms - scene.moonAt) / 1000;
      if (t >= 8) ctx.drawImage(art.path.frameAt('path', ms), 0, 0);
      else if (t >= 6) ctx.drawImage(art.path.frame('path_faint'), 0, 0);
    }
    VISTA_BASINS.forEach(([x, y], i) => ctx.drawImage(art.twinkle.frameAt('twinkle', ms + phases[i]), x - 3, y - 3));
    // The pins in the foreground, lined up on the Gate (over the twinkles on her roof).
    ctx.drawImage(art.pins.frame('pins'), 0, 0);
    ctx.drawImage(art.cheryl.frame('cheryl_tub'), 0, 128);
  };
  scene.draw.iso = (ctx, ms) => isoVista(scene, ctx, ms);
  return scene;
}

// The isometric view's moonrise (the art task's 640×480 layers, sheet
// 'moonrise'), on the same timeline as the SNES vista above.
const MOON_CLIMB_SECONDS = 16; // from the ridge to as high as it gets here
function isoVista(scene, ctx, ms) {
  const sheet = isoSheet('moonrise');
  const m = sheet && sheet.m;
  if (!m || !sheet.ready) {
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, 640, 480);
    return;
  }
  const blit = (name, x, y, alpha = 1) => {
    const f = sheet.raw(name);
    if (!f) return;
    ctx.globalAlpha = alpha;
    ctx.drawImage(f.img, f.sx, f.sy, f.w, f.h, Math.round(x - f.ax), Math.round(y - f.ay), f.w, f.h);
    ctx.globalAlpha = 1;
  };
  const sec = scene.moonAt != null && ms >= scene.moonAt ? (ms - scene.moonAt) / 1000 : -1;
  const t = sec < 0 ? -1 : Math.min(0.6, (sec / MOON_CLIMB_SECONDS) * 0.6);
  const { from, to } = m.moonRise;
  const mx = from[0] + (to[0] - from[0]) * Math.max(0, t);
  const my = from[1] + (to[1] - from[1]) * Math.max(0, t);
  // The layers in the sheet's own order (sky, glow, moon_halo, moon, far, path, town, fg, twinkle).
  const layers = {
    glow: () => scene.glowAt != null && ms >= scene.glowAt && blit('glow', m.glowAt[0], m.glowAt[1], sec >= 0 ? 0.6 : Math.min(1, (ms - scene.glowAt) / 1200)),
    moon_halo: () => t >= 0 && blit('moon_halo', mx, my, 0.9),
    moon: () => t >= 0 && blit(t < 0.18 ? 'moon_peach' : t < 0.42 ? 'moon_cream' : 'moon_white', mx, my),
    path: () => t >= 0 && blit('path', mx, m.pathTop, Math.min(1, t * 4)),
    twinkle: () => (m.twinkles || []).forEach(([x, y], i) => {
      if (Math.floor((ms + i * 677) / 400) % 3 === 0) blit(`twinkle_${i % 3}`, x, y);
    }),
  };
  for (const name of m.order || ['sky', 'glow', 'moon_halo', 'moon', 'far', 'path', 'town', 'fg', 'twinkle']) {
    if (layers[name]) layers[name]();
    else blit(name, 0, 0); // a full-screen layer
  }
}

export async function moonrise(g) {
  // 1.
  await g.think('Plug in. Water in. Sheets out of the way.', 'Now, the moon.');

  // 2. The costume: behind the chimney stack to change, the cardigan onto
  // the chair, and out in the striped bathing costume. Then the tub's edge.
  await g.movePlayer([8, 3]);
  g.facePlayer('up');
  await g.wait(0.9);
  g.sfx('give', { volume: 0.4 });
  g.setFlag('fx.cardigan', 1);
  g.setSprite('player', { sheet: cheryl_swim });
  await g.wait(0.6);
  g.facePlayer('down');
  await g.say('Neighbor', 'Not looking.', { auto: 1.1 });
  await g.movePlayer([3, 5]);
  g.facePlayer('right');
  await g.wait(0.3);
  // She sits on the tub's west rim, feet in the water (no floor shadow while she's up there).
  g.player.def.shadow = false;
  g.pose('player', 'rise_right', { offset: [-1, -12] });
  await g.wait(0.15);
  g.pose('player', 'sit_tub_right', { offset: [-2, -25] });
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
  await g.wait(1.2);

  // 5a. The pins, lined up on the Gate, before any glow.
  await g.think('Pins lined up. The Gate, dead between them.', 'Any second now.');
  await g.wait(0.6);

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

  // 12. The piano goes down the Squeeze. The camera gets there in time to see
  // it lurch, and go, in a cloud of dust down the stairs.
  await g.panCamera(15, 22, 6);
  await g.wait(0.3);
  g.shake(2, 0.3);
  g.sfx('piano_tumble');
  await g.wait(0.35);
  g.setFlag('piano.gone');
  for (const [x, y] of [[15, 23], [16, 23], [15, 24], [16, 25], [15, 25]]) {
    g.spawnEffect({ sprite: { sheet: fx, frame: 'dust' }, at: [x + 0.5, y], seconds: 0.4, layer: 'top' });
    await g.wait(0.22);
  }
  await g.wait(1.4);
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
  g.pose('player', 'rise_right', { offset: [-1, -12] });
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
  await g.say(nb, 'Did you FEEL that? The whole house went sideways!', "It's the bleach. I've overdone the bleach.", "...I'm looking. Sorry. I'll stop.");
  g.faceNpc(nb, 'right'); // she turns her back

  // 17.
  await g.think("Something's wrong.", 'Not wrong like a dropped stitch. Wrong like a step that isn\'t there.');

  // 18. Morning.
  g.stopLoop('wind', 2500);
  await g.fade('out', 2);
  await g.card('Morning.', 2);

  // 19. The morning state, in the flat.
  for (const f of ['fx.tub', 'fx.backline', 'fx.chimney', 'fx.cardigan', 'tub.full', 'tub.plugged']) g.setFlag(f, null);
  g.setSprite('player', { sheet: cheryl }); // dressed as usual in the morning
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
