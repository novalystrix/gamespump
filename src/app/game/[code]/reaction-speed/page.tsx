'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { getSession } from '@/lib/session';
import { saveGameResult } from '@/lib/gameHistory';
import { trackPageView, trackGameStart, trackGameEnd } from '@/lib/analytics';
import { Player } from '@/lib/types';
import { Avatar } from '@/components/avatars/AvatarSVG';
import { CrownIcon } from '@/components/icons/GameIcons';
import { AnimatedNumber } from '@/components/AnimatedNumber';
import { ShareResults } from '@/components/ShareResults';
import { Podium } from '@/components/Podium';
import { GameSummary } from '@/components/GameSummary';
import { AchievementToast } from '@/components/AchievementToast';
import { useAchievementCheck } from '@/hooks/useAchievementCheck';
import { HowToPlay } from '@/components/HowToPlay';

function playSound(name: string) {
  if (typeof window === 'undefined') return;
  try {
    const ctx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    const now = ctx.currentTime;
    if (name === 'go') {
      // Bright ascending beep
      osc.type = 'sine';
      osc.frequency.setValueAtTime(660, now);
      osc.frequency.setValueAtTime(880, now + 0.08);
      osc.frequency.setValueAtTime(1100, now + 0.16);
      gain.gain.setValueAtTime(0.3, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
      osc.start(now); osc.stop(now + 0.35);
    } else if (name === 'false-start') {
      // Harsh buzz
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(150, now);
      osc.frequency.setValueAtTime(100, now + 0.2);
      gain.gain.setValueAtTime(0.25, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
      osc.start(now); osc.stop(now + 0.4);
    } else if (name === 'tap') {
      // Quick chime for good reaction
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, now);
      osc.frequency.setValueAtTime(1320, now + 0.06);
      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
      osc.start(now); osc.stop(now + 0.2);
    } else if (name === 'result') {
      // Soft completion tone
      osc.type = 'sine';
      osc.frequency.setValueAtTime(523, now);
      osc.frequency.setValueAtTime(659, now + 0.15);
      gain.gain.setValueAtTime(0.15, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
      osc.start(now); osc.stop(now + 0.4);
    }
  } catch {
    // AudioContext blocked — silently ignore
  }
}

interface ReactionSpeedState {
  gameType: 'reaction-speed';
  phase: 'waiting' | 'go' | 'results' | 'leaderboard';
  currentRound: number;
  totalRounds: number;
  roundStartedAt: number;
  greenAt: number;
  reactions: Record<string, { reactedAt: number; falseStart: boolean }>;
  scores: Record<string, number>;
  players: Player[];
}

function LeaderboardView({
  gameState,
  myId,
  isHost,
  roomCode,
  router,
  session,
}: {
  gameState: ReactionSpeedState;
  myId: string;
  isHost: boolean;
  roomCode: string;
  router: ReturnType<typeof useRouter>;
  session: { playerId: string } | null;
}) {
  const [restarting, setRestarting] = useState(false);
  const newAchievements = useAchievementCheck();

  async function handlePlayAgain() {
    if (!session || !isHost) return;
    setRestarting(true);
    await fetch(`/api/rooms/${roomCode}/restart`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ playerId: session.playerId }),
    });
    setRestarting(false);
  }

  const sorted = [...gameState.players].sort(
    (a, b) => (gameState.scores[b.id] || 0) - (gameState.scores[a.id] || 0)
  );

  const podiumPlayers = sorted.slice(0, 3).map((p) => ({
    name: p.name,
    avatar: p.avatar,
    color: p.color,
    score: gameState.scores[p.id] || 0,
    isMe: p.id === myId,
  }));

  return (
    <div className="animate-slide-up text-center">
      <h2 className="font-display font-bold text-3xl text-white mb-2">Game Over!</h2>
      <p className="text-white/40 text-sm mb-8">Final Scores</p>

      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {[...Array(12)].map((_, i) => (
          <div
            key={i}
            className="absolute w-2 h-2 rounded-full animate-confetti"
            style={{
              left: `${10 + Math.random() * 80}%`,
              top: '-5%',
              backgroundColor: ['#a855f7', '#ec4899', '#f97316', '#22d3ee', '#34d399', '#facc15'][i % 6],
              animationDelay: `${i * 0.15}s`,
              animationDuration: `${1.5 + Math.random() * 1.5}s`,
            }}
          />
        ))}
      </div>

      <Podium players={podiumPlayers} />

      <GameSummary stats={[
        { emoji: '👥', label: 'Players', value: `${gameState.players.length} competed` },
        { emoji: '⚡', label: 'Rounds', value: `${gameState.totalRounds}` },
        { emoji: '🏆', label: 'Top Score', value: `${sorted[0] ? gameState.scores[sorted[0].id] || 0 : 0} pts` },
        { emoji: '🎯', label: 'Total Points', value: `${Object.values(gameState.scores).reduce((a: number, b: number) => a + b, 0)}` },
      ]} />

      <div className="space-y-3 mb-8 relative">
        {sorted.map((player, index) => {
          const isMe = player.id === myId;
          const isWinner = index === 0;

          return (
            <div
              key={player.id}
              className={`flex items-center gap-3 p-4 rounded-2xl transition-all ${
                isWinner
                  ? 'bg-gradient-to-r from-amber-500/20 to-yellow-500/20 ring-1 ring-amber-400/30'
                  : isMe
                    ? 'bg-white/8 ring-1 ring-white/10'
                    : 'bg-white/[0.03]'
              }`}
            >
              <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 font-display font-bold text-sm ${
                index === 0 ? 'bg-amber-400 text-amber-900' :
                index === 1 ? 'bg-gray-300 text-gray-700' :
                index === 2 ? 'bg-amber-600 text-amber-100' :
                'bg-white/10 text-white/50'
              }`}>
                {index + 1}
              </div>

              <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: `${player.color}20` }}>
                <Avatar avatarId={player.avatar} size={36} color={player.color} />
              </div>

              <div className="flex-1 min-w-0 text-left">
                <div className="flex items-center gap-1.5">
                  <span className="font-bold text-white truncate">{player.name}</span>
                  {isWinner && <CrownIcon className="w-4 h-4 text-amber-400 flex-shrink-0" />}
                </div>
              </div>

              <div className="text-right">
                <p className="text-xl font-display font-bold text-white"><AnimatedNumber value={gameState.scores[player.id] || 0} /></p>
                <p className="text-xs text-white/30">points</p>
              </div>
            </div>
          );
        })}
      </div>

      <div className="space-y-3">
        <ShareResults gameName="Reaction Speed" winnerName={sorted[0]?.name ?? ''} winnerScore={gameState.scores[sorted[0]?.id] || 0} />
        {isHost ? (
          <>
            <button
              onClick={handlePlayAgain}
              disabled={restarting}
              className="w-full py-4 px-6 rounded-2xl font-display font-semibold text-lg
                bg-gradient-to-r from-green-500 to-emerald-500 text-white
                shadow-lg shadow-green-500/25
                active:scale-[0.98] transition-all duration-200 disabled:opacity-60"
            >
              {restarting ? 'Starting...' : 'Play Again'}
            </button>
            <button
              onClick={async () => {
                await fetch(`/api/rooms/${roomCode}/reset`, { method: 'POST' });
                router.push(`/room/${roomCode}`);
              }}
              className="w-full py-3 text-white/30 text-sm hover:text-white/50 transition-colors"
            >
              Back to Lobby
            </button>
          </>
        ) : (
          <>
            <div className="w-full py-4 px-6 rounded-2xl font-display font-semibold text-lg
              bg-white/5 text-white/30 text-center">
              Waiting for host to restart...
            </div>
            <button
              onClick={() => router.push(`/room/${roomCode}`)}
              className="w-full py-3 text-white/30 text-sm hover:text-white/50 transition-colors"
            >
              Back to Lobby
            </button>
          </>
        )}
      </div>
      {newAchievements.length > 0 && <AchievementToast achievements={newAchievements} />}
    </div>
  );
}

export default function ReactionSpeedPage({ params }: { params: { code: string } }) {
  const router = useRouter();
  const [session] = useState(() => typeof window !== 'undefined' ? getSession() : null);
  const [gameState, setGameState] = useState<ReactionSpeedState | null>(null);
  const [localPhase, setLocalPhase] = useState<'waiting' | 'go' | 'results' | 'leaderboard'>('waiting');
  const [tapped, setTapped] = useState(false);
  const [falseStarted, setFalseStarted] = useState(false);
  const [myReactionMs, setMyReactionMs] = useState<number | null>(null);
  const [error, setError] = useState('');
  const [roomEnded, setRoomEnded] = useState(false);
  const [previousScores, setPreviousScores] = useState<Record<string, number>>({});
  const prevRoundRef = useRef<number>(-1);
  const goSoundFiredRef = useRef(false);
  const resultSoundFiredRef = useRef(false);
  const trackedStartRef = useRef(false);
  const greenAtRef = useRef<number>(0);

  // Track page view
  useEffect(() => {
    trackPageView('reaction-speed');
  }, []);

  const fetchGameState = useCallback(async () => {
    try {
      const res = await fetch(`/api/rooms/${params.code}/game-state`);
      if (!res.ok) {
        const data = await res.json();
        if (data.error === 'No active game') {
          router.push(`/room/${params.code}`);
          return;
        }
        if (res.status === 404) {
          setRoomEnded(true);
          return;
        }
        setError('Failed to load game');
        return;
      }
      const data = await res.json();
      if (data.gameType !== 'reaction-speed') {
        router.push(`/room/${params.code}`);
        return;
      }

      setGameState(prev => {
        // Track game start once
        if (!trackedStartRef.current && data.players) {
          trackedStartRef.current = true;
          trackGameStart('reaction-speed', data.players.length);
        }

        // New round detected
        if (data.currentRound !== prevRoundRef.current) {
          prevRoundRef.current = data.currentRound;
          setTapped(false);
          setFalseStarted(false);
          setMyReactionMs(null);
          goSoundFiredRef.current = false;
          resultSoundFiredRef.current = false;
          greenAtRef.current = data.greenAt;
          setLocalPhase('waiting');
        }

        // Transition to results
        if (prev && (prev.phase === 'waiting' || prev.phase === 'go') && data.phase === 'results') {
          setPreviousScores(prev.scores);
          if (!resultSoundFiredRef.current) {
            resultSoundFiredRef.current = true;
            playSound('result');
          }
        }

        return data as ReactionSpeedState;
      });
    } catch {
      // Silently retry
    }
  }, [params.code, router]);

  useEffect(() => {
    fetchGameState();
    const interval = setInterval(fetchGameState, 500);
    return () => clearInterval(interval);
  }, [fetchGameState]);

  // Client-side green detection: check if Date.now() >= greenAt
  useEffect(() => {
    if (!gameState || gameState.phase === 'results' || gameState.phase === 'leaderboard') return;
    
    const checkGreen = () => {
      if (greenAtRef.current > 0 && Date.now() >= greenAtRef.current && localPhase === 'waiting') {
        setLocalPhase('go');
        if (!goSoundFiredRef.current) {
          goSoundFiredRef.current = true;
          playSound('go');
          // Haptic feedback
          if (typeof navigator !== 'undefined' && navigator.vibrate) {
            navigator.vibrate(50);
          }
        }
      }
    };

    const interval = setInterval(checkGreen, 16); // ~60fps check
    return () => clearInterval(interval);
  }, [gameState, localPhase]);

  // Save result on leaderboard
  useEffect(() => {
    if (gameState?.phase === 'leaderboard' && session?.playerId) {
      saveGameResult({
        gameType: 'reaction-speed',
        roomCode: params.code,
        score: gameState.scores[session.playerId] ?? 0,
        date: new Date().toISOString(),
      });
      trackGameEnd('reaction-speed', gameState.scores[session.playerId] ?? 0, params.code);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gameState?.phase]);

  async function handleTap() {
    if (!session || tapped || !gameState) return;
    if (gameState.phase !== 'waiting' && gameState.phase !== 'go' && localPhase !== 'go') return;

    const now = Date.now();
    setTapped(true);

    if (now < greenAtRef.current) {
      // False start!
      setFalseStarted(true);
      playSound('false-start');
      if (typeof navigator !== 'undefined' && navigator.vibrate) {
        navigator.vibrate([100, 50, 100]);
      }
    } else {
      // Good reaction
      const reactionTime = now - greenAtRef.current;
      setMyReactionMs(reactionTime);
      playSound('tap');
    }

    await fetch(`/api/rooms/${params.code}/reaction`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ playerId: session.playerId, action: 'react' }),
    });
  }

  if (roomEnded) {
    return (
      <main className="min-h-[100dvh] flex items-center justify-center px-6">
        <div className="text-center">
          <div className="text-4xl mb-4">🏁</div>
          <h2 className="text-xl font-display font-bold text-white mb-2">This room has ended</h2>
          <p className="text-white/50 text-sm mb-6">The game session is no longer available.</p>
          <button
            onClick={() => router.push('/')}
            className="px-6 py-3 rounded-xl glass text-white font-semibold"
          >
            Go Home
          </button>
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="min-h-[100dvh] flex items-center justify-center px-6">
        <div className="text-center">
          <p className="text-white/50 mb-4">{error}</p>
          <button onClick={() => router.push(`/room/${params.code}`)} className="px-6 py-3 rounded-xl glass text-white font-semibold">
            Back to Lobby
          </button>
        </div>
      </main>
    );
  }

  if (!gameState) {
    return (
      <main className="min-h-[100dvh] flex items-center justify-center">
        <div className="text-center">
          <div className="w-10 h-10 border-2 border-green-400 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-white/50 text-sm font-body">Loading game...</p>
        </div>
      </main>
    );
  }

  const isHost = gameState.players.find(p => p.id === session?.playerId)?.isHost ?? false;
  const effectivePhase = gameState.phase === 'results' || gameState.phase === 'leaderboard' ? gameState.phase : localPhase;

  // ===== WAITING PHASE =====
  if (effectivePhase === 'waiting') {
    return (
      <main
        className="min-h-[100dvh] flex flex-col items-center justify-center relative overflow-hidden cursor-pointer select-none"
        onClick={handleTap}
        style={{ background: 'linear-gradient(135deg, #7f1d1d 0%, #991b1b 30%, #450a0a 100%)' }}
      >
        {/* How to Play */}
        <div className="fixed top-4 right-4 z-40" onClick={e => e.stopPropagation()}>
          <HowToPlay gameId="reaction-speed" />
        </div>

        {/* Round indicator */}
        <div className="absolute top-6 left-6">
          <span className="text-sm font-display font-bold text-white/60">
            {gameState.currentRound + 1}/{gameState.totalRounds}
          </span>
        </div>

        {/* Player avatars */}
        <div className="absolute top-6 right-20">
          <div className="flex items-center gap-1">
            {gameState.players.map(p => (
              <div
                key={p.id}
                className="w-6 h-6 rounded-full flex items-center justify-center"
                style={{ backgroundColor: `${p.color}30` }}
              >
                <Avatar avatarId={p.avatar} size={16} color={p.color} />
              </div>
            ))}
          </div>
        </div>

        {falseStarted ? (
          <div className="text-center animate-screen-shake">
            <div className="text-8xl mb-6">🚫</div>
            <h1 className="font-display font-bold text-5xl text-red-300 mb-3">
              TOO EARLY!
            </h1>
            <p className="text-red-200/60 text-lg">-50 points</p>
            <p className="text-red-200/40 text-sm mt-4">Wait for the next round...</p>
          </div>
        ) : tapped ? (
          <div className="text-center">
            <div className="text-6xl mb-4">😬</div>
            <h1 className="font-display font-bold text-4xl text-red-300">TOO EARLY!</h1>
            <p className="text-red-200/60 text-lg mt-2">-50 points</p>
          </div>
        ) : (
          <div className="text-center">
            <div className="w-32 h-32 rounded-full bg-red-800/50 flex items-center justify-center mx-auto mb-8 animate-pulse">
              <div className="w-20 h-20 rounded-full bg-red-700/60 flex items-center justify-center">
                <div className="w-8 h-8 rounded-full bg-red-500/80" />
              </div>
            </div>
            <h1 className="font-display font-bold text-6xl text-white mb-4 tracking-wider">
              WAIT...
            </h1>
            <p className="text-red-200/40 text-sm">Don&apos;t tap yet!</p>
          </div>
        )}

        {/* Score bar */}
        <div className="absolute bottom-8 left-6 right-6">
          <div className="glass rounded-2xl p-3 flex items-center justify-between">
            <span className="text-white/50 text-sm">Your score</span>
            <span className="font-display font-bold text-white text-lg">
              {gameState.scores[session?.playerId ?? ''] || 0}
            </span>
          </div>
        </div>
      </main>
    );
  }

  // ===== GO PHASE =====
  if (effectivePhase === 'go') {
    return (
      <main
        className="min-h-[100dvh] flex flex-col items-center justify-center relative overflow-hidden cursor-pointer select-none"
        onClick={handleTap}
        style={{ background: 'linear-gradient(135deg, #14532d 0%, #15803d 30%, #052e16 100%)' }}
      >
        {/* Round indicator */}
        <div className="absolute top-6 left-6">
          <span className="text-sm font-display font-bold text-white/60">
            {gameState.currentRound + 1}/{gameState.totalRounds}
          </span>
        </div>

        {tapped ? (
          <div className="text-center">
            <div className="text-7xl mb-4">⚡</div>
            <h1 className="font-display font-bold text-4xl text-emerald-200 mb-2">
              {myReactionMs !== null ? `${myReactionMs}ms` : 'Tapped!'}
            </h1>
            <p className="text-emerald-200/50 text-sm">Waiting for others...</p>
          </div>
        ) : (
          <div className="text-center">
            <style>{`
              @keyframes go-pulse {
                0%, 100% { transform: scale(1); opacity: 1; }
                50% { transform: scale(1.1); opacity: 0.9; }
              }
              .animate-go-pulse { animation: go-pulse 0.4s ease-in-out infinite; }
            `}</style>
            <div className="w-40 h-40 rounded-full bg-green-400/30 flex items-center justify-center mx-auto mb-8 animate-go-pulse">
              <div className="w-28 h-28 rounded-full bg-green-400/40 flex items-center justify-center">
                <div className="w-16 h-16 rounded-full bg-green-400/70" />
              </div>
            </div>
            <h1 className="font-display font-bold text-7xl text-white mb-4 tracking-wider animate-go-pulse">
              TAP NOW!
            </h1>
            <p className="text-green-200/60 text-lg">Go go go!</p>
          </div>
        )}

        {/* Score bar */}
        <div className="absolute bottom-8 left-6 right-6">
          <div className="glass rounded-2xl p-3 flex items-center justify-between">
            <span className="text-white/50 text-sm">Your score</span>
            <span className="font-display font-bold text-white text-lg">
              {gameState.scores[session?.playerId ?? ''] || 0}
            </span>
          </div>
        </div>
      </main>
    );
  }

  // ===== RESULTS PHASE =====
  if (effectivePhase === 'results') {
    // Sort players by reaction time (false starts last, no reaction last)
    const playerResults = gameState.players.map(p => {
      const reaction = gameState.reactions[p.id];
      return {
        player: p,
        reaction,
        reactionMs: reaction && !reaction.falseStart ? reaction.reactedAt - greenAtRef.current : null,
      };
    }).sort((a, b) => {
      if (a.reactionMs !== null && b.reactionMs !== null) return a.reactionMs - b.reactionMs;
      if (a.reactionMs !== null) return -1;
      if (b.reactionMs !== null) return 1;
      if (a.reaction?.falseStart) return -1; // false starts before no-reaction
      return 1;
    });

    return (
      <main className="min-h-[100dvh] flex flex-col px-6 py-6 relative overflow-hidden">
        <div className="fixed inset-0 pointer-events-none overflow-hidden">
          <div className="absolute -top-32 -left-32 w-80 h-80 bg-green-600/10 rounded-full blur-3xl" />
          <div className="absolute -bottom-32 -right-32 w-64 h-64 bg-emerald-600/10 rounded-full blur-3xl" />
        </div>

        <div className="relative z-10 w-full max-w-sm mx-auto flex flex-col flex-1">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <span className="text-sm font-display font-bold text-white">
              Round {gameState.currentRound + 1}/{gameState.totalRounds}
            </span>
            <span className="text-xs font-semibold px-3 py-1 rounded-full bg-green-500/20 text-green-300">
              Results
            </span>
          </div>

          <h2 className="font-display font-bold text-2xl text-white text-center mb-6">Round Results</h2>

          <div className="space-y-3 mb-6">
            {playerResults.map(({ player, reaction, reactionMs }, index) => {
              const isMe = player.id === session?.playerId;
              const pointsGained = (gameState.scores[player.id] || 0) - (previousScores[player.id] || 0);

              return (
                <div
                  key={player.id}
                  className={`flex items-center gap-3 p-4 rounded-2xl transition-all ${
                    isMe ? 'bg-white/8 ring-1 ring-white/10' : 'bg-white/[0.03]'
                  }`}
                >
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 font-display font-bold text-sm ${
                    index === 0 && reactionMs !== null ? 'bg-amber-400 text-amber-900' :
                    index === 1 && reactionMs !== null ? 'bg-gray-300 text-gray-700' :
                    index === 2 && reactionMs !== null ? 'bg-amber-600 text-amber-100' :
                    'bg-white/10 text-white/50'
                  }`}>
                    {reactionMs !== null ? index + 1 : '—'}
                  </div>

                  <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: `${player.color}20` }}>
                    <Avatar avatarId={player.avatar} size={28} color={player.color} />
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm text-white truncate">{player.name}</p>
                    <p className={`text-xs ${
                      reaction?.falseStart ? 'text-rose-400' :
                      reactionMs !== null ? 'text-emerald-400' :
                      'text-white/30'
                    }`}>
                      {reaction?.falseStart ? '🚫 False Start!' :
                       reactionMs !== null ? `⚡ ${reactionMs}ms` :
                       '😴 Too Slow!'}
                    </p>
                  </div>

                  {pointsGained !== 0 && (
                    <div className={`animate-points-fly text-lg font-display font-bold ${
                      pointsGained > 0 ? 'text-emerald-400' : 'text-rose-400'
                    }`}>
                      {pointsGained > 0 ? '+' : ''}{pointsGained}
                    </div>
                  )}

                  <div className="text-right">
                    <p className="text-sm font-bold text-white">{gameState.scores[player.id] || 0}</p>
                    <p className="text-xs text-white/30">pts</p>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="text-center">
            <p className="text-white/30 text-sm animate-pulse">Next round starting...</p>
          </div>
        </div>
      </main>
    );
  }

  // ===== LEADERBOARD PHASE =====
  return (
    <main className="min-h-[100dvh] flex flex-col px-6 py-6 relative overflow-hidden">
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-32 -left-32 w-80 h-80 bg-green-600/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-32 -right-32 w-64 h-64 bg-emerald-600/10 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 w-full max-w-sm mx-auto flex flex-col flex-1">
        <LeaderboardView
          gameState={gameState}
          myId={session?.playerId || ''}
          isHost={isHost}
          roomCode={params.code}
          router={router}
          session={session}
        />
      </div>
    </main>
  );
}
