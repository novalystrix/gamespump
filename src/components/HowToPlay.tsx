'use client';

import { useState } from 'react';

const GAME_RULES: Record<string, { name: string; rules: string[]; scoring: string }> = {
  'trivia-clash': {
    name: 'Trivia Clash',
    rules: [
      'Answer trivia questions before time runs out.',
      'Faster correct answers score more points.',
      'Wrong answers score nothing.',
    ],
    scoring: 'Up to 1000 pts per question — speed matters!',
  },
  'word-blitz': {
    name: 'Word Blitz',
    rules: [
      'Type words that match the given letters.',
      'Each valid word scores points.',
      'Longer words score more. You have 30 seconds per round.',
    ],
    scoring: '3-letter=1pt · 4=2pt · 5=4pt · 6=8pt · 7+=16pt',
  },
  'quick-draw': {
    name: 'Quick Draw',
    rules: [
      'One player draws, others guess.',
      'First correct guess scores the most.',
      'The drawer scores when someone guesses correctly.',
    ],
    scoring: 'Faster guesses = more points for guesser and drawer.',
  },
  'memory-match': {
    name: 'Memory Match',
    rules: [
      'Take turns flipping 2 cards.',
      'Find matching pairs to score.',
      'Remember card positions — most pairs wins.',
    ],
    scoring: '1 point per matched pair.',
  },
  'this-or-that': {
    name: 'This or That',
    rules: [
      'Pick between two options.',
      'Match the majority to score.',
      'Unique picks score nothing.',
    ],
    scoring: 'Match the crowd to earn points each round.',
  },
  'speed-math': {
    name: 'Speed Math',
    rules: [
      'Solve math problems fastest.',
      'First correct answer scores the most.',
      'Wrong answers score nothing.',
    ],
    scoring: 'Up to 500 pts — only speed and accuracy win.',
  },
  'emoji-battle': {
    name: 'Emoji Battle',
    rules: [
      'Find the matching emoji in a 3x3 grid.',
      'Tap the right one as fast as you can.',
      'Wrong taps cost you 25 points.',
    ],
    scoring: '1st correct = 100pts, 2nd = 75pts, 3rd = 50pts. Wrong = -25pts.',
  },
  'reaction-speed': {
    name: 'Reaction Speed',
    rules: [
      'Wait for the screen to turn GREEN.',
      'Tap as fast as you can when you see green!',
      'Tapping too early is a false start: -50 points.',
    ],
    scoring: '1st tap = 100pts, 2nd = 75pts, 3rd = 50pts, rest = 25pts.',
  },
};

interface HowToPlayProps {
  gameId: string;
}

export function HowToPlay({ gameId }: HowToPlayProps) {
  const [open, setOpen] = useState(false);
  const rules = GAME_RULES[gameId];
  if (!rules) return null;

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
              <h2 className="text-lg font-display font-bold text-white">{rules.name}</h2>
              <button
                onClick={() => setOpen(false)}
                className="w-7 h-7 rounded-full bg-white/10 flex items-center justify-center text-white/60 hover:text-white text-sm transition-colors"
                aria-label="Close"
              >
                ✕
              </button>
            </div>

            <ul className="space-y-2 mb-4">
              {rules.rules.map((rule, i) => (
                <li key={i} className="flex gap-2 text-sm text-white/80">
                  <span className="text-purple-400 font-bold mt-0.5">•</span>
                  <span>{rule}</span>
                </li>
              ))}
            </ul>

            <div className="rounded-xl bg-white/5 px-4 py-2 text-xs text-white/50">
              {rules.scoring}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
