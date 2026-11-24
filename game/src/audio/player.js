// Plays one compiled song: per-channel strips (volume, pan, echo send), monophonic channels,
// look-ahead scheduling, fades. index.js owns the clock that calls schedule().

import { eventsInRange, stepTime } from './sequencer.js';
import { playNote, playLayers, makeEcho } from './synth.js';
import { INSTRUMENTS } from './instruments.js';

const DEFAULT_ECHO = { delay: 0.3, feedback: 0.35, wet: 0.3, lowpass: 2800, spread: 0.023 };

export class MusicTrack {
  /**
   * @param ctx AudioContext or OfflineAudioContext
   * @param song the song module (for gain and echo settings)
   * @param compiled compileSong(song)
   * @param dest node to connect to (the music bus)
   * @param getWrongness function returning the current global Wrongness amount (0..1)
   */
  constructor(ctx, song, compiled, dest, getWrongness = () => 0) {
    this.ctx = ctx;
    this.song = song;
    this.c = compiled;
    this.id = song.id;
    this.getWrongness = getWrongness;
    this.fade = ctx.createGain(); // crossfades and stops
    this.duck = ctx.createGain(); // ducking under cues
    this.mix = ctx.createGain();
    this.mix.gain.value = song.gain ?? 1;
    this.mix.connect(this.duck);
    this.duck.connect(this.fade);
    this.fade.connect(dest);
    this.echo = makeEcho(ctx, { ...DEFAULT_ECHO, ...song.echo }, this.mix);
    this.strips = compiled.channels.map((ch) => {
      const vol = ctx.createGain();
      vol.gain.value = ch.vol ?? 0.7;
      const pan = ctx.createStereoPanner();
      pan.pan.value = ch.pan ?? 0;
      const send = ctx.createGain();
      send.gain.value = ch.echo ?? 0.3;
      vol.connect(pan);
      pan.connect(this.mix);
      pan.connect(send);
      send.connect(this.echo.input);
      const inst = INSTRUMENTS[ch.inst];
      if (!inst) throw new Error(`${song.id}/${ch.id}: unknown instrument "${ch.inst}"`);
      return { ch, inst, vol, pan, send, voice: null };
    });
    this.t0 = null;
    this.nextStep = 0;
    this.stopAt = Infinity;
    this.disposed = false;
  }

  /** Begin at context time `when`, fading in over `fadeSec` (0 = start at full level). */
  start(when, fadeSec = 0) {
    this.t0 = when;
    const g = this.fade.gain;
    g.setValueAtTime(fadeSec > 0 ? 0 : 1, when);
    if (fadeSec > 0) g.linearRampToValueAtTime(1, when + fadeSec);
  }

  /** Context time at which the piece ends by itself (Infinity if it loops). */
  get endTime() {
    if (this.c.loopSteps) return Infinity;
    return this.t0 + this.c.introSeconds;
  }

  /** Schedule all notes that start before context time `until`. */
  schedule(until) {
    if (this.t0 === null || this.disposed) return;
    until = Math.min(until, this.stopAt);
    const c = this.c;
    const target = Math.ceil((until - this.t0) / c.stepDur) + 1;
    if (target <= this.nextStep) return;
    const limit = c.loopSteps ? target : Math.min(target, c.introSteps);
    const wrong = Math.max(this.getWrongness(), this.song.wrongness ?? 0);
    for (const { abs, ev } of eventsInRange(c, this.nextStep, limit)) {
      const strip = this.strips[ev.ch];
      const time = this.t0 + stepTime(c, abs);
      if (time >= this.stopAt) continue;
      if (ev.type === 'vol') {
        strip.vol.gain.setTargetAtTime((strip.ch.vol ?? 0.7) * ev.vol, Math.max(time, this.ctx.currentTime), 0.05);
        continue;
      }
      if (ev.type === 'inst') {
        strip.inst = INSTRUMENTS[ev.name];
        if (!strip.inst) throw new Error(`${this.id}/${strip.ch.id}: unknown instrument "${ev.name}"`);
        continue;
      }
      const dur =this.t0 + stepTime(c, abs + ev.len) - time;
      if (strip.voice && strip.voice.end > time) strip.voice.choke(time);
      if (ev.drum !== undefined) {
        const layers = strip.inst.kit?.[ev.drum];
        if (!layers) throw new Error(`${this.id}/${strip.ch.id}: unknown drum "${ev.drum}"`);
        strip.voice = playLayers(this.ctx, layers, time, { dest: strip.vol, vel: ev.vel });
      } else {
        let detune = 0;
        let bend = 0;
        if (wrong > 0) {
          detune = (Math.random() * 2 - 1) * wrong * 30;
          if (Math.random() < wrong * 0.25) bend = -wrong * (40 + Math.random() * 60);
        }
        strip.voice = playNote(this.ctx, strip.inst, {
          time, dur: Math.max(dur - 0.012, 0.02), midi: ev.midi + (strip.ch.transpose ?? 0),
          vel: ev.vel, detune, bend, dest: strip.vol,
        });
      }
    }
    this.nextStep = target;
  }

  /** Fade to silence over `fadeSec` starting at `when`, then release the nodes. */
  stop(when, fadeSec) {
    const g = this.fade.gain;
    const now = this.ctx.currentTime;
    when = Math.max(when, now);
    g.cancelScheduledValues(when);
    // Start the ramp from the current level so a stop during a fade-in doesn't jump.
    g.setValueAtTime(g.value, when);
    g.linearRampToValueAtTime(0, when + Math.max(fadeSec, 0.01));
    this.stopAt = when + Math.max(fadeSec, 0.01);
    for (const s of this.strips) if (s.voice) s.voice.choke(this.stopAt);
  }

  /** Duck (level < 1) or restore (level 1) under a cue. */
  setDuck(level, when, sec) {
    const g = this.duck.gain;
    g.cancelScheduledValues(when);
    g.setValueAtTime(g.value, when);
    g.linearRampToValueAtTime(level, when + sec);
  }

  dispose() {
    if (this.disposed) return;
    this.disposed = true;
    this.echo.disconnect();
    for (const s of this.strips) { s.vol.disconnect(); s.pan.disconnect(); s.send.disconnect(); }
    this.mix.disconnect();
    this.duck.disconnect();
    this.fade.disconnect();
  }
}
