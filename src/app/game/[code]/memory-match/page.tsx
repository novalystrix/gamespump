'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { getSession } from '@/lib/session';
import { saveGameResult } from '@/lib/gameHistory';
import { Player } from '@/lib/types';
import { Avatar } from '@/components/avatars/AvatarSVG';
import { CrownIcon } from '@/components/icons/GameIcons';
import { ShareResults } from '@/components/ShareResults';

const SYMBOL_SVGS: Record<string, (color: string) => React.ReactNode> = {
  star: (color) => (
    <svg viewBox="0 0 24 24" fill={color} className="w-8 h-8">
      <path d="M12 2l2.4 7.2L22 12l-7.6 2.8L12 22l-2.4-7.2L2 12l7.6-2.8L12 2z" />
    </svg>
  ),
  heart: (color) => (
    <svg viewBox="0 0 24 24" fill={color} className="w-8 h-8">
      <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
    </svg>
  ),
  diamond: (color) => (
    <svg viewBox="0 0 24 24" fill={color} className="w-8 h-8">
      <path d="M12 2L2 12l10 10 10-10L12 2z" />
    </svg>
  ),
  circle: (color) => (
    <svg viewBox="0 0 24 24" fill={color} className="w-8 h-8">
      <circle cx="12" cy="12" r="10" />
    </svg>
  ),
  triangle: (color) => (
    <svg viewBox="0 0 24 24" fill={color} className="w-8 h-8">
      <path d="M12 3L2 21h20L12 3z" />
    </svg>
  ),
  square: (color) => (
    <svg viewBox="0 0 24 24" fill={color} className="w-8 h-8">
      <rect x="3" y="3" width="18" height="18" rx="2" />
    </svg>
  ),
  moon: (color) => (
    <svg viewBox="0 0 24 24" fill={color} className="w-8 h-8">
      <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" />
    </svg>
  ),
  sun: (color) => (
    <svg viewBox="0 0 24 24" fill={color} className="w-8 h-8">
      <circle cx="12" cy="12" r="5" />
      <line x1="12" y1="1" x2="12" y2="4" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <line x1="12" y1="20" x2="12" y2="23" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <line x1="4.22" y1="4.22" x2="6.34" y2="6.34" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <line x1="17.66" y1="17.66" x2="19.78" y2="19.78" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <line x1="1" y1="12" x2="4" y2="12" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <line x1="20" y1="12" x2="23" y2="12" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <line x1="4.22" y1="19.78" x2="6.34" y2="17.66" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <line x1="17.66" y1="6.34" x2="19.78" y2="4.22" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </svg>
  ),
};

const SYMBOL_COLORS: Record<string, string> = {
  star: '#facc15',
  heart: '#f43f5e',
  diamond: '#22d3ee',
  circle: '#a855f7',
  triangle: '#34d399',
  square: '#f97316',
  moon: '#6366f1',
  sun: '#fbbf24',
};

interface CardData {
  id: number;
  symbol: string | null;
  flipped: boolean;
  matched: boolean;
  matchedBy: string | null;
}

interface MemoryGameState {
  gameType: 'memory-match';
  board: CardData[];
  currentPlayerId: string;
  turnPhase: 'first-pick' | 'second-pick' | 'showing-result';
  firstPick: number | null;
  secondPick: number | null;
  scores: Record<string, number>;
  phase: 'playing' | 'leaderboard';
  showingResultUntil: number | null;
  players: Player[];
}

