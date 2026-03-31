'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getSession } from '@/lib/session';
import { getGameHistory, getPlayerStats, GameResult, PlayerStats } from '@/lib/gameHistory';
import { getAllAchievements, getUnlockedAchievements, Achievement, UnlockedAchievement } from '@/lib/achievements';
import { Avatar } from '@/components/avatars/AvatarSVG';
import { AnimatedNumber } from '@/components/AnimatedNumber';
import { PlayerSession } from '@/lib/types';

const GAME_NAMES: Record<string, string> = {
  'trivia-clash': 'Trivia Clash',
  'word-blitz': 'Word Blitz',
  'quick-draw': 'Quick Draw',
  'memory-match': 'Memory Match',
  'this-or-that': 'This or That',
  'speed-math': 'Speed Math',
};

function BackgroundDecor() {
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden">
      <div className="absolute -top-32 -left-32 w-96 h-96 bg-purple-600/20 rounded-full blur-3xl animate-float-slow" />
      <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-fuchsia-600/15 rounded-full blur-3xl animate-float-medium" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-indigo-600/10 rounded-full blur-3xl animate-float-slow" style={{ animationDelay: '4s' }} />
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="glass rounded-2xl p-4 flex flex-col items-center text-center">
      <p className="text-2xl font-display font-bold text-white">
        {typeof value === 'number' ? <AnimatedNumber value={value} duration={800} /> : value}
      </p>
      <p className="text-xs text-white/40 font-body mt-1 uppercase tracking-wider">{label}</p>
    </div>
  );
}

export default function StatsPage() {
  const router = useRouter();
  const [session, setSession] = useState<PlayerSession | null>(null);
  const [history, setHistory] = useState<GameResult[]>([]);
  const [stats, setStats] = useState<PlayerStats | null>(null);
  const [allAchievements, setAllAchievements] = useState<Achievement[]>([]);
  const [unlockedAchievements, setUnlockedAchievements] = useState<UnlockedAchievement[]>([]);

  useEffect(() => {
    setSession(getSession());
    setHistory(getGameHistory());
    setStats(getPlayerStats());
    setAllAchievements(getAllAchievements());
    setUnlockedAchievements(getUnlockedAchievements());
  }, []);

  const favoriteGameName = stats?.favoriteGame ? (GAME_NAMES[stats.favoriteGame] ?? stats.favoriteGame) : '—';

  return (
    <main className="min-h-[100dvh] flex flex-col items-center px-6 py-10 relative">
      <BackgroundDecor />

      <div className="relative z-10 w-full max-w-sm mx-auto">
        {/* Back button */}
        <button
          onClick={() => router.push('/')}
          className="flex items-center gap-1.5 text-white/40 hover:text-white/70 transition-colors text-sm font-body mb-6"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          Back
        </button>

        {/* Player header */}
        <div className="flex flex-col items-center mb-8">
          {session?.avatar ? (
            <Avatar avatarId={session.avatar} size={80} className="mb-3 ring-4 ring-purple-500/30" />
          ) : (
            <div className="w-20 h-20 rounded-full bg-white/10 mb-3" />
          )}
          <h1 className="text-2xl font-display font-bold text-white">
            {session?.name || 'Player'}
          </h1>
          <p className="text-white/40 text-sm font-body mt-0.5">Player Stats</p>
        </div>

        {/* Stats grid */}
        {stats && (
          <div className="grid grid-cols-2 gap-3 mb-8">
            <StatCard label="Total Games" value={stats.totalGames} />
            <StatCard label="Total Score" value={stats.totalScore} />
            <StatCard label="Favorite Game" value={favoriteGameName} />
            <StatCard label="Avg Score" value={stats.averageScore > 0 ? stats.averageScore : '—'} />
          </div>
        )}

        {/* Per-game breakdown */}
        {stats && Object.keys(stats.gamesPerType).length > 0 && (
          <div className="mb-8">
            <p className="text-xs text-white/30 font-body uppercase tracking-wider mb-3">By Game</p>
            <div className="space-y-2">
              {Object.entries(stats.gamesPerType)
                .sort((a, b) => b[1] - a[1])
                .map(([gameType, count]) => (
                  <div key={gameType} className="glass rounded-2xl px-4 py-3 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl overflow-hidden bg-white/5 flex-shrink-0">
                      <img
                        src={`/images/games/${gameType}.webp`}
                        alt={gameType}
                        className="w-full h-full object-cover"
                        loading="lazy"
                        onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-display font-semibold text-white leading-tight">
                        {GAME_NAMES[gameType] ?? gameType}
                      </p>
                      <p className="text-xs text-white/35 font-body">
                        {count} {count === 1 ? 'game' : 'games'}
                      </p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-sm font-bold text-purple-300">
                        {(stats.bestScoreByGame[gameType] ?? 0).toLocaleString()}
                      </p>
                      <p className="text-xs text-white/30 font-body">best</p>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* Recent games */}
        {history.length > 0 && (
          <div className="mb-8">
            <p className="text-xs text-white/30 font-body uppercase tracking-wider mb-3">
              Recent Games ({history.length})
            </p>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {history.map((r, i) => (
                <div key={i} className="glass rounded-xl px-3 py-2 flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg overflow-hidden bg-white/5 flex-shrink-0">
                    <img
                      src={`/images/games/${r.gameType}.webp`}
                      alt={r.gameType}
                      className="w-full h-full object-cover"
                      loading="lazy"
                      onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-white/80 truncate">
                      {GAME_NAMES[r.gameType] ?? r.gameType}
                    </p>
                    <p className="text-xs text-white/30">Room {r.roomCode}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-xs font-bold text-purple-300">{r.score} pts</p>
                    <p className="text-xs text-white/25">{new Date(r.date).toLocaleDateString()}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Empty state */}
        {history.length === 0 && (
          <div className="glass rounded-2xl p-8 text-center mb-8">
            <p className="text-4xl mb-3">🎮</p>
            <p className="text-white/50 font-body text-sm">No games played yet.</p>
            <p className="text-white/30 font-body text-xs mt-1">Play a game to see your stats here!</p>
          </div>
        )}

        {/* Achievements */}
        {allAchievements.length > 0 && (
          <div className="mb-8">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs text-white/30 font-body uppercase tracking-wider">Achievements</p>
              <p className="text-xs text-white/30 font-body">
                {unlockedAchievements.length}/{allAchievements.length}
              </p>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {allAchievements.map((achievement) => {
                const isUnlocked = unlockedAchievements.some((u) => u.id === achievement.id);
                return (
                  <div
                    key={achievement.id}
                    className={`glass rounded-2xl p-3 flex flex-col items-center text-center transition-all ${
                      isUnlocked ? 'ring-1 ring-amber-400/30' : 'opacity-40'
                    }`}
                  >
                    <span className="text-2xl mb-1">
                      {isUnlocked ? achievement.emoji : '🔒'}
                    </span>
                    <p className="text-xs font-display font-semibold text-white leading-tight">
                      {isUnlocked ? achievement.name : achievement.name}
                    </p>
                    <p className="text-xs text-white/40 font-body mt-0.5 leading-tight">
                      {isUnlocked ? achievement.description : '???'}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <footer className="text-center text-white/20 text-xs font-body pt-4 pb-2">
          Made with 🎮 by GamesPump
        </footer>
      </div>
    </main>
  );
}
