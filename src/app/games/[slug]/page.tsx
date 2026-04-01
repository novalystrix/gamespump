import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { headers } from 'next/headers';
import { GAMES } from '@/lib/types';
import { t } from '@/lib/i18n';
import { Locale } from '@/lib/locale';
import Link from 'next/link';

// ── Detect locale from host ─────────────────────────────────────────────────

function getLocale(): Locale {
  try {
    const host = headers().get('host') || '';
    return host.includes('mamadgames') ? 'he' : 'en';
  } catch {
    return 'en';
  }
}

// Number of how-to-play steps per game
const STEP_COUNTS: Record<string, number> = {
  'quick-draw': 4,
  'word-blitz': 4,
  'trivia-clash': 4,
  'memory-match': 4,
  'this-or-that': 4,
  'speed-math': 4,
  'emoji-battle': 4,
  'reaction-speed': 4,
  'color-chaos': 4,
  'lie-detector': 4,
};

// ── Static params for SSG ───────────────────────────────────────────────────

export function generateStaticParams() {
  return GAMES.map((game) => ({ slug: game.id }));
}

// ── Dynamic metadata ────────────────────────────────────────────────────────

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const game = GAMES.find((g) => g.id === params.slug);
  if (!game) return {};

  const locale = getLocale();
  const gameName = t(locale, `game.${game.id}.name`);
  const gameDesc = t(locale, `game.${game.id}.desc`);
  const title = t(locale, 'seo.metaTitle', { name: gameName });
  const description = t(locale, 'seo.metaDesc', { desc: gameDesc, name: gameName, players: `${game.minPlayers}-${game.maxPlayers}` });

  const siteUrl = locale === 'he' ? 'https://mamadgames.com' : 'https://gamespump.onrender.com';
  const siteName = locale === 'he' ? 'משחקי ממ"ד' : 'GamesPump';

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url: `${siteUrl}/games/${game.id}`,
      siteName,
      images: [{ url: '/og', width: 1200, height: 630, alt: title }],
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: ['/og'],
    },
    alternates: {
      canonical: `${siteUrl}/games/${game.id}`,
    },
  };
}

// ── Page component ──────────────────────────────────────────────────────────

