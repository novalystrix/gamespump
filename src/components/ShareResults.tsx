'use client';
import { useState } from 'react';
import { trackShare } from "@/lib/analytics";
import { useLocale } from '@/hooks/useLocale';

export function ShareResults({
  gameName,
  winnerName,
  winnerScore,
  roomCode,
}: {
  gameName: string;
  winnerName: string;
  winnerScore: number;
  roomCode?: string;
}) {
  const [copied, setCopied] = useState(false);
  const { t } = useLocale();

  async function share() {
    const text = t('share.resultText', { game: gameName, winner: winnerName, score: String(winnerScore) });
    const url = roomCode
      ? `https://gamespump.onrender.com/join/${roomCode}`
      : 'https://gamespump.onrender.com';

    // Try native Web Share API first (mobile share sheets)
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({
          title: t('share.resultTitle', { game: gameName }),
          text,
          url,
        });
        trackShare('native', gameName);
        return;
      } catch {
        // User cancelled or not supported — fall through to clipboard
      }
    }

    // Fallback: copy to clipboard
    const fullText = `${text}\n${url}`;
    try {
      await navigator.clipboard.writeText(fullText);
    } catch {
      // Clipboard API blocked — ignore
    }
    trackShare('clipboard', gameName);
    try { localStorage.setItem('gamespump_shared', 'true'); } catch {}
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <button
      onClick={share}
      className="w-full py-3 rounded-2xl font-semibold text-sm glass text-white/70 hover:text-white hover:bg-white/10 active:scale-[0.98] transition-all duration-200"
    >
      {copied ? t('share.copiedResults') : t('share.shareResults')}
    </button>
  );
}
