// Engine smoke tests on the test street, shop, and lane. Each test also saves a
// screenshot in tests/screenshots/ for a human to look at.
import { test, expect } from '@playwright/test';
import { boot, snap, waitIdle, waitText, waitFor, readAll, readUntil, press, hold, clickTile, clickGame, shot, expectAt } from './helpers.js';

const STREET = '?map=test_street&seed=1&flags=street_intro,saw_canal';

test('title screen starts a new game', async ({ page }) => {
  await page.goto('/');
  await page.evaluate(() => localStorage.clear());
  const errors = await boot(page, '');
  await page.waitForTimeout(700);
  await shot(page, '01-title');
  expect((await snap(page)).scene).toBe('title');
  await page.keyboard.press('Enter');
  await waitFor(page, () => window.moonshine.snapshot().scene === 'world');
  await waitText(page); // the street's intro thought
  const s = await snap(page);
  expect(s.map).toBe('test_street');
  expect(s.text).toContain('engine test street');
  await page.waitForTimeout(1200);
  await shot(page, '02-intro-thought');
  await press(page, 'z');
  await press(page, 'z');
  await waitFor(page, () => !!window.moonshine.snapshot().hint);
  await page.waitForTimeout(600);
  await shot(page, '02b-controls-hint');
  expect(errors).toEqual([]);
});

test('keyboard: walk, bump, talk, choose, receive an item', async ({ page }) => {
  const errors = await boot(page, STREET);
  await waitIdle(page);
  await expectAt(page, 5, 7);
  await press(page, 'ArrowRight');
  await waitIdle(page);
  await expectAt(page, 6, 7);
  // The lamp post blocks (7,7): pressing right only turns.
  await press(page, 'ArrowRight');
  await waitIdle(page);
  await expectAt(page, 6, 7);
  expect((await snap(page)).facing).toBe('right');
  // Around the lamp (WASD too), then face the Old Man and talk.
  for (const k of ['s', 'ArrowRight', 'd', 'w']) {
    await press(page, k);
    await waitIdle(page);
  }
  await expectAt(page, 8, 7);
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
  await waitFor(page, () => (window.moonshine.snapshot().text || '').includes('wants you to think'));
  await readUntil(page, 'Got Sealed Letter');
  await readAll(page);
  await waitIdle(page);
  s = await snap(page);
  expect(s.items).toEqual(['letter']);
  // Talking again: the look counter gives a different line.
  await press(page, 'z');
  await waitText(page);
  expect((await snap(page)).text).toContain('The shop');
  expect((await snap(page)).looks['test_street:old_man']).toBe(1);
  expect(errors).toEqual([]);
});

test('keyboard: holding a direction walks continuously', async ({ page }) => {
  await boot(page, STREET);
  await waitIdle(page);
  // From (5,7) hold down, down the stairs: 12 ticks per tile, 200 ms.
  await hold(page, 'ArrowDown', 760);
  await waitIdle(page);
  const s = await snap(page);
  expect(s.x).toBe(5);
  expect(s.y).toBeGreaterThanOrEqual(10);
  expect(s.y).toBeLessThanOrEqual(12);
});

test('pointer: click to walk around obstacles', async ({ page }) => {
  const errors = await boot(page, STREET);
  await waitIdle(page);
  // Past the lamp and the Old Man, to just behind the crate.
  await clickTile(page, 15, 8);
  await waitIdle(page);
  await clickTile(page, 20, 7);
  await page.waitForTimeout(250);
  await shot(page, '04-click-walk-marker');
  await waitIdle(page);
  await expectAt(page, 20, 7);
  // Click the canal (unwalkable): walk to the nearest reachable spot instead,
  // down the stairs to the quay.
  await clickTile(page, 10, 13);
  await waitIdle(page, 10000);
  await expectAt(page, 10, 12);
  await shot(page, '05-quay');
  expect(errors).toEqual([]);
});

