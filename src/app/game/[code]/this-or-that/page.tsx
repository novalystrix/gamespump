'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { trackPageView, trackGameEnd } from '@/lib/analytics';
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

function playSound(name: string) {
  if (typeof window === 'undefined') return;
  try {
    const ctx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    const now = ctx.currentTime;

    if (name === 'vote') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(500, now);
      gain.gain.setValueAtTime(0.15, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.06);
      osc.start(now); osc.stop(now + 0.06);
    } else if (name === 'reveal') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(330, now);
      osc.frequency.linearRampToValueAtTime(440, now + 0.3);
      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
      osc.start(now); osc.stop(now + 0.3);
    } else if (name === 'majority') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(523, now);
      osc.frequency.setValueAtTime(659, now + 0.15);
      gain.gain.setValueAtTime(0.25, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
      osc.start(now); osc.stop(now + 0.3);
    } else if (name === 'minority') {
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(200, now);
      osc.frequency.linearRampToValueAtTime(150, now + 0.2);
      gain.gain.setValueAtTime(0.15, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
      osc.start(now); osc.stop(now + 0.2);
    } else if (name === 'countdown') {
      osc.type = 'square';
      osc.frequency.setValueAtTime(440, now);
      gain.gain.setValueAtTime(0.15, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
      osc.start(now); osc.stop(now + 0.08);
    } else if (name === 'win') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(523, now);
      osc.frequency.setValueAtTime(659, now + 0.15);
      osc.frequency.setValueAtTime(784, now + 0.3);
      osc.frequency.setValueAtTime(1047, now + 0.45);
      gain.gain.setValueAtTime(0.3, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.6);
      osc.start(now); osc.stop(now + 0.6);
    }
  } catch {
    // AudioContext blocked or unavailable — silently ignore
  }
}

const VOTE_TIME = 10; // seconds

const CATEGORY_COLORS: Record<string, string> = {
  'Food': 'bg-red-500/20 text-red-300',
  'Life': 'bg-emerald-500/20 text-emerald-300',
  'Fun': 'bg-purple-500/20 text-purple-300',
  'Entertainment': 'bg-pink-500/20 text-pink-300',
  'Hypothetical': 'bg-amber-500/20 text-amber-300',
  'Animals': 'bg-cyan-500/20 text-cyan-300',
};

interface ThisOrThatState {
  gameType: 'this-or-that';
  phase: 'voting' | 'results' | 'leaderboard';
  currentRound: number;
  totalRounds: number;
  round: {
    question: string;
    optionA: string;
    optionB: string;
    category: string;
  };
  answers: string[] | Record<string, 'A' | 'B'>;
  scores: Record<string, number>;
  roundStartedAt: number;
  players: Player[];
}

