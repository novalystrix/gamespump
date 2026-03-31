'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { getSession } from '@/lib/session';
import { Room, GAMES, Player } from '@/lib/types';
import { Avatar } from '@/components/avatars/AvatarSVG';
import { CopyIcon, CrownIcon, CheckIcon, UsersIcon, ClockIcon } from '@/components/icons/GameIcons';
import { gameIconMap } from '@/components/icons/GameIcons';
import Loading from '@/components/Loading';
import { QRCode } from '@/components/QRCode';

// ─── Game tips ────────────────────────────────────────────────────────────────

const GAME_TIPS: Record<string, string[]> = {
  'trivia-clash': [
    'Speed matters! Faster answers score more points.',
    'Wrong answers cost you — only guess if you\'re fairly sure.',
    'Some categories are worth more. Read the label!',
    'Stay calm. Panic leads to silly mistakes.',
  ],
  'memory-match': [
    'Pay attention to other players\' turns too!',
    'Try to build a mental map of where cards are.',
    'Corner cards are easier to remember by position.',
    'A good memory beats random clicking every time.',
  ],
  'this-or-that': [
    'Match the majority to earn points — think like the crowd.',
    'Go with your gut. Overthinking rarely helps here.',
    'Watch patterns in how others vote each round.',
    'Even a 50/50 guess is worth taking.',
  ],
  'speed-math': [
    'Rough estimates beat perfect calculations under pressure.',
    'Eliminate obviously wrong answers first.',
    'Mental shortcuts like rounding save precious time.',
    'Consistency beats speed — don\'t panic-click.',
  ],
  'word-blitz': [
    'Common words score less. Go obscure for big points!',
    'Type fast and fix typos — partial words don\'t count.',
    'Plurals and verb forms count as separate words.',
    'Scan for two-letter combos to unlock longer words.',
  ],
  'quick-draw': [
    'Draw the most obvious features first — details can wait.',
    'Label your drawing if it\'s ambiguous!',
    'Guessers: think simple. Drawers rarely go obscure.',
    'Big bold strokes beat tiny careful lines every time.',
  ],
};

const GENERIC_TIPS = [
  'Share the room code with friends to play together.',
  'Everyone needs to be on the same WiFi for best performance.',
  'The host controls when the game starts.',
  'Invite a friend — more players = more fun!',
];

function getTipsForGame(gameId: string | null | undefined): string[] {
  if (gameId && GAME_TIPS[gameId]) {
    return [...GAME_TIPS[gameId], ...GENERIC_TIPS];
  }
  return GENERIC_TIPS;
}

// ─── Web Audio beep ───────────────────────────────────────────────────────────

function playBeep(freq: number, duration = 0.12) {
  try {
    const ctx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.frequency.value = freq;
    osc.type = 'sine';
    gain.gain.setValueAtTime(0.3, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + duration);
  } catch {
    // Audio not supported — ignore
  }
}

// ─── Sub-components ───────────────────────────────────────────────────────────

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
      <div className="w-full h-28 rounded-xl overflow-hidden mb-3 bg-white/5">
        <img
          src={`/images/games/${game.id}.png`}
          alt={game.name}
          className="w-full h-full object-cover"
          onError={(e) => {
            (e.target as HTMLImageElement).style.display = 'none';
            (e.target as HTMLImageElement).parentElement!.innerHTML = `<div class="w-full h-full flex items-center justify-center bg-gradient-to-br ${game.color}"><span class="text-3xl text-white/80">🎮</span></div>`;
          }}
        />
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

