// Run with: node --test tests/audio/
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  pitchToMidi, parseChannel, compileSong, eventsInRange, stepTime, endStep, VELOCITY,
} from '../../game/src/audio/sequencer.js';
import { SONGS } from '../../game/src/audio/music/index.js';
import { INSTRUMENTS } from '../../game/src/audio/instruments.js';
import { SFX, SFX_GROUPS } from '../../game/src/audio/sfx.js';
import { lintSong, parseHarmony } from '../../game/src/audio/lint.js';

test('pitch names', () => {
  assert.equal(pitchToMidi('A4'), 69);
  assert.equal(pitchToMidi('C4'), 60);
  assert.equal(pitchToMidi('C#4'), 61);
  assert.equal(pitchToMidi('Db4'), 61);
  assert.equal(pitchToMidi('Bb1'), 34);
  assert.equal(pitchToMidi('k'), null);
});

test('lengths are sticky, holds extend, rests advance', () => {
  const { length, events } = parseChannel('C4:2 D4 - E4:4 . F4');
  assert.equal(length, 2 + 2 + 2 + 4 + 4 + 4);
  const notes = events.map((e) => [e.step, e.len, e.midi]);
  assert.deepEqual(notes, [[0, 2, 60], [2, 4, 62], [6, 4, 64], [14, 4, 65]]);
});

test('velocity marks, drums, volume and instrument tokens', () => {
  const { events } = parseChannel('k:4 sn! hh_ v50 @harp C4');
  assert.deepEqual(events.map((e) => e.drum ?? e.type), ['k', 'sn', 'hh', 'vol', 'inst', 'note']);
  assert.equal(events[1].vel, VELOCITY.accent);
  assert.equal(events[2].vel, VELOCITY.ghost);
  assert.equal(events[3].vol, 0.5);
  assert.equal(events[4].name, 'harp');
});

test('repeat groups, including nested', () => {
  assert.equal(parseChannel('(C4:4 D4)x2').length, 16);
  assert.equal(parseChannel('((C4:2)x2 D4:4)x3').length, 24);
  assert.throws(() => parseChannel('(C4:4'), /unmatched/);
});

test('bar lines catch wrong bar lengths', () => {
  assert.doesNotThrow(() => parseChannel('C4:16 | D4:8 E4 |'));
  assert.throws(() => parseChannel('C4:16 | D4:8 E4:4 |', { where: 'x' }), /bar 2 is 12 steps/);
});

test('mismatched channel lengths are reported', () => {
  const song = {
    id: 't', bpm: 120, channels: [{ id: 'a', inst: 'harp' }, { id: 'b', inst: 'harp' }],
    patterns: { P: { a: 'C4:16', b: 'C4:8' } }, intro: ['P'], loop: null,
  };
  assert.throws(() => compileSong(song), /t\/P\/b: 8 steps/);
});

const tiny = {
  id: 'tiny', bpm: 120, swing: 0.2,
  channels: [{ id: 'a', inst: 'harp' }],
  patterns: { I: { a: 'C4:16' }, L: { a: 'D4:8 E4:8' } },
  intro: ['I'], loop: ['L'],
};

test('intro plays once, then the loop repeats', () => {
  const c = compileSong(tiny);
  assert.equal(c.introSteps, 16);
  assert.equal(c.loopSteps, 16);
  const got = [...eventsInRange(c, 0, 64)].map(({ abs, ev }) => [abs, ev.midi]);
  assert.deepEqual(got, [[0, 60], [16, 62], [24, 64], [32, 62], [40, 64], [48, 62], [56, 64]]);
  assert.equal(endStep(c), Infinity);
});

test('consecutive windows neither drop nor repeat events', () => {
  const c = compileSong(SONGS.cistern_court);
  const whole = [...eventsInRange(c, 0, 2000)].map((x) => `${x.abs}:${x.ev.ch}:${x.ev.type}`);
  const pieces = [];
  let from = 0;
  for (const w of [1, 7, 13, 3, 100, 250, 3, 17, 900, 706]) {
    for (const x of eventsInRange(c, from, from + w)) pieces.push(`${x.abs}:${x.ev.ch}:${x.ev.type}`);
    from += w;
  }
  assert.equal(from, 2000);
  assert.deepEqual(pieces, whole);
});

