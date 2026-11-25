// Touch-only play on a phone-sized screen, portrait and landscape.
import { test, expect } from '@playwright/test';
import { boot, snap, waitIdle, waitText, waitFor, tapTile, shot } from './helpers.js';

async function tapGame(page, gx, gy) {
  const p = await page.evaluate(([x, y]) => window.moonshine.display.toClient(x, y), [gx, gy]);
  await page.touchscreen.tap(p.x, p.y);
}

test('phone portrait: tap to walk, tap NPC, tap through text, inventory button', async ({ page }) => {
  const errors = await boot(page, '?map=test_street&seed=1&flags=street_intro');
  await waitIdle(page);
  await shot(page, 'm1-portrait');
  await tapTile(page, 12, 8);
  await waitIdle(page);
  expect([(await snap(page)).x, (await snap(page)).y]).toEqual([12, 8]);
  await tapTile(page, 9, 7); // Old Man
  await waitText(page);
  await page.waitForTimeout(900);
  await shot(page, 'm2-portrait-talk');
  for (let i = 0; i < 4 && !(await snap(page)).choice; i++) {
    await tapGame(page, 128, 60);
    await page.waitForTimeout(80);
  }
  await waitFor(page, () => window.moonshine.textbox.active?.choice?.rects.length > 0);
  const opt = await page.evaluate(() => window.moonshine.textbox.active.choice.rects[1]);
  await tapGame(page, opt.x + opt.w / 2, opt.y + opt.h / 2);
  for (let i = 0; i < 10 && ((await snap(page)).text || (await snap(page)).busy); i++) {
    await tapGame(page, 128, 60);
    await page.waitForTimeout(80);
  }
  await waitIdle(page);
  await tapGame(page, 256 - 14, 14);
  await waitFor(page, () => window.moonshine.snapshot().inventoryOpen);
  await page.waitForTimeout(200);
  await shot(page, 'm3-portrait-inventory');
  await tapGame(page, 128, 200); // outside the panel area closes? (inside desc box: stays)
  await tapGame(page, 4, 4);
  await waitFor(page, () => !window.moonshine.snapshot().inventoryOpen);
  expect(errors).toEqual([]);
});

test('phone landscape fits and plays', async ({ page }) => {
  await page.setViewportSize({ width: 915, height: 412 });
  const errors = await boot(page, '?map=test_street&seed=1&flags=street_intro');
  await waitIdle(page);
  await tapTile(page, 12, 9);
  await waitIdle(page);
  expect([(await snap(page)).x, (await snap(page)).y]).toEqual([12, 9]);
  await shot(page, 'm4-landscape');
  expect(errors).toEqual([]);
});

test('phone portrait: the big bag button below the frame opens the bag', async ({ page }) => {
  await boot(page, '?map=test_street&seed=1&flags=street_intro,saw_canal');
  await waitIdle(page);
  const bar = await page.evaluate(() => window.moonshine.display.touchBar);
  expect(bar).not.toBe(null);
  const css = await page.evaluate((r) => window.moonshine.display.toClient(r.x + r.w / 2, r.y + r.h / 2), bar);
  const size = await page.evaluate((r) => r.w * window.moonshine.display.scale / window.moonshine.display.dpr, bar);
  expect(size).toBeGreaterThanOrEqual(44);
  await shot(page, 'm5-portrait-touch-bar');
  await page.touchscreen.tap(css.x, css.y);
  await waitFor(page, () => window.moonshine.snapshot().inventoryOpen);
});
