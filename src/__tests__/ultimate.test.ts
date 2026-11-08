import { describe, it, expect } from 'vitest';
import { ALL_FIGHTERS } from '../game/fighters';
import { DIFFICULTY_CONFIGS, DifficultyLevel } from '../game/difficulty';
import { calculateUltimateDamage, tryActivateUltimate, updateUltimateCinematic } from '../game/combat/ultimate';
import { createInitialGameState, FightingEngine } from '../game/engine';

const DIFFICULTIES: DifficultyLevel[] = ['easy', 'normal', 'hard', 'nightmare'];

describe('Ultimate (Overdrive Strikes) System', () => {
  describe('Exact 30% Max Health Damage Rule Verification', () => {
    // Test across every fighter, every difficulty, both directions
    DIFFICULTIES.forEach((difficulty) => {
      describe(`Difficulty: ${difficulty}`, () => {
        ALL_FIGHTERS.forEach((targetFighter) => {
          ALL_FIGHTERS.forEach((attackerFighter) => {
            it(`Direction 1 (Player to AI): ${attackerFighter.name} -> ${targetFighter.name} deals exactly 30% of ${targetFighter.name}'s max health`, () => {
              const state = createInitialGameState(attackerFighter, targetFighter, difficulty);
              const target = state.p2;
              const initialHealth = target.maxHealth;
              const expectedDamage = Math.round(initialHealth * 0.30);

              // Setup cinematic impact
              state.cinematic = {
                active: true,
                type: 'ultimate',
                attacker: 'p1',
                target: 'p2',
                frame: 80, // Impact frame
                maxFrames: 90,
                phase: 'impact',
                damageApplied: false,
              };

              updateUltimateCinematic(state, false);

              const damageDealt = initialHealth - target.health;
              expect(damageDealt).toBe(expectedDamage);
              expect(damageDealt / initialHealth).toBeCloseTo(0.30, 2);
            });

            it(`Direction 2 (AI to Player): ${attackerFighter.name} (AI) -> ${targetFighter.name} (P1) deals exactly 30% of ${targetFighter.name}'s max health`, () => {
              const state = createInitialGameState(targetFighter, attackerFighter, difficulty);
              const target = state.p1;
              const initialHealth = target.maxHealth;
              const expectedDamage = Math.round(initialHealth * 0.30);

              // Setup cinematic impact with AI attacking P1
              state.cinematic = {
                active: true,
                type: 'ultimate',
                attacker: 'p2',
                target: 'p1',
                frame: 80,
                maxFrames: 90,
                phase: 'impact',
                damageApplied: false,
              };

              updateUltimateCinematic(state, false);

              const damageDealt = initialHealth - target.health;
              expect(damageDealt).toBe(expectedDamage);
              expect(damageDealt / initialHealth).toBeCloseTo(0.30, 2);
            });
          });
        });
      });
    });
  });

  describe('Single Q Press Ultimate Activation', () => {
    it('activates when meter is exactly 100, consuming all meter and entering ultimate_startup', () => {
      const state = createInitialGameState(ALL_FIGHTERS[0], ALL_FIGHTERS[1]);
      const fighter = state.p1;
      fighter.meter = 100;
      fighter.state = 'idle';

      const result = tryActivateUltimate(fighter, state);

      expect(result.activated).toBe(true);
      expect(result.denied).toBe(false);
      expect(fighter.meter).toBe(0);
      expect(fighter.state).toBe('ultimate_startup');
      expect(fighter.currentMove?.isUltimate).toBe(true);
    });

    it('does nothing and denies activation when meter is less than 100 (e.g. 0, 50, 99)', () => {
      const testMeters = [0, 25, 50, 75, 99];
      testMeters.forEach((meterVal) => {
        const state = createInitialGameState(ALL_FIGHTERS[0], ALL_FIGHTERS[1]);
        const fighter = state.p1;
        fighter.meter = meterVal;
        fighter.state = 'idle';

        const result = tryActivateUltimate(fighter, state);

        expect(result.activated).toBe(false);
        expect(result.denied).toBe(true);
        expect(fighter.meter).toBe(meterVal); // unchanged
        expect(fighter.state).toBe('idle');
      });
    });

    it('denies activation during hitstun, knockdown, or throw states even if meter is 100', () => {
      const invalidStates: ('hitstun' | 'knockdown' | 'thrown')[] = ['hitstun', 'knockdown', 'thrown'];
      invalidStates.forEach((st) => {
        const state = createInitialGameState(ALL_FIGHTERS[0], ALL_FIGHTERS[1]);
        const fighter = state.p1;
        fighter.meter = 100;
        fighter.state = st;

        const result = tryActivateUltimate(fighter, state);

        expect(result.activated).toBe(false);
        expect(fighter.meter).toBe(100); // meter preserved
      });
    });
  });

  describe('Ultimate Counterplay', () => {
    it('has 25 frames of visible startup', () => {
      ALL_FIGHTERS.forEach((f) => {
        expect(f.ultimateMove.startup).toBe(25);
      });
    });

    it('leaves the attacker in 50 frames of whiff recovery on miss', () => {
      ALL_FIGHTERS.forEach((f) => {
        expect(f.ultimateMove.recovery).toBe(50);
      });
    });
  });
});
