'use client';

import { useState, useEffect, useCallback, useRef, forwardRef, useImperativeHandle } from 'react';
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

const ROUND_TIME = 30;

// ── Audio ──────────────────────────────────────────────────────────────────────

function playSound(name: string) {
  if (typeof window === 'undefined') return;
  try {
    const ctx = new (window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    const now = ctx.currentTime;

    if (name === 'correct') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(523, now);
      osc.frequency.setValueAtTime(784, now + 0.1);
      osc.frequency.setValueAtTime(1047, now + 0.2);
      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
      osc.start(now); osc.stop(now + 0.5);
    } else if (name === 'wrong') {
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(220, now);
      osc.frequency.setValueAtTime(160, now + 0.1);
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
    } else if (name === 'new-round') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(392, now);
      osc.frequency.setValueAtTime(523, now + 0.15);
      osc.frequency.setValueAtTime(659, now + 0.3);
      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.6);
      osc.start(now); osc.stop(now + 0.6);
    }
  } catch {
    // AudioContext unavailable — silently ignore
  }
}

// ── Types ──────────────────────────────────────────────────────────────────────

interface GameState {
  phase: 'drawing' | 'results' | 'leaderboard';
  currentRound: number;
  totalRounds: number;
  currentDrawerId: string;
  wordPrompt: string | null;
  roundStartedAt: number;
  canvasData: string | null;
  correctGuessers: string[];
  scores: Record<string, number>;
  players: Player[];
}

// ── Timer ──────────────────────────────────────────────────────────────────────