/** Rich game preview card shown when a game is selected */
function GamePreviewCard({
  game,
  isHost,
  onChangeClick,
}: {
  game: typeof GAMES[0];
  isHost: boolean;
  onChangeClick: () => void;
}) {
  return (
    <div className="mb-4 rounded-2xl overflow-hidden relative animate-scale-in">
      {/* Cover image as blurred background */}
      <div className="absolute inset-0">
        <img
          src={`/images/games/${game.id}.png`}
          alt=""
          aria-hidden
          className="w-full h-full object-cover opacity-20 blur-sm scale-105"
          onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
        />
        <div className="absolute inset-0 bg-black/50" />
      </div>
      {/* Glass overlay content */}
      <div className="relative z-10 p-4 ring-1 ring-white/10 rounded-2xl bg-white/5 backdrop-blur-md">
        <div className="flex gap-3 items-start">
          {/* Thumbnail */}
          <div className="w-16 h-16 rounded-xl overflow-hidden flex-shrink-0 bg-white/10">
            <img
              src={`/images/games/${game.id}.png`}
              alt={game.name}
              className="w-full h-full object-cover"
              onError={(e) => {
                const el = e.target as HTMLImageElement;
                el.style.display = 'none';
                el.parentElement!.innerHTML = `<div class="w-full h-full flex items-center justify-center bg-gradient-to-br ${game.color}"><span class="text-2xl">🎮</span></div>`;
              }}
            />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white/40 text-xs mb-0.5">Selected game</p>
            <h3 className="font-display font-bold text-white text-base leading-tight mb-1">{game.name}</h3>
            <p className="text-white/50 text-xs leading-relaxed line-clamp-2">{game.description}</p>
            <div className="flex items-center gap-3 mt-2 text-white/30 text-xs">
              <span className="flex items-center gap-1">
                <UsersIcon className="w-3 h-3" />
                {game.minPlayers}–{game.maxPlayers} players
              </span>
              <span className="flex items-center gap-1">
                <ClockIcon className="w-3 h-3" />
                {game.durationMinutes} min
              </span>
            </div>
          </div>
          {isHost && (
            <button
              onClick={onChangeClick}
              className="text-xs text-purple-400 px-3 py-2 min-h-[44px] rounded-lg hover:bg-white/5 transition-colors [touch-action:manipulation] flex-shrink-0"
            >
              Change
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

/** Rotating tips shown while waiting */
function WaitingTips({ gameId }: { gameId: string | null | undefined }) {
  const tips = getTipsForGame(gameId);
  const [tipIndex, setTipIndex] = useState(0);

  useEffect(() => {
    const t = setInterval(() => {
      setTipIndex(i => (i + 1) % tips.length);
    }, 4000);
    return () => clearInterval(t);
  }, [tips.length]);

  return (
    <div className="mt-4 mb-2 min-h-[48px] flex items-center justify-center px-2">
      <p
        key={tipIndex}
        className="text-white/30 text-xs text-center leading-relaxed animate-tip-fade-in"
      >
        💡 {tips[tipIndex]}
      </p>
    </div>
  );
}

/** Full-screen countdown overlay */
function CountdownOverlay({ value }: { value: 3 | 2 | 1 | 'GO!' }) {
  const isGo = value === 'GO!';
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <span
        key={String(value)}
        className={`font-display font-black select-none animate-countdown-pop
          ${isGo ? 'text-8xl text-emerald-400 drop-shadow-[0_0_40px_rgba(52,211,153,0.7)]'
                 : 'text-9xl text-white drop-shadow-[0_0_40px_rgba(168,85,247,0.8)]'}`}
      >
        {value}
      </span>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function RoomPage({ params }: { params: { code: string } }) {
  const router = useRouter();
  const [room, setRoom] = useState<Room | null>(null);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  const [copiedInvite, setCopiedInvite] = useState(false);
  const [showGames, setShowGames] = useState(false);
  const [countdown, setCountdown] = useState<3 | 2 | 1 | 'GO!' | null>(null);
  const countdownActive = useRef(false);

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

      // Redirect to game page when game starts (non-host players, or after countdown)
      if (data.room.status === 'playing' && data.room.selectedGame && !countdownActive.current) {
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

  // Countdown tick logic
  useEffect(() => {
    if (countdown === null) return;

    if (countdown === 'GO!') {
      playBeep(880, 0.2);
      const t = setTimeout(() => {
        countdownActive.current = false;
        if (room?.selectedGame) {
          router.push(`/game/${params.code}/${room.selectedGame}`);
        }
      }, 800);
      return () => clearTimeout(t);
    }

    playBeep(440, 0.12);
    const next = countdown - 1;
    const t = setTimeout(() => {
      setCountdown(next === 0 ? 'GO!' : (next as 3 | 2 | 1));
    }, 1000);
    return () => clearTimeout(t);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [countdown]);

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

  function copyInvite() {
    const url = `${window.location.origin}/join/${params.code}`;
    navigator.clipboard.writeText(url);
    setCopiedInvite(true);
    setTimeout(() => setCopiedInvite(false), 2000);
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

  async function handleStart() {
    if (!canStart || !session) return;
    await fetch(`/api/rooms/${params.code}/start`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ playerId: session.playerId }),
    });
    countdownActive.current = true;
    setCountdown(3);
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
        <Loading />
      </main>
    );
  }

  const selectedGameInfo = GAMES.find(g => g.id === room.selectedGame);
  const maxPlayers = selectedGameInfo?.maxPlayers ?? 8;
  const showQR = playerCount < maxPlayers;
  const joinUrl = `https://gamespump.onrender.com/join/${params.code}`;

  return (
    <main className="min-h-[100dvh] flex flex-col px-6 py-8 relative">
      {/* Countdown overlay */}
      {countdown !== null && <CountdownOverlay value={countdown} />}

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
          {showQR && (
            <div className="mt-3 flex flex-col items-center gap-1">
              <QRCode url={joinUrl} size={128} />
              <p className="text-white/25 text-xs">Scan to join</p>
            </div>
          )}
        </div>

        {/* Invite Friends */}
        <div className="mb-4">
          <button
            onClick={copyInvite}
            className="w-full py-3 px-6 rounded-2xl font-display font-semibold
              bg-gradient-to-r from-purple-500/20 to-fuchsia-500/20
              ring-1 ring-purple-500/30 text-white/80 hover:text-white hover:ring-purple-400/50
              active:scale-[0.98] transition-all duration-200 flex items-center justify-center gap-2"
          >
            <CopyIcon className="w-4 h-4" />
            {copiedInvite ? 'Copied!' : 'Invite Friends'}
          </button>
        </div>

        {/* Players list */}
        <div className="mb-4">
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
          {/* Rotating tips */}
          <WaitingTips gameId={room.selectedGame} />
        </div>

        {/* Selected game preview card */}
        {selectedGameInfo && (
          <GamePreviewCard
            game={selectedGameInfo}
            isHost={isHost}
            onChangeClick={() => setShowGames(true)}
          />
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
        <div className="mt-auto pt-4 space-y-3">
          {isHost && !selectedGameInfo && (
            <button
              onClick={() => setShowGames(true)}
              className="w-full py-4 px-6 rounded-2xl font-display font-semibold text-lg
                glass text-white
                hover:bg-white/10
                active:scale-[0.98] transition-all duration-200 [touch-action:manipulation]"
            >
              Choose a Game
            </button>
          )}

          {isHost && (
            <button
              disabled={!canStart}
              onClick={handleStart}
              className="w-full py-4 px-6 rounded-2xl font-display font-semibold text-lg
                bg-gradient-to-r from-purple-500 to-fuchsia-500 text-white
                shadow-lg shadow-purple-500/25
                disabled:opacity-30 disabled:cursor-not-allowed
                active:scale-[0.98] transition-all duration-200 [touch-action:manipulation]"
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
