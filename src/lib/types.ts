export interface Player {
  id: string;
  name: string;
  avatar: string; // avatar key
  color: string;
  isHost: boolean;
  isReady: boolean;
  joinedAt: number;
}

export interface TriviaQuestion {
  question: string;
  options: string[];
  correctIndex: number;
  category: string;
}

export interface TriviaAnswer {
  answerIndex: number;
  answeredAt: number;
}

export interface TriviaGameState {
  currentQuestion: number;
  questions: TriviaQuestion[];
  answers: Record<string, TriviaAnswer>; // playerId -> answer for current question
  scores: Record<string, number>; // playerId -> total score
  questionStartedAt: number;
  phase: 'question' | 'results' | 'leaderboard';
}

export interface Room {
  code: string;
  hostId: string;
  players: Player[];
  selectedGame: string | null;
  status: 'waiting' | 'playing' | 'finished';
  createdAt: number;
  lastActivity: number;
  gameState?: TriviaGameState;
}

export interface GameInfo {
  id: string;
  name: string;
  description: string;
  minPlayers: number;
  maxPlayers: number;
  durationMinutes: string;
  icon: string; // SVG component key
  color: string; // gradient
}

export interface PlayerSession {
  playerId: string;
  name: string;
  avatar: string;
  color: string;
}

export const PLAYER_COLORS = [
  '#a855f7', // purple
  '#ec4899', // pink
  '#f97316', // orange
  '#22d3ee', // cyan
  '#34d399', // emerald
  '#facc15', // yellow
  '#f43f5e', // rose
  '#6366f1', // indigo
] as const;

export const AVATARS = [
  { id: 'crystal', name: 'Crystal' },
  { id: 'orbit', name: 'Orbit' },
  { id: 'flame', name: 'Flame' },
  { id: 'bolt', name: 'Bolt' },
  { id: 'wave', name: 'Wave' },
  { id: 'prism', name: 'Prism' },
  { id: 'star', name: 'Star' },
  { id: 'hexa', name: 'Hexa' },
] as const;

export const GAMES: GameInfo[] = [
  {
    id: 'quick-draw',
    name: 'Quick Draw',
    description: 'Draw prompts and guess what others drew. Fast rounds, big laughs.',
    minPlayers: 3,
    maxPlayers: 8,
    durationMinutes: '3-5',
    icon: 'pencil',
    color: 'from-violet-500 to-fuchsia-500',
  },
  {
    id: 'word-blitz',
    name: 'Word Blitz',
    description: 'Race to find words that match the category before time runs out.',
    minPlayers: 2,
    maxPlayers: 8,
    durationMinutes: '2-3',
    icon: 'text',
    color: 'from-cyan-500 to-blue-500',
  },
  {
    id: 'trivia-clash',
    name: 'Trivia Clash',
    description: 'Test your knowledge in rapid-fire trivia battles across categories.',
    minPlayers: 2,
    maxPlayers: 6,
    durationMinutes: '3-5',
    icon: 'brain',
    color: 'from-amber-500 to-orange-500',
  },
];
