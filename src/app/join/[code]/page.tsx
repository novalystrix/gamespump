'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { getSession, saveSession, generatePlayerId } from '@/lib/session';
import { AVATARS, PLAYER_COLORS } from '@/lib/types';
import { Avatar } from '@/components/avatars/AvatarSVG';
import { ChevronLeftIcon, CheckIcon } from '@/components/icons/GameIcons';
import { trackPageView, trackRoomJoined } from '@/lib/analytics';

export default function JoinPage({ params }: { params: { code: string } }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isHost = searchParams.get('host') === 'true';
  
  const [name, setName] = useState('');
  const [selectedAvatar, setSelectedAvatar] = useState('bunny');
  const [selectedColor, setSelectedColor] = useState<string>(PLAYER_COLORS[0]);
  const [joining, setJoining] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    trackPageView(`join/${params.code}`);
    const session = getSession();
    if (session) {
      if (session.name) setName(session.name);
      if (session.avatar) setSelectedAvatar(session.avatar);
      if (session.color) setSelectedColor(session.color);
    }
  }, [params.code]);

  async function handleJoin() {
    if (!name.trim()) {
      setError('Pick a name to continue');
      return;
    }

    setJoining(true);
    setError('');

    try {
      // Always generate a fresh player ID per join to support multiple players from same device/browser
      const playerId = generatePlayerId();
      
      const session = {
        playerId,
        name: name.trim(),
        avatar: selectedAvatar,
        color: selectedColor,
      };
      saveSession(session);

      const res = await fetch(`/api/rooms/${params.code}/join`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: playerId,
          name: name.trim(),
          avatar: selectedAvatar,
          color: selectedColor,
          isHost,
          isReady: false,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || 'Room not found');
        setJoining(false);
        return;
      }

      trackRoomJoined(params.code);
      router.push(`/room/${params.code}`);
    } catch {
      setError('Something went wrong. Try again.');
      setJoining(false);
    }
  }

  return (
    <main className="min-h-[100dvh] flex flex-col px-6 py-8 relative">
      {/* Background */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-32 -right-32 w-80 h-80 bg-purple-600/15 rounded-full blur-3xl" />
        <div className="absolute -bottom-32 -left-32 w-80 h-80 bg-fuchsia-600/10 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 w-full max-w-sm mx-auto page-transition">
        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <button
            onClick={() => router.push('/')}
            className="p-2 -ml-2 rounded-xl hover:bg-white/5 transition-colors"
          >
            <ChevronLeftIcon className="w-5 h-5 text-white/50" />
          </button>
          <div>
            <p className="text-sm text-white/40 font-body">Joining room</p>
            <p className="text-xl font-display font-bold tracking-wider text-white">{params.code}</p>
          </div>
        </div>

        {/* Preview */}
        <div className="flex justify-center mb-8">
          <div className="relative">
            <div
              className="w-24 h-24 rounded-2xl flex items-center justify-center"
              style={{ backgroundColor: `${selectedColor}15`, border: `2px solid ${selectedColor}40` }}
            >
              <Avatar avatarId={selectedAvatar} size={56} color={selectedColor} />
            </div>
            {name && (
              <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full glass text-xs font-semibold text-white whitespace-nowrap">
                {name}
              </div>
            )}
          </div>
        </div>

        {/* Name input */}
        <div className="mb-6">
          <label className="text-sm text-white/40 font-body mb-2 block">Your name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => { setName(e.target.value); setError(''); }}
            placeholder="Enter your name"
            maxLength={16}
            autoFocus
            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3.5
              text-white font-body text-lg
              placeholder:text-white/20
              focus:outline-none focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/30
              transition-all"
          />
        </div>

        {/* Avatar picker */}
        <div className="mb-6">
          <label className="text-sm text-white/40 font-body mb-3 block">Pick your avatar</label>
          <div className="grid grid-cols-4 gap-2">
            {AVATARS.map((avatar) => (
              <button
                key={avatar.id}
                onClick={() => setSelectedAvatar(avatar.id)}
                className={`relative aspect-square rounded-xl flex items-center justify-center transition-all min-h-[44px] [touch-action:manipulation]
                  ${selectedAvatar === avatar.id
                    ? 'bg-white/10 ring-2 ring-purple-400 scale-105'
                    : 'bg-white/5 hover:bg-white/8 active:scale-95'
                  }`}
              >
                <Avatar avatarId={avatar.id} size={36} color={selectedColor} />
                {selectedAvatar === avatar.id && (
                  <div className="absolute -top-1 -right-1 w-5 h-5 bg-purple-500 rounded-full flex items-center justify-center">
                    <CheckIcon className="w-3 h-3 text-white" />
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Color picker */}
        <div className="mb-8">
          <label className="text-sm text-white/40 font-body mb-3 block">Pick your color</label>
          <div className="flex gap-2 justify-center flex-wrap">
            {PLAYER_COLORS.map((color) => (
              <button
                key={color}
                onClick={() => setSelectedColor(color)}
                className={`w-11 h-11 rounded-full transition-all [touch-action:manipulation]
                  ${selectedColor === color
                    ? 'ring-2 ring-white ring-offset-2 ring-offset-[#0d0221] scale-110'
                    : 'hover:scale-105 active:scale-95'
                  }`}
                style={{ backgroundColor: color }}
              />
            ))}
          </div>
        </div>

        {/* Error */}
        {error && (
          <p className="text-center text-rose-400 text-sm mb-4 animate-scale-in">{error}</p>
        )}

        {/* Join button */}
        <button
          onClick={handleJoin}
          disabled={joining}
          className="w-full py-4 px-6 rounded-2xl font-display font-semibold text-lg
            bg-gradient-to-r from-purple-500 to-fuchsia-500 text-white
            hover:from-purple-400 hover:to-fuchsia-400
            active:scale-[0.98] transition-all duration-200
            shadow-lg shadow-purple-500/25
            disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {joining ? 'Joining...' : isHost ? 'Create & Join' : 'Join Room'}
        </button>
      </div>
    </main>
  );
}
