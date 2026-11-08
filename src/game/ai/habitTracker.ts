import { FighterRuntime, HitLevel } from '../types';

export interface PlayerHabits {
  lowAttackFrequency: number;
  highAttackFrequency: number;
  midAttackFrequency: number;
  jumpFrequency: number;
  sidestepFrequency: number;
  throwFrequency: number;
  recklessWhiffCount: number;
}

export class HabitTracker {
  private history: { hitLevel?: HitLevel; isJump?: boolean; isThrow?: boolean }[] = [];
  private maxHistory = 40;

  public recordPlayerAction(f: FighterRuntime): void {
    if (f.currentMove) {
      this.history.push({
        hitLevel: f.currentMove.hitLevel,
        isThrow: f.currentMove.isThrow,
      });
    } else if (f.state === 'jump') {
      this.history.push({ isJump: true });
    }

    if (this.history.length > this.maxHistory) {
      this.history.shift();
    }
  }

  public getHabits(): PlayerHabits {
    if (this.history.length === 0) {
      return {
        lowAttackFrequency: 0.33,
        highAttackFrequency: 0.33,
        midAttackFrequency: 0.34,
        jumpFrequency: 0.1,
        sidestepFrequency: 0.1,
        throwFrequency: 0.1,
        recklessWhiffCount: 0,
      };
    }

    let lowCount = 0;
    let highCount = 0;
    let midCount = 0;
    let jumpCount = 0;
    let throwCount = 0;

    for (const item of this.history) {
      if (item.hitLevel === 'low') lowCount++;
      if (item.hitLevel === 'high') highCount++;
      if (item.hitLevel === 'mid') midCount++;
      if (item.isJump) jumpCount++;
      if (item.isThrow) throwCount++;
    }

    const total = this.history.length;
    return {
      lowAttackFrequency: lowCount / total,
      highAttackFrequency: highCount / total,
      midAttackFrequency: midCount / total,
      jumpFrequency: jumpCount / total,
      sidestepFrequency: 0.1,
      throwFrequency: throwCount / total,
      recklessWhiffCount: 0,
    };
  }

  public clear(): void {
    this.history = [];
  }
}
