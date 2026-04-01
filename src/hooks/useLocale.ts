'use client';
import { useState, useEffect } from 'react';
import { Locale, getLocale, getDirection } from '@/lib/locale';
import { t as translate } from '@/lib/i18n';

export function useLocale() {
  const [locale, setLocale] = useState<Locale>('en');

  useEffect(() => {
    setLocale(getLocale());
  }, []);

  const dir = getDirection(locale);
  const t = (key: string, replacements?: Record<string, string | number>) => translate(locale, key, replacements);

  return { locale, dir, t };
}