test('pointer: click NPC to walk over and talk; tap advances', async ({ page }) => {
  const errors = await boot(page, STREET);
  await waitIdle(page);
  await clickTile(page, 9, 7); // the Old Man
  await waitText(page);
  const s = await snap(page);
  expect(s.speaker).toBe('Old Man');
  expect(Math.abs(s.x - 9) + Math.abs(s.y - 7)).toBe(1);
  await page.waitForTimeout(900);
  await shot(page, '06-click-talk');
  // Tap anywhere advances; choose by clicking the option.
  await clickGame(page, 128, 100);
  await page.waitForTimeout(50);
  await clickGame(page, 128, 100);
  await waitFor(page, () => window.moonshine.textbox.active?.choice?.rects.length > 0);
  const opt = await page.evaluate(() => window.moonshine.textbox.active.choice.rects[0]);
  await clickGame(page, opt.x + opt.w / 2, opt.y + opt.h / 2);
  await waitFor(page, () => (window.moonshine.snapshot().text || '').includes('slower than the water'));
  expect(errors).toEqual([]);
});

test('pointer: look counter on the cat', async ({ page }) => {
  await boot(page, STREET);
  await waitIdle(page);
  const lines = [];
  for (let i = 0; i < 4; i++) {
    await clickTile(page, 10, 9);
    await waitText(page);
    lines.push((await snap(page)).text);
    await readAll(page);
    await waitIdle(page);
  }
  expect(lines[0]).toContain('pretending I');
  expect(lines[1]).toContain('Still pretending');
  expect(lines[2]).toContain('understanding');
  expect(lines[3]).toContain('understanding');
});

test('pointer: pick up key, use it on the locked door, go in', async ({ page }) => {
  const errors = await boot(page, STREET);
  await waitIdle(page);
  await clickTile(page, 3, 12); // the key on the quay
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
  await clickTile(page, 12, 7); // walk (still holding the key)
  await waitIdle(page);
  expect((await snap(page)).holding).toBe('brass_key');
  await shot(page, '09-holding-key');
  await clickTile(page, 12, 4); // the locked door
  await waitText(page, 10000);
  await readAll(page);
  await waitIdle(page);
  expect((await snap(page)).flags.door_unlocked).toBe(true);
  // Now the door is an exit.
  await clickTile(page, 12, 4);
  await waitFor(page, () => window.moonshine.snapshot().map === 'test_shop');
  expect(errors).toEqual([]);
});

test('keyboard only: inventory and use item on the faced thing', async ({ page }) => {
  await boot(page, '?map=test_street&x=12&y=5&facing=up&items=brass_key&flags=street_intro,got_key');
  await waitIdle(page);
  await press(page, 'x');
  await waitFor(page, () => window.moonshine.snapshot().inventoryOpen);
  await press(page, 'z');
  await waitFor(page, () => window.moonshine.snapshot().holding === 'brass_key');
  await press(page, 'z');
  await waitText(page);
  await readAll(page);
  await waitIdle(page);
  expect((await snap(page)).flags.door_unlocked).toBe(true);
});

test('shop: counter talk, scripted sequence, night afterwards', async ({ page }) => {
  const errors = await boot(page, '?map=test_street&x=12&y=5&facing=up&items=letter&flags=street_intro,door_unlocked');
  await waitIdle(page);
  expect((await snap(page)).lighting).toBe('dusk');
  await press(page, 'ArrowUp');
  await waitFor(page, () => window.moonshine.snapshot().map === 'test_shop');
  await waitIdle(page);
  await expectAt(page, 4, 8);
  await shot(page, '10-shop');
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
  await readUntil(page, 'blank');
  await page.waitForTimeout(800);
  await shot(page, '11-wrongness-effects');
  await readAll(page, 'z', 40);
  await waitFor(page, () => window.moonshine.snapshot().flags.letter_delivered, null, 15000);
  await readAll(page);
  await waitIdle(page, 10000);
  s = await snap(page);
  expect(s.entities.find((e) => e.id === 'shopkeeper')).toMatchObject({ x: 2, y: 3 });
  // Leave by the doormat: the street is now lit for night.
  await clickTile(page, 4, 9);
  await waitFor(page, () => window.moonshine.snapshot().map === 'test_street');
  await waitIdle(page);
  await expectAt(page, 12, 5);
  expect((await snap(page)).lighting).toBe('night');
  await shot(page, '12-night');
  expect(errors).toEqual([]);
});

