// Engine smoke tests on the test yard and test shop. Each test also saves a
// screenshot in tests/screenshots/ for a human to look at.
import { test, expect } from '@playwright/test';
import { boot, snap, waitIdle, waitText, waitFor, readAll, readUntil, press, hold, clickTile, clickGame, shot, expectAt } from './helpers.js';

const YARD = '?map=test_yard&seed=1&flags=yard_intro';

test('title screen starts a new game', async ({ page }) => {
  await page.goto('/');
  await page.evaluate(() => localStorage.clear());
  const errors = await boot(page, '');
  await page.waitForTimeout(700);
  await shot(page, '01-title');
  expect((await snap(page)).scene).toBe('title');
  await page.keyboard.press('Enter');
  await waitFor(page, () => window.moonshine.snapshot().scene === 'world');
  await waitText(page); // the yard's intro thought
  const s = await snap(page);
  expect(s.map).toBe('test_yard');
  expect(s.text).toContain('engine test yard');
  await page.waitForTimeout(1200);
  await shot(page, '02-intro-thought');
  expect(errors).toEqual([]);
});

test('keyboard: walk, bump, talk, choose', async ({ page }) => {
  const errors = await boot(page, YARD);
  await waitIdle(page);
  await expectAt(page, 5, 6);
  // The sign blocks (6,6): pressing right only turns.
  await press(page, 'ArrowRight');
  await waitIdle(page);
  await expectAt(page, 5, 6);
  expect((await snap(page)).facing).toBe('right');
  // Walk down one and right two (WASD too), then face the Old Man and talk.
  await press(page, 's');
  await waitIdle(page);
  await press(page, 'ArrowRight');
  await waitIdle(page);
  await press(page, 'd');
  await waitIdle(page);
  await expectAt(page, 7, 7);
  await press(page, 'ArrowRight'); // blocked by the Old Man: face him
  await press(page, 'Space');
  await waitText(page);
  let s = await snap(page);
  expect(s.speaker).toBe('Old Man');
  expect(s.entities.find((e) => e.id === 'old_man').facing).toBe('left');
  await press(page, 'z'); // reveal
  await press(page, 'z'); // next
  await waitFor(page, () => !!window.moonshine.snapshot().choice);
  await page.waitForTimeout(500);
  await shot(page, '03-keyboard-choice');
  await press(page, 'ArrowDown');
  await press(page, 'Enter');
  await waitText(page);
  s = await snap(page);
  expect(s.text).toContain('wants you to think');
  await readAll(page);
  await waitIdle(page);
  expect(errors).toEqual([]);
});

test('keyboard: holding a direction walks continuously', async ({ page }) => {
  await boot(page, YARD);
  await waitIdle(page);
  // From (5,6) hold down along the path: 8 ticks per tile ≈ 133 ms.
  await hold(page, 'ArrowDown', 560);
  await waitIdle(page);
  const s = await snap(page);
  expect(s.x).toBe(5);
  expect(s.y).toBeGreaterThanOrEqual(9);
  expect(s.y).toBeLessThanOrEqual(11);
});

test('pointer: click to walk around obstacles', async ({ page }) => {
  const errors = await boot(page, YARD);
  await waitIdle(page);
  // Across the yard, behind the tree trunk at (11,4).
  await clickTile(page, 12, 3);
  await page.waitForTimeout(250);
  await shot(page, '04-click-walk-marker');
  await waitIdle(page);
  await expectAt(page, 12, 3);
  await page.waitForTimeout(100);
  await shot(page, '05-behind-canopy');
  // Click on water (unwalkable): walk to the nearest reachable spot instead.
  await clickTile(page, 4, 13);
  await waitIdle(page, 10000);
  const s = await snap(page);
  const d = Math.abs(s.x - 4) + Math.abs(s.y - 13);
  expect(d).toBeLessThanOrEqual(3);
  expect(errors).toEqual([]);
});

test('pointer: click NPC to walk over and talk; tap advances', async ({ page }) => {
  const errors = await boot(page, YARD);
  await waitIdle(page);
  await clickTile(page, 8, 7); // the Old Man
  await waitText(page);
  const s = await snap(page);
  expect(s.speaker).toBe('Old Man');
  expect(Math.abs(s.x - 8) + Math.abs(s.y - 7)).toBe(1);
  await page.waitForTimeout(900);
  await shot(page, '06-click-talk');
  // Tap anywhere advances; choose by clicking the option.
  await clickGame(page, 128, 100);
  await page.waitForTimeout(50);
  await clickGame(page, 128, 100);
  await waitFor(page, () => window.moonshine.textbox.active?.choice?.rects.length > 0);
  const opt = await page.evaluate(() => window.moonshine.textbox.active.choice.rects[0]);
  await clickGame(page, opt.x + opt.w / 2, opt.y + opt.h / 2);
  await waitFor(page, () => (window.moonshine.snapshot().text || '').includes('slower than the grass'));
  expect(errors).toEqual([]);
});

