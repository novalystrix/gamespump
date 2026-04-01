'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { trackPageView, trackGameEnd } from '@/lib/analytics';
import { useRouter } from 'next/navigation';
import { getSession } from '@/lib/session';
import { saveGameResult } from '@/lib/gameHistory';
import { Player, TriviaAnswer, TriviaReaction } from '@/lib/types';
import { Avatar } from '@/components/avatars/AvatarSVG';
import { CrownIcon } from '@/components/icons/GameIcons';
import { AnimatedNumber } from '@/components/AnimatedNumber';
import { ShareResults } from '@/components/ShareResults';
import { HowToPlay } from '@/components/HowToPlay';
import { Podium } from '@/components/Podium';
import { GameSummary } from '@/components/GameSummary';
import { AchievementToast } from '@/components/AchievementToast';
import { useAchievementCheck } from '@/hooks/useAchievementCheck';

const QUESTION_TIME = 15; // seconds
const REACTION_EMOJIS = ['👏', '🔥', '😂', '🤔'];
const ANSWER_COLORS = [
  { bg: 'bg-blue-500', hover: 'hover:bg-blue-400', ring: 'ring-blue-300', text: 'text-blue-100' },
  { bg: 'bg-emerald-500', hover: 'hover:bg-emerald-400', ring: 'ring-emerald-300', text: 'text-emerald-100' },
  { bg: 'bg-orange-500', hover: 'hover:bg-orange-400', ring: 'ring-orange-300', text: 'text-orange-100' },
  { bg: 'bg-rose-500', hover: 'hover:bg-rose-400', ring: 'ring-rose-300', text: 'text-rose-100' },
];

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
    } else if (name === 'reaction') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, now);
      gain.gain.setValueAtTime(0.15, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
      osc.start(now); osc.stop(now + 0.12);
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

const CATEGORY_COLORS: Record<string, string> = {
  'General Knowledge': 'bg-purple-500/20 text-purple-300',
  'Science': 'bg-cyan-500/20 text-cyan-300',
  'Pop Culture': 'bg-pink-500/20 text-pink-300',
  'Geography': 'bg-emerald-500/20 text-emerald-300',
  'Animals': 'bg-amber-500/20 text-amber-300',
  'Food': 'bg-red-500/20 text-red-300',
};

interface GameState {
  phase: 'question' | 'results' | 'leaderboard';
  currentQuestion: number;
  totalQuestions: number;
  question: {
    question: string;
    options: string[];
    category: string;
    correctIndex?: number;
  };
  answers: string[] | Record<string, TriviaAnswer>;
  scores: Record<string, number>;
  questionStartedAt: number;
  players: Player[];
  reactions: TriviaReaction[];
}

// Timer Bar Component
function TimerBar({ startedAt }: { startedAt: number }) {
  const [remaining, setRemaining] = useState(QUESTION_TIME);
  const lastCountdownSecRef = useRef(-1);

  useEffect(() => {
    trackPageView('game-trivia-clash');
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

// Points Popup
function PointsPopup({ points, catchupBonus }: { points: number; catchupBonus?: boolean }) {
  if (points <= 0) return null;
  return (
    <div className="flex flex-col items-end gap-0.5">
      <div className="animate-points-fly text-2xl font-display font-bold text-emerald-400">
        +{points}
      </div>
      {catchupBonus && (
        <span className="text-[10px] font-bold text-amber-400 bg-amber-400/10 px-1.5 py-0.5 rounded-full whitespace-nowrap">
          Catch-up bonus!
        </span>
      )}
    </div>
  );
}

// Floating Reactions Overlay
function ReactionsOverlay({
  reactions,
  players,
}: {
  reactions: TriviaReaction[];
  players: Player[];
}) {
  type VisibleReaction = { id: string; emoji: string; color: string; x: number };
  const [visible, setVisible] = useState<VisibleReaction[]>([]);
  const seenIds = useRef<Set<string>>(new Set());
  const timers = useRef<Map<string, NodeJS.Timeout>>(new Map());

  useEffect(() => {
    reactions.forEach(r => {
      if (seenIds.current.has(r.id)) return;
      seenIds.current.add(r.id);
      playSound('reaction');
      const player = players.find(p => p.id === r.playerId);
      const color = player?.color ?? '#a855f7';
      const x = 10 + Math.random() * 80;
      setVisible(prev => [...prev, { id: r.id, emoji: r.emoji, color, x }]);
      const t = setTimeout(() => {
        setVisible(prev => prev.filter(vr => vr.id !== r.id));
        timers.current.delete(r.id);
      }, 2500);
      timers.current.set(r.id, t);
    });
  }, [reactions, players]);

  useEffect(() => {
    const ts = timers.current;
    return () => { ts.forEach(t => clearTimeout(t)); };
  }, []);

  if (visible.length === 0) return null;

  return (
    <>
      <style>{`
        @keyframes reactionFloat {
          0%   { opacity: 1; transform: translateY(0)    scale(1);   }
          70%  { opacity: 1; transform: translateY(-40px) scale(1.4); }
          100% { opacity: 0; transform: translateY(-60px) scale(1.2); }
        }
        .reaction-bubble { animation: reactionFloat 2.5s ease-out forwards; }
      `}</style>
      <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
        {visible.map(r => (
          <div
            key={r.id}
            className="reaction-bubble absolute bottom-28 text-3xl"
            style={{ left: `${r.x}%` }}
          >
            {r.emoji}
          </div>
        ))}
      </div>
    </>
  );
}

// Emoji Reaction Buttons
function ReactionButtons({
  roomCode,
  playerId,
}: {
  roomCode: string;
  playerId: string;
}) {
  const [cooldown, setCooldown] = useState<string | null>(null);

  async function sendReaction(emoji: string) {
    if (cooldown) return;
    setCooldown(emoji);
    setTimeout(() => setCooldown(null), 1500);
    await fetch(`/api/rooms/${roomCode}/react`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ playerId, emoji }),
    });
  }

  return (
    <div className="flex justify-center gap-3 mt-2">
      {REACTION_EMOJIS.map(emoji => (
        <button
          key={emoji}
          onClick={() => sendReaction(emoji)}
          disabled={cooldown === emoji}
          className={`text-2xl p-2 rounded-xl transition-all duration-150 active:scale-90 ${
            cooldown === emoji
              ? 'opacity-40 scale-95'
              : 'hover:bg-white/10 hover:scale-110'
          }`}
        >
          {emoji}
        </button>
      ))}
    </div>
  );
}

// Results View
function ResultsView({
  gameState,
  myId,
  previousScores,
}: {
  gameState: GameState;
  myId: string;
  previousScores: Record<string, number>;
}) {
  const answers = gameState.answers as Record<string, TriviaAnswer>;
  const correctIndex = gameState.question.correctIndex!;

  useEffect(() => {
    const myAnswer = answers[myId];
    if (myAnswer) {
      playSound(myAnswer.answerIndex === correctIndex ? 'correct' : 'wrong');
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="animate-slide-up">
      {/* Question recap */}
      <div className="text-center mb-6">
        <p className="text-white/40 text-sm mb-2">The correct answer was:</p>
        <div className={`inline-block px-4 py-2 rounded-xl ${ANSWER_COLORS[correctIndex].bg} text-white font-bold text-lg animate-correct-glow`}>
          {gameState.question.options[correctIndex]}
        </div>
      </div>

      {/* Player answers */}
      <div className="space-y-2 mb-6">
        {gameState.players.map(player => {
          const answer = answers[player.id];
          const isCorrect = answer && answer.answerIndex === correctIndex;
          const pointsGained = (gameState.scores[player.id] || 0) - (previousScores[player.id] || 0);
          const isMe = player.id === myId;

          return (
            <div
              key={player.id}
              className={`flex items-center gap-3 p-3 rounded-xl transition-all ${
                isMe ? 'bg-white/8 ring-1 ring-white/10' : 'bg-white/[0.03]'
              }`}
            >
              <div
                className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                style={{ backgroundColor: `${player.color}20` }}
              >
                <Avatar avatarId={player.avatar} size={28} color={player.color} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm text-white truncate">{player.name}</p>
                <p className={`text-xs ${
                  !answer ? 'text-white/30' : isCorrect ? 'text-emerald-400' : 'text-rose-400'
                }`}>
                  {!answer ? 'No answer' : isCorrect ? 'Correct!' : gameState.question.options[answer.answerIndex]}
                </p>
              </div>
              {pointsGained > 0 && (
                <PointsPopup points={pointsGained} catchupBonus={answer?.catchupBonus} />
              )}
              <div className="text-right">
                <p className="text-sm font-bold text-white">{gameState.scores[player.id] || 0}</p>
                <p className="text-xs text-white/30">pts</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// Leaderboard View
function LeaderboardView({
  gameState,
  myId,
  isHost,
  roomCode,
  router,
  session,
}: {
  gameState: GameState;
  myId: string;
  isHost: boolean;
  roomCode: string;
  router: ReturnType<typeof useRouter>;
  session: { playerId: string } | null;
}) {
  const [restarting, setRestarting] = useState(false);
  const newAchievements = useAchievementCheck();

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

  async function handlePlayAgain() {
    if (!session || !isHost) return;
    setRestarting(true);
    await fetch(`/api/rooms/${roomCode}/restart`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ playerId: session.playerId }),
    });
    // Game state will update via polling — no redirect needed
    setRestarting(false);
  }

  async function handleRematch() {
    await fetch(`/api/rooms/${roomCode}/reset`, { method: 'POST' });
    router.push(`/room/${roomCode}`);
  }

  return (
    <div className="animate-slide-up text-center">
      <h2 className="font-display font-bold text-3xl text-white mb-2">Game Over!</h2>
      <p className="text-white/40 text-sm mb-8">Final Scores</p>

      {/* Confetti-style decorations */}
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
        { emoji: '🎯', label: 'Questions', value: `${gameState.totalQuestions} rounds` },
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
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 font-display font-bold text-sm ${
                index === 0 ? 'bg-amber-400 text-amber-900' :
                index === 1 ? 'bg-gray-300 text-gray-700' :
                index === 2 ? 'bg-amber-600 text-amber-100' :
                'bg-white/10 text-white/50'
              }`}>
                {index + 1}
              </div>

              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ backgroundColor: `${player.color}20` }}
              >
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
        <ShareResults gameName="Trivia Clash" winnerName={sorted[0]?.name ?? ''} winnerScore={gameState.scores[sorted[0]?.id] || 0} />
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
              {restarting ? 'Starting...' : 'Play Again'}
            </button>
            <button
              onClick={handleRematch}
              className="w-full py-3 text-white/30 text-sm hover:text-white/50 transition-colors"
            >
              Rematch (Back to Lobby)
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

// Main Component
export default function TriviaClashPage({ params }: { params: { code: string } }) {
  const router = useRouter();
  const [session] = useState(() => typeof window !== 'undefined' ? getSession() : null);
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [myAnswer, setMyAnswer] = useState<number | null>(null);
  const [shaking, setShaking] = useState(false);
  const [error, setError] = useState('');
  const [roomEnded, setRoomEnded] = useState(false);
  const [previousScores, setPreviousScores] = useState<Record<string, number>>({});
  const [streak, setStreak] = useState(0);
  const [streakLost, setStreakLost] = useState(false);
  const streakRef = useRef(0);
  const prevQuestionRef = useRef<number>(-1);
  const autoAdvanceTimerRef = useRef<NodeJS.Timeout | null>(null);
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
      const data: GameState = await res.json();

      setGameState(prev => {
        if (prev && prev.phase === 'question' && data.phase === 'results') {
          setPreviousScores(prev.scores);
        }
        if (data.phase === 'question' && data.currentQuestion !== prevQuestionRef.current) {
          setMyAnswer(null);
          timerExpiredRef.current = false;
          prevQuestionRef.current = data.currentQuestion;
        }
        return data;
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

  // Timer expiration — force results
  useEffect(() => {
    if (!gameState || gameState.phase !== 'question') return;

    const elapsed = Date.now() - gameState.questionStartedAt;
    const remaining = QUESTION_TIME * 1000 - elapsed;

    if (remaining <= 0 && !timerExpiredRef.current) {
      timerExpiredRef.current = true;
      fetch(`/api/rooms/${params.code}/next-question`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'force-results' }),
      });
      return;
    }

    const timer = setTimeout(() => {
      if (!timerExpiredRef.current) {
        timerExpiredRef.current = true;
        fetch(`/api/rooms/${params.code}/next-question`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'force-results' }),
        });
      }
    }, remaining);

    return () => clearTimeout(timer);
  }, [gameState?.phase, gameState?.currentQuestion, gameState?.questionStartedAt, params.code]);

  // Auto-advance from results to next question after 4 seconds
  useEffect(() => {
    if (!gameState || gameState.phase !== 'results') {
      if (autoAdvanceTimerRef.current) {
        clearTimeout(autoAdvanceTimerRef.current);
        autoAdvanceTimerRef.current = null;
      }
      return;
    }

    if (autoAdvanceTimerRef.current) return;

    autoAdvanceTimerRef.current = setTimeout(() => {
      autoAdvanceTimerRef.current = null;
      fetch(`/api/rooms/${params.code}/next-question`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'advance' }),
      });
    }, 4000);

    return () => {
      if (autoAdvanceTimerRef.current) {
        clearTimeout(autoAdvanceTimerRef.current);
        autoAdvanceTimerRef.current = null;
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
        gameType: 'trivia-clash',
        roomCode: params.code,
        score: gameState.scores[session.playerId] ?? 0,
        date: new Date().toISOString(),
      });
      trackGameEnd('trivia-clash', gameState.scores[session.playerId] ?? 0, params.code);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gameState?.phase]);

  async function submitAnswer(answerIndex: number) {
    if (!session || myAnswer !== null || !gameState || gameState.phase !== 'question') return;
    setMyAnswer(answerIndex);
    await fetch(`/api/rooms/${params.code}/answer`, {
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
          <button
            onClick={() => router.push(`/room/${params.code}`)}
            className="px-6 py-3 rounded-xl glass text-white font-semibold"
          >
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
          <p className="text-white/50 text-sm font-body">Loading game...</p>
        </div>
      </main>
    );
  }

  const answeredPlayerIds = Array.isArray(gameState.answers)
    ? gameState.answers as string[]
    : Object.keys(gameState.answers);
  const answeredCount = answeredPlayerIds.length;
  const totalPlayers = gameState.players.length;
  const hasAnswered = myAnswer !== null;
  const isHost = gameState.players.find(p => p.id === session?.playerId)?.isHost ?? false;

  return (
    <main className={`min-h-[100dvh] flex flex-col px-6 py-6 relative overflow-hidden${shaking ? ' animate-screen-shake' : ''}`}>
      {/* Background */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-32 -left-32 w-80 h-80 bg-purple-600/15 rounded-full blur-3xl" />
        <div className="absolute -bottom-32 -right-32 w-64 h-64 bg-fuchsia-600/10 rounded-full blur-3xl" />
      </div>

      {/* How to Play */}
      <div className="fixed top-4 right-4 z-40">
        <HowToPlay gameId="trivia-clash" />
      </div>

      {/* Floating emoji reactions */}
      {gameState.reactions?.length > 0 && (
        <ReactionsOverlay reactions={gameState.reactions} players={gameState.players} />
      )}

      <div className="relative z-10 w-full max-w-sm mx-auto flex flex-col flex-1">
        {/* Leaderboard phase */}
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

        {/* Question or Results phase */}
        {gameState.phase !== 'leaderboard' && (
          <>
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <div>
                <span className="text-sm font-display font-bold text-white">
                  {gameState.currentQuestion + 1}/{gameState.totalQuestions}
                </span>
              </div>
              <span className={`text-xs font-semibold px-3 py-1 rounded-full ${
                CATEGORY_COLORS[gameState.question.category] || 'bg-white/10 text-white/60'
              }`}>
                {gameState.question.category}
              </span>
              {/* Players answered indicator */}
              <div className="flex flex-col items-end gap-1">
                <span className="text-xs font-bold tabular-nums text-white/50">
                  {answeredCount}/{totalPlayers} ready
                </span>
                <div className="flex items-center gap-1">
                  {gameState.players.map(p => (
                    <div
                      key={p.id}
                      className={`w-6 h-6 rounded-full flex items-center justify-center transition-all duration-300 ${
                        answeredPlayerIds.includes(p.id)
                          ? 'scale-100 opacity-100'
                          : 'scale-90 opacity-40'
                      }`}
                      style={{ backgroundColor: `${p.color}30` }}
                    >
                      <Avatar avatarId={p.avatar} size={16} color={p.color} />
                    </div>
                  ))}
                </div>
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

            {/* Question */}
            <div className="mb-6">
              <h2 className="font-display font-bold text-xl text-white leading-tight text-center">
                {gameState.question.question}
              </h2>
            </div>

            {/* Question phase: answer buttons */}
            {gameState.phase === 'question' && (
              <div className="grid grid-cols-1 gap-3 mb-6">
                {gameState.question.options.map((option, idx) => {
                  const colors = ANSWER_COLORS[idx];
                  const isSelected = myAnswer === idx;

                  return (
                    <button
                      key={idx}
                      onClick={() => submitAnswer(idx)}
                      disabled={hasAnswered}
                      className={`relative w-full py-4 px-5 rounded-2xl font-semibold text-left text-white text-base
                        transition-all duration-200 active:scale-[0.97] min-h-[56px]
                        ${isSelected
                          ? `${colors.bg} ring-2 ${colors.ring} scale-[1.02] shadow-lg`
                          : hasAnswered
                            ? 'bg-white/5 opacity-40 cursor-not-allowed'
                            : `${colors.bg} ${colors.hover} shadow-md`
                        }`}
                    >
                      <span className="flex items-center gap-3">
                        <span className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center flex-shrink-0 font-display font-bold text-sm">
                          {String.fromCharCode(65 + idx)}
                        </span>
                        {option}
                      </span>
                      {isSelected && (
                        <div className="absolute top-2 right-3">
                          <svg className="w-5 h-5 text-white animate-scale-in" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M20 6L9 17l-5-5" />
                          </svg>
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            )}

            {/* Waiting message */}
            {gameState.phase === 'question' && hasAnswered && (
              <div className="text-center animate-pulse mb-2">
                <p className="text-white/40 text-sm">Waiting for others... ({answeredCount}/{totalPlayers})</p>
              </div>
            )}

            {/* Emoji reactions — shown during question phase */}
            {gameState.phase === 'question' && session && (
              <ReactionButtons roomCode={params.code} playerId={session.playerId} />
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
                />
              </>
            )}
          </>
        )}
      </div>
    </main>
  );
}
