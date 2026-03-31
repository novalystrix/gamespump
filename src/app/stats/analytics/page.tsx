'use client';

import { useState, useEffect } from 'react';
import { getAnalyticsStats, AnalyticsStats } from '@/lib/analytics';
import { GamepadIcon } from '@/components/icons/GameIcons';

function StatCard({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <div className="glass rounded-2xl p-4 text-center">
      <p className="text-2xl font-display font-bold text-white">{value}</p>
      <p className="text-xs text-white/40 mt-1">{label}</p>
      {sub && <p className="text-xs text-purple-400 mt-0.5">{sub}</p>}
    </div>
  );
}

function BarChart({ data, label }: { data: Record<string, number>; label: string }) {
  const entries = Object.entries(data).sort((a, b) => b[1] - a[1]);
  const max = Math.max(...entries.map(([, v]) => v), 1);
  if (entries.length === 0) return null;

  return (
    <div className="glass rounded-2xl p-4">
      <p className="text-xs text-white/30 font-body uppercase tracking-wider mb-3">{label}</p>
      <div className="space-y-2">
        {entries.map(([key, val]) => (
          <div key={key} className="flex items-center gap-2">
            <span className="text-xs text-white/60 w-24 truncate">{key}</span>
            <div className="flex-1 h-5 bg-white/5 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-purple-500 to-fuchsia-500 rounded-full transition-all"
                style={{ width: `${(val / max) * 100}%` }}
              />
            </div>
            <span className="text-xs text-white/40 w-8 text-right">{val}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function AnalyticsPage() {
  const [stats, setStats] = useState<AnalyticsStats | null>(null);

  useEffect(() => {
    setStats(getAnalyticsStats());
  }, []);

  if (!stats) {
    return (
      <main className="min-h-[100dvh] flex items-center justify-center">
        <div className="w-10 h-10 border-2 border-purple-400 border-t-transparent rounded-full animate-spin" />
      </main>
    );
  }

  return (
    <main className="min-h-[100dvh] px-6 py-10">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center gap-2 mb-6">
          <GamepadIcon className="w-5 h-5 text-purple-400" />
          <h1 className="text-xl font-display font-bold text-white">Analytics</h1>
          <a href="/" className="ml-auto text-xs text-white/30 hover:text-white/50">← Home</a>
        </div>

        {/* Overview */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          <StatCard label="Events" value={stats.totalEvents} />
          <StatCard label="Visitors" value={stats.uniqueVisitors} />
          <StatCard label="Sessions" value={stats.totalSessions} />
          <StatCard label="Return Rate" value={`${stats.returnRate.toFixed(0)}%`} />
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          <StatCard label="Rooms Created" value={stats.roomsCreated} />
          <StatCard label="Rooms Joined" value={stats.roomsJoined} />
          <StatCard label="Shares" value={stats.shares} />
          <StatCard label="Games Played" value={Object.values(stats.gamesCompleted).reduce((a, b) => a + b, 0)} />
        </div>

        {/* Charts */}
        <div className="space-y-4">
          <BarChart data={stats.pageViews} label="Page Views" />
          <BarChart data={stats.gamesStarted} label="Games Started" />
          <BarChart data={stats.gamesCompleted} label="Games Completed" />
          <BarChart
            data={Object.fromEntries(
              Object.entries(stats.eventsByHour).map(([h, v]) => [`${h}:00`, v])
            )}
            label="Activity by Hour"
          />
        </div>

        <p className="text-center text-white/15 text-xs mt-8">
          Client-side only • No PII • {stats.totalEvents} events tracked
        </p>
      </div>
    </main>
  );
}
