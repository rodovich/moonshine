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
  cursor: 'blip',
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

export function unlockAudio() {
  audio.initAudio().catch((err) => warnOnce('init', '', err));
}

export function playMusic(id, opts) {
  if (!audio.MUSIC_IDS.includes(id)) return warnOnce('music', id, 'unknown id');
  try { audio.playMusic(id, opts); } catch (err) { warnOnce('music', id, err); }
}

export function stopMusic(fadeMs) {
  try { audio.stopMusic(fadeMs); } catch (err) { warnOnce('stop', '', err); }
}

export function playCue(id) {
  if (!audio.MUSIC_IDS.includes(id)) return warnOnce('cue', id, 'unknown id');
  try { audio.playCue(id); } catch (err) { warnOnce('cue', id, err); }
}

export function sfx(id) {
  const real = SFX_ALIASES[id] ?? id;
  if (!audio.SFX_IDS.includes(real)) return warnOnce('sfx', id, 'unknown id');
  try { audio.sfx(real); } catch (err) { warnOnce('sfx', id, err); }
}

export function currentMusic() {
  return audio.currentMusic();
}

export { setWrongness, setVolume, setMuted } from '../audio/index.js';
