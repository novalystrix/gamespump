'use client';
import { useLocale } from '@/hooks/useLocale';

export function LanguageToggle() {
  const { locale, toggleLocale } = useLocale();

  return (
    <button
      onClick={toggleLocale}
      className="fixed top-4 right-4 z-50 flex items-center gap-1.5 px-3 py-1.5 rounded-full 
        bg-white/10 backdrop-blur-sm border border-white/20 
        text-white/70 text-sm font-semibold
        hover:bg-white/20 hover:text-white transition-all duration-200
        active:scale-95"
      aria-label={locale === 'he' ? 'Switch to English' : 'עברו לעברית'}
    >
      <span className="text-base">🌐</span>
      <span>{locale === 'he' ? 'EN' : 'עב'}</span>
    </button>
  );
}
