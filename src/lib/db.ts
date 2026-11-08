import { DifficultyLevel } from '../game/difficulty';

export interface LeaderboardEntry {
  id: string;
  name: string;
  score: number;
  difficulty: DifficultyLevel;
  character: string;
  date: string;
}

// In-memory persistent cache for serverless environment
const globalMemoryScores: LeaderboardEntry[] = [
  // Seed initial hall of fame records
  { id: '1', name: 'CYBER_VIPER', score: 185400, difficulty: 'nightmare', character: 'zero', date: '2026-11-01' },
  { id: '2', name: 'NEO_BLADE', score: 142100, difficulty: 'nightmare', character: 'ronin', date: '2026-11-02' },
  { id: '3', name: 'GOLIATH', score: 128900, difficulty: 'hard', character: 'brutus', date: '2026-11-03' },
  { id: '4', name: 'SHADOW_K', score: 115600, difficulty: 'hard', character: 'sable', date: '2026-11-04' },
  { id: '5', name: 'TITAN_X', score: 104200, difficulty: 'hard', character: 'titan', date: '2026-11-05' },
  { id: '6', name: 'VOLT_RUNNER', score: 88500, difficulty: 'normal', character: 'volt', date: '2026-11-06' },
  { id: '7', name: 'LUNAR_MIRA', score: 82400, difficulty: 'normal', character: 'mira', date: '2026-11-07' },
  { id: '8', name: 'GALE_FORCE', score: 76000, difficulty: 'normal', character: 'kaze', date: '2026-11-08' },
  { id: '9', name: 'ROOKIE_ONE', score: 45200, difficulty: 'easy', character: 'kaze', date: '2026-11-08' },
  { id: '10', name: 'BRAWLER_99', score: 38900, difficulty: 'easy', character: 'brutus', date: '2026-11-08' },
];

export async function getTopScores(difficulty: DifficultyLevel, limit = 10): Promise<LeaderboardEntry[]> {
  const filtered = globalMemoryScores.filter((s) => s.difficulty === difficulty);
  filtered.sort((a, b) => b.score - a.score);
  return filtered.slice(0, limit);
}

export async function saveLeaderboardScore(entry: Omit<LeaderboardEntry, 'id' | 'date'>): Promise<LeaderboardEntry> {
  const newEntry: LeaderboardEntry = {
    ...entry,
    id: `${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    date: new Date().toISOString().split('T')[0],
  };

  globalMemoryScores.push(newEntry);
  return newEntry;
}
