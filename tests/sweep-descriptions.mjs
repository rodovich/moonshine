// Description sweep: for every interactable thing on every map in every story
// state, a crop of the screen around it beside the text it gives when Cheryl
// looks at it or talks to it, so a reviewer can check that the words match
// the drawing (a cat on a bench that has no cat; a "crate" that is a bush).
//
//   node tests/sweep-descriptions.mjs [outDir]       default outDir: tests/sweep
//   node tests/sweep-descriptions.mjs out --map=bilge,harbor --state="act 2"
//   node tests/sweep-descriptions.mjs out --shots     also a PNG of each map's section
//
// Writes outDir/index.html (all maps; crops are inline) and outDir/sweep.json.
// Story states are check-keyboard's STATES (copied below until that script is
// on main; keep the two in step).
//
// How the text is captured: each entity's handler (interact, looks, talks,
// talk, look) runs against a recording stand-in for the script API. Text
// calls (describe, say, think, talk, choose) are recorded; anything that
// would change the game (flags, items, moves, map changes, effects) is a
// no-op, except that setFlag is visible to later flag() reads in the same
// handler. choose() picks the cancel option. A handler is run twice, as a
// first look and as a second look (looks = 0 and 1), when the two differ.
//
// How the crop is made: the map is loaded in the running game with the
// state's flags, Cheryl is hidden, the camera is centered on the entity, and
// the world is drawn with the engine's own drawWorld (lighting and all) into
// an offscreen 256×224 canvas. Darkness (the Lamp Halls) is switched off for
// the crop so the art is visible; the report marks those maps.

import { chromium } from '@playwright/test';
import { spawn } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

export const STATES = {
  'opening dusk': '',
  'opening morning': 'act1.moonrise',
  'act 2': 'act1.moonrise,act2.started',
  'act 2 late': 'act1.moonrise,act2.started,n.stepsArrived,piano.slid,counter.left,step.open,got.crowbar',
  'act 3': 'act1.moonrise,act2.started,act2.done,piano.slid,counter.left,step.open,act3.started,got.disc',
  'act 3 end': 'act1.moonrise,act2.started,act2.done,piano.slid,counter.left,step.open,act3.surfaced,act3.done,founders.unbolted,halls.valve',
  'act 4': 'act1.moonrise,act2.started,act2.done,piano.slid,counter.left,step.open,act3.done,act4.started',
  'act 4 mayor away': 'act1.moonrise,act2.started,act2.done,piano.slid,counter.left,step.open,act3.done,act4.started,mayor.atCrown,bell.restored',
  'act 4 burst': 'act1.moonrise,act2.started,act2.done,piano.slid,counter.left,step.open,act3.done,act4.started,pumps.burst,cellar.shut,act4.risen',
  'act 5': 'act1.moonrise,act2.started,act2.done,piano.slid,counter.left,step.open,act3.done,act4.started,act4.done,act5.started',
  'act 6': 'act1.moonrise,act2.started,act2.done,piano.slid,counter.left,step.open,act3.started,act3.done,act4.started,act4.risen,pumps.burst,act4.done,act5.started,teeth.stage=3,door.open,rope.tied,got.clapper,tooth.out,tooth.set,act5.done,act6.started,bell.final,brake.thrown,chain.home,hatch.open,keel.doorOpen',
  'epilogue': 'act1.moonrise,act2.started,act2.done,piano.slid,counter.left,step.open,act3.started,act3.done,act4.started,act4.risen,pumps.burst,act4.done,act5.started,teeth.stage=3,door.open,rope.tied,got.clapper,tooth.out,tooth.set,act5.done,act6.started,chain.home,moon.true,sisters.asleep,bathed,epilogue,epi.leftCourt,epi.piano,epi.race',
};