function TimerBar({ startedAt }: { startedAt: number }) {
  const [remaining, setRemaining] = useState(VOTE_TIME);
  const lastCountdownTickRef = useRef(-1);

  useEffect(() => {
    trackPageView('game-this-or-that');
    const interval = setInterval(() => {
      const elapsed = (Date.now() - startedAt) / 1000;
      const next = Math.max(0, VOTE_TIME - elapsed);
      setRemaining(next);
      const secs = Math.ceil(next);
      if (next > 0 && next <= 3 && secs !== lastCountdownTickRef.current) {
        lastCountdownTickRef.current = secs;
        playSound('countdown');
      }
    }, 50);
    return () => clearInterval(interval);
  }, [startedAt]);

  const pct = (remaining / VOTE_TIME) * 100;
  const urgent = remaining <= 3;

  return (
    <div className="w-full mb-4">
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
      <div className="flex items-center justify-between mb-1">
        <span className={`text-sm font-bold tabular-nums transition-colors duration-300 ${
          urgent ? 'text-red-400 animate-timer-pulse' : 'text-white/60'
        }`}>
          {Math.ceil(remaining)}s
        </span>
      </div>
      <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-100 ease-linear ${
            urgent ? 'bg-red-500' : 'bg-purple-400'
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
  myVote,
}: {
  gameState: ThisOrThatState;
  myId: string;
  previousScores: Record<string, number>;
  myVote?: 'A' | 'B' | null;
}) {
  const answers = gameState.answers as Record<string, 'A' | 'B'>;
  const playersA = gameState.players.filter(p => answers[p.id] === 'A');
  const playersB = gameState.players.filter(p => answers[p.id] === 'B');
  const totalVotes = playersA.length + playersB.length;
  const pctA = totalVotes > 0 ? (playersA.length / totalVotes) * 100 : 50;
  const pctB = totalVotes > 0 ? (playersB.length / totalVotes) * 100 : 50;
  const majorityIsA = playersA.length >= playersB.length;

  return (
    <div className="animate-slide-up flex-1 flex flex-col">
      <style>{`
        @keyframes option-reveal {
          0%   { transform: scale(0.88); opacity: 0.6; }
          55%  { transform: scale(1.1);  opacity: 1; filter: brightness(1.4); }
          100% { transform: scale(1);   opacity: 1; filter: brightness(1); }
        }
        .animate-option-reveal {
          animation: option-reveal 0.55s ease-out forwards;
          display: inline-block;
        }
        @keyframes winner-bar-glow {
          0%   { box-shadow: none; }
          50%  { box-shadow: 0 0 18px 4px rgba(59,130,246,0.55); }
          100% { box-shadow: 0 0 8px 2px rgba(59,130,246,0.2); }
        }
        @keyframes winner-bar-glow-orange {
          0%   { box-shadow: none; }
          50%  { box-shadow: 0 0 18px 4px rgba(249,115,22,0.55); }
          100% { box-shadow: 0 0 8px 2px rgba(249,115,22,0.2); }
        }
        .animate-bar-glow-blue   { animation: winner-bar-glow        0.7s ease-out 0.1s forwards; }
        .animate-bar-glow-orange { animation: winner-bar-glow-orange  0.7s ease-out 0.1s forwards; }
      `}</style>

      {/* Question */}
      <div className="text-center mb-4">
        <span className={`text-xs font-semibold px-3 py-1 rounded-full ${
          CATEGORY_COLORS[gameState.round.category] || 'bg-white/10 text-white/60'
        }`}>
          {gameState.round.category}
        </span>
        <h2 className="font-display font-bold text-lg text-white mt-2">{gameState.round.question}</h2>
      </div>

      {/* My choice feedback */}
      {myVote && (
        <div className="flex gap-3 mb-4">
          <div className={`flex-1 py-3 px-4 rounded-xl font-display font-bold text-sm text-center text-white truncate
            ${majorityIsA ? 'animate-correct-glow' : ''}
            ${myVote === 'A'
              ? (majorityIsA ? 'bg-blue-500/20 ring-4 ring-emerald-500' : 'bg-blue-500/20 ring-4 ring-red-500')
              : 'bg-white/5 opacity-25'
            }`}>
            {gameState.round.optionA}
          </div>
          <div className={`flex-1 py-3 px-4 rounded-xl font-display font-bold text-sm text-center text-white truncate
            ${!majorityIsA ? 'animate-correct-glow' : ''}
            ${myVote === 'B'
              ? (!majorityIsA ? 'bg-orange-500/20 ring-4 ring-emerald-500' : 'bg-orange-500/20 ring-4 ring-red-500')
              : 'bg-white/5 opacity-25'
            }`}>
            {gameState.round.optionB}
          </div>
        </div>
      )}

      {/* Results bar */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-2">
          <span className={`text-sm font-bold ${majorityIsA ? 'text-blue-400 animate-option-reveal' : 'text-white/40'}`}>
            {gameState.round.optionA}
          </span>
          <span className="flex-1" />
          <span className={`text-sm font-bold ${!majorityIsA ? 'text-orange-400 animate-option-reveal' : 'text-white/40'}`}>
            {gameState.round.optionB}
          </span>
        </div>
        <div className="w-full h-10 bg-white/5 rounded-xl overflow-hidden flex">
          <div
            className={`h-full bg-gradient-to-r from-blue-500 to-blue-400 flex items-center justify-center transition-all duration-700 ${majorityIsA ? 'animate-bar-glow-blue' : ''}`}
            style={{ width: `${pctA}%` }}
          >
            {playersA.length > 0 && (
              <span className="text-white font-bold text-sm">{Math.round(pctA)}%</span>
            )}
          </div>
          <div
            className={`h-full bg-gradient-to-r from-orange-400 to-orange-500 flex items-center justify-center transition-all duration-700 ${!majorityIsA ? 'animate-bar-glow-orange' : ''}`}
            style={{ width: `${pctB}%` }}
          >
            {playersB.length > 0 && (
              <span className="text-white font-bold text-sm">{Math.round(pctB)}%</span>
            )}
          </div>
        </div>
      </div>

      {/* Player avatars on each side */}
      <div className="flex gap-4 mb-6">
        <div className="flex-1">
          <div className="flex flex-wrap gap-2 justify-start">
            {playersA.map(p => (
              <div key={p.id} className="flex items-center gap-1.5 bg-blue-500/10 rounded-lg px-2 py-1">
                <div className="w-6 h-6 rounded-full flex items-center justify-center" style={{ backgroundColor: `${p.color}20` }}>
                  <Avatar avatarId={p.avatar} size={16} color={p.color} />
                </div>
                <span className="text-xs text-white/70">{p.name}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="flex-1">
          <div className="flex flex-wrap gap-2 justify-end">
            {playersB.map(p => (
              <div key={p.id} className="flex items-center gap-1.5 bg-orange-500/10 rounded-lg px-2 py-1">
                <span className="text-xs text-white/70">{p.name}</span>
                <div className="w-6 h-6 rounded-full flex items-center justify-center" style={{ backgroundColor: `${p.color}20` }}>
                  <Avatar avatarId={p.avatar} size={16} color={p.color} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Points earned */}
      <div className="space-y-2">
        {gameState.players.map(player => {
          const pointsGained = (gameState.scores[player.id] || 0) - (previousScores[player.id] || 0);
          const voted = answers[player.id];
          const isMe = player.id === myId;

          return (
            <div
              key={player.id}
              className={`flex items-center gap-3 p-3 rounded-xl ${
                isMe ? 'bg-white/8 ring-1 ring-white/10' : 'bg-white/[0.03]'
              }`}
            >
              <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${player.color}20` }}>
                <Avatar avatarId={player.avatar} size={20} color={player.color} />
              </div>
              <span className="flex-1 text-sm font-semibold text-white truncate">{player.name}</span>
              {!voted && <span className="text-xs text-white/30">No vote</span>}
              {pointsGained > 0 && (
                <span className="text-emerald-400 font-bold text-sm animate-points-fly">+{pointsGained}</span>
              )}
              <span className="text-sm font-bold text-white">{gameState.scores[player.id] || 0}</span>
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
  gameState: ThisOrThatState;
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
        <ShareResults gameName="This or That" winnerName={sorted[0]?.name ?? ''} winnerScore={gameState.scores[sorted[0]?.id] || 0} />
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

export default function ThisOrThatPage({ params }: { params: { code: string } }) {
  const router = useRouter();
  const [session] = useState(() => typeof window !== 'undefined' ? getSession() : null);
  const [gameState, setGameState] = useState<ThisOrThatState | null>(null);
  const [myVote, setMyVote] = useState<'A' | 'B' | null>(null);
  const [shaking, setShaking] = useState(false);
  const [error, setError] = useState('');
  const [roomEnded, setRoomEnded] = useState(false);
  const [previousScores, setPreviousScores] = useState<Record<string, number>>({});
  const prevRoundRef = useRef<number>(-1);
  const autoAdvanceRef = useRef<NodeJS.Timeout | null>(null);
  const timerExpiredRef = useRef(false);
  const prevPhaseRef = useRef<string | null>(null);

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
      if (data.gameType !== 'this-or-that') {
        router.push(`/room/${params.code}`);
        return;
      }

      setGameState(prev => {
        if (prev && prev.phase === 'voting' && data.phase === 'results') {
          setPreviousScores(prev.scores);
        }
        if (data.phase === 'voting' && data.currentRound !== prevRoundRef.current) {
          setMyVote(null);
          timerExpiredRef.current = false;
          prevRoundRef.current = data.currentRound;
        }
        return data as ThisOrThatState;
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
    if (!gameState || gameState.phase !== 'voting') return;

    const elapsed = Date.now() - gameState.roundStartedAt;
    const remaining = VOTE_TIME * 1000 - elapsed;

    if (remaining <= 0 && !timerExpiredRef.current) {
      timerExpiredRef.current = true;
      fetch(`/api/rooms/${params.code}/advance-this-or-that`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'force-results' }),
      });
      return;
    }

    const timer = setTimeout(() => {
      if (!timerExpiredRef.current) {
        timerExpiredRef.current = true;
        fetch(`/api/rooms/${params.code}/advance-this-or-that`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'force-results' }),
        });
      }
    }, remaining);

    return () => clearTimeout(timer);
  }, [gameState?.phase, gameState?.currentRound, gameState?.roundStartedAt, params.code]);

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
      fetch(`/api/rooms/${params.code}/advance-this-or-that`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'advance' }),
      });
    }, 4000);

    return () => {
      if (autoAdvanceRef.current) {
        clearTimeout(autoAdvanceRef.current);
        autoAdvanceRef.current = null;
      }
    };
  }, [gameState?.phase, gameState?.currentRound, params.code]);

  useEffect(() => {
    if (gameState?.phase === 'results' && myVote !== null) {
      const answers = gameState.answers as Record<string, 'A' | 'B'>;
      const countA = gameState.players.filter(p => answers[p.id] === 'A').length;
      const countB = gameState.players.filter(p => answers[p.id] === 'B').length;
      const majorityIsA = countA >= countB;
      const inMajority = (myVote === 'A' && majorityIsA) || (myVote === 'B' && !majorityIsA);
      if (!inMajority) {
        setShaking(true);
        setTimeout(() => setShaking(false), 300);
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gameState?.phase, gameState?.currentRound]);

  useEffect(() => {
    if (!gameState) return;
    if (gameState.phase === 'results' && prevPhaseRef.current === 'voting') {
      playSound('reveal');
      if (myVote !== null) {
        const answers = gameState.answers as Record<string, 'A' | 'B'>;
        const countA = gameState.players.filter(p => answers[p.id] === 'A').length;
        const countB = gameState.players.filter(p => answers[p.id] === 'B').length;
        const majorityIsA = countA >= countB;
        const inMajority = (myVote === 'A' && majorityIsA) || (myVote === 'B' && !majorityIsA);
        setTimeout(() => playSound(inMajority ? 'majority' : 'minority'), 350);
      }
    } else if (gameState.phase === 'leaderboard' && prevPhaseRef.current !== 'leaderboard') {
      playSound('win');
    }
    prevPhaseRef.current = gameState.phase;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gameState?.phase]);

  useEffect(() => {
    if (gameState?.phase === 'leaderboard' && session?.playerId) {
      saveGameResult({
        gameType: 'this-or-that',
        roomCode: params.code,
        score: gameState.scores[session.playerId] ?? 0,
        date: new Date().toISOString(),
      });
      trackGameEnd('this-or-that', gameState.scores[session.playerId] ?? 0, params.code);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gameState?.phase]);

  async function submitVote(choice: 'A' | 'B') {
    if (!session || myVote !== null || !gameState || gameState.phase !== 'voting') return;
    setMyVote(choice);
    playSound('vote');

    await fetch(`/api/rooms/${params.code}/vote`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ playerId: session.playerId, choice }),
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
          <div className="w-10 h-10 border-2 border-purple-400 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-white/50 text-sm font-body">Loading game...</p>
        </div>
      </main>
    );
  }

  const votedPlayerIds = Array.isArray(gameState.answers)
    ? gameState.answers as string[]
    : Object.keys(gameState.answers);
  const hasVoted = myVote !== null;
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
        <HowToPlay gameId="this-or-that" />
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
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-display font-bold text-white">
                {gameState.currentRound + 1}/{gameState.totalRounds}
              </span>
              <span className={`text-xs font-semibold px-3 py-1 rounded-full ${
                CATEGORY_COLORS[gameState.round.category] || 'bg-white/10 text-white/60'
              }`}>
                {gameState.round.category}
              </span>
              {/* Players voted indicator */}
              <div className="flex items-center gap-1">
                {gameState.players.map(p => (
                  <div
                    key={p.id}
                    className={`w-6 h-6 rounded-full flex items-center justify-center transition-all duration-300 ${
                      votedPlayerIds.includes(p.id) ? 'scale-100 opacity-100' : 'scale-90 opacity-40'
                    }`}
                    style={{ backgroundColor: `${p.color}30` }}
                  >
                    <Avatar avatarId={p.avatar} size={16} color={p.color} />
                  </div>
                ))}
              </div>
            </div>

            {/* Timer */}
            {gameState.phase === 'voting' && (
              <TimerBar startedAt={gameState.roundStartedAt} />
            )}

            {/* Voting phase */}
            {gameState.phase === 'voting' && (
              <>
                {/* Question */}
                <div className="text-center mb-6">
                  <h2 className="font-display font-bold text-xl text-white">{gameState.round.question}</h2>
                </div>

                {/* Two big buttons */}
                <div className="flex-1 flex flex-col gap-4 mb-6">
                  <button
                    onClick={() => submitVote('A')}
                    disabled={hasVoted}
                    className={`flex-1 rounded-2xl font-display font-bold text-2xl text-white
                      transition-all duration-200 active:scale-[0.97] min-h-[120px]
                      flex items-center justify-center p-6
                      ${myVote === 'A'
                        ? 'bg-blue-500 ring-4 ring-blue-300 scale-[1.02] shadow-lg shadow-blue-500/30 animate-pulse'
                        : hasVoted
                          ? 'bg-blue-500/20 opacity-40'
                          : 'bg-gradient-to-br from-blue-500 to-blue-600 hover:from-blue-400 hover:to-blue-500 shadow-lg shadow-blue-500/20'
                      }`}
                  >
                    {gameState.round.optionA}
                  </button>

                  <div className="text-center">
                    <span className="text-white/20 font-display font-bold text-sm">OR</span>
                  </div>

                  <button
                    onClick={() => submitVote('B')}
                    disabled={hasVoted}
                    className={`flex-1 rounded-2xl font-display font-bold text-2xl text-white
                      transition-all duration-200 active:scale-[0.97] min-h-[120px]
                      flex items-center justify-center p-6
                      ${myVote === 'B'
                        ? 'bg-orange-500 ring-4 ring-orange-300 scale-[1.02] shadow-lg shadow-orange-500/30 animate-pulse'
                        : hasVoted
                          ? 'bg-orange-500/20 opacity-40'
                          : 'bg-gradient-to-br from-orange-500 to-orange-600 hover:from-orange-400 hover:to-orange-500 shadow-lg shadow-orange-500/20'
                      }`}
                  >
                    {gameState.round.optionB}
                  </button>
                </div>

                {hasVoted && (
                  <div className="text-center">
                    <p className="text-white/40 text-sm animate-pulse">
                      Waiting for others... ({votedPlayerIds.length}/{gameState.players.length})
                    </p>
                  </div>
                )}
              </>
            )}

            {/* Results phase */}
            {gameState.phase === 'results' && (
              <ResultsView
                gameState={gameState}
                myId={session?.playerId || ''}
                previousScores={previousScores}
                myVote={myVote}
              />
            )}
          </>
        )}
      </div>
    </main>
  );
}
