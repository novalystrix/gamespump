'use client';

import { useEffect } from 'react';
import { getUnsentEvents, markEventsSent } from '@/lib/analytics';

const FLUSH_INTERVAL_MS = 60 * 1000; // 60 seconds
const ENDPOINT = '/api/analytics/events';

async function flush(): Promise<void> {
  const events = getUnsentEvents();
  if (events.length === 0) return;

  try {
    const res = await fetch(ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ events }),
    });
    if (res.ok) {
      markEventsSent(events.length);
    }
  } catch {
    // Network error — will retry next interval
  }
}

function flushBeacon(): void {
  const events = getUnsentEvents();
  if (events.length === 0) return;
  try {
    const body = JSON.stringify({ events });
    const sent = navigator.sendBeacon(ENDPOINT, new Blob([body], { type: 'application/json' }));
    if (sent) markEventsSent(events.length);
  } catch {
    // sendBeacon not available or failed
  }
}

function handleVisibilityChange(): void {
  if (document.visibilityState === 'hidden') flushBeacon();
}

export default function AnalyticsProvider() {
  useEffect(() => {
    // Flush any accumulated events on mount
    flush();

    const interval = setInterval(flush, FLUSH_INTERVAL_MS);

    window.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('pagehide', flushBeacon);

    return () => {
      clearInterval(interval);
      window.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('pagehide', flushBeacon);
    };
  }, []);

  return null;
}
