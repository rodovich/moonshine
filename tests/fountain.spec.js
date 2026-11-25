// The client hit a freeze approaching the roped-off Fountain (Act 4). Walk
// into the Fountain from all four sides, by keyboard and by pointer, in every
// state the Fountain has, and check the game never hangs: no page errors, the
// loop keeps ticking, and no scene is left waiting.
import { test, expect } from '@playwright/test';

const STATES = {
  'act 2 (wet)': 'act1.moonrise,act2.started,piano.slid,got.crowbar',
  'act 3 end (stopped)': 'act1.moonrise,act2.started,act2.done,piano.slid,counter.left,step.open,act3.surfaced,act3.done,founders.unbolted,halls.valve',
  'act 4 (cordoned, Mayor on guard)': 'act2.started,piano.slid,counter.left,step.open,act4.started',
  'act 4 (Mayor at the Crown)': 'act2.started,piano.slid,counter.left,step.open,act4.started,mayor.atCrown',
  'act 4 (pumps burst)': 'act2.started,piano.slid,counter.left,step.open,act4.started,pumps.burst,cellar.shut',
  'act 5': 'act2.started,piano.slid,counter.left,step.open,act4.started,act5.started',
  'act 6 epilogue': 'act1.moonrise,act2.started,piano.slid,step.open,counter.left,act6.started,epilogue,epi.left',
};
const APPROACHES = [[11, 14, 'ArrowUp'], [11, 3, 'ArrowDown'], [6, 8, 'ArrowRight'], [17, 8, 'ArrowLeft']];

for (const [name, flags] of Object.entries(STATES)) {
  test(`fountain never hangs: ${name}`, async ({ page }) => {
    test.setTimeout(120000);
    const errors = [];
    page.on('pageerror', (e) => errors.push(e.message));
    page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
    // Read any lines; let scenes (shakes, walks, map changes) finish, up to 15 s.
    const read = async () => {
      const end = Date.now() + 15000;
      while (Date.now() < end) {
        const s = await page.evaluate(() => window.moonshine.snapshot());
        if (s.idle) return; // no scene, no text, not walking
        if (s.text) await page.keyboard.press(s.choice ? 'Enter' : 'z');
        await page.waitForTimeout(100);
      }
    };
    for (const [x, y, key] of APPROACHES) {
      await page.goto(`/?map=fountain_square&x=${x}&y=${y}&flags=${flags}&seed=3`);
      await page.waitForFunction(() => window.moonshine && window.moonshine.world);
      await page.waitForTimeout(300);
      await read();
      // Keyboard: walk in, then push on.
      for (let i = 0; i < 8; i++) {
        await page.keyboard.press(key);
        await page.waitForTimeout(120);
        await read();
      }
      await page.keyboard.down(key);
      await page.waitForTimeout(1200);
      await page.keyboard.up(key);
      await read();
      // Pointer: click the Fountain's centre.
      const p = await page.evaluate(() => window.moonshine.tileToClient(11, 9));
      await page.mouse.click(p.x, p.y);
      await page.waitForTimeout(2500);
      await read();
      const t0 = await page.evaluate(() => window.moonshine.ticks);
      await page.waitForTimeout(300);
      const s = await page.evaluate(() => ({ ticks: window.moonshine.ticks, busy: window.moonshine.world.busy }));
      expect(s.ticks - t0, `${name} from (${x},${y}): the loop stopped`).toBeGreaterThan(5);
      expect(s.busy, `${name} from (${x},${y}): a scene never finished`).toBe(0);
    }
    expect(errors).toEqual([]);
  });
}
