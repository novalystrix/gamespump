import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { GAMES } from '@/lib/types';
import Link from 'next/link';

// ── Game details for SEO-rich content ───────────────────────────────────────

const GAME_DETAILS: Record<string, { howToPlay: string[]; keywords: string[] }> = {
  'quick-draw': {
    howToPlay: [
      'One player draws a word prompt on their screen',
      'Other players race to guess what\'s being drawn',
      'Faster guesses score more points',
      'Everyone takes turns drawing across multiple rounds',
    ],
    keywords: ['drawing game', 'pictionary online', 'multiplayer drawing', 'guess the drawing'],
  },
  'word-blitz': {
    howToPlay: [
      'A set of letters appears on screen',
      'Race to form as many valid words as possible',
      'Longer words score more points',
      'Submit words before the timer runs out — faster submissions get a speed bonus',
    ],
    keywords: ['word game', 'word racing', 'multiplayer word game', 'anagram game'],
  },
  'trivia-clash': {
    howToPlay: [
      'A trivia question appears with four answer choices',
      'Tap the correct answer as fast as you can',
      'Faster correct answers earn more points',
      'Questions span multiple categories and difficulty levels',
    ],
    keywords: ['trivia game', 'quiz game online', 'multiplayer trivia', 'trivia with friends'],
  },
  'memory-match': {
    howToPlay: [
      'A grid of face-down cards is revealed',
      'Players take turns flipping two cards at a time',
      'Match a pair to score points — faster matches earn a speed bonus',
      'Remember card positions from other players\' turns',
    ],
    keywords: ['memory game', 'card matching', 'multiplayer memory', 'concentration game'],
  },
  'this-or-that': {
    howToPlay: [
      'Two options are presented each round',
      'Pick the one you think most players will choose',
      'Match the majority to score points',
      'Faster votes in the majority earn bonus points',
    ],
    keywords: ['opinion game', 'would you rather', 'this or that game', 'party voting game'],
  },
  'speed-math': {
    howToPlay: [
      'A math problem appears with multiple choice answers',
      'Race to tap the correct answer first',
      'First correct answer gets the most points',
      'Problems get harder as the game progresses',
    ],
    keywords: ['math game', 'speed math', 'multiplayer math', 'mental math game'],
  },
  'emoji-battle': {
    howToPlay: [
      'A target emoji is shown at the top of the screen',
      'Find and tap the matching emoji in a grid of look-alikes',
      'Speed matters — first to find it scores the most',
      'Watch out for similar-looking decoys',
    ],
    keywords: ['emoji game', 'spot the emoji', 'visual search game', 'emoji find'],
  },
  'reaction-speed': {
    howToPlay: [
      'Wait for the screen to turn from red to GREEN',
      'Tap as fast as possible when you see green',
      'Tapping before green is a false start — you lose 50 points',
      '10 rounds — fastest reflexes win!',
    ],
    keywords: ['reaction time game', 'reflex test', 'speed test', 'reaction game multiplayer'],
  },
  'lie-detector': {
    howToPlay: [
      'Each round, one player is the speaker',
      'The speaker makes a statement — it can be true or a lie',
      'Other players vote whether it\'s truth or a lie',
      'Correct guesses earn points — but the speaker earns points for every player they fool!',
    ],
    keywords: ['lie detector game', 'truth or lie', 'party deception game', 'social deduction game'],
  },
};

// ── Static params for SSG ───────────────────────────────────────────────────

export function generateStaticParams() {
  return GAMES.map((game) => ({ slug: game.id }));
}

// ── Dynamic metadata ────────────────────────────────────────────────────────

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const game = GAMES.find((g) => g.id === params.slug);
  if (!game) return {};

  const details = GAME_DETAILS[game.id];
  const title = `${game.name} — Free Multiplayer Party Game | GamesPump`;
  const description = `${game.description} Play ${game.name} free with ${game.minPlayers}-${game.maxPlayers} friends. No signup, no downloads — just open the link and play.`;

  return {
    title,
    description,
    keywords: details?.keywords,
    openGraph: {
      title,
      description,
      url: `https://gamespump.onrender.com/games/${game.id}`,
      siteName: 'GamesPump',
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
      canonical: `https://gamespump.onrender.com/games/${game.id}`,
    },
  };
}

// ── Page component ──────────────────────────────────────────────────────────

export default function GameLandingPage({ params }: { params: { slug: string } }) {
  const game = GAMES.find((g) => g.id === params.slug);
  if (!game) notFound();

  const details = GAME_DETAILS[game.id];

  return (
    <>
      {/* JSON-LD structured data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'VideoGame',
            name: game.name,
            description: game.description,
            url: `https://gamespump.onrender.com/games/${game.id}`,
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
              name: 'GamesPump',
              url: 'https://gamespump.onrender.com',
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
            ← All Games
          </Link>

          {/* Hero */}
          <div className="mb-8">
            {/* Game cover image */}
            <div className="w-full h-48 rounded-2xl overflow-hidden mb-6 bg-white/5">
              <img
                src={`/images/games/${game.id}.webp`}
                alt={game.name}
                className="w-full h-full object-cover"
              />
            </div>

            <h1 className="font-display font-black text-3xl text-white mb-3">
              {game.name}
            </h1>
            <p className="text-white/60 text-base leading-relaxed mb-4">
              {game.description}
            </p>

            {/* Stats */}
            <div className="flex items-center gap-4 text-white/40 text-sm">
              <span>👥 {game.minPlayers}–{game.maxPlayers} players</span>
              <span>⏱ {game.durationMinutes} min</span>
              <span>📱 Mobile-friendly</span>
            </div>
          </div>

          {/* How to Play */}
          {details && (
            <div className="mb-8">
              <h2 className="font-display font-bold text-lg text-white mb-4">
                How to Play
              </h2>
              <ol className="space-y-3">
                {details.howToPlay.map((step, i) => (
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
              🎮 Play {game.name} Now
            </Link>
            <p className="text-center text-white/25 text-xs">
              No signup required · Free · Works on any device
            </p>
          </div>

          {/* Other games */}
          <div className="mt-12 pt-8 border-t border-white/5">
            <h2 className="font-display font-bold text-base text-white/60 mb-4">
              More Games on GamesPump
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
                      alt={g.name}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                  </div>
                  <h3 className="font-semibold text-sm text-white/70">{g.name}</h3>
                  <p className="text-white/30 text-xs mt-0.5">{g.minPlayers}-{g.maxPlayers} players</p>
                </Link>
              ))}
            </div>
          </div>

          {/* Footer */}
          <footer className="mt-12 text-center">
            <p className="text-white/20 text-xs">
              GamesPump — Party Games for Everyone
            </p>
          </footer>
        </div>
      </main>
    </>
  );
}
