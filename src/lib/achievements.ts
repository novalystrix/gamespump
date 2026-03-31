import { PlayerStats, GameResult } from './gameHistory';

const ACHIEVEMENTS_KEY = 'gamespump_achievements';
const MAX_STREAK_KEY = 'gamespump_max_streak';

export interface Achievement {
  id: string;
  name: string;
  description: string;
  emoji: string;
  condition: (stats: PlayerStats, lastGame?: GameResult) => boolean;
}

export interface UnlockedAchievement {
  id: string;
  unlockedAt: string; // ISO date
}

const ALL_ACHIEVEMENTS: Achievement[] = [
  {
    id: 'first-game',
    name: 'First Timer',
    description: 'Play your first game',
    emoji: '🎮',
    condition: (stats) => stats.totalGames >= 1,
  },
  {
    id: 'five-games',
    name: 'Regular',
    description: 'Play 5 games',
    emoji: '⭐',
    condition: (stats) => stats.totalGames >= 5,
  },
  {
    id: 'ten-games',
    name: 'Veteran',
    description: 'Play 10 games',
    emoji: '🏅',
    condition: (stats) => stats.totalGames >= 10,
  },
  {
    id: 'twenty-games',
    name: 'Dedicated',
    description: 'Play 20 games',
    emoji: '💎',
    condition: (stats) => stats.totalGames >= 20,
  },
  {
    id: 'high-scorer',
    name: 'Century',
    description: 'Score 100+ points in one game',
    emoji: '💯',
    condition: (_stats, lastGame) => !!lastGame && lastGame.score >= 100,
  },
  {
    id: 'trivia-master',
    name: 'Trivia Master',
    description: 'Play 3 trivia games',
    emoji: '🧠',
    condition: (stats) => (stats.gamesPerType['trivia-clash'] ?? 0) >= 3,
  },
  {
    id: 'speed-demon',
    name: 'Speed Demon',
    description: 'Play 3 speed-math games',
    emoji: '⚡',
    condition: (stats) => (stats.gamesPerType['speed-math'] ?? 0) >= 3,
  },
  {
    id: 'word-wizard',
    name: 'Word Wizard',
    description: 'Play 3 word-blitz games',
    emoji: '📝',
    condition: (stats) => (stats.gamesPerType['word-blitz'] ?? 0) >= 3,
  },
  {
    id: 'all-rounder',
    name: 'All Rounder',
    description: 'Play all 6 game types',
    emoji: '🌈',
    condition: (stats) => {
      const required = ['trivia-clash', 'word-blitz', 'quick-draw', 'memory-match', 'this-or-that', 'speed-math'];
      return required.every((g) => (stats.gamesPerType[g] ?? 0) >= 1);
    },
  },
  {
    id: 'hot-streak',
    name: 'On Fire',
    description: 'Achieve a 5+ answer streak',
    emoji: '🔥',
    condition: () => getStreakRecord() >= 5,
  },
  {
    id: 'social-star',
    name: 'Social Star',
    description: 'Share your results',
    emoji: '📤',
    condition: () => {
      if (typeof window === 'undefined') return false;
      try { return localStorage.getItem('gamespump_shared') === 'true'; } catch { return false; }
    },
  },
  {
    id: 'memory-ace',
    name: 'Memory Ace',
    description: 'Play 3 memory-match games',
    emoji: '🃏',
    condition: (stats) => (stats.gamesPerType['memory-match'] ?? 0) >= 3,
  },
];

export function getAllAchievements(): Achievement[] {
  return ALL_ACHIEVEMENTS;
}

export function getUnlockedAchievements(): UnlockedAchievement[] {
  if (typeof window === 'undefined') return [];
  try {
    const data = localStorage.getItem(ACHIEVEMENTS_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

export function saveAchievement(id: string): void {
  if (typeof window === 'undefined') return;
  try {
    const existing = getUnlockedAchievements();
    if (existing.some((a) => a.id === id)) return;
    existing.push({ id, unlockedAt: new Date().toISOString() });
    localStorage.setItem(ACHIEVEMENTS_KEY, JSON.stringify(existing));
  } catch {}
}

export function checkAndUnlockAchievements(stats: PlayerStats, lastGame?: GameResult): string[] {
  const unlocked = getUnlockedAchievements();
  const unlockedIds = new Set(unlocked.map((a) => a.id));
  const newlyUnlocked: string[] = [];

  for (const achievement of ALL_ACHIEVEMENTS) {
    if (unlockedIds.has(achievement.id)) continue;
    if (achievement.condition(stats, lastGame)) {
      saveAchievement(achievement.id);
      newlyUnlocked.push(achievement.id);
    }
  }

  return newlyUnlocked;
}

export function getStreakRecord(): number {
  if (typeof window === 'undefined') return 0;
  try {
    const val = localStorage.getItem(MAX_STREAK_KEY);
    return val ? parseInt(val, 10) : 0;
  } catch {
    return 0;
  }
}

export function setStreakRecord(n: number): void {
  if (typeof window === 'undefined') return;
  try {
    const current = getStreakRecord();
    if (n > current) {
      localStorage.setItem(MAX_STREAK_KEY, String(n));
    }
  } catch {}
}
