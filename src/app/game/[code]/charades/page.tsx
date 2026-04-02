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
import { useLocale } from '@/hooks/useLocale';
import { hapticTap, hapticCorrect, hapticCelebrate } from '@/lib/haptics';

const ROUND_TIME = 45;

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

interface CharadesWord {
  word: string;
  forbidden: string[];
}

interface GameState {
  phase: 'describing' | 'results' | 'leaderboard';
  currentRound: number;
  totalRounds: number;
  currentDescriberId: string;
  currentWord: CharadesWord | null; // null for non-describer during describing phase
  clues: string[];
  guesses: Record<string, { correct: boolean; guessedAt: number }>;
  correctGuessers: string[];
  scores: Record<string, number>;
  roundStartedAt: number;
  forbiddenUsed: boolean;
  players: Player[];
}

// ── Timer Bar ──────────────────────────────────────────────────────────────────

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
  const urgent = remaining <= 10;
  const critical = remaining <= 5;

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-1.5">
        <span className={`text-sm font-bold tabular-nums transition-colors ${
          critical ? 'text-red-400 animate-pulse' : urgent ? 'text-amber-400' : 'text-white/60'
        }`}>
          {Math.ceil(remaining)}s
        </span>
      </div>
      <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-100 ease-linear ${
            critical ? 'bg-red-500' : urgent ? 'bg-amber-400' : 'bg-teal-400'
          }`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

// ── Results View ───────────────────────────────────────────────────────────────

function ResultsView({
  gameState,
  myId,
  isHost,
  previousScores,
  roomCode,
  onNextRound,
  advancing,
}: {
  gameState: GameState;
  myId: string;
  isHost: boolean;
  previousScores: Record<string, number>;
  roomCode: string;
  onNextRound: () => void;
  advancing: boolean;
}) {
  const { t } = useLocale();
  const describer = gameState.players.find(p => p.id === gameState.currentDescriberId);
  const guesserIds = gameState.players.map(p => p.id).filter(id => id !== gameState.currentDescriberId);

  const rankLabel = (rank: number) => {
    if (rank === 1) return '1st';
    if (rank === 2) return '2nd';
    if (rank === 3) return '3rd';
    return `${rank}th`;
  };

  // Determine what word was — we show it from gameState.currentWord
  // After results phase, the server reveals the word to all players.
  const wordToShow = gameState.currentWord?.word ?? '???';
  const forbiddenToShow = gameState.currentWord?.forbidden ?? [];

  return (
    <div className="space-y-4" style={{ animation: 'slideUp 0.3s ease-out' }}>
      {/* Word reveal */}
      <div className="text-center">
        <p className="text-white/40 text-xs uppercase tracking-widest mb-1">{t('game.charades.theWordWas')}</p>
        <p className="font-display font-bold text-3xl text-teal-300 uppercase tracking-wider" style={{ animation: 'wordReveal 0.4s ease-out' }}>
          {wordToShow}
        </p>
        {forbiddenToShow.length > 0 && (
          <div className="flex items-center justify-center gap-2 mt-2 flex-wrap">
            {forbiddenToShow.map(f => (
              <span key={f} className="text-xs px-2 py-0.5 rounded-full bg-red-500/15 text-red-400 border border-red-500/20 line-through">
                {f}
              </span>
            ))}
          </div>
        )}
        {gameState.forbiddenUsed && (
          <p className="mt-2 text-xs text-red-400 font-semibold">{t('game.charades.forbiddenUsed')}</p>
        )}
      </div>

      {/* Guesser results */}
      <div className="space-y-2">
        {guesserIds.map(playerId => {
          const player = gameState.players.find(p => p.id === playerId);
          if (!player) return null;
          const rank = gameState.correctGuessers.indexOf(playerId);
          const correct = rank !== -1;
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
                  {correct ? `${rankLabel(rank + 1)} guess!` : "Didn't guess"}
                </p>
              </div>
              {gained > 0 && (
                <span className="text-emerald-400 font-display font-bold text-lg">+{gained}</span>
              )}
              <div className="text-right">
                <p className="text-sm font-bold text-white">{gameState.scores[playerId] || 0}</p>
                <p className="text-xs text-white/30">{t('common.pts')}</p>
              </div>
            </div>
          );
        })}

        {/* Describer row */}
        {describer && (() => {
          const prevPts = previousScores[describer.id] ?? gameState.scores[describer.id] ?? 0;
          const gained = (gameState.scores[describer.id] || 0) - prevPts;
          const isMe = describer.id === myId;
          return (
            <div
              className={`flex items-center gap-3 p-3 rounded-2xl ${
                isMe ? 'bg-white/8 ring-1 ring-white/10' : 'bg-white/[0.03]'
              }`}
            >
              <div
                className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
                style={{ backgroundColor: `${describer.color}20` }}
              >
                <Avatar avatarId={describer.avatar} size={26} color={describer.color} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm text-white truncate">{describer.name}</p>
                <p className="text-xs text-teal-400">Describer</p>
              </div>
              {gained > 0 && (
                <span className="text-emerald-400 font-display font-bold text-lg">+{gained}</span>
              )}
              <div className="text-right">
                <p className="text-sm font-bold text-white">{gameState.scores[describer.id] || 0}</p>
                <p className="text-xs text-white/30">{t('common.pts')}</p>
              </div>
            </div>
          );
        })()}
      </div>

      {/* Next round / waiting */}
      <div className="pt-2">
        {isHost ? (
          <button
            onClick={onNextRound}
            disabled={advancing}
            className="w-full py-4 px-6 rounded-2xl font-display font-semibold text-lg
              bg-gradient-to-r from-teal-500 to-cyan-500 text-white
              shadow-lg shadow-teal-500/25 active:scale-[0.98] transition-all duration-200 disabled:opacity-60"
          >
            {advancing ? t('common.starting') : (gameState.currentRound + 1 >= gameState.totalRounds ? 'See Final Scores →' : 'Next Round →')}
          </button>
        ) : (
          <div className="w-full py-4 px-6 rounded-2xl font-display font-semibold text-lg bg-white/5 text-white/30 text-center animate-pulse">
            {t('common.waitingForHost')}
          </div>
        )}
      </div>
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
  const { t } = useLocale();
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
    <div className="text-center" style={{ animation: 'slideUp 0.3s ease-out' }}>
      <h2 className="font-display font-bold text-3xl text-white mb-1">{t('common.gameOver')}</h2>
      <p className="text-white/40 text-sm mb-8">{t('common.finalScores')}</p>

      {/* Confetti */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {[...Array(12)].map((_, i) => (
          <div
            key={i}
            className="absolute w-2 h-2 rounded-full"
            style={{
              left: `${10 + Math.random() * 80}%`,
              top: '-5%',
              backgroundColor: ['#14b8a6', '#06b6d4', '#a855f7', '#ec4899', '#f97316', '#34d399'][i % 6],
              animation: `confettiFall ${1.5 + Math.random() * 1.5}s linear ${i * 0.15}s forwards`,
            }}
          />
        ))}
      </div>

      {podiumPlayers.length >= 2 && (
        <div className="mb-6">
          <Podium players={podiumPlayers} />
        </div>
      )}

      <div className="space-y-3 mb-8 relative">
        {sorted.map((player, index) => {
          const isMe = player.id === myId;
          const isWinner = index === 0;

          return (
            <div
              key={player.id}
              className={`flex items-center gap-3 p-4 rounded-2xl transition-all ${
                isWinner
                  ? 'bg-gradient-to-r from-teal-500/20 to-cyan-500/20 ring-1 ring-teal-400/30'
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
                <p className="text-xs text-white/30">{t('common.points')}</p>
              </div>
            </div>
          );
        })}
      </div>

      <div className="space-y-3">
        <ShareResults gameName={t('game.charades.name')} winnerName={sorted[0]?.name ?? ''} winnerScore={gameState.scores[sorted[0]?.id] || 0} />
        {isHost ? (
          <>
            <button
              onClick={handlePlayAgain}
              disabled={restarting}
              className="w-full py-4 px-6 rounded-2xl font-display font-semibold text-lg
                bg-gradient-to-r from-teal-500 to-cyan-500 text-white
                shadow-lg shadow-teal-500/25 active:scale-[0.98] transition-all duration-200 disabled:opacity-60"
            >
              {restarting ? t('common.starting') : t('common.playAgain')}
            </button>
            <button
              onClick={handleRematch}
              className="w-full py-3 text-white/30 text-sm hover:text-white/50 transition-colors"
            >
              {t('common.rematch')}
            </button>
          </>
        ) : (
          <>
            <div className="w-full py-4 px-6 rounded-2xl font-display font-semibold text-lg bg-white/5 text-white/30 text-center animate-pulse">
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

// ── Main Component ─────────────────────────────────────────────────────────────

export default function CharadesPage({ params }: { params: { code: string } }) {
  const router = useRouter();
  const { t } = useLocale();
  const [session] = useState(() => typeof window !== 'undefined' ? getSession() : null);
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [clueInput, setClueInput] = useState('');
  const [guessInput, setGuessInput] = useState('');
  const [hasGuessedCorrectly, setHasGuessedCorrectly] = useState(false);
  const [scorePopup, setScorePopup] = useState<{ points: number; key: number } | null>(null);
  const [previousScores, setPreviousScores] = useState<Record<string, number>>({});
  const [forbiddenWarning, setForbiddenWarning] = useState(false);
  const [advancing, setAdvancing] = useState(false);
  const [error, setError] = useState('');
  const [roomEnded, setRoomEnded] = useState(false);

  const guessInputRef = useRef<HTMLInputElement>(null);
  const clueInputRef = useRef<HTMLInputElement>(null);
  const timerExpiredRef = useRef(false);
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
        // Phase transition: describing → results
        if (prev && prev.phase === 'describing' && data.phase === 'results') {
          setPreviousScores({ ...prev.scores });
          if (!roundSoundPlayedRef.current) {
            roundSoundPlayedRef.current = true;
            playSound('round-end');
          }
        }

        // New round started
        if (data.phase === 'describing' && data.currentRound !== prevRoundRef.current) {
          prevRoundRef.current = data.currentRound;
          timerExpiredRef.current = false;
          roundSoundPlayedRef.current = false;
          setHasGuessedCorrectly(false);
          setGuessInput('');
          setClueInput('');
          setForbiddenWarning(false);
          setAdvancing(false);
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
    trackPageView('game-charades');
    fetchGameState();
    const interval = setInterval(fetchGameState, 1500);
    return () => clearInterval(interval);
  }, [fetchGameState]);

  // ── Timer expiration → force results ──────────────────────────────────────

  useEffect(() => {
    if (!gameState || gameState.phase !== 'describing') return;

    const elapsed = Date.now() - gameState.roundStartedAt;
    const remaining = ROUND_TIME * 1000 - elapsed;

    if (remaining <= 0 && !timerExpiredRef.current) {
      timerExpiredRef.current = true;
      fetch(`/api/rooms/${params.code}/advance-charades`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'force-results' }),
      });
      return;
    }

    const timer = setTimeout(() => {
      if (!timerExpiredRef.current) {
        timerExpiredRef.current = true;
        fetch(`/api/rooms/${params.code}/advance-charades`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'force-results' }),
        });
      }
    }, remaining);

    return () => clearTimeout(timer);
  }, [gameState?.phase, gameState?.currentRound, gameState?.roundStartedAt, params.code]);

  // ── Leaderboard reached ────────────────────────────────────────────────────

  useEffect(() => {
    if (gameState?.phase === 'leaderboard' && session?.playerId) {
      hapticCelebrate();
      saveGameResult({
        gameType: 'charades',
        roomCode: params.code,
        score: gameState.scores[session.playerId] ?? 0,
        date: new Date().toISOString(),
      });
      trackGameEnd('charades', gameState.scores[session.playerId] ?? 0, params.code);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gameState?.phase]);

  // ── Submit clue ────────────────────────────────────────────────────────────

  async function handleClueSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!session || !gameState || gameState.phase !== 'describing') return;

    const clue = clueInput.trim();
    if (!clue) return;

    setClueInput('');

    // Local forbidden word check for warning
    const clueLower = clue.toLowerCase();
    const wordLower = gameState.currentWord?.word.toLowerCase() ?? '';
    const isForbidden = wordLower && (
      clueLower.includes(wordLower) ||
      (gameState.currentWord?.forbidden ?? []).some(f => clueLower.includes(f.toLowerCase()))
    );
    if (isForbidden) {
      setForbiddenWarning(true);
    }

    hapticTap();

    await fetch(`/api/rooms/${params.code}/charades-clue`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ playerId: session.playerId, clue }),
    });

    clueInputRef.current?.focus();
  }

  // ── Submit guess ───────────────────────────────────────────────────────────

  async function handleGuessSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!session || !gameState || gameState.phase !== 'describing') return;
    if (hasGuessedCorrectly) return;

    const guess = guessInput.trim();
    if (!guess) return;

    setGuessInput('');

    const res = await fetch(`/api/rooms/${params.code}/charades-guess`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ playerId: session.playerId, guess }),
    });

    if (res.ok) {
      const data = await res.json();
      if (data.correct) {
        setHasGuessedCorrectly(true);
        hapticCorrect();
        playSound('correct');
        scorePopupKeyRef.current++;
        setScorePopup({ points: data.points, key: scorePopupKeyRef.current });
        setTimeout(() => setScorePopup(null), 1200);
      } else {
        hapticTap();
        playSound('wrong');
        guessInputRef.current?.focus();
      }
    } else {
      guessInputRef.current?.focus();
    }
  }

  // ── Next round ─────────────────────────────────────────────────────────────

  async function handleNextRound() {
    if (!session) return;
    setAdvancing(true);
    await fetch(`/api/rooms/${params.code}/advance-charades`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'advance' }),
    });
  }

  // ── Loading / error states ────────────────────────────────────────────────

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
          <button
            onClick={() => router.push(`/room/${params.code}`)}
            className="px-6 py-3 rounded-xl glass text-white font-semibold"
          >
            {t('common.backToLobby')}
          </button>
        </div>
      </main>
    );
  }

  if (!gameState) {
    return (
      <main className="min-h-[100dvh] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-teal-400 border-t-transparent rounded-full animate-spin" />
      </main>
    );
  }

  const isDescriber = myId === gameState.currentDescriberId;
  const isHost = gameState.players.find(p => p.id === myId)?.isHost ?? false;
  const describer = gameState.players.find(p => p.id === gameState.currentDescriberId);
  const describerLeft = gameState.phase === 'describing' && !gameState.players.some(p => p.id === gameState.currentDescriberId);
  const guesserCount = gameState.players.length - 1;
  const correctCount = gameState.correctGuessers.length;

  return (
    <main className="min-h-[100dvh] flex flex-col px-5 py-5 relative overflow-hidden">
      <style>{`
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(16px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes wordReveal {
          0% { opacity: 0; transform: scale(0.8) rotate(-2deg); }
          60% { transform: scale(1.05) rotate(1deg); }
          100% { opacity: 1; transform: scale(1) rotate(0deg); }
        }
        @keyframes scoreFly {
          0% { opacity: 0; transform: translateY(8px) scale(0.9); }
          30% { opacity: 1; transform: translateY(-6px) scale(1.1); }
          100% { opacity: 0; transform: translateY(-24px) scale(1); }
        }
        .animate-score-fly { animation: scoreFly 0.9s ease-out forwards; }
        @keyframes confettiFall {
          0% { transform: translateY(0) rotate(0deg); opacity: 1; }
          100% { transform: translateY(100vh) rotate(720deg); opacity: 0; }
        }
      `}</style>

      {/* Background */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-32 -left-32 w-80 h-80 bg-teal-600/15 rounded-full blur-3xl" />
        <div className="absolute -bottom-32 -right-32 w-64 h-64 bg-cyan-600/10 rounded-full blur-3xl" />
      </div>

      {/* How to Play */}
      <div className="fixed top-4 right-4 z-40">
        <HowToPlay gameId="charades" />
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

        {/* ── Describing / Results ── */}
        {gameState.phase !== 'leaderboard' && (
          <>
            {/* Header */}
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-display font-bold text-white">
                {t('common.round', { current: String(gameState.currentRound + 1), total: String(gameState.totalRounds) })}
              </span>
              <span className="text-xs font-semibold px-3 py-1 rounded-full bg-teal-500/20 text-teal-300">
                {t('game.charades.name')}
              </span>
              {/* Player scores mini */}
              <div className="flex items-center gap-1.5">
                {gameState.players.map(p => (
                  <div key={p.id} className="flex flex-col items-center gap-0.5">
                    <div
                      className={`w-7 h-7 rounded-full flex items-center justify-center ${
                        p.id === gameState.currentDescriberId ? 'ring-2 ring-teal-400' : ''
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

            {/* ── DESCRIBING PHASE ── */}
            {gameState.phase === 'describing' && (
              <>
                {describerLeft ? (
                  <div className="flex-1 flex items-center justify-center">
                    <p className="text-white/40 text-sm italic animate-pulse">{t('common.playerLeft')}</p>
                  </div>
                ) : isDescriber ? (
                  /* ── DESCRIBER VIEW ── */
                  <>
                    {/* Forbidden used warning */}
                    {(forbiddenWarning || gameState.forbiddenUsed) && (
                      <div className="mb-3 px-4 py-2.5 rounded-xl bg-red-500/15 border border-red-500/30 text-center">
                        <p className="text-red-400 text-sm font-semibold">{t('game.charades.forbiddenUsed')}</p>
                      </div>
                    )}

                    {/* Word + forbidden */}
                    <div className="text-center mb-3">
                      <p className="text-white/40 text-xs uppercase tracking-widest mb-1">{t('game.charades.describeWord')}</p>
                      <div className="inline-block px-6 py-3 rounded-2xl bg-teal-500/20 border border-teal-400/30 mb-3">
                        <span className="font-display font-bold text-2xl text-teal-200 uppercase tracking-widest">
                          {gameState.currentWord?.word ?? '...'}
                        </span>
                      </div>
                      <p className="text-white/40 text-xs uppercase tracking-widest mb-2">{t('game.charades.forbidden')}</p>
                      <div className="flex items-center justify-center gap-2 flex-wrap">
                        {(gameState.currentWord?.forbidden ?? []).map(f => (
                          <span key={f} className="text-sm px-3 py-1 rounded-full bg-red-500/15 text-red-400 border border-red-500/25 font-semibold line-through decoration-red-400">
                            {f}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Timer */}
                    <div className="mb-3">
                      <TimerBar startedAt={gameState.roundStartedAt} />
                    </div>

                    {/* Clues typed so far */}
                    {gameState.clues.length > 0 && (
                      <div className="mb-3 space-y-1">
                        <p className="text-white/40 text-xs uppercase tracking-widest">{t('game.charades.clues')}</p>
                        <div className="space-y-1 max-h-28 overflow-y-auto">
                          {gameState.clues.map((clue, i) => (
                            <div key={i} className="px-3 py-1.5 rounded-xl bg-white/5 text-white/70 text-sm">
                              {clue}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Clue input */}
                    <form onSubmit={handleClueSubmit} className="flex gap-2 mb-3">
                      <input
                        ref={clueInputRef}
                        type="text"
                        value={clueInput}
                        onChange={e => setClueInput(e.target.value)}
                        placeholder={t('game.charades.typeClue')}
                        autoComplete="off"
                        autoFocus
                        className="flex-1 px-4 py-3 rounded-xl bg-white/10 text-white placeholder-white/30 font-semibold border border-white/10 focus:border-teal-400 outline-none transition-colors"
                      />
                      <button
                        type="submit"
                        className="px-4 py-3 rounded-xl bg-teal-500 hover:bg-teal-400 text-white font-bold text-lg transition-colors active:scale-95"
                      >
                        →
                      </button>
                    </form>

                    {/* Guesser progress */}
                    <div className="flex items-center gap-2 flex-wrap">
                      {gameState.players
                        .filter(p => p.id !== gameState.currentDescriberId)
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
                        {t('game.charades.guessing', { name: describer?.name ?? 'Someone' })}
                      </p>
                    </div>

                    {/* Timer */}
                    <div className="mb-3">
                      <TimerBar startedAt={gameState.roundStartedAt} />
                    </div>

                    {/* Clues list */}
                    <div className="mb-3">
                      <p className="text-white/40 text-xs uppercase tracking-widest mb-2">{t('game.charades.clues')}</p>
                      <div className="min-h-24 space-y-1.5">
                        {gameState.clues.length === 0 ? (
                          <p className="text-white/20 text-sm italic">{t('game.charades.noCluesYet')}</p>
                        ) : (
                          gameState.clues.map((clue, i) => (
                            <div key={i} className="px-3 py-2 rounded-xl bg-white/8 text-white text-sm font-medium">
                              {clue}
                            </div>
                          ))
                        )}
                      </div>
                    </div>

                    {/* Score popup */}
                    <div className="h-9 flex items-center justify-center">
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
                        <p className="font-display font-bold text-emerald-400 text-lg">{t('game.charades.correctGuess')}</p>
                        <p className="text-white/40 text-sm mt-0.5">Waiting for others...</p>
                      </div>
                    ) : (
                      <form onSubmit={handleGuessSubmit} className="flex gap-2 mt-2">
                        <input
                          ref={guessInputRef}
                          type="text"
                          value={guessInput}
                          onChange={e => setGuessInput(e.target.value)}
                          placeholder={t('game.charades.typeGuess')}
                          autoComplete="off"
                          autoFocus
                          className="flex-1 px-4 py-3 rounded-xl bg-white/10 text-white placeholder-white/30 font-semibold border border-white/10 focus:border-teal-400 outline-none transition-colors"
                        />
                        <button
                          type="submit"
                          className="px-4 py-3 rounded-xl bg-teal-500 hover:bg-teal-400 text-white font-bold text-lg transition-colors active:scale-95"
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
                isHost={isHost}
                previousScores={previousScores}
                roomCode={params.code}
                onNextRound={handleNextRound}
                advancing={advancing}
              />
            )}
          </>
        )}
      </div>
    </main>
  );
}