// Runs in the page: one state, the given maps. Returns a record per entity.
async function sweepState({ stateName, flagStr, onlyMaps }) {
  const game = window.moonshine;
  const w = game.world;
  const content = game.content;
  const flags = {};
  for (const f of flagStr.split(',').filter(Boolean)) {
    const [k, v] = f.split('=');
    flags[k] = v === undefined ? true : isNaN(Number(v)) ? v : Number(v);
  }
  const TILE = 16;
  const W = 256;
  const H = 224;
  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d');
  ctx.imageSmoothingEnabled = false;
  const out = [];

  // A recording stand-in for the script API.
  function recorder(real, rec) {
    const local = {};
    let calls = 0;
    const tick = () => {
      if (++calls > 400) throw new Error('too many API calls (a loop?)');
    };
    const nameOf = (s) => {
      if (s == null) return null;
      if (typeof s === 'string') {
        const e = w.entity(s);
        return e && e.name ? e.name : s;
      }
      return s.name || s.id || null;
    };
    const lines = (style, speaker, args) => {
      tick();
      const last = args[args.length - 1];
      if (last && typeof last === 'object' && !Array.isArray(last)) args = args.slice(0, -1);
      for (const t of args.flat(3)) if (typeof t === 'string') rec.push({ style, speaker, text: t });
      return Promise.resolve();
    };
    const own = {
      say: (s, ...a) => lines('say', nameOf(s), a),
      describe: (...a) => lines('describe', null, a),
      think: (...a) => lines('think', null, a),
      bark: (s, t) => lines('bark', nameOf(s), [t]),
      talk: (pairs) => {
        for (const p of pairs) {
          if (typeof p === 'string') lines('describe', null, [p]);
          else if (p[0] == null) lines('describe', null, [p[1]]);
          else lines('say', nameOf(p[0]), [p[1]]);
        }
        return Promise.resolve();
      },
      choose: (a, b, c) => {
        tick();
        let prompt = null;
        let options = a;
        let opts = b || {};
        if (typeof a === 'string') {
          prompt = a;
          options = b;
          opts = c || {};
        }
        rec.push({ style: 'choose', speaker: nameOf(opts.speaker), text: `${prompt ? `${prompt} ` : ''}[${options.join(' / ')}]` });
        const i = 'cancel' in opts && opts.cancel != null ? opts.cancel : options.length - 1;
        return Promise.resolve(i);
      },
      giveItem: (id) => {
        tick();
        rec.push({ style: 'effect', text: `(gives ${id})` });
        return Promise.resolve();
      },
      setFlag: (n, v = true) => {
        tick();
        local[n] = v === false || v == null ? undefined : v;
        return undefined;
      },
      flag: (n) => (n in local ? local[n] : real.flag(n)),
      changeMap: (id) => {
        tick();
        rec.push({ style: 'effect', text: `(goes to ${id})` });
        return Promise.resolve();
      },
    };
    const pass = new Set(['hasItem', 'items', 'flags', 'npc', 'player', 'looks', 'map', 'usingTouch', 'random', 'sheet', 'lighting']);
    return new Proxy({}, {
      get(_, prop) {
        if (prop in own) return own[prop];
        if (pass.has(prop)) {
          const v = real[prop];
          return typeof v === 'function' ? v.bind(real) : v;
        }
        if (prop === 'then') return undefined;
        const v = real[prop];
        if (typeof v === 'function') return () => { tick(); return Promise.resolve(undefined); };
        return v;
      },
    });
  }

  async function capture(e, looks) {
    const d = e.def;
    const rec = [];
    const g = recorder(w.api, rec);
    let error = null;
    try {
      const run = (async () => {
        if (d.interact) return d.interact(g, e, looks);
        const pick = (list, rep) => {
          if (looks < list.length) return list[looks];
          if (rep === 'cycle' && list.length > 1) return list[1 + ((looks - 1) % (list.length - 1))];
          return list[list.length - 1];
        };
        if (d.looks) { const x = pick(d.looks, d.looksRepeat); return g.describe(...(Array.isArray(x) ? x : [x])); }
        if (d.talks) { const x = pick(d.talks, d.talksRepeat); return g.say(e, ...(Array.isArray(x) ? x : [x])); }
        if (d.talk) return g.say(e.name, ...(Array.isArray(d.talk) ? d.talk : [d.talk]));
        if (d.look) return g.describe(...(Array.isArray(d.look) ? d.look : [d.look]));
        return undefined;
      })();
      await Promise.race([run, new Promise((_, rej) => setTimeout(() => rej(new Error('timed out')), 1500))]);
    } catch (err) {
      error = String(err && err.message ? err.message : err);
    }
    return { rec, error };
  }

  for (const mapId of Object.keys(content.maps)) {
    if (mapId.startsWith('test_')) continue;
    if (onlyMaps && !onlyMaps.includes(mapId)) continue;
    w.state.flags = { ...flags };
    w.state.inventory = [];
    w.state.looks = {};
    const def = content.maps[mapId];
    const sp = def.spawn || [0, 0];
    try {
      w.loadMap(mapId, sp[0], sp[1], 'down');
    } catch (err) {
      out.push({ state: stateName, map: mapId, id: '(map)', error: `failed to load: ${err.message}` });
      continue;
    }
    w.player.visible = false;
    const darkDef = def.darkness ?? def.dark;
    const dark = typeof darkDef === 'function' ? (() => { try { return darkDef(w.api); } catch { return 0; } })() : darkDef;
    const ents = w.entities.filter((e) => {
      if (e.isPlayer || e === w.player || !e.visible) return false;
      const d = e.def;
      return !!(d.interact || d.look || d.looks || d.talk || d.talks);
    });
    for (const e of ents) {
      // The crop: the footprint, 1.5 tiles each side, 2.5 above (tall sprites), 1 below.
      const fx = e.x * TILE;
      const fy = e.y * TILE;
      const fw = e.w * TILE;
      const fh = e.h * TILE;
      w.camPan = { x: fx + fw / 2, y: fy + fh / 2 - 8 };
      w.snapCamera();
      const saved = w.mapDef;
      if (dark) w.mapDef = { ...saved, darkness: 0, dark: 0 };
      try {
        w.drawWorld(ctx);
      } finally {
        w.mapDef = saved;
      }
      const x0 = Math.max(0, fx - 24 - w.cam.x);
      const y0 = Math.max(0, fy - 40 - w.cam.y);
      const x1 = Math.min(W, fx + fw + 24 - w.cam.x);
      const y1 = Math.min(H, fy + fh + 16 - w.cam.y);
      const cw = Math.max(16, x1 - x0);
      const chh = Math.max(16, y1 - y0);
      const c2 = document.createElement('canvas');
      c2.width = cw;
      c2.height = chh;
      const c2x = c2.getContext('2d');
      c2x.drawImage(canvas, x0, y0, cw, chh, 0, 0, cw, chh);
      const crop = c2.toDataURL();
      // The same crop with the hotspot's footprint outlined.
      c2x.strokeStyle = '#ff40ff';
      c2x.setLineDash([2, 2]);
      c2x.strokeRect(fx - w.cam.x - x0 + 0.5, fy - w.cam.y - y0 + 0.5, fw - 1, fh - 1);
      const outlined = c2.toDataURL();
      const size = [cw, chh];
      const first = await capture(e, 0);
      const second = await capture(e, 1);
      const same = JSON.stringify(first.rec) === JSON.stringify(second.rec);
      out.push({
        state: stateName, map: mapId, id: e.id, name: e.name || e.def.name || null,
        at: [e.x, e.y, e.w, e.h], character: !!(e.directional || e.character), dark: !!dark,
        sprite: e.def.sprite && typeof e.def.sprite === 'object' ? (e.def.sprite.frame || '(character)') : (typeof e.def.sprite === 'function' ? '(fn)' : null),
        texts: first.rec, error: first.error, again: same ? null : second.rec, crop, outlined, size,
      });
    }
    w.camPan = null;
    w.player.visible = true;
  }
  return out;
}

