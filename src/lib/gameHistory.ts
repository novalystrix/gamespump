const HISTORY_KEY = 'gamespump_history';
const TOTAL_GAMES_KEY = 'gamespump_total_games';

export interface GameResult {
  gameType: string;
  roomCode: string;
  score: number;
  date: string; // ISO string
}

export function incrementGamesPlayed(): void {
  if (typeof window === 'undefined') return;
  try {
    const current = getGamesPlayed();
    localStorage.setItem(TOTAL_GAMES_KEY, String(current + 1));
  } catch {}
}

export function getGamesPlayed(): number {
  if (typeof window === 'undefined') return 0;
  try {
    const val = localStorage.getItem(TOTAL_GAMES_KEY);
    return val ? parseInt(val, 10) : 0;
  } catch {
    return 0;
  }
}

export function saveGameResult(result: GameResult): void {
  if (typeof window === 'undefined') return;
  try {
    const existing = getGameHistory();
    // Deduplicate by roomCode+gameType (in case effect fires multiple times)
    const deduped = existing.filter(
      (r) => !(r.roomCode === result.roomCode && r.gameType === result.gameType)
    );
    const isNew = existing.every(
      (r) => !(r.roomCode === result.roomCode && r.gameType === result.gameType)
    );
    if (isNew) incrementGamesPlayed();
    const updated = [result, ...deduped].slice(0, 5);
    localStorage.setItem(HISTORY_KEY, JSON.stringify(updated));
  } catch {}
}

export function getGameHistory(): GameResult[] {
  if (typeof window === 'undefined') return [];
  try {
    const data = localStorage.getItem(HISTORY_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}
