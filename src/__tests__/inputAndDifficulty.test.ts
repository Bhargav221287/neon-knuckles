import { describe, it, expect } from 'vitest';
import { InputBuffer } from '../game/input/InputBuffer';
import { DIFFICULTY_CONFIGS } from '../game/difficulty';
import { calculateMatchScore } from '../game/scoring';
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

describe('Input Buffer & Command Parsing', () => {
  it('correctly buffers button presses within 6 frames', () => {
    const buffer = new InputBuffer(6);
    const available = ['LP', 'RP', 'LK', 'RK', 'df+RP', 'Q', 'LP+LK'];

    // Frame 1: LP pressed
    const input1 = createBlankInputs();
    input1.lp = true;
    buffer.push(input1, 1);

    // Frame 2 to 5: Neutral
    for (let f = 2; f <= 5; f++) {
      buffer.push(createBlankInputs(), f);
    }

    // At frame 5, LP should still be queryable within 6-frame window
    expect(buffer.queryCommand(1, available)).toBe('LP');

    // Frame 6 to 10: Still neutral
    for (let f = 6; f <= 10; f++) {
      buffer.push(createBlankInputs(), f);
    }

    // At frame 10 (9 frames after press), buffer has expired
    expect(buffer.queryCommand(1, available)).toBeNull();
  });

  it('recognizes diagonal motion commands like df+RP', () => {
    const buffer = new InputBuffer(6);
    const available = ['LP', 'RP', 'df+RP'];

    // Facing right (1): down + right + rp
    const input = createBlankInputs();
    input.down = true;
    input.right = true;
    input.rp = true;

    buffer.push(input, 1);
    expect(buffer.queryCommand(1, available)).toBe('df+RP');
  });

  it('recognizes simultaneous throw command LP+LK', () => {
    const buffer = new InputBuffer(6);
    const available = ['LP', 'LK', 'LP+LK'];

    const input = createBlankInputs();
    input.lp = true;
    input.lk = true;

    buffer.push(input, 1);
    expect(buffer.queryCommand(1, available)).toBe('LP+LK');
  });

  it('recognizes single Ultimate button Q with top priority', () => {
    const buffer = new InputBuffer(6);
    const available = ['LP', 'RP', 'Q'];

    const input = createBlankInputs();
    input.ultimate = true;
    input.lp = true; // even if other button pressed, Q takes priority

    buffer.push(input, 1);
    expect(buffer.queryCommand(1, available)).toBe('Q');
  });

  it('detects double-tap sidestep motion', () => {
    const buffer = new InputBuffer(6);

    // Tap Up
    const upInput = createBlankInputs();
    upInput.up = true;
    buffer.push(upInput, 1);

    // Release Up
    buffer.push(createBlankInputs(), 2);
    buffer.push(createBlankInputs(), 3);

    // Tap Up again
    buffer.push(upInput, 4);

    expect(buffer.querySidestep()).toBe('up');
  });
});

describe('Difficulty Configurations', () => {
  it('has exact configured values for all 4 difficulties', () => {
    const easy = DIFFICULTY_CONFIGS.easy;
    expect(easy.reactionDelayFrames).toBe(30); // 500ms
    expect(easy.aiDamageMultiplier).toBe(0.7);
    expect(easy.roundTimerSeconds).toBe(90);
    expect(easy.inputBufferFrames).toBe(8);

    const normal = DIFFICULTY_CONFIGS.normal;
    expect(normal.reactionDelayFrames).toBe(18); // 300ms
    expect(normal.aiDamageMultiplier).toBe(1.0);
    expect(normal.roundTimerSeconds).toBe(60);
    expect(normal.inputBufferFrames).toBe(6);

    const hard = DIFFICULTY_CONFIGS.hard;
    expect(hard.reactionDelayFrames).toBe(9); // 150ms
    expect(hard.aiDamageMultiplier).toBe(1.2);
    expect(hard.roundTimerSeconds).toBe(60);
    expect(hard.inputBufferFrames).toBe(6);

    const nightmare = DIFFICULTY_CONFIGS.nightmare;
    expect(nightmare.reactionDelayFrames).toBe(4); // ~60ms
    expect(nightmare.aiDamageMultiplier).toBe(1.4);
    expect(nightmare.roundTimerSeconds).toBe(60);
    expect(nightmare.inputBufferFrames).toBe(6);
    expect(nightmare.regenHealthBetweenRounds).toBe(false);
  });
});

describe('Score Calculation Formula', () => {
  it('multiplies score correctly according to difficulty multiplier', () => {
    const scoreNormal = calculateMatchScore({
      difficulty: 'normal',
      totalTimeRemainingSeconds: 30,
      finalHealthPercent: 80,
      maxCombo: 4,
      perfectRounds: 1,
      ultimatesLanded: 1,
      matchesWon: 1,
    });

    const scoreNightmare = calculateMatchScore({
      difficulty: 'nightmare',
      totalTimeRemainingSeconds: 30,
      finalHealthPercent: 80,
      maxCombo: 4,
      perfectRounds: 1,
      ultimatesLanded: 1,
      matchesWon: 1,
    });

    // Nightmare multiplier is 4.0, Normal is 1.5
    expect(scoreNightmare.totalScore).toBeGreaterThan(scoreNormal.totalScore);
    expect(scoreNormal.totalScore).toBeGreaterThan(0);
  });
});
