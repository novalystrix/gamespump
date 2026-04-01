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
  catchupBonus?: boolean;
}

export interface TriviaReaction {
  id: string;
  playerId: string;
  emoji: string;
  at: number;
}

export interface TriviaGameState {
  type: 'trivia-clash';
  currentQuestion: number;
  questions: TriviaQuestion[];
  answers: Record<string, TriviaAnswer>; // playerId -> answer for current question
  scores: Record<string, number>; // playerId -> total score
  questionStartedAt: number;
  phase: 'question' | 'results' | 'leaderboard';
  reactions: TriviaReaction[];
}

// Memory Match types
export interface MemoryCard {
  id: number;
  symbol: string;
  flipped: boolean;
  matched: boolean;
  matchedBy: string | null;
}

export interface MemoryMatchGameState {
  type: 'memory-match';
  board: MemoryCard[];
  currentPlayerId: string;
  turnPhase: 'first-pick' | 'second-pick' | 'showing-result';
  firstPick: number | null;
  secondPick: number | null;
  scores: Record<string, number>;
  phase: 'playing' | 'leaderboard';
  showingResultUntil: number | null; // timestamp when result display ends
  turnStartedAt?: number; // timestamp when first card was flipped (for speed scoring)
}

// This or That types
export interface ThisOrThatRound {
  question: string;
  optionA: string;
  optionB: string;
  category: string;
}

export interface ThisOrThatGameState {
  type: 'this-or-that';
  currentRound: number;
  rounds: ThisOrThatRound[];
  answers: Record<string, 'A' | 'B'>;
  voteTimes: Record<string, number>; // playerId -> timestamp of vote
  scores: Record<string, number>;
  roundStartedAt: number;
  phase: 'voting' | 'results' | 'leaderboard';
}

// Speed Math types
export interface MathQuestion {
  problem: string;
  options: number[];
  correctIndex: number;
  difficulty: string;
}

export interface SpeedMathAnswer {
  answerIndex: number;
  answeredAt: number;
}

export interface SpeedMathGameState {
  type: 'speed-math';
  currentQuestion: number;
  questions: MathQuestion[];
  answers: Record<string, SpeedMathAnswer>;
  scores: Record<string, number>;
  questionStartedAt: number;
  phase: 'question' | 'results' | 'leaderboard';
}

// Word Blitz types
export interface WordBlitzGameState {
  type: 'word-blitz';
  currentRound: number;
  totalRounds: number;
  letters: string[];
  roundStartedAt: number;
  submittedWords: Record<string, string[]>; // playerId -> words submitted this round
  scores: Record<string, number>;
  phase: 'typing' | 'results' | 'leaderboard';
}

// Quick Draw types
export interface QuickDrawGameState {
  type: 'quick-draw';
  phase: 'drawing' | 'results' | 'leaderboard';
  currentRound: number;
  totalRounds: number;
  drawerOrder: string[]; // playerIds in drawing order
  roundWords: string[]; // one word per round (server-side only)
  wordPrompt: string; // current round word
  roundStartedAt: number;
  canvasData: string | null;
  guesses: Record<string, { guess: string; correct: boolean; guessedAt: number }>;
  correctGuessers: string[]; // playerIds in order of correct guess
  scores: Record<string, number>;
}

// Emoji Battle types
export interface EmojiBattleAnswer {
  index: number;
  correct: boolean;
  answeredAt: number;
}

export interface EmojiBattleGameState {
  type: 'emoji-battle';
  currentRound: number;
  totalRounds: number;
  targetEmoji: string;
  grid: string[];
  correctIndex: number;
  answers: Record<string, EmojiBattleAnswer>;
  scores: Record<string, number>;
  roundStartedAt: number;
  phase: 'playing' | 'results' | 'leaderboard';
  wrongGuesses: Record<string, boolean>;
}

