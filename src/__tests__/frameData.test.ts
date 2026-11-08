import { describe, it, expect } from 'vitest';
import { ALL_FIGHTERS } from '../game/fighters';

describe('Frame Data Validation for all 8 Fighters', () => {
  it('contains exactly 8 unique fighters', () => {
    expect(ALL_FIGHTERS).toHaveLength(8);
    const ids = ALL_FIGHTERS.map((f) => f.id);
    const uniqueIds = new Set(ids);
    expect(uniqueIds.size).toBe(8);
  });

  ALL_FIGHTERS.forEach((fighter) => {
    describe(`Fighter: ${fighter.name} (${fighter.id})`, () => {
      it('has valid base stats', () => {
        expect(fighter.stats.health).toBeGreaterThanOrEqual(800);
        expect(fighter.stats.health).toBeLessThanOrEqual(1300);
        expect(fighter.stats.walkSpeed).toBeGreaterThan(0);
        expect(fighter.stats.backWalkSpeed).toBeGreaterThan(0);
        expect(fighter.stats.jumpSpeed).toBeGreaterThan(0);
        expect(fighter.stats.weight).toBeGreaterThan(50);
      });

      it('has at least 10 moves', () => {
        expect(fighter.moves.length).toBeGreaterThanOrEqual(10);
      });

      it('has at least 2 launchers', () => {
        const launchers = fighter.moves.filter((m) => m.isLauncher);
        expect(launchers.length).toBeGreaterThanOrEqual(2);
      });

      it('has at least 3 string combos', () => {
        expect(fighter.stringCombos.length).toBeGreaterThanOrEqual(3);
      });

      it('has a valid throw move', () => {
        expect(fighter.throwMove).toBeDefined();
        expect(fighter.throwMove.isThrow).toBe(true);
        expect(fighter.throwMove.command).toBe('LP+LK');
        expect(fighter.throwMove.startup).toBeGreaterThan(0);
        expect(fighter.throwMove.active).toBeGreaterThan(0);
        expect(fighter.throwMove.recovery).toBeGreaterThan(0);
      });

      it('has a valid ultimate move with Q command and 25-frame startup', () => {
        expect(fighter.ultimateMove).toBeDefined();
        expect(fighter.ultimateMove.isUltimate).toBe(true);
        expect(fighter.ultimateMove.command).toBe('Q');
        expect(fighter.ultimateMove.startup).toBe(25);
        expect(fighter.ultimateMove.recovery).toBe(50);
      });

      it('every move has positive frame data and valid hit levels', () => {
        fighter.moves.forEach((move) => {
          expect(move.startup, `${move.id} startup`).toBeGreaterThan(0);
          expect(move.active, `${move.id} active`).toBeGreaterThan(0);
          expect(move.recovery, `${move.id} recovery`).toBeGreaterThan(0);
          expect(['high', 'mid', 'low']).toContain(move.hitLevel);
          expect(move.damage).toBeGreaterThan(0);
        });
      });
    });
  });
});
