# Audio

Synthesized music and sound effects. Creative direction and the music data format are in [docs/audio-direction.md](../../../docs/audio-direction.md). Try everything at `game/dev/audio.html`.

## API for the engine

Import from `src/audio/index.js`:

```js
import { initAudio, playMusic, stopMusic, playCue, sfx, setVolume, setMuted } from './audio/index.js';
```

| Call | What it does |
|---|---|
| `initAudio()` | Creates and resumes the audio context. Call it from the first user input event (keydown, pointerdown); browsers block audio before that. Safe to call repeatedly. Returns a promise. |
| `playMusic(id, { fadeMs = 800 })` | Crossfades to a music track. Asking for the track already playing does nothing. Called before `initAudio()`, it remembers the request and starts when audio is ready, so you can request the title music at load. |
| `stopMusic(fadeMs = 800)` | Fades the music out. |
| `playCue(id, { resume = true })` | Interrupts with a one-shot cue (`'wrongness'`): the music dips out, the cue plays, and the music fades back (or stays stopped with `resume: false`). |
| `sfx(id, { pitch, volume })` | Plays a sound effect. `pitch` is in semitones. Does nothing before `initAudio()`. |
| `setVolume(kind, v)`, `getVolume(kind)` | `kind` is `'master'`, `'music'`, or `'sfx'`; `v` is 0..1. Saved to `localStorage`. |
| `setMuted(bool)`, `isMuted()` | Mute everything. Saved to `localStorage`. |
| `setWrongness(amount)` | 0..1: how far the Wrongness has crept into the music (notes drift out of tune). |
| `currentMusic()` | Id of the playing (or requested) track, or `null`. |
| `MUSIC_IDS`, `SFX_IDS` | All ids. |

Music ids: `title`, `neighborhood`, `wrongness` (a cue: use `playCue`).

Sound effect ids: `blip` (dialog text), `blip_cheryl` (Cheryl's narration), `step`, `bump`, `confirm`, `cancel`, `menu_open`, `menu_close`, `item_get`, `door`, `splash`, `wrong_sting`.

Suggested use:

- Text: one `blip` (or `blip_cheryl`) every other letter as text types out. They cut each other off, so calling one per letter is fine too.
- Footsteps: one `step` per step (about every 250–300 ms while walking).
- `item_get` and `wrong_sting` dip the music by themselves; there's no need to stop it.
- The audio context is suspended while the tab is hidden and resumed when it's visible again.
- Unknown ids throw, so typos show up immediately.

## Files

| File | Contents |
|---|---|
| `index.js` | public API, master mix, live scheduling clock |
| `sequencer.js` | music notation parser, compiler, and timing (pure; tested in Node) |
| `player.js` | plays one compiled song: channels, fades, ducking |
| `synth.js` | voices: waveforms, envelopes, filters, one-shot layers, echo |
| `instruments.js` | the instrument palette and drum kit |
| `sfx.js` | sound effect definitions |
| `music/` | songs, one module each, registered in `music/index.js` |
| `offline.js` | offline rendering and level measurement for tools and tests |

## Tests

- `node --test tests/audio/` — notation parsing, loop timing, and that every song compiles and uses real instruments.
- `node tests/audio/check-audio.mjs [--screenshot out.png]` — loads the dev page in Chromium with Playwright, exercises the live API (music, crossfade, cue, every effect), renders everything offline, and fails on page errors, clipping, or silence. Pass `--playwright path/to/playwright/index.mjs` if Playwright isn't installed in the repo.
