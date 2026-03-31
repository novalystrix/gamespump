'use client';

import { useState, useEffect } from 'react';
import { Achievement } from '@/lib/achievements';

function SingleToast({ achievement, onDone }: { achievement: Achievement; onDone: () => void }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Slide in
    const show = setTimeout(() => setVisible(true), 50);
    // Slide out
    const hide = setTimeout(() => setVisible(false), 3000);
    // Remove from DOM after transition
    const remove = setTimeout(onDone, 3400);
    return () => { clearTimeout(show); clearTimeout(hide); clearTimeout(remove); };
  }, [onDone]);

  return (
    <div
      className={`flex items-center gap-3 px-4 py-3 rounded-2xl glass border border-amber-400/40 shadow-lg shadow-black/30 transition-all duration-400 ${
        visible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4'
      }`}
      style={{ minWidth: '260px', maxWidth: '320px' }}
    >
      <span className="text-2xl flex-shrink-0">{achievement.emoji}</span>
      <div className="text-left">
        <p className="text-xs text-amber-400 font-body uppercase tracking-wider leading-tight">Achievement Unlocked!</p>
        <p className="text-sm font-display font-bold text-white leading-tight">{achievement.name}</p>
        <p className="text-xs text-white/50 font-body leading-tight">{achievement.description}</p>
      </div>
    </div>
  );
}

export function AchievementToast({ achievements }: { achievements: Achievement[] }) {
  const [queue, setQueue] = useState<Achievement[]>([]);

  useEffect(() => {
    if (achievements.length > 0) {
      setQueue(achievements);
    }
  }, [achievements]);

  function remove(id: string) {
    setQueue((q) => q.filter((a) => a.id !== id));
  }

  if (queue.length === 0) return null;

  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 flex flex-col gap-2 items-center pointer-events-none">
      {queue.map((a, i) => (
        <div key={a.id} style={{ transitionDelay: `${i * 100}ms` }}>
          <SingleToast achievement={a} onDone={() => remove(a.id)} />
        </div>
      ))}
    </div>
  );
}
