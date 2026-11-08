import { describe, it, expect } from 'vitest';
import { createInitialGameState, FightingEngine } from '../game/engine';
import { kazeDefinition } from '../game/fighters/kaze';
import { brutusDefinition } from '../game/fighters/brutus';
import { RawInputs } from '../game/types';

function createBlankInputs(): RawInputs {
  return {
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

describe('Deterministic Engine Verification', () => {
  it('running the exact same input sequence twice produces strictly identical game state', () => {
    // Generate a complex 120-frame scripted match
    const p1Sequence: RawInputs[] = [];
    const p2Sequence: RawInputs[] = [];

    for (let f = 0; f < 120; f++) {
      const p1In = createBlankInputs();
      const p2In = createBlankInputs();

      // P1 walks forward and attacks
      if (f >= 5 && f < 25) p1In.right = true;
      if (f === 26) p1In.lp = true; // Jab
      if (f === 28) p1In.rp = true; // Cross combo
      if (f >= 35 && f < 45) {
        p1In.down = true;
        p1In.right = true;
      }
      if (f === 45) p1In.rk = true; // df+RK launcher
      if (f >= 60 && f < 75) p1In.up = true; // Jump

      // P2 walks back, blocks, then counters
      if (f >= 5 && f < 20) p2In.left = true;
      if (f >= 24 && f < 32) p2In.right = true; // Holding back to block
      if (f >= 40 && f < 50) {
        p2In.down = true;
        p2In.right = true; // Crouch block
      }
      if (f === 55) p2In.rp = true;
      if (f === 80) {
        p2In.lp = true;
        p2In.lk = true; // Throw attempt
      }

      p1Sequence.push(p1In);
      p2Sequence.push(p2In);
    }

    // Run 1
    const engine1 = new FightingEngine();
    const state1 = createInitialGameState(kazeDefinition, brutusDefinition);
    for (let i = 0; i < 120; i++) {
      engine1.update(state1, p1Sequence[i], p2Sequence[i]);
    }

    // Run 2
    const engine2 = new FightingEngine();
    const state2 = createInitialGameState(kazeDefinition, brutusDefinition);
    for (let i = 0; i < 120; i++) {
      engine2.update(state2, p1Sequence[i], p2Sequence[i]);
    }

    // Assert that both state snapshots are 100% strictly identical
    expect(state1.frame).toBe(state2.frame);
    expect(state1.timerFrames).toBe(state2.timerFrames);

    // P1 verification
    expect(state1.p1.x).toBe(state2.p1.x);
    expect(state1.p1.y).toBe(state2.p1.y);
    expect(state1.p1.vx).toBe(state2.p1.vx);
    expect(state1.p1.vy).toBe(state2.p1.vy);
    expect(state1.p1.health).toBe(state2.p1.health);
    expect(state1.p1.meter).toBe(state2.p1.meter);
    expect(state1.p1.state).toBe(state2.p1.state);
    expect(state1.p1.comboCount).toBe(state2.p1.comboCount);

    // P2 verification
    expect(state1.p2.x).toBe(state2.p2.x);
    expect(state1.p2.y).toBe(state2.p2.y);
    expect(state1.p2.vx).toBe(state2.p2.vx);
    expect(state1.p2.vy).toBe(state2.p2.vy);
    expect(state1.p2.health).toBe(state2.p2.health);
    expect(state1.p2.meter).toBe(state2.p2.meter);
    expect(state1.p2.state).toBe(state2.p2.state);
    expect(state1.p2.comboCount).toBe(state2.p2.comboCount);
  });
});
