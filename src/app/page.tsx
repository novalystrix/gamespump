'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { getSession, generatePlayerId, saveSession } from '@/lib/session';
import { GamepadIcon, SparkleIcon } from '@/components/icons/GameIcons';

function HeroIllustration() {
  return (
    <div className="relative w-64 h-64 mx-auto mb-8">
      {/* Floating cute animals */}
      <div className="relative w-full h-full">
        {/* Center bunny */}
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 animate-float">
          <svg width="80" height="80" viewBox="0 0 48 48">
            <ellipse cx="16" cy="10" rx="5" ry="10" fill="#a855f7" />
            <ellipse cx="32" cy="10" rx="5" ry="10" fill="#a855f7" />
            <ellipse cx="16" cy="10" rx="3" ry="7" fill="white" opacity="0.3" />
            <ellipse cx="32" cy="10" rx="3" ry="7" fill="white" opacity="0.3" />
            <circle cx="24" cy="28" r="16" fill="#a855f7" />
            <circle cx="24" cy="28" r="16" fill="white" opacity="0.1" />
            <circle cx="18" cy="26" r="2.5" fill="white" />
            <circle cx="30" cy="26" r="2.5" fill="white" />
            <circle cx="18" cy="26" r="1.5" fill="#1a1a2e" />
            <circle cx="30" cy="26" r="1.5" fill="#1a1a2e" />
            <ellipse cx="24" cy="31" rx="2" ry="1.5" fill="#f8a4c8" />
            <circle cx="15" cy="31" r="3" fill="#f8a4c8" opacity="0.3" />
            <circle cx="33" cy="31" r="3" fill="#f8a4c8" opacity="0.3" />
          </svg>
        </div>
        {/* Top-left kitty */}
        <div className="absolute left-2 top-4 animate-float-delayed">
          <svg width="48" height="48" viewBox="0 0 48 48">
            <polygon points="10,18 6,4 18,14" fill="#22d3ee" />
            <polygon points="38,18 42,4 30,14" fill="#22d3ee" />
            <circle cx="24" cy="28" r="16" fill="#22d3ee" />
            <circle cx="24" cy="28" r="16" fill="white" opacity="0.1" />
            <circle cx="18" cy="26" r="2.5" fill="white" />
            <circle cx="30" cy="26" r="2.5" fill="white" />
            <circle cx="18" cy="26.5" r="1.5" fill="#1a1a2e" />
            <circle cx="30" cy="26.5" r="1.5" fill="#1a1a2e" />
            <ellipse cx="24" cy="31" rx="1.5" ry="1" fill="#1a1a2e" />
          </svg>
        </div>
        {/* Right fox */}
        <div className="absolute right-0 top-12 animate-float" style={{ animationDelay: '1s' }}>
          <svg width="44" height="44" viewBox="0 0 48 48">
            <polygon points="8,18 4,2 18,14" fill="#f97316" />
            <polygon points="40,18 44,2 30,14" fill="#f97316" />
            <circle cx="24" cy="28" r="16" fill="#f97316" />
            <circle cx="24" cy="28" r="16" fill="white" opacity="0.08" />
            <ellipse cx="24" cy="33" rx="10" ry="8" fill="white" opacity="0.25" />
            <circle cx="18" cy="26" r="2" fill="white" />
            <circle cx="30" cy="26" r="2" fill="white" />
            <circle cx="18" cy="26.5" r="1.5" fill="#1a1a2e" />
            <circle cx="30" cy="26.5" r="1.5" fill="#1a1a2e" />
            <circle cx="24" cy="31" r="2" fill="#1a1a2e" />
          </svg>
        </div>
        {/* Bottom-left penguin */}
        <div className="absolute left-6 bottom-4 animate-pulse-glow">
          <svg width="36" height="36" viewBox="0 0 48 48">
            <ellipse cx="24" cy="28" rx="16" ry="17" fill="#6366f1" />
            <ellipse cx="24" cy="32" rx="10" ry="12" fill="white" opacity="0.9" />
            <circle cx="18" cy="22" r="3" fill="white" />
            <circle cx="30" cy="22" r="3" fill="white" />
            <circle cx="18" cy="22.5" r="2" fill="#1a1a2e" />
            <circle cx="30" cy="22.5" r="2" fill="#1a1a2e" />
            <polygon points="24,26 20,29 28,29" fill="#f59e0b" />
          </svg>
        </div>
        {/* Bottom-right bear */}
        <div className="absolute right-4 bottom-2 animate-pulse-glow" style={{ animationDelay: '0.5s' }}>
          <svg width="32" height="32" viewBox="0 0 48 48">
            <circle cx="10" cy="14" r="6" fill="#ec4899" />
            <circle cx="38" cy="14" r="6" fill="#ec4899" />
            <circle cx="24" cy="28" r="16" fill="#ec4899" />
            <circle cx="24" cy="28" r="16" fill="white" opacity="0.1" />
            <ellipse cx="24" cy="32" rx="7" ry="5" fill="white" opacity="0.3" />
            <circle cx="18" cy="26" r="2" fill="#1a1a2e" />
            <circle cx="30" cy="26" r="2" fill="#1a1a2e" />
            <ellipse cx="24" cy="30" rx="2.5" ry="2" fill="#1a1a2e" />
          </svg>
        </div>
        {/* Sparkle dots */}
        <div className="absolute left-16 top-0 w-1.5 h-1.5 bg-white rounded-full opacity-60 animate-pulse-glow" />
        <div className="absolute right-12 top-6 w-1 h-1 bg-white rounded-full opacity-40 animate-pulse-glow" />
        <div className="absolute left-0 bottom-16 w-1 h-1 bg-white rounded-full opacity-50 animate-pulse-glow" />
      </div>
    </div>
  );
}

