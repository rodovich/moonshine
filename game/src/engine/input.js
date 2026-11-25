// Input: keyboard and pointer, gathered from DOM events and read once per tick.
//
// Keyboard actions: up/down/left/right (arrows or WASD), confirm (Z, Space,
// Enter), cancel (X, Escape). Pointer: taps/clicks and drags in game pixels.

const KEYMAP = {
  ArrowUp: 'up', KeyW: 'up',
  ArrowDown: 'down', KeyS: 'down',
  ArrowLeft: 'left', KeyA: 'left',
  ArrowRight: 'right', KeyD: 'right',
  KeyZ: 'confirm', Space: 'confirm', Enter: 'confirm', NumpadEnter: 'confirm',
  KeyX: 'cancel', Escape: 'cancel', Backspace: 'cancel',
};

export const DIRS = ['up', 'down', 'left', 'right'];

const REPEAT_DELAY = 16; // ticks before a held menu direction repeats
const REPEAT_RATE = 5;

export class Input {
  constructor(display) {
    this.display = display;
    this.held = new Set();
    this.order = []; // held directions, most recent last
    this.queue = []; // presses since last tick
    this.pressedNow = new Set();
    this.pointerQueue = [];
    this.pointerEvents = [];
    this.pointer = { down: false, x: 0, y: 0, id: null };
    this.repeat = { dir: null, t: 0 };
    this.onFirstInput = null;
    this.lastScheme = 'keyboard';

    window.addEventListener('keydown', (e) => this.keydown(e));
    window.addEventListener('keyup', (e) => this.keyup(e));
    window.addEventListener('blur', () => this.releaseAll());
    const c = display.canvas;
    c.addEventListener('pointerdown', (e) => this.pdown(e));
    window.addEventListener('pointermove', (e) => this.pmove(e));
    window.addEventListener('pointerup', (e) => this.pup(e));
    window.addEventListener('pointercancel', (e) => this.pup(e));
    c.addEventListener('contextmenu', (e) => e.preventDefault());
  }

  first() {
    this.anyInput = true;
    if (this.onFirstInput) {
      const f = this.onFirstInput;
      this.onFirstInput = null;
      f();
    }
  }

  keydown(e) {
    const action = KEYMAP[e.code] || KEYMAP[e.key];
    if (!action) return;
    if (e.metaKey || e.ctrlKey || e.altKey) return;
    e.preventDefault();
    this.first();
    this.lastScheme = 'keyboard';
    if (e.repeat) return; // we do our own repeat
    if (!this.held.has(action)) {
      this.held.add(action);
      if (DIRS.includes(action)) this.order.push(action);
    }
    this.queue.push(action);
  }

  keyup(e) {
    const action = KEYMAP[e.code] || KEYMAP[e.key];
    if (!action) return;
    this.held.delete(action);
    this.order = this.order.filter((d) => d !== action);
  }

  releaseAll() {
    this.held.clear();
    this.order = [];
    this.pointer.down = false;
  }

  // True if the last input was a touch (as opposed to a mouse or keys).
  usingTouch() {
    // Before any input, guess from the device.
    if (!this.anyInput) return !!window.matchMedia?.('(pointer: coarse)').matches;
    return this.lastScheme === 'pointer' && this.lastPointerType === 'touch';
  }

  pdown(e) {
    e.preventDefault();
    this.lastPointerType = e.pointerType;
    this.first();
    this.lastScheme = 'pointer';
    if (this.pointer.down && e.pointerId !== this.pointer.id) return; // ignore extra fingers
    const p = this.display.toGame(e.clientX, e.clientY);
    this.pointer = { down: true, x: p.x, y: p.y, id: e.pointerId };
    this.pointerQueue.push({ type: 'down', x: p.x, y: p.y });
    try { this.display.canvas.setPointerCapture(e.pointerId); } catch { /* ignore */ }
  }

  pmove(e) {
    const p = this.display.toGame(e.clientX, e.clientY);
    if (this.pointer.down && e.pointerId !== this.pointer.id) return;
    this.pointer.x = p.x;
    this.pointer.y = p.y;
    this.hover = p;
  }

  pup(e) {
    if (e.pointerId !== this.pointer.id) return;
    const p = this.display.toGame(e.clientX, e.clientY);
    this.pointer.down = false;
    this.pointerQueue.push({ type: 'up', x: p.x, y: p.y });
  }

  // Call once at the start of each tick.
  tick() {
    this.pressedNow = new Set(this.queue);
    this.queue = [];
    this.pointerEvents = this.pointerQueue;
    this.pointerQueue = [];
    const d = this.dir();
    if (d && d === this.repeat.dir) this.repeat.t++;
    else this.repeat = { dir: d, t: 0 };
  }

  // Was this action pressed this tick? Consumes it so only one handler acts.
  pressed(action) {
    if (this.pressedNow.has(action)) {
      this.pressedNow.delete(action);
      return true;
    }
    return false;
  }

  isHeld(action) {
    return this.held.has(action);
  }

  // Most recently pressed direction still held.
  dir() {
    return this.order.length ? this.order[this.order.length - 1] : null;
  }

  // Direction for menus: fires on press, then repeats while held.
  menuDir() {
    for (const d of DIRS) if (this.pressedNow.has(d)) { this.pressedNow.delete(d); return d; }
    const r = this.repeat;
    if (r.dir && r.t >= REPEAT_DELAY && (r.t - REPEAT_DELAY) % REPEAT_RATE === 0) return r.dir;
    return null;
  }

  // Pointer taps (pointerdown events) this tick. Consumes them.
  taps() {
    const out = this.pointerEvents.filter((e) => e.type === 'down');
    this.pointerEvents = this.pointerEvents.filter((e) => e.type !== 'down');
    return out;
  }

  // Drop everything pending (used when the mode changes so a press
  // doesn't leak into the next screen).
  flush() {
    this.pressedNow.clear();
    this.pointerEvents = [];
  }
}
