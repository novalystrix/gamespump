'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getAnalyticsSnapshot, AnalyticsSnapshot } from '@/lib/analytics';
import { trackPageView } from '@/lib/analytics';

export default function AnalyticsPage() {
  const router = useRouter();
  const [data, setData] = useState<AnalyticsSnapshot | null>(null);

  useEffect(() => {
    trackPageView('analytics');
    setData(getAnalyticsSnapshot());
    const interval = setInterval(() => setData(getAnalyticsSnapshot()), 5000);
    return () => clearInterval(interval);
  }, []);

  if (!data) {
    return (
      <main className="min-h-[100dvh] flex items-center justify-center">
        <div className="w-10 h-10 border-2 border-purple-400 border-t-transparent rounded-full animate-spin" />
      </main>
    );
  }

  return (
    <main className="min-h-[100dvh] px-6 py-8 max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-display font-bold text-white">📊 Analytics</h1>
          <p className="text-white/40 text-sm mt-1">Client-side tracking data</p>
        </div>
        <button
          onClick={() => router.push('/')}
          className="px-4 py-2 rounded-xl glass text-white/60 text-sm hover:text-white transition-colors"
        >
          ← Home
        </button>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-2 gap-3 mb-8">
        <StatCard label="Total Events" value={data.totalEvents} />
        <StatCard label="Unique Visitors" value={data.uniqueVisitors} />
        <StatCard label="Sessions" value={data.totalSessions} />
        <StatCard label="Return Rate" value={`${data.returnVisitRate}%`} />
      </div>

      {/* Page Views */}
      {Object.keys(data.pageViews).length > 0 && (
        <Section title="Page Views">
          {Object.entries(data.pageViews)
            .sort((a, b) => b[1] - a[1])
            .map(([page, count]) => (
              <Row key={page} label={page} value={count} />
            ))}
        </Section>
      )}

      {/* Game Starts */}
      {Object.keys(data.gameStarts).length > 0 && (
        <Section title="Game Starts">
          {Object.entries(data.gameStarts)
            .sort((a, b) => b[1] - a[1])
            .map(([game, count]) => (
              <Row
                key={game}
                label={game}
                value={count}
                sub={data.avgPlayersPerGame[game] ? `avg ${data.avgPlayersPerGame[game]} players` : undefined}
              />
            ))}
        </Section>
      )}

      {/* Game Completions */}
      {Object.keys(data.gameCompletions).length > 0 && (
        <Section title="Game Completions">
          {Object.entries(data.gameCompletions)
            .sort((a, b) => b[1] - a[1])
            .map(([game, count]) => {
              const started = data.gameStarts[game] || 0;
              const rate = started > 0 ? Math.round((count / started) * 100) : 0;
              return (
                <Row key={game} label={game} value={count} sub={`${rate}% completion rate`} />
              );
            })}
        </Section>
      )}

      {/* Drop-offs */}
      {data.topDropOffPoints.length > 0 && (
        <Section title="Drop-offs">
          {data.topDropOffPoints.map((d, i) => (
            <Row key={i} label={d.event} value={d.count} />
          ))}
        </Section>
      )}

      {/* Events by Day */}
      {Object.keys(data.eventsByDay).length > 0 && (
        <Section title="Events by Day">
          {Object.entries(data.eventsByDay)
            .sort((a, b) => b[0].localeCompare(a[0]))
            .slice(0, 7)
            .map(([day, count]) => (
              <Row key={day} label={day} value={count} />
            ))}
        </Section>
      )}

      {/* Recent Events */}
      {data.recentEvents.length > 0 && (
        <Section title="Recent Events">
          {data.recentEvents.map((ev, i) => (
            <div key={i} className="flex items-center justify-between py-2 border-b border-white/5 last:border-0">
              <div className="flex-1 min-w-0">
                <p className="text-sm text-white font-medium truncate">{ev.event}</p>
                <p className="text-xs text-white/30 truncate">
                  {ev.props ? Object.entries(ev.props).map(([k, v]) => `${k}=${v}`).join(', ') : ''}
                </p>
              </div>
              <span className="text-xs text-white/20 ml-2 flex-shrink-0">
                {new Date(ev.ts).toLocaleTimeString()}
              </span>
            </div>
          ))}
        </Section>
      )}

      <p className="text-center text-white/20 text-xs mt-8 mb-4">
        Data is stored locally in your browser. Refresh to update.
      </p>
    </main>
  );
}

function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="glass rounded-2xl p-4 text-center">
      <p className="text-2xl font-display font-bold text-white">{value}</p>
      <p className="text-xs text-white/40 mt-1">{label}</p>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-6">
      <h2 className="text-sm font-semibold text-white/60 uppercase tracking-wider mb-3">{title}</h2>
      <div className="glass rounded-2xl p-4">{children}</div>
    </div>
  );
}

function Row({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-white/5 last:border-0">
      <div className="flex-1 min-w-0">
        <p className="text-sm text-white truncate">{label}</p>
        {sub && <p className="text-xs text-white/30">{sub}</p>}
      </div>
      <span className="text-sm font-bold text-white ml-2">{value}</span>
    </div>
  );
}
