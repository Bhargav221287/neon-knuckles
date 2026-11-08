import { describe, it, expect } from 'vitest';
import { aabbIntersect, getHurtboxes } from '../game/physics/collision';
import { Box } from '../game/types';
import { canBlockAttack, getJuggleDamageScale, resolveHits } from '../game/combat/hitResolution';
import { createInitialGameState } from '../game/engine';
import { kazeDefinition } from '../game/fighters/kaze';
import { brutusDefinition } from '../game/fighters/brutus';

describe('Combat System & Hit Detection', () => {
  it('correctly calculates AABB box intersections', () => {
    const boxA: Box = { x: 100, y: 100, width: 50, height: 50 };
    const boxB: Box = { x: 130, y: 120, width: 40, height: 40 };
    const boxC: Box = { x: 200, y: 200, width: 30, height: 30 };

    expect(aabbIntersect(boxA, boxB)).toBe(true);
    expect(aabbIntersect(boxA, boxC)).toBe(false);
  });

  describe('Blocking Logic', () => {
    it('standing block blocks High and Mid attacks, but FAILS against Low attacks', () => {
      const state = createInitialGameState(kazeDefinition, brutusDefinition);
      const defender = state.p2;

      defender.isBlocking = true;
      defender.isCrouching = false;

      expect(canBlockAttack(defender, 'high')).toBe(true);
      expect(canBlockAttack(defender, 'mid')).toBe(true);
      expect(canBlockAttack(defender, 'low')).toBe(false); // Standing block fails against Low!
    });

    it('crouch block blocks Low and Mid attacks', () => {
      const state = createInitialGameState(kazeDefinition, brutusDefinition);
      const defender = state.p2;

      defender.isBlocking = true;
      defender.isCrouching = true;

      expect(canBlockAttack(defender, 'low')).toBe(true);
      expect(canBlockAttack(defender, 'mid')).toBe(true);
    });

    it('crouching reduces hurtbox height allowing high attacks to whiff', () => {
      const state = createInitialGameState(kazeDefinition, brutusDefinition);
      const standingHurtboxes = getHurtboxes(state.p1);

      state.p1.isCrouching = true;
      const crouchingHurtboxes = getHurtboxes(state.p1);

      const maxStandingY = Math.min(...standingHurtboxes.map((b) => b.y));
      const maxCrouchingY = Math.min(...crouchingHurtboxes.map((b) => b.y));

      // In canvas coordinates, smaller Y is higher up. Crouching hurtbox top should be lower down (higher Y number)
      expect(maxCrouchingY).toBeGreaterThan(maxStandingY);
    });
  });

  describe('Damage Scaling in Juggles', () => {
    it('applies correct diminishing scaling to consecutive juggle hits with a 20% floor', () => {
      expect(getJuggleDamageScale(1)).toBe(1.0);
      expect(getJuggleDamageScale(2)).toBe(0.8);
      expect(getJuggleDamageScale(3)).toBe(0.6);
      expect(getJuggleDamageScale(4)).toBe(0.4);
      expect(getJuggleDamageScale(5)).toBe(0.2);
      expect(getJuggleDamageScale(10)).toBe(0.2); // minimum floor
    });
  });

  describe('Ultimate Meter Gain Formula', () => {
    it('grants +1 per 1% damage dealt and +1.5 per 1% damage taken', () => {
      const state = createInitialGameState(kazeDefinition, brutusDefinition);
      const attacker = state.p1;
      const defender = state.p2;

      // Position them close and let P1 hit P2 with a known attack
      attacker.x = 550;
      defender.x = 590;
      defender.isBlocking = false;

      // Kaze Gale Jab: 35 damage.
      attacker.state = 'attack';
      attacker.currentMove = attacker.def.moves[0]; // Gale Jab
      attacker.frameInMove = attacker.currentMove.startup; // frame where hitbox is active

      resolveHits(state, attacker, defender, false);

      const expectedPercent = (35 / defender.maxHealth) * 100;
      expect(attacker.meter).toBeCloseTo(expectedPercent * 1.0, 1);
      expect(defender.meter).toBeCloseTo(expectedPercent * 1.5, 1);
    });
  });
});
