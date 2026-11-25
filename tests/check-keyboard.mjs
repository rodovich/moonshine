// Keyboard reachability: every interactable thing must be reachable with the
// keyboard alone. For every map in every story state below, it finds the
// tiles Cheryl can walk to (from the map's spawn and every arrival from
// another map) and checks that each interactable entity has a reachable tile
// beside it (or diagonal to it) from which facing it and pressing Z reaches
// that entity, under the engine's own rules (World.zTarget: priority,
// counters, characters on her tile, diagonals).
//
//   node tests/check-keyboard.mjs              all states, all maps
//   node tests/check-keyboard.mjs --json       machine-readable list
//
// Story states: add a line to STATES when an act gains a state that changes
// what's on a map. An entity meant to be out of reach in some state (behind
// the Mayor's rope) sets `unreachable: 'reason'` or `(g) => reason or null`.
// Exit code 1 if anything is unreachable.

import { chromium } from '@playwright/test';
import { spawn } from 'node:child_process';

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
  // Acts 5 and 6 and the epilogue are reached with every earlier act's flags still set (act4.risen, act5.started, ...).
  'act 5': 'act1.moonrise,act2.started,act2.done,piano.slid,counter.left,step.open,act3.done,act4.started,act4.risen,act4.done,act5.started,teeth.stage=1',
  'act 6': 'act1.moonrise,act2.started,act2.done,piano.slid,counter.left,step.open,act3.started,act3.done,act4.started,act4.risen,pumps.burst,act4.done,act5.started,teeth.stage=3,door.open,rope.tied,got.clapper,tooth.out,tooth.set,act5.done,act6.started,bell.final,brake.thrown,chain.home,hatch.open,keel.doorOpen',
  'epilogue': 'act1.moonrise,act2.started,act2.done,piano.slid,counter.left,step.open,act3.started,act3.done,act4.started,act4.risen,pumps.burst,act4.done,act5.started,teeth.stage=3,door.open,rope.tied,got.clapper,tooth.out,tooth.set,act5.done,act6.started,chain.home,moon.true,sisters.asleep,bathed,epilogue,epi.leftCourt,epi.piano,epi.race',
};

export async function checkKeyboard(page) {
  return page.evaluate((STATES) => {
    const game = window.moonshine;
    const w = game.world;
    const content = game.content;
    const failures = [];
    const DIRS = [[0, -1], [1, 0], [0, 1], [-1, 0]];
    for (const [stateName, flagStr] of Object.entries(STATES)) {
      const flags = {};
      for (const f of flagStr.split(',').filter(Boolean)) {
        const [k, v] = f.split('=');
        flags[k] = v === undefined ? true : isNaN(Number(v)) ? v : Number(v);
      }
      for (const mapId of Object.keys(content.maps)) {
        if (mapId.startsWith('test_')) continue;
        w.state.flags = { ...flags };
        w.state.inventory = [];
        const def = content.maps[mapId];
        const starts = [];
        if (def.spawn) starts.push(def.spawn);
        for (const other of Object.values(content.maps)) {
          for (const ex of other.exits || []) if (ex.to === mapId && ex.at) starts.push(ex.at);
        }
        if (content.start.map === mapId) starts.push([content.start.x, content.start.y]);
        try {
          w.loadMap(mapId, (starts[0] || [0, 0])[0], (starts[0] || [0, 0])[1], 'down');
        } catch (err) {
          failures.push({ state: stateName, map: mapId, id: '(map)', why: `failed to load: ${err.message}` });
          continue;
        }
        const p = w.player;
        // Walkable tiles reachable from any start (characters step aside, so they don't block).
        const reach = new Set();
        const queue = [];
        for (const [sx, sy] of starts) {
          const k = `${sx},${sy}`;
          if (w.map.inBounds(sx, sy) && !reach.has(k) && w.canPlan(p, sx, sy)) { reach.add(k); queue.push([sx, sy]); }
        }
        for (let i = 0; i < queue.length; i++) {
          const [x, y] = queue[i];
          if (w.isExit(x, y) && i > 0) continue; // stepping onto an exit leaves the map
          for (const [dx, dy] of DIRS) {
            const nx = x + dx;
            const ny = y + dy;
            const k = `${nx},${ny}`;
            if (reach.has(k) || !w.map.inBounds(nx, ny) || !w.canPlan(p, nx, ny)) continue;
            reach.add(k);
            queue.push([nx, ny]);
          }
        }
        for (const e of w.entities) {
          if (e.isPlayer || !e.visible) continue;
          const d = e.def;
          if (!(d.interact || d.use || d.look || d.looks || d.talk || d.talks)) continue;
          // `unreachable: 'why'` (or (g) => 'why' / null) marks something meant to be
          // out of reach in some state (behind the Mayor's rope); it's skipped.
          const un = typeof d.unreachable === 'function' ? d.unreachable(w.api) : d.unreachable;
          if (un) continue;
          const spots = [...w.interactSpots(e), ...w.diagonalSpots(e)];
          const reachable = spots.filter((s) => reach.has(`${s.x},${s.y}`));
          const ok = reachable.some((s) => w.zTarget(s.x, s.y, s.facing, null) === e);
          if (ok) continue;
          let why;
          if (!reachable.length) why = 'no reachable tile beside it';
          else {
            const s = reachable[0];
            const got = w.zTarget(s.x, s.y, s.facing, null);
            why = `from (${s.x},${s.y}) facing ${s.facing}, Z reaches ${got ? got.id : 'nothing'}`;
          }
          failures.push({ state: stateName, map: mapId, id: e.id, at: [e.x, e.y], why });
        }
      }
    }
    return failures;
  }, STATES);
}

// Run directly: serve the game, boot a page, check, print.
if (import.meta.url === `file://${process.argv[1]}`) {
  const port = 8100 + Math.floor(Math.random() * 90);
  const server = spawn(process.execPath, [new URL('./serve.js', import.meta.url).pathname, String(port)], { stdio: 'ignore' });
  await new Promise((r) => setTimeout(r, 400));
  const browser = await chromium.launch();
  try {
    const page = await browser.newPage();
    const errors = [];
    page.on('pageerror', (e) => errors.push(e.message));
    await page.goto(`http://localhost:${port}/?map=cistern_court&x=3&y=6`);
    await page.waitForFunction(() => window.moonshine && window.moonshine.world);
    const failures = await checkKeyboard(page);
    // Collapse the same entity failing in several states.
    const byKey = new Map();
    for (const f of failures) {
      const k = `${f.map}:${f.id}:${f.why}`;
      if (!byKey.has(k)) byKey.set(k, { ...f, states: [] });
      byKey.get(k).states.push(f.state);
    }
    const list = [...byKey.values()];
    if (process.argv.includes('--json')) console.log(JSON.stringify(list, null, 1));
    else {
      for (const f of list) console.log(`${f.map}  ${f.id}${f.at ? ` (${f.at})` : ''}: ${f.why}  [${f.states.join('; ')}]`);
      console.log(`\n${list.length} keyboard-unreachable thing(s); ${errors.length} page error(s).${errors.length ? `\n${errors.slice(0, 5).join('\n')}` : ''}`);
    }
    process.exitCode = list.length ? 1 : 0;
  } finally {
    await browser.close();
    server.kill();
  }
}
