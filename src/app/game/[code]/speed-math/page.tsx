'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { trackPageView, trackGameEnd } from '@/lib/analytics';
import { useRouter } from 'next/navigation';
import { getSession } from '@/lib/session';
import { saveGameResult } from '@/lib/gameHistory';
import { Player, SpeedMathAnswer } from '@/lib/types';
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

const QUESTION_TIME = 10; // seconds

// Web Audio API sound effects — generates tones, no audio files needed
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
    } else if (name === 'streak-lost') {
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(280, now);
      osc.frequency.linearRampToValueAtTime(80, now + 0.45);
      gain.gain.setValueAtTime(0.22, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
      osc.start(now); osc.stop(now + 0.5);
    }
  } catch {
    // AudioContext blocked or unavailable — silently ignore
  }
}

const DIFFICULTY_COLORS: Record<string, { bg: string; text: string }> = {
  easy: { bg: 'bg-emerald-500/20', text: 'text-emerald-300' },
  medium: { bg: 'bg-amber-500/20', text: 'text-amber-300' },
  hard: { bg: 'bg-red-500/20', text: 'text-red-300' },
};

const ANSWER_COLORS = [
  { bg: 'bg-blue-500', hover: 'hover:bg-blue-400', ring: 'ring-blue-300' },
  { bg: 'bg-emerald-500', hover: 'hover:bg-emerald-400', ring: 'ring-emerald-300' },
  { bg: 'bg-orange-500', hover: 'hover:bg-orange-400', ring: 'ring-orange-300' },
  { bg: 'bg-rose-500', hover: 'hover:bg-rose-400', ring: 'ring-rose-300' },
];

interface SpeedMathState {
  gameType: 'speed-math';
  phase: 'question' | 'results' | 'leaderboard';
  currentQuestion: number;
  totalQuestions: number;
  question: {
    problem: string;
    options: number[];
    difficulty: string;
    correctIndex?: number;
  };
  answers: string[] | Record<string, SpeedMathAnswer>;
  scores: Record<string, number>;
  questionStartedAt: number;
  players: Player[];
}