export default function GameLandingPage({ params }: { params: { slug: string } }) {
  const game = GAMES.find((g) => g.id === params.slug);
  if (!game) notFound();

  const locale = getLocale();
  const gameName = t(locale, `game.${game.id}.name`);
  const gameDesc = t(locale, `game.${game.id}.desc`);
  const stepCount = STEP_COUNTS[game.id] ?? 0;
  const steps: string[] = [];
  for (let i = 1; i <= stepCount; i++) {
    steps.push(t(locale, `seo.${game.id}.step${i}`));
  }

  const siteUrl = locale === 'he' ? 'https://mamadgames.com' : 'https://gamespump.onrender.com';

  return (
    <>
      {/* JSON-LD structured data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'VideoGame',
            name: gameName,
            description: gameDesc,
            url: `${siteUrl}/games/${game.id}`,
            genre: 'Party Game',
            numberOfPlayers: {
              '@type': 'QuantitativeValue',
              minValue: game.minPlayers,
              maxValue: game.maxPlayers,
            },
            playMode: 'MultiPlayer',
            gamePlatform: ['Web Browser', 'Mobile Browser'],
            applicationCategory: 'Game',
            offers: {
              '@type': 'Offer',
              price: '0',
              priceCurrency: 'USD',
              availability: 'https://schema.org/InStock',
            },
            isPartOf: {
              '@type': 'WebApplication',
              name: locale === 'he' ? 'משחקי ממ"ד' : 'GamesPump',
              url: siteUrl,
            },
          }),
        }}
      />

      <main className="min-h-[100dvh] flex flex-col px-6 py-12 relative">
        {/* Background */}
        <div className="fixed inset-0 pointer-events-none overflow-hidden">
          <div className="absolute -top-32 -left-32 w-80 h-80 bg-purple-600/15 rounded-full blur-3xl" />
          <div className="absolute -bottom-32 -right-32 w-64 h-64 bg-fuchsia-600/10 rounded-full blur-3xl" />
        </div>

        <div className="relative z-10 w-full max-w-lg mx-auto">
          {/* Back link */}
          <Link
            href="/"
            className="inline-flex items-center gap-1 text-white/40 text-sm hover:text-white/60 transition-colors mb-8"
          >
            {t(locale, 'seo.allGames')}
          </Link>

          {/* Hero */}
          <div className="mb-8">
            {/* Game cover image */}
            <div className="w-full h-48 rounded-2xl overflow-hidden mb-6 bg-white/5">
              <img
                src={`/images/games/${game.id}.webp`}
                alt={gameName}
                className="w-full h-full object-cover"
              />
            </div>

            <h1 className="font-display font-black text-3xl text-white mb-3">
              {gameName}
            </h1>
            <p className="text-white/60 text-base leading-relaxed mb-4">
              {gameDesc}
            </p>

            {/* Stats */}
            <div className="flex items-center gap-4 text-white/40 text-sm">
              <span>{t(locale, 'seo.players', { min: game.minPlayers, max: game.maxPlayers })}</span>
              <span>{t(locale, 'seo.duration', { min: game.durationMinutes })}</span>
              <span>{t(locale, 'seo.mobileFriendly')}</span>
            </div>
          </div>

          {/* How to Play */}
          {steps.length > 0 && (
            <div className="mb-8">
              <h2 className="font-display font-bold text-lg text-white mb-4">
                {t(locale, 'seo.howToPlay')}
              </h2>
              <ol className="space-y-3">
                {steps.map((step, i) => (
                  <li key={i} className="flex gap-3">
                    <span className="flex-shrink-0 w-7 h-7 rounded-full bg-purple-500/20 text-purple-300 text-sm font-bold flex items-center justify-center">
                      {i + 1}
                    </span>
                    <span className="text-white/60 text-sm leading-relaxed pt-0.5">
                      {step}
                    </span>
                  </li>
                ))}
              </ol>
            </div>
          )}

          {/* CTA */}
          <div className="space-y-3">
            <Link
              href={`/?game=${game.id}`}
              className="w-full py-4 px-6 rounded-2xl font-display font-semibold text-lg
                bg-gradient-to-r from-purple-500 to-fuchsia-500 text-white
                shadow-lg shadow-purple-500/25
                active:scale-[0.98] transition-all duration-200
                flex items-center justify-center gap-2"
            >
              {t(locale, 'seo.playNow', { name: gameName })}
            </Link>
            <p className="text-center text-white/25 text-xs">
              {t(locale, 'seo.noSignup')}
            </p>
          </div>

          {/* Other games */}
          <div className="mt-12 pt-8 border-t border-white/5">
            <h2 className="font-display font-bold text-base text-white/60 mb-4">
              {t(locale, 'seo.moreGames')}
            </h2>
            <div className="grid grid-cols-2 gap-3">
              {GAMES.filter((g) => g.id !== game.id).map((g) => (
                <Link
                  key={g.id}
                  href={`/games/${g.id}`}
                  className="p-3 rounded-xl bg-white/[0.03] hover:bg-white/[0.06] transition-colors"
                >
                  <div className="w-full h-20 rounded-lg overflow-hidden mb-2 bg-white/5">
                    <img
                      src={`/images/games/${g.id}.webp`}
                      alt={t(locale, `game.${g.id}.name`)}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                  </div>
                  <h3 className="font-semibold text-sm text-white/70">{t(locale, `game.${g.id}.name`)}</h3>
                  <p className="text-white/30 text-xs mt-0.5">{g.minPlayers}-{g.maxPlayers} {t(locale, 'common.players')}</p>
                </Link>
              ))}
            </div>
          </div>

          {/* Footer */}
          <footer className="mt-12 text-center">
            <p className="text-white/20 text-xs">
              {t(locale, 'seo.footer')}
            </p>
          </footer>
        </div>
      </main>
    </>
  );
}
