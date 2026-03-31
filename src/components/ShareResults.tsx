'use client';
import { useState } from 'react';

export function ShareResults({
  gameName,
  winnerName,
  winnerScore,
}: {
  gameName: string;
  winnerName: string;
  winnerScore: number;
}) {
  const [copied, setCopied] = useState(false);

  function share() {
    const text = `🎮 GamesPump — ${gameName}\n🏆 Winner: ${winnerName} (${winnerScore} pts)\nJoin us: https://gamespump.onrender.com`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <button
      onClick={share}
      className="w-full py-3 rounded-2xl font-semibold text-sm glass text-white/70 hover:text-white hover:bg-white/10 active:scale-[0.98] transition-all duration-200"
    >
      {copied ? '✓ Copied!' : '📤 Share Results'}
    </button>
  );
}
