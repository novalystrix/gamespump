'use client';

import { useLocale } from '@/hooks/useLocale';

export default function Error({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const { t } = useLocale();

  return (
    <main className="min-h-[100dvh] flex flex-col items-center justify-center px-6 py-10 relative">
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-32 -left-32 w-96 h-96 bg-red-600/15 rounded-full blur-3xl" />
        <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-fuchsia-600/10 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 w-full max-w-sm mx-auto text-center">
        <p className="text-5xl mb-4">💥</p>
        <p className="text-2xl font-display font-bold text-white mb-2">{t('error.title')}</p>
        <p className="text-white/50 font-body text-sm mb-8">
          {t('error.description')}
        </p>
        <button
          onClick={reset}
          className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl font-display font-semibold
            bg-gradient-to-r from-purple-600 to-fuchsia-500 text-white
            shadow-lg shadow-purple-500/20
            active:scale-[0.98] transition-all duration-200"
        >
          {t('error.tryAgain')}
        </button>
      </div>
    </main>
  );
}
