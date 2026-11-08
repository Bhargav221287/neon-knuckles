export type DifficultyLevel = 'easy' | 'normal' | 'hard' | 'nightmare';

export interface DifficultyConfig {
  name: DifficultyLevel;
  displayName: string;
  reactionDelayFrames: number; // in 60fps frames (500ms = 30f, 300ms = 18f, 150ms = 9f, 60ms = ~4f)
  blockProbability: number;
  punishProbability: number;
  comboProbability: number;
  mixupRandomness: number;
  aggression: number;
  aiDamageMultiplier: number;
  roundTimerSeconds: number;
  inputBufferFrames: number;
  regenHealthBetweenRounds: boolean;
  scoreMultiplier: number;
  ultimateUsageMode: 'careless' | 'random' | 'punish' | 'guaranteed';
}

export const DIFFICULTY_CONFIGS: Record<DifficultyLevel, DifficultyConfig> = {
  easy: {
    name: 'easy',
    displayName: 'Easy',
    reactionDelayFrames: 30, // 500ms
    blockProbability: 0.15,
    punishProbability: 0.1,
    comboProbability: 0.2,
    mixupRandomness: 0.9,
    aggression: 0.4,
    aiDamageMultiplier: 0.7,
    roundTimerSeconds: 90,
    inputBufferFrames: 8,
    regenHealthBetweenRounds: true,
    scoreMultiplier: 1.0,
    ultimateUsageMode: 'careless',
  },
  normal: {
    name: 'normal',
    displayName: 'Normal',
    reactionDelayFrames: 18, // 300ms
    blockProbability: 0.55,
    punishProbability: 0.45,
    comboProbability: 0.6,
    mixupRandomness: 0.6,
    aggression: 0.65,
    aiDamageMultiplier: 1.0,
    roundTimerSeconds: 60,
    inputBufferFrames: 6,
    regenHealthBetweenRounds: true,
    scoreMultiplier: 1.5,
    ultimateUsageMode: 'random',
  },
  hard: {
    name: 'hard',
    displayName: 'Hard',
    reactionDelayFrames: 9, // 150ms
    blockProbability: 0.82,
    punishProbability: 0.85,
    comboProbability: 0.9,
    mixupRandomness: 0.35,
    aggression: 0.85,
    aiDamageMultiplier: 1.2,
    roundTimerSeconds: 60,
    inputBufferFrames: 6,
    regenHealthBetweenRounds: true,
    scoreMultiplier: 2.5,
    ultimateUsageMode: 'punish',
  },
  nightmare: {
    name: 'nightmare',
    displayName: 'Nightmare',
    reactionDelayFrames: 4, // ~60ms
    blockProbability: 0.96,
    punishProbability: 0.98,
    comboProbability: 1.0,
    mixupRandomness: 0.15,
    aggression: 0.95,
    aiDamageMultiplier: 1.4,
    roundTimerSeconds: 60,
    inputBufferFrames: 6,
    regenHealthBetweenRounds: false, // no health regen between rounds on Nightmare
    scoreMultiplier: 4.0,
    ultimateUsageMode: 'guaranteed',
  },
};