test('pointer: pick up key, use it on the chest from the inventory', async ({ page }) => {
  const errors = await boot(page, YARD);
  await waitIdle(page);
  await clickTile(page, 12, 10);
  await waitIdle(page);
  await clickTile(page, 13, 14); // the key on the ground
  await waitText(page);
  expect((await snap(page)).text).toContain('Got Brass Key');
  await page.waitForTimeout(600);
  await shot(page, '07-got-key');
  await readAll(page);
  await waitIdle(page);
  expect((await snap(page)).items).toEqual(['brass_key']);
  // Open the inventory with the on-screen button.
  await clickGame(page, 256 - 14, 14);
  await waitFor(page, () => window.moonshine.snapshot().inventoryOpen);
  await page.waitForTimeout(300);
  await shot(page, '08-inventory');
  // Tap the selected item again to use it.
  const r = await page.evaluate(() => window.moonshine.inventory.slotRect(0));
  await clickGame(page, r.x + 10, r.y + 10);
  await waitFor(page, () => window.moonshine.snapshot().holding === 'brass_key');
  await page.waitForTimeout(100);
  await shot(page, '09-holding-key');
  await clickTile(page, 18, 14); // walk (still holding the key)
  await waitIdle(page);
  expect((await snap(page)).holding).toBe('brass_key');
  await clickTile(page, 21, 15); // the chest
  await waitText(page, 10000);
  await readAll(page);
  await waitIdle(page);
  const s = await snap(page);
  expect(s.flags.chest_open).toBe(true);
  expect(s.items).toEqual(['letter']);
  await shot(page, '10-chest-open');
  expect(errors).toEqual([]);
});

test('keyboard only: inventory and use item on the faced thing', async ({ page }) => {
  await boot(page, '?map=test_yard&x=20&y=15&facing=right&items=brass_key&flags=yard_intro,got_key');
  await waitIdle(page);
  await press(page, 'x');
  await waitFor(page, () => window.moonshine.snapshot().inventoryOpen);
  await press(page, 'z');
  await waitFor(page, () => window.moonshine.snapshot().holding === 'brass_key');
  await press(page, 'z');
  await waitText(page);
  await readAll(page);
  await waitIdle(page);
  expect((await snap(page)).flags.chest_open).toBe(true);
});

test('door to the shop, counter talk, scripted sequence, and back', async ({ page }) => {
  const errors = await boot(page, '?map=test_yard&x=5&y=6&items=letter&flags=yard_intro,got_key,chest_open');
  await waitIdle(page);
  await clickTile(page, 5, 4); // the door
  await waitFor(page, () => window.moonshine.snapshot().map === 'test_house');
  await waitIdle(page);
  await expectAt(page, 4, 8);
  await shot(page, '11-shop');
  // Talk to the Shopkeeper across the counter by clicking them.
  await clickTile(page, 2, 3);
  await waitText(page);
  let s = await snap(page);
  expect(s.speaker).toBe('Shopkeeper');
  expect([s.x, s.y]).toEqual([2, 5]);
  await readAll(page);
  await waitIdle(page);
  // Use the letter on them with the keyboard: the scripted sequence.
  await press(page, 'x');
  await waitFor(page, () => window.moonshine.snapshot().inventoryOpen);
  await press(page, 'z');
  await press(page, 'z');
  // Read until the effects are on and the Shopkeeper notices the letter is blank.
  await readUntil(page, 'blank');
  await page.waitForTimeout(800);
  await shot(page, '12-wrongness-effects');
  await readAll(page, 'z', 40);
  await waitFor(page, () => window.moonshine.snapshot().flags.letter_delivered, null, 15000);
  await readAll(page);
  await waitIdle(page, 10000);
  s = await snap(page);
  expect(s.entities.find((e) => e.id === 'shopkeeper')).toMatchObject({ x: 2, y: 3 });
  // Leave by the doormat.
  await clickTile(page, 4, 9);
  await waitFor(page, () => window.moonshine.snapshot().map === 'test_yard');
  await waitIdle(page);
  await expectAt(page, 5, 5);
  expect(errors).toEqual([]);
});

test('edge exit keeps the offset; camera pans on first visit', async ({ page }) => {
  const errors = await boot(page, '?map=test_yard&x=17&y=15&flags=yard_intro');
  await waitIdle(page);
  await press(page, 'ArrowDown', 2);
  await waitFor(page, () => window.moonshine.snapshot().map === 'test_lane');
  await waitText(page, 10000);
  let s = await snap(page);
  expect([s.x, s.y]).toEqual([10, 1]);
  await page.waitForTimeout(1200);
  await shot(page, '13-lane-pan');
  await readAll(page);
  await waitIdle(page);
  await press(page, 'ArrowUp');
  await waitFor(page, () => window.moonshine.snapshot().map === 'test_yard');
  await waitIdle(page);
  s = await snap(page);
  expect([s.x, s.y]).toEqual([17, 16]);
  expect(errors).toEqual([]);
});

test('save on map change; Continue restores it', async ({ page }) => {
  await boot(page, '?map=test_yard&x=5&y=5&flags=yard_intro&save=1');
  await page.evaluate(() => localStorage.clear());
  await waitIdle(page);
  await press(page, 'ArrowUp');
  await waitFor(page, () => window.moonshine.snapshot().map === 'test_house');
  await waitIdle(page);
  await page.goto('/');
  await page.waitForFunction(() => window.moonshine && window.moonshine.scene);
  await page.waitForTimeout(500);
  await shot(page, '15-title-continue');
  await press(page, 'Enter');
  await waitFor(page, () => window.moonshine.snapshot().scene === 'world');
  const s = await snap(page);
  expect(s.map).toBe('test_house');
  expect([s.x, s.y]).toEqual([4, 8]);
  expect(s.flags.yard_intro).toBe(true);
});

test('debug overlay and screen effects render', async ({ page }) => {
  const errors = await boot(page, '?map=test_yard&x=12&y=8&debug=1&flags=yard_intro');
  await waitIdle(page);
  await shot(page, '14-debug-overlay');
  expect(errors).toEqual([]);
});
