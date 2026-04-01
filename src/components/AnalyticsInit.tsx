'use client';

import { useEffect } from 'react';
import { initAutoFlush } from '@/lib/analytics';

export function AnalyticsInit() {
  useEffect(() => {
    initAutoFlush();
  }, []);

  return null;
}