test('moonrise demo: picture, auto shouts, card, lighting', async ({ page }) => {
  const errors = await boot(page, '?map=test_street&x=12&y=7&flags=street_intro&run=moonrise');
  await readUntil(page, 'Now, the moon');
  await press(page, 'z');
  await press(page, 'z');
  await waitFor(page, () => window.moonshine.snapshot().picture, null, 10000);
  await page.waitForTimeout(3500);
  await shot(page, '13-vista');
  await readUntil(page, 'Gate');
  await readAll(page, 'z', 3);
  // Auto boxes advance on their own: don't press anything.
  await waitFor(page, () => window.moonshine.snapshot().speaker === 'Sweaty Kid', null, 10000);
  expect((await snap(page)).lighting).toBe('night');
  expect((await snap(page)).picture).toBe(false);
  await page.waitForTimeout(300);
  await shot(page, '14-auto-shout');
  await waitFor(page, () => window.moonshine.snapshot().speaker === 'Neighbor', null, 5000);
  await waitFor(page, () => !!window.moonshine.snapshot().card, null, 10000);
  await shot(page, '15-card');
  await waitFor(page, () => (window.moonshine.snapshot().text || '').includes('know why'), null, 10000);
  expect((await snap(page)).lighting).toBe('day');
  expect(errors).toEqual([]);
});

test('patrolling NPC stops to talk', async ({ page }) => {
  await boot(page, STREET);
  await waitIdle(page);
  await clickTile(page, 13, 8);
  await waitIdle(page);
  await page.waitForTimeout(1000);
  const before = (await snap(page)).entities.find((e) => e.id === 'kid');
  expect(before.x !== 14 || before.y !== 6).toBe(true); // he's been moving
  const kid = await page.evaluate(() => { const k = window.moonshine.world.byId.get('kid'); return [k.x, k.y]; });
  await clickTile(page, kid[0], kid[1]);
  await waitText(page, 10000);
  expect((await snap(page)).speaker).toBe('Sweaty Kid');
  const at = (await snap(page)).entities.find((e) => e.id === 'kid');
  await page.waitForTimeout(800);
  expect((await snap(page)).entities.find((e) => e.id === 'kid')).toMatchObject({ x: at.x, y: at.y });
});

test('edge exit keeps the offset; camera pans on first visit', async ({ page }) => {
  const errors = await boot(page, '?map=test_street&x=17&y=16&flags=street_intro,saw_canal');
  await waitIdle(page);
  await press(page, 'ArrowDown');
  await waitFor(page, () => window.moonshine.snapshot().map === 'test_lane');
  await waitText(page, 10000);
  let s = await snap(page);
  expect([s.x, s.y]).toEqual([9, 1]);
  await page.waitForTimeout(1200);
  await shot(page, '16-lane-pan');
  await readAll(page);
  await waitIdle(page);
  await press(page, 'ArrowUp');
  await waitFor(page, () => window.moonshine.snapshot().map === 'test_street');
  await waitIdle(page);
  s = await snap(page);
  expect([s.x, s.y]).toEqual([17, 16]);
  expect(errors).toEqual([]);
});

test('save on map change; Continue restores it', async ({ page }) => {
  await boot(page, '?map=test_street&x=12&y=5&flags=street_intro,door_unlocked&save=1');
  await page.evaluate(() => localStorage.clear());
  await waitIdle(page);
  await press(page, 'ArrowUp');
  await waitFor(page, () => window.moonshine.snapshot().map === 'test_shop');
  await waitIdle(page);
  await page.goto('/');
  await page.waitForFunction(() => window.moonshine && window.moonshine.scene);
  await page.waitForTimeout(500);
  await shot(page, '17-title-continue');
  await press(page, 'Enter');
  await waitFor(page, () => window.moonshine.snapshot().scene === 'world');
  const s = await snap(page);
  expect(s.map).toBe('test_shop');
  expect([s.x, s.y]).toEqual([4, 8]);
  expect(s.flags.street_intro).toBe(true);
});

test('debug overlay renders', async ({ page }) => {
  const errors = await boot(page, '?map=test_street&x=12&y=8&debug=1&flags=street_intro');
  await waitIdle(page);
  await shot(page, '18-debug-overlay');
  expect(errors).toEqual([]);
});
