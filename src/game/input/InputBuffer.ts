import { RawInputs } from '../types';

export interface QueuedInput {
  raw: RawInputs;
  justPressed: {
    up: boolean;
    down: boolean;
    left: boolean;
    right: boolean;
    lp: boolean;
    rp: boolean;
    lk: boolean;
    rk: boolean;
    ultimate: boolean;
  };
  frame: number;
}

export class InputBuffer {
  private history: QueuedInput[] = [];
  private lastRaw: RawInputs = {
    up: false,
    down: false,
    left: false,
    right: false,
    lp: false,
    rp: false,
    lk: false,
    rk: false,
    ultimate: false,
  };
  private bufferSize: number;

  constructor(bufferSize = 6) {
    this.bufferSize = bufferSize;
  }

  public setBufferSize(size: number) {
    this.bufferSize = size;
  }

  public getBufferSize(): number {
    return this.bufferSize;
  }

  public clear() {
    this.history = [];
    this.lastRaw = {
      up: false,
      down: false,
      left: false,
      right: false,
      lp: false,
      rp: false,
      lk: false,
      rk: false,
      ultimate: false,
    };
  }

  public push(raw: RawInputs, currentFrame: number) {
    const justPressed = {
      up: raw.up && !this.lastRaw.up,
      down: raw.down && !this.lastRaw.down,
      left: raw.left && !this.lastRaw.left,
      right: raw.right && !this.lastRaw.right,
      lp: raw.lp && !this.lastRaw.lp,
      rp: raw.rp && !this.lastRaw.rp,
      lk: raw.lk && !this.lastRaw.lk,
      rk: raw.rk && !this.lastRaw.rk,
      ultimate: raw.ultimate && !this.lastRaw.ultimate,
    };

    this.history.push({
      raw: { ...raw },
      justPressed,
      frame: currentFrame,
    });

    this.lastRaw = { ...raw };

    // Keep history bounded (keep up to 30 frames for motion inputs like f,f or qcf, but evaluate within bufferSize for actions)
    if (this.history.length > 30) {
      this.history.shift();
    }
  }

  /**
   * Evaluates the buffer for candidate moves relative to fighter facing (1 = right, -1 = left).
   * Priority:
   * 1. Ultimate ('Q')
   * 2. Throw ('LP+LK')
   * 3. Motions + Buttons (e.g. df+RK, df+RP, f+RP, etc.)
   * 4. Basic attacks ('LP', 'RP', 'LK', 'RK')
   * 5. Movement (sidestep, jump, crouch, dash)
   */
  public queryCommand(facing: 1 | -1, availableMoves: string[]): string | null {
    if (this.history.length === 0) return null;

    // Look back within bufferSize frames for button presses
    const recentWindow = this.history.slice(-this.bufferSize);

    // 1. Ultimate ('Q') - Single key press
    for (let i = recentWindow.length - 1; i >= 0; i--) {
      if (recentWindow[i].justPressed.ultimate) {
        if (availableMoves.includes('Q')) {
          return 'Q';
        }
      }
    }

    // 2. Throw ('LP+LK' or 'LK+LP')
    for (let i = recentWindow.length - 1; i >= 0; i--) {
      const entry = recentWindow[i];
      // Simultaneous press or close chord within 2 frames
      const lpActive = entry.raw.lp;
      const lkActive = entry.raw.lk;
      const throwJustPressed = entry.justPressed.lp || entry.justPressed.lk;
      if (lpActive && lkActive && throwJustPressed) {
        if (availableMoves.includes('LP+LK')) {
          return 'LP+LK';
        }
      }
    }

    // 3. Directional combinations + attacks
    for (let i = recentWindow.length - 1; i >= 0; i--) {
      const entry = recentWindow[i];
      const forward = facing === 1 ? entry.raw.right : entry.raw.left;
      const back = facing === 1 ? entry.raw.left : entry.raw.right;
      const down = entry.raw.down;
      const up = entry.raw.up;

      // Down-forward + button
      if (down && forward) {
        if (entry.justPressed.rk && availableMoves.includes('df+RK')) return 'df+RK';
        if (entry.justPressed.rp && availableMoves.includes('df+RP')) return 'df+RP';
        if (entry.justPressed.lk && availableMoves.includes('df+LK')) return 'df+LK';
        if (entry.justPressed.lp && availableMoves.includes('df+LP')) return 'df+LP';
      }

      // Down-back + button
      if (down && back) {
        if (entry.justPressed.rk && availableMoves.includes('db+RK')) return 'db+RK';
        if (entry.justPressed.rp && availableMoves.includes('db+RP')) return 'db+RP';
        if (entry.justPressed.lk && availableMoves.includes('db+LK')) return 'db+LK';
        if (entry.justPressed.lp && availableMoves.includes('db+LP')) return 'db+LP';
      }

      // Down + button
      if (down && !forward && !back) {
        if (entry.justPressed.rk && availableMoves.includes('d+RK')) return 'd+RK';
        if (entry.justPressed.rp && availableMoves.includes('d+RP')) return 'd+RP';
        if (entry.justPressed.lk && availableMoves.includes('d+LK')) return 'd+LK';
        if (entry.justPressed.lp && availableMoves.includes('d+LP')) return 'd+LP';
      }

      // Forward + button
      if (forward && !down && !up) {
        if (entry.justPressed.rk && availableMoves.includes('f+RK')) return 'f+RK';
        if (entry.justPressed.rp && availableMoves.includes('f+RP')) return 'f+RP';
        if (entry.justPressed.lk && availableMoves.includes('f+LK')) return 'f+LK';
        if (entry.justPressed.lp && availableMoves.includes('f+LP')) return 'f+LP';
      }

      // Back + button
      if (back && !down && !up) {
        if (entry.justPressed.rk && availableMoves.includes('b+RK')) return 'b+RK';
        if (entry.justPressed.rp && availableMoves.includes('b+RP')) return 'b+RP';
        if (entry.justPressed.lk && availableMoves.includes('b+LK')) return 'b+LK';
        if (entry.justPressed.lp && availableMoves.includes('b+LP')) return 'b+LP';
      }

      // Neutral button presses
      if (entry.justPressed.lp && availableMoves.includes('LP')) return 'LP';
      if (entry.justPressed.rp && availableMoves.includes('RP')) return 'RP';
      if (entry.justPressed.lk && availableMoves.includes('LK')) return 'LK';
      if (entry.justPressed.rk && availableMoves.includes('RK')) return 'RK';
    }

    return null;
  }

  /**
   * Checks for double tap up or double tap down for sidestep within recent 16 frames.
   */
  public querySidestep(): 'up' | 'down' | null {
    if (this.history.length < 4) return null;
    const window = this.history.slice(-16);

    // Look for tap-release-tap pattern for UP
    let upPresses = 0;
    for (let i = 0; i < window.length; i++) {
      if (window[i].justPressed.up) {
        upPresses++;
      }
    }
    if (upPresses >= 2 && window[window.length - 1].raw.up) {
      return 'up';
    }

    // Look for tap-release-tap pattern for DOWN
    let downPresses = 0;
    for (let i = 0; i < window.length; i++) {
      if (window[i].justPressed.down) {
        downPresses++;
      }
    }
    if (downPresses >= 2 && window[window.length - 1].raw.down) {
      return 'down';
    }

    return null;
  }

  public getLatest(): QueuedInput | undefined {
    return this.history[this.history.length - 1];
  }
}
