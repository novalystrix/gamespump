import en from '@/locales/en.json';
import he from '@/locales/he.json';
import { Locale } from './locale';

const messages: Record<Locale, Record<string, string>> = { en, he };

// Get a translation by key. Falls back to English if missing.
export function t(locale: Locale, key: string, replacements?: Record<string, string | number>): string {
  let text = messages[locale]?.[key] || messages['en']?.[key] || key;
  if (replacements) {
    for (const [k, v] of Object.entries(replacements)) {
      text = text.replace(`{${k}}`, String(v));
    }
  }
  return text;
}
