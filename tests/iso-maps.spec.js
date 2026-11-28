// Every map renders and plays in the isometric view: each one loads, draws
// without errors, and the open floor tiles near Cheryl can be clicked. Screenshots
// of every map go to tests/screenshots/iso-maps/ for review.
import { test, expect } from '@playwright/test';
import { mkdirSync } from 'node:fs';
import { boot } from './helpers.js';

mkdirSync('tests/screenshots/iso-maps', { recursive: true });

test('every map renders in the isometric view, and clicks pick its tiles', async ({ page }, info) => {
  test.skip(info.project.name !== 'desktop', 'one browser is enough for the survey');
  test.setTimeout(240000);
  const errors = await boot(page, '?view=iso&map=cistern_court&seed=3');
  await page.waitForTimeout(500);
  const ids = await page.evaluate(() => Object.keys(window.moonshine.content.maps));
  const report = [];
  for (const id of ids) {
    const r = await page.evaluate((id) => {
      const g = window.moonshine;
      const w = g.world;
      try {
        // A quiet load: no scripts, the player at the map's spawn or a safe tile.
        const def = g.content.maps[id];
        const [sx, sy] = def.spawn || [Math.floor(g.content.maps[id].ground[0].length / 2), Math.floor(def.ground.length / 2)];
        w.loadMap(id, sx, sy, 'down');
        w.placeSafely(def);
        w.snapCamera();
        g.render();
        g.render();
      } catch (err) {
        return { id, error: String(err && err.stack || err) };
      }
      // Picking: open floor tiles within 3 of Cheryl, on screen, can be clicked
      // somewhere on their visible part (a tall thing in front may hide some).
      const p = w.player;
      let tried = 0;
      let missed = 0;
      for (let y = p.y - 3; y <= p.y + 3; y++) {
        for (let x = p.x - 3; x <= p.x + 3; x++) {
          if (!w.map.inBounds(x, y) || w.map.solid(x, y)) continue;
          const s = g.view.tileCenter(w, x, y);
          if (s.x < 20 || s.y < 70 || s.x > 620 || s.y > 460) continue;
          tried++;
          // Clickable somewhere: its center, or halfway to one of its corners.
          const pts = [[0, 0], [-16, 0], [16, 0], [0, -8], [0, 8]];
          const ok = pts.some(([dx, dy]) => { const k = g.view.pick(w, s.x + dx, s.y + dy); return k.tx === x && k.ty === y; });
          if (!ok) missed++;
        }
      }
      return { id, tried, missed };
    }, id);
    await page.screenshot({ path: `tests/screenshots/iso-maps/${id}.png` });
    report.push(r);
  }
  const broken = report.filter((r) => r.error);
  const lines = report.map((r) => (r.error ? `${r.id}: ERROR ${r.error.split('\n')[0]}` : `${r.id}: ${r.tried - r.missed}/${r.tried} nearby floor tiles clickable`));
  console.log(lines.join('\n'));
  expect(broken).toEqual([]);
  expect(errors).toEqual([]);
  // Most floor tiles near Cheryl must be clickable on every map.
  for (const r of report) if (r.tried >= 6) expect(r.missed / r.tried, `${r.id}: too many floor tiles can't be clicked`).toBeLessThan(0.25);
});
