// Frame-time check on the stress map: 64×48 tiles, 40 wandering people,
// night lighting with lamps. Prints the numbers; fails only if far over
// budget (16.7 ms per frame at 60 Hz).
import { test, expect } from '@playwright/test';
import { boot, waitIdle } from './helpers.js';

async function measure(page, seconds) {
  return page.evaluate(async (seconds) => {
    const g = window.moonshine;
    const gaps = [];
    let last = performance.now();
    const end = last + seconds * 1000;
    let worstUpdate = 0;
    let worstRender = 0;
    while (performance.now() < end) {
      await new Promise((r) => requestAnimationFrame(r));
      const now = performance.now();
      gaps.push(now - last);
      last = now;
      worstUpdate = Math.max(worstUpdate, g.perf.update);
      worstRender = Math.max(worstRender, g.perf.render);
    }
    gaps.sort((a, b) => a - b);
    return {
      update: +g.perf.update.toFixed(2),
      render: +g.perf.render.toFixed(2),
      worstUpdate: +worstUpdate.toFixed(2),
      worstRender: +worstRender.toFixed(2),
      frames: gaps.length,
      medianGap: +gaps[Math.floor(gaps.length / 2)].toFixed(1),
      p95Gap: +gaps[Math.floor(gaps.length * 0.95)].toFixed(1),
    };
  }, seconds);
}

test('stress map stays within the frame budget', async ({ page }, info) => {
  await boot(page, '?map=test_big&seed=3');
  await waitIdle(page);
  await page.keyboard.down('ArrowRight');
  const walking = await measure(page, 3);
  await page.keyboard.up('ArrowRight');
  // The heaviest effects at once: darkness with lights, a hue shift, a wobble.
  await page.evaluate(() => {
    const w = window.moonshine.world;
    w.mapDef.darkness = 0.9;
    w.mapDef.playerLight = { radius: 3, color: 'relic_cyan' };
    w.effects.hue = 90;
    w.effects.waveAmp = 2;
  });
  const effects = await measure(page, 2);
  console.log(`[perf ${info.project.name}] walking`, JSON.stringify(walking));
  console.log(`[perf ${info.project.name}] effects`, JSON.stringify(effects));
  expect(walking.render + walking.update).toBeLessThan(8);
  expect(effects.render + effects.update).toBeLessThan(12);
});

test('stress map on a slow CPU (Chromium throttled 6x, about a low-end phone)', async ({ page, browserName }, info) => {
  test.skip(browserName !== 'chromium', 'CPU throttling needs Chromium');
  const cdp = await page.context().newCDPSession(page);
  await cdp.send('Emulation.setCPUThrottlingRate', { rate: 6 });
  await boot(page, '?map=test_big&seed=3');
  await waitIdle(page, 20000);
  await page.keyboard.down('ArrowRight');
  const walking = await measure(page, 3);
  await page.keyboard.up('ArrowRight');
  await page.evaluate(() => {
    const w = window.moonshine.world;
    w.mapDef.darkness = 0.9;
    w.mapDef.playerLight = 3;
    w.effects.hue = 90;
  });
  const effects = await measure(page, 2);
  console.log(`[perf ${info.project.name} 6x] walking`, JSON.stringify(walking));
  console.log(`[perf ${info.project.name} 6x] effects`, JSON.stringify(effects));
  expect(walking.render + walking.update).toBeLessThan(16);
});