const esc = (s) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

function textHtml(list) {
  if (!list || !list.length) return '<p class="none">(no text)</p>';
  return list.map((t) => `<p class="${t.style}">${t.speaker ? `<b>${esc(t.speaker)}:</b> ` : ''}${esc(t.text)}</p>`).join('');
}

function report(rows, commit) {
  // Collapse states where an entity's crop and text are identical.
  const groups = new Map();
  for (const r of rows) {
    const k = `${r.map}|${r.id}|${r.crop}|${JSON.stringify(r.texts)}|${JSON.stringify(r.again)}|${r.error}`;
    if (!groups.has(k)) groups.set(k, { ...r, states: [] });
    groups.get(k).states.push(r.state);
  }
  const byMap = new Map();
  for (const gp of groups.values()) {
    if (!byMap.has(gp.map)) byMap.set(gp.map, []);
    byMap.get(gp.map).push(gp);
  }
  let n = 0;
  const sections = [...byMap.entries()].map(([map, list]) => {
    const items = list.map((r) => {
      n += 1;
      r.n = n;
      return `<tr id="e${n}"><td class="n">${n}</td><td class="img"><img src="${r.crop}" width="${r.size[0] * 2}"><img src="${r.outlined}" width="${r.size[0] * 2}"></td>
<td class="t"><div class="h">${esc(r.id)}${r.name ? ` — “${esc(r.name)}”` : ''} <span class="meta">(${r.at.join(',')})${r.sprite ? ` sprite:${esc(r.sprite)}` : ''}${r.dark ? ' [dark map: darkness off]' : ''}</span></div>
<div class="states">${esc(r.states.join(' · '))}</div>
${r.error ? `<p class="err">error: ${esc(r.error)}</p>` : ''}${textHtml(r.texts)}${r.again ? `<div class="again">second look:</div>${textHtml(r.again)}` : ''}</td></tr>`;
    }).join('\n');
    return `<section id="map-${map}"><h2>${map}</h2><table>${items}</table></section>`;
  }).join('\n');
  const toc = [...byMap.keys()].map((m) => `<a href="#map-${m}">${m}</a>`).join(' · ');
  return {
    groups: [...groups.values()],
    html: `<!doctype html><meta charset="utf-8"><title>Moonshine description sweep</title>
<style>
body{font:14px/1.35 system-ui,sans-serif;background:#1c1c22;color:#ddd;margin:16px;max-width:1500px}
h2{background:#333;padding:4px 8px;margin-top:28px}
table{border-collapse:collapse;width:100%}
tr{border-top:1px solid #444}
td{vertical-align:top;padding:6px}
td.n{color:#888;width:2em;text-align:right}
td.img{width:1%;white-space:nowrap}
td.img img{image-rendering:pixelated;height:auto;margin-right:6px;vertical-align:top}
td.t{min-width:420px}
.h{font-weight:bold;color:#fff}.meta{font-weight:normal;color:#999;font-size:12px}
.states{color:#8ab;font-size:12px;margin-bottom:4px}
p{margin:2px 0}p.describe{color:#f0d8a8}p.think{color:#f0d8a8;font-style:italic}p.say{color:#b8d0ff}
p.choose{color:#9c9}p.effect{color:#888}p.err{color:#f66}.none{color:#f88}.again{color:#888;font-size:12px;margin-top:4px}
</style>
<h1>Moonshine description sweep</h1>
<p>Swept commit ${esc(commit)}. Left crop: as drawn; right: the hotspot's footprint outlined. Rows collapse states with the same crop and text.</p>
<p>${toc}</p>
${sections}`,
  };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const args = process.argv.slice(2);
  const outDir = args.find((a) => !a.startsWith('--')) || new URL('./sweep', import.meta.url).pathname;
  const opt = (name) => { const a = args.find((x) => x.startsWith(`--${name}=`)); return a ? a.slice(name.length + 3) : null; };
  const onlyMaps = opt('map') ? opt('map').split(',') : null;
  const onlyStates = opt('state') ? opt('state').split(',') : null;
  mkdirSync(outDir, { recursive: true });
  const commit = (await new Promise((res) => {
    const p = spawn('git', ['rev-parse', '--short', 'HEAD']);
    let s = '';
    p.stdout.on('data', (d) => { s += d; });
    p.on('close', () => res(s.trim()));
  })) || '?';
  const port = 8200 + Math.floor(Math.random() * 90);
  const server = spawn(process.execPath, [new URL('./serve.js', import.meta.url).pathname, String(port)], { stdio: 'ignore' });
  await new Promise((r) => setTimeout(r, 400));
  const browser = await chromium.launch();
  try {
    const page = await browser.newPage();
    const errors = [];
    page.on('pageerror', (e) => errors.push(e.message));
    await page.goto(`http://localhost:${port}/?map=cistern_court&x=3&y=6`);
    await page.waitForFunction(() => window.moonshine && window.moonshine.world);
    await page.waitForTimeout(500);
    const rows = [];
    for (const [stateName, flagStr] of Object.entries(STATES)) {
      if (onlyStates && !onlyStates.includes(stateName)) continue;
      rows.push(...await page.evaluate(sweepState, { stateName, flagStr, onlyMaps }));
      process.stderr.write(`${stateName}: ${rows.length} rows so far\n`);
    }
    const { html, groups } = report(rows, commit);
    writeFileSync(join(outDir, 'index.html'), html);
    writeFileSync(join(outDir, 'sweep.json'), JSON.stringify(groups.map(({ crop, outlined, ...r }) => r), null, 1));
    const maps = new Set(rows.map((r) => r.map));
    console.log(`${rows.length} entity-state pairs on ${maps.size} maps in ${Object.keys(STATES).length} states; ${groups.length} distinct rows. Errors in handlers: ${groups.filter((g) => g.error).length}. Page errors: ${errors.length}.`);
    console.log(`Report: ${join(outDir, 'index.html')}`);
    if (args.includes('--shots')) {
      const view = await browser.newPage({ viewport: { width: 1500, height: 900 } });
      await view.goto(`file://${join(outDir, 'index.html')}`);
      // Review sheets: six rows per PNG, small enough to read.
      for (const m of maps) {
        const rowEls = await view.$$(`#map-${m} tr`);
        for (let i = 0; i < rowEls.length; i += 6) {
          const boxes = [];
          for (const el of rowEls.slice(i, i + 6)) boxes.push(await el.boundingBox());
          const top = boxes[0].y;
          const last = boxes[boxes.length - 1];
          await view.screenshot({
            path: join(outDir, `${m}-${String(i / 6 + 1).padStart(2, '0')}.png`),
            fullPage: true,
            clip: { x: 0, y: top, width: 1500, height: last.y + last.height - top },
          });
        }
      }
    }
  } finally {
    await browser.close();
    server.kill();
  }
}
