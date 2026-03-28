import { Room, Player, TriviaGameState } from './types';
import { getShuffledQuestions } from './trivia-questions';

// In-memory room store (server-side only)
const rooms = new Map<string, Room>();

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

export function startGame(code: string, hostId: string): Room | null {
  const room = getRoom(code);
  if (!room) return null;
  if (room.hostId !== hostId) return null;
  if (room.players.length < 2) return null;
  if (!room.selectedGame) return null;

  const questions = getShuffledQuestions(10);
  const scores: Record<string, number> = {};
  room.players.forEach(p => { scores[p.id] = 0; });

  room.status = 'playing';
  room.gameState = {
    currentQuestion: 0,
    questions,
    answers: {},
    scores,
    questionStartedAt: Date.now(),
    phase: 'question',
  };
  room.lastActivity = Date.now();
  return room;
}

export function submitAnswer(code: string, playerId: string, questionIndex: number, answerIndex: number): Room | null {
  const room = getRoom(code);
  if (!room || !room.gameState) return null;
  if (room.gameState.currentQuestion !== questionIndex) return null;
  if (room.gameState.phase !== 'question') return null;
  if (room.gameState.answers[playerId]) return null; // already answered

  room.gameState.answers[playerId] = {
    answerIndex,
    answeredAt: Date.now(),
  };

  // Calculate score if correct
  const question = room.gameState.questions[questionIndex];
  if (answerIndex === question.correctIndex) {
    const elapsed = Date.now() - room.gameState.questionStartedAt;
    const speedBonus = Math.max(0, Math.round(50 * (1 - elapsed / 15000)));
    room.gameState.scores[playerId] = (room.gameState.scores[playerId] || 0) + 100 + speedBonus;
  }

  // Check if all players have answered
  const allAnswered = room.players.every(p => room.gameState!.answers[p.id]);
  if (allAnswered) {
    room.gameState.phase = 'results';
  }

  room.lastActivity = Date.now();
  return room;
}

export function advanceQuestion(code: string): Room | null {
  const room = getRoom(code);
  if (!room || !room.gameState) return null;

  const gs = room.gameState;
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
  if (room.gameState.phase !== 'question') return null;
  room.gameState.phase = 'results';
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
