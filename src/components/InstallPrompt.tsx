'use client';

import { useEffect, useState } from 'react';
import { useLocale } from '@/hooks/useLocale';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

const PAGE_VIEW_KEY = 'pwa_page_views';
const DISMISSED_KEY = 'pwa_install_dismissed';
const MIN_PAGE_VIEWS = 2;

export function InstallPrompt() {
  const { t } = useLocale();
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Don't show if already dismissed
    if (localStorage.getItem(DISMISSED_KEY)) return;

    // Increment page view counter
    const views = parseInt(localStorage.getItem(PAGE_VIEW_KEY) || '0', 10) + 1;
    localStorage.setItem(PAGE_VIEW_KEY, String(views));

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      if (views >= MIN_PAGE_VIEWS) {
        setVisible(true);
      }
    };

    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      localStorage.setItem(DISMISSED_KEY, '1');
    }
    setVisible(false);
    setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    localStorage.setItem(DISMISSED_KEY, '1');
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div
      role="banner"
      className="fixed bottom-0 left-0 right-0 z-50 flex items-center justify-between gap-3 bg-purple-900/95 backdrop-blur px-4 py-3 shadow-lg border-t border-purple-700"
    >
      <span className="text-sm text-white flex-1">{t('pwa.installBanner')}</span>
      <button
        onClick={handleDismiss}
        className="text-sm text-purple-300 hover:text-white shrink-0"
      >
        {t('pwa.dismiss')}
      </button>
      <button
        onClick={handleInstall}
        className="text-sm font-semibold bg-purple-600 hover:bg-purple-500 text-white px-3 py-1.5 rounded-lg shrink-0"
      >
        {t('pwa.install')}
      </button>
    </div>
  );
}