test('swing delays odd steps only', () => {
  const c = compileSong(tiny);
  const d = c.stepDur;
  assert.equal(stepTime(c, 0), 0);
  assert.ok(Math.abs(stepTime(c, 1) - (d + 0.2 * d)) < 1e-12);
  assert.ok(Math.abs(stepTime(c, 2) - 2 * d) < 1e-12);
});

test('one-shot pieces end after the intro', () => {
  const c = compileSong(SONGS.wrongness);
  assert.equal(c.loopSteps, 0);
  assert.equal(endStep(c), c.introSteps);
  assert.equal([...eventsInRange(c, c.introSteps, c.introSteps + 100)].length, 0);
});

test('every song compiles, with the intended lengths', () => {
  for (const [id, song] of Object.entries(SONGS)) {
    assert.equal(song.id, id);
    const c = compileSong(song);
    assert.ok(c.channels.length <= 6, `${id} uses ${c.channels.length} channels; music keeps to 6`);
    if (c.loopSteps && !song.scene) {
      assert.ok(c.loopSeconds >= 30 && c.loopSeconds <= 95, `${id} loop is ${c.loopSeconds}s`);
    }
  }
  assert.ok(Math.abs(compileSong(SONGS.neighborhood).loopSeconds - 76.8) < 1e-9);
  // The design asks for a 60–90 s home theme.
  const cc = compileSong(SONGS.cistern_court).loopSeconds;
  assert.ok(cc >= 60 && cc <= 90, `cistern_court loop is ${cc}s`);
});

test('songs and effects only use instruments and drums that exist', () => {
  for (const song of Object.values(SONGS)) {
    const c = compileSong(song);
    const current = c.channels.map((ch) => ch.inst);
    for (const ch of c.channels) assert.ok(INSTRUMENTS[ch.inst], `${song.id}: ${ch.inst}`);
    for (const ev of [...c.intro, ...c.loop]) {
      if (ev.type === 'inst') {
        assert.ok(INSTRUMENTS[ev.name], `${song.id}: @${ev.name}`);
        current[ev.ch] = ev.name;
      }
      if (ev.drum) {
        const kit = INSTRUMENTS[c.channels[ev.ch].inst].kit;
        assert.ok(kit && kit[ev.drum], `${song.id}: drum ${ev.drum}`);
      }
    }
  }
  for (const [id, def] of Object.entries(SFX)) {
    const src = def.loop ?? def;
    if (!src.layers && !(def.loop?.beds?.length)) assert.fail(`${id} has no layers`);
    if (!src.layers) continue;
    // Function layers are randomized; call them a few times to check every variation.
    const runs = typeof src.layers === 'function' ? Array.from({ length: 5 }, (_, i) => src.layers(i)) : [src.layers];
    for (const L of runs.flat()) {
      if (L.type === 'notes') assert.ok(INSTRUMENTS[L.inst], `${id}: ${L.inst}`);
      else assert.ok(['tone', 'noise'].includes(L.type), `${id}: layer type ${L.type}`);
    }
  }
});

