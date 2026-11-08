import { RawInputs } from '../types';

export interface PlayerKeyMap {
  up: string;
  down: string;
  left: string;
  right: string;
  lp: string;
  rp: string;
  lk: string;
  rk: string;
  ultimate: string;
}

export const DEFAULT_P1_KEYS: PlayerKeyMap = {
  up: 'KeyW',
  down: 'KeyS',
  left: 'KeyA',
  right: 'KeyD',
  lp: 'KeyJ',
  rp: 'KeyK',
  lk: 'KeyN',
  rk: 'KeyM',
  ultimate: 'KeyQ',
};

export const DEFAULT_P2_KEYS: PlayerKeyMap = {
  up: 'ArrowUp',
  down: 'ArrowDown',
  left: 'ArrowLeft',
  right: 'ArrowRight',
  lp: 'Numpad4',
  rp: 'Numpad5',
  lk: 'Numpad1',
  rk: 'Numpad2',
  ultimate: 'Numpad0',
};

export class KeyBindingsManager {
  private p1Keys: PlayerKeyMap = { ...DEFAULT_P1_KEYS };
  private p2Keys: PlayerKeyMap = { ...DEFAULT_P2_KEYS };
  private pressedKeys: Set<string> = new Set();

  constructor() {
    this.loadFromStorage();
  }

  public getP1Keys(): PlayerKeyMap {
    return { ...this.p1Keys };
  }

  public getP2Keys(): PlayerKeyMap {
    return { ...this.p2Keys };
  }

  public setP1Key(action: keyof PlayerKeyMap, newKey: string): { success: boolean; conflictAction?: string } {
    // Check conflicts across P1 bindings
    for (const [act, bound] of Object.entries(this.p1Keys)) {
      if (act !== action && bound.toLowerCase() === newKey.toLowerCase()) {
        return { success: false, conflictAction: act };
      }
    }
    this.p1Keys[action] = newKey;
    this.saveToStorage();
    return { success: true };
  }

  public setP2Key(action: keyof PlayerKeyMap, newKey: string): { success: boolean; conflictAction?: string } {
    for (const [act, bound] of Object.entries(this.p2Keys)) {
      if (act !== action && bound.toLowerCase() === newKey.toLowerCase()) {
        return { success: false, conflictAction: act };
      }
    }
    this.p2Keys[action] = newKey;
    this.saveToStorage();
    return { success: true };
  }

  public resetToDefaults() {
    this.p1Keys = { ...DEFAULT_P1_KEYS };
    this.p2Keys = { ...DEFAULT_P2_KEYS };
    this.saveToStorage();
  }

  public handleKeyDown(code: string) {
    this.pressedKeys.add(code);
  }

  public handleKeyUp(code: string) {
    this.pressedKeys.delete(code);
  }

  public clearAll() {
    this.pressedKeys.clear();
  }

  public getRawInputs(playerId: 'p1' | 'p2'): RawInputs {
    const keys = playerId === 'p1' ? this.p1Keys : this.p2Keys;
    return {
      up: this.pressedKeys.has(keys.up),
      down: this.pressedKeys.has(keys.down),
      left: this.pressedKeys.has(keys.left),
      right: this.pressedKeys.has(keys.right),
      lp: this.pressedKeys.has(keys.lp),
      rp: this.pressedKeys.has(keys.rp),
      lk: this.pressedKeys.has(keys.lk),
      rk: this.pressedKeys.has(keys.rk),
      ultimate: this.pressedKeys.has(keys.ultimate),
    };
  }

  public formatKeyName(code: string): string {
    if (!code) return '';
    if (code.startsWith('Key')) return code.substring(3).toUpperCase();
    if (code.startsWith('Digit')) return code.substring(5);
    if (code.startsWith('Numpad')) return 'Num ' + code.substring(6);
    if (code.startsWith('Arrow')) return code.substring(5);
    return code;
  }

  private loadFromStorage() {
    if (typeof window === 'undefined') return;
    try {
      const savedP1 = localStorage.getItem('neon_knuckles_p1_keys');
      const savedP2 = localStorage.getItem('neon_knuckles_p2_keys');
      if (savedP1) this.p1Keys = { ...DEFAULT_P1_KEYS, ...JSON.parse(savedP1) };
      if (savedP2) this.p2Keys = { ...DEFAULT_P2_KEYS, ...JSON.parse(savedP2) };
    } catch {
      // Ignore storage errors in restricted contexts
    }
  }

  private saveToStorage() {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem('neon_knuckles_p1_keys', JSON.stringify(this.p1Keys));
      localStorage.setItem('neon_knuckles_p2_keys', JSON.stringify(this.p2Keys));
    } catch {
      // Ignore
    }
  }
}
