const HISTORY_KEY = 'gamespump_history';

export interface GameResult {
  gameType: string;
  roomCode: string;
  score: number;
  date: string; // ISO string
}

export function saveGameResult(result: GameResult): void {
  if (typeof window === 'undefined') return;
  try {
    const existing = getGameHistory();
    // Deduplicate by roomCode+gameType (in case effect fires multiple times)
    const deduped = existing.filter(
      (r) => !(r.roomCode === result.roomCode && r.gameType === result.gameType)
    );
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
