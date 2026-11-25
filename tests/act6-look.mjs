// Dev tool: screenshots of Act 6's epilogue maps (each resident recast with
// their morning-after lines), for checking placements in place.
//   node tests/act6-look.mjs <dir>
import { chromium } from '@playwright/test';
import { spawn } from 'node:child_process';

const dir = process.argv[2] || '/tmp';
const FLAGS = 'act1.moonrise,act2.started,piano.slid,step.open,counter.left,basin.inside,act3.started,act3.surfaced,founders.unbolted,act6.started,epilogue,epi.leftCourt,epi.race';
const SCENES = [
  ['fountain_square', 15, 12], ['shop', 4, 5], ['crown', 11, 12], ['archive', 7, 7], ['crypt', 3, 4], ['lamp_street', 12, 8], ['hundred_steps', 9, 22],
];
const port = 8126 + Math.floor(Math.random() * 50);
const server = spawn(process.execPath, [new URL('./serve.js', import.meta.url).pathname, String(port)], { stdio: 'ignore' });
await new Promise((r) => setTimeout(r, 400));
const browser = await chromium.launch();
try {
  for (const [map, x, y] of SCENES) {
    const page = await browser.newPage({ viewport: { width: 512, height: 448 } });
    page.on('console', (m) => { if (m.type() === 'error' || (m.type() === 'warning' && !m.text().includes('scrape'))) console.log(`[${map}] ${m.text()}`); });
    page.on('pageerror', (e) => console.log(`[${map}] ${e.message}`));
    await page.goto(`http://localhost:${port}/?map=${map}&x=${x}&y=${y}&flags=${FLAGS}`);
    await page.waitForFunction(() => window.moonshine && window.moonshine.snapshot().scene === 'world');
    await page.waitForTimeout(1200);
    await page.screenshot({ path: `${dir}/epi_${map}.png` });
    await page.close();
  }
} finally {
  await browser.close();
  server.kill();
}
