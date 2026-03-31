'use client';

import { useState, useEffect } from 'react';
import { Achievement, getAllAchievements, checkAndUnlockAchievements } from '@/lib/achievements';
import { getPlayerStats, getGameHistory } from '@/lib/gameHistory';

export function useAchievementCheck(): Achievement[] {
  const [newAchievements, setNewAchievements] = useState<Achievement[]>([]);

  useEffect(() => {
    const stats = getPlayerStats();
    const history = getGameHistory();
    const lastGame = history[0];
    const newIds = checkAndUnlockAchievements(stats, lastGame);
    if (newIds.length > 0) {
      const all = getAllAchievements();
      setNewAchievements(all.filter((a) => newIds.includes(a.id)));
    }
  }, []);

  return newAchievements;
}
