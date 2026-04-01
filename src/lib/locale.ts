export type Locale = 'en' | 'he';

const LOCALE_KEY = 'gamespump_locale';

export function getLocale(hostname?: string): Locale {
  if (typeof window !== 'undefined') {
    // Check localStorage first (user's manual choice)
    const saved = localStorage.getItem(LOCALE_KEY);
    if (saved === 'en' || saved === 'he') return saved;
  }
  // Default to Hebrew
  return 'he';
}

export function setLocale(locale: Locale): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem(LOCALE_KEY, locale);
  }
}

export function getDirection(locale: Locale): 'ltr' | 'rtl' {
  return locale === 'he' ? 'rtl' : 'ltr';
}
