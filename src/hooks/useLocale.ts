'use client';
import { useState, useEffect, useCallback } from 'react';
import { Locale, getLocale, setLocale, getDirection } from '@/lib/locale';
import { t as translate } from '@/lib/i18n';

export function useLocale() {
  const [locale, setLocaleState] = useState<Locale>('he'); // Default Hebrew

  useEffect(() => {
    setLocaleState(getLocale());
  }, []);

  const toggleLocale = useCallback(() => {
    const newLocale: Locale = locale === 'he' ? 'en' : 'he';
    setLocale(newLocale);
    setLocaleState(newLocale);
    // Update html dir and lang attributes immediately
    document.documentElement.dir = getDirection(newLocale);
    document.documentElement.lang = newLocale;
  }, [locale]);

  const dir = getDirection(locale);
  const t = (key: string, replacements?: Record<string, string | number>) => translate(locale, key, replacements);

  return { locale, dir, t, toggleLocale };
}
