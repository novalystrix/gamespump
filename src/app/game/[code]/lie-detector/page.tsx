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

    if (name === 'suspense') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(220, now);
      osc.frequency.linearRampToValueAtTime(260, now + 0.8);
      osc.frequency.linearRampToValueAtTime(220, now + 1.6);
      gain.gain.setValueAtTime(0.08, now);
      gain.gain.linearRampToValueAtTime(0.12, now + 0.8);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 1.6);
      osc.start(now); osc.stop(now + 1.6);
    } else if (name === 'reveal') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(300, now);
      osc.frequency.linearRampToValueAtTime(600, now + 0.15);
      osc.frequency.setValueAtTime(800, now + 0.3);
      gain.gain.setValueAtTime(0.25, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
      osc.start(now); osc.stop(now + 0.5);
    } else if (name === 'correct') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(523, now);
      osc.frequency.setValueAtTime(659, now + 0.12);
      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
      osc.start(now); osc.stop(now + 0.25);
    } else if (name === 'wrong') {
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(200, now);
      osc.frequency.linearRampToValueAtTime(150, now + 0.2);
      gain.gain.setValueAtTime(0.12, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
      osc.start(now); osc.stop(now + 0.2);
    } else if (name === 'vote') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(500, now);
      gain.gain.setValueAtTime(0.15, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.06);
      osc.start(now); osc.stop(now + 0.06);
    } else if (name === 'win') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(523, now);
      osc.frequency.setValueAtTime(659, now + 0.15);
      osc.frequency.setValueAtTime(784, now + 0.3);
      osc.frequency.setValueAtTime(1047, now + 0.45);
      gain.gain.setValueAtTime(0.3, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.6);
      osc.start(now); osc.stop(now + 0.6);
    } else if (name === 'countdown') {
      osc.type = 'square';
      osc.frequency.setValueAtTime(440, now);
      gain.gain.setValueAtTime(0.15, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
      osc.start(now); osc.stop(now + 0.08);
    }
  } catch {
    // silently ignore
  }
}

const VOTE_TIME = 15;

interface LieDetectorState {
  gameType: 'lie-detector';
  phase: 'statement' | 'voting' | 'reveal' | 'results' | 'leaderboard';
  currentRound: number;
  totalRounds: number;
  currentSpeakerId: string;
  prompt: string;
  statement: string | null;
  speakerTruth: boolean | null;
  votes: string[] | Record<string, { vote: 'truth' | 'lie'; votedAt: number }>;
  scores: Record<string, number>;
  roundStartedAt: number;
  players: Player[];
}

