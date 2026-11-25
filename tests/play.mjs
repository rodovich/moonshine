// Dev tool: load the game at a query, run a sequence of steps, print errors,
// and save screenshots. Usage:
//   node tests/play.mjs "<query>" step step ...
// Steps: wait:<ms>, key:<Key>, keys:<Key>x<n>, click:<tx>,<ty> (a map tile),
//   eval:<js> (prints the result), shot:<file.png>, read (advance all text with z),
//   until:<substring> (advance text until it shows).
import { chromium } from '@playwright/test';
import { spawn } from 'node:child_process';

const [query = '', ...steps] = process.argv.slice(2);
const port = 8126 + Math.floor(Math.random() * 50);
const server = spawn(process.execPath, [new URL('./serve.js', import.meta.url).pathname, String(port)], { stdio: 'ignore' });
await new Promise((r) => setTimeout(r, 400));
const browser = await chromium.launch();
const snap = (page) => page.evaluate(() => window.moonshine.snapshot());
try {
  const page = await browser.newPage({ viewport: { width: 512, height: 448 } });
  page.on('console', (m) => { if (m.type() === 'error' || m.type() === 'warning') console.log(`[${m.type()}] ${m.text()}`); });
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
    else if (cmd === 'read') {
      for (let i = 0; i < 60; i++) {
        const s = await snap(page);
        if (!s.text && !s.busy) break;
        if (s.text) { console.log(`  > ${s.speaker ? s.speaker + ': ' : ''}${s.text.replace(/\n/g, ' ')}`); await page.keyboard.press('z'); await page.waitForTimeout(80); await page.keyboard.press('z'); }
        await page.waitForTimeout(120);
      }
    } else if (cmd === 'until') {
      for (let i = 0; i < 400; i++) {
        const s = await snap(page);
        if (s.text && s.text.includes(arg)) break;
        if (s.text) await page.keyboard.press('z');
        await page.waitForTimeout(100);
      }
    }
  }
} finally {
  await browser.close();
  server.kill();
}
