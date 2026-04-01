// Detect locale from hostname
export type Locale = 'en' | 'he';

export function getLocale(hostname?: string): Locale {
  if (typeof window !== 'undefined' && !hostname) {
    hostname = window.location.hostname;
  }
  if (hostname?.includes('mamadgames')) return 'he';
  return 'en';
}

export function getDirection(locale: Locale): 'ltr' | 'rtl' {
  return locale === 'he' ? 'rtl' : 'ltr';
}
