import { Room, Player } from './types';

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