function TimerBar({ startedAt }: { startedAt: number }) {
  const [remaining, setRemaining] = useState(ROUND_TIME);
  const lastCountdownSecRef = useRef(-1);

  useEffect(() => {
    trackPageView('game-quick-draw');
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
        .animate-timer-pulse { animation: timer-pulse 0.5s ease-in-out infinite; display: inline-block; }
        @keyframes score-fly {
          0% { opacity: 0; transform: translateY(8px) scale(0.9); }
          30% { opacity: 1; transform: translateY(-6px) scale(1.1); }
          100% { opacity: 0; transform: translateY(-24px) scale(1); }
        }
        .animate-score-fly { animation: score-fly 0.9s ease-out forwards; }
        @keyframes slide-up {
          from { opacity: 0; transform: translateY(16px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-slide-up { animation: slide-up 0.3s ease-out; }
        @keyframes word-reveal {
          0% { opacity: 0; transform: scale(0.8) rotate(-2deg); }
          60% { transform: scale(1.05) rotate(1deg); }
          100% { opacity: 1; transform: scale(1) rotate(0deg); }
        }
        .animate-word-reveal { animation: word-reveal 0.4s ease-out; }
        @keyframes confetti-fall {
          0% { transform: translateY(0) rotate(0deg); opacity: 1; }
          100% { transform: translateY(100vh) rotate(720deg); opacity: 0; }
        }
        .animate-confetti { animation: confetti-fall linear forwards; }
      `}</style>
      <div className="flex items-center justify-between mb-1.5">
        <span className={`text-sm font-bold tabular-nums transition-colors ${
          critical ? 'text-red-400 animate-timer-pulse' : urgent ? 'text-amber-400' : 'text-white/60'
        }`}>
          {Math.ceil(remaining)}s
        </span>
      </div>
      <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-100 ease-linear ${
            critical ? 'bg-red-500' : urgent ? 'bg-amber-400' : 'bg-violet-400'
          }`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

// ── Drawing Canvas (drawer-only) ───────────────────────────────────────────────

interface DrawingCanvasHandle {
  clear: () => void;
}

const BRUSH_PRESETS = [
  { size: 3, label: 'S' },
  { size: 8, label: 'M' },
  { size: 18, label: 'L' },
];

const DrawingCanvas = forwardRef<DrawingCanvasHandle, { onUpload: (data: string) => void }>(
  function DrawingCanvas({ onUpload }, ref) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [brushSize, setBrushSize] = useState(8);
    const brushSizeRef = useRef(8);
    const onUploadRef = useRef(onUpload);

    useEffect(() => { brushSizeRef.current = brushSize; }, [brushSize]);
    useEffect(() => { onUploadRef.current = onUpload; });

    useImperativeHandle(ref, () => ({
      clear() {
        const c = canvasRef.current;
        if (!c) return;
        const ctx = c.getContext('2d')!;
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, c.width, c.height);
      },
    }));

    // eslint-disable-next-line react-hooks/exhaustive-deps
    useEffect(() => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d')!;

      // Initialize white background
      ctx.fillStyle = 'white';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      let drawing = false;
      let lx = 0, ly = 0;

      const pos = (cx: number, cy: number) => {
        const r = canvas.getBoundingClientRect();
        return {
          x: (cx - r.left) * (canvas.width / r.width),
          y: (cy - r.top) * (canvas.height / r.height),
        };
      };

      const start = (x: number, y: number) => { drawing = true; lx = x; ly = y; };
      const move = (x: number, y: number) => {
        if (!drawing) return;
        ctx.strokeStyle = '#111827';
        ctx.lineWidth = brushSizeRef.current;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.beginPath();
        ctx.moveTo(lx, ly);
        ctx.lineTo(x, y);
        ctx.stroke();
        lx = x; ly = y;
      };
      const end = () => { drawing = false; };

      const md = (e: MouseEvent) => { const p = pos(e.clientX, e.clientY); start(p.x, p.y); };
      const mm = (e: MouseEvent) => { const p = pos(e.clientX, e.clientY); move(p.x, p.y); };
      const ts = (e: TouchEvent) => { const t = e.touches[0]; const p = pos(t.clientX, t.clientY); start(p.x, p.y); };
      const tm = (e: TouchEvent) => { const t = e.touches[0]; const p = pos(t.clientX, t.clientY); move(p.x, p.y); };

      canvas.addEventListener('mousedown', md);
      canvas.addEventListener('mousemove', mm);
      canvas.addEventListener('mouseup', end);
      canvas.addEventListener('mouseleave', end);
      canvas.addEventListener('touchstart', ts, { passive: true });
      canvas.addEventListener('touchmove', tm, { passive: true });
      canvas.addEventListener('touchend', end);

      const uploadInterval = setInterval(() => {
        const data = canvas.toDataURL('image/jpeg', 0.5);
        onUploadRef.current(data);
      }, 500);

      return () => {
        canvas.removeEventListener('mousedown', md);
        canvas.removeEventListener('mousemove', mm);
        canvas.removeEventListener('mouseup', end);
        canvas.removeEventListener('mouseleave', end);
        canvas.removeEventListener('touchstart', ts);
        canvas.removeEventListener('touchmove', tm);
        canvas.removeEventListener('touchend', end);
        clearInterval(uploadInterval);
      };
    }, []); // run once on mount

    return (
      <div className="space-y-2">
        <canvas
          ref={canvasRef}
          width={320}
          height={240}
          className="w-full rounded-2xl bg-white block border-2 border-white/20 shadow-lg"
          style={{ touchAction: 'none', cursor: 'crosshair', aspectRatio: '4/3' }}
        />
        <div className="flex items-center justify-between">
          <div className="flex gap-2">
            {BRUSH_PRESETS.map(({ size, label }) => (
              <button
                key={size}
                onClick={() => setBrushSize(size)}
                className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${
                  brushSize === size
                    ? 'bg-violet-500/40 ring-2 ring-violet-400/60'
                    : 'bg-white/8 hover:bg-white/12'
                }`}
                title={`${label} brush`}
              >
                <div
                  className="rounded-full bg-gray-800"
                  style={{
                    width: size === 3 ? 6 : size === 8 ? 12 : 20,
                    height: size === 3 ? 6 : size === 8 ? 12 : 20,
                  }}
                />
              </button>
            ))}
          </div>
          <button
            onClick={() => {
              const c = canvasRef.current;
              if (!c) return;
              const ctx = c.getContext('2d')!;
              ctx.fillStyle = 'white';
              ctx.fillRect(0, 0, c.width, c.height);
            }}
            className="px-4 py-2.5 rounded-xl bg-white/8 text-white/50 text-sm font-semibold hover:bg-white/12 transition-colors"
          >
            Clear
          </button>
        </div>
      </div>
    );
  }
);

// ── Guesser Canvas (image display) ────────────────────────────────────────────

function GuesserCanvas({ canvasData }: { canvasData: string | null }) {
  if (!canvasData) {
    return (
      <div
        className="w-full rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center"
        style={{ aspectRatio: '4/3' }}
      >
        <p className="text-white/20 text-sm">Waiting for drawing...</p>
      </div>
    );
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={canvasData}
      alt="Drawing in progress"
      className="w-full rounded-2xl border border-white/10 shadow-lg bg-white"
      style={{ aspectRatio: '4/3', objectFit: 'contain', display: 'block' }}
    />
  );
}

// ── Results View ───────────────────────────────────────────────────────────────

function ResultsView({
  gameState,
  myId,
  previousScores,
}: {
  gameState: GameState;
  myId: string;
  previousScores: Record<string, number>;
}) {
  const drawer = gameState.players.find(p => p.id === gameState.currentDrawerId);
  const guesserIds = gameState.players.map(p => p.id).filter(id => id !== gameState.currentDrawerId);

  const rankLabel = (rank: number) => {
    if (rank === 1) return '1st';
    if (rank === 2) return '2nd';
    if (rank === 3) return '3rd';
    return `${rank}th`;
  };

  const pointsForRank = (rank: number) => rank === 1 ? 3 : rank === 2 ? 2 : 1;

  return (
    <div className="animate-slide-up space-y-4">
      {/* Word reveal */}
      <div className="text-center">
        <p className="text-white/40 text-xs uppercase tracking-widest mb-1">The word was</p>
        <p className="animate-word-reveal font-display font-bold text-3xl text-violet-300 uppercase tracking-wider">
          {gameState.wordPrompt}
        </p>
      </div>

      {/* Final drawing */}
      {gameState.canvasData && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={gameState.canvasData}
          alt="Final drawing"
          className="w-full rounded-2xl border border-white/10 bg-white shadow-lg"
          style={{ aspectRatio: '4/3', objectFit: 'contain', display: 'block' }}
        />
      )}

      {/* Guesser results */}
      <div className="space-y-2">
        {guesserIds.map(playerId => {
          const player = gameState.players.find(p => p.id === playerId);
          if (!player) return null;
          const rank = gameState.correctGuessers.indexOf(playerId);
          const correct = rank !== -1;
          const pts = correct ? pointsForRank(rank + 1) : 0;
          const prevPts = previousScores[playerId] ?? gameState.scores[playerId] ?? 0;
          const gained = (gameState.scores[playerId] || 0) - prevPts;
          const isMe = playerId === myId;

          return (
            <div
              key={playerId}
              className={`flex items-center gap-3 p-3 rounded-2xl ${
                isMe ? 'bg-white/8 ring-1 ring-white/10' : 'bg-white/[0.03]'
              }`}
            >
              <div
                className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
                style={{ backgroundColor: `${player.color}20` }}
              >
                <Avatar avatarId={player.avatar} size={26} color={player.color} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm text-white truncate">{player.name}</p>
                <p className={`text-xs ${correct ? 'text-emerald-400' : 'text-white/30'}`}>
                  {correct ? `${rankLabel(rank + 1)} guess!` : 'Didn\'t guess'}
                </p>
              </div>
              {gained > 0 && (
                <span className="text-emerald-400 font-display font-bold text-lg">+{gained}</span>
              )}
              <div className="text-right">
                <p className="text-sm font-bold text-white">{gameState.scores[playerId] || 0}</p>
                <p className="text-xs text-white/30">pts</p>
              </div>
            </div>
          );
        })}

        {/* Drawer row */}
        {drawer && (() => {
          const drawerPts = (gameState.scores[drawer.id] || 0) - (previousScores[drawer.id] ?? gameState.scores[drawer.id] ?? 0);
          const isMe = drawer.id === myId;
          return (
            <div
              className={`flex items-center gap-3 p-3 rounded-2xl ${
                isMe ? 'bg-white/8 ring-1 ring-white/10' : 'bg-white/[0.03]'
              }`}
            >
              <div
                className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
                style={{ backgroundColor: `${drawer.color}20` }}
              >
                <Avatar avatarId={drawer.avatar} size={26} color={drawer.color} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm text-white truncate">{drawer.name}</p>
                <p className="text-xs text-violet-400">Drawer</p>
              </div>
              {drawerPts > 0 && (
                <span className="text-emerald-400 font-display font-bold text-lg">+{drawerPts}</span>
              )}
              <div className="text-right">
                <p className="text-sm font-bold text-white">{gameState.scores[drawer.id] || 0}</p>
                <p className="text-xs text-white/30">pts</p>
              </div>
            </div>
          );
        })()}
      </div>

      <p className="text-center text-white/25 text-sm">Next round starting soon...</p>
    </div>
  );
}

// ── Leaderboard View ───────────────────────────────────────────────────────────

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
      <h2 className="font-display font-bold text-3xl text-white mb-1">Game Over!</h2>
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
              backgroundColor: ['#a855f7', '#ec4899', '#f97316', '#34d399', '#facc15', '#6366f1'][i % 6],
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
                  ? 'bg-gradient-to-r from-violet-500/20 to-fuchsia-500/20 ring-1 ring-violet-400/30'
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
        <ShareResults gameName="Quick Draw" winnerName={sorted[0]?.name ?? ''} winnerScore={gameState.scores[sorted[0]?.id] || 0} />
        {isHost ? (
          <>
            <button
              onClick={handlePlayAgain}
              disabled={restarting}
              className="w-full py-4 px-6 rounded-2xl font-display font-semibold text-lg
                bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white
                shadow-lg shadow-violet-500/25 active:scale-[0.98] transition-all duration-200 disabled:opacity-60"
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
            <div className="w-full py-4 px-6 rounded-2xl font-display font-semibold text-lg bg-white/5 text-white/30 text-center">
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

// ── Main Component ─────────────────────────────────────────────────────────────

export default function QuickDrawPage({ params }: { params: { code: string } }) {
  const router = useRouter();
  const [session] = useState(() => typeof window !== 'undefined' ? getSession() : null);
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [guessInput, setGuessInput] = useState('');
  const [hasGuessedCorrectly, setHasGuessedCorrectly] = useState(false);
  const [scorePopup, setScorePopup] = useState<{ points: number; key: number } | null>(null);
  const [previousScores, setPreviousScores] = useState<Record<string, number>>({});
  const [error, setError] = useState('');
  const [roomEnded, setRoomEnded] = useState(false);

  const drawingCanvasRef = useRef<DrawingCanvasHandle>(null);
  const guessInputRef = useRef<HTMLInputElement>(null);
  const timerExpiredRef = useRef(false);
  const autoAdvanceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const prevRoundRef = useRef(-1);
  const roundSoundPlayedRef = useRef(false);
  const scorePopupKeyRef = useRef(0);

  const myId = session?.playerId || '';

  // ── Fetch game state ───────────────────────────────────────────────────────

  const fetchGameState = useCallback(async () => {
    try {
      const res = await fetch(
        `/api/rooms/${params.code}/game-state?pid=${session?.playerId || ''}`
      );
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
        // Phase transition: drawing → results
        if (prev && prev.phase === 'drawing' && data.phase === 'results') {
          setPreviousScores({ ...prev.scores });
          if (!roundSoundPlayedRef.current) {
            roundSoundPlayedRef.current = true;
            playSound('round-end');
          }
        }

        // New round started
        if (data.phase === 'drawing' && data.currentRound !== prevRoundRef.current) {
          prevRoundRef.current = data.currentRound;
          timerExpiredRef.current = false;
          roundSoundPlayedRef.current = false;
          setHasGuessedCorrectly(false);
          setGuessInput('');
          if (data.currentRound > 0) {
            playSound('new-round');
          }
        }

        return data;
      });
    } catch {
      // silently retry
    }
  }, [params.code, session?.playerId, router]);

  useEffect(() => {
    fetchGameState();
    const interval = setInterval(fetchGameState, 1000);
    return () => clearInterval(interval);
  }, [fetchGameState]);

  // ── Timer expiration → force results ──────────────────────────────────────

  useEffect(() => {
    if (!gameState || gameState.phase !== 'drawing') return;

    const elapsed = Date.now() - gameState.roundStartedAt;
    const remaining = ROUND_TIME * 1000 - elapsed;

    if (remaining <= 0 && !timerExpiredRef.current) {
      timerExpiredRef.current = true;
      fetch(`/api/rooms/${params.code}/advance-quick-draw`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'force-results' }),
      });
      return;
    }

    const timer = setTimeout(() => {
      if (!timerExpiredRef.current) {
        timerExpiredRef.current = true;
        fetch(`/api/rooms/${params.code}/advance-quick-draw`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'force-results' }),
        });
      }
    }, remaining);

    return () => clearTimeout(timer);
  }, [gameState?.phase, gameState?.currentRound, gameState?.roundStartedAt, params.code]);

  // ── Auto-advance from results after 5s ────────────────────────────────────

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
      fetch(`/api/rooms/${params.code}/advance-quick-draw`, {
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

  // ── Canvas upload handler ──────────────────────────────────────────────────

  const handleCanvasUpload = useCallback(async (data: string) => {
    if (!session) return;
    await fetch(`/api/rooms/${params.code}/quick-draw-canvas`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ playerId: session.playerId, canvasData: data }),
    });
  }, [params.code, session]);

  useEffect(() => {
    if (gameState?.phase === 'leaderboard' && session?.playerId) {
      saveGameResult({
        gameType: 'quick-draw',
        roomCode: params.code,
        score: gameState.scores[session.playerId] ?? 0,
        date: new Date().toISOString(),
      });
      trackGameEnd('quick-draw', gameState.scores[session.playerId] ?? 0, params.code);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gameState?.phase]);

  // ── Guess submit ──────────────────────────────────────────────────────────

  async function handleGuessSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!session || !gameState || gameState.phase !== 'drawing') return;
    if (hasGuessedCorrectly) return;

    const guess = guessInput.trim();
    if (!guess) return;

    setGuessInput('');

    const res = await fetch(`/api/rooms/${params.code}/quick-draw-guess`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ playerId: session.playerId, guess }),
    });

    if (res.ok) {
      const data = await res.json();
      if (data.correct) {
        setHasGuessedCorrectly(true);
        playSound('correct');
        scorePopupKeyRef.current++;
        setScorePopup({ points: data.points, key: scorePopupKeyRef.current });
        setTimeout(() => setScorePopup(null), 1200);
      } else {
        playSound('wrong');
        guessInputRef.current?.focus();
      }
    } else {
      guessInputRef.current?.focus();
    }
  }

  // ── Loading / error states ────────────────────────────────────────────────

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
        <div className="w-8 h-8 border-2 border-violet-400 border-t-transparent rounded-full animate-spin" />
      </main>
    );
  }

  const isDrawer = myId === gameState.currentDrawerId;
  const isHost = gameState.players.find(p => p.id === myId)?.isHost ?? false;
  const drawer = gameState.players.find(p => p.id === gameState.currentDrawerId);
  const guesserCount = gameState.players.length - 1;
  const correctCount = gameState.correctGuessers.length;

  return (
    <main className="min-h-[100dvh] flex flex-col px-5 py-5 relative overflow-hidden">
      {/* Background */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-32 -left-32 w-80 h-80 bg-violet-600/15 rounded-full blur-3xl" />
        <div className="absolute -bottom-32 -right-32 w-64 h-64 bg-fuchsia-600/10 rounded-full blur-3xl" />
      </div>

      {/* How to Play */}
      <div className="fixed top-4 right-4 z-40">
        <HowToPlay gameId="quick-draw" />
      </div>

      <div className="relative z-10 w-full max-w-sm mx-auto flex flex-col flex-1">

        {/* ── Leaderboard ── */}
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

        {/* ── Drawing / Results ── */}
        {gameState.phase !== 'leaderboard' && (
          <>
            {/* Header */}
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-display font-bold text-white">
                Round {gameState.currentRound + 1}/{gameState.totalRounds}
              </span>
              <span className="text-xs font-semibold px-3 py-1 rounded-full bg-violet-500/20 text-violet-300">
                Quick Draw
              </span>
              {/* Player scores mini */}
              <div className="flex items-center gap-1.5">
                {gameState.players.map(p => (
                  <div key={p.id} className="flex flex-col items-center gap-0.5">
                    <div
                      className={`w-7 h-7 rounded-full flex items-center justify-center ${
                        p.id === gameState.currentDrawerId ? 'ring-2 ring-violet-400' : ''
                      }`}
                      style={{ backgroundColor: `${p.color}30` }}
                    >
                      <Avatar avatarId={p.avatar} size={18} color={p.color} />
                    </div>
                    <span className="text-[10px] font-bold tabular-nums text-white/50">
                      {gameState.scores[p.id] || 0}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* ── DRAWING PHASE ── */}
            {gameState.phase === 'drawing' && (
              <>
                {isDrawer ? (
                  /* ── DRAWER VIEW ── */
                  <>
                    {/* Word prompt */}
                    <div className="text-center mb-3">
                      <p className="text-white/40 text-xs uppercase tracking-widest mb-1">Draw this</p>
                      <div className="inline-block px-6 py-2 rounded-2xl bg-violet-500/20 border border-violet-400/30">
                        <span className="font-display font-bold text-2xl text-violet-200 uppercase tracking-widest">
                          {gameState.wordPrompt || '...'}
                        </span>
                      </div>
                    </div>

                    {/* Timer */}
                    <div className="mb-3">
                      <TimerBar startedAt={gameState.roundStartedAt} />
                    </div>

                    {/* Canvas */}
                    <DrawingCanvas
                      ref={drawingCanvasRef}
                      key={`canvas-${gameState.currentRound}`}
                      onUpload={handleCanvasUpload}
                    />

                    {/* Guesser progress */}
                    <div className="mt-3 flex items-center gap-2 flex-wrap">
                      {gameState.players
                        .filter(p => p.id !== gameState.currentDrawerId)
                        .map(p => {
                          const guessed = gameState.correctGuessers.includes(p.id);
                          return (
                            <div key={p.id} className="flex items-center gap-1.5">
                              <div
                                className="w-6 h-6 rounded-full flex items-center justify-center"
                                style={{ backgroundColor: `${p.color}30` }}
                              >
                                <Avatar avatarId={p.avatar} size={15} color={p.color} />
                              </div>
                              <span className={`text-xs font-semibold ${guessed ? 'text-emerald-400' : 'text-white/30'}`}>
                                {guessed ? '✓' : '?'}
                              </span>
                            </div>
                          );
                        })}
                      <span className="text-xs text-white/25 ml-1">
                        {correctCount}/{guesserCount} guessed
                      </span>
                    </div>
                  </>
                ) : (
                  /* ── GUESSER VIEW ── */
                  <>
                    {/* Subtitle */}
                    <div className="text-center mb-3">
                      <p className="text-white/60 text-sm">
                        <span style={{ color: drawer?.color }}>
                          {drawer?.name || 'Someone'}
                        </span>
                        {' '}is drawing...
                      </p>
                    </div>

                    {/* Timer */}
                    <div className="mb-3">
                      <TimerBar startedAt={gameState.roundStartedAt} />
                    </div>

                    {/* Canvas image */}
                    <GuesserCanvas canvasData={gameState.canvasData} />

                    {/* Score popup */}
                    <div className="h-9 flex items-center justify-center mt-1">
                      {scorePopup && (
                        <div
                          key={scorePopup.key}
                          className="animate-score-fly text-2xl font-display font-bold text-emerald-400 pointer-events-none select-none"
                        >
                          +{scorePopup.points}pts
                        </div>
                      )}
                    </div>

                    {/* Guess input or correct message */}
                    {hasGuessedCorrectly ? (
                      <div className="mt-2 text-center p-4 rounded-2xl bg-emerald-500/15 border border-emerald-500/30">
                        <p className="font-display font-bold text-emerald-400 text-lg">You got it!</p>
                        <p className="text-white/40 text-sm mt-0.5">Waiting for others...</p>
                      </div>
                    ) : (
                      <form onSubmit={handleGuessSubmit} className="flex gap-2 mt-2">
                        <input
                          ref={guessInputRef}
                          type="text"
                          value={guessInput}
                          onChange={e => setGuessInput(e.target.value)}
                          placeholder="Type your guess..."
                          autoComplete="off"
                          autoFocus
                          className="flex-1 px-4 py-3 rounded-xl bg-white/10 text-white placeholder-white/30 font-semibold border border-white/10 focus:border-violet-400 outline-none transition-colors"
                        />
                        <button
                          type="submit"
                          className="px-4 py-3 rounded-xl bg-violet-500 hover:bg-violet-400 text-white font-bold text-lg transition-colors active:scale-95"
                        >
                          →
                        </button>
                      </form>
                    )}

                    {/* Correct guessers so far */}
                    {gameState.correctGuessers.length > 0 && (
                      <div className="flex items-center gap-2 mt-3 flex-wrap">
                        {gameState.correctGuessers.map(pid => {
                          const p = gameState.players.find(pl => pl.id === pid);
                          if (!p) return null;
                          return (
                            <div key={pid} className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/20">
                              <Avatar avatarId={p.avatar} size={14} color={p.color} />
                              <span className="text-xs font-semibold text-emerald-400">{p.name} ✓</span>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </>
                )}
              </>
            )}

            {/* ── RESULTS PHASE ── */}
            {gameState.phase === 'results' && (
              <ResultsView
                gameState={gameState}
                myId={myId}
                previousScores={previousScores}
              />
            )}
          </>
        )}
      </div>
    </main>
  );
}
