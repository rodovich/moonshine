// Debug URL parameters (see README.md "Debug parameters").
//
//   ?map=test_shop&x=4&y=6&facing=up   start a new game here, skipping the title
//   &flags=met_old_man,door_open,count=3  set flags (value defaults to true)
//   &items=brass_key,letter              start with these items
//   &run=intro                           run content.scripts.intro on start
//   &start=new | continue                skip the title without moving
//   &debug=1                             draw collision, exits, path, position
//   &seed=42                             fix the random seed (NPC wandering)
//   &save=1                              allow saving (off by default when map/start is given)

import { newState, loadSave } from './save.js';

export function readDebugParams(content) {
  const q = new URLSearchParams(location.search);
  const out = {
    debug: q.get('debug') === '1',
    seed: q.has('seed') ? Number(q.get('seed')) : null,
    run: q.get('run'),
    start: false,
    state: null,
    nosave: false,
  };
  const startMode = q.get('start');
  if (q.has('map') || startMode) {
    out.start = true;
    // A debug start never writes the save slot unless save=1, except
    // start=continue (the player's own game), which saves unless save=0.
    out.nosave = startMode === 'continue' && !q.has('map') ? q.get('save') === '0' : q.get('save') !== '1';
    let state = null;
    if (startMode === 'continue') state = loadSave();
    if (!state) state = newState(content.start);
    if (q.has('map')) {
      state.map = q.get('map');
      const def = content.maps[state.map];
      if (!def) {
        console.warn(`[debug] unknown map "${state.map}"`);
        state.map = content.start.map;
      }
      const spawn = content.maps[state.map]?.spawn;
      state.x = q.has('x') ? Number(q.get('x')) : spawn ? spawn[0] : state.x;
      state.y = q.has('y') ? Number(q.get('y')) : spawn ? spawn[1] : state.y;
    }
    if (q.has('facing')) state.facing = q.get('facing');
    for (const pair of (q.get('flags') || '').split(',').filter(Boolean)) {
      const [k, v] = pair.split('=');
      state.flags[k] = v === undefined ? true : isNaN(Number(v)) ? v : Number(v);
    }
    for (const id of (q.get('items') || '').split(',').filter(Boolean)) {
      if (!state.inventory.includes(id)) state.inventory.push(id);
    }
    out.state = state;
  }
  return out;
}
