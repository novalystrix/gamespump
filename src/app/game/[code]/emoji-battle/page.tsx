'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { trackPageView, trackGameEnd } from '@/lib/analytics';
import { useRouter } from 'next/navigation';
import { getSession } from '@/lib/session';
import { saveGameResult } from '@/lib/gameHistory';
import { Player, EmojiBattleAnswer } from '@/lib/types';
import { Avatar } from '@/components/avatars/AvatarSVG';
import { CrownIcon } from '@/components/icons/GameIcons';
import { AnimatedNumber } from '@/components/AnimatedNumber';
import { ShareResults } from '@/components/ShareResults';
import { HowToPlay } from '@/components/HowToPlay';
import { Podium } from '@/components/Podium';
import { GameSummary } from '@/components/GameSummary';
import { AchievementToast } from '@/components/AchievementToast';
import { useAchievementCheck } from '@/hooks/useAchievementCheck';
import { useLocale } from '@/hooks/useLocale';

const ROUND_TIME = 7; // seconds

function playSound(name: string) {
  if (typeof window === 'undefined') return;
  try {
    const ctx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    const now = ctx.currentTime;
    if (name === 'correct') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(523, now);
      osc.frequency.setValueAtTime(659, now + 0.12);
      osc.frequency.setValueAtTime(784, now + 0.24);
      gain.gain.setValueAtTime(0.25, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.55);
      osc.start(now); osc.stop(now + 0.55);
    } else if (name === 'wrong') {
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(220, now);
      osc.frequency.setValueAtTime(160, now + 0.15);
      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
      osc.start(now); osc.stop(now + 0.35);
    } else if (name === 'countdown') {
      osc.type = 'square';
      osc.frequency.setValueAtTime(440, now);
      gain.gain.setValueAtTime(0.15, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
      osc.start(now); osc.stop(now + 0.08);
    } else if (name === 'round-start') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, now);
      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);
      osc.start(now); osc.stop(now + 0.18);
    }
  } catch {
    // AudioContext blocked or unavailable — silently ignore
  }
}

interface EmojiBattleState {
  gameType: 'emoji-battle';
  phase: 'playing' | 'results' | 'leaderboard';
  currentRound: number;
  totalRounds: number;
  targetEmoji: string;
  grid: string[];
  correctIndex: number;
  answers: Record<string, EmojiBattleAnswer>;
  scores: Record<string, number>;
  roundStartedAt: number;
  players: Player[];
}