function MemoryCard({
  card,
  index,
  onClick,
  disabled,
  players,
  flashState,
}: {
  card: CardData;
  index: number;
  onClick: () => void;
  disabled: boolean;
  players: Player[];
  flashState?: 'match' | 'nomatch' | null;
}) {
  const isRevealed = card.flipped || card.matched;
  const matchedPlayer = card.matchedBy ? players.find(p => p.id === card.matchedBy) : null;

  return (
    <button
      onClick={onClick}
      disabled={disabled || isRevealed}
      className="aspect-square relative"
      style={{ perspective: '600px' }}
    >
      <div
        className={`w-full h-full transition-transform duration-500 relative`}
        style={{
          transformStyle: 'preserve-3d',
          transform: isRevealed ? 'rotateY(180deg)' : 'rotateY(0deg)',
        }}
      >
        {/* Back of card (face down) */}
        <div
          className={`absolute inset-0 rounded-xl flex items-center justify-center
            ${disabled && !isRevealed ? 'bg-white/5' : 'bg-gradient-to-br from-purple-500/40 to-fuchsia-500/40 active:scale-95'}
            border border-white/10 transition-all`}
          style={{ backfaceVisibility: 'hidden' }}
        >
          <svg viewBox="0 0 24 24" className="w-6 h-6 text-white/20">
            <path fill="currentColor" d="M12 2l2.4 7.2L22 12l-7.6 2.8L12 22l-2.4-7.2L2 12l7.6-2.8L12 2z" />
          </svg>
        </div>

        {/* Front of card (face up) */}
        <div
          className={`absolute inset-0 rounded-xl flex items-center justify-center bg-white/10 border-2 transition-all
            ${card.matched ? 'animate-pulse-once' : ''}
            ${flashState === 'match' ? 'ring-4 ring-emerald-500/50 animate-match-flash' : ''}
            ${flashState === 'nomatch' ? 'ring-4 ring-red-500/50 animate-nomatch-flash' : ''}`}
          style={{
            backfaceVisibility: 'hidden',
            transform: 'rotateY(180deg)',
            borderColor: matchedPlayer ? matchedPlayer.color : 'rgba(255,255,255,0.2)',
            boxShadow: matchedPlayer ? `0 0 12px ${matchedPlayer.color}40` : 'none',
          }}
        >
          {card.symbol && SYMBOL_SVGS[card.symbol] ? (
            SYMBOL_SVGS[card.symbol](SYMBOL_COLORS[card.symbol] || '#fff')
          ) : (
            <div className="w-8 h-8 bg-white/20 rounded" />
          )}
        </div>
      </div>
    </button>
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
  gameState: MemoryGameState;
  myId: string;
  isHost: boolean;
  roomCode: string;
  router: ReturnType<typeof useRouter>;
  session: { playerId: string } | null;
}) {
  const [restarting, setRestarting] = useState(false);

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
                <p className="text-xl font-display font-bold text-white">{gameState.scores[player.id] || 0}</p>
                <p className="text-xs text-white/30">pairs</p>
              </div>
            </div>
          );
        })}
      </div>

      <div className="space-y-3">
        <ShareResults gameName="Memory Match" winnerName={sorted[0]?.name ?? ''} winnerScore={gameState.scores[sorted[0]?.id] || 0} />
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
    </div>
  );
}

