// Music data parsing and timing. Pure functions with no Web Audio, so Node can test them.
// The notation is documented in docs/audio-direction.md ("Music data format").

const NOTE_BASE = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };

/** MIDI note number for a pitch name like "C4", "F#5", or "Bb2". Returns null if it isn't one. */
export function pitchToMidi(name) {
  const m = /^([A-G])([#b]?)(-?\d)$/.exec(name);
  if (!m) return null;
  const acc = m[2] === '#' ? 1 : m[2] === 'b' ? -1 : 0;
  return 12 * (Number(m[3]) + 1) + NOTE_BASE[m[1]] + acc;
}

export function midiToFreq(midi) {
  return 440 * Math.pow(2, (midi - 69) / 12);
}

const TOKEN_RE = /\(|\)(?:x\d+)?|\||[^\s()|]+/g;
// head, then an optional velocity mark and :length in either order: "C5!:4", "C5:4!", "sh_".
const NOTE_RE = /^([A-G][#b]?-?\d|\.|-|[a-z][a-z0-9]*)([!_]?)(?::(\d+))?([!_]?)$/;

export const VELOCITY = { normal: 0.8, accent: 1, ghost: 0.45 };

/**
 * Parse one channel's notation string.
 * Returns { length, events } where events are
 *   { type: 'note', step, len, midi | drum, vel }, { type: 'vol', step, vol },
 *   or { type: 'inst', step, name }.
 * `where` labels errors (e.g. "neighborhood/A/lead").
 */
export function parseChannel(text, { barSteps = 16, where = '?' } = {}) {
  const tokens = text.match(TOKEN_RE) || [];
  // Expand ( ... )xN groups first.
  const stack = [[]];
  for (const t of tokens) {
    if (t === '(') stack.push([]);
    else if (t.startsWith(')')) {
      if (stack.length < 2) throw new Error(`${where}: unmatched ")"`);
      const n = t.length > 1 ? Number(t.slice(2)) : 1;
      const group = stack.pop();
      for (let i = 0; i < n; i++) stack[stack.length - 1].push(...group);
    } else stack[stack.length - 1].push(t);
  }
  if (stack.length !== 1) throw new Error(`${where}: unmatched "("`);
  const flat = stack[0];

  const events = [];
  let step = 0;
  let defLen = 4;
  let last = null; // last note or rest, for "-" holds
  let bar = 1;
  for (const t of flat) {
    if (t === '|') {
      if (step % barSteps !== 0) {
        throw new Error(`${where}: bar ${bar} is ${step - (bar - 1) * barSteps} steps long, expected ${barSteps}`);
      }
      bar = step / barSteps + 1;
      continue;
    }
    const vm = /^v(\d+)$/.exec(t);
    if (vm) {
      events.push({ type: 'vol', step, vol: Number(vm[1]) / 100 });
      continue;
    }
    const im = /^@([a-z][a-z0-9_]*)$/.exec(t);
    if (im) {
      events.push({ type: 'inst', step, name: im[1] });
      continue;
    }
    const m = NOTE_RE.exec(t);
    if (!m) throw new Error(`${where}: can't read token "${t}" in bar ${bar}`);
    const len = m[3] ? Number(m[3]) : defLen;
    const mark = m[2] || m[4];
    if (!(len > 0)) throw new Error(`${where}: zero length in "${t}"`);
    defLen = len;
    const head = m[1];
    if (head === '-') {
      if (last) last.len += len;
    } else if (head === '.') {
      last = null;
    } else {
      const vel = mark === '!' ? VELOCITY.accent : mark === '_' ? VELOCITY.ghost : VELOCITY.normal;
      const midi = pitchToMidi(head);
      const ev = midi === null
        ? { type: 'note', step, len, drum: head, vel }
        : { type: 'note', step, len, midi, vel };
      events.push(ev);
      last = ev;
    }
    step += len;
  }
  return { length: step, events };
}

/**
 * Compile a song module into a flat, timed form the player can schedule.
 * Throws a descriptive Error if the data is inconsistent.
 */
export function compileSong(song) {
  const stepsPerBeat = song.stepsPerBeat || 4;
  const beatsPerBar = song.beatsPerBar || 4;
  const barSteps = stepsPerBeat * beatsPerBar;
  const chIndex = new Map(song.channels.map((c, i) => [c.id, i]));
  const compiledPatterns = new Map();

  function compilePattern(name) {
    if (compiledPatterns.has(name)) return compiledPatterns.get(name);
    const pat = song.patterns[name];
    if (!pat) throw new Error(`${song.id}: unknown pattern "${name}"`);
    let length = null;
    const events = [];
    for (const [chId, text] of Object.entries(pat)) {
      const ch = chIndex.get(chId);
      if (ch === undefined) throw new Error(`${song.id}/${name}: unknown channel "${chId}"`);
      const where = `${song.id}/${name}/${chId}`;
      const parsed = parseChannel(text, { barSteps, where });
      if (length === null) length = parsed.length;
      else if (parsed.length !== length) {
        throw new Error(`${where}: ${parsed.length} steps, but other channels have ${length}`);
      }
      for (const e of parsed.events) events.push({ ...e, ch });
    }
    if (!length) throw new Error(`${song.id}/${name}: empty pattern`);
    if (length % barSteps !== 0) throw new Error(`${song.id}/${name}: ${length} steps is not a whole number of bars`);
    const out = { length, events };
    compiledPatterns.set(name, out);
    return out;
  }

  function compileOrder(order) {
    let step = 0;
    const events = [];
    for (const name of order || []) {
      const p = compilePattern(name);
      for (const e of p.events) events.push({ ...e, step: e.step + step });
      step += p.length;
    }
    // Stable sort; at equal steps, settings (vol, inst) come before notes.
    events.sort((a, b) => a.step - b.step || (a.type === 'note') - (b.type === 'note'));
    return { length: step, events };
  }

  const intro = compileOrder(song.intro);
  const loop = compileOrder(song.loop);
  if (!intro.length && !loop.length) throw new Error(`${song.id}: no intro or loop`);
  const stepDur = 60 / song.bpm / stepsPerBeat;
  return {
    id: song.id,
    bpm: song.bpm,
    stepsPerBeat,
    barSteps,
    stepDur,
    swing: song.swing || 0,
    channels: song.channels,
    introSteps: intro.length,
    loopSteps: loop.length,
    intro: intro.events,
    loop: loop.events,
    /** Length in seconds of the intro, the loop, and (for one-shot cues) the whole piece. */
    introSeconds: intro.length * stepDur,
    loopSeconds: loop.length * stepDur,
  };
}

/** Seconds from the song's start to the given (possibly fractional) absolute step, with swing. */
export function stepTime(c, step) {
  const whole = Math.floor(step);
  const swung = whole % 2 === 1 ? c.swing * c.stepDur : 0;
  return step * c.stepDur + (step === whole ? swung : 0);
}

/**
 * Events whose absolute step falls in [from, to). The intro plays once, then the loop repeats
 * forever (or, if there is no loop, the piece ends after the intro).
 * Yields { abs, ev } where abs is the absolute step since the song began.
 */
export function* eventsInRange(c, from, to) {
  if (from < c.introSteps) {
    for (const ev of c.intro) {
      if (ev.step >= from && ev.step < to) yield { abs: ev.step, ev };
    }
  }
  if (!c.loopSteps || to <= c.introSteps) return;
  const start = Math.max(from, c.introSteps) - c.introSteps;
  const end = to - c.introSteps;
  let rep = Math.floor(start / c.loopSteps);
  for (; rep * c.loopSteps < end; rep++) {
    const base = rep * c.loopSteps;
    for (const ev of c.loop) {
      const s = base + ev.step;
      if (s >= start && s < end) yield { abs: s + c.introSteps, ev };
    }
  }
}

/** Absolute step at which the piece ends, or Infinity if it loops. */
export function endStep(c) {
  return c.loopSteps ? Infinity : c.introSteps;
}
