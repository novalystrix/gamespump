'use client';

import Link from 'next/link';

function BackgroundDecor() {
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden">
      <div className="absolute -top-32 -left-32 w-96 h-96 bg-purple-600/20 rounded-full blur-3xl animate-float-slow" />
      <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-fuchsia-600/15 rounded-full blur-3xl animate-float-medium" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-indigo-600/10 rounded-full blur-3xl animate-float-slow" style={{ animationDelay: '4s' }} />
    </div>
  );
}

export default function NotFound() {
  return (
    <main className="min-h-[100dvh] flex flex-col items-center justify-center px-6 py-10 relative">
      <BackgroundDecor />

      <div className="relative z-10 w-full max-w-sm mx-auto text-center page-transition">
        <p className="text-8xl font-display font-bold bg-gradient-to-r from-purple-400 to-fuchsia-400 bg-clip-text text-transparent mb-2">
          404
        </p>
        <p className="text-2xl font-display font-bold text-white mb-2">Game Over</p>
        <p className="text-white/50 font-body text-sm mb-8">
          Looks like this page rolled off the board!
        </p>
        <Link
          href="/"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl font-display font-semibold
            bg-gradient-to-r from-purple-600 to-fuchsia-500 text-white
            shadow-lg shadow-purple-500/20
            active:scale-[0.98] transition-all duration-200"
        >
          🎮 Back to Games
        </Link>
      </div>
    </main>
  );
}