function TimerBar({ startedAt }: { startedAt: number }) {
  const [remaining, setRemaining] = useState(ROUND_TIME);
  const lastCountdownSecRef = useRef(-1);

  useEffect(() => {
    trackPageView('game-emoji-battle');
    const interval = setInterval(() => {
      const elapsed = (Date.now() - startedAt) / 1000;
      const rem = Math.max(0, ROUND_TIME - elapsed);
      setRemaining(rem);
      const remCeil = Math.ceil(rem);
      if (rem <= 2 && rem > 0 && remCeil !== lastCountdownSecRef.current) {
        lastCountdownSecRef.current = remCeil;
        playSound('countdown');
      }
    }, 50);
    return () => clearInterval(interval);
  }, [startedAt]);

  const pct = (remaining / ROUND_TIME) * 100;
  const urgent = remaining <= 2;

  return (
    <div className="w-full">
      <style>{`
        @keyframes timer-pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.25); }
        }
        .animate-timer-pulse { animation: timer-pulse 0.5s ease-in-out infinite; display: inline-block; }
      `}</style>
      <div className="flex items-center justify-between mb-2">
        <span className={`text-sm font-bold tabular-nums transition-colors duration-300 ${
          urgent ? 'text-red-400 animate-timer-pulse' : 'text-white/60'
        }`}>
          {Math.ceil(remaining)}s
        </span>
      </div>
      <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-100 ease-linear ${
            urgent ? 'bg-red-500' : 'bg-gradient-to-r from-purple-400 to-fuchsia-400'
          }`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

function LeaderboardView({
  gameState,
  myId,
  isHost,
  roomCode,
  router,
  session,
}: {
  gameState: EmojiBattleState;
  myId: string;
  isHost: boolean;
  roomCode: string;
  router: ReturnType<typeof useRouter>;
  session: { playerId: string } | null;
}) {
  const [restarting, setRestarting] = useState(false);
  const { t } = useLocale();
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
      <h2 className="font-display font-bold text-3xl text-white mb-2">{t('common.gameOver')}</h2>
      <p className="text-white/40 text-sm mb-8">{t('common.finalScores')}</p>

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
        { emoji: '👥', label: 'Players', value: `${gameState.players.length} battled` },
        { emoji: '📊', label: 'Total Points', value: `${Object.values(gameState.scores).reduce((a: number, b: number) => a + b, 0)}` },
        { emoji: '🏆', label: 'Top Score', value: `${sorted[0] ? gameState.scores[sorted[0].id] || 0 : 0} pts` },
        { emoji: '🎯', label: 'Rounds', value: `${gameState.totalRounds} emojis` },
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
                <p className="text-xs text-white/30">{t('common.points')}</p>
              </div>
            </div>
          );
        })}
      </div>

      <div className="space-y-3">
        <ShareResults gameName={t('game.emoji-battle.name')} winnerName={sorted[0]?.name ?? ''} winnerScore={gameState.scores[sorted[0]?.id] || 0} />
        {isHost ? (
          <>
            <button
              onClick={handlePlayAgain}
              disabled={restarting}
              className="w-full py-4 px-6 rounded-2xl font-display font-semibold text-lg
                bg-gradient-to-r from-purple-500 to-fuchsia-500 text-white
                shadow-lg shadow-purple-500/25
                active:scale-[0.98] transition-all duration-200 disabled:opacity-60"
            >
              {restarting ? t('common.starting') : t('common.playAgain')}
            </button>
            <button
              onClick={async () => {
                await fetch(`/api/rooms/${roomCode}/reset`, { method: 'POST' });
                router.push(`/room/${roomCode}`);
              }}
              className="w-full py-3 text-white/30 text-sm hover:text-white/50 transition-colors"
            >
              {t('common.backToLobby')}
            </button>
          </>
        ) : (
          <>
            <div className="w-full py-4 px-6 rounded-2xl font-display font-semibold text-lg
              bg-white/5 text-white/30 text-center animate-pulse">
              {t('common.waitingForHost')}
            </div>
            <button
              onClick={() => router.push(`/room/${roomCode}`)}
              className="w-full py-3 text-white/30 text-sm hover:text-white/50 transition-colors"
            >
              {t('common.backToLobby')}
            </button>
          </>
        )}
      </div>
      {newAchievements.length > 0 && <AchievementToast achievements={newAchievements} />}
    </div>
  );
}

export default function EmojiBattlePage({ params }: { params: { code: string } }) {
  const router = useRouter();
  const { t } = useLocale();
  const [session] = useState(() => typeof window !== 'undefined' ? getSession() : null);
  const [gameState, setGameState] = useState<EmojiBattleState | null>(null);
  const [myAnswer, setMyAnswer] = useState<number | null>(null);
  const [shaking, setShaking] = useState(false);
  const [flashIndex, setFlashIndex] = useState<number | null>(null);
  const [flashType, setFlashType] = useState<'correct' | 'wrong' | null>(null);
  const [error, setError] = useState('');
  const [roomEnded, setRoomEnded] = useState(false);
  const [previousScores, setPreviousScores] = useState<Record<string, number>>({});
  const prevRoundRef = useRef<number>(-1);
  const resultSoundFiredRef = useRef(false);

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
      if (data.gameType !== 'emoji-battle') {
        router.push(`/room/${params.code}`);
        return;
      }

      setGameState(prev => {
        if (prev && prev.phase === 'playing' && data.phase === 'results') {
          setPreviousScores(prev.scores);
          resultSoundFiredRef.current = false;
        }
        if (data.phase === 'playing' && data.currentRound !== prevRoundRef.current) {
          setMyAnswer(null);
          setFlashIndex(null);
          setFlashType(null);
          prevRoundRef.current = data.currentRound;
          playSound('round-start');
        }
        return data as EmojiBattleState;
      });
    } catch {
      // Silently retry
    }
  }, [params.code, router]);

  useEffect(() => {
    fetchGameState();
    const interval = setInterval(fetchGameState, 1000);
    return () => clearInterval(interval);
  }, [fetchGameState]);

  // Play result sound once when entering results phase
  useEffect(() => {
    if (!gameState || gameState.phase !== 'results' || resultSoundFiredRef.current) return;
    resultSoundFiredRef.current = true;
    const myAns = gameState.answers[session?.playerId ?? ''];
    if (myAns) {
      playSound(myAns.correct ? 'correct' : 'wrong');
      if (!myAns.correct) {
        setShaking(true);
        setTimeout(() => setShaking(false), 300);
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gameState?.phase, gameState?.currentRound]);

  useEffect(() => {
    if (gameState?.phase === 'leaderboard' && session?.playerId) {
      saveGameResult({
        gameType: 'emoji-battle',
        roomCode: params.code,
        score: gameState.scores[session.playerId] ?? 0,
        date: new Date().toISOString(),
      });
      trackGameEnd('emoji-battle', gameState.scores[session.playerId] ?? 0, params.code);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gameState?.phase]);

  async function submitAnswer(emojiIndex: number) {
    if (!session || myAnswer !== null || !gameState || gameState.phase !== 'playing') return;
    setMyAnswer(emojiIndex);

    const isCorrect = emojiIndex === gameState.correctIndex;
    setFlashIndex(emojiIndex);
    setFlashType(isCorrect ? 'correct' : 'wrong');
    if (!isCorrect) {
      setShaking(true);
      setTimeout(() => setShaking(false), 300);
    }

    await fetch(`/api/rooms/${params.code}/emoji-battle`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        playerId: session.playerId,
        roundIndex: gameState.currentRound,
        emojiIndex,
      }),
    });
  }

  if (roomEnded) {
    return (
      <main className="min-h-[100dvh] flex items-center justify-center px-6">
        <div className="text-center">
          <div className="text-4xl mb-4">🏁</div>
          <h2 className="text-xl font-display font-bold text-white mb-2">{t('common.roomEnded')}</h2>
          <p className="text-white/50 text-sm mb-6">{t('common.roomEndedDesc')}</p>
          <button
            onClick={() => router.push('/')}
            className="px-6 py-3 rounded-xl glass text-white font-semibold"
          >
            {t('common.goHome')}
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
          <div className="w-10 h-10 border-2 border-purple-400 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-white/50 text-sm font-body">{t('common.loading')}</p>
        </div>
      </main>
    );
  }

  const answeredPlayerIds = Object.keys(gameState.answers);
  const hasAnswered = myAnswer !== null;
  const isHost = gameState.players.find(p => p.id === session?.playerId)?.isHost ?? false;

  return (
    <main className={`min-h-[100dvh] flex flex-col px-6 py-6 relative overflow-hidden${shaking ? ' animate-screen-shake' : ''}`}>
      <style>{`
        @keyframes correct-flash {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.08); }
        }
        @keyframes wrong-shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-5px); }
          75% { transform: translateX(5px); }
        }
        .animate-correct-flash { animation: correct-flash 0.35s ease-in-out; }
        .animate-wrong-shake { animation: wrong-shake 0.3s ease-in-out; }
      `}</style>

      {/* Background */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-32 -left-32 w-80 h-80 bg-yellow-600/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-32 -right-32 w-64 h-64 bg-orange-600/10 rounded-full blur-3xl" />
      </div>

      {/* How to Play */}
      <div className="fixed top-4 right-4 z-40">
        <HowToPlay gameId="emoji-battle" />
      </div>

      <div className="relative z-10 w-full max-w-sm mx-auto flex flex-col flex-1">
        {gameState.phase === 'leaderboard' && (
          <LeaderboardView
            gameState={gameState}
            myId={session?.playerId || ''}
            isHost={isHost}
            roomCode={params.code}
            router={router}
            session={session}
          />
        )}

        {gameState.phase !== 'leaderboard' && (
          <>
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm font-display font-bold text-white">
                {gameState.currentRound + 1}/{gameState.totalRounds}
              </span>
              <span className="text-xs font-semibold px-3 py-1 rounded-full bg-yellow-500/20 text-yellow-300">
                Emoji Battle
              </span>
              <div className="flex items-center gap-1">
                {gameState.players.map(p => (
                  <div
                    key={p.id}
                    className={`w-6 h-6 rounded-full flex items-center justify-center transition-all duration-300 ${
                      answeredPlayerIds.includes(p.id) ? 'scale-100 opacity-100' : 'scale-90 opacity-40'
                    }`}
                    style={{ backgroundColor: `${p.color}30` }}
                  >
                    <Avatar avatarId={p.avatar} size={16} color={p.color} />
                  </div>
                ))}
              </div>
            </div>

            {/* Timer */}
            {gameState.phase === 'playing' && (
              <div className="mb-5">
                <TimerBar startedAt={gameState.roundStartedAt} />
              </div>
            )}

            {/* Target emoji */}
            {gameState.phase === 'playing' && (
              <div className="text-center mb-6 py-5 glass rounded-2xl">
                <p className="text-white/50 text-xs uppercase tracking-widest mb-2 font-semibold">{t('game.emoji.findEmoji')}</p>
                <div className="text-6xl leading-none select-none">{gameState.targetEmoji}</div>
              </div>
            )}

            {/* Results target */}
            {gameState.phase === 'results' && (
              <div className="text-center mb-5 py-4 glass rounded-2xl">
                <p className="text-white/40 text-xs mb-1">The target was</p>
                <div className="text-5xl leading-none select-none">{gameState.targetEmoji}</div>
              </div>
            )}

            {/* 3x3 Emoji Grid */}
            <div className="grid grid-cols-3 gap-3 mb-5">
              {gameState.grid.map((emoji, idx) => {
                const isCorrect = idx === gameState.correctIndex;
                const isPicked = myAnswer === idx;
                const isWrongPick = isPicked && !isCorrect;
                const showingResults = gameState.phase === 'results';

                const flashClass =
                  flashIndex === idx && flashType === 'correct' ? 'animate-correct-flash' :
                  flashIndex === idx && flashType === 'wrong' ? 'animate-wrong-shake' : '';

                let bgClass = 'glass hover:bg-white/15 active:scale-[0.93]';
                let ringClass = '';

                if (showingResults) {
                  if (isCorrect) {
                    bgClass = 'bg-emerald-500/20';
                    ringClass = 'ring-2 ring-emerald-500';
                  } else if (isWrongPick) {
                    bgClass = 'bg-red-500/15';
                    ringClass = 'ring-2 ring-red-500';
                  } else {
                    bgClass = 'bg-white/[0.03] opacity-40';
                  }
                } else if (isPicked) {
                  bgClass = isCorrect ? 'bg-emerald-500/20' : 'bg-red-500/15';
                  ringClass = isCorrect ? 'ring-2 ring-emerald-500' : 'ring-2 ring-red-500';
                }

                return (
                  <button
                    key={idx}
                    onClick={() => submitAnswer(idx)}
                    disabled={hasAnswered || showingResults}
                    className={`${flashClass} ${bgClass} ${ringClass}
                      rounded-2xl flex items-center justify-center
                      text-4xl select-none transition-all duration-150
                      min-h-[60px] min-w-[60px]
                      disabled:cursor-default`}
                  >
                    {emoji}
                  </button>
                );
              })}
            </div>

            {/* Playing: waiting indicator */}
            {gameState.phase === 'playing' && hasAnswered && (
              <div className="text-center animate-pulse">
                <p className="text-white/40 text-sm">
                  Waiting for others... ({answeredPlayerIds.length}/{gameState.players.length})
                </p>
              </div>
            )}

            {/* Results: player scores */}
            {gameState.phase === 'results' && (
              <div className="space-y-2">
                {gameState.players.map(player => {
                  const answer = gameState.answers[player.id];
                  const pointsGained = (gameState.scores[player.id] || 0) - (previousScores[player.id] || 0);
                  const isMe = player.id === session?.playerId;

                  return (
                    <div
                      key={player.id}
                      className={`flex items-center gap-3 p-3 rounded-xl ${
                        isMe ? 'bg-white/8 ring-1 ring-white/10' : 'bg-white/[0.03]'
                      }`}
                    >
                      <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: `${player.color}20` }}>
                        <Avatar avatarId={player.avatar} size={28} color={player.color} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm text-white truncate">{player.name}</p>
                        <p className={`text-xs ${
                          !answer ? 'text-white/30' : answer.correct ? 'text-emerald-400' : 'text-rose-400'
                        }`}>
                          {!answer ? 'No answer' : answer.correct ? 'Correct!' : 'Wrong'}
                        </p>
                      </div>
                      {pointsGained > 0 && (
                        <div className="animate-points-fly text-xl font-display font-bold text-emerald-400">
                          +{pointsGained}
                        </div>
                      )}
                      <div className="text-right">
                        <p className="text-sm font-bold text-white">{gameState.scores[player.id] || 0}</p>
                        <p className="text-xs text-white/30">{t('common.pts')}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}
      </div>
    </main>
  );
}
