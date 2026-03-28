'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { getSession, generatePlayerId, saveSession } from '@/lib/session';
import { GamepadIcon, SparkleIcon } from '@/components/icons/GameIcons';

function HeroIllustration() {
  return (
    <div className="relative w-64 h-64 mx-auto mb-8">
      {/* Floating geometric shapes */}
      <svg viewBox="0 0 256 256" className="w-full h-full">
        <defs>
          <linearGradient id="grad1" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#a855f7" />
            <stop offset="100%" stopColor="#ec4899" />
          </linearGradient>
          <linearGradient id="grad2" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#22d3ee" />
            <stop offset="100%" stopColor="#6366f1" />
          </linearGradient>
          <linearGradient id="grad3" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#f97316" />
            <stop offset="100%" stopColor="#facc15" />
          </linearGradient>
        </defs>
        
        {/* Central diamond */}
        <g className="animate-float">
          <polygon points="128,40 180,128 128,216 76,128" fill="url(#grad1)" opacity="0.9" />
          <polygon points="128,40 180,128 128,128" fill="white" opacity="0.1" />
        </g>
        
        {/* Orbiting circles */}
        <g className="animate-float-delayed">
          <circle cx="60" cy="80" r="20" fill="url(#grad2)" opacity="0.7" />
          <circle cx="60" cy="80" r="8" fill="white" opacity="0.15" />
        </g>
        
        <g className="animate-float" style={{ animationDelay: '1s' }}>
          <circle cx="196" cy="100" r="16" fill="url(#grad3)" opacity="0.7" />
          <circle cx="196" cy="100" r="6" fill="white" opacity="0.15" />
        </g>
        
        {/* Small accent shapes */}
        <rect x="180" y="180" width="24" height="24" rx="4" fill="#a855f7" opacity="0.4" transform="rotate(45 192 192)" className="animate-pulse-glow" />
        <polygon points="50,180 62,200 38,200" fill="#22d3ee" opacity="0.4" className="animate-pulse-glow" />
        
        {/* Sparkle dots */}
        <circle cx="100" cy="50" r="3" fill="white" opacity="0.6" className="animate-pulse-glow" />
        <circle cx="200" cy="60" r="2" fill="white" opacity="0.4" className="animate-pulse-glow" />
        <circle cx="40" cy="140" r="2.5" fill="white" opacity="0.5" className="animate-pulse-glow" />
      </svg>
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
