'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { getSession } from '@/lib/session';
import { saveGameResult } from '@/lib/gameHistory';
import { Player } from '@/lib/types';
import { Avatar } from '@/components/avatars/AvatarSVG';
import { CrownIcon } from '@/components/icons/GameIcons';
import { AnimatedNumber } from '@/components/AnimatedNumber';
import { ShareResults } from '@/components/ShareResults';
import { HowToPlay } from '@/components/HowToPlay';
import { Podium } from '@/components/Podium';
import { AchievementToast } from '@/components/AchievementToast';
import { useAchievementCheck } from '@/hooks/useAchievementCheck';

const ROUND_TIME = 30; // seconds

// Web Audio API sound effects
function playSound(name: string) {
  if (typeof window === 'undefined') return;
  try {
    const ctx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    const now = ctx.currentTime;

    if (name === 'word-accept') {
      // Satisfying ascending chime
      osc.type = 'sine';
      osc.frequency.setValueAtTime(523, now);
      osc.frequency.setValueAtTime(784, now + 0.1);
      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
      osc.start(now); osc.stop(now + 0.4);
    } else if (name === 'word-reject') {
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(200, now);
      osc.frequency.setValueAtTime(150, now + 0.1);
      gain.gain.setValueAtTime(0.15, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
      osc.start(now); osc.stop(now + 0.25);
    } else if (name === 'countdown') {
      osc.type = 'square';
      osc.frequency.setValueAtTime(440, now);
      gain.gain.setValueAtTime(0.12, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
      osc.start(now); osc.stop(now + 0.08);
    } else if (name === 'round-end') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(392, now);
      osc.frequency.setValueAtTime(330, now + 0.15);
      osc.frequency.setValueAtTime(262, now + 0.3);
      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
      osc.start(now); osc.stop(now + 0.5);
    }
  } catch {
    // AudioContext unavailable — silently ignore
  }
}

// Score per word length: 3=1, 4=2, 5=4, 6=8, 7+=16
function wordScore(word: string): number {
  const len = word.length;
  if (len < 3) return 0;
  if (len === 3) return 1;
  if (len === 4) return 2;
  if (len === 5) return 4;
  if (len === 6) return 8;
  return 16;
}

// Client-side letter validation
function isValidWordForLetters(word: string, letters: string[]): boolean {
  if (word.length < 3) return false;
  const available = [...letters];
  for (const ch of word.toUpperCase()) {
    const idx = available.indexOf(ch);
    if (idx === -1) return false;
    available.splice(idx, 1);
  }
  return true;
}

interface GameState {
  phase: 'typing' | 'results' | 'leaderboard';
  currentRound: number;
  totalRounds: number;
  letters: string[];
  roundStartedAt: number;
  submittedWords: Record<string, string[]>;
  scores: Record<string, number>;
  players: Player[];
}

// Timer Bar Component
function TimerBar({ startedAt }: { startedAt: number }) {
  const [remaining, setRemaining] = useState(ROUND_TIME);
  const lastCountdownSecRef = useRef(-1);

  useEffect(() => {
    const interval = setInterval(() => {
      const elapsed = (Date.now() - startedAt) / 1000;
      const rem = Math.max(0, ROUND_TIME - elapsed);
      setRemaining(rem);
      const remCeil = Math.ceil(rem);
      if (rem <= 5 && rem > 0 && remCeil !== lastCountdownSecRef.current) {
        lastCountdownSecRef.current = remCeil;
        playSound('countdown');
      }
    }, 50);
    return () => clearInterval(interval);
  }, [startedAt]);

  const pct = (remaining / ROUND_TIME) * 100;
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
        @keyframes word-shake {
          0%, 100% { transform: translateX(0); }
          20% { transform: translateX(-6px); }
          40% { transform: translateX(6px); }
          60% { transform: translateX(-4px); }
          80% { transform: translateX(4px); }
        }
        .animate-word-shake {
          animation: word-shake 0.35s ease-in-out;
        }
        @keyframes word-pop {
          0% { opacity: 0; transform: translateY(8px) scale(0.9); }
          60% { transform: translateY(-2px) scale(1.05); }
          100% { opacity: 1; transform: translateY(0) scale(1); }
        }
        .animate-word-pop {
          animation: word-pop 0.25s ease-out forwards;
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
            critical ? 'bg-red-500' : urgent ? 'bg-amber-400' : 'bg-cyan-400'
          }`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

// Score fly-up popup
function ScorePopup({ points, popKey }: { points: number; popKey: number }) {
  return (
    <div key={popKey} className="animate-points-fly text-2xl font-display font-bold text-emerald-400 pointer-events-none select-none">
      +{points}pt
    </div>
  );
}

// Letter tiles
function LetterTiles({ letters }: { letters: string[] }) {
  return (
    <div className="flex flex-wrap justify-center gap-2">
      {letters.map((letter, idx) => (
        <div
          key={idx}
          className="w-11 h-11 rounded-xl bg-cyan-500/20 border border-cyan-400/30 flex items-center justify-center font-display font-bold text-xl text-cyan-100 select-none"
        >
          {letter}
        </div>
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
  const sorted = [...gameState.players].sort((a, b) => {
    const aGain = (gameState.scores[a.id] || 0) - (previousScores[a.id] || 0);
    const bGain = (gameState.scores[b.id] || 0) - (previousScores[b.id] || 0);
    return bGain - aGain;
  });

  return (
    <div className="animate-slide-up space-y-3">
      {sorted.map(player => {
        const words = gameState.submittedWords[player.id] || [];
        const pointsGained = (gameState.scores[player.id] || 0) - (previousScores[player.id] || 0);
        const isMe = player.id === myId;

        return (
          <div
            key={player.id}
            className={`p-3 rounded-2xl transition-all ${
              isMe ? 'bg-white/8 ring-1 ring-white/10' : 'bg-white/[0.03]'
            }`}
          >
            <div className="flex items-center gap-3 mb-2">
              <div
                className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
                style={{ backgroundColor: `${player.color}20` }}
              >
                <Avatar avatarId={player.avatar} size={26} color={player.color} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm text-white truncate">{player.name}</p>
                <p className="text-xs text-white/40">{words.length} word{words.length !== 1 ? 's' : ''}</p>
              </div>
              {pointsGained > 0 && (
                <div className="animate-points-fly text-lg font-display font-bold text-emerald-400">
                  +{pointsGained}
                </div>
              )}
              <div className="text-right">
                <p className="text-sm font-bold text-white">{gameState.scores[player.id] || 0}</p>
                <p className="text-xs text-white/30">pts</p>
              </div>
            </div>
            {words.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {words.map((w, i) => (
                  <span
                    key={i}
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-white/8 text-xs font-mono font-semibold text-white/80"
                  >
                    {w}
                    <span className="text-emerald-400 font-bold">+{wordScore(w)}</span>
                  </span>
                ))}
              </div>
            )}
            {words.length === 0 && (
              <p className="text-xs text-white/25 italic">No words submitted</p>
            )}
          </div>
        );
      })}
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

      {/* Confetti */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {[...Array(12)].map((_, i) => (
          <div
            key={i}
            className="absolute w-2 h-2 rounded-full animate-confetti"
            style={{
              left: `${10 + Math.random() * 80}%`,
              top: '-5%',
              backgroundColor: ['#22d3ee', '#3b82f6', '#a855f7', '#34d399', '#facc15', '#f97316'][i % 6],
              animationDelay: `${i * 0.15}s`,
              animationDuration: `${1.5 + Math.random() * 1.5}s`,
            }}
          />
        ))}
      </div>

      <div className="space-y-3 mb-8 relative">
        {sorted.map((player, index) => {
          const isMe = player.id === myId;
          const isWinner = index === 0;

          return (
            <div
              key={player.id}
              className={`flex items-center gap-3 p-4 rounded-2xl transition-all ${
                isWinner
                  ? 'bg-gradient-to-r from-cyan-500/20 to-blue-500/20 ring-1 ring-cyan-400/30'
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
        <ShareResults gameName="Word Blitz" winnerName={sorted[0]?.name ?? ''} winnerScore={gameState.scores[sorted[0]?.id] || 0} />
        {isHost ? (
          <>
            <button
              onClick={handlePlayAgain}
              disabled={restarting}
              className="w-full py-4 px-6 rounded-2xl font-display font-semibold text-lg
                bg-gradient-to-r from-cyan-500 to-blue-500 text-white
                shadow-lg shadow-cyan-500/25
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
export default function WordBlitzPage({ params }: { params: { code: string } }) {
  const router = useRouter();
  const [session] = useState(() => typeof window !== 'undefined' ? getSession() : null);
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [inputWord, setInputWord] = useState('');
  const [inputShake, setInputShake] = useState(false);
  const [scorePopup, setScorePopup] = useState<{ points: number; key: number } | null>(null);
  const [error, setError] = useState('');
  const [roomEnded, setRoomEnded] = useState(false);
  const [previousScores, setPreviousScores] = useState<Record<string, number>>({});

  const inputRef = useRef<HTMLInputElement>(null);
  const prevRoundRef = useRef(-1);
  const timerExpiredRef = useRef(false);
  const autoAdvanceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const scorePopupKeyRef = useRef(0);
  const roundSoundPlayedRef = useRef(false);

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
        // Track score snapshot when round ends
        if (prev && prev.phase === 'typing' && data.phase === 'results') {
          setPreviousScores(prev.scores);
          if (!roundSoundPlayedRef.current) {
            roundSoundPlayedRef.current = true;
            playSound('round-end');
          }
        }
        // Reset on new round
        if (data.phase === 'typing' && data.currentRound !== prevRoundRef.current) {
          prevRoundRef.current = data.currentRound;
          timerExpiredRef.current = false;
          roundSoundPlayedRef.current = false;
          setInputWord('');
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
    if (!gameState || gameState.phase !== 'typing') return;

    const elapsed = Date.now() - gameState.roundStartedAt;
    const remaining = ROUND_TIME * 1000 - elapsed;

    if (remaining <= 0 && !timerExpiredRef.current) {
      timerExpiredRef.current = true;
      fetch(`/api/rooms/${params.code}/advance-word-blitz`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'force-results' }),
      });
      return;
    }

    const timer = setTimeout(() => {
      if (!timerExpiredRef.current) {
        timerExpiredRef.current = true;
        fetch(`/api/rooms/${params.code}/advance-word-blitz`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'force-results' }),
        });
      }
    }, remaining);

    return () => clearTimeout(timer);
  }, [gameState?.phase, gameState?.currentRound, gameState?.roundStartedAt, params.code]);

  // Auto-advance from results after 5 seconds
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
      fetch(`/api/rooms/${params.code}/advance-word-blitz`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'advance' }),
      });
    }, 5000);

    return () => {
      if (autoAdvanceTimerRef.current) {
        clearTimeout(autoAdvanceTimerRef.current);
        autoAdvanceTimerRef.current = null;
      }
    };
  }, [gameState?.phase, gameState?.currentRound, params.code]);

  useEffect(() => {
    if (gameState?.phase === 'leaderboard' && session?.playerId) {
      saveGameResult({
        gameType: 'word-blitz',
        roomCode: params.code,
        score: gameState.scores[session.playerId] ?? 0,
        date: new Date().toISOString(),
      });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gameState?.phase]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!session || !gameState || gameState.phase !== 'typing') return;

    const word = inputWord.trim().toUpperCase();
    if (word.length < 3) {
      triggerShake();
      playSound('word-reject');
      return;
    }

    // Client-side validation
    if (!isValidWordForLetters(word, gameState.letters)) {
      triggerShake();
      playSound('word-reject');
      return;
    }

    // Duplicate check against server state
    const myWords = gameState.submittedWords[session.playerId] || [];
    if (myWords.includes(word)) {
      triggerShake();
      playSound('word-reject');
      return;
    }

    // Submit to server
    const res = await fetch(`/api/rooms/${params.code}/word-blitz-word`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        playerId: session.playerId,
        word,
        round: gameState.currentRound,
      }),
    });

    if (res.ok) {
      const data = await res.json();
      setInputWord('');
      playSound('word-accept');
      // Score popup
      scorePopupKeyRef.current++;
      setScorePopup({ points: data.pointsGained, key: scorePopupKeyRef.current });
      setTimeout(() => setScorePopup(null), 900);
      // Focus input for fast typing
      inputRef.current?.focus();
    } else {
      triggerShake();
      playSound('word-reject');
    }
  }

  function triggerShake() {
    setInputShake(true);
    setTimeout(() => setInputShake(false), 350);
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

  const myId = session?.playerId || '';
  const isHost = gameState.players.find(p => p.id === myId)?.isHost ?? false;
  const myWords = gameState.submittedWords[myId] || [];

  return (
    <main className="min-h-[100dvh] flex flex-col px-6 py-6 relative overflow-hidden">
      {/* Background */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-32 -left-32 w-80 h-80 bg-cyan-600/15 rounded-full blur-3xl" />
        <div className="absolute -bottom-32 -right-32 w-64 h-64 bg-blue-600/10 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 w-full max-w-sm mx-auto flex flex-col flex-1">

        {/* Leaderboard phase */}
        {gameState.phase === 'leaderboard' && (
          <LeaderboardView
            gameState={gameState}
            myId={myId}
            isHost={isHost}
            roomCode={params.code}
            router={router}
            session={session}
          />
        )}

        {/* Typing or Results phase */}
        {gameState.phase !== 'leaderboard' && (
          <>
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm font-display font-bold text-white">
                Round {gameState.currentRound + 1}/{gameState.totalRounds}
              </span>
              <span className="text-xs font-semibold px-3 py-1 rounded-full bg-cyan-500/20 text-cyan-300">
                Word Blitz
              </span>
              {/* Player word counts */}
              <div className="flex items-center gap-1.5">
                {gameState.players.map(p => {
                  const count = (gameState.submittedWords[p.id] || []).length;
                  return (
                    <div key={p.id} className="flex flex-col items-center gap-0.5">
                      <div
                        className="w-7 h-7 rounded-full flex items-center justify-center"
                        style={{ backgroundColor: `${p.color}30` }}
                      >
                        <Avatar avatarId={p.avatar} size={18} color={p.color} />
                      </div>
                      <span className="text-[10px] font-bold tabular-nums text-white/50">{count}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Timer */}
            {gameState.phase === 'typing' && (
              <div className="mb-5">
                <TimerBar startedAt={gameState.roundStartedAt} />
              </div>
            )}

            {/* Letter tiles */}
            <div className="mb-5">
              <p className="text-xs text-white/40 text-center mb-3 uppercase tracking-widest font-semibold">
                Your letters
              </p>
              <LetterTiles letters={gameState.letters} />
            </div>

            {/* Typing phase: input + word list */}
            {gameState.phase === 'typing' && (
              <>
                {/* Score popup positioned above input */}
                <div className="h-8 flex items-center justify-center mb-1">
                  {scorePopup && (
                    <ScorePopup points={scorePopup.points} popKey={scorePopup.key} />
                  )}
                </div>

                {/* Word input */}
                <form onSubmit={handleSubmit} className="flex gap-2 mb-4">
                  <input
                    ref={inputRef}
                    type="text"
                    value={inputWord}
                    onChange={e => setInputWord(e.target.value.toUpperCase().replace(/[^A-Z]/g, ''))}
                    placeholder="Type a word..."
                    maxLength={7}
                    autoComplete="off"
                    autoCapitalize="characters"
                    autoFocus
                    className={`flex-1 px-4 py-3 rounded-xl bg-white/10 text-white placeholder-white/30 font-display text-lg font-bold tracking-widest border outline-none transition-colors duration-150 ${
                      inputShake
                        ? 'border-red-400 animate-word-shake'
                        : 'border-white/10 focus:border-cyan-400'
                    }`}
                  />
                  <button
                    type="submit"
                    className="px-4 py-3 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-white font-bold text-lg transition-colors active:scale-95"
                  >
                    ✓
                  </button>
                </form>

                {/* Hint: scoring */}
                <p className="text-center text-[11px] text-white/25 mb-3">
                  3=1pt · 4=2pt · 5=4pt · 6=8pt · 7+=16pt — Longer words + faster = more points
                </p>

                {/* My submitted words */}
                {myWords.length > 0 && (
                  <div className="flex-1 overflow-y-auto">
                    <p className="text-xs text-white/40 mb-2 font-semibold uppercase tracking-widest">
                      Your words ({myWords.length})
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {myWords.map((w, i) => (
                        <span
                          key={i}
                          className="animate-word-pop inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-cyan-500/15 border border-cyan-500/20 text-sm font-mono font-semibold text-cyan-100"
                        >
                          {w}
                          <span className="text-emerald-400 font-bold text-xs">+{wordScore(w)}</span>
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {myWords.length === 0 && (
                  <p className="text-center text-white/20 text-sm italic mt-2">
                    Start typing words using the letters above
                  </p>
                )}
              </>
            )}

            {/* Results phase */}
            {gameState.phase === 'results' && (
              <div>
                <div className="text-center mb-5">
                  <p className="font-display font-bold text-xl text-white">Round {gameState.currentRound + 1} Results</p>
                  <p className="text-white/40 text-sm mt-1">Next round starting soon...</p>
                </div>
                <ResultsView
                  gameState={gameState}
                  myId={myId}
                  previousScores={previousScores}
                />
              </div>
            )}
          </>
        )}
      </div>
    </main>
  );
}
