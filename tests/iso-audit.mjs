// Isometric click audit: for each state, every interactable entity's drawn art
// (scene pieces and floor/wall cells over its footprint, or its own sprite)
// is sampled and picked; reports entities no click reaches, art that picks a
// different entity, and props drawn with nothing behind them.
// Usage (from the repo root): node /tmp/isoaudit.mjs "<query>" ...
import { chromium } from '@playwright/test';
import { spawn } from 'node:child_process';
import { resolve } from 'node:path';

const root = process.cwd();
const port = 8300 + Math.floor(Math.random() * 50);
const server = spawn(process.execPath, [resolve(root, 'tests/serve.js'), String(port)], { stdio: 'ignore' });
await new Promise((r) => setTimeout(r, 400));
const browser = await chromium.launch();
try {
  for (const query of process.argv.slice(2)) {
    const page = await browser.newPage({ viewport: { width: 640, height: 480 } });
    page.on('pageerror', (e) => console.log(`[pageerror] ${e.message}`));
    await page.goto(`http://localhost:${port}/${query}`);
    await page.waitForFunction(() => window.moonshine && window.moonshine.scene);
    await page.waitForTimeout(2500);
    console.log(`\n=== ${query}`);
    const ids = await page.evaluate(() => {
      const w = window.moonshine.world;
      return w.entities.filter((e) => !e.isPlayer && e.visible && (e.def.interact || e.def.look || e.def.looks || e.def.use)).map((e) => e.id);
    });
    const unclaimed = new Map();
    for (const id of ids) {
      const r = await page.evaluate(async (id) => {
        const w = window.moonshine.world; const v = window.moonshine.view;
        const e = w.entity(id);
        const spots = w.interactSpots(e);
        const path = w.pathFor(w.player, spots.map((s) => [s.x, s.y]));
        if (path && path.length) { const [x, y] = path[path.length - 1]; w.api.place('player', x, y); }
        await new Promise((r) => setTimeout(r, 250));
        const R = v.renderer;
        const inFoot = (x, y) => x >= e.x && y >= e.y && x < e.x + e.w && y < e.y + e.h;
        const rects = [];
        for (const h of R.hits) {
          if (h.type === 'd' && h.d.layer >= 0.1) {
            let over = false;
            for (let y = h.d.y0; y < h.d.y0 + h.d.fd; y++) for (let x = h.d.x0; x < h.d.x0 + h.d.fw; x++) if (inFoot(x, y)) over = true;
            if (over) rects.push(['d:' + h.d.f, h.rect]);
          } else if (h.type === 'ent' && h.e === e) rects.push(['sprite', h.rect]);
        }
        let hits = 0, other = {}, samples = 0;
        const pts = [];
        for (const [, rc] of rects) for (let i = 1; i < 8; i++) for (let j = 1; j < 8; j++) pts.push([rc.x + (rc.w * i) / 8, rc.y + (rc.h * j) / 8]);
        // Floor/wall cells of the footprint too: sample around each tile's projected point.
        for (let y = e.y; y < e.y + e.h; y++) for (let x = e.x; x < e.x + e.w; x++) {
          const c = window.moonshine.tileToClient(x, y);
          const cv = document.querySelector('canvas').getBoundingClientRect();
          const sx = ((c.x - cv.left) / cv.width) * 640, sy = ((c.y - cv.top) / cv.height) * 480;
          pts.push([sx, sy]);
        }
        for (const [sx, sy] of pts) {
          if (sx < 0 || sy < 0 || sx >= 640 || sy >= 480) continue;
          const k = v.pick(w, sx, sy);
          samples++;
          if (k.entity === e) hits++;
          else if (k.entity) other[k.entity.id] = (other[k.entity.id] || 0) + 1;
        }
        return { pieces: rects.map((r) => r[0]), hits, samples, other, at: [e.x, e.y, e.w, e.h] };
      }, id);
      const flag = r.hits === 0 ? 'UNCLICKABLE' : '';
      const others = Object.keys(r.other).length ? ` other=${JSON.stringify(r.other)}` : '';
      if (flag || others) console.log(`${flag || 'ok'} ${id} ${JSON.stringify(r.at)} hits ${r.hits}/${r.samples} pieces ${r.pieces.join(',')}${others}`);
    }
    // Props drawn with no entity under any of their pixels.
    const orphans = await page.evaluate(() => {
      const w = window.moonshine.world; const v = window.moonshine.view;
      const out = new Set();
      const seen = new Set();
      for (const h of v.renderer.hits) {
        if (h.type !== 'd' || h.d.layer < 1 || seen.has(h.d)) continue;
        seen.add(h.d);
        let any = false;
        for (let i = 1; i < 6 && !any; i++) for (let j = 1; j < 6 && !any; j++) {
          const k = v.pick(w, h.rect.x + (h.rect.w * i) / 6, h.rect.y + (h.rect.h * j) / 6);
          if (k.entity) any = true;
        }
        if (!any) out.add(`${h.d.f}@${h.d.x0},${h.d.y0}`);
      }
      return [...out];
    });
    if (orphans.length) console.log(`props with no hotspot on screen here: ${orphans.join(' ')}`);
    await page.close();
  }
} finally {
  await browser.close();
  server.kill();
}
