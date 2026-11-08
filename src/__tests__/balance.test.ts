import { describe, it, expect } from 'vitest';
import { ALL_FIGHTERS } from '../game/fighters';
import { createInitialGameState, FightingEngine } from '../game/engine';
import { AIBrain } from '../game/ai/brain';

describe('Balance Sanity & Match Termination Test', () => {
  it('runs automated AI vs AI matches across all fighter pairings, all matches terminate, and no fighter wins > 70% overall', () => {
    const fighterWins: Record<string, number> = {};
    const fighterTotalMatches: Record<string, number> = {};

    ALL_FIGHTERS.forEach((f) => {
      fighterWins[f.id] = 0;
      fighterTotalMatches[f.id] = 0;
    });

    const engine = new FightingEngine();

    // Test multiple tournament rounds across all 8 fighters (both P1 and P2 roles)
    // for statistical significance and consistent balance verification
    const tournamentRounds = 3;

    for (let round = 0; round < tournamentRounds; round++) {
      for (let i = 0; i < ALL_FIGHTERS.length; i++) {
        for (let j = 0; j < ALL_FIGHTERS.length; j++) {
          if (i === j) continue;
          const fighter1 = ALL_FIGHTERS[i];
          const fighter2 = ALL_FIGHTERS[j];

          const state = createInitialGameState(fighter1, fighter2, 'normal', 'arcade');
          const ai1 = new AIBrain();
          const ai2 = new AIBrain();

          let framesSimulated = 0;
          const maxFrames = 12000; // ample time for 3 rounds of fighting

          while (!state.matchOver && framesSimulated < maxFrames) {
            framesSimulated++;

            const p1Input = ai1.update(state.p1, state.p2, state, 'normal');
            const p2Input = ai2.update(state.p2, state.p1, state, 'normal');

            engine.update(state, p1Input, p2Input, true);

            if (state.roundOver && !state.matchOver) {
              engine.startNextRound(state);
              ai1.reset();
              ai2.reset();
            }
          }

          // 1. Verify every match terminated cleanly
          expect(state.matchOver, `Match between ${fighter1.name} and ${fighter2.name} did not terminate within time`).toBe(true);
          expect(state.winner).not.toBeNull();

          fighterTotalMatches[fighter1.id]++;
          fighterTotalMatches[fighter2.id]++;

          if (state.winner === 'p1') {
            fighterWins[fighter1.id]++;
          } else if (state.winner === 'p2') {
            fighterWins[fighter2.id]++;
          }
        }
      }
    }

    // 2. Verify no fighter has an unfair win rate over 70% overall
    ALL_FIGHTERS.forEach((fighter) => {
      const wins = fighterWins[fighter.id];
      const total = fighterTotalMatches[fighter.id];
      const winRate = total > 0 ? (wins / total) * 100 : 0;

      expect(
        winRate,
        `${fighter.name} win rate (${winRate.toFixed(1)}%) exceeds 70% balance cap!`
      ).toBeLessThanOrEqual(70);
    });
  }, 30000); // 30s timeout for full tournament simulation
});
