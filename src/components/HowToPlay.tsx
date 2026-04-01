'use client';

import { useState } from 'react';
import { useLocale } from '@/hooks/useLocale';

const GAME_RULE_COUNTS: Record<string, number> = {
  'trivia-clash': 3,
  'word-blitz': 3,
  'quick-draw': 3,
  'memory-match': 3,
  'this-or-that': 3,
  'speed-math': 3,
  'emoji-battle': 3,
  'reaction-speed': 3,
  'color-chaos': 4,
  'lie-detector': 4,
};

const GAME_NAMES: Record<string, string> = {
  'trivia-clash': 'game.trivia-clash.name',
  'word-blitz': 'game.word-blitz.name',
  'quick-draw': 'game.quick-draw.name',
  'memory-match': 'game.memory-match.name',
  'this-or-that': 'game.this-or-that.name',
  'speed-math': 'game.speed-math.name',
  'emoji-battle': 'game.emoji-battle.name',
  'reaction-speed': 'game.reaction-speed.name',
  'color-chaos': 'game.color-chaos.name',
  'lie-detector': 'game.lie-detector.name',
};

interface HowToPlayProps {
  gameId: string;
}

export function HowToPlay({ gameId }: HowToPlayProps) {
  const [open, setOpen] = useState(false);
  const { t } = useLocale();

  const ruleCount = GAME_RULE_COUNTS[gameId];
  if (!ruleCount) return null;

  const nameKey = GAME_NAMES[gameId];
  const gameName = nameKey ? t(nameKey) : gameId;
  const rules = Array.from({ length: ruleCount }, (_, i) => t(`rules.${gameId}.${i + 1}`));
  const scoring = t(`rules.${gameId}.scoring`);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="w-8 h-8 rounded-full glass flex items-center justify-center text-white/70 hover:text-white text-sm font-bold transition-colors"
        aria-label="How to play"
      >
        ?
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center px-6"
          onClick={() => setOpen(false)}
        >
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
          <div
            className="relative z-10 w-full max-w-sm rounded-2xl glass p-6"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-display font-bold text-white">{gameName}</h2>
              <button
                onClick={() => setOpen(false)}
                className="w-7 h-7 rounded-full bg-white/10 flex items-center justify-center text-white/60 hover:text-white text-sm transition-colors"
                aria-label="Close"
              >
                ✕
              </button>
            </div>

            <ul className="space-y-2 mb-4">
              {rules.map((rule, i) => (
                <li key={i} className="flex gap-2 text-sm text-white/80">
                  <span className="text-purple-400 font-bold mt-0.5">•</span>
                  <span>{rule}</span>
                </li>
              ))}
            </ul>

            <div className="rounded-xl bg-white/5 px-4 py-2 text-xs text-white/50">
              {scoring}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
