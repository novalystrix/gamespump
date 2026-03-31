// Emoji sets grouped by visual similarity (makes it tricky!)
export const EMOJI_SETS = [
  ['😀', '😃', '😄', '😁', '😆', '😅', '🤣', '😂', '🙂', '😊'],
  ['❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍', '🤎', '💗'],
  ['🐱', '🐶', '🐭', '🐹', '🐰', '🦊', '🐻', '🐼', '🐨', '🐯'],
  ['🍎', '🍊', '🍋', '🍐', '🍇', '🍓', '🫐', '🍑', '🍒', '🥝'],
  ['⚽', '🏀', '🏈', '⚾', '🎾', '🏐', '🏉', '🎱', '🏓', '🏸'],
  ['👍', '👎', '✌️', '🤞', '🤟', '🤘', '🤙', '👋', '🖐️', '✋'],
  ['🌟', '⭐', '✨', '💫', '🌠', '🔆', '🔅', '☀️', '🌞', '💥'],
  ['🎵', '🎶', '🎼', '🎹', '🎸', '🥁', '🎺', '🎷', '🪗', '🎻'],
];

export function generateRound(): { target: string; grid: string[]; correctIndex: number } {
  const setIndex = Math.floor(Math.random() * EMOJI_SETS.length);
  const emojiSet = [...EMOJI_SETS[setIndex]];
  
  // Shuffle and pick 9
  for (let i = emojiSet.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [emojiSet[i], emojiSet[j]] = [emojiSet[j], emojiSet[i]];
  }
  
  const grid = emojiSet.slice(0, 9);
  const correctIndex = Math.floor(Math.random() * 9);
  const target = grid[correctIndex];
  
  return { target, grid, correctIndex };
}
