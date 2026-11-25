// Dev tool: screenshots of Act 3 states for checking the look by eye.
// Usage: node tests/act3-look.mjs <outdir> [name ...]
// Each scene loads a debug query, optionally runs a script (as the game would),
// advances any text, and saves <outdir>/<name>.png.
import { chromium } from '@playwright/test';
import { spawn } from 'node:child_process';

const [out = '/tmp', ...only] = process.argv.slice(2);
const SCENES = {
  gallery_lit: { q: '?map=step_gallery&x=13&y=7&facing=up&flags=act3.started,gallery.lever,gallery.mirror=0' },
  gallery_nw: { q: '?map=step_gallery&x=13&y=7&facing=up&flags=act3.started,gallery.lever,gallery.mirror=1,lamp.gallery_w&items=moonglass_disc' },
  gallery_n: { q: '?map=step_gallery&x=13&y=7&facing=up&flags=act3.started,gallery.lever,gallery.mirror=2' },
  gallery_ne: { q: '?map=step_gallery&x=13&y=7&facing=up&flags=act3.started,gallery.lever,gallery.mirror=3' },
  gallery_open: { q: '?map=step_gallery&x=15&y=4&facing=up&flags=act3.started,gallery.lever,gallery.mirror=3,gallery.hatch,halls.ladder&items=moonglass_disc' },
  cradle: { q: '?map=cradle&x=3&y=4&facing=up&flags=act3.started,gallery.lever,gallery.hatch' },
  cradle_taken: { q: '?map=cradle&x=4&y=3&facing=up&flags=act3.started,gallery.lever,gallery.hatch,got.disc&items=moonglass_disc' },
  halls: { q: '?map=lamp_halls&x=3&y=7&facing=down&flags=act3.started,gallery.lever,gallery.hatch,got.disc&items=moonglass_disc' },
  halls_mid: { q: '?map=lamp_halls&x=14&y=7&facing=up&flags=act3.started,gallery.lever,gallery.hatch,got.disc,lamp.halls_w&items=moonglass_disc' },
  halls_east: { q: '?map=lamp_halls&x=22&y=6&facing=up&flags=act3.started,gallery.lever,gallery.hatch,got.disc,halls.ladder&items=moonglass_disc,valve_key' },
  halls_drained: { q: '?map=lamp_halls&x=24&y=6&facing=up&flags=act3.started,gallery.lever,gallery.hatch,got.disc,halls.ladder,halls.valve,lamp.halls_e,n.drainedSeen=1&items=moonglass_disc' },
  bunk_dark: { q: '?map=bunk_room&x=4&y=5&facing=up&flags=act3.started,got.disc,n.bunkDark=1&items=moonglass_disc' },
  bunk_lit: { q: '?map=bunk_room&x=7&y=2&facing=up&flags=act3.started,got.disc,lamp.bunk,n.bunkDark=1&items=moonglass_disc' },
  chart: { q: '?map=chart_room&x=7&y=11&facing=up&flags=act3.started,got.disc,halls.valve,chart.seen&items=moonglass_disc' },
  chart_open: { q: '?map=chart_room&x=7&y=3&facing=up&flags=act3.started,got.disc,halls.valve,chart.seen,founders.unbolted&items=moonglass_disc' },
  crypt_open: { q: '?map=crypt&x=5&y=3&facing=down&flags=act3.started,got.disc,halls.valve,chart.seen,founders.unbolted,act3.crypt&items=moonglass_disc' },
  crown_dusk: { q: '?map=crown&x=18&y=7&facing=down&flags=founders.unbolted,act3.surfaced,moonEyes.glow,act3.crypt,n.crownDusk=1&items=moonglass_disc', wait: 1500 },
  crown_day: { q: '?map=crown&x=11&y=12&facing=down&flags=act2.started', wait: 1500 },
};

const port = 8180 + Math.floor(Math.random() * 40);
const server = spawn(process.execPath, [new URL('./serve.js', import.meta.url).pathname, String(port)], { stdio: 'ignore' });
await new Promise((r) => setTimeout(r, 400));
const browser = await chromium.launch();
try {
  for (const [name, s] of Object.entries(SCENES)) {
    if (only.length && !only.includes(name)) continue;
    const page = await browser.newPage({ viewport: { width: 512, height: 448 } });
    page.on('console', (m) => { if (m.type() === 'error' || m.type() === 'warning') console.log(`[${name}] ${m.text()}`); });
    page.on('pageerror', (e) => console.log(`[${name}] ${e.message}`));
    await page.goto(`http://localhost:${port}/${s.q}`);
    await page.waitForFunction(() => window.moonshine && window.moonshine.snapshot().scene === 'world');
    await page.waitForTimeout(s.wait || 900);
    for (let i = 0; i < 20; i++) {
      const t = await page.evaluate(() => window.moonshine.snapshot().text);
      if (!t) break;
      await page.keyboard.press('z');
      await page.waitForTimeout(250);
    }
    await page.waitForTimeout(300);
    await page.screenshot({ path: `${out}/${name}.png` });
    await page.close();
  }
} finally {
  await browser.close();
  server.kill();
}