function TimerBar({ startedAt }: { startedAt: number }) {
  const [remaining, setRemaining] = useState(VOTE_TIME);
  const lastCountdownTickRef = useRef(-1);

  useEffect(() => {
    trackPageView('game-lie-detector');
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
      <div className="flex items-center justify-between mb-1">
        <span className={`text-sm font-bold tabular-nums transition-colors duration-300 ${
          urgent ? 'text-red-400' : 'text-white/60'
        }`}>
          {Math.ceil(remaining)}s
        </span>
      </div>
      <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-100 ease-linear ${
            urgent ? 'bg-red-500' : 'bg-orange-400'
          }`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

function StatementPhase({
  gameState,
  myId,
  roomCode,
  session,
}: {
  gameState: LieDetectorState;
  myId: string;
  roomCode: string;
  session: { playerId: string } | null;
}) {
  const [text, setText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [choiceStep, setChoiceStep] = useState(false);
  const isSpeaker = myId === gameState.currentSpeakerId;
  const speaker = gameState.players.find(p => p.id === gameState.currentSpeakerId);

  async function handleSubmitStatement(isTrue: boolean) {
    if (!session || submitting) return;
    setSubmitting(true);
    await fetch(`/api/rooms/${roomCode}/lie-detector`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        playerId: session.playerId,
        action: 'submit-statement',
        statement: text.trim(),
        isTrue,
      }),
    });
    setSubmitting(false);
  }

  if (isSpeaker) {
    return (
      <div className="animate-slide-up flex-1 flex flex-col">
        {/* Spotlight effect */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-64 h-64 bg-orange-500/10 rounded-full blur-[80px]" />
        </div>

        <div className="text-center mb-6 relative z-10">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-orange-500/20 text-orange-300 text-sm font-semibold mb-4">
            🎤 You&apos;re the Speaker
          </div>
          <p className="text-white/50 text-sm italic">&ldquo;{gameState.prompt}&rdquo;</p>
        </div>

        {!choiceStep ? (
          <div className="flex-1 flex flex-col gap-4 relative z-10">
            <p className="text-white/70 text-sm text-center">
              Tell the group something about yourself — true or made up!
            </p>
            <textarea
              value={text}
              onChange={e => setText(e.target.value)}
              placeholder="Type your statement..."
              maxLength={200}
              className="w-full h-32 rounded-2xl bg-white/5 border border-white/10 p-4 text-white placeholder:text-white/25 resize-none focus:outline-none focus:border-orange-400/50 transition-colors"
            />
            <div className="text-right text-xs text-white/30">{text.length}/200</div>
            <button
              onClick={() => setChoiceStep(true)}
              disabled={text.trim().length < 3}
              className="w-full py-4 rounded-2xl font-display font-semibold text-lg bg-gradient-to-r from-red-500 to-orange-500 text-white shadow-lg shadow-orange-500/25 active:scale-[0.98] transition-all disabled:opacity-40"
            >
              Continue
            </button>
          </div>
        ) : (
          <div className="flex-1 flex flex-col gap-4 relative z-10">
            <div className="rounded-2xl bg-white/5 border border-white/10 p-4 mb-2">
              <p className="text-white text-sm">&ldquo;{text.trim()}&rdquo;</p>
            </div>
            <p className="text-white/60 text-sm text-center font-semibold">
              Is this statement true or a lie?
            </p>
            <p className="text-white/30 text-xs text-center">
              (Only you know — this is hidden from other players)
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => handleSubmitStatement(true)}
                disabled={submitting}
                className="flex-1 py-4 rounded-2xl font-display font-bold text-lg bg-gradient-to-br from-emerald-500 to-green-600 text-white shadow-lg shadow-emerald-500/25 active:scale-[0.98] transition-all disabled:opacity-60"
              >
                ✅ It&apos;s True
              </button>
              <button
                onClick={() => handleSubmitStatement(false)}
                disabled={submitting}
                className="flex-1 py-4 rounded-2xl font-display font-bold text-lg bg-gradient-to-br from-red-500 to-rose-600 text-white shadow-lg shadow-red-500/25 active:scale-[0.98] transition-all disabled:opacity-60"
              >
                🎭 It&apos;s a Lie
              </button>
            </div>
            <button
              onClick={() => setChoiceStep(false)}
              className="text-white/30 text-sm hover:text-white/50 transition-colors"
            >
              ← Edit statement
            </button>
          </div>
        )}
      </div>
    );
  }

  // Other players waiting
  return (
    <div className="animate-slide-up flex-1 flex flex-col items-center justify-center">
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-48 h-48 bg-purple-500/8 rounded-full blur-[60px]" />
      </div>

      <div className="relative z-10 text-center">
        {speaker && (
          <div className="mb-4">
            <div className="w-16 h-16 rounded-full mx-auto flex items-center justify-center mb-3" style={{ backgroundColor: `${speaker.color}20` }}>
              <Avatar avatarId={speaker.avatar} size={48} color={speaker.color} />
            </div>
          </div>
        )}
        <p className="text-white/70 text-lg font-display font-semibold mb-2">
          {speaker?.name} is thinking...
        </p>
        <p className="text-white/30 text-sm">
          Waiting for their statement
        </p>
        <div className="mt-6 flex items-center justify-center gap-1.5">
          {[0, 1, 2].map(i => (
            <div
              key={i}
              className="w-2.5 h-2.5 rounded-full bg-orange-400/60"
              style={{
                animation: `pulse 1.4s ease-in-out ${i * 0.2}s infinite`,
              }}
            />
          ))}
        </div>
      </div>
      <style>{`
        @keyframes pulse {
          0%, 80%, 100% { opacity: 0.3; transform: scale(0.8); }
          40% { opacity: 1; transform: scale(1.2); }
        }
      `}</style>
    </div>
  );
}

function VotingPhase({
  gameState,
  myId,
  roomCode,
  session,
  myVote,
  setMyVote,
}: {
  gameState: LieDetectorState;
  myId: string;
  roomCode: string;
  session: { playerId: string } | null;
  myVote: 'truth' | 'lie' | null;
  setMyVote: (v: 'truth' | 'lie') => void;
}) {
  const isSpeaker = myId === gameState.currentSpeakerId;
  const speaker = gameState.players.find(p => p.id === gameState.currentSpeakerId);
  const votedIds = Array.isArray(gameState.votes) ? gameState.votes : Object.keys(gameState.votes);
  const nonSpeakers = gameState.players.filter(p => p.id !== gameState.currentSpeakerId);

  async function handleVote(vote: 'truth' | 'lie') {
    if (!session || myVote !== null) return;
    setMyVote(vote);
    playSound('vote');
    await fetch(`/api/rooms/${roomCode}/lie-detector`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        playerId: session.playerId,
        action: 'vote',
        vote,
      }),
    });
  }

  return (
    <div className="animate-slide-up flex-1 flex flex-col">
      <TimerBar startedAt={gameState.roundStartedAt} />

      {/* Statement bubble */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-3">
          {speaker && (
            <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ backgroundColor: `${speaker.color}20` }}>
              <Avatar avatarId={speaker.avatar} size={24} color={speaker.color} />
            </div>
          )}
          <span className="text-sm font-semibold text-white/70">{speaker?.name} says:</span>
        </div>
        <div className="rounded-2xl bg-white/[0.06] border border-white/10 p-5 relative">
          <p className="text-white text-lg font-display leading-relaxed">
            &ldquo;{gameState.statement}&rdquo;
          </p>
          {/* Quote decoration */}
          <div className="absolute -top-2 -left-1 text-4xl text-orange-400/20 font-serif">&ldquo;</div>
        </div>
      </div>

      {isSpeaker ? (
        <div className="flex-1 flex flex-col items-center justify-center">
          <div className="text-center">
            <p className="text-white/50 text-sm mb-2">Waiting for votes...</p>
            <p className="text-white/70 font-display font-bold text-lg">
              {votedIds.length}/{nonSpeakers.length} voted
            </p>
            <div className="flex items-center justify-center gap-2 mt-4">
              {nonSpeakers.map(p => (
                <div
                  key={p.id}
                  className={`w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300 ${
                    votedIds.includes(p.id) ? 'scale-100 opacity-100 ring-2 ring-orange-400/50' : 'scale-90 opacity-40'
                  }`}
                  style={{ backgroundColor: `${p.color}20` }}
                >
                  <Avatar avatarId={p.avatar} size={20} color={p.color} />
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : myVote !== null ? (
        <div className="flex-1 flex flex-col items-center justify-center">
          <div className="text-center">
            <p className="text-white/40 text-sm mb-1">You voted:</p>
            <p className={`font-display font-bold text-2xl ${myVote === 'truth' ? 'text-emerald-400' : 'text-red-400'}`}>
              {myVote === 'truth' ? '🟢 TRUTH' : '🔴 LIE'}
            </p>
            <p className="text-white/30 text-sm mt-3 animate-pulse">
              Waiting for others... ({votedIds.length}/{nonSpeakers.length})
            </p>
          </div>
        </div>
      ) : (
        <div className="flex-1 flex flex-col gap-4">
          <p className="text-center text-white/50 text-sm font-semibold">What do you think?</p>
          <button
            onClick={() => handleVote('truth')}
            className="flex-1 rounded-2xl font-display font-bold text-2xl text-white min-h-[100px]
              bg-gradient-to-br from-emerald-500 to-green-600 hover:from-emerald-400 hover:to-green-500
              shadow-lg shadow-emerald-500/20 active:scale-[0.97] transition-all flex items-center justify-center gap-3"
          >
            🟢 TRUTH
          </button>
          <button
            onClick={() => handleVote('lie')}
            className="flex-1 rounded-2xl font-display font-bold text-2xl text-white min-h-[100px]
              bg-gradient-to-br from-red-500 to-rose-600 hover:from-red-400 hover:to-rose-500
              shadow-lg shadow-red-500/20 active:scale-[0.97] transition-all flex items-center justify-center gap-3"
          >
            🔴 LIE
          </button>
        </div>
      )}
    </div>
  );
}

function RevealPhase({
  gameState,
  myId,
}: {
  gameState: LieDetectorState;
  myId: string;
}) {
  const speaker = gameState.players.find(p => p.id === gameState.currentSpeakerId);
  const isTruth = gameState.speakerTruth === true;
  const votes = gameState.votes as Record<string, { vote: 'truth' | 'lie'; votedAt: number }>;
  const nonSpeakers = gameState.players.filter(p => p.id !== gameState.currentSpeakerId);
  const truthAnswer = isTruth ? 'truth' : 'lie';

  return (
    <div className="animate-slide-up flex-1 flex flex-col">
      <style>{`
        @keyframes reveal-stamp {
          0% { transform: scale(3) rotate(-15deg); opacity: 0; }
          60% { transform: scale(1.1) rotate(2deg); opacity: 1; }
          100% { transform: scale(1) rotate(0deg); opacity: 1; }
        }
        .animate-reveal-stamp { animation: reveal-stamp 0.5s ease-out forwards; }
      `}</style>

      {/* Statement */}
      <div className="mb-4">
        <div className="flex items-center gap-2 mb-2">
          {speaker && (
            <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ backgroundColor: `${speaker.color}20` }}>
              <Avatar avatarId={speaker.avatar} size={24} color={speaker.color} />
            </div>
          )}
          <span className="text-sm font-semibold text-white/70">{speaker?.name} said:</span>
        </div>
        <div className="rounded-2xl bg-white/[0.06] border border-white/10 p-4">
          <p className="text-white text-base">&ldquo;{gameState.statement}&rdquo;</p>
        </div>
      </div>

      {/* Big reveal stamp */}
      <div className="flex justify-center mb-6">
        <div className={`animate-reveal-stamp px-8 py-4 rounded-2xl font-display font-black text-3xl ${
          isTruth
            ? 'bg-emerald-500/20 text-emerald-400 border-2 border-emerald-400/50'
            : 'bg-red-500/20 text-red-400 border-2 border-red-400/50'
        }`}>
          {isTruth ? '✅ TRUE' : '🎭 LIE'}
        </div>
      </div>

      {/* Who got it right/wrong */}
      <div className="space-y-2">
        {nonSpeakers.map(player => {
          const v = votes[player.id];
          const correct = v ? v.vote === truthAnswer : false;
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
              {v ? (
                <span className={`text-sm font-bold ${correct ? 'text-emerald-400' : 'text-red-400'}`}>
                  {correct ? '✓' : '✗'} {v.vote === 'truth' ? 'Truth' : 'Lie'}
                </span>
              ) : (
                <span className="text-xs text-white/30">No vote</span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ResultsPhase({
  gameState,
  myId,
  previousScores,
}: {
  gameState: LieDetectorState;
  myId: string;
  previousScores: Record<string, number>;
}) {
  return (
    <div className="animate-slide-up flex-1 flex flex-col">
      <h2 className="font-display font-bold text-lg text-white mb-4 text-center">Round {gameState.currentRound + 1} Results</h2>
      <div className="space-y-2">
        {[...gameState.players]
          .sort((a, b) => (gameState.scores[b.id] || 0) - (gameState.scores[a.id] || 0))
          .map(player => {
            const pointsGained = (gameState.scores[player.id] || 0) - (previousScores[player.id] || 0);
            const isMe = player.id === myId;
            const isSpeaker = player.id === gameState.currentSpeakerId;

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
                <div className="flex-1 min-w-0">
                  <span className="text-sm font-semibold text-white truncate block">{player.name}</span>
                  {isSpeaker && <span className="text-xs text-orange-400">Speaker</span>}
                </div>
                {pointsGained > 0 && (
                  <span className="text-emerald-400 font-bold text-sm animate-points-fly">+{pointsGained}</span>
                )}
                <span className="text-sm font-bold text-white">{gameState.scores[player.id] || 0}</span>
              </div>
            );
          })}
      </div>
      <p className="text-center text-white/30 text-xs mt-4 animate-pulse">Next round starting...</p>
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
  gameState: LieDetectorState;
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

      {/* Confetti */}
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
        <ShareResults gameName="Lie Detector" winnerName={sorted[0]?.name ?? ''} winnerScore={gameState.scores[sorted[0]?.id] || 0} />
        {isHost ? (
          <>
            <button
              onClick={handlePlayAgain}
              disabled={restarting}
              className="w-full py-4 px-6 rounded-2xl font-display font-semibold text-lg
                bg-gradient-to-r from-red-500 to-orange-500 text-white
                shadow-lg shadow-orange-500/25
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

export default function LieDetectorPage({ params }: { params: { code: string } }) {
  const router = useRouter();
  const [session] = useState(() => typeof window !== 'undefined' ? getSession() : null);
  const [gameState, setGameState] = useState<LieDetectorState | null>(null);
  const [myVote, setMyVote] = useState<'truth' | 'lie' | null>(null);
  const [error, setError] = useState('');
  const [roomEnded, setRoomEnded] = useState(false);
  const [previousScores, setPreviousScores] = useState<Record<string, number>>({});
  const prevRoundRef = useRef<number>(-1);
  const prevPhaseRef = useRef<string | null>(null);
  const timerExpiredRef = useRef(false);
  const autoAdvanceRef = useRef<NodeJS.Timeout | null>(null);
  const revealAdvanceRef = useRef<NodeJS.Timeout | null>(null);

  const fetchGameState = useCallback(async () => {
    try {
      const res = await fetch(`/api/rooms/${params.code}/game-state?pid=${session?.playerId || ''}`);
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
      if (data.gameType !== 'lie-detector') {
        router.push(`/room/${params.code}`);
        return;
      }

      setGameState(prev => {
        // Track score changes for results display
        if (prev && prev.phase === 'reveal' && data.phase === 'results') {
          setPreviousScores(prev.scores);
        }
        // Reset vote on new round
        if (data.currentRound !== prevRoundRef.current) {
          setMyVote(null);
          timerExpiredRef.current = false;
          prevRoundRef.current = data.currentRound;
        }
        return data as LieDetectorState;
      });
    } catch {
      // silently retry
    }
  }, [params.code, router, session?.playerId]);

  useEffect(() => {
    fetchGameState();
    const interval = setInterval(fetchGameState, 1000);
    return () => clearInterval(interval);
  }, [fetchGameState]);

  // Timer expiration for voting
  useEffect(() => {
    if (!gameState || gameState.phase !== 'voting') return;

    const elapsed = Date.now() - gameState.roundStartedAt;
    const remaining = VOTE_TIME * 1000 - elapsed;

    if (remaining <= 0 && !timerExpiredRef.current) {
      timerExpiredRef.current = true;
      fetch(`/api/rooms/${params.code}/lie-detector`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'force-voting' }),
      });
      return;
    }

    const timer = setTimeout(() => {
      if (!timerExpiredRef.current) {
        timerExpiredRef.current = true;
        fetch(`/api/rooms/${params.code}/lie-detector`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'force-voting' }),
        });
      }
    }, remaining);

    return () => clearTimeout(timer);
  }, [gameState?.phase, gameState?.currentRound, gameState?.roundStartedAt, params.code]);

  // Auto-advance from reveal → results (4s)
  useEffect(() => {
    if (!gameState || gameState.phase !== 'reveal') {
      if (revealAdvanceRef.current) {
        clearTimeout(revealAdvanceRef.current);
        revealAdvanceRef.current = null;
      }
      return;
    }
    if (revealAdvanceRef.current) return;

    revealAdvanceRef.current = setTimeout(() => {
      revealAdvanceRef.current = null;
      fetch(`/api/rooms/${params.code}/lie-detector`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'advance' }),
      });
    }, 4000);

    return () => {
      if (revealAdvanceRef.current) {
        clearTimeout(revealAdvanceRef.current);
        revealAdvanceRef.current = null;
      }
    };
  }, [gameState?.phase, gameState?.currentRound, params.code]);

  // Auto-advance from results → next round (3s)
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
      fetch(`/api/rooms/${params.code}/lie-detector`, {
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
  }, [gameState?.phase, gameState?.currentRound, params.code]);

  // Sound effects
  useEffect(() => {
    if (!gameState) return;
    const phase = gameState.phase;
    const prev = prevPhaseRef.current;

    if (phase === 'voting' && prev === 'statement') {
      playSound('suspense');
    } else if (phase === 'reveal' && prev === 'voting') {
      playSound('reveal');
      // Check if user was correct
      const votes = gameState.votes as Record<string, { vote: 'truth' | 'lie'; votedAt: number }>;
      const myVoteData = session?.playerId ? votes[session.playerId] : null;
      if (myVoteData && gameState.speakerTruth !== null) {
        const correctAnswer = gameState.speakerTruth ? 'truth' : 'lie';
        setTimeout(() => playSound(myVoteData.vote === correctAnswer ? 'correct' : 'wrong'), 500);
      }
    } else if (phase === 'leaderboard' && prev !== 'leaderboard') {
      playSound('win');
    }

    prevPhaseRef.current = phase;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gameState?.phase]);

  // Save game result
  useEffect(() => {
    if (gameState?.phase === 'leaderboard' && session?.playerId) {
      saveGameResult({
        gameType: 'lie-detector',
        roomCode: params.code,
        score: gameState.scores[session.playerId] ?? 0,
        date: new Date().toISOString(),
      });
      trackGameEnd('lie-detector', gameState.scores[session.playerId] ?? 0, params.code);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gameState?.phase]);

  if (roomEnded) {
    return (
      <main className="min-h-[100dvh] flex items-center justify-center px-6">
        <div className="text-center">
          <div className="text-4xl mb-4">🏁</div>
          <h2 className="text-xl font-display font-bold text-white mb-2">This room has ended</h2>
          <p className="text-white/50 text-sm mb-6">The game session is no longer available.</p>
          <button onClick={() => router.push('/')} className="px-6 py-3 rounded-xl glass text-white font-semibold">
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
          <div className="w-10 h-10 border-2 border-orange-400 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-white/50 text-sm font-body">Loading game...</p>
        </div>
      </main>
    );
  }

  const isHost = gameState.players.find(p => p.id === session?.playerId)?.isHost ?? false;
  const myId = session?.playerId || '';

  return (
    <main className="min-h-[100dvh] flex flex-col px-6 py-6 relative overflow-hidden">
      {/* Background */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-32 -left-32 w-80 h-80 bg-red-600/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-32 -right-32 w-64 h-64 bg-orange-600/10 rounded-full blur-3xl" />
      </div>

      {/* How to Play */}
      <div className="fixed top-4 right-4 z-40">
        <HowToPlay gameId="lie-detector" />
      </div>

      <div className="relative z-10 w-full max-w-sm mx-auto flex flex-col flex-1">
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

        {gameState.phase !== 'leaderboard' && (
          <>
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm font-display font-bold text-white">
                Round {gameState.currentRound + 1}/{gameState.totalRounds}
              </span>
              <span className="text-xs font-semibold px-3 py-1 rounded-full bg-orange-500/20 text-orange-300">
                {gameState.phase === 'statement' ? '🎤 Statement' :
                 gameState.phase === 'voting' ? '🗳️ Voting' :
                 gameState.phase === 'reveal' ? '👁️ Reveal' :
                 '📊 Results'}
              </span>
            </div>

            {gameState.phase === 'statement' && (
              <StatementPhase gameState={gameState} myId={myId} roomCode={params.code} session={session} />
            )}

            {gameState.phase === 'voting' && (
              <VotingPhase gameState={gameState} myId={myId} roomCode={params.code} session={session} myVote={myVote} setMyVote={setMyVote} />
            )}

            {gameState.phase === 'reveal' && (
              <RevealPhase gameState={gameState} myId={myId} />
            )}

            {gameState.phase === 'results' && (
              <ResultsPhase gameState={gameState} myId={myId} previousScores={previousScores} />
            )}
          </>
        )}
      </div>
    </main>
  );
}
