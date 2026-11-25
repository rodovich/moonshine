// Boot and main loop. `startGame(content)` builds the display, input, and UI,
// shows the title screen (or jumps straight into the world when debug URL
// parameters say so), and runs a fixed 60 Hz update with rendering on every
// animation frame.

import { Display, WIDTH, HEIGHT } from './display.js';
import { wrap, drawTextCentered, LINE_HEIGHT } from './text.js';
import { Input } from './input.js';
import { Effects } from './effects.js';
import { TextBox } from './textbox.js';
import { Inventory } from './inventory.js';
import { World } from './world.js';
import { Title } from './title.js';
import { newState, hasSave, loadSave, clearSave } from './save.js';
import { readDebugParams } from './debug.js';
import { unlockAudio } from './sound.js';

const STEP = 1000 / 60;

export function makeRng(seed) {
  let s = seed >>> 0 || 1;
  const next = () => {
    // mulberry32
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  return { next, int: (min, max) => min + Math.floor(next() * (max - min + 1)) };
}

export class Game {
  constructor(content, parent) {
    this.content = content;
    this.debug = readDebugParams(content);
    this.rng = makeRng(this.debug.seed ?? Date.now());
    this.display = new Display(parent);
    this.input = new Input(this.display);
    this.input.onFirstInput = unlockAudio;
    this.effects = new Effects();
    this.textbox = new TextBox();
    this.inventory = new Inventory(content.items || {});
    this.ticks = 0;
    this.scene = null;

    if (this.debug.start) {
      this.startWorld(this.debug.state, { runNewGame: false });
      if (this.debug.run) {
        const script = content.scripts?.[this.debug.run];
        if (script) this.world.run(script);
        else console.warn(`[debug] no script "${this.debug.run}" in content.scripts`);
      }
    } else {
      this.scene = new Title(this, { canContinue: hasSave() && !!loadSave() });
      this.effects.fadeAlpha = 1;
      this.effects.fade('in', 0.6);
    }
    this.last = performance.now();
    this.acc = 0;
    this.frame = this.frame.bind(this);
    requestAnimationFrame(this.frame);
  }

  async startFromTitle(choice) {
    await this.effects.fade('out', 0.4);
    this.input.flush();
    if (choice === 'continue') {
      const s = loadSave();
      if (s) {
        this.startWorld(s, { runNewGame: false });
      } else {
        this.startWorld(newState(this.content.start), { runNewGame: true });
      }
    } else {
      clearSave();
      this.startWorld(newState(this.content.start), { runNewGame: true });
    }
    await this.effects.fade('in', 0.4);
  }

  // Leave the world for the title screen (used by the end-of-slice card).
  async backToTitle() {
    if (this.effects.fadeAlpha < 1) await this.effects.fade('out', 0.6);
    this.input.flush();
    this.card = null;
    this.world = null;
    this.scene = new Title(this, { canContinue: hasSave() && !!loadSave() });
    this.effects.setLight([], 0);
    await this.effects.clear(0);
    await this.effects.fade('in', 0.6);
  }

  startWorld(state, { runNewGame }) {
    this.world = new World(this, state);
    this.scene = this.world;
    if (runNewGame && this.content.onNewGame) this.world.run(this.content.onNewGame);
    if (this.world.mapDef.onEnter) this.world.run(this.world.mapDef.onEnter);
  }

  frame(now) {
    let dt = now - this.last;
    this.last = now;
    if (dt > 250) dt = STEP; // tab was hidden; don't fast-forward
    // Snap near-whole frame times so 60 Hz displays get exactly one tick per frame.
    const whole = Math.round(dt / STEP);
    if (whole >= 1 && Math.abs(dt - whole * STEP) < 1.5) dt = whole * STEP;
    this.acc += dt;
    let n = 0;
    while (this.acc >= STEP - 0.01 && n < 8) {
      this.update();
      this.acc -= STEP;
      n++;
    }
    if (n === 8) this.acc = 0;
    this.render();
    requestAnimationFrame(this.frame);
  }

  update() {
    this.ticks++;
    this.input.tick();
    this.scene.update(this.input);
    this.effects.update();
  }

  // A snapshot for tests and the console.
  snapshot() {
    const w = this.world;
    if (!w || this.scene !== w) return { scene: 'title' };
    const p = w.player;
    return {
      scene: 'world',
      map: w.state.map,
      x: p.x,
      y: p.y,
      facing: p.facing,
      moving: p.moving,
      busy: w.busy > 0,
      idle: !p.moving && !w.busy && !w.control.path && !w.textbox.open && !w.inventory.open,
      text: w.textbox.open ? w.textbox.pageText() : null,
      speaker: w.textbox.open ? w.textbox.active.speaker : null,
      choice: w.textbox.open && w.textbox.active.choice ? w.textbox.active.choice.options : null,
      inventoryOpen: w.inventory.open,
      holding: w.control.holding,
      flags: { ...w.state.flags },
      looks: { ...(w.state.looks || {}) },
      lighting: w.lighting,
      picture: !!w.picture,
      card: this.card ? this.card.text : null,
      hint: w.hintState ? w.hintState.text : null,
      items: [...w.state.inventory],
      entities: w.entities.filter((e) => !e.isPlayer).map((e) => ({ id: e.id, x: e.x, y: e.y, facing: e.facing })),
    };
  }

  // Client coordinates of the center of tile (tx, ty) on screen, for tests.
  tileToClient(tx, ty) {
    const w = this.world;
    return this.display.toClient(tx * 16 + 8 - w.cam.x, ty * 16 + 8 - w.cam.y);
  }

  render() {
    const ctx = this.display.bctx;
    this.scene.draw(ctx);
    this.effects.applyFade(ctx);
    if (this.card) drawCard(ctx, this.card.text);
    this.display.present(this.effects.waveParams());
  }
}

// A centered text card on black.
function drawCard(ctx, text) {
  ctx.fillStyle = '#000000';
  ctx.fillRect(0, 0, WIDTH, HEIGHT);
  const lines = wrap(text, WIDTH - 48);
  const top = Math.round(HEIGHT / 2 - (lines.length * LINE_HEIGHT) / 2);
  lines.forEach((line, i) => drawTextCentered(ctx, line, WIDTH / 2, top + i * LINE_HEIGHT, { color: 'ui_text' }));
}

export function startGame(content, parent = document.body) {
  const game = new Game(content, parent);
  // Test and console hook.
  window.moonshine = game;
  return game;
}
