// Music lint: checks a song's notes against its declared harmony and for common writing problems.
// Pure (no Web Audio), so it runs in Node tests and on the dev page.
//
// Songs declare chords per pattern with a `harmony` string, one or more chords per bar:
//   harmony: 'F | C7 | F Dm | F:4 C:12 | N |'
// Chords in a bar split it evenly unless given :steps. N means "no chord" (not checked).
// Chord symbols: root (C, F#, Bb) + quality ('', m, 7, maj7, m7, m6, 6, 9, m9, add9, dim, dim7,
// m7b5, aug, sus2, sus4, 7sus4) + optional /bass.
//
// Channel roles (channel.role, or by default: kits are 'perc', 'lead' is 'melody', 'bass' is
// 'bass', everything else 'acc'). A pattern can name a different melody channel with
// `melody: 'flute'`; the usual lead then counts as a 'counter' line in that pattern.

import { parseChannel, pitchToMidi } from './sequencer.js';

const QUALITIES = {
  '': [0, 4, 7], m: [0, 3, 7], 7: [0, 4, 7, 10], maj7: [0, 4, 7, 11], m7: [0, 3, 7, 10],
  m6: [0, 3, 7, 9], 6: [0, 4, 7, 9], 9: [0, 4, 7, 10, 2], m9: [0, 3, 7, 10, 2], add9: [0, 4, 7, 2],
  dim: [0, 3, 6], dim7: [0, 3, 6, 9], m7b5: [0, 3, 6, 10], aug: [0, 4, 8],
  sus2: [0, 2, 7], sus4: [0, 5, 7], sus: [0, 5, 7], '7sus4': [0, 5, 7, 10],
};
// Non-chord tones that still sound fine held against the chord (9ths, 6ths/13ths, 11ths on minor).
const TENSIONS = {
  '': [2, 9, 11], 6: [2, 11], maj7: [2, 9], add9: [9, 11], 7: [2, 9], 9: [9],
  m: [2, 5, 10], m7: [2, 5], m6: [2, 5], m9: [5],
  sus2: [5, 9, 10], sus4: [2, 9, 10], sus: [2, 9, 10], '7sus4': [2, 9],
  dim: [], dim7: [], m7b5: [5], aug: [2, 10],
};
const CHORD_RE = /^([A-G][#b]?)(7sus4|maj7|m7b5|m7|m6|m9|madd9|m|dim7|dim|aug|sus4|sus2|sus|add9|9|7|6)?(?:\/([A-G][#b]?))?$/;

const pc = (name) => ((pitchToMidi(name + '4') % 12) + 12) % 12;

export function parseChord(sym) {
  if (sym === 'N') return null;
  const m = CHORD_RE.exec(sym);
  if (!m) throw new Error(`can't read chord "${sym}"`);
  const q = m[2] || '';
  const root = pc(m[1]);
  const tones = new Set(QUALITIES[q].map((i) => (root + i) % 12));
  const tensions = new Set((TENSIONS[q] || []).map((i) => (root + i) % 12));
  const bass = m[3] ? pc(m[3]) : root;
  return { sym, root, bass, tones, tensions };
}

/** Parse a harmony string into [{ step, len, chord }] for a pattern of `length` steps. */
export function parseHarmony(text, barSteps, where = '?') {
  const bars = text.split('|').map((b) => b.trim()).filter((b, i, a) => b || i < a.length - 1);
  const out = [];
  bars.forEach((bar, bi) => {
    const toks = bar.split(/\s+/).filter(Boolean);
    if (!toks.length) throw new Error(`${where}: empty harmony bar ${bi + 1}`);
    const parsed = toks.map((t) => { const [s, n] = t.split(':'); return { s, n: n ? Number(n) : null }; });
    const fixed = parsed.reduce((a, p) => a + (p.n || 0), 0);
    const free = parsed.filter((p) => !p.n).length;
    const each = free ? (barSteps - fixed) / free : 0;
    if (fixed + each * free !== barSteps) throw new Error(`${where}: harmony bar ${bi + 1} doesn't fill the bar`);
    let step = bi * barSteps;
    for (const p of parsed) {
      const len = p.n || each;
      out.push({ step, len, chord: parseChord(p.s) });
      step += len;
    }
  });
  return out;
}

function roleOf(song, ch) {
  if (ch.role) return ch.role;
  if (song.instruments?.[ch.inst]?.kit || ch.inst === 'kit') return 'perc';
  if (ch.id === 'lead') return 'melody';
  if (ch.id === 'bass') return 'bass';
  return 'acc';
}

const NAMES = ['C', 'C#', 'D', 'Eb', 'E', 'F', 'F#', 'G', 'Ab', 'A', 'Bb', 'B'];
const nameOf = (midi) => `${NAMES[midi % 12]}${Math.floor(midi / 12) - 1}`;

/**
 * Lint one song. Returns { issues: [{ level: 'warn' | 'info', where, msg }], stats }.
 * Warnings are things to fix or explicitly allow (song.lintAllow: [{ match, why }]).
 */
export function lintSong(song) {
  const spb = song.stepsPerBeat || 4;
  const barSteps = spb * (song.beatsPerBar || 4);
  const issues = [];
  const add = (level, where, msg) => {
    const allowed = (song.lintAllow || []).some((a) => where.startsWith(a.match));
    issues.push({ level: allowed ? 'info' : level, where, msg: allowed ? `${msg} (allowed)` : msg });
  };
  const loc = (pat, ch, step) => `${pat}/${ch} bar ${Math.floor(step / barSteps) + 1} beat ${(step % barSteps) / spb + 1}`;
  const order = [...new Set([...(song.intro || []), ...(song.loop || [])])];
  const melodyNotes = []; // across the whole piece, in order, for monotony checks
  let totalNotes = 0;
  let pieceSteps = 0;

  for (const name of order) {
    const pat = song.patterns[name];
    const chans = {};
    let patLen = 0;
    for (const ch of song.channels) {
      if (pat[ch.id] === undefined) continue;
      const p = parseChannel(pat[ch.id], { barSteps, where: `${song.id}/${name}/${ch.id}` });
      chans[ch.id] = p.events.filter((e) => e.type === 'note');
      patLen = Math.max(patLen, p.length);
    }
    const melodyId = pat.melody || song.channels.find((c) => roleOf(song, c) === 'melody')?.id;
    const role = (ch) => (ch.id === melodyId ? 'melody' : roleOf(song, ch) === 'melody' ? 'counter' : roleOf(song, ch));
    const harmony = pat.harmony ? parseHarmony(pat.harmony, barSteps, `${song.id}/${name}`) : null;
    const chordAt = (s) => harmony?.find((h) => s >= h.step && s < h.step + h.len)?.chord ?? null;

    for (const ch of song.channels) {
      const notes = chans[ch.id];
      if (!notes) continue;
      const r = role(ch);
      if (r === 'perc') continue;
      totalNotes += notes.length;
      if (r === 'melody') melodyNotes.push(...notes.map((n) => ({ ...n, pat: name })));
      let prev = null;
      notes.forEach((n, idx) => {
        if (n.midi === undefined) return;
        const where = loc(name, ch.id, n.step);
        const chord = harmony ? chordAt(n.step) : null;
        const p = n.midi % 12;
        const strong = n.step % spb === 0;
        const long = n.len >= spb || (strong && n.len >= spb / 2);
        // A bass note off the downbeat that steps (≤ 2 semitones) into the next chord tone is an
        // approach note, as in a walking bass.
        const next = notes[idx + 1];
        const nextChord = next && harmony ? chordAt(next.step) : null;
        const approach = r === 'bass' && n.step % barSteps !== 0 && next?.midi !== undefined &&
          Math.abs(next.midi - n.midi) <= 2 && nextChord?.tones.has(next.midi % 12);
        if (chord && long && !chord.tones.has(p) && !approach) {
          const tension = chord.tensions.has(p);
          if (r === 'melody' || r === 'counter') {
            if (!tension) add('warn', where, `${nameOf(n.midi)} (${n.len} steps) clashes with ${chord.sym}`);
          } else if (!tension || r === 'bass') {
            add('warn', where, `${r} ${nameOf(n.midi)} (${n.len} steps) isn't in ${chord.sym}`);
          }
        }
        if (chord && r === 'bass' && n.step % barSteps === 0 && p !== chord.bass && p !== chord.root) {
          add('info', where, `bass ${nameOf(n.midi)} on the downbeat of ${chord.sym}`);
        }
        if ((r === 'melody' || r === 'counter') && prev && n.step - (prev.step + prev.len) <= barSteps) {
          const d = Math.abs(n.midi - prev.midi);
          if (d > 12) add('warn', where, `leap of ${d} semitones (${nameOf(prev.midi)} to ${nameOf(n.midi)})`);
          else if (d > 9) add('info', where, `wide leap of ${d} semitones (${nameOf(prev.midi)} to ${nameOf(n.midi)})`);
          else if (d === 6 && !(chord && chord.tones.has(p) && chord.tones.has(prev.midi % 12))) {
            add('info', where, `tritone leap ${nameOf(prev.midi)} to ${nameOf(n.midi)}`);
          }
        }
        prev = n;
      });
    }

    pieceSteps += patLen;

    // Semitone (and minor ninth) clashes between voices sounding together for half a beat or more.
    if (song.lint?.clashes !== false) {
      const all = song.channels
        .filter((c) => chans[c.id] && role(c) !== 'perc')
        .flatMap((c) => chans[c.id].filter((n) => n.midi !== undefined).map((n) => ({ ...n, ch: c.id })));
      for (let i = 0; i < all.length; i++) {
        for (let j = i + 1; j < all.length; j++) {
          const a = all[i];
          const b = all[j];
          if (a.ch === b.ch) continue;
          const overlap = Math.min(a.step + a.len, b.step + b.len) - Math.max(a.step, b.step);
          const d = Math.abs(a.midi - b.midi);
          if (overlap >= spb / 2 && (d === 1 || d === 13)) {
            add('warn', loc(name, `${a.ch}+${b.ch}`, Math.max(a.step, b.step)), `${nameOf(a.midi)} against ${nameOf(b.midi)}`);
          }
        }
      }
      // Mud: two or more non-bass voices close together below G3.
      for (let s = 0; s < patLen; s += spb) {
        const low = song.channels
          .filter((c) => chans[c.id] && !['perc', 'bass'].includes(role(c)))
          .flatMap((c) => chans[c.id].filter((n) => n.midi !== undefined && n.midi < 55 && n.step <= s && n.step + n.len > s));
        for (let i = 0; i < low.length; i++) {
          for (let j = i + 1; j < low.length; j++) {
            if (Math.abs(low[i].midi - low[j].midi) <= 4) add('info', loc(name, 'low', s), `close low voices ${nameOf(low[i].midi)} and ${nameOf(low[j].midi)}`);
          }
        }
      }
    }
  }

  // Monotony and shape of the melody across the whole piece.
  const stats = {};
  const pitched = melodyNotes.filter((n) => n.midi !== undefined);
  if (pitched.length) {
    const pitches = new Set(pitched.map((n) => n.midi));
    const lengths = new Set(pitched.map((n) => n.len));
    const lo = Math.min(...pitched.map((n) => n.midi));
    const hi = Math.max(...pitched.map((n) => n.midi));
    const byBar = new Map();
    for (const n of pitched) {
      const key = `${n.pat}:${Math.floor(n.step / barSteps)}`;
      byBar.set(key, `${byBar.get(key) || ''} ${n.midi}:${n.step % barSteps}:${n.len}`);
    }
    const bars = [...byBar.values()];
    const unique = new Set(bars).size;
    Object.assign(stats, {
      melodyRange: `${nameOf(lo)}–${nameOf(hi)}`,
      distinctPitches: pitches.size,
      distinctLengths: lengths.size,
      melodyBars: bars.length,
      uniqueMelodyBars: unique,
    });
    if (pitches.size < 6) add('warn', song.id, `melody uses only ${pitches.size} pitches`);
    if (lengths.size < 3) add('warn', song.id, `melody uses only ${lengths.size} note lengths`);
    if (bars.length >= 8 && unique / bars.length < 0.35) add('warn', song.id, `only ${unique} of ${bars.length} melody bars are different`);
    if (hi - lo > 19) add('info', song.id, `melody spans ${hi - lo} semitones`);
  }
  const seconds = (pieceSteps * 60) / song.bpm / spb;
  stats.notesPerSecond = Math.round((totalNotes / seconds) * 10) / 10;
  return { issues, stats };
}
