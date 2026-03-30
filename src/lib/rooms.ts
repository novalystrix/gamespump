import { Room, Player, TriviaGameState, TriviaAnswer, MemoryMatchGameState, ThisOrThatGameState, SpeedMathGameState, WordBlitzGameState, GameState } from './types';
import { getShuffledQuestions } from './trivia-questions';
import { getShuffledThisOrThatQuestions } from './this-or-that-questions';
import { generateMathQuestions } from './math-questions';

// In-memory room store (server-side only)
const rooms = new Map<string, Room>();

const MEMORY_SYMBOLS = ['star', 'heart', 'diamond', 'circle', 'triangle', 'square', 'moon', 'sun'];

function generateCode(): string {
  let code: string;
  do {
    code = Math.floor(1000 + Math.random() * 9000).toString();
  } while (rooms.has(code));
  return code;
}

function cleanExpiredRooms() {
  const oneHourAgo = Date.now() - 60 * 60 * 1000;
  rooms.forEach((room, code) => {
    if (room.lastActivity < oneHourAgo) {
      rooms.delete(code);
    }
  });
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function createRoom(hostId: string): Room {
  cleanExpiredRooms();
  const code = generateCode();
  const room: Room = {
    code,
    hostId,
    players: [],
    selectedGame: null,
    status: 'waiting',
    createdAt: Date.now(),
    lastActivity: Date.now(),
  };
  rooms.set(code, room);
  return room;
}

export function getRoom(code: string): Room | null {
  cleanExpiredRooms();
  const room = rooms.get(code);
  if (!room) return null;
  room.lastActivity = Date.now();
  return room;
}

export function joinRoom(code: string, player: Player): Room | null {
  const room = getRoom(code);
  if (!room) return null;
  
  // Remove existing player with same ID (rejoin)
  room.players = room.players.filter(p => p.id !== player.id);
  room.players.push(player);
  
  // If joining as host, update room's hostId to match new player ID
  if (player.isHost) {
    room.hostId = player.id;
  }
  
  room.lastActivity = Date.now();
  return room;
}

export function leaveRoom(code: string, playerId: string): Room | null {
  const room = getRoom(code);
  if (!room) return null;
  
  room.players = room.players.filter(p => p.id !== playerId);
  room.lastActivity = Date.now();
  
  // If host left, assign new host or delete room
  if (room.hostId === playerId) {
    if (room.players.length > 0) {
      room.hostId = room.players[0].id;
      room.players[0].isHost = true;
    } else {
      rooms.delete(code);
      return null;
    }
  }
  
  return room;
}

export function setSelectedGame(code: string, gameId: string): Room | null {
  const room = getRoom(code);
  if (!room) return null;
  room.selectedGame = gameId;
  room.lastActivity = Date.now();
  return room;
}

export function setPlayerReady(code: string, playerId: string, ready: boolean): Room | null {
  const room = getRoom(code);
  if (!room) return null;
  const player = room.players.find(p => p.id === playerId);
  if (player) player.isReady = ready;
  room.lastActivity = Date.now();
  return room;
}

// ===== MEMORY MATCH LOGIC =====

function initMemoryMatch(room: Room): MemoryMatchGameState {
  const pairs = shuffle(MEMORY_SYMBOLS);
  const cards = shuffle([...pairs, ...pairs].map((symbol, i) => ({
    id: i,
    symbol,
    flipped: false,
    matched: false,
    matchedBy: null as string | null,
  })));

  const scores: Record<string, number> = {};
  room.players.forEach(p => { scores[p.id] = 0; });

  return {
    type: 'memory-match',
    board: cards,
    currentPlayerId: room.players[0].id,
    turnPhase: 'first-pick',
    firstPick: null,
    secondPick: null,
    scores,
    phase: 'playing',
    showingResultUntil: null,
  };
}

export function flipCard(code: string, playerId: string, cardIndex: number): Room | null {
  const room = getRoom(code);
  if (!room || !room.gameState || room.gameState.type !== 'memory-match') return null;
  
  const gs = room.gameState as MemoryMatchGameState;
  if (gs.phase !== 'playing') return null;
  if (gs.currentPlayerId !== playerId) return null;
  if (gs.turnPhase === 'showing-result') return null;
  if (cardIndex < 0 || cardIndex >= gs.board.length) return null;
  
  const card = gs.board[cardIndex];
  if (card.flipped || card.matched) return null;

  if (gs.turnPhase === 'first-pick') {
    gs.board[cardIndex].flipped = true;
    gs.firstPick = cardIndex;
    gs.turnPhase = 'second-pick';
  } else if (gs.turnPhase === 'second-pick') {
    gs.board[cardIndex].flipped = true;
    gs.secondPick = cardIndex;
    gs.turnPhase = 'showing-result';
    gs.showingResultUntil = Date.now() + 1500;

    const firstCard = gs.board[gs.firstPick!];
    const secondCard = gs.board[cardIndex];

    if (firstCard.symbol === secondCard.symbol) {
      // Match found
      firstCard.matched = true;
      firstCard.matchedBy = playerId;
      secondCard.matched = true;
      secondCard.matchedBy = playerId;
      gs.scores[playerId] = (gs.scores[playerId] || 0) + 1;
    }
  }

  room.lastActivity = Date.now();
  return room;
}

export function advanceMemoryTurn(code: string): Room | null {
  const room = getRoom(code);
  if (!room || !room.gameState || room.gameState.type !== 'memory-match') return null;

  const gs = room.gameState as MemoryMatchGameState;
  if (gs.turnPhase !== 'showing-result') return null;

  const firstCard = gs.board[gs.firstPick!];
  const secondCard = gs.board[gs.secondPick!];
  const wasMatch = firstCard.matched;

  if (!wasMatch) {
    // Flip cards back
    firstCard.flipped = false;
    secondCard.flipped = false;
  }

  gs.firstPick = null;
  gs.secondPick = null;

  // Check if game is over
  const allMatched = gs.board.every(c => c.matched);
  if (allMatched) {
    gs.phase = 'leaderboard';
    room.status = 'finished';
  } else if (wasMatch) {
    // Same player gets another turn
    gs.turnPhase = 'first-pick';
  } else {
    // Next player
    const playerIds = room.players.map(p => p.id);
    const currentIdx = playerIds.indexOf(gs.currentPlayerId);
    gs.currentPlayerId = playerIds[(currentIdx + 1) % playerIds.length];
    gs.turnPhase = 'first-pick';
  }

  gs.showingResultUntil = null;
  room.lastActivity = Date.now();
  return room;
}

// ===== THIS OR THAT LOGIC =====

function initThisOrThat(room: Room): ThisOrThatGameState {
  const rounds = getShuffledThisOrThatQuestions(10);
  const scores: Record<string, number> = {};
  room.players.forEach(p => { scores[p.id] = 0; });

  return {
    type: 'this-or-that',
    currentRound: 0,
    rounds,
    answers: {},
    scores,
    roundStartedAt: Date.now(),
    phase: 'voting',
  };
}

export function submitVote(code: string, playerId: string, choice: 'A' | 'B'): Room | null {
  const room = getRoom(code);
  if (!room || !room.gameState || room.gameState.type !== 'this-or-that') return null;

  const gs = room.gameState as ThisOrThatGameState;
  if (gs.phase !== 'voting') return null;
  if (gs.answers[playerId]) return null; // already voted

  gs.answers[playerId] = choice;

  // Check if all players voted
  const allVoted = room.players.every(p => gs.answers[p.id]);
  if (allVoted) {
    // Calculate scores - majority wins
    let countA = 0, countB = 0;
    Object.values(gs.answers).forEach(v => { if (v === 'A') countA++; else countB++; });
    const majority: 'A' | 'B' = countA >= countB ? 'A' : 'B';
    
    // Award points to majority
    for (const [pid, vote] of Object.entries(gs.answers)) {
      if (vote === majority) {
        gs.scores[pid] = (gs.scores[pid] || 0) + 100;
      }
    }
    
    gs.phase = 'results';
  }

  room.lastActivity = Date.now();
  return room;
}

export function forceThisOrThatResults(code: string): Room | null {
  const room = getRoom(code);
  if (!room || !room.gameState || room.gameState.type !== 'this-or-that') return null;

  const gs = room.gameState as ThisOrThatGameState;
  if (gs.phase !== 'voting') return null;

  // Calculate with whoever voted
  let countA = 0, countB = 0;
  Object.values(gs.answers).forEach(v => { if (v === 'A') countA++; else countB++; });
  
  if (countA > 0 || countB > 0) {
    const majority: 'A' | 'B' = countA >= countB ? 'A' : 'B';
    for (const [pid, vote] of Object.entries(gs.answers)) {
      if (vote === majority) {
        gs.scores[pid] = (gs.scores[pid] || 0) + 100;
      }
    }
  }

  gs.phase = 'results';
  room.lastActivity = Date.now();
  return room;
}

export function advanceThisOrThatRound(code: string): Room | null {
  const room = getRoom(code);
  if (!room || !room.gameState || room.gameState.type !== 'this-or-that') return null;

  const gs = room.gameState as ThisOrThatGameState;
  const nextRound = gs.currentRound + 1;

  if (nextRound >= gs.rounds.length) {
    gs.phase = 'leaderboard';
    room.status = 'finished';
  } else {
    gs.currentRound = nextRound;
    gs.answers = {};
    gs.roundStartedAt = Date.now();
    gs.phase = 'voting';
  }

  room.lastActivity = Date.now();
  return room;
}

// ===== SPEED MATH LOGIC =====

function initSpeedMath(room: Room): SpeedMathGameState {
  const questions = generateMathQuestions(15);
  const scores: Record<string, number> = {};
  room.players.forEach(p => { scores[p.id] = 0; });

  return {
    type: 'speed-math',
    currentQuestion: 0,
    questions,
    answers: {},
    scores,
    questionStartedAt: Date.now(),
    phase: 'question',
  };
}

export function submitMathAnswer(code: string, playerId: string, questionIndex: number, answerIndex: number): Room | null {
  const room = getRoom(code);
  if (!room || !room.gameState || room.gameState.type !== 'speed-math') return null;

  const gs = room.gameState as SpeedMathGameState;
  if (gs.currentQuestion !== questionIndex) return null;
  if (gs.phase !== 'question') return null;
  if (gs.answers[playerId]) return null;

  gs.answers[playerId] = {
    answerIndex,
    answeredAt: Date.now(),
  };

  const question = gs.questions[questionIndex];
  if (answerIndex === question.correctIndex) {
    // Score based on speed rank
    const correctAnswers = Object.entries(gs.answers)
      .filter(([, a]) => a.answerIndex === question.correctIndex)
      .sort((a, b) => a[1].answeredAt - b[1].answeredAt);
    
    const rank = correctAnswers.findIndex(([pid]) => pid === playerId);
    const points = rank === 0 ? 150 : rank === 1 ? 100 : rank === 2 ? 50 : 25;
    gs.scores[playerId] = (gs.scores[playerId] || 0) + points;
  } else {
    // Wrong answer penalty
    gs.scores[playerId] = Math.max(0, (gs.scores[playerId] || 0) - 25);
  }

  // Check if all players answered
  const allAnswered = room.players.every(p => gs.answers[p.id]);
  if (allAnswered) {
    gs.phase = 'results';
  }

  room.lastActivity = Date.now();
  return room;
}

export function advanceMathQuestion(code: string): Room | null {
  const room = getRoom(code);
  if (!room || !room.gameState || room.gameState.type !== 'speed-math') return null;

  const gs = room.gameState as SpeedMathGameState;
  const nextQ = gs.currentQuestion + 1;

  if (nextQ >= gs.questions.length) {
    gs.phase = 'leaderboard';
    room.status = 'finished';
  } else {
    gs.currentQuestion = nextQ;
    gs.answers = {};
    gs.questionStartedAt = Date.now();
    gs.phase = 'question';
  }

  room.lastActivity = Date.now();
  return room;
}

export function forceMathResults(code: string): Room | null {
  const room = getRoom(code);
  if (!room || !room.gameState || room.gameState.type !== 'speed-math') return null;
  if (room.gameState.phase !== 'question') return null;
  room.gameState.phase = 'results';
  room.lastActivity = Date.now();
  return room;
}

// ===== WORD BLITZ LOGIC =====

const WORD_BLITZ_VOWELS = ['A', 'A', 'A', 'E', 'E', 'E', 'E', 'I', 'I', 'I', 'O', 'O', 'U', 'U'];
const WORD_BLITZ_CONSONANTS = ['B', 'C', 'D', 'D', 'F', 'G', 'H', 'H', 'L', 'L', 'L', 'M', 'M', 'N', 'N', 'N', 'P', 'R', 'R', 'R', 'S', 'S', 'S', 'T', 'T', 'T', 'V', 'W', 'Y'];

function generateWordBlitzLetters(): string[] {
  const vowelCount = Math.random() < 0.5 ? 2 : 3;
  const consonantCount = 7 - vowelCount;
  const vPool = shuffle([...WORD_BLITZ_VOWELS]);
  const cPool = shuffle([...WORD_BLITZ_CONSONANTS]);
  return shuffle([...vPool.slice(0, vowelCount), ...cPool.slice(0, consonantCount)]);
}

export function wordBlitzScore(word: string): number {
  const len = word.length;
  if (len < 3) return 0;
  if (len === 3) return 1;
  if (len === 4) return 2;
  if (len === 5) return 4;
  if (len === 6) return 8;
  return 16;
}

function wordUsesLetters(word: string, letters: string[]): boolean {
  const available = [...letters];
  for (const ch of word.toUpperCase()) {
    const idx = available.indexOf(ch);
    if (idx === -1) return false;
    available.splice(idx, 1);
  }
  return true;
}

function initWordBlitz(room: Room): WordBlitzGameState {
  const scores: Record<string, number> = {};
  const submittedWords: Record<string, string[]> = {};
  room.players.forEach(p => {
    scores[p.id] = 0;
    submittedWords[p.id] = [];
  });
  return {
    type: 'word-blitz',
    currentRound: 0,
    totalRounds: 3,
    letters: generateWordBlitzLetters(),
    roundStartedAt: Date.now(),
    submittedWords,
    scores,
    phase: 'typing',
  };
}

export function submitWordBlitzWord(
  code: string,
  playerId: string,
  word: string,
  roundIndex: number
): { success: boolean; pointsGained: number; error?: string } {
  const room = getRoom(code);
  if (!room || !room.gameState || room.gameState.type !== 'word-blitz') {
    return { success: false, pointsGained: 0, error: 'Room or game not found' };
  }
  const gs = room.gameState as WordBlitzGameState;
  if (gs.phase !== 'typing') return { success: false, pointsGained: 0, error: 'Not in typing phase' };
  if (gs.currentRound !== roundIndex) return { success: false, pointsGained: 0, error: 'Wrong round' };

  const upper = word.toUpperCase().trim();
  if (upper.length < 3) return { success: false, pointsGained: 0, error: 'Too short' };
  if (!wordUsesLetters(upper, gs.letters)) return { success: false, pointsGained: 0, error: 'Invalid letters' };

  if (!gs.submittedWords[playerId]) gs.submittedWords[playerId] = [];
  if (gs.submittedWords[playerId].includes(upper)) return { success: false, pointsGained: 0, error: 'Already submitted' };

  const points = wordBlitzScore(upper);
  gs.submittedWords[playerId].push(upper);
  gs.scores[playerId] = (gs.scores[playerId] || 0) + points;

  room.lastActivity = Date.now();
  return { success: true, pointsGained: points };
}

export function forceWordBlitzResults(code: string): Room | null {
  const room = getRoom(code);
  if (!room || !room.gameState || room.gameState.type !== 'word-blitz') return null;
  const gs = room.gameState as WordBlitzGameState;
  if (gs.phase !== 'typing') return null;
  gs.phase = 'results';
  room.lastActivity = Date.now();
  return room;
}

export function advanceWordBlitzRound(code: string): Room | null {
  const room = getRoom(code);
  if (!room || !room.gameState || room.gameState.type !== 'word-blitz') return null;
  const gs = room.gameState as WordBlitzGameState;
  if (gs.phase !== 'results') return null;

  const nextRound = gs.currentRound + 1;
  if (nextRound >= gs.totalRounds) {
    gs.phase = 'leaderboard';
    room.status = 'finished';
  } else {
    gs.currentRound = nextRound;
    gs.letters = generateWordBlitzLetters();
    gs.roundStartedAt = Date.now();
    const submittedWords: Record<string, string[]> = {};
    room.players.forEach(p => { submittedWords[p.id] = []; });
    gs.submittedWords = submittedWords;
    gs.phase = 'typing';
  }

  room.lastActivity = Date.now();
  return room;
}

// ===== COMMON =====

export function startGame(code: string, hostId: string): Room | null {
  const room = getRoom(code);
  if (!room) return null;
  // Check if player is host (by hostId OR isHost flag)
  const isHost = room.hostId === hostId || room.players.some(p => p.id === hostId && p.isHost);
  if (!isHost) return null;
  if (room.players.length < 2) return null;
  if (!room.selectedGame) return null;

  let gameState: GameState;

  switch (room.selectedGame) {
    case 'trivia-clash': {
      const questions = getShuffledQuestions(10);
      const scores: Record<string, number> = {};
      room.players.forEach(p => { scores[p.id] = 0; });
      gameState = {
        type: 'trivia-clash',
        currentQuestion: 0,
        questions,
        answers: {},
        scores,
        questionStartedAt: Date.now(),
        phase: 'question',
        reactions: [],
      };
      break;
    }
    case 'memory-match':
      gameState = initMemoryMatch(room);
      break;
    case 'this-or-that':
      gameState = initThisOrThat(room);
      break;
    case 'speed-math':
      gameState = initSpeedMath(room);
      break;
    case 'word-blitz':
      gameState = initWordBlitz(room);
      break;
    default:
      return null;
  }

  room.status = 'playing';
  room.gameState = gameState;
  room.lastActivity = Date.now();
  return room;
}

export function submitAnswer(code: string, playerId: string, questionIndex: number, answerIndex: number): Room | null {
  const room = getRoom(code);
  if (!room || !room.gameState) return null;
  
  // Handle trivia-clash
  if (room.gameState.type !== 'trivia-clash') return null;
  const gs = room.gameState as TriviaGameState;
  
  if (gs.currentQuestion !== questionIndex) return null;
  if (gs.phase !== 'question') return null;
  if (gs.answers[playerId]) return null;

  // Catch-up bonus: 1.5x points if trailing the leader by 3+ points
  const otherScores = Object.entries(gs.scores)
    .filter(([id]) => id !== playerId)
    .map(([, score]) => score);
  const maxOtherScore = otherScores.length > 0 ? Math.max(...otherScores) : 0;
  const playerScore = gs.scores[playerId] || 0;
  const isBehind = maxOtherScore - playerScore >= 3;

  const question = gs.questions[questionIndex];
  const answer: TriviaAnswer = { answerIndex, answeredAt: Date.now() };

  if (answerIndex === question.correctIndex) {
    const elapsed = Date.now() - gs.questionStartedAt;
    const speedBonus = Math.max(0, Math.round(50 * (1 - elapsed / 15000)));
    let points = 100 + speedBonus;
    if (isBehind) {
      points = Math.round(points * 1.5);
      answer.catchupBonus = true;
    }
    gs.scores[playerId] = playerScore + points;
  }

  gs.answers[playerId] = answer;

  const allAnswered = room.players.every(p => gs.answers[p.id]);
  if (allAnswered) {
    gs.phase = 'results';
  }

  room.lastActivity = Date.now();
  return room;
}

export function advanceQuestion(code: string): Room | null {
  const room = getRoom(code);
  if (!room || !room.gameState) return null;
  
  if (room.gameState.type !== 'trivia-clash') return null;
  const gs = room.gameState as TriviaGameState;

  const nextQ = gs.currentQuestion + 1;

  if (nextQ >= gs.questions.length) {
    gs.phase = 'leaderboard';
    room.status = 'finished';
  } else {
    gs.currentQuestion = nextQ;
    gs.answers = {};
    gs.questionStartedAt = Date.now();
    gs.phase = 'question';
  }

  room.lastActivity = Date.now();
  return room;
}

export function forceResults(code: string): Room | null {
  const room = getRoom(code);
  if (!room || !room.gameState) return null;
  
  if (room.gameState.type === 'trivia-clash') {
    if (room.gameState.phase !== 'question') return null;
    room.gameState.phase = 'results';
  }
  
  room.lastActivity = Date.now();
  return room;
}

export function resetToLobby(code: string): Room | null {
  const room = getRoom(code);
  if (!room) return null;
  room.status = 'waiting';
  room.gameState = undefined;
  room.lastActivity = Date.now();
  return room;
}

export function addReaction(code: string, playerId: string, emoji: string): Room | null {
  const room = getRoom(code);
  if (!room || !room.gameState || room.gameState.type !== 'trivia-clash') return null;
  const gs = room.gameState as TriviaGameState;

  const fiveSecsAgo = Date.now() - 5000;
  gs.reactions = gs.reactions.filter(r => r.at > fiveSecsAgo);
  gs.reactions.push({ id: `${playerId}_${Date.now()}`, playerId, emoji, at: Date.now() });

  room.lastActivity = Date.now();
  return room;
}
