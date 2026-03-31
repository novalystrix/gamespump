'use client';

export interface GameStat {
  emoji: string;
  label: string;
  value: string;
}

export function GameSummary({ stats }: { stats: GameStat[] }) {
  const filtered = stats.filter(s => s.value);
  if (filtered.length === 0) return null;

  return (
    <div className="flex gap-3 overflow-x-auto pb-2 mb-4 scrollbar-hide">
      {filtered.map((stat, i) => (
        <div
          key={i}
          className="glass rounded-xl px-4 py-3 min-w-[120px] text-center flex-shrink-0 animate-slide-up"
          style={{ animationDelay: `${i * 0.2}s`, animationFillMode: 'both' }}
        >
          <div className="text-2xl mb-1">{stat.emoji}</div>
          <div className="text-sm font-bold text-white">{stat.value}</div>
          <div className="text-xs text-white/40 mt-0.5">{stat.label}</div>
        </div>
      ))}
    </div>
  );
}
