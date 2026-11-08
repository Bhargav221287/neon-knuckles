import { DifficultyLevel, DIFFICULTY_CONFIGS } from './difficulty';
import { MatchScore } from './types';

export interface ScoreInput {
  difficulty: DifficultyLevel;
  totalTimeRemainingSeconds: number;
  finalHealthPercent: number; // 0 to 100
  maxCombo: number;
  perfectRounds: number;
  ultimatesLanded: number;
  matchesWon: number;
}

/**
 * Calculates match score based on performance metrics multiplied by difficulty multiplier.
 */
export function calculateMatchScore(input: ScoreInput): MatchScore {
  const config = DIFFICULTY_CONFIGS[input.difficulty];

  const timeBonus = Math.round(input.totalTimeRemainingSeconds * 150);
  const healthBonus = Math.round(input.finalHealthPercent * 100);
  const comboBonus = Math.round(input.maxCombo * 250);
  const perfectBonus = input.perfectRounds * 5000;
  const ultimateBonus = input.ultimatesLanded * 2000;
  const baseWinScore = input.matchesWon * 10000;

  const rawScore = baseWinScore + timeBonus + healthBonus + comboBonus + perfectBonus + ultimateBonus;
  const totalScore = Math.round(rawScore * config.scoreMultiplier);

  return {
    difficulty: input.difficulty,
    totalScore,
    timeRemainingBonus: Math.round(timeBonus * config.scoreMultiplier),
    healthRemainingBonus: Math.round(healthBonus * config.scoreMultiplier),
    maxCombo: input.maxCombo,
    perfectRounds: input.perfectRounds,
    ultimatesLanded: input.ultimatesLanded,
  };
}
