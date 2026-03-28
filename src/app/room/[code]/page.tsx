'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { getSession } from '@/lib/session';
import { Room, GAMES, Player } from '@/lib/types';
import { Avatar } from '@/components/avatars/AvatarSVG';
import { CopyIcon, CrownIcon, CheckIcon, UsersIcon, ClockIcon } from '@/components/icons/GameIcons';
import { gameIconMap } from '@/components/icons/GameIcons';

function PlayerCard({ player, isCurrentUser }: { player: Player; isCurrentUser: boolean }) {
  return (
    <div
      className={`flex items-center gap-3 p-3 rounded-xl transition-all animate-slide-in-right
        ${isCurrentUser ? 'bg-white/8 ring-1 ring-white/10' : 'bg-white/[0.03]'}`}
    >
      <div
        className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
        style={{ backgroundColor: `${player.color}20` }}
      >
        <Avatar avatarId={player.avatar} size={28} color={player.color} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <span className="font-semibold text-sm text-white truncate">{player.name}</span>
          {player.isHost && (
            <CrownIcon className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
          )}
        </div>
        <span className="text-xs text-emerald-400">In game</span>
      </div>
    </div>
  );
}

function GameCard({
  game,
  selected,
  onSelect,
}: {
  game: typeof GAMES[0];
  selected: boolean;
  onSelect: () => void;
}) {
  const Icon = gameIconMap[game.icon];
  return (
    <button
      onClick={onSelect}
      className={`relative w-full p-4 rounded-2xl text-left transition-all
        ${selected
          ? 'ring-2 ring-purple-400 bg-white/10 scale-[1.02]'
          : 'bg-white/[0.03] hover:bg-white/[0.06] active:scale-[0.98]'
        }`}
    >
      <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${game.color} flex items-center justify-center mb-3`}>
        {Icon && <Icon className="w-6 h-6 text-white" />}
      </div>
      <h3 className="font-display font-bold text-white text-sm mb-1">{game.name}</h3>
      <p className="text-white/40 text-xs leading-relaxed mb-3">{game.description}</p>
      <div className="flex items-center gap-3 text-white/30 text-xs">
        <span className="flex items-center gap-1">
          <UsersIcon className="w-3.5 h-3.5" />
          {game.minPlayers}-{game.maxPlayers}
        </span>
        <span className="flex items-center gap-1">
          <ClockIcon className="w-3.5 h-3.5" />
          {game.durationMinutes} min
        </span>
      </div>
      {selected && (
        <div className="absolute top-3 right-3 w-6 h-6 bg-purple-500 rounded-full flex items-center justify-center">
          <CheckIcon className="w-3.5 h-3.5 text-white" />
        </div>
      )}
    </button>
  );
}

export default function RoomPage({ params }: { params: { code: string } }) {
  const router = useRouter();
  const [room, setRoom] = useState<Room | null>(null);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  const [showGames, setShowGames] = useState(false);

  // Snapshot session on mount — don't re-read from localStorage
  // (other tabs may overwrite it with their own playerId)
  const [session] = useState(() => typeof window !== 'undefined' ? getSession() : null);
  const currentPlayer = room?.players.find(p => p.id === session?.playerId);
  const isHost = currentPlayer?.isHost || false;
  const playerCount = room?.players.length || 0;
  const canStart = isHost && playerCount >= 2 && room?.selectedGame;

  const fetchRoom = useCallback(async () => {
    try {
      const res = await fetch(`/api/rooms/${params.code}`);
      if (!res.ok) {
        setError('Room not found or expired');
        return;
      }
      const data = await res.json();
      setRoom(data.room);

      // Redirect to game page when game starts
      if (data.room.status === 'playing' && data.room.selectedGame) {
        router.push(`/game/${params.code}/${data.room.selectedGame}`);
      }
    } catch {
      setError('Failed to connect');
    }
  }, [params.code, router]);

  useEffect(() => {
    fetchRoom();
    const interval = setInterval(fetchRoom, 2000);
    return () => clearInterval(interval);
  }, [fetchRoom]);

  async function selectGame(gameId: string) {
    if (!isHost) return;
    await fetch(`/api/rooms/${params.code}/game`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ gameId }),
    });
    fetchRoom();
    setShowGames(false);
  }

  function copyCode() {
    navigator.clipboard.writeText(params.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  async function leaveRoom() {
    if (!session) return;
    await fetch(`/api/rooms/${params.code}/leave`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ playerId: session.playerId }),
    });
    router.push('/');
  }

  if (error) {
    return (
      <main className="min-h-[100dvh] flex items-center justify-center px-6">
        <div className="text-center page-transition">
          <p className="text-white/50 mb-4">{error}</p>
          <button
            onClick={() => router.push('/')}
            className="px-6 py-3 rounded-xl glass text-white font-semibold"
          >
            Back to Home
          </button>
        </div>
      </main>
    );
  }

  if (!room) {
    return (
      <main className="min-h-[100dvh] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-purple-400 border-t-transparent rounded-full animate-spin" />
      </main>
    );
  }

  const selectedGameInfo = GAMES.find(g => g.id === room.selectedGame);

  return (
    <main className="min-h-[100dvh] flex flex-col px-6 py-8 relative">
      {/* Background */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-32 -left-32 w-80 h-80 bg-purple-600/15 rounded-full blur-3xl" />
        <div className="absolute -bottom-32 -right-32 w-64 h-64 bg-fuchsia-600/10 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 w-full max-w-sm mx-auto page-transition flex flex-col flex-1">
        {/* Room code header */}
        <div className="text-center mb-6">
          <p className="text-xs text-white/30 font-body uppercase tracking-wider mb-1">Room Code</p>
          <button
            onClick={copyCode}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl glass hover:bg-white/10 transition-colors"
          >
            <span className="text-3xl font-display font-bold tracking-[0.2em] text-white">
              {params.code}
            </span>
            <CopyIcon className={`w-4 h-4 transition-colors ${copied ? 'text-emerald-400' : 'text-white/30'}`} />
          </button>
          {copied && (
            <p className="text-emerald-400 text-xs mt-1 animate-scale-in">Copied!</p>
          )}
        </div>

        {/* Share hint */}
        {playerCount < 2 && (
          <div className="text-center mb-4 glass rounded-xl p-3">
            <p className="text-white/40 text-sm">Share the code with friends to join!</p>
          </div>
        )}

        {/* Players list */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-white/50 font-body">
              Players ({playerCount})
            </h2>
          </div>
          <div className="space-y-2">
            {room.players.map((player) => (
              <PlayerCard
                key={player.id}
                player={player}
                isCurrentUser={player.id === session?.playerId}
              />
            ))}
            {room.players.length === 0 && (
              <div className="text-center py-8 text-white/20 text-sm">
                Waiting for players to join...
              </div>
            )}
          </div>
        </div>

        {/* Selected game */}
        {selectedGameInfo && (
          <div className="mb-4 glass rounded-xl p-3 flex items-center gap-3">
            <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${selectedGameInfo.color} flex items-center justify-center flex-shrink-0`}>
              {(() => { const Icon = gameIconMap[selectedGameInfo.icon]; return Icon ? <Icon className="w-5 h-5 text-white" /> : null; })()}
            </div>
            <div className="flex-1">
              <p className="text-xs text-white/40">Selected game</p>
              <p className="text-sm font-semibold text-white">{selectedGameInfo.name}</p>
            </div>
            {isHost && (
              <button
                onClick={() => setShowGames(true)}
                className="text-xs text-purple-400 px-3 py-1.5 rounded-lg hover:bg-white/5 transition-colors"
              >
                Change
              </button>
            )}
          </div>
        )}

        {/* Game selection modal */}
        {showGames && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-4">
            <div className="w-full max-w-sm bg-[#1a0a2e] rounded-t-3xl sm:rounded-3xl p-6 max-h-[80vh] overflow-y-auto animate-slide-up">
              <h2 className="font-display font-bold text-lg text-white mb-4">Choose a Game</h2>
              <div className="space-y-3">
                {GAMES.map((game) => (
                  <GameCard
                    key={game.id}
                    game={game}
                    selected={room.selectedGame === game.id}
                    onSelect={() => selectGame(game.id)}
                  />
                ))}
              </div>
              <button
                onClick={() => setShowGames(false)}
                className="w-full mt-4 py-3 rounded-xl text-white/40 text-sm hover:text-white/60 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Bottom actions */}
        <div className="mt-auto pt-6 space-y-3">
          {isHost && !selectedGameInfo && (
            <button
              onClick={() => setShowGames(true)}
              className="w-full py-4 px-6 rounded-2xl font-display font-semibold text-lg
                glass text-white
                hover:bg-white/10
                active:scale-[0.98] transition-all duration-200"
            >
              Choose a Game
            </button>
          )}

          {isHost && (
            <button
              disabled={!canStart}
              onClick={async () => {
                if (!canStart || !session) return;
                await fetch(`/api/rooms/${params.code}/start`, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ playerId: session.playerId }),
                });
                fetchRoom();
              }}
              className="w-full py-4 px-6 rounded-2xl font-display font-semibold text-lg
                bg-gradient-to-r from-purple-500 to-fuchsia-500 text-white
                shadow-lg shadow-purple-500/25
                disabled:opacity-30 disabled:cursor-not-allowed
                active:scale-[0.98] transition-all duration-200"
            >
              {canStart
                ? 'Start Game!'
                : playerCount < 2
                  ? `Waiting for players... (${playerCount}/2)`
                  : 'Pick a game to start'
              }
            </button>
          )}

          {!isHost && (
            <div className="text-center py-3">
              <p className="text-white/30 text-sm">Waiting for host to start...</p>
            </div>
          )}

          <button
            onClick={leaveRoom}
            className="w-full py-3 text-white/30 text-sm hover:text-white/50 transition-colors"
          >
            Leave Room
          </button>
        </div>
      </div>
    </main>
  );
}