export default function MemoryMatchPage({ params }: { params: { code: string } }) {
  const router = useRouter();
  const [session] = useState(() => typeof window !== 'undefined' ? getSession() : null);
  const [gameState, setGameState] = useState<MemoryGameState | null>(null);
  const [error, setError] = useState('');
  const autoAdvanceRef = useRef<NodeJS.Timeout | null>(null);

  const fetchGameState = useCallback(async () => {
    try {
      const res = await fetch(`/api/rooms/${params.code}/game-state`);
      if (!res.ok) {
        const data = await res.json();
        if (data.error === 'No active game') {
          router.push(`/room/${params.code}`);
          return;
        }
        setError('Failed to load game');
        return;
      }
      const data = await res.json();
      if (data.gameType !== 'memory-match') {
        router.push(`/room/${params.code}`);
        return;
      }
      setGameState(data as MemoryGameState);
    } catch {
      // Silently retry
    }
  }, [params.code, router]);

  useEffect(() => {
    fetchGameState();
    const interval = setInterval(fetchGameState, 1000);
    return () => clearInterval(interval);
  }, [fetchGameState]);

  // Auto-advance after showing result
  useEffect(() => {
    if (!gameState || gameState.turnPhase !== 'showing-result' || !gameState.showingResultUntil) {
      if (autoAdvanceRef.current) {
        clearTimeout(autoAdvanceRef.current);
        autoAdvanceRef.current = null;
      }
      return;
    }

    const remaining = gameState.showingResultUntil - Date.now();
    if (autoAdvanceRef.current) return;

    autoAdvanceRef.current = setTimeout(async () => {
      autoAdvanceRef.current = null;
      await fetch(`/api/rooms/${params.code}/advance-memory`, { method: 'POST' });
    }, Math.max(0, remaining));

    return () => {
      if (autoAdvanceRef.current) {
        clearTimeout(autoAdvanceRef.current);
        autoAdvanceRef.current = null;
      }
    };
  }, [gameState?.turnPhase, gameState?.showingResultUntil, params.code]);

  useEffect(() => {
    if (gameState?.phase === 'leaderboard' && session?.playerId) {
      saveGameResult({
        gameType: 'memory-match',
        roomCode: params.code,
        score: gameState.scores[session.playerId] ?? 0,
        date: new Date().toISOString(),
      });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gameState?.phase]);

  async function handleFlip(cardIndex: number) {
    if (!session || !gameState) return;
    if (gameState.currentPlayerId !== session.playerId) return;
    if (gameState.turnPhase === 'showing-result') return;

    await fetch(`/api/rooms/${params.code}/flip`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ playerId: session.playerId, cardIndex }),
    });
    fetchGameState();
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
        <div className="w-8 h-8 border-2 border-purple-400 border-t-transparent rounded-full animate-spin" />
      </main>
    );
  }

  const isMyTurn = gameState.currentPlayerId === session?.playerId;
  const currentPlayer = gameState.players.find(p => p.id === gameState.currentPlayerId);
  const isHost = gameState.players.find(p => p.id === session?.playerId)?.isHost ?? false;

  return (
    <main className="min-h-[100dvh] flex flex-col px-4 py-6 relative overflow-hidden">
      {/* Background */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-32 -left-32 w-80 h-80 bg-purple-600/15 rounded-full blur-3xl" />
        <div className="absolute -bottom-32 -right-32 w-64 h-64 bg-fuchsia-600/10 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 w-full max-w-sm mx-auto flex flex-col flex-1">
        {gameState.phase === 'leaderboard' ? (
          <LeaderboardView
            gameState={gameState}
            myId={session?.playerId || ''}
            isHost={isHost}
            roomCode={params.code}
            router={router}
            session={session}
          />
        ) : (
          <>
            {/* Turn indicator */}
            <div className="text-center mb-4">
              <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl ${
                isMyTurn ? 'bg-emerald-500/20 ring-1 ring-emerald-400/30' : 'bg-white/5'
              }`}>
                {currentPlayer && (
                  <div className="w-6 h-6 rounded-full flex items-center justify-center" style={{ backgroundColor: `${currentPlayer.color}30` }}>
                    <Avatar avatarId={currentPlayer.avatar} size={16} color={currentPlayer.color} />
                  </div>
                )}
                <span className={`font-display font-bold text-sm ${isMyTurn ? 'text-emerald-400' : 'text-white/60'}`}>
                  {isMyTurn ? 'Your turn!' : `Waiting for ${currentPlayer?.name}...`}
                </span>
              </div>
            </div>

            {/* Scores */}
            <div className="flex items-center justify-center gap-4 mb-4">
              {gameState.players.map(p => (
                <div
                  key={p.id}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-lg ${
                    p.id === gameState.currentPlayerId ? 'bg-white/10 ring-1 ring-white/10' : 'bg-white/[0.03]'
                  }`}
                >
                  <div className="w-6 h-6 rounded-full flex items-center justify-center" style={{ backgroundColor: `${p.color}20` }}>
                    <Avatar avatarId={p.avatar} size={16} color={p.color} />
                  </div>
                  <span className="text-sm font-bold text-white">{gameState.scores[p.id] || 0}</span>
                </div>
              ))}
            </div>

            {/* Card grid */}
            <style>{`
              @keyframes match-flash {
                0%, 100% { box-shadow: none; }
                40% { box-shadow: 0 0 0 4px rgba(16,185,129,0.5), 0 0 20px rgba(16,185,129,0.3); }
              }
              .animate-match-flash { animation: match-flash 0.6s ease-out; }
              @keyframes nomatch-flash {
                0%, 100% { box-shadow: none; }
                40% { box-shadow: 0 0 0 4px rgba(239,68,68,0.5), 0 0 20px rgba(239,68,68,0.3); }
              }
              .animate-nomatch-flash { animation: nomatch-flash 0.6s ease-out; }
            `}</style>
            <div className="grid grid-cols-4 gap-2 mb-4">
              {gameState.board.map((card, idx) => {
                const isFlipCard = gameState.turnPhase === 'showing-result' &&
                  (idx === gameState.firstPick || idx === gameState.secondPick);
                const flashState = isFlipCard
                  ? (gameState.firstPick !== null && gameState.board[gameState.firstPick]?.matched ? 'match' : 'nomatch')
                  : null;
                return (
                  <MemoryCard
                    key={card.id}
                    card={card}
                    index={idx}
                    onClick={() => handleFlip(idx)}
                    disabled={!isMyTurn || gameState.turnPhase === 'showing-result'}
                    players={gameState.players}
                    flashState={flashState}
                  />
                );
              })}
            </div>

            {/* Pairs found */}
            <div className="text-center">
              <p className="text-white/30 text-xs">
                {gameState.board.filter(c => c.matched).length / 2} / {gameState.board.length / 2} pairs found
              </p>
            </div>
          </>
        )}
      </div>
    </main>
  );
}
