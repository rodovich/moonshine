// Dev tool: load the game at a query, run a sequence of steps, print errors,
// and save screenshots. Usage:
//   node tests/play.mjs "<query>" step step ...
// Steps: wait:<ms>, key:<Key>, keys:<Key>x<n>, click:<tx>,<ty> (a map tile),
//   eval:<js> (prints the result), shot:<file.png>, read (advance all text with z,
//   printing it), until:<substring> (advance text until it shows),
//   act:<entityId>[,<itemId>] (interact with, or use an item on, an entity, then read),
//   goto:<x>,<y> (walk there by the game's own pathfinding, as clicks would).
import { chromium } from '@playwright/test';
import { spawn } from 'node:child_process';

const [query = '', ...steps] = process.argv.slice(2);
const port = 8126 + Math.floor(Math.random() * 50);
const server = spawn(process.execPath, [new URL('./serve.js', import.meta.url).pathname, String(port)], { stdio: 'ignore' });
await new Promise((r) => setTimeout(r, 400));
const browser = await chromium.launch();
const snap = (page) => page.evaluate(() => window.moonshine.snapshot());
async function read(page) {
  for (let i = 0; i < 400; i++) {
    const s = await snap(page);
    if (!s.text && !s.busy) { await page.waitForTimeout(150); const t = await snap(page); if (!t.text && !t.busy) break; }
    if (s.text) {
      console.log(`  > ${s.speaker ? s.speaker + ': ' : ''}${s.text.replace(/\n/g, ' ')}`);
      await page.keyboard.press('z'); await page.waitForTimeout(80); await page.keyboard.press('z');
    }
    await page.waitForTimeout(120);
  }
}
try {
  const page = await browser.newPage({ viewport: { width: 512, height: 448 } });
  page.on('console', (m) => { if (m.type() === 'error' || (m.type() === 'warning' && !/\[sound\]/.test(m.text()))) console.log(`[${m.type()}] ${m.text()}`); });
  page.on('pageerror', (e) => console.log(`[pageerror] ${e.message}`));
  await page.goto(`http://localhost:${port}/${query}`);
  await page.waitForFunction(() => window.moonshine && window.moonshine.scene);
  for (const step of steps) {
    const [cmd, ...rest] = step.split(':');
    const arg = rest.join(':');
    if (cmd === 'wait') await page.waitForTimeout(Number(arg));
    else if (cmd === 'key') { await page.keyboard.press(arg); await page.waitForTimeout(60); }
    else if (cmd === 'keys') {
      const [k, n] = arg.split('x');
      for (let i = 0; i < Number(n); i++) { await page.keyboard.press(k); await page.waitForTimeout(250); }
    } else if (cmd === 'click') {
      const [x, y] = arg.split(',').map(Number);
      const p = await page.evaluate(([x, y]) => window.moonshine.tileToClient(x, y), [x, y]);
      await page.mouse.click(p.x, p.y);
    } else if (cmd === 'eval') console.log(JSON.stringify(await page.evaluate(arg)));
    else if (cmd === 'shot') await page.screenshot({ path: arg });
    else if (cmd === 'read') await read(page);
    else if (cmd === 'act') {
      const [id, item] = arg.split(',');
      console.log(`-- ${id}${item ? ' + ' + item : ''}`);
      const ok = await page.evaluate(([id, item]) => {
        const w = window.moonshine.world; const e = w.entity(id);
        if (!e) return false;
        const spots = w.interactSpots(e);
        const p = w.player;
        if (!spots.some((s) => s.x === p.x && s.y === p.y)) {
          const path = w.pathFor(p, spots.map((s) => [s.x, s.y]));
          if (path && path.length) { const [x, y] = path[path.length - 1]; p.x = p.fromX = x; p.y = p.fromY = y; w.snapCamera(); }
        }
        w.run(() => w.interactWith(e, item || null));
        return true;
      }, [id, item]);
      if (!ok) console.log(`   (no entity ${id})`);
      await page.waitForTimeout(100);
      await read(page);
    } else if (cmd === 'goto') {
      const [x, y] = arg.split(',').map(Number);
      await page.evaluate(([x, y]) => window.moonshine.world.api.place('player', x, y), [x, y]);
      await page.waitForTimeout(100);
    } else if (cmd === 'walk') {
      // walk:<Key>,<map> — press the key until the map changes, reading any text on the way.
      const [key, map] = arg.split(',');
      for (let i = 0; i < 200; i++) {
        const s = await snap(page);
        if (s.map === map) break;
        if (s.text) { console.log(`  > ${s.text.replace(/\n/g, ' ')}`); await page.keyboard.press('z'); await page.waitForTimeout(80); await page.keyboard.press('z'); await page.waitForTimeout(150); continue; }
        await page.keyboard.down(key); await page.waitForTimeout(200); await page.keyboard.up(key);
      }
    } else if (cmd === 'until') {
      for (let i = 0; i < 600; i++) {
        const s = await snap(page);
        if (s.text && s.text.replace(/\s+/g, ' ').includes(arg)) break;
        if (s.text) await page.keyboard.press('z');
        await page.waitForTimeout(100);
      }
    }
  }
} finally {
  await browser.close();
  server.kill();
}
