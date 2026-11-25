// The engine's bridge to the audio module (src/audio/index.js).
//
// Engine and content code call these functions instead of importing the audio
// module directly. The bridge maps the engine's generic sound ids to the audio
// task's ids and ignores unknown ids (logging each once), so content can name
// music or sounds before they exist without crashing the game.

import * as audio from '../audio/index.js';

const SFX_ALIASES = {
  text: 'blip',
  text_cheryl: 'blip_cheryl',
  select: 'confirm',
  item: 'item_get',
};

const warned = new Set();
function warnOnce(kind, id, err) {
  const key = `${kind}:${id}`;
  if (warned.has(key)) return;
  warned.add(key);
  console.warn(`[sound] ${kind} "${id}" unavailable:`, err?.message ?? err);
}

// Call from user gestures until it returns true. initAudio() is safe to call
// repeatedly; Safari may ignore the first attempt (a pointerdown) and accept a
// later one (the pointerup), so the engine keeps trying until audio runs.
export function unlockAudio() {
  if (audio.audioReady && audio.audioReady()) return true;
  audio.initAudio().catch((err) => warnOnce('init', '', err));
  return !!(audio.audioReady && audio.audioReady());
}

export function playMusic(id, opts) {
  if (!audio.MUSIC_IDS.includes(id)) return warnOnce('music', id, 'unknown id');
  try { audio.playMusic(id, opts); } catch (err) { warnOnce('music', id, err); }
}

export function stopMusic(fadeMs) {
  try { audio.stopMusic(fadeMs); } catch (err) { warnOnce('stop', '', err); }
}

export function playCue(id, opts) {
  if (!audio.MUSIC_IDS.includes(id)) return warnOnce('cue', id, 'unknown id');
  try { audio.playCue(id, opts); } catch (err) { warnOnce('cue', id, err); }
}

/** The current music runs down like a music box over `ms` and stops (the moonrise). */
export function windDownMusic(ms) {
  try { audio.windDownMusic(ms); } catch (err) { warnOnce('wind', '', err); }
}

export function sfx(id) {
  const real = SFX_ALIASES[id] ?? id;
  if (!audio.SFX_IDS.includes(real)) return warnOnce('sfx', id, 'unknown id');
  try { audio.sfx(real); } catch (err) { warnOnce('sfx', id, err); }
}

/** Start a looping sound (crowd, wind, water_pour, timer_tick). Already running: no change. */
export function startLoop(id, opts) {
  if (!audio.LOOP_IDS.includes(id)) return warnOnce('loop', id, 'unknown id');
  try { audio.startLoop(id, opts); } catch (err) { warnOnce('loop', id, err); }
}

/** Stop a looping sound over `fadeMs` (0 for a dead stop). */
export function stopLoop(id, fadeMs) {
  try { audio.stopLoop(id, fadeMs); } catch (err) { warnOnce('loop', id, err); }
}

export function stopAllLoops(fadeMs) {
  try { audio.stopAllLoops(fadeMs); } catch (err) { warnOnce('loop', '', err); }
}

// Looping ambience beds for a map (crowd, wind): starts the map's loops and
// fades out the previous map's. Loops a script started itself are left alone.
let ambienceLoops = [];
export function setAmbience(ids) {
  const next = (ids || []).filter((id) => {
    if (audio.LOOP_IDS && audio.LOOP_IDS.includes(id)) return true;
    warnOnce('ambience', id, 'unknown loop id');
    return false;
  });
  for (const id of ambienceLoops) if (!next.includes(id)) stopLoop(id, 800);
  for (const id of next) startLoop(id);
  ambienceLoops = next;
}

// A filter over the music ('muffled' indoors, null for none). Passed on to
// the audio module's setMusicFilter if it has one; otherwise ignored.
export function setMusicFilter(name) {
  if (typeof audio.setMusicFilter !== 'function') return;
  try { audio.setMusicFilter(name || null); } catch (err) { warnOnce('filter', String(name), err); }
}

// Footsteps: quiet unless the audio module defines the id.
export function step(id) {
  const real = SFX_ALIASES[id] ?? id;
  if (!audio.SFX_IDS.includes(real)) return;
  try { audio.sfx(real); } catch { /* ignore */ }
}

export function currentMusic() {
  return audio.currentMusic();
}

export { setWrongness, setVolume, setMuted } from '../audio/index.js';