// Reaction Speed types
export interface ReactionSpeedGameState {
  type: 'reaction-speed';
  currentRound: number;
  totalRounds: number;
  roundStartedAt: number;   // when the "wait" phase started
  greenAt: number;           // when the screen should turn green (roundStartedAt + random 2000-5000ms)
  reactions: Record<string, { reactedAt: number; falseStart: boolean }>; // playerId -> reaction
  scores: Record<string, number>;
  phase: 'waiting' | 'go' | 'results' | 'leaderboard';
}

// Lie Detector types
export interface LieDetectorGameState {
  type: 'lie-detector';
  currentRound: number;
  totalRounds: number;
  speakerOrder: string[]; // playerId rotation
  currentSpeakerId: string;
  prompt: string; // current round's prompt suggestion
  statement: string | null; // what the speaker typed
  speakerTruth: boolean | null; // true = statement is true, false = it's a lie (hidden from others)
  votes: Record<string, { vote: 'truth' | 'lie'; votedAt: number }>; // playerId -> vote
  scores: Record<string, number>;
  roundStartedAt: number;
  phase: 'statement' | 'voting' | 'reveal' | 'results' | 'leaderboard';
}

export type GameState = TriviaGameState | MemoryMatchGameState | ThisOrThatGameState | SpeedMathGameState | WordBlitzGameState | QuickDrawGameState | EmojiBattleGameState | ReactionSpeedGameState | LieDetectorGameState;

export interface Room {
  code: string;
  hostId: string;
  players: Player[];
  selectedGame: string | null;
  status: 'waiting' | 'playing' | 'finished';
  createdAt: number;
  lastActivity: number;
  gameState?: GameState;
  gameVotes?: Record<string, string>; // playerId -> gameId
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
  { id: 'bunny', name: 'Bunny' },
  { id: 'kitty', name: 'Kitty' },
  { id: 'bear', name: 'Bear' },
  { id: 'fox', name: 'Fox' },
  { id: 'panda', name: 'Panda' },
  { id: 'owl', name: 'Owl' },
  { id: 'hamster', name: 'Hamster' },
  { id: 'penguin', name: 'Penguin' },
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
  {
    id: 'memory-match',
    name: 'Memory Match',
    description: 'Flip cards and find matching pairs. Best memory wins!',
    minPlayers: 2,
    maxPlayers: 4,
    durationMinutes: '3-5',
    icon: 'grid',
    color: 'from-emerald-500 to-teal-500',
  },
  {
    id: 'this-or-that',
    name: 'This or That',
    description: 'Pick between two options. Match the majority to score!',
    minPlayers: 2,
    maxPlayers: 8,
    durationMinutes: '3-5',
    icon: 'split',
    color: 'from-pink-500 to-rose-500',
  },
  {
    id: 'speed-math',
    name: 'Speed Math',
    description: 'Race to solve math problems. Fastest correct answer wins!',
    minPlayers: 2,
    maxPlayers: 6,
    durationMinutes: '3-5',
    icon: 'calculator',
    color: 'from-blue-500 to-indigo-500',
  },
  {
    id: 'emoji-battle',
    name: 'Emoji Battle',
    description: 'Spot the matching emoji in a sea of look-alikes. Speed and accuracy win!',
    minPlayers: 2,
    maxPlayers: 8,
    durationMinutes: '2-3',
    icon: 'target',
    color: 'from-yellow-500 to-orange-500',
  },
  {
    id: 'reaction-speed',
    name: 'Reaction Speed',
    description: 'Wait for green, tap fast! Test your reflexes against friends.',
    minPlayers: 2,
    maxPlayers: 8,
    durationMinutes: '2-3',
    icon: 'zap',
    color: 'from-green-500 to-emerald-500',
  },
  {
    id: 'lie-detector',
    name: 'Lie Detector',
    description: 'One player speaks, the rest guess — truth or lie? Fool your friends to win!',
    minPlayers: 3,
    maxPlayers: 8,
    durationMinutes: '5-10',
    icon: 'eye',
    color: 'from-red-500 to-orange-500',
  },
];
