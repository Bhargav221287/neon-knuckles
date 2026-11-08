import { DifficultyLevel } from '../game/difficulty';

export interface UserSettings {
  reducedMotion: boolean;
  colorblindMode: boolean;
  sfxVolume: number;
  musicVolume: number;
  isMuted: boolean;
}

export const DEFAULT_SETTINGS: UserSettings = {
  reducedMotion: false,
  colorblindMode: false,
  sfxVolume: 0.8,
  musicVolume: 0.4,
  isMuted: false,
};

export class LocalStorageManager {
  private static UNLOCKED_KEY = 'neon_knuckles_unlocked';
  private static BEST_SCORES_KEY = 'neon_knuckles_best_scores';
  private static SETTINGS_KEY = 'neon_knuckles_settings';

  public static getUnlockedFighters(): string[] {
    if (typeof window === 'undefined') return ['kaze', 'brutus', 'mira', 'ronin', 'volt', 'sable'];
    try {
      const data = localStorage.getItem(this.UNLOCKED_KEY);
      if (data) return JSON.parse(data);
    } catch {}
    return ['kaze', 'brutus', 'mira', 'ronin', 'volt', 'sable'];
  }

  public static unlockFighter(fighterId: string): void {
    if (typeof window === 'undefined') return;
    try {
      const current = this.getUnlockedFighters();
      if (!current.includes(fighterId)) {
        current.push(fighterId);
        localStorage.setItem(this.UNLOCKED_KEY, JSON.stringify(current));
      }
    } catch {}
  }

  public static getBestScore(difficulty: DifficultyLevel): number {
    if (typeof window === 'undefined') return 0;
    try {
      const data = localStorage.getItem(this.BEST_SCORES_KEY);
      if (data) {
        const scores = JSON.parse(data);
        return scores[difficulty] || 0;
      }
    } catch {}
    return 0;
  }

  public static saveScore(difficulty: DifficultyLevel, score: number): boolean {
    if (typeof window === 'undefined') return false;
    try {
      const currentBest = this.getBestScore(difficulty);
      if (score > currentBest) {
        const data = localStorage.getItem(this.BEST_SCORES_KEY);
        const scores = data ? JSON.parse(data) : {};
        scores[difficulty] = score;
        localStorage.setItem(this.BEST_SCORES_KEY, JSON.stringify(scores));
        return true;
      }
    } catch {}
    return false;
  }

  public static getSettings(): UserSettings {
    if (typeof window === 'undefined') return { ...DEFAULT_SETTINGS };
    try {
      const data = localStorage.getItem(this.SETTINGS_KEY);
      if (data) return { ...DEFAULT_SETTINGS, ...JSON.parse(data) };
    } catch {}
    return { ...DEFAULT_SETTINGS };
  }

  public static saveSettings(settings: Partial<UserSettings>): void {
    if (typeof window === 'undefined') return;
    try {
      const current = this.getSettings();
      const updated = { ...current, ...settings };
      localStorage.setItem(this.SETTINGS_KEY, JSON.stringify(updated));
    } catch {}
  }
}