function BackgroundDecor() {
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden">
      {/* Gradient orbs */}
      <div className="absolute -top-32 -left-32 w-96 h-96 bg-purple-600/20 rounded-full blur-3xl" />
      <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-fuchsia-600/15 rounded-full blur-3xl" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-indigo-600/10 rounded-full blur-3xl" />
    </div>
  );
}

export default function Home() {
  const router = useRouter();
  const [joinCode, setJoinCode] = useState('');
  const [showJoin, setShowJoin] = useState(false);
  const [creating, setCreating] = useState(false);

  async function handleHost() {
    setCreating(true);
    try {
      let session = getSession();
      if (!session) {
        const playerId = generatePlayerId();
        session = { playerId, name: '', avatar: 'crystal', color: '#a855f7' };
        saveSession(session);
      }

      const res = await fetch('/api/rooms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ hostId: session.playerId }),
      });
      const data = await res.json();
      if (data.code) {
        router.push(`/join/${data.code}?host=true`);
      }
    } catch (err) {
      console.error('Failed to create room', err);
    } finally {
      setCreating(false);
    }
  }

  function handleJoin() {
    if (joinCode.length === 4) {
      router.push(`/join/${joinCode}`);
    }
  }

  return (
    <main className="min-h-[100dvh] flex flex-col items-center justify-center px-6 py-12 relative">
      <BackgroundDecor />
      
      <div className="relative z-10 w-full max-w-sm mx-auto page-transition">
        <HeroIllustration />
        
        {/* Logo & title */}
        <div className="text-center mb-10">
          <div className="flex items-center justify-center gap-2 mb-3">
            <GamepadIcon className="w-8 h-8 text-purple-400" />
            <h1 className="text-4xl font-display font-bold text-gradient">
              GamesPump
            </h1>
          </div>
          <p className="text-white/50 text-sm font-body">
            No signup. No downloads. Just play.
          </p>
        </div>

        {/* Action buttons */}
        <div className="space-y-3">
          <button
            onClick={handleHost}
            disabled={creating}
            className="w-full py-4 px-6 rounded-2xl font-display font-semibold text-lg
              bg-gradient-to-r from-purple-500 to-fuchsia-500 text-white
              hover:from-purple-400 hover:to-fuchsia-400
              active:scale-[0.98] transition-all duration-200
              shadow-lg shadow-purple-500/25
              disabled:opacity-50 disabled:cursor-not-allowed
              flex items-center justify-center gap-2"
          >
            <SparkleIcon className="w-5 h-5" />
            {creating ? 'Creating Room...' : 'Host a Game'}
          </button>

          {!showJoin ? (
            <button
              onClick={() => setShowJoin(true)}
              className="w-full py-4 px-6 rounded-2xl font-display font-semibold text-lg
                glass text-white/90
                hover:bg-white/10
                active:scale-[0.98] transition-all duration-200"
            >
              Join a Game
            </button>
          ) : (
            <div className="glass rounded-2xl p-4 animate-scale-in">
              <label className="text-sm text-white/50 font-body mb-2 block">
                Enter room code
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={4}
                  value={joinCode}
                  onChange={(e) => setJoinCode(e.target.value.replace(/\D/g, '').slice(0, 4))}
                  placeholder="1234"
                  autoFocus
                  className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3
                    text-center text-2xl font-display tracking-[0.3em] text-white
                    placeholder:text-white/20
                    focus:outline-none focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/30
                    transition-all"
                />
                <button
                  onClick={handleJoin}
                  disabled={joinCode.length !== 4}
                  className="px-6 py-3 rounded-xl font-semibold
                    bg-gradient-to-r from-cyan-500 to-blue-500 text-white
                    disabled:opacity-30 disabled:cursor-not-allowed
                    active:scale-[0.97] transition-all"
                >
                  Go
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <p className="text-center text-white/20 text-xs mt-12 font-body">
          Party games for everyone
        </p>
      </div>
    </main>
  );
}