function TimerBar({ startedAt }: { startedAt: number }) {
  const [remaining, setRemaining] = useState(QUESTION_TIME);
  const lastCountdownSecRef = useRef(-1);

  useEffect(() => {
    trackPageView('game-speed-math');
    const interval = setInterval(() => {
      const elapsed = (Date.now() - startedAt) / 1000;
      const rem = Math.max(0, QUESTION_TIME - elapsed);
      setRemaining(rem);
      const remCeil = Math.ceil(rem);
      if (rem <= 5 && rem > 0 && remCeil !== lastCountdownSecRef.current) {
        lastCountdownSecRef.current = remCeil;
        playSound('countdown');
      }
    }, 50);
    return () => clearInterval(interval);
  }, [startedAt]);

  const pct = (remaining / QUESTION_TIME) * 100;
  const urgent = remaining <= 5;
  const critical = remaining <= 3;

  return (
    <div className="w-full">
      <style>{`
        @keyframes timer-pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.25); }
        }
        .animate-timer-pulse {
          animation: timer-pulse 0.5s ease-in-out infinite;
          display: inline-block;
        }
      `}</style>
      <div className="flex items-center justify-between mb-2">
        <span className={`text-sm font-bold tabular-nums transition-colors duration-300 ${
          critical ? 'text-red-400 animate-timer-pulse' : urgent ? 'text-amber-400' : 'text-white/60'
        }`}>
          {Math.ceil(remaining)}s
        </span>
      </div>
      <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-100 ease-linear ${
            critical ? 'bg-red-500' : urgent ? 'bg-amber-400' : 'bg-purple-400'
          }`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

function ResultsView({
  gameState,
  myId,
  previousScores,
  myAnswer,
}: {
  gameState: SpeedMathState;
  myId: string;
  previousScores: Record<string, number>;
  myAnswer?: number | null;
}) {
  const { t } = useLocale();
  const answers = gameState.answers as Record<string, SpeedMathAnswer>;
  const correctIndex = gameState.question.correctIndex!;

  useEffect(() => {
    const myAnswer = answers[myId];
    if (myAnswer) {
      playSound(myAnswer.answerIndex === correctIndex ? 'correct' : 'wrong');
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Sort correct answers by speed
  const correctPlayers = Object.entries(answers)
    .filter(([, a]) => a.answerIndex === correctIndex)
    .sort((a, b) => a[1].answeredAt - b[1].answeredAt);

  const speedLabels = ['1st!', '2nd', '3rd'];

  return (
    <div className="animate-slide-up">
      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-4px); }
          75% { transform: translateX(4px); }
        }
        .animate-shake { animation: shake 0.3s ease-in-out; }
      `}</style>

      {/* Answer button feedback */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        {gameState.question.options.map((option, idx) => {
          const colors = ANSWER_COLORS[idx];
          const isCorrect = idx === correctIndex;
          const isPicked = myAnswer === idx;
          const isWrong = isPicked && !isCorrect;
          return (
            <div
              key={idx}
              className={`py-5 px-4 rounded-2xl font-display font-bold text-2xl text-white
                min-h-[72px] flex items-center justify-center
                ${isCorrect
                  ? `${colors.bg} ring-4 ring-emerald-500 shadow-lg shadow-emerald-500/25 animate-correct-glow`
                  : isWrong
                    ? `${colors.bg} ring-4 ring-red-500 animate-shake`
                    : 'bg-white/5 opacity-30'
                }`}
            >
              {option}
            </div>
          );
        })}
      </div>

      {/* Correct answer */}
      <div className="text-center mb-6">
        <p className="text-white/40 text-sm mb-2">The answer was:</p>
        <div className="inline-block px-6 py-3 rounded-xl bg-emerald-500 text-white font-display font-bold text-2xl">
          {gameState.question.options[correctIndex]}
        </div>
      </div>

      {/* Player results */}
      <div className="space-y-2 mb-6">
        {gameState.players.map(player => {
          const answer = answers[player.id];
          const isCorrect = answer && answer.answerIndex === correctIndex;
          const pointsGained = (gameState.scores[player.id] || 0) - (previousScores[player.id] || 0);
          const isMe = player.id === myId;
          const speedRank = correctPlayers.findIndex(([pid]) => pid === player.id);

          return (
            <div
              key={player.id}
              className={`flex items-center gap-3 p-3 rounded-xl transition-all ${
                isMe ? 'bg-white/8 ring-1 ring-white/10' : 'bg-white/[0.03]'
              }`}
            >
              <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: `${player.color}20` }}>
                <Avatar avatarId={player.avatar} size={28} color={player.color} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm text-white truncate">{player.name}</p>
                <p className={`text-xs ${
                  !answer ? 'text-white/30' : isCorrect ? 'text-emerald-400' : 'text-rose-400'
                }`}>
                  {!answer ? 'No answer' : isCorrect ? (speedRank >= 0 && speedRank < 3 ? speedLabels[speedRank] : 'Correct') : 'Wrong'}
                </p>
              </div>
              {pointsGained > 0 && (
                <div className="animate-points-fly text-2xl font-display font-bold text-emerald-400">
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
  gameState: SpeedMathState;
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
        { emoji: '🧮', label: 'Problems', value: `${gameState.totalQuestions} solved` },
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
        <ShareResults gameName={t('game.speed-math.name')} winnerName={sorted[0]?.name ?? ''} winnerScore={gameState.scores[sorted[0]?.id] || 0} />
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
              {restarting ? 'Starting...' : t('common.playAgain')}
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
              bg-white/5 text-white/30 text-center">
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

export default function SpeedMathPage({ params }: { params: { code: string } }) {
  const router = useRouter();
  const { t } = useLocale();
  const [session] = useState(() => typeof window !== 'undefined' ? getSession() : null);
  const [gameState, setGameState] = useState<SpeedMathState | null>(null);
  const [myAnswer, setMyAnswer] = useState<number | null>(null);
  const [shaking, setShaking] = useState(false);
  const [error, setError] = useState('');
  const [roomEnded, setRoomEnded] = useState(false);
  const [previousScores, setPreviousScores] = useState<Record<string, number>>({});
  const [streak, setStreak] = useState(0);
  const [streakLost, setStreakLost] = useState(false);
  const streakRef = useRef(0);
  const prevQuestionRef = useRef<number>(-1);
  const autoAdvanceRef = useRef<NodeJS.Timeout | null>(null);
  const timerExpiredRef = useRef(false);

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
      if (data.gameType !== 'speed-math') {
        router.push(`/room/${params.code}`);
        return;
      }

      setGameState(prev => {
        if (prev && prev.phase === 'question' && data.phase === 'results') {
          setPreviousScores(prev.scores);
        }
        if (data.phase === 'question' && data.currentQuestion !== prevQuestionRef.current) {
          setMyAnswer(null);
          timerExpiredRef.current = false;
          prevQuestionRef.current = data.currentQuestion;
        }
        return data as SpeedMathState;
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

  // Timer expiration
  useEffect(() => {
    if (!gameState || gameState.phase !== 'question') return;

    const elapsed = Date.now() - gameState.questionStartedAt;
    const remaining = QUESTION_TIME * 1000 - elapsed;

    if (remaining <= 0 && !timerExpiredRef.current) {
      timerExpiredRef.current = true;
      fetch(`/api/rooms/${params.code}/advance-math`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'force-results' }),
      });
      return;
    }

    const timer = setTimeout(() => {
      if (!timerExpiredRef.current) {
        timerExpiredRef.current = true;
        fetch(`/api/rooms/${params.code}/advance-math`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'force-results' }),
        });
      }
    }, remaining);

    return () => clearTimeout(timer);
  }, [gameState?.phase, gameState?.currentQuestion, gameState?.questionStartedAt, params.code]);

  // Auto-advance from results
  useEffect(() => {
    if (!gameState || gameState.phase !== 'results') {
      if (autoAdvanceRef.current) {
        clearTimeout(autoAdvanceRef.current);
        autoAdvanceRef.current = null;
      }
      return;
    }

    if (autoAdvanceRef.current) return;

    autoAdvanceRef.current = setTimeout(() => {
      autoAdvanceRef.current = null;
      fetch(`/api/rooms/${params.code}/advance-math`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'advance' }),
      });
    }, 3000);

    return () => {
      if (autoAdvanceRef.current) {
        clearTimeout(autoAdvanceRef.current);
        autoAdvanceRef.current = null;
      }
    };
  }, [gameState?.phase, gameState?.currentQuestion, params.code]);

  useEffect(() => {
    if (gameState?.phase === 'results' && gameState.question.correctIndex !== undefined) {
      const isCorrect = myAnswer !== null && myAnswer === gameState.question.correctIndex;
      if (!isCorrect) {
        setShaking(true);
        setTimeout(() => setShaking(false), 300);
        if (streakRef.current >= 3) {
          setStreakLost(true);
          playSound('streak-lost');
          setTimeout(() => setStreakLost(false), 2500);
        }
        streakRef.current = 0;
        setStreak(0);
      } else {
        streakRef.current += 1;
        setStreak(streakRef.current);
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gameState?.phase, gameState?.currentQuestion]);

  useEffect(() => {
    if (gameState?.phase === 'leaderboard' && session?.playerId) {
      saveGameResult({
        gameType: 'speed-math',
        roomCode: params.code,
        score: gameState.scores[session.playerId] ?? 0,
        date: new Date().toISOString(),
      });
      trackGameEnd('speed-math', gameState.scores[session.playerId] ?? 0, params.code);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gameState?.phase]);

  async function submitAnswer(answerIndex: number) {
    if (!session || myAnswer !== null || !gameState || gameState.phase !== 'question') return;
    setMyAnswer(answerIndex);

    await fetch(`/api/rooms/${params.code}/math-answer`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        playerId: session.playerId,
        questionIndex: gameState.currentQuestion,
        answerIndex,
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
            {t('common.backToLobby')}
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

  const answeredPlayerIds = Array.isArray(gameState.answers)
    ? gameState.answers as string[]
    : Object.keys(gameState.answers);
  const hasAnswered = myAnswer !== null;
  const isHost = gameState.players.find(p => p.id === session?.playerId)?.isHost ?? false;
  const diffColors = DIFFICULTY_COLORS[gameState.question.difficulty] || DIFFICULTY_COLORS.easy;

  return (
    <main className={`min-h-[100dvh] flex flex-col px-6 py-6 relative overflow-hidden${shaking ? ' animate-screen-shake' : ''}`}>
      {/* Background */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-32 -left-32 w-80 h-80 bg-purple-600/15 rounded-full blur-3xl" />
        <div className="absolute -bottom-32 -right-32 w-64 h-64 bg-fuchsia-600/10 rounded-full blur-3xl" />
      </div>

      {/* How to Play */}
      <div className="fixed top-4 right-4 z-40">
        <HowToPlay gameId="speed-math" />
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
                {gameState.currentQuestion + 1}/{gameState.totalQuestions}
              </span>
              <span className={`text-xs font-semibold px-3 py-1 rounded-full capitalize ${diffColors.bg} ${diffColors.text}`}>
                {gameState.question.difficulty}
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
            {gameState.phase === 'question' && (
              <div className="mb-6">
                <TimerBar startedAt={gameState.questionStartedAt} />
              </div>
            )}

            {/* Streak badge */}
            {streak >= 2 && gameState.phase === 'question' && (
              <div className="flex justify-center mb-4">
                <style>{`
                  @keyframes streak-pulse {
                    0%, 100% { transform: scale(1); }
                    50% { transform: scale(1.08); }
                  }
                  .animate-streak-pulse { animation: streak-pulse 1.2s ease-in-out infinite; }
                  @keyframes streak-lost-fade {
                    0% { opacity: 1; transform: translateY(0); }
                    70% { opacity: 1; transform: translateY(-4px); }
                    100% { opacity: 0; transform: translateY(-8px); }
                  }
                  .animate-streak-lost { animation: streak-lost-fade 2.5s ease-out forwards; }
                `}</style>
                <div className="animate-streak-pulse flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-orange-500/15 border border-orange-500/30">
                  <span className={streak >= 5 ? 'text-2xl' : streak >= 3 ? 'text-xl' : 'text-lg'}>🔥</span>
                  <span className="font-display font-bold text-sm bg-gradient-to-r from-orange-400 to-amber-300 bg-clip-text text-transparent">
                    {streak} streak!
                  </span>
                </div>
              </div>
            )}

            {/* Math problem */}
            {gameState.phase === 'question' && (
              <>
                <div className="text-center mb-8 py-6 glass rounded-2xl">
                  <h2 className="font-display font-bold text-4xl text-white tracking-wide">
                    {gameState.question.problem} = ?
                  </h2>
                </div>

                {/* Answer buttons */}
                <div className="grid grid-cols-2 gap-3 mb-6">
                  {gameState.question.options.map((option, idx) => {
                    const colors = ANSWER_COLORS[idx];
                    const isSelected = myAnswer === idx;

                    return (
                      <button
                        key={idx}
                        onClick={() => submitAnswer(idx)}
                        disabled={hasAnswered}
                        className={`py-5 px-4 rounded-2xl font-display font-bold text-2xl text-white
                          transition-all duration-200 active:scale-[0.95] min-h-[72px]
                          ${isSelected
                            ? `${colors.bg} ring-3 ${colors.ring} scale-[1.03] shadow-lg`
                            : hasAnswered
                              ? 'bg-white/5 opacity-40 cursor-not-allowed'
                              : `${colors.bg} ${colors.hover} shadow-md`
                          }`}
                      >
                        {option}
                      </button>
                    );
                  })}
                </div>

                {hasAnswered && (
                  <div className="text-center animate-pulse">
                    <p className="text-white/40 text-sm">
                      Waiting for others... ({answeredPlayerIds.length}/{gameState.players.length})
                    </p>
                  </div>
                )}
              </>
            )}

            {/* Results phase */}
            {gameState.phase === 'results' && (
              <>
                {streakLost && (
                  <div className="text-center mb-3">
                    <style>{`
                      @keyframes streak-lost-fade {
                        0% { opacity: 1; transform: translateY(0); }
                        70% { opacity: 1; transform: translateY(-4px); }
                        100% { opacity: 0; transform: translateY(-8px); }
                      }
                      .animate-streak-lost { animation: streak-lost-fade 2.5s ease-out forwards; }
                    `}</style>
                    <span className="animate-streak-lost inline-block text-sm font-bold text-rose-400">💔 Streak lost!</span>
                  </div>
                )}
                <ResultsView
                  gameState={gameState}
                  myId={session?.playerId || ''}
                  previousScores={previousScores}
                  myAnswer={myAnswer}
                />
              </>
            )}
          </>
        )}
      </div>
    </main>
  );
}