test('the required sound effects exist', () => {
  const ids = [
    // round 1
    'blip', 'blip_cheryl', 'step', 'confirm', 'cancel', 'menu_open', 'menu_close', 'item_get', 'door', 'splash', 'wrong_sting',
    // docs/design/01-opening.md, "Audio needed"
    'cursor', 'give', 'step_stone', 'step_plaster', 'step_tile', 'step_rug', 'step_stairs', 'step_wood', 'step_kid',
    'door_open', 'door_close', 'tap_squeak', 'water_pour', 'tub_full', 'chess_tap', 'pepper_grind', 'sneeze',
    'timer_tick', 'timer_ding', 'sheets_flap', 'kid_patter', 'kid_hop', 'piano_flat',
    'swifts', 'crowd', 'dog_bark', 'gull', 'wind', 'clock_strike', 'well_breath',
    'groan', 'crack', 'rattle', 'piano_tumble', 'drain', 'drain_glunk', 'drain_gurgle', 'drain_echo',
  ];
  for (const id of ids) assert.ok(SFX[id], id);
  // docs/design/02-city.md, "Audio needed", and the underground's machines
  const act2 = [
    'knock', 'shop_bell', 'stone_scrape', 'scrub', 'skip_rope', 'slab_lift', 'piano_slide', 'trickle', 'sink_gurgle', 'step_splash',
    'door_hum', 'town', 'canal', 'gulls', 'goat', 'goats', 'clock_tick', 'boatman_sing', 'girls_chant',
    'step_hullstone', 'step_rung', 'lid_pry', 'hatch_open', 'light_beam', 'mirror_turn', 'moonlock_open', 'disc_glow',
    'chute_slide', 'ladder_drop', 'tube_voice', 'lever_pull', 'lid_open', 'shutters', 'beam_hum', 'moonglass_hum', 'disc_get', 'lamp_relight', 'tube_murmur', 'bolt_draw', 'founders_door', 'rubbing', 'glow_shimmer', 'valve_turn', 'valve_jam', 'water_gush', 'far_gurgle', 'drips', 'hull',
    'pump_run', 'pump_cough', 'chain_rattle', 'chain_haul', 'tide_wheel',
    // docs/design/04-the-list.md, "Audio needed"
    'belfry_tick', 'clock_rundown', 'lever_clank', 'clamp_lift', 'bell_stroke', 'bell_strokes', 'thrum_rise', 'thrum',
    'hull_far', 'coins_rattle', 'ring_hatch', 'valve_squeal', 'pump_stall', 'thump_thin', 'thump_stout', 'thump_middle',
    'pump_thin', 'pump_stout', 'shaft_hum', 'grate_drain', 'hull_creak_long', 'valve_hiss', 'ear_pop', 'groan_great',
    'burst', 'roar', 'water_spread', 'hatch_bang', 'air_whistle', 'slack_lap', 'channel_rush', 'gull_close',
    'slab_scrape', 'slab_close', 'shouting', 'bell_low', 'town_rush', 'crabs', 'fish_flop',
  ];
  for (const id of act2) assert.ok(SFX[id], id);
  const loops = ['water_pour', 'timer_tick', 'crowd', 'wind', 'trickle', 'door_hum', 'town', 'canal', 'gulls', 'goats',
    'clock_tick', 'water_gush', 'drips', 'hull', 'pump_run', 'chain_haul', 'tide_wheel', 'beam_hum', 'moonglass_hum', 'tube_murmur', 'glow_shimmer'];
  for (const id of loops) assert.ok(SFX[id].loop, `${id} loops`);
  for (const id of ['title', 'cistern_court', 'moonrise', 'morning_after', 'wrongness', 'neighborhood', 'harbor', 'archive', 'discovery', 'downstairs', 'reveal', 'reveal_last', 'pumps', 'neighborhood_thin', 'climb']) assert.ok(SONGS[id], id);
});

test('harmony strings split bars evenly unless lengths are given', () => {
  const h = parseHarmony('F | C7 Dm | F:4 C:12 |', 16);
  assert.deepEqual(h.map((x) => [x.step, x.len, x.chord.sym]), [[0, 16, 'F'], [16, 8, 'C7'], [24, 8, 'Dm'], [32, 4, 'F'], [36, 12, 'C']]);
  assert.throws(() => parseHarmony('F:4 C:4 |', 16), /doesn't fill/);
});

test('lint catches clashes against the harmony', () => {
  const song = {
    id: 'bad', bpm: 100, channels: [{ id: 'lead', inst: 'flute' }, { id: 'pad', inst: 'strings' }],
    patterns: { P: { harmony: 'C | C |', lead: 'F5:16 | E5:16 |', pad: 'E4:16 | F4:16 |' } }, intro: ['P'], loop: null,
  };
  const msgs = lintSong(song).issues.filter((i) => i.level === 'warn').map((i) => i.msg);
  assert.ok(msgs.some((m) => /F5 \(16 steps\) clashes with C/.test(m)), msgs.join('; '));
  assert.ok(msgs.some((m) => /F4 \(16 steps\) isn't in C/.test(m)), msgs.join('; '));
  assert.ok(msgs.some((m) => /F5 against E4/.test(m)), msgs.join('; ')); // a minor ninth
});

test('every song passes the music lint', () => {
  for (const song of Object.values(SONGS)) {
    const warns = lintSong(song).issues.filter((i) => i.level === 'warn');
    assert.deepEqual(warns, [], `${song.id}: ${warns.map((w) => `${w.where}: ${w.msg}`).join('; ')}`);
  }
});

test('no sound effect id is defined in two files', () => {
  const seen = new Map();
  for (const [group, defs] of Object.entries(SFX_GROUPS)) {
    for (const id of Object.keys(defs)) {
      assert.ok(!seen.has(id), `${id} is in both ${seen.get(id)} and ${group}`);
      seen.set(id, group);
    }
  }
});
