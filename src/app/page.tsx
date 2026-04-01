'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getSession, generatePlayerId, saveSession } from '@/lib/session';
import { getGameHistory, getGamesPlayed, GameResult } from '@/lib/gameHistory';
import { GAMES } from '@/lib/types';
import { trackPageView, trackRoomCreated } from "@/lib/analytics";
import { GamepadIcon } from '@/components/icons/GameIcons';
import { useLocale } from '@/hooks/useLocale';

function BackgroundDecor() {
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden">
      <div className="absolute -top-32 -left-32 w-96 h-96 bg-purple-600/20 rounded-full blur-3xl animate-float-slow" />
      <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-fuchsia-600/15 rounded-full blur-3xl animate-float-medium" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-indigo-600/10 rounded-full blur-3xl animate-float-slow" style={{ animationDelay: '4s' }} />
    </div>
  );
}

function RecentGames({ history, onRejoin, t }: { history: GameResult[]; onRejoin: (code: string) => void; t: (key: string, r?: Record<string, string | number>) => string }) {
  if (history.length === 0) return null;
  const now = Date.now();
  const THIRTY_MIN = 30 * 60 * 1000;
  return (
    <div className="mb-6">
      <p className="text-xs text-white/30 font-body uppercase tracking-wider mb-2">{t('home.recentGames')}</p>
      <div className="space-y-2">
        {history.map((r, i) => {
          const canRejoin = now - new Date(r.date).getTime() < THIRTY_MIN;
          return (
            <div key={i} className="flex items-center justify-between glass rounded-xl px-3 py-2">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg overflow-hidden bg-white/5 flex-shrink-0">
                  <img
                    src={`/images/games/${r.gameType}.webp`}
                    alt={r.gameType}
                    className="w-full h-full object-cover"
                    loading="lazy"
                    onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                  />
                </div>
                <div>
                  <p className="text-xs font-semibold text-white/80">{t(`game.${r.gameType}.name`)}</p>
                  <p className="text-xs text-white/30">{t('lobby.roomCode')} {r.roomCode}</p>
                </div>
              </div>
              <div className="text-right flex items-center gap-3">
                <div>
                  <p className="text-xs font-bold text-purple-300">{r.score} {t('common.pts')}</p>
                  <p className="text-xs text-white/25">{new Date(r.date).toLocaleDateString()}</p>
                </div>
                {canRejoin && (
                  <button
                    onClick={() => onRejoin(r.roomCode)}
                    className="text-xs font-semibold text-cyan-400 hover:text-cyan-300 transition-colors px-2 py-1 rounded-lg hover:bg-white/5"
                  >
                    {t('home.rejoin')}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function StatsSection({ gamesPlayed, t }: { gamesPlayed: number; t: (key: string, r?: Record<string, string | number>) => string }) {
  return (
    <div className="mb-6 flex items-center justify-center gap-6 text-center">
      <div>
        <p className="text-lg font-display font-bold text-white/60">{gamesPlayed > 0 ? gamesPlayed.toLocaleString() : '—'}</p>
        <p className="text-xs text-white/25 font-body mt-0.5">{t('home.gamesPlayed')}</p>
      </div>
      <div className="w-px h-8 bg-white/10" />
      <div>
        <p className="text-lg font-display font-bold text-white/60">{GAMES.length}</p>
        <p className="text-xs text-white/25 font-body mt-0.5">{t('home.gamesAvailable')}</p>
      </div>
    </div>
  );
}

function HowItWorks({ t }: { t: (key: string, r?: Record<string, string | number>) => string }) {
  const steps = [
    { emoji: '🔗', titleKey: 'home.step1', descKey: 'home.step1Desc' },
    { emoji: '😎', titleKey: 'home.step2', descKey: 'home.step2Desc' },
    { emoji: '🎮', titleKey: 'home.step3', descKey: 'home.step3Desc' },
  ];
  return (
    <div className="mb-8">
      <p className="text-xs text-white/30 font-body uppercase tracking-wider mb-3 text-center">{t('home.howItWorks')}</p>
      <div className="flex items-start justify-between gap-2">
        {steps.map((step, i) => (
          <div key={i} className="flex-1 text-center">
            <div className="text-2xl mb-1.5">{step.emoji}</div>
            <p className="text-sm font-display font-semibold text-white/70 mb-0.5">{t(step.titleKey)}</p>
            <p className="text-xs text-white/30">{t(step.descKey)}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function TrustBadges({ t }: { t: (key: string, r?: Record<string, string | number>) => string }) {
  return (
    <div className="flex items-center justify-center gap-3 flex-wrap mb-6">
      <span className="px-3 py-1 rounded-full bg-white/[0.04] text-white/40 text-xs">{t('home.trustFree')}</span>
      <span className="px-3 py-1 rounded-full bg-white/[0.04] text-white/40 text-xs">{t('home.trustGames', { count: GAMES.length })}</span>
      <span className="px-3 py-1 rounded-full bg-white/[0.04] text-white/40 text-xs">{t('home.trustDevice')}</span>
    </div>
  );
}

function InviteFriendsCTA({ t }: { t: (key: string, r?: Record<string, string | number>) => string }) {
  return (
    <div className="flex justify-center mb-6">
      <button
        onClick={async () => {
          const shareData = {
            title: t('home.title'),
            text: t('home.shareText'),
            url: window.location.origin,
          };
          if (typeof navigator !== 'undefined' && navigator.share) {
            try { await navigator.share(shareData); } catch {}
          } else {
            try { await navigator.clipboard.writeText(t('home.shareClipboard')); } catch {}
          }
        }}
        className="flex items-center gap-2 px-5 py-2.5 rounded-full glass text-white/60 text-sm font-semibold hover:text-white hover:bg-white/10 active:scale-[0.97] transition-all"
      >
        {t('home.inviteFriends')}
      </button>
    </div>
  );
}

export default function Home() {
  const router = useRouter();
  const { t } = useLocale();
  const [joinCode, setJoinCode] = useState('');
  const [showJoin, setShowJoin] = useState(false);
  const [creating, setCreating] = useState<string | null>(null);
  const [history, setHistory] = useState<GameResult[]>([]);
  const [gamesPlayed, setGamesPlayed] = useState(0);
  const [luckyLoading, setLuckyLoading] = useState(false);
  const [installPrompt, setInstallPrompt] = useState<Event & { prompt: () => void; userChoice: Promise<{ outcome: string }> } | null>(null);
  const [showInstall, setShowInstall] = useState(false);

  useEffect(() => {
    trackPageView("home");
    setHistory(getGameHistory());
    setGamesPlayed(getGamesPlayed());
  }, []);

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setInstallPrompt(e as Event & { prompt: () => void; userChoice: Promise<{ outcome: string }> });
      setShowInstall(true);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  async function handleInstall() {
    if (!installPrompt) return;
    installPrompt.prompt();
    const { outcome } = await installPrompt.userChoice;
    if (outcome === 'accepted') setShowInstall(false);
    setInstallPrompt(null);
  }

  async function handleHostGame(gameId: string) {
    if (creating) return;
    setCreating(gameId);
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
        trackRoomCreated(data.code, gameId);
        await fetch(`/api/rooms/${data.code}/game`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ gameId }),
        });
        router.push(`/join/${data.code}?host=true`);
      }
    } catch (err) {
      console.error('Failed to create room', err);
    } finally {
      setCreating(null);
    }
  }

  async function handleFeelingLucky() {
    if (luckyLoading || creating) return;
    setLuckyLoading(true);
    try {
      let session = getSession();
      if (!session) {
        const playerId = generatePlayerId();
        session = { playerId, name: '', avatar: 'crystal', color: '#a855f7' };
        saveSession(session);
      }
      const randomGame = GAMES[Math.floor(Math.random() * GAMES.length)];
      const res = await fetch('/api/rooms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ hostId: session.playerId }),
      });
      const data = await res.json();
      if (data.code) {
        trackRoomCreated(data.code, randomGame.id);
        await fetch(`/api/rooms/${data.code}/game`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ gameId: randomGame.id }),
        });
        router.push(`/join/${data.code}?host=true`);
      }
    } catch (err) {
      console.error('Failed to create room', err);
    } finally {
      setLuckyLoading(false);
    }
  }

  function handleJoin() {
    if (joinCode.length === 4) {
      router.push(`/join/${joinCode}`);
    }
  }

  return (
    <main id="main-content" className="min-h-[100dvh] flex flex-col items-center px-6 py-10 relative">
      <BackgroundDecor />

      <div className="relative z-10 w-full max-w-sm mx-auto page-transition">
        {/* Hero */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-3">
            <GamepadIcon className="w-7 h-7 text-purple-400" />
            <h1 className="text-3xl font-display font-bold text-gradient">{t('home.title')}</h1>
          </div>
          <p className="text-xl font-display font-semibold text-white/80 mb-1">{t('home.subtitle')}</p>
          <p className="text-white/35 text-sm font-body mb-3">{t('home.tagline')}</p>
          <TrustBadges t={t} />
          {gamesPlayed > 0 && (
            <button
              onClick={() => router.push('/stats')}
              className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full glass text-white/50 text-xs font-body hover:text-white/70 hover:bg-white/10 transition-all [touch-action:manipulation]"
            >
              {t('home.stats')}
            </button>
          )}
        </div>

        {/* Join a Game */}
        <div className="mb-8">
          {!showJoin ? (
            <button
              onClick={() => setShowJoin(true)}
              className="w-full py-3 px-6 rounded-2xl font-display font-semibold
                glass text-white/80 hover:bg-white/10
                active:scale-[0.98] transition-all duration-200 text-base"
            >
              {t('home.join')}
            </button>
          ) : (
            <div className="glass rounded-2xl p-4 animate-scale-in">
              <label className="text-sm text-white/50 font-body mb-2 block">{t('home.enterCode')}</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={4}
                  value={joinCode}
                  onChange={(e) => setJoinCode(e.target.value.replace(/\D/g, '').slice(0, 4))}
                  placeholder="1234"
                  aria-label={t('home.enterCode')}
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
                  className="px-6 py-3 rounded-xl font-semibold min-h-[44px]
                    bg-gradient-to-r from-cyan-500 to-blue-500 text-white
                    disabled:opacity-30 disabled:cursor-not-allowed
                    active:scale-[0.97] transition-all [touch-action:manipulation]"
                >
                  {t('home.go')}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Feeling Lucky */}
        <div className="mb-6">
          <button
            onClick={handleFeelingLucky}
            disabled={luckyLoading || creating !== null}
            className="w-full py-3 px-6 rounded-2xl font-display font-semibold
              bg-gradient-to-r from-purple-600 to-pink-500 text-white
              shadow-lg shadow-purple-500/20
              disabled:opacity-50 disabled:cursor-not-allowed
              active:scale-[0.98] transition-all duration-200 [touch-action:manipulation]"
          >
            {luckyLoading ? (
              <span className="inline-flex items-center gap-2">
                <span className="inline-block animate-spin">🎲</span>
                {t('home.rolling')}
              </span>
            ) : (
              t('home.feelingLucky')
            )}
          </button>
        </div>

        {/* How It Works */}
        <HowItWorks t={t} />

        {/* Game grid */}
        <div className="mb-6">
          <p className="text-xs text-white/30 font-body uppercase tracking-wider mb-3">{t('home.hostGame')}</p>
          <div className="grid grid-cols-2 gap-3">
            {GAMES.map((game, index) => (
              <button
                key={game.id}
                onClick={() => handleHostGame(game.id)}
                disabled={creating !== null}
                aria-label={`${t('home.hostGame')} ${t(`game.${game.id}.name`)}`}
                className={`relative rounded-2xl overflow-hidden text-left transition-all
                  active:scale-[0.97] [touch-action:manipulation]
                  ${creating === game.id ? 'opacity-60' : 'hover:scale-[1.02]'}
                  disabled:cursor-not-allowed`}
              >
                <div className="w-full aspect-[4/3] bg-white/5">
                  <img
                    src={`/images/games/${game.id}.webp`}
                    alt={t(`game.${game.id}.name`)}
                    className="w-full h-full object-cover"
                    loading={index >= 2 ? 'lazy' : undefined}
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none';
                      (e.target as HTMLImageElement).parentElement!.className =
                        `w-full aspect-[4/3] flex items-center justify-center bg-gradient-to-br ${game.color}`;
                    }}
                  />
                </div>
                <div className="px-3 py-2.5 bg-white/[0.04]">
                  <p className="text-sm font-display font-bold text-white leading-tight">{t(`game.${game.id}.name`)}</p>
                  <p className="text-xs text-white/40 leading-snug mt-1 line-clamp-2">{t(`game.${game.id}.desc`)}</p>
                  <div className="flex items-center justify-between mt-1.5">
                    <p className="text-xs text-white/35">{t('home.players', { min: game.minPlayers, max: game.maxPlayers })}</p>
                    <p className="text-xs text-white/25">{t('home.duration', { min: game.durationMinutes })}</p>
                  </div>
                </div>
                {creating === game.id && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Invite Friends — high visibility */}
        <InviteFriendsCTA t={t} />

        <StatsSection gamesPlayed={gamesPlayed} t={t} />

        <RecentGames history={history} onRejoin={(code) => router.push(`/join/${code}`)} t={t} />

        {/* PWA Install Prompt */}
        {showInstall && (
          <div className="flex justify-center mb-4">
            <button
              onClick={handleInstall}
              className="flex items-center gap-2 px-4 py-2 rounded-full glass text-white/50 text-xs font-body hover:text-white/70 hover:bg-white/10 transition-all [touch-action:manipulation]"
            >
              {t('home.installApp')}
            </button>
          </div>
        )}

        {/* Footer */}
        <footer className="text-center text-white/20 text-xs font-body pt-4 pb-2">
          {t('home.footer')}
        </footer>
      </div>
    </main>
  );
}
