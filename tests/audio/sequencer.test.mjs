// Run with: node --test tests/audio/
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  pitchToMidi, parseChannel, compileSong, eventsInRange, stepTime, endStep, VELOCITY,
} from '../../game/src/audio/sequencer.js';
import { SONGS } from '../../game/src/audio/music/index.js';
import { INSTRUMENTS } from '../../game/src/audio/instruments.js';
import { SFX } from '../../game/src/audio/sfx.js';

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
  const c = compileSong(SONGS.neighborhood);
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
    if (c.loopSteps) {
      assert.ok(c.loopSeconds >= 45 && c.loopSeconds <= 95, `${id} loop is ${c.loopSeconds}s`);
    }
  }
  assert.ok(Math.abs(compileSong(SONGS.neighborhood).loopSeconds - 76.8) < 1e-9);
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
    for (const L of def.layers) {
      if (L.type === 'notes') assert.ok(INSTRUMENTS[L.inst], `${id}: ${L.inst}`);
      else assert.ok(['tone', 'noise'].includes(L.type), `${id}: layer type ${L.type}`);
    }
  }
});

test('the required sound effects exist', () => {
  for (const id of ['blip', 'blip_cheryl', 'step', 'confirm', 'cancel', 'menu_open', 'menu_close', 'item_get', 'door', 'splash', 'wrong_sting']) {
    assert.ok(SFX[id], id);
  }
});
